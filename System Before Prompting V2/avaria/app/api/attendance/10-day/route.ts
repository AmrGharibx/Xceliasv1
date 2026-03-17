import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAttendanceEligible } from "@/lib/batchRules";
import { calculate10DayCompletion } from "@/lib/utils/calculations";
import { requireAuth } from "@/lib/auth";
import { createTenDaySchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const search = (sp.get("search") || "").trim();
  const status = sp.get("status") || "";
  const batchId = sp.get("batchId") || "";
  const page = Number(sp.get("page") || "1");
  const pageSize = Number(sp.get("pageSize") || sp.get("limit") || "20");

  const skip = Math.max(0, (page - 1) * pageSize);

  try {
    const where: Record<string, unknown> = {};
    if (status) where.checklistStatus = status;
    if (batchId) where.batchId = batchId;
    if (search) {
      where.trainee = { traineeName: { contains: search } };
    }

    const [rows, total] = await Promise.all([
      db.tenDayAttendance.findMany({
        where,
        include: {
          trainee: { select: { id: true, traineeName: true, company: true } },
          batch: { select: { id: true, batchName: true } },
        },
        orderBy: { periodStart: "desc" },
        skip,
        take: pageSize,
      }),
      db.tenDayAttendance.count({ where }),
    ]);

    const records = rows.map((t) => {
      const eligible = isAttendanceEligible(t.batch?.batchName || null);
      return {
        id: t.id,
        record: t.record,
        periodStart: t.periodStart,
        periodEnd: t.periodEnd,
        completionPercent: eligible ? t.completionPercent : null,
        checklistStatus: eligible ? t.checklistStatus : null,
        attendanceAIReport: t.attendanceAIReport,
        presentCount: eligible ? t.presentCount : null,
        absentCount: eligible ? t.absentCount : null,
        lateCount: eligible ? t.lateCount : null,
        days: eligible
          ? [t.day1, t.day2, t.day3, t.day4, t.day5, t.day6, t.day7, t.day8, t.day9, t.day10]
          : null,
        attendanceEligible: eligible,
        trainee: t.trainee,
        batch: t.batch,
      };
    });

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("10-day attendance API error:", error);
    return NextResponse.json({ error: "Failed to fetch 10-day attendance" }, { status: 500 });
  }
}

// ============================================================
// CREATE 10-DAY ATTENDANCE RECORD
// ============================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(createTenDaySchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { traineeId, batchId, periodStart, periodEnd, days, checklistStatus } = parsed.data;

    // Look up trainee and batch for record name
    const [trainee, batch] = await Promise.all([
      db.trainee.findUnique({ where: { id: traineeId }, select: { traineeName: true } }),
      db.batch.findUnique({ where: { id: batchId }, select: { batchName: true } }),
    ]);

    if (!trainee || !batch) {
      return NextResponse.json({ error: "Trainee or Batch not found" }, { status: 404 });
    }

    const pStart = new Date(periodStart).toISOString().slice(0, 10);
    const pEnd = new Date(periodEnd).toISOString().slice(0, 10);
    const record = `${trainee.traineeName} - ${batch.batchName} (${pStart}–${pEnd})`;

    const dayArr: boolean[] = Array.isArray(days) ? days : Array.from({ length: 10 }, () => false);
    const completionPercent = calculate10DayCompletion(dayArr);

    const created = await db.tenDayAttendance.create({
      data: {
        record,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        day1: dayArr[0] ?? false,
        day2: dayArr[1] ?? false,
        day3: dayArr[2] ?? false,
        day4: dayArr[3] ?? false,
        day5: dayArr[4] ?? false,
        day6: dayArr[5] ?? false,
        day7: dayArr[6] ?? false,
        day8: dayArr[7] ?? false,
        day9: dayArr[8] ?? false,
        day10: dayArr[9] ?? false,
        completionPercent,
        checklistStatus: checklistStatus || (completionPercent === 100 ? "Complete" : completionPercent > 0 ? "In Progress" : "Not Started"),
        traineeId,
        batchId,
      },
    });

    return NextResponse.json({ record: created }, { status: 201 });
  } catch (error) {
    console.error("Create 10-day attendance error:", error);
    return NextResponse.json({ error: "Failed to create 10-day record" }, { status: 500 });
  }
}
