import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  queryTable,
  updateRecord,
  ONBOARDING_TABLE,
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
      "Get all available company benefit types — health insurance, dental, vision, life insurance, retirement, time off, and wellness programs — with costs and coverage details.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_employee_benefits",
    description:
      "Get the benefits enrollment status for an employee by name. Returns which benefits they are enrolled in, their coverage level, premiums, and enrollment status.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string", description: "Employee full name" },
      },
      required: ["employee_name"],
    },
  },
  {
    name: "get_all_enrollments",
    description:
      "Get a summary of all employees and their benefit enrollment statuses. Useful for HR overview questions.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "update_enrollment_status",
    description:
      "Update a benefit enrollment status for an employee (e.g. mark as Enrolled, Declined, or Pending).",
    input_schema: {
      type: "object" as const,
      properties: {
        enrollment_sys_id: { type: "string", description: "The sys_id of the enrollment record" },
        status: {
          type: "string",
          enum: ["pending", "enrolled", "declined", "expired", "cancelled"],
          description: "New enrollment status",
        },
      },
      required: ["enrollment_sys_id", "status"],
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
        sysparm_display_value: true,
        sysparm_limit: 50,
      });
      return JSON.stringify(records, null, 2);
    }

    if (name === "get_employee_benefits") {
      const employees = await queryTable(ONBOARDING_TABLE, {
        sysparm_query: `employee_nameLIKE${input.employee_name}`,
        sysparm_limit: 1,
        sysparm_display_value: true,
      });

      if (employees.length === 0) {
        return `No employee found with name "${input.employee_name}"`;
      }

      const enrollments = await queryTable(BENEFIT_ENROLLMENT_TABLE, {
        sysparm_query: `employee=${employees[0].sys_id}`,
        sysparm_display_value: true,
        sysparm_limit: 20,
      });

      return JSON.stringify({ employee: employees[0], enrollments }, null, 2);
    }

    if (name === "get_all_enrollments") {
      const [employees, enrollments] = await Promise.all([
        queryTable(ONBOARDING_TABLE, { sysparm_display_value: true, sysparm_limit: 50 }),
        queryTable(BENEFIT_ENROLLMENT_TABLE, { sysparm_display_value: true, sysparm_limit: 100 }),
      ]);
      return JSON.stringify({ employees, enrollments }, null, 2);
    }

    if (name === "update_enrollment_status") {
      const updated = await updateRecord(
        BENEFIT_ENROLLMENT_TABLE,
        input.enrollment_sys_id as string,
        { enrollment_status: input.status }
      );
      return `Enrollment updated successfully: ${JSON.stringify(updated, null, 2)}`;
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
- Get all available benefit types with costs and coverage details
- Look up an employee's current benefit enrollments
- Get an overview of all enrollments (for HR staff)
- Update enrollment statuses

When an employee asks about their benefits, use get_employee_benefits to fetch their real enrollment data.
When they ask "what benefits does the company offer?", use get_benefit_types to show all options.

Be friendly and helpful. Format benefit information clearly with costs, coverage levels, and enrollment status.
Always address the employee by their first name once you know it.
When showing costs, be specific about employee vs employer contributions.`;

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
