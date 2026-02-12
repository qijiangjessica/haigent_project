import { Briefcase, Users, Calendar, UserCheck } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";
import { JOBS } from "@/data/schedule/jobs";
import { CANDIDATES } from "@/data/schedule/candidates";
import { INTERVIEWS } from "@/data/schedule/interviews";
import { INTERVIEWERS } from "@/data/schedule/interviewers";

export default function ScheduleDashboard() {
  const activeJobs = JOBS.filter((j) => j.status === "active").length;
  const totalCandidates = CANDIDATES.length;
  const upcomingInterviews = INTERVIEWS.filter((i) => i.status === "upcoming").length;
  const activeInterviewers = INTERVIEWERS.filter((i) => i.isActive).length;

  return (
    <div className="space-y-6">
      <HeroBanner
        title="Schedule Haigent"
        subtitle="Automated interview scheduling with AI candidate scoring"
        bgColor="bg-brand-charcoal"
        badgeColor="bg-brand-pink"
        badgeText="AI-Powered"
        quickActions={[
          {
            label: "New Job",
            href: "/schedule/jobs",
            icon: <Briefcase className="h-4 w-4" />,
          },
          {
            label: "View Candidates",
            href: "/schedule/candidates",
            icon: <Users className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Jobs"
          value={activeJobs}
          bgColor="bg-pink-50"
          href="/schedule/jobs"
          icon={<Briefcase className="h-5 w-5 text-brand-pink" />}
        />
        <StatsCard
          label="Candidates"
          value={totalCandidates}
          bgColor="bg-amber-50"
          href="/schedule/candidates"
          icon={<Users className="h-5 w-5 text-brand-gold" />}
        />
        <StatsCard
          label="Upcoming Interviews"
          value={upcomingInterviews}
          bgColor="bg-teal-50"
          href="/schedule/interviews"
          icon={<Calendar className="h-5 w-5 text-brand-teal" />}
        />
        <StatsCard
          label="Active Interviewers"
          value={activeInterviewers}
          bgColor="bg-green-50"
          href="/schedule/interviewers"
          icon={<UserCheck className="h-5 w-5 text-brand-green" />}
        />
      </div>
    </div>
  );
}
