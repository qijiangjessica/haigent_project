import { NextRequest, NextResponse } from "next/server";
import { getLiveMatchRecords } from "@/lib/reference-store";
import { hydrateStoreFromDisk } from "@/lib/reference-json-persistence";

export async function GET(request: NextRequest) {
  hydrateStoreFromDisk();
  const { searchParams } = new URL(request.url);
  const referralId = searchParams.get("referral_id") ?? undefined;
  return NextResponse.json({ matches: getLiveMatchRecords(referralId) });
}
