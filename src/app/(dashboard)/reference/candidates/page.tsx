"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { Search, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Download, Settings, TrendingUp, Package, Loader2, AlertTriangle } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";
import { AUDIT_LOG } from "@/data/reference/audit-log";
import { REFERENCE_JOBS } from "@/data/reference/jobs";

interface SubmittedReferral {
  referral_id: string;
  submitted_at: string;
  referrer_name: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  current_employer: string;
  years_experience: number;
  location: string;
  availability: string;
  linkedin_url: string;
  target_job_id: string;
  referrer_note: string;
  resume_filename: string | null;
  is_duplicate: boolean;
  duplicate_candidate_id: string | null;
}

interface LiveMatchRecord {
  match_id: string;
  referral_id: string;
  candidate_name: string;
  posting_id: string;
  match_score: number;
  skill_overlap_score: number;
  experience_score: number;
  location_score: number;
  seniority_score: number;
  classification: "Strong Match" | "Partial Match" | "No Match";
  evaluated_date: string;
}

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

const DEFAULT_WEIGHTS = { skill: 50, experience: 25, location: 15, seniority: 10 };

function computeScore(
  m: { skill_overlap_score: number; experience_score: number; location_score: number; seniority_score: number },
  w: typeof DEFAULT_WEIGHTS
): number {
  return Math.round(
    (m.skill_overlap_score * w.skill +
      m.experience_score * w.experience +
      m.location_score * w.location +
      m.seniority_score * w.seniority) / 100
  );
}

function classifyScore(score: number): "Strong Match" | "Partial Match" | "No Match" {
  return score >= 70 ? "Strong Match" : score >= 50 ? "Partial Match" : "No Match";
}

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
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [weightsDraft, setWeightsDraft] = useState(DEFAULT_WEIGHTS);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const [statusOverridesMap, setStatusOverridesMap] = useState<Record<string, string>>({});
  const [submittedReferrals, setSubmittedReferrals] = useState<SubmittedReferral[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatchRecord[]>([]);
  const [expandedLiveScores, setExpandedLiveScores] = useState<Set<string>>(new Set());

  // Referral action state
  const [promotedMap, setPromotedMap] = useState<Record<string, string>>({}); // referral_id → pool_id
  const [rejectedSet, setRejectedSet] = useState<Set<string>>(new Set());
  const [activePromoteId, setActivePromoteId] = useState<string | null>(null);
  const [promoteExpLevel, setPromoteExpLevel] = useState<"Junior" | "Mid" | "Senior" | "Lead">("Mid");
  const [promoteRoles, setPromoteRoles] = useState("");
  const [promoteSkills, setPromoteSkills] = useState("");
  const [promoteLocations, setPromoteLocations] = useState("");
  const [promotingLoading, setPromotingLoading] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  function toggleLiveScore(referralId: string) {
    setExpandedLiveScores((prev) => {
      const next = new Set(prev);
      next.has(referralId) ? next.delete(referralId) : next.add(referralId);
      return next;
    });
  }

  function openPromoteForm(referralId: string, defaultLocation: string) {
    setActivePromoteId(referralId);
    setPromoteExpLevel("Mid");
    setPromoteRoles("");
    setPromoteSkills("");
    setPromoteLocations(defaultLocation);
    setPromoteError(null);
  }

  async function handleQuickPromote(referralId: string) {
    setPromotingLoading(true);
    setPromoteError(null);
    try {
      const res = await fetch("/api/reference/promote-to-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_id: referralId,
          experience_level: promoteExpLevel,
          preferred_role_tags: promoteRoles.split(",").map((s) => s.trim()).filter(Boolean),
          location_tags: promoteLocations.split(",").map((s) => s.trim()).filter(Boolean),
          skill_tags: promoteSkills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromotedMap((prev) => ({ ...prev, [referralId]: data.pool_id }));
        setActivePromoteId(null);
      } else {
        setPromoteError(data.error ?? "Promotion failed");
      }
    } catch {
      setPromoteError("Network error. Please try again.");
    } finally {
      setPromotingLoading(false);
    }
  }

  async function handleQuickReject(referralId: string) {
    setRejectingId(referralId);
    try {
      await fetch("/api/reference/referral-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_id: referralId, action: "not_suitable" }),
      });
      setRejectedSet((prev) => new Set([...prev, referralId]));
    } finally {
      setRejectingId(null);
    }
  }

  // Load persisted decisions, weights, status overrides, and submitted referrals on mount
  useEffect(() => {
    fetch("/api/reference/decisions")
      .then((r) => r.json())
      .then((data: { decisions: Array<{ candidate_id: string; decision: string; reason_code: string }> }) => {
        const loaded: Record<string, CandidateDecision> = {};
        for (const d of data.decisions) {
          loaded[d.candidate_id] = { decision: d.decision as DecisionValue, reasonCode: d.reason_code };
        }
        setDecisions(loaded);
      })
      .catch(() => {});

    fetch("/api/reference/scoring-config")
      .then((r) => r.json())
      .then((data: { weights: typeof DEFAULT_WEIGHTS }) => {
        setWeights(data.weights);
        setWeightsDraft(data.weights);
      })
      .catch(() => {});

    fetch("/api/reference/status")
      .then((r) => r.json())
      .then((data: { overrides: Record<string, string> }) => {
        setStatusOverridesMap(data.overrides ?? {});
      })
      .catch(() => {});

    fetch("/api/reference/submit")
      .then((r) => r.json())
      .then((data: { referrals: SubmittedReferral[] }) => {
        setSubmittedReferrals(data.referrals ?? []);
      })
      .catch(() => {});

    fetch("/api/reference/live-matches")
      .then((r) => r.json())
      .then((data: { matches: LiveMatchRecord[] }) => {
        setLiveMatches(data.matches ?? []);
      })
      .catch(() => {});

    fetch("/api/reference/promote-to-pool")
      .then((r) => r.json())
      .then((data: { pool_entries: Array<{ referral_id: string; pool_id: string }> }) => {
        const map: Record<string, string> = {};
        for (const e of data.pool_entries ?? []) map[e.referral_id] = e.pool_id;
        setPromotedMap(map);
      })
      .catch(() => {});

    fetch("/api/reference/referral-actions")
      .then((r) => r.json())
      .then((data: { rejected_ids: string[] }) => {
        setRejectedSet(new Set(data.rejected_ids ?? []));
      })
      .catch(() => {});
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
      if (!existing || computeScore(m, weights) > computeScore(existing, weights)) {
        map[m.candidate_id] = m;
      }
    }
    return map;
  }, [weights]);

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
        if (!best || classifyScore(computeScore(best, weights)) !== matchFilter) return false;
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

  function saveWeights() {
    const total = weightsDraft.skill + weightsDraft.experience + weightsDraft.location + weightsDraft.seniority;
    if (total !== 100) return;
    fetch("/api/reference/scoring-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weightsDraft),
    }).catch(() => {});
    setWeights(weightsDraft);
    setWeightsOpen(false);
  }

  function resetWeights() {
    setWeightsDraft(DEFAULT_WEIGHTS);
    setWeights(DEFAULT_WEIGHTS);
    fetch("/api/reference/scoring-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_WEIGHTS),
    }).catch(() => {});
  }

  function persistDecision(candidateId: string, decision: DecisionValue, reasonCode: string) {
    if (!decision) return;

    const candidate = REFERENCE_CANDIDATES.find((c) => c.candidate_id === candidateId);
    const beforeState = statusOverridesMap[candidateId] ?? candidate?.pool_status ?? "";
    const afterState =
      decision === "PROCEED" ? "matched"
        : decision === "NOT_SUITABLE" ? "closed"
          : beforeState;

    // 1. Save decision
    fetch("/api/reference/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candidateId, decision, reason_code: reasonCode }),
    }).catch(() => {});

    // 2. Write audit event
    const reasonLabel = reasonCode
      ? (REASON_CODES.find((r) => r.value === reasonCode)?.label ?? reasonCode)
      : null;
    fetch("/api/reference/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity_id: candidateId,
        entity_type: "candidate",
        event_type: "Decision",
        before_state: beforeState,
        after_state: afterState,
        notes: `${decision}${reasonLabel ? ` · ${reasonLabel}` : ""}`,
      }),
    }).catch(() => {});

    // 3. Apply status transition for PROCEED and NOT_SUITABLE
    if (decision === "PROCEED" || decision === "NOT_SUITABLE") {
      fetch("/api/reference/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, status: afterState }),
      }).catch(() => {});
      setStatusOverridesMap((prev) => ({ ...prev, [candidateId]: afterState }));
    }
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

      {/* Scoring Weights */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <button
          onClick={() => setWeightsOpen(!weightsOpen)}
          className="flex items-center gap-2 w-full px-5 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors rounded-xl"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          Scoring Weights
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            Skill {weights.skill}% · Exp {weights.experience}% · Loc {weights.location}% · Seniority {weights.seniority}%
          </span>
          <span className="ml-auto text-muted-foreground">
            {weightsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {weightsOpen && (
          <div className="border-t border-border px-5 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {(["skill", "experience", "location", "seniority"] as const).map((key) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5 capitalize">
                    {key === "skill" ? "Skill Overlap" : key}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={weightsDraft[key]}
                      onChange={(e) =>
                        setWeightsDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                      }
                      className="w-full bg-muted rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const total = weightsDraft.skill + weightsDraft.experience + weightsDraft.location + weightsDraft.seniority;
              return (
                <p className={`text-xs mb-3 ${total === 100 ? "text-brand-green" : "text-red-500"}`}>
                  Total: {total}%{total !== 100 && ` — must equal 100% (${Math.abs(100 - total)}% ${total > 100 ? "over" : "under"})`}
                </p>
              );
            })()}
            <div className="flex gap-2">
              <button
                onClick={saveWeights}
                disabled={weightsDraft.skill + weightsDraft.experience + weightsDraft.location + weightsDraft.seniority !== 100}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-teal text-white font-medium hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply Weights
              </button>
              <button
                onClick={resetWeights}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}
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

      {filtered.length === 0 && submittedReferrals.length === 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-10 text-center">
          <p className="text-muted-foreground text-sm">No candidates match your filters.</p>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-muted-foreground -mt-2">
        Showing {filtered.length} seeded · {submittedReferrals.length} submitted
      </p>

      <div className="grid gap-4">
        {filtered.map((candidate) => {
          const ref = REFERENCES.find((r) => r.reference_id === candidate.reference_id);
          const matches = MATCH_RECORDS.filter((m) => m.candidate_id === candidate.candidate_id);
          const bestMatch = bestMatchByCandidate[candidate.candidate_id];
          const scoreExpanded = expandedScores.has(candidate.candidate_id);
          const dec = decisions[candidate.candidate_id] ?? { decision: null, reasonCode: "" };
          const effectiveStatus = statusOverridesMap[candidate.candidate_id] ?? candidate.pool_status;
          const bestRecomputed = bestMatch ? computeScore(bestMatch, weights) : candidate.candidate_score;
          const bestRecomputedClass = bestMatch ? classifyScore(bestRecomputed) : null;

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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[effectiveStatus] ?? "bg-muted text-muted-foreground"}`}>
                      {STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
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
                    <span className="text-2xl font-bold text-foreground">{bestRecomputed}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  {bestRecomputedClass && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      bestRecomputedClass === "Strong Match"
                        ? "bg-brand-green/10 text-brand-green"
                        : bestRecomputedClass === "Partial Match"
                          ? "bg-brand-gold/10 text-brand-gold"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {bestRecomputedClass}
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
                    {matches.map((m) => {
                      const rc = computeScore(m, weights);
                      const rClass = classifyScore(rc);
                      return (
                        <div key={m.match_id} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-3 py-1.5">
                          <span className="text-muted-foreground">
                            {REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id}
                          </span>
                          <span className="font-semibold text-foreground">{rc}</span>
                          <span className={
                            rClass === "Strong Match" ? "text-brand-green"
                              : rClass === "Partial Match" ? "text-brand-gold"
                                : "text-muted-foreground"
                          }>· {rClass}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Score breakdown panel — one card per match */}
                  {scoreExpanded && (
                    <div className="mt-3 space-y-2">
                      {matches.map((m) => {
                        const rc = computeScore(m, weights);
                        const rClass = classifyScore(rc);
                        return (
                        <div key={m.match_id} className="bg-muted rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-foreground">
                              {REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              rClass === "Strong Match"
                                ? "bg-brand-green/10 text-brand-green"
                                : rClass === "Partial Match"
                                  ? "bg-brand-gold/10 text-brand-gold"
                                  : "bg-muted text-muted-foreground"
                            }`}>
                              {rc} · {rClass}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: "Skill Overlap", value: m.skill_overlap_score, weight: `${weights.skill}%` },
                              { label: "Experience", value: m.experience_score, weight: `${weights.experience}%` },
                              { label: "Location", value: m.location_score, weight: `${weights.location}%` },
                              { label: "Seniority", value: m.seniority_score, weight: `${weights.seniority}%` },
                            ].map((item) => (
                              <div key={item.label} className="text-center">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-lg font-bold text-foreground">{item.value}</p>
                                <p className="text-xs text-muted-foreground">weight {item.weight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        );
                      })}
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

      {/* ── Recently Submitted Referrals ── */}
      {submittedReferrals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Recently Submitted</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
              {submittedReferrals.length}
            </span>
            <span className="text-xs text-muted-foreground">· Pending recruiter review</span>
          </div>

          <div className="grid gap-4">
            {submittedReferrals.map((referral) => {
              const matches = liveMatches.filter((m) => m.referral_id === referral.referral_id);
              const sortedMatches = [...matches].sort((a, b) => b.match_score - a.match_score);
              const bestMatch = sortedMatches[0] ?? null;
              const liveScoreExpanded = expandedLiveScores.has(referral.referral_id);
              const isPromoted = !!promotedMap[referral.referral_id];
              const isRejected = rejectedSet.has(referral.referral_id);
              const isPromoteFormOpen = activePromoteId === referral.referral_id;

              const cardBorder = isPromoted
                ? "border-brand-teal/30"
                : isRejected
                  ? "border-muted"
                  : "border-brand-cyan/20";

              return (
                <div key={referral.referral_id} className={`bg-white rounded-xl border shadow-sm p-5 ${cardBorder}`}>

                  {/* ── Header ── */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold ${isRejected ? "text-muted-foreground" : "text-foreground"}`}>
                          {referral.candidate_name}
                        </span>
                        {isPromoted ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
                            In Pool · {promotedMap[referral.referral_id]}
                          </span>
                        ) : isRejected ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            Not Suitable
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
                            Pending Review
                          </span>
                        )}
                        {referral.availability && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {referral.availability}
                          </span>
                        )}
                        {referral.is_duplicate && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
                            Duplicate
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {referral.current_employer} · {referral.years_experience}y exp · {referral.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {referral.candidate_email}{referral.candidate_phone ? ` · ${referral.candidate_phone}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Referred by {referral.referrer_name} · {new Date(referral.submitted_at).toLocaleDateString("en-CA")}
                      </p>
                    </div>
                    {bestMatch && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-bold text-foreground">{bestMatch.match_score}</span>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          bestMatch.classification === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                            : bestMatch.classification === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                              : "bg-muted text-muted-foreground"
                        }`}>{bestMatch.classification}</span>
                      </div>
                    )}
                  </div>

                  {/* ── AI Match Scores — always visible ── */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-brand-teal" />
                        <p className="text-xs font-semibold text-foreground">AI Match Scores</p>
                      </div>
                      {sortedMatches.length > 0 && (
                        <button
                          onClick={() => toggleLiveScore(referral.referral_id)}
                          className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                        >
                          Component detail
                          {liveScoreExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </div>

                    {sortedMatches.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        AI scoring pending…
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sortedMatches.map((m) => {
                          const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                          return (
                            <div key={m.match_id} className={`rounded-lg border px-3 py-2.5 ${
                              m.classification === "Strong Match"
                                ? "border-brand-green/20 bg-brand-green/5"
                                : m.classification === "Partial Match"
                                  ? "border-brand-gold/20 bg-brand-gold/5"
                                  : "border-border bg-muted/40"
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-foreground truncate">{jobTitle}</p>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-lg font-bold text-foreground">{m.match_score}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    m.classification === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                                      : m.classification === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                                        : "bg-muted text-muted-foreground"
                                  }`}>{m.classification}</span>
                                </div>
                              </div>
                              {/* Component score mini-bar */}
                              <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                                {[
                                  { label: "Skill", value: m.skill_overlap_score },
                                  { label: "Exp", value: m.experience_score },
                                  { label: "Loc", value: m.location_score },
                                  { label: "Sen", value: m.seniority_score },
                                ].map((c) => (
                                  <div key={c.label}>
                                    <p className="text-[10px] text-muted-foreground">{c.label}</p>
                                    <p className={`text-xs font-bold ${c.value >= 70 ? "text-brand-green" : c.value >= 50 ? "text-brand-gold" : "text-muted-foreground"}`}>
                                      {c.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Full component breakdown */}
                    {liveScoreExpanded && sortedMatches.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {sortedMatches.map((m) => (
                          <div key={m.match_id} className="bg-muted rounded-lg p-3">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              {REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id}
                              <span className="ml-2 font-normal text-muted-foreground">— detailed breakdown</span>
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { label: "Skill Overlap", value: m.skill_overlap_score },
                                { label: "Experience",    value: m.experience_score },
                                { label: "Location",      value: m.location_score },
                                { label: "Seniority",     value: m.seniority_score },
                              ].map((item) => (
                                <div key={item.label} className="text-center bg-white rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground">{item.label}</p>
                                  <p className="text-xl font-bold text-foreground">{item.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Referrer note ── */}
                  {referral.referrer_note && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">"{referral.referrer_note}"</p>
                    </div>
                  )}

                  {/* ── Recruiter actions (only when pending) ── */}
                  {!isPromoted && !isRejected && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recruiter Decision</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => isPromoteFormOpen ? setActivePromoteId(null) : openPromoteForm(referral.referral_id, referral.location)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                            isPromoteFormOpen
                              ? "bg-brand-teal/10 text-brand-teal border-brand-teal/30"
                              : "bg-white text-muted-foreground border-border hover:border-brand-teal/40 hover:text-brand-teal"
                          }`}
                        >
                          <Package className="h-3.5 w-3.5" />
                          Promote to Pool
                          {isPromoteFormOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => handleQuickReject(referral.referral_id)}
                          disabled={rejectingId === referral.referral_id}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border border-border bg-white text-muted-foreground hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {rejectingId === referral.referral_id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <XCircle className="h-3.5 w-3.5" />}
                          Not Suitable
                        </button>
                      </div>

                      {/* Inline promote form */}
                      {isPromoteFormOpen && (
                        <div className="mt-3 p-4 bg-muted/50 rounded-lg border border-brand-teal/20 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Experience Level <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={promoteExpLevel}
                                onChange={(e) => setPromoteExpLevel(e.target.value as typeof promoteExpLevel)}
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                              >
                                {(["Junior", "Mid", "Senior", "Lead"] as const).map((l) => (
                                  <option key={l} value={l}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Skills <span className="opacity-50">(comma-sep)</span>
                              </label>
                              <input
                                type="text"
                                value={promoteSkills}
                                onChange={(e) => setPromoteSkills(e.target.value)}
                                placeholder="e.g. Python, SQL"
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Preferred Roles <span className="opacity-50">(comma-sep)</span>
                              </label>
                              <input
                                type="text"
                                value={promoteRoles}
                                onChange={(e) => setPromoteRoles(e.target.value)}
                                placeholder="e.g. Data Engineer"
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Location Tags <span className="opacity-50">(comma-sep)</span>
                              </label>
                              <input
                                type="text"
                                value={promoteLocations}
                                onChange={(e) => setPromoteLocations(e.target.value)}
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                              />
                            </div>
                          </div>
                          {promoteError && (
                            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                              {promoteError}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleQuickPromote(referral.referral_id)}
                              disabled={promotingLoading}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-teal text-white font-medium hover:bg-brand-teal/90 disabled:opacity-50"
                            >
                              {promotingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              {promotingLoading ? "Promoting…" : "Confirm Promotion"}
                            </button>
                            <button
                              onClick={() => setActivePromoteId(null)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Promoted confirmation */}
                  {isPromoted && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                      <p className="text-xs text-brand-teal font-medium">
                        Added to pool · {promotedMap[referral.referral_id]}
                      </p>
                      <Link href="/reference/pool" className="ml-auto text-xs text-brand-teal hover:underline">
                        View in Pool →
                      </Link>
                    </div>
                  )}

                  {/* Rejected confirmation */}
                  {isRejected && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Marked not suitable</p>
                    </div>
                  )}

                  {/* Links row */}
                  <div className="flex gap-3 mt-3 pt-3 border-t border-border items-center flex-wrap">
                    {referral.linkedin_url && (
                      <a href={referral.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-teal hover:underline">
                        LinkedIn ↗
                      </a>
                    )}
                    {referral.resume_filename
                      ? <span className="text-xs text-brand-green">✓ Resume attached</span>
                      : <span className="text-xs text-muted-foreground">No resume</span>
                    }
                    <Link
                      href={`/reference/referrals/${referral.referral_id}`}
                      className="ml-auto text-xs text-brand-teal font-medium hover:underline"
                    >
                      View referral record →
                    </Link>
                    {referral.is_duplicate && referral.duplicate_candidate_id && (
                      <Link
                        href={`/reference/candidates/${referral.duplicate_candidate_id}`}
                        className="text-xs text-brand-gold font-medium hover:underline"
                      >
                        View existing profile →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
