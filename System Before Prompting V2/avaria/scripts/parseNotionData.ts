/**
 * Notion Data Parser Script
 * Transforms Notion CSV exports into Red Academy app data format
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';

// Types for parsed data
interface ParsedTrainee {
  id: string;
  name: string;
  batch: string;
  company: string;
  email: string;
  phone: string;
  status: 'active' | 'graduated' | 'dropped';
  enrollmentDate: string;
  avatar: string;
}

interface ParsedBatch {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  traineeCount: number;
  instructors: string[];
  schedule: string;
  location: string;
  description: string;
}

interface ParsedCompany {
  id: string;
  name: string;
  logo: string;
  traineeCount: number;
  activeBatches: number;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  industry: string;
  partnerSince: string;
}

interface ParsedAssessment {
  id: string;
  traineeId: string;
  traineeName: string;
  batchId: string;
  batchName: string;
  company: string;
  date: string;
  mapping: number;
  productKnowledge: number;
  presentability: number;
  softSkills: number;
  overallScore: number;
  techScore: number;
  softScore: number;
  outcome: 'Aced' | 'Excellent' | 'Very Good' | 'Good' | 'Needs Improvement' | 'Failed';
  instructorComment: string;
  aiReport: string;
}

interface ParsedDailyAttendance {
  id: string;
  traineeId: string;
  traineeName: string;
  batchId: string;
  batchName: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'off-day' | 'tour-day';
  minutesLate: number;
  isLate: boolean;
}

interface ParsedTenDayAttendance {
  id: string;
  traineeId: string;
  traineeName: string;
  batchId: string;
  batchName: string;
  periodStart: string;
  periodEnd: string;
  days: ('present' | 'absent' | 'late' | 'excused')[];
  presentCount: number;
  absentCount: number;
  lateCount: number;
  completionPercentage: number;
}

// Utility functions
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const records = parseCsv(content, {
    bom: true,
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
  }) as unknown as Array<Array<unknown>>;

  if (!records || records.length === 0) return { headers: [], rows: [] };

  const headers = (records[0] || []).map((h) => String(h ?? '').trim());
  const rows = records.slice(1).map((row) => (row || []).map((v) => String(v ?? '').trim()));

  return { headers, rows };
}

function extractNameFromNotionLink(value: string): string {
  // Handle Notion links like "Mohamed Hany (https://www.notion.so/...)"
  if (!value) return '';
  const match = value.match(/^([^(]+)\s*\(/);
  if (match) {
    return match[1].trim();
  }
  // Handle plain text or comma-separated values
  return value.split(',')[0].trim();
}

function extractAllNamesFromNotionLinks(value: string): string[] {
  if (!value) return [];
  // Split by comma but be careful with links
  const parts = value.split(/,\s*(?=[A-Z])/);
  return parts.map(p => extractNameFromNotionLink(p)).filter(Boolean);
}

function parseBatchNumber(value: string): number | null {
  if (!value) return null;
  const match = value.match(/\bBatch\s*(\d+)\b/i) || value.match(/^\s*(\d+)\s*$/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
}

function normalizeBatchName(value: string): { name: string; num: number | null } {
  const trimmed = (value || '').trim();
  const num = parseBatchNumber(trimmed);
  if (num == null) return { name: trimmed, num: null };
  return { name: `Batch ${num}`, num };
}

function parseNotionDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handle formats like "October 19, 2025" or "November 5, 2025 11:20 AM (GMT+2)"
  const dateMatch = dateStr.match(/([A-Za-z]+)\s+(\d+),?\s+(\d{4})/);
  if (dateMatch) {
    const months: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const month = months[dateMatch[1]] || '01';
    const day = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    return `${year}-${month}-${day}`;
  }
  return '';
}

function parseTime(timeStr: string): string {
  if (!timeStr) return '';
  // Extract time from "November 5, 2025 11:20 AM (GMT+2)"
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const period = timeMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  return '';
}

function parseDateRange(dateRange: string): { start: string; end: string } {
  if (!dateRange) return { start: '', end: '' };
  // Handle "October 19, 2025 → October 30, 2025"
  const parts = dateRange.split('→').map(p => p.trim());
  return {
    start: parseNotionDate(parts[0] || ''),
    end: parseNotionDate(parts[1] || parts[0] || '')
  };
}

function parsePercentage(value: string): number {
  if (!value) return 0;
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

function generateId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(4, '0')}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getRandomAvatar(name: string): string {
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=dc2626`;
}

// Main parsing functions
function parseTrainees(csv: string, batchMap: Map<string, string>, companySet: Set<string>): ParsedTrainee[] {
  const { headers, rows } = parseCSV(csv);
  const trainees: ParsedTrainee[] = [];
  
  const nameIdx = headers.findIndex(h => h.toLowerCase().includes('trainee name'));
  const batchIdx = headers.findIndex(h => h.toLowerCase() === 'batch');
  const companyIdx = headers.findIndex(h => h.toLowerCase() === 'company');
  const emailIdx = headers.findIndex(h => h.toLowerCase() === 'email');
  const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
  
  rows.forEach((row, index) => {
    const name = extractNameFromNotionLink(row[nameIdx] || '');
    if (!name) return;
    
    const rawBatch = extractNameFromNotionLink(row[batchIdx] || '');
    const batchName = normalizeBatchName(rawBatch).name;
    const company = extractNameFromNotionLink(row[companyIdx] || '');
    
    if (company) companySet.add(company);
    
    trainees.push({
      id: generateId('trainee', index),
      name,
      batch: batchName,
      company: company || 'Unassigned',
      email: (row[emailIdx] || '').trim() || `${slugify(name)}@email.com`,
      phone: (row[phoneIdx] || '').trim() || `+20 1${Math.floor(Math.random() * 900000000 + 100000000)}`,
      status: 'active',
      enrollmentDate: '2025-10-01',
      avatar: getRandomAvatar(name)
    });
  });
  
  return trainees;
}

function parseBatches(csv: string): { batches: ParsedBatch[]; batchMap: Map<string, string> } {
  const { headers, rows } = parseCSV(csv);
  const batchesByNum = new Map<number, ParsedBatch>();
  const batchMap = new Map<string, string>();
  
  const nameIdx = headers.findIndex(h => h.toLowerCase().includes('batch name'));
  const dateRangeIdx = headers.findIndex(h => h.toLowerCase().includes('date range'));
  const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');
  const traineesIdx = headers.findIndex(h => h.toLowerCase() === 'trainees');
  
  rows.forEach((row) => {
    const rawName = extractNameFromNotionLink(row[nameIdx] || '') || '';
    const { name, num } = normalizeBatchName(rawName);
    if (num == null || num < 1 || num > 31) return;
    if (batchesByNum.has(num)) return;

    const id = `batch-${String(num).padStart(2, '0')}`;

    const dateRange = parseDateRange(row[dateRangeIdx] || '');
    const status = row[statusIdx]?.toLowerCase().includes('completed') ? 'completed' :
                   row[statusIdx]?.toLowerCase().includes('active') ? 'active' : 'upcoming';

    const traineesStr = row[traineesIdx] || '';
    const traineeCount = traineesStr.split(',').filter(t => t.trim()).length;

    const batch: ParsedBatch = {
      id,
      name,
      startDate: dateRange.start || '2025-10-01',
      endDate: dateRange.end || dateRange.start || '2025-10-15',
      status: status as 'upcoming' | 'active' | 'completed',
      traineeCount: traineeCount || 0,
      instructors: ['Instructor Team'],
      schedule: 'Sun-Thu, 9:00 AM - 5:00 PM',
      location: 'RED Academy Campus',
      description: `Training batch ${name} - Real estate professional development program`
    };

    batchesByNum.set(num, batch);
    batchMap.set(name, id);
    batchMap.set(String(num), id);
    batchMap.set(id, id);
  });

  // Enforce exactly 31 batches (Batch 1..31)
  for (let num = 1; num <= 31; num++) {
    if (batchesByNum.has(num)) continue;
    const id = `batch-${String(num).padStart(2, '0')}`;
    const name = `Batch ${num}`;
    const batch: ParsedBatch = {
      id,
      name,
      startDate: '2025-10-01',
      endDate: '2025-10-15',
      status: 'upcoming',
      traineeCount: 0,
      instructors: ['Instructor Team'],
      schedule: 'Sun-Thu, 9:00 AM - 5:00 PM',
      location: 'RED Academy Campus',
      description: `Training batch ${name} - Real estate professional development program`
    };
    batchesByNum.set(num, batch);
    batchMap.set(name, id);
    batchMap.set(String(num), id);
    batchMap.set(id, id);
  }

  const batches = Array.from(batchesByNum.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, batch]) => batch);

  return { batches, batchMap };
}

function parseCompanies(companySet: Set<string>, trainees: ParsedTrainee[]): ParsedCompany[] {
  const companies: ParsedCompany[] = [];
  let index = 0;
  
  companySet.forEach(companyName => {
    if (!companyName || companyName === 'Unassigned') return;
    
    const traineeCount = trainees.filter(t => t.company === companyName).length;
    const batches = new Set(trainees.filter(t => t.company === companyName).map(t => t.batch));
    
    companies.push({
      id: generateId('company', index),
      name: companyName,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=dc2626&color=fff&size=128`,
      traineeCount,
      activeBatches: batches.size,
      contactPerson: `${companyName} HR`,
      email: `hr@${slugify(companyName)}.com`,
      phone: `+20 2${Math.floor(Math.random() * 90000000 + 10000000)}`,
      address: 'Cairo, Egypt',
      industry: 'Real Estate',
      partnerSince: '2024'
    });
    
    index++;
  });
  
  return companies;
}

function parseAssessments(csv: string, trainees: ParsedTrainee[]): ParsedAssessment[] {
  const { headers, rows } = parseCSV(csv);
  const assessments: ParsedAssessment[] = [];

  const normHeader = (h: string) => h.toLowerCase().replace(/\s+/g, ' ').trim();
  const headerEntries = headers.map((h, i) => ({ h, i, n: normHeader(h) }));
  const findIdx = (predicate: (n: string) => boolean) => {
    const entry = headerEntries.find(e => predicate(e.n));
    return entry ? entry.i : -1;
  };

  const titleIdx = findIdx(n => n.includes('assessment title'));
  const batchIdx = findIdx(n => n === 'batch' || n.endsWith(' batch'));
  const companyIdx = findIdx(n => n === 'company' || n.includes('company'));
  const outcomeIdx = findIdx(n => n.includes('outcome'));
  const overallIdx = findIdx(n => n.includes('overall'));
  const mappingIdx = findIdx(n => n === 'mapping' || n.includes('mapping'));
  const productIdx = findIdx(n => n.includes('product knowledge') || (n.includes('product') && !n.includes('percentage')));
  const presentabilityIdx = findIdx(n => n.includes('presentability'));
  const softSkillsIdx = findIdx(n => n.includes('soft skills') || (n.includes('soft') && n.includes('skills')));
  const techScoreIdx = findIdx(n => n.includes('tech score'));
  const softScoreIdx = findIdx(n => n.includes('soft score'));
  const commentIdx = findIdx(n => n.includes('instructor comment') || (n.includes('instructor') && n.includes('comment')));
  const aiReportIdx = findIdx(n => n.includes('ai report'));

  const traineeIdxCandidates = headerEntries
    .filter(e => e.n.includes('assessment for') && e.n.includes('trainee'))
    .map(e => e.i);
  const traineeIdxPrimary = traineeIdxCandidates[0] ?? -1;
  const traineeIdxSecondary = traineeIdxCandidates[1] ?? -1;
  
  rows.forEach((row, index) => {
    const traineeRaw = (traineeIdxPrimary >= 0 ? row[traineeIdxPrimary] : '') || (traineeIdxSecondary >= 0 ? row[traineeIdxSecondary] : '') || '';
    const traineeName = extractNameFromNotionLink(traineeRaw);
    if (!traineeName) return;
    
    const trainee = trainees.find(t => t.name === traineeName);
    const { name: batchName, num: batchNum } = normalizeBatchName(extractNameFromNotionLink(row[batchIdx] || ''));
    const company = extractNameFromNotionLink(row[companyIdx] || '');
    
    const rawOutcome = row[outcomeIdx] || '';
    let outcome: ParsedAssessment['outcome'] = 'Good';
    if (rawOutcome.toLowerCase().includes('aced')) outcome = 'Aced';
    else if (rawOutcome.toLowerCase().includes('excellent')) outcome = 'Excellent';
    else if (rawOutcome.toLowerCase().includes('very good')) outcome = 'Very Good';
    else if (rawOutcome.toLowerCase().includes('good')) outcome = 'Good';
    else if (rawOutcome.toLowerCase().includes('needs')) outcome = 'Needs Improvement';
    else if (rawOutcome.toLowerCase().includes('failed')) outcome = 'Failed';
    
    assessments.push({
      id: generateId('assessment', index),
      traineeId: trainee?.id || '',
      traineeName,
      batchId: batchNum != null ? `batch-${String(batchNum).padStart(2, '0')}` : 'batch-unknown',
      batchName: batchName || 'Unknown',
      company: company || 'Unknown',
      date: '2025-10-15',
      mapping: parseFloat(row[mappingIdx]) || 0,
      productKnowledge: parseFloat(row[productIdx]) || 0,
      presentability: parseFloat(row[presentabilityIdx]) || 0,
      softSkills: parseFloat(row[softSkillsIdx]) || 0,
      overallScore: parsePercentage(row[overallIdx]),
      techScore: parsePercentage(row[techScoreIdx]),
      softScore: parsePercentage(row[softScoreIdx]),
      outcome,
      instructorComment: row[commentIdx] || '',
      aiReport: row[aiReportIdx] || ''
    });
  });
  
  return assessments;
}

function parseDailyAttendance(csv: string, trainees: ParsedTrainee[]): ParsedDailyAttendance[] {
  const { headers, rows } = parseCSV(csv);
  const attendance: ParsedDailyAttendance[] = [];
  
  const idIdx = headers.findIndex(h => h.toLowerCase().includes('entry'));
  const traineeIdxPrimary = headers.findIndex(h => h.toLowerCase() === 'trainee');
  const traineeIdxSecondary = headers.findIndex(h => h.toLowerCase() === 'trainee 1');
  const batchIdx = headers.findIndex(h => h.toLowerCase() === 'batch');
  const dateIdx = headers.findIndex(h => h.toLowerCase() === 'date');
  const arrivalIdx = headers.findIndex(h => h.toLowerCase().includes('arrival'));
  const departureIdx = headers.findIndex(h => h.toLowerCase().includes('departure'));
  const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');
  const minutesLateIdx = headers.findIndex(h => h.toLowerCase().includes('minutes late'));
  const isLateIdx = headers.findIndex(h => h.toLowerCase() === 'is late?') !== -1
    ? headers.findIndex(h => h.toLowerCase() === 'is late?')
    : headers.findIndex(h => h.toLowerCase() === 'was late?');
  
  rows.forEach((row, index) => {
    let traineeName = extractNameFromNotionLink((traineeIdxPrimary >= 0 ? row[traineeIdxPrimary] : '') || '');
    if (!traineeName) {
      traineeName = extractNameFromNotionLink((traineeIdxSecondary >= 0 ? row[traineeIdxSecondary] : '') || '');
    }
    // Handle URL-encoded paths like "Abdelrahman Hesham (../...)"
    if (!traineeName && (traineeIdxPrimary >= 0 ? row[traineeIdxPrimary] : null)) {
      const raw = String(row[traineeIdxPrimary] || '');
      const match = raw.match(/^([^\(]+)\s*\(/);
      if (match) traineeName = match[1].trim();
    }
    // Also try to extract from Entry ID format "2025-11-05 - Abdelrahman Hesham"
    if (!traineeName && row[idIdx]) {
      const parts = String(row[idIdx]).split(' - ');
      if (parts.length >= 2) traineeName = parts.slice(1).join(' - ').trim();
    }
    if (!traineeName) return;
    
    const trainee = trainees.find(t => t.name === traineeName);
    const { name: batchName, num: batchNum } = normalizeBatchName(extractNameFromNotionLink(row[batchIdx] || ''));
    
    const rawStatus = row[statusIdx]?.toLowerCase() || '';
    
    let status: ParsedDailyAttendance['status'] = 'present';
    if (rawStatus.includes('absent')) status = 'absent';
    else if (rawStatus.includes('late')) status = 'late';
    else if (rawStatus.includes('off')) status = 'off-day';
    else if (rawStatus.includes('tour')) status = 'tour-day';
    else if (rawStatus.includes('excused')) status = 'excused';
    else if (!rawStatus) status = 'present';  // Default to present if status empty but has data
    
    const isLate = row[isLateIdx]?.toLowerCase() === 'yes' || 
                   row[isLateIdx]?.toLowerCase() === 'true' ||
                   row[isLateIdx]?.includes('Yes');
    
    attendance.push({
      id: row[idIdx] || generateId('daily', index),
      traineeId: trainee?.id || '',
      traineeName,
      batchId: batchNum != null ? `batch-${String(batchNum).padStart(2, '0')}` : 'batch-unknown',
      batchName: batchName || 'Unknown',
      date: parseNotionDate(row[dateIdx] || '') || '2025-10-15',
      arrivalTime: parseTime(row[arrivalIdx] || '') || '09:00',
      departureTime: parseTime(row[departureIdx] || '') || '17:00',
      status,
      minutesLate: parseInt(row[minutesLateIdx]) || 0,
      isLate
    });
  });
  
  return attendance;
}

function parseTenDayAttendance(csv: string, trainees: ParsedTrainee[]): ParsedTenDayAttendance[] {
  const { headers, rows } = parseCSV(csv);
  const attendance: ParsedTenDayAttendance[] = [];
  
  const traineeIdx = headers.findIndex(h => h.toLowerCase() === 'trainee');
  const batchIdx = headers.findIndex(h => h.toLowerCase() === 'batch');
  const periodStartIdx = headers.findIndex(h => h.toLowerCase().includes('period start'));
  const periodEndIdx = headers.findIndex(h => h.toLowerCase().includes('period end'));
  const presentIdx = headers.findIndex(h => h.toLowerCase().includes('present'));
  const absentIdx = headers.findIndex(h => h.toLowerCase().includes('absent'));
  const lateIdx = headers.findIndex(h => h.toLowerCase().includes('late'));
  const completionIdx = headers.findIndex(h => h.toLowerCase().includes('completion'));
  
  // Find day columns (Day 1, Day 2, etc.)
  const dayIndices: number[] = [];
  headers.forEach((h, i) => {
    if (/day\s*\d+/i.test(h)) {
      dayIndices.push(i);
    }
  });
  
  rows.forEach((row, index) => {
    const traineeName = extractNameFromNotionLink(row[traineeIdx] || '');
    if (!traineeName) return;
    
    const trainee = trainees.find(t => t.name === traineeName);
    const { name: batchName, num: batchNum } = normalizeBatchName(extractNameFromNotionLink(row[batchIdx] || ''));
    
    // Parse day columns
    const days: ('present' | 'absent' | 'late' | 'excused')[] = [];
    dayIndices.forEach(dayIdx => {
      const value = row[dayIdx]?.toLowerCase() || '';
      if (value === 'yes' || value.includes('yes')) {
        days.push('present');
      } else if (value === 'no' || value.includes('no')) {
        days.push('absent');
      } else {
        days.push('excused');
      }
    });
    
    // Pad to 10 days if needed
    while (days.length < 10) {
      days.push('excused');
    }
    
    attendance.push({
      id: generateId('tenday', index),
      traineeId: trainee?.id || '',
      traineeName,
      batchId: batchNum != null ? `batch-${String(batchNum).padStart(2, '0')}` : 'batch-unknown',
      batchName: batchName || 'Unknown',
      periodStart: parseNotionDate(row[periodStartIdx] || '') || '2025-10-01',
      periodEnd: parseNotionDate(row[periodEndIdx] || '') || '2025-10-10',
      days,
      presentCount: parseInt(row[presentIdx]) || days.filter(d => d === 'present').length,
      absentCount: parseInt(row[absentIdx]) || days.filter(d => d === 'absent').length,
      lateCount: parseInt(row[lateIdx]) || days.filter(d => d === 'late').length,
      completionPercentage: parsePercentage(row[completionIdx])
    });
  });
  
  return attendance;
}

// Main execution
async function main() {
  const resolveDataDir = () => {
    const cwd = process.cwd();
    const explicit = (process.env.NOTION_EXPORT_DIR || '').trim();
    if (explicit) {
      return path.isAbsolute(explicit) ? explicit : path.join(cwd, explicit);
    }

    const source = (process.env.NOTION_SOURCE || '').trim().toLowerCase();
    const datanewDir = path.join(cwd, 'datanew');
    const datacvDir = path.join(
      cwd,
      'datacv',
      'Export-b8fbd3da-e833-42e1-91c0-4b73e8b36dac',
      'Super Admin Only',
      '298a824234cc81d5b45e00421853fc94'
    );

    if (source === 'datanew') return datanewDir;
    if (source === 'datacv') return datacvDir;

    if (fs.existsSync(datacvDir)) return datacvDir;
    if (fs.existsSync(datanewDir)) return datanewDir;
    return datacvDir;
  };

  const dataDir = resolveDataDir();
  
  console.log('🚀 Starting Notion data import...\n');
  
  // Read CSV files (prefer *_all.csv when available; support datanew root exports)
  const files = fs.readdirSync(dataDir);

  const pickBest = (candidates: string[]) => {
    const scored = candidates
      .map((f) => {
        const lower = f.toLowerCase();
        const isAll = lower.endsWith('_all.csv');
        const hasDup = /\(\d+\)\.csv$/i.test(f);
        const score = (isAll ? 1000 : 0) + (hasDup ? -50 : 0) - f.length;
        return { f, score };
      })
      .sort((a, b) => b.score - a.score);
    return scored[0]?.f;
  };

  const findCsv = (needle: string) => {
    const direct = files.filter((f) => f.includes(needle) && f.toLowerCase().endsWith('.csv'));
    const chosen = pickBest(direct);
    if (!chosen) {
      throw new Error(`Missing CSV export: ${needle} (.csv) in ${dataDir}`);
    }
    return path.join(dataDir, chosen);
  };

  console.log(`📁 Using export dir: ${dataDir}`);

  const traineesCSV = fs.readFileSync(findCsv('Trainees (Master DB)'), 'utf-8');
  const batchesCSV = fs.readFileSync(findCsv('Batches (Master DB)'), 'utf-8');
  const assessmentsCSV = fs.readFileSync(findCsv('Assessments (Master DB)'), 'utf-8');
  const dailyCSV = fs.readFileSync(findCsv('Daily Attendance Log (Master DB)'), 'utf-8');
  const tenDayCSV = fs.readFileSync(findCsv('Attendance (10-Day Log)'), 'utf-8');
  
  console.log('📂 CSV files loaded successfully\n');
  
  // Parse data
  const { batches, batchMap } = parseBatches(batchesCSV);
  console.log(`✅ Parsed ${batches.length} batches`);
  
  const companySet = new Set<string>();
  const trainees = parseTrainees(traineesCSV, batchMap, companySet);
  console.log(`✅ Parsed ${trainees.length} trainees`);
  
  const companies = parseCompanies(companySet, trainees);
  console.log(`✅ Parsed ${companies.length} companies`);
  
  const assessments = parseAssessments(assessmentsCSV, trainees);
  console.log(`✅ Parsed ${assessments.length} assessments`);
  
  const dailyAttendance = parseDailyAttendance(dailyCSV, trainees);
  console.log(`✅ Parsed ${dailyAttendance.length} daily attendance records`);
  
  const tenDayAttendance = parseTenDayAttendance(tenDayCSV, trainees);
  console.log(`✅ Parsed ${tenDayAttendance.length} 10-day attendance records`);
  
  // Generate output
  const output = {
    trainees,
    batches,
    companies,
    assessments,
    dailyAttendance,
    tenDayAttendance,
    stats: {
      totalTrainees: trainees.length,
      totalBatches: batches.length,
      totalCompanies: companies.length,
      totalAssessments: assessments.length,
      totalDailyRecords: dailyAttendance.length,
      totalTenDayRecords: tenDayAttendance.length
    }
  };
  
  // Write to JSON file
  const outputPath = path.join(process.cwd(), 'lib', 'notionData.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n📁 Data written to ${outputPath}`);
  
  console.log('\n📊 Summary:');
  console.log(`   - Trainees: ${trainees.length}`);
  console.log(`   - Batches: ${batches.length}`);
  console.log(`   - Companies: ${companies.length}`);
  console.log(`   - Assessments: ${assessments.length}`);
  console.log(`   - Daily Attendance: ${dailyAttendance.length}`);
  console.log(`   - 10-Day Attendance: ${tenDayAttendance.length}`);
  console.log('\n✨ Import complete!');
}

main().catch(console.error);
