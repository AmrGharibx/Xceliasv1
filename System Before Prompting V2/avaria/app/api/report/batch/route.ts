import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  const company = searchParams.get('company');

  if (!batchId || !company) {
    return NextResponse.json({ error: 'batchId and company required' }, { status: 400 });
  }

  const batch = await db.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const assessments = await db.assessment.findMany({
    where: { batchId, company },
    include: { trainee: { select: { traineeName: true, absentDays: true, lateDays: true } } },
    orderBy: { trainee: { traineeName: 'asc' } },
  });

  // Outcome normalisation: maps DB values to report generator labels
  function normaliseOutcome(raw: string): string {
    const s = raw.trim().toLowerCase();
    if (s === 'aced') return 'Aced';
    if (s === 'excellent') return 'Excellent';
    if (s === 'very good' || s === 'good') return 'Good';
    if (s === 'needs improvement' || s === 'passed') return 'Passed';
    if (s === 'failed') return 'Failed';
    return 'Passed';
  }

  function badgeCls(r: string): string {
    return ({ Aced: 'b-green', Excellent: 'b-blue', Good: 'b-yellow', Passed: 'b-gray', Failed: 'b-red' } as Record<string, string>)[r] ?? 'b-gray';
  }

  const trainees = assessments.map(a => {
    const pk = a.productKnowledge;
    const mp = a.mapping;
    const ss = a.softSkills;
    const pr = a.presentability;

    const techScorePercent    = Math.round(((pk + mp) / 10) * 100 * 10) / 10;
    const softScorePercent    = Math.round(((ss + pr) / 10) * 100 * 10) / 10;
    const overallScore        = Math.round(((techScorePercent + softScorePercent) / 2) * 10) / 10;
    const totalCore           = pk + mp;
    const profRatingScore     = ss + pr;

    const assessmentResult    = normaliseOutcome(a.assessmentOutcome);
    const badge               = badgeCls(assessmentResult);

    const attendanceDays      = a.attendance > 0 ? a.attendance : 'N/A';
    const absent              = Math.round(a.absence || a.trainee.absentDays || 0);
    const late                = a.trainee.lateDays > 0 ? a.trainee.lateDays : 'N/A';

    return {
      name: a.trainee.traineeName,
      company,
      batch: batch.batchName,
      overallScore,
      assessmentResult,
      rawAssessmentOutcome: a.assessmentOutcome,
      badgeClass: badge,
      scores: {
        productKnowledge:       { score: pk, max: 5 },
        mapping:                { score: mp, max: 5 },
        softSkills:             { score: ss, max: 5 },
        presentability:         { score: pr, max: 5 },
        techScorePercent,
        softScorePercent,
        totalCore,
        professionalConductRating: { score: profRatingScore, max: 10 },
      },
      attendance: {
        attendanceDays,
        absent,
        late,
        missedContent: 'N/A',
      },
      comments: a.instructorComment ?? '',
    };
  });

  return NextResponse.json({
    batch: {
      id: batch.id,
      name: batch.batchName,
      status: batch.status,
      startDate: batch.startDate,
      endDate: batch.endDate,
    },
    company,
    trainees,
  });
}
