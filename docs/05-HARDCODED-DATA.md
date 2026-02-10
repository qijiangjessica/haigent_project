# Hardcoded Data

All data is stored as TypeScript constants. No database is needed. This file documents the exact data observed on the production app that should be replicated.

---

## Schedule Module Data

### Jobs

```typescript
// src/data/schedule/jobs.ts
export const JOBS = [
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
    description: "Leading AI initiatives and strategy...",
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
    description: "Managing client accounts and relationships...",
  },
];
```

### Candidates

```typescript
// src/data/schedule/candidates.ts
export const CANDIDATES = [
  {
    id: "cand-1",
    name: "Wasantha",
    email: "wasantha@example.com",
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
```

### Interviewers

```typescript
// src/data/schedule/interviewers.ts
export const INTERVIEWERS = [
  {
    id: "int-1",
    name: "Alex Johnson",
    email: "alex.j@haigent.ai",
    title: "Full-Stack Developer",
    department: "Information Technology",
    calConnected: true,
    isActive: true,
    timezone: "America/New_York",
    maxInterviewsPerDay: 4,
  },
  {
    id: "int-2",
    name: "Priya Sharma",
    email: "priya.s@haigent.ai",
    title: "Engineering Manager",
    department: "Engineering",
    calConnected: true,
    isActive: true,
    timezone: "America/Vancouver",
    maxInterviewsPerDay: 3,
  },
  {
    id: "int-3",
    name: "David Kim",
    email: "david.k@haigent.ai",
    title: "Senior Designer",
    department: "Design",
    calConnected: false,
    isActive: true,
    timezone: "America/New_York",
    maxInterviewsPerDay: 4,
  },
  {
    id: "int-4",
    name: "Rachel Green",
    email: "rachel.g@haigent.ai",
    title: "HR Director",
    department: "Human Resources",
    calConnected: false,
    isActive: true,
    timezone: "America/Chicago",
    maxInterviewsPerDay: 5,
  },
];
```

### Dashboard Stats (Derived)

These are computed from the arrays above:
- **Active Jobs:** `JOBS.filter(j => j.status === "active").length` → **2**
- **Total Candidates:** `CANDIDATES.length` → **3**
- **Scheduled Interviews:** `0` (no interviews in demo)
- **Avg. AI Score:** `Math.round(CANDIDATES.reduce(...) / CANDIDATES.length)` → **60%**

---

## Sourcing Module Data

### Roles

```typescript
// src/data/sourcing/roles.ts
export const SOURCING_ROLES = [
  {
    id: "ROL-PeY7KEhPOZ",
    title: "Delivery Manager",
    department: "Data Science",
    location: "Vancouver",
    status: "active",
    companyName: "TMobile",
    experienceRequired: "7-10 years",
    salaryRange: "225k-275k",
    skills: ["python", "sql", "genai", "leadership"],
    sourcedCount: 0,
    qualifiedCount: 0,
    contactedCount: 0,
    meetingsCount: 0,
    qualificationRate: 0,
    responseRate: 0,
    createdAt: "2026-01-20",
    description: "Leading delivery management for data science projects...",
  },
  {
    id: "ROL-N_TspQJnOE",
    title: "Account Manager",
    department: "Sales",
    location: "Vancouver",
    status: "active",
    companyName: "TMobile",
    experienceRequired: "5-7 years",
    salaryRange: "150k-200k",
    skills: ["sales", "crm", "account-management", "communication"],
    sourcedCount: 0,
    qualifiedCount: 0,
    contactedCount: 0,
    meetingsCount: 0,
    qualificationRate: 0,
    responseRate: 0,
    createdAt: "2026-01-22",
    description: "Managing key client accounts in the sales division...",
  },
];
```

### Dashboard Stats (Derived)

- **Active Roles:** `SOURCING_ROLES.filter(r => r.status === "active").length` → **2**
- **Total Candidates:** `0`
- **Response Rate:** `0%`
- **Meetings Scheduled:** `0`

---

## Settings Data (Schedule)

```typescript
// src/data/schedule/settings.ts
export const DEFAULT_SETTINGS = {
  companyName: "Haigent Demo",
  companyWebsite: "",
  careersEmail: "",
  timezone: "America/Vancouver",
  defaultInterviewDuration: "30 minutes",
  autoScoreCandidates: true,
  defaultScoreThreshold: 70,
  emailNotifications: true,
  emailFooter: "Thank you for your interest in joining our team.",
  primaryBrandColor: "#E91E8C",
};
```

---

## Notes for Contributors

- All data files export typed arrays or objects
- Data is **read-only** — forms in the UI should show toast messages or use local React state
- When adding a new module, create a new directory under `src/data/<module-slug>/` with the module's hardcoded data
- Keep data realistic but minimal — enough to demonstrate the UI, not to simulate a production database
