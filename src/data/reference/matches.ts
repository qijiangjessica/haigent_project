import type { MatchRecord } from "@/types";

// Match scores follow the formula from SCOPE.md Section 9:
// Score = (skill_overlap × 0.50) + (experience × 0.25) + (location × 0.15) + (seniority × 0.10)
// ≥70 = Strong Match | 50–69 = Partial Match | <50 = No Match
// posting_id values reference REFERENCE_JOBS in src/data/reference/jobs.ts (mapped from SOURCING_ROLES)

export const MATCH_RECORDS: MatchRecord[] = [
  {
    match_id: "MATCH-001",
    candidate_id: "CAND-001",
    posting_id: "ROL-PeY7KEhPOZ",
    match_score: 88,
    skill_overlap_score: 90,
    experience_score: 85,
    location_score: 100,
    seniority_score: 70,
    classification: "Strong Match",
    outcome: "interview_scheduled",
    evaluated_date: "2026-02-10",
    triggered_by: "new_submission",
  },
  {
    match_id: "MATCH-002",
    candidate_id: "CAND-001",
    posting_id: "ROL-N_TspQJnOE",
    match_score: 55,
    skill_overlap_score: 50,
    experience_score: 70,
    location_score: 100,
    seniority_score: 60,
    classification: "Partial Match",
    outcome: "pending_recruiter",
    evaluated_date: "2026-02-10",
    triggered_by: "new_submission",
  },
  {
    match_id: "MATCH-003",
    candidate_id: "CAND-002",
    posting_id: "ROL-PeY7KEhPOZ",
    match_score: 48,
    skill_overlap_score: 40,
    experience_score: 60,
    location_score: 100,
    seniority_score: 50,
    classification: "No Match",
    outcome: "pending_recruiter",
    evaluated_date: "2026-02-15",
    triggered_by: "new_submission",
  },
  {
    match_id: "MATCH-004",
    candidate_id: "CAND-002",
    posting_id: "ROL-N_TspQJnOE",
    match_score: 58,
    skill_overlap_score: 55,
    experience_score: 65,
    location_score: 100,
    seniority_score: 55,
    classification: "Partial Match",
    outcome: "pending_recruiter",
    evaluated_date: "2026-02-15",
    triggered_by: "new_submission",
  },
];
