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

### Step 3 — Create the environment file
Create a `.env` file in the project root and fill in the required keys:
```bash
cp .env.example .env   # if .env.example exists, or create manually
```

### Step 4 — Start the development server
```bash
pnpm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Environment Variables

Create a `.env` file in the project root with the following variables:

### Required
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key — used by the Reference Agent for AI matching and chat |

### Optional (features will be limited without these)
| Variable | Description | Used By |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Engee agent (LangGraph/ChatAnthropic) |
| `RECRUITER_EMAIL` | Email address for recruiter notifications | Email notifications |
| `APP_BASE_URL` | Base URL for deep links in emails (e.g. `http://localhost:3000`) | Email notifications |
| `SALESFORCE_CLIENT_ID` | Salesforce connected app client ID | Salesforce integration |
| `SALESFORCE_CLIENT_SECRET` | Salesforce connected app client secret | Salesforce integration |
| `SALESFORCE_REDIRECT_URI` | Salesforce OAuth redirect URI | Salesforce integration |
| `SMTP_HOST` | SMTP server host | Email (SMTP transport) |
| `SMTP_PORT` | SMTP server port (e.g. `587`) | Email (SMTP transport) |
| `SMTP_USER` | SMTP username | Email (SMTP transport) |
| `SMTP_PASSWORD` | SMTP password | Email (SMTP transport) |
| `EMAIL_FROM` | From address for outgoing emails | Email (SMTP transport) |

Example `.env` file:
```
OPENAI_API_KEY=sk-...
APP_BASE_URL=http://localhost:3000
RECRUITER_EMAIL=recruiter@yourcompany.com
```

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

### Port 3000 already in use
```bash
pnpm run dev -- -p 3001
```

### Environment variable errors at runtime
Make sure your `.env` file exists in the project root and has the required keys filled in. The app will fall back to static (rule-based) scoring if `OPENAI_API_KEY` is missing.

### Engee agent not working
The Engee agent requires `ANTHROPIC_API_KEY` to be set. The Reference Agent works with `OPENAI_API_KEY` only.

---

## 6. Project Tech Stack (for reference)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| AI — Reference Agent | OpenAI SDK (`gpt-4o`, `gpt-4o-mini`) |
| AI — Engee Agent | LangGraph + Anthropic (`claude-sonnet-4-6`) |
| Email | Nodemailer / Resend |
| CRM | Salesforce (jsforce) |
| Package Manager | pnpm |
