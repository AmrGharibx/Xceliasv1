// ============================================================
// RED ACADEMY — TYPE DEFINITIONS
// ============================================================

// Company Enum (60+ Real Estate Companies)
export type CompanyEnum =
  | "RED" | "Impact" | "Housology" | "Creed" | "Med" | "Petra"
  | "New Levels" | "Be Own" | "Landbank" | "Masr" | "Masharef"
  | "Core" | "Dlleni" | "Property Bank" | "Misr Alaqareya" | "RK"
  | "BYOUT" | "RED WINNERS" | "SEVEN" | "Perfect level" | "Perfect Deal"
  | "Roots" | "Arabian Estate" | "LIV" | "Venture Investment" | "Road investment"
  | "Volume" | "Hexdar" | "Hexda" | "Enlight" | "Majestic" | "Need"
  | "Trio Homes" | "Propertunity" | "Block 89" | "GC" | "Caregenic"
  | "Malaaz" | "Great Castle" | "Cartel" | "Urban Nest" | "Infinity Home"
  | "Good People" | "Alux Investement" | "Elite Home" | "SM" | "Builidivia"
  | "Premium Homes" | "Units" | "Next Estate" | "Jumeirah" | "3 Media"
  | "Proj" | "The Mediator" | "Masharf" | "Projex" | "Florida" | "CGI"
  | "Casablanca" | "EG Broker" | "Elira";

export const COMPANIES: CompanyEnum[] = [
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

// Batch Status
export type BatchStatus = "Planning" | "Active" | "Completed";

// Attendance Status
export type AttendanceStatus = "Present" | "Absent" | "Tour Day" | "Off Day";

// Checklist Status
export type ChecklistStatus = "Not Started" | "In Progress" | "Complete";

// Assessment Outcome
export type AssessmentOutcome =
  | "Failed"
  | "Needs Improvement"
  | "Good"
  | "Very Good"
  | "Excellent"
  | "Aced";

// User Role
export type UserRole = "admin" | "instructor" | "viewer";

// ============================================================
// CORE ENTITIES
// ============================================================

export interface Batch {
  id: string;
  batchName: string;
  status: BatchStatus;
  dateRange: {
    start: Date;
    end: Date;
  };
  // Relations
  trainees: Trainee[];
  attendanceLogs: DailyAttendance[];
  attendance10DayLogs: Attendance10Day[];
  assessments: Assessment[];
  // Rollup Aggregations (computed)
  absentTotal10Day: number;
  presentTotal10Day: number;
  lateTotal10Day: number;
  avgCompletion10Day: number;
}

export interface Trainee {
  id: string;
  traineeName: string;
  company: CompanyEnum;
  avatar?: string;
  email?: string;
  phone?: string;
  // Relations
  batchId: string;
  batch?: Batch;
  attendanceLogs: DailyAttendance[];
  attendance10Day: Attendance10Day[];
  assessment?: Assessment;
  // Rollup Aggregations (computed)
  presentDaily: number;
  absentDaily: number;
  latesDaily: number;
  present10Day: number;
  absent10Day: number;
  late10Day: number;
  latestCompletion10Day: number;
}

export interface DailyAttendance {
  id: string;
  entryId: string; // Format: "YYYY-MM-DD - {Trainee Name}"
  date: Date;
  arrivalTime: Date | null;
  departureTime: Date | null;
  status: AttendanceStatus;
  isLate: boolean;
  // Relations
  traineeId: string;
  trainee?: Trainee;
  batchId: string;
  batch?: Batch;
  // Formula Fields (Computed)
  minutesLate: number;
  wasLate: boolean;
}

export interface Attendance10Day {
  id: string;
  record: string; // Format: "{Name} - Batch {N} ({startDate}–{endDate})"
  periodStart: Date;
  periodEnd: Date;
  // 10-Day Checkboxes
  day1: boolean;
  day2: boolean;
  day3: boolean;
  day4: boolean;
  day5: boolean;
  day6: boolean;
  day7: boolean;
  day8: boolean;
  day9: boolean;
  day10: boolean;
  completionPercent: number;
  checklistStatus: ChecklistStatus;
  attendanceAIReport: string;
  // Relations
  traineeId: string;
  trainee?: Trainee;
  batchId: string;
  batch?: Batch;
  dailyEntries: DailyAttendance[];
  assessments: Assessment[];
  // Rollups from Daily Entries
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface Assessment {
  id: string;
  assessmentTitle: string;
  // Scoring (0-5 scale)
  mapping: number;
  productKnowledge: number;
  presentability: number;
  softSkills: number;
  // Attendance Metrics
  attendance: number;
  absence: number;
  assessmentOutcome: AssessmentOutcome;
  instructorComment: string;
  assessmentAIReport: string;
  company: CompanyEnum;
  // Relations
  traineeId: string;
  trainee?: Trainee;
  batchId: string;
  batch?: Batch;
  // Formula Fields (Computed)
  techScorePercent: number;
  softScorePercent: number;
  overallPercent: number;
}

// ============================================================
// USER & AUTH
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export const PERMISSIONS = {
  admin: ["read", "write", "delete", "manage_users", "export"],
  instructor: ["read", "write", "export"],
  viewer: ["read"],
} as const;

// ============================================================
// UI / CUSTOMIZATION TYPES
// ============================================================

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundStyle: "gradient" | "solid" | "mesh";
  cardStyle: "glass" | "solid" | "bordered";
  animationSpeed: "slow" | "normal" | "fast";
  compactMode: boolean;
  showSparklines: boolean;
  chartStyle: "area" | "bar" | "line";
  colorScheme: "cyan" | "red" | "blue" | "sky" | "green" | "amber";
  fontFamily: "jakarta" | "grotesk" | "system";
}

export interface DashboardWidget {
  id: string;
  type: "stats" | "chart" | "feed" | "table" | "calendar";
  title: string;
  visible: boolean;
  position: number;
  size: "sm" | "md" | "lg" | "full";
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// FILTER & SORT TYPES
// ============================================================

export interface BatchFilters {
  status?: BatchStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface TraineeFilters {
  batchId?: string;
  company?: CompanyEnum;
  search?: string;
}

export interface AttendanceFilters {
  batchId?: string;
  traineeId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceStatus;
}

export interface AssessmentFilters {
  batchId?: string;
  traineeId?: string;
  company?: CompanyEnum;
  outcome?: AssessmentOutcome;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: string;
  direction: SortDirection;
}
