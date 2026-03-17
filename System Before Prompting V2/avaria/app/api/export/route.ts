import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "all";

  try {
    const data: Record<string, unknown> = {};

    if (type === "all" || type === "trainees") {
      const trainees = await db.trainee.findMany({
        include: { batch: { select: { batchName: true } }, assessments: { orderBy: { createdAt: "desc" as const }, take: 1 } },
        orderBy: { traineeName: "asc" },
      });
      data.trainees = trainees.map((t) => ({
        name: t.traineeName,
        email: t.email,
        phone: t.phone,
        company: t.company,
        batch: t.batch?.batchName ?? "",
        assessmentOutcome: t.assessments[0]?.assessmentOutcome ?? "",
        overallPercent: t.assessments[0]?.overallPercent ?? "",
      }));
    }

    if (type === "all" || type === "batches") {
      const batches = await db.batch.findMany({
        include: { _count: { select: { trainees: true } } },
        orderBy: { startDate: "desc" },
      });
      data.batches = batches.map((b) => ({
        name: b.batchName,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate,
        traineeCount: b._count.trainees,
      }));
    }

    if (type === "all" || type === "assessments") {
      const assessments = await db.assessment.findMany({
        include: {
          trainee: { select: { traineeName: true, company: true } },
          batch: { select: { batchName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      data.assessments = assessments.map((a) => ({
        trainee: a.trainee.traineeName,
        company: a.trainee.company,
        batch: a.batch.batchName,
        title: a.assessmentTitle,
        mapping: a.mapping,
        productKnowledge: a.productKnowledge,
        presentability: a.presentability,
        softSkills: a.softSkills,
        techScore: a.techScorePercent,
        softScore: a.softScorePercent,
        overall: a.overallPercent,
        outcome: a.assessmentOutcome,
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
