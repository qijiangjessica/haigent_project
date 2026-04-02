"use client";

import { useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { OPEN_JOBS } from "@/data/reference/jobs";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { CheckCircle2, Upload, X, FileText, AlertTriangle, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

interface FormState {
  referrerName: string;
  referrerEmpId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  currentEmployer: string;
  yearsExperience: string;
  location: string;
  availability: string;
  skills: string;
  linkedinUrl: string;
  targetJobId: string;
  referrerNote: string;
}

const EMPTY_FORM: FormState = {
  referrerName: "",
  referrerEmpId: "",
  candidateName: "",
  candidateEmail: "",
  candidatePhone: "",
  currentEmployer: "",
  yearsExperience: "",
  location: "",
  availability: "",
  skills: "",
  linkedinUrl: "",
  targetJobId: "pool",
  referrerNote: "",
};

const TALENT_POOL_VALUE = "pool";

function AutoFilledBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-teal bg-brand-teal/10 rounded px-1.5 py-0.5 leading-none">
      <Sparkles className="h-2.5 w-2.5" /> from resume
    </span>
  );
}

export default function SubmitReferralPage() {
  const searchParams = useSearchParams();
  const prefilledJobId = searchParams.get("job") ?? "";
  const validPrefilledId = OPEN_JOBS.some((j) => j.id === prefilledJobId) ? prefilledJobId : "";
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    targetJobId: validPrefilledId || EMPTY_FORM.targetJobId,
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  // Resume parsing state
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    text: string; format: string; charCount: number; wordCount: number;
    pageCount: number | null; warning: string | null;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Tracks which fields were auto-filled from the resume so we can highlight them
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Once user edits a field manually, remove the auto-fill highlight
    setAutoFilledFields((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setResumeFile(file);
    setParseResult(null);
    setParseError(null);
    setPreviewOpen(false);
    setAutoFilledFields(new Set());

    if (!file) return;

    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/reference/resume-parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error ?? "Could not parse file.");
      } else {
        setParseResult(data);
        if (data.text) setPreviewOpen(false);

        // Auto-fill form fields from AI extraction — only fill empty fields
        const ext = data.extracted ?? {};
        const filled = new Set<string>();

        setForm((prev) => {
          const next = { ...prev };
          if (ext.name && !prev.candidateName.trim()) {
            next.candidateName = ext.name; filled.add("candidateName");
          }
          if (ext.email && !prev.candidateEmail.trim()) {
            next.candidateEmail = ext.email; filled.add("candidateEmail");
          }
          if (ext.phone && !prev.candidatePhone.trim()) {
            next.candidatePhone = ext.phone; filled.add("candidatePhone");
          }
          if (ext.current_employer && !prev.currentEmployer.trim()) {
            next.currentEmployer = ext.current_employer; filled.add("currentEmployer");
          }
          if (ext.years_experience != null && !prev.yearsExperience.trim()) {
            next.yearsExperience = String(ext.years_experience); filled.add("yearsExperience");
          }
          if (ext.location && !prev.location.trim()) {
            next.location = ext.location; filled.add("location");
          }
          if (ext.linkedin_url && !prev.linkedinUrl.trim()) {
            next.linkedinUrl = ext.linkedin_url; filled.add("linkedinUrl");
          }
          if (ext.skills?.length && !prev.skills.trim()) {
            next.skills = ext.skills.join(", "); filled.add("skills");
          }
          return next;
        });

        setAutoFilledFields(filled);
      }
    } catch {
      setParseError("Network error during file parsing. You can still submit — the filename will be recorded.");
    } finally {
      setParsing(false);
    }
  }

  function handleExtraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setExtraFiles((prev) => [...prev, ...files]);
    // Reset input so same file can be added again if needed
    e.target.value = "";
  }

  function removeExtraFile(index: number) {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gdprConsent) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/reference/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerName: form.referrerName,
          referrerEmpId: form.referrerEmpId,
          candidateName: form.candidateName,
          candidateEmail: form.candidateEmail,
          candidatePhone: form.candidatePhone,
          currentEmployer: form.currentEmployer,
          yearsExperience: form.yearsExperience,
          location: form.location,
          availability: form.availability,
          skills: form.skills,
          linkedinUrl: form.linkedinUrl,
          targetJobId: form.targetJobId,
          referrerNote: form.referrerNote,
          resumeFilename: resumeFile?.name ?? null,
          resumeText: parseResult?.text ?? null,
          resumeFormat: parseResult?.format ?? null,
          resumeWordCount: parseResult?.wordCount ?? null,
          extraFilenames: extraFiles.map((f) => f.name),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error ?? "Submission failed. Please try again.");
        return;
      }
      const data = await res.json();
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const isPool = form.targetJobId === TALENT_POOL_VALUE;
  const selectedJob = OPEN_JOBS.find((j) => j.id === form.targetJobId);

  // Returns extra classes for inputs that were auto-filled
  function inputClass(fieldName: string, extra = "") {
    const base = "w-full rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30";
    const filled = autoFilledFields.has(fieldName)
      ? "bg-brand-teal/5 border border-brand-teal/30"
      : "bg-muted";
    return `${base} ${filled} ${extra}`.trim();
  }

  const duplicateCandidate = useMemo(() => {
    const email = form.candidateEmail.trim().toLowerCase();
    if (!email) return null;
    return REFERENCE_CANDIDATES.find((c) => c.email.toLowerCase() === email) ?? null;
  }, [form.candidateEmail]);

  if (submitted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Submit Referral"
          description="Refer a colleague or contact for an open position"
        />
        <div className="bg-white rounded-xl border border-border shadow-sm p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-brand-green" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Referral Submitted!</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Thank you for referring <strong>{form.candidateName}</strong>.{" "}
            {isPool
              ? "They've been added to the talent pool and will be automatically matched when a suitable position opens."
              : `Our AI agent will begin skill verification and matching against the ${selectedJob?.title ?? "selected"} role.`}
            {resumeFile && (
              <span> Resume <strong>{resumeFile.name}</strong> was attached.</span>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-brand-teal flex-shrink-0" />
            You'll be notified when verification is complete.
          </div>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setResumeFile(null);
              setExtraFiles([]);
              setGdprConsent(false);

              setSubmitted(false);
            }}
            className="mt-2 text-sm text-brand-teal font-medium hover:underline"
          >
            Submit another referral
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submit Referral"
        description="Refer a colleague or contact for an open position"
      />

      <form onSubmit={handleSubmit} className="grid gap-6">
        {/* Referrer info */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Your Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                name="referrerName"
                value={form.referrerName}
                onChange={handleChange}
                required
                placeholder="e.g. Aisha Malik"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Employee ID <span className="text-red-400">*</span>
              </label>
              <input
                name="referrerEmpId"
                value={form.referrerEmpId}
                onChange={handleChange}
                required
                placeholder="e.g. EMP-005"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
          </div>
        </div>

        {/* Candidate info */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-foreground">Candidate Information</h3>
            {autoFilledFields.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-brand-teal bg-brand-teal/8 border border-brand-teal/20 rounded-full px-2.5 py-1">
                <Sparkles className="h-3 w-3" />
                {autoFilledFields.size} field{autoFilledFields.size !== 1 ? "s" : ""} auto-filled from resume
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Candidate Name <span className="text-red-400">*</span>
                {autoFilledFields.has("candidateName") && <AutoFilledBadge />}
              </label>
              <input
                name="candidateName"
                value={form.candidateName}
                onChange={handleChange}
                required
                placeholder="e.g. Alex Rivera"
                className={inputClass("candidateName")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Email <span className="text-red-400">*</span>
                {autoFilledFields.has("candidateEmail") && <AutoFilledBadge />}
              </label>
              <input
                name="candidateEmail"
                type="email"
                value={form.candidateEmail}
                onChange={handleChange}
                required
                placeholder="candidate@example.com"
                className={inputClass("candidateEmail")}
              />
            </div>
            {duplicateCandidate && (
              <div className="sm:col-span-2 flex items-start gap-2 bg-brand-gold/10 border border-brand-gold/30 rounded-lg px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-brand-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-brand-gold">Duplicate referral detected</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <strong>{duplicateCandidate.name}</strong> with this email was already referred and is currently{" "}
                    <strong>{duplicateCandidate.pool_status.replace(/_/g, " ")}</strong>.
                    You can still submit — a new referral entry will be created and linked to the existing candidate.
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Phone {autoFilledFields.has("candidatePhone") && <AutoFilledBadge />}
              </label>
              <input
                name="candidatePhone"
                value={form.candidatePhone}
                onChange={handleChange}
                placeholder="+1-604-555-0100"
                className={inputClass("candidatePhone")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Current Employer {autoFilledFields.has("currentEmployer") && <AutoFilledBadge />}
              </label>
              <input
                name="currentEmployer"
                value={form.currentEmployer}
                onChange={handleChange}
                placeholder="e.g. Accenture"
                className={inputClass("currentEmployer")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Years of Experience {autoFilledFields.has("yearsExperience") && <AutoFilledBadge />}
              </label>
              <input
                name="yearsExperience"
                type="number"
                min="0"
                max="50"
                value={form.yearsExperience}
                onChange={handleChange}
                placeholder="e.g. 7"
                className={inputClass("yearsExperience")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Location {autoFilledFields.has("location") && <AutoFilledBadge />}
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Vancouver, BC"
                className={inputClass("location")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Availability
              </label>
              <select
                name="availability"
                value={form.availability}
                onChange={handleChange}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              >
                <option value="">Not specified</option>
                <option value="Immediate">Immediate</option>
                <option value="2 weeks">2 weeks notice</option>
                <option value="1 month">1 month notice</option>
                <option value="3 months">3 months notice</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                Key Skills
                <span className="font-normal">(comma-separated — used for AI match scoring)</span>
                {autoFilledFields.has("skills") && <AutoFilledBadge />}
              </label>
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. Python, SQL, Leadership, Machine Learning"
                className={inputClass("skills")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                LinkedIn URL {autoFilledFields.has("linkedinUrl") && <AutoFilledBadge />}
              </label>
              <input
                name="linkedinUrl"
                type="url"
                value={form.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className={inputClass("linkedinUrl")}
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resume upload */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Resume / CV
              </label>
              {/* Accepted formats */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { ext: "PDF",  note: "best quality" },
                  { ext: "DOCX", note: "Word 2007+" },
                  { ext: "DOC",  note: "legacy Word" },
                  { ext: "TXT",  note: "plain text" },
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
                  Click to upload — PDF, DOCX, DOC, or TXT
                </button>
              ) : (
                <div className="space-y-2">
                  {/* File pill */}
                  <div className="flex items-center gap-2 bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-3 py-2">
                    <FileText className="h-4 w-4 text-brand-teal flex-shrink-0" />
                    <span className="text-xs text-foreground truncate flex-1">{resumeFile.name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {(resumeFile.size / 1024).toFixed(0)} KB
                    </span>
                    {parsing && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-teal flex-shrink-0" />}
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null);
                        setParseResult(null);
                        setParseError(null);
                        setPreviewOpen(false);
                        if (resumeRef.current) resumeRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Parse status */}
                  {parsing && (
                    <p className="text-xs text-muted-foreground px-1 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Extracting text and reading candidate details…
                    </p>
                  )}

                  {parseError && (
                    <div className="flex items-start gap-2 bg-brand-gold/5 border border-brand-gold/20 rounded-lg px-3 py-2 text-xs text-brand-gold">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {parseError}
                    </div>
                  )}

                  {parseResult && (
                    <div className="rounded-lg border border-border overflow-hidden">
                      {/* Stats bar */}
                      <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 text-xs text-muted-foreground">
                        <span className="uppercase font-semibold text-[10px] tracking-wide text-brand-teal">
                          {parseResult.format}
                        </span>
                        <span>{parseResult.wordCount.toLocaleString()} words</span>
                        <span>{parseResult.charCount.toLocaleString()} chars</span>
                        {parseResult.pageCount != null && <span>{parseResult.pageCount} page{parseResult.pageCount !== 1 ? "s" : ""}</span>}
                        {parseResult.warning && (
                          <span className="text-brand-gold flex items-center gap-1 ml-auto">
                            <AlertTriangle className="h-3 w-3" /> {parseResult.warning}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewOpen((o) => !o)}
                          className="ml-auto flex items-center gap-1 text-brand-teal hover:underline"
                        >
                          {previewOpen ? "Hide" : "Show"} extracted text
                          {previewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>

                      {/* Extracted text preview */}
                      {previewOpen && (
                        <div className="max-h-48 overflow-y-auto bg-white px-3 py-2">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                            {parseResult.text || "(No text extracted)"}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional documents */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Additional Documents
                <span className="ml-1 font-normal">(portfolio, certifications, etc.)</span>
              </label>
              <input
                ref={extraRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                multiple
                onChange={handleExtraChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => extraRef.current?.click()}
                className="w-full flex items-center gap-2 bg-muted border border-dashed border-border rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Add files
              </button>
              {extraFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {extraFiles.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeExtraFile(i)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job selection */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Position</h3>
          {validPrefilledId && (
            <div className="mb-3 flex items-center gap-2 text-xs bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-3 py-2 text-brand-teal">
              <span className="font-medium">Pre-filled from job listing.</span>
              <span className="text-muted-foreground">You can change the role below if needed.</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Referring for
            </label>
            <select
              name="targetJobId"
              value={form.targetJobId}
              onChange={handleChange}
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            >
              <option value={TALENT_POOL_VALUE}>Add to Talent Pool — match automatically when a role opens</option>
              {OPEN_JOBS.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} — {job.department} · {job.salaryRange}
                </option>
              ))}
            </select>
            {isPool && (
              <p className="mt-2 text-xs text-brand-teal bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-3 py-2">
                This candidate will be added to the talent pool. Our AI agent will automatically evaluate them against all future openings and notify you when a match is found.
              </p>
            )}
            {selectedJob && (
              <p className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                Matching against: <strong className="text-foreground">{selectedJob.title}</strong> · {selectedJob.department} · {selectedJob.salaryRange} · {selectedJob.experienceMin}–{selectedJob.experienceMax} years exp
              </p>
            )}
          </div>
        </div>

        {/* Referrer note */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Your Recommendation</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Why are you recommending this candidate? <span className="text-red-400">*</span>
            </label>
            <textarea
              name="referrerNote"
              value={form.referrerNote}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Share how you know this candidate, their key strengths, and why they'd be a great fit…"
              className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30 resize-none"
            />
          </div>
        </div>

        {/* GDPR Consent */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3">Data Processing Consent</h3>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-brand-teal flex-shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I confirm that the candidate has been informed that their personal data will be processed
              for recruitment purposes, and that they consent to being contacted by the hiring team.
              Data will be retained for 90 days if no match is found, after which it will be deleted.{" "}
              <span className="text-red-400">*</span>
            </span>
          </label>
          {!gdprConsent && (
            <p className="mt-2 text-xs text-muted-foreground">
              You must confirm candidate consent before submitting.
            </p>
          )}
        </div>

        {submitError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!gdprConsent || submitting}
            className="px-6 py-2.5 rounded-xl bg-brand-teal text-white text-sm font-semibold hover:bg-brand-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit Referral"}
          </button>
        </div>
      </form>
    </div>
  );
}
