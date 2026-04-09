"use client";

import { useEffect, useState } from "react";
import { Heart, CheckCircle2, Clock, Users, DollarSign, Loader2 } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";

interface BenefitType {
  id: string;
  benefit_name: string;
  category: string;
  cost: string;
  employer_contribution: string;
  provider: string;
}

interface BenefitInquiry {
  id: string;
  employee_name: string;
  benefit_category: string | null;
  status: string;
  inquiry_type: string;
  description: string;
  inquiry_date: string;
}

export function BenefitsDashboard() {
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [inquiries, setInquiries] = useState<BenefitInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/benefits/records")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setBenefitTypes(data.benefitTypes ?? []);
          setInquiries(data.inquiries ?? []);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const openInquiries = inquiries.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const resolved = inquiries.filter((i) => i.status === "resolved").length;
  const activeTypes = benefitTypes.length;

  return (
    <div className="space-y-6">
      <HeroBanner
        title="Benefits"
        subtitle="Manage employee benefits enrollment and explore available plans"
        bgColor="bg-gradient-to-r from-brand-yellow to-brand-yellow/80"
        badgeColor="bg-brand-charcoal/80"
        badgeText="AI-Powered"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Benefit Plans"
          value={loading ? "—" : activeTypes}
          bgColor="bg-brand-coral"
          icon={<Heart className="h-5 w-5 text-brand-coral" />}
        />
        <StatsCard
          label="Open Inquiries"
          value={loading ? "—" : openInquiries}
          bgColor="bg-brand-cyan"
          icon={<Clock className="h-5 w-5 text-brand-cyan" />}
        />
        <StatsCard
          label="Resolved"
          value={loading ? "—" : resolved}
          bgColor="bg-brand-lime"
          icon={<CheckCircle2 className="h-5 w-5 text-brand-lime" />}
        />
        <StatsCard
          label="Total Inquiries"
          value={loading ? "—" : inquiries.length}
          bgColor="bg-brand-yellow"
          icon={<Users className="h-5 w-5 text-brand-yellow" />}
        />
      </div>

      {error && (
        <div className="bg-white rounded-xl border border-border shadow-sm px-5 py-4">
          <p className="text-sm text-red-500">Failed to load data: {error}</p>
        </div>
      )}

      {/* Benefit Plans */}
      {benefitTypes.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <DollarSign className="h-4 w-4 text-brand-yellow" />
            <h3 className="font-semibold text-sm text-foreground">Available Benefit Plans</h3>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {benefitTypes.map((bt) => (
              <div key={bt.id} className="flex items-center justify-between px-5 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{bt.benefit_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {bt.category?.replace(/_/g, " ")} · {bt.provider}
                  </p>
                </div>
                <div className="text-right">
                  {bt.cost !== "0" && (
                    <p className="text-sm font-medium text-foreground">
                      ${bt.cost}<span className="text-xs text-muted-foreground">/mo</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Employer: {bt.employer_contribution.startsWith("Up to") || bt.employer_contribution === "N/A" || bt.employer_contribution === "100%" || bt.employer_contribution.includes("tax")
                      ? bt.employer_contribution
                      : `$${bt.employer_contribution}/mo`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inquiries */}
      {inquiries.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Users className="h-4 w-4 text-brand-yellow" />
            <h3 className="font-semibold text-sm text-foreground">Benefits Inquiries</h3>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {inquiries.map((inq) => (
              <div key={inq.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{inq.employee_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {inq.benefit_category?.replace(/_/g, " ") ?? "General"} · {inq.inquiry_date}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  inq.status === "resolved"
                    ? "bg-brand-lime/10 text-brand-lime"
                    : inq.status === "in_progress"
                      ? "bg-brand-cyan/10 text-brand-cyan"
                      : inq.status === "open"
                        ? "bg-brand-yellow/10 text-brand-yellow"
                        : "bg-muted text-muted-foreground"
                }`}>
                  {inq.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
