import test from 'node:test';
import assert from 'node:assert/strict';
import {studioQuiz} from '../server/activity-studio.mjs';
import {SEQUENCE_SPRINT_ACTIVITY} from '../server/activity-sequence.mjs';
import {EGYPTIAN_ARABIC_REVIEW_COPY,egyptianArabicFor} from '../public/modules/egyptian-arabic.mjs';
import {ROLEPLAY_SCENARIOS} from '../public/trainer-activities/roleplay-library.mjs';

function assertTranslated(value,label){
 if(typeof value==='string'&&value.trim())assert.notEqual(egyptianArabicFor(value),value,`Missing Egyptian Arabic copy: ${label} — ${value}`);
}

test('The review glossary contains every fixed bilingual copy pair with non-empty Egyptian Arabic',()=>{
 assert.equal(Object.keys(EGYPTIAN_ARABIC_REVIEW_COPY).length,757);
 for(const [english,arabic] of Object.entries(EGYPTIAN_ARABIC_REVIEW_COPY)){
  assert.ok(english.trim());assert.ok(arabic.trim());
  assert.equal(egyptianArabicFor(english),arabic,`The live translator should match the glossary: ${english}`);
 }
});

test('Every fixed Academy Studio quiz, recall card and sequence challenge has Egyptian Arabic copy',()=>{
 for(const id of ['quiz-discovery','quiz-product','quiz-objections','quiz-qualification','quiz-trust','quiz-followup','quiz-viewing','quiz-handoff']){
  const activity=studioQuiz(id);
  for(const key of ['title','category','level','description'])assertTranslated(activity[key],`${id}.${key}`);
  for(const [index,card]of activity.study_cards.entries())for(const key of ['front','back'])assertTranslated(card[key],`${id}.study_cards[${index}].${key}`);
  for(const question of activity.questions){
   for(const key of ['prompt','hint','explanation'])assertTranslated(question[key],`${id}.${question.id}.${key}`);
   question.options.forEach((option,index)=>assertTranslated(option,`${id}.${question.id}.options[${index}]`));
  }
 }
 const sequence=SEQUENCE_SPRINT_ACTIVITY;
 for(const key of ['title','category','level','description'])assertTranslated(sequence[key],`sequence.${key}`);
 for(const question of sequence.questions){
  assertTranslated(question.prompt,`sequence.${question.id}.prompt`);
  question.steps.forEach((step,index)=>assertTranslated(step,`sequence.${question.id}.steps[${index}]`));
  assertTranslated(question.explanation,`sequence.${question.id}.explanation`);
 }
});

test('Every ready-made role-play scenario, client turn and coaching note has Egyptian Arabic copy',()=>{
 assert.equal(ROLEPLAY_SCENARIOS.length,10);
 for(const scenario of ROLEPLAY_SCENARIOS){
  for(const key of ['title','skill','level','setup','trainerBrief','avoid','model','debrief'])assertTranslated(scenario[key],`${scenario.id}.${key}`);
  for(const [index,turn]of scenario.turns.entries())for(const key of ['clientLine','coachCue'])assertTranslated(turn[key],`${scenario.id}.turns[${index}].${key}`);
  for(const lookFor of scenario.lookFors)assertTranslated(lookFor.label,`${scenario.id}.lookFors.${lookFor.id}`);
 }
});
