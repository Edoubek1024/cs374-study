CS374.topic({
  id: 'regex',
  unit: 'models',
  order: 2,
  title: 'Regular Languages & Regular Expressions',
  summary: 'The inductive definition of regular languages, regular expression syntax and semantics, and a toolkit of patterns, identities and pitfalls for writing regexes for described languages.',
  objectives: [
    'State the inductive definition of regular languages and of the language L(r) of a regex',
    'Read regexes correctly using precedence (star, then concatenation, then union)',
    'Write a correct regex for a described language, including edge cases like the empty string',
    'Use and check regex identities; refute false identities with counterexamples',
    'Argue both directions when justifying that a regex matches a description',
  ],

  lesson: String.raw`## Regular languages, defined inductively

The **regular languages** are the languages you can build from very small pieces using three operations. Over an alphabet $\Sigma$:

> **Definition.** A language $L \subseteq \Sigma^*$ is **regular** if it is one of
> - $\varnothing$ (the empty language),
> - $\{\varepsilon\}$,
> - $\{a\}$ for a single symbol $a \in \Sigma$,
>
> or it is obtained from regular languages $A, B$ by
> - union $A \cup B$,
> - concatenation $A \bullet B$,
> - Kleene star $A^*$.
>
> (And nothing else is regular: it is the *smallest* class containing the base languages and closed under the three operations.)

A **regular expression** is simply a written-down recipe for such a construction. Because the definition is inductive, every proof "for every regular language ..." can go by induction on the regex, with three base cases and three inductive cases. You will see exactly this pattern in Thompson's construction, in closure proofs, and in the structural-induction section of this lesson.

## Syntax and semantics

CS 374 uses Erickson's notation:

| Regex $r$ | Language $L(r)$ |
|---|---|
| $\varnothing$ | $\varnothing$ |
| $\varepsilon$ | $\{\varepsilon\}$ |
| $a$ (a symbol) | $\{a\}$ |
| $r + s$ | $L(r) \cup L(s)$ |
| $rs$ | $L(r) \bullet L(s)$ |
| $r^*$ | $L(r)^*$ |

Note that **$+$ means union**, not "one or more" as in programming regexes. When you need "one or more copies of $r$", write $rr^*$ (some texts write $r^+$). We also use the shorthand $\Sigma$ for "any one symbol", e.g. $\Sigma = 0 + 1$ when $\Sigma = \{0,1\}$.

**Precedence:** star binds tightest, then concatenation, then union. So $01^* + 1$ means $(0(1^*)) + 1$, not $(01)^* + 1$ and not $0(1^* + 1)$. When in doubt, add parentheses — graders never penalize clarity.

> **Example.** Over $\{0,1\}$:
> - $0^*10^*$: exactly one 1.
> - $(0+1)^*00(0+1)^*$: contains $00$ as a substring.
> - $(0+1)^*1$: ends in 1.
> - $(00)^*$: even number of 0s and nothing else (strings $0^{2k}$).
> - $\varnothing^* = \varepsilon$ (as languages, $\{\varepsilon\}$).

Regexes describe languages; two different regexes are **equivalent** if they describe the same language, e.g. $(0+1)^*$ and $(0^*1^*)^*$ are equivalent.

## How to write a regex for a described language

There is no mechanical recipe, but these strategies cover almost everything you will see on homework and exams.

### Strategy 1: describe the shape, then translate

Ask: *what does a typical string look like, as a sequence of pieces?* Then translate each piece.

- "contains $x$ as a substring" $\to$ $\Sigma^* x \Sigma^*$.
- "starts with $x$" $\to$ $x\Sigma^*$; "ends with $x$" $\to$ $\Sigma^* x$.
- "exactly $k$ copies of $a$" $\to$ alternate "non-$a$ stretches" and $a$s: over $\{a,b\}$, exactly two $a$s is $b^*ab^*ab^*$.
- "at most one 1" $\to$ $0^*(\varepsilon + 1)0^*$.
- "length divisible by $k$" $\to$ $(\Sigma^k)^*$.
- "has $x$ as a subsequence" $\to$ put $\Sigma^*$ between and around the symbols of $x$: $\Sigma^* a \Sigma^* b \Sigma^*$.

### Strategy 2: chop into blocks

If the condition is local ("every 1 is followed by 0", "no two consecutive 1s", "every block of 1s has even length"), find a set of **blocks** such that the strings of the language are exactly the concatenations of blocks, then star them.

**Example: no two consecutive 1s.** Every 1 except possibly a final one is followed by a 0, so pair each such 1 with the 0 after it. The string becomes a sequence of blocks $0$ and $10$, possibly followed by one trailing $1$:

$$(0 + 10)^*(\varepsilon + 1).$$

Test it — it should accept $\varepsilon$, $1$, $0101$, $10010$ and reject anything containing $11$:

~~~regex
(0+10)*(ε+1)
alphabet: 01
~~~

**Why both directions matter.** To be sure the regex is right, argue (a) every string the regex generates has no $11$ — inside the starred part, every 1 is immediately followed by 0, and the optional final 1 is preceded by either nothing or a block ending in 0; and (b) every string with no $11$ can be generated — use the pairing argument above. A regex that is "obviously right" in one direction is often wrong in the other.

The same idea handles "no $000$": cut the string just after every 1. Each piece is $1$, $01$ or $001$ (at most two 0s before each 1), and after the last 1 there are at most two 0s:

$$(1 + 01 + 001)^*(\varepsilon + 0 + 00).$$

### Strategy 3: parity and counting

"Even number of 1s" means the 1s come in pairs. Each pair, together with the 0s after its first and second 1, forms a block $10^*10^*$; allow leading 0s:

$$0^*(10^*10^*)^*.$$

~~~regex
0*(10*10*)*
alphabet: 01
~~~

Generalizing, "number of 1s divisible by 3" is $0^*(10^*10^*10^*)^*$.

### Strategy 4: case split with $+$

If a description has naturally separate cases, write a regex for each and union them. "Begins and ends with the same symbol" over $\{0,1\}$:

$$0 + 1 + 0\Sigma^*0 + 1\Sigma^*1.$$

Do not forget the length-1 strings $0$ and $1$ — they begin and end with the same symbol! Similarly, "contains both $00$ and $11$" is
$\Sigma^*00\Sigma^*11\Sigma^* + \Sigma^*11\Sigma^*00\Sigma^*$, because either pattern can come first (and they cannot overlap, since they share no symbols).

### Strategy 5: when the condition is negative

"Does **not** contain $x$" is the hardest kind of description to write directly; regexes have no complement operator. Options:

1. Reason about what must happen *after* each dangerous prefix of $x$ (like the no-$11$ example).
2. Build a DFA for "contains $x$", complement it (swap accepting states), and convert the DFA back to a regex (state elimination, previewed below and covered fully with NFAs).

> **Exam tip.** For "does not contain $x$", sanity-check your regex on strings that *almost* contain $x$, on strings that begin or end with part of $x$, and on $\varepsilon$.

### Strategy 6: think like a DFA

Some conditions are about combined counts ("even number of 0s **and** even number of 1s", "the binary value is divisible by 3"). These are easy to recognize with a small DFA and awkward to describe as blocks. The trick is to think about the DFA anyway: a regex for the language is a description of all walks from the start state back to an accepting state. For one accepting state equal to the start state, that is "(any loop that returns to the start)$^*$" — and each kind of loop becomes a term of a union. The two walkthroughs below use exactly this idea.

## Identities

Writing $r \equiv s$ for $L(r) = L(s)$, the following always hold:

| Identity | Comment |
|---|---|
| $r + \varnothing \equiv r$ | $\varnothing$ is the identity for union |
| $r\varnothing \equiv \varnothing r \equiv \varnothing$ | $\varnothing$ annihilates concatenation |
| $r\varepsilon \equiv \varepsilon r \equiv r$ | $\varepsilon$ is the identity for concatenation |
| $r + r \equiv r$, $r + s \equiv s + r$ | union is idempotent, commutative |
| $r(s + t) \equiv rs + rt$, $(s+t)r \equiv sr + tr$ | concatenation distributes over union |
| $\varnothing^* \equiv \varepsilon^* \equiv \varepsilon$ | |
| $(r^*)^* \equiv r^*$, $r^*r^* \equiv r^*$ | |
| $(\varepsilon + r)^* \equiv r^*$ | |
| $r^*r \equiv rr^*$ | both mean "one or more" |
| $(rs)^*r \equiv r(sr)^*$ | the "shifting" identity |
| $(r + s)^* \equiv (r^*s^*)^* \equiv (r^* s)^* r^* \equiv r^*(sr^*)^*$ | |

And the following **fail in general** (be ready to give counterexamples):

| Non-identity | Counterexample |
|---|---|
| $(r+s)^* \equiv r^* + s^*$ | $r = 0, s = 1$: $01$ is on the left only |
| $(rs)^* \equiv r^*s^*$ | $r=0,s=1$: $00$ is on the right only; $0101$ on the left only |
| $rs \equiv sr$ | $r=0,s=1$ |
| $(r s)^* \equiv (sr)^*$ | $r=0,s=1$: $01$ vs $10$ |
| $r(s^*) \equiv (rs)^*$ | $\varepsilon$ is on the right only (when $\varepsilon \notin L(r)$) |
| $(r^*s)^* \equiv (r+s)^*$ | $r=0,s=1$: $0$ is on the right only (left side strings are empty or end in an $s$-piece) |

To **prove** an identity you show two language inclusions; to **disprove** one you exhibit one string in one side but not the other. The second is almost always what an exam asks for.

### A full identity proof: the shifting identity

**Claim.** $L((rs)^*r) = L(r(sr)^*)$.

**Proof.** Write $R = L(r)$ and $S = L(s)$. We show both sides equal $\bigcup_{k \ge 0} R\,(SR)^k$, where $(SR)^k$ means $k$ copies of $SR$ concatenated.

- **Left side.** $(RS)^* R = \bigcup_{k \ge 0} (RS)^k R$. By associativity of language concatenation, $(RS)^k R = R\,(SR)^k$: both are the set of strings $x_0 y_1 x_1 y_2 \cdots y_k x_k$ with every $x_i \in R$ and every $y_i \in S$. (Formally, induct on $k$: $(RS)^0R = R = R(SR)^0$, and $(RS)^{k+1}R = RS\,(RS)^kR = RS\,R(SR)^k = R\,(SR)\,(SR)^k = R(SR)^{k+1}$.)
- **Right side.** $R(SR)^* = R \bigcup_{k\ge0} (SR)^k = \bigcup_{k \ge 0} R\,(SR)^k$, since concatenation distributes over (even infinite) unions.

So both sides are the same union. $\blacksquare$

Concatenation distributes over arbitrary unions because $w \in A \bigcup_i B_i$ iff $w = xy$ with $x \in A$ and $y \in B_i$ for some $i$, iff $w \in \bigcup_i AB_i$.

## Proving that a regex matches a description

On exams, "write a regex for $L$" usually comes with "and briefly justify". A complete justification has two parts:

1. **Soundness (regex $\Rightarrow$ property):** every string generated by the regex satisfies the description. Argue piece by piece: what does each starred block guarantee, and why does concatenating blocks preserve it?
2. **Completeness (property $\Rightarrow$ regex):** every string satisfying the description can be generated. Give an explicit *parsing procedure*: "cut the string just before the 1st, 4th, 7th, ... occurrence of $a$", "pair each 1 with the 0 after it", "split at each boundary between runs". Then check each piece matches its part of the regex.

The completeness direction is the one students skip, and the one where wrong regexes fail. A typical wrong answer for "no $11$" is $(0+10)^*$: it is sound (no generated string contains $11$), but incomplete (it cannot generate $1$ or $01$).

## Worked exam-style examples

### Example A (try it first): every odd position holds a 0

Positions are numbered from 1. Write a regex for the binary strings $a_1a_2\cdots a_n$ with $a_1 = a_3 = a_5 = \cdots = 0$, and check it on $\varepsilon$, $1$, $01$, $011$.

~~~~reveal Solution
Chop the string into consecutive pairs (positions 1–2, 3–4, ...). Each full pair is "0 then anything", i.e. $0\Sigma$. If the length is odd, a final lone symbol sits at an odd position and must be 0. So

$$(0\Sigma)^*(\varepsilon + 0).$$

Edge cases: $\varepsilon$ is in (no odd positions), $1$ is out, $01$ is in, $011$ is out. The block decomposition was the whole proof: blocks of length 2 keep the parity of positions aligned. A common wrong answer is $(0\Sigma)^*$, which misses every odd-length string such as $0$ and $010$.

~~~regex
(0Σ)*(ε+0)
alphabet: 01
~~~
~~~~

### Example B (try it first): number of $a$s divisible by 3, over $\{a,b,c\}$

Write a regex for the strings over $\{a,b,c\}$ whose number of $a$s is a multiple of 3, and justify **completeness** (every such string is generated).

~~~reveal Solution
This is Strategy 3 with a bigger alphabet. Let $N = (b+c)^*$ stand for a stretch with no $a$. Then group the $a$s in triples:

$$N\,(aNaNaN)^*, \quad\text{i.e.}\quad (b+c)^*\big(a(b+c)^*a(b+c)^*a(b+c)^*\big)^*.$$

Every generated string has a multiple of 3 $a$s, because $a$s only appear inside the starred triple. Conversely, given a string with $3k$ $a$s, cut it just *before* the 1st, 4th, 7th, ... $a$. The prefix before the first $a$ matches $N$, and each of the $k$ remaining chunks contains exactly three $a$s, each followed by a (possibly empty) non-$a$ stretch, so it matches $aNaNaN$. This "cut before every third occurrence" argument is the standard way to justify counting regexes.
~~~

### Example C: does not contain $010$

This is Strategy 5. An occurrence of $010$ is precisely a run of 1s of length *exactly one* that has a 0 immediately on both sides. Think of a string as alternating runs: an optional initial run of 1s, then alternately 0-runs and 1-runs. The constraint applies only to 1-runs that are *interior* (0s on both sides): they need length $\ge 2$. The final 1-run, if any, can have any length. This gives

$$1^*\big(\varepsilon + 00^*(111^*00^*)^*(\varepsilon + 11^*)\big).$$

Read it piece by piece: $1^*$ is the initial run; $00^*$ the first 0-run; each $(111^*00^*)$ is an interior 1-run of length $\ge 2$ followed by the next 0-run; $(\varepsilon + 11^*)$ is the optional final 1-run. You will see this language again as a DFA (complement of "contains $010$") — DFA-then-convert is often less error-prone than direct reasoning for negative conditions.

~~~regex
1*(ε + 00*(111*00*)*(ε + 11*))
alphabet: 01
~~~

### Example D: reading off a description

What is $L\big((0 + 1)^*1(0+1)\big)$? A string matches iff it can be written $u\,1\,a$ for a symbol $a$, i.e. iff its **second-to-last** symbol is 1. Recognizing "fixed position from the end" regexes like this will matter a lot when we study NFAs, because they are small as regexes and NFAs but provably large as DFAs.

> **Exam tip.** After writing a regex, list its three or four shortest strings and three or four short strings it should accept but might not (edge cases). Five seconds of testing catches most bugs. The interactive testers in this app show the shortest strings in a regex's language — use them.

### Try it first: exactly one occurrence of $00$

Write a regex for the binary strings that contain $00$ as a substring **exactly once**. (Careful: $000$ contains two occurrences, at positions 1–2 and 2–3.)

~~~~reveal Solution
Look at the unique occurrence and write $w = x\,00\,y$.
- $x$ contains no $00$, and $x$ must not end in 0 (otherwise $x$'s last 0 and the first 0 of the occurrence form a second occurrence). The strings with no $00$ that are empty or end in 1 are exactly those in which every 0 is immediately followed by a 1: $(1 + 01)^*$.
- Symmetrically, $y$ contains no $00$ and must not start with 0: every 0 is immediately *preceded* by a 1: $(1 + 10)^*$.

$$(1+01)^*\,00\,(1+10)^*.$$

**Soundness:** in such a string, no $00$ lies inside $x$ or inside $y$, and none straddles a boundary (the symbol before the middle $00$ is a 1 or nothing; the symbol after it is a 1 or nothing). **Completeness:** given $w$ with exactly one occurrence, take $x$ and $y$ as above; the argument just given shows they match their parts.

~~~regex
(1+01)*00(1+10)*
alphabet: 01
~~~
~~~~

### Try it first: every $a$ is eventually followed by a $b$

Over $\{a, b\}$, write a regex for the strings in which every $a$ has *some* $b$ somewhere after it (not necessarily immediately).

~~~reveal Solution
It is tempting to build blocks, but think about the *last* $a$ instead. If the string has no $a$ at all, it qualifies. If it has an $a$, the last $a$ needs a $b$ after it, so the string ends in $b$. Conversely, if the string ends in $b$, that final $b$ comes after every $a$. So the language is "empty, or ends in $b$" (strings with no $a$ are either empty or end in $b$):

$$\varepsilon + \Sigma^* b.$$

A good habit: before writing anything complicated, ask whether the condition collapses to something simple. Conditions of the form "every X has a Y somewhere later" usually depend only on the end of the string.
~~~

### Try it first: contains both $01$ and $10$

Write a regex for the binary strings containing both $01$ and $10$ as substrings. Why is $\Sigma^*01\Sigma^*10\Sigma^* + \Sigma^*10\Sigma^*01\Sigma^*$ wrong?

~~~reveal Solution
The occurrences may **overlap**: $010$ contains both ($01$ at positions 1–2, $10$ at 2–3), but the union above requires four symbols. Correct reasoning: a string contains both patterns iff it has at least three maximal runs, i.e. iff it contains $0\,1^k\,0$ or $1\,0^k\,1$ for some $k \ge 1$. (If an $01$ comes before some $10$, then from that 1 walk right to the first 0 — only 1s in between — giving $011^*0$; symmetrically if a $10$ comes first.)

$$\Sigma^*(011^*0 + 100^*1)\Sigma^*.$$

The shortest strings in the language are $010$ and $101$.
~~~

### Walkthrough: even number of 0s and even number of 1s

~~~~steps Designing a regex for "even #0s and even #1s" by thinking about a DFA
**Look at the DFA first.** Track both parities: four states $EE, EO, OE, OO$ (parity of 0s, parity of 1s). Start and accept $EE$. A 0 flips the first coordinate, a 1 flips the second.

~~~automaton
alphabet: 01
start: EE
accept: EE
EE 0 -> OE
EE 1 -> EO
OE 0 -> EE
OE 1 -> OO
EO 0 -> OO
EO 1 -> EE
OO 0 -> EO
OO 1 -> OE
~~~
+++
**Observe: the length is even.** $\#0 + \#1 = |w|$, so two even counts force even length. Read the string **two symbols at a time**. A pair is either *same* ($00$ or $11$: both parities unchanged) or *mixed* ($01$ or $10$: both parities flip).
+++
**Collapse the DFA.** After an even-length prefix, the two parities are equal (their sum is even), so we are in $EE$ or $OO$. A same pair stays put; a mixed pair toggles $EE \leftrightarrow OO$. So the language is "sequences of pairs with an even number of mixed pairs".
+++
**Write the loops at $EE$.** A walk that leaves $EE$ and first returns to it is either one same pair ($00 + 11$), or a mixed pair, any number of same pairs while in $OO$, and a mixed pair back: $(01 + 10)(00 + 11)^*(01 + 10)$. Star the union of the loops:

$$\big(00 + 11 + (01+10)(00+11)^*(01+10)\big)^*.$$
+++
**Justify.** Soundness: each loop has two mixed pairs or none, so both parities stay even. Completeness: split any string in the language into pairs; cut after each pair that brings us back to $EE$; each piece is one of the loops.

~~~regex
(00+11+(01+10)(00+11)*(01+10))*
alphabet: 01
~~~
~~~~

### Walkthrough: binary multiples of 3 by state elimination

~~~~steps From the mod-3 DFA to the regex (0+1(01*0)*1)*
**The DFA.** Reading bit $b$ in state $r$ (= value so far mod 3) goes to $(2r + b) \bmod 3$. Start and accept $r_0$; $\varepsilon$ has value 0.

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
+++
**The elimination rule.** To remove a state $q$ with self-loop label $\ell$: for every pair of edges $p \xrightarrow{\alpha} q \xrightarrow{\beta} t$, add the label $\alpha\,\ell^*\,\beta$ to the edge $p \to t$ (union it with whatever label is already there). Every walk through $q$ is captured: enter, loop any number of times, leave.
+++
**Eliminate $r_2$.** Its only in-edge is $r_1 \xrightarrow{0} r_2$, its self-loop is $1$, its only out-edge is $r_2 \xrightarrow{0} r_1$. So $r_1$ gets a new self-loop $0\,1^*\,0$. The remaining machine: $r_0 \xrightarrow{0} r_0$, $r_0 \xrightarrow{1} r_1$, $r_1 \xrightarrow{01^*0} r_1$, $r_1 \xrightarrow{1} r_0$.
+++
**Eliminate $r_1$.** In-edge $r_0 \xrightarrow{1} r_1$, self-loop $01^*0$, out-edge $r_1 \xrightarrow{1} r_0$. So $r_0$'s self-loop becomes $0 + 1(01^*0)^*1$.
+++
**Read off the answer.** Only $r_0$ remains, start and accepting, with a self-loop. The language is all repetitions of that loop:

$$\big(0 + 1(01^*0)^*1\big)^*.$$

Check: $11 = 3$ ✓ (the loop $1\,\varepsilon\,1$), $110 = 6$ ✓, $1001 = 9$ ✓ ($1\,(00)\,1$ with $01^*0 = 00$), and $111 = 7$ is not generated.

~~~regex
(0+1(01*0)*1)*
alphabet: 01
~~~
~~~~

## Structural induction on regular expressions

Since regexes are defined inductively, we can prove things about *all* regexes (and hence all regular languages) by structural induction: three base cases ($\varnothing$, $\varepsilon$, a symbol) and three inductive cases ($r + s$, $rs$, $r^*$), where in the inductive cases we may assume the claim for the smaller regexes $r$ and $s$.

> **Theorem.** If $L$ is regular, then $L^R$ is regular.

**Proof.** We define a function $\textit{rev}$ on regexes and prove $L(\textit{rev}(r)) = L(r)^R$ for every regex $r$, by structural induction.

| $r$ | $\textit{rev}(r)$ | why $L(\textit{rev}(r)) = L(r)^R$ |
|---|---|---|
| $\varnothing$ | $\varnothing$ | $\varnothing^R = \varnothing$ |
| $\varepsilon$ | $\varepsilon$ | $\{\varepsilon\}^R = \{\varepsilon\}$ |
| $a$ | $a$ | $\{a\}^R = \{a\}$ |
| $r_1 + r_2$ | $\textit{rev}(r_1) + \textit{rev}(r_2)$ | $(A \cup B)^R = A^R \cup B^R$, then the IH |
| $r_1 r_2$ | $\textit{rev}(r_2)\,\textit{rev}(r_1)$ | $(AB)^R = B^R A^R$, then the IH |
| $r_1^*$ | $\textit{rev}(r_1)^*$ | $(A^*)^R = (A^R)^*$, then the IH |

The three language identities in the last column follow from $(xy)^R = y^R x^R$: for instance, $w \in (AB)^R$ iff $w = (xy)^R = y^R x^R$ with $x \in A$, $y \in B$, iff $w \in B^R A^R$. For the star, apply the concatenation identity $k$ times to $A^k$ (induction on $k$), then take the union over $k$. Since every regular language is $L(r)$ for some regex $r$, its reversal is $L(\textit{rev}(r))$, which is regular. $\blacksquare$

The same template proves many facts. Two useful ones:

- **Does $L(r)$ contain $\varepsilon$?** Define $\textit{null}(\varnothing) = \text{false}$, $\textit{null}(\varepsilon) = \text{true}$, $\textit{null}(a) = \text{false}$, $\textit{null}(r+s) = \textit{null}(r) \lor \textit{null}(s)$, $\textit{null}(rs) = \textit{null}(r) \land \textit{null}(s)$, $\textit{null}(r^*) = \text{true}$. Structural induction shows $\textit{null}(r) \iff \varepsilon \in L(r)$; the concatenation case holds because $\varepsilon = xy$ forces $x = y = \varepsilon$.
- **Is $L(r)$ empty?** A regex that does not mention $\varnothing$ never denotes $\varnothing$: base cases $\varepsilon$ and $a$ are non-empty; unions and concatenations of non-empty languages are non-empty; and every star contains $\varepsilon$.

> **Warning.** In a structural induction you may apply the hypothesis only to the **immediate sub-expressions** (or any smaller ones), not to arbitrary regexes. And you must handle all six cases — forgetting $\varnothing$ is the most common omission.

## Every finite language is regular

> **Theorem.** Every finite language is regular.

*Proof sketch.* A single string $w = a_1 a_2 \cdots a_n$ gives the regex $a_1a_2\cdots a_n$ (or $\varepsilon$ if $n = 0$). A finite language $\{w_1, \ldots, w_k\}$ is $w_1 + \cdots + w_k$, and $\varnothing$ is regular by definition. Formally, induct on $|L|$: $\varnothing$ is regular, and $L = L' \cup \{w\}$ with $|L'| < |L|$ is the union of two regular languages.

> **Warning.** This does *not* extend to infinite unions. Every language is a union of (possibly infinitely many) singletons, and singletons are regular, yet many languages (like $\{0^n1^n : n \ge 0\}$) are not regular. Closure under union is only for *finitely* many languages.

## Common exam problem patterns

**1. "Write a regex for $L$" (with a short justification).** Recipe: classify the condition — substring/prefix/suffix (Strategy 1), local block condition (Strategy 2), counting/parity (Strategy 3), several cases (Strategy 4), negative condition (Strategy 5), combined counts or arithmetic (Strategy 6, think DFA). Write it, test the shortest strings, then justify both soundness and completeness.

**2. "Describe $L(r)$ in English."** Recipe: find what each starred block guarantees (an invariant), then test the description on short strings in both directions. Watch for $\varepsilon$ and for what happens at the very end of the string.

**3. "Prove or disprove $r \equiv s$."** Recipe: try $r = 0$, $s = 1$ and enumerate short strings of each side; the shortest string in the symmetric difference is your counterexample. If you believe it is true, prove two inclusions with an explicit parsing argument, or chain known identities.

**4. "Is this regex correct for $L$? If not, give a counterexample."** Recipe: test $\varepsilon$, single symbols, strings at the boundary of the condition (almost-matches, overlaps, patterns at the very start or end). State which direction fails (accepts something it shouldn't, or misses something).

**5. "Prove a property of all regular languages by induction on regexes."** (e.g. closure under reversal, under a homomorphism, "every regex without $\varnothing$ is non-empty".) Recipe: define the transformation case by case on the six regex forms; prove correctness for each case, applying the IH to sub-expressions.

**6. "Convert this small DFA to a regex."** Recipe: state elimination (rip out states one at a time, adding $\alpha\ell^*\beta$ labels), or the "loops at the start state" shortcut when the start state is the only accepting state.

## Where students lose points

1. **Forgetting $\varepsilon$.** Does the description include the empty string? "Every $a$ is followed by $b$" does (vacuously). "Ends in 1" does not.
2. **Forgetting short strings.** "Begins and ends with the same symbol" includes $0$ and $1$. "Does not end in $01$" includes $\varepsilon$, $0$ and $1$.
3. **Using programming-regex syntax.** No <code>.</code>, no <code>?</code>, no <code>[01]</code>, and $+$ is union. Write $\Sigma$, $(\varepsilon + r)$, $(0+1)$.
4. **Overlapping patterns.** "Contains $010$ twice": the occurrences may overlap ($01010$). $\Sigma^*010\Sigma^*010\Sigma^*$ misses $01010$. Same issue for "contains $01$ and $10$".
5. **Star of a union vs union of stars.** $(0+1)^*$ is all strings; $0^* + 1^*$ is only the strings that are all-0 or all-1.
6. **Using regexes for non-regular things.** "Equal numbers of 0s and 1s" has no regex at all; don't try to fake one with $(01)^*$ or $(01+10)^*$ (the latter misses $0011$).
7. **Only one direction justified.** Sound but incomplete regexes are the most common wrong answers; graders look for the parsing argument.
8. **Trailing pieces.** Block regexes like $(0 + 10)^*$ often need a tail term like $(\varepsilon + 1)$ for strings that end in the middle of a block.

## Reading a regex

When given a regex and asked to describe its language in English, find the "invariant" each starred piece maintains. For $(1 + 01)^*$: every block ends in 1, so every 0 is followed by a 1 — the language is "every 0 is immediately followed by a 1". For $(0 + 1)^*1(0+1)(0+1)$: "third symbol from the end is 1". For $(b + ab^*a)^*$: blocks either contain no $a$ or exactly two, so the number of $a$s is even — and conversely any string with an even number of $a$s splits into such blocks (pair up the $a$s; each pair and the $b$s between them is an $ab^*a$ block, the other $b$s are blocks on their own). Then test the description against short strings in both directions.

## Self-check

**1.** Is $\varepsilon \in L\big((0 + 1)^*1 + 0^*\big)$?

~~~reveal Answer
Yes: $0^*$ contains $\varepsilon$, and a union contains everything either side contains.
~~~

**2.** Give the shortest string in the symmetric difference of $(0+1)^*$ and $(0^*1)^*$.

~~~reveal Answer
$0$. Every non-empty string of $(0^*1)^*$ ends in 1, so $0$ (and every string ending in 0) is missing. That is why the correct identity is $(r+s)^* \equiv (r^*s)^*r^*$, with the trailing $r^*$.
~~~

**3.** What is $\textit{rev}\big((01 + 1)^*0\big)$?

~~~reveal Answer
$0\,(10 + 1)^*$: reverse the order of every concatenation (the outer one and the one inside $01$), keep unions and stars.
~~~

**4.** A student writes $(1+01+001)^*$ for "no $000$". Shortest counterexample?

~~~reveal Answer
$0$: it contains no $000$ but every non-empty generated string ends in 1. The fix is the tail $(\varepsilon + 0 + 00)$.
~~~

**5.** Without converting anything, decide whether $\varepsilon \in L\big((0+\varepsilon)(1^*0)\big)$.

~~~reveal Answer
No. $\textit{null}(rs) = \textit{null}(r) \land \textit{null}(s)$; the second factor $1^*0$ is not nullable (every string in it ends in 0).
~~~

**6.** Which string is in $L\big((0+1(01^*0)^*1)^*\big)$: $1010$ or $1100$?

~~~reveal Answer
$1100 = 12$ is a multiple of 3, so it is in; parse it as $(1\,\varepsilon\,1)(0)(0)$. $1010 = 10$ is not.
~~~

**7.** True or false: $(b + ab^*a)^*b$ describes the strings over $\{a,b\}$ with an even number of $a$s that end in $b$.

~~~reveal Answer
True. $(b + ab^*a)^*$ is exactly the strings with an even number of $a$s, and appending $b$ gives exactly those that additionally end in $b$ (a string ending in $b$ is $xb$, and $x$ has the same number of $a$s).
~~~

## Where this is going

Kleene's theorem says regular expressions, DFAs and NFAs describe exactly the same languages. Regexes are great for *describing* a language compactly; automata are great for *recognizing* membership and for constructions like complement and intersection that regexes cannot express directly. Much of the next few topics is about moving fluently between the three — and the walkthroughs above (thinking in terms of a DFA's loops, state elimination) are your first taste of that translation.
`,

  cheatsheet: String.raw`## Regular languages (inductive)
- Base: $\varnothing$, $\{\varepsilon\}$, $\{a\}$. Operations: $\cup$, $\bullet$, $^*$. Smallest such class.

## Syntax (Erickson)
- $r + s$ union, $rs$ concatenation, $r^*$ star, $\varepsilon$, $\varnothing$, $\Sigma$ = any symbol.
- Precedence: $^*$ > concat > $+$. "One or more" = $rr^*$. Optional = $(\varepsilon + r)$.

## Pattern table (over $\{0,1\}$ unless noted)
| Language | Regex |
|---|---|
| contains $x$ | $\Sigma^*x\Sigma^*$ |
| ends with $x$ | $\Sigma^*x$ |
| does not end in $01$ | $\varepsilon+0+1+\Sigma^*(00+10+11)$ |
| exactly one 1 | $0^*10^*$ |
| at most one 1 | $0^*(\varepsilon+1)0^*$ |
| even # of 1s | $0^*(10^*10^*)^*$ |
| no $11$ | $(0+10)^*(\varepsilon+1)$ |
| no $000$ | $(1+01+001)^*(\varepsilon+0+00)$ |
| no $010$ | $1^*(\varepsilon+00^*(111^*00^*)^*(\varepsilon+11^*))$ |
| exactly one $00$ | $(1+01)^*00(1+10)^*$ |
| contains $01$ and $10$ | $\Sigma^*(011^*0+100^*1)\Sigma^*$ |
| every 0 followed by 1 | $(1+01)^*$ |
| every 1 followed by $00$ | $(0+100)^*$ |
| even #0 and even #1 | $(00+11+(01+10)(00+11)^*(01+10))^*$ |
| binary multiple of 3 | $(0+1(01^*0)^*1)^*$ |
| length $\equiv 0 \bmod k$ | $(\Sigma^k)^*$ |
| begin = end symbol | $0+1+0\Sigma^*0+1\Sigma^*1$ |
| every $a$ has a later $b$ ($\{a,b\}$) | $\varepsilon + \Sigma^*b$ |
| even # of $a$s ($\{a,b\}$) | $(b+ab^*a)^*$ |

## Identities
- $r+\varnothing = r$, $r\varnothing = \varnothing$, $r\varepsilon = r$, $\varnothing^* = \varepsilon$.
- $(r^*)^* = r^*$, $r^*r^* = r^*$, $(\varepsilon+r)^* = r^*$, $(rs)^*r = r(sr)^*$.
- $(r+s)^* = (r^*s^*)^* = (r^*s)^*r^* = r^*(sr^*)^*$.
- FALSE: $(r+s)^* = r^*+s^*$; $(rs)^* = r^*s^*$; $rs = sr$; $(r^*s)^* = (r+s)^*$.

## Justifying a regex (both directions)
1. **Sound:** every generated string has the property (what does each block guarantee?).
2. **Complete:** give a parsing procedure for any string with the property ("cut after each 1", "cut before every 3rd $a$", "split into pairs").

## Structural induction on regexes
- Cases: $\varnothing$, $\varepsilon$, $a$, $r+s$, $rs$, $r^*$; IH on sub-expressions.
- $\textit{rev}$: swap the order of every concatenation; $L(\textit{rev}(r)) = L(r)^R$.
- $\textit{null}$: $\varepsilon$ true, $\varnothing$/$a$ false, $+$ = or, concat = and, star = true.
- No $\varnothing$ in $r$ $\Rightarrow$ $L(r) \ne \varnothing$.

## DFA $\to$ regex (state elimination)
- Remove $q$ (self-loop $\ell$): each $p \xrightarrow{\alpha} q \xrightarrow{\beta} t$ adds $\alpha\ell^*\beta$ to $p \to t$.
- Start = only accept state: answer is (union of loops at start)$^*$.

## Checklist before submitting a regex
1. Is $\varepsilon$ in the language? Does the regex agree?
2. Shortest strings in / out? Length-1 strings?
3. Overlaps? Strings that almost match? Pattern at the very start/end?
4. Argue both directions.

## Facts
- Every finite language is regular. Infinite unions of regular languages need not be regular.
- Regular languages are closed under reversal (structural induction).
`,

  quiz: [
    {
      type: 'mc',
      q: String.raw`Using standard precedence, how is $01^* + 1$ parsed?`,
      choices: [String.raw`$(01)^* + 1$`, String.raw`$(0(1^*)) + 1$`, String.raw`$0(1^* + 1)$`, String.raw`$0((1^*) + 1)$, same as the previous choice`],
      answer: 1,
      explain: String.raw`Star binds tightest (to the single $1$), then concatenation ($0$ with $1^*$), then union. So the language is $\{0, 01, 011, \ldots\} \cup \{1\}$. The other parses describe different languages: e.g. $(01)^* + 1$ contains $0101$, which $01^* + 1$ does not.`,
    },
    {
      type: 'tf',
      q: String.raw`In CS 374 regex notation, $0+$ means "one or more 0s".`,
      answer: false,
      explain: String.raw`$+$ is the **union** operator; $0+$ on its own is not even a well-formed expression. "One or more 0s" is written $00^*$ (some texts allow $0^+$ as a superscript).`,
    },
    {
      type: 'multi',
      q: String.raw`Which of the following are equivalent to $(0+1)^*$ over $\{0,1\}$? (select all that apply)`,
      choices: [String.raw`$0^* + 1^*$`, String.raw`$(0^*1^*)^*$`, String.raw`$(0^*1)^*0^*$`, String.raw`$0^*1^*$`, String.raw`$(\varepsilon + 0 + 1)^*$`],
      answer: [1, 2, 4],
      explain: String.raw`$(r+s)^* = (r^*s^*)^* = (r^*s)^*r^*$, and $(\varepsilon + r)^* = r^*$. $0^*+1^*$ misses $01$; $0^*1^*$ misses $10$. For $(0^*1)^*0^*$: any string splits after each 1 into blocks $0^*1$, with a trailing block of 0s.`,
    },
    {
      type: 'mc',
      q: String.raw`Which regex describes the binary strings with **no two consecutive 1s**?`,
      choices: [String.raw`$(0 + 10)^*$`, String.raw`$(0+10)^*(\varepsilon + 1)$`, String.raw`$(01 + 1)^*$`, String.raw`$0^*(10)^*$`],
      answer: 1,
      explain: String.raw`$(0+10)^*$ cannot generate strings ending in 1, such as $1$ or $01$. $(01+1)^*$ generates $11$. $0^*(10)^*$ misses $1$ and $100$ (after the first 1, 0s can only come one at a time). Only $(0+10)^*(\varepsilon+1)$ is correct: pair each non-final 1 with the 0 after it.`,
    },
    {
      type: 'tf',
      q: String.raw`$(rs)^* \equiv r^*s^*$ for all regexes $r, s$.`,
      answer: false,
      explain: String.raw`Take $r = 0$, $s = 1$. Then $0101 \in L((01)^*)$ but not $L(0^*1^*)$, and $00 \in L(0^*1^*)$ but not $L((01)^*)$. To disprove an identity, one string in the symmetric difference suffices.`,
    },
    {
      type: 'tf',
      q: String.raw`Every finite language is regular.`,
      answer: true,
      explain: String.raw`Each string $w$ is described by the regex spelling it out (or $\varepsilon$), and a finite language is a finite union of these; $\varnothing$ is regular by definition.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L_1, L_2, L_3, \ldots$ are all regular, then $\bigcup_{i \ge 1} L_i$ is regular.`,
      answer: false,
      explain: String.raw`Closure under union only applies to finitely many languages. Let $L_i = \{0^i1^i\}$; each is finite, hence regular, but the union $\{0^n1^n : n \ge 1\}$ is not regular.`,
    },
    {
      type: 'mc',
      q: String.raw`What is $L(\varnothing^* \bullet 0)$?`,
      choices: [String.raw`$\varnothing$`, String.raw`$\{0\}$`, String.raw`$\{\varepsilon, 0\}$`, String.raw`$\{0\}^*$`],
      answer: 1,
      explain: String.raw`$\varnothing^* = \{\varepsilon\}$, and $\{\varepsilon\}\{0\} = \{0\}$. If you thought the answer was $\varnothing$, you were treating $\varnothing^*$ as $\varnothing$; but $\varnothing \bullet 0$ (without the star) is indeed $\varnothing$.`,
    },
    {
      type: 'mc',
      q: String.raw`Which English description matches $(1 + 01)^*$?`,
      choices: ['Strings with no two consecutive 0s', 'Strings in which every 0 is immediately followed by a 1', 'Strings ending in 1', 'Strings with more 1s than 0s'],
      answer: 1,
      explain: String.raw`The blocks are $1$ and $01$; inside each block, the 0 is followed by a 1. Conversely a string where every 0 is followed by 1 splits into such blocks. "No two consecutive 0s" would also allow a trailing 0 (e.g. $10$), which $(1+01)^*$ rejects. It is not "ends in 1" because $\varepsilon$ is included.`,
    },
    {
      type: 'multi',
      q: String.raw`Which strings are in $L\big(0^*(10^*10^*)^*\big)$? (select all that apply)`,
      choices: [String.raw`$\varepsilon$`, String.raw`$0110$`, String.raw`$1$`, String.raw`$10101$`, String.raw`$000$`],
      answer: [0, 1, 4],
      explain: String.raw`This regex is "even number of 1s". $\varepsilon$, $0110$ (two 1s) and $000$ (zero 1s) qualify; $1$ and $10101$ have an odd number of 1s.`,
    },
    {
      type: 'mc',
      q: String.raw`A student writes $\Sigma^*010\Sigma^*010\Sigma^*$ for "contains at least two occurrences of $010$". Which string shows the regex is wrong?`,
      choices: [String.raw`$010010$`, String.raw`$01010$`, String.raw`$0100010$`, String.raw`$010$`],
      answer: 1,
      explain: String.raw`$01010$ contains $010$ at positions 1 and 3 (the occurrences overlap in the middle 0), so it is in the language, but the regex requires two disjoint copies (length $\ge 6$). $010010$ and $0100010$ are correctly accepted; $010$ is correctly rejected.`,
    },
    {
      type: 'tf',
      q: String.raw`$(rs)^*r \equiv r(sr)^*$ for all regexes $r, s$.`,
      answer: true,
      explain: String.raw`Both sides describe strings of the form $r\,s\,r\,s \cdots s\,r$ with $k \ge 0$ copies of $s$ and $k+1$ copies of $r$ (interleaved). This "shifting" identity is handy when simplifying regexes from state elimination.`,
    },
    {
      type: 'mc',
      q: String.raw`Which regex describes strings over $\{0,1\}$ that begin and end with the **same** symbol?`,
      choices: [String.raw`$0\Sigma^*0 + 1\Sigma^*1$`, String.raw`$0 + 1 + 0\Sigma^*0 + 1\Sigma^*1$`, String.raw`$\varepsilon + 0\Sigma^*0 + 1\Sigma^*1$`, String.raw`$(0\Sigma^*0)^* + (1\Sigma^*1)^*$`],
      answer: 1,
      explain: String.raw`A one-symbol string begins and ends with that same symbol, so $0$ and $1$ must be included — the first choice misses them. Whether $\varepsilon$ qualifies is debatable (it has no first symbol); the standard reading excludes it, and the third choice also misses $0$ and $1$. The last choice includes $\varepsilon$ and strings like $0000$ but also misses $0$.`,
    },
    {
      type: 'mc',
      q: String.raw`Which regex describes the binary strings with an even number of 0s **and** an even number of 1s?`,
      choices: [
        String.raw`$(00 + 11)^*$`,
        String.raw`$(00)^*(11)^*$`,
        String.raw`$\big(00 + 11 + (01+10)(00+11)^*(01+10)\big)^*$`,
        String.raw`$\big(0^*(10^*10^*)^*\big)\big(1^*(01^*01^*)^*\big)$`,
      ],
      answer: 2,
      explain: String.raw`Such strings have even length; read them in pairs. Same pairs ($00, 11$) keep both parities, mixed pairs ($01, 10$) flip both, so we need an even number of mixed pairs. $(00+11)^*$ misses $0101$. $(00)^*(11)^*$ misses $1100$. The last choice generates $0$ (take $0$ from the first factor and $\varepsilon$ from the second), which has an odd number of 0s: concatenating "even 1s" with "even 0s" does not control the 0s of the first part.`,
    },
    {
      type: 'mc',
      q: String.raw`Which regex describes the binary strings (MSB first, $\varepsilon$ counts as 0) whose value is divisible by 3?`,
      choices: [String.raw`$(0 + 11)^*$`, String.raw`$(0 + 1(01^*0)^*1)^*$`, String.raw`$(0 + 11 + 1001)^*$`, String.raw`$0^*(11)^*0^*$`],
      answer: 1,
      explain: String.raw`Eliminating states from the mod-3 DFA gives $(0 + 1(01^*0)^*1)^*$. The other choices are sound (everything they generate is a multiple of 3) but incomplete: $10101 = 21$ is a multiple of 3, yet the first and third choices cannot produce it, and the last choice misses $1001 = 9$.`,
    },
    {
      type: 'tf',
      q: String.raw`$\Sigma^*01\Sigma^*10\Sigma^* + \Sigma^*10\Sigma^*01\Sigma^*$ describes exactly the binary strings that contain both $01$ and $10$.`,
      answer: false,
      explain: String.raw`The occurrences can overlap: $010$ contains $01$ and $10$ sharing the middle 1, but every string generated by the regex has length at least 4. A correct regex is $\Sigma^*(011^*0 + 100^*1)\Sigma^*$.`,
    },
    {
      type: 'mc',
      q: String.raw`Over $\{a,b\}$, which regex describes "every $a$ has some $b$ somewhere after it"?`,
      choices: [String.raw`$(ab)^*$`, String.raw`$(b + ab)^*$`, String.raw`$\varepsilon + \Sigma^* b$`, String.raw`$b^*(ab^*b)^*$`],
      answer: 2,
      explain: String.raw`Only the last $a$ matters: if there is an $a$, the string must end in $b$; if there is no $a$, the string is $\varepsilon$ or ends in $b$. So the language is $\varepsilon + \Sigma^*b$. $(b+ab)^*$ requires the $b$ **immediately** after each $a$, so it misses $aab$.`,
    },
    {
      type: 'multi',
      q: String.raw`Which regexes are equivalent to $(0+1)^*$? (select all that apply)`,
      choices: [String.raw`$(1^*0^*)^*$`, String.raw`$(01^*)^*$`, String.raw`$0^*(10^*)^*$`, String.raw`$(00 + 11)^*$`, String.raw`$\varepsilon + \Sigma^*0 + \Sigma^*1$`],
      answer: [0, 2, 4],
      explain: String.raw`$(1^*0^*)^*$ is the identity $(r+s)^* = (r^*s^*)^*$. $0^*(10^*)^*$ is $r^*(sr^*)^*$. Every string is empty or ends in 0 or 1. $(01^*)^*$ cannot generate strings starting with 1, and $(00+11)^*$ misses $01$.`,
    },
    {
      type: 'tf',
      q: String.raw`If a regex $r$ does not contain the symbol $\varnothing$, then $L(r) \ne \varnothing$.`,
      answer: true,
      explain: String.raw`Structural induction: $\varepsilon$ and $a$ denote non-empty languages; a union of non-empty languages is non-empty; a concatenation $AB$ with $x \in A$, $y \in B$ contains $xy$; and every star contains $\varepsilon$. So $\varnothing$ can only come from the symbol $\varnothing$ itself.`,
    },
    {
      type: 'mc',
      q: String.raw`For which regex is $\varepsilon \in L(r)$?`,
      choices: [String.raw`$(0 + \varepsilon)1^*0$`, String.raw`$0^*1^* + 1$`, String.raw`$(01)^*1$`, String.raw`$\varnothing^*0$`],
      answer: 1,
      explain: String.raw`$\varepsilon \in L(rs)$ iff $\varepsilon$ is in both $L(r)$ and $L(s)$. $0^*1^*$ is nullable (both stars are), so the union is. The first and third choices end with a non-nullable factor ($0$, resp. $1$), and $\varnothing^*0 = \{0\}$.`,
    },
    {
      type: 'tf',
      q: String.raw`For every regex $r$, there is a regex for $L(r)^R$ with exactly the same number of symbols as $r$.`,
      answer: true,
      explain: String.raw`Reverse the order of every concatenation and leave unions, stars and base cases alone. Structural induction using $(AB)^R = B^R A^R$, $(A \cup B)^R = A^R \cup B^R$ and $(A^*)^R = (A^R)^*$ shows the result denotes $L(r)^R$. Only the order changes, not the size.`,
    },
    {
      type: 'mc',
      q: String.raw`What is $L\big((1+01)^*\,00\,(1+10)^*\big)$?`,
      choices: [String.raw`Strings containing $00$`, String.raw`Strings containing $00$ exactly once`, String.raw`Strings containing $00$ but not $000$`, 'Strings with exactly two 0s'],
      answer: 1,
      explain: String.raw`The left part has no $00$ and does not end in 0; the right part has no $00$ and does not start with 0. So the middle $00$ is the only occurrence. "Contains $00$ but not $000$" is a different language: $00100$ has two occurrences of $00$ (and no $000$), but it is not generated.`,
    },
    {
      type: 'mc',
      q: String.raw`A student writes $(1 + 01 + 001)^*$ for "binary strings with no $000$". What is the shortest string on which it is wrong?`,
      choices: [String.raw`$\varepsilon$`, String.raw`$0$`, String.raw`$000$`, String.raw`$1001$`],
      answer: 1,
      explain: String.raw`Every non-empty generated string ends in 1, so $0$ (no $000$, should be accepted) is missed. $\varepsilon$ is generated correctly, $000$ is correctly rejected, and $1001 = 1 \cdot 001$ is generated. The fix is the tail $(\varepsilon + 0 + 00)$.`,
    },
    {
      type: 'tf',
      q: String.raw`$(r^*s)^* \equiv (r+s)^*$ for all regexes $r, s$.`,
      answer: false,
      explain: String.raw`With $r = 0$, $s = 1$: $0 \in (0+1)^*$, but every non-empty string of $(0^*1)^*$ ends in 1. The correct identity has a trailing star: $(r^*s)^*r^* \equiv (r+s)^*$.`,
    },
    {
      type: 'mc',
      q: String.raw`In state elimination, you remove a state $q$ with self-loop label $\ell$, an incoming edge $p \xrightarrow{\alpha} q$ and an outgoing edge $q \xrightarrow{\beta} t$. The edge $p \to t$ already has label $\gamma$. What is its new label?`,
      choices: [String.raw`$\alpha\beta + \gamma$`, String.raw`$\gamma + \alpha\ell^*\beta$`, String.raw`$\alpha\ell\beta$`, String.raw`$(\gamma + \alpha\beta)\ell^*$`],
      answer: 1,
      explain: String.raw`Walks from $p$ to $t$ either use the existing edge ($\gamma$) or pass through $q$: enter ($\alpha$), go around the loop any number of times ($\ell^*$), and leave ($\beta$). Forgetting the $\ell^*$ or dropping the old label $\gamma$ are the usual mistakes.`,
    },
    {
      type: 'multi',
      q: String.raw`Which strings are in $L\big((0 + 1(01^*0)^*1)^*\big)$? (select all that apply)`,
      choices: [String.raw`$\varepsilon$`, String.raw`$110$`, String.raw`$111$`, String.raw`$1001$`, String.raw`$10101$`],
      answer: [0, 1, 3, 4],
      explain: String.raw`This is "binary value divisible by 3". Values: $\varepsilon = 0$, $110 = 6$, $111 = 7$, $1001 = 9$, $10101 = 21$. Only $111$ is not a multiple of 3. Parses: $110 = (1\,1)(0)$; $1001 = 1\,(00)\,1$; $10101 = 1\,(010)\,1$, using $010 \in L(01^*0)$.`,
    },
  ],

  flashcards: [
    { front: 'Inductive definition of regular languages', back: String.raw`Base: $\varnothing$, $\{\varepsilon\}$, $\{a\}$. Closed under $\cup$, $\bullet$, $^*$. Nothing else.` },
    { front: 'Regex precedence', back: String.raw`Star, then concatenation, then union ($+$). $01^*+1 = (0(1^*))+1$.` },
    { front: String.raw`What does $+$ mean in a CS 374 regex?`, back: 'Union. "One or more" is written rr*.' },
    { front: 'Regex: contains substring x', back: String.raw`$\Sigma^* x \Sigma^*$` },
    { front: 'Regex: no two consecutive 1s', back: String.raw`$(0+10)^*(\varepsilon+1)$` },
    { front: 'Regex: even number of 1s', back: String.raw`$0^*(10^*10^*)^*$ (or $(0^*10^*1)^*0^*$)` },
    { front: 'Regex: exactly one 1 / at most one 1', back: String.raw`$0^*10^*$ / $0^*(\varepsilon+1)0^*$` },
    { front: String.raw`Is $(r+s)^* \equiv r^*+s^*$?`, back: String.raw`No. $r=0,s=1$: $01$ is in the left side only. But $(r+s)^* \equiv (r^*s^*)^*$.` },
    { front: String.raw`$\varnothing^*$, $r\varnothing$, $r + \varnothing$`, back: String.raw`$\varepsilon$; $\varnothing$; $r$.` },
    { front: 'Shifting identity', back: String.raw`$(rs)^*r \equiv r(sr)^*$` },
    { front: 'How to disprove a regex identity', back: 'Exhibit a single string in one side but not the other.' },
    { front: 'Are infinite unions of regular languages regular?', back: String.raw`Not necessarily: $\bigcup_n \{0^n1^n\}$ is not regular. Only finite unions are guaranteed.` },
    { front: 'Regex: even number of 0s AND even number of 1s', back: String.raw`$\big(00+11+(01+10)(00+11)^*(01+10)\big)^*$ — read in pairs; need an even number of mixed pairs.` },
    { front: 'Regex: binary multiples of 3 (MSB first)', back: String.raw`$\big(0+1(01^*0)^*1\big)^*$ — from eliminating $r_2$, then $r_1$, in the mod-3 DFA.` },
    { front: String.raw`Regex: exactly one occurrence of $00$`, back: String.raw`$(1+01)^*\,00\,(1+10)^*$ — left part never ends in 0, right part never starts with 0.` },
    { front: String.raw`Regex: contains both $01$ and $10$`, back: String.raw`$\Sigma^*(011^*0 + 100^*1)\Sigma^*$ (at least 3 runs). The occurrences may overlap, as in $010$.` },
    { front: String.raw`Regex: no $000$`, back: String.raw`$(1+01+001)^*(\varepsilon+0+00)$ — cut after every 1; don't forget the tail.` },
    { front: String.raw`Regex reversal $\textit{rev}(r)$`, back: String.raw`Base cases unchanged; $\textit{rev}(r+s) = \textit{rev}(r)+\textit{rev}(s)$; $\textit{rev}(rs) = \textit{rev}(s)\textit{rev}(r)$; $\textit{rev}(r^*) = \textit{rev}(r)^*$. Proves regular languages are closed under reversal.` },
    { front: String.raw`$\textit{null}(r)$: is $\varepsilon \in L(r)$?`, back: String.raw`$\varnothing$, $a$: false. $\varepsilon$, $r^*$: true. $r+s$: or. $rs$: and.` },
    { front: 'State elimination rule', back: String.raw`Removing $q$ with self-loop $\ell$: for each $p \xrightarrow{\alpha} q \xrightarrow{\beta} t$, add $\alpha\ell^*\beta$ to the label of $p \to t$ (union with the old label).` },
    { front: 'Regex: every a has some b later (over {a,b})', back: String.raw`$\varepsilon + \Sigma^*b$ — only the last $a$ matters.` },
    { front: 'Two parts of a regex justification', back: 'Soundness: every generated string has the property. Completeness: a parsing procedure that splits any string with the property into the regex\'s pieces.' },
  ],

  problems: [
    {
      id: 'regex-contains00', type: 'regex', title: 'Contains 00', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that contain $00$ as a substring.`,
      accepts: s => s.includes('00'),
      sample: String.raw`(0+1)*00(0+1)*`,
      hints: [String.raw`Anything, then $00$, then anything.`],
      solution: String.raw`<code>(0+1)*00(0+1)*</code>. Any string containing $00$ can be written $u\,00\,v$, and every such string contains $00$.`,
    },
    {
      id: 'regex-atmost-one1', type: 'regex', title: 'At most one 1', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings with **at most one** $1$.`,
      accepts: s => (s.split('1').length - 1) <= 1,
      sample: String.raw`0*(ε+1)0*`,
      hints: [String.raw`Zero 1s: $0^*$. Exactly one: $0^*10^*$. Combine with an optional 1.`],
      solution: String.raw`<code>0*(ε+1)0*</code>, equivalently <code>0* + 0*10*</code>. The optional middle symbol is either nothing (giving all-0 strings, including $\varepsilon$) or a single 1.`,
    },
    {
      id: 'regex-even1s', type: 'regex', title: 'Even number of 1s', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings containing an **even** number of $1$s (zero counts as even).`,
      accepts: s => (s.split('1').length - 1) % 2 === 0,
      sample: String.raw`0*(10*10*)*`,
      hints: [String.raw`Group the 1s in pairs.`, String.raw`A pair, together with the 0s that follow each of its 1s, is $10^*10^*$.`],
      solution: String.raw`<code>0*(10*10*)*</code>. A string with $2k$ ones is: some leading 0s, then $k$ groups, each consisting of a 1, some 0s, a 1, some 0s. Conversely every string generated has 1s only inside groups, two per group. The empty string and all-0 strings are included via $k = 0$.`,
    },
    {
      id: 'regex-same-ends', type: 'regex', title: 'Begins and ends with the same symbol', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the **non-empty** binary strings whose first and last symbols are equal.`,
      accepts: s => s.length >= 1 && s[0] === s[s.length - 1],
      sample: String.raw`0 + 1 + 0Σ*0 + 1Σ*1`,
      hints: [String.raw`Split on the first symbol.`, String.raw`Don't forget strings of length 1.`],
      solution: String.raw`<code>0 + 1 + 0Σ*0 + 1Σ*1</code>. Case on the first symbol: if it is 0, either the string is just $0$, or it is $0 \ldots 0$ of length $\ge 2$, i.e. $0\Sigma^*0$. Symmetrically for 1. The most common bug is omitting the single-symbol strings.`,
    },
    {
      id: 'regex-no11', type: 'regex', title: 'No two consecutive 1s', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that do **not** contain $11$ as a substring.`,
      accepts: s => !s.includes('11'),
      sample: String.raw`(0+10)*(ε+1)`,
      hints: [String.raw`Every 1, except possibly the last symbol, must be followed by a 0.`, String.raw`Use blocks $0$ and $10$, plus an optional final 1.`],
      solution: String.raw`<code>(0+10)*(ε+1)</code>.

(Generated $\Rightarrow$ no $11$.) Within $(0+10)^*$ every 1 is immediately followed by 0. The optional final 1 follows either nothing or a block ending in 0.

(No $11$ $\Rightarrow$ generated.) Scan left to right: a 0 is a block $0$; a 1 that is not last is followed by a 0 (since there is no $11$), and the two form a block $10$; a 1 that is last is the optional final 1.`,
    },
    {
      id: 'regex-even-blocks', type: 'regex', title: 'Every run of 1s has even length', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings in which every maximal block (run) of consecutive 1s has **even** length. For example $0110$, $1111$, $0$ and $\varepsilon$ are in the language; $010$ and $0111$ are not.`,
      accepts: s => s.split('0').every(r => r.length % 2 === 0),
      sample: String.raw`(0+11)*`,
      hints: [String.raw`A run of even length is a sequence of $11$ pairs.`],
      solution: String.raw`<code>(0+11)*</code>. Concatenating 0s and pairs $11$ creates runs of 1s made of whole pairs, hence even. Conversely, split each even run into pairs; together with the 0s that gives a block decomposition.`,
    },
    {
      id: 'regex-two-a', type: 'regex', title: 'Exactly two a symbols', difficulty: 1,
      alphabet: 'abc',
      prompt: String.raw`Over $\{a,b,c\}$, write a regular expression for the strings with **exactly two** $a$s.`,
      accepts: s => (s.split('a').length - 1) === 2,
      sample: String.raw`(b+c)*a(b+c)*a(b+c)*`,
      hints: [String.raw`Non-$a$ stretch, $a$, non-$a$ stretch, $a$, non-$a$ stretch.`],
      solution: String.raw`<code>(b+c)*a(b+c)*a(b+c)*</code>. The two $a$s split the string into three (possibly empty) stretches containing only $b$ and $c$.`,
    },
    {
      id: 'regex-both-00-11', type: 'regex', title: 'Contains both 00 and 11', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that contain **both** $00$ and $11$ as substrings.`,
      accepts: s => s.includes('00') && s.includes('11'),
      sample: String.raw`Σ*00Σ*11Σ* + Σ*11Σ*00Σ*`,
      hints: [String.raw`Which occurrence comes first?`, String.raw`Can an occurrence of $00$ overlap one of $11$?`],
      solution: String.raw`<code>Σ*00Σ*11Σ* + Σ*11Σ*00Σ*</code>. Look at the first occurrence of each pattern; one of them starts first. An occurrence of $00$ and one of $11$ cannot share a position (a position holds a 0 or a 1, not both), so whichever starts first ends before the other begins, and the string fits one of the two cases. Overlap matters for patterns that share symbols — e.g. "contains $01$ and $10$" must allow $010$.`,
    },
    {
      id: 'regex-no010', type: 'regex', title: 'Does not contain 010', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that do **not** contain $010$ as a substring.`,
      accepts: s => !s.includes('010'),
      sample: String.raw`1*(ε + 00*(111*00*)*(ε + 11*))`,
      hints: [
        String.raw`Think of the string as alternating runs of 0s and 1s. Which runs can cause a $010$?`,
        String.raw`A run of 1s that has 0s on both sides must have length at least 2.`,
        String.raw`Write: leading 1s; then optionally a 0-run, followed by any number of (1-run of length $\ge 2$, 0-run) pairs, and finally an optional 1-run of any length.`,
      ],
      solution: String.raw`An occurrence of $010$ is exactly a run of 1s of length **exactly 1** with a 0 on each side. So a string avoids $010$ iff every 1-run that is surrounded by 0s on both sides has length $\ge 2$. (The first run and the last run are not surrounded on both sides, so they can be anything.)

Structure: $1^*$ (an initial 1-run, possibly empty). Then either nothing, or a 0-run $00^*$, followed by zero or more pairs "interior 1-run of length $\ge 2$, then a 0-run" $= (111^*00^*)^*$, and finally an optional last 1-run of any length $(\varepsilon + 11^*)$:

<code>1*(ε + 00*(111*00*)*(ε + 11*))</code>

Check: $0110 = 0 \cdot (110) \cdot \varepsilon$ is generated; $010$ is not, because after the 0-run the next 1-run must either be followed by a 0 (needs length $\ge 2$) or end the string. An alternative derivation is to build the 4-state DFA for "contains 010", complement it, and eliminate states.`,
    },
    {
      id: 'regex-identities', type: 'written', title: 'True or false identities', difficulty: 2,
      prompt: String.raw`For each claimed identity, either prove it (show both inclusions, informally but precisely) or give a counterexample string with $r = 0$, $s = 1$ (or other concrete regexes).

1. $(r + s)^* \equiv r^* + s^*$
2. $(r^*s)^*r^* \equiv (r+s)^*$
3. $r^* s^* \equiv s^* r^*$
4. $(r + \varepsilon)^* \equiv r^*$`,
      rubric: [
        '1 is false, with a counterexample like 01',
        '2 is true: every string of (r+s)* splits after each s-piece into blocks r*s plus a final r* (and the converse inclusion is immediate)',
        '3 is false, with a counterexample like 10 (in s*r*, not in r*s*) or 01',
        '4 is true: ε pieces contribute nothing, so concatenations of pieces from L(r)∪{ε} are exactly concatenations of pieces from L(r)',
      ],
      hints: [String.raw`For each, try short strings mixing both $r$ and $s$.`, String.raw`For (2), look at where the $s$-pieces sit in a string of $(r+s)^*$.`],
      solution: String.raw`1. **False.** $01 \in L((0+1)^*)$ but $01 \notin L(0^* + 1^*)$, which only has all-0 or all-1 strings.

2. **True.** ($\subseteq$) Every string on the left is a concatenation of pieces from $L(r)$ and $L(s)$, hence in $(r+s)^*$. ($\supseteq$) A string in $(r+s)^*$ is $p_1 p_2 \cdots p_k$ with each $p_i \in L(r) \cup L(s)$. Cut the sequence just after each piece from $L(s)$: each segment is (zero or more $r$-pieces)(one $s$-piece) $\in L(r^*s)$, and the leftover tail is zero or more $r$-pieces $\in L(r^*)$.

3. **False.** $10 \in L(1^*0^*)$ but $10 \notin L(0^*1^*)$.

4. **True.** ($\supseteq$) $L(r) \subseteq L(r+\varepsilon)$ and star is monotone. ($\subseteq$) A concatenation of pieces from $L(r) \cup \{\varepsilon\}$ equals the concatenation of just its non-$\varepsilon$ pieces, which come from $L(r)$ (and if all pieces are $\varepsilon$, the result $\varepsilon$ is in $L(r^*)$).`,
    },
    {
      id: 'regex-finite-proof', type: 'written', title: 'Finite languages are regular', difficulty: 1,
      prompt: String.raw`Prove that every finite language $L \subseteq \Sigma^*$ is regular, using only the inductive definition of regular languages. Structure your proof as two inductions: one showing $\{w\}$ is regular for every string $w$, and one on $|L|$.`,
      rubric: [
        'Singleton {w} regular by induction on w: {ε} is a base case; {ax} = {a}•{x}',
        'Induction on |L|: base L = ∅ regular by definition',
        'Inductive step: L = L\' ∪ {w} with |L\'| = |L| − 1, union of two regular languages',
        'Correctly notes only finitely many unions are used',
      ],
      hints: [String.raw`$\{ax\} = \{a\} \bullet \{x\}$.`],
      solution: String.raw`**Lemma: $\{w\}$ is regular for every string $w$.** Strong induction on $w$. If $w = \varepsilon$, $\{\varepsilon\}$ is a base regular language. If $w = ax$, then $\{w\} = \{a\} \bullet \{x\}$; $\{a\}$ is a base language and $\{x\}$ is regular by the IH ($|x| < |w|$), and regular languages are closed under concatenation by definition.

**Theorem.** Induct on $n = |L|$. If $n = 0$, $L = \varnothing$, regular by definition. If $n \ge 1$, pick any $w \in L$ and let $L' = L \setminus \{w\}$, so $|L'| = n - 1$ and $L'$ is regular by the IH. Then $L = L' \cup \{w\}$ is a union of two regular languages, hence regular. $\blacksquare$

The argument uses $|L|$ unions, finitely many; that is why it does not extend to infinite languages.`,
    },
    {
      id: 'regex-debug', type: 'written', title: 'Debug a regex', difficulty: 2,
      prompt: String.raw`A student claims that $(1 + 01)^*$ describes the binary strings with **no two consecutive 0s**. (a) Give the shortest string on which the student is wrong, and say which way the error goes. (b) Write a correct regex and justify it in both directions.`,
      rubric: [
        'Shortest counterexample is 0 (has no 00, but rejected by the regex); 10 is another',
        'Identifies the error direction: the regex is too small (misses strings ending in 0)',
        'Correct regex such as (1+01)*(ε+0)',
        'Both directions argued: generated strings have no 00; every string with no 00 is generated',
      ],
      hints: [String.raw`What is the language of $(1+01)^*$ really?`, String.raw`What can happen at the very end of a string with no $00$?`],
      solution: String.raw`(a) $(1+01)^*$ is "every 0 is immediately followed by a 1", which is strictly smaller than "no $00$". The shortest string with no $00$ that it misses is $0$ (also $10$). So the regex **rejects** strings that should be accepted.

(b) <code>(1+01)*(ε+0)</code>.
- Generated $\Rightarrow$ no $00$: inside $(1+01)^*$ every 0 is followed by 1; the optional final 0 is preceded by nothing or by a block ending in 1.
- No $00$ $\Rightarrow$ generated: scan left to right. A 1 is a block $1$. A 0 that is not the last symbol is followed by 1 (no $00$), forming block $01$. A 0 that is the last symbol is the optional final 0.`,
    },
    {
      id: 'regex-div3', type: 'regex', title: 'Binary multiples of 3', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings $w$ (most significant bit first, leading 0s allowed) whose value is divisible by 3. Treat $\varepsilon$ as the number 0, so it is in the language.`,
      accepts: s => { let v = 0; for (const c of s) v = (2 * v + (c === '1' ? 1 : 0)) % 3; return v === 0; },
      sample: String.raw`(0+1(01*0)*1)*`,
      hints: [
        String.raw`Start from the 3-state DFA: state $r$ = value mod 3, $\delta(r, b) = (2r + b) \bmod 3$.`,
        String.raw`Eliminate $r_2$ first: it is entered from $r_1$ on 0, loops on 1, and returns to $r_1$ on 0.`,
        String.raw`After eliminating $r_2$ and then $r_1$, only the loop at $r_0$ remains.`,
      ],
      solution: String.raw`DFA: $r_0 \xrightarrow{0} r_0$, $r_0 \xrightarrow{1} r_1$, $r_1 \xrightarrow{0} r_2$, $r_1 \xrightarrow{1} r_0$, $r_2 \xrightarrow{0} r_1$, $r_2 \xrightarrow{1} r_2$; start and accept $r_0$.

**Eliminate $r_2$:** the path $r_1 \xrightarrow{0} r_2 \xrightarrow{1^*} r_2 \xrightarrow{0} r_1$ becomes a self-loop $01^*0$ on $r_1$.

**Eliminate $r_1$:** the path $r_0 \xrightarrow{1} r_1 \xrightarrow{(01^*0)^*} r_1 \xrightarrow{1} r_0$ becomes a loop $1(01^*0)^*1$ on $r_0$, which already has the loop $0$.

Only $r_0$ (start and accept) remains, so the language is all repetitions of its loops:

<code>(0+1(01*0)*1)*</code>.

Sanity checks: $11 = 3$, $110 = 6$, $1001 = 9$ ($1\,(00)\,1$), $10101 = 21$ ($1\,(010)\,1$) are generated; $1$, $10$, $111 = 7$ are not. Because the derivation is an exact transformation of a correct DFA, both directions of correctness are inherited from the DFA's correctness.`,
      tags: ['state elimination', 'mod counting'],
    },
    {
      id: 'regex-even-even', type: 'regex', title: 'Even 0s and even 1s', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings with an even number of 0s **and** an even number of 1s.`,
      accepts: s => (s.split('0').length - 1) % 2 === 0 && (s.split('1').length - 1) % 2 === 0,
      sample: String.raw`(00+11+(01+10)(00+11)*(01+10))*`,
      hints: [
        String.raw`Such a string has even length. Read it two symbols at a time.`,
        String.raw`A pair $00$ or $11$ changes neither parity; a pair $01$ or $10$ flips both.`,
        String.raw`Write the loops at the "both even" state: a same pair, or mixed, (same pairs)$^*$, mixed.`,
      ],
      solution: String.raw`Since $\#0 + \#1 = |w|$, the length is even; split $w$ into pairs. A *same* pair ($00$, $11$) keeps both parities; a *mixed* pair ($01$, $10$) flips both. After any even-length prefix the two parities are equal (their sum is even), so we are either in "both even" ($EE$) or "both odd" ($OO$), and we need to end in $EE$: an even number of mixed pairs.

Loops at $EE$: a same pair, or a mixed pair, then any number of same pairs (staying in $OO$), then a mixed pair (back to $EE$):

<code>(00+11+(01+10)(00+11)*(01+10))*</code>.

**Sound:** each loop contains 0 or 2 mixed pairs, so both parities stay even. **Complete:** split a string of the language into pairs and cut it after every pair that returns to $EE$; each piece is one of the two loop shapes.`,
      tags: ['parity', 'product'],
    },
    {
      id: 'regex-1-then-00', type: 'regex', title: 'Every 1 is followed by 00', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings in which every $1$ is **immediately** followed by at least two $0$s (i.e. every 1 is followed by $00$).`,
      accepts: s => !/1(?!00)/.test(s),
      sample: String.raw`(0+100)*`,
      hints: [String.raw`Glue each 1 to the two 0s after it.`],
      solution: String.raw`<code>(0+100)*</code>.

**Sound:** in a concatenation of blocks $0$ and $100$, each 1 is the first symbol of a $100$ block, so it is followed by $00$.

**Complete:** scan left to right; each 1 is followed by $00$ by assumption, so cut out the block $100$; the two 0s used by one 1 cannot be needed by another 1 (they are 0s, and the next 1 comes after them). Every remaining 0 is a block $0$.

Edge cases: $\varepsilon$ is in; $1$, $10$, $1001$ are out; $1000$ and $100100$ are in.`,
      tags: ['blocks'],
    },
    {
      id: 'regex-01-and-10', type: 'regex', title: 'Contains both 01 and 10', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that contain **both** $01$ and $10$ as substrings. (Careful with overlaps.)`,
      accepts: s => s.includes('01') && s.includes('10'),
      sample: String.raw`Σ*(011*0+100*1)Σ*`,
      hints: [String.raw`Is $010$ in the language?`, String.raw`A string contains both patterns iff it has at least three maximal runs.`],
      solution: String.raw`The two patterns can share a symbol ($010$, $101$), so "$01$ somewhere, then $10$ somewhere" with disjoint copies is wrong.

**Claim:** $w$ contains both $01$ and $10$ iff $w$ contains $01^k0$ or $10^k1$ for some $k \ge 1$.

Split $w$ into maximal runs. Every occurrence of $01$ or $10$ is exactly a boundary between two consecutive runs, and the boundary types alternate ($0$-run to $1$-run is an $01$, the next boundary is a $10$, ...). So $w$ contains both patterns iff it has at least two boundaries, i.e. at least three runs. If $w$ has runs $R_1R_2R_3\cdots$, then the last symbol of $R_1$, all of $R_2$ and the first symbol of $R_3$ form $01^k0$ or $10^k1$ with $k = |R_2| \ge 1$. Conversely, $01^k0$ and $10^k1$ each contain both patterns.

<code>Σ*(011*0+100*1)Σ*</code>.`,
      tags: ['overlap', 'substrings'],
    },
    {
      id: 'regex-a-later-b', type: 'regex', title: 'Every a has a b somewhere after it', difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Over $\{a,b\}$, write a regular expression for the strings in which every $a$ has at least one $b$ **somewhere** after it (not necessarily immediately).`,
      accepts: s => !s.includes('a') || s.lastIndexOf('a') < s.lastIndexOf('b'),
      sample: String.raw`ε+Σ*b`,
      hints: [String.raw`Which $a$ is the hardest to satisfy?`, String.raw`Think about the last symbol of the string.`],
      solution: String.raw`Only the **last** $a$ matters: if it has a $b$ after it, so does every earlier $a$. If the string contains an $a$, the condition therefore says the string ends in $b$. If it contains no $a$, it is $\varepsilon$ or a string of $b$s — which also ends in $b$ unless empty. Conversely every string ending in $b$ satisfies the condition. So the language is $\{\varepsilon\} \cup \{\text{strings ending in } b\}$:

<code>ε+Σ*b</code>.

The tempting answer <code>(b+ab)*</code> is for "every $a$ is *immediately* followed by $b$" and misses $aab$.`,
      tags: ['simplify first'],
    },
    {
      id: 'regex-no000', type: 'regex', title: 'No three consecutive 0s', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that do **not** contain $000$.`,
      accepts: s => !s.includes('000'),
      sample: String.raw`(1+01+001)*(ε+0+00)`,
      hints: [String.raw`Cut the string immediately after every 1.`, String.raw`How many 0s can come after the last 1?`],
      solution: String.raw`<code>(1+01+001)*(ε+0+00)</code>.

**Complete:** cut the string right after each 1. Every piece except possibly the last ends in a 1 preceded by a run of at most two 0s (no $000$): it is $1$, $01$ or $001$. The final piece (after the last 1, or the whole string if there is no 1) is a run of at most two 0s: $\varepsilon$, $0$ or $00$.

**Sound:** every run of 0s in a generated string lies inside one block or the tail (blocks end in 1), so it has length at most 2.

Forgetting the tail gives a regex that misses $0$, $10$, $100$, ....`,
      tags: ['blocks', 'negative condition'],
    },
    {
      id: 'regex-2-after-1', type: 'regex', title: 'Every 2 is preceded by 1 (alphabet 012)', difficulty: 2,
      alphabet: '012',
      prompt: String.raw`Over $\Sigma = \{0,1,2\}$, write a regular expression for the strings in which every $2$ is **immediately preceded** by a $1$.`,
      accepts: s => !/(^|[^1])2/.test(s),
      sample: String.raw`(0+1+12)*`,
      hints: [String.raw`Glue each 2 to the 1 just before it.`],
      solution: String.raw`<code>(0+1+12)*</code>.

**Sound:** each 2 in a concatenation of blocks $0$, $1$, $12$ is the end of a $12$ block, preceded by its 1. **Complete:** attach each 2 to the 1 right before it (two 2s cannot share a 1, since the symbol before a 2 is a 1, not a 2). Every other symbol is a 0-block or a 1-block.

Edge cases: $2$, $02$, $122$ are out; $\varepsilon$, $12$, $1212$, $112$ are in.`,
      tags: ['blocks', 'ternary alphabet'],
    },
    {
      id: 'regex-digitsum-mod3', type: 'regex', title: 'Digit sum divisible by 3 (alphabet 012)', difficulty: 3,
      alphabet: '012',
      prompt: String.raw`Over $\Sigma = \{0,1,2\}$, write a regular expression for the strings whose **sum of digits** is divisible by 3. (So $\varepsilon$, $0$, $12$, $111$, $2121$ are in; $1$, $2$, $11$ are not.)`,
      accepts: s => [...s].reduce((a, c) => a + Number(c), 0) % 3 === 0,
      sample: String.raw`((0+20*1)+(1+20*2)(0+10*2)*(2+10*1))*`,
      hints: [
        String.raw`DFA: states $s_0, s_1, s_2$ (sum mod 3), $\delta(s_i, d) = s_{(i+d) \bmod 3}$. Start and accept $s_0$.`,
        String.raw`Eliminate $s_2$: for every way into $s_2$ and out of it, add a label "in, $0^*$, out".`,
        String.raw`Then eliminate $s_1$, and star the loops at $s_0$.`,
      ],
      solution: String.raw`Start from the DFA tracking the sum mod 3: digit $d$ moves $s_i \to s_{(i+d) \bmod 3}$; $0$ is a self-loop everywhere.

**Eliminate $s_2$** (self-loop $0$). Edges into $s_2$: $s_0 \xrightarrow{2}$, $s_1 \xrightarrow{1}$. Edges out: $\xrightarrow{1} s_0$, $\xrightarrow{2} s_1$. New labels:
- $s_0 \to s_0$: $0 + 20^*1$; $\quad s_0 \to s_1$: $1 + 20^*2$;
- $s_1 \to s_1$: $0 + 10^*2$; $\quad s_1 \to s_0$: $2 + 10^*1$.

**Eliminate $s_1$.** Loops at $s_0$: $(0 + 20^*1) + (1+20^*2)(0+10^*2)^*(2+10^*1)$. Star it:

<code>((0+20*1)+(1+20*2)(0+10*2)*(2+10*1))*</code>.

Each new label can be checked arithmetically: $20^*1$ adds $3 \equiv 0$ (a loop at $s_0$); $20^*2$ adds $4 \equiv 1$ (from $s_0$ to $s_1$); $10^*2$ adds $3$ (a loop at $s_1$); $10^*1$ adds $2$ (from $s_1$ to $s_0$). Many other correct (equivalent) answers exist; the grader checks equivalence, not syntax.`,
      tags: ['state elimination', 'mod counting', 'ternary alphabet'],
    },
    {
      id: 'regex-even-a-end-b', type: 'regex', title: 'Even number of a\'s, ending in b', difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Over $\{a,b\}$, write a regular expression for the strings that have an even number of $a$s **and** end in $b$.`,
      accepts: s => (s.split('a').length - 1) % 2 === 0 && s.endsWith('b'),
      sample: String.raw`(b+ab*a)*b`,
      hints: [String.raw`First write a regex for "even number of $a$s" using blocks.`, String.raw`A string ends in $b$ iff it is $xb$; how many $a$s does $x$ have?`],
      solution: String.raw`"Even number of $a$s" is $(b + ab^*a)^*$: pair up the $a$s (1st with 2nd, 3rd with 4th, ...); each pair together with the $b$s between them is an $ab^*a$ block, and every other $b$ is a block by itself. Conversely each block has 0 or 2 $a$s.

A string ending in $b$ is $xb$, and $x$ has the same number of $a$s as $xb$. So the language is (even $a$s)$\,\cdot\, b$:

<code>(b+ab*a)*b</code>.

Edge cases: $b$, $aab$, $abab$ in; $\varepsilon$, $aa$, $ab$ out.`,
      tags: ['parity', 'combined conditions'],
    },
    {
      id: 'regex-exactly-one-00', type: 'regex', title: 'Exactly one occurrence of 00', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that contain $00$ as a substring **exactly once**. Occurrences may overlap: $000$ contains $00$ twice.`,
      accepts: s => { let k = 0; for (let i = 0; i + 1 < s.length; i++) if (s[i] === '0' && s[i + 1] === '0') k++; return k === 1; },
      sample: String.raw`(1+01)*00(1+10)*`,
      hints: [
        String.raw`Write $w = x\,00\,y$ around the unique occurrence. What can $x$ and $y$ look like?`,
        String.raw`$x$ has no $00$ and cannot end in 0; $y$ has no $00$ and cannot start with 0.`,
      ],
      solution: String.raw`Let the unique occurrence split $w = x\,00\,y$.
- $x$ contains no $00$ and does not end in 0 (else a second occurrence straddles). Such strings are exactly those where every 0 is immediately followed by 1: $(1+01)^*$.
- $y$ contains no $00$ and does not start with 0. Mirror image: every 0 is immediately preceded by 1: $(1+10)^*$.

<code>(1+01)*00(1+10)*</code>.

**Sound:** no $00$ inside $x$ or $y$; the symbol before the middle $00$ is 1 or nothing, and the symbol after it is 1 or nothing, so no other occurrence. **Complete:** the description of $x$ and $y$ above.

Common wrong answer: <code>(1+01)*00(1+01)*</code> — it allows $y = 01$, giving $0001$ with two occurrences.`,
      tags: ['substrings', 'overlap'],
    },
    {
      id: 'regex-not-end-01', type: 'regex', title: 'Does not end in 01', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings that do **not** end in $01$.`,
      accepts: s => !s.endsWith('01'),
      sample: String.raw`ε+0+1+Σ*(00+10+11)`,
      hints: [String.raw`Case on the length: strings of length $\ge 2$ end in one of four 2-symbol strings.`, String.raw`What about strings of length 0 and 1?`],
      solution: String.raw`A string of length $\ge 2$ ends in one of $00, 01, 10, 11$; we keep the three that are not $01$. Strings of length 0 or 1 cannot end in $01$, so they are all in the language:

<code>ε+0+1+Σ*(00+10+11)</code>.

The classic mistake is <code>Σ*(00+10+11)</code>, which misses $\varepsilon$, $0$ and $1$. (A DFA-minded answer, from complementing the "ends in 01" DFA, is equally fine.)`,
      tags: ['complement', 'edge cases'],
    },
    {
      id: 'regex-odd-runs', type: 'regex', title: 'Every run of 1s has odd length', difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings in which every maximal run of consecutive $1$s has **odd** length. For example $\varepsilon$, $0$, $1$, $10111$, $01000111$ are in; $11$, $0110$, $10110$ are not.`,
      accepts: s => s.split('0').every(r => r.length === 0 || r.length % 2 === 1),
      sample: String.raw`0*(1(11)*00*)*(ε+1(11)*)`,
      hints: [
        String.raw`An odd run of 1s is $1(11)^*$.`,
        String.raw`Unlike even runs, you cannot just star a block: two odd runs must be separated by at least one 0.`,
        String.raw`Leading 0s; then (odd run, non-empty 0-run) repeated; then optionally a final odd run.`,
      ],
      solution: String.raw`Think of $w$ as an optional leading 0-run, then alternating 1-runs and 0-runs. Each 1-run must be $1(11)^*$, and consecutive 1-runs must be separated by a **non-empty** 0-run (otherwise they would merge into one run of even length, e.g. $1 \cdot 1 = 11$).

<code>0*(1(11)*00*)*(ε+1(11)*)</code>.

**Sound:** each $1(11)^*$ is followed by $00^*$ (at least one 0) or by the end of the string, so it is a whole maximal run, of odd length. **Complete:** parse $w$ as leading 0s, then each 1-run with the 0-run after it, and finally a last 1-run if $w$ ends in 1.

Compare with "every run of 1s has even length", <code>(0+11)*</code>: there, gluing two even runs gives an even run, so no separator is needed.`,
      tags: ['runs', 'blocks'],
    },
    {
      id: 'regex-reverse-structural', type: 'written', title: 'Regular languages are closed under reversal', difficulty: 3,
      prompt: String.raw`Define a function $\textit{rev}$ on regular expressions by structural recursion so that $L(\textit{rev}(r)) = L(r)^R$, and prove this equation by structural induction on $r$. Conclude that the reversal of every regular language is regular.

You may use $(xy)^R = y^R x^R$ for strings, and $(w^R)^R = w$.`,
      rubric: [
        'Correct definition in all six cases (∅, ε, a, r+s, rs, r*), with the order of concatenation swapped',
        'Base cases verified',
        'Union and concatenation cases: proves (A∪B)^R = A^R∪B^R and (AB)^R = B^R A^R (element chasing with (xy)^R = y^R x^R), then applies the IH to the sub-expressions',
        'Star case: (A*)^R = (A^R)* via (A^k)^R = (A^R)^k (induction on k) and the union over k, then the IH',
        'Conclusion: every regular language is L(r) for some r, so its reversal is L(rev(r)), regular',
      ],
      hints: [String.raw`The only interesting case is concatenation: $\textit{rev}(rs) = \textit{rev}(s)\,\textit{rev}(r)$.`, String.raw`For the star, show $(A^k)^R = (A^R)^k$ for every $k$ first.`],
      solution: String.raw`**Definition.** $\textit{rev}(\varnothing) = \varnothing$, $\textit{rev}(\varepsilon) = \varepsilon$, $\textit{rev}(a) = a$, $\textit{rev}(r + s) = \textit{rev}(r) + \textit{rev}(s)$, $\textit{rev}(rs) = \textit{rev}(s)\,\textit{rev}(r)$, $\textit{rev}(r^*) = \textit{rev}(r)^*$.

**Language lemmas.** For languages $A, B$:
- $(A \cup B)^R = A^R \cup B^R$: $w^R$ ranges over reversals of strings in $A$ or in $B$.
- $(AB)^R = B^R A^R$: $w \in (AB)^R \iff w = (xy)^R = y^Rx^R$ for some $x \in A, y \in B \iff w \in B^RA^R$ (for $\Leftarrow$, a string $uv$ with $u \in B^R, v \in A^R$ is $(v^R u^R)^R$ with $v^R \in A$, $u^R \in B$).
- $(A^k)^R = (A^R)^k$ by induction on $k$: $k = 0$ gives $\{\varepsilon\}$ on both sides; $(A^{k+1})^R = (A\,A^k)^R = (A^k)^R A^R = (A^R)^k A^R = (A^R)^{k+1}$ (the last step uses $B^kB = BB^k$, which follows from associativity). Taking the union over $k$: $(A^*)^R = (A^R)^*$.

**Structural induction.** Assume the claim for all proper sub-expressions of $r$.
- $r = \varnothing, \varepsilon, a$: $\varnothing^R = \varnothing$, $\{\varepsilon\}^R = \{\varepsilon\}$, $\{a\}^R = \{a\}$.
- $r = s + t$: $L(\textit{rev}(r)) = L(\textit{rev}(s)) \cup L(\textit{rev}(t)) = L(s)^R \cup L(t)^R = (L(s) \cup L(t))^R = L(r)^R$.
- $r = st$: $L(\textit{rev}(r)) = L(\textit{rev}(t))\,L(\textit{rev}(s)) = L(t)^R L(s)^R = (L(s)L(t))^R = L(r)^R$.
- $r = s^*$: $L(\textit{rev}(r)) = L(\textit{rev}(s))^* = (L(s)^R)^* = (L(s)^*)^R = L(r)^R$.

Each case uses the IH on the immediate sub-expressions, then a language lemma.

**Conclusion.** If $L$ is regular, $L = L(r)$ for some regex $r$, so $L^R = L(\textit{rev}(r))$ is regular. $\blacksquare$`,
      tags: ['structural induction', 'closure'],
    },
    {
      id: 'regex-nullable', type: 'written', title: 'Deciding whether ε ∈ L(r)', difficulty: 2,
      prompt: String.raw`Define, by structural recursion on regular expressions, a Boolean function $\textit{null}(r)$ such that $\textit{null}(r) = \text{true}$ iff $\varepsilon \in L(r)$. Prove your definition correct by structural induction. Then use it to decide whether $\varepsilon \in L\big((0 + 1^*)(1 + 0)^* + 0(\varepsilon + 1)\big)$.`,
      rubric: [
        'Correct six cases: ∅ false, ε true, a false, r+s or, rs and, r* true',
        'Concatenation case justified: ε = xy implies x = y = ε (by |xy| = |x| + |y|)',
        'Union and star cases justified (ε ∈ A∪B iff in A or B; ε ∈ A* always)',
        'Correct evaluation of the example (true, via 1* and (1+0)*)',
      ],
      hints: [String.raw`When is $\varepsilon \in AB$? Use $|xy| = |x| + |y|$.`],
      solution: String.raw`**Definition.** $\textit{null}(\varnothing) = \textit{false}$; $\textit{null}(\varepsilon) = \textit{true}$; $\textit{null}(a) = \textit{false}$; $\textit{null}(r + s) = \textit{null}(r) \lor \textit{null}(s)$; $\textit{null}(rs) = \textit{null}(r) \land \textit{null}(s)$; $\textit{null}(r^*) = \textit{true}$.

**Proof** (structural induction; assume the claim for proper sub-expressions).
- $\varnothing$: contains no string, in particular not $\varepsilon$. $\varepsilon$: $L = \{\varepsilon\}$. $a$: $L = \{a\}$, and $a \ne \varepsilon$.
- $r + s$: $\varepsilon \in L(r) \cup L(s)$ iff $\varepsilon \in L(r)$ or $\varepsilon \in L(s)$ iff (IH) $\textit{null}(r) \lor \textit{null}(s)$.
- $rs$: if $\varepsilon = xy$ with $x \in L(r)$, $y \in L(s)$, then $0 = |x| + |y|$, so $x = y = \varepsilon$; conversely if $\varepsilon$ is in both then $\varepsilon = \varepsilon\varepsilon \in L(rs)$. So $\varepsilon \in L(rs)$ iff $\varepsilon \in L(r)$ and $\varepsilon \in L(s)$ iff (IH) $\textit{null}(r) \land \textit{null}(s)$.
- $r^*$: $\varepsilon \in L(r)^0 \subseteq L(r)^*$ always. (No IH needed.)

**Example.** $\textit{null}(0 + 1^*) = \textit{false} \lor \textit{true} = \textit{true}$, and $\textit{null}((1+0)^*) = \textit{true}$, so the first summand is nullable and the whole union is: $\varepsilon$ **is** in the language. (The second summand $0(\varepsilon + 1)$ is not nullable, which does not matter for a union.) $\blacksquare$`,
      tags: ['structural induction'],
    },
    {
      id: 'regex-identities-2', type: 'written', title: 'More identities: prove or disprove', difficulty: 2,
      prompt: String.raw`For each claimed identity, either prove it (both inclusions, with a clear parsing argument) or give a counterexample with concrete regexes and a string.

1. $(r^*s)^* \equiv (r + s)^*$
2. $r^*(s r^*)^* \equiv (r+s)^*$
3. $(r + s)^*s \equiv (r^*s)(r^*s)^*$
4. $(rs + r)^*r \equiv r(sr + r)^*$`,
      rubric: [
        '1 false: r = 0, s = 1, the string 0 is only on the right',
        '2 true: cut a string of (r+s)* before each s-piece; first segment in r*, each later segment in s r*',
        '3 true: cut a string of (r+s)*s after each s-piece; every segment is r*s, and there is at least one',
        '4 true: rs + r ≡ r(s + ε), then the shifting identity (xy)*x ≡ x(yx)* with x = r, y = s + ε, and distributivity',
      ],
      hints: [String.raw`For (1), can a non-empty string of $(r^*s)^*$ end in an $r$-piece?`, String.raw`For (4), factor $rs + r = r(s + \varepsilon)$.`],
      solution: String.raw`**1. False.** $r = 0$, $s = 1$: $0 \in L((0+1)^*)$, but every non-empty string of $(0^*1)^*$ ends with an $s$-piece, i.e. in 1. So $0 \notin L((0^*1)^*)$.

**2. True.** ($\subseteq$) Both sides are concatenations of pieces from $L(r)$ and $L(s)$. ($\supseteq$) Let $w = p_1 \cdots p_k$ with each $p_i \in L(r) \cup L(s)$ (choose for each piece one language it belongs to). Cut the sequence just **before** each $s$-piece. The first segment consists of $r$-pieces only, so it is in $L(r^*)$; each later segment is one $s$-piece followed by $r$-pieces, so it is in $L(sr^*)$.

**3. True.** ($\supseteq$) A string of $(r^*s)(r^*s)^*$ is a concatenation of $r$- and $s$-pieces whose last piece is an $s$-piece: it is in $(r+s)^*s$. ($\subseteq$) A string of $(r+s)^*s$ is $p_1 \cdots p_k\,q$ with $q \in L(s)$; cut just **after** each $s$-piece (including $q$). Every segment is (some $r$-pieces)(one $s$-piece) $\in L(r^*s)$, there is at least one segment, and nothing is left over because the last piece is $q$.

**4. True.** By distributivity $rs + r \equiv r(s + \varepsilon)$, and similarly $sr + r \equiv (s + \varepsilon)r$. With $x = r$ and $y = s + \varepsilon$, the left side is $(xy)^*x$ and the right side is $x(yx)^*$, which are equivalent by the shifting identity $(xy)^*x \equiv x(yx)^*$.`,
      tags: ['identities'],
    },
  ],
});
