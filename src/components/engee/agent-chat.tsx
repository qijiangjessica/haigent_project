"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Loader2, RotateCcw, Sparkles } from "lucide-react";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

interface DisplayMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "I'd like to share my interests and find a mentor",
  "Schedule a coffee chat for me via Teams",
  "Which new hires haven't submitted their survey yet?",
  "Find a mentor match for me — I'm in Engineering",
];

interface EngeeChatProps {
  seedMessage?: string | null;
  onSeedConsumed?: () => void;
}

export function EngeeChat({ seedMessage, onSeedConsumed }: EngeeChatProps) {
  const [display, setDisplay]   = useState<DisplayMessage[]>([]);
  const [messages, setMessages] = useState<MessageParam[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const messagesEndRef          = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);
  const seedConsumed            = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [display]);

  useEffect(() => {
    if (seedMessage && !seedConsumed.current && !loading) {
      seedConsumed.current = true;
      onSeedConsumed?.();
      handleSend(seedMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMessage]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setError(null);

    const newMessages: MessageParam[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setDisplay((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/engee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Request failed");

      setMessages(data.messages);
      setDisplay((prev) => [...prev, { role: "assistant", text: data.response }]);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleReset() {
    setDisplay([]);
    setMessages([]);
    setError(null);
    setLoading(false);
    seedConsumed.current = false;
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-brand-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Engee</h3>
            <p className="text-xs text-muted-foreground">
              New Employee Engagement · Claude AI
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
        {display.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-brand-cyan" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Engee — New Employee Engagement</h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Share your interests, find a mentor, and schedule your first coffee chat —
              helping new hires succeed in their first 90 days.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-brand-cyan/40 hover:bg-brand-cyan/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {display.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-brand-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-brand-cyan" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-brand-charcoal text-white rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            }`}>
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
            <div className="w-7 h-7 rounded-lg bg-brand-cyan/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-brand-cyan" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md text-center">
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your interests, find a mentor, or schedule a coffee chat..."
            disabled={loading}
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-brand-cyan text-white flex items-center justify-center hover:bg-brand-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
