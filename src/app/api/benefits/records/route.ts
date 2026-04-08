import { NextResponse } from "next/server";
import { getBenefitCatalog, getAllInquiries } from "@/lib/benefits-store";

export async function GET() {
  try {
    const [benefitTypes, inquiries] = await Promise.all([
      getBenefitCatalog(),
      getAllInquiries(),
    ]);
    return NextResponse.json({ benefitTypes, inquiries });
  } catch (error) {
    console.error("Failed to fetch benefits data:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
