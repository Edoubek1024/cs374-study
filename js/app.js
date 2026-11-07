/* CS 374 Study — main application (router, progress store, pages). */
(function () {
  'use strict';
  const { esc } = window.MD;
  const md = (s, o) => window.MD.md(s, o);
  const mdi = (s) => window.MD.mdInline(s);
  const $ = (sel, r = document) => r.querySelector(sel);
  const $$ = (sel, r = document) => [...r.querySelectorAll(sel)];
  const main = () => $('#main');

  /* ------------------------------------------------------------- content */
  const TOPICS = (window.CS374.topics || []).slice().sort((a, b) => (a.order || 99) - (b.order || 99));
  const TOPIC = new Map(TOPICS.map((t) => [t.id, t]));
  const PROBLEM = new Map();
  TOPICS.forEach((t) => (t.problems || []).forEach((p) => { p.topic = t.id; PROBLEM.set(p.id, p); }));
  const UNITS = [
    { id: 'models', title: 'Models of Computation', blurb: 'Strings, regular languages, automata, grammars, Turing machines, undecidability.' },
    { id: 'algorithms', title: 'Algorithms', blurb: 'Recursion, divide & conquer, dynamic programming, graphs, shortest paths, MSTs, NP-hardness.' },
  ];
  const TYPE_LABEL = { dfa: 'DFA', nfa: 'NFA', regex: 'Regex', cfg: 'Grammar', tm: 'Turing machine', code: 'Code', written: 'Written' };
  const AUTO = new Set(['dfa', 'nfa', 'regex', 'cfg', 'tm', 'code']);

  /* --------------------------------------------------------------- store */
  const KEY = 'cs374-study-v1';
  const blank = () => ({ lessons: {}, quiz: {}, problems: {}, cards: {}, exams: [], days: [], last: null, settings: {} });
  let S = blank();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* storage unavailable */ }
  let saveTimer = null;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }, 150); }
  function touchDay() { const d = new Date().toISOString().slice(0, 10); if (!S.days.includes(d)) { S.days.push(d); if (S.days.length > 400) S.days.shift(); save(); } }
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const prob = (id) => (S.problems[id] = S.problems[id] || {});
  const isSolved = (id) => { const p = S.problems[id]; return !!(p && (p.solved || p.self === 'good')); };

  function topicStats(t) {
    const probs = t.problems || [];
    const solved = probs.filter((p) => isSolved(p.id)).length;
    const q = S.quiz[t.id] || {};
    const qs = (t.quiz || []).length;
    const qCorrect = Object.values(q.items || {}).filter((x) => x.last).length;
    const best = q.best || 0;
    const cards = (t.flashcards || []).length;
    const mastered = (t.flashcards || []).filter((_, i) => ((S.cards[t.id + ':' + i] || {}).box || 0) >= 3).length;
    const lesson = !!S.lessons[t.id];
    const pct = Math.round(100 * ((lesson ? 0.2 : 0) + 0.3 * Math.max(best, qs ? qCorrect / qs : 0) + (probs.length ? 0.4 * solved / probs.length : 0.4) + (cards ? 0.1 * mastered / cards : 0.1)));
    return { solved, total: probs.length, qCorrect, qs, best, cards, mastered, lesson, pct: Math.min(100, pct) };
  }

  /* ---------------------------------------------------------- flashcards */
  const DAY = 864e5;
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64];
  function cardKey(t, i) { return t.id + ':' + i; }
  function isDue(key) { const c = S.cards[key]; return !c || !c.due || c.due <= Date.now(); }
  function isNew(key) { return !S.cards[key]; }
  function rateCard(key, rating) {
    const c = S.cards[key] || { box: 0 };
    if (rating === 0) { c.box = 0; c.due = Date.now() + 60e3; }
    else if (rating === 1) { c.box = Math.max(1, c.box); c.due = Date.now() + Math.max(0.5, INTERVALS[c.box] / 2) * DAY; }
    else if (rating === 2) { c.box = Math.min(INTERVALS.length - 1, c.box + 1); c.due = Date.now() + INTERVALS[c.box] * DAY; }
    else { c.box = Math.min(INTERVALS.length - 1, c.box + 2); c.due = Date.now() + INTERVALS[c.box] * DAY * 1.3; }
    c.seen = (c.seen || 0) + 1; S.cards[key] = c; save(); touchDay();
  }
  function dueCards(topicIds) {
    const out = [];
    TOPICS.forEach((t) => { if (topicIds && !topicIds.includes(t.id)) return; (t.flashcards || []).forEach((c, i) => { const k = cardKey(t, i); if (!isNew(k) && isDue(k)) out.push({ t, i, c, k }); }); });
    return out;
  }

  /* ---------------------------------------------------------------- shell */
  function sidebar() {
    const due = dueCards().length;
    const unitHtml = UNITS.map((u) => `
      <div class="nav-unit">${esc(u.title)}</div>
      ${TOPICS.filter((t) => t.unit === u.id).map((t) => { const s = topicStats(t); return `<a class="nav-topic" data-topic="${t.id}" href="#/topic/${t.id}"><span class="nav-num">${t.order}</span><span class="nav-title">${esc(t.title)}</span><span class="mini-bar" title="${s.pct}%"><i style="width:${s.pct}%"></i></span></a>`; }).join('')}`).join('');
    $('#sidebar').innerHTML = `
      <a class="brand" href="#/"><span class="logo">374</span><span><b>CS 374 Study</b><small>Algorithms &amp; Models of Computation</small></span></a>
      <form class="search" onsubmit="location.hash='#/search?q='+encodeURIComponent(this.q.value);return false"><input name="q" type="search" placeholder="Search everything…" aria-label="Search"></form>
      <nav class="nav-main">
        <a href="#/" data-nav="home">🏠 Dashboard</a>
        <a href="#/review" data-nav="review">🔁 Review ${due ? `<span class="badge">${due}</span>` : ''}</a>
        <a href="#/drills" data-nav="drills">🎯 Drills <small class="muted">∞</small></a>
        <a href="#/problems" data-nav="problems">✏️ All problems</a>
        <a href="#/midterm2" data-nav="midterm2">📝 Midterm 2</a>
        <a href="#/exam" data-nav="exam">⏱️ Exam mode</a>
        <a href="#/lab" data-nav="lab">🧪 Lab</a>
        <a href="#/cheatsheet" data-nav="cheatsheet">📄 Cheat sheet</a>
        <a href="#/progress" data-nav="progress">📈 Progress</a>
      </nav>
      <div class="nav-topics">${unitHtml || '<div class="muted small pad">No content loaded.</div>'}</div>
      <div class="sidebar-foot"><button class="btn sm ghost" id="themeBtn" type="button">◐ Theme</button></div>`;
    $('#themeBtn').onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      const next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next); S.settings.theme = next; save();
    };
  }
  function markNav(route) {
    $$('#sidebar a').forEach((a) => a.classList.remove('on'));
    const [head, id] = route;
    if (head === 'topic' || head === 'problem') {
      const tid = head === 'topic' ? id : (PROBLEM.get(id) || {}).topic;
      const a = $(`#sidebar a[data-topic="${tid}"]`); if (a) a.classList.add('on');
    } else { const a = $(`#sidebar a[data-nav="${head || 'home'}"]`); if (a) a.classList.add('on'); }
    document.body.classList.remove('nav-open');
  }

  function setMain(html) { const m = main(); m.innerHTML = html; window.Widgets.hydrate(m); m.scrollTop = 0; window.scrollTo(0, 0); }

  const pill = (txt, cls = '') => `<span class="pill ${cls}">${txt}</span>`;
  const diffDots = (d) => `<span class="diff d${d}" title="${['', 'Easy', 'Medium', 'Hard'][d] || ''}">${'●'.repeat(d || 1)}${'○'.repeat(3 - (d || 1))}</span>`;
  function statusPill(id) {
    const p = S.problems[id];
    if (!p) return '';
    if (p.solved) return pill('✓ solved', 'good');
    if (p.self === 'good') return pill('✓ got it', 'good');
    if (p.self === 'partial') return pill('~ partial', 'warn');
    if (p.self === 'missed') return pill('✗ review', 'bad');
    if (p.attempts) return pill('attempted', 'warn');
    return '';
  }

  /* ------------------------------------------------------------ dashboard */
  function pageHome() {
    const all = TOPICS.map((t) => [t, topicStats(t)]);
    const overall = all.length ? Math.round(all.reduce((a, [, s]) => a + s.pct, 0) / all.length) : 0;
    const solved = all.reduce((a, [, s]) => a + s.solved, 0), totalP = all.reduce((a, [, s]) => a + s.total, 0);
    const due = dueCards().length;
    const next = all.find(([, s]) => s.pct < 100);
    const last = S.last && S.last.route && S.last.label ? S.last : null;
    setMain(`
      <section class="hero">
        <div>
          <h1>CS 374 Study</h1>
          <p class="lead">Learn and practice every topic in UIUC's <em>Introduction to Algorithms &amp; Models of Computation</em>: lessons with live demos, quizzes, spaced-repetition flashcards, and auto-graded practice that shows you a counterexample when you're wrong.</p>
          <div class="hero-actions">
            ${last ? `<a class="btn primary" href="${last.route}">Continue: ${esc(last.label)}</a>` : next ? `<a class="btn primary" href="#/topic/${next[0].id}">Start: ${esc(next[0].title)}</a>` : ''}
            <a class="btn" href="#/drills">🎯 Endless drills</a>
            <a class="btn" href="#/review">Review ${due ? `(${due} due)` : 'flashcards'}</a>
            <a class="btn" href="#/midterm2">📝 Midterm 2 prep</a>
            <a class="btn" href="#/exam">Practice exam</a>
          </div>
        </div>
        <div class="stats">
          <div class="stat"><b>${overall}%</b><span>overall mastery</span></div>
          <div class="stat"><b>${solved}<small>/${totalP}</small></b><span>problems solved</span></div>
          <div class="stat"><b>${streak()}</b><span>day streak</span></div>
          <div class="stat"><b>${due}</b><span>cards due</span></div>
        </div>
      </section>
      ${UNITS.map((u) => `
        <section class="unit">
          <div class="unit-head"><h2>${esc(u.title)}</h2><p class="muted">${esc(u.blurb)}</p></div>
          <div class="cards-grid">
            ${all.filter(([t]) => t.unit === u.id).map(([t, s]) => `
              <a class="topic-card" href="#/topic/${t.id}">
                <div class="tc-top"><span class="tc-num">${t.order}</span>${s.pct >= 100 ? pill('mastered', 'good') : ''}</div>
                <h3>${esc(t.title)}</h3>
                <p>${mdi(t.summary || '')}</p>
                <div class="tc-meta"><span>${s.lesson ? '✓ lesson' : 'lesson'}</span><span>quiz ${s.qs ? Math.round(100 * Math.max(s.best, s.qCorrect / s.qs)) + '%' : '—'}</span><span>${s.solved}/${s.total} problems</span></div>
                <div class="bar"><i style="width:${s.pct}%"></i></div>
              </a>`).join('')}
          </div>
        </section>`).join('')}
      <section class="unit"><div class="unit-head"><h2>Lab</h2><p class="muted">Sandbox tools for experimenting beyond the lessons.</p></div>${labCards()}</section>`);
  }
  function labCards() {
    return `<div class="cards-grid">${window.Labs.LIST.map((l) => `<a class="topic-card lab-card" href="#/lab/${l.id}"><div class="lab-icon">${l.icon}</div><h3>${esc(l.title)}</h3><p>${esc(l.blurb)}</p></a>`).join('')}</div>`;
  }

  /* ---------------------------------------------------------------- topic */
  const TABS = [['lesson', 'Lesson'], ['quiz', 'Quiz'], ['cards', 'Flashcards'], ['practice', 'Practice'], ['sheet', 'Cheat sheet']];
  function topicHeader(t, tab) {
    const s = topicStats(t);
    const idx = TOPICS.indexOf(t);
    const prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
    return `
      <header class="page-head">
        <div class="crumbs"><a href="#/">Dashboard</a> › ${esc((UNITS.find((u) => u.id === t.unit) || {}).title || '')}</div>
        <div class="head-row"><h1><span class="tc-num big">${t.order}</span> ${esc(t.title)}</h1>
          <div class="head-nav">${prev ? `<a class="btn sm ghost" href="#/topic/${prev.id}" title="${esc(prev.title)}">← Prev</a>` : ''}${next ? `<a class="btn sm ghost" href="#/topic/${next.id}" title="${esc(next.title)}">Next →</a>` : ''}</div></div>
        <div class="bar thin"><i style="width:${s.pct}%"></i></div>
        <nav class="tabs" role="tablist">${TABS.map(([id, label]) => `<a role="tab" class="tab${tab === id ? ' on' : ''}" href="#/topic/${t.id}/${id}">${label}${id === 'quiz' && s.qs ? ` <small>${s.qs}</small>` : ''}${id === 'cards' && s.cards ? ` <small>${s.cards}</small>` : ''}${id === 'practice' && s.total ? ` <small>${s.solved}/${s.total}</small>` : ''}</a>`).join('')}</nav>
      </header>`;
  }
  function pageTopic(id, tab = 'lesson') {
    const t = TOPIC.get(id);
    if (!t) return notFound();
    S.last = { route: `#/topic/${id}/${tab}`, label: `${t.title} — ${(TABS.find((x) => x[0] === tab) || ['', ''])[1]}` }; save();
    const head = topicHeader(t, tab);
    if (tab === 'lesson') return lessonView(t, head);
    if (tab === 'quiz') return quizView(t, head);
    if (tab === 'cards') return cardsView(t, head);
    if (tab === 'practice') return practiceView(t, head);
    if (tab === 'sheet') {
      const groups = (window.NOTATION || []).filter((g) => g.topics.includes(t.id));
      setMain(`${head}<article class="prose sheet">${md(t.cheatsheet || '*No cheat sheet yet.*')}</article>
        ${groups.length ? `<details class="card prose sheet notation"><summary><b>What do the symbols mean?</b> <span class="muted small">The notation used on this sheet. <a href="#/cheatsheet" data-jump="symbols">Full symbol guide</a></span></summary>${groups.map(notationHTML).join('')}</details>` : ''}`);
      $$('[data-jump]').forEach((a) => { a.onclick = () => { pendingJump = a.dataset.jump; }; });
      return;
    }
    return notFound();
  }

  function lessonView(t, head) {
    const r = window.MD.render(t.lesson || '*Lesson coming soon.*');
    const done = !!S.lessons[t.id];
    const idx = TOPICS.indexOf(t);
    setMain(`${head}
      <div class="lesson-wrap">
        <article class="prose lesson">
          ${t.objectives && t.objectives.length ? `<div class="objectives"><b>After this lesson you should be able to</b><ul>${t.objectives.map((o) => `<li>${mdi(o)}</li>`).join('')}</ul></div>` : ''}
          ${r.html}
          <div class="lesson-end">
            <button class="btn ${done ? '' : 'primary'}" id="markRead">${done ? '✓ Lesson complete' : 'Mark lesson complete'}</button>
            <a class="btn" href="#/topic/${t.id}/quiz">Take the quiz →</a>
            ${TOPICS[idx + 1] ? `<a class="btn ghost" href="#/topic/${TOPICS[idx + 1].id}">Next topic: ${esc(TOPICS[idx + 1].title)}</a>` : ''}
          </div>
        </article>
        ${r.headings.length > 2 ? `<aside class="toc"><b>On this page</b>${r.headings.map((h) => `<a href="javascript:void 0" data-h="${h.id}">${h.html}</a>`).join('')}</aside>` : ''}
      </div>`);
    $('#markRead').onclick = () => { S.lessons[t.id] = !S.lessons[t.id] ? Date.now() : 0; if (!S.lessons[t.id]) delete S.lessons[t.id]; save(); touchDay(); sidebar(); pageTopic(t.id, 'lesson'); };
    $$('.toc a').forEach((a) => { a.onclick = () => { const h = document.getElementById(a.dataset.h); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
  }

  /* ----------------------------------------------------------------- quiz */
  const norm = (s) => String(s).toLowerCase().replace(/[\s$\\{}()]/g, '').replace(/θ|theta/g, 'θ');
  function checkAnswer(q, resp) {
    if (q.type === 'mc') return resp === q.answer;
    if (q.type === 'tf') return resp === q.answer;
    if (q.type === 'multi') { const a = [...q.answer].sort().join(','); return [...(resp || [])].sort().join(',') === a; }
    if (q.type === 'short') return q.answer.some((a) => norm(a) === norm(resp || ''));
    return false;
  }
  function questionHTML(q, name) {
    let body = '';
    if (q.type === 'mc' || q.type === 'multi') {
      body = `<div class="choices">${q.choices.map((c, i) => `<label class="choice"><input type="${q.type === 'mc' ? 'radio' : 'checkbox'}" name="${name}" value="${i}"><span class="ckey">${String.fromCharCode(65 + i)}</span><span class="ctext">${mdi(c)}</span></label>`).join('')}</div>`;
    } else if (q.type === 'tf') {
      body = `<div class="choices tf"><label class="choice"><input type="radio" name="${name}" value="true"><span class="ckey">T</span><span class="ctext">True</span></label><label class="choice"><input type="radio" name="${name}" value="false"><span class="ckey">F</span><span class="ctext">False</span></label></div>`;
    } else {
      body = `<input class="short-in mono" name="${name}" placeholder="Your answer" autocomplete="off" spellcheck="false">`;
    }
    return `<div class="q-text prose">${md(q.q)}</div>${q.type === 'multi' ? '<div class="muted small">Select all that apply.</div>' : ''}${body}`;
  }
  function readResponse(q, scope, name) {
    if (q.type === 'mc') { const x = $(`input[name="${name}"]:checked`, scope); return x ? +x.value : null; }
    if (q.type === 'tf') { const x = $(`input[name="${name}"]:checked`, scope); return x ? x.value === 'true' : null; }
    if (q.type === 'multi') return $$(`input[name="${name}"]:checked`, scope).map((x) => +x.value);
    const x = $(`input[name="${name}"]`, scope); return x && x.value.trim() ? x.value.trim() : null;
  }
  function revealAnswer(q, scope, name, correct) {
    const want = q.type === 'mc' ? [q.answer] : q.type === 'multi' ? q.answer : q.type === 'tf' ? [q.answer ? 'true' : 'false'] : [];
    $$(`input[name="${name}"]`, scope).forEach((inp) => {
      inp.disabled = true;
      const lab = inp.closest('.choice'); if (!lab) return;
      const v = q.type === 'tf' ? inp.value : +inp.value;
      if (want.includes(v)) lab.classList.add('right'); else if (inp.checked) lab.classList.add('wrong');
    });
    if (q.type === 'short') { const x = $(`input[name="${name}"]`, scope); x.disabled = true; x.classList.add(correct ? 'right' : 'wrong'); }
    const answerLine = q.type === 'short' ? `<div class="small">Accepted answer: <b>${mdi(q.answer[0])}</b></div>` : '';
    return `<div class="feedback ${correct ? 'good' : 'bad'}"><b>${correct ? '✓ Correct' : '✗ Not quite'}</b>${answerLine}<div class="prose">${md(q.explain || '')}</div></div>`;
  }
  function recordQuiz(t, qi, correct) {
    const q = (S.quiz[t.id] = S.quiz[t.id] || { items: {} });
    q.items = q.items || {};
    const it = (q.items[qi] = q.items[qi] || { a: 0, c: 0 });
    it.a++; if (correct) it.c++; it.last = correct; save(); touchDay();
  }

  function quizView(t, head, onlyIdx) {
    const all = t.quiz || [];
    if (!all.length) { setMain(`${head}<p class="muted">No quiz yet.</p>`); return; }
    let order = onlyIdx || all.map((_, i) => i);
    let k = 0, score = 0; const results = [];
    const container = () => $('#quizBox');
    setMain(`${head}<div class="quiz-wrap"><div id="quizBox" class="card quiz-card"></div></div>`);
    function renderQ() {
      if (k >= order.length) return finish();
      const qi = order[k], q = all[qi];
      container().innerHTML = `
        <div class="quiz-top"><span class="muted">Question ${k + 1} of ${order.length}</span><span class="pill">${{ mc: 'Multiple choice', multi: 'Select all', tf: 'True / False', short: 'Short answer' }[q.type] || ''}</span></div>
        <div class="bar thin"><i style="width:${(100 * k) / order.length}%"></i></div>
        <form id="qForm">${questionHTML(q, 'q')}<div id="qFb"></div>
        <div class="q-actions"><button class="btn primary" id="qSubmit" type="submit">Check</button><span class="muted small">Keys: 1–9 / T F to choose, Enter to check</span></div></form>`;
      const form = $('#qForm');
      let answered = false;
      form.onsubmit = (e) => {
        e.preventDefault();
        if (answered) { k++; renderQ(); return; }
        const resp = readResponse(q, form, 'q');
        if (resp === null || (Array.isArray(resp) && !resp.length)) { $('#qFb').innerHTML = '<div class="muted small">Pick an answer first.</div>'; return; }
        const ok = checkAnswer(q, resp);
        answered = true; if (ok) score++; results.push({ qi, ok });
        recordQuiz(t, qi, ok);
        $('#qFb').innerHTML = revealAnswer(q, form, 'q', ok);
        window.Widgets.hydrate($('#qFb'));
        $('#qSubmit').textContent = k + 1 < order.length ? 'Next question →' : 'See results';
        $('#qSubmit').focus();
      };
      const inp = $('input', form); if (inp && q.type === 'short') inp.focus();
    }
    function finish() {
      const pct = Math.round((100 * score) / order.length);
      if (!onlyIdx) { const qq = (S.quiz[t.id] = S.quiz[t.id] || { items: {} }); qq.best = Math.max(qq.best || 0, score / order.length); qq.lastScore = score / order.length; save(); }
      const missed = results.filter((r) => !r.ok).map((r) => r.qi);
      container().innerHTML = `
        <div class="quiz-done">
          <div class="big-score ${pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad'}">${pct}%</div>
          <p>${score} of ${order.length} correct.${pct >= 80 ? ' Nice work!' : ' Re-read the lesson sections for the ones you missed, then retry.'}</p>
          <div class="q-actions">${missed.length ? '<button class="btn primary" id="retryMissed">Retry the ones I missed</button>' : ''}<button class="btn" id="retryAll">Retake (shuffled)</button><a class="btn ghost" href="#/topic/${t.id}/practice">Go to practice problems →</a></div>
        </div>`;
      sidebar(); markNav(['topic', t.id]);
      const rm = $('#retryMissed'); if (rm) rm.onclick = () => quizView(t, head, missed);
      $('#retryAll').onclick = () => quizView(t, head, shuffle(all.map((_, i) => i)));
    }
    renderQ();
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // quiz keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const form = $('#qForm'); if (!form || /INPUT|TEXTAREA/.test((e.target.tagName || '')) && e.target.type !== 'radio' && e.target.type !== 'checkbox') return;
    const inputs = $$('input[type=radio],input[type=checkbox]', form).filter((x) => !x.disabled);
    if (!inputs.length) return;
    let idx = -1;
    if (/^[1-9]$/.test(e.key)) idx = +e.key - 1;
    else if (/^[a-i]$/i.test(e.key) && inputs[0].value !== 'true') idx = e.key.toLowerCase().charCodeAt(0) - 97;
    else if (e.key.toLowerCase() === 't') idx = inputs.findIndex((x) => x.value === 'true');
    else if (e.key.toLowerCase() === 'f') idx = inputs.findIndex((x) => x.value === 'false');
    if (idx >= 0 && inputs[idx]) { inputs[idx].checked = inputs[idx].type === 'checkbox' ? !inputs[idx].checked : true; e.preventDefault(); }
  });

  /* ----------------------------------------------------------- flashcards */
  function cardsSession(items, hostSel, onDone) {
    let k = 0, flipped = false;
    const host = $(hostSel);
    function render() {
      if (k >= items.length) { host.innerHTML = `<div class="quiz-done"><div class="big-score good">✓</div><p>Session complete — ${items.length} card${items.length === 1 ? '' : 's'} reviewed.</p><div class="q-actions"><a class="btn" href="#/review">Review page</a></div></div>`; sidebar(); if (onDone) onDone(); return; }
      const it = items[k]; const c = S.cards[it.k];
      host.innerHTML = `
        <div class="quiz-top"><span class="muted">Card ${k + 1} of ${items.length} · ${esc(it.t.title)}</span>${c ? pill('box ' + c.box) : pill('new', 'warn')}</div>
        <div class="flashcard${flipped ? ' flipped' : ''}" id="fc" tabindex="0" role="button" aria-label="Flip card">
          <div class="fc-face prose">${md(it.c.front)}</div>
          ${flipped ? `<div class="fc-back prose">${md(it.c.back)}</div>` : '<div class="muted small fc-hint">Click or press Space to reveal</div>'}
        </div>
        <div class="q-actions rate">${flipped ? `
          <button class="btn bad" data-r="0">Again <small>1</small></button>
          <button class="btn warn" data-r="1">Hard <small>2</small></button>
          <button class="btn good" data-r="2">Good <small>3</small></button>
          <button class="btn primary" data-r="3">Easy <small>4</small></button>` : '<button class="btn primary" id="flip">Show answer</button>'}</div>`;
      window.Widgets.hydrate(host);
      const flip = () => { if (!flipped) { flipped = true; render(); } };
      $('#fc').onclick = flip; const fb = $('#flip'); if (fb) fb.onclick = flip;
      $$('[data-r]', host).forEach((b) => { b.onclick = () => { rateCard(it.k, +b.dataset.r); if (+b.dataset.r === 0) items.push(it); k++; flipped = false; render(); }; });
    }
    if (host._keys) document.removeEventListener('keydown', host._keys);
    host._keys = (e) => {
      if (!document.body.contains(host) || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === ' ' && !flipped) { e.preventDefault(); flipped = true; render(); }
      else if (flipped && /^[1-4]$/.test(e.key)) { const b = $(`[data-r="${+e.key - 1}"]`, host); if (b) b.click(); }
    };
    document.addEventListener('keydown', host._keys);
    render();
  }
  function cardsView(t, head) {
    const cards = t.flashcards || [];
    const items = cards.map((c, i) => ({ t, i, c, k: cardKey(t, i) }));
    const due = items.filter((x) => !isNew(x.k) && isDue(x.k)), fresh = items.filter((x) => isNew(x.k));
    setMain(`${head}
      <div class="quiz-wrap">
        <div class="card-intro"><span>${due.length} due · ${fresh.length} new · ${items.length - due.length - fresh.length} scheduled later</span>
          <span><button class="btn sm" id="studyDue">Study due + new</button> <button class="btn sm ghost" id="studyAll">Study all ${items.length}</button> <button class="btn sm ghost" id="browse">Browse list</button></span></div>
        <div id="cardBox" class="card quiz-card"></div>
      </div>`);
    const startWith = (list) => cardsSession(list.length ? list : shuffle(items), '#cardBox');
    $('#studyDue').onclick = () => startWith([...due, ...fresh]);
    $('#studyAll').onclick = () => cardsSession(shuffle(items), '#cardBox');
    $('#browse').onclick = () => { $('#cardBox').innerHTML = `<div class="card-list">${items.map((x) => `<div class="card-row"><div class="prose">${md(x.c.front)}</div><div class="prose muted-strong">${md(x.c.back)}</div></div>`).join('')}</div>`; window.Widgets.hydrate($('#cardBox')); };
    startWith([...due, ...fresh]);
  }

  /* ------------------------------------------------------------- practice */
  function problemRow(p, showTopic) {
    const t = TOPIC.get(p.topic);
    return `<a class="prob-row" href="#/problem/${p.id}">
      <span class="prob-type t-${p.type}">${TYPE_LABEL[p.type] || p.type}</span>
      <span class="prob-title">${mdi(p.title)}${showTopic ? `<small class="muted"> · ${esc(t.title)}</small>` : ''}</span>
      ${diffDots(p.difficulty)} ${statusPill(p.id)}</a>`;
  }
  function practiceView(t, head) {
    const ps = (t.problems || []).slice().sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
    const auto = ps.filter((p) => AUTO.has(p.type)), written = ps.filter((p) => !AUTO.has(p.type));
    const hasDrills = window.Drills && Object.values(window.Drills.GEN).some((g) => g.topic === t.id);
    setMain(`${head}
      ${hasDrills ? `<a class="drill-banner" href="#/drills?topic=${t.id}"><b>🎯 Endless drills for this topic</b><span class="muted small">Randomly generated, instantly checked — never run out of practice.</span></a>` : ''}
      ${auto.length ? `<h3 class="sec">Auto-graded <span class="muted small">— instant feedback with counterexamples / test cases</span></h3><div class="prob-list">${auto.map((p) => problemRow(p)).join('')}</div>` : ''}
      ${written.length ? `<h3 class="sec">Written (exam-style) <span class="muted small">— write it out, then compare with the model solution & rubric</span></h3><div class="prob-list">${written.map((p) => problemRow(p)).join('')}</div>` : ''}
      ${!ps.length ? '<p class="muted">No problems yet.</p>' : ''}`);
  }

  const FORMAT_HELP = {
    dfa: String.raw`~~~pseudo
start: q0
accept: q1, q2
q0 0 -> q1        # state symbol -> target
q0 1 -> q0
q1 0,1 -> q2      # several symbols at once
~~~
Missing transitions go to an implicit dead (rejecting) state. Comments start with <code>#</code> or <code>//</code>.`,
    nfa: String.raw`~~~pseudo
start: s
accept: f
s 0 -> s, a       # several targets
s eps -> b        # ε-transition (also: ε)
a 1 -> f
~~~`,
    regex: String.raw`<code>+</code> (or <code>|</code>) = union, juxtaposition = concatenation, <code>*</code> = star, parentheses group. <code>ε</code> or <code>eps</code> = empty string, <code>∅</code> = empty language, <code>Σ</code> = any one symbol. Example: <code>(0+1)*00(0+1)*</code>`,
    cfg: String.raw`~~~pseudo
S -> 0S1 | A
A -> 1A | ε
~~~
Nonterminals: uppercase letters (<code>S</code>, <code>A'</code>, <code>A_1</code>) or <code>&lt;name&gt;</code>. Everything else is a terminal. <code>ε</code>/<code>eps</code> = empty. First rule's left side is the start symbol.`,
    tm: String.raw`~~~pseudo
start: q0
accept: qa
reject: qr
blank: _
q0 0 -> q1 X R    # state read -> new-state write move(L/R/S)
q0 _ -> qa _ R
~~~
A missing transition rejects. Tape is two-way infinite; input starts under the head.`,
  };
  function starterFor(p) {
    const sig = [...(p.alphabet || '01')];
    if (p.type === 'dfa' || p.type === 'nfa') return `start: q0\naccept: \n${sig.map((c) => `q0 ${c} -> q0`).join('\n')}\n`;
    if (p.type === 'cfg') return 'S -> ';
    if (p.type === 'tm') return 'start: q0\naccept: qa\nreject: qr\nblank: _\n';
    if (p.type === 'code') return p.starter || `function ${p.fn}() {\n  \n}\n`;
    return '';
  }

  function pageProblem(id) {
    const p = PROBLEM.get(id);
    if (!p) return notFound();
    const t = TOPIC.get(p.topic);
    const st = prob(id);
    S.last = { route: `#/problem/${id}`, label: p.title.replace(/[$*]/g, '') }; save();
    const list = (t.problems || []).slice().sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
    const i = list.indexOf(p); const prev = list[i - 1], next = list[i + 1];
    const auto = AUTO.has(p.type);
    const lang = ['dfa', 'nfa', 'regex', 'cfg', 'tm'].includes(p.type);
    const draft = st.draft != null ? st.draft : starterFor(p);
    setMain(`
      <header class="page-head">
        <div class="crumbs"><a href="#/">Dashboard</a> › <a href="#/topic/${t.id}">${esc(t.title)}</a> › <a href="#/topic/${t.id}/practice">Practice</a></div>
        <div class="head-row"><h1>${mdi(p.title)}</h1><div class="head-nav">${prev ? `<a class="btn sm ghost" href="#/problem/${prev.id}">← Prev</a>` : ''}${next ? `<a class="btn sm ghost" href="#/problem/${next.id}">Next →</a>` : ''}</div></div>
        <div class="meta-row"><span class="prob-type t-${p.type}">${TYPE_LABEL[p.type]}</span>${diffDots(p.difficulty)}${p.alphabet ? `<span class="muted small">Σ = {${[...p.alphabet].join(', ')}}</span>` : ''}${(p.tags || []).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}<span id="statusPill">${statusPill(id)}</span></div>
      </header>
      <div class="problem-grid">
        <section class="card prose prompt">${md(p.prompt)}</section>
        <section class="card work">
          ${lang ? `
            <div class="work-head"><b>Your ${TYPE_LABEL[p.type].toLowerCase()}</b><details class="fmt"><summary>Format help</summary><div class="prose small">${md(FORMAT_HELP[p.type])}</div></details></div>
            <textarea id="ans" class="editor mono" rows="${p.type === 'regex' ? 2 : 10}" spellcheck="false" aria-label="Your answer">${esc(draft)}</textarea>
            <div class="q-actions"><button class="btn primary" id="check">Check answer</button><span class="muted small">Ctrl+Enter</span>
              <span class="tester"><input id="testStr" class="mono" placeholder="try a string" spellcheck="false" aria-label="Test string"><button class="btn sm" id="testBtn">Test</button></span></div>
            <div id="testOut" class="small"></div>
            <div id="result"></div>
            <div id="preview" class="preview"></div>` : ''}
          ${p.type === 'code' ? `
            <div class="work-head"><b>Your code</b> <span class="muted small">JavaScript · define <code>${esc(p.fn)}</code></span><button class="btn sm ghost" id="resetCode" type="button">Reset to starter</button></div>
            <textarea id="ans" class="editor mono code-editor" rows="16" spellcheck="false" aria-label="Your code">${esc(draft)}</textarea>
            <div class="q-actions"><button class="btn primary" id="check">Run tests</button><span class="muted small">Ctrl+Enter · runs in a sandboxed worker with a 4 s limit</span></div>
            <div id="result"></div>` : ''}
          ${p.type === 'written' ? `
            <div class="work-head"><b>Your answer</b> <span class="muted small">(saved locally — write it as you would on the exam)</span></div>
            <textarea id="ans" class="editor" rows="12" aria-label="Your answer">${esc(st.draft || '')}</textarea>
            ${p.rubric && p.rubric.length ? (() => {
              const items = p.rubric.map((r, k) => `<label><input type="checkbox" data-rub="${k}" ${(st.rubric || [])[k] ? 'checked' : ''}> <span>${mdi(r)}</span></label>`).join('');
              // Mock-exam rubrics name the answers, so keep them folded until the student opens them.
              return (p.tags || []).some((x) => /^mt2-mock-/.test(x))
                ? `<details class="rubric"${(st.rubric || []).some(Boolean) ? ' open' : ''}><summary><b>Rubric (10 pts)</b>: it gives away the answers, so open it only after you've written yours</summary>${items}</details>`
                : `<div class="rubric"><b>Rubric — check what your answer does</b>${items}</div>`;
            })() : ''}
            <div class="q-actions"><span class="muted small">After comparing with the solution:</span>
              <button class="btn sm good" data-self="good">Got it</button><button class="btn sm warn" data-self="partial">Partially</button><button class="btn sm bad" data-self="missed">Missed it</button>
              <button class="btn sm ghost" id="copyPrompt" title="Copies a prompt you can paste into an AI tutor to grade your answer">Copy AI-grading prompt</button></div>
            <div id="result"></div>` : ''}
          <div class="help-row">
            ${(p.hints || []).length ? `<button class="btn sm ghost" id="hintBtn">💡 Hint (${(p.hints || []).length})</button>` : ''}
            <button class="btn sm ghost" id="solBtn">📖 ${st.showSol ? 'Hide' : 'Show'} solution</button>
          </div>
          <div id="hints"></div>
          <div id="solution" class="prose solution" ${st.showSol ? '' : 'hidden'}>${st.showSol ? solutionHTML(p) : ''}</div>
        </section>
      </div>`);
    const ans = $('#ans');
    if (ans) {
      ans.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && !e.shiftKey && p.type !== 'written') { e.preventDefault(); const s = ans.selectionStart; ans.setRangeText('  ', s, ans.selectionEnd, 'end'); ans.dispatchEvent(new Event('input')); }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); const c = $('#check'); if (c) c.click(); }
      });
      let tmr = null;
      ans.addEventListener('input', () => { st.draft = ans.value; save(); if (lang) { clearTimeout(tmr); tmr = setTimeout(() => preview(p, ans.value), 250); } });
      if (lang) preview(p, ans.value);
    }
    if (lang) {
      $('#check').onclick = () => {
        const r = window.Grader.gradeLanguage(p, ans.value);
        st.attempts = (st.attempts || 0) + 1; if (r.status === 'correct') { st.solved = st.solved || Date.now(); }
        save(); touchDay();
        $('#result').innerHTML = gradeHTML(r);
        $('#statusPill').innerHTML = statusPill(id); sidebar(); markNav(['problem', id]);
        if (r.status === 'wrong' && r.counterexample != null) $('#testStr').value = r.counterexample || 'ε';
      };
      const test = () => {
        const w = $('#testStr').value.trim().replace(/^ε$|^eps$/i, '');
        const c = window.Grader.compile(p.type, ans.value, p.alphabet);
        if (c.errors && c.errors.length) { $('#testOut').innerHTML = `<span class="bad">${esc(c.errors[0])}</span>`; return; }
        let got; try { got = c.accepts(w); } catch (e) { $('#testOut').innerHTML = '<span class="bad">Your machine did not halt within 20,000 steps.</span>'; return; }
        const want = !!p.accepts(w);
        $('#testOut').innerHTML = `“${esc(w || 'ε')}”: your answer <b>${got ? 'accepts' : 'rejects'}</b>; target language ${want ? '<b>contains</b>' : '<b>does not contain</b>'} it ${got === want ? '<span class="good">✓</span>' : '<span class="bad">✗</span>'}`;
        if (p.type === 'tm' && c.tm) { const host = $('#preview'); window.Widgets.tm(host, ans.value, { editable: false, input: w }); }
      };
      $('#testBtn').onclick = test; $('#testStr').onkeydown = (e) => { if (e.key === 'Enter') test(); };
    }
    if (p.type === 'code') {
      $('#resetCode').onclick = () => { if (confirm('Replace your code with the starter code?')) { ans.value = starterFor(p); st.draft = ans.value; save(); } };
      $('#check').onclick = async () => {
        $('#result').innerHTML = '<div class="muted">Running…</div>';
        const r = await window.Grader.runCode(p, ans.value);
        st.attempts = (st.attempts || 0) + 1; if (r.status === 'correct') st.solved = st.solved || Date.now();
        save(); touchDay();
        $('#result').innerHTML = codeResultHTML(r);
        $('#statusPill').innerHTML = statusPill(id); sidebar(); markNav(['problem', id]);
      };
    }
    if (p.type === 'written') {
      $$('[data-rub]').forEach((cb) => { cb.onchange = () => { st.rubric = st.rubric || []; st.rubric[+cb.dataset.rub] = cb.checked; save(); }; });
      $$('[data-self]').forEach((b) => { b.onclick = () => { st.self = b.dataset.self; st.attempts = (st.attempts || 0) + 1; save(); touchDay(); $('#statusPill').innerHTML = statusPill(id); sidebar(); markNav(['problem', id]); $('#result').innerHTML = `<div class="feedback ${st.self === 'good' ? 'good' : st.self === 'partial' ? 'warn' : 'bad'}">Recorded: ${{ good: 'got it', partial: 'partially', missed: 'missed it — it will show up in your review list' }[st.self]}.</div>`; }; });
      $('#copyPrompt').onclick = () => {
        const txt = `You are a strict but encouraging teaching assistant for UIUC CS 374 (Algorithms & Models of Computation). Grade my answer to the problem below.\n\n## Problem\n${p.prompt}\n\n## Rubric\n${(p.rubric || []).map((r, k) => `${k + 1}. ${r}`).join('\n')}\n\n## Reference solution (for grading only — do not just repeat it to me)\n${p.solution}\n\n## My answer\n${ans.value || '(empty)'}\n\nFor each rubric item, say whether my answer satisfies it and why. Point out any incorrect claims, missing cases, or gaps in rigor, the way a CS 374 grader would. Give an overall score out of 10 and one or two specific suggestions. If my approach differs from the reference but is correct, accept it.`;
        copyText(txt).then(() => { $('#copyPrompt').textContent = '✓ Copied'; setTimeout(() => { const b = $('#copyPrompt'); if (b) b.textContent = 'Copy AI-grading prompt'; }, 1800); });
      };
    }
    // hints & solution
    let shown = st.hintsShown || 0;
    const renderHints = () => { $('#hints').innerHTML = (p.hints || []).slice(0, shown).map((h, k) => `<div class="hint prose"><b>Hint ${k + 1}.</b> ${md(h)}</div>`).join(''); window.Widgets.hydrate($('#hints')); const hb = $('#hintBtn'); if (hb) { hb.textContent = shown >= p.hints.length ? '💡 All hints shown' : `💡 ${shown ? 'Next hint' : 'Hint'} (${shown}/${p.hints.length})`; hb.disabled = shown >= p.hints.length; } };
    if ($('#hintBtn')) { renderHints(); $('#hintBtn').onclick = () => { shown = Math.min(p.hints.length, shown + 1); st.hintsShown = shown; save(); renderHints(); }; }
    $('#solBtn').onclick = () => {
      const sol = $('#solution');
      if (sol.hidden) {
        if (!st.attempts && !st.solved && !(st.draft && st.draft.trim() && st.draft !== starterFor(p)) && !confirm('You haven\'t attempted this yet. Struggling first is how it sticks — show the solution anyway?')) return;
        sol.innerHTML = solutionHTML(p); sol.hidden = false; st.showSol = true; window.Widgets.hydrate(sol);
      } else { sol.hidden = true; st.showSol = false; }
      save(); $('#solBtn').textContent = `📖 ${st.showSol ? 'Hide' : 'Show'} solution`;
    };
    if (st.showSol) window.Widgets.hydrate($('#solution'));
  }
  function solutionHTML(p) {
    let extra = '';
    if (p.sample && ['dfa', 'nfa'].includes(p.type)) extra = `<h4>Sample answer</h4><div class="widget" data-kind="automaton" data-src="${esc('alphabet: ' + p.alphabet + '\n' + p.sample)}"></div><details><summary>Text form</summary><pre class="code"><code>${esc(p.sample)}</code></pre></details>`;
    else if (p.sample && p.type === 'regex') extra = `<h4>Sample answer</h4><pre class="code"><code>${esc(p.sample)}</code></pre>`;
    else if (p.sample && p.type === 'cfg') extra = `<h4>Sample grammar</h4><div class="widget" data-kind="cfg" data-src="${esc('alphabet: ' + p.alphabet + '\n' + p.sample)}"></div>`;
    else if (p.sample && p.type === 'tm') extra = `<h4>Sample machine</h4><pre class="code"><code>${esc(p.sample)}</code></pre>`;
    return `<h3>Solution</h3>${md(p.solution || '')}${extra}`;
  }
  function preview(p, text) {
    const host = $('#preview'); if (!host) return;
    const c = window.Grader.compile(p.type, text, p.alphabet);
    if (c.errors && c.errors.length) { host.innerHTML = `<div class="msg bad small">⚠ ${c.errors.map(esc).join('<br>')}</div>`; return; }
    const warn = (c.warnings || []).length ? `<div class="msg muted small">${c.warnings.map(esc).join('<br>')}</div>` : '';
    if (c.machine && p.type !== 'regex') host.innerHTML = `${warn}<div class="w-diagram">${window.Draw.machineDiagram(c.machine)}</div>`;
    else if (p.type === 'regex') { const e = window.Automata.enumerate(c.machine, p.alphabet, 7, 20); host.innerHTML = `${warn}<div class="small"><span class="muted">Your regex generates:</span> <span class="mono">${e.strings.map((s) => esc(s || 'ε')).join(', ') || '(nothing)'}${e.truncated ? ', …' : ''}</span></div>`; }
    else if (p.type === 'cfg') { const e = window.CFG.enumerate(c.grammar, p.alphabet, Math.min(8, window.CFG.defaultMaxLen(p.alphabet, 2000, 8)), 20); host.innerHTML = `${warn}<div class="small"><span class="muted">Your grammar generates:</span> <span class="mono">${e.strings.map((s) => esc(s || 'ε')).join(', ') || '(nothing short)'}${e.truncated ? ', …' : ''}</span></div>`; }
    else if (p.type === 'tm') host.innerHTML = `${warn}<div class="w-diagram">${window.Draw.tmDiagram(c.tm)}</div>`;
  }
  function gradeHTML(r) {
    const warn = (r.warnings || []).length ? `<div class="small muted">${r.warnings.map(esc).join('<br>')}</div>` : '';
    if (r.status === 'error') return `<div class="feedback bad"><b>Couldn't read your answer</b><div>${r.errors.map(esc).join('<br>')}</div>${warn}</div>`;
    if (r.status === 'correct') return `<div class="feedback good"><b>✓ ${esc(window.Grader.describeResult(r))}</b>${warn}</div>`;
    return `<div class="feedback bad"><b>✗ Not yet.</b> <span>${esc(window.Grader.describeResult(r))}</span><div class="small muted">The shortest disagreeing string is shown. It's been copied into the tester so you can trace it.</div>${warn}</div>`;
  }
  function codeResultHTML(r) {
    if (r.status === 'error') return `<div class="feedback bad"><b>Error</b><pre class="code"><code>${esc(r.errors.join('\n'))}</code></pre>${logsHTML(r.logs)}</div>`;
    const fails = r.rows.filter((x) => !x.pass);
    const show = (v) => esc(JSON.stringify(v)).slice(0, 300);
    return `<div class="feedback ${r.status === 'correct' ? 'good' : 'bad'}"><b>${r.status === 'correct' ? '✓ All tests passed' : `✗ ${r.passed} / ${r.total} tests passed`}</b>
      ${fails.length ? `<div class="table-wrap"><table class="small"><thead><tr><th>input (args)</th><th>expected</th><th>yours</th></tr></thead><tbody>${fails.slice(0, 6).map((x) => `<tr><td class="mono">${show(x.args)}</td><td class="mono">${show(x.expected)}</td><td class="mono bad">${x.error ? 'Error: ' + esc(x.error) : show(x.out)}</td></tr>`).join('')}</tbody></table></div>${fails.length > 6 ? `<div class="small muted">…and ${fails.length - 6} more.</div>` : ''}` : `<div class="small">${r.total} tests (${r.rows.filter((x) => x.random).length} randomized).</div>`}
      ${logsHTML(r.logs)}</div>`;
  }
  const logsHTML = (logs) => (logs && logs.length ? `<details open><summary class="small">console output</summary><pre class="code small"><code>${esc(logs.join('\n'))}</code></pre></details>` : '');
  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } ta.remove(); return Promise.resolve();
  }

  /* ---------------------------------------------------------------- drills */
  function pageDrills(params) {
    const GEN = window.Drills.GEN;
    S.drills = S.drills || {};
    const topicsWithDrills = TOPICS.filter((t) => Object.values(GEN).some((g) => g.topic === t.id));
    let topic = params.get('topic') || '';
    const typesFor = (tp) => Object.keys(GEN).filter((k) => !tp || GEN[k].topic === tp);
    let enabled = new Set(typesFor(topic));
    let session = { n: 0, ok: 0, streak: 0 };
    setMain(`
      <header class="page-head"><h1>Drills</h1><p class="muted">Endless, randomly generated practice with instant checking: run automata, test regex membership, solve recurrences, fill DP tables, trace BFS/DFS/Dijkstra, find MSTs, classify languages and problems. Every question is new.</p></header>
      <div class="card drill-controls">
        <div class="w-row"><label class="small">Topic <select id="dTopic"><option value="">All topics (mixed)</option>${topicsWithDrills.map((t) => `<option value="${t.id}" ${t.id === topic ? 'selected' : ''}>${t.order}. ${esc(t.title)}</option>`).join('')}</select></label>
          <details class="dtypes"><summary class="small">Choose drill types</summary><div id="dTypes" class="topic-checks"></div></details>
          <span class="drill-stats" id="dStats"></span></div>
      </div>
      <div class="card quiz-card drill-card" id="drillBox"></div>
      <div class="card"><h3>Your drill accuracy</h3><div id="dAcc"></div></div>`);
    function renderTypes() {
      $('#dTypes').innerHTML = typesFor(topic).map((k) => `<label><input type="checkbox" value="${k}" ${enabled.has(k) ? 'checked' : ''}> ${esc(GEN[k].title)} <small class="muted">· ${esc((TOPIC.get(GEN[k].topic) || {}).title || '')}</small></label>`).join('');
      $$('#dTypes input').forEach((cb) => { cb.onchange = () => { if (cb.checked) enabled.add(cb.value); else enabled.delete(cb.value); if (!enabled.size) { enabled.add(cb.value); cb.checked = true; } }; });
    }
    function renderStats() {
      $('#dStats').innerHTML = `${pill(`session ${session.ok}/${session.n}`)} ${pill(`streak ${session.streak}`, session.streak >= 5 ? 'good' : '')} ${pill(`best streak ${S.drillBest || 0}`)}`;
      const rows = Object.keys(GEN).filter((k) => S.drills[k] && S.drills[k].a).map((k) => { const d = S.drills[k]; const pct = Math.round((100 * d.c) / d.a); return `<tr><td>${esc(GEN[k].title)}</td><td class="muted">${esc((TOPIC.get(GEN[k].topic) || {}).title || '')}</td><td>${d.c}/${d.a}</td><td><div class="bar inline"><i style="width:${pct}%"></i></div> ${pct}%</td></tr>`; });
      $('#dAcc').innerHTML = rows.length ? `<div class="table-wrap"><table class="small"><thead><tr><th>Drill</th><th>Topic</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<p class="muted small">Answer some drills to see per-skill accuracy here.</p>';
    }
    function visualHTML(v, after) {
      if (!v) return '';
      if (v.type === 'machine') return `<div class="w-diagram">${window.Draw.machineDiagram(v.m)}</div>`;
      if (v.type === 'graph') { const G = window.GraphAlgo.parseGraph(v.text).graph; const P = window.Draw.layoutGraph(G, 520, 320); return `<div class="graph-host">${window.Draw.graphSVG(G, P, {}, { W: 520, H: 320 })}</div>${after ? `<div class="small"><a href="#/lab/graph?g=${encodeURIComponent(v.text)}">Open this graph in the Graph Lab →</a></div>` : ''}`; }
      if (v.type === 'tm') return after ? '<div class="tm-after"></div>' : `<div class="w-diagram">${window.Draw.tmDiagram(window.TM.parseTM(v.src).tm)}</div>`;
      if (v.type === 'dp') return after ? dpTableHTML(v.R) : '';
      return '';
    }
    function next() {
      const pool = [...enabled]; const key = pool[Math.floor(Math.random() * pool.length)];
      let q; try { q = GEN[key].gen(); } catch (e) { console.error(e); return next(); }
      const box = $('#drillBox');
      const t = TOPIC.get(GEN[key].topic);
      let input = '';
      if (q.kind === 'yesno') input = '<div class="choices tf"><button type="button" class="choice btn-choice" data-v="true"><span class="ckey">Y</span> Yes</button><button type="button" class="choice btn-choice" data-v="false"><span class="ckey">N</span> No</button></div>';
      else if (q.kind === 'mc') input = `<div class="choices">${q.choices.map((c, i) => `<button type="button" class="choice btn-choice" data-v="${i}"><span class="ckey">${i + 1}</span><span class="ctext">${mdi(c)}</span></button>`).join('')}</div>`;
      else input = `<form id="dForm" class="w-row"><input id="dIn" class="short-in mono" autocomplete="off" spellcheck="false" placeholder="${q.kind === 'number' ? 'a number' : 'your answer'}" ${q.kind === 'number' ? 'inputmode="numeric"' : ''}><button class="btn primary">Check</button></form>`;
      box.innerHTML = `
        <div class="quiz-top"><span class="pill">${esc(GEN[key].title)}</span><span class="muted small">${t ? esc(t.title) : ''}</span></div>
        <div class="q-text prose">${md(q.prompt)}</div>
        <div class="drill-visual">${visualHTML(q.visual, false)}</div>
        ${input}
        <div id="dFb"></div>`;
      window.Widgets.hydrate(box);
      let done = false;
      const finish = (ok, given) => {
        if (done) return; done = true;
        session.n++; if (ok) { session.ok++; session.streak++; } else session.streak = 0;
        S.drillBest = Math.max(S.drillBest || 0, session.streak);
        const d = (S.drills[key] = S.drills[key] || { a: 0, c: 0 }); d.a++; if (ok) d.c++; save(); touchDay();
        const right = q.kind === 'yesno' ? (q.answer ? 'Yes' : 'No') : q.kind === 'mc' ? mdi(q.choices[q.answer]) : esc(q.kind === 'number' ? q.answer : q.expected);
        $$('.btn-choice', box).forEach((b) => { b.disabled = true; const v = b.dataset.v; const isRight = q.kind === 'yesno' ? (v === 'true') === q.answer : +v === q.answer; if (isRight) b.classList.add('right'); else if (v === String(given)) b.classList.add('wrong'); });
        const inp = $('#dIn', box); if (inp) { inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrong'); }
        $('#dFb').innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}"><b>${ok ? '✓ Correct' : '✗ Not quite'}</b>${ok ? '' : ` — answer: <b>${right}</b>`}<div class="prose">${md(q.explain)}</div></div>${q.visual && (q.visual.type === 'dp' || q.visual.type === 'graph') ? visualHTML(q.visual, true) : ''}<div class="tm-slot"></div><div class="q-actions"><button class="btn primary" id="dNext">Next drill →</button><span class="muted small">Enter</span></div>`;
        if (q.visual && q.visual.type === 'tm') { const h = $('.tm-slot', box); window.Widgets.tm(h, q.visual.src, { editable: false, input: q.visual.input }); }
        window.Widgets.hydrate($('#dFb'));
        $('#dNext').onclick = next; $('#dNext').focus();
        renderStats();
      };
      $$('.btn-choice', box).forEach((b) => { b.onclick = () => { const v = b.dataset.v; const ok = q.kind === 'yesno' ? (v === 'true') === q.answer : +v === q.answer; finish(ok, v); }; });
      const form = $('#dForm', box);
      if (form) {
        $('#dIn').focus();
        form.onsubmit = (e) => { e.preventDefault(); const v = $('#dIn').value.trim(); if (!v) return; const ok = q.kind === 'number' ? Number(v.replace(/,/g, '')) === q.answer : !!q.check(v); finish(ok, v); };
      }
      box._key = (e) => {
        if (!document.body.contains(box)) { document.removeEventListener('keydown', box._key); return; }
        if (done && e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); next(); return; }
        if (done || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        if (q.kind === 'yesno' && /^[yn]$/i.test(e.key)) { const b = $(`.btn-choice[data-v="${e.key.toLowerCase() === 'y'}"]`, box); if (b) b.click(); }
        if (q.kind === 'mc' && /^[1-9]$/.test(e.key)) { const b = $(`.btn-choice[data-v="${+e.key - 1}"]`, box); if (b) b.click(); }
      };
      if (pageDrills._key) document.removeEventListener('keydown', pageDrills._key);
      pageDrills._key = box._key; document.addEventListener('keydown', box._key);
    }
    $('#dTopic').onchange = () => { topic = $('#dTopic').value; enabled = new Set(typesFor(topic)); renderTypes(); history.replaceState(null, '', '#/drills' + (topic ? '?topic=' + topic : '')); next(); };
    renderTypes(); renderStats(); next();
  }
  function dpTableHTML(R) {
    const trace = new Set(R.trace.map(([a, b]) => a + ',' + b));
    return `<div class="table-wrap dp-host"><table class="dp"><thead><tr><th></th>${R.colLabels.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${R.cells.map((row, i) => `<tr><th>${esc(R.rowLabels[i] ?? i)}</th>${row.map((v, j) => `<td class="${trace.has(i + ',' + j) ? 'trace' : ''}">${v === null ? '' : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  /* ---------------------------------------------------------- all problems */
  function pageProblems(params) {
    const f = { topic: params.get('topic') || '', type: params.get('type') || '', diff: params.get('diff') || '', status: params.get('status') || '' };
    const all = [...PROBLEM.values()];
    const match = (p) => (!f.topic || p.topic === f.topic) && (!f.type || (f.type === 'auto' ? AUTO.has(p.type) : p.type === f.type)) && (!f.diff || String(p.difficulty) === f.diff) &&
      (!f.status || (f.status === 'solved' ? isSolved(p.id) : f.status === 'unsolved' ? !isSolved(p.id) : f.status === 'review' ? (S.problems[p.id] || {}).self === 'missed' || (S.problems[p.id] || {}).self === 'partial' || ((S.problems[p.id] || {}).attempts && !isSolved(p.id)) : true));
    const list = all.filter(match);
    const sel = (name, opts) => `<select data-f="${name}">${opts.map(([v, l]) => `<option value="${v}" ${f[name] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    setMain(`
      <header class="page-head"><h1>All practice problems</h1><p class="muted">${all.length} problems · ${all.filter((p) => AUTO.has(p.type)).length} auto-graded · ${all.filter((p) => isSolved(p.id)).length} solved</p></header>
      <div class="filters">
        ${sel('topic', [['', 'All topics'], ...TOPICS.map((t) => [t.id, `${t.order}. ${t.title}`])])}
        ${sel('type', [['', 'All types'], ['auto', 'Auto-graded'], ...Object.entries(TYPE_LABEL)])}
        ${sel('diff', [['', 'Any difficulty'], ['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard']])}
        ${sel('status', [['', 'Any status'], ['unsolved', 'Unsolved'], ['solved', 'Solved'], ['review', 'Needs review']])}
        <button class="btn sm" id="randomProb">🎲 Random from filter</button>
      </div>
      <div class="prob-list">${list.map((p) => problemRow(p, true)).join('') || '<p class="muted">No problems match.</p>'}</div>`);
    $$('[data-f]').forEach((s) => { s.onchange = () => { f[s.dataset.f] = s.value; const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)); location.hash = '#/problems' + (q.toString() ? '?' + q : ''); }; });
    $('#randomProb').onclick = () => { const pool = list.filter((p) => !isSolved(p.id)); const pick = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))]; if (pick) location.hash = '#/problem/' + pick.id; };
  }

  /* ---------------------------------------------------------------- review */
  function pageReview() {
    const due = dueCards();
    const missedQ = [];
    TOPICS.forEach((t) => { const q = S.quiz[t.id]; if (q && q.items) Object.entries(q.items).forEach(([qi, it]) => { if (!it.last && t.quiz[+qi]) missedQ.push({ t, qi: +qi }); }); });
    const revProbs = [...PROBLEM.values()].filter((p) => { const s = S.problems[p.id]; return s && !isSolved(p.id) && (s.self === 'missed' || s.self === 'partial' || s.attempts); });
    const fresh = TOPICS.filter((t) => S.lessons[t.id]).flatMap((t) => (t.flashcards || []).map((c, i) => ({ t, i, c, k: cardKey(t, i) })).filter((x) => isNew(x.k)));
    setMain(`
      <header class="page-head"><h1>Review</h1><p class="muted">Spaced repetition: cards come back right before you'd forget them. Missed quiz questions and unfinished problems collect here too.</p></header>
      <div class="review-grid">
        <div class="card"><h3>🃏 Flashcards</h3><p><b>${due.length}</b> due now${fresh.length ? ` · <b>${fresh.length}</b> new from lessons you've completed` : ''}.</p>
          <div class="q-actions"><button class="btn primary" id="revDue" ${due.length ? '' : 'disabled'}>Review due cards</button>${fresh.length ? `<button class="btn" id="revNew">Learn ${Math.min(20, fresh.length)} new</button>` : ''}</div></div>
        <div class="card"><h3>❓ Missed quiz questions</h3><p><b>${missedQ.length}</b> question${missedQ.length === 1 ? '' : 's'} you got wrong last time.</p>
          <div class="q-actions"><button class="btn" id="revQuiz" ${missedQ.length ? '' : 'disabled'}>Retry them</button></div></div>
        <div class="card"><h3>✏️ Problems to revisit</h3>${revProbs.length ? `<div class="prob-list compact">${revProbs.slice(0, 12).map((p) => problemRow(p, true)).join('')}</div>` : '<p class="muted">Nothing here yet.</p>'}</div>
      </div>
      <div id="revBox" class="card quiz-card" hidden></div>`);
    const box = $('#revBox');
    const go = (items) => { box.hidden = false; box.scrollIntoView({ behavior: 'smooth' }); cardsSession(items, '#revBox'); };
    $('#revDue').onclick = () => go(shuffle(due));
    if ($('#revNew')) $('#revNew').onclick = () => go(fresh.slice(0, 20));
    $('#revQuiz').onclick = () => { box.hidden = false; mixedQuiz(box, shuffle(missedQ), { title: 'Missed questions', record: true }); box.scrollIntoView({ behavior: 'smooth' }); };
  }
  /** One-at-a-time quiz across topics. items: [{t, qi}] */
  function mixedQuiz(host, items, opts = {}) {
    let k = 0, score = 0;
    function render() {
      if (k >= items.length) { host.innerHTML = `<div class="quiz-done"><div class="big-score">${score}/${items.length}</div><p>${esc(opts.title || 'Quiz')} complete.</p></div>`; sidebar(); return; }
      const { t, qi } = items[k]; const q = t.quiz[qi];
      host.innerHTML = `<div class="quiz-top"><span class="muted">${k + 1} / ${items.length} · ${esc(t.title)}</span></div><form id="qForm">${questionHTML(q, 'mq')}<div id="qFb"></div><div class="q-actions"><button class="btn primary" id="qSubmit">Check</button></div></form>`;
      let answered = false;
      $('#qForm', host).onsubmit = (e) => {
        e.preventDefault();
        if (answered) { k++; render(); return; }
        const resp = readResponse(q, host, 'mq'); if (resp === null || (Array.isArray(resp) && !resp.length)) return;
        const ok = checkAnswer(q, resp); answered = true; if (ok) score++;
        if (opts.record) recordQuiz(t, qi, ok);
        $('#qFb', host).innerHTML = revealAnswer(q, host, 'mq', ok);
        $('#qSubmit', host).textContent = 'Next →';
      };
    }
    render();
  }

  /* ------------------------------------------------------------------ exam */
  function pageExam() {
    const chosen = new Set(S.settings.examTopics || TOPICS.map((t) => t.id));
    setMain(`
      <header class="page-head"><h1>Exam mode</h1><p class="muted">Simulate test conditions: a timed, mixed-topic quiz with no feedback until you submit — or generate a practice problem set.</p></header>
      <div class="card">
        <h3>Choose topics</h3>
        <div class="unit-pick">${UNITS.map((u) => `<button class="btn sm ghost" data-unit="${u.id}">Toggle ${esc(u.title)}</button>`).join('')}</div>
        <div class="topic-checks">${TOPICS.map((t) => `<label><input type="checkbox" value="${t.id}" ${chosen.has(t.id) ? 'checked' : ''}> ${t.order}. ${esc(t.title)}</label>`).join('')}</div>
        <div class="exam-opts">
          <label>Questions <input type="number" id="exN" min="5" max="100" value="${S.settings.examN || 20}"></label>
          <label>Time limit (minutes, 0 = none) <input type="number" id="exT" min="0" max="240" value="${S.settings.examT ?? 25}"></label>
        </div>
        <div class="q-actions"><button class="btn primary" id="startExam">Start timed quiz</button><button class="btn" id="startSet">Generate problem set</button></div>
      </div>
      ${S.exams.length ? `<div class="card"><h3>History</h3><div class="table-wrap"><table class="small"><thead><tr><th>Date</th><th>Score</th><th>Questions</th><th>Time</th></tr></thead><tbody>${S.exams.slice(-10).reverse().map((x) => `<tr><td>${new Date(x.ts).toLocaleString()}</td><td><b>${Math.round(100 * x.score / x.n)}%</b></td><td>${x.n}</td><td>${Math.round(x.secs / 60)} min</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      <div id="examBox"></div>`);
    const picked = () => $$('.topic-checks input:checked').map((x) => x.value);
    $$('[data-unit]').forEach((b) => { b.onclick = () => { const boxes = $$('.topic-checks input').filter((x) => TOPIC.get(x.value).unit === b.dataset.unit); const allOn = boxes.every((x) => x.checked); boxes.forEach((x) => { x.checked = !allOn; }); }; });
    $('#startExam').onclick = () => {
      const ids = picked(); if (!ids.length) return alert('Pick at least one topic.');
      const n = Math.max(1, +$('#exN').value || 20), mins = Math.max(0, +$('#exT').value || 0);
      S.settings.examTopics = ids; S.settings.examN = n; S.settings.examT = mins; save();
      const pool = shuffle(TOPICS.filter((t) => ids.includes(t.id)).flatMap((t) => (t.quiz || []).map((q, qi) => ({ t, qi })))).slice(0, n);
      runExam(pool, mins);
    };
    $('#startSet').onclick = () => {
      const ids = picked(); if (!ids.length) return alert('Pick at least one topic.');
      const per = ids.map((id) => shuffle((TOPIC.get(id).problems || []).filter((p) => (p.difficulty || 1) >= 2)));
      const set = []; let round = 0;
      while (set.length < 6 && per.some((x) => x.length > round)) { per.forEach((x) => { if (x[round] && set.length < 6) set.push(x[round]); }); round++; }
      $('#examBox').innerHTML = `<div class="card"><h3>Your problem set</h3><p class="muted">Aim for ~20–25 minutes per written problem, closed-book, then self-grade with the rubric.</p><div class="prob-list">${set.map((p) => problemRow(p, true)).join('')}</div></div>`;
      $('#examBox').scrollIntoView({ behavior: 'smooth' });
    };
  }
  function runExam(items, mins) {
    const t0 = Date.now();
    setMain(`<header class="page-head exam-head"><h1>Exam in progress</h1><div class="timer" id="timer"></div></header>
      <form id="examForm">${items.map(({ t, qi }, k) => `<div class="card exam-q" id="eq${k}"><div class="quiz-top"><b>Q${k + 1}</b><span class="muted small">${esc(t.title)}</span></div>${questionHTML(t.quiz[qi], 'e' + k)}<div class="efb"></div></div>`).join('')}
      <div class="q-actions"><button class="btn primary" type="submit">Submit exam</button></div></form>`);
    let timer = null;
    const tick = () => {
      const el = $('#timer'); if (!el) { clearInterval(timer); return; }
      const secs = Math.floor((Date.now() - t0) / 1000);
      if (mins) { const left = mins * 60 - secs; el.textContent = `⏱ ${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')} left`; el.classList.toggle('low', left < 120); if (left <= 0) { clearInterval(timer); submit(true); } }
      else el.textContent = `⏱ ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    };
    timer = setInterval(tick, 1000); tick();
    let done = false;
    function submit(auto) {
      if (done) return; done = true; clearInterval(timer);
      let score = 0;
      items.forEach(({ t, qi }, k) => {
        const q = t.quiz[qi], card = $('#eq' + k);
        const resp = readResponse(q, card, 'e' + k);
        const ok = resp !== null && checkAnswer(q, resp);
        if (ok) score++;
        recordQuiz(t, qi, ok);
        $('.efb', card).innerHTML = revealAnswer(q, card, 'e' + k, ok);
      });
      const secs = Math.round((Date.now() - t0) / 1000);
      S.exams.push({ ts: Date.now(), score, n: items.length, secs }); save(); sidebar();
      const head = $('.exam-head'); head.innerHTML = `<h1>${auto ? 'Time\'s up! ' : ''}Score: ${score}/${items.length} (${Math.round((100 * score) / items.length)}%)</h1><div class="q-actions"><a class="btn" href="#/exam">New exam</a></div><p class="muted">Scroll down to review every question with explanations. Weak topics:</p>${weakTopics(items)}`;
      $('#examForm button[type=submit]').remove();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    $('#examForm').onsubmit = (e) => { e.preventDefault(); if (confirm('Submit the exam?')) submit(false); };
  }
  function weakTopics(items) {
    const by = new Map();
    items.forEach(({ t, qi }) => { const it = ((S.quiz[t.id] || {}).items || {})[qi]; const r = by.get(t.id) || { t, ok: 0, n: 0 }; r.n++; if (it && it.last) r.ok++; by.set(t.id, r); });
    return `<div class="weak">${[...by.values()].sort((a, b) => a.ok / a.n - b.ok / b.n).map((r) => `<a class="tag ${r.ok / r.n < 0.6 ? 'bad' : r.ok / r.n < 0.85 ? 'warn' : 'good'}" href="#/topic/${r.t.id}">${esc(r.t.title)}: ${r.ok}/${r.n}</a>`).join(' ')}</div>`;
  }

  /* ------------------------------------------------------------ midterm 2 */
  const MT2_TOPICS = ['recursion', 'divide', 'backtracking', 'dp', 'dp2', 'graphs', 'dags', 'shortest', 'mst'].filter((id) => TOPIC.has(id));
  const MOCKS = [
    { n: 1, title: 'Mock Midterm A', order: ['recursion', 'graphs', 'dp', 'dags', 'divide'] },
    { n: 2, title: 'Mock Midterm B', order: ['mst', 'shortest', 'dp2', 'backtracking', 'divide'] },
    { n: 3, title: 'Mock Midterm C', order: ['recursion', 'graphs', 'dp', 'dp2', 'shortest'] },
  ];
  const MOCK_MINS = 120;
  function mockProblems(m) {
    const rank = (p) => { const i = m.order.indexOf(p.topic); return i < 0 ? 99 : i; };
    return [...PROBLEM.values()].filter((p) => (p.tags || []).includes('mt2-mock-' + m.n)).sort((a, b) => rank(a) - rank(b));
  }
  const fmtClock = (secs) => { secs = Math.max(0, Math.round(secs)); const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60; return `${h ? h + ':' : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`; };
  function mockTimerTick() {
    let el = document.getElementById('mockTimer');
    if (!el) { document.body.insertAdjacentHTML('beforeend', '<a id="mockTimer" class="mock-timer" href="#/midterm2" hidden></a>'); el = document.getElementById('mockTimer'); }
    const T = S.settings.mt2Timer;
    if (!T || /^#\/midterm2/.test(location.hash)) { el.hidden = true; if (!T) return; }
    const left = T.mins * 60 - (Date.now() - T.start) / 1000;
    if (!/^#\/midterm2/.test(location.hash)) el.hidden = false;
    el.classList.toggle('low', left < 600);
    el.textContent = left > 0 ? `⏱ ${(MOCKS.find((m) => m.n === T.mock) || {}).title || 'Mock'} · ${fmtClock(left)} left` : `⏱ Time's up: pens down and self-grade`;
    const inPage = document.getElementById('mt2Clock'); if (inPage) inPage.textContent = el.textContent;
  }
  function pageMidterm2() {
    const ts = MT2_TOPICS.map((id) => TOPIC.get(id));
    const stats = ts.map((t) => [t, topicStats(t)]);
    const ready = stats.length ? Math.round(stats.reduce((a, [, s]) => a + s.pct, 0) / stats.length) : 0;
    const solved = stats.reduce((a, [, s]) => a + s.solved, 0), totalP = stats.reduce((a, [, s]) => a + s.total, 0);
    const due = dueCards(MT2_TOPICS);
    const date = S.settings.mt2Date || '';
    let daysLeft = null;
    if (date) { const d = new Date(date + 'T00:00:00'), now = new Date(); now.setHours(0, 0, 0, 0); daysLeft = Math.round((d - now) / DAY); }
    const T = S.settings.mt2Timer;
    const selfSummary = (ps) => { const c = { good: 0, partial: 0, missed: 0 }; ps.forEach((p) => { const s = S.problems[p.id]; if (s && c[s.self] != null) c[s.self]++; }); return c; };
    const mockCards = MOCKS.map((m) => {
      const ps = mockProblems(m);
      if (!ps.length) return '';
      const c = selfSummary(ps), active = T && T.mock === m.n;
      return `<div class="card mock-card${active ? ' active' : ''}">
        <div class="head-row"><h3>${esc(m.title)}</h3><span class="muted small">${ps.length} problems · ${MOCK_MINS} min</span></div>
        <div class="prob-list compact">${ps.map((p, i) => `<div class="mock-row"><b class="mock-num">${i + 1}</b>${problemRow(p, true)}</div>`).join('')}</div>
        <p class="small muted">Self-graded: ${c.good} got it · ${c.partial} partial · ${c.missed} missed</p>
        <div class="q-actions">${active ? `<button class="btn bad" data-stop="${m.n}">Stop timer</button><span class="timer" id="mt2Clock"></span>` : `<button class="btn primary" data-mock="${m.n}">Start ${MOCK_MINS}-minute timer</button>`}</div>
      </div>`;
    }).join('');
    const jump = 'h-midterm-2-exam-patterns';
    setMain(`
      <header class="page-head"><h1>Midterm 2</h1>
        <p class="muted">Topics 10–18: recursion, divide &amp; conquer, backtracking, dynamic programming, graph search, DAGs &amp; SCCs, shortest paths, and MSTs. NP-hardness is left for the final. This scope is an assumption, so check the course website for your semester's official list.</p></header>
      <div class="stats mt2-stats">
        <div class="stat"><b>${daysLeft == null ? '—' : daysLeft < 0 ? 'done' : daysLeft}</b><span>${daysLeft == null ? 'set your exam date →' : daysLeft === 1 ? 'day left' : 'days left'}</span>
          <input type="date" id="mt2Date" value="${esc(date)}" aria-label="Midterm 2 date"></div>
        <div class="stat"><b>${ready}%</b><span>Midterm 2 readiness</span></div>
        <div class="stat"><b>${solved}<small>/${totalP}</small></b><span>problems solved</span></div>
        <div class="stat"><b>${due.length}</b><span>cards due</span></div>
      </div>

      <div class="card">
        <h3>Quick practice</h3>
        <p class="muted">Practice mixed across all Midterm 2 topics, as on the exam.</p>
        <div class="q-actions">
          <button class="btn primary" id="mt2Quiz">Timed quiz · 25 questions · 30 min</button>
          <button class="btn" id="mt2Cards">${due.length ? `Review ${due.length} due flashcards` : 'Learn 20 new flashcards'}</button>
          <button class="btn" id="mt2Set">Random 5-problem set</button>
          <a class="btn" href="#/cheatsheet?set=mt2">Midterm 2 cheat sheet</a>
        </div>
        <div id="mt2Box"></div>
      </div>

      <h2 class="sec">Mock midterms</h2>
      <p class="muted">Each mock has five exam-length written problems. Work them closed-book against the timer, then open each one and self-grade against its 10-point rubric. The timer keeps running while you move between pages.</p>
      <div class="mock-grid">${mockCards || '<div class="card"><p class="muted">No mock problems found.</p></div>'}</div>

      <h2 class="sec">Topic checklist</h2>
      <div class="card"><div class="table-wrap"><table class="mt2-table"><thead><tr><th>Topic</th><th>Mastery</th><th>Study</th><th>Practice</th></tr></thead><tbody>
        ${stats.map(([t, s]) => {
          const hasDrills = window.Drills && Object.values(window.Drills.GEN).some((g) => g.topic === t.id);
          const hasPatterns = /\n##\s+Midterm 2 exam patterns/.test(t.lesson || '');
          return `<tr><td><a href="#/topic/${t.id}"><b>${t.order}.</b> ${esc(t.title)}</a></td>
            <td><span class="bar inline"><i style="width:${s.pct}%"></i></span> <small>${s.pct}%</small></td>
            <td class="links">${hasPatterns ? `<a href="#/topic/${t.id}/lesson" data-jump="${jump}">Exam patterns</a>` : `<a href="#/topic/${t.id}/lesson">Lesson</a>`} · <a href="#/topic/${t.id}/sheet">Cheat sheet</a> · <a href="#/topic/${t.id}/cards">Cards</a></td>
            <td class="links"><a href="#/topic/${t.id}/quiz">Quiz ${s.qs ? Math.round(100 * Math.max(s.best, s.qCorrect / s.qs)) + '%' : ''}</a> · <a href="#/topic/${t.id}/practice">Problems ${s.solved}/${s.total}</a>${hasDrills ? ` · <a href="#/drills?topic=${t.id}">Drills</a>` : ''}</td></tr>`;
        }).join('')}
      </tbody></table></div></div>

      <div class="card prose">${md(String.raw`### A plan for the final week
1. **Diagnose (day 1).** Take the timed quiz and note your weakest topics in the results.
2. **Patch the weak topics (days 2–4).** For each one, read its *Midterm 2 exam patterns* section, do the two "try it first" examples before you reveal them, and then work three written problems without looking at hints.
3. **Mock A (day 4 or 5)** under the timer. Self-grade honestly with the rubric. A missing running time or a missing base case costs points on the real exam too.
4. **Re-study what Mock A exposed, then Mock B (day 6).**
5. **Mock C (two days before).** The day before, only review flashcards and the Midterm 2 cheat sheet.

**For every DP answer, write:** an English description of the subproblem, the recurrence with base cases, the memo structure, the evaluation order, the running time, and where the final answer is.

**For every graph answer, write:** the vertices and edges you built, which algorithm you run and from where, what you read off at the end, and the running time *in terms of the original input*.`)}</div>`);

    const dateIn = $('#mt2Date');
    dateIn.onchange = () => { S.settings.mt2Date = dateIn.value || null; save(); pageMidterm2(); };
    $('#mt2Quiz').onclick = () => {
      const pool = shuffle(ts.flatMap((t) => (t.quiz || []).map((q, qi) => ({ t, qi })))).slice(0, 25);
      runExam(pool, 30);
    };
    $('#mt2Cards').onclick = () => {
      const items = due.length ? shuffle(due) : shuffle(ts.flatMap((t) => (t.flashcards || []).map((c, i) => ({ t, i, c, k: cardKey(t, i) })).filter((x) => isNew(x.k)))).slice(0, 20);
      if (!items.length) { $('#mt2Box').innerHTML = '<p class="muted">No cards due and no new cards left. Nice work.</p>'; return; }
      cardsSession(items, '#mt2Box', () => {});
    };
    $('#mt2Set').onclick = () => {
      const groups = [['recursion', 'divide'], ['backtracking', 'dp', 'dp2'], ['dp', 'dp2'], ['graphs', 'dags'], ['shortest', 'mst']];
      const used = new Set();
      const set = groups.map((g) => {
        const cand = shuffle(g.flatMap((id) => (TOPIC.get(id) || { problems: [] }).problems).filter((p) => p.type === 'written' && (p.difficulty || 1) >= 2 && !used.has(p.id)));
        const p = cand.find((x) => !isSolved(x.id)) || cand[0];
        if (p) used.add(p.id);
        return p;
      }).filter(Boolean);
      $('#mt2Box').innerHTML = `<h4>Your problem set</h4><p class="muted small">Aim for about 20–25 minutes per problem, closed-book, then self-grade with the rubric. Problems you haven't solved yet are picked first.</p><div class="prob-list">${set.map((p) => problemRow(p, true)).join('')}</div>`;
    };
    $$('[data-mock]').forEach((b) => { b.onclick = () => {
      if (S.settings.mt2Timer && !confirm('Another mock timer is running. Replace it?')) return;
      S.settings.mt2Timer = { mock: +b.dataset.mock, start: Date.now(), mins: MOCK_MINS }; save(); pageMidterm2(); mockTimerTick();
    }; });
    $$('[data-stop]').forEach((b) => { b.onclick = () => {
      const T2 = S.settings.mt2Timer; const used = T2 ? fmtClock((Date.now() - T2.start) / 1000) : '';
      S.settings.mt2Timer = null; save(); mockTimerTick(); pageMidterm2();
      if (used) alert(`Timer stopped after ${used}. Now open each problem and self-grade it with the rubric.`);
    }; });
    $$('[data-jump]').forEach((a) => { a.onclick = () => { pendingJump = a.dataset.jump; }; });
    mockTimerTick();
  }

  /* --------------------------------------------------------- cheat sheet */
  function notationHTML(g) { return `<h3>${esc(g.title)}</h3>${md(g.md)}`; }
  function pageCheatsheet(params) {
    const mt2 = params && params.get('set') === 'mt2';
    const list = mt2 ? MT2_TOPICS.map((id) => TOPIC.get(id)) : TOPICS;
    const ids = new Set(list.map((t) => t.id));
    // On the Midterm 2 sheet, skip groups only needed for topics outside the exam (e.g. P and NP).
    const groups = (window.NOTATION || []).filter((g) => g.topics.some((id) => ids.has(id) && (!mt2 || id !== 'np')));
    setMain(`<header class="page-head"><div class="head-row"><h1>${mt2 ? 'Midterm 2 cheat sheet' : 'Cheat sheet'}</h1><button class="btn sm" onclick="window.print()">🖨 Print</button></div><p class="muted">${mt2 ? 'Key facts for topics 10–18 in one place. <a href="#/cheatsheet">Show all topics</a>' : 'Every topic\'s key facts in one place. <a href="#/cheatsheet?set=mt2">Midterm 2 topics only</a>'}</p></header>
      ${groups.length ? `<section id="symbols" class="symbols"><h2>Symbol guide</h2><p class="muted">What each piece of notation on these sheets means. A few symbols change meaning between topics. For example, δ is the transition function in automata, but a distance in graphs and in closest pair. Each group below lists the meaning for its topics.</p>
        <div class="sheet-all">${groups.map((g) => `<section class="card prose sheet notation"><h2>${esc(g.title)}</h2>${md(g.md)}</section>`).join('')}</div></section>
      <h2 class="sec">Key facts by topic</h2>` : ''}
      <div class="sheet-all">${list.map((t) => `<section class="card prose sheet"><h2><a href="#/topic/${t.id}">${t.order}. ${esc(t.title)}</a></h2>${md(t.cheatsheet || '*—*', { shiftHeadings: 1 })}</section>`).join('')}</div>`);
    $$('[data-jump]').forEach((a) => { a.onclick = () => { pendingJump = a.dataset.jump; }; });
  }

  /* ------------------------------------------------------------ progress */
  function pageProgress() {
    const rows = TOPICS.map((t) => [t, topicStats(t)]);
    setMain(`<header class="page-head"><h1>Progress</h1><p class="muted">Mastery = 20% lesson + 30% quiz + 40% problems + 10% flashcards. Progress is stored in this browser only.</p></header>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>Topic</th><th>Lesson</th><th>Quiz</th><th>Problems</th><th>Cards ≥ box 3</th><th>Mastery</th></tr></thead><tbody>
      ${rows.map(([t, s]) => `<tr><td><a href="#/topic/${t.id}">${t.order}. ${esc(t.title)}</a></td><td>${s.lesson ? '✓' : ''}</td><td>${s.qs ? Math.round(100 * Math.max(s.best, s.qCorrect / s.qs)) + '%' : '—'}</td><td>${s.solved}/${s.total}</td><td>${s.mastered}/${s.cards}</td><td><div class="bar inline"><i style="width:${s.pct}%"></i></div> ${s.pct}%</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="card"><h3>Backup</h3><p class="muted small">Move your progress to another browser or computer.</p>
        <div class="q-actions"><button class="btn" id="exp">Export progress</button><label class="btn">Import progress<input type="file" id="imp" accept="application/json" hidden></label><button class="btn bad" id="rst">Reset everything</button></div></div>`);
    $('#exp').onclick = () => { const b = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `cs374-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
    $('#imp').onchange = (e) => { const f = e.target.files[0]; if (!f) return; f.text().then((txt) => { try { S = Object.assign(blank(), JSON.parse(txt)); save(); sidebar(); pageProgress(); alert('Progress imported.'); } catch (err) { alert('That file is not valid progress JSON.'); } }); };
    $('#rst').onclick = () => { if (confirm('Erase ALL progress (lessons, quizzes, problems, flashcards)? This cannot be undone.')) { S = blank(); save(); sidebar(); pageProgress(); } };
  }

  /* -------------------------------------------------------------- search */
  function pageSearch(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (s) => { const x = String(s || '').toLowerCase(); return terms.every((w) => x.includes(w)); };
    const res = [];
    TOPICS.forEach((t) => {
      if (hit(t.title + ' ' + t.summary)) res.push({ score: 3, html: `<a href="#/topic/${t.id}"><b>Topic:</b> ${esc(t.title)}</a>` });
      const secs = (t.lesson || '').split(/\n(?=##\s)/);
      secs.forEach((sec) => { const m = sec.match(/^##\s+(.*)/); if (m && hit(sec)) { const id = 'h-' + m[1].toLowerCase().replace(/<[^>]+>|\$[^$]*\$/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); res.push({ score: hit(m[1]) ? 2.5 : 1.5, html: `<a href="#/topic/${t.id}/lesson" data-jump="${id}"><b>Lesson:</b> ${esc(t.title)} › ${mdi(m[1])}</a>` }); } });
      (t.problems || []).forEach((p) => { if (hit(p.title + ' ' + p.prompt + ' ' + (p.tags || []).join(' '))) res.push({ score: hit(p.title) ? 2.4 : 1.2, html: `<a href="#/problem/${p.id}"><b>Problem:</b> ${mdi(p.title)} <small class="muted">· ${esc(t.title)}</small></a>` }); });
      (t.flashcards || []).forEach((c) => { if (hit(c.front + ' ' + c.back)) res.push({ score: 1, html: `<a href="#/topic/${t.id}/cards"><b>Flashcard:</b> ${mdi(String(c.front).slice(0, 140))}</a>` }); });
    });
    res.sort((a, b) => b.score - a.score);
    setMain(`<header class="page-head"><h1>Search: “${esc(q)}”</h1><p class="muted">${res.length} result${res.length === 1 ? '' : 's'}</p></header><div class="card search-results">${res.slice(0, 80).map((r) => `<div>${r.html}</div>`).join('') || '<p class="muted">No matches.</p>'}</div>`);
    $$('[data-jump]').forEach((a) => { a.onclick = () => { pendingJump = a.dataset.jump; }; });
  }
  let pendingJump = null;

  function notFound() { setMain('<div class="card"><h2>Not found</h2><p><a href="#/">Back to dashboard</a></p></div>'); }

  /* --------------------------------------------------------------- router */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(qs || '');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    markNav(parts);
    try {
      switch (parts[0]) {
        case undefined: case '': pageHome(); break;
        case 'topic': pageTopic(parts[1], parts[2]); break;
        case 'problem': pageProblem(parts[1]); break;
        case 'problems': pageProblems(params); break;
        case 'review': pageReview(); break;
        case 'drills': pageDrills(params); break;
        case 'exam': pageExam(); break;
        case 'cheatsheet': pageCheatsheet(params); break;
        case 'midterm2': pageMidterm2(); break;
        case 'progress': pageProgress(); break;
        case 'search': pageSearch(params.get('q') || ''); break;
        case 'lab': window.Labs.render(main(), parts[1], params, setMain); break;
        default: notFound();
      }
    } catch (e) { console.error(e); setMain(`<div class="card"><h2>Something went wrong</h2><pre class="code"><code>${esc(e.stack || e.message)}</code></pre></div>`); }
    if (pendingJump) { const el = document.getElementById(pendingJump); pendingJump = null; if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30); }
  }

  if (S.settings.theme) document.documentElement.setAttribute('data-theme', S.settings.theme);
  sidebar();
  window.addEventListener('hashchange', route);
  $('#menuBtn').onclick = () => document.body.classList.toggle('nav-open');
  route();
  mockTimerTick(); setInterval(mockTimerTick, 1000);
  window.App = { S, TOPICS, PROBLEM, sidebar };
})();
