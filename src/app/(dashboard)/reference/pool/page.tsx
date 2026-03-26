"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { REFERENCE_JOBS } from "@/data/reference/jobs";
import { Search, Download, Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { toCsv, downloadCsv } from "@/lib/csv";

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
            {filteredPool.length}
          </span>
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
          </div>
        )}
      </div>

      {/* ── Section 2: Unmatched / Under Tracking ── */}
      {untrackedCandidates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Under Tracking</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
              {untrackedCandidates.length}
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
          </div>
        </div>
      )}
    </div>
  );
}
