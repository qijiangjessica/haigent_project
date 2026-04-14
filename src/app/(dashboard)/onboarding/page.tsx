import { OnboardingDashboard } from "@/components/onboarding/dashboard";
import { OnboardingChat } from "@/components/onboarding/agent-chat";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <OnboardingDashboard />

      {/* Chat Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <OnboardingChat />
        </div>
        <div className="lg:col-span-1 bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3">Quick Links</h3>
          <div className="space-y-2">
            {[
              { label: "IT Service Catalog", description: "Request hardware, software, or access" },
              { label: "HR Benefits Portal", description: "Enroll in health, dental, and vision plans" },
              { label: "Training Center", description: "Complete required onboarding courses" },
              { label: "Team Directory", description: "Find your team members and org chart" },
              { label: "Company Handbook", description: "Policies, guidelines, and FAQs" },
            ].map((link) => (
              <div
                key={link.label}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-brand-lime" />
                <div>
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
