/* ===== Raw Money · Mi gato: sombreritos, juguetes y camita en pixel art ===== */
const PIX_O = '#3A2230';
const PIX = {
  // juguetes
  hueso: { name: 'Huesito', pal: { O: PIX_O, W: '#F6EFE3', S: '#D9CDBA' }, rows: ['.OO........OO.', 'OWWO......OWWO', 'OWWWOOOOOOWWWO', '.OWWWWWWWWWWO.', 'OWSSOOOOOOSSWO', 'OWSO......OSWO', '.OO........OO.'] },
  pescado: { name: 'Pescadito', pal: { D: '#24496B', L: '#8FC6E8', B: '#4F93C4', K: '#1B1420' }, rows: ['....DDDDD....D', '..DDLLLLLDD.DB', '.DLKLLLLLLLDBD', 'DLLLLLLLLLLLBD', '.DBBBBBBBBBDBD', '..DDBBBBBDD.DB', '....DDDDD....D'] },
  pelota: { name: 'Pelota', pal: { O: PIX_O, R: '#E0525E', W: '#FFE9EC', Y: '#F5C84B', D: '#A8323F' }, rows: ['...OOOO...', '.OORRRROO.', '.ORWWRRRO.', 'ORWRRRRRRO', 'ORRRRRRRRO', 'OYYYYYYYYO', 'ORRRRRRRDO', '.ORRRRRDO.', '.OODDDDOO.', '...OOOO...'] },
  patito: { name: 'Patito', pal: { O: PIX_O, Y: '#F7D54A', D: '#E2B023', N: '#F08A2C', K: '#1B1420' }, rows: ['....OOOO....', '...OYYYYO...', '..OYKYYYO...', '.NNOYYYYO...', '..OOYYYYOOO.', '.OYYYYYYYYYO', 'OYYDDDDYYYYO', 'OYYYYYYYYYO.', '.OYYYYYYYO..', '..OOOOOOO...'] },
  estambre: { name: 'Estambre', pal: { O: PIX_O, P: '#E98BB0', Q: '#B8507A' }, rows: ['...OOOO...', '.OOPPQPOO.', '.OPQPPQPO.', 'OPPQPPPQPO', 'OPQPPPQPPO', 'OQPPPQPPPO', 'OPPPQPPQPO', '.OPQPPQPO.', '.OOPQPPOO.', '...OOOO.OO'] },
  raton: { name: 'Ratoncito', pal: { O: PIX_O, G: '#B9B2BC', P: '#F2A7C3', K: '#1B1420', N: '#E77A9E' }, rows: ['.OO.OO......', 'OPPOPPO.....', '.OGGGGGOO...', 'OGKGGGGGGO..', 'NGGGGGGGGGO.', '.OGGGGGGGGOO', '..OOOOOOOO.O', '..........OO'] },
  // sombreros (la última fila se apoya en la cabeza)
  fiesta: { name: 'Gorro de fiesta', hat: 1, pal: { O: PIX_O, W: '#FFFFFF', P: '#E9628E', Y: '#F5C84B' }, rows: ['....W....', '...WWW...', '....O....', '...OPO...', '...OYO...', '..OPPPO..', '..OYYYO..', '.OPPPPPO.', 'OOOOOOOOO'] },
  corona: { name: 'Corona', hat: 1, pal: { O: PIX_O, G: '#F2C443', R: '#D9425A' }, rows: ['O....O....O', 'OGO.OGO.OGO', 'OGGOGGGOGGO', 'OGGGGRGGGGO', 'OGGGGGGGGGO', 'OOOOOOOOOOO'] },
  copa: { name: 'Sombrero de copa', hat: 1, pal: { O: PIX_O, K: '#2B2230', R: '#C24A63' }, rows: ['..OOOOOOO..', '..OKKKKKO..', '..OKKKKKO..', '..OKKKKKO..', '..ORRRRRO..', '..OKKKKKO..', 'OOOKKKKKOOO', 'OKKKKKKKKKO', 'OOOOOOOOOOO'] },
  mono: { name: 'Moño', hat: 1, pal: { O: PIX_O, P: '#F08AB0' }, rows: ['.OO.....OO.', 'OPPO...OPPO', 'OPPPOOOPPPO', 'OPPPOPOPPPO', 'OPPPOOOPPPO', 'OPPO...OPPO', '.OO.....OO.'] },
  lana: { name: 'Gorro de lana', hat: 1, pal: { O: PIX_O, W: '#FFF6EA', B: '#4F93C4' }, rows: ['....OWO....', '...OWWWO...', '..OOBBBOO..', '.OBBBBBBBO.', 'OBBBBBBBBBO', 'OWWWWWWWWWO', 'OWBWBWBWBWO', 'OOOOOOOOOOO'] },
  chef: { name: 'Gorro de chef', hat: 1, pal: { O: PIX_O, W: '#FFFFFF', S: '#E3DCD3' }, rows: ['..OOO.OOO..', '.OWWWOWWWO.', 'OWWWWWWWWWO', 'OWWWWWWWWWO', '.OWWWWWWWO.', '..OWWWWWO..', '..OWWWWWO..', '..OSSSSSO..', '..OOOOOOO..'] },
  vaquero: { name: 'Sombrero vaquero', hat: 1, pal: { O: PIX_O, B: '#9A6235', D: '#7A4A26', R: '#D9425A' }, rows: ['....OOOOO....', '...OBBDBBO...', '...OBBBBBO...', 'OO.ORRRRRO.OO', 'OBOOBBBBBOOBO', '.OBBBBBBBBBO.', '..OOOOOOOOO..'] },
};
const TOYS = ['hueso', 'pescado', 'pelota', 'patito', 'estambre', 'raton'];
const HATS = ['fiesta', 'corona', 'copa', 'mono', 'lana', 'chef', 'vaquero'];
const BED_COLORS = [['#D2607E', 'Rosa'], ['#4F93C4', 'Azul'], ['#3C9B7C', 'Verde'], ['#D9A13B', 'Mostaza'], ['#8B6BB0', 'Lila']];
function bedDef(c) {
  const L = `color-mix(in srgb, ${c} 35%, #FFF6EA)`;
  const r = (a, n, b) => a + b.repeat(n);
  const back = ['......' + 'O'.repeat(18) + '......', '....OO' + 'C'.repeat(18) + 'OO....', '...O' + 'C'.repeat(22) + 'O...', '..OCC' + 'O'.repeat(20) + 'CCO..', '..OCO' + 'L'.repeat(20) + 'OCO..', '.OCCO' + 'L'.repeat(20) + 'OCCO.'];
  const front = ['OCCCC' + 'O'.repeat(20) + 'CCCCO', 'O' + 'C'.repeat(28) + 'O', '.O' + 'C'.repeat(26) + 'O.', '..' + 'O'.repeat(26) + '..'];
  const pal = { O: PIX_O, C: c, L };
  return { back: { pal, rows: [...back, ...front.map(x => x.replace(/./g, '.'))] }, front: { pal, rows: [...back.map(x => x.replace(/./g, '.')), ...front] } };
}
/* Pinta una matriz de pixeles como SVG nítido (une pixeles seguidos del mismo color) */
function pixSVG(def, px = 1, cls = '') {
  const h = def.rows.length, w = Math.max(...def.rows.map(r => r.length)); let out = '';
  def.rows.forEach((row, y) => { let x = 0; while (x < row.length) { const ch = row[x]; if (ch === '.' || !def.pal[ch]) { x++; continue; } let n = 1; while (row[x + n] === ch) n++; out += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${def.pal[ch]}"/>`; x += n; } });
  return `<svg class="pix ${cls}" viewBox="0 0 ${w} ${h}" width="${w * px}" height="${h * px}" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
}
const pixW = def => Math.max(...def.rows.map(r => r.length)), pixH = def => def.rows.length;
function petState() { const p = S.data.pet || (S.data.pet = {}); if (!Array.isArray(p.toys)) p.toys = []; if (!p.bedColor) p.bedColor = BED_COLORS[0][0]; return p; }
/* Dónde va el sombrero en cada fila/cuadro del sprite: [centro x, fila donde se apoya, giro] */
function hatAnchor(row, frame) {
  switch (row) {
    case 0: return [16.5, 19, 0];
    case 1: return [23.5, 17, 4];
    case 2: return [16.5, 14, 0];
    case 3: return [9.5, 17, -4];
    case 4: case 5: return [16.5, 16, 0];
    case 6: return frame < 2 ? [23.5, 19, 6] : [24, 22, 10];
    case 7: return frame < 2 ? [16.5, 19, -14] : [22, 20, 8];
  }
  return [16.5, 16, 0];
}
function hatHTML(id, scale, row, frame) {
  const d = PIX[id]; if (!d) return ''; const [ax, by, rot] = hatAnchor(row, frame); const w = pixW(d), h = pixH(d);
  return `<span class="hat" style="left:${((ax - w / 2) * scale).toFixed(1)}px;top:${((by - h + 1) * scale).toFixed(1)}px;rotate:${rot}deg">${pixSVG(d, scale)}</span>`;
}

/* ---------- Vista: Mi gato ---------- */
function viewGato() {
  const p = petState(); const sc = innerWidth < 640 ? 4 : 5; const cell = 32 * sc;
  const sleeping = !!p.bed; const row = sleeping ? 7 : 4, frame = sleeping ? 0 : 2;
  const bed = p.bed ? bedDef(p.bedColor) : null; const bedW = 30 * sc;
  const toys = p.toys.filter(t => PIX[t]);
  const opt = (id, on, attr, label, svg) => `<button class="pet-opt${on ? ' on' : ''}" ${attr} aria-pressed="${on}"><span class="pet-ic">${svg}</span><span>${label}</span>${on ? `<i class="pet-ok">${icon('check')}</i>` : ''}</button>`;
  return `
  <div class="ph"><div><div class="eyebrow">Tu compañero</div><h1 class="squig">${p.name ? esc(p.name) : 'Mi gato'}</h1><p>Ponle nombre, sombrerito, juguetes y una camita. Todo aparece con él abajo, mientras usas la app.</p></div>
    <div class="acts"><button class="btn" data-pet-call>${icon('paw')}<span>Llamarlo</span></button><button class="btn primary" data-pet-nap>${icon('cal')}<span>A dormir</span></button></div></div>
  <section class="card pet-stage">
    <div class="pet-room" style="--sc:${sc}px">
      <div class="pet-wall"></div><div class="pet-floor"></div>
      ${toys.map((t, i) => `<span class="pet-toy" data-toy="${t}" style="left:${[3, 80, 14, 90, 25, 70][i] ?? 3}%">${pixSVG(PIX[t], sc * .8)}</span>`).join('')}
      <div class="pet-cat${sleeping ? ' sleeping' : ''}" style="width:${cell}px;height:${cell}px">
        ${bed ? `<span class="pet-bed b" style="width:${bedW}px;left:${(cell - bedW) / 2}px">${pixSVG(bed.back, sc)}</span>` : ''}
        <span class="spr" style="background-image:url('${CAT_SPRITE}');background-size:${cell * 4}px ${cell * 8}px;background-position:${-frame * cell}px ${-row * cell}px"></span>
        ${p.hat ? hatHTML(p.hat, sc, row, frame) : ''}
        ${bed ? `<span class="pet-bed f" style="width:${bedW}px;left:${(cell - bedW) / 2}px">${pixSVG(bed.front, sc)}</span>` : ''}
        ${sleeping ? '<span class="zz" aria-hidden="true"><i>z</i><i>z</i><i>Z</i></span>' : ''}
      </div>
    </div>
    <p class="pet-cap">${sleeping ? `${p.name ? esc(p.name) : 'Tu gato'} está en su camita. Con camita duerme más seguido y por más rato.` : `Toca los juguetes para que ${p.name ? esc(p.name) : 'tu gato'} juegue con ellos.`}</p>
  </section>
  <section class="pet-grid">
    <div class="card"><div class="ch"><h2>Nombre</h2></div><input class="inp" data-pet-name maxlength="20" placeholder="Ej. Michi, Naranjo, Tofu" value="${esc(p.name || '')}"></div>
    <div class="card"><div class="ch"><h2>Camita</h2><span class="ch-sub">${p.bed ? 'duerme más' : 'opcional'}</span></div>
      <div class="pet-opts">${opt('bed', !!p.bed, 'data-pet-bed', p.bed ? 'Con camita' : 'Sin camita', pixSVG({ pal: bedDef(p.bedColor).front.pal, rows: [...bedDef(p.bedColor).back.rows.slice(0, 6), ...bedDef(p.bedColor).front.rows.slice(6)] }, 2))}</div>
      <div class="pet-colors">${BED_COLORS.map(([c, n]) => `<button class="pet-col${p.bedColor === c ? ' on' : ''}" data-pet-color="${c}" style="--c:${c}" aria-label="Camita ${n}" title="${n}"></button>`).join('')}</div></div>
    <div class="card wide"><div class="ch"><h2>Sombreritos</h2><span class="ch-sub">uno a la vez</span></div>
      <div class="pet-opts">${opt('', !p.hat, 'data-pet-hat=""', 'Ninguno', `<span class="pet-none">${icon('x')}</span>`)}${HATS.map(h => opt(h, p.hat === h, `data-pet-hat="${h}"`, PIX[h].name, pixSVG(PIX[h], 3))).join('')}</div></div>
    <div class="card wide"><div class="ch"><h2>Juguetes</h2><span class="ch-sub">elige los que quieras</span></div>
      <div class="pet-opts">${TOYS.map(t => opt(t, p.toys.includes(t), `data-pet-toy="${t}"`, PIX[t].name, pixSVG(PIX[t], 3))).join('')}</div></div>
  </section>`;
}
function bindGato(root) {
  const p = petState(); const redo = () => { saveData(); Cat.refresh(); const y = scrollY; render(); window.scrollTo(0, y); };
  root.querySelectorAll('[data-pet-hat]').forEach(b => b.addEventListener('click', () => { p.hat = b.dataset.petHat || ''; redo(); if (p.hat) Cat.say('meow~'); }));
  root.querySelectorAll('[data-pet-toy]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.petToy; p.toys = p.toys.includes(t) ? p.toys.filter(x => x !== t) : [...p.toys, t]; redo(); }));
  root.querySelectorAll('[data-pet-bed]').forEach(b => b.addEventListener('click', () => { p.bed = !p.bed; redo(); }));
  root.querySelectorAll('[data-pet-color]').forEach(b => b.addEventListener('click', () => { p.bedColor = b.dataset.petColor; p.bed = true; redo(); }));
  const nm = root.querySelector('[data-pet-name]'); if (nm) nm.addEventListener('change', () => { p.name = nm.value.trim(); redo(); });
  root.querySelectorAll('.pet-toy').forEach(t => t.addEventListener('click', () => { Liquid.boing(t, 1.4); Cat.playWith(t.dataset.toy); }));
  const call = root.querySelector('[data-pet-call]'); if (call) call.addEventListener('click', () => Cat.call());
  const nap = root.querySelector('[data-pet-nap]'); if (nap) nap.addEventListener('click', () => Cat.nap());
}
VIEWS.gato = { title: 'Mi gato', icon: 'paw', fn: viewGato, bind: bindGato };
NAV_GROUPS.push(['Compañía', ['gato']]);
