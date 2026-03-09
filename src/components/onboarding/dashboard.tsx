"use client";

import { useEffect, useState } from "react";
import { UserPlus, CheckCircle2, Clock, CalendarDays, TrendingUp, Loader2 } from "lucide-react";
import { HeroBanner } from "@/components/shared/hero-banner";
import { StatsCard } from "@/components/shared/stats-card";

interface OnboardingRecord {
  sys_id: string;
  employee_name: string;
  employee_id: string;
  position: string;
  department: string;
  office_location: string;
  onboarding_status: string; // "in_progress" | "completed" | "pending" | "on_hold"
  start_date: string;
  equipment_assigned: string | boolean;
  access_provisioned: string | boolean;
  documents_completed: string | boolean;
  training_scheduled: string | boolean;
  workspace_prepared: string | boolean;
  benefits_enrolled: string | boolean;
}

function isTrue(val: string | boolean | undefined): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true" || val === "1";
  return false;
}

const SAMPLE_RECORDS: OnboardingRecord[] = [
  {
    sys_id: "sample-001",
    employee_name: "Sarah Chen",
    employee_id: "EMP-1042",
    position: "Data Analyst",
    department: "Analytics",
    office_location: "Seattle, WA",
    onboarding_status: "completed",
    start_date: "2025-01-15",
    equipment_assigned: true,
    access_provisioned: true,
    documents_completed: true,
    training_scheduled: true,
    workspace_prepared: true,
    benefits_enrolled: true,
  },
  {
    sys_id: "sample-002",
    employee_name: "Marcus Johnson",
    employee_id: "EMP-1043",
    position: "Software Engineer",
    department: "Engineering",
    office_location: "Austin, TX",
    onboarding_status: "in_progress",
    start_date: "2025-02-03",
    equipment_assigned: true,
    access_provisioned: true,
    documents_completed: true,
    training_scheduled: false,
    workspace_prepared: false,
    benefits_enrolled: false,
  },
  {
    sys_id: "sample-003",
    employee_name: "Emily Rodriguez",
    employee_id: "EMP-1044",
    position: "Product Manager",
    department: "Product",
    office_location: "New York, NY",
    onboarding_status: "pending",
    start_date: "2025-03-10",
    equipment_assigned: false,
    access_provisioned: false,
    documents_completed: false,
    training_scheduled: false,
    workspace_prepared: false,
    benefits_enrolled: false,
  },
];

export function OnboardingDashboard() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/records")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setRecords([...(data.records ?? []), ...SAMPLE_RECORDS]);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate stats — status values are lowercase_underscore in ServiceNow
  const total = records.length;
  const completed = records.filter((r) => r.onboarding_status === "completed").length;
  const inProgress = records.filter((r) => r.onboarding_status === "in_progress").length;
  const tasksDone = records.reduce((sum, r) => {
    return (
      sum +
      [
        r.equipment_assigned,
        r.access_provisioned,
        r.documents_completed,
        r.training_scheduled,
        r.workspace_prepared,
      ].filter(isTrue).length
    );
  }, 0);
  const totalTasks = total * 5;
  const progressPct = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <HeroBanner
        title="Onboarding"
        subtitle="Track employee onboarding progress and manage tasks with AI assistance"
        bgColor="bg-gradient-to-r from-brand-lime to-brand-lime/80"
        badgeColor="bg-brand-charcoal/80"
        badgeText="AI-Powered"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Employees"
          value={loading ? "—" : total}
          bgColor="bg-brand-coral"
          icon={<UserPlus className="h-5 w-5 text-brand-coral" />}
        />
        <StatsCard
          label="Completed"
          value={loading ? "—" : completed}
          bgColor="bg-brand-cyan"
          icon={<CheckCircle2 className="h-5 w-5 text-brand-cyan" />}
        />
        <StatsCard
          label="In Progress"
          value={loading ? "—" : inProgress}
          bgColor="bg-brand-lime"
          icon={<Clock className="h-5 w-5 text-brand-lime" />}
        />
        <StatsCard
          label="Overall Progress"
          value={loading ? "—" : `${progressPct}%`}
          bgColor="bg-brand-yellow"
          icon={<TrendingUp className="h-5 w-5 text-brand-yellow" />}
        />
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <CalendarDays className="h-4 w-4 text-brand-lime" />
          <h3 className="font-semibold text-sm text-foreground">Employee Onboarding Status</h3>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />}
        </div>

        {error && (
          <div className="px-5 py-4 text-sm text-red-500">
            Failed to load data: {error}
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="px-5 py-4 text-sm text-muted-foreground">
            No onboarding records found.
          </div>
        )}

        {records.length > 0 && (
          <div className="divide-y divide-border">
            {records.map((record) => {
              const tasks = [
                { key: "equipment_assigned", label: "Equipment", val: record.equipment_assigned },
                { key: "access_provisioned", label: "Access", val: record.access_provisioned },
                { key: "documents_completed", label: "Documents", val: record.documents_completed },
                { key: "training_scheduled", label: "Training", val: record.training_scheduled },
                { key: "workspace_prepared", label: "Workspace", val: record.workspace_prepared },
              ];
              const doneTasks = tasks.filter((t) => isTrue(t.val)).length;

              return (
                <div key={record.sys_id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm text-foreground">{record.employee_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.employee_id} · {record.position} · {record.office_location}
                      </p>
                      {record.start_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Started: {record.start_date}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          record.onboarding_status === "completed"
                            ? "bg-brand-lime/10 text-brand-lime"
                            : record.onboarding_status === "in_progress"
                              ? "bg-brand-cyan/10 text-brand-cyan"
                              : record.onboarding_status === "on_hold"
                                ? "bg-brand-coral/10 text-brand-coral"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {record.onboarding_status === "in_progress"
                          ? "In Progress"
                          : record.onboarding_status === "completed"
                            ? "Completed"
                            : record.onboarding_status === "on_hold"
                              ? "On Hold"
                              : "Pending"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {doneTasks}/5 tasks
                      </span>
                    </div>
                  </div>
                  {/* Task pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tasks.map((t) => (
                      <span
                        key={t.key}
                        className={`text-xs px-2 py-0.5 rounded-md ${
                          isTrue(t.val)
                            ? "bg-brand-lime/10 text-brand-lime"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isTrue(t.val) ? "✓" : "○"} {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
