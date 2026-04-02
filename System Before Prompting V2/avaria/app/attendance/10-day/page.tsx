﻿"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Sparkles,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Button, Avatar, CompletionRing, EmptyState, CardSkeleton, Breadcrumb } from "@/components/ui";
import {
  Modal,
  FormField,
  ModalInput,
  ModalSelect,
  ModalFooter,
  ConfirmDialog,
} from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatDateRange } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";
import { ChecklistStatus } from "@/types";

const statusColors: Record<ChecklistStatus, string> = {
  "Not Started": "bg-[#57534e]/10 text-[#78716c]",
  "In Progress": "bg-amber-500/15 text-amber-300",
  Complete: "bg-emerald-500/15 text-emerald-300",
};

/* â”€â”€â”€ types â”€â”€â”€ */
interface TenDayRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  completionPercent: number | null;
  checklistStatus: ChecklistStatus | null;
  attendanceAIReport: string | null;
  presentCount: number | null;
  absentCount: number | null;
  lateCount: number | null;
  days: boolean[] | null;
  attendanceEligible: boolean;
  trainee: { id: string; traineeName: string; company: string };
  batch: { id: string; batchName: string };
}

interface BatchOption { id: string; batchName: string }
interface TraineeOption { id: string; name: string; batchId: string }

const emptyForm = {
  traineeId: "",
  batchId: "",
  periodStart: "",
  periodEnd: "",
  days: Array.from({ length: 10 }, () => false),
};

export default function TenDayAttendancePage() {
  /* â”€â”€â”€ list state â”€â”€â”€ */
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"" | ChecklistStatus>("");
  const [batchFilter, setBatchFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [records, setRecords] = React.useState<TenDayRecord[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const PAGE_SIZE = 25;

  /* â”€â”€â”€ CRUD state â”€â”€â”€ */
  const [showCreate, setShowCreate] = React.useState(false);
  const [editRecord, setEditRecord] = React.useState<TenDayRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = React.useState<TenDayRecord | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const toast = useToast();

  /* â”€â”€â”€ dropdowns state â”€â”€â”€ */
  const [batches, setBatches] = React.useState<BatchOption[]>([]);
  const [trainees, setTrainees] = React.useState<TraineeOption[]>([]);

  // Reset to page 1 when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { setPage(1); }, [search, statusFilter, batchFilter]);

  /* â”€â”€â”€ fetch list â”€â”€â”€ */
  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (statusFilter) qs.set("status", statusFilter);
    if (batchFilter) qs.set("batchId", batchFilter);
    qs.set("page", String(page));
    qs.set("pageSize", String(PAGE_SIZE));

    fetch(`/api/attendance/10-day?${qs.toString()}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { records: TenDayRecord[]; total: number; totalPages: number }) => {
        setRecords(data.records || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load 10-day attendance");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [search, statusFilter, batchFilter, page, refreshKey]);

  /* â”€â”€â”€ fetch dropdowns â”€â”€â”€ */
  React.useEffect(() => {
    fetch("/api/batches?search=")
      .then((r) => r.json())
      .then((d) => setBatches((d.batches || []).map((b: BatchOption) => ({ id: b.id, batchName: b.batchName }))));
    fetch("/api/trainees?pageSize=2000")
      .then((r) => r.json())
      .then((d) => setTrainees((d.trainees || []).map((t: { id: string; name: string; batchId: string }) => ({ id: t.id, name: t.name, batchId: t.batchId }))));
  }, []);

  const filteredTrainees = form.batchId
    ? trainees.filter((t) => t.batchId === form.batchId)
    : trainees;

  /* â”€â”€â”€ helpers â”€â”€â”€ */
  const openCreate = () => {
    setForm({ ...emptyForm, days: Array.from({ length: 10 }, () => false) });
    setShowCreate(true);
  };

  const openEdit = (r: TenDayRecord) => {
    setForm({
      traineeId: r.trainee.id,
      batchId: r.batch.id,
      periodStart: new Date(r.periodStart).toISOString().slice(0, 10),
      periodEnd: new Date(r.periodEnd).toISOString().slice(0, 10),
      days: r.days ? [...r.days] : Array.from({ length: 10 }, () => false),
    });
    setEditRecord(r);
  };

  const toggleDay = (idx: number) => {
    const newDays = [...form.days];
    newDays[idx] = !newDays[idx];
    setForm({ ...form, days: newDays });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = !!editRecord;
      const url = isEdit ? `/api/attendance/10-day/${editRecord!.id}` : "/api/attendance/10-day";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        days: form.days,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
      };

      if (!isEdit) {
        payload.traineeId = form.traineeId;
        payload.batchId = form.batchId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      setShowCreate(false);
      setEditRecord(null);
      toast.success(isEdit ? "Record updated" : "Record created", "10-day attendance record saved successfully.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save", "Could not save 10-day record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attendance/10-day/${deleteRecord.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setDeleteRecord(null);
      toast.success("Record deleted", "10-day record has been deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Delete failed", "Could not delete 10-day record.");
    } finally {
      setDeleting(false);
    }
  };

  const [exporting, setExporting] = React.useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      if (batchFilter) qs.set('batchId', batchFilter);
      if (search.trim()) qs.set('search', search.trim());
      qs.set('pageSize', '5000');
      const res = await fetch(`/api/attendance/10-day?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { records: TenDayRecord[] } = await res.json();
      const rows = data.records;
      const header = ['Trainee','Company','Batch','Period Start','Period End','Present','Absent','Late','Completion%','Status'];
      const csv = [header, ...rows.map(r => [
        r.trainee.traineeName,
        r.trainee.company,
        r.batch.batchName,
        new Date(r.periodStart).toLocaleDateString(),
        new Date(r.periodEnd).toLocaleDateString(),
        r.presentCount ?? 0,
        r.absentCount ?? 0,
        r.lateCount ?? 0,
        r.completionPercent ?? 0,
        r.checklistStatus ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`))
      ].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `10day-attendance-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export ready', `${rows.length} record${rows.length !== 1 ? 's' : ''} exported.`);
    } catch (e) {
      console.error(e);
      toast.error('Export failed', 'Could not export 10-day records.');
    } finally {
      setExporting(false);
    }
  };

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
                <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Attendance" }, { label: "10-Day Summary" }]} />
                <h1 className="mt-2 text-2xl font-semibold text-[#fafaf9]">10-Day Attendance Summary</h1>
                <p className="text-sm text-[#57534e]">Track attendance completion over 10-day periods</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleExport} disabled={exporting}>
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting…' : 'Export CSV'}
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Record
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#44403c]" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-sm rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] py-2 pl-10 pr-4 text-sm text-[#ccd5e4] placeholder:text-[#44403c] focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "" | ChecklistStatus)}
                className="rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-4 py-2 text-sm text-[#ccd5e4] focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-4 py-2 text-sm text-[#ccd5e4] focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.batchName}</option>
                ))}
              </select>
            </div>

            {/* Count row */}
            {!loading && totalCount > 0 && (
              <div className="flex items-center justify-between text-sm text-[#57534e]">
                <span>{totalCount} record{totalCount !== 1 ? "s" : ""} found</span>
                {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
              </div>
            )}

            {/* 10-Day Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} lines={4} />
                ))
              ) : error ? (
                <div className="glass-card col-span-full p-6 text-rose-300">{error}</div>
              ) : records.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    icon={<Calendar className="h-8 w-8" />}
                    title="No records found"
                    description="No 10-day attendance records match your filters."
                  />
                </div>
              ) : (
                records.map((record) => (
                  <TenDayCard
                    key={record.id}
                    record={record}
                    onEdit={() => openEdit(record)}
                    onDelete={() => setDeleteRecord(record)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-xl border border-[#a8a29e]/8 px-4 py-2 text-sm text-[#78716c] transition hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="px-3 text-sm text-[#a8a29e]">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="rounded-xl border border-[#a8a29e]/8 px-4 py-2 text-sm text-[#78716c] transition hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* â”€â”€â”€ CREATE / EDIT MODAL â”€â”€â”€ */}
      <Modal
        open={showCreate || !!editRecord}
        onClose={() => { setShowCreate(false); setEditRecord(null); }}
        title={editRecord ? "Edit 10-Day Record" : "New 10-Day Record"}
        description={editRecord ? "Update attendance checklist" : "Create a new attendance summary for a trainee"}
      >
        <div className="space-y-4">
          {!editRecord && (
            <>
              <FormField label="Batch" required>
                <ModalSelect
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value, traineeId: "" })}
                >
                  <option value="">Select batch…</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.batchName}</option>
                  ))}
                </ModalSelect>
              </FormField>
              <FormField label="Trainee" required>
                <ModalSelect
                  value={form.traineeId}
                  onChange={(e) => setForm({ ...form, traineeId: e.target.value })}
                >
                  <option value="">Select trainee…</option>
                  {filteredTrainees.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </ModalSelect>
              </FormField>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Period Start" required>
              <ModalInput
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              />
            </FormField>
            <FormField label="Period End" required>
              <ModalInput
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Daily Attendance (click to toggle)">
            <div className="grid grid-cols-10 gap-2">
              {form.days.map((checked, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-all",
                    checked
                      ? "bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40"
                      : "bg-[#231f1d]/40 text-[#44403c] hover:bg-[#231f1d] hover:text-[#78716c]"
                  )}
                >
                  {checked ? <CheckCircle2 className="h-4 w-4" /> : <span>{i + 1}</span>}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#57534e]">
              Completion: {Math.round((form.days.filter(Boolean).length / 10) * 100)}%
            </p>
          </FormField>
        </div>
        <ModalFooter
          onCancel={() => { setShowCreate(false); setEditRecord(null); }}
          onSubmit={handleSave}
          submitLabel={editRecord ? "Update" : "Create"}
          loading={saving}
        />
      </Modal>

      {/* â”€â”€â”€ DELETE CONFIRM â”€â”€â”€ */}
      <ConfirmDialog
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete 10-Day Record"
        message={`Delete the 10-day record for "${deleteRecord?.trainee.traineeName}"?`}
        loading={deleting}
      />
    </div>
  );
}

/* â”€â”€â”€ TEN DAY CARD â”€â”€â”€ */
function TenDayCard({
  record,
  onEdit,
  onDelete,
}: {
  record: TenDayRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = record.days ?? Array.from({ length: 10 }, () => false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card relative p-6"
    >
      {/* Actions menu */}
      <div className="absolute right-4 top-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-1.5 text-[#57534e] transition hover:bg-[#231f1d] hover:text-[#d6d3d1]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] py-1 shadow-xl">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#d6d3d1] hover:bg-[#231f1d]"
              onClick={() => { setMenuOpen(false); onEdit(); }}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-[#231f1d]"
              onClick={() => { setMenuOpen(false); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between pr-10">
        <div className="flex items-center gap-4">
          <Avatar name={record.trainee.traineeName} size="lg" />
          <div>
            <h3 className="font-semibold text-[#fafaf9]">{record.trainee.traineeName}</h3>
            <p className="text-sm text-[#57534e]">{record.trainee.company}</p>
            <p className="mt-1 text-xs text-[#44403c]">
              {record.batch.batchName} • {formatDateRange(new Date(record.periodStart), new Date(record.periodEnd))}
            </p>
          </div>
        </div>
        <CompletionRing value={record.completionPercent ?? 0} size={56} strokeWidth={6} />
      </div>

      {/* 10-Day Checkboxes */}
      <div className="mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#57534e]">Daily Attendance</p>
        {record.attendanceEligible ? (
          <div className="grid grid-cols-10 gap-2">
            {days.map((checked, i) => (
              <div
                key={i}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  checked ? "bg-emerald-500/20 text-emerald-300" : "bg-[#231f1d]/40 text-[#44403c]"
                )}
              >
                {checked ? <CheckCircle2 className="h-4 w-4" /> : <span>{i + 1}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4 text-sm text-[#57534e]">
            Attendance tracking is not applicable for this batch.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-[#1c1917] p-4">
        <div className="text-center">
          <p className="text-xl font-semibold text-emerald-300">{record.presentCount ?? "—"}</p>
          <p className="text-xs text-[#57534e]">Present</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-rose-300">{record.absentCount ?? "—"}</p>
          <p className="text-xs text-[#57534e]">Absent</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-amber-300">{record.lateCount ?? "—"}</p>
          <p className="text-xs text-[#57534e]">Late</p>
        </div>
      </div>

      {/* Status */}
      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            record.checklistStatus ? statusColors[record.checklistStatus] : "bg-[#57534e]/10 text-[#78716c]"
          )}
        >
          {record.checklistStatus ?? "N/A"}
        </span>
      </div>

      {record.attendanceAIReport && (
        <div className="mt-4 rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
          <p className="text-xs text-[#57534e]">
            <Sparkles className="mr-1 inline h-3 w-3 text-amber-400" />AI Insight
          </p>
          <p className="mt-1 text-sm text-[#78716c]">{record.attendanceAIReport}</p>
        </div>
      )}
    </motion.div>
  );
}
