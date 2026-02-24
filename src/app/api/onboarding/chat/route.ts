import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  queryTable,
  updateRecord,
  createRecord,
  ONBOARDING_TABLE,
  BENEFIT_TYPES_TABLE,
  BENEFIT_ENROLLMENT_TABLE,
} from "@/lib/servicenow";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Tool definitions for Claude to call ServiceNow
const tools: Anthropic.Tool[] = [
  {
    name: "get_employee_onboarding",
    description:
      "Look up an employee's onboarding record by name or employee ID. Returns their onboarding status, completed tasks, pending tasks, start date, and notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Employee full name (e.g. 'John Smith')",
        },
        employee_id: {
          type: "string",
          description: "Employee ID (e.g. 'EMP001')",
        },
      },
    },
  },
  {
    name: "update_onboarding_task",
    description:
      "Mark an onboarding task as complete or incomplete for an employee. Tasks: equipment_assigned, access_provisioned, documents_completed, training_scheduled, workspace_prepared.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: {
          type: "string",
          description: "Employee full name",
        },
        task: {
          type: "string",
          enum: [
            "equipment_assigned",
            "access_provisioned",
            "documents_completed",
            "training_scheduled",
            "workspace_prepared",
          ],
          description: "The task field to update",
        },
        completed: {
          type: "boolean",
          description: "true to mark complete, false to mark incomplete",
        },
      },
      required: ["employee_name", "task", "completed"],
    },
  },
  {
    name: "get_benefit_types",
    description:
      "Get all available company benefit types including health insurance, dental, vision, retirement, time off, and wellness programs with costs.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_employee_benefits",
    description:
      "Get the benefits enrollment status for a specific employee by name.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: {
          type: "string",
          description: "Employee full name",
        },
      },
      required: ["employee_name"],
    },
  },
  {
    name: "create_it_incident",
    description:
      "Create an IT support incident in ServiceNow for the employee (e.g. laptop setup, software access, VPN issues).",
    input_schema: {
      type: "object" as const,
      properties: {
        short_description: {
          type: "string",
          description: "Brief summary of the IT issue",
        },
        description: {
          type: "string",
          description: "Full details of the issue",
        },
        caller_name: {
          type: "string",
          description: "Name of the employee requesting help",
        },
      },
      required: ["short_description", "description"],
    },
  },
];

// Execute a tool call against ServiceNow
async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    if (name === "get_employee_onboarding") {
      const query = input.employee_id
        ? `employee_id=${input.employee_id}`
        : `employee_nameLIKE${input.name}`;

      const records = await queryTable(ONBOARDING_TABLE, {
        sysparm_query: query,
        sysparm_limit: 1,
        sysparm_display_value: true,
      });

      if (records.length === 0) {
        return `No onboarding record found for ${input.name || input.employee_id}`;
      }
      return JSON.stringify(records[0], null, 2);
    }

    if (name === "update_onboarding_task") {
      const records = await queryTable(ONBOARDING_TABLE, {
        sysparm_query: `employee_nameLIKE${input.employee_name}`,
        sysparm_limit: 1,
      });

      if (records.length === 0) {
        return `No record found for ${input.employee_name}`;
      }

      const updated = await updateRecord(ONBOARDING_TABLE, records[0].sys_id, {
        [input.task as string]: input.completed,
      });
      return `Updated ${input.task} = ${input.completed} for ${input.employee_name}. Record: ${JSON.stringify(updated, null, 2)}`;
    }

    if (name === "get_benefit_types") {
      const records = await queryTable(BENEFIT_TYPES_TABLE, {
        sysparm_display_value: true,
        sysparm_limit: 50,
      });
      return JSON.stringify(records, null, 2);
    }

    if (name === "get_employee_benefits") {
      // First find the employee record to get their sys_id
      const employees = await queryTable(ONBOARDING_TABLE, {
        sysparm_query: `employee_nameLIKE${input.employee_name}`,
        sysparm_limit: 1,
      });

      if (employees.length === 0) {
        return `No employee found with name ${input.employee_name}`;
      }

      const enrollments = await queryTable(BENEFIT_ENROLLMENT_TABLE, {
        sysparm_query: `employee=${employees[0].sys_id}`,
        sysparm_display_value: true,
        sysparm_limit: 20,
      });

      return JSON.stringify({ employee: employees[0], enrollments }, null, 2);
    }

    if (name === "create_it_incident") {
      const incident = await createRecord("incident", {
        short_description: input.short_description,
        description: input.description,
        caller_id: input.caller_name || "Employee",
        category: "hardware",
        impact: "2",
        urgency: "2",
      });
      return `IT incident created successfully. Incident number: ${incident.number || incident.sys_id}`;
    }

    return `Unknown tool: ${name}`;
  } catch (error) {
    return `Tool error: ${String(error)}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as {
      messages: Anthropic.MessageParam[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrompt = `You are an intelligent HR onboarding assistant for Haigent. You help employees with their onboarding process, IT setup, and benefits enrollment.

You have access to tools to:
- Look up employee onboarding records and status
- Check and update onboarding task completion
- Get information about company benefits and enrollment
- Create IT support incidents

When an employee asks about their onboarding status, always use the get_employee_onboarding tool to fetch their real data.
When they ask about benefits, use get_benefit_types and get_employee_benefits tools.
If they need IT help (laptop, software, VPN, access), offer to create an incident using create_it_incident.

Be friendly, helpful, and concise. Format responses clearly with task lists and status indicators when appropriate.
Always address the employee by their first name once you know it.`;

    // Agentic loop — keep calling Claude until no more tool use
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

      // If Claude is done (no tool use), return the text
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

      // Process tool calls
      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
        );

        // Add assistant message with tool calls
        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
        ];

        // Execute all tools and collect results
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

        // Add tool results as user message
        currentMessages = [
          ...currentMessages,
          { role: "user", content: toolResults },
        ];

        continue;
      }

      // Unexpected stop reason
      break;
    }

    return NextResponse.json(
      { error: "Max iterations reached" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Onboarding chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
