"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle, Loader2, TrendingUp,
  ChevronDown, ChevronUp, Database, GitBranch, AlertTriangle,
  CheckSquare, Package, Sparkles,
} from "lucide-react";
import { REFERENCE_JOBS } from "@/data/reference/jobs";

// ── Types ─────────────────────────────────────────────────────────

interface SubmittedReferral {
  referral_id: string;
  submitted_at: string;
  referrer_name: string;
  referrer_emp_id: string;
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
  extra_filenames: string[];
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

interface LivePoolEntry {
  pool_id: string;
  referral_id: string;
  experience_level: string;
  status: string;
  date_added: string;
  promoted_at: string;
  promoted_by: string;
}

// ── Field provenance catalogue ──────────────────────────────────────
// Describes every field: what it means to a data engineer.

type FieldSource = "user_input" | "ai_computed" | "system";

interface FieldMeta {
  field: string;
  label: string;
  value: string | number | boolean | null;
  source: FieldSource;
  type: string;
  present: boolean;
}

function buildFieldManifest(r: SubmittedReferral): FieldMeta[] {
  return [
    // System-generated
    { field: "referral_id",    label: "Referral ID",       value: r.referral_id,         source: "system",     type: "string",  present: true },
    { field: "submitted_at",   label: "Submitted At",      value: r.submitted_at,         source: "system",     type: "datetime", present: true },
    { field: "is_duplicate",   label: "Duplicate Flag",    value: r.is_duplicate,         source: "system",     type: "boolean", present: true },
    // User-input: required
    { field: "candidate_name",  label: "Candidate Name",   value: r.candidate_name,       source: "user_input", type: "string",  present: !!r.candidate_name },
    { field: "candidate_email", label: "Candidate Email",  value: r.candidate_email,      source: "user_input", type: "email",   present: !!r.candidate_email },
    { field: "referrer_name",   label: "Referrer Name",    value: r.referrer_name,        source: "user_input", type: "string",  present: !!r.referrer_name },
    { field: "referrer_note",   label: "Referrer Note",    value: r.referrer_note,        source: "user_input", type: "text",    present: !!r.referrer_note },
    // User-input: optional
    { field: "candidate_phone", label: "Phone",            value: r.candidate_phone,      source: "user_input", type: "string",  present: !!r.candidate_phone },
    { field: "current_employer",label: "Employer",         value: r.current_employer,     source: "user_input", type: "string",  present: !!r.current_employer },
    { field: "years_experience",label: "Years Experience", value: r.years_experience,     source: "user_input", type: "number",  present: r.years_experience > 0 },
    { field: "location",        label: "Location",         value: r.location,             source: "user_input", type: "string",  present: !!r.location },
    { field: "availability",    label: "Availability",     value: r.availability,         source: "user_input", type: "string",  present: !!r.availability },
    { field: "linkedin_url",    label: "LinkedIn URL",     value: r.linkedin_url,         source: "user_input", type: "url",     present: !!r.linkedin_url },
    { field: "target_job_id",   label: "Target Job",       value: r.target_job_id,        source: "user_input", type: "string",  present: !!r.target_job_id && r.target_job_id !== "pool" },
    { field: "resume_filename", label: "Resume",           value: r.resume_filename,      source: "user_input", type: "file",    present: !!r.resume_filename },
    { field: "referrer_emp_id", label: "Referrer Emp ID",  value: r.referrer_emp_id,      source: "user_input", type: "string",  present: !!r.referrer_emp_id },
  ];
}

const SOURCE_COLORS: Record<FieldSource, string> = {
  user_input:  "bg-brand-teal/10 text-brand-teal",
  ai_computed: "bg-brand-cyan/10 text-brand-cyan",
  system:      "bg-muted text-muted-foreground",
};

const SOURCE_LABELS: Record<FieldSource, string> = {
  user_input:  "user_input",
  ai_computed: "ai_computed",
  system:      "system",
};

// ── Scoring helpers ────────────────────────────────────────────────

const DEFAULT_WEIGHTS = { skill: 50, experience: 25, location: 15, seniority: 10 };

function classifyScore(s: number) {
  return s >= 70 ? "Strong Match" : s >= 50 ? "Partial Match" : "No Match";
}

// ── Main page ──────────────────────────────────────────────────────

export default function ReferralDetailPage() {
  const { referral_id } = useParams<{ referral_id: string }>();
  const router = useRouter();

  const [referral, setReferral] = useState<SubmittedReferral | null>(null);
  const [matches, setMatches] = useState<LiveMatchRecord[]>([]);
  const [poolEntry, setPoolEntry] = useState<LivePoolEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // AI summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Promotion form state
  const [showPromote, setShowPromote] = useState(false);
  const [expLevel, setExpLevel] = useState<"Junior" | "Mid" | "Senior" | "Lead">("Mid");
  const [roleTags, setRoleTags] = useState("");
  const [locationTags, setLocationTags] = useState("");
  const [skillTags, setSkillTags] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  // Score breakdown toggle per match
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  function toggleMatch(id: string) {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  useEffect(() => {
    fetch(`/api/reference/referrals/${referral_id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setReferral(data.referral);
        setMatches(data.matches ?? []);
        setPoolEntry(data.poolEntry ?? null);
        if (data.referral?.location) setLocationTags(data.referral.location);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [referral_id]);

  async function handlePromote() {
    if (!referral) return;
    setPromoting(true);
    setPromoteError(null);
    try {
      const res = await fetch("/api/reference/promote-to-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referral_id: referral.referral_id,
          experience_level: expLevel,
          preferred_role_tags: roleTags.split(",").map((s) => s.trim()).filter(Boolean),
          location_tags: locationTags.split(",").map((s) => s.trim()).filter(Boolean),
          skill_tags: skillTags.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoteError(data.error ?? "Promotion failed");
      } else {
        // Re-fetch to get poolEntry populated
        const updated = await fetch(`/api/reference/referrals/${referral_id}`).then((r) => r.json());
        setPoolEntry(updated.poolEntry ?? null);
        setShowPromote(false);
      }
    } catch {
      setPromoteError("Network error. Please try again.");
    } finally {
      setPromoting(false);
    }
  }

  async function generateSummary() {
    if (!referral) return;
    setSummaryLoading(true);
    const bestMatch = matches.reduce<LiveMatchRecord | null>(
      (best, m) => (!best || m.match_score > best.match_score ? m : best),
      null
    );
    const bestJob = bestMatch
      ? REFERENCE_JOBS.find((j) => j.id === bestMatch.posting_id)
      : null;

    const allScores = [...matches]
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 3)
      .map((m) => {
        const job = REFERENCE_JOBS.find((j) => j.id === m.posting_id);
        return `${job?.title ?? m.posting_id}: ${m.match_score}/100 (${m.classification})`;
      })
      .join(", ");

    const prompt = `Write a concise 3–4 sentence recruiter assessment for this referred candidate.

Candidate: ${referral.candidate_name}
Experience: ${referral.years_experience} years${referral.current_employer ? ` at ${referral.current_employer}` : ""}${referral.location ? `, based in ${referral.location}` : ""}
Availability: ${referral.availability || "Not specified"}
${bestJob && bestMatch ? `Best AI match: ${bestJob.title} — Score ${bestMatch.match_score}/100 (${bestMatch.classification})` : "No match data yet"}
${allScores ? `All matches: ${allScores}` : ""}
${referral.referrer_note ? `Referrer's note: "${referral.referrer_note}"` : ""}

Cover: overall candidate profile strength based on the match scores, what the AI scoring suggests about fit, and a specific recommendation for next steps (e.g. proceed, request more info, or pass). Be direct and factual.`;

    try {
      const res = await fetch("/api/reference/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setSummary(data.response ?? "Unable to generate summary.");
    } catch {
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !referral) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground">Referral not found.</p>
        </div>
      </div>
    );
  }

  const fieldManifest = buildFieldManifest(referral);
  const filledCount = fieldManifest.filter((f) => f.present).length;
  const completeness = Math.round((filledCount / fieldManifest.length) * 100);

  const aiStageComplete = matches.length > 0;
  const isInPool = !!poolEntry;

  // Pipeline stages
  const stages = [
    { label: "Submitted",     done: true,            icon: CheckCircle2 },
    { label: "AI Scored",     done: aiStageComplete, icon: aiStageComplete ? CheckCircle2 : Circle },
    { label: "Recruiter Review", done: isInPool,     icon: isInPool ? CheckCircle2 : Circle },
    { label: "In Pool",       done: isInPool,        icon: isInPool ? CheckCircle2 : Circle },
  ];

  const bestMatch = matches.reduce<LiveMatchRecord | null>(
    (best, m) => (!best || m.match_score > best.match_score ? m : best),
    null
  );

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link
          href="/reference/candidates"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{referral.candidate_name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {referral.referral_id} · Submitted {new Date(referral.submitted_at).toLocaleDateString("en-CA")}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {referral.is_duplicate && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
                Duplicate
              </span>
            )}
            {isInPool && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
                In Pool · {poolEntry!.pool_id}
              </span>
            )}
            {bestMatch && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                bestMatch.classification === "Strong Match"
                  ? "bg-brand-green/10 text-brand-green"
                  : bestMatch.classification === "Partial Match"
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "bg-muted text-muted-foreground"
              }`}>
                Best match: {bestMatch.match_score} · {bestMatch.classification}
              </span>
            )}
          </div>
        </div>
        {!isInPool && (
          <button
            onClick={() => setShowPromote(!showPromote)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 transition-colors flex-shrink-0"
          >
            <Package className="h-4 w-4" />
            Promote to Pool
          </button>
        )}
      </div>

      {/* ── Pipeline stage tracker ── */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Data Pipeline Status</h2>
        </div>
        <div className="flex items-center gap-0">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const isLast = i === stages.length - 1;
            return (
              <div key={stage.label} className="flex items-center flex-1">
                <div className={`flex flex-col items-center gap-1 flex-1 ${i === 0 ? "items-start" : isLast ? "items-end" : "items-center"}`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${stage.done ? "text-brand-teal" : "text-muted-foreground/40"}`} />
                    <span className={`text-xs font-medium ${stage.done ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {stage.label}
                    </span>
                  </div>
                </div>
                {!isLast && (
                  <div className={`h-px flex-1 mx-2 ${stages[i + 1]?.done ? "bg-brand-teal/40" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Recruiter Summary ── */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-teal" />
            <h2 className="font-semibold text-sm text-foreground">AI Recruiter Summary</h2>
          </div>
          {!summary && (
            <button
              onClick={generateSummary}
              disabled={summaryLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 transition-colors disabled:opacity-50"
            >
              {summaryLoading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing…</>
                : <><Sparkles className="h-3.5 w-3.5" /> Generate Summary</>
              }
            </button>
          )}
        </div>
        {summary ? (
          <div className="mt-3">
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            <button
              onClick={() => setSummary(null)}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Regenerate
            </button>
          </div>
        ) : !summaryLoading && (
          <p className="mt-2 text-xs text-muted-foreground">
            Click to get a concise AI assessment of this referral&apos;s profile strength, match scores, and recommended next step.
          </p>
        )}
      </div>

      {/* ── Promote to Pool form ── */}
      {showPromote && !isInPool && (
        <div className="bg-white rounded-xl border border-brand-teal/30 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-brand-teal" />
            <h2 className="text-sm font-semibold text-foreground">Promote to Talent Pool</h2>
            <span className="text-xs text-muted-foreground ml-1">
              — sets recruiter_input fields on the pool record
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Experience Level <span className="text-red-400">*</span>
              </label>
              <select
                value={expLevel}
                onChange={(e) => setExpLevel(e.target.value as typeof expLevel)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Preferred Roles
                <span className="ml-1 opacity-60">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={roleTags}
                onChange={(e) => setRoleTags(e.target.value)}
                placeholder="e.g. Data Engineer, Analytics Engineer"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Location Tags
                <span className="ml-1 opacity-60">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={locationTags}
                onChange={(e) => setLocationTags(e.target.value)}
                placeholder="e.g. Vancouver, Remote"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Skill Tags
                <span className="ml-1 opacity-60">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={skillTags}
                onChange={(e) => setSkillTags(e.target.value)}
                placeholder="e.g. Python, SQL, dbt"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
          </div>

          {promoteError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {promoteError}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handlePromote}
              disabled={promoting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 disabled:opacity-50 transition-colors"
            >
              {promoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
              {promoting ? "Promoting…" : "Confirm Promotion"}
            </button>
            <button
              onClick={() => setShowPromote(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Pool entry summary (post-promotion) ── */}
      {isInPool && poolEntry && (
        <div className="bg-white rounded-xl border border-brand-teal/30 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-brand-teal" />
            <h2 className="text-sm font-semibold text-foreground">Pool Entry</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium ml-1">
              {poolEntry.pool_id}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {[
              { label: "Status",            value: poolEntry.status,          source: "recruiter_input" },
              { label: "Experience Level",   value: poolEntry.experience_level, source: "recruiter_input" },
              { label: "Date Added",        value: poolEntry.date_added,       source: "system" },
              { label: "Promoted By",       value: poolEntry.promoted_by,      source: "recruiter_input" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-muted-foreground mb-0.5">{item.label}</p>
                <p className="font-medium text-foreground">{item.value}</p>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {item.source}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            View in <Link href="/reference/pool" className="text-brand-teal hover:underline">Talent Pool →</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: Data completeness + field provenance ── */}
        <div className="space-y-4">

          {/* Data completeness */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Data Completeness</h2>
              <span className={`ml-auto text-sm font-bold ${completeness >= 80 ? "text-brand-green" : completeness >= 60 ? "text-brand-gold" : "text-red-500"}`}>
                {completeness}%
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${completeness >= 80 ? "bg-brand-green" : completeness >= 60 ? "bg-brand-gold" : "bg-red-400"}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {filledCount} of {fieldManifest.length} fields populated
            </p>
            <div className="flex gap-3 text-xs">
              {(["user_input", "ai_computed", "system"] as FieldSource[]).map((src) => (
                <span key={src} className={`px-2 py-0.5 rounded font-medium ${SOURCE_COLORS[src]}`}>
                  {src}
                </span>
              ))}
            </div>
          </div>

          {/* Field provenance table */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Field Provenance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground font-medium pb-2 pr-3">Field</th>
                    <th className="text-left text-muted-foreground font-medium pb-2 pr-3">Value</th>
                    <th className="text-left text-muted-foreground font-medium pb-2 pr-3">Source</th>
                    <th className="text-left text-muted-foreground font-medium pb-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldManifest.map((f) => (
                    <tr key={f.field} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 pr-3 font-mono text-muted-foreground">{f.field}</td>
                      <td className="py-1.5 pr-3 text-foreground max-w-[140px] truncate">
                        {f.present
                          ? (typeof f.value === "boolean" ? String(f.value) : String(f.value))
                          : <span className="text-muted-foreground/50 italic">null</span>
                        }
                      </td>
                      <td className="py-1.5 pr-3">
                        <span className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${SOURCE_COLORS[f.source]}`}>
                          {SOURCE_LABELS[f.source]}
                        </span>
                      </td>
                      <td className="py-1.5 font-mono text-muted-foreground/70">{f.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Raw referral data */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Raw Submission</h2>
            <div className="space-y-2">
              {[
                { label: "Candidate Email",   value: referral.candidate_email },
                { label: "Phone",             value: referral.candidate_phone || "—" },
                { label: "Employer",          value: referral.current_employer || "—" },
                { label: "Experience",        value: `${referral.years_experience} years` },
                { label: "Location",          value: referral.location || "—" },
                { label: "Availability",      value: referral.availability || "—" },
                { label: "Target Job",        value: referral.target_job_id === "pool"
                    ? "General Pool"
                    : (REFERENCE_JOBS.find((j) => j.id === referral.target_job_id)?.title ?? referral.target_job_id) },
                { label: "Referrer",          value: referral.referrer_name },
                { label: "Referrer Emp ID",   value: referral.referrer_emp_id || "—" },
                { label: "Resume",            value: referral.resume_filename ?? "Not provided" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-foreground text-right">{row.value}</span>
                </div>
              ))}
            </div>
            {referral.referrer_note && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Referrer Note</p>
                <p className="text-xs text-foreground italic">"{referral.referrer_note}"</p>
              </div>
            )}
            {referral.linkedin_url && (
              <a
                href={referral.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-xs text-brand-teal hover:underline"
              >
                LinkedIn Profile ↗
              </a>
            )}
          </div>
        </div>

        {/* ── RIGHT: AI scoring pipeline output ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-sm font-semibold text-foreground">AI Scoring Pipeline Output</h2>
            </div>

            {matches.length === 0 ? (
              <div className="flex items-start gap-3 bg-brand-gold/10 border border-brand-gold/30 rounded-lg px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-gold">AI scoring unavailable</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Match scores could not be computed at submission time. This is typically caused by a missing or invalid <span className="font-mono">ANTHROPIC_API_KEY</span>, or a transient API error. The referral has been saved successfully.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    To get scores, re-submit this referral from the{" "}
                    <a href="/reference/submit" className="text-brand-teal hover:underline font-medium">Submit Referral</a>{" "}
                    page — the duplicate warning can be acknowledged and submission will proceed.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Pipeline metadata */}
                <div className="bg-muted rounded-lg px-4 py-3 mb-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p className="font-mono text-foreground">claude-haiku-4-5-20251001</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Evaluated</p>
                    <p className="font-medium text-foreground">{matches[0]?.evaluated_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Jobs Evaluated</p>
                    <p className="font-medium text-foreground">{matches.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Output Type</p>
                    <p className="font-mono text-foreground">ai_computed</p>
                  </div>
                </div>

                {/* Per-job match cards */}
                <div className="space-y-3">
                  {[...matches]
                    .sort((a, b) => b.match_score - a.match_score)
                    .map((m) => {
                      const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                      const expanded = expandedMatches.has(m.match_id);
                      return (
                        <div key={m.match_id} className="border border-border rounded-lg overflow-hidden">
                          {/* Match header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                            <div>
                              <p className="text-xs font-semibold text-foreground">{jobTitle}</p>
                              <p className="text-xs text-muted-foreground font-mono">{m.posting_id}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-lg font-bold text-foreground">{m.match_score}</span>
                                <span className="text-xs text-muted-foreground">/100</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                m.classification === "Strong Match"
                                  ? "bg-brand-green/10 text-brand-green"
                                  : m.classification === "Partial Match"
                                    ? "bg-brand-gold/10 text-brand-gold"
                                    : "bg-muted text-muted-foreground"
                              }`}>
                                {m.classification}
                              </span>
                              <button
                                onClick={() => toggleMatch(m.match_id)}
                                className="text-xs text-brand-teal flex items-center gap-1 hover:underline"
                              >
                                Breakdown
                                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Score breakdown */}
                          {expanded && (
                            <div className="px-4 py-3 bg-white">
                              {/* Component scores */}
                              <div className="grid grid-cols-4 gap-3 mb-3">
                                {[
                                  { label: "Skill Overlap", value: m.skill_overlap_score, weight: DEFAULT_WEIGHTS.skill },
                                  { label: "Experience",    value: m.experience_score,     weight: DEFAULT_WEIGHTS.experience },
                                  { label: "Location",      value: m.location_score,       weight: DEFAULT_WEIGHTS.location },
                                  { label: "Seniority",     value: m.seniority_score,      weight: DEFAULT_WEIGHTS.seniority },
                                ].map((c) => (
                                  <div key={c.label} className="text-center bg-muted rounded-lg p-2">
                                    <p className="text-xs text-muted-foreground">{c.label}</p>
                                    <p className="text-lg font-bold text-foreground">{c.value}</p>
                                    <p className="text-[10px] text-muted-foreground">w={c.weight}%</p>
                                  </div>
                                ))}
                              </div>
                              {/* Score computation */}
                              <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground">
                                final = ({m.skill_overlap_score}×{DEFAULT_WEIGHTS.skill} + {m.experience_score}×{DEFAULT_WEIGHTS.experience} + {m.location_score}×{DEFAULT_WEIGHTS.location} + {m.seniority_score}×{DEFAULT_WEIGHTS.seniority}) / 100 = <span className="font-bold text-foreground">{m.match_score}</span>
                              </div>
                              {/* Classification rule */}
                              <p className="mt-2 text-xs text-muted-foreground">
                                Classification rule: ≥70 → Strong Match · 50–69 → Partial Match · &lt;50 → No Match
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Duplicate warning */}
          {referral.is_duplicate && (
            <div className="bg-white rounded-xl border border-brand-gold/30 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Duplicate Detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This email already exists in the candidate database.
                  </p>
                  {referral.duplicate_candidate_id && (
                    <Link
                      href={`/reference/candidates/${referral.duplicate_candidate_id}`}
                      className="mt-2 block text-xs text-brand-teal hover:underline"
                    >
                      View existing profile ({referral.duplicate_candidate_id}) →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
