"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import {
  ArrowLeft, CheckCircle2, Loader2, AlertTriangle, Save, Lock, Info,
  Upload, FileText, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { OPEN_JOBS } from "@/data/reference/jobs";

// ── Types ────────────────────────────────────────────────────────────

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
  is_duplicate: boolean;
  duplicate_candidate_id: string | null;
  skills_claimed: string[];
}

interface LiveMatchRecord {
  match_id: string;
  posting_id: string;
  match_score: number;
  classification: "Strong Match" | "Partial Match" | "No Match";
  evaluated_date: string;
  scoring_method?: "ai" | "static";
}

// Fields the referrer is allowed to change — identity fields are locked
const EDITABLE_FIELDS = new Set([
  "candidate_phone",
  "current_employer",
  "years_experience",
  "location",
  "availability",
  "linkedin_url",
  "target_job_id",
  "referrer_note",
  "skills_claimed",
]);

// ── Helpers ──────────────────────────────────────────────────────────

function classLabel(c: LiveMatchRecord["classification"]) {
  if (c === "Strong Match") return "text-brand-green";
  if (c === "Partial Match") return "text-brand-gold";
  return "text-muted-foreground";
}

function classTag(c: LiveMatchRecord["classification"]) {
  if (c === "Strong Match") return "bg-brand-green/10 text-brand-green";
  if (c === "Partial Match") return "bg-brand-gold/10 text-brand-gold";
  return "bg-muted text-muted-foreground";
}

// ── Page ─────────────────────────────────────────────────────────────

export default function ReferralEditPage() {
  const { referral_id } = useParams<{ referral_id: string }>();
  const router = useRouter();

  const [referral, setReferral] = useState<SubmittedReferral | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state (only editable fields)
  const [phone, setPhone] = useState("");
  const [employer, setEmployer] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [targetJobId, setTargetJobId] = useState("pool");
  const [referrerNote, setReferrerNote] = useState("");
  const [skills, setSkills] = useState(""); // comma-separated string for the input

  // Resume re-upload state
  const resumeRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeParseResult, setResumeParseResult] = useState<{
    text: string; format: string; wordCount: number; charCount: number;
    pageCount: number | null; warning: string | null;
  } | null>(null);
  const [resumeParseError, setResumeParseError] = useState<string | null>(null);
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [newMatches, setNewMatches] = useState<LiveMatchRecord[]>([]);
  const [rescored, setRescored] = useState(false);

  // Load the referral on mount
  useEffect(() => {
    fetch(`/api/reference/referrals/${referral_id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const r: SubmittedReferral = data.referral;
        setReferral(r);
        setPhone(r.candidate_phone ?? "");
        setEmployer(r.current_employer ?? "");
        setYearsExp(String(r.years_experience ?? 0));
        setLocation(r.location ?? "");
        setAvailability(r.availability ?? "");
        setLinkedin(r.linkedin_url ?? "");
        setTargetJobId(r.target_job_id ?? "pool");
        setReferrerNote(r.referrer_note ?? "");
        setSkills((r.skills_claimed ?? []).join(", "));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [referral_id]);

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setResumeFile(file);
    setResumeParseResult(null);
    setResumeParseError(null);
    setResumePreviewOpen(false);
    if (!file) return;

    setResumeParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/reference/resume-parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setResumeParseError(data.error ?? "Could not parse file.");
      } else {
        setResumeParseResult(data);
        if (data.text) setResumePreviewOpen(true);
      }
    } catch {
      setResumeParseError("Network error during parsing. File will still be recorded.");
    } finally {
      setResumeParsing(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!referral || saving) return;
    setSaving(true);
    setSaveError(null);

    const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch(`/api/reference/referrals/${referral_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_phone: phone,
          current_employer: employer,
          years_experience: Number(yearsExp) || 0,
          location,
          availability,
          linkedin_url: linkedin,
          target_job_id: targetJobId,
          referrer_note: referrerNote,
          skills_claimed: skillList,
          ...(resumeFile && {
            resume_filename: resumeFile.name,
            resume_text: resumeParseResult?.text ?? null,
            resume_format: resumeParseResult?.format ?? null,
            resume_word_count: resumeParseResult?.wordCount ?? null,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Save failed. Please try again.");
      } else {
        setReferral(data.referral);
        setRescored(data.rescored ?? false);
        if (data.match_results?.length) {
          // Deduplicate: latest per posting_id
          const latestMap: Record<string, LiveMatchRecord> = {};
          for (const m of data.match_results as LiveMatchRecord[]) {
            const ex = latestMap[m.posting_id];
            if (!ex || m.evaluated_date >= ex.evaluated_date) latestMap[m.posting_id] = m;
          }
          setNewMatches(Object.values(latestMap).sort((a, b) => b.match_score - a.match_score));
        }
        setSaved(true);
      }
    } catch {
      setSaveError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / not found ────────────────────────────────────────────

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

  // ── Success screen ─────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="space-y-6">
        <Link
          href={`/reference/referrals/${referral_id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to referral
        </Link>

        <div className="bg-white rounded-xl border border-border shadow-sm p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-brand-green" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Referral Updated</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Your changes for <strong>{referral.candidate_name}</strong> have been saved.
            {rescored && " Updated match scores have been calculated with the new information."}
          </p>

          {newMatches.length > 0 && (
            <div className="w-full max-w-sm">
              <p className="text-xs font-medium text-muted-foreground mb-2">Updated match scores</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {newMatches.map((m) => {
                  const job = OPEN_JOBS.find((j) => j.id === m.posting_id);
                  return (
                    <div key={m.match_id} className="flex items-center gap-1.5 text-xs bg-muted rounded-lg px-3 py-1.5">
                      <span className="text-muted-foreground">{job?.title ?? m.posting_id}</span>
                      <span className="font-semibold text-foreground">{m.match_score}</span>
                      <span className={classLabel(m.classification)}>· {m.classification}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href={`/reference/referrals/${referral_id}`}
              className="text-sm px-4 py-2 rounded-lg bg-brand-teal text-white font-medium hover:bg-brand-teal/90 transition-colors"
            >
              View referral
            </Link>
            <button
              onClick={() => { setSaved(false); setNewMatches([]); setRescored(false); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit form ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Nav */}
      <Link
        href={`/reference/referrals/${referral_id}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to referral
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Update Referral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {referral.referral_id} · Submitted {new Date(referral.submitted_at).toLocaleDateString("en-CA")}
        </p>
      </div>

      {/* Locked fields banner */}
      <div className="flex items-start gap-3 bg-muted rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-0.5">Identity fields are locked</p>
          <p>
            Candidate name (<strong>{referral.candidate_name}</strong>),
            email (<strong>{referral.candidate_email}</strong>),
            and referrer details cannot be changed after submission to preserve audit integrity.
            Contact your recruiter if a correction is needed.
          </p>
        </div>
      </div>

      {/* Scoring hint */}
      <div className="flex items-start gap-3 bg-brand-teal/5 border border-brand-teal/20 rounded-xl px-4 py-3 text-xs text-brand-teal">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Updating <strong>skills, years of experience, location, availability, or target role</strong> will
          automatically re-run match scoring so your referral reflects the latest information.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid gap-5">

        {/* Candidate details */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Candidate Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Locked fields — shown read-only */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                Candidate Name <Lock className="h-3 w-3" />
              </label>
              <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
                {referral.candidate_name}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                Email <Lock className="h-3 w-3" />
              </label>
              <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed">
                {referral.candidate_email}
              </div>
            </div>

            {/* Editable fields */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-604-555-0100"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Current Employer</label>
              <input
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder="e.g. Accenture"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Years of Experience
                <span className="ml-1 text-brand-teal text-[10px]">↻ triggers re-score</span>
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Location
                <span className="ml-1 text-brand-teal text-[10px]">↻ triggers re-score</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Vancouver, BC"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Availability
                <span className="ml-1 text-brand-teal text-[10px]">↻ triggers re-score</span>
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              >
                <option value="">Not specified</option>
                <option value="Immediate">Immediate</option>
                <option value="2 weeks">2 weeks notice</option>
                <option value="1 month">1 month notice</option>
                <option value="3 months">3 months notice</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">LinkedIn URL</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
          </div>
        </div>

        {/* Resume re-upload */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-1">Resume / CV</h3>
          {referral.resume_filename && !resumeFile && (
            <p className="text-xs text-muted-foreground mb-3">
              Current file: <span className="font-medium text-foreground">{referral.resume_filename}</span>
              {referral.resume_format && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium uppercase">{referral.resume_format}</span>
              )}
              {referral.resume_word_count != null && (
                <span className="ml-1 text-muted-foreground"> · {referral.resume_word_count.toLocaleString()} words</span>
              )}
            </p>
          )}

          {/* Accepted formats */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { ext: "PDF", note: "best quality" },
              { ext: "DOCX", note: "Word 2007+" },
              { ext: "DOC", note: "legacy Word" },
              { ext: "TXT", note: "plain text" },
            ].map(({ ext, note }) => (
              <span key={ext} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {ext} <span className="opacity-60">· {note}</span>
              </span>
            ))}
            <span className="text-[10px] text-muted-foreground self-center">· Max 5 MB</span>
          </div>

          <input
            ref={resumeRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.text"
            onChange={handleResumeChange}
            className="hidden"
          />

          {!resumeFile ? (
            <button
              type="button"
              onClick={() => resumeRef.current?.click()}
              className="w-full flex items-center gap-2 bg-muted border border-dashed border-border rounded-lg px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
            >
              <Upload className="h-4 w-4" />
              {referral.resume_filename ? "Replace resume" : "Upload resume"} — PDF, DOCX, DOC, or TXT
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-3 py-2">
                <FileText className="h-4 w-4 text-brand-teal flex-shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{resumeFile.name}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{(resumeFile.size / 1024).toFixed(0)} KB</span>
                {resumeParsing && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-teal flex-shrink-0" />}
                <button
                  type="button"
                  onClick={() => {
                    setResumeFile(null);
                    setResumeParseResult(null);
                    setResumeParseError(null);
                    setResumePreviewOpen(false);
                    if (resumeRef.current) resumeRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {resumeParsing && <p className="text-xs text-muted-foreground px-1">Extracting text…</p>}

              {resumeParseError && (
                <div className="flex items-start gap-2 bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-3 py-2 text-xs text-brand-gold">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {resumeParseError}
                </div>
              )}

              {resumeParseResult && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 text-xs text-muted-foreground">
                    <span className="uppercase font-semibold text-[10px] tracking-wide text-brand-teal">{resumeParseResult.format}</span>
                    <span>{resumeParseResult.wordCount.toLocaleString()} words</span>
                    <span>{resumeParseResult.charCount.toLocaleString()} chars</span>
                    {resumeParseResult.pageCount != null && <span>{resumeParseResult.pageCount} page{resumeParseResult.pageCount !== 1 ? "s" : ""}</span>}
                    <button
                      type="button"
                      onClick={() => setResumePreviewOpen((o) => !o)}
                      className="ml-auto flex items-center gap-1 text-brand-teal hover:underline"
                    >
                      {resumePreviewOpen ? "Hide" : "Show"} text
                      {resumePreviewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                  {resumePreviewOpen && (
                    <div className="max-h-48 overflow-y-auto bg-white px-3 py-2">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {resumeParseResult.text || "(No text extracted)"}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skills & role */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Skills & Role</h3>
          <div className="grid gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Key Skills
                <span className="ml-1 font-normal">(comma-separated)</span>
                <span className="ml-1 text-brand-teal text-[10px]">↻ triggers re-score</span>
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Python, SQL, Leadership, Machine Learning"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
              {skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                    <span key={skill} className="text-xs px-2.5 py-1 rounded-md bg-brand-teal/10 text-brand-teal font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Target Role
                <span className="ml-1 text-brand-teal text-[10px]">↻ triggers re-score</span>
              </label>
              <select
                value={targetJobId}
                onChange={(e) => setTargetJobId(e.target.value)}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              >
                <option value="pool">Add to Talent Pool — match automatically when a role opens</option>
                {OPEN_JOBS.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.department} · {job.salaryRange}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Referral note */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Your Recommendation</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
              Referrer Name <Lock className="h-3 w-3" />
            </label>
            <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed mb-3">
              {referral.referrer_name} · {referral.referrer_emp_id}
            </div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Referral Note
            </label>
            <textarea
              rows={4}
              value={referrerNote}
              onChange={(e) => setReferrerNote(e.target.value)}
              placeholder="Share how you know this candidate, their key strengths, and why they'd be a great fit…"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30 resize-none"
            />
          </div>
        </div>

        {saveError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{saveError}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <Link
            href={`/reference/referrals/${referral_id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
