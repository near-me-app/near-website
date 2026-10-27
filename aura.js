(()=>{'use strict';
const section=document.querySelector('.aura-journey'),cards=[...section.querySelectorAll('.aura-card')];
const labels=['Off Radar','Lowkey','NPC','Higher tiers locked'];
const status=document.getElementById('auraStatus'),count=document.getElementById('auraCount');

if(!window.gsap||!window.ScrollTrigger)return;
gsap.registerPlugin(ScrollTrigger);
const media=gsap.matchMedia();
media.add('(prefers-reduced-motion: no-preference) and (min-height: 600px)',()=>{
 section.classList.add('has-flips');let index=-1;
 function render(progress){
  const position=progress*3,active=Math.min(3,Math.floor(position+.5));
  cards.forEach((card,i)=>{
   const delta=position-i,visible=i===active;
   const turn=Math.sign(delta)*Math.min(1,Math.max(0,(Math.abs(delta)-.22)/.28))*90;
   gsap.set(card,{rotationY:-turn,rotationX:Math.abs(turn)*.09,y:Math.abs(turn)*.18,scale:1-Math.abs(turn)*.0006,autoAlpha:visible?1:0});
   card.setAttribute('aria-hidden',String(!visible));
  });
  if(index!==active){index=active;status.textContent=labels[index];count.textContent=String(index+1).padStart(2,'0')+' / 04';section.querySelectorAll('.aura-track span').forEach((step,i)=>{step.classList.toggle('is-reached',i<=index);step.classList.toggle('is-active',i===index)});}
 }
 const trigger=ScrollTrigger.create({trigger:section,start:'top 64px',end:'bottom bottom',onUpdate:self=>render(self.progress),onRefresh:self=>render(self.progress)});
 render(trigger.progress);
 document.fonts.ready.then(()=>ScrollTrigger.refresh());
 return()=>{trigger.kill();section.classList.remove('has-flips');cards.forEach(card=>{gsap.set(card,{clearProps:'all'});card.removeAttribute('aria-hidden')});};
});
})();
