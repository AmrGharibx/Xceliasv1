import {escapeHtml as e,scores} from './core.mjs';
export {e};
const paths={
 copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 cap:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v7"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/><path d="M16 3a4 4 0 0 1 0 8"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 checklist:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 4V2h6v2M8 10l1 1 2-2m2 1h3M8 16l1 1 2-2m2 1h3"/>',
 chart:'<path d="M3 3v18h18M7 14l4-5 4 3 6-8"/>',
 building:'<rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M16 9h4v12H8m0-14h4m-4 4h4m-4 4h4m-3 6v-3h3v3"/>',
 award:'<circle cx="12" cy="8" r="5"/><path d="m8.5 12-2 9L12 18l5.5 3-2-9"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 up:'<path d="M7 17 17 7M7 7h10v10"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 down:'<path d="m6 9 6 6 6-6"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 12h6"/>',
 settings:'<path d="m9 3 1-1h4l1 1 .5 3 2 1 3-.5 2 3-2 2v3l2 2-2 3-3-.5-2 1-.5 3h-6l-.5-3-2-1-3 .5-2-3 2-2v-3l-2-2 2-3 3 .5 2-1z"/><circle cx="12" cy="12" r="3"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 edit:'<path d="m14 5 5 5M4 20l4-1L20 7a3 3 0 0 0-4-4L4 15z"/>',
 trash:'<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 spark:'<path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8zM20 2v4m-2-2h4"/>',
 logout:'<path d="M9 4H4v16h5m5-4 4-4-4-4m-5 4h12"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 5 9 8 9-8"/>',
 phone:'<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
 moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 filter:'<path d="M4 5h16l-6 7v7l-4 2v-9z"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1"/>',
 board:'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
 timeline:'<path d="M5 3v18M3 7h12v3H3M9 14h12v3H9"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
 refresh:'<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-5"/>',
 book:'<path d="M12 5v16M3 4h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z"/>',
 external:'<path d="M14 3h7v7M10 14 21 3M10 3H3v18h18v-7"/>',
 wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0m-4 4h.01"/>',
 database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>'
};
export function icon(name,size=20){return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`;}
export function btn(label,action,kind='secondary',ico='',attrs=''){return `<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${ico?icon(ico,16):''}<span>${e(label??'Not recorded')}</span></button>`;}
export function iconBtn(ico,action,label,attrs=''){return `<button type="button" class="icon-btn" data-action="${action}" aria-label="${e(label??'Not recorded')}" title="${e(label??'Not recorded')}" ${attrs}>${icon(ico,17)}</button>`;}
export function initials(name){return String(name).split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();}
export function avatar(name,small=false){const n=[...String(name)].reduce((n,c)=>n+c.charCodeAt(0),0)%6;return `<span class="avatar av-${n} ${small?'small':''}" aria-hidden="true">${e(initials(name))}</span>`;}
export function tone(s){return {Active:'green',Completed:'blue',Planning:'amber',Present:'green',Absent:'red','Tour Day':'purple','Off Day':'neutral',Aced:'green',Excellent:'blue','Very Good':'purple',Good:'amber','Needs Improvement':'orange',Failed:'red',Complete:'green','In Progress':'blue','Not Started':'neutral',Unrecorded:'neutral'}[s]||'neutral';}
export function badge(label,dot=true){return `<span class="badge ${tone(label)}">${dot?'<i></i>':''}${e(label??'Not recorded')}</span>`;}
export const fmt=(value,digits=0)=>value===null||value===undefined?'\u2014':new Intl.NumberFormat('en-US',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
export function dateLabel(value,opts={month:'short',day:'numeric'}){if(!value)return '\u2014';return new Date(value.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{...opts,timeZone:'UTC'});}
export function ring(percent,size=42,toneName='red'){const radius=17,c=2*Math.PI*radius;return `<span class="ring ${toneName}" style="width:${size}px;height:${size}px" role="img" aria-label="${percent===null?'Not recorded':fmt(percent,0)+' percent'}"><svg viewBox="0 0 42 42" aria-hidden="true"><circle class="ring-track" cx="21" cy="21" r="17"/><circle class="ring-fill" cx="21" cy="21" r="17" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-Math.max(0,Math.min(100,percent))/100)}"/></svg><b>${fmt(percent)}</b></span>`;}
export function progress(value,max=100,color='red'){if(value===null||!Number.isFinite(value))return '<span class="faint">Not recorded</span>';max=Math.max(1,max||0);return `<span class="progress ${color}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${Math.max(max,value)}"><i style="width:${Math.max(0,Math.min(100,value/max*100))}%"></i></span>`;}
export function empty(title='Nothing here yet',description='Add a record to get started.',action=''){return `<div class="empty">${icon('book',32)}<h3>${e(title)}</h3><p>${e(description)}</p>${action}</div>`;}
export function option(value,label,selected){return `<option value="${e(value)}" ${value===selected?'selected':''}>${e(label??'Not recorded')}</option>`;}
export function field(label,name,input,hint=''){return `<label class="field" for="${name}"><span>${e(label??'Not recorded')}</span>${input}${hint?`<small>${e(hint)}</small>`:''}</label>`;}
export function stat(label,value,ico,sub,extra=''){return `<article class="stat-card"><div class="stat-top"><span>${e(label??'Not recorded')}</span><span class="stat-icon">${icon(ico,17)}</span></div><div class="stat-value" data-count="${typeof value==='number'?value:''}">${typeof value==='number'?fmt(value):e(value)}</div><div class="stat-bottom">${sub}${extra}</div></article>`;}
export function lineChart(data,{height=215,series=[{key:'present',name:'Present',color:'var(--red)'},{key:'absent',name:'Absent',color:'var(--amber)'}]}={}){
 if(!data.length)return empty('No attendance to chart','Record a scheduled session to see the trend.');
 const w=660,h=height,p={l:30,r:16,t:14,b:33},max=Math.max(5,...data.flatMap(d=>series.map(s=>d[s.key]||0))),ceil=Math.ceil(max/5)*5,x=i=>p.l+i/Math.max(1,data.length-1)*(w-p.l-p.r),y=v=>h-p.b-v/ceil*(h-p.t-p.b);
 let grid='';for(let i=0;i<=4;i++){const v=ceil*i/4;grid+=`<line x1="${p.l}" y1="${y(v)}" x2="${w-p.r}" y2="${y(v)}" class="chart-grid"/><text x="${p.l-9}" y="${y(v)+4}" text-anchor="end" class="chart-label">${fmt(v)}</text>`;}
 const labels=data.map((d,i)=>i%Math.max(1,Math.ceil(data.length/7))===0||i===data.length-1?`<text x="${x(i)}" y="${h-8}" text-anchor="middle" class="chart-label">${e(dateLabel(d.date))}</text>`:'').join('');
 const lines=series.map((s,si)=>{const points=data.map((d,i)=>`${x(i)},${y(d[s.key]||0)}`).join(' ');const area=`${p.l},${h-p.b} ${points} ${x(data.length-1)},${h-p.b}`;return `${si===0?`<polygon points="${area}" fill="url(#area-fade)"/>`:''}<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d[s.key]||0)}" r="3" fill="${s.color}" class="chart-point"><title>${e(dateLabel(d.date))}: ${e(s.name)} ${d[s.key]||0}</title></circle>`).join('')}`;}).join('');
 return `<div class="chart-wrap"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Attendance trend. ${e(data.map(d=>`${dateLabel(d.date)}: ${series.map(s=>s.name+' '+(d[s.key]||0)).join(', ')}`).join('; '))}"><defs><linearGradient id="area-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dc2626" stop-opacity=".2"/><stop offset="100%" stop-color="#dc2626" stop-opacity="0"/></linearGradient></defs>${grid}${lines}${labels}</svg></div>`;
}
export function donut(items){const total=items.reduce((n,i)=>n+i.value,0);let running=0;const stops=items.filter(i=>i.value).map(i=>{const start=running;running+=i.value/total*100;return `${i.color} ${start}% ${running}%`;});return `<div class="donut-layout"><div class="donut" style="--segments:${stops.join(',')||'var(--line) 0% 100%'}" role="img" aria-label="${items.map(i=>e(i.label)+': '+i.value).join(', ')}"><div><strong>${total}</strong><span>assessments</span></div></div><div class="chart-legend">${items.map(i=>`<div><span><i style="background:${i.color}"></i>${e(i.label)}</span><b>${i.value}</b><small>${total?fmt(i.value/total*100):0}%</small></div>`).join('')}</div></div>`;}
export function radar(assessment,average){const cx=130,cy=124,r=84,coords=(values,scale=1)=>values.map((v,i)=>{const a=-Math.PI/2+i*Math.PI/2;return `${cx+Math.cos(a)*r*v/5*scale},${cy+Math.sin(a)*r*v/5*scale}`;}).join(' ');const fields=['mapping','product_knowledge','presentability','soft_skills'];return `<svg class="radar" viewBox="0 0 260 250" role="img" aria-label="Skill comparison. ${fields.map(f=>`${f}: trainee ${assessment?.[f]||0} of 5, batch average ${fmt(average[f]||0,1)}`).join('; ')}">${[1,2,3,4,5].map(v=>`<polygon points="${coords([v,v,v,v])}" class="radar-grid"/>`).join('')}<polygon points="${coords(fields.map(f=>average[f]||0))}" class="radar-average"/><polygon points="${coords(fields.map(f=>assessment?.[f]||0))}" class="radar-person"/><text x="130" y="22" text-anchor="middle">Mapping</text><text x="226" y="120" text-anchor="middle">Product</text><text x="130" y="227" text-anchor="middle">Presentability</text><text x="30" y="120" text-anchor="middle">Soft skills</text></svg>`;}
export function toast(message,type='success'){const root=document.getElementById('toast-root');const el=document.createElement('div');el.className=`toast ${type}`;el.setAttribute('role',type==='error'?'alert':'status');el.innerHTML=`${icon(type==='error'?'info':'check',18)}<span>${e(message)}</span><button class="icon-btn" aria-label="Dismiss notification">${icon('x',14)}</button>`;el.querySelector('button').onclick=()=>el.remove();root.appendChild(el);setTimeout(()=>el.remove(),6500);}
let previousFocus,modalHandler;
export function closeModal(){document.getElementById('app').inert=false;document.getElementById('modal-root').innerHTML='';document.body.classList.remove('modal-open');if(modalHandler)document.removeEventListener('keydown',modalHandler);if(previousFocus?.isConnected)previousFocus.focus?.();else document.getElementById('main')?.focus({preventScroll:true});}
export function openModal(title,subtitle,content,{wide=false}={}){
 previousFocus=document.activeElement;if(modalHandler)document.removeEventListener('keydown',modalHandler);
 document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-head"><div><h2 id="modal-title">${e(title)}</h2>${subtitle?`<p>${e(subtitle)}</p>`:''}</div>${iconBtn('x','close-modal','Close dialog')}</header><div class="modal-body">${content}</div></section></div>`;
 document.body.classList.add('modal-open');document.getElementById('app').inert=true;document.querySelector('[data-action="close-modal"]').onclick=closeModal;document.querySelector('.modal-overlay').onclick=ev=>{if(ev.target.classList.contains('modal-overlay'))closeModal();};
 modalHandler=ev=>{if(ev.key==='Escape')closeModal();if(ev.key==='Tab'){const nodes=[...document.querySelectorAll('.modal button:not(:disabled), .modal input:not(:disabled), .modal select:not(:disabled), .modal textarea:not(:disabled), .modal a[href]')].filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last?.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first?.focus();}}};
 document.addEventListener('keydown',modalHandler);setTimeout(()=>document.querySelector('.modal-body input:not([type="checkbox"]), .modal-body select, .modal-body button, .modal-head button')?.focus(),40);
}
export function confirmDialog(title,description,onConfirm,{label='Delete permanently',danger=true}={}){openModal(title,description,`<div class="confirm-icon ${danger?'red':'blue'}">${icon(danger?'trash':'info',28)}</div><p class="muted">${e(description)}</p><div class="modal-actions">${btn('Cancel','cancel')}${btn(label,'confirm',danger?'danger':'primary',danger?'trash':'check')}</div>`);document.querySelector('[data-action="cancel"]').onclick=closeModal;document.querySelector('[data-action="confirm"]').onclick=async ev=>{ev.currentTarget.disabled=true;try{await onConfirm();closeModal();}catch(err){toast(err.message,'error');ev.target.closest('button').disabled=false;}};}
