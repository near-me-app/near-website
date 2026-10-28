/* Communities: the app's member pass (from Near's poster studio), hung on a lanyard.
   Scrolling deals the passes forward with natural pendulum physics;
   moving the pointer sways the active pass and catches light on the holographic foil. */
(() => {
  'use strict';

  const section = document.getElementById('communities');
  if (!section) return;
  const rig = section.querySelector('.cp-rig');
  if (!rig) return;
  const passes = [...rig.querySelectorAll('.cp')];
  if (passes.length < 2) return;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = t => t * t * (3 - 2 * t);
  const pad = n => String(n).padStart(2, '0');

  const kinds = passes.map(p => {
    const code = p.querySelector('.cp-code');
    if (code && code.textContent.trim()) return code.textContent.trim();
    const name = p.querySelector('.cp-name');
    return name ? name.textContent.trim() : 'Community';
  });

  const count = section.querySelector('.cm-count');
  const countNum = count ? count.querySelector('b') : null;
  const countKind = count ? count.querySelector('span') : null;

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add('(min-width: 901px) and (min-height: 500px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('cm-live');
    const follow = (window.NearMotion && NearMotion.smooth) ? 1 : 0.14;
    const pointer = { x: 0, y: 0 };
    let target = 0, current = 0, raf = 0, active = -1;

    // Pose by offset from focus:
    // o > 0: waiting on the peg behind the front pass
    // o = 0: front-and-center active pass
    // o < 0: swinging away to the left on the lanyard arc
    function pose(o) {
      if (o >= 0) {
        const t = smoothstep(clamp(o, 0, 1));
        const deep = Math.max(0, o - 1);
        return {
          x: lerp(0, 8, t) + deep * 4,
          y: lerp(0, 4, t) + deep * 2.5,
          r: lerp(0, 4, t) + deep * 1.5,
          s: lerp(1, 0.94, t) - deep * 0.03,
          dim: lerp(0, 0.22, t) + deep * 0.12,
          a: clamp(1 - Math.max(0, o - 1.5) * 2, 0, 1),
          z: Math.max(1, 20 - Math.round(o * 6))
        };
      }
      const t = smoothstep(clamp(-o, 0, 1));
      return {
        x: lerp(0, -62, t),
        y: lerp(0, -14, t),
        r: lerp(0, -18, t),
        s: lerp(1, 0.94, t),
        dim: lerp(0, 0.35, t),
        a: clamp(1 - Math.max(0, -o - 0.55) * 2.2, 0, 1),
        z: Math.max(1, 20 - Math.round(t * 8))
      };
    }

    function render(p) {
      const pos = clamp(p, 0, 1) * (passes.length - 1);
      const vel = clamp((target - current) * 25, -1, 1);
      const sway = -vel * 4.2;

      passes.forEach((pass, i) => {
        const o = i - pos;
        const q = pose(o);
        const focus = clamp(1 - Math.abs(o) * 1.2, 0, 1);
        const rx = -pointer.y * 5 * focus;
        const ry = pointer.x * 6.5 * focus;
        const rz = q.r + (sway * (1 - Math.min(1, Math.abs(o) * 0.5))) + (pointer.x * 2.8 * focus);

        pass.style.transform = `translate3d(${q.x.toFixed(2)}%, ${q.y.toFixed(2)}%, 0) scale(${q.s.toFixed(4)})`;
        pass.style.opacity = q.a.toFixed(3);
        pass.style.visibility = q.a < 0.01 ? 'hidden' : '';
        pass.style.zIndex = String(q.z);
        pass.style.filter = q.dim > 0.01 ? `brightness(${(1 - q.dim * 0.45).toFixed(3)})` : '';

        const hang = pass.querySelector('.cp-hang');
        if (hang) {
          hang.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
        }

        const foilPos = 35 + (pointer.x * 35) + (o * -15);
        pass.style.setProperty('--foil', `${foilPos.toFixed(1)}%`);
      });

      const next = Math.round(pos);
      if (next !== active) {
        active = next;
        if (countNum) countNum.textContent = `${pad(next + 1)} / ${pad(passes.length)}`;
        if (countKind) countKind.textContent = kinds[next];
        passes.forEach((p, idx) => {
          const isCur = idx === active;
          p.setAttribute('aria-hidden', String(!isCur));
          p.inert = !isCur;
        });
      }
    }

    function tick() {
      current += (target - current) * follow;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        raf = 0;
      } else {
        raf = requestAnimationFrame(tick);
      }
      render(current);
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Pointer tracking for pendulum sway and holographic sheen
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = e => {
      const r = rig.getBoundingClientRect();
      pointer.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      pointer.y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      kick();
    };
    const onLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
      kick();
    };

    if (fine) {
      rig.addEventListener('pointermove', onMove);
      rig.addEventListener('pointerleave', onLeave);
    }

    // Click on a visible card to scroll straight to it
    const onClick = e => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const clicked = e.target.closest('.cp');
      if (!clicked) return;
      const idx = passes.indexOf(clicked);
      if (idx !== -1 && idx !== active) {
        const range = trigger.end - trigger.start;
        const targetScroll = trigger.start + (idx / (passes.length - 1)) * range;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    };
    rig.addEventListener('click', onClick);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 64px',
      end: 'bottom bottom',
      onUpdate: self => {
        target = self.progress;
        kick();
      },
      onRefresh: self => {
        target = current = self.progress;
        render(current);
      }
    });

    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      trigger.kill();
      cancelAnimationFrame(raf);
      raf = 0;
      rig.removeEventListener('pointermove', onMove);
      rig.removeEventListener('pointerleave', onLeave);
      rig.removeEventListener('click', onClick);
      section.classList.remove('cm-live');
      passes.forEach(p => {
        p.removeAttribute('style');
        p.removeAttribute('aria-hidden');
        p.inert = false;
        const hang = p.querySelector('.cp-hang');
        if (hang) hang.removeAttribute('style');
      });
      active = -1;
    };
  });
})();
