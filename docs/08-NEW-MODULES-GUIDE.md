# Guide: Adding a New AI Agent Module

This guide walks through adding a new AI Agent module to the platform. Follow the same pattern used by Engee, Benefits, and Payroll.

---

## Step 1: Register the Module

Edit `src/lib/modules.ts` and add your module to the `AI_MODULES` array:

```typescript
{
  name: "Reference",
  slug: "reference",
  icon: ClipboardCheck,
  accentColor: "brand-teal",   // pick an unused brand color
  enabled: true,               // change from false → true
  description: "Automated reference check workflows",
  subPages: [],
}
```

This single change activates the module in the sidebar with the correct accent color and active highlight.

**Available brand colors:**

| Token | Hex | Currently Used By |
|---|---|---|
| `brand-pink` | `#E91E8C` | Schedule |
| `brand-gold` | `#F5A623` | Sourcing |
| `brand-teal` | `#00BFA5` | Reference (reserved) |
| `brand-lime` | `#9ABF45` | Onboarding, Engee |
| `brand-yellow` | `#F3CF63` | Benefits |
| `brand-cyan` | `#19A9B6` | Payroll |
| `brand-coral` | `#E35B6D` | Error states |

---

## Step 2: Create the Page

```
src/app/(dashboard)/reference/
└── page.tsx
```

Every module page uses `HeroBanner` for the header:

```tsx
import { HeroBanner } from "@/components/shared/hero-banner";

export default function ReferencePage() {
  return (
    <div className="space-y-6">
      <HeroBanner
        title="Reference"
        subtitle="Automated reference check workflows"
        bgColor="bg-gradient-to-r from-brand-teal to-brand-teal/80"
        badgeColor="bg-brand-charcoal/80"
        badgeText="AI-Powered"
      />
      {/* content */}
    </div>
  );
}
```

---

## Step 3: Build the AI Agent (if applicable)

If the module needs an AI agent, follow the Engee pattern:

### API Route (`src/app/api/<module>/chat/route.ts`)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 1. Define tools
const tools: Anthropic.Tool[] = [ /* ... */ ];

// 2. Define tool executor
async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  // handle each tool name
}

// 3. System prompt
const SYSTEM_PROMPT = `You are [AgentName], an AI agent for [purpose]...`;

// 4. Agentic loop
export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  let currentMessages = [...messages];

  for (let i = 0; i < 10; i++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools,
      messages: currentMessages,
    });

    if (response.stop_reason === "end_turn") {
      return NextResponse.json({ response: extractText(response), messages: [...currentMessages, { role: "assistant", content: response.content }] });
    }

    if (response.stop_reason === "tool_use") {
      // execute tools, append results, continue loop
    }
  }
}
```

### Chat UI Component (`src/components/<module>/agent-chat.tsx`)

Copy and adapt `src/components/engee/agent-chat.tsx`. Key props to change:
- Brand color: replace `brand-lime` with your module's accent color
- API endpoint: replace `/api/engee/chat` with `/api/<module>/chat`
- Suggestion prompts and placeholder text

---

## Step 4: Add External Integration (if applicable)

### ServiceNow

```typescript
import { queryTable, updateRecord } from "@/lib/servicenow";

const records = await queryTable("your_table_name", {
  sysparm_display_value: true,
  sysparm_limit: 50,
});
```

Requires `.env.local`:
```
SERVICENOW_INSTANCE_URL=
SERVICENOW_USERNAME=
SERVICENOW_PASSWORD=
```

### Microsoft Graph API (Calendar)

Use the existing `src/lib/calendar.ts`:
```typescript
import { findAvailableMeetingSlots, formatSlotsForDisplay } from "@/lib/calendar";

const { slots, source } = await findAvailableMeetingSlots({
  employeeEmail: "user@company.com",
  mentorEmail: "mentor@company.com",
  timePreference: "flexible",
});
```

Requires `.env.local` (falls back to mock slots if absent):
```
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

### Teams / Slack

```typescript
// Teams — POST JSON to TEAMS_WEBHOOK_URL
// Slack — POST payload to SLACK_WEBHOOK_URL
```

---

## Checklist

- [ ] Module registered in `src/lib/modules.ts` with `enabled: true` and correct `accentColor`
- [ ] Page created at `src/app/(dashboard)/<slug>/page.tsx` using `HeroBanner`
- [ ] API route created at `src/app/api/<module>/chat/route.ts` (if AI agent needed)
- [ ] Chat UI component in `src/components/<module>/agent-chat.tsx` using module's accent color
- [ ] All external integrations degrade gracefully when env vars are absent
- [ ] Sidebar highlights correctly when module is active
