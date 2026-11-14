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
    () => { S.data.transactions.push({ id: uid(), type: 'ahorro', amount: save, date: t.date, desc: `Ahorro de ${t.desc}`, accountId: t.accountId, categoryId: null, targetId: null, fixed: false, notes: '' }); saveData(); render(); toast(`Ahorro de ${money0(save)} registrado`); },
    'Sí, registrar'), 350);
}
