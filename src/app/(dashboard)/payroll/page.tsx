import { AgentChat } from "@/components/payroll/agent-chat";
import { HeroBanner } from "@/components/shared/hero-banner";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <HeroBanner
        title="Payroll"
        subtitle="AI-powered payroll assistant connected to Salesforce Agentforce"
        bgColor="bg-gradient-to-r from-brand-cyan to-brand-cyan/80"
        badgeColor="bg-brand-charcoal/80"
        badgeText="AI-Powered"
      />

      {/* Chat */}
      <AgentChat />
    </div>
  );
}
