import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  queryTable,
  createRecord,
  updateRecord,
  BENEFIT_TYPES_TABLE,
  BENEFIT_ENROLLMENT_TABLE,
} from "@/lib/servicenow";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools: Anthropic.Tool[] = [
  {
    name: "get_benefit_types",
    description:
      "Get all available company benefits from the benefits catalog — including health, dental, vision, retirement, life insurance, disability, wellness, and time off plans — with monthly costs, employer contributions, eligibility, and provider details.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_employee_inquiries",
    description:
      "Get all benefit inquiries submitted by a specific employee by name. Returns their inquiry type, benefit category, status, priority, and resolution notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string", description: "Employee full name" },
      },
      required: ["employee_name"],
    },
  },
  {
    name: "get_all_inquiries",
    description:
      "Get a summary of all open benefit inquiries across all employees. Useful for HR staff to see pending requests, complaints, and enrollment requests.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "create_benefit_inquiry",
    description:
      "Create a new benefit inquiry or request on behalf of an employee. Use this when an employee wants to enroll in a benefit, request information, report an issue, or request a change.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string", description: "Full name of the employee" },
        inquiry_type: {
          type: "string",
          enum: ["search", "enrollment", "information", "change", "complaint"],
          description: "Type of inquiry",
        },
        benefit_category: {
          type: "string",
          enum: ["health", "dental", "vision", "retirement", "life_insurance", "disability", "wellness", "time_off", "employee_assistance", "professional_development", "commuter", "other"],
          description: "Benefit category the inquiry relates to",
        },
        description: { type: "string", description: "Detailed description of the inquiry or request" },
      },
      required: ["employee_name", "inquiry_type", "description"],
    },
  },
  {
    name: "update_inquiry_status",
    description:
      "Update the status of a benefit inquiry (e.g. mark as in_progress, resolved, or closed) and optionally add resolution notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        inquiry_sys_id: { type: "string", description: "The sys_id of the inquiry record" },
        status: {
          type: "string",
          enum: ["open", "in_progress", "resolved", "closed"],
          description: "New status for the inquiry",
        },
        resolution_notes: { type: "string", description: "Optional notes explaining the resolution" },
      },
      required: ["inquiry_sys_id", "status"],
    },
  },
];

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    if (name === "get_benefit_types") {
      const records = await queryTable(BENEFIT_TYPES_TABLE, {
        sysparm_fields: "sys_id,benefit_name,benefit_description,category,cost,employer_contribution,eligibility,enrollment_period,provider,active",
        sysparm_query: "active=true",
        sysparm_display_value: true,
        sysparm_limit: 50,
      });
      return JSON.stringify(records, null, 2);
    }

    if (name === "get_employee_inquiries") {
      const records = await queryTable(BENEFIT_ENROLLMENT_TABLE, {
        sysparm_query: `employeeLIKE${input.employee_name}`,
        sysparm_fields: "sys_id,employee,inquiry_type,benefit_category,description,status,priority,assigned_to,inquiry_date,resolution_notes,satisfaction_rating",
        sysparm_display_value: true,
        sysparm_limit: 20,
      });
      if (records.length === 0) {
        return `No benefit inquiries found for employee "${input.employee_name}"`;
      }
      return JSON.stringify(records, null, 2);
    }

    if (name === "get_all_inquiries") {
      const records = await queryTable(BENEFIT_ENROLLMENT_TABLE, {
        sysparm_fields: "sys_id,employee,inquiry_type,benefit_category,description,status,priority,assigned_to,inquiry_date,resolution_notes",
        sysparm_display_value: true,
        sysparm_limit: 100,
      });
      return JSON.stringify(records, null, 2);
    }

    if (name === "create_benefit_inquiry") {
      const fields: Record<string, unknown> = {
        inquiry_type: input.inquiry_type,
        description: input.description,
        status: "open",
        priority: input.inquiry_type === "complaint" ? "high" : "medium",
      };
      if (input.benefit_category) fields.benefit_category = input.benefit_category;

      const record = await createRecord(BENEFIT_ENROLLMENT_TABLE, fields);
      return `Benefit inquiry created successfully. Inquiry ID: ${record.sys_id}. Status: open, Priority: ${fields.priority}`;
    }

    if (name === "update_inquiry_status") {
      const fields: Record<string, unknown> = { status: input.status };
      if (input.resolution_notes) fields.resolution_notes = input.resolution_notes;

      const updated = await updateRecord(
        BENEFIT_ENROLLMENT_TABLE,
        input.inquiry_sys_id as string,
        fields
      );
      return `Inquiry updated successfully. New status: ${input.status}. ${JSON.stringify(updated, null, 2)}`;
    }

    return `Unknown tool: ${name}`;
  } catch (error) {
    return `Tool error: ${String(error)}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Anthropic.MessageParam[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrompt = `You are an intelligent HR Benefits assistant for Haigent. You help employees understand and manage their company benefits.

You have access to tools to:
- Get all available benefit plans with costs and coverage details from the benefits catalog
- Look up an employee's benefit inquiries and requests
- Get an overview of all open inquiries (for HR staff)
- Create new benefit inquiries or enrollment requests on behalf of employees
- Update inquiry statuses and add resolution notes

When an employee asks about their benefits or has a request, use get_employee_inquiries to check their existing requests, and create_benefit_inquiry to submit new ones.
When they ask "what benefits does the company offer?", use get_benefit_types to show all available plans from the catalog.
When showing costs, be specific about employee monthly cost vs employer contribution.

Be friendly and helpful. Format benefit information clearly with costs, coverage levels, and categories.
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
          messages: [
            ...currentMessages,
            { role: "assistant", content: response.content },
          ],
        });
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
        );

        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
        ];

        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (toolUse) => ({
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: await executeTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>
            ),
          }))
        );

        currentMessages = [
          ...currentMessages,
          { role: "user", content: toolResults },
        ];

        continue;
      }

      break;
    }

    return NextResponse.json({ error: "Max iterations reached" }, { status: 500 });
  } catch (error) {
    console.error("Benefits chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
