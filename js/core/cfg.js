/* Context-free grammar engine: parsing grammar text, Earley recognition,
 * parse-tree extraction, enumeration of short strings. */
(function (root) {
  'use strict';
  const EPS_WORDS = ['epsilon', 'eps', 'ε', 'ϵ', 'λ'];

  function tokenizeRHS(s, ln, errors) {
    const out = []; const ch = [...s];
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      if (/\s/.test(c)) continue;
      const rest = ch.slice(i).join('');
      const ew = EPS_WORDS.find((w) => rest.toLowerCase().startsWith(w) && !(w.length > 1 && /[A-Za-z]/.test(ch[i + w.length] || '')));
      if (ew) { i += [...ew].length - 1; continue; }
      if (c === '<') {
        const j = rest.indexOf('>');
        if (j > 1) { out.push({ nt: true, s: rest.slice(0, j + 1) }); i += [...rest.slice(0, j + 1)].length - 1; continue; }
      }
      if (/[A-Z]/.test(c)) {
        let name = c;
        if (ch[i + 1] === '_' && /[A-Za-z0-9]/.test(ch[i + 2] || '')) { name += ch[++i]; while (i + 1 < ch.length && /[A-Za-z0-9]/.test(ch[i + 1])) name += ch[++i]; }
        while (i + 1 < ch.length && /['’]/.test(ch[i + 1])) name += ch[++i];
        out.push({ nt: true, s: name.replace('’', "'") });
        continue;
      }
      if (c === '\\' && i + 1 < ch.length) { out.push({ nt: false, s: ch[++i] }); continue; }
      out.push({ nt: false, s: c });
    }
    void ln; void errors;
    return out;
  }

  function parseGrammar(text) {
    const errors = [], warnings = [];
    const rules = []; let start = null; let declaredAlphabet = null;
    let lastLHS = null;
    String(text || '').split(/\r?\n/).forEach((raw, i) => {
      const ln = i + 1;
      let line = raw.replace(/\/\/.*$/, '').trim();
      if (!line) return;
      const am = line.match(/^(alphabet|sigma)\s*[:=]\s*(.*)$/i);
      if (am) { declaredAlphabet = am[2].replace(/[\s,{}]/g, ''); return; }
      const sm = line.match(/^start\s*[:=]\s*(\S+)$/i);
      if (sm) { start = sm[1]; return; }
      let lhs, rhs;
      const m = line.match(/^(<[^>]+>|[A-Z](?:_[A-Za-z0-9]+)?['’]*)\s*(->|→|::=|=>)\s*(.*)$/);
      if (m) { lhs = m[1].replace('’', "'"); rhs = m[3]; lastLHS = lhs; }
      else if (line[0] === '#') return;
      else if (line[0] === '|' && lastLHS) { lhs = lastLHS; rhs = line.slice(1); }
      else { errors.push(`Line ${ln}: expected "A -> ..." (nonterminals are uppercase letters like S, A_1, S' or <name>).`); return; }
      if (start === null) start = lhs;
      rhs.split('|').forEach((alt) => rules.push({ lhs, rhs: tokenizeRHS(alt, ln, errors) }));
    });
    if (!rules.length) errors.push('No rules found. Write rules like "S -> 0S1 | ε".');
    const nts = new Set(rules.map((r) => r.lhs));
    const terminals = new Set();
    rules.forEach((r) => r.rhs.forEach((x) => {
      if (x.nt && !nts.has(x.s)) { errors.push(`Nonterminal ${x.s} is used but has no rules.`); }
      if (!x.nt) terminals.add(x.s);
    }));
    const dedupErr = [...new Set(errors)];
    // dedupe identical rules
    const seen = new Set(); const uniq = [];
    for (const r of rules) { const k = r.lhs + '→' + r.rhs.map((x) => (x.nt ? 'N:' : 'T:') + x.s).join(' '); if (!seen.has(k)) { seen.add(k); uniq.push(r); } }
    const g = { rules: uniq, start, nonterminals: nts, terminals, declaredAlphabet };
    if (!dedupErr.length) {
      const useless = uselessNonterminals(g);
      if (useless.length) warnings.push(`Nonterminal(s) ${useless.join(', ')} can never produce a string of terminals.`);
    }
    return { grammar: dedupErr.length ? null : g, errors: dedupErr, warnings };
  }

  function nullableSet(g) {
    const nul = new Set(); let changed = true;
    while (changed) { changed = false; for (const r of g.rules) if (!nul.has(r.lhs) && r.rhs.every((x) => x.nt && nul.has(x.s))) { nul.add(r.lhs); changed = true; } }
    return nul;
  }
  function uselessNonterminals(g) {
    const gen = new Set(); let changed = true;
    while (changed) { changed = false; for (const r of g.rules) if (!gen.has(r.lhs) && r.rhs.every((x) => !x.nt || gen.has(x.s))) { gen.add(r.lhs); changed = true; } }
    return [...g.nonterminals].filter((n) => !gen.has(n));
  }

  /** Earley recognizer. Returns {accepted, chart}. */
  function earley(g, input) {
    const w = [...input]; const n = w.length;
    if (!g._byLhs) {
      g._byLhs = new Map(); g.rules.forEach((r, i) => { if (!g._byLhs.has(r.lhs)) g._byLhs.set(r.lhs, []); g._byLhs.get(r.lhs).push(i); });
      g._nullable = nullableSet(g);
    }
    const byLhs = g._byLhs, nullable = g._nullable;
    const chart = Array.from({ length: n + 1 }, () => ({ list: [], set: new Set() }));
    const add = (i, r, d, o) => { const k = r * 1e6 + d * 1e3 + o; if (!chart[i].set.has(k)) { chart[i].set.add(k); chart[i].list.push([r, d, o]); } };
    if (n > 900) throw new Error('Input too long');
    (byLhs.get(g.start) || []).forEach((r) => add(0, r, 0, 0));
    for (let i = 0; i <= n; i++) {
      const L = chart[i].list;
      for (let k = 0; k < L.length; k++) {
        const [r, d, o] = L[k]; const rule = g.rules[r];
        if (d < rule.rhs.length) {
          const x = rule.rhs[d];
          if (x.nt) {
            (byLhs.get(x.s) || []).forEach((r2) => add(i, r2, 0, i));
            if (nullable.has(x.s)) add(i, r, d + 1, o);
          } else if (i < n && w[i] === x.s) add(i + 1, r, d + 1, o);
        } else {
          // complete
          const C = chart[o].list;
          for (let j = 0; j < C.length; j++) {
            const [r2, d2, o2] = C[j]; const rr = g.rules[r2];
            if (d2 < rr.rhs.length && rr.rhs[d2].nt && rr.rhs[d2].s === rule.lhs) add(i, r2, d2 + 1, o2);
          }
        }
      }
    }
    const accepted = chart[n].list.some(([r, d, o]) => o === 0 && g.rules[r].lhs === g.start && d === g.rules[r].rhs.length);
    return { accepted, chart, w };
  }
  function accepts(g, s) { return earley(g, s).accepted; }

  /** Extract one parse tree for s (or null). Tree node: {sym, children?} */
  function parseTree(g, s) {
    const { accepted, chart, w } = earley(g, s);
    if (!accepted) return null;
    const has = (i, r, d, o) => chart[i].set.has(r * 1e6 + d * 1e3 + o);
    const completed = (A, j, i) => (g._byLhs.get(A) || []).filter((r) => has(i, r, g.rules[r].rhs.length, j));
    const active = new Set();
    function buildNT(A, j, i) {
      const key = A + ':' + j + ':' + i;
      if (active.has(key)) return null;
      active.add(key);
      try {
        for (const r of completed(A, j, i)) {
          const kids = buildSeq(r, g.rules[r].rhs.length, j, i);
          if (kids) return { sym: A, rule: r, children: kids.length ? kids : [{ sym: 'ε', eps: true }] };
        }
        return null;
      } finally { active.delete(key); }
    }
    // α[0..k) of rule r derives w[j..i)
    function buildSeq(r, k, j, i) {
      if (k === 0) return i === j ? [] : null;
      const x = g.rules[r].rhs[k - 1];
      if (!x.nt) {
        if (i - 1 >= j && w[i - 1] === x.s && has(i - 1, r, k - 1, j)) { const pre = buildSeq(r, k - 1, j, i - 1); if (pre) return [...pre, { sym: x.s, term: true }]; }
        return null;
      }
      for (let m = i; m >= j; m--) {
        if (!has(m, r, k - 1, j)) continue;
        if (!completed(x.s, m, i).length) continue;
        const sub = buildNT(x.s, m, i); if (!sub) continue;
        const pre = buildSeq(r, k - 1, j, m); if (pre) return [...pre, sub];
      }
      return null;
    }
    return buildNT(g.start, 0, w.length);
  }
  /** Leftmost derivation (array of sentential forms) from a parse tree. */
  function leftmostDerivation(tree) {
    if (!tree) return [];
    const forms = [];
    let frontier = [tree];
    const show = (f) => f.map((n) => (n.eps ? '' : n.sym)).join(' ').replace(/\s+/g, ' ').trim() || 'ε';
    forms.push(show(frontier));
    for (;;) {
      const i = frontier.findIndex((n) => !n.term && !n.eps && n.children);
      if (i < 0) break;
      const node = frontier[i];
      frontier = [...frontier.slice(0, i), ...node.children.filter((c) => !c.eps), ...frontier.slice(i + 1)];
      forms.push(show(frontier));
      if (forms.length > 500) break;
    }
    return forms;
  }

  function enumerate(g, alphabet, maxLen = 8, limit = 30) {
    const out = []; const sigma = [...alphabet].sort();
    let layer = [''];
    for (let L = 0; L <= maxLen; L++) {
      for (const s of layer) { if (accepts(g, s)) { out.push(s); if (out.length >= limit) return { strings: out, truncated: true }; } }
      if (L === maxLen) break;
      const next = []; for (const s of layer) for (const c of sigma) next.push(s + c);
      layer = next;
      if (layer.length > 20000) break;
    }
    return { strings: out, truncated: false };
  }
  function defaultMaxLen(alphabet, budget = 4000, cap = 12) {
    const k = Math.max(1, [...alphabet].length); let L = 0, total = 1, pow = 1;
    while (L < cap) { pow *= k; if (total + pow > budget) break; total += pow; L++; }
    return L;
  }
  function ruleToString(g, r) { const rule = g.rules[r]; return rule.lhs + ' → ' + (rule.rhs.length ? rule.rhs.map((x) => x.s).join('') : 'ε'); }

  const API = { parseGrammar, earley, accepts, parseTree, leftmostDerivation, enumerate, defaultMaxLen, nullableSet, ruleToString };
  root.CFG = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
