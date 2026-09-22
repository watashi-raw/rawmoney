/* ===== Raw Money · shell, navegación y acciones ===== */
let toastT;
function toast(msg) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); } el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200); }
function confirmBox(title, text, onOk, okLabel = 'Eliminar') {
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="box" role="alertdialog"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="btn quiet" data-no>Cancelar</button><button class="btn ${okLabel === 'Eliminar' || okLabel === 'Borrar' ? 'danger' : 'primary'}" data-ok>${okLabel}</button></div></div>`;
  document.body.appendChild(m); m.querySelector('[data-no]').addEventListener('click', () => m.remove()); m.addEventListener('click', e => { if (e.target === m) m.remove(); }); m.querySelector('[data-ok]').addEventListener('click', () => { m.remove(); onOk(); }); m.querySelector('[data-ok]').focus();
}
function applyTheme() { let t = null; try { t = localStorage.getItem('midinero.theme'); } catch (e) {} document.documentElement.dataset.theme = t || 'dark'; }
function toggleTheme() { const root = document.documentElement; root.dataset.theme = isLightTheme() ? 'dark' : 'light'; try { localStorage.setItem('midinero.theme', root.dataset.theme); } catch (e) {} render(); }
async function exportJSON() {
  const json = JSON.stringify(S.data, null, 2); const filename = `raw-money-${todayISO()}.json`;
  if (window.claude && typeof window.claude.use === 'function') {
    // Dentro del visor de claude.ai: la descarga pasa por la capacidad "downloads" (el visor pide confirmación).
    const dl = await window.claude.use('downloads');
    if (dl) { try { await dl.save({ filename, data: json }); toast('Respaldo guardado'); } catch (e) { if (e && e.code !== 'declined') toast('No se pudo guardar el respaldo'); } return; }
    // Sin permiso de descarga: mostrar el JSON para copiarlo
    openDrawer({ title: 'Respaldo', eyebrow: 'Copia y guarda este texto', body: `<textarea class="inp" id="bk" rows="14" readonly style="font-family:ui-monospace,Menlo,monospace;font-size:12px">${esc(json)}</textarea><button type="button" class="btn secondary sm" id="bk-copy">${icon('check')}Copiar</button>` });
    document.getElementById('bk-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(json); toast('Copiado'); } catch (e) { document.getElementById('bk').select(); toast('Selecciona y copia el texto'); } });
    return;
  }
  const blob = new Blob([json], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); toast('Respaldo descargado');
}

const ACTIONS = {
  'new-gasto': () => formTx(null, { type: 'gasto' }), 'new-ingreso': () => formTx(null, { type: 'ingreso', categoryId: 'sueldo', method: 'transferencia' }),
  'new-tarjeta': () => formCard(null), 'new-deuda': () => formDebt(null), 'new-meses': () => formInstallment(null), 'new-rec': () => formRecurring(null), 'new-cat': () => formCategory(null), 'new-acc': () => formAccount(null), 'new-budget': () => formBudget(null),
  'new-pago-tarjeta': () => formTx(null, { type: 'pago_tarjeta', targetId: (S.data.cards[0] || {}).id, method: 'transferencia' }), 'new-pago-deuda': () => formTx(null, { type: 'pago_deuda', targetId: (S.data.debts[0] || {}).id, method: 'transferencia' }),
  'export': exportJSON,
  'clear-demo': () => confirmBox('¿Borrar los datos de demostración?', 'Se eliminan movimientos, tarjetas, deudas y recurrentes de ejemplo. Las categorías se quedan para que empieces desde cero.', () => { S.data = emptyData(); saveData(); S.month = thisMonth(); render(); toast('Listo, empieza desde cero'); }, 'Borrar'),
  'load-demo': () => confirmBox('¿Cargar datos de demostración?', 'Reemplaza lo que tienes ahora por los datos de ejemplo.', () => { S.data = demoData(); saveData(); S.month = thisMonth(); render(); toast('Datos demo cargados'); }, 'Cargar'),
  'reset': () => confirmBox('¿Empezar de cero?', 'Se borra todo: movimientos, tarjetas, deudas, recurrentes y presupuestos.', () => { S.data = emptyData(); saveData(); S.month = thisMonth(); render(); toast('Todo limpio'); }, 'Borrar'),
  'more': () => openSheet(), 'theme': toggleTheme, 'lock': lockApp, 'today': () => { S.month = thisMonth(); render(); },
};

function openSheet() {
  closeDrawer();
  const veil = document.createElement('div'); veil.className = 'veil'; veil.addEventListener('click', closeDrawer);
  const sh = document.createElement('div'); sh.className = 'sheet';
  sh.innerHTML = `<div class="grab"></div><nav class="nav">${Object.entries(VIEWS).map(([k, v]) => `<a href="#${k}" class="${S.view === k ? 'on' : ''}">${icon(v.icon)}${v.title}</a>`).join('')}</nav><div class="chips" style="margin-top:12px"><button class="btn secondary sm" data-act="theme">${icon('moon')}Cambiar tema</button></div>`;
  document.body.append(veil, sh);
  sh.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  sh.querySelector('[data-act=theme]').addEventListener('click', () => { toggleTheme(); });
}

function shell() {
  const navHtml = NAV_GROUPS.map(([g, keys]) => `<div class="grp">${g}</div>${keys.map(k => `<a href="#${k}" data-nav="${k}" class="${S.view === k ? 'on' : ''}">${icon(VIEWS[k].icon)}${VIEWS[k].title}</a>`).join('')}`).join('');
  return `
  <aside class="side"><a class="logo" href="#inicio"><i>$</i><span>Raw Money<small>finanzas personales</small></span></a><nav class="nav">${navHtml}</nav>
    <div class="foot">${S.data.demo ? '<div class="demo"><b>●</b> Datos de demostración</div>' : ''}${typeof CLOUD !== 'undefined' && CLOUD.enabled ? `<div class="demo"><i class="cloud-dot ${CLOUD.user ? 'on' : ''}"></i> ${CLOUD.user ? 'Nube: ' + esc(CLOUD.user.email) : 'Nube: sin sesión'}</div>` : ''}<button class="btn secondary sm theme-side" data-act="theme">${icon('moon','i moon')}${icon('sun','i sun')}Tema</button></div></aside>
  <div class="main">
    <header class="top"><div class="in"><a class="logo" href="#inicio" style="display:none" id="mlogo"><i>$</i></a><div class="ttl">${VIEWS[S.view].title}</div><span class="sp"></span>
      <div class="monthsel"><button data-m="-1" aria-label="Mes anterior">${icon('chevL')}</button><button class="cur${isPast(S.month) ? ' past' : ''}" data-act="pick" title="Ir al mes actual">${monthLabel(S.month)}</button><button data-m="1" aria-label="Mes siguiente">${icon('chevR')}</button></div>
      ${S.month !== thisMonth() ? `<button class="btn quiet sm" data-act="today">Hoy</button>` : ''}
      <button class="theme" data-act="theme" aria-label="Cambiar tema"><svg class="i sun" viewBox="0 0 24 24">${ICONS.sun}</svg><svg class="i moon" viewBox="0 0 24 24">${ICONS.moon}</svg></button></div></header>
    <main class="content" id="content"></main>
  </div>
  <nav class="bottom"><a href="#inicio" class="${S.view === 'inicio' ? 'on' : ''}">${icon('home2')}<span>Inicio</span></a><a href="#movimientos" class="${S.view === 'movimientos' ? 'on' : ''}">${icon('list')}<span>Movimientos</span></a><a href="#inicio" class="fab" data-act="new-gasto" aria-label="Registrar gasto"><i>${icon('plus')}</i><span>Gasto</span></a><a href="#tarjetas" class="${S.view === 'tarjetas' ? 'on' : ''}">${icon('card')}<span>Tarjetas</span></a><a href="#inicio" class="${['gastos', 'resumen', 'historial', 'deudas', 'recurrentes', 'calendario', 'presupuesto', 'categorias', 'ajustes'].includes(S.view) ? 'on' : ''}" data-act="more">${icon('more')}<span>Más</span></a></nav>`;
}

function render() {
  const app = document.getElementById('app');
  if (S.locked) { app.className = ''; app.innerHTML = coverHTML(); bindCover(app); document.title = 'Raw Money'; window.scrollTo(0, 0); return; }
  app.className = 'app';
  materializeRecurring(S.month);
  const scrollY = window.scrollY;
  app.innerHTML = shell();
  const content = app.querySelector('#content');
  const v = VIEWS[S.view] || VIEWS.inicio;
  content.innerHTML = v.fn();
  if (v.bind) v.bind(content);
  bindTips(app);
  // navegación y acciones
  app.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { S.month = addMonths(S.month, Number(b.dataset.m)); S.histB = S.month; render(); }));
  app.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', e => { const a = b.dataset.act; if (a === 'pick') { S.month = thisMonth(); render(); return; } if (ACTIONS[a]) { e.preventDefault(); ACTIONS[a](); } }));
  app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.go; }));
  app.querySelectorAll('[data-tx]').forEach(r => r.addEventListener('click', () => formTx(byId(S.data.transactions, r.dataset.tx))));
  app.querySelectorAll('[data-card]').forEach(r => r.addEventListener('click', () => detailCard(byId(S.data.cards, r.dataset.card))));
  app.querySelectorAll('[data-debt]').forEach(r => r.addEventListener('click', () => detailDebt(byId(S.data.debts, r.dataset.debt))));
  app.querySelectorAll('[data-ins]').forEach(r => r.addEventListener('click', () => formInstallment(byId(S.data.installments, r.dataset.ins))));
  app.querySelectorAll('[data-rec]').forEach(r => r.addEventListener('click', () => formRecurring(byId(S.data.recurring, r.dataset.rec))));
  app.querySelectorAll('[data-cat]').forEach(r => r.addEventListener('click', () => formCategory(byId(S.data.categories, r.dataset.cat))));
  app.querySelectorAll('[data-acc]').forEach(r => r.addEventListener('click', () => formAccount(byId(S.data.accounts, r.dataset.acc))));
  app.querySelectorAll('[data-budget]').forEach(r => r.addEventListener('click', () => formBudget(r.dataset.budget)));
  app.querySelectorAll('[data-ev]').forEach(r => r.addEventListener('click', () => { const [kind, id] = r.dataset.ev.split(':'); if (kind === 'tarjeta' || kind === 'corte') detailCard(byId(S.data.cards, id)); else if (kind === 'deuda') detailDebt(byId(S.data.debts, id)); else if (kind === 'meses') formInstallment(byId(S.data.installments, id)); else formTx(byId(S.data.transactions, id)); }));
  // leyenda ↔ donut
  app.querySelectorAll('.legend .l').forEach(l => { const key = l.dataset.key; const wrap = l.closest('.donutwrap'); l.addEventListener('mouseenter', () => { wrap.querySelectorAll('.donut path').forEach(p => p.style.opacity = p.dataset.key === key ? 1 : .25); wrap.querySelectorAll('.legend .l').forEach(x => x.classList.toggle('dim', x !== l)); }); l.addEventListener('mouseleave', () => { wrap.querySelectorAll('.donut path').forEach(p => p.style.opacity = 1); wrap.querySelectorAll('.legend .l').forEach(x => x.classList.remove('dim')); }); });
  document.title = `${v.title} · Raw Money`;
  window.scrollTo(0, S._keepScroll ? scrollY : 0); S._keepScroll = false;
}

function route() { const h = location.hash.replace('#', '') || 'inicio'; if (VIEWS[h]) { if (h !== S.view) S.filters = h === 'movimientos' ? S.filters : {}; S.view = h; } else S.view = 'inicio'; closeDrawer(); render(); }
function init() {
  applyTheme();
  const loaded = loadData(); S.data = loaded && !(loaded.demo && !window.START_DEMO) ? loaded : (window.START_DEMO ? demoData() : emptyData()); saveData();
  S.month = thisMonth();
  S.locked = !isUnlocked();
  window.addEventListener('hashchange', route);
  route();
  if (typeof initCloud === 'function') initCloud().then(() => { S.locked = !isUnlocked(); render(); });
}
document.addEventListener('DOMContentLoaded', init);
