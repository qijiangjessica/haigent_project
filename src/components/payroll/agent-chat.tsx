"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "agent";
  text: string;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sequenceId, setSequenceId] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start a new session
  async function startSession(): Promise<string | null> {
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);
      setSessionId(data.sessionId);
      setSequenceId(1);
      return data.sessionId;
    } catch (err) {
      setError(`Failed to connect to agent: ${err}`);
      return null;
    }
  }

  // Send a message
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      // Start session if we don't have one
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await startSession();
        if (!currentSessionId) {
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId: currentSessionId,
          message: text,
          sequenceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If session expired, try starting a new one
        if (res.status === 404 || res.status === 401) {
          setSessionId(null);
          const newSessionId = await startSession();
          if (newSessionId) {
            const retryRes = await fetch("/api/agent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "message",
                sessionId: newSessionId,
                message: text,
                sequenceId: 1,
              }),
            });
            const retryData = await retryRes.json();
            if (retryRes.ok) {
              const agentText =
                retryData.response?.text ||
                retryData.messages?.[0]?.message ||
                "I received your message but couldn't generate a response.";
              setMessages((prev) => [...prev, { role: "agent", text: agentText }]);
              setSequenceId(2);
              setLoading(false);
              return;
            }
          }
          throw new Error("Session expired. Please try again.");
        }
        throw new Error(data.details || data.error);
      }

      const agentText =
        data.response?.text ||
        data.messages?.[0]?.message ||
        "I received your message but couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "agent", text: agentText }]);
      setSequenceId((prev) => prev + 1);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Reset conversation
  async function handleReset() {
    if (sessionId) {
      fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId }),
      }).catch(() => {});
    }
    setSessionId(null);
    setMessages([]);
    setSequenceId(1);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-brand-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Payroll Assistant
            </h3>
            <p className="text-xs text-muted-foreground">
              Powered by Agentforce
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
          title="New conversation"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center mb-4">
              <Bot className="h-7 w-7 text-brand-gold" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">
              Payroll AI Assistant
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Ask about your pay stubs, payment history, or year-to-date
              earnings.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "What's my latest pay stub? My ID is EMP-001",
                "Show payment history for EMP-002",
                "What are my YTD earnings? ID: EMP-003",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-brand-gold/40 hover:bg-brand-gold/5 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "agent" && (
              <div className="w-7 h-7 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-brand-gold" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-charcoal text-white rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-brand-charcoal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-4 w-4 text-brand-charcoal" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-brand-gold" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md text-center">
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about payroll..."
            disabled={loading}
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-brand-gold text-white flex items-center justify-center hover:bg-brand-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
