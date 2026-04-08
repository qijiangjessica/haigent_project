import { NextRequest, NextResponse } from "next/server";
import {
  getDecisions, getReferrals, type RecruiterDecision,
  addReferral, addLiveMatchRecord, addLivePoolEntry,
  setDecision, rejectReferral, addLiveAuditEvent,
  setStatusOverride, setScoringWeights, setJobWeightOverride,
} from "@/lib/reference-store";
import { setDecisionAndPersist, loadFromDisk } from "@/lib/reference-json-persistence";
import { sendEmail, appUrl } from "@/lib/email";
import { statusChangeReferrer } from "@/lib/email-templates";

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
  hydrateIfEmpty();
  return NextResponse.json({ decisions: getDecisions() });
}

export async function POST(request: NextRequest) {
  try {
    hydrateIfEmpty();

    const body = await request.json() as Partial<RecruiterDecision> & { recruiter_email?: string };

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

    // E4: Notify referrer of decision change (submitted referrals only)
    // recruiter_email from request takes precedence over RECRUITER_EMAIL env var (A3)
    const recruiterEmail = body.recruiter_email || process.env.RECRUITER_EMAIL;
    void recruiterEmail; // available for future per-decision recruiter notifications

    const referral = getReferrals().find((r) => r.referral_id === body.candidate_id);
    if (referral?.referrer_email) {
      const tmpl = statusChangeReferrer({
        referrerName: referral.referrer_name,
        candidateName: referral.candidate_name,
        referralId: referral.referral_id,
        decision: body.decision as "PROCEED" | "ON_HOLD" | "NOT_SUITABLE",
        reasonCode: body.reason_code ?? undefined,
        referralUrl: appUrl(`/reference/referrals/${referral.referral_id}`),
      });
      sendEmail({
        ...tmpl,
        to: referral.referrer_email,
        notificationType: "status_change_referrer",
        referralId: referral.referral_id,
        toRole: "referrer",
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recruiter decision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
