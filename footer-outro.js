(() => {
  'use strict';

  const scene = document.querySelector('.footer-discovery');
  if (!scene || !window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pins = [...scene.querySelectorAll('.footer-map-pin')];
  const tickets = [...scene.querySelectorAll('.footer-invite')];
  if (pins.length !== 3 || tickets.length !== 3) return;

  let visible = false;
  function showPlan(index) {
    pins.forEach((pin, i) => pin.classList.toggle('is-active', i === index));
    tickets.forEach((ticket, i) => ticket.classList.toggle('is-active', i === index));
  }

  // The map is the source of each invitation. The sequence stops offscreen.
  const timeline = gsap.timeline({paused: true, repeat: -1});
  timeline.call(() => showPlan(0), null, 0)
    .call(() => showPlan(1), null, 3.6)
    .call(() => showPlan(2), null, 7.2)
    .to({}, {duration: 10.8}, 0);

  function sync() {
    const playing = visible && !document.hidden;
    scene.classList.toggle('is-playing', playing);
    if (playing) timeline.play();
    else timeline.pause();
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, {threshold: .1});
  observer.observe(scene);
  document.addEventListener('visibilitychange', sync);
})();
