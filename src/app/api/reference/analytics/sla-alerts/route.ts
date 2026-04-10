/**
 * GET  /api/reference/analytics/sla-alerts         — preview which referrals breach SLA (no email)
 * PUT  /api/reference/analytics/sla-alerts         — update SLA config (days threshold)
 * POST /api/reference/analytics/sla-alerts         — scan and send email alert to recruiter
 *
 * SLA definition: a referral that has pipeline_status === "in_review" for more than N days
 * without moving to hired. N is configurable via the PUT endpoint (persisted to sla-config.json).
 *
 * Auth: POST protected by DIGEST_SECRET env var (same pattern as /digest).
 *       GET and PUT are open (recruiter-facing only).
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getReferrals } from "@/lib/reference-store";
import { hydrateStoreFromDisk } from "@/lib/reference-json-persistence";
import { sendEmail, appUrl } from "@/lib/email";
import { slaAlertRecruiter } from "@/lib/email-templates";

// ── SLA config persistence ────────────────────────────────────────────────────

const JSON_DIR    = path.join(process.cwd(), "src", "data", "reference", "json");
const CONFIG_FILE = path.join(JSON_DIR, "sla-config.json");
const DEFAULT_SLA = 14; // days

interface SlaConfig { sla_days: number }

function readSlaConfig(): SlaConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { sla_days: DEFAULT_SLA };
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8").trim();
    if (!raw) return { sla_days: DEFAULT_SLA };
    return JSON.parse(raw) as SlaConfig;
  } catch {
    return { sla_days: DEFAULT_SLA };
  }
}

function writeSlaConfig(cfg: SlaConfig): void {
  if (!fs.existsSync(JSON_DIR)) fs.mkdirSync(JSON_DIR, { recursive: true });
  const tmp = `${CONFIG_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), "utf-8");
  fs.renameSync(tmp, CONFIG_FILE);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function getBreachedReferrals(slaDays: number) {
  const now = new Date().toISOString();
  void now;
  return getReferrals()
    .filter((r) => r.pipeline_status === "in_review" && r.in_review_at != null)
    .map((r) => ({
      referralId:    r.referral_id,
      candidateName: r.candidate_name,
      referrerName:  r.referrer_name,
      daysInReview:  daysSince(r.in_review_at!),
      submittedAt:   r.submitted_at,
      referralUrl:   appUrl(`/reference/referrals/${r.referral_id}`),
    }))
    .filter((r) => r.daysInReview >= slaDays)
    .sort((a, b) => b.daysInReview - a.daysInReview);
}

// ── GET — preview ─────────────────────────────────────────────────────────────

export async function GET() {
  hydrateStoreFromDisk();
  const { sla_days } = readSlaConfig();
  const breached = getBreachedReferrals(sla_days);
  return NextResponse.json({ sla_days, breached_count: breached.length, breached_referrals: breached });
}

// ── PUT — update config ───────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { sla_days?: unknown };
    const n = Number(body.sla_days);
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      return NextResponse.json({ error: "sla_days must be an integer between 1 and 365" }, { status: 400 });
    }
    writeSlaConfig({ sla_days: n });
    return NextResponse.json({ success: true, sla_days: n });
  } catch (error) {
    console.error("sla-alerts PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST — scan and email ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Optional bearer-token guard (same as /digest)
  const secret = process.env.DIGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const recruiterEmail = process.env.RECRUITER_EMAIL;
  if (!recruiterEmail) {
    return NextResponse.json({ error: "RECRUITER_EMAIL not configured" }, { status: 500 });
  }

  hydrateStoreFromDisk();
  const { sla_days } = readSlaConfig();
  const breached = getBreachedReferrals(sla_days);

  if (breached.length === 0) {
    return NextResponse.json({ success: true, sent: false, reason: "No SLA breaches found", sla_days });
  }

  const tmpl  = slaAlertRecruiter({ slaDays: sla_days, breachedReferrals: breached });
  const result = await sendEmail({
    ...tmpl,
    to:               recruiterEmail,
    notificationType: "sla_alert_recruiter",
    toRole:           "recruiter",
  });

  return NextResponse.json({
    success:        result.success,
    sent:           result.success,
    sla_days,
    breached_count: breached.length,
    error:          result.error ?? null,
  });
}
