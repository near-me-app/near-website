(()=>{'use strict';
const hero=document.getElementById('hero'),apps=hero&&hero.querySelector('.hero-apps');
if(!apps||(window.NearMotion&&NearMotion.reduced))return;
const fine=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
// Phones lean toward the pointer; eased so the motion trails the hand.
let tx=0,ty=0,x=0,y=0,raf=0;
function tick(){
 x+=(tx-x)*.08;y+=(ty-y)*.08;
 apps.style.setProperty('--hx',x.toFixed(3));apps.style.setProperty('--hy',y.toFixed(3));
 raf=Math.abs(tx-x)+Math.abs(ty-y)>.002?requestAnimationFrame(tick):0;
}
function aim(e){const r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*2-1;ty=(e.clientY-r.top)/r.height*2-1;if(!raf)raf=requestAnimationFrame(tick)}
function rest(){tx=0;ty=0;if(!raf)raf=requestAnimationFrame(tick)}
function sync(){
 apps.classList.toggle('is-tilting',fine.matches);
 if(fine.matches){hero.addEventListener('pointermove',aim);hero.addEventListener('pointerleave',rest)}
 else{hero.removeEventListener('pointermove',aim);hero.removeEventListener('pointerleave',rest);rest()}
}
fine.addEventListener('change',sync);sync();
})();
