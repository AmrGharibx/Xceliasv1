// ============================================================
// AVARIA ACADEMY — TRAINEES LIST API
// Paginated trainee list with filtering
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAttendanceEligible } from "@/lib/batchRules";
import { requireAuth } from "@/lib/auth";
import { createTraineeSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const company = searchParams.get("company") || "";
  const batchId = searchParams.get("batchId") || "";

  const skip = (page - 1) * pageSize;

  try {
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { traineeName: { contains: search } },
        { email: { contains: search } },
      ];
    }
    
    if (company) {
      where.company = company;
    }
    
    if (batchId) {
      where.batchId = batchId;
    }

    // Get trainees with pagination
    const [trainees, total] = await Promise.all([
      db.trainee.findMany({
        where,
        include: {
          batch: { select: { id: true, batchName: true, status: true } },
          _count: {
            select: { dailyAttendance: true, tenDayAttendance: true },
          },
          assessments: { select: { id: true } },
        },
        orderBy: { traineeName: "asc" },
        skip,
        take: pageSize,
      }),
      db.trainee.count({ where }),
    ]);

    // Get unique companies for filter
    const companies = await db.trainee.groupBy({
      by: ["company"],
      _count: { _all: true },
      orderBy: { _count: { company: "desc" } },
    });

    return NextResponse.json({
      trainees: trainees.map((t) => ({
        id: t.id,
        name: t.traineeName,
        email: t.email,
        phone: t.phone,
        company: t.company,
        batchId: t.batchId,
        batchName: t.batch?.batchName || null,
        attendanceEligible: isAttendanceEligible(t.batch?.batchName || null),
        attendanceCount: isAttendanceEligible(t.batch?.batchName || null) ? t._count.dailyAttendance : null,
        assessmentCount: t.assessments.length,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      companies: companies.map((c) => c.company),
    });
  } catch (error) {
    console.error("Trainees list error:", error);
    return NextResponse.json({ error: "Failed to fetch trainees" }, { status: 500 });
  }
}

// ============================================================
// CREATE TRAINEE
// ============================================================

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = parseBody(createTraineeSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, email, phone, company, batchId } = parsed.data;

    const trainee = await db.trainee.create({
      data: {
        traineeName: name,
        email: email || null,
        phone: phone || null,
        company,
        batchId,
      },
    });

    return NextResponse.json({ trainee }, { status: 201 });
  } catch (error) {
    console.error("Create trainee error:", error);
    return NextResponse.json({ error: "Failed to create trainee" }, { status: 500 });
  }
}
