import { type LucideIcon } from "lucide-react";

export interface SubPage {
  name: string;
  path: string;
  icon: string;
}

export interface AIModule {
  name: string;
  slug: string;
  icon: LucideIcon;
  accentColor: string;
  enabled: boolean;
  description: string;
  subPages: SubPage[];
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  status: "active" | "draft" | "closed";
  scoredCount: number;
  scheduledCount: number;
  createdAt: string;
  scoreThreshold: number;
  autoScore: boolean;
  autoSchedule: boolean;
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  jobId: string;
  jobTitle: string;
  aiScore: number;
  status: "applied" | "scored" | "invited" | "scheduled" | "rejected";
  appliedAt: string;
}

export interface Interviewer {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  calConnected: boolean;
  isActive: boolean;
  timezone: string;
  maxInterviewsPerDay: number;
}

export interface SourcingRole {
  id: string;
  title: string;
  department: string;
  location: string;
  status: "active" | "paused" | "closed";
  companyName: string;
  experienceRequired: string;
  salaryRange: string;
  skills: string[];
  sourcedCount: number;
  qualifiedCount: number;
  contactedCount: number;
  meetingsCount: number;
  qualificationRate: number;
  responseRate: number;
  createdAt: string;
  description: string;
}

export interface SkillVerification {
  skill: string;
  status: "Verified" | "Partially Verified" | "Unverified";
  source: "LinkedIn" | "Resume" | "Assessment" | "Certification" | "GitHub" | null;
}

export interface ReferenceCandidate {
  candidate_id: string;
  reference_id: string;
  name: string;
  email: string;
  phone: string;
  current_employer: string;
  years_experience: number;
  location: string;
  availability?: "Immediate" | "2 weeks" | "1 month" | "3 months";
  skills_claimed: string[];
  skills_verified: SkillVerification[];
  candidate_score: number;
  pool_status: "pending_validation" | "verification_in_progress" | "matched" | "in_pool" | "hired" | "closed";
  linkedin_url: string | null;
  resume_uploaded: boolean;
}

export interface Reference {
  reference_id: string;
  referrer_emp_id: string;
  referrer_name: string;
  candidate_id: string;
  candidate_name: string;
  submission_date: string;
  referrer_note: string;
  status: "pending_validation" | "verification_in_progress" | "matched" | "in_pool" | "hired" | "closed";
}

export interface MatchRecord {
  match_id: string;
  candidate_id: string;
  posting_id: string;
  match_score: number;
  skill_overlap_score: number;
  experience_score: number;
  location_score: number;
  seniority_score: number;
  classification: "Strong Match" | "Partial Match" | "No Match";
  outcome: "pending_recruiter" | "interview_scheduled" | "rejected" | "hired";
  evaluated_date: string;
  triggered_by: "new_submission" | "new_posting" | "scheduled_refresh";
}

export interface TalentPoolRecord {
  pool_id: string;
  candidate_id: string;
  reference_id: string;
  date_added: string;
  date_last_evaluated: string;
  status: "Active Hold" | "Aging Review" | "Withdrawn" | "Placed";
  skill_tags: string[];
  experience_level: "Junior" | "Mid" | "Senior" | "Lead";
  location_tags: string[];
  preferred_role_tags: string[];
  match_evaluation_history: {
    posting_id: string;
    score: number;
    evaluated_date: string;
  }[];
}

export interface AuditLogEntry {
  event_id: string;
  timestamp: string;
  actor: "Employee" | "Agent" | "Recruiter" | "DeliveryManager" | "System";
  actor_id: string;
  event_type: "Submission" | "Verification" | "Match" | "Notification" | "Decision" | "StatusChange";
  entity_type: "Candidate" | "Reference" | "Position" | "Notification";
  entity_id: string;
  before_state: string | null;
  after_state: string;
  notes: string | null;
}
