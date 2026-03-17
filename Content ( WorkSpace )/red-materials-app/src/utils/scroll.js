export const scrollToSection = (id, options = {}) => {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  const offset = options.offset ?? -108;
  const targetTop = Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset);
  const lenis = window.__RED_MATERIALS_LENIS;

  if (lenis && typeof lenis.scrollTo === 'function') {
    lenis.scrollTo(targetTop, {
      duration: options.duration ?? 0.85,
      immediate: false,
    });
    return;
  }

  window.scrollTo({
    top: targetTop,
    behavior: options.behavior ?? 'smooth',
  });
};