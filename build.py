#!/usr/bin/env python3
"""Genera dist/index.html (un solo archivo, listo para subir a cualquier hosting)
y dist/artifact.html (sin doctype/html/head/body, para publicar como artifact)."""
import pathlib, re
ROOT = pathlib.Path(__file__).parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "css/app.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="css/app.css">', "<style>\n" + css + "\n</style>")
for name in ["config", "store", "calc", "charts", "liquid", "goo", "logo", "views", "whatif", "forms", "plan", "sync", "cover", "mascot", "pet", "app"]:
    js = (ROOT / f"js/{name}.js").read_text(encoding="utf-8")
    if name == "mascot":
        import base64
        js = js.replace("'img/gatito.png'", "'data:image/png;base64," + base64.b64encode((ROOT / "img/gatito.png").read_bytes()).decode() + "'")
    html = html.replace(f'<script src="js/{name}.js"></script>', "<script>\n" + js + "\n</script>")
dist = ROOT / "dist"; dist.mkdir(exist_ok=True)
(dist / "index.html").write_text(html, encoding="utf-8")
SUPA = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>'
skip = {SUPA, '<!DOCTYPE html>', '<html lang="es">', '<head>', '</head>', '<body>', '</body>', '</html>', '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'}
art = "\n".join(l for l in html.split("\n") if l.strip() not in skip)
(dist / "artifact.html").write_text(art, encoding="utf-8")
# Artifact de demostración (arranca con datos de ejemplo); todo lo demás arranca vacío
demo = html.replace('<script>\n/* ===== Raw Money · shell', '<script>window.START_DEMO = true;</script>\n<script>\n/* ===== Raw Money · shell', 1)
assert 'START_DEMO = true' in demo
(dist / "artifact.html").write_text("\n".join(l for l in demo.split("\n") if l.strip() not in skip), encoding="utf-8")
(dist / "index-limpio.html").write_text(html, encoding="utf-8")
(dist / "artifact-limpio.html").write_text(art.replace("<title>Raw Money</title>", "<title>Raw Money Limpio</title>"), encoding="utf-8")
print("ok", len(html) // 1024, "KB")
# Versión de prueba: sin contraseña, sin nube, con datos demo y guardado aparte (no toca tus datos reales)
cfg = (ROOT / "js/config.js").read_text(encoding="utf-8")
prueba = html.replace(cfg, "window.SUPABASE = { url: '', anonKey: '' }; window.START_DEMO = true;\ntry { sessionStorage.setItem('midinero.unlocked', '1'); } catch (e) {}\n", 1)
prueba = prueba.replace("const DB_KEY = 'midinero.v1';", "const DB_KEY = 'rawmoney.prueba';", 1).replace(SUPA, "", 1)
prueba = prueba.replace("<title>Raw Money</title>", "<title>Raw Money · prueba</title>", 1)
assert "rawmoney.prueba" in prueba and "START_DEMO = true" in prueba
(dist / "prueba.html").write_text(prueba, encoding="utf-8")
# Demo del simulador "¿Y si…?": como prueba.html, pero abre directo en el simulador con una compra de ejemplo
ysi = prueba.replace("const DB_KEY = 'rawmoney.prueba';", "const DB_KEY = 'rawmoney.prueba-ysi';", 1)
ysi = ysi.replace("<title>Raw Money · prueba</title>", "<title>Raw Money · ¿Y si…?</title>", 1)
ysi = ysi.replace("</body>", """<script>
if (!location.hash || location.hash === '#inicio') history.replaceState(null, '', '#versi');
document.addEventListener('DOMContentLoaded', () => {
  const W = S.data && whatifState(); if (W && !W.seeded) { W.seeded = true; W.item = { name: 'Laptop', price: 25000, months: 4 }; saveData(); }
  render();
});
</script>
</body>""", 1)
assert "rawmoney.prueba-ysi" in ysi and "#versi" in ysi
(dist / "prueba-ysi.html").write_text(ysi, encoding="utf-8")
