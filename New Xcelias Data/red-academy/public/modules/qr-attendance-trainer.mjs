import {today} from './core.mjs';
import {createQrDataUrl} from './qr-code.mjs';
import {qrAttendanceUrl} from './qr-attendance-url.mjs';
import {closeModal,openModal} from './ui.mjs';
import {e} from './ui.mjs';

const dateQuery=(batchId,date)=>`?${new URLSearchParams({batchId,date})}`;
const localTime=value=>value?new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'—';
const dateLabel=value=>value?new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00Z`)):'—';
export const qrExpiryLabel=value=>value?`${new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(value))} Cairo time`:'the batch end date at 8:00 pm Cairo time';
const reasonLabel=value=>({permission_denied:'Location permission was denied',location_unavailable:'Location unavailable',location_timeout:'Location timed out',outside_geofence:'Outside the configured venue radius',boundary_uncertain:'Location accuracy overlaps the venue boundary'})[value]||'Location could not be verified';
const accuracyLabel=value=>({'0-25m':'0–25 m','26-75m':'26–75 m','76-150m':'76–150 m','over-150m':'Over 150 m',unknown:'Unavailable'})[value]||'Unavailable';
const distanceLabel=value=>({'within-radius':'Within radius','up-to-500m-outside':'Near outside boundary','over-500m-outside':'More than 500 m outside',unknown:'Unknown'})[value]||'Unknown';

function showError(message){const node=document.querySelector('#qr-staff-error');if(node){node.textContent=message;node.hidden=false;}}
function baseMarkup(batch){return `<div class="qr-staff-panel" data-batch="${e(batch.id)}"><div class="qr-staff-status" id="qr-staff-status"><span class="qr-staff-spinner" aria-hidden="true"></span><span>Loading QR attendance…</span></div><div class="qr-staff-error" id="qr-staff-error" role="alert" hidden></div><div id="qr-staff-content"></div></div>`;}
function routeBase(store,path,method='GET',body){return store.api(path,method,body);}
async function qrImage(url){const {default:factory}=await import('../vendor/qrcode-generator.mjs');return createQrDataUrl(url,factory,'H');}
function attendanceRows(items){if(!items?.length)return '<tr><td colspan="3" class="qr-empty">No attendance recorded for this session yet.</td></tr>';return items.map(item=>`<tr><td>${e(item.traineeName)}</td><td>${e(item.status)}</td><td>${e(localTime(item.arrivalTime))}${item.locationStatus==='verified'?'<span class="qr-source-label">QR verified</span>':'<span class="qr-source-label">Staff record</span>'}</td></tr>`).join('');}
function reviewRows(items){if(!items?.length)return '<p class="qr-empty">No location reviews need attention.</p>';return `<div class="qr-review-list">${items.map(item=>`<article class="qr-review"><div class="qr-review-head"><div><strong>${e(item.traineeName)}</strong><small>${e(localTime(item.attemptedAt))} · ${Number(item.attemptCount)||1} attempt${Number(item.attemptCount)===1?'':'s'}</small></div><span class="qr-review-badge">Needs review</span></div><p>${e(reasonLabel(item.reason))}</p><small>Accuracy: ${e(accuracyLabel(item.accuracyBand))} · Approximate distance: ${e(distanceLabel(item.distanceBand))}</small><div class="qr-review-actions"><button class="btn secondary" type="button" data-qr-action="manual" data-review="${e(item.id)}">Resolve after manual attendance</button><button class="btn ghost" type="button" data-qr-action="dismiss" data-review="${e(item.id)}">Dismiss review</button></div></article>`).join('')}</div>`;}
export function renderQrAttendancePass(batch,image){return `<section class="qr-print-pass" aria-label="Printable batch QR pass"><div class="qr-pass-brand"><img class="qr-pass-logo" src="./training-academy-logo.svg" alt="Red Training Academy"><span class="qr-pass-signature">X Gh</span></div><p class="qr-pass-eyebrow">BATCH ATTENDANCE · SECURE CHECK-IN</p><h1>${e(batch.batch_name)}</h1><div class="qr-pass-frame"><div class="qr-pass-code"><img src="${e(image)}" alt="QR attendance link for ${e(batch.batch_name)}"><span class="qr-pass-mark" aria-hidden="true"><img src="./training-academy-logo.svg" alt=""></span></div></div><p class="qr-pass-instruction">Scan when you arrive at the Academy</p><div class="qr-pass-notice">Your location is checked at check-in to confirm you are near the training venue. Attempts from another location are sent for staff review. If your location appears incorrect while you are here, speak to reception.</div></section>`;}
export function renderQrAttendanceActions(batch,state,venues){const session=state.session,canOpen=batch.status==='Active'&&batch.session_dates?.includes(today())&&(!session||session.closed);return `<div class="qr-staff-actions">${!session||session.closed?`<button class="btn primary" type="button" data-qr-action="open-session" ${canOpen?'':'disabled'}>${session?.closed?'Reopen':'Open'} today’s attendance</button>`:`<button class="btn secondary" type="button" data-qr-action="close-session" data-session="${e(session.id)}">Close today’s attendance</button>`}<button class="btn secondary" type="button" data-qr-action="print">Print batch QR pass</button><button class="btn ghost" type="button" data-qr-action="rotate">Replace printed QR</button></div>${(!session||session.closed)&&batch.session_dates?.includes(today())?`<label class="qr-field"><span>Training location for this session</span><select id="qr-venue-choice">${venues.filter(venue=>venue.active).map(venue=>`<option value="${e(venue.id)}" ${venue.is_default?'selected':''}>${e(venue.name)} · ${Number(venue.radius_m)} m</option>`).join('')}</select></label><button class="qr-link-button" type="button" data-qr-action="manage-venues">Manage training locations</button>`:''}`;}
function venueForm(venues){const selected=venues.find(item=>item.is_default)||venues[0]||{};return `<form class="qr-venue-form" id="qr-venue-form"><h3>Configure a training location</h3><p>Only venue coordinates and radius are saved. Trainee GPS coordinates are never stored.</p><input type="hidden" name="id" value="${e(selected.id||'')}"><label>Name<input name="name" required minlength="2" maxlength="100" value="${e(selected.name||'Red Training Academy')}"></label><div class="qr-venue-grid"><label>Latitude<input name="latitude" type="number" min="-90" max="90" step="any" required value="${Number.isFinite(Number(selected.latitude))?e(selected.latitude):'30.0076922'}"></label><label>Longitude<input name="longitude" type="number" min="-180" max="180" step="any" required value="${Number.isFinite(Number(selected.longitude))?e(selected.longitude):'31.5332323'}"></label></div><label>Check-in radius <span class="qr-unit">metres</span><input name="radius_m" type="number" min="50" max="2000" step="10" required value="${Number(selected.radius_m)||200}"></label><label class="qr-venue-active"><input name="active" type="checkbox" ${selected.active===false?'':'checked'}> Available for new attendance sessions</label><div class="qr-staff-actions"><button class="btn primary" type="submit">Save location</button><button class="btn secondary" type="button" data-qr-new-location>Add new location</button><button class="btn ghost" type="button" data-qr-action="manage-venues">Cancel</button></div></form>`;}

export async function openBatchQrAttendance(ctx,batch){
 if(!ctx.store.canWrite()||!batch||batch.status!=='Active')throw new Error('QR attendance is available to authorized trainers for active batches.');
 openModal('Batch QR attendance',`${batch.batch_name} · Stable QR pass · All dates use Cairo time`,baseMarkup(batch),{wide:true});
 let qrUrl='',qrData='',venues=[];
 async function reload(){
  const status=document.getElementById('qr-staff-status'),content=document.getElementById('qr-staff-content');if(!status||!content)return;
  status.hidden=false;status.querySelector('span:last-child').textContent='Loading session and location review…';
  document.getElementById('qr-staff-error').hidden=true;
  try{
   const date=today();
   const [link,state,reviews,venueState]=await Promise.all([
    routeBase(ctx.store,'qr-attendance/batch-qr/ensure','POST',{batchId:batch.id}),
    routeBase(ctx.store,`qr-attendance/sessions${dateQuery(batch.id,date)}`),
    routeBase(ctx.store,`qr-attendance/location-reviews${dateQuery(batch.id,date)}`),
    routeBase(ctx.store,'qr-attendance/venues'),
   ]);
   venues=venueState.venues||[];qrUrl=qrAttendanceUrl({currentHref:location.href,configuredBase:globalThis.RED_ACADEMY_CLOUD?.participantAppUrl,batchQrId:link.batchQrId});qrData=await qrImage(qrUrl);
   const activeToday=batch.status==='Active'&&batch.session_dates?.includes(date),session=state.session;
   const expires=session&&!session.closed?localTime(session.expiresAt):'';
   content.innerHTML=`<div class="qr-staff-overview"><div><span class="qr-overline">TODAY · ${e(dateLabel(date))}</span><h3>${session&&!session.closed?'Attendance session open':session?.closed?'Attendance session closed':'No attendance session open'}</h3><p>${activeToday?session&&!session.closed?'Trainees can scan the printed batch pass and check in.':"Open today's session to enable check-in with the same QR pass.":'QR attendance is available only on this batch’s scheduled dates.'}</p></div><div class="qr-staff-count"><strong>${Number(state.checkedIn)||0}<small> / ${Number(state.total)||0}</small></strong><span>checked in</span></div></div>
    <div class="qr-session-meta">${session?`<span>Session ${Number(session.dayNumber)||'—'}</span><span>${session.closed?'Closed':`Open until ${e(expires)} Cairo time`}</span><span>${e(session.venueName||'Training location')}</span>`:'<span>The trainer opens attendance for today’s scheduled session.</span>'}</div>
    ${renderQrAttendanceActions(batch,state,venues)}
    <div class="qr-print-preview">${renderQrAttendancePass(batch,qrData)}</div>
    <section class="qr-staff-section"><div class="qr-section-title"><div><h3>Check-in records</h3><p>QR check-ins appear in Daily Attendance and the trainee checklist.</p></div><button class="btn ghost" type="button" data-qr-action="reload">Refresh</button></div><div class="table-wrap"><table><thead><tr><th>Trainee</th><th>Status</th><th>Arrival / source</th></tr></thead><tbody>${attendanceRows(state.checkins)}</tbody></table></div></section>
    <section class="qr-staff-section"><div class="qr-section-title"><div><h3>Location reviews <span class="qr-review-count">${(reviews.items||[]).length}</span></h3><p>Outside, uncertain, or unavailable location checks are private review items—not attendance or fraud findings.</p></div></div>${reviewRows(reviews.items||[])}</section>
    <p class="qr-privacy-foot">The trainee QR contains only an opaque batch reference. Location is compared on the server; only coarse review bands are retained for unsuccessful checks. A private activation code binds one phone to one trainee.</p>`;
   status.hidden=true;bindModalActions(state);
  }catch(error){status.hidden=true;showError(error.message||'QR attendance could not be loaded. Try again.');}
 }
 function bindModalActions(state){
  document.querySelectorAll('[data-qr-action]').forEach(button=>button.addEventListener('click',async()=>{
   if(button.disabled)return;const action=button.dataset.qrAction;button.disabled=true;
   try{
    if(action==='reload'){await reload();return;}
    if(action==='open-session'){
     if(!batch.session_dates?.includes(today()))throw new Error('Today is not a scheduled training date for this batch.');
     const venueId=document.getElementById('qr-venue-choice')?.value;
     await ctx.store.api('qr-attendance/sessions/open','POST',{batchId:batch.id,date:today(),...(venueId?{venueId}:{})});await reload();return;
    }
    if(action==='close-session'){
     if(!window.confirm('Close today’s QR attendance session? The printed pass stays valid, but check-ins stop until a trainer opens a session again.'))return;
     await ctx.store.api('qr-attendance/sessions/close','POST',{id:button.dataset.session});await reload();return;
    }
    if(action==='rotate'){
     if(!window.confirm('Replace the printed QR? Existing copies will stop working. Print and distribute the new pass after replacement.'))return;
     await ctx.store.api('qr-attendance/batch-qr/rotate','POST',{batchId:batch.id});await reload();return;
    }
    if(action==='print'){
     const restorePrintState=()=>{document.body.classList.remove('printing-qr-pass');button.disabled=false;};
     window.addEventListener('afterprint',restorePrintState,{once:true});document.body.classList.add('printing-qr-pass');
     window.requestAnimationFrame(()=>{try{window.print();}finally{restorePrintState();}});return;
    }
    if(action==='manage-venues'){
     const old=document.getElementById('qr-venue-form');if(old){old.remove();return;}const area=document.createElement('div');area.innerHTML=venueForm(venues);document.querySelector('.qr-staff-actions')?.insertAdjacentElement('afterend',area.firstElementChild);bindVenueForm();return;
    }
    if(action==='manual'||action==='dismiss'){
     if(action==='manual'&&!window.confirm('Resolve this only after you have entered this trainee’s attendance through the normal Daily Attendance screen. Continue?'))return;
     await ctx.store.api('qr-attendance/location-reviews/resolve','POST',{reviewId:button.dataset.review,outcome:action==='manual'?'manual_attendance_recorded':'dismissed'});await reload();return;
    }
   }catch(error){showError(error.message||'The QR attendance action could not be completed.');button.disabled=false;}
  }));
 }
 function bindVenueForm(){const form=document.getElementById('qr-venue-form');form?.addEventListener('submit',async event=>{event.preventDefault();const data=new FormData(form),button=form.querySelector('[type="submit"]');button.disabled=true;try{await ctx.store.api('qr-attendance/venues/upsert','POST',{...(data.get('id')?{id:data.get('id')}:{}),name:String(data.get('name')).trim(),latitude:Number(data.get('latitude')),longitude:Number(data.get('longitude')),radius_m:Number(data.get('radius_m')),active:data.get('active')==='on'});await reload();}catch(error){showError(error.message||'The training location could not be saved.');button.disabled=false;}});form?.querySelector('[data-qr-new-location]')?.addEventListener('click',()=>{form.elements.id.value='';form.elements.name.value='';form.elements.latitude.value='';form.elements.longitude.value='';form.elements.radius_m.value='200';form.elements.active.checked=true;form.elements.name.focus();});}
 await reload();
}

export async function openTraineeQrCode(ctx,trainee){
 if(!ctx.store.canWrite()||!trainee||trainee.enrollment_status!=='Active')throw new Error('A QR activation code is available only for an active trainee.');
 const batch=ctx.store.data.batches.find(item=>item.id===trainee.batch_id);if(!batch||batch.status!=='Active')throw new Error('The trainee must belong to an active batch.');
 openModal('Private QR activation code',`${trainee.trainee_name} · ${batch.batch_name}`,`<div class="qr-code-dialog"><div class="qr-code-state" id="qr-code-state">Creating a one-time private code…</div><div id="qr-code-content"></div></div>`);
 const state=document.getElementById('qr-code-state'),content=document.getElementById('qr-code-content');
 async function issue(action){state.hidden=false;state.textContent=action==='reissue'?'Replacing the previous activation code and device link…':'Creating a one-time private code…';content.innerHTML='';try{const result=await ctx.store.api('qr-attendance/codes','POST',{traineeId:trainee.id,action});state.hidden=true;content.innerHTML=`<div class="qr-private-code"><span>${action==='reissue'?'Replacement code · show only to the trainee':'One-time code · show only to the trainee'}</span><strong id="qr-activation-code-value">${e(result.activationCode)}</strong><small>Expires ${e(qrExpiryLabel(result.expiresAt))}. This code is shown once and is not stored in plaintext.</small><div class="qr-staff-actions"><button class="btn secondary" type="button" data-qr-copy>Copy code</button><button class="btn ghost" type="button" data-action="close-modal">Close</button></div></div><p class="qr-code-warning">Give this code to the trainee in person. It binds the first phone that successfully activates it. Reissuing revokes the old code and device.</p>`;document.querySelector('[data-qr-copy]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.activationCode);document.querySelector('[data-qr-copy]').textContent='Copied';}catch{document.querySelector('#qr-code-content').insertAdjacentHTML('beforeend','<p class="qr-code-warning">Clipboard access is blocked. Select the code above and share it in person.</p>');}});
  }catch(error){state.textContent=error.message||'A private code could not be issued.';if(error.status===409){content.innerHTML=`<p class="qr-code-warning">A code or device already exists for this trainee. Only continue if the phone is being replaced or the previous code was lost; the current phone link will stop working.</p><div class="qr-staff-actions"><button class="btn danger" type="button" data-qr-reissue>Confirm replacement</button><button class="btn ghost" type="button" data-action="close-modal">Cancel</button></div>`;document.querySelector('[data-qr-reissue]')?.addEventListener('click',()=>issue('reissue'));}}
 }
 await issue('issue');
}
