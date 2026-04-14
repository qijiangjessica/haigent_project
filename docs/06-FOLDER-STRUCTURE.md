# Project Folder Structure

```
haigent-project/
├── docs/                                # Project documentation
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-TECH-STACK.md
│   ├── 03-UI-SPECIFICATION.md
│   ├── 04-APP-ARCHITECTURE.md
│   ├── 05-HARDCODED-DATA.md
│   ├── 06-FOLDER-STRUCTURE.md           # (this file)
│   ├── 07-IMPLEMENTATION-PLAN.md
│   └── 08-NEW-MODULES-GUIDE.md
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout: fonts, body, providers
│   │   ├── page.tsx                     # Root redirect → /schedule
│   │   ├── globals.css                  # Tailwind v4 CSS variables + brand colors
│   │   │
│   │   ├── (dashboard)/                 # Dashboard route group (with sidebar)
│   │   │   ├── layout.tsx               # Sidebar + header + main content
│   │   │   │
│   │   │   ├── schedule/                # Schedule AI Agent module
│   │   │   │   ├── page.tsx
│   │   │   │   ├── jobs/page.tsx
│   │   │   │   ├── jobs/[id]/page.tsx
│   │   │   │   ├── candidates/page.tsx
│   │   │   │   ├── interviews/page.tsx
│   │   │   │   ├── interviewers/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   │
│   │   │   ├── sourcing/                # Sourcing AI Agent module
│   │   │   │   ├── page.tsx
│   │   │   │   ├── roles/page.tsx
│   │   │   │   ├── roles/[id]/page.tsx
│   │   │   │   ├── candidates/page.tsx
│   │   │   │   ├── outreach/page.tsx
│   │   │   │   └── meetings/page.tsx
│   │   │   │
│   │   │   ├── reference/page.tsx       # Coming Soon
│   │   │   ├── onboarding/page.tsx      # ServiceNow AI assistant
│   │   │   ├── benefits/page.tsx        # ServiceNow dashboard + AI assistant
│   │   │   ├── payroll/page.tsx         # Salesforce Agentforce AI assistant
│   │   │   └── engee/page.tsx           # Employee engagement agent (survey + chat)
│   │   │
│   │   └── api/                         # Backend API routes
│   │       ├── engee/
│   │       │   ├── chat/route.ts        # Engee agent — Claude + 9 tools (agentic loop)
│   │       │   ├── survey/route.ts      # Survey GET/POST
│   │       │   └── mentor-suggest/route.ts  # Mentor matching
│   │       ├── benefits/
│   │       │   ├── chat/route.ts        # Benefits AI chat
│   │       │   └── records/route.ts     # ServiceNow benefits data
│   │       ├── onboarding/
│   │       │   └── chat/route.ts        # Onboarding AI chat
│   │       ├── agent/route.ts           # Payroll — Salesforce Agentforce proxy
│   │       └── servicenow/              # ServiceNow utility routes
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (do not edit manually)
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx              # Full sidebar with two-tier navigation
│   │   │   ├── header.tsx               # Sticky header
│   │   │   └── mobile-menu.tsx          # Mobile hamburger toggle
│   │   │
│   │   ├── shared/                      # Reusable across all modules
│   │   │   ├── hero-banner.tsx          # Gradient header banner (title, badge, subtitle)
│   │   │   ├── stats-card.tsx           # Metric card (icon, label, value)
│   │   │   ├── page-header.tsx          # Simple title + description header
│   │   │   ├── status-badge.tsx         # Active/Draft/Closed etc. badges
│   │   │   ├── empty-state.tsx          # "No data" placeholder
│   │   │   └── coming-soon.tsx          # Placeholder for unbuilt modules
│   │   │
│   │   ├── engee/
│   │   │   ├── agent-chat.tsx           # Engee chat UI (streaming, seed message, suggestions)
│   │   │   └── survey-form.tsx          # 7-step interest survey with Framer Motion transitions
│   │   │
│   │   ├── benefits/
│   │   │   ├── agent-chat.tsx           # Benefits AI chat UI
│   │   │   └── dashboard.tsx            # Benefits dashboard with ServiceNow stats
│   │   │
│   │   ├── onboarding/
│   │   │   └── dashboard.tsx            # Onboarding dashboard with ServiceNow data
│   │   │
│   │   ├── payroll/
│   │   │   └── agent-chat.tsx           # Payroll Agentforce chat UI (full-page height)
│   │   │
│   │   ├── schedule/
│   │   │   ├── agent-status.tsx
│   │   │   └── activity-feed.tsx
│   │   │
│   │   └── sourcing/
│   │       ├── campaign-card.tsx
│   │       └── top-roles.tsx
│   │
│   ├── data/                            # Static hardcoded data (Schedule & Sourcing only)
│   │   ├── schedule/
│   │   │   ├── jobs.ts
│   │   │   ├── candidates.ts
│   │   │   ├── interviews.ts
│   │   │   ├── interviewers.ts
│   │   │   └── settings.ts
│   │   └── sourcing/
│   │       └── roles.ts
│   │
│   ├── lib/
│   │   ├── utils.ts                     # cn() helper (clsx + twMerge)
│   │   ├── modules.ts                   # AI_MODULES config (sidebar nav + accent colors)
│   │   ├── engee-store.ts               # In-memory survey store + mentor roster + matching algo
│   │   ├── calendar.ts                  # Microsoft Graph API + workIQ mock slot fallback
│   │   ├── servicenow.ts                # ServiceNow REST API helpers
│   │   └── salesforce.ts               # Salesforce Agentforce session helpers
│   │
│   └── types/
│       └── index.ts                     # Shared TypeScript interfaces (Module, SubPage, etc.)
│
├── public/
│   ├── favicon.ico
│   └── icons/                           # Custom SVG icons for sidebar sub-nav
│       ├── analytics-dashboard.svg
│       ├── HR.svg
│       ├── team.svg
│       ├── checklist.svg
│       └── user-communication.svg
│
├── .env.example                         # All required env vars listed (no values)
├── .env.local                           # Local secrets (git-ignored)
├── .gitignore
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── package-lock.json
```

## Key Directories Explained

| Directory | Purpose |
|---|---|
| `src/app/(dashboard)/` | All module pages (routes) |
| `src/app/api/` | Backend API routes — AI agents, integrations |
| `src/components/ui/` | shadcn/ui primitives — do not edit manually |
| `src/components/layout/` | Sidebar, header — structural |
| `src/components/shared/` | Reusable across all modules |
| `src/components/<module>/` | Module-specific components |
| `src/data/` | Static hardcoded data for Schedule and Sourcing |
| `src/lib/` | Utilities, integration helpers, and config |
| `src/types/` | TypeScript interfaces |
| `public/icons/` | Custom SVG icons for sidebar sub-nav |
| `docs/` | Project documentation |
