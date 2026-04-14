// ── Engee data store ────────────────────────────────────────────────────────
// Currently in-memory. Swap the Map for a DB client (Supabase, SQLite, etc.)
// without changing callers — just update the functions below.

export interface SurveyRecord {
  id: string;
  employee_name: string;
  role: string;
  department: string;
  city: string;
  country: string;
  professional_interests: string[];
  learning_interests: string[];
  personal_interests: string[];
  work_style: string[];
  communication_style: string[];
  motivations: string[];
  personality_traits: string[];
  career_stage: string;
  peak_productivity: string;
  food_preferences: string[];
  weekend_style: string[];
  conversation_topics: string[];
  life_situation: string[];
  goals_90_days: string;
  questions_for_mentor: string;
  preferred_platform: "teams" | "slack";
  preferred_meeting_time: "morning" | "afternoon" | "flexible";
  submitted_at: string;
  notes: string[];
  attrition_flagged: boolean;
  attrition_reason?: string;
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
  data: Omit<SurveyRecord, "id" | "submitted_at" | "notes" | "attrition_flagged" | "attrition_reason">
): SurveyRecord {
  const record: SurveyRecord = {
    ...data,
    id: `survey_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    submitted_at: new Date().toISOString(),
    notes: [],
    attrition_flagged: false,
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

export function addNoteToSurvey(employeeName: string, note: string): boolean {
  const record = getSurveyByEmployee(employeeName);
  if (!record) return false;
  record.notes.push(`[${new Date().toISOString().split("T")[0]}] ${note}`);
  surveys.set(record.employee_name.toLowerCase(), record);
  return true;
}

export function flagAttritionRisk(employeeName: string, reason: string): boolean {
  const record = getSurveyByEmployee(employeeName);
  if (!record) return false;
  record.attrition_flagged = true;
  record.attrition_reason = reason;
  record.notes.push(`[ATTRITION RISK ${new Date().toISOString().split("T")[0]}] ${reason}`);
  surveys.set(record.employee_name.toLowerCase(), record);
  return true;
}

// ── Mentor store (seed data — replace with DB query later) ───────────────────

export const MENTORS: MentorRecord[] = [
  {
    id: "m1",
    name: "Sahib Badwal",
    title: "Senior Software Engineer",
    department: "Engineering",
    email: "gursahib.badwal@procogia.com",
    slack_id: "U_SAHIB",
    teams_id: "gursahib.badwal@procogia.com",
    bio: "10 years building distributed systems. Loves mentoring on system design and career growth.",
  },
  {
    id: "m2",
    name: "Siddharth Maheshwari",
    title: "Data Science Lead",
    department: "Data & Analytics",
    email: "siddharth@procogia.com",
    slack_id: "U_SIDDHARTH",
    teams_id: "siddharth@procogia.com",
    bio: "ML practitioner focused on NLP and recommendation systems. Happy to chat about the DS career path.",
  },
  {
    id: "m3",
    name: "Love Patel",
    title: "Senior Product Manager",
    department: "Product",
    email: "lovekumar.patel@procogia.com",
    slack_id: "U_LOVE",
    teams_id: "lovekumar.patel@procogia.com",
    bio: "Former engineer turned PM. Passionate about 0→1 products and cross-functional collaboration.",
  },
  {
    id: "m4",
    name: "Rose Vermazen",
    title: "Marketing Director",
    department: "Marketing",
    email: "rose.vermazen@procogia.com",
    slack_id: "U_ROSE",
    teams_id: "rose.vermazen@procogia.com",
    bio: "Brand storytelling and demand gen. Excited to mentor on GTM strategy and creative campaigns.",
  },
  {
    id: "m5",
    name: "Swati Sood",
    title: "People Operations Lead",
    department: "HR",
    email: "swati@procogia.com",
    slack_id: "U_SWATI",
    teams_id: "swati@procogia.com",
    bio: "HR generalist with a focus on new hire experience and culture. Always happy to connect!",
  },
  {
    id: "m6",
    name: "Videesh Guduru",
    title: "DevOps Engineer",
    department: "Engineering",
    email: "videesh.guduru@procogia.com",
    slack_id: "U_VIDEESH",
    teams_id: "videesh.guduru@procogia.com",
    bio: "Infrastructure and CI/CD specialist. Can help you get up to speed on our deployment pipeline fast.",
  },
  {
    id: "m7",
    name: "Oisin Bates",
    title: "UX Lead",
    department: "Design",
    email: "oisin@procogia.com",
    slack_id: "U_OISIN",
    teams_id: "oisin@procogia.com",
    bio: "User research and design systems. Love pairing with new designers and engineers on product craft.",
  },
  {
    id: "m8",
    name: "Zilai Feng",
    title: "Data Scientist",
    department: "Data & Analytics",
    email: "zilai.feng@procogia.com",
    slack_id: "U_ZILAI",
    teams_id: "Zilai@procogia.com",
    bio: "Focused on machine learning and AI-driven insights. Happy to mentor on data science workflows, career growth, and navigating the analytics space.",
  },
  {
    id: "m10",
    name: "Ahsaan Rizvi",
    title: "Senior Data Science Consultant III",
    department: "Data & Analytics",
    email: "ahsaan.rizvi@procogia.com",
    slack_id: "U0ADJ36JJ2K",
    teams_id: "ahsaan.rizvi@procogia.com",
    bio: "Senior data science consultant with deep expertise in analytics and client-facing delivery. Great mentor for navigating consulting workflows, data science projects, and career growth in a consulting environment.",
  },
  {
    id: "m9",
    name: "Gabriel Brock",
    title: "Senior Consultant",
    department: "Engineering",
    email: "gabriel.brock@procogia.com",
    slack_id: "U_GABRIEL",
    teams_id: "gabriel.brock@procogia.com",
    bio: "Experienced in solution architecture and client delivery. Great at helping new team members get oriented with projects and internal processes.",
  },
];

export function findTopMentors(
  department: string,
  professionalInterests: string[],
  learningInterests: string[],
  personalInterests: string[]
): Array<{ mentor: MentorRecord; match_reason: string }> {
  const scored = MENTORS.map((mentor) => {
    let score = 0;
    const reasons: string[] = [];
    const bioText = `${mentor.bio ?? ""} ${mentor.title}`.toLowerCase();

    // Department match (highest weight)
    if (mentor.department.toLowerCase() === department.toLowerCase()) {
      score += 20;
      reasons.push(`Same department (${department})`);
    } else if (mentor.department.toLowerCase().includes(department.toLowerCase())) {
      score += 8;
      reasons.push(`Related to ${department}`);
    }

    // Professional interest keyword match against bio
    const matchedPro = professionalInterests.filter((i) =>
      bioText.includes(i.toLowerCase().split(/[\s&/]/)[0])
    );
    if (matchedPro.length > 0) {
      score += matchedPro.length * 4;
      reasons.push(`Expertise in ${matchedPro.slice(0, 2).join(" & ")}`);
    }

    // Learning interest match
    const matchedLearn = learningInterests.filter((i) =>
      bioText.includes(i.toLowerCase().split(/[\s&/]/)[0])
    );
    score += matchedLearn.length * 2;
    if (matchedLearn.length > 0 && reasons.length < 2) {
      reasons.push(`Can support your growth in ${matchedLearn[0]}`);
    }

    // Personal interest match
    const matchedPersonal = personalInterests.filter((i) =>
      bioText.includes(i.toLowerCase().split(/[\s&/]/)[0])
    );
    score += matchedPersonal.length * 2;
    if (matchedPersonal.length > 0 && reasons.length < 2) {
      reasons.push(`Shares interest in ${matchedPersonal[0]}`);
    }

    const match_reason =
      reasons.length > 0
        ? reasons.join(" · ")
        : `Experienced ${mentor.title} who can offer broader career guidance and perspective`;

    return { mentor, match_reason, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(({ mentor, match_reason }) => ({ mentor, match_reason }));
}

export function findMentorByName(name: string): MentorRecord | null {
  const lower = name.toLowerCase();
  return MENTORS.find(
    (m) => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase().split(" ")[0])
  ) ?? null;
}

export function findMentorsByDepartment(department: string): MentorRecord[] {
  const matches = MENTORS.filter((m) =>
    m.department.toLowerCase().includes(department.toLowerCase())
  );
  return matches.length > 0 ? matches : MENTORS.filter((m) => m.department === "HR");
}

export function getMentorById(id: string): MentorRecord | null {
  return MENTORS.find((m) => m.id === id) ?? null;
}
