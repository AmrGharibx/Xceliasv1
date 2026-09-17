import {id,sessionDates,emptyState} from '../public/modules/core.mjs';
export const actor={id:id(),email:'admin@example.test',full_name:'Test admin',role:'admin',active:true};
export const base=data=>({...data,id:id(),version:1,created_at:'2026-09-01T09:00:00.000Z',updated_at:'2026-09-01T09:00:00.000Z'});
export function fixtures(){
 const company=base({name:'Test Company'});
 const batch=base({batch_name:'Test batch',status:'Planning',start_date:'2026-09-06',end_date:'2026-09-19',session_dates:sessionDates('2026-09-06'),capacity:10,description:''});
 const trainee=base({trainee_name:'Test Trainee',company_id:company.id,batch_id:batch.id,email:'',phone:'',job_title:'',notes:''});
 const assessment=base({trainee_id:trainee.id,batch_id:batch.id,assessment_title:'Final',mapping:5,product_knowledge:5,presentability:5,soft_skills:4.5,assessment_outcome:'Aced',instructor_comment:'Test comment',report:'',report_kind:'template'});
 const summary=base({trainee_id:trainee.id,batch_id:batch.id,period_start:batch.start_date,period_end:batch.end_date,days:Array(10).fill(false),report:'',report_kind:'template'});
 return {company,batch,trainee,assessment,summary};
}
export const dataOnly=row=>Object.fromEntries(Object.entries(row).filter(([key])=>!['id','version','created_at','updated_at'].includes(key)));
export function fixtureState(){const f=fixtures(),s=emptyState();s.companies=[f.company];s.batches=[f.batch];s.trainees=[f.trainee];s.attendance_10day=[f.summary];return {...f,state:s};}
