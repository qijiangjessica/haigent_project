import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractText, SUPPORTED_EXTENSIONS, SUPPORTED_MIME_TYPES } from "@/lib/resume-parser";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Extracted candidate fields returned alongside raw text ────────────────────

export interface ExtractedCandidate {
  name?: string;
  email?: string;
  phone?: string;
  current_employer?: string;
  years_experience?: number;
  location?: string;
  linkedin_url?: string;
  skills?: string[];
}

async function extractCandidateFields(resumeText: string): Promise<ExtractedCandidate> {
  if (!process.env.ANTHROPIC_API_KEY) return {};

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Extract structured candidate information from the resume below.

Return ONLY a valid JSON object using these fields (omit any field you cannot confidently determine — do not return null or empty string):
{
  "name": "candidate full name",
  "email": "email address",
  "phone": "phone number as a string",
  "current_employer": "most recent or current company name",
  "years_experience": <integer — total years of professional work experience>,
  "location": "city and state/country of most recent address",
  "linkedin_url": "full linkedin.com/in/... URL if present",
  "skills": ["skill1", "skill2", ...] — up to 20 specific technical and professional skills the candidate has demonstrated
}

Rules:
- years_experience: calculate from work history dates or use a stated value. Return an integer only.
- skills: extract skills the candidate actually used or listed — not job requirements from job descriptions.
- Return ONLY the JSON object, no markdown, no explanation.

RESUME TEXT:
${resumeText.slice(0, 6000)}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const result: ExtractedCandidate = {};

    if (typeof raw.name === "string" && raw.name.trim()) result.name = raw.name.trim();
    if (typeof raw.email === "string" && raw.email.trim()) result.email = raw.email.trim();
    if (typeof raw.phone === "string" && raw.phone.trim()) result.phone = raw.phone.trim();
    if (typeof raw.current_employer === "string" && raw.current_employer.trim()) result.current_employer = raw.current_employer.trim();
    if (typeof raw.years_experience === "number" && raw.years_experience >= 0) result.years_experience = Math.round(raw.years_experience);
    if (typeof raw.location === "string" && raw.location.trim()) result.location = raw.location.trim();
    if (typeof raw.linkedin_url === "string" && raw.linkedin_url.includes("linkedin.com")) result.linkedin_url = raw.linkedin_url.trim();
    if (Array.isArray(raw.skills)) {
      result.skills = (raw.skills as unknown[])
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim())
        .slice(0, 20);
    }

    return result;
  } catch {
    return {};
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Request must be multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded. Include a file field named 'file'." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.` },
        { status: 413 }
      );
    }

    const filename = file.name ?? "upload";
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${ext}. Accepted: ${SUPPORTED_EXTENSIONS.join(", ")}`, accepted: SUPPORTED_EXTENSIONS },
        { status: 415 }
      );
    }

    const mime = file.type;
    if (mime && mime !== "application/octet-stream" && !SUPPORTED_MIME_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: `Unexpected MIME type: ${mime}.`, accepted: SUPPORTED_MIME_TYPES },
        { status: 415 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await extractText(buffer, filename);

    // AI extraction runs only when we have meaningful text
    const extracted: ExtractedCandidate = result.text.length > 50
      ? await extractCandidateFields(result.text)
      : {};

    return NextResponse.json({
      success: !result.error || result.text.length > 0,
      filename,
      format: result.format,
      charCount: result.charCount,
      wordCount: result.wordCount,
      pageCount: result.pageCount ?? null,
      text: result.text,
      warning: result.error ?? null,
      extracted,
    });
  } catch (error) {
    console.error("[resume-parse] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error during file parsing." }, { status: 500 });
  }
}
