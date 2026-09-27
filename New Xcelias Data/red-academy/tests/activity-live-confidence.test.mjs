import test from 'node:test';
import assert from 'node:assert/strict';
import {liveConfidenceSummary} from '../server/activity-live-confidence.mjs';

test('live confidence remains hidden before reveal and below the room privacy threshold', () => {
  const answers = [
    {nickname:'A',confidence:'confident',correct:true},
    {nickname:'B',confidence:'tentative',correct:false},
  ];
  assert.equal(liveConfidenceSummary(answers, false), null);
  assert.equal(liveConfidenceSummary(answers, true), null);
});

test('revealed confidence summary contains only aggregate buckets and suppresses tiny-bucket accuracy', () => {
  const answers = [
    {nickname:'A',choice:0,confidence:'confident',correct:true},
    {nickname:'B',choice:1,confidence:'confident',correct:false},
    {nickname:'C',choice:0,confidence:'confident',correct:true},
    {nickname:'D',choice:1,confidence:'tentative',correct:false},
  ];
  assert.deepEqual(liveConfidenceSummary(answers, true), {
    count:4,
    confident:{count:3,accuracy:67},
    tentative:{count:1,accuracy:null},
  });
});

test('uncalibrated and malformed responses do not count toward the confidence threshold', () => {
  const answers = [
    {confidence:'confident',correct:true},
    {confidence:'tentative',correct:false},
    {confidence:null,correct:true},
    {confidence:'other',correct:true},
    {confidence:'confident',correct:null},
  ];
  assert.equal(liveConfidenceSummary(answers, true), null);
});
