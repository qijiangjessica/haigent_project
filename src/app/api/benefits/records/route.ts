import { NextResponse } from "next/server";
import { queryTable, BENEFIT_TYPES_TABLE, BENEFIT_ENROLLMENT_TABLE } from "@/lib/servicenow";

export async function GET() {
  try {
    const [benefitTypes, inquiries] = await Promise.all([
      queryTable(BENEFIT_TYPES_TABLE, {
        sysparm_fields: "sys_id,benefit_name,benefit_description,category,cost,employer_contribution,eligibility,enrollment_period,provider,active",
        sysparm_query: "active=true",
        sysparm_display_value: true,
        sysparm_limit: 50,
      }),
      queryTable(BENEFIT_ENROLLMENT_TABLE, {
        sysparm_fields: "sys_id,employee,inquiry_type,benefit_category,description,status,priority,assigned_to,inquiry_date,resolution_notes,satisfaction_rating",
        sysparm_display_value: true,
        sysparm_limit: 100,
      }),
    ]);

    return NextResponse.json({ benefitTypes, inquiries });
  } catch (error) {
    console.error("Failed to fetch benefits data:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
