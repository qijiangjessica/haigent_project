import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { AUDIT_LOG } from "@/data/reference/audit-log";
import { REFERENCE_JOBS, OPEN_JOBS } from "@/data/reference/jobs";
import {
  getReferrals, getLivePoolEntries, getLiveMatchRecords, getLivePoolEntry,
  type LivePoolEntry,
} from "@/lib/reference-store";
import {
  hydrateStoreFromDisk, addPoolEntryAndPersist,
  addAuditEventAndPersist, updateReferralAndPersist,
} from "@/lib/reference-json-persistence";
import { appUrl } from "@/lib/email";

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
  {
    name: "get_referrals",
    description:
      "Query submitted referrals from the live system. Returns referral details including candidate info, referrer, target job, pipeline status, skills claimed, match scores, and timeline fields (submitted_at, in_review_at, hired_at). Use this when asked about any submitted referral, a specific person's referral, referrals for a job, or referrals in a particular pipeline stage.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Partial match on candidate name or referrer name",
        },
        pipeline_status: {
          type: "string",
          enum: ["pending_review", "in_review", "not_suitable", "in_pool", "hired"],
          description: "Filter by current pipeline stage",
        },
        job_id: {
          type: "string",
          description: "Filter by target job ID (e.g. ROL-abc123)",
        },
        date_from: {
          type: "string",
          description: "Only return referrals submitted on or after this date (YYYY-MM-DD)",
        },
        date_to: {
          type: "string",
          description: "Only return referrals submitted on or before this date (YYYY-MM-DD)",
        },
        referral_id: {
          type: "string",
          description: "Look up a specific referral by its ID",
        },
      },
    },
  },
  {
    name: "get_live_pool",
    description:
      "Get candidates currently in the live talent pool — these are submitted referrals that a recruiter has promoted. Returns pool entry details including candidate info, skill tags, experience level, preferred roles, pool status, and their match evaluation history. Use this when asked about the talent pool, pooled candidates, or candidates on hold.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["Active Hold", "Aging Review", "Withdrawn", "Placed"],
          description: "Filter pool entries by hold status",
        },
        experience_level: {
          type: "string",
          enum: ["Junior", "Mid", "Senior", "Lead"],
          description: "Filter by candidate experience level",
        },
      },
    },
  },
  {
    name: "promote_to_pool",
    description:
      "Promote a submitted referral to the live talent pool. Use this when a recruiter says they want to move a candidate to the pool, add someone to the talent pool, or hold a referral for future roles. Requires the referral_id and experience level. Automatically writes an audit event, updates the referral pipeline_status to in_pool, and fires email notifications. Returns the new pool_id on success.",
    input_schema: {
      type: "object" as const,
      properties: {
        referral_id: {
          type: "string",
          description: "The referral ID to promote (e.g. REF-2024-abc123). Use get_referrals first if you need to find it.",
        },
        experience_level: {
          type: "string",
          enum: ["Junior", "Mid", "Senior", "Lead"],
          description: "Seniority classification for this candidate in the pool",
        },
        preferred_role_tags: {
          type: "array",
          items: { type: "string" },
          description: "Roles the candidate should be considered for (e.g. ['Data Engineer', 'Analytics Engineer'])",
        },
        location_tags: {
          type: "array",
          items: { type: "string" },
          description: "Location preferences — defaults to the candidate's submitted location if omitted",
        },
        skill_tags: {
          type: "array",
          items: { type: "string" },
          description: "Skills to tag the pool entry with — defaults to the candidate's claimed skills",
        },
        promoted_by: {
          type: "string",
          description: "Name/identifier of who is promoting — defaults to 'Recruiter (Agent)'",
        },
      },
      required: ["referral_id", "experience_level"],
    },
  },
  {
    name: "rescore_referral",
    description:
      "Re-run match scoring for a submitted referral against all open job postings using the current scoring weights. Use this when a recruiter asks to re-evaluate, re-score, or refresh scores for a referral — especially after skills are updated or scoring weights change. Returns new match scores for all open jobs. AI scoring is used when available, static scoring as fallback.",
    input_schema: {
      type: "object" as const,
      properties: {
        referral_id: {
          type: "string",
          description: "The referral ID to re-score (e.g. REF-2024-abc123). Use get_referrals first if you need to find it.",
        },
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Override the candidate's stored skills for this scoring run only (optional — omit to use stored skills)",
        },
      },
      required: ["referral_id"],
    },
  },
  {
    name: "get_live_matches",
    description:
      "Get AI-scored match records for submitted referrals against open job postings. Each record contains skill_overlap_score, experience_score, location_score, seniority_score, a weighted match_score, and a Strong/Partial/No Match classification. Use this when asked about match scores, how a referral scored against jobs, or which referrals best fit a particular role.",
    input_schema: {
      type: "object" as const,
      properties: {
        referral_id: {
          type: "string",
          description: "Filter by referral ID to see all job matches for one referral",
        },
        posting_id: {
          type: "string",
          description: "Filter by job posting ID to see all referrals scored against that job",
        },
        classification: {
          type: "string",
          enum: ["Strong Match", "Partial Match", "No Match"],
          description: "Filter by match classification",
        },
        min_score: {
          type: "number",
          description: "Only return matches with match_score >= this value (0–100)",
        },
      },
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
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

  // ── get_referrals — live submitted referrals ──────────────────────────────
  if (name === "get_referrals") {
    let results = getReferrals();

    if (input.referral_id) {
      results = results.filter((r) => r.referral_id === String(input.referral_id));
    }
    if (input.name) {
      const q = String(input.name).toLowerCase();
      results = results.filter(
        (r) =>
          r.candidate_name.toLowerCase().includes(q) ||
          r.referrer_name.toLowerCase().includes(q)
      );
    }
    if (input.pipeline_status) {
      results = results.filter((r) => r.pipeline_status === input.pipeline_status);
    }
    if (input.job_id) {
      results = results.filter((r) => r.target_job_id === String(input.job_id));
    }
    if (input.date_from) {
      results = results.filter((r) => r.submitted_at >= String(input.date_from));
    }
    if (input.date_to) {
      results = results.filter((r) => r.submitted_at <= String(input.date_to) + "T23:59:59Z");
    }

    if (results.length === 0) return "No submitted referrals found matching the criteria.";

    const enriched = results.map((r) => {
      const job = OPEN_JOBS.find((j) => j.id === r.target_job_id);
      return {
        referral_id:      r.referral_id,
        submitted_at:     r.submitted_at,
        pipeline_status:  r.pipeline_status,
        candidate_name:   r.candidate_name,
        candidate_email:  r.candidate_email,
        referrer_name:    r.referrer_name,
        referrer_emp_id:  r.referrer_emp_id,
        target_job:       job ? `${job.title} (${job.department})` : r.target_job_id,
        years_experience: r.years_experience,
        location:         r.location,
        availability:     r.availability,
        skills_claimed:   r.skills_claimed,
        is_duplicate:     r.is_duplicate,
        in_review_at:     r.in_review_at ?? null,
        hired_at:         r.hired_at ?? null,
        has_resume:       !!r.resume_filename,
        referrer_note:    r.referrer_note || null,
      };
    });

    return JSON.stringify(enriched, null, 2);
  }

  // ── get_live_pool — dynamically promoted pool entries ─────────────────────
  if (name === "get_live_pool") {
    let entries = getLivePoolEntries();

    if (input.status) {
      entries = entries.filter((p) => p.status === input.status);
    }
    if (input.experience_level) {
      entries = entries.filter((p) => p.experience_level === input.experience_level);
    }

    if (entries.length === 0) {
      return "No live pool entries found matching the criteria. The seeded talent pool may still contain candidates — use get_talent_pool for those.";
    }

    const enriched = entries.map((p) => {
      // Enrich match history with job titles
      const matchHistory = p.match_evaluation_history.map((h) => {
        const job = OPEN_JOBS.find((j) => j.id === h.posting_id);
        return { job: job?.title ?? h.posting_id, score: h.score, evaluated_date: h.evaluated_date };
      });
      const bestMatch = matchHistory.length > 0
        ? matchHistory.reduce((best, h) => (h.score > best.score ? h : best))
        : null;
      return {
        pool_id:             p.pool_id,
        referral_id:         p.referral_id,
        candidate_name:      p.candidate_name,
        candidate_email:     p.candidate_email,
        status:              p.status,
        experience_level:    p.experience_level,
        years_experience:    p.years_experience,
        location:            p.location,
        availability:        p.availability,
        skill_tags:          p.skill_tags,
        preferred_role_tags: p.preferred_role_tags,
        date_added:          p.date_added,
        promoted_by:         p.promoted_by,
        best_match:          bestMatch,
        match_history:       matchHistory,
      };
    });

    return JSON.stringify(enriched, null, 2);
  }

  // ── get_live_matches — AI/static match records for submitted referrals ─────
  if (name === "get_live_matches") {
    let results = getLiveMatchRecords();

    if (input.referral_id) {
      results = results.filter((m) => m.referral_id === String(input.referral_id));
    }
    if (input.posting_id) {
      results = results.filter((m) => m.posting_id === String(input.posting_id));
    }
    if (input.classification) {
      results = results.filter((m) => m.classification === input.classification);
    }
    if (typeof input.min_score === "number") {
      results = results.filter((m) => m.match_score >= (input.min_score as number));
    }

    if (results.length === 0) return "No live match records found matching the criteria.";

    // Deduplicate: keep latest match per (referral_id, posting_id)
    const latestByKey = results.reduce<Record<string, typeof results[0]>>((acc, m) => {
      const key = `${m.referral_id}::${m.posting_id}`;
      if (!acc[key] || m.evaluated_date >= acc[key].evaluated_date) acc[key] = m;
      return acc;
    }, {});
    const deduped = Object.values(latestByKey).sort((a, b) => b.match_score - a.match_score);

    const enriched = deduped.map((m) => {
      const job = OPEN_JOBS.find((j) => j.id === m.posting_id);
      return {
        match_id:             m.match_id,
        referral_id:          m.referral_id,
        candidate_name:       m.candidate_name,
        job_title:            job?.title ?? m.posting_id,
        department:           job?.department ?? null,
        match_score:          m.match_score,
        classification:       m.classification,
        skill_overlap_score:  m.skill_overlap_score,
        experience_score:     m.experience_score,
        location_score:       m.location_score,
        seniority_score:      m.seniority_score,
        scoring_method:       m.scoring_method,
        evaluated_date:       m.evaluated_date,
      };
    });

    return JSON.stringify(enriched, null, 2);
  }

  // ── promote_to_pool — move a referral into the live talent pool ──────────────
  if (name === "promote_to_pool") {
    const referral_id    = String(input.referral_id ?? "");
    const experience_level = String(input.experience_level ?? "") as LivePoolEntry["experience_level"];
    const promoted_by    = String(input.promoted_by ?? "Recruiter (Agent)");

    if (!referral_id) return "Error: referral_id is required.";
    if (!["Junior", "Mid", "Senior", "Lead"].includes(experience_level)) {
      return "Error: experience_level must be one of: Junior, Mid, Senior, Lead.";
    }

    // Look up the referral
    const referral = getReferrals().find((r) => r.referral_id === referral_id);
    if (!referral) return `Error: Referral ${referral_id} not found. Use get_referrals to look up the correct ID.`;

    // Idempotency — block double promotion
    const existing = getLivePoolEntry(referral_id);
    if (existing) {
      return `This referral is already in the talent pool as pool entry ${existing.pool_id} (added ${existing.date_added}). No action taken.`;
    }

    const today       = new Date().toISOString().slice(0, 10);
    const now         = new Date().toISOString();
    const pool_id     = `LPOOL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Resolve tags — fall back to candidate data if not provided
    const skill_tags: string[]         = Array.isArray(input.skill_tags)
      ? (input.skill_tags as string[]).map((s) => s.trim()).filter(Boolean)
      : (referral.skills_claimed ?? []);
    const location_tags: string[]      = Array.isArray(input.location_tags)
      ? (input.location_tags as string[]).map((l) => l.trim()).filter(Boolean)
      : [referral.location].filter(Boolean);
    const preferred_role_tags: string[] = Array.isArray(input.preferred_role_tags)
      ? (input.preferred_role_tags as string[]).map((r) => r.trim()).filter(Boolean)
      : [];

    // Build match history from latest scored record per job
    const allMatches = getLiveMatchRecords(referral_id);
    const latestByPosting = allMatches.reduce<Record<string, typeof allMatches[0]>>((acc, m) => {
      if (!acc[m.posting_id] || m.evaluated_date >= acc[m.posting_id].evaluated_date) acc[m.posting_id] = m;
      return acc;
    }, {});
    const matchHistory = Object.values(latestByPosting).map((m) => ({
      posting_id:     m.posting_id,
      score:          m.match_score,
      evaluated_date: m.evaluated_date,
    }));

    const entry: LivePoolEntry = {
      pool_id,
      referral_id,
      candidate_name:      referral.candidate_name,
      candidate_email:     referral.candidate_email,
      years_experience:    referral.years_experience,
      location:            referral.location,
      availability:        referral.availability,
      date_added:          today,
      date_last_evaluated: today,
      status:              "Active Hold",
      skill_tags,
      experience_level,
      location_tags,
      preferred_role_tags,
      match_evaluation_history: matchHistory,
      promoted_at:         now,
      promoted_by,
    };

    addPoolEntryAndPersist(entry);

    // Update referral pipeline_status to in_pool
    updateReferralAndPersist(referral_id, { pipeline_status: "in_pool" });

    // Audit event
    addAuditEventAndPersist({
      event_id:     `EVT-AGENT-PROMO-${Date.now()}`,
      timestamp:    now,
      actor:        promoted_by,
      actor_id:     promoted_by,
      event_type:   "PoolPromotion",
      entity_type:  "referral",
      entity_id:    referral_id,
      before_state: referral.pipeline_status ?? "pending_review",
      after_state:  "in_pool",
      notes:        `Promoted to pool by agent as ${pool_id} · Level: ${experience_level}`,
    });

    return JSON.stringify({
      success:         true,
      pool_id,
      referral_id,
      candidate_name:  referral.candidate_name,
      experience_level,
      skill_tags,
      location_tags,
      preferred_role_tags,
      match_records_linked: matchHistory.length,
      promoted_at:     now,
      message:         `Successfully promoted ${referral.candidate_name} to the talent pool as ${pool_id} (${experience_level} level). Pipeline status updated to in_pool.`,
    }, null, 2);
  }

  // ── rescore_referral — re-run AI/static matching via the rescore endpoint ────
  if (name === "rescore_referral") {
    const referral_id = String(input.referral_id ?? "");
    if (!referral_id) return "Error: referral_id is required.";

    const referral = getReferrals().find((r) => r.referral_id === referral_id);
    if (!referral) return `Error: Referral ${referral_id} not found. Use get_referrals to look up the correct ID.`;

    const body: Record<string, unknown> = { referral_id };
    if (Array.isArray(input.skills) && (input.skills as unknown[]).length > 0) {
      body.skills = (input.skills as unknown[]).map(String);
    }

    try {
      const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
      const res  = await fetch(`${base}/api/reference/rescore`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      const data = await res.json() as {
        success?: boolean;
        scoring_method?: string;
        run_index?: number;
        match_results?: Array<{
          posting_id: string; match_score: number; classification: string;
          skill_overlap_score: number; experience_score: number;
        }>;
        error?: string;
      };

      if (!res.ok || !data.success) {
        return `Error re-scoring referral: ${data.error ?? "Unknown error"}`;
      }

      const results = (data.match_results ?? [])
        .sort((a, b) => b.match_score - a.match_score)
        .map((m) => {
          const job = OPEN_JOBS.find((j) => j.id === m.posting_id);
          return {
            job:                 job?.title ?? m.posting_id,
            match_score:         m.match_score,
            classification:      m.classification,
            skill_overlap_score: m.skill_overlap_score,
            experience_score:    m.experience_score,
          };
        });

      return JSON.stringify({
        success:        true,
        referral_id,
        candidate_name: referral.candidate_name,
        scoring_method: data.scoring_method,
        run_index:      data.run_index,
        results,
        message: `Re-scoring complete (${data.scoring_method ?? "static"} method, run #${data.run_index}). ${results.length} job postings evaluated.`,
      }, null, 2);
    } catch (err) {
      return `Error calling rescore endpoint: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return `Unknown tool: ${name}`;
}

export async function POST(request: NextRequest) {
  try {
    // Ensure the live store is populated from disk before any tool calls
    hydrateStoreFromDisk();

    const body = await request.json();
    const { messages } = body as { messages: Anthropic.MessageParam[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const systemPrompt = `You are an AI assistant for the Haigent Reference Program — an employee referral and talent matching platform.

You help recruiters and HR managers understand the state of referred candidates, match scores, talent pool, and referral history.

You have access to two categories of data:

**Seeded / static data** (use get_candidates, get_matches, get_talent_pool, get_audit_trail):
- Pre-loaded candidate profiles with verification status and scores
- Historical match records and audit events
- Seeded talent pool entries

**Live / submitted data** (use get_referrals, get_live_pool, get_live_matches):
- Referrals submitted via the platform referral form — search by candidate name, referrer name, pipeline status, job, or date range
- Candidates dynamically promoted to the talent pool by recruiters
- Real-time AI/static match scores computed when referrals were submitted or re-scored

Tool selection guide:
- "Show me Alice's referral" → get_referrals (name filter)
- "Which referrals are in review?" → get_referrals (pipeline_status filter)
- "Who's in the talent pool?" → get_live_pool first, then get_talent_pool for seeded entries
- "How did John score against the Data Engineer role?" → get_live_matches (referral_id + posting_id)
- "Show me all Strong Match referrals" → get_live_matches (classification filter)
- "What happened to referral REF-xxx?" → get_referrals then get_audit_trail
- "Move John to the talent pool as Senior" → get_referrals to confirm the ID, then promote_to_pool
- "Re-score Alice's referral" → get_referrals to confirm the ID, then rescore_referral
- "Re-evaluate John with updated skills [Python, SQL]" → rescore_referral with skills override

Action tools (promote_to_pool, rescore_referral) make real changes to the system. Always confirm the referral_id by calling get_referrals first if the user gave a name rather than an ID. Before promoting, check get_live_pool to ensure the candidate isn't already in the pool.

Match scoring formula: (skill_overlap × 0.50) + (experience × 0.25) + (location × 0.15) + (seniority × 0.10)
Classifications: ≥70 = Strong Match | 50–69 = Partial Match | <50 = No Match

Pipeline stages: pending_review → in_review → in_pool | not_suitable | hired

Always use tools to fetch live data before answering. When a question could involve either seeded or submitted referrals, check both. Be concise, specific, and format responses clearly with lists and scores.`;

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
            content: await executeTool(toolUse.name, toolUse.input as Record<string, unknown>),
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
    console.error("Reference chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
