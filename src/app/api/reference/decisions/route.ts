import { NextRequest, NextResponse } from "next/server";
import { setDecision, getDecisions, RecruiterDecision } from "@/lib/reference-store";

export async function GET() {
  return NextResponse.json({ decisions: getDecisions() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<RecruiterDecision>;

    if (!body.candidate_id || !body.decision) {
      return NextResponse.json(
        { error: "candidate_id and decision are required" },
        { status: 400 }
      );
    }

    const validDecisions = ["PROCEED", "ON_HOLD", "NOT_SUITABLE"];
    if (!validDecisions.includes(body.decision)) {
      return NextResponse.json({ error: "Invalid decision value" }, { status: 400 });
    }

    const decision: RecruiterDecision = {
      candidate_id: body.candidate_id,
      decision: body.decision,
      reason_code: body.reason_code ?? "",
      decided_at: new Date().toISOString(),
    };

    setDecision(decision);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recruiter decision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
