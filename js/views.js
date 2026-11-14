/* ===== Raw Money · vistas ===== */
const catStyle = c => `--cat:${col(c.color)};--cat-soft:color-mix(in srgb, ${col(c.color)} 16%, var(--surface))`;
const catIcon = (c, cls = 'ic') => `<span class="${cls}" style="${catStyle(c)}">${icon(c.icon)}</span>`;
const KIND_COLOR = { tarjeta: 'var(--plum)', deuda: 'var(--bad)', recurrente: 'var(--warn)', suscripcion: 'var(--plum-deep)', meses: 'var(--ink-3)', corte: 'var(--line-strong)' };
const KIND_LABEL = { tarjeta: 'Tarjeta', deuda: 'Deuda', recurrente: 'Recurrente', suscripcion: 'Suscripción', meses: 'A meses', corte: 'Corte' };
const statusTag = s => ({ pagado: '<span class="tag good">Pagado</span>', parcial: '<span class="tag warn">Parcial</span>', vencido: '<span class="tag bad">Vencido</span>', pendiente: '<span class="tag warn">Pendiente</span>' }[s] || '');
const deltaTag = d => d == null ? '<span class="delta new">nuevo</span>' : Math.abs(d) < 1 ? '<span class="delta">=</span>' : d > 0 ? `<span class="delta up">+${Math.round(d)}%</span>` : `<span class="delta down">${Math.round(d)}%</span>`;
const isPast = ym => ym < thisMonth();
/* Logo: la r itálica con su punto, como el favicon */
const LOGO = { toString: () => `<span class="mark tiger" aria-hidden="true">${tigerSvg()}</span>` }; // un SVG con ids únicos cada vez que se pinta
/* Lo que se puede registrar: [acción, título, ayuda, ícono, tono] */
const ADD_OPTS = [['new-gasto', 'Gasté', 'Una compra o un pago', 'bag', 'berry'], ['new-ingreso', 'Me pagaron', 'Sueldo, venta, regalo', 'arrowDown', 'sprout'], ['new-pago-tarjeta', 'Pagué la tarjeta', 'Abono a tu tarjeta', 'card', 'malaga'], ['new-pago-deuda', 'Abono a una deuda', 'Préstamo o crédito', 'bank', 'bison'], ['new-ahorro', 'Ahorré', 'Apartar dinero', 'piggy', 'oasis'], ['new-transfer', 'Moví dinero', 'Entre mis cuentas', 'swap', 'brush']];

function txRow(t, click = true, cents = false) {
  const c = t.type === 'gasto' || t.type === 'ingreso' ? cat(t.categoryId) : null;
  const meta = { ingreso: { ic: 'arrowDown', col: 'var(--green)', sign: '+' }, gasto: { ic: null, col: null, sign: '−' }, transferencia: { ic: 'swap', col: 'var(--ink-3)', sign: '' }, pago_deuda: { ic: 'bank', col: 'var(--bad)', sign: '−' }, pago_tarjeta: { ic: 'card', col: 'var(--plum)', sign: '−' }, ahorro: { ic: 'piggy', col: 'var(--green)', sign: '' } }[t.type];
  const ic = c ? catIcon(c) : `<span class="ic" style="--cat:${meta.col};--cat-soft:color-mix(in srgb, ${meta.col} 14%, var(--surface))">${icon(meta.ic)}</span>`;
  const sub = [c ? c.name : TYPES[t.type], t.type === 'transferencia' ? `${accountName(t.accountId)} → ${accountName(t.targetId)}` : t.type === 'pago_tarjeta' ? `a ${accountName(t.targetId)}` : t.type === 'pago_deuda' ? `a ${(byId(S.data.debts, t.targetId) || {}).name || '—'}` : accountName(t.accountId), METHODS[t.method]].filter(Boolean).join(' · ');
  const tags = `${t.recurringId ? '<span class="tag rec">Recurrente</span>' : t.fixed && ['gasto', 'ingreso', 'pago_deuda'].includes(t.type) ? '<span class="tag">Fijo</span>' : ''}`;
  const cls = t.type === 'ingreso' || t.type === 'ahorro' ? 'pos' : t.type === 'pago_deuda' ? 'neg' : t.type === 'transferencia' ? 'mut' : '';
  return `<div class="row${click ? ' click' : ''}" data-tx="${t.id}">${ic}<div class="tx"><b>${esc(t.desc)} ${tags}</b><span>${dateLabel(t.date)} · ${esc(sub)}</span></div><div class="am ${cls}">${meta.sign}${(cents ? money2 : money)(t.amount)}</div></div>`;
}

/* ---------- INICIO ---------- */
const daysUntil = iso => Math.round((new Date(iso + 'T12:00') - new Date(todayISO() + 'T12:00')) / 864e5);
const whenLabel = iso => { const d = daysUntil(iso); return d < 0 ? `hace ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`; };
function viewInicio() {
  const ym = S.month; const s = monthSummary(ym); const rank = categoryRanking(ym).slice(0, 5);
  const bud = budgetStatus(ym).slice(0, 4);
  const recent = S.data.transactions.filter(t => inMonth(t, ym)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const today = todayISO();
  const upcoming = monthEvents(ym).filter(e => e.kind !== 'corte' && !e.paid && (ym > thisMonth() || e.date >= today)).slice(0, 6);
  const donutItems = rank.map(r => ({ label: r.cat.name, value: r.v, color: col(r.cat.color), key: r.cat.id }));
  const rest = categoryRanking(ym).slice(5); if (rest.length) donutItems.push({ label: 'Otras', value: sum(rest, r => r.v), color: col(OTHERS_COLOR), key: 'rest' });
  const past = isPast(ym), cur = ym === thisMonth(), mes = MESES[Number(ym.slice(5)) - 1];
  const dLeft = cur ? daysIn(ym) - Number(todayISO().slice(8)) + 1 : past ? 0 : daysIn(ym);
  const perDay = dLeft && s.queda > 0 ? s.queda / dLeft : 0;
  const usedPct = s.ingresos ? Math.min(100, Math.max(0, (s.ingresos - s.queda) / s.ingresos * 100)) : 0;
  const over = s.queda < 0, noIn = !s.ingresos;
  const say = noIn && over ? `Aún no registras lo que te pagaron en ${mes}. Cuando lo hagas, aquí verás cuánto te queda.` : over ? `Entre gastos y pagos salió más de lo que entró en ${mes}. Mira abajo en qué se fue.`
    : cur ? `para los ${dLeft} día${dLeft === 1 ? '' : 's'} que faltan de ${mes}.${perDay ? ` Son unos <b>${money2(perDay)}</b> al día.` : ''}`
    : past ? `fue lo que sobró en ${mes}.` : `para ${mes}, si todo sale como está planeado.`;
  return `
  <div class="ph"><div><div class="eyebrow">${past ? 'Así cerró' : cur ? 'Hoy, ' + dateLong(todayISO()) : 'Mirando adelante'}</div><h1 class="squig">${past ? 'Así te fue' : 'Así vas'} en ${mes}</h1></div></div>
  <section class="hero${over && !noIn ? ' over' : ''}">
    <div class="hl">
      <pre class="ascii" aria-hidden="true">${asciiArt(40, 13, 7)}</pre>
      <div class="eyebrow">${noIn && over ? 'Han salido' : over ? 'Te pasaste por' : 'Te quedan'}</div>
      <div class="big num">${money2(Math.abs(s.queda))}</div>
      <p class="say">${say}</p>
      ${s.ingresos ? `<div class="meter" role="img" aria-label="Usaste ${pct(usedPct)} de lo que entró"><i style="width:${usedPct}%"></i></div><div class="meter-l"><span>Ya usaste ${pct(usedPct)} de lo que entró</span><span>Entró ${money2(s.ingresos)}</span></div>` : noIn && over ? '' : '<p class="say">Registra lo que te pagaron este mes y aquí verás cuánto te queda.</p>'}
    </div>
    <div class="stub">
      <div class="ledger"><span>${icon('wallet')}Tengo en cuentas</span><b class="num">${money2(s.disponibleCuentas)}</b><small>${S.data.accounts.map(a => `${esc(a.name)} ${money2(accountBalance(a, ym))}`).join(' · ') || 'Agrega una cuenta en Ajustes'}</small></div>
      <div class="ledger"><span>${icon('cal')}Por pagar este mes</span><b class="num">${money2(s.comprometido)}</b><small>${s.compItems.length ? `${s.compItems.length} pago${s.compItems.length > 1 ? 's' : ''} pendiente${s.compItems.length > 1 ? 's' : ''}` : 'Nada pendiente, qué paz'}</small></div>
      <div class="ledger"><span>${icon('piggy')}Ahorré este mes</span><b class="num">${money2(s.ahorro)}</b><small>${S.data.savingsGoal ? `Meta ${money2(S.data.savingsGoal)} · llevas ${pct(Math.min(100, s.ahorro / S.data.savingsGoal * 100))}` : `${pct(s.ahorroPct)} de lo que entró`}</small></div>
    </div>
  </section>
  <section class="quickgrid" aria-label="Registrar">${ADD_OPTS.slice(0, 4).map(([act, tt, sub, ic, tone]) => `<button class="addopt" data-act="${act}" style="--tone:var(--${tone})"><span class="blob">${icon(ic)}</span><b>${tt}</b><small>${sub}</small></button>`).join('')}<button class="addopt more" data-act="add"><span class="blob">${icon('more')}</span><b>Otra cosa</b><small>Ahorro, transferencia…</small></button></section>
  <section class="stats g4">
    <div class="stat pos"><div class="lb"><i></i>Ingresos</div><div class="v num">${money2(s.ingresos)}</div><div class="s">${s.count ? 'recibidos este mes' : 'sin movimientos'}</div></div>
    <div class="stat"><div class="lb"><i></i>Gastos</div><div class="v num">${money2(s.gastosTotal)}</div><div class="s"><b>${money2(s.fijos)}</b> fijos · <b>${money2(s.variables)}</b> variables</div></div>
    <div class="stat neg"><div class="lb"><i></i>Debo en tarjetas</div><div class="v num">${money2(s.tarjetasTotal)}</div><div class="s">${s.cards.length} tarjeta${s.cards.length === 1 ? '' : 's'} · otras deudas <b>${money2(s.deudasTotal)}</b></div></div>
    <div class="stat pos"><div class="lb"><i></i>Ahorro del mes</div><div class="v num">${money2(s.ahorro)}</div><div class="s"><b>${pct(s.ahorroPct)}</b> del ingreso${S.data.savingsGoal ? ` · meta ${money2(S.data.savingsGoal)}` : ''}</div></div>
  </section>
  <section class="g23">
    <div class="card"><div class="ch"><h2>¿En qué se fue mi dinero?</h2><button class="lnk" data-go="gastos">Ver detalle</button></div>
      ${s.gastosTotal ? `<div class="donutwrap">${donutSVG(donutItems, 'gastado', money2(s.gastosTotal))}<div class="legend">${donutItems.map(i => `<div class="l" data-key="${i.key}" style="--cat:${i.color}"><i></i><span>${esc(i.label)}</span><b>${money2(i.value)}</b><em>${pct(i.value / s.gastosTotal * 100)}</em></div>`).join('')}</div></div>` : '<div class="empty"><h3>Aún no hay gastos</h3><p>Registra tu primer gasto y aquí verás la distribución.</p></div>'}
    </div>
    <div class="card"><div class="ch"><h2>Próximos pagos</h2><button class="lnk" data-go="calendario">Calendario</button></div>
      <div class="list">${upcoming.length ? upcoming.map(e => `<div class="row"><span class="ic" style="--cat:${KIND_COLOR[e.kind]};--cat-soft:color-mix(in srgb, ${KIND_COLOR[e.kind]} 14%, var(--surface))">${icon(e.kind === 'tarjeta' ? 'card' : e.kind === 'deuda' ? 'bank' : e.kind === 'meses' ? 'layers' : 'repeat')}</span><div class="tx"><b>${esc(e.name)}</b><span>${dateLong(e.date)} · ${KIND_LABEL[e.kind]}</span></div><div class="am">${e.amount != null ? money2(e.amount) : ''}<small class="when${daysUntil(e.date) <= 3 ? ' soon' : ''}">${whenLabel(e.date)}</small></div></div>`).join('') : '<div class="empty"><h3>Sin pagos pendientes</h3><p>Todo lo de este mes ya está cubierto.</p></div>'}</div>
    </div>
  </section>
  <section class="g2">
    <div class="card"><div class="ch"><h2>Presupuesto</h2><button class="lnk" data-go="presupuesto">Ver todo</button></div>
      ${bud.length ? bud.map(b => `<div class="bud${b.over ? ' over' : ''}"><div class="h">${catIcon(b.cat)}<div class="nm">${esc(b.cat.name)}<small>${b.over ? `Excedido por ${money2(-b.left)}` : `Quedan ${money2(b.left)}`}</small></div><div class="v"><b>${money2(b.spent)}</b><span>de ${money2(b.budget)}</span></div></div><div class="bar ${b.over ? 'b' : b.pct > 85 ? 'w' : 'g'}"><i style="width:${Math.min(100, b.pct)}%"></i></div></div>`).join('') : '<div class="empty"><h3>Sin presupuestos</h3><p>Define cuánto quieres gastar por categoría.</p><button class="btn secondary sm" data-go="presupuesto">Crear presupuesto</button></div>'}
    </div>
    <div class="card"><div class="ch"><h2>Últimos movimientos</h2><button class="lnk" data-go="movimientos">Ver todos</button></div>
      <div class="list">${recent.length ? recent.map(t => txRow(t, true, true)).join('') : '<div class="empty"><h3>Nada registrado</h3><p>Usa “Registrar gasto” o “Registrar ingreso”.</p></div>'}</div>
    </div>
  </section>`;
}

/* ---------- MOVIMIENTOS ---------- */
function viewMovimientos() {
  const f = S.filters; const ym = S.month;
  let list = S.data.transactions.filter(t => f.all ? true : inMonth(t, ym));
  if (f.q) { const q = f.q.toLowerCase(); list = list.filter(t => (t.desc + ' ' + (t.notes || '')).toLowerCase().includes(q)); }
  if (f.type) list = list.filter(t => t.type === f.type);
  if (f.cat) list = list.filter(t => t.categoryId === f.cat);
  if (f.method) list = list.filter(t => t.method === f.method);
  if (f.acc) list = list.filter(t => t.accountId === f.acc || t.targetId === f.acc);
  if (f.from) list = list.filter(t => t.date >= f.from);
  if (f.to) list = list.filter(t => t.date <= f.to);
  list.sort((a, b) => b.date.localeCompare(a.date));
  const tot = { ingreso: 0, gasto: 0 }; list.forEach(t => { if (tot[t.type] != null) tot[t.type] += t.amount; });
  let html = '', lastDay = '';
  list.forEach(t => { if (t.date !== lastDay) { html += `<div class="day-h">${dateLong(t.date)}</div>`; lastDay = t.date; } html += txRow(t); });
  const cats = S.data.categories;
  return `
  <div class="ph"><div><div class="eyebrow">${f.all ? 'Todo el historial' : monthLabel(ym)}</div><h1>Movimientos</h1><p>${list.length} movimiento${list.length === 1 ? '' : 's'} · ingresos <b class="pos num">${money0(tot.ingreso)}</b> · gastos <b class="num">${money0(tot.gasto)}</b></p></div>
    <div class="acts"><button class="btn primary" data-act="new-gasto">${icon('plus')}<span>Registrar gasto</span></button><button class="btn green" data-act="new-ingreso">${icon('plus')}<span>Registrar ingreso</span></button></div></div>
  <div class="card">
    <div class="filters"><input class="inp search" id="f-q" placeholder="Buscar descripción…" value="${esc(f.q || '')}">
      <select class="sel pill" id="f-type"><option value="">Todos los tipos</option>${Object.entries(TYPES).map(([k, v]) => `<option value="${k}"${f.type === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <select class="sel pill" id="f-cat"><option value="">Todas las categorías</option>${cats.map(c => `<option value="${c.id}"${f.cat === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
      <select class="sel pill" id="f-method"><option value="">Método</option>${Object.entries(METHODS).map(([k, v]) => `<option value="${k}"${f.method === k ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <select class="sel pill" id="f-acc"><option value="">Cuenta / tarjeta</option>${allAccounts().map(a => `<option value="${a.id}"${f.acc === a.id ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
      <input class="inp date" type="date" id="f-from" value="${f.from || ''}" title="Desde"><input class="inp date" type="date" id="f-to" value="${f.to || ''}" title="Hasta">
      <label class="chip${f.all ? ' on' : ''}" id="f-all">${f.all ? 'Todos los meses' : 'Solo este mes'}</label>
      ${(f.q || f.type || f.cat || f.method || f.acc || f.from || f.to || f.all) ? '<button class="btn quiet sm" id="f-clear">Limpiar</button>' : ''}</div>
    <div class="list">${html || '<div class="empty"><h3>Sin movimientos</h3><p>Cambia los filtros o registra uno nuevo.</p></div>'}</div>
  </div>`;
}
function bindMovimientos(root) {
  const set = (k, v) => { S.filters[k] = v; render(); };
  const q = root.querySelector('#f-q'); if (q) { q.addEventListener('input', e => { S.filters.q = e.target.value; clearTimeout(q._t); q._t = setTimeout(() => { const pos = q.selectionStart; render(); const nq = document.querySelector('#f-q'); if (nq) { nq.focus(); nq.setSelectionRange(pos, pos); } }, 250); }); }
  ['type', 'cat', 'method', 'acc', 'from', 'to'].forEach(k => { const el = root.querySelector('#f-' + k); if (el) el.addEventListener('change', e => set(k, e.target.value)); });
  const all = root.querySelector('#f-all'); if (all) all.addEventListener('click', () => set('all', !S.filters.all));
  const clr = root.querySelector('#f-clear'); if (clr) clr.addEventListener('click', () => { S.filters = {}; render(); });
}

/* ---------- ¿EN QUÉ SE FUE? ---------- */
function viewGastos() {
  const ym = S.month; const s = monthSummary(ym); const rank = categoryRanking(ym); const prevYm = addMonths(ym, -1);
  const top = rank.slice(0, 6); const rest = rank.slice(6);
  const items = top.map(r => ({ label: r.cat.name, value: r.v, color: col(r.cat.color), key: r.cat.id })); if (rest.length) items.push({ label: 'Otras', value: sum(rest, r => r.v), color: col(OTHERS_COLOR), key: 'rest' });
  const byMethod = {}; S.data.transactions.filter(t => inMonth(t, ym) && t.type === 'gasto').forEach(t => { byMethod[t.method] = (byMethod[t.method] || 0) + t.amount; }); if (s.instMonthly) byMethod.credito = (byMethod.credito || 0) + s.instMonthly;
  const mtot = Object.values(byMethod).reduce((a, b) => a + b, 0);
  const max = rank.length ? rank[0].v : 1;
  return `
  <div class="ph"><div><div class="eyebrow">${monthLabel(ym)}</div><h1>¿En qué se fue mi dinero?</h1><p>Gastaste <b class="num">${money0(s.gastosTotal)}</b>${s.gastosTotal ? ` · ${pct(s.fijos / s.gastosTotal * 100)} fijo y ${pct(s.variables / s.gastosTotal * 100)} variable` : ''}.</p></div></div>
  ${s.gastosTotal ? `
  <section class="g23">
    <div class="card"><div class="ch"><h2>Distribución por categoría</h2></div><div class="donutwrap">${donutSVG(items, 'gastado', money0(s.gastosTotal))}<div class="legend">${items.map(i => `<div class="l" data-key="${i.key}" style="--cat:${i.color}"><i></i><span>${esc(i.label)}</span><b>${money0(i.value)}</b><em>${pct(i.value / s.gastosTotal * 100)}</em></div>`).join('')}</div></div></div>
    <div class="card"><div class="ch"><h2>Por tipo de compra</h2></div>
      <div class="flow"><div class="fb">${Object.entries(byMethod).map(([k, v]) => `<i style="--c:${k === 'credito' ? 'var(--plum)' : k === 'efectivo' ? 'var(--amber)' : 'var(--green)'};width:${v / mtot * 100}%" data-tip="<b>${METHODS[k]}</b>${money0(v)}"></i>`).join('')}</div>
      <div class="fl">${Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div style="--c:${k === 'credito' ? 'var(--plum)' : k === 'efectivo' ? 'var(--amber)' : 'var(--green)'}"><b class="num">${money0(v)}</b><span>${METHODS[k]} · ${pct(v / mtot * 100)}</span></div>`).join('')}</div></div>
      <div class="flow" style="margin-top:6px"><div class="fb"><i style="--c:var(--ink-3);width:${s.fijos / s.gastosTotal * 100}%" data-tip="<b>Fijos</b>${money0(s.fijos)}"></i><i style="--c:var(--plum-line);width:${s.variables / s.gastosTotal * 100}%" data-tip="<b>Variables</b>${money0(s.variables)}"></i></div>
      <div class="fl"><div style="--c:var(--ink-3)"><b class="num">${money0(s.fijos)}</b><span>Gastos fijos</span></div><div style="--c:var(--plum-line)"><b class="num">${money0(s.variables)}</b><span>Gastos variables</span></div></div></div>
      <p class="mut" style="font-size:12.5px">Las compras a crédito cuentan como gasto cuando se hacen. El pago de la tarjeta después no se vuelve a contar.</p>
    </div>
  </section>
  <section class="g2">
    <div class="card"><div class="ch"><h2>Ranking de categorías</h2></div><div class="rank">${rank.map(r => `<div class="r" style="--cat:${col(r.cat.color)}"><div class="nm"><i></i><span>${esc(r.cat.name)}</span></div><div></div><div class="v num">${money0(r.v)}<small>${pct(r.share)}</small></div><div class="bar"><i style="width:${r.v / max * 100}%"></i></div></div>`).join('')}</div></div>
    <div class="card"><div class="ch"><h2>Comparado con ${monthLabel(prevYm)}</h2></div><div class="list">${rank.map(r => `<div class="row">${catIcon(r.cat)}<div class="tx"><b>${esc(r.cat.name)}</b><span>Antes ${money0(r.prev)} · ahora ${money0(r.v)}</span></div><div class="am">${deltaTag(r.delta)}</div></div>`).join('')}
      ${Object.entries(monthSummary(prevYm).byCat).filter(([id]) => !s.byCat[id]).map(([id, v]) => `<div class="row">${catIcon(cat(id))}<div class="tx"><b>${esc(cat(id).name)}</b><span>Antes ${money0(v)} · ahora $0</span></div><div class="am"><span class="delta down">−100%</span></div></div>`).join('')}</div></div>
  </section>` : '<div class="card"><div class="empty"><h3>Sin gastos en este mes</h3><p>Registra gastos y aquí verás a dónde se va tu dinero.</p><button class="btn primary sm" data-act="new-gasto">Registrar gasto</button></div></div>'}`;
}

/* ---------- TARJETAS ---------- */
function ccCard(c, ym) {
  const m = cardMonth(c, ym); const tone = m.util > 70 ? 'b' : m.util > 40 ? 'w' : 'g';
  return `<div class="cc" data-card="${c.id}"><div class="hd"><div><div class="nm">${esc(c.name)}</div><div class="inst">${esc(c.institution || '')}${c.rate ? ` · ${c.rate}% anual` : ''}</div></div><div class="chipx" style="--cc:${col(c.color || '#9B2B5A')}"></div></div>
    <div><div class="eyebrow">Saldo actual</div><div class="used num">${money0(m.bal)}<small>de ${money0(c.limit)}</small></div></div>
    <div class="pct"><div class="bar ${tone}"><i style="width:${Math.min(100, m.util)}%"></i></div><span class="num">${pct(m.util)}</span></div>
    <div class="kv"><div><span>Disponible</span><b class="pos">${money0(m.available)}</b></div><div><span>Corte</span><b>día ${c.cutDay}</b></div><div><span>Pago mínimo</span><b>${money0(m.minPay)}</b></div><div><span>Para no generar intereses</span><b>${money0(m.noInterest)}</b></div></div>
    <div class="pay"><div><div class="eyebrow">Próximo pago · ${dateLabel(m.payDate)}</div><b class="num">${money0(Math.max(0, Math.min(m.noInterest, m.prev) - m.paid))}</b>${m.paid ? ` <span class="mut">· pagado ${money0(m.paid)}</span>` : ''}</div>${statusTag(m.status)}</div></div>`;
}
function viewTarjetas() {
  const ym = S.month; const s = monthSummary(ym);
  const inst = S.data.installments.map(i => ({ i, info: installmentInfo(i, ym) })).sort((a, b) => a.info.remaining - b.info.remaining);
  return `
  <div class="ph"><div><div class="eyebrow">${monthLabel(ym)}</div><h1>Tarjetas de crédito</h1><p>Debes <b class="num neg">${money0(s.tarjetasTotal)}</b> en ${S.data.cards.length} tarjeta${S.data.cards.length === 1 ? '' : 's'} · crédito disponible <b class="num">${money0(sum(s.cards, x => x.m.available))}</b></p></div>
    <div class="acts"><button class="btn secondary" data-act="new-pago-tarjeta">${icon('check')}<span>Registrar pago</span></button><button class="btn secondary" data-act="new-meses">${icon('layers')}<span>Compra a meses</span></button><button class="btn primary" data-act="new-tarjeta">${icon('plus')}<span>Agregar tarjeta</span></button></div></div>
  <section class="g2">${S.data.cards.length ? S.data.cards.map(c => ccCard(c, ym)).join('') : '<div class="card" style="grid-column:1/-1"><div class="empty"><h3>Sin tarjetas</h3><p>Agrega tu primera tarjeta para ver utilización, cortes y pagos.</p><button class="btn primary sm" data-act="new-tarjeta">Agregar tarjeta</button></div></div>'}</section>
  <section class="card"><div class="ch"><h2>Compras a meses</h2><span class="mut" style="font-size:13px">Este mes: <b class="num">${money0(s.instMonthly)}</b> en mensualidades</span></div>
    ${inst.length ? `<div class="g3">${inst.map(({ i, info }) => `<div class="debt" data-ins="${i.id}"><div class="hd"><div><b>${esc(i.desc)}</b><span>${accountName(i.cardId)} · ${i.months} meses</span></div>${info.remaining === 0 ? '<span class="tag good">Liquidada</span>' : info.future ? '<span class="tag">Inicia ' + monthShort(i.start) + '</span>' : `<span class="tag plum">${info.remaining} restante${info.remaining === 1 ? '' : 's'}</span>`}</div>
      <div class="big num">${money0(info.monthly)}<small>/ mes</small></div>
      <div class="bar thick"><i style="width:${info.paidCount / i.months * 100}%"></i></div>
      <div class="pr"><span>${info.paidCount} de ${i.months} pagos</span><span>Pendiente <b>${money0(info.pending)}</b></span></div>
      <div class="kv"><div><span>Total</span><b>${money0(i.total)}</b></div><div><span>Inicio</span><b>${monthShort(i.start)}</b></div><div><span>Termina</span><b>${monthShort(info.end)}</b></div></div></div>`).join('')}</div>` : '<div class="empty"><h3>Sin compras a meses</h3><p>Registra compras diferidas y verás cuánto falta por pagar.</p></div>'}
  </section>`;
}

/* ---------- DEUDAS ---------- */
function viewDeudas() {
  const ym = S.month; const s = monthSummary(ym);
  const list = S.data.debts.map(d => ({ d, i: debtInfo(d, ym) }));
  const totalMonthly = sum(list.filter(x => !x.i.done), x => x.d.monthly);
  return `
  <div class="ph"><div><div class="eyebrow">${monthLabel(ym)}</div><h1>Deudas</h1><p>Debes <b class="num neg">${money0(s.deudasTotal)}</b> · pagas <b class="num">${money0(totalMonthly)}</b> al mes${s.pagosDeuda ? ` · este mes ya abonaste <b class="num pos">${money0(s.pagosDeuda)}</b>` : ''}</p></div>
    <div class="acts"><button class="btn secondary" data-act="new-pago-deuda">${icon('check')}<span>Registrar pago</span></button><button class="btn primary" data-act="new-deuda">${icon('plus')}<span>Agregar deuda</span></button></div></div>
  <section class="g2">${list.length ? list.map(({ d, i }) => `<div class="debt" data-debt="${d.id}"><div class="hd"><div><b>${esc(d.name)}</b><span>${esc(d.creditor || '')}${d.rate ? ` · ${d.rate}% anual` : ''}</span></div>${i.done ? '<span class="tag good">Liquidada</span>' : statusTag(i.status)}</div>
    <div class="big num">${money0(i.pending)}<small>pendientes</small></div>
    <div class="bar thick ${i.done ? 'g' : ''}"><i style="width:${Math.min(100, i.progress)}%"></i></div>
    <div class="pr"><span><b>${money0(i.paidTotal)}</b> / ${money0(d.original)} pagados</span><span class="num">${pct(i.progress)}</span></div>
    <div class="kv"><div><span>Pago mensual</span><b>${money0(d.monthly)}</b></div><div><span>Día de pago</span><b>${d.payDay}</b></div><div><span>Termina</span><b>${i.done ? '—' : i.endMonth ? monthShort(i.endMonth) : '—'}</b></div></div>
    ${!i.done && i.monthsLeft != null ? `<p class="mut" style="font-size:12.5px">Faltan ${i.monthsLeft} pago${i.monthsLeft === 1 ? '' : 's'} para terminar.</p>` : ''}</div>`).join('') : '<div class="card" style="grid-column:1/-1"><div class="empty"><h3>Sin deudas registradas</h3><p>Préstamos, créditos o dinero que debes a alguien.</p><button class="btn primary sm" data-act="new-deuda">Agregar deuda</button></div></div>'}</section>`;
}

/* ---------- RECURRENTES ---------- */
function viewRecurrentes() {
  const list = S.data.recurring.slice().sort((a, b) => a.day - b.day);
  const monthly = sum(list.filter(r => r.active), r => r.freq === 'quincenal' ? r.amount * 2 : r.freq === 'semanal' ? r.amount * 4 : r.freq === 'bimestral' ? r.amount / 2 : r.freq === 'anual' ? r.amount / 12 : r.amount);
  return `
  <div class="ph"><div><div class="eyebrow">Cada mes</div><h1>Gastos recurrentes</h1><p>Equivalen a <b class="num">${money0(monthly)}</b> al mes. Se agregan solos al mes correspondiente.</p></div>
    <div class="acts"><button class="btn primary" data-act="new-rec">${icon('plus')}<span>Agregar recurrente</span></button></div></div>
  <section class="card"><div class="list">${list.length ? list.map(r => { const c = cat(r.categoryId); return `<div class="row click" data-rec="${r.id}" style="${r.active ? '' : 'opacity:.5'}">${catIcon(c)}<div class="tx"><b>${esc(r.name)} ${r.active ? '' : '<span class="tag">Pausado</span>'}</b><span>${FREQ[r.freq]} · día ${r.day} · ${c.name} · ${METHODS[r.method]} · ${accountName(r.accountId)}</span></div><div class="am">${money(r.amount)}<small>${FREQ[r.freq].toLowerCase()}</small></div></div>`; }).join('') : '<div class="empty"><h3>Sin recurrentes</h3><p>Renta, internet, suscripciones, gimnasio…</p></div>'}</div></section>`;
}

/* ---------- PRESUPUESTO ---------- */
/* Ordena los presupuestos por grupo (si las categorías tienen uno) e inserta encabezados con subtotal */
function budGrouped(bs) {
  if (!bs.some(b => b.cat.group)) return bs;
  const G = [...PLAN_GROUPS, ['', 'Otros conceptos']];
  return G.flatMap(([g, gl]) => { const its = bs.filter(b => (b.cat.group || '') === g || (g === '' && !PLAN_GROUPS.some(x => x[0] === b.cat.group))); return its.length ? [{ head: gl, total: sum(its, b => b.budget), spent: sum(its, b => b.spent) }, ...its] : []; });
}
/* ---------- Por quincena: reparte cada concepto en dos partes (editable) y revisa si cuadra ---------- */
const QK_SAVE = '__ahorro';
function qState() { const q = S.data.quincenas || (S.data.quincenas = { income: null, q1: {} }); if (!q.q1) q.q1 = {}; if (!q.pay) q.pay = {}; if (!q.paid) q.paid = {}; return q; }
/* Qué ya se pagó, por mes: paid['2026-11']['renta:a'] = true */
const qPaid = (ym = S.month) => { const q = qState(); return q.paid[ym] || (q.paid[ym] = {}); };
function qIncome() { const q = qState(); const half = Math.round(PLAN_INCOME / 2); return q.income && q.income.length === 2 ? q.income : [half, PLAN_INCOME - half]; }
function qRows(bs) {
  const q = qState(); const rows = budGrouped(bs).filter(b => !b.head).map(b => ({ id: b.cat.id, name: b.cat.name, icon: b.cat.icon, color: col(b.cat.color), total: b.budget, group: b.cat.group, fixed: isFixedCat(b.cat) }));
  if (S.data.savingsGoal) rows.push({ id: QK_SAVE, name: 'Ahorro (meta)', icon: 'piggy', color: col('#2D8F73'), total: S.data.savingsGoal, fixed: !!q.saveFixed });
  return rows.map(r => { const a = Math.min(r.total, Math.max(0, q.q1[r.id] ?? Math.round(r.total / 2))); return { ...r, a, b: r.total - a, pay: q.pay[r.id] || '' }; });
}
/* Quita un gasto del presupuesto (la categoría se conserva en Categorías y en “Sin presupuesto”) */
function removeBudget(id) {
  const isSave = id === QK_SAVE; const c = isSave ? null : byId(S.data.categories, id);
  const name = isSave ? 'Ahorro (meta)' : (c ? c.name : 'este gasto'); const amt = isSave ? S.data.savingsGoal : S.data.budgets[id];
  confirmBox(`¿Quitar ${name} del presupuesto?`, `Se quita de Mensual y de Por quincena (${money0(amt || 0)} al mes). ${isSave ? 'Tu meta de ahorro queda en cero.' : 'La categoría y sus movimientos se conservan; puedes volver a agregarla desde «Sin presupuesto».'}`, () => {
    const q = qState();
    if (isSave) S.data.savingsGoal = 0; else delete S.data.budgets[id];
    delete q.q1[id]; delete q.pay[id]; Object.values(q.paid || {}).forEach(m => { delete m[`${id}:a`]; delete m[`${id}:b`]; });
    saveData(); const y = scrollY; render(); window.scrollTo(0, y);
    toast(`${name} quitado del presupuesto`);
  }, 'Quitar');
}
/* Fijo = no se puede recortar (renta, deudas…). Por default: Casa y Deudas son fijos; se puede cambiar */
const isFixedCat = c => c.fixedCost ?? ['casa', 'deudas'].includes(c.group);
function setFixed(id, on) { if (id === QK_SAVE) qState().saveFixed = on; else { const c = byId(S.data.categories, id); if (c) c.fixedCost = on; } saveData(); }
/* Cuentas y tarjetas donde puede ir cada concepto, con su color */
function qPayOpts() {
  const acc = S.data.accounts.map((a, i) => ({ id: a.id, name: a.name, kind: a.type === 'efectivo' ? 'Efectivo' : 'Débito', color: col(a.color || CAT_COLORS[CAT_SPREAD[(i + 2) % CAT_SPREAD.length]]) }));
  const cards = S.data.cards.map((c, i) => ({ id: c.id, name: c.name, kind: 'Crédito', limit: c.limit, color: col(c.color || CAT_COLORS[CAT_SPREAD[(i + 6) % CAT_SPREAD.length]]) }));
  return [...cards, ...acc];
}
const qMoney = v => money0(Math.round(v));
function quincenasHTML(bs) {
  const rows = qRows(bs); if (!rows.length) return '';
  const [i1, i2] = qIncome(); const last = new Date(+S.month.slice(0, 4), +S.month.slice(5, 7), 0).getDate();
  const pays = qPayOpts();
  const opt = r => `<option value="">Sin asignar</option>${pays.map(p => `<option value="${p.id}"${p.id === r.pay ? ' selected' : ''}>${esc(p.name)}${fold(p.name).includes(fold(p.kind)) ? '' : ` · ${p.kind}`}</option>`).join('')}`;
  const paid = qPaid();
  const field = (cls, lbl, k, r, v) => { const pk = `${r.id}:${k}`, on = k !== 'm' && paid[pk];
    return `<div class="qz-f ${cls}${on ? ' paid' : ''}"><small>${lbl}${k !== 'm' ? `<em class="qz-ptag">${on ? 'pagado' : 'falta'}</em>` : ''}</small><span class="qz-in">${k !== 'm' ? `<button type="button" class="qz-chk" data-chk="${pk}" role="checkbox" aria-checked="${!!on}" aria-label="Marcar ${lbl.replace(/<[^>]+>/g, '')} de ${esc(r.name)} como pagado">${icon('check')}</button>` : ''}<i>$</i><input class="qn" type="number" inputmode="decimal" min="0" step="any" data-q="${k}" data-id="${r.id}" value="${v}" aria-label="${lbl.replace(/<[^>]+>/g, '')} de ${esc(r.name)}"></span></div>`; };
  const q2c = col('#3884B0');
  return `<section class="qz qz-tab" id="qz" style="--q1:var(--berry);--q2:${q2c}">
    <div class="card qz-card">
      <div class="ch"><div><h2>Por quincena</h2><p class="qz-sub">Edita el monto del mes o el de cada quincena: la otra se ajusta sola. Elige con qué pagas cada concepto, marca cuáles son fijos y palomea lo que ya pagaste en cada quincena.</p></div><button class="btn quiet sm" data-qreset>${icon('repeat')}Partes iguales</button></div>
      <div class="qz-legend"><span class="l1">1ª · del 1 al 15</span><span class="l2">2ª · del 16 al ${last}</span></div>
      ${[[true, 'Gastos fijos', 'No se pueden recortar: renta, servicios, deudas…', 'shield'], [false, 'Gastos que puedes ajustar', 'De aquí sale el recorte si no cuadra', 'scissors']].map(([fx, t, sub, ic]) => `<div class="qz-sec ${fx ? 'fixed' : 'flex'}" data-sec="${fx ? 'fixed' : 'flex'}">
        <div class="qz-sec-h"><span class="qz-sec-ic">${icon(ic)}</span><div><b>${t}</b><small>${sub}</small></div></div>
        <div class="qz-cols"><span class="c0">Concepto</span><span class="cm"><em>Mes</em><b data-st="m">$0</b></span><span class="ca"><em>1ª<span class="lg"> quincena</span></em><b data-st="a">$0</b></span><span class="cb"><em>2ª<span class="lg"> quincena</span></em><b data-st="b">$0</b></span><span class="cx"></span></div>
        <div class="qz-list">
      ${rows.filter(r => r.fixed === fx).map(r => `<div class="qz-row" data-row="${r.id}" style="--cat:${r.color}">
        <div class="qz-name"><span class="qz-ic">${icon(r.icon || 'dots')}</span><div class="qz-nt"><b>${esc(r.name)}</b><label class="qz-pay"><span class="qz-dot"></span><select data-pay="${r.id}" aria-label="Con qué pagas ${esc(r.name)}">${opt(r)}</select><svg class="i qz-caret" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></label></div></div>
        <div class="qz-acts"><button type="button" class="qz-kind" data-kind="${r.id}" aria-label="Cambiar entre fijo y ajustable" title="Cambiar entre fijo y ajustable">${r.fixed ? `${icon('shield')}<span>Fijo</span>` : `${icon('scissors')}<span>Ajustable</span>`}</button><button type="button" class="qz-del" data-unbudget="${r.id}" aria-label="Quitar ${esc(r.name)}" title="Quitar del presupuesto">${icon('trash')}</button></div>
        ${field('fm', 'Mes', 'm', r, r.total)}${field('fa', '1ª', 'a', r, r.a)}${field('fb', '2ª', 'b', r, r.b)}
        <div class="qz-split" aria-hidden="true"><i class="sa"></i><i class="sb"></i></div>
      </div>`).join('')}
        <div class="qz-none">Nada aquí todavía. Toca «${fx ? 'Ajustable' : 'Fijo'}» en un concepto para moverlo.</div>
        </div></div>`).join('')}
    </div>
    <h3 class="qz-h3">${icon('cal')}Total de cada quincena</h3>
    <div class="qz-tot">
      ${[[0, '1ª quincena', `1 al 15`, i1, 'q1'], [1, '2ª quincena', `16 al ${last}`, i2, 'q2']].map(([n, t, d, inc, c]) => `<div class="qz-qt ${c}" data-qt="${n}">
        <div class="qz-qh"><b>${t}</b><span>${d}</span></div>
        <div class="qz-big num" data-need>$0</div><div class="qz-cap">lo que necesitas</div>
        <label class="qz-inc"><small>Lo que entra</small><span class="qz-in"><i>$</i><input class="qn" type="number" inputmode="decimal" min="0" step="any" data-qi="${n}" value="${inc}"></span></label>
        <div class="qz-meter"><i></i></div>
        <div class="qz-badge" data-badge></div>
        <div class="qz-paid"><div class="qz-paid-h"><span>${icon('check')}Pagado <b data-pd>$0</b></span><span>Falta <b data-pf>$0</b></span></div><div class="qz-paid-bar"><i data-pbar></i></div><small data-pn></small></div>
      </div>`).join('')}
      <div class="qz-qt qm"><div class="qz-qh"><b>Todo el mes</b><span>${monthLabel(S.month)}</span></div><div class="qz-big num" data-mneed>$0</div><div class="qz-cap">de <b data-minc></b> que entran</div><div class="qz-meter"><i></i></div><div class="qz-badge" data-mbadge></div></div>
    </div>
    <h3 class="qz-h3">${icon('card')}Cuánto va en cada tarjeta o cuenta</h3>
    <div class="qz-cards" data-cards></div>
  </section>`;
}
/* Arma el movimiento de un concepto en una quincena (gasto o ahorro) según con qué se paga */
function qTxFor(id, k, amt, payId, name) {
  const ym = S.month; const qn = k === 'a' ? '1ª quincena' : '2ª quincena'; const isSave = id === QK_SAVE;
  const card = byId(S.data.cards, payId); const acc = byId(S.data.accounts, payId) || (!card ? S.data.accounts[0] : null);
  if (!(amt > 0) || (isSave ? !acc : !(card || acc))) return null;
  const today = todayISO(); const d = +today.slice(8, 10);
  const date = today.slice(0, 7) === ym && (k === 'a' ? d <= 15 : d >= 16) ? today : `${ym}-${k === 'a' ? '01' : '16'}`;
  return isSave ? { id: uid(), type: 'ahorro', amount: amt, date, desc: `Ahorro · ${qn}`, accountId: acc.id, categoryId: null, targetId: null, fixed: false, notes: '' }
    : { id: uid(), type: 'gasto', amount: amt, date, desc: `${name} · ${qn}`, categoryId: id, accountId: card ? card.id : acc.id, method: card ? 'credito' : (acc.type === 'efectivo' ? 'efectivo' : 'debito'), fixed: isFixedCat(byId(S.data.categories, id) || {}), targetId: null, notes: '' };
}
/* Marca (o desmarca) de golpe todo lo que va en una tarjeta/cuenta en una quincena */
function qToggleCard(payId, k, box) {
  const P = qPaid(); const qn = k === 'a' ? '1ª quincena' : '2ª quincena';
  const rows = [...box.querySelectorAll('[data-row]')].filter(r => r.querySelector('[data-pay]').value === payId).map(r => ({ id: r.dataset.row, name: r.querySelector('b').textContent, amt: parseFloat(r.querySelector(`[data-q=${k}]`).value) || 0 })).filter(r => r.amt > 0);
  if (!rows.length) return;
  const pay = byId(S.data.cards, payId) || byId(S.data.accounts, payId); const pname = pay ? pay.name : 'Sin asignar';
  const pending = rows.filter(r => !P[`${r.id}:${k}`]);
  const refresh = () => { const y = scrollY; render(); window.scrollTo(0, y); };
  if (pending.length) {
    const total = sum(pending, r => r.amt);
    const txs = pending.map(r => ({ r, tx: qTxFor(r.id, k, r.amt, payId, r.name) }));
    const can = txs.filter(x => x.tx);
    const btns = [];
    if (can.length) btns.push({ label: `${icon('plus')}Sí, registrar ${can.length} movimiento${can.length === 1 ? '' : 's'}`, cls: 'primary', fn: () => { txs.forEach(({ r, tx }) => { if (tx) { S.data.transactions.push(tx); P[`${r.id}:${k}`] = tx.id; } else P[`${r.id}:${k}`] = true; }); saveData(); refresh(); toast(`${pname} · ${qn}: pagado y registrado (${money0(total)})`); } });
    btns.push({ label: `${icon('check')}Solo marcar como pagado`, cls: can.length ? 'quiet' : 'primary', fn: () => { pending.forEach(r => { P[`${r.id}:${k}`] = true; }); saveData(); refresh(); toast(`${pname} · ${qn}: marcado como pagado`); } });
    choiceBox(`¿Marcar ${pname} · ${qn} como pagada?`, `Se marcan <b>${pending.length} concepto${pending.length === 1 ? '' : 's'}</b> por <b>${money0(total)}</b>: ${pending.map(r => esc(r.name)).join(', ')}. ¿También los registro como movimientos? Si ya los registraste, elige «Solo marcar».`, btns);
  } else {
    const linked = rows.map(r => P[`${r.id}:${k}`]).filter(v => typeof v === 'string').map(id => byId(S.data.transactions, id)).filter(Boolean);
    const unmark = () => rows.forEach(r => delete P[`${r.id}:${k}`]);
    if (!linked.length) { unmark(); saveData(); refresh(); toast(`${pname} · ${qn}: desmarcada`); return; }
    choiceBox(`¿Desmarcar ${pname} · ${qn}?`, `Al marcarla se registraron <b>${linked.length} movimiento${linked.length === 1 ? '' : 's'}</b> por <b>${money0(sum(linked))}</b>.`, [
      { label: `${icon('trash')}Desmarcar y borrar los movimientos`, cls: 'danger', fn: () => { const ids = new Set(linked.map(t => t.id)); S.data.transactions = S.data.transactions.filter(t => !ids.has(t.id)); unmark(); saveData(); refresh(); toast('Movimientos borrados'); } },
      { label: 'Solo desmarcar (conservar movimientos)', cls: 'quiet', fn: () => { unmark(); saveData(); refresh(); } },
    ]);
  }
}
/* Marcar una quincena como pagada: pregunta si también se registra como movimiento */
function qTogglePaid(ck, paint) {
  const P = qPaid(); const pk = ck.dataset.chk; const [id, k] = pk.split(':'); const ym = S.month;
  const row = ck.closest('[data-row]'); const name = row.querySelector('b').textContent;
  const amt = parseFloat(row.querySelector(`[data-q=${k}]`).value) || 0; const qn = k === 'a' ? '1ª quincena' : '2ª quincena';
  const payId = row.querySelector('[data-pay]').value; const isSave = id === QK_SAVE;
  const card = byId(S.data.cards, payId); const acc = byId(S.data.accounts, payId) || (!card ? S.data.accounts[0] : null);
  const setUI = on => { const f = ck.closest('.qz-f'); f.classList.toggle('paid', on); ck.setAttribute('aria-checked', on); f.querySelector('.qz-ptag').textContent = on ? 'pagado' : 'falta'; ck.classList.remove('pop'); void ck.offsetWidth; ck.classList.add('pop'); paint(); };
  const refresh = () => { const y = scrollY; render(); window.scrollTo(0, y); };
  if (!P[pk]) {
    // fecha: hoy si cae en esa quincena de este mes; si no, el primer día de la quincena
    const last = daysIn(ym); const today = todayISO(); const d = +today.slice(8, 10);
    const date = today.slice(0, 7) === ym && (k === 'a' ? d <= 15 : d >= 16) ? today : `${ym}-${k === 'a' ? '01' : '16'}`;
    const canTx = amt > 0 && (isSave ? !!acc : !!(card || acc));
    const where = isSave ? (acc ? acc.name : '') : card ? `${card.name} (crédito)` : acc ? acc.name : '';
    const btns = [];
    if (canTx) btns.push({ label: `${icon('plus')}Sí, registrar movimiento`, cls: 'primary', fn: () => {
      const tx = qTxFor(id, k, amt, payId, name);
      S.data.transactions.push(tx); P[pk] = tx.id; saveData(); refresh(); toast(`Pagado y registrado: ${money0(amt)}`); } });
    btns.push({ label: `${icon('check')}Solo marcar como pagado`, cls: canTx ? 'quiet' : 'primary', fn: () => { P[pk] = true; saveData(); setUI(true); toast('Marcado como pagado'); } });
    choiceBox(`${name} · ${qn}: ¿lo registro como movimiento?`,
      canTx ? `Se agrega un ${isSave ? 'ahorro' : 'gasto'} de <b>${money0(amt)}</b> el ${dateLabel(date)}${where ? ` desde <b>${esc(where)}</b>` : ''}, y cuenta en tu presupuesto del mes. Si ya lo registraste antes, elige «Solo marcar».`
        : amt > 0 ? 'Para registrarlo como movimiento necesitas una cuenta. Elige con qué pagas este concepto o agrega una en Cuentas y ajustes.' : 'Este concepto no tiene monto en esta quincena.', btns);
  } else {
    const tx = typeof P[pk] === 'string' ? byId(S.data.transactions, P[pk]) : null;
    if (!tx) { delete P[pk]; saveData(); setUI(false); return; }
    choiceBox(`¿Desmarcar ${name} · ${qn}?`, `Cuando lo marcaste se registró un movimiento de <b>${money0(tx.amount)}</b> (${dateLabel(tx.date)}).`, [
      { label: `${icon('trash')}Desmarcar y borrar el movimiento`, cls: 'danger', fn: () => { S.data.transactions = S.data.transactions.filter(t => t.id !== tx.id); delete P[pk]; saveData(); refresh(); toast('Movimiento borrado'); } },
      { label: 'Solo desmarcar (conservar movimiento)', cls: 'quiet', fn: () => { delete P[pk]; saveData(); setUI(false); } },
    ]);
  }
}
function bindQuincenas(root) {
  root.querySelectorAll('[data-btab]').forEach(t => t.addEventListener('click', () => { S.budTab = t.dataset.btab; try { localStorage.setItem('rawmoney.budtab', S.budTab); } catch (e) {} render(); }));
  bindFreelance(root);
  root.querySelectorAll('[data-unbudget]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); removeBudget(b.dataset.unbudget); }));
  const box = root.querySelector('#qz'); if (!box) return;
  const q = qState(); const pays = qPayOpts();
  const num = el => Math.max(0, parseFloat(el.value) || 0);
  const get = (id, k) => box.querySelector(`[data-q=${k}][data-id="${id}"]`);
  const rowData = () => [...box.querySelectorAll('[data-row]')].map(r => { const id = r.dataset.row; return { id, el: r, name: r.querySelector('b').textContent, color: r.style.getPropertyValue('--cat'), m: num(get(id, 'm')), a: num(get(id, 'a')), b: num(get(id, 'b')), pay: r.querySelector('[data-pay]').value }; });
  const status = (need, inc) => { const d = inc - need; return d >= 0 ? `<span class="ok">${icon('check')}Cuadra</span><small>${d ? `Te sobran ${qMoney(d)}` : 'Exacto'}</small>` : `<span class="no">${icon('alert')}No cuadra</span><small>Faltan ${qMoney(-d)}</small>`; };
  const paint = () => {
    const rows = rowData(); const I = [...box.querySelectorAll('[data-qi]')].map(num);
    const A = sum(rows, r => r.a), B = sum(rows, r => r.b), M = sum(rows, r => r.m);
    box.querySelectorAll('[data-sec]').forEach(sec => { const rs = rows.filter(r => sec.contains(r.el)); [['m', 'm'], ['a', 'a'], ['b', 'b']].forEach(([k]) => { sec.querySelector(`[data-st=${k}]`).textContent = qMoney(sum(rs, r => r[k])); }); sec.classList.toggle('empty', !rs.length); });
    rows.forEach(r => { const p = r.m ? r.a / r.m * 100 : 50; r.el.style.setProperty('--pa', p + '%'); const po = pays.find(x => x.id === r.pay); r.el.style.setProperty('--pay', po ? po.color : 'var(--line-strong)'); r.el.classList.toggle('unpaid', !po); });
    const P = qPaid(); const paidOf = k => sum(rows.filter(r => P[`${r.id}:${k}`]), r => r[k]); const cnt = k => rows.filter(r => r[k] > 0 && !P[`${r.id}:${k}`]).length;
    [[0, 'a', A], [1, 'b', B]].forEach(([n, k, need]) => { const t = box.querySelector(`[data-qt="${n}"]`); const pd = paidOf(k); const c = cnt(k);
      t.querySelector('[data-pd]').textContent = qMoney(pd); t.querySelector('[data-pf]').textContent = qMoney(Math.max(0, need - pd));
      t.querySelector('[data-pbar]').style.width = (need ? Math.min(100, pd / need * 100) : 0) + '%';
      t.querySelector('[data-pn]').textContent = c ? `${c} pago${c === 1 ? '' : 's'} pendiente${c === 1 ? '' : 's'}` : 'Todo pagado ✓'; t.classList.toggle('alldone', !c && need > 0); });
    rows.forEach(r => r.el.classList.toggle('done', !!((r.a <= 0 || P[`${r.id}:a`]) && (r.b <= 0 || P[`${r.id}:b`]))));
    [[0, A], [1, B]].forEach(([n, need]) => { const t = box.querySelector(`[data-qt="${n}"]`); t.querySelector('[data-need]').textContent = qMoney(need); const ok = need <= I[n]; t.classList.toggle('bad', !ok); t.querySelector('.qz-meter i').style.width = Math.min(100, I[n] ? need / I[n] * 100 : 100) + '%'; t.querySelector('[data-badge]').innerHTML = status(need, I[n]); });
    const mt = box.querySelector('.qz-qt.qm'); mt.querySelector('[data-mneed]').textContent = qMoney(M); mt.querySelector('[data-minc]').textContent = qMoney(I[0] + I[1]); mt.classList.toggle('bad', M > I[0] + I[1]); mt.querySelector('.qz-meter i').style.width = Math.min(100, (I[0] + I[1]) ? M / (I[0] + I[1]) * 100 : 100) + '%'; mt.querySelector('[data-mbadge]').innerHTML = status(M, I[0] + I[1]);
    // por tarjeta / cuenta
    const groups = [...pays, { id: '', name: 'Sin asignar', kind: 'Elige con qué pagas', color: 'var(--ink-3)' }].map(p => ({ ...p, rows: rows.filter(r => r.pay === p.id && r.m > 0) })).filter(g => g.rows.length || (g.id && g.kind === 'Crédito'));
    box.querySelector('[data-cards]').innerHTML = groups.map(g => { const T = sum(g.rows, r => r.m), GA = sum(g.rows, r => r.a), GB = sum(g.rows, r => r.b);
      const lim = g.limit ? Math.min(100, T / g.limit * 100) : null;
      return `<div class="qz-cc${g.id ? '' : ' none'}${g.kind === 'Crédito' ? ' credit' : ''}" style="--cc:${g.color}">
        <div class="qz-cc-top"><span class="qz-cc-chip"></span><div><b>${esc(g.name)}</b><small>${g.kind}${g.rows.length ? ` · ${g.rows.length} concepto${g.rows.length === 1 ? '' : 's'}` : ''}</small></div></div>
        <div class="qz-cc-big num">${qMoney(T)}<small>/ mes</small></div>
        <div class="qz-cc-pay">${[['a', '1ª quincena', GA], ['b', '2ª quincena', GB]].map(([k, l, v]) => { const rs = g.rows.filter(r => r[k] > 0); const pd = rs.filter(r => P[`${r.id}:${k}`]); const all = rs.length && pd.length === rs.length; const part = pd.length && !all;
          return `<button type="button" class="qz-ccp ${k}${all ? ' on' : ''}${part ? ' part' : ''}" data-ccpay="${g.id}:${k}"${rs.length ? '' : ' disabled'} aria-pressed="${!!all}"><span class="qz-ccp-box">${icon('check')}</span><span class="qz-ccp-t"><em>${l}</em><b>${qMoney(v)}</b><small>${!rs.length ? 'Nada que pagar' : all ? 'Pagada ✓' : part ? `${pd.length} de ${rs.length} pagados` : 'Marcar pagada'}</small></span></button>`; }).join('')}</div>
        <div class="qz-cc-bar">${g.rows.map(r => `<i style="flex:${r.m};background:${r.color}" title="${esc(r.name)}"></i>`).join('') || '<em>Sin conceptos todavía</em>'}</div>
        ${g.rows.length ? `<div class="qz-cc-tags">${g.rows.map(r => `<span style="--c:${r.color}">${esc(r.name)}</span>`).join('')}</div>` : ''}
        ${lim != null ? `<div class="qz-cc-lim"><div><span>De tu línea de ${qMoney(g.limit)}</span><b>${pct(lim)}</b></div><div class="qz-meter"><i style="width:${lim}%"></i></div></div>` : ''}
      </div>`; }).join('') || '<div class="qz-empty">Aún no tienes tarjetas ni cuentas. Agrégalas en Tarjetas o en Cuentas y ajustes.</div>';
  };
  box.addEventListener('input', e => {
    const el = e.target, id = el.dataset.id, k = el.dataset.q;
    if (k === 'm') {
      const a = get(id, 'a'), b = get(id, 'b'); const old = num(a) + num(b); const ratio = old ? num(a) / old : .5; const m = num(el);
      const na = Math.round(m * ratio * 100) / 100; a.value = na; b.value = Math.round((m - na) * 100) / 100; q.q1[id] = na;
    } else if (k === 'a' || k === 'b') {
      const m = num(get(id, 'm')), v = Math.min(m, num(el)); const other = get(id, k === 'a' ? 'b' : 'a');
      other.value = Math.round((m - v) * 100) / 100; q.q1[id] = k === 'a' ? v : m - v;
    }
    if (el.dataset.qi) q.income = [...box.querySelectorAll('[data-qi]')].map(num);
    paint();
  });
  box.addEventListener('change', e => {
    const el = e.target, id = el.dataset.id;
    if (el.dataset.pay !== undefined) { if (el.value) q.pay[el.dataset.pay] = el.value; else delete q.pay[el.dataset.pay]; paint(); }
    if (el.dataset.q === 'm') { const m = num(el); if (!(m > 0)) { toast('El monto del mes debe ser mayor a cero'); el.value = id === QK_SAVE ? S.data.savingsGoal : S.data.budgets[id]; el.dispatchEvent(new Event('input', { bubbles: true })); return; } if (id === QK_SAVE) S.data.savingsGoal = m; else S.data.budgets[id] = m; }
    if (el.dataset.q === 'a' || el.dataset.q === 'b') { const m = num(get(id, 'm')); if (num(el) > m) { el.value = m; el.dispatchEvent(new Event('input', { bubbles: true })); } }
    saveData();
  });
  box.addEventListener('click', e => {
    const cp = e.target.closest('[data-ccpay]');
    if (cp) { const [pid, k] = cp.dataset.ccpay.split(':'); qToggleCard(pid, k, box); return; }
    const ck = e.target.closest('[data-chk]');
    if (ck) { qTogglePaid(ck, paint); return; }
    const k = e.target.closest('[data-kind]'); if (!k) return;
    const row = k.closest('[data-row]'); const toFixed = !row.closest('[data-sec=fixed]');
    setFixed(k.dataset.kind, toFixed);
    const list = box.querySelector(`[data-sec=${toFixed ? 'fixed' : 'flex'}] .qz-list`); list.insertBefore(row, list.querySelector('.qz-none'));
    k.innerHTML = toFixed ? `${icon('shield')}<span>Fijo</span>` : `${icon('scissors')}<span>Ajustable</span>`;
    row.classList.remove('moved'); void row.offsetWidth; row.classList.add('moved');
    toast(toFixed ? `${row.querySelector('b').textContent} ahora es fijo` : `${row.querySelector('b').textContent} ahora es ajustable`);
    paint();
  });
  box.querySelector('[data-qreset]').addEventListener('click', () => { q.q1 = {}; saveData(); render(); toast('Repartido en partes iguales'); });
  paint();
}
function viewPresupuesto() {
  const tab = S.budTab || (() => { try { return localStorage.getItem('rawmoney.budtab'); } catch (e) { return null; } })() || 'mes'; S.budTab = tab;
  const ym = S.month; const bs = budgetStatus(ym); const s = monthSummary(ym);
  const totalB = sum(bs, b => b.budget), totalS = sum(bs, b => b.spent);
  const without = S.data.categories.filter(c => c.kind === 'gasto' && !S.data.budgets[c.id]);
  return `
  <div class="ph"><div><div class="eyebrow">${monthLabel(ym)}</div><h1>Presupuesto</h1><p>Presupuestado <b class="num">${money0(totalB)}</b> · gastado <b class="num">${money0(totalS)}</b> · ${bs.filter(b => b.over).length ? `<b class="neg">${bs.filter(b => b.over).length} categoría${bs.filter(b => b.over).length === 1 ? '' : 's'} excedida${bs.filter(b => b.over).length === 1 ? '' : 's'}</b>` : 'todo en orden'}</p></div>
    <div class="acts"><button class="btn" data-act="plan">${icon('sparkle')}<span>Cargar mi plan</span></button><button class="btn primary" data-act="new-budget">${icon('plus')}<span>Nuevo concepto</span></button></div></div>
  <div class="vtabs" role="tablist" aria-label="Vista del presupuesto">
    <button role="tab" data-btab="mes" aria-selected="${tab === 'mes'}" class="${tab === 'mes' ? 'on' : ''}">${icon('target')}<span>Mensual</span></button>
    <button role="tab" data-btab="quincena" aria-selected="${tab === 'quincena'}" class="${tab === 'quincena' ? 'on' : ''}">${icon('cal')}<span>Por quincena</span></button>
    <button role="tab" data-btab="freelance" aria-selected="${tab === 'freelance'}" class="${tab === 'freelance' ? 'on' : ''}">${icon('briefcase')}<span>Freelance</span></button>
  </div>
  ${tab === 'freelance' ? freelanceHTML() : tab === 'quincena' ? (quincenasHTML(bs) || '<div class="card"><div class="empty"><h3>Aún no hay conceptos</h3><p>Agrega conceptos con monto en la pestaña Mensual y aquí se reparten por quincena.</p></div></div>') : `
  <section class="g23">
    <div class="card">${bs.length ? budGrouped(bs).map(b => b.head ? `<div class="bud-g"><span>${esc(b.head)}</span><div class="bud-g-n"><b class="num">${money0(b.spent)}</b><small>de ${money0(b.total)}</small></div></div>` : `<div class="bud${b.over ? ' over' : ''}">
      <div class="h">${catIcon(b.cat)}<div class="nm"><b>${esc(b.cat.name)}</b><small>Gastado <em>${money0(b.spent)}</em> de ${money0(b.budget)}</small></div>
        <div class="v"><b class="num">${b.over ? `−${money0(-b.left)}` : money0(b.left)}</b><span>${b.over ? 'te pasaste' : 'disponible'}</span></div>
        <div class="bud-acts"><button class="ib" data-budget="${b.cat.id}" title="Editar concepto" aria-label="Editar ${esc(b.cat.name)}">${icon('edit')}</button><button class="ib del" data-unbudget="${b.cat.id}" title="Quitar del presupuesto" aria-label="Quitar ${esc(b.cat.name)}">${icon('trash')}</button></div></div>
      <div class="bud-bar"><div class="bar ${b.over ? 'b' : b.pct > 85 ? 'w' : 'g'}"><i style="width:${Math.min(100, b.pct)}%"></i></div><span>${pct(b.pct)}</span></div></div>`).join('') : `<div class="empty"><h3>Sin presupuestos</h3><p>Agrega tus conceptos (renta, súper, café…) con un monto para saber cuánto te queda.</p><button class="btn primary" data-act="new-budget">${icon('plus')}<span>Nuevo concepto</span></button></div>`}</div>
    <div class="card soft"><div class="ch"><h2>Resumen</h2></div>
      <div class="stat"><div class="lb">Total presupuestado</div><div class="v num">${money0(totalB)}</div><div class="s">${s.ingresos ? `${pct(totalB / s.ingresos * 100)} de tus ingresos del mes` : ''}</div></div>
      <div class="bar thick ${totalS > totalB ? 'b' : 'g'}"><i style="width:${totalB ? Math.min(100, totalS / totalB * 100) : 0}%"></i></div>
      <div class="stat"><div class="lb">Gastado en categorías con presupuesto</div><div class="v num">${money0(totalS)}</div><div class="s">${totalB ? (totalS > totalB ? `Excedido por ${money0(totalS - totalB)}` : `Quedan ${money0(totalB - totalS)}`) : ''}</div></div>
      ${without.length ? `<div><div class="eyebrow" style="margin-bottom:8px">Sin presupuesto</div><div class="chips">${without.map(c => `<button class="chip" data-budget="${c.id}">${esc(c.name)}${s.byCat[c.id] ? ` · ${money0(s.byCat[c.id])}` : ''}</button>`).join('')}</div></div>` : ''}
    </div>
  </section>`}`;
}

/* ---------- CALENDARIO ---------- */
function viewCalendario() {
  const ym = S.month; const ev = monthEvents(ym); const [y, m] = ym.split('-').map(Number); const today = todayISO();
  const first = new Date(y, m - 1, 1); const startDow = (first.getDay() + 6) % 7; const nd = daysIn(ym);
  const cells = []; for (let i = 0; i < startDow; i++) cells.push(null); for (let d = 1; d <= nd; d++) cells.push(d); while (cells.length % 7) cells.push(null);
  const byDay = {}; ev.forEach(e => { const d = Number(e.date.slice(8)); (byDay[d] = byDay[d] || []).push(e); });
  const evHtml = e => `<div class="ev${e.paid ? ' paid' : ''}" style="--c:${KIND_COLOR[e.kind]}" data-ev="${e.kind}:${e.id}" data-tip="<b>${esc(e.name)}</b>${e.amount != null ? money0(e.amount) + ' · ' : ''}${KIND_LABEL[e.kind]}${e.sub ? ' · ' + esc(e.sub) : ''}"><span>${esc(e.name)}</span>${e.amount != null ? `<b>${money0(e.amount)}</b>` : ''}</div>`;
  const total = sum(ev.filter(e => e.amount != null && e.kind !== 'corte'), e => e.amount);
  const pending = sum(ev.filter(e => e.amount != null && !e.paid && e.kind !== 'corte'), e => e.amount);
  return `
  <div class="ph"><div><div class="eyebrow">${monthLabel(ym)}</div><h1>Calendario de pagos</h1><p>${ev.filter(e => e.kind !== 'corte').length} pagos por <b class="num">${money0(total)}</b> · faltan <b class="num att">${money0(pending)}</b></p></div>
    <div class="leg2">${Object.entries(KIND_LABEL).map(([k, v]) => `<span><i class="sq" style="--c:${KIND_COLOR[k]}"></i>${v}</span>`).join('')}</div></div>
  <section class="card"><div class="cal">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `<div class="wd">${d}</div>`).join('')}
    ${cells.map(d => { if (!d) return '<div class="d out"></div>'; const iso = clampDay(ym, d); const list = byDay[d] || []; return `<div class="d${iso === today ? ' today' : ''}"><div class="n">${d}</div>${list.slice(0, 3).map(evHtml).join('')}${list.length > 3 ? `<div class="more">+${list.length - 3} más</div>` : ''}</div>`; }).join('')}</div>
    <div class="agenda">${ev.filter(e => e.kind !== 'corte').length ? ev.map(e => `<div class="row${e.date === today ? ' today' : ''}"><div class="dt"><b>${Number(e.date.slice(8))}</b><span>${MESES_C[m - 1]}</span></div><span class="ic" style="--cat:${KIND_COLOR[e.kind]};--cat-soft:color-mix(in srgb, ${KIND_COLOR[e.kind]} 14%, var(--surface))">${icon(e.kind === 'tarjeta' ? 'card' : e.kind === 'deuda' ? 'bank' : e.kind === 'meses' ? 'layers' : e.kind === 'corte' ? 'clock' : 'repeat')}</span><div class="tx"><b>${esc(e.name)}</b><span>${KIND_LABEL[e.kind]}${e.sub ? ' · ' + esc(e.sub) : ''}</span></div><div class="am ${e.paid ? 'pos' : e.kind === 'corte' ? 'mut' : 'att'}">${e.amount != null ? money0(e.amount) : '—'}${e.paid ? '<small>pagado</small>' : e.kind !== 'corte' ? '<small>pendiente</small>' : ''}</div></div>`).join('') : '<div class="empty"><h3>Sin pagos programados</h3><p>Agrega tarjetas, deudas o gastos recurrentes para verlos aquí.</p></div>'}</div></section>`;
}

/* ---------- RESUMEN ---------- */
function viewResumen() {
  const ym = S.month; const s = monthSummary(ym);
  const parts = [{ name: 'Gastos pagados', value: s.gastosCash, color: col(OTHERS_COLOR) }, { name: 'Pagos de tarjeta', value: s.pagosTarjeta, color: col('#AE86CF') }, { name: 'Pagos de deudas', value: s.pagosDeuda, color: col('#D0876F') }, { name: 'Ahorro', value: s.ahorro, color: col('#6DB27C') }, { name: 'Disponible', value: Math.max(0, s.queda), color: col('#5DB3A4') }];
  return `
  <div class="ph"><div><div class="eyebrow">${monthLabel(ym)}</div><h1>Resumen financiero</h1><p>Cómo se distribuyó tu ingreso del mes.</p></div></div>
  <section class="stats g5" id="res-tiles">
    <div class="stat pos"><div class="lb"><i></i>Ingresos</div><div class="v num">${money0(s.ingresos)}</div></div>
    <div class="stat"><div class="lb"><i></i>Gastos</div><div class="v num">${money0(s.gastosTotal)}</div><div class="s">${money0(s.gastosCredito)} con crédito</div></div>
    <div class="stat neg"><div class="lb"><i></i>Deudas / pagos</div><div class="v num">${money0(s.pagosTarjeta + s.pagosDeuda)}</div><div class="s">tarjetas ${money0(s.pagosTarjeta)} · deudas ${money0(s.pagosDeuda)}</div></div>
    <div class="stat pos"><div class="lb"><i></i>Ahorro</div><div class="v num">${money0(s.ahorro)}</div><div class="s">${pct(s.ahorroPct)} del ingreso</div></div>
    <div class="stat plum"><div class="lb"><i></i>Disponible</div><div class="v num ${s.queda < 0 ? 'neg' : ''}">${money0(s.queda)}</div><div class="s">${s.queda < 0 ? 'gastaste más de lo que entró' : 'te queda del mes'}</div></div>
  </section>
  <section class="card"><div class="ch"><h2>Flujo del dinero</h2></div>${s.ingresos ? flowSVG(s.ingresos, parts) : '<div class="empty"><h3>Sin ingresos este mes</h3><p>Registra un ingreso para ver el flujo.</p></div>'}
    <p class="mut" style="font-size:12.5px">Las compras con tarjeta (${money0(s.gastosCredito)}) no salen de tu cuenta al momento: salen cuando pagas la tarjeta. Por eso aquí aparecen los pagos de tarjeta y no las compras, para no contar dos veces.</p></section>
  <section class="g2">
    <div class="card"><div class="ch"><h2>Gastos</h2></div><dl class="detail"><dt>Fijos</dt><dd class="num">${money0(s.fijos)}</dd><dt>Variables</dt><dd class="num">${money0(s.variables)}</dd><dt>Con crédito</dt><dd class="num">${money0(s.gastosCredito)}</dd><dt>Efectivo / débito</dt><dd class="num">${money0(s.gastosCash)}</dd><dt>Mensualidades</dt><dd class="num">${money0(s.instMonthly)}</dd></dl></div>
    <div class="card"><div class="ch"><h2>Deudas al cierre</h2></div><dl class="detail"><dt>Tarjetas</dt><dd class="num">${money0(s.tarjetasTotal)}</dd><dt>Otras deudas</dt><dd class="num">${money0(s.deudasTotal)}</dd><dt>Total</dt><dd class="num" style="font-weight:700">${money0(s.tarjetasTotal + s.deudasTotal)}</dd><dt>Ahorro acumulado</dt><dd class="num pos">${money0(s.savings)}</dd><dt>En cuentas</dt><dd class="num">${money0(s.disponibleCuentas)}</dd></dl></div>
  </section>`;
}

/* ---------- HISTORIAL ---------- */
function viewHistorial() {
  const months = monthsWithData(); const n = Math.min(12, Math.max(6, months.length));
  const H = historySeries(n, S.month >= thisMonth() ? S.month : thisMonth()); const labels = H.map(h => monthShort(h.ym));
  const catTotals = {}; H.forEach(h => Object.entries(h.byCat).forEach(([id, v]) => { catTotals[id] = (catTotals[id] || 0) + v; }));
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => cat(id));
  const restIds = Object.keys(catTotals).filter(id => !topCats.some(c => c.id === id));
  const catSeries = topCats.map(c => ({ name: c.name, color: col(c.color), values: H.map(h => h.byCat[c.id] || 0) })); if (restIds.length) catSeries.push({ name: 'Otras', color: col(OTHERS_COLOR), values: H.map(h => restIds.reduce((a, id) => a + (h.byCat[id] || 0), 0)) });
  const A = S.histA || addMonths(S.month, -1), B = S.histB || S.month; const sa = monthSummary(A), sb = monthSummary(B);
  const cmp = [['Ingresos', 'ingresos', true], ['Gastos', 'gastosTotal', false], ['Gastos fijos', 'fijos', false], ['Gastos variables', 'variables', false], ['Pagos de tarjeta', 'pagosTarjeta', false], ['Pagos de deudas', 'pagosDeuda', false], ['Ahorro', 'ahorro', true], ['Disponible', 'queda', true], ['Deuda en tarjetas', 'tarjetasTotal', false], ['Otras deudas', 'deudasTotal', false]];
  const catsAB = [...new Set([...Object.keys(sa.byCat), ...Object.keys(sb.byCat)])].map(id => ({ c: cat(id), a: sa.byCat[id] || 0, b: sb.byCat[id] || 0 })).sort((x, y) => (y.b + y.a) - (x.b + x.a));
  const opts = sel => months.slice().reverse().map(m => `<option value="${m}"${m === sel ? ' selected' : ''}>${monthLabel(m)}</option>`).join('');
  return `
  <div class="ph"><div><div class="eyebrow">Últimos ${n} meses</div><h1>Historial</h1><p>Cómo han evolucionado tus ingresos, gastos, ahorro y deudas.</p></div><div class="chips">${months.slice().reverse().slice(0, 8).map(m => `<button class="chip${m === S.month ? ' on' : ''}" data-month="${m}">${monthShort(m)}</button>`).join('')}</div></div>
  <section class="g2">
    <div class="card"><div class="ch"><h2>Ingresos, gastos y ahorro</h2></div>${linesSVG(labels, [{ name: 'Ingresos', color: col('#6DB27C'), values: H.map(h => h.ingresos) }, { name: 'Gastos', color: col('#AE86CF'), values: H.map(h => h.gastosTotal) }, { name: 'Ahorro', color: col('#5DB3A4'), values: H.map(h => h.ahorro) }], { area: true })}</div>
    <div class="card"><div class="ch"><h2>Deuda total al cierre</h2></div>${barsSVG(labels, [{ name: 'Tarjetas', color: col('#AE86CF'), values: H.map(h => h.tarjetasTotal) }, { name: 'Otras deudas', color: col('#D0876F'), values: H.map(h => h.deudasTotal) }], { stacked: true })}</div>
  </section>
  <section class="card"><div class="ch"><h2>Gasto por categoría</h2></div>${barsSVG(labels, catSeries, { stacked: true, h: 260 })}</section>
  <section class="card"><div class="ch"><h2>Comparar dos meses</h2></div>
    <div class="hist-cmp"><select class="sel" id="cmp-a">${opts(A)}</select><span class="mut">vs</span><select class="sel" id="cmp-b">${opts(B)}</select></div>
    <div class="tscroll"><table class="tbl cmp-tbl"><thead><tr><th>Concepto</th><th class="n">${monthLabel(A)}</th><th class="n">${monthLabel(B)}</th><th class="n">Cambio</th></tr></thead><tbody>
      ${cmp.map(([lb, k, goodUp]) => { const a = sa[k], b = sb[k]; const d = a ? (b - a) / Math.abs(a) * 100 : null; const cls = d == null || Math.abs(d) < 1 ? '' : (d > 0) === goodUp ? 'down' : 'up'; return `<tr><td>${lb}</td><td class="n">${money0(a)}</td><td class="n"><b>${money0(b)}</b></td><td class="n"><span class="delta ${cls}">${d == null ? '—' : (d > 0 ? '+' : '') + Math.round(d) + '%'}</span></td></tr>`; }).join('')}
      <tr><td colspan="4" class="eyebrow" style="padding-top:16px">Por categoría</td></tr>
      ${catsAB.map(({ c, a, b }) => `<tr><td><span class="catdot" style="display:inline-flex;align-items:center;gap:8px"><i style="width:10px;height:10px;border-radius:3px;background:${col(c.color)}"></i>${esc(c.name)}</span></td><td class="n">${money0(a)}</td><td class="n"><b>${money0(b)}</b></td><td class="n">${deltaTag(a ? (b - a) / a * 100 : null)}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}
function bindHistorial(root) {
  root.querySelector('#cmp-a').addEventListener('change', e => { S.histA = e.target.value; render(); });
  root.querySelector('#cmp-b').addEventListener('change', e => { S.histB = e.target.value; render(); });
  root.querySelectorAll('[data-month]').forEach(b => b.addEventListener('click', () => { S.month = b.dataset.month; S.histB = S.month; render(); }));
}

/* ---------- CATEGORÍAS ---------- */
function viewCategorias() {
  const ym = S.month; const s = monthSummary(ym); const cats = S.data.categories;
  const grp = kind => cats.filter(c => c.kind === kind).map(c => `<div class="catc" data-cat="${c.id}">${catIcon(c)}<div style="min-width:0"><b>${esc(c.name)}</b><span>${kind === 'gasto' ? (s.byCat[c.id] ? money0(s.byCat[c.id]) + ' este mes' : 'sin gastos este mes') : 'ingreso'}</span></div></div>`).join('');
  return `
  <div class="ph"><div><div class="eyebrow">Personaliza</div><h1>Categorías</h1><p>Cada categoría tiene su color e ícono en toda la app.</p></div><div class="acts"><button class="btn primary" data-act="new-cat">${icon('plus')}<span>Nueva categoría</span></button></div></div>
  <section class="card"><div class="ch"><h2>Gastos</h2></div><div class="catgrid">${grp('gasto')}</div></section>
  <section class="card"><div class="ch"><h2>Ingresos</h2></div><div class="catgrid">${grp('ingreso')}</div></section>`;
}

/* ---------- AJUSTES / CUENTAS ---------- */
function viewAjustes() {
  const ym = S.month;
  return `
  <div class="ph"><div><div class="eyebrow">Configura</div><h1>Cuentas y ajustes</h1><p>Tus cuentas de débito y efectivo, respaldo de datos y datos de demostración.</p></div><div class="acts"><button class="btn primary" data-act="new-acc">${icon('plus')}<span>Agregar cuenta</span></button></div></div>
  <section class="g2">
    <div class="card"><div class="ch"><h2>Cuentas</h2></div><div class="list">${S.data.accounts.length ? S.data.accounts.map(a => `<div class="row click" data-acc="${a.id}"><span class="ic" style="--cat:var(--green);--cat-soft:var(--green-soft)">${icon(a.type === 'efectivo' ? 'coins' : 'bank')}</span><div class="tx"><b>${esc(a.name)}</b><span>${a.type === 'efectivo' ? 'Efectivo' : 'Débito'}${a.institution ? ' · ' + esc(a.institution) : ''}</span></div><div class="am">${money0(accountBalance(a, ym))}<small>al cierre de ${monthShort(ym)}</small></div></div>`).join('') : '<div class="empty"><h3>Sin cuentas</h3><p>Agrega tu cuenta de débito o efectivo para saber cuánto tienes.</p></div>'}</div>
      <div class="f"><label for="goal">Meta de ahorro mensual</label><input class="inp" id="goal" type="number" min="0" step="100" value="${S.data.savingsGoal || ''}" placeholder="Ej. 3000"></div></div>
    <div class="card"><div class="ch"><h2>Datos</h2></div>
      ${S.data.demo ? `<p>Estás viendo <b>datos de demostración</b>. Cuando quieras empezar con tus finanzas reales, bórralos y comienza desde cero. Las categorías se conservan.</p><button class="btn danger" data-act="clear-demo" style="align-self:flex-start">${icon('trash')}Borrar datos de demostración</button>` : `<p>Tus datos se guardan en este navegador. Descarga un respaldo de vez en cuando.</p>`}
      <div class="chips"><button class="btn secondary sm" data-act="export">${icon('download')}Exportar respaldo</button><label class="btn secondary sm">${icon('upload')}Importar respaldo<input type="file" id="import" accept="application/json" hidden></label>${!S.data.demo ? `<button class="btn quiet sm" data-act="load-demo">Cargar datos demo</button>` : ''}<button class="btn danger sm" data-act="reset">Empezar de cero</button></div>
</div>
    ${typeof cloudCardHTML === 'function' ? cloudCardHTML() : ''}
  </section>`;
}
function bindAjustes(root) {
  if (typeof bindCloudCard === 'function') bindCloudCard(root);
  root.querySelector('#goal').addEventListener('change', e => { S.data.savingsGoal = Number(e.target.value) || 0; saveData(); toast('Meta guardada'); });
  root.querySelector('#import').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d.transactions || !d.categories) throw 0; d.version = 1; S.data = { ...emptyData(), ...d }; saveData(); render(); toast('Respaldo importado'); } catch (err) { toast('El archivo no es un respaldo válido'); } }; r.readAsText(f); });
}

const VIEWS = {
  inicio: { title: 'Inicio', icon: 'home2', fn: viewInicio },
  movimientos: { title: 'Movimientos', icon: 'list', fn: viewMovimientos, bind: bindMovimientos },
  gastos: { title: '¿En qué se fue?', icon: 'pie', fn: viewGastos },
  resumen: { title: 'Resumen del mes', icon: 'trend', fn: viewResumen },
  historial: { title: 'Historial', icon: 'history', fn: viewHistorial, bind: bindHistorial },
  tarjetas: { title: 'Tarjetas', icon: 'card', fn: viewTarjetas },
  deudas: { title: 'Deudas', icon: 'bank', fn: viewDeudas },
  recurrentes: { title: 'Recurrentes', icon: 'repeat', fn: viewRecurrentes },
  calendario: { title: 'Calendario', icon: 'cal', fn: viewCalendario },
  presupuesto: { title: 'Presupuesto', icon: 'target', fn: viewPresupuesto, bind: bindQuincenas },
  categorias: { title: 'Categorías', icon: 'grid', fn: viewCategorias },
  ajustes: { title: 'Cuentas y ajustes', icon: 'tools', fn: viewAjustes, bind: bindAjustes },
};
const NAV_GROUPS = [['Mi mes', ['inicio', 'presupuesto', 'movimientos', 'gastos', 'resumen', 'historial']], ['Lo que debo', ['tarjetas', 'deudas', 'recurrentes', 'calendario']], ['Mis reglas', ['categorias', 'ajustes']]];
