import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  SystemMessage, HumanMessage, AIMessage, ToolMessage, BaseMessage,
} from "@langchain/core/messages";
import {
  saveSurvey, getSurveyByEmployee, getAllSurveys,
  findMentorsByDepartment, findMentorByName,
  addNoteToSurvey, flagAttritionRisk,
} from "@/lib/engee-store";
import { findAvailableMeetingSlots, formatSlotsForDisplay } from "@/lib/calendar";

// Local Anthropic wire-format types (frontend ↔ API conversion only)
type TextBlock       = { type: "text"; text: string };
type ToolUseBlock    = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string | { type: string; text: string }[] };
type ContentBlock    = TextBlock | ToolUseBlock;
type ContentBlockParam = TextBlock | ToolResultBlock;
type MessageParam    = { role: "user" | "assistant"; content: string | (ContentBlock | ContentBlockParam)[] };

// ── Platform helpers ─────────────────────────────────────────────────────────

async function sendTeamsMessage(webhookUrl: string, payload: object): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch { return false; }
}

async function sendSlackWebhook(webhookUrl: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `payload=${encodeURIComponent(JSON.stringify({ text }))}`,
    });
    return (await res.text()) === "ok";
  } catch { return false; }
}

// ── Tools ────────────────────────────────────────────────────────────────────

const getEmployeeEngagement = new DynamicStructuredTool({
  name: "get_employee_engagement",
  description: "Get a new employee's engagement profile — survey data, interests, goals, and attrition flag.",
  schema: z.object({ employee_name: z.string().describe("Employee full name or partial name") }),
  func: async ({ employee_name }) => {
    const survey = getSurveyByEmployee(employee_name);
    if (!survey) return `No survey found for "${employee_name}". They may not have completed the interest survey yet.`;
    const daysSinceSubmit = Math.floor((Date.now() - new Date(survey.submitted_at).getTime()) / 86_400_000);
    return JSON.stringify({
      name: survey.employee_name, role: survey.role, department: survey.department,
      location: `${survey.city}, ${survey.country}`,
      survey_submitted: true, submitted_at: survey.submitted_at, days_since_survey: daysSinceSubmit,
      professional_interests: survey.professional_interests, learning_interests: survey.learning_interests,
      personal_interests: survey.personal_interests, goals_90_days: survey.goals_90_days,
      questions_for_mentor: survey.questions_for_mentor, preferred_platform: survey.preferred_platform,
      attrition_flagged: survey.attrition_flagged, attrition_reason: survey.attrition_reason ?? null,
      notes: survey.notes,
    }, null, 2);
  },
});

const getTeamEngagementSummary = new DynamicStructuredTool({
  name: "get_team_engagement_summary",
  description: "Get a full new hire engagement overview — who has submitted surveys, attrition flags, and team health.",
  schema: z.object({}),
  func: async () => {
    const all = getAllSurveys();
    if (all.length === 0) return "No surveys have been submitted yet.";
    const flagged = all.filter(s => s.attrition_flagged);
    return JSON.stringify({
      total_employees_surveyed: all.length,
      flagged_at_risk: flagged.length,
      flagged_employees: flagged.map(s => ({ name: s.employee_name, reason: s.attrition_reason })),
      all_employees: all.map(s => ({
        name: s.employee_name, department: s.department, role: s.role,
        submitted_at: s.submitted_at, attrition_flagged: s.attrition_flagged,
        preferred_platform: s.preferred_platform,
      })),
    }, null, 2);
  },
});

const submitInterestSurvey = new DynamicStructuredTool({
  name: "submit_interest_survey",
  description: "Save a new employee's interest survey — professional interests, personal hobbies, 90-day goals, and preferred platform.",
  schema: z.object({
    employee_name: z.string(), role: z.string(), department: z.string(),
    city: z.string(), country: z.string(),
    professional_interests: z.array(z.string()), learning_interests: z.array(z.string()).optional(),
    personal_interests: z.array(z.string()), work_style: z.array(z.string()).optional(),
    communication_style: z.array(z.string()).optional(), motivations: z.array(z.string()).optional(),
    personality_traits: z.array(z.string()).optional(), career_stage: z.string().optional(),
    peak_productivity: z.string().optional(), food_preferences: z.array(z.string()).optional(),
    weekend_style: z.array(z.string()).optional(), conversation_topics: z.array(z.string()).optional(),
    life_situation: z.array(z.string()).optional(), goals_90_days: z.string(),
    questions_for_mentor: z.string(),
    preferred_platform: z.enum(["teams", "slack"]),
    preferred_meeting_time: z.enum(["morning", "afternoon", "flexible"]),
  }),
  func: async (i) => {
    const record = saveSurvey({
      employee_name: i.employee_name, role: i.role, department: i.department,
      city: i.city, country: i.country,
      professional_interests: i.professional_interests, learning_interests: i.learning_interests ?? [],
      personal_interests: i.personal_interests, work_style: i.work_style ?? [],
      communication_style: i.communication_style ?? [], motivations: i.motivations ?? [],
      personality_traits: i.personality_traits ?? [], career_stage: i.career_stage ?? "",
      peak_productivity: i.peak_productivity ?? "", food_preferences: i.food_preferences ?? [],
      weekend_style: i.weekend_style ?? [], conversation_topics: i.conversation_topics ?? [],
      life_situation: i.life_situation ?? [], goals_90_days: i.goals_90_days,
      questions_for_mentor: i.questions_for_mentor,
      preferred_platform: i.preferred_platform,
      preferred_meeting_time: i.preferred_meeting_time,
    });
    return `Interest survey saved for ${i.employee_name}! Survey ID: ${record.id}. Ready to find a mentor.`;
  },
});

const findMentorMatchTool = new DynamicStructuredTool({
  name: "find_mentor_match",
  description: "Find a mentor match for a new employee based on their department and submitted interests survey.",
  schema: z.object({ employee_name: z.string(), department: z.string() }),
  func: async ({ employee_name, department }) => {
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
  },
});

const findMentorByNameTool = new DynamicStructuredTool({
  name: "find_mentor_by_name",
  description: "Look up a mentor's contact details (Slack ID, Teams ID, email, bio) by their name.",
  schema: z.object({ mentor_name: z.string().describe("Full or partial name of the mentor") }),
  func: async ({ mentor_name }) => {
    const mentor = findMentorByName(mentor_name);
    if (!mentor) return `No mentor found matching "${mentor_name}". Available mentors: Sahib Badwal, Siddharth Maheshwari, Love Patel, Rose Vermazen, Swati Sood, Videesh Guduru, Oisin Bates, Zilai Feng, Gabriel Brock, Ahsaan Rizvi.`;
    return JSON.stringify({ name: mentor.name, title: mentor.title, department: mentor.department, email: mentor.email, slack_id: mentor.slack_id, teams_id: mentor.teams_id, bio: mentor.bio }, null, 2);
  },
});

const findAvailableMeetingSlotsTool = new DynamicStructuredTool({
  name: "find_available_meeting_slots",
  description: "Check both the employee's and mentor's Microsoft 365 calendars and return 3 available 30-minute slots.",
  schema: z.object({
    employee_email: z.string().describe("New employee's Microsoft 365 / Outlook email address"),
    mentor_name: z.string().describe("Mentor's name — email is looked up from the roster"),
    time_preference: z.enum(["morning", "afternoon", "flexible"]).optional(),
  }),
  func: async ({ employee_email, mentor_name, time_preference }) => {
    const mentor = findMentorByName(mentor_name);
    if (!mentor) return `No mentor found matching "${mentor_name}".`;
    if (!mentor.email) return `No email on file for mentor ${mentor.name}.`;
    const { slots, source } = await findAvailableMeetingSlots({
      employeeEmail: employee_email,
      mentorEmail: mentor.email,
      timePreference: (time_preference ?? "flexible") as "morning" | "afternoon" | "flexible",
    });
    return JSON.stringify({
      employee_email, mentor_name: mentor.name, mentor_email: mentor.email,
      suggested_slots: slots, display: formatSlotsForDisplay(slots),
      source: source === "mock"
        ? "Suggested slots (live calendar sync available once Microsoft Azure app is configured)"
        : "Live availability from Microsoft 365 calendar",
    }, null, 2);
  },
});

const scheduleCoffeeChatTool = new DynamicStructuredTool({
  name: "schedule_coffee_chat",
  description: "Send a coffee chat / mentor meeting request via Microsoft Teams or Slack on behalf of a new employee.",
  schema: z.object({
    platform: z.enum(["teams", "slack"]),
    mentor_contact: z.string().describe("Slack user/channel ID or Teams UPN for the mentor"),
    mentor_name: z.string(), employee_name: z.string(),
    employee_professional_interests: z.string(), employee_personal_interests: z.string(),
    meeting_time_preference: z.enum(["morning", "afternoon", "flexible"]).optional(),
    suggested_slots: z.array(z.string()).optional().describe("Up to 3 suggested meeting times"),
  }),
  func: async ({ platform, mentor_contact, mentor_name, employee_name, employee_professional_interests, employee_personal_interests, meeting_time_preference, suggested_slots }) => {
    const slots = suggested_slots ?? [];
    const teamsWebhook = process.env.TEAMS_WEBHOOK_URL;
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;

    if (platform === "teams") {
      if (!teamsWebhook) return "Teams webhook URL not configured. Add TEAMS_WEBHOOK_URL to .env.local.";
      const mentorRecord = findMentorByName(mentor_name);
      const teamsUserId = mentorRecord?.teams_id ?? mentor_contact;
      const slotsBlock = slots.length > 0 ? [
        { type: "TextBlock", text: "📅 Suggested times (30 min each):", weight: "Bolder", spacing: "Medium" },
        { type: "FactSet", facts: slots.map((slot, i) => ({ title: `Option ${i + 1}`, value: slot })) },
      ] : [];
      const ok = await sendTeamsMessage(teamsWebhook, {
        type: "message",
        attachments: [{
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard", version: "1.4",
            msteams: { entities: [{ type: "mention", text: `<at>${mentor_name}</at>`, mentioned: { id: teamsUserId, name: mentor_name } }] },
            body: [
              { type: "TextBlock", text: "☕ Coffee Chat Request", weight: "Bolder", size: "Large", color: "Accent" },
              { type: "TextBlock", text: `Hi <at>${mentor_name}</at>! **${employee_name}** just joined the team and would love to connect with you.`, wrap: true },
              { type: "FactSet", facts: [
                { title: "New hire", value: employee_name }, { title: "Mentor", value: mentor_name },
                { title: "Professional interests", value: employee_professional_interests },
                { title: "Personal interests", value: employee_personal_interests },
                { title: "Preferred time", value: meeting_time_preference ?? "Flexible" },
                { title: "Requested by", value: "Haigent Engee" },
              ]},
              ...slotsBlock,
              { type: "TextBlock", text: slots.length > 0 ? `Please confirm one of the suggested times to connect with ${employee_name}!` : `Could you find a 30-minute slot to connect with ${employee_name}?`, wrap: true, spacing: "Medium" },
            ],
            actions: [{ type: "Action.OpenUrl", title: "Open Calendar", url: "https://outlook.office.com/calendar" }],
          },
        }],
      });
      return ok ? `Microsoft Teams message sent! ${employee_name}'s coffee chat request has been posted.` : "Failed to send Teams message. Check TEAMS_WEBHOOK_URL.";
    }

    if (platform === "slack") {
      if (!slackWebhook) return "Slack webhook URL not configured. Add SLACK_WEBHOOK_URL to .env.local.";
      const slotsText = slots.length > 0
        ? `\n\n📅 *Suggested times (30 min each):*\n${slots.map((s, i) => `• Option ${i + 1}: ${s}`).join("\n")}`
        : "";
      const ok = await sendSlackWebhook(slackWebhook,
        `☕ *Coffee Chat Request*\n\nHi <@${mentor_contact}>! *${employee_name}* just joined the team and would love to connect with you.\n\n*New hire:* ${employee_name}\n*Mentor:* ${mentor_name}\n*Professional interests:* ${employee_professional_interests}\n*Personal interests:* ${employee_personal_interests}\n*Preferred time:* ${meeting_time_preference ?? "Flexible"}${slotsText}\n\n${slots.length > 0 ? "Please confirm one of the suggested times!" : "Could you find a 30-minute slot to connect?"}`
      );
      return ok ? `Slack message posted! ${mentor_name} has been notified.` : "Failed to send Slack message. Check SLACK_WEBHOOK_URL.";
    }

    return "Unknown platform. Specify 'teams' or 'slack'.";
  },
});

const addEngagementNoteTool = new DynamicStructuredTool({
  name: "add_engagement_note",
  description: "Save an engagement check-in note to a new employee's survey record.",
  schema: z.object({ employee_name: z.string(), note: z.string() }),
  func: async ({ employee_name, note }) => {
    const ok = addNoteToSurvey(employee_name, note);
    if (!ok) return `No survey found for "${employee_name}". Cannot save note.`;
    return `Engagement note saved for ${employee_name}: "${note}"`;
  },
});

const flagAttritionRiskTool = new DynamicStructuredTool({
  name: "flag_attrition_risk",
  description: "Flag a new employee as an early attrition risk and document the reason.",
  schema: z.object({ employee_name: z.string(), reason: z.string() }),
  func: async ({ employee_name, reason }) => {
    const ok = flagAttritionRisk(employee_name, reason);
    if (!ok) return `No survey found for "${employee_name}". Cannot flag risk.`;
    return `${employee_name} has been flagged as an attrition risk. Reason: "${reason}".`;
  },
});

const TOOLS = [
  getEmployeeEngagement, getTeamEngagementSummary, submitInterestSurvey,
  findMentorMatchTool, findMentorByNameTool, findAvailableMeetingSlotsTool,
  scheduleCoffeeChatTool, addEngagementNoteTool, flagAttritionRiskTool,
];

// ── LangGraph ────────────────────────────────────────────────────────────────

const model = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  maxTokens: 2048,
}).bindTools(TOOLS);

const toolNode = new ToolNode(TOOLS);

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const last = messages[messages.length - 1] as AIMessage;
  return last.tool_calls?.length ? "tools" : END;
}

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (state) => ({ messages: [await model.invoke(state.messages)] }))
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
  .addEdge("tools", "agent")
  .compile();

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Engee, an AI agent specialized in engagement with new employees for Haigent.

"Engee" = Engagement with New Employees. Your mission is to ensure every new hire feels welcomed, connected, and set up for success in their first 90 days.

Core capabilities:
1. INTEREST SURVEY — Conversationally guide new employees through sharing interests and goals, then save with submit_interest_survey.
2. MENTOR MATCHING — Use find_mentor_match to suggest the right mentor based on department and interests.
3. CALENDAR AVAILABILITY (workIQ) — Before scheduling a coffee chat, use find_available_meeting_slots to check both the employee's and mentor's Outlook calendars and surface 3 open 30-minute slots. Ask the employee for their work email if you don't have it. Present the 3 options and let the employee choose one.
4. DIRECT MEETING SCHEDULING — After the employee picks a slot, use find_mentor_by_name to confirm contact details, then call schedule_coffee_chat with the chosen time. Never ask the employee for the mentor's Slack/Teams ID — look it up yourself.
5. COFFEE CHAT SCHEDULING — Send meeting requests via Teams or Slack using schedule_coffee_chat.
6. ENGAGEMENT MONITORING — Track milestone check-ins, attrition risk, and team health.

When an employee has just completed the interest survey form, immediately use find_mentor_match to suggest a match.
When scheduling a coffee chat: (1) ask for the employee's work email if needed, (2) call find_available_meeting_slots to get 3 time options, (3) present them clearly, (4) once the employee picks one, call schedule_coffee_chat — pass all 3 slots as suggested_slots.
Always be warm, encouraging, and people-first. New employees can be nervous — help them feel welcome.
For HR managers asking for team overviews, be concise and action-oriented.`;

// ── Message converters (Anthropic wire format ↔ LangChain BaseMessage) ───────

function toLC(msgs: MessageParam[]): BaseMessage[] {
  const result: BaseMessage[] = [];
  for (const msg of msgs) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        result.push(new HumanMessage(msg.content));
      } else {
        const blocks = msg.content as ContentBlockParam[];
        const toolResults = blocks.filter(b => b.type === "tool_result") as ToolResultBlock[];
        if (toolResults.length > 0) {
          for (const tr of toolResults) {
            const content = typeof tr.content === "string" ? tr.content
              : tr.content.filter(b => b.type === "text").map(b => b.text).join("\n");
            result.push(new ToolMessage({ content, tool_call_id: tr.tool_use_id }));
          }
        } else {
          const text = (blocks as TextBlock[]).filter(b => b.type === "text").map(b => b.text).join("\n");
          if (text) result.push(new HumanMessage(text));
        }
      }
    } else if (msg.role === "assistant") {
      if (typeof msg.content === "string") {
        result.push(new AIMessage(msg.content));
      } else {
        const blocks = msg.content as ContentBlock[];
        const textContent = (blocks.filter(b => b.type === "text") as TextBlock[]).map(b => b.text).join("\n");
        const toolUses = blocks.filter(b => b.type === "tool_use") as ToolUseBlock[];
        if (toolUses.length > 0) {
          result.push(new AIMessage({
            content: textContent,
            tool_calls: toolUses.map(tu => ({ id: tu.id, name: tu.name, args: tu.input })),
          }));
        } else {
          result.push(new AIMessage(textContent));
        }
      }
    }
  }
  return result;
}

function toAnthropic(msgs: BaseMessage[]): MessageParam[] {
  const result: MessageParam[] = [];
  let i = 0;
  while (i < msgs.length) {
    const msg = msgs[i];
    const type = msg._getType();
    if (type === "human") {
      result.push({ role: "user", content: typeof msg.content === "string" ? msg.content : String(msg.content) });
      i++;
    } else if (type === "ai") {
      const ai = msg as AIMessage;
      const blocks: ContentBlock[] = [];
      if (ai.content && String(ai.content).trim()) blocks.push({ type: "text", text: String(ai.content) });
      if (ai.tool_calls?.length) {
        for (const tc of ai.tool_calls) {
          blocks.push({ type: "tool_use", id: tc.id ?? "", name: tc.name, input: tc.args as Record<string, unknown> });
        }
      }
      result.push({ role: "assistant", content: blocks.length === 1 && blocks[0].type === "text" ? blocks[0].text : blocks });
      i++;
    } else if (type === "tool") {
      const toolResults: ContentBlockParam[] = [];
      while (i < msgs.length && msgs[i]._getType() === "tool") {
        const tm = msgs[i] as ToolMessage;
        toolResults.push({ type: "tool_result", tool_use_id: tm.tool_call_id, content: String(tm.content) });
        i++;
      }
      result.push({ role: "user", content: toolResults });
    } else {
      i++;
    }
  }
  return result;
}

// ── API Route ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: MessageParam[] };
    if (!messages?.length) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const lcMessages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), ...toLC(messages)];
    const result = await graph.invoke({ messages: lcMessages });

    const lastMsg = result.messages[result.messages.length - 1] as AIMessage;
    const responseText = typeof lastMsg.content === "string"
      ? lastMsg.content
      : (lastMsg.content as { type: string; text?: string }[])
          .filter(b => b.type === "text").map(b => b.text).join("\n");

    const updatedMessages = toAnthropic(result.messages.filter(m => m._getType() !== "system"));

    return NextResponse.json({ response: responseText, messages: updatedMessages });
  } catch (error) {
    console.error("Engee chat error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
