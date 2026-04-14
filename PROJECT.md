# Haigent — Technical Architecture

## Overview

Haigent is a combined **marketing website + HR demo application** that showcases AI agent orchestration for HR automation. It integrates **Claude AI (Anthropic)**, **Salesforce Agentforce**, **ServiceNow**, **Microsoft Teams**, and **Slack** into a single Next.js project using route groups to serve two distinct experiences:

- **Marketing site** (`/`, `/products`, `/use-cases`, `/templates`, `/company`, `/demo`, `/terms`) — public-facing website
- **HR Demo app** (`/schedule`, `/sourcing`, `/onboarding`, `/benefits`, `/payroll`, `/engee`) — live AI agent demos with real backend integrations

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Framer Motion**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| AI (Onboarding, Benefits & Engee) | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| AI (Payroll) | Salesforce Agentforce Agent API |
| HRIS Backend | ServiceNow Table REST API (Basic Auth) |
| CRM Backend | Salesforce (OAuth 2.0 Client Credentials) |
| Messaging | Microsoft Teams Incoming Webhook, Slack Incoming Webhook |

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)/                  # Marketing site — Header/Footer layout
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home page (/)
│   │   ├── products/
│   │   │   ├── page.tsx              # All products (/products)
│   │   │   └── [slug]/page.tsx       # Product detail
│   │   ├── use-cases/page.tsx
│   │   ├── templates/page.tsx
│   │   ├── company/page.tsx
│   │   ├── demo/page.tsx
│   │   └── terms/page.tsx
│   ├── (dashboard)/                  # HR Demo app — Sidebar layout
│   │   ├── layout.tsx
│   │   ├── schedule/
│   │   ├── sourcing/
│   │   ├── onboarding/
│   │   ├── benefits/
│   │   ├── payroll/
│   │   └── engee/                    # Engee new hire engagement agent
│   └── api/
│       ├── agent/                    # Salesforce Agentforce proxy
│       ├── onboarding/
│       │   ├── chat/                 # Claude AI agentic chat
│       │   └── records/              # ServiceNow onboarding records
│       ├── benefits/
│       │   ├── chat/                 # Claude AI agentic chat
│       │   └── records/              # ServiceNow benefit records
│       └── engee/
│           ├── chat/                 # Engee AI agent (Claude + 8 tools)
│           ├── survey/               # Survey save/retrieve
│           └── mentor-suggest/       # Top 3 mentor match scoring API
├── components/
│   ├── marketing/                    # All marketing page sections
│   ├── onboarding/                   # Onboarding dashboard + chat UI
│   ├── benefits/                     # Benefits dashboard + chat UI
│   ├── payroll/                      # Agentforce chat UI
│   ├── engee/
│   │   ├── survey-form.tsx           # 7-page interest survey
│   │   └── agent-chat.tsx            # Engee chat interface
│   ├── layout/                       # Dashboard sidebar + header
│   ├── shared/                       # Reusable components (StatsCard, PageHeader, etc.)
│   └── ui/                           # shadcn/ui + custom primitives
├── data/
│   └── products.ts                   # Full product data for all 7 agents
└── lib/
    ├── servicenow.ts                 # ServiceNow Table API client (Basic Auth)
    ├── salesforce.ts                 # Salesforce OAuth + Agentforce client
    ├── engee-store.ts                # In-memory survey store + mentor roster + matching
    └── modules.ts                    # Module registry (enabled/disabled + sidebar config)
```

---

## HR Demo Modules

### 1. Schedule
Automated interview scheduling dashboard. Uses static/mock data with a full tabbed dashboard UI.

### 2. Sourcing
Candidate sourcing dashboard showing open roles, candidates, outreach campaigns. Uses static/mock data.

### 3. Onboarding *(ServiceNow + Claude AI)*
AI-powered onboarding assistant backed by a live ServiceNow custom scoped app.

**Tools:**
- `get_employee_onboarding` — look up an employee's onboarding record
- `update_onboarding_task` — mark tasks complete/incomplete
- `get_benefit_types` — fetch available benefit plans
- `get_employee_benefits` — get an employee's benefit enrollment
- `create_it_incident` — raise an IT support ticket in ServiceNow

### 4. Benefits *(ServiceNow + Claude AI)*
AI-powered benefits assistant. Tools: `get_benefit_types`, `get_employee_benefits`, `enroll_in_benefit`, `update_benefit_enrollment`.

### 5. Payroll *(Salesforce Agentforce)*
AI payroll assistant connected to Salesforce Agentforce. Session lifecycle: start → message → end via `/api/agent` proxy.

### 6. Engee *(Claude AI + Teams + Slack)*
New hire engagement agent supporting employees through their first 90 days.

**Architecture:**
- 7-page interest survey → mentor matching → coffee chat scheduling
- In-memory data store (`engee-store.ts`) — swap for DB without changing callers
- Mentor matching scores by: department (20pts), professional interests (4pts each), learning interests (2pts each), personal interests (2pts each)
- Messages sent via Teams Adaptive Cards or Slack Incoming Webhook

**Survey pages:**
1. Basic Context (name, role, department, city, country)
2. Professional Interests (technical areas + learning goals)
3. Hobbies & Activities (personal hobbies with free-text "Other")
4. Work Style & Values (work preference, communication style, motivations, personality traits)
5. Personal Preferences (career stage, peak productivity, food, weekend style, conversation topics, life situation)
6. Goals (90-day goals, mentor questions, preferred platform & meeting time)
7. Mentor Match Results (top 3, selectable, schedules coffee chat)

**Agent tools:**

| Tool | Description |
|---|---|
| `get_employee_engagement` | Employee profile, attrition risk, survey from ServiceNow |
| `get_team_engagement_summary` | Team-wide engagement overview |
| `submit_interest_survey` | Save a new employee's interest survey |
| `find_mentor_match` | Match mentor by department and interests |
| `find_mentor_by_name` | Look up mentor contact details by name (slack_id, teams_id) |
| `schedule_coffee_chat` | Send meeting request via Teams or Slack |
| `add_engagement_note` | Save a check-in note to onboarding record |
| `flag_attrition_risk` | Flag employee as early attrition risk |

**Mentor roster** (`engee-store.ts` — `MENTORS` array, IDs m1–m10):
- Covers: Engineering, Data & Analytics, Product, Design, Marketing, HR, Operations
- Real Procogia employees: Zilai Feng (m8), Gabriel Brock (m9), Ahsaan Rizvi (m10)
- Fields: `name`, `title`, `department`, `email`, `slack_id`, `teams_id`, `bio`

---

## Engee Messaging Integrations

### Microsoft Teams
- **Method:** Incoming Webhook → posts Adaptive Cards to a fixed channel
- **Mention format:** `<at>Name</at>` with `msteams.entities` in the card
- **Env var:** `TEAMS_WEBHOOK_URL`
- **Limitation:** Channel-only (no individual DMs). Upgrade to Teams Bot + Graph API for DM support.

### Slack
- **Method:** Incoming Webhook → posts to a fixed channel
- **Mention format:** `<@USER_ID>` in message text
- **Env var:** `SLACK_WEBHOOK_URL`
- **Note:** `SLACK_BOT_TOKEN` also present for potential future direct messaging

---

## ServiceNow Integration

### Custom Scoped App
Scope: `x_1926120_employee`

| Table | Purpose |
|---|---|
| `x_1926120_employee_onboarding` | Employee onboarding records and task tracking |
| `x_1926120_employee_benefit_types` | Available benefit plan definitions |
| `x_1926120_employee_benefit_enrollment` | Employee benefit enrollment records |

### Authentication
HTTP Basic Auth — Base64-encoded credentials in `Authorization` header.

### Required Configuration
- All tables: **"Allow access to this table via web services"** checked
- All tables: **"Accessible from"** set to **"All application scopes"**
- Admin user roles: `x_1926120_employee.hr_manager`, `x_1926120_employee.hr_representative`

---

## Salesforce Integration

### OAuth 2.0 Connected App
Client Credentials flow for server-to-server token acquisition.

### Agentforce Agent API
1. Create session — `POST /agents/{agentId}/sessions`
2. Send message — `POST /sessions/{sessionId}/messages`
3. End session — `DELETE /sessions/{sessionId}`

---

## Claude AI — Agentic Tool Use Pattern

```
User message
    ↓
Claude decides which tool to call
    ↓
Next.js API route executes the tool
    ↓
Result returned to Claude as tool_result
    ↓
Claude reasons (may call additional tools, max 10 iterations)
    ↓
Claude returns final answer when stop_reason === "end_turn"
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/onboarding/records` | GET | Fetch onboarding records from ServiceNow |
| `/api/onboarding/chat` | POST | Claude AI chat with ServiceNow tool use |
| `/api/benefits/records` | GET | Fetch benefit types and enrollments |
| `/api/benefits/chat` | POST | Claude AI chat for benefits |
| `/api/agent` | POST | Salesforce Agentforce proxy |
| `/api/auth/salesforce` | GET | Initiate Salesforce OAuth |
| `/api/auth/callback/salesforce` | GET | Salesforce OAuth callback |
| `/api/auth/status` | GET | Check Salesforce auth status |
| `/api/engee/chat` | POST | Engee AI agent chat |
| `/api/engee/survey` | GET/POST | Save and retrieve interest surveys |
| `/api/engee/mentor-suggest` | POST | Top 3 mentor match scoring |

---

## Environment Variables

```env
# Salesforce Connected App
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SALESFORCE_REDIRECT_URI=http://localhost:3000/api/auth/callback/salesforce

# Salesforce Agentforce
SALESFORCE_MY_DOMAIN=https://...my.salesforce.com
SALESFORCE_AGENT_ID=...

# ServiceNow Table API
SERVICENOW_INSTANCE_URL=https://dev282748.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=...

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Engee — Messaging integrations
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_BOT_TOKEN=xoxb-...   # retained for future direct messaging
```

---

## Module Configuration

Modules are registered in `src/lib/modules.ts`. Set `enabled: true/false` to show/hide in the sidebar:

```typescript
{
  name: "Engee",
  slug: "engee",
  enabled: true,
  description: "New employee engagement agent",
}
```
