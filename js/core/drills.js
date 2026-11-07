/* Drills: endless randomly generated, auto-checked practice questions.
 * Each generator returns:
 *   { prompt (markdown), kind: 'yesno'|'mc'|'number'|'text', answer, choices?, check?(input)->bool,
 *     explain (markdown), visual? {type:'machine'|'graph'|'html', ...}, expected (display string) } */
(function (root) {
  'use strict';
  const A = root.Automata || require('./automata.js');
  const C = root.CFG || require('./cfg.js');
  const T = root.TM || require('./tm.js');
  const D = root.DPViz || require('./dpviz.js');

  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const randStr = (alpha, lo, hi) => { let s = ''; const n = ri(lo, hi); for (let i = 0; i < n; i++) s += pick([...alpha]); return s; };
  const show = (s) => (s === '' ? 'ε' : s);
  const LET = 'abcdefghij';
  const normTex = (x) => String(x).replace(/\^\{(\d)\}/g, '^$1').replace(/\s+/g, ' ').trim();
  const mc = (correct, distractors, n = 4) => { correct = normTex(correct); distractors = distractors.map(normTex); const opts = shuffle([correct, ...shuffle([...new Set(distractors.filter((d) => d !== correct))]).slice(0, n - 1)]); return { choices: opts, answer: opts.indexOf(correct) }; };

  /* ---------------------------------------------------------------- automata */
  function randomDFA(n, alpha = '01') {
    for (let tries = 0; tries < 200; tries++) {
      const lines = [`start: q0`];
      const acc = []; for (let i = 0; i < n; i++) if (Math.random() < 0.4) acc.push('q' + i);
      if (!acc.length || acc.length === n) continue;
      lines.push('accept: ' + acc.join(', '));
      for (let i = 0; i < n; i++) for (const c of alpha) lines.push(`q${i} ${c} -> q${ri(0, n - 1)}`);
      const m = A.parseMachine(lines.join('\n')).machine;
      // all reachable
      const seen = new Set([0]); const st = [0];
      while (st.length) { const q = st.pop(); for (const t of m.delta[q].values()) for (const r of t) if (!seen.has(r)) { seen.add(r); st.push(r); } }
      if (seen.size === n) return { m, text: lines.join('\n') };
    }
    return null;
  }
  function randomRegexAST(depth) {
    if (depth <= 0 || Math.random() < 0.25) return pick([{ t: 'sym', c: '0' }, { t: 'sym', c: '1' }, { t: 'sym', c: '0' }, { t: 'sym', c: '1' }, { t: 'eps' }]);
    const k = Math.random();
    if (k < 0.35) return { t: 'cat', a: randomRegexAST(depth - 1), b: randomRegexAST(depth - 1) };
    if (k < 0.65) return { t: 'union', a: randomRegexAST(depth - 1), b: randomRegexAST(depth - 1) };
    const a = randomRegexAST(depth - 1); return a.t === 'star' || a.t === 'eps' ? { t: 'cat', a, b: { t: 'sym', c: pick('01') } } : { t: 'star', a };
  }
  function interestingRegex() {
    for (let i = 0; i < 300; i++) {
      const ast = randomRegexAST(ri(2, 3));
      const src = A.regexToString(ast);
      if (src.length < 5 || src.length > 22) continue;
      const m = A.compileRegex(src, '01').machine;
      let yes = 0, tot = 0; A.forAllStrings('01', 6, (s) => { tot++; if (A.accepts(m, s)) yes++; });
      if (yes >= 4 && tot - yes >= 10) return { src, m };
    }
    return { src: '(0+1)*00(0+1)*', m: A.compileRegex('(0+1)*00(0+1)*', '01').machine };
  }

  const G = {};
  G['dfa-run'] = {
    topic: 'dfa', title: 'Run a DFA',
    gen() {
      const { m } = randomDFA(ri(3, 4));
      const w = randStr('01', 4, 8);
      const tr = A.trace(m, w);
      const path = tr.steps.map((s, i) => (i === 0 ? '' : ` —${s.read}→ `) + m.states[s.states[0]]).join('');
      return { prompt: `Does this DFA accept **${w}**?`, kind: 'yesno', answer: tr.accepted, visual: { type: 'machine', m },
        explain: `Trace: ${path}. The run ends in **${m.states[tr.steps[tr.steps.length - 1].states[0]]}**, which is ${tr.accepted ? '' : '**not** '}accepting.` };
    },
  };
  G['dfa-state'] = {
    topic: 'dfa', title: 'Where does the DFA end?',
    gen() {
      const { m } = randomDFA(4);
      const w = randStr('01', 5, 9);
      const tr = A.trace(m, w); const end = tr.steps[tr.steps.length - 1].states[0];
      const path = tr.steps.map((s, i) => (i === 0 ? '' : ` —${s.read}→ `) + m.states[s.states[0]]).join('');
      return { prompt: `In which state is this DFA after reading **${w}**? (i.e. what is $\\delta^*(q_0, ${w})$?)`, kind: 'mc', choices: m.states.slice(), answer: end, visual: { type: 'machine', m }, explain: `Trace: ${path}.` };
    },
  };
  G['dfa-min'] = {
    topic: 'dfa', title: 'Minimal DFA size',
    gen() {
      const { m } = randomDFA(ri(4, 5));
      const r = A.minimize(m, '01');
      return { prompt: 'How many states does the **minimal** DFA equivalent to this one have?', kind: 'number', answer: r.machine.states.length, visual: { type: 'machine', m },
        explain: `Merging indistinguishable states (partition refinement) gives ${r.machine.states.length} classes: ${r.members.map((x) => '{' + x.join(', ') + '}').join(', ')}. States in the same class agree on acceptance for every suffix; states in different classes have a distinguishing suffix.` };
    },
  };
  G['nfa-run'] = {
    topic: 'nfa', title: 'Run an NFA',
    gen() {
      const m = randomNFA();
      const w = randStr('01', 3, 6);
      const tr = A.trace(m, w);
      const sets = tr.steps.map((s, i) => (i === 0 ? '' : ` —${s.read}→ `) + (s.states.length ? '{' + s.states.map((q) => m.states[q]).sort().join(',') + '}' : '∅')).join('');
      return { prompt: `Does this NFA accept **${w}**?`, kind: 'yesno', answer: tr.accepted, visual: { type: 'machine', m },
        explain: `Track the **set** of reachable states (after ε-reach): ${sets}. ${tr.accepted ? 'The final set contains an accepting state.' : 'The final set contains no accepting state.'}` };
    },
  };
  function randomNFA() {
    for (;;) {
      const n = 3; const lines = ['start: a', 'accept: ' + pick(['c', 'b', 'c'])];
      for (let i = 0; i < n; i++) for (const c of '01') { const k = pick([0, 1, 1, 1, 2]); const ts = shuffle(['a', 'b', 'c']).slice(0, k); if (ts.length) lines.push(`${'abc'[i]} ${c} -> ${ts.join(', ')}`); }
      if (Math.random() < 0.4) lines.push(`${pick(['a', 'b'])} eps -> ${pick(['b', 'c'])}`);
      const r = A.parseMachine(lines.join('\n'));
      if (r.machine && r.machine.states.length === 3) return r.machine;
    }
  }
  G['nfa-subset'] = {
    topic: 'nfa', title: 'Subset construction size',
    gen() {
      const m = randomNFA();
      const r = A.subsetConstruction(m, '01');
      const rows = r.machine.states.map((nm, i) => `| ${i === 0 ? '→ ' : ''}${nm}${r.machine.accept.has(i) ? ' ✱' : ''} | ${r.machine.states[[...r.machine.delta[i].get('0')][0]]} | ${r.machine.states[[...r.machine.delta[i].get('1')][0]]} |`).join('\n');
      return { prompt: 'Apply the incremental subset construction (only reachable subsets, counting ∅ if it is reached). How many DFA states result?', kind: 'number', answer: r.machine.states.length, visual: { type: 'machine', m },
        explain: `Start from the ε-reach of the start state and explore:\n\n| subset | 0 | 1 |\n|---|---|---|\n${rows}\n\n${r.machine.states.length} reachable subsets (✱ = accepting).` };
    },
  };
  G['regex-member'] = {
    topic: 'regex', title: 'Regex membership',
    gen() {
      const { src, m } = interestingRegex();
      let w;
      if (Math.random() < 0.5) { const e = A.enumerate(m, '01', 7, 40).strings.filter((s) => s.length >= 2); w = e.length ? pick(e) : randStr('01', 2, 6); } else w = randStr('01', 2, 7);
      const ok = A.accepts(m, w);
      const ex = A.enumerate(m, '01', 6, 10).strings.map(show).join(', ');
      return { prompt: `Is **${w}** in $L(${src.replace(/ε/g, '\\varepsilon')})$?`, kind: 'yesno', answer: ok,
        explain: `${ok ? 'Yes' : 'No'}. Shortest strings in the language: ${ex}, …  Break the string into pieces matching the concatenation, choosing a branch of each + and a number of repetitions for each *.` };
    },
  };
  G['regex-pick'] = {
    topic: 'regex', title: 'Which string matches?',
    gen() {
      const { src, m } = interestingRegex();
      const yes = A.enumerate(m, '01', 7, 60).strings.filter((s) => s.length >= 2);
      const no = []; for (let i = 0; i < 200 && no.length < 3; i++) { const s = randStr('01', 2, 6); if (!A.accepts(m, s) && !no.includes(s)) no.push(s); }
      const right = pick(yes.length ? yes : ['']);
      const { choices, answer } = mc(right, no);
      return { prompt: `Exactly one of these strings is in $L(${src.replace(/ε/g, '\\varepsilon')})$. Which?`, kind: 'mc', choices: choices.map(show), answer, explain: `**${show(right)}** matches; the others do not. Shortest strings in the language: ${A.enumerate(m, '01', 6, 10).strings.map(show).join(', ')}, …` };
    },
  };
  const EQUIV = [
    ['(R*)*', 'R*'], ['(R+S)*', '(R*S*)*'], ['R(SR)*', '(RS)*R'], ['(ε+R)R*', 'R*'], ['R*R*', 'R*'], ['(R+ε)*', 'R*'],
    ['(RS)*', 'R*S*'], ['(R+S)*', 'R*+S*'], ['R*(R+S)*', '(R+S)*'], ['(RS+R)*R', 'R(SR+R)*'], ['(R*S)*', '(R+S)*'], ['R*S*', '(R+S)*'],
    ['(RS)*R', 'R(RS)*'], ['R(R*)', 'R*R'], ['(R+S)R', 'RR+SR'], ['R(S+ε)', 'RS+R'], ['(RR)*', 'R*'], ['(R*S*)*R', '(R+S)*R'],
    ['(RS)*', '(SR)*'], ['R(S+R)', 'RS+R'], ['(R+S)*', '(RS)*'], ['R*S', 'S*R'], ['(RS)*', 'R(SR)*S'], ['R*+S*', '(R+S)*'], ['(R*S)*R*', '(R+S)*'], ['(R+S)*S', 'R*S*S'], ['(RS)*R*', '(R+S)*'],
  ];
  G['regex-equiv'] = {
    topic: 'regex', title: 'Equivalent regexes?',
    gen() {
      const atoms = ['0', '1', '01', '10', '0+1', '1*', '00'];
      for (;;) {
        const [x, y] = pick(EQUIV); let R = pick(atoms), S = pick(atoms); if (R === S) continue;
        const wrap = (a) => (a.length > 1 ? '(' + a + ')' : a);
        const sub = (t) => t.replace(/R/g, wrap(R)).replace(/S/g, wrap(S));
        const r1 = sub(x), r2 = sub(y);
        const eq = A.equivalent(A.compileRegex(r1, '01').machine, A.compileRegex(r2, '01').machine, '01');
        if (eq.equal === null) continue;
        return { prompt: `Do these regular expressions describe the same language?\n\n$$${r1.replace(/ε/g, '\\varepsilon')} \\quad\\text{vs.}\\quad ${r2.replace(/ε/g, '\\varepsilon')}$$`, kind: 'yesno', answer: eq.equal,
          explain: eq.equal ? `Yes — this is an instance of the identity $${x.replace(/ε/g, '\\varepsilon')} = ${y.replace(/ε/g, '\\varepsilon')}$ (with $R=${R}$, $S=${S}$).` : `No. The shortest distinguishing string is **${show(eq.counterexample)}**, matched only by the ${eq.inFirst ? 'first' : 'second'} expression. (The general pattern $${x.replace(/ε/g, '\\varepsilon')}$ vs $${y.replace(/ε/g, '\\varepsilon')}$ is not an identity.)` };
      }
    },
  };

  /* ------------------------------------------------------------ banks */
  const REG = [
    ['\\{0^n1^n : n \\ge 0\\}', false, 'Fooling set $\\{0^i : i\\ge 0\\}$: suffix $1^i$ separates $0^i$ from $0^j$.'],
    ['\\{0^n1^n : n \\le 374\\}', true, 'Finite language ⇒ regular.'],
    ['\\{w : w \\text{ has equally many } 01 \\text{ and } 10 \\text{ substrings}\\}', true, 'Equivalent to: $w$ is empty or starts and ends with the same symbol.'],
    ['\\{w : \\#_0(w) = \\#_1(w)\\}', false, 'Fooling set $\\{0^i\\}$ with suffix $1^i$.'],
    ['\\{w : \\#_0(w) \\equiv \\#_1(w) \\pmod 3\\}', true, 'Track $(\\#_0-\\#_1) \\bmod 3$: 3 states.'],
    ['\\{ww : w \\in \\{0,1\\}^*\\}', false, 'Fooling set $\\{0^i1 : i \\ge 0\\}$ with suffix $0^i1$.'],
    ['\\{ww^R : w \\in \\{0,1\\}^*\\}', false, 'Fooling set $\\{0^i1\\}$ with suffix $10^i$.'],
    ['\\{0^{2n} : n \\ge 0\\}', true, '$(00)^*$.'],
    ['\\{0^{n^2} : n \\ge 0\\}', false, 'Gaps between squares grow; fooling set $\\{0^{i^2}\\}$ with suffix $0^{2i+1}$.'],
    ['\\{0^p : p \\text{ prime}\\}', false, 'Classic non-regular unary language (gaps between primes are unbounded).'],
    ['\\{0^i1^j : i \\ge j\\}', false, 'Fooling set $\\{0^i\\}$: suffix $1^{i}$ is in for $0^i$ but $0^j1^i$ with $j<i$ is out.'],
    ['\\{0^i1^j : i + j \\text{ even}\\}', true, '$0^*1^*$ intersected with even-length strings.'],
    ['\\{0^i1^j : i \\ne j\\}', false, 'If it were regular, its complement intersected with $0^*1^*$ would be $\\{0^n1^n\\}$.'],
    ['\\{w : w \\text{ contains } 0^n1^n \\text{ as a substring for some } n \\ge 1\\}', true, 'Equivalent to "contains 01": $\\Sigma^*01\\Sigma^*$.'],
    ['\\{0^n1^n : n\\ge 0\\}^*', false, 'Intersect with $0^*1^*$: get $\\{0^n1^n\\}$ — non-regular.'],
    ['\\{w : w \\text{ is the binary encoding of a multiple of } 7\\}', true, 'DFA tracking value mod 7.'],
    ['\\{0^i1^j : i \\equiv j \\pmod 2\\}', true, 'Within $0^*1^*$ this is just even total length.'],
    ['\\text{balanced strings of parentheses}', false, 'Fooling set $\\{(^i\\}$ with suffix $)^i$.'],
    ['\\{w : w = w^R\\}', false, 'Palindromes: fooling set $\\{0^i1\\}$ with suffix $0^i$.'],
    ['\\{w : \\#_0(w) > \\#_1(w)\\}', false, 'Fooling set $\\{0^i\\}$ with suffix $1^i$.'],
    ['\\{0^{2^n} : n \\ge 0\\}', false, 'Fooling set $\\{0^{2^i}\\}$ with suffix $0^{2^i}$.'],
    ['\\overline{\\{0^n1^n : n\\ge0\\}}', false, 'Regular languages are closed under complement.'],
    ['\\{w : w=w^R,\\ |w| \\le 10\\}', true, 'Finite ⇒ regular.'],
    ['\\{x\\#y : x,y\\in\\{0,1\\}^*,\\ |x|=|y|\\}', false, 'Fooling set $\\{0^i : i \\ge 0\\}$ with suffix $\\#0^i$.'],
    ['\\{x\\#y : x \\text{ and } y \\text{ both contain } 11\\}', true, 'Concatenation of regular languages.'],
    ['\\{0^i1^j : j = 2i\\}', false, 'Fooling set $\\{0^i\\}$ with suffix $1^{2i}$.'],
    ['\\{w : \\text{every prefix of } w \\text{ has } |\\#_0-\\#_1| \\le 2\\}', true, 'Bounded counter: 5 live values of $\\#_0-\\#_1$ plus a dead state.'],
    ['\\{0^i1^j0^i : i,j\\ge0\\}', false, 'Fooling set $\\{0^i\\}$ with suffix $10^i$.'],
    ['\\{w \\in \\{0,1\\}^* : w \\text{ contains } 1 \\text{ and the } 5\\text{th symbol from the end is } 1\\}', true, 'NFA guesses the position; finite memory of the last 5 symbols.'],
    ['L_1 \\cup L_2 \\text{ where } L_1=\\{0^n1^n\\},\\ L_2 = \\{0,1\\}^*', true, '$L_1 \\cup \\Sigma^* = \\Sigma^*$, which is regular — unions with non-regular sets can be regular.'],
  ];
  G['regular-or-not'] = {
    topic: 'nonregular', title: 'Regular or not?',
    gen() { const [L, ans, why] = pick(REG); return { prompt: `Is this language (over $\\Sigma=\\{0,1\\}$ unless stated) **regular**?\n\n$$${L}$$`, kind: 'yesno', answer: ans, explain: `${ans ? '**Regular.**' : '**Not regular.**'} ${why}` }; },
  };
  const DEC_CH = ['Decidable', 'Undecidable, but recognizable', 'Undecidable, but co-recognizable (complement is recognizable)', 'Neither recognizable nor co-recognizable'];
  const DEC = [
    ['\\{\\langle M\\rangle : M \\text{ accepts } \\varepsilon\\}', 1, 'Simulate $M$ on $\\varepsilon$ to recognize; undecidable by reduction from HALT (or Rice).', true],
    ['\\{\\langle M\\rangle : M \\text{ has fewer than 374 states}\\}', 0, 'A syntactic property of the encoding — just count.', false],
    ['\\{\\langle M\\rangle : M \\text{ halts on } \\varepsilon \\text{ within 374 steps}\\}', 0, 'Simulate for 374 steps.', false],
    ['\\{\\langle M\\rangle : L(M) = \\emptyset\\}', 2, 'Complement ("accepts something") is recognizable by dovetailing; emptiness itself is not recognizable.', true],
    ['\\{\\langle M\\rangle : L(M) = \\Sigma^*\\}', 3, 'Neither $ALL_{TM}$ nor its complement is recognizable.', true],
    ['\\{\\langle M, w\\rangle : M \\text{ halts on } w\\}', 1, 'The halting problem: recognizable by simulation, undecidable by diagonalization.', false],
    ['\\{\\langle M\\rangle : L(M) \\text{ is regular}\\}', 3, 'Rice ⇒ undecidable; in fact neither it nor its complement is recognizable.', true],
    ['\\{\\langle M_1, M_2\\rangle : L(M_1)=L(M_2)\\}', 3, '$EQ_{TM}$ is neither recognizable nor co-recognizable.', true],
    ['\\{\\langle D\\rangle : D \\text{ is a DFA and } L(D)=\\Sigma^*\\}', 0, 'Complement the DFA and check reachability of an accepting state.', false],
    ['\\{\\langle G\\rangle : G \\text{ is a CFG and } L(G)=\\emptyset\\}', 0, 'Mark generating nonterminals; check whether the start symbol is generating.', false],
    ['\\{\\langle G\\rangle : G \\text{ is a CFG and } L(G)=\\Sigma^*\\}', 2, 'Undecidable (known result); the complement is recognizable: search for a string $G$ does not generate.', false],
    ['\\{\\langle M\\rangle : M \\text{ accepts } \\langle M\\rangle\\}', 1, 'Recognize by simulation; undecidable by diagonalization.', false],
    ['\\{\\langle M\\rangle : M \\text{ accepts at least 374 strings}\\}', 1, 'Dovetail over all inputs and count acceptances; undecidable by Rice.', true],
    ['\\{\\langle M\\rangle : L(M) \\text{ is finite}\\}', 3, 'Neither recognizable nor co-recognizable.', true],
    ['\\{\\langle M, w\\rangle : M \\text{ accepts } w \\text{ within } |w|^2 \\text{ steps}\\}', 0, 'Bounded simulation always halts.', false],
    ['\\{\\langle M\\rangle : M \\text{ enters state } q_{17} \\text{ on some input}\\}', 1, 'About the machine, not its language, so Rice does NOT apply — but still undecidable by a direct reduction from HALT. Recognizable by dovetailing.', false],
    ['\\{\\langle M\\rangle : M \\text{ ever moves its head left when run on } \\varepsilon\\}', 0, 'Until it first moves left, $M$ only sees blanks to the right; after $|Q|$ such steps a state repeats and it never will. Simulate that long.', false],
    ['\\{\\langle M\\rangle : M \\text{ accepts some palindrome}\\}', 1, 'Dovetail over palindromes to recognize; undecidable by Rice.', true],
    ['\\{\\langle M\\rangle : M \\text{ does not halt on } \\varepsilon\\}', 2, 'Complement of a recognizable undecidable language.', false],
  ];
  G['decidable'] = {
    topic: 'undecidable', title: 'Classify the language',
    gen() { const [L, ans, why] = pick(DEC); return { prompt: `Classify this language:\n\n$$${L}$$`, kind: 'mc', choices: DEC_CH, answer: ans, explain: why }; },
  };
  G['rice'] = {
    topic: 'undecidable', title: 'Does Rice apply?',
    gen() { const [L, , why, rice] = pick(DEC); return { prompt: `Does **Rice's theorem** apply directly to show this language is undecidable? (Rice needs a non-trivial property of the *language* $L(M)$ alone.)\n\n$$${L}$$`, kind: 'yesno', answer: rice, explain: `${rice ? 'Yes: membership depends only on $L(M)$, and the property is non-trivial.' : 'No: the property is not (only) a non-trivial property of $L(M)$ — it is decidable, about pairs/inputs/steps/states, or not about a TM language at all.'} ${why}` }; },
  };
  const CFGS = [
    ['S -> 0S1 | ε', '01'], ['S -> (S)S | ε', '()'], ['S -> aSa | bSb | a | b | ε', 'ab'], ['S -> aSbS | bSaS | ε', 'ab'],
    ['S -> A | B\nA -> 0A1 | 0A | 0\nB -> 0B1 | B1 | 1', '01'], ['S -> 0S11 | ε', '01'], ['S -> aSb | aS | ε', 'ab'], ['S -> SS | 0S1 | 1S0 | ε', '01'],
    ['S -> AB\nA -> 0A1 | ε\nB -> 1B0 | ε', '01'],
  ];
  G['cfg-member'] = {
    topic: 'cfg', title: 'Does the grammar generate it?',
    gen() {
      const [src, alpha] = pick(CFGS); const g = C.parseGrammar(src).grammar;
      let w; if (Math.random() < 0.5) { const e = C.enumerate(g, alpha, 8, 80).strings.filter((s) => s.length >= 2); w = e.length ? pick(e) : randStr(alpha, 2, 7); } else w = randStr(alpha, 2, 7);
      const tree = C.parseTree(g, w);
      return { prompt: `Does this grammar generate **${w}**?\n\n~~~pseudo\n${src}\n~~~`, kind: 'yesno', answer: !!tree,
        explain: tree ? `Yes. Leftmost derivation: ${C.leftmostDerivation(tree).join(' ⇒ ')}` : `No. Shortest generated strings: ${C.enumerate(g, alpha, 6, 10).strings.map(show).join(', ')}, …` };
    },
  };
  const TMS = [
    { name: 'marks 0s and 1s in pairs (0ⁿ1ⁿ)', alpha: '01', src: 'start: q0\naccept: qa\nreject: qr\nblank: _\nq0 0 -> q1 X R\nq0 Y -> q3 Y R\nq0 _ -> qa _ R\nq1 0 -> q1 0 R\nq1 Y -> q1 Y R\nq1 1 -> q2 Y L\nq2 0 -> q2 0 L\nq2 Y -> q2 Y L\nq2 X -> q0 X R\nq3 Y -> q3 Y R\nq3 _ -> qa _ R' },
    { name: 'parity machine', alpha: '01', src: 'start: e\naccept: A\nreject: R\nblank: _\ne 0 -> e 0 R\ne 1 -> o 1 R\no 0 -> o 0 R\no 1 -> e 1 R\ne _ -> A _ S\no _ -> R _ S' },
    { name: 'even palindromes', alpha: 'ab', src: 'start: q0\naccept: qa\nreject: qr\nblank: _\nq0 _ -> qa _ S\nq0 a -> ra _ R\nq0 b -> rb _ R\nra a -> ra a R\nra b -> ra b R\nra _ -> ca _ L\nrb a -> rb a R\nrb b -> rb b R\nrb _ -> cb _ L\nca a -> back _ L\ncb b -> back _ L\nback a -> back a L\nback b -> back b L\nback _ -> q0 _ R' },
    { name: 'ends-with check', alpha: 'ab', src: 'start: s\naccept: Y\nreject: N\nblank: _\ns a -> s a R\ns b -> s b R\ns _ -> t _ L\nt a -> u a L\nt b -> N b S\nt _ -> N _ S\nu b -> Y b S\nu a -> N a S\nu _ -> N _ S' },
  ];
  G['tm-run'] = {
    topic: 'tm', title: 'Run a Turing machine',
    gen() {
      const M = pick(TMS); const tm = T.parseTM(M.src).tm;
      let w = randStr(M.alpha, 0, 6);
      if (M.alpha === '01' && M.name.startsWith('marks') && Math.random() < 0.5) { const k = ri(1, 3); w = '0'.repeat(k) + '1'.repeat(k + pick([0, 0, 1, -1])); }
      if (M.name === 'even palindromes' && Math.random() < 0.5) { const h = randStr('ab', 1, 3); w = h + [...h].reverse().join(''); }
      const r = T.runTM(tm, w, 5000);
      return { prompt: `Does this Turing machine accept the input **${show(w)}**? (Missing transitions reject.)`, kind: 'yesno', answer: r.result === 'accept', visual: { type: 'tm', src: M.src, input: w },
        explain: `It ${r.result === 'accept' ? 'accepts' : 'rejects'} after ${r.steps} step(s), halting in state **${r.run.state}**. Use the step button to watch it run.` };
    },
  };

  /* ------------------------------------------------------- recurrences */
  const fmtN = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 1000) / 1000));
  function masterAnswer(a, b, c, k) {
    const crit = Math.log(a) / Math.log(b);
    const pw = (e) => (Math.abs(e) < 1e-9 ? '' : Math.abs(e - 1) < 1e-9 ? 'n' : `n^{${fmtN(e)}}`);
    const lg = (e) => (e === 0 ? '' : e === 1 ? '\\log n' : `\\log^{${e}} n`);
    const th = (s) => `\\Theta(${s || '1'})`;
    if (Math.abs(c - crit) < 1e-9) return th(`${pw(c)} ${lg(k + 1)}`.trim());
    if (c < crit) return th(Number.isInteger(crit + 1e-12) || Math.abs(crit - Math.round(crit)) < 1e-9 ? pw(crit) : `n^{\\log_{${b}} ${a}}`);
    return th(`${pw(c)} ${lg(k)}`.trim());
  }
  G['master'] = {
    topic: 'recursion', title: 'Master theorem',
    gen() {
      const b = pick([2, 2, 3, 4]); const c = pick([0, 0.5, 1, 1, 2, 3]); const k = pick([0, 0, 0, 1]);
      let a = pick([1, 2, 3, 4, 7, 8, 9, 16]);
      if (Math.random() < 0.4) a = Math.round(Math.pow(b, c)) || 1; // force the balanced case sometimes
      const f = `${c === 0 ? (k ? '' : '1') : c === 1 ? 'n' : `n^{${fmtN(c)}}`}${k ? (c === 0 ? '\\log n' : ' \\log n') : ''}`;
      const correct = masterAnswer(a, b, c, k);
      const distract = [masterAnswer(a, b, c, k + 1), masterAnswer(a, b, c + 1, k), `\\Theta(n^{\\log_{${b}} ${a}} \\log n)`, `\\Theta(n^{${fmtN(c)}})`, '\\Theta(n \\log n)', '\\Theta(n)', '\\Theta(n^2)', '\\Theta(\\log n)', `\\Theta(n^{${fmtN(Math.log(a) / Math.log(b))}})`].map((x) => x.replace('n^{1}', 'n'));
      const { choices, answer } = mc(correct, distract);
      const crit = Math.log(a) / Math.log(b), r = a / Math.pow(b, c);
      return { prompt: `Solve $T(n) = ${a === 1 ? '' : a}\\,T(n/${b}) + ${f}$.`, kind: 'mc', choices: choices.map((x) => `$${x}$`), answer,
        explain: `Compare $f(n)$'s exponent $c=${fmtN(c)}$ with $\\log_{${b}} ${a} = ${fmtN(crit)}$. Level sums of the recursion tree change by a factor $a/b^c = ${fmtN(r)}$ per level: ${Math.abs(r - 1) < 1e-9 ? 'all levels equal ⇒ multiply $f(n)$ by the number of levels, $\\Theta(\\log n)$.' : r > 1 ? 'increasing ⇒ the leaves dominate: $\\Theta(n^{\\log_b a})$.' : 'decreasing ⇒ the root dominates: $\\Theta(f(n))$.'} Answer: $${correct}$.` };
    },
  };
  const RECS = [
    ['T(n) = T(n-1) + n', '\\Theta(n^2)', 'Unroll: $n + (n-1) + \\dots + 1$.'],
    ['T(n) = T(n-1) + 1', '\\Theta(n)', 'One unit per level, $n$ levels.'],
    ['T(n) = 2T(n-1) + 1', '\\Theta(2^n)', 'Level $i$ has $2^i$ nodes; $n$ levels.'],
    ['T(n) = T(n/2) + T(n/3) + n', '\\Theta(n)', 'Level sums shrink by $5/6$ per level ⇒ root dominates.'],
    ['T(n) = 2T(n/4) + T(n/2) + n', '\\Theta(n \\log n)', 'Fractions sum to $1/4+1/4+1/2 = 1$ ⇒ every level costs $n$; $\\Theta(\\log n)$ levels.'],
    ['T(n) = T(n/5) + T(7n/10) + n', '\\Theta(n)', '$1/5 + 7/10 = 9/10 < 1$ ⇒ geometric decrease (median of medians).'],
    ['T(n) = T(\\sqrt n) + 1', '\\Theta(\\log\\log n)', 'Substitute $n = 2^{2^k}$: $k = \\log\\log n$ levels.'],
    ['T(n) = 2T(\\sqrt n) + \\log n', '\\Theta(\\log n \\log\\log n)', 'With $m=\\log n$: $S(m) = 2S(m/2)+m = \\Theta(m\\log m)$.'],
    ['T(n) = \\sqrt n\\, T(\\sqrt n) + n', '\\Theta(n \\log\\log n)', 'Each level costs $n$; there are $\\log\\log n$ levels.'],
    ['T(n) = T(n-1) + T(n-2) + 1', '\\Theta(\\varphi^n)', 'Fibonacci-like; $\\varphi = (1+\\sqrt5)/2$.'],
    ['T(n) = T(n-1) + \\log n', '\\Theta(n \\log n)', '$\\sum \\log i = \\log n! = \\Theta(n\\log n)$.'],
    ['T(n) = T(n/3) + T(2n/3) + n', '\\Theta(n \\log n)', 'Fractions sum to 1 ⇒ $n$ per level; depth $\\Theta(\\log n)$.'],
    ['T(n) = T(n-2) + n^2', '\\Theta(n^3)', '$n/2$ terms each $O(n^2)$, half of them $\\Omega(n^2)$.'],
    ['T(n) = 2T(n/2) + n/\\log n', '\\Theta(n \\log\\log n)', 'Level $i$ costs $n/(\\log n - i)$: a harmonic sum.'],
    ['T(n) = T(n/2) + \\log n', '\\Theta(\\log^2 n)', '$\\sum_i (\\log n - i)$ over $\\log n$ levels.'],
    ['T(n) = 3T(n/3) + n', '\\Theta(n \\log n)', 'Balanced case.'],
    ['T(n) = T(n/2) + n', '\\Theta(n)', 'Geometric decrease ⇒ root.'],
    ['T(n) = 8T(n/2) + n^2', '\\Theta(n^3)', 'Leaves: $n^{\\log_2 8} = n^3$.'],
  ];
  G['recurrence'] = {
    topic: 'recursion', title: 'Solve the recurrence',
    gen() {
      const [r, ans, why] = pick(RECS);
      const { choices, answer } = mc(ans, RECS.map((x) => x[1]));
      return { prompt: `Solve $${r}$ (with $T(\\text{small}) = \\Theta(1)$).`, kind: 'mc', choices: choices.map((x) => `$${x}$`), answer, explain: `$${ans}$. ${why}` };
    },
  };
  const GROWTH = [
    ['n \\log n', 'n^{1.01}', 0], ['\\log(n!)', 'n\\log n', 1], ['2^n', '3^n', 0], ['n^{\\log n}', '2^n', 0], ['\\log^{2} n', '\\sqrt n', 0],
    ['2^{n+1}', '2^n', 1], ['4^n', '2^{2n}', 1], ['n!', 'n^n', 0], ['\\log_2 n', '\\log_{10} n', 1], ['\\sqrt n \\log n', 'n/\\log n', 0],
    ['n^{1/\\log n}', '1', 1], ['H_n = \\sum_{i\\le n} 1/i', '\\ln n', 1], ['2^{\\sqrt{\\log n}}', '\\log^2 n', 2], ['n^3', '2^{3\\log_2 n}', 1],
    ['3^{\\log_2 n}', 'n^{1.5}', 2], ['2^{2^n}', '2^{n^2}', 2], ['n^{100}', '1.01^n', 0], ['(\\log n)^{\\log n}', 'n^{2}', 2], ['\\binom{n}{2}', 'n^2', 1], ['\\log(n^{10})', '\\log n', 1],
  ];
  const GR_CH = ['$f = o(g)$ — $f$ grows strictly slower', '$f = \\Theta(g)$', '$f = \\omega(g)$ — $f$ grows strictly faster'];
  G['growth'] = {
    topic: 'recursion', title: 'Compare growth rates',
    gen() {
      let [f, g, rel] = pick(GROWTH); if (Math.random() < 0.5) { [f, g] = [g, f]; rel = 2 - rel; }
      return { prompt: `Compare $f(n) = ${f}$ with $g(n) = ${g}$.`, kind: 'mc', choices: GR_CH, answer: rel, explain: `${GR_CH[rel]}. Take logs or rewrite both sides as powers of 2 to compare (e.g. $a^{\\log_b n} = n^{\\log_b a}$, $\\log n! = \\Theta(n\\log n)$, $\\log_a n = \\Theta(\\log_b n)$).` };
    },
  };

  /* ---------------------------------------------------------------- DP */
  const word = () => randStr('ABCD', 3, 6);
  G['dp-edit'] = { topic: 'dp', title: 'Edit distance', gen() { const a = word(), b = word(); const R = D.PROBLEMS.edit.build({ A: a, B: b }); return { prompt: `What is the edit distance between **${a}** and **${b}**? (insert, delete, substitute — each costs 1)`, kind: 'number', answer: R.cells[a.length][b.length], visual: { type: 'dp', R }, explain: `Fill $\\mathit{Edit}(i,j)$ row by row; the bottom-right cell is the answer, ${R.cells[a.length][b.length]}. The green cells trace one optimal alignment.` }; } };
  G['dp-lcs'] = { topic: 'dp', title: 'LCS length', gen() { const a = randStr('ABC', 4, 7), b = randStr('ABC', 4, 7); const R = D.PROBLEMS.lcs.build({ A: a, B: b }); return { prompt: `Length of the longest common subsequence of **${a}** and **${b}**?`, kind: 'number', answer: R.cells[a.length][b.length], visual: { type: 'dp', R }, explain: R.answer + '.' }; } };
  G['dp-lis'] = { topic: 'dp', title: 'LIS length', gen() { const arr = Array.from({ length: ri(7, 10) }, () => ri(1, 20)); const R = D.PROBLEMS.lis.build({ A: arr.join(' ') }); const ans = Math.max(...R.cells[0]); return { prompt: `Length of the longest **strictly** increasing subsequence of $[${arr.join(', ')}]$?`, kind: 'number', answer: ans, visual: { type: 'dp', R }, explain: R.answer + '. Each cell is $\\mathit{LISfirst}(i)$, computed right to left.' }; } };
  G['dp-knap'] = {
    topic: 'dp2', title: '0/1 knapsack',
    gen() { const n = ri(3, 5); const W = Array.from({ length: n }, () => ri(1, 6)), V = Array.from({ length: n }, () => ri(1, 12)); const cap = ri(5, 10); const R = D.PROBLEMS.knap.build({ W: W.join(' '), V: V.join(' '), C: String(cap) }); return { prompt: `Items (weight, value): ${W.map((w, i) => `(${w}, ${V[i]})`).join(', ')}. Capacity ${cap}. Maximum total value (each item used at most once)?`, kind: 'number', answer: R.cells[0][cap], visual: { type: 'dp', R }, explain: R.answer + '.' }; },
  };
  G['dp-subset'] = {
    topic: 'dp2', title: 'Subset sum',
    gen() { const X = Array.from({ length: ri(4, 6) }, () => ri(2, 12)); const t = ri(8, 25); const R = D.PROBLEMS.subset.build({ X: X.join(' '), T: String(t) }); const ok = R.cells[0][t] === 'T'; return { prompt: `Is there a subset of $\\{${X.join(', ')}\\}$ summing to exactly **${t}**?`, kind: 'yesno', answer: ok, visual: { type: 'dp', R }, explain: R.answer + '.' }; },
  };
  G['dp-chain'] = {
    topic: 'dp2', title: 'Matrix chain',
    gen() { const d = Array.from({ length: ri(4, 5) }, () => ri(1, 9) * pick([1, 2, 5])); const R = D.PROBLEMS.chain.build({ D: d.join(' ') }); const n = d.length - 1; return { prompt: `Matrices with dimensions $${d.slice(0, -1).map((x, i) => `${x}\\times${d[i + 1]}`).join(',\\ ')}$. Minimum number of scalar multiplications to compute their product?`, kind: 'number', answer: R.cells[0][n - 1], visual: { type: 'dp', R }, explain: R.answer + '.' }; },
  };
  G['dp-lps'] = { topic: 'dp2', title: 'Longest palindromic subsequence', gen() { const s = randStr('ABC', 5, 8); const R = D.PROBLEMS.lps.build({ A: s }); return { prompt: `Length of the longest palindromic subsequence of **${s}**?`, kind: 'number', answer: R.cells[0][s.length - 1], visual: { type: 'dp', R }, explain: R.answer + '. Interval DP over $A[i..j]$.' }; } };

  /* ------------------------------------------------------------- graphs */
  function randGraph(n, m, { directed = false, weighted = false, connected = true, dag = false, neg = false } = {}) {
    for (let t = 0; t < 500; t++) {
      const E = new Map(); const order = shuffle([...Array(n).keys()]);
      if (connected && !directed) for (let i = 1; i < n; i++) { const j = order[ri(0, i - 1)]; const u = order[i]; E.set(Math.min(u, j) + ',' + Math.max(u, j), [u, j]); }
      let guard = 0;
      while (E.size < m && guard++ < 1000) {
        let u = ri(0, n - 1), v = ri(0, n - 1); if (u === v) continue;
        if (dag && order.indexOf(u) > order.indexOf(v)) [u, v] = [v, u];
        const key = directed ? u + ',' + v : Math.min(u, v) + ',' + Math.max(u, v);
        if (!E.has(key) && !(directed && E.has(v + ',' + u) && !dag && Math.random() < 0.5)) E.set(key, [u, v]);
      }
      const ws = shuffle([...Array(40).keys()].map((x) => x + 1));
      const edges = [...E.values()].map(([u, v], i) => [u, v, weighted ? (neg && Math.random() < 0.4 ? -ri(1, 6) : ws[i]) : 1]);
      return { n, edges, directed, weighted };
    }
  }
  const gtext = (g) => (g.directed ? 'directed\n' : '') + [...Array(g.n).keys()].map((i) => LET[i]).join('\n') + '\n' + g.edges.map(([u, v, w]) => `${LET[u]} ${LET[v]}${g.weighted ? ' ' + w : ''}`).join('\n');
  const adjOf = (g) => { const adj = Array.from({ length: g.n }, () => []); g.edges.forEach(([u, v, w]) => { adj[u].push([v, w]); if (!g.directed) adj[v].push([u, w]); }); adj.forEach((a) => a.sort((x, y) => x[0] - y[0])); return adj; };
  function bfsDist(g, s) { const adj = adjOf(g); const d = Array(g.n).fill(Infinity); d[s] = 0; const q = [s]; while (q.length) { const u = q.shift(); for (const [v] of adj[u]) if (d[v] === Infinity) { d[v] = d[u] + 1; q.push(v); } } return d; }

  G['bfs-dist'] = {
    topic: 'graphs', title: 'BFS distance',
    gen() { const g = randGraph(7, 9); const d = bfsDist(g, 0); const t = ri(1, 6); return { prompt: `In this unweighted graph, how many edges are on a shortest path from **a** to **${LET[t]}**?`, kind: 'number', answer: d[t], visual: { type: 'graph', text: gtext(g) }, explain: `BFS from a gives distances: ${d.map((x, i) => `${LET[i]}=${x}`).join(', ')}.` }; },
  };
  G['bipartite'] = {
    topic: 'graphs', title: 'Bipartite?',
    gen() {
      const n0 = ri(6, 7); const g = randGraph(n0, ri(n0 - 1, n0 + 1)); const adj = adjOf(g); const col = Array(g.n).fill(-1); let ok = true; let odd = null;
      for (let s = 0; s < g.n; s++) { if (col[s] >= 0) continue; col[s] = 0; const q = [s]; while (q.length) { const u = q.shift(); for (const [v] of adj[u]) { if (col[v] < 0) { col[v] = 1 - col[u]; q.push(v); } else if (col[v] === col[u]) { ok = false; odd = odd || [u, v]; } } } }
      return { prompt: 'Is this graph **bipartite**?', kind: 'yesno', answer: ok, visual: { type: 'graph', text: gtext(g) }, explain: ok ? `Yes. 2-coloring by BFS layers: side A = {${col.map((c, i) => (c === 0 ? LET[i] : null)).filter(Boolean).join(', ')}}, side B = the rest.` : `No. BFS 2-coloring finds edge ${LET[odd[0]]}–${LET[odd[1]]} with both ends the same color, which means there is an odd cycle.` };
    },
  };
  function dfsInfo(g) {
    const adj = adjOf(g); const pre = Array(g.n).fill(null), post = Array(g.n).fill(null); let clock = 0; const order = []; const type = new Map();
    const visit = (u) => { pre[u] = ++clock; order.push(u); for (const [v] of adj[u]) { if (pre[v] === null) { type.set(u + ',' + v, 'tree'); visit(v); } else if (!type.has(u + ',' + v)) type.set(u + ',' + v, post[v] === null ? 'back' : pre[u] < pre[v] ? 'forward' : 'cross'); } post[u] = ++clock; };
    for (let s = 0; s < g.n; s++) if (pre[s] === null) visit(s);
    return { pre, post, order, type };
  }
  G['dfs-pre'] = {
    topic: 'dags', title: 'DFS preorder',
    gen() { const g = randGraph(6, 8, { directed: true, connected: false }); const r = dfsInfo(g); const ans = r.order.map((x) => LET[x]).join(' '); return { prompt: 'Run DFS on this directed graph starting at **a**, always exploring neighbors in **alphabetical order** and restarting from the alphabetically first unvisited vertex when stuck. Give the vertices in **preorder** (letters separated by spaces).', kind: 'text', expected: ans, check: (s) => s.toLowerCase().replace(/[^a-j]/g, '') === ans.replace(/ /g, ''), visual: { type: 'graph', text: gtext(g) }, explain: `Preorder: **${ans}**. (pre/post: ${r.pre.map((p, i) => `${LET[i]} ${p}/${r.post[i]}`).join(', ')})` }; },
  };
  const EDGE_CH = ['tree', 'back', 'forward', 'cross'];
  G['dfs-edge'] = {
    topic: 'dags', title: 'Classify a DFS edge',
    gen() {
      for (;;) {
        const g = randGraph(6, 9, { directed: true, connected: false }); const r = dfsInfo(g);
        const non = g.edges.filter(([u, v]) => r.type.get(u + ',' + v) !== 'tree'); const e = Math.random() < 0.8 && non.length ? pick(non) : pick(g.edges);
        const t = r.type.get(e[0] + ',' + e[1]);
        return { prompt: `DFS from **a** (neighbors in alphabetical order, restarting at the first unvisited vertex). What type is edge **${LET[e[0]]}→${LET[e[1]]}**?`, kind: 'mc', choices: EDGE_CH, answer: EDGE_CH.indexOf(t), visual: { type: 'graph', text: gtext(g) },
          explain: `pre/post intervals: ${r.pre.map((p, i) => `${LET[i]} [${p}, ${r.post[i]}]`).join(', ')}. For $u\\to v$: tree/forward if $v$'s interval nests inside $u$'s (tree if first discovered via this edge); back if $u$'s nests inside $v$'s; cross if $v$ finished before $u$ started. Here it is **${t}**.` };
      }
    },
  };
  G['topo'] = {
    topic: 'dags', title: 'Topological order',
    gen() {
      const g = randGraph(6, 8, { directed: true, dag: true, connected: false });
      const check = (s) => { const seq = s.toLowerCase().replace(/[^a-j]/g, '').split('').map((c) => LET.indexOf(c)); if (seq.length !== g.n || new Set(seq).size !== g.n || seq.some((x) => x < 0 || x >= g.n)) return false; const pos = new Map(seq.map((v, i) => [v, i])); return g.edges.every(([u, v]) => pos.get(u) < pos.get(v)); };
      const r = dfsInfo(g); const ex = [...Array(g.n).keys()].sort((x, y) => r.post[y] - r.post[x]).map((x) => LET[x]).join(' ');
      return { prompt: 'Give **any** topological order of this DAG (all vertices, separated by spaces).', kind: 'text', expected: ex, check, visual: { type: 'graph', text: gtext(g) }, explain: `One valid order (decreasing DFS post time): **${ex}**. Any order where every edge goes left-to-right is accepted.` };
    },
  };
  G['scc-count'] = {
    topic: 'dags', title: 'Count SCCs',
    gen() {
      const g = randGraph(7, ri(9, 13), { directed: true, connected: false }); const adj = adjOf(g);
      const reach = [...Array(g.n).keys()].map((s) => { const seen = new Set([s]); const st = [s]; while (st.length) { const u = st.pop(); for (const [v] of adj[u]) if (!seen.has(v)) { seen.add(v); st.push(v); } } return seen; });
      const comp = Array(g.n).fill(-1); let c = 0; const groups = [];
      for (let i = 0; i < g.n; i++) if (comp[i] < 0) { const grp = []; for (let j = 0; j < g.n; j++) if (reach[i].has(j) && reach[j].has(i)) { comp[j] = c; grp.push(LET[j]); } groups.push('{' + grp.join(',') + '}'); c++; }
      return { prompt: 'How many **strongly connected components** does this directed graph have?', kind: 'number', answer: c, visual: { type: 'graph', text: gtext(g) }, explain: `SCCs: ${groups.join(' ')}. Two vertices share an SCC iff each can reach the other.` };
    },
  };
  function dijkstra(g, s) { const adj = adjOf(g); const d = Array(g.n).fill(Infinity), done = Array(g.n).fill(false); d[s] = 0; const order = []; for (;;) { let u = -1; for (let i = 0; i < g.n; i++) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i; if (u < 0) break; done[u] = true; order.push(u); for (const [v, w] of adj[u]) if (d[u] + w < d[v]) d[v] = d[u] + w; } return { d, order }; }
  G['dijkstra-dist'] = {
    topic: 'shortest', title: 'Shortest-path distance',
    gen() { const g = randGraph(6, 9, { directed: true, weighted: true, connected: false }); g.edges.forEach((e) => { e[2] = ri(1, 9); }); const { d } = dijkstra(g, 0); const cand = [...Array(g.n).keys()].filter((i) => i && d[i] < Infinity); if (!cand.length) return G['dijkstra-dist'].gen(); const t = pick(cand); return { prompt: `What is the shortest-path distance from **a** to **${LET[t]}** in this weighted directed graph?`, kind: 'number', answer: d[t], visual: { type: 'graph', text: gtext(g) }, explain: `Dijkstra from a: ${d.map((x, i) => `${LET[i]}=${x === Infinity ? '∞' : x}`).join(', ')}.` }; },
  };
  G['dijkstra-order'] = {
    topic: 'shortest', title: 'Dijkstra extraction order',
    gen() {
      for (;;) {
        const g = randGraph(6, 9, { directed: false, weighted: true }); g.edges.forEach((e) => { e[2] = ri(1, 12); });
        const { d, order } = dijkstra(g, 0); if (new Set(d).size !== d.length) continue;
        const ans = order.map((x) => LET[x]).join(' ');
        return { prompt: 'Run Dijkstra from **a**. In what order are vertices **extracted** (finalized)? (letters separated by spaces)', kind: 'text', expected: ans, check: (s) => s.toLowerCase().replace(/[^a-j]/g, '') === ans.replace(/ /g, ''), visual: { type: 'graph', text: gtext(g) }, explain: `Vertices leave the priority queue in increasing order of distance: ${order.map((x) => `${LET[x]} (${d[x]})`).join(', ')}.` };
      }
    },
  };
  G['negcycle'] = {
    topic: 'shortest', title: 'Negative cycle?',
    gen() {
      const g = randGraph(5, 7, { directed: true, weighted: true, connected: false, neg: true }); g.edges.forEach((e) => { if (e[2] > 0) e[2] = ri(1, 6); });
      const d = Array(g.n).fill(Infinity); d[0] = 0; for (let k = 0; k < g.n - 1; k++) for (const [u, v, w] of g.edges) if (d[u] + w < d[v]) d[v] = d[u] + w;
      const neg = g.edges.some(([u, v, w]) => d[u] + w < d[v]);
      return { prompt: 'Is there a **negative cycle reachable from a**?', kind: 'yesno', answer: neg, visual: { type: 'graph', text: gtext(g) }, explain: neg ? 'Yes: after $V-1$ Bellman–Ford phases some edge is still tense.' : `No: Bellman–Ford converges (distances ${d.map((x, i) => `${LET[i]}=${x === Infinity ? '∞' : x}`).join(', ')}) and no edge remains tense.` };
    },
  };
  function kruskal(g) { const p = [...Array(g.n).keys()]; const f = (x) => (p[x] === x ? x : (p[x] = f(p[x]))); const chosen = []; let w = 0; [...g.edges].sort((a, b) => a[2] - b[2]).forEach((e) => { const a = f(e[0]), b = f(e[1]); if (a !== b) { p[a] = b; chosen.push(e); w += e[2]; } }); return { chosen, w }; }
  G['mst-weight'] = {
    topic: 'mst', title: 'MST weight',
    gen() { const g = randGraph(6, 9, { weighted: true }); const r = kruskal(g); return { prompt: 'What is the total weight of the **minimum spanning tree**?', kind: 'number', answer: r.w, visual: { type: 'graph', text: gtext(g) }, explain: `Kruskal adds, in order: ${r.chosen.map((e) => `${LET[e[0]]}${LET[e[1]]} (${e[2]})`).join(', ')} — total ${r.w}.` }; },
  };
  G['mst-edge'] = {
    topic: 'mst', title: 'Is this edge in the MST?',
    gen() { const g = randGraph(6, 9, { weighted: true }); const r = kruskal(g); const e = pick(g.edges); const inT = r.chosen.includes(e); return { prompt: `Weights are distinct, so the MST is unique. Is edge **${LET[e[0]]}–${LET[e[1]]}** (weight ${e[2]}) in it?`, kind: 'yesno', answer: inT, visual: { type: 'graph', text: gtext(g) }, explain: inT ? 'Yes — it is the lightest edge across some cut (it joins two different components when Kruskal reaches it).' : 'No — it is the heaviest edge on some cycle (both endpoints are already connected by lighter edges when Kruskal reaches it).' }; },
  };
  const NPB = [
    ['2SAT', 0, 'Implication graph + SCCs, linear time.'], ['3SAT', 1, 'Canonical NP-complete problem.'], ['2-coloring a graph', 0, 'Bipartiteness via BFS.'], ['3-coloring a graph', 1, 'Reduction from 3SAT.'],
    ['Shortest path with non-negative weights', 0, 'Dijkstra.'], ['Longest simple path (does a simple path of length ≥ k exist?)', 1, 'Generalizes Hamiltonian path.'], ['Euler tour (use every edge exactly once)', 0, 'Check degrees and connectivity.'],
    ['Hamiltonian cycle', 1, 'Reduction from 3SAT / vertex cover.'], ['Minimum spanning tree', 0, 'Kruskal/Prim/Borůvka.'], ['Maximum independent set in a tree', 0, 'Tree DP in linear time.'],
    ['Independent set (general graphs, k part of the input)', 1, 'Reduction from 3SAT.'], ['Vertex cover in bipartite graphs', 0, 'Kőnig\'s theorem + max matching (flows).'], ['Does G contain a triangle (clique of size 3)?', 0, 'Brute force over triples is $O(V^3)$ — fixed $k$ is polynomial.'],
    ['Clique (k part of the input)', 1, 'Equivalent to independent set in the complement graph.'], ['Subset sum with numbers written in unary', 0, 'The pseudo-polynomial $O(nT)$ DP is polynomial in a unary input.'], ['Subset sum with numbers in binary', 1, '$O(nT)$ is exponential in the bit-length of $T$.'],
    ['The halting problem', 2, 'Undecidable — NP-hard (everything in NP reduces to it) but not in NP.'], ['Max cut', 1, 'NP-complete (unlike min cut).'], ['Min cut', 0, 'Max-flow/min-cut.'], ['Shortest paths with negative edges but no negative cycles', 0, 'Bellman–Ford.'],
    ['Edit distance', 0, 'Quadratic DP.'], ['Primality of a binary number', 0, 'AKS (2002) — in P.'], ['Set cover', 1, 'Generalizes vertex cover.'], ['Graph isomorphism of two trees', 0, 'Canonical forms in linear time.'],
  ];
  const NP_CH = ['In P (polynomial-time algorithm known)', 'NP-complete', 'NP-hard but not in NP (e.g. undecidable)'];
  G['np-class'] = { topic: 'np', title: 'P or NP-complete?', gen() { const [p, a, why] = pick(NPB); return { prompt: `Classify (decision version): **${p}**`, kind: 'mc', choices: NP_CH, answer: a, explain: `${NP_CH[a]}. ${why}` }; } };
  const KNOWN = ['3SAT', 'Independent Set', 'Vertex Cover', 'Hamiltonian Cycle', '3-Coloring', 'Subset Sum'];
  G['np-direction'] = {
    topic: 'np', title: 'Reduction direction',
    gen() {
      const K = pick(KNOWN), X = pick(['Problem X', 'MysteryCover', 'TreasureHunt', 'PartyPlanning']);
      const correct = `Give a polynomial-time reduction from ${K} to ${X}`;
      const { choices, answer } = mc(correct, [`Give a polynomial-time reduction from ${X} to ${K}`, `Show that ${X} is in NP`, `Give an exponential-time algorithm for ${X}`, `Show that ${K} reduces to ${X} in exponential time`]);
      return { prompt: `You know **${K}** is NP-hard. To prove **${X}** is NP-hard you must:`, kind: 'mc', choices, answer, explain: 'Reduce FROM the known hard problem TO the new one: an efficient algorithm for X would then solve the known hard problem. Reducing X to the known problem only shows X is *no harder*. (Showing X ∈ NP is needed for NP-*completeness*, not NP-hardness.)' };
    },
  };

  /* --------------------------------------------- strings / closure / D&C / backtracking */
  const finiteLang = () => { const s = new Set(); const k = ri(2, 3); while (s.size < k) s.add(randStr('01', 0, 2)); return [...s]; };
  const fmtL = (L) => '\\{' + L.map((x) => (x === '' ? '\\varepsilon' : x)).join(', ') + '\\}';
  G['lang-concat'] = {
    topic: 'strings', title: 'Size of a concatenation',
    gen() { const L1 = finiteLang(), L2 = finiteLang(); const prod = new Set(); L1.forEach((a) => L2.forEach((b) => prod.add(a + b))); return { prompt: `Let $L_1 = ${fmtL(L1)}$ and $L_2 = ${fmtL(L2)}$. How many strings are in $L_1 \\cdot L_2$?`, kind: 'number', answer: prod.size, explain: `$L_1L_2 = ${fmtL([...prod].sort((a, b) => a.length - b.length || (a < b ? -1 : 1)))}$ — ${prod.size} distinct strings. (It can be fewer than $|L_1|\\cdot|L_2| = ${L1.length * L2.length}$ when different pairs give the same concatenation.)` }; },
  };
  G['lang-star'] = {
    topic: 'strings', title: 'Membership in L*',
    gen() {
      let L; do { L = finiteLang().filter((x) => x); } while (L.length < 2);
      const w = Math.random() < 0.5 ? Array.from({ length: ri(2, 4) }, () => pick(L)).join('') : randStr('01', 3, 7);
      const ok = Array(w.length + 1).fill(false); ok[0] = true; for (let i = 1; i <= w.length; i++) ok[i] = L.some((x) => x.length <= i && ok[i - x.length] && w.slice(i - x.length, i) === x);
      return { prompt: `Let $L = ${fmtL(L)}$. Is **${w}** in $L^*$?`, kind: 'yesno', answer: ok[w.length], explain: ok[w.length] ? `Yes — it splits into pieces from $L$. (Check with the DP "can the prefix of length $i$ be split?")` : `No — no way to cut it into pieces that all lie in $L$ (the prefix-splitting DP fails at the end).` };
    },
  };
  const CLOS = [
    ['L^R \\text{ (reversal)}', true, 'Reverse every transition of an NFA and swap start/accept (add a new start with ε-moves).'],
    ['\\overline{L} \\text{ (complement)}', true, 'Complete DFA, swap accepting and non-accepting states.'],
    ['\\text{any subset of } L', false, 'Every language over Σ is a subset of the regular language Σ*.'],
    ['\\bigcup_{i\\ge 0} L_i \\text{ for infinitely many regular } L_i', false, '$\\bigcup_n \\{0^n1^n\\}$ — each piece is finite (regular), the union is not regular.'],
    ['\\mathrm{half}(L) = \\{x : xy \\in L \\text{ for some } |y| = |x|\\}', true, 'NFA simulates $M$ forward on $x$ while guessing $y$ backward from accept states, in lockstep.'],
    ['\\{x : xx \\in L\\}', true, 'Guess the state $q$ reached after the first copy; run two copies of the DFA from $s$ and from $q$ in parallel.'],
    ['\\{xx : x \\in L\\}', false, 'With $L = 0^*1$ you get $\\{0^n10^n1\\}$, which is not regular.'],
    ['\\mathrm{prefixes}(L)', true, 'Make every state that can reach an accepting state accepting.'],
    ['\\text{insert one symbol anywhere in a string of } L', true, 'NFA with two copies of the DFA: one before the insertion, one after.'],
    ['h(L) \\text{ for a homomorphism } h', true, 'Replace each symbol in a regex for $L$ by its image.'],
    ['L_1 \\cap L_2 \\text{ (both regular)}', true, 'Product construction.'],
    ['L_1 \\setminus L_2 \\text{ (both regular)}', true, 'Product construction with accept set $A_1 \\times \\overline{A_2}$.'],
    ['\\{w : w \\in L \\text{ and } |w| \\text{ is prime}\\}', false, 'With $L = 0^*$ you get $\\{0^p\\}$, which is not regular.'],
    ['\\text{shuffle}(L, 0^*) \\text{ (insert any number of 0s anywhere)}', true, 'Add a 0-self-loop to every state of an NFA for $L$.'],
    ['\\mathrm{cycle}(L) = \\{yx : xy \\in L\\}', true, 'Classic but tricky: guess the state at the cut and run the DFA around the cycle.'],
    ['\\{w \\in L : \\#_0(w) = \\#_1(w)\\}', false, 'With $L = 0^*1^*$ you get $\\{0^n1^n\\}$.'],
    ['\\{ww^R : w \\in L\\}', false, 'With $L = 0^*1$ you get $\\{0^n110^n\\}$, which is not regular.'],
    ['\\{w \\in L : w = w^R\\}', false, 'With $L = \\Sigma^*$ you get all palindromes.'],
    ['L \\cap \\{0^n1^n : n \\ge 0\\}', false, 'With $L = \\Sigma^*$ you get $\\{0^n1^n\\}$ itself.'],
  ];
  G['closure'] = {
    topic: 'closure', title: 'Closed or not?',
    gen() { const [op, ans, why] = pick(CLOS); return { prompt: `If $L$ is regular, must the following language also be regular?\n\n$$${op}$$`, kind: 'yesno', answer: ans, explain: `${ans ? '**Yes, always regular.**' : '**No, not necessarily.**'} ${why}` }; },
  };
  G['inversions'] = {
    topic: 'divide', title: 'Count inversions',
    gen() { const a = Array.from({ length: ri(6, 8) }, () => ri(1, 20)); let inv = 0; const pairs = []; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) { inv++; if (pairs.length < 12) pairs.push(`(${a[i]},${a[j]})`); } return { prompt: `How many **inversions** (pairs $i<j$ with $A[i] > A[j]$) does $A = [${a.join(', ')}]$ have?`, kind: 'number', answer: inv, explain: `${inv} inversion(s): ${pairs.join(' ')}${inv > 12 ? ' …' : ''}. Mergesort counts them in $O(n\\log n)$: while merging, each element taken from the right half forms an inversion with every element remaining in the left half.` }; },
  };
  G['partition'] = {
    topic: 'divide', title: 'Quickselect partition',
    gen() { const a = shuffle([...Array(ri(7, 9)).keys()].map((x) => (x + 1) * ri(2, 3))); const uniq = [...new Set(a)]; const piv = pick(uniq); const rank = a.filter((x) => x < piv).length + 1; const k = ri(1, a.length); const side = k < rank ? 'left' : k > rank ? 'right' : 'pivot'; const ch = ['Recurse into the elements smaller than the pivot', 'Return the pivot — it is the answer', 'Recurse into the elements larger than the pivot']; return { prompt: `Quickselect for the **${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'} smallest** element of $[${a.join(', ')}]$ partitions around pivot **${piv}**. What happens next?`, kind: 'mc', choices: ch, answer: side === 'left' ? 0 : side === 'pivot' ? 1 : 2, explain: `The pivot ${piv} has rank ${rank} (${rank - 1} smaller element${rank === 2 ? '' : 's'}). ${side === 'left' ? `$k=${k}<${rank}$: recurse left with the same $k$.` : side === 'right' ? `$k=${k}>${rank}$: recurse right looking for the ${k - rank}-th smallest there.` : 'Rank equals $k$.'}` }; },
  };
  G['count-subsets'] = {
    topic: 'backtracking', title: 'Count subsets with a sum',
    gen() { const X = Array.from({ length: ri(5, 7) }, () => ri(1, 9)); const T0 = ri(6, 15); let cnt = 0; const ex = []; const go = (i, s, used) => { if (s > T0) return; if (i === X.length) { if (s === T0) { cnt++; if (ex.length < 4) ex.push('{' + used.join(',') + '}'); } return; } go(i + 1, s, used); go(i + 1, s + X[i], [...used, X[i]]); }; go(0, 0, []); return { prompt: `How many subsets of the multiset $\\{${X.join(', ')}\\}$ (positions are distinct) sum to exactly **${T0}**?`, kind: 'number', answer: cnt, explain: `${cnt} subset(s)${ex.length ? ', e.g. ' + ex.join(' ') : ''}. Backtracking: for each element decide skip/take; prune when the sum exceeds ${T0}. (DP: $\\#SS(i,t) = \\#SS(i+1,t) + \\#SS(i+1,t-X[i])$.)` }; },
  };
  const DICT = ['a', 'an', 'and', 'the', 'then', 'he', 'here', 'her', 're', 'are', 'at', 'ate', 'tea', 'team', 'me', 'meat', 'eat', 'ear', 'hear', 'heart', 'art', 'earth', 'ma', 'ham', 'them', 'tear'];
  G['segment-count'] = {
    topic: 'backtracking', title: 'Count segmentations',
    gen() {
      for (;;) {
        const s = Array.from({ length: ri(2, 4) }, () => pick(DICT)).join('');
        if (s.length > 12) continue;
        const ways = Array(s.length + 1).fill(0); ways[s.length] = 1;
        for (let i = s.length - 1; i >= 0; i--) for (const w of DICT) if (s.startsWith(w, i)) ways[i] += ways[i + w.length];
        return { prompt: `Dictionary: ${DICT.map((w) => `<code>${w}</code>`).join(' ')}.\n\nIn how many different ways can **${s}** be split into dictionary words?`, kind: 'number', answer: ways[0], explain: `${ways[0]} way(s). $\\mathit{Ways}(i) = \\sum_{w \\text{ in dict},\\ s[i..] \\text{ starts with } w} \\mathit{Ways}(i+|w|)$, with $\\mathit{Ways}(n)=1$; suffix counts: ${ways.map((x, i) => `${i}:${x}`).join(', ')}.` };
      }
    },
  };

  const TOPIC_OF = {}; Object.entries(G).forEach(([k, g]) => { TOPIC_OF[k] = g.topic; });
  root.Drills = { GEN: G, TOPIC_OF };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Drills;
})(typeof window !== 'undefined' ? window : globalThis);
