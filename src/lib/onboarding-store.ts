// ── Onboarding Store ──────────────────────────────────────────────────────────
// In-memory store for employee onboarding records and IT incidents.
// Swap the Maps for a DB client (Supabase, PostgreSQL, etc.) without changing callers.

export interface OnboardingRecord {
  sys_id: string;
  employee_name: string;
  employee_id: string;
  position: string;
  department: string;
  office_location: string;
  onboarding_status: "pending" | "in_progress" | "completed" | "on_hold";
  start_date: string;
  equipment_assigned: boolean;
  access_provisioned: boolean;
  documents_completed: boolean;
  training_scheduled: boolean;
  workspace_prepared: boolean;
  benefits_enrolled: boolean;
  notes: string;
}

export interface ITIncident {
  id: string;
  short_description: string;
  description: string;
  caller_name: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const onboardingRecords = new Map<string, OnboardingRecord>();
const itIncidents = new Map<string, ITIncident>();

const SEED_RECORDS: OnboardingRecord[] = [
  {
    sys_id: "emp_001",
    employee_name: "Alex Johnson", employee_id: "EMP001",
    position: "Software Engineer", department: "Engineering",
    office_location: "Vancouver, BC", onboarding_status: "in_progress",
    start_date: "2026-03-17",
    equipment_assigned: true, access_provisioned: true, workspace_prepared: true,
    orientation_completed: true, documents_completed: false, training_scheduled: false,
    benefits_enrolled: false,
    notes: "Laptop shipped. Badge access pending.",
  } as unknown as OnboardingRecord,
  {
    sys_id: "emp_002",
    employee_name: "Maria Santos", employee_id: "EMP002",
    position: "Data Analyst", department: "Data & Analytics",
    office_location: "Vancouver, BC", onboarding_status: "pending",
    start_date: "2026-03-24",
    equipment_assigned: true, access_provisioned: false, workspace_prepared: false,
    documents_completed: false, training_scheduled: false, benefits_enrolled: false,
    notes: "Start date approaching — IT accounts not yet created.",
  },
  {
    sys_id: "emp_003",
    employee_name: "James Park", employee_id: "EMP003",
    position: "Product Manager", department: "Product",
    office_location: "Toronto, ON", onboarding_status: "completed",
    start_date: "2026-02-03",
    equipment_assigned: true, access_provisioned: true, workspace_prepared: true,
    documents_completed: true, training_scheduled: true, benefits_enrolled: true,
    notes: "Fully onboarded. 30-day check-in completed.",
  },
  {
    sys_id: "emp_004",
    employee_name: "Priya Nair", employee_id: "EMP004",
    position: "HR Coordinator", department: "HR",
    office_location: "Vancouver, BC", onboarding_status: "on_hold",
    start_date: "2026-03-10",
    equipment_assigned: false, access_provisioned: false, workspace_prepared: false,
    documents_completed: false, training_scheduled: false, benefits_enrolled: false,
    notes: "Background check pending — onboarding on hold.",
  },
];
SEED_RECORDS.forEach(r => onboardingRecords.set(r.sys_id, r));

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export function getAllRecords(): OnboardingRecord[] {
  return Array.from(onboardingRecords.values());
}

export function getRecordByEmployee(nameOrId: string): OnboardingRecord | null {
  const lower = nameOrId.toLowerCase();
  for (const r of onboardingRecords.values()) {
    if (
      r.employee_name.toLowerCase().includes(lower) ||
      r.employee_id.toLowerCase() === lower
    ) return r;
  }
  return null;
}

export function updateTask(
  employeeName: string,
  task: "equipment_assigned" | "access_provisioned" | "documents_completed" | "training_scheduled" | "workspace_prepared",
  completed: boolean
): OnboardingRecord | null {
  const record = getRecordByEmployee(employeeName);
  if (!record) return null;
  record[task] = completed;
  // Auto-update status
  const tasks = [record.equipment_assigned, record.access_provisioned, record.documents_completed, record.training_scheduled, record.workspace_prepared];
  const done = tasks.filter(Boolean).length;
  if (done === 5) record.onboarding_status = "completed";
  else if (done > 0) record.onboarding_status = "in_progress";
  onboardingRecords.set(record.sys_id, record);
  return record;
}

export function createITIncident(
  short_description: string,
  description: string,
  caller_name: string
): ITIncident {
  const incident: ITIncident = {
    id: `INC${Date.now()}`,
    short_description,
    description,
    caller_name: caller_name || "Employee",
    status: "open",
    created_at: new Date().toISOString().split("T")[0],
  };
  itIncidents.set(incident.id, incident);
  return incident;
}
