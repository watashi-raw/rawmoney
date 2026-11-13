/* ===== Raw Money · mascota: gatito 8 bits =====
   Un rato duerme y otro rato está despierto: explora, juega (carreritas y brincos), se asea, se sienta a mirar
   y, con mouse, caza el cursor. Si lo tocas reacciona; si registras un ingreso corre feliz y suelta moneditas.
   Se ve encima de las ventanas para capturar datos, pero ahí no estorba los clics.
   Hoja del sprite (img/gatito.png): 4 cuadros de 32 px por fila.
   Filas: 0 abajo · 1 derecha · 2 arriba · 3 izquierda · 4 sentado · 5 aseo · 6 estira · 7 duerme */
const CAT_SPRITE = 'img/gatito.png';
const Cat = (() => {
  const ROW = { down: 0, right: 1, look: 2, left: 3, sit: 4, groom: 5, stretch: 6, sleep: 7 };
  /* Todo lo que dice es "meow", a veces distorsionado */
  const rep = (c, a, b) => c.repeat(a + Math.floor(Math.random() * (b - a + 1)));
  const MEOWS = [
    () => 'meow', () => 'MEOW', () => 'm-e-o-w', () => 'nya', () => 'nyaa~', () => 'mew', () => 'mrrp', () => 'meow?', () => 'meow!!',
    () => `m${rep('e', 3, 9)}ow`, () => `me${rep('o', 3, 9)}w`, () => `M${rep('E', 2, 6)}${rep('O', 2, 6)}W`, () => 'm e o w', () => 'meow meow',
    () => `ny${rep('a', 2, 6)}`, () => 'MEOW?!', () => 'mEoW', () => `m${rep('r', 2, 5)}ow`, () => 'meow…', () => 'NYA!', () => 'm-m-meow',
  ];
  const meow = () => pick(MEOWS)();
  const SAY_TAP = { length: 1, get 0() { return meow(); } };
  const SAY_WAKE = { length: 1, get 0() { return pick(['mrr… meow?', 'meow…?', 'zzz… mew', `m${rep('r', 2, 4)}?`, 'nya…?']); } };
  const SAY_HUNT = { length: 1, get 0() { return pick(['MEOW!', 'NYA!', `M${rep('E', 3, 7)}OW!`, 'mrrrp!', 'm-e-o-w!']); } };
  const SAY_PLAY = { length: 1, get 0() { return pick([`m${rep('e', 4, 9)}ow!`, 'nya nya!', `me${rep('o', 4, 9)}w~`, 'MEOW MEOW']); } };
  const MOVING = ['walk', 'run', 'play', 'hunt'];
  let y = 0, vy = 0, vx = 0, baseTop = 0, grab = null, dragged = false, suppressClick = false, swayT = 0;
  let el, spr, bub, x = 0, targetX = 0, state = 'sleep', frame = 0, frameT = 0, stateT = 0, stateDur = 0, last = 0, raf = 0, bubT = 0;
  let scale = 3, facing = 'right', playLeft = 0, huntCool = 0, pounceCool = 0, hoverT = 0, hovering = false, awakeFor = 0;
  const mouse = { x: -1, y: -1, t: -1e9 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const finePointer = () => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return false; } };
  const cell = () => 32 * scale;
  const overlayOpen = () => !!document.querySelector('.drawer, .sheet, .modal');
  const bounds = () => {
    if (overlayOpen()) return [12, Math.max(12, innerWidth - cell() - 12)];   // con ventana abierta puede pasearse por toda la orilla
    const side = document.querySelector('.side'); const r = side && getComputedStyle(side).display !== 'none' ? side.getBoundingClientRect().right : 0;
    return [r + 12, Math.max(r + 12, innerWidth - cell() - 12)];
  };
  const clampX = v => { const [a, b] = bounds(); return Math.min(Math.max(v, a), b); };

  function mount() {
    if (el) return;
    el = document.createElement('button');
    el.type = 'button'; el.className = 'rm-cat'; el.setAttribute('aria-label', 'Gatito de Raw Money: tócalo');
    el.innerHTML = '<span class="spr"></span><span class="bub" aria-live="polite"></span><span class="zz" aria-hidden="true"><i>z</i><i>z</i><i>z</i></span>';
    spr = el.querySelector('.spr'); bub = el.querySelector('.bub');
    spr.style.backgroundImage = `url("${CAT_SPRITE}")`;
    el.addEventListener('click', () => { if (suppressClick) { suppressClick = false; return; } tap(); });
    // arrastrar con el cursor (o el dedo) y soltarlo: cae despacito
    el.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      const r = el.getBoundingClientRect(); baseTop = r.top - y;
      grab = { id: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, lx: e.clientX, lt: performance.now() };
      dragged = false; try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    el.addEventListener('pointermove', e => {
      if (!grab || e.pointerId !== grab.id) return;
      if (!dragged && Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) < 6) return;
      if (!dragged) { dragged = true; set('held'); say(pick(['MEOW?!', 'm-m-meow?', 'nya?!', `M${rep('E', 2, 5)}OW!`]), 1800); el.classList.add('held'); }
      const now = performance.now(); vx = (e.clientX - grab.lx) / Math.max(1, now - grab.lt) * 1000; grab.lx = e.clientX; grab.lt = now;
      x = Math.min(Math.max(e.clientX - grab.ox, 0), innerWidth - cell());
      y = Math.min(0, Math.max(-baseTop, e.clientY - grab.oy - baseTop));
      place();
    });
    const release = e => {
      if (!grab || e.pointerId !== grab.id) return;
      grab = null; el.classList.remove('held');
      if (!dragged) return;                 // fue un toque: lo atiende el click
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 400);
      if (y >= -2) { y = 0; place(); return land(); }
      vy = 0; swayT = 0; set('fall'); el.classList.add('falling');
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('mouseenter', () => { hovering = true; hoverT = 0; });
    el.addEventListener('mouseleave', () => { hovering = false; });
    document.body.appendChild(el);
    measure();
    x = rnd(...bounds()); place();
    set('sleep', rnd(8000, 16000));
    addEventListener('resize', () => { measure(); x = clampX(x); targetX = clampX(targetX); place(); });
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = 0; loop(); } });
    // ventanas para capturar datos: el gatito queda encima, pero sin tapar clics
    new MutationObserver(() => el.classList.toggle('over', overlayOpen())).observe(document.body, { childList: true, subtree: true });
    loop();
  }
  function measure() { scale = innerWidth < 640 ? 2.25 : 3; el.style.setProperty('--cell', cell() + 'px'); }
  function place() { el.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`; }
  function land() {
    el.classList.remove('falling'); spr.style.rotate = '';
    if (!reduce()) { spr.classList.remove('land'); void spr.offsetWidth; spr.classList.add('land'); }
    say(pick(['meow!', 'nya~', 'mrrp!', `me${rep('o', 3, 7)}w`]), 1600); burst(['✦', '·'], 3);
    const [a, b] = bounds();
    if (x < a || x > b) { targetX = clampX(x); set('walk'); } else set('sit', rnd(2500, 4000));
  }
  function draw() {
    const row = state === 'held' || state === 'fall' ? ROW.down : MOVING.includes(state) ? (facing === 'right' ? ROW.right : ROW.left) : ROW[state] ?? ROW.sit;
    spr.style.backgroundPosition = `${-frame * cell()}px ${-row * cell()}px`;
    el.classList.toggle('sleeping', state === 'sleep');
  }
  function face() { if (Math.abs(targetX - x) > 2) facing = targetX > x ? 'right' : 'left'; }
  function set(s, dur = 0) {
    state = s; stateT = 0; stateDur = dur; frame = s === 'sit' ? 2 : 0; frameT = 0;
    if (s === 'sleep') awakeFor = 0;
    if (MOVING.includes(s)) face();
    draw();
  }
  function say(t, ms = 2400) { bub.textContent = t; el.classList.add('talk'); clearTimeout(bubT); bubT = setTimeout(() => el.classList.remove('talk'), ms); }
  function hop(n = 1) {
    if (reduce()) return;
    spr.classList.remove('hop'); void spr.offsetWidth; spr.style.setProperty('--hops', n); spr.classList.add('hop');
  }
  function burst(chars, n = 6) {
    if (reduce()) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span'); p.className = 'rm-cat-p'; p.textContent = pick(chars);
      p.style.setProperty('--dx', `${rnd(-60, 60)}px`); p.style.setProperty('--dy', `${rnd(-90, -45)}px`); p.style.setProperty('--r', `${rnd(-40, 40)}deg`);
      p.style.animationDelay = `${i * 50}ms`;
      el.appendChild(p); setTimeout(() => p.remove(), 1400 + i * 50);
    }
  }

  /* Qué hace después. Despierto pasa ~1–2 min explorando y jugando; luego una siesta corta. */
  function decide() {
    const tired = awakeFor > rnd(60000, 120000);
    const r = Math.random();
    if (tired && r < .7) return set('sleep', rnd(15000, 35000));
    if (reduce()) return r < .5 ? set('sit', rnd(4000, 8000)) : set('groom', rnd(2500, 4000));
    if (r < .34) { targetX = rnd(...bounds()); return set('walk'); }                     // explora
    if (r < .56) { playLeft = 2 + Math.floor(Math.random() * 3); targetX = rnd(...bounds()); say(pick(SAY_PLAY), 1500); return set('play'); } // carreritas
    if (r < .7) return set('look', rnd(2000, 3500));                                     // mira hacia arriba
    if (r < .84) return set('groom', rnd(2500, 4000));
    if (r < .95) return set('sit', rnd(2500, 5000));
    return set('sleep', rnd(12000, 25000));
  }
  function arrive() {
    if (state === 'play') { hop(1); if (--playLeft > 0) { targetX = rnd(...bounds()); set('play'); state = 'play'; return; } return set('sit', rnd(2000, 3500)); }
    if (state === 'run') { hop(2); burst(['$', '$', '✦'], 5); return set('sit', rnd(4000, 6000)); }
    if (state === 'walk') return Math.random() < .5 ? set('look', rnd(1500, 3000)) : set('sit', rnd(2000, 4000));
  }
  function next() {
    if (state === 'sleep') return set('stretch', 1100);
    if (state === 'stretch') return decide();
    if (state === 'hunt') { huntCool = rnd(6000, 14000); return set('sit', rnd(2000, 3500)); }
    return decide();
  }

  /* Cazar el cursor (solo con mouse) */
  function wantsHunt(now) {
    return finePointer() && !reduce() && !grab && state !== 'held' && state !== 'fall' && state !== 'sleep' && state !== 'run' && state !== 'hunt' && state !== 'stretch'
      && huntCool <= 0 && now - mouse.t < 900 && Math.random() < .015;
  }
  function huntTick(dt, now) {
    const idle = now - mouse.t > 3500;
    if (idle || stateT > 22000) return next();
    targetX = clampX(mouse.x - cell() / 2); face();
    const d = targetX - x; const near = Math.abs(d) < 10;
    const low = mouse.y > innerHeight - cell() * 2.4;               // el cursor anda cerca del piso del gatito
    if (!near) { const v = (Math.abs(d) > 160 ? 210 : 95) * dt / 1000; x += Math.sign(d) * Math.min(Math.abs(d), v); place(); el.classList.remove('watch'); return; }
    if (low && pounceCool <= 0) { hop(1); burst(['✦', '!'], 3); say(pick(SAY_HUNT), 1400); pounceCool = 1600; }
    el.classList.toggle('watch', !low);                              // si el cursor está arriba, lo mira
  }

  const SPEED = { sleep: 700, stretch: 260, walk: 150, run: 85, play: 80, hunt: 95, sit: 900, groom: 230, look: 1000 };
  function tick(dt) {
    const now = performance.now();
    if (state === 'held') { spr.style.rotate = reduce() ? '' : `${Math.max(-28, Math.min(28, -vx * .03))}deg`; vx *= .85; frameT += dt; if (frameT > 160) { frameT = 0; frame = (frame + 1) % 4; draw(); } return; }
    if (state === 'fall') {
      // caída lenta, como hojita: poca gravedad, velocidad tope baja y un vaivén
      vy = Math.min(vy + 240 * dt / 1000, 95); y = Math.min(0, y + vy * dt / 1000); swayT += dt;
      if (!reduce()) { spr.style.rotate = `${Math.sin(swayT / 380) * 12}deg`; x = Math.min(Math.max(x + Math.cos(swayT / 380) * 14 * dt / 1000, 0), innerWidth - cell()); }
      place(); if (y >= 0) { y = 0; place(); land(); } return;
    }
    stateT += dt; frameT += dt; huntCool -= dt; pounceCool -= dt;
    if (state !== 'sleep') awakeFor += dt;
    // dormido: si le dejas el cursor encima un rato, se despierta
    if (state === 'sleep' && hovering) { hoverT += dt; if (hoverT > 1400) { hoverT = 0; say(pick(SAY_WAKE)); set('stretch', 1100); } }
    if (wantsHunt(now)) { say('m…', 900); set('hunt'); }
    const fs = SPEED[state] || 400;
    const still = state === 'hunt' && el.classList.contains('watch');
    if (frameT >= fs) {
      frameT = 0;
      if (state === 'sleep') frame = frame ? 0 : 1;
      else if (state === 'sit') frame = frame === 2 ? 3 : 2;
      else if (state === 'look') frame = 0;
      else if (state === 'stretch') frame = Math.min(3, frame + 1);
      else if (!still) frame = (frame + 1) % 4;
      draw();
    }
    if (state === 'hunt') { if (still) { spr.style.backgroundPosition = `0px ${-ROW.look * cell()}px`; } huntTick(dt, now); return; }
    el.classList.remove('watch');
    if (state === 'walk' || state === 'run' || state === 'play') {
      const v = (state === 'run' ? 200 : state === 'play' ? 230 : 48) * dt / 1000; const d = targetX - x;
      if (Math.abs(d) <= v) { x = targetX; place(); arrive(); } else { x += Math.sign(d) * v; place(); }
    } else if (stateDur && stateT >= stateDur) next();
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = t => { if (document.hidden || !el.isConnected || el.hidden) return; if (!last) last = t; const dt = Math.min(100, t - last); last = t; tick(dt); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }

  function tap() {
    if (state === 'held' || state === 'fall') return;
    if (state === 'sleep') { say(pick(SAY_WAKE)); burst(['!', '?'], 2); set('stretch', 1100); return; }
    say(pick(SAY_TAP)); burst(['♥', '♡', '✦'], 4); hop(1);
    if (Math.random() < .4 && !reduce()) { playLeft = 2; targetX = rnd(...bounds()); set('play'); } else set('sit', rnd(3000, 5000));
  }
  function income(amount) {
    if (!el || state === 'held' || state === 'fall') return;
    targetX = clampX(innerWidth / 2 - cell() / 2);
    say(amount ? `+${money0(amount)} ${pick(['MEOW!', 'nya!!', `m${rep('e', 4, 8)}ow!`, 'meow meow!'])}` : 'MEOW!', 3600);
    burst(['$', '¢', '✦', '$'], 8);
    if (reduce()) return set('sit', 4000);
    set('run');
  }
  function sync(locked) { if (!el) return; el.hidden = !!locked; if (!locked && !document.hidden) { last = 0; loop(); } }
  return { mount, income, sync, tap };
})();

// ingresos registrados → el gatito celebra
addEventListener('rm:tx', e => { const t = e.detail || {}; if (t.type === 'ingreso') Cat.income(Number(t.amount) || 0); });
// iOS: activa :active en botones al tocar
document.addEventListener('touchstart', () => {}, { passive: true });
