import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActivityRoleplayDraftRequest,validateActivityRoleplayDraft} from '../server/activity-roleplay-draft.mjs';

const brief={focus_skill:'discovery',lesson_notes:'Practise checking a client’s timing before suggesting a next step.'};
function generatedDraft(){return {
 title:'The rushed move',level:'Core',setup:'A client wants to move soon but has not explained the timing.',
 trainer_brief:'The client has a flexible move window and values a short commute. Reveal those details only if asked.',
 turns:[
  {client_line:'I need to move soon, but I’m not sure where to start.',coach_cue:'Ask what is driving the move and give the client time to explain.'},
  {client_line:'I have a few options in mind. Can you tell me which is best?',coach_cue:'Clarify their priorities before comparing options; do not choose for them.'},
  {client_line:'That makes sense. What would you suggest we do next?',coach_cue:'Reflect the client’s priority and agree a specific, client-approved next step.'}
 ],
 look_fors:[{label:'Asks an open question before recommending'},{label:'Checks the client’s priority in their own words'},{label:'Agrees a clear next step with the client'}],
 avoid:'Do not promise an outcome, invent availability, or rush the client into a decision.',
 model:'I can help compare the options against what matters most to you. What would make a move feel manageable?',
 debrief:'Which question helped the client explain what mattered most?'
};}

test('AI role-play request accepts only a known Studio skill and bounded, contact-free lesson notes',()=>{
 assert.deepEqual(validateActivityRoleplayDraftRequest(brief),{...brief,language:'en'});
 assert.deepEqual(validateActivityRoleplayDraftRequest({focus_skill:'discovery'}),{focus_skill:'discovery',lesson_notes:'',language:'en'});
 assert.equal(validateActivityRoleplayDraftRequest({...brief,language:'ar-EG'}).language,'ar-EG');
 assert.throws(()=>validateActivityRoleplayDraftRequest({...brief,lesson_notes:42}),/1,600 characters/);
 assert.throws(()=>validateActivityRoleplayDraftRequest({...brief,focus_skill:'made-up-skill'}),/valid learning focus/);
 assert.throws(()=>validateActivityRoleplayDraftRequest({...brief,lesson_notes:'Email coach@example.test'}),/contact details/);
 assert.throws(()=>validateActivityRoleplayDraftRequest({...brief,lesson_notes:'Call +20 (123) 456-7890'}),/contact details/);
 assert.throws(()=>validateActivityRoleplayDraftRequest({...brief,lesson_notes:'x'.repeat(1601)}),/1,600/);
 assert.throws(()=>validateActivityRoleplayDraftRequest({...brief,language:'ar'}),/Choose English or Egyptian Arabic/);
});

test('AI role-play validator returns the exact three-turn, three-move format used by the trainer lab',()=>{
 const scenario=validateActivityRoleplayDraft(generatedDraft(),'discovery');
 assert.equal(scenario.id,'ai-draft');assert.equal(scenario.skill,'Client discovery');
 assert.equal(scenario.turns.length,3);assert.equal(scenario.lookFors.length,3);
 assert.deepEqual(Object.keys(scenario.turns[0]),['clientLine','coachCue']);
 assert.deepEqual(scenario.lookFors.map(item=>item.id),['move-1','move-2','move-3']);
 assert.ok(scenario.debrief.endsWith('?'));
 assert.equal(Object.hasOwn(scenario,'score'),false);
});

test('AI role-play output rejects incomplete turns, duplicate coaching moves, invalid debriefs, and contact details',()=>{
 const twoTurns=generatedDraft();twoTurns.turns.pop();assert.throws(()=>validateActivityRoleplayDraft(twoTurns,'discovery'),/exactly three client turns/);
 const duplicateMoves=generatedDraft();duplicateMoves.look_fors[1].label=duplicateMoves.look_fors[0].label;assert.throws(()=>validateActivityRoleplayDraft(duplicateMoves,'discovery'),/duplicate coaching moves/);
 const invalidDebrief=generatedDraft();invalidDebrief.debrief='Tell the client what to do.';assert.throws(()=>validateActivityRoleplayDraft(invalidDebrief,'discovery'),/debrief question/);
 const personal=generatedDraft();personal.turns[0].client_line='Please email me at client@example.test before we meet.';assert.throws(()=>validateActivityRoleplayDraft(personal,'discovery'),/personal contact details/);
});

test('Egyptian Arabic co-drafts must actually be authored in Arabic across every practice field',()=>{
 const draft=generatedDraft();
 draft.title='النقلة الجديدة';draft.setup='عميل جديد محتاج ينقل قريب ولسه ما وضحش الميعاد.';draft.trainer_brief='العميل عنده مرونة في ميعاد النقلة وبيهمه يكون المشوار قصير.';draft.avoid='ما توعدش بنتيجة وما تستعجلش العميل على قرار.';draft.model='خلّينا نقارن الاختيارات على حسب أكتر حاجة تهمك. إيه اللي يخلي النقلة مناسبة ليك؟';draft.debrief='أنهي سؤال ساعد العميل يوضح أهم حاجة بالنسبة له؟';
 draft.turns=[{client_line:'محتاج أنقل قريب، بس مش عارف أبدأ منين.',coach_cue:'اسأل إيه سبب النقلة وسيب للعميل وقت يشرح.'},{client_line:'عندي كذا اختيار. تقدر تقولّي أنهي واحد أحسن؟',coach_cue:'وضّح الأولويات قبل المقارنة، وما تختارش بدل العميل.'},{client_line:'كلام منطقي. نعمل إيه بعد كده؟',coach_cue:'لخّص أولوية العميل واتفقوا على خطوة جاية محددة وبموافقته.'}];
 draft.look_fors=[{label:'بيسأل سؤال مفتوح قبل الترشيح'},{label:'بيتأكد من أولوية العميل بكلامه هو'},{label:'بيتفق مع العميل على خطوة جاية واضحة'}];
 const scenario=validateActivityRoleplayDraft(draft,'discovery','ar-EG');
 assert.equal(scenario.content_language,'ar-EG');
 assert.ok(scenario.turns.every(turn=>/[\u0600-\u06ff]/.test(turn.clientLine)&&/[\u0600-\u06ff]/.test(turn.coachCue)));
 const english=generatedDraft();
 assert.throws(()=>validateActivityRoleplayDraft(english,'discovery','ar-EG'),/natural Egyptian Arabic/);
});
