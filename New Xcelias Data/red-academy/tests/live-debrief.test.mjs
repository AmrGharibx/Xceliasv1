import test from 'node:test';
import assert from 'node:assert/strict';
import { liveDebriefModel } from '../public/trainer-activities/live-debrief.mjs';

function revealed(correctFlags) {
  return {
    room: { revealed: true },
    responses: correctFlags.map((correct, index) => ({ nickname: `Learner ${index + 1}`, choice: index, correct })),
  };
}

test('live-round debrief is unavailable before reveal and empty rounds do not invent an accuracy score', () => {
  assert.equal(liveDebriefModel({ room: { revealed: false }, responses: [{ correct: true }] }), null);
  const empty = liveDebriefModel(revealed([]));
  assert.equal(empty.accuracy, null);
  assert.equal(empty.headline, 'No answers yet');
});

test('one or two live responses are framed as a small-room conversation cue, never a class percentage', () => {
  for (const flags of [[true], [true, false]]) {
    const model = liveDebriefModel(revealed(flags));
    assert.equal(model.label, 'SMALL-ROOM SIGNAL');
    assert.equal(model.accuracy, null);
    assert.ok(model.cue.includes('not a class trend'));
    assert.ok(!model.headline.includes('%'));
  }
});

test('larger live-room signals suggest a calibrated, temporary coaching move', () => {
  const reset = liveDebriefModel(revealed([false, false, true]));
  assert.equal(reset.accuracy, 33);
  assert.equal(reset.label, 'PAUSE AND REBUILD');
  const explain = liveDebriefModel(revealed([true, true, false]));
  assert.equal(explain.accuracy, 67);
  assert.equal(explain.label, 'SURFACE THE REASONING');
  const stretch = liveDebriefModel(revealed([true, true, true, true, true]));
  assert.equal(stretch.accuracy, 100);
  assert.equal(stretch.label, 'STRETCH THE THINKING');
  for (const model of [reset, explain, stretch]) {
    assert.ok(!('nickname' in model));
    assert.ok(!('choice' in model));
    assert.ok(model.cue.length > 40);
  }
});

test('revealed debrief offers only the anonymous confidence aggregate as a reflective coaching cue', () => {
  const model = liveDebriefModel({
    ...revealed([true,false,true,true,false,true]),
    confidence_summary:{count:6,confident:{count:3,accuracy:33},tentative:{count:3,accuracy:100}},
  });
  assert.deepEqual(model.confidence,{count:6,confident:{count:3,accuracy:33},tentative:{count:3,accuracy:100},cue:'The ready-to-stand-by-it group was less accurate this round. Ask what evidence could make a confident call safer, without asking anyone to defend a score.'});
  assert.ok(!('nickname'in model.confidence));
  assert.ok(!('choice'in model.confidence));
  const small=liveDebriefModel({...revealed([true,false,true]),confidence_summary:{count:2,confident:{count:1,accuracy:null},tentative:{count:1,accuracy:null}}});
  assert.equal('confidence'in small,false);
  const uneven=liveDebriefModel({...revealed([true,false,true,true]),confidence_summary:{count:4,confident:{count:3,accuracy:67},tentative:{count:1,accuracy:null}}});
  assert.equal(uneven.confidence.confident.accuracy,67);
  assert.equal(uneven.confidence.tentative.accuracy,null);
});
