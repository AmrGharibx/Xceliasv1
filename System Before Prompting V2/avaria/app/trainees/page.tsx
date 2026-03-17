"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Header, Sidebar } from "@/components/layout";
import { Avatar, Badge, Button, Card, CardSkeleton, CompletionRing, EmptyState } from "@/components/ui";
import { ConfirmDialog, FormField, Modal, ModalFooter, ModalInput, ModalSelect } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface Trainee {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  company: string;
  batchName: string | null;
  batchId: string | null;
  attendanceEligible: boolean;
  attendanceCount: number | null;
  assessmentCount: number;
}

interface TraineesResponse {
  trainees: Trainee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  companies: string[];
}

interface BatchOption {
  id: string;
  batchName: string;
  status: string;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  batchId: "",
};

const emptyBatchForm = {
  batchName: "",
  status: "Active",
  startDate: "",
  endDate: "",
};

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function MetricChip({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "mint" | "aqua" | "violet" }) {
  const tones = {
    default: "text-white",
    mint: "text-[var(--signal-mint)]",
    aqua: "text-[var(--signal-aqua)]",
    violet: "text-[var(--signal-violet)]",
  } as const;

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", tones[tone])}>{value}</p>
    </div>
  );
}

export default function TraineesPage() {
  const [data, setData] = React.useState<TraineesResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [selectedCompany, setSelectedCompany] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editTrainee, setEditTrainee] = React.useState<Trainee | null>(null);
  const [deleteTrainee, setDeleteTrainee] = React.useState<Trainee | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [batches, setBatches] = React.useState<BatchOption[]>([]);
  const [showInlineBatch, setShowInlineBatch] = React.useState(false);
  const [batchForm, setBatchForm] = React.useState(emptyBatchForm);
  const [creatingBatch, setCreatingBatch] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedCompany]);

  const fetchTrainees = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (deferredSearch) params.set("search", deferredSearch);
      if (selectedCompany) params.set("company", selectedCompany);

      const response = await fetch(`/api/trainees?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setData(await response.json());
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load trainees");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, selectedCompany]);

  const fetchBatches = React.useCallback(async () => {
    try {
      const response = await fetch("/api/batches");
      if (!response.ok) return;
      const payload = await response.json();
      setBatches(
        (payload.batches || []).map((batch: { id: string; batchName: string; status: string }) => ({
          id: batch.id,
          batchName: batch.batchName,
          status: batch.status,
        }))
      );
    } catch {
      // Keep the form usable even if the helper batch feed is unavailable.
    }
  }, []);

  React.useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  React.useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  function resetFormState() {
    setForm(emptyForm);
    setFormErrors({});
    setShowInlineBatch(false);
    setBatchForm(emptyBatchForm);
  }

  function openCreate() {
    resetFormState();
    setShowCreate(true);
  }

  function openEdit(trainee: Trainee) {
    setFormErrors({});
    setShowInlineBatch(false);
    setForm({
      name: trainee.name,
      email: trainee.email || "",
      phone: trainee.phone || "",
      company: trainee.company,
      batchId: trainee.batchId || "",
    });
    setEditTrainee(trainee);
  }

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Full name is required";
    if (!form.company.trim()) nextErrors.company = "Company is required";
    if (!form.batchId) nextErrors.batchId = "Batch assignment is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address";

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      batchId: form.batchId,
    };

    const traineeLabel = payload.name;
    setSaving(true);
    try {
      const isEdit = Boolean(editTrainee);
      const response = await fetch(isEdit ? `/api/trainees/${editTrainee?.id}` : "/api/trainees", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setShowCreate(false);
      setEditTrainee(null);
      resetFormState();
      toast.success(isEdit ? "Trainee updated" : "Trainee created", `${traineeLabel} is now synced.`);
      fetchTrainees();
    } catch (saveError) {
      console.error(saveError);
      toast.error("Save failed", "Avaria could not persist this trainee.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTrainee) return;

    const traineeLabel = deleteTrainee.name;
    setDeleting(true);
    try {
      const response = await fetch(`/api/trainees/${deleteTrainee.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDeleteTrainee(null);
      toast.success("Trainee deleted", `${traineeLabel} has been removed from the roster.`);
      fetchTrainees();
    } catch (deleteError) {
      console.error(deleteError);
      toast.error("Delete failed", "Avaria could not delete this trainee.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreateBatch() {
    if (!batchForm.batchName || !batchForm.startDate || !batchForm.endDate) return;

    setCreatingBatch(true);
    try {
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const created = await response.json();
      const batchId = created.id || created.batch?.id || "";
      await fetchBatches();
      setForm((current) => ({ ...current, batchId }));
      setShowInlineBatch(false);
      setBatchForm(emptyBatchForm);
      toast.success("Batch created", "The new batch is ready and selected for this trainee.");
    } catch (createError) {
      console.error(createError);
      toast.error("Batch creation failed", "Avaria could not create the helper batch.");
    } finally {
      setCreatingBatch(false);
    }
  }

  async function handleExport() {
    try {
      const response = await fetch("/api/export?type=trainees");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "trainees-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error(exportError);
      toast.error("Export failed", "Avaria could not prepare the trainees export.");
    }
  }

  const trainees = data?.trainees || [];
  const eligibleCount = trainees.filter((trainee) => trainee.attendanceEligible).length;
  const assessmentCount = trainees.reduce((sum, trainee) => sum + trainee.assessmentCount, 0);
  const assignedCount = trainees.filter((trainee) => trainee.batchName).length;

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
                  eyebrow="Roster intelligence"
                  title="Trainees"
                  description="Run the academy roster from one surface, track who is attached to active cohorts, and jump directly into the trainee record that needs the next intervention."
                />

                <div className="flex flex-wrap gap-3">
                  <MetricChip label="Total roster" value={data?.total ?? "--"} />
                  <MetricChip label="Visible now" value={trainees.length} tone="aqua" />
                  <MetricChip label="Attendance eligible" value={eligibleCount} tone="mint" />
                  <MetricChip label="Assessments in view" value={assessmentCount} tone="violet" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
                <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Control strip</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">Filter the roster, export the current state, or add a trainee without breaking flow.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={handleExport}>
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button onClick={openCreate}>
                        <UserPlus className="h-4 w-4" />
                        Add trainee
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[260px] flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search trainee, email, or company"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-2xl border border-white/8 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-[var(--text-subtle)] focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                      />
                    </div>

                    <select
                      value={selectedCompany}
                      onChange={(event) => setSelectedCompany(event.target.value)}
                      className="min-w-[220px] rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-[rgba(66,211,255,0.3)] focus:outline-none focus:ring-4 focus:ring-[rgba(66,211,255,0.1)]"
                    >
                      <option value="">All companies</option>
                      {data?.companies.map((company) => (
                        <option key={company} value={company}>
                          {company}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Card hover={false} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Signal summary</p>
                      <p className="mt-2 text-xl font-semibold text-white">Roster composition</p>
                    </div>
                    <GraduationCap className="h-5 w-5 text-[var(--signal-aqua)]" />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.44)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-[var(--text-secondary)]">Assigned to batches</p>
                          <p className="mt-1 text-2xl font-bold text-white">{assignedCount}</p>
                        </div>
                        <Badge variant="info">Live page sample</Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Companies represented</p>
                        <p className="mt-2 text-2xl font-bold text-white">{data?.companies.length ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Page size</p>
                        <p className="mt-2 text-2xl font-bold text-white">{data?.pageSize ?? 12}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={index} lines={5} />
                ))}
              </div>
            ) : error ? (
              <Card hover={false}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--signal-rose)]">Load failure</p>
                    <p className="mt-2 text-lg font-semibold text-white">Avaria could not read the trainee roster.</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
                  </div>
                  <Button variant="secondary" onClick={fetchTrainees}>
                    Retry load
                  </Button>
                </div>
              </Card>
            ) : trainees.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No trainees found"
                description="Adjust the active filters or create the next trainee profile."
                action={
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add trainee
                  </Button>
                }
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${page}-${deferredSearch}-${selectedCompany}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                >
                  {trainees.map((trainee, index) => (
                    <motion.div
                      key={trainee.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                    >
                      <TraineeCard trainee={trainee} onEdit={() => openEdit(trainee)} onDelete={() => setDeleteTrainee(trainee)} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {data && data.totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] border border-white/8 bg-white/[0.04] px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Pagination</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Page {data.page} of {data.totalPages} across {data.total} trainees
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-[var(--text-secondary)] transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, index) => {
                    let pageNumber: number;
                    if (data.totalPages <= 5) pageNumber = index + 1;
                    else if (page <= 3) pageNumber = index + 1;
                    else if (page >= data.totalPages - 2) pageNumber = data.totalPages - 4 + index;
                    else pageNumber = page - 2 + index;

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-medium transition",
                          page === pageNumber
                            ? "bg-[var(--brand-gradient)] text-[#041019]"
                            : "border border-white/8 bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
                    disabled={page === data.totalPages}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-[var(--text-secondary)] transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <Modal
        open={showCreate || Boolean(editTrainee)}
        onClose={() => {
          setShowCreate(false);
          setEditTrainee(null);
          resetFormState();
        }}
        title={editTrainee ? "Edit trainee" : "Create trainee"}
        description={editTrainee ? "Update this trainee without leaving roster operations." : "Create a trainee profile and assign it to the right batch."}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required error={formErrors.name}>
              <ModalInput
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="John Smith"
              />
            </FormField>

            <FormField label="Email" error={formErrors.email}>
              <ModalInput
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="john@company.com"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Phone">
              <ModalInput
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+20 1X XXX XXXX"
              />
            </FormField>

            <FormField label="Company" required error={formErrors.company}>
              <ModalInput
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                placeholder="Company name"
              />
            </FormField>
          </div>

          <FormField label="Batch" required error={formErrors.batchId}>
            <div className="flex items-center gap-2">
              <ModalSelect
                value={form.batchId}
                onChange={(event) => setForm({ ...form, batchId: event.target.value })}
                className="flex-1"
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchName} ({batch.status})
                  </option>
                ))}
              </ModalSelect>

              <button
                type="button"
                onClick={() => setShowInlineBatch((current) => !current)}
                className="shrink-0 rounded-2xl border border-dashed border-[rgba(66,211,255,0.28)] bg-[rgba(66,211,255,0.07)] px-3 py-2.5 text-[var(--signal-aqua)] transition hover:border-[rgba(66,211,255,0.42)] hover:bg-[rgba(66,211,255,0.12)]"
                title="Create helper batch"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </FormField>

          <AnimatePresence>
            {showInlineBatch ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-[24px] border border-[rgba(66,211,255,0.18)] bg-[rgba(66,211,255,0.06)] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--signal-aqua)]">
                    <GraduationCap className="h-4 w-4" />
                    Quick batch creation
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <FormField label="Batch name" required>
                      <ModalInput
                        value={batchForm.batchName}
                        onChange={(event) => setBatchForm({ ...batchForm, batchName: event.target.value })}
                        placeholder="Batch 15"
                      />
                    </FormField>

                    <FormField label="Status" required>
                      <ModalSelect
                        value={batchForm.status}
                        onChange={(event) => setBatchForm({ ...batchForm, status: event.target.value })}
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </ModalSelect>
                    </FormField>

                    <FormField label="Start date" required>
                      <ModalInput
                        type="date"
                        value={batchForm.startDate}
                        onChange={(event) => setBatchForm({ ...batchForm, startDate: event.target.value })}
                      />
                    </FormField>

                    <FormField label="End date" required>
                      <ModalInput
                        type="date"
                        value={batchForm.endDate}
                        onChange={(event) => setBatchForm({ ...batchForm, endDate: event.target.value })}
                      />
                    </FormField>
                  </div>

                  <div className="mt-4">
                    <Button variant="secondary" onClick={handleCreateBatch} loading={creatingBatch}>
                      {creatingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create and select batch
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <ModalFooter
          onCancel={() => {
            setShowCreate(false);
            setEditTrainee(null);
            resetFormState();
          }}
          onSubmit={handleSave}
          submitLabel={editTrainee ? "Update trainee" : "Create trainee"}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTrainee)}
        onClose={() => setDeleteTrainee(null)}
        onConfirm={handleDelete}
        title="Delete trainee"
        message={`Are you sure you want to delete "${deleteTrainee?.name}"? This also removes linked attendance and assessment records.`}
        confirmLabel="Delete trainee"
        loading={deleting}
      />
    </div>
  );
}

function TraineeCard({
  trainee,
  onEdit,
  onDelete,
}: {
  trainee: Trainee;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const attendanceValue = trainee.attendanceEligible ? trainee.attendanceCount ?? 0 : 0;
  const attendanceRing = trainee.attendanceEligible ? Math.min(100, Math.round((attendanceValue / 50) * 100)) : 0;

  return (
    <Card className="group relative overflow-hidden p-0">
      <div className="gradient-line opacity-70" />

      <div className="absolute right-4 top-4 z-10 flex gap-2 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.72)] p-2 text-[var(--text-secondary)] transition hover:text-white"
          aria-label={`Edit ${trainee.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.72)] p-2 text-[var(--text-secondary)] transition hover:text-[var(--signal-rose)]"
          aria-label={`Delete ${trainee.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Link href={`/trainees/${trainee.id}`} className="block p-6">
        <div className="flex items-start gap-4">
          <Avatar name={trainee.name} size="lg" />

          <div className="min-w-0 flex-1 pr-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-white">{trainee.name}</h3>
                <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{trainee.email || "No email on file"}</p>
              </div>
              <Eye className="mt-1 hidden h-4 w-4 text-[var(--text-muted)] lg:block" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="info" className="gap-1 normal-case tracking-[0.08em]">
                <BriefcaseBusiness className="h-3 w-3" />
                {trainee.company}
              </Badge>
              {trainee.batchName ? (
                <Badge variant="success" className="gap-1 normal-case tracking-[0.08em]">
                  <BookOpen className="h-3 w-3" />
                  {trainee.batchName}
                </Badge>
              ) : (
                <Badge variant="warning" className="normal-case tracking-[0.08em]">
                  Unassigned batch
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Attendance</p>
              <p className="mt-2 text-2xl font-bold text-white">{trainee.attendanceEligible ? attendanceValue : "N/A"}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{trainee.attendanceEligible ? "Recorded sessions" : "Not eligible yet"}</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Assessments</p>
              <p className="mt-2 text-2xl font-bold text-white">{trainee.assessmentCount}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Evaluation entries</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Phone</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{trainee.phone || "Not provided"}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Direct contact</p>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-[24px] border border-white/8 bg-[rgba(8,12,22,0.48)] px-5 py-4">
            <CompletionRing
              value={attendanceRing}
              size={68}
              color={trainee.attendanceEligible ? "text-[var(--signal-mint)]" : "text-[var(--text-subtle)]"}
            />
          </div>
        </div>
      </Link>
    </Card>
  );
}