(()=>{'use strict';
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const lerp=(a,b,x)=>a+(b-a)*x;
const style=getComputedStyle(document.documentElement),palette={};
['bg','bg-2','surface','surface-2','card','border','ink-2'].forEach(name=>palette[name]=style.getPropertyValue('--'+name).trim());
const WORLD=(()=>{
  const r=rng(7);
  const riverY=x=>2300+260*Math.sin(x/700)+120*Math.sin(x/260+1);
  const regions=[{ang:-9*Math.PI/180,above:true},{ang:13*Math.PI/180,above:false}];
  regions.forEach(g=>{g.u=[];g.v=[];for(let u=-6000;u<9000;u+=70+r()*80)g.u.push(u);for(let v=-6000;v<9000;v+=70+r()*80)g.v.push(v)});
  const bld=[];
  for(let i=0;i<14000;i++){const x=r()*4400-200,y=r()*4400-200;const ry=riverY(x);if(Math.abs(y-ry)<95)continue;
    const g=y<ry?regions[0]:regions[1];bld.push({x,y,w:16+r()*40,h:14+r()*32,a:g.ang})}
  const parks=[];for(let i=0;i<16;i++){const x=r()*4000,y=r()*4000;if(Math.abs(y-riverY(x))<260)continue;parks.push({x,y,w:160+r()*260,h:120+r()*220,a:(y<riverY(x)?-9:13)*Math.PI/180})}
  const majors=[];
  [500,1250,1900,2950,3600].forEach((y,i)=>{const p=[];for(let x=-300;x<=4400;x+=60)p.push([x,y+90*Math.sin(x/900+i)+(x*(i%2?0.08:-0.06))]);majors.push(p)});
  [450,1350,2250,3150,3900].forEach((x,i)=>{const p=[];for(let y=-300;y<=4400;y+=60)p.push([x+110*Math.sin(y/1000+i*2)+(y*(i%2?0.12:-0.1)),y]);majors.push(p)});
  {const p=[];for(let t=0;t<=1.0001;t+=.01)p.push([lerp(-200,4300,t),lerp(200,4100,t)+160*Math.sin(t*7)]);majors.push(p)}
  const names=['12th Main Rd','Lake View Rd','Station Rd','Old Mill Rd','Market St','Ring Rd','Church St','Hill Rd','College Rd','Temple St','Cross Rd'];
  const labels=majors.map((p,i)=>{const k=Math.floor(p.length*(.3+.4*((i*37%10)/10)));const a=p[k],b=p[k+1];return{x:a[0],y:a[1],ang:Math.atan2(b[1]-a[1],b[0]-a[0]),t:names[i%names.length]}});
  return{riverY,regions,bld,parks,majors,labels};
})();

function drawMap(cv,W,H,cam){
  const dpr=Math.min(devicePixelRatio||1,1.5);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const z=cam.z;
  c.fillStyle=palette["bg"];c.fillRect(0,0,W,H);
  c.save();c.translate(W/2,H/2);c.rotate((cam.rot||0)*Math.PI/180);c.scale(z,z);c.translate(-cam.cx,-cam.cy);
  const pad=900/z,vx0=cam.cx-W/z-pad,vx1=cam.cx+W/z+pad,vy0=cam.cy-H/z-pad,vy1=cam.cy+H/z+pad;
  const inV=(x,y)=>x>vx0&&x<vx1&&y>vy0&&y<vy1;
  const rect=(o,fill)=>{c.save();c.translate(o.x,o.y);c.rotate(o.a);c.fillStyle=fill;c.beginPath();c.roundRect(-o.w/2,-o.h/2,o.w,o.h,Math.min(o.w,o.h)*.12);c.fill();c.restore()};
  WORLD.bld.forEach(b=>{if(inV(b.x,b.y))rect(b,palette["surface"])});
  WORLD.parks.forEach(p=>{if(inV(p.x,p.y)){rect(p,palette["bg-2"])}});
  // minor streets, clipped either side of the river
  const riverPath=(above)=>{c.beginPath();c.moveTo(-6000,above?-6000:9000);for(let x=-6000;x<=9000;x+=40)c.lineTo(x,WORLD.riverY(x));c.lineTo(9000,above?-6000:9000);c.closePath()};
  WORLD.regions.forEach((g,gi)=>{c.save();riverPath(g.above);c.clip();
    c.strokeStyle=palette["card"];c.lineWidth=5.5;c.lineCap='butt';c.beginPath();
    const ca=Math.cos(g.ang),sa=Math.sin(g.ang);const P=(u,v)=>[u*ca-v*sa,u*sa+v*ca];
    g.u.forEach(u=>{const a=P(u,-6000),b=P(u,9000);c.moveTo(...a);c.lineTo(...b)});
    g.v.forEach(v=>{const a=P(-6000,v),b=P(9000,v);c.moveTo(...a);c.lineTo(...b)});
    c.stroke();c.restore()});
  // river
  c.beginPath();for(let x=-6000;x<=9000;x+=30){const y=WORLD.riverY(x);x===-6000?c.moveTo(x,y):c.lineTo(x,y)}
  c.strokeStyle=palette["bg"];c.lineWidth=120;c.lineJoin='round';c.stroke();
  // arterials: casing + fill
  const poly=p=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]))};
  c.lineCap='round';c.lineJoin='round';
  WORLD.majors.forEach(p=>{poly(p);c.strokeStyle=palette["surface-2"];c.lineWidth=22;c.stroke()});
  WORLD.majors.forEach(p=>{poly(p);c.strokeStyle=palette["border"];c.lineWidth=13;c.stroke()});
  // labels
  if(cam.labels!==false){c.font='700 15px Archivo';c.fillStyle=palette["ink-2"];c.textAlign='center';c.textBaseline='middle';
    WORLD.labels.forEach(l=>{if(!inV(l.x,l.y))return;c.save();c.translate(l.x,l.y);let a=l.ang;if(a>Math.PI/2)a-=Math.PI;if(a<-Math.PI/2)a+=Math.PI;c.rotate(a);c.translate(0,-22);c.fillText(l.t,0,0);c.restore()});}
  c.restore();
}

const canvases=[...document.querySelectorAll('canvas.map-art')];
function paint(cv){const r=cv.getBoundingClientRect();if(!r.width||!r.height)return;drawMap(cv,r.width,r.height,{cx:2100,cy:2150,z:Math.max(r.width/2800,r.height/2400),labels:false});}
const observer=new ResizeObserver(entries=>entries.forEach(entry=>paint(entry.target)));
canvases.forEach(cv=>{observer.observe(cv);paint(cv)});
})();
