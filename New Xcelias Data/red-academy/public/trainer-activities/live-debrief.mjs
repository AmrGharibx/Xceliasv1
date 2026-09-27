// Build a short, non-persistent facilitation cue from a revealed live round.
// Deliberately return only aggregate counts, never player identities or picks.
function confidenceReflection(summary) {
  if (!summary || !Number.isInteger(summary.count) || summary.count < 3) return null;
  const confident = summary.confident;
  const tentative = summary.tentative;
  if (![confident, tentative].every(group => group && Number.isInteger(group.count) && group.count >= 0)) return null;
  const accuracy = value => Number.isInteger(value) && value >= 0 && value <= 100 ? value : null;
  const confidentAccuracy = accuracy(confident.accuracy);
  const tentativeAccuracy = accuracy(tentative.accuracy);
  const hasBothRates = confidentAccuracy !== null && tentativeAccuracy !== null;
  const cue = hasBothRates && confidentAccuracy < tentativeAccuracy - 15
    ? 'The ready-to-stand-by-it group was less accurate this round. Ask what evidence could make a confident call safer, without asking anyone to defend a score.'
    : hasBothRates && tentativeAccuracy >= 80 && confidentAccuracy < 80
      ? 'Some still-thinking responses were strong. Ask what evidence would help learners feel ready next time.'
      : 'Ask what evidence helped learners feel ready to stand by a choice, and what would make an uncertain choice clearer next time.';
  return {count:summary.count,confident:{count:confident.count,accuracy:confidentAccuracy},tentative:{count:tentative.count,accuracy:tentativeAccuracy},cue};
}

function withConfidence(model, remote) {
  const confidence = confidenceReflection(remote?.confidence_summary);
  return confidence ? {...model,confidence} : model;
}

export function liveDebriefModel(remote) {
  if (!remote?.room?.revealed) return null;
  const responses = Array.isArray(remote.responses)
    ? remote.responses.filter(response => response && typeof response.correct === 'boolean')
    : [];
  const count = responses.length;
  const correct = responses.filter(response => response.correct).length;
  if (!count) {
    return withConfidence({
      count,
      correct,
      accuracy: null,
      headline: 'No answers yet',
      label: 'MAKE SPACE TO THINK',
      cue: 'Pause for a quiet think, then invite a team to explain what information they would need before choosing.',
    }, remote);
  }
  if (count < 3) {
    return withConfidence({
      count,
      correct,
      accuracy: null,
      headline: `${correct} of ${count} ${count === 1 ? 'response matched' : 'responses matched'}`,
      label: 'SMALL-ROOM SIGNAL',
      cue: 'Treat this as a conversation cue, not a class trend. Ask each team what part of the scenario shaped its decision.',
    }, remote);
  }
  const accuracy = Math.round(correct / count * 100);
  return withConfidence({
    count,
    correct,
    accuracy,
    headline: `${accuracy}% matched the coaching move`,
    label: accuracy >= 80 ? 'STRETCH THE THINKING' : accuracy >= 50 ? 'SURFACE THE REASONING' : 'PAUSE AND REBUILD',
    cue: accuracy >= 80
      ? 'Ask a volunteer why the tempting alternatives could damage trust, then invite a different team to add a nuance.'
      : accuracy >= 50
        ? 'Ask a pair which piece of client context shifted its choice, then let another pair offer a different rationale.'
        : 'Slow the round down. Ask teams to name the principle or evidence they should use first, then explain the coaching move again.',
  }, remote);
}
