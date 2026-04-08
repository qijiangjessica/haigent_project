/**
 * email-templates.ts
 *
 * Typed HTML email templates for every notification in the referral module.
 * Each function returns { subject, html } ready to pass to sendEmail().
 *
 * Design rules:
 *  - Inline styles only (email clients strip <style> blocks)
 *  - Brand colours: teal #0d9488 · green #16a34a · gold #ca8a04 · cyan #0891b2
 *  - Max width 600px, works in Gmail / Outlook / Apple Mail
 */

// ── Shared layout helpers ───────────────────────────────────────────────────

const BRAND_TEAL  = "#0d9488";
const BRAND_GREEN = "#16a34a";
const BRAND_GOLD  = "#ca8a04";
const BRAND_CYAN  = "#0891b2";
const TEXT_MAIN   = "#111827";
const TEXT_MUTED  = "#6b7280";
const BG_PAGE     = "#f9fafb";
const BG_CARD     = "#ffffff";
const BORDER      = "#e5e7eb";

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BG_PAGE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${TEXT_MAIN};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BG_CARD};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND_TEAL};padding:20px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">HaiGent Referrals</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${body}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid ${BORDER};background:#f3f4f6;">
            <p style="margin:0;font-size:11px;color:${TEXT_MUTED};">This is an automated message from the HaiGent Referral Platform. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string, color = TEXT_MAIN): string {
  return `<h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${color};">${text}</h1>`;
}

function subtext(text: string): string {
  return `<p style="margin:0 0 20px;font-size:14px;color:${TEXT_MUTED};line-height:1.5;">${text}</p>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${TEXT_MUTED};width:140px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:${TEXT_MAIN};font-weight:500;">${value}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">${rows}</table>`;
}

function badge(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;color:${color};background:${bg};">${text}</span>`;
}

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:${BRAND_TEAL};color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">${text}</a>`;
}

function classificationBadge(c: string): string {
  if (c === "Strong Match")  return badge(c, BRAND_GREEN, "#dcfce7");
  if (c === "Partial Match") return badge(c, BRAND_GOLD,  "#fef9c3");
  return badge(c, TEXT_MUTED, "#f3f4f6");
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BORDER};margin:20px 0;" />`;
}

// ── Template types ──────────────────────────────────────────────────────────

export interface TemplateResult {
  subject: string;
  html: string;
}

// ── 1. New referral — recruiter alert ───────────────────────────────────────

export interface NewReferralRecruiterData {
  referralId: string;
  referrerName: string;
  candidateName: string;
  candidateEmail: string;
  location: string;
  yearsExperience: number;
  skillsClaimed: string[];
  targetJobTitle: string;
  bestMatchScore: number | null;
  bestMatchClassification: string | null;
  isDuplicate: boolean;
  referralUrl: string;
}

export function newReferralRecruiter(d: NewReferralRecruiterData): TemplateResult {
  const subject = d.isDuplicate
    ? `[Duplicate] New referral: ${d.candidateName}`
    : `New referral submitted: ${d.candidateName}`;

  const body = `
    ${heading("New Referral Submitted")}
    ${subtext(`${d.referrerName} has referred a new candidate for your review.`)}
    ${d.isDuplicate ? `<p style="margin:0 0 16px;padding:10px 14px;background:#fef9c3;border-left:3px solid ${BRAND_GOLD};border-radius:4px;font-size:13px;color:${BRAND_GOLD};font-weight:500;">⚠️ This candidate appears to be a duplicate of an existing record.</p>` : ""}
    ${infoTable(
      infoRow("Referral ID",  d.referralId) +
      infoRow("Candidate",    d.candidateName) +
      infoRow("Email",        d.candidateEmail) +
      infoRow("Location",     d.location) +
      infoRow("Experience",   `${d.yearsExperience} years`) +
      infoRow("Skills",       d.skillsClaimed.length > 0 ? d.skillsClaimed.join(", ") : "—") +
      infoRow("Target Role",  d.targetJobTitle) +
      infoRow("Referred by",  d.referrerName)
    )}
    ${d.bestMatchScore !== null ? `
    ${divider()}
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${TEXT_MAIN};">Match Result</p>
    <p style="margin:0;font-size:13px;color:${TEXT_MUTED};">
      Best score: <strong style="color:${TEXT_MAIN};">${d.bestMatchScore}/100</strong>&nbsp;
      ${classificationBadge(d.bestMatchClassification ?? "")}
    </p>` : ""}
    ${ctaButton("View Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 2. Submission confirmation — referrer ───────────────────────────────────

export interface SubmissionConfirmationReferrerData {
  referrerName: string;
  candidateName: string;
  referralId: string;
  targetJobTitle: string;
  referralUrl: string;
}

export function submissionConfirmationReferrer(d: SubmissionConfirmationReferrerData): TemplateResult {
  const subject = `Your referral for ${d.candidateName} has been received`;

  const body = `
    ${heading("Referral Received!", BRAND_TEAL)}
    ${subtext(`Thank you, ${d.referrerName}! We've received your referral and our team will begin reviewing it shortly.`)}
    ${infoTable(
      infoRow("Referral ID",  d.referralId) +
      infoRow("Candidate",    d.candidateName) +
      infoRow("Role",         d.targetJobTitle)
    )}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      Our system will automatically match <strong>${d.candidateName}</strong> against open positions
      and you'll receive an update when the review is complete.
    </p>
    ${ctaButton("Track Your Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 3. Match result — referrer ──────────────────────────────────────────────

export interface MatchResultReferrerData {
  referrerName: string;
  candidateName: string;
  referralId: string;
  jobTitle: string;
  matchScore: number;
  classification: string;
  referralUrl: string;
}

export function matchResultReferrer(d: MatchResultReferrerData): TemplateResult {
  const subject = `Match found for your referral — ${d.candidateName} scored ${d.matchScore}/100`;

  const scoreColor = d.matchScore >= 70 ? BRAND_GREEN : d.matchScore >= 50 ? BRAND_GOLD : TEXT_MUTED;

  const body = `
    ${heading("Match Result Available")}
    ${subtext(`Good news! We've evaluated ${d.candidateName} against open positions.`)}
    ${infoTable(
      infoRow("Candidate",    d.candidateName) +
      infoRow("Role",         d.jobTitle) +
      infoRow("Match Score",  `<span style="font-size:18px;font-weight:700;color:${scoreColor};">${d.matchScore}/100</span>`) +
      infoRow("Result",       classificationBadge(d.classification))
    )}
    ${ctaButton("View Full Details", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 4. Match result — recruiter ─────────────────────────────────────────────

export interface MatchResultRecruiterData {
  candidateName: string;
  referralId: string;
  referrerName: string;
  matches: Array<{ jobTitle: string; score: number; classification: string }>;
  referralUrl: string;
}

export function matchResultRecruiter(d: MatchResultRecruiterData): TemplateResult {
  const strongCount = d.matches.filter((m) => m.classification === "Strong Match").length;
  const subject = strongCount > 0
    ? `Strong match found — ${d.candidateName} (${strongCount} role${strongCount > 1 ? "s" : ""})`
    : `Match results ready — ${d.candidateName}`;

  const matchRows = d.matches.map((m) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:${TEXT_MAIN};border-bottom:1px solid ${BORDER};">${m.jobTitle}</td>
      <td style="padding:8px 0;font-size:13px;color:${TEXT_MAIN};font-weight:600;border-bottom:1px solid ${BORDER};">${m.score}/100</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BORDER};">${classificationBadge(m.classification)}</td>
    </tr>`).join("");

  const body = `
    ${heading("Match Results Ready")}
    ${subtext(`${d.referrerName} referred <strong>${d.candidateName}</strong>. Here are the match scores across open roles:`)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">
      <tr>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Role</th>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Score</th>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Result</th>
      </tr>
      ${matchRows}
    </table>
    ${ctaButton("Review Candidate", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 5. Promoted to pool — referrer ──────────────────────────────────────────

export interface PromotedToPoolReferrerData {
  referrerName: string;
  candidateName: string;
  poolId: string;
  experienceLevel: string;
  referralUrl: string;
}

export function promotedToPoolReferrer(d: PromotedToPoolReferrerData): TemplateResult {
  const subject = `${d.candidateName} has been added to the talent pool`;

  const body = `
    ${heading("Added to Talent Pool", BRAND_TEAL)}
    ${subtext(`Great news, ${d.referrerName}! Your referred candidate has been promoted to our active talent pool.`)}
    ${infoTable(
      infoRow("Candidate",        d.candidateName) +
      infoRow("Pool ID",          d.poolId) +
      infoRow("Experience Level", d.experienceLevel)
    )}
    <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      ${d.candidateName} will now be automatically evaluated when new matching positions open up.
    </p>
    ${ctaButton("View Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 6. Promoted to pool — recruiter ─────────────────────────────────────────

export interface PromotedToPoolRecruiterData {
  candidateName: string;
  referralId: string;
  poolId: string;
  experienceLevel: string;
  skillTags: string[];
  promotedBy: string;
  referralUrl: string;
}

export function promotedToPoolRecruiter(d: PromotedToPoolRecruiterData): TemplateResult {
  const subject = `${d.candidateName} promoted to talent pool — ${d.poolId}`;

  const body = `
    ${heading("Talent Pool Update")}
    ${subtext(`${d.promotedBy} has promoted a candidate to the talent pool.`)}
    ${infoTable(
      infoRow("Candidate",    d.candidateName) +
      infoRow("Pool ID",      d.poolId) +
      infoRow("Level",        d.experienceLevel) +
      infoRow("Skills",       d.skillTags.length > 0 ? d.skillTags.join(", ") : "—") +
      infoRow("Promoted by",  d.promotedBy)
    )}
    ${ctaButton("View in Pool", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 7. Candidate referred — candidate notification ──────────────────────────

export interface CandidateReferredData {
  candidateName: string;
  referrerName: string;
  jobTitle: string;
  companyName: string;
}

export function candidateReferred(d: CandidateReferredData): TemplateResult {
  const subject = `You've been referred for a ${d.jobTitle} role at ${d.companyName}`;

  const body = `
    ${heading("You've Been Referred!", BRAND_TEAL)}
    ${subtext(`Hi ${d.candidateName}, ${d.referrerName} has referred you for an open position.`)}
    ${infoTable(
      infoRow("Role",         d.jobTitle) +
      infoRow("Company",      d.companyName) +
      infoRow("Referred by",  d.referrerName)
    )}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      Our recruiting team will be in touch if your profile is a good match.
      No action is required from you at this time.
    </p>
  `;

  return { subject, html: wrap(body) };
}

// ── 8. Rejection confirmation — recruiter ────────────────────────────────────

export interface RejectionConfirmationRecruiterData {
  candidateName: string;
  referralId: string;
  referrerName: string;
  reasonCode?: string;
  referralUrl: string;
}

export function rejectionConfirmationRecruiter(d: RejectionConfirmationRecruiterData): TemplateResult {
  const subject = `Referral closed — ${d.candidateName} marked Not Suitable`;

  const body = `
    ${heading("Referral Closed")}
    ${subtext(`The following referral has been marked as Not Suitable and removed from the active pipeline.`)}
    ${infoTable(
      infoRow("Referral ID",  d.referralId) +
      infoRow("Candidate",    d.candidateName) +
      infoRow("Referred by",  d.referrerName) +
      (d.reasonCode ? infoRow("Reason Code", d.reasonCode) : "")
    )}
    <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      No further action is required. The referrer will be notified separately.
    </p>
    ${ctaButton("View Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 9. Stale referral digest — recruiter ─────────────────────────────────────

export interface StaleReferralDigestData {
  staleReferrals: Array<{
    referralId: string;
    candidateName: string;
    referrerName: string;
    submittedAt: string;
    daysOld: number;
    referralUrl: string;
  }>;
}

export function staleReferralDigest(d: StaleReferralDigestData): TemplateResult {
  const count = d.staleReferrals.length;
  const subject = `[Weekly Digest] ${count} referral${count !== 1 ? "s" : ""} need${count === 1 ? "s" : ""} attention`;

  const rows = d.staleReferrals.map((r) => `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:${TEXT_MAIN};border-bottom:1px solid ${BORDER};">
        <a href="${r.referralUrl}" style="color:${BRAND_TEAL};text-decoration:none;font-weight:500;">${r.candidateName}</a>
      </td>
      <td style="padding:10px 0;font-size:13px;color:${TEXT_MUTED};border-bottom:1px solid ${BORDER};">${r.referrerName}</td>
      <td style="padding:10px 0;font-size:13px;color:${TEXT_MAIN};border-bottom:1px solid ${BORDER};">${r.submittedAt}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};">
        ${badge(`${r.daysOld}d`, "#b45309", "#fef3c7")}
      </td>
    </tr>`).join("");

  const body = `
    ${heading("Weekly Referral Digest", BRAND_GOLD)}
    ${subtext(`The following ${count} referral${count !== 1 ? "s are" : " is"} older than 14 days with no candidate contact recorded.`)}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">
      <tr>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Candidate</th>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Referred by</th>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Submitted</th>
        <th style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:${TEXT_MUTED};text-align:left;border-bottom:2px solid ${BORDER};">Age</th>
      </tr>
      ${rows}
    </table>
    <p style="margin:16px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      Please review these referrals and initiate contact or update their status.
    </p>
  `;

  return { subject, html: wrap(body) };
}

// ── 10. Candidate promoted to pool — candidate notification ──────────────────

export interface CandidatePromotedToPoolData {
  candidateName: string;
  referrerName: string;
  experienceLevel: string;
}

export function candidatePromotedToPool(d: CandidatePromotedToPoolData): TemplateResult {
  const subject = `You've been added to our active talent pipeline`;

  const body = `
    ${heading("You're In Our Talent Pipeline!", BRAND_TEAL)}
    ${subtext(`Hi ${d.candidateName}, great news from our recruiting team.`)}
    <p style="margin:0 0 16px;font-size:14px;color:${TEXT_MAIN};line-height:1.6;">
      Thanks to a referral from <strong>${d.referrerName}</strong>, you've been added to our
      active talent pool as a <strong>${d.experienceLevel}</strong>-level candidate.
      Our team will reach out when a matching role becomes available.
    </p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.6;">
      No action is required from you. We'll be in touch when the right opportunity arises.
    </p>
  `;

  return { subject, html: wrap(body) };
}

// ── 11. Candidate contacted — referrer notification ──────────────────────────

export interface CandidateContactedReferrerData {
  referrerName: string;
  candidateName: string;
  referralId: string;
  jobTitle: string;
  contactMethod: string;
  referralUrl: string;
}

export function candidateContactedReferrer(d: CandidateContactedReferrerData): TemplateResult {
  const subject = `Update: a recruiter has reached out to ${d.candidateName}`;

  const body = `
    ${heading("Recruiter Outreach Update", BRAND_CYAN)}
    ${subtext(`Hi ${d.referrerName}, we have an update on your referral.`)}
    <p style="margin:0 0 16px;font-size:14px;color:${TEXT_MAIN};line-height:1.6;">
      A recruiter has reached out to <strong>${d.candidateName}</strong> regarding the
      <strong>${d.jobTitle}</strong> position. We'll keep you posted as things progress.
    </p>
    ${infoTable(
      infoRow("Candidate",       d.candidateName) +
      infoRow("Referral ID",     d.referralId) +
      infoRow("Role",            d.jobTitle) +
      infoRow("Contact method",  d.contactMethod)
    )}
    ${ctaButton("View Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 11. Candidate hired — referrer notification ───────────────────────────────

export interface CandidateHiredReferrerData {
  referrerName: string;
  candidateName: string;
  referralId: string;
  referralUrl: string;
}

export function candidateHiredReferrer(d: CandidateHiredReferrerData): TemplateResult {
  const subject = `Congratulations — ${d.candidateName} has been hired!`;

  const body = `
    ${heading("Great News — Hire Confirmed!", BRAND_GREEN)}
    ${subtext(`Hi ${d.referrerName}, we have fantastic news about your referral.`)}
    <p style="margin:0 0 16px;font-size:14px;color:${TEXT_MAIN};line-height:1.6;">
      <strong>${d.candidateName}</strong> has been officially hired! Your referral made a real
      difference — thank you for helping us find great talent.
    </p>
    <p style="margin:0 0 20px;padding:14px 16px;background:#dcfce7;border-left:3px solid ${BRAND_GREEN};border-radius:4px;font-size:13px;color:#166534;font-weight:500;">
      Our HR team will be in touch shortly to initiate the referral bonus process.
    </p>
    ${infoTable(
      infoRow("Candidate",   d.candidateName) +
      infoRow("Referral ID", d.referralId)
    )}
    ${ctaButton("View Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 12. Score improved — recruiter notification ───────────────────────────────

export interface ScoreImprovedRecruiterData {
  candidateName: string;
  referralId: string;
  referrerName: string;
  jobTitle: string;
  previousClassification: string;
  newClassification: string;
  newScore: number;
  referralUrl: string;
}

export function scoreImprovedRecruiter(d: ScoreImprovedRecruiterData): TemplateResult {
  const subject = `Score improved — ${d.candidateName}: ${d.previousClassification} → ${d.newClassification}`;

  const body = `
    ${heading("Candidate Score Improved", BRAND_GREEN)}
    ${subtext(`A re-score has improved the match classification for one of your referrals.`)}
    ${infoTable(
      infoRow("Candidate",   d.candidateName) +
      infoRow("Referral ID", d.referralId) +
      infoRow("Referred by", d.referrerName) +
      infoRow("Role",        d.jobTitle) +
      infoRow("Previous",    badge(d.previousClassification, TEXT_MUTED, "#f3f4f6")) +
      infoRow("New result",  `${badge(d.newClassification, BRAND_GREEN, "#dcfce7")} &nbsp; <strong>${d.newScore}/100</strong>`)
    )}
    ${ctaButton("Review Candidate", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}

// ── 13. Status change — referrer notification ─────────────────────────────────

export interface StatusChangeReferrerData {
  referrerName: string;
  candidateName: string;
  referralId: string;
  decision: "PROCEED" | "ON_HOLD" | "NOT_SUITABLE";
  reasonCode?: string;
  referralUrl: string;
}

const DECISION_COPY: Record<string, { headline: string; detail: string; color: string }> = {
  PROCEED: {
    headline: "Moving Forward",
    detail:   "Great news — the recruiter has decided to proceed with your referred candidate.",
    color:    BRAND_GREEN,
  },
  ON_HOLD: {
    headline: "On Hold",
    detail:   "Your referred candidate has been placed on hold. They may be considered for future opportunities.",
    color:    BRAND_GOLD,
  },
  NOT_SUITABLE: {
    headline: "Not Moving Forward",
    detail:   "After review, the recruiter has determined that this candidate is not suitable for current open positions.",
    color:    TEXT_MUTED,
  },
};

export function statusChangeReferrer(d: StatusChangeReferrerData): TemplateResult {
  const copy = DECISION_COPY[d.decision] ?? DECISION_COPY.ON_HOLD;
  const subject = `Update on your referral — ${d.candidateName}: ${copy.headline}`;

  const body = `
    ${heading(`Referral Update: ${copy.headline}`, copy.color)}
    ${subtext(`Hi ${d.referrerName}, here's the latest on your referral for ${d.candidateName}.`)}
    <p style="margin:0 0 16px;font-size:14px;color:${TEXT_MAIN};line-height:1.6;">${copy.detail}</p>
    ${infoTable(
      infoRow("Candidate",  d.candidateName) +
      infoRow("Referral",   d.referralId) +
      infoRow("Status",     badge(copy.headline, copy.color, copy.color + "1a")) +
      (d.reasonCode ? infoRow("Reason", d.reasonCode) : "")
    )}
    ${ctaButton("View Referral", d.referralUrl)}
  `;

  return { subject, html: wrap(body) };
}
