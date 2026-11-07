/* Grading for auto-graded problems (automata / regex / CFG / TM / code). */
(function (root) {
  'use strict';
  const A = root.Automata || (typeof require !== 'undefined' ? require('./automata.js') : null);
  const C = root.CFG || (typeof require !== 'undefined' ? require('./cfg.js') : null);
  const T = root.TM || (typeof require !== 'undefined' ? require('./tm.js') : null);

  const REGULAR = new Set(['dfa', 'nfa', 'regex']);
  const show = (s) => (s === '' ? 'ε' : s);

  /** Compile answer text of a given kind into {accepts(s), machine?, errors, warnings}. */
  function compile(kind, text, alphabet) {
    const warnings = [];
    if (kind === 'dfa' || kind === 'nfa') {
      const r = A.parseMachine(text);
      if (!r.machine) return { errors: r.errors, warnings: r.warnings };
      warnings.push(...r.warnings);
      const errors = [];
      const foreign = A.foreignSymbols(r.machine, alphabet);
      if (foreign.length) warnings.push(`Transitions on symbols outside Σ = {${[...alphabet].join(',')}} are never used: ${foreign.join(', ')}.`);
      if (kind === 'dfa') {
        const chk = A.checkDFA(r.machine, alphabet);
        errors.push(...chk.errors);
        if (chk.missing.length) warnings.push(`Missing transitions (treated as going to a hidden dead state): ${chk.missing.slice(0, 8).join('; ')}${chk.missing.length > 8 ? '; …' : ''}.`);
      }
      if (errors.length) return { errors, warnings };
      const m = r.machine;
      return { machine: m, accepts: (s) => A.accepts(m, s), errors: [], warnings };
    }
    if (kind === 'regex') {
      try {
        const ast = A.parseRegex(text);
        const foreign = [...A.regexSymbols(ast)].filter((c) => !alphabet.includes(c));
        if (foreign.length) warnings.push(`Symbols not in Σ: ${foreign.join(', ')}.`);
        const m = A.trim(A.removeEps(A.regexToNFA(ast, alphabet)));
        return { machine: m, ast, accepts: (s) => A.accepts(m, s), errors: [], warnings };
      } catch (e) { return { errors: [e.message], warnings }; }
    }
    if (kind === 'cfg') {
      const r = C.parseGrammar(text);
      if (!r.grammar) return { errors: r.errors, warnings: r.warnings };
      const foreign = [...r.grammar.terminals].filter((c) => !alphabet.includes(c));
      if (foreign.length) r.warnings.push(`Terminals not in Σ: ${foreign.join(', ')} (if you meant a nonterminal, use an uppercase letter).`);
      const g = r.grammar;
      return { grammar: g, accepts: (s) => C.accepts(g, s), errors: [], warnings: r.warnings };
    }
    if (kind === 'tm') {
      const r = T.parseTM(text);
      if (!r.tm) return { errors: r.errors, warnings: r.warnings };
      const tm = r.tm;
      return { tm, accepts: (s) => { const x = T.runTM(tm, s, 20000); if (x.result === 'timeout') throw Object.assign(new Error('timeout'), { timeout: true }); return x.result === 'accept'; }, errors: [], warnings: r.warnings };
    }
    return { errors: ['Unknown answer type ' + kind], warnings };
  }

  function maxLenFor(problem) {
    if (problem.maxLen != null) return problem.maxLen;
    if (problem.type === 'cfg') return C.defaultMaxLen(problem.alphabet, 4000, 10);
    if (problem.type === 'tm') return Math.min(6, A.defaultMaxLen(problem.alphabet, 400, 6));
    return A.defaultMaxLen(problem.alphabet, 20000, 14);
  }

  /** Grade a language problem. Returns
   * {status:'correct'|'wrong'|'error', errors, warnings, counterexample, shouldAccept, tested, maxLen, exact} */
  function gradeLanguage(problem, text) {
    const kind = problem.type, alphabet = problem.alphabet;
    const ans = compile(kind, text, alphabet);
    if (ans.errors && ans.errors.length) return { status: 'error', errors: ans.errors, warnings: ans.warnings || [] };
    const maxLen = maxLenFor(problem);
    const warnings = ans.warnings || [];
    // exact comparison for regular kinds when a regular sample is available
    if (REGULAR.has(kind) && problem.sample && ans.machine) {
      const ref = compile(kind === 'regex' ? 'regex' : 'nfa', problem.sample, alphabet);
      if (ref.machine) {
        const eq = A.equivalent(ans.machine, ref.machine, alphabet);
        if (eq.equal === true) return { status: 'correct', warnings, exact: true, maxLen };
        if (eq.equal === false) {
          return { status: 'wrong', warnings, counterexample: eq.counterexample, shouldAccept: !eq.inFirst, exact: true, maxLen };
        }
      }
    }
    let tested = 0, bad = null;
    try {
      A.forAllStrings(alphabet, maxLen, (s) => {
        tested++;
        let got;
        try { got = ans.accepts(s); } catch (e) { if (e.timeout) { bad = { s, timeout: true }; return false; } throw e; }
        const want = !!problem.accepts(s);
        if (got !== want) { bad = { s, want }; return false; }
        return true;
      });
    } catch (e) { return { status: 'error', errors: ['Grader error: ' + e.message], warnings }; }
    if (bad && bad.timeout) return { status: 'wrong', warnings, counterexample: bad.s, timeout: true, tested, maxLen };
    if (bad) return { status: 'wrong', warnings, counterexample: bad.s, shouldAccept: bad.want, tested, maxLen };
    return { status: 'correct', warnings, tested, maxLen, exact: false };
  }

  function describeResult(r) {
    if (r.status === 'correct') return r.exact ? 'Correct — your answer describes exactly the target language.' : `Correct on all ${r.tested} strings of length ≤ ${r.maxLen}.`;
    if (r.status === 'error') return 'Could not read your answer.';
    if (r.timeout) return `Your machine did not halt within 20,000 steps on input "${show(r.counterexample)}".`;
    return `Counterexample: "${show(r.counterexample)}" should be ${r.shouldAccept ? 'ACCEPTED' : 'REJECTED'}, but your answer ${r.shouldAccept ? 'rejects' : 'accepts'} it.`;
  }

  /* ----------------------------------------------------------- code runner */
  const clone = (x) => (x === undefined ? null : JSON.parse(JSON.stringify(x)));
  function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  function buildCodeTests(problem, randomCount = 25) {
    const tests = (problem.tests || []).map((a) => ({ args: clone(a), random: false }));
    if (problem.gen) for (let i = 0; i < randomCount; i++) { try { tests.push({ args: clone(problem.gen()), random: true }); } catch (e) { /* ignore */ } }
    for (const t of tests) t.expected = clone(problem.reference(...clone(t.args)));
    return tests;
  }

  const WORKER_SRC = `
    self.onmessage = function (e) {
      var d = e.data, logs = [];
      var fmt = function (x) { try { return typeof x === 'string' ? x : JSON.stringify(x); } catch (_) { return String(x); } };
      self.console = { log: function () { if (logs.length < 200) logs.push(Array.prototype.map.call(arguments, fmt).join(' ')); } };
      console.error = console.warn = console.info = console.log;
      var f;
      try { f = (new Function(d.code + '\\n;return (typeof ' + d.fn + ' === "function") ? ' + d.fn + ' : undefined;'))(); }
      catch (err) { postMessage({ compileError: String(err), logs: logs }); return; }
      if (!f) { postMessage({ compileError: 'Function ' + d.fn + ' is not defined (check the name).', logs: logs }); return; }
      var results = [];
      for (var i = 0; i < d.tests.length; i++) {
        var t0 = Date.now();
        try { var out = f.apply(null, JSON.parse(JSON.stringify(d.tests[i]))); results.push({ out: out === undefined ? null : JSON.parse(JSON.stringify(out)), ms: Date.now() - t0 }); }
        catch (err) { results.push({ error: (err && err.message) ? err.message : String(err) }); }
      }
      postMessage({ results: results, logs: logs });
    };`;

  function runCode(problem, code, timeoutMs = 4000) {
    const tests = buildCodeTests(problem);
    const finish = (msg) => {
      if (msg.compileError) return { status: 'error', errors: [msg.compileError], logs: msg.logs || [] };
      const rows = tests.map((t, i) => {
        const r = msg.results[i];
        let pass = false;
        if (r && !r.error) { try { pass = problem.check ? !!problem.check(r.out, t.expected, clone(t.args)) : deepEqual(r.out, t.expected); } catch (e) { pass = false; } }
        return { args: t.args, expected: t.expected, out: r ? r.out : undefined, error: r && r.error, pass, random: t.random };
      });
      const passed = rows.filter((r) => r.pass).length;
      return { status: passed === rows.length ? 'correct' : 'wrong', rows, passed, total: rows.length, logs: msg.logs || [] };
    };
    return new Promise((resolve) => {
      let worker;
      try { worker = new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }))); }
      catch (e) {
        // fallback: run inline (no timeout protection)
        try {
          const f = (new Function(code + '\n;return (typeof ' + problem.fn + ' === "function") ? ' + problem.fn + ' : undefined;'))();
          if (!f) return resolve(finish({ compileError: 'Function ' + problem.fn + ' is not defined.' }));
          const results = tests.map((t) => { try { return { out: clone(f(...clone(t.args))) }; } catch (err) { return { error: err.message }; } });
          return resolve(finish({ results }));
        } catch (err) { return resolve(finish({ compileError: String(err) })); }
      }
      const timer = setTimeout(() => { worker.terminate(); resolve({ status: 'error', errors: [`Timed out after ${timeoutMs / 1000}s (infinite loop, or exponential time on the larger tests?).`], logs: [] }); }, timeoutMs);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve(finish(e.data)); };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ status: 'error', errors: [e.message || 'Error in code'], logs: [] }); e.preventDefault && e.preventDefault(); };
      worker.postMessage({ code, fn: problem.fn, tests: tests.map((t) => t.args) });
    });
  }

  const API = { compile, gradeLanguage, describeResult, maxLenFor, buildCodeTests, runCode, deepEqual, show };
  root.Grader = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
