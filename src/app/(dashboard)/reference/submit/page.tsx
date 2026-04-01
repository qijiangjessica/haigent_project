"use client";

import { useState, useRef, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { OPEN_JOBS } from "@/data/reference/jobs";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { CheckCircle2, Upload, X, FileText, AlertTriangle } from "lucide-react";

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

export default function SubmitReferralPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const resumeRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setResumeFile(file);
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
          <h3 className="font-semibold text-sm text-foreground mb-4">Candidate Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Candidate Name <span className="text-red-400">*</span>
              </label>
              <input
                name="candidateName"
                value={form.candidateName}
                onChange={handleChange}
                required
                placeholder="e.g. Alex Rivera"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                name="candidateEmail"
                type="email"
                value={form.candidateEmail}
                onChange={handleChange}
                required
                placeholder="candidate@example.com"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
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
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone</label>
              <input
                name="candidatePhone"
                value={form.candidatePhone}
                onChange={handleChange}
                placeholder="+1-604-555-0100"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Current Employer
              </label>
              <input
                name="currentEmployer"
                value={form.currentEmployer}
                onChange={handleChange}
                placeholder="e.g. Accenture"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Years of Experience
              </label>
              <input
                name="yearsExperience"
                type="number"
                min="0"
                max="50"
                value={form.yearsExperience}
                onChange={handleChange}
                placeholder="e.g. 7"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Vancouver, BC"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
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
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Key Skills
                <span className="ml-1 font-normal">(comma-separated — used for AI match scoring)</span>
              </label>
              <input
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. Python, SQL, Leadership, Machine Learning"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                LinkedIn URL
              </label>
              <input
                name="linkedinUrl"
                type="url"
                value={form.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resume upload */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Resume / CV
              </label>
              <input
                ref={resumeRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="hidden"
              />
              {resumeFile ? (
                <div className="flex items-center gap-2 bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-3 py-2">
                  <FileText className="h-4 w-4 text-brand-teal flex-shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{resumeFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeFile(null);
                      if (resumeRef.current) resumeRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => resumeRef.current?.click()}
                  className="w-full flex items-center gap-2 bg-muted border border-dashed border-border rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload PDF, DOC, DOCX
                </button>
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
