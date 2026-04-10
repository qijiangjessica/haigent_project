import { NextRequest, NextResponse } from "next/server";
import { addContactAndPersist, getContactsByReferralId, hydrateStoreFromDisk } from "@/lib/reference-json-persistence";
import { getReferrals } from "@/lib/reference-store";
import { sendEmail, appUrl } from "@/lib/email";
import { candidateContactedReferrer } from "@/lib/email-templates";
import { OPEN_JOBS } from "@/data/reference/jobs";
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
    hydrateStoreFromDisk();

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

    // E3: Notify referrer that their candidate was contacted
    const referral = getReferrals().find((r) => r.referral_id === body.referral_id);
    if (referral?.referrer_email) {
      const job = OPEN_JOBS.find((j) => j.id === body.posting_id);
      const tmpl = candidateContactedReferrer({
        referrerName: referral.referrer_name,
        candidateName: referral.candidate_name,
        referralId: referral.referral_id,
        jobTitle: job?.title ?? body.posting_id ?? "Open Role",
        contactMethod: body.contact_method,
        referralUrl: appUrl(`/reference/referrals/${referral.referral_id}`),
      });
      sendEmail({ ...tmpl, to: referral.referrer_email, notificationType: "candidate_contacted_referrer", referralId: referral.referral_id, toRole: "referrer" }).catch(() => {});
    }

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("[contacts] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
