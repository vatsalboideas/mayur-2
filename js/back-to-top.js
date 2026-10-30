/* Back-to-top button: fixed bottom-right, appears after the first screen of scrolling. */
(() => {
  const btn = document.querySelector('.to-top'); if (!btn) return;
  const toggle = () => btn.classList.toggle('is-on', (window.scrollY || document.documentElement.scrollTop) > Math.max(400, innerHeight * .6));
  addEventListener('scroll', toggle, { passive: true });
  addEventListener('resize', toggle);
  toggle();
  /* cheap safety net for smooth-scroll engines / throttled scroll events */
  setInterval(toggle, 300);
  /* pages with a smooth-scroll engine handle a[href="#top"] themselves; this is the plain fallback */
  btn.addEventListener('click', e => { if (e.defaultPrevented) return; e.preventDefault(); scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
})();
