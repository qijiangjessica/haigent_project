import { NextRequest, NextResponse } from "next/server";
import {
  getAllStatusOverrides, getReferrals,
} from "@/lib/reference-store";
import {
  setStatusOverrideAndPersist, addAuditEventAndPersist,
  addHiredEventAndPersist, hydrateStoreFromDisk,
} from "@/lib/reference-json-persistence";
import { sendEmail, appUrl } from "@/lib/email";
import { statusChangeReferrer, candidateHiredReferrer } from "@/lib/email-templates";

type DecisionKey = "PROCEED" | "ON_HOLD" | "NOT_SUITABLE";

/** Normalise the raw status string coming from the UI into one of the three decision keys. */
function toDecisionKey(status: string): DecisionKey | null {
  const s = status.toUpperCase();
  if (s === "MATCHED"      || s === "PROCEED")      return "PROCEED";
  if (s === "CLOSED"       || s === "NOT_SUITABLE")  return "NOT_SUITABLE";
  if (s === "ON_HOLD"      || s === "ONHOLD")        return "ON_HOLD";
  return null;
}

export async function GET() {
  hydrateStoreFromDisk();
  return NextResponse.json({ overrides: getAllStatusOverrides() });
}

export async function POST(request: NextRequest) {
  try {
    hydrateStoreFromDisk();

    const body = await request.json();

    if (!body.candidate_id || !body.status) {
      return NextResponse.json(
        { error: "candidate_id and status are required" },
        { status: 400 }
      );
    }

    const candidateId = body.candidate_id as string;
    const normalised  = (body.status as string).toUpperCase();
    const hiredAt     = new Date().toISOString();

    // Capture the previous status for the audit event
    const allOverrides = getAllStatusOverrides();
    const beforeState  = allOverrides[candidateId] ?? "unknown";

    // Persist override to store + disk
    setStatusOverrideAndPersist(candidateId, body.status);

    // ── T1: Hired event capture (seeded candidate path) ──────────────────────
    if (normalised === "HIRED") {
      const referral = getReferrals().find((r) => r.referral_id === candidateId);
      addHiredEventAndPersist({
        event_id:     `HIRE-${Date.now()}`,
        entity_id:    candidateId,
        entity_type:  referral ? "referral" : "candidate",
        hired_at:     hiredAt,
        referral_id:  referral?.referral_id ?? null,
        submitted_at: referral?.submitted_at ?? null,
      });
    }

    // ── T1: Audit event for every status transition ───────────────────────────
    addAuditEventAndPersist({
      event_id:    `EVT-STATUS-${Date.now()}`,
      timestamp:   hiredAt,
      actor:       "Recruiter",
      actor_id:    "Recruiter",
      event_type:  "StatusChange",
      entity_type: "candidate",
      entity_id:   candidateId,
      before_state: beforeState,
      after_state:  body.status as string,
      notes:        `Status override: ${beforeState} → ${body.status}${normalised === "HIRED" ? " [hired_at recorded]" : ""}`,
    });

    // ── Email notifications ───────────────────────────────────────────────────
    const referral = getReferrals().find((r) => r.referral_id === candidateId);
    if (referral?.referrer_email) {
      const referralUrl = appUrl(`/reference/referrals/${referral.referral_id}`);

      if (normalised === "HIRED") {
        // E5: Candidate hired — trigger referral bonus process
        const tmpl = candidateHiredReferrer({
          referrerName: referral.referrer_name,
          candidateName: referral.candidate_name,
          referralId: referral.referral_id,
          referralUrl,
        });
        sendEmail({ ...tmpl, to: referral.referrer_email, notificationType: "candidate_hired_referrer", referralId: referral.referral_id, toRole: "referrer" }).catch(() => {});
      } else {
        // E4: Status change (PROCEED / ON_HOLD / NOT_SUITABLE)
        const decision = toDecisionKey(body.status);
        if (decision) {
          const tmpl = statusChangeReferrer({
            referrerName: referral.referrer_name,
            candidateName: referral.candidate_name,
            referralId: referral.referral_id,
            decision,
            referralUrl,
          });
          sendEmail({ ...tmpl, to: referral.referrer_email, notificationType: "status_change_referrer", referralId: referral.referral_id, toRole: "referrer" }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, hired_at: normalised === "HIRED" ? hiredAt : null });
  } catch (error) {
    console.error("Status override error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
