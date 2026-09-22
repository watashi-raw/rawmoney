/* ===== Raw Money · portada estilo SAMSARA: flores en ASCII sobre frutas desenfocadas + candado ===== */
const LOCK_KEY = 'midinero.lock'; const UNLOCK_KEY = 'midinero.unlocked';
function hash(i, j, s = 0) { let h = (i * 374761393 + j * 668265263 + s * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; h = h ^ (h >>> 16); return ((h >>> 0) % 1000) / 1000; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* Pétalo de bezier con gradiente (adaptado del arte de Samsara) */
function petal(g, angle, len, wid, c0, c1, curve = 0.5) {
  g.save(); g.rotate(angle);
  const grad = g.createLinearGradient(0, 0, len, 0); grad.addColorStop(0, c0); grad.addColorStop(.55, c1); grad.addColorStop(1, 'rgba(255,255,255,.6)');
  g.fillStyle = grad; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * .25, -wid * curve, len * .85, -wid, len, 0); g.bezierCurveTo(len * .85, wid, len * .25, wid * curve, 0, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(26,18,32,.35)'; g.lineWidth = 1; g.stroke();
  g.strokeStyle = 'rgba(26,18,32,.18)'; g.lineWidth = .8;
  for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(len * .1, 0); g.quadraticCurveTo(len * .5, k * wid * .28, len * .92, k * wid * .18); g.stroke(); }
  g.restore();
}
/* Orquídea phalaenopsis (adaptada de Samsara) */
function orchidAt(g, cx, cy, s, rot, pal, seed = 1) {
  g.save(); g.translate(cx, cy); g.rotate(rot); const A = Math.PI / 180; const [pink, light, rose, mag] = pal;
  petal(g, (90 + 38) * A, s * .78, s * .24, rose, pink); petal(g, (90 - 38) * A, s * .78, s * .24, rose, pink);
  petal(g, -90 * A, s * .8, s * .22, rose, pink);
  petal(g, (-90 + 62) * A, s * .92, s * .42, pink, light, .35); petal(g, (-90 - 62) * A, s * .92, s * .42, pink, light, .35);
  petal(g, 90 * A, s * .42, s * .16, mag, rose, .6); petal(g, (90 + 22) * A, s * .32, s * .12, mag, rose, .7); petal(g, (90 - 22) * A, s * .32, s * .12, mag, rose, .7);
  g.fillStyle = '#f1e9df'; g.beginPath(); g.ellipse(0, -s * .02, s * .09, s * .12, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = mag; for (let k = 0; k < 26; k++) { const a = hash(k, seed, 2) * Math.PI * 2, rr = s * (.06 + hash(k, seed, 3) * .22); g.globalAlpha = .5 + hash(k, seed, 5) * .5; g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr * .8 + s * .06, 1.2 + hash(k, seed, 6) * 2.4, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; g.restore();
}
/* Lirio: seis pétalos largos y puntiagudos, tres arriba tres abajo, estambres largos */
function lilyPetal(g, angle, len, wid, c0, c1) {
  g.save(); g.rotate(angle);
  const grad = g.createLinearGradient(0, 0, len, 0); grad.addColorStop(0, c1); grad.addColorStop(.5, c0); grad.addColorStop(1, c1);
  g.fillStyle = grad; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * .3, -wid, len * .8, -wid * .55, len, 0); g.bezierCurveTo(len * .8, wid * .55, len * .3, wid, 0, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(26,18,32,.3)'; g.lineWidth = 1; g.stroke();
  g.strokeStyle = 'rgba(26,18,32,.22)'; g.lineWidth = 1; g.beginPath(); g.moveTo(len * .05, 0); g.lineTo(len * .95, 0); g.stroke();
  g.restore();
}
function lilyAt(g, cx, cy, s, rot, pal, seed = 1) {
  g.save(); g.translate(cx, cy); g.rotate(rot); const [c0, c1, dark] = pal;
  for (let k = 0; k < 3; k++) lilyPetal(g, k / 3 * Math.PI * 2 + Math.PI / 6, s * .95, s * .2, c0, c1);
  for (let k = 0; k < 3; k++) lilyPetal(g, k / 3 * Math.PI * 2, s * 1.05, s * .26, c0, c1);
  g.fillStyle = dark; for (let k = 0; k < 40; k++) { const a = hash(k, seed, 9) * Math.PI * 2, rr = s * (.08 + hash(k, seed, 10) * .35); g.globalAlpha = .6; g.beginPath(); g.arc(Math.cos(a) * rr * .6, Math.sin(a) * rr, 1.2, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; g.strokeStyle = '#f1e9df'; g.lineWidth = 1.4;
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .28; const L = s * .55; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * L * .5, Math.sin(a) * L * .5 - s * .1, Math.cos(a) * L, Math.sin(a) * L); g.stroke(); g.fillStyle = dark; g.beginPath(); g.ellipse(Math.cos(a) * L, Math.sin(a) * L, s * .05, s * .025, a, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
/* Peonía: capas concéntricas de pétalos redondeados, más claros hacia afuera */
function peonyAt(g, cx, cy, s, rot, pal, seed = 1) {
  g.save(); g.translate(cx, cy); g.rotate(rot); const [deep, mid, light] = pal;
  const rings = [[14, 1, .34, deep, mid], [11, .78, .34, mid, light], [8, .56, .36, mid, light], [6, .36, .4, deep, mid]];
  rings.forEach(([n, len, wid, a, b], ri) => { for (let k = 0; k < n; k++) { const ang = k / n * Math.PI * 2 + ri * .4 + (hash(k, seed, ri) - .5) * .3; petal(g, ang, s * len * (.9 + hash(k, seed, ri + 5) * .2), s * wid, a, b, .95); } });
  g.fillStyle = '#e9c86a'; for (let k = 0; k < 14; k++) { const a = hash(k, seed, 20) * Math.PI * 2, rr = s * .08 * hash(k, seed, 21); g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.6, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
/* Capa de flores: peonía lila, orquídea cobalto, lirio rosa, orquídea pequeña */
function drawFlowers(W, H, seed = 3) {
  const c = mkCanvas(W, H), g = c.getContext('2d'); const m = Math.min(W, H);
  peonyAt(g, W * .38, H * .44, m * .26, -.3, ['#6f4a90', '#b18fd4', '#e4d3f2'], seed);
  orchidAt(g, W * .74, H * .28, m * .19, .5, ['#9fb4ea', '#dbe3fa', '#5a6fb5', '#2f3f7a'], seed + 1);
  lilyAt(g, W * .7, H * .72, m * .2, .9, ['#e6a6b6', '#f6dde4', '#8f1d43'], seed + 2);
  orchidAt(g, W * .17, H * .8, m * .12, -1.1, ['#e6a6b6', '#f6d3dc', '#c9506f', '#8f1d43'], seed + 3);
  return c;
}
/* Capa de frutas exóticas (mango, pitaya, papaya, higo) muy desenfocadas */
function drawFruits(W, H, seed = 5) {
  const c = mkCanvas(W, H), g = c.getContext('2d');
  const fr = [['#e7a24c', '#b44e2a'], ['#e86a8f', '#a83060'], ['#f1c25a', '#c97a2b'], ['#9d78c4', '#5a3d6e'], ['#f0b86a', '#c8612f'], ['#c9506f', '#8f1d43']];
  for (let k = 0; k < 14; k++) { const [c1, c2] = fr[k % fr.length]; const x = hash(k, seed, 1) * W, y = H * .35 + hash(k, seed, 2) * H * .7, r = Math.min(W, H) * (.09 + hash(k, seed, 3) * .14); const gr = g.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.globalAlpha = .9; g.beginPath(); g.ellipse(x, y, r * (1 + hash(k, seed, 4) * .3), r, hash(k, seed, 5) * 3, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; return c;
}
const RAMP = ' .·:;-~=+*#%@';
function asciiFy(src, cell = 7, boost = 1.2) {
  const w = src.width, h = src.height, out = mkCanvas(w, h), g = out.getContext('2d'); const data = src.getContext('2d').getImageData(0, 0, w, h).data;
  g.font = `600 ${cell + 3}px "IBM Plex Mono", ui-monospace, Menlo, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
    let r = 0, gg = 0, b = 0, a = 0, n = 0;
    for (let yy = y; yy < Math.min(h, y + cell); yy += 2) for (let xx = x; xx < Math.min(w, x + cell); xx += 2) { const i = (yy * w + xx) * 4; r += data[i]; gg += data[i + 1]; b += data[i + 2]; a += data[i + 3]; n++; }
    r /= n; gg /= n; b /= n; a /= n * 255; if (a < .12) continue;
    const lum = (.3 * r + .59 * gg + .11 * b) / 255 * a; const idx = Math.min(RAMP.length - 1, Math.round(lum * (RAMP.length - 1))); if (idx === 0) continue;
    g.fillStyle = `rgba(${Math.min(255, r * boost)},${Math.min(255, gg * boost)},${Math.min(255, b * boost)},${Math.min(1, a + .15)})`;
    g.fillText(RAMP[idx], x + cell / 2, y + cell / 2);
  }
  return out;
}
function glitch(src, seed = 1, amount = 1) {
  const w = src.width, h = src.height, out = mkCanvas(w, h), g = out.getContext('2d'); g.drawImage(src, 0, 0);
  const bands = 5 + Math.floor(hash(seed, 7) * 4);
  for (let k = 0; k < bands; k++) { const y = Math.floor(hash(k, seed, 11) * h * .9), bh = 4 + Math.floor(hash(k, seed, 12) * h * .06); const dx = (hash(k, seed, 13) - .5) * w * .12 * amount, sx = 1 + (hash(k, seed, 14) - .5) * .25 * amount; g.clearRect(0, y, w, bh); g.drawImage(src, 0, y, w, bh, dx + (w - w * sx) / 2, y, w * sx, bh); }
  return out;
}
/* Composición: frutas desenfocadas al fondo, flores en ASCII encima, glitch */
function drawCover(canvas, seed = 3) {
  const W = 720, H = 720; canvas.width = W; canvas.height = H; const g = canvas.getContext('2d');
  g.fillStyle = '#1a1220'; g.fillRect(0, 0, W, H);
  g.save(); g.filter = 'blur(26px)'; g.globalAlpha = .55; g.drawImage(drawFruits(W, H, seed + 2), 0, 0); g.restore();
  g.save(); g.globalAlpha = .35; g.filter = 'blur(10px)'; g.drawImage(drawFruits(W, H, seed + 9), 0, 0); g.restore();
  const flowers = drawFlowers(W, H, seed);
  g.save(); g.globalAlpha = .28; g.filter = 'blur(5px)'; g.drawImage(flowers, 0, 0); g.restore();
  g.drawImage(asciiFy(flowers, 7, 1.25), 0, 0);
  const out = glitch(canvas, seed, 1); g.clearRect(0, 0, W, H); g.drawImage(out, 0, 0);
}

/* ---------- Candado ---------- */
async function sha(str) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
function lockGet() { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null'); } catch (e) { return null; } }
function isUnlocked() { if (typeof CLOUD !== 'undefined' && CLOUD.enabled) return !!CLOUD.user; try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return true; } }
function unlockLocal() { try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {} S.locked = false; render(); }
function lockApp() { try { sessionStorage.removeItem(UNLOCK_KEY); } catch (e) {} S.locked = true; if (typeof CLOUD !== 'undefined' && CLOUD.user) cloudSignOut(); else render(); }

function coverHTML() {
  const lock = lockGet(); const email = (lock && lock.email) || (window.SUPABASE && window.SUPABASE.email) || '';
  return `<section class="login">
    <div class="login-art" aria-hidden="true"><div class="art-frame"><canvas id="cover-art"></canvas><span class="art-num">/01</span><span class="art-cap">Flores<br>y frutas</span></div></div>
    <div class="login-body">
      <h1 class="logo">raw money</h1>
      <form class="login-form" id="gate" autocomplete="on">
        <input type="email" name="email" value="${esc(email)}" autocomplete="username" hidden>
        <div class="field"><label for="gate-pw">Contraseña</label><input id="gate-pw" name="password" type="password" autocomplete="current-password" required></div>
        <p class="form-error" id="gate-err" aria-live="polite"></p>
        <button class="btn primary" type="submit">Entrar</button>
      </form>
    </div>
  </section>`;
}
function bindCover(root) {
  const cv = root.querySelector('#cover-art'); if (cv) { const draw = () => drawCover(cv, 3); if (document.fonts && document.fonts.load) document.fonts.load('600 10px "IBM Plex Mono"').then(draw, draw); else draw(); }
  const f = root.querySelector('#gate'); const err = root.querySelector('#gate-err'); const show = m => { err.textContent = m; };
  const cloud = typeof CLOUD !== 'undefined' && CLOUD.enabled; const lock = lockGet();
  f.addEventListener('submit', async e => {
    e.preventDefault(); show('');
    const email = f.email.value.trim().toLowerCase(); const pw = f.password.value;
    if (cloud) { const { error } = await CLOUD.client.auth.signInWithPassword({ email, password: pw }); if (error) show(/invalid/i.test(error.message) ? 'Correo o contraseña incorrectos' : error.message); return; }
    if (!lock) { if (pw.length < 6) { show('Contraseña incorrecta'); return; } try { localStorage.setItem(LOCK_KEY, JSON.stringify({ email, hash: await sha(email + '|' + pw) })); } catch (x) {} unlockLocal(); return; }
    if (email === lock.email && await sha(email + '|' + pw) === lock.hash) unlockLocal(); else show('Correo o contraseña incorrectos');
  });
  const first = f.querySelector('#gate-pw'); if (first && innerWidth > 900) first.focus();
}

/* Cambiar contraseña local (candado del navegador) */
function formLocalPassword() {
  const lock = lockGet();
  openDrawer({ title: 'Cambiar contraseña', eyebrow: 'Sesión', body: `${lock ? F.text('cur', 'Contraseña actual', '', '', 'type="password" autocomplete="current-password" required') : ''}${F.text('pw1', 'Nueva contraseña', '', '', 'type="password" autocomplete="new-password" required minlength="6"')}${F.text('pw2', 'Repite la nueva contraseña', '', '', 'type="password" autocomplete="new-password" required')}`, saveLabel: 'Guardar',
    onSave: async (o) => { const email = (lock && lock.email) || (window.SUPABASE && window.SUPABASE.email) || ''; if (lock && await sha(email + '|' + o.cur) !== lock.hash) { toast('La contraseña actual no es correcta'); return; } if (o.pw1.length < 6) { toast('Mínimo 6 caracteres'); return; } if (o.pw1 !== o.pw2) { toast('Las contraseñas no coinciden'); return; } try { localStorage.setItem(LOCK_KEY, JSON.stringify({ email, hash: await sha(email + '|' + o.pw1) })); } catch (x) {} closeDrawer(); toast('Contraseña actualizada'); } });
}
