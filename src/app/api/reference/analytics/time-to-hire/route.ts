/**
 * GET /api/reference/analytics/time-to-hire
 *
 * T2 — Analytics API: Time-to-Hire breakdown.
 *
 * Returns per-referral TTH records plus aggregations (mean, median, p75, p90).
 *
 * Query params (all optional):
 *   date_from          ISO date string  — only referrals submitted on/after this date
 *   date_to            ISO date string  — only referrals submitted on/before this date
 *   job_id             string           — filter by target_job_id on the referral
 *   referrer_id        string           — filter by referrer_emp_id
 *   match_classification  "Strong Match" | "Partial Match" | "No Match"
 *                         — filter by best match classification for the referral
 */

import { NextRequest, NextResponse } from "next/server";
import { getReferrals, getHiredEvents, getLiveMatchRecords } from "@/lib/reference-store";
import { hydrateStoreFromDisk } from "@/lib/reference-json-persistence";

function daysBetween(from: string, to: string): number {
  return Math.max(
    0,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
  );
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

function median(sorted: number[]): number {
  return percentile(sorted, 50);
}

export async function GET(request: NextRequest) {
  hydrateStoreFromDisk();

  const { searchParams } = new URL(request.url);
  const dateFrom          = searchParams.get("date_from") ?? null;
  const dateTo            = searchParams.get("date_to") ?? null;
  const jobIdFilter       = searchParams.get("job_id") ?? null;
  const referrerIdFilter  = searchParams.get("referrer_id") ?? null;
  const classFilter       = searchParams.get("match_classification") ?? null;

  const referrals  = getReferrals();
  const hiredEvMap = new Map(getHiredEvents().map((e) => [e.referral_id ?? e.entity_id, e]));
  const allMatches = getLiveMatchRecords();

  // Build a map: referral_id → best match (classification + score)
  type BestMatch = { classification: string; score: number };
  const bestMatchByReferral = new Map<string, BestMatch>();
  for (const m of allMatches) {
    const current = bestMatchByReferral.get(m.referral_id);
    const order: Record<string, number> = { "Strong Match": 3, "Partial Match": 2, "No Match": 1 };
    if (!current || (order[m.classification] ?? 0) > (order[current.classification] ?? 0)) {
      bestMatchByReferral.set(m.referral_id, { classification: m.classification, score: m.match_score });
    }
  }

  type TTHRecord = {
    referral_id: string;
    candidate_name: string;
    referrer_name: string;
    referrer_emp_id: string;
    target_job_id: string;
    submitted_at: string;
    hired_at: string;
    days_to_hire: number;
    best_match_classification: string | null;
    best_match_score: number | null;
  };

  const records: TTHRecord[] = [];

  for (const r of referrals) {
    const event = hiredEvMap.get(r.referral_id);
    if (!event) continue; // not hired

    // Date filters (on submitted_at)
    if (dateFrom && r.submitted_at < dateFrom) continue;
    if (dateTo   && r.submitted_at > dateTo + "T23:59:59Z") continue;

    // Job filter
    if (jobIdFilter && r.target_job_id !== jobIdFilter) continue;

    // Referrer filter
    if (referrerIdFilter && r.referrer_emp_id !== referrerIdFilter) continue;

    // Classification filter
    const bestMatch = bestMatchByReferral.get(r.referral_id) ?? null;
    if (classFilter && bestMatch?.classification !== classFilter) continue;

    records.push({
      referral_id:               r.referral_id,
      candidate_name:            r.candidate_name,
      referrer_name:             r.referrer_name,
      referrer_emp_id:           r.referrer_emp_id,
      target_job_id:             r.target_job_id,
      submitted_at:              r.submitted_at,
      hired_at:                  event.hired_at,
      days_to_hire:              daysBetween(r.submitted_at, event.hired_at),
      best_match_classification: bestMatch?.classification ?? null,
      best_match_score:          bestMatch?.score ?? null,
    });
  }

  // Sort most-recently-hired first
  records.sort((a, b) => new Date(b.hired_at).getTime() - new Date(a.hired_at).getTime());

  const days = records.map((r) => r.days_to_hire).sort((a, b) => a - b);

  const aggregations =
    days.length > 0
      ? {
          count:  days.length,
          mean:   Math.round(days.reduce((s, d) => s + d, 0) / days.length),
          median: median(days),
          p75:    percentile(days, 75),
          p90:    percentile(days, 90),
          min:    days[0],
          max:    days[days.length - 1],
        }
      : null;

  return NextResponse.json({ records, aggregations, total: records.length });
}
