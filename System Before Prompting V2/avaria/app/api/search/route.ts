// ============================================================
// AVARIA ACADEMY — GLOBAL SEARCH API
// Unified search across trainees, batches, and companies
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim() || "";
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], query });
  }

  try {
    // Search trainees
    const trainees = await db.trainee.findMany({
      where: {
        OR: [
          { traineeName: { contains: query } },
          { email: { contains: query } },
          { company: { contains: query } },
        ],
      },
      include: { batch: true },
      take: limit,
    });

    // Search companies (derived from trainees table)
    const companies = await db.trainee.groupBy({
      by: ["company"],
      where: {
        company: { contains: query, not: "" },
      },
      _count: { company: true },
      take: limit,
      orderBy: { _count: { company: "desc" } },
    });

    // Search batches
    const batches = await db.batch.findMany({
      where: {
        OR: [
          { batchName: { contains: query } },
          { status: { contains: query } },
        ],
      },
      take: limit,
    });

    // Format results
    const results = [
      ...trainees.map((t) => ({
        id: t.id,
        type: "trainee" as const,
        title: t.traineeName,
        subtitle: `${t.company} • ${t.batch?.batchName || "No Batch"}`,
        url: `/trainees/${t.id}`,
        meta: { company: t.company, email: t.email },
      })),
      ...companies
        .filter((c) => typeof c.company === "string" && c.company.trim().length > 0)
        .map((c) => ({
          id: String(c.company),
          type: "company" as const,
          title: String(c.company),
          subtitle: `${(c._count as { company?: number }).company ?? 0} trainees`,
          url: `/companies/${encodeURIComponent(String(c.company))}`,
          meta: { trainees: (c._count as { company?: number }).company ?? 0 },
        })),
      ...batches.map((b) => ({
        id: b.id,
        type: "batch" as const,
        title: b.batchName,
        subtitle: `${b.status} • ${b.totalTrainees} trainees`,
        url: `/batches/${b.id}`,
        meta: { status: b.status, trainees: b.totalTrainees },
      })),
    ];

    // Sort by relevance (exact match first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(query) ? 0 : 1;
      const bExact = b.title.toLowerCase().startsWith(query) ? 0 : 1;
      return aExact - bExact;
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      query,
      total: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], query, error: "Search failed" }, { status: 500 });
  }
}
