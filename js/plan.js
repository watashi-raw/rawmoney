/* ---------- Mi plan: gastos estimados de la usuaria + propuesta ajustada ----------
   Dos versiones: “mine” (sus cifras tal cual) y “prop” (ajustada a un ingreso de $15,000).
   Al aplicar, crea o reutiliza las categorías, las acomoda en grupos y pone los presupuestos. */
const PLAN_GROUPS = [['casa', 'Casa y servicios'], ['diario', 'Día a día'], ['metas', 'Gustos y metas'], ['deudas', 'Deudas y mensualidades']];
const PLAN_ITEMS = [
  // nombre, ícono, grupo, categoría existente que reutiliza, sus cifras, propuesta
  ['Renta', 'home', 'casa', 'vivienda', 5000, 5000],
  ['Luz', 'bolt', 'casa', null, 800, 800],
  ['Agua', 'repeat', 'casa', null, 300, 300],
  ['Gas', 'tools', 'casa', null, 250, 250],
  ['Internet', 'phone', 'casa', null, 250, 250],
  ['Garrafón', 'cup', 'casa', null, 50, 50],
  ['Imprevistos', 'shield', 'casa', null, 100, 250],
  ['Transporte', 'car', 'diario', 'transporte', 500, 500],
  ['Gasto diario', 'cart', 'diario', null, 1500, 1200],
  ['Salud', 'heart', 'diario', 'salud', 1000, 300],
  ['Pet', 'paw', 'diario', 'mascotas', 100, 100],
  ['Personal', 'sparkle', 'diario', 'cuidado', 1000, 200],
  ['Restaurantes y cumpleaños', 'gift', 'metas', null, 500, 0],
  ['Viajes', 'plane', 'metas', 'viajes', 1200, 0],
  ['Gym', 'users', 'deudas', null, 1292, 1292],
  ['Vexi', 'card', 'deudas', null, 1700, 1700],
  ['Vestidos', 'bag', 'deudas', null, 2500, 2500],
].map(([name, icon, group, reuse, mine, prop]) => ({ name, icon, group, reuse, mine, prop }));
const PLAN_SAVE = { mine: 2000, prop: 300 };
const PLAN_INCOME = 15000;
/* Regla para ingresos extra (freelance): 50% a ahorro, $300 a transporte, el resto es tuyo */
const FREELANCE = { name: 'Freelance / extras', icon: 'briefcase', split: { savePct: 50, transport: 300 } };

const planTotal = k => sum(PLAN_ITEMS, i => i[k]) + PLAN_SAVE[k];

function applyPlan(k) {
  const cats = S.data.categories;
  PLAN_ITEMS.forEach(it => {
    let c = cats.find(x => x.kind === 'gasto' && fold(x.name) === fold(it.name)) || (it.reuse && cats.find(x => x.id === it.reuse && x.kind === 'gasto'));
    if (!c) { c = { id: uid(), name: it.name, icon: it.icon, color: nextCatColor('gasto', it.group), kind: 'gasto', group: it.group }; cats.push(c); }
    else if (c.id === 'vivienda' && fold(c.name) === 'vivienda') c.name = it.name;   // “Vivienda” pasa a llamarse “Renta”
    c.group = it.group;
    if (it[k] > 0) S.data.budgets[c.id] = it[k]; else delete S.data.budgets[c.id];
  });
  let f = cats.find(x => x.kind === 'ingreso' && (x.split || fold(x.name) === fold(FREELANCE.name)));
  if (!f) { f = { id: uid(), name: FREELANCE.name, icon: FREELANCE.icon, color: nextCatColor('ingreso'), kind: 'ingreso' }; cats.push(f); }
  f.split = { ...FREELANCE.split };
  S.data.savingsGoal = PLAN_SAVE[k];
  saveData(); closeDrawer(); render();
  toast(k === 'mine' ? 'Listo: tus categorías y montos quedaron en Presupuesto' : 'Listo: la propuesta quedó en Presupuesto');
}

function openPlan() {
  const row = (it, k) => `<tr><td>${esc(it.name)}</td><td class="n">${it.mine ? money0(it.mine) : '—'}</td><td class="n${it.prop !== it.mine ? ' ch' : ''}">${it.prop ? money0(it.prop) : '—'}</td></tr>`;
  const groups = PLAN_GROUPS.map(([g, gl]) => {
    const its = PLAN_ITEMS.filter(i => i.group === g);
    return `<tr class="g"><td>${gl}</td><td class="n">${money0(sum(its, i => i.mine))}</td><td class="n">${money0(sum(its, i => i.prop))}</td></tr>${its.map(i => row(i)).join('')}`;
  }).join('');
  const diff = k => PLAN_INCOME - planTotal(k);
  const body = `
    <p class="plan-intro">Tus montos son un estimado, no una regla. Al aplicar se crean las categorías que falten, se acomodan en grupos y cada una queda con su presupuesto. Después puedes editar cualquiera desde Presupuesto.</p>
    <div class="plan-pick">
      <label class="plan-opt"><input type="radio" name="plan" value="mine"><b>Mis cifras</b><span class="num">${money0(planTotal('mine'))}</span><small class="neg">${money0(-diff('mine'))} más de lo que entra</small></label>
      <label class="plan-opt"><input type="radio" name="plan" value="prop" checked><b>Propuesta</b><span class="num">${money0(planTotal('prop'))}</span><small class="pos">Cabe en ${money0(PLAN_INCOME)}${diff('prop') ? ` · sobran ${money0(diff('prop'))}` : ''}</small></label>
    </div>
    <table class="plan-tbl"><thead><tr><th>Concepto</th><th class="n">Tuyo</th><th class="n">Propuesta</th></tr></thead><tbody>${groups}
      <tr class="g"><td>Ahorro (meta del mes)</td><td class="n">${money0(PLAN_SAVE.mine)}</td><td class="n ch">${money0(PLAN_SAVE.prop)}</td></tr></tbody>
      <tfoot><tr><td>Total</td><td class="n">${money0(planTotal('mine'))}</td><td class="n">${money0(planTotal('prop'))}</td></tr></tfoot></table>
    <div class="plan-note">${icon('briefcase')}<div><b>Ingresos extra (freelance)</b>Se crea la categoría de ingreso «${FREELANCE.name}». Cada vez que registres uno, la app te dice cuánto apartar: <b>50% a ahorro</b>, <b>${money0(FREELANCE.split.transport)} a transporte</b> y el resto es tuyo. Restaurantes y viajes salen de ahí mientras pagas las deudas.</div></div>`;
  openDrawer({ title: 'Cargar mi plan', eyebrow: 'Presupuesto', body, saveLabel: 'Aplicar', onSave: o => applyPlan(o.plan === 'mine' ? 'mine' : 'prop') });
}

/* Después de registrar un ingreso con regla de reparto, sugiere cuánto apartar */
function planSplit(t) {
  const c = byId(S.data.categories, t.categoryId); if (!c || !c.split) return;
  const save = Math.round(t.amount * c.split.savePct / 100);
  const trans = Math.min(c.split.transport || 0, Math.max(0, t.amount - save));
  const mine = Math.max(0, t.amount - save - trans);
  setTimeout(() => confirmBox(`Aparta ${money0(save)} para tu ahorro`,
    `De ${money0(t.amount)}: ${c.split.savePct}% a ahorro (${money0(save)}), ${money0(trans)} a transporte y ${money0(mine)} son para ti. ¿Registro el ahorro ahora?`,
    () => { S.data.transactions.push({ id: uid(), type: 'ahorro', amount: save, date: t.date, desc: `Ahorro de ${t.desc}`, accountId: t.accountId, categoryId: null, targetId: null, fixed: false, notes: '', fromFreelance: true, fromTx: t.id }); saveData(); render(); toast(`Ahorro de ${money0(save)} registrado`); },
    'Sí, registrar'), 350);
}

/* ---------- Pestaña Freelance: cuánto entró, por qué, cómo se dividió y cómo se ha usado ---------- */
const flCats = () => S.data.categories.filter(c => c.kind === 'ingreso' && c.split);
const flSplit = t => { const sp = (byId(S.data.categories, t.categoryId) || {}).split || FREELANCE.split; const save = Math.round(t.amount * sp.savePct / 100); const trans = Math.min(sp.transport || 0, Math.max(0, t.amount - save)); return { save, trans, mine: Math.max(0, t.amount - save - trans), pct: sp.savePct }; };
const isTransCat = id => { const c = byId(S.data.categories, id); return id === 'transporte' || (c && fold(c.name).includes('transporte')); };
function freelanceData(ym) {
  const ids = new Set(flCats().map(c => c.id));
  const T = S.data.transactions.filter(t => inMonth(t, ym));
  const incomes = T.filter(t => t.type === 'ingreso' && !isCardTx(t) && ids.has(t.categoryId)).sort((a, b) => b.date.localeCompare(a.date)).map(t => ({ t, ...flSplit(t) }));
  const savings = T.filter(t => t.type === 'ahorro' && (t.fromFreelance || t.fromTx || /^Ahorro de /.test(t.desc || '')));
  incomes.forEach(i => { i.saved = sum(savings.filter(s => s.fromTx === i.t.id || (!s.fromTx && s.desc === `Ahorro de ${i.t.desc}`))); });
  const spent = T.filter(t => t.type === 'gasto' && t.fromFreelance).sort((a, b) => b.date.localeCompare(a.date));
  const tot = { in: sum(incomes, i => i.t.amount), save: sum(incomes, i => i.save), trans: sum(incomes, i => i.trans), mine: sum(incomes, i => i.mine) };
  const used = { save: sum(savings), trans: sum(spent.filter(t => isTransCat(t.categoryId))), mine: sum(spent.filter(t => !isTransCat(t.categoryId))) };
  return { incomes, savings, spent, tot, used };
}
function freelanceHTML() {
  const ym = S.month; const fc = flCats();
  if (!fc.length) return `<div class="card"><div class="empty"><h3>Aún no tienes la categoría de freelance</h3><p>Se crea al cargar tu plan: «${FREELANCE.name}», con la regla de 50% a ahorro, ${money0(FREELANCE.split.transport)} a transporte y el resto para ti.</p><button class="btn primary" data-act="plan">${icon('sparkle')}<span>Cargar mi plan</span></button></div></div>`;
  const D = freelanceData(ym); const { tot, used } = D; const sp = fc[0].split;
  const addBtn = `<button class="btn primary" data-fl-add>${icon('plus')}<span>Registrar ingreso freelance</span></button>`;
  if (!D.incomes.length) return `<section class="fl"><div class="card fl-hero empty-hero"><div class="fl-hero-ic">${icon('briefcase')}</div><div><h2>Sin ingresos freelance en ${monthLabel(ym)}</h2><p>Cuando registres uno con la categoría «${esc(fc[0].name)}», aquí verás cuánto entró, por qué fue y cómo se repartió: ${sp.savePct}% a ahorro, ${money0(sp.transport)} a transporte y el resto para ti.</p>${addBtn}</div></div></section>`;
  const parts = [
    ['save', 'Ahorro', `${sp.savePct}% de cada ingreso`, 'piggy', '#2D8F73', tot.save, used.save, 'apartado', 'Falta apartar', 'Apartado de más'],
    ['trans', 'Transporte', `${money0(sp.transport)} por ingreso`, 'car', '#3884B0', tot.trans, used.trans, 'gastado', 'Te quedan', 'Te pasaste por'],
    ['mine', 'Para ti', 'Lo que sobra', 'sparkle', '#9B669A', tot.mine, used.mine, 'gastado', 'Te quedan', 'Te pasaste por'],
  ];
  const pending = Math.max(0, tot.save - used.save);
  return `<section class="fl">
    <div class="card fl-hero">
      <div class="fl-hero-top"><div class="fl-hero-ic">${icon('briefcase')}</div><div><div class="eyebrow">Freelance · ${monthLabel(ym)}</div><div class="fl-big num">${money0(tot.in)}</div><p>${D.incomes.length} ingreso${D.incomes.length === 1 ? '' : 's'} extra este mes</p></div>${addBtn}</div>
      <div class="fl-stack" aria-label="Cómo se dividió">${parts.map(p => p[5] ? `<i style="flex:${p[5]};background:${col(p[4])}" title="${p[1]} ${money0(p[5])}"></i>` : '').join('')}</div>
      <div class="fl-legend">${parts.map(p => `<span><i style="background:${col(p[4])}"></i>${p[1]} <b>${money0(p[5])}</b> <em>${tot.in ? pct(p[5] / tot.in * 100) : '0%'}</em></span>`).join('')}</div>
    </div>
    ${freelanceChartsHTML(D)}
    <h3 class="qz-h3">${icon('pie')}Cómo se dividió y cómo lo has usado</h3>
    <div class="fl-parts">${parts.map(([k, t, sub, ic, c, asg, u, verb, leftL, overL]) => { const left = asg - u, over = left < 0; const p = asg ? Math.min(100, u / asg * 100) : 0;
      return `<div class="fl-part${over && k !== 'save' ? ' over' : ''}" style="--fc:${col(c)}"><div class="fl-part-h"><span class="fl-part-ic">${icon(ic)}</span><div><b>${t}</b><small>${sub}</small></div></div>
        <div class="fl-part-big num">${money0(asg)}</div><div class="fl-part-cap">asignado</div>
        <div class="qz-meter"><i style="width:${p}%"></i></div>
        <div class="fl-part-row"><span>${verb[0].toUpperCase() + verb.slice(1)} <b>${money0(u)}</b></span>${left === 0 && asg > 0 ? `<span class="ok">${k === 'save' ? 'Completo' : 'Usado completo'} ✓</span>` : `<span class="${over ? (k === 'save' ? 'ok' : 'no') : (k === 'save' && left > 0 ? 'no' : 'ok')}">${over ? overL : leftL} <b>${money0(Math.abs(left))}</b></span>`}</div>
        ${k === 'save' && pending > 0 ? `<button class="btn sm fl-save" data-fl-save>${icon('piggy')}Registrar ${money0(pending)} de ahorro</button>` : ''}</div>`; }).join('')}</div>
    <h3 class="qz-h3">${icon('list')}Por qué entró</h3>
    <div class="card fl-list">${D.incomes.map(i => { const acc = byId(S.data.accounts, i.t.accountId); const ok = i.saved >= i.save;
      return `<div class="fl-in" data-tx="${i.t.id}"><div class="fl-in-d"><b>${dateLabel(i.t.date)}</b></div><div class="fl-in-m"><b>${esc(i.t.desc || 'Ingreso freelance')}</b><small>${acc ? esc(acc.name) : ''}${i.t.notes ? ` · ${esc(i.t.notes)}` : ''}</small>
        <div class="fl-chips"><span class="c-save">${icon('piggy')}${money0(i.save)}</span><span class="c-trans">${icon('car')}${money0(i.trans)}</span><span class="c-mine">${icon('sparkle')}${money0(i.mine)}</span><span class="st ${ok ? 'ok' : 'no'}">${ok ? `${icon('check')}Ahorro apartado` : `${icon('alert')}Ahorro pendiente`}</span></div></div>
        <div class="fl-in-v num">${money0(i.t.amount)}</div></div>`; }).join('')}</div>
    <h3 class="qz-h3">${icon('cart')}En qué lo usaste</h3>
    <div class="card fl-list">${D.spent.length ? D.spent.map(t => { const c = cat(t.categoryId); return `<div class="fl-in use" data-tx="${t.id}" style="--cat:${col(c.color)}"><div class="fl-in-d"><b>${dateLabel(t.date)}</b></div><div class="fl-in-m"><b>${esc(t.desc)}</b><small><i class="dot"></i>${esc(c.name)} · ${isTransCat(t.categoryId) ? 'de transporte' : 'de tu parte'}</small></div><div class="fl-in-v num neg">−${money0(t.amount)}</div></div>`; }).join('')
      : `<div class="fl-none">${icon('cart')}<div><b>Todavía no marcas gastos con dinero de freelance</b><span>Al registrar un gasto, activa «Lo pagué con dinero de freelance» y aparecerá aquí, descontado de transporte o de tu parte.</span></div></div>`}</div>
  </section>`;
}
function bindFreelance(root) {
  const box = root.querySelector('.fl'); if (!box) return;
  const fc = flCats()[0];
  box.querySelectorAll('[data-fl-add]').forEach(b => b.addEventListener('click', () => formTx(null, { type: 'ingreso', categoryId: fc && fc.id })));
  box.querySelectorAll('[data-tx]').forEach(r => r.addEventListener('click', () => { const t = byId(S.data.transactions, r.dataset.tx); if (t) formTx(t); }));
  const sv = box.querySelector('[data-fl-save]');
  if (sv) sv.addEventListener('click', () => {
    const D = freelanceData(S.month); const pend = D.incomes.filter(i => i.saved < i.save);
    const total = sum(pend, i => i.save - i.saved);
    confirmBox(`¿Registrar ${money0(total)} de ahorro?`, `Se registra un movimiento de ahorro por cada ingreso freelance que aún no tiene su ${pend[0] ? pend[0].pct : 50}% apartado.`, () => {
      pend.forEach(i => S.data.transactions.push({ id: uid(), type: 'ahorro', amount: i.save - i.saved, date: i.t.date, desc: `Ahorro de ${i.t.desc}`, accountId: i.t.accountId, categoryId: null, targetId: null, fixed: false, notes: '', fromFreelance: true, fromTx: i.t.id }));
      saveData(); const y = scrollY; render(); window.scrollTo(0, y); toast('Ahorro registrado');
    }, 'Sí, registrar');
  });
}

/* ---------- Disponible para ti, por quincena: sueldo de la quincena − su parte del plan − lo de fuera del plan + freelance libre ---------- */
function disponibleParaTi(ym) {
  const flIds = new Set(flCats().map(c => c.id)); const B = S.data.budgets || {};
  const T = S.data.transactions.filter(t => inMonth(t, ym));
  const inQ = (t, k) => (+t.date.slice(8, 10) <= 15) === (k === 'a');
  const q = S.data.quincenas; const hasPlan = (q && q.income && q.income.length === 2) || Object.keys(B).length > 0;
  const planIn = hasPlan ? qIncome() : [0, 0];
  const rows = qRows(budgetStatus(ym));
  const goal = S.data.savingsGoal || 0;
  const gNF = T.filter(t => t.type === 'gasto' && !t.fromFreelance);
  const savNF = T.filter(t => t.type === 'ahorro' && !t.fromFreelance && !t.fromTx && !/^Ahorro de /.test(t.desc || ''));
  // fuera de plan del mes completo (incluye mensualidades a meses)
  const byCat = { ...monthSummary(ym).byCat };
  T.filter(t => t.type === 'gasto' && t.fromFreelance).forEach(t => { const k = t.categoryId || 'otros'; byCat[k] = (byCat[k] || 0) - t.amount; });
  let extraM = 0;
  Object.entries(B).forEach(([id, b]) => { if (b > 0) extraM += Math.max(0, (byCat[id] || 0) - b); });
  Object.entries(byCat).forEach(([id, v]) => { if (!(B[id] > 0) && v > 0) extraM += v; });
  extraM += Math.max(0, sum(savNF) - goal);
  // fuera de plan de la 1ª quincena: lo que rebasó su parte de la 1ª; la 2ª se lleva el resto del mes
  let extraA = 0;
  rows.forEach(r => { const sp = r.id === QK_SAVE ? sum(savNF.filter(t => inQ(t, 'a'))) : sum(gNF.filter(t => t.categoryId === r.id && inQ(t, 'a'))); extraA += Math.max(0, sp - r.a); });
  extraA += sum(gNF.filter(t => inQ(t, 'a') && !(B[t.categoryId || 'otros'] > 0)));
  const F = freelanceData(ym);
  const mk = (k, i) => {
    const real = sum(T.filter(t => t.type === 'ingreso' && !isCardTx(t) && !flIds.has(t.categoryId) && inQ(t, k)));
    const income = real || planIn[i]; const plan = sum(rows, r => r[k]);
    const extra = k === 'a' ? extraA : extraM - extraA;
    return { k, real: !!real, income, plan, extra, sobrante: income - plan - extra, total: income - plan - extra };
  };
  const Q = [mk('a', 0), mk('b', 1)];
  const cur = ym === thisMonth() ? (+todayISO().slice(8, 10) <= 15 ? 'a' : 'b') : ym < thisMonth() ? 'b' : 'a';
  const flM = F.tot.mine - F.used.mine; const now = Q[cur === 'a' ? 0 : 1];
  return { Q, cur, now, nowTotal: now.total + flM, month: Q[0].total + Q[1].total + flM, sueldoM: Q[0].total + Q[1].total, flM, flTot: F.tot.mine, flUsed: F.used.mine, hasFl: flCats().length > 0, any: Q.some(x => x.income) || F.tot.mine > 0 };
}
function disponibleHTML(ym) {
  const D = disponibleParaTi(ym); if (!D.any) return '';
  const last = daysIn(ym), mes = MESES_C[+ym.slice(5) - 1];
  const qn = k => k === 'a' ? '1ª quincena' : '2ª quincena', rng = k => k === 'a' ? `1–15 ${mes}` : `16–${last} ${mes}`;
  const m2 = v => `${v < 0 ? '−' : ''}${money2(Math.abs(v))}`;
  const N = D.now, neg = D.nowTotal < 0;
  return `<section class="card mine${neg ? ' over' : ''}" aria-label="Disponible para ti por quincena">
    <div class="mine-l">
      <div class="eyebrow">${icon('sparkle')}${neg ? 'Te faltan para ti' : 'Disponible para ti'} · ${qn(N.k)}</div>
      <div class="mine-big num">${m2(D.nowTotal)}</div>
      <p>${neg ? `En la ${qn(N.k)} lo planeado y gastado supera lo que entra. Revisa el reparto en Presupuesto › Por quincena.` : `Lo que te sobra de esta quincena (${rng(N.k)}) después de tus gastos y ahorro, más lo que te queda de freelance. Es tuyo para gastar sin culpa.`}</p>
      <div class="mine-note">${icon('cal')}<span>En todo el mes: <b class="num${D.month < 0 ? ' neg' : ''}">${m2(D.month)}</b> · sueldo ${m2(D.sueldoM)}${D.hasFl ? ` + freelance ${m2(D.flM)}` : ''}</span></div>
    </div>
    <div class="mine-r">
      ${D.Q.map(x => `<div class="mine-row${x.k === D.cur ? ' on' : ''}"><span class="dot ${x.k}"></span><div class="mine-t"><b>${qn(x.k)}${x.k === D.cur ? ' <em>ahora</em>' : ''}</b><small>${x.real ? 'Entró' : 'Planeado'} ${money2(x.income)} − plan ${money2(x.plan)}${x.extra > 0 ? ` − ${x.k === 'a' ? 'de más o adelantado' : 'fuera de plan'} ${money2(x.extra)}` : x.extra < 0 ? ` + ya pagado en la 1ª ${money2(-x.extra)}` : ''}</small></div><b class="num${x.total < 0 ? ' neg' : ''}">${m2(x.total)}</b></div>`).join('')}
      <div class="mine-row fl"><span class="dot f"></span><div class="mine-t"><b>Freelance para ti</b><small>${D.hasFl ? (D.flTot ? `De ${money2(D.flTot)} · ya usaste ${money2(D.flUsed)}` : 'Sin ingresos freelance este mes') : 'Carga tu plan para separar el freelance'}</small></div><b class="num${D.flM < 0 ? ' neg' : ''}">${m2(D.flM)}</b></div>
      <button class="lnk" data-go="presupuesto">Ver presupuesto</button>
    </div>
  </section>`;
}

/* ---------- Con tarjeta: servicios cargados a una tarjeta con dinero que ya pagaste ---------- */
const csList = () => S.data.cardServices || (S.data.cardServices = []);
const csPaid = (ym = S.month) => { const P = S.data.cardServicesPaid || (S.data.cardServicesPaid = {}); return P[ym] || (P[ym] = {}); };
function cardSvcHTML() {
  const ym = S.month; const L = csList(); const P = csPaid(ym); const pays = qPayOpts();
  const addBtn = `<button class="btn primary" data-cs-add>${icon('plus')}<span>Agregar servicio</span></button>`;
  const intro = `<div class="cs-bar">${addBtn}<span class="cs-hint" title="Marcarlos como pagados no crea movimientos: no cambia lo que te queda, ni el presupuesto, ni la deuda de la tarjeta.">${icon('check')}Cubiertos: no afectan tus finanzas</span></div>`;
  if (!L.length) return `<section class="cs"><div class="card"><div class="empty"><h3>Servicios pagados con tarjeta</h3><p>Lo que cargas a una tarjeta con dinero que ya pagaste (como los servicios de tu Vexi). Marcarlos como pagados no mueve tus finanzas.</p>${addBtn}</div></div></section>`;
  const total = sum(L, s => s.amount), paid = L.filter(s => P[s.id]), affect = L.filter(s => s.covered === false);
  const groups = [...new Set(L.map(s => s.cardId || ''))].map(id => ({ id, opt: pays.find(p => p.id === id), items: L.filter(s => (s.cardId || '') === id).sort((a, b) => (a.day || 99) - (b.day || 99)) }));
  return `<section class="cs">${intro}
    <div class="cs-tiles">
      <div class="cs-tile"><span>Total al mes</span><b class="num">${money2(total)}</b><small>${L.length} servicio${L.length === 1 ? '' : 's'}</small></div>
      <div class="cs-tile ok"><span>Pagados en ${MESES[+ym.slice(5) - 1]}</span><b class="num">${paid.length} de ${L.length}</b><small>${money2(sum(paid, s => s.amount))}</small></div>
      <div class="cs-tile"><span>Afectan tus finanzas</span><b class="num">${money2(sum(affect, s => s.amount))}</b><small>${affect.length ? `${affect.length} se registra${affect.length === 1 ? '' : 'n'} como gasto` : 'Ninguno · todo cubierto'}</small></div>
    </div>
    ${cardSvcChartHTML()}
    ${groups.map(g => { const c = g.opt ? g.opt.color : col('#8D8481'); const gp = g.items.filter(s => P[s.id]).length;
      return `<div class="card cs-g" style="--cc:${c}"><div class="cs-gh"><span class="cs-chip">${icon('card')}</span><div><b>${g.opt ? esc(g.opt.name) : 'Sin tarjeta'}</b><small>${g.opt ? g.opt.kind + ' · ' : ''}${gp} de ${g.items.length} pagado${g.items.length === 1 ? '' : 's'}</small></div><b class="num">${money2(sum(g.items, s => s.amount))}<small>/mes</small></b></div>
        ${g.items.map(s => { const on = !!P[s.id]; return `<div class="cs-row${on ? ' done' : ''}">
          <label class="cs-chk" title="Marcar ${esc(s.name)} como pagado en ${monthLabel(ym)}"><input type="checkbox" data-cs-paid="${s.id}"${on ? ' checked' : ''}><i>${icon('check')}</i></label>
          <div class="cs-m"><b>${esc(s.name)}</b><small>${s.day ? `<span>Día ${s.day}</span>` : ''}${s.covered === false ? '<span class="cs-badge aff">Se registra como gasto</span>' : '<span class="cs-badge">Cubierto · no afecta</span>'}</small></div>
          <b class="num cs-v">${money2(s.amount)}</b>
          <button class="ib" data-cs-edit="${s.id}" title="Editar" aria-label="Editar ${esc(s.name)}">${icon('edit')}</button></div>`; }).join('')}</div>`; }).join('')}
  </section>`;
}
function formCardSvc(s) {
  const v = { covered: true, amount: '', day: '', name: '', cardId: (S.data.cards[0] || {}).id || '', ...(s || {}) };
  const opts = qPayOpts().map(p => [p.id, `${p.name} · ${p.kind}`]);
  const body = `${F.text('name', 'Servicio', v.name, 'Ej. Spotify, iCloud, Plan de celular', 'required maxlength="40"')}<div class="fr">${F.num('amount', 'Monto al mes', v.amount, '199', 'required min="0"')}${F.num('day', 'Día de cargo', v.day, '5', 'min="1" max="31"')}</div>
    ${F.sel('cardId', 'Tarjeta o cuenta', opts.length ? opts : [['', 'Agrega una tarjeta en Ajustes']], v.cardId)}
    <label class="toggle"><input type="checkbox" name="covered"${v.covered !== false ? ' checked' : ''}><span>Ya está pagado con dinero que aparté · no afecta mis finanzas</span></label>
    <div class="hint">Si lo desactivas, al marcarlo como pagado te pregunto si lo registro como gasto con esa tarjeta.</div>`;
  openDrawer({ title: s ? 'Editar servicio' : 'Nuevo servicio con tarjeta', eyebrow: 'Presupuesto · Con tarjeta', body, saveLabel: 'Guardar',
    onSave: (o, f) => {
      if (!need(f, (o.name || '').trim(), 'Escribe el nombre del servicio')) return;
      if (!need(f, o.amount > 0, 'Escribe un monto')) return;
      const day = Math.min(31, Math.max(0, Math.round(+o.day || 0)));
      const it = { id: s ? s.id : uid(), name: o.name.trim(), amount: +o.amount, cardId: o.cardId || '', day: day || null, covered: !!o.covered };
      const L = csList(); const i = L.findIndex(x => x.id === it.id); if (i >= 0) L[i] = it; else L.push(it);
      saveData(); closeDrawer(); render(); toast(s ? 'Servicio actualizado' : 'Servicio agregado');
    },
    onDelete: s ? () => { S.data.cardServices = csList().filter(x => x.id !== s.id); Object.values(S.data.cardServicesPaid || {}).forEach(m => delete m[s.id]); saveData(); closeDrawer(); render(); toast('Servicio eliminado'); } : null, deleteLabel: 'Eliminar servicio' });
}
function csTx(s, ym) {
  const card = byId(S.data.cards, s.cardId), acc = byId(S.data.accounts, s.cardId); if (!card && !acc) return null;
  const today = todayISO(); const date = today.slice(0, 7) === ym ? today : clampDay(ym, s.day || 1);
  const catId = byId(S.data.categories, 'suscripciones') ? 'suscripciones' : null;
  return { id: uid(), type: 'gasto', amount: s.amount, date, desc: s.name, categoryId: catId, accountId: (card || acc).id, method: card ? 'credito' : (acc.type === 'efectivo' ? 'efectivo' : 'debito'), fixed: true, targetId: null, notes: 'Servicio con tarjeta' };
}
function bindCardSvc(root) {
  const box = root.querySelector('.cs'); if (!box) return;
  const refresh = () => { const y = scrollY; render(); window.scrollTo(0, y); };
  box.querySelectorAll('[data-cs-add]').forEach(b => b.addEventListener('click', () => formCardSvc(null)));
  box.querySelectorAll('[data-cs-edit]').forEach(b => b.addEventListener('click', () => formCardSvc(byId(csList(), b.dataset.csEdit))));
  box.querySelectorAll('[data-cs-paid]').forEach(ck => ck.addEventListener('change', () => {
    const ym = S.month; const P = csPaid(ym); const s = byId(csList(), ck.dataset.csPaid); if (!s) return;
    if (ck.checked) {
      if (s.covered !== false) { P[s.id] = true; saveData(); refresh(); toast(`${s.name}: pagado · no afecta tus finanzas`); return; }
      const tx = csTx(s, ym); ck.checked = false;
      const btns = []; if (tx) btns.push({ label: `${icon('plus')}Sí, registrar gasto de ${money2(s.amount)}`, cls: 'primary', fn: () => { S.data.transactions.push(tx); P[s.id] = tx.id; saveData(); refresh(); toast(`${s.name}: pagado y registrado`); } });
      btns.push({ label: `${icon('check')}Solo marcar como pagado`, cls: tx ? 'quiet' : 'primary', fn: () => { P[s.id] = true; saveData(); refresh(); } });
      choiceBox(`¿Marcar ${s.name} como pagado?`, `Este servicio <b>sí afecta tus finanzas</b>. ¿Lo registro como gasto con la tarjeta?`, btns);
    } else {
      const t = typeof P[s.id] === 'string' ? byId(S.data.transactions, P[s.id]) : null;
      if (!t) { delete P[s.id]; saveData(); refresh(); return; }
      ck.checked = true;
      choiceBox(`¿Desmarcar ${s.name}?`, `Al marcarlo se registró un gasto de <b>${money2(t.amount)}</b>.`, [
        { label: `${icon('trash')}Desmarcar y borrar el gasto`, cls: 'danger', fn: () => { S.data.transactions = S.data.transactions.filter(x => x.id !== t.id); delete P[s.id]; saveData(); refresh(); } },
        { label: 'Solo desmarcar (conservar el gasto)', cls: 'quiet', fn: () => { delete P[s.id]; saveData(); refresh(); } },
      ]);
    }
  }));
}

/* ---------- Más gráficas para Presupuesto ---------- */
const GROUP_COLORS = { casa: '#3884B0', diario: '#2D8F73', metas: '#9B669A', deudas: '#B8505F', '': '#8D8481' };
const miniLegend = items => `<div class="legend sm">${items.map(i => `<div class="l" style="--cat:${i.color}"><i></i><span>${esc(i.label)}</span><b class="num">${money0(i.value)}</b><em>${i.pct}</em></div>`).join('')}</div>`;
function chartCard(title, sub, body, cls = '') { return `<div class="card chartc ${cls}"><div class="ch"><h2>${title}</h2>${sub ? `<span class="ch-sub">${sub}</span>` : ''}</div>${body}</div>`; }
function ringItems(ym, tot, sp, dayPct) {
  const s = monthSummary(ym); const goal = S.data.savingsGoal || 0;
  const it = [{ label: 'Gastado del presupuesto', v: tot ? sp / tot : 0, color: col('#B8505F'), text: `${money0(sp)} de ${money0(tot)}` },
    { label: 'Avance del mes', v: dayPct, color: col('#3884B0'), text: ym === thisMonth() ? `día ${Number(todayISO().slice(8))} de ${daysIn(ym)}` : (dayPct >= 1 ? 'mes cerrado' : 'aún no empieza') }];
  if (goal) it.push({ label: 'Ahorro del mes', v: s.ahorro / goal, color: col('#2D8F73'), over: col('#1C6B54'), text: `${money0(s.ahorro)} de ${money0(goal)}` });
  return it;
}
function budgetChartsHTML(bs) {
  if (!bs.length) return '';
  const ym = S.month; const tot = sum(bs, b => b.budget), sp = sum(bs, b => b.spent);
  const G = [...PLAN_GROUPS, ['', 'Otros']].map(([g, l]) => { const its = bs.filter(b => (b.cat.group || '') === g || (g === '' && !PLAN_GROUPS.some(x => x[0] === b.cat.group))); return { label: l, value: sum(its, b => b.budget), color: col(GROUP_COLORS[g]), key: g || 'otros' }; }).filter(x => x.value > 0);
  G.forEach(x => { x.pct = pct(x.value / tot * 100); });
  const cur = ym === thisMonth(); const dayPct = cur ? Number(todayISO().slice(8)) / daysIn(ym) : isPast(ym) ? 1 : 0;
  const top = [...bs].sort((a, b) => b.budget - a.budget).slice(0, 8).map(b => ({ label: b.cat.name, value: b.spent, max: b.budget, color: col(b.cat.color) }));
  return `<section class="bud-charts">
    ${chartCard('¿Cómo se reparte?', `${money0(tot)} al mes`, `<div class="donutwrap sm">${donutSVG(G, 'presupuesto', money0(tot))}${miniLegend(G)}</div>`)}
    ${chartCard('¿Cuánto llevo?', cur ? `Va el ${pct(dayPct * 100)} del mes` : '', `${ringsSVG(ringItems(ym, tot, sp, dayPct), pct(tot ? sp / tot * 100 : 0), 'gastado')}<p class="g-note">${!tot ? '' : sp > tot ? `Te pasaste por <b>${money0(sp - tot)}</b>.` : cur && sp / tot > dayPct + .08 ? 'Vas gastando más rápido de lo que avanza el mes.' : `Te quedan <b>${money0(tot - sp)}</b> del presupuesto.`}</p>`)}
    ${chartCard('Presupuesto vs. gastado', 'tus conceptos más grandes', hbarsHTML(top), 'wide')}
  </section>`;
}
function quincenaChartHTML(bs) {
  const rows = qRows(bs); if (!rows.length) return '';
  const [i1, i2] = qIncome();
  const fx = k => sum(rows.filter(r => r.fixed), r => r[k]), fl = k => sum(rows.filter(r => !r.fixed), r => r[k]);
  const v = [['a', i1], ['b', i2]].map(([k, inc]) => ({ f: fx(k), a: fl(k), l: Math.max(0, inc - fx(k) - fl(k)) }));
  const chart = barsSVG(['1ª quincena', '2ª quincena'], [
    { name: 'Fijos', color: col('#B8505F'), values: v.map(x => x.f) },
    { name: 'Ajustables', color: col('#3884B0'), values: v.map(x => x.a) },
    { name: 'Te queda libre', color: col('#2D8F73'), values: v.map(x => x.l) }], { stacked: true, h: 200 });
  const pays = qPayOpts(); const byPay = pays.map(p => ({ label: p.name, value: sum(rows.filter(r => r.pay === p.id), r => r.total), color: p.color, key: p.id })).filter(x => x.value > 0);
  const tot = sum(byPay, x => x.value); byPay.forEach(x => { x.pct = pct(x.value / tot * 100); });
  return `<section class="bud-charts two">
    ${chartCard('Las dos quincenas', 'fijos, ajustables y lo libre', chart)}
    ${byPay.length ? chartCard('¿Con qué pagas?', 'por tarjeta o cuenta', `<div class="donutwrap sm">${donutSVG(byPay, 'al mes', money0(tot))}${miniLegend(byPay)}</div>`) : chartCard('¿Con qué pagas?', '', '<p class="g-note">Asigna una tarjeta o cuenta a cada concepto y aquí verás cuánto lleva cada una.</p>')}
  </section>`;
}
function freelanceChartsHTML(D) {
  const sp = flCats()[0].split; const { tot, used } = D; if (!tot.in) return '';
  const parts = [['Ahorro', '#2D8F73', tot.save, used.save], ['Transporte', '#3884B0', tot.trans, used.trans], ['Para ti', '#9B669A', tot.mine, used.mine]];
  const it = parts.map(([l, c, v]) => ({ label: l, value: v, color: col(c), pct: pct(v / tot.in * 100) }));
  return `<section class="bud-charts two">
    ${chartCard('Cómo se dividió', `regla ${sp.savePct}% / ${money0(sp.transport)} / resto`, `<div class="donutwrap sm">${donutSVG(it, 'freelance', money0(tot.in))}${miniLegend(it)}</div>`)}
    ${chartCard('Asignado vs. usado', '', barsSVG(parts.map(p => p[0]), [{ name: 'Asignado', color: col('#C9B8C8'), values: parts.map(p => p[2]) }, { name: 'Usado', color: col('#9B669A'), values: parts.map(p => p[3]) }], { h: 200 }))}
  </section>`;
}
function cardSvcChartHTML() {
  const L = csList(); if (!L.length) return '';
  const pays = qPayOpts(); const tot = sum(L, s => s.amount);
  const it = [...new Set(L.map(s => s.cardId || ''))].map(id => { const p = pays.find(x => x.id === id); const v = sum(L.filter(s => (s.cardId || '') === id), s => s.amount); return { label: p ? p.name : 'Sin tarjeta', value: v, color: p ? p.color : col('#8D8481'), key: id || 'none', pct: pct(v / tot * 100) }; });
  const paid = sum(L.filter(s => csPaid()[s.id]), s => s.amount);
  return `<section class="bud-charts two">
    ${chartCard('Por tarjeta', '', `<div class="donutwrap sm">${donutSVG(it, 'al mes', money0(tot))}${miniLegend(it)}</div>`)}
    ${chartCard('Pagado este mes', '', ringsSVG([{ label: 'Pagados', v: tot ? paid / tot : 0, color: col('#2D8F73'), text: `${money0(paid)} de ${money0(tot)}` }, { label: 'Servicios', v: L.length ? L.filter(s => csPaid()[s.id]).length / L.length : 0, color: col('#3884B0'), text: `${L.filter(s => csPaid()[s.id]).length} de ${L.length}` }], pct(tot ? paid / tot * 100 : 0), 'pagado'))}
  </section>`;
}

/* ---------- Al registrar: cuánto queda del presupuesto (en vivo y al guardar) ---------- */
function withoutTx(t, fn) { if (!t) return fn(); const all = S.data.transactions; S.data.transactions = all.filter(x => x !== t); try { return fn(); } finally { S.data.transactions = all; } }
function txImpact(o, t) {
  return withoutTx(t, () => {
    const amt = Math.max(0, +o.amount || 0); const ym = (o.date || todayISO()).slice(0, 7); const k = +(o.date || todayISO()).slice(8, 10) <= 15 ? 'a' : 'b';
    const qn = k === 'a' ? '1ª quincena' : '2ª quincena'; const card = byId(S.data.cards, o.accountId);
    const R = { blocks: [] };
    if (o.type === 'gasto') {
      const c = byId(S.data.categories, o.categoryId); const B = S.data.budgets[o.categoryId] || 0;
      if (o.fromFreelance && flCats().length) {
        const F = freelanceData(ym); const trans = isTransCat(o.categoryId);
        const tot = trans ? F.tot.trans : F.tot.mine, used = trans ? F.used.trans : F.used.mine; const left = tot - used - amt;
        R.blocks.push({ ic: 'briefcase', title: `Freelance · ${trans ? 'transporte' : 'para ti'}`, total: tot, spent: used, amt, left, msg: left >= 0 ? `Con este gasto te quedan <b>${money2(left)}</b> de tu freelance ${trans ? 'para transporte' : 'para ti'}.` : `Te pasarías por <b>${money2(-left)}</b> de lo que tienes de freelance.` });
      }
      if (c && B > 0) {
        const spent = monthSummary(ym).byCat[o.categoryId] || 0; const left = B - spent - amt;
        const row = qRows(budgetStatus(ym)).find(r => r.id === o.categoryId);
        R.blocks.push({ ic: 'target', color: col(c.color), title: `${c.name} · presupuesto ${money0(B)}`, total: B, spent, amt, left,
          msg: left >= 0 ? `Con este gasto te quedan <b>${money2(left)}</b> de ${esc(c.name)} este mes.` : `Con este gasto te pasas por <b>${money2(-left)}</b> de ${esc(c.name)}.`,
          sub: row ? `En la ${qn} le tocan ${money0(row[k])}.` : '' });
        R.toast = left >= 0 ? `Te quedan ${money2(left)} de ${c.name}` : `Te pasaste ${money2(-left)} en ${c.name}`;
      } else if (c && !o.fromFreelance) {
        R.blocks.push({ ic: 'alert', title: `${c.name} no tiene presupuesto`, msg: 'Contará como gasto fuera de plan y baja lo que tienes disponible.', add: o.categoryId });
      }
      if (card) {
        const bal = cardBalance(card, ym); const lim = card.limit || 0;
        if (lim) R.blocks.push({ ic: 'card', title: `${card.name} · línea ${money0(lim)}`, total: lim, spent: bal, spentL: 'Debes', amt, left: lim - bal - amt, msg: `Debes <b>${money2(bal + amt)}</b> con este gasto; te quedan <b>${money2(Math.max(0, lim - bal - amt))}</b> de línea.` });
      }
    } else if (o.type === 'ingreso') {
      if (card) {
        const bal = cardBalance(card, ym); R.blocks.push({ ic: 'card', title: `Reembolso a ${card.name}`, msg: `Lo que debes baja de <b>${money2(bal)}</b> a <b>${money2(Math.max(0, bal - amt))}</b>. No cuenta como dinero disponible.` });
      } else if (flCats().some(c => c.id === o.categoryId)) {
        const sp = flSplit({ amount: amt, categoryId: o.categoryId });
        R.blocks.push({ ic: 'briefcase', title: 'Ingreso freelance', msg: `Se reparte en <b>${money2(sp.save)}</b> a ahorro, <b>${money2(sp.trans)}</b> a transporte y <b>${money2(sp.mine)}</b> para ti.` });
        R.toast = `Para ti: ${money2(sp.mine)}`;
      } else if (Object.keys(S.data.budgets).length) {
        const D = disponibleParaTi(ym); const Q = D.Q[k === 'a' ? 0 : 1]; const inc = (Q.real ? Q.income : 0) + amt; const after = Q.total - Q.income + inc;
        R.blocks.push({ ic: 'sparkle', title: `Disponible para ti · ${qn}`, msg: Q.real ? `Pasa de <b>${money2(Q.total)}</b> a <b>${money2(after)}</b>.` : `Con este ingreso (en lugar de los ${money0(Q.income)} planeados) quedan <b>${money2(after)}</b> para ti en la ${qn}.` });
        R.toast = `Disponible ${qn}: ${money2(after)}`;
      }
    } else if (o.type === 'ahorro' && S.data.savingsGoal) {
      const goal = S.data.savingsGoal; const s = monthSummary(ym).ahorro; const left = goal - s - amt;
      R.blocks.push({ ic: 'piggy', color: col('#2D8F73'), title: `Meta de ahorro · ${money0(goal)}`, total: goal, spent: s, amt, left, good: true, msg: left > 0 ? `Con este ahorro te faltan <b>${money2(left)}</b> para tu meta.` : `¡Llegas a tu meta${left < 0 ? ` y la pasas por <b>${money2(-left)}</b>` : ''}!` });
      R.toast = left > 0 ? `Te faltan ${money2(left)} para tu meta` : '¡Meta de ahorro cumplida!';
    }
    return R;
  });
}
function txLiveHTML(form, t) {
  const g = n => form.querySelector(`[name=${n}]`);
  const o = { type: (form.querySelector('[name=type]:checked') || {}).value, amount: parseFloat(g('amount').value) || 0, categoryId: g('categoryId').value, date: g('date').value, accountId: g('accountId').value, fromFreelance: g('fromFreelance') && g('fromFreelance').checked && !g('fromFreelance').closest('[hidden]') };
  const R = txImpact(o, t); if (!R.blocks.length) return '';
  return R.blocks.map(b => { const tot = b.total || 0; const over = !b.good && b.left < 0;
    const p1 = tot ? Math.min(100, b.spent / tot * 100) : 0, p2 = tot ? Math.max(0, Math.min(100 - p1, b.amt / tot * 100)) : 0;
    return `<div class="tl${over ? ' over' : ''}${b.good ? ' good' : ''}" style="--tc:${b.color || 'var(--berry)'}"><div class="tl-h">${icon(b.ic)}<b>${esc(b.title)}</b>${tot ? `<em class="num">${over ? '−' : ''}${money2(Math.abs(b.left))}</em>` : ''}</div>
      ${tot ? `<div class="tl-bar"><i style="width:${p1}%"></i><i class="new" style="width:${p2}%"></i></div><div class="tl-l"><span>${b.spentL || 'Llevas'} ${money0(b.spent)}</span><span>${b.amt ? `+ este ${money0(b.amt)}` : ''}</span></div>` : ''}
      <p>${b.msg}${b.sub ? ` ${b.sub}` : ''}</p></div>`; }).join('');
}
function txAfterNote(o, t) { try { const R = txImpact(o, t); return R.toast ? `Registrado · ${R.toast}` : ''; } catch (e) { return ''; } }

/* ===== Gasto por día: promedio, los días que más y los que menos ===== */
const WD_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WD_S = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
function dailySpend(ym, noFixed) {
  const n = daysIn(ym), cur = ym === thisMonth();
  const upto = cur ? Number(todayISO().slice(8)) : ym < thisMonth() ? n : 0;
  const days = Array.from({ length: n }, (_, i) => ({ d: i + 1, v: 0, cats: {}, iso: `${ym}-${String(i + 1).padStart(2, '0')}` }));
  S.data.transactions.filter(t => t.type === 'gasto' && inMonth(t, ym) && !(noFixed && t.fixed)).forEach(t => {
    const k = Number(t.date.slice(8)) - 1; if (k < 0 || k >= upto) return;
    days[k].v += t.amount; const c = t.categoryId || 'otros'; days[k].cats[c] = (days[k].cats[c] || 0) + t.amount;
  });
  const lived = days.slice(0, upto), total = sum(lived, x => x.v), avg = upto ? total / upto : 0;
  const spent = lived.filter(x => x.v > 0);
  const top = spent.slice().sort((a, b) => b.v - a.v).slice(0, 3);
  const low = spent.slice().sort((a, b) => a.v - b.v).filter(x => !top.includes(x)).slice(0, 3);
  const zero = lived.filter(x => !x.v).length;
  // promedio por día de la semana
  const wd = Array.from({ length: 7 }, () => ({ v: 0, c: 0 }));
  lived.forEach(x => { const w = new Date(x.iso + 'T12:00:00').getDay(); wd[w].v += x.v; wd[w].c++; });
  const wavg = wd.map(x => x.c ? x.v / x.c : 0);
  return { n, upto, days, total, avg, top, low, zero, wavg };
}
function dailySpendHTML(ym) {
  const all = dailySpend(ym); if (!all.upto || !all.total) return '';
  const nf = !!S.ddNoFixed, D = nf ? dailySpend(ym, true) : all;
  const toggle = `<div class="dd-tg" role="radiogroup" aria-label="Qué gastos contar"><button type="button" role="radio" data-dd="all" class="${nf ? '' : 'on'}" aria-checked="${!nf}">Todo</button><button type="button" role="radio" data-dd="var" class="${nf ? 'on' : ''}" aria-checked="${nf}">Sin fijos</button></div>`;
  if (!D.total) return chartCard('Tus días de gasto', toggle, '<div class="empty"><h3>Sin gastos variables</h3><p>Este mes solo hay gastos fijos (renta, servicios…). Toca «Todo» para verlos.</p></div>', 'dd-card');
  const W = 640, H = 230, pl = 44, pr = 12, pt = 18, pb = 26, iw = W - pl - pr, ih = H - pt - pb;
  const max = nice(Math.max(...D.days.map(x => x.v), D.avg)), y = v => pt + ih - v / max * ih, slot = iw / D.n, bw = Math.max(4, Math.min(16, slot * .66));
  const HI = col('#B02A4A'), LO = col('#666A28'), MID = col('#B39E8B'), AVG = col('#5B2A55');
  const isTop = x => D.top.includes(x), isLow = x => D.low.includes(x);
  const wdOf = x => WD_L[new Date(x.iso + 'T12:00:00').getDay()];
  const mainCat = x => { const e = Object.entries(x.cats).sort((a, b) => b[1] - a[1])[0]; return e ? cat(e[0]).name : ''; };
  const grid = [0, .5, 1].map(f => `<line x1="${pl}" x2="${W - pr}" y1="${y(f * max)}" y2="${y(f * max)}"/>`).join('');
  const ylab = [0, .5, 1].map(f => `<text x="${pl - 8}" y="${y(f * max) + 4}" text-anchor="end">${kfmt(f * max)}</text>`).join('');
  const marks = new Set([1, 5, 10, 15, 20, 25, D.n, ...D.top.map(x => x.d), ...D.low.map(x => x.d)]);
  let bars = '', xl = '';
  D.days.forEach((x, i) => {
    const cx = pl + slot * (i + .5), fut = x.d > D.upto;
    if (marks.has(x.d)) xl += `<text x="${cx}" y="${H - 8}" text-anchor="middle"${isTop(x) || isLow(x) ? ` class="dd-mk" fill="${isTop(x) ? HI : LO}"` : ''}>${x.d}</text>`;
    if (fut) { bars += `<circle cx="${cx}" cy="${y(0) - 2}" r="1.6" class="dd-fut"/>`; return; }
    if (!x.v) { bars += `<circle cx="${cx}" cy="${y(0) - 3}" r="2.6" fill="${LO}" opacity=".55"><title>${x.d}: sin gastos</title></circle>`; return; }
    const h = Math.max(3, y(0) - y(x.v)), fill = isTop(x) ? HI : isLow(x) ? LO : MID;
    bars += `<rect x="${cx - bw / 2}" y="${y(0) - h}" width="${bw}" height="${h}" rx="${Math.min(bw / 2, h / 2).toFixed(1)}" fill="${fill}" data-tip="<b>${wdOf(x)} ${x.d}</b>${money0(x.v)}${mainCat(x) ? ` · sobre todo ${esc(mainCat(x))}` : ''}${x.v > D.avg ? ` · ${pct((x.v / D.avg - 1) * 100)} arriba del promedio` : ''}"/>`;
  });
  const ay = y(D.avg);
  const avgLine = `<line class="dd-avg" x1="${pl}" x2="${W - pr}" y1="${ay}" y2="${ay}" stroke="${AVG}"/>${(() => { const t = `promedio ${money0(D.avg)}/día`, tw = t.length * 6.9 + 14, ty = Math.max(pt + 2, ay - 22); return `<rect class="dd-avgbg" x="${W - pr - tw}" y="${ty}" width="${tw}" height="18" rx="9" fill="${AVG}"/><text class="dd-avgt" x="${W - pr - tw / 2}" y="${ty + 13}" text-anchor="middle">${t}</text>`; })()}`;
  const svg = `<div class="chart dd-chart"><svg viewBox="0 0 ${W} ${H}" data-lq="bars"><g class="grid">${grid}</g>${ylab}${xl}${bars}${avgLine}</svg></div>`;
  const row = (x, c) => `<li style="--c:${c}"><span>${wdOf(x)} ${x.d}</span><b class="num">${money0(x.v)}</b><small>${esc(mainCat(x))}</small></li>`;
  const wmax = Math.max(...D.wavg), positive = D.wavg.filter(v => v > 0), wmin = positive.length ? Math.min(...positive) : 0;
  const order = [1, 2, 3, 4, 5, 6, 0];
  const week = `<div class="dd-week" role="img" aria-label="Promedio por día de la semana">${order.map(w => { const v = D.wavg[w], hi = v && v === wmax, lo = v && v === wmin && wmin !== wmax; return `<div class="dd-wd${hi ? ' hi' : lo ? ' lo' : ''}" data-tip="<b>${WD_L[w]}</b>${money0(v)} en promedio"><i style="height:${wmax ? Math.max(4, v / wmax * 100) : 4}%"></i><span>${WD_S[w]}</span></div>`; }).join('')}</div>`;
  const hiW = WD_L[D.wavg.indexOf(wmax)], loW = wmin ? WD_L[D.wavg.indexOf(wmin)] : '';
  const pl2 = w => { const s = w.toLowerCase(); return /o$/.test(s) ? s + 's' : s; };
  const say = `En promedio gastas <b>${money0(D.avg)}</b> al día${nf ? ' sin contar fijos' : ''}. Los <b>${pl2(hiW)}</b> es cuando más se va (${money0(wmax)})${loW && loW !== hiW ? ` y los <b>${pl2(loW)}</b> cuando menos (${money0(wmin)})` : ''}.`;
  return chartCard('Tus días de gasto', toggle,
    `<p class="dd-say">${say} <span class="dd-legend">${D.upto === D.n ? 'Todo el mes' : `Del 1 al ${D.upto}`} · <i class="dd-key hi"></i>más <i class="dd-key lo"></i>menos · <i class="dd-key avg"></i>promedio</span></p>${svg}
    <div class="dd-grid">
      <div><h3>Los que más</h3><ol class="dd-list">${D.top.map(x => row(x, HI)).join('')}</ol></div>
      <div><h3>Los que menos</h3><ol class="dd-list">${D.low.map(x => row(x, LO)).join('') || '<li class="dd-none">Aún no hay suficientes días</li>'}</ol>${D.zero ? `<p class="dd-zero"><b>${D.zero}</b> día${D.zero === 1 ? '' : 's'} sin gastar nada</p>` : ''}</div>
      <div><h3>Por día de la semana</h3>${week}</div>
    </div>`, 'dd-card');
}
