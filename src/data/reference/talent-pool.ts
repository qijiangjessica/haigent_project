import type { TalentPoolRecord } from "@/types";

export const TALENT_POOL: TalentPoolRecord[] = [
  {
    pool_id: "POOL-001",
    candidate_id: "CAND-002",
    reference_id: "REF-2026-002",
    date_added: "2026-02-15",
    date_last_evaluated: "2026-03-20",
    status: "Active Hold",
    skill_tags: ["Python", "SQL", "Data Analysis", "Tableau"],
    experience_level: "Mid",
    location_tags: ["Vancouver", "Remote"],
    preferred_role_tags: ["Data Analyst", "Business Intelligence", "Reporting"],
    match_evaluation_history: [
      { posting_id: "ROL-PeY7KEhPOZ", score: 48, evaluated_date: "2026-02-15" },
      { posting_id: "ROL-N_TspQJnOE", score: 58, evaluated_date: "2026-02-15" },
    ],
  },
];
