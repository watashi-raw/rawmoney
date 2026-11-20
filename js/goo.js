/* ===== Raw Money · burbujas líquidas (efecto gota) =====
   Pestañas, selectores y menú lateral: la burbuja de la opción activa se estira
   como gota hacia la nueva, deja gotitas atrás y rebota al llegar.
   Botones principales: sueltan gotitas hacia el cursor y salpican al tocarlos.
   Se monta solo (MutationObserver) sobre lo que pinta render(); con
   «reducir movimiento» no hace nada y todo queda como antes. */
const Goo = (() => {
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  class Sp {
    constructor(v, k = 170, d = 18) { this.x = v; this.v = 0; this.t = v; this.k = k; this.d = d; }
    step(dt) { const f = -this.k * (this.x - this.t) - this.d * this.v; this.v += f * dt; this.x += this.v * dt; }
    get idle() { return Math.abs(this.x - this.t) < .05 && Math.abs(this.v) < .05; }
    snap(v) { this.x = this.t = v; this.v = 0; }
  }

  /* ---- un solo ciclo de animación que se apaga cuando todo está quieto ---- */
  const jobs = new Set(); let raf = 0, last = 0, T = 0;
  function wake(job) { jobs.add(job); if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    const dt = Math.min(.032, (now - last) / 1000); last = now; T += dt;
    for (const j of jobs) if (!j(dt)) jobs.delete(j);
    raf = jobs.size ? requestAnimationFrame(frame) : 0;
  }

  function ensureFilter() {
    if (document.getElementById('rm-goo')) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<filter id="rm-goo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="g"/><feComposite in="SourceGraphic" in2="g" operator="atop"/></filter>';
    document.body.appendChild(s);
  }

  /* ================= pestañas y selectores ================= */
  const TABS = [
    { sel: '.vtabs', items: 'button', act: el => el.querySelector('button.on'), key: () => 'vtabs', cls: 'gt-tone' },
    { sel: '.seg', items: 'label', act: el => { const i = el.querySelector('input:checked'); return i && i.closest('label'); }, key: el => 'seg:' + (el.dataset.f || ''), cls: 'gt-tone', live: true },
    { sel: '.side .nav', items: 'a', act: el => el.querySelector('a.on'), key: () => 'nav', cls: 'gt-soft', full: true },
    { sel: '.ph .chips', items: '.chip', act: el => el.querySelector('.chip.on'), key: () => 'chips:' + (typeof S !== 'undefined' ? S.view : ''), cls: 'gt-tone gt-chips', need: 2 },
  ];
  const mem = {};

  function mountTabs(el, def) {
    if (el._goo) return;
    if (def.need && el.querySelectorAll(def.items).length < def.need) return;
    const a0 = def.act(el); if (!a0) return;
    el._goo = true; el.classList.add('goo-tabs', ...def.cls.split(' '));
    const ly = document.createElement('div'); ly.className = 'goo-ly'; ly.setAttribute('aria-hidden', 'true');
    const ind = document.createElement('i'); ind.className = 'goo-ind';
    const hov = document.createElement('i'); hov.className = 'goo-hov';
    ly.append(ind, hov); el.appendChild(ly);
    const key = def.key(el);
    const L = new Sp(0), R = new Sp(0), Tp = new Sp(0), B = new Sp(0);
    const hx = new Sp(0, 230, 20), hy = new Sp(0, 230, 20), hw = new Sp(0, 230, 20), hh = new Sp(0, 230, 20), hs = new Sp(0, 260, 15);
    const drips = [];
    let active = a0;
    const rectOf = it => { const c = el.getBoundingClientRect(), r = it.getBoundingClientRect(); const x = r.left - c.left - el.clientLeft, y = r.top - c.top - el.clientTop; return { l: x, r: x + r.width, t: y, b: y + r.height }; };
    function place(snap) {
      if (!active || !el.isConnected) return;
      const q = rectOf(active); if (q.r - q.l < 1) return;
      const old = { l: L.t, r: R.t, t: Tp.t, b: B.t };
      if (snap) { L.snap(q.l); R.snap(q.r); Tp.snap(q.t); B.snap(q.b); draw(); return; }
      const fast = [330, 22], slow = [105, 14];
      const right = q.l > old.l, down = q.t > old.t;
      [L.k, L.d] = right ? slow : fast; [R.k, R.d] = right ? fast : slow;
      [Tp.k, Tp.d] = down ? slow : fast; [B.k, B.d] = down ? fast : slow;
      L.t = q.l; R.t = q.r; Tp.t = q.t; B.t = q.b;
      // gotitas en el camino
      const fx = (old.l + old.r) / 2, fy = (old.t + old.b) / 2, tx = (q.l + q.r) / 2, ty = (q.t + q.b) / 2;
      const dist = Math.hypot(tx - fx, ty - fy), size = clamp((q.b - q.t) * .5, 12, 22);
      if (dist > 20) for (let n = 1; n <= 3; n++) {
        const d = document.createElement('i'); d.className = 'goo-drip'; d.style.width = d.style.height = size + 'px';
        ly.appendChild(d); drips.push({ d, x: fx + (tx - fx) * n / 4 - size / 2, y: fy + (ty - fy) * n / 4 - size / 2, life: 0, delay: .03 + n * .05 });
      }
      wake(tick);
    }
    function draw() {
      const sp = Math.abs(L.v) + Math.abs(R.v) + Math.abs(Tp.v) + Math.abs(B.v), sq = 1 - clamp(sp / 6500, 0, .22);
      const w = Math.max(0, R.x - L.x), h = Math.max(0, B.x - Tp.x), horiz = Math.abs(L.v) + Math.abs(R.v) >= Math.abs(Tp.v) + Math.abs(B.v);
      ind.style.cssText = `left:${L.x}px;top:${Tp.x}px;width:${w}px;height:${h}px;transform:scale(${horiz ? 1 : sq},${horiz ? sq : 1})`;
      hov.style.cssText = `left:${hx.x}px;top:${hy.x}px;width:${hw.x}px;height:${hh.x}px;transform:scale(${Math.max(0, hs.x)})`;
      mem[key] = { l: L.x, r: R.x, t: Tp.x, b: B.x, ts: Date.now() };
    }
    function tick(dt) {
      [L, R, Tp, B, hx, hy, hw, hh, hs].forEach(s => s.step(dt));
      for (let k = drips.length - 1; k >= 0; k--) {
        const p = drips[k]; p.life += dt; const t = Math.max(0, p.life - p.delay), s = t > 0 ? Math.max(0, 1.1 - t * 2.8) : 0;
        p.d.style.transform = `translate(${p.x}px,${p.y}px) scale(${s})`;
        if (t > 0 && s <= 0) { p.d.remove(); drips.splice(k, 1); }
      }
      draw();
      if (!el.isConnected) return false;
      return drips.length || ![L, R, Tp, B, hx, hy, hw, hh, hs].every(s => s.idle);
    }
    // arranca desde donde estaba la burbuja antes de volver a pintar la pantalla
    const prev = mem[key], q0 = rectOf(a0);
    if (prev && Date.now() - prev.ts < 2500 && q0.r - q0.l > 1 && (Math.abs(prev.l - q0.l) > 2 || Math.abs(prev.t - q0.t) > 2)) {
      L.snap(prev.l); R.snap(prev.r); Tp.snap(prev.t); B.snap(prev.b); draw(); place(false);
    } else place(true);
    // pasar el cursor: sale una gotita (o la burbuja completa en el menú)
    el.addEventListener('pointerover', e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const it = e.target.closest && e.target.closest(def.items); if (!it || !el.contains(it) || it.closest('.goo-ly')) return;
      if (it === active) { hs.t = 0; wake(tick); return; }
      const q = rectOf(it);
      let tx, ty, tw, th;
      if (def.full) { tx = q.l; ty = q.t; tw = q.r - q.l; th = q.b - q.t; }
      else { tw = clamp((q.r - q.l) * .4, 16, 60); th = 7; tx = (q.l + q.r) / 2 - tw / 2; ty = q.b - th - 4; }
      const fresh = hs.x < .05;
      hx.t = tx; hy.t = ty; hw.t = tw; hh.t = th; if (fresh) { hx.snap(tx); hy.snap(ty); hw.snap(tw); hh.snap(th); }
      hs.t = 1; wake(tick);
    });
    el.addEventListener('pointerleave', () => { hs.t = 0; wake(tick); });
    if (def.live) el.addEventListener('change', () => { const a = def.act(el); if (a && a !== active) { active = a; hs.t = 0; place(false); } });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => place(true)).observe(el);
  }

  /* ================= botones que sueltan gotitas ================= */
  const BTN_SEL = '.btn.primary, .btn.green, .bottom a.fab > i';
  const btns = [];
  function mountBtn(b) {
    if (b._goo) return; b._goo = true;
    b.classList.add('goo-btn');
    const ly = document.createElement('span'); ly.className = 'goo-bly'; ly.setAttribute('aria-hidden', 'true');
    const core = document.createElement('i'); core.className = 'goo-core'; ly.appendChild(core);
    b.appendChild(ly);
    const w = b.offsetWidth || 160, h = b.offsetHeight || 40;
    const n = clamp(Math.round(w / 30), 3, 8), size = clamp(h * .58, 18, 30);
    const ds = [];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i'); d.className = 'goo-d'; d.style.width = d.style.height = size + 'px'; d.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`; ly.appendChild(d);
      const rx = n === 1 ? 0 : ((i + .5) / n - .5) * Math.max(0, w - size), ry = ((i * 7) % 3 - 1) * Math.max(0, h - size) * .3;
      const order = ((i * 37) % n) / Math.max(1, n - 1);
      ds.push({ d, i, rx, ry, order, x: new Sp(rx, 80 + order * 90, 8 + order * 5), y: new Sp(ry, 80 + order * 90, 8 + order * 5) });
    }
    const sx = new Sp(1, 220, 10);
    const o = { b, ly, core, ds, sx, w, h, near: 0 };
    o.tick = dt => {
      sx.step(dt); core.style.transform = `scale(${sx.x},${2 - sx.x})`;
      ds.forEach(p => { p.x.step(dt); p.y.step(dt); p.d.style.transform = `translate(${p.x.x}px,${p.y.x}px)`; });
      if (!b.isConnected) return false;
      return !(sx.idle && ds.every(p => p.x.idle && p.y.idle));
    };
    o.aim = (px, py) => {
      const W = b.offsetWidth || o.w, H = b.offsetHeight || o.h;
      const ex = Math.max(0, Math.abs(px) - W / 2), ey = Math.max(0, Math.abs(py) - H / 2), edge = Math.hypot(ex, ey);
      const near = clamp(1 - edge / 120, 0, 1); if (!near && !o.near) return; o.near = near;
      const lx = W / 2 + 26, lyy = H / 2 + 26; // hasta dónde pueden salir
      sx.t = 1 + .05 * near;
      ds.forEach(p => {
        const reach = clamp(near * 1.6 - p.order * .5, 0, 1), e = reach * reach * (3 - 2 * reach), k = e * (.55 + p.order * .4);
        p.x.t = clamp(p.rx + (px - p.rx) * k, -lx, lx); p.y.t = clamp(p.ry + (py - p.ry) * k, -lyy, lyy);
      });
      wake(o.tick);
    };
    o.home = () => { o.near = 0; sx.t = 1; ds.forEach(p => { p.x.t = p.rx; p.y.t = p.ry; }); wake(o.tick); };
    o.splash = (big) => {
      ds.forEach((p, i) => { const a = i / ds.length * Math.PI * 2 + .4; p.x.v += Math.cos(a) * (big ? 900 : 650); p.y.v += Math.sin(a) * (big ? 900 : 480) - (big ? 500 : 0); });
      sx.v += big ? 8 : 5; wake(o.tick);
    };
    (b.closest('a.fab') || b).addEventListener('pointerdown', () => o.splash(!!b.closest('a.fab')));
    btns.push(o);
  }
  let mx = -1e4, my = -1e4, pending = false;
  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (pending) return; pending = true;
    requestAnimationFrame(() => {
      pending = false;
      for (let i = btns.length - 1; i >= 0; i--) {
        const o = btns[i]; if (!o.b.isConnected) { btns.splice(i, 1); continue; }
        if (o.b.disabled) continue;
        const r = o.b.getBoundingClientRect(); if (!r.width) continue;
        const px = mx - (r.left + r.width / 2), py = my - (r.top + r.height / 2);
        const far = Math.abs(px) > r.width / 2 + 140 || Math.abs(py) > r.height / 2 + 140;
        if (far) { if (o.near) o.home(); continue; }
        o.aim(px, py);
      }
    });
  }

  /* ================= montaje automático ================= */
  let queued = false;
  function scan() {
    queued = false;
    TABS.forEach(def => document.querySelectorAll(def.sel).forEach(el => { if (el.offsetParent !== null || el.getClientRects().length) mountTabs(el, def); }));
    document.querySelectorAll(BTN_SEL).forEach(b => { if (!b.closest('.goo-ly, .goo-bly')) mountBtn(b); });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  function init() {
    if (reduce() || typeof MutationObserver === 'undefined') return;
    ensureFilter();
    new MutationObserver(muts => { for (const m of muts) if (m.type === 'attributes' || m.addedNodes.length) { queue(); return; } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', () => btns.forEach(o => o.near && o.home()));
    queue();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { scan, Sp };
})();
