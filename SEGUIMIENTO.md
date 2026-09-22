# Seguimiento · GitHub + Vercel + Supabase

Todo lo que se podía dejar listo ya está en esta carpeta: repo git con su primer commit, `vercel.json`, `supabase-setup.sql`, `js/config.js` (vacío) y la capa de sincronización `js/sync.js`. Lo que sigue son pasos que dependen de tus cuentas.

## 1. GitHub (5 min)
1. Entra a https://github.com/new y crea un repo **privado** llamado `rawmoney` (sin README, sin .gitignore: ya existen aquí).
2. En la terminal, dentro de esta carpeta:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/rawmoney.git
   git branch -M main
   git push -u origin main
   ```
   GitHub te pedirá usuario y un *personal access token* como contraseña (Settings → Developer settings → Tokens). Si usas GitHub Desktop, también puedes "Add existing repository" apuntando a esta carpeta y publicarlo desde ahí.

## 2. Vercel (5 min)
Opción A · desde la web (recomendada, se redepliega solo con cada push):
1. https://vercel.com/new → Import Git Repository → elige `rawmoney`.
2. Framework preset: **Other**. Build command: vacío. Output directory: vacío (la raíz ya es estática).
3. Deploy. Tu app queda en `https://rawmoney-xxxx.vercel.app`. Puedes poner tu dominio en Settings → Domains.

Opción B · desde la terminal (Vercel CLI ya está instalado):
```bash
vercel login
```
```bash
vercel --prod
```
Responde "Other" al framework y deja build/output vacíos.

Nota: en Vercel se sirve `index.html` de la raíz con sus carpetas `css/` y `js/`. El archivo `dist/index.html` es solo para hostings que quieren un único archivo.

## 3. Supabase (10 min)
1. https://supabase.com/dashboard → New project (nombre `rawmoney`, región cercana, guarda la contraseña de la base).
2. SQL Editor → New query → pega el contenido de `supabase-setup.sql` → Run. Crea la tabla `finanzas_state` con políticas RLS: cada usuario solo ve su fila.
3. Authentication → Providers → **Email**: activado. Luego Authentication → Users → **Add user** → escribe `tashisnothere@gmail.com` y la contraseña que quieras, marca "Auto confirm user". Esa es la cuenta con la que entras en la portada de la app (correo + contraseña, nada más). En Authentication → URL Configuration pon como Site URL tu dominio de Vercel y agrégalo en Redirect URLs (por ejemplo `https://rawmoney-xxxx.vercel.app/**`) para que funcione "Olvidé mi contraseña".
4. Project Settings → API: copia **Project URL** y la clave **anon public** (o la *publishable key*).
5. Pega ambas en `js/config.js`:
   ```js
   window.SUPABASE = { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' };
   ```
6. Regenera y sube:
   ```bash
   python3 build.py && git add -A && git commit -m "Activar nube" && git push
   ```
   Vercel redepliega solo. Abre la app → Cuentas y ajustes → Nube → escribe tu correo → abre el enlace que te llega. Desde ese momento cada cambio se guarda en Supabase y aparece en cualquier dispositivo donde inicies sesión.

### Sin Supabase
La portada solo pide correo y contraseña. Sin Supabase, la primera contraseña que escribas queda guardada (cifrada) en ese navegador y desde entonces es la que se pide; se cambia en Cuentas y ajustes → Sesión. Es un candado de privacidad, no cifra los datos.

### Cómo se comporta la sincronización
- La app arranca vacía. Los datos demo solo aparecen si los cargas desde Cuentas y ajustes → Cargar datos demo, y nunca se suben a la nube.
- Al iniciar sesión, si la nube tiene datos, mandan los de la nube. Si la nube está vacía y aquí hay datos reales (no demo), se suben.
- Cada guardado local se sube 1 segundo después (`cloudSave` en `js/sync.js`). El punto en la barra lateral indica: verde sincronizado, ámbar guardando, rojo error.
- Botones "Traer de la nube" y "Subir ahora" en la tarjeta Nube por si quieres forzar.
- La clave anon es pública por diseño. Lo que protege tus finanzas son las políticas RLS del SQL: sin sesión no se puede leer ni escribir nada.

## 4. Después de cada cambio en el código
```bash
python3 build.py && git add -A && git commit -m "describe el cambio" && git push
```
El artifact de claude.ai no se actualiza solo: hay que republicar `dist/artifact.html` (sin Supabase, funciona solo local).
