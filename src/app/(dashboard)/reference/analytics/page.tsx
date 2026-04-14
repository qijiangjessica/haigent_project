"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Users, Clock, Zap, Trophy, Download, Target,
  AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, ChevronUp,
  BarChart3, GitMerge, Settings2, Medal, Bell, Gift, Layers,
} from "lucide-react";
import { OPEN_JOBS } from "@/data/reference/jobs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TTHRecord {
  referral_id: string;
  candidate_name: string;
  referrer_name: string;
  referrer_emp_id: string;
  target_job_id: string;
  submitted_at: string;
  hired_at: string;
  days_to_hire: number;
  best_match_classification: string | null;
  best_match_score: number | null;
}

interface BonusFlag {
  flag_id: string;
  referral_id: string;
  candidate_name: string;
  referrer_name: string;
  referrer_emp_id: string;
  hired_at: string;
  submitted_at: string;
  days_to_hire: number;
  status: "pending" | "processing" | "paid" | "ineligible";
  flagged_at: string;
  processed_at: string | null;
  notes: string | null;
}

interface SlaConfig { sla_days: number; breached_count: number; breached_referrals: AtRiskReferral[] }

interface TTHAggregations {
  count: number;
  mean: number;
  median: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
}

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  conversion_from_prev: number | null;
  avg_days_in_stage: number | null;
}

interface AtRiskReferral {
  referral_id: string;
  candidate_name: string;
  referrer_name: string;
  submitted_at: string;
  days_waiting: number;
  pipeline_status: string;
}

interface FunnelData {
  stages: FunnelStage[];
  breakdown: Record<string, number>;
  overall_conversion: number | null;
  total_submitted: number;
  stage_durations: {
    submitted_to_contacted: number | null;
    contacted_to_decision: number | null;
    decision_to_pool: number | null;
    pool_to_hired: number | null;
  };
  at_risk_referrals: AtRiskReferral[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

function avgOf(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function medianOf(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

// ── Monthly Trend Chart (pure SVG) ────────────────────────────────────────────

interface MonthlyPoint { month: string; avg: number; count: number }

function TrendChart({ points }: { points: MonthlyPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
        Not enough data for trend (need at least 2 months of hires)
      </div>
    );
  }

  const W = 560, H = 140, PAD_L = 40, PAD_B = 24, PAD_T = 12, PAD_R = 16;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_B - PAD_T;
  const maxVal = Math.max(...points.map((p) => p.avg));
  const minVal = Math.min(...points.map((p) => p.avg));
  const range  = maxVal - minVal || 1;

  const toX = (i: number) => PAD_L + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => PAD_T + (1 - (v - minVal) / range) * plotH;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.avg).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${(PAD_T + plotH).toFixed(1)} L ${PAD_L.toFixed(1)} ${(PAD_T + plotH).toFixed(1)} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-full" style={{ minWidth: 280 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_T + frac * plotH;
          const val = Math.round(maxVal - frac * range);
          return (
            <g key={frac}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{val}d</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="rgba(20,184,166,0.08)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinejoin="round" />

        {/* Dots + tooltips */}
        {points.map((p, i) => (
          <g key={p.month}>
            <circle cx={toX(i)} cy={toY(p.avg)} r="4" fill="#14b8a6" />
            <text x={toX(i)} y={PAD_T + plotH + 14} textAnchor="middle" fontSize="9" fill="#6b7280">
              {p.month}
            </text>
            <text x={toX(i)} y={toY(p.avg) - 7} textAnchor="middle" fontSize="9" fill="#14b8a6" fontWeight="600">
              {p.avg}d
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Funnel Bar ────────────────────────────────────────────────────────────────

function FunnelBar({ stage, maxCount, targetTTH, stageOrder }: {
  stage: FunnelStage;
  maxCount: number;
  targetTTH: number | null;
  stageOrder: number;
}) {
  const widthPct = maxCount > 0 ? Math.max(8, (stage.count / maxCount) * 100) : 8;
  const colors = ["#14b8a6", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981"];
  const color = colors[stageOrder % colors.length];

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-right text-xs text-muted-foreground font-medium flex-shrink-0">{stage.label}</div>
      <div className="flex-1 flex items-center gap-2">
        <div
          className="h-9 rounded-md flex items-center px-3 text-white text-xs font-bold transition-all"
          style={{ width: `${widthPct}%`, backgroundColor: color, minWidth: 60 }}
        >
          {stage.count}
        </div>
        {stage.conversion_from_prev != null && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {stage.conversion_from_prev}% of prev
          </span>
        )}
      </div>
      <div className="w-16 text-right text-xs text-muted-foreground flex-shrink-0">
        {stage.avg_days_in_stage != null ? `~${stage.avg_days_in_stage}d` : ""}
      </div>
    </div>
  );
}

// ── Score-to-Hire Scatter Plot ────────────────────────────────────────────────

function ScatterPlot({ records }: { records: TTHRecord[] }) {
  const scored = records.filter((r) => r.best_match_score != null);
  if (scored.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
        No scored + hired records yet — data will appear after referrals are scored and hired.
      </div>
    );
  }

  const W = 520, H = 180, PL = 42, PB = 28, PT = 12, PR = 16;
  const plotW = W - PL - PR;
  const plotH = H - PB - PT;
  const maxDays  = Math.max(...scored.map((r) => r.days_to_hire), 1);
  const maxScore = 100;

  const toX = (d: number) => PL + (d / maxDays) * plotW;
  const toY = (s: number) => PT + (1 - s / maxScore) * plotH;

  const colorMap: Record<string, string> = {
    "Strong Match": "#10b981",
    "Partial Match": "#f59e0b",
    "No Match": "#6b7280",
  };

  // Simple linear regression
  const xs = scored.map((r) => r.days_to_hire);
  const ys = scored.map((r) => r.best_match_score!);
  const n  = xs.length;
  const xMean = xs.reduce((s, x) => s + x, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;
  const slope = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0) /
                xs.reduce((s, x) => s + (x - xMean) ** 2, 1);
  const intercept = yMean - slope * xMean;
  const x1 = 0, y1 = Math.max(0, Math.min(100, intercept));
  const x2 = maxDays, y2 = Math.max(0, Math.min(100, slope * maxDays + intercept));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
        {/* Grid */}
        {[0, 25, 50, 75, 100].map((s) => {
          const y = toY(s);
          return (
            <g key={s}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{s}</text>
            </g>
          );
        })}
        {/* Day axis labels */}
        {[0, Math.round(maxDays / 2), maxDays].map((d) => (
          <text key={d} x={toX(d)} y={H - 6} textAnchor="middle" fontSize="9" fill="#9ca3af">{d}d</text>
        ))}

        {/* Regression line */}
        <line
          x1={toX(x1)} y1={toY(y1)} x2={toX(x2)} y2={toY(y2)}
          stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
        />

        {/* Dots */}
        {scored.map((r, i) => (
          <circle
            key={i}
            cx={toX(r.days_to_hire)}
            cy={toY(r.best_match_score!)}
            r="5"
            fill={colorMap[r.best_match_classification ?? ""] ?? "#6b7280"}
            opacity="0.75"
          />
        ))}

        {/* Axis labels */}
        <text x={PL + plotW / 2} y={H - 1} textAnchor="middle" fontSize="9" fill="#9ca3af">Days to Hire →</text>
        <text x={8} y={PT + plotH / 2} textAnchor="middle" fontSize="9" fill="#9ca3af" transform={`rotate(-90, 8, ${PT + plotH / 2})`}>Match Score ↑</text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
        {Object.entries(colorMap).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-auto">
          <span className="w-6 border-t border-dashed border-brand-teal inline-block" /> trend line
        </span>
      </div>
    </div>
  );
}

// ── Cohort Analysis Chart ─────────────────────────────────────────────────────
// Groups records by submission month and computes avg TTH per cohort.

interface CohortRow { cohort: string; count: number; avg: number; hired: number }

function CohortChart({ records }: { records: TTHRecord[] }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cohorts = useMemo<CohortRow[]>(() => {
    const byMonth = new Map<string, TTHRecord[]>();
    for (const r of records) {
      const month = r.submitted_at.slice(0, 7);
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)!.push(r);
    }
    // Also include all submitted referrals — we need total count but we only have hired ones here.
    // We'll note this is "of hired referrals" in the UI.
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, recs]) => ({
        cohort: new Date(month + "-15").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        count:  recs.length,
        avg:    Math.round(recs.reduce((s, r) => s + r.days_to_hire, 0) / recs.length),
        hired:  recs.length,
      }));
  }, [records]);

  if (cohorts.length === 0) {
    return <p className="text-xs text-muted-foreground">No data yet.</p>;
  }

  const maxAvg = Math.max(...cohorts.map((c) => c.avg), 1);

  return (
    <div className="space-y-2">
      {cohorts.map((c, i) => {
        const barPct = Math.max(4, (c.avg / maxAvg) * 100);
        const color  = i === cohorts.length - 1 ? "bg-brand-teal" : "bg-brand-cyan/60";
        return (
          <div key={c.cohort} className="flex items-center gap-3 text-xs">
            <span className="w-14 text-right text-muted-foreground flex-shrink-0">{c.cohort}</span>
            <div className="flex-1 bg-muted rounded-sm h-6 overflow-hidden">
              <div className={`${color} h-full flex items-center px-2 text-white text-[10px] font-semibold`} style={{ width: `${barPct}%` }}>
                {c.avg}d
              </div>
            </div>
            <span className="w-14 text-muted-foreground flex-shrink-0">{c.hired} hired</span>
          </div>
        );
      })}
      <p className="text-[10px] text-muted-foreground pt-1">
        Bars show avg TTH for referrals submitted in each month (hired cohort only)
      </p>
    </div>
  );
}

// ── Breakdown Table ───────────────────────────────────────────────────────────

interface BreakdownRow { label: string; count: number; avg: number; median: number; fastest: number; slowest: number }

function BreakdownTable({ title, rows, sortKey }: { title: string; rows: BreakdownRow[]; sortKey?: string }) {
  const [sortCol, setSortCol] = useState<keyof BreakdownRow>(sortKey === "count" ? "count" : "avg");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortCol], vb = b[sortCol];
    if (typeof va === "number" && typeof vb === "number") return sortAsc ? va - vb : vb - va;
    return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  function col(key: keyof BreakdownRow, label: string) {
    const active = sortCol === key;
    return (
      <th
        className="text-left text-muted-foreground font-medium pb-2 pr-3 cursor-pointer select-none hover:text-foreground text-[11px]"
        onClick={() => { if (active) setSortAsc((v) => !v); else { setSortCol(key); setSortAsc(true); } }}
      >
        <span className="flex items-center gap-1">
          {label}
          {active ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
        </span>
      </th>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No hired referrals yet — data will appear here once candidates are marked hired.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {col("label", "Name")}
                {col("count", "Hires")}
                {col("avg", "Avg TTH (d)")}
                {col("median", "Median")}
                {col("fastest", "Fastest")}
                {col("slowest", "Slowest")}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.label} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.label}</td>
                  <td className="py-2 pr-3 tabular-nums">{row.count}</td>
                  <td className="py-2 pr-3 tabular-nums font-semibold text-brand-teal">{row.avg}d</td>
                  <td className="py-2 pr-3 tabular-nums">{row.median}d</td>
                  <td className="py-2 pr-3 tabular-nums text-brand-green">{row.fastest}d</td>
                  <td className="py-2 pr-3 tabular-nums text-destructive">{row.slowest}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── CSV Export (T6) ───────────────────────────────────────────────────────────

function exportCSV(records: TTHRecord[]) {
  const headers = [
    "referral_id", "candidate_name", "referrer_name", "referrer_emp_id",
    "target_job_id", "submitted_at", "hired_at", "days_to_hire",
    "best_match_classification",
  ];
  const rows = records.map((r) =>
    [
      r.referral_id, r.candidate_name, r.referrer_name, r.referrer_emp_id,
      r.target_job_id, r.submitted_at, r.hired_at, r.days_to_hire,
      r.best_match_classification ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `reference-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "breakdowns" | "funnel" | "cohort" | "bonus" | "leaderboard" | "channels";

export default function ReferenceAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("overview");

  // TTH data
  const [records,      setRecords]      = useState<TTHRecord[]>([]);
  const [aggregations, setAggregations] = useState<TTHAggregations | null>(null);
  const [tthLoading,   setTthLoading]   = useState(true);

  // Funnel data
  const [funnel,       setFunnel]       = useState<FunnelData | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(true);

  // Bonus flags
  const [bonusFlags,   setBonusFlags]   = useState<BonusFlag[]>([]);
  const [bonusSummary, setBonusSummary] = useState<Record<string, number>>({});
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null);

  // SLA config
  const [slaConfig,    setSlaConfig]    = useState<SlaConfig | null>(null);
  const [slaInput,     setSlaInput]     = useState("14");
  const [slaSaving,    setSlaSaving]    = useState(false);
  const [slaAlertSending, setSlaAlertSending] = useState(false);
  const [slaAlertStatus,  setSlaAlertStatus]  = useState<"idle"|"sent"|"error">("idle");

  // T7 — target TTH (stored in localStorage)
  const [targetTTH,    setTargetTTH]    = useState<number | null>(null);
  const [targetInput,  setTargetInput]  = useState("");
  const [showTargetEdit, setShowTargetEdit] = useState(false);

  // Load target from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("reference_target_tth") : null;
    if (saved) {
      const n = parseInt(saved);
      if (!isNaN(n) && n > 0) { setTargetTTH(n); setTargetInput(String(n)); }
    }
  }, []);

  function saveTarget() {
    const n = parseInt(targetInput);
    if (!isNaN(n) && n > 0) {
      setTargetTTH(n);
      localStorage.setItem("reference_target_tth", String(n));
      setShowTargetEdit(false);
    }
  }

  function clearTarget() {
    setTargetTTH(null);
    setTargetInput("");
    localStorage.removeItem("reference_target_tth");
    setShowTargetEdit(false);
  }

  // Fetch TTH
  useEffect(() => {
    fetch("/api/reference/analytics/time-to-hire")
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.records ?? []);
        setAggregations(d.aggregations ?? null);
      })
      .catch(() => {})
      .finally(() => setTthLoading(false));
  }, []);

  // Fetch Funnel
  useEffect(() => {
    fetch("/api/reference/analytics/funnel")
      .then((r) => r.json())
      .then((d) => setFunnel(d))
      .catch(() => {})
      .finally(() => setFunnelLoading(false));
  }, []);

  // Fetch Bonus Flags
  useEffect(() => {
    fetch("/api/reference/bonus-flags")
      .then((r) => r.json())
      .then((d) => { setBonusFlags(d.flags ?? []); setBonusSummary(d.summary ?? {}); })
      .catch(() => {});
  }, []);

  // Fetch SLA config
  useEffect(() => {
    fetch("/api/reference/analytics/sla-alerts")
      .then((r) => r.json())
      .then((d) => { setSlaConfig(d); setSlaInput(String(d.sla_days ?? 14)); })
      .catch(() => {});
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────

  // Monthly trend — group by hired_at month
  const monthlyPoints = useMemo<MonthlyPoint[]>(() => {
    if (records.length === 0) return [];
    const byMonth = groupBy(records, (r) => r.hired_at.slice(0, 7));
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, recs]) => ({
        month: new Date(month + "-15").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        avg:   avgOf(recs.map((r) => r.days_to_hire)),
        count: recs.length,
      }));
  }, [records]);

  // Referrer breakdown
  const referrerRows = useMemo<BreakdownRow[]>(() => {
    const byRef = groupBy(records, (r) => r.referrer_name || r.referrer_emp_id || "Unknown");
    return Array.from(byRef.entries()).map(([label, recs]) => {
      const days = recs.map((r) => r.days_to_hire).sort((a, b) => a - b);
      return { label, count: recs.length, avg: avgOf(days), median: medianOf(days), fastest: days[0], slowest: days[days.length - 1] };
    });
  }, [records]);

  // Job breakdown
  const jobRows = useMemo<BreakdownRow[]>(() => {
    const byJob = groupBy(records, (r) => {
      const job = OPEN_JOBS.find((j) => j.id === r.target_job_id);
      return job ? job.title : r.target_job_id || "Unspecified";
    });
    return Array.from(byJob.entries()).map(([label, recs]) => {
      const days = recs.map((r) => r.days_to_hire).sort((a, b) => a - b);
      return { label, count: recs.length, avg: avgOf(days), median: medianOf(days), fastest: days[0], slowest: days[days.length - 1] };
    });
  }, [records]);

  // Classification breakdown
  const classRows = useMemo<BreakdownRow[]>(() => {
    const byClass = groupBy(records, (r) => r.best_match_classification ?? "Unscored");
    return Array.from(byClass.entries()).map(([label, recs]) => {
      const days = recs.map((r) => r.days_to_hire).sort((a, b) => a - b);
      return { label, count: recs.length, avg: avgOf(days), median: medianOf(days), fastest: days[0], slowest: days[days.length - 1] };
    });
  }, [records]);

  // T7 — At-risk referrals: submitted but no decision yet, waiting > (target / 2) days
  const atRiskThreshold = targetTTH ? Math.round(targetTTH / 2) : (aggregations ? Math.round(aggregations.mean / 2) : 14);
  const atRiskList = useMemo(() => {
    if (!funnel) return [];
    return funnel.at_risk_referrals.filter((r) => r.days_waiting >= atRiskThreshold);
  }, [funnel, atRiskThreshold]);

  // ── Target TTH gauge values ───────────────────────────────────────────────
  const currentAvg = aggregations?.mean ?? null;
  const targetPct  = targetTTH && currentAvg ? Math.min(200, Math.round((currentAvg / targetTTH) * 100)) : null;
  const targetStatus =
    targetPct == null ? null :
    targetPct <= 85  ? "on-track" :
    targetPct <= 100 ? "close"    : "over";

  const loading = tthLoading || funnelLoading;

  const downloadCSV = useCallback(() => exportCSV(records), [records]);

  // Bonus flag update handler
  async function handleFlagUpdate(flagId: string, status: BonusFlag["status"], notes?: string) {
    setUpdatingFlag(flagId);
    try {
      const res = await fetch(`/api/reference/bonus-flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (res.ok && data.flag) {
        setBonusFlags((prev) => prev.map((f) => f.flag_id === flagId ? data.flag : f));
      }
    } catch { /* silent */ } finally {
      setUpdatingFlag(null);
    }
  }

  // SLA config save
  async function saveSlaConfig() {
    const n = parseInt(slaInput);
    if (isNaN(n) || n < 1) return;
    setSlaSaving(true);
    try {
      const res = await fetch("/api/reference/analytics/sla-alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sla_days: n }),
      });
      if (res.ok) {
        // Refresh SLA data
        const d = await fetch("/api/reference/analytics/sla-alerts").then((r) => r.json());
        setSlaConfig(d); setSlaInput(String(d.sla_days ?? n));
      }
    } catch { /* silent */ } finally { setSlaSaving(false); }
  }

  // SLA send alert
  async function sendSlaAlert() {
    setSlaAlertSending(true); setSlaAlertStatus("idle");
    try {
      const res = await fetch("/api/reference/analytics/sla-alerts", { method: "POST" });
      const d = await res.json();
      setSlaAlertStatus(d.success ? "sent" : "error");
      setTimeout(() => setSlaAlertStatus("idle"), 4000);
    } catch { setSlaAlertStatus("error"); setTimeout(() => setSlaAlertStatus("idle"), 4000); }
    finally { setSlaAlertSending(false); }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "overview",     label: "Overview",     icon: BarChart3  },
    { key: "breakdowns",   label: "Breakdowns",   icon: GitMerge   },
    { key: "funnel",       label: "Funnel",       icon: TrendingUp },
    { key: "cohort",       label: "Cohort",       icon: Layers     },
    { key: "bonus",        label: "Bonus Flags",  icon: Gift,       badge: bonusSummary["pending"] || undefined },
    { key: "leaderboard",  label: "Leaderboard",  icon: Medal      },
    { key: "channels",     label: "Channels",     icon: Users      },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Referral Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Time-to-hire benchmarks, pipeline funnel, and referrer performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTargetEdit((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            {targetTTH ? `Target: ${targetTTH}d` : "Set Target"}
          </button>
          <button
            onClick={downloadCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 hover:bg-brand-teal/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* T7 — Target TTH editor */}
      {showTargetEdit && (
        <div className="bg-white rounded-xl border border-brand-teal/30 shadow-sm p-4 flex flex-wrap items-center gap-3">
          <Target className="h-4 w-4 text-brand-teal flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Target time-to-hire:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. 30"
              className="w-20 bg-muted rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <button
            onClick={saveTarget}
            className="px-3 py-1.5 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 transition-colors"
          >
            Save
          </button>
          {targetTTH && (
            <button onClick={clearTarget} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear target
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Referrals past {atRiskThreshold}d without a PROCEED decision will be flagged as at-risk
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            icon: Clock,
            label: "Avg TTH",
            value: aggregations ? `${aggregations.mean}d` : "—",
            sub: "mean time-to-hire",
            color: "text-brand-teal",
            badge: targetPct != null ? (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                targetStatus === "on-track" ? "bg-brand-green/10 text-brand-green" :
                targetStatus === "close"    ? "bg-brand-gold/10 text-brand-gold" :
                                             "bg-red-100 text-red-500"
              }`}>
                {targetPct}% of {targetTTH}d target
              </span>
            ) : null,
          },
          { icon: TrendingUp, label: "Median TTH", value: aggregations ? `${aggregations.median}d` : "—", sub: "50th percentile",     color: "text-brand-cyan"  },
          { icon: Zap,        label: "Fastest",    value: aggregations ? `${aggregations.min}d` : "—",    sub: "quickest hire",         color: "text-brand-green" },
          { icon: AlertTriangle, label: "Slowest", value: aggregations ? `${aggregations.max}d` : "—",    sub: "longest hire",          color: "text-brand-gold"  },
          { icon: Trophy,     label: "Total Hired",value: aggregations ? String(aggregations.count) : "0", sub: "referrals hired",      color: "text-brand-lime"  },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-border shadow-sm p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{loading ? "—" : card.value}</p>
            <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            {"badge" in card && card.badge}
          </div>
        ))}
      </div>

      {/* T7 — At-risk referrals banner */}
      {!loading && atRiskList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {atRiskList.length} at-risk referral{atRiskList.length !== 1 ? "s" : ""} — past {atRiskThreshold} days with no PROCEED decision
            </p>
          </div>
          <div className="space-y-1.5">
            {atRiskList.slice(0, 5).map((r) => (
              <div key={r.referral_id} className="flex items-center gap-3 text-xs">
                <Link
                  href={`/reference/referrals/${r.referral_id}`}
                  className="font-medium text-amber-900 hover:text-brand-teal hover:underline"
                >
                  {r.candidate_name}
                </Link>
                <span className="text-amber-700">referred by {r.referrer_name}</span>
                <span className="ml-auto text-amber-600 font-semibold">{r.days_waiting}d waiting</span>
              </div>
            ))}
            {atRiskList.length > 5 && (
              <p className="text-xs text-amber-700 mt-1">+{atRiskList.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-0">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === key
                  ? "border-brand-teal text-brand-teal"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge ? (
                <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Overview (T4 + T7) ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Monthly trend chart */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">Monthly Average TTH</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {monthlyPoints.length} month{monthlyPoints.length !== 1 ? "s" : ""} of data
              </span>
            </div>

            {/* Target reference line label */}
            {targetTTH && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                <div className="w-6 border-t-2 border-dashed border-amber-400" />
                <span className="text-amber-600 font-medium">Target: {targetTTH}d</span>
              </div>
            )}

            {loading ? (
              <div className="h-40 bg-muted rounded-lg animate-pulse" />
            ) : (
              <TrendChart points={monthlyPoints} />
            )}
          </div>

          {/* P75 / P90 cards */}
          {aggregations && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "P75", value: aggregations.p75, desc: "75% hired within" },
                { label: "P90", value: aggregations.p90, desc: "90% hired within" },
                { label: "Funnel size", value: funnel?.total_submitted ?? "—", desc: "total referrals" },
                { label: "Overall conv.", value: funnel?.overall_conversion != null ? `${funnel.overall_conversion}%` : "—", desc: "submitted → hired" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">
                    {typeof stat.value === "number" ? `${stat.value}d` : stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Hired referrals table */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">All Hired Referrals</h2>
              <span className="ml-auto text-xs text-muted-foreground">{records.length} total</span>
            </div>
            {records.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hired referrals yet. Mark a referral as hired in the{" "}
                <Link href="/reference/candidates" className="text-brand-teal hover:underline">Candidates</Link> page.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Candidate", "Referrer", "Job", "Submitted", "Hired", "Days", "Classification"].map((h) => (
                        <th key={h} className="text-left text-muted-foreground font-medium pb-2 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      const job = OPEN_JOBS.find((j) => j.id === r.target_job_id);
                      const overTarget = targetTTH && r.days_to_hire > targetTTH;
                      return (
                        <tr key={r.referral_id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <td className="py-1.5 pr-3">
                            <Link href={`/reference/referrals/${r.referral_id}`} className="font-medium text-foreground hover:text-brand-teal hover:underline">
                              {r.candidate_name}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-3 text-muted-foreground">{r.referrer_name}</td>
                          <td className="py-1.5 pr-3 text-muted-foreground">{job?.title ?? r.target_job_id ?? "—"}</td>
                          <td className="py-1.5 pr-3 text-muted-foreground tabular-nums">{fmtDate(r.submitted_at)}</td>
                          <td className="py-1.5 pr-3 text-muted-foreground tabular-nums">{fmtDate(r.hired_at)}</td>
                          <td className={`py-1.5 pr-3 tabular-nums font-semibold ${overTarget ? "text-red-500" : "text-brand-teal"}`}>
                            {r.days_to_hire}d
                            {overTarget && <span className="ml-1 text-[9px] font-normal text-red-400">&gt;target</span>}
                          </td>
                          <td className="py-1.5 pr-3">
                            {r.best_match_classification ? (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                r.best_match_classification === "Strong Match" ? "bg-brand-green/10 text-brand-green" :
                                r.best_match_classification === "Partial Match" ? "bg-brand-gold/10 text-brand-gold" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {r.best_match_classification}
                              </span>
                            ) : <span className="text-muted-foreground/50">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Breakdowns (T4) ── */}
      {tab === "breakdowns" && (
        <div className="space-y-5">
          <BreakdownTable title="By Referrer — who refers candidates that hire fastest?" rows={referrerRows} />
          <BreakdownTable title="By Role — which positions close fastest?"              rows={jobRows}      />
          <BreakdownTable title="By Match Classification — do Strong Matches hire faster?" rows={classRows} />
        </div>
      )}

      {/* ── Tab: Funnel (T5) ── */}
      {tab === "funnel" && (
        <div className="space-y-5">
          {/* Visual funnel */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">Pipeline Funnel</h2>
              {funnel && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Overall: {fmt(funnel.overall_conversion)}% submitted → hired
                </span>
              )}
            </div>

            <div className="mb-3 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-10 inline-block h-px border-t border-muted-foreground/30" /> bar width = relative count</span>
              <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> right column = avg days in stage</span>
            </div>

            {funnelLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-9 bg-muted rounded-md animate-pulse" />)}
              </div>
            ) : funnel ? (
              <div className="space-y-3">
                {funnel.stages.map((stage, i) => (
                  <FunnelBar
                    key={stage.stage}
                    stage={stage}
                    maxCount={funnel.stages[0].count}
                    targetTTH={targetTTH}
                    stageOrder={i}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Failed to load funnel data.</p>
            )}
          </div>

          {/* Stage duration table */}
          {funnel && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Avg Days per Stage Transition</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {[
                  { label: "Submitted → Contacted",   value: funnel.stage_durations.submitted_to_contacted },
                  { label: "Contacted → Decision",    value: funnel.stage_durations.contacted_to_decision  },
                  { label: "Decision → Talent Pool",  value: funnel.stage_durations.decision_to_pool       },
                  { label: "Talent Pool → Hired",     value: funnel.stage_durations.pool_to_hired          },
                ].map((s) => (
                  <div key={s.label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-muted-foreground mb-1 text-[10px]">{s.label}</p>
                    <p className="text-xl font-bold text-foreground">
                      {s.value != null ? `${s.value}d` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline breakdown counts */}
          {funnel && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Current Status Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {Object.entries(funnel.breakdown).map(([key, val]) => (
                  <div key={key} className="text-center p-3 bg-muted/40 rounded-lg">
                    <p className="text-xl font-bold text-foreground">{val}</p>
                    <p className="text-muted-foreground mt-0.5 capitalize">{key.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Cohort Analysis ── */}
      {tab === "cohort" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">Cohort Analysis — TTH by Submission Month</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Each row is a cohort of referrals submitted in the same month. Bar length shows average time-to-hire.
              A shortening trend indicates process improvement.
            </p>
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-muted rounded animate-pulse" />)}</div>
            ) : (
              <CohortChart records={records} />
            )}
          </div>

          {/* Score-to-hire correlation */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">Score-to-Hire Correlation</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Each dot is a hired referral — X axis = days to hire, Y axis = AI match score. A negative trend
              (high score → fewer days) confirms the match algorithm predicts faster hires.
            </p>
            {loading ? (
              <div className="h-48 bg-muted rounded animate-pulse" />
            ) : (
              <ScatterPlot records={records} />
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Bonus Flags ── */}
      {tab === "bonus" && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["pending","processing","paid","ineligible"] as const).map((s) => {
              const colors: Record<string, string> = {
                pending: "text-amber-600", processing: "text-brand-teal",
                paid: "text-brand-green", ineligible: "text-muted-foreground",
              };
              return (
                <div key={s} className="bg-white rounded-xl border border-border shadow-sm p-4">
                  <p className="text-xs text-muted-foreground capitalize mb-1">{s}</p>
                  <p className={`text-2xl font-bold ${colors[s]}`}>{bonusSummary[s] ?? 0}</p>
                </div>
              );
            })}
          </div>

          {/* SLA alert config */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">SLA Alerts</h2>
              {slaConfig && (
                <span className="text-xs text-muted-foreground ml-1">
                  — {slaConfig.breached_count} referral{slaConfig.breached_count !== 1 ? "s" : ""} currently breaching {slaConfig.sla_days}d SLA
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Alert when PROCEED state exceeds</span>
              <input
                type="number" min={1} value={slaInput}
                onChange={(e) => setSlaInput(e.target.value)}
                className="w-16 bg-muted rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
              />
              <span className="text-sm text-muted-foreground">days</span>
              <button
                onClick={saveSlaConfig}
                disabled={slaSaving}
                className="px-3 py-1.5 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 disabled:opacity-50 transition-colors"
              >
                {slaSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={sendSlaAlert}
                disabled={slaAlertSending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-brand-teal/40 disabled:opacity-50 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {slaAlertSending ? "Sending…" : "Send Alert Now"}
              </button>
              {slaAlertStatus === "sent" && (
                <span className="text-xs text-brand-green flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Alert sent</span>
              )}
              {slaAlertStatus === "error" && (
                <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Send failed</span>
              )}
            </div>
          </div>

          {/* Bonus flags table */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-4 w-4 text-brand-teal" />
              <h2 className="text-sm font-semibold text-foreground">Bonus Processing Queue</h2>
              <span className="ml-auto text-xs text-muted-foreground">{bonusFlags.length} total flags</span>
            </div>
            {bonusFlags.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No bonus flags yet — they are auto-created when a referral is marked as hired.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["Candidate","Referrer","Hired","Days TTH","Status","Action"].map((h) => (
                        <th key={h} className="text-left text-muted-foreground font-medium pb-2 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bonusFlags.map((f) => {
                      const statusColors: Record<string, string> = {
                        pending: "bg-amber-50 text-amber-700",
                        processing: "bg-brand-teal/10 text-brand-teal",
                        paid: "bg-brand-green/10 text-brand-green",
                        ineligible: "bg-muted text-muted-foreground",
                      };
                      const isUpdating = updatingFlag === f.flag_id;
                      return (
                        <tr key={f.flag_id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                          <td className="py-2 pr-3">
                            <Link href={`/reference/referrals/${f.referral_id}`} className="font-medium text-foreground hover:text-brand-teal hover:underline">
                              {f.candidate_name}
                            </Link>
                          </td>
                          <td className="py-2 pr-3 text-muted-foreground">{f.referrer_name}</td>
                          <td className="py-2 pr-3 text-muted-foreground tabular-nums">{f.hired_at.slice(0,10)}</td>
                          <td className="py-2 pr-3 tabular-nums font-semibold text-brand-teal">{f.days_to_hire}d</td>
                          <td className="py-2 pr-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColors[f.status]}`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            {f.status === "pending" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleFlagUpdate(f.flag_id, "processing")}
                                  disabled={isUpdating}
                                  className="px-2 py-1 rounded bg-brand-teal/10 text-brand-teal text-[10px] font-medium hover:bg-brand-teal/20 disabled:opacity-40 transition-colors"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={() => handleFlagUpdate(f.flag_id, "ineligible")}
                                  disabled={isUpdating}
                                  className="px-2 py-1 rounded bg-muted text-muted-foreground text-[10px] font-medium hover:bg-muted/80 disabled:opacity-40 transition-colors"
                                >
                                  Ineligible
                                </button>
                              </div>
                            )}
                            {f.status === "processing" && (
                              <button
                                onClick={() => handleFlagUpdate(f.flag_id, "paid")}
                                disabled={isUpdating}
                                className="px-2 py-1 rounded bg-brand-green/10 text-brand-green text-[10px] font-medium hover:bg-brand-green/20 disabled:opacity-40 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                            {(f.status === "paid" || f.status === "ineligible") && (
                              <span className="text-[10px] text-muted-foreground">{f.processed_at?.slice(0,10) ?? "—"}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Leaderboard (placeholder) ── */}
      {tab === "leaderboard" && (
        <div className="bg-white rounded-xl border border-dashed border-border shadow-sm p-10 flex flex-col items-center gap-4 text-center">
          <Medal className="h-10 w-10 text-brand-gold/40" />
          <h2 className="text-base font-semibold text-foreground">Referrer Leaderboard</h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Rank employees by hire rate, average time-to-hire, and total successful referrals.
            Gamifies the referral program — top referrers get recognised, slower pipelines get coaching.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-4 w-full max-w-sm opacity-30 pointer-events-none select-none">
            {["Gold · 3 hires · 12d avg", "Silver · 2 hires · 18d avg", "Bronze · 1 hire · 24d avg"].map((t, i) => (
              <div key={i} className="bg-muted rounded-lg p-3 text-xs text-center">
                <p className="text-2xl mb-1">{["🥇","🥈","🥉"][i]}</p>
                <p className="text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full mt-2">Coming soon</span>
        </div>
      )}

      {/* ── Tab: Channel Comparison (placeholder) ── */}
      {tab === "channels" && (
        <div className="bg-white rounded-xl border border-dashed border-border shadow-sm p-10 flex flex-col items-center gap-4 text-center">
          <Users className="h-10 w-10 text-brand-cyan/40" />
          <h2 className="text-base font-semibold text-foreground">Channel Comparison</h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Compare time-to-hire across hiring channels — Employee Referrals vs Direct Applications vs Agency.
            Referral TTH becomes the benchmark metric that demonstrates the program's ROI.
          </p>
          <div className="mt-2 w-full max-w-sm opacity-30 pointer-events-none select-none space-y-2">
            {[
              { channel: "Employee Referrals", days: 21, pct: 60 },
              { channel: "Direct Applications", days: 35, pct: 100 },
              { channel: "Agency", days: 42, pct: 120 },
            ].map((c) => (
              <div key={c.channel} className="flex items-center gap-3 text-xs">
                <span className="w-32 text-right text-muted-foreground">{c.channel}</span>
                <div className="flex-1 bg-muted h-6 rounded overflow-hidden">
                  <div className="bg-brand-teal/50 h-full" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="w-10 text-muted-foreground">{c.days}d</span>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full mt-2">Coming soon — connect additional hiring sources</span>
        </div>
      )}

      {/* Footer note */}
      <p className="text-[10px] text-muted-foreground text-center pb-2">
        Analytics computed from submitted referrals · Export includes all hired records ·{" "}
        <Link href="/reference/candidates" className="hover:text-brand-teal">Manage candidates →</Link>
      </p>
    </div>
  );
}
