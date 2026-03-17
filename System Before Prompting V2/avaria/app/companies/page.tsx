"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, TrendingUp, Users, Award, Building2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Sidebar, Header } from "@/components/layout";
import { Card, EmptyState, CardSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";

export default function CompaniesPage() {
  const hydrated = useHydrated();
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [companies, setCompanies] = React.useState<
    Array<{ name: string; trainees: number; avgScore: number; completion: number }>
  >([]);
  const [topPerformers, setTopPerformers] = React.useState<
    Array<{ name: string; trainees: number; avgScore: number; completion: number }>
  >([]);
  const [totals, setTotals] = React.useState<{ companies: number; trainees: number }>({
    companies: 0,
    trainees: 0,
  });

  React.useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetch("/api/companies", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(
        (data: {
          companies: typeof companies;
          topPerformers: typeof topPerformers;
          totals: typeof totals;
        }) => {
          setCompanies(data.companies || []);
          setTopPerformers(data.topPerformers || []);
          setTotals(data.totals || { companies: 0, trainees: 0 });
        }
      )
      .catch((e: unknown) => {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load companies");
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
                <h1 className="text-2xl font-semibold text-[#fafaf9]">Companies</h1>
                <p className="text-sm text-[#57534e]">
                  {totals.companies} companies enrolled
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Companies"
                value={totals.companies}
                icon={Building2}
                color="cyan"
              />
              <StatCard
                label="Total Trainees"
                value={totals.trainees}
                icon={Users}
                color="sky"
              />
              <StatCard
                label="Avg Score"
                value={
                  companies.length > 0
                    ? `${Math.round(
                        companies.reduce((sum, c) => sum + c.avgScore, 0) / companies.length
                      )}%`
                    : "â€”"
                }
                icon={TrendingUp}
                color="emerald"
              />
              <StatCard
                label="Top Performer"
                value={topPerformers[0]?.name || (loading ? "Loadingâ€¦" : "â€”")}
                icon={Award}
                color="amber"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              {/* Company Leaderboard Chart */}
              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                  Company Leaderboard
                </h3>
                <div className="h-80">
                  {hydrated ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topPerformers}
                        layout="vertical"
                        margin={{ left: 20 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: "#a1a1aa", fontSize: 12 }}
                          width={100}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(100,100,160,0.04)" }}
                          contentStyle={{
                            background: "#231f1d",
                            border: "1px solid rgba(100,100,160,0.12)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            fontSize: 12,
                            color: "#fafaf9",
                            boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
                          }}
                        />
                        <Bar dataKey="avgScore" radius={[0, 8, 8, 0]}>
                          {topPerformers.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                index === 0
                                  ? "#10b981"
                                  : index === 1
                                  ? "#F59E0B"
                                  : "#3B82F6"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full rounded-xl bg-[#1c1917]/50" />
                  )}
                </div>
              </Card>

              {/* Top Performers List */}
              <Card className="p-6">
                <h3 className="mb-6 text-lg font-semibold text-[#fafaf9]">
                  Top Performing Companies
                </h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-[#57534e]">Loadingâ€¦</div>
                  ) : error ? (
                    <div className="text-rose-300">{error}</div>
                  ) : (
                    topPerformers.map((company, i) => (
                    <div
                      key={company.name}
                      className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#1c1917]/50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold",
                            i === 0
                              ? "bg-amber-500/20 text-amber-300"
                              : i === 1
                              ? "bg-[#78716c]/15 text-[#78716c]"
                              : i === 2
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-[#2c2724]/50 text-[#57534e]"
                          )}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-[#fafaf9]">{company.name}</p>
                          <p className="text-sm text-[#57534e]">
                            {company.trainees} trainees
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-emerald-300">
                          {company.avgScore}%
                        </p>
                        <p className="text-xs text-[#57534e]">Avg Score</p>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* All Companies Grid */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#fafaf9]">All Companies</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#44403c]" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-sm rounded-xl border border-[#a8a29e]/8 bg-[#1c1917] py-2 pl-10 pr-4 text-sm text-[#ccd5e4] placeholder:text-[#44403c] focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {loading ? (
                  <div className="col-span-full"><CardSkeleton lines={3} /></div>
                ) : error ? (
                  <div className="col-span-full glass-card p-6 text-center text-rose-300">{error}</div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={<Building2 className="h-8 w-8" />}
                      title="No companies found"
                      description={search ? "Try adjusting your search terms." : "Companies will appear once trainees are enrolled."}
                    />
                  </div>
                ) : (
                  filteredCompanies.map((company) => (
                  <Link
                    key={company.name}
                    href={`/companies/${encodeURIComponent(company.name)}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-4 transition-colors hover:border-[#a8a29e]/12"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-400">
                          {company.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#ccd5e4]">{company.name}</p>
                          <p className="text-xs text-[#57534e]">
                            {company.trainees} trainees
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-[#1c1917] p-2">
                          <p className="text-lg font-semibold text-emerald-300">
                            {company.avgScore}%
                          </p>
                          <p className="text-xs text-[#57534e]">Avg Score</p>
                        </div>
                        <div className="rounded-lg bg-[#1c1917] p-2">
                          <p className="text-lg font-semibold text-sky-300">
                            {company.completion}%
                          </p>
                          <p className="text-xs text-[#57534e]">Completion</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "cyan" | "sky" | "emerald" | "amber";
}) {
  const colorClasses = {
    cyan: "bg-emerald-500/10 text-emerald-400",
    sky: "bg-teal-500/15 text-sky-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
  };

  return (
    <div className="glass-card flex items-center gap-4 p-5">
      <div className={cn("rounded-xl p-3", colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#fafaf9]">{value}</p>
        <p className="text-sm text-[#57534e]">{label}</p>
      </div>
    </div>
  );
}
