(()=>{'use strict';
const screens=[...document.querySelectorAll('.screen')],tabs=[...document.querySelectorAll('[data-view]')];
let currentScreen=0;
function showScreen(index){currentScreen=index;screens.forEach((screen,i)=>{screen.hidden=i!==index});tabs.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.view)===index)))}
const popup=document.querySelector('.pin-preview');let lastPin=null;
document.querySelectorAll('.pin').forEach(pin=>{pin.setAttribute('aria-expanded','false');pin.addEventListener('click',()=>{
 if(pin.closest('.phone')){showScreen(1);return}
 if(lastPin)lastPin.setAttribute('aria-expanded','false');lastPin=pin;pin.setAttribute('aria-expanded','true');
 popup.querySelector('strong').textContent=pin.dataset.plan;
 popup.querySelector('img').src=pin.querySelector('img').src;
 popup.hidden=false;
})});
function closePopup(){popup.hidden=true;if(lastPin){lastPin.setAttribute('aria-expanded','false');lastPin.focus()}}
popup.querySelector('.close-preview').addEventListener('click',closePopup);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!popup.hidden)closePopup()});
const sections=[...document.querySelectorAll('[data-screen]')],feature=document.getElementById('features');
if(window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-height: 600px)',()=>{
  feature.classList.add('has-story');let active=-1;
  function render(p){const next=Math.min(2,Math.floor(p*3));if(next===active)return;active=next;showScreen(next);sections.forEach((section,i)=>{section.classList.toggle('is-active',i===next);section.inert=i!==next;section.setAttribute('aria-hidden',String(i!==next))});gsap.fromTo(screens[next],{y:next===1?48:16,opacity:0},{y:0,opacity:1,duration:.4,ease:'power2.out',overwrite:true});}
  const trigger=ScrollTrigger.create({trigger:feature,start:'top 64px',end:'bottom bottom',onUpdate:self=>render(self.progress),onRefresh:self=>render(self.progress)});render(trigger.progress);
  return()=>{trigger.kill();feature.classList.remove('has-story');sections.forEach(section=>{section.inert=false;section.removeAttribute('aria-hidden');section.classList.remove('is-active')});screens.forEach(screen=>{screen.hidden=false;gsap.set(screen,{clearProps:'all'})});};
 });
 const community=document.querySelector('.community-visual');
 gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
  const members=community.querySelectorAll('.member');
  const tween=gsap.fromTo(members,{x:i=>(i%2?1:-1)*55,y:i=>i<2?-50:50,opacity:.3},{x:0,y:0,opacity:1,ease:'none',scrollTrigger:{trigger:community,start:'top bottom',end:'center center',scrub:true}});
  return()=>{tween.scrollTrigger.kill();tween.kill();gsap.set(members,{clearProps:'all'})};
 });
}
if(!feature.classList.contains('has-story'))screens.forEach(screen=>screen.hidden=false);
const film=document.querySelector('video');
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)film.pause()},{threshold:.05}).observe(film);
document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause()});
})();
