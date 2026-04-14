"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Users, CheckCircle2, Clock, Briefcase, TrendingUp, UserPlus, List, AlertTriangle, ChevronDown } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";
import { REFERENCE_CANDIDATES } from "@/data/reference/candidates";
import { MATCH_RECORDS } from "@/data/reference/matches";
import { TALENT_POOL } from "@/data/reference/talent-pool";
import { REFERENCES } from "@/data/reference/references";
import { REFERENCE_JOBS } from "@/data/reference/jobs";

interface LiveReferral {
  referral_id: string;
  submitted_at: string;
  referrer_name: string;
  candidate_name: string;
  current_employer: string;
  years_experience: number;
  location: string;
  availability: string;
}

interface LiveMatchRecord {
  referral_id: string;
  match_score: number;
  classification: "Strong Match" | "Partial Match" | "No Match";
  posting_id: string;
}

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
  const [liveReferrals, setLiveReferrals] = useState<LiveReferral[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatchRecord[]>([]);
  const [livePoolCount, setLivePoolCount] = useState(0);
  const [poolReferralIds, setPoolReferralIds] = useState<Set<string>>(new Set());
  const [rejectedReferralIds, setRejectedReferralIds] = useState<Set<string>>(new Set());
  const [seededExpanded, setSeededExpanded] = useState(false);
  const [liveExpanded, setLiveExpanded] = useState(false);

  const PAGE_SIZE = 5;

  useEffect(() => {
    fetch("/api/reference/submit")
      .then((r) => r.json())
      .then((data) => setLiveReferrals(data.referrals ?? []))
      .catch(() => {});

    fetch("/api/reference/live-matches")
      .then((r) => r.json())
      .then((data) => setLiveMatches(data.matches ?? []))
      .catch(() => {});

    fetch("/api/reference/promote-to-pool")
      .then((r) => r.json())
      .then((data) => {
        const entries: { referral_id: string }[] = data.pool_entries ?? [];
        setLivePoolCount(entries.length);
        setPoolReferralIds(new Set(entries.map((e) => e.referral_id)));
      })
      .catch(() => {});

    fetch("/api/reference/referral-actions")
      .then((r) => r.json())
      .then((data) => setRejectedReferralIds(new Set(data.rejected_ids ?? [])))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const seededStrong = MATCH_RECORDS.filter((m) => m.classification === "Strong Match").length;
    // Count unique referrals that have at least one strong match (not total records)
    const liveStrongCount = new Set(
      liveMatches
        .filter((m) => m.classification === "Strong Match")
        .map((m) => m.referral_id)
    ).size;
    const seededVerifying = REFERENCE_CANDIDATES.filter(
      (c) => c.pool_status === "verification_in_progress"
    ).length;
    // Live referrals with no match records = scoring failed, need attention
    const scoredReferralIds = new Set(liveMatches.map((m) => m.referral_id));
    const liveUnscored = liveReferrals.filter(
      (r) => !scoredReferralIds.has(r.referral_id) &&
             !rejectedReferralIds.has(r.referral_id) &&
             !poolReferralIds.has(r.referral_id)
    ).length;
    return {
      total: REFERENCES.length + liveReferrals.length,
      strongMatches: seededStrong + liveStrongCount,
      inPool: TALENT_POOL.length + livePoolCount,
      verifying: seededVerifying + liveUnscored,
    };
  }, [liveReferrals, liveMatches, livePoolCount, rejectedReferralIds, poolReferralIds]);

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
        <button
          onClick={() => setSeededExpanded((prev) => !prev)}
          className="w-full flex items-center gap-2 px-5 py-4 border-b border-border hover:bg-muted/40 transition-colors"
        >
          <TrendingUp className="h-4 w-4 text-brand-teal" />
          <h3 className="font-semibold text-sm text-foreground">Referred Candidates</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {REFERENCE_CANDIDATES.length} seeded
            {liveReferrals.length > 0 && ` · ${liveReferrals.length} submitted`}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${seededExpanded ? "rotate-180" : ""}`} />
        </button>

        <div className="divide-y divide-border">
          {/* Seeded candidates */}
          {seededExpanded && REFERENCE_CANDIDATES.slice(0, PAGE_SIZE).map((candidate) => {
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
                      <Link
                        href={`/reference/candidates/${candidate.candidate_id}`}
                        className="font-medium text-sm text-foreground hover:text-brand-teal hover:underline"
                      >
                        {candidate.name}
                      </Link>
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


          {/* Live submitted referrals */}
          {liveReferrals.length > 0 && (
            <>
              <div className="px-5 py-2 bg-brand-cyan/5 flex items-center justify-between">
                <p className="text-xs font-semibold text-brand-cyan">
                  Recently Submitted · {liveReferrals.length} referral{liveReferrals.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setLiveExpanded((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-cyan hover:text-brand-teal transition-colors"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${liveExpanded ? "rotate-180" : ""}`} />
                  {liveExpanded
                    ? "Show less"
                    : `Show (${Math.min(liveReferrals.length, PAGE_SIZE)} of ${liveReferrals.length})`}
                </button>
              </div>
              {liveExpanded && [...liveReferrals]
                .sort((a, b) => {
                  const aScore = liveMatches
                    .filter((m) => m.referral_id === a.referral_id)
                    .reduce((max, m) => Math.max(max, m.match_score), -1);
                  const bScore = liveMatches
                    .filter((m) => m.referral_id === b.referral_id)
                    .reduce((max, m) => Math.max(max, m.match_score), -1);
                  return bScore - aScore;
                })
                .slice(0, PAGE_SIZE)
                .map((referral) => {
                  const refMatches = liveMatches.filter(
                    (m) => m.referral_id === referral.referral_id
                  );
                  const bestMatch = refMatches.reduce<LiveMatchRecord | null>(
                    (best, m) => (!best || m.match_score > best.match_score ? m : best),
                    null
                  );
                  const isRejected = rejectedReferralIds.has(referral.referral_id);
                  const isInPool = poolReferralIds.has(referral.referral_id);
                  const scoringFailed = refMatches.length === 0 && !isRejected && !isInPool;

                  const statusBadge = isRejected
                    ? { label: "Not Suitable", className: "bg-muted text-muted-foreground" }
                    : isInPool
                    ? { label: "In Pool", className: "bg-brand-teal/10 text-brand-teal" }
                    : { label: "Pending Review", className: "bg-brand-cyan/10 text-brand-cyan" };

                  return (
                    <div key={referral.referral_id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/reference/referrals/${referral.referral_id}`}
                              className={`font-medium text-sm hover:underline ${
                                isRejected
                                  ? "text-muted-foreground hover:text-foreground"
                                  : "text-foreground hover:text-brand-teal"
                              }`}
                            >
                              {referral.candidate_name}
                            </Link>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {referral.current_employer || "—"} · {referral.years_experience}y exp · {referral.location || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Referred by {referral.referrer_name} on{" "}
                            {new Date(referral.submitted_at).toLocaleDateString("en-CA")}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          {bestMatch ? (
                            <>
                              <span className="text-sm font-bold text-foreground">
                                {bestMatch.match_score}
                                <span className="text-xs font-normal text-muted-foreground">/100</span>
                              </span>
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
                            </>
                          ) : scoringFailed ? (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-brand-gold flex-shrink-0" />
                              <span className="text-xs text-brand-gold font-medium">Scoring failed</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
