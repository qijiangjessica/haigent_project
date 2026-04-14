// ── Benefits Store ────────────────────────────────────────────────────────────
// In-memory store for benefits catalog and employee inquiries.
// Swap the Maps for a DB client (Supabase, PostgreSQL, etc.) without changing callers.

export interface BenefitType {
  id: string;
  benefit_name: string;
  benefit_description: string;
  category: "health" | "dental" | "vision" | "retirement" | "life_insurance" | "disability" | "wellness" | "time_off" | "employee_assistance" | "professional_development" | "commuter" | "other";
  cost: string;                   // employee monthly cost in USD
  employer_contribution: string;  // employer monthly contribution in USD or description
  eligibility: string;
  enrollment_period: string;
  provider: string;
  active: boolean;
}

export interface BenefitInquiry {
  id: string;
  employee_name: string;
  inquiry_type: "search" | "enrollment" | "information" | "change" | "complaint";
  benefit_category: BenefitType["category"] | null;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  assigned_to: string;
  inquiry_date: string;
  resolution_notes: string;
}

// ── Benefits Catalog (seed data) ─────────────────────────────────────────────

export const BENEFIT_CATALOG: BenefitType[] = [
  {
    id: "ben_001",
    benefit_name: "Health Insurance — Premium Plan",
    benefit_description: "Comprehensive medical coverage including specialist visits, hospital stays, and prescriptions. Low deductible with broad network.",
    category: "health", cost: "280", employer_contribution: "220",
    eligibility: "Full-time employees", provider: "BlueCross BlueShield",
    enrollment_period: "Within 30 days of hire or annual open enrollment",
    active: true,
  },
  {
    id: "ben_002",
    benefit_name: "Health Insurance — Standard Plan",
    benefit_description: "Core medical coverage with higher deductible and lower monthly premium. Includes HSA eligibility.",
    category: "health", cost: "120", employer_contribution: "180",
    eligibility: "Full-time employees", provider: "BlueCross BlueShield",
    enrollment_period: "Within 30 days of hire or annual open enrollment",
    active: true,
  },
  {
    id: "ben_003",
    benefit_name: "Dental Coverage",
    benefit_description: "Preventive, basic, and major dental services. Includes orthodontia for dependents under 19.",
    category: "dental", cost: "25", employer_contribution: "15",
    eligibility: "Full-time and part-time (20+ hrs/week)", provider: "Delta Dental",
    enrollment_period: "Within 30 days of hire or annual open enrollment",
    active: true,
  },
  {
    id: "ben_004",
    benefit_name: "Vision Coverage",
    benefit_description: "Annual eye exams plus $150 allowance for frames, lenses, or contacts.",
    category: "vision", cost: "10", employer_contribution: "5",
    eligibility: "Full-time and part-time (20+ hrs/week)", provider: "VSP",
    enrollment_period: "Within 30 days of hire or annual open enrollment",
    active: true,
  },
  {
    id: "ben_005",
    benefit_name: "401(k) Retirement Plan",
    benefit_description: "Pre-tax and Roth contributions. Employer matches 100% of first 3% and 50% of next 2% (up to 4% total match).",
    category: "retirement", cost: "0", employer_contribution: "Up to 4% salary match",
    eligibility: "Full-time employees after 90 days", provider: "Fidelity",
    enrollment_period: "Any time after eligibility",
    active: true,
  },
  {
    id: "ben_006",
    benefit_name: "Life Insurance",
    benefit_description: "Company-paid basic life at 2× annual salary. Optional supplemental up to 5× salary available.",
    category: "life_insurance", cost: "0", employer_contribution: "100% of basic coverage",
    eligibility: "All full-time employees", provider: "MetLife",
    enrollment_period: "Automatic on start date; supplemental within 30 days of hire",
    active: true,
  },
  {
    id: "ben_007",
    benefit_name: "Short & Long-Term Disability",
    benefit_description: "Short-term: 60% salary for up to 12 weeks. Long-term: 60% salary after 90-day waiting period.",
    category: "disability", cost: "0", employer_contribution: "100%",
    eligibility: "All full-time employees", provider: "MetLife",
    enrollment_period: "Automatic on start date",
    active: true,
  },
  {
    id: "ben_008",
    benefit_name: "Wellness Stipend",
    benefit_description: "$50/month reimbursement for gym memberships, fitness apps, wellness equipment, or meditation apps.",
    category: "wellness", cost: "0", employer_contribution: "50",
    eligibility: "All employees after 60 days", provider: "Internal",
    enrollment_period: "Submit receipts monthly via expense portal",
    active: true,
  },
  {
    id: "ben_009",
    benefit_name: "Flexible PTO",
    benefit_description: "Unlimited flexible time off with manager approval. Minimum 10 days encouraged annually.",
    category: "time_off", cost: "0", employer_contribution: "N/A",
    eligibility: "All full-time employees", provider: "Internal",
    enrollment_period: "Available from day one",
    active: true,
  },
  {
    id: "ben_010",
    benefit_name: "Employee Assistance Program (EAP)",
    benefit_description: "Free confidential counselling (up to 6 sessions/year), legal consultations, and financial planning services.",
    category: "employee_assistance", cost: "0", employer_contribution: "100%",
    eligibility: "All employees and household members", provider: "Lyra Health",
    enrollment_period: "Available from day one",
    active: true,
  },
  {
    id: "ben_011",
    benefit_name: "Professional Development Budget",
    benefit_description: "$1,500/year for conferences, courses, certifications, or books. Requires manager approval.",
    category: "professional_development", cost: "0", employer_contribution: "Up to $1,500/year",
    eligibility: "Full-time employees after 6 months", provider: "Internal",
    enrollment_period: "Submit requests any time; resets annually in January",
    active: true,
  },
  {
    id: "ben_012",
    benefit_name: "Commuter Benefits",
    benefit_description: "Pre-tax payroll deduction for transit passes and parking up to IRS limits ($315/month each in 2026).",
    category: "commuter", cost: "0", employer_contribution: "Pre-tax savings only",
    eligibility: "All employees", provider: "WageWorks",
    enrollment_period: "Enroll or change any time",
    active: true,
  },
];

// ── Inquiry Store ─────────────────────────────────────────────────────────────

const inquiries = new Map<string, BenefitInquiry>();

// Seed with a couple of sample inquiries
const SEED_INQUIRIES: BenefitInquiry[] = [
  {
    id: "inq_001", employee_name: "Alex Johnson",
    inquiry_type: "enrollment", benefit_category: "health",
    description: "I'd like to enroll in the Premium Health Plan for myself and my spouse.",
    status: "in_progress", priority: "medium",
    assigned_to: "HR Benefits Team", inquiry_date: "2026-03-18",
    resolution_notes: "Enrollment form sent to employee on 2026-03-18.",
  },
  {
    id: "inq_002", employee_name: "James Park",
    inquiry_type: "information", benefit_category: "retirement",
    description: "Can I increase my 401(k) contribution percentage mid-year?",
    status: "resolved", priority: "low",
    assigned_to: "HR Benefits Team", inquiry_date: "2026-02-10",
    resolution_notes: "Yes — log in to the Fidelity portal and update your contribution percentage any time.",
  },
];
SEED_INQUIRIES.forEach(i => inquiries.set(i.id, i));

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export function getBenefitCatalog(): BenefitType[] {
  return BENEFIT_CATALOG.filter(b => b.active);
}

export function getInquiriesByEmployee(employeeName: string): BenefitInquiry[] {
  return Array.from(inquiries.values()).filter(i =>
    i.employee_name.toLowerCase().includes(employeeName.toLowerCase())
  );
}

export function getAllInquiries(): BenefitInquiry[] {
  return Array.from(inquiries.values());
}

export function createInquiry(
  data: Omit<BenefitInquiry, "id" | "inquiry_date" | "assigned_to" | "resolution_notes" | "status" | "priority">
): BenefitInquiry {
  const inquiry: BenefitInquiry = {
    ...data,
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: "open",
    priority: data.inquiry_type === "complaint" ? "high" : "medium",
    assigned_to: "HR Benefits Team",
    inquiry_date: new Date().toISOString().split("T")[0],
    resolution_notes: "",
  };
  inquiries.set(inquiry.id, inquiry);
  return inquiry;
}

export function updateInquiry(
  id: string,
  fields: Partial<Pick<BenefitInquiry, "status" | "resolution_notes" | "assigned_to" | "priority">>
): BenefitInquiry | null {
  const existing = inquiries.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...fields };
  inquiries.set(id, updated);
  return updated;
}

export function getInquiryById(id: string): BenefitInquiry | null {
  return inquiries.get(id) ?? null;
}
