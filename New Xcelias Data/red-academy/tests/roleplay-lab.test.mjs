import test from 'node:test';
import assert from 'node:assert/strict';
import {ROLEPLAY_SCENARIOS,validateRoleplayLibrary} from '../public/trainer-activities/roleplay-library.mjs';

test('trainer role-play library contains varied, practice-ready client conversations',()=>{
 assert.equal(validateRoleplayLibrary(),true);
 assert.ok(ROLEPLAY_SCENARIOS.length>=10);
 assert.equal(new Set(ROLEPLAY_SCENARIOS.map(item=>item.skill)).size,ROLEPLAY_SCENARIOS.length);
 for(const id of ['investment-evidence','missed-callback','permission-to-share','budget-tradeoffs'])assert.ok(ROLEPLAY_SCENARIOS.some(item=>item.id===id),id);
 for(const scenario of ROLEPLAY_SCENARIOS){
  assert.ok(scenario.turns.length>=3,scenario.id);
  assert.equal(new Set(scenario.lookFors.map(item=>item.id)).size,scenario.lookFors.length,scenario.id);
  assert.ok(scenario.turns.every(turn=>turn.clientLine.trim().length>15&&turn.coachCue.trim().length>20),scenario.id);
  assert.ok(scenario.lookFors.every(item=>item.label.trim().length>8),scenario.id);
  assert.ok(scenario.avoid.trim().length>20,scenario.id);
  assert.ok(scenario.model.length>=45,scenario.id);
  assert.ok(scenario.debrief.endsWith('?'),scenario.id);
  assert.equal(Object.hasOwn(scenario,'score'),false,scenario.id);
 }
});

test('the role-play library rejects duplicate IDs, incomplete turns, and unsafe scorecard shape',()=>{
 assert.throws(()=>validateRoleplayLibrary([]));
 assert.throws(()=>validateRoleplayLibrary([ROLEPLAY_SCENARIOS[0],ROLEPLAY_SCENARIOS[0],ROLEPLAY_SCENARIOS[1]]));
 assert.throws(()=>validateRoleplayLibrary(ROLEPLAY_SCENARIOS.map((item,index)=>index?item:{...item,turns:[]})));
 assert.throws(()=>validateRoleplayLibrary(ROLEPLAY_SCENARIOS.map((item,index)=>index?item:{...item,lookFors:[]})));
 assert.throws(()=>validateRoleplayLibrary(ROLEPLAY_SCENARIOS.map((item,index)=>index?item:{...item,turns:item.turns.map((turn,turnIndex)=>turnIndex?turn:{...turn,coachCue:''})})));
 assert.throws(()=>validateRoleplayLibrary(ROLEPLAY_SCENARIOS.map((item,index)=>index?item:{...item,lookFors:[item.lookFors[0],{...item.lookFors[1],id:item.lookFors[0].id}]})));
 assert.throws(()=>validateRoleplayLibrary(ROLEPLAY_SCENARIOS.map((item,index)=>index?item:{...item,avoid:'  '})));
});
