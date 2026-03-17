// ============================================================
// AVARIA ACADEMY — CSV INGEST API
// The Smart Merge Algorithm: Zero Data Loss
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db, parseDate, parseTime, normalizeCompany, normalizeOutcome, normalizeAttendanceStatus, normalizeBatchStatus, normalizeChecklistStatus } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// CSV parsing utility
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.replace(/^"|"$/g, "") || "";
    });
    rows.push(row);
  }
  
  return rows;
}

// Generate unique ID from row data
function generateNotionId(row: Record<string, string>, type: string): string {
  const name = row["Name"] || row["Trainee Name"] || row["name"] || "";
  const date = row["Date"] || row["date"] || "";
  const batch = row["Batch"] || row["batch"] || "";
  return `${type}-${name}-${batch}-${date}`.toLowerCase().replace(/\s+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string; // batches | trainees | attendance | assessments | tenday
    
    if (!file || !fileType) {
      return NextResponse.json(
        { success: false, error: "Missing file or type" },
        { status: 400 }
      );
    }

    // Create import record
    const importRecord = await db.dataImport.create({
      data: {
        fileName: file.name,
        fileType,
        status: "processing",
      },
    });

    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    let recordsNew = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    // Process based on type
    switch (fileType) {
      case "batches":
        for (const row of rows) {
          try {
            const notionId = row["ID"] || generateNotionId(row, "batch");
            const batchName = row["Name"] || row["Batch Name"] || `Batch ${notionId}`;
            const status = normalizeBatchStatus(row["Status"] || "Planning");
            const startDate = parseDate(row["Start Date"]) || new Date();
            const endDate = parseDate(row["End Date"]) || new Date();

            const result = await db.batch.upsert({
              where: { notionId },
              update: {
                batchName,
                status,
                startDate,
                endDate,
                dataVersion: { increment: 1 },
              },
              create: {
                notionId,
                batchName,
                status,
                startDate,
                endDate,
              },
            });
            
            if (result.dataVersion === 1) recordsNew++;
            else recordsUpdated++;
          } catch (e) {
            errors.push(`Batch row error: ${e}`);
            recordsSkipped++;
          }
        }
        break;

      case "trainees":
        for (const row of rows) {
          try {
            const notionId = row["ID"] || generateNotionId(row, "trainee");
            const traineeName = row["Name"] || row["Trainee Name"] || "Unknown";
            const company = normalizeCompany(row["Company"] || "RED");
            const email = row["Email"] || null;
            const phone = row["Phone"] || null;
            const batchName = row["Batch"] || row["Batch Name"] || "";

            // Find or create batch
            let batch = await db.batch.findFirst({
              where: { batchName: { contains: batchName } },
            });
            
            if (!batch) {
              batch = await db.batch.create({
                data: {
                  notionId: `batch-${batchName}`.toLowerCase().replace(/\s+/g, "-"),
                  batchName: batchName || "Default Batch",
                  status: "Active",
                  startDate: new Date(),
                  endDate: new Date(),
                },
              });
            }

            const result = await db.trainee.upsert({
              where: { notionId },
              update: {
                traineeName,
                company,
                email,
                phone,
                batchId: batch.id,
                dataVersion: { increment: 1 },
              },
              create: {
                notionId,
                traineeName,
                company,
                email,
                phone,
                batchId: batch.id,
              },
            });

            if (result.dataVersion === 1) recordsNew++;
            else recordsUpdated++;
          } catch (e) {
            errors.push(`Trainee row error: ${e}`);
            recordsSkipped++;
          }
        }
        break;

      case "attendance":
        for (const row of rows) {
          try {
            const traineeName = row["Trainee"] || row["Name"] || row["Trainee Name"] || "";
            const dateStr = row["Date"] || "";
            const date = parseDate(dateStr);
            
            if (!date || !traineeName) {
              recordsSkipped++;
              continue;
            }

            const notionId = row["ID"] || `att-${traineeName}-${dateStr}`.toLowerCase().replace(/\s+/g, "-");
            const entryId = row["Entry ID"] || `${dateStr} - ${traineeName}`;
            const arrivalTime = parseTime(row["Arrival Time"] || row["Time In"], date);
            const departureTime = parseTime(row["Departure Time"] || row["Time Out"], date);
            const status = normalizeAttendanceStatus(row["Status"] || "Present");
            const isLate = row["Late"]?.toLowerCase() === "true" || row["Is Late"]?.toLowerCase() === "yes";
            const minutesLate = parseInt(row["Minutes Late"] || "0") || 0;

            // Find trainee
            let trainee = await db.trainee.findFirst({
              where: { traineeName: { contains: traineeName } },
              include: { batch: true },
            });

            if (!trainee) {
              // Create trainee with default batch if not found
              let defaultBatch = await db.batch.findFirst({ where: { batchName: "Default Batch" } });
              if (!defaultBatch) {
                defaultBatch = await db.batch.create({
                  data: {
                    notionId: "batch-default",
                    batchName: "Default Batch",
                    status: "Active",
                    startDate: new Date(),
                    endDate: new Date(),
                  },
                });
              }
              
              trainee = await db.trainee.create({
                data: {
                  notionId: `trainee-${traineeName}`.toLowerCase().replace(/\s+/g, "-"),
                  traineeName,
                  company: "RED",
                  batchId: defaultBatch.id,
                },
                include: { batch: true },
              });
            }

            const result = await db.dailyAttendance.upsert({
              where: { notionId },
              update: {
                entryId,
                date,
                arrivalTime,
                departureTime,
                status,
                isLate,
                minutesLate,
                dataVersion: { increment: 1 },
              },
              create: {
                notionId,
                entryId,
                date,
                arrivalTime,
                departureTime,
                status,
                isLate,
                minutesLate,
                traineeId: trainee.id,
                batchId: trainee.batch!.id,
              },
            });

            if (result.dataVersion === 1) recordsNew++;
            else recordsUpdated++;
          } catch (e) {
            errors.push(`Attendance row error: ${e}`);
            recordsSkipped++;
          }
        }
        break;

      case "tenday":
        for (const row of rows) {
          try {
            const traineeName = row["Trainee"] || row["Name"] || "";
            const record = row["Record"] || row["Period"] || "";
            const periodStart = parseDate(row["Period Start"] || row["Start Date"]);
            const periodEnd = parseDate(row["Period End"] || row["End Date"]);

            if (!traineeName || !periodStart || !periodEnd) {
              recordsSkipped++;
              continue;
            }

            const notionId = row["ID"] || `10day-${traineeName}-${periodStart.toISOString()}`.toLowerCase().replace(/\s+/g, "-");

            // Find trainee
            const trainee = await db.trainee.findFirst({
              where: { traineeName: { contains: traineeName } },
              include: { batch: true },
            });

            if (!trainee) {
              recordsSkipped++;
              continue;
            }

            const result = await db.tenDayAttendance.upsert({
              where: { notionId },
              update: {
                record,
                periodStart,
                periodEnd,
                day1: row["Day 1"]?.toLowerCase() === "true",
                day2: row["Day 2"]?.toLowerCase() === "true",
                day3: row["Day 3"]?.toLowerCase() === "true",
                day4: row["Day 4"]?.toLowerCase() === "true",
                day5: row["Day 5"]?.toLowerCase() === "true",
                day6: row["Day 6"]?.toLowerCase() === "true",
                day7: row["Day 7"]?.toLowerCase() === "true",
                day8: row["Day 8"]?.toLowerCase() === "true",
                day9: row["Day 9"]?.toLowerCase() === "true",
                day10: row["Day 10"]?.toLowerCase() === "true",
                completionPercent: parseFloat(row["Completion %"] || "0"),
                checklistStatus: normalizeChecklistStatus(row["Status"] || "Not Started"),
                presentCount: parseInt(row["Present"] || "0") || 0,
                absentCount: parseInt(row["Absent"] || "0") || 0,
                lateCount: parseInt(row["Late"] || "0") || 0,
                dataVersion: { increment: 1 },
              },
              create: {
                notionId,
                record,
                periodStart,
                periodEnd,
                day1: row["Day 1"]?.toLowerCase() === "true",
                day2: row["Day 2"]?.toLowerCase() === "true",
                day3: row["Day 3"]?.toLowerCase() === "true",
                day4: row["Day 4"]?.toLowerCase() === "true",
                day5: row["Day 5"]?.toLowerCase() === "true",
                day6: row["Day 6"]?.toLowerCase() === "true",
                day7: row["Day 7"]?.toLowerCase() === "true",
                day8: row["Day 8"]?.toLowerCase() === "true",
                day9: row["Day 9"]?.toLowerCase() === "true",
                day10: row["Day 10"]?.toLowerCase() === "true",
                completionPercent: parseFloat(row["Completion %"] || "0"),
                checklistStatus: normalizeChecklistStatus(row["Status"] || "Not Started"),
                presentCount: parseInt(row["Present"] || "0") || 0,
                absentCount: parseInt(row["Absent"] || "0") || 0,
                lateCount: parseInt(row["Late"] || "0") || 0,
                traineeId: trainee.id,
                batchId: trainee.batch!.id,
              },
            });

            if (result.dataVersion === 1) recordsNew++;
            else recordsUpdated++;
          } catch (e) {
            errors.push(`10-day row error: ${e}`);
            recordsSkipped++;
          }
        }
        break;

      case "assessments":
        for (const row of rows) {
          try {
            const traineeName = row["Trainee"] || row["Name"] || "";
            const notionId = row["ID"] || `assess-${traineeName}`.toLowerCase().replace(/\s+/g, "-");

            // Find trainee
            const trainee = await db.trainee.findFirst({
              where: { traineeName: { contains: traineeName } },
              include: { batch: true },
            });

            if (!trainee) {
              recordsSkipped++;
              continue;
            }

            const mapping = parseFloat(row["Mapping"] || "0");
            const productKnowledge = parseFloat(row["Product Knowledge"] || "0");
            const presentability = parseFloat(row["Presentability"] || "0");
            const softSkills = parseFloat(row["Soft Skills"] || "0");
            
            const techScore = ((mapping + productKnowledge) / 10) * 100;
            const softScore = ((presentability + softSkills) / 10) * 100;
            const overallScore = (techScore + softScore) / 2;

            // Find existing assessment by notionId or traineeId (latest)
            const existing = notionId
              ? await db.assessment.findFirst({ where: { notionId } })
              : await db.assessment.findFirst({ where: { traineeId: trainee.id }, orderBy: { createdAt: "desc" } });

            if (existing) {
              await db.assessment.update({
                where: { id: existing.id },
                data: {
                  assessmentTitle: row["Title"] || row["Assessment Title"] || `Assessment - ${traineeName}`,
                  mapping,
                  productKnowledge,
                  presentability,
                  softSkills,
                  attendance: parseFloat(row["Attendance"] || "0"),
                  absence: parseFloat(row["Absence"] || "0"),
                  assessmentOutcome: normalizeOutcome(row["Outcome"] || row["Result"] || "Good"),
                  instructorComment: row["Comment"] || row["Instructor Comment"] || null,
                  company: normalizeCompany(row["Company"] || trainee.company),
                  techScorePercent: techScore,
                  softScorePercent: softScore,
                  overallPercent: overallScore,
                  dataVersion: { increment: 1 },
                },
              });
              recordsUpdated++;
            } else {
              await db.assessment.create({
                data: {
                  notionId,
                  assessmentTitle: row["Title"] || row["Assessment Title"] || `Assessment - ${traineeName}`,
                  mapping,
                  productKnowledge,
                  presentability,
                  softSkills,
                  attendance: parseFloat(row["Attendance"] || "0"),
                  absence: parseFloat(row["Absence"] || "0"),
                  assessmentOutcome: normalizeOutcome(row["Outcome"] || row["Result"] || "Good"),
                  instructorComment: row["Comment"] || row["Instructor Comment"] || null,
                  company: normalizeCompany(row["Company"] || trainee.company),
                  techScorePercent: techScore,
                  softScorePercent: softScore,
                  overallPercent: overallScore,
                  traineeId: trainee.id,
                  batchId: trainee.batch!.id,
                },
              });
              recordsNew++;
            }
          } catch (e) {
            errors.push(`Assessment row error: ${e}`);
            recordsSkipped++;
          }
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown file type: ${fileType}` },
          { status: 400 }
        );
    }

    // Update import record
    await db.dataImport.update({
      where: { id: importRecord.id },
      data: {
        recordsTotal: rows.length,
        recordsNew,
        recordsUpdated,
        recordsSkipped,
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        errorLog: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
        completedAt: new Date(),
      },
    });

    // Log the import
    await db.systemLog.create({
      data: {
        level: "info",
        message: `CSV Import completed: ${file.name}`,
        context: JSON.stringify({
          fileType,
          total: rows.length,
          new: recordsNew,
          updated: recordsUpdated,
          skipped: recordsSkipped,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        importId: importRecord.id,
        fileName: file.name,
        fileType,
        recordsTotal: rows.length,
        recordsNew,
        recordsUpdated,
        recordsSkipped,
        errors: errors.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// GET: Retrieve import history
export async function GET() {
  try {
    const imports = await db.dataImport.findMany({
      orderBy: { importedAt: "desc" },
      take: 50,
    });

    const stats = await db.$transaction([
      db.batch.count(),
      db.trainee.count(),
      db.dailyAttendance.count(),
      db.tenDayAttendance.count(),
      db.assessment.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        imports,
        stats: {
          batches: stats[0],
          trainees: stats[1],
          dailyAttendance: stats[2],
          tenDayAttendance: stats[3],
          assessments: stats[4],
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
