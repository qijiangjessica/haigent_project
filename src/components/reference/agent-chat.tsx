"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react";

interface MessageParam {
  role: "user" | "assistant";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | any[];
}

interface DisplayMessage {
  role: "user" | "assistant";
  text: string;
}

export function ReferenceChat() {
  const [display, setDisplay] = useState<DisplayMessage[]>([]);
  const [history, setHistory] = useState<MessageParam[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [display]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: DisplayMessage = { role: "user", text };
    setDisplay((prev) => [...prev, userMsg]);

    const newHistory: MessageParam[] = [
      ...history,
      { role: "user", content: text },
    ];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/reference/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      setDisplay((prev) => [
        ...prev,
        { role: "assistant", text: data.response },
      ]);
      setHistory(data.messages ?? newHistory);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setDisplay([]);
    setHistory([]);
    setError(null);
    setLoading(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-teal/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-brand-teal" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Reference Assistant
            </h3>
            <p className="text-xs text-muted-foreground">Claude AI · Referral Matching</p>
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
        {display.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-teal/10 flex items-center justify-center mb-4">
              <Bot className="h-7 w-7 text-brand-teal" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">
              Reference AI Assistant
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Ask about candidates, match scores, talent pool status, or referral outcomes.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Show me all strong match candidates",
                "What's the status of Alex Rivera?",
                "Who is in the talent pool?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {display.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-brand-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-brand-teal" />
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
            <div className="w-7 h-7 rounded-lg bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-brand-teal" />
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
            placeholder="Ask about candidates, matches, or talent pool..."
            disabled={loading}
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-brand-teal text-white flex items-center justify-center hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
