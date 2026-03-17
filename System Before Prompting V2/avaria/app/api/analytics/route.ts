import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_START_BATCH, parseBatchNumber } from "@/lib/batchRules";
import { calculateMinutesLate } from "@/lib/utils/calculations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  return date.toLocaleDateString("en-US", { month: "short" });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "180") || 180;

    // Dynamic eligible batch discovery — no hardcoded limit
    const allBatches = await db.batch.findMany({ select: { id: true, batchName: true } });
    const eligibleIds = allBatches
      .filter((b) => {
        const num = parseBatchNumber(b.batchName);
        return num != null && num >= ATTENDANCE_START_BATCH;
      })
      .map((b) => b.id);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - days);

    const attendanceRows = await db.dailyAttendance.findMany({
      where: { date: { gte: startDate }, batchId: { in: eligibleIds } },
      select: { date: true, status: true, arrivalTime: true },
    });

    // Attendance by month: % present/absent/late (late = minutesLate>0)
    const monthAgg = new Map<string, { present: number; absent: number; late: number; total: number }>();
    for (const r of attendanceRows) {
      const key = monthKey(r.date);
      const entry = monthAgg.get(key) ?? { present: 0, absent: 0, late: 0, total: 0 };
      entry.total += 1;
      if (r.status === "Present") entry.present += 1;
      if (r.status === "Absent") entry.absent += 1;
      const lateMinutes = r.arrivalTime ? calculateMinutesLate(r.arrivalTime) : 0;
      if (lateMinutes > 0) entry.late += 1;
      monthAgg.set(key, entry);
    }

    const months = Array.from(monthAgg.keys()).sort().slice(-6);
    const attendanceByMonth = months.map((k) => {
      const v = monthAgg.get(k)!;
      const denom = v.total || 1;
      return {
        month: monthLabel(k),
        present: Math.round((v.present / denom) * 100),
        absent: Math.round((v.absent / denom) * 100),
        late: Math.round((v.late / denom) * 100),
      };
    });

    const outcomeDistributionRaw = await db.assessment.groupBy({
      by: ["assessmentOutcome"],
      _count: { _all: true },
    });

    const totalOutcomes = outcomeDistributionRaw.reduce((s, o) => s + ((o._count as { _all?: number })._all ?? 0), 0) || 1;
    const outcomeColors: Record<string, string> = {
      Aced: "#10B981",
      Excellent: "#22C55E",
      "Very Good": "#84CC16",
      Good: "#F59E0B",
      "Needs Improvement": "#EF4444",
      Failed: "#F43F5E",
    };

    const outcomeDistribution = outcomeDistributionRaw
      .map((o) => {
        const count = (o._count as { _all?: number })._all ?? 0;
        return {
          name: o.assessmentOutcome,
          value: Math.round((count / totalOutcomes) * 100),
          color: outcomeColors[o.assessmentOutcome] ?? "#94A3B8",
        };
      })
      .sort((a, b) => b.value - a.value);

    // Batch comparison — dynamically take the last 4 eligible batches
    const eligibleBatches = allBatches
      .map((b) => ({ ...b, num: parseBatchNumber(b.batchName) }))
      .filter((b): b is typeof b & { num: number } => b.num != null && b.num >= ATTENDANCE_START_BATCH)
      .sort((a, b) => a.num - b.num);
    const compareBatches = eligibleBatches.slice(-4);

    const compareAgg = await db.assessment.groupBy({
      by: ["batchId"],
      where: { batchId: { in: compareBatches.map((b) => b.id) } },
      _avg: { techScorePercent: true, softScorePercent: true },
    });

    const compareMap = new Map(compareAgg.map((a) => [a.batchId, a]));
    const batchComparison = compareBatches
      .map((b) => {
        const agg = compareMap.get(b.id);
        return {
          batch: b.batchName,
          tech: Math.round((agg?._avg.techScorePercent ?? 0) * 10) / 10,
          soft: Math.round((agg?._avg.softScorePercent ?? 0) * 10) / 10,
        };
      })
      .sort((a, b) => a.batch.localeCompare(b.batch, undefined, { numeric: true }));

    // Late patterns: bucket late arrivals in last 30 days into 15-min buckets after 11:00
    const start30 = new Date(now);
    start30.setUTCDate(start30.getUTCDate() - 30);

    const lateRows = await db.dailyAttendance.findMany({
      where: {
        date: { gte: start30 },
        batchId: { in: eligibleIds },
        arrivalTime: { not: null },
      },
      select: { arrivalTime: true },
    });

    const buckets = new Map<string, number>();
    for (const r of lateRows) {
      const at = r.arrivalTime;
      if (!at) continue;
      const mins = calculateMinutesLate(at);
      if (mins <= 0) continue;

      const hour = at.getHours();
      const minute = at.getMinutes();
      const bucketMin = Math.floor(minute / 15) * 15;
      const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${String(bucketMin).padStart(2, "0")}`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }

    const latePatterns = Array.from(buckets.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour, undefined, { numeric: true }));

    // Skills radar: compare last 2 eligible batches
    const radarBatches = eligibleBatches.slice(-2);
    const batchA = radarBatches[1]; // newest
    const batchB = radarBatches[0]; // second newest

    const [aA, aB] = await Promise.all([
      batchA
        ? db.assessment.aggregate({
            where: { batchId: batchA.id },
            _avg: { mapping: true, productKnowledge: true, presentability: true, softSkills: true },
          })
        : null,
      batchB
        ? db.assessment.aggregate({
            where: { batchId: batchB.id },
            _avg: { mapping: true, productKnowledge: true, presentability: true, softSkills: true },
          })
        : null,
    ]);

    const [attA, attB] = await Promise.all([
      batchA
        ? db.dailyAttendance.count({ where: { batchId: batchA.id, date: { gte: start30 }, status: "Present" } })
        : 0,
      batchB
        ? db.dailyAttendance.count({ where: { batchId: batchB.id, date: { gte: start30 }, status: "Present" } })
        : 0,
    ]);

    const [totA, totB] = await Promise.all([
      batchA ? db.dailyAttendance.count({ where: { batchId: batchA.id, date: { gte: start30 } } }) : 0,
      batchB ? db.dailyAttendance.count({ where: { batchId: batchB.id, date: { gte: start30 } } }) : 0,
    ]);

    const pA = totA > 0 ? Math.round((attA / totA) * 100) : 0;
    const pB = totB > 0 ? Math.round((attB / totB) * 100) : 0;

    const skillsRadar = [
      { skill: "Mapping", A: Math.round(((aA?._avg.mapping ?? 0) / 5) * 100), B: Math.round(((aB?._avg.mapping ?? 0) / 5) * 100) },
      { skill: "Product", A: Math.round(((aA?._avg.productKnowledge ?? 0) / 5) * 100), B: Math.round(((aB?._avg.productKnowledge ?? 0) / 5) * 100) },
      { skill: "Present.", A: Math.round(((aA?._avg.presentability ?? 0) / 5) * 100), B: Math.round(((aB?._avg.presentability ?? 0) / 5) * 100) },
      { skill: "Soft Skills", A: Math.round(((aA?._avg.softSkills ?? 0) / 5) * 100), B: Math.round(((aB?._avg.softSkills ?? 0) / 5) * 100) },
      { skill: "Attendance", A: pA, B: pB },
    ];

    // Avg 10-day completion across eligible batches
    const completionAgg = await db.tenDayAttendance.aggregate({
      where: { batchId: { in: eligibleIds } },
      _avg: { completionPercent: true },
    });
    const avgCompletion = Math.round(completionAgg._avg.completionPercent ?? 0);

    return NextResponse.json({
      attendanceByMonth,
      outcomeDistribution,
      batchComparison,
      latePatterns,
      skillsRadar,
      skillsRadarLabels: {
        A: batchA?.batchName ?? "N/A",
        B: batchB?.batchName ?? "N/A",
      },
      avgCompletion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
