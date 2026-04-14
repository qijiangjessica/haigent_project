/**
 * GET /api/reference/hired-events
 *
 * Returns all hired events with computed time-to-hire (TTH) in days.
 * Used by T2–T7 Time-to-Hire UI and analytics.
 *
 * Response shape:
 *   { events: HiredEventWithTTH[] }
 *
 * HiredEventWithTTH adds:
 *   - days_to_hire: number | null  (hired_at - submitted_at, null if submitted_at missing)
 *   - candidate_name: string | null (looked up from referrals store)
 */

import { NextResponse } from "next/server";
import { getReferrals, getHiredEvents } from "@/lib/reference-store";
import { hydrateStoreFromDisk } from "@/lib/reference-json-persistence";

function daysBetween(from: string, to: string): number {
  return Math.max(
    0,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
  );
}

export async function GET() {
  hydrateStoreFromDisk();

  const referrals   = getReferrals();
  const hiredEvents = getHiredEvents();

  const events = hiredEvents.map((e) => {
    const referral = referrals.find((r) => r.referral_id === e.referral_id || r.referral_id === e.entity_id);

    const submittedAt = e.submitted_at ?? referral?.submitted_at ?? null;
    const days_to_hire = submittedAt
      ? daysBetween(submittedAt, e.hired_at)
      : null;

    return {
      ...e,
      candidate_name: referral?.candidate_name ?? null,
      referrer_name:  referral?.referrer_name  ?? null,
      submitted_at:   submittedAt,
      days_to_hire,
    };
  });

  // Sort most recently hired first
  events.sort((a, b) => new Date(b.hired_at).getTime() - new Date(a.hired_at).getTime());

  const avg_days_to_hire =
    events.filter((e) => e.days_to_hire !== null).length > 0
      ? Math.round(
          events
            .filter((e) => e.days_to_hire !== null)
            .reduce((sum, e) => sum + (e.days_to_hire ?? 0), 0) /
            events.filter((e) => e.days_to_hire !== null).length
        )
      : null;

  return NextResponse.json({
    events,
    total_hired:       events.length,
    avg_days_to_hire,
  });
}
