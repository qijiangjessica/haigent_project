import { NextRequest, NextResponse } from "next/server";
import { getAgentAccessToken, getAgentApiBase, getAgentId, getMyDomain } from "@/lib/salesforce";

// POST /api/agent — handles session creation, messaging, and ending
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message, sequenceId } = body;

    const accessToken = await getAgentAccessToken();
    const apiBase = getAgentApiBase();

    if (action === "start") {
      const agentId = getAgentId();
      const randomUuid = crypto.randomUUID();

      const response = await fetch(
        `${apiBase}/agents/${agentId}/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            externalSessionKey: randomUuid,
            instanceConfig: { endpoint: getMyDomain() },
            streamingCapabilities: { chunkTypes: ["Text"] },
            bypassUser: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to start session", details: error },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({ sessionId: data.sessionId });
    }

    if (action === "message") {
      if (!sessionId || !message) {
        return NextResponse.json(
          { error: "sessionId and message are required" },
          { status: 400 }
        );
      }

      const response = await fetch(
        `${apiBase}/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              type: "Text",
              text: message,
              sequenceId: sequenceId ?? 1,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to send message", details: error },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Extract the agent's text response from the messages array
      const agentText = data.messages
        ?.map((m: { message?: string }) => m.message)
        .filter(Boolean)
        .join("\n") || "I received your message but couldn't generate a response.";

      return NextResponse.json({ response: { text: agentText }, raw: data });
    }

    if (action === "end") {
      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required" },
          { status: 400 }
        );
      }

      const response = await fetch(
        `${apiBase}/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to end session", details: error },
          { status: response.status }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start", "message", or "end".' },
      { status: 400 }
    );
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
