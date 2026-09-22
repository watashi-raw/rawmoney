/* ===== Raw Money · drawer y formularios ===== */
function closeDrawer() { document.querySelectorAll('.veil,.drawer,.sheet').forEach(e => e.remove()); document.removeEventListener('keydown', escClose); }
function escClose(e) { if (e.key === 'Escape') closeDrawer(); }
function openDrawer({ title, eyebrow, body, onSave, onDelete, saveLabel = 'Guardar', deleteLabel = 'Eliminar' }) {
  closeDrawer();
  const veil = document.createElement('div'); veil.className = 'veil'; veil.addEventListener('click', closeDrawer);
  const dr = document.createElement('aside'); dr.className = 'drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-label', title);
  dr.innerHTML = `<div class="dh"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h2>${title}</h2></div><button class="btn icon quiet" data-close aria-label="Cerrar">${icon('x')}</button></div><form class="body" novalidate>${body}</form><div class="df">${onDelete ? `<button class="btn danger" data-del>${icon('trash')}${deleteLabel}</button>` : ''}<span class="grow"></span><button class="btn quiet" data-close>Cancelar</button>${onSave ? `<button class="btn primary" data-save>${saveLabel}</button>` : ''}</div>`;
  document.body.append(veil, dr);
  dr.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeDrawer));
  const form = dr.querySelector('form');
  form.addEventListener('submit', e => { e.preventDefault(); if (onSave) onSave(readForm(form), form); });
  if (onSave) dr.querySelector('[data-save]').addEventListener('click', () => onSave(readForm(form), form));
  if (onDelete) dr.querySelector('[data-del]').addEventListener('click', onDelete);
  document.addEventListener('keydown', escClose);
  const first = form.querySelector('input:not([type=hidden]):not([type=radio]),select'); if (first && innerWidth > 900) first.focus();
  return dr;
}
function readForm(form) {
  const o = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = o[el.name]; return; }
    if (el.type === 'checkbox') { o[el.name] = el.checked; return; }
    o[el.name] = el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value.trim();
  });
  return o;
}
const F = {
  text: (n, l, v = '', ph = '', extra = '') => `<div class="f"><label for="fx-${n}">${l}</label><input class="inp" id="fx-${n}" name="${n}" value="${esc(v)}" placeholder="${esc(ph)}" ${extra}></div>`,
  num: (n, l, v = '', ph = '', extra = '') => `<div class="f"><label for="fx-${n}">${l}</label><input class="inp" id="fx-${n}" name="${n}" type="number" inputmode="decimal" step="any" value="${v ?? ''}" placeholder="${esc(ph)}" ${extra}></div>`,
  amount: (n, v = '') => `<div class="f"><label for="fx-${n}">Monto (MXN)</label><input class="inp amount" id="fx-${n}" name="${n}" type="number" inputmode="decimal" step="any" min="0" value="${v ?? ''}" placeholder="0" required></div>`,
  date: (n, l, v) => `<div class="f"><label for="fx-${n}">${l}</label><input class="inp" id="fx-${n}" name="${n}" type="date" value="${v || todayISO()}"></div>`,
  month: (n, l, v) => `<div class="f"><label for="fx-${n}">${l}</label><input class="inp" id="fx-${n}" name="${n}" type="month" value="${v || thisMonth()}"></div>`,
  sel: (n, l, opts, v, hint = '') => `<div class="f" data-f="${n}"><label for="fx-${n}">${l}</label><select class="sel" id="fx-${n}" name="${n}">${opts.map(([k, t]) => `<option value="${k}"${String(k) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`,
  seg: (n, opts, v) => `<div class="seg" data-f="${n}">${opts.map(([k, t]) => `<label><input type="radio" name="${n}" value="${k}"${k === v ? ' checked' : ''}>${t}</label>`).join('')}</div>`,
  toggle: (n, l, v) => `<label class="toggle"><input type="checkbox" name="${n}"${v ? ' checked' : ''}>${l}</label>`,
  area: (n, l, v = '') => `<div class="f"><label for="fx-${n}">${l}</label><textarea class="inp" id="fx-${n}" name="${n}" rows="2">${esc(v)}</textarea></div>`,
  colors: (n, v) => `<div class="f"><label>Color</label><div class="swatches">${CAT_COLORS.map(c => `<label style="--c:${c}"><input type="radio" name="${n}" value="${c}"${c === v ? ' checked' : ''}></label>`).join('')}</div></div>`,
  icons: (n, v) => `<div class="f"><label>Ícono</label><div class="icons">${CAT_ICON_KEYS.map(k => `<label><input type="radio" name="${n}" value="${k}"${k === v ? ' checked' : ''}>${icon(k)}</label>`).join('')}</div></div>`,
};
const catOpts = kind => S.data.categories.filter(c => c.kind === kind).map(c => [c.id, c.name]);
const accOpts = () => S.data.accounts.map(a => [a.id, a.name]);
const cardOpts = () => S.data.cards.map(c => [c.id, c.name]);
const allAccOpts = () => [...S.data.accounts.map(a => [a.id, a.name]), ...S.data.cards.map(c => [c.id, `${c.name} (crédito)`])];
function need(form, ok, msg) { if (!ok) { toast(msg); return false; } return true; }

/* ---------- Movimiento ---------- */
function formTx(t, preset = {}) {
  const isNew = !t; const v = { type: 'gasto', date: todayISO(), method: 'debito', accountId: (S.data.accounts[0] || {}).id, categoryId: 'alimentacion', fixed: false, ...preset, ...(t || {}) };
  const body = `
    ${F.seg('type', Object.entries(TYPES), v.type)}
    ${F.amount('amount', v.amount)}
    <div class="fr">${F.date('date', 'Fecha', v.date)}${F.text('desc', 'Descripción', v.desc, 'Ej. Súper, Gasolina…', 'required')}</div>
    ${F.sel('categoryId', 'Categoría', catOpts(v.type === 'ingreso' ? 'ingreso' : 'gasto'), v.categoryId)}
    ${F.sel('method', 'Método de pago', Object.entries(METHODS), v.method)}
    ${F.sel('accountId', 'Cuenta o tarjeta', allAccOpts(), v.accountId, 'Si usas tarjeta de crédito, elige la tarjeta y el método “Crédito”.')}
    ${F.sel('targetId', 'Destino', [], v.targetId)}
    ${F.toggle('fixed', 'Es un gasto fijo (renta, servicios, mensualidades…)', v.fixed)}
    ${F.area('notes', 'Notas (opcional)', v.notes)}`;
  const dr = openDrawer({ title: isNew ? 'Nuevo movimiento' : 'Editar movimiento', eyebrow: isNew ? 'Registrar' : dateLong(v.date), body, saveLabel: isNew ? 'Registrar' : 'Guardar cambios',
    onSave: (o, form) => {
      if (!need(form, o.amount > 0, 'Escribe un monto mayor a cero')) return; if (!need(form, o.desc, 'Escribe una descripción')) return;
      const isCard = !!byId(S.data.cards, o.accountId);
      if (o.type === 'gasto' && isCard) o.method = 'credito';
      if (o.type === 'gasto' && o.method === 'credito' && !isCard) { if (!need(form, false, 'Para pagar con crédito elige una tarjeta')) return; }
      if (o.type !== 'gasto' && isCard) { if (!need(form, false, 'Elige una cuenta de débito o efectivo')) return; }
      if (['transferencia', 'pago_tarjeta', 'pago_deuda'].includes(o.type) && !o.targetId) { if (!need(form, false, 'Elige el destino')) return; }
      if (!['gasto', 'ingreso'].includes(o.type)) o.categoryId = null;
      if (o.type !== 'gasto') o.fixed = false;
      if (!['transferencia', 'pago_tarjeta', 'pago_deuda'].includes(o.type)) o.targetId = null;
      if (o.type === 'ingreso' && o.method === 'credito') o.method = 'transferencia';
      if (isNew) { S.data.transactions.push({ id: uid(), ...o }); toast(o.type === 'ingreso' ? 'Ingreso registrado' : 'Movimiento registrado'); }
      else { Object.assign(t, o); toast('Cambios guardados'); }
      saveData(); closeDrawer(); render();
    },
    onDelete: isNew ? null : () => confirmBox('¿Eliminar este movimiento?', t.recurringId ? 'Es un gasto recurrente: solo se quitará de este mes.' : 'Esta acción no se puede deshacer.', () => { if (t.recurringId) S.data.skips.push(t.id); S.data.transactions = S.data.transactions.filter(x => x.id !== t.id); saveData(); closeDrawer(); render(); toast('Movimiento eliminado'); }) });
  const form = dr.querySelector('form');
  const sync = () => {
    const type = form.querySelector('[name=type]:checked').value; const method = form.querySelector('[name=method]');
    const show = (n, on) => { const el = form.querySelector(`[data-f="${n}"]`); if (el) el.hidden = !on; };
    show('categoryId', type === 'gasto' || type === 'ingreso'); show('method', type === 'gasto');
    show('targetId', ['transferencia', 'pago_tarjeta', 'pago_deuda'].includes(type));
    form.querySelector('.toggle').hidden = type !== 'gasto';
    form.querySelector('label[for=fx-accountId]').textContent = type === 'transferencia' ? 'Desde la cuenta' : type === 'gasto' ? 'Cuenta o tarjeta' : type === 'ingreso' ? 'Cuenta donde entra' : 'Cuenta desde la que pagas';
    // categorías por tipo
    const cs = form.querySelector('[name=categoryId]'); const kind = type === 'ingreso' ? 'ingreso' : 'gasto';
    if (cs.dataset.kind !== kind) { const cur = cs.value; cs.innerHTML = catOpts(kind).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join(''); cs.dataset.kind = kind; if ([...cs.options].some(o => o.value === cur)) cs.value = cur; else if (kind === 'ingreso') cs.value = 'sueldo'; }
    // cuentas: sólo débito/efectivo salvo gasto
    const as = form.querySelector('[name=accountId]'); const cur = as.value; const opts = type === 'gasto' ? allAccOpts() : accOpts();
    as.innerHTML = opts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join(''); if (opts.some(o => o[0] === cur)) as.value = cur;
    // destino
    const ts = form.querySelector('[name=targetId]'); const tcur = ts.value;
    const topts = type === 'transferencia' ? accOpts().filter(o => o[0] !== as.value) : type === 'pago_tarjeta' ? cardOpts() : type === 'pago_deuda' ? S.data.debts.map(d => [d.id, d.name]) : [];
    ts.innerHTML = topts.map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join(''); if (topts.some(o => o[0] === tcur)) ts.value = tcur;
    form.querySelector('label[for=fx-targetId]').textContent = type === 'transferencia' ? 'A la cuenta' : type === 'pago_tarjeta' ? 'Tarjeta que pagas' : 'Deuda que pagas';
    if (type === 'gasto') { const isCard = !!byId(S.data.cards, as.value); if (isCard) method.value = 'credito'; else if (method.value === 'credito') method.value = 'debito'; }
  };
  form.addEventListener('change', e => { if (['type', 'accountId', 'method'].includes(e.target.name)) { if (e.target.name === 'method' && e.target.value === 'credito' && !byId(S.data.cards, form.querySelector('[name=accountId]').value) && S.data.cards[0]) form.querySelector('[name=accountId]').value = S.data.cards[0].id; sync(); } });
  sync();
}

/* ---------- Tarjeta ---------- */
function formCard(c) {
  const isNew = !c; const v = { cutDay: 15, payDay: 5, minPct: 5, color: '#8A3B75', opening: 0, ...(c || {}) };
  const body = `<div class="fr">${F.text('name', 'Nombre', v.name, 'Ej. BBVA Azul', 'required')}${F.text('institution', 'Institución', v.institution, 'Ej. BBVA')}</div>
    <div class="fr">${F.num('limit', 'Límite de crédito', v.limit, '20000', 'required')}${F.num('opening', isNew ? 'Saldo actual (lo que debes hoy)' : 'Saldo inicial registrado', v.opening, '0')}</div>
    <div class="fr">${F.num('cutDay', 'Día de corte', v.cutDay, '15', 'min="1" max="31"')}${F.num('payDay', 'Día límite de pago', v.payDay, '5', 'min="1" max="31"')}</div>
    <div class="fr">${F.num('minPct', 'Pago mínimo (% del saldo)', v.minPct, '5')}${F.num('noInterest', 'Pago para no generar intereses', v.noInterest, 'Automático', '')}</div>
    ${F.num('rate', 'Tasa de interés anual (%) · opcional', v.rate, '42.9')}
    ${F.colors('color', v.color)}
    <div class="hint">El saldo se actualiza solo con cada compra a crédito, mensualidad y pago que registres. “Pago para no generar intereses” se calcula con el saldo del cierre anterior si lo dejas vacío.</div>`;
  openDrawer({ title: isNew ? 'Agregar tarjeta' : 'Editar tarjeta', eyebrow: 'Tarjeta de crédito', body, saveLabel: isNew ? 'Agregar' : 'Guardar',
    onSave: (o, f) => { if (!need(f, o.name, 'Escribe el nombre')) return; if (!need(f, o.limit > 0, 'Escribe el límite')) return; o.opening = o.opening || 0; if (isNew) S.data.cards.push({ id: uid(), ...o }); else Object.assign(c, o); saveData(); closeDrawer(); render(); toast(isNew ? 'Tarjeta agregada' : 'Tarjeta guardada'); },
    onDelete: isNew ? null : () => confirmBox(`¿Eliminar ${c.name}?`, 'Se eliminarán también sus compras a meses. Los movimientos se conservan.', () => { S.data.cards = S.data.cards.filter(x => x.id !== c.id); S.data.installments = S.data.installments.filter(i => i.cardId !== c.id); saveData(); closeDrawer(); render(); toast('Tarjeta eliminada'); }) });
}
function detailCard(c) {
  const m = cardMonth(c, S.month); const ym = S.month;
  const inst = S.data.installments.filter(i => i.cardId === c.id && installmentInfo(i, ym).active);
  const txs = S.data.transactions.filter(t => inMonth(t, ym) && ((t.type === 'gasto' && t.accountId === c.id) || (t.type === 'pago_tarjeta' && t.targetId === c.id))).sort((a, b) => b.date.localeCompare(a.date));
  const body = `<dl class="detail"><dt>Saldo actual</dt><dd class="num"><b>${money0(m.bal)}</b></dd><dt>Límite</dt><dd class="num">${money0(c.limit)}</dd><dt>Disponible</dt><dd class="num pos">${money0(m.available)}</dd><dt>Utilización</dt><dd class="num">${pct(m.util)}</dd><dt>Corte</dt><dd>día ${c.cutDay}</dd><dt>Límite de pago</dt><dd>${dateLong(m.payDate)} ${statusTag(m.status)}</dd><dt>Pago mínimo</dt><dd class="num">${money0(m.minPay)}</dd><dt>Sin intereses</dt><dd class="num">${money0(m.noInterest)}</dd><dt>Pagado este mes</dt><dd class="num">${money0(m.paid)}</dd><dt>Compras del mes</dt><dd class="num">${money0(m.purchases)}</dd>${inst.length ? `<dt>Mensualidades</dt><dd class="num">${money0(m.instMonthly)} (${inst.map(i => esc(i.desc)).join(', ')})</dd>` : ''}</dl>
    <div class="chips"><button type="button" class="btn primary sm" data-pay>${icon('check')}Registrar pago</button><button type="button" class="btn secondary sm" data-buy>${icon('plus')}Compra con esta tarjeta</button><button type="button" class="btn secondary sm" data-edit>${icon('edit')}Editar</button></div>
    <div><div class="eyebrow" style="margin-bottom:6px">Movimientos de ${monthLabel(ym)}</div><div class="list">${txs.length ? txs.map(t => txRow(t)).join('') : '<p class="mut">Sin movimientos este mes.</p>'}</div></div>`;
  const dr = openDrawer({ title: c.name, eyebrow: c.institution || 'Tarjeta de crédito', body });
  dr.querySelector('[data-pay]').addEventListener('click', () => formTx(null, { type: 'pago_tarjeta', targetId: c.id, amount: Math.max(0, Math.min(m.noInterest, m.prev) - m.paid) || m.bal, desc: `Pago ${c.name}`, method: 'transferencia' }));
  dr.querySelector('[data-buy]').addEventListener('click', () => formTx(null, { type: 'gasto', accountId: c.id, method: 'credito' }));
  dr.querySelector('[data-edit]').addEventListener('click', () => formCard(c));
  dr.querySelectorAll('[data-tx]').forEach(r => r.addEventListener('click', () => formTx(byId(S.data.transactions, r.dataset.tx))));
}

/* ---------- Compra a meses ---------- */
function formInstallment(i) {
  const isNew = !i; const v = { months: 12, start: thisMonth(), cardId: (S.data.cards[0] || {}).id, categoryId: 'compras', ...(i || {}) };
  const body = `${F.text('desc', 'Descripción', v.desc, 'Ej. Laptop', 'required')}
    <div class="fr">${F.num('total', 'Monto total', v.total, '18000', 'required')}${F.num('months', 'Número de meses', v.months, '12', 'min="1" required')}</div>
    <div class="fr">${F.month('start', 'Mes de inicio', v.start)}${F.sel('cardId', 'Tarjeta', cardOpts(), v.cardId)}</div>
    ${F.sel('categoryId', 'Categoría', catOpts('gasto'), v.categoryId)}
    <div class="hint" id="ins-calc"></div>`;
  const dr = openDrawer({ title: isNew ? 'Compra a meses' : 'Editar compra a meses', eyebrow: 'Pago diferido', body, saveLabel: isNew ? 'Registrar' : 'Guardar',
    onSave: (o, f) => { if (!need(f, o.desc && o.total > 0 && o.months > 0, 'Completa descripción, monto y meses')) return; if (!need(f, o.cardId, 'Agrega una tarjeta primero')) return; if (isNew) S.data.installments.push({ id: uid(), ...o }); else Object.assign(i, o); saveData(); closeDrawer(); render(); toast('Compra a meses guardada'); },
    onDelete: isNew ? null : () => confirmBox(`¿Eliminar ${i.desc}?`, 'Dejará de sumarse a la tarjeta y al presupuesto.', () => { S.data.installments = S.data.installments.filter(x => x.id !== i.id); saveData(); closeDrawer(); render(); toast('Eliminada'); }) });
  const f = dr.querySelector('form'); const calc = () => { const o = readForm(f); const el = f.querySelector('#ins-calc'); if (o.total > 0 && o.months > 0) { const end = addMonths(o.start || thisMonth(), o.months - 1); el.innerHTML = `Mensualidad de <b>${money(o.total / o.months)}</b> · termina en <b>${monthLabel(end)}</b>. No la registres además como gasto: la mensualidad se suma sola cada mes a la tarjeta y a tus gastos fijos.`; } else el.textContent = ''; };
  f.addEventListener('input', calc); calc();
}

/* ---------- Deuda ---------- */
function formDebt(d) {
  const isNew = !d; const v = { payDay: 15, start: thisMonth(), ...(d || {}) };
  const body = `<div class="fr">${F.text('name', 'Nombre de la deuda', v.name, 'Ej. Crédito del auto', 'required')}${F.text('creditor', 'Acreedor', v.creditor, 'Ej. Banco, familiar…')}</div>
    <div class="fr">${F.num('original', 'Monto original', v.original, '30000', 'required')}${F.num('initial', isNew ? 'Saldo pendiente hoy' : 'Saldo pendiente al registrarla', v.initial, '18000', 'required')}</div>
    <div class="fr">${F.num('monthly', 'Pago mensual', v.monthly, '2000')}${F.num('payDay', 'Día de pago', v.payDay, '15', 'min="1" max="31"')}</div>
    <div class="fr">${F.num('rate', 'Tasa anual (%) · opcional', v.rate, '0')}${F.month('start', 'Mes en que la registras', v.start)}</div>
    <div class="hint">El saldo baja con cada “Pago de deuda” que registres. La fecha estimada de liquidación se calcula con el pago mensual.</div>`;
  openDrawer({ title: isNew ? 'Agregar deuda' : 'Editar deuda', eyebrow: 'Deuda', body, saveLabel: isNew ? 'Agregar' : 'Guardar',
    onSave: (o, f) => { if (!need(f, o.name && o.original > 0, 'Escribe nombre y monto original')) return; if (o.initial == null) o.initial = o.original; if (isNew) S.data.debts.push({ id: uid(), ...o }); else Object.assign(d, o); saveData(); closeDrawer(); render(); toast(isNew ? 'Deuda agregada' : 'Deuda guardada'); },
    onDelete: isNew ? null : () => confirmBox(`¿Eliminar ${d.name}?`, 'Los pagos registrados se conservan como movimientos.', () => { S.data.debts = S.data.debts.filter(x => x.id !== d.id); saveData(); closeDrawer(); render(); toast('Deuda eliminada'); }) });
}
function detailDebt(d) {
  const i = debtInfo(d, S.month);
  const txs = S.data.transactions.filter(t => t.type === 'pago_deuda' && t.targetId === d.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const body = `<dl class="detail"><dt>Pendiente</dt><dd class="num"><b>${money0(i.pending)}</b></dd><dt>Original</dt><dd class="num">${money0(d.original)}</dd><dt>Pagado</dt><dd class="num pos">${money0(i.paidTotal)} (${pct(i.progress)})</dd><dt>Pago mensual</dt><dd class="num">${money0(d.monthly)}</dd><dt>Próximo pago</dt><dd>${dateLong(i.payDate)} ${i.done ? '' : statusTag(i.status)}</dd><dt>Liquidación</dt><dd>${i.done ? 'Liquidada' : i.endMonth ? monthLabel(i.endMonth) : '—'}</dd>${d.rate ? `<dt>Tasa</dt><dd>${d.rate}% anual</dd>` : ''}</dl>
    <div class="chips"><button type="button" class="btn primary sm" data-pay>${icon('check')}Registrar pago</button><button type="button" class="btn secondary sm" data-edit>${icon('edit')}Editar</button></div>
    <div><div class="eyebrow" style="margin-bottom:6px">Pagos</div><div class="list">${txs.length ? txs.map(t => txRow(t)).join('') : '<p class="mut">Sin pagos registrados.</p>'}</div></div>`;
  const dr = openDrawer({ title: d.name, eyebrow: d.creditor || 'Deuda', body });
  dr.querySelector('[data-pay]').addEventListener('click', () => formTx(null, { type: 'pago_deuda', targetId: d.id, amount: d.monthly, desc: `Pago ${d.name}`, method: 'transferencia' }));
  dr.querySelector('[data-edit]').addEventListener('click', () => formDebt(d));
  dr.querySelectorAll('[data-tx]').forEach(r => r.addEventListener('click', () => formTx(byId(S.data.transactions, r.dataset.tx))));
}

/* ---------- Recurrente ---------- */
function formRecurring(r) {
  const isNew = !r; const v = { freq: 'mensual', day: 1, categoryId: 'servicios', method: 'debito', accountId: (S.data.accounts[0] || {}).id, start: thisMonth(), active: true, ...(r || {}) };
  const body = `${F.text('name', 'Nombre', v.name, 'Ej. Netflix, Renta…', 'required')}
    <div class="fr">${F.num('amount', 'Monto', v.amount, '219', 'required')}${F.sel('freq', 'Frecuencia', Object.entries(FREQ), v.freq)}</div>
    <div class="fr">${F.num('day', 'Día de cobro', v.day, '1', 'min="1" max="31"')}${F.month('start', 'Desde', v.start)}</div>
    ${F.sel('categoryId', 'Categoría', catOpts('gasto'), v.categoryId)}
    <div class="fr">${F.sel('method', 'Método de pago', Object.entries(METHODS), v.method)}${F.sel('accountId', 'Cuenta o tarjeta', allAccOpts(), v.accountId)}</div>
    ${F.toggle('active', 'Activo (se agrega automáticamente cada mes)', v.active)}`;
  openDrawer({ title: isNew ? 'Gasto recurrente' : 'Editar recurrente', eyebrow: 'Se repite', body, saveLabel: isNew ? 'Agregar' : 'Guardar',
    onSave: (o, f) => { if (!need(f, o.name && o.amount > 0, 'Escribe nombre y monto')) return; if (byId(S.data.cards, o.accountId)) o.method = 'credito'; else if (o.method === 'credito') o.method = 'debito'; if (isNew) S.data.recurring.push({ id: uid(), ...o }); else { Object.assign(r, o); S.data.transactions.filter(t => t.recurringId === r.id && t.date.slice(0, 7) >= thisMonth()).forEach(t => Object.assign(t, { desc: o.name, amount: o.amount, categoryId: o.categoryId, method: o.method, accountId: o.accountId })); } saveData(); closeDrawer(); render(); toast('Recurrente guardado'); },
    onDelete: isNew ? null : () => confirmBox(`¿Eliminar ${r.name}?`, 'Se quitará de este mes en adelante. Los meses pasados se conservan.', () => { S.data.recurring = S.data.recurring.filter(x => x.id !== r.id); S.data.transactions = S.data.transactions.filter(t => !(t.recurringId === r.id && t.date.slice(0, 7) >= thisMonth())); saveData(); closeDrawer(); render(); toast('Recurrente eliminado'); }) });
}

/* ---------- Categoría ---------- */
function formCategory(c) {
  const isNew = !c; const v = { kind: 'gasto', icon: 'dots', color: CAT_COLORS[0], ...(c || {}) };
  const body = `${F.text('name', 'Nombre', v.name, 'Ej. Hogar', 'required')}${F.seg('kind', [['gasto', 'Gasto'], ['ingreso', 'Ingreso']], v.kind)}${F.icons('icon', v.icon)}${F.colors('color', v.color)}`;
  openDrawer({ title: isNew ? 'Nueva categoría' : 'Editar categoría', eyebrow: 'Categoría', body, saveLabel: isNew ? 'Crear' : 'Guardar',
    onSave: (o, f) => { if (!need(f, o.name, 'Escribe el nombre')) return; if (isNew) S.data.categories.push({ id: uid(), ...o }); else Object.assign(c, o); saveData(); closeDrawer(); render(); toast('Categoría guardada'); },
    onDelete: isNew || c.id === 'otros' ? null : () => confirmBox(`¿Eliminar ${c.name}?`, 'Sus movimientos pasarán a “Otros”.', () => { S.data.transactions.forEach(t => { if (t.categoryId === c.id) t.categoryId = c.kind === 'ingreso' ? 'otros_ing' : 'otros'; }); S.data.recurring.forEach(r => { if (r.categoryId === c.id) r.categoryId = 'otros'; }); delete S.data.budgets[c.id]; S.data.categories = S.data.categories.filter(x => x.id !== c.id); saveData(); closeDrawer(); render(); toast('Categoría eliminada'); }) });
}

/* ---------- Presupuesto ---------- */
function formBudget(catId) {
  const cur = catId ? S.data.budgets[catId] : null;
  const body = `${F.sel('categoryId', 'Categoría', catOpts('gasto'), catId || 'alimentacion')}${F.num('amount', 'Presupuesto mensual', cur, '4000', 'required')}<div class="hint">Aplica a todos los meses. Verás una alerta discreta si te pasas.</div>`;
  openDrawer({ title: cur ? 'Editar presupuesto' : 'Asignar presupuesto', eyebrow: 'Presupuesto', body, saveLabel: 'Guardar',
    onSave: (o, f) => { if (!need(f, o.amount > 0, 'Escribe un monto')) return; S.data.budgets[o.categoryId] = o.amount; saveData(); closeDrawer(); render(); toast('Presupuesto guardado'); },
    onDelete: cur ? () => { delete S.data.budgets[catId]; saveData(); closeDrawer(); render(); toast('Presupuesto quitado'); } : null, deleteLabel: 'Quitar' });
}

/* ---------- Cuenta ---------- */
function formAccount(a) {
  const isNew = !a; const v = { type: 'debito', opening: 0, ...(a || {}) };
  const body = `${F.text('name', 'Nombre', v.name, 'Ej. BBVA Débito, Efectivo', 'required')}${F.seg('type', [['debito', 'Débito'], ['efectivo', 'Efectivo']], v.type)}<div class="fr">${F.text('institution', 'Institución', v.institution, 'Opcional')}${F.num('opening', isNew ? 'Saldo actual' : 'Saldo inicial registrado', v.opening, '0')}</div><div class="hint">El saldo cambia con cada ingreso, gasto, pago, ahorro o transferencia que registres.</div>`;
  openDrawer({ title: isNew ? 'Agregar cuenta' : 'Editar cuenta', eyebrow: 'Cuenta', body, saveLabel: isNew ? 'Agregar' : 'Guardar',
    onSave: (o, f) => { if (!need(f, o.name, 'Escribe el nombre')) return; o.opening = o.opening || 0; if (isNew) S.data.accounts.push({ id: uid(), ...o }); else Object.assign(a, o); saveData(); closeDrawer(); render(); toast('Cuenta guardada'); },
    onDelete: isNew ? null : () => confirmBox(`¿Eliminar ${a.name}?`, 'Los movimientos se conservan.', () => { S.data.accounts = S.data.accounts.filter(x => x.id !== a.id); saveData(); closeDrawer(); render(); toast('Cuenta eliminada'); }) });
}
