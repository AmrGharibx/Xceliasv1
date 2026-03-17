"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bus,
  Calendar,
  CalendarCheck,
  Check,
  Clock3,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Header, Sidebar } from "@/components/layout";
import { Avatar, Badge, Button, Card, EmptyState, TableSkeleton } from "@/components/ui";
import { ConfirmDialog, FormField, Modal, ModalFooter, ModalInput, ModalSelect } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatTime } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@/types";

interface AttendanceRecord {
  id: string;
  date: string;
  arrivalTime: string | null;
  departureTime: string | null;
  status: AttendanceStatus;
  absenceReason: string | null;
  wasLate: boolean | null;
  minutesLate: number | null;
  attendanceEligible: boolean;
  trainee: { id: string; traineeName: string; company: string };
  batch: { id: string; batchName: string };
}

interface BatchOption {
  id: string;
  batchName: string;
}

interface TraineeOption {
  id: string;
  name: string;
  batchId: string;
}

const emptyForm = {
  traineeId: "",
  batchId: "",
  date: new Date().toISOString().slice(0, 10),
  arrivalTime: "",
  departureTime: "",
  status: "Present" as AttendanceStatus,
  absenceReason: "",
};

const statusTone = {
  Present: { variant: "success", icon: Check },
  Absent: { variant: "error", icon: X },
  "Tour Day": { variant: "info", icon: Bus },
  "Off Day": { variant: "warning", icon: Calendar },
} as const;

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function MetricChip({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "mint" | "rose" | "amber" | "aqua" }) {
  const tones = {
    default: "text-white",
    mint: "text-[var(--signal-mint)]",
    rose: "text-[var(--signal-rose)]",
    amber: "text-[var(--signal-amber)]",
    aqua: "text-[var(--signal-aqua)]",
  } as const;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", tones[tone])}>{value}</p>
    </div>
  );
}

export default function DailyAttendancePage() {
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [autoDateResolved, setAutoDateResolved] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [statusFilter, setStatusFilter] = React.useState<"" | AttendanceStatus>("");
  const [batchFilter, setBatchFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editRecord, setEditRecord] = React.useState<AttendanceRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = React.useState<AttendanceRecord | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [batches, setBatches] = React.useState<BatchOption[]>([]);
  const [trainees, setTrainees] = React.useState<TraineeOption[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const toast = useToast();

  React.useEffect(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("date", selectedDate);
    if (deferredSearch) params.set("search", deferredSearch);
    if (statusFilter) params.set("status", statusFilter);
    if (batchFilter) params.set("batchId", batchFilter);

    fetch(`/api/attendance/daily?${params.toString()}`, { signal: abortController.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((payload: { records: AttendanceRecord[] }) => setRecords(payload.records || []))
      .catch((fetchError: unknown) => {
        if ((fetchError as { name?: string }).name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load attendance records");
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, [batchFilter, deferredSearch, refreshKey, selectedDate, statusFilter]);

  React.useEffect(() => {
    if (autoDateResolved) return;

    fetch("/api/attendance/daily?pageSize=1")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const latestDate = payload?.records?.[0]?.date;
        if (latestDate) setSelectedDate(new Date(latestDate).toISOString().slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setAutoDateResolved(true));
  }, [autoDateResolved]);

  React.useEffect(() => {
    fetch("/api/batches?search=")
      .then((response) => response.json())
      .then((payload) => {
        setBatches((payload.batches || []).map((batch: { id: string; batchName: string }) => ({ id: batch.id, batchName: batch.batchName })));
      })
      .catch(() => {});

    fetch("/api/trainees?pageSize=2000")
      .then((response) => response.json())
      .then((payload) => {
        setTrainees(
          (payload.trainees || []).map((trainee: { id: string; name: string; batchId: string }) => ({
            id: trainee.id,
            name: trainee.name,
            batchId: trainee.batchId,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const filteredTrainees = form.batchId ? trainees.filter((trainee) => trainee.batchId === form.batchId) : trainees;

  function resetFormState() {
    setForm({ ...emptyForm, date: selectedDate });
    setFormErrors({});
  }

  function openCreate() {
    resetFormState();
    setShowCreate(true);
  }

  function openEdit(record: AttendanceRecord) {
    const dateString = new Date(record.date).toISOString().slice(0, 10);
    setFormErrors({});
    setForm({
      traineeId: record.trainee.id,
      batchId: record.batch.id,
      date: dateString,
      arrivalTime: record.arrivalTime ? new Date(record.arrivalTime).toTimeString().slice(0, 5) : "",
      departureTime: record.departureTime ? new Date(record.departureTime).toTimeString().slice(0, 5) : "",
      status: record.status,
      absenceReason: record.absenceReason || "",
    });
    setEditRecord(record);
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!editRecord && !form.batchId) nextErrors.batchId = "Batch is required";
    if (!editRecord && !form.traineeId) nextErrors.traineeId = "Trainee is required";
    if (!editRecord && !form.date) nextErrors.date = "Date is required";
    if (form.status === "Absent" && !form.absenceReason.trim()) nextErrors.absenceReason = "Absence reason is required for absent records";

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const dateString = form.date;
    const payload: Record<string, unknown> = {
      status: form.status,
      absenceReason: form.status === "Absent" ? form.absenceReason.trim() : null,
      arrivalTime: form.arrivalTime ? `${dateString}T${form.arrivalTime}:00` : null,
      departureTime: form.departureTime ? `${dateString}T${form.departureTime}:00` : null,
    };

    if (!editRecord) {
      payload.traineeId = form.traineeId;
      payload.batchId = form.batchId;
      payload.date = dateString;
    }

    setSaving(true);
    try {
      const response = await fetch(editRecord ? `/api/attendance/daily/${editRecord.id}` : "/api/attendance/daily", {
        method: editRecord ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());

      setShowCreate(false);
      setEditRecord(null);
      resetFormState();
      toast.success(editRecord ? "Record updated" : "Attendance marked", "Daily attendance is now synced.");
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      console.error(saveError);
      toast.error("Save failed", "Avaria could not save this attendance record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteRecord) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/attendance/daily/${deleteRecord.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
      setDeleteRecord(null);
      toast.success("Record deleted", "The attendance record has been removed.");
      setRefreshKey((current) => current + 1);
    } catch (deleteError) {
      console.error(deleteError);
      toast.error("Delete failed", "Avaria could not delete this attendance record.");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    try {
      const payload = records.map((record) => ({
        trainee: record.trainee.traineeName,
        company: record.trainee.company,
        batch: record.batch.batchName,
        date: new Date(record.date).toISOString().slice(0, 10),
        status: record.status,
        arrivalTime: record.arrivalTime,
        departureTime: record.departureTime,
        wasLate: record.wasLate,
        minutesLate: record.minutesLate,
        absenceReason: record.absenceReason,
      }));

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `daily-attendance-${selectedDate}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error(exportError);
      toast.error("Export failed", "Avaria could not prepare the daily attendance export.");
    }
  }

  const stats = {
    total: records.length,
    present: records.filter((record) => record.status === "Present").length,
    absent: records.filter((record) => record.status === "Absent").length,
    late: records.filter((record) => record.wasLate === true).length,
    exceptions: records.filter((record) => record.status !== "Present").length,
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />

        <main className="relative flex-1 overflow-y-auto px-4 pb-16 pt-8 sm:px-6 xl:px-8">
          <div className="mx-auto flex max-w-[1540px] flex-col gap-6">
            <section className="hero-panel">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <SectionTitle
                  eyebrow="Attendance operations"
                  title="Daily Attendance"
                  description="Monitor day-level attendance signals, isolate risk patterns by cohort, and update records without leaving the operational board."
                />

                <div className="flex flex-wrap gap-3">
                  <MetricChip label="Records loaded" value={stats.total} />
                  <MetricChip label="Present" value={stats.present} tone="mint" />
                  <MetricChip label="Absent" value={stats.absent} tone="rose" />
                  <MetricChip label="Late flags" value={stats.late} tone="amber" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_0.8fr]">
                <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Control strip</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">Set the operating date, filter the roster, export the visible records, or mark a new entry.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export view
                      </Button>
                      <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Mark attendance
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search trainee or company"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-2xl border border-white/8 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[var(--text-subtle)] focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                      />
                    </div>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as "" | AttendanceStatus)}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                    >
                      <option value="">All statuses</option>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Tour Day">Tour Day</option>
                      <option value="Off Day">Off Day</option>
                    </select>

                    <select
                      value={batchFilter}
                      onChange={(event) => setBatchFilter(event.target.value)}
                      className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                    >
                      <option value="">All batches</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Card hover={false} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Live signal</p>
                      <p className="mt-2 text-xl font-semibold text-white">Daily exception board</p>
                    </div>
                    <CalendarCheck className="h-5 w-5 text-[var(--signal-aqua)]" />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.44)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Operating date</p>
                      <p className="mt-2 text-2xl font-bold text-white">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{stats.exceptions} non-present signals in the loaded set</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Batch filter</p>
                        <p className="mt-2 text-sm font-medium text-white">{batchFilter ? batches.find((batch) => batch.id === batchFilter)?.batchName || "Filtered" : "All cohorts"}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Status filter</p>
                        <p className="mt-2 text-sm font-medium text-white">{statusFilter || "All statuses"}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {loading ? (
              <TableSkeleton rows={6} />
            ) : error ? (
              <Card hover={false}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--signal-rose)]">Load failure</p>
                    <p className="mt-2 text-lg font-semibold text-white">Avaria could not read the daily attendance ledger.</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
                  </div>
                  <Button variant="secondary" onClick={() => setRefreshKey((current) => current + 1)}>
                    Retry load
                  </Button>
                </div>
              </Card>
            ) : records.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="h-8 w-8" />}
                title="No attendance records found"
                description="Change the active date or filters, or create the first daily record for this cohort window."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Mark attendance
                  </Button>
                }
              />
            ) : (
              <Card hover={false} className="overflow-hidden p-0">
                <div className="gradient-line opacity-70" />

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead>
                      <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        <th className="px-6 py-4 font-medium">Trainee</th>
                        <th className="px-4 py-4 font-medium">Batch</th>
                        <th className="px-4 py-4 font-medium">Arrival</th>
                        <th className="px-4 py-4 font-medium">Departure</th>
                        <th className="px-4 py-4 font-medium">Status</th>
                        <th className="px-4 py-4 font-medium">Late flag</th>
                        <th className="px-4 py-4 font-medium">Delay</th>
                        <th className="px-6 py-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      <AnimatePresence initial={false}>
                        {records.map((record) => {
                          const tone = statusTone[record.status];
                          const StatusIcon = tone.icon;

                          return (
                            <motion.tr
                              key={record.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="border-b border-white/6 transition-colors hover:bg-white/[0.03]"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={record.trainee.traineeName} size="sm" />
                                  <div>
                                    <p className="font-medium text-white">{record.trainee.traineeName}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{record.trainee.company}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{record.batch.batchName}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                  <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
                                  {formatTime(record.arrivalTime ? new Date(record.arrivalTime) : null)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                  <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
                                  {formatTime(record.departureTime ? new Date(record.departureTime) : null)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <Badge variant={tone.variant} className="gap-1.5 normal-case tracking-[0.08em]">
                                  <StatusIcon className="h-3 w-3" />
                                  {record.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {record.wasLate ? (
                                  <span className="inline-flex items-center gap-1 text-[var(--signal-amber)]">
                                    <AlertCircle className="h-4 w-4" />
                                    Late
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-subtle)]">On time</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                                {typeof record.minutesLate === "number" && record.minutesLate > 0 ? `+${record.minutesLate} min` : "-"}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => openEdit(record)}
                                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-[var(--text-secondary)] transition hover:text-white"
                                    aria-label={`Edit ${record.trainee.traineeName}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteRecord(record)}
                                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-[var(--text-secondary)] transition hover:text-[var(--signal-rose)]"
                                    aria-label={`Delete ${record.trainee.traineeName}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      <Modal
        open={showCreate || Boolean(editRecord)}
        onClose={() => {
          setShowCreate(false);
          setEditRecord(null);
          resetFormState();
        }}
        title={editRecord ? "Edit attendance" : "Mark attendance"}
        description={editRecord ? "Update the selected daily record without leaving the operations flow." : "Create a new daily attendance record for a trainee."}
      >
        <div className="space-y-4">
          {!editRecord ? (
            <>
              <FormField label="Batch" required error={formErrors.batchId}>
                <ModalSelect
                  value={form.batchId}
                  onChange={(event) => setForm({ ...form, batchId: event.target.value, traineeId: "" })}
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchName}
                    </option>
                  ))}
                </ModalSelect>
              </FormField>

              <FormField label="Trainee" required error={formErrors.traineeId}>
                <ModalSelect
                  value={form.traineeId}
                  onChange={(event) => setForm({ ...form, traineeId: event.target.value })}
                >
                  <option value="">Select trainee</option>
                  {filteredTrainees.map((trainee) => (
                    <option key={trainee.id} value={trainee.id}>
                      {trainee.name}
                    </option>
                  ))}
                </ModalSelect>
              </FormField>

              <FormField label="Date" required error={formErrors.date}>
                <ModalInput
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </FormField>
            </>
          ) : null}

          <FormField label="Status" required>
            <ModalSelect
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as AttendanceStatus })}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Tour Day">Tour Day</option>
              <option value="Off Day">Off Day</option>
            </ModalSelect>
          </FormField>

          {form.status === "Absent" ? (
            <FormField label="Absence reason" error={formErrors.absenceReason}>
              <ModalInput
                value={form.absenceReason}
                onChange={(event) => setForm({ ...form, absenceReason: event.target.value })}
                placeholder="Why is the trainee absent?"
              />
            </FormField>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Arrival time">
              <ModalInput
                type="time"
                value={form.arrivalTime}
                onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })}
              />
            </FormField>

            <FormField label="Departure time">
              <ModalInput
                type="time"
                value={form.departureTime}
                onChange={(event) => setForm({ ...form, departureTime: event.target.value })}
              />
            </FormField>
          </div>
        </div>

        <ModalFooter
          onCancel={() => {
            setShowCreate(false);
            setEditRecord(null);
            resetFormState();
          }}
          onSubmit={handleSave}
          submitLabel={editRecord ? "Update record" : "Save record"}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteRecord)}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete attendance record"
        message={`Delete attendance for "${deleteRecord?.trainee.traineeName}" on ${deleteRecord ? new Date(deleteRecord.date).toLocaleDateString() : ""}?`}
        confirmLabel="Delete record"
        loading={deleting}
      />
    </div>
  );
}