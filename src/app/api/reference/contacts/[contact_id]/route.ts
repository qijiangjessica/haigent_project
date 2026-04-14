import { NextRequest, NextResponse } from "next/server";
import { updateContactStatusAndPersist } from "@/lib/reference-json-persistence";
import type { ContactEvent } from "@/types";

const VALID_STATUSES: ContactEvent["status"][] = ["sent", "replied", "no_response"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contact_id: string }> }
) {
  try {
    const { contact_id } = await params;
    const body = await request.json() as { status?: string };

    if (!body.status || !VALID_STATUSES.includes(body.status as ContactEvent["status"])) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = updateContactStatusAndPersist(
      contact_id,
      body.status as ContactEvent["status"]
    );

    if (!updated) {
      return NextResponse.json({ error: "Contact event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact_id, status: body.status });
  } catch (error) {
    console.error("[contacts/PATCH] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
