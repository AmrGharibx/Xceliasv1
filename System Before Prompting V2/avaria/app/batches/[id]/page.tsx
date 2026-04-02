"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Clock,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Plus,
  Pencil,
  Star,
} from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Badge, Button, Card, ProgressBar, Avatar, CompletionRing, Breadcrumb, CardSkeleton } from "@/components/ui";
import { Modal, FormField, ModalFooter, ModalInput, ModalSelect } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { formatTime, formatDateRange } from "@/lib/utils/calculations";
import BatchReportModal from "@/components/BatchReportModal";

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

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BatchDetail | null>(null);
  const [tab, setTab] = React.useState<Tab>("trainees");

  /* sub-data */
  const [dailyRows, setDailyRows] = React.useState<DailyRow[]>([]);
  const [tenDayRows, setTenDayRows] = React.useState<TenDayRow[]>([]);
  const [assessmentRows, setAssessmentRows] = React.useState<AssessmentRow[]>([]);
  const [subLoading, setSubLoading] = React.useState(false);

  const [batchId, setBatchId] = React.useState<string | null>(null);
  React.useEffect(() => { params.then((p) => setBatchId(p.id)); }, [params]);

  const toast = useToast();

  const fetchBatch = React.useCallback(async () => {
    if (!batchId) { setError("Missing batch id"); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${encodeURIComponent(batchId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load batch");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  React.useEffect(() => { fetchBatch(); }, [fetchBatch]);

  /* ─── Quick Status Change ───────────────────── */
  const [changingStatus, setChangingStatus] = React.useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = React.useState(false);

  async function handleQuickStatus(newStatus: string) {
    if (!batchId || !data || newStatus === data.batch.status) { setStatusMenuOpen(false); return; }
    setChangingStatus(true);
    setStatusMenuOpen(false);
    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: data.batch.name,
          status: newStatus,
          startDate: data.batch.startDate.slice(0, 10),
          endDate: data.batch.endDate.slice(0, 10),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Status updated", `Batch is now ${newStatus}.`);
      fetchBatch();
    } catch (e) {
      console.error(e);
      toast.error("Failed", "Could not update status.");
    } finally {
      setChangingStatus(false);
    }
  }

  /* ─── Report Modal ────────────────────────────── */
  const [reportOpen, setReportOpen] = React.useState(false);
  const batchCompanies = React.useMemo(() => {
    if (!data) return [];
    return [...new Set(data.trainees.map(t => t.company).filter(Boolean))].sort();
  }, [data]);

  /* ─── Edit Batch ─────────────────────────────── */
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ batchName: "", status: "", startDate: "", endDate: "" });
  const [savingBatch, setSavingBatch] = React.useState(false);

  function openEditBatch() {
    if (!data) return;
    setEditForm({
      batchName: data.batch.name,
      status: data.batch.status,
      startDate: data.batch.startDate.slice(0, 10),
      endDate: data.batch.endDate.slice(0, 10),
    });
    setEditOpen(true);
  }

  async function handleSaveBatch() {
    if (!batchId) return;
    setSavingBatch(true);
    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditOpen(false);
      toast.success("Batch updated", `${editForm.batchName} has been saved.`);
      fetchBatch();
    } catch (e) {
      console.error(e);
      toast.error("Save failed", "Could not update batch.");
    } finally {
      setSavingBatch(false);
    }
  }

  /* ─── Add Trainee ────────────────────────────── */
  const emptyTraineeForm = { name: "", email: "", phone: "", company: "" };
  const [addTraineeOpen, setAddTraineeOpen] = React.useState(false);
  const [traineeForm, setTraineeForm] = React.useState(emptyTraineeForm);
  const [traineeFormErrors, setTraineeFormErrors] = React.useState<Record<string, string>>({});
  const [savingTrainee, setSavingTrainee] = React.useState(false);

  async function handleAddTrainee() {
    const errs: Record<string, string> = {};
    if (!traineeForm.name.trim()) errs.name = "Full name is required";
    if (!traineeForm.company.trim()) errs.company = "Company is required";
    if (Object.keys(errs).length) { setTraineeFormErrors(errs); return; }
    setSavingTrainee(true);
    try {
      const res = await fetch("/api/trainees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...traineeForm, batchId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAddTraineeOpen(false);
      setTraineeForm(emptyTraineeForm);
      setTraineeFormErrors({});
      toast.success("Trainee added", `${traineeForm.name} has been added to this batch.`);
      fetchBatch();
    } catch (e) {
      console.error(e);
      toast.error("Add failed", "Could not add trainee.");
    } finally {
      setSavingTrainee(false);
    }
  }

  /* ─── Add Assessment ─────────────────────────── */
  const emptyAssessmentForm = { traineeId: "", assessmentTitle: "Final", productKnowledge: 0, mapping: 0, presentability: 0, softSkills: 0, assessmentOutcome: "" };
  const [addAssessmentOpen, setAddAssessmentOpen] = React.useState(false);
  const [assessmentForm, setAssessmentForm] = React.useState(emptyAssessmentForm);
  const [assessmentFormErrors, setAssessmentFormErrors] = React.useState<Record<string, string>>({});
  const [savingAssessment, setSavingAssessment] = React.useState(false);

  async function handleSaveAssessment() {
    const errs: Record<string, string> = {};
    if (!assessmentForm.traineeId) errs.traineeId = "Trainee is required";
    if (Object.keys(errs).length) { setAssessmentFormErrors(errs); return; }
    setSavingAssessment(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assessmentForm, batchId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAddAssessmentOpen(false);
      setAssessmentForm(emptyAssessmentForm);
      setAssessmentFormErrors({});
      toast.success("Assessment created", "Assessment has been saved.");
      fetchBatch();
      if (batchId) {
        setSubLoading(true);
        fetch(`/api/assessments?batchId=${batchId}&pageSize=200`)
          .then((r) => r.json())
          .then((d) => setAssessmentRows(d.assessments || []))
          .finally(() => setSubLoading(false));
      }
    } catch (e) {
      console.error(e);
      toast.error("Save failed", "Could not create assessment.");
    } finally {
      setSavingAssessment(false);
    }
  }

  /* Computed score preview for assessment form */
  const assessTechScore = Math.round(((assessmentForm.productKnowledge + assessmentForm.mapping) / 10) * 100);
  const assessSoftScore = Math.round(((assessmentForm.presentability + assessmentForm.softSkills) / 10) * 100);
  const assessOverallScore = Math.round(((assessmentForm.productKnowledge + assessmentForm.mapping + assessmentForm.presentability + assessmentForm.softSkills) / 20) * 100);

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
                  <div className="flex items-center gap-3">
                    {/* Quick status toggle */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusMenuOpen((o) => !o)}
                        disabled={changingStatus}
                        className="flex items-center gap-1.5 rounded-full border border-[#a8a29e]/10 bg-[#1c1917]/60 px-3 py-1 text-xs font-medium transition hover:border-[#a8a29e]/20 disabled:opacity-50"
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          data.batch.status === "Active" ? "bg-emerald-400" :
                          data.batch.status === "Completed" ? "bg-sky-400" : "bg-amber-400"
                        )} />
                        <span className="text-[#d6d3d1]">{changingStatus ? "Saving…" : data.batch.status}</span>
                        <svg className="h-3 w-3 text-[#57534e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {statusMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                          <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] py-1 shadow-xl">
                            {["Planning", "Active", "Completed"].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleQuickStatus(s)}
                                className={cn(
                                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-[#231f1d]",
                                  s === data.batch.status ? "text-cyan-300 font-medium" : "text-[#d6d3d1]"
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", s === "Active" ? "bg-emerald-400" : s === "Completed" ? "bg-sky-400" : "bg-amber-400")} />
                                {s}
                                {s === data.batch.status && <span className="ml-auto text-[10px] text-[#57534e]">current</span>}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <Button variant="secondary" size="sm" onClick={openEditBatch}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit batch
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setReportOpen(true)}
                      className="bg-rose-700/80 text-white hover:bg-rose-700"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Generate Report
                    </Button>
                  </div>
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
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#fafaf9]">Roster</h3>
                      <Button size="sm" onClick={() => { setTraineeForm(emptyTraineeForm); setTraineeFormErrors({}); setAddTraineeOpen(true); }}>
                        <Plus className="h-3.5 w-3.5" />
                        Add trainee
                      </Button>
                    </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#fafaf9]">Assessments</h3>
                      <Button size="sm" onClick={() => { setAssessmentForm(emptyAssessmentForm); setAssessmentFormErrors({}); setAddAssessmentOpen(true); }}>
                        <Plus className="h-3.5 w-3.5" />
                        New assessment
                      </Button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                    {subLoading ? <Card className="p-6 text-[#78716c]">Loading…</Card> : assessmentRows.length === 0 ? <Card className="p-6 text-[#57534e]">No assessments yet. Click "New assessment" above to add one.</Card> : (
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
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>

      {/* ─── Batch Report Modal ──────────────────────────── */}
      {reportOpen && data && (
        <BatchReportModal
          batchId={batchId!}
          batchName={data.batch.name}
          companies={batchCompanies}
          onClose={() => setReportOpen(false)}
        />
      )}

      {/* ─── Edit Batch Modal ──────────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit batch"
        description="Update this cohort's name, status, and schedule."
      >
        <div className="space-y-4">
          <FormField label="Batch name" required>
            <ModalInput
              value={editForm.batchName}
              onChange={(e) => setEditForm({ ...editForm, batchName: e.target.value })}
              placeholder="Batch 15"
            />
          </FormField>
          <FormField label="Status" required>
            <ModalSelect
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </ModalSelect>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" required>
              <ModalInput type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
            </FormField>
            <FormField label="End date" required>
              <ModalInput type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
            </FormField>
          </div>
        </div>
        <ModalFooter
          onCancel={() => setEditOpen(false)}
          onSubmit={handleSaveBatch}
          submitLabel="Save changes"
          loading={savingBatch}
        />
      </Modal>

      {/* ─── Add Trainee Modal ─────────────────────────────── */}
      <Modal
        open={addTraineeOpen}
        onClose={() => { setAddTraineeOpen(false); setTraineeForm(emptyTraineeForm); setTraineeFormErrors({}); }}
        title="Add trainee"
        description={`Add a new trainee directly to ${data?.batch.name ?? "this batch"}.`}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required error={traineeFormErrors.name}>
              <ModalInput
                value={traineeForm.name}
                onChange={(e) => setTraineeForm({ ...traineeForm, name: e.target.value })}
                placeholder="Ahmed Mohamed"
              />
            </FormField>
            <FormField label="Company" required error={traineeFormErrors.company}>
              <ModalInput
                value={traineeForm.company}
                onChange={(e) => setTraineeForm({ ...traineeForm, company: e.target.value })}
                placeholder="Company name"
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email">
              <ModalInput
                type="email"
                value={traineeForm.email}
                onChange={(e) => setTraineeForm({ ...traineeForm, email: e.target.value })}
                placeholder="ahmed@company.com"
              />
            </FormField>
            <FormField label="Phone">
              <ModalInput
                value={traineeForm.phone}
                onChange={(e) => setTraineeForm({ ...traineeForm, phone: e.target.value })}
                placeholder="+20 1X XXX XXXX"
              />
            </FormField>
          </div>
        </div>
        <ModalFooter
          onCancel={() => { setAddTraineeOpen(false); setTraineeForm(emptyTraineeForm); setTraineeFormErrors({}); }}
          onSubmit={handleAddTrainee}
          submitLabel="Add to batch"
          loading={savingTrainee}
        />
      </Modal>

      {/* ─── New Assessment Modal ───────────────────────────── */}
      <Modal
        open={addAssessmentOpen}
        onClose={() => { setAddAssessmentOpen(false); setAssessmentForm(emptyAssessmentForm); setAssessmentFormErrors({}); }}
        title="New Assessment"
        description={`Score a trainee from ${data?.batch.name ?? "this batch"}.`}
        wide
      >
        <div className="space-y-5">
          <FormField label="Trainee" required error={assessmentFormErrors.traineeId}>
            <ModalSelect
              value={assessmentForm.traineeId}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, traineeId: e.target.value })}
            >
              <option value="">Select trainee…</option>
              {(data?.trainees ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {t.company}</option>
              ))}
            </ModalSelect>
          </FormField>
          <FormField label="Assessment title">
            <ModalInput
              value={assessmentForm.assessmentTitle}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentTitle: e.target.value })}
              placeholder="Final"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            {(["productKnowledge", "mapping", "presentability", "softSkills"] as const).map((field) => {
              const labels: Record<string, string> = { productKnowledge: "Product Knowledge", mapping: "Mapping", presentability: "Presentability", softSkills: "Soft Skills" };
              return (
                <div key={field} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#78716c]">{labels[field]}</span>
                    <span className="text-sm font-semibold text-[#fafaf9]">{assessmentForm[field]}/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button"
                        onClick={() => setAssessmentForm({ ...assessmentForm, [field]: s === assessmentForm[field] ? 0 : s })}
                        className="transition-transform hover:scale-110">
                        <Star className={cn("h-5 w-5", s <= assessmentForm[field] ? "fill-amber-400 text-amber-400" : "text-[#3d3632]")} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#57534e]">Score Preview</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-lg font-semibold text-cyan-300">{assessTechScore}%</p><p className="text-xs text-[#57534e]">Tech</p></div>
              <div><p className="text-lg font-semibold text-purple-300">{assessSoftScore}%</p><p className="text-xs text-[#57534e]">Soft</p></div>
              <div><p className="text-lg font-semibold text-[#fafaf9]">{assessOverallScore}%</p><p className="text-xs text-[#57534e]">Overall</p></div>
            </div>
          </div>
          <FormField label="Outcome">
            <ModalSelect
              value={assessmentForm.assessmentOutcome}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentOutcome: e.target.value })}
            >
              <option value="">Auto-determine from score</option>
              <option value="Aced">Aced</option>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Failed">Failed</option>
            </ModalSelect>
          </FormField>
        </div>
        <ModalFooter
          onCancel={() => { setAddAssessmentOpen(false); setAssessmentForm(emptyAssessmentForm); setAssessmentFormErrors({}); }}
          onSubmit={handleSaveAssessment}
          submitLabel="Create assessment"
          loading={savingAssessment}
        />
      </Modal>
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
