# Application Architecture

## Next.js App Router Structure

```
app/
├── layout.tsx                    # Root layout (fonts, body, providers)
├── page.tsx                      # Redirects to /schedule
│
└── (dashboard)/                  # Dashboard route group (sidebar layout)
    ├── layout.tsx                # Sidebar + header + main content area
    │
    ├── schedule/                 # Schedule AI Agent module
    │   ├── page.tsx              # Dashboard
    │   ├── jobs/
    │   │   ├── page.tsx          # Jobs list
    │   │   └── [id]/page.tsx     # Job detail
    │   ├── candidates/page.tsx
    │   ├── interviews/page.tsx
    │   ├── interviewers/page.tsx
    │   └── settings/page.tsx
    │
    ├── sourcing/                 # Sourcing AI Agent module
    │   ├── page.tsx              # Dashboard
    │   ├── roles/
    │   │   ├── page.tsx          # Roles list
    │   │   └── [id]/page.tsx     # Role detail
    │   ├── candidates/page.tsx
    │   ├── outreach/page.tsx
    │   └── meetings/page.tsx
    │
    ├── reference/page.tsx        # Placeholder — "Coming Soon"
    ├── onboarding/page.tsx       # Placeholder — "Coming Soon"
    ├── benefits/page.tsx         # Placeholder — "Coming Soon"
    ├── payroll/page.tsx          # Placeholder — "Coming Soon"
    └── engee/page.tsx            # Placeholder — "Coming Soon"
```

## Layout Hierarchy

```
RootLayout (fonts, global CSS, ToastProvider)
└── (dashboard) group → sidebar + header + content layout
    ├── Sidebar (fixed left, navigation)
    ├── Header (sticky top, search, notifications)
    └── <main> content area
        └── Module pages
```

## Data Flow

There is no database. All data is served from TypeScript files:

```
src/data/schedule/jobs.ts → exports JOBS array
↓
app/(dashboard)/schedule/jobs/page.tsx → imports JOBS, renders table
```

For pages that need to "create" or "edit" data, the form can either:
- Show a toast message ("This is a demo — data is not persisted")
- Use React state to temporarily hold changes during the session

## Sidebar Navigation System

The sidebar is driven by a configuration object in `src/lib/modules.ts`:

```typescript
export const AI_MODULES = [
  {
    name: "Schedule",
    slug: "schedule",
    icon: Calendar,
    accentColor: "brand-pink",
    enabled: true,
    subPages: [
      { name: "Dashboard", path: "/schedule", icon: "analytics-dashboard" },
      { name: "Jobs", path: "/schedule/jobs", icon: "HR" },
      // ...
    ],
  },
  {
    name: "Sourcing",
    slug: "sourcing",
    icon: Search,
    accentColor: "brand-gold",
    enabled: true,
    subPages: [ /* ... */ ],
  },
  {
    name: "Reference",
    slug: "reference",
    icon: ClipboardCheck,
    enabled: false,  // Shows as locked
    subPages: [],
  },
  // ... remaining modules
];
```

The sidebar component reads this config and:
- Renders all modules in the primary nav
- Shows locked state for `enabled: false` modules
- Shows sub-navigation for the currently active module
- Highlights the active page

**To add a new module**, a contributor:
1. Adds an entry to `AI_MODULES` with `enabled: true`
2. Creates the route files under `app/(dashboard)/<slug>/`
3. Creates hardcoded data files under `src/data/<slug>/`

## Component Architecture

### Shared Components (`src/components/`)

```
components/
├── ui/                    # shadcn/ui primitives (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── table.tsx
│   ├── dropdown-menu.tsx
│   └── ...
│
├── layout/                # Layout components
│   ├── sidebar.tsx        # Full sidebar with navigation
│   ├── header.tsx         # Sticky header bar
│   └── mobile-menu.tsx    # Mobile hamburger toggle
│
└── shared/                # Reusable business components
    ├── hero-banner.tsx    # Module dashboard banner
    ├── stats-card.tsx     # Metric card (icon, label, value)
    ├── page-header.tsx    # Title + description + action button
    ├── status-badge.tsx   # Active/Draft/Closed badges
    ├── empty-state.tsx    # "No data" placeholder
    └── coming-soon.tsx    # Placeholder for unbuilt modules
```

### Module-Specific Components

Each module can have its own components directory:

```
components/
├── schedule/
│   ├── campaign-stats.tsx
│   └── activity-feed.tsx
└── sourcing/
    ├── campaign-card.tsx
    └── top-roles.tsx
```

## Reference Module Architecture

The Reference module is a full-stack employee referral platform. It is self-contained and does not depend on ServiceNow or Salesforce.

### Route Structure

```
app/(dashboard)/reference/
├── page.tsx                          # Dashboard — pipeline stats, quick actions
├── submit/page.tsx                   # Referral submission form
├── candidates/
│   ├── page.tsx                      # Candidate pipeline — scoring, decisions, bulk actions
│   └── [id]/page.tsx                 # Individual candidate detail
├── referrals/
│   └── [referral_id]/
│       ├── page.tsx                  # Referral detail view
│       └── edit/page.tsx             # Edit referral fields
├── pool/page.tsx                     # Talent pool management
├── jobs/page.tsx                     # Open job postings
├── scoring-config/page.tsx           # Global + per-job scoring weights
└── chat/page.tsx                     # AI chat interface for the referral agent
```

### API Routes

```
app/api/reference/
├── submit/          POST — submit referral, run scoring, fire R1/R2/E1/E2/C1 emails
├── records/         GET  — list all referrals
├── referrals/[id]/  GET  — single referral detail
│                    PATCH — edit referral fields, triggers rescore if scoring fields change
├── decisions/       POST — PROCEED / ON_HOLD / NOT_SUITABLE decision, fires E4 email
│                    GET  — list all decisions
├── status/          POST — status override (matched/closed/on_hold/hired), fires E4/E5 emails
│                    GET  — list all overrides
├── rescore/         POST — re-run scoring, fires R2/A2 emails on improvement
├── promote-to-pool/ POST — promote to talent pool, fires R3/E(pool)/C2 emails
│                    GET  — list pool entries
├── referral-actions/POST — reject referral (not_suitable), fires R4 email
│                    GET  — list rejected IDs
├── contacts/        POST — log recruiter contact event, fires E3 email
│                    GET  — contacts by referral_id
├── contacts/[id]/   PATCH — update contact status
├── scoring-config/  GET/PUT — global scoring weights
├── job-weights/     GET/POST — per-job weight overrides
├── live-matches/    GET  — all match records
├── audit/           POST — append audit event
│                    GET  — full audit trail
├── resume-parse/    POST — extract structured data from uploaded resume (Claude AI)
├── digest/          POST — send stale referral digest email (R5, cron-callable)
│                    GET  — preview which referrals would be included
└── chat/            POST — streaming AI chat for the referral agent
```

### Data Persistence

No database. All state is written to JSON files under `src/data/reference/json/`:

```
src/data/reference/json/
├── referrals.json          # Submitted referrals
├── matches.json            # Match score records
├── pool-entries.json       # Talent pool entries
├── decisions.json          # Recruiter decisions
├── rejected-ids.json       # Rejected referral IDs
├── audit-events.json       # Full audit trail
├── status-overrides.json   # Manual status overrides
├── scoring-weights.json    # Global scoring weights
├── job-weight-overrides.json # Per-job weight overrides
├── contacts.json           # Recruiter contact events
└── notification-log.json   # Email send history (all attempts)
```

The in-memory store (`src/lib/reference-store.ts`) is hydrated from disk at the start of each API request via `hydrateIfEmpty()`. Writes go to both the store and disk atomically.

### Scoring System

Two modes — selected automatically based on environment:

| Mode | When used | How |
|---|---|---|
| AI scoring | `ANTHROPIC_API_KEY` is set | Claude Haiku evaluates candidate vs all open jobs, returns JSON scores |
| Static scoring | No API key, or AI fails | Rule-based: skill keyword overlap, experience range check, location token match, seniority bands |

Both modes produce scores for: `skill_overlap`, `experience`, `location`, `seniority`. A weighted average produces `match_score` (0–100) and `classification` (Strong Match ≥ 70, Partial Match ≥ 50, No Match < 50). Weights are configurable globally and per-job.

### Email Notification System

Transport: Microsoft 365 SMTP (`smtp.office365.com:587`, STARTTLS) via Nodemailer.

All sends go through `src/lib/email.ts → sendEmail()` which:
1. Checks `src/data/reference/notification-prefs.json` — skips silently if type is set to `false`
2. Falls back to console-log if `SMTP_USER`/`SMTP_PASSWORD` are missing (dev mode)
3. Routes through Mailpit if `MAILPIT_HOST` env var is set (local SMTP catcher, no real sends)
4. Appends every attempt (success or failure) to `notification-log.json`

| Env var | Purpose |
|---|---|
| `SMTP_HOST` | SMTP server (default: `smtp.office365.com`) |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_USER` | SMTP username / sender address |
| `SMTP_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Display name + address for From header |
| `RECRUITER_EMAIL` | Default recruiter inbox for all recruiter notifications |
| `DEV_RECIPIENT_OVERRIDE` | Redirect all emails to one address during testing |
| `MAILPIT_HOST` | If set, routes all mail through local Mailpit catcher |
| `MAILPIT_PORT` | Mailpit SMTP port (default: `1025`) |

Notification matrix:

| ID | Recipient | Trigger route |
|---|---|---|
| R1 | Recruiter | `submit` — new referral received |
| R2 | Recruiter | `submit` + `rescore` — strong/partial match found |
| R3 | Recruiter | `promote-to-pool` |
| R4 | Recruiter | `referral-actions` — rejection confirmed |
| R5 | Recruiter | `digest` — weekly stale referral list |
| A2 | Recruiter | `rescore` — classification improved vs previous run |
| E1 | Referrer | `submit` — submission confirmation |
| E2 | Referrer | `submit` — best match score |
| E3 | Referrer | `contacts` — recruiter logged contact with candidate |
| E4 | Referrer | `decisions` + `status` — PROCEED / ON_HOLD / NOT_SUITABLE |
| E5 | Referrer | `status` — candidate hired |
| C1 | Candidate | `submit` — you've been referred |
| C2 | Candidate | `promote-to-pool` — added to talent pool |

### MCP Email Server

A standalone MCP server at `mcp-email-server/` exposes two tools:
- `send_email` — send a single HTML email via Microsoft 365
- `verify_connection` — test SMTP credentials without sending

Configured in `.claude/settings.local.json` under `mcpServers.email`. Reads the same SMTP env vars as `email.ts`.

## Key Design Decisions

1. **No database** — hardcoded TypeScript data files are simpler for contributors to modify and understand
2. **No auth** — the app loads directly into the dashboard; no login, no user profiles
3. **Module config object** — centralized navigation config makes adding modules mechanical
4. **shadcn/ui** — matches the original app's component library; provides accessible, customizable components
5. **Placeholder pages** — unbuilt modules show "Coming Soon" with the module's description, not a 404
