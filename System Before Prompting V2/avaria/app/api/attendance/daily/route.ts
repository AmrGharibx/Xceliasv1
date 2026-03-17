import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMinutesLate, wasLate } from "@/lib/utils/calculations";
import { isAttendanceEligible } from "@/lib/batchRules";
import { requireAuth } from "@/lib/auth";
import { createDailyAttendanceSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const date = sp.get("date"); // YYYY-MM-DD
  const search = (sp.get("search") || "").trim();
  const status = sp.get("status") || "";
  const batchId = sp.get("batchId") || "";
  const page = Number(sp.get("page") || "1");
  const pageSize = Number(sp.get("pageSize") || sp.get("limit") || "50");

  const skip = Math.max(0, (page - 1) * pageSize);

  try {
    const where: Record<string, unknown> = {};

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.date = { gte: start, lt: end };
    }

    if (status) where.status = status;
    if (batchId) where.batchId = batchId;

    if (search) {
      where.trainee = {
        traineeName: { contains: search },
      };
    }

    const [rows, total] = await Promise.all([
      db.dailyAttendance.findMany({
        where,
        include: {
          trainee: { select: { id: true, traineeName: true, company: true } },
          batch: { select: { id: true, batchName: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
      }),
      db.dailyAttendance.count({ where }),
    ]);

    const records = rows.map((a) => {
      const eligible = isAttendanceEligible(a.batch?.batchName || null);
      const computedMinutesLate = a.arrivalTime ? calculateMinutesLate(a.arrivalTime) : 0;
      const computedWasLate = a.arrivalTime ? wasLate(a.arrivalTime) : false;

      return {
        id: a.id,
        entryId: a.entryId,
        date: a.date,
        arrivalTime: a.arrivalTime,
        departureTime: a.departureTime,
        status: a.status,
        absenceReason: a.absenceReason,
        isLate: a.isLate,
        attendanceEligible: eligible,
        minutesLate: eligible ? computedMinutesLate : null,
        wasLate: eligible ? computedWasLate : null,
        trainee: a.trainee,
        batch: a.batch,
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
    console.error("Daily attendance API error:", error);
    return NextResponse.json({ error: "Failed to fetch daily attendance" }, { status: 500 });
  }
}

// ============================================================
// CREATE DAILY ATTENDANCE
// ============================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(createDailyAttendanceSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { traineeId, batchId, date, arrivalTime, departureTime, status, absenceReason } = parsed.data;

    // Look up trainee name for entryId
    const trainee = await db.trainee.findUnique({ where: { id: traineeId }, select: { traineeName: true } });
    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    const dateStr = new Date(date).toISOString().slice(0, 10);
    const entryId = `${dateStr} - ${trainee.traineeName}`;

    const arrival = arrivalTime ? new Date(arrivalTime) : null;
    const computedIsLate = arrival ? wasLate(arrival) : false;
    const computedMinutes = arrival ? calculateMinutesLate(arrival) : 0;

    const record = await db.dailyAttendance.create({
      data: {
        entryId,
        date: new Date(date),
        arrivalTime: arrival,
        departureTime: departureTime ? new Date(departureTime) : null,
        status,
        absenceReason: absenceReason || null,
        isLate: computedIsLate,
        minutesLate: computedMinutes,
        traineeId,
        batchId,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Create daily attendance error:", error);
    return NextResponse.json({ error: "Failed to create attendance record" }, { status: 500 });
  }
}
