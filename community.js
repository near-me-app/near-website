(() => {
  'use strict';

  const section = document.getElementById('communities');
  if (!section || !window.gsap || !window.ScrollTrigger) return;

  const cards = [...section.querySelectorAll('.community-ticket-stack .community-ticket')];
  if (cards.length < 2) return;

  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (min-width: 901px) and (min-height: 700px)', () => {
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    section.classList.add('community-scroll-ready');

    const render = progress => {
      const position = clamp(progress, 0, 1) * (cards.length - 1);
      const current = Math.round(position);
      cards.forEach((card, index) => {
        const offset = index - position;
        const distance = Math.abs(offset);
        gsap.set(card, {
          autoAlpha: clamp(1 - distance, 0, 1),
          y: offset * 34,
          rotation: offset * 2.5,
          scale: 1 - Math.min(distance, 1) * 0.04,
          zIndex: cards.length - Math.round(distance)
        });
        card.setAttribute('aria-hidden', index === current ? 'false' : 'true');
      });
    };

    render(0);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 64px',
      end: 'bottom bottom',
      onUpdate: self => render(self.progress),
      onRefresh: self => render(self.progress)
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      trigger.kill();
      section.classList.remove('community-scroll-ready');
      cards.forEach(card => {
        gsap.set(card, {clearProps: 'all'});
        card.removeAttribute('aria-hidden');
      });
    };
  });

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference) and (max-width: 900px) and (min-height: 600px)', () => {
    section.classList.add('community-mobile-scroll-ready');
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const render = progress => {
      const position = clamp(progress, 0, 1) * (cards.length - 1);
      const current = Math.round(position);
      cards.forEach((card, index) => {
        const offset = index - position;
        const distance = Math.abs(offset);
        gsap.set(card, {
          autoAlpha: clamp(1 - distance * 0.92, 0, 1),
          y: offset * 62,
          rotation: offset * 1.8,
          scale: 1 - Math.min(distance, 1) * 0.055,
          zIndex: cards.length - Math.round(distance)
        });
        card.setAttribute('aria-hidden', index === current ? 'false' : 'true');
      });
    };

    render(0);
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 64px',
      end: 'bottom bottom',
      onUpdate: self => render(self.progress),
      onRefresh: self => render(self.progress)
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      trigger.kill();
      section.classList.remove('community-mobile-scroll-ready');
      cards.forEach(card => {
        gsap.set(card, {clearProps: 'all'});
        card.removeAttribute('aria-hidden');
      });
    };
  });
})();
