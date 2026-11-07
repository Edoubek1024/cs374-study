CS374.topic({
  id: 'dfa',
  unit: 'models',
  order: 3,
  title: 'Deterministic Finite Automata',
  summary: 'Machines with finite memory: the formal definition of a DFA, designing DFAs by deciding what to remember, mod-counting and substring machines, the product construction, and complement.',
  objectives: [
    'Give the formal 5-tuple definition of a DFA and the extended transition function',
    'Design a DFA for a described language by deciding what each state must remember',
    'Describe the meaning of every state and argue correctness with an invariant',
    'Apply the product construction for intersection, union and difference',
    'Complement a DFA correctly (including the dead state)',
  ],

  lesson: String.raw`## What a DFA is

A **deterministic finite automaton** reads its input one symbol at a time, left to right, and keeps only a bounded amount of information — its current **state** — about what it has seen. When the input runs out, it accepts or rejects depending on the state it ended in. There is no extra memory, no going back, and no choice: each state and symbol determine exactly one next state.

> **Definition.** A DFA is a 5-tuple $M = (Q, \Sigma, \delta, s, A)$ where
> - $Q$ is a finite set of **states**,
> - $\Sigma$ is the input alphabet,
> - $\delta : Q \times \Sigma \to Q$ is the **transition function**,
> - $s \in Q$ is the **start state**,
> - $A \subseteq Q$ is the set of **accepting** states.

The behavior on whole strings is the **extended transition function** $\delta^* : Q \times \Sigma^* \to Q$, defined recursively (Erickson's convention recurses on the first symbol):

$$\delta^*(q, \varepsilon) = q, \qquad \delta^*(q, a x) = \delta^*(\delta(q, a), x).$$

$M$ **accepts** $w$ iff $\delta^*(s, w) \in A$, and the language of $M$ is $L(M) = \{w : \delta^*(s,w) \in A\}$.

### The splitting lemma, proved

> **Lemma.** For every state $q$ and all strings $x, y$: $\delta^*(q, xy) = \delta^*(\delta^*(q,x), y)$. In particular $\delta^*(q, xa) = \delta(\delta^*(q,x), a)$.

**Proof.** Fix $y$; induct on $x$, with the hypothesis holding **for every state** $q$. Assume $\delta^*(p, x'y) = \delta^*(\delta^*(p,x'), y)$ for all states $p$ and all $x'$ shorter than $x$.
- $x = \varepsilon$: $\delta^*(q, \varepsilon y) = \delta^*(q, y) = \delta^*(\delta^*(q, \varepsilon), y)$, by the definitions of $\bullet$ and $\delta^*$.
- $x = ax'$: 
$$\delta^*(q, (ax')y) = \delta^*(q, a(x'y)) = \delta^*(\delta(q,a), x'y) = \delta^*(\delta^*(\delta(q,a), x'), y) = \delta^*(\delta^*(q, ax'), y).$$
Steps: definition of $\bullet$; definition of $\delta^*$; the IH applied to $x'$ **at the state $p = \delta(q,a)$**; definition of $\delta^*$ read backwards.

For the special case take $y = a$: $\delta^*(p, a) = \delta^*(\delta(p,a), \varepsilon) = \delta(p, a)$. $\blacksquare$

Notice why the hypothesis had to quantify over all states: the recursive definition moves to a *different* state before recursing. This "for every state" pattern recurs in every DFA induction.

**Notation in this app.** Machines are written one transition per line, e.g. <code>q0 1 -> q1</code>. Missing transitions go to an implicit **dead state** (a non-accepting state that loops on every symbol). On paper, either draw the dead state or say explicitly that missing transitions go to one.

Here is a DFA for binary strings that end in $01$. Try $0101$, $0110$, $1$:

~~~automaton
alphabet: 01
start: a
accept: c
# a: no progress; b: last symbol 0; c: last two symbols 01
a 0 -> b
a 1 -> a
b 0 -> b
b 1 -> c
c 0 -> b
c 1 -> a
~~~

## Designing a DFA: "what do I need to remember?"

The key design question: *after reading a prefix $x$, what is the least information about $x$ I need to decide, for every possible continuation $y$, whether $xy$ is in the language?* Each possible value of that information is one state.

> **Key idea.** A state is a **summary of the prefix read so far**. Write down, in English, what each state means ("the number of 1s so far is $\equiv 2 \pmod 3$", "the last two symbols were $01$"). If you can describe every state's meaning and check that every transition respects those meanings, your DFA is correct.

This English description is exactly what graders want to see on exams, along with the diagram or table.

### Pattern 1: counting modulo $k$

"Number of 1s divisible by 3": remember $\#(1, x) \bmod 3$. Three states $r_0, r_1, r_2$; 0 loops, 1 advances $r_i \to r_{(i+1) \bmod 3}$; accept $r_0$.

### Pattern 2: the value of a binary number modulo $k$

Read $w$ as a binary number, most significant bit first. If $x$ has value $v$, then $xb$ has value $2v + b$. So to know $\text{val}(w) \bmod k$ at the end, it suffices to remember $\text{val}(x) \bmod k$ after each prefix: the transition is

$$\delta(r, b) = (2r + b) \bmod k.$$

Divisible by 3 (with the convention that $\varepsilon$ has value 0):

~~~automaton
alphabet: 01
start: r0
accept: r0
r0 0 -> r0
r0 1 -> r1
r1 0 -> r2
r1 1 -> r0
r2 0 -> r1
r2 1 -> r2
~~~

Check: $110 = 6$ ends in $r_0$; $111 = 7$ ends in $r_1$. The same recipe gives a 5-state machine for divisibility by 5 (a practice problem below). The generic machine is not always minimal: for $k = 4$ or $k = 6$ some residues behave identically (see the quiz).

**Least significant bit first.** If the bits arrive LSB first, appending bit $b$ at position $i$ adds $b \cdot 2^i$. Now the machine must also remember $2^i \bmod k$, which cycles with some period; states are pairs (value mod $k$, $2^i \bmod k$). For $k = 5$, $2^i \bmod 5$ cycles through $1, 2, 4, 3$, giving $5 \times 4 = 20$ states.

### Pattern 3: substrings (the "longest useful suffix")

"Contains $010$": remember the longest suffix of the input that is a prefix of $010$, i.e. how much of the pattern is currently "in progress": $\varepsilon$, $0$, $01$, or "already found". The tricky transitions are the failures:

- In state $01$, reading $1$ gives suffix $011$, whose longest suffix that is a prefix of $010$ is $\varepsilon$ — back to the start.
- In state $0$, reading $0$ gives $00$, whose useful suffix is $0$ — stay.

The "found" state is accepting and absorbing. This is the same idea as the KMP string-matching automaton.

### Pattern 4: suffixes and fixed positions from the end

"Second-to-last symbol is 1": a DFA cannot know where the end is, so it must remember the **last two symbols** at all times: four states $00, 01, 10, 11$ (start in $00$, which behaves correctly for short inputs). Accept in $10$ and $11$. In general "$k$-th symbol from the end is 1" needs $2^k$ states — a DFA must remember the last $k$ symbols — while an NFA needs only $k+1$. We will prove this gap in the NFA topic.

### Pattern 5: first symbols

"Starts with $ab$": a chain of states for the prefix, then an accepting sink; any mismatch goes to a dead state. Prefix conditions are cheap; suffix conditions require continual tracking.

### Pattern 6: two counts at once

"$\#(0,w) - 2\,\#(1,w) \equiv 0 \pmod 5$" looks like it needs two counters, but only one **linear combination** matters: remember $d = (\#0 - 2\#1) \bmod 5$; a 0 adds 1, a 1 subtracts 2. Five states. In general, a condition on $(\#a \bmod p, \#b \bmod q)$ needs at most $pq$ states (a product), and sometimes far fewer once you simplify — e.g. "$\#0 \equiv \#1 \pmod 2$" is just "even length".

### Pattern 7: "every X is followed by Y"

- **Immediately** ("every 1 is immediately followed by $00$"): after a 1, remember how much of the required $00$ is still owed; a violation goes to the dead state.
- **Eventually** ("every $a$ has a $b$ somewhere later"): remember only whether there is an **outstanding** obligation. Reading $a$ creates one; reading $b$ clears all of them at once. Two states, no dead state — obligations can always still be met.

### Pattern 8: runs

"Every run of 0s has even length": remember which symbol the current run consists of and the parity of its length so far; a run that ends with the wrong parity (when the other symbol arrives) sends you to the dead state; at the end of input, the last run must also be checked, which is what the accepting states do.

### Worked design: "contains 010", step by step

**Step 1 — what to remember.** Whether we have already seen $010$; and if not, the longest suffix of the input that could still grow into $010$. The candidates are the prefixes of the pattern: $\varepsilon$, $0$, $01$. So four states: $k_0$ ("no useful suffix"), $k_1$ ("ends in 0, not yet found"), $k_2$ ("ends in 01, not yet found"), $k_3$ ("found").

**Step 2 — transitions.** For each state and symbol, append the symbol to the remembered suffix and take the longest suffix of the result that is a prefix of $010$:

| state | meaning | on 0 | on 1 |
|---|---|---|---|
| $k_0$ | $\varepsilon$ | $0 \to k_1$ | $1 \to \varepsilon = k_0$ |
| $k_1$ | $0$ | $00 \to 0 = k_1$ | $01 \to k_2$ |
| $k_2$ | $01$ | $010 \to k_3$ | $011 \to \varepsilon = k_0$ |
| $k_3$ | found | $k_3$ | $k_3$ |

**Step 3 — accepting states.** Only $k_3$.

**Step 4 — test.** $0110$: $k_0 \to k_1 \to k_2 \to k_0 \to k_1$, rejected (correct: no $010$). $01010$: $k_0 \to k_1 \to k_2 \to k_3 \to \cdots$, accepted.

~~~automaton
alphabet: 01
start: k0
accept: k3
k0 0 -> k1
k0 1 -> k0
k1 0 -> k1
k1 1 -> k2
k2 0 -> k3
k2 1 -> k0
k3 0,1 -> k3
~~~

**Variant: "ends in 010".** Same idea, but the accepting state now means "the input currently ends in $010$", so it is not absorbing. From it, reading 0 gives a string ending in $0100$, whose longest suffix that is a prefix of $010$ is $0$ (go to $k_1$); reading 1 gives $\ldots 0101$, whose useful suffix is $01$ (go to $k_2$). Note the overlap: $01010$ ends in $010$ thanks to the shared middle 0.

**Variant: "does not contain 010".** Complement the "contains" machine: accept $k_0, k_1, k_2$ and reject $k_3$. This is far easier than writing a regex for the complement directly.

### Walkthrough: designing by "what must I remember"

~~~~steps Balanced a/b strings of nesting depth at most 2
**The language.** Think of $a$ as "(" and $b$ as ")". Let $L$ be the strings over $\{a,b\}$ such that every prefix $p$ satisfies $0 \le \#a(p) - \#b(p) \le 2$, and $\#a(w) = \#b(w)$. So $aabb$, $abab$, $aabbab$ are in; $ba$, $aaabbb$ (depth 3) and $aab$ are not.
+++
**What must I remember?** The current depth $d = \#a(x) - \#b(x)$ of the prefix $x$, and whether a prefix has already gone out of range. If the depth ever leaves $\{0,1,2\}$ the string is doomed. Otherwise the depth is all that matters for the future: two prefixes with the same depth (and no violation) have exactly the same good continuations.
+++
**States.** $d_0, d_1, d_2$ (current depth, no violation so far) and a dead state. Only finitely many values are possible *because the depth is bounded*. With unbounded depth this idea would need infinitely many states — and indeed the full balanced language is not regular.
+++
**Transitions.** $a$ increases the depth, $b$ decreases it: $d_0 \xrightarrow{a} d_1 \xrightarrow{a} d_2$, $d_2 \xrightarrow{b} d_1 \xrightarrow{b} d_0$. Leaving the range — $b$ at depth 0, $a$ at depth 2 — goes to the dead state.
+++
**Start and accept.** Start in $d_0$ ($\varepsilon$ has depth 0). Accept only $d_0$: the final depth must be 0.

~~~automaton
alphabet: ab
start: d0
accept: d0
d0 a -> d1
d1 a -> d2
d1 b -> d0
d2 b -> d1
~~~
+++
**State the invariant and test.** $\delta^*(d_0, x) = d_i$ iff every prefix of $x$ has depth in $\{0,1,2\}$ and $x$ itself has depth $i$; $\delta^*(d_0, x) = $ dead iff some prefix has depth outside $\{0,1,2\}$. Test: $aabbab$: $d_0 d_1 d_2 d_1 d_0 d_1 d_0$, accepted. $aaab$: dies on the third $a$.
~~~~

## Describing and proving correctness

For each state $q$ define the set $L_q = \{x : \delta^*(s,x) = q\}$ of prefixes that lead to $q$. Correctness means: you claim a description $D_q$ for each state, and prove $\delta^*(s,x) = q \iff x$ satisfies $D_q$. This is an induction on $x$ (using $\delta^*(s, xa) = \delta(\delta^*(s,x), a)$), and it boils down to checking:

1. $\varepsilon$ satisfies $D_s$ (the start state's description);
2. for every transition $\delta(p, a) = q$: if $x$ satisfies $D_p$ then $xa$ satisfies $D_q$;
3. the descriptions are mutually exclusive and cover all strings;
4. the accepting states are exactly those whose descriptions imply membership in $L$.

**Why these four checks suffice.** By induction on $x$ (peeling off the last symbol), checks 1 and 2 show that $x$ satisfies $D_{\delta^*(s,x)}$: for $x = \varepsilon$ by check 1, and for $x = x'a$, the IH says $x'$ satisfies $D_p$ with $p = \delta^*(s, x')$, the lemma says $\delta^*(s,x) = \delta(p, a)$, and check 2 transfers the description. Check 3 then gives the converse (if $x$ satisfies $D_q$, it cannot satisfy the description of the state it actually reaches unless that state is $q$), and check 4 turns state descriptions into acceptance.

For the mod-3 machine: $D_{r_i}$ = "$\text{val}(x) \equiv i \pmod 3$". Check 2: if $\text{val}(x) \equiv r$ then $\text{val}(xb) = 2\,\text{val}(x) + b \equiv 2r + b$. The descriptions are clearly exclusive and exhaustive, and only $r_0$ means "divisible by 3". Done.

## The product construction

Given DFAs $M_1 = (Q_1, \Sigma, \delta_1, s_1, A_1)$ and $M_2 = (Q_2, \Sigma, \delta_2, s_2, A_2)$, run them **in parallel**. The product DFA has

- states $Q = Q_1 \times Q_2$,
- start state $(s_1, s_2)$,
- transitions $\delta((p,q), a) = (\delta_1(p,a), \delta_2(q,a))$.

> **Lemma.** For all $p \in Q_1$, $q \in Q_2$ and strings $w$: $\delta^*((p,q), w) = (\delta_1^*(p,w), \delta_2^*(q,w))$.

**Proof.** Induction on $w$, for **all** pairs $(p, q)$ simultaneously. $w = \varepsilon$: both sides are $(p,q)$. $w = ax$: $\delta^*((p,q), ax) = \delta^*((\delta_1(p,a), \delta_2(q,a)), x) = (\delta_1^*(\delta_1(p,a), x), \delta_2^*(\delta_2(q,a), x)) = (\delta_1^*(p, ax), \delta_2^*(q, ax))$, using the definition of $\delta^*$ and of $\delta$, the IH at the pair $(\delta_1(p,a), \delta_2(q,a))$, and the definitions of $\delta_1^*, \delta_2^*$. $\blacksquare$

So the product state records where each machine would be. Choosing the accepting set chooses the Boolean operation:

| Language | Accepting states |
|---|---|
| $L_1 \cap L_2$ | $A_1 \times A_2$ |
| $L_1 \cup L_2$ | $(A_1 \times Q_2) \cup (Q_1 \times A_2)$ |
| $L_1 \setminus L_2$ | $A_1 \times (Q_2 \setminus A_2)$ |
| $L_1 \oplus L_2$ | pairs with exactly one coordinate accepting |

For example, for intersection: $w \in L(M) \iff (\delta_1^*(s_1,w), \delta_2^*(s_2,w)) \in A_1 \times A_2 \iff w \in L_1$ and $w \in L_2$.

> **Theorem.** Regular languages are closed under intersection, union, difference and symmetric difference. If $M_1, M_2$ have $n_1, n_2$ states, the product has $n_1 n_2$ states (often fewer are reachable).

> **Warning.** For **union** the DFAs must be *complete* (every transition defined, dead states included). If $M_1$ dies on some input, the product state must still track $M_2$. With implicit dead states, add them explicitly before building a union product.

### Writing a product in the course's formal style

On exams you are usually allowed — and expected — to *describe* the product rather than draw it. A complete answer looks like this.

> **Example.** $L = \{w \in \{0,1\}^* : \#(0, w) \equiv 1 \pmod 3 \text{ and } w \text{ ends in } 1\}$.
> - $Q = \{0,1,2\} \times \{\text{T}, \text{F}\}$, where state $(i, t)$ means "the number of 0s read so far is $\equiv i \pmod 3$, and $t$ records whether the last symbol read was 1".
> - $s = (0, \text{F})$ (no 0s yet; no last symbol).
> - $\delta((i,t), 0) = ((i+1) \bmod 3, \text{F})$ and $\delta((i,t), 1) = (i, \text{T})$.
> - $A = \{(1, \text{T})\}$.

The English meaning of each component, the start state, the transition function as a formula, and the accepting set: that is the whole answer, and the 6-state diagram is optional.

### Worked product: no $11$ and an even number of 0s

$M_1$ (no $11$) remembers "was the last symbol a 1?": states $N$ (no) and $Y$ (yes), with $Y \xrightarrow{1}$ dead. $M_2$ remembers the parity of 0s: $E$, $O$. The product has states $NE, NO, YE, YO$ (plus dead): reading 0 moves to $N$ and flips parity; reading 1 moves $N \to Y$ keeping parity, and from $Y$ dies. Accept the states with $E$ (both $NE$ and $YE$ satisfy "no $11$ so far").

~~~automaton
alphabet: 01
start: NE
accept: NE, YE
NE 0 -> NO
NE 1 -> YE
NO 0 -> NE
NO 1 -> YO
YE 0 -> NO
YO 0 -> NE
~~~

In the diagram, missing transitions ($YE$ and $YO$ on 1) go to the implicit dead state — fine here because this is an *intersection*.

### Walkthrough: a union product, where dead states matter

~~~~steps Build a DFA for "starts with 1 OR has an odd number of 0s"
**Component machines, complete.** $M_1$ ("starts with 1"): states $s$ (nothing read), $y$ (started with 1; accepting sink), $d$ (started with 0; **explicit** dead state). $M_2$ (odd number of 0s): states $E$, $O$; a 0 flips, a 1 keeps; accept $O$.
+++
**Product states and start.** Pairs $(p, q)$ with $p \in \{s, y, d\}$ and $q \in \{E, O\}$: six pairs. Start at $(s, E)$.
+++
**Transitions from the start.** $(s,E) \xrightarrow{1} (y, E)$ and $(s, E) \xrightarrow{0} (d, O)$. After that the first coordinate never changes ($y$ and $d$ are sinks) and the second tracks parity: $(y,E) \leftrightarrow (y,O)$ and $(d,E) \leftrightarrow (d,O)$ on 0, self-loops on 1. The pair $(s, O)$ is unreachable, so we drop it.
+++
**Accepting states (union).** A pair accepts if $p = y$ **or** $q = O$: $(y,E)$, $(y,O)$, $(d,O)$.

~~~automaton
alphabet: 01
start: sE
accept: yE, yO, dO
sE 1 -> yE
sE 0 -> dO
yE 0 -> yO
yE 1 -> yE
yO 0 -> yE
yO 1 -> yO
dO 0 -> dE
dO 1 -> dO
dE 0 -> dO
dE 1 -> dE
~~~
+++
**Why the explicit dead state mattered.** If we had left $M_1$'s dead state implicit, the product would have no transition from $(s,E)$ on 0, and the string $0$ — which has an odd number of 0s — would be wrongly rejected. In a union, "$M_1$ has died" does **not** mean "reject".
+++
**Optional clean-up.** $(y,E)$ and $(y,O)$ both accept every continuation, so they can be merged into one accepting sink; the minimal DFA has 4 states. Minimizing is never required unless the problem asks for it.
~~~~

> **Exam tip.** When a problem asks for "a DFA for $L_1 \cap L_2$" you usually may simply describe the product: "Let $M_1$ (states ...) recognize $L_1$ and $M_2$ recognize $L_2$; take the product with accepting states $A_1 \times A_2$." Precisely define both component machines and the accepting set. Drawing all $n_1 n_2$ states is rarely required unless asked.

## Complement

To recognize $\overline{L}$, keep everything and swap accepting and non-accepting states: $A' = Q \setminus A$. Since a DFA has exactly one run on each input, $w \notin L(M) \iff \delta^*(s,w) \notin A \iff w \in L(M')$. (Formally: $M'$ has the same $\delta^*$ as $M$, because $\delta^*$ does not depend on $A$.)

> **Warning.** Complementing requires a **complete** DFA. If missing transitions implicitly go to a dead state, that dead state must become *accepting* in the complement. Forgetting it is the most common complement bug. And swapping accept states does **not** complement an NFA.

## Dead states, minimality, and limits

- A **dead (trap) state** is non-accepting and loops on every symbol: once there, the string is rejected regardless of what follows.
- Two prefixes $x, y$ are **distinguishable** for $L$ if some suffix $z$ has exactly one of $xz, yz$ in $L$. Distinguishable prefixes must lead to different states in any DFA for $L$. If you find $k$ pairwise distinguishable prefixes, any DFA needs at least $k$ states.
- If there are *infinitely many* pairwise distinguishable prefixes, no DFA exists — the language is not regular. This is the **fooling set** method, the topic after closure properties.

> **Lemma.** If $x$ and $y$ are distinguishable for $L$, then in every DFA $M$ for $L$, $\delta^*(s, x) \ne \delta^*(s, y)$.

**Proof.** Suppose $\delta^*(s,x) = \delta^*(s,y) = q$, and let $z$ be any suffix. By the splitting lemma, $\delta^*(s, xz) = \delta^*(q, z) = \delta^*(s, yz)$, so $M$ accepts $xz$ iff it accepts $yz$. Then no $z$ distinguishes $x$ from $y$ — contradiction. $\blacksquare$

So to show "the minimal DFA for $L$ has exactly $k$ states", give (1) a DFA with $k$ states and (2) $k$ prefixes that are pairwise distinguishable, with a distinguishing suffix for each pair.

## Try it yourself: worked examples

### Try it first: a counting condition that collapses

Over $\{a,b\}$, design a DFA for $\{w : \#(a,w) \equiv 2\,\#(b,w) \pmod 3\}$ with as few states as possible.

~~~~reveal Solution
Remember $d = (\#a - 2\#b) \bmod 3$: an $a$ adds 1, a $b$ subtracts 2. But $-2 \equiv 1 \pmod 3$, so **both** symbols add 1, and $d \equiv \#a + \#b = |w| \pmod 3$. The language is just "length divisible by 3":

~~~automaton
alphabet: ab
start: l0
accept: l0
l0 a,b -> l1
l1 a,b -> l2
l2 a,b -> l0
~~~

Three states, and three are needed: $\varepsilon$, $a$, $aa$ are pairwise distinguishable (append $\varepsilon$, $a$ or $aa$ appropriately). Always simplify the arithmetic before building a product.
~~~~

### Try it first: what to remember with three symbols

Over $\{0,1,2\}$, design a DFA for the strings that contain **each** of $0$, $1$ and $2$ at least once. How many states does your machine have, and is that minimal?

~~~~reveal Solution
Remember **which symbols have appeared so far**: a subset of $\{0,1,2\}$, so $2^3 = 8$ states. Reading $c$ moves from subset $S$ to $S \cup \{c\}$. Start at $\varnothing$; accept only $\{0,1,2\}$.

~~~automaton
alphabet: 012
start: e
accept: all
e 0 -> s0
e 1 -> s1
e 2 -> s2
s0 0 -> s0
s0 1 -> s01
s0 2 -> s02
s1 0 -> s01
s1 1 -> s1
s1 2 -> s12
s2 0 -> s02
s2 1 -> s12
s2 2 -> s2
s01 0,1 -> s01
s01 2 -> all
s02 0,2 -> s02
s02 1 -> all
s12 1,2 -> s12
s12 0 -> all
all 0,1,2 -> all
~~~

It is minimal: for two different subsets $S \ne T$, pick a symbol $c$ in one but not the other, say $c \in S \setminus T$; append the symbols not in $S$ (the remaining ones). Then the string from $S$ has seen everything, while the one from $T$ is still missing $c$. So all 8 prefixes $\varepsilon, 0, 1, 2, 01, 02, 12, 012$ are pairwise distinguishable.
~~~~

### Try it first: a lower bound

Prove that every DFA for "binary strings ending in $00$" has at least 3 states, and give a 3-state DFA.

~~~~reveal Solution
**Lower bound.** The prefixes $\varepsilon$, $0$, $00$ are pairwise distinguishable:
- $\varepsilon$ vs $00$: suffix $\varepsilon$ ($00 \in L$, $\varepsilon \notin L$).
- $0$ vs $00$: suffix $\varepsilon$.
- $\varepsilon$ vs $0$: suffix $0$ ($00 \in L$, $0 \notin L$).

By the lemma above, they reach three different states in any DFA for the language.

**Upper bound.** Remember the number of trailing 0s, capped at 2: $n$ (zero trailing 0s), $z_1$, $z_2$.

~~~automaton
alphabet: 01
start: n
accept: z2
n 0 -> z1
n 1 -> n
z1 0 -> z2
z1 1 -> n
z2 0 -> z2
z2 1 -> n
~~~
~~~~

### Try it first: least significant bit first

Bits arrive **least significant first** (so $w = b_0 b_1 \cdots b_{n-1}$ has value $\sum_i b_i 2^i$). Design a DFA accepting the strings whose value is divisible by 3.

~~~reveal Solution
The general recipe tracks pairs ($v \bmod 3$, $2^i \bmod 3$): reading $b$ in state $(v, p)$ goes to $((v + bp) \bmod 3, 2p \bmod 3)$. Since $2^i \bmod 3$ alternates $1, 2, 1, 2, \ldots$, that is 6 states — correct, but there is a slicker answer.

Because $2 \equiv -1 \pmod 3$, the value of a string is $\equiv \sum_i (-1)^i b_i$: the alternating sum of its bits. Reversing a string of length $n$ maps position $i$ to position $n - 1 - i$, which multiplies every sign by $(-1)^{n-1}$. So $w$ is divisible by 3 read LSB-first iff it is divisible by 3 read MSB-first — the language of MSB-first multiples of 3 is **closed under reversal**, and the usual 3-state machine $\delta(r,b) = (2r+b) \bmod 3$ already works.

The trick relies on $2 \equiv -1 \pmod 3$. For $k = 5$ there is no such symmetry: $11001$ is $25$ read MSB-first but $1 + 2 + 16 = 19$ read LSB-first, so the two languages differ and you really need the (value, weight) pair construction.
~~~

### Try it first: spot the complement bug

A student builds the DFA for "starts with $01$" as $q_0 \xrightarrow{0} q_1 \xrightarrow{1} q_2$, with $q_2$ an accepting sink and all other transitions missing (implicit dead state). To get "does **not** start with $01$", they make $q_0, q_1$ accepting and $q_2$ rejecting. Which strings does their machine get wrong?

~~~reveal Solution
Every string that falls into the implicit dead state: $1$, $00$, $1\ldots$, $00\ldots$. These do not start with $01$, so they belong to the complement, but the student's machine still rejects them, because the implicit dead state stayed non-accepting. The shortest wrong string is $1$. Fix: add the dead state explicitly and make it **accepting** in the complement. (Strings $\varepsilon$ and $0$ end in $q_0$, $q_1$ and are correctly accepted.)
~~~

## Common exam problem patterns

**1. "Draw/describe a DFA for $L$ and explain each state."** Recipe: decide what to remember (count mod $k$, value mod $k$, last $k$ symbols, progress toward a pattern, which symbols seen, outstanding obligation, current run and its parity). Name each state by its meaning. Fill in transitions by asking "what does the new prefix look like?". Pick accepting states from the meanings. Test $\varepsilon$, single symbols and near misses.

**2. "Give a DFA for $L_1 \cap L_2$ / $L_1 \cup L_2$ / $L_1 \setminus L_2$."** Recipe: product construction, written formally: $Q = Q_1 \times Q_2$, $s = (s_1,s_2)$, $\delta((p,q),a) = (\delta_1(p,a), \delta_2(q,a))$, and the right accepting set. Define each component precisely (with its own state meanings). For union and difference, make sure the components are complete.

**3. "Prove your DFA correct."** Recipe: state invariants $D_q$; check start, every transition, exclusivity, accepting states; the induction is on the input, peeling off the last symbol and using $\delta^*(s, xa) = \delta(\delta^*(s,x),a)$.

**4. "Prove a general fact about DFAs by induction"** (the splitting lemma, the product lemma, $\delta^*$ of a modified machine). Recipe: induct on the string with the hypothesis quantified over **all states**; unfold $\delta^*$ once; apply the IH at the new state.

**5. "How many states does the minimal DFA need?" / "Prove any DFA needs $k$ states."** Recipe: exhibit $k$ pairwise distinguishable prefixes with a distinguishing suffix for each pair, plus a $k$-state DFA.

**6. "Complement / modify a given DFA"** (complement, "accepts iff $M$ ever visits state $q$", "accepts $L(M)$ minus strings of odd length"). Recipe: complete the DFA first; for modifications, add a component that remembers the extra information and take a product.

**7. "Numbers in binary"** (value mod $k$, MSB or LSB first, value in a range). Recipe: $\delta(r,b) = (2r+b) \bmod k$ for MSB-first; pairs (value, weight) for LSB-first; simplify with modular arithmetic.

## Where students lose points

- **No state meanings.** A bare diagram with no explanation earns partial credit at best. Write one line per state.
- **Wrong start state behavior.** The start state's meaning must hold for $\varepsilon$ (e.g. for "second-to-last is 1", the start must act like "last two symbols 00", not like an accepting state).
- **Forgetting the dead state** in a complement or union, or drawing missing transitions without saying where they go.
- **Accepting states chosen for the wrong operation** ($A_1 \times A_2$ is intersection, not union).
- **Absorbing vs non-absorbing**: "contains $x$" has an absorbing found state; "ends in $x$" does not.
- **Failure transitions in pattern machines**: after a mismatch, falling back to the start instead of the longest useful suffix (e.g. in the $0101$ machine, state $010$ on input $0$ must go to state $0$, not $\varepsilon$).
- **Product without simplifying**: building $3 \times 3$ states when the condition collapses to one counter — not wrong, but slower and error-prone.
- **Inductions with too weak a hypothesis**: stating the IH only for the start state when the step needs it at another state.
- **NFA habits in a DFA**: two transitions on the same symbol, $\varepsilon$-moves, or "guessing".

## Design checklist

1. Decide what to remember; give each state an English meaning.
2. Make sure the start state's meaning holds for $\varepsilon$.
3. For each state and symbol, ask "what does the new prefix look like?" and route accordingly.
4. Decide accepting states from the meanings.
5. Test edge cases: $\varepsilon$, single symbols, strings that almost match.
6. For combinations of conditions, build component DFAs and use the product — after simplifying the condition.

## Self-check

**1.** What does a DFA for "every 0 is eventually followed by a 1" (over $\{0,1\}$) need to remember, and how many states does it need?

~~~reveal Answer
Whether there is a 0 not yet followed by a 1 — equivalently, whether the last symbol was 0. Two states (start/accepting "no pending 0", and "pending 0"); the language is "empty or ends in 1".
~~~

**2.** In the KMP machine for "contains $0101$" (states $\varepsilon, 0, 01, 010$, found), where does state $010$ go on input $0$?

~~~reveal Answer
To state $0$: the input now ends in $0100$, and the longest suffix of $0100$ that is a prefix of $0101$ is $0$.
~~~

**3.** Why must the hypothesis in the product lemma be "for all pairs $(p,q)$" rather than just for $(s_1, s_2)$?

~~~reveal Answer
Because $\delta^*((p,q), ax) = \delta^*((\delta_1(p,a), \delta_2(q,a)), x)$: the recursive call starts from a different pair, so the IH is needed there.
~~~

**4.** $M_1$ has 3 states and $M_2$ has 4. What is the maximum number of states of the product DFA for $L(M_1) \setminus L(M_2)$, and what is its accepting set?

~~~reveal Answer
12 states; accepting set $A_1 \times (Q_2 \setminus A_2)$. Both machines should be complete.
~~~

**5.** Give two prefixes that are **not** distinguishable for "number of 1s is even", and two that are.

~~~reveal Answer
Not distinguishable: $11$ and $\varepsilon$ (same parity). Distinguishable: $1$ and $\varepsilon$, separated by the suffix $\varepsilon$.
~~~

**6.** True or false: if a DFA has an unreachable state, complementing it by swapping accepting states can give the wrong language.

~~~reveal Answer
False. Unreachable states never affect which strings are accepted; swapping is still correct as long as the machine is complete.
~~~

**7.** How many states does a DFA for "binary value (MSB first) is $\equiv 2 \pmod 5$" need, and which state is accepting?

~~~reveal Answer
The 5-state machine $\delta(r,b) = (2r+b) \bmod 5$ with start $r_0$ and accepting state $r_2$. All 5 are needed: residues are pairwise distinguishable because doubling mod 5 is invertible.
~~~
`,

  cheatsheet: String.raw`## Definition
- $M = (Q, \Sigma, \delta, s, A)$, $\delta : Q \times \Sigma \to Q$ total.
- $\delta^*(q, \varepsilon) = q$, $\delta^*(q, ax) = \delta^*(\delta(q,a), x)$.
- Splitting lemma: $\delta^*(q,xy) = \delta^*(\delta^*(q,x),y)$; $\delta^*(q, xa) = \delta(\delta^*(q,x),a)$. Proof: induction on $x$ **for all $q$**.
- $L(M) = \{w : \delta^*(s,w) \in A\}$.

## Design patterns ("what must I remember?")
| Language | Remember | States |
|---|---|---|
| $\#_1(w) \equiv 0 \bmod k$ | count mod $k$ | $k$ |
| binary value (MSB first) $\equiv c \bmod k$ | value mod $k$; $\delta(r,b) = (2r+b) \bmod k$ | $\le k$ |
| binary value, LSB first | (value mod $k$, $2^i \bmod k$) | $\le k \cdot$ period |
| $\alpha\#a + \beta\#b \equiv c \bmod k$ | that one combination mod $k$ | $k$ |
| contains $x$ | longest suffix that is a prefix of $x$ | $\lvert x \rvert+1$ |
| ends in $x$ | same, but no absorbing "found" | $\lvert x \rvert+1$ |
| $k$-th symbol from end | last $k$ symbols | $2^k$ |
| starts with $x$ | chain + dead | $\lvert x \rvert+2$ |
| contains every symbol | subset seen so far | $2^{\lvert\Sigma\rvert}$ |
| every X *eventually* followed by Y | outstanding obligation? | 2 |
| every 1 *immediately* followed by $00$ | how much is still owed (+ dead) | 3 + dead |
| runs with parity conditions | current run symbol + parity (+ dead) | small |
| bounded depth $\le k$ | current depth (+ dead) | $k+1$ + dead |

## Product construction
- $Q_1 \times Q_2$, start $(s_1,s_2)$, $\delta((p,q),a) = (\delta_1(p,a), \delta_2(q,a))$.
- $\cap$: $A_1 \times A_2$; $\cup$: $A_1 \times Q_2 \cup Q_1 \times A_2$; $\setminus$: $A_1 \times (Q_2 \setminus A_2)$; $\oplus$: exactly one.
- Lemma: $\delta^*((p,q),w) = (\delta_1^*(p,w), \delta_2^*(q,w))$ (induction on $w$, all pairs).
- Union/difference need complete DFAs (explicit dead states). Intersection may keep dead states implicit.

## Formal-description template
1. $Q = \ldots$ with the **meaning** of each state.
2. $s = \ldots$ (meaning holds for $\varepsilon$).
3. $\delta(\text{state}, a) = \ldots$ as a formula or table.
4. $A = \ldots$.

## Complement
- Swap accept/non-accept. DFA must be complete: implicit dead state becomes accepting.
- Does NOT work for NFAs.

## Correctness proof template
1. For each $q$, a description $D_q$ of the prefixes reaching it.
2. $\varepsilon$ satisfies $D_s$.
3. Each transition $p \xrightarrow{a} q$: $x \in D_p \Rightarrow xa \in D_q$.
4. Descriptions exclusive and exhaustive; $A$ = states whose description implies $L$.
5. Glue: induction on $x$, peeling the last symbol, via $\delta^*(s,xa) = \delta(\delta^*(s,x),a)$.

## Lower bounds
- $x, y$ distinguishable (some $z$: exactly one of $xz, yz \in L$) $\Rightarrow$ different states (splitting lemma).
- $k$ pairwise distinguishable prefixes $\Rightarrow \ge k$ states. Exact minimum = matching DFA + matching set.
- Infinitely many $\Rightarrow$ not regular.

## Quick facts
- Binary multiples of 3 are closed under reversal ($2 \equiv -1 \bmod 3$).
- Minimal DFA for binary multiples of 4: 3 states; of 6: 4 states.
- $\#0 \equiv \#1 \pmod 2$ iff even length.
`,

  quiz: [
    {
      type: 'mc',
      q: String.raw`In a DFA $(Q,\Sigma,\delta,s,A)$, what is the type of $\delta$?`,
      choices: [String.raw`$Q \times \Sigma \to Q$`, String.raw`$Q \times \Sigma \to 2^Q$`, String.raw`$Q \times (\Sigma \cup \{\varepsilon\}) \to Q$`, String.raw`$Q \to \Sigma$`],
      answer: 0,
      explain: String.raw`A DFA has exactly one next state for every (state, symbol) pair: $\delta : Q \times \Sigma \to Q$. A set of next states ($2^Q$) and $\varepsilon$-moves are features of NFAs.`,
    },
    {
      type: 'mc',
      q: String.raw`The minimum number of states in a DFA (with the dead state counted if needed) for binary strings whose value is divisible by 4 (MSB first, $\varepsilon$ counts as 0) is:`,
      choices: ['2', '3', '4', '5'],
      answer: 1,
      explain: String.raw`A number is divisible by 4 iff its last two bits are $00$; for short strings, imagine padding with leading 0s (so $\varepsilon$ and $0$ are accepted). Three states suffice: $A$ = "last two (padded) bits are 00" (start, accepting), $B$ = "last bit is 1", $C$ = "last two bits are 10". All three are needed: $A$ accepts now, $B$ and $C$ do not, and appending $0$ separates $B$ (goes to $C$, reject) from $C$ (goes to $A$, accept). The generic mod-$k$ machine has 4 states, but its states $r_1$ and $r_3$ are equivalent (both mean "last bit 1"), so it is not minimal.`,
    },
    {
      type: 'tf',
      q: String.raw`To complement a DFA whose missing transitions go to an implicit dead state, it suffices to swap the accepting and non-accepting states among the states that are drawn.`,
      answer: false,
      explain: String.raw`The implicit dead state is a real (non-accepting) state. In the complement it must become **accepting**, so you must add it explicitly and make it accept. Otherwise strings that "die" are still rejected, when they should now be accepted.`,
    },
    {
      type: 'mc',
      q: String.raw`In the product construction for $L(M_1) \cup L(M_2)$, which states are accepting?`,
      choices: [String.raw`$A_1 \times A_2$`, String.raw`$(A_1 \times Q_2) \cup (Q_1 \times A_2)$`, String.raw`$A_1 \cup A_2$`, String.raw`$A_1 \times (Q_2 \setminus A_2)$`],
      answer: 1,
      explain: String.raw`A pair $(p,q)$ should accept iff at least one machine accepts: $p \in A_1$ or $q \in A_2$. $A_1 \times A_2$ is intersection; $A_1 \times (Q_2 \setminus A_2)$ is difference. $A_1 \cup A_2$ is not even a set of pairs.`,
    },
    {
      type: 'mc',
      q: String.raw`In the KMP-style DFA for "contains $010$", with states $\varepsilon, 0, 01, \text{found}$, where does state $01$ go on input $1$?`,
      choices: [String.raw`$\varepsilon$`, String.raw`$0$`, String.raw`$01$`, 'found'],
      answer: 0,
      explain: String.raw`The input now ends in $011$. We want the longest suffix of $011$ that is a prefix of $010$: suffixes $11$ and $1$ are not prefixes of $010$, so the answer is $\varepsilon$. (On input $0$, state $01$ goes to found.)`,
    },
    {
      type: 'tf',
      q: String.raw`If DFAs $M_1$ and $M_2$ have 4 and 5 states, then there is a DFA with at most 20 states for $L(M_1) \cap L(M_2)$.`,
      answer: true,
      explain: String.raw`The product construction uses $Q_1 \times Q_2$, which has $4 \cdot 5 = 20$ states. Often fewer are reachable.`,
    },
    {
      type: 'multi',
      q: String.raw`Consider the mod-3 DFA for binary numbers ($\delta(r,b) = (2r+b) \bmod 3$, start and accept $r_0$). Which strings are accepted? (select all that apply)`,
      choices: [String.raw`$\varepsilon$`, String.raw`$11$`, String.raw`$101$`, String.raw`$1001$`, String.raw`$0110$`],
      answer: [0, 1, 3, 4],
      explain: String.raw`Values: $\varepsilon \to 0$, $11 = 3$, $101 = 5$, $1001 = 9$, $0110 = 6$. Multiples of 3: all but $101$. Tracing $101$: $r_0 \xrightarrow{1} r_1 \xrightarrow{0} r_2 \xrightarrow{1} r_2$ (since $2\cdot 2 + 1 = 5 \equiv 2$).`,
    },
    {
      type: 'mc',
      q: String.raw`How many states does the minimal DFA for "the 3rd symbol from the end is 1" over $\{0,1\}$ have?`,
      choices: ['4', '6', '8', '16'],
      answer: 2,
      explain: String.raw`The DFA must remember the last 3 symbols; all $2^3 = 8$ length-3 strings are pairwise distinguishable (if $x \ne y$ differ in position $i$ from the left, append $i-1$ symbols to move that position to third-from-last). So 8 states are necessary and sufficient.`,
    },
    {
      type: 'tf',
      q: String.raw`Every DFA state should have a precise English description of the set of prefixes that reach it; correctness can then be checked transition by transition.`,
      answer: true,
      explain: String.raw`This is the invariant method: check the start state's description holds for $\varepsilon$, that each transition maps a prefix satisfying $D_p$ to one satisfying $D_q$, and that accepting states are exactly those whose descriptions imply membership.`,
    },
    {
      type: 'mc',
      q: String.raw`Which pair of prefixes is **distinguishable** with respect to $L$ = "number of 1s is divisible by 3"?`,
      choices: [String.raw`$1$ and $1111$`, String.raw`$11$ and $0110$`, String.raw`$1$ and $11$`, String.raw`$\varepsilon$ and $111$`],
      answer: 2,
      explain: String.raw`Prefixes are equivalent exactly when their numbers of 1s agree mod 3. $1$ and $11$ have counts $1$ and $2$; the suffix $1$ separates them ($11 \notin L$, $111 \in L$). The other pairs have equal counts mod 3 ($1$ vs $4$; $2$ vs $2$; $0$ vs $3$), so no suffix distinguishes them.`,
    },
    {
      type: 'tf',
      q: String.raw`$\delta^*(q, xy) = \delta^*(\delta^*(q,x), y)$ for all states $q$ and strings $x, y$.`,
      answer: true,
      explain: String.raw`Reading $xy$ from $q$ is the same as reading $x$ and then continuing with $y$ from wherever you ended up. Formally this is proved by induction on $x$ using $\delta^*(q, ax) = \delta^*(\delta(q,a), x)$.`,
    },
    {
      type: 'mc',
      q: String.raw`You build the product of a DFA for "even number of 0s" (2 states) and one for "ends in 1" (2 states) to get "even number of 0s **and** ends in 1". How many product states are accepting?`,
      choices: ['1', '2', '3', '4'],
      answer: 0,
      explain: String.raw`Intersection accepts $A_1 \times A_2$: (even, last-is-1) only — one state. For union it would be 3 of the 4 states.`,
    },
    {
      type: 'tf',
      q: String.raw`For the language "number of $a$s minus number of $b$s is divisible by 3" over $\{a,b\}$, a DFA needs to remember the actual difference $\#a - \#b$, so no finite DFA exists.`,
      answer: false,
      explain: String.raw`Only the difference **mod 3** matters for the final answer, and it updates as $d \mapsto d+1$ on $a$ and $d \mapsto d-1$ on $b$ (mod 3). Three states suffice. (By contrast, "difference equals 0" exactly would require unbounded memory and is not regular.)`,
    },
    {
      type: 'mc',
      q: String.raw`How many states does the **minimal** DFA for binary strings (MSB first, $\varepsilon$ counts as 0) whose value is divisible by 6 have?`,
      choices: ['3', '4', '6', '12'],
      answer: 1,
      explain: String.raw`The generic machine tracks the value mod 6 (6 states), but residues $r$ and $r+3$ give the same value after any appended bit ($2r \equiv 2(r+3) \pmod 6$), so they can only be told apart by the empty suffix, i.e. by whether one of them is 0. Hence $1 \sim 4$ and $2 \sim 5$, while $0 \not\sim 3$. That leaves 4 classes: $\{0\}, \{3\}, \{1,4\}, \{2,5\}$, and they are pairwise distinguishable (e.g. $1$ vs $2$: append $10$, giving values $6$ and $10$). Intuitively: remember the value mod 3, plus — only when it is 0 — whether the last bit was 0.`,
    },
    {
      type: 'tf',
      q: String.raw`The language of binary strings (MSB first) whose value is divisible by 3 is closed under reversal.`,
      answer: true,
      explain: String.raw`Since $2 \equiv -1 \pmod 3$, $\text{val}(b_{n-1}\cdots b_0) \equiv \sum_i (-1)^i b_i$. Reversing multiplies every term's sign by $(-1)^{n-1}$, which preserves divisibility by 3. So the same 3-state DFA works whether bits arrive MSB-first or LSB-first. This fails for 5: $11001 = 25$ but $10011 = 19$.`,
    },
    {
      type: 'mc',
      q: String.raw`How many states does the minimal DFA for "contains $0101$ as a substring" over $\{0,1\}$ have?`,
      choices: ['4', '5', '6', '8'],
      answer: 1,
      explain: String.raw`One state for each prefix of the pattern still "in progress" — $\varepsilon, 0, 01, 010$ — plus an absorbing found state: 5. They are pairwise distinguishable: the prefixes $\varepsilon, 0, 01, 010, 0101$ need different numbers of further symbols ($4, 3, 2, 1, 0$) to complete the pattern by appending the rest of $0101$.`,
    },
    {
      type: 'mc',
      q: String.raw`In the KMP-style DFA for "contains $0101$" (states $\varepsilon, 0, 01, 010$, found), where does state $010$ go on input $0$?`,
      choices: [String.raw`$\varepsilon$`, String.raw`$0$`, String.raw`$01$`, String.raw`$010$`],
      answer: 1,
      explain: String.raw`The input now ends in $0100$. Its suffixes that are prefixes of $0101$: $100$? no; $00$? no; $0$ yes. So the machine falls back to state $0$, not to $\varepsilon$ — falling back too far is the classic bug.`,
    },
    {
      type: 'mc',
      q: String.raw`What is the minimum number of states of a DFA for "binary strings ending in $00$"?`,
      choices: ['2', '3', '4', '5'],
      answer: 1,
      explain: String.raw`Remember the number of trailing 0s capped at 2: three states. Three are necessary because $\varepsilon$, $0$, $00$ are pairwise distinguishable ($\varepsilon$ vs $0$ by suffix $0$; each of them vs $00$ by suffix $\varepsilon$).`,
    },
    {
      type: 'mc',
      q: String.raw`$M_1$ recognizes "starts with 0" and has an *implicit* dead state (no transition from the start on 1). $M_2$ (complete) recognizes "ends in 1". A student builds the **union** product without adding $M_1$'s dead state. Which string is wrongly rejected?`,
      choices: [String.raw`$0$`, String.raw`$01$`, String.raw`$11$`, String.raw`$10$`],
      answer: 2,
      explain: String.raw`$11$ ends in 1, so it is in the union, but the product has no transition from the start pair on 1 and the string "dies". $10$ is correctly rejected (in neither language); $0$ and $01$ never leave $M_1$'s live states. In a union, $M_1$ dying must not kill the product.`,
    },
    {
      type: 'mc',
      q: String.raw`Over $\{0,1,2\}$, a DFA for "every 0 is eventually followed (not necessarily immediately) by a 1" needs to remember what?`,
      choices: ['The number of 0s not yet followed by a 1', 'Whether some 0 is still waiting for a later 1', 'The last two symbols', 'The number of 1s mod 2'],
      answer: 1,
      explain: String.raw`One later 1 satisfies **all** waiting 0s at once, so the count of waiting 0s is irrelevant — only whether there is at least one. Two states: "no pending 0" (start, accepting) and "pending 0". A 0 creates an obligation, a 1 clears it, a 2 changes nothing.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L$ is recognized by a DFA with $n$ states, then $\overline{L}$ is recognized by a DFA with at most $n$ states.`,
      answer: true,
      explain: String.raw`Swap accepting and non-accepting states of a complete DFA for $L$. (If the original drawing relies on an implicit dead state, that dead state is one of the $n$ states of the complete machine and becomes accepting.)`,
    },
    {
      type: 'mc',
      q: String.raw`A student proves $\delta^*((s_1,s_2),w) = (\delta_1^*(s_1,w), \delta_2^*(s_2,w))$ by induction on $w$, with the hypothesis stated only for the start pair $(s_1,s_2)$. What goes wrong?`,
      choices: [
        'Nothing; the start pair is all that matters for acceptance',
        String.raw`The inductive step needs the claim at the pair $(\delta_1(s_1,a), \delta_2(s_2,a))$, which the hypothesis does not cover`,
        'The base case fails',
        'Induction on w is impossible for DFAs',
      ],
      answer: 1,
      explain: String.raw`Unfolding $\delta^*((s_1,s_2), ax) = \delta^*((\delta_1(s_1,a), \delta_2(s_2,a)), x)$ moves to a new pair. The fix is to prove the stronger statement for **all** pairs $(p, q)$; that stronger hypothesis is exactly what the step needs.`,
    },
    {
      type: 'short',
      q: 'Including the dead state, how many states does the minimal DFA for "binary strings that start with 01" have?',
      answer: ['4', 'four'],
      explain: String.raw`Start, "read 0", "read 01" (accepting sink), and dead. The four are pairwise distinguishable: e.g. start vs "read 0" by suffix $1$ (only "read 0" accepts $1$), and dead vs start by suffix $01$.`,
    },
    {
      type: 'multi',
      q: String.raw`For $L$ = "binary strings ending in $01$", which pairs of prefixes are **distinguishable**? (select all that apply)`,
      choices: [String.raw`$\varepsilon$ and $1$`, String.raw`$0$ and $01$`, String.raw`$1$ and $0$`, String.raw`$01$ and $1101$`, String.raw`$0$ and $100$`],
      answer: [1, 2],
      explain: String.raw`What matters is the relevant suffix: "no progress", "last symbol 0", or "ends in 01". $\varepsilon$ and $1$: both no progress — equivalent. $0$ vs $01$: suffix $\varepsilon$ separates them. $1$ vs $0$: suffix $1$ gives $11 \notin L$, $01 \in L$. $01$ and $1101$ both end in $01$; $0$ and $100$ both end in 0 — equivalent.`,
    },
    {
      type: 'tf',
      q: String.raw`Over $\{a,b\}$, the language $\{w : \#(a,w) \equiv 2\#(b,w) \pmod 3\}$ is exactly the set of strings whose length is divisible by 3.`,
      answer: true,
      explain: String.raw`$\#a \equiv 2\#b \iff \#a - 2\#b \equiv 0 \iff \#a + \#b \equiv 0 \pmod 3$, since $-2 \equiv 1$. And $\#a + \#b = |w|$. Simplify the arithmetic before you build a product!`,
    },
    {
      type: 'mc',
      q: String.raw`How many states does the minimal DFA for "contains each of $0$, $1$, $2$ at least once" over $\{0,1,2\}$ have?`,
      choices: ['4', '6', '7', '8'],
      answer: 3,
      explain: String.raw`The machine must remember the set of symbols seen so far: $2^3 = 8$ subsets, all reachable and pairwise distinguishable (for $S \ne T$, take $c$ in one but not the other and append the symbols missing from that one).`,
    },
  ],

  flashcards: [
    { front: 'DFA 5-tuple', back: String.raw`$(Q, \Sigma, \delta, s, A)$: states, alphabet, $\delta: Q\times\Sigma\to Q$, start, accepting set.` },
    { front: String.raw`Extended transition function $\delta^*$`, back: String.raw`$\delta^*(q,\varepsilon) = q$; $\delta^*(q, ax) = \delta^*(\delta(q,a), x)$.` },
    { front: 'DFA design question', back: 'After reading a prefix, what is the least information needed to decide membership for every possible continuation? Each value = one state.' },
    { front: 'Binary value mod k DFA', back: String.raw`States $0..k-1$; $\delta(r, b) = (2r + b) \bmod k$; start and accept depend on target residue.` },
    { front: 'DFA for "contains x"', back: 'Track the longest suffix of the input that is a prefix of x; final state "found" is absorbing.' },
    { front: 'Product construction', back: String.raw`States $Q_1\times Q_2$, start $(s_1,s_2)$, $\delta((p,q),a) = (\delta_1(p,a),\delta_2(q,a))$. Accepting set chooses $\cap/\cup/\setminus$.` },
    { front: 'Product accepting set for intersection / union / difference', back: String.raw`$A_1\times A_2$ / $A_1\times Q_2 \cup Q_1\times A_2$ / $A_1 \times (Q_2\setminus A_2)$.` },
    { front: 'Complementing a DFA', back: 'Swap accepting and non-accepting states. The DFA must be complete: the dead state becomes accepting.' },
    { front: 'Dead (trap) state', back: 'A non-accepting state that loops on every symbol. Implicit in this app when transitions are missing.' },
    { front: 'Distinguishable prefixes', back: String.raw`$x, y$ such that some $z$ has exactly one of $xz, yz$ in $L$. They must reach different states; $k$ pairwise distinguishable prefixes $\Rightarrow$ at least $k$ states.` },
    { front: String.raw`Minimal DFA size for "$k$-th symbol from end is 1"`, back: String.raw`$2^k$ (must remember the last $k$ symbols). An NFA needs only $k+1$.` },
    { front: 'How to prove a DFA correct', back: String.raw`Give each state an invariant $D_q$; check $\varepsilon \in D_s$, each transition preserves invariants, accept states match $L$.` },
    { front: 'Splitting lemma and how to prove it', back: String.raw`$\delta^*(q,xy) = \delta^*(\delta^*(q,x),y)$. Induct on $x$ with the hypothesis for **every** state $q$ (the step recurses from $\delta(q,a)$).` },
    { front: 'LSB-first binary value mod k', back: String.raw`States (value mod $k$, $2^i \bmod k$); reading $b$: $(v,p) \mapsto ((v + bp) \bmod k, 2p \bmod k)$. For $k = 5$: $5 \times 4 = 20$ states. For $k=3$ the MSB machine already works.` },
    { front: 'Formal product description (exam style)', back: String.raw`$Q = Q_1 \times Q_2$ with meanings; $s = (s_1,s_2)$; $\delta((p,q),a) = (\delta_1(p,a),\delta_2(q,a))$; $A$ chosen for $\cap$/$\cup$/$\setminus$. Components complete for $\cup$ and $\setminus$.` },
    { front: '"Every X is eventually followed by Y": what to remember', back: 'Only whether an obligation is outstanding (one Y clears all waiting Xs). Two states, no dead state.' },
    { front: 'Two counts mod k at once', back: String.raw`Track the single combination the condition needs, e.g. $(\#0 - 2\#1) \bmod 5$: 0 adds 1, 1 adds 3. Simplify first: $\#a \equiv 2\#b \pmod 3$ is just $|w| \equiv 0$.` },
    { front: 'Why distinguishable prefixes need different states', back: String.raw`If $\delta^*(s,x) = \delta^*(s,y)$ then by the splitting lemma $\delta^*(s,xz) = \delta^*(s,yz)$ for all $z$, so no suffix separates them.` },
    { front: 'Proving the minimal DFA has exactly k states', back: String.raw`(1) a DFA with $k$ states; (2) $k$ pairwise distinguishable prefixes, each pair with an explicit distinguishing suffix.` },
    { front: 'Minimal DFA for binary multiples of 6', back: String.raw`4 states: residues $\{0\}, \{3\}, \{1,4\}, \{2,5\}$ ($r$ and $r+3$ agree after any appended bit; only $\varepsilon$ separates 0 from 3).` },
    { front: 'DFA for "contains each symbol of Σ"', back: String.raw`States = subsets of $\Sigma$ seen so far; $2^{\lvert\Sigma\rvert}$ states, all needed.` },
    { front: 'Run conditions (e.g. 0-runs even, 1-runs odd)', back: 'Remember the current run symbol and the parity of its length; when the run ends with the wrong parity go to dead; accept states check the last run.' },
  ],

  problems: [
    {
      id: 'dfa-even0', type: 'dfa', title: 'Even number of 0s', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings with an even number of 0s.`,
      accepts: s => (s.split('0').length - 1) % 2 === 0,
      sample: String.raw`start: even
accept: even
even 0 -> odd
even 1 -> even
odd 0 -> even
odd 1 -> odd`,
      hints: [String.raw`Remember only the parity of the number of 0s.`],
      solution: String.raw`States <code>even</code> (start, accepting) and <code>odd</code>, meaning "the number of 0s read so far is even/odd". A 0 flips the state, a 1 keeps it.`,
    },
    {
      id: 'dfa-a-then-b', type: 'dfa', title: 'Starts with a, ends with b', difficulty: 1,
      alphabet: 'ab',
      prompt: String.raw`Build a DFA over $\{a,b\}$ for the strings that start with $a$ and end with $b$.`,
      accepts: s => s.startsWith('a') && s.endsWith('b'),
      sample: String.raw`start: s
accept: yb
s a -> ya
ya a -> ya
ya b -> yb
yb a -> ya
yb b -> yb`,
      hints: [String.raw`If the first symbol is $b$, the string can never be accepted.`, String.raw`After a good start, remember the last symbol.`],
      solution: String.raw`Start state <code>s</code>. On $b$ it goes to the (implicit) dead state. On $a$ go to <code>ya</code> = "started with $a$, last symbol $a$". From then on, track the last symbol: <code>ya</code> and <code>yb</code> ("started with $a$, last symbol $b$"), with <code>yb</code> accepting. Note $a$ alone is rejected and $ab$ accepted.`,
    },
    {
      id: 'dfa-second-last', type: 'dfa', title: 'Second-to-last symbol is 1', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings whose second-to-last symbol is $1$ (so the string has length at least 2).`,
      accepts: s => s.length >= 2 && s[s.length - 2] === '1',
      sample: String.raw`start: s00
accept: s10, s11
s00 0 -> s00
s00 1 -> s01
s01 0 -> s10
s01 1 -> s11
s10 0 -> s00
s10 1 -> s01
s11 0 -> s10
s11 1 -> s11`,
      hints: [String.raw`The DFA never knows when the input ends, so it must always remember the last two symbols.`, String.raw`State $s_{xy}$ = "the last two symbols are $xy$" (pretend the input is padded with leading 0s).`],
      solution: String.raw`State <code>sxy</code> means "the last two symbols read were $x y$", where we imagine the input is preceded by $00$ — harmless because a padded 0 is never a 1. Transition: $s_{xy} \xrightarrow{c} s_{yc}$. Accept when $x = 1$: <code>s10</code>, <code>s11</code>. Strings of length 0 or 1 end in <code>s00</code> or <code>s01</code>, correctly rejected. All 4 states are needed: $00, 01, 10, 11$ are pairwise distinguishable.`,
    },
    {
      id: 'dfa-div5', type: 'dfa', title: 'Binary multiples of 5', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings $w$ (most significant bit first, leading 0s allowed) whose value is divisible by 5. Treat $\varepsilon$ as the number 0, so it is accepted.`,
      accepts: s => { let v = 0; for (const c of s) v = (2 * v + (c === '1' ? 1 : 0)) % 5; return v === 0; },
      sample: String.raw`start: r0
accept: r0
r0 0 -> r0
r0 1 -> r1
r1 0 -> r2
r1 1 -> r3
r2 0 -> r4
r2 1 -> r0
r3 0 -> r1
r3 1 -> r2
r4 0 -> r3
r4 1 -> r4`,
      hints: [String.raw`If prefix $x$ has value $v$, then $xb$ has value $2v + b$.`, String.raw`Remember $v \bmod 5$: $\delta(r, b) = (2r + b) \bmod 5$.`],
      solution: String.raw`State $r_i$ means "the prefix read so far has value $\equiv i \pmod 5$". Since $\text{val}(xb) = 2\,\text{val}(x) + b$, set $\delta(r_i, b) = r_{(2i + b) \bmod 5}$:

| | 0 | 1 |
|---|---|---|
| $r_0$ | $r_0$ | $r_1$ |
| $r_1$ | $r_2$ | $r_3$ |
| $r_2$ | $r_4$ | $r_0$ |
| $r_3$ | $r_1$ | $r_2$ |
| $r_4$ | $r_3$ | $r_4$ |

Start and accept $r_0$. Example: $1010 = 10$: $r_0 \to r_1 \to r_2 \to r_0 \to r_0$. Accepted.`,
    },
    {
      id: 'dfa-diff-mod3', type: 'dfa', title: '#a − #b divisible by 3', difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Build a DFA over $\{a,b\}$ for $\{w : \#(a,w) - \#(b,w) \equiv 0 \pmod 3\}$.`,
      accepts: s => { let d = 0; for (const c of s) d += c === 'a' ? 1 : -1; return ((d % 3) + 3) % 3 === 0; },
      sample: String.raw`start: d0
accept: d0
d0 a -> d1
d0 b -> d2
d1 a -> d2
d1 b -> d0
d2 a -> d0
d2 b -> d1`,
      hints: [String.raw`Remember the difference mod 3; $a$ adds 1 and $b$ subtracts 1.`],
      solution: String.raw`State $d_i$: "$\#a - \#b \equiv i \pmod 3$ for the prefix so far". $a$: $d_i \to d_{i+1}$; $b$: $d_i \to d_{i-1}$ (indices mod 3). Start and accept $d_0$.`,
    },
    {
      id: 'dfa-ones-mod3-evenlen', type: 'dfa', title: '#1s divisible by 3 and even length', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings with even length **and** a number of 1s divisible by 3. (Use the product construction.)`,
      accepts: s => s.length % 2 === 0 && (s.split('1').length - 1) % 3 === 0,
      sample: String.raw`start: c0e
accept: c0e
c0e 0 -> c0o
c0e 1 -> c1o
c0o 0 -> c0e
c0o 1 -> c1e
c1e 0 -> c1o
c1e 1 -> c2o
c1o 0 -> c1e
c1o 1 -> c2e
c2e 0 -> c2o
c2e 1 -> c0o
c2o 0 -> c2e
c2o 1 -> c0e`,
      hints: [String.raw`Component 1: number of 1s mod 3 (3 states). Component 2: parity of length (2 states).`, String.raw`Every symbol flips the length parity; only 1s advance the counter.`],
      solution: String.raw`Product of $M_1$ (states $c_0, c_1, c_2$: number of 1s mod 3) and $M_2$ (states $e, o$: length parity). State $c_i e$ etc. Every symbol flips $e \leftrightarrow o$; a 1 also advances $c_i \to c_{i+1 \bmod 3}$. Intersection accepts $A_1 \times A_2 = \{c_0 e\}$. Six states total.`,
    },
    {
      id: 'dfa-no11-even0', type: 'dfa', title: 'No 11 and an even number of 0s', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings that have no two consecutive 1s **and** an even number of 0s.`,
      accepts: s => !s.includes('11') && (s.split('0').length - 1) % 2 === 0,
      sample: String.raw`start: NE
accept: NE, YE
NE 0 -> NO
NE 1 -> YE
NO 0 -> NE
NO 1 -> YO
YE 0 -> NO
YO 0 -> NE`,
      hints: [String.raw`Component 1 remembers whether the last symbol was 1 (and dies on $11$). Component 2 remembers the parity of 0s.`, String.raw`Since this is an intersection, a dead component can simply be the implicit dead state.`],
      solution: String.raw`Product of "no $11$" (states $N$ = last symbol is not 1, $Y$ = last symbol is 1, dead) and "even 0s" (states $E$, $O$). States $NE, NO, YE, YO$ plus implicit dead:
- reading 0: go to $N$, flip parity: $NE \to NO$, $NO \to NE$, $YE \to NO$, $YO \to NE$;
- reading 1: from $N$ go to $Y$ keeping parity ($NE \to YE$, $NO \to YO$); from $Y$ go to dead.

Accept $NE$ and $YE$ (even 0s; reaching any non-dead state means no $11$ so far). Example: $1001$ has two 0s and no $11$: $NE \to YE \to NO \to NE \to YE$, accepted.`,
    },
    {
      id: 'dfa-010-not-111', type: 'dfa', title: 'Contains 010 but not 111', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings that contain $010$ as a substring but do **not** contain $111$.`,
      accepts: s => s.includes('010') && !s.includes('111'),
      sample: String.raw`start: k0t0
accept: k3t0, k3t1, k3t2
k0t0 0 -> k1t0
k0t0 1 -> k0t1
k1t0 0 -> k1t0
k1t0 1 -> k2t1
k0t1 0 -> k1t0
k0t1 1 -> k0t2
k2t1 0 -> k3t0
k2t1 1 -> k0t2
k0t2 0 -> k1t0
k3t0 0 -> k3t0
k3t0 1 -> k3t1
k3t1 0 -> k3t0
k3t1 1 -> k3t2
k3t2 0 -> k3t0`,
      hints: [
        String.raw`This is a difference: $L(\text{contains } 010) \setminus L(\text{contains } 111)$.`,
        String.raw`Component 1: KMP states $k_0$ (nothing), $k_1$ (suffix 0), $k_2$ (suffix 01), $k_3$ (found). Component 2: number of trailing 1s, $t_0, t_1, t_2$, and dead on a third 1.`,
        String.raw`Only 8 product states are reachable.`,
      ],
      solution: String.raw`Let $M_1$ track progress toward $010$: $k_0 \xrightarrow{0} k_1$, $k_0 \xrightarrow{1} k_0$, $k_1 \xrightarrow{0} k_1$, $k_1 \xrightarrow{1} k_2$, $k_2 \xrightarrow{0} k_3$, $k_2 \xrightarrow{1} k_0$, and $k_3$ absorbing. Let $M_2$ track the number of trailing 1s: $t_i \xrightarrow{0} t_0$, $t_0 \xrightarrow{1} t_1$, $t_1 \xrightarrow{1} t_2$, $t_2 \xrightarrow{1}$ dead (a $111$ appeared).

The product, restricted to reachable states, has $k_0t_0, k_1t_0, k_0t_1, k_2t_1, k_0t_2, k_3t_0, k_3t_1, k_3t_2$ (plus dead). The accepting states are $k_3 t_j$ for all $j$: $010$ was found and $M_2$ is not dead. Here it is safe to leave $M_2$'s dead state implicit: once $111$ appears, the string must be rejected whatever follows, so every product state whose second coordinate is dead behaves like one rejecting dead state. (Equivalently, we intersected with a DFA for "does not contain $111$". Rule of thumb: a component's dead state may be left implicit in a product exactly when that component being dead forces the product to reject.)`,
    },
    {
      id: 'dfa-evena-or-endc', type: 'dfa', title: 'Even a\'s or ends in c', difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Over $\{a,b,c\}$, build a DFA for the strings that have an even number of $a$s **or** end in $c$.`,
      accepts: s => (s.split('a').length - 1) % 2 === 0 || s.endsWith('c'),
      sample: String.raw`start: eN
accept: eN, eC, oC
eN a -> oN
eN b -> eN
eN c -> eC
eC a -> oN
eC b -> eN
eC c -> eC
oN a -> eN
oN b -> oN
oN c -> oC
oC a -> eN
oC b -> oN
oC c -> oC`,
      hints: [String.raw`Product of "parity of $a$s" and "last symbol is $c$".`, String.raw`For union, accept if *either* component accepts.`],
      solution: String.raw`States $(\text{parity}, \text{last-is-}c)$: $eN, eC, oN, oC$. On $a$: flip parity, last-is-$c$ becomes $N$. On $b$: keep parity, $N$. On $c$: keep parity, $C$. Union accepting set: every state with $e$ or with $C$: $eN, eC, oC$. Both components are complete, as union requires.`,
    },
    {
      id: 'dfa-product-proof', type: 'written', title: 'Correctness of the product construction', difficulty: 2,
      prompt: String.raw`Let $M_1 = (Q_1,\Sigma,\delta_1,s_1,A_1)$ and $M_2 = (Q_2,\Sigma,\delta_2,s_2,A_2)$ be DFAs, and let $M$ be their product with accepting set $A_1 \times (Q_2 \setminus A_2)$.

1. Prove by induction that $\delta^*((p,q), w) = (\delta_1^*(p,w), \delta_2^*(q,w))$ for all $p, q, w$.
2. Conclude that $L(M) = L(M_1) \setminus L(M_2)$.`,
      rubric: [
        'Induction on w with p, q arbitrary (important: the hypothesis must hold for all states, because the start state changes)',
        'Base case w = ε using δ*(·, ε) = identity in all three machines',
        'Inductive case w = ax: unfold δ*((p,q), ax) = δ*(δ((p,q),a), x) = δ*((δ1(p,a), δ2(q,a)), x), apply IH',
        'Conclusion: w ∈ L(M) iff δ1*(s1,w) ∈ A1 and δ2*(s2,w) ∉ A2 iff w ∈ L1 \\ L2',
      ],
      hints: [String.raw`Induct on $w$, but make the claim about *all* pairs $(p,q)$ — the recursive definition of $\delta^*$ changes the state.`],
      solution: String.raw`**1.** Let $w$ be arbitrary and assume the claim for all strings shorter than $w$ and **all** states $p, q$.
- $w = \varepsilon$: $\delta^*((p,q),\varepsilon) = (p,q) = (\delta_1^*(p,\varepsilon), \delta_2^*(q,\varepsilon))$.
- $w = ax$:
$$\delta^*((p,q), ax) = \delta^*(\delta((p,q),a), x) = \delta^*((\delta_1(p,a), \delta_2(q,a)), x) = (\delta_1^*(\delta_1(p,a), x), \delta_2^*(\delta_2(q,a), x)) = (\delta_1^*(p, ax), \delta_2^*(q, ax)).$$
Steps: definition of $\delta^*$ in $M$; definition of $\delta$ in $M$; IH applied to $x$ with the states $\delta_1(p,a), \delta_2(q,a)$; definition of $\delta_1^*$ and $\delta_2^*$.

**2.** $w \in L(M) \iff \delta^*((s_1,s_2), w) \in A_1 \times (Q_2 \setminus A_2) \iff \delta_1^*(s_1, w) \in A_1 \text{ and } \delta_2^*(s_2, w) \notin A_2 \iff w \in L(M_1) \text{ and } w \notin L(M_2)$. $\blacksquare$

The induction must quantify over all starting pairs, since in the inductive step the IH is used from $(\delta_1(p,a), \delta_2(q,a))$, not from $(p,q)$.`,
    },
    {
      id: 'dfa-mod-invariant', type: 'written', title: 'Proving a mod-counting DFA correct', difficulty: 2,
      prompt: String.raw`Consider the DFA $M$ with states $\{0,1,2\}$, start state $0$, accepting set $\{0\}$ and $\delta(r, b) = (2r + b) \bmod 3$ for $b \in \{0,1\}$. Let $\text{val}(w)$ denote the value of $w$ as a binary number (with $\text{val}(\varepsilon) = 0$).

Prove that $\delta^*(0, w) = \text{val}(w) \bmod 3$ for every $w$, and conclude $L(M)$ is the set of binary multiples of 3. You may use the lemma $\delta^*(q, xb) = \delta(\delta^*(q,x), b)$.`,
      rubric: [
        'Recognizes that the natural induction peels off the LAST symbol (w = xb), since val(xb) = 2 val(x) + b',
        'Base case ε: δ*(0, ε) = 0 = val(ε) mod 3',
        'Inductive step uses the lemma and the IH: δ*(0, xb) = δ(val(x) mod 3, b) = (2(val(x) mod 3) + b) mod 3 = val(xb) mod 3',
        'Conclusion: accepted iff val(w) mod 3 = 0',
      ],
      hints: [String.raw`Every non-empty string can also be written $w = xb$ with $b$ its last symbol. Strong induction lets you use the IH on $x$.`],
      solution: String.raw`Let $w$ be arbitrary and assume the claim for all shorter strings.

- $w = \varepsilon$: $\delta^*(0, \varepsilon) = 0 = \text{val}(\varepsilon) \bmod 3$.
- $w = xb$ with $b \in \{0,1\}$ (every non-empty string has a last symbol): $\text{val}(xb) = 2\,\text{val}(x) + b$. By the lemma and the IH (since $|x| < |w|$),
$$\delta^*(0, xb) = \delta(\delta^*(0,x), b) = \delta(\text{val}(x) \bmod 3, b) = (2(\text{val}(x) \bmod 3) + b) \bmod 3 = (2\,\text{val}(x) + b) \bmod 3 = \text{val}(w) \bmod 3.$$

Hence $w \in L(M) \iff \delta^*(0,w) = 0 \iff \text{val}(w) \equiv 0 \pmod 3$. $\blacksquare$

This illustrates that strong induction lets you split $w$ wherever is convenient — here, at the end.`,
    },
    {
      id: 'dfa-01-10', type: 'written', title: 'Equal counts of 01 and 10', difficulty: 3,
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : \text{the number of occurrences of the substring } 01 \text{ in } w \text{ equals the number of occurrences of } 10\}$. At first glance this looks like it needs unbounded counting. Prove that $L$ is regular by giving a simple characterization of $L$ and a DFA (describe the states).`,
      rubric: [
        'Observes that occurrences of 01 and 10 alternate (each marks a boundary between runs)',
        'Characterization: w ∈ L iff w = ε or the first and last symbols of w are equal',
        'Justification of the characterization (counting run boundaries)',
        'Correct DFA with described states (e.g. start; first=0 last=0; first=0 last=1; first=1 last=1; first=1 last=0)',
      ],
      hints: [String.raw`Each occurrence of $01$ or $10$ is a boundary between a run of 0s and a run of 1s.`, String.raw`Boundaries alternate between the two kinds.`],
      solution: String.raw`**Characterization.** Write a non-empty $w$ as alternating maximal runs. Each boundary between consecutive runs is an occurrence of $01$ (0-run to 1-run) or $10$, and every occurrence of $01$ or $10$ is such a boundary. The boundary types alternate. So if $w$ starts and ends with the same symbol, the number of runs is odd, the number of boundaries is even, and they split equally: $\#01 = \#10$. If $w$ starts and ends with different symbols, the number of runs is even, the number of boundaries is odd, and the two counts differ by one. Also $\varepsilon \in L$ ($0 = 0$). Therefore
$$L = \{\varepsilon\} \cup \{w : |w| \ge 1, \text{ first symbol} = \text{last symbol}\}.$$

**DFA.** States: $s$ (start, nothing read; accepting), $F_0^0$ (first 0, last 0; accepting), $F_0^1$ (first 0, last 1), $F_1^1$ (first 1, last 1; accepting), $F_1^0$ (first 1, last 0). Transitions: $s \xrightarrow{0} F_0^0$, $s \xrightarrow{1} F_1^1$; in $F_0^{\cdot}$ reading $c$ goes to $F_0^c$; in $F_1^{\cdot}$ reading $c$ goes to $F_1^c$. A regex is $\varepsilon + 0 + 1 + 0\Sigma^*0 + 1\Sigma^*1$.`,
    },
    {
      id: 'dfa-div6', type: 'dfa', title: 'Binary multiples of 6', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings (most significant bit first, leading 0s allowed) whose value is divisible by 6. Treat $\varepsilon$ as 0, so it is accepted. *Bonus:* how many states does the minimal DFA have?`,
      accepts: s => { let v = 0; for (const c of s) v = (2 * v + (c === '1' ? 1 : 0)) % 6; return v === 0; },
      sample: String.raw`start: r0
accept: r0
r0 0 -> r0
r0 1 -> r1
r1 0 -> r2
r1 1 -> r3
r2 0 -> r4
r2 1 -> r5
r3 0 -> r0
r3 1 -> r1
r4 0 -> r2
r4 1 -> r3
r5 0 -> r4
r5 1 -> r5`,
      hints: [String.raw`Same recipe as mod 3 and mod 5: $\delta(r, b) = (2r + b) \bmod 6$.`, String.raw`For the bonus: compare residues $r$ and $r + 3$ after appending one bit.`],
      solution: String.raw`State $r_i$ means "the prefix read so far has value $\equiv i \pmod 6$"; $\delta(r_i, b) = r_{(2i+b) \bmod 6}$; start and accept $r_0$. Correctness is the invariant $\delta^*(r_0, x) = r_{\text{val}(x) \bmod 6}$, proved exactly like the mod-3 case using $\text{val}(xb) = 2\,\text{val}(x) + b$.

**Bonus: the minimal DFA has 4 states.** For any appended bit, $2r + b \equiv 2(r+3) + b \pmod 6$, so $r$ and $r + 3$ lead to the same state after one more symbol; they can differ only on the empty suffix, i.e. only if one of them is 0. Hence $r_1 \equiv r_4$ and $r_2 \equiv r_5$, while $r_0 \not\equiv r_3$. The four classes $\{r_0\}, \{r_3\}, \{r_1, r_4\}, \{r_2, r_5\}$ are pairwise distinguishable (for instance $1$ and $10$ are separated by the suffix $10$: $110 = 6$, $1010 = 10$). Equivalently: divisible by 6 iff divisible by 3 and even, and the machine only needs the parity when the value is $\equiv 0 \pmod 3$.`,
      tags: ['mod counting', 'binary numbers', 'minimization'],
    },
    {
      id: 'dfa-1-then-00', type: 'dfa', title: 'Every 1 is immediately followed by 00', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings in which every $1$ is immediately followed by at least two $0$s.`,
      accepts: s => !/1(?!00)/.test(s),
      sample: String.raw`start: ok
accept: ok
ok 0 -> ok
ok 1 -> n2
n2 0 -> n1
n1 0 -> ok`,
      hints: [String.raw`After a 1, how many 0s are you still owed?`, String.raw`What should happen if a 1 arrives while you are still owed a 0?`],
      solution: String.raw`States by "how many 0s are still owed": <code>ok</code> (nothing owed; start, accepting), <code>n2</code> (just read a 1, two 0s owed), <code>n1</code> (one 0 owed). Transitions: <code>ok</code> loops on 0 and goes to <code>n2</code> on 1; <code>n2</code> $\xrightarrow{0}$ <code>n1</code> $\xrightarrow{0}$ <code>ok</code>. A 1 in <code>n2</code> or <code>n1</code> breaks the rule, so it goes to the (implicit) dead state. Only <code>ok</code> accepts: at the end of the input nothing may be owed.

Check: $100100$ accepted; $10$, $1001$ rejected; $\varepsilon$ accepted. Matches the regex $(0+100)^*$.`,
      tags: ['followed by', 'dead state'],
    },
    {
      id: 'dfa-012-count', type: 'dfa', title: '#0 ≡ #1 (mod 3) and contains a 2', difficulty: 2,
      alphabet: '012',
      prompt: String.raw`Over $\Sigma = \{0,1,2\}$, build a DFA for $\{w : \#(0,w) \equiv \#(1,w) \pmod 3 \text{ and } w \text{ contains at least one } 2\}$.`,
      accepts: s => { const n0 = s.split('0').length - 1, n1 = s.split('1').length - 1; return (((n0 - n1) % 3) + 3) % 3 === 0 && s.includes('2'); },
      sample: String.raw`start: d0n
accept: d0y
d0n 0 -> d1n
d0n 1 -> d2n
d0n 2 -> d0y
d1n 0 -> d2n
d1n 1 -> d0n
d1n 2 -> d1y
d2n 0 -> d0n
d2n 1 -> d1n
d2n 2 -> d2y
d0y 0 -> d1y
d0y 1 -> d2y
d0y 2 -> d0y
d1y 0 -> d2y
d1y 1 -> d0y
d1y 2 -> d1y
d2y 0 -> d0y
d2y 1 -> d1y
d2y 2 -> d2y`,
      hints: [String.raw`You need one number mod 3, not two: $d = (\#0 - \#1) \bmod 3$.`, String.raw`Second component: has a 2 appeared yet?`],
      solution: String.raw`Product of two small machines:
- $M_1$: $d = (\#0 - \#1) \bmod 3$; a 0 adds 1, a 1 subtracts 1, a 2 changes nothing. (Tracking $\#0 \bmod 3$ and $\#1 \bmod 3$ separately also works but needs 9 states instead of 3.)
- $M_2$: $n$ = "no 2 yet", $y$ = "seen a 2"; a 2 moves $n \to y$, and $y$ is absorbing.

Product state $d_i t$; start $d_0 n$; accept $A_1 \times A_2 = \{d_0 y\}$. Six states, all reachable.`,
      tags: ['product', 'ternary alphabet', 'mod counting'],
    },
    {
      id: 'dfa-runs-parity', type: 'dfa', title: 'Even 0-runs and odd 1-runs', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings in which every maximal run of $0$s has **even** length and every maximal run of $1$s has **odd** length. For example $\varepsilon$, $1$, $001$, $10011100$ are in; $0$, $11$, $0010$ are not.`,
      accepts: s => (s.match(/0+|1+/g) || []).every(r => (r[0] === '0' ? r.length % 2 === 0 : r.length % 2 === 1)),
      sample: String.raw`start: s
accept: s, z0, o1
s 0 -> z1
s 1 -> o1
z1 0 -> z0
z0 0 -> z1
z0 1 -> o1
o1 1 -> o0
o1 0 -> z1
o0 1 -> o1`,
      hints: [
        String.raw`Remember which symbol the current run consists of and the parity of its length.`,
        String.raw`When the other symbol arrives, the current run has ended: check its parity right then.`,
        String.raw`At the end of the input the last run must also be OK — that decides the accepting states.`,
      ],
      solution: String.raw`States: <code>s</code> (empty input), <code>z1</code>/<code>z0</code> (currently in a run of 0s of odd/even length; all earlier runs fine), <code>o1</code>/<code>o0</code> (in a run of 1s of odd/even length), and an implicit dead state.

- Continuing a run flips its parity: <code>z1</code> $\leftrightarrow$ <code>z0</code> on 0, <code>o1</code> $\leftrightarrow$ <code>o0</code> on 1.
- Switching symbols ends the current run: from <code>z0</code> (even 0-run, good) a 1 starts a 1-run of length 1 (<code>o1</code>); from <code>z1</code> a 1 means a 0-run ended with odd length — dead. From <code>o1</code> (odd 1-run, good) a 0 goes to <code>z1</code>; from <code>o0</code> a 0 — dead.
- From <code>s</code>: 0 $\to$ <code>z1</code>, 1 $\to$ <code>o1</code>.

Accepting: the states where the current (last) run is fine: <code>s</code>, <code>z0</code>, <code>o1</code>.

Trace $10011100$: s, o1, z1, z0, o1, o0, o1, z1, z0 — accepted.`,
      tags: ['runs', 'what to remember'],
    },
    {
      id: 'dfa-second-both-ends', type: 'dfa', title: 'Second symbol and second-to-last symbol are both 1', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings $w$ of length at least 2 whose **second** symbol is $1$ and whose **second-to-last** symbol is $1$. (For $|w| = 2$ these are the first and second symbols; for $|w| = 3$ they are the same position.)`,
      accepts: s => s.length >= 2 && s[1] === '1' && s[s.length - 2] === '1',
      sample: String.raw`start: p0
accept: l10, l11
p0 0 -> p10
p0 1 -> p11
p10 1 -> l01
p11 1 -> l11
l00 0 -> l00
l00 1 -> l01
l01 0 -> l10
l01 1 -> l11
l10 0 -> l00
l10 1 -> l01
l11 0 -> l10
l11 1 -> l11`,
      hints: [
        String.raw`The prefix condition is checked once, at the second symbol; a 0 there means dead.`,
        String.raw`After that, remember the last two symbols. Careful: for a length-2 input the second-to-last symbol is the first symbol, so you must remember it.`,
      ],
      solution: String.raw`Phase 1 (prefix): <code>p0</code> = nothing read; <code>p1x</code> = one symbol read, and it was $x$ (we must remember it, since for $|w| = 2$ it is the second-to-last symbol). Reading the second symbol: 0 $\to$ dead (second symbol must be 1); 1 $\to$ <code>lx1</code>.

Phase 2 (suffix): <code>lxy</code> = "the second symbol was 1, and the last two symbols are $xy$"; $\texttt{l}xy \xrightarrow{c} \texttt{l}yc$. Accept when $x = 1$: <code>l10</code>, <code>l11</code>.

This is a product in spirit ("second symbol is 1" $\times$ "second-to-last is 1"), but sharing the remembered symbols keeps it small: 7 live states plus dead. Check: $11$ ✓, $01$ ✗, $010$ ✓, $0110$ ✓, $0101$ ✗, $1011$ ✗ (second symbol 0).`,
      tags: ['prefix and suffix', 'product'],
    },
    {
      id: 'dfa-zeros-minus-2ones', type: 'dfa', title: '#0 − 2·#1 divisible by 5', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for $\{w \in \{0,1\}^* : \#(0,w) - 2\cdot\#(1,w) \equiv 0 \pmod 5\}$.`,
      accepts: s => { const n0 = s.split('0').length - 1, n1 = s.split('1').length - 1; return (((n0 - 2 * n1) % 5) + 5) % 5 === 0; },
      sample: String.raw`start: m0
accept: m0
m0 0 -> m1
m0 1 -> m3
m1 0 -> m2
m1 1 -> m4
m2 0 -> m3
m2 1 -> m0
m3 0 -> m4
m3 1 -> m1
m4 0 -> m0
m4 1 -> m2`,
      hints: [String.raw`Don't track two counters: track $d = (\#0 - 2\#1) \bmod 5$ directly.`, String.raw`A 0 adds 1; a 1 adds $-2 \equiv 3$.`],
      solution: String.raw`State $m_i$: "$\#0 - 2\#1 \equiv i \pmod 5$ for the prefix read so far". A 0 adds 1 and a 1 adds $-2 \equiv 3 \pmod 5$: $\delta(m_i, 0) = m_{(i+1) \bmod 5}$, $\delta(m_i, 1) = m_{(i+3) \bmod 5}$. Start and accept $m_0$.

Check: $001$ has $2 - 2 = 0$ ✓; $110000$ has $4 - 4 = 0$ ✓; $00000$ ✓; $0$ ✗; $1$ ($-2$) ✗; $11110$ ($1 - 8 = -7$) ✗. Tracking both counts mod 5 would give 25 states for the same language; the minimal DFA has 5 (all residues are distinguishable, since appending 0s moves through every residue).`,
      tags: ['mod counting', 'linear combination'],
    },
    {
      id: 'dfa-contains11-ends01', type: 'dfa', title: 'Contains 11 and ends in 01', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings that contain $11$ as a substring **and** end in $01$. (Use a product construction; you need only the reachable states.)`,
      accepts: s => s.includes('11') && s.endsWith('01'),
      sample: String.raw`start: nx
accept: fe
nx 0 -> nz
nx 1 -> ox
nz 0 -> nz
nz 1 -> oe
ox 0 -> nz
ox 1 -> fx
oe 0 -> nz
oe 1 -> fx
fx 0 -> fz
fx 1 -> fx
fz 0 -> fz
fz 1 -> fe
fe 0 -> fz
fe 1 -> fx`,
      hints: [
        String.raw`$M_1$ (contains 11): $n$ = not found, last symbol not 1; $o$ = not found, last symbol 1; $f$ = found.`,
        String.raw`$M_2$ (ends in 01): $x$ = no progress, $z$ = last symbol 0, $e$ = ends in 01.`,
        String.raw`Start at $(n, x)$ and explore; accept only $(f, e)$.`,
      ],
      solution: String.raw`**Components.** $M_1$: $n \xrightarrow{0} n$, $n \xrightarrow{1} o$, $o \xrightarrow{0} n$, $o \xrightarrow{1} f$, $f$ absorbing. $M_2$: $x \xrightarrow{0} z$, $x \xrightarrow{1} x$, $z \xrightarrow{0} z$, $z \xrightarrow{1} e$, $e \xrightarrow{0} z$, $e \xrightarrow{1} x$.

**Product (reachable part).** Start $nx$. Note that the second coordinate is determined by the last two symbols, and $o$ ("last symbol 1, no $11$ yet") pairs only with $x$ or $e$. Exploring gives 7 states: $nx, nz, ox, oe, fx, fz, fe$, with $\delta((p,q),c) = (\delta_1(p,c), \delta_2(q,c))$ as listed. Accepting: $A_1 \times A_2 = \{fe\}$.

Trace $1101$: $nx \to ox \to fx \to fz \to fe$, accepted. $0101$: $nx \to nz \to oe \to nz \to oe$, rejected (no $11$). $110$: ends at $fz$, rejected.`,
      tags: ['product', 'substrings', 'suffix'],
    },
    {
      id: 'dfa-value-vs-ones', type: 'dfa', title: 'Binary value ≡ number of 1s (mod 3)', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings $w$ (MSB first, $\text{val}(\varepsilon) = 0$) such that $\text{val}(w) \equiv \#(1, w) \pmod 3$.`,
      accepts: s => { let v = 0, k = 0; for (const c of s) { v = (2 * v + (c === '1' ? 1 : 0)) % 3; if (c === '1') k++; } return v === k % 3; },
      sample: String.raw`start: v0c0
accept: v0c0, v1c1, v2c2
v0c0 0 -> v0c0
v0c0 1 -> v1c1
v1c1 0 -> v2c1
v1c1 1 -> v0c2
v2c1 0 -> v1c1
v2c1 1 -> v2c2
v0c2 0 -> v0c2
v0c2 1 -> v1c0
v2c2 0 -> v1c2
v2c2 1 -> v2c0
v1c0 0 -> v2c0
v1c0 1 -> v0c1
v1c2 0 -> v2c2
v1c2 1 -> v0c0
v2c0 0 -> v1c0
v2c0 1 -> v2c1
v0c1 0 -> v0c1
v0c1 1 -> v1c2`,
      hints: [String.raw`Run the mod-3 value machine and a mod-3 counter of 1s in parallel.`, String.raw`Accept the pairs whose two coordinates are equal.`],
      solution: String.raw`Product of $M_1$ (value mod 3: $v \mapsto (2v + b) \bmod 3$) and $M_2$ (number of 1s mod 3: $c \mapsto (c + b) \bmod 3$). State $(v, c)$, start $(0,0)$, $\delta((v,c), b) = ((2v+b) \bmod 3, (c+b) \bmod 3)$. This is neither an intersection nor a union: the accepting set is the "diagonal" $\{(v,c) : v = c\}$ — any set of pairs is allowed, which is what makes the product construction so flexible. All 9 pairs are reachable.

Checks: $1$: $(1,1)$ ✓; $10$: value 2, one 1: $(2,1)$ ✗; $11$: value $3 \equiv 0$, two 1s: $(0,2)$ ✗; $101$: value $5 \equiv 2$, two 1s: $(2,2)$ ✓.`,
      tags: ['product', 'binary numbers', 'custom accepting set'],
    },
    {
      id: 'dfa-012-pending', type: 'dfa', title: 'Every 0 is eventually followed by a 1 (alphabet 012)', difficulty: 2,
      alphabet: '012',
      prompt: String.raw`Over $\{0,1,2\}$, build a DFA for the strings in which every $0$ has a $1$ **somewhere** after it (not necessarily immediately).`,
      accepts: s => !s.includes('0') || s.lastIndexOf('0') < s.lastIndexOf('1'),
      sample: String.raw`start: ok
accept: ok
ok 0 -> pend
ok 1,2 -> ok
pend 0,2 -> pend
pend 1 -> ok`,
      hints: [String.raw`Does it matter how many 0s are waiting?`, String.raw`One 1 satisfies every earlier 0 at once.`],
      solution: String.raw`Remember only whether some 0 is still waiting for a 1. <code>ok</code> (no waiting 0; start, accepting) and <code>pend</code> (at least one waiting 0). A 0 always leads to <code>pend</code>; a 1 always leads to <code>ok</code> (it satisfies every waiting 0); a 2 changes nothing. No dead state is needed: an obligation can always still be met later.

Check: $0210$ ✗ (the last 0 is never followed by a 1), $0221$ ✓, $222$ ✓, $\varepsilon$ ✓.`,
      tags: ['eventually', 'ternary alphabet'],
    },
    {
      id: 'dfa-01-count-even', type: 'dfa', title: 'Even number of occurrences of 01', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings in which the substring $01$ occurs an **even** number of times (zero counts as even). For example $\varepsilon$, $0101$, $1100$, $10101$ are in; $01$, $0011$, $1001$ are not.`,
      accepts: s => { let k = 0; for (let i = 0; i + 1 < s.length; i++) if (s[i] === '0' && s[i + 1] === '1') k++; return k % 2 === 0; },
      sample: String.raw`start: e1
accept: e1, e0
e1 0 -> e0
e1 1 -> e1
e0 0 -> e0
e0 1 -> o1
o1 0 -> o0
o1 1 -> o1
o0 0 -> o0
o0 1 -> e1`,
      hints: [String.raw`A new occurrence of $01$ is completed exactly when a 1 is read right after a 0.`, String.raw`Remember: the parity of the count so far, and whether the last symbol was 0.`],
      solution: String.raw`State $(p, \ell)$ with $p \in \{e, o\}$ the parity of the number of $01$s so far and $\ell$ = "last symbol was 0" ($\ell = 0$) or not ($\ell = 1$, which includes the empty prefix). Reading 0 keeps the parity and sets $\ell = 0$. Reading 1 flips the parity iff $\ell = 0$, and sets $\ell = 1$. Start $e1$; accept $e1, e0$.

The key fact behind the transitions: $\#_{01}(xb) = \#_{01}(x) + 1$ if $x$ ends in 0 and $b = 1$, and $\#_{01}(xb) = \#_{01}(x)$ otherwise. (The written problem "Prove the 01-parity DFA correct" turns this into a full invariant proof.)`,
      tags: ['counting substrings', 'product'],
    },
    {
      id: 'dfa-1-eventually-00', type: 'dfa', title: 'Every 1 is eventually followed by 00', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Build a DFA for the binary strings in which every $1$ has an occurrence of $00$ somewhere after it (not necessarily immediately). For example $100$, $1100$, $10100$, $0$ are in; $1$, $1001$, $10101$ are not.`,
      accepts: s => { const i = s.lastIndexOf('1'); return i < 0 || s.slice(i + 1).includes('00'); },
      sample: String.raw`start: ok
accept: ok
ok 0 -> ok
ok 1 -> pn
pn 0 -> p0
pn 1 -> pn
p0 0 -> ok
p0 1 -> pn`,
      hints: [String.raw`Only the obligations of the **last** 1 matter.`, String.raw`While an obligation is pending, track progress toward $00$ — and what does a new 1 do to that progress?`],
      solution: String.raw`States: <code>ok</code> (no pending obligation; start, accepting), <code>pn</code> (pending, and the current suffix has no progress toward $00$), <code>p0</code> (pending, and the last symbol is a 0 read after the last 1).

- <code>ok</code>: 0 stays; 1 creates an obligation $\to$ <code>pn</code>.
- <code>pn</code>: 0 $\to$ <code>p0</code>; 1 $\to$ <code>pn</code>.
- <code>p0</code>: 0 completes $00$, which satisfies every earlier 1 $\to$ <code>ok</code>; 1 starts a new obligation and the $00$ must now come after this new 1 $\to$ <code>pn</code>.

Note that an occurrence of $00$ only counts if it lies entirely after the 1: in $1001$ the $00$ satisfies the first 1, but the last 1 is unsatisfied.`,
      tags: ['eventually', 'substrings'],
    },
    {
      id: 'dfa-lsb-mod5', type: 'written', title: 'LSB-first multiples of 5 (formal description)', difficulty: 3,
      prompt: String.raw`A binary string $w = b_0 b_1 \cdots b_{n-1}$ is read **least significant bit first**, so it represents $\text{val}_{\text{LSB}}(w) = \sum_{i} b_i 2^i$ (and $\varepsilon$ represents 0).

1. Give a formal description $(Q, \Sigma, \delta, s, A)$ of a DFA accepting $\{w : \text{val}_{\text{LSB}}(w) \equiv 0 \pmod 5\}$, with the meaning of each state.
2. State the invariant and prove it by induction.
3. Show by example that the MSB-first mod-5 DFA does **not** work here.`,
      rubric: [
        'States are pairs (v, p) with v = value mod 5 and p = 2^i mod 5 (the weight of the next bit), e.g. Q = Z_5 × {1,2,4,3}; 20 states',
        'Correct δ((v,p), b) = ((v + b·p) mod 5, 2p mod 5), start (0, 1), A = {(0, p)}',
        'Invariant δ*(s, x) = (val_LSB(x) mod 5, 2^|x| mod 5), proved by induction peeling the last bit: val_LSB(xb) = val_LSB(x) + b·2^|x|',
        'Concrete counterexample for the MSB machine, e.g. 11001 (MSB-first value 25, LSB-first value 19)',
      ],
      hints: [String.raw`Appending bit $b$ to $x$ adds $b \cdot 2^{|x|}$. So besides the value mod 5 you need $2^{|x|} \bmod 5$.`, String.raw`$2^i \bmod 5$ cycles $1, 2, 4, 3$.`],
      solution: String.raw`**1.** $\Sigma = \{0,1\}$. $Q = \{0,1,2,3,4\} \times \{1,2,3,4\}$; state $(v, p)$ means "the prefix read so far has LSB-value $\equiv v \pmod 5$, and the next bit will have weight $\equiv p \pmod 5$". (Only $p \in \{1,2,4,3\}$ occurs, since $2^i \bmod 5$ is never 0.)
- $s = (0, 1)$: empty prefix has value 0; the first bit has weight $2^0 = 1$.
- $\delta((v,p), b) = ((v + b\,p) \bmod 5,\ 2p \bmod 5)$.
- $A = \{(0, p) : p \in \{1,2,3,4\}\}$.

**2. Invariant:** $\delta^*(s, x) = (\text{val}_{\text{LSB}}(x) \bmod 5,\ 2^{|x|} \bmod 5)$. Induction on $x$, peeling the last bit (strong induction allows $x = x'b$). Base: $\delta^*(s, \varepsilon) = (0, 1) = (0 \bmod 5, 2^0 \bmod 5)$. Step: let $x = x'b$. By the splitting lemma and the IH,
$$\delta^*(s, x'b) = \delta\big((\text{val}(x') \bmod 5,\ 2^{|x'|} \bmod 5),\ b\big) = \big((\text{val}(x') + b\,2^{|x'|}) \bmod 5,\ 2^{|x'|+1} \bmod 5\big),$$
and $\text{val}_{\text{LSB}}(x'b) = \text{val}_{\text{LSB}}(x') + b \cdot 2^{|x'|}$, $|x'b| = |x'| + 1$. So $w$ is accepted iff $\text{val}_{\text{LSB}}(w) \equiv 0$. $\blacksquare$

**3.** $w = 11001$: MSB-first it is $25$, so the MSB machine accepts it; LSB-first it is $1 + 2 + 16 = 19$, which is not a multiple of 5. (For modulus 3 the MSB machine happens to work, because $2 \equiv -1 \pmod 3$ makes the language closed under reversal.)`,
      tags: ['formal description', 'binary numbers', 'invariant'],
    },
    {
      id: 'dfa-01-parity-proof', type: 'written', title: 'Prove the 01-parity DFA correct', difficulty: 3,
      prompt: String.raw`Consider the DFA with states $e1, e0, o1, o0$, start $e1$, accepting $\{e1, e0\}$ and transitions
$e1 \xrightarrow{0} e0$, $e1 \xrightarrow{1} e1$, $e0 \xrightarrow{0} e0$, $e0 \xrightarrow{1} o1$, $o1 \xrightarrow{0} o0$, $o1 \xrightarrow{1} o1$, $o0 \xrightarrow{0} o0$, $o0 \xrightarrow{1} e1$.

Let $N(x)$ be the number of occurrences of $01$ in $x$. Prove that the DFA accepts exactly the strings $w$ with $N(w)$ even. Give an explicit description of each state and prove it by induction.`,
      rubric: [
        'State descriptions: e/o = parity of N(x); second letter: 0 iff x ends in 0 (1 = empty or ends in 1)',
        'Fact used: N(xb) = N(x) + 1 if x ends in 0 and b = 1, else N(x) (an occurrence ending at the new last position must be the new 01)',
        'Induction on x (peeling the last symbol, using δ*(s, xb) = δ(δ*(s, x), b)) checking all 8 transitions against the descriptions',
        'Base case ε satisfies the description of e1 (N = 0, does not end in 0); conclusion from accepting set',
      ],
      hints: [String.raw`Describe $e0$ as "$N(x)$ even and $x$ ends in 0", and so on.`, String.raw`The occurrences of $01$ in $xb$ are those in $x$, plus possibly one ending at the new last symbol.`],
      solution: String.raw`**Descriptions.** For a prefix $x$:
- $e1$: $N(x)$ even and $x$ does not end in 0 (empty or ends in 1); $e0$: $N(x)$ even and $x$ ends in 0;
- $o1$: $N(x)$ odd and $x$ does not end in 0; $o0$: $N(x)$ odd and $x$ ends in 0.

These are mutually exclusive and cover all strings.

**Fact.** Every occurrence of $01$ in $xb$ either lies inside $x$ or ends at the last position; the latter exists iff $x$ ends in 0 and $b = 1$. So $N(xb) = N(x) + [x \text{ ends in } 0 \text{ and } b = 1]$.

**Claim.** $\delta^*(e1, x)$ is the state whose description $x$ satisfies. Strong induction on $x$.
- $x = \varepsilon$: $\delta^*(e1, \varepsilon) = e1$, and $N(\varepsilon) = 0$ is even and $\varepsilon$ does not end in 0. ✓
- $x = x'b$: by the IH, $q = \delta^*(e1, x')$ is the state described by $x'$, and $\delta^*(e1, x) = \delta(q, b)$ by the splitting lemma. Check each transition:
  - reading 0 never changes $N$ and makes the string end in 0: $e1, e0 \to e0$ and $o1, o0 \to o0$ ✓;
  - reading 1 after a string not ending in 0 keeps $N$ and makes the string end in 1: $e1 \to e1$, $o1 \to o1$ ✓;
  - reading 1 after a string ending in 0 adds one occurrence, flipping the parity: $e0 \to o1$, $o0 \to e1$ ✓.

So the claim holds for $x$. **Conclusion:** $w$ is accepted iff $\delta^*(e1, w) \in \{e1, e0\}$ iff $N(w)$ is even. $\blacksquare$`,
      tags: ['correctness proof', 'invariant'],
    },
    {
      id: 'dfa-lower-bound-5', type: 'written', title: 'Every DFA for multiples of 5 needs 5 states', difficulty: 3,
      prompt: String.raw`Let $L$ be the set of binary strings (MSB first, $\varepsilon$ = 0) whose value is divisible by 5. Prove that every DFA for $L$ has at least 5 states. (Hint: find 5 pairwise distinguishable prefixes, and justify a distinguishing suffix for every pair.)`,
      rubric: [
        'Chooses 5 prefixes with different residues mod 5, e.g. ε, 1, 10, 11, 100 (values 0..4)',
        'Distinguishing suffix for residues r ≠ r\': a suffix z of fixed length k with val(z) ≡ −2^k r (mod 5), e.g. k = 3 (val(z) ∈ {0,..,7} covers every residue)',
        'Shows xz ∈ L while x\'z ∉ L because 2^k (r\' − r) ≢ 0 mod 5 (5 is prime and does not divide 2^k or r\' − r)',
        'Concludes via the lemma: distinguishable prefixes reach different states (splitting lemma)',
      ],
      hints: [String.raw`$\text{val}(xz) = 2^{|z|}\,\text{val}(x) + \text{val}(z)$.`, String.raw`With $|z| = 3$, $\text{val}(z)$ can be any number from 0 to 7, hence any residue mod 5.`],
      solution: String.raw`Take $x_0 = \varepsilon, x_1 = 1, x_2 = 10, x_3 = 11, x_4 = 100$, with $\text{val}(x_r) = r$.

**Pairwise distinguishable.** Let $r \ne r'$. Choose a 3-bit string $z$ with $\text{val}(z) \equiv -8r \pmod 5$ (possible: 3-bit strings have values $0, \ldots, 7$, covering every residue mod 5). Then
$$\text{val}(x_r z) = 8r + \text{val}(z) \equiv 0, \qquad \text{val}(x_{r'} z) = 8r' + \text{val}(z) \equiv 8(r' - r) \pmod 5.$$
Since 5 is prime and divides neither 8 nor $r' - r$ (as $0 < |r' - r| < 5$), the second value is not $\equiv 0$. So $x_r z \in L$ and $x_{r'} z \notin L$.

For example $x_1 = 1$ and $x_2 = 10$: $-8 \equiv 2$, so $z = 010$: $1010 = 10 \in L$, $10010 = 18 \notin L$.

**Conclusion.** If a DFA had fewer than 5 states, two of the $x_r$ would reach the same state $q$; by the splitting lemma, $\delta^*(s, x_r z) = \delta^*(q, z) = \delta^*(s, x_{r'}z)$, so the DFA would treat $x_r z$ and $x_{r'} z$ the same — contradiction. Hence at least 5 states, and the mod-5 machine shows 5 suffice. $\blacksquare$`,
      tags: ['lower bound', 'distinguishability'],
    },
    {
      id: 'dfa-union-formal', type: 'written', title: 'Formal product for a union', difficulty: 2,
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : w \text{ contains } 00 \text{ as a substring, or } \#(1,w) \equiv 0 \pmod 3\}$.

Give a formal description $(Q, \Sigma, \delta, s, A)$ of a DFA for $L$ via the product construction: define both component DFAs (with state meanings), the product's states, start state, transition function and accepting set. Then say how many states your DFA has and whether any component needs an explicit dead state.`,
      rubric: [
        'Component 1 for "contains 00": states with meanings (e.g. N = no 00 and last symbol not 0, Z = no 00 and last symbol 0, F = found, absorbing) — complete',
        'Component 2: counter c ∈ {0,1,2} of 1s mod 3, complete',
        'Product: Q = {N,Z,F} × {0,1,2}, s = (N, 0), δ((p,c), b) = (δ1(p,b), δ2(c,b)) given explicitly',
        'Union accepting set: A = {(F, c)} ∪ {(p, 0)} — 5 of the 9 pairs; notes that both components must be complete (no implicit dead states) for a union',
      ],
      hints: [String.raw`"Contains 00" needs no dead state at all: its "found" state is an accepting sink.`, String.raw`Accept a pair if either coordinate accepts.`],
      solution: String.raw`**Component $M_1$ (contains $00$).** $Q_1 = \{N, Z, F\}$: $N$ = "no $00$ yet and the prefix does not end in 0" (includes $\varepsilon$), $Z$ = "no $00$ yet and the prefix ends in 0", $F$ = "$00$ has occurred". $s_1 = N$; $\delta_1(N,0) = Z$, $\delta_1(N,1) = N$, $\delta_1(Z,0) = F$, $\delta_1(Z,1) = N$, $\delta_1(F, b) = F$. $A_1 = \{F\}$. Complete.

**Component $M_2$ (1s mod 3).** $Q_2 = \{0,1,2\}$, state $c$ = "the number of 1s so far is $\equiv c \pmod 3$"; $s_2 = 0$; $\delta_2(c, 0) = c$, $\delta_2(c, 1) = (c+1) \bmod 3$; $A_2 = \{0\}$. Complete.

**Product.** $Q = Q_1 \times Q_2$ (9 states); $s = (N, 0)$; $\delta((p, c), b) = (\delta_1(p, b), \delta_2(c, b))$; for the union,
$$A = (A_1 \times Q_2) \cup (Q_1 \times A_2) = \{(F,0), (F,1), (F,2), (N,0), (Z,0)\}.$$

By the product lemma, $w \in L(M)$ iff $\delta_1^*(N, w) = F$ or $\delta_2^*(0, w) = 0$, iff $w$ contains $00$ or has a multiple of 3 ones. Both components are complete, as a union requires; neither needs a dead state (if $M_1$ had an implicit dead state, it would have to be added before taking the union). All 9 states are reachable; the three $F$-states could be merged into one accepting sink, giving 7 states, but that is optional.`,
      tags: ['product', 'formal description', 'union'],
    },
  ],
});
