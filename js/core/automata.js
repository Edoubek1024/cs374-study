/* Automata engine: DFA/NFA parsing & simulation, regex (UIUC notation) parsing,
 * Thompson's construction, subset construction, minimization, equivalence.
 * Works in the browser (window.Automata) and in node (module.exports). */
(function (root) {
  'use strict';
  const EPS = '';
  const EPS_WORDS = new Set(['eps', 'ε', 'ϵ', 'epsilon', 'λ']);

  /* ---------------------------------------------------------- parsing */
  function cleanLine(raw) {
    let line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) return '';
    if (line[0] === '#' && !/->|→/.test(line)) return '';
    return line;
  }
  function splitTokens(s) {
    return s.split(/[\s,]+/).filter(Boolean);
  }
  function stripTrailingComment(tokens) {
    const out = [];
    for (const t of tokens) { if (t[0] === '#' && t.length > 1) break; if (t === '#') break; out.push(t); }
    return out;
  }

  function parseMachine(text) {
    const errors = [], warnings = [];
    const names = [], index = new Map();
    const st = (n) => { if (!index.has(n)) { index.set(n, names.length); names.push(n); } return index.get(n); };
    let startName = null; const acceptNames = []; let declaredAlphabet = null;
    const edges = []; // [from, sym, to]
    String(text || '').split(/\r?\n/).forEach((raw, i) => {
      const line = cleanLine(raw);
      if (!line) return;
      const ln = i + 1;
      const kv = line.match(/^(start|initial|init|accept|accepts|accepting|final|finals|states|alphabet|sigma)\s*[:=]\s*(.*)$/i);
      if (kv) {
        const key = kv[1].toLowerCase();
        const vals = stripTrailingComment(splitTokens(kv[2].replace(/[{}]/g, ' ')));
        if (key.startsWith('start') || key.startsWith('init')) {
          if (vals.length !== 1) errors.push(`Line ${ln}: start must name exactly one state.`);
          else startName = vals[0];
        } else if (key.startsWith('accept') || key.startsWith('final')) {
          acceptNames.push(...vals);
        } else if (key === 'states') {
          vals.forEach(st);
        } else {
          declaredAlphabet = vals.join('');
        }
        return;
      }
      const parts = line.split(/->|→/);
      if (parts.length !== 2) { errors.push(`Line ${ln}: expected "state symbol -> target", got "${line}".`); return; }
      let lhs = parts[0].trim();
      if (/^δ?\s*\(/.test(lhs)) lhs = lhs.replace(/^δ?\s*\(/, '').replace(/\)\s*$/, '');
      const lt = splitTokens(lhs);
      const rt = stripTrailingComment(splitTokens(parts[1].replace(/[{}]/g, ' ')));
      if (lt.length < 2) { errors.push(`Line ${ln}: need a state and at least one symbol before "->".`); return; }
      if (rt.length < 1) { errors.push(`Line ${ln}: need at least one target state after "->".`); return; }
      const from = lt[0];
      if (from[0] === '#') { errors.push(`Line ${ln}: state names cannot start with "#".`); return; }
      for (const symTok of lt.slice(1)) {
        let sym;
        if (EPS_WORDS.has(symTok.toLowerCase()) || symTok === '\\e') sym = EPS;
        else if ([...symTok].length === 1) sym = symTok;
        else { errors.push(`Line ${ln}: "${symTok}" is not a single symbol (separate several symbols with commas, write ε as eps).`); continue; }
        for (const to of rt) edges.push([from, sym, to]);
      }
    });
    edges.forEach(([f, , t]) => { st(f); st(t); });
    if (startName === null) {
      if (names.length) { startName = names[0]; warnings.push(`No "start:" line; using ${startName} as the start state.`); }
    }
    if (startName !== null) st(startName);
    acceptNames.forEach(st);
    if (!names.length) errors.push('The machine has no states. Add "start: ..." and transitions like "q0 0 -> q1".');
    if (!acceptNames.length && names.length) warnings.push('No accepting states ("accept: ..."): the machine accepts nothing.');
    const n = names.length;
    const delta = Array.from({ length: n }, () => new Map());
    const symbols = new Set();
    for (const [f, s, t] of edges) {
      const fi = index.get(f), ti = index.get(t);
      if (!delta[fi].has(s)) delta[fi].set(s, new Set());
      delta[fi].get(s).add(ti);
      if (s !== EPS) symbols.add(s);
    }
    const m = { states: names, start: startName === null ? 0 : index.get(startName), accept: new Set(acceptNames.map((a) => index.get(a))), delta, symbols, declaredAlphabet };
    return { machine: errors.length ? null : m, errors, warnings };
  }

  /* --------------------------------------------------------- simulation */
  function closure(m, set) {
    const out = new Set(set), stack = [...set];
    while (stack.length) {
      const q = stack.pop();
      const e = m.delta[q].get(EPS);
      if (e) for (const r of e) if (!out.has(r)) { out.add(r); stack.push(r); }
    }
    return out;
  }
  function step(m, set, sym) {
    const out = new Set();
    for (const q of set) { const t = m.delta[q].get(sym); if (t) for (const r of t) out.add(r); }
    return closure(m, out);
  }
  function accepts(m, str) {
    let cur = closure(m, [m.start]);
    for (const c of str) { cur = step(m, cur, c); if (!cur.size) return false; }
    for (const q of cur) if (m.accept.has(q)) return true;
    return false;
  }
  function trace(m, str) {
    const out = [];
    let cur = closure(m, [m.start]);
    out.push({ read: null, states: [...cur] });
    for (const c of str) { cur = step(m, cur, c); out.push({ read: c, states: [...cur] }); }
    let acc = false; for (const q of cur) if (m.accept.has(q)) acc = true;
    return { steps: out, accepted: acc };
  }
  function hasEps(m) { return m.delta.some((d) => d.has(EPS)); }

  /** DFA well-formedness check against an alphabet string. */
  function checkDFA(m, alphabet) {
    const errors = [], missing = [];
    const sigma = [...alphabet];
    m.delta.forEach((d, q) => {
      for (const [s, t] of d) {
        if (s === EPS) errors.push(`State ${m.states[q]} has an ε-transition (not allowed in a DFA).`);
        else if (t.size > 1) errors.push(`State ${m.states[q]} has ${t.size} transitions on "${s}" (a DFA needs exactly one).`);
      }
      for (const s of sigma) if (!d.has(s)) missing.push(`${m.states[q]} on ${s}`);
    });
    return { ok: !errors.length, errors, missing };
  }
  function foreignSymbols(m, alphabet) {
    const a = new Set([...alphabet]);
    return [...m.symbols].filter((s) => !a.has(s));
  }

  /* ---------------------------------------------------------------- regex */
  function tokenizeRegex(src) {
    const toks = []; const s = [...String(src)];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (/\s/.test(c)) continue;
      if (s.slice(i, i + 3).join('').toLowerCase() === 'eps') { toks.push({ t: 'eps' }); i += 2; continue; }
      if (c === 'ε' || c === 'ϵ' || c === 'λ') { toks.push({ t: 'eps' }); continue; }
      if (c === '∅' || c === 'Ø' || c === '⌀') { toks.push({ t: 'empty' }); continue; }
      if (c === 'Σ') { toks.push({ t: 'sigma' }); continue; }
      if (c === '+' || c === '|' || c === '∪') { toks.push({ t: 'union' }); continue; }
      if (c === '*' || c === '∗') { toks.push({ t: 'star' }); continue; }
      if (c === '^' && (s[i + 1] === '*' || s[i + 1] === '∗')) { toks.push({ t: 'star' }); i++; continue; }
      if (c === '(') { toks.push({ t: 'lp' }); continue; }
      if (c === ')') { toks.push({ t: 'rp' }); continue; }
      if (c === '\\' && i + 1 < s.length) { toks.push({ t: 'sym', c: s[++i] }); continue; }
      toks.push({ t: 'sym', c });
    }
    return toks;
  }
  function parseRegex(src) {
    const toks = tokenizeRegex(src); let p = 0;
    const err = (msg) => { throw new Error(msg); };
    if (!toks.length) err('Empty regular expression (write ε for the empty string, ∅ for the empty language).');
    function union() {
      let a = concat();
      while (p < toks.length && toks[p].t === 'union') { p++; a = { t: 'union', a, b: concat() }; }
      return a;
    }
    function concat() {
      let a = null;
      while (p < toks.length && toks[p].t !== 'union' && toks[p].t !== 'rp') {
        const b = star(); a = a ? { t: 'cat', a, b } : b;
      }
      if (!a) err(p < toks.length ? `Missing expression before "${toks[p].t === 'union' ? '+' : ')'}".` : 'Expression ends unexpectedly (missing operand after "+"?).');
      return a;
    }
    function star() {
      let a = atom();
      while (p < toks.length && toks[p].t === 'star') { p++; a = { t: 'star', a }; }
      return a;
    }
    function atom() {
      const k = toks[p];
      if (!k) err('Expression ends unexpectedly.');
      if (k.t === 'lp') {
        p++;
        if (toks[p] && toks[p].t === 'rp') { p++; return { t: 'eps' }; }
        const e = union();
        if (!toks[p] || toks[p].t !== 'rp') err('Unbalanced parentheses: missing ")".');
        p++; return e;
      }
      if (k.t === 'sym' || k.t === 'eps' || k.t === 'empty' || k.t === 'sigma') { p++; return k.t === 'sym' ? { t: 'sym', c: k.c } : { t: k.t }; }
      if (k.t === 'star') err('"*" must follow an expression.');
      if (k.t === 'rp') err('Unbalanced parentheses: unexpected ")".');
      err('Unexpected token.');
    }
    const ast = union();
    if (p < toks.length) err(toks[p].t === 'rp' ? 'Unbalanced parentheses: unexpected ")".' : 'Could not parse the whole expression.');
    return ast;
  }
  function regexSymbols(ast, out = new Set()) {
    if (ast.t === 'sym') out.add(ast.c);
    if (ast.a) regexSymbols(ast.a, out);
    if (ast.b) regexSymbols(ast.b, out);
    return out;
  }
  function regexToString(ast) {
    const prec = { union: 1, cat: 2, star: 3 };
    function go(n, parent) {
      let s;
      switch (n.t) {
        case 'sym': return n.c;
        case 'eps': return 'ε';
        case 'empty': return '∅';
        case 'sigma': return 'Σ';
        case 'union': s = go(n.a, 1) + '+' + go(n.b, 1); break;
        case 'cat': s = go(n.a, 2) + go(n.b, 2); break;
        case 'star': s = go(n.a, 3) + '*'; break;
      }
      return prec[n.t] < parent ? '(' + s + ')' : s;
    }
    return go(ast, 0);
  }
  /** Thompson's construction. Returns a machine (NFA with ε-moves). */
  function regexToNFA(ast, alphabet) {
    const delta = []; const names = [];
    const ns = () => { delta.push(new Map()); names.push('s' + names.length); return names.length - 1; };
    const add = (f, s, t) => { if (!delta[f].has(s)) delta[f].set(s, new Set()); delta[f].get(s).add(t); };
    const sigma = [...(alphabet || '')];
    function build(n) {
      const i = ns(), f = ns();
      switch (n.t) {
        case 'sym': add(i, n.c, f); break;
        case 'eps': add(i, EPS, f); break;
        case 'empty': break;
        case 'sigma': (sigma.length ? sigma : ['?']).forEach((c) => add(i, c, f)); break;
        case 'union': { const a = build(n.a), b = build(n.b); add(i, EPS, a[0]); add(i, EPS, b[0]); add(a[1], EPS, f); add(b[1], EPS, f); break; }
        case 'cat': { const a = build(n.a), b = build(n.b); add(i, EPS, a[0]); add(a[1], EPS, b[0]); add(b[1], EPS, f); break; }
        case 'star': { const a = build(n.a); add(i, EPS, f); add(i, EPS, a[0]); add(a[1], EPS, a[0]); add(a[1], EPS, f); break; }
      }
      return [i, f];
    }
    const [s, f] = build(ast);
    const symbols = new Set(); delta.forEach((d) => { for (const k of d.keys()) if (k !== EPS) symbols.add(k); });
    return { states: names, start: s, accept: new Set([f]), delta, symbols };
  }
  /** Compact NFA for a regex: Thompson then remove ε-moves & unreachable/useless states. */
  function compileRegex(src, alphabet) {
    const ast = parseRegex(src);
    return { ast, machine: trim(removeEps(regexToNFA(ast, alphabet))) };
  }

  /** Remove ε-transitions (standard closure construction). */
  function removeEps(m) {
    const n = m.states.length;
    const cl = Array.from({ length: n }, (_, q) => closure(m, [q]));
    const delta = Array.from({ length: n }, () => new Map());
    const accept = new Set();
    for (let q = 0; q < n; q++) {
      for (const r of cl[q]) {
        if (m.accept.has(r)) accept.add(q);
        for (const [s, t] of m.delta[r]) {
          if (s === EPS) continue;
          if (!delta[q].has(s)) delta[q].set(s, new Set());
          for (const u of t) delta[q].get(s).add(u);
        }
      }
    }
    return { states: m.states.slice(), start: m.start, accept, delta, symbols: new Set(m.symbols) };
  }
  /** Keep only states reachable from start and co-reachable to an accept state. */
  function trim(m) {
    const n = m.states.length;
    const reach = new Set([m.start]); const st = [m.start];
    while (st.length) { const q = st.pop(); for (const t of m.delta[q].values()) for (const r of t) if (!reach.has(r)) { reach.add(r); st.push(r); } }
    const rev = Array.from({ length: n }, () => []);
    m.delta.forEach((d, q) => { for (const t of d.values()) for (const r of t) rev[r].push(q); });
    const co = new Set([...m.accept]); const st2 = [...m.accept];
    while (st2.length) { const q = st2.pop(); for (const p of rev[q]) if (!co.has(p)) { co.add(p); st2.push(p); } }
    const keep = [...Array(n).keys()].filter((q) => q === m.start || (reach.has(q) && co.has(q)));
    const map = new Map(keep.map((q, i) => [q, i]));
    const delta = keep.map((q) => {
      const d = new Map();
      for (const [s, t] of m.delta[q]) { const tt = new Set([...t].filter((r) => map.has(r)).map((r) => map.get(r))); if (tt.size) d.set(s, tt); }
      return d;
    });
    return { states: keep.map((q, i) => 'q' + i), start: map.get(m.start), accept: new Set([...m.accept].filter((q) => map.has(q)).map((q) => map.get(q))), delta, symbols: new Set(m.symbols) };
  }

  /* -------------------------------------------------- subset construction */
  const keyOf = (set) => [...set].sort((a, b) => a - b).join(',');
  function subsetConstruction(m, alphabet, limit = 2000) {
    const sigma = [...alphabet];
    const start = closure(m, [m.start]);
    const keys = [keyOf(start)], sets = [start], idx = new Map([[keys[0], 0]]);
    const delta = [], log = [];
    for (let i = 0; i < sets.length; i++) {
      if (sets.length > limit) throw new Error(`Subset construction exceeded ${limit} states.`);
      delta.push(new Map());
      for (const c of sigma) {
        const nxt = step(m, sets[i], c); const k = keyOf(nxt);
        let j = idx.get(k);
        const isNew = j === undefined;
        if (isNew) { j = sets.length; idx.set(k, j); keys.push(k); sets.push(nxt); }
        delta[i].set(c, new Set([j]));
        log.push({ from: i, sym: c, to: j, isNew });
      }
    }
    const nameOf = (set) => set.size ? '{' + [...set].sort((a, b) => a - b).map((q) => m.states[q]).join(',') + '}' : '∅';
    const accept = new Set(); sets.forEach((s, i) => { for (const q of s) if (m.accept.has(q)) { accept.add(i); break; } });
    return { machine: { states: sets.map(nameOf), start: 0, accept, delta, symbols: new Set(sigma) }, log, sets };
  }

  /** Make a deterministic machine total over alphabet (adds a dead state if needed). */
  function complete(m, alphabet) {
    const sigma = [...alphabet];
    const states = m.states.slice(), delta = m.delta.map((d) => new Map(d));
    let dead = -1;
    const getDead = () => { if (dead < 0) { dead = states.length; let nm = 'dead'; while (states.includes(nm)) nm += "'"; states.push(nm); delta.push(new Map()); sigma.forEach((c) => delta[dead].set(c, new Set([dead]))); } return dead; };
    for (let q = 0; q < m.states.length; q++) for (const c of sigma) if (!delta[q].has(c) || !delta[q].get(c).size) delta[q].set(c, new Set([getDead()]));
    return { states, start: m.start, accept: new Set(m.accept), delta, symbols: new Set(sigma) };
  }

  /** Minimize a DFA (Moore partition refinement). Input may be any machine; it is determinized first. */
  function minimize(m, alphabet) {
    const sigma = [...alphabet];
    let d = (hasEps(m) || m.delta.some((x) => [...x.values()].some((t) => t.size > 1))) ? subsetConstruction(m, alphabet).machine : complete(m, alphabet);
    // restrict to reachable
    const reach = [d.start]; const seen = new Set(reach);
    for (let i = 0; i < reach.length; i++) for (const c of sigma) { const t = [...d.delta[reach[i]].get(c)][0]; if (!seen.has(t)) { seen.add(t); reach.push(t); } }
    let cls = new Map(reach.map((q) => [q, d.accept.has(q) ? 1 : 0]));
    let count = new Set(cls.values()).size;
    for (;;) {
      const sig = new Map(); const next = new Map();
      for (const q of reach) {
        const k = cls.get(q) + '|' + sigma.map((c) => cls.get([...d.delta[q].get(c)][0])).join(',');
        if (!sig.has(k)) sig.set(k, sig.size);
        next.set(q, sig.get(k));
      }
      const nc = sig.size; cls = next;
      if (nc === count) break; count = nc;
    }
    // build in BFS order from start
    const order = []; const blockIdx = new Map();
    const queue = [d.start];
    blockIdx.set(cls.get(d.start), 0); order.push(d.start);
    for (let i = 0; i < order.length; i++) for (const c of sigma) { const t = [...d.delta[order[i]].get(c)][0]; const b = cls.get(t); if (!blockIdx.has(b)) { blockIdx.set(b, order.length); order.push(t); } }
    void queue;
    const members = Array.from({ length: order.length }, () => []);
    for (const q of reach) members[blockIdx.get(cls.get(q))].push(d.states[q]);
    const delta = order.map((q) => { const mm = new Map(); sigma.forEach((c) => mm.set(c, new Set([blockIdx.get(cls.get([...d.delta[q].get(c)][0]))]))); return mm; });
    const accept = new Set(); order.forEach((q, i) => { if (d.accept.has(q)) accept.add(i); });
    return { machine: { states: order.map((_, i) => 'm' + i), start: 0, accept, delta, symbols: new Set(sigma) }, members };
  }

  /** Exact equivalence of two machines over alphabet; returns shortest (shortlex-first) counterexample. */
  function equivalent(m1, m2, alphabet, limit = 300000) {
    const sigma = [...alphabet].sort();
    const acc = (m, set) => { for (const q of set) if (m.accept.has(q)) return true; return false; };
    const s1 = closure(m1, [m1.start]), s2 = closure(m2, [m2.start]);
    const seen = new Set([keyOf(s1) + '|' + keyOf(s2)]);
    let frontier = [[s1, s2, '']];
    while (frontier.length) {
      const nextF = [];
      for (const [a, b, w] of frontier) {
        const x = acc(m1, a), y = acc(m2, b);
        if (x !== y) return { equal: false, counterexample: w, inFirst: x };
        for (const c of sigma) {
          const a2 = step(m1, a, c), b2 = step(m2, b, c);
          const k = keyOf(a2) + '|' + keyOf(b2);
          if (!seen.has(k)) { seen.add(k); nextF.push([a2, b2, w + c]); if (seen.size > limit) return { equal: null, error: 'State space too large to compare exactly.' }; }
        }
      }
      frontier = nextF;
    }
    return { equal: true };
  }

  /** Iterate over all strings in shortlex order up to maxLen. cb(str) returning false stops. */
  function forAllStrings(alphabet, maxLen, cb) {
    const sigma = [...alphabet].sort();
    if (cb('') === false) return false;
    let layer = [''];
    for (let L = 1; L <= maxLen; L++) {
      const next = [];
      for (const w of layer) for (const c of sigma) { const s = w + c; if (cb(s) === false) return false; next.push(s); }
      layer = next;
    }
    return true;
  }
  function defaultMaxLen(alphabet, budget = 20000, cap = 14) {
    const k = Math.max(1, [...alphabet].length);
    let L = 0, total = 1, pow = 1;
    while (L < cap) { pow *= k; if (total + pow > budget) break; total += pow; L++; }
    return L;
  }
  /** Shortest strings accepted by machine (shortlex), up to maxLen, at most limit strings. */
  function enumerate(m, alphabet, maxLen = 8, limit = 30) {
    const sigma = [...alphabet].sort();
    const out = [];
    // co-reachability to prune
    const n = m.states.length; const rev = Array.from({ length: n }, () => []);
    m.delta.forEach((d, q) => { for (const t of d.values()) for (const r of t) rev[r].push(q); });
    const live = new Set([...m.accept]); const st = [...m.accept];
    while (st.length) { const q = st.pop(); for (const p of rev[q]) if (!live.has(p)) { live.add(p); st.push(p); } }
    const alive = (set) => { for (const q of set) if (live.has(q)) return true; return false; };
    const acc = (set) => { for (const q of set) if (m.accept.has(q)) return true; return false; };
    let layer = [['', closure(m, [m.start])]];
    for (let L = 0; L <= maxLen && layer.length; L++) {
      const next = [];
      for (const [w, set] of layer) {
        if (acc(set)) { out.push(w); if (out.length >= limit) return { strings: out, truncated: true }; }
        if (L < maxLen) for (const c of sigma) { const s2 = step(m, set, c); if (s2.size && alive(s2)) next.push([w + c, s2]); }
      }
      layer = next;
      if (layer.length > 50000) return { strings: out, truncated: true };
    }
    return { strings: out, truncated: false };
  }

  /** Serialize a machine back to the text format. */
  function toText(m) {
    const lines = [`start: ${m.states[m.start]}`, `accept: ${[...m.accept].map((q) => m.states[q]).join(', ')}`];
    m.delta.forEach((d, q) => {
      const byTarget = new Map();
      for (const [s, t] of d) for (const r of t) { const k = r; if (!byTarget.has(k)) byTarget.set(k, []); byTarget.get(k).push(s === EPS ? 'eps' : s); }
      for (const [r, syms] of byTarget) lines.push(`${m.states[q]} ${syms.join(',')} -> ${m.states[r]}`);
    });
    return lines.join('\n');
  }

  const API = { EPS, parseMachine, accepts, trace, closure, step, hasEps, checkDFA, foreignSymbols, parseRegex, regexToString, regexSymbols, regexToNFA, compileRegex, removeEps, trim, subsetConstruction, complete, minimize, equivalent, forAllStrings, defaultMaxLen, enumerate, toText };
  root.Automata = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
