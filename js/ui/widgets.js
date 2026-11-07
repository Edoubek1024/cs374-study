/* Interactive widgets: automaton tester, regex tester, grammar tester, TM simulator, graph view. */
(function (root) {
  'use strict';
  const { esc } = root.Draw;
  const A = root.Automata, C = root.CFG, T = root.TM;
  const show = (s) => (s === '' ? 'ε' : s);
  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };

  function splitAlphabet(src) {
    let alphabet = null;
    const body = String(src).split('\n').filter((l) => { const m = l.match(/^\s*(alphabet|sigma)\s*[:=]\s*(.*)$/i); if (m) { alphabet = m[2].replace(/[\s,{}]/g, ''); return false; } return true; }).join('\n');
    return { alphabet, body };
  }
  const machineAlphabet = (m, given) => given || [...m.symbols].sort().join('') || '01';

  /* ------------------------------------------------------------ automaton */
  function automaton(host, src, opts = {}) {
    const { alphabet: a0, body } = splitAlphabet(src);
    host.classList.add('w-automaton');
    host.innerHTML = `
      <div class="w-diagram"></div>
      <div class="w-row">
        <input class="w-input mono" placeholder="test a string, e.g. 0110" spellcheck="false" aria-label="Input string">
        <button class="btn sm primary w-run">Run</button>
        <button class="btn sm w-prev" title="Step back" aria-label="Step back">◀</button>
        <button class="btn sm w-next" title="Step forward" aria-label="Step forward">▶</button>
        <span class="w-result"></span>
      </div>
      <div class="w-trace mono small"></div>
      ${opts.editable === false ? '' : `<details class="w-edit"><summary>Edit this machine</summary><textarea class="mono w-src" rows="8" spellcheck="false"></textarea><div class="w-msg small"></div></details>`}`;
    const ta = host.querySelector('.w-src');
    if (ta) ta.value = body.trim();
    let m = null, alphabet = a0, run = null, pos = 0;
    const diagram = host.querySelector('.w-diagram'), res = host.querySelector('.w-result'), tr = host.querySelector('.w-trace');
    function draw() {
      if (!m) return;
      let active = new Set(), hot = new Set();
      if (run) {
        active = new Set(run.steps[pos].states);
        if (pos > 0) { const c = run.steps[pos].read; for (const q of run.steps[pos - 1].states) { const t = m.delta[q].get(c); if (t) for (const r of t) hot.add(q + '>' + r); } }
      }
      diagram.innerHTML = root.Draw.machineDiagram(m, { active, hotEdges: hot });
    }
    function load(text) {
      const r = A.parseMachine(text);
      const msg = host.querySelector('.w-msg');
      if (!r.machine) { if (msg) msg.innerHTML = `<span class="bad">${esc(r.errors.join(' '))}</span>`; return; }
      if (msg) msg.innerHTML = r.warnings.length ? `<span class="muted">${esc(r.warnings.join(' '))}</span>` : '';
      m = r.machine; alphabet = machineAlphabet(m, a0); run = null; pos = 0; res.textContent = ''; tr.textContent = ''; draw();
    }
    function showStep() {
      const names = (ss) => (ss.length ? '{' + ss.map((q) => m.states[q]).join(',') + '}' : '∅');
      const s = run.steps;
      const seq = s.slice(0, pos + 1).map((st, i) => (i === 0 ? names(st.states) : ` —${st.read}→ ${names(st.states)}`)).join('');
      tr.textContent = seq;
      const done = pos === s.length - 1;
      res.innerHTML = done ? (run.accepted ? '<span class="pill good">ACCEPT</span>' : '<span class="pill bad">REJECT</span>') : `<span class="pill">step ${pos}/${s.length - 1}</span>`;
      draw();
    }
    function start(full) {
      if (!m) return;
      const w = host.querySelector('.w-input').value.trim().replace(/^ε$|^eps$/i, '');
      const bad = [...w].filter((c) => !alphabet.includes(c));
      if (bad.length) { res.innerHTML = `<span class="pill bad">symbol "${esc(bad[0])}" ∉ Σ</span>`; return; }
      run = A.trace(m, w); pos = full ? run.steps.length - 1 : 0; showStep();
    }
    host.querySelector('.w-run').onclick = () => start(true);
    host.querySelector('.w-input').onkeydown = (e) => { if (e.key === 'Enter') start(true); };
    host.querySelector('.w-next').onclick = () => { if (!run) start(false); else if (pos < run.steps.length - 1) { pos++; showStep(); } };
    host.querySelector('.w-prev').onclick = () => { if (run && pos > 0) { pos--; showStep(); } };
    if (ta) ta.oninput = () => load(ta.value);
    load(body);
    return { reload: load };
  }

  /* ---------------------------------------------------------------- regex */
  function regex(host, src) {
    const { alphabet: a0, body } = splitAlphabet(src);
    const rx = body.trim().split('\n')[0];
    host.classList.add('w-regex');
    host.innerHTML = `
      <div class="w-row"><span class="muted small">Regex</span><input class="w-rx mono" spellcheck="false" aria-label="Regular expression"></div>
      <div class="w-row"><input class="w-input mono" placeholder="test a string" spellcheck="false" aria-label="Input string"><button class="btn sm primary w-run">Test</button><span class="w-result"></span></div>
      <div class="small"><span class="muted">Shortest strings in the language:</span> <span class="w-enum mono"></span></div>`;
    const rxIn = host.querySelector('.w-rx'); rxIn.value = rx;
    let m = null, alphabet = a0;
    function load() {
      try {
        const ast = A.parseRegex(rxIn.value);
        alphabet = a0 || [...A.regexSymbols(ast)].sort().join('') || '01';
        m = A.trim(A.removeEps(A.regexToNFA(ast, alphabet)));
        const e = A.enumerate(m, alphabet, 7, 24);
        host.querySelector('.w-enum').textContent = e.strings.length ? e.strings.map(show).join(', ') + (e.truncated ? ', …' : '') : '(empty language)';
        host.querySelector('.w-result').textContent = '';
      } catch (err) { m = null; host.querySelector('.w-enum').innerHTML = `<span class="bad">${esc(err.message)}</span>`; }
    }
    const test = () => { if (!m) return; const w = host.querySelector('.w-input').value.trim().replace(/^ε$|^eps$/i, ''); host.querySelector('.w-result').innerHTML = A.accepts(m, w) ? '<span class="pill good">in L</span>' : '<span class="pill bad">not in L</span>'; };
    rxIn.oninput = load;
    host.querySelector('.w-run').onclick = test;
    host.querySelector('.w-input').onkeydown = (e) => { if (e.key === 'Enter') test(); };
    load();
  }

  /* ------------------------------------------------------------------ cfg */
  function cfg(host, src) {
    const { alphabet: a0, body } = splitAlphabet(src);
    host.classList.add('w-cfg');
    host.innerHTML = `
      <pre class="w-gram mono"></pre>
      <div class="w-row"><input class="w-input mono" placeholder="test a string" spellcheck="false" aria-label="Input string"><button class="btn sm primary w-run">Parse</button><span class="w-result"></span></div>
      <div class="w-deriv small mono"></div>
      <div class="w-tree"></div>
      <div class="small"><span class="muted">Shortest generated strings:</span> <span class="w-enum mono"></span></div>
      <details class="w-edit"><summary>Edit this grammar</summary><textarea class="mono w-src" rows="6" spellcheck="false"></textarea><div class="w-msg small"></div></details>`;
    const ta = host.querySelector('.w-src'); ta.value = body.trim();
    let g = null, alphabet = a0;
    function load() {
      const r = C.parseGrammar(ta.value);
      const msg = host.querySelector('.w-msg');
      if (!r.grammar) { msg.innerHTML = `<span class="bad">${esc(r.errors.join(' '))}</span>`; return; }
      msg.innerHTML = r.warnings.length ? `<span class="muted">${esc(r.warnings.join(' '))}</span>` : '';
      g = r.grammar; alphabet = a0 || [...g.terminals].sort().join('') || 'ab';
      const byL = new Map(); g.rules.forEach((ru) => { if (!byL.has(ru.lhs)) byL.set(ru.lhs, []); byL.get(ru.lhs).push(ru.rhs.length ? ru.rhs.map((x) => x.s).join('') : 'ε'); });
      host.querySelector('.w-gram').textContent = [...byL].map(([l, rs]) => `${l} → ${rs.join(' | ')}`).join('\n');
      const e = C.enumerate(g, alphabet, Math.min(8, C.defaultMaxLen(alphabet, 3000, 8)), 20);
      host.querySelector('.w-enum').textContent = e.strings.length ? e.strings.map(show).join(', ') + (e.truncated ? ', …' : '') : '(none up to this length)';
      host.querySelector('.w-deriv').textContent = ''; host.querySelector('.w-tree').innerHTML = ''; host.querySelector('.w-result').textContent = '';
    }
    function test() {
      if (!g) return;
      const w = host.querySelector('.w-input').value.trim().replace(/^ε$|^eps$/i, '');
      let tree = null;
      try { tree = C.parseTree(g, w); } catch (e) { host.querySelector('.w-result').innerHTML = `<span class="pill bad">${esc(e.message)}</span>`; return; }
      host.querySelector('.w-result').innerHTML = tree ? '<span class="pill good">generated</span>' : '<span class="pill bad">not generated</span>';
      host.querySelector('.w-deriv').textContent = tree ? 'Leftmost derivation: ' + C.leftmostDerivation(tree).join(' ⇒ ') : '';
      host.querySelector('.w-tree').innerHTML = tree ? root.Draw.parseTreeSVG(tree) : '';
    }
    ta.oninput = load;
    host.querySelector('.w-run').onclick = test;
    host.querySelector('.w-input').onkeydown = (e) => { if (e.key === 'Enter') test(); };
    load();
  }

  /* ------------------------------------------------------------------- TM */
  function tm(host, src, opts = {}) {
    host.classList.add('w-tm');
    host.innerHTML = `
      <div class="w-diagram"></div>
      <div class="w-row">
        <input class="w-input mono" placeholder="input, e.g. 0011" spellcheck="false" aria-label="Input string">
        <button class="btn sm w-reset">Load</button>
        <button class="btn sm w-step">Step</button>
        <button class="btn sm primary w-runall">Run</button>
        <span class="w-result"></span>
      </div>
      <div class="tape"></div>
      <div class="w-status small mono"></div>
      ${opts.editable === false ? '' : `<details class="w-edit"><summary>Edit this machine</summary><textarea class="mono w-src" rows="9" spellcheck="false"></textarea><div class="w-msg small"></div></details>`}`;
    const ta = host.querySelector('.w-src'); if (ta) ta.value = String(src).trim();
    let M = null, run = null, lastFrom = null, timer = null;
    const diagram = host.querySelector('.w-diagram');
    function render() {
      if (!M) return;
      diagram.innerHTML = root.Draw.tmDiagram(M, { state: run ? run.state : M.start, lastFrom });
      if (!run) { host.querySelector('.tape').innerHTML = ''; host.querySelector('.w-status').textContent = ''; return; }
      host.querySelector('.tape').innerHTML = root.TM.tapeView(run).map((c) => `<span class="cell${c.head ? ' head' : ''}">${esc(c.c)}</span>`).join('');
      host.querySelector('.w-status').textContent = `state ${run.state} · step ${run.steps}`;
      host.querySelector('.w-result').innerHTML = run.halted ? (run.result === 'accept' ? '<span class="pill good">ACCEPT</span>' : `<span class="pill bad">REJECT${run.implicit ? ' (no transition)' : ''}</span>`) : '';
    }
    function load(text) {
      const r = T.parseTM(text);
      const msg = host.querySelector('.w-msg');
      if (!r.tm) { if (msg) msg.innerHTML = `<span class="bad">${esc(r.errors.join(' '))}</span>`; return; }
      if (msg) msg.innerHTML = r.warnings.length ? `<span class="muted">${esc(r.warnings.join(' '))}</span>` : '';
      M = r.tm; reset();
    }
    function reset() { if (timer) { clearInterval(timer); timer = null; } if (!M) return; run = T.makeRun(M, host.querySelector('.w-input').value.trim().replace(/^ε$|^eps$/i, '')); lastFrom = null; render(); }
    function step() { if (!run || run.halted) return; lastFrom = run.state; T.stepRun(run); render(); }
    host.querySelector('.w-reset').onclick = reset;
    host.querySelector('.w-step').onclick = () => { if (!run) reset(); step(); };
    host.querySelector('.w-runall').onclick = () => {
      if (timer) { clearInterval(timer); timer = null; return; }
      if (!run || run.halted) reset();
      let budget = 5000;
      timer = setInterval(() => { for (let k = 0; k < 1; k++) step(); if (!run || run.halted || --budget <= 0) { clearInterval(timer); timer = null; if (run && !run.halted) host.querySelector('.w-result').innerHTML = '<span class="pill">stopped (5000 steps)</span>'; } }, 120);
    };
    host.querySelector('.w-input').onkeydown = (e) => { if (e.key === 'Enter') reset(); };
    if (ta) ta.oninput = () => load(ta.value);
    if (opts.input) host.querySelector('.w-input').value = opts.input;
    load(String(src));
    return { reload: load };
  }

  /* ---------------------------------------------------------------- graph */
  function graph(host, src) {
    const r = root.GraphAlgo.parseGraph(src);
    host.classList.add('w-graph');
    if (!r.graph) { host.innerHTML = `<div class="bad small">${esc(r.errors.join(' '))}</div>`; return; }
    const P = root.Draw.layoutGraph(r.graph, 520, 300);
    host.innerHTML = `<div class="w-diagram">${root.Draw.graphSVG(r.graph, P, {}, { W: 520, H: 300 })}</div><div class="small muted">Open in the <a href="#/lab/graph?g=${encodeURIComponent(src)}">Graph Lab</a> to run algorithms on it.</div>`;
  }

  /* ------------------------------------------------- step-by-step reveal */
  function steps(host) {
    const all = [...host.querySelectorAll(':scope > .step')];
    if (all.length < 2) return;
    let shown = 1;
    const bar = document.createElement('div'); bar.className = 'w-row steps-bar';
    bar.innerHTML = '<button class="btn sm primary s-next">Next step →</button><button class="btn sm ghost s-all">Show all</button><button class="btn sm ghost s-reset">Start over</button><span class="small muted s-count"></span>';
    host.appendChild(bar);
    const upd = () => {
      all.forEach((s, i) => { s.hidden = i >= shown; });
      bar.querySelector('.s-count').textContent = `${shown} / ${all.length}`;
      bar.querySelector('.s-next').disabled = shown >= all.length;
      bar.querySelector('.s-all').hidden = shown >= all.length;
    };
    bar.querySelector('.s-next').onclick = () => { shown = Math.min(all.length, shown + 1); upd(); };
    bar.querySelector('.s-all').onclick = () => { shown = all.length; upd(); };
    bar.querySelector('.s-reset').onclick = () => { shown = 1; upd(); };
    upd();
  }

  /** Hydrate all .widget placeholders inside container. */
  function hydrate(container) {
    container.querySelectorAll('.widget[data-kind]').forEach((w) => {
      if (w.dataset.ready) return; w.dataset.ready = '1';
      const src = w.getAttribute('data-src');
      try {
        ({ automaton, regex, cfg, tm, graph, steps })[w.dataset.kind](w, src);
      } catch (e) { w.innerHTML = `<div class="bad small">Widget error: ${esc(e.message)}</div>`; console.error(e); }
    });
  }

  root.Widgets = { automaton, regex, cfg, tm, graph, hydrate, splitAlphabet, el, show };
})(window);
