import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBatchReport,reporterTier} from '../public/modules/academy-reports.mjs';
import {companyReportJobs,reportFilename} from '../public/modules/reporter-generator.mjs';
import {fixtureState} from './fixtures.mjs';

function attendance(id,traineeId,batchId,status){return {id,trainee_id:traineeId,batch_id:batchId,status,analytics_included:true,is_late:false,arrival_time:null};}

test('academy batch reports use the Reporter Generator four-score calculation and bands',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 state.assessments=[assessment];
 state.daily_attendance=[attendance('present',trainee.id,batch.id,'Present'),attendance('absent',trainee.id,batch.id,'Absent')];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id});
 assert.equal(report.items.length,1);
 assert.equal(report.items[0].profile.tech,100);
 assert.equal(report.items[0].profile.soft,95);
 assert.equal(report.items[0].profile.overall,97.5);
 assert.equal(report.items[0].profile.tier,'Aced');
 assert.equal(report.items[0].attendance.rate,50);
 assert.equal(reporterTier(80),'Excellent');
 assert.equal(reporterTier(70),'Good');
 assert.equal(reporterTier(60),'Passed');
});

test('academy reports filter by both batch and company without mixing trainee records',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 const otherCompany={...company,id:'company-other',name:'Other company'};
 const otherTrainee={...trainee,id:'trainee-other',trainee_name:'Other trainee',company_id:otherCompany.id};
 state.companies.push(otherCompany);state.trainees.push(otherTrainee);
 state.assessments=[assessment,{...assessment,id:'assessment-other',trainee_id:otherTrainee.id,company_id:otherCompany.id}];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id});
 assert.deepEqual(report.items.map(item=>item.trainee.id),[trainee.id]);
});

test('incomplete or unrecorded assessments remain pending instead of becoming a zero or failure',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 state.assessments=[{...assessment,product_knowledge:null,analytics_included:false,assessment_outcome:'Failed'}];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id});
 const item=report.items[0];
 assert.equal(item.profile.complete,false);
 assert.equal(item.profile.overall,null);
 assert.equal(item.profile.tier,'Assessment pending');
 assert.match(item.narrative,/does not assign a score band/i);
});

test('unrecorded attendance is not transformed into absences in a batch report',()=>{
 const {state,company,batch,trainee}=fixtureState();
 state.daily_attendance=[attendance('tour',trainee.id,batch.id,'Tour Day')];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id});
 assert.equal(report.items[0].attendance.present,0);
 assert.equal(report.items[0].attendance.absent,0);
 assert.equal(report.items[0].attendance.rate,null);
});

test('batch PDF jobs create one standalone report per company without cross-company trainees',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 const otherCompany={...company,id:'company-other',name:'Other company'};
 const otherTrainee={...trainee,id:'trainee-other',trainee_name:'Other trainee',company_id:otherCompany.id};
 state.companies.push(otherCompany);state.trainees.push(otherTrainee);state.assessments=[assessment,{...assessment,id:'assessment-other',trainee_id:otherTrainee.id,company_id:otherCompany.id}];
 const jobs=companyReportJobs(buildBatchReport(state,{batchId:batch.id}));
 assert.deepEqual(jobs.map(job=>job.companyName),['Other company',company.name]);
 assert.deepEqual(jobs.map(job=>job.items.map(item=>item.trainee.trainee_name)),[['Other trainee'],[trainee.trainee_name]]);
 assert.match(reportFilename(jobs[1]),/^Xcelias_Report_.*_Batch/);
 assert.equal(reportFilename(jobs[1]),'Xcelias_Report_Test_Company_BatchTest batch.pdf');
});
