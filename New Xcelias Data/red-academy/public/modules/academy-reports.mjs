import {assessmentFor,attendanceStats,checklist,checklistFor,scores} from './core.mjs';
import {btn,closeModal,dateLabel,e,fmt,icon,openModal,toast} from './ui.mjs';

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
 if(!assessment||assessment.analytics_included===false||assessment.analytics_included===0||assessment.source_meta?.assessment_state==='not_assessed')return {complete:false,tech:null,soft:null,overall:null,tier:'Assessment pending'};
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
 const checklistLine=check
  ? `The separate 10-session checklist is ${check.percent}% complete (${check.count}/10).`
  : 'No 10-session checklist has been saved.';
 if(!item.profile.complete)return `A complete four-skill assessment has not been saved, so this report does not assign a score band or infer a result. ${attendanceLine} ${checklistLine} Complete the measured assessment when evidence is available, then review practical next steps with the trainee.`;
 const ranked=strengths(item.assessment),strongest=ranked[0],focus=ranked.at(-1);
 const scoreLine=`The measured profile is ${item.profile.tier}: ${fmt(item.profile.overall,1)}% overall, with ${fmt(item.profile.tech,1)}% technical and ${fmt(item.profile.soft,1)}% people skills.`;
 const development=focus.value<4
  ? `Prioritize a focused practice activity for ${focus.label.toLowerCase()} (${fmt(focus.value,2)}/5), then review it with a concrete example.`
  : `Maintain the current standard through practical application, with particular attention to ${focus.label.toLowerCase()} (${fmt(focus.value,2)}/5).`;
 return `${scoreLine} The strongest assessed area is ${strongest.label} (${fmt(strongest.value,2)}/5). ${development} ${attendanceLine} ${checklistLine}`;
}

export function buildBatchReport(data,{batchId,companyId=''}){
 const batch=data.batches.find(row=>row.id===batchId);
 if(!batch)throw new Error('Batch not found.');
 const companyById=new Map(data.companies.map(row=>[row.id,row]));
 const trainees=data.trainees.filter(row=>row.batch_id===batch.id&&(!companyId||row.company_id===companyId)).sort((a,b)=>a.trainee_name.localeCompare(b.trainee_name));
 const items=trainees.map(trainee=>{
  const assessment=assessmentFor(data,trainee.id),profile=reporterAssessment(assessment);
  const attendance=attendanceStats(data.daily_attendance.filter(row=>row.trainee_id===trainee.id&&row.batch_id===batch.id));
  const summary=checklistFor(data,trainee.id),check=summary?checklist(summary.days):null;
  const item={trainee,batch,company:companyById.get(trainee.company_id)||null,assessment,profile,attendance,checklist:check};
  return {...item,narrative:reportNarrative(item)};
 });
 const assessed=items.filter(item=>item.profile.complete);
 return {
  batch,
  companyId,
  company:companyId?companyById.get(companyId)||null:null,
  items,
  assessed:assessed.length,
  pending:items.length-assessed.length,
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

function builderMarkup(ctx,batch,selectedCompany){
 const data=ctx.store.data,companies=companyOptions(data,batch),selected=selectedCompany||'',roster=data.trainees.filter(row=>row.batch_id===batch.id&&(!selected||row.company_id===selected)).sort((a,b)=>a.trainee_name.localeCompare(b.trainee_name));
 const write=ctx.store.canWrite();
 return `<div id="academy-report-builder"><div class="academy-report-intro"><span>${icon('book',18)}</span><div><strong>Internal trainee reports</strong><p>Uses the academy’s recorded attendance and four-skill assessments. The score formula and bands match the standalone Reporter Generator; this workflow does not change that tool.</p></div></div><div class="form-grid"><label class="field full" for="academy-report-company"><span>Company</span><select id="academy-report-company"><option value="" ${selected?'':'selected'}>All companies in this batch</option>${companies.map(company=>`<option value="${e(company.id)}" ${company.id===selected?'selected':''}>${e(company.name)}</option>`).join('')}</select><small>Select Company RED for a Company RED batch report.</small></label></div><div class="academy-roster-head"><div><strong>${roster.length} trainee${roster.length===1?'':'s'} selected</strong><span>Portraits are private server records and never included in AI requests.</span></div></div><div class="academy-roster-list">${roster.map(trainee=>rosterRow(ctx,trainee,data.companies.find(company=>company.id===trainee.company_id),write)).join('')||'<p class="faint" style="padding:16px 0">No trainees match this company selection.</p>'}</div>${write&&ctx.store.aiEnabled?'<label class="checkbox-field academy-ai-consent"><input id="academy-report-ai-consent" type="checkbox">I approve sending anonymized score and attendance totals to the configured AI provider for this report preview. Names, photos, contact details, and instructor comments are excluded.</label>':'<p class="academy-local-note">This report uses the built-in local report engine. AI drafts are unavailable until an authorized administrator configures the provider.</p>'}<div class="modal-actions"><button type="button" class="btn primary" data-academy-build-report ${roster.length?'':'disabled'}>${icon('book',16)}<span>Generate trainee reports</span></button></div></div>`;
}

export function academyReportModal(ctx,batch,initialCompanyId=''){
 if(!batch){toast('This batch is no longer available.','error');return;}
 let selectedCompany=initialCompanyId;
 const portraitUrls=new Set();
 const renderBuilder=()=>{
  release(portraitUrls);const body=document.querySelector('.modal-body');if(!body)return;
  body.innerHTML=builderMarkup(ctx,batch,selectedCompany);bindBuilder();
 };
 const bindBuilder=()=>{
  const root=document.getElementById('academy-report-builder');if(!root)return;
  hydratePortraits(root,ctx.store,portraitUrls);
  root.querySelector('#academy-report-company').onchange=event=>{selectedCompany=event.currentTarget.value;renderBuilder();};
  root.querySelectorAll('[data-academy-portrait-select]').forEach(button=>button.addEventListener('click',()=>root.querySelector(`#academy-portrait-${button.dataset.academyPortraitSelect}`).click()));
  root.querySelectorAll('[data-academy-portrait-input]').forEach(input=>input.addEventListener('change',async event=>{
   const file=event.currentTarget.files?.[0];if(!file)return;
   const trigger=root.querySelector(`[data-academy-portrait-select="${event.currentTarget.dataset.academyPortraitInput}"]`);if(trigger)trigger.disabled=true;
   try{await ctx.store.saveTraineePhoto(event.currentTarget.dataset.academyPortraitInput,await compressPortrait(file));toast('Private trainee portrait saved.');renderBuilder();}
   catch(error){toast(error.message||'The portrait could not be saved.','error');if(trigger)trigger.disabled=false;}
  }));
  root.querySelector('[data-academy-build-report]').onclick=()=>{
   const report=buildBatchReport(ctx.store.data,{batchId:batch.id,companyId:selectedCompany});
   openReportPreview(ctx,report,!!root.querySelector('#academy-report-ai-consent')?.checked);
  };
 };
 openModal('Generate trainee reports',`${batch.batch_name} · Select a company, add portraits, then create the internal report set.`,builderMarkup(ctx,batch,selectedCompany),{wide:true});
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
 if(!item.profile.complete)return '<p class="academy-pending">Assessment pending. Missing skills are never changed into zeroes or a failing grade.</p>';
 return `<table class="academy-score-table"><tbody>${SCORE_FIELDS.map(([key,label])=>`<tr><th>${e(label)}</th><td>${fmt(item.assessment[key],2)} / 5</td></tr>`).join('')}<tr class="academy-score-total"><th>Technical / people / overall</th><td>${fmt(item.profile.tech,1)}% / ${fmt(item.profile.soft,1)}% / ${fmt(item.profile.overall,1)}%</td></tr></tbody></table>`;
}

function reportSheet(item,write,allowAi){
 const attendance=item.attendance,check=item.checklist,assessmentLabel=item.profile.complete?item.profile.tier:'Assessment pending';
 return `<article class="academy-report-sheet" data-academy-trainee="${e(item.trainee.id)}"><header class="academy-sheet-head"><div class="academy-photo-slot is-loading" data-academy-photo-id="${e(item.trainee.id)}" data-academy-photo-name="${e(item.trainee.trainee_name)}">${icon('users',26)}<span>Portrait</span></div><div><span class="academy-overline">TRAINEE PERFORMANCE REPORT</span><h2>${e(item.trainee.trainee_name)}</h2><p>${e(item.company?.name||'Company not recorded')} · ${e(item.batch.batch_name)}${item.trainee.job_title?` · ${e(item.trainee.job_title)}`:''}</p></div><span class="academy-tier">${e(assessmentLabel)}</span></header><div class="academy-report-columns"><section><h3>Measured performance</h3>${scoreRows(item)}<p class="academy-measure-note">The technical score is Product knowledge + Mapping; the people score is Presentability + Soft skills. Each pair is out of 10 and expressed as a percentage.</p></section><section><h3>Recorded participation</h3><dl class="academy-attendance"><div><dt>Present</dt><dd>${attendance.present}</dd></div><div><dt>Absent</dt><dd>${attendance.absent}</dd></div><div><dt>Recorded rate</dt><dd>${attendance.rate===null?'Not yet available':fmt(attendance.rate,1)+'%'}</dd></div><div><dt>Manual late flags</dt><dd>${attendance.late}</dd></div><div><dt>After 11:00 AM</dt><dd>${attendance.calculatedLate}</dd></div><div><dt>Checklist</dt><dd>${check?`${check.percent}% (${check.count}/10)`:'Not started'}</dd></div></dl><p class="academy-measure-note">Attendance totals use saved classroom records only. The checklist is separate; unrecorded sessions are not absences.</p></section></div><section class="academy-narrative-card"><div><h3>Performance narrative</h3><span class="academy-edit-note">${write?'Editable for this printout only':'Built-in local narrative'}</span></div><div class="academy-narrative" data-academy-narrative="${e(item.trainee.id)}" contenteditable="${write?'true':'false'}" role="textbox" aria-label="Editable performance narrative for ${e(item.trainee.trainee_name)}">${e(item.narrative)}</div>${item.assessment?.instructor_comment?`<p class="academy-instructor-comment"><strong>Instructor comment:</strong> ${e(item.assessment.instructor_comment)}</p>`:''}${allowAi&&item.profile.complete?`<div class="academy-ai-row"><button type="button" class="btn small" data-academy-ai="${e(item.trainee.id)}">${icon('spark',14)}<span>Generate AI draft</span></button><span>Uses anonymized metrics only. Review before printing.</span></div>`:''}</section><footer><span>Internal company training record</span><span>Generated ${dateLabel(new Date().toISOString(),{year:'numeric',month:'long',day:'numeric'})}</span></footer></article>`;
}

function previewMarkup(report,write,allowAi){
 const company=report.company?.name||'All companies in this batch';
 return `<div id="academy-report-preview" class="academy-report-preview"><div class="academy-preview-actions"><button type="button" class="btn secondary" data-academy-back>${icon('arrow',16)}<span>Back to selection</span></button><span class="academy-preview-summary">${report.items.length} trainee${report.items.length===1?'':'s'} · ${report.assessed} assessed · ${report.pending} awaiting assessment${report.average===null?'':` · ${fmt(report.average,1)}% assessed average`}</span><button type="button" class="btn primary" data-academy-print disabled>${icon('external',16)}<span>Print / Save PDF</span></button></div><header class="academy-report-cover"><span class="academy-overline">INTERNAL TRAINING ACADEMY</span><h1>Trainee Performance Report</h1><p>${e(report.batch.batch_name)} · ${e(company)}</p><dl><div><dt>Selected trainees</dt><dd>${report.items.length}</dd></div><div><dt>Assessed</dt><dd>${report.assessed}</dd></div><div><dt>Assessment pending</dt><dd>${report.pending}</dd></div></dl><p class="academy-cover-note">Generated from the academy’s saved attendance, checklist, and assessment records. Missing data is shown as pending, not guessed.</p></header>${report.items.map(item=>reportSheet(item,write,allowAi)).join('')||'<div class="empty"><h3>No trainees selected</h3><p>Return to the selection screen and choose a company with enrolled trainees.</p></div>'}</div>`;
}

function openReportPreview(ctx,report,allowAi){
 const portraitUrls=new Set();
 openModal('Trainee report preview',`${report.batch.batch_name} · Review all content before printing or saving a PDF.`,previewMarkup(report,ctx.store.canWrite(),allowAi),{wide:true});
 const modal=document.querySelector('.modal');modal?.classList.add('academy-report-modal');
 const root=document.getElementById('academy-report-preview');
 hydratePortraits(root,ctx.store,portraitUrls).then(()=>root.querySelector('[data-academy-print]')?.removeAttribute('disabled'));
 root.querySelector('[data-academy-back]').onclick=()=>{release(portraitUrls);academyReportModal(ctx,report.batch,report.companyId);};
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
