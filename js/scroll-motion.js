(() => {
  const targets = document.querySelectorAll("[data-motion]");

  if (!targets.length || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  }, {
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.12
  });

  document.documentElement.classList.add("motion-ready");
  targets.forEach(target => observer.observe(target));
})();
