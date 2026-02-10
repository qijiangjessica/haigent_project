# Project Folder Structure

```
haigent-platform/
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
│   │   ├── globals.css                  # Tailwind directives + custom properties
│   │   │
│   │   └── (dashboard)/                 # Dashboard route group (with sidebar)
│   │       ├── layout.tsx               # Sidebar + header + main content
│   │       │
│   │       ├── schedule/                # Schedule AI Agent module
│   │       │   ├── page.tsx             # Dashboard
│   │       │   ├── jobs/
│   │       │   │   ├── page.tsx         # Jobs list
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx     # Job detail
│   │       │   ├── candidates/
│   │       │   │   └── page.tsx         # Candidates list
│   │       │   ├── interviews/
│   │       │   │   └── page.tsx         # Interviews list
│   │       │   ├── interviewers/
│   │       │   │   └── page.tsx         # Interviewers list
│   │       │   └── settings/
│   │       │       └── page.tsx         # Module settings
│   │       │
│   │       ├── sourcing/                # Sourcing AI Agent module
│   │       │   ├── page.tsx             # Dashboard
│   │       │   ├── roles/
│   │       │   │   ├── page.tsx         # Roles list
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx     # Role detail
│   │       │   ├── candidates/
│   │       │   │   └── page.tsx         # Sourced candidates
│   │       │   ├── outreach/
│   │       │   │   └── page.tsx         # Outreach campaigns
│   │       │   └── meetings/
│   │       │       └── page.tsx         # Meetings
│   │       │
│   │       ├── reference/
│   │       │   └── page.tsx             # Placeholder — Coming Soon
│   │       ├── onboarding/
│   │       │   └── page.tsx             # Placeholder — Coming Soon
│   │       ├── benefits/
│   │       │   └── page.tsx             # Placeholder — Coming Soon
│   │       ├── payroll/
│   │       │   └── page.tsx             # Placeholder — Coming Soon
│   │       └── engee/
│   │           └── page.tsx             # Placeholder — Coming Soon
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components (generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                      # Layout components
│   │   │   ├── sidebar.tsx              # Full sidebar with two-tier navigation
│   │   │   ├── header.tsx               # Sticky header (search, notifications, user)
│   │   │   └── mobile-menu.tsx          # Mobile hamburger toggle
│   │   │
│   │   ├── shared/                      # Reusable business components
│   │   │   ├── hero-banner.tsx          # Module dashboard header banner
│   │   │   ├── stats-card.tsx           # Metric card (icon, label, value, link)
│   │   │   ├── page-header.tsx          # Title + description + action button
│   │   │   ├── status-badge.tsx         # Active/Draft/Closed indicator
│   │   │   ├── empty-state.tsx          # "No data" placeholder
│   │   │   └── coming-soon.tsx          # Placeholder for unbuilt modules
│   │   │
│   │   ├── schedule/                    # Schedule-specific components
│   │   │   ├── agent-status.tsx         # Agent status panel
│   │   │   └── activity-feed.tsx        # Recent activity list
│   │   │
│   │   └── sourcing/                    # Sourcing-specific components
│   │       ├── campaign-card.tsx        # Active campaign summary
│   │       └── top-roles.tsx            # Top performing roles list
│   │
│   ├── data/                            # Hardcoded data (replaces database)
│   │   ├── schedule/
│   │   │   ├── jobs.ts                  # Job listings
│   │   │   ├── candidates.ts            # Candidates with AI scores
│   │   │   ├── interviews.ts            # Interview records
│   │   │   ├── interviewers.ts          # Interviewer team
│   │   │   └── settings.ts              # Default settings values
│   │   └── sourcing/
│   │       └── roles.ts                 # Sourcing roles/campaigns
│   │
│   ├── lib/
│   │   ├── utils.ts                     # cn() helper (clsx + twMerge)
│   │   └── modules.ts                   # AI_MODULES config (sidebar nav)
│   │
│   └── types/
│       └── index.ts                     # Shared TypeScript interfaces
│
├── public/
│   ├── favicon.ico
│   ├── grid.svg                         # Background grid pattern (login page)
│   └── icons/                           # Custom SVG icons for sub-nav
│       ├── analytics-dashboard.svg
│       ├── HR.svg
│       ├── team.svg
│       ├── checklist.svg
│       └── user-communication.svg
│
├── .env.example                         # Empty — no env vars needed
├── .gitignore
├── CLAUDE.md                            # Instructions for Claude Code
├── CONTRIBUTING.md                      # How to add new AI Agent modules
├── next.config.ts
├── tailwind.config.ts                   # Custom brand colors
├── tsconfig.json
├── package.json
└── package-lock.json
```

## Key Directories Explained

| Directory | Purpose |
|---|---|
| `src/app/` | Next.js App Router pages and layouts |
| `src/components/ui/` | shadcn/ui primitives — do not edit manually |
| `src/components/layout/` | Sidebar, header — structural components |
| `src/components/shared/` | Reusable across all modules |
| `src/components/<module>/` | Module-specific components |
| `src/data/` | All hardcoded data — the "database" |
| `src/lib/` | Utilities and configuration |
| `src/types/` | TypeScript interfaces |
| `public/icons/` | Custom SVG icons used in sidebar sub-nav |
| `docs/` | Project documentation |
