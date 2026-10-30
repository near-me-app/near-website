(()=>{'use strict';
const section=document.querySelector('.aura-moments');if(!section)return;
const stage=section.querySelector('.am-stage'),track=section.querySelector('.am-track'),cards=[...section.querySelectorAll('.am-card')];
const headline=section.querySelector('.am-headline'),yards=[...section.querySelectorAll('.am-yard')],ruler=section.querySelector('.am-ruler');
const countNum=section.querySelector('.am-count b'),countName=section.querySelector('.am-count span'),hint=section.querySelector('.am-hint');
const quote=section.querySelector('.am-quote'),lines=[...quote.querySelectorAll('h3 span')],canvas=section.querySelector('.am-dots'),ctx=canvas.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const easeInOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,easeOut=t=>1-Math.pow(1-t,3);

// Pointer tilt and glare, for fine pointers only.
if(matchMedia('(hover: hover) and (pointer: fine)').matches)cards.forEach(card=>{
 card.addEventListener('pointermove',e=>{const r=card.querySelector('.am-frame').getBoundingClientRect();card.style.setProperty('--px',((e.clientX-r.left)/r.width*2-1).toFixed(3));card.style.setProperty('--py',((e.clientY-r.top)/r.height*2-1).toFixed(3))});
 card.addEventListener('pointerleave',()=>{card.style.setProperty('--px',0);card.style.setProperty('--py',0)});
});

if(!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-height: 560px)',()=>{
 section.classList.add('is-live');
 const tones=cards.map(c=>c.dataset.tone),names=cards.map(c=>c.dataset.name),tilts=[-4,3,-2.5,4,-3.5,2.5,-3,2];
 const dpr=Math.min(2,window.devicePixelRatio||1),SPLIT=.7;
 let vw=0,vh=0,cardW=0,gap=0,startX=0,endX=0,lefts=[],dots=[],dotR=0,active=-1,target=0,current=0,raf=0,lastFrame=0,lastDotPhase=0;

 function measure(){
  vw=stage.clientWidth;vh=stage.clientHeight;cardW=cards[0].offsetWidth;
  const mobile=vw<=900;
  gap=mobile?Math.max(cardW*1.18,vw*.7):Math.max(cardW*1.42,vw*.25);
  lefts=cards.map((c,i)=>i*gap);
  cards.forEach((c,i)=>{c.style.left=lefts[i]+'px'});
  yards.forEach((y,i)=>{y.style.left=(lefts[i]+cardW/2)+'px'});
  ruler.style.left=-vw+'px';ruler.style.width=(lefts[lefts.length-1]+vw*3)+'px';
  startX=mobile?(vw-cardW)/2:vw*.08;
  endX=vw/2-cardW/2-lefts[lefts.length-1];
  buildDots();
 }

 // Sample the closing line, laid out by the DOM, onto a grid of dots.
 function buildDots(){
  canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);
  const off=document.createElement('canvas'),o=off.getContext('2d');off.width=vw;off.height=vh;
  const base=stage.getBoundingClientRect(),h3=quote.querySelector('h3'),fs=parseFloat(getComputedStyle(h3).fontSize);
  const prevClip=h3.style.clipPath;h3.style.clipPath='none';
  o.fillStyle='#fff';o.textAlign='center';o.textBaseline='middle';o.font=`400 ${fs}px Anton, sans-serif`;
  lines.forEach(line=>{const r=line.getBoundingClientRect();o.fillText(line.textContent.toUpperCase(),r.left-base.left+r.width/2,r.top-base.top+r.height/2+fs*.04)});
  h3.style.clipPath=prevClip;
  const step=Math.max(5,Math.round(fs/10)),data=o.getImageData(0,0,vw,vh).data;
  let minX=vw,maxX=0;dots=[];dotR=step*.34;
  for(let y=step/2;y<vh;y+=step)for(let x=step/2;x<vw;x+=step){
   if(data[(Math.floor(y)*vw+Math.floor(x))*4+3]>110){dots.push({x,y,t:0});if(x<minX)minX=x;if(x>maxX)maxX=x}
  }
  const span=Math.max(1,maxX-minX);
  dots.forEach(d=>{d.t=(d.x-minX)/span*.82+Math.random()*.18});
 }

 function drawDots(b){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,vw,vh);
  if(b<=0)return;
  const sweep=b*1.75,fade=1-clamp((b-.6)/.32)*.92;
  if(fade<=0)return;
  ctx.fillStyle=`rgba(233,223,205,${(.92*fade).toFixed(3)})`;ctx.beginPath();
  for(const d of dots){
   const k=clamp((sweep-d.t)/.22);if(k<=0)continue;
   const r=dotR*easeOut(k),x=d.x+(1-k)*dotR*9;
   ctx.moveTo(x+r,d.y);ctx.arc(x,d.y,r,0,Math.PI*2);
  }
  ctx.fill();
 }

 function render(p){
  const rawA=clamp(p/SPLIT),tail=clamp((rawA-.85)/.15);
  const a=rawA<.85?rawA:.85+.15*(tail+tail*tail-tail*tail*tail);
  const b=clamp((p-SPLIT+.04)/(1-SPLIT+.04));
  const x=lerp(startX,endX,a)-easeInOut(clamp(b/.5))*(vw*1.1);
  track.style.transform=`translate3d(${x.toFixed(1)}px,0,0)`;
  headline.style.transform=`translate3d(${(-(a*.24+b*.12)*vw).toFixed(1)}px,0,0)`;
  headline.style.opacity=(1-b*.8).toFixed(3);
  hint.style.opacity=(1-clamp(p*30)).toFixed(3);
  let nearest=0,best=Infinity;
  cards.forEach((card,i)=>{
   const d=(x+lefts[i]+cardW/2-vw/2)/(vw*.5),ad=Math.min(Math.abs(d),1.5),focus=Math.pow(1-Math.min(ad,1),2);
   if(Math.abs(d)<best){best=Math.abs(d);nearest=i}
   const ry=clamp(-d*20,-28,28),rz=tilts[i%tilts.length]*(.35+.65*Math.min(ad,1)),y=-focus*18+d*10;
   card.style.transform=`translate3d(0,${y.toFixed(1)}px,0) perspective(1100px) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${(1+focus*.12).toFixed(4)})`;
   card.style.setProperty('--sheen',(50-d*60).toFixed(1)+'%');
   card.style.setProperty('--dim',(Math.min(ad,1)*.42).toFixed(3));
   card.style.setProperty('--glow',focus.toFixed(3));
  });
  if(nearest!==active){
   active=nearest;section.style.setProperty('--am-tone',tones[active]);
   countNum.textContent=String(active+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');countName.textContent=names[active];
  }
  const q=clamp((b-.3)/.7),solid=clamp((q-.5)/.4);
  quote.style.setProperty('--wipe',(solid*118).toFixed(1)+'%');
  quote.style.setProperty('--after',clamp((q-.82)/.18).toFixed(3));
  if(q>0||lastDotPhase>0)drawDots(q);
  lastDotPhase=q;
 }

 // A short, frame-rate-independent catch-up keeps cards moving between wheel ticks.
 function tick(now){
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):1/60;
  lastFrame=now;
  current+=(target-current)*(1-Math.exp(-dt/.13));
  if(Math.abs(target-current)<.0003){current=target;raf=0;lastFrame=0}else raf=requestAnimationFrame(tick);
  render(current);
 }
 function kick(){if(!raf)raf=requestAnimationFrame(tick)}

 const trigger=ScrollTrigger.create({trigger:section,start:'top 64px',end:'bottom bottom',
  onUpdate:self=>{target=self.progress;kick()},
  onRefresh:self=>{measure();target=current=self.progress;active=-1;render(current)}});
 document.fonts.ready.then(()=>ScrollTrigger.refresh());

 return()=>{trigger.kill();cancelAnimationFrame(raf);raf=0;section.classList.remove('is-live');ctx.clearRect(0,0,canvas.width,canvas.height);
  [track,headline,hint,quote,...cards,...yards,ruler].forEach(el=>el.removeAttribute('style'));section.style.removeProperty('--am-tone');
  cards.forEach((c,i)=>c.style.cssText=`--tone:${tones[i]};--lift:${c.dataset.lift}`);};
});
})();
