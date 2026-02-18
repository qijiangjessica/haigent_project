import jsforce from "jsforce";
import crypto from "crypto";

const {
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_LOGIN_URL,
  SALESFORCE_REDIRECT_URI,
  SALESFORCE_MY_DOMAIN,
  SALESFORCE_AGENT_RUNTIME_URL,
  SALESFORCE_AGENT_ID,
} = process.env;

export function getOAuth2() {
  return new jsforce.OAuth2({
    clientId: SALESFORCE_CLIENT_ID!,
    clientSecret: SALESFORCE_CLIENT_SECRET!,
    redirectUri: SALESFORCE_REDIRECT_URI!,
    loginUrl: SALESFORCE_LOGIN_URL || "https://login.salesforce.com",
  });
}

export function getConnection(accessToken: string, instanceUrl: string) {
  return new jsforce.Connection({
    oauth2: getOAuth2(),
    accessToken,
    instanceUrl,
  });
}

// PKCE helpers
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// --- Agentforce Agent API ---

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getAgentAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const tokenUrl = `${SALESFORCE_MY_DOMAIN}/services/oauth2/token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SALESFORCE_CLIENT_ID!,
      client_secret: SALESFORCE_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get agent access token: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
  };
  return data.access_token;
}

export function getMyDomain(): string {
  return SALESFORCE_MY_DOMAIN!;
}

export function getAgentRuntimeUrl(): string {
  return SALESFORCE_AGENT_RUNTIME_URL || SALESFORCE_MY_DOMAIN!;
}

export function getAgentId(): string {
  return SALESFORCE_AGENT_ID!;
}
