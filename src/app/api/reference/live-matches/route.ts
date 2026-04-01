import { NextRequest, NextResponse } from "next/server";
import {
  getLiveMatchRecords, addLiveMatchRecord, addReferral, getReferrals,
  addLivePoolEntry, setDecision, rejectReferral, addLiveAuditEvent,
  setStatusOverride, setScoringWeights,
} from "@/lib/reference-store";
import { loadFromDisk } from "@/lib/reference-json-persistence";

function hydrateIfEmpty() {
  if (getLiveMatchRecords().length === 0 && getReferrals().length === 0) {
    try {
      const snap = loadFromDisk();
      for (const r of snap.referrals)     addReferral(r);
      for (const m of snap.matches)       addLiveMatchRecord(m);
      for (const p of snap.poolEntries)   addLivePoolEntry(p);
      for (const d of snap.decisions)     setDecision(d);
      for (const id of snap.rejectedIds)  rejectReferral(id);
      for (const e of snap.auditEvents)   addLiveAuditEvent(e);
      for (const [k, v] of Object.entries(snap.statusOverrides)) setStatusOverride(k, v);
      setScoringWeights(snap.scoringWeights);
    } catch { /* no disk data yet — start empty */ }
  }
}

export async function GET(request: NextRequest) {
  hydrateIfEmpty();
  const { searchParams } = new URL(request.url);
  const referralId = searchParams.get("referral_id") ?? undefined;
  return NextResponse.json({ matches: getLiveMatchRecords(referralId) });
}
