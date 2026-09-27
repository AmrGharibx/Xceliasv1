// Room-only calibration signal. Never returns identities, choices, or raw scores.
export function liveConfidenceSummary(answers, revealed) {
  if (!revealed || !Array.isArray(answers)) return null;
  const submitted = answers.filter(answer =>
    answer && ['tentative', 'confident'].includes(answer.confidence) &&
    [true, false, 0, 1].includes(answer.correct),
  );
  if (submitted.length < 3) return null;

  const group = confidence => {
    const rows = submitted.filter(answer => answer.confidence === confidence);
    const correct = rows.filter(answer => answer.correct === true || answer.correct === 1).length;
    return {
      count: rows.length,
      accuracy: rows.length >= 3 ? Math.round(correct / rows.length * 100) : null,
    };
  };

  return {
    count: submitted.length,
    confident: group('confident'),
    tentative: group('tentative'),
  };
}
