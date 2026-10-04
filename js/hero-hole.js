(() => {
  if (!window.BlackHole || !window.numeric || !document.getElementById('black-hole')) return;

  BlackHole.blackHoleifyImage('black-hole', 'images/milkyway.jpg', {
    distanceFromBlackHole: 300,
    polynomialDegree: 3,
    numAngleTableEntries: 600,
    fovAngleInDegrees: 65,
    pointerTarget: 'home',
    staticHole: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  });
})();
