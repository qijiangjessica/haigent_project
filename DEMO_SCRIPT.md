# Haigent Demo Script

**Estimated time:** 10–15 minutes
**URL:** http://localhost:3000

---

## Opening (1 min)

> "Today I'm going to walk you through **Haigent** — an AI-powered HR platform I built that connects three enterprise AI systems: Claude AI from Anthropic, Salesforce Agentforce, and ServiceNow.
>
> The idea behind Haigent is simple: HR teams spend a huge amount of time on repetitive workflows — onboarding new employees, managing benefits, answering payroll questions. Haigent replaces those manual processes with live AI agents that can look up real data, take actions, and have natural conversations with employees.
>
> Let me show you how it works."

---

## 1. Home Page — Platform Overview (1 min)

**[Navigate to http://localhost:3000]**

> "This is the Haigent dashboard. You can see it's organized into modules — each one is a separate HR function with its own AI agent.
>
> We have **Schedule** for interview management, **Sourcing** for candidate pipelines, **Onboarding**, **Benefits**, and **Payroll**. Today I'll focus on the three modules that are connected to live AI agents."

---

## 2. Agent 1 — Onboarding (4 min)

**[Click Onboarding in the sidebar]**

> "This is the Onboarding module, powered by **Claude AI** connected directly to **ServiceNow**.
>
> What you're seeing on this dashboard is **live data** — these are real employee onboarding records pulled in real-time from a custom ServiceNow application I built in ServiceNow Studio."

**[Point to the dashboard cards]**

> "Each card shows an employee's onboarding status, their start date, and a task checklist — things like equipment assigned, system access provisioned, documents completed. The status updates instantly when tasks are marked complete."

**[Scroll to the AI chat panel]**

> "Now here's where it gets interesting. This chat is powered by **Claude AI using a tool-use pattern** — also called an agentic loop.
>
> Instead of just answering questions from a static knowledge base, Claude has actual tools it can call against ServiceNow. Let me show you."

**[Type in chat:]** `What is the onboarding status for Sarah Chen?`

> "Watch what happens — Claude doesn't just make something up. It calls a tool, queries the ServiceNow table API, gets the real record back, and then summarizes it in natural language."

**[Wait for response, then type:]** `Mark her training as scheduled`

> "Now I'm asking it to take an action. Claude calls the update tool, writes back to ServiceNow, and confirms the change. If I refresh the dashboard, that task will now show as complete.
>
> This is what makes it a true AI agent — it can reason across multiple steps, call multiple tools in sequence, and take real actions on enterprise systems."

---

## 3. Agent 2 — Benefits (3 min)

**[Click Benefits in the sidebar]**

> "The Benefits module follows the same architecture — Claude AI connected to ServiceNow — but focused on benefits enrollment and management.
>
> The dashboard shows all the benefit plans available in the company, and the enrollment overview pulled from ServiceNow."

**[Point to benefit plan cards]**

> "These plans — health insurance, dental, vision, retirement — are all live records from the ServiceNow benefits tables I built in the custom scoped app."

**[Type in chat:]** `What benefits is John Smith currently enrolled in?`

> "Again, Claude queries ServiceNow in real time and gives a clear summary. An employee could use this to check their own coverage, or an HR manager could use it to look up anyone on the team."

**[Type in chat:]** `What are all the available health insurance options and their costs?`

> "It can also answer general policy questions — pulling the benefit type records and presenting them clearly. This replaces the need for HR staff to answer the same questions repeatedly."

---

## 4. Agent 3 — Payroll (3 min)

**[Click Payroll in the sidebar]**

> "The Payroll module takes a different approach. Instead of Claude AI, this one is powered by **Salesforce Agentforce** — Salesforce's native enterprise AI agent platform.
>
> This demonstrates that Haigent is designed to be multi-agent and multi-platform. Different HR functions can be backed by different AI systems depending on what makes the most sense for the business."

**[Point to the chat interface]**

> "Under the hood, when you start a conversation here, Haigent creates a live Agentforce session, sends your messages to the Salesforce Agent API, and streams the responses back. When the conversation ends, the session is properly closed.
>
> Authentication is handled server-side using OAuth 2.0, so there's no user login required."

**[Type in chat:]** `Can you help me understand how payroll deductions work?`

> "The Agentforce agent handles the response — this is coming directly from Salesforce's AI infrastructure, not Claude."

---

## 5. Architecture Wrap-up (1 min)

**[Switch to the architecture slide in the PPT, or just explain verbally]**

> "To summarize the architecture:
>
> - **Haigent** is a Next.js application running on the frontend
> - For **Onboarding and Benefits**, it calls Claude AI via the Anthropic SDK. Claude uses tool-use to call the ServiceNow Table REST API against a custom scoped app I built in ServiceNow Studio
> - For **Payroll**, it proxies requests to the Salesforce Agentforce Agent API using OAuth 2.0
>
> Everything is modular — adding a new HR module means adding a new page, a new API route, and connecting it to whatever backend system makes sense."

---

## Closing (30 sec)

> "What I've built here shows that modern HR automation doesn't have to be rigid, rule-based workflows. With AI agents that can reason, query live data, and take actions — you get something much more powerful and flexible.
>
> Haigent is designed to grow. The Reference Check and Employee Engagement modules are next. And because the architecture is modular, each one can bring in a different AI provider or enterprise system.
>
> Happy to answer any questions."

---

## Likely Q&A

**Q: Is the data real?**
> Yes — the ServiceNow data is live. The employee onboarding records, benefit plans, and enrollment data all come from a real ServiceNow instance via the Table REST API.

**Q: Could this work with a company's existing ServiceNow?**
> Yes. The integration uses the standard ServiceNow Table API which is available on any ServiceNow instance. You'd just point it at a different instance URL and configure the table names.

**Q: Why Claude AI instead of ChatGPT?**
> Claude's tool-use API is particularly well-suited for agentic workflows — the pattern of calling multiple tools in a loop until the task is done. It's also available via a simple REST API that integrates cleanly into Next.js server-side routes.

**Q: What about security? You're passing credentials around.**
> All API calls happen server-side in Next.js API routes — credentials never touch the browser. The ServiceNow password is stored in `.env.local` and never exposed to the client.

**Q: Could this be deployed to production?**
> The architecture is production-ready. You'd swap `.env.local` for proper secrets management (e.g. AWS Secrets Manager or Vercel environment variables) and deploy the Next.js app to Vercel or a cloud provider.
