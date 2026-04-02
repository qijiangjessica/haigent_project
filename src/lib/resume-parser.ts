/**
 * resume-parser.ts
 *
 * Server-side text extraction for uploaded resume files.
 * Supported formats: PDF, DOCX, DOC (legacy binary), TXT / plain text.
 *
 * Design:
 *  - Single entry point: extractText(buffer, filename)
 *  - Each format has its own extractor; dispatch is by file extension
 *  - Returns a structured result — never throws to the caller
 *  - No AI extraction — raw text only (AI layer is a future concern)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
import mammoth from "mammoth";

// ── Result type ───────────────────────────────────────────────────────────────

export type ResumeFormat = "pdf" | "docx" | "doc" | "txt" | "unsupported";

export interface ParseResult {
  text: string;
  format: ResumeFormat;
  charCount: number;
  wordCount: number;
  pageCount?: number;      // PDF only
  error?: string;          // set when extraction partially or fully failed
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normaliseWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")       // normalise line endings
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")          // tabs → space
    .replace(/ {3,}/g, "  ")      // collapse runs of spaces (keep double for indents)
    .replace(/\n{4,}/g, "\n\n\n") // max 3 consecutive blank lines
    .trim();
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function extractPdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const data = await pdfParse(buffer);
    const text = normaliseWhitespace(data.text);
    return {
      text,
      format: "pdf",
      charCount: text.length,
      wordCount: wordCount(text),
      pageCount: data.numpages,
    };
  } catch (err) {
    return {
      text: "",
      format: "pdf",
      charCount: 0,
      wordCount: 0,
      error: `PDF extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

async function extractDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = normaliseWhitespace(result.value);
    return {
      text,
      format: "docx",
      charCount: text.length,
      wordCount: wordCount(text),
    };
  } catch (err) {
    return {
      text: "",
      format: "docx",
      charCount: 0,
      wordCount: 0,
      error: `DOCX extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Legacy DOC (binary Word 97–2003) ─────────────────────────────────────────
// True .doc parsing requires COM automation or external tools. Instead we scan
// the binary for runs of printable ASCII/Latin-1 text (≥ 4 chars). This gets
// most body text out of simple resumes with no perfect formatting guarantee.

function extractDoc(buffer: Buffer): ParseResult {
  try {
    const MIN_RUN = 4;
    const runs: string[] = [];
    let current = "";

    for (let i = 0; i < buffer.length; i++) {
      const b = buffer[i];
      // Printable ASCII (32–126) plus common extended Latin (160–255)
      if ((b >= 32 && b <= 126) || (b >= 160 && b <= 255)) {
        current += String.fromCharCode(b);
      } else {
        if (current.length >= MIN_RUN) runs.push(current);
        current = "";
      }
    }
    if (current.length >= MIN_RUN) runs.push(current);

    // Join runs, deduplicate adjacent identical lines, normalise whitespace
    const raw = runs.join("\n");
    const text = normaliseWhitespace(raw);

    return {
      text,
      format: "doc",
      charCount: text.length,
      wordCount: wordCount(text),
      error: text.length < 100
        ? "Legacy .doc extraction produced very little text. Consider converting to .docx or .pdf."
        : undefined,
    };
  } catch (err) {
    return {
      text: "",
      format: "doc",
      charCount: 0,
      wordCount: 0,
      error: `DOC extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Plain text ────────────────────────────────────────────────────────────────

function extractTxt(buffer: Buffer): ParseResult {
  try {
    const text = normaliseWhitespace(buffer.toString("utf-8"));
    return {
      text,
      format: "txt",
      charCount: text.length,
      wordCount: wordCount(text),
    };
  } catch (err) {
    return {
      text: "",
      format: "txt",
      charCount: 0,
      wordCount: 0,
      error: `Text extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

const EXT_MAP: Record<string, ResumeFormat> = {
  ".pdf":  "pdf",
  ".docx": "docx",
  ".doc":  "doc",
  ".txt":  "txt",
  ".text": "txt",
  ".md":   "txt",
};

export const SUPPORTED_EXTENSIONS = Object.keys(EXT_MAP);
export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
];

/**
 * Extract plain text from a resume file buffer.
 *
 * @param buffer   Raw file bytes
 * @param filename Used to determine the format (extension-based dispatch)
 */
export async function extractText(buffer: Buffer, filename: string): Promise<ParseResult> {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const format = EXT_MAP[ext];

  if (!format) {
    return {
      text: "",
      format: "unsupported",
      charCount: 0,
      wordCount: 0,
      error: `Unsupported file format: ${ext}. Accepted: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    };
  }

  switch (format) {
    case "pdf":  return extractPdf(buffer);
    case "docx": return extractDocx(buffer);
    case "doc":  return extractDoc(buffer);
    case "txt":  return extractTxt(buffer);
    default:
      return { text: "", format: "unsupported", charCount: 0, wordCount: 0, error: "Unsupported" };
  }
}
