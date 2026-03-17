// ============================================================
// AVARIA ACADEMY — DASHBOARD API
// Real-time data from the Immortal Data Engine
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_START_BATCH, parseBatchNumber } from "@/lib/batchRules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const eligibleBatchIds = (await db.batch.findMany({
      where: { batchName: { not: "" } },
      select: { id: true, batchName: true },
    }))
      .filter((b) => {
        const num = parseBatchNumber(b.batchName);
        return num != null && num >= ATTENDANCE_START_BATCH;
      })
      .map((b) => b.id);

    // Parallel queries for maximum performance
    const [
      batchCounts,
      traineeCount,
      todayAttendance,
      weeklyAttendance,
      outcomeDistribution,
      topCompanies,
      recentAttendance,
      tenDayProgress,
      assessmentCount,
    ] = await Promise.all([
      // Batch counts by status
      db.batch.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      
      // Total trainees
      db.trainee.count(),
      
      // Today's attendance breakdown
      db.dailyAttendance.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { date: { gte: today }, batchId: { in: eligibleBatchIds } },
        orderBy: { status: "asc" },
      }),
      
      // Weekly attendance trend
      db.dailyAttendance.groupBy({
        by: ["date"],
        _count: { _all: true },
        where: { 
          date: { gte: sevenDaysAgo },
          status: "Present",
          batchId: { in: eligibleBatchIds },
        },
        orderBy: { date: "asc" },
      }),
      
      // Assessment outcome distribution
      db.assessment.groupBy({
        by: ["assessmentOutcome"],
        _count: { _all: true },
        orderBy: { assessmentOutcome: "asc" },
      }),
      
      // Top companies by trainee count
      db.trainee.groupBy({
        by: ["company"],
        _count: { _all: true },
        orderBy: { _count: { company: "desc" } },
        take: 6,
      }),
      
      // Recent attendance entries
      db.dailyAttendance.findMany({
        take: 5,
        orderBy: { date: "desc" },
        where: { batchId: { in: eligibleBatchIds } },
        include: { trainee: true, batch: true },
      }),
      
      // 10-day progress
      db.tenDayAttendance.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        where: { batchId: { in: eligibleBatchIds } },
        include: { trainee: true, batch: true },
      }),
      
      // Total assessments
      db.assessment.count(),
    ]);

    // Process batch counts
    const batchStats = {
      active: 0,
      planning: 0,
      completed: 0,
    };
    batchCounts.forEach((b) => {
      const count = typeof b._count === "object" ? (b._count as { _all?: number })._all ?? 0 : 0;
      if (b.status === "Active") batchStats.active = count;
      else if (b.status === "Planning") batchStats.planning = count;
      else if (b.status === "Completed") batchStats.completed = count;
    });

    // Process today's attendance
    const todayStats = { present: 0, absent: 0, late: 0, onTour: 0 };
    todayAttendance.forEach((item) => {
      const count = typeof item._count === "object" ? (item._count as { _all?: number })._all ?? 0 : 0;
      if (item.status === "Present") todayStats.present = count;
      else if (item.status === "Absent") todayStats.absent = count;
      else if (item.status === "Tour Day") todayStats.onTour = count;
    });

    // Process weekly trend
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyTrend = weeklyAttendance.map((item) => {
      const count = typeof item._count === "object" ? (item._count as { _all?: number })._all ?? 0 : 0;
      return {
        day: days[new Date(item.date).getDay()],
        value: count,
        date: item.date,
      };
    });

    // Process outcomes
    const outcomes = outcomeDistribution.map((item) => {
      const count = typeof item._count === "object" ? (item._count as { _all?: number })._all ?? 0 : 0;
      return {
        name: item.assessmentOutcome,
        value: count,
      };
    });

    // Process companies
    const companies = topCompanies.map((item) => {
      const count = typeof item._count === "object" ? (item._count as { _all?: number })._all ?? 0 : 0;
      return {
        name: item.company,
        trainees: count,
      };
    });

    // Format recent attendance
    const recentFeed = recentAttendance.map((a) => ({
      id: a.id,
      name: a.trainee?.traineeName || "Unknown",
      status: a.status,
      time: a.arrivalTime ? formatTime(a.arrivalTime) : "",
      isLate: a.isLate,
      batch: a.batch?.batchName || "Unknown",
    }));

    // Format 10-day progress
    const tenDay = tenDayProgress.map((a) => ({
      id: a.id,
      name: a.trainee?.traineeName || "Unknown",
      percent: a.completionPercent,
      status: a.checklistStatus,
      batch: a.batch?.batchName || "Unknown",
    }));

    // Calculate attendance rate
    const totalToday = todayStats.present + todayStats.absent + todayStats.onTour;
    const attendanceRate = totalToday > 0 ? Math.round((todayStats.present / totalToday) * 100) : 0;

    return NextResponse.json({
      stats: {
        activeBatches: batchStats.active,
        planningBatches: batchStats.planning,
        completedBatches: batchStats.completed,
        totalTrainees: traineeCount,
        totalAssessments: assessmentCount,
      },
      today: {
        ...todayStats,
        rate: attendanceRate,
      },
      weeklyTrend,
      outcomeDistribution: outcomes,
      topCompanies: companies,
      recentAttendance: recentFeed,
      tenDayProgress: tenDay,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(mins).padStart(2, "0")} ${period}`;
}
