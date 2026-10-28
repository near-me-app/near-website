(()=>{'use strict';
const feature=document.getElementById('features');if(!feature)return;
const stage=feature.querySelector('.story-stage'),articles=[...feature.querySelectorAll('[data-screen]')],screens=[...feature.querySelectorAll('.screen')];
const phone=feature.querySelector('.phone'),count=feature.querySelector('.fm-hud>span:last-child b'),marks=[...feature.querySelectorAll('.fm-progress b')];
const rows=articles.map(a=>[...a.querySelectorAll('.fm-ride')]),rules=articles.map(a=>[...a.querySelectorAll('.fm-row')]);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-t,3);
const N=articles.length;

if(!window.gsap||!window.ScrollTrigger){screens.forEach(s=>s.hidden=false);return}
gsap.registerPlugin(ScrollTrigger);
const media=gsap.matchMedia();
media.add('(prefers-reduced-motion: no-preference) and (min-height: 600px)',()=>{
 feature.classList.add('has-story','fm-live');
 let active=-1,span=0;
 const measure=()=>{span=Math.min(innerWidth*.45,520)};

 // Organic top edge: a wave that flattens as the screen finishes rising.
 function wave(w,seed){
  if(w>=1)return 'none';if(w<=0)return 'inset(100% 0 0 0)';
  const base=(1-w)*100,amp=7*Math.sin(Math.PI*w),pts=[];
  for(let i=0;i<=20;i++){const x=i*5;pts.push(`${x}% ${clamp(base+amp*Math.sin(x/100*Math.PI*2.2+seed+w*4)-amp*.4,0,100).toFixed(2)}%`)}
  return `polygon(${pts.join(',')},100% 100%,0 100%)`;
 }

 function render(p){
  // While the gallery hands off into this section, the first third is its arrival.
  const j=feature.classList.contains('gallery-handoff-target')?Math.max(0,(p-.33)/.67):p;
  const pos=j*N,current=Math.min(N-1,Math.floor(pos));
  articles.forEach((a,i)=>{
   const t=pos-i,enter=i===0?1:ease(clamp((t+.1)/.38)),exit=i===N-1?0:ease(clamp((t-.76)/.3));
   const seen=enter>0&&exit<1;
   a.style.setProperty('--fm-vis',seen?'visible':'hidden');
   a.style.setProperty('--fm-o',(clamp(enter*1.8)*clamp((1-exit)*1.8)).toFixed(3));
   a.style.setProperty('--fm-p',((i===0?1:out(clamp((t-.05)/.25)))*(1-exit)).toFixed(3));
   const off=(1-enter)-exit;
   rows[i].forEach((r,k)=>{r.style.transform=`translate3d(${((k%2?1:-1)*off*span).toFixed(1)}px,0,0)`});
   rules[i].forEach(r=>r.style.setProperty('--fm-rule',(enter*(1-exit)).toFixed(3)));
  });
  // Screens: the next one rises over the current one across each chapter boundary.
  screens.forEach((s,i)=>{
   const w=i===0?1:clamp((pos-i+.22)/.44),covered=i===N-1?0:clamp((pos-i-.78)/.44);
   s.style.clipPath=wave(w,i*1.7);s.style.zIndex=i+1;
   s.firstElementChild.style.transform=`scale(${(1+.08*(1-w)-.05*covered).toFixed(4)})`;
   s.style.filter=covered>0?`brightness(${(1-.45*covered).toFixed(3)})`:'';
  });
  phone.style.transform=`rotateY(${(-9+18*j).toFixed(2)}deg) rotateX(${(4-8*j).toFixed(2)}deg) translate3d(0,${((.5-j)*28).toFixed(1)}px,0)`;
  feature.style.setProperty('--fm-progress',j.toFixed(4));
  if(current!==active){
   active=current;count.textContent=String(active+1).padStart(2,'0');
   marks.forEach((m,i)=>m.classList.toggle('is-on',i<=active));
   articles.forEach((a,i)=>{a.classList.toggle('is-active',i===active);a.inert=i!==active;a.setAttribute('aria-hidden',String(i!==active))});
  }
 }
 measure();
 const trigger=ScrollTrigger.create({trigger:feature,start:'top 64px',end:'bottom bottom',onUpdate:self=>render(self.progress),onRefresh:self=>{measure();render(self.progress)}});
 render(trigger.progress);
 return()=>{trigger.kill();feature.classList.remove('has-story','fm-live');feature.style.removeProperty('--fm-progress');
  [phone,...screens,...screens.map(s=>s.firstElementChild),...rows.flat()].forEach(el=>el.removeAttribute('style'));
  articles.forEach(a=>{a.removeAttribute('style');a.inert=false;a.removeAttribute('aria-hidden');a.classList.remove('is-active')});
  rules.flat().forEach(r=>r.removeAttribute('style'));screens.forEach(s=>s.hidden=false);};
});
if(!feature.classList.contains('fm-live'))screens.forEach(s=>s.hidden=false);
})();
