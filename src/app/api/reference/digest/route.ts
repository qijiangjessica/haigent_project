/**
 * POST /api/reference/digest
 *
 * R5 — Stale referral digest.
 * Sends a weekly email to the recruiter listing all referrals that are:
 *   - older than 14 days, AND
 *   - have 0 candidate contacts recorded
 *
 * Call this endpoint from a cron job or scheduler (e.g. weekly on Monday morning).
 * It is idempotent — safe to call multiple times; duplicate sends are the caller's concern.
 *
 * Auth: protected by DIGEST_SECRET env var (send as Authorization: Bearer <secret>).
 * If DIGEST_SECRET is not set the endpoint is open (dev only).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getReferrals,
  addReferral, addLiveMatchRecord, addLivePoolEntry,
  setDecision, rejectReferral, addLiveAuditEvent,
  setStatusOverride, setScoringWeights, setJobWeightOverride,
} from "@/lib/reference-store";
import {
  loadFromDisk,
  getContactedCountByReferral,
} from "@/lib/reference-json-persistence";
import { sendEmail, appUrl } from "@/lib/email";
import { staleReferralDigest } from "@/lib/email-templates";

const STALE_DAYS = 14;

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

export async function POST(request: NextRequest) {
  // Optional bearer-token guard
  const secret = process.env.DIGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const recruiterEmail = process.env.RECRUITER_EMAIL;
  if (!recruiterEmail) {
    return NextResponse.json({ error: "RECRUITER_EMAIL not configured" }, { status: 500 });
  }

  hydrateIfEmpty();

  const now = Date.now();
  const contactedCount = getContactedCountByReferral();

  const stale = getReferrals()
    .filter((r) => {
      const daysOld = (now - new Date(r.submitted_at).getTime()) / 86_400_000;
      const contacts = contactedCount[r.referral_id] ?? 0;
      return daysOld >= STALE_DAYS && contacts === 0;
    })
    .map((r) => {
      const daysOld = Math.floor((now - new Date(r.submitted_at).getTime()) / 86_400_000);
      return {
        referralId: r.referral_id,
        candidateName: r.candidate_name,
        referrerName: r.referrer_name,
        submittedAt: new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        daysOld,
        referralUrl: appUrl(`/reference/referrals/${r.referral_id}`),
      };
    })
    .sort((a, b) => b.daysOld - a.daysOld);

  if (stale.length === 0) {
    return NextResponse.json({ success: true, sent: false, reason: "No stale referrals found" });
  }

  const tmpl = staleReferralDigest({ staleReferrals: stale });
  const result = await sendEmail({
    ...tmpl,
    to: recruiterEmail,
    notificationType: "stale_referral_digest",
    toRole: "recruiter",
  });

  return NextResponse.json({
    success: result.success,
    sent: result.success,
    stale_count: stale.length,
    error: result.error ?? null,
  });
}

// GET — preview which referrals would be included (no email sent)
export async function GET() {
  hydrateIfEmpty();

  const now = Date.now();
  const contactedCount = getContactedCountByReferral();

  const stale = getReferrals()
    .filter((r) => {
      const daysOld = (now - new Date(r.submitted_at).getTime()) / 86_400_000;
      const contacts = contactedCount[r.referral_id] ?? 0;
      return daysOld >= STALE_DAYS && contacts === 0;
    })
    .map((r) => ({
      referral_id: r.referral_id,
      candidate_name: r.candidate_name,
      referrer_name: r.referrer_name,
      submitted_at: r.submitted_at,
      days_old: Math.floor((now - new Date(r.submitted_at).getTime()) / 86_400_000),
      contacts: contactedCount[r.referral_id] ?? 0,
    }))
    .sort((a, b) => b.days_old - a.days_old);

  return NextResponse.json({ stale_count: stale.length, stale_referrals: stale });
}
