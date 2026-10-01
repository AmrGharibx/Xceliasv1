import test from 'node:test';
import assert from 'node:assert/strict';
import {liveCompetitionMode, livePlayerStandings} from '../server/activity-live-competition.mjs';
import {studioQuiz, studioLibrary, publicQuiz, studioFacilitatorDeck, liveRoomQuestionView, gradeStudioQuiz} from '../server/activity-studio.mjs';

test('competition defaults to teams, accepts individuals, and cannot score an anonymous pulse', () => {
  assert.equal(liveCompetitionMode({}), 'teams');
  assert.equal(liveCompetitionMode({competition_mode: 'individuals'}), 'individuals');
  for (const body of [{competition_mode: 'solo'}, {competition_mode: []}, {mode: 'pulse', competition_mode: 'individuals'}]) {
    assert.throws(() => liveCompetitionMode(body), {status: 400});
  }
});

test('equal point totals share a rank and standings expose no seat or record identifiers', () => {
  const players = [
    {nickname: 'Zeina', points: 200, streak: 1, team_no: 1, token_hash: 'secret'},
    {nickname: 'Aly', points: 200, streak: 2, team_no: 1, id: 'private-id'},
    {nickname: 'Ziad', points: 100, streak: 1, team_no: 1},
  ];
  const leaders = livePlayerStandings(players);
  assert.deepEqual(leaders.map(person => [person.nickname, person.rank]), [['Aly', 1], ['Zeina', 1], ['Ziad', 3]]);
  assert.equal(players[0].nickname, 'Zeina');
  assert.ok(leaders.every(person => !('id' in person) && !('token_hash' in person)));
});

test('the New Cairo lesson is complete in English and Egyptian Arabic and keeps keys private', () => {
  const activity = studioQuiz('quiz-new-cairo');
  assert.equal(activity.questions.length, 9);
  assert.ok(studioLibrary().find(item => item.id === activity.id).arabic.title);
  assert.equal(studioFacilitatorDeck().find(item => item.id === activity.id).questions[0].arabic.prompt, activity.questions[0].arabic.prompt);
  const publicVersion = publicQuiz(activity);
  for (const [index, question] of publicVersion.questions.entries()) {
    assert.ok(question.arabic.prompt && question.arabic.hint);
    assert.equal(question.arabic.options.length, question.options.length);
    assert.ok(question.arabic.options.every(option => /[\u0600-\u06ff]/.test(option)));
    assert.ok(!('answer' in question) && !('explanation' in question.arabic));
    const reveal = liveRoomQuestionView(activity.questions[index], true);
    assert.equal(reveal.arabic.explanation, activity.questions[index].arabic.explanation);
  }
  assert.ok(publicVersion.study_cards.every(card => card.arabic.front && card.arabic.back));
  const result = gradeStudioQuiz(activity, activity.questions.map(question => ({question_id: question.id, choice: question.answer})));
  assert.equal(result.score, 100);
  assert.ok(result.xp >= 900);
});
