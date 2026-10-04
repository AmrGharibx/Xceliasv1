import {ACTIVITY_BY_ID} from '../public/modules/activity-catalog.mjs';
import {today,validDate} from '../public/modules/core.mjs';
import {ApiError,isId} from './validation.mjs';
import {studioQuiz} from './activity-studio.mjs';

const ASSIGNMENT_STATES=['Open','Closed'];
const PARTICIPANT_STATES=['Assigned','In Progress','Completed'];

export function validateActivityAssignment(body,state,additionalActivity=null,sessionPlan=null){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError(400,'Enter a valid activity assignment.');
 if(!isId(body.batch_id))throw new ApiError(400,'Choose a valid batch.');
 const batch=state.batches.find(row=>row.id===body.batch_id);
 if(!batch||batch.archived_at)throw new ApiError(400,'Choose an active, non-archived batch.');
 const sessionPlanId=body.session_plan_id==null||body.session_plan_id===''?null:body.session_plan_id;
 if(sessionPlanId!==null){
  if(!isId(sessionPlanId)||!sessionPlan||sessionPlan.id!==sessionPlanId)throw new ApiError(400,'Choose a valid shared session plan.');
  if(sessionPlan.linked_assignment_id)throw new ApiError(409,'This session already has a linked follow-up quiz. Open that assignment from the shared session board.');
  if(sessionPlan.session_date>today())throw new ApiError(409,'This session’s private quiz unlocks on its scheduled date.');
  if(sessionPlan.batch_id!==body.batch_id||sessionPlan.activity_id!==body.activity_id)throw new ApiError(400,'The follow-up quiz must use the challenge and batch from its session plan.');
 }
 const selectedActivity=typeof body.activity_id==='string'?(ACTIVITY_BY_ID.get(body.activity_id)||studioQuiz(body.activity_id)||(additionalActivity?.id===body.activity_id?additionalActivity:null)):null;
 if(!selectedActivity)throw new ApiError(400,'Choose an activity from the library.');
 if(body.due_date!=null&&body.due_date!==''&&(!validDate(body.due_date)||body.due_date<today()))throw new ApiError(400,'Choose a valid due date that is today or later.');
 if(typeof body.instructions!=='string'||body.instructions.length>2000)throw new ApiError(400,'Instructions must be 2,000 characters or fewer.');
 if(!Array.isArray(body.trainee_ids)||body.trainee_ids.length<1||body.trainee_ids.length>1000||body.trainee_ids.some(value=>!isId(value))||new Set(body.trainee_ids).size!==body.trainee_ids.length)throw new ApiError(400,'Select between 1 and 1,000 distinct trainees.');
 const eligible=state.trainees.filter(row=>row.batch_id===batch.id&&row.enrollment_status==='Active');
 if(body.trainee_ids.some(id=>!eligible.some(row=>row.id===id)))throw new ApiError(400,'Every selected trainee must be active and belong to this batch.');
 if(sessionPlan?.company_id&&body.trainee_ids.some(id=>state.trainees.find(row=>row.id===id)?.company_id!==sessionPlan.company_id))throw new ApiError(400,'Every selected trainee must belong to the company scoped by this session.');
 return {batch_id:batch.id,activity_id:body.activity_id,title:selectedActivity.title,instructions:body.instructions.trim(),due_date:body.due_date||null,trainee_ids:[...body.trainee_ids],...(sessionPlanId?{session_plan_id:sessionPlanId}:{})};
}

export function validateActivityProgress(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!isId(body.assignment_id)||!isId(body.trainee_id)||!Number.isInteger(body.expected_version)||body.expected_version<1)throw new ApiError(400,'Choose a valid activity participant and refresh its current progress.');
 if(!PARTICIPANT_STATES.includes(body.status))throw new ApiError(400,'Choose a valid progress status.');
 if(body.score!==null&&body.score!==''&&(!Number.isFinite(body.score)||body.score<0||body.score>100))throw new ApiError(400,'Score must be between 0 and 100, or left blank.');
 if(typeof body.trainer_feedback!=='string'||body.trainer_feedback.length>4000)throw new ApiError(400,'Trainer feedback must be 4,000 characters or fewer.');
 return {assignment_id:body.assignment_id,trainee_id:body.trainee_id,expected_version:body.expected_version,status:body.status,score:body.score===''?null:body.score,trainer_feedback:body.trainer_feedback.trim()};
}

export function validateAssignmentClose(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||!isId(body.id)||!Number.isInteger(body.expected_version)||body.expected_version<1)throw new ApiError(400,'Choose an activity assignment and refresh its current status.');
 if(!ASSIGNMENT_STATES.includes(body.status)||body.status!=='Closed')throw new ApiError(400,'Assignments can only be closed from this action.');
 return {id:body.id,expected_version:body.expected_version,status:body.status};
}
