import {e,icon,btn,option,openModal,closeModal,toast,empty,confirmDialog} from './ui.mjs';

function fail(form,message){let alert=form.querySelector('[role="alert"]');if(alert)alert.textContent=message;else toast(message,'error');}
export async function usersModal(ctx){
 if(ctx.store.user?.role!=='admin')return;
 openModal('Company staff','Loading accounts and invitations...',empty('Loading team access','Verifying administrator access.'));
 try{
  const [users,invitations]=await Promise.all([ctx.store.api('users'),ctx.store.api('invitations')]);
  if(ctx.store.user?.role!=='admin')return;
  const pending=invitations.filter(i=>!i.used_at&&!i.revoked_at&&i.expires_at>Date.now());
  openModal('Company staff','Only invited team members can access this workspace.',`
   <div class="team-toolbar"><div class="notice subtle">${icon('shield',17)} Assign only the access each team member needs. There is no public registration.</div>${btn('Invite team member','invite-team','primary','plus')}</div>
   <div class="table-wrap"><table><thead><tr><th>Team member</th><th>Role</th><th>Active</th><th></th></tr></thead><tbody>${users.map(u=>`<tr data-user-row="${u.id}"><td><strong>${e(u.full_name)}</strong><small>${e(u.email)}${u.id===ctx.store.user.id?' &middot; You':''}</small></td><td><select aria-label="Role for ${e(u.full_name)}" data-user-role>${['viewer','instructor','admin'].map(r=>option(r,r[0].toUpperCase()+r.slice(1),u.role)).join('')}</select></td><td><input type="checkbox" data-user-active aria-label="Active access for ${e(u.full_name)}" ${u.active?'checked':''}></td><td>${btn('Save','save-user','small','check',`data-id="${u.id}"`)}</td></tr>`).join('')}</tbody></table></div>
   <h3 style="margin:28px 0 12px">Pending invitations <span class="faint">(${pending.length})</span></h3>
   ${pending.length?`<div class="table-wrap"><table><thead><tr><th>Invitation</th><th>Role</th><th>Expires</th><th></th></tr></thead><tbody>${pending.map(i=>`<tr><td><strong>${e(i.full_name)}</strong><small>${e(i.email)}</small></td><td>${e(i.role)}</td><td>${e(new Date(i.expires_at).toLocaleString('en-GB',{timeZone:'Africa/Cairo',dateStyle:'medium',timeStyle:'short'}))}<small>Cairo time</small></td><td>${btn('Revoke','revoke-invite','small danger','x',`data-id="${i.id}"`)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="faint">No invitations are awaiting activation.</p>'}
   <p class="team-footnote">Permission changes revoke the member\'s current sessions. The final active administrator cannot be removed. Invitations expire after 48 hours and work once.</p>`,{wide:true});
  document.querySelector('[data-action="invite-team"]').onclick=()=>inviteModal(ctx);
  document.querySelectorAll('[data-action="save-user"]').forEach(button=>button.onclick=async()=>{
   const row=button.closest('tr'),role=row.querySelector('[data-user-role]').value,active=row.querySelector('[data-user-active]').checked;
   button.disabled=true;
   try{await ctx.store.api('users','PATCH',{id:button.dataset.id,role,active});toast('Team access updated.');if(button.dataset.id===ctx.store.user?.id){closeModal();await ctx.store.logout();ctx.go('login');}else await usersModal(ctx);}
   catch(error){toast(error.message,'error');button.disabled=false;}
  });
  document.querySelectorAll('[data-action="revoke-invite"]').forEach(button=>button.onclick=()=>confirmDialog('Revoke this invitation?','The invitation link will stop working. Existing team accounts will not be changed.',async()=>{await ctx.store.api('invitations','DELETE',{id:button.dataset.id});toast('Invitation revoked.');await usersModal(ctx);},{label:'Revoke invitation'}));
 }catch(error){if(ctx.store.user)openModal('Team access','Unable to load team accounts.',`<div class="notice danger">${e(error.message)}</div>`);}
}
function inviteModal(ctx){
 openModal('Invite a company staff member','An invitation grants access to the internal training system.',`<form id="invite-form"><label class="field"><span>Full name</span><input name="full_name" autocomplete="off" required maxlength="160" placeholder="Team member name"></label><label class="field"><span>Work email</span><input name="email" type="email" autocomplete="off" required maxlength="254" placeholder="Their work email"></label><label class="field"><span>Access role</span><select name="role"><option value="viewer">Viewer - read-only access</option><option value="instructor">Instructor - manage training and export reports</option><option value="admin">Administrator - manage training, delete records, and manage access</option></select></label><div class="notice subtle">${icon('lock',17)} Share the generated link privately with this person. No email is sent automatically.</div><div class="form-error" role="alert"></div><div class="modal-actions">${btn('Cancel','cancel-invite','secondary')}<button class="btn primary" type="submit">Create invitation ${icon('arrow',15)}</button></div></form>`);
 const form=document.getElementById('invite-form');form.querySelector('[data-action="cancel-invite"]').onclick=()=>usersModal(ctx);
 form.onsubmit=async event=>{
  event.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;fail(form,'');
  try{
   const invitation=await ctx.store.api('invitations','POST',Object.fromEntries(new FormData(form)));
   openModal('Invitation ready.',`Created for ${invitation.email}`,`<div class="notice subtle">${icon('shield',18)} Send this link privately. It is shown only now, expires in 48 hours, and can activate one account.</div><label class="field" style="margin-top:20px"><span>Private invitation link</span><input id="invitation-link" class="mono" readonly value="${e(invitation.url)}" aria-label="Private invitation link"></label><p class="team-footnote">The recipient needs network access to this internal server. A localhost link works only on this computer; use your configured HTTPS address for invitations to other devices.</p><div class="modal-actions">${btn('Copy link','copy-invite','primary','copy')}${btn('Back to team','back-team','secondary','users')}</div>`);
   const input=document.getElementById('invitation-link');
   document.querySelector('[data-action="copy-invite"]').onclick=async()=>{try{await navigator.clipboard.writeText(invitation.url);toast('Invitation link copied.');}catch{input.focus();input.select();toast('Select and copy the invitation link.');}};
   document.querySelector('[data-action="back-team"]').onclick=()=>usersModal(ctx);
  }catch(error){fail(form,error.message);button.disabled=false;}
 };
}
export function passwordModal(ctx){
 if(!ctx.store.user)return;
 openModal('Change your password','All of your current sessions will end after this change.',`<form id="password-form"><label class="field"><span>Current password</span><input name="currentPassword" type="password" autocomplete="current-password" required maxlength="256"></label><label class="field"><span>New password</span><input name="password" type="password" autocomplete="new-password" required minlength="12" maxlength="256" placeholder="At least 12 characters"></label><label class="field"><span>Confirm new password</span><input name="confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="256"></label><div class="form-error" role="alert"></div><div class="modal-actions">${btn('Cancel','cancel-password','secondary')}<button class="btn primary" type="submit">Update password ${icon('lock',15)}</button></div></form>`);
 const form=document.getElementById('password-form');form.querySelector('[data-action="cancel-password"]').onclick=closeModal;
 form.onsubmit=async event=>{event.preventDefault();const values=new FormData(form),button=form.querySelector('[type="submit"]');button.disabled=true;fail(form,'');try{
  if(values.get('password')!==values.get('confirm'))throw new Error('The passwords do not match.');
  ctx.store.endingSession=true;
  await ctx.store.api('auth/password','POST',{currentPassword:values.get('currentPassword'),password:values.get('password')});
  closeModal();await ctx.store.logout();ctx.go('login');toast('Password updated. Sign in with your new password.');
 }catch(error){ctx.store.endingSession=false;fail(form,error.message);button.disabled=false;}};
}
export function helpModal(ctx){
 openModal('Internal system guide','Operational workflow from setup to reporting.',`<div class="notice subtle">${icon('shield',17)}This is your internal company workspace. Records are saved on your internal server.</div><div class="profile-notes"><h3>01 / Set up your directory</h3><p>Historical records from the Notion import are already available. Add only new real companies or trainees; do not enter imported records again. Use Notion import & review to inspect source coverage and decisions.</p><h3>02 / Plan the batch</h3><p>For a new batch, choose capacity and confirm ten training dates. Imported historical batches retain missing or irregular dates instead of inventing a schedule.</p><h3>03 / Build the roster</h3><p>Enroll trainees and assign their company and batch. A separate ten-day completion checklist is created for a new enrollment when its batch has recorded date bounds. Imported checklist periods remain separate.</p><h3>04 / Keep attendance accurate</h3><p>Use Daily attendance for entry and Attendance records for the complete source register, including unassigned or partial entries. Unrecorded days are not absences. Bulk marking never invents times. The manual late flag and arrival-based lateness remain separate.</p><h3>05 / Measure progress</h3><p>Score mapping, product knowledge, presentability, and soft skills from 0 to 5. Technical and soft scores each use a /10 denominator; overall uses /20. Missing imported scores stay blank; incomplete, shared and explicitly not-assessed records do not enter graded averages. Saved revisions preserve previous assessments.</p><h3>06 / Manage staff access</h3><p>Administrators create invitations in Workspace settings, Manage team. Invite links work once and expire after 48 hours. Share them privately with the intended person; the application does not automatically email them.</p><h3>Protect your records</h3><p>Back up the server database regularly using npm run backup. Exports contain internal data and should be shared only with authorized people. Offline editing and browser-stored trainee data are intentionally disabled.</p><h3>Reports</h3><p>Built-in summaries use your saved metrics. Optional external AI drafts are off until configured on the server and always require explicit consent and instructor review.</p></div><div class="modal-actions">${btn('Back to the workspace','close-help','primary','arrow')}</div>`,{wide:true});
 document.querySelector('[data-action="close-help"]').onclick=closeModal;
}
