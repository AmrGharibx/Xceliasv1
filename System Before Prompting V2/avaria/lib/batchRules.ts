export const ATTENDANCE_START_BATCH = 28;

export function parseBatchNumber(batchName: string | null | undefined): number | null {
  if (!batchName) return null;
  const match = batchName.match(/\bBatch\s*(\d+)\b/i);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
}

export function isAttendanceEligible(batchName: string | null | undefined): boolean {
  const num = parseBatchNumber(batchName);
  return num != null && num >= ATTENDANCE_START_BATCH;
}
