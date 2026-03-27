"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { REFERENCE_JOBS } from "@/data/reference/jobs";
import { Search, Download, Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle, TrendingUp, Package, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";

interface LivePoolEntry {
  pool_id: string;
  referral_id: string;
  candidate_name: string;
  candidate_email: string;
  years_experience: number;
  location: string;
  availability: string;
  date_added: string;
  date_last_evaluated: string;
  status: "Active Hold" | "Aging Review" | "Withdrawn" | "Placed";
  skill_tags: string[];
  experience_level: "Junior" | "Mid" | "Senior" | "Lead";
  location_tags: string[];
  preferred_role_tags: string[];
  match_evaluation_history: { posting_id: string; score: number; evaluated_date: string; }[];
  promoted_at: string;
  promoted_by: string;
}

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

const HOLD_STATUS_COLORS: Record<string, string> = {
  "Active Hold": "bg-brand-teal/10 text-brand-teal",
  "Aging Review": "bg-brand-gold/10 text-brand-gold",
  Withdrawn: "bg-muted text-muted-foreground",
  Placed: "bg-brand-green/10 text-brand-green",
};

const POOL_STATUS_LABELS: Record<string, string> = {
  pending_validation: "Pending Validation",
  verification_in_progress: "Verifying Skills",
  matched: "Matched",
  in_pool: "In Pool",
  hired: "Hired",
  closed: "Closed",
};

const POOL_STATUS_COLORS: Record<string, string> = {
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

// Candidates not in the formal talent pool and not yet matched to a role
function getUntrackedCandidates() {
  const poolCandidateIds = new Set(TALENT_POOL.map((p) => p.candidate_id));
  return REFERENCE_CANDIDATES.filter((c) => {
    if (poolCandidateIds.has(c.candidate_id)) return false;
    // Exclude already-matched or hired
    if (c.pool_status === "matched" || c.pool_status === "hired") return false;
    return true;
  });
}

export default function TalentPoolPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [recommendations, setRecommendations] = useState<Record<string, string>>({});
  const [loadingRec, setLoadingRec] = useState<Record<string, boolean>>({});
  const [expandedScores, setExpandedScores] = useState<Set<string>>(new Set());
  const [submittedReferrals, setSubmittedReferrals] = useState<SubmittedReferral[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatchRecord[]>([]);
  const [livePoolEntries, setLivePoolEntries] = useState<LivePoolEntry[]>([]);

  // Referral quick-action state
  const [promotedMap, setPromotedMap] = useState<Record<string, string>>({});
  const [rejectedSet, setRejectedSet] = useState<Set<string>>(new Set());
  const [activePromoteId, setActivePromoteId] = useState<string | null>(null);
  const [promoteExpLevel, setPromoteExpLevel] = useState<"Junior" | "Mid" | "Senior" | "Lead">("Mid");
  const [promoteRoles, setPromoteRoles] = useState("");
  const [promoteSkills, setPromoteSkills] = useState("");
  const [promoteLocations, setPromoteLocations] = useState("");
  const [promotingLoading, setPromotingLoading] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

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
        refreshData(); // re-fetch pool entries so the Talent Pool section updates
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

  function refreshData() {
    fetch("/api/reference/submit")
      .then((r) => r.json())
      .then((data: { referrals: SubmittedReferral[] }) => setSubmittedReferrals(data.referrals ?? []))
      .catch(() => {});
    fetch("/api/reference/live-matches")
      .then((r) => r.json())
      .then((data: { matches: LiveMatchRecord[] }) => setLiveMatches(data.matches ?? []))
      .catch(() => {});
    fetch("/api/reference/promote-to-pool")
      .then((r) => r.json())
      .then((data: { pool_entries: LivePoolEntry[] }) => {
        setLivePoolEntries(data.pool_entries ?? []);
        const map: Record<string, string> = {};
        for (const e of data.pool_entries ?? []) map[e.referral_id] = e.pool_id;
        setPromotedMap(map);
      })
      .catch(() => {});
    fetch("/api/reference/referral-actions")
      .then((r) => r.json())
      .then((data: { rejected_ids: string[] }) => setRejectedSet(new Set(data.rejected_ids ?? [])))
      .catch(() => {});
  }

  useEffect(() => { refreshData(); }, []);

  function toggleScore(id: string) {
    setExpandedScores((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportPoolCsv() {
    const headers = ["Pool ID", "Candidate ID", "Name", "Status", "Experience Level", "Date Added", "Last Evaluated", "Skills", "Preferred Roles", "Locations"];
    const rows = TALENT_POOL.map((p) => {
      const c = REFERENCE_CANDIDATES.find((c) => c.candidate_id === p.candidate_id);
      return [
        p.pool_id, p.candidate_id, c?.name ?? "", p.status, p.experience_level,
        p.date_added, p.date_last_evaluated,
        p.skill_tags.join("; "), p.preferred_role_tags.join("; "), p.location_tags.join("; "),
      ];
    });
    downloadCsv("talent-pool.csv", toCsv(headers, rows));
  }

  async function getRecommendations(poolId: string, candidate: typeof REFERENCE_CANDIDATES[0] | undefined, pool: typeof TALENT_POOL[0]) {
    if (!candidate) return;
    setLoadingRec((prev) => ({ ...prev, [poolId]: true }));
    const gaps = candidate.skills_verified
      .filter((s) => s.status !== "Verified")
      .map((s) => `${s.skill} (${s.status})`);
    const prompt = `Candidate ${candidate.name} is in the talent pool with the following skill gaps: ${gaps.join(", ")}. Their preferred roles are: ${pool.preferred_role_tags.join(", ")}. Suggest 3 specific, concise upskilling recommendations (course, certification, or project) to improve their match score. Be brief and actionable.`;
    try {
      const res = await fetch("/api/reference/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setRecommendations((prev) => ({ ...prev, [poolId]: data.response ?? "No recommendations available." }));
    } catch {
      setRecommendations((prev) => ({ ...prev, [poolId]: "Failed to load recommendations. Please try again." }));
    } finally {
      setLoadingRec((prev) => ({ ...prev, [poolId]: false }));
    }
  }

  const filteredPool = useMemo(() => {
    const q = search.toLowerCase();
    return TALENT_POOL.filter((pool) => {
      const candidate = REFERENCE_CANDIDATES.find((c) => c.candidate_id === pool.candidate_id);
      if (q) {
        const matchesText =
          (candidate?.name ?? "").toLowerCase().includes(q) ||
          (candidate?.current_employer ?? "").toLowerCase().includes(q) ||
          pool.skill_tags.some((s) => s.toLowerCase().includes(q)) ||
          pool.preferred_role_tags.some((r) => r.toLowerCase().includes(q));
        if (!matchesText) return false;
      }
      if (statusFilter !== "all" && pool.status !== statusFilter) return false;
      if (levelFilter !== "all" && pool.experience_level !== levelFilter) return false;
      return true;
    });
  }, [search, statusFilter, levelFilter]);

  const untrackedCandidates = useMemo(() => {
    const q = search.toLowerCase();
    return getUntrackedCandidates().filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.current_employer.toLowerCase().includes(q) ||
        c.skills_verified.some((s) => s.skill.toLowerCase().includes(q))
      );
    });
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talent Pool"
        description="Candidates held for future openings and those under tracking"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 -mt-2">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, employer, skill, or preferred role…"
              className="w-full bg-white border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            <option value="all">All Hold Statuses</option>
            <option value="Active Hold">Active Hold</option>
            <option value="Aging Review">Aging Review</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Placed">Placed</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          >
            <option value="all">All Levels</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
        </div>
        <button
          onClick={exportPoolCsv}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors flex-shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* ── Section 1: Formal Talent Pool ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-foreground">Talent Pool</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
            {filteredPool.length + livePoolEntries.length}
          </span>
          {livePoolEntries.length > 0 && (
            <span className="text-xs text-muted-foreground">
              · {livePoolEntries.length} promoted from referrals
            </span>
          )}
        </div>

        {filteredPool.length === 0 ? (
          <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {TALENT_POOL.length === 0 ? "No candidates in the talent pool yet." : "No pool candidates match your filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPool.map((pool) => {
              const candidate = REFERENCE_CANDIDATES.find((c) => c.candidate_id === pool.candidate_id);
              const ref = candidate ? REFERENCES.find((r) => r.reference_id === candidate.reference_id) : null;
              const matches = MATCH_RECORDS.filter((m) => m.candidate_id === pool.candidate_id);
              const scoreExpanded = expandedScores.has(pool.pool_id);

              return (
                <div key={pool.pool_id} className="bg-white rounded-xl border border-border shadow-sm p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {candidate ? (
                          <Link
                            href={`/reference/candidates/${pool.candidate_id}?from=pool`}
                            className="font-semibold text-foreground hover:text-brand-teal hover:underline"
                          >
                            {candidate.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-foreground">{pool.candidate_id}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HOLD_STATUS_COLORS[pool.status] ?? "bg-muted text-muted-foreground"}`}>
                          {pool.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {pool.experience_level}
                        </span>
                      </div>
                      {candidate && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {candidate.current_employer} · {candidate.location} · {candidate.years_experience}y exp
                        </p>
                      )}
                      {ref && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Referred by {ref.referrer_name}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {candidate && (
                        <div className="mb-1">
                          <span className="text-xl font-bold text-foreground">{candidate.candidate_score}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Added {pool.date_added}</p>
                      <p className="text-xs text-muted-foreground">Evaluated {pool.date_last_evaluated}</p>
                    </div>
                  </div>

                  {/* Skill verification */}
                  {candidate && (
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
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred roles + locations */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Preferred Roles</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pool.preferred_role_tags.map((role) => (
                          <span key={role} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Locations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {pool.location_tags.map((loc) => (
                          <span key={loc} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                            📍 {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Match history + score breakdown */}
                  {matches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Match Evaluations</p>
                        <button
                          onClick={() => toggleScore(pool.pool_id)}
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
                                  : "text-red-400"
                            }>· {m.classification}</span>
                          </div>
                        ))}
                      </div>

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
                                      : "bg-red-100 text-red-500"
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

                  {/* AI Skill Gap Recommendations */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">Upskilling Recommendations</p>
                      {!recommendations[pool.pool_id] && (
                        <button
                          onClick={() => getRecommendations(pool.pool_id, candidate, pool)}
                          disabled={loadingRec[pool.pool_id]}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 transition-colors disabled:opacity-50"
                        >
                          {loadingRec[pool.pool_id]
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5" />
                          }
                          {loadingRec[pool.pool_id] ? "Analysing…" : "Get AI Recommendations"}
                        </button>
                      )}
                    </div>
                    {recommendations[pool.pool_id] ? (
                      <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-4 py-3">
                        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                          {recommendations[pool.pool_id]}
                        </p>
                        <button
                          onClick={() => setRecommendations((prev) => { const n = { ...prev }; delete n[pool.pool_id]; return n; })}
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : !loadingRec[pool.pool_id] && (
                      <p className="text-xs text-muted-foreground">
                        Click to get AI-powered course and certification suggestions based on this candidate's skill gaps.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <Link
                      href={`/reference/candidates/${pool.candidate_id}?from=pool`}
                      className="text-xs text-brand-teal font-medium hover:underline"
                    >
                      View full profile →
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Live pool entries (promoted from submitted referrals) */}
            {livePoolEntries.map((entry) => {
              const entryScoreExpanded = expandedScores.has(`lpe-${entry.pool_id}`);
              const bestScore = entry.match_evaluation_history.length > 0
                ? Math.max(...entry.match_evaluation_history.map((h) => h.score))
                : null;

              return (
                <div key={entry.pool_id} className="bg-white rounded-xl border border-border shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/reference/referrals/${entry.referral_id}?from=pool`}
                          className="font-semibold text-foreground hover:text-brand-teal hover:underline"
                        >
                          {entry.candidate_name}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${HOLD_STATUS_COLORS[entry.status] ?? "bg-muted text-muted-foreground"}`}>
                          {entry.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {entry.experience_level}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-brand-cyan/10 text-brand-cyan font-mono">
                          {entry.pool_id}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {entry.location} · {entry.years_experience}y exp
                        {entry.availability ? ` · ${entry.availability}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Promoted by {entry.promoted_by} · {entry.date_added}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {bestScore !== null && (
                        <div className="mb-1">
                          <span className="text-xl font-bold text-foreground">{bestScore}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Added {entry.date_added}</p>
                    </div>
                  </div>

                  {/* Skill tags */}
                  {entry.skill_tags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.skill_tags.map((s) => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred roles + locations */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {entry.preferred_role_tags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Preferred Roles</p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.preferred_role_tags.map((r) => (
                            <span key={r} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.location_tags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Locations</p>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.location_tags.map((l) => (
                            <span key={l} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground">📍 {l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Match history */}
                  {entry.match_evaluation_history.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Match Evaluations</p>
                        <button
                          onClick={() => toggleScore(`lpe-${entry.pool_id}`)}
                          className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                        >
                          Score breakdown
                          {entryScoreExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.match_evaluation_history.map((h) => (
                          <div key={h.posting_id} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-3 py-1.5">
                            <span className="text-muted-foreground">
                              {REFERENCE_JOBS.find((j) => j.id === h.posting_id)?.title ?? h.posting_id}
                            </span>
                            <span className="font-semibold text-foreground">{h.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <Link
                      href={`/reference/referrals/${entry.referral_id}`}
                      className="text-xs text-brand-teal font-medium hover:underline"
                    >
                      View referral record →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Unmatched / Under Tracking ── */}
      {(() => {
        const pendingReferrals = submittedReferrals.filter(
          (r) => !livePoolEntries.some((e) => e.referral_id === r.referral_id)
        );
        if (untrackedCandidates.length === 0 && pendingReferrals.length === 0) return null;
        return (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Under Tracking</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
              {untrackedCandidates.length + pendingReferrals.length}
            </span>
            <span className="text-xs text-muted-foreground">· Candidates not yet matched or in pool</span>
          </div>

          <div className="grid gap-4">
            {untrackedCandidates.map((candidate) => {
              const ref = REFERENCES.find((r) => r.reference_id === candidate.reference_id);
              const matches = MATCH_RECORDS.filter((m) => m.candidate_id === candidate.candidate_id);
              const scoreExpanded = expandedScores.has(`track-${candidate.candidate_id}`);

              return (
                <div key={candidate.candidate_id} className="bg-white rounded-xl border border-brand-gold/20 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/reference/candidates/${candidate.candidate_id}`}
                          className="font-semibold text-foreground hover:text-brand-teal hover:underline"
                        >
                          {candidate.name}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POOL_STATUS_COLORS[candidate.pool_status] ?? "bg-muted text-muted-foreground"}`}>
                          {POOL_STATUS_LABELS[candidate.pool_status] ?? candidate.pool_status}
                        </span>
                        {"availability" in candidate && (candidate as { availability?: string }).availability && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
                            {(candidate as { availability?: string }).availability}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {candidate.current_employer} · {candidate.location} · {candidate.years_experience}y exp
                      </p>
                      {ref && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Referred by {ref.referrer_name} on {ref.submission_date}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xl font-bold text-foreground">{candidate.candidate_score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>

                  {/* Why not matched */}
                  {matches.length === 0 ? (
                    <div className="mt-3 flex items-start gap-2 bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        No match evaluations run yet — skill verification is still in progress.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-start gap-2 bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-brand-gold flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        Scored below threshold on all current openings — held for future matching.
                      </p>
                    </div>
                  )}

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
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match evaluations if any */}
                  {matches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Match Evaluations</p>
                        <button
                          onClick={() => toggleScore(`track-${candidate.candidate_id}`)}
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
                                  : "text-red-400"
                            }>· {m.classification}</span>
                          </div>
                        ))}
                      </div>

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
                                      : "bg-red-100 text-red-500"
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

                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <Link
                      href={`/reference/candidates/${candidate.candidate_id}`}
                      className="text-xs text-brand-teal font-medium hover:underline"
                    >
                      View full profile →
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Submitted referrals pending review — exclude already-promoted ones */}
            {submittedReferrals
              .filter((r) => !livePoolEntries.some((e) => e.referral_id === r.referral_id))
              .map((referral) => {
              const matches = liveMatches.filter((m) => m.referral_id === referral.referral_id);
              const sortedMatches = [...matches].sort((a, b) => b.match_score - a.match_score);
              const bestMatch = sortedMatches[0] ?? null;
              const scoreExpanded = expandedScores.has(`ref-${referral.referral_id}`);
              const isPromoted = !!promotedMap[referral.referral_id];
              const isRejected = rejectedSet.has(referral.referral_id);
              const isPromoteFormOpen = activePromoteId === referral.referral_id;

              const cardBorder = isPromoted ? "border-brand-teal/30" : isRejected ? "border-muted" : "border-brand-cyan/20";

              return (
                <div key={referral.referral_id} className={`bg-white rounded-xl border shadow-sm p-5 ${cardBorder}`}>
                  {/* Header */}
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
                        {referral.current_employer} · {referral.location} · {referral.years_experience}y exp
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Referred by {referral.referrer_name} · {new Date(referral.submitted_at).toLocaleDateString("en-CA")}
                      </p>
                    </div>
                    {bestMatch && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xl font-bold text-foreground">{bestMatch.match_score}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          bestMatch.classification === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                            : bestMatch.classification === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                              : "bg-muted text-muted-foreground"
                        }`}>{bestMatch.classification}</span>
                      </div>
                    )}
                  </div>

                  {/* AI Match Scores — always visible */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-brand-teal" />
                        <p className="text-xs font-semibold text-foreground">AI Match Scores</p>
                      </div>
                      {sortedMatches.length > 0 && (
                        <button
                          onClick={() => toggleScore(`ref-${referral.referral_id}`)}
                          className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                        >
                          Component detail
                          {scoreExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
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
                              m.classification === "Strong Match" ? "border-brand-green/20 bg-brand-green/5"
                                : m.classification === "Partial Match" ? "border-brand-gold/20 bg-brand-gold/5"
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
                              <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                                {[
                                  { label: "Skill", value: m.skill_overlap_score },
                                  { label: "Exp",   value: m.experience_score },
                                  { label: "Loc",   value: m.location_score },
                                  { label: "Sen",   value: m.seniority_score },
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
                    {scoreExpanded && sortedMatches.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {sortedMatches.map((m) => (
                          <div key={m.match_id} className="bg-muted rounded-lg p-3">
                            <p className="text-xs font-semibold text-foreground mb-2">
                              {REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id}
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
                                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {referral.referrer_note && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">"{referral.referrer_note}"</p>
                    </div>
                  )}

                  {/* Recruiter actions */}
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
                              <input type="text" value={promoteSkills} onChange={(e) => setPromoteSkills(e.target.value)}
                                placeholder="e.g. Python, SQL"
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Preferred Roles <span className="opacity-50">(comma-sep)</span>
                              </label>
                              <input type="text" value={promoteRoles} onChange={(e) => setPromoteRoles(e.target.value)}
                                placeholder="e.g. Data Engineer"
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Location Tags <span className="opacity-50">(comma-sep)</span>
                              </label>
                              <input type="text" value={promoteLocations} onChange={(e) => setPromoteLocations(e.target.value)}
                                className="w-full bg-white rounded-lg px-3 py-1.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-brand-teal/30" />
                            </div>
                          </div>
                          {promoteError && (
                            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />{promoteError}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => handleQuickPromote(referral.referral_id)} disabled={promotingLoading}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-teal text-white font-medium hover:bg-brand-teal/90 disabled:opacity-50">
                              {promotingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              {promotingLoading ? "Promoting…" : "Confirm Promotion"}
                            </button>
                            <button onClick={() => setActivePromoteId(null)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isPromoted && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                      <p className="text-xs text-brand-teal font-medium">
                        Added to pool · {promotedMap[referral.referral_id]}
                      </p>
                    </div>
                  )}
                  {isRejected && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Marked not suitable</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <Link href={`/reference/referrals/${referral.referral_id}`}
                      className="text-xs text-brand-teal font-medium hover:underline">
                      View referral record →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
