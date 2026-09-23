import {STATUSES,ENROLLMENT_STATUSES,BATCH_STATUSES,OUTCOMES,validDate,scores,cairoDate} from '../public/modules/core.mjs';
export class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
const fail=message=>{throw new ApiError(400,message);};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isId(value){return typeof value==='string'&&uuid.test(value);}
/** Imported records may preserve explicit unknowns. The client cannot grant this exception. */
export function validate(table,input,{old=null}={}) {
 if(!input||typeof input!=='object'||Array.isArray(input))fail('A record object is required.');
 const legacy=!!old?.source_id,result={};
 const text=(key,max=200,required=false)=>{const v=input[key]??'';if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail(`Invalid ${key.replaceAll('_',' ')}.`);result[key]=v.trim();};
 const ref=(key,nullable=false)=>{if(nullable&&input[key]===null){result[key]=null;return;}if(!isId(input[key]))fail(`Choose a valid ${key.replace('_id','')}.`);result[key]=input[key];};
 const date=(key,nullable=false)=>{if(nullable&&input[key]===null){result[key]=null;return;}if(!validDate(input[key]))fail(`Invalid ${key.replaceAll('_',' ')}.`);result[key]=input[key];};
 const choice=(key,values,nullable=false)=>{if(nullable&&input[key]===null){result[key]=null;return;}if(!values.includes(input[key]))fail(`Invalid ${key}.`);result[key]=input[key];};
 const optionalCount=key=>{const v=input[key]??null;if(v!==null&&(!Number.isInteger(v)||v<0||v>10000))fail('Recorded attendance totals must be nonnegative whole numbers.');result[key]=v;};
 if(table==='companies'){text('name',120,true);}
 else if(table==='batches'){
  text('batch_name',120,true);text('description',3000);choice('status',BATCH_STATUSES,legacy);date('start_date',legacy);date('end_date',legacy);
  if(result.end_date&&result.start_date&&result.end_date<result.start_date)fail('The end date cannot be before the start.');
  if(!(legacy&&input.capacity===null)&&(!Number.isInteger(input.capacity)||input.capacity<1||input.capacity>1000))fail('Capacity must be between 1 and 1000.');result.capacity=input.capacity;
  if(!Array.isArray(input.session_dates)||(!legacy&&(input.session_dates.length<1||input.session_dates.length>366))||input.session_dates.length>366||input.session_dates.some(d=>!validDate(d))||new Set(input.session_dates).size!==input.session_dates.length)fail(legacy?'Use distinct valid recorded dates.':'Choose between 1 and 366 distinct session dates.');
  result.session_dates=[...input.session_dates].sort();
  if(!legacy&&(result.session_dates[0]<result.start_date||result.session_dates.at(-1)>result.end_date))fail('Session dates must be inside the batch date range.');
 }
 else if(table==='trainees'){
  text('trainee_name',160,true);ref('company_id',legacy);ref('batch_id',legacy);if(input.enrollment_status==null)result.enrollment_status='Active';else choice('enrollment_status',ENROLLMENT_STATUSES);text('email',254);text('phone',40);text('job_title',100);text('notes',3000);
  if(result.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))fail('Enter a valid email address.');
 }
 else if(table==='daily_attendance'){
  ref('trainee_id',legacy);ref('batch_id',legacy);date('date',legacy);choice('status',STATUSES,legacy);text('absence_reason',5000);
  if(input.assessment_day!==undefined&&typeof input.assessment_day!=='boolean')fail('Assessment day must be true or false.');result.assessment_day=input.assessment_day===true;
  if(result.assessment_day&&result.status!=='Present')fail('An assessment day must count as a present day.');
  if(typeof input.is_late!=='boolean')fail('The manual late flag must be true or false.');result.is_late=input.is_late;
  for(const key of ['arrival_time','departure_time']){const v=input[key];if(v!==null&&(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)||Number.isNaN(Date.parse(v))))fail('A time must include its timezone.');result[key]=v?new Date(v).toISOString():null;}
  // A note/report edit must not require inventing corrections to old source timestamps.
  const sameTimes=legacy&&['date','arrival_time','departure_time','status','is_late'].every(k=>result[k]===old[k]);
  if(!sameTimes){
   if(result.departure_time&&!result.arrival_time)fail('Record an arrival before a departure.');
   if(result.departure_time<result.arrival_time&&result.departure_time)fail('Departure cannot be before arrival.');
   if(result.arrival_time&&cairoDate(result.arrival_time)!==result.date)fail('Arrival must match the attendance date in Cairo.');
   if(['Absent','Off Day'].includes(result.status)&&(result.arrival_time||result.departure_time||result.is_late))fail('Absent and off-day entries cannot have check-in times or a late flag.');
  }
 }
 else if(table==='attendance_10day'){
  ref('trainee_id',legacy);ref('batch_id',legacy);date('period_start',legacy);date('period_end',legacy);
  if(result.period_start&&result.period_end&&result.period_end<result.period_start)fail('Invalid period.');
  if(!Array.isArray(input.days)||input.days.length!==10||input.days.some(d=>typeof d!=='boolean'))fail('The checklist must contain exactly 10 true/false values.');result.days=input.days;text('report',12000);choice('report_kind',['template','ai',...(legacy?['notion']:[])]);
 }
 else if(table==='assessments'){
  ref('trainee_id',legacy);ref('batch_id',legacy);text('assessment_title',160,true);
  try{scores(input);if(!legacy&&['mapping','product_knowledge','presentability','soft_skills'].some(f=>input[f]===null))throw new Error();}catch{fail('Each skill score must be a number between 0 and 5.');}
  for(const f of ['mapping','product_knowledge','presentability','soft_skills'])result[f]=input[f];choice('assessment_outcome',OUTCOMES,legacy);text('instructor_comment',5000);text('report',12000);choice('report_kind',['template','ai',...(legacy?['notion']:[])]);
  optionalCount('recorded_attendance');optionalCount('recorded_absence');
  if(input.company_id===undefined||input.company_id===null)result.company_id=null;else ref('company_id');
 }else fail('Unknown entity.');
 return result;
}
