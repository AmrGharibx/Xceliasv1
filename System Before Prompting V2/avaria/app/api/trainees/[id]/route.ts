// ============================================================
// AVARIA ACADEMY — TRAINEE PROFILE API
// 360° Trainee view with full history
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_START_BATCH, isAttendanceEligible } from "@/lib/batchRules";
import { requireAuth } from "@/lib/auth";
import { updateTraineeSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get trainee with all related data
    const trainee = await db.trainee.findUnique({
      where: { id },
      include: {
        batch: true,
        dailyAttendance: {
          orderBy: { date: "desc" },
          take: 30,
        },
        tenDayAttendance: {
          orderBy: { periodStart: "desc" },
          take: 5,
        },
        assessments: {
          orderBy: { createdAt: "desc" as const },
        },
      },
    });

    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    const attendanceEligible = isAttendanceEligible(trainee.batch?.batchName || null);

    // Calculate attendance stats
    const attendanceRecords = attendanceEligible ? trainee.dailyAttendance : [];
    const presentCount = attendanceRecords.filter((a) => a.status === "Present").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "Absent").length;
    const lateCount = attendanceRecords.filter((a) => a.isLate).length;
    const totalRecords = attendanceRecords.length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    // Assessment data (multiple assessments per trainee)
    const assessments = trainee.assessments;
    const latestAssessment = assessments[0];
    const avgScore = latestAssessment ? Math.round(latestAssessment.overallPercent) : 0;

    // Get latest 10-day completion
    const latest10Day = attendanceEligible ? trainee.tenDayAttendance[0] : undefined;
    const completionPercent = latest10Day?.completionPercent || 0;

    // Format response
    const profile = {
      id: trainee.id,
      name: trainee.traineeName,
      email: trainee.email,
      phone: trainee.phone,
      company: trainee.company,
      batch: trainee.batch ? {
        id: trainee.batch.id,
        name: trainee.batch.batchName,
        status: trainee.batch.status,
        startDate: trainee.batch.startDate,
        endDate: trainee.batch.endDate,
      } : null,
      stats: {
        attendanceEligible,
        attendanceStartBatch: ATTENDANCE_START_BATCH,
        attendanceRate,
        presentCount,
        absentCount,
        lateCount,
        totalRecords,
        avgAssessmentScore: avgScore,
        completionPercent,
        assessmentCount: assessments.length,
      },
      recentAttendance: attendanceRecords.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        isLate: a.isLate,
        arrivalTime: a.arrivalTime,
        departureTime: a.departureTime,
      })),
      tenDayProgress: (attendanceEligible ? trainee.tenDayAttendance : []).map((t) => ({
        id: t.id,
        periodStart: t.periodStart,
        periodEnd: t.periodEnd,
        completionPercent: t.completionPercent,
        checklistStatus: t.checklistStatus,
        days: [t.day1, t.day2, t.day3, t.day4, t.day5, t.day6, t.day7, t.day8, t.day9, t.day10],
      })),
      assessments: assessments.map((a) => ({
        id: a.id,
        title: a.assessmentTitle,
        date: a.createdAt,
        mapping: a.mapping,
        productKnowledge: a.productKnowledge,
        presentability: a.presentability,
        softSkills: a.softSkills,
        techScore: a.techScorePercent,
        softScore: a.softScorePercent,
        overallScore: a.overallPercent,
        outcome: a.assessmentOutcome,
        comment: a.instructorComment,
      })),
      createdAt: trainee.createdAt,
      updatedAt: trainee.updatedAt,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Trainee profile error:", error);
    return NextResponse.json({ error: "Failed to fetch trainee" }, { status: 500 });
  }
}

// ============================================================
// UPDATE TRAINEE
// ============================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(updateTraineeSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, email, phone, company, batchId } = parsed.data;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.traineeName = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (company !== undefined) data.company = company;
    if (batchId !== undefined) data.batchId = batchId;

    const trainee = await db.trainee.update({
      where: { id },
      data,
    });

    return NextResponse.json({ trainee });
  } catch (error) {
    console.error("Update trainee error:", error);
    return NextResponse.json({ error: "Failed to update trainee" }, { status: 500 });
  }
}

// ============================================================
// DELETE TRAINEE
// ============================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    // Delete related records first
    await db.dailyAttendance.deleteMany({ where: { traineeId: id } });
    await db.tenDayAttendance.deleteMany({ where: { traineeId: id } });
    await db.assessment.deleteMany({ where: { traineeId: id } });
    await db.trainee.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trainee error:", error);
    return NextResponse.json({ error: "Failed to delete trainee" }, { status: 500 });
  }
}
