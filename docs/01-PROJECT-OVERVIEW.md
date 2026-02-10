# Haigent Platform — Project Overview

## What Is This?

A lightweight replica of the **Haigent AI HR Platform** demo at `demos.haigent.ai`. This is a self-contained Next.js application with hardcoded data — no external database or services required. It replicates the two existing modules (Schedule and Sourcing) and provides scaffolding for contributors to build out the remaining AI Agent modules.

## Goals

1. **Visual replica** of the Schedule and Sourcing dashboard pages with realistic hardcoded data
2. **Extensible architecture** — adding a new AI Agent module (e.g., Onboarding) should require minimal boilerplate
3. **Zero external dependencies** — no database, no Supabase, no third-party APIs. Runs with `npm run dev`
4. **GitHub-ready** — clean repo structure, clear contributor docs, works when cloned fresh
5. **Claude Code friendly** — structured so AI-assisted development is productive

## Scope

This is intentionally a **lightweight demo shell**, not a full production app. It provides:

- A sidebar with all 7 AI Agent modules listed
- Two fully-built dashboard pages (Schedule, Sourcing)
- Sub-pages for each module (Jobs, Candidates, etc.) as simple list/detail views
- Placeholder pages for the 5 unbuilt modules (Reference, Onboarding, Benefits, Payroll, Engee)
- Hardcoded sample data in TypeScript files — no database needed
- No authentication — the app loads directly into the dashboard

## What This Is NOT

- Not a production-ready application
- Not connected to any external services (no Supabase, no Cal.com, no AI scoring)
- Not a pixel-perfect clone — it matches the layout, colors, and structure but uses simplified components
- No authentication, login, or user management

## Modules

| Module | Route | Status | Description |
|---|---|---|---|
| **Schedule** | `/schedule` | Built | Interview scheduling with AI candidate scoring |
| **Sourcing** | `/sourcing` | Built | Candidate sourcing with AI screening and outreach |
| Reference | `/reference` | Placeholder | Reference check automation |
| Onboarding | `/onboarding` | Placeholder | Employee onboarding workflows |
| Benefits | `/benefits` | Placeholder | Benefits enrollment and management |
| Payroll | `/payroll` | Placeholder | Payroll processing and tracking |
| Engee | `/engee` | Placeholder | Employee engagement platform |

## Getting Started

```bash
git clone <repo-url>
cd haigent-platform
npm install
npm run dev
# Open http://localhost:3000 → loads directly into the Schedule dashboard
```
