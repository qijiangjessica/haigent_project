import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { AUDIT_LOG } from "@/data/reference/audit-log";
import { REFERENCE_JOBS } from "@/data/reference/jobs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools: Anthropic.Tool[] = [
  {
    name: "get_candidates",
    description:
      "Get all referred candidates with their skill verification status, scores, and current pool status. Optionally filter by name, status, or minimum score.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Filter by candidate name (partial match)",
        },
        status: {
          type: "string",
          enum: ["pending_validation", "verification_in_progress", "matched", "in_pool", "hired", "closed"],
          description: "Filter by pool status",
        },
        min_score: {
          type: "number",
          description: "Only return candidates with score >= this value",
        },
      },
    },
  },
  {
    name: "get_matches",
    description:
      "Get match records showing how candidates scored against open job postings. Returns match score, classification (Strong/Partial/No Match), and outcome.",
    input_schema: {
      type: "object" as const,
      properties: {
        candidate_id: {
          type: "string",
          description: "Filter by candidate ID (e.g. CAND-001)",
        },
        posting_id: {
          type: "string",
          description: "Filter by job posting ID",
        },
        classification: {
          type: "string",
          enum: ["Strong Match", "Partial Match", "No Match"],
          description: "Filter by match classification",
        },
      },
    },
  },
  {
    name: "get_talent_pool",
    description:
      "Get all candidates currently in the talent pool with their hold status, skill tags, preferred roles, and match evaluation history.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_audit_trail",
    description:
      "Get the full audit trail for a specific candidate or reference showing every status change, verification step, match event, and recruiter decision.",
    input_schema: {
      type: "object" as const,
      properties: {
        entity_id: {
          type: "string",
          description: "Candidate ID (CAND-xxx), Reference ID (REF-xxxx-xxx), or leave empty for all events",
        },
      },
    },
  },
];

function executeTool(name: string, input: Record<string, unknown>): string {
  if (name === "get_candidates") {
    let results = REFERENCE_CANDIDATES;

    if (input.name) {
      const search = String(input.name).toLowerCase();
      results = results.filter((c) => c.name.toLowerCase().includes(search));
    }
    if (input.status) {
      results = results.filter((c) => c.pool_status === input.status);
    }
    if (typeof input.min_score === "number") {
      results = results.filter((c) => c.candidate_score >= (input.min_score as number));
    }

    // Enrich with referrer info
    const enriched = results.map((c) => {
      const ref = REFERENCES.find((r) => r.reference_id === c.reference_id);
      return { ...c, referrer_name: ref?.referrer_name, referrer_note: ref?.referrer_note };
    });

    return results.length === 0
      ? "No candidates found matching the criteria."
      : JSON.stringify(enriched, null, 2);
  }

  if (name === "get_matches") {
    let results = MATCH_RECORDS;

    if (input.candidate_id) {
      results = results.filter((m) => m.candidate_id === input.candidate_id);
    }
    if (input.posting_id) {
      results = results.filter((m) => m.posting_id === input.posting_id);
    }
    if (input.classification) {
      results = results.filter((m) => m.classification === input.classification);
    }

    const enriched = results.map((m) => ({
      ...m,
      job_title: REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id,
    }));
    return enriched.length === 0
      ? "No match records found."
      : JSON.stringify(enriched, null, 2);
  }

  if (name === "get_talent_pool") {
    if (TALENT_POOL.length === 0) return "Talent pool is currently empty.";

    const enriched = TALENT_POOL.map((p) => {
      const candidate = REFERENCE_CANDIDATES.find((c) => c.candidate_id === p.candidate_id);
      return { ...p, candidate_name: candidate?.name, candidate_email: candidate?.email };
    });

    return JSON.stringify(enriched, null, 2);
  }

  if (name === "get_audit_trail") {
    const entityId = input.entity_id ? String(input.entity_id) : null;

    const results = entityId
      ? AUDIT_LOG.filter((e) => e.entity_id === entityId || e.notes?.includes(entityId))
      : AUDIT_LOG;

    return results.length === 0
      ? `No audit events found for ${entityId}.`
      : JSON.stringify(results, null, 2);
  }

  return `Unknown tool: ${name}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: Anthropic.MessageParam[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrompt = `You are an AI assistant for the Haigent Reference Program — an employee referral and talent matching platform.

You help recruiters and HR managers understand the state of referred candidates, match scores, talent pool, and referral history.

You have access to tools to:
- Look up referred candidates and their skill verification status
- Get match records showing how candidates scored against open job postings
- View the talent pool (candidates held for future openings)
- Retrieve the audit trail for any candidate or referral

Match scoring formula: (skill_overlap × 0.50) + (experience × 0.25) + (location × 0.15) + (seniority × 0.10)
Classifications: ≥70 = Strong Match | 50–69 = Partial Match | <50 = No Match

Always use tools to fetch live data before answering. Be concise, specific, and format responses clearly with lists and scores.`;

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

        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((toolUse) => ({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: executeTool(toolUse.name, toolUse.input as Record<string, unknown>),
        }));

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
    console.error("Reference chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
