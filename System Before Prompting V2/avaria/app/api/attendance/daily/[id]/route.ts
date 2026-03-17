import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMinutesLate, wasLate } from "@/lib/utils/calculations";
import { requireAuth } from "@/lib/auth";
import { updateDailyAttendanceSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

// ============================================================
// GET SINGLE DAILY ATTENDANCE
// ============================================================
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const record = await db.dailyAttendance.findUnique({
      where: { id },
      include: {
        trainee: { select: { id: true, traineeName: true, company: true } },
        batch: { select: { id: true, batchName: true } },
      },
    });
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ record });
  } catch (error) {
    console.error("Get daily attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

// ============================================================
// UPDATE DAILY ATTENDANCE
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    const body = await request.json();
    const { date, arrivalTime, departureTime, status, absenceReason } = body;

    const data: Record<string, unknown> = {};
    if (date !== undefined) data.date = new Date(date);
    if (status !== undefined) data.status = status;
    if (absenceReason !== undefined) data.absenceReason = absenceReason || null;
    if (departureTime !== undefined) data.departureTime = departureTime ? new Date(departureTime) : null;

    if (arrivalTime !== undefined) {
      const arrival = arrivalTime ? new Date(arrivalTime) : null;
      data.arrivalTime = arrival;
      data.isLate = arrival ? wasLate(arrival) : false;
      data.minutesLate = arrival ? calculateMinutesLate(arrival) : 0;
    }

    const record = await db.dailyAttendance.update({ where: { id }, data });
    return NextResponse.json({ record });
  } catch (error) {
    console.error("Update daily attendance error:", error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

// ============================================================
// DELETE DAILY ATTENDANCE
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    await db.dailyAttendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete daily attendance error:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
