import { NextRequest, NextResponse } from "next/server";
import {
  saveSurvey,
  getSurveyByEmployee,
  getAllSurveys,
} from "@/lib/engee-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employee = searchParams.get("employee");

  if (employee) {
    const survey = getSurveyByEmployee(employee);
    return NextResponse.json({ survey: survey ?? null });
  }

  return NextResponse.json({ surveys: getAllSurveys() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employee_name,
      department,
      professional_interests,
      personal_interests,
      goals_90_days,
      questions_for_mentor,
      preferred_platform,
      preferred_meeting_time,
    } = body;

    if (!employee_name || !department) {
      return NextResponse.json(
        { error: "employee_name and department are required" },
        { status: 400 }
      );
    }

    const record = saveSurvey({
      employee_name,
      department,
      professional_interests: professional_interests ?? [],
      personal_interests: personal_interests ?? [],
      goals_90_days: goals_90_days ?? "",
      questions_for_mentor: questions_for_mentor ?? "",
      preferred_platform: preferred_platform ?? "slack",
      preferred_meeting_time: preferred_meeting_time ?? "flexible",
    });

    return NextResponse.json({ success: true, survey: record });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
