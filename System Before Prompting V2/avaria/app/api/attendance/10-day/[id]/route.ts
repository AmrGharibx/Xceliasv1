import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculate10DayCompletion } from "@/lib/utils/calculations";
import { requireAuth } from "@/lib/auth";
import { updateTenDaySchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

// ============================================================
// GET SINGLE 10-DAY RECORD
// ============================================================
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const record = await db.tenDayAttendance.findUnique({
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
    console.error("Get 10-day attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

// ============================================================
// UPDATE 10-DAY RECORD
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    const body = await request.json();
    const { days, checklistStatus, periodStart, periodEnd, attendanceAIReport } = body;

    const data: Record<string, unknown> = {};

    if (periodStart !== undefined) data.periodStart = new Date(periodStart);
    if (periodEnd !== undefined) data.periodEnd = new Date(periodEnd);
    if (attendanceAIReport !== undefined) data.attendanceAIReport = attendanceAIReport || null;

    if (Array.isArray(days)) {
      data.day1 = days[0] ?? false;
      data.day2 = days[1] ?? false;
      data.day3 = days[2] ?? false;
      data.day4 = days[3] ?? false;
      data.day5 = days[4] ?? false;
      data.day6 = days[5] ?? false;
      data.day7 = days[6] ?? false;
      data.day8 = days[7] ?? false;
      data.day9 = days[8] ?? false;
      data.day10 = days[9] ?? false;
      const completion = calculate10DayCompletion(days);
      data.completionPercent = completion;
      if (checklistStatus === undefined) {
        data.checklistStatus = completion === 100 ? "Complete" : completion > 0 ? "In Progress" : "Not Started";
      }
    }

    if (checklistStatus !== undefined) data.checklistStatus = checklistStatus;

    const record = await db.tenDayAttendance.update({ where: { id }, data });
    return NextResponse.json({ record });
  } catch (error) {
    console.error("Update 10-day attendance error:", error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

// ============================================================
// DELETE 10-DAY RECORD
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    await db.tenDayAttendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete 10-day attendance error:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
