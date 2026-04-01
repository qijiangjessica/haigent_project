import { NextRequest, NextResponse } from "next/server";
import { getReferrals, getRejectedReferralIds } from "@/lib/reference-store";
import { rejectReferralAndPersist, addAuditEventAndPersist } from "@/lib/reference-json-persistence";

export async function GET() {
  return NextResponse.json({ rejected_ids: getRejectedReferralIds() });
}

export async function POST(request: NextRequest) {
  try {
    const { referral_id, action, reason_code } = await request.json();

    if (!referral_id || action !== "not_suitable") {
      return NextResponse.json(
        { error: "referral_id and action='not_suitable' are required" },
        { status: 400 }
      );
    }

    const referral = getReferrals().find((r) => r.referral_id === referral_id);
    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Persist rejection to store + disk
    rejectReferralAndPersist(referral_id);

    addAuditEventAndPersist({
      event_id: `EVT-REJ-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "Recruiter",
      actor_id: "Recruiter",
      event_type: "Decision",
      entity_type: "referral",
      entity_id: referral_id,
      before_state: "pending_review",
      after_state: "not_suitable",
      notes: reason_code ? `Not Suitable · ${reason_code}` : "Not Suitable",
    });

    return NextResponse.json({ success: true, referral_id });
  } catch (error) {
    console.error("Referral action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
