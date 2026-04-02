// ============================================================
// AVARIA ACADEMY — DATABASE CLIENT
// The Immortal Data Engine Connection
// ============================================================

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Prisma 7 requires a driver adapter for all engine types.
  // Use Turso in production; fall back to the local SQLite file in dev.
  const url =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql({
    url,
    ...(authToken ? { authToken } : {}),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Safely parses a date string, returning null if invalid
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Safely parses a time string (HH:MM format) to Date
 */
export function parseTime(timeStr: string | null | undefined, baseDate?: Date): Date | null {
  if (!timeStr) return null;
  
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  const date = baseDate ? new Date(baseDate) : new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Maps Notion company names to valid CompanyEnum values
 */
export function normalizeCompany(company: string): string {
  const validCompanies = [
    "RED", "Impact", "Housology", "Creed", "Med", "Petra",
    "New Levels", "Be Own", "Landbank", "Masr", "Masharef",
    "Core", "Dlleni", "Property Bank", "Misr Alaqareya", "RK",
    "BYOUT", "RED WINNERS", "SEVEN", "Perfect level", "Perfect Deal",
    "Roots", "Arabian Estate", "LIV", "Venture Investment", "Road investment",
    "Volume", "Hexdar", "Hexda", "Enlight", "Majestic", "Need",
    "Trio Homes", "Propertunity", "Block 89", "GC", "Caregenic",
    "Malaaz", "Great Castle", "Cartel", "Urban Nest", "Infinity Home",
    "Good People", "Alux Investement", "Elite Home", "SM", "Builidivia",
    "Premium Homes", "Units", "Next Estate", "Jumeirah", "3 Media",
    "Proj", "The Mediator", "Masharf", "Projex", "Florida", "CGI",
    "Casablanca", "EG Broker", "Elira"
  ];
  
  // Exact match
  const found = validCompanies.find(c => c.toLowerCase() === company.toLowerCase());
  if (found) return found;
  
  const partial = validCompanies.find(c => 
    company.toLowerCase().includes(c.toLowerCase()) || 
    c.toLowerCase().includes(company.toLowerCase())
  );
  if (partial) return partial;

  console.warn(`[normalizeCompany] Unknown company "${company}" — defaulting to "RED"`);
  return "RED";
}

/**
 * Maps assessment outcome strings to valid values
 */
export function normalizeOutcome(outcome: string): string {
  const lower = outcome.toLowerCase();
  if (lower.includes("aced")) return "Aced";
  if (lower.includes("excellent")) return "Excellent";
  if (lower.includes("very good")) return "Very Good";
  if (lower.includes("good")) return "Good";
  if (lower.includes("needs") || lower.includes("improvement")) return "Needs Improvement";
  if (lower.includes("fail")) return "Failed";
  return "Good";
}

/**
 * Maps attendance status strings to valid values
 */
export function normalizeAttendanceStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes("absent")) return "Absent";
  if (lower.includes("tour")) return "Tour Day";
  if (lower.includes("off")) return "Off Day";
  return "Present";
}

/**
 * Maps batch status strings to valid values
 */
export function normalizeBatchStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes("completed") || lower.includes("done")) return "Completed";
  if (lower.includes("active") || lower.includes("ongoing")) return "Active";
  return "Planning";
}

/**
 * Maps checklist status strings to valid values
 */
export function normalizeChecklistStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes("complete") && !lower.includes("not")) return "Complete";
  if (lower.includes("progress")) return "In Progress";
  return "Not Started";
}

export default db;
