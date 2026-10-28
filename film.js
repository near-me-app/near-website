(()=>{'use strict';
const section=document.querySelector('.film.nf');if(!section)return;
const frame=section.querySelector('.nf-frame'),video=frame.querySelector('video'),play=frame.querySelector('.nf-play');

// Plays only when asked, with sound and native controls.
play.addEventListener('click',()=>{
 video.muted=false;video.controls=true;
 const p=video.play();if(p)p.catch(()=>{video.muted=true;video.play().catch(()=>{})});
});
video.addEventListener('play',()=>frame.classList.add('is-playing'));
video.addEventListener('pause',()=>{if(!video.seeking&&video.currentTime===0)frame.classList.remove('is-playing')});
video.addEventListener('ended',()=>{frame.classList.remove('is-playing');video.controls=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!video.paused)video.pause()});

// The frame grows from 0.86 to full size as it scrolls into view.
if(!window.gsap||!window.ScrollTrigger||(window.NearMotion&&NearMotion.reduced))return;
gsap.registerPlugin(ScrollTrigger);
gsap.fromTo(frame,{scale:.86},{scale:1,ease:'none',
 scrollTrigger:{trigger:frame,start:'top 95%',end:'top 45%',scrub:true}});
})();
