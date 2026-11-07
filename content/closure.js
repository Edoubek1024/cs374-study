CS374.topic({
  id: 'closure',
  unit: 'models',
  order: 5,
  title: 'Closure Properties & Language Transformations',
  summary: 'Regular languages are closed under union, intersection, complement, concatenation, star, reversal and (inverse) homomorphism. Learn the constructions behind each, how to prove closure under new operations with NFA tricks, how to use closure to prove regularity, and the classic pitfalls.',
  objectives: [
    'State and justify the standard closure properties of regular languages',
    'Prove closure under a new operation by building an NFA from a DFA for L, with a clear description of states',
    'Use layered "copies" of a DFA to handle one-time events (insert/delete a symbol)',
    'Use parallel and guessed simulations for operations like half(L), every-other-symbol and cycle',
    'Use closure properties to prove a language regular (or, contrapositively, not regular)',
    'Avoid pitfalls: infinite unions, subsets, and one-directional closure arguments',
  ],

  lesson: String.raw`## What closure means

A class of languages is **closed** under an operation if applying the operation to languages in the class always yields a language in the class. Closure properties are the main tool for proving that a language is regular *without* building a machine from scratch: express it in terms of languages already known to be regular, using operations that preserve regularity.

Each closure proof has the same shape: *given* automata (or regexes) for the input languages, *construct* an automaton (or regex) for the result, and *argue* the construction is correct.

## The standard closure properties

| Operation | Construction | Model used |
|---|---|---|
| $L_1 \cup L_2$ | $\varepsilon$-fork from a new start state, or product | NFA / DFA |
| $L_1 \cap L_2$ | product, accept $A_1 \times A_2$ | DFA |
| $\overline{L}$ | swap accepting states of a **complete DFA** | DFA |
| $L_1 \setminus L_2$ | $L_1 \cap \overline{L_2}$, or product | DFA |
| $L_1 L_2$ | $\varepsilon$ from accepts of $N_1$ to start of $N_2$ | NFA |
| $L^*$ | new accepting start; $\varepsilon$ from accepts back to the start | NFA |
| $L^R$ | reverse every edge; new start with $\varepsilon$ to old accepts; old start becomes the only accept | NFA |
| $h(L)$ | substitute $h(a)$ for each symbol $a$ in a regex | regex |
| $h^{-1}(L)$ | $\delta'(q, a) = \delta^*(q, h(a))$ | DFA |

Here a **homomorphism** is a function $h : \Sigma \to \Gamma^*$ extended to strings by $h(a_1 \cdots a_n) = h(a_1) \cdots h(a_n)$; $h(L) = \{h(w) : w \in L\}$ and $h^{-1}(L) = \{w : h(w) \in L\}$.

> **Theorem.** The regular languages are closed under all the operations in the table.

A few remarks:

- **Reversal.** If $N$ accepts $w$ by a path from $s$ to some $f \in A$, the reversed machine has the reversed path from $f$ to $s$ reading $w^R$. The new start with $\varepsilon$-moves to every old accepting state lets it guess which $f$. (Alternatively: induct on the regex, with $(rs)^R = s^R r^R$ and $(r^*)^R = (r^R)^*$.)
- **Inverse homomorphism.** The new DFA reads symbol $a$ by "pretending to read the whole string $h(a)$". By induction, $\delta'^*(q, w) = \delta^*(q, h(w))$, so it accepts $w$ iff $h(w) \in L$.
- **Star**: the new start state must be fresh. Making the old start accepting is a classic bug (see the NFA topic).

## Proofs of the standard closure properties

These are short, but you should be able to reproduce each one; they are the models for every new construction.

**Product construction ($\cap$, $\cup$, $\setminus$).** Let $M_i = (Q_i, \Sigma, \delta_i, s_i, A_i)$ be DFAs. Define $M = (Q_1 \times Q_2, \Sigma, \delta, (s_1, s_2), A)$ with $\delta((p, q), a) = (\delta_1(p, a), \delta_2(q, a))$.

> **Lemma.** For every $w$, $\delta^*((s_1, s_2), w) = (\delta_1^*(s_1, w), \delta_2^*(s_2, w))$.

*Proof.* Induction on $|w|$. For $w = \varepsilon$ both sides are $(s_1, s_2)$. For $w = xa$: $\delta^*((s_1,s_2), xa) = \delta(\delta^*((s_1,s_2), x), a) = \delta((\delta_1^*(s_1,x), \delta_2^*(s_2,x)), a) = (\delta_1^*(s_1, xa), \delta_2^*(s_2, xa))$. $\blacksquare$

So choosing $A = A_1 \times A_2$ gives $L_1 \cap L_2$; $A = (A_1 \times Q_2) \cup (Q_1 \times A_2)$ gives $L_1 \cup L_2$; $A = A_1 \times (Q_2 \setminus A_2)$ gives $L_1 \setminus L_2$. Any Boolean combination works the same way.

**Complement.** A *complete* DFA has exactly one run on every input, so swapping $A$ with $Q \setminus A$ flips the answer on every string. (With missing transitions, first add an explicit dead state.)

**Reversal.** Let $N$ be an NFA for $L$. Build $N^R$: reverse every edge, add a new start state with $\varepsilon$-edges to every old accepting state, and make the old start the only accepting state. A walk $s \leadsto f$ spelling $w$ in $N$ (with $f \in A$) becomes, read backwards, a walk $f \leadsto s$ spelling $w^R$ in $N^R$, and vice versa. Hence $w \in L(N) \iff w^R \in L(N^R)$, i.e. $L(N^R) = L^R$.

**Homomorphism.** If $r$ is a regex for $L$, let $h(r)$ be $r$ with every symbol $a$ replaced by the string $h(a)$ (written as a regex). By structural induction, $L(h(r)) = h(L(r))$: the key facts are $h(L_1 \cup L_2) = h(L_1) \cup h(L_2)$, $h(L_1 L_2) = h(L_1)h(L_2)$ and $h(L^*) = h(L)^*$, all immediate because $h$ acts symbol by symbol.

**Inverse homomorphism.** Given a DFA $M$ for $L$, keep $Q$, $s$, $A$ and set $\delta'(q, a) = \delta^*(q, h(a))$. By induction on $|w|$, $\delta'^*(q, w) = \delta^*(q, h(w))$: for $w = xa$, $\delta'^*(q, xa) = \delta^*(\delta^*(q, h(x)), h(a)) = \delta^*(q, h(x)h(a)) = \delta^*(q, h(xa))$. So $w \in L(M')$ iff $h(w) \in L$. Note $M'$ is again a DFA — inverse homomorphism never needs nondeterminism.

## Proving closure under a new operation

Exam problems typically define a new operation and ask you to prove that it preserves regularity. The standard approach:

> **Key idea.** Let $M = (Q, \Sigma, \delta, s, A)$ be a DFA for $L$. Build an NFA $N$ that **simulates $M$** while using nondeterminism to *guess* whatever is missing from the input (a deleted symbol, a hidden half, a rotation point). Describe every state of $N$ in English, define $\delta_N$, the start state(s) and accepting states, and explain why $N$ accepts exactly the target language.

A clean write-up has four parts:

1. **States.** E.g. $Q \times \{0, 1\}$, where $(q, 0)$ means "$M$ is in $q$ and we have not yet done the special thing", $(q, 1)$ "... and we have done it".
2. **Start and accepting states.**
3. **Transitions**, each with a one-line justification.
4. **Correctness**: a sentence of the form "$N$ has an accepting run on $w$ iff $w$ can be split / extended as the definition requires, because ...".

Formal inductive proofs of correctness are usually not required unless asked; the English description of the states is what carries the argument.

## Technique 1: layered copies for a one-time event

### Deleting one symbol

$$\text{Del}(L) = \{ xy : xay \in L \text{ for some } a \in \Sigma \}.$$

The input to $N$ is $xy$; the symbol $a$ is missing. $N$ simulates $M$ on $x$, then at some point *guesses* that a symbol $a$ was deleted here and jumps from $q$ to $\delta(q, a)$ without reading anything, then continues on $y$. The guess may happen only once, so we use two copies:

- States $Q \times \{0, 1\}$; layer 0 = "not yet deleted", layer 1 = "already deleted".
- In each layer, follow $\delta$: $(q, i) \xrightarrow{b} (\delta(q, b), i)$.
- For every $q$ and $a \in \Sigma$: $(q, 0) \xrightarrow{\varepsilon} (\delta(q, a), 1)$.
- Start $(s, 0)$; accept $A \times \{1\}$.

An accepting run reads $x$ in layer 0 reaching $\delta^*(s, x)$, takes the $\varepsilon$-jump for some $a$, then reads $y$ in layer 1 ending in $\delta^*(s, xay) \in A$. Conversely any such split gives an accepting run.

Example: $\text{Del}((01)^*) = (01)^*(0 + 1)(01)^*$. Here is a small NFA for it, where $r$ is the layer-1 copy of the loop:

~~~automaton
alphabet: 01
start: p
accept: r
p 0 -> p0, r
p 1 -> r
p0 1 -> p
r 0 -> r0
r0 1 -> r
~~~

(The jump has been merged with the next symbol: $p \xrightarrow{1} r$ means "the 0 of a block was deleted, then read its 1".)

### Inserting one symbol

$$\text{Ins}(L) = \{ xay : xy \in L,\ a \in \Sigma \}.$$

Now the input has one *extra* symbol that $M$ must skip. Same two layers, but the jump **reads** a symbol without moving $M$: $(q, 0) \xrightarrow{a} (q, 1)$ for every $a$. For $L = 0^*1^*$ (DFA states $A$ = "only 0s so far", $B$ = "in the 1s"), this gives:

~~~automaton
alphabet: 01
start: A0
accept: A1, B1
A0 0 -> A0, A1
A0 1 -> B0, A1
B0 1 -> B0, B1
B0 0 -> B1
A1 0 -> A1
A1 1 -> B1
B1 1 -> B1
~~~

and $\text{Ins}(0^*1^*) = 0^*10^*1^* + 0^*1^*01^*$.

> **Exam tip.** Variants: delete *all* occurrences of a symbol (no layers needed: $\varepsilon$-loops $q \xrightarrow{\varepsilon} \delta(q, a)$ at every state), insert exactly two symbols (three layers), "change exactly one symbol" (jump reads $b$ but moves on $a \ne b$). Always ask: *what is the one-time event, and what must the machine remember about it?*

## Technique 2: simulate on guessed or hidden input

### Every other symbol

$$\text{Odds}(L) = \{ a_1 a_3 a_5 \cdots : a_1 a_2 a_3 \cdots a_n \in L \}.$$

The input $x = a_1 a_3 \cdots$ shows only the odd positions; $N$ must guess each even-position symbol. On reading $a$ from state $q$, $N$ moves $M$ by $a$ and then by a guessed symbol $b$: $q \xrightarrow{a} \delta(\delta(q, a), b)$ for every $b$. If the original string had odd length, its last symbol is an odd position with nothing after it, so $N$ also has $q \xrightarrow{a} \delta(q, a)'$ into a copy $Q'$ of "finished" states with no outgoing edges. Accept states: $A \cup A'$. For example, $\text{Odds}((001)^*) = (010)^*(\varepsilon + 01)$.

**Try it first.** Let $\text{Evens}(L) = \{a_2a_4a_6\cdots : a_1a_2\cdots a_n \in L\}$ (the symbols in even positions). Prove that $\text{Evens}(L)$ is regular when $L$ is, and compute $\text{Evens}((001)^*)$.

~~~~reveal Solution
Now the hidden symbols are the odd positions, which come *before* each visible symbol. From a DFA $M = (Q, \Sigma, \delta, s, A)$, build an NFA $N$ with the same states and start state $s$:
- On input $c$ from state $q$, guess the hidden symbol $b$ that preceded it: $q \xrightarrow{c} \delta(\delta(q, b), c)$ for every $b \in \Sigma$.
- If the original length $n$ was odd, one hidden symbol $a_n$ follows the last visible one. So accept every $q$ with $q \in A$ (even $n$) or $\delta(q, b) \in A$ for some $b$ (odd $n$).

Correctness: an accepting run spells out guesses $b_1, b_2, \ldots$ (and possibly a final $b$) interleaved with the input, i.e. a string $w \in L$ with $\text{Evens}(w)$ = the input; conversely any such $w$ yields that run.

For $(001)^n$, the 1s sit at positions divisible by 3, so the even positions $2, 4, 6, 8, \ldots$ read $0, 0, 1, 0, 0, 1, \ldots$ — a prefix of $(001)^\infty$ of length $\lfloor 3n/2 \rfloor \in \{0, 1, 3, 4, 6, 7, \ldots\}$, i.e. any length $\not\equiv 2 \pmod 3$:

~~~regex
(001)*(ε+0)
alphabet: 01
~~~
~~~~

### The first half

$$\text{Half}(L) = \{ x : xy \in L \text{ for some } y \text{ with } |y| = |x| \}.$$

The hidden part $y$ has the same length as the input, so $N$ cannot read it after $x$. Instead, run two simulations **in lockstep**:

- Component 1 runs $M$ forward on $x$ from $s$.
- Component 2 runs $M$ **backward** from a guessed accepting state, guessing one symbol of $y$ (in reverse) per input symbol: from $q$ it may move to any $q'$ with $\delta(q', b) = q$ for some $b \in \Sigma$.

States $Q \times Q$; start states $(s, f)$ for each $f \in A$ (via $\varepsilon$ from a new start); on input $a$, $(p, q) \to (\delta(p, a), q')$ for every such predecessor $q'$; accept every $(p, p)$. After reading $x$, component 1 is at $\delta^*(s, x)$ and component 2 is at some state from which some string of length $|x|$ leads into $A$; they meet iff a suitable $y$ exists. For example, $\text{Half}((01)^*) = (01)^*(\varepsilon + 0)$.

### Rotations

$$\text{Cycle}(L) = \{ yx : xy \in L \}.$$

Guess the state $q = \delta^*(s, x)$ at the rotation point. Then the input $yx$ must satisfy: $y$ leads from $q$ into $A$, and then $x$ leads from $s$ back to $q$. $N$ has, for each guess $q$, a copy of $M$ in two phases: phase 1 runs from $q$; at an accepting state it may jump ($\varepsilon$) to $s$ in phase 2; phase 2 accepts exactly at $q$. States $Q \times Q \times \{1, 2\}$ (remember the guess $q$). For example, $\text{Cycle}(0^*1^*) = 0^*1^*0^* + 1^*0^*1^*$:

~~~regex
0*1*0* + 1*0*1*
alphabet: 01
~~~

~~~steps Cycle(L) is regular: construction and full correctness proof
**What must be guessed.** The input is $w = yx$ where $xy \in L$. Reading $y$ first, the machine needs to know where $M$ *would* be after $x$ — the state $q = \delta^*(s, x)$ — even though $x$ comes later. So guess $q$ at the start, remember it forever, and check the guess at the end.
+++
**The NFA.** States: a new start $\sigma$, plus triples $(q, p, i)$ with $q, p \in Q$, $i \in \{1, 2\}$. Meaning: "$q$ is the guessed rotation state, $M$'s simulation is currently in $p$, and we are in phase $i$" (phase 1 reads $y$, phase 2 reads $x$).
- $\sigma \xrightarrow{\varepsilon} (q, q, 1)$ for every $q \in Q$ (guess $q$; start simulating $y$ from $q$).
- $(q, p, i) \xrightarrow{a} (q, \delta(p, a), i)$ for every $a \in \Sigma$ (simulate $M$).
- $(q, f, 1) \xrightarrow{\varepsilon} (q, s, 2)$ for every $f \in A$ ($y$ has brought $M$ into $A$; now restart from $s$ to read $x$).
- Accepting states: $(q, q, 2)$ for every $q$ (phase 2 ended exactly at the guessed state).
+++
**Witness $\Rightarrow$ accepting run.** Suppose $w = yx$ with $xy \in L$. Let $q = \delta^*(s, x)$. Then $\delta^*(q, y) = \delta^*(s, xy) \in A$. Run: $\sigma \to (q, q, 1)$; reading $y$ reaches $(q, \delta^*(q, y), 1)$, whose middle component is in $A$; jump to $(q, s, 2)$; reading $x$ reaches $(q, \delta^*(s, x), 2) = (q, q, 2)$, which is accepting.
+++
**Accepting run $\Rightarrow$ witness.** An accepting run starts with some guess $q$, which never changes. It ends in phase 2, and the only way from phase 1 to phase 2 is one jump, so it takes exactly one jump. Let $y$ be the input read before the jump and $x$ the input read after it, so $w = yx$. Phase 1 shows $\delta^*(q, y) \in A$; phase 2 shows $\delta^*(s, x) = q$. Therefore $\delta^*(s, xy) = \delta^*(\delta^*(s,x), y) = \delta^*(q, y) \in A$, so $xy \in L$ and $w \in \text{Cycle}(L)$.
+++
**Conclude.** The NFA has $2|Q|^2 + 1$ states and accepts exactly $\text{Cycle}(L)$, so $\text{Cycle}(L)$ is regular. The edge cases are handled automatically: $x = \varepsilon$ (guess $q = s$, jump at the end) and $y = \varepsilon$ (jump immediately, which requires $q \in A$).
~~~

## Technique 3: run two simulations side by side

Product-like constructions are the tool whenever the input interleaves information about two strings.

**Shuffle.** $\text{Shuffle}(L_1, L_2)$ is the set of strings obtainable by interleaving some $x \in L_1$ with some $y \in L_2$ (keeping the order within each). From DFAs $M_1, M_2$: states $Q_1 \times Q_2$; on input $a$, nondeterministically advance **one** of the two components: $(p, q) \xrightarrow{a} (\delta_1(p, a), q)$ and $(p, q) \xrightarrow{a} (p, \delta_2(q, a))$. Start $(s_1, s_2)$; accept $A_1 \times A_2$. The nondeterministic choice is "does this symbol belong to $x$ or to $y$?".

**Perfect shuffle / alternation.** $\text{Alt}(L_1, L_2) = \{a_1b_1a_2b_2\cdots a_nb_n : a_1\cdots a_n \in L_1,\ b_1 \cdots b_n \in L_2\}$. Here the input tells us whose turn it is, so no guessing is needed: a DFA on $Q_1 \times Q_2 \times \{1, 2\}$ advances component 1 on odd positions and component 2 on even ones, and accepts $A_1 \times A_2 \times \{1\}$ (ends after a complete pair).

**Try it first.** Let $L$ be regular. Prove that $\text{Double}(L) = \{a_1a_1a_2a_2\cdots a_na_n : a_1a_2\cdots a_n \in L\}$ is regular in two different ways.

~~~reveal Solution: as a homomorphic image, or with a direct DFA
*Way 1.* $\text{Double}(L) = h(L)$ for the homomorphism $h(a) = aa$, and regular languages are closed under homomorphism.

*Way 2 (direct DFA).* From a DFA $M = (Q, \Sigma, \delta, s, A)$, build $M'$ with states $Q \cup (Q \times \Sigma) \cup \{\text{dead}\}$:
- $\delta'(q, a) = (q, a)$: "I just read the first copy of $a$; I owe a second $a$".
- $\delta'((q, a), a) = \delta(q, a)$ and $\delta'((q, a), b) = \text{dead}$ for $b \neq a$.
- Start $s$, accepting $A$ (so a string ending in the middle of a pair is rejected).

Invariant: after reading $\text{Double}(x)$ the machine is in $\delta^*(s, x) \in Q$, and any input that is not of the form $\text{Double}(x)$ or $\text{Double}(x)a$ leads to dead. Hence $M'$ accepts exactly the strings $\text{Double}(x)$ with $x \in L$.

The "inverse" operation $\{w : \text{Double}(w) \in L\} = h^{-1}(L)$ is also regular: $\delta''(q, a) = \delta(\delta(q, a), a)$.
~~~

**Try it first.** Let $L$ be regular. Show that $\text{Shuffle}(L, 0^*) = \{w : \text{deleting some of the 0s of } w \text{ gives a string in } L\}$ is regular, with a one-line modification of a DFA for $L$.

~~~reveal Solution: add a 0-self-loop at every state
Take a DFA $M$ for $L$ and add a self-loop $q \xrightarrow{0} q$ at every state (the result is an NFA, since $q$ already has a 0-transition). A run that uses the new loops on some 0s and the original edges on the rest simulates $M$ on the string with those 0s deleted. So $N$ accepts $w$ iff some deletion of 0s from $w$ lies in $L$. This is the shuffle construction with $M_2$ = the one-state DFA for $0^*$, where the second component never changes.
~~~

## Technique 4: change only the accepting states (or cut edges)

Many operations ask about prefixes or extensions. Since a DFA's state after $w$ determines the fate of every extension of $w$, these need no new states at all.

| Operation | Construction from DFA $M$ |
|---|---|
| $\text{Pref}(L) = \{x : xy \in L \text{ for some } y\}$ | accept every state from which $A$ is reachable |
| $\text{Suf}(L) = \{y : xy \in L \text{ for some } x\}$ | new start, $\varepsilon$ to every state reachable from $s$ |
| $L\Sigma^*$ (some prefix in $L$) | make every accepting state absorbing (loops on all symbols) |
| every prefix of $w$ in $L$ | make every non-accepting state absorbing (so it is a dead state) |
| $\text{Min}(L)$: in $L$, no proper prefix in $L$ | redirect all edges out of accepting states to a dead state |
| $\text{Max}(L)$: in $L$, no proper extension in $L$ | accept $q \in A$ only if no accepting state is reachable from $q$ by a nonempty string |

**Try it first.** Prove that if $L$ is regular, so is $\text{Max}(L) = \{w \in L : wz \notin L \text{ for every } z \neq \varepsilon\}$. Then compute $\text{Max}(L)$ for $L = L(0^*1 + 0^*11)$.

~~~reveal Solution
Let $M$ be a DFA for $L$. Let $B = \{q \in A : \text{no state of } A \text{ is reachable from } q \text{ by a path of length} \ge 1\}$ (computable by graph search). Let $M'$ be $M$ with accepting set $B$.

Correctness: $w \in L(M')$ iff $q = \delta^*(s, w) \in B$ iff $q \in A$ and there is no nonempty $z$ with $\delta^*(q, z) \in A$ iff $w \in L$ and no nonempty $z$ has $wz \in L$ (because $\delta^*(s, wz) = \delta^*(q, z)$) iff $w \in \text{Max}(L)$. $\blacksquare$

For $L = 0^*1 + 0^*11$: $0^k1 \in L$ can be extended to $0^k11 \in L$, so it is not maximal; $0^k11$ has no extension in $L$. Hence $\text{Max}(L) = 0^*11$.
~~~

## Technique 5: guess a state, verify it later

When the operation refers to the *same* string twice, or to an unseen part whose effect on $M$ is all that matters, guess the relevant **state** of $M$ and remember it. Examples: $\text{Cycle}(L)$ (guess $\delta^*(s,x)$), $\text{Half}(L)$ (guess the accepting state and walk backward), and
$$\text{Root}(L) = \{w : ww \in L\}.$$
For $\text{Root}$, guess $q = \delta^*(s, w)$ and run two simulations on the same input in parallel: one from $s$, one from $q$. States $Q \times Q \times Q$ = (guess, first copy, second copy). Accept $(q, q, f)$ with $f \in A$: the first copy confirms the guess, the second shows $\delta^*(q, w) = \delta^*(s, ww) \in A$. (A DFA alternative: track the whole function $q \mapsto \delta^*(q, w)$, which has finitely many values.)

## Using closure to prove regularity

> **Example.** $L = \{ w \in \{0,1\}^* : |w| \text{ is even and } w \text{ does not contain } 00 \}$ is regular, because $L = L((\Sigma\Sigma)^*) \cap \overline{L(\Sigma^*00\Sigma^*)}$, and regular languages are closed under complement and intersection.

> **Example.** If $L$ is regular, so is $\{ w : w \in L \text{ and } w^R \in L \} = L \cap L^R$.

Closure also works **contrapositively** to show a language is *not* regular: if $L \cap 0^*1^* = \{0^n1^n : n \ge 0\}$, and $\{0^n1^n\}$ is known to be non-regular, then $L$ is not regular — otherwise the intersection of two regular languages would be regular. This is a powerful shortcut used with fooling sets in the next topic.

### Closure chains: transforming one language into another

The contrapositive argument works with *any* sequence of regularity-preserving operations: intersection or union with a regular language, complement, reversal, homomorphism, inverse homomorphism, and every construction in this topic. If a chain of such operations turns $L$ into a known non-regular language, $L$ is not regular.

~~~steps Prove {0^i 1 0^i : i ≥ 0} is not regular using only closure properties
**Plan.** Assume $L = \{0^i10^i : i \ge 0\}$ is regular and transform it into $\{0^n1^n\}$. The obstacle: the 0s before and after the 1 must be treated differently, but a homomorphism treats every 0 the same way. The fix is an inverse homomorphism that *relabels* symbols.
+++
**Relabel with an inverse homomorphism.** Let $g : \{a, b, c\} \to \{0,1\}^*$ with $g(a) = 0$, $g(b) = 1$, $g(c) = 0$. Then $g^{-1}(L) = \{w \in \{a,b,c\}^* : g(w) \in L\}$ is regular (if $L$ is). It contains $a^ibc^i$, but also mixtures like $cabac$ — $g^{-1}$ does not know which 0s should be $a$ and which $c$.
+++
**Force the intended shape.** Intersect with the regular language $a^*bc^*$. A string $a^jbc^k$ maps to $0^j10^k$, which is in $L$ iff $j = k$. So
$$g^{-1}(L) \cap a^*bc^* = \{a^ibc^i : i \ge 0\},$$
which is regular by closure under intersection.
+++
**Erase and rename with a homomorphism.** Let $h(a) = 0$, $h(b) = \varepsilon$, $h(c) = 1$. Then $h(\{a^ibc^i\}) = \{0^i1^i : i \ge 0\}$, regular by closure under homomorphism.
+++
**Contradiction.** $\{0^n1^n\}$ is not regular. Every step preserved regularity, so the assumption was false: $L$ is not regular. $\blacksquare$ (A direct fooling-set proof also works — $F = 0^*$ with suffix $10^i$ — but the chain technique shines when fooling sets get messy.)
~~~

**Try it first.** Let $N = \{0^n1^n : n \ge 0\}$, which is not regular. For each language decide whether it is regular, and justify with closure properties: (a) $N \cup L(0^*1^*)$; (b) $N^R$; (c) $N^*$; (d) $N \cdot N$.

~~~reveal Solution
(a) **Regular**: $N \subseteq 0^*1^*$, so the union is $0^*1^*$. (A union with a non-regular piece can be regular.)

(b) **Not regular**: $N^R = \{1^n0^n\}$. If it were regular, $(N^R)^R = N$ would be regular by closure under reversal.

(c) **Not regular**: $N^* \cap 0^*1^* = N$. A string of $N^*$ is a concatenation of blocks $0^{n_1}1^{n_1}0^{n_2}1^{n_2}\cdots$; it lies in $0^*1^*$ only if at most one block is nonempty, so it is $0^n1^n$. If $N^*$ were regular, $N$ would be.

(d) **Not regular**: by the same reasoning $N \cdot N \cap 0^*1^* = N$ (in $0^a1^a0^b1^b \in 0^*1^*$, one of $a, b$ must be 0).
~~~

## Pitfalls

> **Warning.** Closure under union holds for **finitely many** languages. $\{0^n1^n : n \ge 0\} = \bigcup_{n} \{0^n1^n\}$ is an infinite union of finite (regular) languages and is not regular.

> **Warning.** A **subset** of a regular language need not be regular: every language is a subset of the regular language $\Sigma^*$. Likewise a superset of a non-regular language may be regular.

Other one-directional traps:

- $L_1 \cup L_2$ regular does **not** imply $L_1$ or $L_2$ regular: $L_1 = \{0^n1^n\}$, $L_2 = \overline{L_1}$, union $\Sigma^*$.
- $L_1 L_2$ regular does not imply $L_1, L_2$ regular: e.g. $L_1 = \{0^{n^2} : n \ge 0\}$ is not regular, but $L_1 \cdot 0^* = 0^*$ is.
- $L^*$ can be regular when $L$ is not: $\{0^p : p \text{ prime}\}^*$ contains every $0^k$ with $k \ge 2$ (and $\varepsilon$), so it is regular.
- What *is* valid: if $L_1$ is regular and $L_1 \cap L_2$ is not, then $L_2$ is not regular. Likewise if $L$ is regular then $\overline{L}$ is regular, so $L$ regular $\iff$ $\overline{L}$ regular.

## Summary of the method

1. Fix a DFA $M = (Q, \Sigma, \delta, s, A)$ for $L$ (a DFA is easiest to simulate).
2. Decide what $N$ must guess and what it must remember.
3. Define $N$'s states as tuples, with English meanings.
4. Give start, accepting states and transitions.
5. Argue both directions: accepting run $\Rightarrow$ the witness required by the definition exists; witness $\Rightarrow$ accepting run.

## Common exam problem patterns

**1. "Prove that if $L$ is regular then $f(L)$ is regular."** Recipe: "Let $M = (Q, \Sigma, \delta, s, A)$ be a DFA for $L$. We construct an NFA $N = (Q', \Sigma, \delta', s', A')$ ..." Write $Q'$ as tuples with an English meaning for each component, define $\delta'$ case by case (one line of justification each), give $s'$ and $A'$, then argue both directions of $L(N) = f(L)$. Before writing, decide which technique applies:

| Clue in the definition of $f(L)$ | Technique |
|---|---|
| a fixed number of insertions / deletions / changes | layers $Q \times \{0, \ldots, k\}$ |
| any number of insertions / deletions of a symbol | self-loops or $\varepsilon$-loops at every state, no layers |
| two strings interleaved (shuffle, alternation) | product $Q_1 \times Q_2$ (plus a turn bit if alternating) |
| hidden symbols at known positions (odds, evens) | read one, guess the hidden one, in a single step |
| "same length as the input" (half, or $x$ followed by as many 0s as $x$ has symbols) | forward simulation paired with a backward guessed one |
| rotation, square root, the string used twice | guess a state of $M$, remember it, verify at the end |
| prefixes, suffixes, min, max | change accepting states / cut edges, no new states |

**2. "Here is a specific $L$; give an NFA/regex for $f(L)$."** Recipe: either apply the general construction to a small DFA for $L$ and simplify, or compute $f(L)$ directly by thinking about what strings look like, then **check both directions on a few strings**. Auto-graded versions of this appear in the problem set.

**3. "Is $L$ regular? Prove your answer."** Recipe: if you believe it is regular, express it with regular pieces and closed operations (or build a machine). If not, assume it is regular and apply closed operations (usually: intersect with a cleverly chosen regex like $0^*1^*$, complement, reverse, (inverse) homomorphism) until you reach a known non-regular language. Never argue from subsets, supersets, or unions of non-regular pieces.

**4. "Explain what is wrong with this argument."** The usual culprits: one-directional closure used backwards, an infinite union, a construction that lets the one-time event happen twice (missing layers) or zero times (accepting in layer 0), or a "DFA" whose transitions secretly depend on the future.

## Where students lose points

- **No meaning for the states.** A list of transitions without saying what $(q, i)$ *means* earns little credit; the English description is the proof.
- **Only one direction of correctness.** Show "witness $\Rightarrow$ accepting run" **and** "accepting run $\Rightarrow$ witness". The second is where bugs hide (e.g. a run that jumps layers twice, or never).
- **Accepting states off by a layer.** For "insert exactly one symbol", accepting in layer 0 allows zero insertions.
- **Simulating a DFA without nondeterminism when guessing is required**, or claiming the result is a DFA when it uses $\varepsilon$-moves or multiple targets.
- **Starting from an NFA when the construction needs a DFA.** Complement and the Min, Max and "every prefix" constructions require a deterministic, complete machine.
- **Backward use of closure**: "$L \subseteq R$ regular, so $L$ regular"; "$L_1 \cup L_2$ regular, so each is"; "$h(L)$ regular, so $L$ is".
- **Infinite unions or intersections** treated as if closure applied.
- **Forgetting edge cases**: $\varepsilon$, strings of odd length in pair-based operations, $x = \varepsilon$ or $y = \varepsilon$ in splits.

## Self-check

1. If $L$ is regular, is $\{w : w \text{ has a suffix in } L\} = \Sigma^* L$ regular? How would you build it?

~~~reveal Answer
Yes: it is the concatenation of the regular languages $\Sigma^*$ and $L$. As an NFA: add a self-loop on every symbol at the start state of an NFA for $L$ — but only if the start state has no incoming edges; otherwise add a fresh start state with an all-symbol self-loop and an $\varepsilon$-edge to the old start.
~~~

2. Which construction gives $\text{Min}(L)$, and why must the machine be a DFA?

~~~reveal Answer
Redirect every edge leaving an accepting state to a dead state. In a DFA there is one run, and "the run passes through an accepting state before the end" means exactly "some proper prefix is in $L$". In an NFA, a string can have one run that accepts a proper prefix and *another* run that reaches acceptance at the end while avoiding accepting states earlier; cutting edges kills only the first run. Example: $s \xrightarrow{0} f$, $s \xrightarrow{0} p$, $p \xrightarrow{0} f$ with $f$ accepting recognizes $\{0, 00\}$; cutting edges out of $f$ changes nothing, so $00$ survives although $\text{Min}(\{0,00\}) = \{0\}$.
~~~

3. True or false: if $L_1$ and $L_2$ are not regular then $L_1 \cap L_2$ is not regular.

~~~reveal Answer
False. $L_1 = \{0^n1^n\}$, $L_2 = \{1^n0^n\}$: the intersection is $\{\varepsilon\}$, which is regular.
~~~

4. For "delete exactly two symbols", how many layers do you need, and which are accepting?

~~~reveal Answer
Three layers $Q \times \{0, 1, 2\}$ ($i$ = number of deletions so far), $\varepsilon$-jumps from layer $i$ to $i+1$ for $i < 2$, accepting $A \times \{2\}$ only.
~~~

5. Is $\{xy : x \in L_1, y \in L_2, |x| = |y|\}$ regular whenever $L_1, L_2$ are regular?

~~~reveal Answer
No. With $L_1 = 0^*$ and $L_2 = 1^*$ it is $\{0^n1^n\}$. "Equal lengths" across a concatenation is a counting condition that closure properties cannot provide. (Contrast $\text{Half}(L)$: there both halves belong to *one* string of $L$, and the backward simulation works.)
~~~

6. Let $h(0) = 0$, $h(1) = \varepsilon$. What is $h(\{0^n1^n : n \ge 0\})$, and what does that say about images of non-regular languages?

~~~reveal Answer
$h(\{0^n1^n\}) = 0^*$, which is regular. Homomorphic images of non-regular languages can be regular, so "$h(L)$ is regular" proves nothing about $L$.
~~~
`,

  cheatsheet: String.raw`## Closed under
$\cup$, $\cap$, complement, $\setminus$, concatenation, $^*$, reversal, homomorphism, inverse homomorphism, and every construction below. **Finitely many** applications only.

## Standard constructions
- $\cap$, $\cup$, $\setminus$: product DFA $Q_1\times Q_2$, $\delta((p,q),a) = (\delta_1(p,a),\delta_2(q,a))$; pick the accepting set. Lemma: $\delta^*((s_1,s_2),w) = (\delta_1^*(s_1,w),\delta_2^*(s_2,w))$.
- Complement: **complete** DFA, swap accepts.
- $L^R$: reverse edges, new start $\xrightarrow{\varepsilon}$ old accepts, accept old start.
- $h(L)$: substitute $h(a)$ in a regex. $h^{-1}(L)$: DFA with $\delta'(q,a) = \delta^*(q, h(a))$.

## Write-up template (closure under a new operation)
1. Let $M = (Q,\Sigma,\delta,s,A)$ be a DFA for $L$.
2. $N$'s states: tuples, each with an English meaning ("$(q,i)$: $M$ is in $q$ and $i$ symbols have been deleted").
3. Start, accepting states, transitions (one-line justification each).
4. Witness $\Rightarrow$ accepting run; accepting run $\Rightarrow$ witness.
5. "Since NFAs accept exactly the regular languages, $f(L)$ is regular."

## Technique table (from DFA $M = (Q,\Sigma,\delta,s,A)$)
| Operation | NFA idea |
|---|---|
| Del one symbol | $Q\times\{0,1\}$; $(q,0)\xrightarrow{\varepsilon}(\delta(q,a),1)$; accept $A\times\{1\}$ |
| Insert one symbol | $Q\times\{0,1\}$; $(q,0)\xrightarrow{a}(q,1)$; accept $A\times\{1\}$ |
| Change one symbol | $Q\times\{0,1\}$; $(q,0)\xrightarrow{b}(\delta(q,a),1)$ for $a\ne b$ |
| Delete all $a$s / insert any $a$s | $\varepsilon$-edges $q\to\delta(q,a)$ / self-loops $q\xrightarrow{a}q$ |
| Double ($a \mapsto aa$) | $h(L)$; or DFA states $Q\cup(Q\times\Sigma)$ "owe a second $a$" |
| Odds (every other) | on $a$: $q \to \delta(\delta(q,a),b)$ for guessed $b$; plus "finished" copy |
| Shuffle$(L_1,L_2)$ | $Q_1\times Q_2$; each symbol advances one component (guess which) |
| Alternate $a_1b_1a_2b_2\cdots$ | DFA $Q_1\times Q_2\times\{1,2\}$; accept $A_1\times A_2\times\{1\}$ |
| Half | $Q\times Q$: forward from $s$, backward from guessed $f\in A$; accept $(p,p)$ |
| Cycle $\{yx: xy\in L\}$ | guess $q$; run $q \to A$, jump to $s$, run $s \to q$; $2k^2+1$ states if $M$ has $k$ |
| Root $\{w : ww\in L\}$ | guess $q$; run from $s$ and from $q$ in parallel; accept $(q,q,f)$, $f \in A$ |
| Pref / Suf | accept states that can reach $A$ / new start $\xrightarrow{\varepsilon}$ reachable states |
| $L\Sigma^*$ / all prefixes in $L$ | accepting states absorbing / non-accepting states absorbing |
| Min / Max | cut edges out of $A$ / accept $q\in A$ with no nonempty path to $A$ |

## Closure-chain template (non-regularity)
"Suppose $L$ is regular. Then $L_1 = \ldots$ is regular (closure under ...), $L_2 = \ldots$ is regular (...), and $L_k = \{0^n1^n\}$ is regular — contradiction."
- Intersect with $0^*1^*$ to force a shape. Complement to flip $=$ / $\ne$. Reverse + swap symbols ($h(0)=1,h(1)=0$) to flip $\le$ / $\ge$.
- Relabel with $g^{-1}$, force shape with $\cap$, erase/rename with $h$: $\{0^i10^i\} \to \{a^ibc^i\} \to \{0^i1^i\}$.

## Examples
- $\text{Del}((01)^*) = (01)^*(0+1)(01)^*$; $\text{Half}((01)^*) = (01)^*(\varepsilon+0)$.
- $\text{Odds}((001)^*) = (010)^*(\varepsilon+01)$; $\text{Cycle}(0^*1^*) = 0^*1^*0^*+1^*0^*1^*$.
- $\text{Shuffle}((01)^*,(01)^*)$ = balanced strings ($0$ = open, $1$ = close) of nesting depth $\le 2$.
- $\text{Min}(\Sigma^*11) = (0+10)^*11$.

## Pitfalls
- Only **finite** unions/intersections. Subsets/supersets of regular languages can be anything.
- $L_1 \cup L_2$, $L_1 \cap L_2$, $L_1L_2$, $L^*$, $h(L)$ regular do not imply the parts are regular.
- Valid: $L_1$ regular and $L_1 \cap L_2$ not regular $\Rightarrow$ $L_2$ not regular; $L$ regular $\iff$ $\overline{L}$ regular $\iff$ $L^R$ regular.
- Complement, Min, Max need a complete DFA, not an NFA.
`,

  quiz: [
    {
      type: 'tf',
      q: String.raw`If $L$ is regular, then every subset of $L$ is regular.`,
      answer: false,
      explain: String.raw`$\Sigma^*$ is regular and contains every language, including non-regular ones like $\{0^n1^n\}$. Closure properties never say anything about arbitrary subsets.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L_1 \cup L_2$ is regular, then both $L_1$ and $L_2$ are regular.`,
      answer: false,
      explain: String.raw`Take $L_1 = \{0^n1^n : n \ge 0\}$ and $L_2 = \overline{L_1}$. Neither is regular, but $L_1 \cup L_2 = \Sigma^*$ is. Closure is a one-way implication: regular inputs give regular outputs.`,
    },
    {
      type: 'mc',
      q: String.raw`Which construction correctly shows that regular languages are closed under reversal?`,
      choices: [
        'Swap accepting and non-accepting states of a DFA',
        'Reverse all transitions of an NFA, add a new start state with ε-moves to the old accepting states, and make the old start state the only accepting state',
        'Reverse all transitions of a DFA and keep the same start and accepting states',
        'Apply the product construction of M with itself',
      ],
      answer: 1,
      explain: String.raw`Reversing edges turns a path $s \leadsto f$ reading $w$ into a path $f \leadsto s$ reading $w^R$. The new start guesses which accepting state $f$ to begin from. Keeping the same start/accept (third choice) is wrong, and the reversed machine is generally nondeterministic. Swapping accepting states is complement, not reversal.`,
    },
    {
      type: 'mc',
      q: String.raw`Let $M = (Q, \Sigma, \delta, s, A)$ be a DFA and $h$ a homomorphism. Which DFA accepts $h^{-1}(L(M))$?`,
      choices: [
        String.raw`Same $Q, s, A$, with $\delta'(q, a) = \delta^*(q, h(a))$`,
        String.raw`Same $Q, s, A$, with $\delta'(q, h(a)) = \delta(q, a)$`,
        String.raw`A regex obtained by substituting $h(a)$ for $a$`,
        String.raw`The product of $M$ with itself`,
      ],
      answer: 0,
      explain: String.raw`On input symbol $a$, the new DFA behaves as $M$ would on the whole string $h(a)$. Then $\delta'^*(s, w) = \delta^*(s, h(w))$, so it accepts $w$ iff $h(w) \in L(M)$. Substituting into a regex gives $h(L)$, the forward image.`,
    },
    {
      type: 'mc',
      q: String.raw`To build an NFA for $\text{Del}(L) = \{xy : xay \in L\}$ from a DFA $M$ for $L$, which transitions implement the deletion?`,
      choices: [
        String.raw`$(q,0) \xrightarrow{a} (q,1)$ for every $a$`,
        String.raw`$(q,0) \xrightarrow{\varepsilon} (\delta(q,a),1)$ for every $a$`,
        String.raw`$(q,1) \xrightarrow{\varepsilon} (\delta(q,a),0)$ for every $a$`,
        String.raw`$q \xrightarrow{\varepsilon} \delta(q,a)$ at every state, with no layers`,
      ],
      answer: 1,
      explain: String.raw`The deleted symbol is absent from the input, so $N$ must advance $M$ on $a$ **without reading** anything: an $\varepsilon$-move to $\delta(q,a)$, switching to layer 1 so it happens exactly once. The first choice is the *insertion* construction; the last choice deletes any number of symbols.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L_1$ is regular and $L_1 \cap L_2$ is not regular, then $L_2$ is not regular.`,
      answer: true,
      explain: String.raw`If $L_2$ were regular, $L_1 \cap L_2$ would be regular by closure under intersection — contradiction. This contrapositive use of closure is a standard tool for proving non-regularity (e.g. intersect with $0^*1^*$).`,
    },
    {
      type: 'mc',
      q: String.raw`Let $h(0) = ab$ and $h(1) = b$. Let $L$ be the binary strings with an even number of 1s. Which string is in $h(L)$?`,
      choices: [String.raw`$abb$`, String.raw`$abbb$`, String.raw`$bab$`, String.raw`$aabb$`],
      answer: 1,
      explain: String.raw`$abbb$ parses uniquely as $ab \cdot b \cdot b = h(011)$, and $011$ has two 1s. $abb = h(01)$ has one 1. $bab = h(10)$, one 1. $aabb$ cannot be parsed into blocks $ab$ and $b$ at all.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L$ is regular then $\{0^n1^n : n \ge 0\} \cup L$ is not regular.`,
      answer: false,
      explain: String.raw`Union with a regular language can "absorb" the non-regular part. With $L = \Sigma^*$, the union is $\Sigma^*$, which is regular. Nothing follows about a union containing a non-regular piece.`,
    },
    {
      type: 'mc',
      q: String.raw`What is $\text{Half}((01)^*) = \{x : xy \in (01)^* \text{ for some } |y| = |x|\}$?`,
      choices: [String.raw`$(01)^*$`, String.raw`$(01)^*(\varepsilon + 0)$`, String.raw`$(0+1)^*$`, String.raw`$(0101)^*$`],
      answer: 1,
      explain: String.raw`If $xy = (01)^n$ with $|x| = |y| = n$, then $x$ is the first $n$ symbols of $(01)^n$: $(01)^{n/2}$ if $n$ is even, $(01)^{(n-1)/2}0$ if odd. So the language is $(01)^*(\varepsilon + 0)$.`,
    },
    {
      type: 'multi',
      q: String.raw`Assume $L$ is regular. Which of the following are guaranteed to be regular? (select all that apply)`,
      choices: [
        String.raw`$L \cap L^R$`,
        String.raw`$\{w : ww \in L\}$`,
        String.raw`$\{ww : w \in L\}$`,
        String.raw`$\overline{L}\,\cdot L^*$`,
        String.raw`$\bigcup_{n \ge 1} L^n$`,
      ],
      answer: [0, 1, 3, 4],
      explain: String.raw`$L \cap L^R$ and $\overline{L}L^*$ combine standard closures. $\bigcup_{n\ge1} L^n = LL^*$, so although written as an infinite union it is regular. $\{w : ww \in L\}$ is regular: a DFA can track, for every state $q$, the state $\delta^*(q, w)$ (a function $Q \to Q$, finitely many) and accept iff $\delta^*(\delta^*(s,w), w) \in A$. But $\{ww : w \in L\}$ can be non-regular: with $L = \Sigma^*$ it is the "squares" language, which is not regular.`,
    },
    {
      type: 'tf',
      q: String.raw`To show regular languages are closed under $\text{Ins}(L) = \{xay : xy \in L, a \in \Sigma\}$, one can use two copies of a DFA for $L$, with transitions $(q, 0) \xrightarrow{a} (q, 1)$ for each $a \in \Sigma$.`,
      answer: true,
      explain: String.raw`The inserted symbol is in the input but must be ignored by $M$: read it without moving $M$, and switch layers so it happens exactly once. Accept in layer 1 only (exactly one symbol inserted).`,
    },
    {
      type: 'mc',
      q: String.raw`Which reasoning correctly proves that $L = \{w : w \text{ has an even number of 0s and does not end in } 1\}$ is regular?`,
      choices: [
        String.raw`It is a subset of $\Sigma^*$, which is regular.`,
        String.raw`It is the intersection of "even number of 0s" and the complement of $\Sigma^*1$, all regular, and regular languages are closed under $\cap$ and complement.`,
        String.raw`It is the union, over all $n$, of the finite languages of such strings of length $n$.`,
        String.raw`Its complement is not regular, so it must be regular.`,
      ],
      answer: 1,
      explain: String.raw`Express $L$ via known-regular languages and closure operations. The subset argument and the infinite-union argument are invalid in general, and the last choice is nonsense — $L$ and $\overline{L}$ are either both regular or both non-regular.`,
    },
    {
      type: 'tf',
      q: String.raw`$L^*$ can be regular even when $L$ is not regular.`,
      answer: true,
      explain: String.raw`$L = \{0^p : p \text{ prime}\}$ is not regular, but $L^*$ contains $\varepsilon$ and every $0^k$ with $k \ge 2$ (sum of 2s and 3s), so $L^* = \varepsilon + 000^*$ is regular.`,
    },
    {
      type: 'mc',
      q: String.raw`Let $M$ be a DFA for $L$. Which modification gives a DFA for $\text{Min}(L) = \{w \in L : \text{no proper prefix of } w \text{ is in } L\}$?`,
      choices: [
        'Make every accepting state absorbing (self-loops on all symbols)',
        'Redirect every transition leaving an accepting state to a dead state',
        'Make accepting exactly the states from which an accepting state is reachable',
        'Swap accepting and non-accepting states',
      ],
      answer: 1,
      explain: String.raw`Once the (unique) run has passed through an accepting state, some prefix is in $L$, so any longer string must be rejected: send it to a dead state. Absorbing accepting states gives $L\Sigma^*$ ("some prefix in $L$"); the third choice gives $\text{Pref}(L)$; swapping gives the complement.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L$ is regular, then $\{ww : w \in L\}$ is regular.`,
      answer: false,
      explain: String.raw`With $L = \Sigma^*$ this is the language of squares $\{ww\}$, which is not regular. Contrast $\{w : ww \in L\}$, which *is* regular (guess $q = \delta^*(s,w)$ and run from $s$ and from $q$ in parallel).`,
    },
    {
      type: 'mc',
      q: String.raw`DFAs $M_1, M_2$ have $m$ and $n$ states. The standard NFA for $\text{Shuffle}(L(M_1), L(M_2))$ has which states and what does a transition on $a$ do?`,
      choices: [
        String.raw`$Q_1 \cup Q_2$; follow $M_1$ until an $\varepsilon$-jump into $M_2$`,
        String.raw`$Q_1 \times Q_2$; advance **both** components on $a$`,
        String.raw`$Q_1 \times Q_2$; nondeterministically advance **one** of the components on $a$`,
        String.raw`$Q_1 \times Q_2 \times \{1,2\}$; advance the component whose turn it is`,
      ],
      answer: 2,
      explain: String.raw`Each input symbol belongs to exactly one of the two interleaved strings; the NFA guesses which. Advancing both is intersection; $Q_1 \cup Q_2$ with a jump is concatenation; the turn bit is the *perfect* shuffle (alternation), which needs no guessing.`,
    },
    {
      type: 'tf',
      q: String.raw`The perfect shuffle $\{a_1b_1a_2b_2\cdots a_nb_n : a_1\cdots a_n \in L_1,\ b_1\cdots b_n \in L_2\}$ of two regular languages can be recognized by a DFA built directly from DFAs for $L_1$ and $L_2$, without any nondeterminism.`,
      answer: true,
      explain: String.raw`The position parity tells whose symbol it is, so a DFA on $Q_1 \times Q_2 \times \{1,2\}$ advances component 1 on odd positions and component 2 on even positions, accepting in $A_1 \times A_2 \times \{1\}$.`,
    },
    {
      type: 'mc',
      q: String.raw`Let $N = \{0^n1^n : n \ge 0\}$. Which of these languages is regular?`,
      choices: [String.raw`$N^R$`, String.raw`$N^*$`, String.raw`$N \cup L(0^*1^*)$`, String.raw`$N \cdot N$`],
      answer: 2,
      explain: String.raw`$N \subseteq 0^*1^*$, so the union is just $0^*1^*$. The others are not regular: $(N^R)^R = N$, and $N^* \cap 0^*1^* = N \cdot N \cap 0^*1^* = N$.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L^R$ is not regular, then $L$ is not regular.`,
      answer: true,
      explain: String.raw`If $L$ were regular, $L^R$ would be regular by closure under reversal. Since $(L^R)^R = L$, in fact $L$ is regular iff $L^R$ is.`,
    },
    {
      type: 'mc',
      q: String.raw`To build an NFA for $\text{Change}(L) = \{xby : xay \in L,\ a \ne b\}$ (change exactly one symbol) from a DFA $M$, which transitions implement the change?`,
      choices: [
        String.raw`$(q,0) \xrightarrow{\varepsilon} (\delta(q,a),1)$ for every $a$`,
        String.raw`$(q,0) \xrightarrow{b} (q,1)$ for every $b$`,
        String.raw`$(q,0) \xrightarrow{b} (\delta(q,a),1)$ for every $a \ne b$`,
        String.raw`$(q,0) \xrightarrow{b} (\delta(q,b),1)$ for every $b$`,
      ],
      answer: 2,
      explain: String.raw`The input shows $b$, but $M$ must move as if it read the original symbol $a \ne b$. The first choice deletes a symbol, the second inserts one, and the last just copies $M$'s move (a change that changes nothing).`,
    },
    {
      type: 'multi',
      q: String.raw`Assume $L$ is regular. Which of these are guaranteed to be regular? (select all that apply)`,
      choices: [
        String.raw`$\text{Half}(L)$`,
        String.raw`$\text{Cycle}(L)$`,
        String.raw`$\{ww^R : w \in L\}$`,
        String.raw`$\{x : x0^n \in L \text{ where } n \text{ is the length of } x\}$`,
        String.raw`$\text{Ins}(L)$ (insert one symbol)`,
      ],
      answer: [0, 1, 3, 4],
      explain: String.raw`Half and Cycle are classic closure constructions. The fourth is Half with the hidden part restricted to 0s: the backward simulation guesses only 0-edges. Insert-one uses two layers. But $\{ww^R : w \in L\}$ with $L = \Sigma^*$ is the even-length palindromes, which is not regular.`,
    },
    {
      type: 'tf',
      q: String.raw`If $h$ is a homomorphism and $h(L)$ is regular, then $L$ is regular.`,
      answer: false,
      explain: String.raw`Take $h(0) = h(1) = \varepsilon$: then $h(L) = \{\varepsilon\}$ for every nonempty $L$, including non-regular ones. Closure only goes forward: regular $L$ gives regular $h(L)$.`,
    },
    {
      type: 'mc',
      q: String.raw`Let $h(0) = ab$, $h(1) = \varepsilon$, and $L = L((ab)^*)$. What is $h^{-1}(L)$?`,
      choices: [String.raw`$0^*$`, String.raw`$(0+1)^*$`, String.raw`$0^*1^*$`, String.raw`$\{\varepsilon\}$`],
      answer: 1,
      explain: String.raw`For every $w \in \{0,1\}^*$, $h(w) = (ab)^{k}$ where $k$ is the number of 0s in $w$, which is always in $L$. So every string is in $h^{-1}(L)$. Inverse images can be much larger than you expect.`,
    },
    {
      type: 'tf',
      q: String.raw`To prove $\{0^i 1 0^i : i \ge 0\}$ non-regular by closure, it suffices to apply the homomorphism $h(0) = 0$, $h(1) = \varepsilon$ and observe that the image is not regular.`,
      answer: false,
      explain: String.raw`The logic would be fine — a non-regular image $h(L)$ does prove $L$ non-regular, by the contrapositive of closure under homomorphism. The problem is the image itself: $h(L) = \{0^{2i}\} = (00)^*$, which is regular, so nothing follows. The working chain relabels first: $g^{-1}$ with $g(a)=0, g(b)=1, g(c)=0$, intersect with $a^*bc^*$, then map $a \mapsto 0$, $b \mapsto \varepsilon$, $c \mapsto 1$.`,
    },
    {
      type: 'mc',
      q: String.raw`The Cycle construction from a DFA with $k$ states uses states $(q, p, i)$: $q$ the guessed rotation state, $p$ the current state, $i \in \{1,2\}$ the phase. Which states are accepting?`,
      choices: [String.raw`$(q, p, 1)$ with $p \in A$`, String.raw`$(q, q, 2)$ for every $q$`, String.raw`$(q, s, 2)$ for every $q$`, String.raw`$(q, p, 2)$ with $p \in A$`],
      answer: 1,
      explain: String.raw`Phase 1 reads $y$ from $q$ into $A$; phase 2 reads $x$ from $s$ and must end exactly at the guessed state $q = \delta^*(s,x)$, which certifies the guess. Accepting when $p \in A$ in phase 2 would not check the guess at all.`,
    },
    {
      type: 'tf',
      q: String.raw`For "insert exactly one symbol" built with layers $Q \times \{0,1\}$, making the states $A \times \{0\}$ accepting as well would still give a correct construction.`,
      answer: false,
      explain: String.raw`Then strings with **zero** insertions (i.e. $L$ itself) would be accepted. $L \subseteq \text{Ins}(L)$ fails in general, e.g. $\varepsilon \in 0^*1^*$ but $\varepsilon \notin \text{Ins}(0^*1^*)$ (every string of $\text{Ins}(L)$ has length at least 1).`,
    },
  ],

  flashcards: [
    { front: 'Closure properties of regular languages', back: 'Union, intersection, complement, difference, concatenation, star, reversal, homomorphism, inverse homomorphism.' },
    { front: 'Reversal construction', back: String.raw`Reverse every edge; new start with $\varepsilon$ to each old accepting state; old start is the only accepting state.` },
    { front: 'Inverse homomorphism construction', back: String.raw`Same states; $\delta'(q,a) = \delta^*(q, h(a))$. Then $\delta'^*(q,w) = \delta^*(q,h(w))$.` },
    { front: 'Del(L): delete one symbol', back: String.raw`$Q \times \{0,1\}$; $(q,0)\xrightarrow{\varepsilon}(\delta(q,a),1)$ for every $a$; start $(s,0)$; accept $A\times\{1\}$.` },
    { front: 'Ins(L): insert one symbol', back: String.raw`$Q\times\{0,1\}$; $(q,0)\xrightarrow{a}(q,1)$ for every $a$; accept $A\times\{1\}$.` },
    { front: 'Half(L) construction', back: String.raw`States $Q\times Q$: run forward from $s$ on input, and backward from a guessed $f\in A$ guessing one symbol per step; accept $(p,p)$.` },
    { front: 'Cycle(L) construction', back: String.raw`Guess $q = \delta^*(s,x)$; read $y$ from $q$ to $A$, $\varepsilon$-jump to $s$, read $x$ from $s$ back to $q$. States $Q\times Q\times\{1,2\}$.` },
    { front: 'Is a subset of a regular language regular?', back: String.raw`Not necessarily: every language is a subset of $\Sigma^*$.` },
    { front: 'Are infinite unions of regular languages regular?', back: String.raw`Not necessarily: $\bigcup_n\{0^n1^n\}$. Only finite unions are guaranteed.` },
    { front: 'Contrapositive use of closure', back: String.raw`If $L_1$ regular and $L_1\cap L_2$ not regular then $L_2$ not regular. E.g. intersect with $0^*1^*$.` },
    { front: 'Template for a closure proof', back: 'Fix DFA M for L; describe NFA states (with meanings), start, accept, transitions; argue both directions of correctness.' },
    { front: String.raw`$\text{Odds}(L)$ idea`, back: String.raw`On input $a$ move $M$ by $a$ then by a guessed $b$; also allow a final move by $a$ alone into a "finished" copy.` },
    { front: String.raw`$\text{Min}(L)$ and $\text{Max}(L)$`, back: String.raw`Min (no proper prefix in $L$): redirect edges out of accepting states to dead. Max (no proper extension in $L$): accept $q \in A$ only if no nonempty path from $q$ reaches $A$. Both need a DFA.` },
    { front: String.raw`$\text{Pref}(L)$, $\text{Suf}(L)$, $L\Sigma^*$`, back: String.raw`Pref: accept states that can reach $A$. Suf: new start with $\varepsilon$ to every reachable state. $L\Sigma^*$: make accepting states absorbing.` },
    { front: 'Shuffle of two regular languages', back: String.raw`NFA on $Q_1 \times Q_2$; each input symbol advances one component (guess which); accept $A_1 \times A_2$.` },
    { front: 'Perfect shuffle (alternation)', back: String.raw`DFA on $Q_1\times Q_2\times\{1,2\}$: odd positions advance $M_1$, even advance $M_2$; accept $A_1\times A_2\times\{1\}$.` },
    { front: 'Change exactly one symbol', back: String.raw`Layers $Q\times\{0,1\}$; $(q,0)\xrightarrow{b}(\delta(q,a),1)$ for each $a \ne b$; accept $A \times \{1\}$.` },
    { front: String.raw`$\text{Root}(L) = \{w : ww \in L\}$`, back: String.raw`Guess $q = \delta^*(s,w)$; run from $s$ and from $q$ in parallel on the input; accept $(q, q, f)$ with $f \in A$. Regular. (But $\{ww : w \in L\}$ need not be.)` },
    { front: 'Product construction lemma', back: String.raw`$\delta^*((s_1,s_2),w) = (\delta_1^*(s_1,w), \delta_2^*(s_2,w))$ by induction on $|w|$; choose the accepting set for $\cap$, $\cup$, $\setminus$, ...` },
    { front: 'Relabeling trick for closure chains', back: String.raw`Use $g^{-1}$ to give copies of a symbol different names, $\cap$ with a regex to force the shape, then a homomorphism to rename/erase. E.g. $\{0^i10^i\} \to \{a^ibc^i\} \to \{0^i1^i\}$.` },
    { front: 'Flip ≤ into ≥ with closure', back: String.raw`Swap symbols with $h(0)=1, h(1)=0$, then reverse: $\{0^i1^j : i \le j\} \mapsto \{0^j1^i : i \le j\}$. Intersecting both gives $\{0^n1^n\}$.` },
  ],

  problems: [
    {
      id: 'closure-del-01', type: 'nfa', title: 'Delete one symbol from (01)*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = L((01)^*)$. Build an NFA for $\text{Del}(L) = \{xy : xay \in L \text{ for some } a \in \{0,1\}\}$ — the strings obtained by deleting exactly one symbol from a string of $L$.`,
      accepts: s => { for (let i = 0; i <= s.length; i++) for (const a of '01') if (/^(01)*$/.test(s.slice(0, i) + a + s.slice(i))) return true; return false; },
      sample: String.raw`start: p
accept: r
p 0 -> p0, r
p 1 -> r
p0 1 -> p
r 0 -> r0
r0 1 -> r`,
      hints: [String.raw`Use two copies of the 2-state DFA loop for $(01)^*$: before and after the deletion.`, String.raw`Deleting the 0 of a block leaves its 1; deleting the 1 leaves its 0. Either way one block becomes a single symbol.`],
      solution: String.raw`Deleting one symbol from $(01)^n$ ($n \ge 1$) turns one block into a single $0$ or $1$, so $\text{Del}(L) = (01)^*(0+1)(01)^*$.

NFA: layer 0 is the loop $p \xrightarrow{0} p_0 \xrightarrow{1} p$; layer 1 is the loop $r \xrightarrow{0} r_0 \xrightarrow{1} r$ with $r$ accepting. The deletion jump from $p$: if the deleted symbol was 1, we read the block's 0 and jump to $r$ ($p \xrightarrow{0} r$); if it was 0, we read the block's 1 and jump ($p \xrightarrow{1} r$). This is the general construction $(q,0) \xrightarrow{\varepsilon} (\delta(q,a),1)$ with the $\varepsilon$-move merged into the neighbouring transition.`,
    },
    {
      id: 'closure-ins-0s1s', type: 'nfa', title: 'Insert one symbol into 0*1*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = L(0^*1^*)$. Build an NFA for $\text{Ins}(L) = \{xay : xy \in L,\ a \in \{0,1\}\}$. Use the two-layer construction on a DFA for $L$.`,
      accepts: s => { for (let i = 0; i < s.length; i++) if (/^0*1*$/.test(s.slice(0, i) + s.slice(i + 1))) return true; return false; },
      sample: String.raw`start: A0
accept: A1, B1
A0 0 -> A0, A1
A0 1 -> B0, A1
B0 1 -> B0, B1
B0 0 -> B1
A1 0 -> A1
A1 1 -> B1
B1 1 -> B1`,
      hints: [String.raw`DFA for $0^*1^*$: $A$ ("only 0s so far", accepting) and $B$ ("seen a 1", accepting); $B \xrightarrow{0}$ dead.`, String.raw`Layer jump: $(q, 0) \xrightarrow{a} (q, 1)$ — read the inserted symbol without moving the DFA.`],
      solution: String.raw`DFA $M$: $A \xrightarrow{0} A$, $A \xrightarrow{1} B$, $B \xrightarrow{1} B$, both accepting. NFA states $A_0, B_0$ (no symbol skipped yet) and $A_1, B_1$ (already skipped one). Copy $M$'s transitions in each layer, and add $A_0 \xrightarrow{0,1} A_1$, $B_0 \xrightarrow{0,1} B_1$ (skip the current symbol). Start $A_0$; accept $A_1, B_1$ (exactly one symbol must be skipped, so $\varepsilon$ is rejected).

The language is $0^*10^*1^* + 0^*1^*01^*$: every non-empty string of $0^*1^*$, plus strings with a single "out of place" symbol.`,
    },
    {
      id: 'closure-half-01', type: 'nfa', title: 'First half of (01)*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = L((01)^*)$. Build an NFA (or any automaton) for $\text{Half}(L) = \{x : xy \in L \text{ for some } y \text{ with } |y| = |x|\}$. Work out what the language is first.`,
      accepts: s => /^(01)*0?$/.test(s),
      sample: String.raw`start: e
accept: e, o
e 0 -> o
o 1 -> e`,
      hints: [String.raw`If $xy = (01)^n$ and $|x| = |y|$, then $|x| = n$. What are the first $n$ symbols of $(01)^n$?`],
      solution: String.raw`For $xy = (01)^n$ with $|x| = |y| = n$, $x$ is the length-$n$ prefix of $(01)^n$: $(01)^{n/2}$ for even $n$ and $(01)^{(n-1)/2}0$ for odd $n$. Conversely each such $x$ works with $y$ = the remaining $n$ symbols. So $\text{Half}(L) = (01)^*(\varepsilon + 0)$ = the prefixes of $0101\cdots$, i.e. a 2-state machine $e \xrightarrow{0} o \xrightarrow{1} e$ with both states accepting (other moves die).

The general construction (forward simulation from $s$ paired with backward simulation from a guessed accepting state, accepting when they meet) would produce an equivalent but larger NFA.`,
    },
    {
      id: 'closure-odds-001', type: 'regex', title: 'Every other symbol of (001)*', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`For a string $w = a_1 a_2 \cdots a_n$ let $\text{odds}(w) = a_1 a_3 a_5 \cdots$ (the symbols in odd positions). Let $\text{Odds}(L) = \{\text{odds}(w) : w \in L\}$. Write a regular expression for $\text{Odds}(L((001)^*))$.`,
      accepts: s => /^(010)*(01)?$/.test(s),
      sample: String.raw`(010)*(ε + 01)`,
      hints: [String.raw`Compute $\text{odds}((001)^n)$ for $n = 0, 1, 2, 3, 4$.`, String.raw`$(001)^n$ has length $3n$; position $i$ holds a 1 iff $3 \mid i$. Among odd positions $1, 3, 5, 7, 9, 11, \ldots$ the pattern is $0,1,0,0,1,0,\ldots$.`],
      solution: String.raw`$(001)^n$ has a 1 exactly at positions divisible by 3. The odd positions $1, 3, 5, 7, 9, 11, \ldots$ give symbols $0, 1, 0, 0, 1, 0, \ldots$, i.e. a prefix of $(010)^\infty$. The number of odd positions in a string of length $3n$ is $\lceil 3n/2 \rceil$: $0, 2, 3, 5, 6, 8, 9, \ldots$ — every length except those $\equiv 1 \pmod 3$. Prefixes of $(010)^\infty$ of length $3k$ are $(010)^k$; of length $3k+2$ are $(010)^k01$. Hence

<code>(010)*(ε + 01)</code>.

Check: $\text{odds}(001) = 01$, $\text{odds}(001001) = 010$, $\text{odds}(001001001) = 01001$.

The general closure construction: from a DFA $M$, the NFA on input $a$ moves $q \to \delta(\delta(q,a), b)$ for a guessed $b$ (the hidden even-position symbol), or $q \to \delta(q,a)$ into a "finished" copy (the original string ended at an odd position).`,
    },
    {
      id: 'closure-hom', type: 'regex', title: 'Homomorphic image', difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Let $L \subseteq \{0,1\}^*$ be the strings with an even number of 1s, and let $h(0) = ab$, $h(1) = b$. Write a regular expression (over $\{a,b\}$) for $h(L)$.`,
      accepts: s => /^(ab|b)*$/.test(s) && ((s.split('b').length - 1) - (s.split('a').length - 1)) % 2 === 0,
      sample: String.raw`((ab)*b(ab)*b)*(ab)*`,
      hints: [String.raw`Start from a regex for $L$, e.g. $(0^*10^*1)^*0^*$, and substitute.`],
      solution: String.raw`$L = L((0^*10^*1)^*0^*)$. Homomorphisms commute with the regex operations, so substitute $0 \mapsto ab$, $1 \mapsto b$:

<code>((ab)*b(ab)*b)*(ab)*</code>.

In words: strings that split into blocks $ab$ and $b$ with an even number of lone-$b$ blocks. (The split is unique because every $a$ must pair with the $b$ right after it.)`,
    },
    {
      id: 'closure-invhom', type: 'regex', title: 'Inverse homomorphism', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $h(0) = a$ and $h(1) = ab$, and let $L \subseteq \{a,b\}^*$ be the strings containing $aa$. Write a regular expression over $\{0,1\}$ for $h^{-1}(L) = \{w \in \{0,1\}^* : h(w) \in L\}$.`,
      accepts: s => [...s].map(c => (c === '0' ? 'a' : 'ab')).join('').includes('aa'),
      sample: String.raw`Σ*0ΣΣ*`,
      hints: [String.raw`Every block $h(0)$ and $h(1)$ starts with $a$. When does a block end with $a$?`],
      solution: String.raw`Every block starts with $a$, and only $h(0) = a$ ends with $a$. So $aa$ appears in $h(w)$ iff some block $h(0)$ is followed by another block, i.e. iff $w$ has a $0$ that is not its last symbol:

<code>Σ*0ΣΣ*</code>.

(Via the general construction: a 3-state DFA for "contains $aa$" with $\delta'(q, 0) = \delta^*(q, a)$ and $\delta'(q, 1) = \delta^*(q, ab)$.)`,
    },
    {
      id: 'closure-pref', type: 'regex', title: 'Prefixes of (01)*11', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`$\text{Pref}(L) = \{x : xy \in L \text{ for some } y\}$. Write a regular expression for $\text{Pref}(L((01)^*11))$.`,
      accepts: s => /^(01)*(0|1|11)?$/.test(s),
      sample: String.raw`(01)*(ε + 0 + 1 + 11)`,
      hints: [String.raw`A prefix of $(01)^n11$ stops either inside the $(01)^n$ part or inside the final $11$.`],
      solution: String.raw`A prefix of $(01)^n 11$ is one of: $(01)^k$ or $(01)^k0$ for $k \le n$ (stopping inside the blocks), or $(01)^n1$, $(01)^n11$. Since $n$ is arbitrary: <code>(01)*(ε + 0 + 1 + 11)</code>.

In general, $\text{Pref}(L)$ is regular: in a DFA for $L$, make accepting every state from which some accepting state is reachable.`,
    },
    {
      id: 'closure-cycle', type: 'regex', title: 'Rotations of 0*1*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`$\text{Cycle}(L) = \{yx : xy \in L\}$ is the set of all rotations of strings of $L$. Write a regular expression for $\text{Cycle}(L(0^*1^*))$.`,
      accepts: s => { for (let i = 0; i <= s.length; i++) if (/^0*1*$/.test(s.slice(i) + s.slice(0, i))) return true; return false; },
      sample: String.raw`0*1*0* + 1*0*1*`,
      hints: [String.raw`Rotate $0^i1^j$ at a cut inside the 0s, or at a cut inside the 1s.`],
      solution: String.raw`For $xy = 0^i 1^j$: if the cut is inside the 0s, $x = 0^a$, $y = 0^b1^j$ and $yx = 0^b1^j0^a$; if inside the 1s, $x = 0^i1^a$, $y = 1^b$ and $yx = 1^b0^i1^a$. So

<code>0*1*0* + 1*0*1*</code>.

Conversely, every string of either form is such a rotation. (Equivalently: the strings with at most three maximal runs, i.e. at most two places where adjacent symbols differ.)`,
    },
    {
      id: 'closure-del-proof', type: 'written', title: 'Closure under deleting one symbol', difficulty: 2,
      prompt: String.raw`Prove that if $L$ is regular then $\text{Del}(L) = \{xy : xay \in L \text{ for some } a \in \Sigma\}$ is regular. Give a precise NFA construction from a DFA $M = (Q, \Sigma, \delta, s, A)$ for $L$ and justify its correctness.`,
      rubric: [
        'States Q × {0,1} with English meaning of the layer bit',
        'Transitions: (q,i) on b goes to (δ(q,b), i); ε-moves (q,0) → (δ(q,a),1) for each a ∈ Σ',
        'Start (s,0), accepting A × {1}',
        'Correctness in both directions: accepting run ⇔ split xy with xay ∈ L',
      ],
      hints: [String.raw`The deleted symbol is not in the input. How can the NFA "read" it anyway?`],
      solution: String.raw`**Construction.** $N = (Q \times \{0,1\}, \Sigma, \delta_N, (s,0), A \times \{1\})$ where

- $(q, i)$ means "$M$ would be in state $q$; $i = 1$ iff we have already accounted for the deleted symbol";
- $\delta_N((q,i), b) = \{(\delta(q,b), i)\}$ for $b \in \Sigma$ (simulate $M$ on input symbols);
- $\delta_N((q,0), \varepsilon) = \{(\delta(q,a), 1) : a \in \Sigma\}$ (guess that symbol $a$ was deleted here).

**Correctness.** ($\Leftarrow$) If $w = xy$ with $xay \in L$: read $x$ in layer 0 to reach $(\delta^*(s,x), 0)$, take the $\varepsilon$-move for $a$ to $(\delta^*(s,xa), 1)$, read $y$ in layer 1 to reach $(\delta^*(s,xay), 1) \in A \times \{1\}$. ($\Rightarrow$) Any accepting run must take exactly one $\varepsilon$-move (it starts in layer 0, ends in layer 1, and layer 1 has no way back). Let $x$ be the input read before it, $a$ the symbol it used, $y$ the input read after. The run shows $\delta^*(s, xay) \in A$, so $xay \in L$ and $w = xy \in \text{Del}(L)$.

Thus $L(N) = \text{Del}(L)$, and since NFAs accept only regular languages, $\text{Del}(L)$ is regular. $\blacksquare$`,
    },
    {
      id: 'closure-half-proof', type: 'written', title: 'Closure under Half', difficulty: 3,
      prompt: String.raw`Prove that if $L$ is regular, then $\text{Half}(L) = \{x : xy \in L \text{ for some } y \text{ with } |y| = |x|\}$ is regular. Describe the NFA precisely (states, start, transitions, accepting states) starting from a DFA $M = (Q,\Sigma,\delta,s,A)$ for $L$, and explain why it works.`,
      rubric: [
        'States are pairs (p, q): p simulates M forward on the input; q tracks a guessed backward simulation on the hidden y',
        'Start: (s, f) for each f ∈ A (e.g. ε-moves from a new start)',
        'Transition on a: (p, q) → (δ(p,a), q\') for every q\' with δ(q\', b) = q for some b ∈ Σ',
        'Accept (p, p); correctness: after reading x, q ranges over states with some length-|x| path into A, so acceptance iff δ*(s,x) has such a path',
      ],
      hints: [String.raw`You can't read $y$ after $x$ — but you can guess $y$ backward, one symbol per symbol of $x$.`, String.raw`The two simulations must meet in the middle state $\delta^*(s,x)$.`],
      solution: String.raw`**Construction.** Let $N$ have states $\{\text{start}\} \cup Q \times Q$.
- $\text{start} \xrightarrow{\varepsilon} (s, f)$ for each $f \in A$.
- On input $a$: $(p, q) \xrightarrow{a} (\delta(p, a), q')$ for every $q'$ such that $\delta(q', b) = q$ for some $b \in \Sigma$.
- Accepting states: $\{(p, p) : p \in Q\}$.

Meaning of $(p, q)$ after reading $x$: $p = \delta^*(s, x)$ (forward simulation), and $q$ is a state from which $M$ can reach the guessed final state $f \in A$ by reading some string $y$ of length exactly $|x|$ (the backward simulation guessed $y$'s symbols from last to first).

**Correctness.** ($\Leftarrow$) If $xy \in L$ with $|y| = |x| = n$, let $f = \delta^*(s, xy)$ and let $q_j = \delta^*(s, x\, y_1 \cdots y_j)$. Guess $f = q_n$ initially, and on the $i$-th input symbol move the second component from $q_{n-i+1}$ to $q_{n-i}$ (valid since $\delta(q_{n-i}, y_{n-i+1}) = q_{n-i+1}$). After $n$ symbols the second component is $q_0 = \delta^*(s, x)$, equal to the first. ($\Rightarrow$) An accepting run ends in $(p, p)$ with $p = \delta^*(s, x)$; the backward guesses spell a string $y$ of length $|x|$ with $\delta^*(p, y) = f \in A$, so $xy \in L$.

$N$ has $|Q|^2 + 1$ states, so $\text{Half}(L)$ is regular. $\blacksquare$`,
    },
    {
      id: 'closure-pitfalls', type: 'written', title: 'Using (and misusing) closure', difficulty: 2,
      prompt: String.raw`(a) Prove that $L = \{w \in \{0,1\}^* : |w| \text{ is divisible by 3 and } w \text{ contains neither } 00 \text{ nor } 11\}$ is regular using closure properties only (no machine needed).

(b) A student argues: "$\{0^n1^n : n \ge 0\} \subseteq 0^*1^*$, and $0^*1^*$ is regular, so $\{0^n1^n\}$ is regular." Explain the error.

(c) A student argues: "$\{0^n1^n\} = \bigcup_{n \ge 0}\{0^n1^n\}$ is a union of finite, hence regular, languages, so it is regular." Explain the error.

(d) Given that $\{0^n1^n : n \ge 0\}$ is not regular, prove that $E = \{w \in \{0,1\}^* : \#(0,w) = \#(1,w)\}$ is not regular.`,
      rubric: [
        '(a) Writes L = (ΣΣΣ)* ∩ complement(Σ*00Σ*) ∩ complement(Σ*11Σ*) and cites closure under ∩ and complement',
        '(b) Regularity is not inherited by subsets (every language is a subset of Σ*)',
        '(c) Closure under union holds only for finitely many languages',
        '(d) E ∩ 0*1* = {0^n1^n}; if E were regular the intersection would be regular — contradiction',
      ],
      hints: [String.raw`For (d), intersect $E$ with a well-chosen regular language.`],
      solution: String.raw`(a) $L = L((\Sigma\Sigma\Sigma)^*) \cap \overline{L(\Sigma^*00\Sigma^*)} \cap \overline{L(\Sigma^*11\Sigma^*)}$. Each language on the right is regular (described by a regex, or the complement of one), and regular languages are closed under complement and (finite) intersection, so $L$ is regular. (In fact $L = \{\varepsilon\} \cup$ the alternating strings of length divisible by 3.)

(b) Closure properties say nothing about subsets. Every language over $\{0,1\}$ is a subset of the regular language $\Sigma^*$, so "subset of a regular language" carries no information.

(c) The union closure property is proved for two (hence finitely many) languages, by induction on the number of languages; it does not extend to infinitely many. In fact *every* language is a union of singletons.

(d) Suppose $E$ were regular. $0^*1^*$ is regular, so $E \cap 0^*1^*$ would be regular. But $E \cap 0^*1^* = \{0^n1^n : n \ge 0\}$, which is not regular. Contradiction; so $E$ is not regular. $\blacksquare$`,
    },
    {
      id: 'closure-double-inst', type: 'regex', title: 'Double every symbol (instance)', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`For $w = a_1a_2\cdots a_n$ let $\text{double}(w) = a_1a_1a_2a_2\cdots a_na_n$. Let $L$ be the binary strings with **no two consecutive 1s**. Write a regular expression for $\text{Double}(L) = \{\text{double}(w) : w \in L\}$.`,
      accepts: s => { if (s.length % 2) return false; let h = ''; for (let i = 0; i < s.length; i += 2) { if (s[i] !== s[i + 1]) return false; h += s[i]; } return !h.includes('11'); },
      sample: String.raw`(00+1100)*(ε+11)`,
      hints: [String.raw`$\text{Double}$ is the homomorphism $h(0) = 00$, $h(1) = 11$.`, String.raw`A regex for "no $11$" is $(0+10)^*(\varepsilon+1)$. Substitute.`],
      solution: String.raw`$\text{Double}(L) = h(L)$ for $h(0) = 00$, $h(1) = 11$, and homomorphic images are computed by substituting into a regex. Starting from $(0+10)^*(\varepsilon+1)$:

<code>(00+1100)*(ε+11)</code>.

Common mistake: answering "$\text{Double}(L)$ has no $1111$" — that language also contains strings like $0110$, which is not a doubled string at all (its pairs are $01$ and $10$).`,
      tags: ['homomorphism', 'instance'],
    },
    {
      id: 'closure-change-one-inst', type: 'nfa', title: 'Change exactly one symbol of 0*1*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = L(0^*1^*)$ and $\text{Change}(L) = \{xby : xay \in L,\ a, b \in \{0,1\},\ a \neq b\}$ — the strings obtained from a string of $L$ by flipping exactly one symbol. Build an NFA for $\text{Change}(L)$ using the two-layer construction on the DFA for $L$.`,
      accepts: s => { for (let i = 0; i < s.length; i++) { const t = s.slice(0, i) + (s[i] === '0' ? '1' : '0') + s.slice(i + 1); if (/^0*1*$/.test(t)) return true; } return false; },
      sample: String.raw`start: A0
accept: A1, B1
A0 0 -> A0, B1
A0 1 -> B0, A1
B0 1 -> B0
B0 0 -> B1
A1 0 -> A1
A1 1 -> B1
B1 1 -> B1`,
      hints: [String.raw`DFA for $0^*1^*$: $A \xrightarrow{0} A$, $A \xrightarrow{1} B$, $B \xrightarrow{1} B$ (both accepting; $B \xrightarrow{0}$ dead).`, String.raw`Layer jump: reading $b$ in layer 0, move as $M$ would on the *other* symbol, into layer 1.`],
      solution: String.raw`Layer 0 ($A_0, B_0$) and layer 1 ($A_1, B_1$) each copy the DFA. The change transitions $(q, 0) \xrightarrow{b} (\delta(q, \bar b), 1)$, where $\bar b$ is the flipped symbol:
- $A_0 \xrightarrow{0} B_1$ (the 0 was originally a 1; $\delta(A, 1) = B$);
- $A_0 \xrightarrow{1} A_1$ (the 1 was originally a 0; $\delta(A, 0) = A$);
- $B_0 \xrightarrow{0} B_1$ (originally a 1; $\delta(B, 1) = B$);
- $B_0 \xrightarrow{1}$: originally a 0, but $\delta(B, 0)$ is dead — no transition.

Start $A_0$, accepting $A_1, B_1$ (exactly one flip). Examples: $10$ is in (flip the 1: $00$), $0110$ is in (flip the last symbol: $0111$), $1010$ is out (two flips needed), $\varepsilon$ is out.`,
      tags: ['layers', 'instance'],
    },
    {
      id: 'closure-shuffle-01', type: 'dfa', title: 'Shuffle of (01)* with itself', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Let $L = L((01)^*)$. Build a **DFA** for $\text{Shuffle}(L, L)$, the set of strings that can be split into two interleaved subsequences, each in $(01)^*$. First characterize the language. (Hint: think of $0$ as "(" and $1$ as ")".)`,
      accepts: s => { let d = 0; for (const c of s) { d += c === '0' ? 1 : -1; if (d < 0 || d > 2) return false; } return d === 0; },
      sample: String.raw`start: d0
accept: d0
d0 0 -> d1
d1 0 -> d2
d1 1 -> d0
d2 1 -> d1`,
      hints: [String.raw`Each copy of $(01)^*$ is a sequence of "open, close" pairs, so at any moment each copy has 0 or 1 unmatched 0s.`, String.raw`Claim: $w$ is in the shuffle iff every prefix has (number of 0s) $-$ (number of 1s) in $\{0, 1, 2\}$ and the total difference is 0.`],
      solution: String.raw`Let $d(u) = \#_0(u) - \#_1(u)$. **Claim:** $w \in \text{Shuffle}(L, L)$ iff $0 \le d(u) \le 2$ for every prefix $u$ of $w$ and $d(w) = 0$.

($\Rightarrow$) For a string of $(01)^*$, every prefix has difference 0 or 1, ending at 0. The difference of a prefix of $w$ is the sum of the differences of the corresponding prefixes of the two subsequences, so it lies in $\{0, 1, 2\}$ and ends at 0.

($\Leftarrow$) Assign symbols greedily to copies $X$ and $Y$: a 0 read at difference 0 goes to $X$; a 0 read at difference 1 goes to whichever copy is not currently waiting for a 1; a 1 goes to a copy that is waiting for a 1 (one exists since the difference is $\ge 1$ before the 1). Each copy then alternates $0, 1, 0, 1, \ldots$ and ends with no unmatched 0 because the final difference is 0, so both are in $(01)^*$.

DFA: states $d_0, d_1, d_2$ = current difference, start and accept $d_0$; $0$ increments, $1$ decrements; anything leaving $\{0, 1, 2\}$ goes to the (implicit) dead state. Note that the general shuffle construction would produce an NFA on $Q \times Q$; here we found a 3-state DFA by understanding the language.`,
      tags: ['shuffle', 'instance'],
    },
    {
      id: 'closure-min-inst', type: 'regex', title: 'Min of strings ending in 11', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`$\text{Min}(L) = \{w \in L : \text{no proper prefix of } w \text{ is in } L\}$. Write a regular expression for $\text{Min}(L((0+1)^*11))$.`,
      accepts: s => s.endsWith('11') && s.indexOf('11') === s.length - 2,
      sample: String.raw`(0+10)*11`,
      hints: [String.raw`$w$ ends in $11$, and no shorter prefix ends in $11$: the first occurrence of $11$ is at the very end.`, String.raw`If $w = u11$, then $u$ contains no $11$ **and** does not end in 1 (otherwise $u1$ would be a shorter prefix ending in $11$).`],
      solution: String.raw`$w \in \text{Min}(L)$ iff $w = u11$ where the first occurrence of $11$ in $w$ is the final one. That holds iff $u$ has no $11$ and $u$ does not end in $1$, i.e. $u \in (0 + 10)^*$. So:

<code>(0+10)*11</code>.

Via the general construction: take the 3-state DFA for "ends in 11" and redirect the edges leaving its accepting state to a dead state.`,
      tags: ['min', 'instance'],
    },
    {
      id: 'closure-cycle-inst', type: 'regex', title: 'Rotations of (00)*1', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`$\text{Cycle}(L) = \{yx : xy \in L\}$. Write a regular expression for $\text{Cycle}(L((00)^*1))$.`,
      accepts: s => { for (let i = 0; i <= s.length; i++) if (/^(00)*1$/.test(s.slice(i) + s.slice(0, i))) return true; return false; },
      sample: String.raw`(00)*1(00)* + 0(00)*10(00)*`,
      hints: [String.raw`A rotation of $0^{2k}1$ has the form $0^a10^b$. What must be true of $a + b$?`],
      solution: String.raw`Rotating $0^{2k}1$ gives $0^a 1 0^b$ with $a + b = 2k$ (cut after $b$ zeros, or at the end); conversely every $0^a10^b$ with $a + b$ even is such a rotation. $a + b$ is even iff $a, b$ are both even or both odd:

<code>(00)*1(00)* + 0(00)*10(00)*</code>.

A frequent wrong answer is $0^*10^*$, which includes $0100$ (here $a + b = 3$ is odd).`,
      tags: ['cycle', 'instance'],
    },
    {
      id: 'closure-half-111', type: 'regex', title: 'First half of "contains 111"', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = L((0+1)^*111(0+1)^*)$ and $\text{Half}(L) = \{x : xy \in L \text{ for some } y \text{ with } |y| = |x|\}$. Write a regular expression for $\text{Half}(L)$. Be careful with short strings.`,
      accepts: s => { const n = s.length; for (let m = 0; m < (1 << n); m++) { let y = ''; for (let i = 0; i < n; i++) y += (m >> i) & 1 ? '1' : '0'; if ((s + y).includes('111')) return true; } return false; },
      sample: String.raw`(0+1)1 + ΣΣΣΣ*`,
      maxLen: 10,
      hints: [String.raw`If $|x| \ge 3$, choose $y = 1^{|x|}$.`, String.raw`If $|x| = 2$, the string $xy$ has length 4; when can it contain $111$? If $|x| \le 1$?`],
      solution: String.raw`- $|x| \ge 3$: take $y = 1^{|x|}$, which itself contains $111$. So every such $x$ is in.
- $|x| = 2$: $xy$ has length 4, and $111$ must occupy positions 1–3 or 2–4. Both need position 2 (the last symbol of $x$) to be 1; and then $y = 11$ works. So $x \in \{01, 11\}$.
- $|x| \le 1$: $xy$ has length at most 2 — impossible.

Hence <code>(0+1)1 + ΣΣΣΣ*</code>. The answer "$\Sigma^*$" or "$\Sigma\Sigma\Sigma^*$" ignores the short cases — always test the boundary lengths in Half-type problems.`,
      tags: ['half', 'instance'],
    },
    {
      id: 'closure-double-proof', type: 'written', title: 'Closure under doubling and undoubling', difficulty: 2,
      prompt: String.raw`For $w = a_1\cdots a_n$ let $\text{double}(w) = a_1a_1\cdots a_na_n$. Let $L$ be regular with DFA $M = (Q, \Sigma, \delta, s, A)$. **Without** citing closure under (inverse) homomorphism, give explicit DFA constructions and correctness arguments showing that (a) $\text{Double}(L) = \{\text{double}(w) : w \in L\}$ and (b) $\text{Undouble}(L) = \{w : \text{double}(w) \in L\}$ are regular.`,
      rubric: [
        '(a) States Q ∪ (Q×Σ) ∪ {dead} with meanings ("owe a second copy of a")',
        '(a) Transitions q →a (q,a), (q,a) →a δ(q,a), (q,a) →b dead for b ≠ a; start s, accept A',
        '(a) Correctness: invariant δ\'*(s, double(x)) = δ*(s,x); every other input ends in Q×Σ or dead',
        '(b) Same states as M, δ\'\'(q,a) = δ(δ(q,a),a), with induction δ\'\'*(q,w) = δ*(q, double(w))',
      ],
      hints: [String.raw`For (a), after reading the first copy of a symbol the machine must remember which symbol it owes.`, String.raw`For (b), each input symbol stands for two symbols of $M$'s input.`],
      solution: String.raw`**(a)** $M' = (Q \cup (Q \times \Sigma) \cup \{\bot\}, \Sigma, \delta', s, A)$ where $(q, a)$ means "$M$ is in $q$ and we have read the first copy of $a$, so the next symbol must be $a$", and $\bot$ is a dead state:
- $\delta'(q, a) = (q, a)$; $\delta'((q, a), a) = \delta(q, a)$; $\delta'((q, a), b) = \bot$ for $b \ne a$; $\delta'(\bot, b) = \bot$.

*Invariant* (induction on $|x|$): $\delta'^*(s, \text{double}(x)) = \delta^*(s, x)$ — true for $x = \varepsilon$, and $\delta'^*(s, \text{double}(xa)) = \delta'(\delta'(\delta^*(s,x), a), a) = \delta'((\delta^*(s,x), a), a) = \delta(\delta^*(s,x), a) = \delta^*(s, xa)$. Every input $w$ is either $\text{double}(x)$, or $\text{double}(x)a$ (ends in $(q, a) \notin A$), or has a first "bad pair" (ends in $\bot$). So $M'$ accepts $w$ iff $w = \text{double}(x)$ with $\delta^*(s, x) \in A$, i.e. $w \in \text{Double}(L)$.

**(b)** $M'' = (Q, \Sigma, \delta'', s, A)$ with $\delta''(q, a) = \delta(\delta(q, a), a)$. By induction, $\delta''^*(q, w) = \delta^*(q, \text{double}(w))$: for $w = xa$, $\delta''^*(q, xa) = \delta(\delta(\delta^*(q, \text{double}(x)), a), a) = \delta^*(q, \text{double}(x)aa)$. Hence $w \in L(M'')$ iff $\text{double}(w) \in L$. $\blacksquare$`,
    },
    {
      id: 'closure-change-one-proof', type: 'written', title: 'Closure under changing one symbol', difficulty: 2,
      prompt: String.raw`Prove that if $L \subseteq \Sigma^*$ is regular then $\text{Change}(L) = \{xby : xay \in L \text{ for some } a, b \in \Sigma \text{ with } a \neq b\}$ is regular. Start from a DFA $M = (Q, \Sigma, \delta, s, A)$ for $L$; describe the NFA precisely and prove both directions of correctness.`,
      rubric: [
        'States Q × {0,1} with the meaning of the layer bit (whether the changed symbol has been read)',
        'Transitions (q,i) →b (δ(q,b), i) and (q,0) →b (δ(q,a),1) for every a ≠ b',
        'Start (s,0), accepting A × {1}',
        'Witness ⇒ accepting run and accepting run ⇒ witness (exactly one layer change)',
      ],
      hints: [String.raw`The input contains $b$ where the original string had $a$. Read $b$, but move $M$ as if it read $a$.`],
      solution: String.raw`**Construction.** $N = (Q \times \{0, 1\}, \Sigma, \delta_N, (s, 0), A \times \{1\})$. $(q, i)$ means "$M$, run on the original string, would be in $q$; $i = 1$ iff the changed position has already been read".
- $\delta_N((q, i), b) \ni (\delta(q, b), i)$ for all $b$ (unchanged positions);
- $\delta_N((q, 0), b) \ni (\delta(q, a), 1)$ for all $a \ne b$ (this input $b$ replaced an original $a$).

**Witness $\Rightarrow$ run.** If $w = xby$ with $xay \in L$, $a \ne b$: read $x$ in layer 0 to $(\delta^*(s,x), 0)$; read $b$ using the change edge to $(\delta^*(s, xa), 1)$; read $y$ in layer 1 to $(\delta^*(s, xay), 1) \in A \times \{1\}$.

**Run $\Rightarrow$ witness.** An accepting run starts in layer 0 and ends in layer 1, and the only edges between layers are change edges going up, so it uses exactly one change edge, on some input symbol $b$ with "original" $a \ne b$. Let $x$ and $y$ be the input before and after it. The run shows $\delta^*(s, xay) \in A$, so $xay \in L$ and $w = xby \in \text{Change}(L)$. $\blacksquare$

(Variant: "change at most one symbol" accepts $A \times \{0, 1\}$; "change exactly $k$" uses $k+1$ layers.)`,
    },
    {
      id: 'closure-min-max', type: 'written', title: 'Min and Max', difficulty: 3,
      prompt: String.raw`For a language $L$ define $\text{Min}(L) = \{w \in L : \text{no proper prefix of } w \text{ is in } L\}$ and $\text{Max}(L) = \{w \in L : wz \notin L \text{ for every nonempty } z\}$.

(a) Prove that if $L$ is regular then $\text{Min}(L)$ and $\text{Max}(L)$ are regular.
(b) Compute $\text{Min}(L)$ and $\text{Max}(L)$ for $L = L(0^*1^*)$ and for $L = L((0+1)^*1)$.
(c) Explain why your construction for $\text{Min}$ would fail if applied to an NFA.`,
      rubric: [
        'Min: DFA with every edge out of an accepting state redirected to a dead state; correctness via the unique run',
        'Max: accepting set B = {q ∈ A : no accepting state reachable from q by a nonempty path}; correctness via δ*(s,wz) = δ*(δ*(s,w),z)',
        'Correct examples: Min(0*1*) = {ε}, Max(0*1*) = ∅, Min(Σ*1) = 0*1, Max(Σ*1) = ∅',
        'NFA failure explained with an example (another run can avoid the accepting prefix)',
      ],
      hints: [String.raw`A DFA has exactly one run; "some proper prefix is in $L$" means that run visited $A$ before the end.`, String.raw`For $\text{Max}$: which states $q \in A$ have no nonempty path back into $A$?`],
      solution: String.raw`Let $M = (Q, \Sigma, \delta, s, A)$ be a complete DFA for $L$.

**(a) Min.** $M_{\min}$: add a dead state $\bot$; for every $q \in A$ and $a \in \Sigma$ set $\delta_{\min}(q, a) = \bot$; other transitions as in $M$; accepting set $A$. The run of $M_{\min}$ on $w$ agrees with $M$'s run until the first time it is in an accepting state *and* reads another symbol. So $M_{\min}$ accepts $w$ iff $M$'s run ends in $A$ and visits $A$ at no earlier time, i.e. iff $w \in L$ and no proper prefix (including $\varepsilon$) is in $L$.

**Max.** Let $B = \{q \in A : \delta^*(q, z) \notin A \text{ for all } z \ne \varepsilon\}$, computable by graph search from each successor of $q$. $M_{\max}$ = $M$ with accepting set $B$. With $q = \delta^*(s, w)$: $w \in L(M_{\max})$ iff $q \in A$ and no nonempty $z$ has $\delta^*(q, z) = \delta^*(s, wz) \in A$, iff $w \in \text{Max}(L)$. $\blacksquare$

**(b)** $\varepsilon \in 0^*1^*$, so every nonempty string has a proper prefix ($\varepsilon$) in $L$: $\text{Min}(0^*1^*) = \{\varepsilon\}$. Every $w \in 0^*1^*$ extends to $w1 \in 0^*1^*$: $\text{Max}(0^*1^*) = \varnothing$. For $\Sigma^*1$: the minimal strings end in 1 with no earlier 1, so $\text{Min} = 0^*1$; and $w1$ always extends $w$ within the language, so $\text{Max} = \varnothing$.

**(c)** In an NFA, a string may have one run that is accepting at a proper prefix and another run that reaches acceptance only at the end; cutting edges out of accepting states kills only the first. Example: $s \xrightarrow{0} f$, $s \xrightarrow{0} p$, $p \xrightarrow{0} f$ ($f$ accepting) recognizes $\{0, 00\}$; $f$ has no outgoing edges, so the "construction" changes nothing and still accepts $00 \notin \text{Min}(\{0, 00\}) = \{0\}$. Determinize first.`,
    },
    {
      id: 'closure-root-proof', type: 'written', title: 'Closure under square root {w : ww ∈ L}', difficulty: 3,
      prompt: String.raw`Prove that if $L$ is regular then $\text{Root}(L) = \{w : ww \in L\}$ is regular. Give an NFA built from a DFA $M = (Q, \Sigma, \delta, s, A)$ for $L$, explain the meaning of its states, and prove correctness. Then explain why the similar-looking language $\{ww : w \in L\}$ need not be regular.`,
      rubric: [
        'Guesses q = δ*(s,w) at the start (ε-moves from a new start to (q, s, q))',
        'Runs two copies of M in lockstep: one from s, one from the guessed q',
        'Accepts (q, q, f) with f ∈ A; both directions of correctness',
        'Counterexample for {ww : w ∈ L}: L = Σ* gives the non-regular squares language',
      ],
      hints: [String.raw`$ww \in L$ iff $\delta^*(\delta^*(s, w), w) \in A$. The machine reads $w$ only once, so it must already know $\delta^*(s, w)$ while reading it.`],
      solution: String.raw`**Construction.** States: a new start $\sigma$ and triples $(q, p_1, p_2) \in Q^3$, meaning "we guessed $q = \delta^*(s, w)$; the first simulation (from $s$) is in $p_1$; the second (from $q$) is in $p_2$".
- $\sigma \xrightarrow{\varepsilon} (q, s, q)$ for each $q \in Q$;
- $(q, p_1, p_2) \xrightarrow{a} (q, \delta(p_1, a), \delta(p_2, a))$;
- accepting states: $(q, q, f)$ with $f \in A$.

**Correctness.** After reading $w$ from the guess $q$, the NFA is in exactly $(q, \delta^*(s, w), \delta^*(q, w))$ (each guess gives a deterministic run). This is accepting iff $\delta^*(s, w) = q$ and $\delta^*(q, w) \in A$. ($\Leftarrow$) If $ww \in L$, guess $q = \delta^*(s,w)$: then $\delta^*(q, w) = \delta^*(s, ww) \in A$. ($\Rightarrow$) If some guess accepts, then $q = \delta^*(s, w)$ and $\delta^*(s, ww) = \delta^*(q, w) \in A$. So $L(N) = \text{Root}(L)$, which is therefore regular. $\blacksquare$

(DFA alternative: the state after $w$ is the function $f_w : Q \to Q$, $f_w(q) = \delta^*(q, w)$; there are at most $|Q|^{|Q|}$ such functions; accept iff $f_w(f_w(s)) \in A$.)

**The other direction fails.** For $L = \Sigma^*$ (regular), $\{ww : w \in \Sigma^*\}$ is the squares language, which is not regular (fooling set $\{0^i1 : i \ge 0\}$ with suffix $0^i1$).`,
    },
    {
      id: 'closure-shuffle-proof', type: 'written', title: 'Closure under shuffle', difficulty: 2,
      prompt: String.raw`For strings $x, y$, a *shuffle* of $x$ and $y$ is any string obtained by interleaving them while keeping the order of symbols within each (e.g. $0\underline{1}1\underline{0}$ is a shuffle of $01$ and $10$). Let $\text{Shuffle}(L_1, L_2) = \{w : w \text{ is a shuffle of some } x \in L_1, y \in L_2\}$. Prove that if $L_1, L_2$ are regular then $\text{Shuffle}(L_1, L_2)$ is regular.`,
      rubric: [
        'States Q1 × Q2 from DFAs M1, M2, with meaning (where each machine is on its subsequence so far)',
        'On a: (p,q) → (δ1(p,a), q) and (p,q) → (p, δ2(q,a)) — guess which string the symbol belongs to',
        'Start (s1,s2); accept A1 × A2',
        'Both directions of correctness (an interleaving gives a run, a run gives an interleaving)',
      ],
      hints: [String.raw`Each input symbol belongs to $x$ or to $y$. Guess which, and advance the corresponding DFA.`],
      solution: String.raw`Let $M_i = (Q_i, \Sigma, \delta_i, s_i, A_i)$ be DFAs for $L_i$. Define the NFA $N$ with states $Q_1 \times Q_2$, start $(s_1, s_2)$, accepting $A_1 \times A_2$, and for each $a$:
$$(p, q) \xrightarrow{a} (\delta_1(p, a), q) \quad\text{and}\quad (p, q) \xrightarrow{a} (p, \delta_2(q, a)).$$
State $(p, q)$ means "$M_1$ is in $p$ after the symbols assigned to $x$ so far, $M_2$ is in $q$ after those assigned to $y$".

($\Leftarrow$) If $w$ is a shuffle of $x \in L_1$ and $y \in L_2$, follow the interleaving: use the first kind of edge for symbols of $x$ and the second for symbols of $y$. The run ends in $(\delta_1^*(s_1, x), \delta_2^*(s_2, y)) \in A_1 \times A_2$.

($\Rightarrow$) Given an accepting run, let $x$ be the subsequence of input symbols read with first-kind edges and $y$ the rest. By induction along the run, the state is $(\delta_1^*(s_1, x'), \delta_2^*(s_2, y'))$ for the parts $x', y'$ read so far; ending in $A_1 \times A_2$ means $x \in L_1$, $y \in L_2$, and $w$ is a shuffle of them. $\blacksquare$`,
    },
    {
      id: 'closure-alternate-proof', type: 'written', title: 'Closure under alternation (perfect shuffle)', difficulty: 2,
      prompt: String.raw`Define $\text{Alt}(L_1, L_2) = \{a_1b_1a_2b_2\cdots a_nb_n : n \ge 0,\ a_1a_2\cdots a_n \in L_1,\ b_1b_2\cdots b_n \in L_2\}$ (all $a_i, b_i \in \Sigma$). Prove that if $L_1$ and $L_2$ are regular, then $\text{Alt}(L_1, L_2)$ is regular, by constructing a **DFA**. Then give a regular expression for $\text{Alt}(L(0^*), L(1^*))$.`,
      rubric: [
        'States Q1 × Q2 × {1,2} (turn bit), with meanings',
        'Odd positions advance M1 and set turn 2; even positions advance M2 and set turn 1',
        'Start (s1,s2,1); accept A1 × A2 × {1} (rejects odd-length inputs)',
        'Correctness argument (invariant after each complete pair) and the example (01)*',
      ],
      hints: [String.raw`The position parity tells you whose symbol it is — no guessing needed.`],
      solution: String.raw`Let $M_i$ be DFAs. $D$ has states $Q_1 \times Q_2 \times \{1, 2\}$; $(p, q, t)$ means "$M_1$ is in $p$ on $a_1 \cdots$ so far, $M_2$ in $q$ on $b_1 \cdots$ so far, and the next symbol belongs to string $t$".
- $\delta((p, q, 1), c) = (\delta_1(p, c), q, 2)$ and $\delta((p, q, 2), c) = (p, \delta_2(q, c), 1)$.
- Start $(s_1, s_2, 1)$; accept $A_1 \times A_2 \times \{1\}$.

*Invariant* (induction on $n$): after reading $a_1b_1\cdots a_nb_n$ the state is $(\delta_1^*(s_1, a_1\cdots a_n), \delta_2^*(s_2, b_1\cdots b_n), 1)$; after an odd-length input the turn bit is 2, which is not accepting. Hence $D$ accepts exactly $\text{Alt}(L_1, L_2)$. $\blacksquare$

Example: $a_1\cdots a_n \in 0^*$ and $b_1 \cdots b_n \in 1^*$ force every pair to be $01$: $\text{Alt}(0^*, 1^*) = (01)^*$.`,
    },
    {
      id: 'closure-regular-or-not', type: 'written', title: 'Regular or not? (closure arguments)', difficulty: 2,
      prompt: String.raw`For each language over $\{0,1\}$, decide whether it is regular and prove your answer using closure properties (you may assume $\{0^n1^n : n \ge 0\}$ is not regular).

(a) $\{0^n1^n : n \ge 0\} \cup \{0^m1^n : m \neq n\}$
(b) $\{w : \#_0(w) = \#_1(w)\} \cap L((01)^*)$
(c) $\{0^m1^n : m \ge n\}$
(d) $\{w : w = 0^n1^n \text{ for some } n \ge 0, \text{ or } |w| \text{ is odd}\}$`,
      rubric: [
        '(a) Regular: equals 0*1*',
        '(b) Regular: equals (01)* since every string of (01)* has equal counts',
        '(c) Not regular: L ∩ R(swap(L)) = {0^n1^n}, where swap exchanges 0 and 1 (homomorphism) and R is reversal',
        '(d) Not regular: intersect with the even-length strings (ΣΣ)* to get {0^n1^n}',
      ],
      hints: [String.raw`For (c): how can closure operations turn "$m \ge n$" into "$m \le n$"? Try swapping the symbols and reversing.`, String.raw`For (d): every string $0^n1^n$ has even length.`],
      solution: String.raw`**(a) Regular.** The union is exactly $\{0^m1^n : m, n \ge 0\} = L(0^*1^*)$. (A union with a non-regular piece can be regular.)

**(b) Regular.** Every string of $(01)^*$ has equally many 0s and 1s, so the intersection is $L((01)^*)$.

**(c) Not regular.** Suppose $L = \{0^m1^n : m \ge n\}$ were regular. Let $h(0) = 1$, $h(1) = 0$. Then $h(L) = \{1^m0^n : m \ge n\}$ is regular, and so is its reversal $h(L)^R = \{0^n1^m : m \ge n\}$, i.e. the strings $0^a1^b$ with $b \ge a$. Then $L \cap h(L)^R = \{0^a1^b : a \ge b \text{ and } b \ge a\} = \{0^n1^n\}$ would be regular. Contradiction.

**(d) Not regular.** Suppose $L$ were regular. $(\Sigma\Sigma)^*$ (even length) is regular, so $L \cap (\Sigma\Sigma)^*$ would be regular. Strings of odd length are removed, and every $0^n1^n$ has even length $2n$, so the intersection is $\{0^n1^n\}$. Contradiction.`,
    },
    {
      id: 'closure-nonreg-chain', type: 'written', title: 'Closure chains for non-regularity', difficulty: 3,
      prompt: String.raw`Assume only that $\{0^n1^n : n \ge 0\}$ is not regular. Using closure properties (no fooling sets), prove:

(a) $\{0^i1^j : i > j\}$ is not regular.
(b) $\{w \in \{0,1\}^* : \#_0(w) = 2\,\#_1(w)\}$ is not regular.

(c) A student writes: "$\{0^i1^j : i \ne j\} = \{0^i1^j : i > j\} \cup \{0^i1^j : i < j\}$, and both parts are non-regular by (a) and symmetry, so $\{0^i1^j : i \neq j\}$ is not regular." Is the conclusion true? Is the argument valid?`,
      rubric: [
        '(a) Difference with 0*1* gives {i ≤ j}; swap-and-reverse gives {i ≥ j}; intersection gives 0^n1^n',
        '(b) Intersect with 0*1* to get {0^{2n}1^n}; inverse homomorphism g(0)=00, g(1)=1 maps it back to {0^n1^n}',
        '(b) Justifies g^{-1}({0^{2n}1^n}) = {0^n1^n} (both inclusions)',
        '(c) Conclusion true but argument invalid: a union of non-regular languages can be regular; a valid proof uses complement ∩ 0*1*',
      ],
      hints: [String.raw`(a): First get $\{0^i1^j : i \le j\}$, then flip it.`, String.raw`(b): After intersecting with $0^*1^*$ you have $\{0^{2n}1^n\}$. Which homomorphism $g$ satisfies $g(0^n1^n) = 0^{2n}1^n$? Use $g^{-1}$.`],
      solution: String.raw`**(a)** Suppose $L = \{0^i1^j : i > j\}$ is regular. Then $L_1 = L(0^*1^*) \setminus L = \{0^i1^j : i \le j\}$ is regular (closure under difference). Let $h(0) = 1$, $h(1) = 0$; $h(L_1)^R = \{0^j1^i : i \le j\}$, i.e. $\{0^a1^b : a \ge b\}$, is regular (homomorphism, reversal). So $L_1 \cap h(L_1)^R = \{0^n1^n\}$ is regular — contradiction.

**(b)** Suppose $L = \{w : \#_0(w) = 2\#_1(w)\}$ is regular. Then $L' = L \cap L(0^*1^*) = \{0^{2n}1^n : n \ge 0\}$ is regular. Let $g(0) = 00$, $g(1) = 1$. Claim $g^{-1}(L') = \{0^n1^n\}$. ($\supseteq$) $g(0^n1^n) = 0^{2n}1^n \in L'$. ($\subseteq$) If $g(w) \in L' \subseteq 0^*1^*$, then $w$ has no $1$ before a $0$ (else $g(w)$ would contain $10$), so $w = 0^a1^b$ and $g(w) = 0^{2a}1^b$; membership in $L'$ forces $2a = 2b$, so $a = b$. Since regular languages are closed under inverse homomorphism, $\{0^n1^n\}$ would be regular — contradiction.

**(c)** The conclusion is true but the argument is **invalid**: closure says nothing about unions of non-regular languages ($N \cup \overline{N} = \Sigma^*$). A valid proof: if $\{0^i1^j : i \ne j\}$ were regular, then $L(0^*1^*) \setminus \{0^i1^j : i \ne j\} = \{0^n1^n\}$ would be regular.`,
    },
  ],
});
