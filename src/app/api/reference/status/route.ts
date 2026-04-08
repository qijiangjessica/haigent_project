import { NextRequest, NextResponse } from "next/server";
import {
  getAllStatusOverrides, getReferrals,
  addReferral, addLiveMatchRecord, addLivePoolEntry,
  setDecision, rejectReferral, addLiveAuditEvent,
  setStatusOverride, setScoringWeights, setJobWeightOverride,
} from "@/lib/reference-store";
import { setStatusOverrideAndPersist, loadFromDisk } from "@/lib/reference-json-persistence";
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

function hydrateIfEmpty() {
  if (getReferrals().length === 0) {
    try {
      const snap = loadFromDisk();
      for (const r of snap.referrals)    addReferral(r);
      for (const m of snap.matches)      addLiveMatchRecord(m);
      for (const p of snap.poolEntries)  addLivePoolEntry(p);
      for (const d of snap.decisions)    setDecision(d);
      for (const id of snap.rejectedIds) rejectReferral(id);
      for (const e of snap.auditEvents)  addLiveAuditEvent(e);
      for (const [k, v] of Object.entries(snap.statusOverrides)) setStatusOverride(k, v);
      setScoringWeights(snap.scoringWeights);
      for (const [k, v] of Object.entries(snap.jobWeightOverrides)) setJobWeightOverride(k, v);
    } catch { /* no disk data yet */ }
  }
}

export async function GET() {
  return NextResponse.json({ overrides: getAllStatusOverrides() });
}

export async function POST(request: NextRequest) {
  try {
    hydrateIfEmpty();

    const body = await request.json();

    if (!body.candidate_id || !body.status) {
      return NextResponse.json(
        { error: "candidate_id and status are required" },
        { status: 400 }
      );
    }

    // Persist override to store + disk
    setStatusOverrideAndPersist(body.candidate_id, body.status);

    // Notify referrer based on the new status
    const referral = getReferrals().find((r) => r.referral_id === body.candidate_id);
    if (referral?.referrer_email) {
      const referralUrl = appUrl(`/reference/referrals/${referral.referral_id}`);
      const normalised = (body.status as string).toUpperCase();

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status override error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
