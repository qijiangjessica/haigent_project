import { NextRequest, NextResponse } from "next/server";
import { addLiveAuditEvent, getLiveAuditEvents, LiveAuditEvent } from "@/lib/reference-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entity_id") ?? undefined;
  return NextResponse.json({ events: getLiveAuditEvents(entityId) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.entity_id || !body.event_type || !body.after_state) {
      return NextResponse.json(
        { error: "entity_id, event_type, and after_state are required" },
        { status: 400 }
      );
    }

    const event: LiveAuditEvent = {
      event_id: `LIVE-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor: body.actor ?? "Recruiter",
      actor_id: body.actor_id ?? "SYS-RECRUITER",
      event_type: body.event_type,
      entity_type: body.entity_type ?? "candidate",
      entity_id: body.entity_id,
      before_state: body.before_state ?? null,
      after_state: body.after_state,
      notes: body.notes ?? null,
    };

    addLiveAuditEvent(event);

    return NextResponse.json({ success: true, event_id: event.event_id });
  } catch (error) {
    console.error("Audit event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
