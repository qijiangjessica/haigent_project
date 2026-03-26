// ── Engee data store ────────────────────────────────────────────────────────
// Currently in-memory. Swap the Map for a DB client (Supabase, SQLite, etc.)
// without changing callers — just update the functions below.

export interface SurveyRecord {
  id: string;
  employee_name: string;
  department: string;
  professional_interests: string[];
  personal_interests: string[];
  goals_90_days: string;
  questions_for_mentor: string;
  preferred_platform: "teams" | "slack";
  preferred_meeting_time: "morning" | "afternoon" | "flexible";
  submitted_at: string;
}

export interface MentorRecord {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  slack_id?: string;
  teams_id?: string;
  bio?: string;
}

// ── Survey store ─────────────────────────────────────────────────────────────

const surveys = new Map<string, SurveyRecord>();

export function saveSurvey(
  data: Omit<SurveyRecord, "id" | "submitted_at">
): SurveyRecord {
  const record: SurveyRecord = {
    ...data,
    id: `survey_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    submitted_at: new Date().toISOString(),
  };
  // Key by employee name (lowercase) so lookups are easy
  surveys.set(record.employee_name.toLowerCase(), record);
  return record;
}

export function getSurveyByEmployee(name: string): SurveyRecord | null {
  // Exact match first
  const exact = surveys.get(name.toLowerCase());
  if (exact) return exact;
  // Partial match fallback
  for (const record of surveys.values()) {
    if (record.employee_name.toLowerCase().includes(name.toLowerCase())) {
      return record;
    }
  }
  return null;
}

export function getAllSurveys(): SurveyRecord[] {
  return Array.from(surveys.values());
}

export function deleteSurvey(employeeName: string): boolean {
  return surveys.delete(employeeName.toLowerCase());
}

// ── Mentor store (seed data — replace with DB query later) ───────────────────

export const MENTORS: MentorRecord[] = [
  {
    id: "m1",
    name: "Alex Chen",
    title: "Senior Software Engineer",
    department: "Engineering",
    email: "alex.chen@company.com",
    slack_id: "U_ALEX",
    bio: "10 years building distributed systems. Loves mentoring on system design and career growth.",
  },
  {
    id: "m2",
    name: "Jordan Lee",
    title: "Data Science Lead",
    department: "Data & Analytics",
    email: "jordan.lee@company.com",
    slack_id: "U_JORDAN",
    bio: "ML practitioner focused on NLP and recommendation systems. Happy to chat about the DS career path.",
  },
  {
    id: "m3",
    name: "Sam Rivera",
    title: "Senior Product Manager",
    department: "Product",
    email: "sam.rivera@company.com",
    slack_id: "U_SAM",
    bio: "Former engineer turned PM. Passionate about 0→1 products and cross-functional collaboration.",
  },
  {
    id: "m4",
    name: "Taylor Kim",
    title: "Marketing Director",
    department: "Marketing",
    email: "taylor.kim@company.com",
    slack_id: "U_TAYLOR",
    bio: "Brand storytelling and demand gen. Excited to mentor on GTM strategy and creative campaigns.",
  },
  {
    id: "m5",
    name: "Morgan Patel",
    title: "People Operations Lead",
    department: "HR",
    email: "morgan.patel@company.com",
    slack_id: "U_MORGAN",
    bio: "HR generalist with a focus on new hire experience and culture. Always happy to connect!",
  },
  {
    id: "m6",
    name: "Casey Nguyen",
    title: "DevOps Engineer",
    department: "Engineering",
    email: "casey.nguyen@company.com",
    slack_id: "U_CASEY",
    bio: "Infrastructure and CI/CD specialist. Can help you get up to speed on our deployment pipeline fast.",
  },
  {
    id: "m7",
    name: "Riley Thompson",
    title: "UX Lead",
    department: "Design",
    email: "riley.thompson@company.com",
    slack_id: "U_RILEY",
    bio: "User research and design systems. Love pairing with new designers and engineers on product craft.",
  },
];

export function findMentorsByDepartment(department: string): MentorRecord[] {
  const matches = MENTORS.filter((m) =>
    m.department.toLowerCase().includes(department.toLowerCase())
  );
  return matches.length > 0 ? matches : MENTORS.filter((m) => m.department === "HR");
}

export function getMentorById(id: string): MentorRecord | null {
  return MENTORS.find((m) => m.id === id) ?? null;
}
