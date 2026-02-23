"use client";

import { UserPlus, CheckCircle2, Clock, CalendarDays, TrendingUp } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";

// Mock data — replace with real ServiceNow data later
const stats = {
  tasksCompleted: 12,
  pendingItems: 5,
  daysSinceStart: 8,
  overallProgress: 71,
};

const recentTasks = [
  { name: "Complete I-9 verification", status: "completed" as const, date: "Feb 12" },
  { name: "Set up laptop & dev tools", status: "completed" as const, date: "Feb 13" },
  { name: "Enroll in health benefits", status: "pending" as const, date: "Due Feb 20" },
  { name: "Complete security training", status: "pending" as const, date: "Due Feb 22" },
  { name: "Meet with team lead", status: "completed" as const, date: "Feb 14" },
];

export function OnboardingDashboard() {
  return (
    <div className="space-y-6">
      <HeroBanner
        title="Onboarding"
        subtitle="Track your onboarding progress and complete tasks with AI assistance"
        bgColor="bg-gradient-to-r from-brand-teal to-brand-teal/80"
        badgeColor="bg-brand-charcoal/80"
        badgeText="AI-Powered"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Tasks Completed"
          value={stats.tasksCompleted}
          bgColor="bg-brand-teal/10"
          icon={<CheckCircle2 className="h-5 w-5 text-brand-teal" />}
        />
        <StatsCard
          label="Pending Items"
          value={stats.pendingItems}
          bgColor="bg-brand-gold/10"
          icon={<Clock className="h-5 w-5 text-brand-gold" />}
        />
        <StatsCard
          label="Days Since Start"
          value={stats.daysSinceStart}
          bgColor="bg-brand-pink/10"
          icon={<CalendarDays className="h-5 w-5 text-brand-pink" />}
        />
        <StatsCard
          label="Overall Progress"
          value={`${stats.overallProgress}%`}
          bgColor="bg-brand-green/10"
          icon={<TrendingUp className="h-5 w-5 text-brand-green" />}
        />
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <UserPlus className="h-4 w-4 text-brand-teal" />
          <h3 className="font-semibold text-sm text-foreground">Recent Tasks</h3>
        </div>
        <div className="divide-y divide-border">
          {recentTasks.map((task, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    task.status === "completed" ? "bg-brand-green" : "bg-brand-gold"
                  }`}
                />
                <span className="text-sm text-foreground">{task.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === "completed"
                      ? "bg-brand-green/10 text-brand-green"
                      : "bg-brand-gold/10 text-brand-gold"
                  }`}
                >
                  {task.status === "completed" ? "Done" : "Pending"}
                </span>
                <span className="text-xs text-muted-foreground">{task.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
