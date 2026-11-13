# Raw Money · paso a paso

Dos guías: cómo publicar la app (GitHub + Vercel + Supabase) y cómo cambiar la contraseña.

## Las tres piezas

| Servicio | Para qué sirve | Estado |
|---|---|---|
| **GitHub** | Guarda el código de la app. | Repositorio `watashi-raw/rawmoney` ya conectado a esta carpeta. |
| **Vercel** | Publica la app en una dirección web y la actualiza sola con cada cambio que subes a GitHub. | Falta conectarlo (paso 2). |
| **Supabase** | Guarda tus datos y tu contraseña en la nube, para que la app sea la misma en la compu y en el celular. | Proyecto `rawmoney` ya creado y conectado en `js/config.js`. Falta decirle tu dirección de Vercel (paso 3). |

El orden es: **GitHub → Vercel → Supabase**.

### Revisar que Supabase esté listo

1. Entra a **supabase.com/dashboard** → proyecto **rawmoney**.
2. **Table Editor**: debe existir la tabla `finanzas_state`. Si no aparece, ve a **SQL Editor** → New query → pega todo el contenido de `supabase-setup.sql` → Run.
3. **Authentication → Users**: debe aparecer `tashisnothere@gmail.com`. Si no aparece, toca **Add user**, escribe ese correo y la contraseña que quieras, y marca **Auto confirm user**.
4. **Project Settings → API**: la *Project URL* y la *publishable key* deben coincidir con las de `js/config.js`. Ya coinciden; esto solo hace falta revisarlo si algún día creas otro proyecto.

---

## 1. Publicar en Vercel

Vercel toma el código de GitHub y lo publica en una dirección web. Cada vez que subes cambios a GitHub, Vercel actualiza la página sola.

### Paso 1 · Guardar los cambios y subirlos a GitHub

El código ya está conectado al repositorio `watashi-raw/rawmoney`. Abre la Terminal y pega esto:

```bash
cd "/Volumes/PortableSSD/clauderaw/RAW MONEY"
python3 build.py
git add -A
git commit -m "Rediseño Pantone"
git push -u origin main
```

- Si GitHub te pide usuario y contraseña, la "contraseña" es un **token**. Créalo en github.com → tu foto → Settings → Developer settings → Personal access tokens → Generate new token (marca el permiso `repo`). Pégalo cuando te lo pida.
- Si prefieres no usar la Terminal, abre **GitHub Desktop** → File → Add local repository → elige la carpeta `RAW MONEY` → escribe un mensaje abajo a la izquierda → Commit to main → Push origin.
- Si el repositorio `rawmoney` todavía no existe en tu GitHub, créalo primero en github.com/new, como **privado** y sin README.

### Paso 2 · Conectar el repositorio con Vercel (solo la primera vez)

1. Entra a **vercel.com/new** e inicia sesión con tu cuenta de GitHub.
2. En "Import Git Repository" elige **rawmoney** → Import.
3. Configura así:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (déjalo como viene)
   - **Build Command:** vacío
   - **Output Directory:** vacío
4. Toca **Deploy** y espera a que termine (menos de un minuto).
5. Vercel te da una dirección tipo `https://rawmoney-xxxx.vercel.app`. Cópiala: la necesitas en el paso 3.

### Paso 3 · Avisarle a Supabase cuál es tu dirección (solo la primera vez)

Sin este paso, el correo de "recuperar contraseña" te mandaría a un lugar equivocado.

1. Entra a **supabase.com/dashboard** → proyecto **rawmoney**.
2. Menú izquierdo: **Authentication** → **URL Configuration**.
3. En **Site URL** pega tu dirección de Vercel, por ejemplo `https://rawmoney-xxxx.vercel.app`.
4. En **Redirect URLs** toca Add URL y pega la misma dirección terminada en `/**`, por ejemplo `https://rawmoney-xxxx.vercel.app/**`.
5. Save.

### Paso 4 · Probar

Abre tu dirección de Vercel. Te pide la contraseña de tu cuenta de Supabase (`tashisnothere@gmail.com`). Al entrar, tus datos se traen de la nube.

### Cada vez que cambies algo después

```bash
cd "/Volumes/PortableSSD/clauderaw/RAW MONEY"
python3 build.py
git add -A
git commit -m "describe el cambio"
git push
```

Vercel se actualiza solo en uno o dos minutos. Puedes ver el avance en vercel.com → rawmoney → Deployments.

### Opcional · Usar tu propio dominio

En vercel.com → rawmoney → Settings → Domains → Add, escribe tu dominio y sigue las instrucciones de DNS que te da Vercel. Después repite el paso 3 con el dominio nuevo.

> Nota: la carpeta `dist/` también se publica. La versión de prueba quedaría en `tu-direccion/dist/prueba` (sin contraseña, pero solo con datos de ejemplo, nunca los tuyos). Si no quieres que se vea, borra `dist/prueba.html` antes de subir los cambios o pídeme que la saque de la publicación.

---

## 2. Cambiar la contraseña

### Si sabes tu contraseña actual

1. Entra a Raw Money con tu contraseña.
2. Ve a **Cuentas y ajustes** (en el celular: Más → Cuentas y ajustes).
3. En la tarjeta **Nube**, toca **Cambiar contraseña**.
4. Escribe la nueva dos veces (mínimo 8 caracteres) → **Guardar contraseña**.

El cambio vale en todos tus dispositivos, porque la contraseña vive en Supabase.

### Si la olvidaste

1. Entra a **supabase.com/dashboard** → proyecto **rawmoney** → **Authentication** → **Users**.
2. Busca `tashisnothere@gmail.com`, toca los tres puntitos de su fila → **Send password recovery**.
3. Te llega un correo. Abre el enlace: te lleva a Raw Money y se abre solo el formulario **Nueva contraseña**.
4. Escribe la nueva dos veces → **Guardar contraseña**.

Esto solo funciona si ya hiciste el paso 3 de la guía de Vercel. Si no, el enlace del correo no sabe a dónde llevarte.

### Si usas Raw Money sin la nube

Si algún día dejas vacío `js/config.js` (sin Supabase), la contraseña se guarda solo en ese navegador. Se cambia en **Cuentas y ajustes → Sesión → Cambiar contraseña** (mínimo 6 caracteres). Ahí la contraseña solo bloquea la entrada a la app: tus datos no quedan cifrados.

La versión de prueba (`dist/prueba.html`) no pide contraseña.
