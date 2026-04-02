import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateScores, determineOutcome } from "@/lib/utils/calculations";
import { requireAuth } from "@/lib/auth";
import { updateAssessmentSchema, parseBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

// ============================================================
// GET SINGLE ASSESSMENT
// ============================================================
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const assessment = await db.assessment.findUnique({
      where: { id },
      include: {
        trainee: { select: { id: true, traineeName: true, company: true } },
        batch: { select: { id: true, batchName: true } },
      },
    });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Get assessment error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}

// ============================================================
// UPDATE ASSESSMENT
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    const body = await request.json();
    
    // Validate input with Zod
    const parsed = parseBody(updateAssessmentSchema, body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    
    const {
      assessmentTitle,
      productKnowledge,
      mapping,
      presentability,
      softSkills,
      assessmentOutcome,
      instructorComment,
    } = parsed.data;
    const assessmentAIReport = body.assessmentAIReport;

    const data: Record<string, unknown> = {};

    if (assessmentTitle !== undefined) data.assessmentTitle = assessmentTitle;
    if (instructorComment !== undefined) data.instructorComment = instructorComment || null;
    if (assessmentAIReport !== undefined) data.assessmentAIReport = assessmentAIReport || null;

    // Recalculate scores if any score field changed
    const hasScoreChange = [productKnowledge, mapping, presentability, softSkills].some(v => v !== undefined);
    if (hasScoreChange) {
      // Need current values for fields not being updated
      const current = await db.assessment.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
      }

      const pk = productKnowledge !== undefined ? Number(productKnowledge) : current.productKnowledge;
      const mp = mapping !== undefined ? Number(mapping) : current.mapping;
      const pr = presentability !== undefined ? Number(presentability) : current.presentability;
      const ss = softSkills !== undefined ? Number(softSkills) : current.softSkills;

      data.productKnowledge = pk;
      data.mapping = mp;
      data.presentability = pr;
      data.softSkills = ss;

      const scores = calculateScores({ productKnowledge: pk, mapping: mp, presentability: pr, softSkills: ss });
      data.techScorePercent = scores.techScore;
      data.softScorePercent = scores.softScore;
      data.overallPercent = scores.overall;

      // Auto-determine outcome if not manually set
      if (assessmentOutcome !== undefined) {
        data.assessmentOutcome = assessmentOutcome;
      } else {
        data.assessmentOutcome = determineOutcome(scores.overall);
      }
    } else if (assessmentOutcome !== undefined) {
      data.assessmentOutcome = assessmentOutcome;
    }

    const assessment = await db.assessment.update({ where: { id }, data });
    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Update assessment error:", error);
    return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
  }
}

// ============================================================
// DELETE ASSESSMENT
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAuth();
    await db.assessment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete assessment error:", error);
    return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
  }
}
