const {
  SERVICENOW_INSTANCE_URL,
  SERVICENOW_USERNAME,
  SERVICENOW_PASSWORD,
} = process.env;

// Table names — must be defined before mock data references them
export const ONBOARDING_TABLE         = "x_1926120_employee_onboarding";
export const BENEFIT_TYPES_TABLE      = "x_1926120_employee_benefits_catalog";
export const BENEFIT_ENROLLMENT_TABLE = "x_1926120_employee_benefits_inquiry";

// ── Mock data (used when SERVICENOW_INSTANCE_URL is not set) ─────────────────

const MOCK_ONBOARDING: TableRecord[] = [
  {
    sys_id: "mock_emp_001",
    employee_name: "Alex Johnson", employee_id: "EMP001", department: "Engineering",
    position: "Software Engineer", start_date: "2026-03-17",
    onboarding_status: "in_progress",
    equipment_requested: true, it_account_created: true, workspace_assigned: true,
    orientation_completed: true, documents_completed: false, employee_training: false,
    notes: "Laptop shipped, waiting on badge access.",
  },
  {
    sys_id: "mock_emp_002",
    employee_name: "Maria Santos", employee_id: "EMP002", department: "Data & Analytics",
    position: "Data Analyst", start_date: "2026-03-24",
    onboarding_status: "pending",
    equipment_requested: true, it_account_created: false, workspace_assigned: false,
    orientation_completed: false, documents_completed: false, employee_training: false,
    notes: "Start date approaching — IT accounts not yet created.",
  },
  {
    sys_id: "mock_emp_003",
    employee_name: "James Park", employee_id: "EMP003", department: "Product",
    position: "Product Manager", start_date: "2026-02-03",
    onboarding_status: "completed",
    equipment_requested: true, it_account_created: true, workspace_assigned: true,
    orientation_completed: true, documents_completed: true, employee_training: true,
    notes: "Fully onboarded. 30-day check-in completed.",
  },
  {
    sys_id: "mock_emp_004",
    employee_name: "Priya Nair", employee_id: "EMP004", department: "HR",
    position: "HR Coordinator", start_date: "2026-03-10",
    onboarding_status: "on_hold",
    equipment_requested: false, it_account_created: false, workspace_assigned: false,
    orientation_completed: false, documents_completed: false, employee_training: false,
    notes: "Background check pending — onboarding on hold.",
  },
];

const MOCK_BENEFIT_TYPES: TableRecord[] = [
  {
    sys_id: "mock_ben_001", benefit_name: "Health Insurance — Premium Plan",
    benefit_description: "Comprehensive medical coverage including specialist visits, hospital stays, and prescriptions.",
    category: "health", cost: "280", employer_contribution: "220",
    eligibility: "Full-time employees", enrollment_period: "Within 30 days of hire or annual open enrollment",
    provider: "BlueCross BlueShield", active: true,
  },
  {
    sys_id: "mock_ben_002", benefit_name: "Health Insurance — Standard Plan",
    benefit_description: "Core medical coverage with higher deductible and lower premium.",
    category: "health", cost: "120", employer_contribution: "180",
    eligibility: "Full-time employees", enrollment_period: "Within 30 days of hire or annual open enrollment",
    provider: "BlueCross BlueShield", active: true,
  },
  {
    sys_id: "mock_ben_003", benefit_name: "Dental Coverage",
    benefit_description: "Preventive, basic, and major dental services including orthodontia.",
    category: "dental", cost: "25", employer_contribution: "15",
    eligibility: "Full-time and part-time (20+ hrs)", enrollment_period: "Within 30 days of hire",
    provider: "Delta Dental", active: true,
  },
  {
    sys_id: "mock_ben_004", benefit_name: "Vision Coverage",
    benefit_description: "Annual eye exams, frames, lenses or contact lens allowance.",
    category: "vision", cost: "10", employer_contribution: "5",
    eligibility: "Full-time and part-time (20+ hrs)", enrollment_period: "Within 30 days of hire",
    provider: "VSP", active: true,
  },
  {
    sys_id: "mock_ben_005", benefit_name: "401(k) Retirement Plan",
    benefit_description: "Pre-tax and Roth contributions with employer match up to 4% of salary.",
    category: "retirement", cost: "0", employer_contribution: "Up to 4% match",
    eligibility: "Full-time employees after 90 days", enrollment_period: "Any time",
    provider: "Fidelity", active: true,
  },
  {
    sys_id: "mock_ben_006", benefit_name: "Life Insurance",
    benefit_description: "Company-paid basic life insurance at 2x annual salary. Supplemental available.",
    category: "life_insurance", cost: "0", employer_contribution: "100%",
    eligibility: "All full-time employees", enrollment_period: "Automatic enrollment on start date",
    provider: "MetLife", active: true,
  },
  {
    sys_id: "mock_ben_007", benefit_name: "Wellness Stipend",
    benefit_description: "$50/month reimbursement for gym memberships, fitness apps, or wellness equipment.",
    category: "wellness", cost: "0", employer_contribution: "50",
    eligibility: "All employees after 60 days", enrollment_period: "Submit receipts monthly",
    provider: "Internal", active: true,
  },
  {
    sys_id: "mock_ben_008", benefit_name: "Flexible PTO",
    benefit_description: "Unlimited flexible time off with manager approval. Minimum 10 days encouraged.",
    category: "time_off", cost: "0", employer_contribution: "N/A",
    eligibility: "All full-time employees", enrollment_period: "Available from day one",
    provider: "Internal", active: true,
  },
];

const MOCK_BENEFIT_INQUIRIES: TableRecord[] = [
  {
    sys_id: "mock_inq_001", employee: "Alex Johnson",
    inquiry_type: "enrollment", benefit_category: "health",
    description: "I'd like to enroll in the Premium Health Plan for myself and my spouse.",
    status: "in_progress", priority: "medium",
    assigned_to: "HR Benefits Team", inquiry_date: "2026-03-18",
    resolution_notes: "Enrollment form sent to employee.",
  },
  {
    sys_id: "mock_inq_002", employee: "James Park",
    inquiry_type: "information", benefit_category: "retirement",
    description: "Can I increase my 401(k) contribution mid-year?",
    status: "resolved", priority: "low",
    assigned_to: "HR Benefits Team", inquiry_date: "2026-02-10",
    resolution_notes: "Yes — log in to Fidelity portal and update contribution percentage any time.",
  },
];

// In-memory write store for mock creates/updates
const mockInquiryStore: TableRecord[] = [...MOCK_BENEFIT_INQUIRIES];

function mockQuery(table: string, options: TableQueryOptions): TableRecord[] {
  let records: TableRecord[] = [];

  if (table === ONBOARDING_TABLE)        records = [...MOCK_ONBOARDING];
  else if (table === BENEFIT_TYPES_TABLE) records = [...MOCK_BENEFIT_TYPES];
  else if (table === BENEFIT_ENROLLMENT_TABLE) records = [...mockInquiryStore];
  else return [];

  // Simple query filter: field=value or fieldLIKEvalue
  if (options.sysparm_query) {
    const q = options.sysparm_query;
    const likeMatch = q.match(/^(\w+)LIKE(.+)$/);
    const eqMatch   = q.match(/^(\w+)=(.+)$/);
    if (likeMatch) {
      const [, field, val] = likeMatch;
      records = records.filter(r => String(r[field] ?? "").toLowerCase().includes(val.toLowerCase()));
    } else if (eqMatch) {
      const [, field, val] = eqMatch;
      records = records.filter(r => String(r[field] ?? "") === val);
    }
  }

  if (options.sysparm_limit) records = records.slice(0, options.sysparm_limit);
  return records;
}

function mockUpdate(table: string, sysId: string, fields: Record<string, unknown>): TableRecord {
  const store = table === BENEFIT_ENROLLMENT_TABLE ? mockInquiryStore : MOCK_ONBOARDING;
  const idx = store.findIndex(r => r.sys_id === sysId);
  if (idx === -1) throw new Error(`Mock record not found: ${sysId}`);
  store[idx] = { ...store[idx], ...fields };
  return store[idx];
}

function mockCreate(table: string, fields: Record<string, unknown>): TableRecord {
  const record: TableRecord = {
    ...fields,
    sys_id: `mock_${Date.now()}`,
    inquiry_date: new Date().toISOString().split("T")[0],
    assigned_to: "HR Benefits Team",
  };
  if (table === BENEFIT_ENROLLMENT_TABLE) mockInquiryStore.push(record);
  return record;
}

// Base64 Basic Auth header
function getBasicAuth(): string {
  const credentials = `${SERVICENOW_USERNAME}:${SERVICENOW_PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export function getInstanceUrl(): string {
  return SERVICENOW_INSTANCE_URL!;
}

// ---- Table API helpers ----

export interface TableQueryOptions {
  sysparm_query?: string;
  sysparm_fields?: string;
  sysparm_limit?: number;
  sysparm_display_value?: boolean | "all";
}

export interface TableRecord {
  sys_id: string;
  [key: string]: unknown;
}

/** Query records from a ServiceNow table */
export async function queryTable(
  tableName: string,
  options: TableQueryOptions = {}
): Promise<TableRecord[]> {
  if (!SERVICENOW_INSTANCE_URL || !SERVICENOW_USERNAME || !SERVICENOW_PASSWORD) return mockQuery(tableName, options);

  const url = new URL(
    `${SERVICENOW_INSTANCE_URL}/api/now/table/${tableName}`
  );

  if (options.sysparm_query) url.searchParams.set("sysparm_query", options.sysparm_query);
  if (options.sysparm_fields) url.searchParams.set("sysparm_fields", options.sysparm_fields);
  if (options.sysparm_limit) url.searchParams.set("sysparm_limit", String(options.sysparm_limit));
  if (options.sysparm_display_value !== undefined) {
    url.searchParams.set("sysparm_display_value", String(options.sysparm_display_value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: getBasicAuth(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ServiceNow Table API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.result ?? [];
}

/** Get a single record by sys_id */
export async function getRecord(
  tableName: string,
  sysId: string,
  fields?: string
): Promise<TableRecord | null> {
  const url = new URL(
    `${SERVICENOW_INSTANCE_URL}/api/now/table/${tableName}/${sysId}`
  );
  if (fields) url.searchParams.set("sysparm_fields", fields);
  url.searchParams.set("sysparm_display_value", "true");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: getBasicAuth(),
      Accept: "application/json",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ServiceNow Table API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.result ?? null;
}

/** Update a record by sys_id */
export async function updateRecord(
  tableName: string,
  sysId: string,
  fields: Record<string, unknown>
): Promise<TableRecord> {
  if (!SERVICENOW_INSTANCE_URL || !SERVICENOW_USERNAME || !SERVICENOW_PASSWORD) return mockUpdate(tableName, sysId, fields);

  const url = `${SERVICENOW_INSTANCE_URL}/api/now/table/${tableName}/${sysId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: getBasicAuth(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ServiceNow update error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.result;
}

/** Create a new record */
export async function createRecord(
  tableName: string,
  fields: Record<string, unknown>
): Promise<TableRecord> {
  if (!SERVICENOW_INSTANCE_URL || !SERVICENOW_USERNAME || !SERVICENOW_PASSWORD) return mockCreate(tableName, fields);

  const url = `${SERVICENOW_INSTANCE_URL}/api/now/table/${tableName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: getBasicAuth(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ServiceNow create error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.result;
}

