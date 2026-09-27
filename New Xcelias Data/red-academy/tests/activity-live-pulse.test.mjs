import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActivityLivePulse} from '../server/activity-live-pulse.mjs';

const valid={title:'Quick confidence check',prompt:'How ready do you feel to explain the client discovery sequence?',options:['Ready to explain it','I want one more example','I want to practise it'],timer_duration:30};

test('Class pulse validation builds a single anonymous, ungraded live question',()=>{
 const pulse=validateActivityLivePulse(valid);
 assert.equal(pulse.mode,'pulse');
 assert.equal(pulse.id,'session-pulse');
 assert.equal(pulse.team_names.length,1);
 assert.equal(pulse.questions.length,1);
 assert.equal(pulse.questions[0].answer,null);
 assert.equal(pulse.questions[0].options.length,3);
 assert.equal(JSON.stringify(pulse).includes('correct_answer'),false);
});

test('Class pulse validation rejects incomplete, unsafe, oversized, duplicate, and invalid-timer input',()=>{
 for(const value of [
  {...valid,title:'x'},
  {...valid,prompt:'tiny'},
  {...valid,prompt:'Unsafe\nquestion'},
  {...valid,options:['Same','same']},
  {...valid,options:['Only one']},
  {...valid,options:['A','B','C','D','E','F']},
  {...valid,timer_duration:60},
  null,
 ])assert.throws(()=>validateActivityLivePulse(value),{status:400});
});
