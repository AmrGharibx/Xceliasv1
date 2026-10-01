import {e,dateLabel} from './ui.mjs';
import {cairoDate} from './core.mjs';

export function activityProfileMarkup(results) {
  return `<h3>Live activity results</h3><p class="faint">Trainer-confirmed results · latest 100 games. Accuracy counts all rounds. Correct answers earn Academy XP; game points include separate streak bonuses. Confirmed participation can count towards session attendance. Existing attendance and formal assessments are preserved.</p><div class="table-wrap"><table><thead><tr><th>Date</th><th>Challenge / nickname</th><th>Correct</th><th>Answered</th><th>Accuracy</th><th>Game points</th><th>Academy XP</th><th>Session attendance</th></tr></thead><tbody>${results.map(result=>`<tr><td>${e(dateLabel(cairoDate(result.created_at)))}</td><td><strong>${e(result.title)}</strong><br>${e(result.nickname)}<br><small>Confirmed by ${e(result.confirmed_by)}</small></td><td>${Number(result.correct_count)} / ${Number(result.total_rounds)}</td><td>${Number(result.answered_count)} / ${Number(result.total_rounds)}</td><td>${Number(result.score).toFixed(2)}%</td><td>${Number(result.room_points)}</td><td>${Number(result.earned_xp)||0}</td><td>${e(result.session_date||'—')}<br>${e(result.attendance_status||'Not recorded')}</td></tr>`).join('')||'<tr><td colspan="8">No trainer-confirmed live games yet.</td></tr>'}</tbody></table></div>`;
}

export function mountActivityProfile(store,traineeId) {
  const links=document.querySelector('.modal .batch-record-links');if(!links)return;
  const section=document.createElement('section');section.className='profile-notes activity-profile-history';
  section.setAttribute('aria-label','Live activity results');links.before(section);
  const load=async()=>{
    section.textContent='Loading live activity results…';
    try{const data=await store.api(`activities/live/results?trainee_id=${encodeURIComponent(traineeId)}`);if(section.isConnected)section.innerHTML=activityProfileMarkup(data.results||[]);}
    catch{if(!section.isConnected)return;section.textContent='Live activity results could not be loaded. ';const retry=document.createElement('button');retry.type='button';retry.className='btn secondary';retry.textContent='Try again';retry.onclick=load;section.append(retry);}
  };load();
}
