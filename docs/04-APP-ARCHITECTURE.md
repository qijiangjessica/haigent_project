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
│   ├── onboarding/page.tsx       # Built — ServiceNow AI Assistant
│   ├── benefits/page.tsx         # Built — ServiceNow AI Assistant + dashboard
│   ├── payroll/page.tsx          # Built — Salesforce Agentforce AI Assistant
│   └── engee/page.tsx            # Built — Employee Engagement Agent
│
└── api/                          # Backend API routes
    ├── engee/
    │   ├── chat/route.ts         # Main Engee agent (Claude + 9 tools)
    │   ├── survey/route.ts       # GET/POST survey CRUD
    │   └── mentor-suggest/route.ts  # Mentor matching endpoint
    ├── benefits/
    │   ├── chat/route.ts         # Benefits AI chat (Claude + ServiceNow)
    │   └── records/route.ts      # ServiceNow benefits data
    ├── onboarding/
    │   └── chat/route.ts         # Onboarding AI chat (Claude + ServiceNow)
    ├── agent/route.ts            # Payroll — Salesforce Agentforce sessions
    └── servicenow/               # ServiceNow proxy routes
```

## Engee Agent Architecture

Engee is built on an **agentic loop** pattern using the Anthropic Claude API:

```
User Message
     ↓
Claude (claude-sonnet-4-6) with 9 tools
     ↓
stop_reason === "tool_use"?
  ├── Yes → executeTool() → append result → loop (max 10 iterations)
  └── No  → return text response
```

### Engee Tools (9 total)

| Tool | Purpose |
|---|---|
| `get_employee_engagement` | ServiceNow lookup + attrition risk scoring |
| `get_team_engagement_summary` | Team-wide engagement overview |
| `submit_interest_survey` | Save survey to in-memory store |
| `find_mentor_match` | Match employee to mentor by department + interests |
| `find_mentor_by_name` | Look up mentor contact details from roster |
| `find_available_meeting_slots` | **workIQ** — Microsoft Graph `findMeetingTimes`, returns 3 open 30-min slots |
| `schedule_coffee_chat` | Send Teams Adaptive Card or Slack message with @mention + suggested slots |
| `add_engagement_note` | Write check-in note to ServiceNow |
| `flag_attrition_risk` | Mark employee at-risk in ServiceNow |

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
| `src/lib/engee-store.ts` | In-memory survey store, mentor roster (10 mentors), matching algorithm |
| `src/lib/calendar.ts` | Microsoft Graph API auth + `findMeetingTimes` + mock slot fallback |
| `src/lib/servicenow.ts` | ServiceNow REST API helpers (`queryTable`, `updateRecord`) |
| `src/lib/salesforce.ts` | Salesforce Agentforce session management |
| `src/lib/modules.ts` | Sidebar navigation config |
| `src/lib/utils.ts` | `cn()` helper (clsx + twMerge) |

## Key Design Decisions

1. **Agentic loop** — Claude decides which tools to call; the backend executes and feeds results back
2. **No database for surveys** — in-memory `Map` in `engee-store.ts`; structured to swap to Supabase/SQLite without breaking callers
3. **Graceful degradation** — every external integration has a fallback (mock data, error message) so the app always works in demo mode
4. **Module config** — centralised `AI_MODULES` makes sidebar navigation and accent colors mechanical to change
5. **Calendar mock** — `src/lib/calendar.ts` generates realistic business-day slots when Azure credentials are absent
