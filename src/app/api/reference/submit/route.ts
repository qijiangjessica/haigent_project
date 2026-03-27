import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  addReferral, getReferrals, SubmittedReferral,
  addLiveMatchRecord, LiveMatchRecord, getScoringWeights,
} from "@/lib/reference-store";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { OPEN_JOBS, ReferenceJob } from "@/data/reference/jobs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function generateReferralId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${datePart}-${randPart}`;
}

async function computeMatchScores(
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

  const weights = getScoringWeights();
  const today = new Date().toISOString().slice(0, 10);

  return scores.map((s, i) => {
    const matchScore = Math.round(
      (s.skill_overlap_score * weights.skill +
        s.experience_score * weights.experience +
        s.location_score * weights.location +
        s.seniority_score * weights.seniority) /
        100
    );
    const classification: LiveMatchRecord["classification"] =
      matchScore >= 70 ? "Strong Match" : matchScore >= 50 ? "Partial Match" : "No Match";

    return {
      match_id: `LIVE-${referralId}-${i}`,
      referral_id: referralId,
      candidate_name: candidate.name,
      posting_id: s.posting_id,
      match_score: matchScore,
      skill_overlap_score: s.skill_overlap_score,
      experience_score: s.experience_score,
      location_score: s.location_score,
      seniority_score: s.seniority_score,
      classification,
      evaluated_date: today,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      referrerName, referrerEmpId,
      candidateName, candidateEmail, candidatePhone,
      currentEmployer, yearsExperience, location, availability,
      skills, linkedinUrl, targetJobId, referrerNote,
      resumeFilename, extraFilenames,
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
      extra_filenames: extraFilenames ?? [],
      is_duplicate: !!duplicate,
      duplicate_candidate_id: duplicateSeeded?.candidate_id ?? null,
    };

    addReferral(referral);

    // Compute live match scores (non-blocking — referral is saved regardless)
    let matchResults: LiveMatchRecord[] = [];
    try {
      const skillList = typeof skills === "string"
        ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(skills) ? skills : [];

      matchResults = await computeMatchScores(
        {
          name: candidateName,
          skills: skillList,
          years_experience: Number(yearsExperience) || 0,
          location: location ?? "",
          availability: availability ?? "",
        },
        OPEN_JOBS,
        referral.referral_id
      );

      for (const mr of matchResults) {
        addLiveMatchRecord(mr);
      }
    } catch (err) {
      console.error("Live match scoring failed (referral still saved):", err);
    }

    return NextResponse.json({
      success: true,
      referral_id: referral.referral_id,
      is_duplicate: referral.is_duplicate,
      duplicate_candidate_id: referral.duplicate_candidate_id,
      match_results: matchResults,
    });
  } catch (error) {
    console.error("Reference submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ referrals: getReferrals() });
}
