import test from 'node:test';
import assert from 'node:assert/strict';
import { sequenceChoiceForOrder, sequenceOrderForChoice, SEQUENCE_ORDERS } from '../public/trainer-activities/live-sequence.mjs';
import { SEQUENCE_SPRINT_ACTIVITY } from '../server/activity-sequence.mjs';
import { liveRoomQuestionView, studioFacilitatorDeck, studioLibrary } from '../server/activity-studio.mjs';

test('Sequence Sprint encodes every three-step order exactly once', () => {
  assert.equal(SEQUENCE_ORDERS.length, 6);
  assert.equal(new Set(SEQUENCE_ORDERS.map(order => order.join(','))).size, 6);
  for (const [choice, order] of SEQUENCE_ORDERS.entries()) {
    assert.deepEqual(sequenceOrderForChoice(choice), order);
    assert.equal(sequenceChoiceForOrder(order), choice);
  }
  for (const invalid of [null, [], [0, 1], [0, 0, 2], [0, 1, 3], ['0', 1, 2]]) {
    assert.equal(sequenceChoiceForOrder(invalid), null);
  }
  assert.equal(sequenceOrderForChoice(-1), null);
  assert.equal(sequenceOrderForChoice(6), null);
});

test('Sequence Sprint offers five authored client-care puzzles only in the staff live deck', () => {
  assert.equal(SEQUENCE_SPRINT_ACTIVITY.id, 'sequence-sprint');
  assert.equal(SEQUENCE_SPRINT_ACTIVITY.questions.length, 5);
  assert.ok(studioFacilitatorDeck().some(activity => activity.id === 'sequence-sprint'));
  assert.ok(!studioLibrary().some(activity => activity.id === 'sequence-sprint'));
  const expectedOrders = {
    'ss-discovery': [1, 2, 0],
    'ss-verify': [1, 2, 0],
    'ss-viewing': [1, 2, 0],
    'ss-follow-up': [1, 0, 2],
    'ss-handoff': [2, 0, 1],
  };
  for (const question of SEQUENCE_SPRINT_ACTIVITY.questions) {
    assert.equal(question.type, 'sequence');
    assert.equal(question.steps.length, 3);
    assert.ok(question.steps.every(step => typeof step === 'string' && step.length >= 12));
    assert.equal(new Set(question.steps).size, 3);
    assert.equal(question.options.length, 6);
    assert.deepEqual(sequenceOrderForChoice(question.answer), expectedOrders[question.id]);
    assert.ok(question.explanation.length >= 40);
  }
});

test('Sequence live-room projection shares steps but withholds scoring slots and answer until reveal', () => {
  const question = SEQUENCE_SPRINT_ACTIVITY.questions[0];
  const privateView = liveRoomQuestionView(question);
  assert.equal(privateView.type, 'sequence');
  assert.deepEqual(privateView.steps, question.steps);
  assert.ok(!('options' in privateView));
  assert.ok(!('answer' in privateView));
  assert.ok(!('explanation' in privateView));
  const revealed = liveRoomQuestionView(question, true);
  assert.equal(revealed.answer, question.answer);
  assert.equal(revealed.explanation, question.explanation);
});
