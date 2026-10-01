import {ApiError,isId} from './validation.mjs';

// A public room invitation grants access to names only, never contact details or grades.
export function liveRoster(body, state) {
  if (!body.batch_id) return null;
  if (body.mode === 'pulse' || !isId(body.batch_id)) throw new ApiError(400, 'Choose an active batch for a scored live game.');
  const batch = state.batches.find(item => item.id === body.batch_id && !item.archived_at);
  if (!batch) throw new ApiError(400, 'Choose an active batch for a scored live game.');
  const trainees = state.trainees.filter(item => item.batch_id === batch.id && item.enrollment_status !== 'Stopped Attending')
    .map(item => ({id:item.id,name:item.trainee_name,company:state.companies.find(company => company.id === item.company_id)?.name || ''}))
    .sort((a,b) => a.name.localeCompare(b.name));
  if (!trainees.length) throw new ApiError(400, 'This batch has no active trainees to join.');
  return {batch_id:batch.id,batch_name:batch.batch_name,trainees};
}

export function liveJoinIdentity(body, roster) {
  const claimed = roster?.trainees.find(item => item.id === body.trainee_id);
  if (roster && !claimed) throw new ApiError(400, 'Choose your name from this batch.');
  if (!roster && body.trainee_id) throw new ApiError(400, 'This room is not linked to a batch.');
  const nickname = (typeof body.nickname === 'string' ? body.nickname.trim() : '') || claimed?.name.slice(0,24) || '';
  if (!nickname || nickname.length > 24 || /[\u0000-\u001f\u007f]/.test(nickname)) throw new ApiError(400, 'Choose a nickname of up to 24 characters.');
  return {nickname,trainee_id:claimed?.id || null};
}

export function checkedLiveMappings(body) {
  if (!isId(body.room_id) || !Array.isArray(body.mappings) || !body.mappings.length || body.mappings.length > 80) throw new ApiError(400, 'Review every player before saving results.');
  const players = new Set(), trainees = new Set();
  return body.mappings.map(item => {
    if (!item || !isId(item.player_id) || !(item.trainee_id === null || isId(item.trainee_id)) || players.has(item.player_id)) throw new ApiError(400, 'Review every player before saving results.');
    if (item.trainee_id && trainees.has(item.trainee_id)) throw new ApiError(400, 'Each trainee can receive only one result from this game. Resolve duplicate name matches.');
    players.add(item.player_id);if(item.trainee_id) trainees.add(item.trainee_id);
    return {player_id:item.player_id,trainee_id:item.trainee_id};
  });
}

export function liveProfileReview(deck, players, answers, savedAt) {
  if (!deck.roster) return null;
  return {...deck.roster,saved_at:savedAt || null,players:players.map(player => {
    const submitted = answers.filter(answer => answer.player_id === player.id && answer.correct !== null && answer.correct !== undefined);
    return {player_id:player.id,nickname:player.nickname,trainee_id:player.trainee_id || null,points:player.points,
      answered_count:submitted.length,correct_count:submitted.filter(answer => !!answer.correct).length};
  })};
}

export function livePlayerProfile(deck, player, savedAt, result=null) {
  if (!deck.roster) return null;
  return {name:deck.roster.trainees.find(item => item.id === player.trainee_id)?.name || '',reviewed:!!savedAt,recorded:!!result,confirmed_name:deck.roster.trainees.find(item=>item.id===result?.trainee_id)?.name || '',earned_xp:result?.earned_xp||0,session_date:result?.session_date||null,attendance_status:result?.attendance_status||null};
}
