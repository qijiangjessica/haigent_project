"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { Search, ChevronDown, ChevronUp, CheckCircle2, Clock, XCircle, Download, Settings, TrendingUp, Package, Loader2, AlertTriangle, Square, CheckSquare, Minus, Users, Filter, UserPlus, CalendarClock, X } from "lucide-react";
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
  pipeline_status: "pending_review" | "in_review" | "not_suitable" | "in_pool" | "in_scheduling" | "hired";
  in_review_at: string | null;
  skills_claimed: string[];
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
  scoring_method?: "ai" | "static";
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
const DEFAULT_THRESHOLDS = { strong_match: 70, partial_match: 50 };

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

function classifyScore(
  score: number,
  t: { strong_match: number; partial_match: number } = DEFAULT_THRESHOLDS
): "Strong Match" | "Partial Match" | "No Match" {
  return score >= t.strong_match ? "Strong Match" : score >= t.partial_match ? "Partial Match" : "No Match";
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
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
  const [contactSummary, setContactSummary] = useState<Record<string, number>>({});
  const [expandedLiveScores, setExpandedLiveScores] = useState<Set<string>>(new Set());

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDecision, setBulkDecision] = useState<DecisionValue>(null);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkResult, setBulkResult] = useState<"idle" | "success" | "error">("idle");

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
  const [promoteRecruiterEmail, setPromoteRecruiterEmail] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [inReviewSet, setInReviewSet] = useState<Set<string>>(new Set());
  const [inSchedulingSet, setInSchedulingSet] = useState<Set<string>>(new Set());
  const [movingToPipelineId, setMovingToPipelineId] = useState<string | null>(null);
  const [referralMatchedSet, setReferralMatchedSet] = useState<Set<string>>(new Set());
  const [applyingDecisionId, setApplyingDecisionId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"total" | "strong" | "pending" | "scheduling" | "hired" | null>(null);

  function toggleLiveScore(referralId: string) {
    setExpandedLiveScores((prev) => {
      const next = new Set(prev);
      next.has(referralId) ? next.delete(referralId) : next.add(referralId);
      return next;
    });
  }

  async function handleMoveToPipeline(referralId: string) {
    setMovingToPipelineId(referralId);
    try {
      const res = await fetch(`/api/reference/referrals/${referralId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_status: "in_review",
          in_review_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setInReviewSet((prev) => new Set([...prev, referralId]));
      }
    } catch {
      // silently ignore — user can retry
    } finally {
      setMovingToPipelineId(null);
    }
  }

  async function persistReferralDecision(referralId: string, decision: DecisionValue, reasonCode: string) {
    if (!decision) return;
    const afterPipelineStatus =
      decision === "PROCEED" ? "in_scheduling"
        : decision === "NOT_SUITABLE" ? "not_suitable"
          : null;

    // Record decision in audit store
    fetch("/api/reference/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: referralId, decision, reason_code: reasonCode }),
    }).catch(() => {});

    // PATCH pipeline_status for terminal decisions
    if (afterPipelineStatus) {
      setApplyingDecisionId(referralId);
      try {
        await fetch(`/api/reference/referrals/${referralId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline_status: afterPipelineStatus }),
        });
        if (decision === "PROCEED") {
          // Remove from Active Pipeline, move to Scheduling
          setInReviewSet((prev) => { const n = new Set(prev); n.delete(referralId); return n; });
          setInSchedulingSet((prev) => new Set([...prev, referralId]));

          // Update local referral record to reflect new stage
          setSubmittedReferrals((prev) =>
            prev.map((r) => r.referral_id === referralId ? { ...r, pipeline_status: "in_scheduling" as const } : r)
          );
        } else if (decision === "NOT_SUITABLE") {
          setInReviewSet((prev) => { const n = new Set(prev); n.delete(referralId); return n; });
          setRejectedSet((prev) => new Set([...prev, referralId]));
        }
      } finally {
        setApplyingDecisionId(null);
      }
    }
  }

  function setReferralDecision(referralId: string, decision: DecisionValue) {
    const reasonCode = decisions[referralId]?.reasonCode ?? "";
    setDecisions((prev) => ({
      ...prev,
      [referralId]: { decision, reasonCode: prev[referralId]?.reasonCode ?? "" },
    }));
    persistReferralDecision(referralId, decision, reasonCode);
  }

  function setReferralReasonCode(referralId: string, reasonCode: string) {
    const currentDecision = decisions[referralId]?.decision ?? null;
    setDecisions((prev) => ({
      ...prev,
      [referralId]: { ...prev[referralId], reasonCode },
    }));
    persistReferralDecision(referralId, currentDecision, reasonCode);
  }

  function openPromoteForm(referralId: string, defaultLocation: string) {
    setActivePromoteId(referralId);
    setPromoteExpLevel("Mid");
    setPromoteRoles("");
    setPromoteRecruiterEmail("");
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
          ...(promoteRecruiterEmail ? { recruiter_email: promoteRecruiterEmail } : {}),
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
      .then((data: { weights: typeof DEFAULT_WEIGHTS; thresholds?: typeof DEFAULT_THRESHOLDS }) => {
        if (data.weights) { setWeights(data.weights); setWeightsDraft(data.weights); }
        if (data.thresholds) setThresholds(data.thresholds);
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
        const referrals = data.referrals ?? [];
        setSubmittedReferrals(referrals);
        // Restore in-review state from persisted pipeline_status
        const inReview = new Set(
          referrals
            .filter((r) => r.pipeline_status === "in_review")
            .map((r) => r.referral_id)
        );
        setInReviewSet(inReview);
        // Restore in-scheduling state from persisted pipeline_status
        const inScheduling = new Set(
          referrals
            .filter((r) => r.pipeline_status === "in_scheduling")
            .map((r) => r.referral_id)
        );
        setInSchedulingSet(inScheduling);
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

    fetch("/api/reference/contacts/summary")
      .then((r) => r.json())
      .then((data: { summary: Record<string, number> }) => {
        setContactSummary(data.summary ?? {});
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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.candidate_id)));
    }
  }

  function exportSelectedCsv() {
    const headers = ["ID", "Name", "Email", "Phone", "Employer", "Years Exp", "Location", "Availability", "Score", "Status", "Skills Claimed", "Resume"];
    const rows = filtered
      .filter((c) => selectedIds.has(c.candidate_id))
      .map((c) => [
        c.candidate_id, c.name, c.email, c.phone, c.current_employer,
        c.years_experience, c.location, c.availability ?? "",
        c.candidate_score, c.pool_status,
        c.skills_claimed.join("; "), c.resume_uploaded ? "Yes" : "No",
      ]);
    downloadCsv("selected-candidates.csv", toCsv(headers, rows));
  }

  async function applyBulkDecision() {
    if (!bulkDecision || selectedIds.size === 0) return;
    setBulkApplying(true);
    setBulkResult("idle");
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch("/api/reference/decisions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidate_id: id, decision: bulkDecision, reason_code: "" }),
          })
        )
      );
      // Apply status transitions
      const afterState =
        bulkDecision === "PROCEED" ? "matched"
          : bulkDecision === "NOT_SUITABLE" ? "closed"
            : null;
      if (afterState) {
        await Promise.all(
          [...selectedIds].map((id) =>
            fetch("/api/reference/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidate_id: id, status: afterState }),
            })
          )
        );
        setStatusOverridesMap((prev) => {
          const next = { ...prev };
          [...selectedIds].forEach((id) => { next[id] = afterState; });
          return next;
        });
      }
      setDecisions((prev) => {
        const next = { ...prev };
        [...selectedIds].forEach((id) => {
          next[id] = { decision: bulkDecision, reasonCode: "" };
        });
        return next;
      });
      setBulkResult("success");
      setSelectedIds(new Set());
      setTimeout(() => setBulkResult("idle"), 3000);
    } catch {
      setBulkResult("error");
    } finally {
      setBulkApplying(false);
    }
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkApplying(true);
    setBulkResult("idle");
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch("/api/reference/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidate_id: id, status: bulkStatus }),
          })
        )
      );
      setStatusOverridesMap((prev) => {
        const next = { ...prev };
        [...selectedIds].forEach((id) => { next[id] = bulkStatus; });
        return next;
      });
      setBulkResult("success");
      setSelectedIds(new Set());
      setTimeout(() => setBulkResult("idle"), 3000);
    } catch {
      setBulkResult("error");
    } finally {
      setBulkApplying(false);
    }
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
        if (!best || classifyScore(computeScore(best, weights), thresholds) !== matchFilter) return false;
      }
      return true;
    });
  }, [search, statusFilter, matchFilter, bestMatchByCandidate, thresholds]);

  // Referrals split by pipeline stage
  const inReviewReferrals = useMemo(
    () => submittedReferrals.filter((r) => inReviewSet.has(r.referral_id)),
    [submittedReferrals, inReviewSet]
  );

  const schedulingReferrals = useMemo(
    () =>
      submittedReferrals.filter(
        (r) => inSchedulingSet.has(r.referral_id) || r.pipeline_status === "in_scheduling"
      ),
    [submittedReferrals, inSchedulingSet]
  );

  const pendingReferrals = useMemo(
    () =>
      submittedReferrals.filter(
        (r) =>
          !inReviewSet.has(r.referral_id) &&
          !inSchedulingSet.has(r.referral_id) &&
          !rejectedSet.has(r.referral_id) &&
          !promotedMap[r.referral_id] &&
          r.pipeline_status !== "in_pool" &&
          r.pipeline_status !== "in_scheduling" &&
          r.pipeline_status !== "hired"
      ),
    [submittedReferrals, inReviewSet, inSchedulingSet, rejectedSet, promotedMap]
  );

  // Referral-specific status filters hide the seeded candidate section
  const REFERRAL_STATUS_FILTERS = new Set(["in_review", "matched_referral", "pending_review"]);

  // Filtered versions apply search + match + status filter to referral sections
  const filteredInReviewReferrals = useMemo(() => {
    // Hide entire section when filtering to a non-pipeline status
    if (statusFilter !== "all" && !REFERRAL_STATUS_FILTERS.has(statusFilter)) return [];
    // Hide when filtering specifically to pending only
    if (statusFilter === "pending_review") return [];
    const q = search.toLowerCase();
    return inReviewReferrals.filter((r) => {
      if (statusFilter === "matched_referral" && !referralMatchedSet.has(r.referral_id)) return false;
      if (q) {
        const hit =
          r.candidate_name.toLowerCase().includes(q) ||
          r.current_employer.toLowerCase().includes(q) ||
          r.skills_claimed?.some((s) => s.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (matchFilter !== "all") {
        const refMatches = liveMatches.filter((m) => m.referral_id === r.referral_id);
        const best = refMatches.sort((a, b) => b.match_score - a.match_score)[0];
        if (!best || classifyScore(best.match_score, thresholds) !== matchFilter) return false;
      }
      return true;
    });
  }, [inReviewReferrals, search, matchFilter, statusFilter, liveMatches, referralMatchedSet, thresholds]);

  const filteredPendingReferrals = useMemo(() => {
    // Hide entire section when filtering to pipeline-specific statuses
    if (statusFilter === "in_review" || statusFilter === "matched_referral") return [];
    // When filtering to pending_review show all pending (no match filter - they may lack scores)
    const q = search.toLowerCase();
    return pendingReferrals.filter((r) => {
      if (!q) return true;
      return (
        r.candidate_name.toLowerCase().includes(q) ||
        r.current_employer.toLowerCase().includes(q) ||
        r.skills_claimed?.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [pendingReferrals, search, statusFilter]);

  // Pipeline stats
  const pipelineStats = useMemo(() => {
    // Seeded candidates: unique candidates where best weight+threshold-adjusted score is Strong Match
    const seededStrong = new Set(
      MATCH_RECORDS
        .filter((m) => classifyScore(computeScore(m, weights), thresholds) === "Strong Match")
        .map((m) => m.candidate_id)
    ).size;

    // Live referrals: recompute classification from score using current thresholds
    const liveStrong = new Set(
      liveMatches
        .filter((m) => classifyScore(m.match_score, thresholds) === "Strong Match")
        .map((m) => m.referral_id)
    ).size;

    const hired = submittedReferrals.filter((r) => r.pipeline_status === "hired").length;
    return { strongMatches: seededStrong + liveStrong, hired };
  }, [liveMatches, submittedReferrals, weights, thresholds]);

  // Total in pipeline = all seeded candidates + all submitted referrals that are not rejected
  const totalPipelineCount = useMemo(
    () =>
      REFERENCE_CANDIDATES.length +
      submittedReferrals.filter((r) => r.pipeline_status !== "not_suitable").length,
    [submittedReferrals]
  );

  // Panel-specific candidate lists for the clickable stat cards
  const panelData = useMemo(() => {
    // Strong match seeded candidates — use weight+threshold-adjusted scores
    const strongSeededIds = new Set(
      MATCH_RECORDS.filter((m) => classifyScore(computeScore(m, weights), thresholds) === "Strong Match").map((m) => m.candidate_id)
    );
    const strongSeeded = REFERENCE_CANDIDATES.filter((c) => strongSeededIds.has(c.candidate_id)).map((c) => {
      const best = MATCH_RECORDS.filter((m) => m.candidate_id === c.candidate_id)
        .sort((a, b) => computeScore(b, weights) - computeScore(a, weights))[0];
      const score = best ? computeScore(best, weights) : null;
      return {
        id: c.candidate_id,
        name: c.name,
        employer: c.current_employer,
        yearsExp: c.years_experience,
        location: c.location,
        score,
        classification: score !== null ? classifyScore(score, thresholds) : null,
        href: `/reference/candidates`,
        type: "seeded" as const,
      };
    });
    const strongLiveIds = new Set(
      liveMatches.filter((m) => m.classification === "Strong Match").map((m) => m.referral_id)
    );
    const strongLive = submittedReferrals
      .filter((r) => strongLiveIds.has(r.referral_id))
      .map((r) => {
        const best = liveMatches.filter((m) => m.referral_id === r.referral_id)
          .sort((a, b) => b.match_score - a.match_score)[0];
        return {
          id: r.referral_id,
          name: r.candidate_name,
          employer: r.current_employer,
          yearsExp: r.years_experience,
          location: r.location,
          score: best ? Math.round(best.match_score) : null,
          classification: "Strong Match" as const,
          href: `/reference/referrals/${r.referral_id}`,
          type: "referral" as const,
        };
      });

    // All (total) — seeded + active referrals
    const allSeeded = REFERENCE_CANDIDATES.map((c) => {
      const best = MATCH_RECORDS.filter((m) => m.candidate_id === c.candidate_id)
        .sort((a, b) => computeScore(b, weights) - computeScore(a, weights))[0];
      const score = best ? computeScore(best, weights) : null;
      return {
        id: c.candidate_id,
        name: c.name,
        employer: c.current_employer,
        yearsExp: c.years_experience,
        location: c.location,
        score,
        classification: score !== null ? classifyScore(score, thresholds) : null,
        href: `/reference/candidates`,
        type: "seeded" as const,
      };
    });
    const allLive = submittedReferrals
      .filter((r) => r.pipeline_status !== "not_suitable")
      .map((r) => {
        const best = liveMatches.filter((m) => m.referral_id === r.referral_id)
          .sort((a, b) => b.match_score - a.match_score)[0];
        const score = best ? Math.round(best.match_score) : null;
        return {
          id: r.referral_id,
          name: r.candidate_name,
          employer: r.current_employer,
          yearsExp: r.years_experience,
          location: r.location,
          score,
          classification: score !== null ? classifyScore(score, thresholds) : null,
          href: `/reference/referrals/${r.referral_id}`,
          type: "referral" as const,
        };
      });

    // Pending — submitted referrals awaiting review
    const pendingList = pendingReferrals.map((r) => ({
      id: r.referral_id,
      name: r.candidate_name,
      employer: r.current_employer,
      yearsExp: r.years_experience,
      location: r.location,
      score: null as number | null,
      classification: null as "Strong Match" | "Partial Match" | "No Match" | null,
      href: `/reference/referrals/${r.referral_id}`,
      type: "referral" as const,
    }));

    // In Scheduling
    const schedulingList = schedulingReferrals.map((r) => {
      const best = liveMatches.filter((m) => m.referral_id === r.referral_id)
        .sort((a, b) => b.match_score - a.match_score)[0];
      const score = best ? Math.round(best.match_score) : null;
      return {
        id: r.referral_id,
        name: r.candidate_name,
        employer: r.current_employer,
        yearsExp: r.years_experience,
        location: r.location,
        score,
        classification: score !== null ? classifyScore(score, thresholds) : null,
        href: `/reference/referrals/${r.referral_id}`,
        type: "referral" as const,
      };
    });

    // Hired
    const hiredList = submittedReferrals
      .filter((r) => r.pipeline_status === "hired")
      .map((r) => ({
        id: r.referral_id,
        name: r.candidate_name,
        employer: r.current_employer,
        yearsExp: r.years_experience,
        location: r.location,
        score: null as number | null,
        classification: null as "Strong Match" | "Partial Match" | "No Match" | null,
        href: `/reference/referrals/${r.referral_id}`,
        type: "referral" as const,
      }));

    return {
      total: [...allSeeded, ...allLive],
      strong: [...strongSeeded, ...strongLive],
      pending: pendingList,
      scheduling: schedulingList,
      hired: hiredList,
    };
  }, [submittedReferrals, liveMatches, pendingReferrals, schedulingReferrals, weights, thresholds]);

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

      {/* ── Pipeline stats bar ── */}
      {submittedReferrals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 -mt-2">
          {([
            { key: "total", label: "Total in Pipeline", value: totalPipelineCount, colorClass: "text-foreground", borderClass: "border-border" },
            { key: "strong", label: "Strong Matches", value: pipelineStats.strongMatches, colorClass: "text-brand-green", borderClass: "border-brand-green/20" },
            { key: "pending", label: "Pending Review", value: pendingReferrals.length, colorClass: "text-brand-cyan", borderClass: "border-brand-cyan/20" },
            { key: "scheduling", label: "In Scheduling", value: schedulingReferrals.length, colorClass: "text-brand-teal", borderClass: "border-brand-teal/20" },
            { key: "hired", label: "Hired", value: pipelineStats.hired, colorClass: "text-brand-gold", borderClass: "border-brand-gold/20" },
          ] as const).map(({ key, label, value, colorClass, borderClass }) => (
            <button
              key={key}
              onClick={() => setActivePanel((prev) => (prev === key ? null : key))}
              className={`bg-white rounded-xl border ${borderClass} shadow-sm px-4 py-3 flex flex-col gap-0.5 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.99] ${activePanel === key ? "ring-2 ring-brand-teal/40" : ""}`}
            >
              <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Slide-in panel for stat card details ── */}
      {activePanel && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground">
              {activePanel === "total" && `All Pipeline Candidates (${panelData.total.length})`}
              {activePanel === "strong" && `Strong Matches (${panelData.strong.length})`}
              {activePanel === "pending" && `Pending Review (${panelData.pending.length})`}
              {activePanel === "scheduling" && `In Scheduling (${panelData.scheduling.length})`}
              {activePanel === "hired" && `Hired (${panelData.hired.length})`}
            </p>
            <button
              onClick={() => setActivePanel(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Panel list */}
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {panelData[activePanel].length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground text-center">No candidates in this stage yet.</p>
            ) : (
              panelData[activePanel].map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors group"
                  onClick={() => setActivePanel(null)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-brand-teal transition-colors truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.employer} · {c.yearsExp}y exp · {c.location}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {c.score !== null && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.classification === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                        : c.classification === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                        : "bg-muted text-muted-foreground"
                      }`}>
                        {c.score}%
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground -rotate-90 group-hover:text-brand-teal transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

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
          <optgroup label="Seeded Candidates">
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </optgroup>
          <optgroup label="Referred Candidates">
            <option value="in_review">In Active Pipeline</option>
            <option value="matched_referral">Matched (Referred)</option>
            <option value="pending_review">Pending Review</option>
          </optgroup>
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
        <div className="bg-white rounded-xl border border-border shadow-sm p-10 flex flex-col items-center text-center gap-3">
          {(search || statusFilter !== "all" || matchFilter !== "all") ? (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">No candidates match your filters</p>
                <p className="text-xs text-muted-foreground mt-1">Try clearing the search or broadening the status / match filter.</p>
              </div>
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); setMatchFilter("all"); }}
                className="text-xs text-brand-teal font-medium hover:underline"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">No candidates yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Refer your first candidate to start building your pipeline. Candidates are scored against open roles automatically.
                </p>
              </div>
              <Link
                href="/reference/submit"
                className="text-xs px-4 py-2 rounded-lg bg-brand-teal text-white font-medium hover:bg-brand-teal/90 transition-colors"
              >
                Submit a Referral
              </Link>
            </>
          )}
        </div>
      )}

      {/* Bulk action toolbar — visible when rows are selected */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-brand-teal/5 border border-brand-teal/20 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-brand-teal">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-border" />

          {/* Bulk status update */}
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-teal/30 bg-white"
            >
              <option value="">Set status…</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button
              onClick={applyBulkStatus}
              disabled={!bulkStatus || bulkApplying}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Bulk decision */}
          <div className="flex items-center gap-2">
            <select
              value={bulkDecision ?? ""}
              onChange={(e) => setBulkDecision(e.target.value as DecisionValue || null)}
              className="border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-teal/30 bg-white"
            >
              <option value="">Set decision…</option>
              <option value="PROCEED">Proceed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="NOT_SUITABLE">Not Suitable</option>
            </select>
            <button
              onClick={applyBulkDecision}
              disabled={!bulkDecision || bulkApplying}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-charcoal text-white hover:bg-brand-charcoal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {bulkApplying ? <Loader2 className="w-3 h-3 animate-spin" /> : "Record"}
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Bulk CSV export */}
          <button
            onClick={exportSelectedCsv}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Selected
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear selection
          </button>

          {bulkResult === "success" && (
            <span className="text-xs text-brand-green flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Applied
            </span>
          )}
          {bulkResult === "error" && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Failed
            </span>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-muted-foreground -mt-2">
        Showing {filtered.length} seeded · {filteredInReviewReferrals.length} in pipeline · {filteredPendingReferrals.length} pending review
        {selectedIds.size > 0 && <span className="text-brand-teal ml-2">· {selectedIds.size} selected</span>}
      </p>

      {/* Select-all toggle — only shown when there are visible candidates */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="h-4 w-4 text-brand-teal" />
            ) : selectedIds.size > 0 ? (
              <Minus className="h-4 w-4 text-brand-teal" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.map((candidate) => {
          const ref = REFERENCES.find((r) => r.reference_id === candidate.reference_id);
          const matches = MATCH_RECORDS.filter((m) => m.candidate_id === candidate.candidate_id);
          const bestMatch = bestMatchByCandidate[candidate.candidate_id];
          const candDays = ref ? daysSince(ref.submission_date) : 0;
          const candMatched = matches.filter((m) => classifyScore(computeScore(m, weights), thresholds) !== "No Match").length;
          const candContacted = contactSummary[candidate.reference_id] ?? 0;
          const candStale = candDays > 14 && candContacted === 0;
          const scoreExpanded = expandedScores.has(candidate.candidate_id);
          const dec = decisions[candidate.candidate_id] ?? { decision: null, reasonCode: "" };
          const effectiveStatus = statusOverridesMap[candidate.candidate_id] ?? candidate.pool_status;
          const bestRecomputed = bestMatch ? computeScore(bestMatch, weights) : candidate.candidate_score;
          const bestRecomputedClass = bestMatch ? classifyScore(bestRecomputed, thresholds) : null;
          const isSelected = selectedIds.has(candidate.candidate_id);

          return (
            <div
              key={candidate.candidate_id}
              className="bg-white rounded-xl border border-border shadow-sm p-5"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelect(candidate.candidate_id)}
                    className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-brand-teal transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-teal" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
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
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                      candStale
                        ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {candDays}d · {candMatched} matched · {candContacted} contacted
                    </span>
                  </div>
                  </div>
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
                      const rClass = classifyScore(rc, thresholds);
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
                        const rClass = classifyScore(rc, thresholds);
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

      {/* ── Active Pipeline — in_review referrals ── */}
      {filteredInReviewReferrals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Active Pipeline</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-medium">
              {filteredInReviewReferrals.length}
            </span>
            <span className="text-xs text-muted-foreground">· Referrals under active review</span>
          </div>

          <div className="grid gap-4">
            {filteredInReviewReferrals.map((referral) => {
              const matches = liveMatches.filter((m) => m.referral_id === referral.referral_id);
              const latestByJob = matches.reduce<Record<string, LiveMatchRecord>>((acc, m) => {
                const existing = acc[m.posting_id];
                if (!existing || m.evaluated_date >= existing.evaluated_date) acc[m.posting_id] = m;
                return acc;
              }, {});
              const sortedMatches = Object.values(latestByJob).sort((a, b) => b.match_score - a.match_score);
              const bestMatch = sortedMatches[0] ?? null;
              const refDays = daysSince(referral.submitted_at);
              const refContacted = contactSummary[referral.referral_id] ?? 0;
              const refStale = refDays > 14 && refContacted === 0;
              const liveScoreExpanded = expandedLiveScores.has(referral.referral_id);
              const dec = decisions[referral.referral_id] ?? { decision: null, reasonCode: "" };
              const isMatched = referralMatchedSet.has(referral.referral_id);
              const isApplying = applyingDecisionId === referral.referral_id;

              return (
                <div key={referral.referral_id} className={`bg-white rounded-xl border shadow-sm p-5 ${
                  isMatched ? "border-brand-teal/40" : "border-brand-green/30"
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/reference/referrals/${referral.referral_id}`}
                          className="font-semibold text-foreground hover:text-brand-teal hover:underline"
                        >
                          {referral.candidate_name}
                        </Link>
                        {isMatched ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Proceeding
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-medium flex items-center gap-1">
                            <UserPlus className="h-3 w-3" />
                            In Active Pipeline
                          </span>
                        )}
                        {referral.availability && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
                            {referral.availability}
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
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          refStale
                            ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {refDays}d in pipeline · {refContacted} contacted
                        </span>
                      </div>
                    </div>
                    {bestMatch && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-bold text-foreground">{bestMatch.match_score}</span>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          classifyScore(bestMatch.match_score, thresholds) === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                            : classifyScore(bestMatch.match_score, thresholds) === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          {classifyScore(bestMatch.match_score, thresholds)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills claimed */}
                  {referral.skills_claimed?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {referral.skills_claimed.map((skill, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-md font-medium bg-muted text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Job matches */}
                  {sortedMatches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-muted-foreground">Job Matches</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {sortedMatches[0]?.scoring_method === "ai" ? "Claude AI" : "Rule-based"}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleLiveScore(referral.referral_id)}
                          className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                        >
                          Score breakdown
                          {liveScoreExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sortedMatches.map((m) => {
                          const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                          const mClass = classifyScore(m.match_score, thresholds);
                          return (
                            <div key={m.match_id} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-3 py-1.5">
                              <span className="text-muted-foreground">{jobTitle}</span>
                              <span className="font-semibold text-foreground">{m.match_score}</span>
                              <span className={
                                mClass === "Strong Match" ? "text-brand-green"
                                  : mClass === "Partial Match" ? "text-brand-gold"
                                    : "text-muted-foreground"
                              }>· {mClass}</span>
                            </div>
                          );
                        })}
                      </div>
                      {liveScoreExpanded && (
                        <div className="mt-3 space-y-2">
                          {sortedMatches.map((m) => {
                            const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                            const mClass = classifyScore(m.match_score, thresholds);
                            return (
                              <div key={m.match_id} className="bg-muted rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-foreground">{jobTitle}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    mClass === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                                      : mClass === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                                        : "bg-muted text-muted-foreground"
                                  }`}>
                                    {m.match_score} · {mClass}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {[
                                    { label: "Skill Overlap", value: m.skill_overlap_score },
                                    { label: "Experience",    value: m.experience_score },
                                    { label: "Location",      value: m.location_score },
                                    { label: "Seniority",     value: m.seniority_score },
                                  ].map((item) => (
                                    <div key={item.label} className="text-center">
                                      <p className="text-xs text-muted-foreground">{item.label}</p>
                                      <p className="text-lg font-bold text-foreground">{item.value}</p>
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

                  {/* Recruiter Decision */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recruiter Decision</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setReferralDecision(referral.referral_id, dec.decision === "PROCEED" ? null : "PROCEED")}
                        disabled={isApplying}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
                          dec.decision === "PROCEED"
                            ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                            : "bg-white text-muted-foreground border-border hover:border-brand-green/40 hover:text-brand-green"
                        }`}
                      >
                        {isApplying && dec.decision !== "PROCEED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Proceed
                      </button>
                      <button
                        onClick={() => setReferralDecision(referral.referral_id, dec.decision === "ON_HOLD" ? null : "ON_HOLD")}
                        disabled={isApplying}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
                          dec.decision === "ON_HOLD"
                            ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
                            : "bg-white text-muted-foreground border-border hover:border-brand-gold/40 hover:text-brand-gold"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        On Hold
                      </button>
                      <button
                        onClick={() => setReferralDecision(referral.referral_id, dec.decision === "NOT_SUITABLE" ? null : "NOT_SUITABLE")}
                        disabled={isApplying}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${
                          dec.decision === "NOT_SUITABLE"
                            ? "bg-red-100 text-red-600 border-red-200"
                            : "bg-white text-muted-foreground border-border hover:border-red-200 hover:text-red-500"
                        }`}
                      >
                        {isApplying && dec.decision === "NOT_SUITABLE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                        Not Suitable
                      </button>
                    </div>
                    {dec.decision === "NOT_SUITABLE" && (
                      <div className="mt-2">
                        <select
                          value={dec.reasonCode}
                          onChange={(e) => setReferralReasonCode(referral.referral_id, e.target.value)}
                          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-200"
                        >
                          <option value="">Select reason…</option>
                          {REASON_CODES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {dec.decision === "PROCEED" && (
                      <p className="mt-2 text-xs text-brand-teal">
                        ✓ Moved to Interview Scheduling — candidate forwarded to the scheduling queue.
                      </p>
                    )}
                    {dec.decision === "ON_HOLD" && (
                      <p className="mt-2 text-xs text-muted-foreground">✓ Placed on hold — no status change.</p>
                    )}
                    {dec.decision === "NOT_SUITABLE" && dec.reasonCode && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        ✓ Marked not suitable · {REASON_CODES.find((r) => r.value === dec.reasonCode)?.label}
                      </p>
                    )}
                  </div>

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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── In Interview Scheduling ── */}
      {schedulingReferrals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-brand-teal" />
            <h2 className="text-sm font-semibold text-foreground">Interview Scheduling</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
              {schedulingReferrals.length}
            </span>
            <span className="text-xs text-muted-foreground">· Approved and forwarded to scheduling</span>
          </div>

          <div className="grid gap-4">
            {schedulingReferrals.map((referral) => {
              const matches = liveMatches.filter((m) => m.referral_id === referral.referral_id);
              const latestByJob = matches.reduce<Record<string, LiveMatchRecord>>((acc, m) => {
                const existing = acc[m.posting_id];
                if (!existing || m.evaluated_date >= existing.evaluated_date) acc[m.posting_id] = m;
                return acc;
              }, {});
              const sortedMatches = Object.values(latestByJob).sort((a, b) => b.match_score - a.match_score);
              const bestMatch = sortedMatches[0] ?? null;

              return (
                <div key={referral.referral_id} className="bg-white rounded-xl border border-brand-teal/30 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/reference/referrals/${referral.referral_id}`}
                          className="font-semibold text-foreground hover:text-brand-teal hover:underline"
                        >
                          {referral.candidate_name}
                        </Link>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          In Scheduling
                        </span>
                        {referral.availability && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
                            {referral.availability}
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
                          classifyScore(bestMatch.match_score, thresholds) === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                            : classifyScore(bestMatch.match_score, thresholds) === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          {classifyScore(bestMatch.match_score, thresholds)}
                        </span>
                      </div>
                    )}
                  </div>

                  {referral.skills_claimed?.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {referral.skills_claimed.map((skill, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-md font-medium bg-muted text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-brand-teal">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Recruiter approved · forwarded to interview scheduling</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/schedule/candidates"
                        className="text-xs text-brand-teal font-medium hover:underline"
                      >
                        View in Scheduling →
                      </Link>
                      <Link
                        href={`/reference/referrals/${referral.referral_id}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Referral record →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recently Submitted Referrals ── */}
      {filteredPendingReferrals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-foreground">Recently Submitted</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan font-medium">
              {filteredPendingReferrals.length}
            </span>
            <span className="text-xs text-muted-foreground">· Pending recruiter review</span>
          </div>

          <div className="grid gap-4">
            {filteredPendingReferrals.map((referral) => {
              // Hard guard: referrals in Active Pipeline must never appear here
              if (inReviewSet.has(referral.referral_id)) return null;

              const matches = liveMatches.filter((m) => m.referral_id === referral.referral_id);
              // Deduplicate: keep the latest match per posting_id (handles re-score runs)
              const latestByJob = matches.reduce<Record<string, LiveMatchRecord>>((acc, m) => {
                const existing = acc[m.posting_id];
                if (!existing || m.evaluated_date >= existing.evaluated_date) acc[m.posting_id] = m;
                return acc;
              }, {});
              const sortedMatches = Object.values(latestByJob).sort((a, b) => b.match_score - a.match_score);
              const refDays = daysSince(referral.submitted_at);
              const refMatched = sortedMatches.filter((m) => classifyScore(m.match_score, thresholds) !== "No Match").length;
              const refContacted = contactSummary[referral.referral_id] ?? 0;
              const refStale = refDays > 14 && refContacted === 0;
              const bestMatch = sortedMatches[0] ?? null;
              const bestMatchClass = bestMatch ? classifyScore(bestMatch.match_score, thresholds) : null;
              const liveScoreExpanded = expandedLiveScores.has(referral.referral_id);
              const isPromoted = !!promotedMap[referral.referral_id];
              const isRejected = rejectedSet.has(referral.referral_id);
              const isMovingToPipeline = movingToPipelineId === referral.referral_id;
              const isPromoteFormOpen = activePromoteId === referral.referral_id;
              const hasStrongMatch = bestMatchClass === "Strong Match";
              const hasGoodMatch = bestMatch && bestMatchClass !== "No Match";

              const cardBorder = isPromoted
                ? "border-brand-teal/30"
                : isRejected
                  ? "border-muted"
                  : hasStrongMatch
                    ? "border-brand-green/25"
                    : "border-brand-cyan/20";

              return (
                <div key={referral.referral_id} className={`bg-white rounded-xl border shadow-sm p-5 ${cardBorder}`}>

                  {/* ── Header ── */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/reference/referrals/${referral.referral_id}`}
                          className={`font-semibold hover:underline ${isRejected ? "text-muted-foreground" : "text-foreground hover:text-brand-teal"}`}
                        >
                          {referral.candidate_name}
                        </Link>
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
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          refStale
                            ? "bg-brand-gold/10 text-brand-gold border-brand-gold/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {refDays}d · {refMatched} matched · {refContacted} contacted
                        </span>
                      </div>
                    </div>
                    {bestMatch && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-bold text-foreground">{bestMatch.match_score}</span>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          bestMatchClass === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                            : bestMatchClass === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                              : "bg-muted text-muted-foreground"
                        }`}>{bestMatchClass}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Job Matches ── */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Job Matches</p>
                        {sortedMatches.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {sortedMatches[0]?.scoring_method === "ai" ? "Claude AI" : "Rule-based"}
                          </span>
                        )}
                      </div>
                      {sortedMatches.length > 0 && (
                        <button
                          onClick={() => toggleLiveScore(referral.referral_id)}
                          className="flex items-center gap-1 text-xs text-brand-teal hover:underline"
                        >
                          Score breakdown
                          {liveScoreExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      )}
                    </div>

                    {sortedMatches.length === 0 ? (
                      <div className="flex items-start gap-2 bg-brand-gold/10 border border-brand-gold/20 rounded-lg px-3 py-2.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-brand-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-brand-gold">No scores yet</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Scores will appear here once computed.{" "}
                            <a href={`/reference/referrals/${referral.referral_id}`} className="text-brand-teal hover:underline">View referral details</a>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sortedMatches.map((m) => {
                          const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                          const mClass = classifyScore(m.match_score, thresholds);
                          return (
                            <div key={m.match_id} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-3 py-1.5">
                              <span className="text-muted-foreground">{jobTitle}</span>
                              <span className="font-semibold text-foreground">{m.match_score}</span>
                              <span className={
                                mClass === "Strong Match" ? "text-brand-green"
                                  : mClass === "Partial Match" ? "text-brand-gold"
                                    : "text-muted-foreground"
                              }>· {mClass}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Score breakdown panel */}
                    {liveScoreExpanded && sortedMatches.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {sortedMatches.map((m) => {
                          const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                          const mClass = classifyScore(m.match_score, thresholds);
                          return (
                            <div key={m.match_id} className="bg-muted rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-foreground">{jobTitle}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  mClass === "Strong Match" ? "bg-brand-green/10 text-brand-green"
                                    : mClass === "Partial Match" ? "bg-brand-gold/10 text-brand-gold"
                                      : "bg-muted text-muted-foreground"
                                }`}>
                                  {m.match_score} · {mClass}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                  { label: "Skill Overlap", value: m.skill_overlap_score },
                                  { label: "Experience",    value: m.experience_score },
                                  { label: "Location",      value: m.location_score },
                                  { label: "Seniority",     value: m.seniority_score },
                                ].map((item) => (
                                  <div key={item.label} className="text-center">
                                    <p className="text-xs text-muted-foreground">{item.label}</p>
                                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Referrer note ── */}
                  {referral.referrer_note && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">"{referral.referrer_note}"</p>
                    </div>
                  )}

                  {/* ── Recruiter actions (only when pending — in_review referrals never reach this section) ── */}
                  {!isPromoted && !isRejected && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {/* P2.3 — Strong match auto-suggest */}
                      {hasStrongMatch && (
                        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-brand-green/5 border border-brand-green/20">
                          <TrendingUp className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
                          <p className="text-xs text-brand-green">
                            Strong match ({bestMatch!.match_score}/100) — this candidate is ready for the active pipeline.
                          </p>
                        </div>
                      )}
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recruiter Decision</p>
                      <div className="flex gap-2 flex-wrap">
                        {/* P2.1 — Add to Active Pipeline button (shown when score is Strong or Partial) */}
                        {hasGoodMatch && (
                          <button
                            onClick={() => handleMoveToPipeline(referral.referral_id)}
                            disabled={isMovingToPipeline}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border border-brand-green/40 bg-brand-green/5 text-brand-green hover:bg-brand-green/10 transition-colors disabled:opacity-50"
                          >
                            {isMovingToPipeline
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <UserPlus className="h-3.5 w-3.5" />}
                            {isMovingToPipeline ? "Moving…" : "Add to Pipeline"}
                          </button>
                        )}
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
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Notify Recruiter <span className="opacity-50">(email — overrides default)</span>
                              </label>
                              <input
                                type="email"
                                value={promoteRecruiterEmail}
                                onChange={(e) => setPromoteRecruiterEmail(e.target.value)}
                                placeholder="recruiter@company.com"
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
