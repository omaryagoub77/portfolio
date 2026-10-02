(() => {
  const title = document.getElementById('hero-title');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lines = [...title.querySelectorAll(':scope > span')];
  if (!lines.length) return;

  const texts = lines.map(span => span.textContent);
  const nodes = lines.map(() => document.createTextNode(''));
  const caret = document.createElement('span');
  caret.className = 'type-caret';
  caret.setAttribute('aria-hidden', 'true');

  title.setAttribute('aria-label', texts.join(' '));
  lines.forEach((span, i) => {
    span.textContent = '';
    span.setAttribute('aria-hidden', 'true');
    span.appendChild(nodes[i]);
  });
  title.classList.add('is-typing');

  let line = 0;
  let char = 0;

  const step = () => {
    if (line >= lines.length) {
      title.classList.remove('is-typing');
      setTimeout(() => caret.remove(), 1600);
      return;
    }
    const span = lines[line];
    if (caret.parentNode !== span) span.appendChild(caret);
    char += 1;
    nodes[line].nodeValue = texts[line].slice(0, char);
    if (char < texts[line].length) {
      setTimeout(step, 55 + Math.random() * 45);
    } else {
      char = 0;
      line += 1;
      setTimeout(step, 320);
    }
  };

  setTimeout(step, 400);
})();
