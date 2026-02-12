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
