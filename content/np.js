CS374.topic({
  id: 'np',
  unit: 'algorithms',
  order: 19,
  title: 'P, NP & NP-Hardness',
  summary: 'Decision problems, P, NP (certificates and verifiers), co-NP, polynomial-time reductions, Cook–Levin, the canonical chain of NP-hardness reductions (CircuitSAT → SAT → 3SAT → Independent Set → Clique / Vertex Cover, 3-Coloring, Hamiltonian cycle, Subset Sum), and how to write a correct NP-hardness proof.',
  objectives: [
    'Define P, NP (via polynomial-time verifiers and certificates), co-NP, NP-hard and NP-complete',
    'Explain what a polynomial-time (Karp) reduction proves and in which direction it must go',
    'Reproduce the classic reductions: CircuitSAT → SAT → 3SAT → IndSet, IndSet ↔ Clique ↔ VertexCover, HamCycle → HamPath',
    'Write a complete NP-hardness proof: construction, polynomial running time, and both directions of correctness',
    'Recognize common mistakes (wrong direction, answer-dependent constructions, exponential-size output)'
  ],

  lesson: String.raw`
## Decision problems and P

A **decision problem** asks a yes/no question about its input; equivalently it is a language $L \subseteq \Sigma^*$ (the set of yes-instances). The **size** of an input is its length in bits: a graph with $V$ vertices and $E$ edges has size polynomial in $V + E$, while an integer $N$ has size about $\log_2 N$.

> **Definition.** $\mathsf{P}$ is the class of decision problems solvable by an algorithm running in time $O(n^c)$ for some constant $c$, where $n$ is the input size.

Optimization problems ("find the largest independent set") have decision versions ("is there an independent set of size at least $k$?"). For everything in this topic the two are polynomially equivalent: a fast algorithm for one gives a fast algorithm for the other (binary search on $k$, plus self-reduction to recover a solution).

> **Warning.** Pseudo-polynomial is not polynomial. Subset Sum has an $O(nT)$ dynamic program, but the target $T$ is written with $\log T$ bits, so $O(nT)$ is exponential in the input size. Subset Sum is NP-hard; the DP does not contradict that.

## NP: problems with short, checkable proofs

> **Definition.** A decision problem $L$ is in $\mathsf{NP}$ if there is a polynomial-time algorithm $\mathrm{Verify}(x, c)$ (a **verifier**) and a polynomial $p$ such that: $x \in L$ **iff** there exists a **certificate** $c$ with $|c| \le p(|x|)$ for which $\mathrm{Verify}(x, c)$ accepts.

In words: every yes-instance has a short proof that can be checked quickly, and no-instances have no proof that fools the checker. (NP stands for *nondeterministic polynomial time*, **not** "not polynomial".)

| Problem | Yes-instance asks for | Certificate | Verification |
|---|---|---|---|
| SAT | satisfying assignment of a CNF formula | truth assignment | evaluate every clause |
| Independent Set $(G,k)$ | $k$ pairwise non-adjacent vertices | the set $S$ | check size and all pairs |
| 3-Coloring | proper coloring with 3 colors | the coloring | check every edge |
| Hamiltonian Cycle | cycle through every vertex once | vertex ordering | permutation + consecutive edges |
| Subset Sum $(A, T)$ | subset summing to $T$ | the subset | add it up |

Every problem in P is in NP (the verifier ignores the certificate and solves the problem), so $\mathsf{P} \subseteq \mathsf{NP}$. Whether $\mathsf{P} = \mathsf{NP}$ is the famous open question; almost everyone believes they differ.

**co-NP** is the class of complements of NP problems: problems whose **no**-instances have short checkable proofs. Examples: UNSAT (is $\varphi$ unsatisfiable?) and TAUTOLOGY (is $\varphi$ true under every assignment?). A short certificate for "satisfiable" is obvious; nobody knows a short certificate for "unsatisfiable". $\mathsf{P} \subseteq \mathsf{NP} \cap \mathsf{co\text{-}NP}$, and it is unknown whether $\mathsf{NP} = \mathsf{co\text{-}NP}$.

## Reductions

> **Definition.** A **polynomial-time (Karp) reduction** from problem $A$ to problem $B$, written $A \le_P B$, is a polynomial-time algorithm $f$ that maps every instance $x$ of $A$ to an instance $f(x)$ of $B$ such that
> $$x \text{ is a yes-instance of } A \iff f(x) \text{ is a yes-instance of } B.$$

What a reduction proves: **$B$ is at least as hard as $A$.**
- If $B \in \mathsf{P}$, then $A \in \mathsf{P}$ (compute $f(x)$, which has polynomial size, then run $B$'s algorithm).
- Contrapositive: if $A$ is hard, then $B$ is hard.

Reductions compose: if $A \le_P B$ and $B \le_P C$ then $A \le_P C$ (a polynomial of a polynomial is a polynomial).

### Why reductions compose (and why output size matters)

Let $f$ reduce $A$ to $B$ in time $p(n)$ and $g$ reduce $B$ to $C$ in time $q(n)$, where $p$ and $q$ are non-decreasing polynomials. On an input $x$ of length $n$:

- computing $f(x)$ takes at most $p(n)$ steps, and an algorithm cannot write more symbols than it takes steps, so $|f(x)| \le p(n)$;
- computing $g(f(x))$ takes at most $q(|f(x)|) \le q(p(n))$ steps.

The total, $p(n) + q(p(n))$, is a polynomial in $n$. Correctness chains: $x \in A \iff f(x) \in B \iff g(f(x)) \in C$. ∎

Exactly the same calculation shows that if $A \le_P B$ and $B$ is solvable in time $r(n)$, then $A$ is solvable in time $p(n) + r(p(n))$. The crucial step is the size bound $|f(x)| \le p(n)$. A "reduction" that outputs an exponentially large instance gives no useful bound at all, which is why exponential-size constructions are fatal.

### What each fact lets you conclude

| You know | You may conclude | You may **not** conclude |
|---|---|---|
| $A \le_P B$ and $B \in \mathsf P$ | $A \in \mathsf P$ | anything about how hard $B$ is |
| $A \le_P B$ and $A$ is NP-hard | $B$ is NP-hard | $B \in \mathsf{NP}$ |
| $A \le_P B$ and $B \in \mathsf{NP}$ | $A \in \mathsf{NP}$ | $A$ is hard |
| $A \le_P B$ and $A \in \mathsf P$ | nothing new | $B \in \mathsf P$ |
| $X$ is NP-hard | a polynomial algorithm for $X$ would imply $\mathsf P = \mathsf{NP}$ | "$X$ has no polynomial algorithm" (that needs $\mathsf P \ne \mathsf{NP}$) |
| $X$ is NP-complete and $Y \in \mathsf{NP}$ | $Y \le_P X$ | $X \le_P Y$ |

> **Definition.** A problem $X$ is **NP-hard** if every problem in NP reduces to it; equivalently (for our purposes), if a polynomial-time algorithm for $X$ would give polynomial-time algorithms for all of NP, i.e., would imply $\mathsf{P} = \mathsf{NP}$. $X$ is **NP-complete** if it is NP-hard **and** in NP.

NP-hard problems need not be in NP (e.g., the halting problem is NP-hard). "NP-complete" problems are the hardest problems *in* NP.

> **Theorem.** (Cook–Levin.) Circuit satisfiability (given a boolean circuit with AND, OR, NOT gates, is there an input making the output true?) is NP-complete. Consequently SAT is NP-complete too.

*Idea:* for any NP problem with verifier $\mathrm{Verify}$, the computation of $\mathrm{Verify}$ on input $x$ (of fixed length) can be unrolled into a polynomial-size circuit whose inputs are the certificate bits; the circuit is satisfiable iff some certificate makes the verifier accept iff $x$ is a yes-instance. After Cook–Levin, we never reduce from "an arbitrary NP problem" again: we prove new problems NP-hard by reducing **from** a problem already known to be NP-hard.

### Cook–Levin in a little more detail

Fix a problem $L \in \mathsf{NP}$ whose verifier runs in time $t(n) = O(n^c)$ on inputs $x$ of length $n$. A computation that runs for $t$ steps touches at most $t$ memory cells, so the whole run can be written as a $t \times t$ table (a *tableau*): row $i$ records the memory contents and the machine's state after step $i$. The key locality fact is that each cell of row $i + 1$ is determined by a **constant** number of cells of row $i$ (the cell itself, its neighbors, and where the head is). So "row $i+1$ follows correctly from row $i$" is a conjunction of constant-size boolean conditions, one per cell: $O(t^2)$ gates in total.

Now build a circuit: hardwire the bits of $x$ into the first row, make the certificate bits the circuit's free inputs, include the local consistency checks for every pair of consecutive rows, and let the output gate test that the last row is in the accepting state. The circuit has size polynomial in $n$, its regular structure lets us write it down in polynomial time, and it is satisfiable iff some certificate makes the verifier accept iff $x \in L$.

Two points to notice. First, the reduction never *runs* the verifier; it only *describes* the verifier's computation. Second, the polynomial running time of the verifier is exactly what keeps the circuit polynomially large. That is where the definition of NP is used.

### What would P = NP mean?

If even one NP-hard problem had a polynomial-time algorithm, composing it with the reductions would solve every NP problem in polynomial time. Every puzzle whose solutions are easy to *check* (schedules, colorings, tours, satisfying assignments, short mathematical proofs, since proof checking is in NP) would also be easy to *solve*, and by self-reduction we could even *find* the solutions, not just decide that they exist. Because P is closed under complement, $\mathsf P = \mathsf{NP}$ would also give $\mathsf{NP} = \mathsf{co\text{-}NP}$. Conversely, if $\mathsf P \ne \mathsf{NP}$, then no NP-hard problem is in P. Most researchers believe $\mathsf P \ne \mathsf{NP}$, but nobody has proved it.

## How to write an NP-hardness proof

To prove that a new problem $X$ is NP-hard:

1. **Pick a known NP-hard problem $Y$** (3SAT, Independent Set, Vertex Cover, Clique, 3-Coloring, Hamiltonian Cycle/Path, Subset Sum, ...). Choose one that "looks like" $X$.
2. **Describe the reduction:** an algorithm that takes an *arbitrary* instance $y$ of $Y$ and builds an instance $x = f(y)$ of $X$. The algorithm must not know whether $y$ is a yes-instance.
3. **Prove "$\Rightarrow$":** if $y$ is a yes-instance of $Y$, then $x$ is a yes-instance of $X$ (usually: transform the solution of $y$ into a solution of $x$).
4. **Prove "$\Leftarrow$":** if $x$ is a yes-instance of $X$, then $y$ is a yes-instance of $Y$ (transform a solution of $x$ back into a solution of $y$). Equivalently: if $y$ is a no-instance, so is $x$.
5. **Argue the construction takes polynomial time** (in particular, $x$ has polynomial size).

To prove NP-*completeness*, also show $X \in \mathsf{NP}$ by describing a certificate and verifier.

> **Warning.** Direction! To show $X$ is hard, reduce **FROM** the known hard problem **TO** $X$: "if I could solve $X$, I could solve 3SAT". A reduction from $X$ to 3SAT shows only that $X$ is *no harder* than 3SAT (e.g., that $X \in \mathsf{NP}$), which says nothing about hardness.

> **Exam tip.** Graders look for exactly these pieces: the instance you construct (precise, and built from an arbitrary input), both directions of the "iff" stated and proved separately, and a sentence about polynomial time. A proof that only shows one direction gets roughly half credit.

A fill-in-the-blanks skeleton that works for almost every exam problem:

~~~pseudo
Claim: X is NP-hard.
Proof: We reduce from Y, which is NP-hard.
  Construction. Given an arbitrary instance y of Y, build x as follows: ...
     (sizes: x has O(...) vertices / numbers / clauses; built in O(...) time)
  (=>) Suppose y is a yes-instance, witnessed by S. Then S' = ... is a
       solution of x, because ...
  (<=) Suppose x is a yes-instance, witnessed by an ARBITRARY solution S'.
       [Normalize S' if needed, without making it worse.]
       Then S = ... is a solution of y, because ...
  Hence y in Y <=> x in X, and the construction is polynomial,
  so Y <=_P X and X is NP-hard.
~~~

## Showing membership in NP

To show $X \in \mathsf{NP}$, give three things:

1. **The certificate:** what it is, and why its length is polynomial in the input length (count bits, not values).
2. **The verifier:** what it checks, and why it runs in polynomial time. It must *check*, never *search*.
3. **Correctness:** every yes-instance has a certificate that passes, and for a no-instance every possible string fails.

| Problem | Certificate (size) | Verification |
|---|---|---|
| Vertex Cover $(G, k)$ | the cover: $O(V \log V)$ bits | size at most $k$; every edge has an endpoint in it: $O(V + E)$ |
| Composite $N$ | a divisor $d$ with $1 < d < N$: $O(\log N)$ bits | one long division, polynomial in $\log N$ |
| Subset Sum $(A, T)$ | which items to take: $n$ bits | add at most $n$ numbers of $b$ bits each: $O(nb)$ |
| Hamiltonian Path | a vertex ordering: $O(V \log V)$ bits | it is a permutation and consecutive vertices are adjacent |
| 3-Coloring | a color per vertex: $2V$ bits | every edge has differently colored endpoints |

> **Warning.** For "no-type" questions, such as "$\varphi$ is unsatisfiable", "$G$ has **no** Hamiltonian cycle", or "the **minimum** vertex cover has size **exactly** $k$", the natural certificate would have to rule out exponentially many candidates. Those problems are in co-NP (or are combinations of NP and co-NP conditions) and are not known to be in NP. Also, "the verifier tries all possible solutions" is not a polynomial-time verifier.

## The canonical reductions

### CircuitSAT → SAT

Given a circuit, introduce one variable $z_g$ for the output of each gate $g$ (plus variables for the circuit inputs) and write clauses saying "each gate computes its function":

| Gate | Clauses |
|---|---|
| $z = x \wedge y$ | $(z \vee \bar x \vee \bar y) \wedge (\bar z \vee x) \wedge (\bar z \vee y)$ |
| $z = x \vee y$ | $(\bar z \vee x \vee y) \wedge (z \vee \bar x) \wedge (z \vee \bar y)$ |
| $z = \bar x$ | $(z \vee x) \wedge (\bar z \vee \bar x)$ |

Add the single clause $(z_{out})$. A satisfying assignment of the formula restricted to the input variables satisfies the circuit, and a satisfying circuit input extends (by computing every gate) to a satisfying assignment. The formula has $O(\text{size of circuit})$ clauses. (Naively expanding the circuit into one big formula could be exponentially large; introducing gate variables avoids that.)

### SAT → 3SAT

Every clause must have exactly three literals.
- A clause with more than three literals is split with new variables: $(\ell_1 \vee \ell_2 \vee \ell_3 \vee \dots \vee \ell_k)$ becomes
$$(\ell_1 \vee \ell_2 \vee y_1) \wedge (\bar y_1 \vee \ell_3 \vee y_2) \wedge \dots \wedge (\bar y_{k-3} \vee \ell_{k-1} \vee \ell_k).$$
If some $\ell_i$ is true, set the $y$'s before it true and after it false to satisfy every piece; if all $\ell_i$ are false, the chain forces $y_1, y_2, \dots$ true and the last clause fails.
- Short clauses can be padded with fresh variables: $(a \vee b)$ becomes $(a \vee b \vee y) \wedge (a \vee b \vee \bar y)$, and a one-literal clause becomes four clauses using two fresh variables.

The output has size linear in the input, so 3SAT is NP-hard.

### 3SAT → Independent Set

**Independent Set:** given $G$ and $k$, is there a set of $k$ vertices with no edges between them?

Given a 3CNF formula $\varphi$ with $m$ clauses, build $G$:
- For each clause, three vertices, one per literal, joined in a **triangle** ("clause gadget").
- For every pair of vertices labeled with complementary literals $x$ and $\bar x$ (in different clauses), add a **conflict edge**.
- Set $k = m$.

*(⇒)* Given a satisfying assignment, choose one true literal in each clause and take the corresponding vertices: $m$ vertices, one per triangle, and no conflict edge between them because a true literal and its negation cannot both be chosen.

*(⇐)* An independent set of size $m$ contains at most one vertex per triangle, hence exactly one. Its literals contain no complementary pair (conflict edges), so we can set each chosen literal true (and other variables arbitrarily). Every clause contains a chosen, true literal, so $\varphi$ is satisfied.

*Time:* $3m$ vertices and $O(m^2)$ edges. ∎

**Example.** $\varphi = (a \vee b \vee \bar c) \wedge (\bar a \vee c \vee d) \wedge (\bar b \vee \bar c \vee \bar d)$; vertex "na2" is the literal $\bar a$ in clause 2. Triangles plus conflict edges:

~~~graph
undirected
a1 b1
b1 nc1
nc1 a1
na2 c2
c2 d2
d2 na2
nb3 nc3
nc3 nd3
nd3 nb3
a1 na2
b1 nb3
nc1 c2
c2 nc3
d2 nd3
~~~

The assignment $a = T, b = F, c = T, d = F$ satisfies $\varphi$; choosing $a$ in clause 1, $c$ in clause 2 and $\bar b$ in clause 3 gives the independent set $\{a1, c2, nb3\}$ of size 3.

~~~steps The complete 3SAT → Independent Set proof, on this example
**What we must produce.** From an *arbitrary* 3CNF formula $\varphi$ with $m$ clauses, build a graph $G$ and a number $k$ in polynomial time, without knowing whether $\varphi$ is satisfiable, such that $\varphi$ is satisfiable $\iff$ $G$ has an independent set of size $k$. Our example has $m = 3$:
$$\varphi = (a \vee b \vee \bar c) \wedge (\bar a \vee c \vee d) \wedge (\bar b \vee \bar c \vee \bar d).$$
+++
**Construction.** One vertex per literal occurrence: $a1, b1, nc1$ / $na2, c2, d2$ / $nb3, nc3, nd3$. Triangle edges inside each clause. Conflict edges between every pair of complementary occurrences: $a1 - na2$, $b1 - nb3$, $nc1 - c2$, $c2 - nc3$, $d2 - nd3$. Set $k = m = 3$.

Each piece has a job: **triangles** allow at most one vertex per clause, **$k = m$** demands at least one per clause, and **conflict edges** forbid choosing both $x$ and $\bar x$.
+++
**(⇒) Satisfiable implies a big independent set.** Take a satisfying assignment, e.g. $a = T, b = F, c = T, d = F$. In each clause pick one true literal: $a$ in clause 1, $c$ in clause 2, $\bar b$ in clause 3. Let $S = \{a1, c2, nb3\}$.

- One vertex per triangle, so no triangle edge lies inside $S$.
- A conflict edge joins $x$ and $\bar x$; both cannot be true, so both cannot have been picked.

So $S$ is independent with $|S| = m$. Note that the argument works for **any** satisfying assignment, not just this one.
+++
**(⇐) A big independent set implies satisfiable.** Now start from an **arbitrary** independent set $S$ of size $m$, not the one we built in (⇒). Say $S = \{b1, d2, nc3\}$.

- A triangle can contain at most one vertex of $S$, and there are $m$ triangles and $|S| = m$, so $S$ has **exactly one** vertex in each clause.
- $S$ has no conflict edge, so it never contains both a literal and its negation. Setting every literal in $S$ to true is therefore a consistent partial assignment: $b = T$, $d = T$, $c = F$. Variables not mentioned (here $a$) get any value.
- Each clause contains a vertex of $S$, whose literal is now true, so every clause is satisfied. Check: clause 1 by $b$, clause 2 by $d$, clause 3 by $\bar c$.
+++
**Running time and conclusion.** $G$ has $3m$ vertices, $3m$ triangle edges and at most $\binom{3m}{2}$ conflict edges, and it is built by scanning pairs of occurrences: $O(m^2)$ time. So $3\mathrm{SAT} \le_P \mathrm{IndependentSet}$, and Independent Set is NP-hard.

*Sanity check of the design:* drop the conflict edges and $\{b1, na2, nb3\}$ becomes a "solution" choosing both $b$ and $\bar b$; drop the triangles and three occurrences from one clause could be chosen; use $k$ smaller than $m$ and some clause could be left uncovered. Every ingredient is needed for (⇐).
~~~

### Independent Set ↔ Clique ↔ Vertex Cover

For a graph $G = (V, E)$ with $n$ vertices and any $S \subseteq V$:
- $S$ is an **independent set** in $G$ $\iff$ $S$ is a **clique** in the complement $\overline G$ (same vertices, exactly the non-edges of $G$).
- $S$ is an independent set in $G$ $\iff$ $V \setminus S$ is a **vertex cover** of $G$ (every edge has an endpoint in $V \setminus S$, because no edge has both endpoints in $S$).

So $(G, k) \mapsto (\overline G, k)$ reduces Independent Set to Clique, and $(G, k) \mapsto (G, n - k)$ reduces Independent Set to Vertex Cover. Both are NP-hard. (Each reduction also works in reverse, so all three are polynomially equivalent.)

### 3SAT → 3-Coloring (sketch)

Build a **palette triangle** with vertices $T$, $F$, $X$; in any 3-coloring they get three different colors, which we name true, false and other.
- **Variables:** for each variable $x$, vertices $x$ and $\bar x$ forming a triangle with $X$. So one of $x, \bar x$ is colored true and the other false.
- **Clauses:** an *OR gadget* with inputs $p, q$ consists of a triangle $p', q', o$ plus edges $p p'$ and $q q'$. One checks: if $p$ and $q$ are both colored false, then $p', q'$ must use the colors true and other, forcing $o$ to be false; if at least one input is true, the gadget can be colored with $o$ true. For a clause $(a \vee b \vee c)$, chain two OR gadgets, $o_1 = OR(a, b)$ and $o_2 = OR(o_1, c)$, and connect $o_2$ to both $F$ and $X$, which forces $o_2$ to be true.

A satisfying assignment gives a 3-coloring (color each gadget so its output is true); conversely, in any 3-coloring, if all three literals of some clause were false, $o_1$ and then $o_2$ would be forced false, contradicting the edge $o_2 F$. Size is linear in the formula. So 3-Coloring is NP-hard, and so is $k$-Coloring for every $k \ge 3$ (by adding $k - 3$ new vertices adjacent to everything). In contrast, 2-Coloring is in P (bipartiteness).

~~~steps Checking the 3-Coloring gadgets by hand
**Palette.** Vertices $T$, $F$, $X$ form a triangle, so any proper 3-coloring gives them three different colors. Since renaming colors does not affect properness, we may *call* the colors true, false, and other according to which of $T, F, X$ receives them.
+++
**Variable gadget.** For each variable $x$, the triangle $x, \bar x, X$. Both $x$ and $\bar x$ avoid the color of $X$, and they differ from each other, so one is colored true and the other false. A coloring of the literal vertices is therefore exactly a truth assignment.
+++
**OR gadget, both inputs false.** Inputs $p, q$ (colored true or false), new vertices $p', q', o$ forming a triangle, plus edges $pp'$ and $qq'$. If $p$ and $q$ are both false, then $p'$ and $q'$ must avoid false and must differ, so $\{p', q'\} = \{\text{true}, \text{other}\}$, and $o$, adjacent to both, is forced to be **false**.
+++
**OR gadget, at least one input true.** If $p$ is true and $q$ is false: color $p'$ false, $q'$ other, $o$ true. Proper: $p' \ne p$, $q' \ne q$, and the triangle uses three colors. If both are true: $p', q'$ must be false and other in some order, forcing $o$ **true**. If $p$ is false and $q$ is true, the first case mirrored. So $o$ *can* be true exactly when at least one input is true.

| $p$ | $q$ | possible colors of $o$ |
|---|---|---|
| F | F | false only |
| T | F | any (choose true) |
| F | T | any (choose true) |
| T | T | true only |
+++
**Clause gadget.** For $(a \vee b \vee c)$: $o_1 = \mathrm{OR}(a, b)$, $o_2 = \mathrm{OR}(o_1, c)$, and edges $o_2 F$ and $o_2 X$, which force $o_2$ to be true.

- *All three literals false:* $o_1$ is forced false (both inputs false), so $o_2$'s inputs $o_1$ and $c$ are both false, forcing $o_2$ false, which contradicts the edge $o_2 F$. **No coloring.**
- *Some literal true:* if $a$ or $b$ is true, color the first gadget with $o_1$ true; then the second gadget has a true input, so $o_2$ can be true. If $a, b$ are false then $c$ is true; $o_1$ is false but $o_2$'s input $c$ is true, so $o_2$ can be true. **A coloring exists.**
+++
**Assemble.** The full graph: palette, a variable triangle for each variable, a clause gadget per clause (sharing the literal vertices). $3 + 2n + 6m$ vertices and $O(n + m)$ edges.

(⇒) From a satisfying assignment, color literals by their truth values and each clause gadget as in the previous step; gadgets of different clauses share only literal and palette vertices, so the colorings combine. (⇐) From any 3-coloring, read the assignment off the literal colors (variable gadgets make it consistent); by the previous step every clause has a true literal. ∎
~~~

### Hamiltonian cycle and path

**Hamiltonian Cycle** (directed or undirected): is there a cycle visiting every vertex exactly once? NP-hard by a reduction from 3SAT (sketch: each variable becomes a long two-way chain of vertices that the cycle traverses left-to-right for "true" or right-to-left for "false"; each clause becomes a vertex reachable by a detour from the chain of each of its literals, but only in that literal's "true" direction). Directed HamCycle then reduces to undirected HamCycle by replacing each vertex $v$ by a path $v_{in} - v_{mid} - v_{out}$.

**HamCycle → HamPath (undirected).** Given $G$ with $n \ge 3$ vertices, pick any vertex $v$. Build $G'$ by adding a copy $v'$ adjacent to exactly the neighbors of $v$, a new vertex $s$ adjacent only to $v$, and a new vertex $t$ adjacent only to $v'$.
- *(⇒)* A Hamiltonian cycle $v, u_1, \dots, u_{n-1}, v$ gives the Hamiltonian path $s, v, u_1, \dots, u_{n-1}, v', t$ (since $u_{n-1}$ is a neighbor of $v$, it is a neighbor of $v'$).
- *(⇐)* $s$ and $t$ have degree 1, so any Hamiltonian path in $G'$ has them as endpoints: it looks like $s, v, u_1, \dots, u_{n-1}, v', t$, where $u_1, \dots, u_{n-1}$ are the other vertices of $G$. Since $u_{n-1}$ is adjacent to $v'$, it is adjacent to $v$, so $v, u_1, \dots, u_{n-1}, v$ is a Hamiltonian cycle in $G$.

Corollaries: Longest Path (is there a simple path with at least $k$ edges?) and the Traveling Salesman decision problem are NP-hard.

### Subset Sum (sketch)

From 3SAT with variables $x_1..x_n$ and clauses $C_1..C_m$, build decimal numbers with $n + m$ digits. For each variable $x_i$ two numbers, for $x_i$ and $\bar x_i$: a 1 in digit $i$, and a 1 in the digit of each clause containing that literal. For each clause $C_j$, two slack numbers with digit $j$ equal to 1 and 2 respectively. Target: 1 in every variable digit and 4 in every clause digit. No column sums past 6, so there are no carries. Variable digits force choosing exactly one of $x_i, \bar x_i$; a clause digit can reach 4 (using slack worth at most 3) iff at least one of its literals was chosen. The numbers have $O(n + m)$ digits, polynomial size, even though their *values* are exponential, which is exactly why the $O(nT)$ DP is not polynomial.

## A library of NP-hard problems

| Problem | Typical source of reduction |
|---|---|
| CircuitSAT, SAT, 3SAT | Cook–Levin, gate clauses, clause splitting |
| SAT with each variable used at most 3 times | SAT: copy variables, chain the copies with implications |
| NAE-3SAT, 1-in-3 SAT | 3SAT with clause gadgets (global "false" variable for NAE) |
| Independent Set, Clique, Vertex Cover | 3SAT; complements of each other |
| IS in max-degree-3 graphs, VC in triangle-free graphs | IS / VC by local replacement (vertex chains, edge subdivision) |
| Half-Clique, Half-IS | Clique / IS by padding |
| Set Cover, Hitting Set | Vertex Cover |
| Dominating Set, Feedback Vertex Set | Vertex Cover (edge gadgets) |
| Steiner Tree | Set Cover (root, set-vertices, element-terminals) |
| 3-Coloring, $k$-Coloring ($k \ge 3$) | 3SAT; add universal vertices |
| Hamiltonian Cycle / Path (directed, undirected) | 3SAT; vertex splitting; endpoint gadgets |
| Hamiltonian path with fixed endpoints, cycle through half the vertices | Hamiltonian Path / Cycle with extra vertices |
| Longest Path, TSP (decision) | Hamiltonian Path / Cycle |
| Subset Sum | 3SAT (digits per variable and clause) |
| Partition, Knapsack, 2-machine scheduling, Bin Packing | Subset Sum / Partition |
| Max Cut | NAE-3SAT (variable edges plus clause triangles) |
| 3D Matching, Exact Cover | (standard; know they exist) |

Close relatives in **P**: 2SAT, 2-Coloring, Euler tour, shortest path, minimum spanning tree, longest path in a DAG, matching. Small changes to a problem can move it across the boundary, so read definitions carefully.

## Common mistakes

- **Wrong direction** (reducing your problem $X$ to a known hard problem).
- **Answer-dependent construction:** "If $\varphi$ is satisfiable, output a fixed yes-instance, else a fixed no-instance." Deciding which case holds is the hard problem itself; the reduction must run in polynomial time *without* knowing the answer.
- **Exponential output:** writing numbers in unary, or enumerating all assignments / subsets in the construction.
- **Only one direction proved**, or proving "$\Leftarrow$" only for specially structured solutions without showing every solution has (or can be converted to) that structure.
- **Reducing from a specific instance** ("consider the graph $K_4$...") instead of an arbitrary instance.
- Concluding "$X$ is NP-hard, so no polynomial-time algorithm exists": that is only known if $\mathsf{P} \ne \mathsf{NP}$.

## Worked examples (try each before opening the solution)

### Example 1: reading reductions correctly

*Suppose you are told that $X \le_P 3\mathrm{SAT}$ and $3\mathrm{SAT} \le_P Y$. Which of these follow? (i) $X \in \mathsf{NP}$; (ii) $X$ is NP-hard; (iii) $Y$ is NP-hard; (iv) $Y \in \mathsf{NP}$; (v) $X \le_P Y$.*

~~~reveal Solution
- **(i) Yes.** To verify $x \in X$, compute $f(x)$ and use a satisfying assignment of $f(x)$ as the certificate. So $X \in \mathsf{NP}$.
- **(ii) Not implied.** $X$ might be trivial: every problem in P reduces to 3SAT.
- **(iii) Yes.** 3SAT is NP-hard and reduces to $Y$.
- **(iv) Not implied.** $Y$ could be far harder than NP (the halting problem is NP-hard).
- **(v) Yes.** Reductions compose: $X \le_P 3\mathrm{SAT} \le_P Y$.

Memory aid: a reduction $A \le_P B$ is an arrow along which **hardness flows forward** and **easiness flows backward**.
~~~

### Example 2: Hamiltonian path with prescribed endpoints

*STHamPath: given a graph $G$ and two vertices $s, t$, is there a Hamiltonian path from $s$ to $t$? Prove it is NP-hard, using that (undirected) Hamiltonian Path is NP-hard.*

~~~reveal Solution
**Reduction from Hamiltonian Path.** Given $G = (V, E)$ with $n \ge 1$ vertices, build $G'$ by adding two new vertices $s$ and $t$, each adjacent to **every** vertex of $G$ (but not to each other). Output $(G', s, t)$. This adds $2n$ edges: linear time.

*(⇒)* If $v_1, v_2, \dots, v_n$ is a Hamiltonian path in $G$, then $s, v_1, \dots, v_n, t$ is a Hamiltonian path in $G'$ from $s$ to $t$ ($s v_1$ and $v_n t$ are edges by construction).

*(⇐)* Let $s, u_1, \dots, u_n, t$ be a Hamiltonian $s$-$t$ path in $G'$. The interior vertices $u_1, \dots, u_n$ are exactly the vertices of $G$, each once, and consecutive interior vertices are joined by edges that do not involve $s$ or $t$, i.e., edges of $G$. So $u_1, \dots, u_n$ is a Hamiltonian path in $G$. ∎

Why "adjacent to every vertex"? Because we do not know where $G$'s Hamiltonian path starts and ends; the reduction must not need to know.
~~~

### Example 3: Hitting Set

*Hitting Set: given a finite set $U$, subsets $S_1, \dots, S_m \subseteq U$, and $k$, is there $H \subseteq U$ with $|H| \le k$ that intersects every $S_i$? Prove that Hitting Set is NP-complete.*

~~~reveal Solution
**In NP.** Certificate: $H$. Check $|H| \le k$ and that each $S_i$ contains an element of $H$: polynomial in the input size.

**Reduction from Vertex Cover.** Given $(G = (V, E), k)$, let $U = V$ and let the sets be the edges themselves: $S_e = \{u, v\}$ for each $e = uv \in E$. Keep $k$. Linear time.

*(⇒)* A vertex cover $C$ with $|C| \le k$ touches every edge, i.e., intersects every $S_e$: it is a hitting set.

*(⇐)* A hitting set $H$ with $|H| \le k$ intersects every $\{u, v\}$, i.e., contains an endpoint of every edge: it is a vertex cover.

So Vertex Cover is literally the special case of Hitting Set in which every set has size 2. ∎
~~~

### Example 4: hard or easy?

*CliqueMinus3: given a graph $G$ on $n$ vertices, does $G$ contain a clique of size $n - 3$? Is this NP-hard?*

~~~reveal Solution
**It is in P** (so it is not NP-hard unless $\mathsf P = \mathsf{NP}$). A set $K$ is a clique of size $n - 3$ in $G$ iff its complement $V \setminus K$, of size 3, is a vertex cover of the complement graph $\overline G$. So: build $\overline G$ in $O(n^2)$, try all $\binom{n}{3} = O(n^3)$ triples, and check whether each covers all edges of $\overline G$ in $O(n^2)$. Total $O(n^5)$: polynomial.

Contrast with **Half-Clique** (clique of size $n/2$), which is NP-hard: there the "missing" part has size $n/2$, not a constant, and $\binom{n}{n/2}$ is exponential. **Always ask whether a parameter is a fixed constant or part of the input.**
~~~

### Example 5: what is wrong with this reduction?

*A student argues: "Hamiltonian Path is NP-hard by reduction from Hamiltonian Cycle. Given $G$, pick a vertex $v$, add a new vertex $v'$ adjacent to exactly the neighbors of $v$, and output $G'$. A Hamiltonian cycle $v, u_1, \dots, u_{n-1}, v$ gives the Hamiltonian path $v, u_1, \dots, u_{n-1}, v'$." Find the flaw.*

~~~reveal Solution
The (⇒) direction is fine, but **(⇐) is false**: a Hamiltonian path in $G'$ does not have to run from $v$ to $v'$, so it need not close up into a cycle of $G$.

*Counterexample.* $G$ is the path $a - b - c$, which has no Hamiltonian cycle. Choose $v = b$; then $b'$ is adjacent to $a$ and $c$, and $G'$ is the 4-cycle $a, b, c, b'$, which has the Hamiltonian path $a, b, c, b'$. So a no-instance maps to a yes-instance.

*Fix.* Add pendant vertices $s$ (adjacent only to $v$) and $t$ (adjacent only to $v'$). Degree-1 vertices must be endpoints, which forces every Hamiltonian path to look like $s, v, \dots, v', t$. This is the correct reduction from the lesson. The general lesson: prove (⇐) for an **arbitrary** solution of the constructed instance, and look for "unintended" solutions.
~~~

### Example 6: a padding argument

*Prove that the following problem is NP-hard: given $G$ and $k$, does $G$ have an independent set of size $k$ that contains a specified vertex $v$?*

~~~reveal Solution
**Reduction from Independent Set.** Given $(G, k)$, add a new isolated vertex $v$ and output $(G + v, k + 1, v)$.

*(⇒)* If $S$ is independent in $G$ with $|S| = k$, then $S \cup \{v\}$ is independent (since $v$ has no neighbors), has size $k + 1$, and contains $v$.

*(⇐)* If $S'$ is independent in $G + v$, contains $v$, and has size $k + 1$, then $S' \setminus \{v\}$ is an independent set of size $k$ in $G$.

Linear time. ∎ The general principle: adding a gadget that is "free" (always usable) or "forbidden" (never usable) lets you adjust parameters without changing the answer.
~~~

## Common exam problem patterns

| Pattern | Typical target | Recipe |
|---|---|---|
| **Special case (restriction)** | TSP, Set Cover, Hitting Set, Knapsack, Steiner tree | The known problem is literally a special case of the new one. Show how to set the extra parameters (weights 1 and 2, sets of size 2, value = weight, ...) so the new problem behaves exactly like the old one. Short proofs, but still prove both directions. |
| **Padding** | Half-Clique, Half-IS, "cycle through at least half the vertices", "IS containing $v$" | Add isolated, universal, or dummy vertices to move the threshold to where the problem wants it. Case split if the required padding depends on $k$ versus $n$. In (⇐) argue how many dummies a solution can use. |
| **Complement / duality** | Clique, Vertex Cover, Hitting Set | IS in $G$ $\leftrightarrow$ clique in $\overline G$ $\leftrightarrow$ complement is a VC. Set Cover and Hitting Set are transposes. |
| **Local replacement (gadgets)** | Dominating Set, FVS, IS with max degree 3, VC in triangle-free graphs | Replace each edge or vertex of the source by a small gadget that forces the intended local behavior. In (⇐), first **normalize** an arbitrary solution (swap gadget vertices for original ones without increasing the cost), then read off the source solution. |
| **Hamiltonian family** | paths with fixed endpoints, directed versions, Longest Path, TSP | Pendant vertices force endpoints; universal vertices free them; vertex splitting ($v_{in}, v_{mid}, v_{out}$) controls direction; thresholds ($k = n-1$ edges) and weights (1 for edges, 2 for non-edges) turn optimization problems into Hamiltonicity. |
| **Numbers** | Partition, Knapsack, Scheduling, Bin Packing | Start from Subset Sum or Partition. Add one or two balancing numbers, or set capacities to $T$ or $S/2$. Numbers must be written in binary; mention why the DP is only pseudo-polynomial. |
| **Logic** | NAE-SAT, 1-in-3 SAT, SAT with few occurrences | Replace each clause by a small gadget with fresh variables. Prove the gadget correct by checking the cases of its original literals (a truth table is a perfectly good proof). |
| **"It's actually in P"** | 2SAT, 2-Coloring, Euler tour, IS in trees, fixed-$k$ Clique | Check whether the parameter is a constant, whether the structure is a tree or DAG, or whether it is a "2-version". Then give the algorithm and its running time. |
| **Membership in NP** | any decision problem | Certificate, its polynomial size, a verifier that checks without searching. |

## Where students lose points

- **Reducing in the wrong direction.** To show $X$ is hard, the arbitrary input is an instance of the *known* problem, and the output is an instance of $X$.
- **A construction that depends on the answer.** "If $G$ has a clique of size $k$, output ..., otherwise ..." is not an algorithm you can run in polynomial time. The construction may look at the input's structure (sizes, degrees, edges), never at whether it is a yes-instance.
- **Exponential-size constructions.** Numbers written in unary, a vertex for every subset or every assignment, $2^n$ copies of a gadget. Count the size of what you build.
- **Proving only one direction.** (⇒) alone allows the trivial "map everything to a yes-instance". The (⇐) direction is usually the one with the real content.
- **(⇐) only for nice solutions.** "The independent set we built in (⇒) gives back the assignment" is circular. Start (⇐) from an *arbitrary* solution of the constructed instance, and normalize it explicitly if it might use gadget vertices in unintended ways.
- **Reducing from a problem that is not known to be NP-hard**, or from a special case of your own problem that is actually easy (such as 2SAT or 2-Coloring).
- **Ignoring edge cases** like $k > n$, $k \le 1$, $n < 3$ for cycles, or an odd total for Partition. Handling them in one line (by outputting a fixed yes- or no-instance) is usually enough.
- **Membership proofs that search.** A verifier must check a given certificate in polynomial time; a certificate must have polynomial length.
- **Over-claiming.** "NP-hard, so no polynomial algorithm exists" or "NP means not polynomial" are both false statements.

## Self-check

1. You prove $X \le_P 2\mathrm{SAT}$. What does that tell you about $X$?

~~~reveal Answer
$X \in \mathsf P$: 2SAT is solvable in linear time (implication graph and strongly connected components), and easiness transfers backward along a reduction.
~~~

2. You prove $2\mathrm{SAT} \le_P X$. What does that tell you?

~~~reveal Answer
Essentially nothing: every problem in P reduces to almost any nontrivial problem. To show $X$ is hard you must reduce from a problem known to be NP-hard.
~~~

3. Is "does $G$ contain a clique of size 5?" NP-hard?

~~~reveal Answer
No (unless P = NP): it is in P. Try all $\binom{n}{5} = O(n^5)$ vertex sets and check each in $O(1)$ adjacency-matrix lookups. Clique is NP-hard only when $k$ is part of the input.
~~~

4. Why can't the 3SAT → Subset Sum reduction write its numbers in unary?

~~~reveal Answer
Its numbers have $n + m$ decimal digits, so their values are about $10^{n+m}$. In unary they would need exponentially many symbols, so the reduction would not run in polynomial time. (And Subset Sum with unary numbers is in P by the $O(nT)$ DP.)
~~~

5. In 3SAT → Independent Set, what does each of the three ingredients enforce?

~~~reveal Answer
Triangles: at most one chosen literal per clause. $k = m$: at least (hence exactly) one per clause. Conflict edges between $x$ and $\bar x$: the chosen literals are consistent, so they can all be made true simultaneously.
~~~

6. Is UNSAT (is $\varphi$ unsatisfiable?) known to be in NP?

~~~reveal Answer
No. It is in co-NP (a satisfying assignment certifies a *no* answer), and it is co-NP-complete. If UNSAT were in NP, then NP = co-NP, which is believed false.
~~~

7. Why must a reduction start from an *arbitrary* instance of the known problem?

~~~reveal Answer
The reduction is an algorithm that must work on every input of the known hard problem; otherwise you only showed that some special family of instances (which might be easy) can be solved with $X$. Hardness of the known problem is a statement about all of its instances.
~~~

8. If $\mathsf P = \mathsf{NP}$, could we also *find* satisfying assignments in polynomial time, not just decide satisfiability?

~~~reveal Answer
Yes, by self-reduction: set $x_1 = T$, simplify, and ask the decision algorithm whether the result is still satisfiable; if not, set $x_1 = F$. Repeat for each variable. That is $n$ calls to a polynomial-time algorithm.
~~~
`,

  cheatsheet: String.raw`
**P**: decidable in time polynomial in the input length (numbers count by their bit-length).

**NP**: yes-instances have polynomial-size certificates checkable in polynomial time. $\mathsf{P} \subseteq \mathsf{NP}$. **co-NP**: no-instances have such certificates (UNSAT, TAUTOLOGY).

**Reduction $A \le_P B$**: poly-time $f$ with $x \in A \iff f(x) \in B$. Means $B$ is at least as hard as $A$. $B \in P \Rightarrow A \in P$; $A$ NP-hard $\Rightarrow B$ NP-hard.

**NP-hard**: everything in NP reduces to it (poly algorithm ⇒ P = NP). **NP-complete** = NP-hard + in NP.

**Cook–Levin**: CircuitSAT (and SAT) is NP-complete.

**Proof template (X is NP-hard):**
1. Known NP-hard $Y$; reduce **from $Y$ to $X$**.
2. Construction from an *arbitrary* instance of $Y$; polynomial time.
3. ($\Rightarrow$) $Y$-yes ⇒ $X$-yes. 4. ($\Leftarrow$) $X$-yes ⇒ $Y$-yes.

**Canonical reductions.**
- CircuitSAT→SAT: variable per gate; $z = x \wedge y$: $(z \vee \bar x \vee \bar y)(\bar z \vee x)(\bar z \vee y)$.
- SAT→3SAT: split long clauses with chain variables; pad short ones.
- 3SAT→IS: triangle per clause, edges between $x$ and $\bar x$, $k = m$.
- IS$(G,k)$ ⟺ Clique$(\overline G,k)$ ⟺ VC$(G, n-k)$.
- 3SAT→3Color: palette $T,F,X$; variable triangles with $X$; OR gadgets per clause.
- HamCycle→HamPath: copy $v$ to $v'$, pendant $s$ on $v$, pendant $t$ on $v'$.
- Directed→undirected HamCycle: $v_{in} - v_{mid} - v_{out}$.
- 3SAT→SubsetSum: digit per variable and per clause, target $1\dots1\,4\dots4$.
- $k$-Color from 3-Color: add $k-3$ universal vertices. Set Cover from VC: elements = edges, sets = stars.

**In P (contrast):** 2SAT, 2-Coloring, Euler tour, shortest paths, MST, DAG longest path.

**Mistakes:** wrong direction; construction that needs the answer; exponential-size output (unary numbers); one direction only.

**Full proof template.**
1. "We reduce from $Y$, which is NP-hard."
2. "Given an arbitrary instance $y$ of $Y$, construct $x$ = ..." (state sizes).
3. "(⇒) If $y$ has solution $S$, then $S'$ = ... solves $x$ because ..."
4. "(⇐) Let $S'$ be **any** solution of $x$. [Normalize.] Then $S$ = ... solves $y$ because ..."
5. "The construction takes $O(\dots)$ time, so $Y \le_P X$; hence $X$ is NP-hard."
6. (NP-complete) "Certificate: ...; verifier checks ... in polynomial time."

**Composition.** $f$ in time $p$, $g$ in time $q$ ⇒ $g \circ f$ in time $p(n) + q(p(n))$, using $|f(x)| \le p(n)$.

**Which problem to reduce FROM.**
| Target looks like... | Reduce from |
|---|---|
| choose vertices, no two adjacent / all adjacent | Independent Set / Clique |
| choose few vertices or sets touching everything | Vertex Cover, Set Cover |
| assign labels with local constraints | 3-Coloring, 3SAT |
| boolean constraints | 3SAT (NAE-3SAT for symmetric ones) |
| visit every vertex / long path / tour | Hamiltonian Path / Cycle |
| numbers adding up to a target, loads, bins | Subset Sum, Partition |
| connect required vertices cheaply | Set Cover → Steiner Tree |
| split vertices into two sides | NAE-3SAT → Max Cut, Partition |
| "at least half", "contains $v$" | the base problem, by padding |

**Key gadgets.**
- Padding: isolated vertices (free in IS), universal vertices (free in Clique, useless in IS).
- Edge → triangle with new $x_{uv}$ (Dominating Set, FVS). Edge → path $u, a, b, v$: VC grows by exactly 1 (triangle-free VC).
- Vertex of degree $d$ → path $v_1 a_1 v_2 \dots v_d$: IS grows by $d - 1$ (max-degree-3 IS).
- HamCycle → TSP: weight 1 on edges, 2 on non-edges, budget $n$. HamPath → Longest Path: $k = n-1$.
- Subset Sum $(A, T)$, $S = \sum A$ → Partition: add $S + T$ and $2S - T$.
- SAT → each variable $\le 3$ times: copies $x_1..x_k$, clauses $(\bar x_i \vee x_{i+1})$ cyclically.
- 3SAT → NAE-4SAT: add global $z$ to every clause; NAE$(a,b,c,z)$ → NAE$(a,b,s)$ ∧ NAE$(\bar s,c,z)$.
- 3SAT → 1-in-3: $(x \vee y \vee z)$ → $R(\bar x,a,b)\,R(b,y,c)\,R(c,d,\bar z)$.
- NAE-3SAT → Max Cut: edge $x\bar x$ per variable, triangle per clause, target $n + 2m$.
- Set Cover → Steiner: root–set edges, set–element edges, terminals = root + elements, budget $k + |U|$.

**In P traps.** 2SAT (SCCs of implication graph), 2-Coloring (BFS), Euler tour (even degrees), IS in trees (leaf greedy / DP), constant-size Clique ($O(n^c)$), 3-Coloring with a universal vertex (bipartite test), Longest Path in a DAG, Knapsack with unary/small weights.
`,

  quiz: [
    {
      type: 'mc',
      q: 'You want to prove that a new problem X is NP-hard. Which reduction should you give?',
      choices: [
        'A polynomial-time reduction from X to 3SAT',
        'A polynomial-time reduction from 3SAT to X',
        'An exponential-time reduction from 3SAT to X',
        'A polynomial-time algorithm that verifies certificates for X'
      ],
      answer: 1,
      explain: String.raw`Reducing 3SAT **to** $X$ shows "if $X$ were easy, 3SAT would be easy", so $X$ is at least as hard as 3SAT. Reducing $X$ to 3SAT only shows $X$ is no harder than 3SAT. A verifier shows $X \in \mathsf{NP}$ (membership, not hardness), and an exponential-time reduction proves nothing.`
    },
    {
      type: 'tf',
      q: String.raw`If $A \le_P B$ and $B \in \mathsf{P}$, then $A \in \mathsf{P}$.`,
      answer: true,
      explain: String.raw`To decide $x \in A$, compute $f(x)$ in polynomial time (so $|f(x)|$ is polynomial in $|x|$) and run $B$'s polynomial algorithm on it. A polynomial of a polynomial is a polynomial.`
    },
    {
      type: 'tf',
      q: String.raw`If $A \le_P B$ and $A \in \mathsf{P}$, then $B \in \mathsf{P}$.`,
      answer: false,
      explain: String.raw`Easy problems reduce to hard ones all the time: every problem in P reduces to SAT, but that says nothing about SAT being easy. Information flows the other way: hardness of $A$ transfers to $B$; easiness of $B$ transfers to $A$.`
    },
    {
      type: 'tf',
      q: 'Every problem in P is also in NP.',
      answer: true,
      explain: String.raw`Take the verifier that ignores the certificate and solves the problem directly in polynomial time; the empty certificate works for every yes-instance. So $\mathsf{P} \subseteq \mathsf{NP}$.`
    },
    {
      type: 'tf',
      q: 'NP stands for "not polynomial", the class of problems that cannot be solved in polynomial time.',
      answer: false,
      explain: String.raw`NP means *nondeterministic polynomial time*: problems whose yes-instances have short certificates checkable in polynomial time. It contains all of P. Whether it contains problems outside P is exactly the open P vs NP question.`
    },
    {
      type: 'multi',
      q: 'Which of these problems are known to be solvable in polynomial time? (select all that apply)',
      choices: ['2SAT', '3SAT', 'Deciding whether a graph is 2-colorable', 'Deciding whether a graph is 3-colorable', 'Euler tour (closed walk using every edge once)', 'Hamiltonian cycle'],
      answer: [0, 2, 4],
      explain: String.raw`2SAT (implication graph + SCCs), 2-coloring (BFS bipartiteness) and Euler tours (connectivity + even degrees) are in P. Their "neighbors" 3SAT, 3-coloring and Hamiltonian cycle are NP-hard. Small definitional changes can cross the P/NP-hard boundary.`
    },
    {
      type: 'mc',
      q: 'In the reduction from 3SAT (m clauses, n variables) to Independent Set, what is the target size k?',
      choices: ['n', 'm', '3m', 'n + m'],
      answer: 1,
      explain: String.raw`Each clause becomes a triangle, so an independent set contains at most one vertex per clause; requiring $k = m$ forces exactly one chosen (true) literal per clause. Conflict edges between $x$ and $\bar x$ make the chosen literals consistent.`
    },
    {
      type: 'mc',
      q: String.raw`A graph $G$ has $n$ vertices. Which statement is correct for every $S \subseteq V$?`,
      choices: [
        String.raw`$S$ is independent in $G$ iff $S$ is a vertex cover of $G$`,
        String.raw`$S$ is independent in $G$ iff $V \setminus S$ is a vertex cover of $G$`,
        String.raw`$S$ is a clique in $G$ iff $V \setminus S$ is independent in $G$`,
        String.raw`$S$ is a vertex cover of $G$ iff $S$ is a clique in $\overline G$`
      ],
      answer: 1,
      explain: String.raw`No edge has both endpoints in $S$ $\iff$ every edge has at least one endpoint outside $S$, i.e., in $V \setminus S$. So $G$ has an independent set of size $k$ iff it has a vertex cover of size $n-k$. The clique connection is: $S$ independent in $G$ iff $S$ is a clique in $\overline G$.`
    },
    {
      type: 'tf',
      q: 'Subset Sum can be solved by dynamic programming in O(nT) time, where T is the target. Therefore Subset Sum is in P.',
      answer: false,
      explain: String.raw`The input encodes $T$ in about $\log_2 T$ bits, so $O(nT)$ can be exponential in the input size. This is a *pseudo-polynomial* algorithm. Subset Sum is NP-hard (e.g., from 3SAT with numbers having polynomially many digits but exponentially large values).`
    },
    {
      type: 'mc',
      q: 'Which of these problems is in co-NP (and not obviously in NP)?',
      choices: [
        'Given a CNF formula, is it satisfiable?',
        'Given a boolean formula, is it true under EVERY assignment (a tautology)?',
        'Given a graph, does it have a Hamiltonian cycle?',
        'Given a graph and k, does it have a clique of size k?'
      ],
      answer: 1,
      explain: String.raw`A no-instance of TAUTOLOGY has a short certificate (an assignment making the formula false), so TAUTOLOGY is in co-NP. A short certificate for "true under all $2^n$ assignments" is not known. The other three are in NP.`
    },
    {
      type: 'tf',
      q: 'If some NP-hard problem has a polynomial-time algorithm, then P = NP.',
      answer: true,
      explain: String.raw`Every NP problem reduces to an NP-hard problem in polynomial time; composing that reduction with the polynomial algorithm would solve every NP problem in polynomial time, so $\mathsf{NP} \subseteq \mathsf{P}$, and $\mathsf{P} \subseteq \mathsf{NP}$ always.`
    },
    {
      type: 'mc',
      q: 'A student "reduces" 3SAT to problem X as follows: "Given φ, try all 2^n assignments. If one satisfies φ, output a fixed yes-instance of X; otherwise output a fixed no-instance." What is wrong?',
      choices: [
        'Nothing; it maps yes to yes and no to no',
        'The reduction goes in the wrong direction',
        'The reduction does not run in polynomial time',
        'X might not be in NP'
      ],
      answer: 2,
      explain: String.raw`The correctness condition holds, but the construction itself takes exponential time, so it is not a polynomial-time reduction. A valid reduction must build its output without solving the source problem. (With unlimited time, everything decidable "reduces" to everything nontrivial, so such a reduction proves nothing.)`
    },
    {
      type: 'multi',
      q: 'Which of the following are required parts of an NP-hardness proof by reduction from a known NP-hard problem Y to X? (select all that apply)',
      choices: [
        'A construction that maps an arbitrary instance of Y to an instance of X',
        'An argument that the construction runs in polynomial time',
        'A proof that yes-instances of Y map to yes-instances of X',
        'A proof that yes-instances of the constructed X-instance come only from yes-instances of Y',
        'A polynomial-time algorithm for X'
      ],
      answer: [0, 1, 2, 3],
      explain: String.raw`Construction, polynomial running time and both directions of the "iff" are all needed. A polynomial-time algorithm for $X$ is of course not part of the proof (none is expected to exist). Membership in NP is an extra step only if you also claim NP-completeness.`
    },
    {
      type: 'mc',
      q: 'In the HamCycle → HamPath reduction, we copy a vertex v to v\' (with the same neighbors) and attach new degree-1 vertices s (to v) and t (to v\'). Why the degree-1 vertices?',
      choices: [
        'To make the graph connected',
        'They force every Hamiltonian path to start at s and end at t, so the path must run from v to v\', which closes into a cycle through v',
        'To make the number of vertices even',
        'They are not necessary; copying v is enough'
      ],
      answer: 1,
      explain: String.raw`A degree-1 vertex can only be an endpoint of a Hamiltonian path. With both $s$ and $t$ pendant, the path is $s, v, \dots, v', t$; the vertex before $v'$ is a neighbor of $v$, closing a Hamiltonian cycle in $G$. Without $s$ and $t$, a Hamiltonian path in $G + v'$ need not correspond to a cycle.`
    },
    {
      type: 'tf',
      q: 'The halting problem is NP-hard.',
      answer: true,
      explain: String.raw`SAT reduces to it: map $\varphi$ to a program that tries all assignments and halts iff one satisfies $\varphi$ (otherwise loops forever). The mapping is polynomial time (just writing down a program containing $\varphi$). The halting problem is not in NP (it is undecidable), so it is NP-hard but not NP-complete.`
    },
    {
      type: 'mc',
      q: String.raw`Suppose $X \le_P 3\mathrm{SAT}$ and $3\mathrm{SAT} \le_P X$. What can you conclude?`,
      choices: [
        String.raw`$X \in \mathsf P$`,
        String.raw`$X$ is NP-complete`,
        String.raw`$X$ is NP-hard but possibly not in NP`,
        'Nothing, without more information'
      ],
      answer: 1,
      explain: String.raw`$3\mathrm{SAT} \le_P X$ makes $X$ NP-hard. $X \le_P 3\mathrm{SAT}$ puts $X$ in NP: a verifier for $X$ can compute the reduction and check a satisfying assignment of the resulting formula. NP-hard and in NP is NP-complete. ($X \in \mathsf P$ would follow only if $\mathsf P = \mathsf{NP}$.)`
    },
    {
      type: 'tf',
      q: String.raw`If $X$ is NP-hard and $X \le_P Y$, then $Y$ is NP-hard.`,
      answer: true,
      explain: String.raw`Every NP problem $L$ satisfies $L \le_P X$, and composing with $X \le_P Y$ gives $L \le_P Y$. Reductions compose because a polynomial of a polynomial is a polynomial.`
    },
    {
      type: 'tf',
      q: String.raw`If $Y$ is NP-complete and $X$ is any problem in NP, then $X \le_P Y$.`,
      answer: true,
      explain: String.raw`That is the definition of NP-hardness of $Y$: every problem in NP reduces to it. (The reverse, $Y \le_P X$, holds only if $X$ is NP-hard too.)`
    },
    {
      type: 'multi',
      q: 'Which of the following would imply P = NP? (select all that apply)',
      choices: [
        'A polynomial-time algorithm for Vertex Cover',
        'A polynomial-time reduction from 3SAT to 2SAT',
        'A polynomial-time algorithm for 2SAT',
        'A polynomial-time reduction from 2SAT to 3SAT',
        'A polynomial-time algorithm for Subset Sum with numbers written in binary',
        'An O(nT)-time algorithm for Subset Sum with target T'
      ],
      answer: [0, 1, 4],
      explain: String.raw`Vertex Cover and binary Subset Sum are NP-hard, so polynomial algorithms for them give $\mathsf P = \mathsf{NP}$. A reduction from 3SAT to 2SAT, combined with the linear-time 2SAT algorithm, would solve 3SAT in polynomial time. A 2SAT algorithm and a reduction from 2SAT to 3SAT are already known and prove nothing. The $O(nT)$ DP is pseudo-polynomial and also already known.`
    },
    {
      type: 'tf',
      q: 'If P = NP, then every problem in NP is NP-complete.',
      answer: false,
      explain: String.raw`Almost: if $\mathsf P = \mathsf{NP}$, every problem in NP except the two trivial languages $\emptyset$ and $\Sigma^*$ is NP-complete (any $L \in \mathsf P$ reduces to any $B$ that has both a yes-instance and a no-instance: solve $L$ in polynomial time and output a fixed yes- or no-instance of $B$). But $\emptyset$ has no yes-instances and $\Sigma^*$ no no-instances, so no Karp reduction from SAT can map into them correctly.`
    },
    {
      type: 'mc',
      q: String.raw`For Clique on input $(G, k)$ with $n$ vertices, which certificate size is appropriate?`,
      choices: [
        String.raw`$O(k \log n)$ bits: the names of the $k$ vertices`,
        String.raw`$O(2^n)$ bits: a list of all subsets that are cliques`,
        String.raw`$O(n^k)$ bits: all $k$-subsets with a flag for each`,
        'No certificate is needed, since Clique is in P'
      ],
      answer: 0,
      explain: String.raw`The certificate is the clique itself: $k$ vertex names of $O(\log n)$ bits each. The verifier checks the $\binom{k}{2}$ pairs. Certificates listing many candidate solutions are exponentially long and miss the point of NP.`
    },
    {
      type: 'tf',
      q: 'An O(n^k)-time algorithm for deciding whether a graph has a clique of size k, where k is part of the input, is a polynomial-time algorithm.',
      answer: false,
      explain: String.raw`When $k$ is part of the input it can be as large as $n/2$, and $n^{n/2}$ is exponential. For every **fixed** constant $k$ the algorithm is polynomial, which is why "Clique of size 5" is in P while Clique is NP-hard.`
    },
    {
      type: 'tf',
      q: 'If the weights in a Knapsack instance are written in unary, the problem can be solved in polynomial time.',
      answer: true,
      explain: String.raw`The $O(nW)$ dynamic program is polynomial in the input length when $W$ is written in unary (the input then has length at least $W$). This is the meaning of "pseudo-polynomial": polynomial in the numeric values, not in their bit-lengths.`
    },
    {
      type: 'tf',
      q: 'Longest path in a DAG can be computed in linear time. Since Longest Path is NP-hard, this would imply P = NP.',
      answer: false,
      explain: String.raw`NP-hardness of Longest Path is about **general** graphs. DAGs are a special case, and special cases of hard problems can be easy. The reduction from Hamiltonian Path produces graphs with cycles, never DAGs.`
    },
    {
      type: 'tf',
      q: 'Every NP-hard problem is decidable.',
      answer: false,
      explain: String.raw`The halting problem is NP-hard (SAT reduces to it) but undecidable. NP-hardness is a lower bound on difficulty; there is no upper bound.`
    },
    {
      type: 'mc',
      q: 'In the 3SAT → 3-Coloring reduction, what is the purpose of the palette triangle T, F, X?',
      choices: [
        'It makes the graph connected',
        'It fixes three reference colors, so that literal vertices (adjacent to X) must be colored like T or like F, i.e., true or false',
        'It ensures that the graph is not bipartite',
        'It forces every clause gadget to use all three colors'
      ],
      answer: 1,
      explain: String.raw`The three palette vertices get three different colors, which we *name* true, false and other. Every literal vertex is adjacent to $X$, so it is colored true or false, and $x$, $\bar x$ (adjacent) get opposite values. The edges $o F$ and $o X$ at each clause output force it to be true.`
    },
    {
      type: 'tf',
      q: 'Every NP-complete problem reduces in polynomial time to every other NP-complete problem.',
      answer: true,
      explain: String.raw`If $A$ and $B$ are NP-complete, then $A \in \mathsf{NP}$ and $B$ is NP-hard, so $A \le_P B$; symmetrically $B \le_P A$. All NP-complete problems are polynomially equivalent.`
    },
    {
      type: 'mc',
      q: String.raw`To reduce Subset Sum $(A, T)$ to Partition, with $S = \sum A$ and $0 \le T \le S$, which two numbers can be added to $A$?`,
      choices: [
        String.raw`$T$ and $S - T$`,
        String.raw`$S + T$ and $2S - T$`,
        String.raw`$S$ and $T$`,
        String.raw`$2T$ and $2S$`
      ],
      answer: 1,
      explain: String.raw`The new total is $4S$, so each side must sum to $2S$. The two new numbers sum to $3S > 2S$, so they are on opposite sides; the side with $2S - T$ needs exactly $T$ more from $A$. Conversely a subset $B$ summing to $T$ gives the partition $B \cup \{2S - T\}$ versus the rest. Adding $T$ and $S - T$ fails: a partition could then exist for reasons unrelated to $T$.`
    },
    {
      type: 'tf',
      q: 'If P ≠ NP, then no NP-complete problem can be solved in polynomial time.',
      answer: true,
      explain: String.raw`Contrapositive of "a polynomial algorithm for an NP-hard problem implies $\mathsf P = \mathsf{NP}$".`
    },
    {
      type: 'multi',
      q: 'Which of these problems are known to be in NP? (select all that apply)',
      choices: [
        'Composite: is the integer N (in binary) composite?',
        'Hamiltonian Cycle',
        'UNSAT: is the CNF formula unsatisfiable?',
        'TAUTOLOGY: is the formula true under every assignment?',
        'Is there an s–t path of length at most k in a weighted graph?'
      ],
      answer: [0, 1, 4],
      explain: String.raw`Composite: certificate is a nontrivial divisor ($O(\log N)$ bits), checked by one division. Hamiltonian Cycle: the cycle. The shortest-path question is in P, hence in NP. UNSAT and TAUTOLOGY are co-NP-complete; they are not known to be in NP.`
    },
    {
      type: 'mc',
      q: String.raw`A student's "3SAT → Independent Set" uses the standard graph (clause triangles plus conflict edges) but sets $k = n$, the number of **variables**, instead of $m$. What goes wrong?`,
      choices: [
        'Nothing; the reduction is still correct',
        'Only the running time breaks',
        'The (⇐) direction fails: an independent set of size n need not cover every clause, so unsatisfiable formulas can map to yes-instances',
        'The graph is no longer polynomial size'
      ],
      answer: 2,
      explain: String.raw`An independent set with fewer than $m$ vertices can skip clauses. For instance, the formula with all 8 clauses over $x, y, z$ (every sign pattern) is unsatisfiable, but choosing the literal $x$ from three different clauses that contain $x$ gives an independent set of size $3 = n$. (When $n > m$, (⇒) fails too, since no independent set has more than $m$ vertices.)`
    }
  ],

  flashcards: [
    { front: 'Definition of NP (verifier form)', back: String.raw`$L \in \mathsf{NP}$ iff there is a poly-time verifier $V$ and polynomial $p$ with: $x \in L \iff \exists c, |c| \le p(|x|)$, $V(x,c)$ accepts.` },
    { front: 'co-NP', back: 'Complements of NP problems: no-instances have short checkable certificates. Examples: UNSAT, TAUTOLOGY. P ⊆ NP ∩ co-NP.' },
    { front: 'What does A ≤_P B prove?', back: 'B is at least as hard as A: B ∈ P ⇒ A ∈ P, and A NP-hard ⇒ B NP-hard. Direction for hardness: FROM known hard TO new problem.' },
    { front: 'NP-hard vs NP-complete', back: 'NP-hard: every NP problem reduces to it (a poly-time algorithm ⇒ P = NP). NP-complete: NP-hard AND in NP.' },
    { front: 'Cook–Levin theorem', back: 'Circuit-SAT (hence SAT) is NP-complete: any poly-time verifier on fixed-length inputs unrolls into a poly-size circuit over the certificate bits.' },
    { front: 'Five parts of an NP-hardness proof', back: '1) known hard Y; 2) poly-time construction from ARBITRARY Y-instance; 3) Y-yes ⇒ X-yes; 4) X-yes ⇒ Y-yes; 5) polynomial size/time.' },
    { front: 'Clauses for z = x AND y', back: String.raw`$(z \vee \bar x \vee \bar y) \wedge (\bar z \vee x) \wedge (\bar z \vee y)$.` },
    { front: 'SAT → 3SAT: splitting a long clause', back: String.raw`$(\ell_1 \vee \dots \vee \ell_k) \to (\ell_1 \vee \ell_2 \vee y_1)(\bar y_1 \vee \ell_3 \vee y_2)\cdots(\bar y_{k-3} \vee \ell_{k-1} \vee \ell_k)$ with fresh $y$'s.` },
    { front: '3SAT → Independent Set', back: String.raw`Triangle of literal-vertices per clause; edge between every $x$ and $\bar x$; $k = m$ (number of clauses).` },
    { front: 'IS, Clique, VC relationships', back: String.raw`$S$ independent in $G$ ⟺ $S$ clique in $\overline G$ ⟺ $V \setminus S$ vertex cover of $G$. IS$(G,k)$ ⟺ Clique$(\overline G,k)$ ⟺ VC$(G,n-k)$.` },
    { front: 'HamCycle → HamPath', back: String.raw`Pick $v$; add $v'$ with $N(v') = N(v)$, pendant $s$ on $v$, pendant $t$ on $v'$. HamCycle in $G$ ⟺ HamPath in $G'$.` },
    { front: '3-Color → k-Color, and the OR gadget', back: String.raw`Add $k-3$ vertices adjacent to everything (and each other). OR gadget: triangle $p',q',o$ with $pp'$, $qq'$; both inputs false force $o$ false.` },
    { front: 'Why the Subset Sum DP is not polynomial', back: String.raw`$O(nT)$ is polynomial in the VALUE $T$, but $T$ has only $\log T$ bits: pseudo-polynomial. The 3SAT reduction creates numbers with polynomially many digits.` },
    { front: 'Most common NP-hardness mistakes', back: 'Wrong direction; construction that depends on knowing the answer; exponential-size output (unary numbers, enumerating solutions); proving only one direction; using a specific instance.' },
    { front: 'Why reductions compose', back: String.raw`If $f$ runs in time $p(n)$ then $|f(x)| \le p(n)$, so $g(f(x))$ takes $\le q(p(n))$. Total $p(n) + q(p(n))$: polynomial. Correctness chains through the two iffs.` },
    { front: 'Recipe: show X ∈ NP', back: 'Name the certificate and argue its length is polynomial in the input bits; give a verifier that CHECKS (never searches) in polynomial time; yes-instances have a passing certificate, no-instances have none.' },
    { front: 'Padding trick (Half-Clique, Half-IS)', back: 'Move the threshold with dummy vertices: isolated vertices are free for IS and useless for Clique; universal vertices are free for Clique and useless (in sets of size ≥ 2) for IS. Case split on 2k vs n.' },
    { front: 'Subset Sum → Partition', back: String.raw`With $S = \sum A$ and $0 \le T \le S$: add $S + T$ and $2S - T$. Total $4S$; the two new numbers must be on opposite sides, so the side with $2S - T$ needs exactly $T$ from $A$.` },
    { front: 'HamCycle → TSP and HamPath → Longest Path', back: String.raw`TSP: complete graph, weight 1 on edges of $G$, 2 on non-edges, budget $n$. Longest Path: ask for a simple path with $\ge n - 1$ edges.` },
    { front: '2SAT is in P', back: String.raw`Implication graph: clause $(a \vee b)$ gives $\bar a \to b$ and $\bar b \to a$. Unsatisfiable iff some $x$ and $\bar x$ share an SCC. Otherwise set $\ell$ true iff comp$(\ell)$ comes after comp$(\bar\ell)$ in topological order. $O(n + m)$.` },
    { front: 'SAT with each variable at most 3 times', back: String.raw`Replace the $k$ occurrences of $x$ by fresh $x_1..x_k$ and add $(\bar x_1 \vee x_2)(\bar x_2 \vee x_3)\cdots(\bar x_k \vee x_1)$: the cycle of implications forces all copies equal; each copy appears 3 times.` },
    { front: '3SAT → NAE-3SAT', back: String.raw`Add one global variable $z$: $(a \vee b \vee c) \mapsto$ NAE$(a,b,c,z)$ (complement symmetry lets us assume $z$ = F). Then split: NAE$(a,b,s) \wedge$ NAE$(\bar s,c,z)$ with fresh $s$.` },
    { front: '3SAT → 1-in-3 SAT gadget', back: String.raw`$(x \vee y \vee z) \mapsto R(\bar x, a, b) \wedge R(b, y, c) \wedge R(c, d, \bar z)$, $R$ = exactly one true, $a,b,c,d$ fresh. All of $x,y,z$ false forces $a=b=c=d=$ F and kills the middle clause.` },
    { front: 'Set Cover → Steiner Tree', back: String.raw`Root $r$ joined to a vertex per set; each set-vertex joined to its elements; terminals = $r$ + all elements; unit weights; budget $k + |U|$. A tree with $j$ set-vertices has $j + |U|$ edges.` },
    { front: 'NAE-3SAT → Max Cut', back: String.raw`Edge $x\bar x$ per variable, a triangle on the three literals of each clause; target $n + 2m$. A triangle has at most 2 cut edges, exactly 2 iff not all its literals are on one side.` },
    { front: 'Degree-3 Independent Set gadget', back: String.raw`Replace each vertex $v$ of degree $d$ by the path $v_1 a_1 v_2 a_2 \dots v_d$ and attach each original edge to its own $v_i$. Max IS grows by exactly $\sum (d_v - 1)$ (isolated vertices stay single, counting as $d = 1$); max degree becomes 3.` }
  ],

  problems: [
    {
      id: 'np-verify-hampath-code', type: 'code', title: 'A polynomial-time verifier for Hamiltonian path', difficulty: 1,
      prompt: String.raw`Hamiltonian Path is in NP: the certificate is an ordering of the vertices. Write the verifier <code>verifyHamPath(n, edges, order)</code>: the graph is **undirected** on vertices <code>0..n-1</code> (with $n \ge 1$) and edge list <code>edges</code> of pairs. Return <code>true</code> iff <code>order</code> is an array listing every vertex exactly once such that each pair of consecutive vertices is joined by an edge. Your verifier should run in polynomial (ideally $O(V + E)$ expected) time.`,
      fn: 'verifyHamPath',
      starter: 'function verifyHamPath(n, edges, order) {\n  // check: permutation of 0..n-1, consecutive vertices adjacent\n}\n',
      reference: function (n, edges, order) {
        if (!Array.isArray(order) || order.length !== n) return false;
        const seen = new Array(n).fill(false);
        for (const v of order) {
          if (!Number.isInteger(v) || v < 0 || v >= n || seen[v]) return false;
          seen[v] = true;
        }
        const adj = new Set();
        for (const [u, v] of edges) { adj.add(u + ',' + v); adj.add(v + ',' + u); }
        for (let i = 0; i + 1 < n; i++) if (!adj.has(order[i] + ',' + order[i + 1])) return false;
        return true;
      },
      tests: [
        [1, [], [0]],
        [3, [[0, 1], [1, 2]], [0, 1, 2]],
        [3, [[0, 1], [1, 2]], [2, 1, 0]],
        [3, [[0, 1], [1, 2]], [1, 0, 2]],
        [3, [[0, 1], [1, 2]], [0, 1]],
        [3, [[0, 1], [1, 2]], [0, 1, 1]],
        [4, [[0, 1], [1, 2], [2, 3], [3, 0]], [2, 1, 0, 3]],
        [4, [[0, 1], [1, 2], [2, 3], [3, 0]], [0, 2, 1, 3]],
        [2, [[1, 0]], [0, 1]],
        [3, [[0, 1], [1, 2]], [0, 1, 3]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const edges = [];
        if (Math.random() < 0.5) for (let i = 0; i + 1 < n; i++) if (Math.random() < 0.9) edges.push([perm[i], perm[i + 1]]);
        const extra = Math.floor(Math.random() * n * 1.5);
        for (let i = 0; i < extra; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        const order = perm.slice();
        const r = Math.random();
        if (r < 0.1 && n > 1) order[0] = order[1];
        else if (r < 0.15) order.pop();
        return [n, edges, order];
      },
      hints: [
        'First check that order is a permutation: correct length, every entry an integer in range, no repeats.',
        'Put the edges in a hash set (store both orientations) so each adjacency test is O(1) expected.'
      ],
      solution: String.raw`A certificate is valid iff (1) it has length $n$, (2) its entries are distinct integers in $[0, n)$ (so it is a permutation), and (3) every consecutive pair is an edge. Check (1) and (2) with a boolean array in $O(n)$. For (3), insert every edge into a hash set in both orientations ($O(E)$ expected), then test the $n - 1$ consecutive pairs in $O(1)$ each. Total $O(V + E)$ expected time, certainly polynomial, which (together with the fact that a Hamiltonian path, when one exists, is a certificate of polynomial size) shows Hamiltonian Path $\in \mathsf{NP}$.

Note what the verifier does **not** do: it never searches for a path. Finding one is the (presumably) hard part; checking one is easy.`
    },
    {
      id: 'np-mistakes', type: 'written', title: 'Spot the broken reduction', difficulty: 1,
      prompt: String.raw`Each of the following "proofs" is flawed. Identify the flaw in each.

(a) "To prove that problem $X$ is NP-hard, I describe a polynomial-time algorithm that converts any instance of $X$ into an equivalent 3SAT formula."

(b) "Reduction from Independent Set to $X$: given $(G, k)$, I construct an instance $f(G, k)$ of $X$ and prove that if $G$ has an independent set of size $k$ then $f(G, k)$ is a yes-instance. Hence $X$ is NP-hard."

(c) "Reduction from Vertex Cover to $X$: given $(G, k)$, compute a minimum vertex cover $C$ of $G$; if $|C| \le k$ output ... "

(d) "Reduction from 3SAT to $X$: given $\varphi$ with $n$ variables, the instance of $X$ is a list of all $2^n$ truth assignments ... "`,
      rubric: [
        '(a) Wrong direction: shows X ≤ 3SAT, i.e., X is no harder than 3SAT (X ∈ NP), not hardness',
        '(b) Only one direction: must also show f(G,k) yes ⇒ G has an IS of size k',
        '(c) Construction solves the NP-hard problem itself, so it is not polynomial time (unless P = NP)',
        '(d) Output has exponential size, so the reduction is not polynomial time'
      ],
      hints: ['Check each against the template: direction, polynomial time, both directions of the iff.'],
      solution: String.raw`**(a) Wrong direction.** Converting $X$ into 3SAT shows $X \le_P$ 3SAT: a 3SAT solver would solve $X$. That proves $X$ is *no harder* than 3SAT (essentially that $X \in \mathsf{NP}$), not that $X$ is hard. For hardness we need 3SAT $\le_P X$.

**(b) Only one direction.** A reduction must satisfy "yes $\iff$ yes". The proof shows yes-instances map to yes-instances but not that no-instances map to no-instances (equivalently: that a yes-answer for $f(G,k)$ implies $G$ has an independent set of size $k$). Without it, $f$ could map everything to a fixed yes-instance.

**(c) Not polynomial time.** Computing a minimum vertex cover is the NP-hard problem itself; a reduction must construct its output in polynomial time without knowing the answer to the source instance.

**(d) Exponential-size output.** Listing $2^n$ assignments takes exponential time and space. The reduction must produce an instance of size polynomial in $|\varphi|$.`
    },
    {
      id: 'np-clique', type: 'written', title: 'Clique is NP-hard', difficulty: 1,
      prompt: String.raw`**Clique:** given an undirected graph $G$ and integer $k$, does $G$ contain $k$ vertices that are pairwise adjacent? Prove that Clique is NP-complete, using the fact that Independent Set is NP-hard.`,
      rubric: [
        'Clique in NP: certificate = the k vertices, check all pairs in polynomial time',
        'Reduction from IS: (G, k) ↦ (complement of G, k)',
        'Both directions: S independent in G ⟺ S clique in the complement',
        'Polynomial time: complement has O(V^2) edges, built in O(V^2)'
      ],
      hints: ['Complement the edges.'],
      solution: String.raw`**In NP.** Certificate: a set $S$ of $k$ vertices. Verify $|S| = k$ and that every pair in $S$ is adjacent: $O(k^2)$ adjacency checks, polynomial.

**Reduction from Independent Set.** Given $(G, k)$ with $G = (V, E)$, output $(\overline G, k)$ where $\overline G = (V, \overline E)$ and $\overline E = \{uv : u \ne v,\ uv \notin E\}$.

*(⇒)* If $S$ is an independent set of size $k$ in $G$, then no two vertices of $S$ are adjacent in $G$, so every two are adjacent in $\overline G$: $S$ is a clique of size $k$ in $\overline G$.

*(⇐)* If $S$ is a clique of size $k$ in $\overline G$, every pair in $S$ is an edge of $\overline G$, hence a non-edge of $G$: $S$ is an independent set of size $k$ in $G$.

**Time.** $\overline G$ has at most $V(V-1)/2$ edges and can be built in $O(V^2)$ time by checking each pair (with an adjacency matrix). Polynomial.

Therefore Clique is NP-hard, and being in NP, NP-complete.`
    },
    {
      id: 'np-vertex-cover', type: 'written', title: 'Vertex Cover is NP-hard', difficulty: 1,
      prompt: String.raw`**Vertex Cover:** given $G$ and $k$, is there a set $C$ of at most $k$ vertices such that every edge has at least one endpoint in $C$? Prove that Vertex Cover is NP-hard by a reduction from Independent Set. Prove both directions carefully.`,
      rubric: [
        'Reduction (G, k) ↦ (G, n − k)',
        'Key lemma: S independent ⟺ V \\ S is a vertex cover, with proof',
        '(⇒) and (⇐) handled, including "at most" vs "exactly" (subsets of IS are independent, supersets of a VC are covers)',
        'Polynomial time'
      ],
      hints: ['What is the complement of an independent set?'],
      solution: String.raw`**Lemma.** For $S \subseteq V$: $S$ is independent $\iff$ $V \setminus S$ is a vertex cover. Indeed, $S$ independent means no edge has both endpoints in $S$, i.e., every edge has at least one endpoint in $V \setminus S$.

**Reduction.** Given $(G, k)$ for Independent Set ("is there an independent set of size at least $k$?") with $n = |V|$, output $(G, n - k)$ for Vertex Cover. (If $k > n$, output a fixed no-instance such as a single edge with budget 0.)

*(⇒)* If $S$ is independent with $|S| \ge k$, then $V \setminus S$ is a vertex cover with $|V \setminus S| = n - |S| \le n - k$.

*(⇐)* If $C$ is a vertex cover with $|C| \le n - k$, then $V \setminus C$ is independent with $|V \setminus C| \ge k$.

**Time.** We output the same graph and one subtraction: linear time.

So Vertex Cover is NP-hard (and it is in NP: the certificate is the cover).`
    },
    {
      id: 'np-hampath', type: 'written', title: 'Hamiltonian path from Hamiltonian cycle', difficulty: 2,
      prompt: String.raw`Prove that the undirected Hamiltonian Path problem (does $G$ have a simple path visiting every vertex?) is NP-hard, by reduction from undirected Hamiltonian Cycle.`,
      rubric: [
        'Construction: pick v; add v\' with N(v\') = N(v); add s adjacent only to v and t adjacent only to v\'',
        '(⇒) cycle v, u1..u_{n-1}, v ↦ path s, v, u1, ..., u_{n-1}, v\', t',
        '(⇐) degree-1 vertices must be endpoints; path from v to v\' closes into a cycle through v',
        'Handles small n (n < 3) and argues polynomial time'
      ],
      hints: [
        'A Hamiltonian cycle through v, cut open at v, is a Hamiltonian path from v to one of v\'s neighbors. How can you force the path to "start at v and end next to v"?',
        'Vertices of degree 1 must be endpoints of any Hamiltonian path.'
      ],
      solution: String.raw`**Construction.** Let $G = (V, E)$ with $n = |V|$. If $n < 3$, $G$ has no Hamiltonian cycle; output a fixed no-instance (e.g., three isolated vertices). Otherwise pick any vertex $v$ and build $G'$ by adding:
- a vertex $v'$ adjacent to exactly the neighbors of $v$ (not to $v$ itself);
- a vertex $s$ adjacent only to $v$;
- a vertex $t$ adjacent only to $v'$.

$G'$ has $n + 3$ vertices and $|E| + \deg(v) + 2$ edges; it is built in linear time.

*(⇒)* Let $v, u_1, u_2, \dots, u_{n-1}, v$ be a Hamiltonian cycle of $G$. Since $u_{n-1}$ is adjacent to $v$, it is adjacent to $v'$. So $s, v, u_1, \dots, u_{n-1}, v', t$ is a Hamiltonian path in $G'$.

*(⇐)* Let $P$ be a Hamiltonian path in $G'$. The vertices $s$ and $t$ have degree 1, so they cannot be interior vertices of $P$; hence $P$ goes from $s$ to $t$. The only neighbor of $s$ is $v$ and the only neighbor of $t$ is $v'$, so $P = s, v, u_1, \dots, u_{n-1}, v', t$, where $u_1, \dots, u_{n-1}$ are exactly the other $n - 1$ vertices of $G$. Consecutive vertices among $v, u_1, \dots, u_{n-1}$ are adjacent in $G$ (edges of $G'$ among original vertices are edges of $G$), and $u_{n-1}$ is adjacent to $v'$, hence to $v$. Since $n \ge 3$, $v, u_1, \dots, u_{n-1}, v$ is a Hamiltonian cycle of $G$.

Therefore Hamiltonian Path is NP-hard.`
    },
    {
      id: 'np-4color', type: 'written', title: '4-Coloring is NP-hard', difficulty: 2,
      prompt: String.raw`Prove that deciding whether a graph is 4-colorable is NP-hard, by a reduction from 3-Coloring. Then generalize: for every fixed $k \ge 3$, $k$-Coloring is NP-hard.`,
      rubric: [
        'Construction: add a new vertex adjacent to every original vertex',
        '(⇒) give the new vertex the fourth color',
        '(⇐) the new vertex\'s color is unused on G, so G uses at most 3 colors',
        'Generalization: add k − 3 new vertices forming a clique, all adjacent to every original vertex (or induct)',
        'Polynomial time'
      ],
      hints: ['Add a vertex that "uses up" one color.'],
      solution: String.raw`**Construction.** Given $G$, build $G'$ by adding one new vertex $a$ adjacent to every vertex of $G$. Linear time.

*(⇒)* If $G$ has a proper coloring with colors $\{1,2,3\}$, color $a$ with color 4. Every edge of $G$ is fine, and every edge at $a$ joins color 4 to a color in $\{1,2,3\}$.

*(⇐)* Suppose $G'$ has a proper 4-coloring, and let $c$ be $a$'s color. Every vertex of $G$ is adjacent to $a$, so none has color $c$. Thus the coloring restricted to $G$ uses only the other three colors and is a proper 3-coloring of $G$.

**Generalization.** For $k \ge 3$, add $k - 3$ new vertices $a_1, \dots, a_{k-3}$ that are pairwise adjacent and adjacent to every vertex of $G$. A 3-coloring of $G$ extends by giving the $a_i$ the colors $4, \dots, k$. Conversely, in a $k$-coloring of $G'$ the $a_i$ form a clique, so they use $k - 3$ distinct colors, none of which appears on $G$; so $G$ is 3-colored. The construction adds $O(kV + k^2)$ edges, polynomial for fixed $k$ (indeed for $k \le$ poly). Since 3-Coloring is NP-hard, so is $k$-Coloring.`
    },
    {
      id: 'np-half-is', type: 'written', title: 'Half independent set', difficulty: 2,
      prompt: String.raw`**HalfIS:** given a graph $G$ with an **even** number $n$ of vertices, does $G$ have an independent set of size exactly $n/2$? Prove that HalfIS is NP-hard by a reduction from Independent Set (given $(G, k)$, is there an independent set of size $k$?).`,
      rubric: [
        'Case 2k <= n: pad with n − 2k isolated vertices; target n − k = n\'/2',
        'Case 2k > n: add 2k − n vertices adjacent to all other vertices (old and new); target k = n\'/2',
        'Both directions in both cases (e.g., at most n − 2k isolated vertices can be used; a universal vertex cannot be in an IS of size >= 2)',
        'Handles trivial cases (k <= 1 or k > n)',
        'Polynomial-size construction'
      ],
      hints: [
        'If k is too small relative to n, add vertices that are always free to include.',
        'If k is too big, add vertices that can never be included in a large independent set.'
      ],
      solution: String.raw`Let $G = (V,E)$, $n = |V|$. Trivial cases: if $k > n$ the answer is NO and if $k \le 1$ the answer is YES iff $n \ge k$; output a fixed yes- or no-instance of HalfIS accordingly (e.g., the edgeless graph on 2 vertices is a yes-instance, and the complete graph $K_4$ is a no-instance). Note that an independent set of size $\ge k$ contains one of size exactly $k$, so "exactly" and "at least" are interchangeable here. Now assume $2 \le k \le n$.

**Case $2k \le n$.** Add $n - 2k$ isolated vertices. The new graph $G'$ has $n' = 2n - 2k$ vertices (even), so the HalfIS target is $n'/2 = n - k$.
- *(⇒)* An independent set $S$ of size $k$ in $G$ plus all $n - 2k$ isolated vertices is independent of size $n - k$.
- *(⇐)* An independent set $S'$ of size $n - k$ in $G'$ contains at most $n - 2k$ new vertices, so at least $k$ original vertices; these are independent in $G$.

**Case $2k > n$.** Add $2k - n$ new vertices, each adjacent to every other vertex of $G'$ (original and new). Then $n' = 2k$, target $n'/2 = k$.
- *(⇒)* An independent set of size $k$ in $G$ is still independent in $G'$.
- *(⇐)* Let $S'$ be independent in $G'$ with $|S'| = k \ge 2$. A new vertex is adjacent to all others, so it can only be in an independent set of size 1; hence $S' \subseteq V$ and $S'$ is independent in $G$.

**Time.** We add at most $n$ vertices and $O(n^2)$ edges: polynomial. Therefore HalfIS is NP-hard (it is also in NP, hence NP-complete).`
    },
    {
      id: 'np-double-sat', type: 'written', title: 'Double-SAT', difficulty: 2,
      prompt: String.raw`**DoubleSAT:** given a CNF formula $\varphi$, does $\varphi$ have **at least two** distinct satisfying assignments? Prove that DoubleSAT is NP-complete.`,
      rubric: [
        'In NP: certificate = two distinct assignments, check both satisfy φ',
        'Reduction from SAT: φ ↦ φ ∧ (y ∨ ¬y) with a fresh variable y',
        '(⇒) a satisfying assignment of φ extends with y = T and y = F to two distinct satisfying assignments',
        '(⇐) any satisfying assignment of φ\' restricted to the original variables satisfies φ',
        'Polynomial time'
      ],
      hints: ['Add a new variable that is completely unconstrained.'],
      solution: String.raw`**In NP.** Certificate: two assignments $\alpha \ne \beta$. Check they differ and that each satisfies every clause: polynomial time.

**Reduction from SAT.** Given $\varphi$ over variables $x_1, \dots, x_n$, let $y$ be a new variable and output $\varphi' = \varphi \wedge (y \vee \bar y)$. Linear time.

*(⇒)* If $\alpha$ satisfies $\varphi$, then $\alpha \cup \{y = T\}$ and $\alpha \cup \{y = F\}$ are two distinct assignments, and both satisfy $\varphi'$ (the new clause is always true).

*(⇐)* If $\varphi'$ has (at least two, in particular at least one) satisfying assignments, restricting any of them to $x_1, \dots, x_n$ satisfies $\varphi$, because $\varphi$'s clauses do not mention $y$.

So SAT $\le_P$ DoubleSAT, and DoubleSAT is NP-complete. (If your version of SAT requires exactly three literals per clause, use $(y \vee \bar y \vee y)$ or the 3CNF padding trick; any tautological clause on the fresh variable works.)`
    },
    {
      id: 'np-set-cover', type: 'written', title: 'Set Cover is NP-hard', difficulty: 2,
      prompt: String.raw`**Set Cover:** given a universe $U$, a family $S_1, \dots, S_m$ of subsets of $U$, and an integer $k$, can $U$ be covered by at most $k$ of the sets? Prove that Set Cover is NP-hard by a reduction from Vertex Cover.`,
      rubric: [
        'Universe = edges of G; one set per vertex v: the edges incident to v; same k',
        '(⇒) vertex cover C ↦ sets {S_v : v in C} cover all edges',
        '(⇐) a cover by sets S_v, v in C, means every edge has an endpoint in C',
        'Polynomial-size construction'
      ],
      hints: ['What does a vertex "cover"? Make those the elements.'],
      solution: String.raw`**Construction.** Given $(G = (V,E), k)$, let $U = E$ and for each vertex $v$ let $S_v = \{e \in E : v \in e\}$, the set of edges incident to $v$. Output $(U, \{S_v\}_{v \in V}, k)$. Size $O(V + E)$; built in linear time.

*(⇒)* If $C$ is a vertex cover with $|C| \le k$, then every edge $e$ has an endpoint $v \in C$, so $e \in S_v$: the sets $\{S_v : v \in C\}$ (at most $k$ of them) cover $U$.

*(⇐)* If some sets $\{S_v : v \in C\}$ with $|C| \le k$ cover $U = E$, then every edge lies in some $S_v$ with $v \in C$, i.e., has an endpoint in $C$: $C$ is a vertex cover of size at most $k$.

Hence Set Cover is NP-hard.`
    },
    {
      id: 'np-dominating-set', type: 'written', title: 'Dominating Set is NP-hard', difficulty: 3,
      prompt: String.raw`A *dominating set* in an undirected graph $G$ is a set $D$ of vertices such that every vertex is either in $D$ or adjacent to a vertex of $D$. Prove that deciding whether $G$ has a dominating set of size at most $k$ is NP-hard, by reduction from Vertex Cover.`,
      rubric: [
        'Removes isolated vertices first (they must be in a dominating set but are irrelevant for vertex cover)',
        'Construction: for each edge uv add a new vertex x_uv adjacent to u and v; same k',
        '(⇒) a vertex cover dominates every original vertex (no isolated vertices) and every x_uv',
        '(⇐) replace each x_uv in D by u; the result is still dominating, lies in V, and covers every edge since x_uv must be dominated',
        'Polynomial time'
      ],
      hints: [
        'Add a gadget for each edge that can only be dominated by the edge\'s endpoints (or by itself).',
        'In the reverse direction, a gadget vertex in the dominating set can be swapped for one of its endpoints without losing anything.'
      ],
      solution: String.raw`**Preprocessing.** Isolated vertices never need to be in a vertex cover, but must be in every dominating set. So first delete all isolated vertices from $G$; this does not change the answer to Vertex Cover. Now every vertex has degree $\ge 1$.

**Construction.** Let $G'$ be $G$ plus, for every edge $uv \in E$, a new vertex $x_{uv}$ adjacent to $u$ and $v$ (so $u, v, x_{uv}$ form a triangle). Keep the same $k$. $G'$ has $V + E$ vertices and $3E$ edges.

*(⇒)* Let $C$ be a vertex cover of $G$ with $|C| \le k$. Claim: $C$ dominates $G'$.
- A new vertex $x_{uv}$: the edge $uv$ has an endpoint in $C$, which is adjacent to $x_{uv}$.
- An original vertex $w \notin C$: $w$ has some incident edge $wz$ (no isolated vertices), and $z \in C$ since $C$ covers $wz$; so $w$ is adjacent to $C$.

*(⇐)* Let $D$ be a dominating set of $G'$ with $|D| \le k$. Build $D'$ by replacing each new vertex $x_{uv} \in D$ with $u$ (if $u$ is already present, just delete $x_{uv}$). Then $|D'| \le |D| \le k$, and $D'$ is still dominating: the closed neighborhood of $x_{uv}$ is $\{x_{uv}, u, v\}$, all of which are in or adjacent to $u$ (the vertices $u$, $v$ are adjacent, and $x_{uv}$ is adjacent to $u$). Now $D' \subseteq V$. For each edge $uv$, the vertex $x_{uv}$ is dominated by $D'$, and its only neighbors are $u$ and $v$ (and $x_{uv} \notin D'$), so $u \in D'$ or $v \in D'$. Hence $D'$ is a vertex cover of $G$ of size at most $k$.

**Time.** Linear in the size of $G$. So Dominating Set is NP-hard.`
    },
    {
      id: 'np-fvs', type: 'written', title: 'Feedback Vertex Set is NP-hard', difficulty: 3,
      prompt: String.raw`A *feedback vertex set* in an undirected graph $G$ is a set $F$ of vertices whose removal leaves a forest (no cycles). Prove that deciding whether $G$ has a feedback vertex set of size at most $k$ is NP-hard, by reduction from Vertex Cover.`,
      rubric: [
        'Construction: add a triangle per edge (new vertex x_uv adjacent to u and v); same k',
        '(⇒) removing a vertex cover leaves only vertices of V \\ C (independent) and x\'s of degree <= 1: no cycles',
        '(⇐) replace x_uv in F by u (every cycle through x_uv contains u); then each triangle must be hit by an original vertex, giving a vertex cover',
        'Polynomial time'
      ],
      hints: [
        'Turn every edge into a triangle so that each edge "is" a cycle that must be broken.',
        'A cycle through x_uv must use both of its neighbors u and v.'
      ],
      solution: String.raw`**Construction.** Given $(G = (V,E), k)$, let $G'$ be $G$ plus, for each edge $uv$, a new vertex $x_{uv}$ adjacent to $u$ and $v$. Same $k$. Linear size.

*(⇒)* Let $C$ be a vertex cover of $G$, $|C| \le k$. In $G' - C$: no edge of $G$ survives (each has an endpoint in $C$), so the surviving original vertices are pairwise non-adjacent; and each $x_{uv}$ loses at least one of its two neighbors, so has degree $\le 1$. A cycle needs every vertex on it to have degree $\ge 2$ within the cycle, so no $x_{uv}$ is on a cycle, and the remaining original vertices have no edges among themselves. Hence $G' - C$ is acyclic, and $C$ is a feedback vertex set of size $\le k$.

*(⇐)* Let $F$ be a feedback vertex set of $G'$ with $|F| \le k$. Replace each $x_{uv} \in F$ by $u$ (or simply delete it if $u \in F$ already). This preserves the feedback property: $x_{uv}$ has only the neighbors $u$ and $v$, so every cycle through $x_{uv}$ passes through $u$ and is still hit. The new set $F' \subseteq V$ has $|F'| \le k$. For every edge $uv$ of $G$, the triangle $u, v, x_{uv}$ is a cycle of $G'$ and must contain a vertex of $F'$; since $x_{uv} \notin F'$, either $u \in F'$ or $v \in F'$. So $F'$ is a vertex cover of $G$ of size $\le k$.

**Time.** $O(V + E)$. Therefore Feedback Vertex Set is NP-hard.`
    },
    {
      id: 'np-dir-to-undir-ham', type: 'written', title: 'Directed to undirected Hamiltonian cycle', difficulty: 3,
      prompt: String.raw`Assume directed Hamiltonian Cycle is NP-hard. Prove that **undirected** Hamiltonian Cycle is NP-hard.`,
      rubric: [
        'Construction: each vertex v becomes a path v_in − v_mid − v_out; each directed edge u→v becomes undirected edge u_out − v_in',
        '(⇒) directed Hamiltonian cycle maps to an undirected one traversing each triple in order',
        '(⇐) each v_mid has degree 2, so the cycle traverses every triple consecutively; non-triple edges always join an out to an in, so orienting the cycle gives consistent in→mid→out traversal and hence a directed Hamiltonian cycle',
        'Handles trivial small cases and argues polynomial size'
      ],
      hints: [
        'Split each vertex into three so that an undirected cycle is forced to "enter" and "exit" each vertex at specific ends.',
        'Why is a middle vertex needed? Consider what goes wrong with only v_in − v_out.'
      ],
      solution: String.raw`**Construction.** Given a directed graph $G = (V, E)$ with $n \ge 2$ vertices (for $n = 1$ answer directly), build the undirected graph $H$:
- for each vertex $v$: vertices $v_{in}, v_{mid}, v_{out}$ and edges $v_{in}v_{mid}$, $v_{mid}v_{out}$;
- for each directed edge $u \to v$ (with $u \ne v$): the edge $u_{out} v_{in}$.

$H$ has $3n$ vertices and $2n + |E|$ edges. Polynomial.

*(⇒)* If $v_1 \to v_2 \to \dots \to v_n \to v_1$ is a directed Hamiltonian cycle, then
$v_{1,in}, v_{1,mid}, v_{1,out}, v_{2,in}, v_{2,mid}, v_{2,out}, \dots, v_{n,out}, v_{1,in}$ is a Hamiltonian cycle of $H$ (each $v_{i,out}v_{i+1,in}$ is an edge because $v_i \to v_{i+1} \in E$).

*(⇐)* Let $C$ be a Hamiltonian cycle of $H$. Each $v_{mid}$ has degree exactly 2 in $H$, so $C$ uses both edges $v_{in}v_{mid}$ and $v_{mid}v_{out}$: $C$ traverses every triple as a consecutive block. Every edge of $H$ outside the triples joins some $u_{out}$ to some $w_{in}$. Orient $C$ so that the block of some vertex is traversed $in \to mid \to out$. Leaving $v_{out}$, the cycle takes a non-triple edge, which must go to some $w_{in}$ (an out-vertex is adjacent only to its own mid-vertex and to in-vertices); the cycle then traverses $w$'s block as $w_{in} \to w_{mid} \to w_{out}$, and so on. By induction every block is traversed $in \to mid \to out$, and each step between blocks $u_{out} \to w_{in}$ corresponds to a directed edge $u \to w$ of $G$. Reading off the blocks in order gives a directed cycle through every vertex of $G$ exactly once.

(The middle vertex matters: with only an edge $v_{in} - v_{out}$, an undirected cycle could pass through $v_{in}$ using two edges that come from out-vertices, never using the edge $v_{in}v_{out}$, and then the cycle would not correspond to a directed one. A middle vertex of degree 2 forces each block to be traversed straight through.)

Therefore undirected Hamiltonian Cycle is NP-hard.`
    },
    {
      id: 'np-half-clique', type: 'written', title: 'Half-Clique is NP-hard', difficulty: 2,
      prompt: String.raw`**HalfClique:** given a graph $G$ with an **even** number $n$ of vertices, does $G$ contain a clique on $n/2$ vertices? Prove that HalfClique is NP-complete, by a reduction from Clique (given $(G, k)$, does $G$ contain a clique on $k$ vertices?).`,
      rubric: [
        'Membership in NP (certificate: the n/2 vertices)',
        'Trivial cases (k > n, k <= 1) mapped to fixed instances',
        'Case 2k >= n: add 2k − n isolated vertices; target k; isolated vertices cannot be in a clique of size >= 2',
        'Case 2k < n: add n − 2k vertices adjacent to everything (including each other); target n − k; at most n − 2k new vertices can be used',
        'Both directions in both cases, and polynomial size'
      ],
      hints: [
        'You need to move the target size k to exactly half of the new vertex count.',
        'If k is too large, add vertices that can never join a big clique. If k is too small, add vertices that can always join.'
      ],
      solution: String.raw`**In NP.** Certificate: a set of $n/2$ vertices; check all pairs are adjacent in $O(n^2)$.

**Reduction.** Let $(G, k)$ be an instance of Clique with $n = |V|$. A clique on $\ge k$ vertices contains one on exactly $k$, so "exactly" and "at least" agree.
- If $k > n$, output a fixed no-instance (the edgeless graph on 4 vertices has no clique of size 2). If $k \le 1$, the answer is yes iff $n \ge k$; output the fixed yes-instance $K_2$ or the fixed no-instance accordingly. From now on $2 \le k \le n$.
- **Case $2k \ge n$.** Add $2k - n$ isolated vertices. Now $n' = 2k$ and the target is $n'/2 = k$.
  - *(⇒)* A $k$-clique of $G$ is still a $k$-clique of $G'$.
  - *(⇐)* A clique with $k \ge 2$ vertices cannot contain an isolated vertex, so a $k$-clique of $G'$ lies inside $G$.
- **Case $2k < n$.** Add $n - 2k$ new vertices, adjacent to each other and to every original vertex. Now $n' = 2n - 2k$ and the target is $n'/2 = n - k$.
  - *(⇒)* A $k$-clique $K$ of $G$ together with all $n - 2k$ new vertices is a clique (new vertices are adjacent to everything) of size $n - k$.
  - *(⇐)* A clique of size $n - k$ in $G'$ contains at most $n - 2k$ new vertices, hence at least $k$ original ones, which are pairwise adjacent in $G$.

**Time.** At most $n$ new vertices and $O(n^2)$ new edges. So Clique $\le_P$ HalfClique, and HalfClique is NP-complete.`
    },
    {
      id: 'np-is-degree3', type: 'written', title: 'Independent Set stays hard with maximum degree 3', difficulty: 3,
      prompt: String.raw`Prove that Independent Set is NP-hard even when the input graph has maximum degree at most 3, by a reduction from general Independent Set.

*Suggested gadget:* replace a vertex $v$ of degree $d$ by a path $v_1, a_1, v_2, a_2, \dots, a_{d-1}, v_d$ and attach each edge originally at $v$ to its own vertex $v_i$.`,
      rubric: [
        'Precise construction: path gadget per vertex (isolated vertices kept as single vertices), one port per incident edge, port-to-port edges, new target k + Σ(d_v − 1)',
        'Degree bound: ports have degree ≤ 3, connector vertices degree 2',
        'Path lemma: the 2d − 1 vertex path has maximum IS d, attained only by all ports; otherwise ≤ d − 1',
        '(⇒) take all ports of chosen vertices and all connectors of the others; independence of port edges',
        '(⇐) S = vertices whose ports are all chosen; counting shows |S| ≥ k; S independent',
        'Polynomial size O(V + E)'
      ],
      hints: [
        'In the path v_1 a_1 v_2 ... v_d, what is the largest independent set, and which sets achieve it?',
        'Count: a gadget contributes d_v if "v is chosen", and at most d_v − 1 otherwise.'
      ],
      solution: String.raw`Let $(G, k)$ be an instance of Independent Set, $G = (V, E)$, and write $d_v' = \max(\deg v, 1)$.

**Construction.** For each vertex $v$ create a path $P_v = v_1, a_1, v_2, a_2, \dots, a_{d_v'-1}, v_{d_v'}$ with $2d_v' - 1$ vertices (a single vertex $v_1$ if $v$ is isolated). The $v_i$ are *ports*. For each edge $uv \in E$, pick an unused port $u_i$ of $u$ and an unused port $v_j$ of $v$ and add the edge $u_i v_j$ (each port is used by exactly one edge). Set $k' = k + \sum_v (d_v' - 1)$. A port has at most two path neighbors and one port edge, connectors $a_i$ have degree 2, so the maximum degree is at most 3. The new graph has $O(V + E)$ vertices and edges.

**Path lemma.** In $P_v$ (with $d = d'_v$), group the vertices as $\{v_1, a_1\}, \dots, \{v_{d-1}, a_{d-1}\}, \{v_d\}$: $d$ groups of adjacent vertices, so an independent set contains at most $d$ vertices of $P_v$. Size $d$ requires one vertex from every group, including $v_d$; then $a_{d-1}$ is excluded, so $v_{d-1}$ is chosen; and so on: all ports. Hence an independent set that misses some port of $P_v$ contains at most $d - 1$ vertices of $P_v$.

*(⇒)* Let $S$ be independent in $G$ with $|S| = k$. Take all ports of $P_v$ for $v \in S$ and all connectors $a_i$ of $P_v$ for $v \notin S$. Within each path the chosen vertices alternate, so they are independent. Port edges $u_i v_j$ join ports of $u$ and $v$ with $uv \in E$; both are chosen only if $u, v \in S$, impossible. Connectors are never on port edges. Size: $\sum_{v \in S} d_v' + \sum_{v \notin S} (d_v' - 1) = k + \sum_v (d_v' - 1) = k'$.

*(⇐)* Let $S'$ be independent in the new graph with $|S'| \ge k'$. Let $S$ be the set of $v$ such that **all** ports of $P_v$ are in $S'$. By the lemma, $|S' \cap P_v| \le d_v'$ if $v \in S$ and $\le d_v' - 1$ otherwise, so $k' \le |S'| \le \sum_v (d_v' - 1) + |S|$, giving $|S| \ge k$. And $S$ is independent: for an edge $uv \in E$, the port edge $u_i v_j$ cannot have both ends in $S'$, so $u$ and $v$ are not both in $S$.

So Independent Set $\le_P$ Independent Set on graphs of maximum degree 3. ∎ (It is NP-hard even for maximum degree 3, but polynomial for maximum degree 2, where every component is a path or a cycle.)`
    },
    {
      id: 'np-vc-triangle-free', type: 'written', title: 'Vertex Cover in triangle-free graphs', difficulty: 2,
      prompt: String.raw`Prove that Vertex Cover remains NP-hard on graphs that contain no triangle (no 3-cycle). *Hint of a gadget:* replace each edge $uv$ by a path $u, a, b, v$ through two new vertices.`,
      rubric: [
        'Construction: subdivide every edge twice; k\' = k + |E|; argue the result is triangle-free',
        '(⇒) a cover C of G plus one middle vertex per edge (the one next to an uncovered end) covers G\'',
        '(⇐) normalize an arbitrary cover of G\' so each edge path has exactly one middle vertex and its original edge is covered by an original endpoint',
        'Count: |C\' ∩ V| ≤ k',
        'Polynomial time'
      ],
      hints: [
        'Each path u, a, b, v needs at least one of a, b in any cover (edge ab).',
        'If a cover contains neither u nor v, it must contain both a and b; swap one of them for u.'
      ],
      solution: String.raw`Let $(G = (V, E), k)$ be a Vertex Cover instance with $G$ simple.

**Construction.** Build $G'$: keep $V$, and replace each edge $e = uv$ by the path $u, a_e, b_e, v$ with two new vertices (removing the edge $uv$ itself). Set $k' = k + |E|$. Every cycle of $G'$ is a cycle of $G$ with each edge replaced by three edges, so it has length at least 9; in particular $G'$ has no triangle. Size $O(V + E)$.

*(⇒)* Let $C$ be a vertex cover of $G$, $|C| \le k$. For each edge $e = uv$, at least one endpoint is in $C$; if $u \in C$ add $b_e$, otherwise ($v \in C$) add $a_e$. In the first case $u$ covers $u a_e$, and $b_e$ covers $a_e b_e$ and $b_e v$; the second is symmetric. So we get a cover of $G'$ of size $|C| + |E| \le k'$.

*(⇐)* Let $C'$ be a vertex cover of $G'$ with $|C'| \le k'$. **Normalize** it edge by edge. For each edge $e = uv$: $C'$ contains $a_e$ or $b_e$ (to cover $a_e b_e$). If neither $u$ nor $v$ is in $C'$, then both $a_e$ (to cover $u a_e$) and $b_e$ (to cover $b_e v$) are in $C'$; replace $a_e$ by $u$. This keeps all edges covered ($u a_e$ by $u$, $a_e b_e$ by $b_e$) and does not increase the size. After normalizing, every path still has at least one middle vertex in $C'$, and every original edge $uv$ has $u$ or $v$ in $C'$. Let $C = C' \cap V$. Then $C$ is a vertex cover of $G$, and since $C'$ contains at least one middle vertex per edge, $|C| \le |C'| - |E| \le k$.

So Vertex Cover $\le_P$ Vertex Cover on triangle-free graphs. ∎ (Repeating the trick shows hardness for graphs of any fixed minimum cycle length.)`
    },
    {
      id: 'np-half-hamcycle', type: 'written', title: 'A cycle through at least half the vertices', difficulty: 2,
      prompt: String.raw`(a) **HalfCycle:** given a graph $G$ with $n$ vertices, does $G$ contain a simple cycle through at least $n/2$ vertices? Prove HalfCycle is NP-hard by a reduction from Hamiltonian Cycle.

(b) **HalfPath:** does $G$ contain a simple path through at least $n/2$ vertices? Prove it is NP-hard by a reduction from Hamiltonian Path.`,
      rubric: [
        '(a) Construction: add n isolated vertices; the new threshold is n',
        '(a) Both directions: a cycle cannot use isolated vertices, so a cycle with ≥ n vertices is Hamiltonian in G',
        '(b) Same padding; a path with at least two vertices cannot contain an isolated vertex',
        'Small cases and polynomial time'
      ],
      hints: ['Add vertices that no long cycle (or path) can ever use, so that "half of the new graph" is "all of the old graph".'],
      solution: String.raw`**(a)** Given $G$ with $n \ge 3$ vertices (for $n < 3$ output a fixed no-instance such as three isolated vertices), let $G'$ be $G$ plus $n$ new isolated vertices. $G'$ has $2n$ vertices, so the question becomes: is there a simple cycle through at least $n$ vertices of $G'$?

*(⇒)* A Hamiltonian cycle of $G$ passes through all $n$ original vertices and is a cycle of $G'$.

*(⇐)* Every vertex on a cycle has degree at least 2, so a cycle of $G'$ contains no isolated vertex and lies inside $G$. If it passes through at least $n$ vertices, it passes through all $n$ vertices of $G$: a Hamiltonian cycle.

**(b)** Same construction, from Hamiltonian Path: add $n$ isolated vertices (if $n = 1$, output a fixed yes-instance). *(⇒)* A Hamiltonian path of $G$ is a path in $G'$ through $n = 2n/2$ vertices. *(⇐)* A path through at least $n \ge 2$ vertices has an edge at every vertex, so it avoids the isolated vertices, lies in $G$, and visits all $n$ original vertices.

Both constructions are linear time. ∎`
    },
    {
      id: 'np-dir-hampath-st', type: 'written', title: 'Directed Hamiltonian path between given vertices', difficulty: 2,
      prompt: String.raw`**DirSTHamPath:** given a directed graph $G$ and vertices $s, t$, is there a directed Hamiltonian path from $s$ to $t$? Prove it is NP-hard by a reduction from directed Hamiltonian Cycle.`,
      rubric: [
        'Construction: split one vertex v into s (keeping v\'s out-arcs) and t (keeping v\'s in-arcs)',
        '(⇒) a Hamiltonian cycle, read starting at v, becomes an s→t Hamiltonian path',
        '(⇐) an s→t Hamiltonian path visits every other vertex once; its first and last arcs come from arcs out of and into v; closing it gives a Hamiltonian cycle',
        'Polynomial time'
      ],
      hints: ['A Hamiltonian cycle can be cut open at any vertex v. Make the two "halves" of v the required endpoints.'],
      solution: String.raw`**Construction.** Let $G = (V, E)$ be directed with $n \ge 2$ vertices (for $n = 1$ answer directly). Pick any vertex $v$. Build $G'$ by deleting $v$ and adding two new vertices $s$ and $t$: for every arc $v \to w$ add $s \to w$, and for every arc $u \to v$ add $u \to t$. (A self-loop at $v$ is irrelevant for Hamiltonicity when $n \ge 2$ and can be dropped.) Output $(G', s, t)$. Linear time.

*(⇒)* Let $v \to w_1 \to w_2 \to \dots \to w_{n-1} \to v$ be a directed Hamiltonian cycle. Then $s \to w_1$ (from $v \to w_1$), the arcs $w_i \to w_{i+1}$ (unchanged), and $w_{n-1} \to t$ (from $w_{n-1} \to v$) form a Hamiltonian path from $s$ to $t$ in $G'$.

*(⇐)* Let $s \to w_1 \to \dots \to w_{n-1} \to t$ be a Hamiltonian $s$-$t$ path in $G'$. Its interior vertices are exactly $V \setminus \{v\}$, each once. The arc $s \to w_1$ exists only if $v \to w_1 \in E$, the arc $w_{n-1} \to t$ only if $w_{n-1} \to v \in E$, and the other arcs are arcs of $G$. So $v \to w_1 \to \dots \to w_{n-1} \to v$ is a directed Hamiltonian cycle of $G$.

Hence directed Hamiltonian Cycle $\le_P$ DirSTHamPath. ∎`
    },
    {
      id: 'np-longest-path', type: 'written', title: 'Longest Path, and why DAGs are different', difficulty: 2,
      prompt: String.raw`**LongestPath:** given an undirected graph $G$ and an integer $k$, does $G$ contain a simple path with at least $k$ edges?

(a) Prove that LongestPath is NP-complete.

(b) The longest path in a **DAG** can be found in $O(V + E)$ time by dynamic programming. Explain why this does not contradict (a).

(c) Prove that the variant "given $G$, $s$, $t$, $k$: is there a simple $s$-$t$ path with at least $k$ edges?" is also NP-hard.`,
      rubric: [
        '(a) In NP: certificate is the path; reduction from Hamiltonian Path with k = n − 1',
        '(a) Both directions: a simple path with n − 1 edges visits all n vertices',
        '(b) DAGs are a restricted input class; hardness of the general problem says nothing about special cases; the reduction produces graphs with cycles',
        '(c) Reduction from Hamiltonian Path (add universal s and t, k = n + 1) or from STHamPath'
      ],
      hints: ['How many edges does a Hamiltonian path have?'],
      solution: String.raw`**(a) In NP.** Certificate: the sequence of vertices of the path. Check the vertices are distinct, consecutive ones are adjacent, and there are at least $k + 1$ of them. Polynomial.

**Reduction from Hamiltonian Path.** Map $G$ (with $n$ vertices) to $(G, n - 1)$.
- *(⇒)* A Hamiltonian path is a simple path with $n - 1$ edges.
- *(⇐)* A simple path with at least $n - 1$ edges has at least $n$ distinct vertices, so it visits every vertex: a Hamiltonian path.

Constant work. So LongestPath is NP-complete.

**(b)** NP-hardness says the problem is hard on **all inputs in the worst case**; it does not say every restriction is hard. DAGs are a special input class with extra structure (a topological order), which makes the DP $LP(v) = \max_{v \to w}(1 + LP(w))$ possible. The reduction from Hamiltonian Path produces general undirected graphs, never DAGs, so the DAG algorithm cannot be used to solve Hamiltonian Path.

**(c)** Reduce from Hamiltonian Path. Given $G$ with $n$ vertices, add new vertices $s$ and $t$, each adjacent to every original vertex, and set $k = n + 1$. *(⇒)* A Hamiltonian path $v_1, \dots, v_n$ gives the $s$-$t$ path $s, v_1, \dots, v_n, t$ with $n + 1$ edges. *(⇐)* An $s$-$t$ path with at least $n + 1$ edges has at least $n$ interior vertices; the interior vertices are distinct original vertices, so they are all of $V$, and consecutive interior vertices are joined by edges of $G$: a Hamiltonian path of $G$. Linear time.`
    },
    {
      id: 'np-tsp', type: 'written', title: 'Traveling Salesman is NP-hard (and hard to approximate)', difficulty: 2,
      prompt: String.raw`**TSP (decision):** given a complete graph $K_n$ with positive integer edge weights and a budget $B$, is there a Hamiltonian cycle (tour) of total weight at most $B$?

(a) Prove TSP is NP-complete by a reduction from Hamiltonian Cycle.

(b) Prove that, unless $\mathsf P = \mathsf{NP}$, no polynomial-time algorithm can always output a tour of weight at most twice the optimum (for general weights).`,
      rubric: [
        '(a) In NP; weights 1 on edges of G and 2 on non-edges; B = n',
        '(a) Both directions: a tour of weight ≤ n uses only weight-1 edges',
        '(b) Weights 1 and a large value W (e.g. 2n) on non-edges; Hamiltonian ⇒ OPT = n; not Hamiltonian ⇒ every tour ≥ n − 1 + W > 2n',
        '(b) A 2-approximation would distinguish the two cases, deciding Hamiltonian Cycle in polynomial time'
      ],
      hints: [
        'Make edges of G cheap and non-edges expensive.',
        'For (b), make non-edges so expensive that even one of them pushes the tour above twice the cost of a Hamiltonian cycle.'
      ],
      solution: String.raw`**(a) In NP.** Certificate: the tour as a vertex ordering. Check it is a permutation and sum the $n$ weights; polynomial.

**Reduction from Hamiltonian Cycle.** Given $G = (V, E)$ with $n \ge 3$ vertices, build $K_n$ on $V$ with $w(uv) = 1$ if $uv \in E$ and $w(uv) = 2$ otherwise; set $B = n$. $O(n^2)$ time.

*(⇒)* A Hamiltonian cycle of $G$ is a tour using $n$ edges of weight 1: total $n \le B$.

*(⇐)* A tour has exactly $n$ edges, each of weight $\ge 1$. If its weight is at most $n$, every edge has weight 1, i.e., is an edge of $G$, so the tour is a Hamiltonian cycle of $G$.

(The weights 1 and 2 satisfy the triangle inequality, so even metric TSP is NP-hard.)

**(b)** Suppose algorithm $\mathcal A$ always returns a tour of weight $\le 2 \cdot \mathrm{OPT}$ in polynomial time. Given $G$, build $K_n$ with weight 1 on edges of $G$ and weight $2n$ on non-edges, and run $\mathcal A$.
- If $G$ is Hamiltonian, $\mathrm{OPT} = n$, so $\mathcal A$ returns a tour of weight $\le 2n$.
- If not, every tour uses at least one non-edge, so every tour weighs at least $(n - 1) + 2n = 3n - 1 > 2n$ (for $n \ge 2$).

So "$\mathcal A$'s tour weighs at most $2n$" decides Hamiltonian Cycle in polynomial time, which implies $\mathsf P = \mathsf{NP}$. (The same argument works for any approximation factor, by making the non-edge weight larger, still with polynomially many bits.)`
    },
    {
      id: 'np-in-p-tricks', type: 'written', title: 'Trick questions: these are in P', difficulty: 2,
      prompt: String.raw`Each problem below looks like an NP-hard problem, but is solvable in polynomial time. Give an algorithm, a short correctness argument, and its running time.

(a) 2-Coloring: can the vertices of $G$ be colored with 2 colors so that adjacent vertices differ?

(b) Euler tour: does the connected graph $G$ have a closed walk that uses every **edge** exactly once?

(c) Maximum independent set in a **tree**.

(d) 3-Coloring of a graph $G$ that has a vertex $u$ adjacent to **all** other vertices.

(e) Does $G$ contain a clique on 4 vertices?`,
      rubric: [
        '(a) BFS/DFS 2-coloring per component; fails iff an edge joins equal colors (odd cycle); O(V + E)',
        '(b) Euler: all degrees even (for a connected graph); O(V + E)',
        '(c) Leaf greedy or tree DP with in/out values; O(V)',
        '(d) u\'s color is unavailable to all other vertices, so G is 3-colorable iff G − u is bipartite; both directions; O(V + E)',
        '(e) Brute force over O(n^4) quadruples; polynomial because 4 is a constant'
      ],
      hints: [
        'Look for a fixed constant, a forced choice, or tree structure.',
        'For (d), what color choices remain for the other vertices once u is colored?'
      ],
      solution: String.raw`**(a)** In each component, BFS from any vertex and color by parity of BFS depth. If some edge joins two vertices of the same color, report "no", otherwise "yes". Correctness: in a connected bipartite graph, a 2-coloring is forced once one vertex is colored (each neighbor must get the other color), so the BFS coloring is the only candidate up to swapping; if it fails, no 2-coloring exists. $O(V + E)$.

**(b)** A connected graph has an Euler tour iff every vertex has even degree (Euler's theorem: a closed walk enters and leaves each vertex equally often, so degrees are even; conversely, even degrees let Hierholzer's algorithm splice cycles into one tour). Check the degrees in $O(V + E)$.

**(c)** Root the tree. For each vertex $v$ compute $in(v) = 1 + \sum_{c} out(c)$ (largest IS of $v$'s subtree containing $v$) and $out(v) = \sum_c \max(in(c), out(c))$ (largest IS not containing $v$), over children $c$, in post-order. The answer is $\max(in(r), out(r))$. $O(V)$. (Alternatively: repeatedly take a leaf and delete it and its parent; an exchange argument shows some maximum IS contains every leaf.)

**(d)** Claim: $G$ is 3-colorable iff $G - u$ is 2-colorable. *(⇒)* In a proper 3-coloring, $u$'s color appears on no other vertex (all are adjacent to $u$), so $G - u$ uses only the two remaining colors. *(⇐)* 2-color $G - u$ with colors 1, 2 and give $u$ color 3. So run the bipartiteness test of (a) on $G - u$: $O(V + E)$.

**(e)** Try all $\binom{n}{4} = O(n^4)$ sets of 4 vertices, each checked with 6 adjacency-matrix lookups: $O(n^4)$ time, polynomial because 4 is a fixed constant. Clique is NP-hard only when the size $k$ is part of the input.`
    },
    {
      id: 'np-2sat', type: 'written', title: '2SAT is in P', difficulty: 3,
      prompt: String.raw`A 2CNF formula $\varphi$ has $n$ variables and $m$ clauses, each with at most two literals. The **implication graph** $G_\varphi$ has a vertex for each of the $2n$ literals and, for each clause $(a \vee b)$, the two directed edges $\bar a \to b$ and $\bar b \to a$ (a one-literal clause $(a)$ is treated as $(a \vee a)$).

(a) Prove: if some variable $x$ has $x$ and $\bar x$ in the same strongly connected component, then $\varphi$ is unsatisfiable.

(b) Prove: otherwise $\varphi$ is satisfiable. (Hint: fix a topological order of the components and set a literal true iff its component comes after the component of its negation.)

(c) Conclude an $O(n + m)$ algorithm. Why does this approach not extend to 3SAT?`,
      rubric: [
        '(a) Every edge is a valid implication for a satisfying assignment; paths x ⇝ ¬x and ¬x ⇝ x give a contradiction either way',
        '(b) Defines the assignment via topological positions t(·) of SCCs; consistency (exactly one of x, ¬x true)',
        '(b) Clause check: assuming both literals false yields t(a) < t(¬a) ≤ t(b) < t(¬b) ≤ t(a), a contradiction',
        '(c) SCCs in linear time (Tarjan/Kosaraju); 3-literal clauses do not give single implications'
      ],
      hints: [
        'An edge u → v means "if u is true then v must be true".',
        'Along any edge u → v, the topological position of comp(u) is at most that of comp(v).'
      ],
      solution: String.raw`**(a)** Let $\alpha$ satisfy $\varphi$. Each edge is a valid implication under $\alpha$: the edge $\bar a \to b$ comes from clause $(a \vee b)$, and if $\bar a$ is true then $a$ is false and $b$ must be true. By induction, along any directed path, if the first literal is true then so is the last. If $x$ and $\bar x$ share a component, there are paths $x \leadsto \bar x$ and $\bar x \leadsto x$. If $\alpha(x) = T$, the first path makes $\bar x$ true; if $\alpha(x) = F$, then $\bar x$ is true and the second path makes $x$ true. Either way a contradiction, so $\varphi$ is unsatisfiable.

**(b)** Compute the strongly connected components and number them $1, 2, \dots$ in a topological order of the component DAG, so that for every edge $u \to v$ we have $t(u) \le t(v)$, where $t(\ell)$ is the number of $\ell$'s component. By assumption $t(x) \ne t(\bar x)$ for every $x$. Set a literal $\ell$ **true iff $t(\ell) > t(\bar \ell)$**. This is a consistent assignment: exactly one of $x, \bar x$ is true.

Suppose a clause $(a \vee b)$ had both literals false, i.e., $t(a) < t(\bar a)$ and $t(b) < t(\bar b)$. The edges $\bar a \to b$ and $\bar b \to a$ give $t(\bar a) \le t(b)$ and $t(\bar b) \le t(a)$. Chaining:
$$t(a) < t(\bar a) \le t(b) < t(\bar b) \le t(a),$$
a contradiction. So every clause is satisfied. (For a unit clause $(a)$, the edge $\bar a \to a$ gives $t(\bar a) \le t(a)$, and since they differ, $a$ is true.)

**(c)** Build $G_\varphi$ ($2n$ vertices, $2m$ edges), compute SCCs and a topological order with Tarjan's or Kosaraju's algorithm, check each variable, and output the assignment: $O(n + m)$.

For 3SAT, a clause $(a \vee b \vee c)$ says "if $a$ and $b$ are both false then $c$ is true": the hypothesis involves **two** literals, which a single graph edge cannot express. That is exactly the gap between linear time and NP-hardness.`
    },
    {
      id: 'np-1in3sat', type: 'written', title: '1-in-3 SAT is NP-hard', difficulty: 3,
      prompt: String.raw`**1-in-3 SAT:** given a formula whose clauses each have three literals, is there an assignment under which **every clause has exactly one true literal**? Prove that it is NP-complete by a reduction from 3SAT. Use the clause gadget
$$(x \vee y \vee z) \;\mapsto\; R(\bar x, a, b) \wedge R(b, y, c) \wedge R(c, d, \bar z),$$
where $R(p, q, r)$ means "exactly one of $p, q, r$ is true" and $a, b, c, d$ are fresh variables for each clause.`,
      rubric: [
        'In NP',
        'Construction applied to every clause with fresh variables per clause; linear size',
        'Gadget soundness: if x, y, z are all false then a = b = c = d = F is forced and the middle clause has no true literal',
        'Gadget completeness: case analysis giving values of a, b, c, d whenever at least one of x, y, z is true',
        'Both directions of the overall reduction (local gadgets with fresh variables combine)'
      ],
      hints: [
        'Soundness: if x is false, then ¬x is true, which forces a and b false.',
        'Completeness: split into cases y true; y false and x true; y false, x false, z true.'
      ],
      solution: String.raw`**In NP.** Certificate: the assignment; check each clause has exactly one true literal.

**Construction.** Replace each clause $C_j = (x \vee y \vee z)$ of the 3CNF formula $\varphi$ by the three $R$-clauses above, using four fresh variables $a_j, b_j, c_j, d_j$. The output $\psi$ has $3m$ clauses and $n + 4m$ variables. Linear time.

**Gadget soundness (all false is impossible).** Suppose $x = y = z = F$ and all three $R$-clauses hold. $R(\bar x, a, b)$ with $\bar x = T$ forces $a = b = F$. $R(c, d, \bar z)$ with $\bar z = T$ forces $c = d = F$. Then $R(b, y, c) = R(F, F, F)$ has no true literal: contradiction.

**Gadget completeness (any satisfying pattern extends).**
- *$y = T$:* set $b = c = F$ (middle clause done). First clause: if $x = T$ set $a = T$, else $a = F$ (then $\bar x$ is the true one). Third: if $z = T$ set $d = T$, else $d = F$.
- *$y = F$, $x = T$:* set $b = T$, $c = F$ (middle done), $a = F$ (first clause: $\bar x = F$, $a = F$, $b = T$). Third: if $z = T$ set $d = T$, else $d = F$.
- *$y = F$, $x = F$, $z = T$:* $\bar x = T$ so $a = b = F$; middle needs $c = T$; third: $c = T$, $\bar z = F$, so $d = F$.

In every case each $R$-clause has exactly one true literal.

*(⇒)* Given a satisfying assignment of $\varphi$, every clause has a true literal; extend it gadget by gadget using completeness (the fresh variables of different clauses are disjoint, so the choices do not interfere).

*(⇐)* Given an assignment satisfying $\psi$ in the 1-in-3 sense, restrict it to the original variables. By soundness, no clause of $\varphi$ has all three literals false, so $\varphi$ is satisfied.

Hence 3SAT $\le_P$ 1-in-3 SAT. ∎`
    },
    {
      id: 'np-nae3sat', type: 'written', title: 'Not-All-Equal 3SAT is NP-hard', difficulty: 3,
      prompt: String.raw`**NAE-3SAT:** given clauses of (at most) three literals, is there an assignment under which every clause has **at least one true and at least one false** literal? Prove NAE-3SAT is NP-hard by reducing from 3SAT in two steps:

(a) 3SAT $\le_P$ NAE-4SAT, by adding one global fresh variable $z$ to every clause.

(b) NAE-4SAT $\le_P$ NAE-3SAT, by replacing $\mathrm{NAE}(a, b, c, z)$ with $\mathrm{NAE}(a, b, s) \wedge \mathrm{NAE}(\bar s, c, z)$, with $s$ fresh per clause.`,
      rubric: [
        '(a ⇒) set z = F; each clause has a true literal among a, b, c and the false z',
        '(a ⇐) complementing an NAE assignment gives another NAE assignment; choose the one with z = F; then each clause has a true literal among a, b, c',
        '(b ⇒) case analysis choosing s (a = b vs a ≠ b; c = z vs c ≠ z)',
        '(b ⇐) if a = b = c = z = v, the first clause forces s = ¬v and then the second is NAE(v, v, v): contradiction',
        'Composition and polynomial time'
      ],
      hints: [
        'Flipping every variable maps NAE-satisfying assignments to NAE-satisfying assignments.',
        'For (b ⇒), choose s to "disagree" with a and b when they agree.'
      ],
      solution: String.raw`**(a)** Given a 3CNF $\varphi$ with clauses $(a \vee b \vee c)$, let $z$ be one new variable and output the NAE-4SAT instance with clauses $\mathrm{NAE}(a, b, c, z)$.

*(⇒)* If $\alpha$ satisfies $\varphi$, extend it with $z = F$. Each clause has some true literal among $a, b, c$, and $z$ is false: not all equal.

*(⇐)* If $\beta$ NAE-satisfies the instance, so does its complement $\bar\beta$ (flipping every variable flips every literal, and "not all equal" is preserved). One of $\beta, \bar\beta$ has $z = F$; call it $\gamma$. In each clause, not all four literals are false, and $z$ is false, so one of $a, b, c$ is true under $\gamma$. So $\gamma$ satisfies $\varphi$.

**(b)** Replace each $\mathrm{NAE}(a, b, c, z)$ by $\mathrm{NAE}(a, b, s) \wedge \mathrm{NAE}(\bar s, c, z)$ with a fresh $s$.

*(⇒)* Suppose $a, b, c, z$ are not all equal.
- If $a = b$: set $s = \bar a$, so the first clause holds. The second becomes $\mathrm{NAE}(a, c, z)$, which holds because not all of $a, b, c, z$ are equal and $a = b$, so $c$ or $z$ differs from $a$.
- If $a \ne b$: the first clause holds for any $s$. If $c \ne z$ the second holds for any $s$; if $c = z$, choose $s = c$, so $\bar s \ne c = z$.

*(⇐)* Suppose both new clauses hold but $a = b = c = z = v$. The first clause, $\mathrm{NAE}(v, v, s)$, forces $s = \bar v$, so $\bar s = v$, and the second is $\mathrm{NAE}(v, v, v)$: false. Contradiction.

Fresh variables of different clauses are disjoint, so the clause-by-clause arguments combine. Composing (a) and (b): 3SAT $\le_P$ NAE-3SAT, with linear-size output. ∎`
    },
    {
      id: 'np-sat-3occ', type: 'written', title: 'SAT where each variable appears at most three times', difficulty: 2,
      prompt: String.raw`Prove that CNF-SAT remains NP-hard when every variable occurs **at most three times** in the formula (counting both positive and negative occurrences) and every clause has at most three literals. Reduce from 3SAT.`,
      rubric: [
        'Construction: replace the k occurrences of x by fresh copies x_1..x_k; add the cyclic implication clauses (¬x_i ∨ x_{i+1}), indices mod k',
        'Occurrence count: each copy appears once in an original clause, once positively and once negatively in the cycle (3 total)',
        '(⇒) give every copy the value of x',
        '(⇐) the cycle of implications forces all copies equal; define x as their common value',
        'Polynomial size'
      ],
      hints: [
        'Give every occurrence its own private copy of the variable.',
        'How can 2-literal clauses force several variables to be equal?'
      ],
      solution: String.raw`**Construction.** Let $\varphi$ be a 3CNF formula. For each variable $x$ occurring $k$ times:
- if $k \le 3$, leave it alone;
- otherwise create fresh variables $x_1, \dots, x_k$, replace the $i$-th occurrence of $x$ (or of $\bar x$) by $x_i$ (respectively $\bar x_i$), and add the $k$ clauses $(\bar x_1 \vee x_2), (\bar x_2 \vee x_3), \dots, (\bar x_{k-1} \vee x_k), (\bar x_k \vee x_1)$.

Each copy $x_i$ now appears exactly three times: once in its original clause, once as $x_i$ in $(\bar x_{i-1} \vee x_i)$, and once as $\bar x_i$ in $(\bar x_i \vee x_{i+1})$. Clauses have at most three literals. The output has $O(m)$ clauses. Linear time.

*(⇒)* Given a satisfying assignment of $\varphi$, set every copy $x_i$ equal to $x$. Each original clause becomes the same clause with renamed variables, still satisfied; each cycle clause $(\bar x_i \vee x_{i+1})$ has $x_i = x_{i+1}$, so it is satisfied.

*(⇐)* Given a satisfying assignment of the new formula: the clause $(\bar x_i \vee x_{i+1})$ means $x_i \Rightarrow x_{i+1}$, so following the cycle, $x_1 \Rightarrow x_2 \Rightarrow \dots \Rightarrow x_k \Rightarrow x_1$. If any copy is true, all are true; so all copies are equal. Set $x$ to that common value; every original clause, with its copies replaced by $x$, has the same truth value as before, hence is satisfied.

So 3SAT $\le_P$ SAT with at most 3 occurrences per variable. ∎ (In contrast, if every variable appears at most **twice**, SAT is in P.)`
    },
    {
      id: 'np-partition', type: 'written', title: 'Partition is NP-hard', difficulty: 2,
      prompt: String.raw`**Partition:** given positive integers $b_1, \dots, b_r$, can they be split into two groups with equal sums? Prove Partition is NP-complete by a reduction from Subset Sum (given positive integers $a_1, \dots, a_n$ and a target $T$, is there a subset summing to exactly $T$?).`,
      rubric: [
        'In NP',
        'Construction: with S = Σ a_i, handle T > S separately; add the two numbers S + T and 2S − T',
        '(⇒) subset B summing to T gives B ∪ {2S − T} versus the rest, each 2S',
        '(⇐) the two new numbers sum to 3S > 2S so they are on different sides; the side containing 2S − T has exactly T from the original numbers',
        'Polynomial size: new numbers have O(log S) bits'
      ],
      hints: [
        'Add two "balancing" numbers that cannot be on the same side.',
        'If the total becomes 4S, each side must be 2S.'
      ],
      solution: String.raw`**In NP.** Certificate: the split; check the two sums.

**Construction.** Let $S = \sum_i a_i$. If $T > S$, no subset sums to $T$: output the fixed no-instance $\{1, 2\}$. Otherwise output the numbers $a_1, \dots, a_n, \; S + T, \; 2S - T$. All are positive ($2S - T \ge S > 0$). The new numbers have $O(\log S)$ bits, so the output size is linear in the input size.

The total is $S + (S + T) + (2S - T) = 4S$, so a valid partition has $2S$ on each side.

*(⇒)* If $B \subseteq \{a_i\}$ sums to $T$, put $B$ and $2S - T$ on one side: $T + 2S - T = 2S$. The other side has the rest of $A$ (sum $S - T$) and $S + T$: also $2S$.

*(⇐)* Suppose a partition into two sides of sum $2S$ exists. The two new numbers sum to $3S > 2S$, so they are on different sides. The side containing $2S - T$ must get exactly $2S - (2S - T) = T$ from the original numbers. Those original numbers form a subset summing to $T$.

Hence Subset Sum $\le_P$ Partition. ∎ (Partition, like Subset Sum, has a pseudo-polynomial DP in $O(rS)$ time, which is not polynomial in the bit-length.)`
    },
    {
      id: 'np-knapsack-scheduling', type: 'written', title: 'Knapsack and two-machine scheduling', difficulty: 2,
      prompt: String.raw`(a) **Knapsack (decision):** items with positive integer weights $w_i$ and values $v_i$, a capacity $W$ and a goal $V$: is there a set of items of total weight $\le W$ and total value $\ge V$? Prove it is NP-hard by a reduction from Subset Sum.

(b) **TwoMachines:** jobs with positive integer lengths $\ell_1, \dots, \ell_n$ and a deadline $D$: can the jobs be assigned to two identical machines so that each machine's total load is at most $D$? Prove it is NP-hard by a reduction from Partition.

(c) Knapsack has an $O(nW)$-time DP. Why is this not a proof that $\mathsf P = \mathsf{NP}$?`,
      rubric: [
        '(a) Items with weight = value = a_i, W = V = T; both directions (weight ≤ T and value ≥ T force sum = T)',
        '(b) Jobs = numbers, D = S/2 (odd S: fixed no-instance); both directions (loads ≤ S/2 summing to S must both equal S/2)',
        '(c) O(nW) is pseudo-polynomial: W has only log W bits in the input'
      ],
      hints: ['When weight equals value, "weight at most T" and "value at least T" squeeze the sum to exactly T.'],
      solution: String.raw`**(a)** Given Subset Sum $(a_1, \dots, a_n; T)$, create item $i$ with $w_i = v_i = a_i$, and set $W = V = T$. Linear time.
- *(⇒)* A subset summing to $T$ has weight $T \le W$ and value $T \ge V$.
- *(⇐)* A set of items with weight $\le T$ and value $\ge T$ has the same sum for both (weights equal values), so the sum is exactly $T$: a subset summing to $T$.

**(b)** Given Partition $(b_1, \dots, b_n)$ with $S = \sum b_i$: if $S$ is odd, output a fixed no-instance (one job of length 2 with $D = 1$). Otherwise create jobs $\ell_i = b_i$ and set $D = S/2$.
- *(⇒)* A partition into two halves of sum $S/2$ gives the two machine loads.
- *(⇐)* Two loads, each at most $S/2$, add up to $S$, so both are exactly $S/2$: the assignment is a partition.

**(c)** The input encodes $W$ in $O(\log W)$ bits, so $O(nW)$ can be exponential in the input length: it is a **pseudo-polynomial** algorithm. Our reduction from Subset Sum (whose hardness comes from 3SAT) produces capacities with polynomially many *bits* but exponentially large *values*, so the DP does not run in polynomial time on them.`
    },
    {
      id: 'np-steiner', type: 'written', title: 'Steiner Tree is NP-hard', difficulty: 3,
      prompt: String.raw`**Steiner Tree:** given an undirected graph $H$, a set $R$ of *terminal* vertices, and an integer $b$, is there a tree in $H$ with at most $b$ edges that contains every terminal (it may also use non-terminal vertices)? Prove it is NP-hard by a reduction from Set Cover (universe $U$, sets $S_1, \dots, S_m$, budget $k$).`,
      rubric: [
        'Construction: root r adjacent to a vertex for each set; each set-vertex adjacent to the element-vertices it contains; terminals = r and all elements; b = k + |U|',
        '(⇒) k chosen sets: k root edges plus one edge per element to a chosen set containing it; it is a tree',
        '(⇐) a tree containing the terminals with j set-vertices has j + |U| edges, so j ≤ k; each element\'s tree neighbor is a set-vertex containing it, so these sets cover U',
        'Polynomial size; trivial cases (U empty)'
      ],
      hints: [
        'Make the elements the terminals. They should only be reachable through set-vertices.',
        'Count vertices: a tree on N vertices has N − 1 edges.'
      ],
      solution: String.raw`**Construction.** Given $(U, S_1, \dots, S_m, k)$ with $U \ne \emptyset$ (if $U = \emptyset$, output a single terminal with $b = 0$, a yes-instance), build $H$ with:
- a root vertex $r$;
- a vertex $s_j$ for each set $S_j$, with edge $r s_j$;
- a vertex $u$ for each element $u \in U$, with edge $s_j u$ whenever $u \in S_j$.

Terminals $R = \{r\} \cup U$; budget $b = k + |U|$. Size $O(m + |U| + \sum_j |S_j|)$.

*(⇒)* Let $S_{j_1}, \dots, S_{j_k}$ cover $U$ (if fewer than $k$ sets suffice, use those). Take the edges $r s_{j_1}, \dots, r s_{j_k}$, and for each element $u$ one edge $s_{j_i} u$ to a chosen set containing it. This subgraph is connected (everything hangs from $r$ through chosen set-vertices), has $1 + k + |U|$ vertices and $k + |U|$ edges, so it is a tree containing all terminals, with at most $b$ edges.

*(⇐)* Let $T$ be a tree in $H$ containing all terminals with at most $b$ edges. Let $J$ be the set-vertices in $T$. Its vertices are $r$, all of $U$, and $J$, so it has $1 + |U| + |J|$ vertices and hence $|U| + |J|$ edges. From $|U| + |J| \le k + |U|$ we get $|J| \le k$. Each element vertex $u$ lies in $T$, which has at least two vertices and is connected, so $u$ has a neighbor in $T$; all neighbors of $u$ in $H$ are set-vertices $s_j$ with $u \in S_j$. Hence the sets in $J$ cover $U$, using at most $k$ sets.

Therefore Set Cover $\le_P$ Steiner Tree (even with unit edge weights). ∎`
    },
    {
      id: 'np-maxcut', type: 'written', title: 'Max-Cut is NP-hard (from NAE-3SAT)', difficulty: 3,
      prompt: String.raw`**MaxCut:** given a graph with positive integer edge weights and a number $K$, is there a partition of the vertices into two sides $(A, B)$ such that the total weight of edges with one endpoint on each side is at least $K$?

Prove MaxCut is NP-hard by a reduction from NAE-3SAT. You may assume each NAE clause has exactly three literals on three **distinct** variables. (Parallel edges may be merged by adding their weights.)`,
      rubric: [
        'Construction: vertex per literal; edge x–¬x of weight 1 per variable; a triangle on the three literal vertices of each clause (weights add up for repeated pairs); K = n + 2m',
        'Key fact: a triangle has 0 or 2 edges cut; exactly 2 iff its vertices are not all on one side',
        '(⇒) side A = true literals; all variable edges cut; each clause triangle has 2 cut edges',
        '(⇐) cut weight ≥ n + 2m forces all variable edges cut and every triangle contributing 2; read off assignment from side A',
        'Polynomial size'
      ],
      hints: [
        'Put each literal and its negation on opposite sides: side A means "true".',
        'How many edges of a triangle can a cut contain?'
      ],
      solution: String.raw`**Construction.** Let the NAE-3SAT instance have variables $x_1, \dots, x_n$ and clauses $C_1, \dots, C_m$. Create a vertex for each of the $2n$ literals. Add an edge $x_i \bar x_i$ of weight 1 for each variable (the *variable edges*). For each clause $\mathrm{NAE}(\ell_1, \ell_2, \ell_3)$, add the three edges of the triangle $\ell_1 \ell_2 \ell_3$, each of weight 1 (if a pair already has an edge, add 1 to its weight). Since a clause uses three distinct variables, triangle edges never join $x$ to $\bar x$. Set $K = n + 2m$. Polynomial size.

**Accounting.** The cut weight equals (number of variable edges cut) plus, for each clause, (number of its triangle's edges cut). A cut separates either 0 or 2 edges of a triangle: 0 if all three vertices are on one side, 2 otherwise. So the cut weight is at most $n + 2m$, with equality iff every variable edge is cut **and** every clause triangle has its vertices on both sides.

*(⇒)* Given an NAE assignment, put true literals in $A$ and false literals in $B$. Each $x_i$, $\bar x_i$ pair is split: $n$. Each clause has a true and a false literal, so its triangle has vertices on both sides: 2 each. Total $n + 2m = K$.

*(⇐)* Given a cut of weight $\ge K = n + 2m$, by the accounting the cut weight is exactly $n + 2m$, so every variable edge is cut and every triangle is split. Set a literal true iff its vertex is in $A$; this is consistent because $x_i$ and $\bar x_i$ are on opposite sides. Each clause's three literal vertices are not all on one side, i.e., not all equal in value: the clause is NAE-satisfied.

So NAE-3SAT $\le_P$ MaxCut. ∎ (The distinct-variables assumption is harmless: in the 3SAT → NAE-3SAT reduction, start from 3SAT clauses on three distinct variables, which can be arranged by deleting clauses containing both $x$ and $\bar x$ and padding clauses with repeated variables using fresh variables, e.g. $(x \vee y)$ becomes $(x \vee y \vee p) \wedge (x \vee y \vee \bar p)$. MaxCut is in fact NP-hard even for unweighted simple graphs, though that needs more work.)`
    },
    {
      id: 'np-membership', type: 'written', title: 'Showing membership in NP (and when you can\'t)', difficulty: 2,
      prompt: String.raw`For each problem, either show it is in NP (certificate, its size, a polynomial-time verifier), or explain why the obvious approach fails.

(a) Independent Set: given $(G, k)$, is there an independent set of size $k$?

(b) Composite: given an integer $N$ written in binary, is $N$ composite?

(c) Subset Sum: given $n$ integers of at most $b$ bits each and a target $T$.

(d) Non-3-Colorability: given $G$, is $G$ **not** 3-colorable?

(e) ExactVC: given $(G, k)$, is the **minimum** vertex cover of $G$ of size **exactly** $k$?`,
      rubric: [
        '(a) Certificate S (O(k log n) bits); check size and all pairs',
        '(b) Certificate: a divisor d with 1 < d < N (O(log N) bits); one division in time polynomial in log N; note trial division is exponential',
        '(c) Certificate: indicator vector (n bits); sum in O(nb) time',
        '(d) In co-NP; a certificate would have to rule out all 3^n colorings; not known to be in NP',
        '(e) A cover of size k shows "≤ k", but showing no cover of size k − 1 exists is a co-NP-type condition; not known to be in NP'
      ],
      hints: ['Count the certificate length in bits, and make sure the verifier only checks.'],
      solution: String.raw`**(a) In NP.** Certificate: the set $S$, i.e., $k$ vertex names of $O(\log n)$ bits each. Verifier: check $|S| = k$, the names are distinct, and no pair in $S$ is an edge: $O(k^2)$ adjacency tests. Yes-instances have such an $S$; for no-instances every candidate set fails.

**(b) In NP.** Certificate: an integer $d$ with $1 < d < N$, of at most $\log_2 N + 1$ bits. Verifier: check the range and that $N \bmod d = 0$ by long division in $O(\log^2 N)$ bit operations, polynomial in the input length $\log N$. (Trial division over all $d \le \sqrt N$ is *exponential* in the number of bits. Composite is in fact in P, by the AKS primality test, but that is much harder.)

**(c) In NP.** Certificate: a bit vector $c \in \{0, 1\}^n$ selecting the subset. Verifier: add the selected numbers, each of $b$ bits, and compare with $T$: $O(n(b + \log n))$ bit operations.

**(d) Not known to be in NP.** A yes-answer means *no* coloring works. The obvious certificate would be a list of all $3^n$ colorings with a violated edge for each: exponential length. The problem is the complement of 3-Coloring, so it is in co-NP (and co-NP-complete). It is in NP only if $\mathsf{NP} = \mathsf{co\text{-}NP}$.

**(e) Not known to be in NP.** A cover of size $k$ certifies "minimum $\le k$", but "minimum $\ge k$" means *no* cover of size $k - 1$ exists, which is a co-NP-type statement. ExactVC combines an NP condition with a co-NP condition and is not believed to be in NP or co-NP.`
    },
    {
      id: 'np-whats-wrong-2', type: 'written', title: 'What is wrong with these reductions?', difficulty: 2,
      prompt: String.raw`Each argument below is flawed. Identify the flaw precisely, and where possible give a counterexample or a fix.

(a) "Hamiltonian Path is NP-hard: given $G$, pick any vertex $v$ and output $G - v$. If $G$ has a Hamiltonian cycle, deleting $v$ from it leaves a Hamiltonian path of $G - v$."

(b) "3-Coloring is NP-hard: I give a polynomial-time algorithm that converts any graph $G$ into a 3CNF formula $\varphi_G$ (with variables $x_{v,c}$ meaning $v$ gets color $c$) that is satisfiable iff $G$ is 3-colorable."

(c) "(⇐) direction of 3SAT → IS: take the independent set we built in the (⇒) direction from the satisfying assignment, and read the assignment back off."

(d) "Subset Sum is NP-hard by the standard 3SAT reduction, but to keep the arithmetic simple I write every number in unary."

(e) "Problem $X$ reduces to Knapsack in polynomial time, and Knapsack has an $O(nW)$ algorithm, so $X \in \mathsf P$."

(f) "$X$ is NP-hard because 2-Coloring is a special case of $X$."`,
      rubric: [
        '(a) (⇐) fails: G − v may have a Hamiltonian path whose endpoints are not both adjacent to v; concrete counterexample; fix with copy-and-pendant construction',
        '(b) Wrong direction: shows 3-Coloring ≤ 3SAT (membership in NP), not hardness',
        '(c) Circular: (⇐) must start from an arbitrary independent set of size m',
        '(d) Unary numbers have exponential length, so the reduction is not polynomial (and unary Subset Sum is in P)',
        '(e) O(nW) is pseudo-polynomial; only valid if the produced W is polynomially bounded',
        '(f) A special case being easy (or being any particular problem) says nothing; you need a HARD problem that reduces to X'
      ],
      hints: ['For each one ask: direction? polynomial size? both directions? arbitrary solution? known-hard source?'],
      solution: String.raw`**(a) (⇐) fails.** $G - v$ may have a Hamiltonian path whose endpoints are not both neighbors of $v$, so it does not close into a cycle through $v$. Counterexample: $G$ = path $a - b - c$ plus a vertex $v$ adjacent only to $a$. $G$ has no Hamiltonian cycle ($v$ has degree 1), but $G - v$ is the path $a, b, c$, which is Hamiltonian. *Fix:* the lesson's construction with a copy $v'$ of $v$ and pendant vertices $s$, $t$.

**(b) Wrong direction.** This shows 3-Coloring $\le_P$ 3SAT, so 3-Coloring is *no harder* than 3SAT (in particular it is in NP). Hardness needs 3SAT $\le_P$ 3-Coloring.

**(c) Circular reasoning.** In (⇐) we may not assume the independent set came from a satisfying assignment; that is what we are trying to prove. We must start from an **arbitrary** independent set of size $m$, argue it has exactly one vertex per triangle and no complementary pair, and then build an assignment.

**(d) Exponential size.** The reduction's numbers have $n + m$ digits, so their values are about $10^{n+m}$; in unary they need exponentially many symbols, so the reduction does not run in polynomial time. (Indeed Subset Sum with unary numbers is in P by the $O(nT)$ DP, so it cannot be NP-hard unless $\mathsf P = \mathsf{NP}$.)

**(e) Pseudo-polynomial confusion.** $O(nW)$ is polynomial in the *value* $W$, not in its bit-length. The conclusion holds only if the reduction always produces instances whose $W$ is bounded by a polynomial in the size of the original input.

**(f) Wrong logic.** Containing an easy problem as a special case proves nothing about hardness (every problem "generalizes" trivial problems). One needs a known **NP-hard** problem $Y$ with $Y \le_P X$; for example, if 3-Coloring were a special case of $X$, that would suffice.`
    }
  ]
});
