/* ===== Raw Money · cálculos dinámicos ===== */

/* Materializa gastos recurrentes del mes como movimientos reales (idempotente). */
function materializeRecurring(ym) {
  const d = S.data; let changed = false;
  d.recurring.forEach(r => {
    if (!r.active || !r.start || ym < r.start) return;
    if (r.end && ym > r.end) return;
    const [sy, sm] = r.start.split('-').map(Number); const [y, m] = ym.split('-').map(Number);
    const diff = (y - sy) * 12 + (m - sm);
    let days = [];
    if (r.freq === 'mensual') days = [r.day];
    else if (r.freq === 'quincenal') days = [r.day, Math.min(r.day + 15, daysIn(ym))];
    else if (r.freq === 'semanal') days = [r.day, r.day + 7, r.day + 14, r.day + 21].filter(x => x <= daysIn(ym));
    else if (r.freq === 'bimestral') { if (diff % 2 !== 0) return; days = [r.day]; }
    else if (r.freq === 'anual') { if (diff % 12 !== 0) return; days = [r.day]; }
    days.forEach((day, i) => {
      const id = `rec_${r.id}_${ym}_${i}`;
      if (d.skips.includes(id) || d.transactions.some(t => t.id === id)) return;
      d.transactions.push({ id, date: clampDay(ym, day), desc: r.name, amount: r.amount, type: 'gasto', categoryId: r.categoryId, method: r.method, accountId: r.accountId, fixed: true, notes: '', recurringId: r.id });
      changed = true;
    });
  });
  if (changed) saveData();
}

const inMonth = (t, ym) => t.date.slice(0, 7) === ym;
const upTo = (t, ym) => t.date.slice(0, 7) <= ym;
const sum = (arr, f = x => x.amount) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);
const isCash = t => t.method !== 'credito';

/* Compras a meses */
function installmentInfo(ins, ym) {
  const monthly = ins.total / ins.months;
  const end = addMonths(ins.start, ins.months - 1);
  const [sy, sm] = ins.start.split('-').map(Number); const [y, m] = ym.split('-').map(Number);
  const idx = (y - sy) * 12 + (m - sm); // 0-based nº de mensualidad en ym
  const paidCount = Math.max(0, Math.min(ins.months, idx + 1));
  const active = idx >= 0 && idx < ins.months;
  const remaining = ins.months - paidCount;
  return { monthly, end, idx, paidCount, active, remaining, pending: remaining * monthly, chargedToDate: paidCount * monthly, future: idx < 0 };
}

/* Saldo de tarjeta al cierre del mes ym: inicial + compras a crédito + mensualidades cargadas − pagos */
function cardBalance(card, ym) {
  const T = S.data.transactions;
  const purchases = sum(T.filter(t => t.type === 'gasto' && t.method === 'credito' && t.accountId === card.id && upTo(t, ym)));
  const inst = sum(S.data.installments.filter(i => i.cardId === card.id), i => installmentInfo(i, ym).chargedToDate);
  const payments = sum(T.filter(t => t.type === 'pago_tarjeta' && t.targetId === card.id && upTo(t, ym)));
  return Math.max(0, (card.opening || 0) + purchases + inst - payments);
}
function cardMonth(card, ym) {
  const T = S.data.transactions;
  const bal = cardBalance(card, ym);
  const prev = cardBalance(card, addMonths(ym, -1));
  const purchases = sum(T.filter(t => t.type === 'gasto' && t.method === 'credito' && t.accountId === card.id && inMonth(t, ym)));
  const instMonthly = sum(S.data.installments.filter(i => i.cardId === card.id && installmentInfo(i, ym).active), i => installmentInfo(i, ym).monthly);
  const paid = sum(T.filter(t => t.type === 'pago_tarjeta' && t.targetId === card.id && inMonth(t, ym)));
  const util = card.limit ? bal / card.limit * 100 : 0;
  const minPay = card.minAmount || Math.round(bal * ((card.minPct || 5) / 100));
  const noInterest = card.noInterest != null && card.noInterest !== '' ? Number(card.noInterest) : prev; // lo que cerró el mes anterior
  const payDate = clampDay(ym, card.payDay || 1);
  const status = paid >= Math.min(noInterest, prev) && prev > 0 ? 'pagado' : paid > 0 ? 'parcial' : (todayISO() > payDate && ym <= thisMonth() && prev > 0 ? 'vencido' : 'pendiente');
  return { bal, prev, purchases, instMonthly, paid, util, minPay, noInterest, payDate, status, available: Math.max(0, (card.limit || 0) - bal) };
}

/* Deudas */
function debtInfo(debt, ym) {
  const T = S.data.transactions;
  const paidTx = sum(T.filter(t => t.type === 'pago_deuda' && t.targetId === debt.id && upTo(t, ym)));
  const pending = Math.max(0, (debt.initial || 0) - paidTx);
  const paidTotal = (debt.original || 0) - pending;
  const progress = debt.original ? paidTotal / debt.original * 100 : 0;
  const paidThisMonth = sum(T.filter(t => t.type === 'pago_deuda' && t.targetId === debt.id && inMonth(t, ym)));
  const monthsLeft = debt.monthly > 0 ? Math.ceil(pending / debt.monthly) : null;
  const endMonth = monthsLeft != null ? addMonths(ym, monthsLeft) : null;
  const payDate = clampDay(ym, debt.payDay || 1);
  return { pending, paidTotal, progress, paidThisMonth, monthsLeft, endMonth, payDate, status: paidThisMonth >= (debt.monthly || 0) && debt.monthly > 0 ? 'pagado' : paidThisMonth > 0 ? 'parcial' : 'pendiente', done: pending <= 0 };
}

/* Saldo de cuentas (débito / efectivo) al cierre del mes */
function accountBalance(acc, ym) {
  const T = S.data.transactions.filter(t => upTo(t, ym));
  let b = acc.opening || 0;
  T.forEach(t => {
    if (t.type === 'ingreso' && t.accountId === acc.id) b += t.amount;
    else if (t.type === 'gasto' && t.accountId === acc.id && t.method !== 'credito') b -= t.amount;
    else if ((t.type === 'pago_tarjeta' || t.type === 'pago_deuda' || t.type === 'ahorro') && t.accountId === acc.id) b -= t.amount;
    else if (t.type === 'transferencia') { if (t.accountId === acc.id) b -= t.amount; if (t.targetId === acc.id) b += t.amount; }
  });
  return b;
}
const savingsTotal = ym => sum(S.data.transactions.filter(t => t.type === 'ahorro' && (ym ? upTo(t, ym) : true)));

/* Resumen mensual */
function monthSummary(ym) {
  const d = S.data; const T = d.transactions.filter(t => inMonth(t, ym));
  const gastos = T.filter(t => t.type === 'gasto');
  const instItems = d.installments.map(i => ({ ins: i, info: installmentInfo(i, ym) })).filter(x => x.info.active);
  const instMonthly = sum(instItems, x => x.info.monthly);
  const ingresos = sum(T.filter(t => t.type === 'ingreso'));
  const gastosTx = sum(gastos);
  const gastosTotal = gastosTx + instMonthly;
  const fijos = sum(gastos.filter(t => t.fixed)) + instMonthly;
  const variables = gastosTx - sum(gastos.filter(t => t.fixed));
  const gastosCash = sum(gastos.filter(isCash));
  const gastosCredito = sum(gastos.filter(t => !isCash(t))) + instMonthly;
  const pagosTarjeta = sum(T.filter(t => t.type === 'pago_tarjeta'));
  const pagosDeuda = sum(T.filter(t => t.type === 'pago_deuda'));
  const ahorro = sum(T.filter(t => t.type === 'ahorro'));
  const queda = ingresos - gastosCash - pagosTarjeta - pagosDeuda - ahorro;
  const byCat = {};
  gastos.forEach(t => { byCat[t.categoryId || 'otros'] = (byCat[t.categoryId || 'otros'] || 0) + t.amount; });
  instItems.forEach(x => { const c = x.ins.categoryId || 'compras'; byCat[c] = (byCat[c] || 0) + x.info.monthly; });
  const cards = d.cards.map(c => ({ card: c, m: cardMonth(c, ym) }));
  const debts = d.debts.map(x => ({ debt: x, i: debtInfo(x, ym) }));
  const tarjetasTotal = sum(cards, x => x.m.bal);
  const deudasTotal = sum(debts, x => x.i.pending);
  const disponibleCuentas = sum(d.accounts, a => accountBalance(a, ym));
  // comprometido: pagos que aún faltan en el mes (tarjetas, deudas, recurrentes futuros, mensualidades)
  const today = todayISO();
  let comprometido = 0; const compItems = [];
  cards.forEach(({ card, m }) => { const due = Math.max(0, Math.min(m.noInterest, m.prev) - m.paid); if (due > 0 && ym >= thisMonth()) { comprometido += due; compItems.push({ kind: 'tarjeta', name: card.name, amount: due, date: m.payDate }); } });
  debts.forEach(({ debt, i }) => { const due = Math.max(0, (debt.monthly || 0) - i.paidThisMonth); if (due > 0 && !i.done && ym >= thisMonth()) { comprometido += due; compItems.push({ kind: 'deuda', name: debt.name, amount: due, date: i.payDate }); } });
  gastos.filter(t => t.recurringId && t.date > today && ym >= thisMonth() && isCash(t)).forEach(t => { comprometido += t.amount; compItems.push({ kind: 'recurrente', name: t.desc, amount: t.amount, date: t.date }); });
  return { ym, ingresos, gastosTotal, gastosTx, fijos, variables, gastosCash, gastosCredito, pagosTarjeta, pagosDeuda, ahorro, queda, byCat, cards, debts, tarjetasTotal, deudasTotal, disponibleCuentas, instMonthly, instItems, comprometido, compItems, ahorroPct: ingresos ? ahorro / ingresos * 100 : 0, savings: savingsTotal(ym), count: T.length };
}

/* Ranking de categorías + comparación con mes anterior */
function categoryRanking(ym) {
  const cur = monthSummary(ym).byCat; const prev = monthSummary(addMonths(ym, -1)).byCat;
  const total = Object.values(cur).reduce((a, b) => a + b, 0);
  return Object.entries(cur).map(([id, v]) => ({ cat: cat(id), v, share: total ? v / total * 100 : 0, prev: prev[id] || 0, delta: prev[id] ? (v - prev[id]) / prev[id] * 100 : null })).sort((a, b) => b.v - a.v);
}

/* Presupuestos */
function budgetStatus(ym) {
  const byCat = monthSummary(ym).byCat;
  return Object.entries(S.data.budgets).filter(([, b]) => b > 0).map(([id, b]) => { const spent = byCat[id] || 0; return { cat: cat(id), budget: b, spent, left: b - spent, pct: spent / b * 100, over: spent > b }; }).sort((a, b) => b.pct - a.pct);
}

/* Eventos del calendario */
function monthEvents(ym) {
  const d = S.data; const ev = []; const T = d.transactions.filter(t => inMonth(t, ym));
  d.cards.forEach(c => { const m = cardMonth(c, ym); const amt = Math.min(m.noInterest, m.prev) || m.bal; if (amt > 0 || m.prev > 0) ev.push({ date: m.payDate, kind: 'tarjeta', name: `Pago ${c.name}`, amount: amt, paid: m.status === 'pagado', id: c.id, sub: `Mínimo ${money0(m.minPay)}` }); ev.push({ date: clampDay(ym, c.cutDay || 1), kind: 'corte', name: `Corte ${c.name}`, amount: null, paid: false, id: c.id }); });
  d.debts.forEach(x => { const i = debtInfo(x, ym); if (!i.done) ev.push({ date: i.payDate, kind: 'deuda', name: x.name, amount: x.monthly, paid: i.status === 'pagado', id: x.id, sub: x.creditor }); });
  T.filter(t => t.recurringId).forEach(t => { const r = byId(d.recurring, t.recurringId); ev.push({ date: t.date, kind: cat(t.categoryId).id === 'suscripciones' ? 'suscripcion' : 'recurrente', name: t.desc, amount: t.amount, paid: t.date <= todayISO(), id: t.id, sub: METHODS[t.method] }); });
  d.installments.forEach(i => { const info = installmentInfo(i, ym); if (info.active) { const c = byId(d.cards, i.cardId); ev.push({ date: clampDay(ym, (c && c.cutDay) || 1), kind: 'meses', name: `${i.desc} (${info.paidCount}/${i.months})`, amount: info.monthly, paid: false, id: i.id, sub: c ? c.name : '' }); } });
  return ev.sort((a, b) => a.date.localeCompare(b.date));
}

/* Historial: lista de meses con datos */
function monthsWithData() {
  const set = new Set(S.data.transactions.map(t => t.date.slice(0, 7)));
  set.add(thisMonth());
  return [...set].sort();
}
function historySeries(n = 6, endYm = S.month) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const ym = addMonths(endYm, -i); out.push({ ym, ...monthSummary(ym) }); }
  return out;
}
