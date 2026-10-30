(()=>{'use strict';
const section=document.getElementById('possibilities');
if(!section||!section.classList.contains('ng')||!window.gsap||!window.ScrollTrigger)return;
const stage=section.querySelector('.ng-stage');
const head=section.querySelector('.ns-head');
const note=section.querySelector('.ng-note');
const stream=section.querySelector('.ng-stream');
if(!stage||!head||!note||!stream)return;
const originals=[...stream.querySelectorAll('.ng-card:not([aria-hidden="true"])')];
if(!originals.length)return;
originals.forEach(card=>{
 const copy=card.cloneNode(true);
 copy.setAttribute('aria-hidden','true');
 copy.querySelectorAll('a').forEach(link=>link.tabIndex=-1);
 stream.append(copy);
});
const cards=[...stream.querySelectorAll('.ng-card')];
const uniqueCount=originals.length;
gsap.registerPlugin(ScrollTrigger);

const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const ease=value=>value*value*(3-2*value);
const catmull=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
const period=cards.length;

gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-width: 901px) and (min-height: 600px), (prefers-reduced-motion: no-preference) and (min-height: 700px)',()=>{
 section.classList.add('is-live');
 let layout,travel=0,scrollPhase=0,dragPhase=0,phase=0,velocity=0,fling=0;
 let cursorX=.5,cursorY=.5,cursorOffset=0,hasCursor=false,dragging=false,dragId=null;
 let lastX=0,lastMove=0,dragVelocity=0,lastInput=performance.now(),lastFrame=0;
 let visible=false,frame=0,hovered=null,focused=null,outlined=null;

 const orbitMarkup='<span class="ng-orbit" aria-hidden="true"><svg viewBox="0 0 320 500" preserveAspectRatio="none"><path pathLength="1000" d="M34 7C18 6 8 17 8 40c1 62-2 139-1 215 2 82-2 165 3 207 2 20 15 30 37 31 73 2 160-2 229 0 24 0 35-12 36-36 2-73-2-176 0-260 1-66 2-127-3-160-3-21-16-30-40-30C196 8 104 5 34 7Z"/><path pathLength="1000" d="M38 13c-16-1-24 10-24 29 2 77-1 156 1 221 2 83-2 150 2 197 2 18 12 26 32 27 73 2 155-2 225 0 22 0 31-10 32-33 2-84-2-172 0-254 1-65 1-129-3-162-2-18-13-25-35-25-76 2-158-1-230 0Z"/></svg></span>';
 cards.forEach(card=>card.insertAdjacentHTML('beforeend',orbitMarkup));

 function measure(){
  const rect=stage.getBoundingClientRect();
  const w=stage.clientWidth,h=stage.clientHeight,mobile=w<=900;
  const headRect=head.getBoundingClientRect(),noteRect=note.getBoundingClientRect();
  const copyRight=Math.max(headRect.right,noteRect.right)-rect.left+22;
  const copyBottom=Math.max(headRect.bottom,noteRect.bottom)-rect.top+22;
  section.style.setProperty('--ng-w','300px');
  const ratio=cards[0].offsetHeight/300;
  const room=mobile?h-copyBottom-30:h-52;
  let W=mobile
   ?Math.min(w*.72,320,room/(ratio*1.12))
   :Math.min(w*.31,380,room/(ratio*1.12));
  W=Math.max(mobile?180:280,W);
  section.style.setProperty('--ng-w',`${W}px`);
  let H=cards[0].offsetHeight;
  if(H*1.12>room){
   W*=room/(H*1.12);
   section.style.setProperty('--ng-w',`${W}px`);
   H=cards[0].offsetHeight;
  }
  const projectedH=H*1.12;
  const focusX=mobile
   ?w*.59
   :Math.min(w+W*.08,Math.max(w*.66,copyRight+W*.58+24));
  const focusY=mobile
   ?clamp(Math.max(h*.64,copyBottom+projectedH/2+12),projectedH/2+12,h-projectedH/2-12)
   :h*.47;
  travel=uniqueCount*clamp(w*.65,340,520);
  section.style.setProperty('--ng-travel',`${travel}px`);
  const anchors=[
   {x:-W*1.3,y:h+H*.85,scale:.27,z:-570,rotateY:62,rotateX:-16,rotateZ:-23},
   {x:-W*.75,y:h+H*.55,scale:.36,z:-510,rotateY:57,rotateX:-15,rotateZ:-21},
   {x:w*.42,y:h-H*.2,scale:.73,z:-280,rotateY:30,rotateX:-9,rotateZ:-12},
   {x:focusX,y:focusY,scale:1,z:55,rotateY:0,rotateX:0,rotateZ:-2},
   {x:w-W*.33,y:mobile?copyBottom+H*.4:h*.32,scale:.76,z:-270,rotateY:-26,rotateX:8,rotateZ:10},
   {x:w+W*.85,y:-H*.5,scale:.36,z:-510,rotateY:-57,rotateX:15,rotateZ:20},
   {x:w+W*1.4,y:-H*.9,scale:.27,z:-570,rotateY:-62,rotateX:16,rotateZ:23}
  ];
  layout={w,h,W,H,mobile,copyRight,copyBottom,focusX,focusY,lightX:w*.22,lightY:h*.13,anchors};
  render(phase);
 }

 function relative(index,position){
  return ((index-position+period*1.5)%period+period)%period-period/2;
 }

 function place(index,position){
  const card=cards[index];
  const u=relative(index,position);
  if(u>2.35||u< -2.35){
   card.style.visibility='hidden';card.style.pointerEvents='none';
   card.classList.remove('is-focused');
   return null;
  }
  const {w,h,W,H,copyRight,copyBottom,lightX,lightY,anchors}=layout;
  const left=Math.floor(u),t=u-left;
  const anchor=n=>anchors[Math.max(0,Math.min(6,n+3))];
  const value=key=>catmull(anchor(left-1)[key],anchor(left)[key],anchor(left+1)[key],anchor(left+2)[key],t);
  let x=value('x'),y=value('y'),scale=value('scale'),z=value('z');
  let rotateY=value('rotateY'),rotateX=value('rotateX'),rotateZ=value('rotateZ');
  const opacity=ease(clamp((2.35-Math.abs(u))/.45));
  const projected=scale*1100/(1100-z);
  const halfWidth=W*projected*(.52+Math.abs(rotateZ)*.004);
  const halfHeight=H*projected*(.52+Math.abs(rotateZ)*.002);
  const intrusion=copyRight+halfWidth-x;
  if(intrusion>0){
   const clearance=ease(clamp(intrusion/Math.max(72,halfWidth*.8)));
   y+=Math.max(0,copyBottom+halfHeight+8-y)*clearance;
  }
  const focusWeight=clamp(1-Math.abs(u)/1.1);
  rotateX+=(cursorY-.5)*-2*focusWeight;
  rotateY+=(cursorX-.5)*3*focusWeight;
  card.style.visibility='visible';
  card.style.pointerEvents='auto';
  card.style.opacity=opacity.toFixed(3);
  card.style.zIndex=String(Math.round(1000+z));
  card.style.transform=`translate3d(${(x-W/2).toFixed(1)}px,${(y-H/2).toFixed(1)}px,0) perspective(1100px) translateZ(${z.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) rotateX(${rotateX.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  const shineX=clamp(50+(lightX-x)/w*72+rotateY*.42,3,97);
  const shineY=clamp(28+(lightY-y)/h*34,3,82);
  card.style.setProperty('--ng-shine-x',`${shineX.toFixed(0)}%`);
  card.style.setProperty('--ng-shine-y',`${shineY.toFixed(0)}%`);
  card.classList.toggle('is-focused',Math.abs(u)<.5);
  return Math.abs(u)<.5?card:null;
 }

 function updateOutline(){
  const next=hovered===focused?hovered:null;
  if(next===outlined)return;
  outlined?.classList.remove('is-hovered');
  outlined=next;
  outlined?.classList.add('is-hovered');
 }

 function render(position){
  if(!layout)return;
  let nextFocus=null;
  cards.forEach((card,index)=>{nextFocus=place(index,position)||nextFocus});
  focused=nextFocus;
  updateOutline();
 }

 function wake(){if(visible&&!frame)frame=requestAnimationFrame(tick)}
 function tick(now){
  frame=0;
  const dt=clamp((now-(lastFrame||now))/16.67,.5,2);lastFrame=now;
  if(!dragging&&Math.abs(fling)>.0001){
   dragPhase+=fling*dt;fling*=Math.pow(.87,dt);lastInput=now;
  }
  const base=scrollPhase+dragPhase;
  const cursorPhase=hasCursor?(cursorX-.5)*.45:0;
  cursorOffset+=(cursorPhase-cursorOffset)*clamp(.08*dt);
  const raw=base+cursorOffset;
  const settle=dragging?0:ease(clamp((now-lastInput-300)/400));
  const target=raw+(Math.round(raw)-raw)*settle;
  velocity=(velocity+(target-phase)*.055*dt)*Math.pow(.6,dt);
  phase+=velocity*dt;
  if(Math.abs(target-phase)<.0002&&Math.abs(velocity)<.0002){phase=target;velocity=0}
  render(phase);
  if(visible)frame=requestAnimationFrame(tick);
 }

 function onPointerMove(event){
  if(!layout)return;
  const rect=stage.getBoundingClientRect();
  if(event.pointerType!=='touch'&&hovered!==focused){
   cursorX=clamp((event.clientX-rect.left)/layout.w);
   cursorY=clamp((event.clientY-rect.top)/layout.h);
   hasCursor=true;lastInput=performance.now();
  }
  if(dragging&&event.pointerId===dragId){
   const now=performance.now(),dt=Math.max(8,now-lastMove);
   const step=-(event.clientX-lastX)/layout.w*3.1;
   dragPhase+=step;
   dragVelocity=dragVelocity*.55+(step*16.67/dt)*.45;
   lastX=event.clientX;lastMove=now;lastInput=now;
  }
  wake();
 }
 function onPointerDown(event){
  if(event.pointerType==='mouse'&&event.button!==0)return;
  if(event.target.closest('a'))return;
  dragging=true;dragId=event.pointerId;lastX=event.clientX;
  lastMove=lastInput=performance.now();dragVelocity=0;fling=0;
  stage.setPointerCapture(event.pointerId);
  section.classList.add('is-dragging');wake();
 }
 function onPointerUp(event){
  if(!dragging||event.pointerId!==dragId)return;
  dragging=false;dragId=null;fling=clamp(dragVelocity*3,-.11,.11);
  section.classList.remove('is-dragging');lastInput=performance.now();wake();
 }
 function onPointerLeave(){hasCursor=false;hovered=null;updateOutline();wake()}
 function onCardEnter(event){hovered=event.currentTarget;wake()}
 function onCardLeave(event){if(hovered===event.currentTarget)hovered=null;updateOutline()}

  measure();render(0);
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible)wake();else{cancelAnimationFrame(frame);frame=0;lastFrame=0}
  },{rootMargin:'100px'});
  observer.observe(section);
  const trigger=ScrollTrigger.create({
   trigger:section,start:'top 64px',end:()=>`+=${travel}`,
   onRefreshInit:measure,
   onRefresh:self=>{scrollPhase=self.progress*uniqueCount;render(phase)},
   onUpdate:self=>{scrollPhase=self.progress*uniqueCount;lastInput=performance.now();wake()}
  });
  stage.addEventListener('pointermove',onPointerMove);
  stage.addEventListener('pointerdown',onPointerDown);
  stage.addEventListener('pointerup',onPointerUp);
  stage.addEventListener('pointercancel',onPointerUp);
  stage.addEventListener('pointerleave',onPointerLeave);
  cards.forEach(card=>{
   card.addEventListener('pointerenter',onCardEnter);
   card.addEventListener('pointerleave',onCardLeave);
  });
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
  return()=>{
   trigger.kill();observer.disconnect();cancelAnimationFrame(frame);
   stage.removeEventListener('pointermove',onPointerMove);
   stage.removeEventListener('pointerdown',onPointerDown);
   stage.removeEventListener('pointerup',onPointerUp);
   stage.removeEventListener('pointercancel',onPointerUp);
   stage.removeEventListener('pointerleave',onPointerLeave);
   cards.forEach(card=>{
    card.removeEventListener('pointerenter',onCardEnter);
    card.removeEventListener('pointerleave',onCardLeave);
    card.classList.remove('is-focused','is-hovered');
    card.querySelector('.ng-orbit')?.remove();
    ['transform','visibility','pointer-events','opacity','z-index','--ng-shine-x','--ng-shine-y'].forEach(name=>card.style.removeProperty(name));
   });
   section.classList.remove('is-live','is-dragging');
   section.style.removeProperty('--ng-w');section.style.removeProperty('--ng-travel');
  };
});
})();
