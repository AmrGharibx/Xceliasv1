import {assessmentFor,attendanceStats,checklist,checklistFor,scores,validDate} from './core.mjs';
import {btn,closeModal,dateLabel,e,fmt,icon,openModal,toast} from './ui.mjs';
import {companyReportJobs,downloadCompanyReport} from './reporter-generator.mjs';

const SCORE_FIELDS=[
 ['mapping','Mapping'],
 ['product_knowledge','Product knowledge'],
 ['presentability','Presentability'],
 ['soft_skills','Soft skills']
];

/** Mirrors the standalone Reporter Generator's four-skill, equally weighted formula. */
export function reporterTier(percent){
 if(!Number.isFinite(percent))return 'Assessment pending';
 if(percent>=90)return 'Aced';
 if(percent>=80)return 'Excellent';
 if(percent>=70)return 'Good';
 if(percent>=60)return 'Passed';
 return 'Needs attention';
}

export function reporterAssessment(assessment){
 if(!assessment||assessment.analytics_included===false||assessment.analytics_included===0||['not_assessed','assessment_missed','assessment_excused'].includes(assessment.source_meta?.assessment_state))return {complete:false,tech:null,soft:null,overall:null,tier:'Assessment pending'};
 const result=scores(assessment);
 return {...result,complete:result.overall!==null,tier:reporterTier(result.overall)};
}

function strengths(assessment){
 return SCORE_FIELDS.map(([key,label])=>({key,label,value:assessment?.[key]})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value);
}

export function reportNarrative(item){
 const attendance=item.attendance,check=item.checklist;
 const attendanceLine=attendance.rate===null
  ? 'Attendance is still being recorded; unrecorded sessions are not treated as absences.'
  : `Recorded classroom attendance is ${fmt(attendance.rate,1)}% (${attendance.present} present and ${attendance.absent} absent).`;
 const checklistLine=item.trainee.enrollment_status==='Never Started'
  ? 'Enrollment status: Never Started. The trainee was enrolled but did not attend any sessions; ongoing attendance and session-progress counts exclude this enrollment.'
  : check
  ? `The attendance checklist shows ${check.count} of ${check.total} due scheduled sessions attended${check.tour?`, including ${check.tour} tour day${check.tour===1?'':'s'}`:''}. It reflects Daily Attendance; future and off days are not counted as due sessions.`
  : 'No scheduled sessions are available for the attendance checklist yet.';
 if(!item.profile.complete){
  const reason=item.assessment?.instructor_comment?.trim();
  if(item.reportStatus.code==='stopped'){const stoppedLine=item.attendedDays>0?`The trainee stopped attending after ${item.attendedDays} attended training day${item.attendedDays===1?'':'s'}.`:'Enrollment is marked Stopped Attending, but no attended training days are recorded, so the duration cannot be confirmed.';return `${stoppedLine} No formal assessment was completed, so no marks or failing result have been assigned. ${attendanceLine} ${checklistLine}`;}
  if(item.reportStatus.code==='never_started')return `The trainee was enrolled but never attended from the first day. No assessment was made, and no marks or failing result have been assigned. ${attendanceLine} ${checklistLine}`;
  if(item.reportStatus.code==='assessment_missed')return `The trainee did not attend the scheduled assessment. No marks or result have been recorded; a make-up assessment is needed. ${attendanceLine} ${checklistLine}`;
  if(item.reportStatus.code==='assessment_excused')return `The assessment absence was excused, so the assessment remains pending. No marks or result have been assigned${reason?`; recorded excuse or trainer note: ${reason}`:''}. ${attendanceLine} ${checklistLine}`;
  return `A complete four-skill assessment has not been saved, so this report does not assign a score band or infer a result. ${attendanceLine} ${checklistLine} Complete the measured assessment when evidence is available, then review practical next steps with the trainee.`;
 }
 const ranked=strengths(item.assessment),strongest=ranked[0],focus=ranked.at(-1);
 const scoreLine=`The measured profile is ${item.profile.tier}: ${fmt(item.profile.overall,1)}% overall, with ${fmt(item.profile.tech,1)}% technical and ${fmt(item.profile.soft,1)}% people skills.`;
 const development=focus.value<4
  ? `Prioritize a focused practice activity for ${focus.label.toLowerCase()} (${fmt(focus.value,2)}/5), then review it with a concrete example.`
  : `Maintain the current standard through practical application, with particular attention to ${focus.label.toLowerCase()} (${fmt(focus.value,2)}/5).`;
 const enrollmentNote=item.trainee.enrollment_status==='Stopped Attending'?(item.attendedDays>0?` Enrollment is marked Stopped Attending after ${item.attendedDays} attended training day${item.attendedDays===1?'':'s'}.`:' Enrollment is marked Stopped Attending, but no attended training days are recorded, so the duration cannot be confirmed.'):'';
 return `${scoreLine} The strongest assessed area is ${strongest.label} (${fmt(strongest.value,2)}/5). ${development} ${attendanceLine} ${checklistLine}${enrollmentNote}`;
}

function reportStatus(trainee,assessment,profile){
 if(profile.complete)return {code:'assessed',label:profile.tier};
 if(trainee.enrollment_status==='Never Started')return {code:'never_started',label:'Never Started'};
 if(trainee.enrollment_status==='Stopped Attending')return {code:'stopped',label:'Stopped Attending'};
 const sourceState=assessment?.source_meta?.assessment_state;
 if(sourceState==='assessment_missed')return {code:'assessment_missed',label:'Assessment not attended'};
 if(sourceState==='assessment_excused')return {code:'assessment_excused',label:'Excused - pending assessment'};
 return {code:'pending',label:'Assessment pending'};
}

const reportOrder={assessed:0,assessment_missed:1,assessment_excused:2,never_started:3,pending:4,stopped:5};

export function buildBatchReport(data,{batchId,companyId='',traineeId='',traineeIds=[]}){
 const batch=data.batches.find(row=>row.id===batchId);
 if(!batch)throw new Error('Batch not found.');
 if(!Array.isArray(traineeIds)||traineeIds.some(id=>typeof id!=='string'))throw new Error('Choose valid trainees for this report.');
 if(traineeId&&traineeIds.length)throw new Error('Choose a single trainee or a multi-trainee selection, not both.');
 const selectedIds=[...new Set(traineeIds)];
 const selectedTrainees=selectedIds.length?selectedIds.map(id=>data.trainees.find(row=>row.id===id)):[];
 if(selectedTrainees.some(row=>!row||row.batch_id!==batch.id||companyId&&row.company_id!==companyId))throw new Error('One or more selected trainees are outside the selected batch or company.');
 if(new Set(selectedTrainees.map(row=>row.company_id||'__unassigned__')).size>1)throw new Error('Select trainees from the same company for a focused report.');
 const companyById=new Map(data.companies.map(row=>[row.id,row]));
 const selectedSet=new Set(selectedIds);
 const trainees=data.trainees.filter(row=>row.batch_id===batch.id&&(!companyId||row.company_id===companyId)&&(!traineeId||row.id===traineeId)&&(!selectedSet.size||selectedSet.has(row.id)));
 const items=trainees.map(trainee=>{
  const assessment=assessmentFor(data,trainee.id),profile=reporterAssessment(assessment);
  const attendanceRows=data.daily_attendance.filter(row=>row.trainee_id===trainee.id&&row.batch_id===batch.id);
  const attendance=attendanceStats(attendanceRows),attendedDays=new Set(attendanceRows.filter(row=>row.analytics_included!==false&&row.analytics_included!==0&&['Present','Tour Day'].includes(row.status)&&validDate(row.date)).map(row=>row.date)).size;
  const summary=checklistFor(data,trainee.id),check=summary?{count:summary.count,total:summary.total,percent:summary.percent,tour:summary.tour}:null;
  const status=reportStatus(trainee,assessment,profile);
  const item={trainee,batch,company:companyById.get(trainee.company_id)||null,assessment,profile,attendance,checklist:check,attendedDays,reportStatus:status,reportOrderCode:trainee.enrollment_status==='Stopped Attending'?'stopped':status.code,trainingCompleted:profile.complete};
  return {...item,narrative:reportNarrative(item)};
 }).sort((a,b)=>(reportOrder[a.reportOrderCode]??99)-(reportOrder[b.reportOrderCode]??99)||a.trainee.trainee_name.localeCompare(b.trainee.trainee_name));
 const assessed=items.filter(item=>item.profile.complete);
 const completionCounts={total:items.length,completed:items.filter(item=>item.trainingCompleted).length,notCompleted:items.filter(item=>!item.trainingCompleted).length};
 return {
  batch,
  companyId,
  traineeId,
  company:companyId?companyById.get(companyId)||null:null,
  traineeIds:selectedIds,
  items,
  assessed:assessed.length,
  pending:items.length-assessed.length,
  completionCounts,
  average:assessed.length?assessed.reduce((sum,item)=>sum+item.profile.overall,0)/assessed.length:null
 };
}

function companyOptions(data,batch){
 const ids=[...new Set(data.trainees.filter(row=>row.batch_id===batch.id).map(row=>row.company_id).filter(Boolean))];
 return ids.map(id=>data.companies.find(company=>company.id===id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
}

function release(urls){for(const url of urls)URL.revokeObjectURL(url);urls.clear();}

async function hydratePortraits(root,store,urls){
 const slots=[...root.querySelectorAll('[data-academy-photo-id]')];
 await Promise.allSettled(slots.map(async slot=>{
  try{
   const url=await store.traineePhoto(slot.dataset.academyPhotoId);
   if(!url||!slot.isConnected)return;
   urls.add(url);const image=document.createElement('img');image.src=url;image.alt=`Portrait of ${slot.dataset.academyPhotoName||'trainee'}`;image.decoding='async';
   slot.classList.add('has-photo');slot.replaceChildren(image);
  }catch{}
  finally{slot.classList.remove('is-loading');}
 }));
}

function rosterRow(ctx,trainee,company,write){
 const label=company?.name||'Company not recorded';
 return `<article class="academy-roster-row"><div class="academy-photo-slot is-loading" data-academy-photo-id="${e(trainee.id)}" data-academy-photo-name="${e(trainee.trainee_name)}">${icon('users',18)}<span>Portrait</span></div><div class="academy-roster-person"><strong>${e(trainee.trainee_name)}</strong><span>${e(label)}${trainee.job_title?` &middot; ${e(trainee.job_title)}`:''}</span></div>${write?`<input id="academy-portrait-${e(trainee.id)}" data-academy-portrait-input="${e(trainee.id)}" type="file" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="btn small" data-academy-portrait-select="${e(trainee.id)}">${icon('edit',14)}<span>Add / replace photo</span></button>`:'<span class="faint" style="font-size:10px">Portrait managed by instructors</span>'}</article>`;
}

function legacyBuilderMarkup(ctx,batch,selectedCompany){
 const data=ctx.store.data,companies=companyOptions(data,batch),selected=selectedCompany||'',roster=data.trainees.filter(row=>row.batch_id===batch.id&&(!selected||row.company_id===selected)).sort((a,b)=>a.trainee_name.localeCompare(b.trainee_name));
 const write=ctx.store.canWrite();
 return `<div id="academy-report-builder"><div class="academy-report-intro"><span>${icon('book',18)}</span><div><strong>Internal trainee reports</strong><p>Uses the academy’s recorded attendance and four-skill assessments. The score formula and bands match the standalone Reporter Generator; this workflow does not change that tool.</p></div></div><div class="form-grid"><label class="field full" for="academy-report-company"><span>Company</span><select id="academy-report-company"><option value="" ${selected?'':'selected'}>All companies in this batch</option>${companies.map(company=>`<option value="${e(company.id)}" ${company.id===selected?'selected':''}>${e(company.name)}</option>`).join('')}</select><small>Select Company RED for a Company RED batch report.</small></label></div><div class="academy-roster-head"><div><strong>${roster.length} trainee${roster.length===1?'':'s'} selected</strong><span>Portraits are private server records and never included in AI requests.</span></div></div><div class="academy-roster-list">${roster.map(trainee=>rosterRow(ctx,trainee,data.companies.find(company=>company.id===trainee.company_id),write)).join('')||'<p class="faint" style="padding:16px 0">No trainees match this company selection.</p>'}</div>${write&&ctx.store.aiEnabled?'<label class="checkbox-field academy-ai-consent"><input id="academy-report-ai-consent" type="checkbox">I approve sending anonymized score and attendance totals to the configured AI provider for this report preview. Names, photos, contact details, and instructor comments are excluded.</label>':'<p class="academy-local-note">This report uses the built-in local report engine. AI drafts are unavailable until an authorized administrator configures the provider.</p>'}<div class="modal-actions"><button type="button" class="btn primary" data-academy-build-report ${roster.length?'':'disabled'}>${icon('book',16)}<span>Generate trainee reports</span></button></div></div>`;
}

// The batch workflow uses the exact standalone PDF exporter while retaining
// the existing review preview below for quick on-screen checks.
function builderMarkup(ctx,batch,selectedCompany,selectedTrainee='',selectedTraineeIds=[]){
 const data=ctx.store.data,companies=companyOptions(data,batch),selected=selectedCompany||'',write=ctx.store.canWrite();
 const trainees=data.trainees.filter(row=>row.batch_id===batch.id&&(!selected||row.company_id===selected)).sort((a,b)=>a.trainee_name.localeCompare(b.trainee_name));
 const rosterIds=selectedTraineeIds.length?selectedTraineeIds:selectedTrainee?[selectedTrainee]:[];
 const roster=rosterIds.length?trainees.filter(row=>rosterIds.includes(row.id)):trainees;
 const selection=selected?`<details class="academy-trainee-multiselect" ${selectedTraineeIds.length?'open':''}><summary>Select multiple trainees from this company</summary><p>Leave all boxes clear to include the whole company. Select one or more names for a focused report.</p><div class="academy-trainee-select-actions"><button type="button" class="btn small" data-academy-select-all-trainees>Select all</button><button type="button" class="btn small secondary" data-academy-clear-trainees>Clear selection</button></div><div class="academy-trainee-select-list">${trainees.map(trainee=>`<label><input type="checkbox" data-academy-trainee-select="${e(trainee.id)}" ${rosterIds.includes(trainee.id)?'checked':''}><span>${e(trainee.trainee_name)}</span></label>`).join('')||'<p class="faint">No trainees are enrolled with this company in the selected batch.</p>'}</div></details>`:'';
 return `<div id="academy-report-builder">
  <div class="academy-report-intro"><span>${icon('book',18)}</span><div><strong>Internal trainee reports</strong><p>Create an A4 report for one trainee, a company, or the whole batch, including portraits, scores, attendance, comments, and concluding remarks.</p></div></div>
  <div class="form-grid">
   <label class="field" for="academy-report-company"><span>Company</span><select id="academy-report-company"><option value="" ${selected?'':'selected'}>All companies in this batch</option>${companies.map(company=>`<option value="${e(company.id)}" ${company.id===selected?'selected':''}>${e(company.name)}</option>`).join('')}</select><small>Narrow the trainee list to one company, or include all companies.</small></label>
    <label class="field" for="academy-report-trainee"><span>Trainee</span><select id="academy-report-trainee" ${selectedTraineeIds.length?'disabled':''}><option value="" ${selectedTrainee?'':'selected'}>${selectedTraineeIds.length?'Using the selected trainees':'All trainees in scope'}</option>${trainees.map(trainee=>`<option value="${e(trainee.id)}" ${trainee.id===selectedTrainee?'selected':''}>${e(trainee.trainee_name)}${selected?'':` — ${e(data.companies.find(company=>company.id===trainee.company_id)?.name||'Company not recorded')}`}</option>`).join('')}</select><small>Choose one trainee, or select several from one company below.</small></label>
  </div>
   ${selection}
  <div class="academy-roster-head"><div><strong>${roster.length} trainee${roster.length===1?'':'s'} selected</strong><span>Portraits are private server records and are never sent to the AI provider.</span></div></div>
  <div class="academy-roster-list">${roster.map(trainee=>rosterRow(ctx,trainee,data.companies.find(company=>company.id===trainee.company_id),write)).join('')||'<p class="faint" style="padding:16px 0">No trainees match this selection.</p>'}</div>
  ${write&&ctx.store.aiEnabled?'<label class="checkbox-field academy-ai-consent"><input id="academy-report-ai-consent" type="checkbox">I approve sending anonymized score and attendance totals to the configured AI provider for this report preview. Names, photos, contact details, and instructor comments are excluded.</label>':'<p class="academy-local-note">This report uses the built-in local report engine. AI drafts are unavailable until an authorized administrator configures the provider.</p>'}
   <div class="modal-actions"><button type="button" class="btn primary" data-academy-company-pdf ${roster.length?'':'disabled'}>${icon('download',16)}<span>${selectedTraineeIds.length>1?'Generate selected trainees PDF':selectedTraineeIds.length===1?'Generate trainee PDF':selectedTrainee?'Generate trainee PDF':selected?'Generate company PDF':'Generate company PDFs'}</span></button><button type="button" class="btn secondary" data-academy-all-pdfs ${data.trainees.some(row=>row.batch_id===batch.id)?'':'disabled'}>${icon('download',16)}<span>Generate all company PDFs</span></button><button type="button" class="btn secondary" data-academy-build-report ${roster.length?'':'disabled'}>${icon('book',16)}<span>Open review preview</span></button></div>
 </div>`;
}

async function generateCompanyPdfs(ctx,batch,companyId,trigger,traineeId='',traineeIds=[]){
 const report=buildBatchReport(ctx.store.data,{batchId:batch.id,companyId,traineeId,traineeIds});
 const jobs=companyReportJobs(report);
 if(!jobs.length){toast('There are no trainees matching this report selection.','error');return;}
 if(trigger)trigger.disabled=true;
 try{
   for(let index=0;index<jobs.length;index++){
    const job=jobs[index];toast('Generating '+(traineeId||traineeIds.length?job.items[0].trainee.trainee_name+(traineeIds.length>1?' and selected trainees':''):job.companyName)+' ('+(index+1)+' of '+jobs.length+')...');
   await downloadCompanyReport(job,ctx.store,progress=>{if(trigger)trigger.dataset.progress=progress.page+'/'+progress.total;});
  }
   toast(traineeId||traineeIds.length===1?'Trainee PDF downloaded.':traineeIds.length>1?'Selected trainee PDF downloaded.':jobs.length===1?'Company PDF downloaded.':jobs.length+' company PDFs downloaded.');
 }catch(error){console.error(error);toast('The PDF could not be generated. Check the browser download permission and try again.','error');}
 finally{if(trigger){trigger.disabled=false;delete trigger.dataset.progress;}}
}

export function academyReportModal(ctx,batch,initialCompanyId='',initialTraineeId='',initialTraineeIds=[]){
 if(!batch){toast('This batch is no longer available.','error');return;}
 if(initialTraineeId&&!ctx.store.data.trainees.some(row=>row.id===initialTraineeId&&row.batch_id===batch.id&&(!initialCompanyId||row.company_id===initialCompanyId))){toast('This trainee is no longer in the selected batch and company. Choose the trainee again.','error');return;}
 if(!Array.isArray(initialTraineeIds)||initialTraineeIds.some(id=>typeof id!=='string')){toast('The selected trainee list is invalid. Please select the trainees again.','error');return;}
 const selectedRows=initialTraineeIds.map(id=>ctx.store.data.trainees.find(row=>row.id===id));
 if(selectedRows.some(row=>!row||row.batch_id!==batch.id||initialCompanyId&&row.company_id!==initialCompanyId)||new Set(selectedRows.map(row=>row?.company_id||'__unassigned__')).size>1){toast('Choose trainees from one company in the selected batch.','error');return;}
 let selectedCompany=initialCompanyId,selectedTrainee=initialTraineeId,selectedTraineeIds=[...new Set(initialTraineeIds)];
 if(selectedTraineeIds.length)selectedTrainee='';
 const portraitUrls=new Set();
 const renderBuilder=()=>{
  release(portraitUrls);const body=document.querySelector('.modal-body');if(!body)return;
   body.innerHTML=builderMarkup(ctx,batch,selectedCompany,selectedTrainee,selectedTraineeIds);bindBuilder();
 };
 const bindBuilder=()=>{
  const root=document.getElementById('academy-report-builder');if(!root)return;
  hydratePortraits(root,ctx.store,portraitUrls);
   root.querySelector('#academy-report-company').onchange=event=>{selectedCompany=event.currentTarget.value;selectedTrainee='';selectedTraineeIds=[];renderBuilder();};
   root.querySelector('#academy-report-trainee').onchange=event=>{selectedTrainee=event.currentTarget.value;selectedTraineeIds=[];renderBuilder();};
   root.querySelectorAll('[data-academy-trainee-select]').forEach(input=>input.addEventListener('change',()=>{selectedTrainee='';selectedTraineeIds=[...root.querySelectorAll('[data-academy-trainee-select]:checked')].map(box=>box.dataset.academyTraineeSelect);renderBuilder();}));
   root.querySelector('[data-academy-select-all-trainees]')?.addEventListener('click',()=>{selectedTrainee='';selectedTraineeIds=ctx.store.data.trainees.filter(row=>row.batch_id===batch.id&&row.company_id===selectedCompany).map(row=>row.id);renderBuilder();});
   root.querySelector('[data-academy-clear-trainees]')?.addEventListener('click',()=>{selectedTrainee='';selectedTraineeIds=[];renderBuilder();});
  root.querySelectorAll('[data-academy-portrait-select]').forEach(button=>button.addEventListener('click',()=>root.querySelector(`#academy-portrait-${button.dataset.academyPortraitSelect}`).click()));
  root.querySelectorAll('[data-academy-portrait-input]').forEach(input=>input.addEventListener('change',async event=>{
   const file=event.currentTarget.files?.[0];if(!file)return;
   const trigger=root.querySelector(`[data-academy-portrait-select="${event.currentTarget.dataset.academyPortraitInput}"]`);if(trigger)trigger.disabled=true;
   try{await ctx.store.saveTraineePhoto(event.currentTarget.dataset.academyPortraitInput,await compressPortrait(file));toast('Private trainee portrait saved.');renderBuilder();}
   catch(error){toast(error.message||'The portrait could not be saved.','error');if(trigger)trigger.disabled=false;}
  }));
  root.querySelector('[data-academy-build-report]').onclick=()=>{
    const report=buildBatchReport(ctx.store.data,{batchId:batch.id,companyId:selectedCompany,traineeId:selectedTrainee,traineeIds:selectedTraineeIds});
   openReportPreview(ctx,report,!!root.querySelector('#academy-report-ai-consent')?.checked);
  };
   root.querySelector('[data-academy-company-pdf]')?.addEventListener('click',event=>generateCompanyPdfs(ctx,batch,selectedCompany,event.currentTarget,selectedTrainee,selectedTraineeIds));
  root.querySelector('[data-academy-all-pdfs]')?.addEventListener('click',event=>generateCompanyPdfs(ctx,batch,'',event.currentTarget));
 };
  openModal('Generate trainee reports',`${batch.batch_name} · Select a company, one trainee, or multiple trainees from the same company.`,builderMarkup(ctx,batch,selectedCompany,selectedTrainee,selectedTraineeIds),{wide:true});
 document.querySelector('[data-action="close-modal"]')?.addEventListener('click',()=>release(portraitUrls),{once:true});
 document.querySelector('.modal-overlay')?.addEventListener('click',event=>{if(event.target.classList.contains('modal-overlay'))release(portraitUrls);});
 bindBuilder();
}

export async function compressPortrait(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPEG, PNG, or WebP portrait.');
 if(file.size>6*1024*1024)throw new Error('Choose a portrait smaller than 6 MB.');
 const objectUrl=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{const node=new Image();node.onload=()=>resolve(node);node.onerror=()=>reject(new Error('The image could not be read.'));node.src=objectUrl;});
  const ratio=.75;let sourceWidth=image.naturalWidth,sourceHeight=image.naturalHeight,sourceX=0,sourceY=0;
  if(sourceWidth/sourceHeight>ratio){sourceWidth=Math.round(sourceHeight*ratio);sourceX=Math.round((image.naturalWidth-sourceWidth)/2);}else{sourceHeight=Math.round(sourceWidth/ratio);sourceY=Math.round((image.naturalHeight-sourceHeight)/2);}
  for(let width=480;width>=220;width-=65){
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width/ratio);const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#f4f5f7';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,sourceX,sourceY,sourceWidth,sourceHeight,0,0,canvas.width,canvas.height);
   for(const quality of [.82,.72,.62,.52]){const encoded=canvas.toDataURL('image/jpeg',quality);if(encoded.length<=100000)return encoded;}
  }
  throw new Error('This portrait could not be compressed below 80 KB. Use a smaller image.');
 }finally{URL.revokeObjectURL(objectUrl);}
}

function scoreRows(item){
 if(!item.profile.complete)return `<p class="academy-pending">${e(item.reportStatus.label)}. No skill marks or failing result have been entered.</p>`;
 return `<table class="academy-score-table"><tbody>${SCORE_FIELDS.map(([key,label])=>`<tr><th>${e(label)}</th><td>${fmt(item.assessment[key],2)} / 5</td></tr>`).join('')}<tr class="academy-score-total"><th>Technical / people / overall</th><td>${fmt(item.profile.tech,1)}% / ${fmt(item.profile.soft,1)}% / ${fmt(item.profile.overall,1)}%</td></tr></tbody></table>`;
}

function reportSheet(item,write,allowAi){
 const attendance=item.attendance,check=item.checklist,assessmentLabel=item.reportStatus.label;
 return `<article class="academy-report-sheet" data-academy-trainee="${e(item.trainee.id)}"><header class="academy-sheet-head"><div class="academy-photo-slot is-loading" data-academy-photo-id="${e(item.trainee.id)}" data-academy-photo-name="${e(item.trainee.trainee_name)}">${icon('users',26)}<span>Portrait</span></div><div><span class="academy-overline">TRAINEE PERFORMANCE REPORT</span><h2>${e(item.trainee.trainee_name)}</h2><p>${e(item.company?.name||'Company not recorded')} · ${e(item.batch.batch_name)}${item.trainee.job_title?` · ${e(item.trainee.job_title)}`:''}</p></div><span class="academy-tier">${e(assessmentLabel)}</span></header><div class="academy-report-columns"><section><h3>Measured performance</h3>${scoreRows(item)}<p class="academy-measure-note">The technical score is Product knowledge + Mapping; the people score is Presentability + Soft skills. Each pair is out of 10 and expressed as a percentage.</p></section><section><h3>Recorded participation</h3><dl class="academy-attendance"><div><dt>Present</dt><dd>${attendance.present}</dd></div><div><dt>Absent</dt><dd>${attendance.absent}</dd></div><div><dt>Recorded rate</dt><dd>${attendance.rate===null?'Not yet available':fmt(attendance.rate,1)+'%'}</dd></div><div><dt>Manual late flags</dt><dd>${attendance.late}</dd></div><div><dt>After 11:00 AM</dt><dd>${attendance.calculatedLate}</dd></div><div><dt>Checklist</dt><dd>${check?`${check.percent}% (${check.count}/${check.total})`:'Not started'}</dd></div></dl><p class="academy-measure-note">Attendance totals use saved classroom records only. The checklist is separate; unrecorded sessions are not absences.</p></section></div><section class="academy-narrative-card"><div><h3>Performance narrative</h3><span class="academy-edit-note">${write?'Editable for this printout only':'Built-in local narrative'}</span></div><div class="academy-narrative" data-academy-narrative="${e(item.trainee.id)}" contenteditable="${write?'true':'false'}" role="textbox" aria-label="Editable performance narrative for ${e(item.trainee.trainee_name)}">${e(item.narrative)}</div>${item.assessment?.instructor_comment?`<p class="academy-instructor-comment"><strong>Instructor comment:</strong> ${e(item.assessment.instructor_comment)}</p>`:''}${allowAi&&item.profile.complete?`<div class="academy-ai-row"><button type="button" class="btn small" data-academy-ai="${e(item.trainee.id)}">${icon('spark',14)}<span>Generate AI draft</span></button><span>Uses anonymized metrics only. Review before printing.</span></div>`:''}</section><footer><span>Internal company training record</span><span>Generated ${dateLabel(new Date().toISOString(),{year:'numeric',month:'long',day:'numeric'})}</span></footer></article>`;
}

function previewMarkup(report,write,allowAi){
 const company=report.company?.name||'All companies in this batch';
 const completion=report.completionCounts||{total:report.items.length,completed:0,notCompleted:report.items.length};
 return `<div id="academy-report-preview" class="academy-report-preview"><div class="academy-preview-actions"><button type="button" class="btn secondary" data-academy-back>${icon('arrow',16)}<span>Back to selection</span></button><span class="academy-preview-summary">${report.items.length} trainee${report.items.length===1?'':'s'} · ${report.assessed} assessed · ${report.pending} awaiting assessment${report.average===null?'':` · ${fmt(report.average,1)}% assessed average`}</span><button type="button" class="btn primary" data-academy-print disabled>${icon('external',16)}<span>Print / Save PDF</span></button></div><header class="academy-report-cover"><span class="academy-overline">INTERNAL TRAINING ACADEMY</span><h1>Trainee Performance Report</h1><p>${e(report.batch.batch_name)} · ${e(company)}</p><dl><div><dt>Number of trainees</dt><dd>${completion.total}</dd></div><div><dt>Completed training</dt><dd>${completion.completed}</dd></div><div><dt>Not completed</dt><dd>${completion.notCompleted}</dd></div></dl><p class="academy-cover-note">A trainee is counted as completed when the batch is marked Completed and their enrollment is Active. Not completed includes batches still in progress, Stopped Attending, and Never Started. Assessment status is reported separately.</p></header>${report.items.map(item=>reportSheet(item,write,allowAi)).join('')||'<div class="empty"><h3>No trainees selected</h3><p>Return to the selection screen and choose a company with enrolled trainees.</p></div>'}</div>`;
}

function openReportPreview(ctx,report,allowAi){
 const portraitUrls=new Set();
 openModal('Trainee report preview',`${report.batch.batch_name} · Review all content before printing or saving a PDF.`,previewMarkup(report,ctx.store.canWrite(),allowAi),{wide:true});
 const modal=document.querySelector('.modal');modal?.classList.add('academy-report-modal');
 const root=document.getElementById('academy-report-preview');
 const reportSheets=root?.querySelectorAll('.academy-report-sheet')||[];
 report.items.forEach((item,index)=>{
  const sheet=reportSheets[index],values=sheet?.querySelectorAll('.academy-attendance dd'),check=item.checklist;
  if(values?.[5])values[5].textContent=check?`${check.count} of ${check.total} due sessions attended (${fmt(check.percent,1)}%)`:'No scheduled sessions';
  const note=sheet?.querySelector('.academy-attendance')?.nextElementSibling;
  if(note)note.textContent='This checklist is derived from scheduled batch dates and Daily Attendance. Present and Tour Day count as attended; Off Day is excluded, and an unrecorded date is not an absence.';
 });
 hydratePortraits(root,ctx.store,portraitUrls).then(()=>root.querySelector('[data-academy-print]')?.removeAttribute('disabled'));
  root.querySelector('[data-academy-back]').onclick=()=>{release(portraitUrls);academyReportModal(ctx,report.batch,report.companyId,report.traineeId,report.traineeIds);};
 root.querySelector('[data-academy-print]').onclick=()=>{
  document.body.classList.add('printing-academy');const clear=()=>document.body.classList.remove('printing-academy');window.addEventListener('afterprint',clear,{once:true});window.print();setTimeout(clear,0);
 };
 root.querySelectorAll('[data-academy-ai]').forEach(button=>button.addEventListener('click',async event=>{
  const traineeId=event.currentTarget.dataset.academyAi,narrative=root.querySelector(`[data-academy-narrative="${traineeId}"]`),original=event.currentTarget.innerHTML;
  event.currentTarget.disabled=true;event.currentTarget.innerHTML=icon('refresh',14)+'<span>Generating…</span>';
  try{const result=await ctx.store.api('ai','POST',{traineeId,kind:'assessment',consent:true});narrative.textContent=result.report;toast('AI draft added. Review it before printing.');}
  catch(error){toast(error.message||'The AI draft could not be generated.','error');}
  finally{event.currentTarget.disabled=false;event.currentTarget.innerHTML=original;}
 }));
 document.querySelector('[data-action="close-modal"]')?.addEventListener('click',()=>release(portraitUrls),{once:true});
 document.querySelector('.modal-overlay')?.addEventListener('click',event=>{if(event.target.classList.contains('modal-overlay'))release(portraitUrls);});
}
