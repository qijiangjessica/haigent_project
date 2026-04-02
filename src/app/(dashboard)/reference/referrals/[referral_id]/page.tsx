"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle, Loader2, TrendingUp,
  ChevronDown, ChevronUp, Database, GitBranch, AlertTriangle,
  CheckSquare, Package, Sparkles, RefreshCw, Pencil, X, Save,
} from "lucide-react";
import { REFERENCE_JOBS, OPEN_JOBS } from "@/data/reference/jobs";

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
  resume_text: string | null;
  resume_format: string | null;
  resume_word_count: number | null;
  extra_filenames: string[];
  is_duplicate: boolean;
  duplicate_candidate_id: string | null;
  skills_claimed?: string[];
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

interface LivePoolEntry {
  pool_id: string;
  referral_id: string;
  experience_level: string;
  status: string;
  date_added: string;
  promoted_at: string;
  promoted_by: string;
}

// ── Score sparkline ─────────────────────────────────────────────────
// Pure SVG — no external chart library.

function ScoreSparkline({ scores, width = 80, height = 28 }: { scores: number[]; width?: number; height?: number }) {
  if (scores.length < 2) return null;
  const min = 0, max = 100, range = max - min;
  const points = scores
    .map((s, i) => {
      const x = (i / (scores.length - 1)) * width;
      const y = height - ((s - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const trend = scores[scores.length - 1] - scores[0];
  const color = trend > 0 ? "#10b981" : trend < 0 ? "#ef4444" : "#6b7280";
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <svg width={width} height={height} className="overflow-visible">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        {scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * width;
          const y = height - ((s - min) / range) * height;
          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill={color} />;
        })}
      </svg>
      <span className="text-[10px] font-medium" style={{ color }}>
        {trend > 0 ? `+${trend}` : trend === 0 ? "—" : String(trend)}
      </span>
    </div>
  );
}

// ── Why this score? explanation ─────────────────────────────────────

interface WhyProps {
  m: LiveMatchRecord;
  skillsClaimed: string[];
  requiredSkills: string[];
  yoe: number;
  expMin: number;
  expMax: number;
  candLocation: string;
  jobLocation: string;
}

function WhyThisScore({ m, skillsClaimed, requiredSkills, yoe, expMin, expMax, candLocation, jobLocation }: WhyProps) {
  const candLower = skillsClaimed.map((s) => s.toLowerCase().trim());
  const reqLower = requiredSkills.map((s) => s.toLowerCase().trim());
  const matched = reqLower.filter((r) => candLower.some((c) => c.includes(r) || r.includes(c)));
  const missing = requiredSkills.filter((_, i) => !matched.includes(reqLower[i]));

  const items: { icon: string; text: string; color: string }[] = [
    {
      icon: "🎯",
      text: matched.length > 0
        ? `Skill match: ${matched.length}/${requiredSkills.length} required skills found (${matched.join(", ")})`
        : requiredSkills.length === 0
          ? "No required skills listed for this job"
          : `Skill match: 0/${requiredSkills.length} required skills — none of the claimed skills matched`,
      color: m.skill_overlap_score >= 70 ? "text-brand-green" : m.skill_overlap_score >= 40 ? "text-brand-gold" : "text-destructive",
    },
    ...(missing.length > 0 ? [{
      icon: "⚠️",
      text: `Missing skills: ${missing.join(", ")}`,
      color: "text-muted-foreground",
    }] : []),
    {
      icon: "📅",
      text: yoe >= expMin && yoe <= expMax
        ? `Experience: ${yoe} yrs is within the required ${expMin}–${expMax} yr range`
        : yoe < expMin
          ? `Experience: ${yoe} yrs is ${expMin - yoe} yr${expMin - yoe !== 1 ? "s" : ""} below the minimum (${expMin})`
          : `Experience: ${yoe} yrs exceeds the maximum (${expMax}) — may be overqualified`,
      color: m.experience_score >= 70 ? "text-brand-green" : m.experience_score >= 50 ? "text-brand-gold" : "text-destructive",
    },
    {
      icon: "📍",
      text: !candLocation
        ? "Location: not provided — defaulted to 50"
        : candLocation.toLowerCase().includes(jobLocation.toLowerCase()) || jobLocation.toLowerCase().includes(candLocation.toLowerCase())
          ? `Location: ${candLocation} matches ${jobLocation}`
          : `Location: ${candLocation} differs from ${jobLocation} — partial token match used`,
      color: m.location_score >= 90 ? "text-brand-green" : m.location_score >= 60 ? "text-brand-gold" : "text-destructive",
    },
    {
      icon: "⭐",
      text: yoe >= 10
        ? `Seniority: ${yoe} yrs → Lead/Principal level`
        : yoe >= 6
          ? `Seniority: ${yoe} yrs → Senior level`
          : yoe >= 3
            ? `Seniority: ${yoe} yrs → Mid level`
            : `Seniority: ${yoe} yrs → Junior level`,
      color: m.seniority_score >= 80 ? "text-brand-green" : m.seniority_score >= 60 ? "text-brand-gold" : "text-muted-foreground",
    },
  ];

  return (
    <div className="mt-3 px-4 pb-3 bg-white border-t border-border">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-2">Why this score?</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="flex-shrink-0">{item.icon}</span>
            <span className={item.color}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
    { field: "referral_id",    label: "Reference ID",      value: r.referral_id,         source: "system",     type: "string",   present: true },
    { field: "submitted_at",   label: "Submission Date",   value: r.submitted_at,         source: "system",     type: "datetime", present: true },
    { field: "is_duplicate",   label: "Duplicate",         value: r.is_duplicate,         source: "system",     type: "boolean",  present: true },
    // User-input: required
    { field: "candidate_name",  label: "Full Name",        value: r.candidate_name,       source: "user_input", type: "string",   present: !!r.candidate_name },
    { field: "candidate_email", label: "Email Address",    value: r.candidate_email,      source: "user_input", type: "email",    present: !!r.candidate_email },
    { field: "referrer_name",   label: "Referred By",      value: r.referrer_name,        source: "user_input", type: "string",   present: !!r.referrer_name },
    { field: "referrer_note",   label: "Referral Note",    value: r.referrer_note,        source: "user_input", type: "text",     present: !!r.referrer_note },
    // User-input: optional
    { field: "candidate_phone", label: "Phone Number",     value: r.candidate_phone,      source: "user_input", type: "string",   present: !!r.candidate_phone },
    { field: "current_employer",label: "Current Employer", value: r.current_employer,     source: "user_input", type: "string",   present: !!r.current_employer },
    { field: "years_experience",label: "Years of Exp.",    value: r.years_experience,     source: "user_input", type: "number",   present: r.years_experience > 0 },
    { field: "location",        label: "Location",         value: r.location,             source: "user_input", type: "string",   present: !!r.location },
    { field: "availability",    label: "Availability",     value: r.availability,         source: "user_input", type: "string",   present: !!r.availability },
    { field: "linkedin_url",    label: "LinkedIn Profile", value: r.linkedin_url,         source: "user_input", type: "url",      present: !!r.linkedin_url },
    { field: "target_job_id",   label: "Target Role",      value: r.target_job_id,        source: "user_input", type: "string",   present: !!r.target_job_id && r.target_job_id !== "pool" },
    { field: "resume_filename", label: "Resume",           value: r.resume_filename,      source: "user_input", type: "file",     present: !!r.resume_filename },
    { field: "referrer_emp_id", label: "Referrer Employee ID", value: r.referrer_emp_id,  source: "user_input", type: "string",   present: !!r.referrer_emp_id },
  ];
}

const SOURCE_COLORS: Record<FieldSource, string> = {
  user_input:  "bg-brand-teal/10 text-brand-teal",
  ai_computed: "bg-brand-cyan/10 text-brand-cyan",
  system:      "bg-muted text-muted-foreground",
};

const SOURCE_LABELS: Record<FieldSource, string> = {
  user_input:  "Submitted",
  ai_computed: "AI Computed",
  system:      "System",
};

// ── Resume panel ───────────────────────────────────────────────────

const FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF", docx: "DOCX", doc: "DOC (legacy)", txt: "Plain Text",
};

function ResumePanel({ referral }: { referral: SubmittedReferral }) {
  const [open, setOpen] = useState(false);

  const hasText = !!referral.resume_text;
  const formatLabel = referral.resume_format ? (FORMAT_LABELS[referral.resume_format] ?? referral.resume_format.toUpperCase()) : null;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3 text-sm hover:bg-muted/30 transition-colors"
      >
        <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-semibold text-foreground">Resume</span>
        {formatLabel && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
            {formatLabel}
          </span>
        )}
        {referral.resume_word_count != null && (
          <span className="text-xs text-muted-foreground">{referral.resume_word_count.toLocaleString()} words</span>
        )}
        {!hasText && (
          <span className="text-xs text-muted-foreground ml-auto mr-2">Filename only — text not extracted</span>
        )}
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{referral.resume_filename}</span>
          </div>

          {hasText ? (
            <div className="max-h-72 overflow-y-auto bg-muted rounded-lg px-3 py-2">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {referral.resume_text}
              </pre>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-muted rounded-lg px-3 py-2.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-brand-gold" />
              <p>
                This referral was submitted before resume parsing was enabled — only the filename was recorded.
                The referrer can re-upload the resume via the{" "}
                <a href={`/reference/referrals/${referral.referral_id}/edit`} className="text-brand-teal hover:underline">
                  Update Referral
                </a>{" "}
                page to extract the text.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  // Re-score state
  const [rescoring, setRescoring] = useState(false);
  const [rescoreStatus, setRescoreStatus] = useState<"idle" | "success" | "error">("idle");

  // Score breakdown toggle per match
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [expandedWhy, setExpandedWhy] = useState<Set<string>>(new Set());

  // Recruiter inline edit
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<SubmittedReferral>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editStatus, setEditStatus] = useState<"idle" | "success" | "error">("idle");
  const [editError, setEditError] = useState<string | null>(null);

  function toggleMatch(id: string) {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleWhy(id: string) {
    setExpandedWhy((prev) => {
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

  async function handleRescore() {
    if (!referral || rescoring) return;
    setRescoring(true);
    setRescoreStatus("idle");
    try {
      const res = await fetch("/api/reference/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_id: referral.referral_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRescoreStatus("error");
      } else {
        // Append new match records to the existing list
        setMatches((prev) => [...prev, ...(data.match_results ?? [])]);
        setRescoreStatus("success");
        setTimeout(() => setRescoreStatus("idle"), 3000);
      }
    } catch {
      setRescoreStatus("error");
    } finally {
      setRescoring(false);
    }
  }

  function openEdit() {
    if (!referral) return;
    setEditDraft({
      candidate_name: referral.candidate_name,
      candidate_email: referral.candidate_email,
      candidate_phone: referral.candidate_phone,
      current_employer: referral.current_employer,
      years_experience: referral.years_experience,
      location: referral.location,
      availability: referral.availability,
      linkedin_url: referral.linkedin_url,
      target_job_id: referral.target_job_id,
      referrer_note: referral.referrer_note,
      skills_claimed: referral.skills_claimed ?? [],
    });
    setEditMode(true);
    setEditStatus("idle");
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!referral || editSaving) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const payload = {
        ...editDraft,
        skills_claimed: editDraft.skills_claimed,
      };
      const res = await fetch(`/api/reference/referrals/${referral.referral_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Save failed. Please try again.");
        setEditStatus("error");
      } else {
        setReferral(data.referral);
        if (data.match_results?.length) {
          setMatches((prev) => [...prev, ...data.match_results]);
        }
        setEditMode(false);
        setEditStatus("success");
        setTimeout(() => setEditStatus("idle"), 3000);
      }
    } catch {
      setEditError("Network error. Please try again.");
      setEditStatus("error");
    } finally {
      setEditSaving(false);
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

  // Group all match records by posting_id, sorted chronologically, for sparklines
  const historyByJob = matches.reduce<Record<string, number[]>>((acc, m) => {
    if (!acc[m.posting_id]) acc[m.posting_id] = [];
    acc[m.posting_id].push(m.match_score);
    return acc;
  }, {});

  // Deduplicate: keep the latest match per (posting_id + run) for the "current" view
  const latestByJob = matches.reduce<Record<string, LiveMatchRecord>>((acc, m) => {
    const existing = acc[m.posting_id];
    if (!existing || m.evaluated_date >= existing.evaluated_date) acc[m.posting_id] = m;
    return acc;
  }, {});
  const uniqueMatches = Object.values(latestByJob).sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/reference/candidates"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Link>
        <Link
          href={`/reference/referrals/${referral_id}/edit`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand-teal hover:underline transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Update my referral
        </Link>
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={handleRescore}
            disabled={rescoring || editMode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Re-run match scoring against current open jobs and scoring weights"
          >
            <RefreshCw className={`h-4 w-4 ${rescoring ? "animate-spin" : ""}`} />
            {rescoring ? "Re-scoring…" : "Re-score"}
          </button>
          {rescoreStatus === "success" && (
            <span className="text-xs text-brand-green flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> New scores added
            </span>
          )}
          {rescoreStatus === "error" && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Re-score failed
            </span>
          )}
          {editStatus === "success" && !editMode && (
            <span className="text-xs text-brand-green flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {!editMode ? (
            <button
              onClick={openEdit}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <button
              onClick={() => setEditMode(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
          {!isInPool && (
            <button
              onClick={() => setShowPromote(!showPromote)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 transition-colors"
            >
              <Package className="h-4 w-4" />
              Promote to Pool
            </button>
          )}
        </div>
      </div>

      {/* ── Recruiter inline edit form ── */}
      {editMode && (
        <div className="bg-white rounded-xl border border-brand-teal/30 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">Edit Referral</h2>
              <span className="text-xs text-muted-foreground">(Recruiter — all fields editable)</span>
            </div>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Scoring-relevant changes will auto-trigger re-score
            </span>
          </div>

          {/* Candidate info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Candidate</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Full Name", key: "candidate_name", type: "text" },
                { label: "Email", key: "candidate_email", type: "email" },
                { label: "Phone", key: "candidate_phone", type: "text" },
                { label: "Current Employer", key: "current_employer", type: "text" },
                { label: "Location", key: "location", type: "text" },
                { label: "LinkedIn URL", key: "linkedin_url", type: "url" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                  <input
                    type={type}
                    value={(editDraft[key as keyof typeof editDraft] as string) ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={editDraft.years_experience ?? 0}
                  onChange={(e) => setEditDraft((d) => ({ ...d, years_experience: Number(e.target.value) }))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Availability</label>
                <select
                  value={editDraft.availability ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, availability: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                >
                  <option value="">Not specified</option>
                  <option value="Immediate">Immediate</option>
                  <option value="2 weeks">2 weeks notice</option>
                  <option value="1 month">1 month notice</option>
                  <option value="3 months">3 months notice</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Skills & Role</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Key Skills
                  <span className="ml-1 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={(editDraft.skills_claimed ?? []).join(", ")}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      skills_claimed: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Target Role</label>
                <select
                  value={editDraft.target_job_id ?? "pool"}
                  onChange={(e) => setEditDraft((d) => ({ ...d, target_job_id: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                >
                  <option value="pool">Add to Talent Pool</option>
                  {OPEN_JOBS.map((j) => (
                    <option key={j.id} value={j.id}>{j.title} — {j.department}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Referrer */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Referrer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Referrer Name</label>
                <input
                  type="text"
                  value={editDraft.referrer_name ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, referrer_name: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Referrer Employee ID</label>
                <input
                  type="text"
                  value={editDraft.referrer_emp_id ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, referrer_emp_id: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Referral Note</label>
                <textarea
                  rows={3}
                  value={editDraft.referrer_note ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, referrer_note: e.target.value }))}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Save / Cancel */}
          {editError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              {editError}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editSaving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <span className="ml-auto text-xs text-muted-foreground">
              Locked: Referral ID · Submission Date · Duplicate status
            </span>
          </div>
        </div>
      )}

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
                      <td className="py-1.5 pr-3 text-foreground font-medium">{f.label}</td>
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

        {/* ── Resume text panel ── */}
        {referral.resume_filename && (
          <ResumePanel referral={referral} />
        )}

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
                  {uniqueMatches.map((m) => {
                      const jobTitle = REFERENCE_JOBS.find((j) => j.id === m.posting_id)?.title ?? m.posting_id;
                      const expanded = expandedMatches.has(m.match_id);
                      const scoreHistory = historyByJob[m.posting_id] ?? [];
                      return (
                        <div key={m.match_id} className="border border-border rounded-lg overflow-hidden">
                          {/* Match header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
                            <div>
                              <p className="text-xs font-semibold text-foreground">{jobTitle}</p>
                              {(() => {
                                const job = REFERENCE_JOBS.find((j) => j.id === m.posting_id);
                                return job ? (
                                  <p className="text-xs text-muted-foreground">{job.department} · {job.location}</p>
                                ) : null;
                              })()}
                              {scoreHistory.length >= 2 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {scoreHistory.length} evaluations
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {scoreHistory.length >= 2 && (
                                <ScoreSparkline scores={scoreHistory} />
                              )}
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
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                m.scoring_method === "ai"
                                  ? "bg-brand-cyan/10 text-brand-cyan"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {m.scoring_method === "ai" ? "⚡ AI" : "≈ Rule"}
                              </span>
                              <button
                                onClick={() => toggleMatch(m.match_id)}
                                className="text-xs text-brand-teal flex items-center gap-1 hover:underline"
                              >
                                Breakdown
                                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={() => toggleWhy(m.match_id)}
                                className="text-xs text-brand-cyan flex items-center gap-1 hover:underline"
                              >
                                Why?
                                {expandedWhy.has(m.match_id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>

                          {/* Score breakdown */}
                          {expanded && (
                            <div className="px-4 py-3 bg-white">
                              {/* Component scores */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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
                              <div className="overflow-x-auto">
                                <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">
                                  final = ({m.skill_overlap_score}×{DEFAULT_WEIGHTS.skill} + {m.experience_score}×{DEFAULT_WEIGHTS.experience} + {m.location_score}×{DEFAULT_WEIGHTS.location} + {m.seniority_score}×{DEFAULT_WEIGHTS.seniority}) / 100 = <span className="font-bold text-foreground">{m.match_score}</span>
                                </div>
                              </div>
                              {/* Classification rule */}
                              <p className="mt-2 text-xs text-muted-foreground">
                                Classification rule: ≥70 → Strong Match · 50–69 → Partial Match · &lt;50 → No Match
                              </p>
                            </div>
                          )}

                          {/* Why this score? */}
                          {expandedWhy.has(m.match_id) && (() => {
                            const job = REFERENCE_JOBS.find((j) => j.id === m.posting_id);
                            return (
                              <WhyThisScore
                                m={m}
                                skillsClaimed={referral.skills_claimed ?? []}
                                requiredSkills={job?.requiredSkills ?? []}
                                yoe={referral.years_experience}
                                expMin={job?.experienceMin ?? 0}
                                expMax={job?.experienceMax ?? 99}
                                candLocation={referral.location}
                                jobLocation={job?.location ?? ""}
                              />
                            );
                          })()}
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
