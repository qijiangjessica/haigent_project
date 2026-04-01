/**
 * reference-json-persistence.ts
 *
 * Persistence layer for the Reference module's in-memory store.
 * Reads from and writes to JSON files under src/data/reference/json/.
 *
 * Design rules:
 *  - Writes are atomic: data is written to a .tmp file then renamed,
 *    so a crash mid-write never leaves a corrupt JSON file
 *  - loadFromDisk() / saveToDisk() handle the full snapshot
 *  - Wired functions (addReferralAndPersist, etc.) combine store mutation
 *    + disk write in one call — use these from API routes
 *  - The old standalone persistX() helpers are commented out below;
 *    the wired functions replace them
 */

import fs from "fs";
import path from "path";
import {
  addReferral, getReferrals,
  addLiveMatchRecord, getLiveMatchRecords,
  addLivePoolEntry, getLivePoolEntries,
  setDecision, getDecisions,
  rejectReferral, getRejectedReferralIds,
  addLiveAuditEvent, getLiveAuditEvents,
  setStatusOverride, getAllStatusOverrides,
  setScoringWeights, getScoringWeights,
  type SubmittedReferral,
  type LiveMatchRecord,
  type LivePoolEntry,
  type RecruiterDecision,
  type LiveAuditEvent,
  type ScoringWeights,
} from "@/lib/reference-store";

// ── Types (mirrored for disk shape) ────────────────────────────────────────

export interface PersistedMatchRecord extends LiveMatchRecord {}

export interface PersistedScoringWeights {
  skill: number;
  experience: number;
  location: number;
  seniority: number;
}

export interface StoreSnapshot {
  referrals: SubmittedReferral[];
  matches: LiveMatchRecord[];
  poolEntries: LivePoolEntry[];
  decisions: RecruiterDecision[];
  rejectedIds: string[];
  auditEvents: LiveAuditEvent[];
  statusOverrides: Record<string, string>;
  scoringWeights: PersistedScoringWeights;
}

// ── File paths ──────────────────────────────────────────────────────────────

const JSON_DIR = path.join(process.cwd(), "src", "data", "reference", "json");

const FILES = {
  referrals:       path.join(JSON_DIR, "referrals.json"),
  matches:         path.join(JSON_DIR, "matches.json"),
  poolEntries:     path.join(JSON_DIR, "pool-entries.json"),
  decisions:       path.join(JSON_DIR, "decisions.json"),
  rejectedIds:     path.join(JSON_DIR, "rejected-ids.json"),
  auditEvents:     path.join(JSON_DIR, "audit-events.json"),
  statusOverrides: path.join(JSON_DIR, "status-overrides.json"),
  scoringWeights:  path.join(JSON_DIR, "scoring-weights.json"),
} as const;

// ── Internal helpers ────────────────────────────────────────────────────────

function ensureDir(): void {
  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[reference-json-persistence] Failed to read ${filePath}, using fallback.`);
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir();
  const tmp = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmp, filePath);
  } catch (err) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw err;
  }
}

// ── Full snapshot load / save ───────────────────────────────────────────────

/** Load the full persisted snapshot from disk. Returns empty defaults for missing files. */
export function loadFromDisk(): StoreSnapshot {
  return {
    referrals:       readJson<SubmittedReferral[]>(FILES.referrals, []),
    matches:         readJson<LiveMatchRecord[]>(FILES.matches, []),
    poolEntries:     readJson<LivePoolEntry[]>(FILES.poolEntries, []),
    decisions:       readJson<RecruiterDecision[]>(FILES.decisions, []),
    rejectedIds:     readJson<string[]>(FILES.rejectedIds, []),
    auditEvents:     readJson<LiveAuditEvent[]>(FILES.auditEvents, []),
    statusOverrides: readJson<Record<string, string>>(FILES.statusOverrides, {}),
    scoringWeights:  readJson<PersistedScoringWeights>(FILES.scoringWeights, {
      skill: 50, experience: 25, location: 15, seniority: 10,
    }),
  };
}

/** Persist the entire store snapshot to disk in one call. */
export function saveToDisk(snapshot: StoreSnapshot): void {
  writeJson(FILES.referrals,       snapshot.referrals);
  writeJson(FILES.matches,         snapshot.matches);
  writeJson(FILES.poolEntries,     snapshot.poolEntries);
  writeJson(FILES.decisions,       snapshot.decisions);
  writeJson(FILES.rejectedIds,     snapshot.rejectedIds);
  writeJson(FILES.auditEvents,     snapshot.auditEvents);
  writeJson(FILES.statusOverrides, snapshot.statusOverrides);
  writeJson(FILES.scoringWeights,  snapshot.scoringWeights);
}

// ── Wired functions (store mutation + disk write) ───────────────────────────
// Use these from API routes instead of calling the store and persist separately.

/** Add a referral to the store and immediately persist referrals to disk. */
export function addReferralAndPersist(referral: SubmittedReferral): void {
  addReferral(referral);
  writeJson(FILES.referrals, getReferrals());
}

/** Add a match record to the store and immediately persist matches to disk. */
export function addMatchAndPersist(record: LiveMatchRecord): void {
  addLiveMatchRecord(record);
  writeJson(FILES.matches, getLiveMatchRecords());
}

/** Add all match records for a referral and persist once (batch). */
export function addMatchesAndPersist(records: LiveMatchRecord[]): void {
  for (const r of records) addLiveMatchRecord(r);
  writeJson(FILES.matches, getLiveMatchRecords());
}

/** Add a pool entry to the store and immediately persist pool entries to disk. */
export function addPoolEntryAndPersist(entry: LivePoolEntry): void {
  addLivePoolEntry(entry);
  writeJson(FILES.poolEntries, getLivePoolEntries());
}

/** Set a recruiter decision and immediately persist decisions to disk. */
export function setDecisionAndPersist(decision: RecruiterDecision): void {
  setDecision(decision);
  writeJson(FILES.decisions, getDecisions());
}

/** Reject a referral and immediately persist rejected IDs to disk. */
export function rejectReferralAndPersist(referralId: string): void {
  rejectReferral(referralId);
  writeJson(FILES.rejectedIds, getRejectedReferralIds());
}

/** Add an audit event and immediately persist audit events to disk. */
export function addAuditEventAndPersist(event: LiveAuditEvent): void {
  addLiveAuditEvent(event);
  writeJson(FILES.auditEvents, getLiveAuditEvents());
}

/** Set a status override and immediately persist overrides to disk. */
export function setStatusOverrideAndPersist(candidateId: string, status: string): void {
  setStatusOverride(candidateId, status);
  writeJson(FILES.statusOverrides, getAllStatusOverrides());
}

/** Set scoring weights and immediately persist to disk. */
export function setScoringWeightsAndPersist(weights: ScoringWeights): void {
  setScoringWeights(weights);
  writeJson(FILES.scoringWeights, getScoringWeights());
}

// ── Standalone persistX() helpers (commented out — replaced by wired functions above) ──
//
// export const persistReferrals      = (data: SubmittedReferral[])          => writeJson(FILES.referrals,       data);
// export const persistMatches        = (data: LiveMatchRecord[])            => writeJson(FILES.matches,         data);
// export const persistPoolEntries    = (data: LivePoolEntry[])              => writeJson(FILES.poolEntries,     data);
// export const persistDecisions      = (data: RecruiterDecision[])          => writeJson(FILES.decisions,       data);
// export const persistRejectedIds    = (data: string[])                     => writeJson(FILES.rejectedIds,     data);
// export const persistAuditEvents    = (data: LiveAuditEvent[])             => writeJson(FILES.auditEvents,     data);
// export const persistStatusOverrides= (data: Record<string, string>)       => writeJson(FILES.statusOverrides, data);
// export const persistScoringWeights = (data: PersistedScoringWeights)      => writeJson(FILES.scoringWeights,  data);
