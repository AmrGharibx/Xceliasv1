import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAttendanceEligible } from "@/lib/batchRules";
import { calculateScores, determineOutcome } from "@/lib/utils/calculations";
import { requireAuth } from "@/lib/auth";
import { createAssessmentSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const search = (sp.get("search") || "").trim();
  const outcome = sp.get("outcome") || "";
  const company = sp.get("company") || "";
  const batchId = sp.get("batchId") || "";
  const page = Number(sp.get("page") || "1");
  const pageSize = Number(sp.get("pageSize") || sp.get("limit") || "20");

  const skip = Math.max(0, (page - 1) * pageSize);

  try {
    const where: Record<string, unknown> = {};

    if (outcome) where.assessmentOutcome = outcome;
    if (company) where.company = company;
    if (batchId) where.batchId = batchId;

    if (search) {
      where.OR = [
        { assessmentTitle: { contains: search } },
        { trainee: { traineeName: { contains: search } } },
      ];
    }

    const [rows, total] = await Promise.all([
      db.assessment.findMany({
        where,
        include: {
          trainee: { select: { id: true, traineeName: true, company: true, batchId: true } },
          batch: { select: { id: true, batchName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.assessment.count({ where }),
    ]);

    // Attach attendance/absence from latest 10-day record when eligible (fallback to stored columns).
    const traineeIds = rows.map((r) => r.traineeId);
    const latestTenDay = await db.tenDayAttendance.findMany({
      where: { traineeId: { in: traineeIds } },
      orderBy: { periodStart: "desc" },
      select: { traineeId: true, presentCount: true, absentCount: true, batch: { select: { batchName: true } } },
    });

    const firstByTrainee = new Map<string, { present: number; absent: number; eligible: boolean }>();
    for (const r of latestTenDay) {
      if (firstByTrainee.has(r.traineeId)) continue;
      const eligible = isAttendanceEligible(r.batch?.batchName || null);
      firstByTrainee.set(r.traineeId, { present: r.presentCount ?? 0, absent: r.absentCount ?? 0, eligible });
    }

    const records = rows.map((a) => {
      const ten = firstByTrainee.get(a.traineeId);
      const eligible = ten?.eligible ?? isAttendanceEligible(a.batch?.batchName || null);
      const present = ten?.present ?? a.attendance;
      const absent = ten?.absent ?? a.absence;

      return {
        id: a.id,
        assessmentTitle: a.assessmentTitle,
        mapping: a.mapping,
        productKnowledge: a.productKnowledge,
        presentability: a.presentability,
        softSkills: a.softSkills,
        attendance: eligible ? Math.min(8, present) : null,
        absence: eligible ? Math.min(8, absent) : null,
        assessmentOutcome: a.assessmentOutcome,
        instructorComment: a.instructorComment,
        assessmentAIReport: a.assessmentAIReport,
        company: a.company,
        techScorePercent: a.techScorePercent,
        softScorePercent: a.softScorePercent,
        overallPercent: a.overallPercent,
        createdAt: a.createdAt,
        trainee: a.trainee,
        batch: a.batch,
      };
    });

    return NextResponse.json({
      assessments: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Assessments API error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}

// ============================================================
// CREATE ASSESSMENT
// ============================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(createAssessmentSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const {
      traineeId,
      batchId,
      assessmentTitle,
      productKnowledge,
      mapping,
      presentability,
      softSkills,
      assessmentOutcome,
      instructorComment,
    } = parsed.data;

    // Get trainee company (derive from trainee, don't require manual entry)
    const trainee = await db.trainee.findUnique({
      where: { id: traineeId },
      select: { company: true },
    });
    if (!trainee) {
      return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
    }

    const pk = Number(productKnowledge) || 0;
    const mp = Number(mapping) || 0;
    const pr = Number(presentability) || 0;
    const ss = Number(softSkills) || 0;

    const scores = calculateScores({
      productKnowledge: pk,
      mapping: mp,
      presentability: pr,
      softSkills: ss,
    });

    const outcome = assessmentOutcome || determineOutcome(scores.overall);

    const assessment = await db.assessment.create({
      data: {
        assessmentTitle: assessmentTitle || "Final",
        productKnowledge: pk,
        mapping: mp,
        presentability: pr,
        softSkills: ss,
        techScorePercent: scores.techScore,
        softScorePercent: scores.softScore,
        overallPercent: scores.overall,
        assessmentOutcome: outcome,
        instructorComment: instructorComment || null,
        company: trainee.company,
        traineeId,
        batchId,
      },
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error("Create assessment error:", error);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
