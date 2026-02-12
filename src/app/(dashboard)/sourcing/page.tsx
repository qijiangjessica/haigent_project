import { Briefcase, Users, Mail, Calendar } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";
import { SOURCING_ROLES } from "@/data/sourcing/roles";

export default function SourcingDashboard() {
  const activeRoles = SOURCING_ROLES.filter((r) => r.status === "active").length;
  const totalSourced = SOURCING_ROLES.reduce((sum, r) => sum + r.sourcedCount, 0);
  const totalContacted = SOURCING_ROLES.reduce((sum, r) => sum + r.contactedCount, 0);
  const totalMeetings = SOURCING_ROLES.reduce((sum, r) => sum + r.meetingsCount, 0);

  return (
    <div className="space-y-6">
      <HeroBanner
        title="Sourcing Haigent"
        subtitle="Automated candidate sourcing with AI screening and outreach"
        bgColor="bg-brand-charcoal"
        badgeColor="bg-brand-gold"
        badgeText="AI-Powered"
        quickActions={[
          {
            label: "New Role",
            href: "/sourcing/roles",
            icon: <Briefcase className="h-4 w-4" />,
          },
          {
            label: "View Candidates",
            href: "/sourcing/candidates",
            icon: <Users className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Roles"
          value={activeRoles}
          bgColor="bg-amber-50"
          href="/sourcing/roles"
          icon={<Briefcase className="h-5 w-5 text-brand-gold" />}
        />
        <StatsCard
          label="Candidates Sourced"
          value={totalSourced}
          bgColor="bg-pink-50"
          href="/sourcing/candidates"
          icon={<Users className="h-5 w-5 text-brand-pink" />}
        />
        <StatsCard
          label="Outreach Sent"
          value={totalContacted}
          bgColor="bg-teal-50"
          href="/sourcing/outreach"
          icon={<Mail className="h-5 w-5 text-brand-teal" />}
        />
        <StatsCard
          label="Meetings Booked"
          value={totalMeetings}
          bgColor="bg-green-50"
          href="/sourcing/meetings"
          icon={<Calendar className="h-5 w-5 text-brand-green" />}
        />
      </div>
    </div>
  );
}
