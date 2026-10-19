import {buildBatchReport} from './academy-reports.mjs';
import {badge,dateLabel,e,fmt,icon,option,stat} from './ui.mjs';

export function reportsPage(ctx){
 const data=ctx.store.data;
 const representedTrainees=data.trainees.filter(trainee=>!ctx.batchId||trainee.batch_id===ctx.batchId);
 const availableCompanyIds=new Set(representedTrainees.map(trainee=>trainee.company_id).filter(Boolean));
 if(ctx.companyId&&!availableCompanyIds.has(ctx.companyId))ctx.companyId='';
 const companies=[...availableCompanyIds].map(id=>data.companies.find(company=>company.id===id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
 const trainees=ctx.batchId?representedTrainees.filter(trainee=>!ctx.companyId||trainee.company_id===ctx.companyId).sort((a,b)=>a.trainee_name.localeCompare(b.trainee_name)):[];
 if(ctx.reportTraineeId&&!trainees.some(trainee=>trainee.id===ctx.reportTraineeId))ctx.reportTraineeId='';
 const multiEligible=ctx.batchId&&ctx.companyId?trainees:[];
 ctx.reportTraineeIds=(Array.isArray(ctx.reportTraineeIds)?ctx.reportTraineeIds:[]).filter(id=>multiEligible.some(trainee=>trainee.id===id));
 const traineeIds=ctx.reportTraineeIds;
 const traineeId=traineeIds.length?'':ctx.reportTraineeId||'';
 const batches=data.batches.filter(batch=>!ctx.batchId||batch.id===ctx.batchId).sort((a,b)=>a.batch_name.localeCompare(b.batch_name,undefined,{numeric:true}));
 const summaries=batches.map(batch=>{
  const report=buildBatchReport(data,{batchId:batch.id,companyId:ctx.companyId,traineeId,traineeIds});
  const companyIds=new Set(report.items.map(item=>item.company?.id||item.trainee.company_id||'__unassigned__'));
  return {batch,report,companyCount:companyIds.size};
 });
 const query=(ctx.search||'').trim().toLowerCase();
 const rows=summaries.filter(({batch})=>!query||batch.batch_name.toLowerCase().includes(query)||String(batch.status||'').toLowerCase().includes(query));
 const traineeCount=summaries.reduce((sum,row)=>sum+row.report.items.length,0);
 const assessedCount=summaries.reduce((sum,row)=>sum+row.report.assessed,0);
 const pdfCount=traineeId||traineeIds.length?(ctx.batchId?1:0):summaries.reduce((sum,row)=>sum+row.companyCount,0);
 const selectedBatch=data.batches.find(batch=>batch.id===ctx.batchId);
 const selectedReport=summaries.find(row=>row.batch.id===ctx.batchId)?.report;
 const generateDisabled=!selectedBatch||!selectedReport?.items.length;
 const batchOptions=data.batches.slice().sort((a,b)=>a.batch_name.localeCompare(b.batch_name,undefined,{numeric:true}));
 const reportRows=rows.map(({batch,report,companyCount})=>`<tr>
  <td><div class="report-batch-name"><strong>${e(batch.batch_name)}</strong><small>${dateLabel(batch.start_date)} – ${dateLabel(batch.end_date)}</small></div></td>
  <td>${badge(batch.status)}</td>
  <td>${report.items.length}</td>
  <td>${companyCount}</td>
  <td><strong>${report.assessed}</strong><small class="report-pending">${report.pending} pending</small></td>
  <td>${report.average===null?'<span class="faint">—</span>':fmt(report.average,1)+'%'}</td>
  <td><button type="button" class="btn primary small" data-action="batch-report" data-id="${e(batch.id)}" data-company="${e(ctx.companyId)}" data-trainee="${e(traineeId)}" data-trainees="${e(JSON.stringify(traineeIds))}" ${report.items.length?'':'disabled'}>${icon('download',14)}<span>${traineeIds.length>1?'Generate selected reports':traineeId||traineeIds.length?'Generate trainee report':'Generate reports'}</span></button></td>
 </tr>`).join('');
 const pageHeading=`<header class="page-header"><div><span class="eyebrow">REPORT CENTER</span><h1>Reports</h1><p>Generate a PDF for one trainee, a company, or the whole batch using saved assessments, attendance, comments, and private portraits.</p></div></header>`;
 const selectedAction=selectedBatch
  ?`<button type="button" class="btn primary" data-action="batch-report" data-id="${e(selectedBatch.id)}" data-company="${e(ctx.companyId)}" data-trainee="${e(traineeId)}" data-trainees="${e(JSON.stringify(traineeIds))}" ${generateDisabled?'disabled':''}>${icon('download',16)}<span>${traineeIds.length>1?`Generate ${traineeIds.length} selected trainee reports`:traineeId||traineeIds.length?'Generate trainee report':ctx.companyId?'Generate company report':'Generate all company reports'}</span></button>`
  :`<button type="button" class="btn primary" disabled>${icon('download',16)}<span>Select a batch first</span></button>`;
 const resetButton=ctx.batchId||ctx.companyId?'<button type="button" class="btn ghost" data-action="reset-filters">Reset filters</button>':'';
 const selectionList=selectedBatch&&ctx.companyId?`<details class="reports-trainee-multiselect" ${traineeIds.length?'open':''}><summary>Select multiple trainees from this company</summary><p>Leave all boxes clear to include the whole company. Select one or more names for a focused report.</p><div class="reports-trainee-select-list">${trainees.map(trainee=>`<label><input type="checkbox" data-report-trainee="${e(trainee.id)}" ${traineeIds.includes(trainee.id)?'checked':''}><span>${e(trainee.trainee_name)}</span></label>`).join('')||'<span class="faint">No trainees match this batch and company.</span>'}</div></details>`:'';
 const selectionNote=traineeIds.length>1?`${traineeIds.length} selected trainees from one company will be included in a single PDF.`:traineeIds.length===1||traineeId?'Only the selected trainee will appear in the PDF.':ctx.companyId?'This scope produces one company PDF per selected batch.':'Each represented company receives its own PDF for every selected batch.';
 const filterPanel=`<section class="panel reports-scope-panel"><div class="panel-head"><div><div class="panel-title"><h2>Choose report scope</h2></div><p class="panel-subtitle">Select a batch, then choose a company or an individual trainee. For a group PDF, choose a company and mark multiple trainees.</p></div>${icon('filter',17)}</div><div class="reports-scope-fields">
  <label class="field" for="reports-batch-filter"><span>Batch</span><select id="reports-batch-filter" data-field="batchId" aria-label="Select report batch">${option('','All batches',ctx.batchId)}${batchOptions.map(batch=>option(batch.id,batch.batch_name,ctx.batchId)).join('')}</select></label>
  <label class="field" for="reports-company-filter"><span>Company</span><select id="reports-company-filter" data-field="companyId" aria-label="Select report company">${option('','All companies in scope',ctx.companyId)}${companies.map(company=>option(company.id,company.name,ctx.companyId)).join('')}</select></label>
  <label class="field" for="reports-trainee-filter"><span>Trainee</span><select id="reports-trainee-filter" data-field="reportTraineeId" aria-label="Select report trainee" ${selectedBatch?'':'disabled'} ${traineeIds.length?'disabled':''}>${option('',traineeIds.length?'Using selected trainees':selectedBatch?'All trainees in scope':'Select a batch first',traineeId)}${trainees.map(trainee=>option(trainee.id,trainee.trainee_name+(ctx.companyId?'':` — ${data.companies.find(company=>company.id===trainee.company_id)?.name||'Company not recorded'}`),traineeId)).join('')}</select></label>
  <div class="reports-scope-action">${selectedAction}${resetButton}</div></div>${selectionList}<div class="reports-scope-note">${selectionNote} Use the report builder to manage portraits and preview the selected reports.</div></section>`;
 const search=`<div class="batch-view-bar reports-toolbar"><div class="toolbar-left"><div class="search-input">${icon('search',16)}<input id="reports-search" data-field="search" type="search" placeholder="Search batches..." value="${e(ctx.search)}" aria-label="Search report batches"></div></div><span class="faint">${rows.length} batch${rows.length===1?'':'es'} shown</span></div>`;
 const table=reportRows?`<div class="panel"><div class="table-wrap"><table class="reports-table"><thead><tr><th>Batch</th><th>Status</th><th>Trainees</th><th>Companies</th><th>Assessments</th><th>Average</th><th></th></tr></thead><tbody>${reportRows}</tbody></table></div></div>`:`<div class="panel">${data.batches.length?'<div class="empty"><h3>No batches match</h3><p>Try a different batch name or clear the search.</p></div>':'<div class="empty"><h3>No batches yet</h3><p>Create a batch before generating trainee reports.</p></div>'}</div>`;
 return pageHeading+filterPanel+`<div class="stats-grid reports-stats">${stat('Batches in scope',summaries.length,'cap','Matching this report selection')}${stat(traineeIds.length>1?'Selected-trainee PDF':traineeId||traineeIds.length?'Trainee PDFs':'Company PDFs',pdfCount,'building',traineeIds.length>1?'One PDF containing the selected trainees':traineeId||traineeIds.length?'One PDF for the selected trainee':'One PDF per company and batch')}${stat('Trainees included',traineeCount,'users','Filtered by the selected scope')}${stat('Assessed',assessedCount,'award',`${Math.max(0,traineeCount-assessedCount)} pending`)}</div>`+search+table;
}
