"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import CountUp from "react-countup";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Clock3,
  GraduationCap,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { CustomizationPanel } from "@/components/customization/CustomizationPanel";
import { Header, Sidebar } from "@/components/layout";
import { Button, CardSkeleton, CompletionRing, StatSkeleton } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

const Area = dynamic(() => import("recharts").then((module) => module.Area), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then((module) => module.AreaChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((module) => module.Bar), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((module) => module.BarChart), { ssr: false });
const Cell = dynamic(() => import("recharts").then((module) => module.Cell), { ssr: false });
const Pie = dynamic(() => import("recharts").then((module) => module.Pie), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((module) => module.PieChart), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((module) => module.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((module) => module.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((module) => module.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((module) => module.YAxis), { ssr: false });

interface DashboardData {
  stats: {
    activeBatches: number;
    planningBatches: number;
    completedBatches: number;
    totalTrainees: number;
  };
  today: {
    present: number;
    absent: number;
    late: number;
    onTour: number;
    rate: number;
  };
  weeklyTrend: { day: string; value: number }[];
  outcomeDistribution: { name: string; value: number }[];
  topCompanies: { name: string; trainees: number }[];
  recentAttendance: {
    id: string;
    name: string;
    status: string;
    time: string;
    isLate: boolean;
    batch: string;
  }[];
  tenDayProgress: { id: string; name: string; percent: number; status: string }[];
}

const outcomeColors = ["#42d3ff", "#9b8cff", "#f5c96a", "#ff7c95", "#6de5c2"];

function DashboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--app-bg)] text-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="relative flex-1 overflow-y-auto">
          <div className="app-backdrop-orb app-backdrop-orb-a" />
          <div className="app-backdrop-orb app-backdrop-orb-b" />
          <div className="app-backdrop-orb app-backdrop-orb-c" />
          {children}
        </div>
      </div>
    </div>
  );
}

function SignalChip({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "good" | "warning" | "danger" }) {
  const toneClass = {
    default: "border-white/8 bg-white/[0.04] text-[var(--text-secondary)]",
    good: "border-[rgba(109,229,194,0.2)] bg-[rgba(109,229,194,0.08)] text-[var(--signal-mint)]",
    warning: "border-[rgba(245,201,106,0.22)] bg-[rgba(245,201,106,0.08)] text-[var(--signal-amber)]",
    danger: "border-[rgba(255,124,149,0.22)] bg-[rgba(255,124,149,0.08)] text-[var(--signal-rose)]",
  }[tone];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      <span className="uppercase tracking-[0.2em] text-white/45">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SectionLabel({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--text-muted)]">{eyebrow}</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        {detail ? <p className="text-sm text-[var(--text-secondary)]">{detail}</p> : null}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <motion.div
      className="command-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{title}</p>
          <p className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">
            <CountUp end={value} duration={1.2} separator="," />
          </p>
          <p className="mt-2 max-w-[18rem] text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.05]" style={{ color: accent }}>
          {icon}
        </div>
      </div>
      <div className="mt-5 h-1.5 rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full" style={{ width: "100%", background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      </div>
    </motion.div>
  );
}

export default function OperationsDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [customizationOpen, setCustomizationOpen] = React.useState(false);
  const toast = useToast();

  const fetchData = React.useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const payload: DashboardData = await response.json();
        setData(payload);
        setError(false);
        setLastUpdated(new Date());
      } catch (fetchError) {
        console.error(fetchError);
        setError(true);
        toast.error("Dashboard unavailable", "Avaria could not refresh operational data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(true);
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <DashboardFrame>
        <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6 xl:px-8">
          <div className="space-y-3">
            <div className="skeleton-shimmer h-3 w-36 rounded-full" />
            <div className="skeleton-shimmer h-12 w-72 rounded-3xl" />
            <div className="skeleton-shimmer h-5 w-96 rounded-full" />
          </div>
          <StatSkeleton count={4} />
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <CardSkeleton lines={6} />
            <CardSkeleton lines={6} />
          </div>
        </div>
      </DashboardFrame>
    );
  }

  if (!loading && error && !data) {
    return (
      <DashboardFrame>
        <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="command-card max-w-lg text-center"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-[rgba(255,124,149,0.18)] bg-[rgba(255,124,149,0.08)] text-[var(--signal-rose)]">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Operational view unavailable</h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              The dashboard API did not return valid data. Check the server logs, then retry the command center.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => fetchData()} size="lg">
                <RefreshCw className="h-4 w-4" />
                Retry refresh
              </Button>
            </div>
          </motion.div>
        </div>
      </DashboardFrame>
    );
  }

  const stats = data?.stats ?? { activeBatches: 0, planningBatches: 0, completedBatches: 0, totalTrainees: 0 };
  const today = data?.today ?? { present: 0, absent: 0, late: 0, onTour: 0, rate: 0 };
  const weeklyTrend = data?.weeklyTrend ?? [];
  const outcomeDistribution = data?.outcomeDistribution ?? [];
  const topCompanies = data?.topCompanies ?? [];
  const recentAttendance = data?.recentAttendance ?? [];
  const tenDayProgress = data?.tenDayProgress ?? [];

  const totalTracked = today.present + today.absent + today.onTour;
  const readinessRate = totalTracked > 0 ? Math.round((today.present / totalTracked) * 100) : 0;
  const riskCount = today.absent + today.late;
  const attentionTone = riskCount > 12 ? "danger" : riskCount > 4 ? "warning" : "good";
  const topPerformer = topCompanies[0];
  const nextRisk = tenDayProgress.find((entry) => entry.percent < 50) ?? tenDayProgress[0];
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <DashboardFrame>
      <main className="mx-auto flex w-full max-w-[1540px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6 xl:px-8">
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <motion.div
            className="hero-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SignalChip label="Mode" value="Live control" tone="good" />
                  <SignalChip label="Date" value={todayLabel} />
                  {lastUpdated ? (
                    <SignalChip
                      label="Refreshed"
                      value={lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    />
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--text-muted)]">Academy operations</p>
                  <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold tracking-[-0.05em] text-white sm:text-5xl">
                    Run the academy from a single operational command surface.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                    Monitor throughput, detect attendance risk, inspect assessment health, and move from observation to action without leaving the dashboard.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => fetchData(true)} loading={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh command center
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setCustomizationOpen(true)}>
                    <Settings2 className="h-4 w-4" />
                    Tune workspace
                  </Button>
                </div>
              </div>

              <div className="grid min-w-[290px] gap-3 sm:grid-cols-2 xl:w-[340px] xl:grid-cols-1">
                <div className="command-card-muted">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Readiness index</p>
                      <p className="mt-2 text-3xl font-bold text-white">{readinessRate}%</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">Present trainees against active tracked roster for today.</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-[var(--signal-mint)]" />
                  </div>
                </div>

                <div className="command-card-muted">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Attention queue</p>
                      <p className="mt-2 text-3xl font-bold text-white">{riskCount}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">Combined absences and late arrivals requiring follow-up.</p>
                    </div>
                    <ShieldAlert className="h-5 w-5 text-[var(--signal-amber)]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="command-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <SectionLabel
              eyebrow="Mission control"
              title="Today at a glance"
              detail="Priority signals updated every 30 seconds"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="signal-panel">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Attendance</span>
                  <CalendarCheck className="h-4 w-4 text-[var(--signal-aqua)]" />
                </div>
                <p className="mt-3 text-4xl font-bold text-white">{today.rate}%</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Recorded attendance success rate across active sessions.</p>
              </div>

              <div className="signal-panel">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Planning load</span>
                  <Sparkles className="h-4 w-4 text-[var(--signal-violet)]" />
                </div>
                <p className="mt-3 text-4xl font-bold text-white">{stats.planningBatches}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Upcoming batches queued for setup and staffing.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <SignalChip label="Risk" value={`${riskCount} signals`} tone={attentionTone} />
              <SignalChip label="On tour" value={`${today.onTour} trainees`} />
              <SignalChip label="Completed batches" value={`${stats.completedBatches}`} tone="good" />
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Active batches"
            value={stats.activeBatches}
            description="Live cohorts currently in delivery and attendance monitoring."
            icon={<GraduationCap className="h-5 w-5" />}
            accent="var(--signal-aqua)"
          />
          <MetricCard
            title="Total trainees"
            value={stats.totalTrainees}
            description="Total roster footprint currently represented across the academy."
            icon={<Users className="h-5 w-5" />}
            accent="var(--signal-mint)"
          />
          <MetricCard
            title="Late arrivals"
            value={today.late}
            description="Trainees with same-day lateness requiring instructor visibility."
            icon={<Clock3 className="h-5 w-5" />}
            accent="var(--signal-amber)"
          />
          <MetricCard
            title="Assessment pressure"
            value={outcomeDistribution.reduce((sum, item) => sum + item.value, 0)}
            description="Current outcome volume feeding the academy quality signal."
            icon={<Activity className="h-5 w-5" />}
            accent="var(--signal-violet)"
          />
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
          <div className="command-card">
            <SectionLabel
              eyebrow="Live intelligence"
              title="Attendance trajectory"
              detail="Seven-day operational rhythm"
            />
            <div className="mt-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ left: -10, right: 8, top: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weeklyTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#42d3ff" stopOpacity={0.34} />
                      <stop offset="55%" stopColor="#42d3ff" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#42d3ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#7f8ca3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7f8ca3", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "rgba(8,12,22,0.94)",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#f5f7fb",
                    }}
                    labelStyle={{ color: "#f5f7fb", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#42d3ff" strokeWidth={3} fill="url(#weeklyTrendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="command-card">
              <SectionLabel
                eyebrow="Outcome mix"
                title="Assessment distribution"
                detail="How performance is currently clustering"
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={outcomeDistribution} dataKey="value" innerRadius={48} outerRadius={76} paddingAngle={3} strokeWidth={0}>
                        {outcomeDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={outcomeColors[index % outcomeColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(8,12,22,0.94)",
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#f5f7fb",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5">
                  {outcomeDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2.5">
                      <div className="flex items-center gap-3 text-sm text-white">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: outcomeColors[index % outcomeColors.length] }} />
                        <span>{entry.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="command-card-muted">
              <SectionLabel
                eyebrow="Field brief"
                title="Operational cues"
                detail="Fast interpretation of today’s state"
              />
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--signal-amber)]" />
                  <div>
                    <p className="text-sm font-medium text-white">{riskCount > 0 ? "Attendance exceptions detected" : "Attendance is clean"}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {riskCount > 0
                        ? `${riskCount} trainees need follow-up due to absence or lateness.`
                        : "No attendance exceptions are currently flagged in the live feed."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                  <TrendingUp className="mt-0.5 h-4 w-4 text-[var(--signal-mint)]" />
                  <div>
                    <p className="text-sm font-medium text-white">{topPerformer ? `${topPerformer.name} is leading enrollment.` : "Company distribution is still forming."}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {topPerformer
                        ? `${topPerformer.trainees} trainees are currently associated with the strongest company source.`
                        : "Import more company-linked records to generate distribution intelligence."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="command-card">
            <SectionLabel
              eyebrow="Source concentration"
              title="Top companies"
              detail="Enrollment pressure by company"
            />
            <div className="mt-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompanies} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 4 }}>
                  <XAxis type="number" tick={{ fill: "#7f8ca3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#f5f7fb", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "rgba(8,12,22,0.94)",
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#f5f7fb",
                    }}
                  />
                  <Bar dataKey="trainees" fill="#9b8cff" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="command-card">
            <SectionLabel
              eyebrow="Action queue"
              title="Operational watchlist"
              detail="Recent attendance and completion signals"
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Recent attendance</p>
                <AnimatePresence initial={false} mode="popLayout">
                  {recentAttendance.slice(0, 5).map((entry) => {
                    const stateTone = entry.isLate ? "var(--signal-amber)" : entry.status === "Absent" ? "var(--signal-rose)" : "var(--signal-mint)";
                    const stateLabel = entry.isLate ? "Late" : entry.status;

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{entry.batch}</p>
                          </div>
                          <span className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: `${stateTone}33`, color: stateTone, background: `${stateTone}14` }}>
                            {stateLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{entry.time || "Awaiting timestamp"}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">10-day readiness</p>
                {tenDayProgress.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                      <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{entry.status}</p>
                    </div>
                    <CompletionRing value={entry.percent} size={58} color={entry.percent < 50 ? "text-[#ff7c95]" : entry.percent < 80 ? "text-[#f5c96a]" : "text-[#6de5c2]"} />
                  </div>
                ))}
              </div>
            </div>

            {nextRisk ? (
              <div className="mt-5 rounded-3xl border border-[rgba(255,124,149,0.16)] bg-[rgba(255,124,149,0.08)] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--signal-rose)]">Next intervention</p>
                    <p className="mt-1 text-base font-semibold text-white">{nextRisk.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{nextRisk.status} with {nextRisk.percent}% completion.</p>
                  </div>
                  <Button variant="secondary">
                    Inspect case
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <CustomizationPanel open={customizationOpen} onClose={() => setCustomizationOpen(false)} />
    </DashboardFrame>
  );
}
