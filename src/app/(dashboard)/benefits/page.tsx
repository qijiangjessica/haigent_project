import { BenefitsDashboard } from "@/components/benefits/dashboard";
import { BenefitsChat } from "@/components/benefits/agent-chat";

export default function BenefitsPage() {
  return (
    <div className="space-y-6">
      <BenefitsDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <BenefitsChat />
        </div>
        <div className="lg:col-span-1 bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-sm text-foreground mb-3">Benefits Resources</h3>
          <div className="space-y-2">
            {[
              { label: "Benefits Enrollment Portal", description: "Enroll or update your benefit selections" },
              { label: "Health Insurance Guide", description: "Compare plan options, networks, and coverage" },
              { label: "401k & Retirement", description: "Manage contributions and investment options" },
              { label: "Time Off Policy", description: "PTO, sick leave, and holiday schedule" },
              { label: "Wellness Programs", description: "Gym reimbursement and EAP services" },
              { label: "Benefits FAQ", description: "Common questions about enrollment and coverage" },
            ].map((link) => (
              <div
                key={link.label}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-brand-yellow" />
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
