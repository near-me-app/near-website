/* Communities: the app's member pass (from Near's poster studio), hung on a lanyard.
   The lanyards hang from one unseen hand that drifts slightly; each pass is a damped
   pendulum on its lanyard, so it lags, overshoots and settles, and bobs a little
   vertically. Scrolling deals the passes forward; moving the pointer sways the
   active pass and catches light on the holographic foil. */
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
    let target = 0, current = 0, velocity = 0, raf = 0, active = -1, lastFrame = 0;
    let inView = false;

    // Each pass is a damped pendulum hung from one hand that holds every lanyard.
    // r/ry/rx: rotation (deg) and its velocity; y: vertical bob of the lanyard (px).
    const state = passes.map(() => ({ r: 0, rv: 0, ry: 0, ryv: 0, rx: 0, rxv: 0, y: 0, yv: 0 }));
    const hand = { x: 0, y: 0, ax: 0, roll: 0 };

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

    // Where each pass wants to be for a scroll position (before physics).
    function targets(i, pos) {
      const o = i - pos;
      const q = pose(o);
      const focus = clamp(1 - Math.abs(o), 0, 1);
      // Passes waiting on the peg ride a little higher; the front pass hangs lowest.
      const lift = o >= 0 ? -10 * smoothstep(clamp(o, 0, 1)) : -6 * smoothstep(clamp(-o / 0.7));
      return {
        o, focus,
        r: q.r + pointer.x * 0.35 * focus,
        ry: q.y + pointer.x * 1.2 * focus,
        rx: q.x - pointer.y * 1.1 * focus,
        y: lift
      };
    }

    function paint(pos) {
      const front = Math.round(pos);
      passes.forEach((pass, i) => {
        const s = state[i];
        const o = i - pos;
        // A physical pass stays opaque. The front pass changes only once the
        // outgoing one has swung clear, so the two faces never show through.
        pass.style.opacity = '1';
        pass.style.visibility = Math.abs(o) > 1.75 ? 'hidden' : '';
        pass.style.zIndex = String(i === front ? 30 : 20 - Math.round(Math.abs(o) * 4));
        const hang = pass.querySelector('.cp-hang');
        if (hang) {
          hang.style.transform = `translate3d(${hand.x.toFixed(2)}px, ${(s.y + hand.y).toFixed(2)}px, 0) perspective(1200px) rotateZ(${s.r.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg) rotateX(${s.rx.toFixed(3)}deg)`;
        }
        if (clamp(1 - Math.abs(o), 0, 1) > 0.05) {
          const foilPos = 35 + (pointer.x * 35) + (o * -15);
          pass.style.setProperty('--foil', `${foilPos.toFixed(1)}%`);
        }
      });

      if (front !== active) {
        // Dealt forward: the new front pass drops into the hand and is caught by its lanyard;
        // the one leaving is lifted away.
        if (active !== -1 && state[front]) {
          state[front].yv += 70;
          if (state[active]) state[active].yv -= 40;
        }
        active = front;
        if (countNum) countNum.textContent = `${pad(front + 1)} / ${pad(passes.length)}`;
        if (countKind) countKind.textContent = kinds[front];
        passes.forEach((p, idx) => {
          const isCur = idx === active;
          p.setAttribute('aria-hidden', String(!isCur));
          p.inert = !isCur;
        });
      }
    }

    // Jump straight to rest (on refresh/resize).
    function snap(p) {
      const pos = clamp(p, 0, 1) * (passes.length - 1);
      passes.forEach((_, i) => {
        const t = targets(i, pos), s = state[i];
        s.r = t.r; s.ry = t.ry; s.rx = t.rx; s.y = t.y;
        s.rv = s.ryv = s.rxv = s.yv = 0;
      });
      hand.x = hand.y = hand.ax = hand.roll = 0;
      paint(pos);
    }

    function tick(now) {
      const dt = clamp((now - (lastFrame || now - 16.67)) / 1000, 1 / 240, 1 / 30);
      const f = dt * 60;
      lastFrame = now;
      const easePointer = 1 - Math.pow(0.8, f);
      pointer.x += (pointerTarget.x - pointer.x) * easePointer;
      pointer.y += (pointerTarget.y - pointer.y) * easePointer;

      // Scroll position: a light spring so wheel ticks become continuous motion.
      velocity = (velocity + (target - current) * 0.18 * f) * Math.pow(0.58, f);
      current += velocity * f;
      if (Math.abs(target - current) < 0.0002 && Math.abs(velocity) < 0.0002) { current = target; velocity = 0; }
      const pos = clamp(current, 0, 1) * (passes.length - 1);

      // The hand: a slow, uneven drift, as if someone is holding the lanyards up.
      // Scrolling tugs it up or down a touch.
      const t = now / 1000, live = inView ? 1 : 0;
      const hx = live * (3.2 * Math.sin(t * 0.83) + 1.4 * Math.sin(t * 2.1 + 0.7));
      const hy = live * (2.4 * Math.sin(t * 1.17 + 1.3) + 0.9 * Math.sin(t * 2.9)) + clamp(-velocity * 2600, -12, 12);
      hand.ax = live * (-3.2 * 0.83 * 0.83 * Math.sin(t * 0.83) - 1.4 * 2.1 * 2.1 * Math.sin(t * 2.1 + 0.7));
      hand.x += (hx - hand.x) * (1 - Math.pow(0.85, f));
      hand.y += (hy - hand.y) * (1 - Math.pow(0.85, f));
      hand.roll = live * 0.45 * Math.sin(t * 0.61 + 2.1);
      const scrollSwing = clamp(-velocity * 80, -4, 4);

      let moving = false;
      passes.forEach((_, i) => {
        const g = targets(i, pos), s = state[i];
        const near = 1 - Math.min(1, Math.abs(g.o) * 0.35);
        // Swing: a pendulum (~1.4s period) pulled toward its pose, pushed by the hand's
        // acceleration and the scroll, so it lags, overshoots a little, then settles.
        const rTarget = g.r + (hand.roll + scrollSwing) * near;
        s.rv += (20 * (rTarget - s.r) - 3.4 * s.rv + 1.1 * hand.ax * near) * dt;
        s.r += s.rv * dt;
        // Twist: the lanyard turns a little as the pass swings.
        s.ryv += (14 * (g.ry - s.ry) - 3.0 * s.ryv + 0.06 * s.rv) * dt;
        s.ry += s.ryv * dt;
        s.rxv += (24 * (g.rx - s.rx) - 6 * s.rxv) * dt;
        s.rx += s.rxv * dt;
        // Bob: the lanyard has a little give, and a swinging pass rises at the ends of its arc.
        const arcLift = -Math.min(14, s.rv * s.rv * 0.0012);
        s.yv += (70 * (g.y + arcLift - s.y) - 8 * s.yv) * dt;
        s.y += s.yv * dt;
        if (Math.abs(s.rv) > 0.02 || Math.abs(s.yv) > 0.05 || Math.abs(rTarget - s.r) > 0.01 || Math.abs(g.y - s.y) > 0.05) moving = true;
      });

      paint(pos);
      if (inView || velocity || moving || Math.abs(pointerTarget.x - pointer.x) > 0.001 || Math.abs(pointerTarget.y - pointer.y) > 0.001) {
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
        snap(current);
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
