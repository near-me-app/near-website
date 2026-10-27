(() => {
  'use strict';

  const scene = document.querySelector('.footer-runway');
  if (!scene || !window.gsap) return;

  const runners = [...scene.querySelectorAll('.footer-runner')];
  const destination = scene.querySelector('.footer-event-cluster');
  if (runners.length !== 3 || !destination) return;

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    let visible = false;
    let timeline;
    scene.classList.add('has-motion');

    function sync() {
      const shouldPlay = visible && !document.hidden;
      if (shouldPlay) timeline.play();
      else timeline.pause();
      scene.classList.toggle('is-running', shouldPlay && timeline.time() < 5);
    }

    function build() {
      if (timeline) timeline.kill();
      const width = scene.clientWidth;
      gsap.set(runners, {x: -width * .14, y: 0, autoAlpha: 0});
      gsap.set(destination, {clearProps: 'transform'});

      timeline = gsap.timeline({
        paused: true,
        repeat: -1,
        repeatDelay: .8,
        onRepeat: () => scene.classList.add('is-running')
      });

      runners.forEach((runner, index) => {
        const delay = [0, .38, .78][index];
        const travel = [4.2, 3.85, 3.55][index];
        const finish = width * [.51, .48, .54][index];
        timeline.to(runner, {x: 0, autoAlpha: 1, duration: .3, ease: 'power1.out'}, delay);
        timeline.to(runner, {x: finish, duration: travel, ease: 'power1.inOut'}, delay + .25);
        timeline.to(runner, {y: -14, duration: .16, repeat: 1, yoyo: true, ease: 'power1.out'}, delay + travel + .2);
      });

      timeline.to(destination, {scale: 1.025, duration: .19, repeat: 1, yoyo: true, ease: 'power1.out'}, 4.65);
      timeline.call(() => scene.classList.remove('is-running'), null, 5);
      timeline.to(runners, {autoAlpha: 0, duration: .35, stagger: .06, ease: 'power1.in'}, 6.1);
      timeline.set(runners, {x: -width * .14, y: 0}, 6.65);
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
      scene.classList.remove('is-running', 'has-motion');
      gsap.set([...runners, destination], {clearProps: 'all'});
    };
  });
})();
