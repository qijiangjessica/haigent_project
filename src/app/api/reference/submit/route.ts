import { NextRequest, NextResponse } from "next/server";
import { addReferral, getReferrals, SubmittedReferral } from "@/lib/reference-store";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";

function generateReferralId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REF-${datePart}-${randPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      referrerName, referrerEmpId,
      candidateName, candidateEmail, candidatePhone,
      currentEmployer, yearsExperience, location, availability,
      linkedinUrl, targetJobId, referrerNote,
      resumeFilename, extraFilenames,
    } = body;

    if (!referrerName || !candidateName || !candidateEmail || !referrerNote) {
      return NextResponse.json(
        { error: "referrerName, candidateName, candidateEmail, and referrerNote are required" },
        { status: 400 }
      );
    }

    // Check for duplicate email in seeded candidates
    const duplicateSeeded = REFERENCE_CANDIDATES.find(
      (c) => c.email.toLowerCase() === candidateEmail.toLowerCase()
    );

    // Also check submitted referrals in this session
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
      duplicate_candidate_id:
        duplicateSeeded?.candidate_id ?? null,
    };

    addReferral(referral);

    return NextResponse.json({
      success: true,
      referral_id: referral.referral_id,
      is_duplicate: referral.is_duplicate,
      duplicate_candidate_id: referral.duplicate_candidate_id,
    });
  } catch (error) {
    console.error("Reference submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ referrals: getReferrals() });
}
