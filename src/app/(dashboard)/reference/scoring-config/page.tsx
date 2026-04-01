"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { REFERENCE_JOBS } from "@/data/reference/jobs";
import {
  Settings2,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Info,
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

export default function ScoringConfigPage() {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [saved, setSaved] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load current weights from API on mount
  useEffect(() => {
    fetch("/api/reference/scoring-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.weights) {
          setWeights(data.weights);
          setSaved(data.weights);
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
                        {m.match_id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" title={m.posting_id}>
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
    </div>
  );
}
