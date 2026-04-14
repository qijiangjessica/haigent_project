import { ReferenceDashboard } from "@/components/reference/dashboard";
import { ReferenceChat } from "@/components/reference/agent-chat";

export default function ReferencePage() {
  return (
    <div className="space-y-6">
      <ReferenceDashboard />

      {/* AI Assistant + Reference Program Links — original 2-col layout restored */}
      <div id="ai-assistant" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <ReferenceChat />
        </div>
        <div className="lg:col-span-1 bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3">Reference Program Links</h3>
          <div className="space-y-2">
            {[
              { label: "Submit a Referral", description: "Refer a candidate for an open position", href: "/reference/submit" },
              { label: "View All Candidates", description: "Browse referred candidates and verification status", href: "/reference/candidates" },
              { label: "Talent Pool", description: "Candidates held for future openings", href: "/reference/pool" },
              { label: "Open Jobs", description: "View positions available for referrals", href: "/reference/jobs" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-brand-teal flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
