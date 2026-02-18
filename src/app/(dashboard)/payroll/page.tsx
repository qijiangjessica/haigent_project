import { DollarSign } from "lucide-react";
import { AgentChat } from "@/components/payroll/agent-chat";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-brand-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Payroll Haigent
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered payroll assistant connected to Salesforce Agentforce
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="max-w-2xl">
        <AgentChat />
      </div>
    </div>
  );
}
