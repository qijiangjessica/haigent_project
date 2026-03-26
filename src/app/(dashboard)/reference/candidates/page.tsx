"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { Search, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Download } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";
import { AUDIT_LOG } from "@/data/reference/audit-log";
import { REFERENCE_JOBS } from "@/data/reference/jobs";

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

const REASON_CODES = [
  { value: "SKILLS_GAP", label: "Skills Gap" },
  { value: "OVERQUALIFIED", label: "Overqualified" },
  { value: "LOCATION_MISMATCH", label: "Location Mismatch" },
  { value: "SALARY_MISMATCH", label: "Salary Mismatch" },
  { value: "POSITION_FILLED", label: "Position Filled" },
  { value: "CANDIDATE_WITHDREW", label: "Candidate Withdrew" },
  { value: "OTHER", label: "Other" },
];

type DecisionValue = "PROCEED" | "ON_HOLD" | "NOT_SUITABLE" | null;

interface CandidateDecision {
  decision: DecisionValue;
  reasonCode: string;
}

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({});

  // Load persisted decisions on mount
  useEffect(() => {
    fetch("/api/reference/decisions")
      .then((r) => r.json())
      .then((data: { decisions: Array<{ candidate_id: string; decision: string; reason_code: string }> }) => {
        const loaded: Record<string, CandidateDecision> = {};
        for (const d of data.decisions) {
          loaded[d.candidate_id] = {
            decision: d.decision as DecisionValue,
            reasonCode: d.reason_code,
          };
        }
        setDecisions(loaded);
      })
      .catch(() => { /* silently fail — decisions start empty */ });
  }, []);

  function exportCandidatesCsv() {
    const headers = ["ID", "Name", "Email", "Phone", "Employer", "Years Exp", "Location", "Availability", "Score", "Status", "Skills Claimed", "Resume"];
    const rows = REFERENCE_CANDIDATES.map((c) => [
      c.candidate_id, c.name, c.email, c.phone, c.current_employer,
      c.years_experience, c.location, c.availability ?? "",
      c.candidate_score, c.pool_status,
      c.skills_claimed.join("; "), c.resume_uploaded ? "Yes" : "No",
    ]);
    downloadCsv("candidates.csv", toCsv(headers, rows));
  }

  function exportAuditCsv() {
    const headers = ["Event ID", "Timestamp", "Actor", "Actor ID", "Event Type", "Entity Type", "Entity ID", "Before State", "After State", "Notes"];
    const rows = AUDIT_LOG.map((e) => [
      e.event_id, e.timestamp, e.actor, e.actor_id, e.event_type,
      e.entity_type, e.entity_id, e.before_state ?? "", e.after_state, e.notes ?? "",
    ]);
    downloadCsv("audit-log.csv", toCsv(headers, rows));
  }

  const bestMatchByCandidate = useMemo(() => {
    const map: Record<string, (typeof MATCH_RECORDS)[0]> = {};
    for (const m of MATCH_RECORDS) {
      const existing = map[m.candidate_id];
      if (!existing || m.match_score > existing.match_score) {
        map[m.candidate_id] = m;
      }
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return REFERENCE_CANDIDATES.filter((c) => {
      if (q) {
        const matchesText =
          c.name.toLowerCase().includes(q) ||
          c.current_employer.toLowerCase().includes(q) ||
          c.skills_verified.some((s) => s.skill.toLowerCase().includes(q));
        if (!matchesText) return false;
      }
      if (statusFilter !== "all" && c.pool_status !== statusFilter) return false;
      if (matchFilter !== "all") {
        const best = bestMatchByCandidate[c.candidate_id];
        if (!best || best.classification !== matchFilter) return false;
      }
      return true;
    });
  }, [search, statusFilter, matchFilter, bestMatchByCandidate]);

  function toggleScore(id: string) {
    setExpandedScores((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function persistDecision(candidateId: string, decision: DecisionValue, reasonCode: string) {
    if (!decision) return;
    fetch("/api/reference/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, decision, reason_code: reasonCode }),
    }).catch(() => { /* silently fail */ });
  }

  function setDecision(candidateId: string, decision: DecisionValue) {
    const reasonCode = decisions[candidateId]?.reasonCode ?? "";
    setDecisions((prev) => ({
      ...prev,
      [candidateId]: { decision, reasonCode: prev[candidateId]?.reasonCode ?? "" },
    }));
    persistDecision(candidateId, decision, reasonCode);
  }

  function setReasonCode(candidateId: string, reasonCode: string) {
    const currentDecision = decisions[candidateId]?.decision ?? null;
    setDecisions((prev) => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], reasonCode },
    }));
    persistDecision(candidateId, currentDecision, reasonCode);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Referred Candidates"
        description="All candidates submitted through the employee referral program"
        actionLabel="Submit Referral"
        actionHref="/reference/submit"
      />

      {/* Export buttons */}
      <div className="flex gap-2 justify-end -mt-2">
        <button
          onClick={exportCandidatesCsv}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Candidates
        </button>
        <button
          onClick={exportAuditCsv}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Audit Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, employer, or skill…"
            className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={matchFilter}
          onChange={(e) => setMatchFilter(e.target.value)}
          className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        >
          <option value="all">All Matches</option>
          <option value="Strong Match">Strong Match</option>
          <option value="Partial Match">Partial Match</option>
          <option value="No Match">No Match</option>
        </select>
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground -mt-2">
        Showing {filtered.length} of {REFERENCE_CANDIDATES.length} candidates
      </p>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-10 text-center">
          <p className="text-muted-foreground text-sm">No candidates match your filters.</p>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((candidate) => {
          const ref = REFERENCES.find((r) => r.reference_id === candidate.reference_id);
          const matches = MATCH_RECORDS.filter((m) => m.candidate_id === candidate.candidate_id);
          const bestMatch = bestMatchByCandidate[candidate.candidate_id];
          const scoreExpanded = expandedScores.has(candidate.candidate_id);
          const dec = decisions[candidate.candidate_id] ?? { decision: null, reasonCode: "" };

          return (
            <div
              key={candidate.candidate_id}
              className="bg-white rounded-xl border border-border shadow-sm p-5"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/reference/candidates/${candidate.candidate_id}`}
                      className="font-semibold text-foreground hover:text-brand-teal hover:underline"
                    >
                      {candidate.name}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[candidate.pool_status] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABELS[candidate.pool_status] ?? candidate.pool_status}
                    </span>
                    {"availability" in candidate && (candidate as { availability?: string }).availability && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
                        {(candidate as { availability?: string }).availability}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {candidate.current_employer} · {candidate.years_experience} years exp · {candidate.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {candidate.email} · {candidate.phone}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">{candidate.candidate_score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  {bestMatch && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      bestMatch.classification === "Strong Match"
                        ? "bg-brand-green/10 text-brand-green"
                        : bestMatch.classification === "Partial Match"
                          ? "bg-brand-gold/10 text-brand-gold"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {bestMatch.classification}
                    </span>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skill Verification</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills_verified.map((sv) => (
                    <span
                      key={sv.skill}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium ${SKILL_COLORS[sv.status] ?? "bg-muted text-muted-foreground"}`}
                      title={sv.source ? `Source: ${sv.source}` : "No source"}
                    >
                      {SKILL_ICONS[sv.status]} {sv.skill}
                      {sv.source && <span className="opacity-60 ml-1">· {sv.source}</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Match results + score breakdown */}
              {matches.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Job Matches</p>
                    <button
                      onClick={() => toggleScore(candidate.candidate_id)}
                      className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                    >
                      Score breakdown
                      {scoreExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matches.map((m) => (
                      <div key={m.match_id} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-3 py-1.5">
                        <span className="text-muted-foreground">
                          {REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id}
                        </span>
                        <span className="font-semibold text-foreground">{m.match_score}</span>
                        <span className={
                          m.classification === "Strong Match" ? "text-brand-green"
                            : m.classification === "Partial Match" ? "text-brand-gold"
                              : "text-muted-foreground"
                        }>· {m.classification}</span>
                      </div>
                    ))}
                  </div>

                  {/* Score breakdown panel — one card per match */}
                  {scoreExpanded && (
                    <div className="mt-3 space-y-2">
                      {matches.map((m) => (
                        <div key={m.match_id} className="bg-muted rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-foreground">
                              {REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              m.classification === "Strong Match"
                                ? "bg-brand-green/10 text-brand-green"
                                : m.classification === "Partial Match"
                                  ? "bg-brand-gold/10 text-brand-gold"
                                  : "bg-muted text-muted-foreground"
                            }`}>
                              {m.match_score} · {m.classification}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: "Skill Overlap", value: m.skill_overlap_score, weight: "50%" },
                              { label: "Experience", value: m.experience_score, weight: "25%" },
                              { label: "Location", value: m.location_score, weight: "15%" },
                              { label: "Seniority", value: m.seniority_score, weight: "10%" },
                            ].map((item) => (
                              <div key={item.label} className="text-center">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-lg font-bold text-foreground">{item.value}</p>
                                <p className="text-xs text-muted-foreground">weight {item.weight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Referrer note */}
              {ref && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Referred by {ref.referrer_name} · {ref.submission_date}
                  </p>
                  <p className="text-xs text-muted-foreground italic">"{ref.referrer_note}"</p>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-3 mt-3 pt-3 border-t border-border items-center">
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-teal hover:underline">
                    LinkedIn ↗
                  </a>
                )}
                {candidate.resume_uploaded
                  ? <span className="text-xs text-brand-green">✓ Resume uploaded</span>
                  : <span className="text-xs text-muted-foreground">No resume</span>
                }
                <Link
                  href={`/reference/candidates/${candidate.candidate_id}`}
                  className="ml-auto text-xs text-brand-teal font-medium hover:underline"
                >
                  View full profile →
                </Link>
              </div>

              {/* Recruiter Decision */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recruiter Decision</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDecision(candidate.candidate_id, dec.decision === "PROCEED" ? null : "PROCEED")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                      dec.decision === "PROCEED"
                        ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                        : "bg-white text-muted-foreground border-border hover:border-brand-green/40 hover:text-brand-green"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Proceed
                  </button>
                  <button
                    onClick={() => setDecision(candidate.candidate_id, dec.decision === "ON_HOLD" ? null : "ON_HOLD")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                      dec.decision === "ON_HOLD"
                        ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
                        : "bg-white text-muted-foreground border-border hover:border-brand-gold/40 hover:text-brand-gold"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    On Hold
                  </button>
                  <button
                    onClick={() => setDecision(candidate.candidate_id, dec.decision === "NOT_SUITABLE" ? null : "NOT_SUITABLE")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                      dec.decision === "NOT_SUITABLE"
                        ? "bg-red-100 text-red-600 border-red-200"
                        : "bg-white text-muted-foreground border-border hover:border-red-200 hover:text-red-500"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Not Suitable
                  </button>
                </div>

                {/* Reason code — only shown for Not Suitable */}
                {dec.decision === "NOT_SUITABLE" && (
                  <div className="mt-2">
                    <select
                      value={dec.reasonCode}
                      onChange={(e) => setReasonCode(candidate.candidate_id, e.target.value)}
                      className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <option value="">Select reason…</option>
                      {REASON_CODES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Confirmation feedback */}
                {dec.decision && dec.decision !== "NOT_SUITABLE" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {dec.decision === "PROCEED"
                      ? "✓ Marked to proceed — candidate will be moved to interview scheduling."
                      : "✓ Placed on hold — candidate will remain in current status."}
                  </p>
                )}
                {dec.decision === "NOT_SUITABLE" && dec.reasonCode && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    ✓ Marked not suitable · {REASON_CODES.find((r) => r.value === dec.reasonCode)?.label}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
