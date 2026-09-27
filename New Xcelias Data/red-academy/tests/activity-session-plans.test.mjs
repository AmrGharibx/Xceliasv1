import test from 'node:test';
import assert from 'node:assert/strict';
import {id} from '../public/modules/core.mjs';
import {ApiError} from '../server/validation.mjs';
import {buildActivitySessionOutline,validateActivitySessionPlan,validateActivitySessionPromptDraftRequest,validateActivitySessionPromptDraft,validateActivitySessionStep,validateActivitySessionStepPrompts} from '../server/activity-session-plans.mjs';

const batchId=id(),companyId=id();
const workspace={
 batches:[{id:batchId,batch_name:'Planning cohort',archived_at:null}],
 companies:[{id:companyId,name:'Active company'}],
 trainees:[{id:id(),batch_id:batchId,company_id:companyId,enrollment_status:'Active'}],
};
const activity={id:'quiz-discovery',title:'Discovery Sprint',duration_minutes:5,archived_at:null};
const validInput=()=>({batch_id:batchId,company_id:companyId,session_date:'2026-10-06',title:'Discovery and trust lab',focus_skill:'discovery',duration_minutes:30,activity_id:activity.id});
const badRequest=fn=>assert.throws(fn,error=>error instanceof ApiError&&error.status===400);

test('run-of-show has four timed, linked classroom moments with a safe challenge handoff',()=>{
 const outline=buildActivitySessionOutline('discovery',activity,30);
 assert.deepEqual(outline.map(step=>step.id),['spark','quest','huddle','exit']);
 assert.equal(outline.reduce((sum,step)=>sum+step.duration_minutes,0),30);
 assert.equal(outline.filter(step=>step.activity_id).length,1);
 assert.equal(outline[1].activity_id,activity.id);
 assert.ok(outline.every(step=>step.done===false&&step.prompt.length>15));
});

test('plan validation scopes to active batches and company rosters and normalizes the all-company scope',()=>{
 const validated=validateActivitySessionPlan(validInput(),workspace,activity);
 assert.equal(validated.batch_id,batchId);
 assert.equal(validated.company_id,companyId);
 assert.equal(validated.title,'Discovery and trust lab');
 assert.equal(validated.outline.length,4);
 const allCompanies=validateActivitySessionPlan({...validInput(),company_id:''},workspace,activity);
 assert.equal(allCompanies.company_id,null);
 badRequest(()=>validateActivitySessionPlan({...validInput(),company_id:id()},workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),batch_id:id()},workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),batch_id:batchId}, {...workspace,batches:[{id:batchId,archived_at:'2026-09-01'}]},activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),company_id:companyId}, {...workspace,trainees:[{...workspace.trainees[0],enrollment_status:'Stopped Attending'}]},activity));
});

test('custom facilitator prompts are validated and saved into the same four-step outline',()=>{
 const step_prompts={spark:'Recall the last client discovery move you practised.',quest:'Play one round, discuss the choices, and commit before reveal.',huddle:'Explain why that move protected the client relationship.',exit:'Name the next question you will ask during a real conversation.'};
 const validated=validateActivitySessionPlan({...validInput(),step_prompts},workspace,activity);
 assert.deepEqual(Object.fromEntries(validated.outline.map(step=>[step.id,step.prompt])),step_prompts);
 assert.equal(validateActivitySessionPlan(validInput(),workspace,activity).outline[0].prompt,buildActivitySessionOutline('discovery',activity,30)[0].prompt);
 badRequest(()=>validateActivitySessionPlan({...validInput(),step_prompts:{...step_prompts,roster:'unexpected'}} ,workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),step_prompts:{...step_prompts,spark:'short'}} ,workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),step_prompts:{...step_prompts,exit:'Call trainer@example.test now'}} ,workspace,activity));
});

test('AI session brief accepts only a valid skill, active challenge and contact-free optional notes',()=>{
 const brief={focus_skill:'discovery',activity_id:activity.id,lesson_notes:'Practise an open question, then reflect the client priority.'};
 assert.deepEqual(validateActivitySessionPromptDraftRequest(brief,activity),brief);
 badRequest(()=>validateActivitySessionPromptDraftRequest({...brief,focus_skill:'private'},activity));
 badRequest(()=>validateActivitySessionPromptDraftRequest({...brief,lesson_notes:'Write to coach@example.test'},activity));
 badRequest(()=>validateActivitySessionPromptDraftRequest({...brief,lesson_notes:'Call +20 (123) 456-7890'},activity));
 badRequest(()=>validateActivitySessionPromptDraftRequest(brief,{...activity,archived_at:'2026-09-24'}));
});

test('AI session prompts must be all four bounded facilitator cues and cannot contain control characters',()=>{
 const prompts={spark:'Recall one client discovery question from last week.',quest:'Choose your answer before the trainer reveals the teaching point.',huddle:'Explain which choice protects the client and why.',exit:'Name one action you will use in your next conversation.'};
 assert.deepEqual(validateActivitySessionPromptDraft(prompts),prompts);
 assert.throws(()=>validateActivitySessionPromptDraft({...prompts,exit:''}),error=>error instanceof ApiError&&error.status===400);
 assert.throws(()=>validateActivitySessionPromptDraft({spark:prompts.spark}),error=>error instanceof ApiError&&error.status===502);
});

test('plan validation rejects invalid dates, unsafe text, unknown skills, archived challenges and insufficient class time',()=>{
 badRequest(()=>validateActivitySessionPlan({...validInput(),session_date:'2026-02-31'},workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),title:'x'},workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),title:'Unsafe\nTitle'},workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),focus_skill:'private-data'},workspace,activity));
 badRequest(()=>validateActivitySessionPlan({...validInput(),duration_minutes:30},workspace,{...activity,archived_at:'2026-09-24'}));
 badRequest(()=>validateActivitySessionPlan({...validInput(),duration_minutes:18},workspace,{...activity,duration_minutes:10}));
});

test('step updates require an ID, current version, known step and explicit completion state',()=>{
 const valid={id:id(),expected_version:3,step_id:'quest',completed:true};
 assert.deepEqual(validateActivitySessionStep(valid),valid);
 badRequest(()=>validateActivitySessionStep({...valid,id:'not-an-id'}));
 badRequest(()=>validateActivitySessionStep({...valid,expected_version:0}));
 badRequest(()=>validateActivitySessionStep({...valid,step_id:'answer-key'}));
 badRequest(()=>validateActivitySessionStep({...valid,completed:'true'}));
});
