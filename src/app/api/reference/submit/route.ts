import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getReferrals, getScoringWeights, getEffectiveWeights, type LiveMatchRecord,
  addReferral, addLiveMatchRecord, addLivePoolEntry,
  setDecision, rejectReferral, addLiveAuditEvent,
  setStatusOverride, setScoringWeights, setJobWeightOverride,
} from "@/lib/reference-store";
import { addReferralAndPersist, addMatchesAndPersist, loadFromDisk } from "@/lib/reference-json-persistence";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { OPEN_JOBS, type ReferenceJob } from "@/data/reference/jobs";
import type { SubmittedReferral } from "@/lib/reference-store";

function generateReferralId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${datePart}-${randPart}`;
}

// ── Static (rule-based) scoring ─────────────────────────────────────────────
// Used when ANTHROPIC_API_KEY is absent or unavailable.
// Scores are derived purely from keyword matching, experience range checks,
// and location string comparison — no external API call required.

function computeStaticMatchScores(
  candidate: {
    name: string;
    skills: string[];
    years_experience: number;
    location: string;
    availability: string;
  },
  jobs: ReferenceJob[],
  referralId: string
): LiveMatchRecord[] {
  if (jobs.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);
  const candSkillsLower = candidate.skills.map((s) => s.toLowerCase().trim());
  const yoe = candidate.years_experience;

  return jobs.map((job, i) => {
    // Use per-job override if set, otherwise fall back to global weights
    const weights = getEffectiveWeights(job.id);

    // 1. Skill overlap — ratio of required skills the candidate has claimed
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

    // 2. Experience — penalise under/over relative to job range
    let experience_score: number;
    if (yoe >= job.experienceMin && yoe <= job.experienceMax) {
      experience_score = 90;
    } else if (yoe < job.experienceMin) {
      experience_score = Math.max(0, 90 - (job.experienceMin - yoe) * 15);
    } else {
      experience_score = Math.max(60, 90 - (yoe - job.experienceMax) * 5);
    }

    // 3. Location — token overlap between candidate and job location strings
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

    // 4. Seniority — derived from years of experience
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
      match_id: `STATIC-${referralId}-${i}`,
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

// ── AI (Claude) scoring ─────────────────────────────────────────────────────
// Used when ANTHROPIC_API_KEY is present.
// Delegates scoring to claude-haiku; falls back to static on any error.

async function computeAIMatchScores(
  candidate: {
    name: string;
    skills: string[];
    years_experience: number;
    location: string;
    availability: string;
  },
  jobs: ReferenceJob[],
  referralId: string
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
      match_id: `AI-${referralId}-${i}`,
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

// ── Route handlers ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      referrerName, referrerEmpId,
      candidateName, candidateEmail, candidatePhone,
      currentEmployer, yearsExperience, location, availability,
      skills, linkedinUrl, targetJobId, referrerNote,
      resumeFilename, resumeText, resumeFormat, resumeWordCount, extraFilenames,
    } = body;

    if (!referrerName || !candidateName || !candidateEmail || !referrerNote) {
      return NextResponse.json(
        { error: "referrerName, candidateName, candidateEmail, and referrerNote are required" },
        { status: 400 }
      );
    }

    const duplicateSeeded = REFERENCE_CANDIDATES.find(
      (c) => c.email.toLowerCase() === candidateEmail.toLowerCase()
    );
    const duplicateSubmitted = getReferrals().find(
      (r) => r.candidate_email.toLowerCase() === candidateEmail.toLowerCase()
    );
    const duplicate = duplicateSeeded ?? duplicateSubmitted ?? null;

    const skillList =
      typeof skills === "string"
        ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(skills)
        ? skills
        : [];


    const referral: SubmittedReferral = {
      referral_id: generateReferralId(),
      submitted_at: new Date().toISOString(),
      referrer_name: referrerName,
      referrer_emp_id: referrerEmpId ?? "",
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      candidate_phone: candidatePhone ?? "",
      current_employer: currentEmployer ?? "",
      years_experience: Number(yearsExperience) || 0,
      location: location ?? "",
      availability: availability ?? "",
      linkedin_url: linkedinUrl ?? "",
      target_job_id: targetJobId ?? "pool",
      referrer_note: referrerNote,
      resume_filename: resumeFilename ?? null,
      resume_text: resumeText ?? null,
      resume_format: resumeFormat ?? null,
      resume_word_count: resumeWordCount ?? null,
      extra_filenames: extraFilenames ?? [],
      is_duplicate: !!duplicate,
      duplicate_candidate_id: duplicateSeeded?.candidate_id ?? null,
      skills_claimed: skillList,
    };

    // Persist referral to store + disk
    addReferralAndPersist(referral);

    const candidateInput = {
      name: candidateName,
      skills: skillList,
      years_experience: Number(yearsExperience) || 0,
      location: location ?? "",
      availability: availability ?? "",
    };

    let matchResults: LiveMatchRecord[] = [];
    let scoringMethod: "ai" | "static" = "static";

    if (process.env.ANTHROPIC_API_KEY) {
      // API key present — attempt AI scoring, fall back to static on failure
      try {
        matchResults = await computeAIMatchScores(candidateInput, OPEN_JOBS, referral.referral_id);
        scoringMethod = "ai";
      } catch (err) {
        console.error("AI scoring failed, falling back to static scoring:", err);
        matchResults = computeStaticMatchScores(candidateInput, OPEN_JOBS, referral.referral_id);
        scoringMethod = "static";
      }
    } else {
      // No API key — use static scoring directly
      console.info("ANTHROPIC_API_KEY not set — using static (rule-based) scoring.");
      matchResults = computeStaticMatchScores(candidateInput, OPEN_JOBS, referral.referral_id);
      scoringMethod = "static";
    }

    // Persist all match records to store + disk in one batch write
    if (matchResults.length > 0) {
      addMatchesAndPersist(matchResults);
    }

    return NextResponse.json({
      success: true,
      referral_id: referral.referral_id,
      is_duplicate: referral.is_duplicate,
      duplicate_candidate_id: referral.duplicate_candidate_id,
      match_results: matchResults,
      scoring_method: scoringMethod,
    });
  } catch (error) {
    console.error("Reference submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  // Hydrate from disk if the in-memory store was cleared (e.g. HMR in dev)
  if (getReferrals().length === 0) {
    try {
      const snap = loadFromDisk();
      for (const r of snap.referrals)     addReferral(r);
      for (const m of snap.matches)       addLiveMatchRecord(m);
      for (const p of snap.poolEntries)   addLivePoolEntry(p);
      for (const d of snap.decisions)     setDecision(d);
      for (const id of snap.rejectedIds)  rejectReferral(id);
      for (const e of snap.auditEvents)   addLiveAuditEvent(e);
      for (const [k, v] of Object.entries(snap.statusOverrides)) setStatusOverride(k, v);
      setScoringWeights(snap.scoringWeights);
      for (const [k, v] of Object.entries(snap.jobWeightOverrides)) setJobWeightOverride(k, v);
    } catch { /* no disk data yet */ }
  }
  return NextResponse.json({ referrals: getReferrals() });
}
