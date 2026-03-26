import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { queryTable, updateRecord, ONBOARDING_TABLE } from "@/lib/servicenow";
import { saveSurvey, getSurveyByEmployee, findMentorsByDepartment } from "@/lib/engee-store";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function calcAttritionRisk(employee: Record<string, unknown>) {
  const reasons: string[] = [];
  let score = 0;
  const status = String(employee.onboarding_status ?? "");
  const days   = daysSince(String(employee.start_date ?? ""));
  const tasksComplete = [
    employee.equipment_requested, employee.it_account_created,
    employee.workspace_assigned,  employee.orientation_completed,
    employee.documents_completed, employee.employee_training,
  ].filter((v) => v === true || v === "true").length;

  if (status === "on_hold")                          { score += 40; reasons.push("Onboarding is on hold"); }
  if (status === "pending" && days > 7)              { score += 25; reasons.push("Onboarding still pending after 7 days"); }
  if (tasksComplete < 3 && days > 14)                { score += 20; reasons.push(`Only ${tasksComplete}/6 tasks done after 14 days`); }
  if (days >= 25 && days <= 35 && tasksComplete < 5) { score += 15; reasons.push("Approaching 30-day milestone with incomplete tasks"); }
  if (days >= 55 && days <= 65 && status !== "completed") { score += 15; reasons.push("Approaching 60-day milestone, onboarding not completed"); }

  return {
    level: score >= 40 ? "high" : score >= 20 ? "medium" : "low" as "low" | "medium" | "high",
    score, reasons,
  };
}

// ── Platform integrations ────────────────────────────────────────────────────

async function sendTeamsMessage(webhookUrl: string, payload: object): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch { return false; }
}

async function sendSlackMessage(token: string, channel: string, text: string): Promise<boolean> {
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel, text }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch { return false; }
}

// ── Tool definitions ─────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "get_employee_engagement",
    description: "Get a new employee's engagement profile — days employed, onboarding progress, attrition risk, upcoming milestones, and submitted interests survey.",
    input_schema: {
      type: "object" as const,
      properties: { employee_name: { type: "string", description: "Employee full name or partial name" } },
      required: ["employee_name"],
    },
  },
  {
    name: "get_team_engagement_summary",
    description: "Get a full new hire engagement overview — attrition risk counts, who hasn't submitted their survey, and upcoming milestone check-ins.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "submit_interest_survey",
    description: "Save a new employee's interest survey — professional interests, personal hobbies, 90-day goals, questions for mentor, and preferred platform.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name:          { type: "string" },
        department:             { type: "string" },
        professional_interests: { type: "array", items: { type: "string" } },
        personal_interests:     { type: "array", items: { type: "string" } },
        goals_90_days:          { type: "string" },
        questions_for_mentor:   { type: "string" },
        preferred_platform:     { type: "string", enum: ["teams", "slack"] },
        preferred_meeting_time: { type: "string", enum: ["morning", "afternoon", "flexible"] },
      },
      required: ["employee_name", "department", "professional_interests", "personal_interests", "goals_90_days", "questions_for_mentor", "preferred_platform", "preferred_meeting_time"],
    },
  },
  {
    name: "find_mentor_match",
    description: "Find a mentor match for a new employee based on their department and submitted interests survey.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string" },
        department:    { type: "string" },
      },
      required: ["employee_name", "department"],
    },
  },
  {
    name: "schedule_coffee_chat",
    description: "Send a coffee chat / mentor meeting request via Microsoft Teams or Slack on behalf of a new employee.",
    input_schema: {
      type: "object" as const,
      properties: {
        platform:                { type: "string", enum: ["teams", "slack"] },
        mentor_contact:          { type: "string", description: "Slack user/channel ID or Teams channel for the mentor" },
        employee_name:           { type: "string" },
        employee_interests:      { type: "string", description: "Summary of employee interests" },
        meeting_time_preference: { type: "string", enum: ["morning", "afternoon", "flexible"] },
      },
      required: ["platform", "mentor_contact", "employee_name", "employee_interests"],
    },
  },
  {
    name: "add_engagement_note",
    description: "Save an engagement check-in note to a new employee's onboarding record.",
    input_schema: {
      type: "object" as const,
      properties: {
        sys_id: { type: "string" },
        note:   { type: "string" },
      },
      required: ["sys_id", "note"],
    },
  },
  {
    name: "flag_attrition_risk",
    description: "Flag a new employee as an early attrition risk and document the reason.",
    input_schema: {
      type: "object" as const,
      properties: {
        sys_id: { type: "string" },
        reason: { type: "string" },
      },
      required: ["sys_id", "reason"],
    },
  },
];

// ── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === "get_employee_engagement") {
      const employee_name = String(input.employee_name);
      const records = await queryTable(ONBOARDING_TABLE, {
        sysparm_query: `employee_nameLIKE${employee_name}`,
        sysparm_display_value: true,
        sysparm_limit: 1,
      });
      if (records.length === 0) return `No employee found matching "${employee_name}".`;

      const emp    = records[0];
      const days   = daysSince(String(emp.start_date ?? ""));
      const risk   = calcAttritionRisk(emp);
      const survey = getSurveyByEmployee(String(emp.employee_name ?? employee_name));
      const upcomingMilestone =
        days >= 25 && days <= 35 ? "30-day check-in" :
        days >= 55 && days <= 65 ? "60-day check-in" :
        days >= 85 && days <= 95 ? "90-day check-in" : null;

      return JSON.stringify({
        name: emp.employee_name, department: emp.department,
        position: emp.position,  start_date: emp.start_date,
        days_employed: days,     onboarding_status: emp.onboarding_status,
        attrition_risk: risk.level, risk_score: risk.score, risk_reasons: risk.reasons,
        upcoming_milestone: upcomingMilestone,
        survey_submitted: !!survey, interests: survey ?? null,
        sys_id: emp.sys_id,
      }, null, 2);
    }

    if (name === "get_team_engagement_summary") {
      const records = await queryTable(ONBOARDING_TABLE, { sysparm_display_value: true, sysparm_limit: 50 });
      const summary = records.map((emp) => {
        const days = daysSince(String(emp.start_date ?? ""));
        const risk = calcAttritionRisk(emp);
        return { name: emp.employee_name, department: emp.department, days_employed: days, status: emp.onboarding_status, attrition_risk: risk.level, survey_submitted: !!getSurveyByEmployee(String(emp.employee_name ?? "")) };
      });
      const highRisk = summary.filter(e => e.attrition_risk === "high");
      const noSurvey = summary.filter(e => !e.survey_submitted);
      const milestones = records.filter(emp => { const d = daysSince(String(emp.start_date ?? "")); return (d >= 25 && d <= 35) || (d >= 55 && d <= 65) || (d >= 85 && d <= 95); });
      return JSON.stringify({
        total_new_employees: records.length,
        risk_overview: { high: highRisk.length, medium: summary.filter(e => e.attrition_risk === "medium").length, low: summary.filter(e => e.attrition_risk === "low").length },
        employees_without_survey: noSurvey.map(e => e.name),
        high_risk_employees: highRisk,
        upcoming_milestone_checkins: milestones.map(e => ({ name: e.employee_name, days: daysSince(String(e.start_date ?? "")) })),
      }, null, 2);
    }

    if (name === "submit_interest_survey") {
      const record = saveSurvey({
        employee_name:          String(input.employee_name),
        department:             String(input.department),
        professional_interests: input.professional_interests as string[],
        personal_interests:     input.personal_interests as string[],
        goals_90_days:          String(input.goals_90_days),
        questions_for_mentor:   String(input.questions_for_mentor),
        preferred_platform:     input.preferred_platform as "teams" | "slack",
        preferred_meeting_time: input.preferred_meeting_time as "morning" | "afternoon" | "flexible",
      });
      return `Interest survey saved for ${input.employee_name}! Survey ID: ${record.id}. Ready to find a mentor.`;
    }

    if (name === "find_mentor_match") {
      const employee_name = String(input.employee_name);
      const department    = String(input.department);
      const survey  = getSurveyByEmployee(employee_name);
      const mentors = findMentorsByDepartment(department);

      if (mentors.length === 0) return JSON.stringify({ message: "No mentors found in this department.", employee_interests: survey });

      const mentor = mentors[0];
      return JSON.stringify({
        suggested_mentor: { name: mentor.name, title: mentor.title, department: mentor.department, email: mentor.email, slack_id: mentor.slack_id, bio: mentor.bio },
        employee_name,
        employee_interests: survey ? { professional: survey.professional_interests, personal: survey.personal_interests, goals: survey.goals_90_days } : null,
        match_reason: `Same department (${department}) — best positioned to guide ${employee_name} through their first 90 days`,
        other_available_mentors: mentors.slice(1).map(m => ({ name: m.name, title: m.title })),
      }, null, 2);
    }

    if (name === "schedule_coffee_chat") {
      const { platform, mentor_contact, employee_name, employee_interests, meeting_time_preference } = input as Record<string, string>;
      const teamsWebhook = process.env.TEAMS_WEBHOOK_URL;
      const slackToken   = process.env.SLACK_BOT_TOKEN;

      if (platform === "teams") {
        if (!teamsWebhook) return "Teams webhook URL not configured. Add TEAMS_WEBHOOK_URL to .env.local.";
        const ok = await sendTeamsMessage(teamsWebhook, {
          type: "message",
          attachments: [{
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
              type: "AdaptiveCard", version: "1.4",
              body: [
                { type: "TextBlock", text: "☕ Coffee Chat Request", weight: "Bolder", size: "Large", color: "Accent" },
                { type: "TextBlock", text: `**${employee_name}** just joined the team and is looking for a mentor!`, wrap: true },
                { type: "FactSet", facts: [
                  { title: "Interests", value: employee_interests },
                  { title: "Preferred time", value: meeting_time_preference || "Flexible" },
                  { title: "Requested by", value: "Haigent Engee" },
                ]},
                { type: "TextBlock", text: `Could you find a 30-minute slot to connect with ${employee_name}?`, wrap: true, spacing: "Medium" },
              ],
              actions: [{ type: "Action.OpenUrl", title: "Open Calendar", url: "https://outlook.office.com/calendar" }],
            },
          }],
        });
        return ok
          ? `Microsoft Teams message sent! ${employee_name}'s coffee chat request has been posted.`
          : "Failed to send Teams message. Check TEAMS_WEBHOOK_URL.";
      }

      if (platform === "slack") {
        if (!slackToken) return "Slack bot token not configured. Add SLACK_BOT_TOKEN to .env.local.";
        const ok = await sendSlackMessage(slackToken, mentor_contact,
          `*Coffee Chat Request — ${employee_name}*\n\nHi <@${mentor_contact}>! ${employee_name} just joined and would love to connect.\n*Interests:* ${employee_interests}\n*Preferred time:* ${meeting_time_preference || "Flexible"}`
        );
        return ok ? `Slack message sent to ${mentor_contact}!` : "Failed to send Slack message. Check SLACK_BOT_TOKEN.";
      }

      return "Unknown platform. Specify 'teams' or 'slack'.";
    }

    if (name === "add_engagement_note") {
      const timestamp = new Date().toISOString().split("T")[0];
      await updateRecord(ONBOARDING_TABLE, String(input.sys_id), { notes: `[Engee ${timestamp}] ${input.note}` });
      return `Engagement note saved: "${input.note}"`;
    }

    if (name === "flag_attrition_risk") {
      const timestamp = new Date().toISOString().split("T")[0];
      await updateRecord(ONBOARDING_TABLE, String(input.sys_id), {
        notes: `[ATTRITION RISK ${timestamp}] ${input.reason}`,
        onboarding_status: "on_hold",
      });
      return `Employee flagged as attrition risk. Reason: "${input.reason}". Status set to on_hold.`;
    }

    return `Unknown tool: ${name}`;
  } catch (error) {
    return `Tool error: ${String(error)}`;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Engee, an AI agent specialized in engagement with new employees for Haigent.

"Engee" = Engagement with New Employees. Your mission is to ensure every new hire feels welcomed, connected, and set up for success in their first 90 days.

Core capabilities:
1. INTEREST SURVEY — Conversationally guide new employees through sharing interests and goals, then save with submit_interest_survey.
2. MENTOR MATCHING — Use find_mentor_match to suggest the right mentor based on department and interests.
3. COFFEE CHAT SCHEDULING — Send meeting requests via Teams or Slack using schedule_coffee_chat.
4. ENGAGEMENT MONITORING — Track milestone check-ins, attrition risk, and team health.

When an employee has just completed the interest survey form, immediately use find_mentor_match to suggest a match.
Always be warm, encouraging, and people-first. New employees can be nervous — help them feel welcome.
For HR managers asking for team overviews, be concise and action-oriented.`;

// ── API Route ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Anthropic.MessageParam[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    let currentMessages = [...messages];
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools,
        messages: currentMessages,
      });

      if (response.stop_reason === "end_turn") {
        const textContent = response.content
          .filter((c): c is Anthropic.TextBlock => c.type === "text")
          .map((c) => c.text)
          .join("\n");

        return NextResponse.json({
          response: textContent,
          messages: [...currentMessages, { role: "assistant", content: response.content }],
        });
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
        );

        currentMessages = [...currentMessages, { role: "assistant", content: response.content }];

        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (toolUse) => ({
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: await executeTool(toolUse.name, toolUse.input as Record<string, unknown>),
          }))
        );

        currentMessages = [...currentMessages, { role: "user", content: toolResults }];
        continue;
      }

      break;
    }

    return NextResponse.json({ error: "Max iterations reached" }, { status: 500 });
  } catch (error) {
    console.error("Engee chat error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
