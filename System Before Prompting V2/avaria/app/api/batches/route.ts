import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createBatchSchema, parseBody } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const search = (searchParams.get("search") || "").trim();
  const company = searchParams.get("company") || "";

  try {
    const and: Array<Record<string, unknown>> = [];
    if (status) and.push({ status });
    if (search) and.push({ batchName: { contains: search } });
    // Filter by company: only batches that have trainees from that company
    const companyBatchIds = company
      ? (await db.trainee.findMany({
          where: { company: { contains: company } },
          select: { batchId: true },
          distinct: ["batchId"],
        })).map((t) => t.batchId)
      : null;
    if (companyBatchIds) and.push({ id: { in: companyBatchIds } });

    const where: Record<string, unknown> = and.length > 0 ? { AND: and } : {};

    const batches = await db.batch.findMany({
      where,
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        batchName: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    const batchIds = batches.map((b) => b.id);

    const [traineeCounts, tenDayAgg] = await Promise.all([
      db.trainee.groupBy({
        by: ["batchId"],
        where: { batchId: { in: batchIds } },
        _count: { _all: true },
      }),
      db.tenDayAttendance.groupBy({
        by: ["batchId"],
        where: { batchId: { in: batchIds } },
        _sum: { presentCount: true, absentCount: true, lateCount: true },
        _avg: { completionPercent: true },
      }),
    ]);

    const traineeCountByBatch = new Map(
      traineeCounts.map((t) => [t.batchId, (t._count as { _all?: number })._all ?? 0])
    );

    const tenDayByBatch = new Map(
      tenDayAgg.map((t) => [
        t.batchId,
        {
          presentTotal10Day: t._sum.presentCount ?? 0,
          absentTotal10Day: t._sum.absentCount ?? 0,
          lateTotal10Day: t._sum.lateCount ?? 0,
          avgCompletion10Day: Math.round(((t._avg.completionPercent ?? 0) + Number.EPSILON) * 10) / 10,
        },
      ])
    );

    return NextResponse.json({
      batches: batches.map((b) => {
        const ten = tenDayByBatch.get(b.id) ?? {
          presentTotal10Day: 0,
          absentTotal10Day: 0,
          lateTotal10Day: 0,
          avgCompletion10Day: 0,
        };

        return {
          id: b.id,
          batchName: b.batchName,
          status: b.status,
          dateRange: { start: b.startDate, end: b.endDate },
          traineeCount: traineeCountByBatch.get(b.id) ?? 0,
          ...ten,
        };
      }),
    });
  } catch (error) {
    console.error("Batches API error:", error);
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

// ============================================================
// CREATE BATCH
// ============================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(createBatchSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { batchName, status, startDate, endDate } = parsed.data;

    const batch = await db.batch.create({
      data: {
        batchName,
        status: status || "Planning",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (error) {
    console.error("Create batch error:", error);
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
