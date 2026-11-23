/* ===== Raw Money · gráficos SVG minimalistas (una escala, hover, sin librerías) ===== */
let tipEl;
function tipShow(html, x, y) { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; document.body.appendChild(tipEl); } tipEl.innerHTML = html; tipEl.classList.add('show'); const w = tipEl.offsetWidth, h = tipEl.offsetHeight; let lx = x + 14, ly = y + 14; if (lx + w > innerWidth - 8) lx = x - w - 14; if (ly + h > innerHeight - 8) ly = y - h - 14; tipEl.style.left = lx + 'px'; tipEl.style.top = ly + 'px'; }
function tipHide() { if (tipEl) tipEl.classList.remove('show'); }
function bindTips(root) {
  root.querySelectorAll('[data-tip]').forEach(el => {
    el.addEventListener('mousemove', e => tipShow(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener('mouseleave', tipHide);
    el.addEventListener('touchstart', e => { const t = e.touches[0]; tipShow(el.dataset.tip, t.clientX, t.clientY); setTimeout(tipHide, 1800); }, { passive: true });
  });
}
const nice = max => { if (max <= 0) return 1000; const p = Math.pow(10, Math.floor(Math.log10(max))); const f = max / p; const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; return n * p; };
const kfmt = v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v));

/* Arco por su línea central (se dibuja con trazo grueso y puntas redondas) */
function arcLine(cx, cy, R, s, e) {
  const P = a => `${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)}`;
  if (e - s < 0.002) return `M${P(s)} L${P(s)}`;
  if (e - s >= Math.PI * 2 - 0.002) { const m = s + Math.PI; return `M${P(s)} A${R},${R} 0 1 1 ${P(m)} A${R},${R} 0 1 1 ${P(s + Math.PI * 2 - 0.001)}`; }
  return `M${P(s)} A${R},${R} 0 ${(e - s) > Math.PI ? 1 : 0} 1 ${P(e)}`;
}
/* Ángulos de cada rebanada, recortados para que las puntas redondas no se encimen */
function donutAngles(items, R, W) {
  const total = items.reduce((a, x) => a + x.value, 0); const n = items.filter(x => x.value > 0).length;
  const cap = (W / 2) / R, gap = n > 1 ? 0.07 : 0; let a0 = -Math.PI / 2;
  return items.map(it => { const frac = total ? it.value / total : 0; const a1 = a0 + frac * Math.PI * 2; let s = a0 + cap + gap / 2, e = a1 - cap - gap / 2; if (frac <= 0) { s = e = null; } else if (e < s) { s = e = (a0 + a1) / 2; } a0 = a1; return { s, e, frac }; });
}
/* Dona redonda tipo anillo de reloj: items [{label, value, color}] */
function donutSVG(items, centerLabel, centerValue) {
  const total = items.reduce((a, x) => a + x.value, 0);
  const R = 74, W = 22, cx = 100, cy = 100; const A = donutAngles(items, R, W);
  const arcs = items.map((it, i) => { const a = A[i]; if (a.s == null) return '';
    return `<path d="${arcLine(cx, cy, R, a.s, a.e)}" data-s="${a.s.toFixed(4)}" data-e="${a.e.toFixed(4)}" fill="none" stroke="${it.color}" stroke-width="${W}" stroke-linecap="round" data-tip="<b>${esc(it.label)}</b>${money0(it.value)} · ${pct(a.frac * 100)}" data-key="${esc(it.key || it.label)}"></path>`; }).join('');
  const track = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--surface-3)" stroke-width="${W}" opacity="${total ? .45 : 1}"/>`;
  return `<div class="donut"><svg viewBox="0 0 200 200" data-lq="donut" data-cx="${cx}" data-cy="${cy}" data-rm="${R}" data-w="${W}">${track}${arcs}</svg><div class="c"><b>${centerValue}</b><span>${centerLabel}</span></div></div>`;
}
/* Anillos concéntricos como los de salud de un reloj: items [{label, v (0–1+), color, text}] */
function ringsSVG(items, big, small) {
  const W = 17, step = W + 5, cx = 100, cy = 100;
  const rings = items.map((it, i) => { const r = 84 - i * step; const L = 2 * Math.PI * r; const v = Math.max(0, it.v || 0); const f = Math.min(1, v);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${it.color}" stroke-width="${W}" opacity=".16"/>
      <circle class="rg-fill" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${it.color}" stroke-width="${W}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" data-len="${L.toFixed(1)}" data-v="${f.toFixed(4)}" style="stroke-dasharray:${(f * L).toFixed(1)} ${(L * 2).toFixed(1)}" data-tip="<b>${esc(it.label)}</b>${esc(it.text || pct(v * 100))}"/>
      ${v > 1 ? `<circle class="rg-fill" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${it.over || 'var(--bad)'}" stroke-width="${W}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" data-len="${L.toFixed(1)}" data-v="${Math.min(1, v - 1).toFixed(4)}" style="stroke-dasharray:${(Math.min(1, v - 1) * L).toFixed(1)} ${(L * 2).toFixed(1)}"/>` : ''}`; }).join('');
  const inner = 84 - (items.length - 1) * step - W / 2 - 4;
  return `<div class="ringwrap"><div class="rings"><svg viewBox="0 0 200 200" data-lq="rings">${rings}</svg>${big ? `<div class="c" style="--in:${(inner * 2 / 200 * 100).toFixed(0)}%"><b class="num">${big}</b>${small ? `<span>${small}</span>` : ''}</div>` : ''}</div>
    <div class="ring-leg">${items.map(it => `<div class="rl" style="--c:${it.color}"><i></i><div><b>${esc(it.label)}</b><span>${esc(it.text || '')}</span></div><em class="num">${pct(Math.max(0, it.v || 0) * 100)}</em></div>`).join('')}</div></div>`;
}

/* Líneas múltiples (misma unidad): series [{name,color,values[]}], labels[] */
function linesSVG(labels, series, opts = {}) {
  const W = 640, H = opts.h || 220, pl = 44, pr = 12, pt = 14, pb = 28; const iw = W - pl - pr, ih = H - pt - pb;
  const max = nice(Math.max(1, ...series.flatMap(s => s.values)));
  const n = labels.length; const x = i => pl + (n > 1 ? i / (n - 1) * iw : iw / 2); const y = v => pt + ih - v / max * ih;
  const ticks = [0, .25, .5, .75, 1].map(f => f * max);
  const grid = ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/>`).join('');
  const ylab = ticks.map(t => `<text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${kfmt(t)}</text>`).join('');
  const xlab = labels.map((l, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`).join('');
  const paths = series.map(s => {
    const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = opts.area ? `<path d="${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z" fill="${s.color}" opacity=".08"/>` : '';
    const last = s.values.length - 1;
    return `${area.replace('<path ', '<path class="ln" ')}<path class="ln" d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle class="ln" cx="${x(last)}" cy="${y(s.values[last])}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
  }).join('');
  const hits = labels.map((l, i) => { const rows = series.map(s => `<i style='color:${s.color};font-style:normal'>●</i> ${esc(s.name)}: ${money0(s.values[i])}`).join('<br>'); return `<rect x="${x(i) - iw / (2 * Math.max(1, n - 1))}" y="${pt}" width="${iw / Math.max(1, n - 1)}" height="${ih}" fill="transparent" data-tip="<b>${esc(l)}</b>${rows}"/>`; }).join('');
  const dots = series.map(s => s.values.map((v, i) => `<circle class="ln" cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.color}" pointer-events="none"/>`).join('')).join('');
  const legend = series.length > 1 ? `<div class="leg2">${series.map(s => `<span><i style="--c:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" data-lq="lines" data-base="${y(0)}"><g class="grid">${grid}</g>${ylab}${xlab}${paths}${dots}${hits}</svg>${legend}</div>`;
}

/* Barras agrupadas o apiladas: labels[], series [{name,color,values}] */
function barsSVG(labels, series, opts = {}) {
  const W = 640, H = opts.h || 220, pl = 44, pr = 12, pt = 14, pb = 28; const iw = W - pl - pr, ih = H - pt - pb;
  const stacked = !!opts.stacked; const n = labels.length;
  const maxV = stacked ? Math.max(1, ...labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0))) : Math.max(1, ...series.flatMap(s => s.values));
  const max = nice(maxV); const y = v => pt + ih - v / max * ih;
  const slot = iw / n; const bw = stacked ? Math.min(34, slot * .55) : Math.min(22, slot * .7 / series.length);
  const ticks = [0, .25, .5, .75, 1].map(f => f * max);
  const grid = ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/>`).join('');
  const ylab = ticks.map(t => `<text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${kfmt(t)}</text>`).join('');
  const xlab = labels.map((l, i) => `<text x="${pl + slot * (i + .5)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`).join('');
  let bars = '';
  labels.forEach((l, i) => {
    const cx = pl + slot * (i + .5);
    if (stacked) {
      let acc = 0;
      series.forEach(s => { const v = s.values[i]; if (v <= 0) return; const y1 = y(acc + v), y0 = y(acc); bars += `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1 - 2)}" rx="${Math.min(bw / 2, Math.max(0, y0 - y1 - 2) / 2).toFixed(1)}" fill="${s.color}" data-tip="<b>${esc(l)} · ${esc(s.name)}</b>${money0(v)}"/>`; acc += v; });
    } else {
      const gw = bw * series.length + 3 * (series.length - 1); const x0 = cx - gw / 2;
      series.forEach((s, k) => { const v = s.values[i]; const h = Math.max(0, y(0) - y(v)); bars += `<rect x="${x0 + k * (bw + 3)}" y="${y(v)}" width="${bw}" height="${h}" rx="${Math.min(bw / 2, h / 2).toFixed(1)}" fill="${s.color}" data-tip="<b>${esc(l)} · ${esc(s.name)}</b>${money0(v)}"/>`; });
    }
  });
  const legend = series.length > 1 ? `<div class="leg2">${series.map(s => `<span><i class="sq" style="--c:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" data-lq="bars"><g class="grid">${grid}</g>${ylab}${xlab}${bars}</svg>${legend}</div>`;
}

/* Flujo de ingreso: sankey simple de una fuente a varios destinos */
function flowSVG(total, parts) {
  const W = 640, H = 240, left = 30, right = 430, bw = 26, pt = 12, pb = 12; const ih = H - pt - pb;
  const sumP = parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  const scale = total > 0 ? ih / Math.max(total, sumP) : 0;
  const gap = 8; let yR = pt, yL = pt; let out = '';
  const srcH = total * scale;
  out += `<rect x="${left}" y="${pt}" width="${bw}" height="${srcH}" rx="4" fill="var(--green)"/><text x="${left + bw + 8}" y="${pt + 14}" style="fill:var(--ink);font-weight:700;font-size:12px">Ingresos</text><text x="${left + bw + 8}" y="${pt + 30}" style="fill:var(--ink-2);font-size:12px">${money0(total)}</text>`;
  const usable = ih - gap * (parts.length - 1);
  const pScale = sumP > 0 ? usable / Math.max(total, sumP) : 0;
  parts.forEach(p => {
    const v = Math.max(0, p.value); if (v <= 0) return;
    const h = v * pScale; const hl = v * scale;
    const y0 = yL, y1 = yR;
    const x0 = left + bw, x1 = right; const c = (x0 + x1) / 2;
    out += `<path d="M${x0},${y0} C${c},${y0} ${c},${y1} ${x1},${y1} L${x1},${y1 + h} C${c},${y1 + h} ${c},${y0 + hl} ${x0},${y0 + hl} Z" fill="${p.color}" opacity=".28" data-tip="<b>${esc(p.name)}</b>${money0(v)} · ${pct(total ? v / total * 100 : 0)}"/>`;
    out += `<rect x="${x1}" y="${y1}" width="${bw}" height="${h}" rx="4" fill="${p.color}"/>`;
    const ty = y1 + Math.max(h / 2, 6);
    out += `<text x="${x1 + bw + 8}" y="${ty + 4}" style="fill:var(--ink);font-weight:600;font-size:12px">${esc(p.name)} <tspan style="fill:var(--ink-3);font-weight:500">${money0(v)} · ${pct(total ? v / total * 100 : 0)}</tspan></text>`;
    yL += hl; yR += h + gap;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}">${out}</svg></div>`;
}

/* Medidor semicircular: v (0–1+) y una marca opcional (p. ej. cuánto va del mes) */
function gaugeSVG(v, mark, big, small, color = 'var(--berry)') {
  const cx = 110, cy = 104, R = 82; const L = Math.PI * R;
  const pt = f => { const a = Math.PI * (1 - f); return [(cx + R * Math.cos(a)).toFixed(1), (cy - R * Math.sin(a)).toFixed(1)]; };
  const d = `M${pt(0).join(',')} A${R},${R} 0 0 1 ${pt(1).join(',')}`;
  const over = v > 1; const m = mark != null ? (() => { const a = Math.PI * (1 - Math.min(1, mark)); return `<line x1="${(cx + (R - 18) * Math.cos(a)).toFixed(1)}" y1="${(cy - (R - 18) * Math.sin(a)).toFixed(1)}" x2="${(cx + (R + 14) * Math.cos(a)).toFixed(1)}" y2="${(cy - (R + 14) * Math.sin(a)).toFixed(1)}" class="g-mark"/>`; })() : '';
  return `<div class="gauge"><svg viewBox="0 0 220 122" data-lq="gauge" data-len="${L.toFixed(1)}" data-v="${Math.min(1.04, v).toFixed(4)}"><path d="${d}" class="g-track"/><path d="${d}" class="g-fill" style="stroke:${over ? 'var(--bad)' : color};stroke-dasharray:${(Math.min(1.04, v) * L).toFixed(1)} ${(L * 2).toFixed(1)}"/>${m}</svg><div class="g-c"><b class="num">${big}</b><span>${small}</span></div></div>`;
}
/* Barras horizontales: items [{label, value, max, color, sub}] — valor sobre su propio máximo */
function hbarsHTML(items, fmt = money0) {
  const top = Math.max(1, ...items.map(i => Math.max(i.max || 0, i.value)));
  return `<div class="hb">${items.map(i => { const over = i.max && i.value > i.max; return `<div class="hb-row${over ? ' over' : ''}" style="--c:${i.color}" data-tip="<b>${esc(i.label)}</b>${fmt(i.value)}${i.max ? ` de ${fmt(i.max)}` : ''}">
    <span class="hb-l">${esc(i.label)}</span>
    <span class="hb-t">${i.max ? `<i class="hb-cap" style="width:${(i.max / top * 100).toFixed(1)}%"></i>` : ''}<i class="hb-fill" style="width:${(Math.min(i.value, top) / top * 100).toFixed(1)}%"></i></span>
    <span class="hb-v num">${fmt(i.value)}${i.max ? `<small>/${fmt(i.max)}</small>` : ''}</span></div>`; }).join('')}</div>`;
}
