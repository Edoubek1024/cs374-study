/* Lab pages: free-form sandboxes for automata, grammars, TMs, graphs, DP, recurrences. */
(function (root) {
  'use strict';
  const { esc } = root.MD;
  const md = (s) => root.MD.md(s);
  const A = root.Automata, C = root.CFG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const show = (s) => (s === '' ? 'ε' : s);

  const LIST = [
    { id: 'automata', icon: '⚙️', title: 'Automata Lab', blurb: 'Draw DFAs/NFAs and regexes, run strings, subset construction, minimization, equivalence checking.' },
    { id: 'grammar', icon: '🌳', title: 'Grammar Lab', blurb: 'Test strings against a CFG, see parse trees and leftmost derivations, list generated strings.' },
    { id: 'tm', icon: '📼', title: 'Turing Machine Lab', blurb: 'Step through a single-tape TM on any input, with a live state diagram.' },
    { id: 'graph', icon: '🕸️', title: 'Graph Algorithms Lab', blurb: 'BFS, DFS & edge types, topological sort, SCCs, Dijkstra, Bellman–Ford, MSTs — step by step.' },
    { id: 'dp', icon: '🧮', title: 'DP Table Lab', blurb: 'Watch edit distance, LCS, LIS, subset sum, knapsack and interval DPs fill in, cell by cell.' },
    { id: 'recurrence', icon: '🌲', title: 'Recurrence Lab', blurb: 'Master theorem with recursion-tree reasoning, plus a numeric evaluator to test your guesses.' },
  ];

  function render(host, id, params, setMain) {
    if (!id) { setMain(`<header class="page-head"><h1>Lab</h1><p class="muted">Experiment freely. Everything here runs locally in your browser.</p></header><div class="cards-grid">${LIST.map((l) => `<a class="topic-card lab-card" href="#/lab/${l.id}"><div class="lab-icon">${l.icon}</div><h3>${esc(l.title)}</h3><p>${esc(l.blurb)}</p></a>`).join('')}</div>`); return; }
    const L = LIST.find((x) => x.id === id);
    if (!L) { setMain('<p>Unknown lab.</p>'); return; }
    setMain(`<header class="page-head"><div class="crumbs"><a href="#/lab">Lab</a></div><h1>${L.icon} ${esc(L.title)}</h1><p class="muted">${esc(L.blurb)}</p></header><div id="lab"></div>`);
    ({ automata: automataLab, grammar: grammarLab, tm: tmLab, graph: graphLab, dp: dpLab, recurrence: recurrenceLab })[id]($('#lab'), params);
  }

  /* --------------------------------------------------------- automata */
  const AUTO_EX = {
    'DFA: binary multiples of 3': { mode: 'machine', src: 'start: r0\naccept: r0\nr0 0 -> r0\nr0 1 -> r1\nr1 0 -> r2\nr1 1 -> r0\nr2 0 -> r1\nr2 1 -> r2' },
    'NFA: 3rd symbol from end is 1': { mode: 'machine', src: 'start: a\naccept: d\na 0,1 -> a\na 1 -> b\nb 0,1 -> c\nc 0,1 -> d' },
    'NFA with ε: (01)* + 1*': { mode: 'machine', src: 'start: s\naccept: p, t\ns eps -> p, t\np 0 -> q\nq 1 -> p\nt 1 -> t' },
    'Regex: contains 00 or 11': { mode: 'regex', src: '(0+1)*(00+11)(0+1)*' },
    'Regex: no two consecutive 1s': { mode: 'regex', src: '(0+10)*(ε+1)' },
  };
  function automataLab(host) {
    host.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <div class="w-row"><select id="exSel"><option value="">Load an example…</option>${Object.keys(AUTO_EX).map((k) => `<option>${esc(k)}</option>`).join('')}</select>
            <label class="small">Input is <select id="mode"><option value="machine">an automaton</option><option value="regex">a regex</option></select></label>
            <label class="small">Σ = <input id="sigma" class="mono" size="6" placeholder="auto"></label></div>
          <textarea id="src" class="editor mono" rows="10" spellcheck="false" aria-label="Machine or regex"></textarea>
          <div id="msg" class="small"></div>
          <div class="op-row">
            <button class="btn sm" data-op="subset">NFA → DFA (subset construction)</button>
            <button class="btn sm" data-op="min">Minimize DFA</button>
            <button class="btn sm" data-op="thompson">Regex → NFA (Thompson)</button>
            <button class="btn sm" data-op="enum">List accepted strings</button>
            <button class="btn sm" data-op="cmp">Compare with…</button>
          </div>
          <div id="cmpBox" hidden><div class="w-row small">Second machine/regex: <select id="mode2"><option value="regex">regex</option><option value="machine">automaton</option></select></div><textarea id="src2" class="editor mono" rows="5" spellcheck="false" placeholder="e.g. (0+1)*1(0+1)(0+1)"></textarea><button class="btn sm primary" id="runCmp">Check equivalence</button></div>
          <h4>Batch test</h4>
          <textarea id="batch" class="editor mono" rows="4" spellcheck="false" placeholder="one string per line (empty line = ε)"></textarea>
          <div id="batchOut" class="small mono"></div>
        </div>
        <div class="card"><div id="diag" class="w-diagram"></div><div id="tester"></div><div id="opOut"></div></div>
      </div>`;
    let cur = null;
    const sigma = () => $('#sigma').value.replace(/[\s,{}]/g, '') || (cur ? [...cur.symbols].sort().join('') : '') || '01';
    function compileSrc(mode, src) {
      if (mode === 'regex') { const ast = A.parseRegex(src); const alpha = $('#sigma').value.replace(/[\s,{}]/g, '') || [...A.regexSymbols(ast)].sort().join('') || '01'; return { m: A.trim(A.removeEps(A.regexToNFA(ast, alpha))), ast, alpha }; }
      const r = A.parseMachine(src); if (!r.machine) throw new Error(r.errors.join(' ')); return { m: r.machine, warnings: r.warnings };
    }
    function update() {
      try {
        const r = compileSrc($('#mode').value, $('#src').value);
        cur = r.m; $('#msg').innerHTML = r.warnings && r.warnings.length ? `<span class="muted">${esc(r.warnings.join(' '))}</span>` : '';
        $('#diag').innerHTML = root.Draw.machineDiagram(cur);
        if ($('#mode').value === 'regex') $('#diag').insertAdjacentHTML('afterbegin', '<div class="small muted">ε-free NFA for the regex (Thompson + ε-removal + trimming):</div>');
        const t = $('#tester'); t.innerHTML = '';
        const w = document.createElement('div'); t.appendChild(w);
        root.Widgets.automaton(w, 'alphabet: ' + sigma() + '\n' + A.toText(cur), { editable: false });
        w.querySelector('.w-diagram').remove();
        batch();
      } catch (e) { cur = null; $('#msg').innerHTML = `<span class="bad">${esc(e.message)}</span>`; }
    }
    function batch() {
      if (!cur) return;
      const lines = $('#batch').value.split('\n'); if (!$('#batch').value) { $('#batchOut').innerHTML = ''; return; }
      $('#batchOut').innerHTML = lines.map((l) => { const w = l.trim().replace(/^ε$|^eps$/i, ''); const ok = A.accepts(cur, w); return `<div>${ok ? '<span class="good">✓ accept</span>' : '<span class="bad">✗ reject</span>'}  ${esc(show(w))}</div>`; }).join('');
    }
    $('#src').oninput = update; $('#mode').onchange = update; $('#sigma').oninput = update; $('#batch').oninput = batch;
    $('#exSel').onchange = () => { const ex = AUTO_EX[$('#exSel').value]; if (!ex) return; $('#mode').value = ex.mode; $('#src').value = ex.src; $('#opOut').innerHTML = ''; update(); };
    $$('[data-op]', host).forEach((b) => {
      b.onclick = () => {
        if (!cur) return;
        const out = $('#opOut'); const op = b.dataset.op; const S = sigma();
        try {
          if (op === 'subset') {
            const r = A.subsetConstruction(cur, S);
            const rows = r.machine.states.map((nm, i) => `<tr><td class="mono">${i === 0 ? '→ ' : ''}${esc(nm)}${r.machine.accept.has(i) ? ' ✱' : ''}</td>${[...S].map((c) => `<td class="mono">${esc(r.machine.states[[...r.machine.delta[i].get(c)][0]])}</td>`).join('')}</tr>`).join('');
            out.innerHTML = `<h4>Subset construction (only reachable subsets)</h4><p class="small muted">Each DFA state is the set of NFA states we could be in (after ε-reach). ${r.machine.states.length} reachable subset(s) of 2^${cur.states.length} possible. ✱ = accepting (contains an accepting NFA state).</p><div class="table-wrap"><table class="small"><thead><tr><th>subset</th>${[...S].map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><div class="w-diagram">${root.Draw.machineDiagram(r.machine)}</div><details><summary class="small">As text (paste into the editor)</summary><pre class="code"><code>${esc(A.toText(renameStates(r.machine)))}</code></pre></details>`;
          } else if (op === 'min') {
            const r = A.minimize(cur, S);
            out.innerHTML = `<h4>Minimal DFA: ${r.machine.states.length} state(s)</h4><p class="small muted">Built by determinizing (if needed), completing with a dead state, removing unreachable states, then merging indistinguishable states (partition refinement). Each minimal state is a Myhill–Nerode class:</p><ul class="small">${r.members.map((ms, i) => `<li><b>m${i}</b> = {${ms.map(esc).join(', ')}}</li>`).join('')}</ul><div class="w-diagram">${root.Draw.machineDiagram(r.machine)}</div>`;
          } else if (op === 'thompson') {
            if ($('#mode').value !== 'regex') { out.innerHTML = '<p class="muted">Switch the input to “a regex” first.</p>'; return; }
            const ast = A.parseRegex($('#src').value); const m = A.regexToNFA(ast, S);
            out.innerHTML = `<h4>Thompson NFA for ${esc(A.regexToString(ast))}</h4><p class="small muted">${m.states.length} states. Every operator adds a fresh start and accept state glued with ε-transitions.</p><div class="w-diagram">${root.Draw.machineDiagram(m)}</div>`;
          } else if (op === 'enum') {
            const e = A.enumerate(cur, S, 10, 60);
            out.innerHTML = `<h4>Shortest accepted strings</h4><p class="mono small">${e.strings.map((x) => esc(show(x))).join(', ') || '(none up to length 10 — the language may be empty)'}${e.truncated ? ', …' : ''}</p>`;
          } else if (op === 'cmp') { $('#cmpBox').hidden = !$('#cmpBox').hidden; }
        } catch (err) { out.innerHTML = `<p class="bad">${esc(err.message)}</p>`; }
      };
    });
    $('#runCmp').onclick = () => {
      try {
        const r2 = compileSrc($('#mode2').value, $('#src2').value);
        const eq = A.equivalent(cur, r2.m, sigma());
        $('#opOut').innerHTML = eq.equal === true ? '<div class="feedback good"><b>Equivalent</b> — both describe exactly the same language.</div>'
          : eq.equal === false ? `<div class="feedback bad"><b>Not equivalent.</b> Shortest distinguishing string: <span class="mono">“${esc(show(eq.counterexample))}”</span> is accepted by the ${eq.inFirst ? 'first' : 'second'} but not the ${eq.inFirst ? 'second' : 'first'}.</div>` : `<p class="bad">${esc(eq.error)}</p>`;
      } catch (e) { $('#opOut').innerHTML = `<p class="bad">${esc(e.message)}</p>`; }
    };
    $('#exSel').value = 'NFA: 3rd symbol from end is 1'; $('#exSel').onchange();
  }
  function renameStates(m) {
    const used = new Set(); const names = m.states.map((s, i) => { let n = s === '∅' ? 'dead' : s.replace(/[{}]/g, '').replace(/,/g, '_') || 'empty'; if (used.has(n)) n += '_' + i; used.add(n); return n; });
    return Object.assign({}, m, { states: names });
  }

  /* ---------------------------------------------------------- grammar */
  const CFG_EX = {
    '0ⁿ1ⁿ': 'S -> 0S1 | ε',
    'Balanced parentheses': 'S -> (S)S | ε',
    'Palindromes over {a,b}': 'S -> aSa | bSb | a | b | ε',
    'Equal #a and #b': 'S -> aSbS | bSaS | ε',
    'Ambiguous arithmetic': 'E -> E+E | E*E | (E) | x',
    'Unambiguous arithmetic': 'E -> E+T | T\nT -> T*F | F\nF -> (E) | x',
    '0^i 1^j with i ≠ j': 'S -> A | B\nA -> 0A1 | 0A | 0\nB -> 0B1 | B1 | 1',
  };
  function grammarLab(host) {
    host.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <div class="w-row"><select id="exSel"><option value="">Load an example…</option>${Object.keys(CFG_EX).map((k) => `<option>${esc(k)}</option>`).join('')}</select><label class="small">Σ = <input id="sigma" class="mono" size="6" placeholder="auto"></label><label class="small">max length <input id="maxL" type="number" min="0" max="14" value="8" style="width:4em"></label></div>
          <textarea id="src" class="editor mono" rows="8" spellcheck="false" aria-label="Grammar"></textarea>
          <div id="msg" class="small"></div>
          <div class="w-row"><input id="w" class="mono" placeholder="string to parse" spellcheck="false" aria-label="String"><button class="btn sm primary" id="parse">Parse</button><span id="res"></span></div>
          <div id="deriv" class="small mono"></div>
          <h4>Generated strings</h4><div id="enum" class="small mono"></div>
          <div id="info" class="small muted"></div>
        </div>
        <div class="card"><h4>Parse tree</h4><div id="tree" class="tree-host"><p class="muted small">Parse a string to see its tree. Try an ambiguous grammar: the tree shown is one of possibly many.</p></div></div>
      </div>`;
    let g = null;
    const sigma = () => $('#sigma').value.replace(/[\s,{}]/g, '') || (g ? [...g.terminals].sort().join('') : 'ab');
    function update() {
      const r = C.parseGrammar($('#src').value);
      if (!r.grammar) { g = null; $('#msg').innerHTML = `<span class="bad">${esc(r.errors.join(' '))}</span>`; return; }
      g = r.grammar; $('#msg').innerHTML = r.warnings.length ? `<span class="muted">${esc(r.warnings.join(' '))}</span>` : '';
      const L = Math.min(+$('#maxL').value || 8, C.defaultMaxLen(sigma(), 30000, 14));
      const e = C.enumerate(g, sigma(), L, 200);
      $('#enum').textContent = (e.strings.map(show).join(', ') || '(none)') + (e.truncated ? ', …' : '') + `   [length ≤ ${L}]`;
      const nul = C.nullableSet(g);
      $('#info').textContent = `Start symbol ${g.start}; ${g.rules.length} productions; nullable: {${[...nul].join(', ')}}`;
    }
    function parse() {
      if (!g) return;
      const w = $('#w').value.trim().replace(/^ε$|^eps$/i, '');
      try {
        const t = C.parseTree(g, w);
        $('#res').innerHTML = t ? '<span class="pill good">generated</span>' : '<span class="pill bad">not generated</span>';
        $('#deriv').textContent = t ? C.leftmostDerivation(t).join('  ⇒  ') : '';
        $('#tree').innerHTML = t ? root.Draw.parseTreeSVG(t) : '<p class="muted small">No parse tree: the string is not in the language.</p>';
      } catch (e) { $('#res').innerHTML = `<span class="bad">${esc(e.message)}</span>`; }
    }
    $('#src').oninput = update; $('#sigma').oninput = update; $('#maxL').oninput = update;
    $('#parse').onclick = parse; $('#w').onkeydown = (e) => { if (e.key === 'Enter') parse(); };
    $('#exSel').onchange = () => { const s = CFG_EX[$('#exSel').value]; if (s) { $('#src').value = s; update(); } };
    $('#src').value = CFG_EX['Ambiguous arithmetic']; $('#w').value = 'x+x*x'; update(); parse();
  }

  /* --------------------------------------------------------------- TM */
  const TM_EX = {
    '0ⁿ1ⁿ (mark & match)': { input: '0011', src: `# Repeatedly mark the leftmost 0 as X and the leftmost 1 as Y.
start: q0
accept: qa
reject: qr
blank: _
q0 0 -> q1 X R
q0 Y -> q3 Y R
q0 _ -> qa _ R
q1 0 -> q1 0 R
q1 Y -> q1 Y R
q1 1 -> q2 Y L
q2 0 -> q2 0 L
q2 Y -> q2 Y L
q2 X -> q0 X R
q3 Y -> q3 Y R
q3 _ -> qa _ R` },
    'Even-length palindromes over {a,b}': { input: 'abba', src: `start: q0
accept: qa
reject: qr
blank: _
# remember first symbol, erase it, run to the right end, compare, return
q0 _ -> qa _ S
q0 a -> ra _ R
q0 b -> rb _ R
ra a -> ra a R
ra b -> ra b R
ra _ -> ca _ L
rb a -> rb a R
rb b -> rb b R
rb _ -> cb _ L
ca a -> back _ L
cb b -> back _ L
back a -> back a L
back b -> back b L
back _ -> q0 _ R` },
    'Binary increment': { input: '1011', src: `# Move to the right end, then add 1 with carry. Accepts when done.
start: right
accept: done
blank: _
right 0 -> right 0 R
right 1 -> right 1 R
right _ -> carry _ L
carry 1 -> carry 0 L
carry 0 -> done 1 S
carry _ -> done 1 S` },
    'Unary addition 1ⁿ+1ᵐ → 1ⁿ⁺ᵐ': { input: '11+111', src: `start: s
accept: done
blank: _
s 1 -> s 1 R
s + -> t 1 R
t 1 -> t 1 R
t _ -> e _ L
e 1 -> done _ S` },
  };
  function tmLab(host) {
    host.innerHTML = `<div class="card"><div class="w-row"><select id="exSel">${Object.keys(TM_EX).map((k) => `<option>${esc(k)}</option>`).join('')}</select><span class="muted small">Edit the machine below the tape. A missing transition means reject.</span></div><div id="tmHost"></div></div>`;
    const load = () => { const ex = TM_EX[$('#exSel').value]; const h = $('#tmHost'); h.innerHTML = ''; h.className = ''; const w = root.Widgets.tm(h, ex.src, { input: ex.input }); void w; const d = h.querySelector('details'); if (d) d.open = true; };
    $('#exSel').onchange = load; load();
  }

  /* ------------------------------------------------------------ graph */
  const G_EX = {
    'Directed graph (DFS / SCC)': 'directed\na b\nb c\nc a\nb d\nd e\ne f\nf d\ng f\ng h\nh g',
    'DAG (topological sort, DAG paths)': 'directed\ns a 2\ns b 6\na b 3\na c 4\nb d 1\nc d 2\nc t 5\nd t 3',
    'Weighted undirected (MST / Dijkstra)': 'a b 4\na h 8\nb h 11\nb c 8\nc i 2\nh i 7\nh g 1\ni g 6\nc d 7\nc f 4\ng f 2\nd f 14\nd e 9\nf e 10',
    'Negative edges (Bellman–Ford)': 'directed\ns a 4\ns b 5\na c -3\nb a -2\nc d 4\nb d 6',
    'Negative cycle': 'directed\ns a 1\na b -2\nb c 1\nc a -1\nc d 3',
    'Unweighted grid-ish (BFS)': 'a b\nb c\na d\nb e\nc f\nd e\ne f\nd g\ne h\nf i\ng h\nh i',
  };
  function graphLab(host, params) {
    host.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <div class="w-row"><select id="exSel"><option value="">Load an example…</option>${Object.keys(G_EX).map((k) => `<option>${esc(k)}</option>`).join('')}</select></div>
          <textarea id="src" class="editor mono" rows="10" spellcheck="false" aria-label="Graph"></textarea>
          <div class="small muted">One edge per line: <code>u v [weight]</code>. Add a line <code>directed</code> for a directed graph.</div>
          <div id="msg" class="small"></div>
          <div class="w-row"><label class="small">Algorithm <select id="algo">${Object.entries(root.GraphAlgo.ALGOS).map(([k, a]) => `<option value="${k}">${esc(a.name)}</option>`).join('')}</select></label>
            <label class="small" id="startLab">from <select id="start"></select></label></div>
          <div class="w-row player"><button class="btn sm" id="first" aria-label="First step">⏮</button><button class="btn sm" id="prev" aria-label="Previous step">◀</button><button class="btn sm primary" id="play">▶ Play</button><button class="btn sm" id="next" aria-label="Next step">▶</button><button class="btn sm" id="last" aria-label="Last step">⏭</button><span id="stepNo" class="small muted"></span></div>
          <div id="stepMsg" class="step-msg"></div>
          <div id="extra" class="small mono"></div>
          <div id="table"></div>
        </div>
        <div class="card"><div id="gview" class="graph-host"></div><div class="legend small"><span class="lg tree">tree / chosen</span><span class="lg considered">tentative</span><span class="lg back">back / negative-cycle</span><span class="lg forward">forward</span><span class="lg cross">cross</span><span class="lg rejected">rejected</span></div></div>
      </div>`;
    let G = null, P = null, steps = [], k = 0, timer = null;
    function parse() {
      const r = root.GraphAlgo.parseGraph($('#src').value);
      if (!r.graph) { $('#msg').innerHTML = `<span class="bad">${esc(r.errors.join(' '))}</span>`; return; }
      $('#msg').innerHTML = ''; G = r.graph; P = root.Draw.layoutGraph(G, 560, 400);
      const prev = $('#start').value;
      $('#start').innerHTML = G.names.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join('');
      const keep = G.names.indexOf(prev); if (keep >= 0) $('#start').value = String(keep);
      run();
    }
    function run() {
      if (!G) return; stop();
      const a = root.GraphAlgo.ALGOS[$('#algo').value];
      $('#startLab').style.visibility = a.needsStart ? 'visible' : 'hidden';
      steps = a.run(G, +$('#start').value || 0).steps; k = 0; draw();
    }
    function draw() {
      const s = steps[k] || { nodes: {}, edges: {} };
      $('#gview').innerHTML = root.Draw.graphSVG(G, P, s, { W: 560, H: 400 });
      $('#stepNo').textContent = `step ${k + 1} / ${steps.length}`;
      $('#stepMsg').textContent = s.msg || '';
      $('#extra').textContent = s.extra && s.extra.queue ? `queue: [${s.extra.queue.join(', ')}]` : '';
      $('#table').innerHTML = s.table ? `<div class="table-wrap"><table class="small"><thead><tr>${s.table.cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${s.table.rows.map((r) => `<tr>${r.map((c) => `<td class="mono">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
    }
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $('#play').textContent = '▶ Play'; } };
    $('#first').onclick = () => { stop(); k = 0; draw(); };
    $('#last').onclick = () => { stop(); k = steps.length - 1; draw(); };
    $('#prev').onclick = () => { stop(); if (k > 0) { k--; draw(); } };
    $('#next').onclick = () => { stop(); if (k < steps.length - 1) { k++; draw(); } };
    $('#play').onclick = () => { if (timer) return stop(); if (k >= steps.length - 1) k = 0; $('#play').textContent = '⏸ Pause'; timer = setInterval(() => { if (!document.body.contains(host) || k >= steps.length - 1) { stop(); return; } k++; draw(); }, 900); };
    let tmr = null;
    $('#src').oninput = () => { clearTimeout(tmr); tmr = setTimeout(parse, 300); };
    $('#algo').onchange = run; $('#start').onchange = run;
    $('#exSel').onchange = () => {
      const s = G_EX[$('#exSel').value]; if (!s) return; $('#src').value = s;
      const name = $('#exSel').value;
      $('#algo').value = /MST/.test(name) ? 'kruskal' : /DAG/.test(name) ? 'topo' : /Negative/.test(name) ? 'bellman' : /BFS/.test(name) ? 'bfs' : 'dfs';
      parse();
    };
    if (params && params.get('g')) { $('#src').value = params.get('g'); parse(); }
    else { $('#exSel').value = 'Weighted undirected (MST / Dijkstra)'; $('#exSel').onchange(); $('#algo').value = 'dijkstra'; run(); }
  }

  /* --------------------------------------------------------------- DP */
  function dpLab(host) {
    const P = root.DPViz.PROBLEMS;
    host.innerHTML = `
      <div class="card">
        <div class="w-row"><label class="small">Problem <select id="prob">${Object.entries(P).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('')}</select></label><span id="inputs" class="w-row"></span><button class="btn sm primary" id="build">Build table</button></div>
        <div id="spec" class="prose small spec"></div>
      </div>
      <div class="card">
        <div class="w-row player"><button class="btn sm" id="first" aria-label="First cell">⏮</button><button class="btn sm" id="prev" aria-label="Previous cell">◀</button><button class="btn sm primary" id="play">▶ Play</button><button class="btn sm" id="next" aria-label="Next cell">▶</button><button class="btn sm" id="last" aria-label="Fill all">⏭ Fill all</button><label class="small"><input type="checkbox" id="showTrace" checked> show traceback</label><span id="stepNo" class="small muted"></span></div>
        <div id="cellMsg" class="step-msg"></div>
        <div id="dpTable" class="dp-host"></div>
        <div id="answer" class="answer"></div>
      </div>`;
    let R = null, k = 0, timer = null;
    function inputs() { const p = P[$('#prob').value]; $('#inputs').innerHTML = p.inputs.map((i) => `<label class="small">${esc(i.label)} <input class="mono" data-k="${i.key}" value="${esc(i.def)}" size="${Math.max(6, i.def.length + 2)}"></label>`).join(''); $('#spec').innerHTML = md(p.spec); $$('#inputs input').forEach((x) => { x.onkeydown = (e) => { if (e.key === 'Enter') build(); }; }); build(); }
    function build() { stop(); const p = P[$('#prob').value]; const v = {}; $$('#inputs input').forEach((x) => { v[x.dataset.k] = x.value; }); R = p.build(v); k = R.order.length; draw(); }
    function draw() {
      const filled = new Map(); R.order.slice(0, k).forEach(([i, j], n) => filled.set(i + ',' + j, n));
      const cur = k > 0 ? R.order[k - 1] : null;
      const deps = new Set(cur ? cur[2].deps.map(([a, b]) => a + ',' + b) : []);
      const trace = new Set(k === R.order.length && $('#showTrace').checked ? R.trace.map(([a, b]) => a + ',' + b) : []);
      const rows = R.cells.map((row, i) => `<tr><th>${esc(R.rowLabels[i] ?? i)}</th>${row.map((v, j) => { const key = i + ',' + j; const cls = [cur && cur[0] === i && cur[1] === j ? 'cur' : '', deps.has(key) ? 'dep' : '', trace.has(key) ? 'trace' : '', filled.has(key) ? '' : 'empty'].join(' '); return `<td class="${cls}">${filled.has(key) ? esc(v === Infinity ? '∞' : v) : ''}</td>`; }).join('')}</tr>`).join('');
      $('#dpTable').innerHTML = `<div class="table-wrap"><table class="dp"><thead><tr><th></th>${R.colLabels.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
      $('#stepNo').textContent = `${k} / ${R.order.length} cells`;
      $('#cellMsg').textContent = cur ? `Cell (${R.rowLabels[cur[0]] ?? cur[0]}, ${R.colLabels[cur[1]] ?? cur[1]}): ${cur[2].expl}` : 'Press ▶ to fill the table in evaluation order. Highlighted cells are the subproblems this cell depends on.';
      $('#answer').innerHTML = k === R.order.length ? `<b>${esc(R.answer)}</b>` : '';
    }
    const stop = () => { if (timer) { clearInterval(timer); timer = null; $('#play').textContent = '▶ Play'; } };
    $('#first').onclick = () => { stop(); k = 0; draw(); };
    $('#last').onclick = () => { stop(); k = R.order.length; draw(); };
    $('#prev').onclick = () => { stop(); if (k > 0) { k--; draw(); } };
    $('#next').onclick = () => { stop(); if (k < R.order.length) { k++; draw(); } };
    $('#play').onclick = () => { if (timer) return stop(); if (k >= R.order.length) k = 0; $('#play').textContent = '⏸ Pause'; timer = setInterval(() => { if (!document.body.contains(host) || k >= R.order.length) { stop(); return; } k++; draw(); }, 450); };
    $('#showTrace').onchange = draw;
    $('#prob').onchange = inputs; $('#build').onclick = build;
    inputs(); k = 0; draw();
  }

  /* ------------------------------------------------------- recurrence */
  const REC_EX = [
    ['Mergesort', '2*T(n/2) + n', 'n*log(n)'],
    ['Binary search', 'T(n/2) + 1', 'log(n)'],
    ['Karatsuba', '3*T(n/2) + n', 'n^1.585'],
    ['Strassen-like', '7*T(n/2) + n^2', 'n^2.807'],
    ['Median of medians', 'T(n/5) + T(7*n/10) + n', 'n'],
    ['Selection sort-ish', 'T(n-1) + n', 'n^2'],
    ['Quadratic leaves', '4*T(n/2) + n', 'n^2'],
    ['Balanced: n² log n', '4*T(n/2) + n^2', 'n^2*log(n)'],
    ['Root-heavy', '2*T(n/2) + n^2', 'n^2'],
    ['n log² n', '2*T(n/2) + n*log(n)', 'n*log(n)^2'],
    ['Square-root', 'T(sqrt(n)) + 1', 'log(log(n))'],
    ['Square-root ×2', '2*T(sqrt(n)) + log(n)', 'log(n)*log(log(n))'],
    ['Fibonacci-like', 'T(n-1) + T(n-2) + 1', '1.618^n'],
  ];
  function recurrenceLab(host) {
    host.innerHTML = `
      <div class="lab-grid">
        <div class="card">
          <h3>Master theorem: $T(n) = a\\,T(n/b) + f(n)$</h3>
          <div class="w-row small"><label>a <input id="ma" type="number" value="2" step="any" style="width:5em"></label><label>b <input id="mb" type="number" value="2" step="any" style="width:5em"></label><label>f(n) = n^ <input id="mc" type="number" value="1" step="any" style="width:5em"></label><label>· log^ <input id="mk" type="number" value="0" step="any" style="width:4em"> n</label></div>
          <div id="master" class="prose"></div>
        </div>
        <div class="card">
          <h3>Numeric evaluator</h3>
          <div class="w-row small"><select id="recEx"><option value="">Examples…</option>${REC_EX.map((e, i) => `<option value="${i}">${esc(e[0])}: T(n) = ${esc(e[1])}</option>`).join('')}</select></div>
          <div class="w-row small"><label>T(n) = <input id="rexpr" class="mono" size="26" value="2*T(n/2) + n"></label><label>for n ≤ <input id="rbase" type="number" value="1" style="width:4em"></label><label>T = <input id="rbaseval" type="number" value="1" style="width:4em"></label></div>
          <div class="w-row small"><label>Guess g(n) = <input id="rguess" class="mono" size="18" value="n*log(n)"></label><button class="btn sm primary" id="reval">Evaluate</button></div>
          <div class="small muted">Use <code>T(...)</code>, <code>n</code>, <code>log</code> (base 2), <code>sqrt</code>, <code>^</code>. Arguments are floored. If the ratio T(n)/g(n) levels off to a constant, your guess is the right Θ.</div>
          <div id="rout"></div>
        </div>
      </div>`;
    host.querySelector('h3').innerHTML = md('Master theorem: $T(n) = a\\,T(n/b) + f(n)$').replace(/^<p>|<\/p>$/g, '');
    function master() {
      const a = +$('#ma').value, b = +$('#mb').value, c = +$('#mc').value, k = +$('#mk').value;
      if (!(a >= 1) || !(b > 1)) { $('#master').innerHTML = '<p class="bad">Need a ≥ 1 and b > 1.</p>'; return; }
      const crit = Math.log(a) / Math.log(b); const r = a / Math.pow(b, c);
      const f = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(3));
      const fn = `n^{${f(c)}}${k ? `\\log^{${f(k)}} n` : ''}`;
      let res, why;
      const eq = Math.abs(c - crit) < 1e-9;
      if (!eq && c < crit) { res = `\\Theta(n^{\\log_{${f(b)}} ${f(a)}}) = \\Theta(n^{${f(crit)}})`; why = `Level sums **increase** geometrically (ratio $a/b^c = ${f(r)} > 1$), so the **leaves dominate**: there are $a^{\\log_b n} = n^{\\log_b a}$ leaves.`; }
      else if (!eq && c > crit) { res = `\\Theta(${fn})`; why = `Level sums **decrease** geometrically (ratio $a/b^c = ${f(r)} < 1$), so the **root dominates**: $T(n) = \\Theta(f(n))$.`; }
      else if (k > -1) { res = `\\Theta(n^{${f(c)}}\\log^{${f(k + 1)}} n)`; why = `Every level costs about the same ($a/b^c = 1$), and there are $\\log_b n$ levels: multiply $f(n)$ by $\\log n$.`; }
      else if (k === -1) { res = `\\Theta(n^{${f(c)}}\\log\\log n)`; why = 'Level $i$ costs $n^c/\\log(n/b^i)$, a harmonic sum over levels ⇒ extra $\\log\\log n$ factor.'; }
      else { res = `\\Theta(n^{${f(c)}})`; why = 'Level sums form a convergent series (log exponent < −1) ⇒ dominated by the leaves.'; }
      const levels = [0, 1, 2].map((i) => `| ${i} | $${f(Math.pow(a, i))}$ | $f(n/${f(Math.pow(b, i))})$ | $${i === 0 ? 'f(n)' : `(${f(r)})^{${i}}\\,${fn}`}$ |`).join('\n');
      $('#master').innerHTML = md(`$$T(n) = ${f(a)}\\,T(n/${f(b)}) + ${fn}\\quad\\Longrightarrow\\quad T(n) = ${res}$$

${why}

**Recursion tree** (depth $\\log_{${f(b)}} n$; ignoring the log factor in level sums):

| level | # nodes | cost per node | level total |
|---|---|---|---|
${levels}
| … | … | … | … |
| $\\log_b n$ | $n^{\\log_b a} = n^{${f(crit)}}$ | $\\Theta(1)$ | $\\Theta(n^{${f(crit)}})$ |

Compare $c = ${f(c)}$ with $\\log_b a = ${f(crit)}$.`);
    }
    function evaluate() {
      const out = $('#rout');
      try {
        const expr = $('#rexpr').value.replace(/\^/g, '**'); const g = $('#rguess').value.replace(/\^/g, '**');
        const base = +$('#rbase').value, bv = +$('#rbaseval').value;
        const lib = ['log', 'sqrt', 'floor', 'ceil', 'min', 'max'];
        const L = { log: (x) => Math.log2(Math.max(x, 1e-300)), sqrt: Math.sqrt, floor: Math.floor, ceil: Math.ceil, min: Math.min, max: Math.max };
        const body = new Function('T', 'n', ...lib, `return (${expr});`);
        const guess = new Function('n', ...lib, `return (${g});`);
        const memo = new Map();
        const T = (x) => { x = Math.floor(x); if (x <= base) return bv; if (memo.has(x)) return memo.get(x); const v = body(T, x, ...lib.map((k) => L[k])); memo.set(x, v); return v; };
        const ns = [8, 16, 64, 256, 1024, 4096, 16384, 65536, 262144, 1048576, 4194304, 16777216];
        const rows = [];
        for (const n of ns) {
          let v; try { v = T(n); } catch (e) { if (e instanceof RangeError) { rows.push(`<tr><td>${n}</td><td colspan="2" class="muted">recursion too deep (try smaller n)</td></tr>`); break; } throw e; }
          const gv = guess(n, ...lib.map((k) => L[k]));
          rows.push(`<tr><td class="mono">${n.toLocaleString()}</td><td class="mono">${fmtNum(v)}</td><td class="mono">${fmtNum(v / gv)}</td></tr>`);
          if (!isFinite(v)) break;
        }
        out.innerHTML = `<div class="table-wrap"><table class="small"><thead><tr><th>n</th><th>T(n)</th><th>T(n) / g(n)</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      } catch (e) { out.innerHTML = `<p class="bad">${esc(e.message)}</p>`; }
    }
    const fmtNum = (x) => (!isFinite(x) ? '∞' : Math.abs(x) >= 1e7 || (Math.abs(x) < 1e-3 && x !== 0) ? x.toExponential(3) : (Math.round(x * 1000) / 1000).toLocaleString());
    ['ma', 'mb', 'mc', 'mk'].forEach((id) => { $('#' + id).oninput = master; });
    $('#reval').onclick = evaluate;
    $('#recEx').onchange = () => { const e = REC_EX[+$('#recEx').value]; if (!e) return; $('#rexpr').value = e[1]; $('#rguess').value = e[2]; $('#rbase').value = /sqrt/.test(e[1]) ? 2 : 1; evaluate(); };
    master(); evaluate();
  }

  root.Labs = { LIST, render };
})(window);
