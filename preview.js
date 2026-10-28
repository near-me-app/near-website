(()=>{'use strict';
const screens=[...document.querySelectorAll('.screen')],tabs=[...document.querySelectorAll('[data-view]')];
let currentScreen=0;
function showScreen(index){currentScreen=index;screens.forEach((screen,i)=>{screen.hidden=i!==index});tabs.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.view)===index)))}
const deck=document.querySelector('.hero-plan-deck'),card=deck.querySelector('.hero-plan'),timer=card.querySelector('.hero-plan-timer'),status=deck.querySelector('.hero-plan-status');
const heroPins=[...document.querySelectorAll('#hero .map .pin')];
const calm=window.matchMedia('(prefers-reduced-motion: reduce)');
let activePlan=0,dealing=null;
function fillCard(pin){
 const label=pin.querySelector('.pin-label').textContent.trim(),live=/live/i.test(label);
 card.querySelector('img').src=pin.querySelector('img').src;
 const disc=getComputedStyle(pin.querySelector('.disc'));
 card.style.setProperty('--hero-icon-bg',disc.backgroundImage!=='none'?disc.backgroundImage:disc.backgroundColor);
 card.querySelector('strong').textContent=pin.dataset.plan;
 card.querySelector('small').textContent=pin.dataset.line;
 card.querySelector('.hero-plan-meta').textContent=(live?'Live now':'Starts in '+label)+' · '+pin.dataset.going+(live?' there':' going');
 card.classList.toggle('is-live',live);
}
function restartTimer(){timer.style.animation='none';void timer.offsetWidth;timer.style.animation=''}
function showPlan(index,announce){
 index=(index+heroPins.length)%heroPins.length;
 heroPins.forEach((pin,i)=>{pin.classList.toggle('is-active',i===index);pin.setAttribute('aria-pressed',String(i===index))});
 const pin=heroPins[index];activePlan=index;
 if(announce)status.textContent=pin.dataset.plan+', '+pin.dataset.line;
 if(dealing)dealing.cancel();
 if(calm.matches||!card.animate){fillCard(pin);restartTimer();return}
 // Front ticket slips to the back of the deck, the next one is dealt forward.
 dealing=card.animate([{transform:'none',opacity:1},{transform:'translate(18px,-16px) rotate(5deg) scale(.94)',opacity:0}],{duration:240,easing:'cubic-bezier(.4,0,1,1)'});
 dealing.onfinish=()=>{fillCard(pin);restartTimer();dealing=card.animate([{transform:'translate(-10px,26px) rotate(-4deg) scale(.96)',opacity:0},{transform:'none',opacity:1}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'});dealing.onfinish=()=>{dealing=null}};
}
timer.addEventListener('animationend',()=>showPlan(activePlan+1,false));
heroPins.forEach((pin,i)=>pin.addEventListener('click',()=>{
 // Small screens hide the deck, so a pin goes straight to the plans gallery.
 if(!deck.offsetParent){document.getElementById('possibilities').scrollIntoView({behavior:calm.matches?'auto':'smooth'});return}
 if(i!==activePlan)showPlan(i,true);else restartTimer();
}));
document.querySelectorAll('.phone .pin').forEach(pin=>pin.addEventListener('click',()=>showScreen(1)));
heroPins.forEach((pin,i)=>{pin.setAttribute('aria-pressed',String(i===0));pin.classList.toggle('is-active',i===0)});
fillCard(heroPins[0]);
// The #features phone story is driven by features-motion.js.
// The film plays only on request; film.js owns it.
})();
