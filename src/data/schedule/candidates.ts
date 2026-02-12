import type { Candidate } from "@/types";

export const CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    name: "Wasantha Perera",
    email: "wasantha.p@example.com",
    jobId: "job-1",
    jobTitle: "Director AI",
    aiScore: 67,
    status: "scored",
    appliedAt: "2026-02-06",
  },
  {
    id: "cand-2",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    jobId: "job-2",
    jobTitle: "Account Manager",
    aiScore: 55,
    status: "applied",
    appliedAt: "2026-02-05",
  },
  {
    id: "cand-3",
    name: "Michael Torres",
    email: "m.torres@example.com",
    jobId: "job-2",
    jobTitle: "Account Manager",
    aiScore: 58,
    status: "scored",
    appliedAt: "2026-02-05",
  },
];
