CS374.topic({
  id: 'tm',
  unit: 'models',
  order: 8,
  title: 'Turing Machines',
  summary: 'The formal model of general computation: definition, configurations, accepting/rejecting/looping, decidable vs. recognizable languages, machine design, robust variants, encodings, the universal TM and the Church-Turing thesis.',
  objectives: [
    'State the formal definition of a Turing machine and trace its computation through configurations',
    'Distinguish accepting, rejecting and looping, and define decidable and recognizable (acceptable) languages',
    'Design Turing machines for simple languages at the transition-table level and describe more complex ones at a high level',
    'Explain why multi-tape, two-way-infinite, stay-option and nondeterministic variants are all equivalent in power',
    'Explain encodings of machines as strings, the universal Turing machine, and the Church-Turing thesis'
  ],
  lesson: String.raw`## Beyond finite memory and stacks

DFAs have finite memory; PDAs add a stack that can only be accessed at the top. A **Turing machine** has an unbounded tape that it can read and write anywhere by moving a head back and forth. This simple change gives a model that (as far as anyone knows) can compute *everything* that is computable at all.

## Formal definition

> **Definition.** A **Turing machine** is a tuple $M = (\Gamma, \square, \Sigma, Q, \mathit{start}, \mathit{accept}, \mathit{reject}, \delta)$ where
> - $\Gamma$ is a finite **tape alphabet**, containing a special **blank** symbol $\square \in \Gamma$;
> - $\Sigma \subseteq \Gamma \setminus \{\square\}$ is the **input alphabet**;
> - $Q$ is a finite set of **states**, with distinct $\mathit{start}, \mathit{accept}, \mathit{reject} \in Q$;
> - $\delta : (Q \setminus \{\mathit{accept}, \mathit{reject}\}) \times \Gamma \to Q \times \Gamma \times \{-1, +1\}$ is the **transition function**.

$\delta(p, a) = (q, b, \Delta)$ means: *in state $p$ reading $a$, write $b$ over it, move the head one cell in direction $\Delta$ ($-1$ = left, $+1$ = right), and enter state $q$.*

Initially the tape holds the input $w$ followed by infinitely many blanks, the head is on the first symbol of $w$ (or on a blank if $w = \varepsilon$), and the state is $\mathit{start}$. The machine halts as soon as it enters $\mathit{accept}$ or $\mathit{reject}$.

Textbook details vary — a tape infinite only to the right (moving left from the first cell leaves the head where it is), or infinite in both directions; moves only L/R, or also S (stay). **None of these choices changes what can be computed** (see Variants below). This app's simulator uses a two-way infinite tape, allows moves <code>L</code>, <code>R</code>, <code>S</code>, writes the blank as <code>_</code>, and treats a missing transition as a move to $\mathit{reject}$.

## Configurations and computations

> **Definition.** A **configuration** is a complete snapshot of a TM: the current state, the tape contents, and the head position. It is often written $u\,q\,v$: the tape holds $uv$ (followed by blanks), the state is $q$, and the head is on the first symbol of $v$.

One step of computation takes configuration $C$ to the unique next configuration $C'$ given by $\delta$. Starting from the **initial configuration** $\mathit{start}\,w$, the machine produces a (possibly infinite) sequence of configurations. Exactly one of three things happens:

1. **Accept:** it reaches a configuration in state $\mathit{accept}$.
2. **Reject:** it reaches a configuration in state $\mathit{reject}$.
3. **Loop (diverge):** it runs forever, never entering either halting state.

> **Definition.** $M$ **accepts** $w$ if its computation on $w$ ends in $\mathit{accept}$. The language of $M$ is $L(M) = \{w \in \Sigma^* : M \text{ accepts } w\}$. Note: $w \notin L(M)$ if $M$ *rejects or loops* on $w$.

**Example of a trace.** For the $0^n1^n$ machine below, on input $01$ the configurations are
$$q_0\,01 \;\vdash\; X\,q_1\,1 \;\vdash\; q_2\,XY \;\vdash\; X\,q_0\,Y \;\vdash\; XY\,q_3\,\square \;\vdash\; XY\square\,\mathit{acc}\,\square.$$

~~~steps A full run, configuration by configuration: the $0^n1^n$ machine on <code>0011</code>
**The machine** (described in detail below): <code>q0</code> = at the leftmost unmarked cell; <code>q1</code> = carrying a crossed-off 0 to the right; <code>q2</code> = walking back left to the last $X$; <code>q3</code> = all 0s used, checking that only $Y$s remain. Start: $q_0\,0011$ — head on the first 0.
+++
**Round 1, going right.** $q_0$ reads 0: write $X$, move right, enter $q_1$: $X\,q_1\,011$. $q_1$ skips the 0: $X0\,q_1\,11$. $q_1$ reads the first 1: write $Y$, move left, enter $q_2$: $X\,q_2\,0Y1$.
+++
**Round 1, going back.** $q_2$ moves left over the 0: $q_2\,X0Y1$. It reads $X$, steps right and enters $q_0$: $X\,q_0\,0Y1$. One 0 and one 1 are crossed off.
+++
**Round 2.** $X\,q_0\,0Y1 \vdash XX\,q_1\,Y1 \vdash XXY\,q_1\,1 \vdash XX\,q_2\,YY \vdash X\,q_2\,XYY \vdash XX\,q_0\,YY$. Note $q_1$ skips the $Y$ left over from round 1, and $q_2$ skips $Y$s on the way back.
+++
**Final check.** $q_0$ now reads $Y$ instead of 0: every 0 has been matched. $XX\,q_0\,YY \vdash XXY\,q_3\,Y \vdash XXYY\,q_3\,\square \vdash$ accept. Total: 13 steps.
+++
**A rejecting run, for contrast: <code>001</code>.** $q_0\,001 \vdash X\,q_1\,01 \vdash X0\,q_1\,1 \vdash X\,q_2\,0Y \vdash q_2\,X0Y \vdash X\,q_0\,0Y \vdash XX\,q_1\,Y \vdash XXY\,q_1\,\square$. Now $q_1$ is looking for a 1 and sees a blank — there is no transition, which means **reject**: there were more 0s than 1s.
~~~

## Decidable vs. recognizable

> **Definition.** A language $L$ is
> - **recognizable** (Erickson: *acceptable*; also "recursively enumerable") if $L = L(M)$ for some TM $M$;
> - **decidable** (also "recursive") if $L = L(M)$ for some TM $M$ that **halts on every input**. Such an $M$ is a **decider**: it accepts every $w \in L$ and rejects every $w \notin L$.

Every decidable language is recognizable. The converse fails: the halting problem is recognizable but not decidable (next topic). For a recognizer, the dangerous case is looping — an observer watching a recognizer cannot tell "still working" from "will never answer".

> **Theorem.** $L$ is decidable if and only if both $L$ and its complement $\overline{L}$ are recognizable.

*Proof.* ($\Rightarrow$) If $D$ decides $L$, then $D$ is in particular a recognizer for $L$. Let $D'$ be $D$ with its accept and reject states swapped. Because $D$ halts on every input, $D'$ halts on every input and accepts exactly the strings $D$ rejects, i.e. $\overline{L}$. So $\overline{L}$ is recognizable (even decidable).

($\Leftarrow$) Let $R_1$ recognize $L$ and $R_2$ recognize $\overline{L}$. Build $D$: on input $x$, simulate $R_1$ and $R_2$ on $x$ *alternately*, one step of each at a time (e.g. on two tapes). If $R_1$ accepts, accept; if $R_2$ accepts, reject; if one of them rejects, keep simulating the other alone. Every $x$ lies in exactly one of $L$ and $\overline{L}$, so exactly one of $R_1, R_2$ accepts $x$, after some finite number $t$ of steps; $D$ halts after at most about $2t$ simulated steps with the right answer. So $D$ is a decider for $L$. $\blacksquare$

The alternation is essential: if $D$ first ran $R_1$ to completion, it would loop forever on any $x \notin L$ on which $R_1$ loops.

### Closure properties and dovetailing

| Operation | Decidable | Recognizable |
|---|---|---|
| union | yes: run $M_1$, then $M_2$ | yes: run in parallel |
| intersection | yes: run both | yes: run one, then the other |
| complement | yes: swap accept/reject | **no** |
| concatenation | yes: try all $n+1$ splits | yes: dovetail over splits |
| star | yes: try all splittings (or DP) | yes: dovetail over splittings |

The difference between the columns is always the same: a **decider can be called and waited for**; a **recognizer cannot**, because it may loop. Whenever you must try several candidates with a recognizer, use **dovetailing**: for $t = 1, 2, 3, \ldots$, run *each* candidate for $t$ steps. Any candidate that accepts after $s$ steps is discovered in round $s$ (or the round in which it first appears), and no looping candidate can block the others.

**Try it first.** $L_1$ and $L_2$ are recognizable. Show that $L_1 L_2 = \{uv : u \in L_1, v \in L_2\}$ is recognizable. What goes wrong with "for each split $x = uv$: run $M_1$ on $u$ and $M_2$ on $v$; accept if both accept"?

~~~~reveal Solution
The naive loop runs the splits one at a time; if $M_1$ loops on the first piece $u$ of the first split, the other splits are never tried — even if a later split works. Dovetail instead:
~~~pseudo
on input x (length n):
    for t = 1, 2, 3, ...:
        for i = 0 .. n:                        (split x = x[1..i] x[i+1..n])
            run M1 on x[1..i] for t steps
            run M2 on x[i+1..n] for t steps
            if both accepted within t steps: accept
~~~
If $x = uv$ with $M_1$ accepting $u$ in $t_1$ steps and $M_2$ accepting $v$ in $t_2$ steps, the machine accepts in round $\max(t_1, t_2)$. If no split works, no round ever accepts (the machine runs forever, which is allowed for a recognizer). So it recognizes exactly $L_1L_2$.
~~~~

## Designing Turing machines

Typical tricks: **mark** symbols by overwriting them with new tape symbols ($X$, $Y$), **shuttle** back and forth between the parts of the input being compared, and **remember** a bounded amount of information (like "the symbol I just erased") in the state.

### Example: $\{0^n1^n : n \ge 0\}$

Idea: repeatedly cross off the leftmost 0 (as $X$) and the leftmost 1 (as $Y$). When no 0 is left, check that only $Y$s remain.

- $q_0$: at the leftmost unmarked cell. On 0, mark $X$ and go right ($q_1$). On $Y$, all 0s are used up: verify the rest ($q_3$). On blank: accept.
- $q_1$: move right past 0s and $Y$s to the first 1; mark it $Y$, turn around ($q_2$).
- $q_2$: move left back to the rightmost $X$, then step right ($q_0$).
- $q_3$: move right over $Y$s; accept at the blank; reject on anything else.

~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 0 -> q1 X R
q0 Y -> q3 Y R
q0 _ -> acc _ R
q1 0 -> q1 0 R
q1 Y -> q1 Y R
q1 1 -> q2 Y L
q2 0 -> q2 0 L
q2 Y -> q2 Y L
q2 X -> q0 X R
q3 Y -> q3 Y R
q3 _ -> acc _ R
~~~

Running time: each round trip is $O(n)$ steps and there are $O(n)$ rounds, so $O(n^2)$.

### Example: palindromes over $\{a, b\}$

Erase the first symbol, remembering it in the state; run to the right end; check that the last symbol matches and erase it; run back to the left end; repeat. Accept when nothing (or one symbol) remains.

~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 a -> ra _ R
q0 b -> rb _ R
q0 _ -> acc _ R
ra a -> ra a R
ra b -> ra b R
ra _ -> ca _ L
ca a -> back _ L
ca _ -> acc _ R
rb a -> rb a R
rb b -> rb b R
rb _ -> cb _ L
cb b -> back _ L
cb _ -> acc _ R
back a -> back a L
back b -> back b L
back _ -> q0 _ R
~~~

The state names <code>ra</code>/<code>rb</code> *store one symbol in the finite control* — the same trick as a DFA remembering the last symbol read. In <code>ca</code>, reading a blank means the remembered $a$ was the middle symbol of an odd palindrome.

### Example: unary arithmetic

TMs can compute functions: leave the output on the tape and halt. To add in unary, on input $1^m01^n$ produce $1^{m+n}$: change the 0 into a 1, run to the end, and erase the last 1.

~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 1 -> q0 1 R
q0 0 -> q1 1 R
q1 1 -> q1 1 R
q1 _ -> q2 _ L
q2 1 -> acc _ S
~~~

Unary multiplication $1^m01^n \mapsto 1^{mn}$ is a nested loop: for each 1 of the first block (crossed off one at a time), copy the entire second block to the output area at the right end, using marks to keep your place. At this point you should be convinced that anything you can do with nested loops and markers, a TM can do.

### Levels of description

1. **Formal:** the full transition table (as above).
2. **Implementation level:** English description of head movements and markings ("scan right to the first unmarked 1, mark it, return to the left end").
3. **High level:** an algorithm in pseudocode, operating on encoded objects ("on input $\langle G \rangle$, run BFS from $s$..."), justified by the Church–Turing thesis.

On exams you will mostly write levels 2 and 3. Say clearly *why the machine halts* when you claim a decider.

**Try it first.** Give an implementation-level description of a TM that decides $\{a^nb^{2n} : n \ge 0\}$, and argue that it halts on every input.

~~~reveal Solution
1. Scan the input once from left to right, checking it has the form $a^*b^*$ (a DFA pass). If not, **reject**. Return to the left end.
2. If the first unmarked cell is a blank, **accept** (only possible when the remaining input is empty). If it is an unmarked $a$: cross it off ($X$), scan right past $a$'s and crossed-off $Y$'s to the first unmarked $b$ and cross it off ($Y$); continue right to the next unmarked $b$ and cross it off. If either $b$ is missing (blank reached), **reject**. Return to the left end and repeat step 2.
3. If step 2 finds no unmarked $a$ but finds a crossed-off $Y$ or an unmarked $b$: scan right; **accept** iff no unmarked $b$ remains.

*Correctness:* each round pairs one $a$ with two $b$'s; we accept iff the $a$'s run out exactly when the $b$'s do. *Halting:* each round crosses off three cells and costs $O(n)$ steps, and there are at most $n/3$ rounds, so the machine halts in $O(n^2)$ steps on every input.
~~~

~~~~steps Designing a decider for $\{ww\}$ piece by piece
**High level first.** $x \in \{ww\}$ iff $|x|$ is even and $x_i = x_{n/2 + i}$ for all $i \le n/2$. The machine must (1) find the middle and (2) compare the halves. A TM has no counters, so both phases are done with **marks**.
+++
**Phase 1: find the middle by closing in from both ends.** Mark the leftmost unmarked symbol with an uppercase letter ($a \to A$, $b \to B$), then the rightmost unmarked symbol with a *different* mark ($a \to x$, $b \to y$). Repeat. Afterwards the first half is uppercase and the second half is $x/y$. If the two searches meet on the same cell (the right-hand search finds an uppercase letter), the length is odd: reject.
+++
**Phase 2: compare.** Repeatedly: go to the left end, skip crossed-off cells ($Z$), cross off the first uppercase letter, *remember it in the state*, move right to the first $x/y$ symbol (skipping $Z$'s in the second half), check that it matches, cross it off. Mismatch: reject. No uppercase letter left: accept.
+++
**The transition table.** <code>p0</code>–<code>p3</code> are phase 1, <code>c0</code>, <code>c1</code>, <code>ga</code>, <code>gb</code> phase 2. Missing transitions reject.
~~~tm
start: p0
accept: acc
reject: rej
blank: _
p0 a -> p1 A R
p0 b -> p1 B R
p0 x -> c0 x L
p0 y -> c0 y L
p0 _ -> acc _ R
p1 a -> p1 a R
p1 b -> p1 b R
p1 x -> p2 x L
p1 y -> p2 y L
p1 _ -> p2 _ L
p2 a -> p3 x L
p2 b -> p3 y L
p3 a -> p3 a L
p3 b -> p3 b L
p3 A -> p0 A R
p3 B -> p0 B R
c0 A -> c0 A L
c0 B -> c0 B L
c0 Z -> c0 Z L
c0 x -> c0 x L
c0 y -> c0 y L
c0 _ -> c1 _ R
c1 Z -> c1 Z R
c1 A -> ga Z R
c1 B -> gb Z R
c1 _ -> acc _ R
ga A -> ga A R
ga B -> ga B R
ga Z -> ga Z R
ga x -> c0 Z L
gb A -> gb A R
gb B -> gb B R
gb Z -> gb Z R
gb y -> c0 Z L
~~~
Try <code>abab</code> (accept), <code>abba</code> (reject in phase 2) and <code>aba</code> (reject in phase 1).
+++
**Halting and time.** Every round of either phase marks at least one new cell and walks across the tape at most twice, so the machine halts within $O(n^2)$ steps on every input. With a second tape the same language can be decided in $O(n)$ steps (copy the input, find the middle with a half-speed head, compare in one pass).
~~~~

### Writing high-level deciders

Most exam questions about decidability ask for a **high-level** decider that takes an *encoding* as input. Use this shape:

~~~pseudo
On input ⟨X⟩:
    0. If the input is not a valid encoding, reject.
    1. ... (a finite, explicit algorithm; every loop has a bound;
            every subroutine you call is a decider)
    2. Accept if ..., otherwise reject.
~~~
and then argue (a) **it halts** — name the bound on every loop and every simulation — and (b) **it is correct** — if the input is in the language it accepts, and if not it rejects.

The things you may safely do: simulate a DFA, NFA or PDA on a given string (they read one symbol per step; for an NFA, track the set of states), search a finite graph, try all strings up to a fixed length, simulate a TM **for a bounded number of steps**, convert between equivalent models (NFA $\to$ DFA, CFG $\to$ CNF), and call any decider already proved to exist. The thing you may **not** do: simulate an arbitrary TM with no bound and wait for the answer.

**Try it first.** Prove that $\{\langle D\rangle : D \text{ is a DFA over } \{a,b\} \text{ that accepts at least one palindrome}\}$ is decidable.

~~~reveal Solution
The palindromes $\mathrm{PAL}$ form a CFL and $L(D)$ is regular, so $L(D) \cap \mathrm{PAL}$ is context-free — and the closure proof is **constructive**: from $D$ and a PDA (or grammar) for $\mathrm{PAL}$ we can mechanically build a PDA for the intersection (product construction) and convert it to a grammar $G_D$. Decider:
1. Check $\langle D\rangle$ is a valid DFA encoding.
2. Construct the grammar $G_D$ with $L(G_D) = L(D) \cap \mathrm{PAL}$.
3. Run the $E_{\mathrm{CFG}}$ decider (mark the generating nonterminals) on $G_D$. Accept iff $L(G_D) \ne \emptyset$.

Every step is a terminating construction or a decider, so this halts; it accepts iff $D$ accepts some palindrome. (A tempting wrong answer: "for each palindrome $p$, run $D$ on $p$" — this never terminates when $D$ accepts no palindrome.)
~~~

**Try it first.** Which of these procedures are deciders? (i) On input $\langle M\rangle$: run $M$ on $\varepsilon$ for $|\langle M\rangle|$ steps; accept iff it accepted. (ii) On input $\langle M\rangle$: for each string $x$ in shortlex order, run $M$ on $x$ for $|x|$ steps; accept if it accepts. (iii) On input $\langle M\rangle$: run $M$ on $\langle M\rangle$; if it accepts, reject; otherwise accept.

~~~reveal Solution
- (i) **Decider**: one simulation with a fixed bound computed from the input.
- (ii) **Not a decider**: each simulation is bounded, but there are infinitely many strings $x$; if $M$ never accepts within the bound, the loop runs forever. (It is a recognizer for $\{\langle M\rangle : \exists x,\ M \text{ accepts } x \text{ within } |x| \text{ steps}\}$.)
- (iii) **Not a decider**: if $M$ loops on $\langle M\rangle$, so does the procedure. Also, "otherwise accept" conflates rejecting and looping — a typical bug.
~~~

## Variants, and why they are all equivalent

A model is "equivalent" to standard TMs if each can simulate the other, so they recognize (and decide) exactly the same languages.

- **Stay option** (move $0$): simulate a stay by moving right into a special intermediate state and then moving left.
- **Two-way infinite tape:** fold the tape in half: use a two-track tape (tape alphabet $\Gamma \times \Gamma$) where track 1 holds cells $0, 1, 2, \ldots$ and track 2 holds cells $-1, -2, \ldots$; the state remembers which track the head is on (moves on the lower track are reversed). Conversely, a one-way tape is simulated by a two-way tape with a left-end marker.
- **Multiple tapes** ($k$ tapes, $k$ independent heads): store all $k$ tapes on one tape, separated by delimiters (or as $k$ tracks), with each simulated head position marked by a dotted symbol. To simulate one step, sweep the whole used region to read the $k$ marked symbols (remembering them in the state), then sweep again to update them, shifting cells right if a tape grows. If the multi-tape machine runs $t$ steps, it uses at most $t$ cells per tape, so each simulated step takes $O(t)$ time and the whole simulation takes $O(t^2)$.
- **Multiple heads, 2D tape, RAM / random access:** similar bookkeeping simulations, each with a polynomial slowdown.
- **Nondeterministic TMs:** the computation is a tree of configurations; $N$ accepts $w$ if *some* branch accepts. A deterministic TM explores the tree **breadth-first** (depth-first could get stuck forever on an infinite branch). If an accepting branch exists at depth $d$, BFS finds it; so the deterministic machine recognizes $L(N)$. The simulation can take time exponential in $d$.
- **Two-stack PDA:** the two stacks hold the tape to the left and to the right of the head; moving the head pops one stack and pushes the other. So two stacks = a tape. (One stack is strictly weaker: that's a PDA.)
- **Counter machines:** even a machine with just two counters (increment, decrement, test-for-zero) is Turing complete, though the simulation is very slow.

> **Key idea.** Turing machines are **robust**: every reasonable extension can be simulated by the basic model, typically with at most a polynomial slowdown (an exponential one for nondeterminism, as far as anyone knows). That robustness is evidence for the Church–Turing thesis.

### How to write an equivalence proof

"Model $X$ is equivalent to standard TMs" means **two simulations**: every standard TM can be simulated by an $X$-machine, and every $X$-machine can be simulated by a standard TM. For each direction describe (1) how the simulated machine's whole configuration is **represented** (tape layout, extra tape symbols, what the state remembers), (2) how **one step** is simulated, (3) **initialization** (converting the input into the representation), and (4) that **accept/reject/loop is preserved**. If the question asks about time, bound the cost of one simulated step.

> **Theorem.** If a $k$-tape TM $M$ halts within $t(n) \ge n$ steps on inputs of length $n$, then some single-tape TM $M'$ with $L(M') = L(M)$ halts within $O(t(n)^2)$ steps.

*Proof.* *Representation:* $M'$ uses tape symbols that are $2k$-tuples: for each tape $j$, the symbol in that cell of tape $j$ and a bit saying whether head $j$ is there. *Initialization:* rewrite the input into this form ($O(n)$). *One step:* sweep right across the used region, collecting the $k$ symbols under the head marks in the finite control (finitely many possibilities, so the state can hold them); now $\delta$ determines the new state, written symbols and moves; sweep back, updating each marked cell and moving each mark one cell. *Halting:* $M'$ enters accept/reject exactly when $M$ does. *Time:* after $s$ steps no head of $M$ has moved more than $s$ cells, so the used region has length at most $n + t(n) + 1 = O(t(n))$; each simulated step costs $O(t(n))$, and there are at most $t(n)$ of them. Total $O(n) + t(n)\cdot O(t(n)) = O(t(n)^2)$. $\blacksquare$

> **Theorem.** For every nondeterministic TM $N$ there is a deterministic TM $D$ with $L(D) = L(N)$; if every branch of $N$ halts on every input, $D$ can be made a decider.

*Proof.* Let $b$ be the maximum number of choices in any configuration of $N$. $D$ tries every **choice string** $c \in \{1, \ldots, b\}^*$ in order of length: it simulates $N$ on $w$ for $|c|$ steps, using $c_i$ to resolve the $i$-th choice, and accepts if this branch accepts. This is breadth-first search of the computation tree, so an accepting branch of length $d$ is found after finitely many trials. If all branches halt, the tree is finitely branching with no infinite path, hence finite (König's lemma) with some depth $d^*$. So modify $D$: after trying all choice strings of length $d$, if not a single branch was still running after $d$ steps, reject. This happens by $d = d^* + 1$ at the latest, so $D$ always halts. $\blacksquare$

## Encodings

Every finite object — a number, a graph, a grammar, a DFA, *a Turing machine* — can be encoded as a finite string over a fixed alphabet. We write $\langle X \rangle$ for an encoding of $X$ and $\langle M, w \rangle$ for an encoding of a pair. For a TM, list the states, symbols and transitions, e.g. encoding states and symbols as binary numbers.

Consequences:

- There are only **countably many** Turing machines (each is a finite string), but **uncountably many** languages. So most languages are not even recognizable.
- Machines can take other machines as input. "Is a given DFA's language empty?" becomes the language $\{\langle D \rangle : L(D) = \emptyset\}$, which is decidable (graph search from the start state).

## The universal Turing machine

> **Theorem.** There is a single Turing machine $U$ (the **universal TM**) such that for every TM $M$ and input $w$, $U$ on input $\langle M, w \rangle$ simulates $M$ on $w$: it accepts if $M$ accepts $w$, rejects if $M$ rejects $w$, and loops if $M$ loops on $w$.

Implementation idea ($U$ with three tapes): tape 1 holds $\langle M \rangle$, tape 2 holds $M$'s simulated tape (each cell an encoded symbol), tape 3 holds $M$'s current state. Each step, $U$ looks up the transition for (state, symbol) in $\langle M \rangle$ and updates tapes 2 and 3. Converting to one tape costs only a polynomial slowdown.

$U$ is a *programmable computer*: one fixed machine that runs any program. Consequence: $\mathrm{ACCEPT} = \{\langle M, w\rangle : M \text{ accepts } w\}$ is recognizable (by $U$). It is not decidable — that is the next topic.

## The Church–Turing thesis

> **Key idea.** (Church–Turing thesis) Every function that can be computed by an effective, mechanical procedure — any "algorithm" — can be computed by a Turing machine.

It is a **thesis**, not a theorem: "effective procedure" is an informal notion, so it cannot be proved. The evidence is that every proposed model of computation (lambda calculus, recursive functions, RAM machines, real programming languages) turns out to be equivalent to Turing machines. In practice the thesis is what lets us describe TMs in high-level pseudocode: if you can write the algorithm, a TM can run it.

> **Exam tip.** When asked to "describe a TM" in a reduction or decidability proof, a clear high-level algorithm is expected — not a transition table. When asked to design a TM for a specific language at the formal level, give the states with English descriptions of what each one is doing.

## Enumerators

An **enumerator** is a TM with a printer: started on a blank tape, it prints a (possibly infinite) list of strings. It *enumerates* the set of strings it ever prints (repetitions allowed). The name "recursively enumerable" comes from this view.

> **Theorem.** $L$ is recognizable if and only if some enumerator enumerates $L$.

*Proof.* ($\Leftarrow$) On input $x$, run the enumerator and accept if it ever prints $x$. ($\Rightarrow$) Let $M$ recognize $L$ and let $w_1, w_2, \ldots$ be all strings in shortlex order. The enumerator dovetails: for $t = 1, 2, 3, \ldots$, run $M$ for $t$ steps on each of $w_1, \ldots, w_t$, and print those accepted. A string accepted after $s$ steps, with index $i$, is printed in round $\max(i, s)$; nothing outside $L$ is ever printed. $\blacksquare$

> **Theorem.** An infinite language $L$ is decidable if and only if some enumerator prints exactly $L$ in strictly increasing shortlex order.

*Proof sketch.* ($\Rightarrow$) Run the decider on $w_1, w_2, \ldots$ in order and print the accepted ones. ($\Leftarrow$) On input $x$, run the enumerator until it prints $x$ (accept) or a string larger than $x$ (reject); because $L$ is infinite and only finitely many strings precede $x$, one of the two happens. $\blacksquare$

**Try it first.** Prove that every infinite recognizable language $L$ has an infinite **decidable** subset.

~~~reveal Solution
Let $E$ enumerate $L$. Build an enumerator $E'$ that runs $E$ and prints a string only if it is **larger** in shortlex order than every string $E'$ has printed so far. Since $L$ is infinite and only finitely many strings are at most any given string, $E$ keeps printing strings larger than the current maximum, so $E'$ prints infinitely many strings — an infinite subset $L' \subseteq L$, printed in strictly increasing order. By the previous theorem, $L'$ is decidable. $\blacksquare$
~~~

## Counting configurations: when halting *is* decidable

A configuration is (state, head position, tape contents). If a machine is confined to $n$ cells, it has at most $|Q| \cdot n \cdot |\Gamma|^n$ configurations. A deterministic machine that ever repeats a configuration repeats it forever, so:

> **Theorem.** If $M$ never uses more than $n$ cells on input $w$, then $M$ either halts on $w$ within $|Q|\cdot n\cdot|\Gamma|^n$ steps or never halts.

So halting and acceptance are **decidable** for linear bounded automata (machines that never leave their input cells): simulate for that many steps. The same counting idea appears in the next topic — e.g. "does $M$ ever move left on input $w$?" is decidable, because a machine that only moves right sees blanks after the input and must repeat a state within $|Q|$ steps. The general halting problem is undecidable precisely because an unrestricted machine has unboundedly many configurations.

## Common exam problem patterns

| Pattern | Recipe |
|---|---|
| **Formal TM for a specific language** | Pick marks ($X$, $Y$, uppercase copies); one state per "phase" with an English comment; reject via missing transitions; check $\varepsilon$, one symbol, and an out-of-order string. Give the halting argument (cells marked per round). |
| **Implementation-level description** | Numbered steps of head movements and markings ("scan right to the first unmarked $b$, cross it off, return to the left end"). State what is crossed off per round and why the loop terminates. |
| **High-level decider for a question about encoded objects** | Check encoding; finite algorithm (graph search, bounded simulation, conversion between models, a known decider); halting argument; both directions of correctness. |
| **Closure of decidable languages** | Run deciders one after another; complement by swapping; try all splits for concatenation/star. |
| **Closure of recognizable languages** | Never wait on a recognizer that might loop: run in parallel (union) or dovetail (concatenation, star). Complement is NOT closed. |
| **Equivalence of a TM variant** | Two simulations; for each: representation, one step, initialization, halting/acceptance preserved, (time bound if asked). |
| **Decidable iff $L$ and $\overline{L}$ recognizable** | Run the two recognizers alternately; exactly one accepts. |
| **Enumerators** | Recognizer $\leftrightarrow$ enumerator via dovetailing; decidable $\leftrightarrow$ enumerated in shortlex order (for infinite $L$). |
| **Configuration counting** | Bounded space $\Rightarrow$ bounded number of configurations $\Rightarrow$ simulate that long; if not halted, it loops. |

## Where students lose points

- **A "decider" that might not halt.** Running an arbitrary TM (or a recognizer) with no step bound, or looping over infinitely many strings, inside something claimed to be a decider.
- **No halting argument.** For every decider, say why each loop ends ("each round crosses off two symbols", "at most $|V|$ rounds", "simulate at most $t$ steps").
- **Treating "does not accept" as "rejects".** $x \notin L(M)$ if $M$ rejects *or loops*. Swapping accept/reject only complements a **decider's** language.
- **Sequential simulation of recognizers** for union or concatenation (one loop blocks everything). Use alternation/dovetailing.
- **Transition tables without explanation.** Give each state a one-line meaning; graders cannot reverse-engineer 20 transitions.
- **Forgetting edge cases:** the empty input, the blank to the left of the input (moving left from cell 0 on a one-way tape), odd lengths, symbols out of order.
- **Proving only one direction of an equivalence** of models, or forgetting to say how the input is converted into the simulated representation.
- **Confusing models:** a PDA with one stack is weaker than a TM; with two stacks it is equivalent. Nondeterminism does not change what TMs can recognize.

## Self-check

1. Can a Turing machine that decides $L$ ever loop? Can a recognizer for $L$ loop on a string in $L$?

~~~reveal Answer
A decider never loops — it halts on every input. A recognizer for $L$ must accept (hence halt on) every string in $L$; it may loop only on strings **not** in $L$.
~~~

2. $M$ recognizes $L$. Does the machine "run $M$; if it accepts, reject; if it rejects, accept" recognize $\overline{L}$?

~~~reveal Answer
No. On strings where $M$ loops (which are in $\overline{L}$), the new machine also loops and does not accept them. It works only when $M$ is a decider.
~~~

3. What is the maximum number of configurations of a machine with 10 states and 4 tape symbols that stays within 5 cells?

~~~reveal Answer
$10 \cdot 5 \cdot 4^5 = 10 \cdot 5 \cdot 1024 = 51{,}200$.
~~~

4. Why does the deterministic simulation of an NTM use breadth-first rather than depth-first search?

~~~reveal Answer
Some branches may be infinite. DFS could go down an infinite branch forever and never reach an accepting branch elsewhere; BFS examines every configuration at depth $d$ before depth $d + 1$, so any accepting configuration at finite depth is reached.
~~~

5. True or false: if $L_1$ and $L_2$ are recognizable, then $L_1 \setminus L_2$ is recognizable.

~~~reveal Answer
False in general. With $L_1 = \Sigma^*$ (decidable) and $L_2 = \mathrm{HALT}$ (recognizable), $L_1 \setminus L_2 = \overline{\mathrm{HALT}}$, which is not recognizable. (If $L_2$ is *decidable*, then $L_1 \setminus L_2 = L_1 \cap \overline{L_2}$ is recognizable.)
~~~

6. Is $\{\langle M\rangle : M \text{ has exactly 374 states}\}$ decidable? Is $\{\langle G\rangle : G \text{ is a CFG and } L(G) = \emptyset\}$?

~~~reveal Answer
Both are decidable. The first is a syntactic check of the encoding. The second: repeatedly mark nonterminals that have a rule whose right side consists of terminals and marked nonterminals; after at most $|V|$ rounds, $L(G) = \emptyset$ iff the start symbol is unmarked.
~~~

7. A k-tape machine runs in time $n^2$. How fast is the standard single-tape simulation?

~~~reveal Answer
$O((n^2)^2) = O(n^4)$: each of the $t(n) = n^2$ simulated steps sweeps a region of length $O(t(n))$.
~~~
`,
  cheatsheet: String.raw`## Definition

- $M = (\Gamma, \square, \Sigma, Q, \mathit{start}, \mathit{accept}, \mathit{reject}, \delta)$, $\delta : (Q \setminus \{acc, rej\}) \times \Gamma \to Q \times \Gamma \times \{-1, +1\}$.
- Configuration $u\,q\,v$: state $q$, tape $uv$, head on first symbol of $v$.
- On input $w$: **accept**, **reject**, or **loop**. $L(M)$ = accepted strings (rejected AND looped strings are outside).

## Classes

- **Recognizable / acceptable / r.e.:** $L = L(M)$ for some TM.
- **Decidable / recursive:** $L = L(M)$ for a TM that halts on all inputs.
- Decidable $\subsetneq$ recognizable. $L$ decidable $\iff$ $L$ and $\overline{L}$ recognizable (run both alternately).

## Closure

| Operation | Decidable | Recognizable |
|---|---|---|
| $\cup$ | run one, then other | **parallel** |
| $\cap$ | run both | run both |
| complement | swap acc/rej | **NO** |
| concatenation | try all splits | **dovetail** |
| star | all splittings / DP | **dovetail** |

## Design tricks

- Mark symbols ($X$, $Y$); shuttle; remember a symbol in the state; blank left of the input = left-end marker.
- $0^n1^n$: cross off leftmost 0 and leftmost 1; $O(n^2)$.
- Palindromes: erase first, compare with last, repeat.
- $ww$: mark alternately from both ends to find the middle, then compare halves. 2 tapes: $O(n)$.
- $a^ib^jc^k$, $k = ij$: nested loop, restore $B \to b$ after each inner loop.
- Check the format ($a^*b^*c^*$) in a first DFA pass.
- Binary increment: go to the right end; $1 \to 0$ moving left until a 0 or blank becomes 1.

## High-level decider template

~~~pseudo
On input ⟨X⟩:
    reject if not a valid encoding
    finite algorithm: graph search / bounded simulation /
        model conversion / call known deciders
    accept or reject
Then: why it halts (bound on every loop) + why it is correct
~~~
- Safe: simulate DFA/NFA/PDA on a string, simulate a TM for $t$ steps, BFS on a finite graph, CNF + CYK, try all strings up to a fixed length.
- Unsafe: unbounded simulation of an arbitrary TM; looping over all strings.

## Known decidable problems

- $A_{\mathrm{DFA}}$, $E_{\mathrm{DFA}}$, $EQ_{\mathrm{DFA}}$ (symmetric difference), $A_{\mathrm{CFG}}$ (CYK), $E_{\mathrm{CFG}}$ (mark generating nonterminals).
- $\{\langle M, w, 1^t\rangle : M$ accepts $w$ within $t$ steps$\}$; halting for LBAs.

## Equivalent variants

| Variant | Simulation | Cost |
|---|---|---|
| stay option | right then left | $O(t)$ |
| two-way tape | fold into 2 tracks | $O(t)$ |
| $k$ tapes | tracks + head marks, sweep | $O(t^2)$ |
| nondeterministic | BFS of config tree | exponential |
| 2-stack PDA | stacks = left/right of head | polynomial |
| RESET instead of L | marks + rescans | polynomial |
| only R/S moves | **weaker: regular only** | — |
| 1-stack PDA | **weaker: CFLs only** | — |

Equivalence proof = two simulations, each with representation, one step, initialization, acceptance preserved.

## Enumerators

- $L$ recognizable $\iff$ enumerated by some enumerator (dovetail: round $t$ runs $t$ steps on $w_1..w_t$).
- Infinite $L$ decidable $\iff$ enumerated in increasing shortlex order.
- Every infinite recognizable $L$ has an infinite decidable subset.

## Big ideas

- Encodings $\langle M \rangle$, $\langle M, w\rangle$: TMs are countable; languages are not.
- Universal TM $U$: simulates $M$ on $w$; ACCEPT is recognizable (not decidable).
- Church–Turing thesis: algorithm = TM (a thesis, not provable).
- Configurations within $n$ cells: $|Q| \cdot n \cdot |\Gamma|^n$; exceed it $\Rightarrow$ loops forever.
`,
  quiz: [
    {
      type: 'tf',
      q: 'If a Turing machine M loops forever on input w, then w is not in L(M).',
      answer: true,
      explain: 'L(M) is the set of strings M accepts. Rejecting and looping both keep w out of L(M). The difference matters for deciders: a decider must halt (accept or reject) on every input.'
    },
    {
      type: 'tf',
      q: 'Every decidable language is recognizable, and every recognizable language is decidable.',
      answer: false,
      explain: 'The first half is true (a decider is in particular a recognizer). The second half is false: the halting problem is recognizable (simulate and accept if it halts) but not decidable.'
    },
    {
      type: 'mc',
      q: 'A language L is decidable if and only if...',
      choices: [
        'L is recognizable',
        'L and its complement are both recognizable',
        'L is finite',
        'L is accepted by a nondeterministic TM'
      ],
      answer: 1,
      explain: 'If L and its complement are both recognizable, run both recognizers in parallel (alternating steps); exactly one accepts eventually, so the combined machine always halts. Conversely a decider for L gives recognizers for both. Finite languages are decidable but not conversely; NTMs recognize exactly the recognizable languages.'
    },
    {
      type: 'tf',
      q: 'A k-tape Turing machine that runs in time t(n) can be simulated by a single-tape Turing machine in time O(t(n)^2).',
      answer: true,
      explain: 'Each simulated step sweeps the used portion of the single tape, which has length O(t(n)) because each tape uses at most t(n) cells. t(n) steps times O(t(n)) per step gives O(t(n)^2).'
    },
    {
      type: 'tf',
      q: 'Nondeterministic Turing machines recognize strictly more languages than deterministic Turing machines.',
      answer: false,
      explain: 'A deterministic TM can explore the computation tree of an NTM breadth-first and accept if any branch accepts. Nondeterminism gives no extra computability (it may give speed: P vs NP is about time, not power). Depth-first search would not work because a branch may be infinite.'
    },
    {
      type: 'mc',
      q: 'Which of these models is NOT equivalent in power to a standard Turing machine?',
      choices: ['A TM with a two-way infinite tape', 'A pushdown automaton with two stacks', 'A pushdown automaton with one stack', 'A TM with a stay-put move'],
      answer: 2,
      explain: 'A single-stack PDA recognizes only context-free languages (it cannot even do a^n b^n c^n). Two stacks can simulate a tape (left and right of the head), and the two-way tape and stay option are easy to simulate on a standard TM.'
    },
    {
      type: 'tf',
      q: 'The Church-Turing thesis is a theorem proved by Turing in 1936.',
      answer: false,
      explain: 'It is a thesis (a hypothesis about the informal notion of "effective procedure") and cannot be formally proved. It is supported by the equivalence of every reasonable model of computation proposed so far.'
    },
    {
      type: 'tf',
      q: 'There is a single Turing machine U that, given the encoding of any TM M and any input w, accepts exactly when M accepts w.',
      answer: true,
      explain: 'That is the universal Turing machine. Note U loops when M loops on w, so U is a recognizer for ACCEPT, not a decider.'
    },
    {
      type: 'mc',
      q: String.raw`A TM has state set $Q$ and tape alphabet $\Gamma$, and on some input it never moves its head outside the first $n$ cells. How many distinct configurations can it be in?`,
      choices: [String.raw`$|Q| + n + |\Gamma|$`, String.raw`$|Q| \cdot n \cdot |\Gamma|$`, String.raw`$|Q| \cdot n \cdot |\Gamma|^n$`, 'Infinitely many'],
      answer: 2,
      explain: String.raw`A configuration is (state, head position, tape contents): $|Q|$ choices, $n$ choices and $|\Gamma|^n$ choices. Consequence: if the machine runs longer than $|Q| \cdot n \cdot |\Gamma|^n$ steps within those cells, some configuration repeats and it loops forever — so halting is decidable for space-bounded machines.`
    },
    {
      type: 'tf',
      q: 'The set of all Turing machines is countable, but the set of all languages over {0,1} is uncountable.',
      answer: true,
      explain: 'Each TM has a finite encoding as a binary string, and there are countably many finite strings. Languages are arbitrary subsets of the countable set {0,1}*, and the power set of a countable infinite set is uncountable (Cantor). Hence some languages are not recognized by any TM.'
    },
    {
      type: 'mc',
      q: 'Why does a deterministic simulation of a nondeterministic TM use breadth-first rather than depth-first search of the computation tree?',
      choices: [
        'BFS uses less memory',
        'DFS may follow an infinite branch forever and miss an accepting branch',
        'DFS cannot be implemented on a Turing machine',
        'BFS runs in polynomial time'
      ],
      answer: 1,
      explain: 'Some branches of an NTM may run forever. DFS could commit to such a branch and never return, even though another branch accepts. BFS examines all configurations at depth d before depth d+1, so any accepting configuration at finite depth is eventually found. BFS still takes exponential time in general.'
    },
    {
      type: 'tf',
      q: String.raw`The language $\{a^nb^nc^n : n \ge 0\}$ is decidable.`,
      answer: true,
      explain: 'A TM can cross off one a, one b and one c per pass and check the final tape, halting on every input in O(n^2) steps. This language is not context-free, but deciders are much more powerful than PDAs.'
    },
    {
      type: 'multi',
      q: 'Which statements about a decider M for a language L are true? (select all that apply)',
      choices: [
        'M halts on every input string',
        'M accepts every string in L',
        'M may loop on strings not in L',
        'Swapping the accept and reject states of M gives a decider for the complement of L'
      ],
      answer: [0, 1, 3],
      explain: 'A decider halts on every input, accepting exactly L. Because it never loops, swapping accept/reject gives a decider for the complement. A machine allowed to loop on strings outside L is merely a recognizer; swapping its halting states does NOT give a recognizer for the complement (looping strings stay looping).'
    },
    {
      type: 'tf',
      q: 'If M is a recognizer for L, then swapping the accept and reject states of M gives a recognizer for the complement of L.',
      answer: false,
      explain: 'Strings on which M loops are not in L, so they belong to the complement — but after the swap M still loops on them and does not accept them. The swap works only for deciders. (HALT is recognizable while its complement is not.)'
    },
    {
      type: 'mc',
      q: 'L1 and L2 are recognizable, with recognizers M1 and M2. Which machine recognizes L1 ∪ L2?',
      choices: [
        'Run M1 on x; if it accepts, accept; otherwise run M2 on x and return its answer',
        'Run M1 and M2 on x in parallel, alternating steps; accept as soon as either accepts',
        'Run M2 on x; if it rejects, run M1',
        'Union of recognizable languages need not be recognizable'
      ],
      answer: 1,
      explain: 'The sequential versions fail when the first machine LOOPS on a string the second machine accepts — "otherwise" never happens. Alternating single steps guarantees that whichever machine accepts gets to do so after finitely many steps. Recognizable languages are closed under union.'
    },
    {
      type: 'tf',
      q: 'For deciders M1 and M2, the machine "run M1 on x, then run M2 on x, accept iff both accept" decides L(M1) ∩ L(M2).',
      answer: true,
      explain: 'Deciders always halt, so running them one after the other is safe. Dovetailing is only needed when a subroutine might loop.'
    },
    {
      type: 'tf',
      q: 'Every finite language is decidable.',
      answer: true,
      explain: 'A finite language is regular (a DFA can hard-code the finitely many strings), and every regular language is decidable. This holds even if we do not know which finite language it is.'
    },
    {
      type: 'mc',
      q: 'An enumerator prints exactly the strings of an infinite language L, in increasing shortlex order. What can you conclude?',
      choices: ['L is recognizable but maybe not decidable', 'L is decidable', 'L is context-free', 'Nothing'],
      answer: 1,
      explain: 'To decide x, run the enumerator until it prints x (accept) or prints a string that comes after x in shortlex order (reject). Because L is infinite, one of these happens. Without the ordering, an enumerator only gives a recognizer.'
    },
    {
      type: 'tf',
      q: 'A language is recognizable if and only if some enumerator enumerates it.',
      answer: true,
      explain: 'Enumerator ⇒ recognizer: accept x when it is printed. Recognizer ⇒ enumerator: dovetail — in round t, run the recognizer t steps on each of the first t strings and print the ones accepted.'
    },
    {
      type: 'mc',
      q: 'A TM may move only Right or Stay (never Left), but it may write. Which languages can such machines recognize?',
      choices: ['Exactly the regular languages', 'Exactly the context-free languages', 'Exactly the recognizable languages', 'Only finite languages'],
      answer: 0,
      explain: 'Once the head leaves a cell it never returns, so whatever it wrote there is never read again (except via Stay moves on that same cell, which only carry finite information). The machine is effectively a DFA reading its input once. Replacing "Left" by "Reset to the left end", on the other hand, keeps full Turing power.'
    },
    {
      type: 'tf',
      q: 'A linear bounded automaton (a TM that never leaves the cells of its input) either halts on input w within |Q| · n · |Γ|^n steps or never halts.',
      answer: true,
      explain: 'There are at most |Q| (states) · n (head positions) · |Γ|^n (tape contents) configurations. A deterministic machine that runs longer repeats a configuration and then cycles forever. So halting for LBAs is decidable.'
    },
    {
      type: 'mc',
      q: 'Which of these is a valid reason that a high-level "decider" might fail to be a decider?',
      choices: [
        'It uses several tapes',
        'It calls a subroutine that simulates an arbitrary TM M on some input without a step bound',
        'It runs in exponential time',
        'It uses nondeterminism in which every branch halts'
      ],
      answer: 1,
      explain: 'Simulating an arbitrary machine without a bound may never return. Multiple tapes and exponential running time are irrelevant to decidability, and an NTM all of whose branches halt can be converted into a deterministic decider.'
    },
    {
      type: 'tf',
      q: 'If a 1-tape TM decides L in time O(n), then L is regular.',
      answer: true,
      explain: 'A classic (nontrivial) theorem: single-tape machines running in time o(n log n) only decide regular languages. With two tapes, nonregular languages like {0^n 1^n} and {ww} can be decided in O(n) time.'
    },
    {
      type: 'multi',
      q: 'Which of these can be simulated by a standard single-tape TM with at most a polynomial slowdown? (select all that apply)',
      choices: ['A k-tape TM', 'A TM with a two-way infinite tape', 'A TM with a 2-dimensional tape', 'A RAM machine with unit-cost operations on numbers of polynomially bounded size', 'A nondeterministic TM (as far as anyone knows)'],
      answer: [0, 1, 2, 3],
      explain: 'Multi-tape: O(t^2). Two-way tape: O(t). 2-D tape: polynomial (store the visited region row by row). RAM with polynomial-size numbers: polynomial. Nondeterminism: the known simulation (BFS over the computation tree) is exponential; whether a polynomial simulation exists is essentially the P vs NP question.'
    },
    {
      type: 'tf',
      q: 'The universal TM U decides the language ACCEPT = {⟨M, w⟩ : M accepts w}.',
      answer: false,
      explain: 'U recognizes ACCEPT: it accepts exactly when M accepts w. When M loops on w, U loops too, so U is not a decider — and no decider for ACCEPT exists.'
    },
    {
      type: 'mc',
      q: 'The language {⟨M, w, 1^t⟩ : M accepts w within t steps} is...',
      choices: ['Undecidable, because it involves running M', 'Recognizable but not decidable', 'Decidable', 'Not recognizable'],
      answer: 2,
      explain: 'Simulate M on w for at most t steps; this always halts. "It runs another machine" does not make a problem undecidable — only unbounded simulation can loop.'
    },
    {
      type: 'tf',
      q: 'Decidable languages are closed under concatenation and Kleene star.',
      answer: true,
      explain: 'Concatenation: try all |x|+1 splits, running both deciders (which always halt). Star: try all splittings into nonempty pieces, or use DP over prefixes. Finitely many halting runs either way.'
    }
  ],
  flashcards: [
    { front: 'Formal definition of a Turing machine', back: String.raw`$(\Gamma, \square, \Sigma, Q, \mathit{start}, \mathit{accept}, \mathit{reject}, \delta)$ with $\delta : (Q \setminus \{acc, rej\}) \times \Gamma \to Q \times \Gamma \times \{-1,+1\}$.` },
    { front: 'Configuration', back: String.raw`(state, tape contents, head position), written $u\,q\,v$: tape $uv$, state $q$, head on the first symbol of $v$.` },
    { front: 'Three possible outcomes of running M on w', back: 'Accept, reject, or loop forever. Only accept puts w in L(M).' },
    { front: 'Recognizable (acceptable) language', back: 'L = L(M) for some TM M (M may loop on strings not in L).' },
    { front: 'Decidable language', back: 'L = L(M) for some TM M that halts on every input (a decider).' },
    { front: 'Decidable iff ...', back: 'Both L and its complement are recognizable (run both recognizers in parallel).' },
    { front: 'Simulating k tapes on one tape', back: String.raw`Store tapes as tracks with marked head positions; sweep to read and update. $t$ steps become $O(t^2)$ steps.` },
    { front: 'Simulating a nondeterministic TM', back: 'Breadth-first search of the configuration tree (DFS can get stuck on infinite branches). Same languages; exponential slowdown.' },
    { front: 'Two-stack PDA', back: 'Equivalent to a TM: one stack holds the tape left of the head, the other the tape from the head rightward.' },
    { front: 'Universal Turing machine', back: String.raw`A TM $U$ with $U(\langle M, w\rangle)$ = whatever $M$ does on $w$ (accept/reject/loop). Shows ACCEPT is recognizable.` },
    { front: 'Church-Turing thesis', back: 'Anything computable by an effective procedure is computable by a Turing machine. A thesis (not provable), supported by the equivalence of all reasonable models.' },
    { front: 'Why are there non-recognizable languages?', back: 'Countably many TMs (finite encodings) but uncountably many languages (subsets of Σ*).' },
    { front: 'Number of configurations within n cells', back: String.raw`$|Q| \cdot n \cdot |\Gamma|^n$. Exceed it and some configuration repeats, so the machine loops.` },
    { front: 'Dovetailing (why and how)', back: 'Used when subroutines might loop: in round t = 1, 2, 3, ..., run every candidate (strings, splits, machines) for t steps. Anything that would accept eventually does, and no single looping run blocks the others.' },
    { front: 'Closure: decidable languages', back: 'Union, intersection, complement, concatenation, star, difference — all closed (deciders may be run one after another).' },
    { front: 'Closure: recognizable languages', back: 'Union (parallel), intersection, concatenation and star (dovetail): closed. Complement: NOT closed (HALT).' },
    { front: 'Enumerator', back: 'TM that prints strings. L is recognizable iff some enumerator prints L. An infinite L is decidable iff some enumerator prints L in increasing shortlex order.' },
    { front: 'Right-only TM (moves R or S)', back: 'Recognizes exactly the regular languages: it can never reread a cell it has left. (Reset-to-left-end instead of Left keeps full power.)' },
    { front: 'Two-stack PDA simulating a TM', back: 'Left stack = tape left of the head (top nearest the head); right stack = head cell and the rest (top = head cell). Move right: pop right, push written symbol on left. Move left: write, pop left onto right.' },
    { front: 'Linear bounded automaton: why is halting decidable?', back: String.raw`At most $|Q|\cdot n\cdot|\Gamma|^n$ configurations; simulate that many steps — if it has not halted, a configuration repeated and it loops forever.` },
    { front: 'Deciders for DFA/CFG questions', back: 'A_DFA: simulate. E_DFA: reachability of an accepting state. EQ_DFA: emptiness of the symmetric difference (product). E_CFG: mark generating nonterminals. A_CFG: CNF + CYK (or all derivations of length 2n − 1).' },
    { front: 'Unary step bound trick', back: String.raw`$\{\langle M, w, 1^t\rangle : M \text{ accepts } w \text{ within } t \text{ steps}\}$ is decidable in time polynomial in the input — simulate $t$ steps.` },
    { front: 'How to write a high-level decider on an exam', back: '"On input ⟨...⟩: (1) check the encoding; (2) numbered algorithm steps; (3) accept/reject." Then: why it halts (every loop bounded, every subroutine a decider) and why it is correct (both accept and reject cases).' }
  ],
  problems: [
    {
      id: 'tm-0n1n',
      type: 'tm',
      title: String.raw`TM for $0^n1^n$`,
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Design a Turing machine that **decides** $\{0^n1^n : n \ge 0\}$. Your machine must halt on every input. (Use <code>_</code> for the blank; you may add tape symbols such as <code>X</code>, <code>Y</code>; a missing transition means reject.)`,
      accepts: function (s) {
        if (!/^0*1*$/.test(s)) return false;
        return 2 * (s.split('0').length - 1) === s.length;
      },
      sample: String.raw`start: q0
accept: acc
reject: rej
blank: _
q0 0 -> q1 X R
q0 Y -> q3 Y R
q0 _ -> acc _ R
q1 0 -> q1 0 R
q1 Y -> q1 Y R
q1 1 -> q2 Y L
q2 0 -> q2 0 L
q2 Y -> q2 Y L
q2 X -> q0 X R
q3 Y -> q3 Y R
q3 _ -> acc _ R`,
      maxLen: 6,
      hints: [
        'Cross off the leftmost 0 and then the leftmost 1, and return. Repeat.',
        'When you find a crossed-off 1 (Y) where you expected a 0, all 0s are used: check that only Ys remain.'
      ],
      solution: String.raw`States: <code>q0</code> = at the leftmost unmarked cell; <code>q1</code> = carrying a crossed-off 0 rightward to find a 1; <code>q2</code> = returning left to the last X; <code>q3</code> = all 0s used, verifying only Ys remain.

~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 0 -> q1 X R
q0 Y -> q3 Y R
q0 _ -> acc _ R
q1 0 -> q1 0 R
q1 Y -> q1 Y R
q1 1 -> q2 Y L
q2 0 -> q2 0 L
q2 Y -> q2 Y L
q2 X -> q0 X R
q3 Y -> q3 Y R
q3 _ -> acc _ R
~~~

Every missing transition rejects: e.g. <code>q0</code> reading 1 (a 1 before the 0s are matched), <code>q1</code> reading a blank (more 0s than 1s), <code>q3</code> reading 0 or 1 (leftover symbols). Each round marks two cells, so the machine halts after $O(n^2)$ steps.`
    },
    {
      id: 'tm-pal',
      type: 'tm',
      title: 'TM for palindromes',
      difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Design a Turing machine that decides the palindromes over $\{a, b\}$.`,
      accepts: function (s) { return s === s.split('').reverse().join(''); },
      sample: String.raw`start: q0
accept: acc
reject: rej
blank: _
q0 a -> ra _ R
q0 b -> rb _ R
q0 _ -> acc _ R
ra a -> ra a R
ra b -> ra b R
ra _ -> ca _ L
ca a -> back _ L
ca _ -> acc _ R
rb a -> rb a R
rb b -> rb b R
rb _ -> cb _ L
cb b -> back _ L
cb _ -> acc _ R
back a -> back a L
back b -> back b L
back _ -> q0 _ R`,
      maxLen: 6,
      hints: [
        'Erase the first symbol and remember it in the state (two different states for a and b).',
        'Run to the right end, step back, compare and erase the last symbol, run back to the left end.',
        'If after erasing the first symbol the comparison state sees a blank, the erased symbol was the middle one: accept.'
      ],
      solution: String.raw`~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 a -> ra _ R
q0 b -> rb _ R
q0 _ -> acc _ R
ra a -> ra a R
ra b -> ra b R
ra _ -> ca _ L
ca a -> back _ L
ca _ -> acc _ R
rb a -> rb a R
rb b -> rb b R
rb _ -> cb _ L
cb b -> back _ L
cb _ -> acc _ R
back a -> back a L
back b -> back b L
back _ -> q0 _ R
~~~

<code>ra</code>/<code>rb</code>: an $a$/$b$ was erased at the left end; run right. <code>ca</code>/<code>cb</code>: at the last remaining symbol; it must match (missing transition = reject on mismatch), or be a blank (the erased symbol was the center). <code>back</code>: return to the left end. Since erasing always uses blanks, the remaining input is always a contiguous block, and each round shrinks it by 2 — the machine halts within $O(n^2)$ steps.`
    },
    {
      id: 'tm-equal',
      type: 'tm',
      title: 'TM for equal numbers of a and b',
      difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Design a Turing machine that decides $\{w \in \{a,b\}^* : \#_a(w) = \#_b(w)\}$.`,
      accepts: function (s) {
        var d = 0;
        for (var i = 0; i < s.length; i++) d += (s[i] === 'a') ? 1 : -1;
        return d === 0;
      },
      sample: String.raw`start: q0
accept: acc
reject: rej
blank: _
q0 X -> q0 X R
q0 a -> fb X R
q0 b -> fa X R
q0 _ -> acc _ R
fb a -> fb a R
fb X -> fb X R
fb b -> back X L
fa b -> fa b R
fa X -> fa X R
fa a -> back X L
back a -> back a L
back b -> back b L
back X -> back X L
back _ -> q0 _ R`,
      maxLen: 6,
      hints: [
        'Pair each symbol with one of the opposite kind and cross both off.',
        'Find the first unmarked symbol; if it is an a, search right for an unmarked b (and vice versa). If none exists, reject.'
      ],
      solution: String.raw`~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 X -> q0 X R
q0 a -> fb X R
q0 b -> fa X R
q0 _ -> acc _ R
fb a -> fb a R
fb X -> fb X R
fb b -> back X L
fa b -> fa b R
fa X -> fa X R
fa a -> back X L
back a -> back a L
back b -> back b L
back X -> back X L
back _ -> q0 _ R
~~~

<code>q0</code> skips crossed-off cells to the first unmarked symbol. If it is $a$, cross it off and look right for an unmarked $b$ (state <code>fb</code>); if there is none, <code>fb</code> hits a blank and rejects. Then return to the left end (<code>back</code> stops at the blank before the input, which is never overwritten). If <code>q0</code> reaches a blank, every symbol has been paired: accept. Each round crosses off two symbols, so the machine halts in $O(n^2)$ steps.`
    },
    {
      id: 'tm-anbncn',
      type: 'tm',
      title: String.raw`TM for $a^nb^nc^n$`,
      difficulty: 3,
      alphabet: 'abc',
      prompt: String.raw`Design a Turing machine that decides $\{a^nb^nc^n : n \ge 0\}$ — a language that is not context-free.`,
      accepts: function (s) {
        var m = /^(a*)(b*)(c*)$/.exec(s);
        return !!m && m[1].length === m[2].length && m[2].length === m[3].length;
      },
      sample: String.raw`start: q0
accept: acc
reject: rej
blank: _
q0 a -> q1 X R
q0 Y -> q4 Y R
q0 _ -> acc _ R
q1 a -> q1 a R
q1 Y -> q1 Y R
q1 b -> q2 Y R
q2 b -> q2 b R
q2 Z -> q2 Z R
q2 c -> q3 Z L
q3 a -> q3 a L
q3 b -> q3 b L
q3 Y -> q3 Y L
q3 Z -> q3 Z L
q3 X -> q0 X R
q4 Y -> q4 Y R
q4 Z -> q5 Z R
q5 Z -> q5 Z R
q5 _ -> acc _ R`,
      maxLen: 6,
      hints: [
        'Extend the 0^n 1^n machine: per round, cross off one a (X), one b (Y) and one c (Z).',
        'When q0 sees a Y instead of an a, verify that the rest of the tape is Y...Y Z...Z followed by a blank.'
      ],
      solution: String.raw`~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 a -> q1 X R
q0 Y -> q4 Y R
q0 _ -> acc _ R
q1 a -> q1 a R
q1 Y -> q1 Y R
q1 b -> q2 Y R
q2 b -> q2 b R
q2 Z -> q2 Z R
q2 c -> q3 Z L
q3 a -> q3 a L
q3 b -> q3 b L
q3 Y -> q3 Y L
q3 Z -> q3 Z L
q3 X -> q0 X R
q4 Y -> q4 Y R
q4 Z -> q5 Z R
q5 Z -> q5 Z R
q5 _ -> acc _ R
~~~

- <code>q0</code>: at the leftmost unmarked cell. An $a$ starts a round; a $Y$ means all $a$'s are used; a blank means the input was empty.
- <code>q1</code>: skip $a$'s and $Y$'s, cross off the first $b$. Anything else (a $c$, $Z$ or blank) means there are too few $b$'s or the order is wrong: reject.
- <code>q2</code>: skip $b$'s and $Z$'s, cross off the first $c$. An $a$ or blank here rejects.
- <code>q3</code>: return to the rightmost $X$.
- <code>q4</code>, <code>q5</code>: verify the remainder is $Y^+Z^+$ then blank (an unmarked $b$ or $c$ left over rejects).

Each round crosses off three symbols and takes $O(n)$ steps, so the machine halts in $O(n^2)$ steps on every input.`
    },
    {
      id: 'tm-wcw',
      type: 'tm',
      title: String.raw`TM for $\{w\,c\,w\}$`,
      difficulty: 3,
      alphabet: 'abc',
      prompt: String.raw`Design a Turing machine that decides $\{w\,c\,w : w \in \{a,b\}^*\}$ over the alphabet $\{a,b,c\}$. (Example members: <code>c</code>, <code>aca</code>, <code>abcab</code>. Non-members: <code>ab</code>, <code>acb</code>, <code>acac</code>.)`,
      accepts: function (s) {
        var parts = s.split('c');
        return parts.length === 2 && parts[0] === parts[1];
      },
      sample: String.raw`start: q0
accept: acc
reject: rej
blank: _
q0 a -> ga X R
q0 b -> gb X R
q0 c -> chk c R
ga a -> ga a R
ga b -> ga b R
ga c -> ma c R
ma X -> ma X R
ma a -> bk1 X L
gb a -> gb a R
gb b -> gb b R
gb c -> mb c R
mb X -> mb X R
mb b -> bk1 X L
bk1 X -> bk1 X L
bk1 c -> bk2 c L
bk2 a -> bk2 a L
bk2 b -> bk2 b L
bk2 X -> q0 X R
chk X -> chk X R
chk _ -> acc _ R`,
      maxLen: 6,
      hints: [
        'Cross off the first unmarked symbol on the left of c, remembering it in the state.',
        'Go past the c and past the already crossed-off symbols on the right; the next symbol must match. Cross it off.',
        'When the left side is used up (q0 sees c), check that everything right of c is crossed off.'
      ],
      solution: String.raw`~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 a -> ga X R
q0 b -> gb X R
q0 c -> chk c R
ga a -> ga a R
ga b -> ga b R
ga c -> ma c R
ma X -> ma X R
ma a -> bk1 X L
gb a -> gb a R
gb b -> gb b R
gb c -> mb c R
mb X -> mb X R
mb b -> bk1 X L
bk1 X -> bk1 X L
bk1 c -> bk2 c L
bk2 a -> bk2 a L
bk2 b -> bk2 b L
bk2 X -> q0 X R
chk X -> chk X R
chk _ -> acc _ R
~~~

- <code>ga</code>/<code>gb</code>: an $a$/$b$ was crossed off on the left; go right to the $c$ (a blank here means there is no $c$: reject).
- <code>ma</code>/<code>mb</code>: skip crossed-off symbols right of $c$; the next symbol must match (a mismatch, a second $c$, or a blank rejects).
- <code>bk1</code>, <code>bk2</code>: return left over $X$'s to the $c$, then over unmarked symbols to the rightmost $X$ of the left part.
- <code>chk</code>: the left part is exhausted; accept iff only $X$'s remain before the blank (so a second $c$ or an unmatched symbol rejects).

Each round is $O(n)$ steps and crosses off two symbols, so the machine halts in $O(n^2)$ steps. This is the TM version of comparing two strings — something no PDA can do for $\{ww\}$.`
    },
    {
      id: 'tm-twoway',
      type: 'written',
      title: 'Two-way infinite tapes add no power',
      difficulty: 2,
      prompt: String.raw`A *two-way* TM has a tape that is infinite in both directions. Prove that every language recognized by a two-way TM $M$ is recognized by a standard TM $M'$ whose tape is infinite only to the right (where moving left from cell 0 leaves the head on cell 0). Describe the tape alphabet, the states, and how one step is simulated. Also argue the converse briefly.`,
      rubric: [
        'Folding idea: two tracks, one for cells 0,1,2,... and one for cells -1,-2,...',
        'Tape alphabet of M\' is (pairs of Γ symbols) plus a marker for cell 0 (or equivalent)',
        'States of M\' remember the state of M and which track the head is on',
        'Correct handling of moves on the lower track (directions reversed) and of switching tracks at cell 0',
        'Initialization (input on upper track, lower track blank) and acceptance preserved',
        'Converse: one-way simulated by two-way using a left-end marker'
      ],
      hints: [
        'Fold the two-way tape at cell 0 so that cell -i sits under cell i-1 (or under cell i).',
        'The simulating machine needs to know when it is at the fold: mark cell 0 specially.'
      ],
      solution: String.raw`**Construction.** Number the cells of $M$'s tape $\ldots, -2, -1, 0, 1, 2, \ldots$ with the input starting at cell 0. $M'$ uses a two-track tape: cell $i \ge 0$ of $M'$ holds the pair (contents of $M$-cell $i$, contents of $M$-cell $-(i+1)$). Formally $\Gamma' = (\Gamma \times \Gamma) \cup (\Gamma \times \Gamma \times \{\star\}) \cup \Sigma \cup \{\square\}$, where $\star$ marks cell 0 of $M'$ (the fold).

**Initialization.** $M'$ first sweeps over the input, replacing each input symbol $a$ by the pair $(a, \square)$ (and the first one by $(a, \square, \star)$), then returns to cell 0. Blank cells reached later are treated as $(\square, \square)$.

**States.** $Q' = Q \times \{\mathrm{up}, \mathrm{down}\}$ plus bookkeeping states. In $(q, \mathrm{up})$ the head of $M$ is on the cell represented by the upper track; in $(q, \mathrm{down})$, the lower track.

**One step.** Suppose $M$ has $\delta(q, x) = (p, y, \Delta)$.
- In $(q, \mathrm{up})$: read the upper component $x$, replace it by $y$, and move in direction $\Delta$, entering $(p, \mathrm{up})$ — except if the head is on the $\star$ cell and $\Delta = -1$: then $M$ moves from cell 0 to cell $-1$, which is the *lower* track of the same $M'$ cell, so $M'$ stays put (move right then left, or a stay move) and enters $(p, \mathrm{down})$.
- In $(q, \mathrm{down})$: read and write the lower component; directions are **reversed** ($M$ moving left, toward $-\infty$, means $M'$ moves right). If on the $\star$ cell and $M$ moves right (from cell $-1$ to cell 0), switch to $(p, \mathrm{up})$ without moving.

$M'$ enters its accept (reject) state exactly when $M$ would, so $L(M') = L(M)$, and $M'$ halts iff $M$ halts (so deciders map to deciders). Each step of $M$ takes $O(1)$ steps of $M'$.

**Converse.** A two-way TM simulates a one-way TM by first writing a special end marker $\triangleright$ in cell $-1$; whenever the simulated machine would move left onto $\triangleright$, the simulator moves right again immediately (emulating "stay at cell 0").`
    },
    {
      id: 'tm-multitape',
      type: 'written',
      title: 'Simulating a 2-tape TM, with running time',
      difficulty: 3,
      prompt: String.raw`Let $M$ be a 2-tape Turing machine that halts within $t(n) \ge n$ steps on every input of length $n$. Describe a single-tape TM $M'$ with $L(M') = L(M)$, and prove that $M'$ halts within $O(t(n)^2)$ steps.`,
      rubric: [
        'Representation: both tapes on one tape (tracks or delimiter-separated) with head positions marked',
        'Simulation of one step: a sweep to collect the symbols under both heads, then a sweep to update symbols/head marks',
        'Explains that the used region has length O(t(n))',
        'Concludes O(t(n)) per simulated step and O(t(n)^2) total, including O(n) initialization',
        'Acceptance/rejection preserved'
      ],
      hints: [
        'Use a 4-track tape: tape 1 contents, head-1 mark, tape 2 contents, head-2 mark.',
        'How many cells can M visit in t(n) steps?'
      ],
      solution: String.raw`**Representation.** $M'$ uses tape alphabet $\Gamma' = \Gamma \times \{0,1\} \times \Gamma \times \{0,1\}$ (plus input symbols and blank): cell $i$ of $M'$ records the contents of cell $i$ of tape 1, whether head 1 is there, the contents of cell $i$ of tape 2, and whether head 2 is there. (A delimiter-separated layout with dotted head symbols also works but requires shifting.)

**Initialization.** Rewrite input symbol $a$ in cell $i$ as $(a, [i=0], \square, [i=0])$; return to cell 0. $O(n)$ steps.

**Simulating one step of $M$.** The state of $M'$ stores $M$'s state. $M'$ sweeps right from the left end across the used region, recording in its finite control the two symbols that carry head marks. Now it knows $\delta(q, x_1, x_2) = (p, y_1, y_2, \Delta_1, \Delta_2)$. It sweeps back left; when it finds head mark $j$, it writes $y_j$ in track $j$, clears the mark, and sets the mark on the neighbor in direction $\Delta_j$ (one extra step). Then it enters the state storing $p$. If $p$ is accept or reject, $M'$ halts the same way, so $L(M') = L(M)$.

**Running time.** In $t = t(n)$ steps each head of $M$ moves at most $t$ cells, and the input occupies $n \le t$ cells, so at all times the used region has length at most $n + t + 1 = O(t)$. Each simulated step is two sweeps over this region plus $O(1)$ extra moves, i.e. $O(t)$ steps. There are at most $t$ simulated steps, so $M'$ halts within
$$O(n) + t \cdot O(t) = O(t(n)^2)$$
steps. $\blacksquare$`
    },
    {
      id: 'tm-powers2',
      type: 'written',
      title: String.raw`Implementation-level TM for $\{0^{2^k}\}$`,
      difficulty: 2,
      prompt: String.raw`Give an implementation-level description (English description of head movements and markings, not a transition table) of a Turing machine that **decides** $L = \{0^{2^k} : k \ge 0\}$ over $\Sigma = \{0\}$. Argue that it is correct and that it halts on every input, and analyze its running time.`,
      rubric: [
        'Repeated halving by crossing off every other remaining 0',
        'Correct acceptance condition (exactly one 0 left) and rejection (odd count greater than 1, or zero 0s)',
        'Correctness argument (count is a power of 2 iff halving repeatedly reaches 1 with no odd step)',
        'Halting argument (count strictly decreases) and running time O(n log n)'
      ],
      hints: [
        'A number m ≥ 1 is a power of 2 iff m = 1, or m is even and m/2 is a power of 2.',
        'In one left-to-right sweep you can cross off every other uncrossed 0 and simultaneously learn whether the count was even.'
      ],
      solution: String.raw`**Machine** $M$ on input $w \in 0^*$:

1. If the tape is empty (head on a blank), **reject**: $0$ is not of the form $2^k$, since $2^k \ge 1$.
2. Sweep left to right over the tape. Leave the first uncrossed 0 alone, cross off (overwrite with $X$) the second, leave the third, cross off the fourth, and so on — alternating, skipping $X$'s. Track in the finite control (a) whether the number of uncrossed 0s seen in this sweep was 1, and (b) the parity of that number.
3. At the blank at the end of the sweep:
   - if exactly one uncrossed 0 was seen, **accept**;
   - else if the number was odd, **reject**;
   - else return the head to the left end and go to step 2.

**Correctness.** If a sweep starts with $m \ge 2$ uncrossed 0s and $m$ is even, it leaves exactly $m/2$ uncrossed. So the machine accepts iff starting from $m_0 = |w|$ the sequence $m_0, m_0/2, m_0/4, \ldots$ consists of even numbers until it reaches 1, i.e. iff $|w| = 2^k$ for some $k \ge 0$. It rejects if $|w| = 0$ or if some value $m > 1$ in the sequence is odd — exactly when $|w|$ is not a power of 2.

**Halting and time.** Every sweep either halts or halves the number of uncrossed 0s, so there are at most $\lfloor \log_2 n \rfloor + 1$ sweeps, each taking $O(n)$ steps (one pass right, one pass back). The machine halts on every input within $O(n \log n)$ steps, so it is a decider.`
    },
    {
      id: 'tm-ntm',
      type: 'written',
      title: 'Nondeterminism adds no computability',
      difficulty: 3,
      prompt: String.raw`A nondeterministic TM $N$ may have several possible transitions from a configuration; it accepts $w$ if *some* sequence of choices leads to $\mathit{accept}$.

(a) Describe a deterministic TM $D$ (you may use several tapes) that recognizes $L(N)$.

(b) Explain why exploring the choices depth-first would not work.

(c) Suppose every branch of $N$ halts on every input. Show that $L(N)$ is decidable.`,
      rubric: [
        '(a) Systematic BFS over the computation tree (e.g. enumerate choice sequences in order of length, re-simulating N for each)',
        '(a) Correctness: accepts iff some accepting branch exists',
        '(b) DFS can follow an infinite branch forever and never find an accepting one',
        '(c) Uses König\'s lemma / finite branching: if all branches halt the tree is finite, so BFS terminates; reject when exhausted'
      ],
      hints: [
        'Let b be the maximum number of choices in any configuration. Each branch prefix of depth d is a string over {1, ..., b} of length d.',
        'For (c): a finitely branching tree with no infinite path is finite (König\'s lemma).'
      ],
      solution: String.raw`**(a)** Let $b$ be the maximum number of nondeterministic choices in any (state, symbol) pair. A *choice string* $c \in \{1, \ldots, b\}^*$ names a path from the root of $N$'s computation tree. $D$ uses three tapes: tape 1 holds the input (never changed), tape 2 is $N$'s simulated tape, tape 3 holds the current choice string.

For $c$ = all strings over $\{1,\ldots,b\}$ in order of length (shortlex): copy $w$ to tape 2 and simulate $N$ for $|c|$ steps, using the $i$-th symbol of $c$ to choose the $i$-th transition (skip $c$ if a choice is invalid). If the simulation enters $\mathit{accept}$, **accept**.

This is breadth-first search: every configuration at depth $d$ is examined before any configuration at depth $d+1$. If $N$ has an accepting branch, it has one of some finite length $d$, and $D$ reaches the corresponding choice string after finitely many iterations and accepts. If $N$ has no accepting branch, $D$ never accepts. So $L(D) = L(N)$.

**(b)** A depth-first search might follow a branch on which $N$ runs forever. It would never backtrack and so never discover an accepting branch elsewhere, failing to accept some $w \in L(N)$.

**(c)** Modify $D$: after finishing all choice strings of length $d$, if **no** branch of length $d$ was still running (all branches halted earlier), **reject**. If every branch of $N$ on $w$ halts, the computation tree is finitely branching (at most $b$ children) with no infinite path, so by König's lemma it is finite and has some maximum depth $d^*$. Then $D$ halts by depth $d^* + 1$: it accepts if an accepting leaf exists and otherwise rejects. Hence $D$ is a decider for $L(N)$.`
    },
    {
      id: 'tm-a2b',
      type: 'tm',
      title: String.raw`TM for $\#_a = 2\cdot\#_b$`,
      difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Design a Turing machine that **decides** $\{w \in \{a,b\}^* : \#_a(w) = 2\cdot\#_b(w)\}$ (any order: <code>aab</code>, <code>aba</code>, <code>baa</code>, <code>abaaba</code> are in the language). Use <code>_</code> for the blank; a missing transition rejects.`,
      accepts: function (s) {
        var a = 0, b = 0;
        for (var i = 0; i < s.length; i++) { if (s[i] === 'a') a++; else b++; }
        return a === 2 * b;
      },
      sample: String.raw`start: q0
accept: acc
reject: rej
blank: _
q0 a -> q0a a R
q0 X -> q0 X R
q0 b -> bk1 X L
q0 _ -> acc _ R
q0a a -> q0a a R
q0a X -> q0a X R
q0a b -> bk1 X L
bk1 a -> bk1 a L
bk1 b -> bk1 b L
bk1 X -> bk1 X L
bk1 _ -> f1 _ R
f1 X -> f1 X R
f1 b -> f1 b R
f1 a -> f2 X R
f2 X -> f2 X R
f2 b -> f2 b R
f2 a -> bk0 X L
bk0 a -> bk0 a L
bk0 b -> bk0 b L
bk0 X -> bk0 X L
bk0 _ -> q0 _ R`,
      maxLen: 6,
      hints: [
        'Each round: cross off one b, then two a’s. Use the blank to the left of the input as a left-end marker.',
        'When no unmarked b is left, accept iff no unmarked a is left either. Remember in the state whether you passed an unmarked a on the way.'
      ],
      solution: String.raw`Each round crosses off one $b$ and two $a$'s (all as <code>X</code>); the blank cell left of the input serves as the left-end marker (it is never overwritten).

~~~tm
start: q0
accept: acc
reject: rej
blank: _
q0 a -> q0a a R
q0 X -> q0 X R
q0 b -> bk1 X L
q0 _ -> acc _ R
q0a a -> q0a a R
q0a X -> q0a X R
q0a b -> bk1 X L
bk1 a -> bk1 a L
bk1 b -> bk1 b L
bk1 X -> bk1 X L
bk1 _ -> f1 _ R
f1 X -> f1 X R
f1 b -> f1 b R
f1 a -> f2 X R
f2 X -> f2 X R
f2 b -> f2 b R
f2 a -> bk0 X L
bk0 a -> bk0 a L
bk0 b -> bk0 b L
bk0 X -> bk0 X L
bk0 _ -> q0 _ R
~~~
- <code>q0</code> / <code>q0a</code>: scan right for an unmarked $b$; <code>q0a</code> means "an unmarked $a$ was passed". Reaching the blank in <code>q0</code> means everything is crossed off (accept); in <code>q0a</code> it means $a$'s are left over with no $b$ to pay for them (reject).
- <code>bk1</code>, <code>bk0</code>: return to the left end.
- <code>f1</code>, <code>f2</code>: cross off the first and second unmarked $a$; hitting the blank means too few $a$'s (reject).

Each round crosses off 3 symbols and costs $O(n)$ steps, so the machine halts within $O(n^2)$ steps on every input.`
    },
    {
      id: 'tm-sum',
      type: 'tm',
      title: String.raw`TM for $a^ib^jc^k$ with $i + j = k$`,
      difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Design a Turing machine that decides $\{a^ib^jc^k : i + j = k\}$. Note that the machine must also reject inputs that are not of the form $a^*b^*c^*$ (such as <code>bac</code> or <code>acbc</code>).`,
      accepts: function (s) {
        var m = /^(a*)(b*)(c*)$/.exec(s);
        return !!m && m[1].length + m[2].length === m[3].length;
      },
      sample: String.raw`start: f0
accept: acc
reject: rej
blank: _
f0 a -> f0 a R
f0 b -> f1 b R
f0 c -> f2 c R
f0 _ -> ret _ L
f1 b -> f1 b R
f1 c -> f2 c R
f1 _ -> ret _ L
f2 c -> f2 c R
f2 _ -> ret _ L
ret a -> ret a L
ret b -> ret b L
ret c -> ret c L
ret _ -> m0 _ R
m0 X -> m0 X R
m0 a -> fc X R
m0 b -> fc X R
m0 Y -> chk Y R
m0 _ -> acc _ R
fc a -> fc a R
fc b -> fc b R
fc Y -> fc Y R
fc c -> bk Y L
bk a -> bk a L
bk b -> bk b L
bk Y -> bk Y L
bk X -> bk X L
bk _ -> m0 _ R
chk Y -> chk Y R
chk _ -> acc _ R`,
      maxLen: 6,
      hints: [
        String.raw`Phase 1: one left-to-right pass that checks the input is in $a^*b^*c^*$ (a 3-state DFA run on the tape), then return to the left end.`,
        'Phase 2: repeatedly cross off the leftmost unmarked a-or-b and the leftmost unmarked c.'
      ],
      solution: String.raw`~~~tm
start: f0
accept: acc
reject: rej
blank: _
f0 a -> f0 a R
f0 b -> f1 b R
f0 c -> f2 c R
f0 _ -> ret _ L
f1 b -> f1 b R
f1 c -> f2 c R
f1 _ -> ret _ L
f2 c -> f2 c R
f2 _ -> ret _ L
ret a -> ret a L
ret b -> ret b L
ret c -> ret c L
ret _ -> m0 _ R
m0 X -> m0 X R
m0 a -> fc X R
m0 b -> fc X R
m0 Y -> chk Y R
m0 _ -> acc _ R
fc a -> fc a R
fc b -> fc b R
fc Y -> fc Y R
fc c -> bk Y L
bk a -> bk a L
bk b -> bk b L
bk Y -> bk Y L
bk X -> bk X L
bk _ -> m0 _ R
chk Y -> chk Y R
chk _ -> acc _ R
~~~
- <code>f0, f1, f2</code> run the DFA for $a^*b^*c^*$ (state = which block we are in); any out-of-order symbol has no transition and rejects. <code>ret</code> returns to the left end.
- <code>m0</code>: at the leftmost unmarked cell. An $a$ or $b$ is crossed off (<code>X</code>) and <code>fc</code> crosses off the first unmarked $c$ (<code>Y</code>); if there is none (blank), reject. If <code>m0</code> meets an unmarked $c$, there are more $c$'s than $a$'s and $b$'s together: reject (missing transition). If it meets <code>Y</code>, all $a$'s and $b$'s are used, and <code>chk</code> verifies no unmarked $c$ remains.

Halting: phase 1 is one pass; each round of phase 2 marks two cells in $O(n)$ steps; total $O(n^2)$.`
    },
    {
      id: 'tm-mult',
      type: 'tm',
      title: String.raw`TM for $a^ib^jc^k$ with $k = i \cdot j$`,
      difficulty: 3,
      alphabet: 'abc',
      prompt: String.raw`Design a Turing machine that decides $\{a^ib^jc^k : k = i\cdot j\}$. (Members: $\varepsilon$, <code>a</code>, <code>b</code>, <code>abc</code>, <code>abbcc</code>, <code>aabcc</code>. Non-members: <code>c</code>, <code>ab</code>, <code>abcc</code>, <code>bac</code>.)`,
      accepts: function (s) {
        var m = /^(a*)(b*)(c*)$/.exec(s);
        return !!m && m[1].length * m[2].length === m[3].length;
      },
      sample: String.raw`start: f0
accept: acc
reject: rej
blank: _
f0 a -> f0 a R
f0 b -> f1 b R
f0 c -> f2 c R
f0 _ -> ret _ L
f1 b -> f1 b R
f1 c -> f2 c R
f1 _ -> ret _ L
f2 c -> f2 c R
f2 _ -> ret _ L
ret a -> ret a L
ret b -> ret b L
ret c -> ret c L
ret _ -> m0 _ R
m0 A -> m0 A R
m0 a -> nb A R
m0 b -> fin b R
m0 _ -> acc _ R
nb A -> nb A R
nb a -> nb a R
nb B -> nb B R
nb b -> fc B R
nb c -> rs c L
nb C -> rs C L
nb _ -> rs _ L
fc b -> fc b R
fc B -> fc B R
fc C -> fc C R
fc c -> bk C L
bk a -> bk a L
bk A -> bk A L
bk b -> bk b L
bk B -> bk B L
bk C -> bk C L
bk _ -> nb _ R
rs A -> rs A L
rs a -> rs a L
rs b -> rs b L
rs B -> rs b L
rs c -> rs c L
rs C -> rs C L
rs _ -> m0 _ R
fin b -> fin b R
fin C -> fin C R
fin _ -> acc _ R`,
      maxLen: 6,
      hints: [
        'First check the format a*b*c* in one pass and return to the left end.',
        'Nested loop: for each a (mark it A), for each b (mark it B), cross off one c (mark it C). After the inner loop, turn the B’s back into b’s.',
        'When every a is marked, accept iff no unmarked c remains.'
      ],
      solution: String.raw`A nested loop: for each $a$, cross off $j$ of the $c$'s.

~~~tm
start: f0
accept: acc
reject: rej
blank: _
f0 a -> f0 a R
f0 b -> f1 b R
f0 c -> f2 c R
f0 _ -> ret _ L
f1 b -> f1 b R
f1 c -> f2 c R
f1 _ -> ret _ L
f2 c -> f2 c R
f2 _ -> ret _ L
ret a -> ret a L
ret b -> ret b L
ret c -> ret c L
ret _ -> m0 _ R
m0 A -> m0 A R
m0 a -> nb A R
m0 b -> fin b R
m0 _ -> acc _ R
nb A -> nb A R
nb a -> nb a R
nb B -> nb B R
nb b -> fc B R
nb c -> rs c L
nb C -> rs C L
nb _ -> rs _ L
fc b -> fc b R
fc B -> fc B R
fc C -> fc C R
fc c -> bk C L
bk a -> bk a L
bk A -> bk A L
bk b -> bk b L
bk B -> bk B L
bk C -> bk C L
bk _ -> nb _ R
rs A -> rs A L
rs a -> rs a L
rs b -> rs b L
rs B -> rs b L
rs c -> rs c L
rs C -> rs C L
rs _ -> m0 _ R
fin b -> fin b R
fin C -> fin C R
fin _ -> acc _ R
~~~
- <code>f0, f1, f2, ret</code>: verify $a^*b^*c^*$ and return to the left end.
- <code>m0</code> (outer loop): skip <code>A</code>'s; mark the next $a$ as <code>A</code> and start the inner loop. If the next symbol is $b$ (or blank), all $a$'s are done: <code>fin</code> checks that only $b$'s and crossed-off <code>C</code>'s remain. If it is an unmarked $c$ (possible only when $j = 0$), reject.
- <code>nb</code> (inner loop): find the next unmarked $b$ and mark it <code>B</code>; <code>fc</code> crosses off the first unmarked $c$ (a blank here means $k < i\cdot j$: reject); <code>bk</code> returns to the left end and the inner loop continues. When <code>nb</code> finds no unmarked $b$, <code>rs</code> walks back to the left end turning every <code>B</code> back into $b$.

After the $r$-th outer iteration exactly $r\cdot j$ of the $c$'s are crossed off, so the machine accepts iff $k = i\cdot j$. Every iteration of either loop marks a new cell, so the machine halts on all inputs (in $O(n^3)$ steps).`
    },
    {
      id: 'tm-ww',
      type: 'tm',
      title: String.raw`TM for $\{ww\}$`,
      difficulty: 3,
      alphabet: 'ab',
      prompt: String.raw`Design a Turing machine that decides $\{ww : w \in \{a,b\}^*\}$ — a language that is not context-free. (Members: $\varepsilon$, <code>aa</code>, <code>abab</code>, <code>abaaba</code>. Non-members: <code>a</code>, <code>ab</code>, <code>abba</code>.)`,
      accepts: function (s) {
        if (s.length % 2) return false;
        var h = s.length / 2;
        return s.slice(0, h) === s.slice(h);
      },
      sample: String.raw`start: p0
accept: acc
reject: rej
blank: _
p0 a -> p1 A R
p0 b -> p1 B R
p0 x -> c0 x L
p0 y -> c0 y L
p0 _ -> acc _ R
p1 a -> p1 a R
p1 b -> p1 b R
p1 x -> p2 x L
p1 y -> p2 y L
p1 _ -> p2 _ L
p2 a -> p3 x L
p2 b -> p3 y L
p3 a -> p3 a L
p3 b -> p3 b L
p3 A -> p0 A R
p3 B -> p0 B R
c0 A -> c0 A L
c0 B -> c0 B L
c0 Z -> c0 Z L
c0 x -> c0 x L
c0 y -> c0 y L
c0 _ -> c1 _ R
c1 Z -> c1 Z R
c1 A -> ga Z R
c1 B -> gb Z R
c1 _ -> acc _ R
ga A -> ga A R
ga B -> ga B R
ga Z -> ga Z R
ga x -> c0 Z L
gb A -> gb A R
gb B -> gb B R
gb Z -> gb Z R
gb y -> c0 Z L`,
      maxLen: 6,
      hints: [
        'Phase 1 (find the middle): alternately mark the leftmost unmarked symbol with an uppercase letter and the rightmost unmarked symbol with a different mark (a → x, b → y). If the marks collide on one cell, the length is odd.',
        'Phase 2 (compare): repeatedly cross off (as Z) the leftmost uppercase symbol and the leftmost x/y symbol, checking that they correspond.'
      ],
      solution: String.raw`**Phase 1 — find the middle.** Mark the leftmost unmarked symbol as <code>A</code>/<code>B</code> (first half), then the rightmost unmarked symbol as <code>x</code>/<code>y</code> (second half), and repeat. If the leftmost-unmarked search finds an <code>x</code>/<code>y</code>, all symbols are marked and the length is even; if the rightmost search finds an <code>A</code>/<code>B</code>, the length is odd: reject.

**Phase 2 — compare.** Repeatedly: from the left end, skip <code>Z</code>'s, cross off the first <code>A</code>/<code>B</code> (remembering which letter in the state), skip to the first <code>x</code>/<code>y</code>, and check it is the matching letter; cross it off too. When no uppercase letter remains, accept.

~~~tm
start: p0
accept: acc
reject: rej
blank: _
p0 a -> p1 A R
p0 b -> p1 B R
p0 x -> c0 x L
p0 y -> c0 y L
p0 _ -> acc _ R
p1 a -> p1 a R
p1 b -> p1 b R
p1 x -> p2 x L
p1 y -> p2 y L
p1 _ -> p2 _ L
p2 a -> p3 x L
p2 b -> p3 y L
p3 a -> p3 a L
p3 b -> p3 b L
p3 A -> p0 A R
p3 B -> p0 B R
c0 A -> c0 A L
c0 B -> c0 B L
c0 Z -> c0 Z L
c0 x -> c0 x L
c0 y -> c0 y L
c0 _ -> c1 _ R
c1 Z -> c1 Z R
c1 A -> ga Z R
c1 B -> gb Z R
c1 _ -> acc _ R
ga A -> ga A R
ga B -> ga B R
ga Z -> ga Z R
ga x -> c0 Z L
gb A -> gb A R
gb B -> gb B R
gb Z -> gb Z R
gb y -> c0 Z L
~~~
- <code>p0</code>–<code>p3</code>: phase 1. <code>p2</code> reading <code>A</code>/<code>B</code> has no transition: odd length, reject.
- <code>c0</code>: return to the left end. <code>c1</code>: next uppercase letter of the first half. <code>ga</code>/<code>gb</code>: carry it to the first unmarked symbol of the second half (skipping the <code>Z</code>'s there); a mismatch has no transition and rejects.

After phase 1 the first half consists of uppercase letters and the second half of <code>x</code>/<code>y</code>, both of length $n/2$; the $r$-th comparison round matches position $r$ of the two halves. Each round of either phase marks at least one new cell, so the machine halts in $O(n^2)$ steps.`
    },
    {
      id: 'tm-binary-inc',
      type: 'written',
      title: 'A TM that computes: binary increment',
      difficulty: 2,
      prompt: String.raw`A TM **computes** a function $f$ if, started on input $x$, it halts (say in the accept state) with $f(x)$ on the tape. Give a transition-level TM that, on a binary number $x \in \{0,1\}^*$ (most significant bit first), halts with the binary representation of $x + 1$ on the tape. Treat the empty input as 0. Explain each state, give the trace on <code>1011</code>, and state the running time.`,
      rubric: [
        'Moves to the right end of the input first',
        'Propagates the carry right-to-left: 1 → 0 and continue; 0 → 1 and halt',
        'Handles all-ones input (writes a new leading 1 in the blank cell left of the input)',
        'Correct trace on 1011 ending with 1100',
        'Running time O(n)'
      ],
      hints: [
        'Adding 1 flips the trailing block of 1s to 0s and the 0 before it to 1.',
        'If the number is all 1s, the carry runs off the left end into the blank cell, which becomes the new leading 1.'
      ],
      solution: String.raw`~~~tm
start: right
accept: done
reject: rej
blank: _
right 0 -> right 0 R
right 1 -> right 1 R
right _ -> carry _ L
carry 1 -> carry 0 L
carry 0 -> done 1 S
carry _ -> done 1 S
~~~
- <code>right</code>: scan to the blank after the last bit, then step back onto the least significant bit.
- <code>carry</code>: we are adding 1 at this position. A 1 becomes 0 and the carry moves left; a 0 becomes 1 and we are done. A blank means the carry passed the most significant bit (the input was all 1s, or empty): write a 1 there and halt.

**Trace on <code>1011</code>:** <code>right</code> walks to the blank after position 4; <code>carry</code> turns the last 1 into 0 (<code>1010</code>), the next 1 into 0 (<code>1000</code>), then reads 0 and writes 1: <code>1100</code> = 12 = 11 + 1. Halt.

**Running time:** at most $n$ steps right, one step back, at most $n + 1$ steps left: $O(n)$. (On an all-1s input the output starts one cell to the left of the original input, which is fine on a two-way infinite tape; on a one-way tape you would first shift the input right by one cell.)`
    },
    {
      id: 'tm-dfa-cfg-deciders',
      type: 'written',
      title: 'High-level deciders for questions about DFAs and CFGs',
      difficulty: 2,
      prompt: String.raw`Give a high-level description of a decider for each language, and explain why it halts on every input.

(a) $A_{\mathrm{DFA}} = \{\langle D, w\rangle : D \text{ is a DFA that accepts } w\}$

(b) $E_{\mathrm{DFA}} = \{\langle D\rangle : L(D) = \emptyset\}$

(c) $EQ_{\mathrm{DFA}} = \{\langle D_1, D_2\rangle : L(D_1) = L(D_2)\}$

(d) $E_{\mathrm{CFG}} = \{\langle G\rangle : L(G) = \emptyset\}$

(e) $A_{\mathrm{CFG}} = \{\langle G, w\rangle : w \in L(G)\}$`,
      rubric: [
        '(a) Simulate D on w for |w| steps; halts since DFAs read one symbol per step',
        '(b) Graph search from the start state for a reachable accepting state',
        '(c) Build a DFA for the symmetric difference (product construction) and test emptiness with (b)',
        '(d) Iteratively mark generating nonterminals (those with a rule whose RHS is all terminals/marked); accept iff S never gets marked; halts since at most |V| rounds',
        '(e) CYK on a CNF version, or check all derivations of bounded length; explains the bound'
      ],
      hints: [
        'Every one of these reduces to a finite search over a finite graph or a finite set of derivations.',
        String.raw`For (c): $L(D_1) = L(D_2)$ iff $(L(D_1) \setminus L(D_2)) \cup (L(D_2) \setminus L(D_1)) = \emptyset$.`,
        'For (e): in Chomsky normal form, a derivation of a string of length n ≥ 1 has exactly 2n − 1 steps.'
      ],
      solution: String.raw`In each case first check that the input is a syntactically valid encoding (reject otherwise) — a finite check.

**(a)** Simulate $D$ on $w$: start in the start state and apply the transition function once per symbol of $w$; accept iff the final state is accepting. Exactly $|w|$ transitions, so it halts.

**(b)** Run BFS/DFS on the state graph of $D$ from the start state. Accept iff no accepting state is reached. The graph is finite, so the search halts. Correct because $L(D) \ne \emptyset$ iff some path labeled by some string leads to an accepting state.

**(c)** Use the product construction to build a DFA $D_\oplus$ whose states are pairs $(p, q)$ and whose accepting pairs are those where exactly one of $p, q$ is accepting; then $L(D_\oplus) = L(D_1) \oplus L(D_2)$ (symmetric difference). Run the decider from (b) on $\langle D_\oplus\rangle$. The construction is finite and (b) halts. Correct since two sets are equal iff their symmetric difference is empty.

**(d)** Mark every terminal. Repeat: mark a nonterminal $A$ if some rule $A \to \alpha$ has every symbol of $\alpha$ marked (this includes $A \to \varepsilon$). Stop when a round marks nothing new — after at most $|V|$ rounds. Accept iff $S$ is unmarked. Correctness: by induction, $A$ gets marked iff $A$ derives some terminal string (marked means "generating").

**(e)** Convert $G$ to Chomsky normal form $G'$ (a terminating algorithm). If $w = \varepsilon$, accept iff $G'$ has the rule $S \to \varepsilon$. Otherwise, every derivation of $w$ in $G'$ has exactly $2|w| - 1$ steps, so enumerate the finitely many derivations of that length and accept iff one produces $w$ — or, much faster, run CYK in $O(|w|^3)$ time. Halts because the search is finite. (Without CNF, a naive "try all derivations" might never stop, because $\varepsilon$-rules and unit rules allow arbitrarily long derivations of the same string.)`
    },
    {
      id: 'tm-closure-decidable',
      type: 'written',
      title: 'Closure properties of decidable languages',
      difficulty: 2,
      prompt: String.raw`Let $L_1$ and $L_2$ be decidable, with deciders $M_1$ and $M_2$. Prove that each of the following is decidable by describing a decider and arguing that it halts and is correct: (a) $L_1 \cup L_2$, (b) $L_1 \cap L_2$, (c) $\overline{L_1}$, (d) $L_1 L_2$ (concatenation), (e) $L_1^*$.`,
      rubric: [
        '(a)/(b) Run M1 then M2 (sequentially is fine since both halt) and combine answers',
        '(c) Swap accept and reject; uses that M1 always halts',
        '(d) Try all |x|+1 splits x = uv; accept iff some split has M1(u) and M2(v) accept',
        '(e) Try all ways to split x into nonempty pieces (or DP over prefixes); accept ε; finitely many splits',
        'Explicit halting argument for each'
      ],
      hints: [
        'Because deciders always halt, you may run them one after another — no dovetailing needed.',
        String.raw`For star: a string of length $n$ has $2^{n-1}$ splittings into nonempty pieces. Or use dynamic programming: $P[i]$ = "the prefix of length $i$ is in $L_1^*$".`
      ],
      solution: String.raw`**(a) Union.** On input $x$: run $M_1$ on $x$; if it accepts, accept. Otherwise run $M_2$ on $x$ and return its answer. Both runs halt, so this halts; it accepts iff $x \in L_1$ or $x \in L_2$.

**(b) Intersection.** Run $M_1$ on $x$; if it rejects, reject; else return $M_2$'s answer on $x$.

**(c) Complement.** Run $M_1$ on $x$ and return the opposite answer (equivalently, swap the accept and reject states of $M_1$). Since $M_1$ halts on every input, every $x$ gets the opposite answer, so this decides $\overline{L_1}$. (This is exactly where "decider" matters: for a mere recognizer, looping inputs would stay looping.)

**(d) Concatenation.** On input $x = x_1\cdots x_n$: for each $i = 0, 1, \ldots, n$, let $u = x_1\cdots x_i$ and $v = x_{i+1}\cdots x_n$, run $M_1$ on $u$ and $M_2$ on $v$; if both accept, accept. After all $n + 1$ splits, reject. Finitely many halting runs, so it halts; it accepts iff some split $x = uv$ has $u \in L_1$, $v \in L_2$.

**(e) Star.** On input $x$ of length $n$: if $x = \varepsilon$, accept. Otherwise compute a table $P[0..n]$ where $P[i]$ means "$x_1\cdots x_i \in L_1^*$": $P[0] = $ true, and for $i = 1..n$, $P[i]$ = true iff there is $j < i$ with $P[j]$ true and $M_1$ accepting $x_{j+1}\cdots x_i$. Accept iff $P[n]$. This runs $M_1$ $O(n^2)$ times, each halting, so the machine halts; correctness: $x_1\cdots x_i \in L_1^*$ iff it is empty or it splits as (a string in $L_1^*$)(a nonempty string in $L_1$), which is what the recurrence checks. (It is fine to only consider nonempty last pieces, since empty pieces contribute nothing to a concatenation.)`
    },
    {
      id: 'tm-closure-recognizable',
      type: 'written',
      title: 'Closure properties of recognizable languages',
      difficulty: 3,
      prompt: String.raw`Let $L_1, L_2$ be recognizable, with recognizers $M_1, M_2$ (which may loop on strings outside their languages).

(a) Prove $L_1 \cup L_2$ is recognizable. Explain why "run $M_1$, then $M_2$" fails.

(b) Prove $L_1 \cap L_2$ is recognizable.

(c) Prove $L_1 L_2$ is recognizable.

(d) Prove $L_1^*$ is recognizable.

(e) Show recognizable languages are **not** closed under complement.`,
      rubric: [
        '(a) Alternate single steps of M1 and M2 (parallel simulation); accept when either accepts; explains failure of sequential run (M1 may loop on x ∈ L2)',
        '(b) Sequential run is fine (both must accept); or parallel',
        '(c) Dovetail over all splits and step bounds (for t = 1,2,...: run each split for t steps)',
        '(d) Dovetail over all splittings into nonempty pieces and step bounds; accept ε',
        '(e) HALT is recognizable but its complement is not (else HALT would be decidable)'
      ],
      hints: [
        'A recognizer may loop, so never wait for one run to finish before starting another that might be the one that accepts.',
        'Dovetailing: in round t, run every candidate (finitely many for a fixed input) for t steps.'
      ],
      solution: String.raw`**(a)** On input $x$: simulate $M_1$ and $M_2$ on $x$ in parallel, alternating one step of each (two-tape simulation, or interleaving on one tape). If either simulation accepts, accept. If one rejects, keep running the other alone. If $x \in L_1 \cup L_2$, one of them accepts after finitely many steps, and so do we. If $x \notin L_1 \cup L_2$, neither accepts, and we never accept (we may loop, which is allowed). Running $M_1$ to completion first fails when $M_1$ loops on some $x \in L_2 \setminus L_1$: we would never get to $M_2$.

**(b)** Run $M_1$ on $x$; if it accepts, run $M_2$ on $x$; accept if it accepts. If $x \in L_1 \cap L_2$ both runs accept after finitely many steps. If not, one of them rejects or loops, and we never accept. (Here sequential is fine because we need **both**.)

**(c)** On input $x$ of length $n$: for $t = 1, 2, 3, \ldots$: for each split $x = uv$ (there are $n + 1$), run $M_1$ on $u$ for $t$ steps and $M_2$ on $v$ for $t$ steps; if both have accepted within $t$ steps, accept. If $x = uv$ with $u \in L_1$ (accepted in $t_1$ steps) and $v \in L_2$ ($t_2$ steps), we accept in round $\max(t_1, t_2)$. If no such split exists, we never accept. (Trying the splits one at a time with unbounded runs fails for the same reason as in (a).)

**(d)** On input $x$: if $x = \varepsilon$, accept. Otherwise for $t = 1, 2, 3, \ldots$: for each of the finitely many ways to cut $x$ into nonempty pieces $x = y_1y_2\cdots y_m$, run $M_1$ on every piece for $t$ steps; if all pieces were accepted within $t$ steps, accept. If $x \in L_1^*$ with $x \ne \varepsilon$, it has a splitting into nonempty pieces of $L_1$ (drop empty pieces), each accepted within some number of steps; we accept in the round equal to the maximum. Otherwise we never accept.

**(e)** HALT $= \{\langle M, w\rangle : M \text{ halts on } w\}$ is recognizable (simulate $M$ on $w$, accept if it halts). If its complement were recognizable too, HALT would be decidable (run both recognizers in parallel; exactly one accepts). HALT is undecidable, so $\overline{\mathrm{HALT}}$ is not recognizable.`
    },
    {
      id: 'tm-enumerator',
      type: 'written',
      title: 'Enumerators and recognizability',
      difficulty: 3,
      prompt: String.raw`An **enumerator** is a TM with an output device; started on a blank tape, it runs forever (or halts) and prints a (possibly infinite) list of strings, possibly with repetitions. The language it enumerates is the set of strings it ever prints.

(a) Prove that if $E$ enumerates $L$, then $L$ is recognizable.

(b) Prove that if $L$ is recognizable, then some enumerator enumerates $L$. Why can't the enumerator simply run the recognizer on $w_1$, then on $w_2$, and so on?

(c) Prove that an infinite language $L$ is decidable iff some enumerator prints exactly the strings of $L$ in strictly increasing shortlex order.`,
      rubric: [
        '(a) Recognizer runs E and accepts when x is printed; never accepts x ∉ L',
        '(b) Dovetailing: for t = 1, 2, ...: run M for t steps on w_1..w_t, print the accepted ones',
        '(b) Explains that sequential runs could loop on an early string',
        '(c, ⇒) Enumerator runs the decider on w_1, w_2, ... in order and prints the accepted ones',
        '(c, ⇐) Decider runs the enumerator until it prints x (accept) or a string after x in shortlex order (reject); halts because L is infinite'
      ],
      hints: [
        'For (a), the recognizer can just watch the enumerator’s output.',
        'For (c, ⇐), the order lets you stop as soon as the list has passed x. Why do you need L to be infinite?'
      ],
      solution: String.raw`Let $w_1, w_2, w_3, \ldots$ be all strings over $\Sigma$ in shortlex order.

**(a)** On input $x$: simulate $E$; every time it prints a string, compare it with $x$; if equal, accept. If $x \in L$, $E$ prints $x$ after finitely many steps and we accept. If $x \notin L$, it is never printed and we never accept. So $L(\text{this machine}) = L$.

**(b)** Let $M$ recognize $L$. The enumerator: for $t = 1, 2, 3, \ldots$: for $i = 1, \ldots, t$: run $M$ on $w_i$ for $t$ steps; if it accepts within those steps, print $w_i$. Everything printed is accepted by $M$, so is in $L$. Conversely, if $w_i \in L$ is accepted after $s$ steps, it is printed in round $t = \max(i, s)$ (and in every later round — repetitions are allowed). Running $M$ to completion on $w_1$ first fails if $M$ loops on $w_1 \notin L$: nothing after it would ever be printed.

**(c) ($\Rightarrow$)** Let $D$ decide $L$. For $i = 1, 2, 3, \ldots$: run $D$ on $w_i$ (it halts) and print $w_i$ if it accepts. This prints exactly $L$, in increasing shortlex order.

**($\Leftarrow$)** Let $E$ print $L$ in strictly increasing shortlex order. On input $x$: simulate $E$ until it prints either $x$ (accept) or some string that comes after $x$ in shortlex order (reject). If $x \in L$ it is printed eventually, and before that only smaller strings are printed: accept. If $x \notin L$, $x$ is never printed, and since $L$ is infinite and only finitely many strings precede $x$ in shortlex order, $E$ eventually prints a string larger than $x$: reject. Either way the machine halts, so $L$ is decidable. (For a **finite** $L$ the enumerator might print its last string and then run forever without halting; but every finite language is decidable anyway.)`
    },
    {
      id: 'tm-variants-reset',
      type: 'written',
      title: 'Variants: RESET instead of LEFT, and machines that never move left',
      difficulty: 3,
      prompt: String.raw`Consider two variants of the standard one-way-infinite-tape TM.

(a) A **reset TM** has moves $\{R, \mathrm{RESET}\}$: RESET moves the head to the leftmost cell. Prove reset TMs recognize exactly the recognizable languages.

(b) A **right-only TM** has moves $\{R, S\}$ (right or stay put); it can still write. Prove that right-only TMs recognize exactly the **regular** languages.`,
      rubric: [
        '(a) Standard TM simulates RESET: move left until a left-end marker (placed in cell 0 at the start)',
        '(a) Reset TM simulates a left move with marks: mark current cell, reset, walk right to find the cell just before the marked one (using a second marker that advances one cell per pass)',
        '(b) Key observation: once the head leaves a cell it never returns, so written symbols are only reread via S moves on the same cell — finitely much information',
        '(b) Builds a DFA: precompute for each (state, symbol) the result of the stay-loop (exit right in state p / accept / reject / loop) and for each state whether the blank-only suffix eventually accepts',
        '(b) Converse: a DFA is a right-only TM that moves right on every step and accepts at the blank in an accepting state'
      ],
      hints: [
        'For (a), the hard direction is simulating a left move with only RESET. Moving right is easy; finding "the previous cell" needs a second marker.',
        'For (b), think about what the machine can ever read after it leaves a cell.'
      ],
      solution: String.raw`**(a)** *Reset from standard:* at the start, shift the input right one cell and write a special end marker $\triangleright$ in cell 0 (or mark the first cell). To RESET, move left until the marker is found. So reset TMs are no more powerful.

*Standard from reset:* a right move is a right move. To simulate a **left** move from cell $i$ (if $i = 0$, a left move stays put; detect that by checking whether the current cell is the first, marked cell):
1. Replace the current symbol $\sigma$ by a dotted version $\dot\sigma$ (target marker), and RESET.
2. Put a second marker $\hat{}$ on cell 0. Loop: RESET, walk right to the $\hat{}$ cell, step right once. If this cell is dotted, the $\hat{}$ cell is cell $i - 1$: RESET, walk right to the dotted cell and undot it, RESET, walk right to the $\hat{}$ cell, remove the $\hat{}$, and continue the simulation there in the new state (with the written symbol already placed in step 1's cell). Otherwise move the $\hat{}$ one cell right: RESET, walk to the $\hat{}$ cell, remove it, step right, put $\hat{}$ on that cell, and repeat.

(Concretely, the symbol to be written by the simulated move is written together with the dot in step 1, and the simulated state is kept in the finite control.) Each left move costs $O(i^2)$ steps, but the simulation is correct, so the two models recognize the same languages.

**(b)** *Regular languages are right-only:* a DFA is a right-only TM that moves R on every symbol and, on the first blank, accepts iff its current state is accepting.

*Right-only languages are regular.* Once the head leaves a cell it never comes back, so anything written on a cell matters only while the head stays on that cell. For each state $q$ and symbol $c$, consider the "stay sequence" from $(q, c)$: follow the transitions while they are S-moves (each rewrites the current cell). Because there are only finitely many (state, symbol) pairs, this sequence either reaches accept, reaches reject, repeats a pair (loops forever on this cell), or performs an R-move into some state $p$. Call that outcome $\mathrm{out}(q, c)$ — it is computable from the transition table. Also, after the input is consumed the head reads only blanks forever; let $\mathrm{fin}(q)$ = "starting in state $q$ on an all-blank right part, the machine eventually accepts" — this depends only on $q$ (every new cell is blank), and is computed by following $\mathrm{out}(\cdot, \square)$ from $q$ until accept, reject, or a repeated state.

Build a DFA with states $Q \cup \{\mathsf{yes}, \mathsf{no}\}$: from $q$ on input symbol $c$, go to $p$ if $\mathrm{out}(q, c)$ = "move right in $p$", to $\mathsf{yes}$ if it accepts, and to $\mathsf{no}$ if it rejects or loops; $\mathsf{yes}$/$\mathsf{no}$ loop on everything. Accepting states: $\mathsf{yes}$ and every $q$ with $\mathrm{fin}(q)$ true. This DFA accepts exactly the inputs the right-only TM accepts, so its language is regular.`
    },
    {
      id: 'tm-two-stack',
      type: 'written',
      title: 'Two stacks are as good as a tape',
      difficulty: 2,
      prompt: String.raw`A two-stack PDA has a finite control and two stacks (it reads its input once, left to right; it may also make $\varepsilon$-moves). Prove that two-stack PDAs recognize exactly the recognizable languages. (Describe both simulations precisely enough that a reader could implement them.)`,
      rubric: [
        'TM simulates 2-stack PDA: two tapes (or tracks) hold the stacks, a third holds the input; each PDA step is O(1) TM operations on the tops',
        '2-stack PDA simulates TM: first read the whole input and push it so that the first symbol ends up on top of the right stack',
        'Invariant: left stack = tape left of the head (top = cell just left of head), right stack = head cell and everything to its right (top = head cell)',
        'Move right: pop right, push written symbol onto left; move left: pop left, push onto right (after writing); empty right stack = blank',
        'Acceptance preserved'
      ],
      hints: [
        'Picture the tape cut at the head: two halves, each read from the head outward.',
        'Loading the input: push it all onto stack 1 (last symbol on top), then pop everything into stack 2 (first symbol on top).'
      ],
      solution: String.raw`**A TM simulates a two-stack PDA.** Use a 3-tape TM: tape 1 holds the input (read left to right, as the PDA does), tapes 2 and 3 hold the two stacks, with the top at the right end of the written part. A PDA step (read an input symbol or not, pop/push on each stack) is implemented by looking at the current symbols and rewriting near the right end of tapes 2 and 3. Accept when the PDA accepts. Then convert the 3-tape TM to a single tape.

**A two-stack PDA simulates a TM $M$.**
*Loading.* Read the whole input, pushing each symbol onto stack $L$; then pop everything from $L$ and push it onto $R$. Now $R$ holds the input with the first symbol on top, and $L$ is empty.

*Invariant.* $L$ holds the tape contents strictly left of the head (top = the cell immediately to the left of the head); $R$ holds the head cell and everything to its right (top = the head cell). An empty $R$ means the head is on a blank.

*One step* $\delta(q, c) = (p, d, \Delta)$, where $c$ is the top of $R$ (or the blank if $R$ is empty):
- $\Delta = $ right: pop $c$ from $R$ (if present) and push $d$ onto $L$.
- $\Delta = $ left: pop $c$ from $R$ (if present) and push $d$ onto $R$; then pop the top $e$ of $L$ and push it onto $R$. (If $L$ is empty, the head is at the left end; a one-way-tape TM stays put, so just leave $d$ on top of $R$.)

The finite control stores $M$'s state, and the PDA accepts when $M$ enters its accept state. Each TM step is $O(1)$ PDA moves, all $\varepsilon$-moves after loading, and the invariant is preserved, so the PDA accepts exactly $L(M)$.

(With **one** stack, the machine is an ordinary PDA and recognizes only context-free languages — the second stack is exactly what lets the machine get back to symbols it has passed.)`
    },
    {
      id: 'tm-countable',
      type: 'written',
      title: 'Encodings and counting: most languages are not recognizable',
      difficulty: 2,
      prompt: String.raw`(a) Describe a way to encode any Turing machine $M$ (any number of states and any finite tape alphabet) as a binary string $\langle M\rangle$, and explain why the set of valid encodings is decidable.

(b) Prove that the set of Turing machines is countable.

(c) Prove that the set of languages over $\{0, 1\}$ is uncountable, by diagonalization.

(d) Conclude that some language is not recognizable. Is the language you get from (c) explicit?`,
      rubric: [
        '(a) Number states and symbols, write each transition as a tuple in unary/binary with separators; header lists start/accept/reject/blank',
        '(a) Decidable: syntax check (well-formed tuples, numbers in range, no duplicate (state, symbol) pairs)',
        '(b) Each TM has a binary encoding; binary strings can be listed in shortlex order',
        '(c) Assume a list L_1, L_2, ...; build D = {w_i : w_i ∉ L_i}; D differs from every L_i',
        '(d) Countably many recognizable languages, uncountably many languages; D from (c) is explicit relative to an enumeration of TMs'
      ],
      hints: [
        'States can be named 1, 2, ..., n; symbols 1, 2, ..., m. Write numbers in unary (0^k) and separate fields by 1s.',
        'For (c): list strings w_1, w_2, ... in shortlex order; put w_i into D iff w_i is not in the i-th language.'
      ],
      solution: String.raw`**(a)** Name the states $1, \ldots, n$ (with 1 = start, 2 = accept, 3 = reject) and the tape symbols $1, \ldots, m$ (with 1 = blank and $2, \ldots, k+1$ the input symbols). Write a number $j$ as $0^j$ and moves as $0$ (left) and $00$ (right). A transition $\delta(q, a) = (p, b, \Delta)$ becomes $0^q\,1\,0^a\,1\,0^p\,1\,0^b\,1\,0^\Delta$, and transitions are separated by $11$. A header $0^n\,1\,0^m\,1\,0^k\,11$ comes first. Checking that a binary string is a valid encoding — the header parses, every transition has five fields with numbers in range, and no $(q, a)$ pair appears twice — is a finite left-to-right scan, so the set of valid encodings is decidable. (Every machine has at least one encoding; renaming states gives several, which is harmless.)

**(b)** Map each TM to (one of) its encodings. Distinct machines have distinct encodings, so this is an injection into $\{0,1\}^*$, which is countable: list it in shortlex order $\varepsilon, 0, 1, 00, 01, \ldots$. A subset of a countable set is countable.

**(c)** Suppose the languages over $\{0,1\}$ could be listed as $L_1, L_2, L_3, \ldots$. Let $w_1, w_2, \ldots$ be the strings in shortlex order and define $D = \{w_i : w_i \notin L_i\}$. For every $i$, $D$ and $L_i$ disagree about $w_i$ (if $w_i \in L_i$ then $w_i \notin D$, and vice versa), so $D \ne L_i$. Thus $D$ is missing from the list — contradiction. So the set of languages is uncountable.

**(d)** Every recognizable language is $L(M)$ for some TM $M$, so there are only countably many recognizable languages, but uncountably many languages; hence some (in fact most) languages are not recognizable. Applying (c) to the list $L(M_1), L(M_2), \ldots$ of recognizable languages (with $M_i$ the machine encoded by the $i$-th valid encoding) gives the explicit non-recognizable language $D = \{w_i : M_i \text{ does not accept } w_i\}$ — essentially the self-referential language of the next topic.`
    },
    {
      id: 'tm-universal',
      type: 'written',
      title: 'The universal TM and step-bounded simulation',
      difficulty: 2,
      prompt: String.raw`(a) Describe (at a high level, with a 3-tape layout) a universal Turing machine $U$ such that $U$ accepts $\langle M, w\rangle$ iff $M$ accepts $w$.

(b) Explain why $U$ is a recognizer for $\mathrm{ACCEPT} = \{\langle M, w\rangle : M \text{ accepts } w\}$ but not a decider.

(c) Prove that $\mathrm{ACCEPT}_{\le} = \{\langle M, w, 1^t\rangle : M \text{ accepts } w \text{ within } t \text{ steps}\}$ is decidable, and that the time of your decider is polynomial in the input length (for a fixed bound on the cost of one simulated step).`,
      rubric: [
        '(a) Tape layout: ⟨M⟩, encoded simulated tape with head position, current state',
        '(a) One simulated step: look up the transition for (state, scanned symbol), update tape cell, head position and state',
        '(a) Halts in accept/reject exactly when M does',
        '(b) If M loops on w, U loops; so U does not halt on every input',
        '(c) Simulate at most t steps with a counter (the unary 1^t); always halts; time polynomial in |⟨M⟩| + |w| + t'
      ],
      hints: [
        'The simulated tape stores encoded symbols (blocks of bits) separated by markers; the head position is a mark on one block.',
        'For (c), the unary bound makes the input long enough to pay for the simulation.'
      ],
      solution: String.raw`**(a)** $U$ first checks that its input is a valid $\langle M, w\rangle$. Tape 1 holds $\langle M\rangle$ (the transition table). Tape 2 holds $M$'s tape, each cell an encoded symbol (a fixed-width block of bits, separated by a marker), initially the encoding of $w$; the block under $M$'s head is marked. Tape 3 holds the encoding of $M$'s current state, initially the start state.

One simulated step: read the current state (tape 3) and the marked block (tape 2); scan tape 1 for the transition $(q, a) \mapsto (p, b, \Delta)$; overwrite the marked block with $b$, move the mark one block in direction $\Delta$ (appending a blank block if needed); write $p$ on tape 3. If $p$ is $M$'s accept state, $U$ accepts; if it is $M$'s reject state, $U$ rejects. Otherwise repeat.

**(b)** $U$ accepts exactly when $M$ accepts $w$, so $L(U) = \mathrm{ACCEPT}$: $U$ is a recognizer. But if $M$ loops on $w$, the simulation never ends and $U$ loops, so $U$ is not a decider. (No decider for ACCEPT exists at all — see the undecidability topic.)

**(c)** On input $\langle M, w, 1^t\rangle$: run $U$'s simulation, crossing off one $1$ of the unary counter per simulated step. Accept if $M$ accepts before the counter runs out; reject if $M$ rejects or the counter runs out. At most $t$ simulated steps are performed, so it always halts, and it accepts exactly when $M$ accepts $w$ within $t$ steps. Each simulated step costs time polynomial in $|\langle M\rangle|$ and in the length of the simulated tape, which is at most $|w| + t + 1$ blocks; so the total time is polynomial in $|\langle M\rangle| + |w| + t$, which is at most polynomial in the input length because $t$ is written in unary.`
    },
    {
      id: 'tm-lba-halting',
      type: 'written',
      title: 'Halting is decidable for space-bounded machines',
      difficulty: 3,
      prompt: String.raw`A **linear bounded automaton** (LBA) is a TM that never moves its head off the cells originally holding its input (it may overwrite them with any tape symbols). Prove that
$$\mathrm{HALT}_{\mathrm{LBA}} = \{\langle M, w\rangle : M \text{ is an LBA that halts on } w\}$$
is decidable, and similarly $\mathrm{ACCEPT}_{\mathrm{LBA}}$. Why does this not contradict the undecidability of HALT for general TMs?`,
      rubric: [
        'Counts configurations: |Q| · n · |Γ|^n for input length n (state, head position, tape contents)',
        'Pigeonhole: a run longer than that repeats a configuration, and a deterministic machine that repeats a configuration loops forever',
        'Decider: simulate for that many steps (+1); accept/reject accordingly; always halts',
        'ACCEPT_LBA: same simulation, answer according to the outcome',
        'Explains that a general TM has unboundedly many configurations, so no such bound exists'
      ],
      hints: [
        'How many different configurations can an LBA have on an input of length n?',
        'If a deterministic machine is ever in the same configuration twice, what happens afterwards?'
      ],
      solution: String.raw`Let $M$ have state set $Q$ and tape alphabet $\Gamma$, and let $n = |w| \ge 1$ (for $w = \varepsilon$ treat the single blank cell as the available space, $n = 1$). A configuration of $M$ on $w$ is determined by the state ($|Q|$ choices), the head position ($n$ choices, since $M$ stays on the input cells), and the contents of the $n$ cells ($|\Gamma|^n$ choices). So there are at most $B = |Q|\cdot n\cdot|\Gamma|^n$ distinct configurations.

**Key fact.** $M$ is deterministic, so the next configuration is a function of the current one. If $M$ runs for more than $B$ steps without halting, then among the first $B + 1$ configurations two are equal (pigeonhole), say $C_i = C_j$ with $i < j$; then $C_{i+k} = C_{j+k}$ for all $k$ and $M$ cycles forever through non-halting configurations.

**Decider for $\mathrm{HALT}_{\mathrm{LBA}}$.** On input $\langle M, w\rangle$ (after checking it is a valid encoding): compute $B$ and simulate $M$ on $w$ for at most $B$ steps. If $M$ halts within those steps, accept; otherwise reject. This always halts, and by the key fact it rejects only machines that never halt. For $\mathrm{ACCEPT}_{\mathrm{LBA}}$, run the same simulation and accept iff $M$ entered its accept state within $B$ steps.

(Whether a given machine actually *is* an LBA is a different matter; a common convention is that the decider is given the promise that $M$ is an LBA, or that the simulation also rejects/flags any attempt to leave the input region — which makes the machine an LBA by construction.)

**No contradiction.** A general TM can use unboundedly many cells, so the number of reachable configurations is unbounded and a run can be infinite without ever repeating a configuration (e.g. a machine that moves right forever). There is no computable bound $B$, and indeed HALT is undecidable.`
    },
    {
      id: 'tm-ww-2tape',
      type: 'written',
      title: 'Multi-tape design: deciding ww in linear time',
      difficulty: 2,
      prompt: String.raw`Describe a **2-tape** TM that decides $\{ww : w \in \{a,b\}^*\}$ in $O(n)$ steps. Then explain what happens to the running time if you convert it to a single-tape TM with the standard simulation, and compare with the direct single-tape machine (which takes $O(n^2)$ steps).`,
      rubric: [
        'Finds the length/middle in O(n) using the second tape (e.g. copy the input, or move a head at half speed)',
        'Compares the two halves in one simultaneous pass with two heads',
        'Checks even length and rejects odd lengths',
        'Correct O(n) analysis',
        'Standard simulation gives O(t(n)^2) = O(n^2) single-tape steps'
      ],
      hints: [
        'Copy the input to tape 2. Now move head 1 two cells per step to the right and head 2 one cell per step: when head 1 reaches the end, head 2 is at the middle.',
        'Then compare tape 1 from the start with tape 2 from the middle.'
      ],
      solution: String.raw`**Machine** (tape 1 holds the input $x$, $|x| = n$):
1. Copy $x$ onto tape 2, then move both heads back to the left ends. ($O(n)$ steps.)
2. Move head 1 right two cells for every one cell head 2 moves right, until head 1 reads a blank. If head 1 hits the blank in the middle of a double step, $n$ is odd: **reject**. Otherwise head 2 is now on cell $n/2$ (the first symbol of the second half). ($O(n)$ steps.)
3. Move head 1 back to the left end ($O(n)$).
4. Move both heads right in lockstep, comparing: head 1 reads $x_1, x_2, \ldots$ and head 2 reads $x_{n/2+1}, x_{n/2+2}, \ldots$. If some pair differs, **reject**. When head 2 reaches the blank, **accept** (head 1 is then exactly at the middle). ($O(n)$ steps.)

Correctness: step 2 rejects odd lengths and finds position $n/2$; step 4 accepts iff $x_i = x_{n/2+i}$ for all $1 \le i \le n/2$, i.e. iff $x = ww$. Total $O(n)$ steps, and it always halts.

**Single-tape conversion.** The standard simulation turns a $t(n)$-step multi-tape machine into an $O(t(n)^2)$-step single-tape machine, here $O(n^2)$ — the same as the direct single-tape marking algorithm (which shuttles across the tape once per symbol). This is not an accident of the simulation: a classic crossing-sequence argument shows that single-tape machines need $\Omega(n^2)$ steps in the worst case for comparison languages like this one (and like the palindromes), so the second tape genuinely saves more than a constant factor.`
    }
  ]
});
