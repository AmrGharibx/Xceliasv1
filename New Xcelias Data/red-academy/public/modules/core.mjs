/** Shared, side-effect-free business rules used by the browser and the API. */
export const ZONE = 'Africa/Cairo';
export const STATUSES = ['Present', 'Absent', 'Tour Day', 'Off Day'];
export const OUTCOMES = ['Failed', 'Needs Improvement', 'Good', 'Very Good', 'Excellent', 'Aced'];
export const BATCH_STATUSES = ['Planning', 'Active', 'Completed'];
export const TABLES = ['companies','batches','trainees','daily_attendance','attendance_10day','assessments'];
export const id = () => globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const n=Math.random()*16|0;return(c==='x'?n:(n&3|8)).toString(16);});
export function today(now = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
export function parts(value) {
  const d = new Date(value); if (Number.isNaN(d.getTime())) throw new Error('Invalid timestamp.');
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  return p;
}
export function cairoTime(value) { if (!value) return ''; const p=parts(value); return `${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`; }
export function cairoDate(value) { const p=parts(value); return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`; }
export function validDate(s) { return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s; }
/** Convert Cairo wall time to UTC without assuming a fixed DST offset. */
export function atCairo(date, time) {
  if (!validDate(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) throw new Error('A valid date and time are required.');
  const [h,m,s=0]=time.split(':').map(Number); if(h>23||m>59||s>59)throw new Error('Invalid time.');
  const [y,mo,d]=date.split('-').map(Number); const target=Date.UTC(y,mo-1,d,h,m,s); let guess=target;
  for(let i=0;i<3;i++){const p=parts(guess);const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);guess+=target-represented;}
  const result=new Date(guess).toISOString(); const p=parts(result);
  if(p.hour!==h||p.minute!==m||p.second!==s||cairoDate(result)!==date) throw new Error('That local time does not exist during the daylight-saving transition.');
  return result;
}
export function minutesLate(arrival) { if(!arrival)return 0; const p=parts(arrival);return Math.max(0,p.hour*60+p.minute-660); }
export function wasLate(arrival) { if(!arrival)return false;const p=parts(arrival);return p.hour*3600+p.minute*60+p.second>11*3600; }
export function scores(a) {
 const fields=['product_knowledge','mapping','presentability','soft_skills'];
 for(const f of fields)if(a[f]!==null&&(typeof a[f]!=='number'||!Number.isFinite(a[f])||a[f]<0||a[f]>5))throw new Error('Every supplied score must be between 0 and 5.');
 const tech=a.product_knowledge===null||a.mapping===null?null:(a.product_knowledge+a.mapping)*10;
 const soft=a.presentability===null||a.soft_skills===null?null:(a.presentability+a.soft_skills)*10;
 return {tech,soft,overall:tech===null||soft===null?null:(tech+soft)/2};
}
export function assessedRows(rows){return rows.filter(a=>a.analytics_included!==false&&a.analytics_included!==0&&scores(a).overall!==null);}
export function averageScore(rows){const a=assessedRows(rows);return a.length?a.reduce((sum,r)=>sum+scores(r).overall,0)/a.length:null;}
export function assessmentFor(state,traineeId){const rows=state.assessments.filter(a=>a.trainee_id===traineeId);return assessedRows(rows)[0]||rows.find(a=>a.source_meta?.assessment_state!=='not_assessed')||rows[0]||null;}
export function checklistFor(state,traineeId){return state.attendance_10day.filter(r=>r.trainee_id===traineeId).sort((a,b)=>(b.period_end||'').localeCompare(a.period_end||''))[0]||null;}
export function canonicalAttendance(rows){return rows.filter(r=>r.analytics_included!==false&&r.analytics_included!==0);}
export function outcome(percent) {if(percent===null)return null;return percent>=95?'Aced':percent>=85?'Excellent':percent>=75?'Very Good':percent>=65?'Good':percent>=50?'Needs Improvement':'Failed';}
export function checklist(days) {const count=(days||[]).filter(Boolean).length;return {count,percent:count*10,status:count===10?'Complete':count?'In Progress':'Not Started'};}
export function addDays(date,n) {const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function sessionDates(start) {const out=[];let d=start;for(let i=0;i<30&&out.length<10;i++){const day=new Date(d+'T12:00:00Z').getUTCDay();if(day!==5&&day!==6)out.push(d);d=addDays(d,1);}return out;}
export function attendanceStats(entries) {const rows=canonicalAttendance([...new Map(entries.map(r=>[r.id,r])).values()]);const present=rows.filter(r=>r.status==='Present').length;const absent=rows.filter(r=>r.status==='Absent').length;return {present,absent,tour:rows.filter(r=>r.status==='Tour Day').length,off:rows.filter(r=>r.status==='Off Day').length,late:rows.filter(r=>r.is_late).length,calculatedLate:rows.filter(r=>wasLate(r.arrival_time)).length,rate:present+absent?present/(present+absent)*100:null};}
export function summary(state,record) {return {...checklist(record.days),...attendanceStats(state.daily_attendance.filter(a=>a.trainee_id===record.trainee_id&&a.batch_id===record.batch_id&&(!record.period_start||a.date>=record.period_start)&&(!record.period_end||a.date<=record.period_end)))};}
export function batchStats(state,batchId) {
 const trainees=state.trainees.filter(t=>t.batch_id===batchId),logs=state.attendance_10day.filter(r=>r.batch_id===batchId);
 const a=assessedRows(state.assessments.filter(a=>a.batch_id===batchId)),at=attendanceStats(state.daily_attendance.filter(r=>r.batch_id===batchId));
 return {trainees:trainees.length,present:at.present,absent:at.absent,late:at.late,completion:logs.length?logs.reduce((sum,r)=>sum+checklist(r.days).percent,0)/logs.length:null,score:averageScore(a),assessed:a.length};
}
export function reportFor(state,traineeId,kind='assessment') {
 const t=state.trainees.find(t=>t.id===traineeId); if(!t)throw new Error('Trainee not found.');const b=state.batches.find(b=>b.id===t.batch_id);const a=assessmentFor(state,t.id);const r=checklistFor(state,t.id);const stats=attendanceStats(state.daily_attendance.filter(r=>r.trainee_id===t.id));
 if(kind==='attendance') return `${t.trainee_name} | ${b?.batch_name||'Unassigned'}\n\n${stats.present} present, ${stats.absent} absent, ${stats.tour} tour and ${stats.off} off-day records. ${stats.late} entries are manually flagged late; ${stats.calculatedLate} arrivals are after 11:00 AM Cairo time. Recorded classroom attendance: ${stats.rate===null?'not yet available':stats.rate.toFixed(1)+'%'}. ${r?`Checklist completion: ${checklist(r.days).percent}% (${checklist(r.days).count}/10).`:'No checklist has been started.'}\n\n${stats.absent?'Review the missed sessions with the trainee and agree on a catch-up plan.':'Continue recording attendance for the remaining scheduled sessions.'} Unrecorded days are not counted as absences.`;
 if(!a)return 'No assessment has been saved for this trainee. Save an assessment before preparing the performance report.';
 if(a.source_meta?.assessment_state==='not_assessed'&&a.analytics_included===false)return `${t.trainee_name} | ${b?.batch_name||'Batch not recorded'}\n\nThe original record states that this trainee was not assessed. Its saved numbers and outcome remain available as original source values, but are excluded from graded averages. No grade has been inferred.\n\nInstructor comment: ${a.instructor_comment||'Not recorded'}.`;
 const sc=scores(a);if(sc.overall===null)return `${t.trainee_name} | ${b?.batch_name||'Batch not recorded'}\n\nThis source assessment is incomplete. Missing scores have not been converted to zero or treated as a failure.\n\nRecorded outcome: ${a.assessment_outcome||'Not recorded'}.\nInstructor comment: ${a.instructor_comment||'Not recorded'}.`;const fields=[['Mapping',a.mapping],['Product knowledge',a.product_knowledge],['Presentability',a.presentability],['Soft skills',a.soft_skills]].sort((a,b)=>a[1]-b[1]);
 return `${t.trainee_name} | ${b?.batch_name||'Unassigned'}\n\nOverall score: ${sc.overall.toFixed(1)}%. Technical: ${sc.tech.toFixed(1)}%. Soft skills: ${sc.soft.toFixed(1)}%. Recorded outcome: ${a.assessment_outcome}.\n\nStrongest assessed area: ${fields[3][0]} (${fields[3][1]}/5). Development focus: ${fields[0][0]} (${fields[0][1]}/5). ${fields[0][1]<4?'Schedule a focused practice exercise and reassess this skill.':'Maintain the current standard through practical application.'}\n\nDaily log: ${stats.present} present and ${stats.absent} absent records.${a.recorded_attendance!=null||a.recorded_absence!=null?` Assessment-reported totals (separate source): ${a.recorded_attendance??'not recorded'} present and ${a.recorded_absence??'not recorded'} absent.`:''} ${stats.late} manually flagged late entries.\n\nInstructor comment: ${a.instructor_comment||'No comment provided.'}`;
}
export function emptyState(){return Object.fromEntries([...TABLES,'audit_log','assessment_history','import_reviews','import_runs'].map(k=>[k,[]]));}
export function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
