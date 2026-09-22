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

/* Donut: items [{label, value, color}] */
function donutSVG(items, centerLabel, centerValue) {
  const total = items.reduce((a, x) => a + x.value, 0);
  const R = 84, r = 60, cx = 100, cy = 100; let a0 = -Math.PI / 2; const gap = total ? 0.03 : 0;
  const arcs = items.map(it => {
    const frac = total ? it.value / total : 0; const a1 = a0 + frac * Math.PI * 2;
    const s = a0 + gap / 2, e = a1 - gap / 2; let path = '';
    if (frac > 0.005) {
      const big = (e - s) > Math.PI ? 1 : 0;
      const p = (rad, ang) => `${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`;
      path = `M${p(R, s)} A${R},${R} 0 ${big} 1 ${p(R, e)} L${p(r, e)} A${r},${r} 0 ${big} 0 ${p(r, s)} Z`;
    }
    a0 = a1;
    return `<path d="${path}" fill="${it.color}" data-tip="<b>${esc(it.label)}</b>${money0(it.value)} · ${pct(frac * 100)}" data-key="${esc(it.key || it.label)}"></path>`;
  }).join('');
  const empty = total ? '' : `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="var(--surface-3)" stroke-width="${R - r}"/>`;
  return `<div class="donut"><svg viewBox="0 0 200 200">${empty}${arcs}</svg><div class="c"><b>${centerValue}</b><span>${centerLabel}</span></div></div>`;
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
    return `${area}<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(last)}" cy="${y(s.values[last])}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
  }).join('');
  const hits = labels.map((l, i) => { const rows = series.map(s => `<i style='color:${s.color};font-style:normal'>●</i> ${esc(s.name)}: ${money0(s.values[i])}`).join('<br>'); return `<rect x="${x(i) - iw / (2 * Math.max(1, n - 1))}" y="${pt}" width="${iw / Math.max(1, n - 1)}" height="${ih}" fill="transparent" data-tip="<b>${esc(l)}</b>${rows}"/>`; }).join('');
  const dots = series.map(s => s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.color}" pointer-events="none"/>`).join('')).join('');
  const legend = series.length > 1 ? `<div class="leg2">${series.map(s => `<span><i style="--c:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}"><g class="grid">${grid}</g>${ylab}${xlab}${paths}${dots}${hits}</svg>${legend}</div>`;
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
      series.forEach(s => { const v = s.values[i]; if (v <= 0) return; const y1 = y(acc + v), y0 = y(acc); bars += `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1 - 1)}" rx="2" fill="${s.color}" data-tip="<b>${esc(l)} · ${esc(s.name)}</b>${money0(v)}"/>`; acc += v; });
    } else {
      const gw = bw * series.length + 3 * (series.length - 1); const x0 = cx - gw / 2;
      series.forEach((s, k) => { const v = s.values[i]; const h = Math.max(0, y(0) - y(v)); bars += `<rect x="${x0 + k * (bw + 3)}" y="${y(v)}" width="${bw}" height="${h}" rx="3" fill="${s.color}" data-tip="<b>${esc(l)} · ${esc(s.name)}</b>${money0(v)}"/>`; });
    }
  });
  const legend = series.length > 1 ? `<div class="leg2">${series.map(s => `<span><i class="sq" style="--c:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}"><g class="grid">${grid}</g>${ylab}${xlab}${bars}</svg>${legend}</div>`;
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
