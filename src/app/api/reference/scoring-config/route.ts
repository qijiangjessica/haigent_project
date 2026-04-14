import { NextRequest, NextResponse } from "next/server";
import {
  getScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  type ScoringWeights,
} from "@/lib/reference-store";
import { setScoringWeightsAndPersist } from "@/lib/reference-json-persistence";

export async function GET() {
  return NextResponse.json({ weights: getScoringWeights() });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Partial<ScoringWeights>;
    const weights: ScoringWeights = {
      skill: Number(body.skill ?? DEFAULT_SCORING_WEIGHTS.skill),
      experience: Number(body.experience ?? DEFAULT_SCORING_WEIGHTS.experience),
      location: Number(body.location ?? DEFAULT_SCORING_WEIGHTS.location),
      seniority: Number(body.seniority ?? DEFAULT_SCORING_WEIGHTS.seniority),
    };
    const total = weights.skill + weights.experience + weights.location + weights.seniority;
    if (total !== 100) {
      return NextResponse.json(
        { error: `Weights must sum to 100 (got ${total})` },
        { status: 400 }
      );
    }
    // Persist weights to store + disk
    setScoringWeightsAndPersist(weights);
    return NextResponse.json({ success: true, weights });
  } catch (error) {
    console.error("Scoring config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
