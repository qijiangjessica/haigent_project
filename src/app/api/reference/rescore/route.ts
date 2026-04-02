import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getReferrals,
  getLiveMatchRecords,
  getEffectiveWeights,
  type LiveMatchRecord,
} from "@/lib/reference-store";
import { addMatchesAndPersist } from "@/lib/reference-json-persistence";
import { OPEN_JOBS, type ReferenceJob } from "@/data/reference/jobs";

// ── Static scoring (mirrors submit route) ───────────────────────────────────

function computeStaticMatchScores(
  candidate: {
    name: string;
    skills: string[];
    years_experience: number;
    location: string;
    availability: string;
  },
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
        : candSkillsLower.length > 0
        ? 50
        : 25;

    let experience_score: number;
    if (yoe >= job.experienceMin && yoe <= job.experienceMax) {
      experience_score = 90;
    } else if (yoe < job.experienceMin) {
      experience_score = Math.max(0, 90 - (job.experienceMin - yoe) * 15);
    } else {
      experience_score = Math.max(60, 90 - (yoe - job.experienceMax) * 5);
    }

    const jobLoc = job.location.toLowerCase();
    const candLoc = (candidate.location || "").toLowerCase();
    let location_score: number;
    if (!candLoc || !jobLoc) {
      location_score = 50;
    } else if (candLoc.includes(jobLoc) || jobLoc.includes(candLoc)) {
      location_score = 100;
    } else {
      const tokens = jobLoc.split(/[\s,]+/).filter((t) => t.length > 2);
      location_score = tokens.some((t) => candLoc.includes(t)) ? 70 : 30;
    }

    let seniority_score: number;
    if (yoe >= 10) seniority_score = 90;
    else if (yoe >= 6) seniority_score = 80;
    else if (yoe >= 3) seniority_score = 70;
    else seniority_score = 55;

    const match_score = Math.round(
      (skill_overlap_score * weights.skill +
        experience_score * weights.experience +
        location_score * weights.location +
        seniority_score * weights.seniority) /
        100
    );

    const classification: LiveMatchRecord["classification"] =
      match_score >= 70 ? "Strong Match" : match_score >= 50 ? "Partial Match" : "No Match";

    return {
      match_id: `RESCORE-${referralId}-R${runIndex}-${i}`,
      referral_id: referralId,
      candidate_name: candidate.name,
      posting_id: job.id,
      match_score,
      skill_overlap_score,
      experience_score,
      location_score,
      seniority_score,
      classification,
      evaluated_date: today,
      scoring_method: "static" as const,
    };
  });
}

// ── AI scoring ───────────────────────────────────────────────────────────────

async function computeAIMatchScores(
  candidate: {
    name: string;
    skills: string[];
    years_experience: number;
    location: string;
    availability: string;
  },
  jobs: ReferenceJob[],
  referralId: string,
  runIndex: number
): Promise<LiveMatchRecord[]> {
  if (jobs.length === 0) return [];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today = new Date().toISOString().slice(0, 10);

  const jobsText = jobs
    .map(
      (j) =>
        `ID: ${j.id}\nTitle: ${j.title}\nRequired Skills: ${j.requiredSkills.join(", ")}\nExperience: ${j.experienceMin}–${j.experienceMax} years\nLocation: ${j.location}\nDepartment: ${j.department}`
    )
    .join("\n\n");

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

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in Claude response");

  const scores = JSON.parse(jsonMatch[0]) as Array<{
    posting_id: string;
    skill_overlap_score: number;
    experience_score: number;
    location_score: number;
    seniority_score: number;
  }>;

  return scores.map((s, i) => {
    const weights = getEffectiveWeights(s.posting_id);
    const match_score = Math.round(
      (s.skill_overlap_score * weights.skill +
        s.experience_score * weights.experience +
        s.location_score * weights.location +
        s.seniority_score * weights.seniority) /
        100
    );
    const classification: LiveMatchRecord["classification"] =
      match_score >= 70 ? "Strong Match" : match_score >= 50 ? "Partial Match" : "No Match";

    return {
      match_id: `RESCORE-AI-${referralId}-R${runIndex}-${i}`,
      referral_id: referralId,
      candidate_name: candidate.name,
      posting_id: s.posting_id,
      match_score,
      skill_overlap_score: s.skill_overlap_score,
      experience_score: s.experience_score,
      location_score: s.location_score,
      seniority_score: s.seniority_score,
      classification,
      evaluated_date: today,
      scoring_method: "ai" as const,
    };
  });
}

// ── POST /api/reference/rescore ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { referral_id: string; skills?: string[] };

    if (!body.referral_id) {
      return NextResponse.json({ error: "referral_id is required" }, { status: 400 });
    }

    // Find the referral
    const referral = getReferrals().find((r) => r.referral_id === body.referral_id);
    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Skills: use overridden list if provided, otherwise fall back to stored skills
    const skills = body.skills ?? referral.skills_claimed ?? [];

    // Determine the run index (how many times has this been scored before)
    const existingMatches = getLiveMatchRecords().filter(
      (m) => m.referral_id === body.referral_id
    );
    const runIndex = existingMatches.length > 0
      ? Math.max(...existingMatches.map((m) => {
          const match = m.match_id.match(/R(\d+)-/);
          return match ? parseInt(match[1]) : 0;
        })) + 1
      : 1;

    const candidateInput = {
      name: referral.candidate_name,
      skills,
      years_experience: referral.years_experience,
      location: referral.location,
      availability: referral.availability,
    };

    let matchResults: LiveMatchRecord[] = [];
    let scoringMethod: "ai" | "static" = "static";

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        matchResults = await computeAIMatchScores(candidateInput, OPEN_JOBS, referral.referral_id, runIndex);
        scoringMethod = "ai";
      } catch (err) {
        console.error("AI re-scoring failed, falling back to static:", err);
        matchResults = computeStaticMatchScores(candidateInput, OPEN_JOBS, referral.referral_id, runIndex);
      }
    } else {
      matchResults = computeStaticMatchScores(candidateInput, OPEN_JOBS, referral.referral_id, runIndex);
    }

    if (matchResults.length > 0) {
      addMatchesAndPersist(matchResults);
    }

    return NextResponse.json({
      success: true,
      referral_id: referral.referral_id,
      scoring_method: scoringMethod,
      run_index: runIndex,
      match_results: matchResults,
    });
  } catch (error) {
    console.error("Re-score error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
