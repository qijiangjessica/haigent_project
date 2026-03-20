// In-memory store to bridge ServiceNow webhook responses to SSE clients.
// Each session has a queue of pending messages and a list of SSE listeners.

export interface VAMessage {
  type: "text" | "topicPicker" | "outputCard" | "error" | "end";
  text?: string;
  options?: { label: string; value: string }[];
  data?: Record<string, unknown>;
  timestamp: number;
}

type Listener = (message: VAMessage) => void;

interface Session {
  messages: VAMessage[];
  listeners: Set<Listener>;
}

const sessions = new Map<string, Session>();

function getOrCreateSession(sessionId: string): Session {
  let session = sessions.get(sessionId);
  if (!session) {
    session = { messages: [], listeners: new Set() };
    sessions.set(sessionId, session);
  }
  return session;
}

// Called by the webhook when ServiceNow sends a response
export function pushMessage(sessionId: string, message: VAMessage): void {
  const session = getOrCreateSession(sessionId);
  session.messages.push(message);
  for (const listener of session.listeners) {
    listener(message);
  }
}

// Called by the SSE endpoint to subscribe to messages
export function subscribe(sessionId: string, listener: Listener): () => void {
  const session = getOrCreateSession(sessionId);
  session.listeners.add(listener);

  // Send any messages that arrived before the listener connected
  for (const msg of session.messages) {
    listener(msg);
  }

  return () => {
    session.listeners.delete(listener);
    // Clean up session if no listeners and no recent messages
    if (session.listeners.size === 0) {
      setTimeout(() => {
        const s = sessions.get(sessionId);
        if (s && s.listeners.size === 0) {
          sessions.delete(sessionId);
        }
      }, 5 * 60 * 1000); // Clean up after 5 minutes
    }
  };
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
