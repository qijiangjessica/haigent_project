"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Clock, XCircle,
  ExternalLink, FileText, User, Building2,
  MapPin, Calendar, Briefcase, TrendingUp,
} from "lucide-react";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { AUDIT_LOG } from "@/data/reference/audit-log";
import { REFERENCE_JOBS } from "@/data/reference/jobs";
import type { MatchRecord, ReferenceCandidate } from "@/types";
import type { ReferenceJob } from "@/data/reference/jobs";

// ─── Status helpers ───────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  pending_validation: "Pending",
  verification_in_progress: "Verifying",
  matched: "Matched",
  in_pool: "In Pool",
  hired: "Hired",
  closed: "Closed",
};
const STATUS_COLORS: Record<string, string> = {
  pending_validation: "bg-muted text-muted-foreground",
  verification_in_progress: "bg-brand-gold/10 text-brand-gold",
  matched: "bg-brand-cyan/10 text-brand-cyan",
  in_pool: "bg-brand-teal/10 text-brand-teal",
  hired: "bg-brand-green/10 text-brand-green",
  closed: "bg-muted text-muted-foreground",
};
const SKILL_COLORS: Record<string, string> = {
  Verified: "bg-brand-green/10 text-brand-green",
  "Partially Verified": "bg-brand-gold/10 text-brand-gold",
  Unverified: "bg-muted text-muted-foreground",
};
const SKILL_ICONS: Record<string, string> = {
  Verified: "✓",
  "Partially Verified": "~",
  Unverified: "○",
};
const OUTCOME_LABELS: Record<string, string> = {
  pending_recruiter: "Pending Decision",
  interview_scheduled: "Interview Scheduled",
  rejected: "Rejected",
  hired: "Hired",
};
const REASON_CODES: Record<string, string> = {
  SKILLS_GAP: "Skills Gap",
  OVERQUALIFIED: "Overqualified",
  LOCATION_MISMATCH: "Location Mismatch",
  SALARY_MISMATCH: "Salary Mismatch",
  POSITION_FILLED: "Position Filled",
  CANDIDATE_WITHDREW: "Candidate Withdrew",
  OTHER: "Other",
};

// ─── Score explanation generator ─────────────────────────────────
function getScoreExplanations(
  match: MatchRecord,
  candidate: ReferenceCandidate,
  job: ReferenceJob | undefined
) {
  const jobSkills = job?.requiredSkills ?? [];
  const verifiedSkills = candidate.skills_verified
    .filter((s) => s.status === "Verified")
    .map((s) => s.skill.toLowerCase());
  const partialSkills = candidate.skills_verified
    .filter((s) => s.status === "Partially Verified")
    .map((s) => s.skill.toLowerCase());

  const matchedFull = jobSkills.filter((s) => verifiedSkills.includes(s.toLowerCase()));
  const matchedPartial = jobSkills.filter((s) => partialSkills.includes(s.toLowerCase()));
  const missing = jobSkills.filter(
    (s) => !verifiedSkills.includes(s.toLowerCase()) && !partialSkills.includes(s.toLowerCase())
  );

  const skillExplanation = [
    `${matchedFull.length} of ${jobSkills.length} required skills fully verified`,
    matchedPartial.length > 0 ? `${matchedPartial.length} partially verified (${matchedPartial.join(", ")})` : null,
    missing.length > 0 ? `Missing: ${missing.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const expExplanation = job
    ? candidate.years_experience >= job.experienceMin && candidate.years_experience <= job.experienceMax
      ? `${candidate.years_experience} yrs — exactly within required range (${job.experienceMin}–${job.experienceMax} yrs)`
      : candidate.years_experience > job.experienceMax
        ? `${candidate.years_experience} yrs — above required range (${job.experienceMin}–${job.experienceMax} yrs), may be overqualified`
        : `${candidate.years_experience} yrs — below required minimum of ${job.experienceMin} yrs`
    : `${candidate.years_experience} years of experience`;

  const locExplanation =
    match.location_score === 100
      ? `${candidate.location} — exact location match with job`
      : match.location_score >= 70
        ? `${candidate.location} — near job location, remote-eligible`
        : `${candidate.location} — different region from job location`;

  const seniorityExplanation =
    match.seniority_score >= 85
      ? "Experience level is a strong fit for the role's seniority expectations"
      : match.seniority_score >= 65
        ? "Experience level partially meets the role's seniority expectations"
        : "Experience level is below the role's seniority expectations";

  return {
    skill_overlap: skillExplanation,
    experience: expExplanation,
    location: locExplanation,
    seniority: seniorityExplanation,
  };
}

// ─── Score bar component ──────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-brand-green" : score >= 60 ? "bg-brand-gold" : "bg-red-400";
  return (
    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const backHref = from === "pool" ? "/reference/pool" : "/reference/candidates";
  const backLabel = from === "pool" ? "Back to Talent Pool" : "Back to Candidates";

  const [decision, setDecision] = useState<"PROCEED" | "ON_HOLD" | "NOT_SUITABLE" | null>(null);
  const [reasonCode, setReasonCode] = useState("");

  const candidate = REFERENCE_CANDIDATES.find((c) => c.candidate_id === id);
  if (!candidate) {
    return (
      <div className="space-y-6">
        <Link href={backHref} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <div className="bg-white rounded-xl border border-border shadow-sm p-10 text-center">
          <p className="text-muted-foreground">Candidate not found.</p>
        </div>
      </div>
    );
  }

  const ref = REFERENCES.find((r) => r.reference_id === candidate.reference_id);
  const matches = MATCH_RECORDS.filter((m) => m.candidate_id === candidate.candidate_id)
    .sort((a, b) => b.match_score - a.match_score);
  const auditEvents = AUDIT_LOG.filter(
    (e) => e.entity_id === id || e.notes?.includes(id)
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-brand-teal" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{candidate.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[candidate.pool_status] ?? "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[candidate.pool_status] ?? candidate.pool_status}
                </span>
                {candidate.availability && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
                    {candidate.availability}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{candidate.candidate_id}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-foreground">{candidate.candidate_score}</div>
            <div className="text-sm text-muted-foreground">Overall Score / 100</div>
          </div>
        </div>

        {/* Quick info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
          {[
            { icon: Building2, label: "Employer", value: candidate.current_employer },
            { icon: Briefcase, label: "Experience", value: `${candidate.years_experience} years` },
            { icon: MapPin, label: "Location", value: candidate.location },
            { icon: Calendar, label: "Reference ID", value: candidate.reference_id },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                <Icon className="h-3 w-3" /> {label}
              </p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Contact + links */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm">
          <span className="text-muted-foreground">{candidate.email}</span>
          <span className="text-muted-foreground">{candidate.phone}</span>
          {candidate.linkedin_url && (
            <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-brand-teal hover:underline">
              LinkedIn <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {candidate.resume_uploaded && (
            <span className="flex items-center gap-1 text-brand-green">
              <FileText className="h-3.5 w-3.5" /> Resume uploaded
            </span>
          )}
        </div>
      </div>

      {/* Score Analysis per match */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-teal" />
            Score Analysis
          </h2>
          {matches.map((match) => {
            const job = REFERENCE_JOBS.find((j) => j.id === match.posting_id);
            const explanations = getScoreExplanations(match, candidate, job);
            const components = [
              { label: "Skill Overlap", score: match.skill_overlap_score, weight: 0.50, explanation: explanations.skill_overlap },
              { label: "Experience", score: match.experience_score, weight: 0.25, explanation: explanations.experience },
              { label: "Location", score: match.location_score, weight: 0.15, explanation: explanations.location },
              { label: "Seniority", score: match.seniority_score, weight: 0.10, explanation: explanations.seniority },
            ];
            const computed = components.reduce((sum, c) => sum + c.score * c.weight, 0);

            return (
              <div key={match.match_id} className="bg-white rounded-xl border border-border shadow-sm p-5">
                {/* Match header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{job?.title ?? match.posting_id}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job?.companyName} · {job?.department} · Evaluated {match.evaluated_date}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      match.classification === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                        : match.classification === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {match.classification}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {OUTCOME_LABELS[match.outcome] ?? match.outcome}
                    </span>
                  </div>
                </div>

                {/* Formula banner */}
                <div className="bg-muted rounded-lg px-4 py-2.5 mb-4 text-xs text-muted-foreground font-mono">
                  Score = (skill_overlap × 0.50) + (experience × 0.25) + (location × 0.15) + (seniority × 0.10)
                  <span className="ml-3 font-semibold text-foreground">
                    = ({match.skill_overlap_score}×0.50) + ({match.experience_score}×0.25) + ({match.location_score}×0.15) + ({match.seniority_score}×0.10)
                    = <span className="text-brand-teal">{computed.toFixed(1)}</span>
                  </span>
                </div>

                {/* Component breakdown */}
                <div className="space-y-4">
                  {components.map((c) => (
                    <div key={c.label}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-medium text-foreground w-28 flex-shrink-0">{c.label}</span>
                        <ScoreBar score={c.score} />
                        <span className="text-sm font-bold text-foreground w-8 text-right flex-shrink-0">{c.score}</span>
                        <span className="text-xs text-muted-foreground w-24 flex-shrink-0 text-right">
                          ×{c.weight.toFixed(2)} = <strong className="text-foreground">{(c.score * c.weight).toFixed(1)}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-28 pl-3 leading-relaxed">{c.explanation}</p>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Threshold: ≥70 Strong Match · 50–69 Partial Match · &lt;50 No Match
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Final Score</span>
                    <span className={`text-lg font-bold ${
                      match.match_score >= 70 ? "text-brand-green"
                        : match.match_score >= 50 ? "text-brand-gold"
                          : "text-red-500"
                    }`}>
                      {match.match_score}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Analysis */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <h2 className="font-semibold text-sm text-foreground mb-4">Skill Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="pb-2 text-xs font-medium text-muted-foreground">Skill</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Claimed</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Verification</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidate.skills_verified.map((sv) => (
                <tr key={sv.skill}>
                  <td className="py-2.5 font-medium text-foreground">{sv.skill}</td>
                  <td className="py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      Claimed
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${SKILL_COLORS[sv.status] ?? "bg-muted text-muted-foreground"}`}>
                      {SKILL_ICONS[sv.status]} {sv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-xs text-muted-foreground">
                    {sv.source ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referrer */}
      {ref && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-semibold text-sm text-foreground mb-3">Referral Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Referred by</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ref.referrer_name}</p>
              <p className="text-xs text-muted-foreground">{ref.referrer_emp_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submission Date</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ref.submission_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reference ID</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{ref.reference_id}</p>
            </div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Referrer's Note</p>
            <p className="text-sm text-foreground italic">"{ref.referrer_note}"</p>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {auditEvents.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-semibold text-sm text-foreground mb-4">Audit Trail</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {auditEvents.map((event) => (
                <div key={event.event_id} className="flex gap-4 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold ${
                    event.event_type === "Submission" ? "bg-brand-teal/10 text-brand-teal"
                      : event.event_type === "Verification" ? "bg-brand-gold/10 text-brand-gold"
                        : event.event_type === "Match" ? "bg-brand-green/10 text-brand-green"
                          : event.event_type === "Decision" ? "bg-brand-cyan/10 text-brand-cyan"
                            : "bg-muted text-muted-foreground"
                  }`}>
                    {event.event_type[0]}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{event.event_type}</span>
                      <span className="text-xs text-muted-foreground">by {event.actor}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(event.timestamp).toLocaleString("en-CA", { hour12: false })}
                      </span>
                    </div>
                    {event.before_state && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.before_state} → <strong className="text-foreground">{event.after_state}</strong>
                      </p>
                    )}
                    {event.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Decision */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <h2 className="font-semibold text-sm text-foreground mb-3">Recruiter Decision</h2>
        <div className="flex flex-wrap gap-2">
          {(["PROCEED", "ON_HOLD", "NOT_SUITABLE"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDecision(decision === d ? null : d)}
              className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium border transition-colors ${
                decision === d
                  ? d === "PROCEED" ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                      : d === "ON_HOLD" ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
                        : "bg-red-100 text-red-600 border-red-200"
                  : "bg-white text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {d === "PROCEED" ? <CheckCircle2 className="h-3.5 w-3.5" />
                : d === "ON_HOLD" ? <Clock className="h-3.5 w-3.5" />
                  : <XCircle className="h-3.5 w-3.5" />}
              {d === "PROCEED" ? "Proceed to Interview"
                : d === "ON_HOLD" ? "Put On Hold"
                  : "Not Suitable"}
            </button>
          ))}
        </div>

        {decision === "NOT_SUITABLE" && (
          <div className="mt-3">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              <option value="">Select reason…</option>
              {Object.entries(REASON_CODES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {decision && decision !== "NOT_SUITABLE" && (
          <p className="mt-3 text-xs text-muted-foreground">
            {decision === "PROCEED"
              ? "✓ Candidate will be moved to interview scheduling."
              : "✓ Candidate placed on hold — no status change."}
          </p>
        )}
        {decision === "NOT_SUITABLE" && reasonCode && (
          <p className="mt-2 text-xs text-muted-foreground">
            ✓ Marked not suitable · {REASON_CODES[reasonCode]}
          </p>
        )}
      </div>
    </div>
  );
}
