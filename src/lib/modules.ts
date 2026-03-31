import {
  Calendar,
  Search,
  ClipboardCheck,
  UserPlus,
  Heart,
  DollarSign,
  Users,
} from "lucide-react";
import type { AIModule } from "@/types";

export const AI_MODULES: AIModule[] = [
  {
    name: "Schedule",
    slug: "schedule",
    icon: Calendar,
    accentColor: "brand-pink",
    enabled: true,
    description: "Automated interview scheduling with AI candidate scoring",
    subPages: [
      { name: "Dashboard", path: "/schedule", icon: "analytics-dashboard" },
      { name: "Jobs", path: "/schedule/jobs", icon: "HR" },
      { name: "Candidates", path: "/schedule/candidates", icon: "team" },
      { name: "Interviews", path: "/schedule/interviews", icon: "checklist" },
      { name: "Interviewers", path: "/schedule/interviewers", icon: "team" },
    ],
  },
  {
    name: "Sourcing",
    slug: "sourcing",
    icon: Search,
    accentColor: "brand-gold",
    enabled: true,
    description: "Automated candidate sourcing with AI screening and outreach",
    subPages: [
      { name: "Dashboard", path: "/sourcing", icon: "analytics-dashboard" },
      { name: "Roles", path: "/sourcing/roles", icon: "HR" },
      { name: "Candidates", path: "/sourcing/candidates", icon: "team" },
      { name: "Outreach", path: "/sourcing/outreach", icon: "user-communication" },
      { name: "Meetings", path: "/sourcing/meetings", icon: "checklist" },
    ],
  },
  {
    name: "Reference",
    slug: "reference",
    icon: ClipboardCheck,
    accentColor: "brand-teal",
    enabled: false,
    description: "Automated reference check workflows",
    subPages: [],
  },
  {
    name: "Onboarding",
    slug: "onboarding",
    icon: UserPlus,
    accentColor: "brand-lime",
    enabled: true,
    description: "AI-powered onboarding assistant connected to ServiceNow Virtual Agent",
    subPages: [
      { name: "Dashboard", path: "/onboarding", icon: "analytics-dashboard" },
    ],
  },
  {
    name: "Benefits",
    slug: "benefits",
    icon: Heart,
    accentColor: "brand-yellow",
    enabled: true,
    description: "AI-powered benefits assistant connected to ServiceNow",
    subPages: [
      { name: "Dashboard", path: "/benefits", icon: "analytics-dashboard" },
    ],
  },
  {
    name: "Payroll",
    slug: "payroll",
    icon: DollarSign,
    accentColor: "brand-cyan",
    enabled: true,
    description: "AI-powered payroll assistant connected to Salesforce Agentforce",
    subPages: [
      { name: "AI Assistant", path: "/payroll", icon: "analytics-dashboard" },
    ],
  },
  {
    name: "Engee",
    slug: "engee",
    icon: Users,
    accentColor: "brand-pink",
    enabled: true,
    description: "Employee engagement platform",
    subPages: [],
  },
];
