import { NextRequest, NextResponse } from "next/server";
import { getReferrals, getRejectedReferralIds } from "@/lib/reference-store";
import { rejectReferralAndPersist, addAuditEventAndPersist } from "@/lib/reference-json-persistence";
import { sendEmail, appUrl } from "@/lib/email";
import { rejectionConfirmationRecruiter } from "@/lib/email-templates";

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

    // R4: Notify recruiter of rejection with reason code
    const recruiterEmail = process.env.RECRUITER_EMAIL;
    if (recruiterEmail) {
      const tmpl = rejectionConfirmationRecruiter({
        candidateName: referral.candidate_name,
        referralId: referral_id,
        referrerName: referral.referrer_name,
        reasonCode: reason_code ?? undefined,
        referralUrl: appUrl(`/reference/referrals/${referral_id}`),
      });
      sendEmail({ ...tmpl, to: recruiterEmail, notificationType: "rejection_confirmation_recruiter", referralId: referral_id, toRole: "recruiter" }).catch(() => {});
    }

    return NextResponse.json({ success: true, referral_id });
  } catch (error) {
    console.error("Referral action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
