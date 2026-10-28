/* Communities: a pinned deck of invitation tickets. Scrolling deals the next ticket forward;
   the one before slides away to the left and fades. */
(() => {
  'use strict';

  const section = document.getElementById('communities');
  if (!section) return;
  const stack = section.querySelector('.community-ticket-stack');
  const cards = [...stack.querySelectorAll('.community-ticket')];
  if (cards.length < 2) return;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = t => t * t * (3 - 2 * t);
  const pad = n => String(n).padStart(2, '0');

  // Perforation notches sit on the stub's dashed line, wherever that lands on each ticket.
  function placeNotches() {
    cards.forEach(card => {
      const stub = card.querySelector('.community-ticket-stub');
      if (stub) card.style.setProperty('--notch-y', stub.offsetTop + 'px');
    });
  }
  placeNotches();
  addEventListener('resize', placeNotches);
  document.fonts && document.fonts.ready.then(placeNotches);

  const kinds = cards.map(card => card.querySelector('.community-ticket-kicker').textContent.split('·')[0].trim());
  const count = section.querySelector('.cm-count');
  const countNum = count.querySelector('b');
  const countKind = count.querySelector('span');

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-height: 600px)', () => {
    section.classList.add('cm-live');
    requestAnimationFrame(placeNotches);
    const follow = window.NearMotion && NearMotion.smooth ? 1 : 0.14;
    const pointer = {x: 0, y: 0};
    let target = 0, current = 0, raf = 0, active = -1;

    // Pose by offset from focus: >0 waiting in the deck, 0 in front, <0 dealt away.
    function pose(o) {
      if (o >= 0) {
        const t = smoothstep(clamp(o)), deep = Math.max(0, o - 1);
        return {x: lerp(0, 7, t) + deep * 3, y: lerp(0, 5, t) + deep * 2.5, r: lerp(0, 3, t) + deep * 1.5, s: lerp(1, 0.93, t) - deep * 0.03, dim: lerp(0, 0.22, t) + deep * 0.1, a: clamp(1 - Math.max(0, o - 1.6) * 1.5)};
      }
      const t = smoothstep(clamp(-o));
      return {x: lerp(0, -38, t), y: lerp(0, 2, t), r: lerp(0, -5, t), s: lerp(1, 0.94, t), dim: lerp(0, 0.3, t), a: 1 - t};
    }

    function render(p) {
      const pos = clamp(p) * (cards.length - 1);
      cards.forEach((card, i) => {
        const o = i - pos, q = pose(o);
        const focus = 1 - Math.min(1, Math.abs(o));
        const ry = pointer.x * 6 * focus, rx = -pointer.y * 5 * focus;
        card.style.transform = `translate3d(${q.x.toFixed(2)}%, ${q.y.toFixed(2)}%, 0) perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${q.r.toFixed(2)}deg) scale(${q.s.toFixed(4)})`;
        card.style.opacity = q.a.toFixed(3);
        card.style.visibility = q.a < 0.01 ? 'hidden' : '';
        card.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
        card.style.setProperty('--cm-dim', q.dim.toFixed(3));
        card.setAttribute('aria-hidden', String(Math.round(pos) !== i));
      });
      const next = Math.round(pos);
      if (next !== active) {
        active = next;
        countNum.textContent = `${pad(next + 1)} / ${pad(cards.length)}`;
        countKind.textContent = kinds[next];
      }
    }

    function tick() {
      current += (target - current) * follow;
      if (Math.abs(target - current) < 0.0004) { current = target; raf = 0; } else raf = requestAnimationFrame(tick);
      render(current);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // A gentle tilt toward the pointer on the ticket in front (fine pointers only).
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = e => {
      const r = stack.getBoundingClientRect();
      pointer.x = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      pointer.y = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
      render(current);
    };
    const onLeave = () => { pointer.x = pointer.y = 0; render(current); };
    if (fine) { stack.addEventListener('pointermove', onMove); stack.addEventListener('pointerleave', onLeave); }

    const trigger = ScrollTrigger.create({
      trigger: section, start: 'top 64px', end: 'bottom bottom',
      onUpdate: self => { target = self.progress; kick(); },
      onRefresh: self => { placeNotches(); target = current = self.progress; render(current); }
    });
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      trigger.kill();
      cancelAnimationFrame(raf); raf = 0;
      stack.removeEventListener('pointermove', onMove);
      stack.removeEventListener('pointerleave', onLeave);
      section.classList.remove('cm-live');
      cards.forEach(card => { card.removeAttribute('style'); card.removeAttribute('aria-hidden'); });
      active = -1; placeNotches();
    };
  });
})();
