import { NextRequest, NextResponse } from "next/server";
import { callVirtualAgentAPI, getBotId } from "@/lib/servicenow";

// POST /api/servicenow/chat — handles start, message, and end actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message } = body;

    if (action === "start") {
      const clientSessionId = crypto.randomUUID();
      const botId = getBotId();

      const response = await callVirtualAgentAPI({
        action: "START_CONVERSATION",
        clientSessionId,
        botId,
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to start session", details: error },
          { status: response.status }
        );
      }

      return NextResponse.json({ sessionId: clientSessionId, status: "started" });
    }

    if (action === "message") {
      if (!sessionId || !message) {
        return NextResponse.json(
          { error: "sessionId and message are required" },
          { status: 400 }
        );
      }

      const response = await callVirtualAgentAPI({
        action: "VA_TOPIC",
        clientSessionId: sessionId,
        message: { text: message, typed: true },
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: "Failed to send message", details: error },
          { status: response.status }
        );
      }

      // Response comes asynchronously via webhook — client listens on SSE
      return NextResponse.json({ status: "sent" });
    }

    if (action === "end") {
      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required" },
          { status: 400 }
        );
      }

      const response = await callVirtualAgentAPI({
        action: "END_CONVERSATION",
        clientSessionId: sessionId,
      });

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
    console.error("ServiceNow chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
