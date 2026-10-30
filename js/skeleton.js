/* Skeleton loader for every image on the site.
   <img> tags and background-image elements (data-img, inline style) show a shimmering placeholder
   until the file has loaded. Background pictures stay behind the skeleton for at least MIN ms so it
   is perceptible even on fast connections, then fade out. Decorative SVGs, hero cut-outs and anything
   marked data-no-skel are skipped. */
(() => {
  const SKIP = 'a.logo img, .cut, [data-no-skel]';
  const MIN = 650, FADE = 500;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* a holder is released once its picture has loaded AND it has been on screen for MIN ms,
     so the skeleton is actually seen (not hidden behind an off-screen timer) */
  const seen = el => new Promise(res => {
    if (!('IntersectionObserver' in window)) return res();
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(res, reduced ? 0 : MIN); } }, { threshold: .05 });
    io.observe(el);
  });
  const release = el => seen(el).then(() => {
    el.classList.add('skel-out');
    setTimeout(() => { el.removeAttribute('data-skel'); el.classList.remove('skel-out'); el.classList.add('skel-done'); }, reduced ? 0 : FADE);
  });

  const watchImg = img => {
    if (img.matches(SKIP) || /\.svg(\?|$)/i.test(img.currentSrc || img.src || '')) return;
    if (img.complete && img.naturalWidth) return;
    img.setAttribute('data-skel', '');
    const fin = () => { img.removeAttribute('data-skel'); img.classList.add('skel-done'); };
    img.addEventListener('load', fin, { once: true });
    img.addEventListener('error', fin, { once: true });
  };

  const urlOf = el => {
    const m = (el.getAttribute('style') || '').match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
    return m ? m[1] : null;
  };

  const watchBg = el => {
    if (el.matches(SKIP) || el.hasAttribute('data-skel')) return;
    const src = urlOf(el);
    if (src) {
      el.setAttribute('data-skel', '');
      const im = new Image();
      im.onload = im.onerror = () => release(el);
      im.src = src;
      return;
    }
    /* [data-img]: the page script sets .has-img once the file exists; give up quietly if it never does */
    if (el.hasAttribute('data-img')) {
      el.setAttribute('data-skel', '');
      if (el.classList.contains('has-img')) { release(el); return; }
      const mo = new MutationObserver(() => { if (el.classList.contains('has-img')) { mo.disconnect(); release(el); } });
      mo.observe(el, { attributes: true, attributeFilter: ['class'] });
      setTimeout(() => { mo.disconnect(); release(el); }, 12000);
    }
  };

  const scan = root => {
    root.querySelectorAll('img').forEach(watchImg);
    root.querySelectorAll('[data-img], [style*="background-image"]').forEach(watchBg);
  };

  /* run as early as possible: before first paint of the image holders */
  const init = () => {
    scan(document);
    new MutationObserver(list => list.forEach(r => r.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'IMG') watchImg(n);
      if (n.matches && n.matches('[data-img], [style*="background-image"]')) watchBg(n);
      n.querySelectorAll && scan(n);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
