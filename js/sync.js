/* ===== Raw Money · sincronización con Supabase (opcional) =====
   Una fila por usuario en la tabla finanzas_state (user_id, data jsonb, updated_at).
   localStorage sigue siendo la copia de trabajo; la nube es respaldo + sincronización. */
const CLOUD = { client: null, user: null, ready: false, saving: false, lastError: '', enabled: false };
function cloudEnabled() { return !!(window.SUPABASE && window.SUPABASE.url && window.SUPABASE.anonKey && window.supabase); }

async function initCloud() {
  CLOUD.enabled = cloudEnabled();
  if (!CLOUD.enabled) return;
  CLOUD.client = window.supabase.createClient(window.SUPABASE.url, window.SUPABASE.anonKey);
  const { data: { session } } = await CLOUD.client.auth.getSession();
  CLOUD.user = session ? session.user : null;
  CLOUD.client.auth.onAuthStateChange(async (event, sess) => {
    if (event === 'PASSWORD_RECOVERY') { CLOUD.user = sess ? sess.user : CLOUD.user; formNewPassword(); return; }
    const was = CLOUD.user && CLOUD.user.id; CLOUD.user = sess ? sess.user : null;
    if (CLOUD.user && CLOUD.user.id !== was) { await cloudPull(); S.locked = false; render(); }
    if (!CLOUD.user && was) { S.locked = true; render(); }
  });
  if (CLOUD.user) { await cloudPull(); }
  CLOUD.ready = true;
}

/* Trae la fila del usuario. Si no existe y hay datos locales, los sube. */
async function cloudPull() {
  if (!CLOUD.client || !CLOUD.user) return;
  const { data, error } = await CLOUD.client.from('finanzas_state').select('data, updated_at').eq('user_id', CLOUD.user.id).maybeSingle();
  if (error) { CLOUD.lastError = error.message; return; }
  if (S.data.demo) { S.data = emptyData(); try { localStorage.setItem(DB_KEY, JSON.stringify(S.data)); } catch (e) {} }
  if (data && data.data && data.data.version === 1) {
    if (data.data.demo) { // si alguna vez se subió la demo, se limpia la nube
      S.data = emptyData(); try { localStorage.setItem(DB_KEY, JSON.stringify(S.data)); } catch (e) {} await cloudPush(); return;
    }
    const remoteTx = (data.data.transactions || []).length; const localTx = (S.data.transactions || []).length;
    // La nube manda, salvo que la nube esté vacía y aquí haya datos reales.
    if (remoteTx > 0 || localTx === 0) { S.data = { ...emptyData(), ...data.data }; try { localStorage.setItem(DB_KEY, JSON.stringify(S.data)); } catch (e) {} }
    else await cloudPush();
  } else if (S.data.transactions.length || S.data.cards.length || S.data.accounts.length) {
    await cloudPush();
  }
}

let cloudT;
function cloudSave() { if (!CLOUD.client || !CLOUD.user) return; clearTimeout(cloudT); cloudT = setTimeout(cloudPush, 900); }
async function cloudPush() {
  if (!CLOUD.client || !CLOUD.user) return;
  if (S.data.demo) { toast('Los datos demo no se guardan en la nube'); return; }
  CLOUD.saving = true; setCloudDot();
  const { error } = await CLOUD.client.from('finanzas_state').upsert({ user_id: CLOUD.user.id, data: S.data, updated_at: new Date().toISOString() });
  CLOUD.saving = false; CLOUD.lastError = error ? error.message : ''; setCloudDot();
  if (error) toast('No se pudo guardar en la nube');
}
function setCloudDot() { const el = document.querySelector('.cloud-dot'); if (!el) return; el.className = 'cloud-dot ' + (CLOUD.lastError ? 'err' : CLOUD.saving ? 'busy' : CLOUD.user ? 'on' : ''); el.title = CLOUD.lastError || (CLOUD.saving ? 'Guardando…' : CLOUD.user ? 'Sincronizado' : 'Sin sesión'); }

async function cloudSignIn(email) {
  if (!CLOUD.client) return;
  const { error } = await CLOUD.client.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) toast(error.message); else toast('Te enviamos un enlace a tu correo');
}
async function cloudSignInPassword(email, password) {
  if (!CLOUD.client) return;
  if (!email || !password) { toast('Escribe correo y contraseña'); return; }
  const { error } = await CLOUD.client.auth.signInWithPassword({ email, password });
  if (error) toast(/invalid/i.test(error.message) ? 'Correo o contraseña incorrectos' : error.message);
}
async function cloudSignUp(email, password) {
  if (!CLOUD.client) return;
  if (!email || password.length < 8) { toast('La contraseña debe tener al menos 8 caracteres'); return; }
  const { data, error } = await CLOUD.client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) { toast(error.message); return; }
  if (data.session) toast('Cuenta creada'); else toast('Cuenta creada: confirma tu correo con el enlace que te enviamos');
}
async function cloudReset(email) {
  if (!CLOUD.client) return;
  if (!email) { toast('Escribe tu correo'); return; }
  const { error } = await CLOUD.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) toast(error.message); else toast('Te enviamos un enlace para cambiar la contraseña');
}
function formNewPassword() {
  const dr = openDrawer({ title: 'Nueva contraseña', eyebrow: 'Recuperar acceso', body: `${F.text('pw1', 'Nueva contraseña (mínimo 8 caracteres)', '', '', 'type="password" autocomplete="new-password" required')}${F.text('pw2', 'Repite la contraseña', '', '', 'type="password" autocomplete="new-password" required')}`, saveLabel: 'Guardar contraseña',
    onSave: async (o, f) => { if (o.pw1.length < 8) { toast('Mínimo 8 caracteres'); return; } if (o.pw1 !== o.pw2) { toast('Las contraseñas no coinciden'); return; } const { error } = await CLOUD.client.auth.updateUser({ password: o.pw1 }); if (error) { toast(error.message); return; } closeDrawer(); render(); toast('Contraseña actualizada'); } });
  return dr;
}
async function cloudSignOut() { if (!CLOUD.client) return; await CLOUD.client.auth.signOut(); CLOUD.user = null; S.locked = true; render(); }

/* Tarjeta "Nube" para Cuentas y ajustes */
function cloudCardHTML() {
  if (!CLOUD.enabled) return `<div class="card"><div class="ch"><h2>Sesión</h2></div><div class="chips"><button class="btn secondary sm" id="local-pw">Cambiar contraseña</button><button class="btn quiet sm" data-act="lock">Cerrar sesión</button></div></div>`;
  if (CLOUD.user) return `<div class="card"><div class="ch"><h2>Nube</h2><span class="tag good">${esc(CLOUD.user.email)}</span></div>${CLOUD.lastError ? `<p class="neg" style="font-size:13px">${esc(CLOUD.lastError)}</p>` : ''}<div class="chips"><button class="btn secondary sm" id="cloud-pull">Traer de la nube</button><button class="btn secondary sm" id="cloud-push">Subir ahora</button><button class="btn secondary sm" id="cloud-pw">Cambiar contraseña</button><button class="btn quiet sm" id="cloud-out">Cerrar sesión</button></div></div>`;
  return '';
}
function bindCloudCard(root) {
  const lp = root.querySelector('#local-pw'); if (lp) lp.addEventListener('click', formLocalPassword);
  const o = root.querySelector('#cloud-out'); if (o) o.addEventListener('click', cloudSignOut);
  const pwb = root.querySelector('#cloud-pw'); if (pwb) pwb.addEventListener('click', formNewPassword);
  const pl = root.querySelector('#cloud-pull'); if (pl) pl.addEventListener('click', async () => { await cloudPull(); render(); toast('Datos traídos de la nube'); });
  const ps = root.querySelector('#cloud-push'); if (ps) ps.addEventListener('click', async () => { await cloudPush(); toast('Subido'); });
}
