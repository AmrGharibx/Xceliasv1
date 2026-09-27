import { AcademyStore } from '../modules/store.mjs';
import { ACTIVITY_BY_ID } from '../modules/activity-catalog.mjs';
import { e } from '../modules/ui.mjs';
import { today } from '../modules/core.mjs';
import { ROLEPLAY_SCENARIOS, validateRoleplayLibrary } from './roleplay-library.mjs';
import { sequenceChoiceForOrder, sequenceOrderForChoice } from './live-sequence.mjs';
import { liveDebriefModel } from './live-debrief.mjs';
import { egyptianArabicFor } from '../modules/egyptian-arabic.mjs';
import { isParticipantHost, participantLink } from './participant-links.mjs';
import qrcode from '../vendor/qrcode-generator.mjs';
import { createQrDataUrl } from '../modules/qr-code.mjs';
validateRoleplayLibrary();

const store = new AcademyStore();
const app = document.getElementById('app');
const dialog = document.getElementById('trainer-dialog');
const toastRoot = document.getElementById('toast-root');
const participantHost = isParticipantHost(location.hostname);
const participantOrigin = globalThis.RED_ACADEMY_CLOUD?.participantOrigin || '';
const state = { assignments: [], library: [], facilitatorDeck: [], liveRooms: [], sessionPlans: [], sessionSkills: [], sessionPlanError: '', cohortPulse: null, pulseLoading: true, pulseError: '', pulseRequest: 0, loading: false, error: '', batchId: '', companyId: '', status: '', query: '' };
let refreshTimer = null;
let liveRoom = null;
let liveRoomTimer = null;
let liveRoomSyncTimer = null;
let sessionRun = null;
let sessionRunTimer = null;
let sessionPulseSetupOpen = false;
let roleplayState = null;
let roleplayTimer = null;
const LOCALE_STORAGE_KEY = 'red-academy-studio-locale';
const originalTextValues = new WeakMap();
const originalAttributeValues = new WeakMap();
const activityArabicPhrases = new Map();
const qrImageCache = new Map();
let interfaceLanguage = (() => {
  try { return localStorage.getItem(LOCALE_STORAGE_KEY) === 'ar-EG' ? 'ar-EG' : 'en'; }
  catch { return 'en'; }
})();

function localizedCopy(value) {
  if (interfaceLanguage !== 'ar-EG') return value;
  if (value === 'English') return value;
  const exact = activityArabicPhrases.get(value) || egyptianArabicFor(value);
  if (exact !== value) return exact;
  const insightScope = value.match(/^(.+?) · (.+?) · Learn from completed quizzes, then carry the best-fit mission into the next session\.$/);
  if (insightScope) {
    const scopePart = part => part === 'All batches' ? 'كل الدفعات' : part === 'All companies' ? 'كل الشركات' : part;
    return `${scopePart(insightScope[1])} · ${scopePart(insightScope[2])} · راجع نتائج التحدّيات المكتملة، وخلي الجلسة الجاية تركز على أهم احتياج للمجموعة.`;
  }
  const dynamicPatterns = [
    [/^ROUND (\d+) OF (\d+)$/i, 'الجولة $1 من $2'],
    [/^QUESTION (\d+)$/i, 'سؤال $1'],
    [/^CONTINUE ROUND (\d+)$/i, 'كمّل الجولة $1'],
    [/^WARM-UP · CARD (\d+) OF (\d+)$/i, 'تمهيد · كارت $1 من $2'],
    [/^ROUND (\d+)$/i, 'الجولة $1'],
    [/^RECALL CARD (\d+)$/i, 'كارت مراجعة $1'],
  ];
  for (const [pattern, replacement] of dynamicPatterns) {
    if (pattern.test(value)) return value.replace(pattern, replacement);
  }
  return value;
}

function registerActivityArabic(activity) {
  if (!activity || typeof activity !== 'object') return;
  const add = (english, arabic) => {
    if (typeof english === 'string' && english.trim() && typeof arabic === 'string' && arabic.trim()) {
      activityArabicPhrases.set(english, arabic);
    }
  };
  const metadata = activity.arabic || {};
  for (const key of ['title', 'category', 'description', 'instructions']) add(activity[key], metadata[key]);
  for (const [index, question] of (activity.questions || []).entries()) {
    const translation = question.arabic || metadata.questions?.[index] || {};
    for (const key of ['prompt', 'hint', 'explanation']) add(question[key], translation[key]);
    (question.options || []).forEach((option, optionIndex) => add(option, translation.options?.[optionIndex]));
  }
  for (const [index, card] of (activity.study_cards || []).entries()) {
    const translation = card.arabic || metadata.study_cards?.[index] || {};
    for (const key of ['front', 'back']) add(card[key], translation[key]);
  }
}

function localizeElement(element) {
  if (!(element instanceof Element) || element.closest('.locale-switch')) return;
  let originalAttributes = originalAttributeValues.get(element);
  if (!originalAttributes) {
    originalAttributes = new Map();
    originalAttributeValues.set(element, originalAttributes);
  }
  for (const name of ['placeholder', 'aria-label', 'title', 'alt']) {
    if (!element.hasAttribute(name)) continue;
    if (!originalAttributes.has(name)) originalAttributes.set(name, element.getAttribute(name));
    const original = originalAttributes.get(name);
    const translated = localizedCopy(original);
    if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
  }
}

function localizeTree(root = document.body) {
  if (!root) return;
  if (root instanceof Element) localizeElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('.locale-switch')) continue;
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'].includes(node.parentElement?.tagName)) continue;
    if (!originalTextValues.has(node)) originalTextValues.set(node, node.nodeValue || '');
    const original = originalTextValues.get(node);
    const trimmed = original.trim();
    if (!trimmed) continue;
    const translated = localizedCopy(trimmed);
    if (translated !== trimmed) {
      const start = original.indexOf(trimmed);
      node.nodeValue = `${original.slice(0, start)}${translated}${original.slice(start + trimmed.length)}`;
    } else if (interfaceLanguage === 'en' && node.nodeValue !== original) {
      node.nodeValue = original;
    }
  }
}

function setInterfaceLanguage(language) {
  interfaceLanguage = language === 'ar-EG' ? 'ar-EG' : 'en';
  try { localStorage.setItem(LOCALE_STORAGE_KEY, interfaceLanguage); } catch { /* keep this choice for the current page */ }
  document.documentElement.lang = interfaceLanguage;
  document.documentElement.dir = interfaceLanguage === 'ar-EG' ? 'rtl' : 'ltr';
  document.body.classList.toggle('locale-ar-eg', interfaceLanguage === 'ar-EG');
  localizeTree();
  document.querySelectorAll('[data-set-locale]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.setLocale === interfaceLanguage));
  });
  document.querySelectorAll('[data-draft-language]').forEach(label => { label.textContent = interfaceLanguage === 'ar-EG' ? 'المصري' : 'English'; });
}

function localeSwitch() {
  return `<div class="locale-switch" role="group" aria-label="Interface language"><button type="button" data-set-locale="en" aria-pressed="${interfaceLanguage === 'en'}">English</button><button type="button" data-set-locale="ar-EG" aria-pressed="${interfaceLanguage === 'ar-EG'}">مصري</button></div>`;
}

function ensureDialogLocaleSwitch() {
  if (!dialog?.open || dialog.querySelector('.locale-switch--dialog')) return;
  const group = document.createElement('div');
  group.className = 'locale-switch locale-switch--dialog';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', interfaceLanguage === 'ar-EG' ? 'لغة الواجهة' : 'Interface language');
  for (const [language, label] of [['en', 'English'], ['ar-EG', 'مصري']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.setLocale = language;
    button.setAttribute('aria-pressed', String(language === interfaceLanguage));
    button.textContent = label;
    group.append(button);
  }
  const header = dialog.querySelector('.dialog-head,.roleplay-header,.room-header,.session-run-top');
  (header || dialog).append(group);
}

const localeObserver = new MutationObserver(records => {
  for (const record of records) {
    for (const added of record.addedNodes) {
      if (added.nodeType === Node.ELEMENT_NODE) localizeTree(added);
      else if (added.nodeType === Node.TEXT_NODE) localizeTree(added.parentElement || document.body);
    }
    if (record.type === 'attributes') localizeElement(record.target);
  }
  ensureDialogLocaleSwitch();
});
localeObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt'] });
setInterfaceLanguage(interfaceLanguage);

function academyUrl(hash = '') {
  const url = new URL('../', location.href);
  url.hash = hash;
  return url.href;
}

function portalUrl(path = '') {
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const base = local ? `${location.protocol}//${location.hostname}:4000/` : `${location.origin}/`;
  return new URL(path, base).href;
}

function button(label, action, primary = false, attrs = '') {
  const keepHidden = action === 'academy-fallback' || action === 'legacy-library';
  const extraAttrs = [attrs, keepHidden ? 'hidden' : ''].filter(Boolean).join(' ');
  return `<button class="button button-flat ${primary ? 'button-primary' : ''}" data-action="${e(action)}" ${extraAttrs}>${e(label)}</button>`;
}

function showToast(message, isError = false) {
  toastRoot.innerHTML = `<div class="toast${isError ? ' error' : ''}" role="status">${e(message)}</div>`;
  window.setTimeout(() => { toastRoot.replaceChildren(); }, 4200);
}

function topbar() {
  const user = store.user;
  const account = user ? `<span class="sync-chip"><i class="sync-dot"></i>${store.connectionLost ? 'Reconnecting' : 'Shared workspace'}</span><span class="role-chip">${e(user.display_name || user.name || user.email || 'Staff')}</span><button class="quiet-link" data-action="logout" type="button">Sign out</button>` : `<a class="quiet-link" href="${e(academyUrl(''))}">Academy Operations</a>`;
  return `<header class="topbar"><a class="brand" href="${e(portalUrl())}" aria-label="Return to Xcelias portal"><img src="../training-academy-logo.svg" alt="Red Training Academy"><span class="brand-copy"><span>Trainer Activities Studio</span></span></a><div class="topbar-right">${account}${localeSwitch()}</div></header>`;
}

function loginScreen() {
  const unavailable = store.status === 'unavailable';
  return `${topbar()}<section class="login-wrap"><section class="login-card"><span class="eyebrow">PRIVATE TRAINER WORKSPACE</span><h1>${unavailable ? 'Workspace unavailable' : store.status === 'loading' ? 'Checking your access' : 'Sign in to continue'}</h1><p>${unavailable ? 'The secure Academy service could not be reached. Check your connection and try again.' : store.status === 'loading' ? 'Verifying your existing Academy session…' : 'Use your RED Academy staff account. This module uses the same secure sign-in as Academy Operations.'}</p>${store.error ? `<div class="error-box">${e(store.error)}</div>` : ''}${store.status === 'loading' ? '<div class="status-state"><p>Loading your private workspace…</p></div>' : `<form class="login-form" id="trainer-login"><label class="field"><span class="field-label">Work email</span><input name="email" type="email" autocomplete="username" required maxlength="254"></label><label class="field"><span class="field-label">Password</span><input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button class="button button-flat button-primary" type="submit">${unavailable ? 'Retry connection' : 'Sign in securely'}</button></form>`}<p class="role-view">No separate trainer account or trainee data store is created here.</p><a class="quiet-link" href="${e(academyUrl(''))}">Open Academy Operations</a></section></section>`;
}

function currentRoster(batchId = state.batchId, companyId = state.companyId) {
  return store.data.trainees.filter(trainee => trainee.batch_id === batchId && trainee.enrollment_status !== 'Stopped Attending' && (!companyId || trainee.company_id === companyId));
}

function companyName(companyId) {
  return store.data.companies.find(company => company.id === companyId)?.name || 'Company not recorded';
}

function classroomPulse() {
  const pulse=state.cohortPulse;
  const scope=[state.batchId?store.data.batches.find(batch=>batch.id===state.batchId)?.batch_name:'All batches',state.companyId?companyName(state.companyId):'All companies'].filter(Boolean).join(' · ');
  if(state.pulseLoading)return '';
  if(state.pulseError)return '<aside class="pulse-load-error" role="status"><span>Class insights are temporarily unavailable.</span><button class="micro-button" data-action="pulse-retry" type="button">Try again</button></aside>';
  if(!pulse||!pulse.submission_count)return '';
  let body='';
  if(state.pulseLoading)body='<div class="pulse-empty" role="status">Reading completed challenges for this class…</div>';
  else if(state.pulseError)body=`<div class="pulse-empty pulse-error" role="status"><span>${e(state.pulseError)}</span><button class="micro-button" data-action="pulse-retry" type="button">Try again</button></div>`;
  else if(!pulse||!pulse.submission_count)body='<div class="pulse-empty"><strong>Your next lesson gets smarter here.</strong><span>After learners finish an Academy Studio challenge, this space turns their private results into a small-sample-aware group practice plan. No names or individual answers appear here.</span></div>';
  else {
    const focusIds=new Set((pulse.focus||[]).map(row=>row.skill));
    const skills=(pulse.skills||[]).map(row=>{const trend=row.trend,delta=trend?.delta||0,arrow=trend?.direction==='up'?'↑':trend?.direction==='down'?'↓':'→';const trendText=trend?`<span class="pulse-trend trend-${e(trend.direction)}" aria-label="${delta>0?'+':''}${delta} percentage points across ${trend.learner_count} repeat learners; improved for ${trend.improved}, steady for ${trend.steady}, declined for ${trend.declined}">${arrow} ${delta>0?'+':''}${delta} pts since first try · ${trend.learner_count} repeat ${trend.learner_count===1?'learner':'learners'}</span>`:'';return `<div class="pulse-skill${focusIds.has(row.skill)?' is-focus':''}"><div class="pulse-skill-head"><strong>${e(row.label)}</strong><b>${row.accuracy}%</b></div><progress max="100" value="${row.accuracy}" aria-label="${e(row.label)} all-submission accuracy, ${row.accuracy} percent">${row.accuracy}%</progress><span>${row.correct} of ${row.attempted} responses correct overall · ${row.learner_count} ${row.learner_count===1?'learner':'learners'}</span>${trendText}</div>`;}).join('');
    const next=pulse.recommended_activity;
    const reviewAction=state.batchId?`<button class="micro-button pulse-review-plan" data-action="plan-spaced-review" data-activity="${e(next.id)}" data-focus="${e(pulse.focus?.[0]?.skill||'')}" type="button">Plan a spaced review</button>`:'<p class="pulse-review-scope">Choose one batch in the filters to add this review to its shared session calendar.</p>';
    const nextPanel=next?`<aside class="pulse-next"><span class="eyebrow">A GOOD NEXT CLASS MISSION</span><h3>${e(next.title)}</h3><p>${e(next.category)} · about ${e(next.duration_minutes)} minutes. It revisits the group’s clearest practice opportunity.</p><div class="pulse-next-actions"><button class="button button-flat button-primary" data-action="live-room" data-activity="${e(next.id)}" type="button">Run a live team round</button><button class="micro-button" data-action="new-assignment" data-activity="${e(next.id)}" type="button">Assign private practice</button>${reviewAction}</div></aside>`:'<aside class="pulse-next pulse-all-clear"><span class="eyebrow">READY FOR THE NEXT LEVEL</span><h3>No skill is currently flagged for follow-up.</h3><p>The completed challenges show no missed answers in this scope. Try a fresh scenario or raise the challenge level next session.</p></aside>';
    body=`<div class="pulse-meta"><strong>${pulse.learner_count}</strong> learners with completed results <i aria-hidden="true">·</i> <strong>${pulse.submission_count}</strong> completed ${pulse.submission_count===1?'challenge':'challenges'} <span>${e(pulse.signal_strength)}</span></div><div class="pulse-layout"><div class="pulse-skill-list">${skills||'<p class="pulse-empty">No skill-tagged results are available yet.</p>'}</div>${nextPanel}</div><p class="pulse-privacy-note">Group-level learning signals only · trends compare each repeat learner’s first and latest challenge on a skill · live-room scores and attendance are not included.</p>`;
  }
  return `<section class="classroom-pulse" id="classroom-pulse" aria-labelledby="pulse-title"><header class="pulse-heading"><div><span class="eyebrow">THE CLASSROOM COACHING LOOP</span><h2 id="pulse-title">What should this group practice next?</h2><p>${e(scope)} · Learn from completed quizzes, then carry the best-fit mission into the next session.</p></div><span class="pulse-mark" aria-hidden="true">↗</span></header>${body}</section>`;
}

function classroomPulsePath() {
  const params=new URLSearchParams();
  if(state.batchId)params.set('batch_id',state.batchId);
  if(state.companyId)params.set('company_id',state.companyId);
  const query=params.toString();
  return `activities/pulse${query?`?${query}`:''}`;
}

async function refreshClassroomPulse() {
  if(!store.user||store.status!=='ready'||!store.canWrite())return;
  const requestId=++state.pulseRequest;
  state.pulseLoading=true;state.pulseError='';
  const replace=()=>{
    const markup=classroomPulse();
    const panel=document.getElementById('classroom-pulse')||app.querySelector('.pulse-load-error');
    if(panel){panel.outerHTML=markup;return;}
    if(markup)app.querySelector('.metrics')?.insertAdjacentHTML('afterend',markup);
  };
  replace();
  try {
    const result=await store.api(classroomPulsePath());
    if(requestId===state.pulseRequest)state.cohortPulse=result.pulse||null;
  } catch(error) {
    if(requestId===state.pulseRequest){state.cohortPulse=null;state.pulseError=error.message||'Could not load the class learning pulse.';}
  } finally {
    if(requestId===state.pulseRequest){state.pulseLoading=false;replace();}
  }
}

function options(rows, value, getId, getLabel, emptyLabel) {
  return `${emptyLabel ? `<option value="">${e(emptyLabel)}</option>` : ''}${rows.map(row => `<option value="${e(getId(row))}" ${getId(row) === value ? 'selected' : ''}>${e(getLabel(row))}</option>`).join('')}`;
}

function sessionPlanCard(plan) {
  const steps=Array.isArray(plan.outline)?plan.outline:[];
  const complete=steps.filter(step=>step.done).length;
  const skill=state.sessionSkills.find(item=>item.id===plan.focus_skill)?.label||'Session focus';
  const statusClass=plan.status==='Completed'?'plan-completed':plan.status==='In Progress'?'plan-in-progress':'plan-planned';
  const date=new Date(`${plan.session_date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const stepMarkup=steps.map((step,index)=>`<article class="session-step ${step.done?'step-done':''}"><button class="session-step-toggle" type="button" data-action="session-step" data-plan="${e(plan.id)}" data-step="${e(step.id)}" data-completed="${step.done?'false':'true'}" aria-pressed="${step.done?'true':'false'}" aria-label="${step.done?'Reopen':'Complete'} ${e(step.title)}"><span class="session-step-check" aria-hidden="true">${step.done?'✓':index+1}</span><span class="session-step-copy"><small>${e(step.kind)} · ${e(step.duration_minutes)} min</small><strong>${e(step.title)}</strong></span></button><p>${e(step.prompt)}</p>${step.activity_id?`<button class="micro-button session-host-button" type="button" data-action="live-room" data-activity="${e(step.activity_id)}">Host this challenge</button>`:''}</article>`).join('');
  return `<article class="session-plan-card ${statusClass}"><header class="session-plan-head"><div><div class="session-plan-kicker"><span class="session-status">${e(plan.status)}</span><span>${e(date)} · ${e(plan.duration_minutes)} min</span></div><h3>${e(plan.title)}</h3><p>${e(plan.batch_name)} <span aria-hidden="true">·</span> ${e(plan.company_name||'All companies')} <span aria-hidden="true">·</span> ${e(skill)}</p></div><div class="session-plan-progress" role="img" aria-label="${complete} of ${steps.length} session steps complete"><strong>${complete}<small>/${steps.length}</small></strong><span>steps</span></div></header><div class="session-plan-meter" aria-hidden="true"><span style="width:${steps.length?Math.round(complete/steps.length*100):0}%"></span></div><div class="session-plan-steps">${stepMarkup}</div><footer class="session-plan-foot"><span>Shared board · updated ${e(new Date(plan.updated_at).toLocaleString())}</span><span>${e(plan.created_by||'Academy trainer')}</span></footer></article>`;
}

function sessionBoard() {
  if(!state.sessionPlanError&&!state.sessionPlans.length)return '';
  const query=state.query.trim().toLocaleLowerCase();
  const plans=state.sessionPlans.filter(plan=>{
    if(state.batchId&&plan.batch_id!==state.batchId)return false;
    if(state.companyId&&plan.company_id&&plan.company_id!==state.companyId)return false;
    const skill=state.sessionSkills.find(item=>item.id===plan.focus_skill)?.label||'';
    return !query||[plan.title,plan.batch_name,plan.company_name,skill].join(' ').toLocaleLowerCase().includes(query);
  }).sort((a,b)=>{
    const aDone=a.status==='Completed',bDone=b.status==='Completed';
    if(aDone!==bDone)return Number(aDone)-Number(bDone);
    const order=String(a.session_date).localeCompare(String(b.session_date));
    return aDone?-order:order;
  });
  const content=state.sessionPlanError
    ?`<div class="session-board-empty"><p>${e(state.sessionPlanError)}</p><button class="micro-button" type="button" data-action="plans-retry">Reconnect to shared session plans</button></div>`
    :plans.length?`<div class="session-plan-grid">${plans.slice(0,24).map(sessionPlanCard).join('')}</div>`
    :`<div class="session-board-empty"><span class="session-board-orbit" aria-hidden="true">✦</span><div><h3>${state.sessionPlans.length?'No session plans match these filters':'The next class can start here.'}</h3><p>${state.sessionPlans.length?'Clear the current batch, company, or search filters to see other plans.':'Build a four-part run-of-show: quick recall, a live team challenge, a coaching huddle, and one next-step exit ticket. Every trainer can pick up the shared board.'}</p></div>${!state.sessionPlans.length?`<button class="button button-flat button-primary" type="button" data-action="plan-session">Plan the first session</button>`:''}</div>`;
  return `<section class="session-board" id="session-board" aria-labelledby="session-board-title"><header class="session-board-head"><div><span class="eyebrow">THE CLASSROOM RUN OF SHOW</span><h2 id="session-board-title">Make every session feel intentional.</h2><p>Shared with the trainer team · progress saves as you go · attendance dates are unchanged</p></div><button class="button button-flat button-primary" type="button" data-action="plan-session">Plan a session</button></header>${content}</section>`;
}

function sessionRunDuration(step) {
  return Math.max(60,(Number(step?.duration_minutes)||1)*60);
}

function sessionRunTimeLabel(totalSeconds) {
  const seconds=Math.max(0,Math.floor(totalSeconds));
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}

function stopSessionRunTimer() {
  if(sessionRunTimer!==null)window.clearInterval(sessionRunTimer);
  sessionRunTimer=null;
}

function sessionRunPlan() {
  return sessionRun?state.sessionPlans.find(plan=>plan.id===sessionRun.planId)||null:null;
}

function updateSessionRunClock() {
  if(!sessionRun)return;
  const plan=sessionRunPlan();
  const step=plan?.outline?.[sessionRun.stepIndex];
  if(!step)return;
  if(sessionRun.running){
    sessionRun.remainingSeconds=Math.max(0,Math.ceil((sessionRun.endsAt-Date.now())/1000));
    if(sessionRun.remainingSeconds===0){sessionRun.running=false;sessionRun.endsAt=0;stopSessionRunTimer();}
  }
  const clock=document.getElementById('session-run-clock');
  if(clock){
    clock.textContent=sessionRunTimeLabel(sessionRun.remainingSeconds);
    clock.setAttribute('aria-label',`${sessionRunTimeLabel(sessionRun.remainingSeconds)} remaining`);
    clock.classList.toggle('is-urgent',sessionRun.remainingSeconds<=10);
  }
  const duration=sessionRunDuration(step);
  const timerButton=document.querySelector('[data-action="session-run-timer"]');
  if(timerButton)timerButton.textContent=sessionRun.running?'Pause timer':sessionRun.remainingSeconds===0?'Restart timer':sessionRun.remainingSeconds<duration?'Resume timer':'Start timer';
  const status=document.getElementById('session-run-timer-status');
  if(status)status.textContent=sessionRun.running?'Facilitator timer running. Shared progress saves when you mark a step complete.':sessionRun.remainingSeconds===0?'Time is up. No step was auto-completed; wrap the discussion in your own way.':'Facilitator-only timer. It does not change attendance or trainee records.';
}

function toggleSessionRunTimer() {
  if(!sessionRun)return;
  const step=sessionRunPlan()?.outline?.[sessionRun.stepIndex];
  if(!step)return;
  if(sessionRun.running){
    sessionRun.remainingSeconds=Math.max(0,Math.ceil((sessionRun.endsAt-Date.now())/1000));
    sessionRun.running=false;sessionRun.endsAt=0;stopSessionRunTimer();
  }else{
    if(sessionRun.remainingSeconds<=0)sessionRun.remainingSeconds=sessionRunDuration(step);
    sessionRun.running=true;sessionRun.endsAt=Date.now()+sessionRun.remainingSeconds*1000;
    stopSessionRunTimer();sessionRunTimer=window.setInterval(updateSessionRunClock,250);
  }
  updateSessionRunClock();
}

function resetSessionRunTimer() {
  if(!sessionRun)return;
  const step=sessionRunPlan()?.outline?.[sessionRun.stepIndex];
  if(!step)return;
  stopSessionRunTimer();sessionRun.running=false;sessionRun.endsAt=0;sessionRun.remainingSeconds=sessionRunDuration(step);
  updateSessionRunClock();
}

function selectSessionRunStep(index) {
  if(!sessionRun)return;
  const steps=sessionRunPlan()?.outline||[];
  if(index<0||index>=steps.length||index===sessionRun.stepIndex)return;
  stopSessionRunTimer();sessionRun.stepIndex=index;sessionRun.running=false;sessionRun.endsAt=0;sessionRun.remainingSeconds=sessionRunDuration(steps[index]);
  renderSessionRun();
}

function renderSessionRun() {
  const plan=sessionRunPlan();
  const steps=Array.isArray(plan?.outline)?plan.outline:[];
  if(!plan||!steps.length){sessionRun=null;stopSessionRunTimer();if(dialog.open)dialog.close();showToast('This session plan is no longer available. Refresh the shared board.',true);return;}
  sessionRun.stepIndex=Math.max(0,Math.min(sessionRun.stepIndex,steps.length-1));
  const step=steps[sessionRun.stepIndex];
  const total=steps.length;
  const completed=steps.filter(item=>item.done).length;
  const date=new Date(`${plan.session_date}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
  const rail=steps.map((item,index)=>`<button class="session-run-step${index===sessionRun.stepIndex?' is-current':''}${item.done?' is-complete':''}" type="button" data-action="session-run-step" data-index="${index}" aria-current="${index===sessionRun.stepIndex?'step':'false'}"><span class="session-run-step-number">${item.done?'✓':String(index+1).padStart(2,'0')}</span><span><small>${e(item.kind)} · ${e(item.duration_minutes)} min</small><strong>${e(item.title)}</strong></span></button>`).join('');
  const activityButton=step.activity_id?`<button class="button button-flat button-primary" type="button" data-action="live-room" data-activity="${e(step.activity_id)}">Host this challenge <span aria-hidden="true">↗</span></button>`:'';
  const pulseButton=`<button class="button session-pulse-launch" type="button" data-action="session-pulse">Run an anonymous class pulse <span aria-hidden="true">◉</span></button>`;
  const roleplayButton=step.id==='huddle'&&store.canWrite()?`<button class="button roleplay-launch" type="button" data-action="roleplay-open">Run a client role-play <span aria-hidden="true">✦</span></button>`:'';
  const completionLabel=step.done?'Reopen this step':'Mark step complete';
  dialog.classList.remove('live-room-dialog');
  dialog.classList.add('session-run-dialog');
  dialog.removeAttribute('aria-labelledby');
  dialog.setAttribute('aria-label',`Facilitation mode: ${plan.title}`);
  dialog.innerHTML=`<main class="session-facilitator" id="session-facilitator"><header class="session-run-top"><a class="session-run-brand" href="${e(portalUrl())}" aria-label="Return to Xcelias portal"><img src="../training-academy-logo.svg" alt=""><span><small>RED TRAINING ACADEMY</small><strong>Facilitation mode</strong></span></a><div class="session-run-context"><strong>${e(plan.title)}</strong><span>${e(plan.batch_name)} · ${e(plan.company_name||'All companies')} · ${e(date)}</span></div><div class="session-run-top-actions"><button class="micro-button" type="button" data-action="session-run-fullscreen">Fullscreen</button><button class="dialog-close" type="button" data-action="dialog-close" aria-label="Exit facilitation">×</button></div></header><div class="session-run-overview"><span>${completed===total?'SESSION COMPLETE':'YOUR CLASSROOM RUN OF SHOW'}</span><strong>${completed}<small> / ${total} steps complete</small></strong><progress class="session-run-overview-meter" aria-label="Session progress" max="${total}" value="${completed}"></progress></div><div class="session-run-workspace"><nav class="session-run-rail" aria-label="Session steps">${rail}</nav><section class="session-run-stage" tabindex="0" aria-label="Current session step"><div class="session-run-step-kicker"><span>STEP ${String(sessionRun.stepIndex+1).padStart(2,'0')} <i>/ ${String(total).padStart(2,'0')}</i></span><span>${e(step.kind)} · ${e(step.duration_minutes)} MIN</span></div><div class="session-run-stage-copy"><span class="session-run-focus">${e(state.sessionSkills.find(item=>item.id===plan.focus_skill)?.label||'SESSION FOCUS')}</span><h1>${e(step.title)}</h1><p>${e(step.prompt)}</p></div><section class="session-run-timer-card" aria-label="Step timer"><div class="session-run-clock" id="session-run-clock" role="timer" aria-live="off">${sessionRunTimeLabel(sessionRun.remainingSeconds)}</div><div class="session-run-timer-copy"><strong>Give this moment its space.</strong><p id="session-run-timer-status">Facilitator-only timer. It does not change attendance or trainee records.</p><div class="session-run-timer-actions"><button class="micro-button" type="button" data-action="session-run-timer">Start timer</button><button class="micro-button" type="button" data-action="session-run-reset">Reset</button></div></div></section><div class="session-run-challenge">${activityButton}${roleplayButton}${pulseButton}</div></section></div><footer class="session-run-footer"><button class="button" type="button" data-action="session-run-previous" ${sessionRun.stepIndex===0?'disabled':''}>← Previous step</button><div class="session-run-footer-center"><button class="button button-flat ${step.done?'':'button-primary'}" type="button" data-action="session-run-complete">${e(completionLabel)}</button><span>Arrow keys change steps · Space starts or pauses the timer</span></div><button class="button" type="button" data-action="session-run-next" ${sessionRun.stepIndex===total-1?'disabled':''}>Next step →</button></footer><span class="session-run-sr-only" aria-live="polite">${completed===total?'All session steps are complete.':`${completed} of ${total} steps are complete.`}</span></main>`;
  if(!dialog.open)dialog.showModal();
  dialog.querySelector('.session-run-stage')?.focus({preventScroll:true});
  updateSessionRunClock();
}

function startSessionRun(planId) {
  const plan=state.sessionPlans.find(item=>item.id===planId);
  const steps=Array.isArray(plan?.outline)?plan.outline:[];
  if(!plan||!steps.length){showToast('This session has no run-of-show steps. Refresh the shared board.',true);return;}
  stopSessionRunTimer();
  const incomplete=steps.findIndex(step=>!step.done);
  const stepIndex=incomplete<0?0:incomplete;
  sessionRun={planId,stepIndex,remainingSeconds:sessionRunDuration(steps[stepIndex]),endsAt:0,running:false};
  renderSessionRun();
}

function roleplayScenarios(role=roleplayState){return role?.customScenario?[...ROLEPLAY_SCENARIOS,role.customScenario]:ROLEPLAY_SCENARIOS;}
function roleplayScenario(scenarioId,role=roleplayState){return roleplayScenarios(role).find(item=>item.id===scenarioId)||null;}
function roleplayAIDraftForm(){
  const fallback=[['discovery','Client discovery'],['qualification','Client qualification'],['accuracy','Product accuracy'],['objections','Objection handling'],['ethics','Ethical judgment'],['followthrough','Follow-through'],['viewing','Viewing conversations'],['teamwork','Team handoffs']];
  const skills=state.sessionSkills.length?state.sessionSkills:fallback;
  const selectedSkill=roleplayState?.aiDraftSkill||skills[0]?.id;
  return `<details class="roleplay-ai-planner" ${roleplayState?.customScenario?'open':''}><summary>✦ Draft a lesson-specific role-play <span>AI co-planner · <b data-draft-language>${interfaceLanguage==='ar-EG'?'المصري':'English'}</b></span></summary><div class="roleplay-ai-planner-body"><p>Only the selected skill and your lesson notes are sent. Keep trainee names, client details, scores, and confidential records out of the notes. This spoken practice is temporary and never records trainee performance.</p><label class="field"><span>Learning focus</span><select id="roleplay-ai-focus">${skills.map(item=>`<option value="${e(item.id)}" ${item.id===selectedSkill?'selected':''}>${e(item.label)}</option>`).join('')}</select></label><label class="field"><span>Lesson brief <small>(optional · max 1,600 characters)</small></span><textarea id="roleplay-ai-notes" maxlength="1600" rows="3" placeholder="What client-care move or conversation would be useful to practise today?">${e(roleplayState?.aiDraftNotes||'')}</textarea></label><label class="roleplay-ai-consent"><input id="roleplay-ai-consent" type="checkbox"><span>I consent to send these notes to the configured AI provider for a temporary, unsaved practice draft.</span></label><div class="roleplay-ai-action-row"><button class="micro-button" type="button" data-action="roleplay-ai-draft" ${store.aiPolishEnabled?'':'disabled'}>${roleplayState?.customScenario?'Draft another scene':'Draft practice scene'}</button><span id="roleplay-ai-status" role="status">${e(roleplayState?.aiDraftStatus|| (store.aiPolishEnabled?'Review the scenario and coaching lens before using it. Nothing is saved.':'AI is not configured; the ready-made role-plays remain available.'))}</span></div></div></details>`;
}

function openRoleplayLab() {
  if(!store.canWrite()){showToast('Role-play Lab is for trainers.',true);return;}
  stopRoleplayTimer();
  const returnToSession=!!(dialog.open&&sessionRun&&dialog.classList.contains('session-run-dialog'));
  if(returnToSession&&sessionRun.running){sessionRun.remainingSeconds=Math.max(0,Math.ceil((sessionRun.endsAt-Date.now())/1000));sessionRun.running=false;sessionRun.endsAt=0;stopSessionRunTimer();}
  const skill=sessionRunPlan()?.focus_skill;
  const preferred={discovery:'six-week-move',qualification:'budget-tradeoffs',objections:'price-objection',accuracy:'investment-evidence',ethics:'permission-to-share',viewing:'quiet-viewing',followthrough:'missed-callback',teamwork:'clean-handoff'}[skill];
  roleplayState={returnToSession,scenarioId:ROLEPLAY_SCENARIOS.find(item=>item.id===preferred)?.id||ROLEPLAY_SCENARIOS[0].id,stage:'setup',format:'coach',turnIndex:0,duration:45,seconds:45,endsAt:0,running:false,revealed:false,rep:1,observed:new Set(),customScenario:null,aiDraftSkill:'',aiDraftNotes:'',aiDraftStatus:''};
  renderRoleplayLab();
}

function stopRoleplayTimer(){if(roleplayTimer)clearInterval(roleplayTimer);roleplayTimer=null;}

function renderRoleplayLab(){
  const role=roleplayState,scenes=roleplayScenarios(role),scenario=roleplayScenario(role?.scenarioId,role);
  if(!role||!scenario)return;
  const inSession=role.returnToSession;
  const header=`<header class="roleplay-header"><div class="roleplay-brand"><span class="roleplay-brand-orbit" aria-hidden="true">✦</span><span><small>ACADEMY STUDIO · CLASSROOM PRACTICE</small><strong>Role-play Lab</strong></span></div><div class="roleplay-header-actions"><span class="roleplay-live-badge"><i aria-hidden="true"></i> UNSCORED PRACTICE</span><button class="micro-button" type="button" data-action="roleplay-exit">${inSession?'Back to session':'Close lab'}</button></div></header>`;
  let body='';
  if(role.stage==='setup'){
    const cards=scenes.map(item=>`<button class="roleplay-scenario-choice ${item.id===scenario.id?'is-selected':''}" type="button" data-action="roleplay-select" data-scenario="${e(item.id)}" aria-pressed="${item.id===scenario.id}"><span class="roleplay-scenario-level">${e(item.level)} · ${e(item.skill)}${item.id==='ai-draft'?' · TEMPORARY AI DRAFT':''}</span><strong>${e(item.title)}</strong><span>${e(item.setup)}</span></button>`).join('');
    body=`<main class="roleplay-setup"><div class="roleplay-hero-copy"><span class="eyebrow">SAY IT · HEAR IT · COACH IT</span><h1>Practise the conversation, not just the answer.</h1><p>Choose a trainer-led rep or let two partners practise together. Reveal one client line at a time, then open the coaching lens as a group.</p></div><div class="roleplay-privacy-note"><span aria-hidden="true">◉</span><div><strong>Real classroom reps. No learner data saved.</strong><small>This is spoken practice: no microphone, transcript, names, grade, attendance, assessment or XP is recorded. Coach moves are temporary group celebration only.</small></div></div>${roleplayAIDraftForm()}<section class="roleplay-format-picker" role="group" aria-label="Practice format"><span>HOW WILL THE CLASS PRACTISE?</span><div><button class="roleplay-format-choice ${role.format==='coach'?'is-selected':''}" type="button" data-action="roleplay-format" data-format="coach" aria-pressed="${role.format==='coach'}"><strong>Trainer + trainee</strong><small>You read the client; one trainee practises advising.</small></button><button class="roleplay-format-choice ${role.format==='pair'?'is-selected':''}" type="button" data-action="roleplay-format" data-format="pair" aria-pressed="${role.format==='pair'}"><strong>Pair practice</strong><small>Partners take opposite roles, then swap on replay.</small></button></div></section><div class="roleplay-setup-head"><div><span class="eyebrow">CHOOSE A CLIENT MOMENT</span><h2>${scenes.length} ready-to-run scenes</h2><button class="roleplay-surprise" type="button" data-action="roleplay-random">Surprise me <span aria-hidden="true">↗</span></button></div><label class="roleplay-time-select">Response time<select id="roleplay-duration"><option value="30" ${role.duration===30?'selected':''}>30 sec · lightning</option><option value="45" ${role.duration===45?'selected':''}>45 sec · focused</option><option value="60" ${role.duration===60?'selected':''}>60 sec · thoughtful</option><option value="90" ${role.duration===90?'selected':''}>90 sec · deep practice</option></select></label></div><div class="roleplay-scenario-grid">${cards}</div><section class="roleplay-selected-preview"><span class="eyebrow">SELECTED SCENE</span><h3>${e(scenario.title)}</h3><p>${e(scenario.setup)}</p><div class="roleplay-preview-line"><span>CLIENT OPENS WITH</span><strong>“${e(scenario.turns[0].clientLine)}”</strong></div><button class="button button-flat button-primary" type="button" data-action="roleplay-start">Start this role-play <span aria-hidden="true">→</span></button></section></main>`;
  }else{
    const turn=scenario.turns[role.turnIndex],last=role.turnIndex===scenario.turns.length-1;
    const remaining=Math.max(0,role.seconds);
    const timerText=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
    const celebration=role.observed.size===scenario.lookFors.length?`<div class="roleplay-complete" role="status"><span aria-hidden="true">✦</span><div><strong>Full house — every coaching move spotted.</strong><small>Beautiful observation. Which phrase will the class carry into its next real conversation?</small></div><span class="roleplay-complete-tag">ALL ${scenario.lookFors.length}</span></div>`:'';
    const coach=role.revealed?`<section class="roleplay-coach-lens">
      <div class="roleplay-coach-heading"><div><span class="eyebrow">THE COACHING LENS · NOT A SCRIPT TO MEMORIZE</span><h2>Notice the move. Honour the person.</h2></div><span class="roleplay-coins">✦ ${role.observed.size} / ${scenario.lookFors.length} moves spotted</span></div>
      <p class="roleplay-coach-principle">There is no single perfect sentence. Give credit to the behaviour: curiosity, accuracy, consent, clear ownership and client choice.</p>
      <div class="roleplay-listen-fors">${scenario.lookFors.map(item=>`<button class="roleplay-listen-for ${role.observed.has(item.id)?'is-spotted':''}" type="button" data-action="roleplay-mark-move" data-move="${e(item.id)}" aria-pressed="${role.observed.has(item.id)}"><span aria-hidden="true">${role.observed.has(item.id)?'✦':'○'}</span><strong>${e(item.label)}</strong><small>${role.observed.has(item.id)?'SPOTTED IN THE ROOM':'Tap when the class names this move'}</small></button>`).join('')}</div>
      ${celebration}
      <div class="roleplay-coach-columns"><article><span>ONE POSSIBLE LINE</span><p>“${e(scenario.model)}”</p></article><article class="roleplay-watchout"><span>GENTLE WATCH-OUT</span><p>${e(scenario.avoid)}</p></article></div>
      <div class="roleplay-debrief"><span>ASK THE ROOM</span><strong>${e(scenario.debrief)}</strong></div>
      <div class="roleplay-coach-actions"><button class="button" type="button" data-action="roleplay-retry">Try the scene again</button><button class="button button-flat button-primary" type="button" data-action="roleplay-next-scenario">Run another scene <span aria-hidden="true">→</span></button></div>
    </section>`:'';
    const roleAssignment=role.format==='pair'?(role.rep%2===1?'Partner A advises while Partner B plays the client. The replay swaps their roles.':'Partner B advises while Partner A plays the client. The replay swaps their roles.'):'Trainer reads each client line; one trainee responds as the advisor.';
    body=`<main class="roleplay-live"><div class="roleplay-live-heading"><div><span class="eyebrow">${e(scenario.skill)} · REP ${role.rep} · TURN ${role.turnIndex+1} OF ${scenario.turns.length}</span><h1>${e(scenario.title)}</h1><p>${roleAssignment}</p></div><div class="roleplay-turn-progress" aria-label="Conversation progress">${scenario.turns.map((_,index)=>`<i class="${index<=role.turnIndex?'is-past':''} ${index===role.turnIndex?'is-current':''}"></i>`).join('')}</div></div><details class="roleplay-trainer-brief"><summary>TRAINER-ONLY CLIENT BRIEF <span>Keep this hidden until the trainee needs a clue</span></summary><p>${e(scenario.trainerBrief)}</p></details><section class="roleplay-client-stage"><div class="roleplay-client-kicker"><span class="roleplay-client-avatar" aria-hidden="true">C</span><span><small>CLIENT SAYS</small><strong>Listen for the need beneath the words</strong></span><span class="roleplay-emotion">${e(scenario.level==='Challenge'?'Trust moment':'Real conversation')}</span></div><blockquote>“${e(turn.clientLine)}”</blockquote><p class="roleplay-speak-prompt">Your turn: answer naturally, as if this were a real client conversation.</p><details class="roleplay-trainer-cue"><summary>Trainer note · keep private during the rep</summary><p>${e(turn.coachCue)}</p></details></section><section class="roleplay-timer-panel"><div class="roleplay-clock ${remaining<=5&&role.running?'is-urgent':''}" id="roleplay-clock" role="timer" aria-live="off">${timerText}</div><div><strong>${role.running?'Let the trainee finish their thought.':remaining===0?'Time — invite the response.':role.seconds===role.duration?'Give the answer room to breathe.':'Clock paused; continue when ready.'}</strong><small>Use this as a gentle timebox, never a speed score.</small></div><div class="roleplay-timer-actions"><button class="micro-button" type="button" data-action="roleplay-timer">${role.running?'Pause timer':role.seconds<role.duration&&role.seconds>0?'Resume timer':role.seconds===0?'Reset & start':'Start '+role.duration+' sec'}</button><button class="micro-button" type="button" data-action="roleplay-reset-timer">Reset</button></div></section>${coach}<div class="roleplay-live-actions">${role.revealed?'':last?'<button class="button button-flat button-primary" type="button" data-action="roleplay-reveal-coach">Open coach lens <span aria-hidden="true">✦</span></button>':'<button class="button button-flat button-primary" type="button" data-action="roleplay-next-turn">Reveal the client’s next line <span aria-hidden="true">→</span></button>'}</div><footer class="roleplay-practice-foot"><span>Practice-only · ungraded · nothing is saved to trainee records.</span><button class="quiet-link" type="button" data-action="roleplay-setup">Choose another scene</button></footer></main>`;
  }
  dialog.classList.remove('live-room-dialog','session-run-dialog');dialog.classList.add('roleplay-dialog');dialog.removeAttribute('aria-labelledby');dialog.setAttribute('aria-label','Trainer Activities Studio role-play lab');
  dialog.innerHTML=`<section class="roleplay-shell">${header}${body}</section>`;
  if(role.stage==='setup'&&role.customScenario&&role.scenarioId==='ai-draft'){const marker=document.createElement('p');marker.className='roleplay-temporary-draft';marker.textContent=`AI CO-DRAFT · ${role.customScenario.content_language==='ar-EG'?'EGYPTIAN ARABIC':'ENGLISH'} · TEMPORARY AND UNSAVED · Review every detail before using this scene.`;dialog.querySelector('.roleplay-selected-preview')?.prepend(marker);}
  if(!dialog.open)dialog.showModal();
  if(role.stage==='play'&&role.running)updateRoleplayClock();
}

async function draftRoleplayScenarioWithAI(buttonEl){
  const status=document.getElementById('roleplay-ai-status'),consent=document.getElementById('roleplay-ai-consent'),focus=document.getElementById('roleplay-ai-focus'),notes=document.getElementById('roleplay-ai-notes');
  if(!status||!focus||!notes)return;
  if(!consent?.checked){status.textContent='Check the consent box before sending lesson notes to AI.';return;}
  roleplayState.aiDraftSkill=focus.value;roleplayState.aiDraftNotes=notes.value;
  const label=buttonEl.textContent;buttonEl.disabled=true;status.textContent='Drafting three client turns and a private coaching lens. No trainee data is sent or saved.';
  try{
    const result=await store.api('ai','POST',{kind:'draft-roleplay-scenario',consent:true,focus_skill:focus.value,lesson_notes:notes.value,language:interfaceLanguage});
    const scenario=result.scenario;
    if(!scenario||scenario.id!=='ai-draft'||!Array.isArray(scenario.turns)||scenario.turns.length!==3||!Array.isArray(scenario.lookFors)||scenario.lookFors.length!==3)throw new Error('The role-play draft could not be loaded safely. Your ready-made scenes are unchanged.');
    roleplayState.customScenario=scenario;roleplayState.scenarioId=scenario.id;roleplayState.stage='setup';roleplayState.turnIndex=0;roleplayState.revealed=false;roleplayState.rep=1;roleplayState.observed=new Set();roleplayState.aiDraftStatus='Draft ready. Review the client brief, all three turns, coaching moves, example, and watch-out. It is temporary until you close the lab.';
    renderRoleplayLab();
  }catch(error){status.textContent=error.message||'Could not draft this scene. The ready-made library and current practice are unchanged.';}
  finally{if(buttonEl.isConnected){buttonEl.disabled=!store.aiPolishEnabled;buttonEl.textContent=label;}}
}

function startRoleplay(){
  if(!roleplayState)return;
  const selectedDuration=Number(document.getElementById('roleplay-duration')?.value);
  if([30,45,60,90].includes(selectedDuration))roleplayState.duration=selectedDuration;
  stopRoleplayTimer();roleplayState.stage='play';roleplayState.turnIndex=0;roleplayState.seconds=roleplayState.duration;roleplayState.endsAt=0;roleplayState.running=false;roleplayState.revealed=false;roleplayState.observed=new Set();renderRoleplayLab();
}

function selectRoleplayScenario(scenarioId){
  if(!roleplayState||!roleplayScenarios(roleplayState).some(item=>item.id===scenarioId))return;
  roleplayState.scenarioId=scenarioId;roleplayState.rep=1;roleplayState.turnIndex=0;roleplayState.observed=new Set();renderRoleplayLab();
}

function chooseRandomRoleplayScenario(){
  if(!roleplayState)return;
  const scenes=roleplayScenarios(roleplayState),choices=scenes.filter(item=>item.id!==roleplayState.scenarioId);
  const next=choices[Math.floor(Math.random()*choices.length)]||scenes[0];
  selectRoleplayScenario(next.id);
}

function openRoleplaySetup(){
  if(!roleplayState)return;
  stopRoleplayTimer();roleplayState.stage='setup';roleplayState.running=false;roleplayState.endsAt=0;roleplayState.seconds=roleplayState.duration;roleplayState.rep=1;roleplayState.turnIndex=0;roleplayState.revealed=false;roleplayState.observed=new Set();renderRoleplayLab();
}

function updateRoleplayClock(){
  if(!roleplayState?.running)return;
  roleplayState.seconds=Math.max(0,Math.ceil((roleplayState.endsAt-Date.now())/1000));
  const clock=document.getElementById('roleplay-clock');if(clock){clock.textContent=`${String(Math.floor(roleplayState.seconds/60)).padStart(2,'0')}:${String(roleplayState.seconds%60).padStart(2,'0')}`;clock.classList.toggle('is-urgent',roleplayState.seconds<=5);}
  if(roleplayState.seconds===0){roleplayState.running=false;roleplayState.endsAt=0;stopRoleplayTimer();renderRoleplayLab();}
}

function toggleRoleplayTimer(){
  const role=roleplayState;if(!role||role.stage!=='play')return;
  if(role.running){role.seconds=Math.max(0,Math.ceil((role.endsAt-Date.now())/1000));role.running=false;role.endsAt=0;stopRoleplayTimer();}
  else{if(role.seconds<=0)role.seconds=role.duration;role.running=true;role.endsAt=Date.now()+role.seconds*1000;stopRoleplayTimer();roleplayTimer=window.setInterval(updateRoleplayClock,250);}
  renderRoleplayLab();
}

function resetRoleplayTimer(){
  if(!roleplayState)return;stopRoleplayTimer();roleplayState.running=false;roleplayState.endsAt=0;roleplayState.seconds=roleplayState.duration;renderRoleplayLab();
}

function advanceRoleplayTurn(){
  const role=roleplayState,scenario=roleplayScenario(role?.scenarioId,role);if(!role||!scenario)return;
  stopRoleplayTimer();role.running=false;role.endsAt=0;role.seconds=role.duration;
  if(role.turnIndex<scenario.turns.length-1)role.turnIndex++;
  else role.revealed=true;
  renderRoleplayLab();
}

function retryRoleplay(){
  if(!roleplayState)return;roleplayState.rep++;roleplayState.turnIndex=0;roleplayState.revealed=false;roleplayState.observed=new Set();resetRoleplayTimer();
}

function leaveRoleplay(){
  if(!roleplayState)return;const returnToSession=roleplayState.returnToSession;stopRoleplayTimer();roleplayState=null;
  if(returnToSession&&sessionRun){renderSessionRun();return;}
  dialog.classList.remove('roleplay-dialog');if(dialog.open)dialog.close();
}

async function completeSessionRunStep() {
  const plan=sessionRunPlan();
  const step=plan?.outline?.[sessionRun?.stepIndex];
  if(!plan||!step)throw new Error('This session step is no longer available. Refresh the shared board and try again.');
  try{
    const result=await store.api('activities/session-plans/step','PATCH',{id:plan.id,expected_version:plan.version,step_id:step.id,completed:!step.done});
    if(result.record)state.sessionPlans=state.sessionPlans.map(item=>item.id===plan.id?result.record:item);
    await refreshAssignments();
    if(sessionRun){renderSessionRun();showToast(step.done?'Session step reopened on the shared trainer board.':'Session step saved for the trainer team.');}
  }catch(error){
    await refreshAssignments();
    if(sessionRun)renderSessionRun();
    throw error;
  }
}

function filteredAssignments() {
  const query = state.query.trim().toLocaleLowerCase();
  return state.assignments.filter(assignment => {
    if (state.batchId && assignment.batch_id !== state.batchId) return false;
    if (state.companyId && !(assignment.participants || []).some(person => person.company_id === state.companyId)) return false;
    if (state.status && assignment.status !== state.status) return false;
    return !query || [assignment.title, assignment.batch_name, assignment.instructions, ...(assignment.participants || []).map(person => person.trainee_name)].join(' ').toLocaleLowerCase().includes(query);
  });
}

function assignmentCard(assignment) {
  const participants = assignment.participants || [];
  const visible = participants.filter(person => !state.companyId || person.company_id === state.companyId);
  const complete = visible.filter(person => person.status === 'Completed').length;
  const started = visible.filter(person => person.status === 'In Progress').length;
  const studio = state.library.find(activity => activity.id === assignment.activity_id)||assignment.studio_activity;
  const fallback = ACTIVITY_BY_ID.get(assignment.activity_id);
  const rows = visible.map(person => {
    const quizResult = studio && person.learner_submitted_at;
    const details = quizResult ? `${person.correct_count ?? '—'} / ${studio.question_count} correct · ${person.earned_xp || 0} XP` : studio ? (person.status === 'In Progress' ? 'Playing now' : 'Waiting to start') : e(person.trainer_feedback || '—');
    return `<tr><td><span class="person-name">${e(person.trainee_name)}</span><span class="person-company">${e(person.company_name || companyName(person.company_id))}</span></td><td><span class="progress-pill ${person.status === 'Completed' ? 'completed' : person.status === 'In Progress' ? 'in-progress' : ''}">${e(person.status)}</span></td><td>${person.score === null ? '—' : `${Number(person.score).toFixed(0)}%`}</td><td>${details}</td><td>${!studio && store.canWrite() && assignment.status === 'Open' ? `<button class="micro-button" data-action="edit-progress" data-assignment="${e(assignment.id)}" data-trainee="${e(person.trainee_id)}">Coach / update</button>` : ''}</td></tr>`;
  }).join('');
  const actions = `${studio && store.canWrite() && assignment.status === 'Open' ? `<button class="micro-button" data-action="share-links" data-assignment="${e(assignment.id)}">Create learner links</button>` : ''}${assignment.status === 'Open' && store.canWrite() ? `<button class="micro-button" data-action="close-assignment" data-assignment="${e(assignment.id)}">Close assignment</button>` : ''}`;
  const category = studio ? `${studio.category} · ${studio.level} · ${studio.duration_minutes} min` : fallback?.title || assignment.activity_id;
  return `<article class="assignment-card"><div class="assignment-head"><div><div class="assignment-title-row"><h3 class="assignment-title">${e(assignment.title)}</h3><span class="status ${assignment.status === 'Open' ? 'status-open' : 'status-closed'}">${e(assignment.status)}</span>${studio ? '<span class="studio-chip">ACADEMY STUDIO</span>' : '<span class="studio-chip fallback-chip">FALLBACK ACTIVITY</span>'}</div><div class="assignment-meta">${e(assignment.batch_name)} <span aria-hidden="true">·</span> ${e(category)} <span aria-hidden="true">·</span> Assigned by <b>${e(assignment.created_by)}</b></div></div><div class="assignment-actions">${actions}</div></div>${assignment.instructions ? `<p class="instructions">${e(assignment.instructions)}</p>` : ''}<div class="assignment-stats"><span><strong>${visible.length}</strong> trainees</span><span><strong>${started}</strong> in progress</span><span><strong>${complete}</strong> completed</span>${studio ? `<span><strong>${visible.reduce((sum,person)=>sum+(Number(person.earned_xp)||0),0)}</strong> XP earned</span>` : ''}<span>${assignment.due_date ? `Due <strong>${e(assignment.due_date)}</strong>` : 'No due date'}</span></div><div class="participant-wrap"><table class="participant-table"><thead><tr><th>Trainee / company</th><th>Progress</th><th>Score</th><th>${studio ? 'Quiz result / XP' : 'Trainer feedback'}</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5">No trainees match this company filter.</td></tr>'}</tbody></table></div></article>`;
}

function assignmentList() {
  const assignments = filteredAssignments();
  const target = document.getElementById('assignment-list');
  const count = document.getElementById('assignment-count');
  if (!target || !count) return;
  count.textContent = `${assignments.length} ${assignments.length === 1 ? 'assignment' : 'assignments'}`;
  if (state.loading && !state.assignments.length) {
    target.innerHTML = '<section class="status-state"><p>Loading your shared assignments…</p></section>';
  } else if (state.error && !state.assignments.length) {
    target.innerHTML = `<section class="status-state"><p>${e(state.error)}</p>${button('Try again', 'reload')}</section>`;
  } else if (!assignments.length) {
    target.innerHTML = `<section class="empty-state"><span class="empty-symbol" aria-hidden="true">✳</span><h3>${state.assignments.length ? 'No assignments match these filters' : 'Build a session people remember'}</h3><p>${state.assignments.length ? 'Adjust the filters above to widen the view.' : 'Launch a short, scenario-based quiz for a batch, give each trainee a private link, and watch scores and XP arrive in the shared workspace.'}</p>${store.canWrite() && !state.assignments.length ? button('Create your first challenge', 'new-assignment', true) : ''}</section>`;
  } else {
    target.innerHTML = assignments.map(assignmentCard).join('');
    addPracticeSignalControls(target, assignments);
  }
}

function addPracticeSignalControls(target, assignments) {
  const cards = target.querySelectorAll('.assignment-card');
  assignments.forEach((assignment, index) => {
    const card = cards[index];
    if (!card) return;
    if(assignment.studio_activity?.archived_at){const chip=document.createElement('span');chip.className='studio-chip archived-studio-chip';chip.textContent='ARCHIVED VERSION · EXISTING RESULTS KEPT';card.querySelector('.assignment-title-row')?.append(chip);}
    const people = (assignment.participants || []).filter(person => !state.companyId || person.company_id === state.companyId);
    const rows = card.querySelectorAll('.participant-table tbody tr');
    people.forEach((person, personIndex) => {
      const insight = person.learning_insight;
      const row = rows[personIndex];
      if (!row || !insight?.focus?.length) return;
      const focus = insight.focus.map(item => `${item.label} ${item.accuracy}%`).join(' · ');
      const signal = document.createElement('small');
      signal.className = 'practice-signal';
      signal.textContent = `Practice focus · ${focus} · ${insight.completed_challenges} completed ${insight.completed_challenges === 1 ? 'challenge' : 'challenges'}`;
      row.cells[3]?.append(signal);
      if (!store.canWrite() || !insight.suggested_activity) return;
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'micro-button practice-next-button';
      action.dataset.action = 'new-assignment';
      action.dataset.activity = insight.suggested_activity.id;
      action.dataset.trainee = person.trainee_id;
      action.textContent = `Assign ${insight.suggested_activity.title}`;
      action.setAttribute('aria-label', `Assign ${insight.suggested_activity.title} as targeted practice for ${person.trainee_name}`);
      row.cells[4]?.append(action);
    });
  });
}

function dashboard() {
  const all = state.assignments;
  const participants = all.flatMap(assignment => assignment.participants || []);
  const open = all.filter(assignment => assignment.status === 'Open').length;
  const assigned = participants.filter(person => person.status === 'Assigned' || person.status === 'In Progress').length;
  const completed = participants.filter(person => person.status === 'Completed').length;
  const scored = participants.filter(person => person.score !== null).length;
  const batches = store.data.batches.filter(batch => !batch.archived_at);
  const companies = store.data.companies.slice().sort((a, b) => a.name.localeCompare(b.name));
  const staffCanWrite = store.canWrite();
  return `${topbar()}<main class="shell"><section class="hero"><div><span class="eyebrow">PLAY · PRACTICE · LEVEL UP</span><h1>Turn today's lesson into a challenge.</h1><p>Launch a short Academy Studio quiz, send each trainee a private link, and watch participation, scores and XP update in the shared roster.</p></div><div class="hero-actions">${button('Academy fallback', 'academy-fallback')}${button('Original game library', 'legacy-library')}${staffCanWrite?button('Role-play Lab','roleplay-open'):''}${staffCanWrite ? button('Build a challenge', 'new-assignment', true) : ''}</div></section><section class="studio-shelf"><div class="shelf-heading"><div><span class="eyebrow">ACADEMY STUDIO · LIVE QUIZZES</span><h2>Choose the energy for today.</h2></div><span>${state.library.length} ready-to-run challenges</span></div><div class="quiz-shelf">${state.library.map((activity,index)=>`<article class="quiz-tile quiz-tile-${index+1}"><div class="quiz-tile-top"><span class="quiz-kicker">${e(activity.level)} · ${e(activity.duration_minutes)} MIN</span><span class="quiz-tile-symbol" aria-hidden="true">${['✦','◈','⚡'][index%3]}</span></div><h3>${e(activity.title)}</h3><p>${e(activity.description)}</p><div class="quiz-tile-foot"><span>${e(activity.category)}</span><span>${e(activity.question_count)} rounds · ${e(activity.xp_per_correct)} XP each</span></div></article>`).join('')||'<div class="quiz-shelf-loading">Loading Academy Studio challenges…</div>'}</div></section><section class="filters" aria-label="Filter assignments"><div class="field"><label for="filter-batch">Batch</label><select id="filter-batch"><option value="">All batches</option>${options(batches, state.batchId, row => row.id, row => row.batch_name)}</select></div><div class="field"><label for="filter-company">Company</label><select id="filter-company"><option value="">All companies</option>${options(companies, state.companyId, row => row.id, row => row.name)}</select></div><div class="field"><label for="filter-status">Assignment status</label><select id="filter-status"><option value="">All statuses</option><option value="Open" ${state.status === 'Open' ? 'selected' : ''}>Open</option><option value="Closed" ${state.status === 'Closed' ? 'selected' : ''}>Closed</option></select></div><div class="field search-field"><label for="filter-search">Search</label><span class="search-glyph" aria-hidden="true">⌕</span><input id="filter-search" type="search" value="${e(state.query)}" placeholder="Activity, batch or trainee…" autocomplete="off"></div><button class="button filter-reset" data-action="reset-filters">Reset filters</button></section><section class="metrics" aria-label="Activity summary"><article class="metric metric-red"><span class="metric-label">Live challenges</span><strong class="metric-value">${open}</strong><span class="metric-foot">Open assignments for trainees</span></article><article class="metric metric-blue"><span class="metric-label">Ready / playing</span><strong class="metric-value">${assigned}</strong><span class="metric-foot">Assigned or in progress</span></article><article class="metric metric-green"><span class="metric-label">Completed</span><strong class="metric-value">${completed}</strong><span class="metric-foot">Learner results saved to Academy</span></article><article class="metric metric-amber"><span class="metric-label">Scored attempts</span><strong class="metric-value">${scored}</strong><span class="metric-foot">Server-graded quiz submissions</span></article></section>${staffCanWrite?classroomPulse():''}<aside class="workspace-note"><span class="note-icon" aria-hidden="true">i</span><span><strong>Private trainee links. Shared live results.</strong> Each link is unique to one trainee and can submit once. Answer keys never leave the server; trainers see the saved score and earned XP as soon as a response is submitted. The original game library remains available as a fallback.</span></aside>${xpLadder()}<section><div class="section-head"><div><h2>Challenges in the classroom</h2><p>Assignments, live participation and results by trainee and company</p></div><span id="assignment-count" class="section-count"></span></div><div id="assignment-list"></div></section></main>`;
}

function xpLadder() {
  const totals = new Map();
  for (const assignment of state.assignments) {
    if (state.batchId && assignment.batch_id !== state.batchId) continue;
    for (const person of assignment.participants || []) {
      if (state.companyId && person.company_id !== state.companyId) continue;
      if(person.status!=='Completed')continue;
      const row=totals.get(person.trainee_id)||{id:person.trainee_id,name:person.trainee_name,company:person.company_name||companyName(person.company_id),xp:0,completed:0};row.xp+=Number(person.earned_xp)||0;row.completed++;totals.set(person.trainee_id,row);
    }
  }
  const leaders=[...totals.values()].sort((a,b)=>b.xp-a.xp||b.completed-a.completed||a.name.localeCompare(b.name)).slice(0,5);
  const scope=state.batchId?store.data.batches.find(batch=>batch.id===state.batchId)?.batch_name:'All batches';
  if(!leaders.length)return '';
  const levels=[{name:'First Step',min:0},{name:'Explorer',min:500},{name:'Navigator',min:1500},{name:'Mentor',min:3000},{name:'Legend',min:5000}];
  const rows=leaders.map((leader,index)=>{let levelIndex=levels.reduce((found,level,i)=>leader.xp>=level.min?i:found,0);const level=levels[levelIndex],next=levels[levelIndex+1],progress=next?Math.max(0,Math.min(100,Math.round((leader.xp-level.min)/(next.min-level.min)*100))):100,width=progress===0?0:Math.ceil(progress/10)*10;return `<div class="xp-ladder-row"><span class="xp-rank rank-${index+1}">${String(index+1).padStart(2,'0')}</span><div class="xp-person"><strong>${e(leader.name)}</strong><span>${e(leader.company)} · ${leader.completed} ${leader.completed===1?'challenge':'challenges'} complete</span><div class="xp-level-line"><span>LEVEL ${levelIndex+1} · ${e(level.name)}</span><span>${next?`${leader.xp-level.min} / ${next.min-level.min} XP to ${e(next.name)}`:'MAX LEVEL'}</span></div><div class="xp-meter xp-width-${width}" role="progressbar" aria-label="${e(level.name)} level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i></i></div></div><strong class="xp-total">${leader.xp.toLocaleString()} <small>XP</small></strong></div>`;}).join('');
  return `<section class="xp-ladder"><div class="xp-ladder-heading"><div><span class="eyebrow">THE CLASSROOM XP LADDER</span><h2>${e(scope||'Class standings')}</h2></div><span>Top five · ${state.companyId?e(companyName(state.companyId)):'all companies'} · levels reward steady practice</span></div><div class="xp-ladder-list">${rows}</div></section>`;
}

function addQuizTileActions() {
  if(!store.canWrite())return;
  app.querySelectorAll('.quiz-tile').forEach((tile, index) => {
    const activity = state.library[index];
    if (!activity) return;
    tile.dataset.activityId = activity.id;
    const actions = document.createElement('div');
    actions.className = 'quiz-tile-actions';
    if(activity.is_custom){const kicker=tile.querySelector('.quiz-kicker');if(kicker)kicker.textContent+=' · TRAINER-MADE';}
    for (const [label, action] of [['Assign to class', 'new-assignment'], ['Host live', 'live-room'],...(activity.is_custom?[['Archive challenge','custom-archive']]:[])]) {
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'micro-button';
      control.dataset.action = action;
      control.dataset.activity = activity.id;
      control.textContent = label;
      actions.append(control);
    }
    tile.append(actions);
  });
}

function addSessionRunLaunchers() {
  app.querySelectorAll('.session-plan-card').forEach(card=>{
    const step=card.querySelector('.session-step-toggle[data-plan]');
    const plan=state.sessionPlans.find(item=>item.id===step?.dataset.plan);
    const footer=card.querySelector('.session-plan-foot');
    if(!plan||!footer)return;
    const completed=(plan.outline||[]).filter(item=>item.done).length;
    const buttonEl=document.createElement('button');
    buttonEl.type='button';buttonEl.className='micro-button session-run-launch';buttonEl.dataset.action='session-run';buttonEl.dataset.plan=plan.id;
    buttonEl.setAttribute('aria-label',`${completed===(plan.outline||[]).length?'Review session':completed?'Resume session':'Facilitate session'}: ${plan.title}`);
    buttonEl.textContent=completed===(plan.outline||[]).length?'Review session':completed?'Resume session':'Facilitate session';
    footer.append(buttonEl);
    const questStep=(plan.outline||[]).find(item=>item.id==='quest'&&item.activity_id);
    const questToggle=card.querySelector('.session-step-toggle[data-step="quest"]');
    const questCard=questToggle?.closest('.session-step');
    const hostButton=questCard?.querySelector('.session-host-button');
    if(!questStep||!questCard||!hostButton)return;
    const actions=document.createElement('div');
    actions.className='session-step-actions';
    hostButton.before(actions);
    actions.append(hostButton);
    if(plan.linked_assignment_id){
      const assignment=state.assignments.find(item=>item.id===plan.linked_assignment_id);
      const participants=assignment?.participants||[];
      const completed=participants.filter(person=>person.learner_submitted_at).length;
      const quizButton=document.createElement('button');
      quizButton.type='button';quizButton.className='micro-button session-assign-button session-assignment-linked';
      quizButton.dataset.action='view-session-assignment';quizButton.dataset.assignment=plan.linked_assignment_id;
      quizButton.textContent=assignment?`View follow-up quiz · ${completed}/${participants.length} complete`:'Follow-up quiz assigned';
      quizButton.setAttribute('aria-label',`Open the shared follow-up quiz for ${plan.title}${assignment?`, ${completed} of ${participants.length} trainees complete`:''}`);
      actions.append(quizButton);
    }else if(plan.session_date<=today()){
      const quizButton=document.createElement('button');
      quizButton.type='button';quizButton.className='micro-button session-assign-button';
      quizButton.dataset.action='assign-session-quiz';quizButton.dataset.plan=plan.id;
      quizButton.textContent='Assign a private quiz';
      quizButton.setAttribute('aria-label',`Assign ${questStep.title} as a private quiz to ${plan.company_name||plan.batch_name}`);
      actions.append(quizButton);
    }else{
      const unlock=document.createElement('small');
      unlock.className='session-quiz-unlock';
      unlock.textContent=`Private quiz unlocks on ${new Date(`${plan.session_date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}.`;
      actions.append(unlock);
    }
  });
}

function assignSessionQuiz(planId) {
  const plan=state.sessionPlans.find(item=>item.id===planId);
  const questStep=(plan?.outline||[]).find(item=>item.id==='quest'&&item.activity_id);
  if(!plan||!questStep){showToast('This session has no linked challenge. Refresh the shared board.',true);return;}
  if(plan.session_date>today()){
    const date=new Date(`${plan.session_date}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    showToast(`Private quiz unlocks on ${date}.`,true);return;
  }
  const skill=state.sessionSkills.find(item=>item.id===plan.focus_skill)?.label||'the session focus';
  const dueDate=plan.session_date<today()?today():plan.session_date;
  const isSpacedReview=plan.title.startsWith('Spaced review ·');
  showAssignmentForm(questStep.activity_id,'',{
    batchId:plan.batch_id,companyId:plan.company_id||'',dueDate,
    instructions:`${isSpacedReview?'Spaced retrieval':'Session follow-up'} · ${skill}. Invite each trainee to recall the key move independently, then use the coaching review to decide what to practise next.`,
    sessionPlanId:plan.id,sessionTitle:plan.title,isSpacedReview,prepareLinks:true,
  });
}

function organizeDashboardExtras() {
  const privacyNote=app.querySelector('.workspace-note');
  if(privacyNote){
    const disclosure=document.createElement('details');
    disclosure.className='workspace-note-disclosure';
    const summary=document.createElement('summary');
    const icon=document.createElement('span');
    icon.className='note-icon';icon.setAttribute('aria-hidden','true');icon.textContent='i';
    const title=document.createElement('strong');title.textContent='Privacy & results';
    const hint=document.createElement('span');hint.textContent='Private links · answer keys stay on the server';
    summary.append(icon,title,hint);
    privacyNote.before(disclosure);
    disclosure.append(summary,privacyNote);
  }
  const xpLadder=app.querySelector('.xp-ladder');
  if(xpLadder){
    const disclosure=document.createElement('details');
    disclosure.className='xp-ladder-disclosure';
    const summary=document.createElement('summary');summary.textContent='Optional class XP standings';
    xpLadder.before(disclosure);
    disclosure.append(summary,xpLadder);
  }
}

function collapseOccasionalActions(actions) {
  const secondary=['roleplay-open','custom-new']
    .map(action=>actions.querySelector(`[data-action="${action}"]`))
    .filter(Boolean);
  if(!secondary.length)return;
  const disclosure=document.createElement('details');
  disclosure.className='hero-more-tools';
  const summary=document.createElement('summary');
  summary.className='button hero-more-tools-toggle';
  summary.textContent='More tools';
  const menu=document.createElement('div');
  menu.className='hero-more-tools-menu';
  menu.append(...secondary);
  disclosure.append(summary,menu);
  actions.append(disclosure);
}

function render() {
  if (!store.user || store.status !== 'ready') {
    app.innerHTML = `<main class="shell">${loginScreen()}</main>`;
    return;
  }
  app.innerHTML = dashboard();
  organizeDashboardExtras();
  addQuizTileActions();
  if(store.canWrite()){
    const anchor=app.querySelector('.classroom-pulse')||app.querySelector('.metrics');
    anchor?.insertAdjacentHTML('afterend',sessionBoard());
    addSessionRunLaunchers();
  }
  if (store.canWrite()) {
    const actions = app.querySelector('.hero-actions');
    if (actions) {
      const assignmentButton=actions.querySelector('[data-action="new-assignment"]');
      if(assignmentButton)assignmentButton.textContent='Assign a challenge';
      const planButton=document.createElement('button');
      planButton.type='button';planButton.className='button';planButton.dataset.action='plan-session';planButton.textContent='Plan a session';
      actions.insertBefore(planButton,assignmentButton||null);
      const customButton=document.createElement('button');customButton.type='button';customButton.className='button';customButton.dataset.action='custom-new';customButton.textContent='Create a challenge';actions.append(customButton);
      const host = document.createElement('button');
      host.type = 'button';
      host.className = 'button button-flat button-primary';
      host.dataset.action = 'live-room';
      host.textContent = 'Host a live room';
      actions.prepend(host);
      if (state.liveRooms.length) {
        const resume = document.createElement('button');
        resume.type = 'button';
        resume.className = 'button';
        resume.dataset.action = 'live-rooms';
        resume.textContent = `Resume live room${state.liveRooms.length > 1 ? ` · ${state.liveRooms.length}` : ''}`;
        actions.insertBefore(resume, host);
      }
      collapseOccasionalActions(actions);
    }
  }
  const heroCopy=app.querySelector('.hero p');if(heroCopy)heroCopy.textContent='Pick a ready-made challenge or build a lesson-specific one, then assign it privately or host it live.';
  assignmentList();
}

async function refreshAssignments() {
  if (!store.user || store.status !== 'ready' || state.loading) return;
  state.loading = true;
  state.error = '';
  assignmentList();
  try {
    const [result,library,live,plans] = await Promise.all([
      store.api('activities'),
      store.api('activities/library'),
      store.canWrite()?store.api('activities/live/active'):Promise.resolve({rooms:[]}),
      store.canWrite()?store.api('activities/session-plans').catch(error=>({plans:[],skills:[],error})):Promise.resolve({plans:[],skills:[]}),
    ]);
    state.assignments = result.assignments || [];
    state.library = library.activities || [];
    state.library.forEach(registerActivityArabic);
    // The facilitator deck includes answer keys and is cached separately from
    // the public library. Invalidate it whenever shared library data refreshes
    // so newly created/archived challenges stay in sync for live-room setup.
    state.facilitatorDeck = [];
    state.liveRooms = live.rooms || [];
    state.sessionPlans = plans.plans || [];
    state.sessionSkills = plans.skills || [];
    state.sessionPlanError = plans.error?.message || '';
  } catch (error) {
    state.liveRooms = [];
    state.error = error.message || 'Could not load activities.';
  } finally {
    state.loading = false;
    render();
    refreshClassroomPulse();
  }
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => refreshAssignments(), 250);
}

function openDialog(title, description, content) {
  if (dialog.open) {
    stopLiveRoomTimer();stopLiveRoomSync();liveRoom=null;stopSessionRunTimer();sessionRun=null;
    if(document.fullscreenElement===document.documentElement)document.exitFullscreen().catch(()=>{});
    dialog.close();
  }
  dialog.classList.remove('live-room-dialog');
  dialog.classList.remove('session-run-dialog');
  dialog.setAttribute('aria-labelledby','dialog-title');
  dialog.innerHTML = `<div class="dialog-head"><div><h2 id="dialog-title">${e(title)}</h2><p>${e(description)}</p></div><button class="dialog-close" data-action="dialog-close" aria-label="Close dialog" type="button">×</button></div><div class="dialog-body">${content}</div>`;
  if (!dialog.open) dialog.showModal();
}

const challengeSkills=[['discovery','Client discovery'],['qualification','Client qualification'],['accuracy','Product accuracy'],['objections','Objection handling'],['ethics','Ethical judgment'],['followthrough','Follow-through'],['viewing','Viewing conversations'],['teamwork','Team handoffs']];
function customQuestionMarkup(index){
 const choices=Array.from({length:4},(_,choice)=>`<label class="field"><span>Choice ${String.fromCharCode(65+choice)}</span><input name="option_${choice}" required maxlength="180" placeholder="Write a plausible response"></label>`).join('');
 const arabicChoices=Array.from({length:4},(_,choice)=>`<label class="field" dir="rtl"><span>الاختيار ${String.fromCharCode(65+choice)} بالمصري</span><input name="option_${choice}_ar" maxlength="180" dir="rtl" placeholder="اكتب اختيار مناسب بالمصري"></label>`).join('');
 const skills=challengeSkills.map(([id,label])=>`<option value="${id}" ${id==='discovery'?'selected':''}>${label}</option>`).join('');
 return `<fieldset class="custom-question-editor" data-custom-question><legend>ROUND ${index+1}</legend><div class="custom-question-head"><span>One decision, one clear best answer</span><button class="micro-button" type="button" data-action="custom-remove-question">Remove round</button></div><label class="field field-full"><span>Scenario or question</span><textarea name="prompt" required minlength="8" maxlength="500" rows="3" placeholder="Give the trainee a realistic moment to think through…"></textarea></label><div class="custom-choice-grid">${choices}</div><div class="custom-question-meta"><label class="field"><span>Best answer</span><select name="answer"><option value="0">A</option><option value="1" selected>B</option><option value="2">C</option><option value="3">D</option></select></label><label class="field"><span>Skill practiced</span><select name="skill">${skills}</select></label></div><label class="field field-full"><span>Optional coaching nudge</span><input name="hint" maxlength="280" placeholder="A small clue, not the answer"></label><label class="field field-full"><span>Coaching takeaway after reveal</span><textarea name="explanation" required minlength="12" maxlength="700" rows="2" placeholder="Explain why the best answer works, and what skill it demonstrates."></textarea></label><details class="arabic-edition field-full"><summary><strong>Egyptian Arabic edition</strong><span>النسخة بالمصري · optional</span></summary><div class="arabic-edition-grid"><label class="field field-full" dir="rtl"><span>السؤال أو الموقف</span><textarea name="prompt_ar" maxlength="500" rows="3" dir="rtl" placeholder="اكتب السؤال أو الموقف بالمصري"></textarea></label>${arabicChoices}<label class="field field-full" dir="rtl"><span>تلميح تدريبي (اختياري)</span><input name="hint_ar" maxlength="280" dir="rtl" placeholder="تلميح بسيط من غير ما يكشف الإجابة"></label><label class="field field-full" dir="rtl"><span>الخلاصة التدريبية بعد ظهور الإجابة</span><textarea name="explanation_ar" maxlength="700" rows="2" dir="rtl" placeholder="اشرح بالمصري ليه الاختيار الأنسب مفيد"></textarea></label></div><small>لو سيبت ترجمة فاضية، الجزء ده هيظهر للمتدرّب باللغة الأصلية المكتوبة فوق.</small></details></fieldset>`;
}
function customStudyCardMarkup(index){return `<fieldset class="custom-study-editor" data-custom-study><legend>RECALL CARD ${index+1}</legend><button class="micro-button" type="button" data-action="custom-remove-study">Remove card</button><label class="field field-full"><span>Think of the answer to this prompt</span><input name="front" required minlength="3" maxlength="140" placeholder="What should a strong handoff include?"></label><label class="field field-full"><span>Then reveal this takeaway</span><textarea name="back" required minlength="8" maxlength="500" rows="2" placeholder="The client's goal, verified details, open questions, and a named next step."></textarea></label><details class="arabic-edition field-full"><summary><strong>Egyptian Arabic edition</strong><span>النسخة بالمصري · optional</span></summary><div class="arabic-edition-grid"><label class="field field-full" dir="rtl"><span>سؤال المراجعة</span><input name="front_ar" maxlength="140" dir="rtl" placeholder="اكتب سؤال المراجعة بالمصري"></label><label class="field field-full" dir="rtl"><span>الخلاصة التدريبية</span><textarea name="back_ar" maxlength="500" rows="2" dir="rtl" placeholder="اكتب الخلاصة بالمصري"></textarea></label></div><small>لو سيبت ترجمة فاضية، الكارت هيظهر باللغة الأصلية المكتوبة فوق.</small></details></fieldset>`;}
function customAiPanel(){
 if(!store.aiPolishEnabled)return '<aside class="custom-ai-unavailable"><strong>AI draft assistant is not configured for this workspace.</strong><span>You can still build every round and recall card manually. Ask your administrator to configure the existing Gemini integration to enable AI drafts.</span></aside>';
 return `<section class="custom-ai-panel" aria-labelledby="custom-ai-title"><div class="custom-ai-heading"><div><span class="eyebrow">OPTIONAL · AI CO-DESIGNER</span><h3 id="custom-ai-title">Turn your lesson into a first draft</h3><p>Gemini uses the challenge title, focus, briefing and notes to draft scenario rounds and recall cards. Nothing is saved or assigned until you review and publish it.</p></div><span class="custom-ai-spark" aria-hidden="true">✦</span></div><label class="field field-full"><span>Lesson notes <small>(optional · no trainee names, emails, grades or contact details in any field)</small></span><textarea id="custom-ai-notes" maxlength="2400" rows="3" placeholder="Paste a short, non-sensitive lesson outline or key concepts."></textarea></label><div class="custom-ai-controls"><label class="field"><span>Number of rounds</span><select id="custom-ai-round-count"><option value="3">3 · quick pulse</option><option value="5" selected>5 · class challenge</option><option value="8">8 · deep practice</option></select></label><label class="custom-ai-consent"><input id="custom-ai-consent" type="checkbox"><span>I approve sending the challenge title, focus, briefing and notes to Gemini for an unsaved draft.</span></label><button class="micro-button custom-ai-button" type="button" data-action="custom-ai-draft">Draft with AI</button></div><p id="custom-ai-status" class="custom-ai-status" role="status" aria-live="polite"></p></section>`;
}
function openCustomChallengeForm(){
 if(!store.canWrite())return;
 const firstQuestions=Array.from({length:3},(_,index)=>customQuestionMarkup(index)).join('');
 openDialog('Create a custom challenge','Build once from a real lesson, then assign it to trainees or host it live with the class.',`<form id="custom-challenge-form"><div class="custom-builder-intro"><strong>Your lesson, turned into play.</strong><span>Write realistic scenarios with one defensible best answer. The Academy grades responses on the server; trainees never receive the answer key before submission.</span></div><div class="form-grid custom-challenge-basics"><label class="field"><span>Challenge title</span><input name="title" required minlength="3" maxlength="80" placeholder="e.g. Batch 43 · First-call practice"></label><label class="field"><span>Learning focus</span><input name="category" required minlength="2" maxlength="60" placeholder="e.g. Discovery calls"></label><label class="field"><span>Level</span><select name="level"><option>Warm-up</option><option selected>Core</option><option>Challenge</option></select></label><label class="field"><span>Estimated minutes</span><input name="duration_minutes" type="number" min="2" max="45" value="5" required></label><label class="field field-full"><span>Briefing <small>(optional)</small></span><textarea name="description" maxlength="280" rows="2" placeholder="What will the trainee practice or be able to do?"></textarea></label></div><details class="arabic-edition arabic-challenge-meta"><summary><strong>Egyptian Arabic edition</strong><span>النسخة بالمصري · optional</span></summary><div class="arabic-edition-grid"><label class="field" dir="rtl"><span>عنوان التحدّي</span><input name="title_ar" maxlength="80" dir="rtl" placeholder="اسم التحدّي بالمصري"></label><label class="field" dir="rtl"><span>محور التعلّم</span><input name="category_ar" maxlength="60" dir="rtl" placeholder="محور التعلّم بالمصري"></label><label class="field field-full" dir="rtl"><span>مقدمة التحدّي</span><textarea name="description_ar" maxlength="280" rows="2" dir="rtl" placeholder="اكتب للمتدرّب هيتدرّب على إيه"></textarea></label></div><small>لو سبت نسخة عربية فاضية، النص ده هيفضل بالإنجليزي حتى لو الواجهة بالمصري.</small></details><section class="custom-builder-section"><div class="custom-builder-section-head"><div><span class="eyebrow">THE ROUNDS</span><h3>Make the choices worth discussing</h3><p>At least 3 rounds. Add up to 12. Every round needs four distinct choices and a coaching takeaway.</p></div><strong id="custom-question-count">3 / 12</strong></div><div id="custom-question-list">${firstQuestions}</div><button class="micro-button" type="button" data-action="custom-add-question">＋ Add a round</button></section><section class="custom-builder-section"><div class="custom-builder-section-head"><div><span class="eyebrow">OPTIONAL ACTIVE-RECALL WARM-UP</span><h3>Give them something to remember</h3><p>These private study cards come before the scored challenge and never affect XP.</p></div><strong id="custom-study-count">0 / 8</strong></div><div id="custom-study-list"><p class="custom-study-empty">No warm-up cards yet. The challenge will start directly.</p></div><button class="micro-button" type="button" data-action="custom-add-study">＋ Add a recall card</button></section><div class="custom-integrity-note"><strong>Published challenges are intentionally immutable.</strong><span>This protects the answer key and makes every saved score reproducible. To revise one, create a new version; archiving a challenge hides it from new assignments but preserves existing learner links and results.</span></div><div class="form-error" id="custom-challenge-error" role="alert" hidden></div><div class="dialog-actions"><button class="button" type="button" data-action="dialog-close">Cancel</button><button class="button button-flat button-primary" type="submit">Save to shared challenge library</button></div></form>`);
 const basics=dialog.querySelector('.custom-challenge-basics');if(basics)basics.insertAdjacentHTML('afterend',customAiPanel());
}
function customQuestionCount(){const list=document.getElementById('custom-question-list');const count=document.getElementById('custom-question-count');if(list&&count)count.textContent=`${list.children.length} / 12`;}
function customStudyCount(){const list=document.getElementById('custom-study-list');const count=document.getElementById('custom-study-count');if(list&&count)count.textContent=`${list.querySelectorAll('[data-custom-study]').length} / 8`;}
function populateAiDraft(draft){
 const questionList=document.getElementById('custom-question-list'),studyList=document.getElementById('custom-study-list');
 if(!questionList||!studyList||!Array.isArray(draft.questions)||draft.questions.length<3)throw new Error('The AI draft could not be loaded into the challenge builder.');
 const form=document.getElementById('custom-challenge-form');
 for(const [name,value] of Object.entries({title_ar:draft.arabic?.title,category_ar:draft.arabic?.category,description_ar:draft.arabic?.description})){const field=form?.elements.namedItem(name);if(field&&value)field.value=value;}
 questionList.innerHTML=draft.questions.map((_,index)=>customQuestionMarkup(index)).join('');
 for(const [index,question] of draft.questions.entries()){
  const card=questionList.querySelectorAll('[data-custom-question]')[index];
  for(const [name,value] of Object.entries({prompt:question.prompt,answer:String(question.answer),skill:question.skill,hint:question.hint,explanation:question.explanation}))card.querySelector(`[name="${name}"]`).value=value;
  question.options.forEach((option,optionIndex)=>{card.querySelector(`[name="option_${optionIndex}"]`).value=option;});
  for(const [name,value] of Object.entries({prompt_ar:question.arabic?.prompt,hint_ar:question.arabic?.hint,explanation_ar:question.arabic?.explanation})){const field=card.querySelector(`[name="${name}"]`);if(field&&value)field.value=value;}
  question.arabic?.options?.forEach((option,optionIndex)=>{const field=card.querySelector(`[name="option_${optionIndex}_ar"]`);if(field)field.value=option;});
 }
 studyList.innerHTML=draft.study_cards.length?draft.study_cards.map((_,index)=>customStudyCardMarkup(index)).join(''):'<p class="custom-study-empty">No warm-up cards in this draft. Add your own or start directly.</p>';
 for(const [index,study] of draft.study_cards.entries()){
  const card=studyList.querySelectorAll('[data-custom-study]')[index];card.querySelector('[name="front"]').value=study.front;card.querySelector('[name="back"]').value=study.back;
  for(const [name,value] of Object.entries({front_ar:study.arabic?.front,back_ar:study.arabic?.back})){const field=card.querySelector(`[name="${name}"]`);if(field&&value)field.value=value;}
 }
 customQuestionCount();customStudyCount();
}
async function draftCustomChallengeWithAi(buttonEl){
 const form=document.getElementById('custom-challenge-form'),status=document.getElementById('custom-ai-status');if(!form||!status)return;
 if(!store.aiPolishEnabled){status.textContent='AI challenge drafting is not configured for this workspace.';return;}
 if(!document.getElementById('custom-ai-consent')?.checked){status.textContent='Check the consent box before sending the brief to Gemini.';return;}
 const title=form.elements.title.value.trim(),category=form.elements.category.value.trim();
 if(title.length<3||category.length<2){status.textContent='Enter the challenge title and learning focus first.';return;}
 const buttonLabel=buttonEl.textContent;buttonEl.disabled=true;buttonEl.textContent='Drafting your lesson…';status.textContent='Creating practical scenarios and recall prompts. Your current draft remains unsaved.';
 try{
  const draft=await store.api('ai','POST',{kind:'draft-studio-challenge',consent:true,language:interfaceLanguage,title,category,level:form.elements.level.value,duration_minutes:Number(form.elements.duration_minutes.value),description:form.elements.description.value,lesson_notes:document.getElementById('custom-ai-notes').value,round_count:Number(document.getElementById('custom-ai-round-count').value)});
  populateAiDraft(draft);status.textContent=`AI drafted ${draft.questions.length} rounds and ${draft.study_cards.length} recall cards. Review every answer, explanation, and factual claim before saving.`;
 }catch(error){status.textContent=error.message||'Could not create a draft. Your existing work is still here.';}
 finally{if(buttonEl.isConnected){buttonEl.disabled=false;buttonEl.textContent=buttonLabel;}}
}

function stopLiveRoomTimer() {
  if (liveRoomTimer) window.clearInterval(liveRoomTimer);
  liveRoomTimer = null;
}

function roomTimeLabel(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function updateRoomClock() {
  if (!liveRoom?.timerEndsAt) return;
  liveRoom.timeLeft = Math.max(0, Math.ceil((liveRoom.timerEndsAt - Date.now()) / 1000));
  const clock = document.getElementById('room-clock');
  const toggle = document.querySelector('[data-action="room-timer"]');
  const status = document.getElementById('room-clock-status');
  if (clock) { clock.textContent = roomTimeLabel(liveRoom.timeLeft); clock.classList.toggle('is-urgent', liveRoom.timeLeft <= 5); }
  if (liveRoom.timeLeft === 0) {
    liveRoom.timerEndsAt = 0;
    stopLiveRoomTimer();
    if (toggle) toggle.textContent = 'Start another timer';
    if (status) status.textContent = 'Time. Bring the room to a decision.';
  }
}

function stopLiveRoomSync() {
  if (liveRoomSyncTimer) window.clearInterval(liveRoomSyncTimer);
  liveRoomSyncTimer = null;
}

function applyLiveRoomSnapshot(snapshot) {
  if (!liveRoom || !snapshot) return;
  const previousRound = liveRoom.remote?.room.round_index;
  liveRoom.mode=snapshot.room.mode||liveRoom.mode||'quiz';
  liveRoom.remote = snapshot;
  liveRoom.roundIndex = snapshot.room.round_index;
  liveRoom.revealed = snapshot.room.revealed;
  liveRoom.finished = snapshot.room.status === 'Complete';
  liveRoom.teams = snapshot.teams.map(team => ({
    id: `team-${team.team_no}`, team_no:team.team_no, name: team.name, points: team.points,
    players: team.players || [], playerCount: team.player_count || 0,
  }));
  liveRoom.timerDuration = snapshot.room.timer_duration;
  const end = snapshot.room.timer_ends_at ? Date.parse(snapshot.room.timer_ends_at) : 0;
  liveRoom.timerEndsAt = end > Date.now() ? end : 0;
  liveRoom.timeLeft = liveRoom.timerEndsAt ? Math.ceil((liveRoom.timerEndsAt - Date.now()) / 1000) : previousRound !== snapshot.room.round_index || snapshot.room.revealed ? liveRoom.timerDuration : end ? 0 : liveRoom.timeLeft;
}

async function syncLiveRoom(snapshot) {
  if (!liveRoom?.phoneMode) return;
  const roomId = liveRoom.roomId;
  const fresh = snapshot || await store.api(`activities/live/host?room_id=${encodeURIComponent(roomId)}`);
  if (!liveRoom || liveRoom.roomId !== roomId) return;
  applyLiveRoomSnapshot(fresh);
  liveRoom.syncError = '';
  renderLiveRoom();
}

function startLiveRoomSync() {
  stopLiveRoomSync();
  liveRoomSyncTimer = window.setInterval(() => {
    syncLiveRoom().catch(error => {
      if (!liveRoom) return;
      liveRoom.syncError = error.message || 'Room updates paused. Check the connection.';
      const warning = document.getElementById('room-sync-warning');
      if (warning) warning.textContent = liveRoom.syncError;
    });
  }, 2000);
}

function renderSessionPulseSetup(error = '') {
  const plan=sessionRunPlan(),step=plan?.outline?.[sessionRun?.stepIndex];
  if(!step){showToast('This session step is no longer available. Refresh the shared board.',true);return;}
  const title=`${step.title} pulse`.slice(0,90);
  dialog.classList.remove('session-run-dialog');dialog.classList.add('live-room-dialog');
  dialog.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">STEP CHECK-IN | ${e(step.kind)}</span><h2 id="dialog-title">Create a class pulse</h2><p>A quick anonymous signal from everyone in the room: no names, teams, grades, or learner records.</p></div><button class="dialog-close" data-action="session-pulse-cancel" aria-label="Return to session" type="button">&times;</button></div><div class="dialog-body session-pulse-setup"><div class="room-privacy-note"><strong>One question. No pressure.</strong><span>Responses are temporary, hidden from classmates until reveal, and never written to attendance, assessments, XP, or trainee profiles. Group results stay hidden until at least three responses.</span></div><form id="session-pulse-form"><div class="form-grid"><div class="field field-full"><label for="pulse-title">Pulse name</label><input id="pulse-title" name="title" value="${e(title)}" maxlength="90" required></div><div class="field field-full"><label for="pulse-prompt">Question for the class</label><textarea id="pulse-prompt" name="prompt" rows="3" maxlength="240" required>${e(step.prompt)}</textarea></div><fieldset class="field field-full pulse-choice-field"><legend>Answer choices <small>2-5 choices</small></legend><div id="pulse-choice-list" class="pulse-choice-list"><label class="pulse-choice-row"><span>A</span><input name="pulse_choice" maxlength="80" value="Ready to explain it" required aria-label="Choice A"><button type="button" data-action="pulse-choice-remove" aria-label="Remove choice A">&times;</button></label><label class="pulse-choice-row"><span>B</span><input name="pulse_choice" maxlength="80" value="I want one more example" required aria-label="Choice B"><button type="button" data-action="pulse-choice-remove" aria-label="Remove choice B">&times;</button></label><label class="pulse-choice-row"><span>C</span><input name="pulse_choice" maxlength="80" value="I want to practise it" required aria-label="Choice C"><button type="button" data-action="pulse-choice-remove" aria-label="Remove choice C">&times;</button></label></div><button class="micro-button" type="button" data-action="pulse-choice-add">+ Add a choice</button></fieldset><div class="field field-full"><label for="pulse-timer">Optional answer timer</label><select id="pulse-timer" name="timer_duration"><option value="0">No timer</option><option value="20">20 seconds</option><option value="30" selected>30 seconds</option><option value="45">45 seconds</option></select></div></div>${error?`<div class="form-error" role="alert">${e(error)}</div>`:'<div class="form-error" id="pulse-form-error" role="alert" hidden></div>'}<div class="dialog-actions"><button class="button" type="button" data-action="session-pulse-cancel">Back to session</button><button class="button button-flat button-primary" type="submit">Open class pulse <span aria-hidden="true">&#8599;</span></button></div></form></div>`;
  sessionPulseSetupOpen=true;
  const form=document.getElementById('session-pulse-form');
  const arabicEdition=document.createElement('details');arabicEdition.className='arabic-edition arabic-challenge-meta';
  arabicEdition.innerHTML='<summary><strong>Egyptian Arabic edition</strong><span>النسخة بالمصري · optional</span></summary><div class="arabic-edition-grid"></div><small>Write one Arabic choice per line, in the same order as the English choices. Blank translations stay in their original language.</small>';
  const arabicGrid=arabicEdition.querySelector('.arabic-edition-grid');
  for(const [name,label,placeholder,multiline] of [['title_ar','اسم النبضة','اسم قصير بالمصري',false],['prompt_ar','سؤال المجموعة','اكتب السؤال بالمصري',true],['options_ar','الاختيارات · اختيار في كل سطر','اكتب اختيار A ثم B ثم C بنفس ترتيب الإنجليزي',true]]){
    const field=document.createElement('label');field.className=`field${multiline?' field-full':''}`;field.dir='rtl';
    const caption=document.createElement('span');caption.textContent=label;field.append(caption);
    const control=document.createElement(multiline?'textarea':'input');control.name=name;control.dir='rtl';control.placeholder=placeholder;if(multiline)control.rows=name==='prompt_ar'?2:3;else control.maxLength=90;
    field.append(control);arabicGrid.append(field);
  }
  form.querySelector('.form-grid').append(arabicEdition);
  form.addEventListener('click',event=>{
    const button=event.target.closest('[data-action^="pulse-choice-"]');if(!button)return;
    const list=form.querySelector('#pulse-choice-list'),rows=list.querySelectorAll('.pulse-choice-row');
    if(button.dataset.action==='pulse-choice-add'&&rows.length<5){
      const index=rows.length,letter=String.fromCharCode(65+index),row=document.createElement('label');row.className='pulse-choice-row';
      const mark=document.createElement('span');mark.textContent=letter;
      const input=document.createElement('input');input.name='pulse_choice';input.maxLength=80;input.required=true;input.setAttribute('aria-label',`Choice ${letter}`);input.placeholder='Add a response';
      const remove=document.createElement('button');remove.type='button';remove.dataset.action='pulse-choice-remove';remove.setAttribute('aria-label',`Remove choice ${letter}`);remove.textContent='x';
      row.append(mark,input,remove);list.append(row);
    }else if(button.dataset.action==='pulse-choice-remove'&&rows.length>2){button.closest('.pulse-choice-row')?.remove();}
    const updated=list.querySelectorAll('.pulse-choice-row');
    updated.forEach((row,index)=>{const letter=String.fromCharCode(65+index);row.querySelector('span').textContent=letter;row.querySelector('input').setAttribute('aria-label',`Choice ${letter}`);row.querySelector('button').setAttribute('aria-label',`Remove choice ${letter}`);});
    form.querySelector('[data-action="pulse-choice-add"]').disabled=updated.length>=5;
    updated.forEach(row=>{row.querySelector('button').disabled=updated.length<=2;});
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();const submit=form.querySelector('[type="submit"]'),errorBox=document.getElementById('pulse-form-error');
    const options=[...form.querySelectorAll('[name="pulse_choice"]')].map(input=>input.value.trim());
    if(options.length<2||options.length>5||options.some(option=>!option)||new Set(options.map(option=>option.toLocaleLowerCase())).size!==options.length){errorBox.hidden=false;errorBox.textContent='Use two to five different choices, with a short label for each.';return;}
    const arabicOptionsText=form.elements.options_ar.value.trim();
    const arabicOptions=arabicOptionsText?arabicOptionsText.split(/\r?\n/).map(value=>value.trim()):options.map(()=> '');
    if(arabicOptions.length!==options.length){errorBox.hidden=false;errorBox.textContent='Add one Egyptian Arabic choice per line, in the same order as the English choices.';return;}
    submit.disabled=true;errorBox.hidden=true;
    const arabic={title:form.elements.title_ar.value.trim(),prompt:form.elements.prompt_ar.value.trim(),options:arabicOptions};
    const pulse={mode:'pulse',title:form.elements.title.value.trim(),prompt:form.elements.prompt.value.trim(),options,timer_duration:Number(form.elements.timer_duration.value),arabic};
    try{
      const created=await store.api('activities/live/create','POST',pulse),question={id:'pulse-1',prompt:pulse.prompt,options,answer:null,explanation:'',arabic:{prompt:arabic.prompt,options:arabic.options}};
      liveRoom={mode:'pulse',activity:{id:'session-pulse',title:pulse.title,category:'Class pulse',level:'Whole class',arabic:{title:arabic.title},questions:[question]},teams:[{id:'team-1',team_no:1,name:'Whole class',points:0,players:[],playerCount:0}],roundIndex:0,revealed:false,pointAwarded:false,history:[],timerDuration:pulse.timer_duration,timeLeft:pulse.timer_duration,timerEndsAt:0,finished:false,phoneMode:true,roomId:created.room_id,joinCode:created.join_code,sessionPulseReturn:true,syncError:''};
      sessionPulseSetupOpen=false;renderLiveRoom();
      try{await syncLiveRoom();startLiveRoomSync();}
      catch(syncError){liveRoom.syncError=syncError.message||'The pulse opened, but its latest state could not be loaded yet.';renderLiveRoom();startLiveRoomSync();}
    }catch(createError){errorBox.hidden=false;errorBox.textContent=createError.message||'Could not open the class pulse. Your draft is still here.';submit.disabled=false;}
  });
  if(!dialog.open)dialog.showModal();
}

function showSessionPulseSetup() {
  if(!store.canWrite()||!sessionRun)return;
  if(sessionRun.running){sessionRun.remainingSeconds=Math.max(0,Math.ceil((sessionRun.endsAt-Date.now())/1000));sessionRun.running=false;sessionRun.endsAt=0;stopSessionRunTimer();}
  renderSessionPulseSetup();
}

function cancelSessionPulseSetup() {
  if(!sessionPulseSetupOpen)return;
  sessionPulseSetupOpen=false;
  if(sessionRun)renderSessionRun();else closeLiveRoom();
}

function renderLiveRoomSetup(error = '', selectedActivityId = '') {
  const activities = state.facilitatorDeck;
  dialog.innerHTML = `<div class="dialog-head"><div><span class="eyebrow">TRAINER-LED · CLASSROOM MODE</span><h2 id="dialog-title">Set up your live room</h2><p>Choose a challenge, name two teams, then put the question on screen.</p></div><button class="dialog-close" data-action="dialog-close" aria-label="Close dialog" type="button">×</button></div><div class="dialog-body live-room-setup"><div class="room-privacy-note"><strong>Live points stay in this room only.</strong><span>No names, answers, scores, or XP are written to trainee, attendance, assessment, or assignment records. Rooms expire automatically after four hours.</span></div><form id="live-room-form"><div class="form-grid"><div class="field field-full"><label for="room-activity">Challenge</label><select id="room-activity" name="activity_id" required>${activities.map(activity=>`<option value="${e(activity.id)}">${e(activity.title)} · ${e(activity.category)} · ${e(activity.questions.length)} rounds</option>`).join('')}</select></div><div class="field"><label for="room-team-one">Team one</label><input id="room-team-one" name="team_one" maxlength="28" value="Red Falcons" required autocomplete="off"></div><div class="field"><label for="room-team-two">Team two</label><input id="room-team-two" name="team_two" maxlength="28" value="Silver Sparks" required autocomplete="off"></div><div class="field field-full"><label for="room-timer">Round timer</label><select id="room-timer" name="timer_seconds"><option value="30" selected>30 seconds</option><option value="20">20 seconds · lightning</option><option value="45">45 seconds · discussion</option><option value="0">No timer</option></select></div><label class="room-phone-toggle field-full"><input name="phone_enabled" type="checkbox"><span><strong>Let everyone answer on their own phone</strong><small>Creates a live join code, team leaderboard, anonymous class response counts, and automatic room points. The existing talk-it-out mode stays available when this is off.</small></span></label></div><div class="room-rules"><span class="room-rule-icon" aria-hidden="true">✦</span><div><strong>How the room plays</strong><p>Teams discuss or answer together. Reveal each coaching move when the class is ready. Correct phone answers earn temporary room points, with a small streak bonus; this is not Academy XP.</p></div></div>${error?`<div class="form-error" role="alert">${e(error)}</div>`:''}<div class="dialog-actions"><button class="button" type="button" data-action="dialog-close">Cancel</button><button class="button button-flat button-primary" type="submit">Start live room</button></div></form></div>`;
  dialog.classList.add('live-room-dialog');
  const form = document.getElementById('live-room-form');
  dialog.querySelector('.dialog-head p').textContent='Choose 2–4 teams, name them, then put the question on screen.';
  const teamOneField=form.querySelector('#room-team-one').closest('.field'),teamTwoField=form.querySelector('#room-team-two').closest('.field');
  teamOneField.dataset.liveTeam='1';teamTwoField.dataset.liveTeam='2';
  const teamCountField=document.createElement('div');teamCountField.className='field';
  const teamCountLabel=document.createElement('label');teamCountLabel.htmlFor='room-team-count';teamCountLabel.textContent='Number of teams';
  const teamCount=document.createElement('select');teamCount.id='room-team-count';teamCount.name='team_count';
  for(const count of [2,3,4]){const option=document.createElement('option');option.value=String(count);option.textContent=`${count} teams`;teamCount.append(option);}
  teamCountField.append(teamCountLabel,teamCount);teamOneField.before(teamCountField);
  let lastTeamField=teamTwoField;
  for(const [teamNo,name] of [[3,'Golden Comets'],[4,'Green Meteors']]){
    const field=document.createElement('div');field.className='field room-team-name-field';field.dataset.liveTeam=String(teamNo);field.hidden=true;
    const label=document.createElement('label');label.htmlFor=`room-team-${teamNo}`;label.textContent=`Team ${teamNo}`;
    const input=document.createElement('input');input.id=`room-team-${teamNo}`;input.name=`team_${teamNo}`;input.maxLength=28;input.value=name;input.autocomplete='off';
    field.append(label,input);lastTeamField.after(field);lastTeamField=field;
  }
  const syncTeamNameFields=()=>{const count=Number(teamCount.value);form.querySelectorAll('[data-live-team]').forEach(field=>{const enabled=Number(field.dataset.liveTeam)<=count;field.hidden=!enabled;field.querySelector('input').required=enabled;});};
  teamCount.addEventListener('change',syncTeamNameFields);syncTeamNameFields();
  if (activities.some(item => item.id === selectedActivityId)) form.elements.activity_id.value = selectedActivityId;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const teamNames=[...form.querySelectorAll('[data-live-team]')].filter(field=>!field.hidden).map(field=>field.querySelector('input').value.trim());
    const formError=form.querySelector('[role="alert"]');
    if(teamNames.some(name=>!name||name.length>28)||new Set(teamNames.map(name=>name.toLocaleLowerCase())).size!==teamNames.length){if(formError){formError.hidden=false;formError.textContent='Give every team a different name of 1 to 28 characters.';}else{const error=document.createElement('div');error.className='form-error';error.setAttribute('role','alert');error.textContent='Give every team a different name of 1 to 28 characters.';form.querySelector('.dialog-actions').before(error);}return;}
    const activity = activities.find(item => item.id === form.elements.activity_id.value);
    if (!activity) { renderLiveRoomSetup('Choose a challenge from the live deck.', form.elements.activity_id.value); return; }
    const timerDuration = Number(form.elements.timer_seconds.value), phoneMode = form.elements.phone_enabled.checked;
    submit.disabled = true;
    try {
      let roomId = '', joinCode = '';
      if (phoneMode) {
        const created = await store.api('activities/live/create', 'POST', { activity_id: activity.id, teams:teamNames, timer_duration: timerDuration });
        roomId = created.room_id; joinCode = created.join_code;
      }
      liveRoom = { activity, teams: teamNames.map((name, index) => ({ id: `team-${index + 1}`, team_no:index+1, name, points: 0, players: [] })), roundIndex: 0, revealed: false, pointAwarded: false, history: [], timerDuration, timeLeft: timerDuration, timerEndsAt: 0, finished: false, phoneMode, roomId, joinCode, syncError: '' };
      renderLiveRoom();
      if (phoneMode) { await syncLiveRoom(); startLiveRoomSync(); }
    } catch (roomError) {
      if (liveRoom?.roomId) { liveRoom.syncError = roomError.message || 'The room started, but its latest state could not be loaded.'; renderLiveRoom(); startLiveRoomSync(); }
      else renderLiveRoomSetup(roomError.message || 'Could not start the live room. Check your connection and try again.');
    }
  });
}

function liveRoomHref(code) {
  return participantLink(location.href, `/room/${code}`, participantOrigin);
}

function qrImageFor(value) {
  if (qrImageCache.has(value)) return qrImageCache.get(value);
  const image = createQrDataUrl(value, qrcode);
  qrImageCache.set(value, image);
  if (qrImageCache.size > 16) qrImageCache.delete(qrImageCache.keys().next().value);
  return image;
}

function mountQrCode(frame) {
  const value = frame?.dataset.qrUrl;
  if (!value) return false;
  try {
    const image = document.createElement('img');
    image.src = qrImageFor(value);
    image.alt = frame.dataset.qrAlt || 'QR code for this private activity';
    image.width = 240;
    image.height = 240;
    image.decoding = 'async';
    frame.replaceChildren(image);
    return true;
  } catch {
    const fallback = document.createElement('span');
    fallback.className = 'qr-code-error';
    fallback.setAttribute('role', 'status');
    fallback.textContent = 'QR is unavailable in this browser. Use the private link instead.';
    frame.replaceChildren(fallback);
    return false;
  }
}

function mountLiveRoomQrCodes(root = dialog) {
  root.querySelectorAll('.qr-code-frame[data-qr-url]').forEach(mountQrCode);
}

function liveRoomQrMarkup(code) {
  return `<figure class="room-qr-card"><div class="qr-code-frame" data-qr-url="${e(liveRoomHref(code))}" data-qr-alt="QR code for this live classroom"><span>Preparing QR code…</span></div><figcaption>Scan with your phone camera to join this room.</figcaption></figure>`;
}

function renderLivePulseRoom() {
  const room=liveRoom,remote=room?.remote;
  if(!room||!remote)return;
  const question=remote.question||room.activity.questions[0],joined=room.teams[0]?.playerCount||0,count=Number(remote.response_count)||0,counts=remote.answer_counts;
  const results=Array.isArray(counts)?`<div class="pulse-result-list" aria-label="Anonymous class response distribution">${question.options.map((option,index)=>{const votes=Number(counts[index])||0,share=count?Math.round(votes/count*100):0;return `<div class="pulse-result-row"><div><span class="pulse-result-letter">${String.fromCharCode(65+index)}</span><strong>${e(option)}</strong><small>${votes} ${votes===1?'response':'responses'} - ${share}%</small></div><i><b style="width:${share}%"></b></i></div>`;}).join('')}</div>`:count<3?`<div class="pulse-results-private"><strong>${count===0?'The room is ready for its first response.':`${count} of 3 responses needed to show a group pattern.`}</strong><span>To protect privacy, answer distribution stays hidden until at least three people respond.</span></div>`:`<div class="pulse-results-private"><strong>Responses are in.</strong><span>Reveal the class pattern when you are ready to discuss it.</span></div>`;
  const timer=room.timerDuration?`<div class="room-clock-wrap"><div id="room-clock" class="room-clock ${room.timeLeft<=5?'is-urgent':''}">${roomTimeLabel(room.timerEndsAt?Math.ceil((room.timerEndsAt-Date.now())/1000):room.timeLeft)}</div><span id="room-clock-status">${room.timerEndsAt?'Pulse timer is running.':room.timeLeft===0?'Time. Invite one last thought.':'A gentle timebox; no answer is graded.'}</span><button class="micro-button" type="button" data-action="room-timer">${room.timerEndsAt?'Pause timer':room.timeLeft<room.timerDuration?'Resume timer':`Start ${room.timerDuration}-second timer`}</button></div>`:'<span class="room-untimed">No timer - take the time the class needs</span>';
  const finishLabel=room.sessionPulseReturn?'Finish pulse & return to session':'End pulse';
  const action=remote.room.revealed?`<button class="button button-flat button-primary" type="button" data-action="room-end">${e(finishLabel)} <span aria-hidden="true">&rarr;</span></button>`:'<button class="button button-flat button-primary" type="button" data-action="room-reveal">Reveal class pattern</button>';
  const invite=`<section class="room-join-panel pulse-invite"><div class="room-join-copy"><span class="eyebrow">JOIN ANONYMOUSLY</span><strong class="room-join-code">${e(room.joinCode||'')}</strong><span>${joined} ${joined===1?'person':'people'} joined - no account, name, or team required</span><code>${e(liveRoomHref(room.joinCode||''))}</code></div>${room.joinCode?liveRoomQrMarkup(room.joinCode):''}<div class="room-join-actions"><button class="button" type="button" data-action="room-copy-invite">Copy join link</button></div></section>`;
  dialog.innerHTML=`<main class="live-room-shell live-pulse-shell"><header class="room-header"><div class="room-brand"><img src="../training-academy-logo.svg" alt=""><span><b>ACADEMY STUDIO</b><small>ANONYMOUS CLASS PULSE - LIVE</small></span></div><div class="room-header-actions"><button class="micro-button" type="button" data-action="room-fullscreen">Fullscreen</button><button class="micro-button pulse-end-button" type="button" data-action="room-end">${e(finishLabel)}</button></div></header><div class="room-content"><div class="room-title-line pulse-title-line"><div><span class="eyebrow">${remote.room.revealed?'CLASS PATTERN REVEALED':'ONE QUESTION - WHOLE CLASS'}</span><h1>${e(room.activity.title)}</h1><p>Take the room's temperature. This is a learning signal, not a score.</p></div><div class="pulse-response-orbit"><strong>${count}</strong><span>responses</span><small>${joined} joined</small></div></div>${invite}<div id="room-sync-warning" class="room-sync-warning" role="status">${e(room.syncError||'')}</div><section class="pulse-host-question"><span class="eyebrow">ASK THE CLASS</span><h2>${e(question.prompt)}</h2><div class="pulse-host-options">${question.options.map((option,index)=>`<div><span>${String.fromCharCode(65+index)}</span><strong>${e(option)}</strong></div>`).join('')}</div></section><section class="pulse-host-results"><div class="pulse-results-heading"><div><span class="eyebrow">${remote.room.revealed?'THE CLASS SIGNAL':'LIVE RESPONSE SIGNAL'}</span><h2>${remote.room.revealed?'What the room is telling us':'Listen for the pattern'}</h2></div><span class="pulse-anonymous-tag"><i aria-hidden="true"></i> Anonymous - ungraded</span></div>${results}<div class="pulse-reveal-note">${remote.room.revealed?'Use this as a conversation starter. No response is right or wrong.':'Only you can see eligible aggregate counts before reveal; learners see the group pattern after you reveal.'}</div></section><div class="pulse-host-actions">${timer}${action}</div><footer class="room-footer"><span>No roster, attendance, assessment, or XP changes. Responses expire with this room.</span></footer></div></main>`;
  dialog.classList.add('live-room-dialog');dialog.classList.remove('session-run-dialog');
  mountLiveRoomQrCodes(dialog);
  if(!dialog.open)dialog.showModal();
}

function sequenceStepList(steps, order, { interactive = false, disabled = false, revealed = false } = {}) {
  return `<ol class="sequence-step-list ${interactive ? 'sequence-step-list-phone' : 'sequence-step-list-host'} ${revealed ? 'is-revealed' : ''}" aria-label="${revealed ? 'Coaching sequence' : 'Steps to arrange'}">${order.map((stepIndex, position) => `<li class="sequence-step-card"><span class="sequence-step-index">${revealed ? String(position + 1).padStart(2, '0') : '↕'}</span><strong>${e(steps[stepIndex])}</strong>${interactive ? `<span class="sequence-step-controls"><button type="button" data-action="sequence-move" data-position="${position}" data-direction="-1" aria-label="Move ${e(steps[stepIndex])} earlier" ${disabled || position === 0 ? 'disabled' : ''}>↑</button><button type="button" data-action="sequence-move" data-position="${position}" data-direction="1" aria-label="Move ${e(steps[stepIndex])} later" ${disabled || position === order.length - 1 ? 'disabled' : ''}>↓</button></span>` : ''}</li>`).join('')}</ol>`;
}

function liveConfidencePicker(data) {
  if (data.revealed || data.mode === 'pulse') return '';
  const question = data.question;
  const selected = livePlayer.confidenceDrafts.get(question.id) ?? data.player.confidence ?? '';
  return `<div class="live-confidence-check" role="group" aria-label="Optional confidence check"><div><span class="eyebrow">OPTIONAL CONFIDENCE CHECK</span><strong>How sure are you?</strong></div><div class="live-confidence-options"><button type="button" data-action="phone-confidence" data-confidence="tentative" aria-pressed="${selected === 'tentative'}" class="${selected === 'tentative' ? 'is-selected' : ''}" ${livePlayer.busy ? 'disabled' : ''}>Still thinking</button><button type="button" data-action="phone-confidence" data-confidence="confident" aria-pressed="${selected === 'confident'}" class="${selected === 'confident' ? 'is-selected' : ''}" ${livePlayer.busy ? 'disabled' : ''}>Ready to stand by it</button></div><small>Only you see this before reveal; your trainer gets a class pattern, not your name.</small></div>`;
}

function livePhoneSequenceOrder(data) {
  const question = data?.question;
  if (!question || question.type !== 'sequence') return [];
  if (data.revealed) return sequenceOrderForChoice(question.answer) || question.steps.map((_, index) => index);
  const draft = livePlayer.sequenceDrafts.get(question.id);
  if (draft) return [...draft];
  return sequenceOrderForChoice(data.player.choice) || question.steps.map((_, index) => index);
}

function liveClassroomDebriefBase(remote) {
  const model = liveDebriefModel(remote);
  if (!model) return '';
  return `<aside class="live-classroom-debrief" aria-label="Facilitator debrief suggestion"><div class="live-debrief-signal"><span class="eyebrow">LIVE CLASS SIGNAL</span><strong>${model.headline}</strong><small>${model.label}</small></div><div class="live-debrief-copy"><span class="eyebrow">A 20-SECOND HUDDLE</span><p>${model.cue}</p><small>Temporary room feedback only · never a formal grade or trainee record.</small></div></aside>`;
}

function liveClassroomDebrief(remote) {
  const model = liveDebriefModel(remote);
  if (!model) return '';
  const confidence = model.confidence;
  if (!confidence) return liveClassroomDebriefBase(remote);
  const rate = group => group.accuracy === null
    ? 'Need 3+ in this group for an accuracy signal'
    : `${group.accuracy}% matched`;
  const calibration = `<div class="live-debrief-calibration"><span class="eyebrow">CONFIDENCE, THEN ACCURACY</span><div><span><strong>${confidence.confident.count}</strong> ready to stand by it <small>${rate(confidence.confident)}</small></span><span><strong>${confidence.tentative.count}</strong> still thinking <small>${rate(confidence.tentative)}</small></span></div><p>${e(confidence.cue)}</p></div>`;
  return liveClassroomDebriefBase(remote).replace('</aside>', `${calibration}</aside>`);
}

function renderLiveSequenceRoom(room, activity, remote, question, onlineTotal) {
  const teams = room.teams.map((team, index) => {
    const members = room.phoneMode ? (team.players || []).map(person => `<span class="room-player-pill">${e(person.nickname)} <b>${Number(person.points) || 0}</b></span>`).join('') : '';
    const spoken = !room.phoneMode && index === room.roundIndex % room.teams.length && !room.finished;
    const award = !room.phoneMode && room.revealed && !room.pointAwarded && !room.finished
      ? `<button class="micro-button room-award" type="button" data-action="room-award" data-team="${e(team.id)}">Award 100 points</button>` : '';
    return `<article class="room-team ${spoken ? 'room-team-turn' : ''}"><span class="room-team-label">TEAM ${String(index + 1).padStart(2, '0')}${spoken ? ' · ON DECK' : ''}${room.phoneMode ? ` · ${team.playerCount} JOINED` : ''}</span><h3>${e(team.name)}</h3><div class="room-team-score"><strong>${Number(team.points) || 0}</strong><span>room points</span></div>${room.phoneMode ? `<div class="room-player-list">${members || '<span class="room-player-empty">Waiting for the class to join…</span>'}</div>` : award}</article>`;
  }).join('');
  const winner = room.teams.reduce((best, team) => team.points > best.points ? team : best, room.teams[0]);
  const tied = room.teams[0].points === room.teams[1].points;
  const answerOrder = room.revealed ? (sequenceOrderForChoice(question.answer) || question.steps.map((_, index) => index)) : question.steps.map((_, index) => index);
  const roomCompleteCopy = room.phoneMode
    ? 'Every answer stays in this temporary room. The leaderboard is for today’s class, not an Academy record.'
    : 'Call out one useful idea each team contributed before wrapping up.';
  const roundContent = room.finished
    ? `<section class="room-finish"><span class="eyebrow">ROOM COMPLETE · ${e(activity.title)}</span><h2>${tied ? 'What a match!' : `${e(winner.name)} takes the round!`}</h2><p>${room.phoneMode ? roomCompleteCopy : tied ? 'The teams finished level. Run it back and see what happens.' : roomCompleteCopy}</p><div class="room-finish-actions"><button class="button button-flat button-primary" type="button" data-action="room-again">Play another set</button></div></section>`
    : `<section class="room-question sequence-room-question"><div class="room-round-meta"><span>ROUND ${room.roundIndex + 1} / ${room.phoneMode ? onlineTotal : activity.questions.length}</span><span>${e(activity.category)} · ${e(activity.level)}</span></div><h2>${e(question.prompt)}</h2><p class="sequence-instruction">${room.revealed ? 'Here is the coaching order. Talk through why each move belongs there.' : 'Agree on the order as a team. The numbered coaching sequence appears when you reveal.'}</p>${sequenceStepList(question.steps, answerOrder, { revealed: room.revealed })}${room.phoneMode ? `<div class="room-response-pulse sequence-response-count"><strong>${remote?.response_count || 0}</strong> <span>of ${room.teams.reduce((sum, team) => sum + (team.playerCount || 0), 0)} players submitted an order${room.revealed ? '' : ' · choices stay hidden until reveal'}</span></div>` : ''}${room.revealed ? `<div class="room-coaching"><span>COACHING TAKEAWAY</span><p>${e(question.explanation)}</p></div>` : ''}${room.phoneMode && room.revealed && remote?.responses?.length ? `<div class="room-reveal-feed"><strong>Round recap</strong>${remote.responses.map(person => `<span>${e(person.nickname)} · ${e(remote.teams.find(team => team.team_no === person.team_no)?.name || 'Team')} · ${person.correct ? '+' + person.awarded_points + ' pts' : 'review the takeaway'}</span>`).join('')}</div>` : ''}<div class="room-round-actions"><div class="room-clock-wrap">${room.timerDuration ? `<div id="room-clock" class="room-clock ${room.timeLeft <= 5 ? 'is-urgent' : ''}">${roomTimeLabel(room.timerEndsAt ? Math.ceil((room.timerEndsAt - Date.now()) / 1000) : room.timeLeft)}</div><span id="room-clock-status">${room.timerEndsAt ? 'Round timer is running across the room.' : room.timeLeft === 0 ? 'Time. Bring the room to a decision.' : 'Use the timer for energy, not pressure.'}</span><button class="micro-button" type="button" data-action="room-timer">${room.timerEndsAt ? 'Pause timer' : room.timeLeft < room.timerDuration ? 'Resume timer' : `Start ${room.timerDuration}-second timer`}</button>` : '<span class="room-untimed">Untimed discussion · no rush</span>'}</div><div class="room-round-buttons">${room.revealed ? `<button class="button button-flat button-primary" type="button" data-action="${room.roundIndex === (room.phoneMode ? onlineTotal : activity.questions.length) - 1 ? 'room-finish' : 'room-next'}">${room.roundIndex === (room.phoneMode ? onlineTotal : activity.questions.length) - 1 ? 'Finish room' : 'Next round'} <span aria-hidden="true">→</span></button>` : '<button class="button button-flat button-primary" type="button" data-action="room-reveal">Reveal coaching order</button>'}</div></div></section>`;
  const joinPanel = room.phoneMode && !room.finished && room.joinCode ? `<section class="room-join-panel"><div class="room-join-copy"><span class="eyebrow">JOIN THE CLASSROOM</span><strong class="room-join-code">${e(room.joinCode)}</strong><span>Scan this QR code with a phone camera, or use the link below as a fallback.</span><code>${e(liveRoomHref(room.joinCode))}</code></div>${liveRoomQrMarkup(room.joinCode)}<div class="room-join-actions"><button class="button" type="button" data-action="room-copy-invite">Copy invite link</button></div></section>` : '';
  const undo = !room.phoneMode && room.history.length ? '<button class="micro-button" type="button" data-action="room-undo">Undo last point</button>' : '';
  const endRoom = room.phoneMode ? '<button class="micro-button" type="button" data-action="room-end">End phone room</button>' : '<button class="micro-button" type="button" data-action="room-exit">Exit room</button>';
  dialog.innerHTML = `<main class="live-room-shell live-sequence-room"><header class="room-header"><div class="room-brand"><img src="../training-academy-logo.svg" alt=""><span><b>ACADEMY STUDIO</b><small>${room.phoneMode ? 'PHONE TEAM ROOM · LIVE SYNC' : 'LIVE TEAM ROOM · SESSION ONLY'}</small></span></div><div class="room-header-actions"><button class="micro-button" type="button" data-action="room-fullscreen">Fullscreen</button>${endRoom}</div></header><div class="room-content"><div class="room-title-line"><div><span class="eyebrow">${room.finished ? 'FINAL SCORE' : 'SEQUENCE SPRINT · LIVE CLASSROOM'}</span><h1>${e(activity.title)}</h1><p>${room.phoneMode ? 'Sort the moves together from your phone. Think clearly, then lock your order.' : 'Debate the sequence together, then reveal the coaching logic.'}</p></div><div class="room-round-badge">${room.finished ? 'DONE' : `ROUND ${room.roundIndex + 1}`}<span>${room.finished ? '' : `OF ${room.phoneMode ? onlineTotal : activity.questions.length}`}</span></div></div>${joinPanel}<div id="room-sync-warning" class="room-sync-warning" role="status">${e(room.syncError || '')}</div><section class="room-scoreboard" aria-label="Team score">${teams}</section>${roundContent}<footer class="room-footer"><span>Temporary points only · no roster, attendance, assessment, assignment, or XP changes.</span>${undo}</footer></div></main>`;
  dialog.classList.add('live-room-dialog');
  mountLiveRoomQrCodes(dialog);
  if (!room.finished && room.phoneMode && room.revealed) dialog.querySelector('.room-coaching')?.insertAdjacentHTML('afterend', liveClassroomDebrief(remote));
  if (room.finished) dialog.querySelectorAll('.room-team-label').forEach((label, index) => { label.textContent = `PLACE ${String(index + 1).padStart(2, '0')}${room.phoneMode ? ` · ${room.teams[index].playerCount} PLAYERS` : ''}`; });
  if (!dialog.open) dialog.showModal();
}

function renderLiveRoom() {
  if (!liveRoom) return;
  registerActivityArabic(liveRoom.activity);
  if(liveRoom.mode==='pulse'){renderLivePulseRoom();return;}
  const room = liveRoom.finished ? {...liveRoom,teams:[...liveRoom.teams].sort((a,b)=>b.points-a.points)} : liveRoom, activity = room.activity;
  registerActivityArabic(activity);
  const remote = room.remote;
  const onlineTotal = remote?.room.total_rounds || activity.questions.length;
  const question = room.phoneMode ? (remote?.question || activity.questions[room.roundIndex]) : activity.questions[room.roundIndex];
  if (!question) return;
  if (question.type === 'sequence') { renderLiveSequenceRoom(room, activity, remote, question, onlineTotal); return; }
  const teams = room.teams.map((team, index) => {
    const members = room.phoneMode ? (team.players || []).map(person => `<span class="room-player-pill">${e(person.nickname)} <b>${Number(person.points)||0}</b></span>`).join('') : '';
    const spoken = !room.phoneMode && index === room.roundIndex % room.teams.length && !room.finished;
    return `<article class="room-team ${spoken ? 'room-team-turn' : ''}"><span class="room-team-label">TEAM ${String(index + 1).padStart(2, '0')}${spoken ? ' · ON DECK' : ''}${room.phoneMode ? ` · ${team.playerCount} JOINED` : ''}</span><h3>${e(team.name)}</h3><div class="room-team-score"><strong>${Number(team.points)||0}</strong><span>room points</span></div>${room.phoneMode ? `<div class="room-player-list">${members || '<span class="room-player-empty">Waiting for the class to join…</span>'}</div>` : room.revealed && !room.pointAwarded && !room.finished ? `<button class="micro-button room-award" type="button" data-action="room-award" data-team="${e(team.id)}">Award 100 points</button>` : ''}</article>`;
  }).join('');
  const winner = room.teams.reduce((best, team) => team.points > best.points ? team : best, room.teams[0]);
  const roomCompleteCopy = room.phoneMode ? 'Every answer stays in this temporary room. The leaderboard is for today’s class, not an Academy record.' : 'Great teamwork. Call out one thing the winning team did well before wrapping up.';
  const roundContent = room.finished
    ? `<section class="room-finish"><span class="eyebrow">ROOM COMPLETE · ${e(activity.title)}</span><h2>${room.teams[0].points === room.teams[1].points ? 'What a match!' : `${e(winner.name)} takes the round!`}</h2><p>${room.phoneMode ? roomCompleteCopy : room.teams[0].points === room.teams[1].points ? 'The teams finished level. Run it back and see what happens.' : roomCompleteCopy}</p><div class="room-finish-actions"><button class="button button-flat button-primary" type="button" data-action="room-again">Play another set</button></div></section>`
    : `<section class="room-question"><div class="room-round-meta"><span>ROUND ${room.roundIndex + 1} / ${room.phoneMode ? onlineTotal : activity.questions.length}</span><span>${e(activity.category)} · ${e(activity.level)}</span></div><h2>${e(question.prompt)}</h2><ol class="room-options">${question.options.map((option, index) => `<li class="room-option ${room.revealed && index === question.answer ? 'room-option-correct' : ''}"><span>${String.fromCharCode(65 + index)}</span><strong>${e(option)}</strong>${room.revealed && index === question.answer ? '<b>STRONGEST MOVE</b>' : ''}</li>`).join('')}</ol>${room.phoneMode ? `<div class="room-response-pulse"><strong>${remote?.response_count||0}</strong> <span>of ${room.teams.reduce((sum,team)=>sum+(team.playerCount||0),0)} players answered${room.revealed ? ' this round' : ' · hidden until reveal'}</span>${remote?.response_count ? `<div class="room-distribution" aria-label="Anonymous answer distribution"><span class="room-distribution-label">${room.revealed?'CLASS PICKS':'LIVE PICKS · TRAINER ONLY'}</span>${remote.answer_counts.map((count,index)=>`<span>${String.fromCharCode(65+index)} <b>${count}</b></span>`).join('')}</div>` : ''}</div>` : ''}${room.revealed ? `<div class="room-coaching"><span>COACHING TAKEAWAY</span><p>${e(question.explanation)}</p></div>` : ''}${room.phoneMode && room.revealed && remote.responses.length ? `<div class="room-reveal-feed"><strong>Round recap</strong>${remote.responses.map(person=>`<span>${e(person.nickname)} · ${e(remote.teams.find(team=>team.team_no===person.team_no)?.name||'Team')} · ${person.correct?'+'+person.awarded_points+' pts':'review the takeaway'}</span>`).join('')}</div>` : ''}<div class="room-round-actions"><div class="room-clock-wrap">${room.timerDuration ? `<div id="room-clock" class="room-clock ${room.timeLeft <= 5 ? 'is-urgent' : ''}">${roomTimeLabel(room.timerEndsAt ? Math.ceil((room.timerEndsAt-Date.now())/1000) : room.timeLeft)}</div><span id="room-clock-status">${room.timerEndsAt ? 'Round timer is running across the room.':room.timeLeft===0?'Time. Bring the room to a decision.':'Use the timer for energy, not pressure.'}</span><button class="micro-button" type="button" data-action="room-timer">${room.timerEndsAt?'Pause timer':room.timeLeft<room.timerDuration?'Resume timer':`Start ${room.timerDuration}-second timer`}</button>` : '<span class="room-untimed">Untimed discussion · no rush</span>'}</div><div class="room-round-buttons">${room.revealed ? `<button class="button button-flat button-primary" type="button" data-action="${room.roundIndex === (room.phoneMode?onlineTotal:activity.questions.length)-1?'room-finish':'room-next'}">${room.roundIndex === (room.phoneMode?onlineTotal:activity.questions.length)-1?'Finish room':'Next round'} <span aria-hidden="true">→</span></button>` : '<button class="button button-flat button-primary" type="button" data-action="room-reveal">Reveal coaching answer</button>'}</div></div></section>`;
  const joinPanel = room.phoneMode && !room.finished && room.joinCode ? `<section class="room-join-panel"><div class="room-join-copy"><span class="eyebrow">JOIN THE CLASSROOM</span><strong class="room-join-code">${e(room.joinCode)}</strong><span>Scan this QR code with a phone camera, or use the link below as a fallback.</span><code>${e(liveRoomHref(room.joinCode))}</code></div>${liveRoomQrMarkup(room.joinCode)}<div class="room-join-actions"><button class="button" type="button" data-action="room-copy-invite">Copy invite link</button></div></section>` : '';
  const undo = !room.phoneMode && room.history.length ? '<button class="micro-button" type="button" data-action="room-undo">Undo last point</button>' : '';
  const endRoom = room.phoneMode ? '<button class="micro-button" type="button" data-action="room-end">End phone room</button>' : '<button class="micro-button" type="button" data-action="room-exit">Exit room</button>';
  dialog.innerHTML = `<main class="live-room-shell"><header class="room-header"><div class="room-brand"><img src="../training-academy-logo.svg" alt=""><span><b>ACADEMY STUDIO</b><small>${room.phoneMode?'PHONE TEAM ROOM · LIVE SYNC':'LIVE TEAM ROOM · SESSION ONLY'}</small></span></div><div class="room-header-actions"><button class="micro-button" type="button" data-action="room-fullscreen">Fullscreen</button>${endRoom}</div></header><div class="room-content"><div class="room-title-line"><div><span class="eyebrow">${room.finished?'FINAL SCORE':'LIVE CLASSROOM ROUND'}</span><h1>${e(activity.title)}</h1><p>${room.phoneMode?'Every learner plays from their own phone. Think fast, learn together.':'Debate together. Think clearly. Learn the coaching move.'}</p></div><div class="room-round-badge">${room.finished?'DONE':`ROUND ${room.roundIndex+1}`}<span>${room.finished?'':`OF ${room.phoneMode?remote?.room.total_rounds:activity.questions.length}`}</span></div></div>${joinPanel}<div id="room-sync-warning" class="room-sync-warning" role="status">${e(room.syncError||'')}</div><section class="room-scoreboard" aria-label="Team score">${teams}</section>${roundContent}<footer class="room-footer"><span>${room.phoneMode?'Temporary scores · no roster, attendance, assessment, or XP changes.':'Room points are temporary and never change learner records.'}</span>${undo}</footer></div></main>`;
  dialog.classList.add('live-room-dialog');
  mountLiveRoomQrCodes(dialog);
  if (!room.finished && room.phoneMode && room.revealed) dialog.querySelector('.room-coaching')?.insertAdjacentHTML('afterend', liveClassroomDebrief(remote));
  if(room.finished)dialog.querySelectorAll('.room-team-label').forEach((label,index)=>{label.textContent=`PLACE ${String(index+1).padStart(2,'0')}${room.phoneMode?` · ${room.teams[index].playerCount} PLAYERS`:''}`;});
  if (!dialog.open) dialog.showModal();
}

async function showLiveRoomSetup(selectedActivityId = '') {
  if(!store.canWrite())return;
  openDialog('Loading live room','Loading the private facilitator deck from RED Academy.','<div class="status-state"><p>Preparing your trainer-led room…</p></div>');
  dialog.classList.add('live-room-dialog');
  try {
    if(!state.facilitatorDeck.length){const result=await store.api('activities/facilitator-deck');state.facilitatorDeck=result.activities||[];state.facilitatorDeck.forEach(registerActivityArabic);}
    if(!state.facilitatorDeck.length)throw new Error('No live challenges are available yet.');
    renderLiveRoomSetup('', selectedActivityId);
  } catch(error) {
    dialog.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">TRAINER-LED · SESSION ONLY</span><h2 id="dialog-title">Live room unavailable</h2><p>${e(error.message||'Could not load the facilitator deck.')}</p></div><button class="dialog-close" data-action="dialog-close" aria-label="Close dialog" type="button">×</button></div><div class="dialog-body"><div class="dialog-actions"><button class="button" type="button" data-action="dialog-close">Close</button><button class="button button-flat button-primary" type="button" data-action="live-room">Try again</button></div></div>`;
    dialog.classList.add('live-room-dialog');
  }
}

async function showLiveRooms() {
  if (!store.canWrite()) return;
  if (!state.liveRooms.length) { showToast('There are no live rooms available to resume.', true); return; }
  const rows = state.liveRooms.map(room => `<button class="live-room-resume-row" type="button" data-action="live-room-resume" data-room="${e(room.id)}"><span class="live-room-resume-mark" aria-hidden="true">${room.status === 'Complete' ? '✓' : '↗'}</span><span class="live-room-resume-copy"><strong>${e(room.title)}</strong><small>${room.status === 'Complete' ? 'Ready to replay' : `Round ${room.round_index + 1} of ${room.total_rounds}`} · ${room.players} joined · expires ${e(new Date(room.expires_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</small></span><span class="live-room-resume-arrow" aria-hidden="true">→</span></button>`).join('');
  openDialog('Resume a live room', 'Pick up where you left off. Existing learner phones stay connected; a fresh join code will be created for new joins.', `<div class="live-room-resume-list">${rows}</div><div class="room-privacy-note"><strong>Only you can control rooms you started.</strong><span>Rooms and temporary points expire automatically after four hours.</span></div>`);
  dialog.classList.add('live-room-dialog');
}

async function resumeLiveRoom(roomId, button) {
  if (!store.canWrite() || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(roomId)) return;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    if (!state.facilitatorDeck.length) {
      const deck = await store.api('activities/facilitator-deck');
      state.facilitatorDeck = deck.activities || [];
      state.facilitatorDeck.forEach(registerActivityArabic);
    }
    const result = await store.api('activities/live/resume', 'POST', { room_id: roomId });
    const savedDeck=result.room?.activity;
    const activity = state.facilitatorDeck.find(item => item.id === savedDeck?.id) || (Array.isArray(savedDeck?.questions)&&savedDeck.questions.length===result.room?.room?.total_rounds?savedDeck:null);
    if (!activity) throw new Error('This room’s challenge is no longer in the facilitator deck. Its saved room data has not changed.');
    stopLiveRoomTimer();
    stopLiveRoomSync();
    liveRoom = { activity, teams: [], roundIndex: 0, revealed: false, pointAwarded: false, history: [], timerDuration: 0, timeLeft: 0, timerEndsAt: 0, finished: false, phoneMode: true, roomId, joinCode: result.join_code, syncError: '' };
    applyLiveRoomSnapshot(result.room);
    renderLiveRoom();
    startLiveRoomSync();
  } catch (error) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    showToast(error.message || 'Could not resume the live room.', true);
  }
}

function closeLiveRoom() {
  stopLiveRoomTimer();
  stopLiveRoomSync();
  liveRoom=null;
  if(dialog.open)dialog.close();
  dialog.classList.remove('live-room-dialog');
}

function returnFromSessionPulse() {
  stopLiveRoomTimer();stopLiveRoomSync();liveRoom=null;
  if(sessionRun)renderSessionRun();
  else closeLiveRoom();
}

dialog.addEventListener('cancel',event=>{
  if(sessionPulseSetupOpen){event.preventDefault();cancelSessionPulseSetup();}
  else if(liveRoom?.mode==='pulse'&&liveRoom.sessionPulseReturn){event.preventDefault();showToast('Finish the pulse from its controls to return to the session.',true);}
});

dialog.addEventListener('close',()=>{if(dialog.open)return;stopLiveRoomTimer();stopLiveRoomSync();liveRoom=null;stopSessionRunTimer();stopRoleplayTimer();roleplayState=null;sessionRun=null;dialog.classList.remove('live-room-dialog','session-run-dialog','roleplay-dialog');dialog.removeAttribute('aria-label');dialog.setAttribute('aria-labelledby','dialog-title');if(document.fullscreenElement===document.documentElement)document.exitFullscreen().catch(()=>{});});

dialog.addEventListener('keydown',event=>{
  if(!sessionRun)return;
  if(dialog.classList.contains('roleplay-dialog'))return;
  const target=event.target;
  if(target instanceof HTMLElement&&target.closest('button,a,input,textarea,select,[contenteditable="true"]'))return;
  if(event.code==='Space'){event.preventDefault();toggleSessionRunTimer();}
  else if(event.key==='ArrowLeft'){event.preventDefault();selectSessionRunStep(sessionRun.stepIndex-1);}
  else if(event.key==='ArrowRight'){event.preventDefault();selectSessionRunStep(sessionRun.stepIndex+1);}
});

document.addEventListener('fullscreenchange',()=>{
  const buttonEl=dialog.querySelector('[data-action="session-run-fullscreen"]');
  if(buttonEl)buttonEl.textContent=document.fullscreenElement===document.documentElement?'Exit fullscreen':'Fullscreen';
});

function learnerHref(code) {
  return participantLink(location.href, `/learner/${code}`, participantOrigin);
}

async function showLearnerLinks(assignmentId) {
  if (!store.canWrite()) return;
  const assignment = state.assignments.find(row => row.id === assignmentId);
  if (assignment && assignment.status !== 'Open') { showToast('This challenge is no longer open.', true); return; }
  openDialog('Private trainee links', 'Each trainee gets a private, one-use link and matching QR code. Share each code only with its named trainee.', '<div id="links-progress" class="status-state"><p>Creating secure links for the current roster…</p></div>');
  try {
    const result = await store.api('activities/links', 'POST', { assignment_id: assignmentId });
    const links = result.links || [];
    const list = links.map(item => ({ name: item.trainee_name, href: learnerHref(item.code) }));
    const allText = list.map(item => `${item.name}\t${item.href}`).join('\n');
    const linksHtml = list.length ? `<div class="link-toolbar"><p>${list.length} active private link${list.length === 1 ? '' : 's'} · ${Number(result.already_submitted)||0} already completed</p><button class="micro-button" type="button" data-action="copy-all-links">Copy all links</button></div><div class="private-link-list">${list.map(item => `<article class="private-link-row"><div><strong>${e(item.name)}</strong><span>Unique quiz entry · share privately</span></div><a class="micro-button" href="${e(item.href)}" target="_blank" rel="noopener noreferrer">Open</a><button class="micro-button" type="button" data-action="copy-link" data-link="${e(item.href)}">Copy</button></article>`).join('')}</div><p class="link-security-note">The raw links are shown only now. The server stores a one-way hash; if you create them again, unsubmitted old links stop working.</p>` : `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">✓</span><h3>No links left to issue</h3><p>Every assigned trainee has already submitted. Completed results remain available in the assignment table.</p></div>`;
    const target = document.getElementById('links-progress');
    if (target) {
      target.outerHTML = `<div id="links-content" data-copy-all="${e(allText)}">${linksHtml}</div>`;
      const content = document.getElementById('links-content');
      content?.querySelectorAll('.private-link-row').forEach(row => {
        const person = row.querySelector('div');
        const openLink = row.querySelector('a');
        const copyButton = row.querySelector('[data-action="copy-link"]');
        if (!person || !openLink || !copyButton || !copyButton.dataset.link) return;

        const actions = document.createElement('div');
        actions.className = 'private-link-actions';
        const qrButton = document.createElement('button');
        qrButton.className = 'micro-button';
        qrButton.type = 'button';
        qrButton.dataset.action = 'show-link-qr';
        qrButton.dataset.link = copyButton.dataset.link;
        qrButton.setAttribute('aria-expanded', 'false');
        qrButton.textContent = 'Show QR';
        actions.append(qrButton, openLink, copyButton);

        const panel = document.createElement('div');
        panel.className = 'private-link-qr';
        panel.hidden = true;
        const frame = document.createElement('div');
        frame.className = 'qr-code-frame';
        const note = document.createElement('p');
        note.textContent = 'This QR code is private to this trainee. Share it only with them.';
        panel.append(frame, note);
        row.replaceChildren(person, actions, panel);
      });
    }
  } catch (error) {
    const target = document.getElementById('links-progress');
    if (target) target.innerHTML = `<p>${e(error.message || 'Could not create the learner links.')}</p><button class="micro-button" type="button" data-action="retry-links" data-assignment="${e(assignmentId)}">Try again</button>`;
  }
}

function currentTargetList(batchId, companyId, selected = new Set()) {
  const people = currentRoster(batchId, companyId);
  return people.map(person => `<label class="roster-option"><input type="checkbox" name="trainee_ids" value="${e(person.id)}" ${selected.has(person.id) ? 'checked' : ''}><span><strong>${e(person.trainee_name)}</strong><small>${e(companyName(person.company_id))}</small></span></label>`).join('') || '<p class="subtle">No active trainees match the selected batch and company.</p>';
}

function showAssignmentForm(selectedActivityId = '', selectedTraineeId = '', prefill = {}) {
  if (!store.canWrite()) return;
  if (!state.library.length) { showToast('Academy Studio is still loading. Try again in a moment.', true); return; }
  const batches = store.data.batches.filter(batch => !batch.archived_at);
  if (!batches.length) { showToast('Create or restore a batch before assigning activities.', true); return; }
  const targetTrainee = store.data.trainees.find(person => person.id === selectedTraineeId && person.enrollment_status !== 'Stopped Attending');
  const targetBatch = targetTrainee && batches.find(batch => batch.id === targetTrainee.batch_id);
  const prefilledBatch = batches.find(batch => batch.id === prefill.batchId);
  const defaultBatch = targetBatch?.id || prefilledBatch?.id || (state.batchId && batches.some(batch => batch.id === state.batchId) ? state.batchId : batches.find(batch => batch.status === 'Active')?.id || batches[0].id);
  const companies = store.data.companies.slice().sort((a, b) => a.name.localeCompare(b.name));
  const preselected = new Set(targetTrainee ? [targetTrainee.id] : currentRoster(defaultBatch).map(person => person.id));
  const html = `<form id="assignment-form"><div class="form-grid"><div class="field"><label for="assignment-batch">Batch</label><select id="assignment-batch" name="batch_id" required>${options(batches, defaultBatch, row => row.id, row => row.batch_name)}</select></div><div class="field"><label for="assignment-activity">Academy Studio challenge</label><select id="assignment-activity" name="activity_id" required>${state.library.map(activity => `<option value="${e(activity.id)}">${e(activity.title)} · ${e(activity.duration_minutes)} min</option>`).join('')}</select></div><div class="field"><label for="assignment-company">Target company</label><select id="assignment-company" name="company_id"><option value="">All companies in batch</option>${options(companies, '', row => row.id, row => row.name)}</select></div><div class="field"><label for="assignment-due">Due date <span class="subtle">(optional)</span></label><input id="assignment-due" name="due_date" type="date"></div><div class="field field-full"><label for="assignment-instructions">Trainer mission briefing</label><textarea id="assignment-instructions" name="instructions" maxlength="2000" placeholder="Set the scene, team focus, or any context to read before starting."></textarea></div></div><div class="studio-assignment-note"><strong>One private link and QR per trainee</strong><span>After assigning, create learner links. Each trainee gets a matching one-use QR; show it only to its named trainee. Scores are calculated on the server and appear here live.</span></div><div class="roster-toolbar"><div><strong id="roster-count"></strong><span> Active, non-stopped trainees from this batch</span></div><button class="micro-button" type="button" data-action="select-visible">Select visible</button></div><div class="roster-list" id="roster-list">${currentTargetList(defaultBatch, '', preselected)}</div><div class="form-error" id="assignment-error" hidden></div><div class="dialog-actions"><button class="button" type="button" data-action="dialog-close">Cancel</button><button class="button button-flat button-primary" type="submit">Assign challenge</button></div></form>`;
  openDialog('Build a classroom challenge', 'Choose a short quiz, select a real batch roster, then share each trainee’s private entry link.', html);
  const form = document.getElementById('assignment-form');
  if (state.library.some(activity => activity.id === selectedActivityId)) form.elements.activity_id.value = selectedActivityId;
  const batchField = form.elements.batch_id;
  const companyField = form.elements.company_id;
  const roster = document.getElementById('roster-list');
  const counter = document.getElementById('roster-count');
  const drawRoster = (reset = false) => {
    const selected = reset ? new Set() : new Set([...form.querySelectorAll('[name="trainee_ids"]:checked')].map(input => input.value));
    if (reset) currentRoster(batchField.value).forEach(person => selected.add(person.id));
    const eligible = currentRoster(batchField.value, companyField.value);
    roster.innerHTML = currentTargetList(batchField.value, companyField.value, selected);
    counter.textContent = `${eligible.filter(person => selected.has(person.id)).length} / ${eligible.length} selected`;
  };
  if (prefill.sessionPlanId) {
    if (currentRoster(batchField.value).some(person => person.company_id === prefill.companyId)) companyField.value = prefill.companyId;
    form.elements.due_date.value = prefill.dueDate || '';
    form.elements.instructions.value = prefill.instructions || '';
    drawRoster(true);
    document.getElementById('dialog-title').textContent = prefill.isSpacedReview ? 'Assign the spaced review' : 'Assign the session quiz';
    dialog.querySelector('.dialog-head p').textContent = `${prefill.sessionTitle || 'This classroom session'} · the linked challenge and active roster are preselected. Each trainee gets a private quiz link; links are prepared here for you to share and are not sent automatically.`;
    form.querySelector('.studio-assignment-note strong').textContent = prefill.isSpacedReview ? 'Review day · individual retrieval' : 'Connected to this session plan';
    form.querySelector('.studio-assignment-note span').textContent = 'Scores and XP follow the standard Academy challenge rules. This does not create attendance or a formal assessment.';
    form.querySelector('[type="submit"]').textContent = 'Assign and prepare private links';
  }
  if (targetTrainee && targetTrainee.batch_id === defaultBatch) { companyField.value = targetTrainee.company_id || ''; drawRoster(); }
  const updateRosterCount = () => {
    const selected = new Set([...form.querySelectorAll('[name="trainee_ids"]:checked')].map(input => input.value));
    const eligible = currentRoster(batchField.value, companyField.value);
    counter.textContent = `${eligible.filter(person => selected.has(person.id)).length} / ${eligible.length} selected`;
  };
  batchField.addEventListener('change', () => { companyField.value = ''; drawRoster(true); });
  companyField.addEventListener('change', () => drawRoster());
  roster.addEventListener('change', updateRosterCount);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const errorBox = document.getElementById('assignment-error');
    const buttonEl = form.querySelector('[type="submit"]');
    const traineeIds = [...form.querySelectorAll('[name="trainee_ids"]:checked')].map(input => input.value);
    if (!traineeIds.length) { errorBox.hidden = false; errorBox.textContent = 'Select at least one trainee.'; return; }
    buttonEl.disabled = true;
    try {
      const created = await store.api('activities/assign', 'POST', { batch_id: batchField.value, activity_id: form.elements.activity_id.value, due_date: form.elements.due_date.value || null, instructions: form.elements.instructions.value, trainee_ids: traineeIds, session_plan_id: prefill.sessionPlanId || null });
      dialog.close();
      await refreshAssignments();
      if (prefill.prepareLinks && created.record?.id) await showLearnerLinks(created.record.id);
      else showToast(`Assigned to ${traineeIds.length} trainee${traineeIds.length === 1 ? '' : 's'}.`);
    } catch (error) {
      errorBox.hidden = false;
      errorBox.textContent = error.message || 'Could not save this assignment. Refresh and try again.';
      buttonEl.disabled = false;
    }
  });
};

function activePlanCompanies(batchId,selected='') {
  const eligible=new Set(store.data.trainees.filter(person=>person.batch_id===batchId&&person.enrollment_status!=='Stopped Attending'&&person.company_id).map(person=>person.company_id));
  const companies=store.data.companies.filter(company=>eligible.has(company.id)).slice().sort((a,b)=>a.name.localeCompare(b.name));
  return `<option value="">All companies in this batch</option>${options(companies,selected,row=>row.id,row=>row.name)}`;
}

function suggestedPlanDate(batchId) {
  const dates=store.data.batches.find(batch=>batch.id===batchId)?.session_dates||[];
  return dates.filter(date=>date>=today()).sort()[0]||today();
}

function spacedReviewDateSuggestion(batchId,spacing) {
  const dates=(store.data.batches.find(batch=>batch.id===batchId)?.session_dates||[]).filter(date=>typeof date==='string').sort();
  const latestPlan=state.sessionPlans.filter(plan=>plan.batch_id===batchId&&typeof plan.session_date==='string').map(plan=>plan.session_date).sort().at(-1);
  const anchor=latestPlan||today(),laterDates=dates.filter(date=>date>anchor);
  if(laterDates.length>=spacing)return {date:laterDates[spacing-1],note:`Suggested after ${spacing} scheduled session${spacing===1?'':'s'} from the latest planned class. Change the date if needed.`};
  if(laterDates.length)return {date:laterDates.at(-1),note:`Only ${laterDates.length} later batch ${laterDates.length===1?'session date is':'session dates are'} recorded. Adjust the date if you want a wider review gap.`};
  return {date:suggestedPlanDate(batchId),note:'No later batch session dates are recorded. Choose the review date that fits the class calendar.'};
}

function showSessionPlanForm(selectedActivityId='',prefill={}) {
  if(!store.canWrite())return;
  if(!state.library.length||!state.sessionSkills.length){showToast('Session planning is still loading. Try again in a moment.',true);return;}
  const batches=store.data.batches.filter(batch=>!batch.archived_at);
  if(!batches.length){showToast('Create or restore a batch before planning a class session.',true);return;}
  const defaultBatch=state.batchId&&batches.some(batch=>batch.id===state.batchId)?state.batchId:batches.find(batch=>batch.status==='Active')?.id||batches[0].id;
  const activity=state.library.find(item=>item.id===selectedActivityId)||state.library[0];
  const defaultCompany=activePlanCompanies(defaultBatch).includes(`value="${state.companyId}"`)&&state.companyId?state.companyId:'';
  const skill=state.sessionSkills.find(item=>item.id===prefill.focusSkill)?.id||state.sessionSkills.find(item=>activity.category.toLocaleLowerCase().includes(item.label.toLocaleLowerCase()))?.id||'discovery';
  const spacedReview=prefill.spacedReview===true,reviewSpacing=spacedReview&&[1,2,3].includes(Number(prefill.spacing))?Number(prefill.spacing):2;
  const reviewSuggestion=spacedReview?spacedReviewDateSuggestion(defaultBatch,reviewSpacing):null;
  const duration=Math.min(120,Math.max(30,activity.duration_minutes+15));
  const dates=store.data.batches.find(batch=>batch.id===defaultBatch)?.session_dates||[];
  const dateOptions=dates.map(date=>`<option value="${e(date)}"></option>`).join('');
  const html=`<form id="session-plan-form"><div class="plan-form-intro"><strong>One good class, four connected moments.</strong><span>Shape a short recall spark, a team challenge, a coaching huddle and a practical exit ticket. This plan is shared with your trainer team; choosing a date here does not alter attendance.</span></div><div class="form-grid"><div class="field"><label for="plan-batch">Batch</label><select id="plan-batch" name="batch_id" required>${options(batches,defaultBatch,row=>row.id,row=>row.batch_name)}</select></div><div class="field"><label for="plan-company">Company focus <span class="subtle">(optional)</span></label><select id="plan-company" name="company_id">${activePlanCompanies(defaultBatch,defaultCompany)}</select></div><div class="field"><label for="plan-date">Session date</label><input id="plan-date" name="session_date" type="date" list="plan-session-dates" value="${e(suggestedPlanDate(defaultBatch))}" required><datalist id="plan-session-dates">${dateOptions}</datalist><small class="plan-field-note">Scheduled batch dates are suggestions only.</small></div><div class="field"><label for="plan-title">Session title</label><input id="plan-title" name="title" maxlength="120" minlength="3" value="${e(activity.title+' classroom session')}" required></div><div class="field"><label for="plan-focus">Learning focus</label><select id="plan-focus" name="focus_skill" required>${state.sessionSkills.map(item=>`<option value="${e(item.id)}" ${item.id===skill?'selected':''}>${e(item.label)}</option>`).join('')}</select></div><div class="field"><label for="plan-activity">Team challenge</label><select id="plan-activity" name="activity_id" required>${state.library.map(item=>`<option value="${e(item.id)}" ${item.id===activity.id?'selected':''}>${e(item.title)} · ${e(item.duration_minutes)} min</option>`).join('')}</select></div><div class="field"><label for="plan-duration">Total class time (minutes)</label><input id="plan-duration" name="duration_minutes" type="number" min="${activity.duration_minutes+9}" max="120" step="1" value="${duration}" required><small class="plan-field-note" id="plan-duration-note">Includes the challenge plus time to open, discuss and reflect.</small></div></div><div class="plan-outline-preview"><span class="eyebrow">YOUR FOUR-PART FLOW</span><div><span>01 · Warm-up</span><span>02 · Live challenge</span><span>03 · Coaching huddle</span><span>04 · Exit ticket</span></div></div><p class="form-error" id="session-plan-error" hidden></p><div class="dialog-actions"><button class="button" type="button" data-action="dialog-close">Cancel</button><button class="button button-flat button-primary" type="submit">Save shared session plan</button></div></form>`;
  openDialog(spacedReview?'Plan a spaced review':'Plan a classroom session',spacedReview?'Bring a high-signal skill back at the right interval.':'Build a practical run-of-show the next trainer can continue.',html);
  const form=document.getElementById('session-plan-form'),batchField=form.elements.batch_id,companyField=form.elements.company_id,dateField=form.elements.session_date,activityField=form.elements.activity_id,durationField=form.elements.duration_minutes,focusField=form.elements.focus_skill;
  const sessionCueMarkup=`<details class="session-cue-editor"><summary>Make the facilitator prompts your own</summary><p>These prompts appear in facilitation mode and are shared with every trainer. You can edit them directly or ask the AI co-planner for a first draft.</p>${[
    ['spark','01 · Warm-up','What question will quickly bring the class back to this skill?'],
    ['quest','02 · Live challenge','Host this challenge as a team round. Let trainees commit to an answer before revealing the coaching takeaway.'],
    ['huddle','03 · Coaching huddle','Which choice made the strongest move, what was it protecting, and how would you say it in a real client conversation?'],
    ['exit','04 · Exit ticket','In one sentence, name one action or phrase you will use in your next client conversation.'],
  ].map(([id,label,prompt])=>`<label class="field"><span>${e(label)}</span><textarea data-step-prompt="${id}" maxlength="700" minlength="8" rows="2" required>${e(prompt)}</textarea></label>`).join('')}</details><section class="session-ai-panel"><div><span class="eyebrow">OPTIONAL AI CO-PLANNER</span><strong>Turn a lesson brief into four classroom-ready prompts</strong><p>Only the selected learning focus, challenge details, and notes below are sent. Trainee names, roster, scores, attendance, and answer keys are never included.</p></div><label class="field"><span>Lesson notes <small>(optional · max 1,600 characters)</small></span><textarea id="session-ai-notes" maxlength="1600" rows="2" placeholder="Topic, a concept to revisit, or the skill learners should transfer to a client conversation."></textarea></label><label class="session-ai-consent"><input id="session-ai-consent" type="checkbox"><span>I consent to send this lesson brief to the configured AI provider for an unsaved draft. I will review it before saving.</span></label><div class="session-ai-actions"><button class="micro-button" type="button" data-action="session-ai-draft" ${store.aiPolishEnabled?'':'disabled'}>Draft facilitator prompts</button><span id="session-ai-status" role="status">${store.aiPolishEnabled?'AI is optional. Your class plan is not saved until you submit it.':'AI is not configured; edit the four prompts above instead.'}</span></div></section>`;
  form.querySelector('.plan-outline-preview').insertAdjacentHTML('afterend',sessionCueMarkup);
  const cueFields=[...form.querySelectorAll('[data-step-prompt]')];
  const defaultPrompts=()=>{
    const label=state.sessionSkills.find(item=>item.id===focusField.value)?.label||'the selected skill';
    const openers={discovery:"Before recommending a property, what open question would uncover the client's real goal?",qualification:'What question separates a client must-have from a preference?',accuracy:'Which detail should be verified before it is shared, and where would you check it?',objections:'A client says “That feels expensive.” What calm question would you ask before responding?',ethics:'You cannot verify a detail yet. What would you say while you check it?',followthrough:'What makes a follow-up promise specific enough for a client to rely on?',viewing:'Which client priority would you anchor a property viewing to?',teamwork:'What must a clean client handoff make clear to the teammate taking over?'};
    return {spark:openers[focusField.value]||`What do you already know about ${label.toLocaleLowerCase()}?`,quest:'Host this challenge as a team round. Let trainees commit to an answer before revealing the coaching takeaway.',huddle:`Which choice made the strongest move for ${label.toLocaleLowerCase()}, what was it protecting, and how would you use it in a real client conversation?`,exit:'In one sentence, name one action or phrase you will use in your next client conversation.'};
  };
  const refreshDefaultCues=()=>{const prompts=defaultPrompts();for(const field of cueFields)if(field.dataset.edited!=='true')field.value=prompts[field.dataset.stepPrompt];};
  for(const field of cueFields)field.addEventListener('input',()=>{field.dataset.edited='true';});
  focusField.addEventListener('change',refreshDefaultCues);
  form.querySelector('[data-action="session-ai-draft"]').addEventListener('click',async event=>{
    const button=event.currentTarget,status=document.getElementById('session-ai-status');
    if(!document.getElementById('session-ai-consent').checked){status.textContent='Check the consent box before sending the lesson brief to AI.';return;}
    button.disabled=true;status.textContent='Drafting four prompts. Your session plan remains unsaved.';
    try{
      const draft=await store.api('ai','POST',{kind:'draft-session-prompts',consent:true,language:interfaceLanguage,activity_id:activityField.value,focus_skill:focusField.value,lesson_notes:document.getElementById('session-ai-notes').value});
      for(const [stepId,prompt] of Object.entries(draft.step_prompts||{})){const field=form.querySelector(`[data-step-prompt="${stepId}"]`);if(field){field.value=prompt;field.dataset.edited='true';}}
      status.textContent='AI draft ready. Review and edit all four prompts, then save the shared session when you are happy with it.';
    }catch(error){status.textContent=error.message||'Could not draft prompts. Your current session edits are still here.';}
    finally{if(button.isConnected)button.disabled=!store.aiPolishEnabled;}
  });
  const focusLabel=()=>state.sessionSkills.find(item=>item.id===focusField.value)?.label||'class practice';
  let autoReviewTitle=spacedReview?`Spaced review · ${state.sessionSkills.find(item=>item.id===skill)?.label||'class practice'} · ${reviewSpacing} sessions`:'';
  if(spacedReview){
    form.querySelector('[type="submit"]').textContent='Save spaced review';
    const intro=form.querySelector('.plan-form-intro');
    intro.querySelector('strong').textContent=`Bring ${state.sessionSkills.find(item=>item.id===skill)?.label||'this skill'} back after a gap.`;
    intro.querySelector('span').textContent='The cohort pulse selected this challenge from completed quiz patterns. Choose a review gap; the suggested batch date is editable and no attendance is created.';
    form.elements.title.value=autoReviewTitle;
    form.querySelector('.form-grid').insertAdjacentHTML('beforeend',`<div class="field"><label for="plan-review-spacing">Bring the skill back after</label><select id="plan-review-spacing" name="review_spacing"><option value="1" ${reviewSpacing===1?'selected':''}>1 scheduled session</option><option value="2" ${reviewSpacing===2?'selected':''}>2 scheduled sessions</option><option value="3" ${reviewSpacing===3?'selected':''}>3 scheduled sessions</option></select><small class="plan-field-note">A spaced retrieval rep helps the class recall this skill after a gap.</small></div>`);
    dateField.value=reviewSuggestion.date;
    form.querySelector('#plan-date')?.closest('.field')?.querySelector('small')?.replaceChildren(document.createTextNode(reviewSuggestion.note));
  }
  const updateDateSuggestions=()=>{
    const next=store.data.batches.find(batch=>batch.id===batchField.value);
    document.getElementById('plan-session-dates').innerHTML=(next?.session_dates||[]).map(date=>`<option value="${e(date)}"></option>`).join('');
  };
  const updateChallengeTiming=()=>{
    const selected=state.library.find(item=>item.id===activityField.value);
    if(!selected)return;
    const minimum=selected.duration_minutes+9;
    durationField.min=String(minimum);
    if(Number(durationField.value)<minimum)durationField.value=String(Math.min(120,Math.max(30,selected.duration_minutes+15)));
    document.getElementById('plan-duration-note').textContent=`The selected challenge takes ${selected.duration_minutes} minutes; allow at least ${minimum} minutes total for the complete class flow.`;
  };
  batchField.addEventListener('change',()=>{
    companyField.innerHTML=activePlanCompanies(batchField.value);
    const suggestion=spacedReview?spacedReviewDateSuggestion(batchField.value,Number(form.elements.review_spacing.value)):null;
    dateField.value=suggestion?.date||suggestedPlanDate(batchField.value);
    if(suggestion)form.querySelector('#plan-date')?.closest('.field')?.querySelector('small')?.replaceChildren(document.createTextNode(suggestion.note));
    updateDateSuggestions();
  });
  activityField.addEventListener('change',updateChallengeTiming);
  if(spacedReview){
    form.elements.review_spacing.addEventListener('change',()=>{
      const spacing=Number(form.elements.review_spacing.value),suggestion=spacedReviewDateSuggestion(batchField.value,spacing);
      dateField.value=suggestion.date;form.querySelector('#plan-date')?.closest('.field')?.querySelector('small')?.replaceChildren(document.createTextNode(suggestion.note));
      const previousTitle=`Spaced review · ${focusLabel()} · ${spacing===1?'1 session':`${spacing} sessions`}`;
      if(!autoReviewTitle||form.elements.title.value.startsWith('Spaced review · '))form.elements.title.value=previousTitle;
      autoReviewTitle=previousTitle;
    });
    focusField.addEventListener('change',()=>{
      if(form.elements.title.value.startsWith('Spaced review · ')){
        autoReviewTitle=`Spaced review · ${focusLabel()} · ${form.elements.review_spacing.value} ${Number(form.elements.review_spacing.value)===1?'session':'sessions'}`;
        form.elements.title.value=autoReviewTitle;
      }
    });
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const errorBox=document.getElementById('session-plan-error'),submit=form.querySelector('[type="submit"]');
    errorBox.hidden=true;submit.disabled=true;
    try{
      const step_prompts=Object.fromEntries(cueFields.map(field=>[field.dataset.stepPrompt,field.value]));
      await store.api('activities/session-plans','POST',{batch_id:batchField.value,company_id:companyField.value||null,session_date:dateField.value,title:form.elements.title.value,focus_skill:focusField.value,duration_minutes:Number(durationField.value),activity_id:activityField.value,step_prompts});
      dialog.close();await refreshAssignments();showToast(spacedReview?'Spaced review saved to the shared classroom board.':'Session saved to the shared classroom board.');
    }catch(error){errorBox.hidden=false;errorBox.textContent=error.message||'Could not save this session. Refresh and try again.';submit.disabled=false;}
  });
}

function showProgressForm(assignmentId, traineeId) {
  if (!store.canWrite()) return;
  const assignment = state.assignments.find(row => row.id === assignmentId);
  const person = assignment?.participants?.find(row => row.trainee_id === traineeId);
  if (!assignment || !person || assignment.status !== 'Open') { showToast('This assignment changed. Refresh before editing progress.', true); return; }
  const content = `<form id="progress-form"><p class="assignment-meta"><b>${e(person.trainee_name)}</b> · ${e(assignment.title)} · ${e(assignment.batch_name)}</p><div class="form-grid"><div class="field"><label for="progress-status">Progress status</label><select id="progress-status" name="status">${['Assigned', 'In Progress', 'Completed'].map(status => `<option ${person.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><div class="field"><label for="progress-score">Trainer score <span class="subtle">(optional / 100)</span></label><input id="progress-score" name="score" type="number" min="0" max="100" step="0.1" value="${person.score === null ? '' : e(person.score)}" placeholder="Leave blank if not scored"></div><div class="field field-full"><label for="progress-feedback">Coaching feedback</label><textarea id="progress-feedback" name="trainer_feedback" maxlength="4000" placeholder="Specific, constructive feedback for this trainee.">${e(person.trainer_feedback || '')}</textarea></div></div><div class="form-error" id="progress-error" hidden></div><div class="dialog-actions"><button class="button" type="button" data-action="dialog-close">Cancel</button><button class="button button-flat button-primary" type="submit">Save coaching update</button></div></form>`;
  openDialog('Trainee coaching update', 'Trainer-entered progress is saved to the shared Academy record.', content);
  document.getElementById('progress-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const buttonEl = form.querySelector('[type="submit"]');
    const errorBox = document.getElementById('progress-error');
    const rawScore = form.elements.score.value;
    buttonEl.disabled = true;
    try {
      await store.api('activities/participant', 'PATCH', { assignment_id: assignment.id, trainee_id: person.trainee_id, expected_version: person.version, status: form.elements.status.value, score: rawScore === '' ? null : Number(rawScore), trainer_feedback: form.elements.trainer_feedback.value });
      dialog.close();
      await refreshAssignments();
      showToast('Progress and feedback saved for the team.');
    } catch (error) {
      errorBox.hidden = false;
      errorBox.textContent = error.message || 'Could not save progress. Refresh and try again.';
      buttonEl.disabled = false;
    }
  });
}

const learnerRoute = location.hash.startsWith('#/learner');
const learnerMatch = /^#\/learner\/([A-Za-z0-9_-]{43})$/.exec(location.hash);
const learnerState = { code: learnerMatch?.[1] || '', data: null, mode: 'intro', index: 0, studyIndex: 0, studyQueue: [], studyPass: 1, studyFlipped: false, studyRevisit: new Set(), studyNeedsPractice: new Set(), reviewQueue: [], reviewIndex: 0, reviewPass: 1, reviewRevisit: new Set(), reviewStillFuzzy: new Set(), reviewRevealed: false, answers: new Map(), hints: new Set(), confidence: new Map(), draftTimer: null, draftQueue: Promise.resolve(), draftRevision: 0, draftVersion: 0, draftStatus: '', busy: false, error: '' };
const liveRoomMatch = /^#\/room\/([2-9A-HJ-NP-Z]{10})$/i.exec(location.hash);
const livePlayer = { code: liveRoomMatch?.[1]?.toUpperCase() || '', seatToken: '', info: null, data: null, busy: false, error: '', pollTimer: null, clockTimer: null, rendered: '', sequenceDrafts: new Map(), confidenceDrafts: new Map() };

async function learnerRequest(route, body) {
  const response = await fetch(store.endpoint(route), {
    method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json', 'X-Red-Request': '1' }, body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({ error: 'The Academy server returned an invalid response.' }));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

function learnerDraftPayload() {
  const quiz=learnerState.data?.quiz;
  if(!quiz)return null;
  const answers=quiz.questions.filter(question=>learnerState.answers.has(question.id)).map(question=>({question_id:question.id,choice:learnerState.answers.get(question.id),used_hint:learnerState.hints.has(question.id)}));
  return {code:learnerState.code,answers,current_index:learnerState.index,expected_version:learnerState.draftVersion};
}

function showLearnerDraftStatus() {
  const status=document.getElementById('learner-draft-status');
  if(!status)return;
  const messages={saving:'Saving your private progress…',saved:'Progress saved. You can safely return to this same link later.',error:'Progress has not synced yet. Keep this link open and try again when connected.',conflict:'This link was updated in another open session. Reload to continue with the latest progress.'};
  status.textContent=messages[learnerState.draftStatus]||'Progress saves privately as you go.';
  status.classList.toggle('draft-save-error',learnerState.draftStatus==='error');
  status.setAttribute('aria-live','polite');
}

function queueLearnerDraftSave(immediate=false) {
  if(!learnerState.answers.size||!learnerState.data?.quiz||!learnerState.code)return Promise.resolve();
  learnerState.draftRevision++;
  learnerState.draftStatus='saving';
  showLearnerDraftStatus();
  clearTimeout(learnerState.draftTimer);
  if(immediate)return flushLearnerDraft();
  learnerState.draftTimer=setTimeout(()=>{void flushLearnerDraft();},450);
  return Promise.resolve();
}

function flushLearnerDraft(allowBusy=false) {
  clearTimeout(learnerState.draftTimer);
  learnerState.draftTimer=null;
  if(!learnerState.answers.size||!learnerState.data?.quiz||(!allowBusy&&learnerState.busy))return learnerState.draftQueue;
  const revision=learnerState.draftRevision;
  learnerState.draftQueue=learnerState.draftQueue.catch(()=>{}).then(async()=>{
    if(revision!==learnerState.draftRevision)return;
    const payload=learnerDraftPayload();
    if(!payload?.answers.length)return;
    learnerState.draftStatus='saving';
    showLearnerDraftStatus();
    try{
      const saved=await learnerRequest('activities/learner/draft',payload);
      if(Number.isSafeInteger(saved.version))learnerState.draftVersion=saved.version;
      if(revision===learnerState.draftRevision){learnerState.draftStatus='saved';showLearnerDraftStatus();}
    }catch(error){
      if(revision===learnerState.draftRevision){learnerState.draftStatus=String(error?.message||'').includes('updated in another open session')?'conflict':'error';showLearnerDraftStatus();}
    }
  });
  return learnerState.draftQueue;
}

function mountLearnerSkillSignals(result) {
  const summary = result?.skill_summary || [];
  if (!summary.length) return;
  const panel = document.createElement('section');
  panel.className = 'skill-signals';
  panel.setAttribute('aria-label', 'Skill signals from this challenge');
  const heading = document.createElement('div');
  heading.className = 'skill-signals-heading';
  const title = document.createElement('strong');
  title.textContent = 'Your skill signals';
  const note = document.createElement('span');
  note.textContent = 'A quick practice snapshot from this challenge—not a complete skill assessment.';
  heading.append(title,note);
  const list = document.createElement('div');
  list.className = 'skill-signals-list';
  for (const signal of summary) {
    const row = document.createElement('div');
    row.className = `skill-signal-row ${signal.correct < signal.attempted ? 'needs-practice' : 'strong-signal'}`;
    const label = document.createElement('strong');
    label.textContent = signal.label;
    const score = document.createElement('span');
    score.textContent = `${signal.correct} / ${signal.attempted} correct`;
    const meter = document.createElement('progress');
    meter.max = 100;
    meter.value = Math.max(0,Math.min(100,Number(signal.accuracy)||0));
    meter.setAttribute('aria-label',`${signal.label}: ${signal.correct} of ${signal.attempted} correct`);
    const status = document.createElement('small');
    status.textContent = signal.correct < signal.attempted ? 'Practice this again' : 'Looking steady';
    row.append(label,score,meter,status);
    list.append(row);
  }
  panel.append(heading,list);
  document.querySelector('.result-review')?.before(panel);
}

function learnerShell(content) {
  const brand = participantHost
    ? '<span class="brand" aria-label="Red Training Academy"><img src="../training-academy-logo.svg" alt="Red Training Academy"><span class="brand-copy"><span>Academy Studio</span></span></span>'
    : `<a class="brand" href="${e(portalUrl())}" aria-label="Return to Xcelias portal"><img src="../training-academy-logo.svg" alt="Red Training Academy"><span class="brand-copy"><span>Academy Studio</span></span></a>`;
  app.innerHTML = `<main class="learner-shell"><header class="learner-header">${brand}<span class="private-label"><i></i> PRIVATE TRAINEE SESSION</span>${localeSwitch()}</header>${content}</main>`;
  if (participantHost) removeParticipantExitLinks();
  if (app.querySelector('.result-screen')) mountLearnerSkillSignals(learnerState.result);
}

function removeParticipantExitLinks() {
  const root = new URL(portalUrl());
  app.querySelectorAll('a[href]').forEach(link => {
    try {
      const target = new URL(link.href);
      if (target.origin !== root.origin || target.pathname !== root.pathname || target.search || target.hash) return;
      const replacement = document.createElement('span');
      replacement.className = link.className;
      replacement.textContent = 'You can close this page.';
      link.replaceWith(replacement);
    } catch {}
  });
}

function learnerNotice(title, message, isError = false) {
  learnerShell(`<section class="learner-card learner-notice ${isError ? 'learner-error' : ''}"><span class="eyebrow">ACADEMY STUDIO</span><h1>${e(title)}</h1><p>${e(message)}</p>${isError ? `<a class="button" href="${e(portalUrl())}">Return to portal</a>` : '<div class="learner-loader" aria-label="Loading"></div>'}</section>`);
}

function learnerQuestion() {
  const data = learnerState.data, quiz = data.quiz, question = quiz.questions[learnerState.index];
  const selected = learnerState.answers.get(question.id);
  const hintUsed = learnerState.hints.has(question.id);
  const confidence=learnerState.confidence.get(question.id)||'';
  const percent = Math.round((learnerState.index + 1) / quiz.questions.length * 100);
  const choices = question.options.map((option,index) => `<label class="answer-option ${selected === index ? 'is-selected' : ''}"><input type="radio" name="learner-choice" value="${index}" ${selected === index ? 'checked' : ''}><span class="answer-letter">${String.fromCharCode(65+index)}</span><span>${e(option)}</span></label>`).join('');
  const confidenceCheck=`<fieldset class="confidence-check"><legend>How sure do you feel? <span>Optional · not graded</span></legend><div><label class="confidence-option ${confidence==='thinking'?'is-selected':''}"><input type="radio" name="learner-confidence" value="thinking" ${confidence==='thinking'?'checked':''}><span>Still thinking</span></label><label class="confidence-option ${confidence==='confident'?'is-selected':''}"><input type="radio" name="learner-confidence" value="confident" ${confidence==='confident'?'checked':''}><span>Pretty sure</span></label></div><small>Only used for your own reflection in this session. It is not sent to your trainer.</small></fieldset>`;
  const hint = question.hint ? `<div class="hint-choice"><div><strong>${hintUsed ? 'Nudge unlocked' : 'Need a nudge?'}</strong><span>${hintUsed ? 'This correct answer can earn up to 70 XP.' : 'Reveal a coaching hint. A correct answer can then earn up to 70 instead of 100 XP.'}</span></div>${hintUsed ? '<span class="hint-spent">USED</span>' : '<button class="micro-button" type="button" data-action="learner-hint">Reveal hint</button>'}</div>${hintUsed ? `<div class="revealed-hint"><span>COACHING NUDGE</span><p>${e(question.hint)}</p></div>` : ''}` : '';
  const previous = learnerState.index > 0 ? '<button class="button" type="button" data-action="learner-previous">Previous</button>' : '<span></span>';
  const last = learnerState.index === quiz.questions.length - 1;
  const forward = last ? `<button class="button button-flat button-primary" type="button" data-action="learner-submit" ${learnerState.answers.size !== quiz.questions.length || learnerState.busy ? 'disabled' : ''}>${learnerState.busy ? 'Saving your result…' : 'Finish challenge'}</button>` : `<button class="button button-flat button-primary" type="button" data-action="learner-next" ${selected === undefined ? 'disabled' : ''}>Next round <span aria-hidden="true">→</span></button>`;
  learnerShell(`<section class="learner-card quiz-play"><div class="quiz-play-head"><div><span class="eyebrow">${e(quiz.category)} · ${e(quiz.level)}</span><h1>${e(data.title)}</h1><p>Welcome, ${e(data.trainee_name)}${data.instructions ? ` · ${e(data.instructions)}` : ''}</p></div><span class="timer-chip">~ ${e(quiz.duration_minutes)} MIN</span></div><div class="quiz-progress-meta"><span>ROUND ${learnerState.index+1} OF ${quiz.questions.length}</span><span>${percent}%</span></div><div class="quiz-progress step-${learnerState.index+1}" role="progressbar" aria-valuemin="0" aria-valuemax="${quiz.questions.length}" aria-valuenow="${learnerState.index+1}"><span></span></div><div class="question-card"><span class="question-number">QUESTION ${learnerState.index+1}</span><h2>${e(question.prompt)}</h2>${hint}<div class="answer-list">${choices}</div>${confidenceCheck}</div>${learnerState.error ? `<div class="error-box" role="alert">${e(learnerState.error)}</div>` : ''}<div class="quiz-nav">${previous}${forward}</div><p id="learner-draft-status" class="quiz-draft-status"></p><p class="quiz-private-foot">Your accuracy is based on the answer, not the hint. Independent correct answers earn 100 XP; a correct answer after a nudge earns 70 XP.</p></section>`);
  showLearnerDraftStatus();
}

function learnerIntro() {
  const data=learnerState.data,quiz=data.quiz,cards=quiz.study_cards||[];
  const draft=data.draft,hasProgress=!!draft?.updated_at&&Array.isArray(draft.answers)&&draft.answers.length>0;
  const resume=hasProgress?`<section class="quiz-resume-banner"><span class="resume-orbit" aria-hidden="true">↗</span><div><strong>Your challenge is saved</strong><p>${draft.answers.length} of ${quiz.questions.length} rounds answered. Your choices and any coaching nudges are private to this link.</p></div><button class="button button-flat button-primary" type="button" data-action="learner-resume">Continue round ${Math.min(draft.current_index+1,quiz.questions.length)} <span aria-hidden="true">→</span></button></section>`:'';
  learnerShell(`<section class="learner-card learner-intro"><span class="eyebrow">YOUR PRIVATE CLASSROOM CHALLENGE</span><h1>${e(data.title)}</h1><p class="intro-welcome">Welcome, <strong>${e(data.trainee_name)}</strong>. Take a breath, review the quick guide, then bring your best thinking to the rounds.</p><div class="intro-briefing"><span class="intro-icon" aria-hidden="true">✦</span><div><strong>${e(quiz.category)} · ${e(quiz.level)}</strong><p>${e(data.instructions||'A short practice challenge. Choose the strongest response in each scenario; your trainer will see your saved score and XP.')}</p></div></div>${resume}<div class="intro-stats"><div><strong>${cards.length}</strong><span>quick study cards</span></div><div><strong>${quiz.questions.length}</strong><span>scenario rounds</span></div><div><strong>+${quiz.questions.length*100}</strong><span>maximum XP</span></div></div><div class="intro-actions">${cards.length?'<button class="button button-flat button-primary" type="button" data-action="study-first">Study warm-up <span aria-hidden="true">→</span></button>':''}<button class="button" type="button" data-action="skip-study">${cards.length?'Jump to challenge':'Start challenge'}</button></div><p class="quiz-private-foot">No countdown pressure. Think it through, then finish once to save your result.</p></section>`);
}

function learnerStudy() {
  const cards=learnerState.data?.quiz?.study_cards||[],card=cards[learnerState.studyIndex];
  if(!card){learnerState.mode='quiz';learnerQuestion();return;}
  const previous=learnerState.studyIndex>0?'<button class="button" type="button" data-action="study-previous">Previous card</button>':'<span></span>';
  const final=learnerState.studyIndex===cards.length-1;
  const next=final?'<button class="button button-flat button-primary" type="button" data-action="study-start-quiz">Start challenge <span aria-hidden="true">→</span></button>':'<button class="button button-flat button-primary" type="button" data-action="study-next">Next card <span aria-hidden="true">→</span></button>';
  learnerShell(`<section class="learner-card study-room"><div class="study-room-head"><div><span class="eyebrow">WARM-UP · CARD ${learnerState.studyIndex+1} OF ${cards.length}</span><h1>${e(learnerState.data.title)}</h1></div><button class="quiet-link" type="button" data-action="skip-study">Skip to challenge</button></div><div class="study-card ${learnerState.studyFlipped?'study-card-back':''}"><span>${learnerState.studyFlipped?'THE TAKEAWAY':'QUICK GUIDE'}</span><h2>${e(learnerState.studyFlipped?card.back:card.front)}</h2><button class="micro-button" type="button" data-action="study-flip">${learnerState.studyFlipped?'Show prompt':'Reveal takeaway'}</button></div><div class="study-room-nav">${previous}${next}</div><p class="quiz-private-foot">A short warm-up, not part of your score. Tap through at your own pace.</p></section>`);
}

function startStudyWarmup() {
  const cards=learnerState.data?.quiz?.study_cards||[];
  learnerState.mode='study';
  learnerState.studyIndex=0;
  learnerState.studyQueue=cards.map((_,index)=>index);
  learnerState.studyPass=1;
  learnerState.studyFlipped=false;
  learnerState.studyRevisit.clear();
  learnerState.studyNeedsPractice.clear();
  renderActiveRecall();
}

function renderStudyComplete() {
  const cards=learnerState.data?.quiz?.study_cards||[];
  const focus=[...learnerState.studyNeedsPractice].sort((a,b)=>a-b).map(index=>cards[index]).filter(Boolean);
  const ready=Math.max(0,cards.length-focus.length);
  const focusMarkup=focus.length?`<section class="study-focus"><span class="eyebrow">KEEP THESE IN VIEW</span><ul>${focus.map(card=>`<li>${e(card.front)}</li>`).join('')}</ul></section>`:'<p class="study-clear-note">Everything felt clear on your second look. Bring one of these ideas into the challenge.</p>';
  learnerShell(`<section class="learner-card study-complete"><span class="eyebrow">WARM-UP COMPLETE</span><h1>Ready for the challenge?</h1><p class="result-rank-copy">You paused to recall the ideas, then checked yourself. Your reflection is private, not graded, and not saved to your trainee record.</p><div class="study-self-check"><span>YOUR SELF-CHECK</span><strong>${ready} <small>of ${cards.length} cards felt clear</small></strong></div>${focusMarkup}<div class="study-complete-actions"><button class="button button-flat button-primary" type="button" data-action="study-start-quiz">Start challenge <span aria-hidden="true">&rarr;</span></button><button class="button" type="button" data-action="study-repeat">Review the cards again</button></div></section>`);
}

function renderActiveRecall() {
  const cards=learnerState.data?.quiz?.study_cards||[];
  if(!learnerState.studyQueue.length){renderStudyComplete();return;}
  const card=cards[learnerState.studyQueue[learnerState.studyIndex]];
  if(!card){learnerState.mode='quiz';learnerQuestion();return;}
  const label=learnerState.studyPass===1?'WARM-UP':'SECOND LOOK';
  const progress=Math.round((learnerState.studyIndex+1)/learnerState.studyQueue.length*100);
  const progressWidth=Math.min(100,Math.ceil(progress/10)*10);
  const response=learnerState.studyFlipped
    ?`<div class="study-rating" role="group" aria-label="How well could you recall this idea?"><span>${learnerState.studyPass===1?'How did recall feel?':'Does it feel clearer now?'}</span><div><button class="button study-rating-again" type="button" data-action="study-again">${learnerState.studyPass===1?'Revisit once':'Still fuzzy'}</button><button class="button button-flat button-primary study-rating-clear" type="button" data-action="study-remember">${learnerState.studyPass===1?'Got it':'Clear now'}</button></div></div>`
    :'<p class="study-recall-prompt">Say the takeaway in your own words before you reveal it.</p><button class="button button-flat button-primary" type="button" data-action="study-flip">Reveal takeaway</button>';
  learnerShell(`<section class="learner-card study-room"><div class="study-room-head"><div><span class="eyebrow">${label} &middot; CARD ${learnerState.studyIndex+1} OF ${learnerState.studyQueue.length}</span><h1>${e(learnerState.data.title)}</h1></div><button class="quiet-link" type="button" data-action="skip-study">Skip to challenge</button></div><div class="study-progress-meta"><span>${learnerState.studyPass===1?'Build a quick mental model':'Give the tricky ideas one more pass'}</span><span>${progress}%</span></div><div class="study-progress study-width-${progressWidth}" role="progressbar" aria-label="Study warm-up progress" aria-valuemin="0" aria-valuemax="${learnerState.studyQueue.length}" aria-valuenow="${learnerState.studyIndex+1}"><span></span></div><div class="study-card ${learnerState.studyFlipped?'study-card-back':''}"><span>${learnerState.studyFlipped?'THE TAKEAWAY':'QUICK GUIDE'}</span><h2>${e(learnerState.studyFlipped?card.back:card.front)}</h2><div class="study-card-action">${response}</div></div><p class="quiz-private-foot">This is a private, ungraded reflection. Nothing you choose here is saved or shared with your trainer.</p></section>`);
}

function rateStudyCard(needsAnotherLook) {
  const cardIndex=learnerState.studyQueue[learnerState.studyIndex];
  if(!Number.isInteger(cardIndex))return;
  if(learnerState.studyPass===1){
    if(needsAnotherLook)learnerState.studyRevisit.add(cardIndex);
    else learnerState.studyRevisit.delete(cardIndex);
  }else if(needsAnotherLook)learnerState.studyNeedsPractice.add(cardIndex);
  else learnerState.studyNeedsPractice.delete(cardIndex);
  learnerState.studyIndex++;
  if(learnerState.studyIndex>=learnerState.studyQueue.length){
    if(learnerState.studyPass===1&&learnerState.studyRevisit.size){
      learnerState.studyPass=2;
      learnerState.studyQueue=[...learnerState.studyRevisit].sort((a,b)=>a-b);
      learnerState.studyIndex=0;
    }else{learnerState.mode='study-complete';renderStudyComplete();return;}
  }
  learnerState.studyFlipped=false;
  renderActiveRecall();
}

function startMissedPractice() {
  const results=learnerState.result?.results||[];
  learnerState.reviewQueue=results.map((item,index)=>!item.correct?index:-1).filter(index=>index>=0);
  if(!learnerState.reviewQueue.length)return;
  learnerState.reviewIndex=0;
  learnerState.reviewPass=1;
  learnerState.reviewRevisit.clear();
  learnerState.reviewStillFuzzy.clear();
  learnerState.reviewRevealed=false;
  learnerState.mode='missed-practice';
  renderMissedPractice();
}

function renderMissedPractice() {
  const results=learnerState.result?.results||[];
  const itemIndex=learnerState.reviewQueue[learnerState.reviewIndex];
  const item=results[itemIndex];
  if(!item){renderMissedPracticeComplete();return;}
  const total=learnerState.reviewQueue.length;
  const progress=learnerState.reviewIndex;
  const reveal=learnerState.reviewRevealed
    ?`<div class="missed-practice-answer" aria-live="polite"><span>STRONGER MOVE</span><strong>${e(item.correct_answer||'Review the strongest response in the notes below.')}</strong><p>${e(item.explanation||'')}</p></div><div class="missed-practice-rating"><button class="button" type="button" data-action="missed-practice-again">Give it one more look</button><button class="button button-flat button-primary" type="button" data-action="missed-practice-clear">I can explain it</button></div>`
    :`<p class="missed-practice-recall">Pause for a moment. Say your response aloud or jot it privately before you reveal the coaching note. Nothing you write is collected.</p><button class="button button-flat button-primary" type="button" data-action="missed-practice-reveal">Reveal the stronger move</button>`;
  learnerShell(`<section class="learner-card missed-practice"><header class="study-room-head"><div><span class="eyebrow">PRIVATE PRACTICE · ${learnerState.reviewPass===1?'FIRST LOOK':'ONE MORE LOOK'}</span><h1>Replay the thinking, not the score.</h1></div><button class="quiet-link" type="button" data-action="missed-practice-return">Back to saved result</button></header><div class="missed-practice-progress"><span>TRICKY ROUND ${learnerState.reviewIndex+1} OF ${total}</span><span>${learnerState.reviewPass===1?'ACTIVE RECALL':'SECOND LOOK'}</span></div><progress max="${total}" value="${progress}" aria-label="Private practice progress" aria-valuetext="${learnerState.reviewIndex} of ${total} rounds reviewed"></progress><article class="missed-practice-card"><span class="question-number">ROUND ${itemIndex+1} · ${e(item.skill_label||'PRACTICE')}</span><h2>${e(item.prompt||'')}</h2>${reveal}</article><p class="quiz-private-foot">This is optional, private study. It does not submit another attempt, change your saved result, or award XP.</p></section>`);
}

function renderMissedPracticeComplete() {
  const stillFuzzy=[...learnerState.reviewStillFuzzy].map(index=>learnerState.result?.results?.[index]).filter(Boolean);
  const reviewed=learnerState.reviewQueue.length;
  const clearer=Math.max(0,reviewed-stillFuzzy.length);
  const focus=stillFuzzy.length?`<section class="missed-practice-focus"><strong>Keep these ideas in your next role-play</strong><ul>${stillFuzzy.map(item=>`<li>${e(item.skill_label||'Practice skill')}: ${e(item.prompt||'')}</li>`).join('')}</ul></section>`:`<p class="missed-practice-clear-note">Your tricky rounds are ready for the next real conversation. Nice follow-through.</p>`;
  learnerShell(`<section class="learner-card missed-practice missed-practice-complete"><span class="eyebrow">PRACTICE LOOP COMPLETE · NO NEW GRADE</span><h1>${clearer?`${clearer} ${clearer===1?'idea feels':'ideas feel'} clearer.`:'Good reps. Keep these ideas in play.'}</h1><p class="result-rank-copy">You revisited ${reviewed} ${reviewed===1?'tricky round':'tricky rounds'} with active recall. Your saved score and XP stayed exactly the same.</p>${focus}<p class="quiz-private-foot">Your self-checks were temporary and were not sent to your trainer or saved to your Academy record.</p><button class="button button-flat button-primary" type="button" data-action="missed-practice-return">Back to saved result</button></section>`);
}

function rateMissedPractice(understood) {
  const itemIndex=learnerState.reviewQueue[learnerState.reviewIndex];
  if(learnerState.reviewPass===1){if(!understood)learnerState.reviewRevisit.add(itemIndex);}
  else if(understood)learnerState.reviewStillFuzzy.delete(itemIndex);
  else learnerState.reviewStillFuzzy.add(itemIndex);
  learnerState.reviewIndex++;
  learnerState.reviewRevealed=false;
  if(learnerState.reviewIndex>=learnerState.reviewQueue.length){
    if(learnerState.reviewPass===1&&learnerState.reviewRevisit.size){
      learnerState.reviewPass=2;
      learnerState.reviewQueue=[...learnerState.reviewRevisit].sort((a,b)=>a-b);
      learnerState.reviewIndex=0;
    }else{learnerState.mode='missed-practice-complete';renderMissedPracticeComplete();return;}
  }
  renderMissedPractice();
}

function learnerResults(result, title, name) {
  for (const item of result?.results || []) {
    if (item.arabic?.explanation) activityArabicPhrases.set(item.explanation, item.arabic.explanation);
    if (item.arabic?.correct_answer) activityArabicPhrases.set(item.correct_answer, item.arabic.correct_answer);
  }
  learnerState.result = result;
  const percent = Number(result.score) || 0;
  const rank = percent >= 90 ? {name:'Precision player',copy:'Outstanding accuracy. Keep sharing that calm, evidence-led approach.'} : percent >= 70 ? {name:'Momentum builder',copy:'Solid progress. Review the coaching notes and bring one idea into your next session.'} : {name:'Practice unlocked',copy:'Every round is practice. Pick one coaching note and try it in the next role-play.'};
  const achievements=[];
  if(percent===100)achievements.push({name:'Perfect Signal',copy:'Every answer on target'});
  if(Number(result.best_streak)>=3)achievements.push({name:`Combo ×${Number(result.best_streak)}`,copy:'Consecutive correct rounds'});
  if(Number(result.hints_used)>0)achievements.push({name:'Curious Mind',copy:`Used ${Number(result.hints_used)} coaching ${Number(result.hints_used)===1?'nudge':'nudges'}`});
  if(percent>=80&&!Number(result.hints_used))achievements.push({name:'Independent Thinker',copy:'Strong run without a nudge'});
  const achievementMarkup=achievements.length?`<div class="achievement-strip" aria-label="Achievements earned this run">${achievements.map(item=>`<div class="achievement-chip"><strong>${e(item.name)}</strong><span>${e(item.copy)}</span></div>`).join('')}</div>`:'';
  const missed=(result.results||[]).filter(item=>!item.correct).length;
  const practiceMarkup=missed?`<section class="missed-practice-invite"><div><span class="eyebrow">A PRIVATE SECOND CHANCE</span><h2>Turn ${missed} tricky ${missed===1?'round':'rounds'} into stronger instincts.</h2><p>Try recalling your move before you reveal the coaching note. No retake, grade change, or extra XP.</p></div><button class="button button-flat button-primary" type="button" data-action="missed-practice-start">Practice ${missed} missed ${missed===1?'round':'rounds'} <span aria-hidden="true">→</span></button></section>`:'';
  const confidenceRows=(result.results||[]).map(item=>({...item,confidence:learnerState.confidence.get(item.question_id)})).filter(item=>item.confidence);
  const sureRows=confidenceRows.filter(item=>item.confidence==='confident');
  const thinkingRows=confidenceRows.filter(item=>item.confidence==='thinking');
  const confidenceText=[sureRows.length?`You felt sure on ${sureRows.length} ${sureRows.length===1?'round':'rounds'} and got ${sureRows.filter(item=>item.correct).length} right.`:'',thinkingRows.length?`You were still thinking on ${thinkingRows.length} ${thinkingRows.length===1?'round':'rounds'} and got ${thinkingRows.filter(item=>item.correct).length} right.`:''].filter(Boolean).join(' ');
  const confidentMisses=sureRows.filter(item=>!item.correct).length;
  const confidenceMarkup=confidenceRows.length?`<section class="confidence-reflection" aria-label="Private confidence reflection"><span class="eyebrow">YOUR PRIVATE CONFIDENCE MIRROR</span><h2>Notice how certainty lined up.</h2><p>${e(confidenceText)}</p>${confidentMisses?`<div class="confidence-coaching">${confidentMisses} confident ${confidentMisses===1?'miss is':'misses are'} a useful practice cue—not a penalty.</div>`:''}<small>This reflection lives only in this page session. It is not sent to your trainer, saved, or included in your score or XP.</small></section>`:'';
  const rows = (result.results || []).map((item,index) => `<article class="result-row ${item.correct ? 'result-correct' : 'result-review'}"><div class="result-row-title"><span class="result-mark">${item.correct ? '✓' : '↗'}</span><strong>Round ${index+1}</strong><span>${item.correct ? `Correct · +${e(item.xp)} XP${item.used_hint ? ' · nudge used' : ' · independent'}` : 'Review this move'}</span></div><p>${e(item.prompt || '')}</p>${!item.correct ? `<p class="right-answer"><b>Stronger choice:</b> ${e(item.correct_answer || '')}</p>` : ''}<p class="result-explanation">${e(item.explanation || '')}</p></article>`).join('');
  learnerShell(`<section class="learner-card result-screen"><span class="eyebrow">CHALLENGE COMPLETE · ${e(name)}</span><h1>${e(rank.name)}</h1><p class="result-rank-copy">${e(rank.copy)}</p>${achievementMarkup}<div class="score-orbit"><div><strong>${e(percent)}<small>%</small></strong><span>${e(result.correct)} / ${e(result.total)} correct</span></div></div><div class="result-rewards"><div><strong>+${e(result.xp)} XP</strong><span>Academy experience earned</span></div><div><strong>${e(title)}</strong><span>Saved to your batch record</span></div></div>${confidenceMarkup}${practiceMarkup}<section class="result-review"><div class="result-review-head"><h2>Round review</h2><span>Use the notes in your next practice</span></div>${rows}</section><a class="button" href="${e(portalUrl())}">Done</a></section>`);
}

async function launchLearner() {
  if (!learnerMatch) { learnerNotice('Private link not recognized','Ask your trainer to send you a fresh Academy Studio link.',true); return; }
  learnerNotice('Opening your challenge…','Checking the private link with RED Academy.');
  try {
    const data = await learnerRequest('activities/learner/open', { code: learnerState.code });
    learnerState.data = data;
    registerActivityArabic(data.quiz);
    if (data.completed) learnerResults(data.result,data.title,data.trainee_name);
    else {
      if(data.draft&&Array.isArray(data.draft.answers)){
        learnerState.answers=new Map(data.draft.answers.map(answer=>[answer.question_id,answer.choice]));
        learnerState.hints=new Set(data.draft.answers.filter(answer=>answer.used_hint).map(answer=>answer.question_id));
        learnerState.index=Math.max(0,Math.min(Number(data.draft.current_index)||0,data.quiz.questions.length-1));
        learnerState.draftVersion=Math.max(0,Number(data.draft.version)||0);
        learnerState.draftStatus='saved';
      }
      learnerIntro();
    }
  } catch (error) { learnerNotice('We could not open this challenge',error.message || 'Ask your trainer to create a fresh private link.',true); }
}

async function liveRoomRequest(route, body) {
  const response = await fetch(store.endpoint(`activities/live/${route}`), {
    method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
    headers: { 'Content-Type': 'application/json', 'X-Red-Request': '1' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(12000),
  });
  const result = await response.json().catch(() => ({ error: 'The live room returned an invalid response.' }));
  if (!response.ok) throw new Error(result.error || 'The live room could not complete that action.');
  return result;
}

function livePlayerShell(content) {
  const data = livePlayer.data;
  if (data && data.mode !== 'pulse' && !data.revealed && data.player && data.question) {
    const questionHeading = `<h2>${e(data.question.prompt)}</h2>`;
    if (content.includes(questionHeading)) content = content.replace(questionHeading, `${questionHeading}${liveConfidencePicker(data)}`);
  }
  const brand = participantHost
    ? '<span class="brand" aria-label="Red Training Academy"><img src="../training-academy-logo.svg" alt="Red Training Academy"><span class="brand-copy"><span>Academy Studio</span></span></span>'
    : `<a class="brand" href="${e(portalUrl())}" aria-label="Return to Xcelias portal"><img src="../training-academy-logo.svg" alt="Red Training Academy"><span class="brand-copy"><span>Academy Studio</span></span></a>`;
  app.innerHTML = `<main class="learner-shell live-player-shell"><header class="learner-header">${brand}<span class="live-player-status ${livePlayer.error?'is-reconnecting':''}"><i></i>${livePlayer.error?'RECONNECTING':'LIVE CLASSROOM'}</span>${localeSwitch()}</header>${content}</main>`;
  if (participantHost) removeParticipantExitLinks();
}

function renderLivePlayerJoin(error = '') {
  const info = livePlayer.info;
  if (info) registerActivityArabic({title:info.title,category:info.category,arabic:info.arabic});
  if (!info) { learnerNotice('Room link not recognized','Ask your trainer for a fresh classroom link or the current room code.',true);return; }
  if(info.mode==='pulse'){
    livePlayerShell(`<section class="learner-card live-join-card pulse-join-card"><span class="eyebrow">A QUICK CLASS CHECK-IN</span><h1>${e(info.title)}</h1><p class="intro-welcome">One short question. Your response is anonymous and ungraded.</p><div class="pulse-anon-promise"><span aria-hidden="true">◉</span><div><strong>No name. No team. No login.</strong><span>Your answer is stored only in this temporary class pulse. The group pattern appears after the trainer reveals it, and only when at least three responses are in.</span></div></div><form id="live-phone-join" class="live-phone-join pulse-phone-join">${error?`<div class="error-box" role="alert">${e(error)}</div>`:''}<button class="button button-flat button-primary" type="submit" ${livePlayer.busy?'disabled':''}>${livePlayer.busy?'Joining...':'Join anonymously'}</button></form><p class="quiz-private-foot">You can change your choice until the facilitator reveals the class pattern.</p></section>`);
    const form=document.getElementById('live-phone-join');
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(livePlayer.busy)return;livePlayer.busy=true;renderLivePlayerJoin();
      try{const joined=await liveRoomRequest('join',{code:livePlayer.code});livePlayer.seatToken=joined.seat_token;livePlayer.data=joined.room;livePlayer.busy=false;try{sessionStorage.setItem(`red-academy-live:${livePlayer.code}`,livePlayer.seatToken);}catch{}renderLivePlayer();startLivePlayerPolling();}
      catch(joinError){livePlayer.busy=false;renderLivePlayerJoin(joinError.message||'Could not join this pulse. Check the link with your facilitator.');}
    });
    return;
  }
  const defaultTeam = info.teams.reduce((least,team)=>team.players<least.players?team:least,info.teams[0]).team_no;
  const teamOptions = info.teams.map(team => `<label class="live-team-choice"><input type="radio" name="team_no" value="${team.team_no}" ${team.team_no===defaultTeam?'checked':''}><span><strong>${e(team.name)}</strong><small>${team.players} joined</small></span><i></i></label>`).join('');
  livePlayerShell(`<section class="learner-card live-join-card"><span class="eyebrow">YOU’RE IN THE ROOM</span><h1>${e(info.title)}</h1><p class="intro-welcome">${e(info.category)} · ${e(info.level)} · ${info.total_rounds} quick rounds</p><div class="live-join-welcome"><strong>Pick a class nickname and team.</strong><span>This live game is temporary. It is not linked to your trainee profile or Academy XP.</span></div><form id="live-phone-join" class="live-phone-join"><label class="field"><span class="field-label">Your class nickname</span><input name="nickname" required maxlength="24" autocomplete="nickname" placeholder="e.g. Orbit" autofocus></label><fieldset class="live-team-field"><legend>Choose a team</legend><div class="live-team-options">${teamOptions}</div></fieldset>${error?`<div class="error-box" role="alert">${e(error)}</div>`:''}<button class="button button-flat button-primary" type="submit" ${livePlayer.busy?'disabled':''}>${livePlayer.busy?'Joining…':'Join the game'}</button></form><p class="quiz-private-foot">Answer on your own phone. Your trainer reveals the strongest move after the room has had time to think.</p></section>`);
  const form = document.getElementById('live-phone-join');
  form.addEventListener('submit', async event => {
    event.preventDefault();if(livePlayer.busy)return;
    const nickname=form.elements.nickname.value.trim(),teamNo=Number(form.elements.team_no.value);
    if(!nickname||nickname.length>24){renderLivePlayerJoin('Choose a nickname of 1 to 24 characters.');return;}
    livePlayer.busy=true;renderLivePlayerJoin();
    try {
      const joined=await liveRoomRequest('join',{code:livePlayer.code,nickname,team_no:teamNo});
      livePlayer.seatToken=joined.seat_token;livePlayer.data=joined.room;livePlayer.busy=false;
      try{sessionStorage.setItem(`red-academy-live:${livePlayer.code}`,livePlayer.seatToken);}catch{}
      renderLivePlayer();startLivePlayerPolling();
    } catch(joinError){livePlayer.busy=false;renderLivePlayerJoin(joinError.message||'Could not join this room. Check with your trainer.');}
  });
}

function renderLiveSequencePlayer(data) {
  const person = data.player, question = data.question, teams = data.team_scores || [];
  const order = livePhoneSequenceOrder(data);
  const sequenceWork = data.revealed
    ? `<section class="live-sequence-reveal"><span class="eyebrow">COACHING ORDER</span>${sequenceStepList(question.steps, order, { revealed: true })}</section>`
    : `<section class="live-sequence-workbench"><div><span class="eyebrow">YOUR ORDER</span><p>Use the arrows to arrange the moves, then lock in your sequence.</p></div>${sequenceStepList(question.steps, order, { interactive: true, disabled: livePlayer.busy })}<button class="button button-flat button-primary sequence-lock-button" type="button" data-action="sequence-submit" ${livePlayer.busy ? 'disabled' : ''}>${person.choice === null ? 'Lock my order' : 'Update my order'}</button><small>You can update your order until your trainer reveals the coaching sequence.</small></section>`;
  const feedback = data.revealed
    ? `<div class="live-phone-feedback ${person.correct ? 'is-right' : 'is-review'}"><strong>${person.correct ? `Good order · +${person.awarded_points} room points` : 'Good practice — every round teaches the move'}</strong><p>${e(question.explanation)}</p><span>${person.correct ? `Your streak: ${person.streak} · Team total: ${data.team.points}` : 'Compare your reasoning with the coaching order above.'}</span></div>`
    : person.choice !== null
      ? '<div class="live-answer-locked"><strong>Your order is in.</strong><span>It stays private. You may change it before your trainer reveals the coaching sequence.</span></div>'
      : `<div class="live-answer-locked"><strong>Build your order, then lock it in.</strong><span>${data.response_count} ${data.response_count === 1 ? 'order' : 'orders'} submitted so far. Your sequence stays private until reveal.</span></div>`;
  const leaderboard = data.revealed
    ? `<div class="live-leaderboard"><span class="eyebrow">ROOM LEADERS</span>${(data.leaders || []).map((item, index) => `<div><b>${String(index + 1).padStart(2, '0')}</b><span>${e(item.nickname)}${item.team_no === data.team.team_no ? ' · your team' : ''}</span><strong>${item.points}</strong></div>`).join('') || '<p>Scoreboard updates after each reveal.</p>'}</div>` : '';
  const end = data.timer_ends_at ? Math.max(0, Date.parse(data.timer_ends_at)) : 0;
  livePlayerShell(`<section class="learner-card live-play-card live-sequence-player"><div class="live-play-head"><div><span class="eyebrow">${e(data.team.name)} · ${e(person.nickname)}</span><h1>${e(data.activity.title)}</h1></div><span class="live-round-chip">${data.round_index + 1}<small> / ${data.total_rounds}</small></span></div><div class="live-score-strip">${teams.map(team => `<div class="${team.team_no === data.team.team_no ? 'is-your-team' : ''}"><strong>${e(team.name)}</strong><span>${team.points} pts</span></div>`).join('')}</div><div class="live-phone-progress"><span>ROUND ${data.round_index + 1} OF ${data.total_rounds}</span><span>${data.response_count} orders in</span></div><div class="live-phone-question"><span class="question-number">SEQUENCE SPRINT</span><h2>${e(question.prompt)}</h2>${sequenceWork}</div>${feedback}${end ? `<div class="live-phone-timer"><span>ROUND CLOCK</span><strong id="phone-room-clock">${roomTimeLabel(Math.ceil((end - Date.now()) / 1000))}</strong></div>` : ''}${livePlayer.error ? `<div class="error-box" role="status">${e(livePlayer.error)}</div>` : ''}${leaderboard}<p class="quiz-private-foot">Temporary room points only · no attendance, assessment, trainee profile, assignment, or Academy XP changes.</p></section>`);
}

function renderLivePlayer() {
  const data=livePlayer.data;if(!data)return;
  registerActivityArabic({title:data.activity?.title,category:data.activity?.category,arabic:data.activity?.arabic,questions:data.question?[data.question]:[]});
  if(data.mode==='pulse'){renderLivePulsePlayer(data);return;}
  const person=data.player,question=data.question,teams=data.team_scores||[];
  if(data.room_closed){
    livePlayerShell(`<section class="learner-card live-finish-card"><span class="eyebrow">ROOM ENDED</span><h1>Thanks for playing, ${e(person.nickname)}.</h1><p>Your temporary room points were only for this session. They were never saved to Academy records.</p><a class="button" href="${e(portalUrl())}">Return to portal</a></section>`);return;
  }
  if(data.complete){
    const leaders=data.leaders||[],place=leaders.findIndex(item=>item.nickname===person.nickname&&item.team_no===data.team.team_no)+1;
    livePlayerShell(`<section class="learner-card live-finish-card"><span class="eyebrow">LIVE ROOM COMPLETE · ${e(person.nickname)}</span><h1>${person.points>=500?'Brilliant run!':person.points>=200?'Great momentum!':'Thanks for showing up!'}</h1><p class="result-rank-copy">You earned <strong>${person.points} temporary room points</strong>${place?` · ${place===1?'Top of the room':`#${place} today`}`:''}. None of these points change Academy XP or your trainee record.</p><div class="live-score-strip">${teams.map(team=>`<div><strong>${e(team.name)}</strong><span>${team.points} room points</span></div>`).join('')}</div><div class="live-leaderboard"><span class="eyebrow">TODAY’S CLASS LEADERS</span>${leaders.map((item,index)=>`<div><b>${String(index+1).padStart(2,'0')}</b><span>${e(item.nickname)}${item.team_no===data.team.team_no?' · your team':''}</span><strong>${item.points}</strong></div>`).join('')||'<p>Be the first name on the board next time.</p>'}</div><a class="button" href="${e(portalUrl())}">Done</a></section>`);return;
  }
  if(question.type==='sequence'){renderLiveSequencePlayer(data);return;}
  const options=question.options.map((option,index)=>`<button class="live-phone-option ${person.choice===index?'is-selected':''} ${data.revealed&&index===question.answer?'is-correct':''} ${data.revealed&&person.choice===index&&!person.correct?'is-missed':''}" type="button" data-action="phone-answer" data-choice="${index}" ${data.revealed||livePlayer.busy?'disabled':''}><span>${String.fromCharCode(65+index)}</span><strong>${e(option)}</strong>${person.choice===index?'<i>YOUR PICK</i>':''}${data.revealed&&index===question.answer?'<b>STRONGEST MOVE</b>':''}</button>`).join('');
  const feedback=data.revealed?`<div class="live-phone-feedback ${person.correct?'is-right':'is-review'}"><strong>${person.correct?`Nice call · +${person.awarded_points} room points`:'Good practice — every round teaches the move'}</strong><p>${e(question.explanation)}</p><span>${person.correct?`Your streak: ${person.streak} · Team total: ${data.team.points}`:'Look for the strongest response next round.'}</span></div>`:person.choice!==null?'<div class="live-answer-locked"><strong>Answer locked in.</strong><span>You can still change it before your trainer reveals the answer.</span></div>':'<div class="live-answer-locked"><strong>Choose the move you believe in.</strong><span>Your answer is private until the trainer reveals the round.</span></div>';
  const leaderboard=data.revealed?`<div class="live-leaderboard"><span class="eyebrow">ROOM LEADERS</span>${(data.leaders||[]).map((item,index)=>`<div><b>${String(index+1).padStart(2,'0')}</b><span>${e(item.nickname)}${item.team_no===data.team.team_no?' · your team':''}</span><strong>${item.points}</strong></div>`).join('')||'<p>Scoreboard updates after each reveal.</p>'}</div>`:'';
  const end= data.timer_ends_at ? Math.max(0,Date.parse(data.timer_ends_at)) : 0;
  livePlayerShell(`<section class="learner-card live-play-card"><div class="live-play-head"><div><span class="eyebrow">${e(data.team.name)} · ${e(person.nickname)}</span><h1>${e(data.activity.title)}</h1></div><span class="live-round-chip">${data.round_index+1}<small> / ${data.total_rounds}</small></span></div><div class="live-score-strip">${teams.map(team=>`<div class="${team.team_no===data.team.team_no?'is-your-team':''}"><strong>${e(team.name)}</strong><span>${team.points} pts</span></div>`).join('')}</div><div class="live-phone-progress"><span>ROUND ${data.round_index+1} OF ${data.total_rounds}</span><span>${data.response_count} responses in</span></div><div class="live-phone-question"><span class="question-number">THINK IT THROUGH</span><h2>${e(question.prompt)}</h2><div class="live-phone-options">${options}</div></div>${data.revealed?feedback:person.choice!==null?feedback:`<div class="live-answer-locked"><strong>Waiting for the room…</strong><span>${data.response_count} answers in so far. The trainer reveals the answer for everyone together.</span></div>`}${end?`<div class="live-phone-timer"><span>ROUND CLOCK</span><strong id="phone-room-clock">${roomTimeLabel(Math.ceil((end-Date.now())/1000))}</strong></div>`:''}${livePlayer.error?`<div class="error-box" role="status">${e(livePlayer.error)}</div>`:''}${leaderboard}<p class="quiz-private-foot">Your team: ${e(data.team.name)} · ${data.team.players} players · Points stay inside this temporary room and never become Academy XP.</p></section>`);
}

function renderLivePulsePlayer(data) {
  if(data.room_closed||data.complete){livePlayerShell(`<section class="learner-card live-finish-card pulse-finish-card"><span class="eyebrow">PULSE COMPLETE</span><h1>Thanks for checking in.</h1><p>Your ungraded response was only part of this temporary class pulse. It was never saved to your trainee record.</p><a class="button" href="${e(portalUrl())}">Done</a></section>`);return;}
  const question=data.question,choice=data.player.choice;
  const options=question.options.map((option,index)=>`<button class="live-phone-option pulse-phone-option ${choice===index?'is-selected':''}" type="button" data-action="phone-answer" data-choice="${index}" ${data.revealed||livePlayer.busy?'disabled':''}><span>${String.fromCharCode(65+index)}</span><strong>${e(option)}</strong>${choice===index?'<i>YOUR PICK</i>':''}</button>`).join('');
  const counts=Array.isArray(data.answer_counts)?`<div class="pulse-result-list learner-pulse-results" aria-label="Anonymous class response distribution">${question.options.map((option,index)=>{const votes=Number(data.answer_counts[index])||0,share=data.response_count?Math.round(votes/data.response_count*100):0;return `<div class="pulse-result-row"><div><span class="pulse-result-letter">${String.fromCharCode(65+index)}</span><strong>${e(option)}</strong><small>${votes} - ${share}%</small></div><i><b style="width:${share}%"></b></i></div>`;}).join('')}</div>`:'';
  let status;
  if(data.revealed)status=counts?`<div class="pulse-phone-feedback"><strong>Here is the class pattern.</strong><span>${data.response_count} anonymous responses. No option is marked right or wrong.</span></div>${counts}`:`<div class="pulse-phone-feedback"><strong>The group split stays private.</strong><span>${data.response_count} response${data.response_count===1?'':'s'} came in. At least three are needed to show an aggregate pattern.</span></div>`;
  else status=`<div class="live-answer-locked"><strong>${choice===null?'Choose the answer that feels true.':'Your answer is in.'}</strong><span>${choice===null?'Your response stays private until the trainer reveals the class pattern.':'Only you can see your selection right now. Change it before the reveal if you like.'}</span><small>${data.response_count} anonymous ${data.response_count===1?'response':'responses'} received</small></div>`;
  const end=data.timer_ends_at?Math.max(0,Date.parse(data.timer_ends_at)):0;
  livePlayerShell(`<section class="learner-card live-play-card pulse-play-card"><div class="live-play-head"><div><span class="eyebrow">ANONYMOUS CLASS PULSE</span><h1>${e(data.activity.title)}</h1></div><span class="live-round-chip">${data.response_count}<small> responses</small></span></div><div class="live-phone-progress"><span>ONE QUESTION</span><span>UNGRADED - PRIVATE</span></div><div class="live-phone-question"><span class="question-number">YOUR READ ON THE ROOM</span><h2>${e(question.prompt)}</h2><div class="live-phone-options">${options}</div></div>${status}${end?`<div class="live-phone-timer"><span>OPTIONAL CLASS CLOCK</span><strong id="phone-room-clock">${roomTimeLabel(Math.ceil((end-Date.now())/1000))}</strong></div>`:''}${livePlayer.error?`<div class="error-box" role="status">${e(livePlayer.error)}</div>`:''}<p class="quiz-private-foot">No name, login, team, score, or learner record is attached to this answer.</p></section>`);
}

async function refreshLivePlayer() {
  if(!livePlayer.seatToken||livePlayer.busy)return;
  const data=await liveRoomRequest('state',{seat_token:livePlayer.seatToken});
  const signature=JSON.stringify(data);livePlayer.data=data;livePlayer.error='';
  if(signature!==livePlayer.rendered){livePlayer.rendered=signature;renderLivePlayer();}
}

function startLivePlayerPolling() {
  if(livePlayer.pollTimer)window.clearInterval(livePlayer.pollTimer);
  livePlayer.pollTimer=window.setInterval(()=>refreshLivePlayer().catch(error=>{livePlayer.error=error.message||'Connection interrupted. Reconnecting…';const status=document.querySelector('.live-player-status');if(status){status.classList.add('is-reconnecting');status.lastChild.textContent='RECONNECTING';}}),2000);
  if(livePlayer.clockTimer)window.clearInterval(livePlayer.clockTimer);
  livePlayer.clockTimer=window.setInterval(()=>{const clock=document.getElementById('phone-room-clock'),end=Date.parse(livePlayer.data?.timer_ends_at||'');if(clock&&Number.isFinite(end))clock.textContent=roomTimeLabel(Math.ceil(Math.max(0,end-Date.now())/1000));},250);
}

async function launchLivePlayer() {
  if(!liveRoomMatch){learnerNotice('Room link not recognized','Ask your trainer to share the current classroom link.',true);return;}
  learnerNotice('Finding your classroom…','Checking the live room with RED Academy.');
  try {
    try{livePlayer.seatToken=sessionStorage.getItem(`red-academy-live:${livePlayer.code}`)||'';}catch{livePlayer.seatToken='';}
    if(livePlayer.seatToken){
      try{livePlayer.data=await liveRoomRequest('state',{seat_token:livePlayer.seatToken});renderLivePlayer();startLivePlayerPolling();return;}
      catch(error){if(!/seat|active|expired/i.test(error.message))throw error;try{sessionStorage.removeItem(`red-academy-live:${livePlayer.code}`);}catch{}livePlayer.seatToken='';}
    }
    livePlayer.info=await liveRoomRequest('info',{code:livePlayer.code});
    renderLivePlayerJoin();
  } catch(error){learnerNotice('We could not join this room',error.message||'Ask your trainer for the current live room code.',true);}
}

document.addEventListener('click', event => {
  const languageButton = event.target.closest('[data-set-locale]');
  if (languageButton) setInterfaceLanguage(languageButton.dataset.setLocale);
});

document.addEventListener('click', async event => {
  const buttonEl=event.target.closest('[data-action]');
  if(!buttonEl||buttonEl.disabled||!liveRoomMatch||livePlayer.busy)return;
  const action=buttonEl.dataset.action,data=livePlayer.data,question=data?.question;
  if(action==='sequence-move'){
    if(question?.type!=='sequence'||data.revealed)return;
    const order=livePhoneSequenceOrder(data),position=Number(buttonEl.dataset.position),direction=Number(buttonEl.dataset.direction),next=position+direction;
    if(!Number.isInteger(position)||!Number.isInteger(direction)||next<0||next>=order.length)return;
    [order[position],order[next]]=[order[next],order[position]];
    livePlayer.sequenceDrafts.set(question.id,order);livePlayer.error='';renderLivePlayer();
    document.querySelector(`.sequence-step-list-phone .sequence-step-card:nth-child(${next + 1}) .sequence-step-controls button:not(:disabled)`)?.focus();
    return;
  }
  if(action==='phone-confidence'){
    if(!data||data.mode==='pulse'||data.revealed||!question||!data.player)return;
    const confidence=buttonEl.dataset.confidence;
    if(!['tentative','confident'].includes(confidence))return;
    livePlayer.confidenceDrafts.set(question.id,confidence);
    if(data.player.choice===null){renderLivePlayer();document.querySelector(`[data-action="phone-confidence"][data-confidence="${confidence}"]`)?.focus();return;}
    livePlayer.busy=true;livePlayer.error='';renderLivePlayer();
    try{livePlayer.data=await liveRoomRequest('answer',{seat_token:livePlayer.seatToken,choice:data.player.choice,confidence});livePlayer.rendered=JSON.stringify(livePlayer.data);livePlayer.busy=false;renderLivePlayer();document.querySelector(`[data-action="phone-confidence"][data-confidence="${confidence}"]`)?.focus();}
    catch(error){livePlayer.busy=false;livePlayer.error=error.message||'Your confidence check could not be saved. Try again.';renderLivePlayer();}
    return;
  }
  if(!['phone-answer','sequence-submit'].includes(action))return;
  let choice,submittedOrder=null;
  if(action==='phone-answer')choice=Number(buttonEl.dataset.choice);
  else{
    if(question?.type!=='sequence'||data.revealed)return;
    submittedOrder=livePhoneSequenceOrder(data);choice=sequenceChoiceForOrder(submittedOrder);
    if(choice===null){livePlayer.error='Arrange all three steps before locking your order.';renderLivePlayer();return;}
  }
  const confidence=livePlayer.confidenceDrafts.get(question.id)??data.player.confidence??null;
  livePlayer.busy=true;livePlayer.error='';renderLivePlayer();
  try{livePlayer.data=await liveRoomRequest('answer',{seat_token:livePlayer.seatToken,choice,confidence});if(submittedOrder)livePlayer.sequenceDrafts.set(question.id,submittedOrder);livePlayer.rendered=JSON.stringify(livePlayer.data);livePlayer.busy=false;renderLivePlayer();}
  catch(error){livePlayer.busy=false;livePlayer.error=error.message||'Your answer could not be sent. Try again.';renderLivePlayer();}
});

document.addEventListener('change', event => {
  if (!learnerRoute) return;
  const quiz = learnerState.data?.quiz, question = quiz?.questions[learnerState.index];
  if (!question) return;
  if(event.target.name==='learner-confidence'){
    const value=event.target.value;
    if(!['thinking','confident'].includes(value))return;
    learnerState.confidence.set(question.id,value);
    document.querySelectorAll('.confidence-option').forEach(label=>label.classList.toggle('is-selected',label.contains(event.target)));
    return;
  }
  if(event.target.name!=='learner-choice')return;
  learnerState.answers.set(question.id,Number(event.target.value));
  learnerState.error = '';
  document.querySelectorAll('.answer-option').forEach(label=>label.classList.toggle('is-selected',label.contains(event.target)));
  const submit = document.querySelector('[data-action="learner-submit"]');
  const next = document.querySelector('[data-action="learner-next"]');
  if (submit) submit.disabled = learnerState.answers.size !== quiz.questions.length || learnerState.busy;
  if (next) next.disabled = false;
  const error = document.querySelector('.quiz-play .error-box');if(error)error.remove();
  void queueLearnerDraftSave();
});

document.addEventListener('click', async event => {
  const buttonEl = event.target.closest('[data-action]');
  if (!buttonEl || !learnerRoute) return;
  if (buttonEl.dataset.action === 'learner-resume') { learnerState.mode='quiz';learnerState.error='';learnerQuestion();return; }
  if (buttonEl.dataset.action === 'learner-hint') { const question=learnerState.data?.quiz?.questions[learnerState.index];if(question?.hint){learnerState.hints.add(question.id);learnerQuestion();void queueLearnerDraftSave(true);}return; }
  if (buttonEl.dataset.action === 'study-first' || buttonEl.dataset.action === 'study-repeat') { startStudyWarmup();return; }
  if (buttonEl.dataset.action === 'skip-study' || buttonEl.dataset.action === 'study-start-quiz') { learnerState.mode='quiz';learnerState.error='';learnerQuestion(); }
  if (buttonEl.dataset.action === 'study-flip') { learnerState.studyFlipped=!learnerState.studyFlipped;renderActiveRecall();return; }
  if (buttonEl.dataset.action === 'study-again') { rateStudyCard(true);return; }
  if (buttonEl.dataset.action === 'study-remember') { rateStudyCard(false);return; }
  if (buttonEl.dataset.action === 'missed-practice-start') { startMissedPractice();return; }
  if (buttonEl.dataset.action === 'missed-practice-reveal') { learnerState.reviewRevealed=true;renderMissedPractice();return; }
  if (buttonEl.dataset.action === 'missed-practice-again') { rateMissedPractice(false);return; }
  if (buttonEl.dataset.action === 'missed-practice-clear') { rateMissedPractice(true);return; }
  if (buttonEl.dataset.action === 'missed-practice-return') { learnerResults(learnerState.result,learnerState.data?.title||'Challenge',learnerState.data?.trainee_name||'Trainee');return; }
  if (buttonEl.dataset.action === 'learner-previous') { learnerState.index=Math.max(0,learnerState.index-1);learnerState.error='';learnerQuestion();void queueLearnerDraftSave(true); }
  if (buttonEl.dataset.action === 'learner-next') { if(learnerState.answers.has(learnerState.data.quiz.questions[learnerState.index].id)){learnerState.index=Math.min(learnerState.data.quiz.questions.length-1,learnerState.index+1);learnerState.error='';learnerQuestion();void queueLearnerDraftSave(true);} }
  if (buttonEl.dataset.action === 'learner-submit') {
    if (learnerState.busy) return;
    const quiz=learnerState.data?.quiz;if(!quiz||learnerState.answers.size!==quiz.questions.length){learnerState.error='Choose one answer for every round before finishing.';learnerQuestion();return;}
    learnerState.busy=true;learnerState.error='';learnerQuestion();
    try {await flushLearnerDraft(true);const answers=quiz.questions.map(question=>({question_id:question.id,choice:learnerState.answers.get(question.id),used_hint:learnerState.hints.has(question.id)}));const result=await learnerRequest('activities/learner/submit',{code:learnerState.code,answers});clearTimeout(learnerState.draftTimer);learnerState.answers.clear();learnerState.hints.clear();learnerState.draftStatus='';learnerState.busy=false;learnerResults(result.result,result.title,result.trainee_name);}
    catch(error){learnerState.busy=false;learnerState.error=error.message||'Your response was not saved. Check your connection and try again.';learnerQuestion();}
  }
});

document.addEventListener('click', async event => {
  const buttonEl = event.target.closest('[data-action]');
  if (!buttonEl || buttonEl.disabled) return;
  const action = buttonEl.dataset.action;
  try {
    if(action==='roleplay-open'){openRoleplayLab();return;}
    if(action==='roleplay-exit'){leaveRoleplay();return;}
    if(action==='roleplay-ai-draft'&&roleplayState?.stage==='setup'){await draftRoleplayScenarioWithAI(buttonEl);return;}
    if(action==='roleplay-select'&&roleplayState?.stage==='setup'){selectRoleplayScenario(buttonEl.dataset.scenario);return;}
    if(action==='roleplay-format'&&roleplayState?.stage==='setup'&&['coach','pair'].includes(buttonEl.dataset.format)){roleplayState.format=buttonEl.dataset.format;renderRoleplayLab();return;}
    if(action==='roleplay-random'&&roleplayState?.stage==='setup'){chooseRandomRoleplayScenario();return;}
    if(action==='roleplay-start'&&roleplayState?.stage==='setup'){startRoleplay();return;}
    if(action==='roleplay-setup'){openRoleplaySetup();return;}
    if(action==='roleplay-timer'){toggleRoleplayTimer();return;}
    if(action==='roleplay-reset-timer'){resetRoleplayTimer();return;}
    if(action==='roleplay-next-turn'&&roleplayState?.stage==='play'){advanceRoleplayTurn();return;}
    if(action==='roleplay-reveal-coach'&&roleplayState?.stage==='play'){
      const scenario=roleplayScenario(roleplayState.scenarioId,roleplayState);
      if(scenario&&roleplayState.turnIndex===scenario.turns.length-1){stopRoleplayTimer();roleplayState.running=false;roleplayState.endsAt=0;roleplayState.revealed=true;renderRoleplayLab();}
      return;
    }
    if(action==='roleplay-mark-move'&&roleplayState?.revealed){
      const scenario=roleplayScenario(roleplayState.scenarioId,roleplayState),move=buttonEl.dataset.move;
      if(scenario?.lookFors.some(item=>item.id===move)){if(roleplayState.observed.has(move))roleplayState.observed.delete(move);else roleplayState.observed.add(move);renderRoleplayLab();}
      return;
    }
    if(action==='roleplay-retry'&&roleplayState?.revealed){retryRoleplay();return;}
    if(action==='roleplay-next-scenario'&&roleplayState?.revealed){
      const scenes=roleplayScenarios(roleplayState),current=scenes.findIndex(item=>item.id===roleplayState.scenarioId);
      roleplayState.scenarioId=scenes[(current+1)%scenes.length].id;
      roleplayState.stage='setup';roleplayState.rep=1;roleplayState.turnIndex=0;roleplayState.revealed=false;roleplayState.observed=new Set();roleplayState.seconds=roleplayState.duration;renderRoleplayLab();return;
    }
    if(action==='custom-new'){openCustomChallengeForm();return;}
    if(action==='custom-ai-draft'){await draftCustomChallengeWithAi(buttonEl);return;}
    if(action==='custom-add-question'){
      const list=document.getElementById('custom-question-list');if(!list)return;
      if(list.children.length>=12){showToast('A challenge can have at most 12 rounds.',true);return;}
      list.insertAdjacentHTML('beforeend',customQuestionMarkup(list.children.length));customQuestionCount();return;
    }
    if(action==='custom-remove-question'){
      const list=document.getElementById('custom-question-list');if(!list)return;
      if(list.children.length<=3){showToast('Keep at least three rounds in each challenge.',true);return;}
      buttonEl.closest('[data-custom-question]')?.remove();list.querySelectorAll('[data-custom-question] legend').forEach((legend,index)=>{legend.textContent=`ROUND ${index+1}`;});customQuestionCount();return;
    }
    if(action==='custom-add-study'){
      const list=document.getElementById('custom-study-list');if(!list)return;
      if(list.querySelectorAll('[data-custom-study]').length>=8){showToast('A challenge can have at most eight recall cards.',true);return;}
      list.querySelector('.custom-study-empty')?.remove();list.insertAdjacentHTML('beforeend',customStudyCardMarkup(list.querySelectorAll('[data-custom-study]').length));customStudyCount();return;
    }
    if(action==='custom-remove-study'){
      const list=document.getElementById('custom-study-list');buttonEl.closest('[data-custom-study]')?.remove();
      if(list&&!list.querySelector('[data-custom-study]'))list.innerHTML='<p class="custom-study-empty">No warm-up cards yet. The challenge will start directly.</p>';
      list?.querySelectorAll('[data-custom-study] legend').forEach((legend,index)=>{legend.textContent=`RECALL CARD ${index+1}`;});customStudyCount();return;
    }
    if(action==='custom-archive'){
      const activity=state.library.find(item=>item.id===buttonEl.dataset.activity&&item.is_custom);
      if(!activity||!window.confirm(`Archive “${activity.title}”? It will disappear from new assignments and live rooms. Existing assignments, links, scores, and feedback will remain available.`))return;
      await store.api('activities/custom/archive','POST',{id:activity.id});await refreshAssignments();showToast('Challenge archived. Existing results and learner links were preserved.');return;
    }
    if (action === 'live-room') { await showLiveRoomSetup(buttonEl.dataset.activity || ''); return; }
    if (action === 'live-rooms') { await showLiveRooms(); return; }
    if (action === 'live-room-resume') { await resumeLiveRoom(buttonEl.dataset.room, buttonEl); return; }
    if (action === 'room-exit') { closeLiveRoom(); return; }
    if (action === 'room-end' && liveRoom?.phoneMode) {
      const isSessionPulse=liveRoom.mode==='pulse'&&liveRoom.sessionPulseReturn;
      const isPulse=liveRoom.mode==='pulse';
      if (!window.confirm(isSessionPulse?'Finish this anonymous pulse and return to the session? Everyone on a phone will see that the pulse has ended.':'End this live room now? Everyone on a phone will see that the session has ended.')) return;
      await store.api('activities/live/close', 'POST', { room_id: liveRoom.roomId });
      if(isSessionPulse){returnFromSessionPulse();showToast('Pulse ended. You are back in the session.');}
      else {closeLiveRoom();showToast(isPulse?'Pulse ended. Temporary responses will expire automatically.':'Live room ended. Its temporary scores will expire automatically.');}
      return;
    }
    if (action === 'room-copy-invite' && liveRoom?.phoneMode) {
      await navigator.clipboard.writeText(liveRoomHref(liveRoom.joinCode));showToast('Phone join link copied. Share it with the class.');return;
    }
    if (action === 'room-fullscreen') {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (dialog.requestFullscreen) await dialog.requestFullscreen();
      else showToast('Fullscreen is not available in this browser.', true);
      return;
    }
    if (action === 'room-timer' && liveRoom?.timerDuration) {
      if (liveRoom.phoneMode) {
        let endsAt = null;
        if (liveRoom.timerEndsAt) liveRoom.timeLeft = Math.max(0, Math.ceil((liveRoom.timerEndsAt - Date.now()) / 1000));
        else { if (liveRoom.timeLeft <= 0) liveRoom.timeLeft = liveRoom.timerDuration;endsAt = new Date(Date.now() + liveRoom.timeLeft * 1000).toISOString(); }
        stopLiveRoomTimer();
        const snapshot = await store.api('activities/live/timer', 'POST', { room_id: liveRoom.roomId, ends_at: endsAt });
        applyLiveRoomSnapshot(snapshot);
        if (liveRoom.timerEndsAt) liveRoomTimer = window.setInterval(updateRoomClock, 250);
        renderLiveRoom();return;
      }
      if (liveRoom.timerEndsAt) {
        liveRoom.timeLeft=Math.max(0,Math.ceil((liveRoom.timerEndsAt-Date.now())/1000));
        liveRoom.timerEndsAt=0;
        stopLiveRoomTimer();
      } else {
        if(liveRoom.timeLeft<=0)liveRoom.timeLeft=liveRoom.timerDuration;
        liveRoom.timerEndsAt=Date.now()+liveRoom.timeLeft*1000;
        stopLiveRoomTimer();
        liveRoomTimer=window.setInterval(updateRoomClock,250);
      }
      renderLiveRoom();return;
    }
    if (action === 'room-reveal' && liveRoom) {
      stopLiveRoomTimer();liveRoom.timerEndsAt=0;
      if (liveRoom.phoneMode) { await syncLiveRoom(await store.api('activities/live/reveal','POST',{room_id:liveRoom.roomId}));return; }
      liveRoom.revealed=true;renderLiveRoom();return;
    }
    if (action === 'room-award' && liveRoom?.revealed && !liveRoom.pointAwarded) {
      const team=liveRoom.teams.find(row=>row.id===buttonEl.dataset.team);
      if(team){team.points+=100;liveRoom.history.push({teamId:team.id,roundIndex:liveRoom.roundIndex});liveRoom.pointAwarded=true;renderLiveRoom();}
      return;
    }
    if (action === 'room-undo' && liveRoom?.history.length) {
      const award=liveRoom.history.pop(),team=liveRoom.teams.find(row=>row.id===award.teamId);
      if(team)team.points=Math.max(0,team.points-100);
      if(award.roundIndex===liveRoom.roundIndex)liveRoom.pointAwarded=false;
      renderLiveRoom();return;
    }
    if (action === 'room-next' && liveRoom?.revealed) {
      if (liveRoom.phoneMode) { stopLiveRoomTimer();await syncLiveRoom(await store.api('activities/live/advance','POST',{room_id:liveRoom.roomId}));return; }
      stopLiveRoomTimer();liveRoom.timerEndsAt=0;liveRoom.roundIndex++;liveRoom.revealed=false;liveRoom.pointAwarded=false;liveRoom.timeLeft=liveRoom.timerDuration;renderLiveRoom();return;
    }
    if (action === 'room-finish' && liveRoom?.revealed) {
      stopLiveRoomTimer();liveRoom.timerEndsAt=0;
      if (liveRoom.phoneMode) { await syncLiveRoom(await store.api('activities/live/advance','POST',{room_id:liveRoom.roomId}));return; }
      liveRoom.finished=true;renderLiveRoom();return;
    }
    if (action === 'room-again' && liveRoom) {
      if (liveRoom.phoneMode) { await syncLiveRoom(await store.api('activities/live/replay','POST',{room_id:liveRoom.roomId}));return; }
      stopLiveRoomTimer();liveRoom.teams.forEach(team=>team.points=0);liveRoom.history=[];liveRoom.roundIndex=0;liveRoom.revealed=false;liveRoom.pointAwarded=false;liveRoom.timeLeft=liveRoom.timerDuration;liveRoom.timerEndsAt=0;liveRoom.finished=false;renderLiveRoom();return;
    }
    if (action === 'logout') { await store.logout(); state.assignments = [];state.sessionPlans=[];state.sessionSkills=[];state.facilitatorDeck=[];closeLiveRoom();render(); }
    if (action === 'new-assignment') showAssignmentForm(buttonEl.dataset.activity || '', buttonEl.dataset.trainee || '');
    if (action === 'plan-session') showSessionPlanForm(buttonEl.dataset.activity||'');
    if (action === 'plan-spaced-review') { showSessionPlanForm(buttonEl.dataset.activity||'',{spacedReview:true,focusSkill:buttonEl.dataset.focus||''}); return; }
    if (action === 'plans-retry') await refreshAssignments();
    if (action === 'assign-session-quiz') { assignSessionQuiz(buttonEl.dataset.plan); return; }
    if (action === 'view-session-assignment') {
      const assignmentId=buttonEl.dataset.assignment;
      const findCard=()=>{
        const index=filteredAssignments().findIndex(item=>item.id===assignmentId);
        return index<0?null:document.querySelectorAll('.assignment-card')[index]||null;
      };
      if(!findCard()){
        state.batchId='';state.companyId='';state.status='';state.query='';render();refreshClassroomPulse();
      }
      window.requestAnimationFrame(()=>{
        const target=findCard();
        if(!target)return;
        target.scrollIntoView({behavior:'smooth',block:'center'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.classList.add('session-assignment-highlight');
        window.setTimeout(()=>target.classList.remove('session-assignment-highlight'),1800);
      });
      return;
    }
    if (action === 'session-run') { startSessionRun(buttonEl.dataset.plan); return; }
    if (action === 'session-pulse') { showSessionPulseSetup(); return; }
    if (action === 'session-pulse-cancel') { cancelSessionPulseSetup(); return; }
    if (action === 'session-run-step') { selectSessionRunStep(Number(buttonEl.dataset.index)); return; }
    if (action === 'session-run-previous') { selectSessionRunStep((sessionRun?.stepIndex||0)-1); return; }
    if (action === 'session-run-next') { selectSessionRunStep((sessionRun?.stepIndex||0)+1); return; }
    if (action === 'session-run-timer') { toggleSessionRunTimer(); return; }
    if (action === 'session-run-reset') { resetSessionRunTimer(); return; }
    if (action === 'session-run-complete') { buttonEl.disabled=true; await completeSessionRunStep(); return; }
    if (action === 'session-run-fullscreen') {
      if(document.fullscreenElement===document.documentElement)await document.exitFullscreen();
      else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
      else showToast('Fullscreen is not available in this browser.');
      return;
    }
    if (action === 'session-step') {
      const plan=state.sessionPlans.find(item=>item.id===buttonEl.dataset.plan);
      if(!plan)throw new Error('This session board is no longer loaded. Refresh and try again.');
      buttonEl.disabled=true;
      try{
        await store.api('activities/session-plans/step','PATCH',{id:plan.id,expected_version:plan.version,step_id:buttonEl.dataset.step,completed:buttonEl.dataset.completed==='true'});
        await refreshAssignments();
      }catch(error){await refreshAssignments().catch(()=>{});throw error;}
      return;
    }
    if (action === 'dialog-close') dialog.close();
    if (action === 'select-visible') {
      const form = document.getElementById('assignment-form');
      form?.querySelectorAll('#roster-list input[type="checkbox"]').forEach(input => { input.checked = true; });
      form?.querySelector('#roster-list')?.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (action === 'edit-progress') showProgressForm(buttonEl.dataset.assignment, buttonEl.dataset.trainee);
    if (action === 'share-links') await showLearnerLinks(buttonEl.dataset.assignment);
    if (action === 'retry-links') await showLearnerLinks(buttonEl.dataset.assignment);
    if (action === 'show-link-qr') {
      const row = buttonEl.closest('.private-link-row');
      const panel = row?.querySelector('.private-link-qr');
      const frame = panel?.querySelector('.qr-code-frame');
      if (!row || !panel || !frame || !buttonEl.dataset.link) return;
      const visible = panel.hidden;
      panel.hidden = !visible;
      buttonEl.textContent = visible ? 'Hide QR' : 'Show QR';
      buttonEl.setAttribute('aria-expanded', String(visible));
      if (visible) {
        const traineeName = row.querySelector('strong')?.textContent?.trim() || 'this trainee';
        frame.dataset.qrUrl = buttonEl.dataset.link;
        frame.dataset.qrAlt = `QR code for ${traineeName}'s private challenge link`;
        if (!mountQrCode(frame)) showToast('QR is unavailable in this browser. Use the private link instead.', true);
      }
      return;
    }
    if (action === 'copy-link' || action === 'copy-all-links') {
      const value = action === 'copy-link' ? buttonEl.dataset.link : document.getElementById('links-content')?.dataset.copyAll;
      if (!value) throw new Error('There are no links available to copy.');
      await navigator.clipboard.writeText(value);
      showToast(action === 'copy-link' ? 'Private trainee link copied.' : 'All trainee links copied. Share each link with its named trainee.');
    }
    if (action === 'close-assignment') {
      const assignment = state.assignments.find(row => row.id === buttonEl.dataset.assignment);
      if (!assignment || !window.confirm(`Close “${assignment.title}”? Existing progress and feedback will be preserved; new coaching updates will be disabled.`)) return;
      await store.api('activities/close', 'POST', { id: assignment.id, expected_version: assignment.version, status: 'Closed' });
      await refreshAssignments();
      showToast('Assignment closed. Its progress history was preserved.');
    }
    if (action === 'reload') await refreshAssignments();
    if (action === 'academy-fallback') location.assign(academyUrl('/activities'));
    if (action === 'legacy-library') window.open(portalUrl('activities/'), '_blank', 'noopener');
    if (action === 'reset-filters') {
      state.batchId = ''; state.companyId = ''; state.status = ''; state.query = '';
      render();
      refreshClassroomPulse();
    }
    if (action === 'pulse-retry') refreshClassroomPulse();
  } catch (error) {
    showToast(error.message || 'The action could not be completed.', true);
  }
});

document.addEventListener('change', event => {
  if (event.target.id === 'filter-batch') { state.batchId = event.target.value; render(); refreshClassroomPulse(); }
  if (event.target.id === 'filter-company') { state.companyId = event.target.value; render(); refreshClassroomPulse(); }
  if (event.target.id === 'filter-status') { state.status = event.target.value; render(); }
});

document.addEventListener('input', event => {
  if (event.target.id !== 'filter-search') return;
  state.query = event.target.value;
  assignmentList();
});

document.addEventListener('submit', async event => {
  if (event.target.id !== 'trainer-login') return;
  event.preventDefault();
  const form = event.target;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    await store.login(form.elements.email.value, form.elements.password.value);
    store.error = '';
    render();
    await refreshAssignments();
  } catch (error) {
    store.error = error.message || 'Sign-in failed. Check your details and try again.';
    render();
  }
});

document.addEventListener('submit',async event=>{
 const form=event.target;if(form.id!=='custom-challenge-form')return;
 event.preventDefault();if(!store.canWrite())return;
 const submit=form.querySelector('[type="submit"]'),errorBox=document.getElementById('custom-challenge-error');
 const questionText=(card,name)=>card.querySelector(`[name="${name}"]`).value;
 const optionalText=(card,name)=>card.querySelector(`[name="${name}"]`)?.value||'';
 const challenge={
  title:form.elements.title.value,category:form.elements.category.value,level:form.elements.level.value,
  duration_minutes:Number(form.elements.duration_minutes.value),description:form.elements.description.value,
  arabic:{title:optionalText(form,'title_ar'),category:optionalText(form,'category_ar'),description:optionalText(form,'description_ar')},
  questions:[...form.querySelectorAll('[data-custom-question]')].map(card=>({prompt:questionText(card,'prompt'),options:[0,1,2,3].map(index=>questionText(card,`option_${index}`)),answer:Number(questionText(card,'answer')),skill:questionText(card,'skill'),hint:questionText(card,'hint'),explanation:questionText(card,'explanation'),arabic:{prompt:optionalText(card,'prompt_ar'),options:[0,1,2,3].map(index=>optionalText(card,`option_${index}_ar`)),hint:optionalText(card,'hint_ar'),explanation:optionalText(card,'explanation_ar')}})),
  study_cards:[...form.querySelectorAll('[data-custom-study]')].map(card=>({front:questionText(card,'front'),back:questionText(card,'back'),arabic:{front:optionalText(card,'front_ar'),back:optionalText(card,'back_ar')}})),
 };
 submit.disabled=true;errorBox.hidden=true;
 try{await store.api('activities/custom','POST',challenge);dialog.close();await refreshAssignments();showToast('Custom challenge saved to the shared library. Assign it or host it live when your class is ready.');}
 catch(error){errorBox.hidden=false;errorBox.textContent=error.message||'Could not save the custom challenge. Your draft is still here.';submit.disabled=false;}
});

store.addEventListener('change', () => {
  render();
  if (store.user && store.status === 'ready') scheduleRefresh();
  else state.assignments = [];
});
store.addEventListener('expired', () => { state.assignments = [];state.sessionPlans=[];state.sessionSkills=[];state.facilitatorDeck=[];closeLiveRoom();render();showToast('Your Academy session ended. Sign in again to continue.', true); });

if (liveRoomMatch) await launchLivePlayer();
else if (learnerRoute) await launchLearner();
else if (participantHost) learnerNotice('Private participant link required', 'Open the activity or classroom link shared by your trainer. This address does not open the trainer workspace.', true);
else {
  render();
  await store.init();
  render();
  if (store.user) await refreshAssignments();
}
