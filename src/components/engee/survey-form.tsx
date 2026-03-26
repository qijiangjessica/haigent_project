"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  employee_name: string;
  department: string;
  professional_interests: string[];
  personal_interests: string[];
  goals_90_days: string;
  questions_for_mentor: string;
  preferred_platform: "teams" | "slack";
  preferred_meeting_time: "morning" | "afternoon" | "flexible";
}

interface SurveyFormProps {
  onComplete?: (employeeName: string) => void;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const PROFESSIONAL_OPTIONS = [
  // Engineering & Tech
  "Software Engineering",
  "Frontend Development",
  "Backend Development",
  "Mobile Development",
  "System Architecture",
  "DevOps & Cloud",
  "Cybersecurity",
  // Data & AI
  "Data & Analytics",
  "Data Engineering",
  "AI & Machine Learning",
  "Business Intelligence",
  // Product & Design
  "Product Management",
  "UX & Design",
  "Design Systems",
  "Research & Experimentation",
  // Business & Growth
  "Marketing & Growth",
  "Sales & Business Dev",
  "Customer Success",
  "Finance & Accounting",
  // Leadership & People
  "Leadership & Strategy",
  "Project Management",
  "People & Culture",
  "Operations & Process",
  "Legal & Compliance",
];

const PERSONAL_OPTIONS = [
  // Active & Outdoors
  "Running & Cycling",
  "Hiking & Camping",
  "Yoga & Meditation",
  "Sports & Fitness",
  "Surfing & Water Sports",
  "Rock Climbing",
  // Arts & Creativity
  "Music",
  "Photography & Film",
  "Art & Drawing",
  "Writing & Blogging",
  "Dancing",
  "DIY & Making",
  // Food & Lifestyle
  "Cooking & Baking",
  "Coffee & Tea",
  "Wine & Cocktails",
  "Travel & Adventure",
  "Fashion & Style",
  "Gardening",
  // Entertainment & Culture
  "Gaming",
  "Movies & TV",
  "Books & Reading",
  "Podcasts",
  "Board Games",
  "Stand-up Comedy",
  // Social & Giving
  "Volunteering",
  "Pets & Animals",
  "Language Learning",
  "Astronomy & Science",
];

const DEPARTMENTS = [
  "Engineering",
  "Data & Analytics",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "HR",
  "Customer Success",
  "Legal",
];

// ── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: "profile",      label: "Profile" },
  { id: "professional", label: "Professional" },
  { id: "personal",     label: "Personal" },
  { id: "goals",        label: "Goals" },
  { id: "preferences",  label: "Preferences" },
];

const INITIAL: FormData = {
  employee_name: "",
  department: "",
  professional_interests: [],
  personal_interests: [],
  goals_90_days: "",
  questions_for_mentor: "",
  preferred_platform: "slack",
  preferred_meeting_time: "flexible",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ChipSelector({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (updated: string[]) => void;
}) {
  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              active
                ? "bg-brand-cyan text-white border-brand-cyan shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-brand-cyan/50 hover:text-foreground"
            }`}
          >
            {active && <Check className="inline h-3 w-3 mr-1 -mt-0.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-brand-cyan w-6"
                : i === current
                ? "bg-brand-cyan w-8"
                : "bg-muted w-6"
            }`}
          />
        </div>
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {current + 1} / {total}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export function SurveyForm({ onComplete }: SurveyFormProps) {
  const [step, setStep]         = useState(0);
  const [dir, setDir]           = useState(1);
  const [form, setForm]         = useState<FormData>(INITIAL);
  const [done, setDone]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!form.employee_name.trim() && !!form.department.trim();
    if (step === 1) return form.professional_interests.length > 0;
    if (step === 2) return form.personal_interests.length > 0;
    if (step === 3) return !!form.goals_90_days.trim();
    return true;
  }

  function go(delta: number) {
    setDir(delta);
    setStep((s) => s + delta);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/engee/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save survey");
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-4"
        >
          <Check className="h-8 w-8 text-brand-cyan" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Survey submitted, {form.employee_name.split(" ")[0]}!
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-2">
            Your interests have been saved. Engee will now match you with the right mentor
            and can help schedule your first coffee chat.
          </p>

          {/* Summary */}
          <div className="text-left bg-muted rounded-xl p-4 mt-4 mb-6 text-sm space-y-2 max-w-sm mx-auto">
            <div>
              <span className="text-muted-foreground">Professional: </span>
              <span className="text-foreground">{form.professional_interests.slice(0, 3).join(", ")}{form.professional_interests.length > 3 ? ` +${form.professional_interests.length - 3}` : ""}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Personal: </span>
              <span className="text-foreground">{form.personal_interests.slice(0, 3).join(", ")}{form.personal_interests.length > 3 ? ` +${form.personal_interests.length - 3}` : ""}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Platform: </span>
              <span className="text-foreground capitalize">{form.preferred_platform}</span>
            </div>
          </div>

          <button
            onClick={() => onComplete?.(form.employee_name)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-cyan text-white text-sm font-medium hover:bg-brand-cyan/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Find my mentor with Engee
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Form steps ──────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto py-4">
      <StepIndicator current={step} total={STEPS.length} />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            {/* ── Step 0: Profile ──────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Welcome! Let's get to know you</h3>
                  <p className="text-sm text-muted-foreground">This survey helps us match you with the right mentor for your first 90 days.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Your full name</label>
                    <input
                      type="text"
                      value={form.employee_name}
                      onChange={(e) => update("employee_name", e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Your department</label>
                    <select
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30"
                    >
                      <option value="">Select your department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Professional interests ───────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Professional interests</h3>
                  <p className="text-sm text-muted-foreground">What areas do you want to learn and grow in? Select all that apply.</p>
                </div>
                <ChipSelector
                  options={PROFESSIONAL_OPTIONS}
                  selected={form.professional_interests}
                  onChange={(v) => update("professional_interests", v)}
                />
                {form.professional_interests.length > 0 && (
                  <p className="text-xs text-brand-cyan">{form.professional_interests.length} selected</p>
                )}
              </div>
            )}

            {/* ── Step 2: Personal interests ───────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Personal interests</h3>
                  <p className="text-sm text-muted-foreground">What do you enjoy outside of work? Your mentor might share some hobbies!</p>
                </div>
                <ChipSelector
                  options={PERSONAL_OPTIONS}
                  selected={form.personal_interests}
                  onChange={(v) => update("personal_interests", v)}
                />
                {form.personal_interests.length > 0 && (
                  <p className="text-xs text-brand-cyan">{form.personal_interests.length} selected</p>
                )}
              </div>
            )}

            {/* ── Step 3: Goals ─────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Your goals</h3>
                  <p className="text-sm text-muted-foreground">Help your mentor understand where you want to be in 90 days.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    What do you want to achieve in your first 90 days?
                  </label>
                  <textarea
                    value={form.goals_90_days}
                    onChange={(e) => update("goals_90_days", e.target.value)}
                    placeholder="e.g. Get up to speed on the codebase, ship my first feature, and build relationships with the team..."
                    rows={3}
                    className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Any questions for your mentor? <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.questions_for_mentor}
                    onChange={(e) => update("questions_for_mentor", e.target.value)}
                    placeholder="e.g. How did you navigate your first year? What do you wish you'd known earlier?"
                    rows={2}
                    className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── Step 4: Preferences ───────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Meeting preferences</h3>
                  <p className="text-sm text-muted-foreground">How would you like to connect with your mentor?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Preferred platform</label>
                  <div className="flex gap-3">
                    {(["slack", "teams"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update("preferred_platform", p)}
                        className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                          form.preferred_platform === p
                            ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan"
                            : "border-border text-muted-foreground hover:border-brand-cyan/40"
                        }`}
                      >
                        {p === "slack" ? "Slack" : "Microsoft Teams"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Preferred meeting time</label>
                  <div className="flex gap-3">
                    {(["morning", "afternoon", "flexible"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update("preferred_meeting_time", t)}
                        className={`flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                          form.preferred_meeting_time === t
                            ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan"
                            : "border-border text-muted-foreground hover:border-brand-cyan/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mt-4">{error}</p>
      )}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={step === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canAdvance()}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-cyan text-white text-sm font-medium hover:bg-brand-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-cyan text-white text-sm font-medium hover:bg-brand-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Submit Survey"}
            {!loading && <Check className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
