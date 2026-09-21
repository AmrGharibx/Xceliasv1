let standaloneLogo='';

// This renderer intentionally mirrors the report-only markup and rendering
// settings from Report Generation 3/csp. The standalone tool remains
// independent; this is its embedded exporter for Academy batch data.
const REPORT_STYLE=[
  '@font-face{font-family:Montserrat;src:url("./vendor/fonts/montserrat-400.woff2") format("woff2");font-weight:400}',
  '@font-face{font-family:Montserrat;src:url("./vendor/fonts/montserrat-500.woff2") format("woff2");font-weight:500}',
  '@font-face{font-family:Montserrat;src:url("./vendor/fonts/montserrat-600.woff2") format("woff2");font-weight:600}',
  '@font-face{font-family:Montserrat;src:url("./vendor/fonts/montserrat-700.woff2") format("woff2");font-weight:700}',
  '@font-face{font-family:Montserrat;src:url("./vendor/fonts/montserrat-800.woff2") format("woff2");font-weight:800}',
  '@font-face{font-family:Montserrat;src:url("./vendor/fonts/montserrat-900.woff2") format("woff2");font-weight:900}',
  '@font-face{font-family:Sora;src:url("./vendor/fonts/sora-300.woff2") format("woff2");font-weight:300}',
  '@font-face{font-family:Sora;src:url("./vendor/fonts/sora-400.woff2") format("woff2");font-weight:400}',
  '@font-face{font-family:Sora;src:url("./vendor/fonts/sora-500.woff2") format("woff2");font-weight:500}',
  '@font-face{font-family:Sora;src:url("./vendor/fonts/sora-600.woff2") format("woff2");font-weight:600}',
  '@font-face{font-family:Sora;src:url("./vendor/fonts/sora-700.woff2") format("woff2");font-weight:700}',
  '@font-face{font-family:"Playfair Display";src:url("./vendor/fonts/playfair-500.woff2") format("woff2");font-weight:500}',
  '@font-face{font-family:"Playfair Display";src:url("./vendor/fonts/playfair-600.woff2") format("woff2");font-weight:600}',
  '@font-face{font-family:"Playfair Display";src:url("./vendor/fonts/playfair-700.woff2") format("woff2");font-weight:700}',
  '@font-face{font-family:"Playfair Display";src:url("./vendor/fonts/playfair-800.woff2") format("woff2");font-weight:800}',
  '#reporter-render-root,#reporter-render-root *,#reporter-render-root *::before,#reporter-render-root *::after{box-sizing:border-box;margin:0;padding:0}',
  '#reporter-render-root{--red:#c1121f;--red-dark:#9f0f19;--red-light:#fee2e2;--green:#16a34a;--orange:#f97316;--blue:#2563eb;--na:#64748b;--accent:#b91c1c;--score-line:#cbd5f5;--g50:#f9fafb;--g100:#f3f4f6;--g200:#e5e7eb;--g300:#d1d5db;--g400:#9ca3af;--g500:#6b7280;--g600:#4b5563;--g700:#374151;--g800:#1f2937;--g900:#111827;position:fixed;left:-10000px;top:0;width:210mm;background:#fff;color:var(--g800);font-family:"Montserrat","Sora",sans-serif;line-height:1.5}',
  '#reporter-render-root .page{width:210mm;min-height:297mm;margin:30px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);border-radius:8px;overflow:hidden;position:relative}',
  '#reporter-render-root .cover-layout{display:flex;height:297mm}',
  '#reporter-render-root .cover-sidebar{width:25%;background:var(--red);display:flex;align-items:center;justify-content:center;flex-shrink:0}',
  '#reporter-render-root .cover-sidebar h2{color:#fff;font-family:"Playfair Display",serif;font-weight:800;font-size:3.5rem;transform:rotate(-90deg);letter-spacing:.2em;white-space:nowrap}',
  '#reporter-render-root .cover-content{width:75%;padding:50px 50px 30px;display:flex;flex-direction:column}',
  '#reporter-render-root .cover-logo{max-width:360px}',
  '#reporter-render-root .cover-logo svg,#reporter-render-root .cover-logo img{width:100%;height:auto;display:block}',
  '#reporter-render-root .cover-title{margin-top:70px}',
  '#reporter-render-root .cover-title h1{font-family:"Playfair Display",serif;font-size:3rem;font-weight:800;line-height:1.15;letter-spacing:-.02em}',
  '#reporter-render-root .text-dark{color:var(--g800)}',
  '#reporter-render-root .text-red{color:var(--red)}',
  '#reporter-render-root .cover-info{margin-top:80px}',
  '#reporter-render-root .cover-info-row{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--g200);padding-bottom:12px;margin-bottom:20px}',
  '#reporter-render-root .cover-info-label{font-size:1.1rem;color:var(--g500)}',
  '#reporter-render-root .cover-info-value{font-size:1.1rem;color:var(--g500);font-weight:300;text-align:right}',
  '#reporter-render-root .cover-footer{margin-top:auto;padding-top:24px;border-top:1px solid var(--g100);font-size:.78rem;color:var(--g400)}',
  '#reporter-render-root .outro-text{margin-top:40px}',
  '#reporter-render-root .outro-text p{font-size:1.05rem;color:var(--g700);line-height:1.7;margin-bottom:18px}',
  '#reporter-render-root .quote-section{margin-top:30px;padding-top:24px;border-top:2px solid var(--g200)}',
  '#reporter-render-root .quote-label{font-size:.85rem;font-weight:600;color:var(--g500);text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px}',
  '#reporter-render-root .quote-text{font-size:1.3rem;font-style:italic;color:var(--g600);font-weight:300;line-height:1.5}',
  '#reporter-render-root .quote-author{margin-top:10px;text-align:right;font-size:1rem;color:var(--red);font-weight:600}',
  '#reporter-render-root .report-header{display:flex;justify-content:space-between;align-items:center;padding:20px 28px;border-bottom:1px solid var(--g200);background:#fff}',
  '#reporter-render-root .report-header-logo{height:48px}',
  '#reporter-render-root .report-header-logo svg,#reporter-render-root .report-header-logo img{height:100%;width:auto;display:block}',
  '#reporter-render-root .report-header-right{text-align:right}',
  '#reporter-render-root .report-header-right h1{font-family:"Playfair Display",serif;font-size:1.4rem;font-weight:700;color:var(--accent)}',
  '#reporter-render-root .report-header-right p{font-size:1rem;font-weight:600;color:var(--g600)}',
  '#reporter-render-root .report-body{padding:20px 28px}',
  '#reporter-render-root .details-card{display:flex;justify-content:space-between;align-items:flex-start;background:var(--g50);border:1px solid var(--g200);border-radius:8px;padding:18px 22px;margin-bottom:20px}',
  '#reporter-render-root .details-card h3{font-size:.95rem;font-weight:700;color:var(--g800);margin-bottom:5px}',
  '#reporter-render-root .details-card p{font-size:.85rem;color:var(--g600)}',
  '#reporter-render-root .details-card .label{font-weight:600}',
  '#reporter-render-root .details-card-info{flex:1}',
  '#reporter-render-root .score-big{font-size:2.8rem;font-weight:700;line-height:1;position:relative;padding-bottom:10px}',
  '#reporter-render-root .score-big::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,rgba(193,18,31,.25),rgba(193,18,31,.7));border-radius:999px}',
  '#reporter-render-root .score-big span{font-size:1.6rem}',
  '#reporter-render-root .score-green{color:var(--green)}',
  '#reporter-render-root .score-red{color:#dc2626}',
  '#reporter-render-root .score-neutral{color:var(--na)}',
  '#reporter-render-root .section-title{font-family:"Playfair Display",serif;font-size:1.05rem;font-weight:700;color:var(--g800);border-left:4px solid var(--accent);border-bottom:1px solid var(--score-line);padding-left:12px;padding-bottom:6px;margin-bottom:10px}',
  '#reporter-render-root .assessment-box{background:var(--g50);border:1px solid var(--g200);border-radius:8px;padding:12px 16px;margin-bottom:20px}',
  '#reporter-render-root .assessment-box p{font-size:.85rem;color:var(--g700);line-height:1.6}',
  '#reporter-render-root .two-col{display:flex;gap:20px;margin-bottom:20px}',
  '#reporter-render-root .two-col>div{flex:1}',
  '#reporter-render-root .data-table{width:100%;border-collapse:collapse;border:1px solid var(--g200);border-radius:8px;overflow:hidden;font-size:.8rem;text-align:left;white-space:normal}',
  '#reporter-render-root .data-table th{background:var(--g50);padding:8px 12px;font-size:inherit;font-weight:600;color:var(--g600);letter-spacing:normal;border-bottom:0;text-align:left}',
  '#reporter-render-root .data-table th:last-child{text-align:right}',
  '#reporter-render-root .data-table td{height:auto;padding:8px 12px;border-top:1px solid var(--score-line);border-bottom:0;color:var(--g700)}',
  '#reporter-render-root .data-table td:last-child{text-align:right;font-weight:500}',
  '#reporter-render-root .data-table .row-total{background:var(--g50)}',
  '#reporter-render-root .data-table .row-total td{font-weight:700;color:var(--g800)}',
  '#reporter-render-root .data-table .row-pct td{font-weight:600;font-style:italic;color:var(--g800);background:var(--g50)}',
  '#reporter-render-root .data-table .row-pct-b td{border-bottom:2px solid var(--g300)}',
  '#reporter-render-root .text-green{color:var(--green);font-weight:600}',
  '#reporter-render-root .text-orange{color:var(--orange);font-weight:600}',
  '#reporter-render-root .text-na{color:var(--na);font-weight:600}',
  '#reporter-render-root .text-aok{color:var(--green);font-weight:700}',
  '#reporter-render-root .text-aw{color:var(--orange);font-weight:700}',
  '#reporter-render-root .comments-box{background:var(--g50);border-left:4px solid var(--g300);border-radius:8px;padding:12px 16px;margin-bottom:20px}',
  '#reporter-render-root .comments-box p{font-size:.85rem;color:var(--g700);font-style:italic}',
  '#reporter-render-root .report-footer{text-align:center;padding:14px 28px;border-top:1px solid var(--g200);font-size:.68rem;color:var(--g400)}',
  '#reporter-render-root .badge{display:inline-block;padding:3px 14px;border-radius:999px;font-size:.76rem;font-weight:600}',
  '#reporter-render-root .b-green{background:#bbf7d0;color:#166534}',
  '#reporter-render-root .b-blue{background:#bfdbfe;color:#1e40af}',
  '#reporter-render-root .b-yellow{background:#fef08a;color:#854d0e}',
  '#reporter-render-root .b-red{background:#fecaca;color:#991b1b}',
  '#reporter-render-root .b-gray{background:var(--g200);color:var(--g700)}',
  '#reporter-render-root .report-photo-col{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;margin-right:10px}',
  '#reporter-render-root .report-photo-col img{width:130px;height:170px;object-fit:cover;object-position:center top;border-radius:10px;border:3px solid #c1121f;display:block;box-shadow:0 6px 24px rgba(0,0,0,.22)}',
  '#reporter-render-root .report-photo-col .rph-lbl{font-size:.6rem;color:#6b7280;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-align:center;line-height:1.3}'
].join('');

function esc(value){
  return String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}
function listify(values){
  if(!values.length)return '';
  if(values.length===1)return values[0];
  if(values.length===2)return values[0]+' and '+values[1];
  return values.slice(0,-1).join(', ')+', and '+values.at(-1);
}
function article(value){return 'AEIOU'.includes(String(value||'')[0]||'')?'an':'a';}
function pronoun(name){
  const first=String(name||'').trim().split(/\s+/)[0].toLowerCase();
  return ['a','ah','ia','na','da','ra','ya','ie','ey','een','ine','ina'].some(end=>first.endsWith(end))?'She':'He';
}
function dateLabel(){
  return new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}
function copyright(){return '\u00a9 '+new Date().getFullYear()+' RED Real Estate Domain Training Academy. All rights reserved.';}
function normalOutcome(raw,overall){
  const text=String(raw||'').trim().toLowerCase();
  if(/\baced\b/.test(text))return 'Aced';
  if(/\bexcellent\b/.test(text))return 'Excellent';
  if(/\bvery\s+good\b/.test(text))return 'Good';
  if(/\bgood\b/.test(text))return 'Good';
  if(/\bpass(?:ed)?\b/.test(text))return 'Passed';
  if(/\bfail(?:ed)?\b/.test(text))return 'Failed';
  if(typeof overall==='number'&&!Number.isNaN(overall)){
    if(overall>=90)return 'Aced';
    if(overall>=80)return 'Excellent';
    if(overall>=70)return 'Good';
    if(overall>=60)return 'Passed';
    return 'Failed';
  }
  return '';
}
function badgeClass(outcome){return ({Aced:'b-green',Excellent:'b-blue',Good:'b-yellow',Passed:'b-gray',Failed:'b-red'}[outcome]||'b-gray');}
function displayAssessmentOutcome(item){return item.rawAssessmentOutcome||item.assessmentResult||'';}

function generatedComments(item){
  const pk=item.scores.productKnowledge.score,mp=item.scores.mapping.score,ss=item.scores.softSkills.score,pr=item.scores.presentability.score,ov=item.overallScore,parts=[];
  if(ov>=90)parts.push('Outstanding overall performance');
  else if(ov>=80)parts.push('Good efforts');
  else if(ov>=70)parts.push('Decent performance');
  else if(ov>=60)parts.push('Acceptable performance');
  else parts.push('Needs significant improvement');
  const high=[];
  if(pk>=4.5)high.push('technical knowledge');
  if(mp>=4.5)high.push('mapping skills');
  if(ss>=4.5)high.push('soft skills');
  if(pr>=4.5)high.push('presentability');
  if(high.length)parts.push('great '+listify(high));
  const low=[];
  if(pk<3.5)low.push('product knowledge');
  if(mp<3.5)low.push('mapping');
  if(ss<3.5)low.push('soft skills');
  if(pr<3.5)low.push('presentability');
  if(low.length)parts.push('needs to focus more on '+listify(low));
  return parts.join(', ')+'.';
}

function generatedAssessment(item){
  const name=item.name||'The trainee',res=displayAssessmentOutcome(item)||item.assessmentResult,ov=item.overallScore,pk=item.scores.productKnowledge.score,mp=item.scores.mapping.score,ss=item.scores.softSkills.score,pr=item.scores.presentability.score,tech=item.scores.techScorePercent,soft=item.scores.softScorePercent,attendanceDays=item.attendance.attendanceDays,absent=item.attendance.absent;
  const areas=[
    {name:'Product Knowledge',score:pk,max:5},
    {name:'Mapping',score:mp,max:5},
    {name:'Soft Skills',score:ss,max:5},
    {name:'Presentability',score:pr,max:5}
  ];
  const sorted=[...areas].sort((a,b)=>b.score-a.score),strengths=sorted.filter(area=>area.score>=4),weaknesses=sorted.filter(area=>area.score<4),perfectAreas=sorted.filter(area=>area.score===area.max);
  let text=name+' achieved '+article(res)+" '"+res+"' result with an overall score of "+ov+'%.';
  if(strengths.length>0){
    const strengthNames=strengths.map(area=>area.name+' ('+area.score+'/'+area.max+')');
    text+=' '+pronoun(name)+' '+(strengths.length>1?'demonstrated strong performance across':'demonstrated strong performance in')+' '+listify(strengthNames);
    if(perfectAreas.length>0)text+=', with perfect scores in '+listify(perfectAreas.map(area=>area.name));
    text+='.';
  }
  text+=' The Tech Score of '+tech+'% reflects '+(tech>=90?'outstanding':tech>=80?'solid':tech>=70?'good':tech>=60?'adequate':'limited')+' technical competency';
  if(weaknesses.length>0)text+=', though there is room for improvement in '+listify(weaknesses.map(area=>area.name+' ('+area.score+'/'+area.max+')'));
  text+='.';
  text+=' Professional conduct was rated at '+soft+'%';
  if(soft>=90)text+=', reflecting excellent professionalism';
  else if(soft>=80)text+=', indicating strong professionalism';
  else if(soft>=70)text+=', showing good professional conduct';
  text+='.';
  const missed=item.attendance.missedContent,missedPercent=missed!=='N/A'&&missed!=null&&missed!==''?parseInt(missed,10):null;
  if(absent===0&&attendanceDays!=='N/A'&&attendanceDays!=null)text+=' '+pronoun(name)+' maintained full attendance across '+attendanceDays+' training day'+(attendanceDays!==1?'s':'')+' with no absences.';
  else if(absent===0)text+=' '+pronoun(name)+' maintained perfect attendance with no absences throughout the training period.';
  else if(attendanceDays!=='N/A'&&attendanceDays!=null){
    const totalDays=parseInt(attendanceDays,10)+absent;
    text+=' Attendance was '+attendanceDays+' day'+(attendanceDays!==1?'s':'')+' out of '+totalDays+' with '+absent+' absence'+(absent!==1?'s':'');
    if(missedPercent!=null&&missedPercent>0)text+=', resulting in '+missedPercent+'% missed content';
    text+='.';
  }else if(absent===1)text+=' '+pronoun(name)+' had 1 absence during the training period.';
  else if(absent>1)text+=' '+pronoun(name)+' had '+absent+' absences during the training period'+(missedPercent!=null&&missedPercent>0?', missing approximately '+missedPercent+'% of content':'')+'.';
  return text;
}

function standaloneItem(item,fallbackBatch){
  const assessment=item.assessment||{},profile=item.profile||{},attendance=item.attendance||{};
  const complete=profile.complete===true,overall=complete?profile.overall:null,present=Number(attendance.present||0),absent=Number(attendance.absent||0),hasAttendance=present+absent>0,rawOutcome=complete?String(assessment.assessment_outcome||''):'';
  const score=value=>complete?Number(value):'N/A';
  const result=complete?normalOutcome(rawOutcome,overall):'Assessment pending';
  const trainee={
    name:item.trainee.trainee_name,
    company:item.company?.name||'Company not recorded',
    batch:item.batch?.batch_name||fallbackBatch?.batch_name||'Batch not recorded',
    photo:item.photo||'',
    rawAssessmentOutcome:rawOutcome,
    overallScore:complete?overall:'N/A',
    assessmentResult:result,
    badgeClass:badgeClass(result),
    scores:{
      productKnowledge:{score:score(assessment.product_knowledge),max:5},
      mapping:{score:score(assessment.mapping),max:5},
      softSkills:{score:score(assessment.soft_skills),max:5},
      presentability:{score:score(assessment.presentability),max:5},
      techScorePercent:complete?profile.tech:'N/A',
      softScorePercent:complete?profile.soft:'N/A',
      totalCore:complete?Number(assessment.product_knowledge)+Number(assessment.mapping):'N/A',
      professionalConductRating:{score:complete?Number(assessment.presentability)+Number(assessment.soft_skills):'N/A',max:10}
    },
    attendance:{
      attendanceDays:hasAttendance?present:'N/A',
      late:hasAttendance?Number(attendance.late||0):'N/A',
      absent,
      missedContent:hasAttendance?Number(((absent/(present+absent))*100).toFixed(1)):'N/A'
    },
    overallAssessment:'',
    comments:assessment.instructor_comment||''
  };
  trainee.overallAssessment=complete?generatedAssessment(trainee):'Assessment pending. A complete four-skill assessment has not been saved, so no score band or result has been inferred.';
  if(!trainee.comments&&complete)trainee.comments=generatedComments(trainee);
  return trainee;
}

function reportLogo(){return standaloneLogo||'<img src="./report-logo.svg" alt="Xcelias">';}
function cover(report){
  return '<div class="page"><div class="cover-layout"><div class="cover-sidebar"><h2>RED</h2></div><div class="cover-content"><div class="cover-logo">'+reportLogo()+'</div><div class="cover-title"><h1 class="text-dark">Trainee Performance</h1><h1 class="text-red">Report</h1></div><div class="cover-info"><div class="cover-info-row"><span class="cover-info-label">Company Name</span><span class="cover-info-value">'+esc(report.companyName)+'</span></div><div class="cover-info-row"><span class="cover-info-label">Batch Number</span><span class="cover-info-value">'+esc(report.batch.batch_name)+'</span></div><div class="cover-info-row"><span class="cover-info-label">Number of Trainees</span><span class="cover-info-value">'+report.items.length+'</span></div></div><div class="cover-footer"><p>Report Generated on: '+dateLabel()+'</p><p>'+copyright()+'</p></div></div></div></div>';
}
function detailPage(item){
  const outcomeLabel=displayAssessmentOutcome(item)||item.assessmentResult;
  const lateDays=item.attendance.late==='N/A'||item.attendance.late==null?'N/A':item.attendance.late+' Days';
  const attendanceDays=item.attendance.attendanceDays==='N/A'||item.attendance.attendanceDays==null?'N/A':item.attendance.attendanceDays+' Day'+(item.attendance.attendanceDays!==1?'s':'');
  const missedContent=item.attendance.missedContent==='N/A'||item.attendance.missedContent==null?'N/A':item.attendance.missedContent+'%';
  const technicalMaximum=item.scores.mapping.max+item.scores.productKnowledge.max,conductMaximum=item.scores.presentability.max+item.scores.softSkills.max;
  const scoreClass=item.assessmentResult==='Failed'?'score-red':item.assessmentResult==='Assessment pending'?'score-neutral':'score-green';
  const attendanceClass=item.attendance.attendanceDays==='N/A'||item.attendance.attendanceDays==null?'text-na':'text-aok';
  const lateClass=item.attendance.late==='N/A'||item.attendance.late==null?'text-na':item.attendance.late==0?'text-aok':'text-aw';
  const absenceClass=item.attendance.absent===0?'text-aok':'text-aw';
  const missedClass=item.attendance.missedContent==='N/A'||item.attendance.missedContent==null?'text-na':item.attendance.missedContent==0?'text-aok':'text-aw';
  const photo=item.photo?'<div class="report-photo-col"><img src="'+esc(item.photo)+'" alt="'+esc(item.name)+'"><span class="rph-lbl">'+esc(item.name.split(' ')[0])+'</span></div>':'';
  return '<div class="page"><div class="report-header"><div class="report-header-logo">'+reportLogo()+'</div><div class="report-header-right"><h1>Trainee Performance Report</h1><p>'+esc(item.batch)+'</p></div></div><div class="report-body"><div class="details-card">'+photo+'<div class="details-card-info"><h3>Trainee Details</h3><p><span class="label">Name:</span> '+esc(item.name)+'</p><p><span class="label">Company:</span> '+esc(item.company)+'</p><p><span class="label">Batch:</span> '+esc(item.batch)+'</p></div><div style="text-align:right"><h3>Overall Performance</h3><div class="score-big '+scoreClass+'">'+item.overallScore+'<span>%</span></div><div class="badge '+item.badgeClass+'">'+esc(outcomeLabel)+'</div></div></div><h3 class="section-title">Overall Assessment</h3><div class="assessment-box"><p>'+esc(item.overallAssessment)+'</p></div><div class="two-col"><div><h3 class="section-title">Detailed Score Breakdown</h3><table class="data-table"><thead><tr><th>Performance Area</th><th>Score</th></tr></thead><tbody><tr><td>Product Knowledge</td><td>'+item.scores.productKnowledge.score+' out of '+item.scores.productKnowledge.max+'</td></tr><tr><td>Mapping</td><td>'+item.scores.mapping.score+' out of '+item.scores.mapping.max+'</td></tr><tr class="row-total"><td>Total (Core Skills)</td><td>'+item.scores.totalCore+' out of '+technicalMaximum+'</td></tr><tr class="row-pct row-pct-b"><td>Tech Score %</td><td>'+item.scores.techScorePercent+'%</td></tr><tr><td>Soft Skills</td><td>'+item.scores.softSkills.score+' out of '+item.scores.softSkills.max+'</td></tr><tr><td>Presentability</td><td>'+item.scores.presentability.score+' out of '+item.scores.presentability.max+'</td></tr><tr class="row-total"><td>Professional Conduct Rating</td><td>'+item.scores.professionalConductRating.score+' out of '+conductMaximum+'</td></tr><tr class="row-pct"><td>Professionalism Score %</td><td>'+item.scores.softScorePercent+'%</td></tr></tbody></table></div><div><h3 class="section-title">Attendance & Professionalism</h3><table class="data-table"><thead><tr><th>Metric</th><th>Record</th></tr></thead><tbody><tr><td>Attendance Days</td><td class="'+attendanceClass+'">'+attendanceDays+'</td></tr><tr><td>Punctuality (Late Arrivals)</td><td class="'+lateClass+'">'+lateDays+'</td></tr><tr><td>Attendance (Absent Days)</td><td class="'+absenceClass+'">'+item.attendance.absent+' Day'+(item.attendance.absent!==1?'s':'')+'</td></tr><tr><td>Missed Content Percentage</td><td class="'+missedClass+'">'+missedContent+'</td></tr></tbody></table></div></div><h3 class="section-title">Trainer\'s Comments</h3><div class="comments-box"><p>"'+esc(item.comments)+'"</p></div></div><div class="report-footer"><p>Report Generated on: '+dateLabel()+'</p><p>'+copyright()+'</p></div></div>';
}
function conclusion(report,items){
  const names=items.map(item=>item.name),nameList=listify(names),firstParagraph='This report concludes the performance evaluation for the '+(items.length>1?items.length+' trainees':'trainee')+': '+nameList+'.';
  const tiers={Aced:[],Excellent:[],Good:[],Passed:[],Failed:[]};
  items.forEach(item=>{if(tiers[item.assessmentResult])tiers[item.assessmentResult].push(item);});
  const namesFor=rows=>listify(rows.map(item=>item.name)),scoresFor=rows=>listify(rows.map(item=>item.overallScore+'%')),paragraphs=[];
  if(tiers.Aced.length)paragraphs.push('We are pleased to report that '+namesFor(tiers.Aced)+' achieved an \'Aced\' result with '+(tiers.Aced.length>1?'scores':'a score')+' of '+scoresFor(tiers.Aced)+'. Their outstanding performance confirms their readiness to immediately begin professional roles in the real estate domain.');
  if(tiers.Excellent.length)paragraphs.push(namesFor(tiers.Excellent)+' achieved an \'Excellent\' result with '+(tiers.Excellent.length>1?'scores':'a score')+' of '+scoresFor(tiers.Excellent)+', demonstrating strong overall competency and a high level of professionalism.');
  if(tiers.Good.length)paragraphs.push(namesFor(tiers.Good)+' received a \'Good\' assessment with '+(tiers.Good.length>1?'scores':'a score')+' of '+scoresFor(tiers.Good)+', showing solid foundational skills and readiness for practical application.');
  if(tiers.Passed.length)paragraphs.push(namesFor(tiers.Passed)+' achieved a \'Passed\' result with '+(tiers.Passed.length>1?'scores':'a score')+' of '+scoresFor(tiers.Passed)+', meeting the minimum competency requirements.');
  if(tiers.Failed.length)paragraphs.push('However, '+namesFor(tiers.Failed)+' did not meet the passing criteria and '+(tiers.Failed.length>1?'are':'is')+' required to re-attend the training program.');
  return '<div class="page"><div class="cover-layout"><div class="cover-sidebar"><h2>RED</h2></div><div class="cover-content"><div class="cover-logo">'+reportLogo()+'</div><div class="cover-title"><h1 class="text-dark">Concluding</h1><h1 class="text-red">Remarks</h1></div><div class="outro-text"><p>'+esc(firstParagraph)+'</p><p>'+esc(paragraphs.join(' '))+'</p></div><div class="quote-section"><div class="quote-label">A Final Thought</div><div class="quote-text">"The only way to do great work is to love what you do."</div><div class="quote-author">&mdash; Steve Jobs</div></div><div class="cover-footer"><p>Report Generated on: '+dateLabel()+'</p><p>'+copyright()+'</p></div></div></div></div>';
}

export function companyReportJobs(report){
  const grouped=new Map();
  report.items.forEach(item=>{const key=item.company?.id||item.trainee.company_id||'__unassigned__';if(!grouped.has(key))grouped.set(key,{companyId:key,companyName:item.company?.name||'Company not recorded',items:[]});grouped.get(key).items.push(item);});
  return [...grouped.values()].sort((a,b)=>a.companyName.localeCompare(b.companyName)).map(group=>({...group,batch:report.batch}));
}
export function reportFilename(report){
  return 'Xcelias_Report_'+String(report.companyName||'Company not recorded').replace(/\s+/g,'_')+'_Batch'+String(report.batch?.batch_name||'')+'.pdf';
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-report-lib="'+src+'"]');
    if(existing){
      existing.addEventListener('load',resolve,{once:true});
      existing.addEventListener('error',reject,{once:true});
      if((src.includes('html2canvas')&&globalThis.html2canvas)||(src.includes('jspdf')&&globalThis.jspdf))resolve();
      return;
    }
    const script=document.createElement('script');
    script.src=src;
    script.dataset.reportLib=src;
    script.onload=resolve;
    script.onerror=()=>reject(new Error('The PDF export library could not be loaded.'));
    document.head.appendChild(script);
  });
}
async function ensurePdfLibraries(){
  if(!globalThis.html2canvas)await loadScript(new URL('./vendor/html2canvas.min.js',document.baseURI).href);
  if(!globalThis.jspdf)await loadScript(new URL('./vendor/jspdf.umd.min.js',document.baseURI).href);
  if(!globalThis.html2canvas||!globalThis.jspdf?.jsPDF)throw new Error('PDF export is not available in this build.');
}
async function loadStandaloneLogo(){
  if(standaloneLogo)return;
  try{
    const response=await fetch(new URL('./report-logo.svg',document.baseURI));
    if(response.ok)standaloneLogo=(await response.text()).trim();
  }catch{}
}
async function waitImages(root){
  await Promise.all([...root.querySelectorAll('img')].map(image=>image.decode?image.decode().catch(()=>{}):new Promise(resolve=>{if(image.complete)resolve();else image.addEventListener('load',resolve,{once:true});})));
}
async function waitFonts(){
  if(!document.fonts?.load)return;
  await Promise.all([
    '400 16px Montserrat','500 16px Montserrat','600 16px Montserrat','700 16px Montserrat','800 16px Montserrat','900 16px Montserrat',
    '300 16px Sora','400 16px Sora','500 16px Sora','600 16px Sora','700 16px Sora',
    '500 16px "Playfair Display"','600 16px "Playfair Display"','700 16px "Playfair Display"','800 16px "Playfair Display"'
  ].map(font=>document.fonts.load(font).catch(()=>{})));
  try{await document.fonts.ready;}catch{}
}
async function settleLayout(){
  if(typeof requestAnimationFrame!=='function')return;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}
export async function downloadCompanyReport(report,store,onProgress=()=>{}){
  await ensurePdfLibraries();
  await loadStandaloneLogo();
  const items=await Promise.all(report.items.map(async item=>{
    let photo='';
    try{photo=await store.traineePhoto(item.trainee.id)||'';}catch{}
    return standaloneItem({...item,photo},report.batch);
  }));
  const render=document.createElement('div');
  render.id='reporter-render-root';
  render.innerHTML='<style>'+REPORT_STYLE+'</style>'+cover({...report,items})+items.map(detailPage).join('')+conclusion(report,items);
  document.body.appendChild(render);
  try{
    await Promise.all([waitFonts(),waitImages(render)]);
    await settleLayout();
    const pages=[...render.querySelectorAll('.page')],pdf=new globalThis.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    for(let index=0;index<pages.length;index++){
      onProgress({page:index+1,total:pages.length,companyName:report.companyName});
      const canvas=await globalThis.html2canvas(pages[index],{scale:3,useCORS:true,backgroundColor:'#fff',logging:false,imageTimeout:0});
      if(index>0)pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg',.98),'JPEG',0,0,210,297);
    }
    const filename=reportFilename(report);
    pdf.save(filename);
    return {filename,pages:pages.length,trainees:items.length};
  }finally{
    render.remove();
  }
}
