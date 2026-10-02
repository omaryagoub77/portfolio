(() => {
  const portrait = document.querySelector('.portrait');
  const image = portrait?.querySelector('.portrait-frame img');
  const canvas = portrait?.querySelector('.portrait-veil');
  const context = canvas?.getContext('2d');
  const popoutCanvas = portrait?.querySelector('.portrait-popout');
  const popoutContext = popoutCanvas?.getContext('2d');

  if (!portrait || !image || !canvas || !context) return;

  const baseCanvas = document.createElement('canvas');
  const baseContext = baseCanvas.getContext('2d');
  const sampleCanvas = document.createElement('canvas');
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const marks = [];
  let activePoint = null;
  const pattern = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let pixelRatio = 1;

  const drawDither = () => {
    if (!image.complete || !image.naturalWidth || !sampleContext || !baseContext) return;

    const bounds = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    baseCanvas.width = width;
    baseCanvas.height = height;
    canvas.width = width;
    canvas.height = height;
    if (popoutCanvas && popoutContext) {
      popoutCanvas.width = width;
      popoutCanvas.height = height;
    }

    const cellSize = Math.max(2, Math.round(2 * pixelRatio));
    const columns = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    sampleCanvas.width = columns;
    sampleCanvas.height = rows;

    const scale = Math.min(columns / image.naturalWidth, rows / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    sampleContext.clearRect(0, 0, columns, rows);
    sampleContext.imageSmoothingEnabled = true;
    sampleContext.drawImage(image, (columns - imageWidth) / 2, rows - imageHeight, imageWidth, imageHeight);

    const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
    baseContext.clearRect(0, 0, width, height);
    baseContext.imageSmoothingEnabled = false;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const offset = (y * columns + x) * 4;
        const alpha = pixels[offset + 3] / 255;
        if (alpha === 0) continue;

        const luminance = (pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722) / 255;
        const threshold = (pattern[y % 4][x % 4] + 0.5) / 16;
        baseContext.globalAlpha = alpha;
        baseContext.fillStyle = luminance > threshold ? '#f4f1ea' : '#120f17';
        baseContext.fillRect(x * cellSize, y * cellSize, cellSize + 1, cellSize + 1);
      }
    }

    baseContext.globalAlpha = 1;
    if (popoutContext && popoutCanvas) {
      popoutContext.clearRect(0, 0, width, height);
      popoutContext.drawImage(baseCanvas, 0, 0);
    }
    renderFrame();
  };

  const renderFrame = () => {
    frame = 0;
    if (!canvas.width || !canvas.height) return;

    const now = performance.now();
    const lifetime = reducedMotion ? Infinity : 1000;
    for (let index = marks.length - 1; index >= 0; index--) {
      if (now - marks[index].time >= lifetime) marks.splice(index, 1);
    }

    const renderLayer = target => {
      target.globalCompositeOperation = 'source-over';
      target.globalAlpha = 1;
      target.clearRect(0, 0, canvas.width, canvas.height);
      target.drawImage(baseCanvas, 0, 0);

      target.globalCompositeOperation = 'destination-out';
      const reveal = (x, y, strength) => {
        const radius = 200 * pixelRatio;
        const gradient = target.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${strength})`);
        gradient.addColorStop(0.6, `rgba(0, 0, 0, ${strength * 0.85})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        target.fillStyle = gradient;
        target.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      };

      if (activePoint) reveal(activePoint.x, activePoint.y, 1);
      marks.forEach(mark => {
        if (activePoint && Math.hypot(mark.x - activePoint.x, mark.y - activePoint.y) < 1) return;
        const age = now - mark.time;
        const strength = reducedMotion ? 1 : Math.max(0, 1 - age / lifetime);
        reveal(mark.x, mark.y, strength);
      });

      target.globalCompositeOperation = 'source-over';
    };

    renderLayer(context);
    if (popoutContext) renderLayer(popoutContext);
    if (marks.length && !reducedMotion) frame = requestAnimationFrame(renderFrame);
  };

  const handlePointerMove = event => {
    const bounds = canvas.getBoundingClientRect();
    const point = {
      x: (event.clientX - bounds.left) * pixelRatio,
      y: (event.clientY - bounds.top) * pixelRatio,
      time: performance.now()
    };
    activePoint = point;

    if (reducedMotion) marks.length = 0;
    const previous = marks[marks.length - 1];
    if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= 8 * pixelRatio) marks.push(point);
    if (marks.length > 36) marks.shift();
    if (!frame) frame = requestAnimationFrame(renderFrame);
  };

  const handlePointerLeave = () => {
    activePoint = null;
    if (reducedMotion) {
      marks.length = 0;
      if (!frame) frame = requestAnimationFrame(renderFrame);
    }
  };

  const resizeObserver = new ResizeObserver(drawDither);
  resizeObserver.observe(portrait);
  image.addEventListener('load', drawDither, { once: true });
  portrait.addEventListener('pointermove', handlePointerMove, { passive: true });
  portrait.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  drawDither();
})();