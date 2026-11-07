#!/usr/bin/env node
/* Validates content files: structure, string hygiene, embedded widgets, and that
 * every auto-graded problem's `sample` answer agrees with its `accepts` predicate.
 * Usage: node tools/validate.js [content/foo.js ...]   (default: all content/*.js) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const A = require(path.join(ROOT, 'js/core/automata.js'));
const C = require(path.join(ROOT, 'js/core/cfg.js'));
const T = require(path.join(ROOT, 'js/core/tm.js'));
const G = require(path.join(ROOT, 'js/core/grader.js'));

const ORDER = { strings: 1, regex: 2, dfa: 3, nfa: 4, closure: 5, nonregular: 6, cfg: 7, tm: 8, undecidable: 9, recursion: 10, divide: 11, backtracking: 12, dp: 13, dp2: 14, graphs: 15, dags: 16, shortest: 17, mst: 18, np: 19 };
let files = process.argv.slice(2);
if (!files.length) files = fs.readdirSync(path.join(ROOT, 'content')).filter((f) => f.endsWith('.js')).map((f) => path.join('content', f));

let BASELINE = {};
try { BASELINE = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline.json'), 'utf8')); } catch (e) { /* no baseline */ }
let totalErr = 0, totalWarn = 0;
const allIds = new Map();

function walkStrings(obj, where, cb) {
  if (typeof obj === 'string') return cb(obj, where);
  if (Array.isArray(obj)) return obj.forEach((x, i) => walkStrings(x, `${where}[${i}]`, cb));
  if (obj && typeof obj === 'object') for (const k of Object.keys(obj)) if (typeof obj[k] !== 'function') walkStrings(obj[k], `${where}.${k}`, cb);
}

for (const file of files) {
  const errs = [], warns = [];
  const E = (m) => errs.push(m), W = (m) => warns.push(m);
  const full = path.resolve(ROOT, file);
  const topics = [];
  const ctx = { CS374: { topic: (t) => topics.push(t) }, console, Math, JSON, Array, Object, String, Number, Set, Map };
  ctx.globalThis = ctx;
  try {
    const src = fs.readFileSync(full, 'utf8');
    if (/```/.test(src)) W('File contains triple backticks — use ~~~ fences inside String.raw templates.');
    vm.runInNewContext(src, ctx, { filename: file });
  } catch (e) { E('Failed to load: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
  if (topics.length !== 1 && !errs.length) E(`Expected exactly one CS374.topic(...) call, found ${topics.length}.`);
  const t = topics[0];
  if (t) {
    const base = path.basename(file, '.js');
    if (t.id !== base) E(`id "${t.id}" does not match filename "${base}".`);
    if (ORDER[t.id] && t.order !== ORDER[t.id]) W(`order is ${t.order}, expected ${ORDER[t.id]}.`);
    for (const f of ['title', 'summary', 'lesson', 'unit']) if (typeof t[f] !== 'string' || !t[f].trim()) E(`Missing string field "${f}".`);
    if (!['models', 'algorithms'].includes(t.unit)) E(`unit must be 'models' or 'algorithms'.`);
    if (!Array.isArray(t.quiz) || !t.quiz.length) E('quiz must be a non-empty array.');
    if (!Array.isArray(t.flashcards) || !t.flashcards.length) E('flashcards must be a non-empty array.');
    if (!Array.isArray(t.problems) || !t.problems.length) E('problems must be a non-empty array.');
    if (!t.cheatsheet) W('No cheatsheet.');
    // append-only rules (saved progress is keyed by quiz/flashcard index and problem id)
    const B = BASELINE[t.id];
    if (B) {
      if ((t.quiz || []).length < B.quiz) E(`quiz shrank from ${B.quiz} to ${t.quiz.length} — only APPEND questions.`);
      if ((t.flashcards || []).length < B.cards) E(`flashcards shrank from ${B.cards} to ${t.flashcards.length} — only APPEND cards.`);
      const ids = new Set((t.problems || []).map((p) => p.id));
      B.ids.forEach((id) => { if (!ids.has(id)) E(`existing problem id "${id}" was removed or renamed — keep it.`); });
      let moved = 0;
      B.q0.forEach((s, i) => { if (t.quiz[i] && String(t.quiz[i].q).slice(0, 40) !== s) moved++; });
      B.c0.forEach((s, i) => { if (t.flashcards[i] && String(t.flashcards[i].front).slice(0, 40) !== s) moved++; });
      if (moved > 2) E(`${moved} existing quiz questions/flashcards changed position or text start — append new ones at the END instead of inserting.`);
      else if (moved) W(`${moved} existing quiz question/flashcard text changed at its start (fine if it was an in-place fix).`);
    }

    // string hygiene
    walkStrings(t, t.id, (s, where) => {
      // eslint-disable-next-line no-control-regex
      const cc = s.match(/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
      if (cc) E(`${where}: contains control character 0x${cc[0].charCodeAt(0).toString(16)} — a backslash escape (\\f, \\b, \\v, ...) was interpreted. Use String.raw.`);
      if (/\t/.test(s) && /\\/.test(s) === false && /\$/.test(s)) W(`${where}: contains a TAB inside math-looking text (maybe "\\t" from \\text/\\times eaten?).`);
      const stripped = s.replace(/\\\$/g, '').replace(/~~~[\s\S]*?~~~/g, '');
      const n = (stripped.match(/\$/g) || []).length;
      if (n % 2) W(`${where}: odd number of $ math delimiters.`);
      if (/```/.test(s)) E(`${where}: triple backticks are not supported; use ~~~.`);
    });

    // embedded widgets in markdown fields
    walkStrings(t, t.id, (s, where) => {
      const re = /^~~~(\w+)[^\n]*\n([\s\S]*?)^~~~\s*$/gm; let m;
      while ((m = re.exec(s))) {
        const lang = m[1], body = m[2];
        const lines = body.split('\n'); let alpha = null;
        const rest = lines.filter((l) => { const am = l.match(/^\s*alphabet\s*:\s*(.*)$/i); if (am) { alpha = am[1].replace(/[\s,{}]/g, ''); return lang === 'automaton'; } return true; }).join('\n');
        if (lang === 'automaton') { const r = A.parseMachine(rest); if (r.errors.length) E(`${where}: ~~~automaton widget: ${r.errors.join(' ')}`); }
        else if (lang === 'regex') { try { A.parseRegex(rest.trim().split('\n')[0]); } catch (e) { E(`${where}: ~~~regex widget: ${e.message}`); } }
        else if (lang === 'cfg') { const r = C.parseGrammar(rest); if (r.errors.length) E(`${where}: ~~~cfg widget: ${r.errors.join(' ')}`); }
        else if (lang === 'tm') { const r = T.parseTM(rest); if (r.errors.length) E(`${where}: ~~~tm widget: ${r.errors.join(' ')}`); }
        void alpha;
      }
    });

    // quiz
    (t.quiz || []).forEach((q, i) => {
      const w = `quiz[${i}]`;
      if (!q.q) E(`${w}: missing q.`);
      if (!q.explain) E(`${w}: missing explain.`);
      if (q.type === 'mc') { if (!Array.isArray(q.choices) || q.choices.length < 2) E(`${w}: mc needs choices.`); else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) E(`${w}: answer index out of range.`); }
      else if (q.type === 'multi') { if (!Array.isArray(q.answer) || !q.answer.length || q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= (q.choices || []).length)) E(`${w}: multi answer must be an array of valid indices.`); }
      else if (q.type === 'tf') { if (typeof q.answer !== 'boolean') E(`${w}: tf answer must be boolean.`); }
      else if (q.type === 'short') { if (!Array.isArray(q.answer) || !q.answer.length) E(`${w}: short answer must be a non-empty array of strings.`); }
      else E(`${w}: unknown type "${q.type}".`);
    });
    (t.flashcards || []).forEach((c, i) => { if (!c.front || !c.back) E(`flashcards[${i}]: needs front and back.`); });

    // problems
    for (const [i, p] of (t.problems || []).entries()) {
      const w = `problem ${p.id || '#' + i}`;
      if (!p.id) { E(`problems[${i}]: missing id.`); continue; }
      if (allIds.has(p.id)) E(`${w}: duplicate id (also in ${allIds.get(p.id)}).`); else allIds.set(p.id, file);
      for (const f of ['title', 'prompt', 'solution']) if (!p[f]) E(`${w}: missing ${f}.`);
      if (![1, 2, 3].includes(p.difficulty)) W(`${w}: difficulty should be 1, 2 or 3.`);
      if (!Array.isArray(p.hints) || !p.hints.length) W(`${w}: no hints.`);
      if (['dfa', 'nfa', 'regex', 'cfg', 'tm'].includes(p.type)) {
        if (typeof p.alphabet !== 'string' || !p.alphabet) { E(`${w}: needs alphabet string.`); continue; }
        if (typeof p.accepts !== 'function') { E(`${w}: needs accepts(s) predicate.`); continue; }
        if (!p.sample) { E(`${w}: needs a sample answer.`); continue; }
        let r;
        const t0 = Date.now();
        try { r = G.gradeLanguage(Object.assign({}, p, { sample: null }), p.sample); } catch (e) { E(`${w}: grader crashed: ${e.message}`); continue; }
        if (r.status === 'error') E(`${w}: sample answer does not parse: ${r.errors.join(' ')}`);
        else if (r.status === 'wrong') E(`${w}: sample disagrees with accepts(): ${G.describeResult(r)}`);
        if (r.warnings && r.warnings.length) r.warnings.forEach((x) => { if (!/Missing transitions/.test(x)) W(`${w}: sample warning: ${x}`); });
        const ms = Date.now() - t0;
        if (ms > 3000) W(`${w}: grading took ${ms} ms — lower maxLen.`);
      } else if (p.type === 'code') {
        if (!p.fn || typeof p.reference !== 'function' || !Array.isArray(p.tests)) { E(`${w}: code problems need fn, reference, tests.`); continue; }
        if (!p.starter) W(`${w}: no starter code.`);
        else if (!new RegExp('function\\s+' + p.fn + '\\b|' + p.fn + '\\s*=').test(p.starter)) W(`${w}: starter does not define ${p.fn}.`);
        try {
          const tests = G.buildCodeTests(p, 20);
          for (const tt of tests) {
            if (p.check && !p.check(tt.expected, tt.expected, JSON.parse(JSON.stringify(tt.args)))) { E(`${w}: check() rejects the reference output on args ${JSON.stringify(tt.args).slice(0, 120)}.`); break; }
          }
          // determinism: running the reference twice must agree
          for (const tt of tests) { const out = JSON.parse(JSON.stringify(p.reference(...JSON.parse(JSON.stringify(tt.args))) ?? null)); if (!(p.check ? p.check(out, tt.expected, tt.args) : G.deepEqual(out, tt.expected))) { E(`${w}: reference gives different outputs on the same input (mutates its arguments or is random?).`); break; } }
        } catch (e) { E(`${w}: running reference/gen failed: ${e.message}`); }
      } else if (p.type === 'written') {
        if (!Array.isArray(p.rubric) || !p.rubric.length) W(`${w}: no rubric.`);
      } else E(`${w}: unknown type "${p.type}".`);
    }
  }
  const counts = t ? `quiz ${t.quiz?.length || 0}, cards ${t.flashcards?.length || 0}, problems ${t.problems?.length || 0} (${(t.problems || []).filter((p) => p.type !== 'written').length} auto-graded), lesson ${Math.round((t.lesson || '').split(/\s+/).length)} words` : '';
  console.log(`\n${errs.length ? '✗' : '✓'} ${file}  ${counts}`);
  errs.forEach((e) => console.log('  ERROR  ' + e));
  warns.forEach((e) => console.log('  warn   ' + e));
  totalErr += errs.length; totalWarn += warns.length;
}
console.log(`\n${totalErr} error(s), ${totalWarn} warning(s).`);
process.exit(totalErr ? 1 : 0);
