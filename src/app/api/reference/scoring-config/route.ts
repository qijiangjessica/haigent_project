import { NextRequest, NextResponse } from "next/server";
import {
  getScoringWeights,
  setScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  ScoringWeights,
} from "@/lib/reference-store";

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
    setScoringWeights(weights);
    return NextResponse.json({ success: true, weights });
  } catch (error) {
    console.error("Scoring config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
