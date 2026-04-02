// ============================================================
//  AVARIA LMS — Batch Report PDF Generator
//  Mirrors the exact visual structure of Report Generation 3/index.html
// ============================================================

export interface TraineeReportData {
  name: string;
  company: string;
  batch: string;
  overallScore: number;
  assessmentResult: string;
  rawAssessmentOutcome: string;
  badgeClass: string;
  scores: {
    productKnowledge: { score: number; max: number };
    mapping: { score: number; max: number };
    softSkills: { score: number; max: number };
    presentability: { score: number; max: number };
    techScorePercent: number;
    softScorePercent: number;
    totalCore: number;
    professionalConductRating: { score: number; max: number };
  };
  attendance: {
    attendanceDays: number | string;
    absent: number;
    late: number | string;
    missedContent: string;
  };
  comments: string;
}

export interface ReportPayload {
  batch: { name: string; startDate: string; endDate: string };
  company: string;
  trainees: TraineeReportData[];
}

// ── Text helpers (same logic as the standalone report generator) ─────────────
function heOrShe(name: string): string {
  const n = name.trim().split(/\s+/)[0].toLowerCase();
  const fem = ['a','ah','ia','na','da','ra','ya','ie','ey','een','ine','ina'];
  return fem.some(e => n.endsWith(e)) ? 'She' : 'He';
}
function article(r: string): string {
  return 'AEIOU'.includes(r[0]) ? 'an' : 'a';
}
function listify(arr: string[]): string {
  if (!arr.length) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr[0] + ' and ' + arr[1];
  return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
}
function fmtDate(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function cprt(): string {
  return `\u00A9 ${new Date().getFullYear()} RED Real Estate Domain Training Academy. All rights reserved.`;
}
function ee(s: unknown): string {
  const d = document.createElement('div');
  d.textContent = String(s ?? '');
  return d.innerHTML;
}

function genAssessment(t: TraineeReportData): string {
  const name = t.name || 'The trainee';
  const res = t.assessmentResult;
  const ov = t.overallScore;
  const pk = t.scores.productKnowledge.score;
  const mp = t.scores.mapping.score;
  const ss = t.scores.softSkills.score;
  const pr = t.scores.presentability.score;
  const tech = t.scores.techScorePercent;
  const soft = t.scores.softScorePercent;
  const attendanceDays = t.attendance.attendanceDays;
  const absent = t.attendance.absent;

  const areas = [
    { name: 'Product Knowledge', score: pk, max: 5 },
    { name: 'Mapping', score: mp, max: 5 },
    { name: 'Soft Skills', score: ss, max: 5 },
    { name: 'Presentability', score: pr, max: 5 },
  ].sort((a, b) => b.score - a.score);

  const strengths = areas.filter(a => a.score >= 4);
  const weaknesses = areas.filter(a => a.score < 4);
  const perfectAreas = areas.filter(a => a.score === a.max);

  let text = `${name} achieved ${article(res)} '${res}' result with an overall score of ${ov}%.`;

  if (strengths.length > 0) {
    const names = strengths.map(a => `${a.name} (${a.score}/${a.max})`);
    const verb = strengths.length > 1 ? 'demonstrated strong performance across' : 'demonstrated strong performance in';
    text += ` ${heOrShe(name)} ${verb} ${listify(names)}`;
    if (perfectAreas.length > 0) {
      text += `, with perfect scores in ${listify(perfectAreas.map(a => a.name))}`;
    }
    text += '.';
  }

  text += ` The Tech Score of ${tech}% reflects ${tech >= 90 ? 'outstanding' : tech >= 80 ? 'solid' : tech >= 70 ? 'good' : tech >= 60 ? 'adequate' : 'limited'} technical competency`;
  if (weaknesses.length > 0) {
    text += `, though there is room for improvement in ${listify(weaknesses.map(a => `${a.name} (${a.score}/${a.max})`))}`;
  }
  text += '.';

  text += ` Professional conduct was rated at ${soft}%`;
  if (soft >= 90) text += ', reflecting excellent professionalism';
  else if (soft >= 80) text += ', indicating strong professionalism';
  else if (soft >= 70) text += ', showing good professional conduct';
  text += '.';

  if (absent === 0 && attendanceDays !== 'N/A' && attendanceDays != null) {
    text += ` ${heOrShe(name)} maintained full attendance across ${attendanceDays} training day${attendanceDays !== 1 ? 's' : ''} with no absences.`;
  } else if (absent === 0) {
    text += ` ${heOrShe(name)} maintained perfect attendance with no absences throughout the training period.`;
  } else if (attendanceDays !== 'N/A' && attendanceDays != null) {
    text += ` Attendance was ${attendanceDays} day${attendanceDays !== 1 ? 's' : ''} with ${absent} absence${absent !== 1 ? 's' : ''} during the training period.`;
  } else if (absent > 0) {
    text += ` ${heOrShe(name)} had ${absent} absence${absent !== 1 ? 's' : ''} during the training period.`;
  }

  return text;
}

function genComments(t: TraineeReportData): string {
  const pk = t.scores.productKnowledge.score;
  const mp = t.scores.mapping.score;
  const ss = t.scores.softSkills.score;
  const pr = t.scores.presentability.score;
  const ov = t.overallScore;
  const parts: string[] = [];
  if (ov >= 90) parts.push('Outstanding overall performance');
  else if (ov >= 80) parts.push('Good efforts');
  else if (ov >= 70) parts.push('Decent performance');
  else if (ov >= 60) parts.push('Acceptable performance');
  else parts.push('Needs significant improvement');
  const high: string[] = [];
  if (pk >= 4.5) high.push('technical knowledge');
  if (mp >= 4.5) high.push('mapping skills');
  if (ss >= 4.5) high.push('soft skills');
  if (pr >= 4.5) high.push('presentability');
  if (high.length) parts.push('great ' + listify(high));
  const low: string[] = [];
  if (pk < 3.5) low.push('product knowledge');
  if (mp < 3.5) low.push('mapping');
  if (ss < 3.5) low.push('soft skills');
  if (pr < 3.5) low.push('presentability');
  if (low.length) parts.push('needs to focus more on ' + listify(low));
  return parts.join(', ') + '.';
}

// ── The Avaria/RED logo SVG (same as report generator) ──────────────────────
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3508 1240"><defs><style>.c1{fill:#cb1419;}</style></defs><g><g><g><path d="M510.5,201.9l-216.9,100.6-105.8,183c-132.4,229.1-129.2,223.5-128.6,224.1s53.3-26.4,134.5-68.1l14.2-7.3-.6,9.1c-.6,10,.9,28.6,3.2,40,5.4,26,19,51.9,37.1,70.7l6.3,6.6-2.9,8.5c-6,17.2-4.9,30.4,3.1,37.2,5.6,4.8,11.6,6.1,25.2,5.4l10.9-.5,2.8,6.2c7.2,15.9,11.9,35.1,12.7,51.6.8,17.5-2.4,31.4-10.2,44.5-2,3.2-3.3,6-3.1,6.3.8.7,9.2-1.6,19.6-5.5,33.7-12.6,55.4-30.6,63.2-52.5,3.2-9.1,3.2-25.3,0-35.8-6.7-21.3-19.7-37.5-37.2-46.3-3.6-1.7-6.6-3.2-6.7-3.2s1-4.3,2.3-9.5c4.6-17.7,2.9-30.5-4.8-36.3-6.5-5-11.1-6.1-25.3-5.8-7.1.1-14.3.2-16,.4-2.6.2-3.5-.6-8.7-7.8-36.7-51.1-33.3-125,9.3-202.9,18.4-33.6,50.9-77.3,81.2-109.1,1-1.1-1.5,3.2-5.6,9.5-41.5,64.3-73.5,128.3-80.2,160.4-1.7,8.4-2,17.9-.5,17.4.5-.2,43.7-24.4,96.1-53.8l95.1-53.5,127.9-191.7c70.4-105.5,127.9-192,127.9-192.3s-.6-.5-1.2-.4c-.7.1-98.9,45.4-218.3,100.8Z"/><path d="M552.3,429.8l-61.8,81.8-92.2,55.8c-50.8,30.7-92.3,56.3-92.3,56.8s7.3,11.7,16.2,25l16.1,24,5.1-.6c7.4-1,27.2-6.1,41.6-10.8,88-28.6,172.4-98.4,239.6-198.3,15.8-23.4,37.3-60.4,39-66.9.4-1.9-3-5.7-23.5-25.4-13.2-12.8-24.4-23.2-24.9-23.2s-28.8,36.8-62.9,81.8Z"/><path class="c1" d="M699.4,414.7l-7,.4-4.4,7.7c-17,30.1-46.2,72.3-72.4,104.7-25.4,31.3-62.3,69.4-88.5,91-66.7,55.2-130.9,82-197.6,82.6h-9l3.5,1.6c19.9,9.1,22.6,10.7,29.1,17.2s7.1,8.1,8.7,12.4c3.2,8.3,3,18.4-.5,28.9l-2.7,8.1,4,3c7,5.4,21.8,21.1,26.2,27.7,9.8,15,14.2,28.3,14.2,43.5,0,23.8-10.4,44.1-35.2,68.8l-13.8,13.7v155h718.2l-.6-324.8c-.3-178.6-.9-328.6-1.2-333.5l-.6-8.7-181.7.2c-99.9.1-184.8.4-188.7.5Z"/></g></g></g></svg>`;

// ── Report page HTML builders (exact match of standalone generator) ──────────
function mkIntro(data: ReportPayload): string {
  return `<div class="rg-page"><div class="rg-cover-layout"><div class="rg-cover-sidebar"><h2>RED</h2></div><div class="rg-cover-content">
    <div class="rg-cover-logo">${LOGO}</div>
    <div class="rg-cover-title"><h1 class="rg-text-dark">Trainee Performance</h1><h1 class="rg-text-red">Report</h1></div>
    <div class="rg-cover-info">
      <div class="rg-cover-info-row"><span class="rg-cover-info-label">Company Name</span><span class="rg-cover-info-value">${ee(data.company)}</span></div>
      <div class="rg-cover-info-row"><span class="rg-cover-info-label">Batch</span><span class="rg-cover-info-value">${ee(data.batch.name)}</span></div>
      <div class="rg-cover-info-row"><span class="rg-cover-info-label">Number of Trainees</span><span class="rg-cover-info-value">${data.trainees.length}</span></div>
    </div>
    <div class="rg-cover-footer"><p>Report Generated on: ${fmtDate()}</p><p>${cprt()}</p></div>
  </div></div></div>`;
}

function mkPage(t: TraineeReportData): string {
  const outcomeLabel = t.rawAssessmentOutcome || t.assessmentResult;
  const ld = (t.attendance.late === 'N/A' || t.attendance.late == null) ? 'N/A' : `${t.attendance.late} Days`;
  const ad = (t.attendance.attendanceDays === 'N/A' || t.attendance.attendanceDays == null) ? 'N/A' : `${t.attendance.attendanceDays} Day${t.attendance.attendanceDays !== 1 ? 's' : ''}`;
  const md = t.attendance.missedContent ?? 'N/A';
  const tcm = t.scores.mapping.max + t.scores.productKnowledge.max;
  const cm  = t.scores.presentability.max + t.scores.softSkills.max;
  const sc  = t.assessmentResult === 'Failed' ? 'rg-score-red' : 'rg-score-green';
  const dc  = (t.attendance.attendanceDays === 'N/A') ? 'rg-text-na' : 'rg-text-aok';
  const lc  = (t.attendance.late === 'N/A') ? 'rg-text-na' : (t.attendance.late === 0 ? 'rg-text-aok' : 'rg-text-aw');
  const ac  = t.attendance.absent === 0 ? 'rg-text-aok' : 'rg-text-aw';
  const assessment = genAssessment(t);
  const comments   = t.comments || genComments(t);

  return `<div class="rg-page">
    <div class="rg-report-header">
      <div class="rg-report-header-logo">${LOGO}</div>
      <div class="rg-report-header-right"><h1>Trainee Performance Report</h1><p>${ee(t.batch)}</p></div>
    </div>
    <div class="rg-report-body">
      <div class="rg-details-card">
        <div><h3>Trainee Details</h3><p><span class="rg-label">Name:</span> ${ee(t.name)}</p><p><span class="rg-label">Company:</span> ${ee(t.company)}</p></div>
        <div style="text-align:right"><h3>Overall Performance</h3>
          <div class="rg-score-big ${sc}">${t.overallScore}<span>%</span></div>
          <div class="rg-badge ${t.badgeClass}">${ee(outcomeLabel)}</div>
        </div>
      </div>
      <h3 class="rg-section-title">Overall Assessment</h3>
      <div class="rg-assessment-box"><p>${ee(assessment)}</p></div>
      <div class="rg-two-col">
        <div>
          <h3 class="rg-section-title">Detailed Score Breakdown</h3>
          <table class="rg-data-table"><thead><tr><th>Performance Area</th><th>Score</th></tr></thead><tbody>
            <tr><td>Product Knowledge</td><td>${t.scores.productKnowledge.score} out of ${t.scores.productKnowledge.max}</td></tr>
            <tr><td>Mapping</td><td>${t.scores.mapping.score} out of ${t.scores.mapping.max}</td></tr>
            <tr class="rg-row-total"><td>Total (Core Skills)</td><td>${t.scores.totalCore} out of ${tcm}</td></tr>
            <tr class="rg-row-pct rg-row-pct-b"><td>Tech Score %</td><td>${t.scores.techScorePercent}%</td></tr>
            <tr><td>Soft Skills</td><td>${t.scores.softSkills.score} out of ${t.scores.softSkills.max}</td></tr>
            <tr><td>Presentability</td><td>${t.scores.presentability.score} out of ${t.scores.presentability.max}</td></tr>
            <tr class="rg-row-total"><td>Professional Conduct Rating</td><td>${t.scores.professionalConductRating.score} out of ${cm}</td></tr>
            <tr class="rg-row-pct"><td>Professionalism Score %</td><td>${t.scores.softScorePercent}%</td></tr>
          </tbody></table>
        </div>
        <div>
          <h3 class="rg-section-title">Attendance &amp; Professionalism</h3>
          <table class="rg-data-table"><thead><tr><th>Metric</th><th>Record</th></tr></thead><tbody>
            <tr><td>Attendance Days</td><td class="${dc}">${ad}</td></tr>
            <tr><td>Punctuality (Late Arrivals)</td><td class="${lc}">${ld}</td></tr>
            <tr><td>Attendance (Absent Days)</td><td class="${ac}">${t.attendance.absent} Day${t.attendance.absent !== 1 ? 's' : ''}</td></tr>
            <tr><td>Missed Content Percentage</td><td class="rg-text-na">${md}</td></tr>
          </tbody></table>
        </div>
      </div>
      <h3 class="rg-section-title">Trainer's Comments</h3>
      <div class="rg-comments-box"><p>"${ee(comments)}"</p></div>
    </div>
    <div class="rg-report-footer"><p>Report Generated on: ${fmtDate()}</p><p>${cprt()}</p></div>
  </div>`;
}

function mkOutro(data: ReportPayload): string {
  const names = data.trainees.map(t => t.name);
  const nl = listify(names);
  const p1 = `This report concludes the performance evaluation for the ${data.trainees.length > 1 ? data.trainees.length + ' trainees' : 'trainee'}: ${nl}.`;
  const tiers: Record<string, TraineeReportData[]> = { Aced: [], Excellent: [], Good: [], Passed: [], Failed: [] };
  data.trainees.forEach(t => { if (tiers[t.assessmentResult]) tiers[t.assessmentResult].push(t); });
  const fmt = (a: TraineeReportData[]) => listify(a.map(t => t.name));
  const fmtS = (a: TraineeReportData[]) => listify(a.map(t => t.overallScore + '%'));
  const p2: string[] = [];
  if (tiers.Aced.length)      p2.push(`We are pleased to report that ${fmt(tiers.Aced)} achieved an 'Aced' result with ${tiers.Aced.length > 1 ? 'scores' : 'a score'} of ${fmtS(tiers.Aced)}. Their outstanding performance confirms their readiness to immediately begin professional roles in the real estate domain.`);
  if (tiers.Excellent.length) p2.push(`${fmt(tiers.Excellent)} achieved an 'Excellent' result with ${tiers.Excellent.length > 1 ? 'scores' : 'a score'} of ${fmtS(tiers.Excellent)}, demonstrating strong overall competency and a high level of professionalism.`);
  if (tiers.Good.length)      p2.push(`${fmt(tiers.Good)} received a 'Good' assessment with ${tiers.Good.length > 1 ? 'scores' : 'a score'} of ${fmtS(tiers.Good)}, showing solid foundational skills and readiness for practical application.`);
  if (tiers.Passed.length)    p2.push(`${fmt(tiers.Passed)} achieved a 'Passed' result with ${tiers.Passed.length > 1 ? 'scores' : 'a score'} of ${fmtS(tiers.Passed)}, meeting the minimum competency requirements.`);
  if (tiers.Failed.length)    p2.push(`However, ${fmt(tiers.Failed)} did not meet the passing criteria and ${tiers.Failed.length > 1 ? 'are' : 'is'} required to re-attend the training program.`);

  return `<div class="rg-page"><div class="rg-cover-layout"><div class="rg-cover-sidebar"><h2>RED</h2></div><div class="rg-cover-content">
    <div class="rg-cover-logo">${LOGO}</div>
    <div class="rg-cover-title"><h1 class="rg-text-dark">Concluding</h1><h1 class="rg-text-red">Remarks</h1></div>
    <div class="rg-outro-text"><p>${ee(p1)}</p><p>${ee(p2.join(' '))}</p></div>
    <div class="rg-quote-section">
      <div class="rg-quote-label">A Final Thought</div>
      <div class="rg-quote-text">"The only way to do great work is to love what you do."</div>
      <div class="rg-quote-author">&mdash; Steve Jobs</div>
    </div>
    <div class="rg-cover-footer"><p>Report Generated on: ${fmtDate()}</p><p>${cprt()}</p></div>
  </div></div></div>`;
}

// ── Report page CSS (scoped with rg- prefix to avoid LMS conflicts) ──────────
export const REPORT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Montserrat:wght@400;500;600;700&display=swap');
  :root{--rg-red:#c1121f;--rg-green:#16a34a;--rg-orange:#d97706;--rg-g50:#f9fafb;--rg-g100:#f3f4f6;--rg-g200:#e5e7eb;--rg-g300:#d1d5db;--rg-g400:#9ca3af;--rg-g500:#6b7280;--rg-g600:#4b5563;--rg-g700:#374151;--rg-g800:#1f2937;--rg-accent:#c1121f}
  .rg-page{width:210mm;min-height:297mm;background:#fff;overflow:hidden;position:relative;font-family:'Montserrat',sans-serif}
  .rg-cover-layout{display:flex;height:297mm}
  .rg-cover-sidebar{width:25%;background:var(--rg-red);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .rg-cover-sidebar h2{color:#fff;font-family:'Playfair Display',serif;font-weight:800;font-size:3.5rem;transform:rotate(-90deg);letter-spacing:.2em;white-space:nowrap}
  .rg-cover-content{width:75%;padding:50px 50px 30px;display:flex;flex-direction:column}
  .rg-cover-logo{max-width:360px}
  .rg-cover-logo svg{width:100%;height:auto;display:block}
  .rg-cover-title{margin-top:70px}
  .rg-cover-title h1{font-family:'Playfair Display',serif;font-size:3rem;font-weight:800;line-height:1.15;letter-spacing:-.02em;margin:0}
  .rg-text-dark{color:var(--rg-g800)}.rg-text-red{color:var(--rg-red)}
  .rg-cover-info{margin-top:80px}
  .rg-cover-info-row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--rg-g200);padding-bottom:12px;margin-bottom:20px}
  .rg-cover-info-label{font-size:1.1rem;color:var(--rg-g500)}.rg-cover-info-value{font-size:1.1rem;color:var(--rg-g500);font-weight:300;text-align:right}
  .rg-cover-footer{margin-top:auto;padding-top:24px;border-top:1px solid var(--rg-g100);font-size:.78rem;color:var(--rg-g400)}
  .rg-outro-text{margin-top:40px}.rg-outro-text p{font-size:1.05rem;color:var(--rg-g700);line-height:1.7;margin-bottom:18px}
  .rg-quote-section{margin-top:30px;padding-top:24px;border-top:2px solid var(--rg-g200)}
  .rg-quote-label{font-size:.85rem;font-weight:600;color:var(--rg-g500);text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px}
  .rg-quote-text{font-size:1.3rem;font-style:italic;color:var(--rg-g600);font-weight:300;line-height:1.5}
  .rg-quote-author{margin-top:10px;text-align:right;font-size:1rem;color:var(--rg-red);font-weight:600}
  .rg-report-header{display:flex;justify-content:space-between;align-items:center;padding:20px 28px;border-bottom:1px solid var(--rg-g200);background:#fff}
  .rg-report-header-logo{height:48px}.rg-report-header-logo svg{height:100%;width:auto;display:block}
  .rg-report-header-right{text-align:right}
  .rg-report-header-right h1{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:var(--rg-accent);margin:0}
  .rg-report-header-right p{font-size:1rem;font-weight:600;color:var(--rg-g600);margin:2px 0 0}
  .rg-report-body{padding:20px 28px}
  .rg-details-card{display:flex;justify-content:space-between;align-items:flex-start;background:var(--rg-g50);border:1px solid var(--rg-g200);border-radius:8px;padding:18px 22px;margin-bottom:20px}
  .rg-details-card h3{font-size:.95rem;font-weight:700;color:var(--rg-g800);margin:0 0 5px}
  .rg-details-card p{font-size:.85rem;color:var(--rg-g600);margin:2px 0}
  .rg-label{font-weight:600}
  .rg-score-big{font-size:2.8rem;font-weight:700;line-height:1;position:relative;padding-bottom:10px}
  .rg-score-big::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,rgba(193,18,31,.25),rgba(193,18,31,.7));border-radius:999px}
  .rg-score-big span{font-size:1.6rem}
  .rg-score-green{color:var(--rg-green)}.rg-score-red{color:#dc2626}
  .rg-section-title{font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--rg-g800);border-left:4px solid var(--rg-accent);border-bottom:1px solid var(--rg-g200);padding-left:12px;padding-bottom:6px;margin-bottom:10px}
  .rg-assessment-box{background:var(--rg-g50);border:1px solid var(--rg-g200);border-radius:8px;padding:12px 16px;margin-bottom:20px}
  .rg-assessment-box p{font-size:.85rem;color:var(--rg-g700);line-height:1.6;margin:0}
  .rg-two-col{display:flex;gap:20px;margin-bottom:20px}.rg-two-col>div{flex:1}
  .rg-data-table{width:100%;border-collapse:collapse;border:1px solid var(--rg-g200);border-radius:8px;overflow:hidden;font-size:.8rem}
  .rg-data-table th{background:var(--rg-g50);padding:8px 12px;font-weight:600;color:var(--rg-g600);text-align:left}
  .rg-data-table th:last-child{text-align:right}
  .rg-data-table td{padding:8px 12px;border-top:1px solid var(--rg-g200);color:var(--rg-g700)}
  .rg-data-table td:last-child{text-align:right;font-weight:500}
  .rg-row-total{background:var(--rg-g50)}.rg-row-total td{font-weight:700;color:var(--rg-g800)}
  .rg-row-pct td{font-weight:600;font-style:italic;color:var(--rg-g800);background:var(--rg-g50)}
  .rg-row-pct-b td{border-bottom:2px solid var(--rg-g300)}
  .rg-text-aok{color:var(--rg-green);font-weight:600}.rg-text-aw{color:var(--rg-orange);font-weight:600}.rg-text-na{color:var(--rg-g400);font-weight:600}
  .rg-comments-box{background:var(--rg-g50);border-left:4px solid var(--rg-g300);border-radius:8px;padding:12px 16px;margin-bottom:20px}
  .rg-comments-box p{font-size:.85rem;color:var(--rg-g700);font-style:italic;margin:0}
  .rg-report-footer{text-align:center;padding:14px 28px;border-top:1px solid var(--rg-g200);font-size:.68rem;color:var(--rg-g400)}
  .rg-badge{display:inline-block;padding:3px 14px;border-radius:999px;font-size:.76rem;font-weight:600}
  .b-green{background:#bbf7d0;color:#166534}.b-blue{background:#bfdbfe;color:#1e40af}.b-yellow{background:#fef08a;color:#854d0e}.b-gray{background:#f3f4f6;color:#374151}.b-red{background:#fecaca;color:#991b1b}
`;

// ── Main export: generates and downloads the PDF ─────────────────────────────
export async function generateBatchReport(
  data: ReportPayload,
  onProgress?: (msg: string, pct: number) => void
): Promise<void> {
  const report = (msg: string, pct: number) => onProgress?.(msg, pct);

  report('Preparing report pages...', 5);

  // Create a hidden container to render report pages
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';

  // Inject font + report styles
  const style = document.createElement('style');
  style.textContent = REPORT_CSS;
  container.appendChild(style);

  // Build all pages HTML
  let html = mkIntro(data);
  data.trainees.forEach(t => { html += mkPage(t); });
  html += mkOutro(data);

  const pagesWrapper = document.createElement('div');
  pagesWrapper.innerHTML = html;
  container.appendChild(pagesWrapper);
  document.body.appendChild(container);

  // Wait for fonts/images to load
  await new Promise(r => setTimeout(r, 500));

  report('Loading PDF engine...', 10);

  // Dynamically import libraries to avoid SSR issues
  const [html2canvasModule, jsPDFModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const html2canvas = html2canvasModule.default;
  const { jsPDF } = jsPDFModule;

  const pages = container.querySelectorAll<HTMLElement>('.rg-page');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < pages.length; i++) {
    const pct = 15 + Math.round(((i + 1) / pages.length) * 80);
    report(`Rendering page ${i + 1} of ${pages.length}...`, pct);

    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: pages[i].scrollWidth,
      height: pages[i].scrollHeight,
    });

    if (i > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
  }

  report('Saving PDF...', 98);
  const safeCo = data.company.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
  const safeBatch = data.batch.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
  pdf.save(`Avaria_Report_${safeCo}_${safeBatch}.pdf`);

  document.body.removeChild(container);
  report('Done!', 100);
}
