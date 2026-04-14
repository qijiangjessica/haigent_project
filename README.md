# Haigent — AI-Powered HR Platform

A combined **marketing website + HR demo application** built with Next.js 16. It showcases Haigent.ai's AI agent orchestration platform for HR automation, integrating **Claude AI (Anthropic)**, **Salesforce Agentforce**, **ServiceNow**, **Microsoft Teams**, and **Slack**.

---

## Overview

The app has two distinct sections served from the same Next.js project via route groups:

| Section | Route Group | URL Paths | Purpose |
|---|---|---|---|
| **Marketing site** | `(marketing)` | `/`, `/products`, `/use-cases`, `/templates`, `/company`, `/demo`, `/terms` | Public-facing website |
| **HR Demo app** | `(dashboard)` | `/schedule`, `/sourcing`, `/onboarding`, `/benefits`, `/payroll`, `/engee` | Live AI agent demos |

---

## HR Demo Modules

| Module | Status | AI Engine | Backend |
|---|---|---|---|
| **Onboarding** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow Table API |
| **Benefits** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow Table API |
| **Payroll** | Live | Salesforce Agentforce | Salesforce Agent API |
| **Schedule** | Live | — | Static data |
| **Sourcing** | Live | — | Static data |
| **Reference** | Live | Claude AI (claude-sonnet-4-6) | In-memory store + JSON persistence |
| **Engee** | Coming soon | — | — |
| **Engee** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow + Teams + Slack |
| **Reference** | Coming soon | — | — |

---

## Engee — New Employee Engagement Agent

Engee is an AI-powered agent that supports new hires through their first 90 days. It combines a rich onboarding interest survey with intelligent mentor matching and cross-platform messaging.

### Features
- **7-page interest survey** collecting: basic info, professional interests, learning goals, hobbies, work style & values, personal preferences, and 90-day goals
- **Mentor matching** — scores mentors by department, professional interests, learning goals, and personal interests
- **Coffee chat scheduling** — sends meeting requests via Microsoft Teams (Adaptive Cards) or Slack (Incoming Webhook)
- **Direct meeting scheduling** — employees can ask Engee to schedule a meeting with any mentor by name from chat
- **@mention support** — mentors are @mentioned in both Teams and Slack notifications

### Survey Pages
| Page | Content |
|---|---|
| 1. Basic Context | Name, role, department, city, country |
| 2. Professional Interests | Technical areas + what to learn more |
| 3. Hobbies & Activities | Personal hobbies with free-text "Other" option |
| 4. Work Style & Values | Work preference, communication style, motivations, personality traits |
| 5. Personal Preferences | Career stage, peak productivity, food preferences, weekend style, conversation topics, life situation |
| 6. Goals | 90-day goals, mentor questions, preferred platform & meeting time |
| 7. Mentor Matches | Top 3 mentor suggestions — selectable to schedule coffee chat |

### Messaging Integrations
| Platform | Method | Config |
|---|---|---|
| Microsoft Teams | Incoming Webhook (Adaptive Cards) | `TEAMS_WEBHOOK_URL` |
| Slack | Incoming Webhook (channel-based) | `SLACK_WEBHOOK_URL` |

---

## Marketing Pages

| Page | Path | Description |
|---|---|---|
| Home | `/` | Hero, agent carousel, benefits, how it works |
| Products | `/products` | All 7 AI agents overview + grid |
| Product Detail | `/products/[slug]` | Per-agent deep-dive (intro, benefits, workflows, integrations) |
| Use Cases | `/use-cases` | Workflow table, industry packs, activation steps |
| Templates | `/templates` | Filterable HR workflow template library |
| Company | `/company` | About, mission, vision, values, team CTA |
| Demo | `/demo` | Demo request form |
| Terms | `/terms` | Terms and conditions |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Animation:** Framer Motion
- **AI (Onboarding, Benefits & Engee):** Anthropic Claude via `@anthropic-ai/sdk`
- **AI (Payroll):** Salesforce Agentforce Agent API
- **AI (Reference):** Anthropic Claude via `@anthropic-ai/sdk` with static fallback scoring
- **HRIS Backend:** ServiceNow Table REST API
- **Messaging:** Microsoft Teams Incoming Webhook, Slack Incoming Webhook
- **Auth:** OAuth 2.0 (Salesforce), HTTP Basic Auth (ServiceNow)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A ServiceNow PDI (Personal Developer Instance) with the custom scoped app deployed
- An Anthropic API key with credits
- A Salesforce org with Agentforce enabled and a Connected App configured
- A Microsoft Teams channel with an Incoming Webhook connector
- A Slack workspace with an Incoming Webhook configured

### 1. Install dependencies

```bash
cd haigent-project
npm install
```

### 2. Copy public assets

Copy the following from `haigent.ai/public/` into `haigent-project/public/`:

```
/animations/          # Robot animation videos (7 agents × multiple states)
/svg_I/               # SVG icon set used by SvgIcon component
/all_robo.png         # Group robot image (used in CTAs)
/hero_image.png       # Product hero images
/hero_image_2.png
/hero_image_3.png
/hero_image_4.png
/Logo_simple_black.png
/models_poses/        # Individual robot pose images
```

### 3. Configure environment variables

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

# Engee — Messaging integrations
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the marketing home page loads at `/`. The HR demo dashboard is at `/schedule`.

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
│   ├── (marketing)/                  # Marketing site layout (Header + Footer)
│   │   ├── page.tsx                  # Home page
│   │   ├── products/
│   │   │   ├── page.tsx              # All products overview
│   │   │   └── [slug]/page.tsx       # Individual product detail
│   │   ├── use-cases/page.tsx
│   │   ├── templates/page.tsx
│   │   ├── company/page.tsx
│   │   ├── demo/page.tsx
│   │   └── terms/page.tsx
│   ├── (dashboard)/                  # HR demo layout (Sidebar)
│   │   ├── schedule/
│   │   ├── sourcing/
│   │   ├── onboarding/
│   │   ├── benefits/
│   │   ├── payroll/
│   │   └── engee/                    # Engee agent (survey + chat)
│   └── api/
│       ├── agent/                    # Salesforce Agentforce proxy
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
│       │   ├── chat/                 # Claude AI agentic chat
│       │   └── records/              # ServiceNow onboarding records
│       ├── benefits/
│       │   ├── chat/                 # Claude AI agentic chat
│       │   └── records/              # ServiceNow benefit records
│       └── engee/
│           ├── chat/                 # Engee AI agent (Claude + tools)
│           ├── survey/               # Survey save/retrieve
│           └── mentor-suggest/       # Top 3 mentor match API
├── components/
│   ├── marketing/                    # Marketing page sections
│   ├── onboarding/                   # Dashboard + AI chat UI
│   ├── benefits/                     # Dashboard + AI chat UI
│   ├── payroll/                      # Agentforce chat UI
│   ├── engee/
│   │   ├── survey-form.tsx           # 7-page interest survey
│   │   └── agent-chat.tsx            # Engee chat interface
│   ├── layout/                       # Dashboard sidebar + header
│   ├── shared/                       # Reusable dashboard components
│   └── ui/                           # shadcn/ui + custom UI primitives
├── data/
│   └── products.ts                   # Product data for all 7 agents
└── lib/
    ├── servicenow.ts                 # ServiceNow Table API client
    ├── salesforce.ts                 # Salesforce OAuth + Agentforce client
    ├── engee-store.ts                # In-memory survey + mentor store
    └── modules.ts                    # Module registry and config
```

---

## ServiceNow Setup

**App scope:** `x_1926120_employee`

### Custom Tables

| Table | Purpose |
|---|---|
| `x_1926120_employee_onboarding` | Employee onboarding records and task tracking |
| `x_1926120_employee_benefit_types` | Available benefit plan definitions |
| `x_1926120_employee_benefit_enrollment` | Employee benefit enrollment records |

### Required Configuration

- **Allow access to this table via web services** — must be checked
- **Accessible from** — set to `All application scopes`

Admin user roles required:
- `x_1926120_employee.hr_manager`
- `x_1926120_employee.hr_representative`

---

## How the AI Agent Works

All Claude-powered agents use an **agentic tool-use loop**:

```
User message
    ↓
Claude decides which tool to call
    ↓
Next.js API route executes the tool (ServiceNow / Slack / Teams API call)
    ↓
Result returned to Claude
    ↓
Claude reasons, may call additional tools
    ↓
Claude returns final answer when stop_reason === "end_turn"
```

### Engee Agent Tools

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
| `get_employee_engagement` | Get employee profile, attrition risk, and survey from ServiceNow |
| `get_team_engagement_summary` | Team-wide engagement overview with risk counts and milestones |
| `submit_interest_survey` | Save a new employee's interest survey |
| `find_mentor_match` | Find a mentor by department and interests |
| `find_mentor_by_name` | Look up a mentor's contact details by name |
| `schedule_coffee_chat` | Send a meeting request via Teams or Slack |
| `add_engagement_note` | Save a check-in note to an onboarding record |
| `flag_attrition_risk` | Flag an employee as early attrition risk |

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
| `/api/engee/chat` | POST | Engee AI agent chat |
| `/api/engee/survey` | GET/POST | Save and retrieve interest surveys |
| `/api/engee/mentor-suggest` | POST | Get top 3 mentor matches |

---

## Module Configuration

Modules are registered in [`src/lib/modules.ts`](src/lib/modules.ts). To enable or disable a module, set `enabled: true/false`:

```typescript
{
  name: "Engee",
  slug: "engee",
  enabled: true,
  description: "New employee engagement agent",
}
```

---

## Documentation

- [`PROJECT.md`](PROJECT.md) — Full technical architecture and integration details
- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) — Guided demo walkthrough with talking points
- [`Haigent_Demo.pptx`](Haigent_Demo.pptx) — Presentation slides
