# Haigent — AI-Powered HR Platform

An AI-powered HR platform that integrates **Claude AI (Anthropic)**, **Salesforce Agentforce**, and **ServiceNow** to automate employee onboarding, benefits management, payroll assistance, and employee referral management through intelligent AI agents.

---

## Features

| Module | Status | AI Engine | Backend |
|---|---|---|---|
| **Onboarding** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow Table API |
| **Benefits** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow Table API |
| **Payroll** | Live | Salesforce Agentforce | Salesforce Agent API |
| **Schedule** | Live | — | Static data |
| **Sourcing** | Live | — | Static data |
| **Reference** | Live | Claude AI (claude-sonnet-4-6) | In-memory store + JSON persistence |
| **Engee** | Coming soon | — | — |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **AI (Onboarding & Benefits):** Anthropic Claude via `@anthropic-ai/sdk`
- **AI (Payroll):** Salesforce Agentforce Agent API
- **AI (Reference):** Anthropic Claude via `@anthropic-ai/sdk` with static fallback scoring
- **HRIS Backend:** ServiceNow Table REST API
- **Auth:** OAuth 2.0 (Salesforce), HTTP Basic Auth (ServiceNow)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A ServiceNow PDI (Personal Developer Instance) with the custom scoped app deployed
- An Anthropic API key with credits
- A Salesforce org with Agentforce enabled and a Connected App configured

### 1. Install dependencies

```bash
cd haigent-project
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Salesforce Connected App
SALESFORCE_CLIENT_ID=your_connected_app_client_id
SALESFORCE_CLIENT_SECRET=your_connected_app_client_secret
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_REDIRECT_URI=http://localhost:3000/api/auth/callback/salesforce

# Salesforce Agentforce
SALESFORCE_MY_DOMAIN=https://your-org.my.salesforce.com
SALESFORCE_AGENT_ID=your_agent_id

# ServiceNow Table API (Basic Auth)
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=your_password

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── schedule/          # Interview scheduling module
│   │   ├── sourcing/          # Candidate sourcing module
│   │   ├── onboarding/        # Onboarding module
│   │   ├── benefits/          # Benefits module
│   │   ├── payroll/           # Payroll module (Agentforce)
│   │   └── reference/         # Reference module
│   │       ├── page.tsx       # Dashboard
│   │       ├── submit/        # Submit a referral
│   │       ├── candidates/    # Referred candidates list + detail
│   │       ├── pool/          # Talent pool management
│   │       ├── jobs/          # Open positions for referrals
│   │       ├── referrals/     # Referral detail view
│   │       ├── chat/          # Standalone AI chat page
│   │       └── scoring-config/ # Match score weight configuration
│   └── api/
│       ├── agent/             # Salesforce Agentforce proxy
│       ├── onboarding/
│       │   ├── chat/          # Claude AI agentic chat
│       │   └── records/       # Fetch onboarding records from ServiceNow
│       ├── benefits/
│       │   ├── chat/          # Claude AI agentic chat
│       │   └── records/       # Fetch benefit types + enrollments
│       └── reference/
│           ├── chat/          # Claude AI agentic chat
│           ├── submit/        # Submit referral + AI match scoring
│           ├── records/       # Fetch seeded reference data
│           ├── live-matches/  # Live match records
│           ├── promote-to-pool/ # Promote candidate to talent pool
│           ├── decisions/     # Recruiter decisions (PROCEED / ON_HOLD / NOT_SUITABLE)
│           ├── status/        # Candidate status overrides
│           ├── referral-actions/ # Reject referrals
│           ├── audit/         # Audit event log
│           └── scoring-config/ # Match scoring weight configuration
├── components/
│   ├── onboarding/            # Dashboard + AI chat UI
│   ├── benefits/              # Dashboard + AI chat UI
│   ├── payroll/               # Agentforce chat UI
│   ├── reference/             # Dashboard + AI chat UI
│   ├── layout/                # Sidebar + Header
│   └── shared/                # Reusable UI components
└── lib/
    ├── servicenow.ts          # ServiceNow Table API client
    ├── salesforce.ts          # Salesforce OAuth + Agentforce client
    ├── reference-store.ts     # In-memory store for reference module state
    ├── reference-json-persistence.ts  # Atomic JSON disk persistence
    └── modules.ts             # Module registry and config
```

---

## ServiceNow Setup

This project connects to a custom ServiceNow scoped app built in **ServiceNow Studio (IDE)**.

**App scope:** `x_1926120_employee`

### Custom Tables

| Table | Purpose |
|---|---|
| `x_1926120_employee_onboarding` | Employee onboarding records and task tracking |
| `x_1926120_employee_benefit_types` | Available benefit plan definitions |
| `x_1926120_employee_benefit_enrollment` | Employee benefit enrollment records |

### Required Configuration

For each table, ensure the following in **System Definition > Tables**:

- **Allow access to this table via web services** — must be checked
- **Accessible from** — set to `All application scopes`

The admin user must have these roles assigned:
- `x_1926120_employee.hr_manager`
- `x_1926120_employee.hr_representative`

---

## How the AI Agent Works

The Onboarding and Benefits modules use Claude AI with an **agentic tool-use loop**:

```
User message
    ↓
Claude decides which tool to call
    ↓
Next.js API route executes the tool (ServiceNow Table API call)
    ↓
Result returned to Claude
    ↓
Claude reasons, may call additional tools
    ↓
Claude returns final answer when stop_reason === "end_turn"
```

### Available Tools (Onboarding Agent)

| Tool | Description |
|---|---|
| `get_employee_onboarding` | Look up an employee's onboarding record by name or ID |
| `update_onboarding_task` | Mark onboarding tasks complete or incomplete |
| `get_benefit_types` | Fetch all available benefit plans |
| `get_employee_benefits` | Get a specific employee's benefit enrollments |
| `create_it_incident` | Create an IT support ticket in ServiceNow |

### Available Tools (Reference Agent)

| Tool | Description |
|---|---|
| `get_candidates` | Fetch referred candidates with skill verification status, scores, and pool status |
| `get_matches` | Retrieve match records showing how candidates scored against open job postings |
| `get_talent_pool` | List candidates currently held in the talent pool |
| `get_references` | Fetch professional reference records and verification outcomes |
| `get_jobs` | List open job postings available for referrals |
| `get_audit_log` | Retrieve the full audit trail for a candidate or referral |

---

## Reference Agent

The Reference module is a full AI-powered employee referral management system built with Claude AI.

### Features

- **Submit Referral** — employees submit candidate referrals via a structured form with file upload (resume + supporting documents), duplicate detection, and immediate AI match scoring
- **AI Match Scoring** — on submission, Claude AI (or a static fallback when the API key is unavailable) scores the candidate against every open job posting across four dimensions: skill overlap, experience, location, and seniority
- **Configurable Scoring Weights** — recruiters can adjust the four scoring weights (must sum to 100) via the Scoring Config page with a live preview of how existing records would be re-scored
- **Candidates List** — full table of all referred candidates with status filtering, recruiter decision recording (PROCEED / ON_HOLD / NOT_SUITABLE), match score breakdown, and CSV export
- **Candidate Detail** — per-candidate view showing field provenance (user input vs. AI-computed vs. system), match history, skill verification status, and audit trail
- **Talent Pool** — manage candidates on active hold for future openings; tracks aging review, placement history, and re-evaluation against new postings
- **Open Jobs** — list of positions available for referrals, showing strong/partial match counts per role
- **Referral Detail** — full data manifest for each submitted referral with match scoring history and pool membership status
- **AI Chat** — recruiter-facing chat assistant for querying referral data, match scores, and candidate status using the agentic tool-use loop
- **Audit Log** — every status change, recruiter decision, and pool action is recorded with actor, timestamp, before/after state

### Architecture

```
Referral submitted via form
    ↓
/api/reference/submit (POST)
    ↓
Duplicate check against existing candidates
    ↓
Claude AI scores candidate against all open jobs
(static rule-based fallback if API key unavailable)
    ↓
Match records stored in-memory + persisted to JSON
    ↓
Recruiter reviews in Candidates page
    ↓
Decisions, status overrides, pool promotions persisted via reference-json-persistence.ts
```

### Persistence

The Reference module uses an **in-memory store** (`reference-store.ts`) that is pre-loaded from JSON files on server boot and written back atomically on every mutation. This means data survives page navigations and server-side re-renders but resets on a full server restart unless the JSON files under `src/data/reference/json/` are present.

### Scoring Formula

```
Match Score = (skill_overlap × skill%) + (experience × experience%) + (location × location%) + (seniority × seniority%)

Default weights: skill=50, experience=25, location=15, seniority=10
≥ 70  →  Strong Match
50–69 →  Partial Match
< 50  →  No Match
```

---

## Salesforce Agentforce Integration

The Payroll module connects to Salesforce Agentforce via the **Agent API**:

1. **Start session** — `POST /agents/{agentId}/sessions`
2. **Send message** — `POST /sessions/{sessionId}/messages`
3. **End session** — `DELETE /sessions/{sessionId}`

Authentication uses **OAuth 2.0 Client Credentials** flow — server-to-server, no user login required.

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/onboarding/records` | GET | Fetch all onboarding records from ServiceNow |
| `/api/onboarding/chat` | POST | Claude AI chat with ServiceNow tool use |
| `/api/benefits/records` | GET | Fetch benefit types and enrollments from ServiceNow |
| `/api/benefits/chat` | POST | Claude AI chat for benefits queries |
| `/api/agent` | POST | Salesforce Agentforce session proxy (start/message/end) |
| `/api/auth/salesforce` | GET | Initiate Salesforce OAuth flow |
| `/api/auth/callback/salesforce` | GET | Salesforce OAuth callback |
| `/api/auth/status` | GET | Check current auth status |
| `/api/reference/submit` | GET / POST | List submitted referrals / Submit a new referral with AI match scoring |
| `/api/reference/chat` | POST | Claude AI chat with reference data tools |
| `/api/reference/records` | GET | Fetch seeded candidates, references, matches, and talent pool |
| `/api/reference/live-matches` | GET | Fetch live match records from submitted referrals |
| `/api/reference/promote-to-pool` | GET / POST | List pool entries / Promote a candidate to the talent pool |
| `/api/reference/decisions` | GET / POST | List recruiter decisions / Record a decision |
| `/api/reference/status` | GET / POST | List status overrides / Override a candidate's status |
| `/api/reference/referral-actions` | GET / POST | List rejected referrals / Reject a referral |
| `/api/reference/audit` | GET / POST | Fetch audit events / Append an audit event |
| `/api/reference/scoring-config` | GET / PUT | Get current scoring weights / Update scoring weights |

---

## Module Configuration

Modules are registered in [`src/lib/modules.ts`](src/lib/modules.ts). To enable or disable a module, set `enabled: true/false`:

```typescript
{
  name: "Onboarding",
  slug: "onboarding",
  enabled: true,
  description: "AI-powered onboarding assistant connected to ServiceNow",
}
```

---

## Documentation

- [`PROJECT.md`](PROJECT.md) — Full technical architecture and integration details
- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) — Guided demo walkthrough with talking points
- [`Haigent_Demo.pptx`](Haigent_Demo.pptx) — Presentation slides (10 slides)
