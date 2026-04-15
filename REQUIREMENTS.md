# Requirements — Haigent Platform

Everything needed to run this project locally from scratch.

---

## 1. System Requirements

| Tool | Minimum Version | How to Check | Download |
|------|----------------|--------------|----------|
| **Node.js** | v20.x or higher | `node --version` | https://nodejs.org |
| **pnpm** | v8.x or higher | `pnpm --version` | `npm install -g pnpm` |
| **Git** | Any recent version | `git --version` | https://git-scm.com |

> If you have Node.js but not pnpm, install it with: `npm install -g pnpm`

---

## 2. Setup Steps

### Step 1 — Clone the repository
```bash
git clone <your-repo-url>
cd haigent_project
```

### Step 2 — Install dependencies (creates node_modules)
```bash
pnpm install
```
This reads `package.json` and downloads all required packages into `node_modules/`.

> `node_modules` is never committed to git. You must run `pnpm install` every time you clone or pull on a new machine.

### Step 3 — Create the environment file
Create a `.env` file in the project root and fill in the required keys:
```
OPENAI_API_KEY=sk-...
APP_BASE_URL=http://localhost:3000
RECRUITER_EMAIL=recruiter@yourcompany.com
```

### Step 4 — Start the development server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Environment Variables

Create a `.env` file in the project root. This file is never committed to git — each developer must create their own.

### Required
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key — used by the Reference Agent for AI matching and chat (`gpt-4o`, `gpt-4o-mini`) |

### Optional (features will be limited without these)
| Variable | Description | Used By |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Engee agent (LangGraph/ChatAnthropic) |
| `RECRUITER_EMAIL` | Email address for recruiter notifications | Email notifications |
| `APP_BASE_URL` | Base URL for deep links in emails (e.g. `http://localhost:3000`) | Email notifications |
| `DEV_RECIPIENT_OVERRIDE` | Redirect all emails to one address during testing | Email testing |
| `MAILPIT_HOST` | Local SMTP catcher host (e.g. `localhost`) | Local email dev (Mailpit) |
| `MAILPIT_PORT` | Local SMTP catcher port (default `1025`) | Local email dev (Mailpit) |
| `SALESFORCE_CLIENT_ID` | Salesforce connected app client ID | Salesforce integration |
| `SALESFORCE_CLIENT_SECRET` | Salesforce connected app client secret | Salesforce integration |
| `SALESFORCE_REDIRECT_URI` | Salesforce OAuth redirect URI | Salesforce integration |
| `SMTP_HOST` | SMTP server host (default `smtp.office365.com`) | Email (SMTP transport) |
| `SMTP_PORT` | SMTP server port (default `587`) | Email (SMTP transport) |
| `SMTP_USER` | SMTP username | Email (SMTP transport) |
| `SMTP_PASSWORD` | SMTP password | Email (SMTP transport) |
| `EMAIL_FROM` | From address for outgoing emails | Email (SMTP transport) |

> If `SMTP_USER` / `SMTP_PASSWORD` are not set, emails are logged to the console instead of being sent (safe for local development).

---

## 4. Key npm Scripts

| Command | What it does |
|---------|-------------|
| `pnpm run dev` | Start local development server at http://localhost:3000 |
| `pnpm run build` | Build for production |
| `pnpm run start` | Run the production build |
| `pnpm run lint` | Run ESLint checks |

---

## 5. Troubleshooting

### `node_modules` not found / module errors
```bash
pnpm install
```

### `Module not found: Can't resolve 'nodemailer'` (or `pdf-parse`, `mammoth`)
These are Node.js-only packages listed in `serverExternalPackages` in `next.config.ts`. If you see this error, make sure your `next.config.ts` includes them:
```ts
serverExternalPackages: ["pdf-parse", "mammoth", "nodemailer"],
```
Then restart the dev server.

### Port 3000 already in use
```bash
pnpm run dev -- -p 3001
```

### Environment variable errors at runtime
Make sure your `.env` file exists in the project root and has the required keys filled in. The Reference Agent falls back to static (rule-based) scoring if `OPENAI_API_KEY` is missing.

### Engee agent not working
The Engee agent requires `ANTHROPIC_API_KEY`. The Reference Agent works with `OPENAI_API_KEY` only.

### Email not sending
If `SMTP_USER` and `SMTP_PASSWORD` are not set, the app logs emails to the console instead of sending them. Set those values in `.env` to enable real sending, or use Mailpit for local testing (`MAILPIT_HOST=localhost MAILPIT_PORT=1025`).

---

## 6. Project Architecture

### Agents
| Agent | Location | AI Provider |
|-------|----------|-------------|
| Reference Agent | `src/app/api/reference/` | OpenAI (`gpt-4o`, `gpt-4o-mini`) |
| Engee Agent | `src/app/api/engee/` | Anthropic via LangGraph (`claude-sonnet-4-6`) |

### Reference Agent API Routes
| Route | Purpose |
|-------|---------|
| `POST /api/reference/submit` | Submit a new referral + initial AI match scoring |
| `POST /api/reference/rescore` | Re-score a referral against open jobs |
| `POST /api/reference/chat` | Recruiter chat interface with 12 tools |
| `POST /api/reference/resume-parse` | Extract skills/experience from uploaded resume |
| `GET/PATCH /api/reference/referrals/[id]` | Fetch or update a referral |
| `POST /api/reference/promote-to-pool` | Promote candidate to talent pool |
| `GET /api/reference/analytics/*` | Pipeline funnel and scoring analytics |
| `GET /api/reference/audit` | Audit event log |
| `GET /api/reference/bonus-flags` | HR bonus processing flags |
| `GET /api/reference/hired-events` | Hired candidate events |
| `GET /api/reference/live-matches` | Live match scores |
| `GET /api/reference/contacts` | Candidate contact log |
| `GET /api/reference/decisions` | Recruiter decision records |
| `GET /api/reference/job-weights` | Scoring weight configuration |
| `GET /api/reference/records` | All referral records |
| `GET /api/reference/status` | Platform status |

### Server-External Packages (`next.config.ts`)
These packages use Node.js internals and must not be bundled by Turbopack:
- `pdf-parse` — PDF resume parsing
- `mammoth` — Word document (.docx) resume parsing
- `nodemailer` — SMTP email transport

---

## 7. Project Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Animation | Framer Motion |
| AI — Reference Agent | OpenAI SDK (`gpt-4o`, `gpt-4o-mini`) |
| AI — Engee Agent | LangGraph + Anthropic (`claude-sonnet-4-6`) |
| Email | Nodemailer (SMTP / Mailpit) |
| CRM | Salesforce (jsforce) |
| Document Parsing | pdf-parse, mammoth |
| Package Manager | pnpm |
