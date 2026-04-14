/**
 * GET  /api/reference/bonus-flags  — list all bonus flags (newest first)
 * POST /api/reference/bonus-flags  — manually create a bonus flag (recruiter override)
 */

import { NextRequest, NextResponse } from "next/server";
import { getBonusFlags } from "@/lib/reference-store";
import { addBonusFlagAndPersist, hydrateStoreFromDisk, type BonusFlag } from "@/lib/reference-json-persistence";

export async function GET() {
  hydrateStoreFromDisk();
  const flags = getBonusFlags().sort(
    (a, b) => new Date(b.flagged_at).getTime() - new Date(a.flagged_at).getTime()
  );
  const summary = {
    total:      flags.length,
    pending:    flags.filter((f) => f.status === "pending").length,
    processing: flags.filter((f) => f.status === "processing").length,
    paid:       flags.filter((f) => f.status === "paid").length,
    ineligible: flags.filter((f) => f.status === "ineligible").length,
  };
  return NextResponse.json({ flags, summary });
}

export async function POST(request: NextRequest) {
  try {
    hydrateStoreFromDisk();
    const body = await request.json() as Partial<BonusFlag>;
    if (!body.referral_id || !body.candidate_name || !body.referrer_name || !body.hired_at) {
      return NextResponse.json({ error: "referral_id, candidate_name, referrer_name, hired_at are required" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const flag: BonusFlag = {
      flag_id:        `BONUS-${Date.now()}`,
      referral_id:    body.referral_id,
      candidate_name: body.candidate_name,
      referrer_name:  body.referrer_name,
      referrer_emp_id: body.referrer_emp_id ?? "",
      hired_at:       body.hired_at,
      submitted_at:   body.submitted_at ?? now,
      days_to_hire:   body.days_to_hire ?? 0,
      status:         "pending",
      flagged_at:     now,
      processed_at:   null,
      notes:          body.notes ?? null,
    };
    addBonusFlagAndPersist(flag);
    return NextResponse.json({ success: true, flag });
  } catch (error) {
    console.error("bonus-flags POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
