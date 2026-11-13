# Logo cute de Raw Money: cachorro de tigre ORIGINAL dormido, enroscado en círculo, rayas de pincel.
# Una sola tinta (currentColor). Genera logo/rawmoney-tigre.svg y js/logo.js.  Uso: python3 logo/logo_cute.py
import math, os
C = (100.0, 100.0)
def P(a, r, c=C): return (c[0] + r * math.cos(math.radians(a)), c[1] + r * math.sin(math.radians(a)))
def f(p): return f"{p[0]:.1f} {p[1]:.1f}"
def path(pts): return "M" + " L".join(f(p) for p in pts) + "Z"

# ---- cuerpo: anillo gordito de 135° a 405° pasando por arriba
R = 60.0; A0, A1 = 128.0, 412.0
def w_body(t): return 30 + 14 * math.sin(math.pi * min(1, t * 1.15))   # más gordito en el lomo
N = 200
out, inn = [], []
for i in range(N + 1):
    t = i / N; a = A0 + (A1 - A0) * t; w = w_body(t)
    out.append(P(a, R + w / 2)); inn.append(P(a, R - w / 2))
def cap(a, r, w, sgn):  # extremo redondeado
    return [P(a + sgn * (w / 2) / r * 57.3 * math.sin(math.radians(k)) , r + w / 2 * math.cos(math.radians(k))) for k in range(0, 181, 12)]
body = "M" + " L".join(f(p) for p in out) + " L" + " L".join(f(p) for p in cap(A1, R, w_body(1), 1)) + " L" + " L".join(f(p) for p in reversed(inn)) + " L" + " L".join(f(p) for p in reversed(cap(A0, R, w_body(0), -1))) + "Z"

# ---- cola: sale de la cadera (abajo a la derecha) y envuelve por abajo, punta que se enrosca
RT = 79.0; T0, T1 = 30.0, 112.0
tail_o, tail_i = [], []
for i in range(61):
    t = i / 60; a = T0 + (T1 - T0) * t; r = RT - 8 * t ** 2; w = 19 - 7 * t
    tail_o.append(P(a, r + w / 2)); tail_i.append(P(a, r - w / 2))
tip = P(T1 + 4, RT - 12)
tail = "M" + " L".join(f(p) for p in tail_o) + f" Q{f(P(T1 + 9, RT - 6))} {f(tip)} Q{f(P(T1 + 3, RT - 17))}" + f" {f(tail_i[-1])} L" + " L".join(f(p) for p in reversed(tail_i)) + "Z"
tail_bands = []
for t in (.3, .55, .8):
    a = T0 + (T1 - T0) * t; r = RT - 8 * t ** 2; w = 19 - 7 * t
    tail_bands.append(f"M{f(P(a - 2.2, r + w / 2 + 2))} Q{f(P(a + 1.5, r))} {f(P(a - 2.2, r - w / 2 - 2))} L{f(P(a + 2.6, r - w / 2 - 2))} Q{f(P(a + 5.5, r))} {f(P(a + 2.6, r + w / 2 + 2))}Z")

# ---- rayas de pincel del cuerpo: cuñas curvas, alternando orilla de afuera y de adentro
stripes = []
k, t = 0, .08
while t < .97:
    a = A0 + (A1 - A0) * t; w = w_body(t)
    out_side = k % 2 == 0
    # pincelada curva: nace pegada a una orilla (sin romper la silueta) y se adelgaza hacia adentro
    r_start = R + w / 2 - 2.5 if out_side else R - w / 2 + 2.5
    reach = w * (.74 if out_side else .46)
    r_end = r_start - reach if out_side else r_start + reach
    thick = 6.2 if out_side else 4.6          # mitad del grosor en grados al nacer
    bend = 15 if out_side else 9
    a_end = a + bend
    p1, p2 = P(a - thick, r_start), P(a + thick, r_start)
    c1 = P(a - thick * .4 + bend * .55, (r_start + r_end) / 2 + (2 if out_side else -2))
    c2 = P(a + thick * 1.1 + bend * .6, (r_start + r_end) / 2)
    cap_o = P(a, r_start + (2.2 if out_side else -2.2))
    stripes.append(f"M{f(p1)} Q{f(cap_o)} {f(p2)} Q{f(c2)} {f(P(a_end, r_end))} Q{f(c1)} {f(p1)}Z")
    k += 1; t += .072 if out_side else .062

# ---- cabeza grande y redonda, abajo a la izquierda, descansando sobre las patitas
H0 = (86.0, 134.0)
def H(x, y): return (H0[0] + x, H0[1] + y)
def ell(cx, cy, rx, ry, rot=0): return f'<ellipse cx="{H(cx,cy)[0]:.1f}" cy="{H(cx,cy)[1]:.1f}" rx="{rx}" ry="{ry}"' + (f' transform="rotate({rot} {H(cx,cy)[0]:.1f} {H(cx,cy)[1]:.1f})"' if rot else '') + '/>'
# contorno: óvalo ancho con mechoncitos en los cachetes
head_pts = []
for i in range(0, 360, 4):
    a = math.radians(i); rx, ry = 37, 31
    fluff = 0
    deg = i % 360
    if 340 <= deg or deg <= 40 or 140 <= deg <= 200:        # cachetes: picos suaves
        fluff = 3.5 * max(0, math.cos(math.radians(deg * 6)))
    head_pts.append(H((rx + fluff) * math.cos(a), (ry + fluff * .6) * math.sin(a) + 2))
head = path(head_pts)
ears = ell(-23, -24, 12, 12) + ell(23, -24, 12, 12)
face_cuts = [
    # orejitas por dentro
    ell(-23, -24, 5.5, 5.5), ell(23, -24, 5.5, 5.5),
    # rayas de pincel en la frente
    f'<path d="M{f(H(-4, -30))} Q{f(H(-2, -22))} {f(H(0, -15))} Q{f(H(2, -22))} {f(H(4, -30))}Z"/>',
    f'<path d="M{f(H(-15, -27))} Q{f(H(-11, -21))} {f(H(-7, -17))} L{f(H(-10, -28))}Z"/>',
    f'<path d="M{f(H(15, -27))} Q{f(H(11, -21))} {f(H(7, -17))} L{f(H(10, -28))}Z"/>',
    # rayas de los cachetes
    f'<path d="M{f(H(-41, 0))} Q{f(H(-33, 0))} {f(H(-27, 3))} Q{f(H(-34, 4))} {f(H(-40, 5))}Z"/>',
    f'<path d="M{f(H(41, 0))} Q{f(H(33, 0))} {f(H(27, 3))} Q{f(H(34, 4))} {f(H(40, 5))}Z"/>',
    f'<path d="M{f(H(-37, 12))} Q{f(H(-30, 10))} {f(H(-25, 11))} Q{f(H(-30, 14))} {f(H(-35, 16))}Z"/>',
    f'<path d="M{f(H(37, 12))} Q{f(H(30, 10))} {f(H(25, 11))} Q{f(H(30, 14))} {f(H(35, 16))}Z"/>',
    # hocico claro
    ell(-6, 11, 8.5, 7), ell(6, 11, 8.5, 7),
    # chapitas
    ell(-21, 9, 4.5, 3), ell(21, 9, 4.5, 3),
    # hueco alrededor de las patitas
    ell(-15, 27, 14.5, 11.5), ell(15, 27, 14.5, 11.5),
]
eyes = (f'<path d="M{f(H(-20, -4))} Q{f(H(-14, -10))} {f(H(-8, -4))}" fill="none" stroke="#000" stroke-width="3.6" stroke-linecap="round"/>'
        f'<path d="M{f(H(20, -4))} Q{f(H(14, -10))} {f(H(8, -4))}" fill="none" stroke="#000" stroke-width="3.6" stroke-linecap="round"/>')
nose = f'<path d="M{f(H(-4, 6))} Q{f(H(0, 4.5))} {f(H(4, 6))} Q{f(H(3.5, 9.5))} {f(H(0, 10.5))} Q{f(H(-3.5, 9.5))} {f(H(-4, 6))}Z"/>'
mouth = f'<path d="M{f(H(-6, 13))} Q{f(H(-3, 17))} {f(H(0, 13))} Q{f(H(3, 17))} {f(H(6, 13))}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M{f(H(0, 10.5))} L{f(H(0, 13))}" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
paws = ell(-15, 27, 12, 9) + ell(15, 27, 12, 9)
paw_cuts = "".join(f'<path d="M{f(H(px + dx, 31))} L{f(H(px + dx, 35))}" stroke="#000" stroke-width="2" stroke-linecap="round"/>' for px in (-15, 15) for dx in (-4, 4))
head_halo = path([H((p[0] - H0[0]) * 1.1, (p[1] - H0[1]) * 1.1) for p in head_pts])
ears_halo = ell(-23, -24, 15, 15) + ell(23, -24, 15, 15)

pts_all = out + inn + tail_o + tail_i + head_pts
x0, x1 = min(p[0] for p in pts_all) - 2, max(p[0] for p in pts_all) + 2
y0, y1 = min(min(p[1] for p in pts_all), H(0, -36)[1]) - 2, max(p[1] for p in pts_all) + 2
side = max(x1 - x0, y1 - y0) + 6; vx, vy = (x0 + x1) / 2 - side / 2, (y0 + y1) / 2 - side / 2
M = 'maskUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="320"'
W = '<rect x="-60" y="-60" width="320" height="320" fill="#fff"/>'
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.1f} {vy:.1f} {side:.1f} {side:.1f}" fill="currentColor" role="img" aria-label="Raw Money">
  <defs>
    <mask id="rm-cut" {M}>{W}<g fill="#000">{"".join(f'<path d="{s}"/>' for s in stripes)}<path d="{head_halo}"/>{ears_halo}</g></mask>
    <mask id="rm-tail" {M}>{W}<g fill="#000">{"".join(f'<path d="{s}"/>' for s in tail_bands)}<path d="{head_halo}"/></g></mask>
    <mask id="rm-face" {M}>{W}<g fill="#000">{"".join(face_cuts)}{eyes}</g></mask>
    <mask id="rm-paw" {M}>{W}<g fill="#000">{paw_cuts}</g></mask>
  </defs>
  <path d="{body}" mask="url(#rm-cut)"/>
  <path d="{tail}" mask="url(#rm-tail)"/>
  <g mask="url(#rm-face)"><path d="{head}"/>{ears}</g>
  <g mask="url(#rm-paw)">{paws}</g>
  {nose}{mouth}
</svg>
'''
here = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(here, "rawmoney-tigre.svg"), "w").write(svg)
inline = " ".join(svg.split()).replace(' role="img" aria-label="Raw Money"', ' aria-hidden="true" focusable="false"')
open(os.path.join(os.path.dirname(here), "js", "logo.js"), "w").write(
    "/* Logo de Raw Money: cachorro de tigre enroscado (generado por logo/logo_cute.py, no editar a mano) */\n"
    "const TIGER_SVG = " + repr(inline).replace("\\'", "'") + ";\n"
    "/* Cada copia lleva sus propios ids de máscara: si dos copias comparten ids y una está oculta, la visible sale en blanco */\n"
    "let tigerN = 0;\nconst tigerSvg = () => { const k = ++tigerN; return TIGER_SVG.replace(/rm-(cut|face|tail|paw)/g, `rm-$1-${k}`); };\n")
print("ok", len(svg))
