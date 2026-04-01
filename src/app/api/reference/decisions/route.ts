import { NextRequest, NextResponse } from "next/server";
import { getDecisions, type RecruiterDecision } from "@/lib/reference-store";
import { setDecisionAndPersist } from "@/lib/reference-json-persistence";

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

    // Persist decision to store + disk
    setDecisionAndPersist(decision);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recruiter decision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
