import { NextRequest, NextResponse } from "next/server";
import { addContactAndPersist, getContactsByReferralId } from "@/lib/reference-json-persistence";
import type { ContactEvent } from "@/types";

const VALID_METHODS = ["email", "phone", "linkedin", "other"] as const;

export async function GET(request: NextRequest) {
  const referralId = request.nextUrl.searchParams.get("referral_id");
  if (!referralId) {
    return NextResponse.json({ error: "referral_id query param is required" }, { status: 400 });
  }
  const contacts = getContactsByReferralId(referralId);
  return NextResponse.json({ contacts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<ContactEvent>;

    if (!body.referral_id || !body.posting_id || !body.contact_method || !body.contacted_by) {
      return NextResponse.json(
        { error: "referral_id, posting_id, contact_method, and contacted_by are required" },
        { status: 400 }
      );
    }

    if (!VALID_METHODS.includes(body.contact_method as typeof VALID_METHODS[number])) {
      return NextResponse.json({ error: "Invalid contact_method" }, { status: 400 });
    }

    const tag = body.referral_id.slice(-4).toUpperCase();
    const contact: ContactEvent = {
      contact_id: `CONTACT-${Date.now()}-${tag}`,
      referral_id: body.referral_id,
      posting_id: body.posting_id,
      contacted_at: new Date().toISOString(),
      contact_method: body.contact_method as ContactEvent["contact_method"],
      contacted_by: body.contacted_by,
      notes: body.notes ?? null,
      status: "sent",
    };

    addContactAndPersist(contact);

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("[contacts] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
