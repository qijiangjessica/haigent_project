"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { SiSlack } from "react-icons/si";

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.625 7.875h-5.25v8.25c0 .621-.504 1.125-1.125 1.125H9.375A3.375 3.375 0 0 0 12.75 20.625h7.875A3.375 3.375 0 0 0 24 17.25v-6a3.375 3.375 0 0 0-3.375-3.375Z" />
      <path d="M15.375 3.375H3.375A3.375 3.375 0 0 0 0 6.75v6a3.375 3.375 0 0 0 3.375 3.375h8.25A3.375 3.375 0 0 0 15 12.75v-6a3.375 3.375 0 0 0-.375-3.375h.75ZM9 12H6.75V7.5H5.25V6h5.25v1.5H9V12Z" />
    </svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  employee_name: string;
  role: string;
  department: string;
  city: string;
  country: string;
  professional_interests: string[];
  learning_interests: string[];
  personal_interests: string[];
  other_hobby: string;
  work_style: string[];
  communication_style: string[];
  motivations: string[];
  personality_traits: string[];
  career_stage: string;
  peak_productivity: string;
  food_preferences: string[];
  weekend_style: string[];
  conversation_topics: string[];
  life_situation: string[];
  goals_90_days: string;
  questions_for_mentor: string;
  preferred_platform: "teams" | "slack";
  preferred_meeting_time: "morning" | "afternoon" | "flexible";
}

interface SurveyFormProps {
  onComplete?: (employeeName: string, department: string, selectedMentorNames: string[]) => void;
}

interface MentorMatch {
  mentor: {
    name: string;
    title: string;
    department: string;
    email: string;
    slack_id?: string;
    bio?: string;
  };
  match_reason: string;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const TECHNICAL_OPTIONS = [
  // Engineering
  "Frontend Development",
  "Backend Development",
  "Mobile Development",
  "System Architecture",
  "DevOps & Cloud",
  "Cybersecurity",
  "APIs & Integrations",
  // Data & AI
  "Data Engineering",
  "Data & Analytics",
  "AI & Machine Learning",
  "Business Intelligence",
  "Data Visualization",
  // Product & Design
  "Product Management",
  "UX & Design",
  "Design Systems",
  "Research & Experimentation",
  // Business & Operations
  "Marketing & Growth",
  "Sales & Business Dev",
  "Customer Success",
  "Finance & Accounting",
  "Operations & Process",
  "Legal & Compliance",
];

const LEARNING_OPTIONS = [
  // Leadership & Career
  "Leadership & Management",
  "Public Speaking",
  "Strategic Thinking",
  "Career Growth",
  "Mentoring Others",
  // Tech Skills
  "AI & Automation",
  "Cloud Platforms",
  "Open Source Contribution",
  "System Design",
  "Developer Experience",
  // Collaboration
  "Cross-functional Collaboration",
  "Agile & Scrum",
  "Project Management",
  "Stakeholder Communication",
  // Industry Knowledge
  "Industry Trends",
  "Startup & Entrepreneurship",
  "Product Strategy",
  "Go-to-Market",
  "People & Culture",
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
  // Other
  "Other",
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

const WORK_STYLE_OPTIONS = [
  "Deep focus alone",
  "Collaborative brainstorming",
  "Async communication",
  "Real-time discussions",
  "Teaching / Mentoring others",
  "Learning from others",
];

const COMMUNICATION_STYLE_OPTIONS = [
  "Direct & concise",
  "Detailed & thorough",
  "Visual (diagrams / docs)",
  "Verbal (calls / meetings)",
  "Written (docs / email / chat)",
  "Adaptive to the situation",
];

const MOTIVATION_OPTIONS = [
  "Learning and growth",
  "Impact and purpose",
  "Work-life balance",
  "Career advancement",
  "Team collaboration",
  "Innovation and creativity",
  "Autonomy and flexibility",
  "Helping others succeed",
];

const TRAIT_OPTIONS = [
  "Introverted",
  "Extroverted",
  "Analytical",
  "Creative",
  "Organized",
  "Spontaneous",
  "Collaborative",
  "Detail-oriented",
];

const CAREER_STAGE_OPTIONS = [
  "Student / Intern",
  "Early career (0–2 yrs)",
  "Mid-level (3–7 yrs)",
  "Senior (8+ yrs)",
  "Leadership / Manager",
  "Career changer",
];

const PEAK_PRODUCTIVITY_OPTIONS = [
  "Early morning (5–8 am)",
  "Morning (8–11 am)",
  "Midday (11 am–2 pm)",
  "Afternoon (2–5 pm)",
  "Evening (5–8 pm)",
  "Night owl (8 pm+)",
];

const FOOD_PREFERENCE_OPTIONS = [
  "Coffee lover",
  "Tea enthusiast",
  "Foodie / Adventurous eater",
  "Health-conscious",
  "Home cooking enthusiast",
  "Don't drink alcohol",
];

const WEEKEND_STYLE_OPTIONS = [
  "Active & outdoorsy",
  "Social & going out",
  "Relaxing at home",
  "Hobby projects",
  "Family time",
  "Mix of everything",
];

const CONVERSATION_TOPIC_OPTIONS = [
  "Technology",
  "Books / Movies / TV",
  "Sports & Fitness",
  "Travel & Adventure",
  "Food & Restaurants",
  "Music & Concerts",
  "Science & Innovation",
  "Current Events & News",
  "Philosophy & Big Ideas",
  "Entrepreneurship & Startups",
];

const LIFE_SITUATION_OPTIONS = [
  "Single",
  "In a relationship / Married",
  "Parent",
  "Pet parent",
  "Recently relocated",
  "Prefer not to answer",
];

// ── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: "profile",      label: "Profile" },
  { id: "professional", label: "Professional" },
  { id: "personal",     label: "Personal" },
  { id: "workstyle",    label: "Work Style" },
  { id: "personal_pref", label: "Preferences" },
  { id: "goals",        label: "Goals" },
  { id: "matches",      label: "Your Matches" },
];

const INITIAL: FormData = {
  employee_name: "",
  role: "",
  department: "",
  city: "",
  country: "",
  professional_interests: [],
  learning_interests: [],
  personal_interests: [],
  other_hobby: "",
  work_style: [],
  communication_style: [],
  motivations: [],
  personality_traits: [],
  career_stage: "",
  peak_productivity: "",
  food_preferences: [],
  weekend_style: [],
  conversation_topics: [],
  life_situation: [],
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
                ? "bg-brand-lime text-white border-brand-lime shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-brand-lime/50 hover:text-foreground"
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
                ? "bg-brand-lime w-6"
                : i === current
                ? "bg-brand-lime w-8"
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
  const [step, setStep]           = useState(0);
  const [dir, setDir]             = useState(1);
  const [form, setForm]           = useState<FormData>(INITIAL);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [mentorMatches, setMentorMatches]   = useState<MentorMatch[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);

  function toggleMentor(email: string) {
    setSelectedMentors((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!form.employee_name.trim() && !!form.role.trim() && !!form.department.trim() && !!form.city.trim() && !!form.country.trim();
    if (step === 1) return form.professional_interests.length > 0 && form.learning_interests.length > 0;
    if (step === 2) return form.personal_interests.length > 0;
    if (step === 3) return form.work_style.length > 0 && form.motivations.length > 0 && form.personality_traits.length > 0;
    if (step === 4) return !!form.career_stage && !!form.peak_productivity;
    if (step === 5) return !!form.goals_90_days.trim();
    return true;
  }

  function go(delta: number) {
    setDir(delta);
    setStep((s) => s + delta);
  }

  async function handleSubmitAndMatch() {
    setLoading(true);
    setError(null);
    try {
      const personal_interests = form.personal_interests.map((h) =>
        h === "Other" && form.other_hobby.trim() ? form.other_hobby.trim() : h
      );

      // Submit survey
      const res = await fetch("/api/engee/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, personal_interests }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save survey");

      // Fetch top 3 mentor matches
      const matchRes = await fetch("/api/engee/mentor-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: form.department,
          professional_interests: form.professional_interests,
          learning_interests: form.learning_interests,
          personal_interests,
        }),
      });
      const matchData = await matchRes.json();
      setMentorMatches(matchData.matches ?? []);

      // Advance to results page
      setDir(1);
      setStep(6);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
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
            {/* ── Step 0: Basic Context ─────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Welcome! Let's get to know you</h3>
                  <p className="text-sm text-muted-foreground">This survey helps us match you with the right mentor and connect you with employee communities built around shared interests and hobbies.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Full name</label>
                    <input
                      type="text"
                      value={form.employee_name}
                      onChange={(e) => update("employee_name", e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Role / Job title</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => update("role", e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                    >
                      <option value="">Select your department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-1">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="e.g. Vancouver"
                        className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                        placeholder="e.g. Canada"
                        className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Professional interests ───────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Professional interests</h3>
                  <p className="text-sm text-muted-foreground">Select all that apply to help us match you with the right communities and mentor.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What technical areas are you interested in?</p>
                  <ChipSelector
                    options={TECHNICAL_OPTIONS}
                    selected={form.professional_interests}
                    onChange={(v) => update("professional_interests", v)}
                  />
                  {form.professional_interests.length > 0 && (
                    <p className="text-xs text-brand-lime">{form.professional_interests.length} selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What would you like to learn more?</p>
                  <ChipSelector
                    options={LEARNING_OPTIONS}
                    selected={form.learning_interests}
                    onChange={(v) => update("learning_interests", v)}
                  />
                  {form.learning_interests.length > 0 && (
                    <p className="text-xs text-brand-lime">{form.learning_interests.length} selected</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: Hobbies & Activities ─────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Hobbies & Activities</h3>
                  <p className="text-sm text-muted-foreground">What do you enjoy outside of work? Your selections help us connect you with employee communities and find a mentor who shares your hobbies.</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">What are your hobbies?</p>
                  <ChipSelector
                    options={PERSONAL_OPTIONS}
                    selected={form.personal_interests}
                    onChange={(v) => update("personal_interests", v)}
                  />
                  {form.personal_interests.length > 0 && (
                    <p className="text-xs text-brand-lime mt-2">{form.personal_interests.length} selected</p>
                  )}
                </div>
                {form.personal_interests.includes("Other") && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tell us your hobby
                    </label>
                    <input
                      type="text"
                      value={form.other_hobby}
                      onChange={(e) => update("other_hobby", e.target.value)}
                      placeholder="e.g. Pottery, Beekeeping, Bouldering..."
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Work Style & Values ───────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Work Style & Values</h3>
                  <p className="text-sm text-muted-foreground">Help us understand how you work best so we can connect you with the right people and communities.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">How do you prefer to work?</p>
                  <ChipSelector
                    options={WORK_STYLE_OPTIONS}
                    selected={form.work_style}
                    onChange={(v) => update("work_style", v)}
                  />
                  {form.work_style.length > 0 && (
                    <p className="text-xs text-brand-lime">{form.work_style.length} selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What's your communication style?</p>
                  <ChipSelector
                    options={COMMUNICATION_STYLE_OPTIONS}
                    selected={form.communication_style}
                    onChange={(v) => update("communication_style", v)}
                  />
                  {form.communication_style.length > 0 && (
                    <p className="text-xs text-brand-lime">{form.communication_style.length} selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What motivates you at work?</p>
                  <ChipSelector
                    options={MOTIVATION_OPTIONS}
                    selected={form.motivations}
                    onChange={(v) => update("motivations", v)}
                  />
                  {form.motivations.length > 0 && (
                    <p className="text-xs text-brand-lime">{form.motivations.length} selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Which traits best describe you?</p>
                  <ChipSelector
                    options={TRAIT_OPTIONS}
                    selected={form.personality_traits}
                    onChange={(v) => update("personality_traits", v)}
                  />
                  {form.personality_traits.length > 0 && (
                    <p className="text-xs text-brand-lime">{form.personality_traits.length} selected</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Personal Preferences ─────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">Personal Preferences</h3>
                  <p className="text-sm text-muted-foreground">Help us get to know the real you so we can find the best community and mentor fit.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Career stage</p>
                  <div className="flex flex-wrap gap-2">
                    {CAREER_STAGE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("career_stage", opt)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          form.career_stage === opt
                            ? "bg-brand-lime text-white border-brand-lime shadow-sm"
                            : "bg-white text-muted-foreground border-border hover:border-brand-lime/50 hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Peak productivity time</p>
                  <div className="flex flex-wrap gap-2">
                    {PEAK_PRODUCTIVITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => update("peak_productivity", opt)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          form.peak_productivity === opt
                            ? "bg-brand-lime text-white border-brand-lime shadow-sm"
                            : "bg-white text-muted-foreground border-border hover:border-brand-lime/50 hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Food & drink preferences</p>
                  <ChipSelector
                    options={FOOD_PREFERENCE_OPTIONS}
                    selected={form.food_preferences}
                    onChange={(v) => update("food_preferences", v)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">How do you typically spend your weekends?</p>
                  <ChipSelector
                    options={WEEKEND_STYLE_OPTIONS}
                    selected={form.weekend_style}
                    onChange={(v) => update("weekend_style", v)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">What do you enjoy talking about?</p>
                  <ChipSelector
                    options={CONVERSATION_TOPIC_OPTIONS}
                    selected={form.conversation_topics}
                    onChange={(v) => update("conversation_topics", v)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Life situation <span className="text-muted-foreground font-normal">(optional)</span>
                  </p>
                  <ChipSelector
                    options={LIFE_SITUATION_OPTIONS}
                    selected={form.life_situation}
                    onChange={(v) => update("life_situation", v)}
                  />
                </div>
              </div>
            )}

            {/* ── Step 5: Goals & Meeting Preferences ───────────────────── */}
            {step === 5 && (
              <div className="space-y-5">
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
                    className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30 resize-none"
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
                    className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-lime/30 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Preferred platform</label>
                  <div className="flex gap-3">
                    {(["slack", "teams"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => update("preferred_platform", p)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          form.preferred_platform === p
                            ? "border-brand-lime bg-brand-lime/5 text-brand-lime"
                            : "border-border text-muted-foreground hover:border-brand-lime/40"
                        }`}
                      >
                        {p === "slack"
                          ? <><SiSlack className="h-4 w-4 text-[#E01E5A]" /> Slack</>
                          : <><TeamsIcon className="h-4 w-4 text-[#6264A7]" /> Microsoft Teams</>}
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
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                          form.preferred_meeting_time === t
                            ? "border-brand-lime bg-brand-lime/5 text-brand-lime"
                            : "border-border text-muted-foreground hover:border-brand-lime/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 6: Mentor Match Results ───────────────────────────── */}
            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-0.5">
                    Your mentor matches, {form.employee_name.split(" ")[0]}!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select one or more mentors to schedule a coffee chat with.
                  </p>
                </div>

                {mentorMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matches found. Try chatting with Engee for personalized suggestions.</p>
                ) : (
                  <div className="space-y-3">
                    {mentorMatches.map((match, i) => {
                      const isSelected = selectedMentors.includes(match.mentor.email);
                      return (
                        <button
                          key={match.mentor.email}
                          type="button"
                          onClick={() => toggleMentor(match.mentor.email)}
                          className={`w-full text-left rounded-xl border p-4 space-y-2 transition-all ${
                            isSelected
                              ? "border-brand-lime bg-brand-lime/5 shadow-sm"
                              : "border-border bg-white hover:border-brand-lime/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 transition-colors ${
                              isSelected ? "bg-brand-lime text-white" : "bg-brand-lime/10 text-brand-lime"
                            }`}>
                              {isSelected
                                ? <Check className="h-4 w-4" />
                                : match.mentor.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{match.mentor.name}</p>
                                {i === 0 && !isSelected && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-lime/10 text-brand-lime font-medium">
                                    Best match
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-lime text-white font-medium">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{match.mentor.title} · {match.mentor.department}</p>
                            </div>
                          </div>

                          {match.mentor.bio && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{match.mentor.bio}</p>
                          )}

                          <div className="flex items-start gap-1.5 bg-brand-lime/5 rounded-lg px-3 py-2">
                            <Sparkles className="h-3.5 w-3.5 text-brand-lime mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-brand-lime">{match.match_reason}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  disabled={selectedMentors.length === 0}
                  onClick={() => {
                    const names = mentorMatches
                      .filter((m) => selectedMentors.includes(m.mentor.email))
                      .map((m) => m.mentor.name);
                    onComplete?.(form.employee_name, form.department, names);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-lime text-white text-sm font-medium hover:bg-brand-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  {selectedMentors.length === 0
                    ? "Select a mentor to continue"
                    : `Schedule coffee chat with ${selectedMentors.length === 1 ? "1 mentor" : `${selectedMentors.length} mentors`}`}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mt-4">{error}</p>
      )}
      {step < STEPS.length - 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step < STEPS.length - 2 ? (
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-lime text-white text-sm font-medium hover:bg-brand-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAndMatch}
              disabled={!canAdvance() || loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-lime text-white text-sm font-medium hover:bg-brand-lime/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Finding matches..." : "Find My Matches"}
              {!loading && <Sparkles className="h-4 w-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
