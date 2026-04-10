# Application Architecture

## Next.js App Router Structure

```
app/
├── layout.tsx                    # Root layout (fonts, body, providers)
├── page.tsx                      # Redirects to /schedule
│
├── (dashboard)/                  # Dashboard route group (sidebar layout)
│   ├── layout.tsx                # Sidebar + header + main content area
│   │
│   ├── schedule/                 # Schedule AI Agent module
│   │   ├── page.tsx
│   │   ├── jobs/page.tsx
│   │   ├── jobs/[id]/page.tsx
│   │   ├── candidates/page.tsx
│   │   ├── interviews/page.tsx
│   │   ├── interviewers/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── sourcing/                 # Sourcing AI Agent module
│   │   ├── page.tsx
│   │   ├── roles/page.tsx
│   │   ├── roles/[id]/page.tsx
│   │   ├── candidates/page.tsx
│   │   ├── outreach/page.tsx
│   │   └── meetings/page.tsx
│   │
│   ├── reference/page.tsx        # Coming Soon
│   ├── onboarding/page.tsx       # Built — AI Assistant + dashboard (onboarding-store)
│   ├── benefits/page.tsx         # Built — AI Assistant + dashboard (benefits-store)
│   ├── payroll/page.tsx          # Built — Salesforce Agentforce AI Assistant
│   └── engee/page.tsx            # Built — Employee Engagement Agent (LangGraph)
│
└── api/                          # Backend API routes
    ├── engee/
    │   ├── chat/route.ts         # Main Engee agent (Claude + 9 tools)
    │   ├── survey/route.ts       # GET/POST survey CRUD
    │   └── mentor-suggest/route.ts  # Mentor matching endpoint
    ├── benefits/
    │   ├── chat/route.ts         # Benefits AI chat (Claude + benefits-store)
    │   └── records/route.ts      # Benefits catalog + inquiries from benefits-store
    ├── onboarding/
    │   ├── chat/route.ts         # Onboarding AI chat (Claude + onboarding-store)
    │   └── records/route.ts      # Onboarding records from onboarding-store
    ├── agent/route.ts            # Payroll — Salesforce Agentforce sessions
    └── servicenow/               # ServiceNow proxy (available but not used by agents)
```

## Engee Agent Architecture

Engee is built on **LangGraph** (`@langchain/langgraph`) — a `StateGraph` with two nodes (`agent` and `tools`) replaces any custom agentic loop:

```
__start__
    ↓
[ agent node ] ←─────────────────────┐
  ChatAnthropic.invoke(messages)      │
    ↓                                 │
shouldContinue()                      │
  ├── tool_calls present? → [ tools node ]
  │     ToolNode executes             │
  │     DynamicStructuredTool(s) ─────┘
  └── no tool_calls? → END
```

### Engee Tools (9 total)

| Tool | Purpose |
|---|---|
| `get_employee_engagement` | Read survey + attrition flag from `engee-store` |
| `get_team_engagement_summary` | All surveyed employees from `engee-store` |
| `submit_interest_survey` | Save survey to `engee-store` |
| `find_mentor_match` | Match employee to mentor by department + interests |
| `find_mentor_by_name` | Look up mentor contact details from roster |
| `find_available_meeting_slots` | **workIQ** — Microsoft Graph `findMeetingTimes`, returns 3 open 30-min slots |
| `schedule_coffee_chat` | Send Teams Adaptive Card or Slack webhook message with suggested slots |
| `add_engagement_note` | Append check-in note to `engee-store` |
| `flag_attrition_risk` | Mark employee at-risk in `engee-store` |

### workIQ Calendar Flow

```
find_available_meeting_slots
  ├── MICROSOFT_TENANT_ID set?
  │     ├── Yes → getGraphToken() → POST /users/{email}/findMeetingTimes
  │     └── No  → getMockSlots() (realistic fallback)
  └── Returns: { slots: MeetingSlot[], source: "graph" | "mock" }
```

### Coffee Chat Scheduling Flow

```
1. Employee asks to schedule a coffee chat
2. Engee asks for employee's work email
3. find_available_meeting_slots → 3 suggested time slots
4. Employee picks a slot
5. schedule_coffee_chat →
     Teams: Adaptive Card with FactSet (name, mentor, professional interests,
            personal interests, preferred time, 3 suggested slots, open calendar action)
     Slack: Formatted text with bullet-list slots
```

## Layout Hierarchy

```
RootLayout
└── (dashboard) layout → sidebar + header + main content
    ├── Sidebar (fixed left, module navigation)
    ├── Header (sticky top)
    └── <main> content area
        └── Module pages
```

## Sidebar Navigation System

Driven by `src/lib/modules.ts` (`AI_MODULES` array). Each module has:

```typescript
{
  name: string;
  slug: string;
  icon: LucideIcon;
  accentColor: string;   // used for active highlight: bg-${accentColor}
  enabled: boolean;      // false = locked with lock icon
  description: string;
  subPages: SubPage[];
}
```

Current accent colors by module:
- Schedule → `brand-pink`
- Sourcing → `brand-gold`
- Reference → `brand-teal` (locked)
- Onboarding → `brand-lime`
- Benefits → `brand-yellow`
- Payroll → `brand-cyan`
- Engee → `brand-lime`

## Key Libraries

| File | Purpose |
|---|---|
| `src/lib/engee-store.ts` | In-memory survey store, mentor roster (10 Procogia staff), matching algorithm |
| `src/lib/benefits-store.ts` | In-memory benefits catalog (12 plans) + inquiry store |
| `src/lib/onboarding-store.ts` | In-memory onboarding records (4 employees) + IT incident store |
| `src/lib/calendar.ts` | Microsoft Graph API auth + `findMeetingTimes` + mock slot fallback |
| `src/lib/servicenow.ts` | ServiceNow REST API helpers — **not used by agents**; replaced by local stores (see below) |
| `src/lib/salesforce.ts` | Salesforce Agentforce session management |
| `src/lib/modules.ts` | Sidebar navigation config |
| `src/lib/utils.ts` | `cn()` helper (clsx + twMerge) |

## Key Design Decisions

1. **LangGraph StateGraph (Engee)** — `ChatAnthropic` + `ToolNode` in a `StateGraph`; replaces the old custom while-loop; `shouldContinue()` edge routes to END when no tool calls remain
2. **No database** — all three agents (Engee, Benefits, Onboarding) use in-memory `Map` stores; structured to swap to Supabase/SQLite without breaking callers
3. **Graceful degradation** — every external integration has a fallback (mock data, error message) so the app always works in demo mode
4. **Module config** — centralised `AI_MODULES` makes sidebar navigation and accent colors mechanical to change
5. **Calendar mock** — `src/lib/calendar.ts` generates realistic business-day slots when Azure credentials are absent

## ServiceNow — Why It's Not Used

`src/lib/servicenow.ts` contains a full ServiceNow Table REST API client (`queryTable`, `getRecord`, `updateRecord`, `createRecord`) targeting custom tables:
- `x_1926120_employee_onboarding`
- `x_1926120_employee_benefits_catalog`
- `x_1926120_employee_benefits_inquiry`

The file also includes a mock fallback that activates when `SERVICENOW_INSTANCE_URL` / `SERVICENOW_USERNAME` / `SERVICENOW_PASSWORD` env vars are absent.

**The onboarding and benefits agents no longer call `servicenow.ts` at all.** This was intentionally removed after the ServiceNow instance going offline caused agent failures in production. The agent chat routes now import directly from `onboarding-store.ts` and `benefits-store.ts`, which are always available regardless of ServiceNow's status.

`servicenow.ts` is kept in the codebase for reference. To restore the live integration, the chat routes would need to replace their store imports with calls to `queryTable` / `updateRecord` / `createRecord`.
