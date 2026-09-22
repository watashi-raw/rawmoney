#!/usr/bin/env python3
"""Genera dist/index.html (un solo archivo, listo para subir a cualquier hosting)
y dist/artifact.html (sin doctype/html/head/body, para publicar como artifact)."""
import pathlib, re
ROOT = pathlib.Path(__file__).parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "css/app.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="css/app.css">', "<style>\n" + css + "\n</style>")
for name in ["config", "store", "calc", "charts", "views", "forms", "sync", "cover", "app"]:
    js = (ROOT / f"js/{name}.js").read_text(encoding="utf-8")
    html = html.replace(f'<script src="js/{name}.js"></script>', "<script>\n" + js + "\n</script>")
dist = ROOT / "dist"; dist.mkdir(exist_ok=True)
(dist / "index.html").write_text(html, encoding="utf-8")
SUPA = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>'
skip = {SUPA, '<!DOCTYPE html>', '<html lang="es">', '<head>', '</head>', '<body>', '</body>', '</html>', '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'}
art = "\n".join(l for l in html.split("\n") if l.strip() not in skip)
(dist / "artifact.html").write_text(art, encoding="utf-8")
# Versión limpia (arranca sin datos demo)
clean = html.replace('<script>\n/* ===== Raw Money · shell', '<script>window.START_EMPTY = true;</script>\n<script>\n/* ===== Raw Money · shell', 1)
assert 'START_EMPTY = true' in clean
(dist / "index-limpio.html").write_text(clean, encoding="utf-8")
(dist / "artifact-limpio.html").write_text("\n".join(l for l in clean.split("\n") if l.strip() not in skip).replace("<title>Raw Money</title>", "<title>Raw Money Limpio</title>"), encoding="utf-8")
print("ok", len(html) // 1024, "KB")
