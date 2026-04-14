import { NextRequest, NextResponse } from "next/server";
import { findTopMentors } from "@/lib/engee-store";

export async function POST(request: NextRequest) {
  try {
    const { department, professional_interests, learning_interests, personal_interests } =
      await request.json();

    const matches = findTopMentors(
      department ?? "",
      professional_interests ?? [],
      learning_interests ?? [],
      personal_interests ?? []
    );

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
