/* Single-tape Turing machine: parsing and simulation. */
(function (root) {
  'use strict';
  function parseTM(text) {
    const errors = [], warnings = [];
    let start = null, accept = null, reject = null, blank = '_';
    const delta = new Map(); const states = new Set();
    String(text || '').split(/\r?\n/).forEach((raw, i) => {
      const ln = i + 1;
      let line = raw.replace(/\/\/.*$/, '').trim();
      if (!line) return;
      if (line[0] === '#' && !/->|→/.test(line)) return;
      const kv = line.match(/^(start|accept|reject|blank)\s*[:=]\s*(\S+)/i);
      if (kv) {
        const k = kv[1].toLowerCase(), v = kv[2];
        if (k === 'start') start = v; else if (k === 'accept') accept = v; else if (k === 'reject') reject = v; else blank = v;
        if (k !== 'blank') states.add(v);
        return;
      }
      const parts = line.split(/->|→/);
      if (parts.length !== 2) { errors.push(`Line ${ln}: expected "state read -> newState write move".`); return; }
      const l = parts[0].replace(/[(),]/g, ' ').trim().split(/\s+/);
      const r = parts[1].replace(/[(),]/g, ' ').trim().split(/\s+/).filter(Boolean);
      const rr = []; for (const t of r) { if (t[0] === '#' && t.length > 1 && rr.length >= 3) break; rr.push(t); }
      if (l.length !== 2) { errors.push(`Line ${ln}: left side must be "state symbol".`); return; }
      if (rr.length < 3) { errors.push(`Line ${ln}: right side must be "newState write move" (move is L, R or S).`); return; }
      const [q, a] = l; const [p, b, mv] = rr;
      const move = mv.toUpperCase();
      if (!['L', 'R', 'S', 'N'].includes(move)) { errors.push(`Line ${ln}: move must be L, R or S.`); return; }
      if ([...a].length !== 1 || [...b].length !== 1) { errors.push(`Line ${ln}: tape symbols must be single characters (use _ for blank).`); return; }
      const key = q + '\u0000' + a;
      if (delta.has(key)) errors.push(`Line ${ln}: duplicate transition for (${q}, ${a}) — a TM must be deterministic.`);
      delta.set(key, { to: p, write: b, move: move === 'N' ? 'S' : move });
      states.add(q); states.add(p);
      if (start === null) start = q;
    });
    if (start === null) errors.push('No start state.');
    if (accept === null) errors.push('Missing "accept: <state>" line.');
    if (reject === null) { reject = '__reject__'; }
    if (accept && [...delta.keys()].some((k) => k.split('\u0000')[0] === accept)) warnings.push('Transitions out of the accept state are ignored (it halts).');
    return { tm: errors.length ? null : { start, accept, reject, blank, delta, states: [...states] }, errors, warnings };
  }

  function makeRun(tm, input) {
    const tape = new Map(); [...input].forEach((c, i) => tape.set(i, c));
    return { tm, tape, head: 0, state: tm.start, steps: 0, halted: false, result: null };
  }
  function stepRun(run) {
    if (run.halted) return run;
    const { tm } = run;
    if (run.state === tm.accept) { run.halted = true; run.result = 'accept'; return run; }
    if (run.state === tm.reject) { run.halted = true; run.result = 'reject'; return run; }
    const sym = run.tape.has(run.head) ? run.tape.get(run.head) : tm.blank;
    const t = tm.delta.get(run.state + '\u0000' + sym);
    if (!t) { run.halted = true; run.result = 'reject'; run.implicit = true; return run; }
    if (t.write === tm.blank) run.tape.delete(run.head); else run.tape.set(run.head, t.write);
    run.head += t.move === 'L' ? -1 : t.move === 'R' ? 1 : 0;
    run.state = t.to; run.steps++;
    if (run.state === tm.accept) { run.halted = true; run.result = 'accept'; }
    else if (run.state === tm.reject) { run.halted = true; run.result = 'reject'; }
    return run;
  }
  function runTM(tm, input, maxSteps = 20000) {
    const run = makeRun(tm, input);
    while (!run.halted && run.steps < maxSteps) stepRun(run);
    return { result: run.halted ? run.result : 'timeout', steps: run.steps, run };
  }
  function tapeView(run, pad = 3) {
    const keys = [...run.tape.keys(), run.head, 0];
    const lo = Math.min(...keys) - pad, hi = Math.max(...keys) + pad;
    const cells = [];
    for (let i = lo; i <= hi; i++) cells.push({ i, c: run.tape.has(i) ? run.tape.get(i) : run.tm.blank, head: i === run.head });
    return cells;
  }
  const API = { parseTM, makeRun, stepRun, runTM, tapeView };
  root.TM = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
