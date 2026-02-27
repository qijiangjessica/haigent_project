"use client";

import { useEffect, useState } from "react";
import { Heart, CheckCircle2, Clock, Users, DollarSign, Loader2 } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";

interface BenefitType {
  sys_id: string;
  benefit_name?: string;
  name?: string;
  benefit_category?: string;
  category?: string;
  employee_monthly_cost?: string;
  employer_monthly_cost?: string;
  coverage_amount?: string;
  is_active?: string | boolean;
}

interface Enrollment {
  sys_id: string;
  employee?: { display_value?: string; value?: string } | string;
  benefit_type?: { display_value?: string; value?: string } | string;
  enrollment_status?: string;
  coverage_level?: string;
  employee_premium?: string;
  effective_date?: string;
}

function displayVal(field: { display_value?: string; value?: string } | string | undefined): string {
  if (!field) return "—";
  if (typeof field === "string") return field;
  return field.display_value ?? field.value ?? "—";
}

export function BenefitsDashboard() {
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/benefits/records")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setBenefitTypes(data.benefitTypes ?? []);
          setEnrollments(data.enrollments ?? []);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const enrolled = enrollments.filter((e) => e.enrollment_status === "enrolled").length;
  const pending = enrollments.filter((e) => e.enrollment_status === "pending").length;
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
          label="Enrolled"
          value={loading ? "—" : enrolled}
          bgColor="bg-brand-cyan"
          icon={<CheckCircle2 className="h-5 w-5 text-brand-cyan" />}
        />
        <StatsCard
          label="Pending Enrollment"
          value={loading ? "—" : pending}
          bgColor="bg-brand-lime"
          icon={<Clock className="h-5 w-5 text-brand-lime" />}
        />
        <StatsCard
          label="Total Enrollments"
          value={loading ? "—" : enrollments.length}
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
          <div className="divide-y divide-border">
            {benefitTypes.map((bt) => (
              <div key={bt.sys_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {bt.benefit_name ?? bt.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {bt.benefit_category ?? bt.category ?? ""}
                  </p>
                </div>
                <div className="text-right">
                  {bt.employee_monthly_cost && (
                    <p className="text-sm font-medium text-foreground">
                      ${bt.employee_monthly_cost}<span className="text-xs text-muted-foreground">/mo</span>
                    </p>
                  )}
                  {bt.employer_monthly_cost && (
                    <p className="text-xs text-muted-foreground">
                      Employer: ${bt.employer_monthly_cost}/mo
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrollments */}
      {enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Users className="h-4 w-4 text-brand-yellow" />
            <h3 className="font-semibold text-sm text-foreground">Enrollment Overview</h3>
          </div>
          <div className="divide-y divide-border">
            {enrollments.map((e) => (
              <div key={e.sys_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {displayVal(e.employee)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {displayVal(e.benefit_type)}
                    {e.coverage_level ? ` · ${e.coverage_level}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {e.employee_premium && (
                    <span className="text-xs text-muted-foreground">${e.employee_premium}/mo</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.enrollment_status === "enrolled"
                      ? "bg-brand-yellow/10 text-brand-yellow"
                      : e.enrollment_status === "pending"
                        ? "bg-brand-gold/10 text-brand-gold"
                        : e.enrollment_status === "declined"
                          ? "bg-red-100 text-red-600"
                          : "bg-muted text-muted-foreground"
                  }`}>
                    {e.enrollment_status ?? "unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
