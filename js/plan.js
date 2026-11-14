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
  const incomes = T.filter(t => t.type === 'ingreso' && ids.has(t.categoryId)).sort((a, b) => b.date.localeCompare(a.date)).map(t => ({ t, ...flSplit(t) }));
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
