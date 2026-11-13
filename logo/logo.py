# Genera logo/rawmoney-tigre.svg: tigre original enroscado en círculo, trazos de pincel, una sola tinta (currentColor).
# Uso: python3 logo/logo.py
import math, os
C = 100.0
def P(a, r): return (C + r * math.cos(math.radians(a)), C + r * math.sin(math.radians(a)))
def f(p): return f"{p[0]:.1f} {p[1]:.1f}"
def poly(pts): return "M" + " L".join(f(p) for p in pts) + "Z"

R = 64.0
A0, A1 = -62.0, -372.0          # de la cabeza (arriba a la derecha) dando la vuelta hasta la cola
def width(t):                   # grosor del cuerpo a lo largo (0 = hombros, 1 = punta de la cola)
    if t < .55: return 32 - 8 * t / .55
    if t < .9: return 24 - 14 * (t - .55) / .35
    return 10 + 3 * math.sin((t - .9) / .1 * math.pi)  # punta de la cola un poco más gruesa
def radius(t):                  # la cola se mete hacia adentro al final
    return R - (0 if t < .8 else 16 * ((t - .8) / .2) ** 1.6)

N = 220
outer, inner = [], []
for i in range(N + 1):
    t = i / N; a = A0 + (A1 - A0) * t; w = width(t); r = radius(t)
    outer.append(P(a, r + w / 2)); inner.append(P(a, r - w / 2))
# punta redondeada de la cola
tE = 1; aE = A1; rE = radius(1); wE = width(1)
cap = [P(aE - 4 * math.sin(math.radians(k)), rE + wE / 2 * math.cos(math.radians(k))) for k in range(0, 181, 15)]
body = "M" + " L".join(f(p) for p in outer) + " L" + " L".join(f(p) for p in cap) + " L" + " L".join(f(p) for p in reversed(inner)) + "Z"

# rayas: cuñas de pincel que entran desde la orilla de afuera y la de adentro, alternadas
stripes = []
k = 0
t = .07
while t < .97:
    a = A0 + (A1 - A0) * t; w = width(t); r = radius(t)
    from_out = k % 2 == 0
    base = 12 if t < .8 else 8         # ancho de la raya en grados sobre la orilla
    reach = .84 if t < .8 else .92     # qué tanto entra
    skew = -13 if from_out else -10    # inclinación tipo pincel
    e = r + w / 2 + 2 if from_out else r - w / 2 - 2
    tip_r = (r + w / 2) - w * reach if from_out else (r - w / 2) + w * reach
    p1, p2 = P(a - base / 2, e), P(a + base / 2, e)
    tip = P(a + skew, tip_r)
    bend = 7 if from_out else -7       # curva de pincel (las dos orillas se doblan hacia el mismo lado)
    m1 = P(a - base * .15 + skew * .5 + bend, (e + tip_r) / 2)
    m2 = P(a + base * .2 + skew * .5 + bend, (e + tip_r) / 2)
    stripes.append(f"M{f(p1)} Q{f(m1)} {f(tip)} Q{f(m2)} {f(p2)}Z")
    k += 1
    t += .058 if t < .8 else .05

# cabeza: original, geométrica, de frente con leve giro
hx, hy = P(A0 + 6, R + 2)
head = []
S = 1.0
def H(x, y): return (hx + x * S, hy + y * S)
head_shape = [(-19, -15), (-26, -27), (-13, -22), (-6, -24), (6, -24), (13, -22), (26, -27), (19, -15), (26, -8), (24, -2), (33, 3),
              (25, 7), (31, 13), (21, 14), (24, 21), (13, 20), (8, 27), (0, 29), (-8, 27), (-13, 20), (-24, 21), (-21, 14), (-31, 13), (-25, 7), (-33, 3), (-24, -2), (-26, -8)]
head_path = "M" + " L".join(f(H(*p)) for p in head_shape) + "Z"
cuts = [
    # ojos almendrados
    f"M{f(H(-15, -2))} Q{f(H(-9, -8))} {f(H(-3, -3))} Q{f(H(-9, 1))} {f(H(-15, -2))}Z",
    f"M{f(H(15, -2))} Q{f(H(9, -8))} {f(H(3, -3))} Q{f(H(9, 1))} {f(H(15, -2))}Z",
    # rayas de la frente
    f"M{f(H(-3.5, -23))} L{f(H(0, -9))} L{f(H(3.5, -23))}Z",
    f"M{f(H(-12, -21))} Q{f(H(-9, -14))} {f(H(-5, -11))} L{f(H(-8.5, -21.5))}Z",
    f"M{f(H(12, -21))} Q{f(H(9, -14))} {f(H(5, -11))} L{f(H(8.5, -21.5))}Z",
    f"M{f(H(-22, -12))} L{f(H(-14, -10))} L{f(H(-21, -7))}Z",
    f"M{f(H(22, -12))} L{f(H(14, -10))} L{f(H(21, -7))}Z",
    # rayas de los cachetes
    f"M{f(H(-30, 4))} L{f(H(-16, 5.5))} L{f(H(-28, 9))}Z",
    f"M{f(H(30, 4))} L{f(H(16, 5.5))} L{f(H(28, 9))}Z",
    f"M{f(H(-25, 13))} L{f(H(-13, 12))} L{f(H(-22, 17))}Z",
    f"M{f(H(25, 13))} L{f(H(13, 12))} L{f(H(22, 17))}Z",
    # hocico: contorno alrededor de la nariz
    f"M{f(H(-7, 8))} Q{f(H(0, 4))} {f(H(7, 8))} Q{f(H(8, 16))} {f(H(0, 19))} Q{f(H(-8, 16))} {f(H(-7, 8))}Z",
    # orejas por dentro
    f"M{f(H(-20, -17))} L{f(H(-22, -21))} L{f(H(-16, -19))}Z",
    f"M{f(H(20, -17))} L{f(H(22, -21))} L{f(H(16, -19))}Z",
]
nose = f"M{f(H(-4.5, 8.5))} L{f(H(4.5, 8.5))} L{f(H(0, 13))}Z M{f(H(-.8, 13))} L{f(H(.8, 13))} L{f(H(.8, 16.5))} L{f(H(-.8, 16.5))}Z"
pupils = f'<circle cx="{H(-9, -3.5)[0]:.1f}" cy="{H(-9, -3.5)[1]:.1f}" r="1.8"/><circle cx="{H(9, -3.5)[0]:.1f}" cy="{H(9, -3.5)[1]:.1f}" r="1.8"/>'
# hueco alrededor de la cabeza para separarla del cuerpo
halo = "M" + " L".join(f(H(p[0] * 1.13, p[1] * 1.13)) for p in head_shape) + "Z"

# pata delantera estirada hacia el centro
px, py = P(A0 - 40, R - 30)
paw = f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="9" ry="7"/>' + "".join(
    f'<circle cx="{px + dx:.1f}" cy="{py + dy:.1f}" r="3.2"/>' for dx, dy in [(-7, 7), (-1, 9.5), (5.5, 8)])
leg_a, leg_b = P(A0 - 52, R - 8), P(A0 - 30, R - 10)
leg = f'<path d="M{f(leg_a)} Q{f(P(A0 - 50, R - 26))} {f((px - 4, py - 4))} L{f((px + 6, py - 2))} Q{f(P(A0 - 34, R - 22))} {f(leg_b)}Z"/>'

pts = outer + inner + cap + [H(x * 1.0, y * 1.0) for x, y in head_shape]
x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts); y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
side = max(x1 - x0, y1 - y0) + 8; vx, vy = (x0 + x1) / 2 - side / 2, (y0 + y1) / 2 - side / 2
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {side:.1f} {side:.1f}" fill="currentColor" role="img" aria-label="Raw Money">
  <defs>
    <mask id="rm-cut" maskUnits="userSpaceOnUse" x="-50" y="-50" width="300" height="300">
      <rect x="-50" y="-50" width="300" height="300" fill="#fff"/>
      <g fill="#000">{"".join(f'<path d="{s}"/>' for s in stripes)}<path d="{halo}"/></g>
    </mask>
    <mask id="rm-face" maskUnits="userSpaceOnUse" x="-50" y="-50" width="300" height="300">
      <rect x="-50" y="-50" width="300" height="300" fill="#fff"/>
      <g fill="#000">{"".join(f'<path d="{c}"/>' for c in cuts)}</g>
    </mask>
  </defs>
  <g mask="url(#rm-cut)"><path d="{body}"/>{leg}{paw}</g>
  <g mask="url(#rm-face)"><path d="{head_path}"/></g>
  <path d="{nose}"/>{pupils}
</svg>
'''
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rawmoney-tigre.svg")
open(out, "w").write(svg); print(out, len(svg))
# versión para la app (js/logo.js): una línea, sin role/aria (la pone quien la usa)
inline = " ".join(svg.split()).replace(' role="img" aria-label="Raw Money"', ' aria-hidden="true" focusable="false"')
js = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "js", "logo.js")
open(js, "w").write("/* Logo de Raw Money: tigre enroscado (generado por logo/logo.py, no editar a mano) */\nconst TIGER_SVG = " + repr(inline).replace("\\'", "'") + ";\n"
  + "/* Cada copia lleva sus propios ids de máscara: si dos copias comparten ids y una está oculta, la visible sale en blanco */\n"
  + "let tigerN = 0;\nconst tigerSvg = () => { const k = ++tigerN; return TIGER_SVG.replace(/rm-(cut|face)/g, `rm-$1-${k}`); };\n")
print(js)
