/**
 * PATCH /api/reference/bonus-flags/[flag_id]
 *
 * HR updates a bonus flag status.
 * Allowed transitions: pending → processing → paid | ineligible
 *
 * Body: { status, notes? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getBonusFlags } from "@/lib/reference-store";
import { updateBonusFlagAndPersist, hydrateStoreFromDisk } from "@/lib/reference-json-persistence";

const VALID_STATUSES = new Set(["pending", "processing", "paid", "ineligible"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flag_id: string }> }
) {
  try {
    hydrateStoreFromDisk();
    const { flag_id } = await params;

    const flag = getBonusFlags().find((f) => f.flag_id === flag_id);
    if (!flag) {
      return NextResponse.json({ error: "Bonus flag not found" }, { status: 404 });
    }

    const body = await request.json() as { status?: string; notes?: string };

    if (body.status && !VALID_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const patch: Parameters<typeof updateBonusFlagAndPersist>[1] = {};

    if (body.status) patch.status = body.status as "pending" | "processing" | "paid" | "ineligible";
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.status === "paid" || body.status === "ineligible") {
      patch.processed_at = now;
    }

    const updated = updateBonusFlagAndPersist(flag_id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    const updatedFlag = getBonusFlags().find((f) => f.flag_id === flag_id);
    return NextResponse.json({ success: true, flag: updatedFlag });
  } catch (error) {
    console.error("bonus-flags PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
