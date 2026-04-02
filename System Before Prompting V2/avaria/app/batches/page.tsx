"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Header, Sidebar } from "@/components/layout";
import { Badge, Button, Card, CardSkeleton, EmptyState, ProgressBar } from "@/components/ui";
import { ConfirmDialog, FormField, Modal, ModalFooter, ModalInput, ModalSelect } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { calculateBatchProgress, formatDateRange } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";

interface Batch {
  id: string;
  batchName: string;
  status: "Planning" | "Active" | "Completed";
  dateRange: { start: string | Date; end: string | Date };
  traineeCount: number;
  presentTotal10Day: number;
  absentTotal10Day: number;
  lateTotal10Day: number;
  avgCompletion10Day: number;
}

const statusVariant = {
  Planning: "warning",
  Active: "success",
  Completed: "info",
} as const;

const emptyForm = {
  batchName: "",
  status: "Planning" as string,
  startDate: "",
  endDate: "",
};

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

export default function BatchesPage() {
  const [view, setView] = React.useState<"grid" | "kanban">("grid");
  const [search, setSearch] = React.useState("");
  const [searchDebounced, setSearchDebounced] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [batches, setBatches] = React.useState<Batch[]>([]);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editBatch, setEditBatch] = React.useState<Batch | null>(null);
  const [deleteBatch, setDeleteBatch] = React.useState<Batch | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchBatches = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/batches?search=${encodeURIComponent(searchDebounced)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setBatches(payload.batches || []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced]);

  React.useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setShowCreate(true);
  }

  function openEdit(batch: Batch) {
    setFormErrors({});
    setForm({
      batchName: batch.batchName,
      status: batch.status,
      startDate: new Date(batch.dateRange.start).toISOString().split("T")[0],
      endDate: new Date(batch.dateRange.end).toISOString().split("T")[0],
    });
    setEditBatch(batch);
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.batchName.trim()) nextErrors.batchName = "Batch name is required";
    if (!form.startDate) nextErrors.startDate = "Start date is required";
    if (!form.endDate) nextErrors.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      nextErrors.endDate = "End date must be after start date";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setSaving(true);
    const batchLabel = form.batchName;
    try {
      const isEdit = Boolean(editBatch);
      const response = await fetch(isEdit ? `/api/batches/${editBatch?.id}` : "/api/batches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setShowCreate(false);
      setEditBatch(null);
      toast.success(isEdit ? "Batch updated" : "Batch created", `${batchLabel} is now synced.`);
      fetchBatches();
    } catch (saveError) {
      console.error(saveError);
      toast.error("Save failed", "Avaria could not persist this batch.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteBatch) return;

    const batchLabel = deleteBatch.batchName;
    setDeleting(true);
    try {
      const response = await fetch(`/api/batches/${deleteBatch.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDeleteBatch(null);
      toast.success("Batch deleted", `${batchLabel} has been removed.`);
      fetchBatches();
    } catch (deleteError) {
      console.error(deleteError);
      toast.error("Delete failed", "Avaria could not delete this batch.");
    } finally {
      setDeleting(false);
    }
  }

  const planningBatches = batches.filter((batch) => batch.status === "Planning");
  const activeBatches = batches.filter((batch) => batch.status === "Active");
  const completedBatches = batches.filter((batch) => batch.status === "Completed");
  const activeTrainees = batches.reduce((sum, batch) => sum + batch.traineeCount, 0);
  const averageCompletion =
    batches.length > 0 ? Math.round(batches.reduce((sum, batch) => sum + batch.avgCompletion10Day, 0) / batches.length) : 0;

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
                  eyebrow="Academy flow"
                  title="Batches"
                  description="Operate the academy cohort pipeline, monitor throughput, and jump into the batch requiring the next intervention."
                />

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Total batches</p>
                    <p className="mt-2 text-3xl font-bold text-white">{batches.length}</p>
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Trainees</p>
                    <p className="mt-2 text-3xl font-bold text-white">{activeTrainees}</p>
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Avg completion</p>
                    <p className="mt-2 text-3xl font-bold text-white">{averageCompletion}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[280px] flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search batches, cohorts, or date windows"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[var(--text-subtle)] focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] p-1">
                  {(["grid", "kanban"] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setView(option)}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                        view === option ? "bg-white/[0.08] text-white" : "text-[var(--text-secondary)] hover:text-white"
                      )}
                    >
                      {option === "grid" ? "Grid" : "Board"}
                    </button>
                  ))}
                </div>

                <Button onClick={openCreate} size="lg">
                  <Plus className="h-4 w-4" />
                  New batch
                </Button>
              </div>
            </section>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={index} lines={5} />
                ))}
              </div>
            ) : error ? (
              <Card>
                <div className="flex items-center gap-3 text-[var(--signal-rose)]">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                <div className="mt-4">
                  <Button variant="secondary" onClick={fetchBatches}>
                    Retry load
                  </Button>
                </div>
              </Card>
            ) : batches.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-8 w-8" />}
                title="No batches yet"
                description="Create the first training batch to start the academy pipeline."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Create batch
                  </Button>
                }
              />
            ) : view === "grid" ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {batches.map((batch) => (
                  <BatchCard key={batch.id} batch={batch} onEdit={() => openEdit(batch)} onDelete={() => setDeleteBatch(batch)} />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-3">
                <KanbanColumn title="Planning" batches={planningBatches} color="amber" onEdit={openEdit} onDelete={setDeleteBatch} />
                <KanbanColumn title="Active" batches={activeBatches} color="aqua" onEdit={openEdit} onDelete={setDeleteBatch} />
                <KanbanColumn title="Completed" batches={completedBatches} color="mint" onEdit={openEdit} onDelete={setDeleteBatch} />
              </div>
            )}
          </div>
        </main>
      </div>

      <Modal
        open={showCreate || Boolean(editBatch)}
        onClose={() => {
          setShowCreate(false);
          setEditBatch(null);
        }}
        title={editBatch ? "Edit batch" : "Create batch"}
        description={editBatch ? "Update this cohort without leaving the operations flow." : "Create a new cohort and place it into the academy pipeline."}
      >
        <div className="space-y-4">
          <FormField label="Batch name" required error={formErrors.batchName}>
            <ModalInput value={form.batchName} onChange={(event) => setForm({ ...form, batchName: event.target.value })} placeholder="Batch 15" />
          </FormField>

          <FormField label="Status" required>
            <ModalSelect value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </ModalSelect>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" required error={formErrors.startDate}>
              <ModalInput type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </FormField>
            <FormField label="End date" required error={formErrors.endDate}>
              <ModalInput type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            </FormField>
          </div>
        </div>

        <ModalFooter
          onCancel={() => {
            setShowCreate(false);
            setEditBatch(null);
          }}
          onSubmit={handleSave}
          submitLabel={editBatch ? "Update batch" : "Create batch"}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteBatch)}
        onClose={() => setDeleteBatch(null)}
        onConfirm={handleDelete}
        title="Delete batch"
        message={`Delete ${deleteBatch?.batchName ?? "this batch"}? Associated trainees, attendance, and assessments will also be removed.`}
        confirmLabel="Delete batch"
        loading={deleting}
      />
    </div>
  );
}

function BatchCard({ batch, onEdit, onDelete }: { batch: Batch; onEdit: () => void; onDelete: () => void }) {
  const progress = calculateBatchProgress(new Date(batch.dateRange.start), new Date(batch.dateRange.end));
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <Card className="group relative overflow-hidden">
      <div className="absolute right-5 top-5 z-10">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <>
              <button className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-label="Close batch menu" />
              <div className="absolute right-0 top-12 z-20 w-40 rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.96)] p-1.5 shadow-2xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white transition-colors hover:bg-white/[0.06]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--signal-rose)] transition-colors hover:bg-[rgba(255,124,149,0.08)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 pr-14">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Cohort</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{batch.batchName}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Calendar className="h-4 w-4 text-[var(--signal-aqua)]" />
              {formatDateRange(new Date(batch.dateRange.start), new Date(batch.dateRange.end))}
            </p>
          </div>
          <Badge variant={statusVariant[batch.status]}>{batch.status}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <Metric value={batch.traineeCount} label="Trainees" tone="text-white" />
          <Metric value={`${batch.avgCompletion10Day}%`} label="Completion" tone="text-[var(--signal-mint)]" />
          <Metric value={batch.lateTotal10Day} label="Late" tone="text-[var(--signal-amber)]" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Schedule progress</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar value={progress} showLabel={false} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(3, batch.traineeCount) }).map((_, index) => (
              <div key={index} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[rgba(8,12,22,0.95)] bg-[linear-gradient(135deg,#9b8cff,#42d3ff)] text-xs font-semibold text-[#041019]">
                T{index + 1}
              </div>
            ))}
            {batch.traineeCount > 3 ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[rgba(8,12,22,0.95)] bg-white/[0.08] text-xs text-[var(--text-secondary)]">
                +{batch.traineeCount - 3}
              </div>
            ) : null}
          </div>
          <Link href={`/batches/${batch.id}`}>
            <Button variant="ghost" size="sm">
              View details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Metric({ value, label, tone }: { value: React.ReactNode; label: string; tone: string }) {
  return (
    <div className="text-center">
      <p className={cn("text-2xl font-semibold", tone)}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function KanbanColumn({
  title,
  batches,
  color,
  onEdit,
  onDelete,
}: {
  title: string;
  batches: Batch[];
  color: "amber" | "aqua" | "mint";
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
}) {
  const badgeTone = {
    amber: "border-[rgba(245,201,106,0.22)] bg-[rgba(245,201,106,0.1)] text-[var(--signal-amber)]",
    aqua: "border-[rgba(66,211,255,0.22)] bg-[rgba(66,211,255,0.1)] text-[var(--signal-aqua)]",
    mint: "border-[rgba(109,229,194,0.22)] bg-[rgba(109,229,194,0.1)] text-[var(--signal-mint)]",
  }[color];

  return (
    <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-[var(--text-muted)]">Pipeline stage</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", badgeTone)}>{batches.length}</span>
      </div>

      <div className="space-y-3">
        {batches.map((batch) => (
          <div key={batch.id} className="group relative">
            <Link href={`/batches/${batch.id}`} className="block">
              <motion.div layoutId={batch.id} className="rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.7)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.05)]">
                <h4 className="font-medium text-white">{batch.batchName}</h4>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {formatDateRange(new Date(batch.dateRange.start), new Date(batch.dateRange.end))}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {batch.traineeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {batch.avgCompletion10Day}%
                  </span>
                </div>
              </motion.div>
            </Link>

            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(event) => {
                  event.preventDefault();
                  onEdit(batch);
                }}
                className="rounded-xl border border-white/8 bg-white/[0.04] p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(event) => {
                  event.preventDefault();
                  onDelete(batch);
                }}
                className="rounded-xl border border-white/8 bg-white/[0.04] p-2 text-[var(--text-secondary)] transition-colors hover:bg-[rgba(255,124,149,0.12)] hover:text-[var(--signal-rose)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
