/**
 * email.ts
 *
 * Central mailer utility for the HaiGent platform.
 *
 * Behaviour:
 *  - If RESEND_API_KEY is missing or set to "dev", logs the email to the
 *    console instead of sending it (safe for local development).
 *  - In production (real API key present), sends via Resend.
 *  - Every send attempt — success or failure — is appended to the
 *    notification log via appendNotificationLogEntry().
 */

import { Resend } from "resend";

// ── Constants ───────────────────────────────────────────────────────────────

const API_KEY       = process.env.RESEND_API_KEY ?? "dev";
const FROM          = process.env.EMAIL_FROM ?? "HaiGent Referrals <onboarding@resend.dev>";
const BASE_URL      = process.env.APP_BASE_URL ?? "http://localhost:3000";
const DEV_RECIPIENT = process.env.DEV_RECIPIENT_OVERRIDE ?? null;

export const DEV_MODE = !API_KEY || API_KEY === "dev";

const resend = DEV_MODE ? null : new Resend(API_KEY);

// ── Types ───────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_referral_recruiter"
  | "submission_confirmation_referrer"
  | "match_result_referrer"
  | "match_result_recruiter"
  | "promoted_to_pool_referrer"
  | "promoted_to_pool_recruiter"
  | "candidate_referred"
  | "status_change_referrer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  notificationType: NotificationType;
  referralId?: string;
  toRole?: "recruiter" | "referrer" | "candidate";
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ── Core send function ──────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, notificationType, referralId, toRole } = options;

  let result: SendEmailResult;

  if (DEV_MODE) {
    console.log("\n📧 [email] DEV MODE — email not sent, logging instead:");
    console.log(`   Type   : ${notificationType}`);
    console.log(`   To     : ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Referral: ${referralId ?? "—"}`);
    console.log("");
    result = { success: true, id: `dev-${Date.now()}` };
  } else {
    // Redirect to DEV_RECIPIENT_OVERRIDE if set (all emails go to one address for testing)
    const recipient = DEV_RECIPIENT ?? to;
    if (DEV_RECIPIENT) {
      console.log(`[email] DEV_RECIPIENT_OVERRIDE active — redirecting "${to}" → "${DEV_RECIPIENT}" (${notificationType})`);
    }
    try {
      const response = await resend!.emails.send({ from: FROM, to: recipient, subject, html });
      if (response.error) {
        result = { success: false, error: response.error.message };
      } else {
        result = { success: true, id: response.data?.id };
      }
    } catch (err) {
      result = { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  // Append to notification log (fire-and-forget, never throws)
  try {
    const { appendNotificationLogEntry } = await import("@/lib/reference-json-persistence");
    appendNotificationLogEntry({
      log_id:            `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      sent_at:           new Date().toISOString(),
      notification_type: notificationType,
      to_email:          to,
      to_role:           toRole ?? "recruiter",
      referral_id:       referralId ?? null,
      subject,
      status:            DEV_MODE ? "dev_logged" : result.success ? "sent" : "failed",
      error_message:     result.error ?? null,
    });
  } catch {
    // Log append failure must never break the calling route
  }

  return result;
}

// ── Helper: build a deep link into the app ──────────────────────────────────

export function appUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
