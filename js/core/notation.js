/* Symbol guide shown on the Cheat sheet page: what each piece of notation used in
 * the cheat sheets means. Markdown (same renderer and String.raw rules as content files:
 * no backticks, no dollar-brace, and never a bare pipe inside a table cell; use \lvert ... \rvert).
 * `topics`: the topic ids whose cheat sheets use this group; that topic's cheat sheet tab shows it. */
window.NOTATION = [
  {
    id: 'logic', unit: 'all', topics: ['strings', 'regex', 'dfa', 'nfa', 'closure', 'nonregular', 'cfg', 'tm', 'undecidable', 'recursion', 'divide', 'backtracking', 'dp', 'dp2', 'graphs', 'dags', 'shortest', 'mst', 'np'], title: 'Logic, sets and general math',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $P \Rightarrow Q$ | "implies" | If $P$ holds then $Q$ holds. $\Leftarrow$ is the reverse direction. |
| $P \iff Q$, $P \Leftrightarrow Q$ | "if and only if" (iff) | Both directions hold. A reduction proof needs both. |
| $\wedge$, $\vee$ | "and", "or" | Logical and / or. |
| $\bigvee_{j}$ | "or over all $j$" | True if the expression is true for **some** $j$ (as in Splittable). |
| $\bar x$, $\neg x$ | "not $x$" | Negation. In SAT and 2SAT, $\bar x$ is the negated literal. |
| $x \in S$, $x \notin S$ | "in", "not in" | Membership. $S \ni x$ means the same as $x \in S$. |
| $A \subseteq B$, $A \subsetneq B$ | "subset", "proper subset" | Every element of $A$ is in $B$; proper means $A \ne B$. |
| $A \cup B$, $A \cap B$, $A \setminus B$ | union, intersection, difference | $A \setminus B$ = elements of $A$ not in $B$. $\bigcup$ is a union of many sets. |
| $\varnothing$, $\emptyset$ | "empty set" | The set with no elements. |
| $A \times B$ | "cross" | All pairs $(a, b)$. Also plain multiplication between numbers. |
| $\lvert S \rvert$ | "size of" | Number of elements of a set, or the length of a string. |
| $\lfloor x \rfloor$, $\lceil x \rceil$ | floor, ceiling | Round down / round up to an integer. |
| $a \bmod k$, $a \equiv b \pmod k$ | "mod", "congruent mod $k$" | Remainder after dividing by $k$; $a$ and $b$ leave the same remainder. |
| $\mathbb{Z}_m$ | "integers mod $m$" | The values $0, 1, \dots, m-1$, used as a counter in product graphs. |
| $\sum$, $\prod$ | sum, product | Add up / multiply over the range under the symbol. |
| $\binom{n}{k}$ | "$n$ choose $k$" | Number of ways to pick $k$ of $n$ items. |
| $\approx$, $\pm$ | "about", "plus or minus" | Approximately equal; either sign. |
| $\infty$, $-\infty$ | infinity | In a DP or shortest path: "impossible" (min problems) or "no lower limit". |
| $x \mapsto y$ | "maps to" | A rule that sends $x$ to $y$, e.g. $a \mapsto aa$. |
| $g \circ f$ | "$g$ after $f$" | Function composition: $(g \circ f)(x) = g(f(x))$. |
| $\mathbb{E}$ | "expected value" | Average over the algorithm's random choices. |
| $H_n$ | harmonic number | $1 + \frac12 + \dots + \frac1n \approx \ln n$. |
| $\gcd(a,b)$ | greatest common divisor | Largest integer dividing both. |
| $A[i..j]$ | "subarray $i$ to $j$" | Entries $A[i], A[i+1], \dots, A[j]$ (inclusive, contiguous). |
`,
  },
  {
    id: 'strings', unit: 'models', topics: ['strings', 'regex', 'dfa', 'nfa', 'closure', 'nonregular', 'cfg', 'tm', 'undecidable'], title: 'Strings and languages (topics 1–6)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $\Sigma$ | "sigma", the alphabet | The finite set of symbols, e.g. $\{0, 1\}$. |
| $\Sigma^*$ | "sigma star" | Every finite string over $\Sigma$, including the empty one. |
| $\varepsilon$ | "epsilon" | The empty string (length 0). Not the same as $\varnothing$. |
| $\lvert w \rvert$ | "length of $w$" | Number of symbols in $w$. |
| $\#_a(w)$ | "number of $a$'s in $w$" | How many times symbol $a$ occurs in $w$. |
| $xy$, $x \cdot y$ | concatenation | $x$ followed by $y$. $\bullet$ also means concatenation. |
| $w^R$ | "$w$ reversed" | $w$ written backwards. $L^R$ reverses every string of $L$. |
| $a^n$, $w^n$ | "$a$ to the $n$" | $n$ copies in a row, e.g. $0^31^2 = 00011$. |
| $A^n$ | "$A$ to the $n$" | Concatenations of exactly $n$ strings from $A$. $A^0 = \{\varepsilon\}$. |
| $A^*$, $A^+$ | Kleene star, plus | Zero or more / one or more strings from $A$ concatenated. |
| $\overline{L}$ | "complement of $L$" | $\Sigma^* \setminus L$: every string **not** in $L$. |
| $L(M)$, $L(G)$, $L(r)$ | "language of" | The set of strings the machine accepts, the grammar generates, or the regex matches. |
| $\equiv_L$ | "equivalent with respect to $L$" | $x \equiv_L y$ when no suffix $z$ separates them ($xz \in L \iff yz \in L$). Classes = states of the minimal DFA. |
`,
  },
  {
    id: 'regex', unit: 'models', topics: ['regex', 'nfa', 'closure'], title: 'Regular expressions (topic 2)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $r + s$ | "$r$ or $s$" | Union. UIUC notation uses $+$, not a pipe. |
| $rs$ | "$r$ then $s$" | Concatenation. |
| $r^*$ | "$r$ star" | Zero or more copies of $r$. |
| $\Sigma$ in a regex | "any symbol" | Matches exactly one symbol, e.g. $\Sigma^k$ = any string of length $k$. |
| $\varepsilon$, $\varnothing$ | empty string, empty language | $\varepsilon$ matches only the empty string; $\varnothing$ matches nothing. |
| $\alpha$, $\beta$, $\ell$ | regex labels | In state elimination: the regexes on edges into, out of, and looping at the removed state. |
`,
  },
  {
    id: 'automata', unit: 'models', topics: ['dfa', 'nfa', 'closure', 'nonregular'], title: 'Automata (topics 3–5)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $(Q, \Sigma, \delta, s, A)$ | a DFA / NFA | States, alphabet, transition function, start state, accepting states. Some sources write $q_0$ and $F$. |
| $\delta(q, a)$ | "delta of $q$, $a$" | The state reached from $q$ on symbol $a$. For an NFA it is a **set** of states. |
| $\delta^*(q, w)$ | "delta star" | The state (or set) reached from $q$ after reading the whole string $w$. |
| $p \xrightarrow{a} q$ | "$p$ goes to $q$ on $a$" | A transition labeled $a$. |
| $p \leadsto q$ | "$p$ reaches $q$" | Some walk leads from $p$ to $q$. |
| $\varepsilon$-move, $\varepsilon$-reach | epsilon move | An NFA move that reads nothing; $\varepsilon$-reach$(q)$ = states reachable by such moves. |
| $(p, q)$, $Q_1 \times Q_2$ | product state | Run two machines at once (product construction). |
| $\oplus$ | "xor" | Symmetric difference: in exactly one of the two languages. |
`,
  },
  {
    id: 'cfg', unit: 'models', topics: ['cfg'], title: 'Context-free grammars (topic 7)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $G = (V, \Sigma, R, S)$ | a grammar | Nonterminals, terminals, rules, start symbol. |
| $A \to \alpha$ | "$A$ can be replaced by $\alpha$" | A production rule. $\alpha$ is any string of terminals and nonterminals. |
| $A \to \alpha \mid \beta$ | "or" | Two alternative rules for $A$. |
| $\Rightarrow$, $\Rightarrow^*$ | "derives in one step", "in any number of steps" | Inside a grammar, $\Rightarrow$ is a derivation step, **not** "implies". |
`,
  },
  {
    id: 'tm', unit: 'models', topics: ['tm', 'undecidable'], title: 'Turing machines and decidability (topics 8–9)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $\Gamma$ | "gamma", tape alphabet | Every symbol that may appear on the tape; contains $\Sigma$ and the blank. |
| $\square$ | blank | The empty tape cell. The answer format writes it as <code>_</code>. |
| $\langle M \rangle$, $\langle M, w \rangle$ | "encoding of" | A string that describes machine $M$ (and input $w$), so programs can take machines as input. |
| HALT, $\overline{\mathrm{HALT}}$ | halting problem, its complement | $\{\langle M, w\rangle : M$ halts on $w\}$; the overline means "does not halt". |
| $A \to B$ (reduction) | "reduce $A$ to $B$" | A solver for $B$ would solve $A$, so $B$ is at least as hard as $A$. |
| $\mathcal{L}$ | "a property" | A set of languages, as in Rice's theorem: $\{\langle M \rangle : L(M) \in \mathcal{L}\}$. |
| $\star$ | a special symbol | A marker symbol chosen for a particular reduction. |
`,
  },
  {
    id: 'asymptotics', unit: 'algorithms', topics: ['recursion', 'divide', 'backtracking', 'dp', 'dp2'], title: 'Running times and recurrences (topics 10–12)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $O(g)$ | "big O" | Grows **at most** like $g$ (an upper bound, up to a constant factor). |
| $\Omega(g)$ | "big omega" | Grows **at least** like $g$ (a lower bound). |
| $\Theta(g)$ | "big theta" | Both: grows exactly like $g$ up to constants. Exams usually want $\Theta$. |
| $o(g)$, $\omega(g)$ | "little o", "little omega" | Strictly slower / strictly faster than $g$. |
| $f \ll g$ | "much smaller than" | $f = o(g)$: $f$ grows strictly more slowly. |
| $\lg n$ | "log base 2" | $\log_2 n$. $\log_b n$ is log base $b$; $\log^a n$ means $(\log n)^a$. |
| $T(n)$ | "time on size $n$" | The running time a recurrence describes. |
| $a$, $b$ in $aT(n/b) + f(n)$ | branching, shrink factor | $a$ subproblems, each of size $n/b$, plus $f(n)$ work to split and combine. |
| $n^{\log_b a}$ | the leaf count | Total work at the leaves of the recursion tree; compare it with $f(n)$. |
| $\varepsilon$ in $n^{\varepsilon}$ | "some small constant" | Any fixed positive number. Not the empty string here. |
| $\alpha_j$ | fractions | Subproblem sizes $\alpha_j n$ in an unbalanced recurrence such as $T(n/4) + T(3n/4) + n$. |
| $\phi$ | "phi", golden ratio | $(1+\sqrt5)/2 \approx 1.618$; naive Fibonacci recursion takes $\Theta(\phi^n)$. |
| $\delta$ in closest pair | the current best distance | Smallest distance found in the two halves; only the strip of width $2\delta$ matters. |
`,
  },
  {
    id: 'dp', unit: 'algorithms', topics: ['backtracking', 'dp', 'dp2'], title: 'Dynamic programming (topics 12–14)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $F(i)$, $L(i, j)$, $SS(i, t)$, $Opt(\dots)$ | the recursive function | Always say in English what it returns, e.g. "$L(i, j)$ = length of the LCS of $A[i..m]$ and $B[j..n]$". |
| $i$, $j$ | indices | Positions in the input: prefixes $A[1..i]$ or suffixes $A[i..n]$. Say which you use. |
| $t$, $W$, $T$ | capacity / target | A number budget, e.g. remaining weight. Tables of size $nW$ are **pseudo-polynomial**. |
| $\max$, $\min$ | best choice | Pick the best of the cases in the recurrence. |
| $\vee$ / $\bigvee$ | "any case works" | For yes/no DPs: true if some choice leads to true. |
| $\infty$, $-\infty$ | impossible | Base-case value for an impossible state in a min / max problem. |
| (number of subproblems) $\times$ (work per subproblem) | running time | How to state the time of a memoized recurrence. |
`,
  },
  {
    id: 'graphs', unit: 'algorithms', topics: ['graphs', 'dags', 'shortest', 'mst', 'np'], title: 'Graphs, shortest paths and MSTs (topics 15–18)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $G = (V, E)$ | a graph | Vertex set and edge set. In running times $V$ and $E$ mean $\lvert V \rvert$ and $\lvert E \rvert$. |
| $u \to v$ | "edge from $u$ to $v$" | A directed edge. $uv$ is an undirected edge. |
| $u \leadsto v$ | "$u$ reaches $v$" | There is a path from $u$ to $v$. $u \not\leadsto v$: there is none. |
| $\deg(v)$ | degree | Number of edges at $v$ (in-degree / out-degree for directed graphs). |
| $\ell(u \to v)$, $\ell(e)$, $w(e)$ | length, weight | The number on an edge. $\ell(P)$ is the total length of path $P$. |
| $dist(v)$ | tentative distance | The value an algorithm currently stores for $v$. |
| $\delta(v)$, $d(u, v)$ | true distance | The real shortest-path distance (used in proofs: $dist(v) \ge \delta(v)$). |
| $pred(v)$ | predecessor | The vertex before $v$ on the best path found; follow these back to recover the path. |
| $pre(v)$, $post(v)$ | DFS clock | When DFS first visits $v$ / finishes $v$. Sort by decreasing $post$ for a topological order. |
| $rev(G)$ | reversed graph | Every edge flipped; turns "distance **to** $t$" into "distance **from** $t$". |
| $\overline{G}$ | complement graph | Same vertices; edges exactly where $G$ has none. |
| $V \times \{0..k\}$ | product (layered) graph | One copy of each vertex per counter value, to track "used $k$ coupons" etc. |
| $\pi(v)$ | potential | Johnson's reweighting: $\ell'(u \to v) = \pi(u) + \ell(u \to v) - \pi(v) \ge 0$. |
| $D[u][v]$ | all-pairs table | Floyd–Warshall's distance from $u$ to $v$. |
| $\alpha(n)$ | inverse Ackermann | Union–find cost per operation; at most 4 for any realistic $n$. |
| SCC | strongly connected component | A maximal set of vertices that all reach each other. |
`,
  },
  {
    id: 'np', unit: 'algorithms', topics: ['np'], title: 'P and NP (topic 19)',
    md: String.raw`
| Symbol | Read it as | Meaning |
|---|---|---|
| $\mathsf{P}$ | "P" | Yes/no problems solvable in polynomial time. |
| $\mathsf{NP}$ | "NP" | Yes-answers have a short certificate checkable in polynomial time. **Not** "not polynomial". |
| co-NP | "co-NP" | No-answers have such certificates. |
| $A \le_P B$ | "$A$ reduces to $B$" | Polynomial-time reduction: a fast solver for $B$ gives one for $A$. To show $B$ is NP-hard, reduce **from** a known NP-hard $A$. |
| $x$, $\bar x$ | literal, negated literal | A variable or its negation in a SAT formula. |
| $(a \vee b \vee c)$ | clause | An "or" of literals; a CNF formula is an "and" ($\wedge$) of clauses. |
`,
  },
];
