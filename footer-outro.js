(() => {
  'use strict';

  const scene = document.querySelector('.footer-discovery');
  if (!scene || !window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pins = [...scene.querySelectorAll('.footer-map-pin')];
  const tickets = [...scene.querySelectorAll('.footer-invite')];
  const stage = scene.querySelector('.footer-ticket-stage');
  const route = scene.querySelector('.footer-route path');
  const signal = scene.querySelector('.footer-route circle');
  if (pins.length !== 3 || tickets.length !== 3 || !stage || !route || !signal) return;

  let visible = false;
  let currentPlan = 0;
  let signalTween;

  function drawRoute(index, animate) {
    const sceneBox = scene.getBoundingClientRect();
    const pinBox = pins[index].querySelector('.footer-pin-icon').getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    const startX = pinBox.left + pinBox.width / 2 - sceneBox.left;
    const startY = pinBox.top + pinBox.height / 2 - sceneBox.top;
    const endX = stageBox.left - sceneBox.left + 4;
    const endY = stageBox.top - sceneBox.top + stageBox.height * .53;
    const spread = Math.max(40, (endX - startX) * .44);
    route.setAttribute('d', `M ${startX} ${startY} C ${startX + spread} ${startY}, ${endX - spread} ${endY}, ${endX} ${endY}`);

    if (signalTween) signalTween.kill();
    const length = route.getTotalLength();
    const progress = {value: 0};
    gsap.set(signal, {attr: {cx: startX, cy: startY}, opacity: animate ? 1 : 0});
    if (!animate) return;
    signalTween = gsap.to(progress, {
      value: 1, duration: .95, ease: 'power2.inOut',
      onUpdate: () => {
        const point = route.getPointAtLength(length * progress.value);
        signal.setAttribute('cx', point.x);
        signal.setAttribute('cy', point.y);
      },
      onComplete: () => gsap.to(signal, {opacity: 0, duration: .25})
    });
  }

  function showPlan(index) {
    currentPlan = index;
    pins.forEach((pin, i) => pin.classList.toggle('is-active', i === index));
    tickets.forEach((ticket, i) => ticket.classList.toggle('is-active', i === index));
    drawRoute(index, true);
  }

  const timeline = gsap.timeline({paused: true, repeat: -1});
  timeline.call(() => showPlan(0), null, 0)
    .call(() => showPlan(1), null, 3.6)
    .call(() => showPlan(2), null, 7.2)
    .to({}, {duration: 10.8}, 0);

  function sync() {
    const playing = visible && !document.hidden;
    scene.classList.toggle('is-playing', playing);
    if (playing) {
      timeline.play();
      if (signalTween) signalTween.resume();
    }
    else {
      timeline.pause();
      if (signalTween) signalTween.pause();
    }
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, {threshold: .1});
  observer.observe(scene);
  const resize = new ResizeObserver(() => drawRoute(currentPlan, false));
  resize.observe(scene);
  document.addEventListener('visibilitychange', sync);
})();
