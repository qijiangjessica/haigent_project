# Haigent — AI-Powered HR Platform

A combined **marketing website + HR demo application** built with Next.js 15. It showcases Haigent.ai's AI agent orchestration platform for HR automation, integrating **Claude AI (Anthropic)**, **Salesforce Agentforce**, and **ServiceNow**.

---

## Overview

The app has two distinct sections served from the same Next.js project via route groups:

| Section | Route Group | URL Paths | Purpose |
|---|---|---|---|
| **Marketing site** | `(marketing)` | `/`, `/products`, `/use-cases`, `/templates`, `/company`, `/demo`, `/terms` | Public-facing website |
| **HR Demo app** | `(dashboard)` | `/schedule`, `/sourcing`, `/onboarding`, `/benefits`, `/payroll` | Live AI agent demos |

---

## HR Demo Modules

| Module | Status | AI Engine | Backend |
|---|---|---|---|
| **Onboarding** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow Table API |
| **Benefits** | Live | Claude AI (claude-sonnet-4-6) | ServiceNow Table API |
| **Payroll** | Live | Salesforce Agentforce | Salesforce Agent API |
| **Schedule** | Live | — | Static data |
| **Sourcing** | Live | — | Static data |
| **Reference** | Coming soon | — | — |
| **Engee** | Coming soon | — | — |

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
- **AI (Onboarding & Benefits):** Anthropic Claude via `@anthropic-ai/sdk`
- **AI (Payroll):** Salesforce Agentforce Agent API
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
│   │   └── payroll/
│   └── api/
│       ├── agent/                    # Salesforce Agentforce proxy
│       ├── onboarding/
│       │   ├── chat/                 # Claude AI agentic chat
│       │   └── records/              # ServiceNow onboarding records
│       └── benefits/
│           ├── chat/                 # Claude AI agentic chat
│           └── records/              # ServiceNow benefit records
├── components/
│   ├── marketing/
│   │   ├── Layout/                   # Marketing Header + Footer
│   │   ├── Home/                     # Home page sections
│   │   ├── Products/                 # Products page sections
│   │   ├── UseCases/                 # Use cases page sections
│   │   ├── Templates/                # Templates page sections
│   │   ├── Company/                  # Company page sections
│   │   └── Terms/                    # Terms page content
│   ├── onboarding/                   # Dashboard + AI chat UI
│   ├── benefits/                     # Dashboard + AI chat UI
│   ├── payroll/                      # Agentforce chat UI
│   ├── layout/                       # Dashboard sidebar + header
│   ├── shared/                       # Reusable dashboard components
│   ├── ui/                           # shadcn/ui + custom UI primitives
│   ├── ProductIntroduction.tsx       # Product detail components
│   ├── ProductHowItWorks.tsx
│   ├── ProductBenefits.tsx
│   ├── ProductIntegrations.tsx
│   ├── ProductWorkflows.tsx
│   ├── ProductCta.tsx
│   ├── hero-with-mockup.tsx
│   └── bento-grid_2.tsx
├── data/
│   └── products.ts                   # Product data for all 7 agents
└── lib/
    ├── servicenow.ts                 # ServiceNow Table API client
    ├── salesforce.ts                 # Salesforce OAuth + Agentforce client
    └── modules.ts                    # Module registry and config
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
- [`Haigent_Demo.pptx`](Haigent_Demo.pptx) — Presentation slides
