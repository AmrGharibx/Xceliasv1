import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const companies = await db.trainee.groupBy({
      by: ["company"],
      _count: { _all: true },
      orderBy: { _count: { company: "desc" } },
    });

    const companyNames = companies.map((c) => c.company);

    const [avgScores, avgCompletion] = await Promise.all([
      db.assessment.groupBy({
        by: ["company"],
        where: { company: { in: companyNames } },
        _avg: { overallPercent: true },
      }),
      db.tenDayAttendance.groupBy({
        by: ["traineeId"],
        _max: { completionPercent: true },
      }),
    ]);

    const avgScoreMap = new Map(avgScores.map((a) => [a.company, Math.round((a._avg.overallPercent ?? 0) * 10) / 10]));

    // Completion: approximate as avg of each trainee's max completion percent per company.
    const trainees = await db.trainee.findMany({
      select: { id: true, company: true },
    });

    const traineeMaxCompletion = new Map(avgCompletion.map((t) => [t.traineeId, t._max.completionPercent ?? 0]));

    const completionSum = new Map<string, { sum: number; count: number }>();
    for (const t of trainees) {
      const v = traineeMaxCompletion.get(t.id) ?? 0;
      const entry = completionSum.get(t.company) ?? { sum: 0, count: 0 };
      entry.sum += v;
      entry.count += 1;
      completionSum.set(t.company, entry);
    }

    const list = companies.map((c) => {
      const count = typeof c._count === "object" ? (c._count as { _all?: number })._all ?? 0 : 0;
      const comp = completionSum.get(c.company);
      const completion = comp && comp.count > 0 ? Math.round((comp.sum / comp.count) * 10) / 10 : 0;

      return {
        name: c.company,
        trainees: count,
        avgScore: avgScoreMap.get(c.company) ?? 0,
        completion,
      };
    });

    const topByScore = [...list].sort((a, b) => b.avgScore - a.avgScore).slice(0, 8);

    return NextResponse.json({
      companies: list,
      topPerformers: topByScore,
      totals: {
        companies: list.length,
        trainees: list.reduce((s, c) => s + c.trainees, 0),
      },
    });
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
