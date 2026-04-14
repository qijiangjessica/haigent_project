/**
 * GET /api/reference/analytics/funnel
 *
 * T2/T5 — Analytics API: Pipeline funnel with stage duration data.
 *
 * Returns counts of referrals at each pipeline stage:
 *   submitted → contacted → decision_made → in_pool → hired
 *
 * Also returns drop-off rates and average days spent in each stage.
 *
 * Query params (all optional):
 *   date_from   ISO date string — only referrals submitted on/after this date
 *   date_to     ISO date string — only referrals submitted on/before this date
 *   job_id      string          — filter by target_job_id
 */

import { NextRequest, NextResponse } from "next/server";
import { getReferrals, getDecisions, getLivePoolEntries, getHiredEvents } from "@/lib/reference-store";
import { hydrateStoreFromDisk, readContacts } from "@/lib/reference-json-persistence";

function daysBetween(from: string, to: string): number {
  return Math.max(
    0,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
  );
}

function avgDays(pairs: [string, string][]): number | null {
  if (pairs.length === 0) return null;
  const total = pairs.reduce((s, [a, b]) => s + daysBetween(a, b), 0);
  return Math.round(total / pairs.length);
}

export async function GET(request: NextRequest) {
  hydrateStoreFromDisk();

  const { searchParams } = new URL(request.url);
  const dateFrom    = searchParams.get("date_from") ?? null;
  const dateTo      = searchParams.get("date_to") ?? null;
  const jobIdFilter = searchParams.get("job_id") ?? null;

  let referrals = getReferrals();

  // Apply filters
  if (dateFrom) referrals = referrals.filter((r) => r.submitted_at >= dateFrom);
  if (dateTo)   referrals = referrals.filter((r) => r.submitted_at <= dateTo + "T23:59:59Z");
  if (jobIdFilter) referrals = referrals.filter((r) => r.target_job_id === jobIdFilter);

  const referralIds = new Set(referrals.map((r) => r.referral_id));
  const referralMap  = new Map(referrals.map((r) => [r.referral_id, r]));

  // Stage 1 — Submitted
  const submitted = referrals.length;

  // Stage 2 — Contacted (at least one contact event recorded)
  const allContacts = readContacts().filter((c) => referralIds.has(c.referral_id));
  // First contact per referral
  const firstContactByReferral = new Map<string, string>();
  for (const c of allContacts) {
    const existing = firstContactByReferral.get(c.referral_id);
    if (!existing || c.contacted_at < existing) {
      firstContactByReferral.set(c.referral_id, c.contacted_at);
    }
  }
  const contacted = firstContactByReferral.size;

  // Stage 3 — Decision made (PROCEED → in_review or any pipeline transition past pending)
  const decisions = getDecisions().filter((d) => referralIds.has(d.candidate_id));
  const decisionIds = new Set(decisions.map((d) => d.candidate_id));
  const inReviewReferrals = referrals.filter(
    (r) => r.pipeline_status === "in_review" || r.pipeline_status === "in_pool" || r.pipeline_status === "hired"
  );
  const decisionSet = new Set([
    ...decisionIds,
    ...inReviewReferrals.map((r) => r.referral_id),
  ]);
  const decisionMade = decisionSet.size;

  // Stage 4 — In Pool
  const poolEntries = getLivePoolEntries().filter((p) => referralIds.has(p.referral_id));
  const poolEntryMap = new Map(poolEntries.map((p) => [p.referral_id, p]));
  const pooledIds = new Set([
    ...referrals.filter((r) => r.pipeline_status === "in_pool" || r.pipeline_status === "hired").map((r) => r.referral_id),
    ...poolEntries.map((p) => p.referral_id),
  ]);
  const inPool = pooledIds.size;

  // Stage 5 — Hired
  const hiredEvents = getHiredEvents().filter(
    (e) => e.entity_type === "referral" && referralIds.has(e.referral_id ?? e.entity_id)
  );
  const hiredMap = new Map(hiredEvents.map((e) => [e.referral_id ?? e.entity_id, e]));
  const hired = hiredMap.size;

  // ── Average days per stage ─────────────────────────────────────────────────
  const now = new Date().toISOString();

  // submitted → first contacted
  const submittedToContacted: [string, string][] = [];
  for (const [rid, contactedAt] of firstContactByReferral) {
    const r = referralMap.get(rid);
    if (r) submittedToContacted.push([r.submitted_at, contactedAt]);
  }

  // first contacted → in_review (use in_review_at on referral)
  const contactedToReview: [string, string][] = [];
  for (const r of referrals) {
    const firstContact = firstContactByReferral.get(r.referral_id);
    if (firstContact && r.in_review_at) {
      contactedToReview.push([firstContact, r.in_review_at]);
    }
  }

  // in_review → pool date_added
  const reviewToPool: [string, string][] = [];
  for (const r of referrals) {
    const pool = poolEntryMap.get(r.referral_id);
    if (r.in_review_at && pool?.date_added) {
      reviewToPool.push([r.in_review_at, pool.date_added]);
    }
  }

  // pool date_added → hired_at
  const poolToHired: [string, string][] = [];
  for (const [rid, event] of hiredMap) {
    const pool = poolEntryMap.get(rid);
    if (pool?.date_added) {
      poolToHired.push([pool.date_added, event.hired_at]);
    }
  }

  // Current avg wait in each stage for NOT-YET-advanced referrals (for T7 at-risk)
  const avgDaysSubmittedToContact   = avgDays(submittedToContacted);
  const avgDaysContactedToDecision  = avgDays(contactedToReview);
  const avgDaysDecisionToPool       = avgDays(reviewToPool);
  const avgDaysPoolToHired          = avgDays(poolToHired);

  // Additional breakdown
  const notSuitable   = referrals.filter((r) => r.pipeline_status === "not_suitable").length;
  const pendingReview = referrals.filter((r) => r.pipeline_status === "pending_review").length;
  const inReview      = referrals.filter((r) => r.pipeline_status === "in_review").length;

  function rate(num: number, denom: number): number | null {
    if (denom === 0) return null;
    return Math.round((num / denom) * 100);
  }

  const stages = [
    {
      stage: "submitted",
      label: "Submitted",
      count: submitted,
      conversion_from_prev: null,
      avg_days_in_stage: avgDays(
        referrals.map((r) => {
          const firstContact = firstContactByReferral.get(r.referral_id);
          return [r.submitted_at, firstContact ?? now] as [string, string];
        }).filter(([, to]) => to !== now)
      ),
    },
    {
      stage: "contacted",
      label: "Contacted",
      count: contacted,
      conversion_from_prev: rate(contacted, submitted),
      avg_days_in_stage: avgDays(contactedToReview.length > 0 ? contactedToReview : submittedToContacted),
    },
    {
      stage: "decision_made",
      label: "Decision Made",
      count: decisionMade,
      conversion_from_prev: rate(decisionMade, contacted || submitted),
      avg_days_in_stage: avgDaysContactedToDecision,
    },
    {
      stage: "in_pool",
      label: "In Talent Pool",
      count: inPool,
      conversion_from_prev: rate(inPool, decisionMade || submitted),
      avg_days_in_stage: avgDaysDecisionToPool,
    },
    {
      stage: "hired",
      label: "Hired",
      count: hired,
      conversion_from_prev: rate(hired, inPool || submitted),
      avg_days_in_stage: avgDaysPoolToHired,
    },
  ];

  const breakdown = {
    pending_review: pendingReview,
    in_review:      inReview,
    in_pool:        inPool,
    not_suitable:   notSuitable,
    hired,
  };

  const overall_conversion = rate(hired, submitted);

  // ── At-risk referrals (T7) ─────────────────────────────────────────────────
  // Referrals that have been submitted but have no PROCEED decision yet
  // and have been waiting > half the avg TTH from time-to-hire endpoint.
  // (The page will also do client-side filtering against target TTH.)
  const atRiskReferrals = referrals
    .filter((r) => r.pipeline_status === "pending_review")
    .map((r) => ({
      referral_id:    r.referral_id,
      candidate_name: r.candidate_name,
      referrer_name:  r.referrer_name,
      submitted_at:   r.submitted_at,
      days_waiting:   daysBetween(r.submitted_at, now),
      pipeline_status: r.pipeline_status,
    }))
    .sort((a, b) => b.days_waiting - a.days_waiting);

  return NextResponse.json({
    stages,
    breakdown,
    overall_conversion,
    total_submitted: submitted,
    stage_durations: {
      submitted_to_contacted:    avgDaysSubmittedToContact,
      contacted_to_decision:     avgDaysContactedToDecision,
      decision_to_pool:          avgDaysDecisionToPool,
      pool_to_hired:             avgDaysPoolToHired,
    },
    at_risk_referrals: atRiskReferrals,
  });
}
