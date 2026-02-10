# Implementation Plan

## Phase 1: Project Scaffolding
**Goal:** Empty Next.js project that runs with `npm run dev`.

- [ ] Initialize Next.js 15 with App Router, TypeScript, Tailwind CSS, `src/` directory
- [ ] Install dependencies: `lucide-react`, `clsx`, `tailwind-merge`
- [ ] Initialize shadcn/ui — add components: Button, Card, Input, Label, Badge, Table, DropdownMenu
- [ ] Configure Tailwind with brand colors (`brand-charcoal`, `brand-pink`, `brand-gold`, `brand-teal`, `brand-green`)
- [ ] Add fonts (Lato, Source Sans 3) via `next/font/google`
- [ ] Create `src/lib/utils.ts` with `cn()` helper
- [ ] Create `.gitignore`, `.env.example`
- [ ] Create `globals.css` with Tailwind directives
- [ ] Verify: `npm run dev` shows a blank page at `localhost:3000`

## Phase 2: Layout & Navigation
**Goal:** Sidebar, header, and dashboard shell working.

- [ ] Create `src/lib/modules.ts` — module configuration array (`AI_MODULES`)
- [ ] Create `src/app/(dashboard)/layout.tsx` — sidebar + header + main content
- [ ] Build `src/components/layout/sidebar.tsx`
  - Logo area (gold "H", "Haigent", "AI Platform")
  - Primary nav: all 7 AI Agent modules with correct icons
  - Active state highlighting (pink for Schedule, gold for Sourcing)
  - Locked state for disabled modules (opacity, lock icon, cursor-not-allowed)
  - Secondary nav: module sub-pages (changes based on active module)
  - Footer: Settings link
- [ ] Build `src/components/layout/header.tsx`
  - Page title (dynamic)
  - Search input (display only)
  - Notification bell with dot indicator
- [ ] Build `src/components/layout/mobile-menu.tsx` — hamburger toggle for mobile
- [ ] Add custom SVG icons to `public/icons/`
- [ ] Create `src/app/page.tsx` — redirect to `/schedule`
- [ ] Verify: sidebar renders with all modules, active states work, mobile menu toggles

## Phase 3: Shared Components
**Goal:** Reusable components ready for all modules.

- [ ] `src/components/shared/hero-banner.tsx` — configurable background color, title, badge, subtitle, action button
- [ ] `src/components/shared/stats-card.tsx` — icon, label, value, link, background color, hover animation
- [ ] `src/components/shared/page-header.tsx` — title, description, optional action button
- [ ] `src/components/shared/status-badge.tsx` — Active/Draft/Closed/Applied/Scored badges
- [ ] `src/components/shared/empty-state.tsx` — message + optional action link
- [ ] `src/components/shared/coming-soon.tsx` — placeholder for unbuilt modules

## Phase 4: Schedule Module
**Goal:** Schedule dashboard and sub-pages with hardcoded data.

### Data Files
- [ ] `src/data/schedule/jobs.ts`
- [ ] `src/data/schedule/candidates.ts`
- [ ] `src/data/schedule/interviews.ts`
- [ ] `src/data/schedule/interviewers.ts`
- [ ] `src/data/schedule/settings.ts`

### Dashboard (`/schedule`)
- [ ] Hero banner (pink, "Schedule Haigent", "AI-Powered" badge)
- [ ] Quick Actions dropdown (Create New Job, Manage Interviewers, View Interviews)
- [ ] 4 stats cards (Active Jobs, Total Candidates, Scheduled Interviews, Avg AI Score)
- [ ] Agent Status card (static content)
- [ ] Recent Activity card (static activity items or skeleton state)

### Sub-Pages
- [ ] Jobs list (`/schedule/jobs`) — header, stats row, data table with sample jobs
- [ ] Job detail (`/schedule/jobs/[id]`) — header, stats, description, candidates filtered by job
- [ ] Candidates list (`/schedule/candidates`) — header, stats row, candidates table
- [ ] Interviews (`/schedule/interviews`) — header, stats tabs, empty state
- [ ] Interviewers (`/schedule/interviewers`) — header, stats row, interviewers table
- [ ] Settings (`/schedule/settings`) — form sections (display-only or local state)

## Phase 5: Sourcing Module
**Goal:** Sourcing dashboard and sub-pages with hardcoded data.

### Data Files
- [ ] `src/data/sourcing/roles.ts`

### Dashboard (`/sourcing`)
- [ ] Hero banner (gold, "Sourcing Haigent", "AI-Powered" badge)
- [ ] 4 stats cards (Active Roles, Total Candidates, Response Rate, Meetings Scheduled)
- [ ] Active Campaigns section with campaign cards (Delivery Manager, Account Manager)
- [ ] Top Performing Roles section (ranked list)
- [ ] Recent Activity card (skeleton state)

### Sub-Pages
- [ ] Roles list (`/sourcing/roles`) — header, stats row, role cards with skill tags
- [ ] Role detail (`/sourcing/roles/[id]`) — header, stats, campaign details
- [ ] Candidates (`/sourcing/candidates`) — empty state
- [ ] Outreach (`/sourcing/outreach`) — empty state
- [ ] Meetings (`/sourcing/meetings`) — empty state

## Phase 6: Placeholder Modules & Polish
**Goal:** All routes work, no 404s, GitHub-ready.

- [ ] Create "Coming Soon" pages for: Reference, Onboarding, Benefits, Payroll, Engee
  - Each shows module name, description, "This module is under development" message
  - Uses the `coming-soon.tsx` shared component
- [ ] Update locked modules in sidebar to link to their placeholder pages (not `#`)
- [ ] Create `CLAUDE.md` with project instructions for Claude Code users
- [ ] Create `CONTRIBUTING.md` with step-by-step guide for adding new modules
- [ ] Final review: all navigation works, styles are consistent, no console errors
- [ ] Initialize git repo, create initial commit

## Phase Summary

| Phase | Effort | Deliverable |
|---|---|---|
| Phase 1 | Small | Running Next.js project with Tailwind + shadcn/ui |
| Phase 2 | Medium | Sidebar + header + dashboard shell |
| Phase 3 | Small | Reusable shared components |
| Phase 4 | Large | Full Schedule module (biggest phase) |
| Phase 5 | Medium | Full Sourcing module |
| Phase 6 | Small | Placeholder pages, docs, git init |
