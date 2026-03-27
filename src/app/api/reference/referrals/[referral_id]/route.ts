import { NextRequest, NextResponse } from "next/server";
import {
  getReferrals,
  getLiveMatchRecords,
  getLivePoolEntry,
} from "@/lib/reference-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ referral_id: string }> }
) {
  const { referral_id } = await params;

  const referral = getReferrals().find((r) => r.referral_id === referral_id);
  if (!referral) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }

  const matches = getLiveMatchRecords(referral_id);
  const poolEntry = getLivePoolEntry(referral_id) ?? null;

  return NextResponse.json({ referral, matches, poolEntry });
}
