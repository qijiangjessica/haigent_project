# Reference Agent — Implementation Plan

## Overview

The Reference Agent is a full-stack module within the HaiGent platform that automates the employee referral process — from submission through AI-powered candidate matching, talent pool management, recruiter decision workflows, and email notifications.

---

## Modules & Status

### F — Foundation

| ID | Task | Status |
|----|------|--------|
| F1 | In-memory store (`reference-store.ts`) — types, state, and accessors | Done |
| F2 | JSON persistence layer (`reference-json-persistence.ts`) — atomic reads/writes | Done |
| F3 | Seeded data files (candidates, references, matches, jobs, audit log, talent pool) | Done |
| F4 | Email utility (`email.ts`) — Microsoft 365 SMTP via Nodemailer, dev mode, Mailpit support, notification prefs check, notification log | Done |
| F5 | Email templates (`email-templates.ts`) — 14 typed HTML templates | Done |
| F6 | MCP email server (`mcp-email-server/`) — `send_email` + `verify_connection` tools over stdio | Done |
| F7 | Notification preferences config (`src/data/reference/notification-prefs.json`) — per-type opt-in/out, no restart required | Done |

---

### S — Submission

| ID | Task | Status |
|----|------|--------|
| S1 | Submit referral form (`/reference/submit`) — referrer info, candidate details, job targeting | Done |
| S2 | Resume upload and parsing (`/api/reference/resume-parse`) — PDF/DOCX/TXT extraction via Claude | Done |
| S3 | Referral submission API (`POST /api/reference/submit`) — generates referral_id, persists | Done |
| S4 | Duplicate candidate detection (email match against seeded + submitted) | Done |
| S5 | Referral edit page (`/reference/referrals/[referral_id]/edit`) | Done |

---

### M — Matching

| ID | Task | Status |
|----|------|--------|
| M1 | Static scoring engine — keyword overlap, experience range, location tokens, seniority | Done |
| M2 | AI scoring engine — Claude Haiku prompt with structured JSON output | Done |
| M3 | Fallback: AI scoring fails → static scoring | Done |
| M4 | Match records persisted per referral (`matches.json`) | Done |
| M5 | `GET /api/reference/live-matches` — with hydration fix (`\|\|` condition) | Done |

---

### W — Scoring Weights

| ID | Task | Status |
|----|------|--------|
| W1 | Global scoring weights (skill 50%, experience 25%, location 15%, seniority 10%) | Done |
| W2 | Per-job weight overrides stored independently | Done |
| W3 | `GET/PUT /api/reference/scoring-config` | Done |
| W4 | `GET/POST/DELETE /api/reference/job-weights` | Done |
| W5 | Scoring config UI (`/reference/scoring-config`) — sliders, preview, manual override | Done |
| W6 | Bulk re-score API (`POST /api/reference/rescore`) — recalculates all referrals | Done |

---

### C — Contact & Outreach Tracking

| ID | Task | Status |
|----|------|--------|
| C1 | `ContactEvent` type added to `src/types/index.ts` | Done |
| C2 | Contact persistence functions in `reference-json-persistence.ts` | Done |
| C3 | `GET/POST /api/reference/contacts` — log contact attempts per referral | Done |
| C4 | `PATCH /api/reference/contacts/[contact_id]` — cycle status (sent → replied → no_response) | Done |
| C5 | `GET /api/reference/contacts/summary` — contacted count per referral | Done |
| C6 | `ContactHistoryPanel` component — collapsible, optimistic status cycling | Done |
| C7 | "Mark Contacted" inline form on referral and candidate detail pages | Done |
| C8 | Activity pill on candidates list (Xd · Y matched · Z contacted) | Done |

---

### B — Banner & Activity Tracking

| ID | Task | Status |
|----|------|--------|
| B1 | `ReferralActivityBanner` component — days since, matched count, contacted count | Done |
| B2 | Stale indicator: amber warning when >14 days with 0 contacts | Done |
| B3 | Banner wired to submit confirmation page (Day 0 state) | Done |
| B4 | Banner wired to referral detail page | Done |
| B5 | Banner wired to candidate detail page | Done |

---

### D — Decisions & Pool

| ID | Task | Status |
|----|------|--------|
| D1 | `GET/POST /api/reference/decisions` — PROCEED / ON_HOLD / NOT_SUITABLE | Done |
| D2 | `POST /api/reference/referral-actions` — reject referral | Done |
| D3 | `POST /api/reference/promote-to-pool` — create LivePoolEntry with tags | Done |
| D4 | Pool page (`/reference/pool`) — view, filter, search promoted candidates | Done |
| D5 | Recruiter decision UI on candidate list and detail pages | Done |

---

### E — Email Notifications

#### Recruiter notifications

| ID | Task | Trigger | Status |
|----|------|---------|--------|
| R1 | New referral alert → recruiter | `POST /api/reference/submit` | Done |
| R2 | Strong/Partial match found → recruiter (full match table) | `submit` + `rescore` | Done |
| R3 | Candidate promoted to pool → recruiter | `POST /api/reference/promote-to-pool` | Done |
| R4 | Referral rejected → recruiter (with reason code) | `POST /api/reference/referral-actions` | Done |
| R5 | Weekly stale referral digest → recruiter (>14 days, 0 contacts) | `POST /api/reference/digest` (cron-callable) | Done |
| A2 | Score improved after rescore → recruiter (classification upgrade only) | `POST /api/reference/rescore` | Done |

#### Referrer / employee notifications

| ID | Task | Trigger | Status |
|----|------|---------|--------|
| E1 | Submission confirmation → referrer | `POST /api/reference/submit` | Done |
| E2 | Best match result → referrer | `POST /api/reference/submit` | Done |
| E3 | Recruiter contacted candidate → referrer | `POST /api/reference/contacts` | Done |
| E4 | Status change → referrer (PROCEED / ON_HOLD / NOT_SUITABLE) | `POST /api/reference/decisions` + `POST /api/reference/status` | Done |
| E5 | Candidate hired → referrer (triggers bonus process) | `POST /api/reference/status` when status = `hired` | Done |

#### Candidate notifications

| ID | Task | Trigger | Status |
|----|------|---------|--------|
| C1 | You've been referred → candidate | `POST /api/reference/submit` | Done |
| C2 | Added to talent pool → candidate | `POST /api/reference/promote-to-pool` | Done |

#### Infrastructure

| ID | Task | Status |
|----|------|--------|
| NL | `NotificationLogEntry` type + append-only log persistence | Done |
| NP | `notification-prefs.json` — per-type opt-in/out checked on every send | Done |
| NO | Per-action recruiter email override — `promote-to-pool` + `decisions` accept `recruiter_email` body field; promote form UI has "Notify Recruiter" input | Done |
| DEV | `DEV_RECIPIENT_OVERRIDE` env var — redirect all emails to one address for testing | Done |
| MP | Mailpit support — set `MAILPIT_HOST` / `MAILPIT_PORT` to catch all mail locally | Done |

---

### P — Pages & Navigation

| ID | Task | Status |
|----|------|--------|
| P1 | Reference dashboard (`/reference`) — stats, live feed, seeded data | Done |
| P2 | Candidates list (`/reference/candidates`) — search, filter, sort, CSV export | Done |
| P3 | Candidate detail (`/reference/candidates/[id]`) — profile, matches, decisions, contacts | Done |
| P4 | Referral detail (`/reference/referrals/[referral_id]`) — matches, pool promotion, contacts | Done |
| P5 | Jobs list (`/reference/jobs`) — open positions with live match counts | Done |
| P6 | Submit form (`/reference/submit`) — multi-step with resume parsing | Done |
| P7 | Scoring config (`/reference/scoring-config`) — weight sliders, re-score | Done |
| P8 | AI chat assistant (`ReferenceChat`) — Claude-backed Q&A | Done |

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Optional | Enables AI scoring and resume extraction; falls back to static scoring if missing |
| `SMTP_HOST` | Optional | SMTP server (default: `smtp.office365.com`) |
| `SMTP_PORT` | Optional | SMTP port (default: `587`) |
| `SMTP_USER` | Optional | SMTP username / sender address; if missing, email runs in dev log-only mode |
| `SMTP_PASSWORD` | Optional | SMTP password |
| `EMAIL_FROM` | Optional | From header display name + address |
| `RECRUITER_EMAIL` | Optional | Default recruiter inbox for all recruiter notifications (uncomment in `.env`) |
| `APP_BASE_URL` | Optional | Base URL for deep links in emails (default: `http://localhost:3000`) |
| `DEV_RECIPIENT_OVERRIDE` | Optional | Redirect all emails to one address for safe testing |
| `MAILPIT_HOST` | Optional | If set, routes all mail through local Mailpit SMTP catcher instead of Office 365 |
| `MAILPIT_PORT` | Optional | Mailpit SMTP port (default: `1025`) |
| `DIGEST_SECRET` | Optional | Bearer token to protect `POST /api/reference/digest`; open if not set |

---

## Scoring Formula

```
match_score = (skill_overlap × weight.skill)
            + (experience   × weight.experience)
            + (location     × weight.location)
            + (seniority    × weight.seniority)

Default weights (sum to 100):
  skill       = 50%
  experience  = 25%
  location    = 15%
  seniority   = 10%

Classification:
  ≥ 70  →  Strong Match
  50–69 →  Partial Match
  < 50  →  No Match
```

---

## Data Flow Summary

```
Employee submits referral
  └─ POST /api/reference/submit
       ├─ Duplicate check
       ├─ AI scoring (Claude Haiku) or static scoring fallback
       ├─ Persist referral + matches to JSON
       └─ Send emails (fire-and-forget):
            R1 → recruiter: new referral alert (with [Duplicate] tag if applicable)
            R2 → recruiter: match results table (if any Strong/Partial matches)
            E1 → referrer: submission confirmation
            E2 → referrer: best match score
            C1 → candidate: you've been referred

Recruiter reviews candidates list (/reference/candidates)
  ├─ Loads seeded candidates + live submitted referrals
  ├─ Fetches live match scores from /api/reference/live-matches
  └─ Activity pill: days since · matched · contacted

Recruiter logs contact event (/api/reference/contacts)
  └─ E3 → referrer: recruiter has reached out to your candidate

Recruiter sets decision (PROCEED / ON_HOLD / NOT_SUITABLE)
  └─ POST /api/reference/decisions
       └─ E4 → referrer: status change notification

Recruiter applies status override (matched / on_hold / closed / hired)
  └─ POST /api/reference/status
       ├─ E4 → referrer: status change (for PROCEED/ON_HOLD/NOT_SUITABLE)
       └─ E5 → referrer: candidate hired (when status = hired)

Recruiter rejects referral
  └─ POST /api/reference/referral-actions
       └─ R4 → recruiter: rejection confirmation with reason code

Recruiter promotes to pool
  └─ POST /api/reference/promote-to-pool
       ├─ R3 → recruiter: pool promotion confirmation
       ├─ referrer: pool promotion (promotedToPoolReferrer)
       └─ C2 → candidate: added to talent pool

Recruiter rescores a referral
  └─ POST /api/reference/rescore
       ├─ R2 → recruiter: updated match results
       └─ A2 → recruiter: score improved (only if classification rank increases)

Scheduler (weekly cron)
  └─ POST /api/reference/digest
       └─ R5 → recruiter: stale referral digest (referrals >14 days, 0 contacts)

Recruiter adjusts scoring weights (/reference/scoring-config)
  ├─ Updates global or per-job weights
  └─ Triggers bulk re-score of all referrals
```
