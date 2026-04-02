import { NextRequest, NextResponse } from "next/server";
import {
  getAllJobWeightOverrides,
  getJobWeightOverride,
  getEffectiveWeights,
  setScoringWeights,
  setJobWeightOverride,
  type ScoringWeights,
} from "@/lib/reference-store";
import {
  setJobWeightOverrideAndPersist,
  deleteJobWeightOverrideAndPersist,
  loadFromDisk,
} from "@/lib/reference-json-persistence";
import { OPEN_JOBS } from "@/data/reference/jobs";

function hydrateIfEmpty() {
  if (Object.keys(getAllJobWeightOverrides()).length === 0) {
    try {
      const snap = loadFromDisk();
      setScoringWeights(snap.scoringWeights);
      for (const [k, v] of Object.entries(snap.jobWeightOverrides)) {
        setJobWeightOverride(k, v);
      }
    } catch { /* no disk data yet */ }
  }
}

function isValidWeights(w: unknown): w is ScoringWeights {
  if (!w || typeof w !== "object") return false;
  const obj = w as Record<string, unknown>;
  const keys = ["skill", "experience", "location", "seniority"];
  if (!keys.every((k) => typeof obj[k] === "number")) return false;
  const total = keys.reduce((s, k) => s + (obj[k] as number), 0);
  return total === 100;
}

/** GET /api/reference/job-weights — returns overrides + effective weights for every open job */
export async function GET() {
  hydrateIfEmpty();
  const overrides = getAllJobWeightOverrides();
  const jobs = OPEN_JOBS.map((j) => ({
    job_id: j.id,
    title: j.title,
    department: j.department,
    has_override: !!overrides[j.id],
    effective_weights: getEffectiveWeights(j.id),
    override: overrides[j.id] ?? null,
  }));
  return NextResponse.json({ jobs, overrides });
}

/** PUT /api/reference/job-weights — set or update a per-job weight override */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { job_id?: string; weights?: unknown };
    if (!body.job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }
    if (!isValidWeights(body.weights)) {
      return NextResponse.json(
        { error: "weights must have skill, experience, location, seniority summing to 100" },
        { status: 400 }
      );
    }
    const job = OPEN_JOBS.find((j) => j.id === body.job_id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    setJobWeightOverrideAndPersist(body.job_id, body.weights as ScoringWeights);
    return NextResponse.json({
      success: true,
      job_id: body.job_id,
      weights: getJobWeightOverride(body.job_id),
    });
  } catch (error) {
    console.error("job-weights PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/reference/job-weights — remove per-job override, revert to global */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { job_id?: string };
    if (!body.job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }
    deleteJobWeightOverrideAndPersist(body.job_id);
    return NextResponse.json({ success: true, job_id: body.job_id });
  } catch (error) {
    console.error("job-weights DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
