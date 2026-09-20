import './starfield.mjs';
import {sourceModal,sourceBrowser,recordModal,legacyEdit,reviewNote} from './modules/records.mjs';
import {AcademyStore} from './modules/store.mjs';
import {today,STATUSES,BATCH_STATUSES,wasLate,cairoDate,escapeHtml} from './modules/core.mjs';
import {shell,authView,NAV,scoped} from './modules/views.mjs';
import {icon,e,openModal,closeModal,confirmDialog,toast,avatar} from './modules/ui.mjs';
import {batchForm,traineeForm,companyForm,attendanceForm,assessmentForm,traineeProfile,reportModal,assessmentHistory,activityModal,usersModal,helpModal,passwordModal} from './modules/forms.mjs';
import {exportModal} from './modules/export.mjs';
import {academyReportModal} from './modules/academy-reports.mjs';
const store=new AcademyStore();
try{if(localStorage.getItem('internal-training-theme')==='light')document.body.classList.add('light');}catch{}
const ctx={store,route:'dashboard',batchId:'',companyId:'',detailId:'',search:'',sort:'name',page:1,chartDays:14,batchView:'list',summaryView:'table',companySort:'headcount',calendarMonth:today().slice(0,7),date:today(),attendanceStatus:'',outcomeFilter:'',reviewStatus:'',bulkStatus:'Present',selection:new Set(),sidebarOpen:false,invitationToken:'',loginEmail:'',render,go};
const routes=new Set([...NAV.map(n=>n[0]),'settings','login','join']);
let firstPaint=true;
function ensureContext(){if(ctx.batchId&&!store.data.batches.some(b=>b.id===ctx.batchId))ctx.batchId='';if(ctx.companyId&&!store.data.companies.some(c=>c.id===ctx.companyId))ctx.companyId='';if(ctx.route==='attendance'&&!ctx.batchId)ctx.batchId=store.data.batches.find(b=>b.status==='Active')?.id||store.data.batches[0]?.id||'';}
function render(){
 if(store.status==='loading'){document.getElementById('app').innerHTML='<div class="boot"><span class="brand-mark">R</span><p>Verifying internal system access...</p></div>';return;}
 ensureContext();const focused=document.activeElement,field=focused?.dataset?.field,selection=focused instanceof HTMLInputElement&&focused.type==='search'?focused.selectionStart:null;
 const auth=!store.user||store.status!=='ready';
 if(!auth&&['login','join'].includes(ctx.route))ctx.route='dashboard';
 document.getElementById('app').innerHTML=auth?authView(ctx):shell(ctx);
 document.title=`${auth?store.setupRequired?'Set up your workspace':'Sign in':NAV.find(n=>n[0]===ctx.route)?.[1]||'Workspace settings'} | Internal Training System`;
 if(field==='search'){const input=document.querySelector('[data-field="search"]');input?.focus();if(selection!==null)input?.setSelectionRange(selection,selection);}
 if(auth)bindAuth();if(firstPaint&&!auth){firstPaint=false;animateCounts();}
}
function parseRoute(){const parts=(location.hash.slice(1)||location.pathname).split('/').filter(Boolean);let route=parts[0]||'dashboard';if(route==='index.html'||route.endsWith('.html'))route='dashboard';if(route==='attendance'&&parts[1]==='10-day')route='summaries';if(route==='join'&&parts[1]){ctx.invitationToken=parts[1];history.replaceState(null,'','#/join');}return {route:routes.has(route)?route:'dashboard',detailId:route==='batches'?parts[1]||'':''};}
function go(route,options={}){const reset=ctx.route!==route;ctx.route=routes.has(route)?route:'dashboard';ctx.detailId=options.detailId||'';ctx.sidebarOpen=false;if(reset){ctx.search='';ctx.page=1;ctx.attendanceStatus='';ctx.outcomeFilter='';ctx.selection.clear();}ensureContext();if(options.history!==false){const fragment='#/'+ctx.route+(ctx.detailId?'/'+ctx.detailId:'');if(location.hash!==fragment)history.pushState(null,'',fragment);}render();document.querySelector('#main')?.focus({preventScroll:true});if(reset)window.scrollTo({top:0,behavior:'instant'});}
function animateCounts(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const nodes=[...document.querySelectorAll('[data-count]')].filter(n=>n.dataset.count!==''),start=performance.now();const step=now=>{const p=Math.min(1,(now-start)/650),ease=1-Math.pow(1-p,3);for(const el of nodes){if(el.isConnected)el.textContent=Math.round(Number(el.dataset.count)*ease).toLocaleString('en-US');}if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);}
function bindAuth(){
 const form=document.getElementById('auth-form');if(!form)return;
 form.onsubmit=async event=>{event.preventDefault();const values=new FormData(form),button=form.querySelector('[type="submit"]'),old=button.innerHTML,mode=form.dataset.mode,errors=document.getElementById('auth-error');
 button.disabled=true;button.textContent=mode==='login'?'Signing in...':'Saving...';errors.innerHTML='';
 try{
  if(mode!=='login'){
   if(values.get('password')!==values.get('confirm_password'))throw new Error('The passwords do not match.');
   const result=await store.api(mode==='setup'?'auth/setup':'auth/accept-invitation','POST',Object.fromEntries(values));
   ctx.invitationToken='';ctx.loginEmail=result.email||'';store.setupRequired=false;store.status='signed-out';go('login');toast(result.message);
  }else{await store.login(values.get('email'),values.get('password'));ctx.loginEmail='';go('dashboard');toast('Welcome to the internal training system.');}
 }catch(err){if(errors.isConnected)errors.innerHTML=`<div class="form-error">${e(err.message)}</div>`;else toast(err.message,'error');button.disabled=false;button.innerHTML=old;}
 };
}
async function quickAttendance(traineeId,checkout=false){const t=store.data.trainees.find(t=>t.id===traineeId);if(!t)return;if(ctx.date!==today()){attendanceForm(ctx,t);return;}const record=store.data.daily_attendance.find(r=>r.trainee_id===t.id&&r.date===ctx.date),now=new Date().toISOString();if(cairoDate(now)!==ctx.date)throw new Error('The date changed. Select the current Cairo date and try again.');if(checkout&&(!record?.arrival_time||now<record.arrival_time))throw new Error('Departure must be after the recorded arrival. Use the time editor to correct the entry.');const data={trainee_id:t.id,batch_id:t.batch_id,date:ctx.date,status:'Present',arrival_time:checkout?record.arrival_time:now,departure_time:checkout?now:null,is_late:record?.is_late||false};await store.mutate('daily_attendance',record?'update':'create',record,data);toast(`${t.trainee_name} checked ${checkout?'out':'in'}.`);}
async function bulkAttendance(){if(!ctx.selection.size)return;const status=document.getElementById('bulk-status')?.value||'Present';if(!STATUSES.includes(status))throw new Error('Choose a valid status.');const entries=[...ctx.selection].map(traineeId=>{const t=store.data.trainees.find(t=>t.id===traineeId);if(!t||t.batch_id!==ctx.batchId)throw new Error('The selected roster changed. Select trainees again.');const old=store.data.daily_attendance.find(r=>r.trainee_id===t.id&&r.date===ctx.date),skip=['Absent','Off Day'].includes(status);return {action:old?'update':'create',id:old?.id,expectedVersion:old?.version,data:{trainee_id:t.id,batch_id:t.batch_id,date:ctx.date,status,arrival_time:skip?null:old?.arrival_time||null,departure_time:skip?null:old?.departure_time||null,is_late:skip?false:old?.is_late||false}};});await store.write({table:'daily_attendance',records:entries});ctx.selection.clear();render();toast(`${entries.length} attendance records saved as ${status.toLowerCase()}.`);}
function commandPalette(){if(!store.user)return;openModal('Find a record.','Search internal records.',`<div class="search-input" style="width:100%">${icon('search',17)}<input id="command-search" type="search" aria-label="Search internal records" placeholder="Search records..." style="width:100%;padding-top:12px;padding-bottom:12px"></div><div id="command-results" class="search-results"></div>`);const input=document.getElementById('command-search'),results=document.getElementById('command-results');const update=()=>{const q=input.value.toLowerCase().trim(),items=[];for(const[route,label,ico]of NAV)if(!q||label.toLowerCase().includes(q))items.push({kind:'page',id:route,title:label,subtitle:'Workspace page',ico});if(q){for(const t of store.data.trainees.filter(t=>t.trainee_name.toLowerCase().includes(q)).slice(0,5))items.push({kind:'trainee',id:t.id,title:t.trainee_name,subtitle:store.data.companies.find(c=>c.id===t.company_id)?.name,ico:'users'});for(const b of store.data.batches.filter(b=>b.batch_name.toLowerCase().includes(q)).slice(0,4))items.push({kind:'batch',id:b.id,title:b.batch_name,subtitle:b.status,ico:'cap'});for(const c of store.data.companies.filter(c=>c.name.toLowerCase().includes(q)).slice(0,3))items.push({kind:'company',id:c.id,title:c.name,subtitle:'Company directory',ico:'building'});}results.innerHTML=items.slice(0,10).map(r=>`<button class="search-result" data-action="command-select" data-kind="${r.kind}" data-id="${r.id}">${icon(r.ico,18)}<div><strong>${e(r.title)}</strong><small>${e(r.subtitle)}</small></div>${icon('arrow',14)}</button>`).join('')||'<p class="faint" style="font-size:12px;padding:15px">No matching results.</p>';};input.oninput=update;update();setTimeout(()=>input.focus(),30);}
document.addEventListener('click',async event=>{const el=event.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action,id=el.dataset.id;if(!store.user&&!['login','retry-connection','theme','nav'].includes(action))return;try{switch(action){
 case 'nav':go(el.dataset.route);break;
 case 'toggle-sidebar':ctx.sidebarOpen=!ctx.sidebarOpen;render();break;
 case 'theme':document.body.classList.toggle('light');try{localStorage.setItem('internal-training-theme',document.body.classList.contains('light')?'light':'dark');}catch{}render();break;
 case 'login':go('login');break;
 case 'retry-connection':await store.init();break;
 case 'change-password':passwordModal(ctx);break;
 case 'logout':closeModal();await store.logout();go('login');toast('You are signed out.');break;
 case 'help':helpModal(ctx);break;
 case 'activity':activityModal(ctx);break;
 case 'users':await usersModal(ctx);break;
 case 'command':commandPalette();break;
 case 'command-select':closeModal();if(el.dataset.kind==='page')go(id);if(el.dataset.kind==='trainee')traineeProfile(ctx,store.data.trainees.find(t=>t.id===id));if(el.dataset.kind==='batch')go('batches',{detailId:id});if(el.dataset.kind==='company'){ctx.companyId=id;go('trainees');}break;
 case 'source-record':await sourceModal(ctx,id);break;
 case 'source-browser':await sourceBrowser(ctx);break;
 case 'record-detail':recordModal(ctx,el.dataset.table,id);break;
 case 'legacy-edit':legacyEdit(ctx,el.dataset.table,store.data[el.dataset.table]?.find(r=>r.id===id));break;
 case 'review-note':reviewNote(ctx,id);break;
 case 'batch-records':ctx.batchId=id;go(el.dataset.kind);break;
 case 'new-batch':batchForm(ctx,null,el.dataset.status||'Planning');break;
 case 'edit-batch':batchForm(ctx,store.data.batches.find(b=>b.id===id));break;
 case 'batch-report':academyReportModal(ctx,store.data.batches.find(b=>b.id===id));break;
 case 'batch-detail':go('batches',{detailId:id});break;
 case 'back-batches':go('batches');break;
 case 'batch-view':ctx.batchView=el.dataset.view;render();break;
 case 'summary-view':ctx.summaryView=el.dataset.view;ctx.page=1;render();break;
 case 'new-trainee':traineeForm(ctx,null,el.dataset.batch||'');break;
 case 'edit-trainee':traineeForm(ctx,store.data.trainees.find(t=>t.id===id));break;
 case 'profile':traineeProfile(ctx,store.data.trainees.find(t=>t.id===id));break;
 case 'new-company':companyForm(ctx);break;
 case 'edit-company':companyForm(ctx,store.data.companies.find(c=>c.id===id));break;
 case 'company-trainees':ctx.companyId=id;go('trainees');break;
 case 'new-assessment':assessmentForm(ctx);break;
 case 'edit-assessment':assessmentForm(ctx,store.data.assessments.find(a=>a.id===id));break;
 case 'assessment-report':reportModal(ctx,store.data.trainees.find(t=>t.id===id),'assessment');break;
 case 'attendance-report':reportModal(ctx,store.data.trainees.find(t=>t.id===id),'attendance');break;
 case 'assessment-history':assessmentHistory(ctx,store.data.assessments.find(a=>a.id===id));break;
 case 'go-attendance':ctx.date=today();go('attendance');break;
 case 'attendance-for-batch':ctx.batchId=id;ctx.date=bestDate(id);go('attendance');break;
 case 'attendance-date':ctx.batchId=el.dataset.batch;ctx.date=el.dataset.date;go('attendance');break;
 case 'set-date':ctx.date=el.dataset.date;ctx.selection.clear();render();break;
 case 'edit-attendance':attendanceForm(ctx,store.data.trainees.find(t=>t.id===id));break;
 case 'check-in':await quickAttendance(id);break;
 case 'check-out':await quickAttendance(id,true);break;
 case 'bulk-attendance':await bulkAttendance();break;
 case 'clear-selection':ctx.selection.clear();render();break;
 case 'reset-filters':ctx.batchId='';ctx.companyId='';ctx.search='';ctx.page=1;ctx.selection.clear();ensureContext();render();break;
 case 'chart-days':ctx.chartDays=Number(el.dataset.days);render();break;
 case 'prev-page':ctx.page=Math.max(1,ctx.page-1);render();break;
 case 'next-page':ctx.page++;render();break;
 case 'prev-month':case 'next-month':{const d=new Date(ctx.calendarMonth+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+(action==='next-month'?1:-1));ctx.calendarMonth=d.toISOString().slice(0,7);render();break;}
 case 'calendar-today':ctx.calendarMonth=today().slice(0,7);render();break;
 case 'export':exportModal(ctx);break;

 }}catch(err){toast(err.message||'The action could not be completed.','error');render();}});
function bestDate(batchId){const dates=store.data.batches.find(b=>b.id===batchId)?.session_dates||[];return dates.includes(today())?today():dates.filter(d=>d<=today()).at(-1)||dates[0]||today();}
document.addEventListener('input',event=>{const el=event.target;if(el.dataset.field==='search'){ctx.search=el.value;ctx.page=1;render();}});
document.addEventListener('change',async event=>{const el=event.target;try{
 if(el.dataset.field){const field=el.dataset.field;if(field==='search')return;if(Object.hasOwn(ctx,field)){ctx[field]=el.value;ctx.page=1;ctx.selection.clear();if(field==='batchId')ctx.date=bestDate(el.value);render();}return;}
 if(el.id==='bulk-status'){ctx.bulkStatus=el.value;return;}
 if(el.hasAttribute('data-select-all')){document.querySelectorAll('[data-select]').forEach(input=>{if(el.checked)ctx.selection.add(input.dataset.select);else ctx.selection.delete(input.dataset.select);});render();return;}
 if(el.dataset.select){if(el.checked)ctx.selection.add(el.dataset.select);else ctx.selection.delete(el.dataset.select);render();return;}
 if(el.dataset.late){const r=store.data.daily_attendance.find(r=>r.trainee_id===el.dataset.late&&r.date===ctx.date);if(r)await store.mutate('daily_attendance','update',r,{...r,is_late:el.checked});toast('Manual late flag updated.');return;}
 if(el.dataset.checklist){const r=store.data.attendance_10day.find(r=>r.id===el.dataset.checklist),days=[...r.days];days[Number(el.dataset.day)]=el.checked;await store.mutate('attendance_10day','update',r,{...r,days});toast('Checklist progress saved.');}
 }catch(err){toast(err.message,'error');render();}});
document.addEventListener('dragstart',event=>{const card=event.target.closest('[data-batch-drag]');if(!card||!store.canWrite())return;event.dataTransfer.setData('text/plain',card.dataset.batchDrag);event.dataTransfer.effectAllowed='move';});
document.addEventListener('dragover',event=>{const column=event.target.closest('[data-drop-status]');if(!column||!store.canWrite())return;event.preventDefault();column.classList.add('drag-over');});
document.addEventListener('dragleave',event=>event.target.closest('[data-drop-status]')?.classList.remove('drag-over'));
document.addEventListener('drop',async event=>{const column=event.target.closest('[data-drop-status]');if(!column||!store.canWrite())return;event.preventDefault();column.classList.remove('drag-over');const b=store.data.batches.find(b=>b.id===event.dataTransfer.getData('text/plain')),status=column.dataset.dropStatus;if(!b||!BATCH_STATUSES.includes(status)||b.status===status)return;try{await store.mutate('batches','update',b,{...b,status});toast(`${b.batch_name} moved to ${status.toLowerCase()}.`);}catch(err){toast(err.message,'error');}});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();commandPalette();}if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"][data-action]')){event.preventDefault();event.target.click();}});
store.addEventListener('change',render);store.addEventListener('expired',()=>{closeModal();go('login');toast('Your session ended. Sign in again to continue.','error');});
const routeChange=()=>{const parsed=parseRoute();go(parsed.route,{detailId:parsed.detailId,history:false});};
window.addEventListener('hashchange',routeChange);window.addEventListener('popstate',routeChange);window.addEventListener('online',()=>{render();if(store.pendingLogout())store.init();else if(store.user)store.refresh().catch(()=>{});});window.addEventListener('offline',render);
const initialRoute=parseRoute();ctx.route=initialRoute.route;ctx.detailId=initialRoute.detailId;await store.init();render();
if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./sw.js').catch(()=>{});}

window.addEventListener('pageshow',event=>{if(event.persisted){closeModal();store.lock('loading');store.init();}});
