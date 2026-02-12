import type { Job } from "@/types";

export const JOBS: Job[] = [
  {
    id: "job-1",
    title: "Director AI",
    department: "Technology",
    location: "Vancouver",
    status: "active",
    scoredCount: 2,
    scheduledCount: 0,
    createdAt: "2026-02-06",
    scoreThreshold: 75,
    autoScore: true,
    autoSchedule: true,
    description: "We are seeking a visionary Director of AI to lead our artificial intelligence initiatives. The ideal candidate will drive AI strategy, manage a team of ML engineers, and deliver transformative AI solutions across the organization.",
  },
  {
    id: "job-2",
    title: "Account Manager",
    department: "Sales",
    location: "Vancouver, BC",
    status: "active",
    scoredCount: 3,
    scheduledCount: 0,
    createdAt: "2026-02-05",
    scoreThreshold: 70,
    autoScore: true,
    autoSchedule: false,
    description: "We are looking for a dynamic Account Manager to join our sales team. You will manage client relationships, identify growth opportunities, and ensure customer satisfaction across your portfolio of accounts.",
  },
];
