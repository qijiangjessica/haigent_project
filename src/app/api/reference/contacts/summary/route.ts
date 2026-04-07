import { NextResponse } from "next/server";
import { getContactedCountByReferral } from "@/lib/reference-json-persistence";

/**
 * GET /api/reference/contacts/summary
 * Returns { summary: Record<referral_id, number> } — contacted job count per referral.
 * Used by the candidates list page to render activity pills without N individual fetches.
 */
export async function GET() {
  const summary = getContactedCountByReferral();
  return NextResponse.json({ summary });
}
