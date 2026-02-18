import { NextRequest, NextResponse } from "next/server";
import { getAgentAccessToken, getAgentRuntimeUrl, getAgentId } from "@/lib/salesforce";

// POST /api/agent — handles session creation, messaging, and ending
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message, sequenceId } = body;

    const accessToken = await getAgentAccessToken();
    const runtimeUrl = getAgentRuntimeUrl();

    if (action === "start") {
      // Create a new agent session
      const agentId = getAgentId();
      const randomUuid = crypto.randomUUID();

      const response = await fetch(
        `${runtimeUrl}/api/v1/sessions?bypassUser=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ agentId, randomUuid }),
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

      // Send a synchronous message to the agent
      const response = await fetch(
        `${runtimeUrl}/api/v1/sessions/${sessionId}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message,
            sequenceId: sequenceId ?? 1,
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
      return NextResponse.json(data);
    }

    if (action === "end") {
      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required" },
          { status: 400 }
        );
      }

      // End the session
      const response = await fetch(
        `${runtimeUrl}/api/v1/sessions/${sessionId}`,
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
