"use client";

import { Clock, Briefcase, Phone, AlertTriangle } from "lucide-react";

interface ActivityMatch {
  posting_id: string;
  classification: string;
}

interface ReferralActivityBannerProps {
  submittedAt: string;
  matches: ActivityMatch[];
  contactedCount?: number;
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  const submitted = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24)));
}

export function ReferralActivityBanner({
  submittedAt,
  matches,
  contactedCount = 0,
}: ReferralActivityBannerProps) {
  const days = daysSince(submittedAt);

  // Deduplicate by posting_id and count only meaningful matches
  const uniqueMatchedJobs = new Set(
    matches
      .filter((m) => m.classification !== "No Match")
      .map((m) => m.posting_id)
  ).size;

  // Stale: >14 days with no contact made yet — amber warning
  const isStale = days > 14 && contactedCount === 0;
  // Old: >30 days regardless — gold regardless of contact
  const isOld = days > 30;

  const daysIcon   = isStale ? AlertTriangle : Clock;
  const daysAccent = isStale ? "text-amber-500" : isOld ? "text-brand-gold" : "text-brand-teal";
  const daysBg     = isStale
    ? "bg-amber-50 border-amber-200"
    : isOld
      ? "bg-brand-gold/10 border-brand-gold/20"
      : "bg-brand-teal/10 border-brand-teal/20";

  // Stale banner-level indicator
  const bannerBorder = isStale ? "border-amber-200" : "border-border";

  const stats = [
    {
      icon:   daysIcon,
      label:  isStale ? "Days — no contact yet" : "Days since referral",
      value:  days,
      accent: daysAccent,
      bg:     daysBg,
    },
    {
      icon:   Briefcase,
      label:  "Jobs matched",
      value:  uniqueMatchedJobs,
      accent: uniqueMatchedJobs > 0 ? "text-brand-green" : "text-muted-foreground",
      bg:     uniqueMatchedJobs > 0 ? "bg-brand-green/10 border-brand-green/20" : "bg-muted border-border",
    },
    {
      icon:   Phone,
      label:  "Jobs contacted",
      value:  contactedCount,
      accent: contactedCount > 0 ? "text-brand-cyan" : "text-muted-foreground",
      bg:     contactedCount > 0 ? "bg-brand-cyan/10 border-brand-cyan/20" : "bg-muted border-border",
    },
  ];

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${bannerBorder}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Referral Activity
        </p>
        {isStale && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            No contact in {days} days
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value, accent, bg }) => (
          <div key={label} className={`rounded-lg border ${bg} px-4 py-3 flex items-center gap-3`}>
            <Icon className={`h-5 w-5 flex-shrink-0 ${accent}`} />
            <div>
              <div className={`text-2xl font-bold leading-none ${accent}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
