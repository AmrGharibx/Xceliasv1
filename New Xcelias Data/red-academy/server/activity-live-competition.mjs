import {ApiError} from './validation.mjs';

export function liveCompetitionMode(body) {
  const mode = body.competition_mode ?? 'teams';
  if (!['teams', 'individuals'].includes(mode)) {
    throw new ApiError(400, 'Choose team or individual competition.');
  }
  if (body.mode === 'pulse' && mode === 'individuals') {
    throw new ApiError(400, 'Anonymous class pulses cannot be scored competitions.');
  }
  return mode;
}

// Nicknames are unique within a room. Never project database IDs or seat tokens.
// Equal point totals share a place; joining earlier is not a scoring advantage.
export function livePlayerStandings(players) {
  const sorted = [...players].sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname));
  let rank = 0;
  return sorted.map((person, index) => {
    if (index === 0 || person.points !== sorted[index - 1].points) rank = index + 1;
    return {nickname: person.nickname, team_no: person.team_no, points: person.points, streak: person.streak, rank};
  });
}
