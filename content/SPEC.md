# Content spec for the CS 374 study platform

Each topic lives in its own file `content/<topicId>.js` and registers itself:

```js
CS374.topic({
  id: 'dfa',                       // must match filename
  unit: 'models',                  // 'models' | 'algorithms'
  order: 3,                        // global ordering (see topic list)
  title: 'Deterministic Finite Automata',
  summary: 'One or two sentences shown on the dashboard card.',
  objectives: ['Design a DFA for a described language', '...'],   // 3-6 learning goals
  lesson: String.raw`...markdown...`,
  cheatsheet: String.raw`...markdown, concise key facts / templates...`,
  quiz: [ ...questions... ],
  flashcards: [ { front: String.raw`...`, back: String.raw`...` }, ... ],
  problems: [ ...problems... ],
});
```

## CRITICAL string rules (files are plain JS loaded via <script>)

* Write every string containing markdown / math / backslashes as a **`String.raw` template literal**: `String.raw\`...\``. This keeps `\frac`, `\{`, `\Sigma` intact.
* Inside these templates **never use a backtick** and **never write `${`**. For inline code use `<code>...</code>`. For code/pseudocode blocks use **tilde fences** `~~~` (never triple backticks). If TeX would need `${`, put a space: `$ {n \choose k}$`.
* Plain strings without backslashes can be normal `'...'` strings.
* The file must pass `node --check content/<id>.js`.

## Markdown subset supported by the renderer

* `#`, `##`, `###`, `####` headings (lesson top-level sections should be `##`).
* Paragraphs, blank-line separated. `**bold**`, `*italic*` (use `*`, not `_`), `[text](url)`, `<code>inline code</code>`, raw inline HTML (`<sub>`, `<sup>`, `<br>`, `<em>`…).
* Unordered lists `- item`, ordered lists `1. item`; nest by indenting 2+ spaces.
* Tables with pipes: `| a | b |` header row, then `|---|---|`, then rows.
* Blockquote callouts: lines starting with `> `. If the first line starts with `**Definition.**`, `**Theorem.**`, `**Key idea.**`, `**Example.**`, `**Warning.**`, `**Exam tip.**` or `**Lemma.**` it is styled as a colored callout box.
* `---` horizontal rule.
* Math via KaTeX: inline `$...$`, display `$$...$$` (display math may span lines). Write a literal dollar sign as `\$`.
* Tilde-fenced blocks `~~~lang`. Special `lang` values become **interactive widgets**:
  * `~~~automaton` — machine in the automaton format below; renders a state diagram plus a "test a string" box with step-by-step trace. Optional first line `alphabet: 01`.
  * `~~~regex` — a single regex (first line) and optional `alphabet: 01` line; renders a tester + list of shortest strings in the language.
  * `~~~cfg` — grammar in CFG format; renders membership tester + shortest generated strings. Optional `alphabet: ab` line first.
  * `~~~tm` — Turing machine in TM format; renders a step-through tape simulator.
  * `~~~graph` — graph in graph format (below); renders a drawing.
  * `~~~pseudo` (or anything else) — monospace code block.
  * `~~~reveal Title text` — a collapsed "click to reveal" box; the body is full markdown (math, lists, tables). Use it for **"try it yourself first" worked examples**: state the problem in normal text, then put the solution in a reveal block. `~~~solution` / `~~~answer` are synonyms.
  * `~~~steps Title text` — a step-by-step walkthrough. Separate steps with a line containing only `+++`. Each step is full markdown. The reader clicks "Next step" to reveal one step at a time (great for subset constructions, recursion-tree solutions, DP table derivations, reduction proofs, DFS traces).
  * **Nesting:** if a reveal/steps block contains another fenced block (e.g. an `~~~automaton` widget or `~~~pseudo`), the OUTER fence must use FOUR tildes: open with `~~~~reveal Title` and close with a line `~~~~`. Inner blocks use three.

## Answer / widget formats (students type these; `sample` answers must use them)

### Automaton (DFA / NFA)
```
# comment lines start with #
start: q0
accept: q2, q3
q0 0 -> q1          # transition: state, symbol(s), ->, target(s)
q0 1 -> q0
q1 0,1 -> q2        # several symbols share a transition
q2 eps -> q0        # epsilon move (also: ε). Only NFAs.
q3 1 -> q0, q2      # several targets (NFA only)
```
* State names: any token without spaces/commas that does not start with `#` (e.g. `q0`, `even`, `s_01`). Symbols are single characters (`#` may be used as an input symbol). Comments: whole lines starting with `#`, or `//` anywhere.
* If `start:` is omitted the first state mentioned is the start.
* DFA problems: missing transitions are allowed and mean "go to an implicit dead (rejecting) state".

### Regular expression (UIUC / Erickson notation)
* `+` (or `|`) is union, juxtaposition is concatenation, `*` is Kleene star, parentheses group.
* `ε` (or `eps`) is the empty string, `∅` the empty language, `Σ` means "any single symbol of the alphabet".
* Whitespace is ignored. Example: `(0+1)*00(0+1)*`, `Σ*1ΣΣ`, `(ε+1)(01)*(ε+0)`.

### Context-free grammar
```
S -> 0 S 1 | A
A -> 1 A | ε
```
* Nonterminals: a single uppercase letter, optionally followed by apostrophes or an underscore subscript (`S`, `S'`, `A_1`, `A_odd`), or `<name>`. Digits directly after a letter are terminals (`0S1` = `0 S 1`). Everything else (non-whitespace single character) is a terminal. `ε`/`eps`/empty alternative = empty string. `→` and `::=` also accepted. First rule's LHS is the start symbol. Whitespace inside RHS is optional (`0S1` == `0 S 1`).

### Turing machine
```
start: q0
accept: qa
reject: qr
blank: _
q0 0 -> q1 X R      # state read -> newState write move(L/R/S)
q0 _ -> qa _ R
```
* Missing transition = reject. Input is written starting at the head position; tape is two-way infinite.

### Graph (for `~~~graph` widgets)
```
directed            # or: undirected (default undirected)
a b 4               # edge a-b with optional weight
b c
c
```

## Quiz questions

```js
{ type: 'mc',    q: String.raw`...`, choices: [String.raw`...`, ...], answer: 2, explain: String.raw`...` }
{ type: 'multi', q: '... (select all that apply)', choices: [...], answer: [0, 3], explain: '...' }
{ type: 'tf',    q: '...', answer: true, explain: '...' }
{ type: 'short', q: '...', answer: ['n log n', 'nlogn'], explain: '...' }   // compared case/space-insensitively; use sparingly, only for very short canonical answers
```
`explain` is REQUIRED and should teach (why the right answer is right, why tempting wrong answers are wrong). All fields are markdown.

## Problems

Common fields: `id` (globally unique, prefix with topic id, e.g. `dfa-ends01`), `title`, `difficulty` (1 easy, 2 medium, 3 hard/exam-level), `prompt` (markdown), `hints` (array of 1-3 progressive hints, markdown), `solution` (markdown, full worked solution with explanation), optional `tags` (array of strings).

### Auto-graded automata / language problems
```js
{
  id: 'dfa-ends01', type: 'dfa',      // 'dfa' | 'nfa' | 'regex' | 'cfg' | 'tm'
  title: 'Strings ending in 01', difficulty: 1,
  alphabet: '01',                     // string of single-character symbols
  prompt: String.raw`Build a DFA for $\{w \in \{0,1\}^* : w \text{ ends in } 01\}$.`,
  accepts: s => s.endsWith('01'),     // REFERENCE membership predicate on JS strings. Must be exactly correct.
  sample: String.raw`start: a
accept: c
a 0 -> b
a 1 -> a
b 0 -> b
b 1 -> c
c 0 -> b
c 1 -> a`,                             // a correct answer in the student format (automaton / regex / cfg / tm text)
  maxLen: 10,                          // optional: test all strings up to this length (default picks ~|Σ|^L <= 20000)
  hints: [...], solution: String.raw`...`,
}
```
The grader compares the student's answer against `accepts` on every string up to `maxLen` (and, for regular types, exactly against `sample`) and reports the shortest counterexample. The validator checks that `sample` agrees with `accepts`, so both must be right. For `cfg` problems keep alphabets small (2–3 symbols) and `maxLen` around 8–10. For `tm` problems keep `maxLen` ≤ 6 and machines that halt quickly.

### Code problems (optional implementation practice in JavaScript)
```js
{
  id: 'dp-lis-code', type: 'code', title: 'Implement LIS length', difficulty: 2,
  prompt: String.raw`...`,
  fn: 'lisLength',                                  // function name the student defines
  starter: 'function lisLength(A) {\n  // return the length of the longest increasing subsequence\n}\n',
  reference: function (A) { /* correct implementation */ },
  tests: [ [[3,1,4,1,5,9,2,6]], [[]], [[5,4,3]] ],  // each entry is the ARGUMENT LIST (array of args)
  gen: () => [Array.from({length: 1 + Math.floor(Math.random()*12)}, () => Math.floor(Math.random()*20))],  // optional random args generator
  check: (out, expected, args) => out === expected, // optional custom checker (e.g. when several outputs are valid)
  hints: [...], solution: String.raw`...`,
}
```
Arguments/outputs must be JSON-serializable (no Map/Set). `reference`, `gen`, `check` must be self-contained (no outside variables).

### Written problems (proofs, recurrences, reductions, algorithm design)
```js
{
  id: 'dp-maxsub', type: 'written', title: '...', difficulty: 3,
  prompt: String.raw`...`,
  rubric: ['Clear English definition of the subproblem', 'Correct recurrence with base cases', 'Evaluation order / memo structure', 'Correct running time'],
  hints: [...], solution: String.raw`...`,
}
```
Students self-grade against the rubric and the model solution (and can copy a "grade my answer" prompt to an AI tutor).

## Style expectations (CS 374 at UIUC)

* Match the conventions of the UIUC course (Erickson's *Algorithms* / *Models of Computation* notes): regex `+` for union, fooling-set proofs for non-regularity, product construction, Thompson & subset (incremental) constructions, DP solutions given as (1) English spec of the recursive function, (2) recurrence with base cases, (3) memoization data structure, (4) evaluation order, (5) time/space; graph problems solved by *modeling* (describe vertices/edges/weights, then call a standard algorithm, state running time in terms of the original input); NP-hardness by reducing FROM a known NP-hard problem TO the new problem with both directions of the proof; undecidability by reduction from the halting problem / Rice's theorem.
* Write original explanations and problems in your own words (do not copy course text verbatim). Classic problems (LIS, edit distance, 3SAT→IndSet, etc.) are expected.
* Be technically precise — every claim and every solution must be correct. Students will learn from this.

## Expanding existing topics (IMPORTANT — preserves students' saved progress)

Progress is stored by problem `id` and by the **index** of quiz questions and flashcards. When expanding a topic:
* **Never delete, reorder, or insert in the middle of** `quiz` or `flashcards`. Only **append** new entries at the end. Fixing an error inside an existing entry in place is fine.
* **Never change an existing problem `id`.** New problems need new unique ids. You may reorder or improve existing problems' text.
* Lessons and cheatsheets can be rewritten/extended freely.
