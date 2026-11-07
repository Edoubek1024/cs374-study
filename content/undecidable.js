CS374.topic({
  id: 'undecidable',
  unit: 'models',
  order: 9,
  title: 'Undecidability & Reductions',
  summary: 'Diagonalization shows some problems cannot be solved by any algorithm; reductions from the halting problem and Rice\'s theorem spread undecidability to many natural questions about programs.',
  objectives: [
    'Explain the counting/diagonalization argument that some languages are not decidable (or even recognizable)',
    'Prove SELFREJECT, ACCEPT and HALT undecidable',
    'Write a correct reduction proof in the course template: suppose DecideB exists, build DecideHalt, prove both directions',
    'State Rice\'s theorem, check its conditions, and recognize when it does not apply',
    'Classify languages as decidable, recognizable, co-recognizable, or neither, and use closure properties'
  ],
  lesson: String.raw`## There are more problems than programs

Every Turing machine has a finite description $\langle M \rangle$, a string over a fixed alphabet. The set of finite strings is **countable** (list them by length, then alphabetically), so there are only countably many TMs, hence only countably many recognizable languages.

But a language over $\{0,1\}$ is an *arbitrary subset* of the countable set $\{0,1\}^*$, and by Cantor's theorem there are **uncountably many** subsets.

> **Theorem.** There are languages that no Turing machine recognizes (and therefore no TM decides). In fact, "almost all" languages are unrecognizable.

**Diagonalization.** Cantor's argument, in machine form: list all TMs $M_1, M_2, M_3, \ldots$ and all strings $w_1, w_2, w_3, \ldots$, and build the language
$$D = \{w_i : M_i \text{ does not accept } w_i\}.$$
For each $i$, $D$ and $L(M_i)$ disagree on the string $w_i$. So $D \ne L(M_i)$ for every $i$: $D$ is not recognizable. Counting arguments are non-constructive; next we find *specific*, natural undecidable problems.

## A concrete undecidable language: SELFREJECT

> **Definition.** $\mathrm{SELFREJECT} = \{\langle M \rangle : M \text{ rejects } \langle M \rangle\}$.

> **Theorem.** SELFREJECT is undecidable.

*Proof.* Suppose for contradiction that some TM $SR$ decides SELFREJECT. Since $SR$ is a decider, on input $\langle SR \rangle$ it either accepts or rejects.

- If $SR$ accepts $\langle SR \rangle$: since $SR$ decides SELFREJECT, $\langle SR \rangle \in \mathrm{SELFREJECT}$, which by definition means $SR$ rejects $\langle SR \rangle$. Contradiction.
- If $SR$ rejects $\langle SR \rangle$: by definition $\langle SR \rangle \in \mathrm{SELFREJECT}$, so $SR$ (deciding it) must accept $\langle SR \rangle$. Contradiction.

Both cases are impossible, so no such $SR$ exists. $\blacksquare$

The same self-reference shows that $\{\langle M\rangle : M \text{ does not accept } \langle M\rangle\}$ is not even *recognizable*: if $R$ recognized it, then $\langle R \rangle$ is in the language iff $R$ does not accept $\langle R \rangle$ iff $\langle R \rangle \notin L(R)$.

### Full proof: the halting problem is undecidable (direct diagonalization)

> **Theorem.** $\mathrm{HALT} = \{\langle M, w\rangle : M \text{ halts on } w\}$ is undecidable.

*Proof.* Suppose for contradiction that a TM $H$ decides HALT: on every input $\langle M, w\rangle$, $H$ halts, accepting iff $M$ halts on $w$. Build the "contrarian" machine
~~~pseudo
D(⟨M⟩):
    if H(⟨M, ⟨M⟩⟩) accepts:     (H says: M halts on its own encoding)
        loop forever
    else:
        halt
~~~
$D$ is a legitimate TM: it uses $H$ as a subroutine, and because $H$ always halts, $D$ always reaches its if-test. Now ask what $D$ does on input $\langle D\rangle$:
- If $D$ halts on $\langle D\rangle$, then $H$ accepts $\langle D, \langle D\rangle\rangle$, so $D$ takes the first branch and loops forever. Contradiction.
- If $D$ does not halt on $\langle D\rangle$, then $H$ rejects $\langle D, \langle D\rangle\rangle$, so $D$ takes the second branch and halts. Contradiction.

Both cases are impossible, so $H$ does not exist. $\blacksquare$

*Why this is diagonalization.* Picture an infinite table whose rows are machines $M_1, M_2, \ldots$, whose columns are their encodings $\langle M_1\rangle, \langle M_2\rangle, \ldots$, and whose entries say "halts" or "loops". $D$ was built to disagree with the diagonal entry of every row: $D$ halts on $\langle M_i\rangle$ iff $M_i$ loops on $\langle M_i\rangle$. So $D$ is not any row — but $D$ is a TM, so it must be a row. The only way out is that the hypothetical $H$ (needed to build $D$) does not exist.

> **Warning.** The proof needs $H$ to be a **decider**. HALT *is* recognizable (simulate $M$ on $w$ and accept if it halts). With a mere recognizer $H$, $D$ could loop inside the call to $H$, and no contradiction arises.

## Reductions

> **Definition.** A **reduction** from problem $A$ to problem $B$ is an algorithm for $A$ that uses an algorithm for $B$ as a subroutine (a "black box"). If such a reduction exists we say $A$ **reduces to** $B$.

> **Theorem.** If $A$ reduces to $B$ and $B$ is decidable, then $A$ is decidable. Equivalently: **if $A$ reduces to $B$ and $A$ is undecidable, then $B$ is undecidable.**

> **Warning.** Direction is everything. To prove a new problem $B$ is undecidable, reduce a *known* undecidable problem (usually HALT) **to** $B$: assume a decider for $B$ and use it to decide HALT. Reducing $B$ to HALT proves nothing (everything recognizable reduces to HALT).

### The chain: SELFREJECT, REJECT, ACCEPT, HALT

Let $\mathrm{REJECT} = \{\langle M, w\rangle : M \text{ rejects } w\}$, $\mathrm{ACCEPT} = \{\langle M, w\rangle : M \text{ accepts } w\}$, $\mathrm{HALT} = \{\langle M, w\rangle : M \text{ halts on } w\}$.

- **REJECT is undecidable.** Given a decider $DecideReject$, the algorithm $DecideSelfReject(\langle M \rangle) = DecideReject(\langle M, \langle M \rangle \rangle)$ decides SELFREJECT.
- **ACCEPT is undecidable.** Given $DecideAccept$: on input $\langle M, w\rangle$, construct $M'$ = $M$ with its accept and reject states swapped; return $DecideAccept(\langle M', w\rangle)$. This decides REJECT, since $M'$ accepts $w$ iff $M$ rejects $w$.
- **HALT is undecidable.** Given $DecideHalt$: on input $\langle M, w\rangle$, if $DecideHalt(\langle M, w\rangle)$ rejects, reject (M loops, so it does not accept). Otherwise simulate $M$ on $w$ — guaranteed to halt — and accept iff $M$ accepted. This decides ACCEPT.

From now on HALT is our main source of undecidability.

## The reduction template

Here is the shape of every reduction proof in this course, illustrated on
$$\mathrm{ACCEPTALL} = \{\langle M \rangle : L(M) = \Sigma^*\}.$$

> **Exam tip.** The proof below is the model answer to imitate: the same three parts (algorithm, two directions, contradiction) appear in every reduction you will write.

**Model answer: ACCEPTALL is undecidable.** Suppose for contradiction that there is a TM $DecideAcceptAll$ that decides ACCEPTALL. Then the following algorithm decides HALT:

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w     (ignore x)
            return TRUE
    if DecideAcceptAll(⟨M'⟩)
        return TRUE
    else
        return FALSE
~~~

We prove that DecideHalt is correct.

- **Suppose $M$ halts on $w$.** Then for every input $x$, $M'$ finishes simulating $M$ and accepts. So $L(M') = \Sigma^*$, $DecideAcceptAll$ accepts $\langle M' \rangle$, and $DecideHalt$ correctly accepts $\langle M, w\rangle$.
- **Suppose $M$ does not halt on $w$.** Then $M'$ runs forever on every input $x$, so $L(M') = \emptyset \ne \Sigma^*$. $DecideAcceptAll$ rejects $\langle M' \rangle$, and $DecideHalt$ correctly rejects.

In both cases $DecideHalt$ answers correctly, and it always halts because $DecideAcceptAll$ does. But HALT is undecidable — contradiction. Hence ACCEPTALL is undecidable. $\blacksquare$

Key points the graders check:

1. **The decider never runs $M'$.** $DecideHalt$ only *writes down the code* of $M'$ (a finite, mechanical transformation of $\langle M, w\rangle$) and hands it to the black box. Running $M'$ might loop; constructing it cannot.
2. **$M'$ ignores (or uses) its own input $x$**; it has $M$ and $w$ "hard-coded".
3. **Both directions:** if $M$ halts on $w$ then $\langle M' \rangle \in B$; if $M$ does not halt on $w$ then $\langle M' \rangle \notin B$.

### More examples (same $M'$!)

The machine "$M'(x)$: run $M$ on $w$; accept" has $L(M') = \Sigma^*$ if $M$ halts on $w$ and $L(M') = \emptyset$ otherwise. That single construction proves undecidable every property that $\Sigma^*$ has and $\emptyset$ lacks (or vice versa):

- $\mathrm{ACCEPT}\varepsilon = \{\langle M\rangle : M \text{ accepts } \varepsilon\}$: return $DecideAcceptEps(\langle M'\rangle)$.
- $\{\langle M\rangle : M \text{ accepts at least one palindrome}\}$.
- $\{\langle M\rangle : L(M) \ne \emptyset\}$, $\{\langle M\rangle : L(M) \text{ is infinite}\}$.
- $\mathrm{HALTALL} = \{\langle M\rangle : M \text{ halts on every input}\}$: $M'$ halts on everything, or on nothing.
- $\mathrm{EQ} = \{\langle M_1, M_2\rangle : L(M_1) = L(M_2)\}$: return $DecideEq(\langle M', M_{\mathrm{all}}\rangle)$ where $M_{\mathrm{all}}$ accepts every input immediately.

Sometimes you need a different $M'$. To show $\{\langle M \rangle : L(M) \text{ is regular}\}$ undecidable, both $\Sigma^*$ and $\emptyset$ are regular, so use

~~~pseudo
M'(x):
    if x = 0^n 1^n for some n:  return TRUE
    run M on input w
    return TRUE
~~~

Now $L(M') = \Sigma^*$ (regular) if $M$ halts on $w$ and $L(M') = \{0^n1^n\}$ (not regular) otherwise.

### Worked example: exactly one string

Let $\mathrm{ONE} = \{\langle M\rangle : |L(M)| = 1\}$. The usual $M'$ fails: neither $\Sigma^*$ nor $\emptyset$ has exactly one element, so $DecideOne$ would reject in both cases and tell us nothing. Instead, $M'$ should accept exactly *one* string when $M$ halts:

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            if x = ε: return TRUE
            else:     return FALSE
    return DecideOne(⟨M'⟩)
~~~

If $M$ halts on $w$, then $L(M') = \{\varepsilon\}$, which has exactly one element, so $DecideOne$ accepts. If $M$ does not halt on $w$, then $M'$ loops on every input, $L(M') = \emptyset$, and $DecideOne$ rejects. So a decider for ONE would decide HALT.

> **Key idea.** Design $M'$ backwards: pick a language $L_{\mathrm{yes}}$ with the property and a language $L_{\mathrm{no}}$ without it, then make $M'$ behave like $L_{\mathrm{yes}}$ when $M$ halts on $w$ and like $L_{\mathrm{no}}$ when it does not. With "run $M$ on $w$ first", $L_{\mathrm{no}}$ is automatically $\emptyset$; if $\emptyset$ *has* the property, accept the strings of $L_{\mathrm{no}}$ *before* running $M$ (as in the regularity example).

### Worked example: a behavioral property

Let $\mathrm{REJECT0} = \{\langle M\rangle : M \text{ rejects the input } 0\}$. This is about rejecting (not about $L(M)$), but the same pattern works: let $M'(x)$ run $M$ on $w$ and then **reject**. Then $M'$ rejects $0$ iff $M$ halts on $w$, so $DecideHalt(\langle M, w\rangle) = DecideReject0(\langle M'\rangle)$ is correct. The template is flexible: what matters is that membership of $\langle M'\rangle$ in the target language flips exactly according to whether $M$ halts on $w$.

~~~~steps A complete reduction, built step by step
**The problem.** Prove that $\mathrm{EVENONLY} = \{\langle M\rangle : L(M) \text{ contains at least one even-length string and no odd-length string}\}$ is undecidable, by reduction from HALT.
+++
**Choose the two target languages.** We need $L_{\mathrm{yes}}$ with the property and $L_{\mathrm{no}}$ without it.
- $L_{\mathrm{yes}} = \{x : |x| \text{ even}\}$ — it has even-length strings and no odd ones.
- $L_{\mathrm{no}} = \emptyset$ — it has *no* even-length string, so it fails the property.

Since $\emptyset$ lacks the property, the simple "run $M$ on $w$ first" pattern will work.
+++
**Construct $M'$ from $\langle M, w\rangle$.** It must behave like $L_{\mathrm{yes}}$ if $M$ halts on $w$, and like $\emptyset$ otherwise:
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w          (M and w are hard-coded)
            if |x| is even: return TRUE
            else:           return FALSE
    return DecideEvenOnly(⟨M'⟩)
~~~
$DecideHalt$ never runs $M'$; writing down $\langle M'\rangle$ is a simple mechanical edit of $\langle M\rangle$ and $w$.
+++
**Direction 1: $M$ halts on $w$.** Then for every input $x$, $M'$ finishes the simulation and accepts exactly when $|x|$ is even. So $L(M') = \{x : |x| \text{ even}\}$: it contains $\varepsilon$ (even) and no odd-length string. $\langle M'\rangle \in \mathrm{EVENONLY}$, so $DecideEvenOnly$ accepts and $DecideHalt$ correctly accepts.
+++
**Direction 2: $M$ does not halt on $w$.** Then $M'$ runs forever on every input, so $L(M') = \emptyset$, which contains no even-length string. $\langle M'\rangle \notin \mathrm{EVENONLY}$, so $DecideEvenOnly$ rejects and $DecideHalt$ correctly rejects.
+++
**Conclude.** $DecideHalt$ always halts (constructing $\langle M'\rangle$ terminates and $DecideEvenOnly$ is a decider) and answers correctly on every input, so it decides HALT. That is impossible, so the assumed $DecideEvenOnly$ does not exist: EVENONLY is undecidable. $\blacksquare$

(Rice would also do it: the property depends only on $L(M)$; $Y$ = "accept iff $|x|$ even", $N$ = "reject everything".)
~~~~

**Try it first.** Prove that both $\mathrm{NONREG} = \{\langle M\rangle : L(M) \text{ is not regular}\}$ and $\mathrm{IS0N1N} = \{\langle M\rangle : L(M) = \{0^n1^n : n \ge 0\}\}$ are undecidable — with a *single* construction of $M'$.

~~~~reveal Solution
For both properties, $\emptyset$ is a "no" language (it is regular, and it is not $\{0^n1^n\}$), and $\{0^n1^n\}$ is a "yes" language. So take
~~~pseudo
M'(x):
    run M on input w
    if x = 0^n 1^n for some n ≥ 0: return TRUE
    else: return FALSE
~~~
- $M$ halts on $w$ $\Rightarrow$ $L(M') = \{0^n1^n\}$: not regular, and equal to $\{0^n1^n\}$. Both deciders would accept.
- $M$ does not halt $\Rightarrow$ $L(M') = \emptyset$: regular, and not equal to $\{0^n1^n\}$. Both deciders would reject.

So $DecideHalt(\langle M, w\rangle) = DecideNonReg(\langle M'\rangle)$ (or $DecideIs0n1n(\langle M'\rangle)$) decides HALT — contradiction. Compare with REGULAR, where $\emptyset$ is a "yes" language and we had to accept $0^n1^n$ *before* running $M$.
~~~~

**Try it first.** Find the bug in this "proof" that $\mathrm{ACCEPT}\varepsilon = \{\langle M\rangle : M \text{ accepts } \varepsilon\}$ is undecidable: "*$DecideHalt(\langle M, w\rangle)$: construct $M'(x)$ = run $M$ on $w$, accept. Run $M'$ on $\varepsilon$. If it accepts, call $DecideAcceptEps(\langle M'\rangle)$ and return its answer; otherwise return FALSE.*"

~~~reveal Solution
$DecideHalt$ **runs** $M'$ on $\varepsilon$, which runs $M$ on $w$ — if $M$ loops on $w$, $DecideHalt$ loops too, so it is not a decider and there is no contradiction. (And if the run finishes, we already know the answer, so the call to the black box is pointless.) The correct proof just returns $DecideAcceptEps(\langle M'\rangle)$ without running anything.
~~~

## Rice's theorem

Many of the examples above ask about the *language* of a machine. Rice's theorem handles all such questions at once.

> **Theorem.** (Rice) Let $\mathcal{L}$ be a set of languages. Suppose
> 1. there is a TM $Y$ with $L(Y) \in \mathcal{L}$, and
> 2. there is a TM $N$ with $L(N) \notin \mathcal{L}$.
>
> Then $\mathrm{ACCEPTIN}(\mathcal{L}) = \{\langle M\rangle : L(M) \in \mathcal{L}\}$ is undecidable.

The property must be (a) **semantic** — it depends only on $L(M)$, so machines with the same language are either both in or both out — and (b) **non-trivial** — some recognizable language has it and some recognizable language does not.

*Proof.* Suppose for contradiction that $DecideIn$ decides $\mathrm{ACCEPTIN}(\mathcal{L})$.

*Case 1: $\emptyset \notin \mathcal{L}$.* Consider
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w       (ignore its answer)
            run Y on input x and return its answer   (loop if Y loops)
    return DecideIn(⟨M'⟩)
~~~
If $M$ halts on $w$, then on every input $x$ the machine $M'$ ends up doing exactly what $Y$ does, so $L(M') = L(Y) \in \mathcal{L}$ and $DecideHalt$ accepts. If $M$ does not halt on $w$, $M'$ loops on every input, $L(M') = \emptyset \notin \mathcal{L}$, and $DecideHalt$ rejects.

*Case 2: $\emptyset \in \mathcal{L}$.* Use $N$ in place of $Y$ and return the **negation** of $DecideIn(\langle M'\rangle)$. If $M$ halts on $w$, $L(M') = L(N) \notin \mathcal{L}$, so $DecideIn$ rejects and we accept; if not, $L(M') = \emptyset \in \mathcal{L}$, so $DecideIn$ accepts and we reject.

In both cases $DecideHalt$ only builds $\langle M'\rangle$ (from $\langle M, w\rangle$ and the fixed machine $Y$ or $N$) and calls a decider, so it halts on every input and decides HALT — a contradiction. $\blacksquare$

Where the hypotheses enter: non-triviality gives the machines $Y$ and $N$ that $M'$ needs; semantics is what makes "$L(M') = L(Y)$" enough to conclude $\langle M'\rangle \in \mathrm{ACCEPTIN}(\mathcal{L})$.

**How to apply Rice (exam write-up).**

1. Write the language as $\{\langle M \rangle : L(M) \in \mathcal{L}\}$ and say what $\mathcal{L}$ is — this shows the property is semantic.
2. Give a concrete $Y$ (e.g. "the TM that accepts every input immediately", $L(Y) = \Sigma^*$).
3. Give a concrete $N$ (e.g. "the TM that rejects every input immediately", $L(N) = \emptyset$).
4. Conclude by Rice's theorem.

**Example.** $\{\langle M\rangle : L(M) \text{ is finite}\}$: $\mathcal{L}$ = finite languages. $N$ = accept everything ($\Sigma^*$ infinite), $Y$ = reject everything ($\emptyset$ finite). Undecidable.

### When Rice's theorem does NOT apply

> **Warning.** Rice is about $L(M)$ only. It says nothing about properties of the machine's *code* or *behavior* beyond the accepted language.

- **Syntactic properties:** "$M$ has at most 374 states", "$M$ has a transition that writes $X$" — decidable by reading $\langle M \rangle$.
- **Time / space-bounded behavior:** "$M$ halts on $\varepsilon$ within 100 steps" — decidable by simulating 100 steps. "$M$ moves left at least once on input $\varepsilon$" — decidable (if it only moves right on a blank tape, after $|Q|$ steps it repeats a state and is stuck in a rightward loop).
- **Halting vs. accepting:** "$M$ halts on $\varepsilon$" or "$M$ halts on all inputs" are **not** semantic: a machine that rejects a string and one that loops on it can have the same language. These are undecidable, but you must prove it by a direct reduction, not by Rice.
- **Self-reference:** "$M$ accepts $\langle M \rangle$" depends on the encoding of $M$, not only on $L(M)$. Undecidable (by diagonalization/reduction), but not by Rice.
- **Trivial properties:** "$L(M)$ is recognizable" holds for every $M$, so the language is all TM encodings — decidable.
- **Not about TMs:** "$\langle D \rangle$ is a DFA with $L(D) = \emptyset$" is decidable (graph search). Rice is about Turing machines.

Also, Rice tells you only "undecidable" — not whether the language is recognizable.

**Try it first.** For each, does Rice's theorem apply? (a) $\{\langle M\rangle : L(M) \text{ contains both } 0 \text{ and } 1\}$; (b) $\{\langle M\rangle : M \text{ accepts } 0 \text{ in exactly } 10 \text{ steps}\}$; (c) $\{\langle M\rangle : L(M) = \{\langle M\rangle\}\}$; (d) $\{\langle M_1, M_2\rangle : L(M_1) \subseteq L(M_2)\}$.

~~~reveal Solution
- (a) **Applies:** a property of $L(M)$; $Y$ = accept everything, $N$ = reject everything. Undecidable.
- (b) **Does not apply** (speed is not a property of the language). **Decidable:** simulate 10 steps.
- (c) **Does not apply:** the condition mentions $\langle M\rangle$ itself, so two machines with the same language need not agree. (It is in fact undecidable, but the proof needs the *recursion theorem*, which lets a machine obtain its own encoding — beyond what this course requires.)
- (d) **Does not apply directly** (input is a pair). Still undecidable by an easy reduction: with $M_{\mathrm{all}}$ accepting everything and the standard $M'$ ("run $M$ on $w$; accept"), $L(M_{\mathrm{all}}) \subseteq L(M')$ iff $L(M') = \Sigma^*$ iff $M$ halts on $w$. So $DecideHalt(\langle M, w\rangle) = DecideSubset(\langle M_{\mathrm{all}}, M'\rangle)$.
~~~

### Rice does not apply — so is it decidable or not?

When the property is about behavior or code rather than $L(M)$, you have to decide the question yourself. Two standard tools:

1. **Look for a finiteness argument (decidable).** Is there a computable bound after which the answer can no longer change? Typical reasons: a fixed step bound; a machine that has only moved right reads only input symbols and then blanks, so its state must repeat within $|Q|$ steps; a machine confined to a bounded number of cells has boundedly many configurations; in $k$ steps a machine can read only the first $k$ input symbols, so finitely many inputs need to be checked.
2. **Otherwise try a reduction (undecidable).** Build $M'$ that simulates $M$ on $w$ while *avoiding* the behavior in question, and performs it only after the simulation halts (writing a special symbol, entering a special state, halting at all). The reduction fails exactly when the simulation itself cannot avoid the behavior — e.g. "writes some non-blank symbol" (a simulation must write) or "moves left" (a simulation must move left) — and in exactly those cases it is worth looking harder for a finiteness argument (both of these examples turn out to be decidable).

| Question about $M$ on a fixed input | Status | Why |
|---|---|---|
| halts within 374 steps | decidable | simulate 374 steps |
| halts, after more than 374 steps | undecidable | warm up 400 steps, then simulate $M$ on $w$ |
| ever moves left | decidable | only-right runs repeat a state after the input is passed |
| ever writes $\star$ | undecidable | simulate with $\star$ renamed, then write $\star$ |
| ever writes a non-blank (blank tape) | decidable | all-blank tape: the state alone determines the future |
| enters state $q$ | undecidable | simulate without using $q$, then enter $q$ |
| uses more than 374 cells | decidable | while confined to a bounded region there are boundedly many configurations; a repeat means it loops in place |
| halts on every input within 374 steps | decidable | only inputs of length $\le 374$ matter |

**Try it first.** Is $\mathrm{SMALL} = \{\langle M\rangle : M \text{, run on a blank tape, visits at most } 374 \text{ distinct cells}\}$ decidable?

~~~reveal Solution
**Decidable.** The head moves one cell per step, so the visited cells always form a contiguous block containing the starting cell. As long as at most 374 cells have been visited, that block lies inside the 747 cells within distance 373 of the start, and every other cell is blank. So, until a 375th cell is visited, the configuration (state, absolute head position, contents of those 747 cells) takes at most $B = |Q|\cdot 747\cdot|\Gamma|^{747}$ values. Simulate $M$ on the blank tape for $B + 1$ steps:
- if it visits a 375th cell, **reject**;
- if it halts, **accept**;
- otherwise some configuration has repeated exactly. A deterministic machine that repeats a configuration cycles through the same configurations forever, so it never visits a new cell: **accept**.

Rice does not apply (this is about space usage, not $L(M)$), and no reduction works because a simulation of an arbitrary $M$ on $w$ needs unboundedly many cells.
~~~

## Recognizable vs. co-recognizable

> **Definition.** $L$ is **co-recognizable** if $\overline{L}$ is recognizable.

> **Theorem.** $L$ is decidable $\iff$ $L$ is both recognizable and co-recognizable.

So an undecidable recognizable language must have a non-recognizable complement:

- **HALT** is recognizable: run $M$ on $w$; accept if it halts. Hence $\overline{\mathrm{HALT}}$ is **not** recognizable.
- **ACCEPT** is recognizable (universal TM); $\overline{\mathrm{ACCEPT}}$ is not.
- **NONEMPTY** $= \{\langle M\rangle : L(M) \ne \emptyset\}$ is recognizable by **dovetailing**: for $t = 1, 2, 3, \ldots$, run $M$ for $t$ steps on each of the first $t$ strings; accept if any run accepts. (Running $M$ on one string at a time could loop forever on the first string.) So $\mathrm{EMPTY} = \{\langle M\rangle : L(M) = \emptyset\}$ is co-recognizable but not recognizable.
- Some languages are **neither**: e.g. $\mathrm{EQ}$, $\mathrm{ACCEPTALL}$, $\mathrm{INF}$, $\mathrm{FINITE}$.

**Rule of thumb.** A language is recognizable when membership has a *finite certificate* you can find by searching: an accepting computation, a string together with an accepting run, two accepted strings. Languages that say "never" or "for all" ("$M$ never halts", "$L(M) = \emptyset$") tend to be co-recognizable. Languages that say "for all ... there exists" or "exactly" tend to be neither.

### Mapping reductions: proving non-recognizability

Look at the reductions above: $DecideHalt$ computes $\langle M'\rangle$ from $\langle M, w\rangle$ and returns the black box's answer *unchanged*. Such a reduction is a **mapping reduction**: a computable $f$ with
$$x \in A \iff f(x) \in B.$$

> **Lemma.** If $A$ mapping-reduces to $B$ and $B$ is recognizable, then $A$ is recognizable. Also $\overline{A}$ mapping-reduces to $\overline{B}$ via the same $f$.

*Proof.* To recognize $A$ on input $x$, compute $f(x)$ and run $B$'s recognizer on it. The second claim is the contrapositive of $x \in A \iff f(x) \in B$. $\blacksquare$

Consequences, since $\overline{\mathrm{HALT}}$ is not recognizable:
- If $\overline{\mathrm{HALT}}$ maps to $B$, then $B$ is **not recognizable**.
- If $\mathrm{HALT}$ maps to $B$, then $\overline{\mathrm{HALT}}$ maps to $\overline{B}$, so $B$ is **not co-recognizable**.

Every standard reduction "$M'$: run $M$ on $w$, then ..." maps HALT to $B$. To map $\overline{\mathrm{HALT}}$ to $B$ you need an $M'$ that lands **in** $B$ when $M$ *loops* — usually via a **step counter**: "$M'(x)$: simulate $M$ on $w$ for $|x|$ steps; if it halted, do one thing, otherwise another".

~~~~steps Classifying ACCEPTALL completely
**Goal.** Show that $\mathrm{ACCEPTALL} = \{\langle M\rangle : L(M) = \Sigma^*\}$ is neither recognizable nor co-recognizable. (Undecidable we already know.)
+++
**Not co-recognizable: map HALT to ACCEPTALL.** $f(\langle M, w\rangle) = \langle M'\rangle$ with $M'(x)$ = "run $M$ on $w$; accept". $M$ halts on $w$ $\iff$ $L(M') = \Sigma^*$. So HALT maps to ACCEPTALL, hence $\overline{\mathrm{HALT}}$ maps to $\overline{\mathrm{ACCEPTALL}}$. If ACCEPTALL were co-recognizable, $\overline{\mathrm{ACCEPTALL}}$ would be recognizable, and then so would $\overline{\mathrm{HALT}}$. Impossible.
+++
**Not recognizable: we need $M''$ with $L(M'') = \Sigma^*$ exactly when $M$ does NOT halt on $w$.** Use a step counter driven by the input length:
~~~pseudo
M''(x):
    simulate M on w for |x| steps
    if M halted within those steps: return FALSE
    return TRUE
~~~
+++
**Check both cases.** If $M$ never halts on $w$, the simulation never sees a halt, so $M''$ accepts every $x$: $L(M'') = \Sigma^*$. If $M$ halts after exactly $t$ steps, then every $x$ with $|x| \ge t$ is rejected, so $L(M'') = \{x : |x| < t\} \ne \Sigma^*$. Hence $\langle M, w\rangle \in \overline{\mathrm{HALT}} \iff \langle M''\rangle \in \mathrm{ACCEPTALL}$.
+++
**Conclude.** If ACCEPTALL were recognizable, the lemma would make $\overline{\mathrm{HALT}}$ recognizable. So ACCEPTALL is neither recognizable nor co-recognizable. The same two maps work for EQ (compare with $M_{\mathrm{all}}$) and, with the roles of "finite" and "everything" in mind, for INF and FINITE.
~~~~

**Try it first.** Classify $\mathrm{MANY} = \{\langle M\rangle : M \text{ accepts at least } 374 \text{ different strings}\}$: decidable? recognizable? co-recognizable?

~~~reveal Solution
- **Recognizable:** dovetail — for $t = 1, 2, \ldots$, run $M$ for $t$ steps on each of the first $t$ strings; accept once 374 different strings have been accepted. If $M$ accepts at least 374 strings, each is accepted within some number of steps and has some index; the round equal to the largest of these numbers finds all of them.
- **Undecidable:** Rice — the property depends only on $L(M)$; $Y$ = accept everything (infinitely many strings), $N$ = reject everything.
- **Not co-recognizable:** it is recognizable and undecidable; if it were also co-recognizable it would be decidable.
~~~

## Closure properties

| Operation | Decidable | Recognizable |
|---|---|---|
| union | yes | yes (run both in parallel) |
| intersection | yes | yes (run one, then the other) |
| complement | yes (swap accept/reject) | **no** (HALT) |
| concatenation | yes (try every split) | yes (dovetail over splits) |
| Kleene star | yes | yes (dovetail over splittings) |

For recognizable union you must alternate steps: running $M_1$ to completion first could loop even though $M_2$ accepts. Closure also helps classify: if $L_1$ is recognizable and $L_2$ is co-recognizable, then $L_1 \setminus L_2 = L_1 \cap \overline{L_2}$ is recognizable.

## Common exam problem patterns

| Pattern | Recipe |
|---|---|
| **"Prove $B$ undecidable" (property of $L(M)$)** | Either Rice ($\mathcal{L}$, concrete $Y$ and $N$) or the template: assume $DecideB$; build $M'$ from $\langle M, w\rangle$; prove both directions; contradiction. |
| **Property where $\emptyset$ is a "yes"** (regular, CF, closed under reversal, finite) | Accept a fixed "bad" language unconditionally *before* running $M$ on $w$: then halts $\Rightarrow \Sigma^*$, loops $\Rightarrow$ the bad language. |
| **Size properties** (exactly one, exactly $k$, at least $k$) | After running $M$ on $w$, accept a fixed set of the right size. |
| **Pairs of machines** (EQ, COMMON, $L(M_1) \subseteq L(M_2)$) | Pair $M'$ with a fixed machine ($M_{\mathrm{all}}$ or $M_{\mathrm{none}}$). Rice does not apply directly. |
| **Behavioral property** (halts, writes $\star$, enters $q$) | Not Rice. Reduction: simulate $M$ on $w$ while avoiding the behavior, then perform it. |
| **Bounded behavior** (within $k$ steps, moves left, bounded cells) | Probably decidable: give the bound and the simulation; argue the answer cannot change after the bound. |
| **Does Rice apply?** | Check semantic (find two machines with equal languages that differ? then no) and non-trivial; give $Y$, $N$. If not, decide by hand. |
| **Classify rec / co-rec / neither** | Positive claims: give a (dovetailing) recognizer. Negative claims: "recognizable + undecidable $\Rightarrow$ not co-recognizable", or a mapping reduction from $\overline{\mathrm{HALT}}$ (step-counter trick). |
| **Diagonalization** | Assume a decider $H$; build $D$ that does the opposite of $H$'s prediction on $\langle M\rangle$; run $D$ on $\langle D\rangle$; two cases, both contradictions. |

## Where students lose points

- **Reducing in the wrong direction** — using a HALT decider to decide your language. The black box must be the decider for the **new** problem.
- **Running $M'$ (or $M$) inside the decider.** $DecideHalt$ only *constructs* $\langle M'\rangle$. Any unbounded simulation in $DecideHalt$ breaks the proof.
- **Only proving one direction** of the correctness argument — both "halts $\Rightarrow$ in $B$" and "does not halt $\Rightarrow$ not in $B$" are required.
- **An $M'$ whose two cases land on the same side**: e.g. using $\Sigma^*$ vs. $\emptyset$ for "is regular" or "has exactly one string".
- **Making $M'$ depend on $w$ in a way that is not computable**, e.g. "if $M$ halts on $w$, accept everything" — $M'$ cannot know that; it must *run* $M$ on $w$.
- **Applying Rice to a non-semantic or trivial property** (halting, number of states, running time, self-reference, "$L(M)$ is recognizable"). Also applying Rice to DFAs or CFGs.
- **Claiming undecidability because the problem "requires simulating $M$"** — bounded simulations are fine.
- **Confusing "rejects" with "does not accept"** and **"recognizable" with "decidable"**: a recognizer may loop on non-members, a decider never loops.
- **Forgetting dovetailing** when claiming recognizability of an "exists a string" property.

## Self-check

1. True or false: if $B$ reduces to HALT, then $B$ is undecidable.

~~~reveal Answer
False. Every recognizable language (including every decidable one) reduces to HALT. To show $B$ undecidable, reduce HALT **to** $B$.
~~~

2. Is $\{\langle M\rangle : M \text{ accepts } \langle M\rangle \text{ within } |\langle M\rangle| \text{ steps}\}$ decidable?

~~~reveal Answer
Yes. Compute $k = |\langle M\rangle|$ and simulate $M$ on $\langle M\rangle$ for $k$ steps. Self-reference does not hurt when the simulation is bounded.
~~~

3. Why can't Rice's theorem show that $\{\langle M\rangle : M \text{ halts on } 0\}$ is undecidable? Is it undecidable?

~~~reveal Answer
Halting is not a property of $L(M)$: "reject 0 immediately" and "loop on 0" can give machines with the same language, one in the set and one not. It *is* undecidable: $M'(x)$ = "run $M$ on $w$; accept" halts on 0 iff $M$ halts on $w$.
~~~

4. Give $M'$ for showing $\{\langle M\rangle : L(M) \text{ is finite}\}$ undecidable, and say whether it is the "accept first" kind.

~~~reveal Answer
No "accept first" trick is needed, because the standard construction already lands on opposite sides: $M'(x)$ = "run $M$ on $w$; accept" gives $\Sigma^*$ (infinite, not in FINITE) when $M$ halts and $\emptyset$ (finite, in FINITE) when it loops. So $DecideHalt$ returns the **negation** of $DecideFinite(\langle M'\rangle)$. (Accepting a fixed infinite set first would be a mistake here: then both cases give infinite languages.)
~~~

5. $L$ is recognizable and $\overline{L}$ is recognizable. What do you know? What if only $L$ is?

~~~reveal Answer
Both: $L$ is decidable (run the two recognizers alternately). Only $L$: $L$ is recognizable; it may or may not be decidable; if it is undecidable, then $\overline{L}$ is not recognizable.
~~~

6. Is $\{\langle M\rangle : M \text{ has a transition that moves left}\}$ decidable? What about "$M$ moves left on some input"?

~~~reveal Answer
Both decidable. The first is a syntactic check of the transition table. The second: compute the states reachable by right moves on input symbols, then by right moves on blanks, and check whether a left-moving transition can be triggered from them (finite graph search).
~~~

7. What is the status of $\{\langle M\rangle : M \text{ does not accept } 0\}$?

~~~reveal Answer
Co-recognizable (its complement "$M$ accepts 0" is recognizable by simulation) and undecidable (Rice), hence not recognizable.
~~~

8. In the step-counter construction "$M'(x)$: simulate $M$ on $w$ for $|x|$ steps; reject if it halted, else accept", what is $L(M')$ in each case, and which classification does it prove for INF?

~~~reveal Answer
Never halts: $L(M') = \Sigma^*$ (infinite). Halts after $t$ steps: $L(M') = \{x : |x| < t\}$ (finite). So $\overline{\mathrm{HALT}}$ maps to INF, and INF is **not recognizable**.
~~~
`,
  cheatsheet: String.raw`## Core facts

- TMs countable, languages uncountable $\Rightarrow$ unrecognizable languages exist.
- SELFREJECT $= \{\langle M\rangle : M \text{ rejects } \langle M\rangle\}$ undecidable (run $SR$ on $\langle SR\rangle$).
- HALT undecidable directly: $D(\langle M\rangle)$ = loop if $H(\langle M, \langle M\rangle\rangle)$ accepts, else halt; run $D$ on $\langle D\rangle$.
- REJECT, ACCEPT, HALT undecidable; ACCEPT and HALT recognizable.
- $A$ reduces to $B$ and $A$ undecidable $\Rightarrow$ $B$ undecidable. **Reduce FROM HALT TO the new problem.** Everything recognizable reduces to HALT, so "$B$ reduces to HALT" proves nothing.

## Reduction template

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following TM M':
        M'(x): run M on w; return TRUE
    return DecideB(⟨M'⟩)
~~~
- $M$ halts on $w$ $\Rightarrow$ $L(M') = \Sigma^*$ $\Rightarrow$ $\langle M'\rangle \in B$.
- $M$ loops on $w$ $\Rightarrow$ $L(M') = \emptyset$ $\Rightarrow$ $\langle M'\rangle \notin B$.
- Contradiction with HALT undecidable. Never run $M'$; just build it.

## Choosing $M'$ (pick $L_{\mathrm{yes}}$, $L_{\mathrm{no}}$)

| Target property | $M'(x)$ | halts / loops |
|---|---|---|
| $\Sigma^*$-type ($L(M)$ nonempty, contains $0$, infinite, ACCEPTALL) | run $M$ on $w$; accept | $\Sigma^*$ / $\emptyset$ |
| exactly one / $k$ strings | run $M$ on $w$; accept iff $x \in$ fixed set | size $k$ / $\emptyset$ |
| non-regular, $= \{0^n1^n\}$ | run $M$ on $w$; accept iff $x \in 0^n1^n$ | $0^n1^n$ / $\emptyset$ |
| regular | if $x \in 0^n1^n$ accept; run $M$ on $w$; accept | $\Sigma^*$ / $0^n1^n$ |
| context-free | if $x \in a^nb^nc^n$ accept; run $M$ on $w$; accept | $\Sigma^*$ / $a^nb^nc^n$ |
| closed under reversal | if $x = 01$ accept; run $M$ on $w$; accept | $\Sigma^*$ / $\{01\}$ |
| EQ, COMMON, SUBSET | standard $M'$ paired with $M_{\mathrm{all}}$ | — |
| halts on 0 | run $M$ on $w$; accept | halts / loops |
| writes $\star$ / enters $q$ | simulate avoiding $\star$ / $q$; then do it | does / never |
| halts after $> 374$ steps | waste 400 steps; run $M$ on $w$; halt | — |

If $\emptyset$ has the property, either accept a "bad" set **before** running $M$ on $w$, or keep the standard $M'$ and **negate** the answer (if $\Sigma^*$ lacks the property).

## Rice's theorem

$\{\langle M\rangle : L(M) \in \mathcal{L}\}$ is undecidable if some TM $Y$ has $L(Y) \in \mathcal{L}$ and some TM $N$ has $L(N) \notin \mathcal{L}$.
- Proof: $M'(x)$: run $M$ on $w$; run $Y$ on $x$. ($\emptyset \in \mathcal{L}$: use $N$ and negate.)
- Must be **semantic** (depends only on $L(M)$) and **non-trivial**. "$L(M)$ decidable" IS non-trivial.
- Not for: #states, step bounds, halting (vs accepting), head moves, symbols written, "$M$ accepts $\langle M\rangle$", pairs of machines, DFAs/CFGs.
- Write-up: name $\mathcal{L}$; give $Y$; give $N$; conclude.

## Decidable despite looking hard

- Halts within $k$ / within $f(|\langle M\rangle|)$ steps (bounded simulation).
- Halts on **every** input within 374 steps (only inputs of length $\le 374$ matter).
- Moves left on $w$ / on some input / on every input (right-only runs repeat a state).
- Writes a non-blank on a blank tape (all-blank tape: state determines future; $|Q|$ steps).
- Visits at most $k$ cells (bounded configurations; a repeat means it loops in place).
- Syntactic properties of $\langle M\rangle$; DFA/CFG questions (emptiness, membership).

## Recognizability

- Decidable $\iff$ recognizable and co-recognizable.
- Mapping reduction $f$: $x \in A \iff f(x) \in B$; $B$ rec $\Rightarrow$ $A$ rec.
- $\overline{\mathrm{HALT}} \to B$ $\Rightarrow$ $B$ not recognizable. HALT $\to B$ $\Rightarrow$ $B$ not co-recognizable.
- Step-counter $M'(x)$: simulate $M$ on $w$ for $|x|$ steps; reject if halted, else accept. Loops $\Rightarrow \Sigma^*$; halts after $t$ $\Rightarrow$ $\{x : |x| < t\}$.

| Language | Status |
|---|---|
| ACCEPT, HALT, NONEMPTY, COMMON, "accepts 374", $\lvert L(M)\rvert \ge k$ | recognizable, not decidable |
| $\overline{\mathrm{HALT}}$, EMPTY, DISJOINT, $\lvert L(M)\rvert \le 1$ | co-recognizable only |
| EQ, ACCEPTALL, INF, FINITE, ONE | neither |
| halts within $k$ steps; #states; moves left | decidable |

- Recognizable: closed under $\cup$ (parallel), $\cap$, concat, star (dovetail); **not** complement.
- Decidable: closed under all of these and complement.
`,
  quiz: [
    {
      type: 'tf',
      q: 'If A reduces to B and B is decidable, then A is decidable.',
      answer: true,
      explain: 'A reduction is an algorithm for A that calls a B-solver as a subroutine. Plugging in an actual decider for B gives an actual decider for A. The contrapositive is how we prove undecidability: if A is undecidable, B cannot be decidable.'
    },
    {
      type: 'mc',
      q: 'You want to prove that a new language B is undecidable. Which argument works?',
      choices: [
        'Assume a decider for HALT and use it to build a decider for B',
        'Assume a decider for B and use it to build a decider for HALT',
        'Show that deciding B requires simulating a Turing machine',
        'Show that B is recognizable'
      ],
      answer: 1,
      explain: 'Reduce FROM the known undecidable problem TO the new one: a decider for B would yield a decider for HALT, which is impossible. The first choice is backwards (it only shows B is no harder than HALT). "Requires simulation" is not a proof — bounded simulations are decidable. Recognizability says nothing about undecidability.'
    },
    {
      type: 'tf',
      q: 'If B is undecidable and A reduces to B, then A is undecidable.',
      answer: false,
      explain: 'Wrong direction. Any decidable A trivially reduces to B (the reduction just ignores the B-solver). Undecidability flows from A to B, not from B to A.'
    },
    {
      type: 'tf',
      q: 'Rice\'s theorem shows that {⟨M⟩ : M has an even number of states} is undecidable.',
      answer: false,
      explain: 'This is a syntactic property of the machine\'s code, not a property of L(M): two machines with the same language can have different numbers of states. In fact the language is decidable — just count the states in the encoding.'
    },
    {
      type: 'multi',
      q: 'For which of these languages does Rice\'s theorem DIRECTLY prove undecidability? (select all that apply)',
      choices: [
        String.raw`$\{\langle M\rangle : L(M) = \emptyset\}$`,
        String.raw`$\{\langle M\rangle : L(M) \text{ is finite}\}$`,
        String.raw`$\{\langle M\rangle : M \text{ accepts } \langle M\rangle\}$`,
        String.raw`$\{\langle M\rangle : M \text{ halts on every input}\}$`,
        String.raw`$\{\langle M\rangle : 0101 \in L(M)\}$`,
        String.raw`$\{\langle M\rangle : L(M) \text{ is recognizable}\}$`
      ],
      answer: [0, 1, 4],
      explain: String.raw`Choices 1, 2, 5 are non-trivial properties of $L(M)$. "$M$ accepts $\langle M\rangle$" depends on $M$'s own encoding, not only on $L(M)$. "Halts on every input" is about halting: a machine that rejects $x$ and one that loops on $x$ can have equal languages. (Both are undecidable, but need direct proofs.) "$L(M)$ is recognizable" is trivial — true for every $M$ — so that language is decidable.`
    },
    {
      type: 'tf',
      q: 'HALT = {⟨M, w⟩ : M halts on w} is recognizable.',
      answer: true,
      explain: 'Simulate M on w (with a universal TM) and accept if the simulation halts. If M loops, the recognizer loops too — which is allowed for a recognizer.'
    },
    {
      type: 'tf',
      q: 'The complement of HALT is recognizable.',
      answer: false,
      explain: 'If both HALT and its complement were recognizable, HALT would be decidable (run both recognizers in parallel). Since HALT is recognizable but undecidable, its complement cannot be recognizable.'
    },
    {
      type: 'mc',
      q: 'Which of these languages is decidable?',
      choices: [
        String.raw`$\{\langle M\rangle : M \text{ halts on } \varepsilon\}$`,
        String.raw`$\{\langle M\rangle : M \text{ halts on } \varepsilon \text{ within } 374 \text{ steps}\}$`,
        String.raw`$\{\langle M\rangle : L(M) = \Sigma^*\}$`,
        String.raw`$\{\langle M_1, M_2\rangle : L(M_1) = L(M_2)\}$`
      ],
      answer: 1,
      explain: 'Simulate M on ε for at most 374 steps and check whether it has halted; this always terminates. The other three are undecidable: halting on ε (reduce from HALT with M\'(x) = run M on w), accepting everything (reduction template), and equivalence (compare with a machine accepting everything).'
    },
    {
      type: 'tf',
      q: 'EMPTY = {⟨M⟩ : L(M) = ∅} is recognizable.',
      answer: false,
      explain: 'Its complement NONEMPTY is recognizable by dovetailing (run M on more and more strings for more and more steps; accept if anything is accepted). EMPTY is undecidable (Rice), so it cannot also be recognizable. EMPTY is co-recognizable.'
    },
    {
      type: 'tf',
      q: 'The union of two recognizable languages is recognizable.',
      answer: true,
      explain: 'Run recognizers M1 and M2 in parallel, alternating single steps, and accept as soon as either accepts. Running M1 to completion first would be wrong: M1 might loop on a string that M2 accepts.'
    },
    {
      type: 'tf',
      q: 'The complement of every recognizable language is recognizable.',
      answer: false,
      explain: 'HALT is recognizable but its complement is not. Swapping accept and reject states fails because strings on which the recognizer loops still loop. (Decidable languages ARE closed under complement.)'
    },
    {
      type: 'mc',
      q: String.raw`In the reduction from HALT to ACCEPTALL, what does $DecideHalt(\langle M, w\rangle)$ do with the machine $M'$ ("on input $x$: run $M$ on $w$, then accept")?`,
      choices: [
        String.raw`Runs $M'$ on every input $x$ to see whether it accepts`,
        String.raw`Runs $M'$ on $w$`,
        String.raw`Writes down the encoding $\langle M'\rangle$ and passes it to $DecideAcceptAll$, without running $M'$`,
        String.raw`Runs $M$ on $w$ first, then passes $\langle M'\rangle$ to $DecideAcceptAll$`
      ],
      answer: 2,
      explain: String.raw`Constructing $\langle M'\rangle$ from $\langle M, w\rangle$ is a simple, always-terminating text transformation. Running $M'$ or $M$ might loop forever, which would make $DecideHalt$ not a decider. All the "work" is done by the hypothetical black box.`
    },
    {
      type: 'tf',
      q: 'Let L = {1} if the Goldbach conjecture is true and L = ∅ otherwise. Then L is decidable.',
      answer: true,
      explain: 'Either way L is finite, and every finite language is decidable. One of two simple machines (accept exactly "1", or reject everything) decides L; we just do not know which. Decidability asks whether a decider EXISTS, not whether we can find it.'
    },
    {
      type: 'mc',
      q: String.raw`What is the status of $\{\langle M\rangle : M \text{ does not accept } \langle M\rangle\}$?`,
      choices: ['Decidable', 'Recognizable but not decidable', 'Not recognizable', 'Regular'],
      answer: 2,
      explain: String.raw`If $R$ recognized it, then $\langle R\rangle$ would be in the language iff $R$ does not accept $\langle R\rangle$ iff $\langle R\rangle \notin L(R)$ — a contradiction. (Its complement, $\{\langle M\rangle : M \text{ accepts } \langle M\rangle\}$, is recognizable by simulation.)`
    },
    {
      type: 'tf',
      q: 'There are uncountably many languages over {0,1}, but only countably many Turing machines.',
      answer: true,
      explain: 'Each TM has a finite encoding, and the set of finite strings is countable. The set of languages is the power set of the countably infinite set {0,1}*, which is uncountable by Cantor\'s diagonal argument. So most languages are not recognizable.'
    },
    {
      type: 'tf',
      q: 'Every decidable language reduces to HALT.',
      answer: true,
      explain: 'A reduction may ignore its black box entirely: just run the decider. In fact every RECOGNIZABLE language reduces to HALT (make the recognizer loop instead of rejecting, then ask whether it halts). That is why reducing your problem TO HALT proves nothing about undecidability.'
    },
    {
      type: 'mc',
      q: String.raw`Which of these is **decidable**?`,
      choices: [
        String.raw`$\{\langle M\rangle : M \text{ moves its head left at some point on input } \varepsilon\}$`,
        String.raw`$\{\langle M\rangle : M \text{ writes the symbol } \star \text{ at some point on input } \varepsilon\}$`,
        String.raw`$\{\langle M\rangle : M \text{ halts on input } \varepsilon\}$`,
        String.raw`$\{\langle M\rangle : M \text{ enters state } q_7 \text{ on input } \varepsilon\}$`
      ],
      answer: 0,
      explain: String.raw`A machine that only moves right on a blank tape reads only blanks, so its next state depends only on its current state; within $|Q|$ steps a state repeats and it is stuck moving right forever. Simulate $|Q| + 1$ steps. The other three are undecidable by reductions from HALT (write $\star$ / enter a special state / halt only after the simulation of $M$ on $w$ finishes).`
    },
    {
      type: 'tf',
      q: 'Rice\'s theorem shows that {⟨M⟩ : M halts on every input} is undecidable.',
      answer: false,
      explain: 'The language is undecidable, but not by Rice: halting is not a property of L(M). "Reject everything immediately" and "loop on everything" both have language ∅, yet only the first halts on every input. You need a direct reduction from HALT.'
    },
    {
      type: 'tf',
      q: 'Rice\'s theorem applies to {⟨M⟩ : L(M) is decidable}, so that language is undecidable.',
      answer: true,
      explain: 'Membership depends only on L(M), and the property is non-trivial: the machine that rejects everything has a decidable language (∅), while a recognizer for HALT has an undecidable language. The trap is to call it "trivial" — it would be trivial only if every recognizable language were decidable.'
    },
    {
      type: 'mc',
      q: String.raw`To prove $B = \{\langle M\rangle : L(M) \text{ is regular}\}$ undecidable, why does the standard $M'$ ("run $M$ on $w$; accept") fail?`,
      choices: [
        String.raw`Because $M'$ might loop`,
        String.raw`Because both possible languages, $\Sigma^*$ and $\emptyset$, are regular, so $DecideB$ answers "yes" either way`,
        String.raw`Because regular languages are decidable`,
        String.raw`It does not fail`
      ],
      answer: 1,
      explain: String.raw`A correct reduction needs $\langle M'\rangle \in B$ in one case and $\notin B$ in the other. Fix: accept $\{0^n1^n\}$ unconditionally before running $M$ on $w$, so the "loops" case has the non-regular language $\{0^n1^n\}$. $M'$ looping is fine — $DecideHalt$ never runs it.`
    },
    {
      type: 'tf',
      q: 'If A reduces to B by a computable map f (x ∈ A ⟺ f(x) ∈ B) and B is recognizable, then A is recognizable.',
      answer: true,
      explain: 'Recognize A by computing f(x) and running B\'s recognizer on it. This is the tool for NON-recognizability: map the complement of HALT (not recognizable) into a language to show that language is not recognizable.'
    },
    {
      type: 'mc',
      q: String.raw`What is the status of $\mathrm{NONEMPTY} = \{\langle M\rangle : L(M) \ne \emptyset\}$?`,
      choices: ['Decidable', 'Recognizable but not co-recognizable', 'Co-recognizable but not recognizable', 'Neither'],
      answer: 1,
      explain: 'Recognizable by dovetailing (run M on more and more strings for more and more steps; accept on the first acceptance). Undecidable by Rice. An undecidable recognizable language cannot be co-recognizable.'
    },
    {
      type: 'mc',
      q: String.raw`What is the status of $\{\langle M\rangle : L(M) \text{ is infinite}\}$?`,
      choices: ['Decidable', 'Recognizable only', 'Co-recognizable only', 'Neither recognizable nor co-recognizable'],
      answer: 3,
      explain: String.raw`HALT maps to it via the standard $M'$ ($\Sigma^*$ vs. $\emptyset$), so it is not co-recognizable. $\overline{\mathrm{HALT}}$ maps to it via "$M'(x)$: simulate $M$ on $w$ for $|x|$ steps; reject if it halted, else accept" (finite vs. $\Sigma^*$), so it is not recognizable.`
    },
    {
      type: 'tf',
      q: 'The language {⟨M⟩ : M halts on every input within 374 steps} is undecidable because it quantifies over infinitely many inputs.',
      answer: false,
      explain: 'It is decidable. In 374 steps M reads at most the first 374 input cells, so every input behaves like its prefix of length at most 374 during that time. Check the finitely many inputs of length ≤ 374, simulating 374 steps each.'
    },
    {
      type: 'tf',
      q: String.raw`In a reduction proof, $DecideHalt(\langle M, w\rangle)$ is allowed to construct a machine $M'$ that loops forever on some inputs.`,
      answer: true,
      explain: String.raw`$M'$ is only *written down* and handed to the black box; it is never run by $DecideHalt$. In fact the standard $M'$ loops on every input when $M$ does not halt on $w$ — that is the point. What must always halt is $DecideHalt$ itself.`
    },
    {
      type: 'multi',
      q: 'Which languages are co-recognizable but NOT recognizable? (select all that apply)',
      choices: [
        String.raw`$\{\langle M\rangle : L(M) = \emptyset\}$`,
        String.raw`$\{\langle M, w\rangle : M \text{ does not halt on } w\}$`,
        String.raw`$\{\langle M\rangle : M \text{ accepts } 0\}$`,
        String.raw`$\{\langle M_1, M_2\rangle : L(M_1) \cap L(M_2) = \emptyset\}$`,
        String.raw`$\{\langle M\rangle : L(M) = \Sigma^*\}$`
      ],
      answer: [0, 1, 3],
      explain: String.raw`EMPTY, $\overline{\mathrm{HALT}}$ and DISJOINT are complements of recognizable undecidable languages (NONEMPTY, HALT, COMMON). "Accepts 0" is recognizable (simulate). ACCEPTALL is neither recognizable nor co-recognizable.`
    },
    {
      type: 'tf',
      q: String.raw`$\{\langle M\rangle : M \text{ has a state with no incoming transitions}\}$ is undecidable by Rice's theorem.`,
      answer: false,
      explain: 'It is a syntactic property of the transition table (inspect the encoding), so it is decidable and Rice does not apply. Contrast with "M has a state that is never entered on any input", which is about behavior and is undecidable.'
    },
    {
      type: 'mc',
      q: String.raw`In the proof that HALT is undecidable, the machine $D(\langle M\rangle)$ does the opposite of what $H(\langle M, \langle M\rangle\rangle)$ predicts. Where does the proof use that $H$ is a **decider** (always halts)?`,
      choices: [
        String.raw`To know that $\langle D\rangle$ exists`,
        String.raw`To know that $D$ always reaches the step where it branches on $H$'s answer`,
        String.raw`To know that $D$ halts on every input`,
        'It is never used'
      ],
      answer: 1,
      explain: String.raw`If $H$ could loop, $D$ could loop "for free" without doing the opposite of anything, and running $D$ on $\langle D\rangle$ would give no contradiction. (Indeed a recognizer for HALT exists.) $D$ itself does NOT halt on every input — it deliberately loops in one branch.`
    },
    {
      type: 'tf',
      q: 'If L is undecidable, then its complement is undecidable.',
      answer: true,
      explain: 'Decidable languages are closed under complement: a decider for the complement, with accept/reject swapped, would decide L. (Recognizability is different: HALT is recognizable while its complement is not.)'
    },
    {
      type: 'mc',
      q: String.raw`You must show $B = \{\langle M\rangle : |L(M)| = 2\}$ is undecidable by reduction from HALT. Which $M'$ works?`,
      choices: [
        String.raw`$M'(x)$: run $M$ on $w$; accept`,
        String.raw`$M'(x)$: run $M$ on $w$; accept iff $x \in \{0, 1\}$`,
        String.raw`$M'(x)$: if $x \in \{0,1\}$ accept; else reject`,
        String.raw`$M'(x)$: accept iff $x \in \{0, 1\}$; then run $M$ on $w$`
      ],
      answer: 1,
      explain: String.raw`Choice 2 gives $L(M') = \{0, 1\}$ (size 2) if $M$ halts on $w$, and $\emptyset$ (size 0) otherwise. Choice 1 gives $\Sigma^*$ or $\emptyset$ — neither has size 2. Choice 3 does not depend on $M$ at all. Choice 4 decides before running $M$, so the simulation is irrelevant.`
    }
  ],
  flashcards: [
    { front: 'SELFREJECT', back: String.raw`$\{\langle M\rangle : M \text{ rejects } \langle M\rangle\}$. Undecidable: a decider $SR$ run on $\langle SR\rangle$ accepts iff it rejects.` },
    { front: 'HALT', back: String.raw`$\{\langle M, w\rangle : M \text{ halts on } w\}$. Recognizable, undecidable; its complement is not recognizable.` },
    { front: 'Reduction direction for undecidability', back: 'Assume a decider for the NEW problem B; use it to decide HALT (a known undecidable problem). Contradiction, so B is undecidable.' },
    { front: 'The universal M\' trick', back: String.raw`$M'(x)$: run $M$ on $w$; accept. Then $L(M') = \Sigma^*$ if $M$ halts on $w$, else $\emptyset$.` },
    { front: 'Three things every reduction proof must contain', back: String.raw`(1) The algorithm (build $\langle M'\rangle$, call $DecideB$), never running $M'$. (2) Proof: $M$ halts on $w$ $\Rightarrow$ $\langle M'\rangle \in B$. (3) Proof: $M$ doesn't halt $\Rightarrow$ $\langle M'\rangle \notin B$.` },
    { front: 'Rice\'s theorem', back: String.raw`If $\mathcal{L}$ is a set of languages with some TM $Y$, $L(Y) \in \mathcal{L}$, and some TM $N$, $L(N) \notin \mathcal{L}$, then $\{\langle M\rangle : L(M) \in \mathcal{L}\}$ is undecidable.` },
    { front: 'When Rice does NOT apply', back: 'Properties of the code (states, transitions), bounded running time, halting (vs accepting), self-reference (M accepts ⟨M⟩), trivial properties, and non-TM models (DFAs, CFGs).' },
    { front: 'Decidable iff ...', back: 'Recognizable AND co-recognizable.' },
    { front: 'Dovetailing', back: 'For t = 1, 2, 3, ...: run M for t steps on each of the first t inputs. Used to recognize NONEMPTY or a union of recognizable languages without getting stuck on one looping run.' },
    { front: 'EMPTY = {⟨M⟩ : L(M) = ∅}', back: 'Undecidable (Rice); co-recognizable (NONEMPTY is recognizable by dovetailing); not recognizable.' },
    { front: 'EQ = {⟨M1, M2⟩ : L(M1) = L(M2)}', back: String.raw`Undecidable: $DecideHalt$ asks $DecideEq(\langle M', M_{\mathrm{all}}\rangle)$. Neither recognizable nor co-recognizable.` },
    { front: 'Closure of recognizable languages', back: 'Union (parallel), intersection, concatenation, star: yes. Complement: NO.' },
    { front: 'Why are some languages unrecognizable (counting)?', back: 'Countably many TMs, uncountably many languages. Diagonal language D = {w_i : M_i does not accept w_i} differs from every L(M_i).' },
    { front: 'Reduction for "L(M) is regular"', back: String.raw`$M'(x)$: if $x = 0^n1^n$ accept; else run $M$ on $w$ and accept. Halts $\Rightarrow$ $\Sigma^*$ (regular); loops $\Rightarrow$ $0^n1^n$ (not regular).` },
    { front: 'Mapping reduction and recognizability', back: String.raw`If $x \in A \iff f(x) \in B$ for computable $f$: $B$ recognizable $\Rightarrow$ $A$ recognizable. Map $\overline{\mathrm{HALT}}$ into $B$ to show $B$ is NOT recognizable; map HALT into $B$ to show $B$ is NOT co-recognizable.` },
    { front: String.raw`$M'$ that makes $L(M')$ finite iff $M$ halts on $w$`, back: String.raw`$M'(x)$: simulate $M$ on $w$ for $|x|$ steps; if it halted, reject, else accept. Halts after $t$ steps $\Rightarrow$ $\{x : |x| < t\}$; never halts $\Rightarrow$ $\Sigma^*$.` },
    { front: 'Bounded-step questions that ARE decidable', back: 'Halts on w within k steps; halts within |⟨M⟩|² steps; halts on EVERY input within 374 steps (only the first 374 input cells can be read); moves left on input w; writes any non-blank on a blank tape.' },
    { front: 'Design M\' backwards (choose L_yes and L_no)', back: 'Pick a language with the property and one without. "Run M on w first" makes L_no = ∅. If ∅ has the property, accept a fixed "bad" set unconditionally BEFORE running M on w (e.g. 0^n1^n for "regular", {01} for "closed under reversal").' },
    { front: 'Status of INF / FINITE / ACCEPTALL / EQ', back: 'Neither recognizable nor co-recognizable.' },
    { front: 'Status of EMPTY, DISJOINT, co-HALT', back: 'Co-recognizable, not recognizable (complements of recognizable undecidable languages).' },
    { front: 'Direct proof that HALT is undecidable', back: String.raw`Given decider $H$, build $D(\langle M\rangle)$: if $H(\langle M, \langle M\rangle\rangle)$ accepts, loop; else halt. $D$ on $\langle D\rangle$ halts iff it doesn't.` },
    { front: 'Proof of Rice (case ∅ ∉ 𝓛)', back: String.raw`$M'(x)$: run $M$ on $w$; then run $Y$ on $x$ and copy its answer. Halts $\Rightarrow$ $L(M') = L(Y) \in \mathcal{L}$; loops $\Rightarrow$ $\emptyset \notin \mathcal{L}$. If $\emptyset \in \mathcal{L}$, use $N$ and flip the answer.` },
    { front: 'Rice is NOT trivial for "L(M) is decidable"', back: String.raw`$Y$ rejects everything ($\emptyset$ decidable); $N$ recognizes HALT (undecidable). So $\{\langle M\rangle : L(M) \text{ decidable}\}$ is undecidable.` },
    { front: 'Showing "exactly k strings" undecidable', back: String.raw`$M'(x)$: run $M$ on $w$; accept iff $x$ is one of $k$ fixed strings. Halts $\Rightarrow$ size $k$; loops $\Rightarrow$ size 0.` }
  ],
  problems: [
    {
      id: 'undecidable-selfreject',
      type: 'written',
      title: 'Diagonalization: SELFREJECT and its cousin',
      difficulty: 2,
      prompt: String.raw`(a) Prove that $\mathrm{SELFREJECT} = \{\langle M\rangle : M \text{ rejects } \langle M\rangle\}$ is undecidable.

(b) Prove that $\mathrm{NOTSELFACCEPT} = \{\langle M\rangle : M \text{ does not accept } \langle M\rangle\}$ is not even recognizable.`,
      rubric: [
        '(a) Assumes a decider SR and considers SR on input ⟨SR⟩',
        '(a) Uses that SR is a decider (halts) to split into exactly two cases',
        '(a) Derives a contradiction in both cases from the definition of SELFREJECT',
        '(b) Assumes a recognizer R and considers ⟨R⟩',
        '(b) Correct chain: ⟨R⟩ ∈ L ⟺ R does not accept ⟨R⟩ ⟺ ⟨R⟩ ∉ L(R) = L'
      ],
      hints: [
        'Feed the hypothetical machine its own encoding.',
        'For (b), you cannot assume R halts; but you do not need to: "does not accept" covers both rejecting and looping.'
      ],
      solution: String.raw`**(a)** Suppose for contradiction that a TM $SR$ decides SELFREJECT. Consider running $SR$ on the input $\langle SR\rangle$. Because $SR$ is a decider, it halts and either accepts or rejects.

- If $SR$ accepts $\langle SR\rangle$, then (since $SR$ decides SELFREJECT) $\langle SR\rangle \in \mathrm{SELFREJECT}$, i.e. $SR$ rejects $\langle SR\rangle$. Contradiction.
- If $SR$ rejects $\langle SR\rangle$, then by definition $\langle SR\rangle \in \mathrm{SELFREJECT}$, so $SR$ must accept $\langle SR\rangle$. Contradiction.

So no TM decides SELFREJECT. $\blacksquare$

**(b)** Suppose for contradiction that a TM $R$ recognizes NOTSELFACCEPT, i.e. $L(R) = \mathrm{NOTSELFACCEPT}$. Then
$$\langle R\rangle \in \mathrm{NOTSELFACCEPT} \iff R \text{ does not accept } \langle R\rangle \iff \langle R\rangle \notin L(R) = \mathrm{NOTSELFACCEPT}.$$
A string cannot be both in and not in a set, so no such $R$ exists. (Note that this argument never needed $R$ to halt.) $\blacksquare$`
    },
    {
      id: 'undecidable-accept-eps',
      type: 'written',
      title: 'Does M accept the empty string?',
      difficulty: 2,
      prompt: String.raw`Prove that $\mathrm{ACCEPT}\varepsilon = \{\langle M\rangle : M \text{ accepts } \varepsilon\}$ is undecidable by a reduction from HALT. Use the standard template (do not use Rice's theorem).`,
      rubric: [
        'Assumes a decider DecideAcceptEps for contradiction',
        'Describes DecideHalt(⟨M, w⟩) that constructs (not runs) a machine M\' and calls DecideAcceptEps(⟨M\'⟩)',
        'Correct M\' (e.g. ignore input, run M on w, accept)',
        'Proves: M halts on w ⇒ M\' accepts ε',
        'Proves: M does not halt on w ⇒ M\' does not accept ε',
        'Concludes with the contradiction'
      ],
      hints: [
        String.raw`Build $M'$ whose behavior on $\varepsilon$ is "accept iff $M$ halts on $w$".`,
        String.raw`$M'$ may ignore its own input entirely.`
      ],
      solution: String.raw`Suppose for contradiction that there is a TM $DecideAcceptEps$ that decides $\mathrm{ACCEPT}\varepsilon$. Then the following algorithm decides HALT:

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    if DecideAcceptEps(⟨M'⟩)
        return TRUE
    else
        return FALSE
~~~

$DecideHalt$ always halts: constructing $\langle M'\rangle$ from $\langle M, w\rangle$ is a finite mechanical transformation (it never runs $M'$ or $M$), and $DecideAcceptEps$ is a decider.

**Correctness.**
- Suppose $M$ halts on $w$. Then on input $\varepsilon$ (indeed on every input), $M'$ finishes the simulation and accepts. So $\langle M'\rangle \in \mathrm{ACCEPT}\varepsilon$, $DecideAcceptEps$ accepts, and $DecideHalt$ accepts.
- Suppose $M$ does not halt on $w$. Then on input $\varepsilon$, $M'$ runs forever, so it does not accept $\varepsilon$. So $\langle M'\rangle \notin \mathrm{ACCEPT}\varepsilon$, $DecideAcceptEps$ rejects, and $DecideHalt$ rejects.

Thus $DecideHalt$ decides HALT, which is impossible. Therefore $\mathrm{ACCEPT}\varepsilon$ is undecidable. $\blacksquare$`
    },
    {
      id: 'undecidable-accept-all',
      type: 'written',
      title: 'Does M accept everything?',
      difficulty: 2,
      prompt: String.raw`Prove that $\mathrm{ACCEPTALL} = \{\langle M\rangle : L(M) = \Sigma^*\}$ is undecidable by a reduction from HALT, and then give a second proof using Rice's theorem.`,
      rubric: [
        'Reduction: assumes DecideAcceptAll, constructs M\' from ⟨M, w⟩ without running it',
        'Reduction: M halts on w ⇒ L(M\') = Σ*',
        'Reduction: M does not halt on w ⇒ L(M\') = ∅ ≠ Σ*',
        'Rice: identifies the family {Σ*} (semantic property)',
        'Rice: explicit Y with L(Y) = Σ* and N with L(N) ≠ Σ*'
      ],
      hints: [String.raw`Same $M'$ as for $\mathrm{ACCEPT}\varepsilon$; now argue about all inputs.`],
      solution: String.raw`**Reduction.** Suppose $DecideAcceptAll$ decides ACCEPTALL. Then:

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    return DecideAcceptAll(⟨M'⟩)
~~~

- If $M$ halts on $w$, then $M'$ accepts every input $x$, so $L(M') = \Sigma^*$ and $DecideHalt$ accepts.
- If $M$ does not halt on $w$, then $M'$ diverges on every input, so $L(M') = \emptyset \ne \Sigma^*$ and $DecideHalt$ rejects.

$DecideHalt$ halts on every input (it only constructs $\langle M'\rangle$ and calls a decider) and decides HALT, a contradiction. Hence ACCEPTALL is undecidable. $\blacksquare$

**Rice.** $\mathrm{ACCEPTALL} = \{\langle M\rangle : L(M) \in \mathcal{L}\}$ for the family $\mathcal{L} = \{\Sigma^*\}$, so membership depends only on $L(M)$. Let $Y$ accept every input immediately: $L(Y) = \Sigma^* \in \mathcal{L}$. Let $N$ reject every input immediately: $L(N) = \emptyset \notin \mathcal{L}$. By Rice's theorem, ACCEPTALL is undecidable. $\blacksquare$`
    },
    {
      id: 'undecidable-palindrome',
      type: 'written',
      title: 'Does M accept a palindrome?',
      difficulty: 2,
      prompt: String.raw`Prove that $\mathrm{ACCEPTPAL} = \{\langle M\rangle : M \text{ accepts at least one palindrome}\}$ is undecidable, using a direct reduction from HALT.`,
      rubric: [
        'Assumes DecideAcceptPal exists; builds DecideHalt',
        'Correct construction of M\' from ⟨M, w⟩, not run by the decider',
        'M halts on w ⇒ M\' accepts some palindrome (e.g. ε or every string)',
        'M does not halt on w ⇒ M\' accepts no strings at all, hence no palindrome',
        'Conclusion'
      ],
      hints: ['If M halts on w, make M\' accept everything (including palindromes). Otherwise M\' should accept nothing.'],
      solution: String.raw`Suppose for contradiction that $DecideAcceptPal$ decides ACCEPTPAL.

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    return DecideAcceptPal(⟨M'⟩)
~~~

- If $M$ halts on $w$, then $M'$ accepts every string, in particular the palindrome $\varepsilon$; so $\langle M'\rangle \in \mathrm{ACCEPTPAL}$ and $DecideHalt$ accepts.
- If $M$ does not halt on $w$, then $M'$ runs forever on every input and accepts nothing; in particular it accepts no palindrome, so $\langle M'\rangle \notin \mathrm{ACCEPTPAL}$ and $DecideHalt$ rejects.

So $DecideHalt$ decides HALT (and always halts, since it never runs $M'$), a contradiction. Hence ACCEPTPAL is undecidable. $\blacksquare$

(Rice also applies: the family is $\{L : L \cap \mathrm{PAL} \ne \emptyset\}$, with $Y$ = accept everything and $N$ = reject everything.)`
    },
    {
      id: 'undecidable-equiv',
      type: 'written',
      title: 'Equivalence of two Turing machines',
      difficulty: 2,
      prompt: String.raw`Prove that $\mathrm{EQ} = \{\langle M_1, M_2\rangle : L(M_1) = L(M_2)\}$ is undecidable.`,
      rubric: [
        'Assumes DecideEq and builds DecideHalt (or reduces from another known undecidable language such as ACCEPTALL or EMPTY)',
        'Fixes a concrete comparison machine (e.g. M_all accepting everything, or M_none)',
        'Both directions of correctness',
        'Conclusion'
      ],
      hints: [String.raw`Compare $M'$ (from the standard construction) with a machine whose language is $\Sigma^*$.`],
      solution: String.raw`Suppose for contradiction that $DecideEq$ decides EQ. Let $M_{\mathrm{all}}$ be the TM that immediately accepts every input, so $L(M_{\mathrm{all}}) = \Sigma^*$.

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    return DecideEq(⟨M', M_all⟩)
~~~

- If $M$ halts on $w$, then $L(M') = \Sigma^* = L(M_{\mathrm{all}})$, so $DecideEq$ accepts and $DecideHalt$ accepts.
- If $M$ does not halt on $w$, then $L(M') = \emptyset \ne \Sigma^* = L(M_{\mathrm{all}})$, so $DecideEq$ rejects and $DecideHalt$ rejects.

$DecideHalt$ halts on all inputs and decides HALT — impossible. Hence EQ is undecidable. $\blacksquare$

(Equivalently: $DecideAcceptAll(\langle M\rangle) = DecideEq(\langle M, M_{\mathrm{all}}\rangle)$ reduces ACCEPTALL to EQ. Rice's theorem does not apply directly, because the input is a *pair* of machines.)`
    },
    {
      id: 'undecidable-halt-all',
      type: 'written',
      title: 'Does M halt on every input?',
      difficulty: 3,
      prompt: String.raw`Prove that $\mathrm{HALTALL} = \{\langle M\rangle : M \text{ halts on every input}\}$ is undecidable. Explain why Rice's theorem cannot be applied directly.`,
      rubric: [
        'Correct reduction from HALT with a precise M\' and DecideHalt',
        'M halts on w ⇒ M\' halts on all inputs',
        'M does not halt on w ⇒ M\' halts on no input (in particular not all)',
        'Explains HALTALL is not a property of L(M): give two machines with the same language, one in HALTALL and one not'
      ],
      hints: [
        'Use the same M\' as usual; now track halting rather than accepting.',
        'For Rice: compare "reject everything immediately" with "loop forever on every input".'
      ],
      solution: String.raw`Suppose for contradiction that $DecideHaltAll$ decides HALTALL.

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    return DecideHaltAll(⟨M'⟩)
~~~

- If $M$ halts on $w$, then on every input $x$, $M'$ finishes simulating $M$ on $w$ and halts (accepting). So $\langle M'\rangle \in \mathrm{HALTALL}$ and $DecideHalt$ accepts.
- If $M$ does not halt on $w$, then $M'$ runs forever on every input; in particular it does not halt on all inputs. So $\langle M'\rangle \notin \mathrm{HALTALL}$ and $DecideHalt$ rejects.

So $DecideHalt$ decides HALT, a contradiction; HALTALL is undecidable. $\blacksquare$

**Why not Rice.** HALTALL is not of the form $\{\langle M\rangle : L(M) \in \mathcal{L}\}$. Let $M_1$ reject every input immediately and let $M_2$ loop forever on every input. Then $L(M_1) = L(M_2) = \emptyset$, but $\langle M_1\rangle \in \mathrm{HALTALL}$ and $\langle M_2\rangle \notin \mathrm{HALTALL}$. Since membership is not determined by the language, the property is not semantic and Rice's theorem (in the form about $L(M)$) does not apply.`
    },
    {
      id: 'undecidable-regular',
      type: 'written',
      title: 'Is L(M) regular?',
      difficulty: 3,
      prompt: String.raw`Let $\mathrm{REGULARTM} = \{\langle M\rangle : L(M) \text{ is regular}\}$.

(a) Prove REGULARTM is undecidable using Rice's theorem.

(b) Prove it again with a direct reduction from HALT. (Hint: the usual $M'$ with languages $\Sigma^*$ and $\emptyset$ does not work. Why?)`,
      rubric: [
        '(a) Identifies the family of regular languages; semantic',
        '(a) Y with regular language (e.g. ∅ or Σ*) and N with nonregular language (e.g. a TM deciding 0^n1^n)',
        '(b) Explains why Σ*/∅ fails (both regular)',
        '(b) M\' accepts 0^n1^n unconditionally and everything else iff M halts on w',
        '(b) Both directions: halts ⇒ L(M\') = Σ* regular; does not halt ⇒ L(M\') = {0^n1^n} not regular'
      ],
      hints: [
        String.raw`Make $L(M')$ a non-regular language when $M$ loops, and $\Sigma^*$ when it halts.`,
        String.raw`$M'(x)$: if $x \in \{0^n1^n\}$, accept immediately; otherwise ...`
      ],
      solution: String.raw`**(a)** REGULARTM $= \{\langle M\rangle : L(M) \in \mathcal{L}\}$ where $\mathcal{L}$ is the family of regular languages; membership depends only on $L(M)$. Let $Y$ be a TM that rejects everything: $L(Y) = \emptyset$ is regular. Let $N$ be a TM that decides $\{0^n1^n : n \ge 0\}$ (cross off matching symbols): $L(N)$ is not regular. Both exist, so by Rice's theorem REGULARTM is undecidable. $\blacksquare$

**(b)** The usual $M'$ has $L(M') \in \{\Sigma^*, \emptyset\}$, and both are regular — a REGULARTM decider would accept in both cases and tell us nothing. Instead, suppose $DecideRegular$ decides REGULARTM and consider:

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            if x = 0^n 1^n for some n ≥ 0:
                return TRUE
            run M on input w
            return TRUE
    return DecideRegular(⟨M'⟩)
~~~

(The test "$x = 0^n1^n$" is a terminating subroutine.)

- If $M$ halts on $w$: strings $0^n1^n$ are accepted by the first test, and every other string is accepted after the simulation ends. So $L(M') = \Sigma^*$, which is regular; $DecideHalt$ accepts.
- If $M$ does not halt on $w$: strings $0^n1^n$ are accepted, and every other string causes $M'$ to run forever. So $L(M') = \{0^n1^n : n \ge 0\}$, which is not regular; $DecideHalt$ rejects.

Thus $DecideHalt$ decides HALT (it never runs $M'$), a contradiction. Hence REGULARTM is undecidable. $\blacksquare$`
    },
    {
      id: 'undecidable-rice-apply',
      type: 'written',
      title: 'Does Rice\'s theorem apply?',
      difficulty: 2,
      prompt: String.raw`For each language, say whether Rice's theorem applies. If it does, give the witnesses $Y$ and $N$. If it does not, explain why not and say whether the language is decidable (with a one-line justification).

1. $\{\langle M\rangle : L(M) \text{ is finite}\}$
2. $\{\langle M\rangle : M \text{ has at most } 374 \text{ states}\}$
3. $\{\langle M\rangle : M \text{ halts on input } \varepsilon\}$
4. $\{\langle M\rangle : 374 \in L(M)\}$ (here 374 is a string over $\{0,\ldots,9\}$)
5. $\{\langle M\rangle : L(M) \text{ is recognizable}\}$
6. $\{\langle M\rangle : M \text{ accepts } \langle M\rangle\}$
7. $\{\langle M\rangle : L(M) \text{ is context-free}\}$`,
      rubric: [
        'Items 1, 4, 7: Rice applies, with valid Y and N for each',
        'Item 2: not semantic; decidable by inspecting the encoding',
        'Item 3: not semantic (rejecting vs looping on ε); undecidable via reduction from HALT',
        'Item 5: trivial property (every L(M) is recognizable); decidable',
        'Item 6: not semantic (depends on ⟨M⟩ itself); undecidable by diagonalization/reduction'
      ],
      hints: [
        'Ask two questions: does membership depend only on L(M)? Is the property true for some but not all recognizable languages?',
        'For halting questions, find two machines with the same language that differ on the property.'
      ],
      solution: String.raw`1. **Applies.** Family: finite languages. $Y$ = reject everything ($L(Y) = \emptyset$, finite). $N$ = accept everything ($\Sigma^*$, infinite). Undecidable.
2. **Does not apply** — not semantic: padding a machine with unreachable states keeps $L(M)$ but changes the state count. **Decidable**: read $\langle M\rangle$ and count the states.
3. **Does not apply** — not semantic: "reject $\varepsilon$ immediately" and "loop forever on every input" both have language $\emptyset$, but only the first halts on $\varepsilon$. It is **undecidable**, by a direct reduction from HALT ($M'(x)$: run $M$ on $w$, accept; then $M'$ halts on $\varepsilon$ iff $M$ halts on $w$).
4. **Applies.** Family: languages containing 374. $Y$ = accept everything, $N$ = reject everything. Undecidable.
5. **Does not apply** — the property is trivial: $L(M)$ is recognizable for every TM $M$ (namely by $M$). The language is the set of all valid TM encodings, which is **decidable** (check the syntax).
6. **Does not apply** — not semantic: whether $\langle M\rangle \in L(M)$ depends on $M$'s own encoding. For instance, a machine $M_1$ that accepts exactly the string $\langle M_1\rangle$ (which exists by the recursion theorem) and a different machine $M_2$ with the same language $L(M_2) = \{\langle M_1\rangle\}$: $\langle M_1\rangle$ is in the language but $\langle M_2\rangle$ is not. It is **undecidable**: from a decider $D$ for it, $DecideHalt(\langle M, w\rangle)$ can build $M'(x)$: "run $M$ on $w$; accept", and return $D(\langle M'\rangle)$ — $M'$ accepts every input (including $\langle M'\rangle$) iff $M$ halts on $w$.
7. **Applies.** Family: context-free languages. $Y$ = reject everything ($\emptyset$ is context-free). $N$ = a decider for $\{a^nb^nc^n\}$ (not context-free). Undecidable.`
    },
    {
      id: 'undecidable-classify',
      type: 'written',
      title: 'Decidable or undecidable?',
      difficulty: 3,
      prompt: String.raw`Classify each language as decidable or undecidable and prove your answer (a decider with a halting argument, or a reduction / Rice's theorem). Standard TMs move L or R every step.

(a) $\{\langle M, w\rangle : M \text{ halts on } w \text{ within } |w|^2 \text{ steps}\}$

(b) $\{\langle M\rangle : M \text{ moves its head left at least once when run on input } \varepsilon\}$

(c) $\{\langle M\rangle : M \text{ accepts some string of length at most } 5\}$

(d) $\{\langle M\rangle : M \text{ writes the symbol } \star \text{ on its tape at some point when run on } \varepsilon\}$, where $\star$ is a fixed symbol that may or may not be in M's tape alphabet

(e) $\{\langle D\rangle : D \text{ is a DFA and } L(D) = \Sigma^*\}$`,
      rubric: [
        '(a) Decidable: bounded simulation always halts',
        '(b) Decidable: on a blank tape moving only right, after |Q| steps a state repeats so the machine never moves left; simulate |Q|+1 steps',
        '(c) Undecidable via Rice (semantic, nontrivial witnesses)',
        '(d) Undecidable via reduction (M\' simulates M on w without writing ★, then writes ★); Rice does not apply',
        '(e) Decidable: complement the DFA and test emptiness by graph search'
      ],
      hints: [
        'For (b): if the head only ever moves right on an initially blank tape, what does the machine read?',
        'For (d): make sure the simulated M itself never writes ★ — rename that symbol in M\'s tape alphabet first.'
      ],
      solution: String.raw`**(a) Decidable.** On input $\langle M, w\rangle$, simulate $M$ on $w$ for at most $|w|^2$ steps (a universal TM can count steps). Accept if $M$ halted within the bound, reject otherwise. The simulation length is bounded, so this always halts.

**(b) Decidable.** Let $M$ have state set $Q$. On input $\varepsilon$ the tape is blank. As long as $M$ only moves right, it always reads a blank (it moves onto cells it has never visited), so its next state depends only on its current state. Within the first $|Q|$ right-moves without halting, some state must repeat; from then on the sequence of states is periodic, the head keeps reading blanks, and $M$ never moves left. So: simulate $M$ on $\varepsilon$ for at most $|Q| + 1$ steps. If it moves left during this time, accept; if it halts or completes $|Q|+1$ steps without moving left, reject. This always halts.

**(c) Undecidable** by Rice's theorem. The language is $\{\langle M\rangle : L(M) \in \mathcal{L}\}$ where $\mathcal{L} = \{L : L \text{ contains a string of length} \le 5\}$, a property of $L(M)$ only. $Y$ = accept everything ($\varepsilon \in L(Y)$), $N$ = reject everything ($L(N) = \emptyset$).

**(d) Undecidable** by reduction from HALT (Rice does not apply: this is about what $M$ writes, not about $L(M)$). Suppose $DecideWrites$ decides the language.

~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            write w on the tape and run M on w,
                where every occurrence of ★ in M's tape
                alphabet has been renamed to a fresh symbol
            write ★
            return TRUE
    return DecideWrites(⟨M'⟩)
~~~

The simulation of $M$ never writes $\star$ (renamed), and $M'$ writes $\star$ only after the simulation halts. If $M$ halts on $w$, $M'$ on $\varepsilon$ writes $\star$; if not, $M'$ never writes $\star$. So $DecideHalt$ decides HALT — contradiction.

**(e) Decidable.** Given a DFA $D$, swap accepting and non-accepting states to get a DFA for $\overline{L(D)}$ (after completing $D$ with a dead state if needed). $L(D) = \Sigma^*$ iff $\overline{L(D)} = \emptyset$ iff no accepting state of the complemented DFA is reachable from its start state — checked by BFS/DFS on the finite transition graph. Rice's theorem is about TMs and does not apply to DFAs.`
    },
    {
      id: 'undecidable-corec',
      type: 'written',
      title: 'Recognizable, co-recognizable, decidable',
      difficulty: 2,
      prompt: String.raw`(a) Prove that HALT is recognizable.

(b) Prove that if $L$ and $\overline{L}$ are both recognizable, then $L$ is decidable.

(c) Conclude that $\overline{\mathrm{HALT}}$ is not recognizable.

(d) Prove that $\mathrm{NONEMPTY} = \{\langle M\rangle : L(M) \ne \emptyset\}$ is recognizable. Why doesn't "run $M$ on $\varepsilon$, then on $0$, then on $1$, ..." work?`,
      rubric: [
        '(a) Simulation-based recognizer; accepts iff M halts on w',
        '(b) Parallel (alternating) simulation of the two recognizers; exactly one accepts; always halts',
        '(c) Combines (a), (b) and the undecidability of HALT',
        '(d) Dovetailing construction with correctness argument',
        '(d) Explains that sequential simulation can loop on an early string'
      ],
      hints: [
        'For (b), every string is in exactly one of L and its complement.',
        'For (d), in round t run M for t steps on each of the first t strings.'
      ],
      solution: String.raw`**(a)** On input $\langle M, w\rangle$, simulate $M$ on $w$ (universal TM). If the simulation halts (in either state), accept. If $M$ halts on $w$ we accept; if not, the simulation runs forever and we never accept. So the language of this machine is exactly HALT.

**(b)** Let $R_1$ recognize $L$ and $R_2$ recognize $\overline{L}$. On input $x$, simulate $R_1$ and $R_2$ on $x$ alternately, one step at a time. If $R_1$ accepts, accept; if $R_2$ accepts, reject. Every $x$ is in exactly one of $L$, $\overline{L}$, so exactly one of $R_1, R_2$ eventually accepts $x$; hence the machine always halts and answers correctly. (Rejections by $R_1$ or $R_2$ can be ignored; that machine just stops being simulated.)

**(c)** If $\overline{\mathrm{HALT}}$ were recognizable, then by (a) and (b) HALT would be decidable, contradicting the undecidability of HALT.

**(d)** On input $\langle M\rangle$: for $t = 1, 2, 3, \ldots$: for each of the first $t$ strings $w_1, \ldots, w_t$ in shortlex order, simulate $M$ on $w_i$ for $t$ steps; if any simulation accepts, accept.

If $L(M) \ne \emptyset$, some $w_i$ is accepted after some $s$ steps; in round $t = \max(i, s)$ that simulation is run long enough, so we accept. If $L(M) = \emptyset$, no simulation ever accepts and we never accept. So this recognizes NONEMPTY.

The sequential approach fails because $M$ might loop on $\varepsilon$ while accepting $0$: we would simulate $M$ on $\varepsilon$ forever and never try $0$. Dovetailing gives every string an unbounded amount of time while never committing to one forever.

(Consequently EMPTY $= \overline{\mathrm{NONEMPTY}}$ is co-recognizable; since it is undecidable by Rice, it is not recognizable.)`
    },
    {
      id: 'undecidable-len374',
      type: 'written',
      title: 'Does M accept some string of length 374?',
      difficulty: 2,
      prompt: String.raw`Let $\mathrm{L374} = \{\langle M\rangle : M \text{ accepts at least one string of length exactly } 374\}$.

(a) Prove L374 is undecidable by a direct reduction from HALT.

(b) Prove it again with Rice's theorem.

(c) Is L374 recognizable? Is it co-recognizable? Justify.`,
      rubric: [
        '(a) Assumes DecideL374; DecideHalt builds (does not run) M\' that runs M on w then accepts',
        '(a) Halts ⇒ L(M\') = Σ*, which contains a string of length 374; loops ⇒ L(M\') = ∅',
        '(b) Family {L : L contains a string of length 374}; explicit Y and N',
        '(c) Recognizable: run M on all |Σ|^374 strings of length 374 in parallel (dovetail)',
        '(c) Not co-recognizable: recognizable + undecidable'
      ],
      hints: [
        'The standard M\' (ignore x, run M on w, accept) works.',
        'For (c): there are only finitely many strings of length 374, but M may loop on some of them.'
      ],
      solution: String.raw`**(a)** Suppose $DecideL374$ decides L374.
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    return DecideL374(⟨M'⟩)
~~~
- If $M$ halts on $w$: $M'$ accepts every $x$, so $L(M') = \Sigma^*$, which contains a string of length 374; $\langle M'\rangle \in \mathrm{L374}$ and $DecideHalt$ accepts.
- If $M$ does not halt on $w$: $M'$ loops on every input, $L(M') = \emptyset$, which contains no string of length 374; $DecideHalt$ rejects.

$DecideHalt$ only constructs $\langle M'\rangle$ and calls a decider, so it halts; it decides HALT — contradiction. $\blacksquare$

**(b)** $\mathrm{L374} = \{\langle M\rangle : L(M) \in \mathcal{L}\}$ with $\mathcal{L} = \{L : L \text{ contains a string of length } 374\}$ — a property of $L(M)$ only. $Y$ = "accept every input" ($L(Y) = \Sigma^* \in \mathcal{L}$); $N$ = "reject every input" ($\emptyset \notin \mathcal{L}$). By Rice, L374 is undecidable.

**(c)** *Recognizable.* On input $\langle M\rangle$: for $t = 1, 2, 3, \ldots$, run $M$ for $t$ steps on each of the $|\Sigma|^{374}$ strings of length 374; accept as soon as one of these runs accepts. If $M$ accepts some length-374 string $x$ after $s$ steps, we accept in round $s$. Otherwise we never accept. (Running the strings one after another to completion would fail: $M$ might loop on the first one.)

*Not co-recognizable.* If it were, L374 would be both recognizable and co-recognizable, hence decidable — contradicting (a).`
    },
    {
      id: 'undecidable-exactly-one',
      type: 'written',
      title: 'Exactly one string: neither recognizable nor co-recognizable',
      difficulty: 3,
      prompt: String.raw`Let $\mathrm{ONE} = \{\langle M\rangle : |L(M)| = 1\}$.

(a) Prove ONE is undecidable by a reduction from HALT. Explain why the standard $M'$ (whose language is $\Sigma^*$ or $\emptyset$) does not work.

(b) Prove ONE is not co-recognizable.

(c) Prove ONE is not recognizable.

You may use: if there is a computable function $f$ (here: "build $\langle M'\rangle$ from $\langle M, w\rangle$") with $x \in A \iff f(x) \in B$, and $B$ is recognizable, then $A$ is recognizable.`,
      rubric: [
        '(a) Explains that neither Σ* nor ∅ has exactly one element, so the standard M\' gives no information',
        '(a) M\'(x): run M on w; accept iff x = ε. Halts ⇒ {ε}; loops ⇒ ∅. Both directions argued',
        '(b) The same map shows HALT reduces (by a mapping) to ONE, so co-HALT reduces to co-ONE; co-HALT not recognizable ⇒ ONE not co-recognizable',
        '(c) M\'(x): if x = ε accept; else run M on w, accept. Halts ⇒ Σ*; loops ⇒ {ε}. So co-HALT maps to ONE; ONE recognizable would make co-HALT recognizable',
        'Correct use of the mapping-reduction lemma (direction!)'
      ],
      hints: [
        String.raw`Make $L(M')$ have exactly one element in one case and a different size in the other.`,
        String.raw`For (c) you need a map sending "$M$ does NOT halt on $w$" to "exactly one string". Accept $\varepsilon$ unconditionally.`
      ],
      solution: String.raw`**(a)** The standard $M'$ has $L(M') \in \{\Sigma^*, \emptyset\}$, and neither has exactly one element, so $DecideOne$ would reject in both cases. Instead:
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            if x = ε: return TRUE
            else:     return FALSE
    return DecideOne(⟨M'⟩)
~~~
If $M$ halts on $w$, $M'$ accepts exactly $\varepsilon$: $L(M') = \{\varepsilon\}$, so $DecideOne$ accepts. If not, $M'$ loops on everything: $L(M') = \emptyset$, so $DecideOne$ rejects. So $DecideHalt$ decides HALT — contradiction.

**(b)** The map $f(\langle M, w\rangle) = \langle M'\rangle$ from (a) satisfies $\langle M, w\rangle \in \mathrm{HALT} \iff f(\langle M, w\rangle) \in \mathrm{ONE}$, hence also $\langle M, w\rangle \in \overline{\mathrm{HALT}} \iff f(\langle M, w\rangle) \in \overline{\mathrm{ONE}}$. If ONE were co-recognizable, $\overline{\mathrm{ONE}}$ would be recognizable, and by the lemma so would $\overline{\mathrm{HALT}}$ — but $\overline{\mathrm{HALT}}$ is not recognizable. So ONE is not co-recognizable.

**(c)** Now map **non-halting** to "exactly one":
~~~pseudo
M''(x):
    if x = ε: return TRUE
    run M on input w
    return TRUE
~~~
If $M$ does not halt on $w$: $M''$ accepts $\varepsilon$ and loops on everything else, so $L(M'') = \{\varepsilon\}$ and $\langle M''\rangle \in \mathrm{ONE}$. If $M$ halts on $w$: $L(M'') = \Sigma^*$, so $\langle M''\rangle \notin \mathrm{ONE}$. Thus $\langle M, w\rangle \in \overline{\mathrm{HALT}} \iff \langle M''\rangle \in \mathrm{ONE}$. If ONE were recognizable, the lemma would make $\overline{\mathrm{HALT}}$ recognizable — contradiction. So ONE is neither recognizable nor co-recognizable.

(Note the asymmetry: a property is typically recognizable when a *finite* amount of positive evidence proves membership. "At least one string" is recognizable; "exactly one" needs the negative fact "nothing else is accepted", which is not finitely checkable.)`
    },
    {
      id: 'undecidable-halt-bounds',
      type: 'written',
      title: 'Halting on input 0, with and without step bounds',
      difficulty: 3,
      prompt: String.raw`For each language, decide whether it is decidable, and prove your answer. "Within $k$ steps" means "after at most $k$ transitions".

(a) $\{\langle M\rangle : M \text{ halts on input } 0 \text{ within } 374 \text{ steps}\}$

(b) $\{\langle M\rangle : M \text{ halts on input } 0 \text{ after more than } 374 \text{ steps}\}$ (i.e. it halts, and takes more than 374 steps to do so)

(c) $\{\langle M\rangle : M \text{ halts on input } 0 \text{ within } |\langle M\rangle|^2 \text{ steps}\}$

(d) $\{\langle M\rangle : M \text{ halts on every input within } 374 \text{ steps}\}$

(e) $\{\langle M\rangle : M \text{ halts on input } 0\}$`,
      rubric: [
        '(a) Decidable: simulate 374 steps',
        '(b) Undecidable: M\' wastes 375+ steps, then runs M on w, then halts; both directions',
        '(c) Decidable: the bound is computed from the input; bounded simulation',
        '(d) Decidable: in 374 steps M reads only the first 374 cells, so checking all inputs of length ≤ 374 suffices (finitely many)',
        '(e) Undecidable: standard M\' and reduction from HALT; Rice does not apply (halting, not acceptance)'
      ],
      hints: [
        'A bound that is a fixed number or computable from the input makes simulation safe.',
        'For (d): which tape cells can M possibly read during its first 374 steps?',
        'For (b): build M\' that first burns a few hundred steps, so "after more than 374 steps" is automatic once it halts.'
      ],
      solution: String.raw`**(a) Decidable.** Simulate $M$ on input $0$ for at most 374 steps; accept iff it halted. Always halts.

**(b) Undecidable.** Suppose $Decide_b$ decides it.
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            move the head right 200 times and back left 200 times   (400 steps)
            run M on input w
            halt (accept)
    return Decide_b(⟨M'⟩)
~~~
(The 400-step warm-up leaves the tape unchanged; then $M'$ writes $w$ and simulates $M$.) If $M$ halts on $w$, $M'$ halts on input $0$, after more than 374 steps. If $M$ does not halt on $w$, $M'$ never halts on $0$. So $DecideHalt$ decides HALT — contradiction.

**(c) Decidable.** Compute $k = |\langle M\rangle|^2$ from the input, simulate $M$ on $0$ for at most $k$ steps, accept iff it halted. The bound depends on the input but is computed before the simulation starts, so the decider always halts.

**(d) Decidable.** During its first 374 steps the head is never more than 373 cells away from its starting cell, so $M$ reads only the first 374 cells of the input region. Hence, for any input $x$ with $|x| > 374$, the first 374 steps of $M$ on $x$ are identical to those on the prefix $x_1\cdots x_{374}$ (the cells after position 374 are never read). So: for every string $y$ with $|y| \le 374$ (finitely many), simulate $M$ on $y$ for 374 steps; accept iff all of them halted. This checks every input, because every longer input behaves like its length-374 prefix for 374 steps.

**(e) Undecidable.** Suppose $DecideHalt0$ decides it. $DecideHalt(\langle M, w\rangle)$: build $M'(x)$ = "run $M$ on $w$; accept", and return $DecideHalt0(\langle M'\rangle)$. $M'$ halts on 0 iff $M$ halts on $w$. Rice's theorem does **not** apply: halting is not a property of $L(M)$ (a machine that rejects 0 and one that loops on 0 can have the same language).`
    },
    {
      id: 'undecidable-reverse',
      type: 'written',
      title: 'Accepting w and its reversal',
      difficulty: 2,
      prompt: String.raw`(a) Let $\mathrm{REV} = \{\langle M\rangle : \text{for every string } w,\ M \text{ accepts } w \iff M \text{ accepts } w^R\}$. Prove REV is undecidable by a direct reduction from HALT. (Careful: both $\Sigma^*$ and $\emptyset$ are closed under reversal.)

(b) Give a second proof using Rice's theorem.

(c) Prove that $\{\langle M, w\rangle : M \text{ accepts both } w \text{ and } w^R\}$ is undecidable.`,
      rubric: [
        '(a) Explains why the standard M\' fails (Σ* and ∅ are both in REV)',
        '(a) M\' accepts a fixed non-palindrome such as 01 unconditionally, everything else only after M halts on w',
        '(a) Halts ⇒ Σ* ∈ REV; loops ⇒ {01} ∉ REV (10 not accepted)',
        '(b) Rice with Y = accept all, N = machine with language {01}',
        '(c) Reduction mapping ⟨M, w⟩ to ⟨M\', ε⟩ (or to ⟨M\', w⟩)'
      ],
      hints: [
        'Use the regularity trick: accept some strings before running M on w, so that the "no" language is not closed under reversal.',
        'For (c): reduce from HALT; ε is its own reversal.'
      ],
      solution: String.raw`**(a)** Both $\Sigma^*$ and $\emptyset$ are closed under reversal, so the standard $M'$ always lands in REV and tells us nothing. Accept a non-palindrome unconditionally instead. Suppose $DecideRev$ decides REV (alphabet $\{0,1\}$):
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            if x = 01: return TRUE
            run M on input w
            return TRUE
    return DecideRev(⟨M'⟩)
~~~
- If $M$ halts on $w$: $M'$ accepts every string, $L(M') = \Sigma^*$, which is closed under reversal: $DecideHalt$ accepts.
- If $M$ does not halt on $w$: $M'$ accepts $01$ and loops on every other input, so $L(M') = \{01\}$. Then $M'$ accepts $01$ but not $10 = (01)^R$: $\langle M'\rangle \notin \mathrm{REV}$, and $DecideHalt$ rejects.

$DecideHalt$ always halts (it only builds $\langle M'\rangle$), so it decides HALT — contradiction.

**(b)** $\mathrm{REV} = \{\langle M\rangle : L(M) \in \mathcal{L}\}$ with $\mathcal{L} = \{L : L = L^R\}$, a property of $L(M)$ only. $Y$ = accept everything ($\Sigma^* = (\Sigma^*)^R$). $N$ = accept exactly the string $01$ ($\{01\}^R = \{10\} \ne \{01\}$). Rice: undecidable.

**(c)** Suppose $D$ decides $\{\langle M, w\rangle : M \text{ accepts } w \text{ and } w^R\}$. $DecideHalt(\langle M, w\rangle)$: build $M'(x)$ = "run $M$ on $w$; accept", and return $D(\langle M', \varepsilon\rangle)$. Since $\varepsilon^R = \varepsilon$, $M'$ accepts both $\varepsilon$ and $\varepsilon^R$ iff $M$ halts on $w$. Contradiction.`
    },
    {
      id: 'undecidable-infinite',
      type: 'written',
      title: 'Infinite languages: undecidable, and worse',
      difficulty: 3,
      prompt: String.raw`Let $\mathrm{INF} = \{\langle M\rangle : L(M) \text{ is infinite}\}$.

(a) Prove INF is undecidable (direct reduction from HALT).

(b) Prove INF is not co-recognizable.

(c) Prove INF is not recognizable. *Hint:* make $L(M')$ finite exactly when $M$ halts on $w$, using a step counter.

You may use: if $x \in A \iff f(x) \in B$ for a computable $f$, and $B$ is recognizable, then $A$ is recognizable.`,
      rubric: [
        '(a) Standard M\' with both directions (Σ* infinite, ∅ finite)',
        '(b) The same map sends HALT to INF, so co-HALT to co-INF; co-INF recognizable would make co-HALT recognizable',
        '(c) M\'(x): run M on w for |x| steps; if M halted, reject, else accept',
        '(c) Halts after t steps ⇒ L(M\') = {x : |x| < t} finite; never halts ⇒ Σ* infinite',
        '(c) Concludes: co-HALT maps to INF, so INF is not recognizable'
      ],
      hints: [
        'For (c): if M halts after exactly t steps, which inputs x let M\' see that happen?',
        String.raw`$M'$ must always halt on its own: simulating for $|x|$ steps is bounded.`
      ],
      solution: String.raw`**(a)** Suppose $DecideInf$ decides INF. $DecideHalt(\langle M, w\rangle)$ builds $M'(x)$ = "run $M$ on $w$; accept" and returns $DecideInf(\langle M'\rangle)$. If $M$ halts on $w$, $L(M') = \Sigma^*$ (infinite); otherwise $L(M') = \emptyset$ (finite). So $DecideHalt$ decides HALT — contradiction. (Rice also works: $Y$ = accept all, $N$ = reject all.)

**(b)** The map $f : \langle M, w\rangle \mapsto \langle M'\rangle$ of (a) satisfies $\langle M, w\rangle \in \mathrm{HALT} \iff \langle M'\rangle \in \mathrm{INF}$, equivalently $\langle M, w\rangle \in \overline{\mathrm{HALT}} \iff \langle M'\rangle \in \overline{\mathrm{INF}}$. If INF were co-recognizable, $\overline{\mathrm{INF}}$ would be recognizable, hence so would $\overline{\mathrm{HALT}}$. Contradiction.

**(c)** Define, from $\langle M, w\rangle$:
~~~pseudo
M'(x):
    simulate M on w for |x| steps
    if M halted within those steps: return FALSE
    else:                           return TRUE
~~~
($M'$ always halts.) If $M$ halts on $w$ after exactly $t$ steps, then $M'$ accepts $x$ iff $|x| < t$, so $L(M')$ is finite. If $M$ never halts on $w$, $M'$ accepts every $x$, so $L(M') = \Sigma^*$ is infinite. Hence $\langle M, w\rangle \in \overline{\mathrm{HALT}} \iff \langle M'\rangle \in \mathrm{INF}$. If INF were recognizable, $\overline{\mathrm{HALT}}$ would be recognizable — contradiction.

So INF is neither recognizable nor co-recognizable. (The same two maps show FINITE $= \{\langle M\rangle : L(M) \text{ finite}\}$ is neither, too.)`
    },
    {
      id: 'undecidable-intersect',
      type: 'written',
      title: 'Do two machines accept a common string?',
      difficulty: 2,
      prompt: String.raw`Let $\mathrm{COMMON} = \{\langle M_1, M_2\rangle : \text{some string is accepted by both } M_1 \text{ and } M_2\}$.

(a) Prove COMMON is undecidable.

(b) Prove COMMON is recognizable.

(c) What can you conclude about $\{\langle M_1, M_2\rangle : L(M_1) \cap L(M_2) = \emptyset\}$?`,
      rubric: [
        '(a) Reduction from HALT using a fixed comparison machine (e.g. M_all) and the standard M\'',
        '(a) Both directions: halts ⇒ Σ* ∩ Σ* ≠ ∅; loops ⇒ ∅ ∩ Σ* = ∅',
        '(b) Dovetailing over strings and step counts, running both machines',
        '(c) The disjointness language is co-recognizable but not recognizable (or: undecidable and its complement is recognizable)'
      ],
      hints: [
        String.raw`Pair the standard $M'$ with a machine that accepts everything.`,
        String.raw`For (b): in round $t$, run both machines for $t$ steps on each of the first $t$ strings.`
      ],
      solution: String.raw`**(a)** Suppose $DecideCommon$ decides COMMON, and let $M_{\mathrm{all}}$ accept every input immediately.
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w
            return TRUE
    return DecideCommon(⟨M', M_all⟩)
~~~
If $M$ halts on $w$, $L(M') \cap L(M_{\mathrm{all}}) = \Sigma^* \ne \emptyset$: accept. If not, $L(M') = \emptyset$, so the intersection is empty: reject. $DecideHalt$ decides HALT — contradiction. (Rice does not apply directly since the input is a pair, but the reduction is just as easy.)

**(b)** On input $\langle M_1, M_2\rangle$: for $t = 1, 2, 3, \ldots$: for each of the first $t$ strings $w_1, \ldots, w_t$ (shortlex order), run $M_1$ and $M_2$ on $w_i$ for $t$ steps each; if both accepted $w_i$, accept. If some $w_i$ is accepted by $M_1$ after $s_1$ steps and by $M_2$ after $s_2$ steps, we accept in round $\max(i, s_1, s_2)$. Otherwise we never accept. So COMMON is recognizable.

**(c)** $\mathrm{DISJOINT} = \{\langle M_1, M_2\rangle : L(M_1) \cap L(M_2) = \emptyset\}$ is the complement of COMMON (among valid encodings), so it is **co-recognizable**. It is **not recognizable**: otherwise COMMON would be both recognizable and co-recognizable, hence decidable, contradicting (a).`
    },
    {
      id: 'undecidable-writes',
      type: 'written',
      title: 'Writing symbols: one undecidable, one decidable',
      difficulty: 3,
      prompt: String.raw`Let $\star$ be a fixed tape symbol and let $\square$ be the blank.

(a) Prove $\mathrm{WRITESTAR} = \{\langle M\rangle : M \text{, started on a blank tape, at some point writes } \star\}$ is undecidable.

(b) Prove $\mathrm{WRITESNB} = \{\langle M\rangle : M \text{, started on a blank tape, at some point writes a non-blank symbol}\}$ is **decidable**.

(c) Why doesn't the reduction from (a) work for (b)?`,
      rubric: [
        '(a) M\' writes w, simulates M on w with ★ renamed to a fresh symbol, then writes ★',
        '(a) Both directions, including that the simulation itself never writes ★',
        '(b) Before the first non-blank write the tape is entirely blank, so the configuration (up to head position) is just the state',
        '(b) Simulate at most |Q| steps: if no non-blank symbol was written and M has not halted, a state repeated and the run is periodic, so it never writes one',
        '(c) Any simulation of M on w must first write w (non-blank), so M\' would write a non-blank symbol in both cases'
      ],
      hints: [
        'For (a): the simulated machine might itself write ★ — rename it.',
        'For (b): what does the tape look like before the first non-blank write? What does the machine read at every step?'
      ],
      solution: String.raw`**(a)** Suppose $DecideStar$ decides WRITESTAR.
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            write w on the tape
            run M on w, where every occurrence of ★ in M's tape
                alphabet is replaced by a fresh symbol
            write ★
            return TRUE
    return DecideStar(⟨M'⟩)
~~~
(Make sure writing $w$ does not write $\star$ either: if $\star$ occurs in $w$, use its renamed copy.) Up to the end of the simulation $M'$ never writes $\star$. If $M$ halts on $w$, $M'$ (on the blank tape, i.e. input $\varepsilon$) finishes the simulation and writes $\star$: $DecideStar$ accepts. If not, $M'$ simulates forever and never writes $\star$: $DecideStar$ rejects. So $DecideHalt$ decides HALT — contradiction. (Rice does not apply: this is about what $M$ writes, not about $L(M)$.)

**(b)** Let $M$ have state set $Q$. Until the first time $M$ writes a non-blank symbol, its tape is entirely blank, so at every step it reads $\square$, and its next state depends only on its current state. Simulate $M$ on the blank tape for at most $|Q|$ steps:
- if it writes a non-blank symbol, **accept**;
- if it halts first, **reject** (it never writes one);
- if it completes $|Q|$ steps without either, then among the $|Q| + 1$ non-halting states visited some state repeats; since the tape is still all blank, the run from then on repeats the same cycle of states forever, always reading and writing blanks. **Reject.**

This always halts, so WRITESNB is decidable.

**(c)** To simulate $M$ on $w$, the machine $M'$ must write $w$ (and $M$'s tape contents) on its tape — non-blank symbols — whether or not $M$ halts. So for nonempty $w$, $\langle M'\rangle \in \mathrm{WRITESNB}$ no matter what $M$ does, and the answer tells us nothing about halting. The renaming trick works in (a) only because $\star$ is *one particular* symbol that the simulation can avoid; no simulation can avoid writing non-blank symbols altogether.`
    },
    {
      id: 'undecidable-moves-left',
      type: 'written',
      title: 'Moving left is decidable',
      difficulty: 3,
      prompt: String.raw`Standard TMs move L or R at every step. Prove that each of these languages is **decidable**:

(a) $\{\langle M, w\rangle : M \text{ moves its head left at some point during its computation on } w\}$

(b) $\{\langle M\rangle : M \text{ moves left at some point on at least one input}\}$

(c) $\{\langle M\rangle : M \text{ moves left at some point on every input}\}$

Explain why Rice's theorem is irrelevant here.`,
      rubric: [
        '(a) While moving only right, M first reads w and then only blanks; after |w| steps its next state depends only on its state, so within |Q| more steps it repeats; simulate |w| + |Q| + 1 steps',
        '(b) Reachability in a finite graph: states reachable by right moves on input symbols, then by right moves on blanks; look for a left-moving transition',
        '(c) The inputs on which M never moves left form a regular language (DFA built from M); test it for emptiness',
        'Rice concerns L(M); these are properties of head movement'
      ],
      hints: [
        'A machine that never moves left never rereads anything it wrote. What does it read?',
        'For (b)/(c): think of the right-moving transitions as the transitions of a finite automaton reading the input.'
      ],
      solution: String.raw`Let $M$ have states $Q$, input alphabet $\Sigma$, blank $\square$. A machine that has only moved right so far has, at step $i$, its head on cell $i$, which it has never visited, so it reads the $(i+1)$-st input symbol (or $\square$ once past the input). Writing is irrelevant: it never returns to a cell it has written.

**(a)** Simulate $M$ on $w$ for at most $|w| + |Q| + 1$ steps; accept if it moves left during this time, reject otherwise. *Why this suffices:* if $M$ makes $|w|$ right moves, its head is past the input and from then on, as long as it keeps moving right, it reads only blanks, so its next state is a function of its current state. Among the next $|Q| + 1$ states (all non-halting if it keeps running) one repeats, and from then on the state sequence is periodic and every transition used is a right move on $\square$. So if $M$ has not moved left (and has not halted) within $|w| + |Q| + 1$ steps, it never will.

**(b)** Build a finite graph search. Let $R_1$ be the set of states reachable from the start state by right-moving transitions on **input symbols** (including the start state). Let $R_2$ be the set of states reachable from $R_1$ by right-moving transitions on $\square$. Accept iff some $q \in R_1$ has a left-moving transition on some symbol of $\Sigma \cup \{\square\}$, or some $q \in R_2$ has a left-moving transition on $\square$. Correctness: the runs that have only moved right so far correspond exactly to paths that read some input symbols (any sequence we like, since the input is ours to choose) and then blanks; a left move happens iff such a path reaches a left-moving transition on the symbol being read. (Reading $\square$ from $R_1$ corresponds to choosing the input to end there.) Finite graph, so the search halts.

**(c)** Construct a DFA $A$ that accepts exactly the inputs on which $M$ **never** moves left: states $Q \cup \{\mathsf{dead}, \mathsf{safe}\}$; from $q$ on input symbol $c$, if $\delta(q, c)$ moves right to $p$, go to $p$; if it moves left, go to $\mathsf{dead}$; if $q$ is a halting state, go to $\mathsf{safe}$ (it halted without moving left). A state $q$ is accepting iff $q$ is a halting state, $\mathsf{safe}$, or the blank-only continuation from $q$ never moves left — computable exactly as in (a) by following right moves on $\square$ for at most $|Q| + 1$ steps. Then $M$ moves left on every input iff $L(A) = \emptyset$, which is decidable (reachability of an accepting state).

**Rice is irrelevant:** Rice's theorem is about properties of $L(M)$. Head movement is a property of the machine's behavior; two machines with the same language can differ on it. Being "about behavior" does not make a problem undecidable (these three are decidable) — nor does it make it decidable (halting is behavioral and undecidable).`
    },
    {
      id: 'undecidable-cfl',
      type: 'written',
      title: 'Is L(M) context-free?',
      difficulty: 3,
      prompt: String.raw`Let $\mathrm{CFTM} = \{\langle M\rangle : L(M) \text{ is context-free}\}$, for machines with input alphabet $\{a, b, c\}$.

(a) Prove CFTM is undecidable by a direct reduction from HALT. You may assume $\{a^nb^nc^n : n \ge 0\}$ is not context-free and is decidable.

(b) Prove $\{\langle M\rangle : L(M) \text{ is not context-free}\}$ is undecidable with almost no extra work.

(c) Prove CFTM undecidable via Rice's theorem.`,
      rubric: [
        '(a) Explains that Σ* and ∅ are both context-free, so M\' must accept a non-CF language in the "loops" case',
        '(a) M\'(x): if x ∈ {a^n b^n c^n} accept; run M on w; accept',
        '(a) Halts ⇒ Σ* (CF); loops ⇒ {a^n b^n c^n} (not CF); both directions',
        '(b) Complement argument (decidable languages closed under complement) or swapped reduction',
        '(c) Y = reject all (∅ CF), N = decider for a^n b^n c^n'
      ],
      hints: [
        String.raw`Accept $a^nb^nc^n$ unconditionally, then everything else only if $M$ halts on $w$.`,
        'If a language is decidable, so is its complement (among valid encodings).'
      ],
      solution: String.raw`**(a)** $\Sigma^*$ and $\emptyset$ are both context-free, so the standard $M'$ gives no information. Suppose $DecideCF$ decides CFTM.
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            if x = a^n b^n c^n for some n ≥ 0: return TRUE
            run M on input w
            return TRUE
    return DecideCF(⟨M'⟩)
~~~
(The first test is a terminating subroutine — cross off one $a$, $b$, $c$ per pass.)
- If $M$ halts on $w$: every $x$ is accepted (either by the test or after the simulation), $L(M') = \{a,b,c\}^*$, which is context-free (even regular). $DecideHalt$ accepts.
- If $M$ does not halt on $w$: exactly the strings $a^nb^nc^n$ are accepted (everything else loops), $L(M') = \{a^nb^nc^n\}$, not context-free. $DecideHalt$ rejects.

So $DecideHalt$ decides HALT — contradiction.

**(b)** If $\{\langle M\rangle : L(M) \text{ not CF}\}$ were decidable, then CFTM would be decidable too: on input $x$, reject if $x$ is not a valid TM encoding (a decidable syntax check), otherwise return the opposite answer. That contradicts (a).

**(c)** CFTM $= \{\langle M\rangle : L(M) \in \mathcal{L}\}$ where $\mathcal{L}$ is the family of context-free languages — a property of $L(M)$ only. $Y$ = reject every input ($\emptyset$ is CF). $N$ = a decider for $\{a^nb^nc^n\}$ (not CF). Both exist, so by Rice's theorem CFTM is undecidable.`
    },
    {
      id: 'undecidable-neither',
      type: 'written',
      title: 'ACCEPTALL and EQ are neither recognizable nor co-recognizable',
      difficulty: 3,
      prompt: String.raw`Using mapping reductions (a computable $f$ with $x \in A \iff f(x) \in B$; if $B$ is recognizable so is $A$):

(a) Prove $\mathrm{ACCEPTALL} = \{\langle M\rangle : L(M) = \Sigma^*\}$ is not co-recognizable.

(b) Prove ACCEPTALL is not recognizable.

(c) Conclude that $\mathrm{EQ} = \{\langle M_1, M_2\rangle : L(M_1) = L(M_2)\}$ is neither recognizable nor co-recognizable.`,
      rubric: [
        '(a) Standard M\' maps HALT to ACCEPTALL, so co-HALT maps to co-ACCEPTALL; conclude',
        '(b) M\'(x): simulate M on w for |x| steps; reject if it halted, else accept. Halts ⇒ finite language ≠ Σ*; loops ⇒ Σ*',
        '(b) So co-HALT maps to ACCEPTALL; conclude',
        '(c) Map ⟨M⟩ ↦ ⟨M, M_all⟩ reduces ACCEPTALL to EQ (and the complements); transfer both conclusions'
      ],
      hints: [
        String.raw`For (b), the machine $M'$ should accept everything iff $M$ does **not** halt on $w$.`,
        String.raw`If $A$ maps to $B$ via $f$, then $\overline{A}$ maps to $\overline{B}$ via the same $f$.`
      ],
      solution: String.raw`**(a)** $f(\langle M, w\rangle) = \langle M'\rangle$ with $M'(x)$ = "run $M$ on $w$; accept". Then $\langle M, w\rangle \in \mathrm{HALT} \iff L(M') = \Sigma^* \iff \langle M'\rangle \in \mathrm{ACCEPTALL}$. Taking complements, $\overline{\mathrm{HALT}}$ maps to $\overline{\mathrm{ACCEPTALL}}$. If ACCEPTALL were co-recognizable, $\overline{\mathrm{ACCEPTALL}}$ would be recognizable, hence $\overline{\mathrm{HALT}}$ would be — contradiction.

**(b)** $g(\langle M, w\rangle) = \langle M''\rangle$ with
~~~pseudo
M''(x):
    simulate M on w for |x| steps
    if M halted within those steps: return FALSE
    return TRUE
~~~
If $M$ halts on $w$ after $t$ steps, $M''$ rejects every $x$ with $|x| \ge t$, so $L(M'') \ne \Sigma^*$. If $M$ never halts on $w$, $M''$ accepts everything: $L(M'') = \Sigma^*$. So $\langle M, w\rangle \in \overline{\mathrm{HALT}} \iff \langle M''\rangle \in \mathrm{ACCEPTALL}$. If ACCEPTALL were recognizable, so would be $\overline{\mathrm{HALT}}$ — contradiction.

**(c)** Let $M_{\mathrm{all}}$ accept everything. The map $h(\langle M\rangle) = \langle M, M_{\mathrm{all}}\rangle$ satisfies $\langle M\rangle \in \mathrm{ACCEPTALL} \iff h(\langle M\rangle) \in \mathrm{EQ}$. If EQ were recognizable, ACCEPTALL would be (contradicting (b)); if EQ were co-recognizable, then $\overline{\mathrm{EQ}}$ recognizable would make $\overline{\mathrm{ACCEPTALL}}$ recognizable (contradicting (a)). So EQ is neither.`
    },
    {
      id: 'undecidable-rice-proof',
      type: 'written',
      title: 'Prove Rice’s theorem',
      difficulty: 3,
      prompt: String.raw`Prove Rice's theorem: if $\mathcal{L}$ is a set of languages such that some TM $Y$ has $L(Y) \in \mathcal{L}$ and some TM $N$ has $L(N) \notin \mathcal{L}$, then $\mathrm{ACCEPTIN}(\mathcal{L}) = \{\langle M\rangle : L(M) \in \mathcal{L}\}$ is undecidable. Handle both cases $\emptyset \in \mathcal{L}$ and $\emptyset \notin \mathcal{L}$.`,
      rubric: [
        'Case ∅ ∉ 𝓛: M\'(x) runs M on w, then runs Y on x and returns its answer',
        'Halts ⇒ L(M\') = L(Y) ∈ 𝓛; loops ⇒ L(M\') = ∅ ∉ 𝓛; DecideHalt correct and halting',
        'Case ∅ ∈ 𝓛: use N in place of Y (L(M\') = L(N) ∉ 𝓛 when M halts, ∅ ∈ 𝓛 when it loops) and flip the answer — or pass to the complementary family',
        'Explains why M\' never needs to be run by DecideHalt'
      ],
      hints: [
        String.raw`$M'(x)$: first run $M$ on $w$ (ignoring $x$); then behave exactly like $Y$ on $x$.`,
        String.raw`If $\emptyset \in \mathcal{L}$, the "loops" case lands inside $\mathcal{L}$, so use $N$ instead and negate the answer.`
      ],
      solution: String.raw`Suppose for contradiction that $DecideIn$ decides $\mathrm{ACCEPTIN}(\mathcal{L})$.

**Case 1: $\emptyset \notin \mathcal{L}$.**
~~~pseudo
DecideHalt(⟨M, w⟩):
    Encode the following Turing machine M':
        M'(x):
            run M on input w        (ignore the result)
            run Y on input x
            return whatever Y returns (loop if Y loops)
    return DecideIn(⟨M'⟩)
~~~
- If $M$ halts on $w$: $M'$ behaves exactly like $Y$ on every input, so $L(M') = L(Y) \in \mathcal{L}$, and $DecideHalt$ accepts.
- If $M$ does not halt on $w$: $M'$ loops on every input, $L(M') = \emptyset \notin \mathcal{L}$, and $DecideHalt$ rejects.

**Case 2: $\emptyset \in \mathcal{L}$.** Use $N$ instead of $Y$ in $M'$, and return the **opposite** of $DecideIn(\langle M'\rangle)$.
- If $M$ halts on $w$: $L(M') = L(N) \notin \mathcal{L}$, $DecideIn$ rejects, so $DecideHalt$ accepts.
- If not: $L(M') = \emptyset \in \mathcal{L}$, $DecideIn$ accepts, so $DecideHalt$ rejects.

In both cases $DecideHalt$ only constructs $\langle M'\rangle$ (from $\langle M, w\rangle$ and the fixed machine $Y$ or $N$) and calls a decider, so it always halts, and it decides HALT. This contradicts the undecidability of HALT. $\blacksquare$

(Note where the hypotheses are used: $Y$ or $N$ must **exist** as Turing machines for $M'$ to be constructible — that is non-triviality; and the argument only ever reasons about $L(M')$, which is why the property must depend only on the language.)`
    },
    {
      id: 'undecidable-rice-traps',
      type: 'written',
      title: 'Rice or not? Round two',
      difficulty: 3,
      prompt: String.raw`For each language, decide whether Rice's theorem applies. If it does, give $Y$ and $N$. If it does not, say why, and decide whether the language is decidable (with a short proof or proof idea).

1. $\{\langle M\rangle : L(M) = L(M_0)\}$ for a fixed TM $M_0$
2. $\{\langle M\rangle : \langle M\rangle \text{ is a palindrome}\}$
3. $\{\langle M\rangle : M \text{ accepts some string within } 374 \text{ steps}\}$
4. $\{\langle M\rangle : L(M) \subseteq 0^*\}$
5. $\{\langle M\rangle : M \text{ halts on every input of length at most } 5\}$
6. $\{\langle M\rangle : L(M) \text{ is decidable}\}$
7. $\{\langle G\rangle : G \text{ is a CFG and } \varepsilon \in L(G)\}$
8. $\{\langle M\rangle : L(M) = \emptyset \text{ or } L(M) = \Sigma^*\}$`,
      rubric: [
        '1, 4, 6, 8: Rice applies with valid Y and N (6: N can be a recognizer for HALT/ACCEPT, which is undecidable)',
        '2: syntactic, decidable',
        '3: not semantic; decidable (only strings of length ≤ 374 matter, simulate 374 steps)',
        '5: not semantic (halting); undecidable via standard reduction',
        '7: not about TMs; decidable (nullable nonterminals)'
      ],
      hints: [
        'Rice needs: (a) membership depends only on L(M); (b) some recognizable language has the property and some does not.',
        'For 6: is every recognizable language decidable?',
        'For 3: a machine that accepts within 374 steps has read at most the first 374 input symbols.'
      ],
      solution: String.raw`1. **Applies.** Family $\{L(M_0)\}$. $Y = M_0$. $N$ = any TM whose language differs from $L(M_0)$: if $L(M_0) = \emptyset$ take "accept everything", otherwise "reject everything". Undecidable.
2. **Does not apply** (a property of the encoding, not of the language). **Decidable:** compare the string with its reverse.
3. **Does not apply** — not semantic: a machine that accepts $\varepsilon$ immediately and one that accepts $\varepsilon$ after 1000 steps have the same language. **Decidable:** within 374 steps the head never gets more than 373 cells from where it started, so $M$ reads at most the first 374 input cells. If $|x| > 374$, the run on $x$ and the run on its length-374 prefix are therefore identical for 374 steps (the cells where they differ are never read). So: simulate $M$ for 374 steps on every string of length at most 374 (finitely many); accept iff some run accepts.
4. **Applies.** Family $\{L : L \subseteq 0^*\}$. $Y$ = reject everything ($\emptyset \subseteq 0^*$). $N$ = accept everything (contains $1$). Undecidable.
5. **Does not apply** — halting is not a property of $L(M)$ (rejecting vs. looping). **Undecidable:** $DecideHalt(\langle M, w\rangle)$ builds $M'(x)$ = "run $M$ on $w$; accept" and asks the decider; $M'$ halts on all short inputs iff $M$ halts on $w$.
6. **Applies** — and it is **not** trivial, because not every recognizable language is decidable. $Y$ = reject everything ($\emptyset$ is decidable). $N$ = a recognizer for HALT, e.g. "on input $\langle M', w'\rangle$, simulate $M'$ on $w'$ and accept when it halts" ($L(N) = \mathrm{HALT}$, undecidable). Undecidable.
7. **Does not apply** (not about TMs). **Decidable:** compute the nullable nonterminals (repeatedly mark $A$ if some rule $A \to \alpha$ has every symbol of $\alpha$ marked, starting from $\varepsilon$-rules); accept iff the start symbol is marked.
8. **Applies.** Family $\{\emptyset, \Sigma^*\}$. $Y$ = reject everything. $N$ = accept exactly $\varepsilon$ (language $\{\varepsilon\}$, neither empty nor everything). Undecidable.`
    },
    {
      id: 'undecidable-classify2',
      type: 'written',
      title: 'Classify: decidable, recognizable, co-recognizable, or neither',
      difficulty: 3,
      prompt: String.raw`For each language, say whether it is decidable; if not, whether it is recognizable, co-recognizable, or neither. Justify briefly (an algorithm for each positive claim; a one-line argument for each negative one).

(a) $\{\langle M\rangle : M \text{ accepts the string } 374\}$

(b) $\{\langle M\rangle : M \text{ does not halt on } \varepsilon\}$

(c) $\{\langle M\rangle : |L(M)| \ge 2\}$

(d) $\{\langle M\rangle : |L(M)| \le 1\}$

(e) $\{\langle M\rangle : M \text{ halts on } \varepsilon \text{ within } 2^{|\langle M\rangle|} \text{ steps}\}$

(f) $\{\langle M\rangle : L(M) = \emptyset\}$

(g) $\{\langle M\rangle : M \text{ accepts } \langle M\rangle\}$`,
      rubric: [
        '(a) Recognizable (simulate), undecidable (Rice), hence not co-recognizable',
        '(b) Co-recognizable (complement is recognizable by simulation), undecidable, hence not recognizable',
        '(c) Recognizable by dovetailing until two distinct accepted strings are found; undecidable by Rice',
        '(d) Co-recognizable (complement of (c) among encodings); not recognizable',
        '(e) Decidable (bounded simulation)',
        '(f) Co-recognizable only',
        '(g) Recognizable (simulate M on ⟨M⟩); undecidable; not co-recognizable'
      ],
      hints: [
        'A positive claim of recognizability needs a procedure that accepts members after finite time; looping on non-members is fine.',
        'Once you know a language is undecidable and recognizable, it cannot be co-recognizable (and vice versa).'
      ],
      solution: String.raw`Key fact used throughout: if $L$ is undecidable and recognizable, it is **not** co-recognizable; if undecidable and co-recognizable, it is **not** recognizable.

**(a)** *Recognizable:* simulate $M$ on $374$; accept if it accepts. *Undecidable:* Rice (family of languages containing $374$; $Y$ = accept all, $N$ = reject all). So **recognizable, not co-recognizable**.

**(b)** Its complement (among valid encodings) $\{\langle M\rangle : M \text{ halts on } \varepsilon\}$ is recognizable (simulate, accept on halting), so (b) is **co-recognizable**. Halting on $\varepsilon$ is undecidable (reduction from HALT with $M'$ = "run $M$ on $w$"), so (b) is undecidable and therefore **not recognizable**.

**(c)** *Recognizable:* dovetail — for $t = 1, 2, \ldots$, run $M$ for $t$ steps on each of the first $t$ strings; accept once two different strings have been accepted. *Undecidable:* Rice ($Y$ = accept all, $N$ = reject all). So **recognizable, not co-recognizable**.

**(d)** This is the complement of (c) among valid encodings, so it is **co-recognizable**, undecidable, hence **not recognizable**.

**(e)** **Decidable:** compute $k = 2^{|\langle M\rangle|}$ and simulate $M$ on $\varepsilon$ for $k$ steps. Huge but finite.

**(f)** $\mathrm{EMPTY}$: complement of NONEMPTY, which is recognizable by dovetailing; undecidable by Rice. So **co-recognizable, not recognizable**.

**(g)** *Recognizable:* simulate $M$ on $\langle M\rangle$ and accept if it accepts. *Undecidable:* $DecideHalt(\langle M, w\rangle)$ builds $M'(x)$ = "run $M$ on $w$; accept" — then $M'$ accepts $\langle M'\rangle$ iff $M$ halts on $w$. (Rice does not apply: the property depends on the machine's own encoding.) So **recognizable, not co-recognizable**.`
    },
    {
      id: 'undecidable-halt-diag',
      type: 'written',
      title: 'HALT is undecidable: the direct diagonal proof',
      difficulty: 2,
      prompt: String.raw`Prove directly (without SELFREJECT or any other reduction) that $\mathrm{HALT} = \{\langle M, w\rangle : M \text{ halts on } w\}$ is undecidable. Point out exactly where your proof uses the assumption that the hypothetical machine is a **decider**.`,
      rubric: [
        'Assumes a decider H for HALT',
        'Builds D(⟨M⟩): if H accepts ⟨M, ⟨M⟩⟩ then loop forever, else halt',
        'Runs D on ⟨D⟩ and derives a contradiction in both cases',
        'Notes that D is a well-defined TM only because H always halts (so D always reaches its if-test)',
        'Connects to diagonalization (D differs from every M on input ⟨M⟩)'
      ],
      hints: [
        'Build a contrarian machine D that does the opposite of what H predicts about M on its own encoding.',
        'Run D on ⟨D⟩.'
      ],
      solution: String.raw`Suppose for contradiction that a TM $H$ decides HALT. Construct the TM $D$:
~~~pseudo
D(⟨M⟩):
    if H(⟨M, ⟨M⟩⟩) accepts:      (H predicts M halts on ⟨M⟩)
        loop forever
    else:
        halt (say, accept)
~~~
Now run $D$ on its own encoding $\langle D\rangle$.
- If $D$ halts on $\langle D\rangle$: then $\langle D, \langle D\rangle\rangle \in \mathrm{HALT}$, so $H$ accepts it, so by construction $D$ loops forever on $\langle D\rangle$. Contradiction.
- If $D$ does not halt on $\langle D\rangle$: then $H$ rejects $\langle D, \langle D\rangle\rangle$, so $D$ takes the else-branch and halts. Contradiction.

So no such $H$ exists. $\blacksquare$

**Where "decider" is used.** $D$ calls $H$ as a subroutine and then branches on its answer. If $H$ could loop, $D$ might never reach the if-test, and the case "$D$ does not halt on $\langle D\rangle$" would have a third explanation ($H$ looping), so no contradiction would arise. Indeed HALT *is* recognizable, so a recognizer for it exists — the contradiction needs $H$ to always answer.

**Diagonal view.** Make a table with rows $M_1, M_2, \ldots$ and columns $\langle M_1\rangle, \langle M_2\rangle, \ldots$, entry = "halts" or "loops". $D$ is built to disagree with the diagonal: $D$ halts on $\langle M_i\rangle$ iff $M_i$ loops on $\langle M_i\rangle$. So $D$ differs from every row — but $D$ is itself some row $M_j$, and at the diagonal entry $(j, j)$ it would have to differ from itself.`
    },
    {
      id: 'undecidable-direction',
      type: 'written',
      title: 'Reductions in the wrong direction',
      difficulty: 2,
      prompt: String.raw`(a) Let $L$ be any recognizable language, recognized by $R$. Show that $L$ reduces to HALT: describe an algorithm that decides $L$ using a black-box decider for HALT. (So "my language reduces to HALT" proves nothing about undecidability.)

(b) A student writes: "*To prove ACCEPTALL is undecidable: assume DecideHalt exists. On input $\langle M\rangle$, for each string $x$, call DecideHalt($\langle M, x\rangle$); if it rejects, reject; otherwise simulate $M$ on $x$ and reject if it rejects. Accept if all strings pass.*" Identify every error.

(c) State precisely what a correct reduction for (b) must assume and construct.`,
      rubric: [
        '(a) Builds R\' = R with its reject state replaced by an infinite loop; x ∈ L ⟺ R\' halts on x; DecideL(x) = DecideHalt(⟨R\', x⟩)',
        '(b) Wrong direction: uses a HALT decider to decide ACCEPTALL (shows only that ACCEPTALL is no harder than HALT-with-quantifier, proves nothing)',
        '(b) The procedure loops over infinitely many strings, so it is not a decider anyway',
        '(c) Assume DecideAcceptAll; from ⟨M, w⟩ construct M\' without running it; show both directions; conclude HALT decidable — contradiction'
      ],
      hints: [
        'For (a): a recognizer accepts iff it halts in its accept state. Turn "reject" into "loop".',
        'In a correct proof, the black box is the NEW problem.'
      ],
      solution: String.raw`**(a)** Let $R'$ be $R$ with every transition into the reject state redirected into a state that loops forever. Then $R'$ halts on $x$ iff $R$ accepts $x$ iff $x \in L$. So
~~~pseudo
DecideL(x):
    return DecideHalt(⟨R', x⟩)
~~~
decides $L$, given a HALT decider. Every recognizable language — including every decidable one — reduces to HALT, so showing "$B$ reduces to HALT" can never prove $B$ undecidable.

**(b)** Errors:
1. **Wrong direction.** It assumes a decider for the *known* undecidable problem and uses it to solve the new one. That shows at most that ACCEPTALL is "no harder than HALT" — no contradiction arises, since no decider for HALT exists in the first place.
2. **Not even an algorithm that halts:** "for each string $x$ … accept if all strings pass" loops over infinitely many strings, so it never accepts.
3. It never derives a contradiction, so nothing is concluded about ACCEPTALL.

**(c)** Assume, for contradiction, a decider $DecideAcceptAll$ for the **new** problem. Build $DecideHalt$: on input $\langle M, w\rangle$, **construct** (without running) $M'(x)$ = "run $M$ on $w$; accept", and return $DecideAcceptAll(\langle M'\rangle)$. Prove both directions: if $M$ halts on $w$ then $L(M') = \Sigma^*$ (accept); if not then $L(M') = \emptyset \ne \Sigma^*$ (reject). Then $DecideHalt$ decides HALT, contradicting its undecidability, so ACCEPTALL is undecidable.`
    }
  ]
});
