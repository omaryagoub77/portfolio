(() => {
  const hero = document.getElementById('home');
  const supportsPointerEffect = window.matchMedia(
    '(min-width: 1024px) and (hover: hover) and (pointer: fine)'
  ).matches;

  if (
    !hero ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !supportsPointerEffect
  ) return;

  let queued = false;
  let started = false;

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  const startEffect = async () => {
    try {
      await loadScript('js/numeric.js');
      await loadScript('js/black-hole.js');

      if (!window.BlackHole || !window.numeric) {
        throw new Error('The black-hole effect dependencies did not initialize.');
      }

      window.BlackHole.blackHoleifyImage('black-hole', 'images/milkyway.jpg', {
        distanceFromBlackHole: 300,
        polynomialDegree: 3,
        numAngleTableEntries: 600,
        fovAngleInDegrees: 65,
        pointerTarget: 'home'
      });
    } catch (error) {
      console.error('Unable to initialize the hero black-hole effect.', error);
    }
  };

  const scheduleEffect = () => {
    if (queued || started || document.hidden) return;
    queued = true;

    const runWhenIdle = () => {
      queued = false;
      if (started || document.hidden) return;
      started = true;
      void startEffect();
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runWhenIdle, { timeout: 5000 });
    } else {
      window.setTimeout(runWhenIdle, 1500);
    }
  };

  window.addEventListener('load', scheduleEffect, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleEffect();
  });

  if (document.readyState === 'complete') scheduleEffect();
})();
