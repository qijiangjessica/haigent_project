import { NextRequest, NextResponse } from "next/server";
import { pushMessage, type VAMessage } from "@/lib/servicenow-session-store";

// POST /api/servicenow/webhook — receives async responses from ServiceNow VA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("ServiceNow webhook received:", JSON.stringify(body, null, 2));

    const clientSessionId = body.clientSessionId;
    if (!clientSessionId) {
      return NextResponse.json({ error: "Missing clientSessionId" }, { status: 400 });
    }

    // Parse ServiceNow VA response body into our message format
    const messages = parseVAResponse(body);

    for (const msg of messages) {
      pushMessage(clientSessionId, msg);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ServiceNow webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

function parseVAResponse(body: Record<string, unknown>): VAMessage[] {
  const messages: VAMessage[] = [];
  const now = Date.now();

  // The VA Bot Integration API can return various response types
  // Common structure: body.body is an array of response items
  const responseBody = (body.body ?? body.requestBody ?? body) as Record<string, unknown>;

  // Handle array of response items
  const items = Array.isArray(responseBody)
    ? responseBody
    : responseBody.uiActions
      ? (responseBody.uiActions as Record<string, unknown>[])
      : responseBody.body
        ? Array.isArray(responseBody.body) ? responseBody.body : [responseBody.body]
        : [responseBody];

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const type = record.type as string | undefined;
    const value = record.value as Record<string, unknown> | string | undefined;

    if (type === "outputText" || type === "text") {
      const text = typeof value === "string"
        ? value
        : (value as Record<string, unknown>)?.text as string ?? String(value);
      messages.push({ type: "text", text, timestamp: now });
    } else if (type === "topicPickerControl") {
      const options = ((value as Record<string, unknown>)?.options as Array<Record<string, unknown>> ?? [])
        .map((o) => ({
          label: (o.label ?? o.name ?? "") as string,
          value: (o.value ?? o.name ?? "") as string,
        }));
      messages.push({ type: "topicPicker", options, timestamp: now });
    } else if (type === "outputCard") {
      messages.push({ type: "outputCard", data: record, timestamp: now });
    } else if (type === "endConversation") {
      messages.push({ type: "end", timestamp: now });
    } else if (record.message || record.text) {
      // Fallback: try to extract text from common fields
      const text = (record.message ?? record.text ?? "") as string;
      if (text) {
        messages.push({ type: "text", text, timestamp: now });
      }
    }
  }

  // If we couldn't parse anything, push a raw fallback
  if (messages.length === 0) {
    const fallbackText = JSON.stringify(body, null, 2);
    messages.push({ type: "text", text: `[Raw response]\n${fallbackText}`, timestamp: now });
  }

  return messages;
}
