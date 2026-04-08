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
| Phase 7 | Large | Reference module — core pipeline + scoring |
| Phase 8 | Medium | Reference module — email notifications |
| Phase 9 | Small | Reference module — MCP email server |

---

## Phase 7: Reference Module — Core Pipeline

**Goal:** Fully working employee referral pipeline with submission, scoring, decisions, and pool management.

### Data & Store
- [x] `src/data/reference/candidates.ts` — seeded candidate pool
- [x] `src/data/reference/jobs.ts` — open job postings with required skills and experience ranges
- [x] `src/lib/reference-store.ts` — in-memory store (referrals, matches, pool entries, decisions, audit events, status overrides, scoring weights)
- [x] `src/lib/reference-json-persistence.ts` — read/write all store state to `src/data/reference/json/`
- [x] `src/types/index.ts` — shared types: `SubmittedReferral`, `LiveMatchRecord`, `LivePoolEntry`, `RecruiterDecision`, `LiveAuditEvent`, `ContactEvent`, `NotificationLogEntry`

### API Routes
- [x] `POST /api/reference/submit` — validate, persist referral, run AI/static scoring, return match results
- [x] `GET /api/reference/records` — list all referrals
- [x] `GET/PATCH /api/reference/referrals/[id]` — detail + edit with automatic rescore on field change
- [x] `POST /api/reference/rescore` — re-run scoring for a specific referral
- [x] `POST/GET /api/reference/decisions` — recruiter decision (PROCEED/ON_HOLD/NOT_SUITABLE)
- [x] `POST/GET /api/reference/status` — manual status override
- [x] `POST/GET /api/reference/promote-to-pool` — promote referral to talent pool with level/tags
- [x] `POST/GET /api/reference/referral-actions` — reject referral with reason code + audit event
- [x] `POST/GET /api/reference/contacts` — log recruiter contact events per job posting
- [x] `PATCH /api/reference/contacts/[id]` — update contact status
- [x] `GET/PUT /api/reference/scoring-config` — global scoring weights
- [x] `GET/POST /api/reference/job-weights` — per-job weight overrides
- [x] `GET /api/reference/live-matches` — all match records
- [x] `POST/GET /api/reference/audit` — audit event append + full trail
- [x] `POST /api/reference/resume-parse` — Claude AI resume extraction

### Scoring System
- [x] Static rule-based scoring (skill keyword overlap, experience range, location tokens, seniority bands)
- [x] AI scoring via `claude-haiku-4-5-20251001` with JSON response parsing
- [x] Automatic fallback from AI → static on error
- [x] Weighted average with configurable weights (skill / experience / location / seniority)
- [x] Per-job weight overrides layered over global config

### UI Pages
- [x] `/reference` — dashboard with pipeline stats and quick actions
- [x] `/reference/submit` — referral submission form with resume upload
- [x] `/reference/candidates` — pipeline view: scoring, bulk decisions, status overrides, promote/reject actions
- [x] `/reference/candidates/[id]` — individual candidate detail with match breakdown
- [x] `/reference/referrals/[id]` — referral detail
- [x] `/reference/referrals/[id]/edit` — edit referral fields
- [x] `/reference/pool` — talent pool management
- [x] `/reference/jobs` — open job postings
- [x] `/reference/scoring-config` — global + per-job weight configuration with manual override
- [x] `/reference/chat` — AI chat interface

---

## Phase 8: Reference Module — Email Notifications

**Goal:** All recruiter, referrer, and candidate notifications wired to the correct trigger points.

### Infrastructure
- [x] `src/lib/email.ts` — central `sendEmail()` with SMTP transport, dev-mode logging, Mailpit support, notification preferences check
- [x] `src/lib/email-templates.ts` — typed HTML email templates for all 14 notification types
- [x] `src/data/reference/notification-prefs.json` — per-type opt-in/out config (set any type to `false` to suppress)
- [x] `src/data/reference/json/notification-log.json` — every send attempt logged with status + error

### Recruiter Notifications
- [x] R1 — New referral received (`submit`)
- [x] R2 — Strong/Partial match found (`submit` + `rescore`)
- [x] R3 — Candidate promoted to pool (`promote-to-pool`)
- [x] R4 — Referral rejected with reason code (`referral-actions`)
- [x] R5 — Weekly stale referral digest — `POST /api/reference/digest` (cron-callable, `GET` for preview)
- [x] A2 — Score improved after rescore — fires only when classification rank improves

### Referrer Notifications
- [x] E1 — Submission confirmation (`submit`)
- [x] E2 — Best match result (`submit`)
- [x] E3 — Recruiter contacted candidate (`contacts`)
- [x] E4 — Decision status change — PROCEED / ON_HOLD / NOT_SUITABLE (`decisions` + `status`)
- [x] E5 — Candidate hired (`status` when status = `hired`)

### Candidate Notifications
- [x] C1 — You've been referred (`submit`)
- [x] C2 — Added to talent pool (`promote-to-pool`)

### Configuration
- [x] `RECRUITER_EMAIL` env var — default recruiter inbox (uncomment in `.env` to activate)
- [x] Per-action recruiter email override — `promote-to-pool` and `decisions` accept optional `recruiter_email` body field; promote form UI has "Notify Recruiter" email input

---

## Phase 9: Reference Module — MCP Email Server

**Goal:** Standalone MCP server for email operations, usable from Claude Code.

- [x] `mcp-email-server/src/index.ts` — MCP server with `send_email` and `verify_connection` tools
- [x] Microsoft 365 SMTP transport via Nodemailer (same config as `email.ts`)
- [x] Registered in `.claude/settings.local.json` under `mcpServers.email`
- [x] `verify_connection` confirmed working against `smtp.office365.com:587`
