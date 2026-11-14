/* ===== Raw Money · reacción líquida =====
   No dibuja agua: hace que gráficas y recuadros se muevan como agua, con resortes amortiguados.
   Al aparecer se llenan con un pequeño oleaje (se pasan y regresan), al pasar el cursor ondulan
   y al tocarlos tiemblan como gelatina. Respeta "reducir movimiento". */
const Liquid = (() => {
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  /* Resorte: x tiende a `to` con rigidez k y amortiguación c */
  class Spring {
    constructor(x = 0, k = 140, c = 10) { this.x = x; this.v = 0; this.to = x; this.k = k; this.c = c; }
    step(dt) { const n = 4, h = dt / n; for (let i = 0; i < n; i++) { const a = -this.k * (this.x - this.to) - this.c * this.v; this.v += a * h; this.x += this.v * h; } return Math.abs(this.v) > .002 || Math.abs(this.x - this.to) > .001; }
    settle() { this.x = this.to; this.v = 0; }
  }
  /* Un solo ciclo de animación para todo */
  const jobs = new Set(); let raf = 0, last = 0;
  function tick(t) {
    const dt = Math.min(.034, last ? (t - last) / 1000 : .016); last = t;
    jobs.forEach(j => { if (j.delay > 0) { j.delay -= dt; return; } if (!j.el.isConnected || !j.run(dt)) { j.done && j.done(); jobs.delete(j); } });
    raf = jobs.size ? requestAnimationFrame(tick) : 0; if (!raf) last = 0;
  }
  function add(job) { jobs.add(job); if (!raf) raf = requestAnimationFrame(tick); return job; }
  /* Termina todo de golpe (para capturas e impresión) */
  function settle() { jobs.forEach(j => { j.settle && j.settle(); }); jobs.clear(); cancelAnimationFrame(raf); raf = 0; last = 0; }

  /* ---------- Donas redondas: las rebanadas crecen como ola y ondulan ---------- */
  function donut(svg) {
    if (svg._lq) return; svg._lq = 1;
    const cx = +svg.dataset.cx, cy = +svg.dataset.cy, R = +svg.dataset.rm, W = +svg.dataset.w;
    const sl = [...svg.querySelectorAll('path[data-s]')].map((p, i) => ({ p, s: +p.dataset.s, e: +p.dataset.e, g: new Spring(0, 90, 7.5), h: new Spring(0, 260, 11), i }));
    if (!sl.length) return;
    const sweep = new Spring(0, 55, 12); sweep.to = 1;
    const base = -Math.PI / 2;
    const draw = () => sl.forEach(o => {
      const a = Math.min(1, Math.max(0, sweep.x)); const s = base + (o.s - base) * a, e = base + (o.e - base) * a;
      o.p.setAttribute('d', arcLine(cx, cy, R, s, Math.max(s, e))); o.p.setAttribute('stroke-width', Math.max(0, W * o.g.x + o.h.x).toFixed(2));
    });
    sl.forEach(o => { o.g.to = 1; });
    const job = { el: svg, run: dt => { let on = sweep.step(dt); sl.forEach(o => { if (sweep.x > o.i / (sl.length + 1) * .6) on = o.g.step(dt) || on; on = o.h.step(dt) || on; }); draw(); return on; },
      settle: () => { sweep.settle(); sl.forEach(o => { o.g.to = 1; o.g.settle(); o.h.to = 0; o.h.settle(); }); draw(); } };
    const wake = () => { if (!jobs.has(job)) add(job); };
    draw(); add(job);
    sl.forEach(o => {
      o.p.addEventListener('pointerenter', () => { o.h.to = 7; sl.forEach(n => { if (n !== o) n.h.to = -3; }); wake(); });
      o.p.addEventListener('pointerleave', () => { sl.forEach(n => { n.h.to = 0; }); wake(); });
    });
    svg.addEventListener('pointerdown', () => { sl.forEach(o => { setTimeout(() => { o.g.v += 3.2; wake(); }, o.i * 55); }); });
  }
  /* ---------- Anillos: se cierran con vaivén, uno tras otro ---------- */
  function rings(svg) {
    if (svg._lq) return; svg._lq = 1;
    [...svg.querySelectorAll('.rg-fill')].forEach((c, i) => {
      const L = +c.dataset.len, sp = new Spring(0, 70, 8); sp.to = +c.dataset.v;
      const put = () => { c.style.strokeDasharray = `${(Math.max(0, sp.x) * L).toFixed(1)} ${L * 2}`; };
      const job = { el: c, delay: i * .09, run: dt => { const a = sp.step(dt); put(); return a; }, settle: () => { sp.settle(); put(); } };
      put(); add(job);
      c.addEventListener('pointerenter', () => { sp.v += .9; if (!jobs.has(job)) { job.delay = 0; add(job); } });
    });
  }
  /* ---------- Barras SVG: suben con oleaje y se agitan al pasar ---------- */
  function svgBars(svg) {
    if (svg._lq) return; svg._lq = 1;
    const rs = [...svg.querySelectorAll('rect[data-tip]')]; if (!rs.length) return;
    rs.forEach((rc, i) => {
      rc.style.transformBox = 'fill-box'; rc.style.transformOrigin = '50% 100%';
      const sp = new Spring(0, 120, 8); sp.to = 1; const w = new Spring(1, 300, 9);
      const put = () => { rc.style.transform = `scale(${w.x.toFixed(3)},${Math.max(0, sp.x).toFixed(3)})`; };
      const job = { el: rc, delay: i * .035, run: dt => { const a = sp.step(dt), b = w.step(dt); put(); return a || b; }, settle: () => { sp.settle(); w.settle(); rc.style.transform = ''; } };
      put(); add(job);
      rc.addEventListener('pointerenter', () => { sp.v += 2.2; w.v -= 3; if (!jobs.has(job)) { job.delay = 0; add(job); } });
    });
  }
  /* ---------- Líneas: se levantan desde la base como marea ---------- */
  function lines(svg) {
    if (svg._lq) return; svg._lq = 1;
    const g = svg.querySelectorAll('.ln'); if (!g.length) return;
    const base = svg.dataset.base || '100%'; const sp = new Spring(0, 70, 7); sp.to = 1;
    g.forEach(el => { el.style.transformBox = 'view-box'; el.style.transformOrigin = `0 ${base}px`; });
    const put = () => g.forEach(el => { el.style.transform = `scaleY(${Math.max(0, sp.x).toFixed(3)})`; });
    put(); add({ el: svg, run: dt => { const a = sp.step(dt); put(); return a; }, settle: () => { sp.settle(); g.forEach(el => { el.style.transform = ''; }); } });
  }
  /* ---------- Barras HTML (medidores): se llenan como carga y chapotean al final ---------- */
  const BAR_SEL = '.meter i, .bar i, .qz-meter i, .mine-bar i, .fl-stack i, .hb-fill, .lq-bar';
  function htmlBar(el, i) {
    if (el._lq) return; el._lq = 1;
    const w = el.style.width; const m = /^([\d.]+)%$/.exec(w || ''); const flex = el.style.flex;
    if (m) {
      const to = +m[1]; const sp = new Spring(0, 85, 9); sp.to = to;
      const put = () => { el.style.width = `${Math.max(0, sp.x).toFixed(2)}%`; };
      put(); add({ el, delay: Math.min(i, 14) * .03, run: dt => { const a = sp.step(dt); put(); return a; }, settle: () => { sp.settle(); el.style.width = w; } });
    } else {
      el.style.transformOrigin = '0 50%'; const sp = new Spring(0, 95, 7.5); sp.to = 1;
      const put = () => { el.style.transform = `scaleX(${Math.max(0, sp.x).toFixed(3)})`; };
      put(); add({ el, delay: Math.min(i, 14) * .03, run: dt => { const a = sp.step(dt); put(); return a; }, settle: () => { sp.settle(); el.style.transform = ''; } });
    }
  }
  /* ---------- Cifras: cuentan rápido hasta su valor ---------- */
  const NUM_SEL = '.hero .big, .mine-big, .stat .v, .ledger b.num, .gauge .g-c b, .rings .c b, .donut .c b, .fl-big, .cs-tile b, .mine-row > b.num, .fl-part-big, .meter-l span';
  function countUp(el) {
    if (el._lqn || el.children.length) return; const txt = el.textContent;
    const m = /^(.*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s.exec(txt); if (!m) return; el._lqn = 1;
    const val = parseFloat(m[2].replace(/,/g, '')); if (!val) return; const dec = (m[2].split('.')[1] || '').length;
    const fmt = v => m[1] + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3];
    const t0 = performance.now(), D = 700;
    const job = { el, run: () => { const k = Math.min(1, (performance.now() - t0) / D); const e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(val * e); return k < 1; }, settle: () => { el.textContent = txt; } };
    el.textContent = fmt(0); add(job);
  }
  /* ---------- Recuadros: gelatina al tocar, onda suave al pasar ---------- */
  const JELLY = '.stat, .cs-tile, .fl-part, .mine-row, .addopt, .ledger, .gauge-c, .hb-row, .cs-row, .bud, .pet-opt, .chartc .donut';
  function jelly(el, kick = 1) {
    if (reduce()) return;
    let j = el._jelly;
    if (!j) {
      const sp = new Spring(0, 260, 9);
      j = el._jelly = { sp, job: { el, run: dt => { const a = sp.step(dt); const x = sp.x; el.style.transform = Math.abs(x) < .0005 && !a ? '' : `scale(${(1 + x * .045).toFixed(4)},${(1 - x * .045).toFixed(4)})`; return a; }, settle: () => { sp.settle(); el.style.transform = ''; } } };
    }
    j.sp.v += 9 * kick; if (!jobs.has(j.job)) add(j.job);
  }
  let bound = false;
  function bindGlobal() {
    if (bound) return; bound = true;
    document.addEventListener('pointerdown', e => { const t = e.target.closest && e.target.closest(JELLY); if (t) jelly(t, -1); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest && e.target.closest(JELLY); if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return; jelly(t, .35);
    }, { passive: true });
  }

  /* Al pintar una vista: todo lo nuevo entra con oleaje */
  function enter(root, fresh = true) {
    bindGlobal();
    if (reduce() || !root || !fresh) return;
    root.querySelectorAll(NUM_SEL).forEach(countUp);
    root.querySelectorAll('svg[data-lq=rings]').forEach(rings);
    root.querySelectorAll('svg[data-lq=donut]').forEach(donut);
    root.querySelectorAll('svg[data-lq=bars]').forEach(svgBars);
    root.querySelectorAll('svg[data-lq=lines]').forEach(lines);
    root.querySelectorAll(BAR_SEL).forEach(htmlBar);
    root.querySelectorAll('svg[data-lq=gauge]').forEach(gauge);
  }
  /* Medidor semicircular: la aguja llega con vaivén */
  function gauge(svg) {
    if (svg._lq) return; svg._lq = 1;
    const fill = svg.querySelector('.g-fill'); const L = +svg.dataset.len, to = +svg.dataset.v; if (!fill) return;
    const sp = new Spring(0, 80, 6.5); sp.to = to;
    const put = () => { fill.style.strokeDasharray = `${(Math.max(0, Math.min(1.04, sp.x)) * L).toFixed(1)} ${L * 2}`; };
    put(); add({ el: svg, run: dt => { const a = sp.step(dt); put(); return a; }, settle: () => { sp.settle(); put(); } });
    svg.addEventListener('pointerdown', () => { sp.v += 1.4; add({ el: svg, run: dt => { const a = sp.step(dt); put(); return a; }, settle: () => { sp.settle(); put(); } }); });
  }
  /* Rebote para cualquier elemento (juguetes del gato) */
  function boing(el, amt = 1) {
    if (reduce() || !el) return;
    const sp = new Spring(0, 220, 7); sp.v = -10 * amt;
    add({ el, run: dt => { const a = sp.step(dt); el.style.transform = `translateY(${(sp.x * 6).toFixed(2)}px) scale(${(1 - sp.x * .06).toFixed(3)},${(1 + sp.x * .06).toFixed(3)})`; return a; }, settle: () => { el.style.transform = ''; } });
  }
  return { enter, settle, jelly, boing, Spring };
})();
