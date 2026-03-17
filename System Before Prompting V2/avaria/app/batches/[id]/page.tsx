"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Clock,
  CalendarDays,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Badge, Card, ProgressBar, Avatar, CompletionRing, Breadcrumb, CardSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatTime, formatDateRange } from "@/lib/utils/calculations";

/* ─── types ─── */
type BatchDetail = {
  batch: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    batchNum: number | null;
  };
  stats: {
    traineeCount: number;
    attendanceEligible: boolean;
    attendanceStartBatch: number;
    avgCompletion10Day: number | null;
    presentTotal10Day: number | null;
    absentTotal10Day: number | null;
    lateTotal10Day: number | null;
    assessmentRecords: number;
  };
  trainees: Array<{
    id: string;
    name: string;
    company: string;
    completionPercent: number;
    assessment: null | { overallPercent: number; outcome: string };
  }>;
};

interface DailyRow {
  id: string;
  date: string;
  status: string;
  arrivalTime: string | null;
  wasLate: boolean | null;
  minutesLate: number | null;
  trainee: { traineeName: string; company: string };
}

interface TenDayRow {
  id: string;
  completionPercent: number | null;
  checklistStatus: string | null;
  days: boolean[] | null;
  presentCount: number | null;
  absentCount: number | null;
  lateCount: number | null;
  periodStart: string;
  periodEnd: string;
  trainee: { traineeName: string; company: string };
}

interface AssessmentRow {
  id: string;
  assessmentTitle: string;
  overallPercent: number;
  techScorePercent: number;
  softScorePercent: number;
  assessmentOutcome: string;
  trainee: { traineeName: string; company: string };
}

type Tab = "trainees" | "daily" | "10day" | "assessments";

const statusColors: Record<string, "warning" | "success" | "info"> = {
  Planning: "warning",
  Active: "success",
  Completed: "info",
};

const statusBadge: Record<string, string> = {
  Present: "bg-emerald-500/15 text-emerald-300",
  Absent: "bg-rose-500/15 text-rose-300",
  "Tour Day": "bg-teal-500/15 text-sky-300",
  "Off Day": "bg-[#57534e]/10 text-[#78716c]",
};

const outcomeBadge: Record<string, string> = {
  Aced: "bg-emerald-500/15 text-emerald-300",
  Excellent: "bg-green-500/15 text-green-300",
  "Very Good": "bg-lime-500/15 text-lime-300",
  Good: "bg-amber-500/15 text-amber-300",
  "Needs Improvement": "bg-orange-500/15 text-orange-300",
  Failed: "bg-rose-500/15 text-rose-300",
};

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BatchDetail | null>(null);
  const [tab, setTab] = React.useState<Tab>("trainees");

  /* sub-data */
  const [dailyRows, setDailyRows] = React.useState<DailyRow[]>([]);
  const [tenDayRows, setTenDayRows] = React.useState<TenDayRow[]>([]);
  const [assessmentRows, setAssessmentRows] = React.useState<AssessmentRow[]>([]);
  const [subLoading, setSubLoading] = React.useState(false);

  const batchId = params?.id;

  /* fetch batch detail */
  React.useEffect(() => {
    if (!batchId) { setError("Missing batch id"); setLoading(false); return; }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/batches/${encodeURIComponent(batchId)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: BatchDetail) => setData(json))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load batch");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [batchId]);

  /* fetch sub-data on tab change */
  React.useEffect(() => {
    if (!batchId || tab === "trainees") return;
    setSubLoading(true);
    if (tab === "daily") {
      fetch(`/api/attendance/daily?batchId=${batchId}&pageSize=200`)
        .then((r) => r.json())
        .then((d) => setDailyRows(d.records || []))
        .finally(() => setSubLoading(false));
    } else if (tab === "10day") {
      fetch(`/api/attendance/10-day?batchId=${batchId}&pageSize=200`)
        .then((r) => r.json())
        .then((d) => setTenDayRows(d.records || []))
        .finally(() => setSubLoading(false));
    } else if (tab === "assessments") {
      fetch(`/api/assessments?batchId=${batchId}&pageSize=200`)
        .then((r) => r.json())
        .then((d) => setAssessmentRows(d.assessments || []))
        .finally(() => setSubLoading(false));
    }
  }, [batchId, tab]);

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: "trainees", label: "Trainees", icon: Users, count: data?.stats.traineeCount },
    { key: "daily", label: "Daily Attendance", icon: CalendarDays },
    { key: "10day", label: "10-Day Summary", icon: CheckCircle2 },
    { key: "assessments", label: "Assessments", icon: BarChart3, count: data?.stats.assessmentRecords },
  ];

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl space-y-6">
            <Breadcrumb items={[
              { label: "Dashboard", href: "/" },
              { label: "Batches", href: "/batches" },
              { label: data?.batch.name ?? "Loading..." },
            ]} />

            {loading ? (
              <div className="space-y-6">
                <CardSkeleton lines={2} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} lines={2} />)}
                </div>
              </div>
            ) : error ? (
              <Card className="p-6 text-rose-400">{error}</Card>
            ) : !data ? (
              <Card className="p-6 text-[#78716c]">No data.</Card>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-[#fafaf9]">{data.batch.name}</h1>
                    <p className="text-sm text-[#57534e]">
                      {new Date(data.batch.startDate).toLocaleDateString()} — {new Date(data.batch.endDate).toLocaleDateString()} • {data.stats.traineeCount} trainees
                    </p>
                  </div>
                  <Badge variant={statusColors[data.batch.status] ?? "info"}>{data.batch.status}</Badge>
                </div>

                {/* KPI */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Kpi icon={Users} label="Trainees" value={data.stats.traineeCount} tone="sky" />
                  <Kpi icon={TrendingUp} label="Avg 10-day" value={data.stats.attendanceEligible ? `${data.stats.avgCompletion10Day ?? 0}%` : "N/A"} tone="emerald" />
                  <Kpi icon={Clock} label="Late (10-day)" value={data.stats.attendanceEligible ? (data.stats.lateTotal10Day ?? 0) : "N/A"} tone="amber" />
                  <Kpi icon={BarChart3} label="Assessments" value={data.stats.assessmentRecords} tone="cyan" />
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/40 p-1 overflow-x-auto">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap", tab === t.key ? "bg-emerald-500/15 text-cyan-300" : "text-[#57534e] hover:text-[#d6d3d1] hover:bg-[#231f1d]/50")}>
                        <Icon className="h-4 w-4" />
                        {t.label}
                        {t.count !== undefined && <span className="ml-1 rounded-full bg-[#231f1d] px-2 py-0.5 text-xs text-[#78716c]">{t.count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Trainees Tab */}
                {tab === "trainees" && (
                  <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-[#fafaf9]">Roster</h3>
                    {data.trainees.length === 0 ? <p className="text-[#57534e]">No trainees in this batch.</p> : (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {data.trainees.map((t) => (
                          <Link key={t.id} href={`/trainees/${t.id}`} className="group rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/40 p-4 transition-colors hover:border-[#a8a29e]/15 hover:bg-[#1c1917]/70">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-[#fafaf9] group-hover:text-cyan-300">{t.name}</div>
                                <div className="mt-0.5 text-xs text-[#57534e]">{t.company}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-emerald-400">{t.assessment ? `${t.assessment.overallPercent}%` : "—"}</div>
                                <div className="text-[11px] text-[#44403c]">Score</div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between text-[11px]"><span className="text-[#57534e]">Completion</span><span className="text-[#78716c]">{t.completionPercent}%</span></div>
                              <ProgressBar value={t.completionPercent} showLabel={false} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* Daily Attendance Tab */}
                {tab === "daily" && (
                  <Card className="overflow-hidden">
                    <div className="border-b border-[#a8a29e]/6 px-6 py-4">
                      <h3 className="text-lg font-semibold text-[#fafaf9]">Daily Attendance Log</h3>
                    </div>
                    {subLoading ? <div className="p-6 text-[#78716c]">Loading…</div> : dailyRows.length === 0 ? <div className="p-6 text-[#57534e]">No daily records.</div> : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead><tr className="border-b border-[#a8a29e]/6 text-left text-sm text-[#57534e]"><th className="p-4 font-medium">Trainee</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Arrival</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Late?</th></tr></thead>
                          <tbody>
                            {dailyRows.map((r) => (
                              <tr key={r.id} className="border-b border-[#a8a29e]/4 hover:bg-[#1c1917]/50">
                                <td className="p-4"><div className="flex items-center gap-3"><Avatar name={r.trainee.traineeName} size="sm" /><div><p className="font-medium text-[#ccd5e4]">{r.trainee.traineeName}</p><p className="text-xs text-[#57534e]">{r.trainee.company}</p></div></div></td>
                                <td className="p-4 text-sm text-[#78716c]">{new Date(r.date).toLocaleDateString()}</td>
                                <td className="p-4 text-sm text-[#78716c]">{r.arrivalTime ? formatTime(new Date(r.arrivalTime)) : "—"}</td>
                                <td className="p-4"><span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusBadge[r.status] || "bg-[#57534e]/10 text-[#78716c]")}>{r.status}</span></td>
                                <td className="p-4">{r.wasLate ? <span className="text-amber-400 text-sm">+{r.minutesLate}m</span> : <span className="text-[#44403c]">—</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                )}

                {/* 10-Day Tab */}
                {tab === "10day" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {subLoading ? <Card className="p-6 text-[#78716c]">Loading…</Card> : tenDayRows.length === 0 ? <Card className="p-6 text-[#57534e]">No 10-day records.</Card> : (
                      tenDayRows.map((r) => {
                        const days = r.days ?? Array.from({ length: 10 }, () => false);
                        return (
                          <Card key={r.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3"><Avatar name={r.trainee.traineeName} size="lg" /><div><h4 className="font-semibold text-[#fafaf9]">{r.trainee.traineeName}</h4><p className="text-xs text-[#57534e]">{r.trainee.company}</p><p className="text-xs text-[#44403c]">{formatDateRange(new Date(r.periodStart), new Date(r.periodEnd))}</p></div></div>
                              <CompletionRing value={r.completionPercent ?? 0} size={48} strokeWidth={5} />
                            </div>
                            <div className="mt-4 grid grid-cols-10 gap-1.5">
                              {days.map((c, i) => <div key={i} className={cn("flex aspect-square items-center justify-center rounded-lg text-[10px] font-medium", c ? "bg-emerald-500/20 text-emerald-300" : "bg-[#231f1d]/40 text-[#44403c]")}>{c ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</div>)}
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                              <div><span className="font-semibold text-emerald-300">{r.presentCount ?? "—"}</span><br /><span className="text-[#57534e]">Present</span></div>
                              <div><span className="font-semibold text-rose-300">{r.absentCount ?? "—"}</span><br /><span className="text-[#57534e]">Absent</span></div>
                              <div><span className="font-semibold text-amber-300">{r.lateCount ?? "—"}</span><br /><span className="text-[#57534e]">Late</span></div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Assessments Tab */}
                {tab === "assessments" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {subLoading ? <Card className="p-6 text-[#78716c]">Loading…</Card> : assessmentRows.length === 0 ? <Card className="p-6 text-[#57534e]">No assessments.</Card> : (
                      assessmentRows.map((a) => (
                        <Card key={a.id} className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3"><Avatar name={a.trainee.traineeName} size="lg" /><div><h4 className="font-semibold text-[#fafaf9]">{a.trainee.traineeName}</h4><p className="text-xs text-[#57534e]">{a.trainee.company}</p></div></div>
                            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", outcomeBadge[a.assessmentOutcome] || "bg-[#57534e]/10 text-[#78716c]")}>{a.assessmentOutcome}</span>
                          </div>
                          <div className="mt-4 space-y-3">
                            <div><div className="flex items-center justify-between text-sm mb-1"><span className="text-[#57534e]">Tech</span><span className="text-[#ccd5e4]">{a.techScorePercent}%</span></div><ProgressBar value={a.techScorePercent} showLabel={false} color="from-teal-500 to-emerald-400" /></div>
                            <div><div className="flex items-center justify-between text-sm mb-1"><span className="text-[#57534e]">Soft</span><span className="text-[#ccd5e4]">{a.softScorePercent}%</span></div><ProgressBar value={a.softScorePercent} showLabel={false} color="from-purple-500 to-pink-400" /></div>
                            <div className="rounded-xl bg-[#1c1917] p-3 flex items-center justify-between"><span className="text-sm text-[#57534e]">Overall</span><span className="text-xl font-bold text-[#fafaf9]">{a.overallPercent}%</span></div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; tone: "cyan" | "sky" | "emerald" | "amber" }) {
  const tones: Record<typeof tone, string> = { cyan: "bg-emerald-500/10 text-emerald-400", sky: "bg-teal-500/10 text-teal-400", emerald: "bg-emerald-500/10 text-emerald-400", amber: "bg-amber-500/10 text-amber-400" };
  return (
    <div className="rounded-xl border border-[#a8a29e]/6 bg-[#1c1917] flex items-center gap-4 p-5 transition-colors hover:border-[#a8a29e]/15/60">
      <div className={cn("rounded-lg p-2.5", tones[tone])}><Icon className="h-5 w-5" /></div>
      <div><div className="text-2xl font-semibold text-[#fafaf9]">{value}</div><div className="text-[13px] text-[#57534e]">{label}</div></div>
    </div>
  );
}
