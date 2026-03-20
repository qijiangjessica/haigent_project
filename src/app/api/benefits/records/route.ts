import { NextResponse } from "next/server";
import { queryTable, BENEFIT_TYPES_TABLE, BENEFIT_ENROLLMENT_TABLE } from "@/lib/servicenow";

export async function GET() {
  try {
    const [benefitTypes, enrollments] = await Promise.all([
      queryTable(BENEFIT_TYPES_TABLE, {
        sysparm_display_value: true,
        sysparm_limit: 50,
      }),
      queryTable(BENEFIT_ENROLLMENT_TABLE, {
        sysparm_display_value: true,
        sysparm_limit: 100,
      }),
    ]);

    return NextResponse.json({ benefitTypes, enrollments });
  } catch (error) {
    console.error("Failed to fetch benefits data:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
