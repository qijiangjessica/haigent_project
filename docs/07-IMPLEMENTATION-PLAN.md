# Implementation Plan

## Phase 1: Project Scaffolding ✅
- [x] Initialize Next.js 15 with App Router, TypeScript, Tailwind CSS
- [x] Install dependencies: `lucide-react`, `clsx`, `tailwind-merge`, `framer-motion`
- [x] Initialize shadcn/ui
- [x] Configure brand colors as CSS variables in `globals.css`
- [x] Add fonts (Lato, Source Sans 3) via `next/font/google`
- [x] Create `.env.example`

## Phase 2: Layout & Navigation ✅
- [x] `src/lib/modules.ts` — module configuration array
- [x] Dashboard layout with sidebar + header
- [x] Sidebar with active highlighting, locked states, sub-navigation
- [x] Mobile hamburger menu

## Phase 3: Shared Components ✅
- [x] `hero-banner.tsx` — gradient header with title, badge, subtitle, optional actions
- [x] `stats-card.tsx` — metric card
- [x] `page-header.tsx` — simple title + description
- [x] `status-badge.tsx`
- [x] `empty-state.tsx`
- [x] `coming-soon.tsx`

## Phase 4: Schedule Module ✅
- [x] Dashboard with HeroBanner, stats cards, agent status, recent activity
- [x] Jobs list + detail pages
- [x] Candidates, Interviews, Interviewers, Settings pages

## Phase 5: Sourcing Module ✅
- [x] Dashboard with campaign cards and top roles
- [x] Roles list + detail pages
- [x] Candidates, Outreach, Meetings pages

## Phase 6: Onboarding Module ✅
- [x] ServiceNow Virtual Agent integration
- [x] AI chat assistant with Claude tool-use
- [x] Dashboard with live ServiceNow data
- [x] Accent color: `brand-lime`

## Phase 7: Benefits Module ✅
- [x] ServiceNow benefits and enrollment data
- [x] HeroBanner with `brand-yellow` gradient
- [x] Stats cards (live from ServiceNow)
- [x] AI chat assistant
- [x] Benefits enrollment table

## Phase 8: Payroll Module ✅
- [x] Salesforce Agentforce session-based integration
- [x] Full-page AI chat UI (`h-[calc(100vh-280px)]`)
- [x] HeroBanner with `brand-cyan` gradient
- [x] Accent color: `brand-cyan`

## Phase 9: Engee Module ✅
- [x] 7-step interest survey form with Framer Motion transitions
- [x] Mentor matching API (`/api/engee/mentor-suggest`)
- [x] Survey storage API (`/api/engee/survey`)
- [x] Engee agent (`/api/engee/chat`) — Claude + agentic loop
- [x] 9 tools: engagement lookup, team summary, survey submit, mentor match, mentor lookup, calendar check, coffee chat, engagement note, attrition flag
- [x] ServiceNow integration for engagement/attrition tracking
- [x] Microsoft Teams Adaptive Card with @mention
- [x] Slack webhook with user mentions
- [x] Accent color: `brand-lime` (#9ABF45)
- [x] HeroBanner with `brand-lime` gradient

## Phase 10: workIQ — Calendar Availability ✅
- [x] `src/lib/calendar.ts` — Microsoft Graph API `findMeetingTimes` integration
- [x] `find_available_meeting_slots` tool in Engee agent
- [x] Smart mock slot fallback when Azure credentials absent
- [x] 3 suggested 30-minute slots passed into Teams/Slack message
- [x] Separate Professional Interests and Personal Interests rows in Teams card

## Remaining Work

- [ ] Reference module — automated reference check workflows
- [ ] Persist Engee surveys to a real database (Supabase or SQLite)
- [ ] Azure AD app registration guide for workIQ live calendar
- [ ] Authentication layer (currently open access)
