"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, TrendingUp } from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { Card, ProgressBar, Breadcrumb, CardSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type CompanyDetail = {
  company: { name: string };
  totals: { trainees: number; avgScore: number; completion: number };
  batches: Array<{ batchId: string; batchName: string; status: string; trainees: number }>;
  trainees: Array<{
    id: string;
    name: string;
    batch: { id: string; batchName: string; status: string };
    completionPercent: number;
    assessment: null | { overallPercent: number; outcome: string };
  }>;
};

export default function CompanyDetailPage({ params }: { params: { name: string } }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<CompanyDetail | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/companies/${encodeURIComponent(params.name)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: CompanyDetail) => setData(json))
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load company");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [params.name]);

  return (
    <div className="flex min-h-screen bg-[#0c0a09]">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-7xl space-y-6"
          >
            <Breadcrumb items={[
              { label: "Dashboard", href: "/" },
              { label: "Companies", href: "/companies" },
              { label: data?.company.name ?? decodeURIComponent(params.name) },
            ]} />

            {loading ? (
              <div className="space-y-6">
                <CardSkeleton lines={2} />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} lines={2} />)}
                </div>
              </div>
            ) : error ? (
              <Card className="p-6 text-rose-400">{error}</Card>
            ) : !data ? (
              <Card className="p-6 text-[#78716c]">No data.</Card>
            ) : (
              <>
                <div>
                  <h1 className="text-2xl font-semibold text-[#fafaf9]">{data.company.name}</h1>
                  <p className="text-sm text-[#57534e]">
                    Company view • {data.totals.trainees} trainees
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Kpi icon={Users} label="Trainees" value={data.totals.trainees} />
                  <Kpi icon={TrendingUp} label="Avg score" value={`${data.totals.avgScore}%`} />
                  <Kpi icon={TrendingUp} label="Avg completion" value={`${data.totals.completion}%`} />
                </div>

                <Card className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-[#fafaf9]">Trainees</h3>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {data.trainees.map((t) => (
                      <Link
                        key={t.id}
                        href={`/trainees/${t.id}`}
                        className="group rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/40 p-4 transition-colors hover:border-[#a8a29e]/15 hover:bg-[#1c1917]/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-[#fafaf9] group-hover:text-cyan-300">
                              {t.name}
                            </div>
                            <div className="mt-0.5 text-xs text-[#57534e]">{t.batch.batchName}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-emerald-400">
                              {t.assessment ? `${t.assessment.overallPercent}%` : "—"}
                            </div>
                            <div className="text-[11px] text-[#44403c]">Score</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-[11px]">
                            <span className="text-[#57534e]">Completion</span>
                            <span className="text-[#78716c]">{t.completionPercent}%</span>
                          </div>
                          <ProgressBar value={t.completionPercent} showLabel={false} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[#a8a29e]/6 bg-[#1c1917] flex items-center gap-4 p-5 transition-colors hover:border-[#a8a29e]/15/60">
      <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-[#fafaf9]">{value}</div>
        <div className="text-[13px] text-[#57534e]">{label}</div>
      </div>
    </div>
  );
}
