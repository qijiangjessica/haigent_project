# Haigent Platform — Project Overview

## What Is This?

A full-stack **Haigent AI HR Platform** demo built with Next.js. The platform hosts multiple AI Agent modules that automate HR workflows — from candidate scheduling to new employee engagement. Each module connects to real external services (Anthropic Claude, ServiceNow, Salesforce Agentforce, Microsoft Teams, Slack, and Microsoft 365 Calendar).

## Goals

1. **Live AI agents** — each module runs a real AI agent (Claude) with tools and agentic loops
2. **Real integrations** — ServiceNow, Salesforce, Teams/Slack webhooks, Microsoft Graph API
3. **Extensible architecture** — adding a new AI Agent module requires minimal boilerplate
4. **Demo-ready** — modules gracefully fall back to mock data when external services are unavailable
5. **Claude Code friendly** — structured so AI-assisted development is productive

## Modules

| Module | Route | Status | Accent Color | Integrations |
|---|---|---|---|---|
| **Schedule** | `/schedule` | Built | `brand-pink` | Static data |
| **Sourcing** | `/sourcing` | Built | `brand-gold` | Static data |
| **Reference** | `/reference` | Coming Soon | `brand-teal` | — |
| **Onboarding** | `/onboarding` | Built | `brand-lime` | ServiceNow Virtual Agent |
| **Benefits** | `/benefits` | Built | `brand-yellow` | ServiceNow |
| **Payroll** | `/payroll` | Built | `brand-cyan` | Salesforce Agentforce |
| **Engee** | `/engee` | Built | `brand-lime` | Claude AI · Teams/Slack · Microsoft Graph API · ServiceNow |

## Engee — Employee Engagement Agent

Engee is the most sophisticated module. It supports new hires through their first 90 days:

1. **Interest Survey** — 7-step form capturing professional interests, hobbies, work style, and goals
2. **Mentor Matching** — AI-powered matching against a roster of 10 mentors across 6 departments
3. **workIQ Calendar Check** — queries both the employee's and mentor's Microsoft 365 Outlook calendars via Graph API to suggest 3 available 30-minute coffee chat slots
4. **Coffee Chat Scheduling** — sends a rich Adaptive Card to Microsoft Teams (with @mention and suggested time slots) or a formatted Slack message
5. **Engagement Monitoring** — tracks 30/60/90-day milestones and attrition risk via ServiceNow
6. **HR Dashboard** — team-wide engagement overview with risk scoring

## Getting Started

```bash
git clone <repo-url>
cd haigent-project
npm install
cp .env.example .env.local   # fill in your API keys
npm run dev
# Open http://localhost:3000
```

## Environment Variables

```env
# Required for Engee AI agent
ANTHROPIC_API_KEY=

# Required for Onboarding & Benefits
SERVICENOW_INSTANCE_URL=
SERVICENOW_USERNAME=
SERVICENOW_PASSWORD=

# Required for Payroll
SALESFORCE_INSTANCE_URL=
SALESFORCE_ACCESS_TOKEN=

# Required for Engee coffee chat messaging
TEAMS_WEBHOOK_URL=
SLACK_WEBHOOK_URL=

# Optional — enables live Outlook calendar availability (workIQ)
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

> All modules degrade gracefully — mock data is shown when external services are not configured.
