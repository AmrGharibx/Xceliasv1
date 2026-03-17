import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const company = decodeURIComponent(name);

  try {
    const trainees = await db.trainee.findMany({
      where: { company },
      select: {
        id: true,
        traineeName: true,
        batch: { select: { id: true, batchName: true, status: true } },
        completionPercent: true,
        assessments: {
          select: { overallPercent: true, assessmentOutcome: true },
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
      },
      orderBy: [{ traineeName: "asc" }],
    });

    const totals = {
      trainees: trainees.length,
      avgScore:
        trainees.length > 0
          ? Math.round(
              trainees.reduce((sum, t) => sum + (t.assessments[0]?.overallPercent ?? 0), 0) /
                trainees.length
            )
          : 0,
      completion:
        trainees.length > 0
          ? Math.round(
              trainees.reduce((sum, t) => sum + (t.completionPercent ?? 0), 0) /
                trainees.length
            )
          : 0,
    };

    const byBatch = new Map<string, { batchId: string; batchName: string; status: string; trainees: number }>();
    for (const t of trainees) {
      const key = t.batch.id;
      const existing = byBatch.get(key);
      if (existing) existing.trainees += 1;
      else {
        byBatch.set(key, {
          batchId: t.batch.id,
          batchName: t.batch.batchName,
          status: t.batch.status,
          trainees: 1,
        });
      }
    }

    return NextResponse.json({
      company: { name: company },
      totals,
      batches: Array.from(byBatch.values()).sort((a, b) => a.batchName.localeCompare(b.batchName)),
      trainees: trainees.map((t) => {
        const latestAssessment = t.assessments[0] ?? null;
        return {
          id: t.id,
          name: t.traineeName,
          batch: t.batch,
          completionPercent: Math.round((t.completionPercent ?? 0) + Number.EPSILON),
          assessment: latestAssessment
            ? {
                overallPercent: Math.round((latestAssessment.overallPercent ?? 0) + Number.EPSILON),
                outcome: latestAssessment.assessmentOutcome,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("Company detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company detail" },
      { status: 500 }
    );
  }
}
