/* Shared motion kit. Loaded after GSAP/ScrollTrigger and before section scripts.
   window.NearMotion = {smooth, reduced, clamp, lerp, ease, scribble(el), onView(el, cb)} */
(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const ease={inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out:t=>1-Math.pow(1-t,3),in:t=>t*t*t};
const NM=window.NearMotion={smooth:null,reduced,clamp,lerp,ease};

// Momentum scroll, driven by GSAP's ticker so ScrollTrigger reads the same frame.
if(!reduced&&window.Lenis&&window.gsap&&window.ScrollTrigger){
 gsap.registerPlugin(ScrollTrigger);
 const lenis=new Lenis({duration:1.15,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
 lenis.on('scroll',ScrollTrigger.update);
 gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
 document.documentElement.classList.add('nm-smooth');
 NM.smooth=lenis;
 // In-page links go through Lenis, clearing the sticky header.
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a||a.getAttribute('href').length<2)return;
  const target=document.querySelector(a.getAttribute('href'));if(!target)return;
  e.preventDefault();lenis.scrollTo(target,{offset:-64,duration:1.4});history.replaceState(null,'',a.getAttribute('href'));
 });
}

// Run cb once when el first scrolls into view (immediately if reduced motion).
NM.onView=(el,cb,margin='0px 0px -12% 0px')=>{
 if(reduced||!('IntersectionObserver'in window)){cb(el);return}
 const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){io.disconnect();cb(el)}}),{rootMargin:margin});io.observe(el);
};
// Declarative reveals: [data-nm-reveal] (lines rise through a mask) and .nm-rule (hairline draws in).
document.querySelectorAll('[data-nm-reveal],.nm-rule').forEach(el=>NM.onView(el,()=>el.classList.add('is-in')));

// A hand-drawn ellipse that draws itself around `host` (host must be positioned).
// Returns {draw(), erase(), set(t)}; set(t) scrubs 0→1.
NM.scribble=(host,{color='currentColor',width=1.6}={})=>{
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
 svg.setAttribute('viewBox','0 0 200 200');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('nm-scribble');
 // Slightly more than one lap, with a wobble, so it reads as drawn by hand.
 const pts=[],laps=1.18,steps=90,j=Math.random()*6;
 for(let i=0;i<=steps;i++){const t=i/steps*laps*Math.PI*2-2.2,r=1+Math.sin(t*3+j)*.025+i/steps*.05;pts.push([100+Math.cos(t)*94*r,100+Math.sin(t)*92*r])}
 path.setAttribute('d','M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L'));
 path.setAttribute('fill','none');path.setAttribute('stroke',color);path.setAttribute('stroke-width',width);path.setAttribute('stroke-linecap','round');path.setAttribute('vector-effect','non-scaling-stroke');
 svg.appendChild(path);host.appendChild(svg);
 const len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
 const set=t=>{path.style.strokeDashoffset=(len*(1-clamp(t))).toFixed(1)};
 return{el:svg,set,
  draw(){path.style.transition='stroke-dashoffset .9s cubic-bezier(.6,.05,.25,1)';set(1)},
  erase(){path.style.transition='stroke-dashoffset .35s ease-in';set(0)}};
};
})();
