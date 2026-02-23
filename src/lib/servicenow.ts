const {
  SERVICENOW_INSTANCE_URL,
  SERVICENOW_CLIENT_ID,
  SERVICENOW_CLIENT_SECRET,
  SERVICENOW_USERNAME,
  SERVICENOW_PASSWORD,
  SERVICENOW_BOT_ID,
} = process.env;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getServiceNowToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const tokenUrl = `${SERVICENOW_INSTANCE_URL}/oauth_token.do`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: SERVICENOW_CLIENT_ID!,
      client_secret: SERVICENOW_CLIENT_SECRET!,
      username: SERVICENOW_USERNAME!,
      password: SERVICENOW_PASSWORD!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get ServiceNow token: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 1800) * 1000,
  };
  return data.access_token;
}

export function getInstanceUrl(): string {
  return SERVICENOW_INSTANCE_URL!;
}

export function getBotId(): string {
  return SERVICENOW_BOT_ID!;
}

export interface VARequestPayload {
  action: "START_CONVERSATION" | "VA_TOPIC" | "END_CONVERSATION";
  clientSessionId: string;
  botId?: string;
  message?: {
    text: string;
    typed: boolean;
  };
  userId?: string;
}

export async function callVirtualAgentAPI(payload: VARequestPayload): Promise<Response> {
  const token = await getServiceNowToken();
  const url = `${SERVICENOW_INSTANCE_URL}/api/sn_va_as_service/bot/integration`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
