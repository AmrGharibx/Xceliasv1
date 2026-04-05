'use strict';

/* ══ STARS CANVAS ══ */
(function(){
  const cv=document.getElementById('stars');
  if(!cv)return;
  const cx=cv.getContext('2d');
  let W,H,stars=[];
  function resize(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight}
  function seed(){stars=[];for(let i=0;i<160;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*.9+.1,ph:Math.random()*Math.PI*2,sp:Math.random()*.006+.003})}
  resize();seed();
  window.addEventListener('resize',()=>{resize();seed()});
  const cols=['rgba(200,200,255,','rgba(220,210,255,','rgba(190,230,255,'];
  function draw(){
    cx.clearRect(0,0,W,H);
    const t=Date.now()*.001;
    stars.forEach((s,i)=>{
      const op=(Math.sin(t*s.sp*18+s.ph)*.38+.52)*.48;
      cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);
      cx.fillStyle=cols[i%3]+op+')';cx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ══ CONFETTI ══ */
function launchConfetti(pct){
  if(pct<70)return;
  const cv=document.getElementById('confetti-cv');if(!cv)return;
  cv.style.display='block';cv.width=innerWidth;cv.height=innerHeight;
  const cx=cv.getContext('2d');
  const C=['#8b5cf6','#d946ef','#10b981','#f59e0b','#f43f5e','#06b6d4','#fff'];
  const pts=[];
  for(let i=0;i<100;i++)pts.push({
    x:innerWidth*(.18+Math.random()*.64),y:-12,
    vx:(Math.random()-.5)*5.5,vy:Math.random()*4+2.5,
    rot:Math.random()*Math.PI*2,rv:(Math.random()-.5)*.2,
    w:Math.random()*9+4,h:Math.random()*14+6,
    c:C[Math.floor(Math.random()*C.length)]
  });
  let fr=0,MAX=110;
  (function drw(){
    cx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.rv;p.vy+=.09;
      const op=Math.max(0,1-fr/MAX);
      cx.save();cx.globalAlpha=op;cx.translate(p.x,p.y);cx.rotate(p.rot);
      cx.fillStyle=p.c;cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore();
    });
    fr++;
    if(fr<MAX+25)requestAnimationFrame(drw);
    else{cx.clearRect(0,0,cv.width,cv.height);cv.style.display='none';}
  })();
}

/* ══ BRAND COLORS ══ */
const PC={
  cityzen:   {hex:'#f59e0b',rgb:'245,158,11', grad:'linear-gradient(135deg,#f59e0b,#fb923c)'},
  jade:      {hex:'#10b981',rgb:'16,185,129', grad:'linear-gradient(135deg,#10b981,#06b6d4)'},
  grandlane: {hex:'#06b6d4',rgb:'6,182,212',  grad:'linear-gradient(135deg,#06b6d4,#8b5cf6)'},
  lushvalley:{hex:'#8b5cf6',rgb:'139,92,246',  grad:'linear-gradient(135deg,#8b5cf6,#d946ef)'},
  vdlc:      {hex:'#f43f5e',rgb:'244,63,94',   grad:'linear-gradient(135deg,#f43f5e,#f97316)'},
  mayan:     {hex:'#f97316',rgb:'249,115,22',  grad:'linear-gradient(135deg,#f97316,#f59e0b)'}
};
function pc(id){return PC[id]||{hex:'#8b5cf6',rgb:'139,92,246',grad:'linear-gradient(135deg,#8b5cf6,#d946ef)'}}

/* ══ DATA ══ */
const BATCHES=[{
  id:'batch31',label:'Batch 31',status:'archived',icon:'🏙️',
  tagline:'New Capital · HDP Grand Lane Edition',
  projects:[
    {id:'cityzen',devName:'Al Qamzi',devIcon:'🏢',devOwner:'Abdalla Al Qamzi',
     devSince:'Founded 1997 · Egypt entry 2010',
     devHistory:[{label:'New Cairo',p:'East Shire'},{label:'North Coast',p:'Seazen (K-171)'},{label:'Mostakbal City',p:'Cityzen'}],
     projectName:'Cityzen',area:'95 feddan',location:'Mostakbal City',delivery:'4 years',maintenance:'10%',
     paymentPlan:'5% DP + 5% after 3 months · 9 years',
     finishing:['Apartments: Semi Finished','Villas: Core & Shell'],
     units:[{t:'1 BR',s:'65m²',p:'3.7M',n:3.7},{t:'2 BR',s:'120m²',p:'6.9M',n:6.9},{t:'3 BR',s:'145–185m²',p:'7.9M',n:7.9},{t:'Townhome',s:'180m²',p:'16M',n:16},{t:'Standalone Villa',s:'275m²',p:'31M',n:31}]},
    {id:'jade',devName:'La Vista',devIcon:'🌿',devOwner:'Alaa El Hady',
     devSince:'Established developer',
     devHistory:[{label:'North Coast',p:'La Vista Cascada, Bay East, Ras El Hikma'},{label:'Sokhna',p:'La Vista Ray, 6, Gardens'},{label:'El Shorouk',p:'El Patio 5 East, Prime, Casa, Sola'},{label:'New Capital',p:'La Vista City — El Patio Jade (2026)'},{label:'6th Settlement',p:'El Patio Vida'},{label:'New Cairo',p:'El Patio Oro, Patio 7, Patio Town'},{label:'Sheikh Zayed',p:'El Patio Vera'}],
     projectName:'El Patio Jade',area:'100 feddan',location:'New Capital',delivery:'4 years',maintenance:'8%',
     paymentPlan:'5% DP · 8 years',
     finishing:['Apartments: Core & Shell','Villas: Core & Shell'],
     facilities:['10-acre Clubhouse','Sports courts','Kids play areas','Food court','Outdoor gym','Massive water features'],
     units:[{t:'Townhouse Mid',s:'185m²',p:'18.7M',n:18.7},{t:'Townhouse Corner',s:'200m²',p:'Sold Out',n:0},{t:'Twin House',s:'210m²',p:'22.2M',n:22.2},{t:'S/A Villa 225m²',s:'225m²',p:'23.9M',n:23.9},{t:'S/A Villa 265m²',s:'265m²',p:'~30M',n:30},{t:'S/A Villa 310m²',s:'310m²',p:'~37M',n:37},{t:'S/A Villa 411m²',s:'411m²',p:'44.6M',n:44.6},{t:'Family House G',s:'165m²',p:'18.4M',n:18.4},{t:'Penthouse',s:'205m²',p:'17.3M',n:17.3}]},
    {id:'grandlane',devName:'HDP',devIcon:'🏗️',devOwner:'HDP Developer',
     devSince:'Established developer',
     devHistory:[{label:'New Capital',p:'Grand Lane'}],
     projectName:'Grand Lane',area:'98 feddan',location:'New Capital',delivery:'4 years',maintenance:null,
     paymentPlan:'5% DP · choose 4, 8, or 10 years',
     finishing:['Apartments: Semi Finished','Villas: Core & Shell'],
     units:[{t:'1 BR',s:'65–109m²',p:'3.5M / 4.3M / 4.7M',n:3.5},{t:'2 BR',s:'103–144m²',p:'5.2M / 6.3M / 7M',n:5.2},{t:'3 BR',s:'138–167m²',p:'6.5M / 7.9M / 8.8M',n:6.5},{t:'Town House',s:'184–203m²',p:'12.3M / 14.9M / 16.5M',n:12.3},{t:'Villa',s:'235–251m²',p:'23M / 27.9M / 30.9M',n:23}]},
    {id:'lushvalley',devName:'City Edge',devIcon:'🌆',devOwner:'Tamer Nasser (CEO)',
     devSince:'Since 2017',
     devHistory:[{label:'New Cairo',p:'V40'},{label:'6th October',p:'Etapa'},{label:'North Coast',p:'Mazarine, North Edge, Gate Towers, Latin City Golf'},{label:'New Capital',p:'El Maqsed, Jade Park, New Garden City'},{label:'New Mansoura',p:'Zahya, Areej, Marjan'}],
     projectName:'Lush Valley',area:'60 feddan',location:'New Capital',delivery:null,maintenance:'8%',
     paymentPlan:'5% DP + 5% · 8 years',
     finishing:['All types available'],
     units:[{t:'1 BR',s:'70m²',p:'5.6M',n:5.6},{t:'2 BR',s:'96–132m²',p:'9.7M',n:9.7},{t:'3 BR',s:'157–237m²',p:'12.9M',n:12.9},{t:'Loft',s:'195m²',p:'15.5M',n:15.5},{t:'Duplex',s:'226–307m²',p:'19.4M',n:19.4},{t:'Mansio',s:'261–312m²',p:'24.4M',n:24.4}]},
    {id:'vdlc',devName:'Palm Hills',devIcon:'🌴',devOwner:'Yassen Mansour',
     devSince:'Since 1997',
     devHistory:[{label:'New Cairo',p:'The Village, PK1, PK2, VGK, PHNC, Palmet, Village Avenue'},{label:'Sarai',p:'Capital Gardens'},{label:'6th October',p:'Bamboo, Palm Valley, Golf Central, Badya, Casa, Jirian'},{label:'North Coast',p:'Hacienda Bay, Henesh, Blue, Waters 1 & 2, White, West'},{label:'New Alamain',p:'PHNA, Palm Hill, Alex'}],
     projectName:'Village De La Capital',area:'290 feddan (Phase 1: 88F)',location:'New Capital',delivery:'5 years',maintenance:null,
     paymentPlan:'1.5% down payment · 12 years',
     finishing:['Core & Shell'],
     facilities:['95% units overlooking landscape/water','Commercial area','School','Community Center'],
     units:[{t:'1 BR',s:'60m²',p:'5.5M',n:5.5},{t:'2 BR',s:'95m²',p:'7.9M',n:7.9},{t:'3 BR',s:'140m²',p:'11.6M',n:11.6},{t:'Townhouse Mid',s:'185m²',p:'18.8M',n:18.8},{t:'Townhouse Corner',s:'185m²',p:'20.8M',n:20.8},{t:'S/A Villa 285m²',s:'285m²',p:'26.5M',n:26.5},{t:'S/A Villa 300m²',s:'300m²',p:'29.9M',n:29.9},{t:'S/A Villa 371m²',s:'371m²',p:'36.6M',n:36.6}]}
  ]
},
{
  id:'batch32',label:'Batch 32',status:'archived',icon:'🌆',
  tagline:'Updated Prices · New STM Mayan Project',
  projects:[
    {id:'cityzen',devName:'Al Qamzi',devIcon:'🏢',devOwner:'Abdalla Al Qamzi',
     devSince:'Founded 1997 · Egypt entry 2010',
     devHistory:[{label:'New Cairo',p:'East Shire'},{label:'North Coast',p:'Seazen (K-171)'},{label:'Mostakbal City',p:'Cityzen'}],
     projectName:'Cityzen',area:'95 feddan',location:'Mostakbal City',delivery:'4 years',maintenance:'10%',
     paymentPlan:'5% DP + 5% after 3 months · 9 years',
     finishing:['Core & Shell'],
     units:[{t:'1 BR',s:'65m²',p:'4.9M',n:4.9},{t:'2 BR',s:'120m²',p:'6.3M–10.9M',n:6.3},{t:'3 BR',s:'145–185m²',p:'8.7M–12.9M',n:8.7},{t:'Townhome',s:'180m²',p:'16.3M',n:16.3},{t:'Standalone Villa',s:'275m²',p:'33M',n:33}]},
    {id:'jade',devName:'La Vista',devIcon:'🌿',devOwner:'Alaa El Hady',
     devSince:'Established developer',
     devHistory:[{label:'North Coast',p:'La Vista Cascada, Bay East, Ras El Hikma'},{label:'Sokhna',p:'La Vista Ray, 6, Gardens'},{label:'El Shorouk',p:'El Patio 5 East, Prime, Casa, Sola'},{label:'New Capital',p:'La Vista City — El Patio Jade (2026)'},{label:'6th Settlement',p:'El Patio Vida'},{label:'New Cairo',p:'El Patio Oro, Patio 7, Patio Town'},{label:'Sheikh Zayed',p:'El Patio Vera'}],
     projectName:'El Patio Jade',area:'100 feddan',location:'New Capital',delivery:'4 years',maintenance:'8%',
     paymentPlan:'5% DP · 10 years',
     finishing:['Core & Shell'],
     facilities:['10-acre Clubhouse','Sports courts','Kids play areas','Food court','Outdoor gym','Massive water features'],
     units:[{t:'Townhouse Mid',s:'185m²',p:'19M',n:19},{t:'Townhouse Corner',s:'200m²',p:'Sold Out',n:0},{t:'Twin House',s:'210m²',p:'22M',n:22},{t:'S/A Villa 225m²',s:'225m²',p:'23M+',n:23},{t:'S/A Villa 265m²',s:'265m²',p:'~30M',n:30},{t:'S/A Villa 310m²',s:'310m²',p:'~37M',n:37},{t:'S/A Villa 411m²',s:'411m²',p:'up to 44M',n:44},{t:'Family House G',s:'165m²',p:'19M',n:19},{t:'Penthouse',s:'205m²',p:'18.5M–20M',n:18.5}]},
    {id:'mayan',devName:'STM',devIcon:'🏛️',devOwner:'STM Developer',
     devSince:'Established developer',
     devHistory:[{label:'New Capital',p:'Mayan'}],
     projectName:'Mayan',area:'48 feddan',location:'New Capital',delivery:'1 year',maintenance:null,
     paymentPlan:'10% DP · 10 years',
     finishing:['Fully Finished','G+6 building · 4 units per floor'],
     units:[{t:'2 BR',s:'99–116m²',p:'8.5M–9.9M',n:8.5},{t:'3 BR',s:'127–172m²',p:'10.9M–14.7M',n:10.9}]},
    {id:'lushvalley',devName:'City Edge',devIcon:'🌆',devOwner:'Tamer Nasser (CEO)',
     devSince:'Since 2017',
     devHistory:[{label:'New Cairo',p:'V40'},{label:'6th October',p:'Etapa'},{label:'North Coast',p:'Mazarine, North Edge, Gate Towers, Latin City Golf'},{label:'New Capital',p:'El Maqsed, Jade Park, New Garden City'},{label:'New Mansoura',p:'Zahya, Areej, Marjan'}],
     projectName:'Lush Valley',area:'60 feddan',location:'New Capital',delivery:null,maintenance:'8%',
     paymentPlan:'5% DP · 10 years',
     finishing:['Core & Shell'],
     units:[{t:'1 BR',s:'69m²',p:'6.1M',n:6.1},{t:'2 BR',s:'96–132m²',p:'10.1M',n:10.1},{t:'3 BR',s:'157–237m²',p:'14.5M',n:14.5}]},
    {id:'vdlc',devName:'Palm Hills',devIcon:'🌴',devOwner:'Yassen Mansour',
     devSince:'Since 1997',
     devHistory:[{label:'New Cairo',p:'The Village, PK1, PK2, VGK, PHNC, Palmet, Village Avenue'},{label:'Sarai',p:'Capital Gardens'},{label:'6th October',p:'Bamboo, Palm Valley, Golf Central, Badya, Casa, Jirian'},{label:'North Coast',p:'Hacienda Bay, Henesh, Blue, Waters 1 & 2, White, West'},{label:'New Alamain',p:'PHNA, Palm Hill, Alex'}],
     projectName:'Village De La Capital',area:'290 feddan (Phase 1: 88F)',location:'New Capital',delivery:'5 years',maintenance:null,
     paymentPlan:'1.5% DP · 12 years',
     finishing:['Core & Shell'],
     facilities:['95% units overlooking landscape/water','Commercial area','School','Community Center'],
     units:[{t:'1 BR',s:'60m²',p:'5.5M',n:5.5},{t:'2 BR',s:'95m²',p:'Sold Out',n:0},{t:'3 BR',s:'140m²',p:'11.9M',n:11.9},{t:'Townhouse Mid',s:'185m²',p:'19.6M',n:19.6},{t:'Townhouse Corner',s:'185m²',p:'21.6M',n:21.6},{t:'S/A Villa 285m²',s:'285m²',p:'26.6M',n:26.6},{t:'S/A Villa 300m²',s:'300m²',p:'29M',n:29},{t:'S/A Villa 371m²',s:'371m²',p:'35.5M',n:35.5}]}
  ]
},{
  id:'batch33',label:'Batch 33',status:'available',icon:'🔥',
  tagline:'Latest Prices · Duplex at Lush Valley',
  projects:[
    {id:'cityzen',devName:'Al Qamzi',devIcon:'🏢',devOwner:'Abdalla Al Qamzi',
     devSince:'Founded 1997 · Egypt entry 2010',
     devHistory:[{label:'New Cairo',p:'East Shire'},{label:'North Coast',p:'Seazen (K-171)'},{label:'Mostakbal City',p:'Cityzen'}],
     projectName:'Cityzen',area:'95 feddan',location:'Mostakbal City',delivery:'4 years',maintenance:'10%',
     paymentPlan:'5% DP + 5% after 3 months · 10 years',
     finishing:['Core & Shell'],
     units:[{t:'1 BR',s:'NA',p:'NA',n:0},{t:'2 BR',s:'125m²',p:'7.1M',n:7.1},{t:'3 BR',s:'145–160m²',p:'8.7M–9.7M',n:8.7},{t:'Townhome',s:'180m²',p:'NA',n:0},{t:'Standalone Villa',s:'275m²',p:'NA',n:0}]},
    {id:'jade',devName:'La Vista',devIcon:'🌿',devOwner:'Alaa El Hady',
     devSince:'Established developer',
     devHistory:[{label:'North Coast',p:'La Vista Cascada, Bay East, Ras El Hikma'},{label:'Sokhna',p:'La Vista Ray, 6, Gardens'},{label:'El Shorouk',p:'El Patio 5 East, Prime, Casa, Sola'},{label:'New Capital',p:'La Vista City — El Patio Jade (2026)'},{label:'6th Settlement',p:'El Patio Vida'},{label:'New Cairo',p:'El Patio Oro, Patio 7, Patio Town'},{label:'Sheikh Zayed',p:'El Patio Vera'}],
     projectName:'El Patio Jade',area:'100 feddan',location:'New Capital',delivery:'4 years',maintenance:'8%',
     paymentPlan:'5% DP · 10 years',
     finishing:['Core & Shell'],
     facilities:['10-acre Clubhouse','Sports courts','Kids play areas','Food court','Outdoor gym','Massive water features'],
     units:[{t:'Townhouse Mid',s:'185m²',p:'18.7M',n:18.7},{t:'Townhouse Corner',s:'200m²',p:'Sold Out',n:0},{t:'Twin House',s:'210m²',p:'21.9M',n:21.9},{t:'S/A Villa 225m²',s:'225m²',p:'23.8M',n:23.8},{t:'S/A Villa 265m²',s:'265m²',p:'~28M',n:28},{t:'S/A Villa 310m²',s:'310m²',p:'33M',n:33},{t:'Family House GF',s:'165m²',p:'19M',n:19},{t:'Penthouse',s:'205m²',p:'18.5M–20M',n:18.5}]},
    {id:'mayan',devName:'STM',devIcon:'🏛️',devOwner:'STM Developer',
     devSince:'Established developer',
     devHistory:[{label:'New Capital',p:'Mayan'}],
     projectName:'Mayan',area:'48 feddan',location:'New Capital',delivery:'1 year',maintenance:null,
     paymentPlan:'10% DP · 10 years',
     finishing:['Fully Finished','G+6 building · 4 units per floor'],
     units:[{t:'2 BR',s:'99–116m²',p:'8.5M–9.9M',n:8.5},{t:'3 BR',s:'127–172m²',p:'10.9M–14.7M',n:10.9}]},
    {id:'lushvalley',devName:'City Edge',devIcon:'🌆',devOwner:'Tamer Nasser (CEO)',
     devSince:'Since 2017',
     devHistory:[{label:'New Cairo',p:'V40'},{label:'6th October',p:'Etapa'},{label:'North Coast',p:'Mazarine, North Edge, Gate Towers, Latin City Golf'},{label:'New Capital',p:'El Maqsed, Jade Park, New Garden City'},{label:'New Mansoura',p:'Zahya, Areej, Marjan'}],
     projectName:'Lush Valley',area:'60 feddan',location:'New Capital',delivery:null,maintenance:'8%',
     paymentPlan:'5% DP · 10 years',
     finishing:['Core & Shell'],
     units:[{t:'1 BR',s:'69m²',p:'6.1M',n:6.1},{t:'2 BR',s:'96–132m²',p:'10.1M',n:10.1},{t:'3 BR',s:'157–237m²',p:'14.5M',n:14.5},{t:'Duplex',s:'251m²',p:'20M',n:20}]},
    {id:'vdlc',devName:'Palm Hills',devIcon:'🌴',devOwner:'Yassen Mansour',
     devSince:'Since 1997',
     devHistory:[{label:'New Cairo',p:'The Village, PK1, PK2, VGK, PHNC, Palmet, Village Avenue'},{label:'Sarai',p:'Capital Gardens'},{label:'6th October',p:'Bamboo, Palm Valley, Golf Central, Badya, Casa, Jirian'},{label:'North Coast',p:'Hacienda Bay, Henesh, Blue, Waters 1 & 2, White, West'},{label:'New Alamain',p:'PHNA, Palm Hill, Alex'}],
     projectName:'Village De La Capital',area:'290 feddan (Phase 1: 88F)',location:'New Capital',delivery:'5 years',maintenance:null,
     paymentPlan:'1.5% DP · 12 years',
     finishing:['Core & Shell'],
     facilities:['95% units overlooking landscape/water','Commercial area','School','Community Center'],
     units:[{t:'1 BR',s:'60m²',p:'5.8M',n:5.8},{t:'2 BR',s:'95m²',p:'Sold Out',n:0},{t:'3 BR',s:'141m²',p:'12.5M',n:12.5},{t:'Townhouse Mid',s:'185m²',p:'20.5M',n:20.5},{t:'Townhouse Corner',s:'185m²',p:'22.7M',n:22.7},{t:'S/A Villa 285m²',s:'285m²',p:'28.1M',n:28.1},{t:'S/A Villa 300m²',s:'300m²',p:'30.4M',n:30.4},{t:'S/A Villa 371m²',s:'371m²',p:'37.3M',n:37.3}]}
  ]
}];

/* ══ QUIZ BANK ══ */
function buildQ(projs){
  const qs=[];
  projs.forEach(p=>{
    qs.push({q:`Who is the developer behind "${p.projectName}"?`,opts:qopts(p.devName,projs.map(x=>x.devName)),ans:p.devName,ex:`${p.projectName} is by ${p.devName} (${p.devOwner}).`});
    qs.push({q:`Payment plan for "${p.projectName}"?`,opts:qopts(p.paymentPlan,projs.filter(x=>x.id!==p.id).slice(0,3).map(x=>x.paymentPlan)),ans:p.paymentPlan,ex:`Payment plan: ${p.paymentPlan}`});
    qs.push({q:`Total area of "${p.projectName}"?`,opts:qopts(p.area,projs.filter(x=>x.id!==p.id).slice(0,3).map(x=>x.area)),ans:p.area,ex:`${p.projectName} covers ${p.area}.`});
    if(p.maintenance)qs.push({q:`Maintenance fee for "${p.projectName}"?`,opts:qopts(p.maintenance,['5%','12%','15%']),ans:p.maintenance,ex:`Maintenance: ${p.maintenance}.`});
    const cheap=p.units.filter(u=>u.n>0).sort((a,b)=>a.n-b.n)[0];
    if(cheap){const cAns=`${cheap.t} — ${cheap.p}`;qs.push({q:`Entry-level unit in "${p.projectName}"?`,opts:qopts(cAns,projs.filter(x=>x.id!==p.id).slice(0,3).map(x=>{const c=x.units.filter(u=>u.n>0).sort((a,b)=>a.n-b.n)[0];return c?`${c.t} — ${c.p}`:'1 BR — 5M'})),ans:cAns,ex:`Entry: ${cheap.t} (${cheap.s}) at ${cheap.p}.`});}
  });
  // ── Dynamic extras (work for any batch) ──
  const getYrs=s=>{const m=String(s||'').match(/(\d+)\s*year/i);return m?+m[1]:0};
  const numF=a=>parseFloat(String(a||'').replace(/[^\d.]/g,''))||0;
  const byArea=[...projs].sort((a,b)=>numF(a.area)-numF(b.area));
  if(byArea.length>=2){
    const sm=byArea[0],lg=byArea[byArea.length-1];
    qs.push({q:'Smallest area project in this batch?',opts:qopts(sm.projectName+' — '+sm.area,projs.filter(p=>p.id!==sm.id).slice(0,3).map(p=>p.projectName+' — '+p.area)),ans:sm.projectName+' — '+sm.area,ex:sm.projectName+' covers only '+sm.area+'.'});
    qs.push({q:'Largest area project in this batch?',opts:qopts(lg.projectName+' — '+lg.area,projs.filter(p=>p.id!==lg.id).slice(0,3).map(p=>p.projectName+' — '+p.area)),ans:lg.projectName+' — '+lg.area,ex:lg.projectName+' is the largest at '+lg.area+'.'});
  }
  const mosPrj=projs.find(p=>(p.location||'').includes('Mostakbal'));
  if(mosPrj)qs.push({q:'Which project is in Mostakbal City, not New Capital?',opts:qopts(mosPrj.projectName,projs.filter(p=>p.id!==mosPrj.id).map(p=>p.projectName)),ans:mosPrj.projectName,ex:mosPrj.projectName+' ('+mosPrj.devName+') is in Mostakbal City.'});
  const planLabel=p=>p.projectName+' — '+(p.paymentPlan.match(/\d+\s*year/i)?.[0]||p.paymentPlan);
  const byPlan=[...projs].sort((a,b)=>getYrs(a.paymentPlan)-getYrs(b.paymentPlan));
  const longP=byPlan[byPlan.length-1];
  if(longP)qs.push({q:'Longest payment plan (most years) in this batch?',opts:qopts(planLabel(longP),byPlan.slice(0,-1).slice(0,3).map(planLabel)),ans:planLabel(longP),ex:longP.projectName+': '+longP.paymentPlan+'.'});
  const withDel=[...projs].filter(p=>p.delivery&&getYrs(p.delivery)>0).sort((a,b)=>getYrs(a.delivery)-getYrs(b.delivery));
  if(withDel.length>=2){const fast=withDel[0];qs.push({q:'Fastest delivery in this batch?',opts:qopts(fast.projectName+' — '+fast.delivery,withDel.slice(1).slice(0,3).map(p=>p.projectName+' — '+p.delivery)),ans:fast.projectName+' — '+fast.delivery,ex:fast.projectName+' delivers in just '+fast.delivery+'.'});}
  const ffPrj=projs.find(p=>p.finishing&&p.finishing.some(f=>/fully finished/i.test(f)));
  if(ffPrj)qs.push({q:'Which project offers Fully Finished apartments?',opts:qopts(ffPrj.projectName,projs.filter(p=>p.id!==ffPrj.id).map(p=>p.projectName)),ans:ffPrj.projectName,ex:ffPrj.projectName+' is Fully Finished — move-in ready.'});
  const soldPrj=projs.find(p=>p.units.some(u=>/(sold.?out)/i.test(u.p)));
  if(soldPrj){const su=soldPrj.units.find(u=>/(sold.?out)/i.test(u.p));qs.push({q:'Which project has a Sold Out unit type?',opts:qopts(soldPrj.projectName,projs.filter(p=>p.id!==soldPrj.id).map(p=>p.projectName)),ans:soldPrj.projectName,ex:soldPrj.projectName+': '+su.t+' ('+su.s+') is Sold Out.'});}
  const ceoPrj=projs.find(p=>(p.devOwner||'').includes('CEO'));
  if(ceoPrj)qs.push({q:'Which developer title is CEO in this batch?',opts:qopts(ceoPrj.devOwner,projs.filter(p=>p.id!==ceoPrj.id).map(p=>p.devOwner)),ans:ceoPrj.devOwner,ex:ceoPrj.devName+' CEO: '+ceoPrj.devOwner+'.'});
  const vdlcPrj=projs.find(p=>(p.facilities||[]).some(f=>/95%/.test(f)));
  if(vdlcPrj)qs.push({q:'% of '+vdlcPrj.projectName+' units with landscape/water view?',opts:qopts('95%',['80%','70%','60%']),ans:'95%',ex:'95% of units in '+vdlcPrj.projectName+' overlook landscape or water.'});
  return shuffle(qs);
}

/* ══ FLASH CARDS ══ */
function buildFC(p){
  const cards=[];
  cards.push({q:'Developer',a:p.devName});
  cards.push({q:'Owner',a:p.devOwner});
  cards.push({q:'Project Area',a:p.area});
  cards.push({q:'Location',a:p.location});
  cards.push({q:'Payment Plan',a:p.paymentPlan});
  cards.push({q:'Delivery',a:p.delivery||'TBC'});
  if(p.maintenance)cards.push({q:'Maintenance Fee',a:p.maintenance});
  p.units.slice(0,4).forEach(u=>{cards.push({q:u.t+' price',a:u.p});cards.push({q:u.t+' size',a:u.s})});
  if(p.facilities)cards.push({q:'Key Facility',a:p.facilities[0]});
  return shuffle(cards);
}

/* ══ BLANKS ══ */
function buildBlanks(projs){
  const bl=[];
  projs.forEach(p=>{
    bl.push({pr:`${p.projectName} by ${p.devName} covers _____ feddan in ${p.location}.`,ans:[p.area.replace(' feddan',''),p.area],hint:'Area in feddan'});
    bl.push({pr:`${p.devName}'s payment plan for ${p.projectName}: _____`,ans:[p.paymentPlan.toLowerCase()],hint:'e.g. 5% DP · 8 years',partial:true});
    if(p.maintenance)bl.push({pr:`Maintenance fee for ${p.projectName}: _____%.`,ans:[p.maintenance.replace('%','').trim()],hint:'Number only'});
  });
  // Dynamic extras
  const soldoP=projs.find(p=>p.units.some(u=>/(sold.?out)/i.test(u.p)));
  if(soldoP){const so=soldoP.units.find(u=>/(sold.?out)/i.test(u.p));bl.push({pr:`${so.t} in ${soldoP.projectName} is _____.`,ans:['sold out','soldout'],hint:'Status'});}
  const ffBl=projs.find(p=>p.finishing&&p.finishing.some(f=>/fully finished/i.test(f)));
  if(ffBl)bl.push({pr:`${ffBl.projectName} (${ffBl.devName}) finishing type: _____.`,ans:['fully finished'],hint:'Finishing level',partial:true});
  const vBl=projs.find(p=>(p.facilities||[]).some(f=>/95%/.test(f)));
  if(vBl)bl.push({pr:`_____ % of ${vBl.projectName} units overlook landscape/water.`,ans:['95'],hint:'Number only'});
  return shuffle(bl);
}

/* ══ MATCH PAIRS ══ */
function buildMatch(projs){
  const pairs=[];
  projs.forEach(p=>{
    pairs.push({id:p.id+'_d',grp:p.id,txt:p.devName,t:'dev'});
    pairs.push({id:p.id+'_p',grp:p.id,txt:p.projectName,t:'proj'});
  });
  return shuffle(pairs);
}

/* ══ STATE ══ */
let curBatch=null,curSection='study',curProjIdx=0;
let quizQs=[],quizIdx=0,quizOk=0,quizDone=false;
let fcards=[],fcIdx=0,fcRes=[];
let blanks=[],blIdx=0;
let matchPairs=[],matchSel=null,matchDone=[];
/* Storage adapter: students get sessionStorage (auto-resets per tab), admins get localStorage */
let _store=localStorage;
let mastered={};
let scores=[];

/* ══ UTILS ══ */
function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function dedup(arr){const seen=new Set();return arr.filter(x=>{const k=String(x);if(seen.has(k))return false;seen.add(k);return true})}
function qopts(ans,pool,n){n=n||4;let a=[ans,...pool.filter(x=>x!==ans)];a=[...new Set(a)];while(a.length<n)a.push('Option '+a.length);return shuffle(a.slice(0,n))}
function esc(s){const d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML}
function $id(id){return document.getElementById(id)}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9%\/\. ]/g,'').trim()}

/* ══ AUTH ══ */
XceliasAuth.guard({
  moduleName:'Study Guide',requiredRoles:null,
  onReady:function(user){
    $id('tb-uname').textContent=user.displayName||user.username||'Trainee';
    /* Students get sessionStorage so each tab is a clean slate */
    _store=(user.role==='student')?sessionStorage:localStorage;
    mastered=(function(){try{return JSON.parse(_store.getItem('xc_sg2_mas'))||{}}catch(e){return{}}})();
    scores=(function(){try{return JSON.parse(_store.getItem('xc_sg2_sc'))||[]}catch(e){return[]}})();
    initApp();
  }
});
function handleSignOut(){if(confirm('Sign out?'))XceliasAuth.signOut()}

function initApp(){
  renderBatchGrid();
  showScreen('screen-batches');
  const bnav=$id('bnav');if(bnav)bnav.style.display='none';
  // Stats: counts from the latest (most current) batch only
  const latest=BATCHES[BATCHES.length-1];
  const latestDevs=new Set(latest.projects.map(p=>p.devName));
  const elB=$id('st-batches');if(elB)elB.textContent=BATCHES.length;
  const elP=$id('st-projects');if(elP)elP.textContent=latest.projects.length;
  const elD=$id('st-devs');if(elD)elD.textContent=latestDevs.size;
  const elC=$id('st-current');if(elC)elC.textContent=latest.label;
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const s=$id(id);if(s)s.classList.add('active');
  window.scrollTo(0,0);
}

/* ══ BATCH GRID ══ */
function renderBatchGrid(){
  const g=$id('batch-grid');if(!g)return;
  g.innerHTML=BATCHES.map((b,i)=>{
    const available=b.status==='available';
    const archived=b.status==='archived';
    const unclickable=!available;
    const isMast=available&&!!mastered[b.id+'_all'];
    const pills=b.projects.map(p=>`<span class="bcard-proj"><span class="bcard-proj-dot" style="background:${pc(p.id).hex}"></span>${esc(p.projectName)}</span>`).join('');
    const topBadge=archived?'bcard-archived':unclickable?'bcard-locked':isMast?'bcard-mastered-top':'bcard-available';
    const topLabel=archived?'📦 Past Batch':unclickable?'🔒 Coming Soon':isMast?'🏆 Mastered':'✦ Available';
    const ctaHtml=archived
      ?`<div class="bcard-cta" style="opacity:.5;pointer-events:none"><span>Past Batch</span><span class="cta-arrow">📦</span></div>`
      :unclickable
        ?`<div class="bcard-cta"><span>Unlocks soon</span><span class="cta-arrow">🔒</span></div>`
        :isMast
          ?`<div class="bcard-mastered-badge">🏆 Batch Complete · Quiz Passed</div>`
          :`<div class="bcard-cta"><span>Begin Studying</span><span class="cta-arrow">→</span></div>`;
    return `<div class="bcard" style="--i:${i}${unclickable?';opacity:.55;filter:grayscale(.4)':''}" tabindex="${unclickable?-1:0}" role="button" aria-disabled="${unclickable}"
      data-action="${unclickable?'':'openBatch'}" data-id="${b.id}">
      <div class="bcard-inner">
        <div class="bcard-top">
          <div class="bcard-icon">${esc(b.icon)}</div>
          <div class="${topBadge}">${topLabel}</div>
        </div>
        <div class="bcard-name">${esc(b.label)}</div>
        <div class="bcard-tagline">${esc(b.tagline)}</div>
        <div class="bcard-projs">${pills}</div>
        ${ctaHtml}
      </div>
    </div>`;
  }).join('');
}

/* ══ OPEN BATCH ══ */
function openBatch(id){
  curBatch=BATCHES.find(b=>b.id===id);if(!curBatch)return;
  quizQs=buildQ(curBatch.projects);quizIdx=0;quizOk=0;quizDone=false;
  blanks=buildBlanks(curBatch.projects);blIdx=0;
  matchPairs=buildMatch(curBatch.projects);matchSel=null;matchDone=[];
  fcards=buildFC(curBatch.projects[0]);fcIdx=0;fcRes=[];
  curProjIdx=0;
  const tb=$id('tb-batch');if(tb){tb.textContent=curBatch.label;tb.style.display=''}
  if($id('tb-mod'))$id('tb-mod').textContent=curBatch.label+' · Study Guide';
  const bnav=$id('bnav');if(bnav)bnav.style.display='';
  buildModeTabs();
  switchSection('study');
  showScreen('screen-study');
}

/* ══ MODE TABS ══ */
const MODES=[
  {id:'study',icon:'📖',label:'Study'},
  {id:'flash',icon:'⚡',label:'Flash Cards'},
  {id:'quiz', icon:'🧠',label:'Quiz'},
  {id:'match',icon:'🎯',label:'Match'},
  {id:'blank',icon:'✏️',label:'Fill Blank'}
];

function buildModeTabs(){
  const t=$id('modetabs');if(!t)return;
  t.innerHTML=MODES.map((m,i)=>
    `<button class="mtab ${i===0?'active':''}" id="mt-${m.id}"
      data-action="switchSection" data-section="${m.id}" role="tab" aria-selected="${i===0}">
      <span class="mtab-icon">${esc(m.icon)}</span>${esc(m.label)}
    </button>`).join('');
}

function updModeTabs(active){
  MODES.forEach(m=>{
    const t=$id('mt-'+m.id);if(!t)return;
    const on=m.id===active;
    t.classList.toggle('active',on);
    t.setAttribute('aria-selected',String(on));
  });
  const idx=MODES.findIndex(m=>m.id===active);
  const fill=$id('mpbar-fill');if(fill)fill.style.width=(idx<0?0:idx/(MODES.length-1)*100)+'%';
  MODES.forEach(m=>{const b=$id('bn-'+m.id);if(b)b.classList.toggle('on',m.id===active)});
  updNavPill(active);
}

function updNavPill(activeId){
  const pill=$id('bnav-pill'),inner=$id('bnav-inner');
  if(!pill||!inner)return;
  const idx=MODES.findIndex(m=>m.id===activeId);
  const tabs=inner.querySelectorAll('.bntab');
  if(idx<0||idx>=tabs.length)return;
  const tab=tabs[idx];
  requestAnimationFrame(()=>{
    pill.style.left=(tab.offsetLeft+4)+'px';
    pill.style.width=(tab.offsetWidth-8)+'px';
  });
}

/* ══ SECTION SWITCH ══ */
function switchSection(s){
  curSection=s;updModeTabs(s);
  const area=$id('study-area');if(!area)return;
  if(s==='study')renderStudy(area);
  else if(s==='flash')renderFlash(area);
  else if(s==='quiz')renderQuiz(area);
  else if(s==='match')renderMatch(area);
  else if(s==='blank')renderBlank(area);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* Apply per-project CSS vars to a container */
function applyProjVars(el,id){
  const c=pc(id);
  el.style.setProperty('--c-accent',c.hex);
  el.style.setProperty('--c-raw','rgba('+c.rgb+',.14)');
  el.style.setProperty('--c-grad',c.grad);
  el.style.setProperty('--c-rgb',c.rgb);
}

/* ══ STUDY ══ */
function renderStudy(area){
  if(!curBatch)return;
  const proj=curBatch.projects;
  const btns=proj.map((p,i)=>`
    <button class="psel-btn ${i===curProjIdx?'on':''}" data-action="selStudyProj" data-idx="${i}"
      style="${i===curProjIdx?'--c-accent:'+pc(p.id).hex+';--c-rgb:'+pc(p.id).rgb+';border-color:'+pc(p.id).hex+'55':''}"
    >
      <span class="psel-dot" style="background:${pc(p.id).hex}"></span>
      ${esc(p.devIcon)} ${esc(p.devName)}
    </button>`).join('');
  area.innerHTML=`
    <button class="back-btn" data-action="goBack">← Batch Library</button>
    <div class="proj-selector">${btns}</div>
    <div id="study-det"></div>`;
  renderProjDetail(curProjIdx);
}

function selStudyProj(i){
  curProjIdx=i;
  fcards=buildFC(curBatch.projects[i]);fcIdx=0;fcRes=[];
  document.querySelectorAll('.psel-btn').forEach((b,idx)=>{
    const on=idx===i;
    b.classList.toggle('on',on);
    if(on){const c=pc(curBatch.projects[i].id);b.style.cssText='--c-accent:'+c.hex+';--c-rgb:'+c.rgb+';border-color:'+c.hex+'55'}
    else b.style.cssText='';
  });
  renderProjDetail(i);
}

function renderProjDetail(i){
  const p=curBatch.projects[i];
  const det=$id('study-det');if(!det)return;
  applyProjVars(det,p.id);
  const c=pc(p.id);
  const key=curBatch.id+'_all';
  const isMast=!!mastered[key];
  const tiles=[
    {icon:'📐',val:p.area,key:'Area'},
    {icon:'📍',val:p.location,key:'Location'},
    {icon:'💳',val:p.paymentPlan,key:'Payment Plan'},
    {icon:'🏗️',val:p.delivery||'TBC',key:'Delivery'},
    ...(p.maintenance?[{icon:'🔧',val:p.maintenance,key:'Maintenance'}]:[]),
    ...(p.finishing?[{icon:'🎨',val:p.finishing.join(' · '),key:'Finishing'}]:[])
  ];
  const histHtml=p.devHistory.map(h=>`<strong>${esc(h.label)}:</strong> ${esc(h.p)}`).join(' &middot; ');
  const facHtml=p.facilities?`
    <div class="sec-label">Facilities</div>
    <div class="fac-strip">${p.facilities.map(f=>`<div class="fac-item"><div class="fac-icon">🏛️</div><div class="fac-text">${esc(f)}</div></div>`).join('')}</div>
  `:'';
  const mastBanner=isMast?`<div class="mastered-banner"><div class="mastered-banner-emoji">🏆</div><div><div style="font-size:.9rem;font-weight:800;color:var(--g)">Mastered — ${esc(p.projectName)}</div><div style="font-size:.7rem;color:var(--muted);margin-top:2px">All exercises completed.</div></div></div>`:'';
  det.innerHTML=`
    ${mastBanner}
    <div class="dev-card">
      <div class="dev-card-bg"></div>
      <div class="dev-top">
        <div class="dev-ava">${esc(p.devIcon)}</div>
        <div>
          <div class="dev-name">${esc(p.devName)}</div>
          <div class="dev-since">${esc(p.devSince)}</div>
          <div class="dev-owner">Owner: ${esc(p.devOwner)}</div>
        </div>
      </div>
      <div class="dev-hist">${histHtml}</div>
    </div>
    <div class="proj-panel">
      <div class="proj-panel-head">
        <div class="proj-name"><span>🏙️</span>${esc(p.projectName)}</div>
        <div class="area-badge">📐 ${esc(p.area)}</div>
      </div>
      <div class="proj-body">
        <div class="sec-label">Key Info</div>
        <div class="info-grid">
          ${tiles.map(t=>`<div class="info-tile"><div class="it-icon">${t.icon}</div><div class="it-val">${esc(t.val)}</div><div class="it-key">${esc(t.key)}</div></div>`).join('')}
        </div>
        ${facHtml}
        <div class="sec-label">Unit Types &amp; Prices</div>
        <div class="units-grid">
          ${p.units.map(u=>`<div class="unit-card"><div class="utype">${esc(u.t)}</div><div class="usize">${esc(u.s)}</div><div class="uprice">${esc(u.p)}</div></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="price-table-wrap">
      <table class="price-table">
        <thead><tr><th>Unit</th><th>Size</th><th>Price</th></tr></thead>
        <tbody>${p.units.map(u=>`<tr><td>${esc(u.t)}</td><td>${esc(u.s)}</td><td class="price-cell">${esc(u.p)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="text-align:center;padding:6px 0 24px">
      <button class="btn-primary" data-action="switchSection" data-section="flash">⚡ Start Flash Cards →</button>
    </div>`;
}

/* ══ FLASH ══ */
function renderFlash(area){
  fcards=buildFC(curBatch.projects[curProjIdx]);fcIdx=0;fcRes=[];
  const btns=curBatch.projects.map((p,i)=>`
    <button class="psel-btn ${i===curProjIdx?'on':''}" data-action="selFlashProj" data-idx="${i}"
      style="${i===curProjIdx?'--c-accent:'+pc(p.id).hex+';--c-rgb:'+pc(p.id).rgb+';border-color:'+pc(p.id).hex+'55':''}">
      <span class="psel-dot" style="background:${pc(p.id).hex}"></span>
      ${esc(p.devIcon)} ${esc(p.devName)}
    </button>`).join('');
  area.innerHTML=`
    <button class="back-btn" data-action="goBack">← Batch Library</button>
    <div class="proj-selector">${btns}</div>
    <div id="flash-area" style="display:flex;flex-direction:column;align-items:center"></div>`;
  renderFC();
}

function selFlashProj(i){
  curProjIdx=i;
  fcards=buildFC(curBatch.projects[i]);fcIdx=0;fcRes=[];
  document.querySelectorAll('.psel-btn').forEach((b,idx)=>{
    const on=idx===i;b.classList.toggle('on',on);
    if(on){const c=pc(curBatch.projects[i].id);b.style.cssText='--c-accent:'+c.hex+';--c-rgb:'+c.rgb+';border-color:'+c.hex+'55'}
    else b.style.cssText='';
  });
  renderFC();
}

function renderFC(){
  const area=$id('flash-area');if(!area)return;
  if(fcIdx>=fcards.length){
    const got=fcRes.filter(Boolean).length;
    area.innerHTML=`<div class="flash-done">
      <span class="flash-done-icon">⚡</span>
      <div class="flash-done-title">Flash Cards Complete!</div>
      <div class="flash-done-sub">${fcards.length} cards · ${got} got it · ${fcards.length-got} missed</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn-secondary" data-action="replayFlash">🔄 Replay</button>
        <button class="btn-primary" data-action="switchSection" data-section="quiz">🧠 Take Quiz →</button>
      </div>
    </div>`;
    return;
  }
  const card=fcards[fcIdx];
  const prog=Math.round(fcIdx/fcards.length*100);
  const dots=fcards.map((_,idx)=>{
    let cls='fdot';
    if(idx<fcIdx)cls+=' '+(fcRes[idx]?'done':'miss');
    else if(idx===fcIdx)cls+=' cur';
    return `<div class="${cls}"></div>`;
  }).join('');
  area.innerHTML=`
    <div class="flash-wrap">
      <div class="card3d-proj-bar"><span>${fcIdx+1} / ${fcards.length}</span><span>${prog}%</span></div>
      <div class="f-pbar-outer"><div class="f-pbar" style="width:${prog}%"></div></div>
      <div class="scene" id="fc-scene" data-action="flipFC" role="button" tabindex="0"
        aria-label="Flash card — tap to flip">
        <div class="card3d" id="fc3d">
          <div class="face face-front">
            <div class="fq-label">❓ Question</div>
            <div class="fq-text">${esc(card.q)}</div>
            <div class="fc-tap-hint">Tap to reveal answer</div>
          </div>
          <div class="face face-back">
            <div class="fa-label">✦ Answer</div>
            <div class="fa-text">${esc(card.a)}</div>
          </div>
        </div>
      </div>
      <div class="flash-controls" id="fc-ctrl">
        <button class="btn-miss" data-action="fcNext" data-knew="false">✗ Missed</button>
        <button class="btn-got" data-action="fcNext" data-knew="true">✓ Got it →</button>
      </div>
      <div class="fdots">${dots}</div>
    </div>`;
}

function flipFC(){
  const c=$id('fc3d');if(!c)return;
  const flipped=c.classList.toggle('flipped');
  const ctrl=$id('fc-ctrl');if(ctrl)ctrl.classList.toggle('show',flipped);
}

function fcNext(knew){
  fcRes[fcIdx]=knew;
  if(knew){const s=$id('fc-scene');if(s)s.classList.add('anim-pop')}
  fcIdx++;
  setTimeout(renderFC,160);
}

/* ══ QUIZ ══ */
function renderQuiz(area){
  if(!area&&!(area=$id('study-area')))return;
  if(quizIdx>=quizQs.length){showQuizResults();return}
  const q=quizQs[quizIdx];
  const prog=Math.round(quizIdx/quizQs.length*100);
  const L=['A','B','C','D'];
  area.innerHTML=`
    <button class="back-btn" data-action="goBack">← Batch Library</button>
    <div class="quiz-wrap">
      <div class="quiz-top">
        <div class="quiz-tlabel">🧠 Quiz &mdash; ${esc(curBatch.label)}</div>
        <div class="quiz-counter">${quizIdx+1} / ${quizQs.length}</div>
      </div>
      <div class="quiz-pbar-outer"><div class="quiz-pbar" style="width:${prog}%"></div></div>
      <div class="quiz-body">
        <div class="quiz-q-num">Question ${quizIdx+1}</div>
        <div class="quiz-q">${esc(q.q)}</div>
        <div class="quiz-opts">
          ${(q.opts||[]).map((o,i)=>`
            <button class="qopt" data-action="answerQ" data-i="${i}">
              <span class="qletter">${L[i]||i+1}</span>${esc(o)}
            </button>`).join('')}
        </div>
        <div class="quiz-fb" id="quiz-fb"></div>
      </div>
      <div class="quiz-foot">
        <div class="quiz-live"><div class="quiz-live-dot"></div>${quizOk} correct</div>
        <button class="btn-primary btn-hidden" id="quiz-next" data-action="nextQ">
          ${quizIdx+1<quizQs.length?'Next →':'See Results 🏆'}
        </button>
      </div>
    </div>`;
  quizDone=false;
}

function answerQ(idx){
  if(quizDone||idx<0||idx>=quizQs[quizIdx].opts.length)return;quizDone=true;
  const q=quizQs[quizIdx];const chosen=q.opts[idx];const ok=chosen===q.ans;
  if(ok)quizOk++;
  document.querySelectorAll('.qopt').forEach((b,i)=>{
    b.disabled=true;
    if(q.opts[i]===q.ans)b.classList.add('correct');
    else if(i===idx&&!ok)b.classList.add('wrong');
  });
  const fb=$id('quiz-fb');
  if(fb){fb.className='quiz-fb '+(ok?'ok':'bad');fb.textContent=ok?'✅ '+(q.ex||'Correct!'):'❌ Correct answer: "'+q.ans+'". '+(q.ex||'')}
  const nb=$id('quiz-next');if(nb)nb.classList.remove('btn-hidden');
}

function nextQ(){
  quizIdx++;
  if(quizIdx>=quizQs.length)showQuizResults();
  else renderQuiz($id('study-area'));
}

function showQuizResults(){
  const pct=Math.round(quizOk/quizQs.length*100);
  let emoji='🥲',title='Keep Practicing';
  if(pct>=90){emoji='🏆';title='Outstanding!'}
  else if(pct>=70){emoji='🎯';title='Well Done!'}
  else if(pct>=50){emoji='📚';title='Good Effort!'}
  $id('sc-emoji').textContent=emoji;
  $id('sc-title').textContent=title;
  $id('sc-sub').textContent=quizOk+' / '+quizQs.length+' · '+pct+'%';
  $id('sc-pct').textContent=pct+'%';
  $id('sc-ok').textContent=quizOk;
  $id('sc-bad').textContent=quizQs.length-quizOk;
  const arc=$id('sc-arc');
  if(arc){const c=334;arc.style.strokeDashoffset=c;requestAnimationFrame(()=>requestAnimationFrame(()=>{arc.style.strokeDashoffset=c-(c*pct/100)}))}
  saveScore(pct);
  if(pct>=80&&curBatch){const k=curBatch.id+'_all';mastered[k]=true;_store.setItem('xc_sg2_mas',JSON.stringify(mastered));updMastered()}
  const ov=$id('score-ov');if(ov)ov.classList.add('on');
  setTimeout(()=>launchConfetti(pct),400);
}

function saveScore(pct){
  const u=XceliasAuth.currentUser();
  scores.unshift({name:u?(u.displayName||u.username):'?',score:pct,batch:curBatch?curBatch.label:'',date:new Date().toLocaleDateString()});
  if(scores.length>50)scores=scores.slice(0,50);
  _store.setItem('xc_sg2_sc',JSON.stringify(scores));
}

function retryQuiz(){closeScore();quizQs=buildQ(curBatch.projects);quizIdx=0;quizOk=0;switchSection('quiz')}
function closeScore(){const ov=$id('score-ov');if(ov)ov.classList.remove('on')}

/* ══ MATCH ══ */
function renderMatch(area){
  matchPairs=buildMatch(curBatch.projects);matchSel=null;matchDone=[];
  area.innerHTML=`
    <button class="back-btn" data-action="goBack">← Batch Library</button>
    <div class="match-wrap">
      <div class="match-head">
        <div class="match-title">🎯 Match: Developer ↔ Project</div>
        <div class="match-badge" id="match-badge">0 / ${curBatch.projects.length} matched</div>
      </div>
      <div class="match-body">
        <div class="match-hint">Tap a <strong>developer name</strong> then its matching <strong>project name</strong>.</div>
        <div class="match-grid" id="match-grid"></div>
      </div>
    </div>`;
  renderMatchGrid();
}

function renderMatchGrid(){
  const g=$id('match-grid');if(!g)return;
  g.innerHTML=matchPairs.map(card=>{
    const matched=matchDone.includes(card.grp);
    const sel=matchSel&&matchSel.id===card.id;
    return `<button class="mcell face-down ${matched?'matched':''} ${sel?'selected':''}"
      id="mc-${card.id}" data-action="selMatch" data-id="${card.id}"
      ${matched?'disabled':''} aria-label="${esc(card.txt)}">
      <span>${esc(card.txt)}</span>
    </button>`;
  }).join('');
}

function selMatch(cardId){
  const card=matchPairs.find(c=>c.id===cardId);
  if(!card||matchDone.includes(card.grp))return;
  if(!matchSel){
    matchSel=card;
    const btn=$id('mc-'+cardId);
    if(btn){btn.classList.remove('face-down');btn.classList.add('selected')}
    return;
  }
  const prev=matchSel;matchSel=null;
  const pb=$id('mc-'+prev.id),cb=$id('mc-'+cardId);
  if(cb)cb.classList.remove('face-down');
  if(prev.grp===card.grp&&prev.id!==card.id){
    matchDone.push(card.grp);
    [pb,cb].forEach(b=>{if(b){b.classList.add('matched');b.classList.remove('selected','face-down');b.disabled=true}});
    const badge=$id('match-badge');if(badge)badge.textContent=matchDone.length+' / '+curBatch.projects.length+' matched';
    if(matchDone.length===curBatch.projects.length){
      setTimeout(()=>{
        const area=$id('study-area');if(!area)return;
        const banner=document.createElement('div');
        banner.className='done-banner';
        banner.innerHTML='<div class="done-emoji">🎯</div><div><div class="done-title">All Matched!</div><div class="done-sub">You know every developer-project pair.</div></div>';
        area.insertBefore(banner,area.firstChild);
        window.scrollTo({top:0,behavior:'smooth'});
      },500);
    }
  } else {
    [pb,cb].forEach(b=>{if(b)b.classList.add('wrong-anim')});
    setTimeout(renderMatchGrid,850);
  }
}

/* ══ FILL BLANK ══ */
function renderBlank(area){
  blanks=buildBlanks(curBatch.projects);blIdx=0;
  area.innerHTML=`
    <button class="back-btn" data-action="goBack">← Batch Library</button>
    <div id="blank-area"></div>`;
  renderBlankQ();
}

function renderBlankQ(){
  const area=$id('blank-area');if(!area)return;
  if(blIdx>=blanks.length){
    area.innerHTML=`<div class="done-banner" style="margin:0">
      <div class="done-emoji">✏️</div>
      <div><div class="done-title">All Blanks Complete!</div><div class="done-sub">${blanks.length} questions done.</div></div>
    </div>
    <div style="text-align:center;margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      <button class="btn-secondary" data-action="resetBlanks">🔄 Start Over</button>
      <button class="btn-primary" data-action="switchSection" data-section="quiz">🧠 Take Quiz →</button>
    </div>`;
    return;
  }
  const b=blanks[blIdx];
  const prog=Math.round(blIdx/blanks.length*100);
  area.innerHTML=`
    <div class="blank-wrap">
      <div class="blank-head">
        <div class="blank-title">✏️ Fill in the Blank</div>
        <div class="blank-counter">${blIdx+1} / ${blanks.length}</div>
      </div>
      <div class="pbar-line"><div class="pbar-fill" style="width:${prog}%"></div></div>
      <div class="blank-body">
        <div class="blank-prompt">${esc(b.pr)}</div>
        <div class="blank-iw">
          <input class="blank-input" type="text" id="blank-inp" placeholder="${esc(b.hint)}"
            autocapitalize="off" autocorrect="off" spellcheck="false"/>
          <span class="blank-hint-tag">${esc(b.hint)}</span>
        </div>
        <div class="blank-result" id="blank-result"></div>
      </div>
      <div class="blank-foot">
        <div></div>
        <button class="btn-primary" id="blank-check" data-action="checkBlank">✓ Check Answer</button>
      </div>
    </div>`;
  setTimeout(()=>{const i=$id('blank-inp');if(i)i.focus()},220);
}

function checkBlank(){
  const inp=$id('blank-inp'),res=$id('blank-result');if(!inp||!res)return;
  const val=norm(inp.value);
  const b=blanks[blIdx];
  let ok=false;
  if(b.partial)ok=b.ans.some(a=>val.includes(norm(a).split(' ')[0])||norm(a).includes(val.split(' ')[0]));
  else ok=b.ans.some(a=>norm(a)===val);
  res.className='blank-result '+(ok?'ok':'bad');
  res.textContent=ok?'✅ Correct! "'+b.ans[0]+'" is right.':'❌ Answer: "'+b.ans[0]+'"';
  inp.disabled=true;
  const btn=$id('blank-check');
  if(btn){
    btn.textContent=blIdx+1<blanks.length?'Next →':'See Summary';
    btn.onclick=()=>{blIdx++;renderBlankQ()};
  }
}

function updMastered(){renderBatchGrid()}

/* ══ NAV ══ */
function goBack(){
  curBatch=null;
  const tb=$id('tb-batch');if(tb)tb.style.display='none';
  if($id('tb-mod'))$id('tb-mod').textContent='Study Guide';
  const bnav=$id('bnav');if(bnav)bnav.style.display='none';
  renderBatchGrid();showScreen('screen-batches');
}

/* ══ HELPER WRAPPERS (for data-action delegation) ══ */
function replayFlash(){fcIdx=0;fcRes=[];renderFC()}
function resetBlanks(){blanks=buildBlanks(curBatch.projects);blIdx=0;renderBlankQ()}

/* ══ EVENT DELEGATION (CSP-safe — replaces all inline onclick handlers) ══ */
document.body.addEventListener('click',function(e){
  const el=e.target.closest('[data-action]');
  if(!el)return;
  const a=el.dataset.action;
  if(!a)return;
  if(a==='openBatch')openBatch(el.dataset.id);
  else if(a==='switchSection')switchSection(el.dataset.section);
  else if(a==='goBack')goBack();
  else if(a==='selStudyProj')selStudyProj(+el.dataset.idx);
  else if(a==='selFlashProj')selFlashProj(+el.dataset.idx);
  else if(a==='replayFlash')replayFlash();
  else if(a==='flipFC')flipFC();
  else if(a==='fcNext')fcNext(el.dataset.knew==='true');
  else if(a==='answerQ')answerQ(+el.dataset.i);
  else if(a==='nextQ')nextQ();
  else if(a==='selMatch')selMatch(el.dataset.id);
  else if(a==='checkBlank')checkBlank();
  else if(a==='resetBlanks')resetBlanks();
  else if(a==='retryQuiz')retryQuiz();
  else if(a==='closeScore')closeScore();
  else if(a==='handleSignOut')handleSignOut();
  else if(a==='closeScoreOv'&&e.target===el)closeScore();
});

/* ══ KEYBOARD ══ */
document.addEventListener('keydown',e=>{
  if(e.target.id==='blank-inp'&&e.key==='Enter'){checkBlank();return;}
  if(e.target.tagName==='INPUT')return;
  /* Activate data-action on non-button/anchor elements (e.g. batch cards, sign-out div) */
  if((e.key==='Enter'||e.key===' ')&&e.target.dataset.action&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='A'){
    e.preventDefault();e.target.click();return;
  }
  if(e.key==='ArrowRight'&&curSection==='flash')fcNext(true);
  if(e.key==='ArrowLeft'&&curSection==='flash')fcNext(false);
  if((e.key===' '||e.key==='Enter')&&curSection==='flash'){e.preventDefault();flipFC()}
  if(e.key==='Escape'){closeScore();return}
});
window.addEventListener('resize',()=>{if(curSection)updNavPill(curSection)});


