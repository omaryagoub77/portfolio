(() => {
  const header = document.querySelector('.site-header');
  const navigationLinks = [...document.querySelectorAll('.main-nav a')]
    .map(link => ({
      link,
      target: link.dataset.scrollTarget
        ? document.querySelector(link.dataset.scrollTarget)
        : link.hash
          ? document.querySelector(link.hash)
          : null
    }))
    .filter(item => item.target);

  if (!header) return;

  const menuToggle = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('.main-nav');

  if (menuToggle && navigation) {
    const isCompactMenu = () => window.matchMedia('(max-width: 840px)').matches;

    const closeMenu = () => {
      header.classList.remove('is-menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
      navigation.inert = isCompactMenu();
      navigation.setAttribute('aria-hidden', String(isCompactMenu()));
    };

    closeMenu();
    menuToggle.addEventListener('click', () => {
      const isOpen = header.classList.toggle('is-menu-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      navigation.inert = isCompactMenu() && !isOpen;
      navigation.setAttribute('aria-hidden', String(isCompactMenu() && !isOpen));
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('is-menu-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });
    window.matchMedia('(max-width: 840px)').addEventListener('change', closeMenu);
    window.addEventListener('resize', () => {
      if (!isCompactMenu()) closeMenu();
    }, { passive: true });
  }

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