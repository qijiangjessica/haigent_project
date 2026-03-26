import { NextResponse } from "next/server";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { REFERENCES } from "@/data/reference/references";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { AUDIT_LOG } from "@/data/reference/audit-log";

export async function GET() {
  return NextResponse.json({
    candidates: REFERENCE_CANDIDATES,
    references: REFERENCES,
    matches: MATCH_RECORDS,
    talentPool: TALENT_POOL,
    auditLog: AUDIT_LOG,
  });
}
