// In-memory store for submitted referrals, recruiter decisions, audit events,
// status overrides, and scoring weights.
// Data persists across page navigations but resets on server restart.

// ── Scoring weights ────────────────────────────────────────────────

export interface ScoringWeights {
  skill: number;      // default 50
  experience: number; // default 25
  location: number;   // default 15
  seniority: number;  // default 10
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  skill: 50,
  experience: 25,
  location: 15,
  seniority: 10,
};

let scoringWeights: ScoringWeights = { ...DEFAULT_SCORING_WEIGHTS };

export function getScoringWeights(): ScoringWeights {
  return { ...scoringWeights };
}

export function setScoringWeights(weights: ScoringWeights): void {
  scoringWeights = { ...weights };
}

// ── Submitted referrals ────────────────────────────────────────────

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

const referrals: SubmittedReferral[] = [];

export function addReferral(referral: SubmittedReferral): void {
  referrals.push(referral);
}

export function getReferrals(): SubmittedReferral[] {
  return [...referrals];
}

// ── Recruiter decisions ────────────────────────────────────────────

export interface RecruiterDecision {
  candidate_id: string;
  decision: "PROCEED" | "ON_HOLD" | "NOT_SUITABLE";
  reason_code: string;
  decided_at: string;
}

const decisions = new Map<string, RecruiterDecision>();

export function setDecision(decision: RecruiterDecision): void {
  decisions.set(decision.candidate_id, decision);
}

export function getDecisions(): RecruiterDecision[] {
  return Array.from(decisions.values());
}

export function getDecision(candidateId: string): RecruiterDecision | undefined {
  return decisions.get(candidateId);
}

// ── Live audit events ──────────────────────────────────────────────

export interface LiveAuditEvent {
  event_id: string;
  timestamp: string;
  actor: string;
  actor_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  before_state: string | null;
  after_state: string;
  notes: string | null;
}

const liveAuditEvents: LiveAuditEvent[] = [];

export function addLiveAuditEvent(event: LiveAuditEvent): void {
  liveAuditEvents.push(event);
}

export function getLiveAuditEvents(entityId?: string): LiveAuditEvent[] {
  if (!entityId) return [...liveAuditEvents];
  return liveAuditEvents.filter(
    (e) => e.entity_id === entityId || e.notes?.includes(entityId)
  );
}

// ── Live match records ─────────────────────────────────────────────

export interface LiveMatchRecord {
  match_id: string;
  referral_id: string;
  candidate_name: string;
  posting_id: string;
  match_score: number;
  skill_overlap_score: number;
  experience_score: number;
  location_score: number;
  seniority_score: number;
  classification: "Strong Match" | "Partial Match" | "No Match";
  evaluated_date: string;
}

const liveMatchRecords: LiveMatchRecord[] = [];

export function addLiveMatchRecord(record: LiveMatchRecord): void {
  liveMatchRecords.push(record);
}

export function getLiveMatchRecords(referralId?: string): LiveMatchRecord[] {
  if (!referralId) return [...liveMatchRecords];
  return liveMatchRecords.filter((r) => r.referral_id === referralId);
}

// ── Live pool entries (promoted from submitted referrals) ──────────
//
// Data lineage: referral_id is the foreign key back to SubmittedReferral.
// All fields here are either copied from the referral (user_input),
// derived from LiveMatchRecord scores (ai_computed), or set at
// promotion time by a recruiter (recruiter_input).

export interface LivePoolEntry {
  pool_id: string;           // system-generated at promotion time
  referral_id: string;       // FK → SubmittedReferral.referral_id  (lineage anchor)
  candidate_name: string;    // copied from referral (user_input)
  candidate_email: string;   // copied from referral (user_input)
  years_experience: number;  // copied from referral (user_input)
  location: string;          // copied from referral (user_input)
  availability: string;      // copied from referral (user_input)
  date_added: string;        // system-generated (system)
  date_last_evaluated: string; // system-generated (system)
  status: "Active Hold" | "Aging Review" | "Withdrawn" | "Placed"; // recruiter_input
  skill_tags: string[];        // sourced from referral.skills claimed (user_input)
  experience_level: "Junior" | "Mid" | "Senior" | "Lead"; // recruiter_input
  location_tags: string[];     // recruiter_input (defaults to parsed location)
  preferred_role_tags: string[]; // recruiter_input
  match_evaluation_history: {  // sourced from LiveMatchRecord (ai_computed)
    posting_id: string;
    score: number;
    evaluated_date: string;
  }[];
  promoted_at: string;         // system-generated (system)
  promoted_by: string;         // recruiter_input (defaults to "Recruiter")
}

const livePoolEntries: LivePoolEntry[] = [];

export function addLivePoolEntry(entry: LivePoolEntry): void {
  livePoolEntries.push(entry);
}

export function getLivePoolEntries(): LivePoolEntry[] {
  return [...livePoolEntries];
}

export function getLivePoolEntry(referralId: string): LivePoolEntry | undefined {
  return livePoolEntries.find((e) => e.referral_id === referralId);
}

// ── Referral actions (not_suitable) ───────────────────────────────

const rejectedReferralIds = new Set<string>();

export function rejectReferral(referralId: string): void {
  rejectedReferralIds.add(referralId);
}

export function getRejectedReferralIds(): string[] {
  return Array.from(rejectedReferralIds);
}

// ── Status overrides ───────────────────────────────────────────────

const statusOverrides = new Map<string, string>();

export function setStatusOverride(candidateId: string, status: string): void {
  statusOverrides.set(candidateId, status);
}

export function getAllStatusOverrides(): Record<string, string> {
  return Object.fromEntries(statusOverrides);
}
