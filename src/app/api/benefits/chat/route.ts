import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getBenefitCatalog, getInquiriesByEmployee, getAllInquiries,
  createInquiry, updateInquiry,
} from "@/lib/benefits-store";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: "get_benefit_types",
    description: "Get all available company benefits — health, dental, vision, retirement, life insurance, disability, wellness, time off, EAP, professional development, and commuter benefits — with costs, employer contributions, eligibility, and provider details.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_employee_inquiries",
    description: "Get all benefit inquiries submitted by a specific employee. Returns inquiry type, benefit category, status, priority, and resolution notes.",
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
    description: "Get a summary of all benefit inquiries across all employees. Useful for HR staff to see pending requests, complaints, and enrollment requests.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "create_benefit_inquiry",
    description: "Create a new benefit inquiry or request on behalf of an employee — enrollment, information request, change, or complaint.",
    input_schema: {
      type: "object" as const,
      properties: {
        employee_name: { type: "string" },
        inquiry_type: {
          type: "string",
          enum: ["search", "enrollment", "information", "change", "complaint"],
        },
        benefit_category: {
          type: "string",
          enum: ["health", "dental", "vision", "retirement", "life_insurance", "disability", "wellness", "time_off", "employee_assistance", "professional_development", "commuter", "other"],
        },
        description: { type: "string" },
      },
      required: ["employee_name", "inquiry_type", "description"],
    },
  },
  {
    name: "update_inquiry_status",
    description: "Update the status of a benefit inquiry and optionally add resolution notes.",
    input_schema: {
      type: "object" as const,
      properties: {
        inquiry_id: { type: "string", description: "The id of the inquiry record" },
        status: {
          type: "string",
          enum: ["open", "in_progress", "resolved", "closed"],
        },
        resolution_notes: { type: "string" },
      },
      required: ["inquiry_id", "status"],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === "get_benefit_types") {
      return JSON.stringify(getBenefitCatalog(), null, 2);
    }

    if (name === "get_employee_inquiries") {
      const results = getInquiriesByEmployee(String(input.employee_name));
      if (results.length === 0) return `No benefit inquiries found for "${input.employee_name}".`;
      return JSON.stringify(results, null, 2);
    }

    if (name === "get_all_inquiries") {
      const all = getAllInquiries();
      if (all.length === 0) return "No benefit inquiries on record.";
      return JSON.stringify(all, null, 2);
    }

    if (name === "create_benefit_inquiry") {
      const inquiry = createInquiry({
        employee_name:    String(input.employee_name),
        inquiry_type:     input.inquiry_type as "search" | "enrollment" | "information" | "change" | "complaint",
        benefit_category: (input.benefit_category as typeof import("@/lib/benefits-store").BENEFIT_CATALOG[0]["category"] | null) ?? null,
        description:      String(input.description),
      });
      return `Benefit inquiry created. ID: ${inquiry.id} · Status: ${inquiry.status} · Priority: ${inquiry.priority}`;
    }

    if (name === "update_inquiry_status") {
      const updated = updateInquiry(String(input.inquiry_id), {
        status: input.status as "open" | "in_progress" | "resolved" | "closed",
        ...(input.resolution_notes ? { resolution_notes: String(input.resolution_notes) } : {}),
      });
      if (!updated) return `No inquiry found with ID "${input.inquiry_id}".`;
      return `Inquiry ${input.inquiry_id} updated to "${input.status}".${input.resolution_notes ? ` Notes: ${input.resolution_notes}` : ""}`;
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

    const systemPrompt = `You are an intelligent HR Benefits assistant for Haigent. You help employees understand and manage their company benefits.

You have access to tools to:
- Get all available benefit plans with costs and coverage details
- Look up an employee's benefit inquiries and requests
- Get an overview of all open inquiries (for HR staff)
- Create new benefit inquiries or enrollment requests on behalf of employees
- Update inquiry statuses and add resolution notes

When an employee asks about their benefits or has a request, use get_employee_inquiries to check existing requests, and create_benefit_inquiry to submit new ones.
When they ask "what benefits does the company offer?", use get_benefit_types to show all available plans.
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
        top_p: 1,
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
    console.error("Benefits chat error:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}
