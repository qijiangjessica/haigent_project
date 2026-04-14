# Data & Storage

---

## Schedule Module — Static Data (`src/data/schedule/`)

### Jobs
Two active jobs: "Director AI" (Technology, Vancouver) and "Account Manager" (Sales, Vancouver, BC). Both have `autoScore: true`, threshold 70–75.

### Candidates
Three candidates across the two jobs with AI scores of 55–67.

### Interviewers
Four interviewers with Cal.com connected status, timezones, and max interviews/day settings.

---

## Sourcing Module — Static Data (`src/data/sourcing/`)

### Roles
Two active roles: "Delivery Manager" (Data Science) and "Account Manager" (Sales), both for TMobile, Vancouver.

---

## Engee Module — Live + In-Memory Data (`src/lib/engee-store.ts`)

### Survey Store

Surveys are stored in an in-memory `Map<string, SurveyRecord>` keyed by `employee_name.toLowerCase()`. This resets on server restart and is designed to be swapped to a database without changing callers.

**SurveyRecord fields:**
```typescript
{
  id: string;                      // "survey_[timestamp]_[random]"
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
  submitted_at: string;            // ISO timestamp
}
```

### Mentor Roster (10 mentors — real Procogia staff)

| Name | Title | Department | Slack ID | Teams ID (email) |
|---|---|---|---|---|
| Sahib Badwal | Senior Software Engineer | Engineering | U_SAHIB | sahib.badwal@procogia.com |
| Siddharth Maheshwari | Data Science Lead | Data & Analytics | U_SIDDHARTH | siddharth.maheshwari@procogia.com |
| Love Patel | Senior Product Manager | Product | U_LOVE | love.patel@procogia.com |
| Rose Vermazen | Marketing Director | Marketing | U_ROSE | rose.vermazen@procogia.com |
| Swati Sood | People Operations Lead | HR | U_SWATI | swati.sood@procogia.com |
| Videesh Guduru | DevOps Engineer | Engineering | U_VIDEESH | videesh.guduru@procogia.com |
| Oisin Bates | UX Lead | Design | U_OISIN | oisin.bates@procogia.com |
| Zilai Feng | Data Scientist | Data & Analytics | U_ZILAI | Zilai@procogia.com |
| Gabriel Brock | Senior Consultant | Engineering | U_GABRIEL | gabriel.brock@procogia.com |
| Ahsaan Rizvi | Senior Data Sci Consultant III | Data & Analytics | U0ADJ36JJ2K | ahsaan.rizvi@procogia.com |

### Mentor Matching Algorithm

Scoring (highest weight first):
- Department exact match: **+20 pts**
- Department partial match: **+8 pts**
- Professional interest keyword match: **+4 pts** each
- Learning interest match: **+2 pts** each
- Personal interest match: **+2 pts** each
- Bio keyword match: case-insensitive substring

Returns top 3 mentors sorted by score descending.

---

## Onboarding — In-Memory Store (`src/lib/onboarding-store.ts`)

4 seeded employees with fields: `employee_name`, `department`, `position`, `start_date`, `onboarding_status` (`not_started` | `in_progress` | `completed`), plus task checklist (`equipment_requested`, `it_account_created`, `workspace_assigned`, `orientation_completed`, `documents_completed`, `employee_training`). IT incidents stored in a separate `Map`. Designed for drop-in DB swap.

> **Why not ServiceNow?** Onboarding data was originally intended to be read from the `x_1926120_employee_onboarding` ServiceNow table via `src/lib/servicenow.ts`. This was replaced with the local in-memory store after the ServiceNow instance going offline caused agent failures. The agent chat route (`/api/onboarding/chat`) now imports directly from `onboarding-store.ts`. `servicenow.ts` is kept for reference but is not called by any agent.

## Benefits — In-Memory Store (`src/lib/benefits-store.ts`)

12 seeded benefit plans (`BENEFIT_CATALOG`) covering: health, dental, vision, retirement, life insurance, disability, wellness, PTO, EAP, professional development, and commuter benefits. Employee inquiries stored in a `Map<string, BenefitInquiry>` with 2 seed entries. Designed for drop-in DB swap.

> **Why not ServiceNow?** Benefits catalog and inquiry data was originally intended to come from `x_1926120_employee_benefits_catalog` and `x_1926120_employee_benefits_inquiry` ServiceNow tables. Same reason as onboarding — replaced with the local store after ServiceNow instance downtime broke the agents. The agent chat route (`/api/benefits/chat`) now imports directly from `benefits-store.ts`.

---

## Payroll — Salesforce Agentforce

No local data. Conversations are proxied to a Salesforce Agentforce agent via session-based REST API calls (`/einstein/ai-agent/v1/`).

---

## Calendar — workIQ Mock Slots

When Microsoft Graph credentials are absent, `src/lib/calendar.ts` generates realistic mock slots:
- Skips weekends
- Respects `time_preference` ("morning" → 9/10/11 AM, "afternoon" → 1/2/3 PM, "flexible" → both)
- Returns 3 slots across the next 3 business days
- Confidence: 95%, reason: "Both attendees are available (suggested)"
