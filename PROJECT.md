# Haigent — Technical Architecture

## Overview

Haigent is a combined **marketing website + HR demo application** that showcases AI agent orchestration for HR automation. It integrates **Claude AI (Anthropic)**, **Salesforce Agentforce**, and **ServiceNow** into a single Next.js project using route groups to serve two distinct experiences:

- **Marketing site** (`/`, `/products`, `/use-cases`, `/templates`, `/company`, `/demo`, `/terms`) — public-facing website with full product marketing content
- **HR Demo app** (`/schedule`, `/sourcing`, `/onboarding`, `/benefits`, `/payroll`) — live AI agent demos with real backend integrations

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Framer Motion**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| AI (Onboarding & Benefits) | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| AI (Payroll) | Salesforce Agentforce Agent API |
| HRIS Backend | ServiceNow Table REST API (Basic Auth) |
| CRM Backend | Salesforce (OAuth 2.0 Client Credentials) |

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)/                  # Marketing site — Header/Footer layout
│   │   ├── layout.tsx                # Marketing layout wrapper
│   │   ├── page.tsx                  # Home page (/)
│   │   ├── products/
│   │   │   ├── page.tsx              # All products overview (/products)
│   │   │   └── [slug]/page.tsx       # Product detail (/products/schedule-haigent, etc.)
│   │   ├── use-cases/page.tsx
│   │   ├── templates/page.tsx
│   │   ├── company/page.tsx
│   │   ├── demo/page.tsx
│   │   └── terms/page.tsx
│   ├── (dashboard)/                  # HR Demo app — Sidebar layout
│   │   ├── layout.tsx                # Dashboard layout (sidebar + header)
│   │   ├── schedule/                 # Interview scheduling module
│   │   ├── sourcing/                 # Candidate sourcing module
│   │   ├── onboarding/               # Onboarding (ServiceNow + Claude AI)
│   │   ├── benefits/                 # Benefits (ServiceNow + Claude AI)
│   │   └── payroll/                  # Payroll (Salesforce Agentforce)
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
│   │   ├── Layout/                   # Marketing Header + Footer (nav, dropdowns)
│   │   ├── Home/                     # HeroSection, IntroSection, AgentsCarousel,
│   │   │                             # BenefitsSection, HowItWorks, SecurityGovernance,
│   │   │                             # CallToAction
│   │   ├── Products/                 # ProductsHero, AgentsGrid, ProductFeatures,
│   │   │                             # HowItWorks, ProductBenefits, ProductUseCases,
│   │   │                             # ProductsCTA
│   │   ├── UseCases/                 # UseCasesHero, WorkflowsTable, IndustryPacks,
│   │   │                             # ActivateSteps, WhyChoose, UseCasesCTA
│   │   ├── Templates/                # TemplatesHero, TemplatesIntro, TemplateCategories,
│   │   │                             # TemplatesGrid, TemplatesCTA
│   │   ├── Company/                  # AboutHero, OurMission, OurVision, CoreValues,
│   │   │                             # JoinTeamCTA
│   │   └── Terms/                    # TermsContent
│   ├── onboarding/                   # Dashboard + AI chat UI
│   ├── benefits/                     # Dashboard + AI chat UI
│   ├── payroll/                      # Agentforce chat UI
│   ├── layout/                       # Dashboard sidebar + header
│   ├── shared/                       # Reusable dashboard components (StatsCard, etc.)
│   ├── ui/                           # shadcn/ui + custom primitives
│   │                                 # (badge, button, card, mockup, page-header,
│   │                                 #  svg-icon, glowing-card, glare-card, etc.)
│   ├── ProductIntroduction.tsx       # Product detail page components
│   ├── ProductHowItWorks.tsx
│   ├── ProductBenefits.tsx
│   ├── ProductIntegrations.tsx
│   ├── ProductWorkflows.tsx
│   ├── ProductCta.tsx
│   ├── hero-with-mockup.tsx          # Hero section with image/mockup layout
│   └── bento-grid_2.tsx              # Animated 3-col bento grid layout
├── data/
│   └── products.ts                   # Full product data for all 7 agents (SEO, hero,
│                                     # intro, benefits, integrations, workflows, CTA)
└── lib/
    ├── servicenow.ts                 # ServiceNow Table API client (Basic Auth)
    ├── salesforce.ts                 # Salesforce OAuth + Agentforce client
    └── modules.ts                    # Module registry and config
```

---

## Marketing Site Architecture

### Route Groups
The marketing site uses the `(marketing)` route group with a shared `layout.tsx` that wraps every page in the `Header` + `Footer` components. The `(dashboard)` route group has its own sidebar layout. The two groups share the same `app/layout.tsx` root (fonts, globals).

### Product Detail Pages
`/products/[slug]` is a dynamic server component page. It:
1. Looks up the product from `src/data/products.ts` by slug
2. Derives color schemes per slug (destructive/primary/secondary/accent)
3. Maps slug to animation video paths (`/animations/{n}/One Hand Fly.mp4`)
4. Renders: `HeroWithMockup` → `ProductIntroduction` → stats → `ProductHowItWorks` → `ProductBenefits` → integrations → workflows → `ProductCta`

### Key UI Components
- **`SvgIcon`** — renders inline SVGs from `/public/svg_I/` by name; used throughout marketing and dashboard
- **`PageHeader`** — shared section header with multi-color title segments and optional accent line
- **`BentoGridShowcase`** — animated 3-column bento grid (6 slots) used in `ProductBenefits`
- **`HeroWithMockup`** — two-column hero with dynamic color tokens passed via inline styles (CSS variables)
- **`TemplateCategories` / `WorkflowsTable`** — sliding pill tab selectors with animated indicator

### Public Assets Required
Copy from `haigent.ai/public/` into `haigent-project/public/`:

```
/animations/          # Robot animation videos (7 agents × Idle.mp4, One Hand Fly.mp4, Fly.mp4)
/svg_I/               # SVG icon set (100+ icons used by SvgIcon component)
/all_robo.png         # Group robot image (CTAs, product pages)
/hero_image.png       # Product mockup images
/hero_image_2.png
/hero_image_3.png
/hero_image_4.png
/Logo_simple_black.png
/models_poses/        # Individual robot pose images
```

---

## HR Demo Modules

### 1. Schedule
Automated interview scheduling dashboard. Displays jobs, candidates, interviews, and interviewers. Uses static/mock data with a full tabbed dashboard UI.

### 2. Sourcing
Candidate sourcing dashboard. Displays open roles, candidates, outreach campaigns, and scheduled meetings. Uses static/mock data.

### 3. Onboarding *(ServiceNow + Claude AI)*
AI-powered onboarding assistant backed by a live **ServiceNow custom scoped app**.

**Features:**
- Real-time dashboard showing employee onboarding records from ServiceNow (3 sample employees pre-seeded)
- Status tracking: `pending`, `in_progress`, `completed`, `on_hold`
- Task checklist: equipment assigned, access provisioned, documents completed, training scheduled, workspace prepared
- AI chat powered by **Claude `claude-sonnet-4-6`** with 5 tools:
  - `get_employee_onboarding` — look up an employee's onboarding record
  - `update_onboarding_task` — mark tasks complete/incomplete
  - `get_benefit_types` — fetch available benefit plans
  - `get_employee_benefits` — get an employee's benefit enrollment
  - `create_it_incident` — raise an IT support ticket in ServiceNow

**Architecture:** Claude uses an **agentic tool-use loop** — it calls tools against the live ServiceNow REST API, processes results, and continues until `end_turn`. This allows multi-step reasoning (e.g. look up employee → check tasks → update task → confirm).

### 4. Benefits *(ServiceNow + Claude AI)*
AI-powered benefits assistant backed by the same ServiceNow scoped app.

**Features:**
- Dashboard showing all benefit plan types and enrollment overview
- AI chat with 4 tools: `get_benefit_types`, `get_employee_benefits`, `enroll_in_benefit`, `update_benefit_enrollment`
- Brand-green themed UI

### 5. Payroll *(Salesforce Agentforce)*
AI-powered payroll assistant connected to **Salesforce Agentforce**.

**Features:**
- Full chat interface backed by a live Agentforce agent session
- Session lifecycle management: start → message → end
- OAuth 2.0 Client Credentials flow for server-to-server Salesforce auth

**Architecture:** The Next.js API route (`/api/agent`) acts as a proxy to the Salesforce Agent API, managing session state and forwarding messages.

### 6. Reference & Engee *(Coming Soon)*
Placeholder modules for automated reference checks and employee engagement.

---

## ServiceNow Integration

### Custom Scoped App
Built in **ServiceNow Studio (IDE)** under scope `x_1926120_employee`. Contains three custom tables:

| Table | Purpose |
|---|---|
| `x_1926120_employee_onboarding` | Employee onboarding records and task tracking |
| `x_1926120_employee_benefit_types` | Available benefit plan definitions |
| `x_1926120_employee_benefit_enrollment` | Employee benefit enrollment records |

### Authentication
HTTP Basic Auth — credentials are Base64-encoded and sent in the `Authorization` header.

### Required Configuration
- All tables: **"Allow access to this table via web services"** must be checked (System Definition > Tables)
- All tables: **"Accessible from"** set to **"All application scopes"**
- Admin user roles: `x_1926120_employee.hr_manager`, `x_1926120_employee.hr_representative`

---

## Salesforce Integration

### OAuth 2.0 Connected App
Configured with **Client Credentials flow** for server-to-server token acquisition (no user login).

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
Next.js API route executes the tool (ServiceNow Table API call)
    ↓
Result returned to Claude as tool_result
    ↓
Claude reasons over the result (may call additional tools)
    ↓
Claude returns final answer when stop_reason === "end_turn"
```

This enables multi-step autonomous HR workflows in a single user message.

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/onboarding/records` | GET | Fetch all onboarding records from ServiceNow |
| `/api/onboarding/chat` | POST | Claude AI agentic chat with ServiceNow tool use |
| `/api/benefits/records` | GET | Fetch benefit types and enrollments from ServiceNow |
| `/api/benefits/chat` | POST | Claude AI agentic chat for benefits |
| `/api/agent` | POST | Salesforce Agentforce proxy (start/message/end) |
| `/api/auth/salesforce` | GET | Initiate Salesforce OAuth flow |
| `/api/auth/callback/salesforce` | GET | Salesforce OAuth callback |
| `/api/auth/status` | GET | Check Salesforce auth status |

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

---

## Module Configuration

Modules are registered in `src/lib/modules.ts`. Set `enabled: true/false` to show/hide from the sidebar:

```typescript
{
  name: "Onboarding",
  slug: "onboarding",
  enabled: true,
  description: "AI-powered onboarding assistant connected to ServiceNow",
}
```
