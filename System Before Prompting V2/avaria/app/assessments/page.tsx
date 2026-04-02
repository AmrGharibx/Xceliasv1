﻿"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Sparkles,
  Star,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Button, Avatar, ProgressBar, Card, EmptyState, CardSkeleton } from "@/components/ui";
import {
  Modal,
  FormField,
  ModalInput,
  ModalSelect,
  ModalFooter,
  ConfirmDialog,
} from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { AssessmentOutcome } from "@/types";

const outcomeColors: Record<AssessmentOutcome, string> = {
  Aced: "bg-emerald-500/15 text-emerald-300",
  Excellent: "bg-green-500/15 text-green-300",
  "Very Good": "bg-lime-500/15 text-lime-300",
  Good: "bg-amber-500/15 text-amber-300",
  "Needs Improvement": "bg-orange-500/15 text-orange-300",
  Failed: "bg-rose-500/15 text-rose-300",
};

/* â”€â”€â”€ types â”€â”€â”€ */
interface AssessmentData {
  id: string;
  assessmentTitle: string;
  company: string;
  mapping: number;
  productKnowledge: number;
  presentability: number;
  softSkills: number;
  attendance: number | null;
  absence: number | null;
  assessmentOutcome: AssessmentOutcome;
  instructorComment: string | null;
  assessmentAIReport: string | null;
  techScorePercent: number;
  softScorePercent: number;
  overallPercent: number;
  trainee: { id: string; traineeName: string; company: string };
  batch: { id: string; batchName: string };
}

interface BatchOption { id: string; batchName: string; status?: string }
interface TraineeOption { id: string; name: string; batchId: string; company: string }

const emptyForm = {
  traineeId: "",
  batchId: "",
  assessmentTitle: "Final",
  productKnowledge: 0,
  mapping: 0,
  presentability: 0,
  softSkills: 0,
  assessmentOutcome: "" as string,
  instructorComment: "",
};

export default function AssessmentsPage() {
  /* â”€â”€â”€ list state â”€â”€â”€ */
  const [search, setSearch] = React.useState("");
  const [outcome, setOutcome] = React.useState<"" | AssessmentOutcome>("");
  const [batchFilter, setBatchFilter] = React.useState("");
  const [companyFilter, setCompanyFilter] = React.useState("");
  const [companies, setCompanies] = React.useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [assessments, setAssessments] = React.useState<AssessmentData[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  /* â”€â”€â”€ CRUD â”€â”€â”€ */
  const [showCreate, setShowCreate] = React.useState(false);
  const [editAssessment, setEditAssessment] = React.useState<AssessmentData | null>(null);
  const [deleteAssessment, setDeleteAssessment] = React.useState<AssessmentData | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const toast = useToast();

  /* â”€â”€â”€ dropdowns â”€â”€â”€ */
  const [batches, setBatches] = React.useState<BatchOption[]>([]);
  const [trainees, setTrainees] = React.useState<TraineeOption[]>([]);

  /* â”€â”€â”€ fetch list â”€â”€â”€ */
  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (outcome) qs.set("outcome", outcome);
    if (batchFilter) qs.set("batchId", batchFilter);
    if (companyFilter) qs.set("company", companyFilter);

    fetch(`/api/assessments?${qs.toString()}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { assessments: AssessmentData[] }) => setAssessments(data.assessments || []))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load assessments");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [search, outcome, batchFilter, companyFilter, refreshKey]);

  /* â”€â”€â”€ fetch dropdowns â”€â”€â”€ */
  React.useEffect(() => {
    fetch("/api/batches?search=")
      .then((r) => r.json())
      .then((d) => setBatches((d.batches || []).map((b: { id: string; batchName: string; status: string }) => ({ id: b.id, batchName: b.batchName, status: b.status }))));
    fetch("/api/trainees?pageSize=2000")
      .then((r) => r.json())
      .then((d) => {
        setTrainees(
          (d.trainees || []).map((t: { id: string; name: string; batchId: string; company: string }) => ({
            id: t.id,
            name: t.name,
            batchId: t.batchId,
            company: t.company,
          }))
        );
        if (d.companies) setCompanies(d.companies.filter(Boolean));
      });
  }, []);

  const filteredTrainees = form.batchId ? trainees.filter((t) => t.batchId === form.batchId) : trainees;

  /* â”€â”€â”€ preview computed scores â”€â”€â”€ */
  const techScore = ((form.productKnowledge + form.mapping) / 10) * 100;
  const softScore = ((form.presentability + form.softSkills) / 10) * 100;
  const overallScore = ((form.productKnowledge + form.mapping + form.presentability + form.softSkills) / 20) * 100;

  /* â”€â”€â”€ helpers â”€â”€â”€ */
  const openCreate = () => {
    setForm({ ...emptyForm });
    setShowCreate(true);
  };

  const openEdit = (a: AssessmentData) => {
    setForm({
      traineeId: a.trainee.id,
      batchId: a.batch.id,
      assessmentTitle: a.assessmentTitle,
      productKnowledge: a.productKnowledge,
      mapping: a.mapping,
      presentability: a.presentability,
      softSkills: a.softSkills,
      assessmentOutcome: a.assessmentOutcome,
      instructorComment: a.instructorComment || "",
    });
    setEditAssessment(a);
  };

  const handleSave = async () => {
    if (!editAssessment) {
      if (!form.batchId) {
        toast.error("Batch required", "Please select a batch first.");
        return;
      }
      if (!form.traineeId) {
        toast.error("Trainee required", "Please select a trainee.");
        return;
      }
    }
    setSaving(true);
    try {
      const isEdit = !!editAssessment;
      const url = isEdit ? `/api/assessments/${editAssessment!.id}` : "/api/assessments";
      const method = isEdit ? "PUT" : "POST";

      const payload: Record<string, unknown> = {
        assessmentTitle: form.assessmentTitle,
        productKnowledge: form.productKnowledge,
        mapping: form.mapping,
        presentability: form.presentability,
        softSkills: form.softSkills,
        instructorComment: form.instructorComment,
      };

      if (form.assessmentOutcome) {
        payload.assessmentOutcome = form.assessmentOutcome;
      }

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
      setEditAssessment(null);
      toast.success(isEdit ? "Assessment updated" : "Assessment created", "Assessment has been saved successfully.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save", "Could not save assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAssessment) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assessments/${deleteAssessment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setDeleteAssessment(null);
      toast.success("Assessment deleted", "Assessment has been permanently deleted.");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      toast.error("Delete failed", "Could not delete assessment.");
    } finally {
      setDeleting(false);
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
                <h1 className="text-2xl font-semibold text-[#fafaf9]">Assessments</h1>
                <p className="text-sm text-[#57534e]">Track trainee performance and assessment outcomes</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Assessment
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#44403c]" />
                  <input
                    type="text"
                    placeholder="Search by trainee, title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] py-2 pl-10 pr-4 text-sm text-[#ccd5e4] placeholder:text-[#44403c] focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as "" | AssessmentOutcome)}
                  className="rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-4 py-2 text-sm text-[#ccd5e4] focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="">All Outcomes</option>
                  <option value="Aced">Aced</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Failed">Failed</option>
                </select>
                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm transition",
                    showAdvanced || batchFilter || companyFilter
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-[#a8a29e]/8 bg-[#1c1917] text-[#78716c] hover:text-[#d6d3d1]"
                  )}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                  Filters
                  {(batchFilter || companyFilter) && (
                    <span className="ml-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {[batchFilter, companyFilter].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {(batchFilter || companyFilter || outcome || search) && (
                  <button
                    onClick={() => { setBatchFilter(""); setCompanyFilter(""); setOutcome(""); setSearch(""); }}
                    className="text-xs text-[#57534e] underline hover:text-[#d6d3d1] transition"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Advanced filter panel */}
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-3 rounded-xl border border-[#a8a29e]/8 bg-[#1c1917]/40 p-4"
                >
                  <div className="flex flex-col gap-1 min-w-[180px]">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-[#57534e]">Batch</label>
                    <select
                      value={batchFilter}
                      onChange={(e) => setBatchFilter(e.target.value)}
                      className="rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-3 py-2 text-sm text-[#ccd5e4] focus:border-emerald-500/50 focus:outline-none"
                    >
                      <option value="">All Batches</option>
                      {["Active", "Planning", "Completed"].map((s) => {
                        const grouped = batches.filter((b) => b.status === s);
                        if (!grouped.length) return null;
                        return (
                          <optgroup key={s} label={`── ${s}`}>
                            {grouped.map((b) => (
                              <option key={b.id} value={b.id}>{b.batchName}</option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-[#57534e]">Company</label>
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] px-3 py-2 text-sm text-[#ccd5e4] focus:border-emerald-500/50 focus:outline-none"
                    >
                      <option value="">All Companies</option>
                      {companies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {(batchFilter || companyFilter) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => { setBatchFilter(""); setCompanyFilter(""); }}
                        className="rounded-xl border border-[#a8a29e]/8 px-3 py-2 text-xs text-[#57534e] transition hover:border-rose-500/30 hover:text-rose-400"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Assessments Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} lines={5} />
                ))
              ) : error ? (
                <Card className="col-span-full p-6 text-rose-300">{error}</Card>
              ) : assessments.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    icon={<ClipboardList className="h-8 w-8" />}
                    title="No assessments found"
                    description="No assessments match your filters."
                  />
                </div>
              ) : (
                assessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onEdit={() => openEdit(assessment)}
                    onDelete={() => setDeleteAssessment(assessment)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* â”€â”€â”€ CREATE / EDIT MODAL â”€â”€â”€ */}
      <Modal
        open={showCreate || !!editAssessment}
        onClose={() => { setShowCreate(false); setEditAssessment(null); }}
        title={editAssessment ? "Edit Assessment" : "New Assessment"}
        description={editAssessment ? "Update scores and feedback" : "Score a trainee's final assessment"}
        wide
      >
        <div className="space-y-5">
          {!editAssessment && (
            <>
              <div className="grid grid-cols-2 gap-4">
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
                    disabled={!form.batchId}
                  >
                    <option value="">{form.batchId ? "Select trainee…" : "Select a batch first"}</option>
                    {filteredTrainees.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </ModalSelect>
                  {form.batchId && filteredTrainees.length === 0 && (
                    <p className="mt-1.5 text-xs text-amber-400">No trainees found for this batch.</p>
                  )}
                </FormField>
              </div>
              <FormField label="Assessment Title">
                <ModalInput
                  value={form.assessmentTitle}
                  onChange={(e) => setForm({ ...form, assessmentTitle: e.target.value })}
                  placeholder="Final"
                />
              </FormField>
            </>
          )}

          {/* Score Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <ScoreInput label="Product Knowledge" value={form.productKnowledge} onChange={(v) => setForm({ ...form, productKnowledge: v })} />
            <ScoreInput label="Mapping" value={form.mapping} onChange={(v) => setForm({ ...form, mapping: v })} />
            <ScoreInput label="Presentability" value={form.presentability} onChange={(v) => setForm({ ...form, presentability: v })} />
            <ScoreInput label="Soft Skills" value={form.softSkills} onChange={(v) => setForm({ ...form, softSkills: v })} />
          </div>

          {/* Live Preview */}
          <div className="rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#57534e]">Score Preview</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-cyan-300">{Math.round(techScore)}%</p>
                <p className="text-xs text-[#57534e]">Tech Score</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-purple-300">{Math.round(softScore)}%</p>
                <p className="text-xs text-[#57534e]">Soft Score</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#fafaf9]">{Math.round(overallScore)}%</p>
                <p className="text-xs text-[#57534e]">Overall</p>
              </div>
            </div>
          </div>

          <FormField label="Assessment Outcome">
            <ModalSelect
              value={form.assessmentOutcome}
              onChange={(e) => setForm({ ...form, assessmentOutcome: e.target.value })}
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

          <FormField label="Instructor Comment">
            <textarea
              value={form.instructorComment}
              onChange={(e) => setForm({ ...form, instructorComment: e.target.value })}
              placeholder="Optional feedback…"
              className="w-full rounded-xl border border-[#a8a29e]/8 bg-[#1c1917]/80 px-3.5 py-2.5 text-sm text-[#fafaf9] placeholder:text-[#44403c] transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              rows={3}
            />
          </FormField>
        </div>
        <ModalFooter
          onCancel={() => { setShowCreate(false); setEditAssessment(null); }}
          onSubmit={handleSave}
          submitLabel={editAssessment ? "Update" : "Create"}
          loading={saving}
        />
      </Modal>

      {/* â”€â”€â”€ DELETE CONFIRM â”€â”€â”€ */}
      <ConfirmDialog
        open={!!deleteAssessment}
        onClose={() => setDeleteAssessment(null)}
        onConfirm={handleDelete}
        title="Delete Assessment"
        message={`Delete the assessment for "${deleteAssessment?.trainee.traineeName}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

/* â”€â”€â”€ SCORE INPUT COMPONENT â”€â”€â”€ */
function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#78716c]">{label}</span>
        <span className="text-sm font-semibold text-[#fafaf9]">{value}/5</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s === value ? 0 : s)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-5 w-5",
                s <= value ? "fill-amber-400 text-amber-400" : "text-[#3d3632]"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* â”€â”€â”€ ASSESSMENT CARD â”€â”€â”€ */
function AssessmentCard({
  assessment,
  onEdit,
  onDelete,
}: {
  assessment: AssessmentData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <Card className="relative p-6">
      {/* Actions */}
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
          <Avatar name={assessment.trainee.traineeName} size="lg" />
          <div>
            <h3 className="font-semibold text-[#fafaf9]">{assessment.trainee.traineeName}</h3>
            <p className="text-sm text-[#57534e]">{assessment.company}</p>
            <p className="mt-1 text-xs text-[#44403c]">
              {assessment.assessmentTitle} • {assessment.batch.batchName}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            outcomeColors[assessment.assessmentOutcome]
          )}
        >
          {assessment.assessmentOutcome}
        </span>
      </div>

      {/* Scores */}
      <div className="mt-6 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#57534e]">Technical Score</span>
            <span className="font-semibold text-[#fafaf9]">{assessment.techScorePercent}%</span>
          </div>
          <ProgressBar value={assessment.techScorePercent} showLabel={false} color="from-teal-500 to-emerald-400" />
          <div className="mt-2 flex gap-4 text-xs text-[#57534e]">
            <span>Mapping: <StarRating value={assessment.mapping} /></span>
            <span>Product Knowledge: <StarRating value={assessment.productKnowledge} /></span>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#57534e]">Soft Score</span>
            <span className="font-semibold text-[#fafaf9]">{assessment.softScorePercent}%</span>
          </div>
          <ProgressBar value={assessment.softScorePercent} showLabel={false} color="from-purple-500 to-pink-400" />
          <div className="mt-2 flex gap-4 text-xs text-[#57534e]">
            <span>Presentability: <StarRating value={assessment.presentability} /></span>
            <span>Soft Skills: <StarRating value={assessment.softSkills} /></span>
          </div>
        </div>
        <div className="rounded-xl bg-[#1c1917] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#57534e]">Overall Score</span>
            <span className="text-2xl font-bold text-[#fafaf9]">{assessment.overallPercent}%</span>
          </div>
          <ProgressBar value={assessment.overallPercent} showLabel={false} size="lg" />
        </div>
      </div>

      {/* Attendance */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
          <p className="text-xl font-semibold text-emerald-300">
            {typeof assessment.attendance === "number" ? assessment.attendance : "—"}
          </p>
          <p className="text-xs text-[#57534e]">Present Days</p>
        </div>
        <div className="rounded-xl bg-rose-500/10 p-3 text-center">
          <p className="text-xl font-semibold text-rose-300">
            {typeof assessment.absence === "number" ? assessment.absence : "—"}
          </p>
          <p className="text-xs text-[#57534e]">Absent Days</p>
        </div>
      </div>

      {/* Instructor Comment */}
      {assessment.instructorComment && (
        <div className="mt-4 rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4">
          <p className="text-xs text-[#57534e]">
            <MessageSquare className="mr-1 inline h-3 w-3" />Instructor Comment
          </p>
          <p className="mt-1 text-sm text-[#78716c]">{assessment.instructorComment}</p>
        </div>
      )}

      {/* AI Report */}
      {assessment.assessmentAIReport && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-400">
            <Sparkles className="mr-1 inline h-3 w-3" />AI Assessment Report
          </p>
          <p className="mt-1 text-sm text-[#78716c]">{assessment.assessmentAIReport}</p>
        </div>
      )}
    </Card>
  );
}

/* â”€â”€â”€ STAR RATING (display only) â”€â”€â”€ */
function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-3 w-3", i < Math.floor(value) ? "fill-current" : "opacity-30")}
        />
      ))}
      <span className="ml-1 text-[#78716c]">{value}</span>
    </span>
  );
}
