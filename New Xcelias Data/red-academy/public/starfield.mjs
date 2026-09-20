const canvas=document.createElement('canvas');
canvas.className='starfield';
canvas.setAttribute('aria-hidden','true');
document.body.prepend(canvas);

const context=canvas.getContext('2d',{alpha:true});
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let width=0,height=0,ratio=1,last=performance.now(),stars=[];

const between=(min,max)=>min+Math.random()*(max-min);
function makeStar(index,count){
 const band=index<count*.72?'far':index<count*.94?'mid':'near';
 const speed=band==='far'?between(.00008,.00028):band==='mid'?between(.00014,.0005):between(.00022,.00082);
 const direction=between(0,Math.PI*2);
 return {band,x:between(0,width),y:between(0,height),radius:band==='far'?between(.28,.7):band==='mid'?between(.42,1):between(.7,1.35),speed,dx:Math.cos(direction)*speed,dy:Math.sin(direction)*speed,alpha:band==='far'?between(.16,.36):band==='mid'?between(.2,.48):between(.28,.62),phase:between(0,Math.PI*2),accent:index%17===0?1:index%29===0?2:0};
}
function resize(){
 ratio=Math.min(window.devicePixelRatio||1,2);width=window.innerWidth;height=window.innerHeight;
 canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;context.setTransform(ratio,0,0,ratio,0,0);
 const count=Math.max(95,Math.min(240,Math.round(width*height/7000)));stars=Array.from({length:count},(_,index)=>makeStar(index,count));
}
function colour(star,light,alpha){
 if(light){const palette=star.accent===1?[106,57,76]:star.accent===2?[65,84,111]:[44,57,76];return `rgba(${palette[0]},${palette[1]},${palette[2]},${alpha})`;}
 const palette=star.accent===1?[243,135,145]:star.accent===2?[242,205,157]:[231,237,255];return `rgba(${palette[0]},${palette[1]},${palette[2]},${alpha})`;
}
function draw(now){
 const delta=Math.min(now-last,50);last=now;const light=document.body.classList.contains('light');context.clearRect(0,0,width,height);context.globalCompositeOperation=light?'multiply':'screen';
 for(const star of stars){
  if(!reducedMotion.matches){star.x+=star.dx*delta;star.y+=star.dy*delta;if(star.x<-3)star.x=width+3;if(star.x>width+3)star.x=-3;if(star.y<-3)star.y=height+3;if(star.y>height+3)star.y=-3;}
  const shimmer=reducedMotion.matches?1:.93+Math.sin(now*.00022+star.phase)*.07;
  const alpha=star.alpha*shimmer*(light&&star.band==='far'?.72:1);context.fillStyle=colour(star,light,alpha);context.beginPath();context.arc(star.x,star.y,star.radius,0,Math.PI*2);context.fill();
 }
 context.globalCompositeOperation='source-over';requestAnimationFrame(draw);
}
window.addEventListener('resize',resize,{passive:true});
reducedMotion.addEventListener?.('change',()=>{last=performance.now();});
resize();draw(performance.now());
