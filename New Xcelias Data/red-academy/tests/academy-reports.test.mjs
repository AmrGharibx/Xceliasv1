import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBatchReport,reporterTier} from '../public/modules/academy-reports.mjs';
import {companyReportJobs,renderReportCover,reportFilename,renderDetailPage,roundToTwo,standaloneReportItem} from '../public/modules/reporter-generator.mjs';
import {reportsPage} from '../public/modules/reports-page.mjs';
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

test('Never Started remains visible in reports without being described as missing schedule data',()=>{
 const {state,company,batch,trainee}=fixtureState();
 trainee.enrollment_status='Never Started';
 state.daily_attendance=[attendance('first-day-no-show',trainee.id,batch.id,'Absent')];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id}),item=report.items[0];
 assert.equal(item.checklist,null);
 assert.match(item.narrative,/enrolled but did not attend any sessions/i);
 assert.match(item.narrative,/ongoing attendance and session-progress counts exclude/i);
 const pdf=standaloneReportItem(item,batch);
 assert.match(pdf.overallAssessment,/Enrollment status: Never Started/);
 assert.match(renderDetailPage(pdf),/Enrollment status: Never Started/);
 assert.match(item.narrative,/no assessment was made/i);
});

test('Stopped Attending reports count distinct attended days and never assign a failing grade',()=>{
 const {state,company,batch,trainee}=fixtureState();
 trainee.enrollment_status='Stopped Attending';
 const [first,second]=batch.session_dates;
 state.daily_attendance=[
  {...attendance('present-a',trainee.id,batch.id,'Present'),date:first},
  {...attendance('duplicate-present-a',trainee.id,batch.id,'Present'),date:first},
  {...attendance('tour-b',trainee.id,batch.id,'Tour Day'),date:second}
 ];
 const [item]=buildBatchReport(state,{batchId:batch.id,companyId:company.id}).items;
 assert.equal(item.profile.complete,false);
 assert.equal(item.reportStatus.code,'stopped');
 assert.equal(item.attendedDays,2);
 assert.match(item.narrative,/stopped attending after 2 attended training days/i);
 assert.match(item.narrative,/no formal assessment was completed/i);
 const pdf=standaloneReportItem(item,batch);
 assert.match(pdf.overallAssessment,/stopped attending after 2 attended training days/i);
 assert.equal(pdf.assessmentResult,'Stopped Attending');
 assert.match(renderDetailPage(pdf),/stopped attending after 2 attended training days/i);
 assert.doesNotMatch(renderDetailPage(pdf),/0 out of 5|score-red|badge b-red/);
});

test('Stopped Attending with no recorded attended dates does not claim an exact duration',()=>{
 const {state,company,batch,trainee}=fixtureState();
 trainee.enrollment_status='Stopped Attending';
 const [item]=buildBatchReport(state,{batchId:batch.id,companyId:company.id}).items;
 assert.equal(item.attendedDays,0);
 assert.match(item.narrative,/no attended training days are recorded/i);
 assert.doesNotMatch(item.narrative,/stopped attending after 0/i);
 assert.match(renderDetailPage(standaloneReportItem(item,batch)),/duration cannot be confirmed/i);
});

test('Assessment no-shows and excused trainees remain unscored with distinct report outcomes',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 const missed={...assessment,id:'missed-assessment',assessment_title:'Assessment day',mapping:null,product_knowledge:null,presentability:null,soft_skills:null,assessment_outcome:null,analytics_included:false,source_meta:{assessment_state:'assessment_missed'}};
 const excusedTrainee={...trainee,id:'excused-trainee',trainee_name:'Excused Trainee'};
 const excused={...missed,id:'excused-assessment',trainee_id:excusedTrainee.id,source_meta:{assessment_state:'assessment_excused'},instructor_comment:'Medical appointment'};
 state.trainees.push(excusedTrainee);state.assessments=[missed,excused];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id});
 const byId=new Map(report.items.map(item=>[item.trainee.id,item]));
 assert.equal(byId.get(trainee.id).reportStatus.code,'assessment_missed');
 assert.equal(byId.get(trainee.id).profile.overall,null);
 assert.match(byId.get(trainee.id).narrative,/did not attend the scheduled assessment/i);
 assert.equal(byId.get(excusedTrainee.id).reportStatus.code,'assessment_excused');
 assert.match(byId.get(excusedTrainee.id).narrative,/excused.*assessment remains pending/i);
 assert.match(byId.get(excusedTrainee.id).narrative,/Medical appointment/);
 assert.match(standaloneReportItem(byId.get(trainee.id),batch).overallAssessment,/did not attend the scheduled assessment/i);
 assert.match(standaloneReportItem(byId.get(excusedTrainee.id),batch).overallAssessment,/excused.*assessment remains pending/i);
});

test('Reports list assessed trainees first, reports selected trainees only, and counts training completion',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 const scored={...trainee,id:'scored-trainee',trainee_name:'Scored Trainee'};
 const stopped={...trainee,id:'stopped-trainee',trainee_name:'Stopped Trainee',enrollment_status:'Stopped Attending'};
 const never={...trainee,id:'never-trainee',trainee_name:'Never Trainee',enrollment_status:'Never Started'};
 state.trainees.push(scored,stopped,never);batch.status='Completed';
 state.assessments=[
  {...assessment,id:'scored-result',trainee_id:scored.id},
  {...assessment,id:'missed-result',mapping:null,product_knowledge:null,presentability:null,soft_skills:null,assessment_outcome:null,analytics_included:false,source_meta:{assessment_state:'assessment_missed'}}
 ];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id,traineeIds:[trainee.id,scored.id,stopped.id,never.id]});
 assert.deepEqual(report.items.map(item=>item.trainee.id),[scored.id,trainee.id,never.id,stopped.id]);
 assert.deepEqual(report.completionCounts,{total:4,completed:2,notCompleted:2});
 assert.deepEqual(buildBatchReport(state,{batchId:batch.id,companyId:company.id,traineeIds:[scored.id,stopped.id]}).items.map(item=>item.trainee.id),[scored.id,stopped.id]);
 const otherCompany={...company,id:'other-company',name:'Other Company'},otherPerson={...trainee,id:'other-person',company_id:otherCompany.id};
 state.companies.push(otherCompany);state.trainees.push(otherPerson);
 assert.throws(()=>buildBatchReport(state,{batchId:batch.id,traineeIds:[trainee.id,otherPerson.id]}),/same company/i);
 const [job]=companyReportJobs(report);
 assert.deepEqual(job.traineeIds,[trainee.id,scored.id,stopped.id,never.id]);
 assert.match(renderReportCover(job),/Number of Trainees<\/span><span class="cover-info-value">4/);
 assert.match(renderReportCover(job),/Completed Training<\/span><span class="cover-info-value">2/);
 assert.match(renderReportCover(job),/Not Completed<\/span><span class="cover-info-value">2/);
});

test('Multi-trainee controls appear only after selecting a batch and company',()=>{
 const {state,company,batch,trainee}=fixtureState();
 const peer={...trainee,id:'company-peer',trainee_name:'Company Peer'};state.trainees.push(peer);
 const ctx={store:{data:state},batchId:batch.id,companyId:company.id,reportTraineeId:'',reportTraineeIds:[],search:''};
 const html=reportsPage(ctx);
 assert.match(html,/data-report-trainee="company-peer"/);
 assert.match(html,/data-report-trainee="[^"]+"/);
 assert.match(html,/Select multiple trainees from this company/i);
 assert.doesNotMatch(reportsPage({...ctx,companyId:''}),/data-report-trainee=/);
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

test('a solo report contains only the selected trainee and their measured totals',()=>{
 const {state,company,batch,trainee,assessment}=fixtureState();
 const peer={...trainee,id:'same-company-peer',trainee_name:'Another Trainee'};
 state.trainees.push(peer);
 state.assessments=[assessment,{...assessment,id:'peer-assessment',trainee_id:peer.id,mapping:1,product_knowledge:1,presentability:1,soft_skills:1}];
 state.daily_attendance=[attendance('selected-present',trainee.id,batch.id,'Present'),attendance('peer-absent',peer.id,batch.id,'Absent')];
 const report=buildBatchReport(state,{batchId:batch.id,companyId:company.id,traineeId:trainee.id});
 assert.deepEqual(report.items.map(item=>item.trainee.id),[trainee.id]);
 assert.equal(report.assessed,1);
 assert.equal(report.average,97.5);
 assert.equal(report.items[0].attendance.present,1);
 assert.equal(report.items[0].attendance.absent,0);
 const [job]=companyReportJobs(report);
 assert.equal(job.items.length,1);
 assert.equal(reportFilename(job),'Xcelias_Report_Test_Company_BatchTest batch_Test_Trainee.pdf');
});

test('a solo report never falls back to company output when the trainee is outside its scope',()=>{
 const {state,company,batch,trainee}=fixtureState();
 state.companies.push({...company,id:'other-company',name:'Other Company'});
 state.batches.push({...batch,id:'other-batch',batch_name:'Other batch'});
 for(const scope of [
  {batchId:batch.id,companyId:company.id,traineeId:'missing-trainee'},
  {batchId:batch.id,companyId:'other-company',traineeId:trainee.id},
  {batchId:'other-batch',companyId:company.id,traineeId:trainee.id}
 ]){
  const report=buildBatchReport(state,scope);
  assert.deepEqual(report.items,[]);
  assert.equal(report.average,null);
  assert.deepEqual(companyReportJobs(report),[]);
 }
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
