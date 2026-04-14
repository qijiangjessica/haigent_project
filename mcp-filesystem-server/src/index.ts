import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Connection } from "jsforce";
import * as fs from "fs/promises";
import * as path from "path";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_DIR = process.env.MCP_BASE_DIR || process.cwd();
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || "https://login.salesforce.com";
const SF_USERNAME = process.env.SF_USERNAME || "";
const SF_PASSWORD = process.env.SF_PASSWORD || "";
const SF_SECURITY_TOKEN = process.env.SF_SECURITY_TOKEN || "";
const SF_API_VERSION = process.env.SF_API_VERSION || "62.0";

// ─── Salesforce Connection (lazy singleton) ────────────────────────────────────
let sfConn: Connection | null = null;

async function getSfConnection(): Promise<Connection> {
  if (sfConn && sfConn.accessToken) return sfConn;

  if (!SF_USERNAME || !SF_PASSWORD) {
    throw new Error(
      "Salesforce credentials not configured. Set SF_USERNAME, SF_PASSWORD, and SF_SECURITY_TOKEN."
    );
  }

  sfConn = new Connection({ loginUrl: SF_LOGIN_URL });
  await sfConn.login(SF_USERNAME, SF_PASSWORD + SF_SECURITY_TOKEN);
  console.error(`Connected to Salesforce as ${SF_USERNAME}`);
  return sfConn;
}

// ─── Path helper ─────────────────────────────────────────────────────────────
function resolvePath(relativePath: string): string {
  const fullPath = path.resolve(BASE_DIR, relativePath);
  if (!fullPath.startsWith(BASE_DIR)) {
    throw new Error("Access denied: path is outside allowed directory");
  }
  return fullPath;
}

// ─── Session sequence tracker ─────────────────────────────────────────────────
const sessionSeqMap = new Map<string, number>();

// ─── Server ────────────────────────────────────────────────────────────────────
const server = new McpServer(
  { name: "mcp-filesystem-salesforce-server", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

// ═══════════════════════════════════════════════════════════════════════════════
// File System Tools
// ═══════════════════════════════════════════════════════════════════════════════

server.registerTool(
  "read_file",
  { description: "Read the contents of a file", inputSchema: { path: z.string().describe("Path relative to base directory") } },
  async ({ path: filePath }) => ({
    content: [{ type: "text", text: await fs.readFile(resolvePath(filePath), "utf-8") }],
  })
);

server.registerTool(
  "write_file",
  {
    description: "Write content to a file",
    inputSchema: {
      path: z.string().describe("Path relative to base directory"),
      content: z.string().describe("Content to write"),
    },
  },
  async ({ path: filePath, content }) => {
    await fs.writeFile(resolvePath(filePath), content, "utf-8");
    return { content: [{ type: "text", text: `Successfully wrote to ${filePath}` }] };
  }
);

server.registerTool(
  "list_directory",
  { description: "List contents of a directory", inputSchema: { path: z.string().describe("Path relative to base directory") } },
  async ({ path: dirPath }) => {
    const entries = await fs.readdir(resolvePath(dirPath), { withFileTypes: true });
    const listing = entries.map((e) => ({ name: e.name, type: e.isDirectory() ? "directory" : "file" }));
    return { content: [{ type: "text", text: JSON.stringify(listing, null, 2) }] };
  }
);

server.registerTool(
  "create_directory",
  { description: "Create a new directory", inputSchema: { path: z.string().describe("Path relative to base directory") } },
  async ({ path: dirPath }) => {
    await fs.mkdir(resolvePath(dirPath), { recursive: true });
    return { content: [{ type: "text", text: `Successfully created directory ${dirPath}` }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Salesforce Tools
// ═══════════════════════════════════════════════════════════════════════════════

server.registerTool(
  "sf_query",
  {
    description: "Run a SOQL query against Salesforce and return results",
    inputSchema: { soql: z.string().describe("SOQL query, e.g. SELECT Id, Name FROM Account LIMIT 10") },
  },
  async ({ soql }) => {
    const conn = await getSfConnection();
    const result = await conn.query(soql);
    return {
      content: [{ type: "text", text: JSON.stringify({ totalSize: result.totalSize, records: result.records }, null, 2) }],
    };
  }
);

server.registerTool(
  "sf_get_record",
  {
    description: "Retrieve a single Salesforce record by object type and Id",
    inputSchema: {
      objectType: z.string().describe("Salesforce object API name, e.g. Account"),
      recordId: z.string().describe("18-character Salesforce record Id"),
    },
  },
  async ({ objectType, recordId }) => {
    const conn = await getSfConnection();
    const record = await conn.sobject(objectType).retrieve(recordId);
    return { content: [{ type: "text", text: JSON.stringify(record, null, 2) }] };
  }
);

server.registerTool(
  "sf_create_record",
  {
    description: "Create a new record in Salesforce",
    inputSchema: {
      objectType: z.string().describe("Salesforce object API name, e.g. Lead"),
      fields: z.record(z.string(), z.unknown()).describe("Key-value pairs of field API names and values"),
    },
  },
  async ({ objectType, fields }) => {
    const conn = await getSfConnection();
    const result = await conn.sobject(objectType).create(fields as Record<string, unknown>);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.registerTool(
  "sf_update_record",
  {
    description: "Update an existing Salesforce record",
    inputSchema: {
      objectType: z.string().describe("Salesforce object API name"),
      recordId: z.string().describe("Salesforce record Id"),
      fields: z.record(z.string(), z.unknown()).describe("Key-value pairs of fields to update"),
    },
  },
  async ({ objectType, recordId, fields }) => {
    const conn = await getSfConnection();
    const result = await conn.sobject(objectType).update({ Id: recordId, ...(fields as Record<string, unknown>) });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Agentforce Tools
// ═══════════════════════════════════════════════════════════════════════════════

server.registerTool(
  "sf_agentforce_list_agents",
  { description: "List all available Agentforce AI agents in the Salesforce org", inputSchema: {} },
  async () => {
    const conn = await getSfConnection();
    const url = `${conn.instanceUrl}/services/data/v${SF_API_VERSION}/einstein/ai-agent/agents`;
    const response = await conn.requestGet(url);
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }
);

server.registerTool(
  "sf_agentforce_create_session",
  {
    description: "Create a new conversation session with an Agentforce AI agent",
    inputSchema: { agentId: z.string().describe("The Agentforce agent ID (from sf_agentforce_list_agents)") },
  },
  async ({ agentId }) => {
    const conn = await getSfConnection();
    const sessionKey = crypto.randomUUID();
    const url = `${conn.instanceUrl}/services/data/v${SF_API_VERSION}/einstein/ai-agent/agents/${agentId}/sessions`;
    const body = {
      externalSessionKey: sessionKey,
      instanceConfig: { endpoint: conn.instanceUrl },
      streamingCapabilities: { chunkTypes: ["Text"] },
    };
    const response: Record<string, unknown> = await conn.request({
      method: "POST",
      url,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const sessionId = response.sessionId as string;
    sessionSeqMap.set(sessionId, 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ sessionId, externalSessionKey: sessionKey, ...response }, null, 2) }],
    };
  }
);

server.registerTool(
  "sf_agentforce_send_message",
  {
    description: "Send a message to an active Agentforce agent session and get a response",
    inputSchema: {
      sessionId: z.string().describe("Session ID from sf_agentforce_create_session"),
      message: z.string().describe("The message text to send to the agent"),
      sequenceId: z.number().optional().describe("Message sequence number (auto-incremented if omitted)"),
    },
  },
  async ({ sessionId, message, sequenceId }) => {
    const conn = await getSfConnection();
    const seq = sequenceId ?? (sessionSeqMap.get(sessionId) ?? 0) + 1;
    sessionSeqMap.set(sessionId, seq);

    const url = `${conn.instanceUrl}/services/data/v${SF_API_VERSION}/einstein/ai-agent/sessions/${sessionId}/messages`;
    const body = { message: { sequenceId: seq, type: "Text", text: message }, variables: [] };
    const response = await conn.request({
      method: "POST",
      url,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }
);

server.registerTool(
  "sf_agentforce_end_session",
  {
    description: "End an Agentforce agent session",
    inputSchema: { sessionId: z.string().describe("Session ID to end") },
  },
  async ({ sessionId }) => {
    const conn = await getSfConnection();
    const url = `${conn.instanceUrl}/services/data/v${SF_API_VERSION}/einstein/ai-agent/sessions/${sessionId}`;
    await conn.request({ method: "DELETE", url });
    sessionSeqMap.delete(sessionId);
    return { content: [{ type: "text", text: `Session ${sessionId} ended.` }] };
  }
);

// ─── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`MCP Server v2 | base: ${BASE_DIR} | SF user: ${SF_USERNAME || "(not set)"}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
