import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getRecordByEmployee, getAllRecords, updateTask, createITIncident,
} from "@/lib/onboarding-store";
import { getBenefitCatalog, getInquiriesByEmployee } from "@/lib/benefits-store";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "get_employee_onboarding",
    description: "Look up an employee's onboarding record by name or employee ID. Returns their onboarding status, completed tasks, pending tasks, start date, and notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        name:        { type: "string", description: "Employee full name (e.g. 'Alex Johnson')" },
        employee_id: { type: "string", description: "Employee ID (e.g. 'EMP001')" },
      },
    },
  },
  {
    name: "get_all_onboarding",
    description: "Get all employee onboarding records — useful for HR staff to see overall progress and status.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "update_onboarding_task",
    description: "Mark an onboarding task as complete or incomplete for an employee.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string" },
        task: {
          type: "string",
          enum: ["equipment_assigned", "access_provisioned", "documents_completed", "training_scheduled", "workspace_prepared"],
        },
        completed: { type: "boolean" },
      },
      required: ["employee_name", "task", "completed"],
    },
  },
  {
    name: "get_benefit_types",
    description: "Get all available company benefit plans with costs, employer contributions, eligibility, and provider details.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_employee_benefits",
    description: "Get the benefits enrollment status and inquiries for a specific employee.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string" },
      },
      required: ["employee_name"],
    },
  },
  {
    name: "create_it_incident",
    description: "Create an IT support incident for the employee (e.g. laptop setup, software access, VPN issues).",
    input_schema: {
      type: "object" as const,
      properties: {
        short_description: { type: "string", description: "Brief summary of the IT issue" },
        description:       { type: "string", description: "Full details of the issue" },
        caller_name:       { type: "string", description: "Name of the employee requesting help" },
      },
      required: ["short_description", "description"],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === "get_employee_onboarding") {
      const query = String(input.employee_id ?? input.name ?? "");
      const record = getRecordByEmployee(query);
      if (!record) return `No onboarding record found for "${query}".`;
      return JSON.stringify(record, null, 2);
    }

    if (name === "get_all_onboarding") {
      const all = getAllRecords();
      if (all.length === 0) return "No onboarding records found.";
      return JSON.stringify(all, null, 2);
    }

    if (name === "update_onboarding_task") {
      const updated = updateTask(
        String(input.employee_name),
        input.task as "equipment_assigned" | "access_provisioned" | "documents_completed" | "training_scheduled" | "workspace_prepared",
        Boolean(input.completed)
      );
      if (!updated) return `No record found for "${input.employee_name}".`;
      return `Updated ${input.task} = ${input.completed} for ${input.employee_name}. Status is now: ${updated.onboarding_status}.`;
    }

    if (name === "get_benefit_types") {
      return JSON.stringify(getBenefitCatalog(), null, 2);
    }

    if (name === "get_employee_benefits") {
      const onboarding = getRecordByEmployee(String(input.employee_name));
      const inquiries  = getInquiriesByEmployee(String(input.employee_name));
      return JSON.stringify({ employee: onboarding, benefit_inquiries: inquiries }, null, 2);
    }

    if (name === "create_it_incident") {
      const incident = createITIncident(
        String(input.short_description),
        String(input.description),
        String(input.caller_name ?? "")
      );
      return `IT incident created. Incident ID: ${incident.id}. Status: open. Someone from IT will be in touch shortly.`;
    }

    return `Unknown tool: ${name}`;
  } catch (error) {
    return `Tool error: ${String(error)}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages: Anthropic.MessageParam[] };
    if (!messages?.length) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrompt = `You are an intelligent HR Onboarding assistant for Haigent. You help employees with their onboarding process, IT setup, and benefits enrollment.

You have access to tools to:
- Look up an employee's onboarding record and task status
- Get an overview of all employees' onboarding progress (for HR staff)
- Mark onboarding tasks as complete or incomplete
- Get information about company benefits and enrollment
- Create IT support incidents for hardware, software, or access issues

When an employee asks about their onboarding status, use get_employee_onboarding to fetch their record.
When they ask about benefits, use get_benefit_types and get_employee_benefits.
If they need IT help (laptop, software, VPN, access), offer to create an incident using create_it_incident.

Be friendly, helpful, and concise. Format responses clearly with task lists and status indicators.
Always address the employee by their first name once you know it.`;

    let currentMessages = [...messages];
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
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
          toolUseBlocks.map(async (tu) => ({
            type: "tool_result" as const,
            tool_use_id: tu.id,
            content: await executeTool(tu.name, tu.input as Record<string, unknown>),
          }))
        );

        currentMessages = [...currentMessages, { role: "user", content: toolResults }];
        continue;
      }

      break;
    }

    return NextResponse.json({ error: "Max iterations reached" }, { status: 500 });
  } catch (error) {
    console.error("Onboarding chat error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
