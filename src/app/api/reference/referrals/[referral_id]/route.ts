import { NextRequest, NextResponse } from "next/server";
// [ANTHROPIC - PLACEHOLDER] import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  getReferrals,
  getLiveMatchRecords,
  getEffectiveWeights,
  getLivePoolEntry,
  type LiveMatchRecord,
  classify,
} from "@/lib/reference-store";
import {
  updateReferralAndPersist, addMatchesAndPersist,
  addAuditEventAndPersist, addHiredEventAndPersist,
  addBonusFlagAndPersist, hydrateStoreFromDisk,
} from "@/lib/reference-json-persistence";
import { OPEN_JOBS, type ReferenceJob } from "@/data/reference/jobs";

// ── Scoring helpers (identical pattern to submit/rescore routes) ─────────────

function computeStaticMatchScores(
  candidate: { name: string; skills: string[]; years_experience: number; location: string; availability: string },
  jobs: ReferenceJob[],
  referralId: string,
  runIndex: number
): LiveMatchRecord[] {
  if (jobs.length === 0) return [];
  const today = new Date().toISOString().slice(0, 10);
  const candSkillsLower = candidate.skills.map((s) => s.toLowerCase().trim());
  const yoe = candidate.years_experience;

  return jobs.map((job, i) => {
    const weights = getEffectiveWeights(job.id);
    const reqSkillsLower = job.requiredSkills.map((s) => s.toLowerCase().trim());
    const matched = reqSkillsLower.filter((rs) =>
      candSkillsLower.some((cs) => cs.includes(rs) || rs.includes(cs))
    );
    const skill_overlap_score =
      reqSkillsLower.length > 0
        ? Math.min(100, Math.round((matched.length / reqSkillsLower.length) * 100))
        : candSkillsLower.length > 0 ? 50 : 25;

    let experience_score: number;
    if (yoe >= job.experienceMin && yoe <= job.experienceMax) experience_score = 90;
    else if (yoe < job.experienceMin) experience_score = Math.max(0, 90 - (job.experienceMin - yoe) * 15);
    else experience_score = Math.max(60, 90 - (yoe - job.experienceMax) * 5);

    const jobLoc = job.location.toLowerCase();
    const candLoc = (candidate.location || "").toLowerCase();
    let location_score: number;
    if (!candLoc || !jobLoc) location_score = 50;
    else if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) location_score = 100;
    else {
      const tokens = jobLoc.split(/[\s,]+/).filter((t) => t.length > 2);
      location_score = tokens.some((t) => candLoc.includes(t)) ? 70 : 30;
    }

    let seniority_score: number;
    if (yoe >= 10) seniority_score = 90;
    else if (yoe >= 6) seniority_score = 80;
    else if (yoe >= 3) seniority_score = 70;
    else seniority_score = 55;

    const match_score = Math.round(
      (skill_overlap_score * weights.skill + experience_score * weights.experience +
        location_score * weights.location + seniority_score * weights.seniority) / 100
    );
    const classification: LiveMatchRecord["classification"] =
      classify(match_score);

    return {
      match_id: `EDIT-${referralId}-R${runIndex}-${i}`,
      referral_id: referralId, candidate_name: candidate.name,
      posting_id: job.id, match_score, skill_overlap_score, experience_score,
      location_score, seniority_score, classification, evaluated_date: today,
      scoring_method: "static" as const,
    };
  });
}

async function computeAIMatchScores(
  candidate: { name: string; skills: string[]; years_experience: number; location: string; availability: string },
  jobs: ReferenceJob[],
  referralId: string,
  runIndex: number
): Promise<LiveMatchRecord[]> {
  if (jobs.length === 0) return [];
  // [ANTHROPIC - PLACEHOLDER] const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const today = new Date().toISOString().slice(0, 10);

  const jobsText = jobs.map((j) =>
    `ID: ${j.id}\nTitle: ${j.title}\nRequired Skills: ${j.requiredSkills.join(", ")}\nExperience: ${j.experienceMin}–${j.experienceMax} years\nLocation: ${j.location}\nDepartment: ${j.department}`
  ).join("\n\n");

  const prompt = `You are a talent matching AI. Score this candidate against each job posting.

CANDIDATE:
Name: ${candidate.name}
Years of Experience: ${candidate.years_experience}
Location: ${candidate.location}
Skills: ${candidate.skills.length > 0 ? candidate.skills.join(", ") : "Not provided"}
Availability: ${candidate.availability || "Not specified"}

OPEN JOBS:
${jobsText}

For each job return scores 0–100:
- skill_overlap_score: % of required skills the candidate has claimed
- experience_score: fit of years vs required range (within range = 85–100, slightly outside = 60–80, far outside = 0–40)
- location_score: 100 if same city, 70 if same country/remote eligible, 30 if different region
- seniority_score: seniority fit based on experience level vs role expectations

Respond ONLY with a valid JSON array, no other text:
[{"posting_id":"...","skill_overlap_score":85,"experience_score":90,"location_score":100,"seniority_score":75}]`;

  // [ANTHROPIC - PLACEHOLDER]
  // const response = await anthropic.messages.create({
  //   model: "claude-haiku-4-5-20251001",
  //   max_tokens: 512,
  //   messages: [{ role: "user", content: prompt }],
  // });
  // const text = response.content
  //   .filter((c): c is Anthropic.TextBlock => c.type === "text")
  //   .map((c) => c.text)
  //   .join("");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0].message.content ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in OpenAI response");

  const scores = JSON.parse(jsonMatch[0]) as Array<{
    posting_id: string; skill_overlap_score: number; experience_score: number;
    location_score: number; seniority_score: number;
  }>;

  return scores.map((s, i) => {
    const weights = getEffectiveWeights(s.posting_id);
    const match_score = Math.round(
      (s.skill_overlap_score * weights.skill + s.experience_score * weights.experience +
        s.location_score * weights.location + s.seniority_score * weights.seniority) / 100
    );
    const classification: LiveMatchRecord["classification"] =
      classify(match_score);
    return {
      match_id: `EDIT-AI-${referralId}-R${runIndex}-${i}`,
      referral_id: referralId, candidate_name: candidate.name,
      posting_id: s.posting_id, match_score, skill_overlap_score: s.skill_overlap_score,
      experience_score: s.experience_score, location_score: s.location_score,
      seniority_score: s.seniority_score, classification, evaluated_date: today,
      scoring_method: "ai" as const,
    };
  });
}

// ── Route handlers ───────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ referral_id: string }> }
) {
  hydrateStoreFromDisk();
  const { referral_id } = await params;

  const referral = getReferrals().find((r) => r.referral_id === referral_id);
  if (!referral) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }

  const matches = getLiveMatchRecords(referral_id);
  const poolEntry = getLivePoolEntry(referral_id) ?? null;

  return NextResponse.json({ referral, matches, poolEntry });
}

// Fields that trigger a re-score when changed
const RESCORE_FIELDS = new Set(["skills_claimed", "years_experience", "location", "availability", "target_job_id"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ referral_id: string }> }
) {
  try {
    hydrateStoreFromDisk();
    const { referral_id } = await params;

    const before = getReferrals().find((r) => r.referral_id === referral_id);
    if (!before) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    const body = await request.json() as Record<string, unknown>;

    // Whitelist allowed patch fields — identity fields are immutable
    const ALLOWED = new Set([
      "candidate_phone", "current_employer", "years_experience", "location",
      "availability", "linkedin_url", "target_job_id", "referrer_note",
      "resume_filename", "resume_text", "resume_format", "resume_word_count",
      "extra_filenames", "skills_claimed",
      // Recruiter-only (no extra guard here — role enforcement is UI-side for now)
      "candidate_name", "candidate_email", "referrer_name", "referrer_emp_id",
      // Pipeline promotion fields (hired_at is set automatically — not client-supplied)
      "pipeline_status", "in_review_at",
    ]);

    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (ALLOWED.has(key)) patch[key] = body[key];
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // skills_claimed: normalise comma-string → array
    if (typeof patch.skills_claimed === "string") {
      patch.skills_claimed = (patch.skills_claimed as string)
        .split(",").map((s) => s.trim()).filter(Boolean);
    }

    // years_experience: coerce to number
    if (patch.years_experience !== undefined) {
      patch.years_experience = Number(patch.years_experience) || 0;
    }

    const updated = updateReferralAndPersist(referral_id, patch as Parameters<typeof updateReferralAndPersist>[1]);
    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    const after = getReferrals().find((r) => r.referral_id === referral_id)!;

    // Write audit event if pipeline_status changed
    if (patch.pipeline_status && patch.pipeline_status !== before.pipeline_status) {
      const now = new Date().toISOString();
      const isHired = (patch.pipeline_status as string) === "hired";

      // ── T1: Capture hired_at timestamp ─────────────────────────────────────
      if (isHired) {
        // Stamp hired_at directly on the referral record
        updateReferralAndPersist(referral_id, { hired_at: now });

        // Also write to the canonical hired-events log
        addHiredEventAndPersist({
          event_id:     `HIRE-${Date.now()}`,
          entity_id:    referral_id,
          entity_type:  "referral",
          hired_at:     now,
          referral_id:  referral_id,
          submitted_at: before.submitted_at,
        });

        // ── Bonus trigger: auto-flag for HR bonus processing ───────────────
        const daysToHire = Math.max(0, Math.round(
          (new Date(now).getTime() - new Date(before.submitted_at).getTime()) / 86_400_000
        ));
        addBonusFlagAndPersist({
          flag_id:        `BONUS-${Date.now()}`,
          referral_id:    referral_id,
          candidate_name: before.candidate_name,
          referrer_name:  before.referrer_name,
          referrer_emp_id: before.referrer_emp_id,
          hired_at:       now,
          submitted_at:   before.submitted_at,
          days_to_hire:   daysToHire,
          status:         "pending",
          flagged_at:     now,
          processed_at:   null,
          notes:          null,
        });
      }

      // ── T1: Audit event for every pipeline_status transition ───────────────
      addAuditEventAndPersist({
        event_id:    `EVT-PIPELINE-${Date.now()}`,
        timestamp:   now,
        actor:       "Recruiter",
        actor_id:    "Recruiter",
        event_type:  "StatusChange",
        entity_type: "referral",
        entity_id:   referral_id,
        before_state: before.pipeline_status ?? "pending_review",
        after_state:  patch.pipeline_status as string,
        notes:       `Pipeline status: ${before.pipeline_status ?? "pending_review"} → ${patch.pipeline_status}${isHired ? " [hired_at recorded]" : ""}`,
      });
    }

    // Determine whether any scoring-relevant field changed
    const needsRescore = Object.keys(patch).some((k) => RESCORE_FIELDS.has(k));

    let matchResults: LiveMatchRecord[] = [];
    let scoringMethod: "ai" | "static" | null = null;

    if (needsRescore) {
      const existingMatches = getLiveMatchRecords(referral_id);
      const runIndex = existingMatches.length > 0
        ? Math.max(...existingMatches.map((m) => {
            const match = m.match_id.match(/R(\d+)-/);
            return match ? parseInt(match[1]) : 0;
          })) + 1
        : 1;

      const candidateInput = {
        name: after.candidate_name,
        skills: after.skills_claimed ?? [],
        years_experience: after.years_experience,
        location: after.location,
        availability: after.availability,
      };

      // [ANTHROPIC - PLACEHOLDER] if (process.env.ANTHROPIC_API_KEY) {
      if (process.env.OPENAI_API_KEY) {
        try {
          matchResults = await computeAIMatchScores(candidateInput, OPEN_JOBS, referral_id, runIndex);
          scoringMethod = "ai";
        } catch {
          matchResults = computeStaticMatchScores(candidateInput, OPEN_JOBS, referral_id, runIndex);
          scoringMethod = "static";
        }
      } else {
        matchResults = computeStaticMatchScores(candidateInput, OPEN_JOBS, referral_id, runIndex);
        scoringMethod = "static";
      }

      if (matchResults.length > 0) addMatchesAndPersist(matchResults);
    }

    return NextResponse.json({
      success: true,
      referral: after,
      rescored: needsRescore,
      scoring_method: scoringMethod,
      match_results: matchResults,
    });
  } catch (error) {
    console.error("Referral PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
