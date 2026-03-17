"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import { Sidebar, Header } from "@/components/layout";
import { CompletionRing, Breadcrumb, CardSkeleton } from "@/components/ui";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const RadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import("recharts").then((m) => m.Radar), { ssr: false });

interface TraineeProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string;
  batch: { id: string; name: string; status: string; startDate: string; endDate: string } | null;
  stats: {
    attendanceEligible: boolean;
    attendanceStartBatch: number;
    attendanceRate: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    totalRecords: number;
    avgAssessmentScore: number;
    completionPercent: number;
    assessmentCount: number;
  };
  recentAttendance: { id: string; date: string; status: string; isLate: boolean; arrivalTime: string | null }[];
  tenDayProgress: { id: string; periodStart: string; periodEnd: string; completionPercent: number; checklistStatus: string; days: boolean[] }[];
  assessments: { id: string; title: string; date: string; mapping: number; productKnowledge: number; presentability: number; softSkills: number; techScore: number; softScore: number; overallScore: number; outcome: string; comment: string | null }[];
}

function PhantomCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl border border-[#a8a29e]/6 bg-[#1c1917] transition-colors hover:border-[#a8a29e]/15/60 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string; trend?: number }) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    rose: "bg-rose-500/10 text-rose-400",
    amber: "bg-amber-500/10 text-amber-400",
    sky: "bg-teal-500/10 text-teal-400",
    cyan: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <PhantomCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-[#57534e]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[#fafaf9]">{value}</p>
          {trend !== undefined && (
            <p className={`mt-1 flex items-center gap-1 text-sm ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {trend >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${colorClasses[color] ?? colorClasses.cyan}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </PhantomCard>
  );
}

export default function TraineeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = React.useState<TraineeProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"overview" | "attendance" | "assessments">("overview");

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/trainees/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        setProfile(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProfile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0c0a09]">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 space-y-6">
              <Breadcrumb items={[{ label: "Dashboard", href: "/" }, { label: "Trainees", href: "/trainees" }, { label: "Loading..." }]} />
              <div className="flex items-center gap-6">
                <CardSkeleton lines={0} className="h-24 w-24" />
                <div className="space-y-2"><CardSkeleton lines={2} className="w-64" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} lines={2} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0a09]">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-rose-500" />
          <h2 className="mt-4 text-xl font-semibold text-[#fafaf9]">Trainee Not Found</h2>
          <button onClick={() => router.push("/trainees")} className="mt-4 text-emerald-400 hover:underline">
            Back to Trainees
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "attendance", label: "Attendance" },
    { id: "assessments", label: "Assessments" },
  ] as const;

  const attendanceChartData = profile.stats.attendanceEligible
    ? profile.recentAttendance.slice(0, 14).reverse().map((a) => ({
        date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: a.status === "Present" ? 100 : a.status === "Absent" ? 0 : 50,
      }))
    : [];

  const latestAssessment = profile.assessments[0];
  const skillsData = latestAssessment ? [
    { skill: "Mapping", value: latestAssessment.mapping * 20 },
    { skill: "Product", value: latestAssessment.productKnowledge * 20 },
    { skill: "Presentability", value: latestAssessment.presentability * 20 },
    { skill: "Soft Skills", value: latestAssessment.softSkills * 20 },
  ] : [];

  return (
    <div className="flex min-h-screen bg-[#0c0a09]">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto max-w-7xl px-6 pb-20 pt-8"
          >
            {/* Breadcrumb & Header */}
            <div className="mb-8">
              <Breadcrumb items={[
                { label: "Dashboard", href: "/" },
                { label: "Trainees", href: "/trainees" },
                { label: profile.name },
              ]} />

              <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-center gap-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-4xl font-bold text-emerald-400 shadow-lg shadow-emerald-500/10"
                  >
                    {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </motion.div>

                  <div>
                    <h1 className="text-2xl font-semibold text-[#fafaf9]">{profile.name}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#57534e]">
                      <Link
                        href={`/companies/${encodeURIComponent(profile.company)}`}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-[#231f1d]/60 hover:text-[#ccd5e4]"
                      >
                        <Building2 className="h-4 w-4" />
                        {profile.company}
                      </Link>
                      {profile.batch && (
                        <Link
                          href={`/batches/${profile.batch.id}`}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-[#231f1d]/60 hover:text-[#ccd5e4]"
                        >
                          <BookOpen className="h-4 w-4" />
                          {profile.batch.name}
                        </Link>
                      )}
                      {profile.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          {profile.email}
                        </span>
                      )}
                      {profile.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          {profile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <CompletionRing value={profile.stats.completionPercent} size={100} />
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex gap-2 border-b border-[#a8a29e]/8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-3 text-sm font-medium transition ${
                    activeTab === tab.id ? "text-[#fafaf9]" : "text-[#57534e] hover:text-[#d6d3d1]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label="Attendance Rate"
                      value={profile.stats.attendanceEligible ? `${profile.stats.attendanceRate}%` : "N/A"}
                      icon={CheckCircle2}
                      color={profile.stats.attendanceEligible ? "emerald" : "amber"}
                    />
                    <StatCard label="Days Present" value={profile.stats.attendanceEligible ? profile.stats.presentCount : "—"} icon={Calendar} color="sky" />
                    <StatCard label="Days Absent" value={profile.stats.attendanceEligible ? profile.stats.absentCount : "—"} icon={XCircle} color="rose" />
                    <StatCard label="Avg Assessment" value={`${profile.stats.avgAssessmentScore}%`} icon={Award} color="amber" />
                  </div>

                  {/* Charts Row */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <PhantomCard className="p-6">
                      <h3 className="text-lg font-semibold text-[#fafaf9]">Attendance Trend</h3>
                      <p className="text-sm text-[#57534e]">
                        {profile.stats.attendanceEligible ? "Last 14 days" : `Attendance tracking starts at Batch ${profile.stats.attendanceStartBatch}`}
                      </p>
                      <div className="mt-6 h-56">
                        {profile.stats.attendanceEligible ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceChartData}>
                              <defs>
                                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                              <Tooltip contentStyle={{ background: "#231f1d", border: "1px solid rgba(100,100,160,0.12)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#fafaf9", boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)" }} />
                              <Area type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#attGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#44403c]">
                            Attendance is hidden for earlier batches
                          </div>
                        )}
                      </div>
                    </PhantomCard>

                    <PhantomCard className="p-6">
                      <h3 className="text-lg font-semibold text-[#fafaf9]">Skills Assessment</h3>
                      <p className="text-sm text-[#57534e]">Latest evaluation</p>
                      <div className="mt-6 h-56">
                        {skillsData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={skillsData}>
                              <PolarGrid stroke="#3f3f46" />
                              <PolarAngleAxis dataKey="skill" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                              <Radar name="Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#44403c]">
                            No assessment data available
                          </div>
                        )}
                      </div>
                    </PhantomCard>
                  </div>

                  {/* 10-Day Progress */}
                  <PhantomCard className="p-6">
                    <h3 className="text-lg font-semibold text-[#fafaf9]">10-Day Completion History</h3>
                    <div className="mt-6 space-y-4">
                      {profile.tenDayProgress.length > 0 ? (
                        profile.tenDayProgress.map((period) => (
                          <div key={period.id} className="rounded-xl border border-[#a8a29e]/6 bg-[#231f1d]/30 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#ccd5e4]">
                                  {new Date(period.periodStart).toLocaleDateString()} - {new Date(period.periodEnd).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-[#57534e]">{period.checklistStatus}</p>
                              </div>
                              <CompletionRing value={period.completionPercent} size={60} />
                            </div>
                            <div className="mt-4 flex gap-1">
                              {period.days.map((present, i) => (
                                <div
                                  key={i}
                                  className={`h-8 flex-1 rounded ${present ? "bg-emerald-500/50" : "bg-rose-500/30"}`}
                                  title={`Day ${i + 1}: ${present ? "Present" : "Absent"}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-[#44403c]">No 10-day records yet</p>
                      )}
                    </div>
                  </PhantomCard>
                </motion.div>
              )}

              {activeTab === "attendance" && (
                <motion.div
                  key="attendance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <PhantomCard className="p-6">
                    <h3 className="text-lg font-semibold text-[#fafaf9]">Attendance History</h3>
                    {!profile.stats.attendanceEligible && (
                      <p className="mt-2 text-sm text-[#57534e]">
                        Attendance tracking starts at Batch {profile.stats.attendanceStartBatch}. Attendance metrics are hidden for earlier batches.
                      </p>
                    )}
                    <div className="mt-6 space-y-3">
                      {profile.stats.attendanceEligible && profile.recentAttendance.length > 0 ? (
                        profile.recentAttendance.map((att) => {
                          const statusColors: Record<string, string> = {
                            Present: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            Absent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            "Tour Day": "bg-teal-500/10 text-teal-400 border-teal-500/20",
                          };
                          return (
                            <div key={att.id} className="flex items-center justify-between rounded-xl border border-[#a8a29e]/6 bg-[#231f1d]/30 px-4 py-3">
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-[#fafaf9]">
                                    {new Date(att.date).getDate()}
                                  </p>
                                  <p className="text-xs text-[#44403c]">
                                    {new Date(att.date).toLocaleDateString("en-US", { month: "short" })}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-medium text-[#ccd5e4]">
                                    {new Date(att.date).toLocaleDateString("en-US", { weekday: "long" })}
                                  </p>
                                  {att.arrivalTime && (
                                    <p className="text-sm text-[#57534e]">
                                      Arrived: {new Date(att.arrivalTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[att.status] || statusColors.Present}`}>
                                {att.isLate ? "Late" : att.status}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-[#44403c]">
                          {profile.stats.attendanceEligible ? "No attendance records yet" : "Attendance is not available for this batch"}
                        </p>
                      )}
                    </div>
                  </PhantomCard>
                </motion.div>
              )}

              {activeTab === "assessments" && (
                <motion.div
                  key="assessments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {profile.assessments.length > 0 ? (
                    profile.assessments.map((assessment) => (
                      <PhantomCard key={assessment.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-[#fafaf9]">{assessment.title}</h3>
                            <p className="text-sm text-[#57534e]">
                              {new Date(assessment.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <div className={`rounded-md border px-3 py-1 text-xs font-medium ${
                            assessment.outcome === "Excellent" || assessment.outcome === "Aced" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            assessment.outcome === "Very Good" || assessment.outcome === "Good" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                            assessment.outcome === "Needs Improvement" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {assessment.outcome}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl bg-[#231f1d]/40 p-4 text-center">
                            <p className="text-[13px] text-[#57534e]">Mapping</p>
                            <p className="mt-1 text-2xl font-bold text-[#fafaf9]">{assessment.mapping}/5</p>
                          </div>
                          <div className="rounded-xl bg-[#231f1d]/40 p-4 text-center">
                            <p className="text-[13px] text-[#57534e]">Product Knowledge</p>
                            <p className="mt-1 text-2xl font-bold text-[#fafaf9]">{assessment.productKnowledge}/5</p>
                          </div>
                          <div className="rounded-xl bg-[#231f1d]/40 p-4 text-center">
                            <p className="text-[13px] text-[#57534e]">Presentability</p>
                            <p className="mt-1 text-2xl font-bold text-[#fafaf9]">{assessment.presentability}/5</p>
                          </div>
                          <div className="rounded-xl bg-[#231f1d]/40 p-4 text-center">
                            <p className="text-[13px] text-[#57534e]">Soft Skills</p>
                            <p className="mt-1 text-2xl font-bold text-[#fafaf9]">{assessment.softSkills}/5</p>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between rounded-xl bg-[#231f1d]/40 p-4">
                          <div className="text-center">
                            <p className="text-[13px] text-[#57534e]">Tech Score</p>
                            <p className="text-xl font-bold text-teal-400">{Math.round(assessment.techScore)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] text-[#57534e]">Soft Score</p>
                            <p className="text-xl font-bold text-amber-400">{Math.round(assessment.softScore)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] text-[#57534e]">Overall</p>
                            <p className="text-2xl font-bold text-[#fafaf9]">{Math.round(assessment.overallScore)}%</p>
                          </div>
                        </div>

                        {assessment.comment && (
                          <div className="mt-4 rounded-xl bg-[#231f1d]/30 p-4">
                            <p className="text-[13px] text-[#57534e]">Instructor Comment</p>
                            <p className="mt-1 text-[#d6d3d1]">{assessment.comment}</p>
                          </div>
                        )}
                      </PhantomCard>
                    ))
                  ) : (
                    <PhantomCard className="p-12 text-center">
                      <Award className="mx-auto h-12 w-12 text-[#3d3632]" />
                      <p className="mt-4 text-lg font-medium text-[#57534e]">No assessments yet</p>
                    </PhantomCard>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
