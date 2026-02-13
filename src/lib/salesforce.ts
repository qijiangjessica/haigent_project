import jsforce from "jsforce";
import crypto from "crypto";

const {
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_LOGIN_URL,
  SALESFORCE_REDIRECT_URI,
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
