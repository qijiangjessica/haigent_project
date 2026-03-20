import { NextResponse } from "next/server";
import { queryTable, ONBOARDING_TABLE } from "@/lib/servicenow";

export async function GET() {
  try {
    const records = await queryTable(ONBOARDING_TABLE, {
      sysparm_display_value: true,
      sysparm_limit: 50,
    });
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Failed to fetch onboarding records:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
