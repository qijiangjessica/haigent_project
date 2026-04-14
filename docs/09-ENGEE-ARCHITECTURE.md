# Engee Agent — Architecture Design

## Overview

Engee is a new hire engagement agent built on **LangGraph** (`@langchain/langgraph`). A `StateGraph` with two nodes — `agent` and `tools` — replaces the custom agentic loop. `ChatAnthropic` (LangChain) drives the LLM; 9 `DynamicStructuredTool` instances (Zod v3 schemas + executors) handle all side effects.

---

## System Architecture Diagram

```mermaid
flowchart TD
    %% ─── Frontend ───────────────────────────────────────────
    subgraph FE["Frontend (Next.js Client)"]
        SurveyForm["SurveyForm\n(survey-form.tsx)\nMulti-step wizard · 7 pages"]
        ChatUI["EngeeChat\n(agent-chat.tsx)\nConversation UI\nMessageParam[ ] history"]
    end

    EngeePage["EngeePage\n(engee/page.tsx)\nTab controller: Survey ↔ Chat\nPasses seedMessage on complete"]

    SurveyForm -->|onComplete\nemployeeName, dept, mentors| EngeePage
    EngeePage -->|seedMessage| ChatUI
    EngeePage --- SurveyForm
    EngeePage --- ChatUI

    %% ─── API Routes ─────────────────────────────────────────
    subgraph API["API Layer (Next.js Route Handlers)"]
        ChatRoute["/api/engee/chat\ntoLC() → graph.invoke() → toAnthropic()"]
        SurveyRoute["/api/engee/survey\nGET / POST survey CRUD"]
        MentorRoute["/api/engee/mentor-suggest\nScored ranking → top 3"]
    end

    SurveyForm -->|"POST survey data"| SurveyRoute
    SurveyForm -->|"POST dept + interests"| MentorRoute
    ChatUI -->|"POST MessageParam[ ]"| ChatRoute

    %% ─── Message Converters ──────────────────────────────────
    subgraph Conv["Message Converters (chat/route.ts)"]
        ToLC["toLC()\nAnthropic MessageParam[ ]\n→ LangChain BaseMessage[ ]"]
        ToAnth["toAnthropic()\nLangChain BaseMessage[ ]\n→ Anthropic MessageParam[ ]"]
    end

    ChatRoute --> ToLC
    ToAnth --> ChatRoute

    %% ─── LangGraph StateGraph ────────────────────────────────
    subgraph LG["LangGraph StateGraph (MessagesAnnotation)"]
        AgentNode["agent node\nChatAnthropic.invoke()\nclaude-sonnet-4-6"]
        ShouldContinue{"shouldContinue()\nlast msg has\ntool_calls?"}
        ToolsNode["tools node\nToolNode\nexecutes DynamicStructuredTool"]

        AgentNode --> ShouldContinue
        ShouldContinue -->|"Yes → tools"| ToolsNode
        ToolsNode -->|loop| AgentNode
        ShouldContinue -->|"No → END"| END_NODE["END\nreturn response"]
    end

    ToLC --> LG
    LG --> ToAnth

    %% ─── 9 DynamicStructuredTools ────────────────────────────
    subgraph Tools["9 DynamicStructuredTools  (Zod v3 schema + executor)"]
        T1["get_employee_engagement\nRead survey + flag status"]
        T2["get_team_engagement_summary\nAll surveyed employees"]
        T3["submit_interest_survey\nSave to engee-store"]
        T4["find_mentor_match\nDept + interest scoring"]
        T5["find_mentor_by_name\nLookup contact details"]
        T6["find_available_meeting_slots\nMS Graph findMeetingTimes\nor mock fallback"]
        T7["schedule_coffee_chat\nTeams Adaptive Card\nor Slack message"]
        T8["add_engagement_note\nAppend note → store"]
        T9["flag_attrition_risk\nSet flag → store"]
    end

    ToolsNode --> Tools

    %% ─── Data Layer ─────────────────────────────────────────
    subgraph Store["engee-store.ts (In-Memory)"]
        SurveyMap["surveys Map\nSurveyRecord: notes[ ] · attrition_flagged"]
        MentorArray["MENTORS[ ]  10 Procogia mentors\nname · email · teams_id · slack_id"]
    end

    subgraph External["External Services"]
        Anthropic["Anthropic API\nclaude-sonnet-4-6"]
        Graph["Microsoft 365\nGraph API · findMeetingTimes"]
        MockCal["Mock Calendar\nbusiness-day fallback"]
        Teams["Teams Webhook\nAdaptive Card → channel"]
        Slack["Slack Bot API\nchat.postMessage"]
        AzureAD["Azure Active Directory\nService Principal"]
    end

    T1 --> SurveyMap
    T2 --> SurveyMap
    T3 --> SurveyMap
    T4 --> MentorArray
    T5 --> MentorArray
    T6 --> Graph
    T6 -->|no creds| MockCal
    T7 --> Teams
    T7 --> Slack
    T8 --> SurveyMap
    T9 --> SurveyMap
    MentorRoute --> MentorArray
    SurveyRoute --> SurveyMap
    AgentNode --> Anthropic
    Graph --> AzureAD
```

---

## LangGraph State Machine

```
__start__
    ↓
[ agent node ]  ←─────────────────────┐
  ChatAnthropic.invoke(messages)       │
    ↓                                  │
shouldContinue()                       │
  ├── tool_calls present? → [ tools node ]
  │     ToolNode.invoke() → executes   │
  │     DynamicStructuredTool(s)       │
  │     appends ToolMessage(s) ────────┘
  └── no tool_calls? → END
```

- **State:** `MessagesAnnotation` — accumulates `BaseMessage[]` across all turns
- **No iteration cap** — LangGraph manages the loop; ends when Claude stops calling tools
- **Parallel tool calls** — `ToolNode` executes multiple tool calls concurrently in a single turn

---

## Message Format Bridge

The frontend sends/receives Anthropic wire-format (`MessageParam[]`). LangGraph works with LangChain `BaseMessage[]`. The converters in `chat/route.ts` bridge the two:

| Anthropic (frontend) | LangChain (LangGraph) |
|---|---|
| `{role:"user", content:"text"}` | `HumanMessage("text")` |
| `{role:"assistant", content:"text"}` | `AIMessage("text")` |
| `{role:"assistant", content:[..., {type:"tool_use"}]}` | `AIMessage({ content, tool_calls:[...] })` |
| `{role:"user", content:[{type:"tool_result"},...]}` | `ToolMessage` per result |

Consecutive `ToolMessage`s are grouped back into a single Anthropic user turn on the way out.

---

## Data Flow: New Hire Journey

```
1. New hire opens Engee → Survey tab
2. Completes 7-step survey
3. On submit:
     a. POST /api/engee/survey        → saveSurvey() → engee-store
     b. POST /api/engee/mentor-suggest → findTopMentors() → top 3
4. New hire selects a mentor
5. EngeePage generates seedMessage → switches to Chat tab
6. EngeeChat auto-sends seed message → POST /api/engee/chat
7. chat/route.ts:
     a. toLC()          → convert to LangChain messages + SystemMessage
     b. graph.invoke()  → LangGraph runs agent/tools loop
        • find_mentor_by_name         → mentor contact details
        • find_available_meeting_slots → 3 calendar slots
        • schedule_coffee_chat         → Teams or Slack notification
     c. toAnthropic()   → convert back for frontend storage
8. New hire and mentor notified
```

---

## Mentor Matching Algorithm

`findTopMentors()` in `engee-store.ts`:

| Signal | Points |
|--------|--------|
| Same department | +20 |
| Related department | +8 |
| Professional interest keyword in bio | +4 per match |
| Learning interest keyword in bio | +2 per match |
| Personal interest keyword in bio | +2 per match |

---

## Integration Map

| Service | How Connected | Env Var |
|---------|--------------|---------|
| Anthropic Claude | `ChatAnthropic` (`@langchain/anthropic`) | `ANTHROPIC_API_KEY` |
| engee-store.ts | In-memory `Map` — surveys, notes, flags, mentor roster | — |
| Microsoft 365 | Graph API `findMeetingTimes` | `MICROSOFT_TENANT_ID / CLIENT_ID / CLIENT_SECRET` |
| Microsoft Teams | Incoming Webhook · Adaptive Cards | `TEAMS_WEBHOOK_URL` |
| Slack | Incoming Webhook · formatted text message | `SLACK_WEBHOOK_URL` |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LangGraph `StateGraph` | Replaces custom while loop — graph structure is explicit, extensible to multi-agent supervisor pattern later |
| `DynamicStructuredTool` + Zod v3 | Schema + executor co-located; Zod v3 required for LangChain Core 0.3.x type inference |
| Message format converters | Frontend stays on Anthropic wire format — zero frontend changes; bridge lives only in the route |
| `MessagesAnnotation` state | LangGraph manages full message history including tool calls/results across all loop iterations |
| In-memory store (no external DB) | Self-contained for demo; `Map` is a drop-in swap for Supabase/SQLite without changing callers |
| Teams = webhook · Slack = bot token | Teams webhook is channel-only; Slack bot token enables DMs — both preserved for different org setups |
