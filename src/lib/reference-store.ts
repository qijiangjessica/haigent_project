// In-memory store for submitted referrals and recruiter decisions.
// Data persists across page navigations but resets on server restart.

export interface SubmittedReferral {
  referral_id: string;
  submitted_at: string;
  referrer_name: string;
  referrer_emp_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  current_employer: string;
  years_experience: number;
  location: string;
  availability: string;
  linkedin_url: string;
  target_job_id: string;
  referrer_note: string;
  resume_filename: string | null;
  extra_filenames: string[];
  is_duplicate: boolean;
  duplicate_candidate_id: string | null;
}

export interface RecruiterDecision {
  candidate_id: string;
  decision: "PROCEED" | "ON_HOLD" | "NOT_SUITABLE";
  reason_code: string;
  decided_at: string;
}

const referrals: SubmittedReferral[] = [];
const decisions = new Map<string, RecruiterDecision>();

export function addReferral(referral: SubmittedReferral): void {
  referrals.push(referral);
}

export function getReferrals(): SubmittedReferral[] {
  return [...referrals];
}

export function setDecision(decision: RecruiterDecision): void {
  decisions.set(decision.candidate_id, decision);
}

export function getDecisions(): RecruiterDecision[] {
  return Array.from(decisions.values());
}

export function getDecision(candidateId: string): RecruiterDecision | undefined {
  return decisions.get(candidateId);
}
