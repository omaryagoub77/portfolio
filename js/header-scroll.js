(() => {
  const header = document.querySelector('.site-header');
  const navigationLinks = [...document.querySelectorAll('.main-nav a')]
    .map(link => ({
      link,
      target: document.querySelector(link.dataset.scrollTarget || link.hash)
    }))
    .filter(item => item.target);

  if (!header) return;

  const sections = navigationLinks.map(item => item.target);

  const updateHeader = () => {
    const height = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-height', `${height}px`);
    header.classList.toggle('is-scrolled', window.scrollY > 12);

    const marker = height + 24;
    const activeSection = sections.filter(section => section.getBoundingClientRect().top <= marker).at(-1);

    if (activeSection) {
      navigationLinks.forEach(({ link, target }) => {
        link.classList.toggle('active', target === activeSection);
      });
    }
  };

  const resizeObserver = new ResizeObserver(updateHeader);
  resizeObserver.observe(header);
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader, { passive: true });
  updateHeader();
})();