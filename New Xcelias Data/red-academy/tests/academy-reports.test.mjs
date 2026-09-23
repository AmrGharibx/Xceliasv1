import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBatchReport,reporterTier} from '../public/modules/academy-reports.mjs';
import {companyReportJobs,reportFilename,renderDetailPage,roundToTwo,standaloneReportItem} from '../public/modules/reporter-generator.mjs';
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

test('tour attendance counts as present in a batch report',()=>{
 const {state,company,batch,trainee}=fixtureState();
 state.daily_attendance=[attendance('tour',trainee.id,batch.id,'Tour Day')];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id});
 assert.equal(report.items[0].attendance.present,1);
 assert.equal(report.items[0].attendance.absent,0);
 assert.equal(report.items[0].attendance.rate,100);
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

test('embedded PDF rounds floating-point percentages and emphasizes attendance risks in red',()=>{
 const prepared=standaloneReportItem({
  trainee:{id:'trainee-rounding',trainee_name:'Test Trainee'},
  company:{name:'RED'},batch:{batch_name:'Batch 42'},
  assessment:{product_knowledge:4.1,mapping:3.89,soft_skills:2.04,presentability:2.74,assessment_outcome:'Passed'},
  profile:{complete:true,overall:47.800000000000004,tech:79.89999999999999,soft:47.800000000000004},
  attendance:{present:8,absent:1,late:1}
 });
 assert.equal(roundToTwo(47.800000000000004),47.8);
 assert.equal(prepared.overallScore,47.8);
 assert.equal(prepared.scores.techScorePercent,79.9);
 assert.equal(prepared.scores.softScorePercent,47.8);
 assert.equal(prepared.attendance.missedContent,11.11);
 const html=renderDetailPage(prepared);
 assert.match(html,/Late Arrivals/);
 assert.match(html,/Absent Days/);
 assert.match(html,/Missed Content/);
 assert.doesNotMatch(html,/Attendance \(Absent Days\)|47\.800000000000004/);
 assert.equal((html.match(/class="text-alert"/g)||[]).length,3);
});
