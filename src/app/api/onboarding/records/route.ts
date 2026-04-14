import { NextResponse } from "next/server";
import { getAllRecords } from "@/lib/onboarding-store";

export async function GET() {
  try {
    const records = getAllRecords();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to fetch onboarding records:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
