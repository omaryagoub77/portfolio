(() => {
  if (!window.BlackHole || !window.numeric || !document.getElementById('black-hole')) return;

  BlackHole.blackHoleifyImage('black-hole', 'milkyway.jpg', {
    distanceFromBlackHole: 70,
    polynomialDegree: 3,
    numAngleTableEntries: 500,
    fovAngleInDegrees: 60,
    pointerTarget: 'home',
    staticHole: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  });
})();
