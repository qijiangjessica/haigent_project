# Tech Stack

## Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15 (App Router) | Full-stack React framework |
| **React** | 19 | UI library |
| **TypeScript** | 5.x | Type safety |

## Styling

| Technology | Purpose |
|---|---|
| **Tailwind CSS v4** | Utility-first CSS framework (CSS variable-based config) |
| **shadcn/ui** | Pre-built accessible components (Card, Button, Input, Badge, Table, etc.) |
| **Radix UI** | Underlying primitives for shadcn/ui |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations (Engee survey step transitions) |
| **clsx + tailwind-merge** | Class name utility (`cn()` helper) |

## Fonts

| Font | Usage |
|---|---|
| **Lato** | Primary UI font |
| **Source Sans 3** | Secondary font |

Both loaded via `next/font/google`.

## Brand Colors

Defined as CSS custom properties in `src/app/globals.css`:

| Token | Hex | Used By |
|---|---|---|
| `brand-charcoal` | `#232323` | Sidebar background, dark text |
| `brand-pink` | `#E91E8C` | Schedule accent |
| `brand-gold` | `#F5A623` | Sourcing accent |
| `brand-teal` | `#00BFA5` | Reference accent |
| `brand-green` | `#4CAF50` | Success states |
| `brand-lime` | `#9ABF45` | Onboarding & Engee accent |
| `brand-yellow` | `#F3CF63` | Benefits accent |
| `brand-cyan` | `#19A9B6` | Payroll accent |
| `brand-coral` | `#E35B6D` | Error / alert states |

## AI & External Integrations

| Service | Module | Purpose |
|---|---|---|
| **Anthropic Claude API** (`claude-sonnet-4-6`) | Engee | Agentic chat loop with tool calling — mentor matching, scheduling, engagement monitoring |
| **ServiceNow REST API** | Onboarding, Benefits, Engee | Onboarding records, benefits enrollment, attrition risk tracking |
| **Salesforce Agentforce** | Payroll | Conversational payroll assistant (session-based agent protocol) |
| **Microsoft Teams Webhook** | Engee | Adaptive Card coffee chat requests with @mention |
| **Slack Webhook** | Engee | Coffee chat requests with user mentions |
| **Microsoft Graph API** | Engee (workIQ) | `findMeetingTimes` — checks Outlook calendar availability for both employee and mentor, returns 3 suggested 30-min slots |

### Microsoft Graph API (workIQ) Setup

The workIQ calendar feature requires an Azure AD app registration with `Calendars.Read` application permission:

```env
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

When not configured, `src/lib/calendar.ts` automatically falls back to realistic mock time slots so the feature works end-to-end in demos.

## Data Layer

| Module | Storage | Notes |
|---|---|---|
| Schedule, Sourcing | TypeScript files (`src/data/`) | Static hardcoded data, no DB needed |
| Onboarding, Benefits | ServiceNow | Live API queries |
| Payroll | Salesforce | Live Agentforce sessions |
| Engee surveys | In-memory `Map` (`src/lib/engee-store.ts`) | Designed for easy swap to DB (Supabase/SQLite) |
| Engee mentors | Hardcoded array (`src/lib/engee-store.ts`) | 10 mentors across 6 departments |

## Dev Tools

| Tool | Purpose |
|---|---|
| **ESLint** | Code linting |
| **Turbopack** | Next.js dev bundler |
