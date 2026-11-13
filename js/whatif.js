/* ===== Raw Money · ¿Y si…? simulador de compras y gastos =====
   Parte de tus promedios reales (últimos 3 meses cerrados) y te deja mover cada gasto.
   Las filas con candado no se tocan; el recorte sugerido sale de las filas libres, en proporción a lo que pesan.
   El escenario se guarda en S.data.whatif (también en la nube si hay sesión). */

/* Meses base: los últimos 3 meses con datos antes del actual; si no hay, el mes actual */
function whatifBaseMonths() {
  const past = monthsWithData().filter(m => m < thisMonth());
  return past.length ? past.slice(-3) : [thisMonth()];
}
/* Escenario inicial a partir de lo que realmente pasó */
function whatifFromReal() {
  const months = whatifBaseMonths(); const n = months.length; const sums = months.map(monthSummary);
  const avg = f => sums.reduce((a, s) => a + f(s), 0) / n;
  const rows = [];
  const catTotals = {}; sums.forEach(s => Object.entries(s.byCat).forEach(([id, v]) => { catTotals[id] = (catTotals[id] || 0) + v; }));
  Object.entries(catTotals).sort((a, b) => b[1] - a[1]).forEach(([id, tot]) => {
    const tx = S.data.transactions.filter(t => t.type === 'gasto' && (t.categoryId || 'otros') === id && months.includes(t.date.slice(0, 7)));
    const fixedShare = tx.length ? sum(tx.filter(t => t.fixed)) / Math.max(1, sum(tx)) : 0;
    rows.push({ id: 'cat:' + id, name: cat(id).name, cat: id, amount: Math.round(tot / n), locked: fixedShare >= .5 });
  });
  const debtsMonthly = sum(S.data.debts.filter(d => !debtInfo(d, thisMonth()).done), d => d.monthly);
  if (debtsMonthly) rows.push({ id: 'deudas', name: 'Pagos de deudas', amount: Math.round(debtsMonthly), locked: true });
  const ahorro = S.data.savingsGoal || Math.round(avg(s => s.ahorro));
  rows.push({ id: 'ahorro', name: 'Ahorro', amount: ahorro, locked: true });
  return { income: Math.round(avg(s => s.ingresos)), rows, item: { name: '', price: 0, months: 6 }, base: months };
}
function whatifState() {
  if (!S.data.whatif || !Array.isArray(S.data.whatif.rows)) S.data.whatif = whatifFromReal();
  return S.data.whatif;
}
let whatifSaveT;
function whatifSave() { clearTimeout(whatifSaveT); whatifSaveT = setTimeout(saveData, 600); }

/* El cálculo: cuánto sobra, cuánto pide la compra y de dónde sale lo que falta */
function whatifCalc(W) {
  const total = sum(W.rows, r => r.amount);
  const sobra = W.income - total;
  const price = Number(W.item.price) || 0; const months = Math.max(1, Number(W.item.months) || 1);
  const monthly = price / months;
  const free = W.rows.filter(r => !r.locked && r.amount > 0); const freeTotal = sum(free, r => r.amount);
  const need = Math.max(0, monthly - sobra);
  const feasible = need <= freeTotal + .5;
  const cuts = {}; if (need > 0 && freeTotal > 0) free.forEach(r => { cuts[r.id] = Math.min(r.amount, need * r.amount / freeTotal); });
  const room = sobra + freeTotal; // lo máximo que podrías liberar al mes recortando todo lo libre
  const minMonths = price && room > 0 ? Math.ceil(price / room) : null;
  const monthsNoCut = price && sobra > 0 ? Math.ceil(price / sobra) : null;
  return { total, sobra, price, months, monthly, need, feasible, cuts, freeTotal, minMonths, monthsNoCut, after: sobra - monthly + (feasible ? need : freeTotal) };
}

const sliderMax = v => Math.max(2000, Math.ceil(Math.max(v, 1) * 2 / 500) * 500);

function viewVerSi() {
  const W = whatifState(); const base = (W.base || whatifBaseMonths());
  const enter = !S._keepScroll;
  const rowIcon = r => { const [ic, cc] = r.cat ? [cat(r.cat).icon || 'dots', col(cat(r.cat).color)] : r.id === 'ahorro' ? ['piggy', '#A3A93A'] : r.id === 'deudas' ? ['bank', '#6B5240'] : ['sparkle', '#9B2B5A']; return `<i class="wf-ic" style="--cc:${cc}">${icon(ic)}</i>`; };
  const rowHtml = (r, i) => `<tr class="wf-row${r.locked ? ' locked' : ''}${r.id === whatifJustAdded ? ' wf-new' : ''}" data-row="${r.id}" style="--d:${i}">
      <td class="wf-lock"><button type="button" class="lockbtn" data-lock="${r.id}" aria-pressed="${r.locked}" aria-label="${r.locked ? 'Soltar' : 'Fijar'} ${esc(r.name)}" title="${r.locked ? 'Fijo: no se recorta' : 'Libre: se puede recortar'}">${r.locked ? LOCK_ON : LOCK_OFF}</button></td>
      <td><div class="wf-name">${rowIcon(r)}<span>${esc(r.name)}</span>${r.custom ? `<button type="button" class="wf-del" data-del="${r.id}" aria-label="Quitar ${esc(r.name)}">${icon('x')}</button>` : ''}</div></td>
      <td><div class="wf-amt"><input type="range" min="0" max="${sliderMax(r.amount)}" step="50" value="${r.amount}" data-range="${r.id}" aria-label="Monto de ${esc(r.name)}"${r.locked ? ' disabled' : ''}><input class="inp num" type="number" min="0" step="50" value="${r.amount}" data-num="${r.id}" aria-label="Monto de ${esc(r.name)}"${r.locked ? ' disabled' : ''}></div></td>
      <td class="wf-sug n" data-sug="${r.id}"></td>
    </tr>`;
  return `
  <div class="ph"><div><div class="eyebrow">Simulador · con tus promedios de ${base.map(monthShort).join(', ')}</div><h1>¿Y si…?</h1><p>Mueve tus gastos, fija los que no quieres tocar y prueba si te alcanza para algo. Nada de esto cambia tus movimientos reales.</p></div>
    <div class="acts"><button class="btn primary" id="wf-frombudget">${icon('target')}<span>Usar mi presupuesto actual</span></button><button class="btn secondary" id="wf-reset">${icon('history')}<span>Volver a mis promedios</span></button></div></div>
  <section class="wf-hero${enter ? ' wf-enter' : ''}">
    <div class="wf-buy"><h2><i class="wf-hi">${icon('bag')}</i>Quiero comprar…</h2>
      <div class="fr"><div class="f"><label for="wf-item">¿Qué?</label><input class="inp" id="wf-item" value="${esc(W.item.name)}" placeholder="Ej. Bicicleta, viaje, laptop"></div>
        <div class="f"><label for="wf-price">¿Cuánto cuesta?</label><input class="inp num" id="wf-price" type="number" min="0" step="100" value="${W.item.price || ''}" placeholder="0"></div></div>
      <div class="f"><label for="wf-months">¿En cuántos meses? <b id="wf-months-l">${W.item.months}</b></label><input type="range" id="wf-months" min="1" max="24" step="1" value="${W.item.months}"><div class="hint">A meses sin intereses o juntándolo: es lo que apartas cada mes.</div></div>
      <div class="f"><label for="wf-income">Lo que entra al mes</label><div class="wf-inc"><input type="range" id="wf-income-r" min="0" max="${sliderMax(W.income)}" step="100" value="${W.income}" aria-label="Ingreso mensual"><input class="inp num" id="wf-income" type="number" min="0" step="100" value="${W.income}"></div></div>
    </div>
    <div class="wf-verdict" id="wf-verdict" aria-live="polite"></div>
    <div class="flow wf-bar" id="wf-bar" aria-hidden="true"><div class="fb"><i data-seg="0"></i><i data-seg="1"></i><i data-seg="2"></i><i data-seg="3"></i></div><div class="leg2"></div></div>
  </section>
  <section class="card wf-table${enter ? ' wf-enter' : ''}"><div class="ch"><h2><i class="wf-hi">${icon('list')}</i>Mis gastos del mes</h2><span class="mut" style="font-size:12px">${LOCK_ON} fijo · ${LOCK_OFF} libre</span></div>
    <div class="tscroll"><table class="tbl wf-tbl"><thead><tr><th></th><th>Concepto</th><th>Al mes</th><th class="n">Sugerido</th></tr></thead>
      <tbody>${W.rows.map((r, i) => rowHtml(r, i)).join('')}</tbody>
      <tfoot><tr><td></td><td><b>Total de gastos</b></td><td class="n" id="wf-total"></td><td class="n" id="wf-total-sug"></td></tr></tfoot></table></div>
    <form class="wf-add" id="wf-add" autocomplete="off"><input class="inp" id="wf-add-name" placeholder="Agregar un gasto al plan (ej. Gimnasio)" maxlength="40"><input class="inp num" id="wf-add-amt" type="number" min="0" step="50" placeholder="$ al mes"><button class="btn secondary sm" type="submit">${icon('plus')}Agregar</button></form>
    <div class="chips"><button class="btn primary sm" id="wf-apply" hidden>${icon('check')}Aplicar el recorte a la tabla</button><button class="btn secondary sm" id="wf-budget">${icon('target')}Usar la tabla como presupuesto</button></div>
  </section>`;
}

const LOCK_ON = '<svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const LOCK_OFF = '<svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';

let whatifJustAdded = null;
const prevV = {};
const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
/* Cuenta animada de un número a otro (easeOutCubic) */
function countTo(el, from, to, ms = 520, fmt = money0, isInput = false) {
  const put = v => { if (isInput) el.value = Math.round(v); else el.textContent = fmt(v); };
  cancelAnimationFrame(el._raf);
  if (from === to || reduceMotion()) { put(to); return; }
  if (!isInput) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); put(from + (to - from) * e); if (k < 1) el._raf = requestAnimationFrame(step); };
  el._raf = requestAnimationFrame(step);
}
function flash(el) { el.classList.remove('wf-flash'); void el.offsetWidth; el.classList.add('wf-flash'); }

function bindVerSi(root) {
  const W = whatifState();
  const row = id => W.rows.find(r => r.id === id);
  const $ = s => root.querySelector(s);
  const paint = () => {
    const c = whatifCalc(W); const name = W.item.name ? `«${esc(W.item.name)}»` : 'tu compra';
    // veredicto
    const stat = (lb, v, tone, sub = '', ic = 'coins') => `<div class="wf-stat ${tone}" data-k="${esc(lb)}"><span><i>${icon(ic)}</i>${lb}</span><b data-v="${v}">${money0(prevV[lb] ?? v)}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const mes = n => `${n} mes${n === 1 ? '' : 'es'}`;
    const fixedT = sum(W.rows.filter(r => r.locked), r => r.amount);
    let head, stats, note = '';
    if (!c.price) {
      head = c.sobra < 0 ? 'Hoy no te alcanza' : 'Hoy, con estos números';
      stats = stat(c.sobra < 0 ? 'Te faltan al mes' : 'Te sobran al mes', Math.abs(c.sobra), c.sobra < 0 ? 'neg' : 'pos', '', c.sobra < 0 ? 'alert' : 'sparkle') + stat('Gastos fijos', fixedT, 'mute', '', 'shield') + stat('Gastos libres', c.total - fixedT, 'mute', '', 'swap');
      note = c.sobra < 0 ? 'Baja alguno de los gastos libres hasta que este número quede en verde.' : 'Escribe qué quieres comprar para ver si te alcanza.';
    } else {
      const cut = c.feasible ? c.need : c.freeTotal;
      const top = Object.entries(c.cuts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id, v]) => `${esc(row(id).name)} (−${money0(v)})`);
      head = c.need === 0 ? 'Sí te alcanza' : c.feasible ? 'Te alcanza si recortas' : 'Así no te alcanza';
      stats = stat('Aparta al mes', c.monthly, 'att', `durante ${mes(c.months)}`, 'piggy')
        + (c.need > 0 ? stat(c.feasible ? 'Recorta al mes' : 'Te faltan al mes', c.feasible ? cut : c.need - c.freeTotal, 'neg', c.feasible ? `de ${money0(c.freeTotal)} libres` : 'aun recortando todo', c.feasible ? 'scissors' : 'alert') : '')
        + (c.feasible ? stat('Te queda al mes', Math.max(0, c.after), 'pos', 'después de todo', 'sparkle') : '')
        + (c.monthsNoCut ? stat('Sin recortar, lo juntas en', 0, 'mute', '', 'clock').replace(/<b[^>]*>.*?<\/b>/, `<b>${mes(c.monthsNoCut)}</b>`) : '');
      if (c.sobra < 0) note = `Ojo: antes de la compra ya gastas ${money0(-c.sobra)} más de lo que entra, por eso el recorte es mayor que la compra. `;
      if (c.need > 0 && c.feasible && top.length) note += `Lo que más baja: ${top.join(' y ')}. El detalle está en la columna <b>Sugerido</b>.`;
      else if (!c.feasible) note += c.minMonths ? `Prueba con <b>${mes(c.minMonths)} o más</b>, o suelta algún candado.` : 'Suelta algún candado o sube lo que entra.';
      else if (c.need === 0) note += 'No tienes que recortar nada.';
    }
    const headIc = !c.price ? 'chart' : c.need === 0 ? 'check' : c.feasible ? 'scissors' : 'alert';
    const vEl = $('#wf-verdict'); const changedHead = vEl.dataset.head !== head; vEl.dataset.head = head;
    vEl.innerHTML = `<div class="eyebrow${changedHead ? ' wf-swap' : ''}"><i>${icon(headIc)}</i>${head}</div><div class="wf-stats">${stats}</div>${note ? `<p>${note}</p>` : ''}`;
    vEl.querySelectorAll('b[data-v]').forEach(b => { const k = b.parentElement.dataset.k, to = Number(b.dataset.v), from = prevV[k] ?? to; prevV[k] = to; countTo(b, from, to); });
    // sugeridos
    W.rows.forEach(r => { const td = root.querySelector(`[data-sug="${r.id}"]`); if (!td) return; const cut = c.cuts[r.id]; const key = String(Math.round(cut || 0)); if (td.dataset.k !== undefined && td.dataset.k !== key) flash(td); td.dataset.k = key; td.innerHTML = cut ? `<b>${money0(r.amount - cut)}</b><small class="neg">−${money0(cut)}</small>` : `<span class="mut">${money0(r.amount)}</span>`; });
    $('#wf-total').textContent = money0(c.total);
    const cutTot = Object.values(c.cuts).reduce((a, b) => a + b, 0);
    $('#wf-total-sug').innerHTML = cutTot ? `<b>${money0(c.total - cutTot)}</b>` : money0(c.total);
    $('#wf-apply').hidden = !cutTot;
    // barra: fijo · libre · compra · sobra, sobre lo que entra
    const inc = Math.max(1, W.income, c.total + c.monthly);
    const fixed = sum(W.rows.filter(r => r.locked), r => r.amount), freeV = c.total - fixed;
    const parts = [['Fijo', fixed, '#9A6A94'], ['Libre', freeV - cutTot, '#DCC0D8'], [W.item.name || 'Compra', c.monthly, '#F2A7C3'], ['Te queda', Math.max(0, W.income - (c.total - cutTot) - c.monthly), '#C9CF6A']];
    const segs = root.querySelectorAll('#wf-bar [data-seg]');
    parts.forEach(([l, v, cc], k) => { const el = segs[k]; el.style.setProperty('--c', cc); el.style.width = `${Math.max(0, v) / inc * 100}%`; el.dataset.tip = `<b>${esc(l)}</b>${money0(v)}`; el.classList.toggle('off', !(v > 0)); });
    $('#wf-bar .leg2').innerHTML = parts.filter(p => p[1] > 0).map(([l, v, cc]) => `<span><i class="sq" style="--c:${cc}"></i>${esc(l)} ${money0(v)}</span>`).join('');
    bindTips($('#wf-bar'));
  };
  const setAmt = (id, v, from) => { const r = row(id); if (!r) return; r.amount = Math.max(0, Math.round(Number(v) || 0)); const rg = root.querySelector(`[data-range="${id}"]`), nm = root.querySelector(`[data-num="${id}"]`); if (from !== 'range') { if (r.amount > Number(rg.max)) rg.max = sliderMax(r.amount); rg.value = r.amount; } if (from !== 'num') nm.value = r.amount; whatifSave(); paint(); };
  root.querySelectorAll('[data-range]').forEach(el => el.addEventListener('input', () => setAmt(el.dataset.range, el.value, 'range')));
  root.querySelectorAll('[data-num]').forEach(el => el.addEventListener('input', () => setAmt(el.dataset.num, el.value, 'num')));
  root.querySelectorAll('[data-lock]').forEach(b => b.addEventListener('click', () => { const r = row(b.dataset.lock); r.locked = !r.locked; whatifSave(); S._keepScroll = true; render(); }));
  root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { W.rows = W.rows.filter(r => r.id !== b.dataset.del); whatifSave(); S._keepScroll = true; render(); }));
  // compra
  $('#wf-item').addEventListener('input', e => { W.item.name = e.target.value; whatifSave(); paint(); });
  $('#wf-price').addEventListener('input', e => { W.item.price = Math.max(0, Number(e.target.value) || 0); whatifSave(); paint(); });
  $('#wf-months').addEventListener('input', e => { W.item.months = Number(e.target.value); $('#wf-months-l').textContent = W.item.months; whatifSave(); paint(); });
  const incR = $('#wf-income-r'), incN = $('#wf-income');
  incR.addEventListener('input', () => { W.income = Number(incR.value); incN.value = W.income; whatifSave(); paint(); });
  incN.addEventListener('input', () => { W.income = Math.max(0, Number(incN.value) || 0); if (W.income > Number(incR.max)) incR.max = sliderMax(W.income); incR.value = W.income; whatifSave(); paint(); });
  // agregar fila
  $('#wf-add').addEventListener('submit', e => { e.preventDefault(); const n = $('#wf-add-name').value.trim(); const a = Number($('#wf-add-amt').value) || 0; if (!n) { toast('Escribe el nombre del gasto'); return; } const nid = 'x:' + uid(); W.rows.push({ id: nid, name: n, amount: Math.round(a), locked: false, custom: true }); whatifJustAdded = nid; whatifSave(); S._keepScroll = true; render(); toast(`“${n}” agregado al plan`); });
  // aplicar recorte
  $('#wf-apply').addEventListener('click', () => { const c = whatifCalc(W); W.rows.forEach(r => { if (c.cuts[r.id]) r.amount = Math.round(r.amount - c.cuts[r.id]); }); whatifSave(); S._keepScroll = true; render(); toast('Recorte aplicado a la tabla'); });
  // presupuesto
  $('#wf-budget').addEventListener('click', () => confirmBox('¿Usar la tabla como presupuesto?', 'Cada categoría de la tabla queda con su monto como presupuesto mensual. Las filas de deudas, ahorro y las que agregaste a mano no cambian nada.', () => { W.rows.filter(r => r.cat).forEach(r => { if (r.amount > 0) S.data.budgets[r.cat] = r.amount; else delete S.data.budgets[r.cat]; }); saveData(); toast('Presupuesto actualizado'); }, 'Usar'));
  $('#wf-frombudget').addEventListener('click', () => {
    const bud = Object.entries(S.data.budgets || {}).filter(([, v]) => Number(v) > 0);
    if (!bud.length) { toast('Todavía no tienes presupuesto. Ármalo en Presupuesto o aquí con «Usar la tabla como presupuesto».'); return; }
    confirmBox('¿Tomar tu presupuesto como ejemplo?', `Las ${bud.length} categorías con presupuesto toman ese monto${S.data.savingsGoal ? ' y el ahorro toma tu meta' : ''}. Las demás filas se quedan como están. Tus movimientos no cambian.`, () => {
      bud.forEach(([id, v]) => { const r = row('cat:' + id); if (r) r.amount = Math.round(v); else W.rows.splice(W.rows.findIndex(x => !x.cat) < 0 ? W.rows.length : W.rows.findIndex(x => !x.cat), 0, { id: 'cat:' + id, name: cat(id).name, cat: id, amount: Math.round(v), locked: false }); });
      if (S.data.savingsGoal) { const r = row('ahorro'); if (r) r.amount = S.data.savingsGoal; }
      saveData(); S._keepScroll = true; render(); toast('Listo, con tu presupuesto');
    }, 'Usar');
  });
  $('#wf-reset').addEventListener('click', () => confirmBox('¿Volver a tus promedios?', 'La tabla se rehace con lo que gastaste en los últimos meses. Se pierden los cambios y candados de este simulador.', () => { const item = W.item; S.data.whatif = { ...whatifFromReal(), item }; saveData(); render(); toast('Listo, con tus promedios'); }, 'Rehacer'));
  paint();
  if (whatifJustAdded) {
    const tr = root.querySelector(`[data-row="${whatifJustAdded}"]`); const r = row(whatifJustAdded); whatifJustAdded = null;
    if (tr && r) { try { tr.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' }); } catch (e) {} countTo(tr.querySelector('[data-num]'), 0, r.amount, 700, null, true); }
  }
  // cantidades escritas a mano: pulso suave en la casilla
  root.querySelectorAll('.wf-hero .inp.num, [data-num]').forEach(el => el.addEventListener('change', () => flash(el)));
}

VIEWS.versi = { title: '¿Y si…?', icon: 'sparkle', fn: viewVerSi, bind: bindVerSi };
NAV_GROUPS[2][1].unshift('versi');
