import type { Reference } from "@/types";

export const REFERENCES: Reference[] = [
  {
    reference_id: "REF-2026-001",
    referrer_emp_id: "EMP-005",
    referrer_name: "Aisha Malik",
    candidate_id: "CAND-001",
    candidate_name: "Alex Rivera",
    submission_date: "2026-02-10",
    referrer_note:
      "Alex is an exceptional data engineer I worked with at my previous company. Strong Python and GenAI skills, delivered multiple ML pipelines end-to-end. Highly recommended for senior technical roles.",
    status: "matched",
  },
  {
    reference_id: "REF-2026-002",
    referrer_emp_id: "EMP-012",
    referrer_name: "Daniel Osei",
    candidate_id: "CAND-002",
    candidate_name: "Priya Nair",
    submission_date: "2026-02-15",
    referrer_note:
      "Priya is a solid data analyst with good SQL and Python skills. We worked together on a reporting project. She is looking for a mid-level data role.",
    status: "in_pool",
  },
  {
    reference_id: "REF-2026-003",
    referrer_emp_id: "EMP-003",
    referrer_name: "Sarah Thompson",
    candidate_id: "CAND-003",
    candidate_name: "James Okafor",
    submission_date: "2026-03-01",
    referrer_note:
      "James is a recent graduate I mentored. He has some project experience in data science and is eager to learn. Looking for a junior role.",
    status: "verification_in_progress",
  },
];
