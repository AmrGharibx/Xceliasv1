import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_START_BATCH, isAttendanceEligible } from "@/lib/batchRules";
import { requireAuth } from "@/lib/auth";
import { updateBatchSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBatchNum(batchName: string | null | undefined): number | null {
  if (!batchName) return null;
  const m = batchName.match(/\bBatch\s*(\d+)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const batch = await db.batch.findUnique({
      where: { id },
      select: {
        id: true,
        batchName: true,
        status: true,
        startDate: true,
        endDate: true,
        trainees: {
          select: {
            id: true,
            traineeName: true,
            company: true,
            completionPercent: true,
            assessments: {
              select: {
                overallPercent: true,
                assessmentOutcome: true,
              },
              orderBy: { createdAt: "desc" as const },
              take: 1,
            },
          },
          orderBy: { traineeName: "asc" },
        },
        _count: {
          select: {
            dailyAttendance: true,
            tenDayAttendance: true,
            assessments: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const batchNum = parseBatchNum(batch.batchName);
    const attendanceEligible = isAttendanceEligible(batch.batchName);

    const [dailyAgg, tenDayAgg] = await Promise.all([
      attendanceEligible
        ? db.dailyAttendance.groupBy({
            by: ["status"],
            where: { batchId: id },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      attendanceEligible
        ? db.tenDayAttendance.aggregate({
            where: { batchId: id },
            _avg: { completionPercent: true },
            _sum: { presentCount: true, absentCount: true, lateCount: true },
          })
        : Promise.resolve(null),
    ]);

    const dailyCounts = new Map(
      (dailyAgg as Array<{ status: string; _count: { _all: number } }>).map((r) => [
        r.status,
        r._count._all,
      ])
    );

    const roster = batch.trainees.map((t) => {
      const latestAssessment = t.assessments[0] ?? null;
      return {
        id: t.id,
        name: t.traineeName,
        company: t.company,
        completionPercent: Math.round((t.completionPercent ?? 0) + Number.EPSILON),
        assessment: latestAssessment
          ? {
              overallPercent: Math.round((latestAssessment.overallPercent ?? 0) + Number.EPSILON),
              outcome: latestAssessment.assessmentOutcome,
            }
          : null,
      };
    });

    return NextResponse.json({
      batch: {
        id: batch.id,
        name: batch.batchName,
        status: batch.status,
        startDate: batch.startDate,
        endDate: batch.endDate,
        batchNum,
      },
      stats: {
        traineeCount: roster.length,
        attendanceEligible,
        attendanceStartBatch: ATTENDANCE_START_BATCH,
        dailyRecords: attendanceEligible ? batch._count.dailyAttendance : 0,
        tenDayRecords: attendanceEligible ? batch._count.tenDayAttendance : 0,
        assessmentRecords: batch._count.assessments,
        avgCompletion10Day: attendanceEligible
          ? Math.round(((tenDayAgg?._avg.completionPercent ?? 0) + Number.EPSILON) * 10) /
            10
          : null,
        presentTotal10Day: attendanceEligible ? tenDayAgg?._sum.presentCount ?? 0 : null,
        absentTotal10Day: attendanceEligible ? tenDayAgg?._sum.absentCount ?? 0 : null,
        lateTotal10Day: attendanceEligible ? tenDayAgg?._sum.lateCount ?? 0 : null,
        dailyPresent: attendanceEligible ? dailyCounts.get("Present") ?? 0 : null,
        dailyAbsent: attendanceEligible ? dailyCounts.get("Absent") ?? 0 : null,
        dailyLate: attendanceEligible ? dailyCounts.get("Late") ?? 0 : null,
        dailyExcused: attendanceEligible ? dailyCounts.get("Excused") ?? 0 : null,
      },
      trainees: roster,
    });
  } catch (error) {
    console.error("Batch detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch detail" },
      { status: 500 }
    );
  }
}

// ============================================================
// UPDATE BATCH
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(updateBatchSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { batchName, status, startDate, endDate } = parsed.data;

    const data: Record<string, unknown> = {};
    if (batchName !== undefined) data.batchName = batchName;
    if (status !== undefined) data.status = status;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);

    const batch = await db.batch.update({
      where: { id },
      data,
    });

    return NextResponse.json({ batch });
  } catch (error) {
    console.error("Update batch error:", error);
    return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
  }
}

// ============================================================
// DELETE BATCH
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    await db.$transaction([
      db.dailyAttendance.deleteMany({ where: { batchId: id } }),
      db.tenDayAttendance.deleteMany({ where: { batchId: id } }),
      db.assessment.deleteMany({ where: { batchId: id } }),
      db.trainee.deleteMany({ where: { batchId: id } }),
      db.batch.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete batch error:", error);
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}
