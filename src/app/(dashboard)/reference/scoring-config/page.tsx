"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { REFERENCE_JOBS, OPEN_JOBS } from "@/data/reference/jobs";
import {
  Settings2,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Info,
  Sliders,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  Users,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface ScoringWeights {
  skill: number;
  experience: number;
  location: number;
  seniority: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  skill: 50,
  experience: 25,
  location: 15,
  seniority: 10,
};

// ── Weight descriptors ─────────────────────────────────────────────

const WEIGHT_META: {
  key: keyof ScoringWeights;
  label: string;
  description: string;
  color: string;
  trackColor: string;
}[] = [
  {
    key: "skill",
    label: "Skill Match",
    description: "How closely the candidate's skills overlap with the job's required skills.",
    color: "text-brand-teal",
    trackColor: "bg-brand-teal",
  },
  {
    key: "experience",
    label: "Experience",
    description: "Whether the candidate's years of experience fall within the job's required range.",
    color: "text-brand-gold",
    trackColor: "bg-brand-gold",
  },
  {
    key: "location",
    label: "Location",
    description: "Geographic proximity or match between candidate location and job location.",
    color: "text-brand-pink",
    trackColor: "bg-brand-pink",
  },
  {
    key: "seniority",
    label: "Seniority",
    description: "Alignment between the candidate's seniority level and the job's expected level.",
    color: "text-purple-500",
    trackColor: "bg-purple-500",
  },
];

// ── Score helpers ──────────────────────────────────────────────────

function computeScore(
  m: { skill_overlap_score: number; experience_score: number; location_score: number; seniority_score: number },
  w: ScoringWeights
): number {
  return Math.round(
    (m.skill_overlap_score * w.skill +
      m.experience_score * w.experience +
      m.location_score * w.location +
      m.seniority_score * w.seniority) /
      100
  );
}

function classifyScore(score: number): "Strong Match" | "Partial Match" | "No Match" {
  return score >= 70 ? "Strong Match" : score >= 50 ? "Partial Match" : "No Match";
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  "Strong Match": "bg-brand-green/10 text-brand-green",
  "Partial Match": "bg-brand-gold/10 text-brand-gold",
  "No Match": "bg-muted text-muted-foreground",
};

// ── Job title lookup ───────────────────────────────────────────────

const JOB_TITLE: Record<string, string> = Object.fromEntries(
  REFERENCE_JOBS.map((j) => [j.id, j.title])
);

// ── Preview sample — first 6 seeded match records ─────────────────

const PREVIEW_RECORDS = MATCH_RECORDS.slice(0, 6);

// ── Component ──────────────────────────────────────────────────────

interface JobOverrideEntry {
  job_id: string;
  title: string;
  department: string;
  has_override: boolean;
  effective_weights: ScoringWeights;
  override: ScoringWeights | null;
}

export default function ScoringConfigPage() {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [saved, setSaved] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Bulk re-score state
  const [rescoreRunning, setRescoreRunning] = useState(false);
  const [rescoreProgress, setRescoreProgress] = useState<{ done: number; total: number } | null>(null);
  const [rescoreResults, setRescoreResults] = useState<{
    total: number;
    improved: number;
    unchanged: number;
    decreased: number;
    rows: { name: string; oldBest: number | null; newBest: number; delta: number }[];
  } | null>(null);
  const [rescoreError, setRescoreError] = useState<string | null>(null);

  // Per-job overrides state
  const [jobEntries, setJobEntries] = useState<JobOverrideEntry[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobDrafts, setJobDrafts] = useState<Record<string, ScoringWeights>>({});
  const [jobSaving, setJobSaving] = useState<string | null>(null);
  const [jobSaveStatus, setJobSaveStatus] = useState<Record<string, "idle" | "success" | "error">>({});

  // Load current weights + job overrides from API on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/reference/scoring-config").then((r) => r.json()),
      fetch("/api/reference/job-weights").then((r) => r.json()),
    ])
      .then(([configData, jobData]) => {
        if (configData.weights) {
          setWeights(configData.weights);
          setSaved(configData.weights);
        }
        if (jobData.jobs) {
          setJobEntries(jobData.jobs);
          const drafts: Record<string, ScoringWeights> = {};
          for (const j of jobData.jobs as JobOverrideEntry[]) {
            drafts[j.job_id] = { ...j.effective_weights };
          }
          setJobDrafts(drafts);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = weights.skill + weights.experience + weights.location + weights.seniority;
  const isValid = total === 100;
  const isDirty =
    weights.skill !== saved.skill ||
    weights.experience !== saved.experience ||
    weights.location !== saved.location ||
    weights.seniority !== saved.seniority;

  // When one slider changes, auto-adjust the remaining weights proportionally
  // so the total stays at 100.
  const handleSliderChange = useCallback(
    (key: keyof ScoringWeights, newValue: number) => {
      setWeights((prev) => {
        const others = (Object.keys(prev) as (keyof ScoringWeights)[]).filter((k) => k !== key);
        const remaining = 100 - newValue;
        const currentOtherTotal = others.reduce((sum, k) => sum + prev[k], 0);

        const next = { ...prev, [key]: newValue };
        if (currentOtherTotal === 0) {
          // Distribute evenly among others
          const share = Math.floor(remaining / others.length);
          others.forEach((k, i) => {
            next[k] = i === others.length - 1 ? remaining - share * (others.length - 1) : share;
          });
        } else {
          // Scale proportionally
          let distributed = 0;
          others.forEach((k, i) => {
            if (i === others.length - 1) {
              next[k] = remaining - distributed;
            } else {
              const scaled = Math.round((prev[k] / currentOtherTotal) * remaining);
              next[k] = Math.max(0, scaled);
              distributed += next[k];
            }
          });
        }
        return next;
      });
      setSaveStatus("idle");
    },
    []
  );

  const handleInputChange = (key: keyof ScoringWeights, raw: string) => {
    const val = Math.max(0, Math.min(100, Number(raw) || 0));
    setWeights((prev) => ({ ...prev, [key]: val }));
    setSaveStatus("idle");
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);
    try {
      const res = await fetch("/api/reference/scoring-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus("error");
        setSaveError(data.error ?? "Failed to save");
      } else {
        setSaved(data.weights ?? weights);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch {
      setSaveStatus("error");
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  // ── Bulk re-score handler ───────────────────────────────────────

  async function handleBulkRescore() {
    if (rescoreRunning) return;
    setRescoreRunning(true);
    setRescoreResults(null);
    setRescoreError(null);
    setRescoreProgress(null);

    try {
      // 1. Fetch all submitted referrals
      const refRes = await fetch("/api/reference/submit");
      const refData = await refRes.json();
      const referrals: { referral_id: string; candidate_name: string }[] = refData.referrals ?? [];

      if (referrals.length === 0) {
        setRescoreError("No submitted referrals found. Submit a referral first.");
        setRescoreRunning(false);
        return;
      }

      // 2. Fetch current best scores for each referral (before rescoring)
      const matchRes = await fetch("/api/reference/live-matches");
      const matchData = await matchRes.json();
      const allMatches: { referral_id: string; match_score: number }[] = matchData.matches ?? [];

      const oldBestByReferral: Record<string, number> = {};
      for (const m of allMatches) {
        const current = oldBestByReferral[m.referral_id];
        if (current === undefined || m.match_score > current) {
          oldBestByReferral[m.referral_id] = m.match_score;
        }
      }

      // 3. Re-score each referral sequentially, updating progress
      setRescoreProgress({ done: 0, total: referrals.length });
      const rows: { name: string; oldBest: number | null; newBest: number; delta: number }[] = [];

      for (let i = 0; i < referrals.length; i++) {
        const r = referrals[i];
        try {
          const res = await fetch("/api/reference/rescore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referral_id: r.referral_id }),
          });
          const data = await res.json();
          const newMatches: { match_score: number }[] = data.match_results ?? [];
          const newBest = newMatches.length > 0
            ? Math.max(...newMatches.map((m) => m.match_score))
            : 0;
          const oldBest = oldBestByReferral[r.referral_id] ?? null;
          rows.push({
            name: r.candidate_name,
            oldBest,
            newBest,
            delta: oldBest !== null ? newBest - oldBest : 0,
          });
        } catch {
          rows.push({ name: r.candidate_name, oldBest: null, newBest: 0, delta: 0 });
        }
        setRescoreProgress({ done: i + 1, total: referrals.length });
      }

      // 4. Summarise
      const improved  = rows.filter((r) => r.delta > 0).length;
      const decreased = rows.filter((r) => r.delta < 0).length;
      const unchanged = rows.filter((r) => r.delta === 0).length;
      setRescoreResults({ total: rows.length, improved, unchanged, decreased, rows });
    } catch {
      setRescoreError("Failed to complete bulk re-score. Please try again.");
    } finally {
      setRescoreRunning(false);
    }
  }

  // ── Per-job override handlers ───────────────────────────────────

  function handleJobSliderChange(jobId: string, key: keyof ScoringWeights, newValue: number) {
    setJobDrafts((prev) => {
      const current = prev[jobId] ?? DEFAULT_WEIGHTS;
      const others = (Object.keys(current) as (keyof ScoringWeights)[]).filter((k) => k !== key);
      const remaining = 100 - newValue;
      const currentOtherTotal = others.reduce((s, k) => s + current[k], 0);
      const next = { ...current, [key]: newValue };
      if (currentOtherTotal === 0) {
        const share = Math.floor(remaining / others.length);
        others.forEach((k, i) => {
          next[k] = i === others.length - 1 ? remaining - share * (others.length - 1) : share;
        });
      } else {
        let distributed = 0;
        others.forEach((k, i) => {
          if (i === others.length - 1) {
            next[k] = remaining - distributed;
          } else {
            const scaled = Math.round((current[k] / currentOtherTotal) * remaining);
            next[k] = Math.max(0, scaled);
            distributed += next[k];
          }
        });
      }
      return { ...prev, [jobId]: next };
    });
    setJobSaveStatus((p) => ({ ...p, [jobId]: "idle" }));
  }

  async function saveJobOverride(jobId: string) {
    const draft = jobDrafts[jobId];
    if (!draft) return;
    setJobSaving(jobId);
    setJobSaveStatus((p) => ({ ...p, [jobId]: "idle" }));
    try {
      const res = await fetch("/api/reference/job-weights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, weights: draft }),
      });
      if (res.ok) {
        setJobEntries((prev) =>
          prev.map((j) => j.job_id === jobId ? { ...j, has_override: true, override: draft, effective_weights: draft } : j)
        );
        setJobSaveStatus((p) => ({ ...p, [jobId]: "success" }));
        setTimeout(() => setJobSaveStatus((p) => ({ ...p, [jobId]: "idle" })), 3000);
      } else {
        setJobSaveStatus((p) => ({ ...p, [jobId]: "error" }));
      }
    } catch {
      setJobSaveStatus((p) => ({ ...p, [jobId]: "error" }));
    } finally {
      setJobSaving(null);
    }
  }

  async function clearJobOverride(jobId: string) {
    setJobSaving(jobId);
    try {
      await fetch("/api/reference/job-weights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      setJobEntries((prev) =>
        prev.map((j) => j.job_id === jobId ? { ...j, has_override: false, override: null, effective_weights: saved } : j)
      );
      setJobDrafts((prev) => ({ ...prev, [jobId]: { ...saved } }));
    } catch { /* silent */ } finally {
      setJobSaving(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scoring Configuration"
        description="Adjust the weights used to compute candidate match scores against open job postings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: weight controls ─────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-foreground">Match Score Weights</h3>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full font-medium ${
                  isValid
                    ? "bg-brand-green/10 text-brand-green"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                Total: {total}/100
              </span>
            </div>

            {!isValid && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Weights must sum to exactly 100. Current total: {total}
              </div>
            )}

            {/* Sliders */}
            <div className="space-y-5">
              {WEIGHT_META.map(({ key, label, description, color, trackColor }) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-medium ${color}`}>{label}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        — {description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={weights[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-14 text-right text-sm font-mono border border-border rounded-md px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Description on mobile */}
                  <p className="text-xs text-muted-foreground sm:hidden">{description}</p>

                  {/* Slider */}
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-150 ${trackColor}`}
                      style={{ width: `${weights[key]}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={weights[key]}
                      onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Visual bar breakdown */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Weight distribution</p>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {WEIGHT_META.map(({ key, trackColor }) => (
                  <div
                    key={key}
                    className={`transition-all duration-150 ${trackColor}`}
                    style={{ width: `${weights[key]}%` }}
                    title={`${WEIGHT_META.find((m) => m.key === key)?.label}: ${weights[key]}%`}
                  />
                ))}
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                {WEIGHT_META.map(({ key, label, color, trackColor }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${trackColor}`} />
                    <span className={`text-xs ${color}`}>
                      {label} {weights[key]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={handleSave}
                disabled={!isValid || saving || !isDirty}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saving ? "Saving…" : "Save Weights"}
              </button>

              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Defaults
              </button>

              {saveStatus === "success" && (
                <span className="flex items-center gap-1 text-xs text-brand-green">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Weights saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {saveError}
                </span>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              These weights apply to <strong>new referral submissions</strong>. Existing match
              records retain the scores they were computed with. To re-score existing candidates,
              re-submit them or contact an administrator.
            </p>
          </div>
        </div>

        {/* ── Right: live preview ───────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-foreground">Live Score Preview</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              How existing match records would be re-scored with the current weights.
            </p>

            <div className="space-y-3">
              {PREVIEW_RECORDS.map((m) => {
                const oldScore = m.match_score;
                const newScore = computeScore(m, weights);
                const newClass = classifyScore(newScore);
                const delta = newScore - oldScore;

                return (
                  <div
                    key={m.match_id}
                    className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/40 border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {JOB_TITLE[m.posting_id] ?? m.posting_id}
                      </p>
                      <span
                        className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${CLASSIFICATION_COLORS[newClass]}`}
                      >
                        {newClass}
                      </span>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-sm font-semibold text-foreground">{newScore}</span>
                      {delta !== 0 && (
                        <span
                          className={`text-xs font-medium ${
                            delta > 0 ? "text-brand-green" : "text-destructive"
                          }`}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta}
                        </span>
                      )}
                      {delta === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Showing {PREVIEW_RECORDS.length} of {MATCH_RECORDS.length} seeded records
            </p>
          </div>

          {/* Current saved weights summary */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Current Saved Weights</h3>
            <div className="space-y-2">
              {WEIGHT_META.map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${color}`}>{label}</span>
                  <span className="text-xs font-mono text-foreground">{saved[key]}%</span>
                </div>
              ))}
            </div>
            {isDirty && (
              <p className="text-xs text-brand-gold mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unsaved changes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Re-score Existing Candidates ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-teal/10 flex-shrink-0">
              <Users className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Re-score Existing Candidates</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Apply the current saved weights to all submitted referrals. New match records are appended — existing records are kept for history. Best used after saving new global weights.
              </p>
            </div>
          </div>

          <button
            onClick={handleBulkRescore}
            disabled={rescoreRunning || isDirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title={isDirty ? "Save weights first before re-scoring" : "Re-score all submitted referrals"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescoreRunning ? "animate-spin" : ""}`} />
            {rescoreRunning ? "Re-scoring…" : "Re-score All Candidates"}
          </button>
        </div>

        {isDirty && !rescoreRunning && (
          <div className="mt-4 flex items-center gap-2 text-xs text-brand-gold bg-brand-gold/10 border border-brand-gold/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            You have unsaved weight changes. Save weights first, then re-score.
          </div>
        )}

        {/* Progress bar */}
        {rescoreRunning && rescoreProgress && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Re-scoring candidates…</span>
              <span className="font-mono">{rescoreProgress.done} / {rescoreProgress.total}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-teal rounded-full transition-all duration-300"
                style={{ width: `${(rescoreProgress.done / rescoreProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {rescoreError && (
          <div className="mt-4 flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {rescoreError}
          </div>
        )}

        {/* Results summary */}
        {rescoreResults && !rescoreRunning && (
          <div className="mt-4 space-y-3">
            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
                <span className="text-xs font-medium text-foreground">{rescoreResults.total} rescored</span>
              </div>
              {rescoreResults.improved > 0 && (
                <div className="flex items-center gap-2 bg-brand-green/10 rounded-lg px-3 py-2">
                  <ArrowRight className="w-3.5 h-3.5 text-brand-green rotate-[-45deg]" />
                  <span className="text-xs font-medium text-brand-green">{rescoreResults.improved} improved</span>
                </div>
              )}
              {rescoreResults.unchanged > 0 && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{rescoreResults.unchanged} unchanged</span>
                </div>
              )}
              {rescoreResults.decreased > 0 && (
                <div className="flex items-center gap-2 bg-destructive/10 rounded-lg px-3 py-2">
                  <ArrowRight className="w-3.5 h-3.5 text-destructive rotate-45" />
                  <span className="text-xs font-medium text-destructive">{rescoreResults.decreased} decreased</span>
                </div>
              )}
            </div>

            {/* Per-candidate rows */}
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full min-w-[420px] text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left font-medium text-muted-foreground px-4 py-2">Candidate</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Previous best</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">New best</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-2">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rescoreResults.rows.map((row, i) => (
                    <tr key={i} className="bg-white hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {row.oldBest !== null ? row.oldBest : <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-foreground">{row.newBest}</td>
                      <td className="px-4 py-2 text-right">
                        {row.delta > 0 && (
                          <span className="text-brand-green font-medium">+{row.delta}</span>
                        )}
                        {row.delta < 0 && (
                          <span className="text-destructive font-medium">{row.delta}</span>
                        )}
                        {row.delta === 0 && row.oldBest !== null && (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {row.oldBest === null && (
                          <span className="text-brand-teal font-medium">new</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Per-Job Weight Overrides ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">Per-Job Weight Overrides</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Override global weights for specific roles. Only open jobs are listed.
          </p>
        </div>

        {jobEntries.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading jobs…
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobEntries.map((job) => {
              const isExpanded = expandedJob === job.job_id;
              const draft = jobDrafts[job.job_id] ?? job.effective_weights;
              const draftTotal = draft.skill + draft.experience + draft.location + draft.seniority;
              const isJobDirty = job.has_override
                ? JSON.stringify(draft) !== JSON.stringify(job.override)
                : JSON.stringify(draft) !== JSON.stringify(saved);
              const isSavingThis = jobSaving === job.job_id;
              const status = jobSaveStatus[job.job_id] ?? "idle";

              return (
                <div key={job.job_id}>
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedJob(isExpanded ? null : job.job_id)}
                    className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.department}</p>
                      </div>
                      {job.has_override && (
                        <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
                          Custom weights
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                        {WEIGHT_META.map(({ key, trackColor, label }) => (
                          <span key={key} className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${trackColor} inline-block`} />
                            {job.effective_weights[key]}%
                          </span>
                        ))}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded override panel */}
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 bg-muted/20 border-t border-border">
                      <div className="space-y-4 mt-3">
                        {WEIGHT_META.map(({ key, label, color, trackColor }) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${color}`}>{label}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={draft[key]}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                    setJobDrafts((prev) => ({ ...prev, [job.job_id]: { ...draft, [key]: val } }));
                                  }}
                                  className="w-12 text-right text-xs font-mono border border-border rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </div>
                            <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`absolute left-0 top-0 h-full rounded-full transition-all ${trackColor}`} style={{ width: `${draft[key]}%` }} />
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={draft[key]}
                                onChange={(e) => handleJobSliderChange(job.job_id, key, Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <span className={`text-xs font-mono ${draftTotal === 100 ? "text-brand-green" : "text-destructive"}`}>
                          Total: {draftTotal}/100
                        </span>
                        <button
                          onClick={() => saveJobOverride(job.job_id)}
                          disabled={draftTotal !== 100 || isSavingThis || !isJobDirty}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-teal text-white text-xs font-medium hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSavingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Save Override
                        </button>
                        {job.has_override && (
                          <button
                            onClick={() => clearJobOverride(job.job_id)}
                            disabled={isSavingThis}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Use Global
                          </button>
                        )}
                        {status === "success" && (
                          <span className="flex items-center gap-1 text-xs text-brand-green">
                            <CheckCircle2 className="w-3 h-3" /> Saved
                          </span>
                        )}
                        {status === "error" && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" /> Failed
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
