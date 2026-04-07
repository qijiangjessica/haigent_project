"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, Linkedin, MoreHorizontal, ChevronDown, ChevronUp, MessageSquare, Loader2 } from "lucide-react";
import type { ContactEvent } from "@/types";

const METHOD_ICON: Record<ContactEvent["contact_method"], React.ElementType> = {
  email:    Mail,
  phone:    Phone,
  linkedin: Linkedin,
  other:    MoreHorizontal,
};

const METHOD_LABEL: Record<ContactEvent["contact_method"], string> = {
  email:    "Email",
  phone:    "Phone",
  linkedin: "LinkedIn",
  other:    "Other",
};

// Cycle order: sent → replied → no_response → sent
const STATUS_CYCLE: ContactEvent["status"][] = ["sent", "replied", "no_response"];

const STATUS_STYLES: Record<ContactEvent["status"], string> = {
  sent:        "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 hover:bg-brand-cyan/20",
  replied:     "bg-brand-green/10 text-brand-green border-brand-green/30 hover:bg-brand-green/20",
  no_response: "bg-muted text-muted-foreground border-border hover:bg-muted/70",
};

const STATUS_LABELS: Record<ContactEvent["status"], string> = {
  sent:        "Sent",
  replied:     "Replied",
  no_response: "No response",
};

interface ContactHistoryPanelProps {
  referralId: string;
  refreshTrigger?: number;
}

export function ContactHistoryPanel({ referralId, refreshTrigger = 0 }: ContactHistoryPanelProps) {
  const [contacts, setContacts] = useState<ContactEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!referralId) return;
    setLoading(true);
    fetch(`/api/reference/contacts?referral_id=${referralId}`)
      .then((r) => r.json())
      .then((data: { contacts: ContactEvent[] }) => setContacts(data.contacts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [referralId, refreshTrigger]);

  async function cycleStatus(contact: ContactEvent) {
    if (updatingId) return;
    const currentIdx = STATUS_CYCLE.indexOf(contact.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => c.contact_id === contact.contact_id ? { ...c, status: nextStatus } : c)
    );
    setUpdatingId(contact.contact_id);

    try {
      const res = await fetch(`/api/reference/contacts/${contact.contact_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        setContacts((prev) =>
          prev.map((c) => c.contact_id === contact.contact_id ? { ...c, status: contact.status } : c)
        );
      }
    } catch {
      // Revert on network error
      setContacts((prev) =>
        prev.map((c) => c.contact_id === contact.contact_id ? { ...c, status: contact.status } : c)
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Contact History</span>
          {contacts.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal font-medium">
              {contacts.length}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          {loading ? (
            <p className="text-xs text-muted-foreground mt-4">Loading…</p>
          ) : contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-4">No contacts logged yet.</p>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground mt-3 mb-3">
                Click the status badge to cycle: Sent → Replied → No response
              </p>
              <div className="space-y-3">
                {[...contacts].reverse().map((c) => {
                  const Icon = METHOD_ICON[c.contact_method];
                  const isUpdating = updatingId === c.contact_id;
                  return (
                    <div key={c.contact_id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                      {/* Method icon */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-teal/10 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-brand-teal" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-foreground">
                            {METHOD_LABEL[c.contact_method]}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.contacted_at).toLocaleDateString("en-CA", {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">by {c.contacted_by}</span>

                          {/* Clickable status badge */}
                          <button
                            onClick={() => cycleStatus(c)}
                            disabled={!!updatingId}
                            title="Click to update status"
                            className={`ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${STATUS_STYLES[c.status]}`}
                          >
                            {isUpdating
                              ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              : STATUS_LABELS[c.status]
                            }
                          </button>
                        </div>
                        {c.notes && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
