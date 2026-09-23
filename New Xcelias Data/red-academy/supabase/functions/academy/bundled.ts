// supabase/functions/academy/index.ts
import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { promisify } from "node:util";

// public/modules/core.mjs
var ZONE = "Africa/Cairo";
var STATUSES = ["Present", "Absent", "Tour Day", "Off Day"];
var OUTCOMES = ["Failed", "Needs Improvement", "Good", "Very Good", "Excellent", "Aced"];
var BATCH_STATUSES = ["Planning", "Active", "Completed"];
var TABLES = ["companies", "batches", "trainees", "daily_attendance", "attendance_10day", "assessments"];
var id = () => globalThis.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const n = Math.random() * 16 | 0;
  return (c === "x" ? n : n & 3 | 8).toString(16);
});
function parts(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid timestamp.");
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d).filter((p2) => p2.type !== "literal").map((p2) => [p2.type, Number(p2.value)]));
  return p;
}
function cairoDate(value) {
  const p = parts(value);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
function validDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && (/* @__PURE__ */ new Date(s + "T12:00:00Z")).toISOString().slice(0, 10) === s;
}
function wasLate(arrival) {
  if (!arrival) return false;
  const p = parts(arrival);
  return p.hour * 3600 + p.minute * 60 + p.second > 11 * 3600;
}
function scores(a) {
  const fields = ["product_knowledge", "mapping", "presentability", "soft_skills"];
  for (const f of fields) if (a[f] !== null && (typeof a[f] !== "number" || !Number.isFinite(a[f]) || a[f] < 0 || a[f] > 5)) throw new Error("Every supplied score must be between 0 and 5.");
  const tech = a.product_knowledge === null || a.mapping === null ? null : (a.product_knowledge + a.mapping) * 10;
  const soft = a.presentability === null || a.soft_skills === null ? null : (a.presentability + a.soft_skills) * 10;
  return { tech, soft, overall: tech === null || soft === null ? null : (tech + soft) / 2 };
}
function assessedRows(rows2) {
  return rows2.filter((a) => a.analytics_included !== false && a.analytics_included !== 0 && scores(a).overall !== null);
}
function assessmentFor(state, traineeId) {
  const rows2 = state.assessments.filter((a) => a.trainee_id === traineeId);
  return assessedRows(rows2)[0] || rows2.find((a) => a.source_meta?.assessment_state !== "not_assessed") || rows2[0] || null;
}
function checklistFor(state, traineeId) {
  return state.attendance_10day.filter((r) => r.trainee_id === traineeId).sort((a, b) => (b.period_end || "").localeCompare(a.period_end || ""))[0] || null;
}
function canonicalAttendance(rows2) {
  return rows2.filter((r) => r.analytics_included !== false && r.analytics_included !== 0);
}
function checklist(days) {
  const count = (days || []).filter(Boolean).length;
  return { count, percent: count * 10, status: count === 10 ? "Complete" : count ? "In Progress" : "Not Started" };
}
function attendanceStats(entries) {
  const rows2 = canonicalAttendance([...new Map(entries.map((r) => [r.id, r])).values()]);
  const present = rows2.filter((r) => r.status === "Present").length;
  const absent = rows2.filter((r) => r.status === "Absent").length;
  return { present, absent, tour: rows2.filter((r) => r.status === "Tour Day").length, off: rows2.filter((r) => r.status === "Off Day").length, late: rows2.filter((r) => r.is_late).length, calculatedLate: rows2.filter((r) => wasLate(r.arrival_time)).length, rate: present + absent ? present / (present + absent) * 100 : null };
}
function emptyState() {
  return Object.fromEntries([...TABLES, "audit_log", "assessment_history", "import_reviews", "import_runs"].map((k) => [k, []]));
}

// server/validation.mjs
var ApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
var fail = (message) => {
  throw new ApiError(400, message);
};
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isId(value) {
  return typeof value === "string" && uuid.test(value);
}
function validate(table, input, { old = null } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("A record object is required.");
  const legacy = !!old?.source_id, result = {};
  const text = (key, max = 200, required = false) => {
    const v = input[key] ?? "";
    if (typeof v !== "string" || v.length > max || required && !v.trim()) fail(`Invalid ${key.replaceAll("_", " ")}.`);
    result[key] = v.trim();
  };
  const ref = (key, nullable = false) => {
    if (nullable && input[key] === null) {
      result[key] = null;
      return;
    }
    if (!isId(input[key])) fail(`Choose a valid ${key.replace("_id", "")}.`);
    result[key] = input[key];
  };
  const date = (key, nullable = false) => {
    if (nullable && input[key] === null) {
      result[key] = null;
      return;
    }
    if (!validDate(input[key])) fail(`Invalid ${key.replaceAll("_", " ")}.`);
    result[key] = input[key];
  };
  const choice = (key, values, nullable = false) => {
    if (nullable && input[key] === null) {
      result[key] = null;
      return;
    }
    if (!values.includes(input[key])) fail(`Invalid ${key}.`);
    result[key] = input[key];
  };
  const optionalCount = (key) => {
    const v = input[key] ?? null;
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > 1e4)) fail("Recorded attendance totals must be nonnegative whole numbers.");
    result[key] = v;
  };
  if (table === "companies") {
    text("name", 120, true);
  } else if (table === "batches") {
    text("batch_name", 120, true);
    text("description", 3e3);
    choice("status", BATCH_STATUSES, legacy);
    date("start_date", legacy);
    date("end_date", legacy);
    if (result.end_date && result.start_date && result.end_date < result.start_date) fail("The end date cannot be before the start.");
    if (!(legacy && input.capacity === null) && (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 1e3)) fail("Capacity must be between 1 and 1000.");
    result.capacity = input.capacity;
    if (!Array.isArray(input.session_dates) || !legacy && input.session_dates.length !== 10 || input.session_dates.length > 366 || input.session_dates.some((d) => !validDate(d)) || new Set(input.session_dates).size !== input.session_dates.length) fail(legacy ? "Use distinct valid recorded dates." : "Exactly 10 distinct session dates are required.");
    result.session_dates = [...input.session_dates].sort();
    if (!legacy && (result.session_dates[0] < result.start_date || result.session_dates.at(-1) > result.end_date)) fail("Session dates must be inside the batch date range.");
  } else if (table === "trainees") {
    text("trainee_name", 160, true);
    ref("company_id", legacy);
    ref("batch_id", legacy);
    text("email", 254);
    text("phone", 40);
    text("job_title", 100);
    text("notes", 3e3);
    if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) fail("Enter a valid email address.");
  } else if (table === "daily_attendance") {
    ref("trainee_id", legacy);
    ref("batch_id", legacy);
    date("date", legacy);
    choice("status", STATUSES, legacy);
    text("absence_reason", 5e3);
    if (typeof input.is_late !== "boolean") fail("The manual late flag must be true or false.");
    result.is_late = input.is_late;
    for (const key of ["arrival_time", "departure_time"]) {
      const v = input[key];
      if (v !== null && (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) || Number.isNaN(Date.parse(v)))) fail("A time must include its timezone.");
      result[key] = v ? new Date(v).toISOString() : null;
    }
    const sameTimes = legacy && ["date", "arrival_time", "departure_time", "status", "is_late"].every((k) => result[k] === old[k]);
    if (!sameTimes) {
      if (result.departure_time && !result.arrival_time) fail("Record an arrival before a departure.");
      if (result.departure_time < result.arrival_time && result.departure_time) fail("Departure cannot be before arrival.");
      if (result.arrival_time && cairoDate(result.arrival_time) !== result.date) fail("Arrival must match the attendance date in Cairo.");
      if (["Absent", "Off Day"].includes(result.status) && (result.arrival_time || result.departure_time || result.is_late)) fail("Absent and off-day entries cannot have check-in times or a late flag.");
    }
  } else if (table === "attendance_10day") {
    ref("trainee_id", legacy);
    ref("batch_id", legacy);
    date("period_start", legacy);
    date("period_end", legacy);
    if (result.period_start && result.period_end && result.period_end < result.period_start) fail("Invalid period.");
    if (!Array.isArray(input.days) || input.days.length !== 10 || input.days.some((d) => typeof d !== "boolean")) fail("The checklist must contain exactly 10 true/false values.");
    result.days = input.days;
    text("report", 12e3);
    choice("report_kind", ["template", "ai", ...legacy ? ["notion"] : []]);
  } else if (table === "assessments") {
    ref("trainee_id", legacy);
    ref("batch_id", legacy);
    text("assessment_title", 160, true);
    try {
      scores(input);
      if (!legacy && ["mapping", "product_knowledge", "presentability", "soft_skills"].some((f) => input[f] === null)) throw new Error();
    } catch {
      fail("Each skill score must be a number between 0 and 5.");
    }
    for (const f of ["mapping", "product_knowledge", "presentability", "soft_skills"]) result[f] = input[f];
    choice("assessment_outcome", OUTCOMES, legacy);
    text("instructor_comment", 5e3);
    text("report", 12e3);
    choice("report_kind", ["template", "ai", ...legacy ? ["notion"] : []]);
    optionalCount("recorded_attendance");
    optionalCount("recorded_absence");
    if (input.company_id === void 0 || input.company_id === null) result.company_id = null;
    else ref("company_id");
  } else fail("Unknown entity.");
  return result;
}

// supabase/functions/academy/operations.ts
function canWrite(user) {
  if (!["admin", "instructor"].includes(user.role)) throw new ApiError(403, "Your role is read-only.");
}
function asArray(value) {
  return Array.isArray(value) ? value : [];
}
function prepareCloudOperations(body, state, user) {
  const table = body.table;
  if (!TABLES.includes(table)) throw new ApiError(400, "Unknown entity.");
  canWrite(user);
  const inputs = body.records || [body];
  if (!Array.isArray(inputs) || !inputs.length || inputs.length > 100) throw new ApiError(400, "Choose between 1 and 100 records.");
  if (body.records && table !== "daily_attendance") throw new ApiError(400, "Bulk editing is supported for daily attendance.");
  const ops = [], targets = /* @__PURE__ */ new Set();
  for (const input of inputs) {
    const action = input.action || body.action;
    if (!["create", "update", "delete"].includes(action)) throw new ApiError(400, "Invalid action.");
    if (action === "delete" && user.role !== "admin") throw new ApiError(403, "Administrator access is required.");
    const old = action === "create" ? null : asArray(state[table]).find((record) => record.id === input.id);
    if (action !== "create" && (!isId(input.id) || !old)) throw new ApiError(404, "Record not found.");
    if (old && (!Number.isInteger(input.expectedVersion) || input.expectedVersion !== old.version)) throw new ApiError(409, "This record changed in another session. Refresh and try again.");
    if (targets.has(input.id) && input.id) throw new ApiError(400, "A record may only occur once in a request.");
    if (input.id) targets.add(input.id);
    if (action === "delete") {
      ops.push({ table, action, id: old.id, expectedVersion: old.version });
      continue;
    }
    const data = validate(table, input.data, { old });
    if (!old) {
      data.source_id = null;
      data.source_meta = {};
    }
    // red_commit materializes every table column from JSON, so PostgreSQL
    // defaults do not apply to omitted fields. Match the table default here.
    if (table === "daily_attendance" && !old) data.analytics_included = true;
    if (old && "trainee_id" in old && (old.trainee_id !== data.trainee_id || old.batch_id !== data.batch_id)) throw new ApiError(400, "Existing source enrollment links cannot be reassigned by a record edit.");
    if (data.trainee_id) {
      const trainee = asArray(state.trainees).find((record) => record.id === data.trainee_id);
      if (!trainee || trainee.batch_id !== data.batch_id) throw new ApiError(400, "The trainee must belong to this batch.");
      if (old && (old.trainee_id !== data.trainee_id || old.batch_id !== data.batch_id)) throw new ApiError(400, "An existing record cannot be assigned to a different trainee.");
    }
    if (table === "trainees") {
      const batch = asArray(state.batches).find((record) => record.id === data.batch_id);
      if (data.batch_id && !batch || data.company_id && !asArray(state.companies).some((company) => company.id === data.company_id)) throw new ApiError(400, "Choose an existing batch and company.");
      if (old && old.batch_id !== data.batch_id) throw new ApiError(400, "Create a new enrollment to place this trainee in another batch.");
      if (!old && batch?.capacity != null && asArray(state.trainees).filter((trainee) => trainee.batch_id === batch.id).length >= batch.capacity) throw new ApiError(400, "This batch is at capacity.");
    }
    if (table === "batches" && old) {
      if (data.capacity != null && data.capacity < asArray(state.trainees).filter((trainee) => trainee.batch_id === old.id).length) throw new ApiError(400, "Batch capacity cannot be lower than enrollment.");
      const scheduleChanged = JSON.stringify(old.session_dates) !== JSON.stringify(data.session_dates) || old.start_date !== data.start_date || old.end_date !== data.end_date;
      if (scheduleChanged && !old.source_id && asArray(state.trainees).some((trainee) => trainee.batch_id === old.id)) throw new ApiError(400, "Enrolled batch dates are locked to preserve attendance history. Create a new batch for a new schedule.");
    }
    if (table === "daily_attendance") {
      const batch = asArray(state.batches).find((record) => record.id === data.batch_id);
      if (batch?.source_id && data.date && !batch.session_dates.includes(data.date) && !ops.some((operation) => operation.table === "batches" && operation.id === batch.id)) {
        const additions = inputs.map((item) => item.data).filter((item) => item?.batch_id === batch.id && item.date).map((item) => item.date);
        ops.push({ table: "batches", action: "update", id: batch.id, expectedVersion: batch.version, data: { ...batch, session_dates: [.../* @__PURE__ */ new Set([...batch.session_dates, ...additions])].sort() } });
      }
      if (!batch && !old?.source_id || !old?.source_id && !batch?.source_id && !batch?.session_dates.includes(data.date)) throw new ApiError(400, "Attendance must be recorded on one of the 10 scheduled session dates. Edit an empty batch schedule before enrolling trainees.");
      if (data.trainee_id && asArray(state.daily_attendance).some((record) => record.id !== old?.id && record.trainee_id === data.trainee_id && record.date === data.date) && !(old?.source_id && old.trainee_id === data.trainee_id && old.date === data.date)) throw new ApiError(409, "Attendance already exists for this trainee and date.");
    }
    if (["assessments", "attendance_10day"].includes(table) && data.trainee_id && !old?.source_id && asArray(state[table]).some((record) => record.id !== old?.id && record.trainee_id === data.trainee_id && record.batch_id === data.batch_id && (table !== "attendance_10day" || record.period_start === data.period_start && record.period_end === data.period_end))) throw new ApiError(409, "This trainee already has a record in this batch.");
    if (table === "attendance_10day" && !old?.source_id) {
      const batch = asArray(state.batches).find((record) => record.id === data.batch_id);
      if (data.period_start !== batch?.start_date || data.period_end !== batch?.end_date) throw new ApiError(400, "The checklist period must match the batch dates.");
    }
    if (table === "assessments") {
      if (!old && !data.company_id) data.company_id = asArray(state.trainees).find((trainee) => trainee.id === data.trainee_id)?.company_id || null;
      const complete = scores(data).overall !== null, notAssessed = /^\s*not\s+assess?ed\s*[.!]?\s*$/i.test(data.instructor_comment);
      if (!old || !["duplicate", "multiple_results", "shared"].includes(old.source_meta?.assessment_state)) data.analytics_included = complete && !notAssessed && !!data.trainee_id;
    }
    const newId = old?.id || id();
    ops.push({ table, action, id: newId, expectedVersion: old?.version, data });
    if (table === "trainees" && !old) {
      const batch = asArray(state.batches).find((record) => record.id === data.batch_id);
      if (batch?.start_date && batch?.end_date) ops.push({ table: "attendance_10day", action: "create", id: id(), data: { trainee_id: newId, batch_id: batch.id, period_start: batch.start_date, period_end: batch.end_date, days: Array(10).fill(false), report: "", report_kind: "template" } });
    }
  }
  return ops;
}

// supabase/functions/academy/index.ts
var scrypt = promisify(nodeScrypt);
var MAX_BODY = 15e4;
var PHOTO_BUCKET = "red-academy-portraits";
var BackendError = class extends Error {
  constructor(code, status) {
    super(code || "BACKEND_FAILURE");
    this.code = code || "";
    this.status = status;
  }
};
function runtimeSecretKey() {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return typeof keys?.default === "string" ? keys.default : "";
  } catch {
    return "";
  }
}
function settings() {
  const url = Deno.env.get("SUPABASE_URL"), secretKey = Deno.env.get("ACADEMY_SUPABASE_SECRET_KEY") || runtimeSecretKey() || Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secretKey) throw new Error("Cloud database configuration is unavailable.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("Cloud database configuration is unavailable.");
  return { url: parsed.href.replace(/\/$/, ""), secretKey, legacySecret: secretKey.startsWith("eyJ") };
}
function allowedOrigins() {
  const configured = (Deno.env.get("ACADEMY_ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!configured.length) throw new Error("Cloud origin configuration is unavailable.");
  const origins = /* @__PURE__ */ new Set();
  for (const value of configured) {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("Cloud origin configuration is unavailable.");
    origins.add(parsed.origin);
  }
  return origins;
}
function appUrl() {
  const value = Deno.env.get("ACADEMY_APP_URL") || "";
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("Cloud application URL is unavailable.");
  return parsed.href.replace(/\/$/, "");
}
function headersFor(request) {
  const headers = new Headers({ "Cache-Control": "no-store", "Content-Type": "application/json", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "Vary": "Origin" });
  try {
    const origin = request.headers.get("origin");
    if (origin && allowedOrigins().has(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Red-Request");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      headers.set("Access-Control-Max-Age", "600");
    }
  } catch {
  }
  return headers;
}
function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: headersFor(request) });
}
function checkOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().has(origin) || request.headers.get("x-red-request") !== "1") throw new ApiError(403, "Request origin could not be verified. Open the app from its configured company address.");
}
function routeOf(request) {
  const pathname = new URL(request.url).pathname;
  const marker = "/academy/";
  const index = pathname.indexOf(marker);
  if (index >= 0) return pathname.slice(index + marker.length);
  const path = pathname.replace(/^\/+/, "");
  return path === "academy" ? "" : path;
}
function tokenOf(request) {
  const value = request.headers.get("authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(value);
  return match?.[1] || null;
}
function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}
function safeToken() {
  return randomBytes(32).toString("base64url");
}
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString("hex")}`;
}
async function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(":");
    const actual = Buffer.from(await scrypt(password, salt, 64)), expected = Buffer.from(hash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
async function bodyOf(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) throw new ApiError(413, "Request is too large.");
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new ApiError(400, "Invalid JSON request.");
  }
}
function validatePassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 256) throw new ApiError(400, "Use a password between 12 and 256 characters.");
}
function validateSecret(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new ApiError(400, "Enter a valid setup or invitation code.");
}
function validateAccount(body, withPassword = true) {
  if (typeof body.email !== "string" || !/^\S+@\S+\.\S+$/.test(body.email.trim()) || body.email.length > 254 || typeof body.full_name !== "string" || !body.full_name.trim() || body.full_name.length > 160) throw new ApiError(400, "Enter your full name and a valid work email.");
  if (withPassword) validatePassword(body.password);
}
function canWrite2(user) {
  if (!["admin", "instructor"].includes(user.role)) throw new ApiError(403, "Your role is read-only.");
}
function requireAdmin(user) {
  if (user.role !== "admin") throw new ApiError(403, "Administrator access is required.");
}
function databaseError(error) {
  if (!(error instanceof BackendError)) return error;
  const messages = {
    RED_CONFLICT: [409, "This record changed in another session. Refresh and try again."],
    RED_NOT_FOUND: [404, "Record not found."],
    RED_DUPLICATE: [409, "A matching record already exists. Refresh the page before retrying."],
    RED_LINKED: [409, "This record is linked to other data. Reassign the linked records first."],
    RED_INVALID_RECORD: [400, "The record could not be saved. Check the supplied values."],
    RED_INVALID_OPERATION: [400, "The requested change is not valid."],
    RED_EMAIL_EXISTS: [409, "This email already has an account. Manage its existing access instead."],
    RED_INVITATION_INVALID: [400, "This invitation is invalid, expired, or already used. Ask your company administrator for a new invitation."],
    RED_INVITATION_USED: [409, "This invitation can no longer be used."],
    RED_LAST_ADMIN: [400, "You cannot deactivate or demote the last administrator."],
    RED_PASSWORD_CONFLICT: [409, "Your account changed. Sign in again before changing the password."],
    RED_SETUP_USED: [409, "This workspace is already configured. Sign in with your company account."],
    RED_SETUP_INVALID: [403, "The setup code is invalid or expired. Ask the server owner for the current code."]
  };
  const match = messages[error.code];
  return match ? new ApiError(match[0], match[1]) : new ApiError(error.status === 404 ? 404 : 500, "The company workspace could not complete that request. Please try again.");
}
async function backend(path, init = {}) {
  const { url, secretKey, legacySecret } = settings(), headers = { apikey: secretKey, ...legacySecret ? { Authorization: `Bearer ${secretKey}` } : {}, ...init.headers || {} };
  const response = await fetch(url + path, { ...init, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => ""), code = /\bRED_[A-Z_]+\b/.exec(text)?.[0] || "";
    throw new BackendError(code, response.status);
  }
  return response;
}
function query(params) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) if (value !== void 0 && value !== null) result.set(key, String(value));
  return result.toString();
}
async function rows(table, params) {
  const response = await backend(`/rest/v1/${table}?${query(params)}`, { headers: { Accept: "application/json" } });
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
async function row(table, params) {
  return (await rows(table, { ...params, limit: 1 }))[0] || null;
}
async function insert(table, value) {
  await backend(`/rest/v1/${table}`, { method: "POST", headers: { "Content-Type": "application/json", "Prefer": "return=minimal" }, body: JSON.stringify(value) });
}
async function remove(table, params) {
  await backend(`/rest/v1/${table}?${query(params)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}
async function rpc(name, args) {
  const response = await backend(`/rest/v1/rpc/${name}`, { method: "POST", headers: { "Content-Type": "application/json", "Prefer": "return=representation" }, body: JSON.stringify(args) });
  return response.json();
}
async function rate(key, limit, seconds) {
  return await rpc("red_rate_limit", { p_key: key, p_limit: limit, p_seconds: seconds }) === true;
}
async function sessionStatus(token) {
  if (!token) return { user: null, revision: null };
  const result = await rpc("red_session_status", { p_token_hash: tokenHash(token) }), revision = Number(result?.revision);
  return { user: result?.user || null, revision: Number.isInteger(revision) ? revision : null };
}
async function requireUser(request) {
  const token = tokenOf(request);
  if (!token) throw new ApiError(401, "Sign in to access the internal training system.");
  const status = await sessionStatus(token);
  if (!status.user) throw new ApiError(401, "Sign in to access the internal training system.");
  return { ...status, token };
}
async function needsSetup() {
  return !(await rows("users", { select: "id" })).length;
}
function aiEnabled() {
  return Deno.env.get("AI_REPORTS_ENABLED") === "true" && !!Deno.env.get("OPENAI_API_KEY") && !!Deno.env.get("OPENAI_MODEL");
}
async function workspaceState(user) {
  const state = await rpc("red_workspace_state", { p_is_admin: user.role === "admin" });
  if (!state || typeof state !== "object") throw new BackendError("", 500);
  state.batches?.sort((a, b) => String(a.batch_name).localeCompare(String(b.batch_name), void 0, { numeric: true }));
  return { ...emptyState(), ...state };
}
function portraitOf(value) {
  if (value === null) return null;
  if (typeof value !== "string") throw new ApiError(400, "Choose a JPEG, PNG, or WebP portrait.");
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) throw new ApiError(400, "Choose a JPEG, PNG, or WebP portrait.");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 80 * 1024) throw new ApiError(413, "Use a portrait smaller than 80 KB.");
  const valid = match[1] === "image/jpeg" ? bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : match[1] === "image/png" ? bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : bytes.length >= 12 && bytes.subarray(0, 4).equals(Buffer.from("RIFF")) && bytes.subarray(8, 12).equals(Buffer.from("WEBP"));
  if (!valid) throw new ApiError(400, "The portrait file does not match its image type.");
  return { mime_type: match[1], bytes };
}
function storagePath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}
async function aiReport(user, token, body) {
  canWrite2(user);
  if (!aiEnabled()) throw new ApiError(503, "AI reports are not configured. The built-in summary is available without an API key.");
  if (body.consent !== true) throw new ApiError(400, "Confirm that anonymized metrics may be sent to the AI provider.");
  if (!["attendance", "assessment"].includes(body.kind) || !isId(body.traineeId)) throw new ApiError(400, "Choose a trainee and report type.");
  if (!await rate("ai:" + user.id, 10, 3600)) throw new ApiError(429, "AI report limit reached (10 per user per hour).");
  const state = await workspaceState(user), trainee = state.trainees.find((record) => record.id === body.traineeId);
  if (!trainee) throw new ApiError(404, "Trainee not found.");
  const assessment = assessmentFor(state, trainee.id), attendance = checklistFor(state, trainee.id);
  if (body.kind === "assessment" && !assessment) throw new ApiError(400, "Save an assessment first.");
  const metrics = { type: body.kind, attendance: attendanceStats(state.daily_attendance.filter((record) => record.trainee_id === trainee.id)), checklist: attendance ? checklist(attendance.days) : null, assessment: assessment ? { mapping: assessment.mapping, productKnowledge: assessment.product_knowledge, presentability: assessment.presentability, softSkills: assessment.soft_skills, ...scores(assessment), outcome: assessment.assessment_outcome } : null };
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: Deno.env.get("OPENAI_MODEL"), store: false, max_output_tokens: 650, instructions: "Write a clear, constructive training report of 130-180 words. Use only the supplied metrics. Never infer personality, motivation, employment suitability, or missing attendance. Distinguish manual late flags from calculated late arrivals. Checklist completion is not attendance. Mention practical next steps. Plain text only. Do not include names or contact details. An instructor will review the report.", input: JSON.stringify(metrics) }), signal: AbortSignal.timeout(45e3) });
  if (!response.ok) throw new ApiError(502, "The AI provider could not complete the report. Your data has not been changed.");
  const result = await response.json(), report = (result.output || []).flatMap((output) => output.content || []).filter((content) => content.type === "output_text").map((content) => content.text).join("\n").trim();
  if (!report) throw new ApiError(502, "The AI provider returned an empty report.");
  return { report, source: "ai" };
}
async function handle(request) {
  const requestId = randomBytes(6).toString("hex");
  try {
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins().has(origin)) throw new ApiError(403, "Request origin could not be verified. Open the app from its configured company address.");
    if (request.method === "OPTIONS") {
      if (!origin || !allowedOrigins().has(origin)) throw new ApiError(403, "Request origin could not be verified.");
      return new Response(null, { status: 204, headers: headersFor(request) });
    }
    if (!["GET", "HEAD"].includes(request.method)) checkOrigin(request);
    const route = routeOf(request), method = request.method;
    if (route === "auth/login" && method === "POST") {
      const body = await bodyOf(request);
      if (typeof body.email !== "string" || body.email.length > 254 || typeof body.password !== "string" || body.password.length > 256) throw new ApiError(400, "Enter your email and password.");
      const email = body.email.trim().toLowerCase();
      if (!await rate("login:global", 100, 60) || !await rate("login:" + tokenHash(email), 10, 60)) throw new ApiError(429, "Too many sign-in attempts. Try again in one minute.");
      const user2 = await row("users", { select: "id,email,full_name,password_hash,role,active", email: `eq.${email}` }), dummy = "00112233445566778899aabbccddeeff:" + "0".repeat(128);
      const correct = await verifyPassword(body.password, user2?.password_hash || dummy);
      if (!user2 || !correct) throw new ApiError(401, "Email or password is incorrect.");
      if (!user2.active) throw new ApiError(403, "Your company account is inactive. Contact your administrator.");
      await remove("sessions", { expires_at: `lte.${Date.now()}` });
      const token = safeToken();
      await insert("sessions", { token_hash: tokenHash(token), user_id: user2.id, expires_at: Date.now() + 12 * 3600 * 1e3 });
      await insert("audit_log", { id: id(), actor: user2.email, action: "sign-in", entity: "users", entity_id: user2.id, details: "Signed in to the internal training system.", created_at: (/* @__PURE__ */ new Date()).toISOString() });
      return json(request, { token, user: { id: user2.id, email: user2.email, full_name: user2.full_name, role: user2.role, active: true } });
    }
    if (route === "auth/register") throw new ApiError(403, "This internal system requires an administrator invitation.");
    if (route === "auth/setup" && method === "POST") {
      if (!await rate("setup", 20, 3600)) throw new ApiError(429, "Too many setup attempts. Try again later.");
      const body = await bodyOf(request);
      validateAccount(body);
      validateSecret(body.token);
      return json(request, await rpc("red_bootstrap", { p_token_hash: tokenHash(body.token), p_email: body.email.trim().toLowerCase(), p_full_name: body.full_name.trim(), p_password_hash: await hashPassword(body.password) }), 201);
    }
    if (route === "auth/accept-invitation" && method === "POST") {
      if (!await rate("accept-invitation", 60, 3600)) throw new ApiError(429, "Too many invitation attempts. Try again later.");
      const body = await bodyOf(request);
      validateSecret(body.token);
      validatePassword(body.password);
      return json(request, await rpc("red_accept_invitation", { p_token_hash: tokenHash(body.token), p_password_hash: await hashPassword(body.password) }), 201);
    }
    if (route === "auth/logout" && method === "POST") {
      const token = tokenOf(request);
      if (token) await remove("sessions", { token_hash: `eq.${tokenHash(token)}` });
      return json(request, { ok: true });
    }
    if (route === "session" && method === "GET") {
      const status = await sessionStatus(tokenOf(request));
      if (!status.user) return json(request, { user: null, mode: "private", sync: "poll", revision: status.revision, setupRequired: await needsSetup(), aiEnabled: false });
      return json(request, { user: status.user, mode: "private", sync: "poll", revision: status.revision, setupRequired: false, aiEnabled: aiEnabled() });
    }
    const session = await requireUser(request), user = session.user;
    if (route === "sync" && method === "GET") return json(request, { user, revision: session.revision });
    if (route === "auth/password" && method === "POST") {
      if (!await rate("password:" + user.id, 5, 900)) throw new ApiError(429, "Too many password attempts. Try again in 15 minutes.");
      const body = await bodyOf(request);
      validatePassword(body.password);
      if (typeof body.currentPassword !== "string" || body.currentPassword.length > 256) throw new ApiError(400, "Enter your current password.");
      const account = await row("users", { select: "id,password_hash,active", id: `eq.${user.id}` });
      if (!account || !account.active || !await verifyPassword(body.currentPassword, account.password_hash)) throw new ApiError(403, "Your current password is incorrect.");
      if (body.currentPassword === body.password) throw new ApiError(400, "Choose a different password.");
      await rpc("red_change_password", { p_user_id: user.id, p_old_hash: account.password_hash, p_new_hash: await hashPassword(body.password), p_actor: user.email });
      return json(request, { ok: true });
    }
    if (route === "invitations" && method === "GET") {
      requireAdmin(user);
      return json(request, await rows("invitations", { select: "id,email,full_name,role,created_at,expires_at,used_at,revoked_at", order: "created_at.desc" }));
    }
    if (route === "invitations" && method === "POST") {
      requireAdmin(user);
      const body = await bodyOf(request);
      validateAccount(body, false);
      if (!["admin", "instructor", "viewer"].includes(body.role)) throw new ApiError(400, "Choose an access role.");
      if (!await rate("invite:" + user.id, 30, 3600)) throw new ApiError(429, "Invitation limit reached. Try again later.");
      const token = safeToken(), invite = await rpc("red_create_invitation", { p_id: id(), p_email: body.email.trim().toLowerCase(), p_full_name: body.full_name.trim(), p_role: body.role, p_token_hash: tokenHash(token), p_invited_by: user.id, p_actor: user.email });
      return json(request, { ...invite, token, url: `${appUrl()}/#/join/${token}` }, 201);
    }
    if (route === "invitations" && method === "DELETE") {
      requireAdmin(user);
      const body = await bodyOf(request);
      if (!isId(body.id)) throw new ApiError(400, "Choose an invitation.");
      await rpc("red_revoke_invitation", { p_id: body.id, p_actor: user.email });
      return json(request, { ok: true });
    }
    if (route === "import/sources" && method === "GET") {
      const url = new URL(request.url), batch = url.searchParams.get("batch") || "", kind = url.searchParams.get("kind") || "", disposition = url.searchParams.get("disposition") || "", search = (url.searchParams.get("q") || "").slice(0, 200), page = Number(url.searchParams.get("page") || 1);
      if (batch && !isId(batch) || kind && !["batches", "trainees", "daily", "checklists", "assessments"].includes(kind) || disposition && !["imported", "consolidated", "excluded_demo", "excluded_empty"].includes(disposition) || !Number.isInteger(page) || page < 1 || page > 1e4) throw new ApiError(400, "Invalid source filter.");
      return json(request, await rpc("red_source_list", { p_batch: batch, p_kind: kind, p_disposition: disposition, p_query: search, p_page: page }));
    }
    if (route.startsWith("import/source/") && method === "GET") {
      const sourceId = route.slice("import/source/".length);
      if (!/^[a-f0-9]{32}$/.test(sourceId)) throw new ApiError(400, "Invalid source identifier.");
      const source = await row("source_records", { select: "*", id: `eq.${sourceId}` });
      if (!source) throw new ApiError(404, "Original Notion record not found.");
      return json(request, source);
    }
    if (route === "import/review" && method === "PATCH") {
      requireAdmin(user);
      const body = await bodyOf(request);
      if (!isId(body.id) || typeof body.note !== "string" || body.note.length > 3e3) throw new ApiError(400, "Enter a valid review note.");
      await rpc("red_acknowledge_review", { p_id: body.id, p_note: body.note.trim(), p_actor: user.email });
      return json(request, { ok: true });
    }
    if (route === "state" && method === "GET") return json(request, await workspaceState(user));
    const portraitRoute = /^trainees\/([^/]+)\/photo$/.exec(route);
    if (portraitRoute) {
      const traineeId = portraitRoute[1];
      if (!isId(traineeId)) throw new ApiError(400, "Choose a valid trainee.");
      if (method === "GET") {
        const photo = await row("trainee_photos", { select: "object_path,mime_type,updated_at", trainee_id: `eq.${traineeId}` });
        if (!photo) throw new ApiError(404, "No trainee portrait was found.");
        const object = await backend(`/storage/v1/object/${PHOTO_BUCKET}/${storagePath(photo.object_path)}`);
        const headers = headersFor(request);
        headers.set("Content-Type", photo.mime_type);
        headers.set("Content-Disposition", "inline");
        return new Response(object.body, { status: 200, headers });
      }
      if (method === "PUT") {
        canWrite2(user);
        const body = await bodyOf(request), photo = portraitOf(body.photo), current = await row("trainee_photos", { select: "object_path", trainee_id: `eq.${traineeId}` });
        if (photo) {
          const objectPath = `${traineeId}/portrait`;
          try {
            await backend(`/storage/v1/object/${PHOTO_BUCKET}/${storagePath(objectPath)}`, { method: "POST", headers: { "Content-Type": photo.mime_type, "x-upsert": "true" }, body: photo.bytes });
            const saved2 = await rpc("red_set_trainee_photo", { p_trainee_id: traineeId, p_object_path: objectPath, p_mime_type: photo.mime_type, p_actor: user.email });
            return json(request, saved2);
          } catch (error) {
            throw error;
          }
        }
        const saved = await rpc("red_set_trainee_photo", { p_trainee_id: traineeId, p_object_path: null, p_mime_type: null, p_actor: user.email });
        if (current?.object_path) {
          try {
            await backend(`/storage/v1/object/${PHOTO_BUCKET}/${storagePath(current.object_path)}`, { method: "DELETE" });
          } catch {
            console.error("Academy portrait object cleanup could not be completed.");
          }
        }
        return json(request, saved);
      }
      throw new ApiError(404, "Endpoint not found.");
    }
    if (route === "mutate" && method === "POST") {
      const body = await bodyOf(request), state = await workspaceState(user), operations = prepareCloudOperations(body, state, user), records = await rpc("red_commit", { p_operations: operations, p_actor: user.email });
      return json(request, { records });
    }
    if (route === "ai" && method === "POST") return json(request, await aiReport(user, session.token, await bodyOf(request)));
    if (route === "users" && method === "GET") {
      requireAdmin(user);
      return json(request, await rows("users", { select: "id,email,full_name,role,active,created_at", order: "created_at.asc" }));
    }
    if (route === "users" && method === "PATCH") {
      requireAdmin(user);
      const body = await bodyOf(request);
      if (!isId(body.id) || !["admin", "instructor", "viewer"].includes(body.role) || typeof body.active !== "boolean") throw new ApiError(400, "Invalid user permissions.");
      await rpc("red_update_user_access", { p_target: body.id, p_role: body.role, p_active: body.active, p_actor: user.email });
      return json(request, { ok: true });
    }
    throw new ApiError(404, "Endpoint not found.");
  } catch (error) {
    const safe = databaseError(error);
    if (safe instanceof ApiError) return json(request, { error: safe.message }, safe.status);
    console.error(`Academy cloud request ${requestId} failed.`);
    return json(request, { error: "An unexpected error occurred. No changes were confirmed.", requestId }, 500);
  }
}
Deno.serve(handle);
