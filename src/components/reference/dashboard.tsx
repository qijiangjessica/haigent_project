"use client";

import { useMemo } from "react";
import { Users, CheckCircle2, Clock, Briefcase, TrendingUp, UserPlus, List } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { REFERENCES } from "@/data/reference/references";
import { REFERENCE_JOBS } from "@/data/reference/jobs";

const STATUS_LABELS: Record<string, string> = {
  pending_validation: "Pending",
  verification_in_progress: "Verifying",
  matched: "Matched",
  in_pool: "In Pool",
  hired: "Hired",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  pending_validation: "bg-muted text-muted-foreground",
  verification_in_progress: "bg-brand-gold/10 text-brand-gold",
  matched: "bg-brand-cyan/10 text-brand-cyan",
  in_pool: "bg-brand-teal/10 text-brand-teal",
  hired: "bg-brand-green/10 text-brand-green",
  closed: "bg-muted text-muted-foreground",
};

const SKILL_STATUS_COLORS: Record<string, string> = {
  Verified: "bg-brand-green/10 text-brand-green",
  "Partially Verified": "bg-brand-gold/10 text-brand-gold",
  Unverified: "bg-muted text-muted-foreground",
};

export function ReferenceDashboard() {
  const stats = useMemo(() => {
    const strongMatches = MATCH_RECORDS.filter(
      (m) => m.classification === "Strong Match"
    ).length;
    const inPool = TALENT_POOL.length;
    const verifying = REFERENCE_CANDIDATES.filter(
      (c) => c.pool_status === "verification_in_progress"
    ).length;
    return {
      total: REFERENCES.length,
      strongMatches,
      inPool,
      verifying,
    };
  }, []);

  return (
    <div className="space-y-6">
      <HeroBanner
        title="Reference Program"
        subtitle="AI-powered employee referral matching with automated skill verification and talent pool management"
        bgColor="bg-gradient-to-r from-brand-teal to-brand-teal/80"
        badgeColor="bg-brand-charcoal/80"
        badgeText="AI-Powered"
        quickActions={[
          { label: "Submit Referral", href: "/reference/submit", icon: <UserPlus className="h-4 w-4" /> },
          { label: "View Candidates", href: "/reference/candidates", icon: <List className="h-4 w-4" /> },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total References"
          value={stats.total}
          bgColor="bg-brand-teal"
          icon={<Users className="h-5 w-5 text-brand-teal" />}
          href="/reference/candidates"
        />
        <StatsCard
          label="Strong Matches"
          value={stats.strongMatches}
          bgColor="bg-brand-cyan"
          icon={<CheckCircle2 className="h-5 w-5 text-brand-cyan" />}
          href="/reference/candidates"
        />
        <StatsCard
          label="In Talent Pool"
          value={stats.inPool}
          bgColor="bg-brand-lime"
          icon={<Briefcase className="h-5 w-5 text-brand-lime" />}
          href="/reference/pool"
        />
        <StatsCard
          label="Pending Verification"
          value={stats.verifying}
          bgColor="bg-brand-yellow"
          icon={<Clock className="h-5 w-5 text-brand-yellow" />}
        />
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <TrendingUp className="h-4 w-4 text-brand-teal" />
          <h3 className="font-semibold text-sm text-foreground">Referred Candidates</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {REFERENCE_CANDIDATES.length} candidates
          </span>
        </div>

        <div className="divide-y divide-border">
          {REFERENCE_CANDIDATES.map((candidate) => {
            const ref = REFERENCES.find(
              (r) => r.reference_id === candidate.reference_id
            );
            const bestMatch = MATCH_RECORDS.filter(
              (m) => m.candidate_id === candidate.candidate_id
            ).sort((a, b) => b.match_score - a.match_score)[0];

            return (
              <div key={candidate.candidate_id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">
                        {candidate.name}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[candidate.pool_status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[candidate.pool_status] ?? candidate.pool_status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {candidate.current_employer} · {candidate.years_experience}y exp · {candidate.location}
                    </p>
                    {ref && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Referred by {ref.referrer_name} on {ref.submission_date}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {candidate.candidate_score}
                      <span className="text-xs font-normal text-muted-foreground">/100</span>
                    </span>
                    {bestMatch && (
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            bestMatch.classification === "Strong Match"
                              ? "bg-brand-green/10 text-brand-green"
                              : bestMatch.classification === "Partial Match"
                                ? "bg-brand-gold/10 text-brand-gold"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {bestMatch.classification}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {REFERENCE_JOBS.find((j) => j.id === bestMatch.posting_id)?.title ?? bestMatch.posting_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill verification pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {candidate.skills_verified.map((sv) => (
                    <span
                      key={sv.skill}
                      className={`text-xs px-2 py-0.5 rounded-md ${
                        SKILL_STATUS_COLORS[sv.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {sv.status === "Verified" ? "✓" : sv.status === "Partially Verified" ? "~" : "○"}{" "}
                      {sv.skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
