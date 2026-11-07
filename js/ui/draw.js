/* SVG drawing: state diagrams (DFA/NFA/TM), graphs, parse trees. */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const textW = (s) => [...String(s)].length * 7.2;

  /** diagram: {states:[name], start, accept:Set, edges:[{from,to,label}]} */
  function stateDiagram(dg, opts = {}) {
    const n = dg.states.length;
    if (!n) return '<div class="muted">No states.</div>';
    const active = opts.active || new Set();
    const hotEdges = opts.hotEdges || new Set(); // "from>to"
    const R = dg.states.map((s) => Math.min(46, Math.max(19, 8 + textW(s) / 2)));
    const maxR = Math.max(...R);
    // group edges
    const groups = new Map();
    for (const e of dg.edges) { const k = e.from + '>' + e.to; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e.label); }
    // layering
    const succ = Array.from({ length: n }, () => new Set());
    for (const e of dg.edges) if (e.from !== e.to) succ[e.from].add(e.to);
    const layer = Array(n).fill(-1); layer[dg.start] = 0; const q = [dg.start]; const disc = [dg.start];
    while (q.length) { const u = q.shift(); for (const v of [...succ[u]].sort((a, b) => a - b)) if (layer[v] < 0) { layer[v] = layer[u] + 1; q.push(v); disc.push(v); } }
    let maxL = Math.max(...layer);
    const unreached = [...Array(n).keys()].filter((i) => layer[i] < 0);
    if (unreached.length) { maxL++; unreached.forEach((i) => { layer[i] = maxL; disc.push(i); }); }
    // too many in one layer → split wide layers into sub-columns
    const layers = Array.from({ length: maxL + 1 }, () => []);
    disc.forEach((v) => layers[layer[v]].push(v));
    // barycenter ordering (two sweeps)
    const posIn = new Map();
    const setPos = () => layers.forEach((L) => L.forEach((v, k) => posIn.set(v, k - (L.length - 1) / 2)));
    setPos();
    const preds = Array.from({ length: n }, () => []);
    for (const e of dg.edges) if (e.from !== e.to) preds[e.to].push(e.from);
    for (let sweep = 0; sweep < 3; sweep++) {
      for (let l = 1; l <= maxL; l++) {
        const L = layers[l];
        const bc = (v) => { const ps = [...preds[v], ...succ[v]].filter((p) => layer[p] !== l); return ps.length ? ps.reduce((a, p) => a + posIn.get(p), 0) / ps.length : posIn.get(v); };
        const scores = new Map(L.map((v) => [v, bc(v)]));
        L.sort((a, b) => scores.get(a) - scores.get(b));
        setPos();
      }
    }
    const DX = Math.max(120, 2 * maxR + 78), DY = Math.max(86, 2 * maxR + 40);
    const maxSize = Math.max(...layers.map((L) => L.length));
    const P = Array(n);
    layers.forEach((L, l) => L.forEach((v, k) => { P[v] = { x: 70 + l * DX, y: 80 + ((maxSize - 1) / 2 + (k - (L.length - 1) / 2)) * DY }; }));
    // stagger odd/even layers slightly when every layer has one node → avoid long straight overlaps
    if (maxSize === 1 && n > 2) P.forEach((p, i) => { p.y += (layer[i] % 2 ? 28 : -0); });
    const parts = [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const grow = (x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
    P.forEach((p, i) => { grow(p.x - R[i] - 50, p.y - R[i] - 12); grow(p.x + R[i] + 12, p.y + R[i] + 12); });
    const labelSvg = (x, y, txt, hot) => { grow(x - textW(txt) / 2 - 4, y - 10); grow(x + textW(txt) / 2 + 4, y + 8); return `<text class="elabel${hot ? ' hot' : ''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(txt)}</text>`; };
    const marks = []; // points occupied by curves/labels, used to place self-loops
    const ordered = [...groups].sort((a, b) => { const la = a[0].split('>'), lb = b[0].split('>'); return (la[0] === la[1]) - (lb[0] === lb[1]); });
    for (const [k, labels] of ordered) {
      const [u, v] = k.split('>').map(Number);
      const hot = hotEdges.has(k);
      const txt = labels.join(opts.labelSep || ', ');
      if (u === v) {
        const p = P[u], r = R[u];
        const crowd = (dir) => marks.filter((m) => Math.abs(m.x - p.x) < 55 && (dir < 0 ? m.y < p.y - r * 0.3 && m.y > p.y - r - 90 : m.y > p.y + r * 0.3 && m.y < p.y + r + 90)).length;
        const dir = crowd(-1) <= crowd(1) ? -1 : 1; // -1 = above, 1 = below
        const a = 0.5, h = 46 + r * 0.6;
        const sx = p.x - r * Math.sin(a), sy = p.y + dir * r * Math.cos(a), ex = p.x + r * Math.sin(a), ey = sy;
        const cy = p.y + dir * (r + h);
        parts.push(`<path class="edge${hot ? ' hot' : ''}" d="M${sx.toFixed(1)},${sy.toFixed(1)} C${(p.x - 36).toFixed(1)},${cy.toFixed(1)} ${(p.x + 36).toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" marker-end="url(#${hot ? 'arrHot' : 'arr'})"/>`);
        grow(p.x - 40, p.y + dir * (r + h * 0.8 + 16));
        parts.push(labelSvg(p.x, p.y + dir * (r + h * 0.75 + 9), txt, hot));
        continue;
      }
      const p1 = P[u], p2 = P[v];
      const dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.hypot(dx, dy) || 1;
      const rev = groups.has(v + '>' + u);
      const span = Math.abs(layer[u] - layer[v]);
      let bend = rev ? 0.22 : (span === 0 || span > 1) ? 0.28 : 0;
      if (!rev && span === 1) {
        // bend if the straight segment passes too close to another node
        for (let w = 0; w < n; w++) { if (w === u || w === v) continue; const t = ((P[w].x - p1.x) * dx + (P[w].y - p1.y) * dy) / (d * d); if (t > 0 && t < 1) { const cx = p1.x + t * dx, cy = p1.y + t * dy; if (Math.hypot(P[w].x - cx, P[w].y - cy) < R[w] + 10) { bend = 0.25; break; } } }
      }
      if (span > 1 && !rev) bend = Math.min(0.45, 0.18 + 0.08 * span);
      const nx = -dy / d, ny = dx / d;
      const mx = (p1.x + p2.x) / 2 + nx * bend * d, my = (p1.y + p2.y) / 2 + ny * bend * d;
      const u1x = mx - p1.x, u1y = my - p1.y, l1 = Math.hypot(u1x, u1y) || 1;
      const u2x = mx - p2.x, u2y = my - p2.y, l2 = Math.hypot(u2x, u2y) || 1;
      const sx = p1.x + (u1x / l1) * R[u], sy = p1.y + (u1y / l1) * R[u];
      const ex = p2.x + (u2x / l2) * (R[v] + 2), ey = p2.y + (u2y / l2) * (R[v] + 2);
      parts.push(`<path class="edge${hot ? ' hot' : ''}" d="M${sx.toFixed(1)},${sy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" marker-end="url(#${hot ? 'arrHot' : 'arr'})"/>`);
      let bx = 0.25 * sx + 0.5 * mx + 0.25 * ex, by = 0.25 * sy + 0.5 * my + 0.25 * ey;
      const off = bend ? 11 : 10;
      const sgn = bend ? 1 : (ny > 0 ? -1 : 1) * (Math.abs(dy) < 1 ? 1 : 1);
      bx += nx * off * sgn; by += ny * off * sgn;
      if (!bend && Math.abs(dy) < 2) by = (p1.y + p2.y) / 2 - 10;
      parts.push(labelSvg(bx, by, txt, hot));
      marks.push({ x: bx, y: by }, { x: 0.5 * mx + 0.25 * (sx + ex), y: 0.5 * my + 0.25 * (sy + ey) });
    }
    const nodes = [];
    P.forEach((p, i) => {
      const cls = ['node']; if (active.has(i)) cls.push('active'); if (dg.accept.has(i)) cls.push('accept');
      const fs = R[i] > 30 ? 11 : 13;
      nodes.push(`<g class="${cls.join(' ')}"><circle cx="${p.x}" cy="${p.y}" r="${R[i]}"/>${dg.accept.has(i) ? `<circle class="inner" cx="${p.x}" cy="${p.y}" r="${R[i] - 4}"/>` : ''}<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central" style="font-size:${fs}px">${esc(dg.states[i])}</text></g>`);
    });
    const s = P[dg.start];
    const startArrow = `<path class="edge start" d="M${s.x - R[dg.start] - 40},${s.y} L${s.x - R[dg.start] - 2},${s.y}" marker-end="url(#arr)"/>`;
    const W = maxX - minX + 20, H = maxY - minY + 20;
    const defs = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker><marker id="arrHot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead hot"/></marker></defs>`;
    return `<svg class="diagram" viewBox="${(minX - 10).toFixed(0)} ${(minY - 10).toFixed(0)} ${W.toFixed(0)} ${H.toFixed(0)}" width="${Math.min(W, opts.maxWidth || 2000).toFixed(0)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="State diagram">${defs}${startArrow}${parts.join('')}${nodes.join('')}</svg>`;
  }

  function machineDiagram(m, opts = {}) {
    const edges = [];
    m.delta.forEach((d, q) => { for (const [s, t] of d) for (const r of t) edges.push({ from: q, to: r, label: s === '' ? 'ε' : s }); });
    return stateDiagram({ states: m.states, start: m.start, accept: m.accept, edges }, opts);
  }
  function tmDiagram(tm, opts = {}) {
    const states = [...tm.states]; if (!states.includes(tm.accept)) states.push(tm.accept);
    const idx = new Map(states.map((s, i) => [s, i]));
    const edges = [];
    for (const [k, t] of tm.delta) { const [q, a] = k.split('\u0000'); edges.push({ from: idx.get(q), to: idx.get(t.to), label: `${a}→${t.write},${t.move}` }); }
    const active = new Set(); if (opts.state != null && idx.has(opts.state)) active.add(idx.get(opts.state));
    const hot = new Set(); if (opts.lastFrom != null && idx.has(opts.lastFrom) && idx.has(opts.state)) hot.add(idx.get(opts.lastFrom) + '>' + idx.get(opts.state));
    return stateDiagram({ states, start: idx.get(tm.start), accept: new Set([idx.get(tm.accept)]), edges }, { active, hotEdges: hot, labelSep: ' | ' });
  }

  /* ---------------------------------------------------------------- graphs */
  function layoutGraph(G, W = 560, H = 380) {
    const n = G.n; if (!n) return [];
    const P = Array.from({ length: n }, (_, i) => ({ x: W / 2 + Math.cos((2 * Math.PI * i) / n - Math.PI / 2) * W * 0.38, y: H / 2 + Math.sin((2 * Math.PI * i) / n - Math.PI / 2) * H * 0.38 }));
    if (n <= 2) return P;
    const k = Math.sqrt((W * H) / n) * 0.75;
    let temp = W / 8;
    for (let it = 0; it < 400; it++) {
      const disp = P.map(() => ({ x: 0, y: 0 }));
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let dx = P[i].x - P[j].x, dy = P[i].y - P[j].y; let d = Math.hypot(dx, dy) || 0.01;
        const f = (k * k) / d; dx /= d; dy /= d;
        disp[i].x += dx * f; disp[i].y += dy * f; disp[j].x -= dx * f; disp[j].y -= dy * f;
      }
      for (const e of G.edges) {
        if (e.u === e.v) continue;
        let dx = P[e.u].x - P[e.v].x, dy = P[e.u].y - P[e.v].y; const d = Math.hypot(dx, dy) || 0.01;
        const f = (d * d) / k; dx /= d; dy /= d;
        disp[e.u].x -= dx * f; disp[e.u].y -= dy * f; disp[e.v].x += dx * f; disp[e.v].y += dy * f;
      }
      for (let i = 0; i < n; i++) {
        disp[i].x += (W / 2 - P[i].x) * 0.02 * k / 50; disp[i].y += (H / 2 - P[i].y) * 0.02 * k / 50;
        const d = Math.hypot(disp[i].x, disp[i].y) || 0.01;
        P[i].x += (disp[i].x / d) * Math.min(d, temp); P[i].y += (disp[i].y / d) * Math.min(d, temp);
      }
      temp *= 0.985;
    }
    // normalize into box
    const xs = P.map((p) => p.x), ys = P.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const sx = (W - 80) / Math.max(1, x1 - x0), sy = (H - 80) / Math.max(1, y1 - y0); const s = Math.min(sx, sy, 2.5);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return P.map((p) => ({ x: W / 2 + (p.x - cx) * s, y: H / 2 + (p.y - cy) * s }));
  }

  function graphSVG(G, P, st = {}, opts = {}) {
    const W = opts.W || 560, H = opts.H || 380, r = 17;
    const nodeCls = st.nodes || {}, edgeCls = st.edges || {};
    const pairCount = new Map();
    const parts = [];
    for (const e of G.edges) {
      const a = P[e.u], b = P[e.v];
      const cls = 'gedge ' + (edgeCls[e.id] || '');
      const key = G.directed ? e.u + '>' + e.v : Math.min(e.u, e.v) + '-' + Math.max(e.u, e.v);
      const revKey = e.v + '>' + e.u;
      const hasRev = G.directed && G.edges.some((f) => f.u === e.v && f.v === e.u);
      const dup = pairCount.get(key) || 0; pairCount.set(key, dup + 1); void revKey;
      if (e.u === e.v) { parts.push(`<path class="${cls}" d="M${a.x - 8},${a.y - r + 2} C${a.x - 30},${a.y - 60} ${a.x + 30},${a.y - 60} ${a.x + 8},${a.y - r + 2}" ${G.directed ? 'marker-end="url(#garr)"' : ''}/>`); if (G.weighted) parts.push(`<text class="wlabel" x="${a.x}" y="${a.y - 52}" text-anchor="middle">${esc(e.w)}</text>`); continue; }
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d;
      const bend = (hasRev ? 18 : 0) + dup * 16;
      const mx = (a.x + b.x) / 2 + nx * bend, my = (a.y + b.y) / 2 + ny * bend;
      const ux = mx - a.x, uy = my - a.y, lu = Math.hypot(ux, uy) || 1, vx = mx - b.x, vy = my - b.y, lv = Math.hypot(vx, vy) || 1;
      const sx = a.x + (ux / lu) * r, sy = a.y + (uy / lu) * r, ex = b.x + (vx / lv) * (r + (G.directed ? 3 : 0)), ey = b.y + (vy / lv) * (r + (G.directed ? 3 : 0));
      parts.push(`<path class="${cls}" d="M${sx.toFixed(1)},${sy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" ${G.directed ? `marker-end="url(#garr${edgeCls[e.id] ? '-' + edgeCls[e.id] : ''})"` : ''}/>`);
      if (G.weighted) {
        const lx = 0.25 * sx + 0.5 * mx + 0.25 * ex + nx * 10, ly = 0.25 * sy + 0.5 * my + 0.25 * ey + ny * 10;
        parts.push(`<text class="wlabel" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${esc(GraphFmt(e.w))}</text>`);
      }
    }
    const nodes = G.names.map((nm, i) => `<g class="gnode ${nodeCls[i] || ''}"><circle cx="${P[i].x.toFixed(1)}" cy="${P[i].y.toFixed(1)}" r="${r}"/><text x="${P[i].x.toFixed(1)}" y="${P[i].y.toFixed(1)}" text-anchor="middle" dominant-baseline="central">${esc(nm)}</text></g>`);
    const kinds = ['', 'tree', 'considered', 'back', 'forward', 'cross', 'nontree', 'rejected', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
    const markers = kinds.map((k) => `<marker id="garr${k ? '-' + k : ''}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="garrow ${k}"/></marker>`).join('');
    return `<svg class="graph-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Graph"><defs>${markers}</defs>${parts.join('')}${nodes.join('')}</svg>`;
  }
  const GraphFmt = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100));

  /* ------------------------------------------------------------ parse tree */
  function parseTreeSVG(tree) {
    if (!tree) return '';
    let leafX = 0; const nodes = [], lines = [];
    const DX = 34, DY = 52;
    function place(t, depth) {
      if (!t.children || !t.children.length) { t._x = leafX++ * DX + 20; } else { t.children.forEach((c) => place(c, depth + 1)); t._x = (t.children[0]._x + t.children[t.children.length - 1]._x) / 2; }
      t._y = depth * DY + 20;
    }
    place(tree, 0);
    let maxY = 0;
    (function walk(t) {
      maxY = Math.max(maxY, t._y);
      if (t.children) t.children.forEach((c) => { lines.push(`<line class="tedge" x1="${t._x}" y1="${t._y + 9}" x2="${c._x}" y2="${c._y - 11}"/>`); walk(c); });
      nodes.push(`<text class="tnode ${t.term ? 'term' : t.eps ? 'eps' : 'nt'}" x="${t._x}" y="${t._y}" text-anchor="middle" dominant-baseline="middle">${esc(t.sym)}</text>`);
    })(tree);
    const W = Math.max(60, leafX * DX + 10), H = maxY + 36;
    return `<svg class="tree-svg" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Parse tree">${lines.join('')}${nodes.join('')}</svg>`;
  }

  root.Draw = { stateDiagram, machineDiagram, tmDiagram, layoutGraph, graphSVG, parseTreeSVG, esc };
})(typeof window !== 'undefined' ? window : globalThis);
