/* page transition between Home and inner pages */
(() => {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('.copy-year').forEach(el => { el.textContent = year; });
  const v = document.getElementById('veil'); if (!v) return;
  const red = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('pageshow', e => { if (e.persisted) { v.className = 'veil'; v.style.animation = 'none'; v.style.transform = 'translateY(-100%)'; } });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const href = a.getAttribute('href'); if (!/\.html(#.*)?$/.test(href)) return;
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname) { if (!url.hash) { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); } return; }
    if (red) return;
    e.preventDefault(); v.style.animation = 'none'; v.style.transform = ''; v.classList.add('in'); void v.offsetWidth; v.classList.add('go');
    setTimeout(() => { location.href = url.href; }, 620);
  }, true);
})();
