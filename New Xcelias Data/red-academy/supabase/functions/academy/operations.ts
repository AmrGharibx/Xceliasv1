// @ts-nocheck -- this intentionally reuses the JavaScript validation contract.
import {TABLES,id,scores} from '../../../public/modules/core.mjs';
import {ApiError,isId,validate} from '../../../server/validation.mjs';

function canWrite(user){if(!['admin','instructor'].includes(user.role))throw new ApiError(403,'Your role is read-only.');}
function asArray(value){return Array.isArray(value)?value:[];}

/** Shared mutation preparation for the cloud API. The database RPC performs the
 * final optimistic-version check and runs the same invariant triggers atomically. */
export function prepareCloudOperations(body,state,user){
 const table=body.table;if(!TABLES.includes(table))throw new ApiError(400,'Unknown entity.');canWrite(user);
 const inputs=body.records||[body];if(!Array.isArray(inputs)||!inputs.length||inputs.length>100)throw new ApiError(400,'Choose between 1 and 100 records.');
 if(body.records&&table!=='daily_attendance')throw new ApiError(400,'Bulk editing is supported for daily attendance.');const ops=[],targets=new Set();
 for(const input of inputs){const action=input.action||body.action;if(!['create','update','delete'].includes(action))throw new ApiError(400,'Invalid action.');if(action==='delete'&&user.role!=='admin'&&!['batches','trainees'].includes(table))throw new ApiError(403,'Administrator access is required for this record type.');
  const old=action==='create'?null:asArray(state[table]).find(record=>record.id===input.id);if(action!=='create'&&(!isId(input.id)||!old))throw new ApiError(404,'Record not found.');
  if(old&&(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==old.version))throw new ApiError(409,'This record changed in another session. Refresh and try again.');
  const priorBatch=table==='batches'?old:old?.batch_id?asArray(state.batches).find(batch=>batch.id===old.batch_id):null;if(priorBatch?.archived_at)throw new ApiError(409,'Restore the archived batch before changing or deleting its records.');
  if(targets.has(input.id)&&input.id)throw new ApiError(400,'A record may only occur once in a request.');if(input.id)targets.add(input.id);
  if(action==='delete'){if(old.source_id&&user.role!=='admin')throw new ApiError(403,'Imported source records cannot be deleted by operational staff.');ops.push({table,action,id:old.id,expectedVersion:old.version});continue;}
  const data=validate(table,input.data,{old});
  const targetBatch=table==='batches'?null:asArray(state.batches).find(batch=>batch.id===data.batch_id);if(targetBatch?.archived_at)throw new ApiError(409,'Restore the archived batch before changing or adding its records.');
  // Source provenance is server-owned. Native cloud records begin with the
  // same empty immutable metadata the local SQLite repository assigns.
  if(!old){data.source_id=null;data.source_meta={};}
  // red_commit materializes every table column from JSON, so PostgreSQL
  // defaults do not apply to omitted fields. Match the table default here.
  if(table==='daily_attendance'&&!old)data.analytics_included=true;
  if(old&&'trainee_id' in old&&(old.trainee_id!==data.trainee_id||old.batch_id!==data.batch_id))throw new ApiError(400,'Existing source enrollment links cannot be reassigned by a record edit.');
  if(data.trainee_id){const trainee=asArray(state.trainees).find(record=>record.id===data.trainee_id);if(!trainee||trainee.batch_id!==data.batch_id)throw new ApiError(400,'The trainee must belong to this batch.');if(old&&(old.trainee_id!==data.trainee_id||old.batch_id!==data.batch_id))throw new ApiError(400,'An existing record cannot be assigned to a different trainee.');}
  if(table==='trainees'){
   const batch=asArray(state.batches).find(record=>record.id===data.batch_id);if((data.batch_id&&!batch)||(data.company_id&&!asArray(state.companies).some(company=>company.id===data.company_id)))throw new ApiError(400,'Choose an existing batch and company.');
   if(old&&old.batch_id!==data.batch_id)throw new ApiError(400,'Create a new enrollment to place this trainee in another batch.');
   if(!old&&batch?.capacity!=null&&asArray(state.trainees).filter(trainee=>trainee.batch_id===batch.id).length>=batch.capacity)throw new ApiError(400,'This batch is at capacity.');
  }
  if(table==='batches'&&old){if(data.capacity!=null&&data.capacity<asArray(state.trainees).filter(trainee=>trainee.batch_id===old.id).length)throw new ApiError(400,'Batch capacity cannot be lower than enrollment.');const scheduleChanged=JSON.stringify(old.session_dates)!==JSON.stringify(data.session_dates)||old.start_date!==data.start_date||old.end_date!==data.end_date;if(scheduleChanged&&!old.source_id&&asArray(state.trainees).some(trainee=>trainee.batch_id===old.id))throw new ApiError(400,'Enrolled batch dates are locked to preserve attendance history. Create a new batch for a new schedule.');}
  if(table==='daily_attendance'){
   const batch=asArray(state.batches).find(record=>record.id===data.batch_id);
   if(batch?.source_id&&data.date&&!batch.session_dates.includes(data.date)&&!ops.some(operation=>operation.table==='batches'&&operation.id===batch.id)){const additions=inputs.map(item=>item.data).filter(item=>item?.batch_id===batch.id&&item.date).map(item=>item.date);ops.push({table:'batches',action:'update',id:batch.id,expectedVersion:batch.version,data:{...batch,session_dates:[...new Set([...batch.session_dates,...additions])].sort()}});}
   if((!batch&&!old?.source_id)||(!old?.source_id&&!batch?.source_id&&!batch?.session_dates.includes(data.date)))throw new ApiError(400,'Attendance must be recorded on a scheduled session date. Add the date to the batch schedule before taking attendance.');
   if(data.trainee_id&&asArray(state.daily_attendance).some(record=>record.id!==old?.id&&record.trainee_id===data.trainee_id&&record.date===data.date)&&!(old?.source_id&&old.trainee_id===data.trainee_id&&old.date===data.date))throw new ApiError(409,'Attendance already exists for this trainee and date.');
  }
  if(['assessments','attendance_10day'].includes(table)&&data.trainee_id&&!old?.source_id&&asArray(state[table]).some(record=>record.id!==old?.id&&record.trainee_id===data.trainee_id&&record.batch_id===data.batch_id&&(table!=='attendance_10day'||(record.period_start===data.period_start&&record.period_end===data.period_end))))throw new ApiError(409,'This trainee already has a record in this batch.');
  if(table==='attendance_10day'&&!old?.source_id){const batch=asArray(state.batches).find(record=>record.id===data.batch_id);if(data.period_start!==batch?.start_date||data.period_end!==batch?.end_date)throw new ApiError(400,'The checklist period must match the batch dates.');}
  if(table==='assessments'){
   if(!old&&!data.company_id)data.company_id=asArray(state.trainees).find(trainee=>trainee.id===data.trainee_id)?.company_id||null;
   const complete=scores(data).overall!==null,notAssessed=/^\s*not\s+assess?ed\s*[.!]?\s*$/i.test(data.instructor_comment);
   if(!old||!['duplicate','multiple_results','shared'].includes(old.source_meta?.assessment_state))data.analytics_included=complete&&!notAssessed&&!!data.trainee_id;
  }
  const newId=old?.id||id();ops.push({table,action,id:newId,expectedVersion:old?.version,data});
  if(table==='trainees'&&!old){const batch=asArray(state.batches).find(record=>record.id===data.batch_id);if(batch?.start_date&&batch?.end_date)ops.push({table:'attendance_10day',action:'create',id:id(),data:{trainee_id:newId,batch_id:batch.id,period_start:batch.start_date,period_end:batch.end_date,days:Array(10).fill(false),report:'',report_kind:'template'}});}
 }
 return ops;
}
