/**
 * email.ts
 *
 * Central mailer utility for the HaiGent platform.
 *
 * Transport: Microsoft 365 SMTP (smtp.office365.com:587, STARTTLS)
 *
 * Behaviour:
 *  - If SMTP_USER / SMTP_PASSWORD are missing, logs the email to the
 *    console instead of sending it (safe for local development).
 *  - DEV_RECIPIENT_OVERRIDE redirects all emails to one address for testing.
 *  - Every send attempt — success or failure — is appended to the
 *    notification log via appendNotificationLogEntry().
 */

import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// ── Config ──────────────────────────────────────────────────────────────────────

const SMTP_HOST     = process.env.SMTP_HOST     ?? "smtp.office365.com";
const SMTP_PORT     = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER     = process.env.SMTP_USER     ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const FROM          = process.env.EMAIL_FROM    ?? SMTP_USER;
const BASE_URL      = process.env.APP_BASE_URL  ?? "http://localhost:3000";
const DEV_RECIPIENT = process.env.DEV_RECIPIENT_OVERRIDE ?? null;

// A5: Mailpit (local SMTP catcher) support
// Set MAILPIT_HOST / MAILPIT_PORT to redirect all mail to Mailpit in development.
// e.g. MAILPIT_HOST=localhost MAILPIT_PORT=1025
const MAILPIT_HOST = process.env.MAILPIT_HOST ?? null;
const MAILPIT_PORT = MAILPIT_HOST ? parseInt(process.env.MAILPIT_PORT ?? "1025", 10) : null;

export const DEV_MODE = !SMTP_USER || !SMTP_PASSWORD;

// Lazy singleton — reset when transport config changes
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  if (MAILPIT_HOST && MAILPIT_PORT) {
    // A5: Route through Mailpit for local dev — no auth required
    _transporter = nodemailer.createTransport({
      host: MAILPIT_HOST,
      port: MAILPIT_PORT,
      secure: false,
      ignoreTLS: true,
    });
  } else {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,        // STARTTLS on 587
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      tls: { ciphers: "SSLv3", rejectUnauthorized: true },
    });
  }
  return _transporter;
}

// ── A4: Notification preferences ────────────────────────────────────────────────

const PREFS_FILE = path.join(process.cwd(), "src", "data", "reference", "notification-prefs.json");

function isNotificationEnabled(type: string): boolean {
  try {
    const raw = fs.readFileSync(PREFS_FILE, "utf-8");
    const prefs = JSON.parse(raw) as Record<string, boolean>;
    return prefs[type] !== false; // default to enabled if key is missing
  } catch {
    return true; // if file can't be read, send anyway
  }
}

// ── Types ───────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_referral_recruiter"
  | "submission_confirmation_referrer"
  | "match_result_referrer"
  | "match_result_recruiter"
  | "promoted_to_pool_referrer"
  | "promoted_to_pool_recruiter"
  | "candidate_referred"
  | "status_change_referrer"
  | "rejection_confirmation_recruiter"
  | "stale_referral_digest"
  | "candidate_contacted_referrer"
  | "candidate_hired_referrer"
  | "candidate_promoted_to_pool"
  | "score_improved_recruiter";

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

// ── Core send function ──────────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, notificationType, referralId, toRole } = options;

  // A4: Check notification preferences — skip silently if disabled
  if (!isNotificationEnabled(notificationType)) {
    console.log(`[email] Suppressed (prefs disabled): ${notificationType} → ${to}`);
    return { success: true, id: "suppressed" };
  }

  let result: SendEmailResult;

  if (DEV_MODE && !MAILPIT_HOST) {
    // No real SMTP credentials and no Mailpit — just log
    console.log(`\n[email] DEV MODE — not sent (set SMTP creds or MAILPIT_HOST to send):`);
    console.log(`   Type    : ${notificationType}`);
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Referral: ${referralId ?? "—"}`);
    console.log("");
    result = { success: true, id: `dev-${Date.now()}` };
  } else {
    const recipient = DEV_RECIPIENT ?? to;
    if (DEV_RECIPIENT) {
      console.log(`[email] DEV_RECIPIENT_OVERRIDE active — redirecting "${to}" → "${DEV_RECIPIENT}" (${notificationType})`);
    }
    try {
      const info = await getTransporter().sendMail({
        from: FROM,
        to: recipient,
        subject,
        html,
      });
      result = { success: true, id: info.messageId };
    } catch (err) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
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

// ── Helper: build a deep link into the app ──────────────────────────────────────

export function appUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
