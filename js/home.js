(() => {
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (reduced) root.classList.add('reduced');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- images: load only if the file exists, otherwise keep the tinted placeholder ---------- */
const IMG_DIR = 'img/';
const EXT = { 'hero-sofa':'png','hero-plant':'png','hero-table':'png' };
$$('[data-img]').forEach(el => {
  const name = el.dataset.img, ext = EXT[name] || 'jpg';
  const src = IMG_DIR + name + '.' + ext, im = new Image();
  im.onload = () => { el.style.backgroundImage = `url("${src}")`; el.classList.add('has-img'); el.closest('.ph')?.classList.add('has-img'); };
  im.src = src;
});
// customer logos: logo-01.png … logo-28.png when supplied
(() => {
  const grid = $('#logoGrid');
  for (let i = 1; i <= 28; i++) {
    const cell = document.createElement('div'); cell.className = 'logo-cell';
    const im = new Image(); im.alt = '';
    im.onerror = () => cell.remove();
    im.src = IMG_DIR + 'logo-' + String(i).padStart(2, '0') + '.png';
    cell.appendChild(im); grid.appendChild(cell);
  }
})();

/* brand logos from Figma, when exported */
[['footer .logo','logo-footer.svg']].forEach(([sel,file]) => {
  const im = new Image(); im.alt = 'Mayur Uniquoters';
  im.onload = () => { const a = $(sel); a.innerHTML = ''; im.style.height = sel[0]==='#' ? '48px' : '90px'; im.style.width = 'auto'; a.appendChild(im); };
  im.src = IMG_DIR + file;
});

/* ---------- word splitting ---------- */
$$('[data-words]').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
});

/* ---------- mobile nav ---------- */
const mBtn = $('#menuBtn'), mNav = $('#mnav');
mBtn.addEventListener('click', () => { const o = mNav.hidden; mNav.hidden = !o; mBtn.setAttribute('aria-expanded', o); mBtn.textContent = o ? 'Close' : 'Menu'; $('#hdr').classList.toggle('on-dark', o); });
$$('a', mNav).forEach(a => a.addEventListener('click', () => { mNav.hidden = true; mBtn.textContent = 'Menu'; mBtn.setAttribute('aria-expanded', false); }));

/* ---------- chips ---------- */
$$('#chips .chip').forEach(c => c.addEventListener('click', () => {
  $$('#chips .chip').forEach(x => x.setAttribute('aria-pressed', x === c));
  gsap.fromTo('.cert', { y: 24, opacity: .4 }, { y: 0, opacity: 1, duration: .7, stagger: .08, ease: 'power3.out' });
}));

/* ---------- board arrows ---------- */
const row = $('#boardRow');
const step = () => (row.querySelector('.bm-card')?.offsetWidth || 300) + 24;
$('#bPrev').addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
$('#bNext').addEventListener('click', () => row.scrollBy({ left: step(), behavior: 'smooth' }));

/* ================= WebGL: one coated-fabric surface for the whole page ================= */
const fabric = { color: new THREE.Color('#EAE5DD'), amp: { v: 1 }, scroll: 0, mx: 0, my: 0 };
let glOK = false;
try {
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(0, 0, 6);
  const uniforms = {
    uTime: { value: 0 }, uAmp: { value: 1 }, uScroll: { value: 0 },
    uColor: { value: fabric.color }, uMouse: { value: new THREE.Vector2() }, uLight: { value: new THREE.Vector3(.4, .6, .9) }
  };
  const noise = `
    vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
    vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
    vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}
    vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
    float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
      vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
      vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
      i=mod289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
      float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
      vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
      return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
  const vert = noise + `
    uniform float uTime,uAmp,uScroll; uniform vec2 uMouse;
    varying vec3 vN; varying vec2 vUv; varying float vH;
    float h(vec2 p){
      float t=uTime*.05; vec2 q=p+vec2(0.,uScroll*1.6);
      float f=snoise(vec3(q*.28,t))*.6+snoise(vec3(q*.62+3.,t*1.3))*.2+snoise(vec3(q*1.3-7.,t*1.6))*.05;
      float d=length(p-uMouse*vec2(3.2,1.8)); f+=.18*exp(-d*d*.9);
      return f*uAmp;}
    void main(){ vUv=uv; vec3 p=position; float e=.04;
      float c=h(p.xy); float dx=h(p.xy+vec2(e,0.))-c; float dy=h(p.xy+vec2(0.,e))-c;
      vN=normalize(vec3(-dx/e,-dy/e,1.)); vH=c; p.z+=c*.9;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
  const frag = noise + `
    precision highp float; uniform vec3 uColor,uLight; uniform float uTime;
    varying vec3 vN; varying vec2 vUv; varying float vH;
    void main(){
      // pebble grain of coated fabric / artificial leather
      vec2 g=vUv*vec2(260.,150.); float gr=snoise(vec3(g,1.))*.5+snoise(vec3(g*2.1,4.))*.25;
      vec3 n=normalize(vN*vec3(.55,.55,1.)+vec3(gr*.035,gr*.03,0.));
      vec3 L=normalize(uLight); float dif=clamp(dot(n,L),0.,1.);
      float lum=dot(uColor,vec3(.299,.587,.114));
      float spec=pow(clamp(dot(reflect(-L,n),vec3(0.,0.,1.)),0.,1.),24.)*mix(.12,.035,lum);
      float shade=mix(.88,1.035,dif)+vH*.03;
      vec3 col=uColor*shade+spec;
      col=mix(col,uColor,.18*smoothstep(.3,.95,lum));
      float vig=smoothstep(1.25,.25,length(vUv-.5)); col*=mix(.94,1.,vig);
      gl_FragColor=vec4(col,1.);}`;
  const geo = new THREE.PlaneGeometry(12, 7, 220, 130);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
  const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -.18; scene.add(mesh);
  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    const s = Math.max(1, (w / h) / 1.6); mesh.scale.set(s * 1.05, 1.05 * Math.max(1, 1.2 / (w / h)), 1); camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  const mouse = new THREE.Vector2();
  addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); });
  let t0 = performance.now();
  const tick = () => {
    const t = (performance.now() - t0) / 1000;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uMouse.value.lerp(mouse, .04);
    uniforms.uAmp.value = fabric.amp.v;
    uniforms.uScroll.value += (fabric.scroll - uniforms.uScroll.value) * .08;
    uniforms.uLight.value.set(.4 + uniforms.uMouse.value.x * .5, .6 + uniforms.uMouse.value.y * .4, .9);
    mesh.rotation.y = uniforms.uMouse.value.x * .05; mesh.rotation.x = -.18 + uniforms.uMouse.value.y * .04;
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);
  glOK = true;
} catch (e) { root.classList.add('no-webgl'); }
$$('[data-fabric]').forEach(s => s.style.setProperty('--sec-bg', s.dataset.fabric));

/* ================= Smooth scroll + GSAP ================= */
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new Lenis({ lerp: .085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); const t = id === '#top' ? 0 : $(id);
  if (t === null) return; e.preventDefault();
  lenis ? lenis.scrollTo(t, { duration: 1.6 }) : (t === 0 ? scrollTo({ top: 0, behavior: 'smooth' }) : t.scrollIntoView({ behavior: 'smooth' }));
}));

/* header: hide on scroll down, tint over dark sections */
const hdr = $('#hdr'); let lastY = scrollY;
if (lastY > 80) hdr.classList.add('is-solid');
requestAnimationFrame(() => hdr.classList.add('hdr-ready'));
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
  const y = self.scroll(), dy = y - lastY;
  if (Math.abs(dy) >= 160) hdr.classList.remove('hdr-ready');
  hdr.classList.toggle('is-solid', y > 80);
  if (Math.abs(dy) >= 160) { void hdr.offsetWidth; hdr.classList.add('hdr-ready'); }
  if (mNav.hidden && y > 300 && dy > 0 && dy < 160) hdr.classList.add('is-hidden');
  else if (dy < -4 || y <= 80) hdr.classList.remove('is-hidden');
  lastY = y;
  fabric.scroll = self.progress;
}});
$$('[data-dark]').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 60px', end: 'bottom 60px', toggleClass: { targets: hdr, className: 'on-dark' } }));

/* fabric re-tint: whichever section sits under the viewport centre */
const fabSecs = $$('[data-fabric]'); let activeFab = null;
const pickFabric = () => {
  const mid = innerHeight * .5; let s = fabSecs[0];
  for (const el of fabSecs) { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) { s = el; break; } if (r.top <= mid) s = el; }
  if (s === activeFab) return; activeFab = s;
  const c = new THREE.Color(s.dataset.fabric);
  gsap.to(fabric.color, { r: c.r, g: c.g, b: c.b, duration: 1.2, ease: 'power2.out', overwrite: true });
  gsap.to(fabric.amp, { v: +s.dataset.amp, duration: 1.6, ease: 'power2.out', overwrite: true });
};
gsap.ticker.add(pickFabric);

if (reduced) { $('#histBar').style.transform = 'scaleX(1)'; return; }

/* ---------- hero intro ---------- */
const intro = gsap.timeline({ delay: .15 });
intro.from('#heroTitle .line-mask>span', { yPercent: 110, duration: 1.3, stagger: .1, ease: 'expo.out' })
  .from('.hero-stage .cut', { y: 160, opacity: 0, duration: 1.6, stagger: .12, ease: 'expo.out' }, '<.1')
  .from('.hero-foot', { opacity: 0, y: 20, duration: .8 }, '<.5')
  .from('.hero-foot .rule', { scaleX: 0, transformOrigin: 'left', duration: 1.2, ease: 'expo.out' }, '<');

/* hero parallax: scroll + mouse */
$$('.hero-stage .cut').forEach(el => {
  const d = +el.dataset.depth;
  gsap.to(el, { yPercent: -18 * d, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
});
gsap.to('#heroTitle', { yPercent: 35, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
const stage = $('.hero-stage');
addEventListener('pointermove', e => {
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  $$('.cut', stage).forEach(el => gsap.to(el, { x: -x * 40 * el.dataset.depth, rotation: x * 1.2 * el.dataset.depth, duration: 1.4, ease: 'power3.out', overwrite: 'auto' }));
});

/* ---------- generic reveals ---------- */
$$('.rv-h').forEach(h => {
  h.innerHTML = `<span class="line-mask"><span>${h.innerHTML}</span></span>`;
  gsap.from(h.querySelector('.line-mask>span'), { yPercent: 105, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
});
$$('.eyebrow').forEach(e => gsap.from(e, { opacity: 0, x: -16, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 90%' } }));
$$('.rv-rule, .val .rule').forEach(r => gsap.from(r, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 92%' } }));

/* word-by-word scrub */
$$('[data-words]').forEach(el => gsap.to(el.querySelectorAll('.w'), { opacity: 1, stagger: .1, ease: 'none',
  scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } }));

/* about images: differential parallax + clip reveal */
$$('.about-imgs .ph').forEach((el, i) => {
  gsap.fromTo(el, { clipPath: 'inset(18% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: true } });
  gsap.to(el, { yPercent: +el.dataset.speed * -1.6, ease: 'none', scrollTrigger: { trigger: '.about-imgs', start: 'top bottom', end: 'bottom top', scrub: true } });
});

/* ---------- vision / mission / values sticky ---------- */
const mm = gsap.matchMedia();
mm.add('(min-width: 1101px)', () => {
  const slides = $$('.split .slide'), btns = $$('.split-list button'), layers = $$('.split-img .layer');
  gsap.set(slides, { opacity: 0, y: 30 }); gsap.set(slides[0], { opacity: 1, y: 0 });
  let cur = 0;
  const go = i => { if (i === cur) return;
    const prev = cur, dir = i > prev ? 1 : -1; cur = i;
    gsap.killTweensOf(slides);
    slides.forEach((sl, k) => { if (k !== prev && k !== i) gsap.set(sl, { opacity: 0, y: 0 }); });
    gsap.to(slides[prev], { opacity: 0, y: -24 * dir, duration: .3, ease: 'power2.in' });
    gsap.fromTo(slides[i], { opacity: 0, y: 24 * dir }, { opacity: 1, y: 0, duration: .6, delay: .28, ease: 'power3.out' });
    layers.forEach((l, k) => gsap.to(l, { clipPath: k <= i ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)', duration: 1.1, ease: 'expo.inOut', overwrite: true }));
    btns.forEach((b, k) => b.classList.toggle('on', k === i));
    $('#splitCount').textContent = `0${i + 1} / 03`; };
  const st = ScrollTrigger.create({ trigger: '.split', start: 'top top', end: 'bottom bottom', pin: '.split-pin', pinSpacing: false,
    onUpdate: s => go(Math.min(2, Math.floor(s.progress * 3))) });
  btns.forEach((b, i) => b.addEventListener('click', () => { const y = st.start + (st.end - st.start) * (i + .5) / 3; lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo({ top: y, behavior: 'smooth' }); }));
  return () => { gsap.set(slides, { clearProps: 'all' }); gsap.set(layers, { clearProps: 'clipPath' }); };
});

/* values stagger */
gsap.from('.val > *:not(.rule)', { y: 40, opacity: 0, duration: 1, stagger: .04, ease: 'power3.out', scrollTrigger: { trigger: '.val-grid', start: 'top 85%' } });

/* ---------- history: horizontal pinned scroll ---------- */
mm.add('(min-width: 901px)', () => {
  const track = $('#histTrack');
  const dist = () => Math.max(0, track.scrollWidth - (innerWidth - 2 * parseFloat(getComputedStyle(track.parentElement).paddingLeft)));
  const tw = gsap.to(track, { x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '.history', start: 'top top', end: () => '+=' + (dist() + innerHeight * .4), pin: '.hist-pin', scrub: 1, invalidateOnRefresh: true,
      onUpdate: s => gsap.set('#histBar', { scaleX: .33 + s.progress * .67 }) } });
  $$('.mile .inner').forEach(el => gsap.fromTo(el, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: el.closest('.mile'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } }));
  $$('.mile .yr').forEach(el => gsap.from(el, { yPercent: 60, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: el.closest('.mile'), containerAnimation: tw, start: 'left 90%', end: 'left 50%', scrub: true } }));
  // drag the timeline: horizontal drag maps onto page scroll
  const hst = tw.scrollTrigger, hp = $('.hist-pin');
  let dragging = false, sx = 0, sy = 0;
  hp.addEventListener('pointerdown', e => { if (e.button !== 0) return; dragging = true; sx = e.clientX; sy = hst.scroll(); hp.classList.add('grabbing'); hp.setPointerCapture(e.pointerId); });
  hp.addEventListener('pointermove', e => { if (!dragging) return;
    const k = (hst.end - hst.start) / Math.max(1, dist());
    const y = Math.min(hst.end, Math.max(hst.start, sy + (sx - e.clientX) * k * 1.4));
    lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
  const stop = e => { if (!dragging) return; dragging = false; hp.classList.remove('grabbing'); try { hp.releasePointerCapture(e.pointerId); } catch (_) {} };
  hp.addEventListener('pointerup', stop); hp.addEventListener('pointercancel', stop);
  hp.addEventListener('dragstart', e => e.preventDefault());
  const cur = $('#cursor');
  hp.addEventListener('pointerenter', () => cur.classList.add('big')); hp.addEventListener('pointerleave', () => cur.classList.remove('big'));
});

/* ---------- founder ---------- */
gsap.fromTo('.founder .bg', { yPercent: -8, scale: 1.15 }, { yPercent: 8, scale: 1, ease: 'none', scrollTrigger: { trigger: '.founder', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ---------- board ---------- */
gsap.from('.bm-card', { y: 90, opacity: 0, duration: 1.3, stagger: .09, ease: 'expo.out', scrollTrigger: { trigger: '#boardRow', start: 'top 88%' } });

/* ---------- certificates: float + 3D tilt ---------- */
gsap.from('.cert', { y: 120, rotateX: 14, opacity: 0, duration: 1.4, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.certs', start: 'top 85%' } });
$$('.cert').forEach((c, i) => {
  gsap.to(c, { yPercent: i ? -10 : 6, ease: 'none', scrollTrigger: { trigger: '.policies', start: 'top bottom', end: 'bottom top', scrub: true } });
  c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    gsap.to(c, { rotateY: x * 10, rotateX: -y * 10, duration: .6, ease: 'power3.out' }); });
  c.addEventListener('pointerleave', () => gsap.to(c, { rotateY: 0, rotateX: 0, duration: .9, ease: 'elastic.out(1,.6)' }));
});

/* ---------- investors ---------- */
gsap.to('#invImg', { clipPath: 'inset(0% 0% 0% 0% round 20px)', ease: 'none', scrollTrigger: { trigger: '#invImg', start: 'top 90%', end: 'top 25%', scrub: true } });
gsap.fromTo('#invImg .inner', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#invImg', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ---------- footer ---------- */
const fl = $('.foot-line'); fl.innerHTML = fl.textContent.split(' ').map(w => `<span class="line-mask" style="display:inline-block"><span style="display:inline-block">${w}</span></span>`).join(' ');
gsap.from('.foot-line .line-mask>span', { yPercent: 110, duration: 1.2, stagger: .04, ease: 'expo.out', scrollTrigger: { trigger: fl, start: 'top 92%' } });

/* ---------- cursor ---------- */
const cur = $('#cursor');
const qx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); });

const jumpHash = () => {
  const id = location.hash;
  if (!id || id === '#') return;
  const t = id === '#top' ? 0 : document.querySelector(id);
  if (t == null) return;
  if (lenis) lenis.scrollTo(t, { immediate: true });
  else if (t === 0) scrollTo(0, 0);
  else t.scrollIntoView();
};
addEventListener('load', () => { ScrollTrigger.refresh(); jumpHash(); });
})();
