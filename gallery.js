(()=>{'use strict';
const section=document.getElementById('possibilities');if(!section||!section.classList.contains('ng'))return;
const stage=section.querySelector('.ng-stage'),head=section.querySelector('.ns-head'),cards=[...section.querySelectorAll('.ng-card')];
if(!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;

gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-height: 560px)',()=>{
 section.classList.add('is-live');
 // Depth model, face-on (no tilt, so every ticket stays readable): slot u=0 is the nearest card, u=1 the farthest. Equal steps in depth shrink on screen
 // the way a real row of posters does, all converging on a vanishing point up and to the right.
 const F=900,ZMAX=2600,GAP=.19,VISIBLE=1.02;
 let w=0,h=0,W=0,H=0,V={x:0,y:0},N={x:0,y:0},travel=0,target=0,current=0,raf=0;
 const follow=window.NearMotion&&NearMotion.smooth?1:.14;

 function measure(){
  w=stage.clientWidth;h=stage.clientHeight;
  const mobile=w<=900,base=stage.getBoundingClientRect(),hb=head.getBoundingClientRect();
  // Tickets keep their proportions at any width, so measure the ratio once at a reference width.
  section.style.setProperty('--ng-w','300px');const ratio=cards[0].offsetHeight/300;
  if(mobile){
   const room=section.querySelector('.ng-note').getBoundingClientRect().bottom-base.top;
   W=Math.min(w*.62,260,(h-room-36)/ratio);H=W*ratio;
   V={x:w*.84,y:room+24+H*.15};N={x:w/2,y:h-H/2-18};
  }else{
   const copyRight=hb.right-base.left;
   W=Math.min(w*.24,(h-80)/ratio,330);H=W*ratio;
   // Keep the nearest card's left edge well clear of the copy column.
   const nx=Math.max(w*.58,copyRight+W*.5+w*.08);
   V={x:w*.88,y:h*.2};N={x:Math.min(nx,w-W*.6),y:h-H/2-30};
  }
  section.style.setProperty('--ng-w',W+'px');
  travel=(cards.length-Math.ceil(VISIBLE/GAP))*GAP;
 }

 function place(card,u){
  let x,y,s,o;
  if(u>=0){
   const z=u*ZMAX;s=F/(F+z);x=V.x+(N.x-V.x)*s;y=V.y+(N.y-V.y)*s;
   o=clamp((VISIBLE+.06-u)/.12);
  }else{
   // Past the nearest slot: drop straight out of frame while opaque, so it never ghosts under the next card.
   const k=-u;s=1+k*.25;x=N.x+(N.x-V.x)*k*.4;y=N.y+h*k*6;o=clamp(1-(k-.12)/.1);
  }
  card.style.opacity=o.toFixed(3);
  card.style.visibility=o<=.001?'hidden':'visible';
  card.style.zIndex=String(1000-Math.round(u*500));
  card.style.transform=`translate3d(${(x-W/2).toFixed(1)}px,${(y-H/2).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
 }

 function render(p){
  const shift=p*travel;
  cards.forEach((c,i)=>place(c,i*GAP-shift));
 }
 function tick(){
  current+=(target-current)*follow;
  if(Math.abs(target-current)<.0004){current=target;raf=0}else raf=requestAnimationFrame(tick);
  render(current);
 }

 const trigger=ScrollTrigger.create({trigger:section,start:'top 64px',end:'bottom bottom',
  onUpdate:self=>{target=self.progress;if(!raf)raf=requestAnimationFrame(tick)},
  onRefresh:self=>{measure();target=current=self.progress;render(current)}});
 document.fonts.ready.then(()=>ScrollTrigger.refresh());

 return()=>{trigger.kill();cancelAnimationFrame(raf);raf=0;section.classList.remove('is-live');section.style.removeProperty('--ng-w');
  cards.forEach(c=>{c.style.removeProperty('transform');c.style.removeProperty('opacity');c.style.removeProperty('visibility');c.style.removeProperty('z-index')})};
});
})();
