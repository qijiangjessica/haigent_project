import { NextRequest, NextResponse } from "next/server";
import {
  getScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  getThresholds,
  DEFAULT_THRESHOLDS,
  type ScoringWeights,
  type ThresholdConfig,
} from "@/lib/reference-store";
import { setScoringWeightsAndPersist, setThresholdsAndPersist, hydrateStoreFromDisk } from "@/lib/reference-json-persistence";

export async function GET() {
  hydrateStoreFromDisk();
  return NextResponse.json({ weights: getScoringWeights(), thresholds: getThresholds() });
}

export async function PUT(request: NextRequest) {
  try {
    hydrateStoreFromDisk();
    const body = await request.json() as Partial<ScoringWeights> & { thresholds?: Partial<ThresholdConfig> };

    // ── Weights ──────────────────────────────────────────────────────
    const weights: ScoringWeights = {
      skill:      Number(body.skill      ?? DEFAULT_SCORING_WEIGHTS.skill),
      experience: Number(body.experience ?? DEFAULT_SCORING_WEIGHTS.experience),
      location:   Number(body.location   ?? DEFAULT_SCORING_WEIGHTS.location),
      seniority:  Number(body.seniority  ?? DEFAULT_SCORING_WEIGHTS.seniority),
    };
    const total = weights.skill + weights.experience + weights.location + weights.seniority;
    if (total !== 100) {
      return NextResponse.json(
        { error: `Weights must sum to 100 (got ${total})` },
        { status: 400 }
      );
    }
    setScoringWeightsAndPersist(weights);

    // ── Thresholds (optional — only update if provided) ──────────────
    if (body.thresholds) {
      const strong  = Number(body.thresholds.strong_match  ?? DEFAULT_THRESHOLDS.strong_match);
      const partial = Number(body.thresholds.partial_match ?? DEFAULT_THRESHOLDS.partial_match);
      if (strong <= partial || partial < 0 || strong > 100) {
        return NextResponse.json(
          { error: "strong_match must be > partial_match, both between 0 and 100" },
          { status: 400 }
        );
      }
      setThresholdsAndPersist({ strong_match: strong, partial_match: partial });
    }

    return NextResponse.json({ success: true, weights, thresholds: getThresholds() });
  } catch (error) {
    console.error("Scoring config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
