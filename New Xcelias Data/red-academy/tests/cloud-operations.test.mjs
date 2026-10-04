import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareCloudOperations} from '../supabase/functions/academy/operations.ts';

const batchId='718677c5-2367-41bf-b17f-ea9da772ee83';
const companyId='f0f614de-64ce-5a15-b1f4-2728c07ccb2c';
const batch={id:batchId,batch_name:'Batch 43',status:'Active',start_date:'2026-10-04',end_date:'2026-10-15',capacity:54,session_dates:['2026-10-04','2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-11','2026-10-12','2026-10-13','2026-10-14','2026-10-15'],archived_at:null,source_id:null,version:1};

test('new cloud trainee enrollment explicitly supplies checklist database defaults',()=>{
 const state={batches:[batch],companies:[{id:companyId,name:'Dlleni'}],trainees:[],daily_attendance:[],attendance_10day:[],assessments:[]};
 const operations=prepareCloudOperations({table:'trainees',action:'create',data:{trainee_name:'Mina Daoud',company_id:companyId,batch_id:batchId,enrollment_status:'Active',job_title:'Sales',phone:'',email:'',notes:'..'}},state,{role:'admin',email:'admin@example.invalid'});
 assert.deepEqual(operations.map(operation=>operation.table),['trainees','attendance_10day']);
 assert.equal(operations[1].data.source_id,null);
 assert.deepEqual(operations[1].data.source_meta,{});
 assert.deepEqual(operations[1].data.days,Array(10).fill(false));
});

test('Never Started enrollment is preserved without generating an active checklist and releases a seat',()=>{
 const state={batches:[{...batch,capacity:1}],companies:[{id:companyId,name:'Dlleni'}],trainees:[],daily_attendance:[],attendance_10day:[],assessments:[]};
 const noShow=prepareCloudOperations({table:'trainees',action:'create',data:{trainee_name:'No Show',company_id:companyId,batch_id:batchId,enrollment_status:'Never Started',job_title:'Sales',phone:'',email:'',notes:''}},state,{role:'admin',email:'admin@example.invalid'});
 assert.deepEqual(noShow.map(operation=>operation.table),['trainees']);
 const occupied=[{id:'a4fcda8d-c24e-4d89-98a6-21c69571a1b2',batch_id:batchId,enrollment_status:'Never Started'}];
 const afterNoShow={...state,trainees:occupied};
 const replacement=prepareCloudOperations({table:'trainees',action:'create',data:{trainee_name:'Replacement',company_id:companyId,batch_id:batchId,enrollment_status:'Active',job_title:'Sales',phone:'',email:'',notes:''}},afterNoShow,{role:'admin',email:'admin@example.invalid'});
 assert.equal(replacement[0].data.trainee_name,'Replacement');
});

test('A trainee with a saved Present record cannot be classified as Never Started',()=>{
 const trainee={id:'a4fcda8d-c24e-4d89-98a6-21c69571a1b2',batch_id:batchId,enrollment_status:'Active',version:1};
 const state={batches:[batch],companies:[{id:companyId,name:'Dlleni'}],trainees:[trainee],daily_attendance:[{trainee_id:trainee.id,status:'Present'}],attendance_10day:[],assessments:[]};
 assert.throws(()=>prepareCloudOperations({table:'trainees',action:'update',id:trainee.id,expectedVersion:1,data:{trainee_name:'Was Present',company_id:companyId,batch_id:batchId,enrollment_status:'Never Started',job_title:'Sales',phone:'',email:'',notes:''}},state,{role:'admin',email:'admin@example.invalid'}),{status:400});
});
