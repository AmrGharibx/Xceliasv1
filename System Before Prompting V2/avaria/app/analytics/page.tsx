"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Download, TrendingUp, Users, Award, Clock } from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useHydrated } from "@/hooks/useHydrated";

const obsidianTooltip = { background: "#231f1d", border: "1px solid rgba(100,100,160,0.12)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#fafaf9", boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)" };

// Dynamic Recharts imports to reduce bundle size
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });
const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import("recharts").then((m) => m.Radar), { ssr: false });

export default function AnalyticsPage() {
  const hydrated = useHydrated();
  const [range, setRange] = React.useState("30");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    attendanceByMonth: Array<{ month: string; present: number; absent: number; late: number }>;
    outcomeDistribution: Array<{ name: string; value: number; color: string }>;
    batchComparison: Array<{ batch: string; tech: number; soft: number }>;
    latePatterns: Array<{ hour: string; count: number }>;
    skillsRadar: Array<{ skill: string; A: number; B: number }>;
    skillsRadarLabels?: { A: string; B: string };
    avgCompletion: number;
  } | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/analytics?days=${range}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setData(d))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [range]);

  const attendanceByMonth = data?.attendanceByMonth ?? [];
  const outcomeDistribution = data?.outcomeDistribution ?? [];
  const batchComparison = data?.batchComparison ?? [];
  const latePatterns = data?.latePatterns ?? [];
  const skillsRadar = data?.skillsRadar ?? [];

  const avgAttendance =
    attendanceByMonth.length > 0
      ? Math.round(attendanceByMonth.reduce((s, m) => s + m.present, 0) / attendanceByMonth.length)
      : 0;

  const avgLate =
    attendanceByMonth.length > 0
      ? Math.round(attendanceByMonth.reduce((s, m) => s + m.late, 0) / attendanceByMonth.length)
      : 0;

  const avgAssessment =
    batchComparison.length > 0
      ? Math.round(
          (batchComparison.reduce((s, b) => s + (b.tech + b.soft) / 2, 0) / batchComparison.length) * 10
        ) / 10
      : 0;

  const avgCompletion = data?.avgCompletion ?? 0;

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-7xl space-y-8"
          >
            {/* Page Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-[#fafaf9]">Analytics</h1>
                <p className="text-sm text-[#57534e]">
                  Comprehensive insights and performance metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-4 py-2 text-sm text-[#ccd5e4] focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <Button variant="secondary">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Avg Attendance"
                value={loading ? "â€”" : `${avgAttendance}%`}
                change={loading ? "" : ""}
                positive
                icon={Users}
              />
              <MetricCard
                label="Avg Assessment Score"
                value={loading ? "â€”" : `${avgAssessment}%`}
                change={loading ? "" : ""}
                positive
                icon={Award}
              />
              <MetricCard
                label="Late Arrivals"
                value={loading ? "â€”" : `${avgLate}%`}
                change={loading ? "" : ""}
                positive
                icon={Clock}
              />
              <MetricCard
                label="Completion Rate"
                value={loading ? "â€”" : `${avgCompletion}%`}
                change=""
                positive
                icon={TrendingUp}
              />
            </div>

            {error && (
              <Card className="p-6 text-rose-300">
                {error}
              </Card>
            )}

            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Attendance Trends */}
              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                  Attendance Trends
                </h3>
                <div className="h-72">
                  {hydrated ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={attendanceByMonth}>
                      <defs>
                        <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="absent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: "#57534e", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={obsidianTooltip}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stroke="#10B981"
                        fill="url(#present)"
                        name="Present %"
                      />
                      <Area
                        type="monotone"
                        dataKey="absent"
                        stroke="#f43f5e"
                        fill="url(#absent)"
                        name="Absent %"
                      />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full rounded-xl bg-[#1c1917]/50" />
                  )}
                </div>
              </Card>

              {/* Assessment Outcomes */}
              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                  Assessment Outcomes Distribution
                </h3>
                <div className="h-72">
                  {hydrated ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={outcomeDistribution}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {outcomeDistribution.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={obsidianTooltip}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full rounded-xl bg-[#1c1917]/50" />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {outcomeDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: item.color }}
                      />
                      <span className="text-[#57534e]">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Batch Comparison */}
              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                  Batch Performance Comparison
                </h3>
                <div className="h-72">
                  {hydrated ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={batchComparison}>
                        <XAxis dataKey="batch" tick={{ fill: "#57534e", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#57534e", fontSize: 12 }} domain={[70, 100]} />
                        <Tooltip
                          contentStyle={obsidianTooltip}
                        />
                        <Legend />
                        <Bar dataKey="tech" name="Tech Score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="soft" name="Soft Score" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full rounded-xl bg-[#1c1917]/50" />
                  )}
                </div>
              </Card>

              {/* Late Arrival Patterns */}
              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                  Late Arrival Patterns
                </h3>
                <div className="h-72">
                  {hydrated ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={latePatterns}>
                        <XAxis dataKey="hour" tick={{ fill: "#57534e", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#57534e", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={obsidianTooltip}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={{ fill: "#F59E0B" }}
                          name="Late Count"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full rounded-xl bg-[#1c1917]/50" />
                  )}
                </div>
              </Card>
            </div>

            {/* Skills Radar */}
            <Card className="p-6">
              <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                Skills Comparison ({data?.skillsRadarLabels?.B ?? "Previous"} vs {data?.skillsRadarLabels?.A ?? "Latest"})
              </h3>
              <div className="h-80">
                {hydrated ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillsRadar}>
                      <PolarGrid stroke="rgba(100,100,160,0.12)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: "#57534e", fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: "#57534e", fontSize: 10 }} domain={[0, 100]} />
                      <Radar
                        name={data?.skillsRadarLabels?.A ?? "Latest"}
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                      <Radar
                        name={data?.skillsRadarLabels?.B ?? "Previous"}
                        dataKey="B"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                      <Legend />
                      <Tooltip
                        contentStyle={obsidianTooltip}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-xl bg-[#1c1917]/50" />
                )}
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#57534e]">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-[#fafaf9]">{value}</p>
          {change && (
            <p
              className={`mt-1 text-sm ${
                positive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {change} vs last period
            </p>
          )}
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
