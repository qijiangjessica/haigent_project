/**
 * mcp-email-server/src/index.ts
 *
 * MCP server that exposes a send_email tool backed by Microsoft 365 SMTP.
 * Reads all configuration from environment variables — no credentials in code.
 *
 * Tools:
 *   send_email       — send a single HTML email
 *   verify_connection — test the SMTP connection without sending
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

// ── Config ─────────────────────────────────────────────────────────────────────

const SMTP_HOST     = process.env.SMTP_HOST     ?? "smtp.office365.com";
const SMTP_PORT     = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER     = process.env.SMTP_USER     ?? "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "";
const EMAIL_FROM    = process.env.EMAIL_FROM    ?? SMTP_USER;

if (!SMTP_USER || !SMTP_PASSWORD) {
  console.error("[mcp-email-server] WARNING: SMTP_USER or SMTP_PASSWORD not set — sends will fail.");
}

// ── Nodemailer transporter (lazy singleton) ────────────────────────────────────

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,          // STARTTLS on port 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",     // required for some Office 365 tenants
      rejectUnauthorized: true,
    },
  });

  return _transporter;
}

// ── MCP Server ─────────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "mcp-email-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Tool: send_email ───────────────────────────────────────────────────────────

server.registerTool(
  "send_email",
  {
    description:
      "Send a transactional HTML email via the organisation's Microsoft 365 account. " +
      "Use this to notify recruiters, referrers, or candidates about referral status updates.",
    inputSchema: {
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().min(1).describe("Email subject line"),
      html: z.string().min(1).describe("HTML body of the email"),
      from: z
        .string()
        .email()
        .optional()
        .describe("Sender address (defaults to EMAIL_FROM env var)"),
      text: z
        .string()
        .optional()
        .describe("Plain-text fallback body (auto-generated from html if omitted)"),
    },
  },
  async ({ to, subject, html, from, text }) => {
    const transporter = getTransporter();

    const mailOptions: nodemailer.SendMailOptions = {
      from: from ?? EMAIL_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.error(`[send_email] Sent → ${to} | messageId: ${info.messageId}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message_id: info.messageId,
              accepted: info.accepted,
              rejected: info.rejected,
            }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[send_email] Failed → ${to} | error: ${message}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: message }),
          },
        ],
      };
    }
  }
);

// ── Tool: verify_connection ────────────────────────────────────────────────────

server.registerTool(
  "verify_connection",
  {
    description:
      "Test the SMTP connection to Microsoft 365 without sending an email. " +
      "Use this to confirm credentials are correct before sending.",
    inputSchema: {},
  },
  async () => {
    const transporter = getTransporter();
    try {
      await transporter.verify();
      console.error("[verify_connection] SMTP connection OK");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `SMTP connection verified — ${SMTP_HOST}:${SMTP_PORT} as ${SMTP_USER}`,
            }),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[verify_connection] Failed: ${message}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: message }),
          },
        ],
      };
    }
  }
);

// ── Start ──────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[mcp-email-server] Running | host: ${SMTP_HOST}:${SMTP_PORT} | user: ${SMTP_USER || "(not set)"}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
