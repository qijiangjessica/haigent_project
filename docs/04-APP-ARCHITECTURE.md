# Application Architecture

## Next.js App Router Structure

```
app/
├── layout.tsx                    # Root layout (fonts, body, providers)
├── page.tsx                      # Redirects to /schedule
│
├── (dashboard)/                  # Dashboard route group (sidebar layout)
│   ├── layout.tsx                # Sidebar + header + main content area
│   │
│   ├── schedule/                 # Schedule AI Agent module
│   │   ├── page.tsx
│   │   ├── jobs/page.tsx
│   │   ├── jobs/[id]/page.tsx
│   │   ├── candidates/page.tsx
│   │   ├── interviews/page.tsx
│   │   ├── interviewers/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── sourcing/                 # Sourcing AI Agent module
│   │   ├── page.tsx
│   │   ├── roles/page.tsx
│   │   ├── roles/[id]/page.tsx
│   │   ├── candidates/page.tsx
│   │   ├── outreach/page.tsx
│   │   └── meetings/page.tsx
│   │
│   ├── reference/page.tsx        # Coming Soon
│   ├── onboarding/page.tsx       # Built — AI Assistant + dashboard (onboarding-store)
│   ├── benefits/page.tsx         # Built — AI Assistant + dashboard (benefits-store)
│   ├── payroll/page.tsx          # Built — Salesforce Agentforce AI Assistant
│   └── engee/page.tsx            # Built — Employee Engagement Agent (LangGraph)
│
└── api/                          # Backend API routes
    ├── engee/
    │   ├── chat/route.ts         # Main Engee agent (Claude + 9 tools)
    │   ├── survey/route.ts       # GET/POST survey CRUD
    │   └── mentor-suggest/route.ts  # Mentor matching endpoint
    ├── benefits/
    │   ├── chat/route.ts         # Benefits AI chat (Claude + benefits-store)
    │   └── records/route.ts      # Benefits catalog + inquiries from benefits-store
    ├── onboarding/
    │   ├── chat/route.ts         # Onboarding AI chat (Claude + onboarding-store)
    │   └── records/route.ts      # Onboarding records from onboarding-store
    ├── agent/route.ts            # Payroll — Salesforce Agentforce sessions
    └── servicenow/               # ServiceNow proxy (available but not used by agents)
```

## Engee Agent Architecture

Engee is built on **LangGraph** (`@langchain/langgraph`) — a `StateGraph` with two nodes (`agent` and `tools`) replaces any custom agentic loop:

```
__start__
    ↓
[ agent node ] ←─────────────────────┐
  ChatAnthropic.invoke(messages)      │
    ↓                                 │
shouldContinue()                      │
  ├── tool_calls present? → [ tools node ]
  │     ToolNode executes             │
  │     DynamicStructuredTool(s) ─────┘
  └── no tool_calls? → END
```

### Engee Tools (9 total)

| Tool | Purpose |
|---|---|
| `get_employee_engagement` | Read survey + attrition flag from `engee-store` |
| `get_team_engagement_summary` | All surveyed employees from `engee-store` |
| `submit_interest_survey` | Save survey to `engee-store` |
| `find_mentor_match` | Match employee to mentor by department + interests |
| `find_mentor_by_name` | Look up mentor contact details from roster |
| `find_available_meeting_slots` | **workIQ** — Microsoft Graph `findMeetingTimes`, returns 3 open 30-min slots |
| `schedule_coffee_chat` | Send Teams Adaptive Card or Slack webhook message with suggested slots |
| `add_engagement_note` | Append check-in note to `engee-store` |
| `flag_attrition_risk` | Mark employee at-risk in `engee-store` |

### workIQ Calendar Flow

```
find_available_meeting_slots
  ├── MICROSOFT_TENANT_ID set?
  │     ├── Yes → getGraphToken() → POST /users/{email}/findMeetingTimes
  │     └── No  → getMockSlots() (realistic fallback)
  └── Returns: { slots: MeetingSlot[], source: "graph" | "mock" }
```

### Coffee Chat Scheduling Flow

```
1. Employee asks to schedule a coffee chat
2. Engee asks for employee's work email
3. find_available_meeting_slots → 3 suggested time slots
4. Employee picks a slot
5. schedule_coffee_chat →
     Teams: Adaptive Card with FactSet (name, mentor, professional interests,
            personal interests, preferred time, 3 suggested slots, open calendar action)
     Slack: Formatted text with bullet-list slots
```

## Layout Hierarchy

```
RootLayout
└── (dashboard) layout → sidebar + header + main content
    ├── Sidebar (fixed left, module navigation)
    ├── Header (sticky top)
    └── <main> content area
        └── Module pages
```

## Sidebar Navigation System

Driven by `src/lib/modules.ts` (`AI_MODULES` array). Each module has:

```typescript
{
  name: string;
  slug: string;
  icon: LucideIcon;
  accentColor: string;   // used for active highlight: bg-${accentColor}
  enabled: boolean;      // false = locked with lock icon
  description: string;
  subPages: SubPage[];
}
```

Current accent colors by module:
- Schedule → `brand-pink`
- Sourcing → `brand-gold`
- Reference → `brand-teal` (locked)
- Onboarding → `brand-lime`
- Benefits → `brand-yellow`
- Payroll → `brand-cyan`
- Engee → `brand-lime`

## Key Libraries

| File | Purpose |
|---|---|
| `src/lib/engee-store.ts` | In-memory survey store, mentor roster (10 Procogia staff), matching algorithm |
| `src/lib/benefits-store.ts` | In-memory benefits catalog (12 plans) + inquiry store |
| `src/lib/onboarding-store.ts` | In-memory onboarding records (4 employees) + IT incident store |
| `src/lib/calendar.ts` | Microsoft Graph API auth + `findMeetingTimes` + mock slot fallback |
| `src/lib/servicenow.ts` | ServiceNow REST API helpers — **not used by agents**; replaced by local stores (see below) |
| `src/lib/salesforce.ts` | Salesforce Agentforce session management |
| `src/lib/modules.ts` | Sidebar navigation config |
| `src/lib/utils.ts` | `cn()` helper (clsx + twMerge) |

## Reference Module Architecture

The Reference module is a full-stack employee referral platform. It is self-contained and does not depend on ServiceNow or Salesforce.

### Route Structure

```
app/(dashboard)/reference/
├── page.tsx                          # Dashboard — pipeline stats, quick actions
├── submit/page.tsx                   # Referral submission form
├── candidates/
│   ├── page.tsx                      # Candidate pipeline — scoring, decisions, bulk actions
│   └── [id]/page.tsx                 # Individual candidate detail
├── referrals/
│   └── [referral_id]/
│       ├── page.tsx                  # Referral detail view
│       └── edit/page.tsx             # Edit referral fields
├── pool/page.tsx                     # Talent pool management
├── jobs/page.tsx                     # Open job postings
├── scoring-config/page.tsx           # Global + per-job scoring weights
└── chat/page.tsx                     # AI chat interface for the referral agent
```

### API Routes

```
app/api/reference/
├── submit/          POST — submit referral, run scoring, fire R1/R2/E1/E2/C1 emails
├── records/         GET  — list all referrals
├── referrals/[id]/  GET  — single referral detail
│                    PATCH — edit referral fields, triggers rescore if scoring fields change
├── decisions/       POST — PROCEED / ON_HOLD / NOT_SUITABLE decision, fires E4 email
│                    GET  — list all decisions
├── status/          POST — status override (matched/closed/on_hold/hired), fires E4/E5 emails
│                    GET  — list all overrides
├── rescore/         POST — re-run scoring, fires R2/A2 emails on improvement
├── promote-to-pool/ POST — promote to talent pool, fires R3/E(pool)/C2 emails
│                    GET  — list pool entries
├── referral-actions/POST — reject referral (not_suitable), fires R4 email
│                    GET  — list rejected IDs
├── contacts/        POST — log recruiter contact event, fires E3 email
│                    GET  — contacts by referral_id
├── contacts/[id]/   PATCH — update contact status
├── scoring-config/  GET/PUT — global scoring weights
├── job-weights/     GET/POST — per-job weight overrides
├── live-matches/    GET  — all match records
├── audit/           POST — append audit event
│                    GET  — full audit trail
├── resume-parse/    POST — extract structured data from uploaded resume (Claude AI)
├── digest/          POST — send stale referral digest email (R5, cron-callable)
│                    GET  — preview which referrals would be included
└── chat/            POST — streaming AI chat for the referral agent
```

### Data Persistence

No database. All state is written to JSON files under `src/data/reference/json/`:

```
src/data/reference/json/
├── referrals.json          # Submitted referrals
├── matches.json            # Match score records
├── pool-entries.json       # Talent pool entries
├── decisions.json          # Recruiter decisions
├── rejected-ids.json       # Rejected referral IDs
├── audit-events.json       # Full audit trail
├── status-overrides.json   # Manual status overrides
├── scoring-weights.json    # Global scoring weights
├── job-weight-overrides.json # Per-job weight overrides
├── contacts.json           # Recruiter contact events
└── notification-log.json   # Email send history (all attempts)
```

The in-memory store (`src/lib/reference-store.ts`) is hydrated from disk at the start of each API request via `hydrateIfEmpty()`. Writes go to both the store and disk atomically.

### Scoring System

Two modes — selected automatically based on environment:

| Mode | When used | How |
|---|---|---|
| AI scoring | `ANTHROPIC_API_KEY` is set | Claude Haiku evaluates candidate vs all open jobs, returns JSON scores |
| Static scoring | No API key, or AI fails | Rule-based: skill keyword overlap, experience range check, location token match, seniority bands |

Both modes produce scores for: `skill_overlap`, `experience`, `location`, `seniority`. A weighted average produces `match_score` (0–100) and `classification` (Strong Match ≥ 70, Partial Match ≥ 50, No Match < 50). Weights are configurable globally and per-job.

### Email Notification System

Transport: Microsoft 365 SMTP (`smtp.office365.com:587`, STARTTLS) via Nodemailer.

All sends go through `src/lib/email.ts → sendEmail()` which:
1. Checks `src/data/reference/notification-prefs.json` — skips silently if type is set to `false`
2. Falls back to console-log if `SMTP_USER`/`SMTP_PASSWORD` are missing (dev mode)
3. Routes through Mailpit if `MAILPIT_HOST` env var is set (local SMTP catcher, no real sends)
4. Appends every attempt (success or failure) to `notification-log.json`

| Env var | Purpose |
|---|---|
| `SMTP_HOST` | SMTP server (default: `smtp.office365.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_USER` | SMTP username / sender address |
| `SMTP_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Display name + address for From header |
| `RECRUITER_EMAIL` | Default recruiter inbox for all recruiter notifications |
| `DEV_RECIPIENT_OVERRIDE` | Redirect all emails to one address during testing |
| `MAILPIT_HOST` | If set, routes all mail through local Mailpit catcher |
| `MAILPIT_PORT` | Mailpit SMTP port (default: `1025`) |

Notification matrix:

| ID | Recipient | Trigger route |
|---|---|---|
| R1 | Recruiter | `submit` — new referral received |
| R2 | Recruiter | `submit` + `rescore` — strong/partial match found |
| R3 | Recruiter | `promote-to-pool` |
| R4 | Recruiter | `referral-actions` — rejection confirmed |
| R5 | Recruiter | `digest` — weekly stale referral list |
| A2 | Recruiter | `rescore` — classification improved vs previous run |
| E1 | Referrer | `submit` — submission confirmation |
| E2 | Referrer | `submit` — best match score |
| E3 | Referrer | `contacts` — recruiter logged contact with candidate |
| E4 | Referrer | `decisions` + `status` — PROCEED / ON_HOLD / NOT_SUITABLE |
| E5 | Referrer | `status` — candidate hired |
| C1 | Candidate | `submit` — you've been referred |
| C2 | Candidate | `promote-to-pool` — added to talent pool |

### MCP Email Server

A standalone MCP server at `mcp-email-server/` exposes two tools:
- `send_email` — send a single HTML email via Microsoft 365
- `verify_connection` — test SMTP credentials without sending

Configured in `.claude/settings.local.json` under `mcpServers.email`. Reads the same SMTP env vars as `email.ts`.

## Key Design Decisions

1. **LangGraph StateGraph (Engee)** — `ChatAnthropic` + `ToolNode` in a `StateGraph`; replaces the old custom while-loop; `shouldContinue()` edge routes to END when no tool calls remain
2. **No database** — all three agents (Engee, Benefits, Onboarding) use in-memory `Map` stores; structured to swap to Supabase/SQLite without breaking callers
3. **Graceful degradation** — every external integration has a fallback (mock data, error message) so the app always works in demo mode
4. **Module config** — centralised `AI_MODULES` makes sidebar navigation and accent colors mechanical to change
5. **Calendar mock** — `src/lib/calendar.ts` generates realistic business-day slots when Azure credentials are absent

## ServiceNow — Why It's Not Used

`src/lib/servicenow.ts` contains a full ServiceNow Table REST API client (`queryTable`, `getRecord`, `updateRecord`, `createRecord`) targeting custom tables:
- `x_1926120_employee_onboarding`
- `x_1926120_employee_benefits_catalog`
- `x_1926120_employee_benefits_inquiry`

The file also includes a mock fallback that activates when `SERVICENOW_INSTANCE_URL` / `SERVICENOW_USERNAME` / `SERVICENOW_PASSWORD` env vars are absent.

**The onboarding and benefits agents no longer call `servicenow.ts` at all.** This was intentionally removed after the ServiceNow instance going offline caused agent failures in production. The agent chat routes now import directly from `onboarding-store.ts` and `benefits-store.ts`, which are always available regardless of ServiceNow's status.

`servicenow.ts` is kept in the codebase for reference. To restore the live integration, the chat routes would need to replace their store imports with calls to `queryTable` / `updateRecord` / `createRecord`.
