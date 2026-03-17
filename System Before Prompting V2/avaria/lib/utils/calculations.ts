// ============================================================
// RED ACADEMY — CALCULATION UTILITIES
// ============================================================

import { AssessmentOutcome, ChecklistStatus } from "@/types";

/**
 * Calculate minutes late after 11:00 AM threshold
 * Returns 0 if arrival is at or before 11:00 AM, or if no arrival time
 */
export function calculateMinutesLate(arrivalTime: Date | null): number {
  if (!arrivalTime) return 0;

  const arrival = new Date(arrivalTime);
  const elevenAM = new Date(arrival);
  elevenAM.setHours(11, 0, 0, 0);

  if (arrival <= elevenAM) return 0;

  return Math.floor((arrival.getTime() - elevenAM.getTime()) / (1000 * 60));
}

/**
 * Determine if arrival time is strictly after 11:00 AM
 */
export function wasLate(arrivalTime: Date | null): boolean {
  if (!arrivalTime) return false;

  const arrival = new Date(arrivalTime);
  const totalMinutes = arrival.getHours() * 60 + arrival.getMinutes();
  return totalMinutes > 660; // 11:00 AM = 660 minutes
}

/**
 * Calculate assessment scores
 */
export function calculateScores(assessment: {
  productKnowledge: number;
  mapping: number;
  presentability: number;
  softSkills: number;
}) {
  const techScore =
    ((assessment.productKnowledge + assessment.mapping) / 10) * 100;
  const softScore =
    ((assessment.softSkills + assessment.presentability) / 10) * 100;
  const overall =
    ((assessment.productKnowledge +
      assessment.mapping +
      assessment.presentability +
      assessment.softSkills) /
      20) *
    100;

  return {
    techScore: Math.round(techScore * 10) / 10,
    softScore: Math.round(softScore * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

/**
 * Determine assessment outcome based on overall percentage
 */
export function determineOutcome(overallPercent: number): AssessmentOutcome {
  if (overallPercent >= 95) return "Aced";
  if (overallPercent >= 85) return "Excellent";
  if (overallPercent >= 75) return "Very Good";
  if (overallPercent >= 65) return "Good";
  if (overallPercent >= 50) return "Needs Improvement";
  return "Failed";
}

/**
 * Calculate 10-day completion percentage
 */
export function calculate10DayCompletion(days: boolean[]): number {
  const completed = days.filter(Boolean).length;
  return Math.round((completed / 10) * 100);
}

/**
 * Determine checklist status based on completion
 */
export function determineChecklistStatus(
  completionPercent: number
): ChecklistStatus {
  if (completionPercent === 0) return "Not Started";
  if (completionPercent === 100) return "Complete";
  return "In Progress";
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercent(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/**
 * Format time from Date object
 */
export function formatTime(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date range
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endStr = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

/**
 * Generate entry ID for daily attendance
 */
export function generateEntryId(date: Date, traineeName: string): string {
  const dateStr = new Date(date).toISOString().split("T")[0];
  return `${dateStr} - ${traineeName}`;
}

/**
 * Generate record name for 10-day attendance
 */
export function generate10DayRecord(
  traineeName: string,
  batchName: string,
  startDate: Date,
  endDate: Date
): string {
  const start = new Date(startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const end = new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${traineeName} - ${batchName} (${start}–${end})`;
}

/**
 * Get color for assessment outcome
 */
export function getOutcomeColor(outcome: AssessmentOutcome): string {
  const colors: Record<AssessmentOutcome, string> = {
    Aced: "#10B981",
    Excellent: "#22C55E",
    "Very Good": "#84CC16",
    Good: "#F59E0B",
    "Needs Improvement": "#F97316",
    Failed: "#EF4444",
  };
  return colors[outcome];
}

/**
 * Get color for attendance status
 */
export function getStatusColor(
  status: "Present" | "Absent" | "Tour Day" | "Off Day" | "Late"
): string {
  const colors = {
    Present: "#10B981",
    Absent: "#EF4444",
    "Tour Day": "#3B82F6",
    "Off Day": "#6B7280",
    Late: "#F59E0B",
  };
  return colors[status];
}

/**
 * Calculate batch progress percentage
 */
export function calculateBatchProgress(start: Date, end: Date): number {
  const now = new Date();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const nowTime = now.getTime();

  if (nowTime <= startTime) return 0;
  if (nowTime >= endTime) return 100;

  return Math.round(((nowTime - startTime) / (endTime - startTime)) * 100);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
