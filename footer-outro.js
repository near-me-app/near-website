(() => {
  'use strict';

  const scene = document.querySelector('.footer-runway');
  if (!scene || !window.gsap) return;

  const runners = [...scene.querySelectorAll('.footer-runner')];
  const tickets = [
    scene.querySelector('.footer-event-game'),
    scene.querySelector('.footer-event-book'),
    scene.querySelector('.footer-event-plant')
  ];
  if (runners.length !== 3 || tickets.some(ticket => !ticket)) return;

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    let visible = false;
    let timeline;
    scene.classList.add('has-motion');

    function sync() {
      const shouldPlay = visible && !document.hidden;
      scene.classList.toggle('is-playing', shouldPlay);
      if (shouldPlay) timeline.play();
      else timeline.pause();
    }

    function build() {
      if (timeline) timeline.kill();
      scene.classList.remove('is-playing');
      runners.forEach(runner => runner.classList.remove('is-running'));
      gsap.set(runners, {clearProps: 'all'});
      gsap.set(tickets, {clearProps: 'all'});

      const bounds = scene.getBoundingClientRect();
      const starts = runners.map(runner => runner.getBoundingClientRect());
      const ends = tickets.map(ticket => ticket.getBoundingClientRect());
      const routes = starts.map((start, index) => ({
        x: Math.min(bounds.width - start.width - 4,
          ends[index].left - start.left - start.width * .78),
        y: Math.max(-start.top + bounds.top + 4,
          Math.min(bounds.bottom - start.bottom - 4, ends[index].bottom - start.bottom + 2))
      }));

      gsap.set(runners, {x: -bounds.width * .14, autoAlpha: 0});
      timeline = gsap.timeline({paused: true});

      runners.forEach((runner, index) => {
        const delay = [0, .2, .46][index];
        const duration = [2.9, 2.7, 2.45][index];
        const arrival = delay + duration + .3;
        const route = routes[index];
        const travel = {progress: 0};

        timeline.call(() => runner.classList.add('is-running'), null, delay);
        timeline.to(runner, {x: 0, autoAlpha: 1, duration: .3, ease: 'power1.out'}, delay);
        timeline.to(travel, {
          progress: 1,
          duration,
          ease: 'power1.inOut',
          onUpdate: () => {
            const progress = travel.progress;
            gsap.set(runner, {
              x: route.x * progress,
              y: route.y * progress - 16 * 4 * progress * (1 - progress),
              rotation: 4 * (1 - progress)
            });
          }
        }, delay + .3);
        timeline.call(() => runner.classList.remove('is-running'), null, arrival);
        timeline.to(runner, {y: route.y - 9, duration: .15, repeat: 1, yoyo: true, ease: 'power1.out'}, arrival);
        timeline.to(tickets[index], {y: -6, duration: .16, repeat: 1, yoyo: true, ease: 'power1.out'}, arrival + .05);
      });

      sync();
    }

    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, {threshold: .05});
    const resize = new ResizeObserver(build);
    build();
    observer.observe(scene);
    resize.observe(scene);
    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', sync);
      timeline.kill();
      scene.classList.remove('has-motion', 'is-playing');
      runners.forEach(runner => runner.classList.remove('is-running'));
      gsap.set([...runners, ...tickets], {clearProps: 'all'});
    };
  });
})();
