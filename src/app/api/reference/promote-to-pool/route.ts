import { NextRequest, NextResponse } from "next/server";
import {
  getReferrals,
  getLiveMatchRecords,
  getLivePoolEntry,
  type LivePoolEntry,
} from "@/lib/reference-store";
import { addPoolEntryAndPersist, addAuditEventAndPersist } from "@/lib/reference-json-persistence";

const VALID_EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior", "Lead"] as const;

function generatePoolId(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LPOOL-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      referral_id,
      experience_level,
      preferred_role_tags,
      location_tags,
      promoted_by = "Recruiter",
    } = body;

    if (!referral_id || !experience_level) {
      return NextResponse.json(
        { error: "referral_id and experience_level are required" },
        { status: 400 }
      );
    }

    if (!VALID_EXPERIENCE_LEVELS.includes(experience_level)) {
      return NextResponse.json(
        { error: `experience_level must be one of: ${VALID_EXPERIENCE_LEVELS.join(", ")}` },
        { status: 400 }
      );
    }

    const referral = getReferrals().find((r) => r.referral_id === referral_id);
    if (!referral) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    // Idempotency guard — prevent double promotion
    const existing = getLivePoolEntry(referral_id);
    if (existing) {
      return NextResponse.json(
        { error: "This referral has already been promoted to pool", pool_id: existing.pool_id },
        { status: 409 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const matches = getLiveMatchRecords(referral_id);

    // Derive skill_tags from claimed skills (user_input passthrough)
    const skillTags: string[] =
      typeof referral.extra_filenames === "object" // extra_filenames is not skills
        ? []
        : [];
    // skills are not stored on SubmittedReferral directly — use preferred_role_tags as proxy
    // or accept them from the promotion form; fall back to empty array
    const resolvedSkillTags: string[] =
      Array.isArray(body.skill_tags)
        ? body.skill_tags.map((s: string) => s.trim()).filter(Boolean)
        : skillTags;

    const resolvedLocationTags: string[] =
      Array.isArray(location_tags) && location_tags.length > 0
        ? location_tags.map((l: string) => l.trim()).filter(Boolean)
        : [referral.location];

    const resolvedRoleTags: string[] =
      Array.isArray(preferred_role_tags) && preferred_role_tags.length > 0
        ? preferred_role_tags.map((r: string) => r.trim()).filter(Boolean)
        : [];

    const entry: LivePoolEntry = {
      pool_id: generatePoolId(),
      referral_id,
      candidate_name: referral.candidate_name,
      candidate_email: referral.candidate_email,
      years_experience: referral.years_experience,
      location: referral.location,
      availability: referral.availability,
      date_added: today,
      date_last_evaluated: today,
      status: "Active Hold",
      skill_tags: resolvedSkillTags,
      experience_level,
      location_tags: resolvedLocationTags,
      preferred_role_tags: resolvedRoleTags,
      match_evaluation_history: matches.map((m) => ({
        posting_id: m.posting_id,
        score: m.match_score,
        evaluated_date: m.evaluated_date,
      })),
      promoted_at: new Date().toISOString(),
      promoted_by,
    };

    // Persist pool entry to store + disk
    addPoolEntryAndPersist(entry);

    // Write audit event for lineage and persist
    addAuditEventAndPersist({
      event_id: `EVT-PROMO-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: promoted_by,
      actor_id: promoted_by,
      event_type: "PoolPromotion",
      entity_type: "referral",
      entity_id: referral_id,
      before_state: "pending_review",
      after_state: "in_pool",
      notes: `Promoted to pool as ${entry.pool_id} · Level: ${experience_level}`,
    });

    return NextResponse.json({
      success: true,
      pool_id: entry.pool_id,
      referral_id,
      promoted_at: entry.promoted_at,
    });
  } catch (error) {
    console.error("Promote to pool error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const { getLivePoolEntries } = await import("@/lib/reference-store");
  return NextResponse.json({ pool_entries: getLivePoolEntries() });
}
