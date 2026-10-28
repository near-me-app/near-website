(()=>{'use strict';
const footer=document.querySelector('.site-footer.nf');if(!footer)return;
const cta=footer.querySelector('.nf-cta'),mark=footer.querySelector('.nf-mark');

// The wordmark's pixels rise in column by column the first time it scrolls into view.
const rects=[...mark.querySelectorAll('rect')];
rects.forEach(r=>{r.style.transitionDelay=(+r.getAttribute('x')*28+ +r.getAttribute('y')*18)+'ms'});
if(window.NearMotion)NearMotion.onView(mark,()=>mark.classList.add('is-in'),'0px 0px -5% 0px');else mark.classList.add('is-in');

// Headline halves start apart and meet as the CTA scrolls up.
if(!window.gsap||!window.ScrollTrigger||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
gsap.registerPlugin(ScrollTrigger);
const easeOut=t=>1-Math.pow(1-t,3);
const track=self=>cta.style.setProperty('--conv',easeOut(Math.min(1,self.progress/.85)).toFixed(4));
ScrollTrigger.create({trigger:cta,start:'top 95%',end:'top 25%',onUpdate:track,onRefresh:track});
})();
