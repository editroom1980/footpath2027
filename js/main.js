/* 全国フットパスの集い2027 ── 動き */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  /* ── 頭の帯とメニュー ── */
  const hd = $('#hd'), menu = $('#menu'), nav = $('#nav');
  const onScroll = () => hd.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => { menu.setAttribute('aria-expanded', open); nav.classList.toggle('is-open', open); document.body.style.overflow = open ? 'hidden' : ''; };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* 道を「始まりから今の長さまで」の線で見せる道具。
     破線のずらし（stroke-dashoffset）は Safari と Chrome で長さの計算が違い、Safari では道が切れ切れに現れたので使わない。
     道の上の点を先に取っておき、毎コマその点で線を引き直す */
  const bez = (x1, y1, x2, y2) => t => {   // cubic-bezier の進み方
    let a = t; for (let i = 0; i < 8; i++) { const x = 3 * (1 - a) * (1 - a) * a * x1 + 3 * (1 - a) * a * a * x2 + a * a * a - t, dx = 3 * (1 - a) * (1 - a) * x1 + 6 * (1 - a) * a * (x2 - x1) + 3 * a * a * (1 - x2); if (Math.abs(x) < 1e-5 || !dx) break; a = Math.min(1, Math.max(0, a - x / dx)); }
    return 3 * (1 - a) * (1 - a) * a * y1 + 3 * (1 - a) * a * a * y2 + a * a * a;
  };
  function growLine(src, target, n) {
    const L = src.getTotalLength(), pts = [];
    for (let i = 0; i <= n; i++) { const q = src.getPointAtLength(L * i / n); pts.push(`${q.x.toFixed(1)} ${q.y.toFixed(1)}`); }
    let shown = 0, raf = 0;
    const draw = f => { shown = Math.min(1, Math.max(0, f)); const k = Math.round(shown * n); target.setAttribute('d', k < 1 ? 'M-9999 -9999' : 'M' + pts.slice(0, k + 1).join('L')); };
    const to = (f, ms, ease, delay = 0) => {
      cancelAnimationFrame(raf); const from = shown; let t0 = null;
      if (reduce || !ms) { draw(f); return; }
      const step = now => { if (t0 === null) t0 = now + delay; const u = Math.min(1, Math.max(0, (now - t0) / ms)); draw(from + (f - from) * ease(u)); if (u < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    return { draw, to, get shown() { return shown; } };
  }

  /* ── 表紙：印の中の道筋を、鳥取から宍粟へ描き進める ── */
  const road = $('#heroRoad');
  if (road && window.ROAD) {
    const R = window.ROAD.paths, m = R[0].m, tr = `matrix(${m.join(' ')})`;
    const defs = el('defs', {}, road), mask = el('mask', { id: 'roadMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1000, height: 1000 }, defs);
    const reveal = el('path', { d: 'M-9999 -9999', transform: tr, fill: 'none', stroke: '#fff', 'stroke-width': 80, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mask);
    const g = el('g', { mask: 'url(#roadMask)' }, road);
    const drawn = R.map(p => el('path', { d: p.d, transform: tr, fill: 'none', stroke: p.stroke, 'stroke-width': p.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(p.dash ? { 'stroke-dasharray': p.dash } : {}) }, g));
    const grow = growLine(drawn[0], reveal, 600);
    if (reduce) grow.draw(1);
    else {
      const start = () => grow.to(1, 2600, bez(.45, .05, .25, 1), 350);
      const img = $('.hero-logo'); img.complete ? start() : img.addEventListener('load', start, { once: true });
    }
  }

  /* ── 表紙：記号を、印・文字の無い所にだけ散らす ── */
  const hero = $('.hero'), kigoSvg = $('#heroKigo');
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(29);
  function placeKigo() {
    if (!kigoSvg || !window.KIGO) return;
    kigoSvg.innerHTML = '';
    const hb = hero.getBoundingClientRect(), W = hb.width, H = hb.height;
    kigoSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const mark = $('.hero-mark').getBoundingClientRect();
    const cx = mark.left - hb.left + mark.width / 2, cy = mark.top - hb.top + mark.height / 2, cr = mark.width / 2;
    hero.style.setProperty('--cx', `${cx}px`); hero.style.setProperty('--cy', `${cy}px`);
    const boxes = [...$$('.hero-theme span, .hero-sub, .hero-date-en, .hero-date-ja, .hero-venue')].map(e => { const b = e.getBoundingClientRect(); return [b.left - hb.left, b.top - hb.top, b.right - hb.left, b.bottom - hb.top]; });
    const kinds = Object.keys(KIGO).filter(k => !k.startsWith('札_')).concat(['札_鳥取', '札_若桜', '札_飯見', '札_三方', '札_伊和', '札_山崎', '札_宇原']);
    const placed = [], want = W < 700 ? 16 : 34, gap = W < 700 ? 10 : 18;
    let tries = 0;
    while (placed.length < want && tries++ < 4000) {
      const sz = (W < 700 ? 26 : 36) + rnd() * (W < 700 ? 16 : 26), r = sz / 2;
      const x = r + rnd() * (W - 2 * r), y = r + rnd() * (H - 2 * r);
      if (Math.hypot(x - cx, y - cy) < cr + r + gap) continue;
      if (boxes.some(b => x + r + gap > b[0] && x - r - gap < b[2] && y + r + gap > b[1] && y - r - gap < b[3])) continue;
      if (placed.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + gap * 1.6)) continue;
      const kind = kinds[placed.length % kinds.length], v = KIGO[kind];
      const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((rnd() - .5) * 36).toFixed(1)}) scale(${(sz / v.base).toFixed(3)})`, opacity: .34 }, kigoSvg);
      g.innerHTML = v.m.replaceAll('{T}', '#B97D24').replaceAll('{B}', '#EDB54A');
      placed.push({ x, y, r });
    }
  }
  let t; const later = () => { clearTimeout(t); t = setTimeout(() => { placeKigo(); cOn = -9; onCourseScroll(); }, 150); };
  addEventListener('resize', later);

  /* ── コース：左に固定した地図。いま見ているコースの点が光り、道がそこまでのびる ── */
  const cmap = $('#cmap'), cards = $$('.course');
  let cGrow = null, cOn = -9;
  const cEase = bez(.4, .1, .2, 1);
  if (cmap && window.CMAP) {
    cmap.innerHTML = CMAP.svg;
    const svg = $('svg', cmap), road = $('#cmapRoad', svg), roadc = $('#cmapRoadC', svg);
    const defs = el('defs'); svg.insertBefore(defs, svg.firstChild);
    const vb = svg.viewBox.baseVal;
    const mask = el('mask', { id: 'cmapMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: vb.width, height: vb.height }, defs);
    const mp = el('path', { d: 'M-9999 -9999', fill: 'none', stroke: '#fff', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mask);
    const g = el('g', { mask: 'url(#cmapMask)' }); road.parentNode.insertBefore(g, road); g.appendChild(road); g.appendChild(roadc);
    cGrow = growLine(road, mp, 800);
  }
  function setCourse(i) {
    if (!cGrow || i === cOn) return; cOn = i;
    $$('.c-pin', cmap).forEach((p, k) => p.classList.toggle('is-on', k === i));
    cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
    const fr = i >= 0 ? CMAP.pins[i].fr : (i === -2 ? 1 : 0);
    cGrow.to(fr, 900, cEase);
  }
  function onCourseScroll() {
    if (!cards.length) return;
    if (innerWidth < 900) { setCourse(-2); return; }   // iPhone では地図はカードの上に1枚。道は全部見せる
    const mid = innerHeight * .5; let best = -1, bd = 1e9;
    cards.forEach((c, k) => { const b = c.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return; const d = Math.abs((b.top + b.bottom) / 2 - mid); if (d < bd) { bd = d; best = k; } });
    if ($('#courses').getBoundingClientRect().top > innerHeight * .4) best = -1;
    setCourse(best);
  }
  addEventListener('scroll', onCourseScroll, { passive: true });

  /* ── 紹介動画 ── */
  const mv = $('#movieV'), mp = $('#moviePlay');
  if (mv && mp) {
    mp.addEventListener('click', () => { mv.controls = true; mv.closest('.movie').classList.add('is-playing'); mv.play().catch(() => {}); });
    mv.addEventListener('ended', () => { mv.controls = false; mv.closest('.movie').classList.remove('is-playing'); mv.load(); });
  }

  /* ── 現れる動き ── */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach(e => io.observe(e));

  /* ── アプリ：いつもの地図 → 白の町 → 藍の町 ── */
  const imgs = $$('.phone-main img');
  const tag = $('#appStyle'), names = ['いつもの地図', '白の町', '藍の町'];
  if (imgs.length > 1 && !reduce) { let i = 0; setInterval(() => { imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on'); if (tag) tag.textContent = names[i]; }, 2800); }

  /* ── 空撮の帯：見えていないときは止める ── */
  const v = $('.kaido-bg');
  if (v) {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); }
    else new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
  }

  const ready = () => { placeKigo(); cOn = -9; onCourseScroll(); };
  document.fonts && document.fonts.ready ? document.fonts.ready.then(ready) : addEventListener('load', ready);
  addEventListener('load', () => setTimeout(ready, 60));
})();
