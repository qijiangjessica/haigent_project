import { NextRequest, NextResponse } from "next/server";
import { getAllStatusOverrides } from "@/lib/reference-store";
import { setStatusOverrideAndPersist } from "@/lib/reference-json-persistence";

export async function GET() {
  return NextResponse.json({ overrides: getAllStatusOverrides() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.candidate_id || !body.status) {
      return NextResponse.json(
        { error: "candidate_id and status are required" },
        { status: 400 }
      );
    }

    // Persist override to store + disk
    setStatusOverrideAndPersist(body.candidate_id, body.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status override error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
