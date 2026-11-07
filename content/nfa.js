CS374.topic({
  id: 'nfa',
  unit: 'models',
  order: 4,
  title: 'Nondeterminism: NFAs & Conversions',
  summary: 'NFAs and epsilon-transitions, how to design by guessing, Thompson\'s construction (regex to NFA), the incremental subset construction (NFA to DFA), the exponential blowup, and state elimination (DFA/NFA to regex): Kleene\'s theorem end to end.',
  objectives: [
    'Define NFAs formally, including epsilon-reach and acceptance',
    'Design small NFAs using the guess-and-verify idea',
    'Convert a regular expression to an NFA with Thompson\'s construction',
    'Convert an NFA to a DFA with the incremental subset construction (reachable subsets only)',
    'Explain why some NFAs need exponentially larger DFAs',
    'Convert an automaton to a regular expression by state elimination',
  ],

  lesson: String.raw`## Nondeterminism

A **nondeterministic finite automaton** may have zero, one, or several possible moves from a state on a symbol, and may also move on the empty string $\varepsilon$ without reading anything. It accepts a string if **some** sequence of choices leads to an accepting state after reading the whole input.

Two equally valid mental models:

- **Guessing.** The machine magically guesses the right choice at each step; it accepts iff some guess sequence works. (When designing, think "guess, then verify".)
- **Parallel threads.** The machine runs every choice simultaneously, keeping the *set* of states it could be in. It accepts iff, at the end, this set contains an accepting state. This is exactly what the subset construction formalizes.

> **Definition.** An NFA is a 5-tuple $N = (Q, \Sigma, \delta, s, A)$ where $Q$, $\Sigma$, $s$, $A$ are as in a DFA and
> $$\delta : Q \times (\Sigma \cup \{\varepsilon\}) \to 2^Q$$
> returns a **set** of states (possibly empty).

### $\varepsilon$-reach

The **$\varepsilon$-reach** of a state $q$, written $\varepsilon\text{-reach}(q)$, is the set of states reachable from $q$ using only $\varepsilon$-transitions (including $q$ itself, via zero of them). For a set $S$, $\varepsilon\text{-reach}(S) = \bigcup_{q \in S} \varepsilon\text{-reach}(q)$. It is computed by graph search (DFS/BFS) over $\varepsilon$-edges.

### Extended transition function and acceptance

$$\delta^*(q, \varepsilon) = \varepsilon\text{-reach}(q), \qquad \delta^*(q, a x) = \bigcup_{r \in \varepsilon\text{-reach}(q)} \ \bigcup_{p \in \delta(r, a)} \delta^*(p, x).$$

In words: first follow any $\varepsilon$-moves, then read $a$, then continue on $x$ from any resulting state. $N$ **accepts** $w$ iff $\delta^*(s, w) \cap A \neq \varnothing$.

> **Warning.** "Some run accepts" is not symmetric with "some run rejects". A string is rejected only if **every** run fails (gets stuck or ends in a non-accepting state). This is why swapping accepting states does **not** complement an NFA.

### The path view of $\delta^*$

The recursive definition above is precise but clumsy to reason with. An equivalent and much friendlier description: $q \in \delta^*(p, w)$ **iff there is a walk in the state diagram from $p$ to $q$ whose edge labels, read in order and with every $\varepsilon$ erased, spell exactly $w$.** Such a walk may use any number of $\varepsilon$-edges anywhere, including before the first symbol and after the last one.

The path view immediately gives a *left-to-right* rule that the subset construction is built on:
$$\delta^*(s, xa) = \varepsilon\text{-reach}\Big(\bigcup_{r \in \delta^*(s, x)} \delta(r, a)\Big).$$
*Why:* in a walk spelling $xa$, look at the last edge labeled $a$, say $r \xrightarrow{a} p$. The part of the walk before it spells $x$, so $r \in \delta^*(s, x)$; the part after it uses only $\varepsilon$-edges, so the endpoint lies in $\varepsilon\text{-reach}(p)$. Conversely, any such $r$, $p$ and $\varepsilon$-tail glue together into a walk spelling $xa$.

> **Key idea.** "The set of states the NFA can be in after reading $x$" is the single most useful object in this whole topic. The subset construction turns it into a DFA state, the correctness proofs are inductions about it, and NFA design is about making sure that set contains an accepting state exactly when it should.

## Designing NFAs: guess and verify

NFAs shine when membership hinges on *where* something happens.

**Third symbol from the end is 1.** Loop in the start state reading anything; at some point *guess* "this 1 is the third from the end" and move into a chain that checks there are exactly two more symbols:

~~~automaton
alphabet: 01
start: q0
accept: q3
q0 0 -> q0
q0 1 -> q0, q1
q1 0,1 -> q2
q2 0,1 -> q3
~~~

If the guess was premature or late, that thread dies or ends in the wrong state, which is harmless — only one thread needs to succeed. Four states, versus eight for the smallest DFA.

**Unions with $\varepsilon$.** For $(01)^* \cup (010)^*$, start with $\varepsilon$-moves into two separate loops, guessing which pattern the string follows:

~~~automaton
alphabet: 01
start: s
accept: a0, b0
s eps -> a0, b0
a0 0 -> a1
a1 1 -> a0
b0 0 -> b1
b1 1 -> b2
b2 0 -> b0
~~~

**Pattern: "contains $x$"** — loop on everything, guess where $x$ starts, read $x$ along a chain, then loop on everything in the accepting state. No failure transitions to compute, unlike the KMP-style DFA.

**Pattern: "some condition about a symbol that appears later"** — e.g. "the last symbol appeared earlier in the string": guess the earlier occurrence, remember which symbol it was in the state, and accept if the input ends right after reading the same symbol again.

> **Key idea.** Design an NFA by asking: *what single guess, if made correctly, would turn the problem into an easy local check?* Then build a separate branch for each possible guess.

### A catalogue of guessing patterns

| Language shape | What to guess | Shape of the NFA |
|---|---|---|
| $k$-th symbol from the end is $a$ | which $a$ is the one | start loop, then a chain of $k$ states, last one accepting with no exits |
| contains $x$ | where $x$ starts | start loop, chain spelling $x$, accepting loop |
| contains $x$ **and** $y$ | which occurs first, and where | two branches: find $x$ then $y$, or $y$ then $x$ |
| two symbols at distance $d$ (or distance $\equiv r \bmod d$) | the first position | chain of length $d$ (or a $d$-cycle) |
| some maximal block has property $P$ | where the block starts | may enter only at the start or right after a different symbol; check $P$; leave on a different symbol or at the end |
| $L_1 \cup L_2 \cup \cdots$ | which piece | $\varepsilon$-fork into one machine per piece |
| some symbol is missing / appears oddly often | which symbol | one branch per symbol |
| last symbol (or last $k$ symbols) appeared before | the earlier occurrence | remember the guessed symbols in the state |

Two sanity checks for every guessing NFA: (1) *completeness* — if the string is in the language, is there a sequence of guesses that reaches acceptance? (2) *soundness* — if the NFA accepts, did the accepting thread really verify everything? Bugs almost always break soundness: an accepting state that keeps looping when the guess required the string to end, or a branch that can be entered in the middle of a block.

**Try it first.** Design an NFA for the binary strings in which some 1 sits in an **odd** position counting from the end (the last symbol is position 1 from the end, the one before it is position 2, and so on). Examples: $1$, $100$, $0110$ are in; $10$, $1000$, $0$ are out.

~~~~reveal Solution: guess the 1, then verify an even number of symbols follow
Guess the 1; after it, an **even** number of symbols must follow. Count the remaining symbols mod 2 in a 2-cycle whose "even" state is accepting:

~~~automaton
alphabet: 01
start: q0
accept: f
q0 0 -> q0
q0 1 -> q0, f
f 0,1 -> g
g 0,1 -> f
~~~

State $f$ means "the guessed 1 has an even number of symbols after it so far", $g$ means "odd". Completeness: if position $k$ from the end is a 1 with $k$ odd, stay in $q_0$ until that 1, jump to $f$, and the remaining $k - 1$ (even) symbols bring the thread back to $f$. Soundness: a thread in $f$ at the end jumped on a 1 followed by an even number of symbols. Three states. The subset construction for this NFA is worked out step by step below.
~~~~

**Try it first.** Design an NFA for the binary strings whose length is **not** divisible by 6. (Hint: what is a simpler way to say "not divisible by 6"?)

~~~~reveal Solution: an epsilon-fork into a 2-cycle and a 3-cycle
$6 \nmid n$ iff $2 \nmid n$ **or** $3 \nmid n$. So fork with $\varepsilon$ into a length counter mod 2 that accepts odd lengths, and a counter mod 3 that accepts lengths $\not\equiv 0$:

~~~automaton
alphabet: 01
start: s
accept: e1, t1, t2
s eps -> e0, t0
e0 0,1 -> e1
e1 0,1 -> e0
t0 0,1 -> t1
t1 0,1 -> t2
t2 0,1 -> t0
~~~

The tempting wrong answer is "length not divisible by 2 **and** not divisible by 3" — that is the complement of the union, not what was asked. Note that the dual language "divisible by 6" ($= $ divisible by 2 **and** by 3) has no such cheap union decomposition; there you would use a product (or just a 6-cycle).
~~~~

## Thompson's construction: regex $\to$ NFA

By induction on the regex we build an NFA with **one start state and one accepting state**, with no transitions into the start state and none out of the accepting state.

- $\varnothing$: start and accept states, no transitions.
- $\varepsilon$: start $\xrightarrow{\varepsilon}$ accept.
- $a$: start $\xrightarrow{a}$ accept.
- $r + s$: new start with $\varepsilon$-moves to the starts of $N_r$ and $N_s$; $\varepsilon$-moves from their accepting states to a new accept.
- $rs$: $\varepsilon$-move from the accept of $N_r$ to the start of $N_s$.
- $r^*$: new start $\xrightarrow{\varepsilon}$ new accept (zero copies), new start $\xrightarrow{\varepsilon}$ start of $N_r$, accept of $N_r$ $\xrightarrow{\varepsilon}$ start of $N_r$ (repeat), accept of $N_r$ $\xrightarrow{\varepsilon}$ new accept.

Each operator adds at most two states, so the NFA has $O(|r|)$ states and transitions. Correctness is a straightforward induction on $r$ mirroring the definition of $L(r)$.

> **Warning.** A tempting "shortcut" for $r^*$ — make the start state of $N_r$ accepting and add an $\varepsilon$-loop back from its accept — is **wrong** in general when the start state has incoming transitions, because then you can accept partial passes through $N_r$. Thompson's fresh start and accept states avoid this. In practice, hand-built NFAs are usually smaller, but on exams state which construction you use.

### Why Thompson's construction is correct

> **Theorem.** For every regular expression $r$, Thompson's NFA $N_r$ satisfies $L(N_r) = L(r)$. Moreover $N_r$ has one start state $s_r$ with no incoming edges, one accepting state $f_r$ with no outgoing edges, and at most $2|r|$ states.

*Proof (structural induction on $r$).* Use the path view: $w \in L(N_r)$ iff some walk from $s_r$ to $f_r$ spells $w$. The base cases $\varnothing$, $\varepsilon$, $a$ are checked by inspection. For the inductive cases assume the claim for the sub-expressions.

- **$r = r_1 + r_2$.** A walk from the new start to the new accept must take one of the two $\varepsilon$-edges into $N_{r_1}$ or $N_{r_2}$; because the machines share no states and $f_{r_i}$ has no outgoing edges except the new $\varepsilon$-edge to the new accept, it then stays inside that machine until it leaves through $f_{r_i}$. So it spells a string of $L(r_1)$ or of $L(r_2)$, and every such string is spelled by such a walk.
- **$r = r_1 r_2$.** Every walk from $s_{r_1}$ to $f_{r_2}$ crosses the single bridge $f_{r_1} \xrightarrow{\varepsilon} s_{r_2}$ exactly once (there is no way back, since $s_{r_2}$ has no other incoming edges and $f_{r_1}$ no other outgoing ones). The part before spells some $x \in L(r_1)$, the part after some $y \in L(r_2)$.
- **$r = r_1^*$.** A walk from the new start to the new accept either takes the skip edge (spelling $\varepsilon$), or enters $N_{r_1}$ and passes through it $k \ge 1$ times, each pass going from $s_{r_1}$ to $f_{r_1}$ and spelling a string of $L(r_1)$, separated by the loop-back edge. So it spells an element of $L(r_1)^k$, and conversely.

The "no edges into the start / out of the accept" invariant is exactly what makes "a walk stays inside a sub-machine between its entry and exit" true. That invariant is what the buggy star shortcut breaks. $\blacksquare$

**Try it first.** Build Thompson's NFA for $(0+1)^*1$. How many states does it have? Compute $\varepsilon\text{-reach}$ of its start state.

~~~~reveal Solution: 10 states
Build bottom-up. $N_0$: $c_0 \xrightarrow{0} d_0$. $N_1$: $c_1 \xrightarrow{1} d_1$. Union: new $u \xrightarrow{\varepsilon} c_0, c_1$ and $d_0, d_1 \xrightarrow{\varepsilon} v$ (6 states). Star: new $x \xrightarrow{\varepsilon} u$, $x \xrightarrow{\varepsilon} y$, $v \xrightarrow{\varepsilon} u$, $v \xrightarrow{\varepsilon} y$ (8 states). Final $1$: $c_2 \xrightarrow{1} d_2$, joined by $y \xrightarrow{\varepsilon} c_2$ (10 states). Start $x$, accept $d_2$.

~~~automaton
alphabet: 01
start: x
accept: d2
x eps -> u, y
u eps -> c0, c1
c0 0 -> d0
c1 1 -> d1
d0 eps -> v
d1 eps -> v
v eps -> u, y
y eps -> c2
c2 1 -> d2
~~~

$\varepsilon\text{-reach}(x) = \{x, u, y, c_0, c_1, c_2\}$: from $x$ we reach $u$ and $y$, from $u$ the two leaf starts, from $y$ the start of the final $1$. Running the subset construction on this machine yields just 3 subsets, and the DFA accepts exactly the strings ending in 1 — Thompson machines are big but determinize to small DFAs when the language is simple.
~~~~

## The incremental subset construction: NFA $\to$ DFA

The DFA simulates all threads at once: a DFA state is a **set** of NFA states.

- Start state: $S_0 = \varepsilon\text{-reach}(s)$ (not just $\{s\}$!).
- Transition: $\delta'(S, a) = \varepsilon\text{-reach}\big(\bigcup_{q \in S} \delta(q, a)\big)$.
- Accepting: every $S$ with $S \cap A \neq \varnothing$.

Formally the DFA has state set $2^Q$, but we only build subsets **reachable** from $S_0$: keep a worklist, start with $S_0$, and for each new subset compute its transitions on every symbol, adding any subset not seen before. The empty set $\varnothing$ may appear; it is a dead state.

> **Theorem.** For every NFA $N$ there is a DFA $D$ with $L(D) = L(N)$; if $N$ has $n$ states, $D$ has at most $2^n$ states.

### Worked example: $(01 + 010)^*$

A small NFA $N$: start $s$ (accepting); $s \xrightarrow{0} a$; $a \xrightarrow{1} s$ and $a \xrightarrow{1} b$; $b \xrightarrow{0} s$. (From $a$, reading $1$ either finishes a $01$ block, returning to $s$, or continues toward $010$.)

| DFA state | on 0 | on 1 | accept? |
|---|---|---|---|
| $\{s\}$ | $\{a\}$ | $\varnothing$ | yes |
| $\{a\}$ | $\varnothing$ | $\{s, b\}$ | no |
| $\{s, b\}$ | $\{a, s\}$ | $\varnothing$ | yes |
| $\{a, s\}$ | $\{a\}$ | $\{s, b\}$ | yes |
| $\varnothing$ | $\varnothing$ | $\varnothing$ | no |

Five reachable subsets out of $2^3 = 8$. The resulting DFA (dead state implicit):

~~~automaton
alphabet: 01
start: S
accept: S, SB, AS
S 0 -> A
A 1 -> SB
SB 0 -> AS
AS 0 -> A
AS 1 -> SB
~~~

### Worked example with $\varepsilon$-moves: $(01)^* \cup (010)^*$

Use the $\varepsilon$-NFA from the design section: $s \xrightarrow{\varepsilon} a_0, b_0$; loop $a_0 \xrightarrow{0} a_1 \xrightarrow{1} a_0$; loop $b_0 \xrightarrow{0} b_1 \xrightarrow{1} b_2 \xrightarrow{0} b_0$; accepting $a_0, b_0$. The only $\varepsilon$-moves leave $s$, so after the first step every $\varepsilon$-reach is trivial — but the **start** subset is $\varepsilon\text{-reach}(s) = \{s, a_0, b_0\}$.

| DFA state | on 0 | on 1 | accept? |
|---|---|---|---|
| $\{s, a_0, b_0\}$ | $\{a_1, b_1\}$ | $\varnothing$ | yes |
| $\{a_1, b_1\}$ | $\varnothing$ | $\{a_0, b_2\}$ | no |
| $\{a_0, b_2\}$ | $\{a_1, b_0\}$ | $\varnothing$ | yes |
| $\{a_1, b_0\}$ | $\{b_1\}$ | $\{a_0\}$ | yes |
| $\{a_0\}$ | $\{a_1\}$ | $\varnothing$ | yes |
| $\{a_1\}$ | $\varnothing$ | $\{a_0\}$ | no |
| $\{b_1\}$ | $\varnothing$ | $\{b_2\}$ | no |
| $\{b_2\}$ | $\{b_0\}$ | $\varnothing$ | no |
| $\{b_0\}$ | $\{b_1\}$ | $\varnothing$ | yes |
| $\varnothing$ | $\varnothing$ | $\varnothing$ | no |

Read the table as a story. During the first three symbols ($0$, $01$, $010$) both patterns are still possible, so the DFA tracks both threads: $\{a_1, b_1\}$, $\{a_0, b_2\}$, $\{a_1, b_0\}$. The fourth symbol decides. After $010$, reading 1 (giving $0101$) kills the $(010)^*$ thread because $b_0$ has no 1-move, leaving $\{a_0\}$; reading 0 (giving $0100$) kills the $(01)^*$ thread because $a_1$ has no 0-move, leaving $\{b_1\}$. From then on the DFA follows a single loop. Ten reachable subsets out of $2^6 = 64$.

~~~automaton
alphabet: 01
start: SAB
accept: SAB, A0B2, A1B0, A0, B0
SAB 0 -> A1B1
A1B1 1 -> A0B2
A0B2 0 -> A1B0
A1B0 0 -> B1
A1B0 1 -> A0
A0 0 -> A1
A1 1 -> A0
B1 1 -> B2
B2 0 -> B0
B0 0 -> B1
~~~

> **Exam tip.** Present the subset construction as a table, one row per *reachable* subset, computed in worklist order. Always compute $\varepsilon$-reach after every move, mark accepting rows, and include the $\varnothing$ row if it is reachable.

### Step by step: determinizing the "odd position from the end" NFA

~~~steps Incremental subset construction for the 3-state NFA (q0 loops on 0,1; q0 on 1 also goes to f; f and g swap on every symbol; f accepting)
**Start.** There are no $\varepsilon$-edges, so the start subset is $\varepsilon\text{-reach}(q_0) = \{q_0\}$. Worklist: $\{q_0\}$. It does not contain $f$, so it is rejecting.
+++
**Process $\{q_0\}$.** On 0: $q_0 \to q_0$, giving $\{q_0\}$ (already known). On 1: $q_0 \to \{q_0, f\}$. New subset $\{q_0, f\}$; add it to the worklist. It contains $f$, so it is accepting.
+++
**Process $\{q_0, f\}$.** On 0: $q_0 \to q_0$ and $f \to g$, giving $\{q_0, g\}$ (new, rejecting). On 1: $q_0 \to q_0, f$ and $f \to g$, giving $\{q_0, f, g\}$ (new, accepting).
+++
**Process $\{q_0, g\}$.** On 0: $q_0 \to q_0$, $g \to f$: $\{q_0, f\}$ (known). On 1: $q_0 \to q_0, f$ and $g \to f$: $\{q_0, f\}$ again (known).
+++
**Process $\{q_0, f, g\}$.** On 0: $\{q_0\} \cup \{g\} \cup \{f\} = \{q_0, f, g\}$. On 1: $\{q_0, f\} \cup \{g\} \cup \{f\} = \{q_0, f, g\}$. Both known. The worklist is empty, so we are done: **4 reachable subsets** out of $2^3 = 8$, and $\varnothing$ is not reachable (the thread in $q_0$ never dies).
+++
**Read off the DFA and interpret it.**

| subset | 0 | 1 | accept? |
|---|---|---|---|
| $\{q_0\}$ | $\{q_0\}$ | $\{q_0,f\}$ | no |
| $\{q_0,f\}$ | $\{q_0,g\}$ | $\{q_0,f,g\}$ | yes |
| $\{q_0,g\}$ | $\{q_0,f\}$ | $\{q_0,f\}$ | no |
| $\{q_0,f,g\}$ | $\{q_0,f,g\}$ | $\{q_0,f,g\}$ | yes |

Meaning: $f$ in the subset = "some 1 is at an odd position from the current end"; $g$ = "some 1 is at an even position". Once the string has 1s at both parities, every future string is accepted (the trap state $\{q_0, f, g\}$). This is exactly the information a DFA must remember, and the subset construction discovered it mechanically.
~~~

**Try it first.** Run the incremental subset construction on this $\varepsilon$-NFA, then describe its language in English.

~~~automaton
alphabet: 01
start: s
accept: f
s eps -> a
a 1 -> a
a 0 -> b
b eps -> s
b 1 -> f
f eps -> a
~~~

~~~~reveal Solution: 4 subsets; the language is "ends in 01"
$\varepsilon$-reaches: $\varepsilon\text{-reach}(s) = \{s, a\}$, $\varepsilon\text{-reach}(b) = \{b, s, a\}$, $\varepsilon\text{-reach}(f) = \{f, a\}$, $\varepsilon\text{-reach}(a) = \{a\}$.

| subset | 0 | 1 | accept? |
|---|---|---|---|
| $\{s,a\}$ | $\{a,b,s\}$ | $\{a\}$ | no |
| $\{a,b,s\}$ | $\{a,b,s\}$ | $\{a,f\}$ | no |
| $\{a\}$ | $\{a,b,s\}$ | $\{a\}$ | no |
| $\{a,f\}$ | $\{a,b,s\}$ | $\{a\}$ | yes |

For example, from $\{a, b, s\}$ on 1: $a \to a$, $b \to f$, $s$ has no 1-edge; so the raw set is $\{a, f\}$ and its $\varepsilon$-reach is $\{a, f\}$. From $\{a\}$ on 0: raw set $\{b\}$, whose $\varepsilon$-reach is $\{a, b, s\}$ — forgetting this closure is the most common error.

~~~automaton
alphabet: 01
start: SA
accept: AF
SA 0 -> ABS
SA 1 -> A
ABS 0 -> ABS
ABS 1 -> AF
A 0 -> ABS
A 1 -> A
AF 0 -> ABS
AF 1 -> A
~~~

The DFA accepts iff the last two symbols are $01$. Notice that $\{s, a\}$ and $\{a\}$ behave identically: the subset construction gives a correct DFA, **not necessarily a minimal one**.
~~~~

### Proof that the subset construction is correct

Let $N = (Q, \Sigma, \delta, s, A)$ and let $D$ be the subset DFA with start $S_0 = \varepsilon\text{-reach}(s)$, transition $\delta'(S, a) = \varepsilon\text{-reach}\big(\bigcup_{q \in S}\delta(q,a)\big)$ and accepting subsets $\{S : S \cap A \ne \varnothing\}$.

> **Lemma.** For every string $w$, $\delta'^*(S_0, w) = \delta^*(s, w)$: the DFA state after reading $w$ is exactly the set of NFA states reachable by walks spelling $w$.

*Proof.* Induction on $|w|$. If $w = \varepsilon$, then $\delta'^*(S_0, \varepsilon) = S_0 = \varepsilon\text{-reach}(s) = \delta^*(s, \varepsilon)$. Otherwise write $w = xa$ with $a \in \Sigma$. Then
$$\delta'^*(S_0, xa) = \delta'\big(\delta'^*(S_0, x), a\big) \overset{\text{IH}}{=} \delta'\big(\delta^*(s,x), a\big) = \varepsilon\text{-reach}\Big(\bigcup_{r \in \delta^*(s,x)} \delta(r, a)\Big) = \delta^*(s, xa),$$
where the last equality is the left-to-right rule from the path view. $\blacksquare$

> **Theorem.** $L(D) = L(N)$.

*Proof.* $w \in L(D)$ iff $\delta'^*(S_0, w)$ is accepting iff $\delta'^*(S_0, w) \cap A \neq \varnothing$ iff (lemma) $\delta^*(s, w) \cap A \ne \varnothing$ iff $w \in L(N)$. Restricting $D$ to the subsets reachable from $S_0$ does not change its language, since unreachable states are never visited. $\blacksquare$

## Removing $\varepsilon$-transitions without adding states

Sometimes you want an NFA with no $\varepsilon$-moves (for instance, to argue about path lengths). This costs **no** new states:

- Keep $Q$ and $s$. For each $q \in Q$, $a \in \Sigma$: $\delta_{\text{new}}(q, a) = \varepsilon\text{-reach}\big(\bigcup_{r \in \varepsilon\text{-reach}(q)} \delta(r, a)\big)$ — "$\varepsilon$-moves, one real $a$-move, $\varepsilon$-moves".
- New accepting set: $A_{\text{new}} = \{q : \varepsilon\text{-reach}(q) \cap A \ne \varnothing\}$.

*Correctness.* Each new edge $q \xrightarrow{a} p$ stands for an $N$-walk "$\varepsilon$-moves, then $a$, then $\varepsilon$-moves" from $q$ to $p$, and every $N$-walk spelling a nonempty $w$ can be chopped into such pieces, one per symbol (put each run of $\varepsilon$-edges into the piece of the symbol after it, and the final run into the last piece). Hence $\delta_{\text{new}}^*(s, w) = \delta^*(s, w)$ for every $w \ne \varepsilon$ (formally: induction on $|w|$, mirroring the lemma above). These sets are closed under $\varepsilon$-reach, so they meet $A$ iff they meet $A_{\text{new}}$, and the two machines agree on nonempty strings. For $w = \varepsilon$ the new machine has no moves at all and accepts iff $s \in A_{\text{new}}$, i.e. iff $\varepsilon\text{-reach}(s) \cap A \neq \varnothing$, i.e. iff $N$ accepts $\varepsilon$. That one case is the only reason the accepting set has to grow.

## The exponential blowup is real

Let $L_k$ = "the $k$-th symbol from the end is 1". The guessing NFA has $k+1$ states. Any DFA needs at least $2^k$ states:

**Claim.** The $2^k$ strings of length $k$ are pairwise distinguishable for $L_k$.

**Proof.** Take distinct $x, y \in \{0,1\}^k$; they differ in some position $i$ (counting from the left), say $x_i = 1$, $y_i = 0$. Append $z = 0^{i-1}$. Then position $i$ of $x$ is exactly the $k$-th symbol from the end of $xz$ (there are $k - i$ symbols after it in $x$ and $i - 1$ more in $z$), so $xz \in L_k$ and $yz \notin L_k$. Distinguishable strings must lead a DFA to different states, so a DFA needs $\ge 2^k$ states. $\blacksquare$

The DFA that remembers the last $k$ symbols has exactly $2^k$ states, so this is tight.

## Kleene's theorem

> **Theorem (Kleene).** For a language $L$, the following are equivalent: (1) $L$ is described by a regular expression; (2) $L$ is accepted by an NFA; (3) $L$ is accepted by a DFA.

The cycle of constructions:

1. regex $\to$ NFA: Thompson's construction.
2. NFA $\to$ DFA: subset construction.
3. DFA $\to$ NFA: trivial (a DFA is an NFA).
4. NFA/DFA $\to$ regex: state elimination (below), or Han–Wood / Kleene's dynamic-programming method.

So "regular" means any of the three, and in proofs you may use whichever model is most convenient.

## State elimination: automaton $\to$ regex

Work with a **generalized NFA** whose edges are labeled by regexes.

1. Add a new start state with an $\varepsilon$-edge to the old start, and a new single accepting state with $\varepsilon$-edges from every old accepting state. Combine parallel edges $p \xrightarrow{r} q$, $p \xrightarrow{s} q$ into $p \xrightarrow{r+s} q$.
2. Repeatedly remove an internal state $q$. If $q$ has a self-loop labeled $R_{qq}$, then for every pair of edges $p \xrightarrow{R_{pq}} q \xrightarrow{R_{qr}} r$ add the edge
$$p \xrightarrow{R_{pq}\,R_{qq}^*\,R_{qr}} r$$
(unioned with any existing $p \to r$ edge).
3. When only the new start and accept remain, the label of the edge between them is the regex.

### Worked example: binary multiples of 3

The DFA has states $r_0$ (start, accept), $r_1$, $r_2$ with $\delta(r, b) = (2r+b) \bmod 3$: edges $r_0 \xrightarrow{0} r_0$, $r_0 \xrightarrow{1} r_1$, $r_1 \xrightarrow{0} r_2$, $r_1 \xrightarrow{1} r_0$, $r_2 \xrightarrow{0} r_1$, $r_2 \xrightarrow{1} r_2$.

- **Eliminate $r_2$.** Its only in-edge comes from $r_1$ (label 0), self-loop $1$, only out-edge to $r_1$ (label 0). New self-loop on $r_1$: $01^*0$.
- **Eliminate $r_1$.** In-edge from $r_0$ (label 1), self-loop $01^*0$, out-edge to $r_0$ (label 1). New contribution to $r_0$'s self-loop: $1(01^*0)^*1$, so $r_0$'s loop becomes $0 + 1(01^*0)^*1$.
- Since $r_0$ is both start and accept, the language is
$$\big(0 + 1(01^*0)^*1\big)^*.$$

~~~regex
(0+1(01*0)*1)*
alphabet: 01
~~~

The regex depends on the elimination order, but all orders give equivalent regexes. Eliminating states with few in/out edges first keeps expressions small.

### Why state elimination is correct

For a generalized NFA $G$ (edges labeled by regexes), say $G$ accepts $w$ if there is a walk from the start to the accept state with labels $R_1, \ldots, R_m$ and a split $w = w_1 \cdots w_m$ with $w_i \in L(R_i)$. The preprocessing (new start with no incoming edges, new single accept with no outgoing edges, parallel edges merged with $+$) clearly preserves the language.

> **Lemma.** Removing an internal state $q$ and adding $R_{pq}R_{qq}^*R_{qr}$ to every edge $p \to r$ preserves the accepted language.

*Proof.* Take an accepting walk of the old machine. Each maximal visit to $q$ looks like $p \to q \to q \to \cdots \to q \to r$ with $p, r \ne q$ (they exist because $q$ is neither the start nor the accept); the strings read along it lie in $L(R_{pq})L(R_{qq})^kL(R_{qr}) \subseteq L(R_{pq}R_{qq}^*R_{qr})$, so the new edge $p \to r$ covers it. Conversely, a use of a new edge $p \to r$ with a string in $L(R_{pq}R_{qq}^*R_{qr})$ unfolds into a walk through $q$ in the old machine. $\blacksquare$

When only start and accept remain, the single edge label is a regex for the language, which completes the proof of Kleene's theorem.

~~~steps State elimination: binary strings whose number of 1s is a multiple of 3
**Setup.** DFA: states $q_0$ (start, accept), $q_1$, $q_2$ count 1s mod 3. Each state has a self-loop $0$; edges $q_0 \xrightarrow{1} q_1 \xrightarrow{1} q_2 \xrightarrow{1} q_0$. Add a new start $S \xrightarrow{\varepsilon} q_0$ and a new accept $q_0 \xrightarrow{\varepsilon} F$.
+++
**Eliminate $q_2$.** In-edges: $q_1 \xrightarrow{1} q_2$. Self-loop: $0$. Out-edges: $q_2 \xrightarrow{1} q_0$. New edge $q_1 \xrightarrow{1\,0^*\,1} q_0$. ($q_1$ had no direct edge to $q_0$, so nothing to union with.)
+++
**Eliminate $q_1$.** In-edges: $q_0 \xrightarrow{1} q_1$. Self-loop: $0$. Out-edges: $q_1 \xrightarrow{10^*1} q_0$. New contribution $q_0 \to q_0$: $1\,0^*\,10^*1$, unioned with the existing self-loop $0$: the loop on $q_0$ is now $0 + 10^*10^*1$.
+++
**Eliminate $q_0$.** In-edge $S \xrightarrow{\varepsilon} q_0$, loop $0 + 10^*10^*1$, out-edge $q_0 \xrightarrow{\varepsilon} F$. Result:
$$\big(0 + 10^*10^*1\big)^*.$$
+++
**Sanity check.** Every string in the result is a concatenation of $0$s and blocks with exactly three 1s, so its 1-count is a multiple of 3. Conversely, cut any such string right after every third 1: each piece is either $0$ or matches $10^*10^*1$ (after peeling leading 0s off as single-$0$ pieces). For instance <code>(0+10*10*1)*</code> accepts $111$, $010101$, $0$ and rejects $11$, $1011$.
~~~

**Try it first.** Use state elimination to find a regex for the binary strings with **no two consecutive 1s**. Start from the DFA with states $A$ ("last symbol was not 1", start, accepting), $B$ ("last symbol was 1", accepting) and a dead state.

~~~~reveal Solution: (0+10)*(ε+1)
Drop the dead state (it cannot reach the accept, so it contributes nothing). Edges: $A \xrightarrow{0} A$, $A \xrightarrow{1} B$, $B \xrightarrow{0} A$. Add $S \xrightarrow{\varepsilon} A$ and $A, B \xrightarrow{\varepsilon} F$.

- **Eliminate $B$.** In: $A \xrightarrow{1} B$. No loop. Out: $B \xrightarrow{0} A$ and $B \xrightarrow{\varepsilon} F$. New edges: $A \xrightarrow{10} A$ (loop becomes $0 + 10$) and $A \xrightarrow{1} F$ (edge to $F$ becomes $\varepsilon + 1$).
- **Eliminate $A$.** $S \xrightarrow{\varepsilon (0+10)^* (\varepsilon + 1)} F$.

~~~regex
(0+10)*(ε+1)
alphabet: 01
~~~

Forgetting $B \xrightarrow{\varepsilon} F$ (because $B$ was accepting) gives $(0+10)^*$, which wrongly rejects $1$ and $01$.
~~~~

## One accepting state, and a trap

With $\varepsilon$-moves, every NFA can be given a **single** accepting state: add a new state $f$, an $\varepsilon$-edge to $f$ from every old accepting state, and make $f$ the only accepting state. (Thompson's construction and state elimination both rely on this normal form.)

**Try it first.** Is it also true that every regular language has an NFA **without $\varepsilon$-moves** that has exactly one accepting state?

~~~reveal Answer: no — {ε, 0} is a counterexample
Suppose $N$ has no $\varepsilon$-moves and a single accepting state $f$, and $L(N) = \{\varepsilon, 0\}$. Since $\varepsilon \in L(N)$ and there are no $\varepsilon$-moves, the start state must be $f$. Since $0 \in L(N)$, some $0$-edge goes from $f$ to $f$ (the only accepting state). Then $00$ is accepted by looping on that edge twice — but $00 \notin L$. Contradiction. So the $\varepsilon$-free single-accept normal form fails in general. (It does work whenever $\varepsilon \notin L$: take an $\varepsilon$-free NFA, add a fresh state $f$, copy every edge that enters an old accepting state so that it also enters $f$, and make $f$ the only accepting state.)
~~~

## Common exam problem patterns

**1. "Draw an NFA for $L$" (often with a state budget).** Recipe: identify the single guess that makes the check local (see the catalogue). Draw the "waiting" part (usually a loop at the start), the verification chain, and the ending (accepting loop if anything may follow; accepting state with no exits if the string must end). Then test one string in the language and one just outside it.

**2. "Convert this NFA to a DFA."** Recipe: (i) compute $\varepsilon$-reach of every state once, up front; (ii) start subset $= \varepsilon\text{-reach}(s)$; (iii) worklist table, one row per reachable subset, one column per symbol, each entry $=\varepsilon$-reach of the union of moves; (iv) mark rows containing an accepting state; (v) include $\varnothing$ if it appears; (vi) optionally draw the DFA. Graders check the start subset, the closures and the accepting rows.

**3. "Convert this regex to an NFA (Thompson)."** Recipe: parse the regex into a tree (respect precedence: star, then concatenation, then $+$), build leaves first, combine with the four gadgets, keep the one-start/one-accept invariant. Label states so the grader can follow.

**4. "Convert this DFA/NFA to a regex."** Recipe: add new start and accept; delete dead states; eliminate states one at a time with $R_{pq}R_{qq}^*R_{qr}$, showing the machine after each step; simplify only with identities you are sure of ($\varepsilon r = r$, $\varnothing r = \varnothing$, $(r^*)^* = r^*$).

**5. "Prove every DFA for $L$ needs $2^k$ states, though an NFA has $O(k)$."** Recipe: fooling set of $2^k$ strings (all length-$k$ strings, or one string per subset of symbols), a distinguishing suffix for an arbitrary pair, then the pigeonhole lemma.

**6. "Prove the construction correct."** Recipe: state the invariant ("the DFA state after reading $w$ is the set of NFA states reachable on $w$"; "a walk stays inside a sub-machine between entry and exit"; "removing a state preserves the language") and prove it by induction on $|w|$ or on the structure of the regex.

## Where students lose points

- **Start subset is $\{s\}$** instead of $\varepsilon\text{-reach}(s)$; or $\varepsilon$-reach is applied at the start but not after each symbol.
- **Accepting subsets** defined as $S \subseteq A$ instead of $S \cap A \ne \varnothing$.
- **Missing rows**: a subset appears as an entry but is never expanded; or $\varnothing$ is reachable but left out of a DFA that was supposed to be complete (it matters if you then complement).
- **Complementing an NFA** by swapping accepting states.
- **Unsound guessing NFAs**: an accepting state with a self-loop when the guess required the string to end there (e.g. "$k$-th from the end" becoming "some 1 at least $k$ from the end"); entering a "block" branch in the middle of a block.
- **Concatenation bug**: adding $\varepsilon$ from $N_1$'s accepting states to $N_2$'s start but leaving them accepting.
- **Star bug**: making the old start state accepting instead of adding a fresh one.
- **State elimination**: forgetting that a state is accepting (its $\varepsilon$-edge to $F$), forgetting to union with an existing edge, or forgetting the self-loop star.
- **Format** (this app): several targets are separated by commas, <code>q0 1 -> q0, q1</code>; $\varepsilon$-moves are written <code>eps</code>.

## Self-check

1. An NFA has states $s, p, f$ with $s \xrightarrow{\varepsilon} p$, $p \xrightarrow{0} f$, $f \xrightarrow{\varepsilon} s$, accepting $f$. What is its language?

~~~reveal Answer
$\varepsilon\text{-reach}(s) = \{s, p\}$ (not accepting), and after each $0$ the set is $\varepsilon\text{-reach}(f) = \{f, s, p\}$ (accepting). A $1$ kills every thread. So $L = 00^*$, the nonempty strings of 0s.
~~~

2. A student's subset construction has a row for $\{q_1, q_3\}$ but the NFA's start state is $q_0$ and $\{q_1, q_3\}$ never appears as an entry in the table. Is that an error?

~~~reveal Answer
It is not wrong for the language (unreachable states never matter), but it is not the *incremental* construction: rows should be exactly the subsets reachable from the start subset. On an exam, unreachable rows cost time and sometimes points.
~~~

3. How many states does Thompson's construction produce for $(ab)^*$?

~~~reveal Answer
$a$: 2, $b$: 2, $ab$: 4 (concatenation adds none), star: $4 + 2 = 6$.
~~~

4. True or false: the subset construction applied to a DFA (viewed as an NFA) returns an isomorphic DFA, up to a possible $\varnothing$ state.

~~~reveal Answer
True. Every reachable subset is a singleton $\{q\}$, since each state has exactly one move per symbol; if the "DFA" had missing transitions, $\varnothing$ appears as the dead state.
~~~

5. Why can't you complement an NFA by swapping accepting states, while you *can* reverse one by reversing edges?

~~~reveal Answer
Reversal maps accepting walks to accepting walks one-for-one, so "some walk exists" is preserved. Complement needs "**no** walk accepts", which is a statement about all runs; swapping only changes which single runs succeed. Determinize first, so there is exactly one run.
~~~

6. Give an NFA with 3 states for "the second-to-last symbol is 0", and say how many states the smallest DFA needs.

~~~reveal Answer
$q_0 \xrightarrow{0,1} q_0$, $q_0 \xrightarrow{0} q_1$, $q_1 \xrightarrow{0,1} q_2$, accept $q_2$. The smallest DFA needs $2^2 = 4$ states (remember the last two symbols; the four length-2 strings are pairwise distinguishable).
~~~

7. In state elimination you remove $q$ which has in-neighbours $p_1, p_2$ and out-neighbours $r_1, r_2, r_3$. How many new edge labels must you compute?

~~~reveal Answer
One for every (in, out) pair: $2 \times 3 = 6$ (some may coincide with existing edges and get unioned in; if some $p_i = r_j$ the new label goes on that state's self-loop).
~~~
`,

  cheatsheet: String.raw`## NFA basics
- $\delta : Q \times (\Sigma \cup \{\varepsilon\}) \to 2^Q$. Accept iff **some** run ends in $A$: $\delta^*(s,w) \cap A \ne \varnothing$. Reject iff **every** run fails.
- $\varepsilon$-reach$(q)$: states reachable by $\varepsilon$-edges only (includes $q$). Compute by DFS over $\varepsilon$-edges.
- Path view: $q \in \delta^*(p,w)$ iff some walk $p \leadsto q$ spells $w$ (erase $\varepsilon$s).
- Left-to-right rule: $\delta^*(s,xa) = \varepsilon\text{-reach}\big(\bigcup_{r \in \delta^*(s,x)} \delta(r,a)\big)$.

## Design template (guess and verify)
1. What single guess makes the check local? (position, which piece of a union, which symbol, where a block starts)
2. Waiting loop at start $\to$ verification chain/cycle $\to$ ending (accepting loop if anything may follow; accepting dead-end if the string must end).
3. Check completeness (a correct guess exists for every $w \in L$) **and** soundness (every accepting thread really verified).

| Pattern | NFA |
|---|---|
| $k$-th from end is $a$ | loop; on $a$ jump; chain of $k-1$ "any" edges; accept with no exits ($k+1$ states) |
| contains $x$ | loop; chain spelling $x$; accepting loop (length of $x$ plus 1 states) |
| contains $x$ and $y$ | two branches: $x$ then $y$, $y$ then $x$ |
| union | $\varepsilon$-fork; $m+n+1$ states (vs. $mn$ product) |
| some symbol missing ($k$ symbols) | $k$ branches; DFA needs $2^k$ |

## Thompson (regex $\to$ NFA)
- One start (no in-edges), one accept (no out-edges); $\le 2|r|$ states.
- Leaf: 2 states. $r+s$: +2 (fork/join). $rs$: +0 ($\varepsilon$ bridge). $r^*$: +2 (new start/accept, skip edge, loop back from old accept to old start).
- $(0+1)^*1$: 10 states. $(ab)^*$: 6 states.

## Subset construction (NFA $\to$ DFA) template
| subset | $0$ | $1$ | acc? |
|---|---|---|---|
| $\varepsilon$-reach$(s)$ | ... | ... | $S \cap A \ne \varnothing$ |
- Entry $=\varepsilon\text{-reach}(\bigcup_{q\in S}\delta(q,a))$. Expand every new subset (worklist). Include $\varnothing$ if reached.
- $\le 2^n$ states; result is correct but **not necessarily minimal**.
- Correctness lemma: $\delta'^*(S_0,w) = \delta^*(s,w)$ (induction on $|w|$).

## $\varepsilon$-removal (same states)
- $\delta_{\text{new}}(q,a) = \varepsilon\text{-reach}(\delta(\varepsilon\text{-reach}(q),a))$; $A_{\text{new}} = \{q : \varepsilon\text{-reach}(q)\cap A \ne\varnothing\}$.

## Blowup
- "$k$-th from end is 1": NFA $k+1$ states, DFA needs $2^k$ (fooling set $\{0,1\}^k$, suffix $0^{i-1}$).

## State elimination (automaton $\to$ regex) template
1. New start $S \xrightarrow{\varepsilon}$ old start; every old accept $\xrightarrow{\varepsilon} F$. Delete dead states. Merge parallel edges with $+$.
2. Remove $q$: for every in-neighbour $p$ and out-neighbour $r$, add $R_{pq}R_{qq}^*R_{qr}$ to $p \to r$.
3. Label of $S \to F$ is the answer. Eliminate low-degree states first.
- Multiples of 3 in binary: $(0+1(01^*0)^*1)^*$. #1s $\equiv 0 \pmod 3$: $(0+10^*10^*1)^*$. No $11$: $(0+10)^*(\varepsilon+1)$.

## Kleene's theorem
- regex $\Leftrightarrow$ NFA $\Leftrightarrow$ DFA (Thompson, subset, state elimination).

## Traps
- Don't complement NFAs by swapping accept states (determinize first, complete with $\varnothing$).
- Don't forget $\varepsilon$-reach at the start and after each step.
- Concatenation: $N_1$'s accepts stop being accepting. Star: fresh start state.
- Single accepting state needs $\varepsilon$-moves in general ($\{\varepsilon, 0\}$).
`,

  quiz: [
    {
      type: 'tf',
      q: String.raw`An NFA rejects a string if at least one of its runs on that string ends in a non-accepting state.`,
      answer: false,
      explain: String.raw`An NFA *accepts* if at least one run succeeds; it rejects only if **every** run fails. One failing run says nothing.`,
    },
    {
      type: 'mc',
      q: String.raw`In the subset construction, what is the start state of the DFA built from NFA $N$ with start $s$?`,
      choices: [String.raw`$\{s\}$`, String.raw`$\varepsilon\text{-reach}(s)$`, String.raw`$Q$`, String.raw`$\varnothing$`],
      answer: 1,
      explain: String.raw`Before reading anything, the NFA can already be in any state reachable from $s$ by $\varepsilon$-moves. If $N$ has no $\varepsilon$-moves out of $s$, this equals $\{s\}$, but in general you must take the $\varepsilon$-reach.`,
    },
    {
      type: 'mc',
      q: String.raw`An NFA has 5 states. What is the best general upper bound on the number of states of the DFA produced by the subset construction?`,
      choices: ['5', '10', '25', '32'],
      answer: 3,
      explain: String.raw`DFA states are subsets of the 5 NFA states: at most $2^5 = 32$ (including $\varnothing$). The incremental construction often produces far fewer, but $2^n$ can be necessary, e.g. for "$k$-th symbol from the end".`,
    },
    {
      type: 'tf',
      q: String.raw`If $N$ is an NFA, the NFA $N'$ obtained by swapping accepting and non-accepting states accepts $\overline{L(N)}$.`,
      answer: false,
      explain: String.raw`Counterexample: $N$ with states $s$ (non-accepting) and $f$ (accepting), $s \xrightarrow{0} s$ and $s \xrightarrow{0} f$. Then $0 \in L(N)$. After swapping, $s$ is accepting, and the run staying in $s$ still accepts $0$, so $0 \in L(N')$ too. Convert to a DFA first, then complement.`,
    },
    {
      type: 'mc',
      q: String.raw`Consider the NFA with states $q_0$ (start), $q_1$, $q_2$, $q_3$ (accept) and transitions $q_0 \xrightarrow{0,1} q_0$, $q_0 \xrightarrow{1} q_1$, $q_1 \xrightarrow{0,1} q_2$, $q_2 \xrightarrow{0,1} q_3$. After reading $110$ from the start, which set of states is the NFA in?`,
      choices: [String.raw`$\{q_0, q_3\}$`, String.raw`$\{q_0, q_2, q_3\}$`, String.raw`$\{q_0, q_1, q_2\}$`, String.raw`$\{q_0, q_1, q_2, q_3\}$`],
      answer: 1,
      explain: String.raw`Start $\{q_0\}$. Read 1: $\{q_0, q_1\}$. Read 1: $q_0 \to \{q_0, q_1\}$, $q_1 \to q_2$: $\{q_0, q_1, q_2\}$. Read 0: $q_0 \to q_0$ (no move to $q_1$ on 0), $q_1 \to q_2$, $q_2 \to q_3$: $\{q_0, q_2, q_3\}$. It contains $q_3$, consistent with $110$ having a 1 three from the end.`,
    },
    {
      type: 'mc',
      q: String.raw`In Thompson's construction, how many new states does the case $r^*$ add (on top of those of $N_r$)?`,
      choices: ['0', '1', '2', '3'],
      answer: 2,
      explain: String.raw`A fresh start and a fresh accept, connected by $\varepsilon$ (zero repetitions), with $\varepsilon$-edges into $N_r$, from $N_r$'s accept back to its start, and from $N_r$'s accept to the new accept. Union also adds 2; concatenation adds none.`,
    },
    {
      type: 'multi',
      q: String.raw`Which statements about the subset construction are correct? (select all that apply)`,
      choices: [
        String.raw`A subset $S$ is accepting iff $S \subseteq A$`,
        String.raw`A subset $S$ is accepting iff $S \cap A \neq \varnothing$`,
        String.raw`$\varnothing$ can appear as a reachable state, acting as a dead state`,
        String.raw`We must always build all $2^n$ subsets`,
        String.raw`After reading a symbol we take the $\varepsilon$-reach of the resulting set`,
      ],
      answer: [1, 2, 4],
      explain: String.raw`Acceptance needs just one accepting thread, so $S \cap A \neq \varnothing$ (not $S \subseteq A$). $\varnothing$ is reached when every thread dies, and it loops to itself. The incremental construction builds only reachable subsets. $\varepsilon$-reach must be applied after every symbol.`,
    },
    {
      type: 'tf',
      q: String.raw`For every $k \ge 1$, the language "the $k$-th symbol from the end is 1" has an NFA with $k+1$ states but no DFA with fewer than $2^k$ states.`,
      answer: true,
      explain: String.raw`The NFA guesses the position. For the DFA lower bound, any two distinct length-$k$ strings $x, y$ differ at some position $i$; appending $0^{i-1}$ moves that position to $k$-th from the end, so the strings are distinguishable and must reach distinct states.`,
    },
    {
      type: 'mc',
      q: String.raw`During state elimination, you remove state $q$ with self-loop $R_{qq}$, an edge $p \xrightarrow{R_{pq}} q$ and an edge $q \xrightarrow{R_{qr}} r$. What label is added to the edge $p \to r$?`,
      choices: [String.raw`$R_{pq} + R_{qq} + R_{qr}$`, String.raw`$R_{pq}R_{qr}$`, String.raw`$R_{pq}R_{qq}^*R_{qr}$`, String.raw`$(R_{pq}R_{qq}R_{qr})^*$`],
      answer: 2,
      explain: String.raw`A path from $p$ to $r$ through $q$ enters $q$ once, loops at $q$ any number of times, and leaves: $R_{pq}R_{qq}^*R_{qr}$. This is unioned with any existing direct label on $p \to r$.`,
    },
    {
      type: 'tf',
      q: String.raw`Kleene's theorem states that regular expressions, NFAs and DFAs all describe exactly the same class of languages.`,
      answer: true,
      explain: String.raw`Thompson's construction (regex $\to$ NFA), the subset construction (NFA $\to$ DFA) and state elimination (DFA $\to$ regex) close the loop. This is why "regular" can be proved with whichever model is convenient.`,
    },
    {
      type: 'mc',
      q: String.raw`An NFA has states $s$ (start), $p$, $f$ (accept) and transitions $s \xrightarrow{\varepsilon} p$, $p \xrightarrow{\varepsilon} f$, $f \xrightarrow{0} s$. What is $\varepsilon\text{-reach}(s)$?`,
      choices: [String.raw`$\{s\}$`, String.raw`$\{s, p\}$`, String.raw`$\{s, p, f\}$`, String.raw`$\{p, f\}$`],
      answer: 2,
      explain: String.raw`$\varepsilon$-reach is transitive and includes the state itself: $s$, then $p$ via $\varepsilon$, then $f$ via another $\varepsilon$. The $0$-edge is not an $\varepsilon$-edge. In particular $\varepsilon$ is accepted.`,
    },
    {
      type: 'mc',
      q: String.raw`Which regex results from state elimination on the binary "multiple of 3" DFA (states $r_0, r_1, r_2$; start and accept $r_0$)?`,
      choices: [String.raw`$(0 + 11)^*$`, String.raw`$(0 + 1(01^*0)^*1)^*$`, String.raw`$(0 + 1 0^* 1)^*$`, String.raw`$0^*(10^*1)^*0^*$`],
      answer: 1,
      explain: String.raw`Eliminating $r_2$ creates the self-loop $01^*0$ on $r_1$; eliminating $r_1$ adds $1(01^*0)^*1$ to $r_0$'s loop. The other choices fail, e.g. $(0+11)^*$ misses $1001 = 9$, and $(0+10^*1)^*$ accepts $101 = 5$ — it describes "even number of 1s".`,
    },
    {
      type: 'tf',
      q: String.raw`Every DFA is (essentially) an NFA.`,
      answer: true,
      explain: String.raw`Replace each $\delta(q,a) = p$ by $\delta(q,a) = \{p\}$ and add no $\varepsilon$-moves. So NFAs are at least as powerful as DFAs, and the subset construction shows they are no more powerful.`,
    },
    {
      type: 'mc',
      q: String.raw`How many states does Thompson's construction produce for $(a+b)^*$?`,
      choices: ['4', '6', '8', '10'],
      answer: 2,
      explain: String.raw`Leaves $a$ and $b$: 2 states each (4). Union adds a fresh start and accept (6). Star adds another fresh start and accept (8). Hand-built, one state with a self-loop on $a, b$ suffices — Thompson trades size for a mechanical, obviously correct construction.`,
    },
    {
      type: 'tf',
      q: String.raw`Every NFA with $\varepsilon$-transitions can be converted into an equivalent NFA without $\varepsilon$-transitions that has the same set of states.`,
      answer: true,
      explain: String.raw`Set $\delta_{\text{new}}(q,a) = \varepsilon\text{-reach}(\delta(\varepsilon\text{-reach}(q), a))$ and make $q$ accepting iff $\varepsilon\text{-reach}(q)$ contains an accepting state. No new states are needed; only the transition relation and the accepting set change.`,
    },
    {
      type: 'tf',
      q: String.raw`Every regular language is accepted by some NFA **without** $\varepsilon$-transitions that has exactly one accepting state.`,
      answer: false,
      explain: String.raw`Take $L = \{\varepsilon, 0\}$. Without $\varepsilon$-moves the start state must be the accepting state $f$ (to accept $\varepsilon$), and accepting $0$ needs a $0$-edge from $f$ to $f$; then $00$ is accepted too. With $\varepsilon$-moves allowed the statement becomes true: add a new accept state with $\varepsilon$-edges from all old ones.`,
    },
    {
      type: 'tf',
      q: String.raw`The DFA produced by the incremental subset construction is always a minimal DFA for the language.`,
      answer: false,
      explain: String.raw`The construction is correct but not minimal in general. In the lesson's $\varepsilon$-NFA for "ends in 01", the subsets $\{s, a\}$ and $\{a\}$ are both reachable yet behave identically. Minimality must be proved separately (e.g. with a fooling set).`,
    },
    {
      type: 'mc',
      q: String.raw`A student's NFA for "contains $101$": $q_0$ loops on $0,1$; $q_0 \xrightarrow{1} q_1 \xrightarrow{0} q_2 \xrightarrow{1} q_3$; $q_3$ accepting with **no** outgoing transitions. What language does it actually accept?`,
      choices: ['Strings containing 101', 'Strings ending in 101', 'Strings starting with 101', 'Only the string 101'],
      answer: 1,
      explain: String.raw`A thread that reaches $q_3$ dies on the next symbol, so the guessed occurrence must be the last three symbols. To accept "contains", $q_3$ needs a self-loop on $0, 1$. This is the classic soundness/completeness slip: an accepting dead-end means "the string must end here".`,
    },
    {
      type: 'tf',
      q: String.raw`To build an NFA for $L(N_1)L(N_2)$ it suffices to add $\varepsilon$-edges from every accepting state of $N_1$ to the start of $N_2$, keeping all accepting states of both machines accepting.`,
      answer: false,
      explain: String.raw`If $N_1$'s accepting states stay accepting, the machine also accepts every string of $L(N_1)$ by itself, giving $L_1 \cup L_1L_2$ (wrong unless $\varepsilon \in L_2$). Only $N_2$'s accepting states should accept.`,
    },
    {
      type: 'mc',
      q: String.raw`For $r = a^*b$, take the 2-state NFA $s \xrightarrow{a} s$, $s \xrightarrow{b} f$ ($f$ accepting). The "shortcut" for $r^*$ makes $s$ accepting and adds $f \xrightarrow{\varepsilon} s$. Which string is **wrongly** accepted?`,
      choices: [String.raw`$\varepsilon$`, String.raw`$a$`, String.raw`$ab$`, String.raw`$bab$`],
      answer: 1,
      explain: String.raw`Since $s$ is now accepting and has an $a$-loop, $a$ is accepted, but every nonempty string of $(a^*b)^*$ ends in $b$. $\varepsilon$, $ab$ and $bab$ really are in $(a^*b)^*$. The fix is Thompson's fresh start state: only it is accepting, and it has no incoming edges.`,
    },
    {
      type: 'mc',
      q: String.raw`DFAs $M_1$ and $M_2$ have $m$ and $n$ states. How many states does the $\varepsilon$-fork NFA for $L(M_1) \cup L(M_2)$ have?`,
      choices: [String.raw`$m + n$`, String.raw`$m + n + 1$`, String.raw`$mn$`, String.raw`$2^{m+n}$`],
      answer: 1,
      explain: String.raw`One new start state with $\varepsilon$-edges to both old starts: $m+n+1$. The product DFA needs $mn$ states but is deterministic, which matters if you then want to complement or intersect.`,
    },
    {
      type: 'mc',
      q: String.raw`NFA: $q_0 \xrightarrow{0,1} q_0$, $q_0 \xrightarrow{1} f$, $f \xrightarrow{0,1} g$, $g \xrightarrow{0,1} f$; accepting $f$. Which set of states is it in after reading $10$, and is $10$ accepted?`,
      choices: [String.raw`$\{q_0, f\}$, accepted`, String.raw`$\{q_0, g\}$, rejected`, String.raw`$\{q_0, f, g\}$, accepted`, String.raw`$\{g\}$, rejected`],
      answer: 1,
      explain: String.raw`After $1$: $\{q_0, f\}$. After $0$: $q_0 \to q_0$, $f \to g$, so $\{q_0, g\}$, which has no accepting state. Indeed the only 1 in $10$ is at position 2 from the end (even), so $10$ is not in "some 1 at an odd position from the end".`,
    },
    {
      type: 'mc',
      q: String.raw`Over $\Sigma = \{a, b, c\}$, let $L$ be the strings in which **some** symbol of $\Sigma$ does not appear. What is the minimum number of states of a (complete) DFA for $L$?`,
      choices: ['4', '6', '7', '8'],
      answer: 3,
      explain: String.raw`The DFA must remember which symbols have appeared: 8 subsets, all reachable. Strings with different sets $S \ne T$ of symbols are distinguishable: if $\sigma \in S \setminus T$, append the symbols not in $S$; then $x$'s extension contains everything (rejected) while $y$'s still misses $\sigma$ (accepted). An NFA needs only 4 states (start plus one branch per missing symbol).`,
    },
    {
      type: 'tf',
      q: String.raw`If an NFA has no $\varepsilon$-transitions and exactly one transition from every state on every symbol, then every subset reachable in the subset construction is a singleton.`,
      answer: true,
      explain: String.raw`Such an NFA is really a DFA. The start subset is $\{s\}$, and a singleton maps to a singleton on every symbol, so the subset DFA is isomorphic to the original.`,
    },
    {
      type: 'mc',
      q: String.raw`State elimination on the DFA for "no two consecutive 1s" ($A$: last symbol not 1, start; $B$: last symbol 1; both accepting). Which regex is correct?`,
      choices: [String.raw`$(0+10)^*$`, String.raw`$(0+10)^*(\varepsilon+1)$`, String.raw`$(0+1)^*0$`, String.raw`$0^*(10)^*$`],
      answer: 1,
      explain: String.raw`$B$ is accepting, so it has an $\varepsilon$-edge to the new accept $F$; eliminating $B$ produces both $A \xrightarrow{10} A$ and $A \xrightarrow{1} F$. $(0+10)^*$ forgets the second edge and rejects $1$ and $01$. $(0+1)^*0$ accepts $110$. $0^*(10)^*$ rejects $1000$ (after the first $10$ block only more $10$ blocks may follow), although $1000$ has no $11$.`,
    },
    {
      type: 'tf',
      q: String.raw`If an $n$-state NFA (possibly with $\varepsilon$-moves) accepts at least one string, then it accepts some string of length less than $n$.`,
      answer: true,
      explain: String.raw`Take an accepting walk with the fewest edges; if it visited some state twice, cutting out the cycle between the two visits would give an accepting walk with fewer edges. So it visits at most $n$ states, uses at most $n-1$ edges, and spells a string of length at most $n - 1$. This is why emptiness of an NFA is decidable by graph search.`,
    },
  ],

  flashcards: [
    { front: 'NFA transition function', back: String.raw`$\delta : Q \times (\Sigma\cup\{\varepsilon\}) \to 2^Q$ — a set of next states, possibly empty.` },
    { front: 'NFA acceptance', back: String.raw`Accept iff some run ends in an accepting state: $\delta^*(s,w) \cap A \ne \varnothing$.` },
    { front: String.raw`$\varepsilon$-reach$(q)$`, back: String.raw`All states reachable from $q$ using only $\varepsilon$-transitions, including $q$ itself.` },
    { front: 'Subset construction: start, transitions, accept', back: String.raw`Start $\varepsilon\text{-reach}(s)$; $\delta'(S,a) = \varepsilon\text{-reach}(\bigcup_{q\in S}\delta(q,a))$; accept iff $S \cap A \ne \varnothing$.` },
    { front: 'Incremental subset construction', back: String.raw`Only build subsets reachable from the start subset, using a worklist. Include $\varnothing$ if reached (dead state).` },
    { front: "Thompson's construction properties", back: String.raw`One start, one accept, $O(|r|)$ states; union/star add 2 states; concatenation adds 0.` },
    { front: 'NFA for "k-th symbol from end is 1"', back: String.raw`$k+1$ states: loop in start, guess the 1, then a chain of $k-1$ "any symbol" steps to accept.` },
    { front: 'Why does the k-th-from-end DFA need 2^k states?', back: String.raw`Distinct $x,y \in \{0,1\}^k$ differing at position $i$ are separated by suffix $0^{i-1}$.` },
    { front: 'State elimination rule', back: String.raw`Removing $q$: add $R_{pq}R_{qq}^*R_{qr}$ to edge $p \to r$ for every in-neighbor $p$ and out-neighbor $r$.` },
    { front: "Kleene's theorem", back: 'regex ⇔ NFA ⇔ DFA: all describe exactly the regular languages.' },
    { front: 'Can you complement an NFA by swapping accept states?', back: 'No. Determinize (subset construction) first, then swap.' },
    { front: 'Regex for binary multiples of 3', back: String.raw`$(0 + 1(01^*0)^*1)^*$` },
    { front: String.raw`Path view of $\delta^*$`, back: String.raw`$q \in \delta^*(p,w)$ iff some walk from $p$ to $q$ spells $w$ (with $\varepsilon$ labels erased). Gives $\delta^*(s,xa) = \varepsilon\text{-reach}(\bigcup_{r\in\delta^*(s,x)}\delta(r,a))$.` },
    { front: 'Subset construction correctness lemma', back: String.raw`$\delta'^*(S_0, w) = \delta^*(s, w)$ for all $w$, by induction on $|w|$. Then $w \in L(D)$ iff $\delta^*(s,w)\cap A \ne \varnothing$ iff $w \in L(N)$.` },
    { front: String.raw`Removing $\varepsilon$-transitions`, back: String.raw`Same states. $\delta_{\text{new}}(q,a) = \varepsilon\text{-reach}(\delta(\varepsilon\text{-reach}(q),a))$; $q$ accepting iff $\varepsilon\text{-reach}(q) \cap A \ne \varnothing$.` },
    { front: 'Single accepting state normal form', back: String.raw`With $\varepsilon$: always possible (new accept, $\varepsilon$ from old ones). Without $\varepsilon$: impossible in general, e.g. $\{\varepsilon, 0\}$.` },
    { front: 'NFA design sanity checks', back: 'Completeness: every string in L has a correct sequence of guesses. Soundness: every accepting thread really verified the property (watch accepting states that loop when the string should end).' },
    { front: 'NFA vs DFA for "some symbol of a k-letter alphabet is missing"', back: String.raw`NFA: $k+1$ states ($\varepsilon$-fork into one branch per missing symbol). DFA: $2^k$ states (remember the set of symbols seen).` },
    { front: 'Concatenation construction trap', back: String.raw`Add $\varepsilon$ from $N_1$'s accepts to $N_2$'s start AND make $N_1$'s accepts non-accepting; otherwise you get $L_1 \cup L_1L_2$.` },
    { front: 'Why is state elimination correct?', back: String.raw`Each visit $p \to q \to \cdots \to q \to r$ through the removed state reads a string in $L(R_{pq}R_{qq}^*R_{qr})$, which is exactly the label added to $p \to r$; and conversely.` },
    { front: 'Emptiness of an NFA', back: String.raw`$L(N) \ne \varnothing$ iff some accepting state is reachable from $s$ (graph search); then a string of length $< n$ is accepted.` },
  ],

  problems: [
    {
      id: 'nfa-contains101', type: 'nfa', title: 'Contains 101', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build an NFA (4 states suffice) for the binary strings containing $101$ as a substring.`,
      accepts: s => s.includes('101'),
      sample: String.raw`start: q0
accept: q3
q0 0 -> q0
q0 1 -> q0, q1
q1 0 -> q2
q2 1 -> q3
q3 0,1 -> q3`,
      hints: [String.raw`Loop on anything, guess where $101$ starts, then read it.`],
      solution: String.raw`$q_0$ loops on both symbols and, on a 1, may also guess that an occurrence of $101$ starts here, moving to $q_1$. Then $q_1 \xrightarrow{0} q_2 \xrightarrow{1} q_3$, and $q_3$ (accepting) loops on everything. No failure transitions are needed: a wrong guess simply dies.`,
    },
    {
      id: 'nfa-third-last', type: 'nfa', title: 'Third symbol from the end is 1 (NFA)', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build an NFA with 4 states for the binary strings whose third-to-last symbol is $1$.`,
      accepts: s => s.length >= 3 && s[s.length - 3] === '1',
      sample: String.raw`start: q0
accept: q3
q0 0 -> q0
q0 1 -> q0, q1
q1 0,1 -> q2
q2 0,1 -> q3`,
      hints: [String.raw`Guess which 1 is third from the end, then check exactly two symbols follow.`],
      solution: String.raw`$q_0$ loops on $0,1$; on 1 it may also go to $q_1$. Then $q_1 \xrightarrow{0,1} q_2 \xrightarrow{0,1} q_3$, and $q_3$ is accepting with no outgoing transitions, so the thread survives only if the input ends exactly two symbols after the guessed 1.`,
    },
    {
      id: 'nfa-third-last-dfa', type: 'dfa', title: 'Third symbol from the end is 1 (DFA)', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Now build a **DFA** for the same language: binary strings whose third-to-last symbol is 1. (It needs 8 states; the subset construction applied to the 4-state NFA produces one.)`,
      accepts: s => s.length >= 3 && s[s.length - 3] === '1',
      sample: String.raw`start: s000
accept: s100, s101, s110, s111
s000 0 -> s000
s000 1 -> s001
s001 0 -> s010
s001 1 -> s011
s010 0 -> s100
s010 1 -> s101
s011 0 -> s110
s011 1 -> s111
s100 0 -> s000
s100 1 -> s001
s101 0 -> s010
s101 1 -> s011
s110 0 -> s100
s110 1 -> s101
s111 0 -> s110
s111 1 -> s111`,
      hints: [String.raw`Remember the last three symbols (pad the beginning with 0s).`, String.raw`State $s_{xyz}$ on $c$ goes to $s_{yzc}$; accept when $x = 1$.`],
      solution: String.raw`State $s_{xyz}$ = "the last three symbols read are $xyz$", imagining the input is preceded by $000$ (padding 0s never count as a 1, so short strings are handled correctly). Transition $s_{xyz} \xrightarrow{c} s_{yzc}$; start $s_{000}$; accept the four states with $x = 1$.

This is exactly what the subset construction yields from the 4-state NFA: every reachable subset contains $q_0$, and $q_1, q_2, q_3$ belong to it iff the last, second-to-last, third-to-last symbol is 1, respectively. All 8 subsets containing $q_0$ are reachable, and they are pairwise distinguishable, so 8 is optimal.`,
    },
    {
      id: 'nfa-union-eps', type: 'nfa', title: '(01)* or (010)*', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build an NFA (you may use $\varepsilon$-transitions, written <code>eps</code>) for $L((01)^*) \cup L((010)^*)$.`,
      accepts: s => /^(01)*$/.test(s) || /^(010)*$/.test(s),
      sample: String.raw`start: s
accept: a0, b0
s eps -> a0, b0
a0 0 -> a1
a1 1 -> a0
b0 0 -> b1
b1 1 -> b2
b2 0 -> b0`,
      hints: [String.raw`Build one loop for each regex and join them with $\varepsilon$-moves from a new start state.`],
      solution: String.raw`A new start $s$ with $\varepsilon$-moves to $a_0$ and $b_0$. Loop $a_0 \xrightarrow{0} a_1 \xrightarrow{1} a_0$ recognizes $(01)^*$ ($a_0$ accepting); loop $b_0 \xrightarrow{0} b_1 \xrightarrow{1} b_2 \xrightarrow{0} b_0$ recognizes $(010)^*$ ($b_0$ accepting). Note this is not the same as $(01 + 010)^*$, which allows mixing, e.g. $01010$.`,
    },
    {
      id: 'nfa-len-2-or-3', type: 'nfa', title: 'Length divisible by 2 or 3', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build an NFA for the binary strings whose length is divisible by 2 **or** by 3.`,
      accepts: s => s.length % 2 === 0 || s.length % 3 === 0,
      sample: String.raw`start: s
accept: e0, t0
s eps -> e0, t0
e0 0,1 -> e1
e1 0,1 -> e0
t0 0,1 -> t1
t1 0,1 -> t2
t2 0,1 -> t0`,
      hints: [String.raw`Guess (with $\varepsilon$) which divisor works, then count mod 2 or mod 3.`],
      solution: String.raw`Start $s$ with $\varepsilon$-moves into a 2-cycle ($e_0, e_1$; accept $e_0$) and a 3-cycle ($t_0, t_1, t_2$; accept $t_0$). 6 states. A DFA via product would need $\text{lcm}(2,3) = 6$ states too, but the NFA is built without any thought about combining.`,
    },
    {
      id: 'nfa-1xx1', type: 'nfa', title: 'Two 1s separated by exactly two symbols', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build an NFA for the binary strings that contain two 1s with exactly two symbols between them, i.e. $L(\Sigma^*1\Sigma\Sigma1\Sigma^*)$. Examples: $1001$, $01111$, $110110$ are in; $101$, $10001$ are out.`,
      accepts: s => /1..1/.test(s),
      sample: String.raw`start: q0
accept: q4
q0 0 -> q0
q0 1 -> q0, q1
q1 0,1 -> q2
q2 0,1 -> q3
q3 1 -> q4
q4 0,1 -> q4`,
      hints: [String.raw`Guess the first of the two 1s.`],
      solution: String.raw`$q_0$ loops on everything and on 1 may guess "this is the first 1". Then read any two symbols ($q_1 \to q_2 \to q_3$), require a 1 ($q_3 \xrightarrow{1} q_4$), and loop in the accepting state $q_4$. A DFA for this language must remember the last three symbols plus whether the pattern was found — much bigger.`,
    },
    {
      id: 'nfa-thompsonish', type: 'nfa', title: 'NFA for (0+10)*1*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build an NFA for $L\big((0 + 10)^*1^*\big)$. You may follow Thompson's construction or design a smaller machine directly.`,
      accepts: s => /^(0|10)*1*$/.test(s),
      sample: String.raw`start: s
accept: t
s 0 -> s
s 1 -> m
m 0 -> s
s eps -> t
t 1 -> t`,
      hints: [String.raw`Build a loop for $(0+10)^*$, then an $\varepsilon$-move into a loop for $1^*$.`],
      solution: String.raw`State $s$ handles $(0+10)^*$: $s \xrightarrow{0} s$, and $s \xrightarrow{1} m \xrightarrow{0} s$. Then $s \xrightarrow{\varepsilon} t$ guesses that the $1^*$ part begins; $t \xrightarrow{1} t$, and $t$ is accepting. (Language in words: every run of 1s has length exactly 1, except possibly a run at the very end of the string, which may be any length.) Thompson's construction would give a correct but much larger machine (about 20 states).`,
    },
    {
      id: 'nfa-subset-01-010', type: 'dfa', title: 'Subset construction for (01+010)*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Apply the incremental subset construction to the NFA below (for $(01+010)^*$) and enter the resulting DFA. Name your states after subsets (e.g. <code>S</code>, <code>SB</code>); the dead state $\varnothing$ may be left implicit.

~~~pseudo
start: s
accept: s
s 0 -> a
a 1 -> s, b
b 0 -> s
~~~`,
      accepts: s => /^(01|010)*$/.test(s),
      sample: String.raw`start: S
accept: S, SB, AS
S 0 -> A
A 1 -> SB
SB 0 -> AS
AS 0 -> A
AS 1 -> SB`,
      hints: [String.raw`Start with $\{s\}$ (there are no $\varepsilon$-moves). On 0 it goes to $\{a\}$; on 1 to $\varnothing$.`, String.raw`$\{a\}$ on 1 goes to $\{s, b\}$. Keep going until no new subsets appear.`],
      solution: String.raw`| subset | 0 | 1 | accept |
|---|---|---|---|
| $\{s\}$ | $\{a\}$ | $\varnothing$ | yes |
| $\{a\}$ | $\varnothing$ | $\{s,b\}$ | no |
| $\{s,b\}$ | $\{a,s\}$ | $\varnothing$ | yes |
| $\{a,s\}$ | $\{a\}$ | $\{s,b\}$ | yes |
| $\varnothing$ | $\varnothing$ | $\varnothing$ | no |

E.g. $\{s,b\}$ on 0: $s \to a$, $b \to s$, giving $\{a, s\}$. On 1 neither $s$ nor $b$ moves. Accepting subsets are those containing $s$. Only 5 of the 8 subsets are reachable.`,
    },
    {
      id: 'nfa-last-seen-before', type: 'nfa', title: 'Last symbol appeared earlier', difficulty: 3,
      alphabet: 'abc',
      prompt: String.raw`Over $\{a,b,c\}$, build an NFA for the strings whose **last symbol also appears somewhere earlier** in the string. Examples: $aa$, $abca$, $bcab$ are in; $abc$, $a$, $\varepsilon$ are out.`,
      accepts: s => s.length >= 2 && s.slice(0, -1).includes(s[s.length - 1]),
      sample: String.raw`start: s
accept: f
s a -> s, pa
s b -> s, pb
s c -> s, pc
pa a -> pa, f
pa b,c -> pa
pb b -> pb, f
pb a,c -> pb
pc c -> pc, f
pc a,b -> pc`,
      hints: [String.raw`Guess the earlier occurrence, and remember which symbol it was in the state.`, String.raw`From state "remembered $x$", guess that the current $x$ is the last symbol and jump to an accepting state with no outgoing transitions.`],
      solution: String.raw`Start $s$ loops on everything. On reading $x$ it may also guess "this occurrence of $x$ will reappear as the last symbol", moving to $p_x$. State $p_x$ loops on everything; on reading $x$ it may also guess "this is the last symbol" and move to the accepting state $f$, which has no outgoing transitions (so the guess is verified only if the input ends there). 5 states. A DFA must remember which symbols have appeared and what the last symbol is, about $2^3 \cdot 3$ states.`,
    },
    {
      id: 'nfa-elim-written', type: 'written', title: 'State elimination', difficulty: 2,
      prompt: String.raw`Use state elimination to convert the following DFA over $\{a,b\}$ into a regular expression. States: $p$ (start), $q$ (accepting). Transitions: $p \xrightarrow{a} p$, $p \xrightarrow{b} q$, $q \xrightarrow{a} p$, $q \xrightarrow{b} q$. Show the generalized NFA after each elimination, and describe the language in English.`,
      rubric: [
        'Adds a new start state S with ε to p and a new accept F with ε from q',
        'Eliminates states one at a time with the R_pq R_qq* R_qr rule, combining parallel edges with +',
        'Obtains a correct regex, e.g. a*b(b + aa*b)* or (a+b)*b',
        'English description: strings ending in b',
      ],
      hints: [String.raw`Try eliminating $p$ first: it has a self-loop $a$, in-edges from $S$ ($\varepsilon$) and $q$ ($a$), out-edge to $q$ ($b$).`],
      solution: String.raw`Add $S \xrightarrow{\varepsilon} p$ and $q \xrightarrow{\varepsilon} F$.

**Eliminate $p$** (self-loop $a$, out-edge $p \xrightarrow{b} q$):
- from $S$: $S \xrightarrow{\varepsilon a^* b} q$, i.e. $S \xrightarrow{a^*b} q$;
- from $q$: $q \xrightarrow{a a^* b} q$, combined with the existing loop $b$: $q$'s loop becomes $b + aa^*b$.

**Eliminate $q$** (loop $b + aa^*b$): $S \xrightarrow{a^*b(b + aa^*b)^*} F$.

Result: $a^*b(b + aa^*b)^*$. The DFA is in $q$ exactly when the last symbol read was $b$, so the language is "strings ending in $b$", equivalently $(a+b)^*b$. Different elimination orders give different-looking but equivalent regexes.`,
    },
    {
      id: 'nfa-blowup-proof', type: 'written', title: 'Lower bound for "k-th from the end"', difficulty: 3,
      prompt: String.raw`Let $L_k = \{w \in \{0,1\}^* : |w| \ge k \text{ and the } k\text{-th symbol from the end of } w \text{ is } 1\}$. Prove that every DFA for $L_k$ has at least $2^k$ states.`,
      rubric: [
        'Considers the 2^k strings of length k',
        'For distinct x ≠ y picks a position i where they differ (WLOG x_i = 1, y_i = 0)',
        'Chooses suffix z = 0^(i−1) and verifies xz ∈ L_k, yz ∉ L_k (position i becomes k-th from the end)',
        'Concludes via: if δ*(s,x) = δ*(s,y) then δ*(s,xz) = δ*(s,yz), contradiction; so 2^k distinct states',
      ],
      hints: [String.raw`Show that any two distinct strings of length $k$ must end in different states.`, String.raw`If $x$ and $y$ differ at position $i$, how many symbols must you append so that position $i$ is $k$-th from the end?`],
      solution: String.raw`Let $M$ be any DFA for $L_k$ with start state $s$. Consider the $2^k$ strings in $\{0,1\}^k$. We show they reach pairwise different states.

Take $x \ne y$ of length $k$, differing at some position $i$ ($1 \le i \le k$); WLOG $x_i = 1$, $y_i = 0$. Let $z = 0^{i-1}$. In $xz$ (length $k + i - 1$), the symbol at position $i$ has $(k - i) + (i - 1) = k - 1$ symbols after it, so it is the $k$-th from the end; it is $1$, hence $xz \in L_k$. By the same count, $yz$ has $0$ there, hence $yz \notin L_k$.

If $\delta^*(s,x) = \delta^*(s,y)$ then $\delta^*(s,xz) = \delta^*(\delta^*(s,x), z) = \delta^*(\delta^*(s,y), z) = \delta^*(s,yz)$, so $M$ would accept both or neither — contradiction. Hence the $2^k$ strings reach $2^k$ distinct states. $\blacksquare$`,
    },
    {
      id: 'nfa-complement-written', type: 'written', title: 'Why NFAs resist complement', difficulty: 2,
      prompt: String.raw`(a) Give a concrete NFA $N$ over $\{0,1\}$ such that swapping the accepting and non-accepting states of $N$ does **not** produce an NFA for $\overline{L(N)}$. Identify a string on which it fails. (b) Describe a correct procedure to build an automaton for $\overline{L(N)}$ and give an upper bound on its size in terms of $n = |Q|$.`,
      rubric: [
        'Valid counterexample NFA with nondeterminism (or missing transitions)',
        'A specific string accepted (or rejected) by both N and the swapped machine, with explanation',
        'Procedure: subset construction to a complete DFA (including ∅), then swap accepting states',
        'Size bound 2^n',
      ],
      hints: [String.raw`Two runs on the same string, one ending in an accepting state, one not.`, String.raw`Missing transitions are also a problem: a string on which every run dies is rejected by both machines.`],
      solution: String.raw`(a) Let $N$ have states $s$ (start, non-accepting) and $f$ (accepting), with $s \xrightarrow{0} s$ and $s \xrightarrow{0} f$. Then $L(N) = 00^*$: $\varepsilon$ ends in $s$ and is rejected, while $0^k$ for $k \ge 1$ has a run ending in $f$. Swapped machine $N'$: $s$ accepting, $f$ not. On input $0$, $N'$ has a run ending in $s$, so $N'$ accepts $0$, though $0 \in L(N)$. Also, on input $1$ every run of both machines dies immediately, so both reject $1$, though $1 \notin L(N)$ should be accepted by the complement.

(b) Apply the subset construction to get a DFA $D$ with $L(D) = L(N)$, making sure it is complete (include $\varnothing$ as an explicit dead state). Then swap accepting and non-accepting states of $D$. The result has at most $2^n$ states.`,
    },
    {
      id: 'nfa-fourth-last-0', type: 'nfa', title: 'Fourth symbol from the end is 0', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build an NFA with 5 states for the binary strings whose fourth symbol from the end is $0$. Examples: $0111$, $10000$ are in; $1000$, $000$ are out.`,
      accepts: s => s.length >= 4 && s[s.length - 4] === '0',
      sample: String.raw`start: q0
accept: q4
q0 0 -> q0, q1
q0 1 -> q0
q1 0,1 -> q2
q2 0,1 -> q3
q3 0,1 -> q4`,
      hints: [String.raw`Guess which 0 is the fourth from the end.`, String.raw`After the guess, exactly three more symbols must follow, and the accepting state must have no outgoing edges.`],
      solution: String.raw`$q_0$ loops on both symbols; on a $0$ it may also guess "this is the fourth symbol from the end" and move to $q_1$. The chain $q_1 \to q_2 \to q_3 \to q_4$ reads any three symbols, and $q_4$ is accepting with no outgoing transitions, so the thread survives only if the input ends exactly three symbols after the guessed 0.

Completeness: if the fourth-from-last symbol is 0, guess it. Soundness: an accepting thread jumped on a 0 that has exactly three symbols after it. (The smallest DFA needs $2^4 = 16$ states.)`,
      tags: ['guess-and-verify', 'k-th from end'],
    },
    {
      id: 'nfa-both-00-11', type: 'nfa', title: 'Contains both 00 and 11', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build an NFA for the binary strings that contain **both** $00$ and $11$ as substrings (in either order). Examples: $0011$, $11000$, $010011$ are in; $0101$, $000$, $0110$ are out.`,
      accepts: s => s.includes('00') && s.includes('11'),
      sample: String.raw`start: s
accept: f
s 0 -> s, a1
s 1 -> s, b1
a1 0 -> a2
a2 0,1 -> a2
a2 1 -> a3
a3 1 -> f
b1 1 -> b2
b2 0,1 -> b2
b2 0 -> b3
b3 0 -> f
f 0,1 -> f`,
      hints: [String.raw`Guess which of the two substrings occurs first.`, String.raw`Branch A: wait, read $00$, wait, read $11$. Branch B: the same with the roles swapped. Note that $00$ and $11$ can never overlap.`],
      solution: String.raw`Two branches out of the waiting state $s$ (which loops on $0,1$):

- **$00$ first:** $s \xrightarrow{0} a_1 \xrightarrow{0} a_2$; $a_2$ loops on everything; then $a_2 \xrightarrow{1} a_3 \xrightarrow{1} f$.
- **$11$ first:** $s \xrightarrow{1} b_1 \xrightarrow{1} b_2$; $b_2$ loops; then $b_2 \xrightarrow{0} b_3 \xrightarrow{0} f$.

$f$ is accepting and loops on everything. If a string contains both, one of them has an earlier starting position; since $00$ and $11$ cannot overlap, the other occurrence starts after the first one ends, so the corresponding branch accepts. Conversely an accepting run has read both substrings.

(Equivalently this is the intersection of two "contains" languages; a product DFA needs $3 \times 3 = 9$ states before merging, while the NFA is written down directly.)`,
      tags: ['guess-and-verify', 'substring'],
    },
    {
      id: 'nfa-odd-run-0', type: 'nfa', title: 'Some block of 0s has odd length', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`A *block* is a maximal run of equal symbols. Build an NFA for the binary strings that have **some block of 0s of odd length**. Examples: $0$, $1000$, $010$, $1101$ are in; $\varepsilon$, $11$, $0011$, $1001$ are out.`,
      accepts: s => s.split('1').some(b => b.length % 2 === 1),
      sample: String.raw`start: s0
accept: o, f
s0 1 -> s0
s0 0 -> s, o
s 0 -> s
s 1 -> s0
o 0 -> e
o 1 -> f
e 0 -> o
f 0,1 -> f`,
      hints: [String.raw`Guess where the odd block starts. A block of 0s can only start at the very beginning or right after a 1 — your NFA must remember whether it is at such a boundary.`, String.raw`Inside the guessed block, count mod 2; the block ends at a 1 or at the end of the input.`],
      solution: String.raw`States:
- $s_0$ (start): "the next symbol could begin a new block of 0s" (we are at the beginning or just read a 1).
- $s$: "we are in the middle of a block of 0s that we did not choose".
- $o$ / $e$: "inside the chosen block, odd / even number of 0s so far".
- $f$: "the chosen block ended with odd length" (accepting, loops on everything).

Transitions: $s_0 \xrightarrow{1} s_0$; $s_0 \xrightarrow{0} s$ (don't choose) or $o$ (choose); $s \xrightarrow{0} s$, $s \xrightarrow{1} s_0$; $o \xrightarrow{0} e \xrightarrow{0} o$; $o \xrightarrow{1} f$ (block ended, odd); $e \xrightarrow{1}$ nothing (wrong guess dies). Accepting: $o$ (block runs to the end of the input with odd length) and $f$.

The key soundness point: you may enter $o$ only from $s_0$. If the start loop were allowed to jump into $o$ on *any* 0, the NFA would accept $00$ by starting the "block" at the second 0.`,
      tags: ['guess-and-verify', 'blocks'],
    },
    {
      id: 'nfa-eps-parity-union', type: 'nfa', title: 'Even 0s or 1s divisible by 3', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Using $\varepsilon$-transitions, build an NFA for the binary strings in which the number of 0s is even **or** the number of 1s is divisible by 3.`,
      accepts: s => (s.split('0').length - 1) % 2 === 0 || (s.split('1').length - 1) % 3 === 0,
      sample: String.raw`start: s
accept: e0, t0
s eps -> e0, t0
e0 0 -> e1
e0 1 -> e0
e1 0 -> e0
e1 1 -> e1
t0 1 -> t1
t1 1 -> t2
t2 1 -> t0
t0 0 -> t0
t1 0 -> t1
t2 0 -> t2`,
      hints: [String.raw`Build a 2-state DFA for "even number of 0s" and a 3-state DFA for "number of 1s divisible by 3", then fork into both with $\varepsilon$.`],
      solution: String.raw`New start $s$ with $s \xrightarrow{\varepsilon} e_0$ and $s \xrightarrow{\varepsilon} t_0$.

- $e_0, e_1$ track the parity of 0s ($0$ swaps them, $1$ loops); $e_0$ accepting.
- $t_0, t_1, t_2$ count 1s mod 3 ($1$ advances, $0$ loops); $t_0$ accepting.

6 states, versus 6 for the product DFA — but the NFA needed no thought about combining the two conditions. The $\varepsilon$-fork pattern works for any finite union.`,
      tags: ['epsilon', 'union'],
    },
    {
      id: 'nfa-repeat-gap3', type: 'nfa', title: 'Equal symbols three apart', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build an NFA for the binary strings containing a substring of the form $axya$ where $a, x, y \in \{0,1\}$ — i.e. some symbol is repeated exactly three positions later. Examples: $0110$, $1001$, $00000$, $011011$ are in; $\varepsilon$, $011$, $010$, $0101$ are out.`,
      accepts: s => /(.)..\1/.test(s),
      sample: String.raw`start: q
accept: f
q 0 -> q, z1
q 1 -> q, o1
z1 0,1 -> z2
z2 0,1 -> z3
z3 0 -> f
o1 0,1 -> o2
o2 0,1 -> o3
o3 1 -> f
f 0,1 -> f`,
      hints: [String.raw`Guess the first of the two equal symbols and remember which symbol it was.`, String.raw`One chain per symbol: read any two symbols, then require the remembered symbol.`],
      solution: String.raw`$q$ loops on everything. On reading $0$ it may guess "this 0 repeats three positions later": go to $z_1$, read any two symbols ($z_1 \to z_2 \to z_3$), then require a $0$ ($z_3 \xrightarrow{0} f$). Symmetrically for 1 with $o_1, o_2, o_3$. $f$ accepts and loops. 9 states.

The NFA *remembers the guessed symbol in its state* — the general trick when the verification depends on what was guessed.`,
      tags: ['guess-and-verify', 'remember a symbol'],
    },
    {
      id: 'nfa-subset-eps-dfa', type: 'dfa', title: 'Subset construction with epsilon-moves', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Apply the incremental subset construction to the $\varepsilon$-NFA below and enter the resulting DFA (name states after subsets, e.g. <code>SAC</code>). Then describe the language in English.

~~~pseudo
start: s
accept: a, d
s eps -> a, c
a 0 -> a
a 1 -> b
b 1 -> a
c 1 -> c
c 0 -> d
d 0 -> c
d eps -> s
~~~`,
      accepts: s => s.match(/1*$/)[0].length % 2 === 0,
      sample: String.raw`start: SAC
accept: SAC, SACD, AC
SAC 0 -> SACD
SAC 1 -> BC
SACD 0 -> SACD
SACD 1 -> BC
BC 0 -> SACD
BC 1 -> AC
AC 0 -> SACD
AC 1 -> BC`,
      hints: [String.raw`$\varepsilon\text{-reach}(s) = \{s, a, c\}$ and $\varepsilon\text{-reach}(d) = \{d, s, a, c\}$; the other states reach only themselves.`, String.raw`From $\{s,a,c\}$ on 0: $a \to a$, $c \to d$; closing gives $\{s, a, c, d\}$. On 1: $a \to b$, $c \to c$, giving $\{b, c\}$.`],
      solution: String.raw`| subset | 0 | 1 | accept? |
|---|---|---|---|
| $\{s,a,c\}$ | $\{s,a,c,d\}$ | $\{b,c\}$ | yes |
| $\{s,a,c,d\}$ | $\{s,a,c,d\}$ | $\{b,c\}$ | yes |
| $\{b,c\}$ | $\{s,a,c,d\}$ | $\{a,c\}$ | no |
| $\{a,c\}$ | $\{s,a,c,d\}$ | $\{b,c\}$ | yes |

Sample computations: $\{b,c\}$ on 0: $b$ has no 0-move, $c \to d$, and $\varepsilon\text{-reach}(d) = \{d,s,a,c\}$. $\{b,c\}$ on 1: $b \to a$, $c \to c$: $\{a, c\}$ (no closure to add). $\{s,a,c,d\}$ on 0: $a \to a$, $c \to d$, $d \to c$: raw $\{a, c, d\}$, closed $\{s,a,c,d\}$.

Reading the DFA: every 0 leads to an accepting state, and each 1 toggles between rejecting $\{b,c\}$ and accepting. So the DFA accepts iff **the final run of 1s has even length** (possibly zero). Four subsets out of $2^5 = 32$; $\varnothing$ is unreachable.`,
      tags: ['subset construction', 'epsilon'],
    },
    {
      id: 'nfa-ones-gap-mult3', type: 'nfa', title: 'Two 1s at distance divisible by 3', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build an NFA for the binary strings that contain two 1s at positions $i < j$ with $j - i$ divisible by 3. Examples: $1001$, $1111$, $0100101$ are in; $11$, $101$, $10101$ are out ($10101$ has 1s at distances 2, 2 and 4).`,
      accepts: s => { for (let i = 0; i < s.length; i++) for (let j = i + 3; j < s.length; j += 3) if (s[i] === '1' && s[j] === '1') return true; return false; },
      sample: String.raw`start: q0
accept: f
q0 0 -> q0
q0 1 -> q0, c0
c0 0,1 -> c1
c1 0,1 -> c2
c2 0 -> c0
c2 1 -> c0, f
f 0,1 -> f`,
      hints: [String.raw`Guess the first 1, then count the distance mod 3.`, String.raw`States $c_0, c_1, c_2$: "the distance from the guessed 1 to the last symbol read is $\equiv 0, 1, 2 \pmod 3$". From $c_2$, reading a 1 makes the distance $\equiv 0$ — guess it is the second 1.`],
      solution: String.raw`$q_0$ waits (loops on $0,1$) and on a 1 may guess "this is the first 1", entering $c_0$. Then $c_0 \xrightarrow{0,1} c_1 \xrightarrow{0,1} c_2 \xrightarrow{0,1} c_0$ counts the distance mod 3. From $c_2$, a 1 lands at distance $\equiv 0 \pmod 3$ (and at least 3, since we passed through $c_1$ and $c_2$), so the NFA may also move to the accepting state $f$, which loops on everything.

Why not accept in $c_0$ directly? Because $c_0$ is also the state right after the guessed 1 itself (distance 0), and because $c_0$ is reached on 0s as well; acceptance must happen exactly on a 1 at the right distance. 5 states.`,
      tags: ['guess-and-verify', 'counting mod k'],
    },
    {
      id: 'nfa-missing-symbol', type: 'nfa', title: 'Some symbol is missing (NFA)', difficulty: 1,
      alphabet: 'abc',
      prompt: String.raw`Over $\{a, b, c\}$, build an NFA with 4 states for the strings in which **at least one** of the three symbols does not appear at all. Examples: $\varepsilon$, $abab$, $ccc$ are in; $abc$, $cbba$ are out.`,
      accepts: s => !s.includes('a') || !s.includes('b') || !s.includes('c'),
      sample: String.raw`start: s
accept: na, nb, nc
s eps -> na, nb, nc
na b,c -> na
nb a,c -> nb
nc a,b -> nc`,
      hints: [String.raw`Guess which symbol is missing.`],
      solution: String.raw`An $\varepsilon$-fork from $s$ into three accepting states $n_a, n_b, n_c$, where $n_x$ loops on the two symbols other than $x$ and has no transition on $x$. The thread $n_x$ survives exactly when $x$ never appears. A DFA must remember the set of symbols seen so far and needs $2^3 = 8$ states — see the next problem.`,
      tags: ['epsilon', 'union', 'blowup'],
    },
    {
      id: 'nfa-missing-symbol-dfa', type: 'dfa', title: 'Some symbol is missing (DFA)', difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Build a **DFA** for the same language: strings over $\{a,b,c\}$ in which at least one symbol never appears. (Apply the subset construction to the 4-state NFA, or design it directly. The minimal complete DFA has 8 states; you may leave the dead state implicit.)`,
      accepts: s => !s.includes('a') || !s.includes('b') || !s.includes('c'),
      sample: String.raw`start: e
accept: e, A, B, C, AB, AC, BC
e a -> A
e b -> B
e c -> C
A a -> A
A b -> AB
A c -> AC
B a -> AB
B b -> B
B c -> BC
C a -> AC
C b -> BC
C c -> C
AB a,b -> AB
AC a,c -> AC
BC b,c -> BC`,
      hints: [String.raw`State = the set of symbols seen so far.`, String.raw`Once all three have been seen, the string can never get back into the language.`],
      solution: String.raw`States are the subsets of $\{a,b,c\}$ seen so far: $\varnothing$ (start), $\{a\}, \{b\}, \{c\}, \{a,b\}, \{a,c\}, \{b,c\}$ (all accepting) and $\{a,b,c\}$ (rejecting, absorbing — the implicit dead state). Reading $x$ adds $x$ to the set.

The subset construction on the NFA gives the same machine: after reading $w$ the NFA is in $\{n_x : x \notin w\}$ (plus $s$ at the start), so the subset of surviving branches is the complement of the set of symbols seen.

All 8 states are necessary: strings with different symbol sets $S \neq T$ are distinguished by appending the symbols not in $S$ (if $\sigma \in S \setminus T$, then $x$'s extension contains all symbols and is rejected, $y$'s still misses $\sigma$ and is accepted; if $S \subsetneq T$ swap the roles).`,
      tags: ['subset construction', 'blowup'],
    },
    {
      id: 'nfa-elim-mod3', type: 'regex', title: 'State elimination: #a ≡ #b (mod 3)', difficulty: 3,
      alphabet: 'ab',
      prompt: String.raw`The DFA with states $0, 1, 2$ (start and accept $0$), where reading $a$ adds 1 and reading $b$ subtracts 1 modulo 3, accepts $\{w \in \{a,b\}^* : \#_a(w) \equiv \#_b(w) \pmod 3\}$. Use state elimination (eliminate state 2, then state 1) to obtain a regular expression for this language.`,
      accepts: s => { let d = 0; for (const c of s) d += c === 'a' ? 1 : -1; return ((d % 3) + 3) % 3 === 0; },
      sample: String.raw`(ba + (a+bb)(ab)*(b+aa))*`,
      hints: [String.raw`Edges: $0 \xrightarrow{a} 1$, $0 \xrightarrow{b} 2$, $1 \xrightarrow{a} 2$, $1 \xrightarrow{b} 0$, $2 \xrightarrow{a} 0$, $2 \xrightarrow{b} 1$. State 2 has in-edges from 0 ($b$) and 1 ($a$), out-edges to 0 ($a$) and 1 ($b$), no self-loop.`, String.raw`After eliminating 2: loop on 0 is $ba$, $0 \to 1$ is $a + bb$, $1 \to 0$ is $b + aa$, loop on 1 is $ab$.`],
      solution: String.raw`Add $S \xrightarrow{\varepsilon} 0$ and $0 \xrightarrow{\varepsilon} F$.

**Eliminate 2** (no self-loop). Pairs (in, out): $0 \xrightarrow{b} 2 \xrightarrow{a} 0$ gives loop $ba$ on 0; $0 \xrightarrow{b} 2 \xrightarrow{b} 1$ gives $bb$, unioned with the existing $a$: $0 \xrightarrow{a+bb} 1$; $1 \xrightarrow{a} 2 \xrightarrow{a} 0$ gives $aa$, unioned with $b$: $1 \xrightarrow{b+aa} 0$; $1 \xrightarrow{a} 2 \xrightarrow{b} 1$ gives loop $ab$ on 1.

**Eliminate 1** (self-loop $ab$): new loop contribution on 0 is $(a+bb)(ab)^*(b+aa)$. Loop on 0: $ba + (a+bb)(ab)^*(b+aa)$.

**Eliminate 0**: $S \to F$ labeled
$$\big(ba + (a+bb)(ab)^*(b+aa)\big)^*.$$

Any equivalent regex is accepted by the grader; other elimination orders give different-looking answers.`,
      tags: ['state elimination'],
    },
    {
      id: 'nfa-suffix-seen-before', type: 'nfa', title: 'Last two symbols appeared earlier', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build an NFA for the binary strings $w$ with $|w| \ge 3$ whose **last two symbols** also occur as a substring of $w$ starting at an **earlier** position (the occurrences may overlap). Examples: $0101$ (01 at positions 1–2), $000$ (00 at positions 1–2, overlapping the final 00), $1010$ are in; $010$, $0110$, $00$ are out.`,
      accepts: s => s.length >= 3 && s.indexOf(s.slice(-2)) < s.length - 2,
      sample: String.raw`start: s
accept: f
s 0 -> s, p0
s 1 -> s, p1
p0 0 -> r00, t00
p0 1 -> r01
p1 0 -> r10
p1 1 -> r11, t11
r00 0,1 -> r00
r01 0,1 -> r01
r10 0,1 -> r10
r11 0,1 -> r11
r00 0 -> t00
r01 0 -> t01
r10 1 -> t10
r11 1 -> t11
t00 0 -> f
t01 1 -> f
t10 0 -> f
t11 1 -> f`,
      hints: [String.raw`Guess where the earlier occurrence starts, read it, and remember the two symbols $xy$ in the state. Later, guess that the final two symbols start, and check they equal $xy$.`, String.raw`Overlap: the earlier occurrence can end exactly where the final one begins (as in $000$). That only happens when $x = y$; add a shortcut for it.`],
      solution: String.raw`States:
- $s$: waiting (loops on everything).
- $p_x$: "the earlier occurrence starts with $x$".
- $r_{xy}$: "an earlier occurrence of $xy$ has been read" (loops on everything).
- $t_{xy}$: "we guessed the final two symbols begin, and the first one matched $x$".
- $f$: accepting, no outgoing edges (the input must end here).

Transitions: $s \xrightarrow{x} p_x$; $p_x \xrightarrow{y} r_{xy}$; $r_{xy} \xrightarrow{x} t_{xy}$; $t_{xy} \xrightarrow{y} f$. Through $r_{xy}$ the final occurrence starts strictly after the earlier one ends. The only remaining case is overlap by one symbol: the earlier occurrence at positions $n-2, n-1$ and the final at $n-1, n$; then $x = w_{n-1} = y$, so add $p_x \xrightarrow{x} t_{xx}$, which uses the second symbol of the earlier occurrence as the first symbol of the final one.

Completeness: if $w$ has an earlier occurrence of its last two symbols, follow the matching branch. Soundness: every accepting run read an occurrence of $xy$ starting before the final $xy$, which ends the input.`,
      tags: ['guess-and-verify', 'remember a symbol'],
    },
    {
      id: 'nfa-subset-written', type: 'written', title: 'Carry out a subset construction', difficulty: 2,
      prompt: String.raw`Consider the NFA $N$ over $\{0,1\}$ with states $s$ (start), $p$, $q$, $f$ (accepting) and transitions
$$s \xrightarrow{0,1} s,\quad s \xrightarrow{1} p,\quad p \xrightarrow{\varepsilon} f,\quad p \xrightarrow{0} q,\quad q \xrightarrow{0,1} f,\quad f \xrightarrow{\varepsilon} s.$$
(a) Compute $\varepsilon\text{-reach}$ of every state. (b) Carry out the incremental subset construction, presenting the result as a table with one row per reachable subset. (c) Give a regular expression for $L(N)$ and explain it.`,
      rubric: [
        'ε-reach: s→{s}, p→{p,f,s}, q→{q}, f→{f,s}',
        'Start subset {s}; ε-closure applied after every move',
        'Exactly 4 reachable rows: {s}, {s,p,f}, {s,q}, {s,f} with correct transitions',
        'Accepting rows are those containing f: {s,p,f} and {s,f}',
        'Language Σ*(1 + 100), with an explanation from the table',
      ],
      hints: [String.raw`$\varepsilon\text{-reach}(p) = \{p, f, s\}$ because $p \to f \to s$.`, String.raw`$\{s, p, f\}$ on 0: $s \to s$, $p \to q$, $f$ has no 0-move. Raw $\{s, q\}$, already closed.`],
      solution: String.raw`(a) $\varepsilon\text{-reach}(s) = \{s\}$, $\varepsilon\text{-reach}(p) = \{p, f, s\}$, $\varepsilon\text{-reach}(q) = \{q\}$, $\varepsilon\text{-reach}(f) = \{f, s\}$.

(b)

| subset | 0 | 1 | accept? |
|---|---|---|---|
| $\{s\}$ | $\{s\}$ | $\{s,p,f\}$ | no |
| $\{s,p,f\}$ | $\{s,q\}$ | $\{s,p,f\}$ | yes |
| $\{s,q\}$ | $\{s,f\}$ | $\{s,p,f\}$ | no |
| $\{s,f\}$ | $\{s\}$ | $\{s,p,f\}$ | yes |

Details: $\{s\}$ on 1: $s \to s, p$; closure adds $f$. $\{s,q\}$ on 0: $s \to s$, $q \to f$; closure of $\{s, f\}$ is $\{s, f\}$. $\{s,q\}$ on 1: $s \to s, p$ and $q \to f$; closure $\{s, p, f\}$. $\{s,f\}$ on 0: only $s \to s$.

(c) Every 1 leads to the accepting row $\{s,p,f\}$. From there, $0$ leads to a rejecting row, and a second $0$ to the accepting row $\{s,f\}$; a third $0$ returns to $\{s\}$. So the DFA accepts exactly the strings that **end in $1$ or end in $100$**: $(0+1)^*(1 + 100)$.

In NFA terms: the branch $s \xrightarrow{1} p \xrightarrow{\varepsilon} f$ guesses "this 1 is the last symbol"; the branch $s \xrightarrow{1} p \xrightarrow{0} q \xrightarrow{0,1} f$ guesses "the input ends with $10$ followed by one more symbol" (if that symbol is 1 the string ends in 1 anyway, so the new strings are those ending in $100$). The edge $f \xrightarrow{\varepsilon} s$ only returns the thread to the waiting loop, so acceptance still requires the guessed pattern to sit at the very end.`,
    },
    {
      id: 'nfa-thompson-written', type: 'written', title: "Thompson's construction by hand", difficulty: 2,
      prompt: String.raw`(a) Apply Thompson's construction to $(0 + 11)^*0$. List the states and transitions (name the states so a grader can follow), and state how many states the result has. (b) Compute the $\varepsilon$-reach of the start state. (c) Give a hand-built NFA for the same language with at most 3 states.`,
      rubric: [
        'Leaves: one 2-state gadget per symbol occurrence (0, 1, 1, 0)',
        'Concatenation 11 via an ε-bridge (no new states); union with new fork/join states; star with new start/accept, skip edge and loop-back edge',
        'Final concatenation with the last 0; total of 12 states',
        'Correct ε-reach of the start state',
        'Correct small NFA, e.g. s loops on 0, s→t on 1, t→s on 1, s→f on 0',
      ],
      hints: [String.raw`Count first: each symbol occurrence gives 2 states, $+$ and $^*$ add 2 each, concatenation adds 0.`, String.raw`4 symbols $\Rightarrow$ 8 states, one union $\Rightarrow$ 10, one star $\Rightarrow$ 12.`],
      solution: String.raw`(a) Gadgets: $c_1 \xrightarrow{0} d_1$ (first 0); $c_2 \xrightarrow{1} d_2$ and $c_3 \xrightarrow{1} d_3$, joined by $d_2 \xrightarrow{\varepsilon} c_3$ (this is $11$); union: $u \xrightarrow{\varepsilon} c_1$, $u \xrightarrow{\varepsilon} c_2$, $d_1 \xrightarrow{\varepsilon} v$, $d_3 \xrightarrow{\varepsilon} v$. Star: $x \xrightarrow{\varepsilon} u$, $x \xrightarrow{\varepsilon} y$, $v \xrightarrow{\varepsilon} u$, $v \xrightarrow{\varepsilon} y$. Last 0: $c_4 \xrightarrow{0} d_4$ with $y \xrightarrow{\varepsilon} c_4$. Start $x$, accept $d_4$.

States: $x, u, c_1, d_1, c_2, d_2, c_3, d_3, v, y, c_4, d_4$ — **12 states**.

(b) $\varepsilon\text{-reach}(x) = \{x, u, y, c_1, c_2, c_4\}$.

(c) $L = (0+11)^*0$: strings ending in 0 in which every maximal block of 1s has even length. Hand-built: $s \xrightarrow{0} s$, $s \xrightarrow{1} t$, $t \xrightarrow{1} s$, $s \xrightarrow{0} f$, accepting $f$ (3 states). The $s \xrightarrow{0} f$ edge guesses that this 0 is the final one.`,
    },
    {
      id: 'nfa-subset-proof', type: 'written', title: 'Prove the subset construction correct', difficulty: 3,
      prompt: String.raw`Let $N = (Q, \Sigma, \delta, s, A)$ be an NFA with $\varepsilon$-transitions, and let $D$ be the DFA with states $2^Q$, start $S_0 = \varepsilon\text{-reach}(s)$, transitions $\delta'(S, a) = \varepsilon\text{-reach}\big(\bigcup_{q \in S}\delta(q,a)\big)$ and accepting states $\{S : S \cap A \neq \varnothing\}$. Prove that $L(D) = L(N)$. State clearly which characterization of $\delta^*$ for NFAs you use.`,
      rubric: [
        'States a characterization of δ* (e.g. walks spelling w) and the left-to-right rule δ*(s,xa) = ε-reach(∪_{r∈δ*(s,x)} δ(r,a)), with justification',
        'Lemma δ\'*(S0, w) = δ*(s, w) by induction on |w|',
        'Correct base case w = ε',
        'Correct inductive step for w = xa using the IH and the left-to-right rule',
        'Concludes L(D) = L(N) from the acceptance conditions',
      ],
      hints: [String.raw`Prove the stronger statement $\delta'^*(S_0, w) = \delta^*(s, w)$ for all $w$.`, String.raw`For the inductive step you need $\delta^*(s, xa)$ in terms of $\delta^*(s, x)$. Justify it by looking at the last $a$-edge on a walk spelling $xa$.`],
      solution: String.raw`**Characterization.** $q \in \delta^*(p, w)$ iff there is a walk from $p$ to $q$ whose labels, with $\varepsilon$s erased, spell $w$.

**Left-to-right rule.** For $a \in \Sigma$: $\delta^*(s, xa) = \varepsilon\text{-reach}\big(\bigcup_{r \in \delta^*(s,x)}\delta(r,a)\big)$. ($\subseteq$) A walk spelling $xa$ contains a last $a$-edge $r \xrightarrow{a} p$; the prefix of the walk before it spells $x$, so $r \in \delta^*(s,x)$; after it come only $\varepsilon$-edges, so the endpoint is in $\varepsilon\text{-reach}(p)$. ($\supseteq$) Concatenate a walk spelling $x$ ending at $r$, the edge $r \xrightarrow{a} p$, and an $\varepsilon$-walk from $p$.

**Lemma.** $\delta'^*(S_0, w) = \delta^*(s, w)$ for all $w \in \Sigma^*$. By induction on $|w|$.
- $w = \varepsilon$: $\delta'^*(S_0, \varepsilon) = S_0 = \varepsilon\text{-reach}(s) = \delta^*(s, \varepsilon)$ (walks spelling $\varepsilon$ use only $\varepsilon$-edges).
- $w = xa$: $\delta'^*(S_0, xa) = \delta'(\delta'^*(S_0, x), a) = \delta'(\delta^*(s, x), a)$ by the induction hypothesis, $= \varepsilon\text{-reach}\big(\bigcup_{r \in \delta^*(s,x)}\delta(r,a)\big)$ by definition of $\delta'$, $= \delta^*(s, xa)$ by the left-to-right rule.

**Theorem.** $w \in L(D) \iff \delta'^*(S_0, w) \cap A \ne \varnothing \iff \delta^*(s, w) \cap A \ne \varnothing \iff w \in L(N)$. $\blacksquare$

Remark: the incremental construction keeps only subsets reachable from $S_0$; since $D$ never visits the others, its language is unchanged.`,
    },
    {
      id: 'nfa-eps-removal', type: 'written', title: 'Removing epsilon-transitions', difficulty: 2,
      prompt: String.raw`(a) Describe how to convert an NFA $N = (Q, \Sigma, \delta, s, A)$ with $\varepsilon$-transitions into an equivalent NFA $N'$ **without** $\varepsilon$-transitions and with the same state set $Q$. (b) Prove $L(N') = L(N)$. (c) Apply your construction to the NFA $s \xrightarrow{\varepsilon} p$, $p \xrightarrow{0} p$, $p \xrightarrow{1} f$, $f \xrightarrow{\varepsilon} s$ with $f$ accepting.`,
      rubric: [
        "δ'(q,a) = ε-reach(∪_{r∈ε-reach(q)} δ(r,a)) (or an equivalent definition)",
        "A' = {q : ε-reach(q) ∩ A ≠ ∅}, with the reason (the empty string)",
        "Proof: δ'*(s,w) = δ*(s,w) for nonempty w (induction) and the ε case handled separately",
        'Correct application in (c)',
      ],
      hints: [String.raw`A single new $a$-edge should stand for "$\varepsilon$-moves, then one $a$-move, then $\varepsilon$-moves".`, String.raw`Why must the accepting set change? Think about the empty input.`],
      solution: String.raw`(a) $N' = (Q, \Sigma, \delta', s, A')$ with $\delta'(q, a) = \varepsilon\text{-reach}\big(\bigcup_{r \in \varepsilon\text{-reach}(q)} \delta(r, a)\big)$ and $A' = \{q : \varepsilon\text{-reach}(q) \cap A \ne \varnothing\}$.

(b) Claim: for every **nonempty** $w$, $\delta'^*(s, w) = \delta^*(s, w)$. For $w = a$: $\delta'(s, a) = \varepsilon\text{-reach}(\delta(\varepsilon\text{-reach}(s), a)) = \delta^*(s, a)$ (walks: $\varepsilon$s, $a$, $\varepsilon$s). For $w = xa$ with $x$ nonempty: $\delta'^*(s, xa) = \bigcup_{q \in \delta^*(s,x)} \delta'(q, a)$ by IH; since $\delta^*(s,x)$ is closed under $\varepsilon$-reach, this equals $\varepsilon\text{-reach}\big(\bigcup_{r \in \delta^*(s,x)} \delta(r,a)\big) = \delta^*(s, xa)$ by the left-to-right rule. A set closed under $\varepsilon$-reach meets $A'$ iff it meets $A$, so $N$ and $N'$ agree on nonempty strings. For $w = \varepsilon$: $N'$ accepts iff $s \in A'$ iff $\varepsilon\text{-reach}(s) \cap A \ne \varnothing$ iff $N$ accepts $\varepsilon$. $\blacksquare$

(c) $\varepsilon\text{-reach}$: $s \mapsto \{s, p\}$, $p \mapsto \{p\}$, $f \mapsto \{f, s, p\}$. New edges: $s \xrightarrow{0} p$, $s \xrightarrow{1} \{f, s, p\}$; $p \xrightarrow{0} p$, $p \xrightarrow{1} \{f, s, p\}$; $f \xrightarrow{0} p$, $f \xrightarrow{1} \{f, s, p\}$. Accepting: only $f$ ($\varepsilon\text{-reach}(s)$ and $\varepsilon\text{-reach}(p)$ miss $f$). The language is "nonempty strings ending in 1", i.e. $(0+1)^*1$.`,
    },
  ],
});
