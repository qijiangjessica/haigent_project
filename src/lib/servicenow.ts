const {
  SERVICENOW_INSTANCE_URL,
  SERVICENOW_USERNAME,
  SERVICENOW_PASSWORD,
} = process.env;

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

// ---- Onboarding-specific helpers ----

// Table names matching ServiceNow scoped app (x_1926120_employee)
export const ONBOARDING_TABLE = "x_1926120_employee_onboarding";
export const BENEFIT_TYPES_TABLE = "x_1926120_employee_benefits_catalog";
export const BENEFIT_ENROLLMENT_TABLE = "x_1926120_employee_benefits_inquiry";
