/**
 * Fix corrupt TenDayAttendance data for Batch 29 (and any other batch).
 * All records had presentCount = absentCount = lateCount = 2025 (year used as value).
 * This script recalculates each count from the actual day1–day10 boolean columns.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
const db = new PrismaClient({ adapter });

async function main() {
  // Find all TenDayAttendance records that look corrupt (any count > 10 → impossible)
  const corrupt = await db.tenDayAttendance.findMany({
    where: {
      OR: [
        { presentCount: { gt: 10 } },
        { absentCount: { gt: 10 } },
        { lateCount: { gt: 10 } },
      ],
    },
    select: {
      id: true,
      batchId: true,
      day1: true, day2: true, day3: true, day4: true, day5: true,
      day6: true, day7: true, day8: true, day9: true, day10: true,
      presentCount: true, absentCount: true, lateCount: true,
      batch: { select: { batchName: true } },
    },
  });

  console.log(`Found ${corrupt.length} corrupt records to fix.`);
  if (corrupt.length === 0) {
    console.log("Nothing to fix.");
    return;
  }

  let fixed = 0;
  for (const rec of corrupt) {
    const days = [rec.day1, rec.day2, rec.day3, rec.day4, rec.day5,
                  rec.day6, rec.day7, rec.day8, rec.day9, rec.day10];
    const presentCount = days.filter(Boolean).length;
    const absentCount = 10 - presentCount;
    const completionPercent = (presentCount / 10) * 100;

    await db.tenDayAttendance.update({
      where: { id: rec.id },
      data: {
        presentCount,
        absentCount,
        lateCount: 0,
        completionPercent,
        checklistStatus:
          presentCount === 10 ? "Complete" :
          presentCount > 0    ? "In Progress" :
                                "Not Started",
      },
    });
    fixed++;
  }

  console.log(`Fixed ${fixed} records.`);

  // Show a sample of Batch 29 after fix
  const sample = await db.tenDayAttendance.findMany({
    where: { batch: { batchName: { contains: "Batch 29" } } },
    select: { id: true, presentCount: true, absentCount: true, lateCount: true, completionPercent: true },
    take: 5,
  });
  console.log("Sample Batch 29 after fix:", JSON.stringify(sample, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
