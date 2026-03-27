import { NextRequest, NextResponse } from "next/server";
import { getLiveMatchRecords } from "@/lib/reference-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referralId = searchParams.get("referral_id") ?? undefined;
  return NextResponse.json({ matches: getLiveMatchRecords(referralId) });
}
