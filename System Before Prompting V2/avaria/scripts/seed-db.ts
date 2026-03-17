// ============================================================
// AVARIA ACADEMY — DATABASE SEEDER
// Migrate existing JSON data to SQLite
// ============================================================

import { db, normalizeCompany, normalizeOutcome, normalizeAttendanceStatus, normalizeBatchStatus, parseTime } from "../lib/db";
import notionData from "../lib/notionData.json";

type TraineeData = typeof notionData.trainees[number];
type BatchData = typeof notionData.batches[number];
type DailyAttData = typeof notionData.dailyAttendance[number];
type TenDayData = typeof notionData.tenDayAttendance[number];
type AssessmentData = typeof notionData.assessments[number];

function normalizeKey(value: string | null | undefined): string {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function coerceTenDayFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return false;
  return (
    s === "true" ||
    s === "yes" ||
    s === "y" ||
    s === "1" ||
    s === "present" ||
    s === "late" ||
    s === "completed" ||
    s === "done"
  );
}

async function seed() {
  console.log("🚀 Starting database seed...\n");

  try {
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.assessment.deleteMany();
    await db.tenDayAttendance.deleteMany();
    await db.dailyAttendance.deleteMany();
    await db.trainee.deleteMany();
    await db.batch.deleteMany();

    // Seed batches
    console.log("📦 Seeding batches...");
    const batchMap = new Map<string, string>();
    
    for (const batch of notionData.batches as BatchData[]) {
      const created = await db.batch.create({
        data: {
          notionId: batch.id,
          batchName: batch.name || `Batch ${batch.id}`,
          status: normalizeBatchStatus(batch.status || "Planning"),
          startDate: batch.startDate ? new Date(batch.startDate) : new Date(),
          endDate: batch.endDate ? new Date(batch.endDate) : new Date(),
        },
      });
      batchMap.set(batch.id, created.id);
      batchMap.set(batch.name || batch.id, created.id);
      batchMap.set(normalizeKey(batch.name || batch.id), created.id);
    }
    console.log(`   ✅ Created ${notionData.batches.length} batches`);

    const fallbackBatchId = batchMap.get("Batch 31");
    if (!fallbackBatchId) {
      throw new Error("Seed error: expected 'Batch 31' to exist in batches seed data");
    }

    // Seed trainees
    console.log("👥 Seeding trainees...");
    const traineeMap = new Map<string, string>();
    
    for (const trainee of notionData.trainees as TraineeData[]) {
      // Find batch by batch name
      const batchId = batchMap.get(trainee.batch || "") || fallbackBatchId;

      const created = await db.trainee.create({
        data: {
          notionId: trainee.id,
          traineeName: trainee.name || "Unknown",
          company: normalizeCompany(trainee.company || "RED"),
          email: trainee.email || null,
          phone: trainee.phone || null,
          batchId,
        },
      });
      traineeMap.set(trainee.id, created.id);
      traineeMap.set(trainee.name || trainee.id, created.id);
      traineeMap.set(normalizeKey(trainee.name || trainee.id), created.id);
    }
    console.log(`   ✅ Created ${notionData.trainees.length} trainees`);

    // Seed daily attendance
    console.log("📅 Seeding daily attendance...");
    let attendanceCount = 0;
    
    for (const att of notionData.dailyAttendance as DailyAttData[]) {
      const traineeId = traineeMap.get(att.traineeId) || traineeMap.get(att.traineeName || "") || traineeMap.get(normalizeKey(att.traineeName));
      const batchId = batchMap.get(att.batchId) || batchMap.get(att.batchName || "") || batchMap.get(normalizeKey(att.batchName));
      
      if (!traineeId || !batchId) continue;

      const baseDate = att.date ? new Date(att.date) : new Date();
      const arrivalTime = parseTime(att.arrivalTime, baseDate);
      const departureTime = parseTime(att.departureTime, baseDate);

      try {
        await db.dailyAttendance.create({
          data: {
            notionId: att.id,
            entryId: `${att.date} - ${att.traineeName}`,
            date: att.date ? new Date(att.date) : new Date(),
            arrivalTime,
            departureTime,
            status: normalizeAttendanceStatus(att.status || "Present"),
            isLate: att.isLate || false,
            minutesLate: att.minutesLate || 0,
            traineeId,
            batchId,
          },
        });
        attendanceCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Created ${attendanceCount} attendance records`);

    // Seed 10-day attendance
    console.log("📊 Seeding 10-day attendance...");
    let tenDayCount = 0;
    
    for (const att of notionData.tenDayAttendance as TenDayData[]) {
      const traineeId = traineeMap.get(att.traineeId) || traineeMap.get(att.traineeName || "") || traineeMap.get(normalizeKey(att.traineeName));
      const batchId = batchMap.get(att.batchId) || batchMap.get(att.batchName || "") || batchMap.get(normalizeKey(att.batchName));
      
      if (!traineeId || !batchId) continue;

      try {
        // Parse days into individual booleans (supports both boolean[] and string status[])
        const days = (att as unknown as { days?: unknown[] }).days || [];
        const d = (i: number) => coerceTenDayFlag(days[i]);
        await db.tenDayAttendance.create({
          data: {
            notionId: att.id,
            record: `${att.traineeName} - ${att.batchName}`,
            periodStart: att.periodStart ? new Date(att.periodStart) : new Date(),
            periodEnd: att.periodEnd ? new Date(att.periodEnd) : new Date(),
            day1: d(0),
            day2: d(1),
            day3: d(2),
            day4: d(3),
            day5: d(4),
            day6: d(5),
            day7: d(6),
            day8: d(7),
            day9: d(8),
            day10: d(9),
            completionPercent: att.completionPercentage || 0,
            checklistStatus: att.completionPercentage === 100 ? "Complete" : att.completionPercentage > 0 ? "In Progress" : "Not Started",
            presentCount: att.presentCount || 0,
            absentCount: att.absentCount || 0,
            lateCount: att.lateCount || 0,
            traineeId,
            batchId,
          },
        });
        tenDayCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Created ${tenDayCount} 10-day records`);

    // Seed assessments
    console.log("📝 Seeding assessments...");
    let assessmentCount = 0;

    const assessmentCandidates = [...(notionData.assessments as AssessmentData[])].sort((a, b) => {
      const ao = (a as unknown as { overallScore?: number }).overallScore ?? 0;
      const bo = (b as unknown as { overallScore?: number }).overallScore ?? 0;
      return bo - ao;
    });
    const seenAssessmentForTrainee = new Set<string>();
    
    for (const assess of assessmentCandidates) {
      const traineeId = traineeMap.get(assess.traineeId) || traineeMap.get(assess.traineeName || "") || traineeMap.get(normalizeKey(assess.traineeName));
      const batchId = batchMap.get(assess.batchId) || batchMap.get(assess.batchName || "") || batchMap.get(normalizeKey(assess.batchName));
      
      if (!traineeId || !batchId) continue;
      if (seenAssessmentForTrainee.has(traineeId)) continue;

      const mapping = assess.mapping || 0;
      const productKnowledge = assess.productKnowledge || 0;
      const presentability = assess.presentability || 0;
      const softSkills = assess.softSkills || 0;
      
      const techScore = ((mapping + productKnowledge) / 10) * 100;
      const softScore = ((presentability + softSkills) / 10) * 100;
      const overallScore = (techScore + softScore) / 2;

      try {
        await db.assessment.create({
          data: {
            notionId: assess.id,
            assessmentTitle: `Assessment - ${assess.traineeName}`,
            mapping,
            productKnowledge,
            presentability,
            softSkills,
            attendance: 0,
            absence: 0,
            assessmentOutcome: normalizeOutcome(assess.outcome || "Good"),
            instructorComment: assess.instructorComment || null,
            company: normalizeCompany(assess.company || "RED"),
            techScorePercent: techScore,
            softScorePercent: softScore,
            overallPercent: overallScore,
            traineeId,
            batchId,
          },
        });
        assessmentCount++;
        seenAssessmentForTrainee.add(traineeId);
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Created ${assessmentCount} assessments`);

    // Update batch aggregations
    console.log("🔄 Updating batch aggregations...");
    const batches = await db.batch.findMany();
    for (const batch of batches) {
      const traineeCount = await db.trainee.count({ where: { batchId: batch.id } });
      const presentCount = await db.dailyAttendance.count({
        where: { batchId: batch.id, status: "Present" },
      });
      const totalAttendance = await db.dailyAttendance.count({ where: { batchId: batch.id } });

      const batchNumMatch = batch.batchName.match(/\bBatch\s+(\d+)\b/i);
      const batchNum = batchNumMatch ? Number(batchNumMatch[1]) : null;
      const attendanceEligible = batchNum != null && batchNum >= 28;
      
      await db.batch.update({
        where: { id: batch.id },
        data: {
          totalTrainees: traineeCount,
          avgAttendance: attendanceEligible && totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0,
        },
      });
    }

    // Final stats
    const stats = await db.$transaction([
      db.batch.count(),
      db.trainee.count(),
      db.dailyAttendance.count(),
      db.tenDayAttendance.count(),
      db.assessment.count(),
    ]);

    console.log("\n🎉 Seed completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Batches:          ${stats[0]}`);
    console.log(`   Trainees:         ${stats[1]}`);
    console.log(`   Daily Attendance: ${stats[2]}`);
    console.log(`   10-Day Records:   ${stats[3]}`);
    console.log(`   Assessments:      ${stats[4]}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seed();
