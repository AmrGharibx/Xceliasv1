// ============================================================
// AVARIA ACADEMY — VALIDATION SCHEMAS
// Zod schemas for all API inputs
// ============================================================

import { z } from "zod";

// ── Auth ────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// ── Batches ─────────────────────────────────────────────────

export const createBatchSchema = z.object({
  batchName: z.string().min(1, "Batch name is required").max(100),
  status: z.enum(["Planning", "Active", "Completed"]).default("Planning"),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid start date"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid end date"),
});

export const updateBatchSchema = createBatchSchema.partial();

// ── Trainees ────────────────────────────────────────────────

export const createTraineeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  company: z.string().min(1, "Company is required").max(100),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(20).optional().or(z.literal("")).nullable(),
  batchId: z.string().min(1, "Batch ID is required"),
});

export const updateTraineeSchema = createTraineeSchema.partial();

// ── Daily Attendance ────────────────────────────────────────

export const createDailyAttendanceSchema = z.object({
  traineeId: z.string().min(1),
  batchId: z.string().min(1),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  status: z.enum(["Present", "Absent", "Tour Day", "Off Day"]).default("Present"),
  arrivalTime: z.string().optional().nullable(),
  departureTime: z.string().optional().nullable(),
  absenceReason: z.string().optional().nullable(),
});

export const updateDailyAttendanceSchema = createDailyAttendanceSchema.partial();

// ── 10-Day Attendance ───────────────────────────────────────

export const createTenDaySchema = z.object({
  traineeId: z.string().min(1),
  batchId: z.string().min(1),
  periodStart: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid period start"),
  periodEnd: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid period end"),
  record: z.string().optional(),
  days: z.array(z.boolean()).max(10).optional(),
  checklistStatus: z.string().optional(),
  day1: z.boolean().default(false),
  day2: z.boolean().default(false),
  day3: z.boolean().default(false),
  day4: z.boolean().default(false),
  day5: z.boolean().default(false),
  day6: z.boolean().default(false),
  day7: z.boolean().default(false),
  day8: z.boolean().default(false),
  day9: z.boolean().default(false),
  day10: z.boolean().default(false),
});

export const updateTenDaySchema = createTenDaySchema.partial();

// ── Assessments ─────────────────────────────────────────────

export const createAssessmentSchema = z.object({
  traineeId: z.string().min(1),
  batchId: z.string().min(1),
  assessmentTitle: z.string().min(1, "Title is required").max(300),
  mapping: z.number().min(0).max(5).default(0),
  productKnowledge: z.number().min(0).max(5).default(0),
  presentability: z.number().min(0).max(5).default(0),
  softSkills: z.number().min(0).max(5).default(0),
  attendance: z.number().min(0).max(8).default(0),
  absence: z.number().min(0).max(8).default(0),
  assessmentOutcome: z.string().optional(),
  instructorComment: z.string().optional().nullable(),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

// ── Filter helpers ──────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
});

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// ── Utility ─────────────────────────────────────────────────

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return { error: messages.join("; ") };
  }
  return { data: result.data };
}

export function parseSearchParams<T>(schema: z.ZodType<T>, params: URLSearchParams): T {
  const obj: Record<string, string> = {};
  params.forEach((v, k) => { obj[k] = v; });
  return schema.parse(obj);
}
