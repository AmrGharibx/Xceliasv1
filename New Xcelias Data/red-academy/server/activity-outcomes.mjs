import {today,validDate} from '../public/modules/core.mjs';
import {ApiError,isId} from './validation.mjs';

export function activitySessionDate(value,batch) {
  if(value==null||value==='')return null;
  const dates=typeof batch?.session_dates==='string'?JSON.parse(batch.session_dates):batch?.session_dates;
  if(!validDate(value)||value>today()||!dates?.includes(value))throw new ApiError(400,'Choose a scheduled session date that is today or earlier.');
  return value;
}

export function activityAssignmentAction(body) {
  if(!body||!isId(body.id)||!Number.isInteger(body.expected_version)||body.expected_version<1)throw new ApiError(400,'Choose an activity assignment and refresh its current status.');
  return {id:body.id,expected_version:body.expected_version};
}

// Attendance represents confirmed participation, not accuracy. Existing records always win.
export function recordActivityPresence(repo,traineeId,batchId,date,sourceId,user) {
  const existing=repo.db.prepare('SELECT id,status FROM daily_attendance WHERE trainee_id=? AND batch_id=? AND date=? ORDER BY created_at,id LIMIT 1').get(traineeId,batchId,date);
  if(existing)return {id:existing.id,status:existing.status,created:false};
  const now=new Date().toISOString(),attendanceId=crypto.randomUUID();
  repo.insert('daily_attendance',{id:attendanceId,trainee_id:traineeId,batch_id:batchId,date,status:'Present',arrival_time:null,departure_time:null,is_late:0,assessment_day:0,absence_reason:'',analytics_included:1,source_meta:{activity_id:sourceId,confirmed_by:user.email},version:1,created_at:now,updated_at:now});
  repo.audit(user,'activity-attendance','daily_attendance',attendanceId,'Recorded trainer-confirmed activity participation as Present. No arrival time or late flag inferred.');
  return {id:attendanceId,status:'Present',created:true};
}
