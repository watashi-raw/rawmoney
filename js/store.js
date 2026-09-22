/* ===== Raw Money · datos, defaults y demo ===== */
const DB_KEY = 'midinero.v1';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const monthOf = iso => iso.slice(0, 7);
const thisMonth = () => monthOf(todayISO());
const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; };
const daysIn = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
const monthEnd = ym => `${ym}-${pad(daysIn(ym))}`;
const clampDay = (ym, d) => `${ym}-${pad(Math.min(d, daysIn(ym)))}`;
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_C = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const monthLabel = ym => { const [y, m] = ym.split('-').map(Number); return `${MESES[m-1]} ${y}`; };
const monthShort = ym => { const [y, m] = ym.split('-').map(Number); return `${MESES_C[m-1]} ${String(y).slice(2)}`; };
const dateLabel = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MESES_C[m-1]}`; };
const dateLong = iso => { const [y, m, d] = iso.split('-').map(Number); const wd = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][new Date(y, m-1, d).getDay()]; return `${wd} ${d} de ${MESES[m-1]}`; };
const fmtMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const fmtMXN2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = n => (Math.abs(n) % 1 > 0.004 ? fmtMXN2 : fmtMXN).format(n || 0);
const money0 = n => fmtMXN.format(Math.round(n || 0));
const pct = n => `${Math.round(n)}%`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TYPES = { ingreso: 'Ingreso', gasto: 'Gasto', transferencia: 'Transferencia', pago_deuda: 'Pago de deuda', pago_tarjeta: 'Pago de tarjeta', ahorro: 'Ahorro' };
const METHODS = { efectivo: 'Efectivo', debito: 'Débito', credito: 'Crédito', transferencia: 'Transferencia', otro: 'Otro' };
const FREQ = { mensual: 'Mensual', quincenal: 'Quincenal', semanal: 'Semanal', bimestral: 'Bimestral', anual: 'Anual' };

/* Paleta de categorías (validada para gráficos: los 6 primeros tonos + gris "Otros") */
const CAT_COLORS = ['#AE86CF', '#6DB27C', '#8AA6E3', '#C9A247', '#D87484', '#5DB3A4', '#C88AB0', '#D0876F', '#7F93C4', '#CFA07C', '#B98CA0', '#A9B27A', '#8F8F96'];
const OTHERS_COLOR = '#8F8F96';
/* Tema oscuro por defecto; en claro se oscurecen los colores de categoría para que contrasten sobre superficie clara. */
const isLightTheme = () => document.documentElement.dataset.theme === 'light' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: light)').matches);
const col = hex => { if (!isLightTheme() || !/^#[0-9a-f]{6}$/i.test(hex)) return hex; const n = parseInt(hex.slice(1), 16); const f = v => Math.round(v * 0.68).toString(16).padStart(2, '0'); return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`; };
/* Textura ASCII decorativa (determinista) */
function asciiArt(cols = 46, rows = 15, seed = 7) { let x = seed; const rnd = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; const chars = ' .:-=+*#%@'; let out = ''; for (let r = 0; r < rows; r++) { let line = ''; for (let c = 0; c < cols; c++) { const dx = (c - cols * .55) / (cols * .45), dy = (r - rows * .5) / (rows * .5); const d = Math.sqrt(dx * dx + dy * dy); const v = Math.max(0, 1 - d) * (0.55 + rnd() * .7); line += chars[Math.min(chars.length - 1, Math.floor(v * chars.length))]; } out += line + '\n'; } return out; }

const ICONS = {
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M2 3h3l2.5 11h11L21 7H6"/>',
  car: '<path d="M5 17h14"/><path d="M3 12l2-6h14l2 6v5H3z"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/>',
  heart: '<path d="M12 21s-7-4.6-9-9.2C1.6 8 4 5 7.2 5c1.9 0 3.2 1 4.8 3 1.6-2 2.9-3 4.8-3C20 5 22.4 8 21 11.8 19 16.4 12 21 12 21z"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
  bag: '<path d="M6 8h12l1 13H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  plane: '<path d="M2 12l20-8-6 18-3-7z"/><path d="M13 15l9-11"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6 6 2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  paw: '<circle cx="7" cy="9" r="1.7"/><circle cx="17" cy="9" r="1.7"/><circle cx="4.5" cy="14" r="1.5"/><circle cx="19.5" cy="14" r="1.5"/><path d="M12 12c3 0 5 3 5 5.5 0 1.6-1.2 2.5-2.5 2.5-1 0-1.8-.5-2.5-.5s-1.5.5-2.5.5C8.2 20 7 19.1 7 17.5 7 15 9 12 12 12z"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h14v4"/><path d="M3 7v11a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2z"/><circle cx="17" cy="14.5" r="1.3"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 14h18"/><path d="M12 9c-2-4-6-4-6-1.5S10 9 12 9zM12 9c2-4 6-4 6-1.5S14 9 12 9z"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  piggy: '<path d="M5 12a6 6 0 0 1 6-6h4a5 5 0 0 1 5 5v2a4 4 0 0 1-2 3.5V19h-3v-2H9v2H6v-3.2A6 6 0 0 1 5 12z"/><path d="M3 10v4"/><circle cx="16" cy="11" r=".8"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="2.5"/><path d="M3 6v6c0 1.4 2.7 2.5 6 2.5"/><path d="M3 12v6c0 1.4 2.7 2.5 6 2.5"/><ellipse cx="15" cy="13" rx="6" ry="2.5"/><path d="M9 13v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  cup: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M8 3v2M11 3v2M14 3v2"/>',
  tools: '<path d="M14.5 5.5a4 4 0 0 0 5 5L9 21l-3-3z"/><path d="M3 6l3-3 3 3-3 3z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 15a5 5 0 0 1 6 5"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M13 2v9h9a9 9 0 0 0-9-9z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  flag: '<path d="M4 22V3"/><path d="M4 4h12l-2 4 2 4H4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  swap: '<path d="M7 4v16M7 4 3 8M7 4l4 4"/><path d="M17 20V4M17 20l4-4M17 20l-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 9v5M12 17h.01"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  home2: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
  more: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
  download: '<path d="M12 3v12M6 9l6 6 6-6"/><path d="M4 21h16"/>',
  upload: '<path d="M12 21V9M6 15l6-6 6 6"/><path d="M4 3h16"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
  trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
};
const CAT_ICON_KEYS = ['home','cart','car','heart','play','bag','bolt','repeat','book','plane','sparkle','paw','dots','wallet','briefcase','gift','phone','cup','tools','users','shield','coins','piggy','card'];
const icon = (k, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.dots}</svg>`;

function defaultCategories() {
  const g = [
    ['vivienda', 'Vivienda', 'home', 0], ['alimentacion', 'Alimentación', 'cart', 1], ['transporte', 'Transporte', 'car', 2],
    ['salud', 'Salud', 'heart', 7], ['entretenimiento', 'Entretenimiento', 'play', 3], ['compras', 'Compras', 'bag', 4],
    ['servicios', 'Servicios', 'bolt', 5], ['suscripciones', 'Suscripciones', 'repeat', 6], ['educacion', 'Educación', 'book', 8],
    ['viajes', 'Viajes', 'plane', 9], ['cuidado', 'Cuidado personal', 'sparkle', 10], ['mascotas', 'Mascotas', 'paw', 11], ['otros', 'Otros', 'dots', 12],
  ].map(([id, name, ic, ci]) => ({ id, name, icon: ic, color: CAT_COLORS[ci], kind: 'gasto' }));
  const i = [
    ['sueldo', 'Sueldo', 'briefcase', 1], ['negocio', 'Negocio / freelance', 'wallet', 5], ['otros_ing', 'Otros ingresos', 'gift', 6],
  ].map(([id, name, ic, ci]) => ({ id, name, icon: ic, color: CAT_COLORS[ci], kind: 'ingreso' }));
  return [...g, ...i];
}

function emptyData() {
  return { version: 1, demo: false, categories: defaultCategories(), accounts: [], cards: [], debts: [], installments: [], recurring: [], transactions: [], budgets: {}, skips: [], savingsGoal: 0 };
}

/* ---------- Demo (MXN, realista, 4 meses) ---------- */
function demoData() {
  const d = emptyData();
  d.demo = true;
  d.accounts = [
    { id: 'acc_bbva', name: 'BBVA Débito', type: 'debito', institution: 'BBVA', opening: 9800 },
    { id: 'acc_cash', name: 'Efectivo', type: 'efectivo', institution: '', opening: 1200 },
  ];
  d.cards = [
    { id: 'cc_bbva', name: 'BBVA Azul', institution: 'BBVA', limit: 35000, opening: 800, cutDay: 12, payDay: 2, minPct: 5, rate: 42.9, color: '#8A3B75' },
    { id: 'cc_nu', name: 'Nu Morada', institution: 'Nu', limit: 12000, opening: 0, cutDay: 20, payDay: 10, minPct: 5, rate: 79, color: '#3F7FBF' },
  ];
  d.debts = [
    { id: 'dt_auto', name: 'Crédito del auto', creditor: 'Santander', original: 180000, initial: 96000, monthly: 4200, payDay: 15, rate: 13.5, start: '2026-06' },
    { id: 'dt_mama', name: 'Préstamo familiar', creditor: 'Mamá', original: 30000, initial: 18000, monthly: 2000, payDay: 28, rate: 0, start: '2026-06' },
  ];
  d.installments = [
    { id: 'in_laptop', desc: 'Laptop MacBook Air', total: 18000, months: 12, start: '2026-03', cardId: 'cc_bbva', categoryId: 'compras' },
    { id: 'in_cel', desc: 'Celular', total: 9600, months: 6, start: '2026-07', cardId: 'cc_nu', categoryId: 'compras' },
  ];
  d.recurring = [
    { id: 'rc_renta', name: 'Renta', amount: 6000, freq: 'mensual', day: 1, categoryId: 'vivienda', method: 'transferencia', accountId: 'acc_bbva', start: '2026-01', active: true },
    { id: 'rc_internet', name: 'Internet Totalplay', amount: 599, freq: 'mensual', day: 8, categoryId: 'servicios', method: 'debito', accountId: 'acc_bbva', start: '2026-01', active: true },
    { id: 'rc_tel', name: 'Teléfono Telcel', amount: 399, freq: 'mensual', day: 18, categoryId: 'servicios', method: 'credito', accountId: 'cc_nu', start: '2026-01', active: true },
    { id: 'rc_netflix', name: 'Netflix', amount: 219, freq: 'mensual', day: 5, categoryId: 'suscripciones', method: 'credito', accountId: 'cc_bbva', start: '2026-01', active: true },
    { id: 'rc_spotify', name: 'Spotify', amount: 129, freq: 'mensual', day: 11, categoryId: 'suscripciones', method: 'credito', accountId: 'cc_bbva', start: '2026-01', active: true },
    { id: 'rc_gym', name: 'Gimnasio', amount: 650, freq: 'mensual', day: 3, categoryId: 'salud', method: 'debito', accountId: 'acc_bbva', start: '2026-01', active: true },
    { id: 'rc_luz', name: 'Luz CFE', amount: 780, freq: 'bimestral', day: 22, categoryId: 'servicios', method: 'debito', accountId: 'acc_bbva', start: '2026-02', active: true },
    { id: 'rc_icloud', name: 'iCloud', amount: 49, freq: 'mensual', day: 14, categoryId: 'suscripciones', method: 'credito', accountId: 'cc_nu', start: '2026-01', active: true },
  ];
  d.budgets = { alimentacion: 5000, transporte: 2500, entretenimiento: 1500, compras: 2500, salud: 1200, cuidado: 800, vivienda: 6500, servicios: 2200, suscripciones: 450 };
  d.savingsGoal = 3000;

  const T = [];
  const tx = (date, desc, amount, type, categoryId, method, accountId, extra = {}) => T.push({ id: uid(), date, desc, amount, type, categoryId, method, accountId, fixed: false, notes: '', ...extra });
  const months = ['2026-06', '2026-07', '2026-08', '2026-09'];
  const varSpend = {
    '2026-06': { alimentacion: [[2, 'Súper Chedraui', 1380, 'debito', 'acc_bbva'], [6, 'Comida con amigos', 420, 'credito', 'cc_bbva'], [9, 'Mercado', 560, 'efectivo', 'acc_cash'], [13, 'Súper Walmart', 1150, 'credito', 'cc_bbva'], [17, 'Cafetería', 185, 'efectivo', 'acc_cash'], [22, 'Súper', 980, 'debito', 'acc_bbva'], [27, 'Rappi cena', 310, 'credito', 'cc_nu']],
      transporte: [[3, 'Gasolina', 900, 'credito', 'cc_bbva'], [12, 'Uber', 165, 'credito', 'cc_nu'], [19, 'Gasolina', 850, 'credito', 'cc_bbva'], [25, 'Estacionamiento', 120, 'efectivo', 'acc_cash']],
      entretenimiento: [[7, 'Cine', 380, 'credito', 'cc_nu'], [21, 'Concierto', 950, 'credito', 'cc_bbva']],
      compras: [[10, 'Ropa Zara', 1290, 'credito', 'cc_bbva'], [24, 'Amazon', 640, 'credito', 'cc_nu']],
      salud: [[15, 'Farmacia', 320, 'debito', 'acc_bbva']],
      cuidado: [[8, 'Corte de cabello', 350, 'efectivo', 'acc_cash']],
      mascotas: [[16, 'Croquetas', 690, 'debito', 'acc_bbva']] },
    '2026-07': { alimentacion: [[1, 'Súper Chedraui', 1420, 'debito', 'acc_bbva'], [5, 'Tacos', 260, 'efectivo', 'acc_cash'], [8, 'Súper Walmart', 1230, 'credito', 'cc_bbva'], [12, 'Rappi', 345, 'credito', 'cc_nu'], [16, 'Mercado', 610, 'efectivo', 'acc_cash'], [20, 'Restaurante', 580, 'credito', 'cc_bbva'], [26, 'Súper', 1010, 'debito', 'acc_bbva'], [29, 'Cafetería', 210, 'efectivo', 'acc_cash']],
      transporte: [[2, 'Gasolina', 920, 'credito', 'cc_bbva'], [11, 'Uber', 240, 'credito', 'cc_nu'], [18, 'Gasolina', 880, 'credito', 'cc_bbva'], [23, 'Verificación', 650, 'debito', 'acc_bbva']],
      entretenimiento: [[6, 'Cine', 420, 'credito', 'cc_nu'], [19, 'Boliche', 520, 'credito', 'cc_nu']],
      compras: [[14, 'Tenis Nike', 1600, 'credito', 'cc_bbva'], [27, 'Mercado Libre', 480, 'credito', 'cc_nu']],
      salud: [[9, 'Dentista', 1200, 'debito', 'acc_bbva']],
      cuidado: [[13, 'Skincare', 540, 'credito', 'cc_nu']],
      viajes: [[25, 'Hotel Valle de Bravo', 1800, 'credito', 'cc_bbva']],
      mascotas: [[17, 'Veterinario', 850, 'debito', 'acc_bbva']] },
    '2026-08': { alimentacion: [[2, 'Súper Chedraui', 1210, 'debito', 'acc_bbva'], [4, 'Comida oficina', 190, 'efectivo', 'acc_cash'], [9, 'Súper Walmart', 1340, 'credito', 'cc_bbva'], [13, 'Rappi', 290, 'credito', 'cc_nu'], [15, 'Mercado', 580, 'efectivo', 'acc_cash'], [21, 'Restaurante cumpleaños', 1450, 'credito', 'cc_bbva'], [24, 'Súper', 790, 'debito', 'acc_bbva'], [30, 'Cafetería', 230, 'efectivo', 'acc_cash']],
      transporte: [[3, 'Gasolina', 950, 'credito', 'cc_bbva'], [10, 'Uber', 310, 'credito', 'cc_nu'], [17, 'Gasolina', 900, 'credito', 'cc_bbva'], [28, 'Estacionamiento', 140, 'efectivo', 'acc_cash']],
      entretenimiento: [[8, 'Cine', 400, 'credito', 'cc_nu'], [16, 'Videojuego', 690, 'credito', 'cc_nu'], [23, 'Bar', 680, 'credito', 'cc_bbva']],
      compras: [[12, 'Amazon', 890, 'credito', 'cc_nu'], [26, 'Ropa', 1150, 'credito', 'cc_bbva']],
      salud: [[19, 'Farmacia', 410, 'debito', 'acc_bbva']],
      cuidado: [[6, 'Corte de cabello', 350, 'efectivo', 'acc_cash'], [20, 'Skincare', 480, 'credito', 'cc_nu']],
      educacion: [[11, 'Curso online', 1499, 'credito', 'cc_bbva']],
      mascotas: [[14, 'Croquetas', 720, 'debito', 'acc_bbva']] },
    '2026-09': { alimentacion: [[1, 'Súper Chedraui', 1480, 'debito', 'acc_bbva'], [4, 'Tacos', 240, 'efectivo', 'acc_cash'], [7, 'Súper Walmart', 1290, 'credito', 'cc_bbva'], [10, 'Rappi', 360, 'credito', 'cc_nu'], [14, 'Mercado', 620, 'efectivo', 'acc_cash'], [18, 'Restaurante', 860, 'credito', 'cc_bbva'], [20, 'Cafetería', 175, 'efectivo', 'acc_cash']],
      transporte: [[2, 'Gasolina', 940, 'credito', 'cc_bbva'], [9, 'Uber', 220, 'credito', 'cc_nu'], [16, 'Gasolina', 910, 'credito', 'cc_bbva']],
      entretenimiento: [[6, 'Cine', 420, 'credito', 'cc_nu'], [13, 'Concierto', 1300, 'credito', 'cc_bbva']],
      compras: [[11, 'Amazon', 760, 'credito', 'cc_nu'], [19, 'Librería', 520, 'credito', 'cc_bbva']],
      salud: [[8, 'Farmacia', 290, 'debito', 'acc_bbva']],
      cuidado: [[5, 'Corte de cabello', 350, 'efectivo', 'acc_cash']],
      mascotas: [[12, 'Croquetas', 720, 'debito', 'acc_bbva']] },
  };
  const income = { '2026-06': [[1, 'Sueldo 1ra quincena', 15000], [15, 'Sueldo 2da quincena', 15000], [20, 'Proyecto freelance', 3500, 'negocio']], '2026-07': [[1, 'Sueldo 1ra quincena', 15000], [15, 'Sueldo 2da quincena', 15000]], '2026-08': [[1, 'Sueldo 1ra quincena', 15000], [15, 'Sueldo 2da quincena', 15000], [22, 'Diseño de logo', 4500, 'negocio']], '2026-09': [[1, 'Sueldo 1ra quincena', 15000], [15, 'Sueldo 2da quincena', 15000], [12, 'Venta bici', 2500, 'otros_ing']] };
  months.forEach(m => {
    income[m].forEach(([day, desc, amt, cat]) => tx(clampDay(m, day), desc, amt, 'ingreso', cat || 'sueldo', 'transferencia', 'acc_bbva'));
    Object.entries(varSpend[m]).forEach(([cat, list]) => list.forEach(([day, desc, amt, method, acc]) => tx(clampDay(m, day), desc, amt, 'gasto', cat, method, acc)));
    // pagos de tarjeta, deudas y ahorro
    const past = m !== '2026-09';
    tx(clampDay(m, 2), 'Pago BBVA Azul', m === '2026-06' ? 5300 : m === '2026-07' ? 7400 : m === '2026-08' ? 8850 : 9800, 'pago_tarjeta', null, 'transferencia', 'acc_bbva', { targetId: 'cc_bbva' });
    if (m !== '2026-06') tx(clampDay(m, 10), 'Pago Nu', m === '2026-07' ? 1950 : m === '2026-08' ? 4600 : 5100, 'pago_tarjeta', null, 'transferencia', 'acc_bbva', { targetId: 'cc_nu' });
    tx(clampDay(m, 15), 'Mensualidad auto', 4200, 'pago_deuda', null, 'transferencia', 'acc_bbva', { targetId: 'dt_auto' });
    if (past) tx(clampDay(m, 28), 'Abono préstamo mamá', 2000, 'pago_deuda', null, 'transferencia', 'acc_bbva', { targetId: 'dt_mama' });
    tx(clampDay(m, 16), 'Ahorro quincenal', m === '2026-06' ? 2000 : m === '2026-07' ? 1500 : m === '2026-08' ? 1000 : 1500, 'ahorro', null, 'transferencia', 'acc_bbva');
    if (past) tx(clampDay(m, 3), 'Ahorro inicio de mes', 1000, 'ahorro', null, 'transferencia', 'acc_bbva');
    tx(clampDay(m, 6), 'Retiro cajero', 2000, 'transferencia', null, 'transferencia', 'acc_bbva', { targetId: 'acc_cash' });
    if (past) tx(clampDay(m, 20), 'Retiro cajero', 1500, 'transferencia', null, 'transferencia', 'acc_bbva', { targetId: 'acc_cash' });
  });
  d.transactions = T;
  return d;
}

/* ---------- Estado global ---------- */
const S = { data: null, month: thisMonth(), view: 'inicio', filters: {}, histA: null, histB: null };
function loadData() { try { const raw = localStorage.getItem(DB_KEY); if (raw) { const d = JSON.parse(raw); if (d && d.version === 1) return d; } } catch (e) {} return null; }
function saveData() { try { localStorage.setItem(DB_KEY, JSON.stringify(S.data)); } catch (e) {} if (typeof cloudSave === 'function') cloudSave(); }
function byId(list, id) { return (list || []).find(x => x.id === id); }
function cat(id) { return byId(S.data.categories, id) || { id: 'otros', name: 'Sin categoría', icon: 'dots', color: '#9A93A8', kind: 'gasto' }; }
function accountName(id) { const a = byId(S.data.accounts, id) || byId(S.data.cards, id); return a ? a.name : '—'; }
function allAccounts() { return [...S.data.accounts.map(a => ({ ...a, isCard: false })), ...S.data.cards.map(c => ({ ...c, isCard: true }))]; }
