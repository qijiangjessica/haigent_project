"""
Generates docs/Engee_Architecture.drawio  (LangGraph version)
Open with: VS Code Draw.io extension, or drag into https://app.diagrams.net
"""

_id = 10

def nid():
    global _id
    _id += 1
    return str(_id)

def vertex(value, x, y, w, h, style, parent="1", label_size=10):
    cid = nid()
    return cid, (
        f'<mxCell id="{cid}" value="{value}" style="{style}fontSize={label_size};" '
        f'vertex="1" parent="{parent}">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
        f'</mxCell>'
    )

def group(value, x, y, w, h, style, parent="1", label_size=10):
    cid = nid()
    return cid, (
        f'<mxCell id="{cid}" value="{value}" style="{style}fontSize={label_size};" '
        f'vertex="1" parent="{parent}">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
        f'</mxCell>'
    )

def diamond(value, x, y, w, h, style, parent="1", label_size=9):
    cid = nid()
    return cid, (
        f'<mxCell id="{cid}" value="{value}" '
        f'style="rhombus;{style}fontSize={label_size};" '
        f'vertex="1" parent="{parent}">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
        f'</mxCell>'
    )

def arrow(src, tgt, label="", dashed=False, parent="1", color="#555555"):
    cid = nid()
    dash = "dashed=1;" if dashed else ""
    return (
        f'<mxCell id="{cid}" value="{label}" '
        f'style="edgeStyle=orthogonalEdgeStyle;{dash}html=1;fontSize=9;'
        f'fontColor={color};strokeColor={color};" '
        f'edge="1" source="{src}" target="{tgt}" parent="{parent}">'
        f'<mxGeometry relative="1" as="geometry"/>'
        f'</mxCell>'
    )

S_USER    = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontColor=#333333;"
S_BLUE    = "rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontColor=#333333;"
S_GREEN   = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#333333;"
S_ORANGE  = "rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d6b656;fontColor=#333333;"
S_PINK    = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontColor=#333333;"
S_YELLOW  = "rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#333333;"
S_PURPLE  = "rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontColor=#333333;"
S_DARK    = "rounded=1;whiteSpace=wrap;html=1;fillColor=#2c2c2c;strokeColor=#2c2c2c;fontColor=#ffffff;"
S_LIME    = "rounded=1;whiteSpace=wrap;html=1;fillColor=#c8e600;strokeColor=#82b300;fontColor=#2c2c2c;"
S_TEAL    = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8f4;strokeColor=#3a7ab8;fontColor=#1a3a5c;"
S_GROUP   = "rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#aaaaaa;fontStyle=1;verticalAlign=top;"
S_SECTION = "rounded=1;whiteSpace=wrap;html=1;fillColor=#f9f9f9;strokeColor=#cccccc;fontStyle=1;verticalAlign=top;"

cells = []
ids = {}

def add(name, *items):
    for item in items:
        if isinstance(item, tuple):
            cid, xml = item
            ids[name] = cid
            cells.append(xml)
        else:
            cells.append(item)

def add_anon(*items):
    for item in items:
        if isinstance(item, tuple):
            _, xml = item
            cells.append(xml)
        else:
            cells.append(item)


# ══════════════════════════════════════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════════════════════════════════════
add("users_box", group("Users", 20, 20, 420, 120, S_GROUP, label_size=11))
add("new_hire",  vertex("New Hire\n(Employee)", 40, 55, 160, 70, S_USER))
add("hr_user",   vertex("HR Personnel", 230, 55, 160, 70, S_USER))
add_anon(vertex("Access Survey", 40, 128, 110, 22, "text;html=1;fontSize=9;fontColor=#888888;align=center;"))
add_anon(vertex("Access Chat + Dashboard", 210, 128, 155, 22, "text;html=1;fontSize=9;fontColor=#888888;align=center;"))

# ══════════════════════════════════════════════════════════════════════════════
# BACKEND CONTAINER
# ══════════════════════════════════════════════════════════════════════════════
add("backend", group("Backend Core System", 0, 160, 1700, 870, S_SECTION, label_size=13))

# ── Frontend ──────────────────────────────────────────────────────────────────
add("fe_group",    group("Frontend Applications  (Next.js Client)", 20, 200, 920, 130, S_GROUP))
add("survey_form", vertex("SurveyForm\n(survey-form.tsx)\n7-step wizard", 40, 230, 200, 80, S_BLUE))
add("engee_chat",  vertex("EngeeChat\n(agent-chat.tsx)\nMessageParam[ ] history", 270, 230, 210, 80, S_BLUE))
add("engee_page",  vertex("EngeePage\n(engee/page.tsx)\nTab controller\nsurvey ↔ chat", 510, 230, 200, 80, S_LIME))

# ── API Routes ────────────────────────────────────────────────────────────────
add("api_group",  group("API Layer  (Next.js Route Handlers)", 20, 360, 920, 120, S_GROUP))
add("survey_api", vertex("/api/engee/survey\nGET / POST survey CRUD", 40, 390, 240, 70, S_BLUE))
add("chat_api",   vertex("/api/engee/chat\ntoLC → graph.invoke → toAnthropic", 310, 390, 280, 70, S_DARK))
add("mentor_api", vertex("/api/engee/mentor-suggest\nScored ranking → top 3", 620, 390, 260, 70, S_BLUE))

# ── Message Converters ────────────────────────────────────────────────────────
add("conv_group", group("Message Converters", 20, 510, 580, 110, S_GROUP))
add("to_lc",   vertex("toLC()\nAnthropic MessageParam[ ]\n→ LangChain BaseMessage[ ]", 40, 540, 260, 60, S_TEAL))
add("to_anth", vertex("toAnthropic()\nLangChain BaseMessage[ ]\n→ Anthropic MessageParam[ ]", 330, 540, 250, 60, S_TEAL))

# ── LangGraph StateGraph ──────────────────────────────────────────────────────
add("lg_group", group("LangGraph  StateGraph + MessagesAnnotation  (@langchain/langgraph)", 20, 650, 920, 200, S_GROUP))

add("agent_node",  vertex("agent node\nChatAnthropic.invoke()\nclaude-sonnet-4-6", 60, 690, 230, 120, S_PINK))
add("should_cont", diamond("shouldContinue()\ntool_calls\npresent?",             330, 690, 160, 120,
                           "whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#333333;"))
add("tools_node",  vertex("tools node\nToolNode\nparallel tool execution", 540, 690, 210, 120, S_ORANGE))
add("end_node",    vertex("END\nreturn response\nto client", 790, 690, 120, 120, S_GREEN))

# ── 9 Tools ───────────────────────────────────────────────────────────────────
add("tools_group", group("9 DynamicStructuredTools  (Zod v3 schema + executor)", 20, 880, 1640, 120, S_GROUP))

tool_defs = [
    ("get_employee_\nengagement",        S_BLUE,   30,  905),
    ("get_team_\nengagement_summary",    S_BLUE,   210, 905),
    ("submit_interest_\nsurvey",         S_BLUE,   390, 905),
    ("find_mentor_\nmatch",              S_GREEN,  570, 905),
    ("find_mentor_\nby_name",            S_GREEN,  750, 905),
    ("find_available_\nmeeting_slots",   S_ORANGE, 930, 905),
    ("schedule_\ncoffee_chat",           S_ORANGE, 1110,905),
    ("add_engagement_\nnote",            S_YELLOW, 1290,905),
    ("flag_attrition_\nrisk",            S_YELLOW, 1470,905),
]
for tname, tstyle, tx, ty in tool_defs:
    add(tname.replace("\n", "_"), vertex(tname, tx, ty, 160, 85, tstyle, label_size=9))

# ── engee-store ───────────────────────────────────────────────────────────────
add("store_group",  group("engee-store.ts  (In-Memory — no external DB)", 980, 650, 700, 200, S_GROUP))
add("survey_store", vertex("surveys Map\nSurveyRecord\nnotes[ ] · attrition_flagged", 1000, 690, 280, 130, S_YELLOW))
add("mentor_store", vertex("MENTORS[ ]  10 Procogia mentors\nname · email\nteams_id · slack_id", 1310, 690, 340, 130, S_YELLOW))

# ══════════════════════════════════════════════════════════════════════════════
# EXTERNAL SERVICES
# ══════════════════════════════════════════════════════════════════════════════
add("ext_group", group("External Services", 0, 1060, 1700, 140, S_SECTION, label_size=13))
add("anthropic", vertex("Anthropic Claude API\nclaude-sonnet-4-6\n(@langchain/anthropic)", 30, 1090, 260, 80, S_PINK))
add("msgraph",   vertex("Microsoft Graph API\nfindMeetingTimes\n(Calendar availability)", 330, 1090, 260, 80, S_GREEN))
add("teams",     vertex("Microsoft Teams\nIncoming Webhook\nAdaptive Cards → channel", 630, 1090, 240, 80, S_BLUE))
add("slack",     vertex("Slack Bot API\nchat.postMessage\nDM or channel", 910, 1090, 210, 80, S_PURPLE))
add("azure_ad",  vertex("Azure Active Directory\nService Principal Auth", 1160, 1090, 240, 80, S_USER))
add("future_db", vertex("PostgreSQL / Supabase\n(future swap — no code change)", 1440, 1090, 240, 80, S_USER))

# ══════════════════════════════════════════════════════════════════════════════
# ARROWS
# ══════════════════════════════════════════════════════════════════════════════
# Users → Frontend
cells.append(arrow(ids["new_hire"],   ids["survey_form"], "Access Survey"))
cells.append(arrow(ids["hr_user"],    ids["engee_chat"],  "Access Chat"))

# Frontend flow
cells.append(arrow(ids["survey_form"], ids["survey_api"],  "POST survey data"))
cells.append(arrow(ids["survey_form"], ids["mentor_api"],  "POST dept + interests"))
cells.append(arrow(ids["survey_form"], ids["engee_page"],  "onComplete"))
cells.append(arrow(ids["engee_page"],  ids["engee_chat"],  "seedMessage"))
cells.append(arrow(ids["engee_chat"],  ids["chat_api"],    "POST MessageParam[ ]"))

# API → converters → LangGraph
cells.append(arrow(ids["chat_api"],   ids["to_lc"],       ""))
cells.append(arrow(ids["to_lc"],      ids["agent_node"],  "BaseMessage[ ]"))
cells.append(arrow(ids["end_node"],   ids["to_anth"],     "BaseMessage[ ]"))
cells.append(arrow(ids["to_anth"],    ids["chat_api"],    "MessageParam[ ]"))

# LangGraph internal
cells.append(arrow(ids["agent_node"],  ids["should_cont"], ""))
cells.append(arrow(ids["should_cont"], ids["tools_node"],  "Yes"))
cells.append(arrow(ids["tools_node"],  ids["agent_node"],  "loop", dashed=True))
cells.append(arrow(ids["should_cont"], ids["end_node"],    "No"))

# ToolNode → tools
cells.append(arrow(ids["tools_node"],  ids["get_employee__engagement"],     "", dashed=True))
cells.append(arrow(ids["tools_node"],  ids["find_mentor__match"],           "", dashed=True))
cells.append(arrow(ids["tools_node"],  ids["schedule__coffee_chat"],        "", dashed=True))
cells.append(arrow(ids["tools_node"],  ids["find_available__meeting_slots"],"", dashed=True))

# Tools → store
cells.append(arrow(ids["get_employee__engagement"],     ids["survey_store"], "", dashed=True))
cells.append(arrow(ids["get_team__engagement_summary"], ids["survey_store"], "", dashed=True))
cells.append(arrow(ids["submit_interest__survey"],      ids["survey_store"], "", dashed=True))
cells.append(arrow(ids["find_mentor__match"],           ids["mentor_store"], "", dashed=True))
cells.append(arrow(ids["find_mentor__by_name"],         ids["mentor_store"], "", dashed=True))
cells.append(arrow(ids["add_engagement__note"],         ids["survey_store"], "", dashed=True))
cells.append(arrow(ids["flag_attrition__risk"],         ids["survey_store"], "", dashed=True))

# Tools → external
cells.append(arrow(ids["find_available__meeting_slots"], ids["msgraph"],   "findMeetingTimes", dashed=True))
cells.append(arrow(ids["schedule__coffee_chat"],         ids["teams"],     "Adaptive Card",    dashed=True))
cells.append(arrow(ids["schedule__coffee_chat"],         ids["slack"],     "postMessage",      dashed=True))

# API → store (survey + mentor)
cells.append(arrow(ids["survey_api"],  ids["survey_store"], "saveSurvey()"))
cells.append(arrow(ids["mentor_api"],  ids["mentor_store"], "findTopMentors()"))

# Agent → Anthropic
cells.append(arrow(ids["agent_node"],  ids["anthropic"],   "LLM calls", dashed=True))

# External
cells.append(arrow(ids["msgraph"],     ids["azure_ad"],    "Verify Service Principal", dashed=True))
cells.append(arrow(ids["survey_store"],ids["future_db"],   "swap →", dashed=True))

# ══════════════════════════════════════════════════════════════════════════════
# ASSEMBLE
# ══════════════════════════════════════════════════════════════════════════════
body = "\n        ".join(cells)
xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" type="device" version="21.0.0">
  <diagram id="engee-architecture" name="Engee Architecture">
    <mxGraphModel dx="1500" dy="900" grid="1" gridSize="10" guides="1" tooltips="1"
                  connect="1" arrows="1" fold="1" page="1" pageScale="1"
                  pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        {body}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
'''

out = "docs/Engee_Architecture.drawio"
with open(out, "w", encoding="utf-8") as f:
    f.write(xml)
print(f"Saved: {out}")
