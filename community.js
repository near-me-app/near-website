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
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    let target = 0, current = 0, velocity = 0, swing = 0, swingVelocity = 0, raf = 0, active = -1, lastFrame = 0;
    let inView = false;

    // Pose by offset from focus:
    // o > 0: waiting on the peg behind the front pass
    // o = 0: front-and-center active pass
    // o < 0: swinging away and settling behind the next pass
    function pose(o) {
      if (o >= 0) {
        const t = smoothstep(clamp(o, 0, 1));
        return {
          r: lerp(0, 10, t),
          y: lerp(0, 12, t),
          x: 0
        };
      }
      const distance = -o;
      const out = smoothstep(clamp(distance / 0.62));
      const back = smoothstep(clamp((distance - 0.72) / 0.68));
      return {
        r: -28 * out * (1 - back) - 4 * back,
        y: -24 * out * (1 - back) - 8 * back,
        x: 5 * out * (1 - back)
      };
    }

    function render(p, sway = 0, now = 0) {
      const pos = clamp(p, 0, 1) * (passes.length - 1);
      const front = Math.round(pos);

      passes.forEach((pass, i) => {
        const o = i - pos;
        const q = pose(o);
        const focus = clamp(1 - Math.abs(o), 0, 1);
        const rx = q.x - pointer.y * 1.1 * focus;
        const ry = q.y + pointer.x * 1.2 * focus;
        const idle = inView && now ? Math.sin(now / 1600 + i * 1.3) * (i === front ? 0.38 : 0.22) : 0;
        const rz = q.r + sway * (1 - Math.min(1, Math.abs(o) * 0.35)) + idle + pointer.x * 0.35 * focus;

        // A physical pass stays opaque. The front pass changes only once the
        // outgoing one has swung clear, so the two faces never show through.
        pass.style.opacity = '1';
        pass.style.visibility = Math.abs(o) > 1.75 ? 'hidden' : '';
        pass.style.zIndex = String(i === front ? 30 : 20 - Math.round(Math.abs(o) * 4));

        const hang = pass.querySelector('.cp-hang');
        if (hang) {
          hang.style.transform = `perspective(1200px) rotateZ(${rz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
        }

        if (focus > 0.05) {
          const foilPos = 35 + (pointer.x * 35) + (o * -15);
          pass.style.setProperty('--foil', `${foilPos.toFixed(1)}%`);
        }
      });

      const next = front;
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

    function tick(now) {
      const dt = clamp((now - (lastFrame || now)) / 16.67, 0.5, 2);
      lastFrame = now;
      const easePointer = 1 - Math.pow(0.8, dt);
      pointer.x += (pointerTarget.x - pointer.x) * easePointer;
      pointer.y += (pointerTarget.y - pointer.y) * easePointer;
      velocity = (velocity + (target - current) * 0.18 * dt) * Math.pow(0.58, dt);
      current += velocity * dt;
      const swingTarget = clamp(-velocity * 90, -4, 4);
      swingVelocity = (swingVelocity + (swingTarget - swing) * 0.075 * dt) * Math.pow(0.88, dt);
      swing += swingVelocity * dt;
      if (Math.abs(target - current) < 0.0002 && Math.abs(velocity) < 0.0002) {
        current = target;
        velocity = 0;
      }
      if (Math.abs(swing) < 0.02 && Math.abs(swingVelocity) < 0.02 && !velocity) {
        swing = 0;
        swingVelocity = 0;
      }
      render(current, swing, now);
      if (inView || velocity || swing || Math.abs(pointerTarget.x - pointer.x) > 0.001 || Math.abs(pointerTarget.y - pointer.y) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        lastFrame = 0;
      }
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // Pointer tracking for pendulum sway and holographic sheen
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = e => {
      const r = rig.getBoundingClientRect();
      pointerTarget.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      pointerTarget.y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      kick();
    };
    const onLeave = () => {
      pointerTarget.x = 0;
      pointerTarget.y = 0;
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
        if (window.NearMotion && NearMotion.smooth) NearMotion.smooth.scrollTo(targetScroll, { duration: 1.1 });
        else window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    };
    rig.addEventListener('click', onClick);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 64px',
      end: 'bottom bottom',
      onToggle: self => {
        inView = self.isActive;
        kick();
      },
      onUpdate: self => {
        target = self.progress;
        kick();
      },
      onRefresh: self => {
        target = current = self.progress;
        velocity = 0;
        swing = swingVelocity = 0;
        render(current, 0);
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
