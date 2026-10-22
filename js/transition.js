/* page transition between Home and inner pages */
(() => {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('.copy-year').forEach(el => { el.textContent = year; });
  const v = document.getElementById('veil'); if (!v) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const translateY = () => {
    const tr = getComputedStyle(v).transform;
    if (!tr || tr === 'none') return 0;
    try { return new DOMMatrix(tr).m42; } catch (_) { return 0; }
  };
  const uncover = () => {
    v.classList.remove('in', 'go', 'busy');
    v.style.animation = 'none';
    v.style.transition = 'none';
    v.style.transform = 'translateY(-101%)';
  };
  /* a restored or stalled sheet must not stay over the page */
  addEventListener('pageshow', e => {
    if (e.persisted) { uncover(); return; }
    setTimeout(() => { if (translateY() > -innerHeight * .45) uncover(); }, 1400);
  });

  let navTimer = 0, failTimer = 0, gone = false, onEnd = null;
  document.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    let url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin || !/\.html$/i.test(url.pathname)) return;
    if (url.pathname === location.pathname) {
      if (!url.hash) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    if (reduced) return;
    e.preventDefault();
    const dest = url.href;
    const leave = () => {
      if (gone) return;
      gone = true;
      clearTimeout(navTimer);
      clearTimeout(failTimer);
      try { sessionStorage.setItem('from-nav', '1'); } catch (_) {}
      location.assign(dest);
    };
    /* restart the cover from below the screen, even if a previous one stalled */
    v.classList.remove('go');
    v.classList.add('in', 'busy');
    v.style.animation = 'none';
    v.style.transition = 'none';
    v.style.transform = 'translateY(100%)';
    void v.offsetWidth;
    v.style.transition = 'transform .62s cubic-bezier(.7, 0, .2, 1)';
    v.classList.add('go');
    v.style.transform = 'translateY(0)';
    if (onEnd) v.removeEventListener('transitionend', onEnd);
    onEnd = ev => {
      if (ev.target !== v || ev.propertyName !== 'transform') return;
      v.removeEventListener('transitionend', onEnd);
      leave();
    };
    v.addEventListener('transitionend', onEnd);
    clearTimeout(navTimer);
    clearTimeout(failTimer);
    gone = false;
    navTimer = setTimeout(leave, 680);
    failTimer = setTimeout(() => { if (!gone) leave(); }, 1100);
  }, true);
})();
