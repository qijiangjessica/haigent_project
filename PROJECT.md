# Haigent — AI-Powered HR Platform

## Overview

Haigent is a full-stack AI-powered HR platform that integrates **Claude AI (Anthropic)**, **Salesforce Agentforce**, and **ServiceNow** to automate and streamline core HR workflows including onboarding, benefits management, interview scheduling, candidate sourcing, and payroll assistance.

Built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS**, Haigent is a modular platform where each HR function is its own AI-powered module.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| AI (Onboarding & Benefits) | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| AI (Payroll) | Salesforce Agentforce Agent API |
| HRIS Backend | ServiceNow Table REST API (Basic Auth) |
| CRM Backend | Salesforce (OAuth 2.0 Connected App) |

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── schedule/          # Interview scheduling module
│   │   ├── sourcing/          # Candidate sourcing module
│   │   ├── onboarding/        # Onboarding module (ServiceNow + Claude AI)
│   │   ├── benefits/          # Benefits module (ServiceNow + Claude AI)
│   │   └── payroll/           # Payroll module (Salesforce Agentforce)
│   └── api/
│       ├── agent/             # Salesforce Agentforce proxy
│       ├── onboarding/
│       │   ├── chat/          # Claude AI agentic chat with ServiceNow tools
│       │   └── records/       # Fetch onboarding records from ServiceNow
│       └── benefits/
│           ├── chat/          # Claude AI agentic chat for benefits
│           └── records/       # Fetch benefit types + enrollments
├── components/
│   ├── onboarding/            # Dashboard + AI chat UI
│   ├── benefits/              # Dashboard + AI chat UI
│   ├── payroll/               # Agentforce chat UI
│   ├── layout/                # Sidebar + Header
│   └── shared/                # Reusable UI components
└── lib/
    ├── servicenow.ts          # ServiceNow Table API client
    ├── salesforce.ts          # Salesforce OAuth + Agentforce client
    └── modules.ts             # Module registry and config
```

---

## Modules

### 1. Schedule
Automated interview scheduling with AI candidate scoring. Displays jobs, candidates, interviews, and interviewers. Uses static/mock data with a full dashboard UI.

### 2. Sourcing
Automated candidate sourcing with AI screening and outreach. Displays open roles, candidates, outreach campaigns, and scheduled meetings.

### 3. Onboarding *(ServiceNow + Claude AI)*
AI-powered onboarding assistant backed by a live **ServiceNow custom scoped app**.

**Features:**
- Real-time dashboard showing all employee onboarding records from ServiceNow
- Status tracking: `pending`, `in_progress`, `completed`, `on_hold`
- Task checklist: equipment assigned, access provisioned, documents completed, training scheduled, workspace prepared
- AI chat powered by **Claude `claude-sonnet-4-6`** with 5 tools:
  - `get_employee_onboarding` — look up an employee's onboarding record
  - `update_onboarding_task` — mark tasks complete/incomplete
  - `get_benefit_types` — fetch available benefit plans
  - `get_employee_benefits` — get an employee's benefit enrollment
  - `create_it_incident` — raise an IT support ticket in ServiceNow

**Architecture:** Claude AI uses an **agentic tool-use loop** — it calls tools against the live ServiceNow REST API, processes results, and continues until it reaches `end_turn`. This allows multi-step reasoning (e.g. "look up employee → check tasks → update task → confirm").

### 4. Benefits *(ServiceNow + Claude AI)*
AI-powered benefits assistant backed by the same ServiceNow scoped app.

**Features:**
- Dashboard showing all benefit plan types and enrollment overview
- AI chat with 4 tools: `get_benefit_types`, `get_employee_benefits`, `enroll_in_benefit`, `update_benefit_enrollment`
- Brand-green themed UI

### 5. Payroll *(Salesforce Agentforce)*
AI-powered payroll assistant connected to **Salesforce Agentforce** — Salesforce's native AI agent platform.

**Features:**
- Full chat interface backed by a live Agentforce agent session
- Session lifecycle management: start → message → end
- OAuth 2.0 JWT flow for server-to-server Salesforce authentication

**Architecture:** The Next.js API route (`/api/agent`) acts as a proxy to the Salesforce Agent API, managing session state and forwarding messages.

### 6. Reference & Engee *(Coming Soon)*
Placeholder modules for automated reference checks and employee engagement — not yet implemented.

---

## ServiceNow Integration

### Custom Scoped App
A custom ServiceNow application was built in **ServiceNow Studio (IDE)** under the scope `x_1926120_employee`. It contains three custom tables:

| Table | Purpose |
|---|---|
| `x_1926120_employee_onboarding` | Employee onboarding records and task tracking |
| `x_1926120_employee_benefit_types` | Available benefit plan definitions |
| `x_1926120_employee_benefit_enrollment` | Employee benefit enrollment records |

### Authentication
HTTP Basic Auth — credentials are Base64-encoded and sent in the `Authorization` header on every API request.

### Key Configuration Fixes
- All three tables require **"Allow access to this table via web services"** checked (found under System Definition > Tables)
- The admin user requires scoped app roles: `x_1926120_employee.hr_manager` and `x_1926120_employee.hr_representative`
- Table **"Accessible from"** must be set to **"All application scopes"**

---

## Salesforce Integration

### OAuth 2.0 Connected App
A Salesforce Connected App was configured with a **Client Credentials OAuth flow** to obtain access tokens for server-to-server API calls (no user login required).

### Agentforce Agent API
The Agentforce Agent API is used to:
1. Create a chat session (`POST /agents/{agentId}/sessions`)
2. Send messages (`POST /sessions/{sessionId}/messages`)
3. End the session (`DELETE /sessions/{sessionId}`)

---

## Claude AI — Agentic Tool Use Pattern

Both the Onboarding and Benefits modules use the **Anthropic agentic loop pattern**:

```
User message
    ↓
Claude decides to use a tool
    ↓
Next.js executes the tool (ServiceNow Table API call)
    ↓
Result returned to Claude
    ↓
Claude reasons over the result (may call more tools)
    ↓
Claude returns final answer when stop_reason === "end_turn"
```

This allows Claude to perform multi-step HR workflows autonomously — for example, looking up an employee, checking their onboarding status, updating a task, and confirming the change — all in a single user message.

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
```
