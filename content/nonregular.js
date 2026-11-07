CS374.topic({
  id: 'nonregular',
  unit: 'models',
  order: 6,
  title: 'Proving Non-Regularity: Fooling Sets',
  summary: 'Distinguishing suffixes, fooling sets, and the standard proof template for showing a language is not regular, plus closure-property arguments and DFA state lower bounds.',
  objectives: [
    'Decide whether two strings are distinguishable by a language and give a distinguishing suffix',
    'Write a complete, rubric-ready fooling-set proof that a language is not regular',
    'Choose a good fooling set for common language patterns (counting, palindromes, squares, powers)',
    'Prove non-regularity using closure properties (intersection with a regular language, complement)',
    'Use finite fooling sets to prove lower bounds on the number of states of any DFA',
    'Recognize and avoid the common logical mistakes in non-regularity proofs'
  ],
  lesson: String.raw`## Why some languages are not regular

A DFA has a **fixed, finite** number of states, and the state is the *only* thing it remembers about the prefix it has read so far. After reading a prefix $x$, the machine has to decide the fate of every possible continuation $z$ using only the state $\delta^*(s, x)$.

So if a language forces us to remember an unbounded amount of information about the prefix — "how many 0s have I seen?", "what was the entire first half?" — no finite set of states can do it. Fooling sets turn this intuition into a rigorous, mechanical proof technique. It is *the* technique CS 374 expects on homework and exams.

> **Key idea.** Two prefixes that "need different futures" must lead a DFA to different states. If infinitely many prefixes all need pairwise-different futures, the DFA would need infinitely many states.

## Distinguishing suffixes

> **Definition.** Let $L \subseteq \Sigma^*$. Strings $x, y \in \Sigma^*$ are **distinguishable by $L$** if there is a string $z \in \Sigma^*$ such that *exactly one* of $xz$ and $yz$ is in $L$. Such a $z$ is a **distinguishing suffix** for $x$ and $y$. If no such $z$ exists, $x$ and $y$ are **indistinguishable** (equivalent) with respect to $L$.

Note that $z$ may be empty: if exactly one of $x, y$ is in $L$, then $z = \varepsilon$ distinguishes them.

**Example.** Let $L = \{0^n 1^n : n \ge 0\}$.

- $x = 000$ and $y = 00000$ are distinguishable: take $z = 111$. Then $xz = 000111 \in L$, but $yz = 00000111 \notin L$.
- $x = 01$ and $y = 0011$ are **not** distinguishable: for $z = \varepsilon$ both are in $L$, and for any nonempty $z$ both $xz$ and $yz$ are outside $L$ (a string in $L$ cannot continue after its last 1). Both strings are "finished".
- $x = 10$ and $y = 110$ are not distinguishable either: no continuation puts either one in $L$; both are "dead".

## Fooling sets

> **Definition.** A **fooling set** for $L$ is a set $F \subseteq \Sigma^*$ such that every two *distinct* strings $x, y \in F$ are distinguishable by $L$.

> **Lemma.** If $F$ is a fooling set for $L$, then every DFA that accepts $L$ has at least $|F|$ states.

*Proof.* Let $M = (\Sigma, Q, s, A, \delta)$ be a DFA with $L(M) = L$, and suppose for contradiction that $|Q| < |F|$. By the pigeonhole principle there are distinct $x, y \in F$ with $\delta^*(s, x) = \delta^*(s, y)$. Then for every $z$,
$$\delta^*(s, xz) = \delta^*(\delta^*(s,x), z) = \delta^*(\delta^*(s,y), z) = \delta^*(s, yz),$$
so $M$ accepts $xz$ if and only if it accepts $yz$. That means no $z$ distinguishes $x$ and $y$ — contradicting that $F$ is a fooling set. $\blacksquare$

> **Theorem.** If $L$ has an **infinite** fooling set, then $L$ is not regular.

*Proof.* If some DFA with $k$ states accepted $L$, take any $k+1$ elements of the infinite fooling set; they form a fooling set of size $k+1 > k$, contradicting the lemma. $\blacksquare$

The same argument shows something slightly stronger: if $L$ has fooling sets of *every* finite size (even if no single infinite one is handy), $L$ is not regular.

## The standard proof template

Every fooling-set proof in this course has the same four moves. Graders look for each of them.

> **Exam tip.** The template, for $L = \{0^n1^n : n \ge 0\}$:
>
> 1. **Name the set.** Let $F = \{0^n : n \ge 0\}$ (i.e. $F = 0^*$).
> 2. **Arbitrary pair.** Let $x$ and $y$ be arbitrary *distinct* strings in $F$. Then $x = 0^i$ and $y = 0^j$ for some integers $i \ne j$.
> 3. **Suffix.** Let $z = 1^i$. Then $xz = 0^i1^i \in L$, but $yz = 0^j1^i \notin L$ because $j \ne i$.
> 4. **Conclude.** Thus $F$ is a fooling set for $L$. Because $F$ is infinite, $L$ cannot be regular.

Things to notice:

- $x$ and $y$ are **arbitrary**. You may not pick a specific pair like $0$ and $00$ — you must handle *every* pair.
- The suffix $z$ is allowed to depend on $x$ and $y$ (here $z = 1^i$ depends on $x$). It is *not* allowed to depend on anything else, such as the number of states of a hypothetical DFA.
- You must justify *both* membership claims: why one string is in $L$ and why the other is not.
- "Without loss of generality $i < j$" is fine when the argument is symmetric, because distinguishability is a symmetric relation.

### A proof built step by step

~~~steps Fooling-set proof: L = { w : |w| is even and the first half of w contains a 1 }
**Understand the language.** $w \in L$ iff $|w| = 2n$ for some $n$ and one of $w_1, \ldots, w_n$ is a 1. Why should this be non-regular? After reading $0^i$, a DFA must know $i$ exactly: a later 1 "counts" only if it lands in the first half, which depends on how long the string eventually becomes relative to $i$.
+++
**Choose the set.** Let $F = 0^* = \{0^i : i \ge 0\}$. It is infinite and explicitly described.
+++
**Take an arbitrary pair.** Let $x, y \in F$ be arbitrary distinct strings: $x = 0^i$, $y = 0^j$ with $i \ne j$. Because distinguishability is symmetric (a suffix that distinguishes $x$ from $y$ also distinguishes $y$ from $x$), we may assume without loss of generality that $i < j$.
+++
**Choose the suffix (it may depend on $i$ and $j$).** Put a 1 right after the shorter block and pad so that this 1 is exactly the last symbol of the first half: $z = 1\,0^{i+1}$.
+++
**Show $xz \in L$.** $xz = 0^i 1 0^{i+1}$ has length $2i + 2$, which is even; its first half consists of the first $i + 1$ symbols, $0^i1$, which contains a 1. So $xz \in L$.
+++
**Show $yz \notin L$ — covering every case.** $yz = 0^j10^{i+1}$ has length $i + j + 2$.
- If $i + j$ is odd, the length is odd, so $yz \notin L$.
- If $i + j$ is even, the first half has $(i + j + 2)/2$ symbols. Since $i < j$, $(i + j + 2)/2 < (j + j + 2)/2 = j + 1$, so the first half lies inside $0^j$ and contains no 1. So $yz \notin L$.
+++
**Conclude.** Every two distinct strings of $F$ are distinguishable, so $F$ is a fooling set for $L$. Since $F$ is infinite, $L$ is not regular. $\blacksquare$

Note how the case split in the previous step was forced on us: a proof that silently assumes $|yz|$ is even would lose points.
~~~

## A gallery of fooling-set proofs

### Palindromes

Let $\mathrm{PAL} = \{w \in \{0,1\}^* : w = w^R\}$.

Let $F = 0^*$. Let $x = 0^i$ and $y = 0^j$ be arbitrary with $i \ne j$. Let $z = 10^i$. Then $xz = 0^i10^i$ is a palindrome, so $xz \in \mathrm{PAL}$. But $yz = 0^j10^i$ reversed is $0^i10^j \ne 0^j10^i$ (the single 1 sits at a different position), so $yz \notin \mathrm{PAL}$. Hence $F$ is an infinite fooling set and PAL is not regular.

The separator 1 is essential: with $z = 0^i$ both $0^{i+i}$ and $0^{j+i}$ are palindromes. Over a **unary** alphabet every string is a palindrome, so unary PAL $= 0^*$ is regular.

### Even-length palindromes $\{ww^R\}$

Let $L = \{ww^R : w \in \{0,1\}^*\}$. Use $F = \{0^i1 : i \ge 0\}$. For $x = 0^i1$, $y = 0^j1$ with $i \ne j$, let $z = 10^i$. Then $xz = 0^i110^i = (0^i1)(0^i1)^R \in L$. The string $yz = 0^j110^i$ is not a palindrome since $i \ne j$, and every string in $L$ is a palindrome, so $yz \notin L$.

### Balanced parentheses

Let $\mathrm{BAL}$ be the set of balanced strings over $\{(, )\}$. Use $F = \{(^n : n \ge 0\}$. For $x = (^i$, $y = (^j$, $i \ne j$, let $z = )^i$. Then $xz = (^i)^i$ is balanced, but $yz = (^j)^i$ has unequal numbers of open and close parentheses, so it is not balanced.

### Perfect squares in unary: $\{0^{n^2} : n \ge 0\}$

Here the obvious $F = 0^*$ is awkward; choose the members of the language themselves. Let $F = \{0^{n^2} : n \ge 0\}$. Let $x = 0^{i^2}$, $y = 0^{j^2}$ be distinct; without loss of generality $i < j$. Let $z = 0^{2i+1}$. Then
$$xz = 0^{i^2 + 2i + 1} = 0^{(i+1)^2} \in L.$$
For $yz = 0^{j^2+2i+1}$: since $0 \le i < j$,
$$j^2 < j^2 + 2i + 1 < j^2 + 2j + 1 = (j+1)^2,$$
so $j^2+2i+1$ lies strictly between consecutive squares and $yz \notin L$.

> **Key idea.** For unary languages $\{0^{f(n)}\}$ where $f$ grows faster and faster, pick $F$ to be the language itself, and use the gap between consecutive members: append exactly enough to reach the *next* member from the smaller one, and show the larger one lands in a gap.

### Equal numbers of 0s and 1s

Let $L = \{w : \#_0(w) = \#_1(w)\}$. Let $F = 0^*$; for $x = 0^i$, $y = 0^j$, $i \ne j$, take $z = 1^i$: $xz$ has $i$ zeros and $i$ ones, but $yz$ has $j \ne i$ zeros and $i$ ones.

### $\{0^i1^j : i \ne j\}$

Same $F = 0^*$ and same suffix $z = 1^i$ — but now the roles flip: $xz = 0^i1^i \notin L$, while $yz = 0^j1^i \in L$. Fine: we only need *exactly one* of them in $L$.

## Choosing a fooling set

- **Counting languages** ($0^n1^n$, $\#_a = \#_b$, $a^nb^nc^n$, $0^i1^j$ with $i \ne j$ or $i < j$): $F = 0^*$ (or $a^*$), suffix built from the *other* symbol.
- **Matching / mirror languages** (palindromes, $ww^R$, $ww$): $F = 0^*$ or $\{0^i1\}$; the suffix contains a separator (a 1) followed by $0^i$, so position information matters.
- **Unary languages with growing gaps** ($0^{n^2}$, $0^{2^n}$, $0^{n!}$): $F$ = the language itself; suffix jumps from the smaller to the next member.
- If $F = 0^*$ fails, ask: *what does a DFA need to remember after reading this prefix?* Pick prefixes that force different memories.
- **Arithmetic conditions on one count** ($0^p$ for primes, $\gcd$, divisibility): $F = 0^*$ or $F$ = a set of primes, and use a number-theoretic fact (infinitely many primes, $p \mid p$, $\gcd(p, q) = 1$) to pick the suffix.
- **Languages with a separator** ($x\#y$ conditions): $F = 0^*$ before the separator, and put the separator first in the suffix.

~~~steps Which fooling set works for L = { ww : w ∈ {0,1}* }?
**Attempt 1: $F = 0^*$ with $z = 0^i$.** For $x = 0^i$: $xz = 0^{2i} = (0^i)(0^i) \in L$. But $yz = 0^{i+j}$ is also a square whenever $i + j$ is even (e.g. $i = 1$, $j = 3$: $0^4 = 00 \cdot 00$). The suffix fails for some pairs, so this is **not** a proof. Unary strings carry too little structure here.
+++
**Diagnose.** We need the suffix to "pin down" where the middle of the string is. A separator does that: once a 1 appears, its position constrains how the string can split into two equal halves.
+++
**Attempt 2: $F = 0^*$ with $z = 10^i1$.** $xz = 0^i10^i1 = (0^i1)(0^i1) \in L$. For $yz = 0^j10^i1$ with $j \ne i$: if it were $ww$, then since it contains exactly two 1s and the halves are equal, each half contains exactly one 1; the second half ends in 1, so $w$ ends in 1 and $w = 0^k1$. Then $ww = 0^k10^k1$, and matching the 0s before the first 1 gives $k = j$, the 0s between the 1s give $k = i$, so $i = j$ — contradiction. Hence $yz \notin L$. This works for **every** pair, so $0^*$ is a fooling set after all — with the right suffix.
+++
**Alternative: $F = \{0^i1 : i \ge 0\}$ with $z = 0^i1$.** This is the same idea with the first 1 moved into $F$; the verification is identical. Either write-up earns full credit. The lesson: when a suffix fails for some pairs, change the suffix (or the set) — never restrict to the pairs where it happens to work.
~~~

**Try it first.** Prove that $L = \{x1y : x, y \in \{0,1\}^*, |x| = |y|\}$ (odd-length strings whose middle symbol is 1) is not regular.

~~~reveal Solution
Let $F = 0^*$. Let $x = 0^i$, $y = 0^j$ be arbitrary with $i \ne j$, and let $z = 10^i$.
- $xz = 0^i10^i$: odd length $2i+1$, middle symbol at position $i + 1$ is the 1. So $xz \in L$.
- $yz = 0^j10^i$ has length $i + j + 1$. If this is even, $yz \notin L$. If it is odd, the middle position is $(i + j)/2 + 1$, which equals the position $j + 1$ of the only 1 iff $i = j$. Since $i \ne j$, the middle symbol is a 0, so $yz \notin L$.

$F$ is an infinite fooling set, so $L$ is not regular. (No WLOG was needed: the argument works whichever of $i, j$ is larger.)
~~~

**Try it first.** Prove that $L = \{0^m1^n : \gcd(m, n) = 1\}$ is not regular.

~~~reveal Solution
Let $F = \{0^p : p \text{ prime}\}$, which is infinite because there are infinitely many primes. Let $x = 0^p$ and $y = 0^q$ be arbitrary distinct elements, so $p \ne q$ are primes. Let $z = 1^p$.
- $xz = 0^p1^p$ and $\gcd(p, p) = p \ge 2$, so $xz \notin L$.
- $yz = 0^q1^p$ and $\gcd(q, p) = 1$ because distinct primes are coprime, so $yz \in L$.

Exactly one is in $L$, so $F$ is a fooling set; it is infinite, so $L$ is not regular. (With $F = 0^*$ and $z = 1^i$ the argument breaks: e.g. $\gcd(2, 4) = 2$ and $\gcd(4, 4) = 4$ put both strings outside $L$.)
~~~

## Proving non-regularity with closure properties

Regular languages are closed under union, intersection, complement, concatenation, star, reversal, and more. You can exploit this *by contradiction*:

> **Theorem.** If $L \cap R$ is not regular for some regular language $R$, then $L$ is not regular. (Contrapositive: if $L$ were regular, $L \cap R$ would be regular.)

**Example.** Let $L = \{w \in \{0,1\}^* : \#_0(w) = \#_1(w)\}$. Suppose $L$ is regular. Since $0^*1^*$ is regular, $L \cap 0^*1^* = \{0^n1^n : n \ge 0\}$ would be regular. But we proved $\{0^n1^n\}$ is not regular. Contradiction; so $L$ is not regular.

**Example.** Let $L' = \{w : \#_0(w) \ne \#_1(w)\}$. If $L'$ were regular, its complement $\{w : \#_0(w) = \#_1(w)\}$ would be regular — but we just showed it is not.

> **Warning.** Closure arguments only work in the direction above. These are all **invalid**:
>
> - "$L \subseteq R$ and $R$ is regular, so $L$ is regular." ($\{0^n1^n\} \subseteq \Sigma^*$.)
> - "$L \supseteq N$ and $N$ is not regular, so $L$ is not regular." ($\Sigma^*$ contains every language.)
> - "$L = A \cup B$ with $A$ and $B$ not regular, so $L$ is not regular." ($N \cup \overline{N} = \Sigma^*$.)
> - "$L \cap R$ is regular, so $L$ is regular." ($\{0^n1^n\} \cap 1^* = \{\varepsilon\}$.)

**A closure trick worth knowing.** Changing a language by finitely many strings never changes regularity (finite languages are regular, and $L \cup F$, $L \setminus F$ preserve regularity). So $\{0^n1^n : n \ge 1\}$ is non-regular too, and you may intersect with $0^+1^+$ instead of $0^*1^*$ when it is convenient.

**Try it first.** Find every error in this "proof" that $L = \{0^i1^j : i < j\}$ is not regular:

> *Let $F = \{0, 00, 000\}$. Take $x = 0$ and $y = 00$. Let $z = 11$. Then $xz = 011 \in L$ and $yz = 0011 \in L$. So $F$ is a fooling set, and therefore $L$ is not regular.*

~~~reveal Solution
1. **$F$ is finite.** A finite fooling set only proves a lower bound on the number of states (here at most 3), never non-regularity.
2. **A specific pair.** $x = 0$, $y = 00$ is one pair; a fooling set requires *every* pair of distinct elements to be distinguishable, so the proof must treat arbitrary $x = 0^i$, $y = 0^j$.
3. **A false membership claim, and a conclusion that contradicts it.** $yz = 0011$ has two 0s and two 1s, so $yz \notin L$; the write-up claims $yz \in L$. Worse, if both $xz$ and $yz$ really were in $L$, then $z$ would *not* distinguish $x$ and $y$ — the stated evidence argues against the conclusion. Always state and check both memberships: one string in $L$, the other not.

A correct proof: $F = 0^*$; for $x = 0^i$, $y = 0^j$ with $i < j$ (WLOG), let $z = 1^{j}$. Then $xz = 0^i1^j \in L$ since $i < j$, and $yz = 0^j1^j \notin L$. $F$ is infinite, so $L$ is not regular.
~~~

## Finite fooling sets and DFA lower bounds

The lemma is useful even for regular languages: a fooling set of size $k$ proves every DFA for $L$ has at least $k$ states. Combined with a $k$-state DFA, this proves the DFA is **minimal**.

**Example.** Let $L_3 = \{w \in \{0,1\}^* : \text{the third-to-last symbol of } w \text{ is } 1\}$. Let $F = \{0,1\}^3$, all 8 strings of length 3. If $x \ne y$ in $F$, they differ in some position $k \in \{1,2,3\}$; let $z = 0^{k-1}$. In $xz$ and $yz$ (length $k+2$), the third-to-last symbol is at position $k$, so exactly one of them has a 1 there. Hence every DFA for $L_3$ needs at least $2^3 = 8$ states — and 8 suffice (remember the last three symbols). In general, "the $k$-th symbol from the end is 1" needs $2^k$ DFA states, even though an NFA needs only $k+1$.

Below is a DFA that looks like it needs counting but does not: the language of strings with as many occurrences of <code>01</code> as of <code>10</code>. These counts never differ by more than one, and they are equal exactly when the string is empty or starts and ends with the same symbol.

~~~automaton
alphabet: 01
start: s
accept: s, a0, a1
s 0 -> a0
s 1 -> a1
a0 0 -> a0
a0 1 -> b0
b0 1 -> b0
b0 0 -> a0
a1 1 -> a1
a1 0 -> b1
b1 0 -> b1
b1 1 -> a1
~~~

**Try it first.** Prove that every DFA for "contains $0110$ as a substring" has at least 5 states.

~~~reveal Solution: the prefixes of the pattern form a fooling set
Let $F = \{\varepsilon, 0, 01, 011, 0110\}$, the five prefixes of $p = 0110$; write $p_k$ for the prefix of length $k$. Take arbitrary $k < m$ in $\{0, \ldots, 4\}$.
- If $m = 4$: use $z = \varepsilon$. $p_4 = 0110 \in L$, while $p_k$ has length $< 4$ and cannot contain $0110$.
- If $m < 4$: let $z$ be the rest of the pattern after $p_m$ (so $p_m z = 0110 \in L$). Then $p_k z$ has length $k + (4 - m) < 4$, so it cannot contain $0110$: $p_k z \notin L$.

So $F$ is a fooling set of size 5 and every DFA needs at least 5 states. (Five states suffice: the KMP-style DFA tracking the longest suffix that is a prefix of $0110$, plus an accepting trap.) The same argument shows "contains $p$" needs at least $|p| + 1$ states for any pattern $p$.
~~~

**Try it first.** Is $L = \{w \in \{0,1\}^* : \#_0(w) = \#_1(w) \text{ and every prefix } u \text{ of } w \text{ has } \lvert \#_0(u) - \#_1(u) \rvert \le 2\}$ regular?

~~~~reveal Solution: yes — the counter is bounded
It is regular: a DFA only needs to track the difference $\#_0 - \#_1$ of the prefix read so far, and the difference is confined to $\{-2, \ldots, 2\}$ (leaving that range is fatal). Five states plus a dead state; accept at difference 0.

~~~automaton
alphabet: 01
start: c0
accept: c0
c0 0 -> p1
c0 1 -> m1
p1 0 -> p2
p1 1 -> c0
p2 1 -> p1
m1 1 -> m2
m1 0 -> c0
m2 0 -> m1
~~~

A fooling set attempt like $F = 0^*$ fails because $0^3$ is already dead — the strings $0^i$ for $i \ge 3$ are all indistinguishable. The lesson: "equal counts" makes a language non-regular only when the counts are **unbounded**.
~~~~

## Myhill–Nerode (brief)

Indistinguishability is an equivalence relation: write $x \equiv_L y$ if no suffix distinguishes $x$ and $y$.

> **Theorem.** (Myhill–Nerode) $L$ is regular if and only if $\equiv_L$ has finitely many equivalence classes. Moreover, the number of classes equals the number of states of the minimal DFA for $L$.

*Proof.* ($\Rightarrow$) If a DFA $M$ with $k$ states accepts $L$, then $\delta^*(s, x) = \delta^*(s, y)$ implies $x \equiv_L y$ (every suffix treats them the same — the computation in the fooling-set lemma). So each class is a union of the "same final state" groups, and there are at most $k$ classes.

($\Leftarrow$) Suppose there are finitely many classes $[x]$. Build a DFA whose states are the classes: start $[\varepsilon]$, transition $[x] \xrightarrow{a} [xa]$, accepting $\{[x] : x \in L\}$. This is well defined: if $x \equiv_L y$ then $xa \equiv_L ya$ (a suffix $z$ distinguishing $xa, ya$ would make $az$ distinguish $x, y$), and $x \in L \iff y \in L$ (take $z = \varepsilon$). By induction the DFA is in $[w]$ after reading $w$, so it accepts exactly $L$. Its number of states is the number of classes, and by ($\Rightarrow$) no DFA has fewer. $\blacksquare$

A fooling set is exactly a set of strings from pairwise different classes. So fooling sets are not just *a* technique: whenever $L$ is not regular, an infinite fooling set exists (pick one representative from each of the infinitely many classes). The fooling-set method is complete.

## The pumping lemma (brief)

> **Lemma.** (Pumping lemma) If $L$ is regular, there is a $p \ge 1$ such that every $w \in L$ with $|w| \ge p$ can be written $w = xyz$ with $|xy| \le p$, $|y| \ge 1$, and $xy^iz \in L$ for all $i \ge 0$.

It can be used (via the contrapositive) to prove non-regularity, but it involves an alternating quantifier game ("for every $p$ there exists $w$ such that for every split there exists $i$...") that students routinely botch, and it is not complete: some non-regular languages satisfy the pumping condition. CS 374 strongly prefers fooling sets; use them unless a problem explicitly asks for pumping. **The pumping lemma can never prove a language IS regular.**

## Common exam problem patterns

**1. "Prove that $L$ is not regular."** Recipe: (i) ask what unbounded information a DFA would need after a prefix; (ii) pick $F$ (start with $0^*$; add a separator or use $L$ itself for unary growth languages; use primes for divisibility/gcd); (iii) write $x = 0^i$, $y = 0^j$, $i \ne j$ (WLOG $i < j$ only if your argument is symmetric); (iv) give $z$ in terms of $i$ (and $j$); (v) prove $xz \in L$ and $yz \notin L$, with **all** cases; (vi) conclude with "infinite fooling set".

**2. "Regular or not? Prove it."** Recipe: first look for a reason it might be regular: bounded counters, conditions mod $k$, conditions that collapse (e.g. $\{wxw^R : w, x \ne \varepsilon\}$ only constrains the first and last symbol), finitely many cases. Test small strings to guess the true language. If regular, give a DFA/NFA/regex (and briefly justify it); if not, a fooling set or closure argument.

**3. "Use closure properties to prove $L$ is not regular."** Recipe: "Suppose $L$ is regular. Then [operation] gives [language], which is regular because [closure property]. ... But [known non-regular language] — contradiction." The most common operations: intersect with $0^*1^*$ or $0^+1^+$, complement, reverse, swap symbols with a homomorphism.

**4. "Prove every DFA for $L$ has at least $k$ states."** Recipe: a fooling set with exactly $k$ strings — usually one string per "thing the DFA must remember" (residues mod $k$, subsets of symbols seen, prefixes of a pattern, last $k$ symbols) — and a distinguishing suffix for an arbitrary pair. Often paired with "and show $k$ states suffice".

**5. "What is wrong with this proof?"** Recipe: check each move of the template: is $F$ infinite and explicit? Are $x, y$ arbitrary? Does $z$ depend only on $x, y$? Are both memberships proved, for every case? Is a closure argument used in the valid direction?

## Where students lose points

- **The suffix does not work for every pair.** It is not enough that $z$ works for $i = 1, j = 2$; check the general case and the edge cases ($i = 0$, $i + j$ even/odd, $j$ a multiple of $i$, ...).
- **Choosing a set that is not infinite** (or not explicitly described), or concluding non-regularity from a finite fooling set.
- **Picking a specific pair.** "Take $x = 0$, $y = 00$" proves only that two particular strings are distinguishable — that shows a DFA needs 2 states, not infinitely many.
- **$F$ not infinite, or not explicitly described.** Write $F$ down precisely, e.g. $F = \{0^n : n \ge 0\}$.
- **Using strings of $L$ as $F$ when they are indistinguishable.** For $L = \{0^n1^n\}$, $F = \{0^n1^n : n \ge 0\}$ is **not** a fooling set: every element is "complete", and $z = \varepsilon$ puts both in $L$ while any nonempty $z$ puts both out.
- **Only proving one membership.** You must show one of $xz, yz$ is in $L$ *and* the other is not.
- **Forgetting cases.** If your argument assumes $i < j$, say why that is without loss of generality; if it assumes $i \ge 1$, make sure $F$ excludes $i = 0$ or handle it.
- **Arguing about "the DFA must count".** Intuition is not a proof. The fooling-set argument is the proof.
- **Wrong-direction closure arguments.** See the warning box above.
- **Unjustified WLOG.** "Assume $i < j$" is fine only if the rest of the proof does not secretly use more (for example, choosing $z$ from the *smaller* index is fine; then claiming something about the larger index that would fail with roles swapped is not).
- **Suffix depending on the wrong thing**, e.g. "let $z = 1^p$ where $p$ is the number of states". The suffix may depend only on the pair $x, y$.
- **Hand-waving the "not in $L$" half.** "Clearly $0^{j^2 + 2i + 1}$ is not a square" needs the inequality $j^2 < j^2 + 2i + 1 < (j+1)^2$.

## Self-check

1. For $L = \{0^n1^n\}$, is $\{0^i1 : i \ge 0\}$ a fooling set?

~~~reveal Answer
Yes. For $i \ne j$ use $z = 1^{i-1}$ when $i \ge 1$: $0^i1 \cdot 1^{i-1} = 0^i1^i \in L$ and $0^j1^i \notin L$. If $i = 0$ (so $x = 1$, which is dead), then $j \ge 1$ and $z = 1^{j-1}$ puts $y z \in L$ while $1 \cdot 1^{j-1} \notin L$. Many fooling sets work; $0^*$ is just the simplest.
~~~

2. Is $\{0^n1^n : n \le 10^6\}$ regular? What does a fooling-set argument give for it?

~~~reveal Answer
It is finite, hence regular. $\{0^i : 0 \le i \le 10^6\}$ is a fooling set of size $10^6 + 1$, so every DFA for it needs more than a million states — large, but finite.
~~~

3. Which suffix distinguishes $0^i$ and $0^j$ ($i < j$) for $L = \{w : \#_0(w) > \#_1(w)\}$?

~~~reveal Answer
$z = 1^i$: $0^i1^i$ has equal counts ($\notin L$) and $0^j1^i$ has more 0s ($\in L$). Note that $z = 1^j$ fails: both $0^i1^j$ and $0^j1^j$ are outside $L$.
~~~

4. True or false: if $L$ is not regular, then every infinite subset of $\Sigma^*$ is a fooling set for $L$.

~~~reveal Answer
False. For $L = \{0^n1^n\}$, the infinite set $\{0^n1^n : n \ge 0\}$ is not a fooling set (all its elements are equivalent), and neither is $1^*$ (all dead) — you must choose $F$ carefully.
~~~

5. $L = \{0^m1^n : m \equiv n \pmod{5}\}$. Regular or not?

~~~reveal Answer
Regular: a DFA tracks $m \bmod 5$ while reading 0s and then counts the 1s down mod 5 (10 states plus a dead state). Conditions modulo a constant need only bounded memory.
~~~

6. Why does the fooling-set lemma need a **DFA** — would "every NFA for $L$ has at least $|F|$ states" also follow?

~~~reveal Answer
No. The proof uses that a DFA is in exactly one state after reading $x$. NFAs can be exponentially smaller: "the $k$-th symbol from the end is 1" has a fooling set of size $2^k$ but an NFA with $k + 1$ states.
~~~
`,
  cheatsheet: String.raw`## Definitions

- $x, y$ **distinguishable** by $L$: some $z$ has exactly one of $xz, yz \in L$ ($z = \varepsilon$ allowed).
- **Fooling set** $F$: every two distinct elements are distinguishable.
- **Lemma:** fooling set of size $k$ $\Rightarrow$ every DFA for $L$ has $\ge k$ states (pigeonhole: same state $\Rightarrow$ same fate for every suffix).
- **Theorem:** infinite fooling set $\Rightarrow$ $L$ is not regular.

## Proof template (copy this structure)

1. Let $F = \{\ldots\}$ (infinite, explicit).
2. Let $x, y$ be **arbitrary distinct** elements: $x = 0^i$, $y = 0^j$, $i \ne j$ (WLOG $i<j$ only if symmetric).
3. Let $z = \ldots$ (may depend on $i$, $j$ — nothing else).
4. Show $xz \in L$ **and** $yz \notin L$ (or vice versa), covering every case.
5. "So $F$ is a fooling set for $L$. Because $F$ is infinite, $L$ is not regular."

## Standard choices

| Language | $F$ | $z$ for $x=0^i$ (or as noted) |
|---|---|---|
| $0^n1^n$, $\#_0=\#_1$, $0^i1^j$ ($i\ne j$) | $0^*$ | $1^i$ |
| $\#_0 > \#_1$, $0^i1^j$ ($i<j$) | $0^*$, $i<j$ | $1^i$ / $1^j$ |
| $0^i1^j$, $i \ge 1$ divides $j$ | $0^+$, $i<j$ | $1^i$ |
| palindromes; $w \ne w^R$ | $0^*$ | $10^i$ |
| $ww^R$ | $\{0^i1\}$ | $10^i$ |
| $ww$ | $\{0^i1\}$ | $0^i1$ |
| $x\#y$, $x$ a substring of $y$ | $0^*$, $i<j$ | $\#0^i$ |
| balanced parens (any number of types) | $(^*$ | $)^i$ |
| middle symbol is 1 | $0^*$ | $10^i$ |
| $0^{n^2}$ | $\{0^{n^2}\}$, $i<j$ | $0^{2i+1}$ |
| $0^{2^n}$ | $\{0^{2^n}\}$, $i<j$ | $0^{2^i}$ |
| $0^{n!}$ | $\{0^{n!} : n \ge 1\}$, $i<j$ | $0^{i \cdot i!}$ |
| $0^p$, $p$ prime | $0^*$ | $0^k$ with $k$ from the periodicity argument |
| $0^m1^n$, $\gcd(m,n)=1$ | $\{0^p : p \text{ prime}\}$ | $1^p$ |

## Closure trick

- $L \cap R$ non-regular with $R$ regular $\Rightarrow$ $L$ non-regular. E.g. $\{\#_0=\#_1\} \cap 0^*1^* = 0^n1^n$.
- $\overline{L}$ or $L^R$ non-regular $\Rightarrow$ $L$ non-regular. Finite changes never matter.
- **Invalid:** subsets/supersets, unions of non-regular languages, "$L \cap R$ regular".

## Regular look-alikes (check before proving!)

- Bounded counters: $\lvert\#_0 - \#_1\rvert \le c$ on all prefixes; counts mod $k$; $i \cdot j$ even.
- $\#01 = \#10$ (iff first = last symbol); $\#01 \ge \#10$ (iff not "starts 1, ends 0").
- $\{wxw^R : w, x \ne \varepsilon\} = 0\Sigma\Sigma^*0 + 1\Sigma\Sigma^*1$.
- $\{uv : \#_0(u) = \#_1(v)\} = \Sigma^*$ (the difference moves by exactly 1 per split point).
- Unary $\{ww\} = (00)^*$; unary palindromes $= 0^*$; finite languages.

## Lower bounds

- $k$-th symbol from the end is 1: $F = \{0,1\}^k$, needs $2^k$ states.
- "contains $p$": prefixes of $p$, needs $\ge |p|+1$ states.
- Value mod $k$ (binary): one string per residue; "all symbols of $\Sigma$ appear": one string per subset ($2^{|\Sigma|}$).
- Myhill–Nerode: #classes of $\equiv_L$ = #states of minimal DFA; finite iff regular.
- Pumping lemma: only proves non-regularity, not complete; course prefers fooling sets.
`,
  quiz: [
    {
      type: 'mc',
      q: String.raw`Let $L = \{0^n1^n : n \ge 0\}$. Which string is a distinguishing suffix for $x = 0^3$ and $y = 0^5$?`,
      choices: [String.raw`$\varepsilon$`, String.raw`$1^3$`, String.raw`$0\,1^5$`, String.raw`$1^4$`],
      answer: 1,
      explain: String.raw`$0^3 1^3 \in L$ while $0^5 1^3 \notin L$, so $z = 1^3$ works. $\varepsilon$ fails (both $0^3$ and $0^5$ are outside $L$). $z = 01^5$ fails: $0^41^5$ and $0^61^5$ are both outside $L$. $z = 1^4$ fails: $0^31^4$ and $0^51^4$ are both outside $L$. (Distinguishing suffixes are not unique in general — $z = 0^21^5$ would also work — but you only ever need one.)`
    },
    {
      type: 'tf',
      q: String.raw`For $L = \{0^n1^n : n \ge 0\}$, the set $F = \{0^n1^n : n \ge 0\}$ is a fooling set.`,
      answer: false,
      explain: String.raw`Every element of this $F$ is a "finished" string: with $z = \varepsilon$ both $xz$ and $yz$ are in $L$, and with any nonempty $z$ both are outside $L$. So no two elements are distinguishable. Elements of $L$ itself are often a poor choice; pick prefixes that still have unfinished business, like $0^i$.`
    },
    {
      type: 'tf',
      q: 'If L has a fooling set with 7 elements, then every DFA accepting L has at least 7 states.',
      answer: true,
      explain: 'This is the fooling-set lemma. If a DFA had fewer than 7 states, two of the 7 strings would reach the same state (pigeonhole), and then every suffix would treat them identically — contradicting that they are distinguishable.'
    },
    {
      type: 'tf',
      q: 'If for every k there is a fooling set for L of size k (but you do not know any single infinite one), then L is not regular.',
      answer: true,
      explain: 'A DFA with k states would contradict the fooling set of size k+1. (In fact, by Myhill-Nerode an infinite fooling set then also exists, but you do not need it.)'
    },
    {
      type: 'tf',
      q: 'Every subset of a regular language is regular.',
      answer: false,
      explain: String.raw`$\{0^n1^n\}$ is a subset of the regular language $\Sigma^*$ (and of $0^*1^*$) but is not regular. Subsets and supersets tell you nothing about regularity.`
    },
    {
      type: 'tf',
      q: 'The union of two non-regular languages is always non-regular.',
      answer: false,
      explain: String.raw`Take $N = \{0^n1^n\}$ and its complement $\overline{N}$; both are non-regular, but $N \cup \overline{N} = \Sigma^*$ is regular. Similarly, the intersection of two non-regular languages can be regular (e.g. $N \cap \overline{N} = \emptyset$). Complement is the exception: the complement of a non-regular language is always non-regular, because regular languages are closed under complement.`
    },
    {
      type: 'mc',
      q: String.raw`Let $L = \{w \in \{0,1\}^* : \#_0(w) = \#_1(w)\}$. Which regular language $R$ makes $L \cap R$ a known non-regular language, proving $L$ non-regular?`,
      choices: [String.raw`$R = (01)^*$`, String.raw`$R = 0^*1^*$`, String.raw`$R = \Sigma^*$`, String.raw`$R = 1^*0^*1^*0^*$`],
      answer: 1,
      explain: String.raw`$L \cap 0^*1^* = \{0^n1^n\}$, which is non-regular; if $L$ were regular this intersection would be regular. $(01)^* \subseteq L$, so $L \cap (01)^* = (01)^*$ is regular — no contradiction. $R = \Sigma^*$ just gives back $L$ itself (circular). The last choice gives a messier language that you would have to prove non-regular separately.`
    },
    {
      type: 'tf',
      q: String.raw`If $L \cap R$ is regular for some regular $R$, then $L$ is regular.`,
      answer: false,
      explain: String.raw`Counterexample: $\{0^n1^n\} \cap 1^* = \{\varepsilon\}$ is regular, but $\{0^n1^n\}$ is not. Only the other direction is valid: if $L$ is regular then $L \cap R$ is regular, so a non-regular intersection proves $L$ non-regular.`
    },
    {
      type: 'multi',
      q: 'Which of these languages over {0,1} are regular? (select all that apply)',
      choices: [
        String.raw`$\{0^n1^n : 0 \le n \le 374\}$`,
        String.raw`$\{w : w \text{ has equally many occurrences of } 01 \text{ and } 10\}$`,
        String.raw`$\{0^m1^n : m \equiv n \pmod 3\}$`,
        String.raw`$\{0^n1^n : n \ge 0\}$`,
        String.raw`$\{0^{2n} : n \ge 0\}$`,
        String.raw`$\{0^m1^n : m \le n\}$`
      ],
      answer: [0, 1, 2, 4],
      explain: String.raw`A finite language is always regular (choice 1). Occurrences of 01 and 10 alternate, so they are equal iff the string is empty or starts and ends with the same symbol (choice 2). Counting mod 3 needs only finitely many states (choice 3). $0^{2n}$ is $(00)^*$. $\{0^n1^n\}$ and $\{0^m1^n : m \le n\}$ need unbounded counting; for the latter use $F = 0^*$ and, for $i < j$, $z = 1^i$.`
    },
    {
      type: 'mc',
      q: 'What is the minimum number of states of a DFA (over {0,1}) for the language of strings whose second-to-last symbol is 1?',
      choices: ['2', '3', '4', '8'],
      answer: 2,
      explain: String.raw`The four strings $00, 01, 10, 11$ form a fooling set: if they differ in position $k$, the suffix $0^{k-1}$ distinguishes them. So at least 4 states are needed, and a DFA remembering the last two symbols uses exactly 4. In general the $k$-th-from-last language needs $2^k$ states.`
    },
    {
      type: 'mc',
      q: String.raw`How many equivalence classes does $\equiv_L$ have for $L = \{w \in \{0,1\}^* : w \text{ has an even number of 0s}\}$?`,
      choices: ['1', '2', '3', 'Infinitely many'],
      answer: 1,
      explain: 'The classes are "even number of 0s so far" and "odd number of 0s so far"; any two strings in the same class behave the same under every suffix, and the suffix epsilon separates the two classes. By Myhill-Nerode the minimal DFA has 2 states.'
    },
    {
      type: 'tf',
      q: 'The pumping lemma can be used to prove that a language is regular.',
      answer: false,
      explain: 'The pumping lemma states a necessary condition for regularity. Some non-regular languages satisfy the pumping condition, so satisfying it proves nothing. It is only ever used, via its contrapositive, to show non-regularity — and CS 374 prefers fooling sets for that.'
    },
    {
      type: 'tf',
      q: 'The set of palindromes over the one-letter alphabet {0} is not regular.',
      answer: false,
      explain: String.raw`Every unary string reads the same backwards, so the language is $0^*$, which is regular. The palindrome fooling-set proof needs a second symbol as a separator (suffix $10^i$).`
    },
    {
      type: 'mc',
      q: String.raw`In a fooling-set proof for $L = \{0^{n^2} : n \ge 0\}$ with $F = L$, $x = 0^{i^2}$, $y = 0^{j^2}$ and $i < j$, which suffix works?`,
      choices: [String.raw`$z = 0^{i^2}$`, String.raw`$z = 0^{2i+1}$`, String.raw`$z = 0^{2j+1}$`, String.raw`$z = 0$`],
      answer: 1,
      explain: String.raw`$xz = 0^{(i+1)^2} \in L$, and $j^2 < j^2 + 2i + 1 < (j+1)^2$ because $i < j$, so $yz \notin L$. With $z = 0^{2j+1}$ we get $yz \in L$, but $xz = 0^{i^2+2j+1}$ can also be a square (e.g. $i = 0$, $j = 4$ gives $9$), so it fails for some pairs. With $z = 0$ and $i = 1$, $j = 2$, both $2$ and $5$ are non-squares, so it fails too. $z = 0^{i^2}$ fails for $i = 1$, $j = 2$ as well ($2$ and $5$ again). A proof needs a suffix that works for **every** pair.`
    },
    {
      type: 'tf',
      q: 'In a fooling-set proof, the distinguishing suffix z is allowed to depend on the two strings x and y being distinguished.',
      answer: true,
      explain: 'Distinguishability is a property of each pair, so each pair may get its own suffix. What you may NOT do is pick a particular pair; x and y must be arbitrary distinct elements of F.'
    },
    {
      type: 'mc',
      q: String.raw`Let $L = \{w \in \{0,1\}^* : \#_0(w) > \#_1(w)\}$, $F = 0^*$, $x = 0^i$, $y = 0^j$ with $i \ne j$ (no WLOG). Which suffix works for **every** such pair?`,
      choices: [String.raw`$1^i$`, String.raw`$1^{\min(i,j)}$`, String.raw`$1^{\max(i,j)}$`, String.raw`$0^i$`],
      answer: 1,
      explain: String.raw`With $m = \min(i,j)$, the string with $m$ zeros gets $m$ ones (equal, not in $L$) and the other has more zeros than ones (in $L$). $1^i$ fails when $i > j$: then $0^i1^i$ and $0^j1^i$ are both outside $L$. $1^{\max}$ puts both outside $L$; $0^i$ puts both inside. (Equivalently: assume WLOG $i < j$ and use $1^i$.)`
    },
    {
      type: 'tf',
      q: String.raw`$\{0^n1^n : 0 \le n \le 1000\}$ is regular.`,
      answer: true,
      explain: String.raw`It is finite, and every finite language is regular. A fooling-set argument shows any DFA needs at least 1001 states, but that is a finite number. Non-regularity needs an *infinite* fooling set.`
    },
    {
      type: 'mc',
      q: String.raw`Which regular expression describes $\{wxw^R : w, x \in \{0,1\}^+\}$ (both $w$ and $x$ nonempty)?`,
      choices: [String.raw`It is not regular`, String.raw`$0\Sigma\Sigma^*0 + 1\Sigma\Sigma^*1$`, String.raw`$\Sigma\Sigma^*\Sigma$`, String.raw`$0\Sigma^*0 + 1\Sigma^*1$`],
      answer: 1,
      explain: String.raw`Any such string starts and ends with the same symbol $w_1$ and has length at least 3. Conversely, if $s = a u a$ with $|u| \ge 1$, take $w = a$, $x = u$. The long $w$ adds no constraint because a one-symbol $w$ already suffices. The last choice wrongly allows $00$ (that would need $x = \varepsilon$).`
    },
    {
      type: 'tf',
      q: String.raw`For $L = \{0^n1^n\}$, the following is a valid proof: "Let $F = 0^*$; let $x = 0^i$, $y = 0^j$ with $i < j$ (WLOG); let $z = 1^j$. Then $xz = 0^i1^j \notin L$ and $yz = 0^j1^j \in L$; so $F$ is an infinite fooling set and $L$ is not regular."`,
      answer: true,
      explain: String.raw`It is valid: exactly one of $xz, yz$ is in $L$ — it does not matter that it is $yz$ rather than $xz$. WLOG is justified because distinguishability is symmetric.`
    },
    {
      type: 'mc',
      q: String.raw`For $L = \{0^i1^j : i \ge 1 \text{ and } j \text{ is a multiple of } i\}$, $x = 0^i$, $y = 0^j$ with $1 \le i < j$: which suffix distinguishes them?`,
      choices: [String.raw`$1^j$`, String.raw`$1^i$`, String.raw`$1^{ij}$`, String.raw`$\varepsilon$`],
      answer: 1,
      explain: String.raw`$0^i1^i \in L$ since $i \mid i$, while $0^j1^i \notin L$ since $0 < i < j$ means $j \nmid i$. With $1^j$, $0^i1^j \in L$ iff $i \mid j$ — sometimes both are in $L$ (e.g. $i = 2$, $j = 4$). $1^{ij}$ puts both in $L$, and $\varepsilon$ puts both in $L$ ($0 = 0 \cdot i$).`
    },
    {
      type: 'tf',
      q: String.raw`If $L$ is not regular, then $L^*$ is not regular.`,
      answer: false,
      explain: String.raw`$\{0^p : p \text{ prime}\}$ is not regular, but its star is $\{\varepsilon\} \cup \{0^k : k \ge 2\}$ (every $k \ge 2$ is a sum of 2s and 3s), which is regular.`
    },
    {
      type: 'mc',
      q: String.raw`What is the minimum number of states of a DFA over $\{0,1\}$ that accepts the binary representations (most significant bit first, $\varepsilon$ read as 0) of multiples of 5?`,
      choices: ['3', '4', '5', '6'],
      answer: 2,
      explain: String.raw`States $0, \ldots, 4$ track the value mod 5 ($r \xrightarrow{b} 2r + b \bmod 5$): 5 suffice. A fooling set of 5 strings with distinct residues (e.g. $\varepsilon, 1, 10, 11, 100$) shows 5 are needed: for residues $a \ne b$, some 3-bit suffix $z$ makes $8a + z \equiv 0$, and then $8b + z \not\equiv 0 \pmod 5$ since 8 is invertible mod 5.`
    },
    {
      type: 'mc',
      q: String.raw`For $L = \{x\#y : x, y \in \{0,1\}^*, x \text{ is a substring of } y\}$ and $x = 0^i$, $y = 0^j$ with $i < j$, which suffix works?`,
      choices: [String.raw`$\#0^j$`, String.raw`$\#0^i$`, String.raw`$\#$`, String.raw`$\#1^i$`],
      answer: 1,
      explain: String.raw`$0^i\#0^i \in L$ (a string is a substring of itself), but $0^j\#0^i \notin L$ because $0^j$ is longer than $0^i$. With $\#0^j$ both are in $L$; with $\#$ only $\varepsilon$ would be a substring of $\varepsilon$, so both are out unless $i = 0$; with $\#1^i$ both are out for $i \ge 1$.`
    },
    {
      type: 'multi',
      q: 'Which of these languages over {0,1} are regular? (select all that apply)',
      choices: [
        String.raw`$\{uv : \#_0(u) = \#_1(v)\}$`,
        String.raw`$\{0^m1^n : m \equiv n \pmod 5\}$`,
        String.raw`$\{w : \#_0(w) = \#_1(w) \text{ and every prefix has } \lvert \#_0 - \#_1 \rvert \le 2\}$`,
        String.raw`$\{0^m1^n : m \ge n\}$`,
        String.raw`$\{w : w \ne w^R\}$`,
      ],
      answer: [0, 1, 2],
      explain: String.raw`(1) As the split point moves right, $\#_0(u) - \#_1(v)$ rises by exactly 1 per step from $-\#_1(w) \le 0$ to $\#_0(w) \ge 0$, so it hits 0: the language is $\Sigma^*$. (2) Counting mod 5 is bounded. (3) A bounded counter (difference in $\{-2..2\}$). (4) needs an unbounded count ($F = 0^*$, $z = 1^j$ for $i < j$). (5) is the complement of the palindromes, which is not regular.`
    },
    {
      type: 'tf',
      q: 'The elements of a fooling set for L must all belong to L.',
      answer: false,
      explain: String.raw`Fooling-set elements are arbitrary strings — usually *prefixes* such as $0^i$, which are typically not in $L$. In fact, choosing elements of $L$ is often a mistake (for $0^n1^n$ they are all equivalent).`
    },
    {
      type: 'tf',
      q: String.raw`To prove every DFA for $L$ needs at least $k$ states, it suffices to exhibit one particular DFA for $L$ in which $k$ given strings reach $k$ different states.`,
      answer: false,
      explain: String.raw`Another DFA for $L$ might send some of those strings to the same state. You must show the strings are pairwise **distinguishable by $L$** (a property of the language, not of a machine); then the fooling-set lemma applies to every DFA.`
    },
    {
      type: 'mc',
      q: String.raw`In the fooling-set proof for $\{0^{n!} : n \ge 0\}$ with $x = 0^{i!}$, $y = 0^{j!}$, $1 \le i < j$ and $z = 0^{i \cdot i!}$, why is $yz \notin L$?`,
      choices: [
        String.raw`Because $j! + i \cdot i!$ is odd`,
        String.raw`Because $j! < j! + i\cdot i! < (j+1)!$, and no factorial lies strictly between $j!$ and $(j+1)!$`,
        String.raw`Because $i \cdot i! = (i+1)!$`,
        String.raw`Because $j!$ is divisible by $i!$`,
      ],
      answer: 1,
      explain: String.raw`$i \cdot i! = (i+1)! - i! < (i+1)! \le j! \le j \cdot j! = (j+1)! - j!$, so $j! + i \cdot i!$ lands strictly between consecutive factorials $j!$ and $(j+1)!$ (strictly above $j!$ since $i \ge 1$). Meanwhile $xz = 0^{i! + i \cdot i!} = 0^{(i+1)!} \in L$.`
    },
    {
      type: 'mc',
      q: String.raw`How many equivalence classes does $\equiv_L$ have for $L = \{0^n1^n : n \ge 0\}$?`,
      choices: ['2', '3', String.raw`$n+1$`, 'Infinitely many'],
      answer: 3,
      explain: String.raw`The strings $0^i$ ($i \ge 0$) are pairwise inequivalent (suffix $1^i$), so there are infinitely many classes — which, by Myhill–Nerode, is exactly why $L$ is not regular.`
    },
    {
      type: 'tf',
      q: String.raw`The fooling-set lemma also gives lower bounds on the number of states of NFAs: a fooling set of size $k$ means every NFA for $L$ has at least $k$ states.`,
      answer: false,
      explain: String.raw`The proof needs a unique state after each prefix. "The $k$-th symbol from the end is 1" has a fooling set of size $2^k$ but an NFA with $k+1$ states.`
    }
  ],
  flashcards: [
    { front: 'Distinguishable strings (w.r.t. L)', back: String.raw`$x$ and $y$ are distinguishable if there is a suffix $z$ such that exactly one of $xz$, $yz$ is in $L$.` },
    { front: 'Fooling set', back: 'A set F of strings such that every pair of distinct strings in F is distinguishable by L.' },
    { front: 'Fooling set lemma', back: String.raw`If $F$ is a fooling set for $L$, every DFA for $L$ has at least $|F|$ states. (Pigeonhole: two strings in the same state can never be distinguished.)` },
    { front: 'How do you prove L is not regular (course-preferred method)?', back: 'Exhibit an infinite fooling set: define F, take arbitrary distinct x, y in F, give a suffix z with xz in L and yz not in L, conclude.' },
    { front: String.raw`Fooling set and suffix for $\{0^n1^n\}$`, back: String.raw`$F = 0^*$; for $x = 0^i$, $y = 0^j$ with $i \ne j$, use $z = 1^i$.` },
    { front: 'Fooling set and suffix for palindromes over {0,1}', back: String.raw`$F = 0^*$; $z = 10^i$. Then $0^i10^i$ is a palindrome but $0^j10^i$ is not.` },
    { front: String.raw`Fooling set for $\{0^{n^2}\}$`, back: String.raw`$F = \{0^{n^2}\}$; for $i < j$ use $z = 0^{2i+1}$: $i^2+2i+1 = (i+1)^2$, while $j^2 < j^2+2i+1 < (j+1)^2$.` },
    { front: 'Closure-property argument for non-regularity', back: String.raw`If $L$ were regular, $L \cap R$ would be regular for every regular $R$. So if $L \cap R$ is a known non-regular language, $L$ is not regular. E.g. $\{\#_0 = \#_1\} \cap 0^*1^* = 0^n1^n$.` },
    { front: 'Invalid closure arguments', back: 'Subset of regular is not necessarily regular; superset of non-regular is not necessarily non-regular; union of two non-regular languages can be regular; L intersect R regular does not imply L regular.' },
    { front: 'Myhill-Nerode theorem', back: String.raw`$L$ is regular iff $\equiv_L$ (indistinguishability) has finitely many classes; the number of classes equals the number of states in the minimal DFA.` },
    { front: 'Min DFA states for "k-th symbol from the end is 1"', back: String.raw`$2^k$, proved by the fooling set $\{0,1\}^k$ with suffix $0^{p-1}$ where $p$ is a position where the two strings differ.` },
    { front: 'Pumping lemma: status in CS 374', back: 'Necessary (not sufficient) condition for regularity; can only show non-regularity; not complete; error-prone quantifiers. Prefer fooling sets.' },
    { front: 'Most common fooling-set mistake', back: 'Choosing a specific pair (like 0 and 00) instead of arbitrary distinct x, y in F; or forgetting to prove both memberships (xz in L AND yz not in L).' },
    { front: String.raw`Fooling set for $\{0^p : p \text{ prime}\}$`, back: String.raw`$F = 0^*$. For $i < j$, $d = j - i$: if no $k$ distinguished them, primality would be $d$-periodic beyond $i$; starting from a prime $p > i$ we get $p + pd = p(1+d)$ prime — contradiction. So some $k$ works.` },
    { front: String.raw`Fooling set for $\{0^{n!}\}$`, back: String.raw`$F = \{0^{n!} : n \ge 1\}$; for $i < j$ use $z = 0^{i \cdot i!}$: $i! + i\cdot i! = (i+1)!$, while $j! < j! + i\cdot i! < (j+1)!$.` },
    { front: String.raw`Fooling set for $\{x\#y : x \text{ substring of } y\}$`, back: String.raw`$F = 0^*$; for $i < j$, $z = \#0^i$: $0^i\#0^i \in L$, $0^j\#0^i \notin L$ ($0^j$ is too long).` },
    { front: String.raw`$\{w : w \ne w^R\}$ is not regular`, back: String.raw`Directly: $F = 0^*$, $z = 10^i$ ($0^i10^i \notin L$, $0^j10^i \in L$). Or: its complement PAL is not regular.` },
    { front: 'Finite fooling set for "contains pattern p"', back: String.raw`The $|p|+1$ prefixes of $p$. For prefixes $p_k, p_m$ ($k < m$), append the rest of $p$ after $p_m$; $p_k$'s extension is too short to contain $p$.` },
    { front: 'Regular look-alikes', back: String.raw`Bounded counters, counts mod $k$, $\#01 = \#10$, $\{wxw^R : w,x \ne \varepsilon\}$ (= same first and last symbol, length $\ge 3$), $\{uv : \#_0(u) = \#_1(v)\} = \Sigma^*$, finite languages.` },
    { front: 'Myhill–Nerode, proof idea', back: String.raw`(⇒) same DFA state implies equivalent, so #classes ≤ #states. (⇐) build a DFA whose states are the classes: $[x] \xrightarrow{a} [xa]$, accept $[x]$ with $x \in L$; well defined because $\equiv_L$ is right-invariant.` },
    { front: String.raw`Fooling set for $\{0^m1^n : \gcd(m,n)=1\}$`, back: String.raw`$F = \{0^p : p \text{ prime}\}$, $z = 1^p$: $\gcd(p,p) = p \ne 1$ but $\gcd(q,p) = 1$ for distinct primes.` },
    { front: 'Fooling-set lemma and NFAs', back: 'The lemma bounds DFA states only. NFAs can be exponentially smaller (k-th symbol from the end: 2^k vs k+1).' },
  ],
  problems: [
    {
      id: 'nonregular-0n1n',
      type: 'written',
      title: String.raw`$0^n1^n$ is not regular`,
      difficulty: 1,
      prompt: String.raw`Prove that $L = \{0^n1^n : n \ge 0\}$ is not regular using a fooling set. Follow the standard template exactly.`,
      rubric: [
        'Specifies an explicit infinite set F',
        'Takes ARBITRARY distinct x, y in F, written with parameters (x = 0^i, y = 0^j, i ≠ j)',
        'Gives an explicit suffix z (may depend on i)',
        'Proves xz ∈ L and yz ∉ L',
        'Concludes F is an infinite fooling set, so L is not regular'
      ],
      hints: [
        'What does a DFA need to remember after reading a block of 0s?',
        String.raw`Try $F = 0^*$. For $x = 0^i$, what suffix completes $x$ to a string in $L$?`
      ],
      solution: String.raw`Let $F = \{0^n : n \ge 0\}$.

Let $x$ and $y$ be arbitrary distinct strings in $F$. Then $x = 0^i$ and $y = 0^j$ for some non-negative integers $i \ne j$.

Let $z = 1^i$. Then $xz = 0^i1^i \in L$. On the other hand $yz = 0^j1^i$ has $j$ zeros followed by $i$ ones with $j \ne i$, so $yz \notin L$.

Thus every pair of distinct strings in $F$ is distinguishable, so $F$ is a fooling set for $L$. Because $F$ is infinite, $L$ cannot be regular. $\blacksquare$`
    },
    {
      id: 'nonregular-equal01',
      type: 'written',
      title: 'Equal numbers of 0s and 1s (directly)',
      difficulty: 1,
      prompt: String.raw`Prove directly with a fooling set (no closure properties) that $L = \{w \in \{0,1\}^* : \#_0(w) = \#_1(w)\}$ is not regular.`,
      rubric: [
        'Explicit infinite F',
        'Arbitrary distinct x = 0^i, y = 0^j with i ≠ j',
        'Suffix z = 1^i (or equivalent)',
        'Correct counting argument for both xz ∈ L and yz ∉ L',
        'Correct conclusion'
      ],
      hints: [String.raw`The same fooling set as for $0^n1^n$ works.`],
      solution: String.raw`Let $F = 0^* = \{0^n : n \ge 0\}$. Let $x, y \in F$ be arbitrary and distinct, so $x = 0^i$, $y = 0^j$ with $i \ne j$. Let $z = 1^i$.

- $xz = 0^i1^i$ contains $i$ zeros and $i$ ones, so $xz \in L$.
- $yz = 0^j1^i$ contains $j$ zeros and $i \ne j$ ones, so $yz \notin L$.

So $F$ is a fooling set for $L$; it is infinite, so $L$ is not regular. $\blacksquare$

(Alternatively: if $L$ were regular then $L \cap 0^*1^* = \{0^n1^n\}$ would be regular, a contradiction.)`
    },
    {
      id: 'nonregular-pal',
      type: 'written',
      title: 'Palindromes are not regular',
      difficulty: 2,
      prompt: String.raw`Let $\mathrm{PAL} = \{w \in \{0,1\}^* : w = w^R\}$. Prove that PAL is not regular.`,
      rubric: [
        'Explicit infinite F (e.g. 0^*)',
        'Arbitrary distinct x = 0^i, y = 0^j',
        'Suffix includes a separator, e.g. z = 1 0^i',
        'Proves xz is a palindrome and yz is not (with justification)',
        'Correct conclusion'
      ],
      hints: [
        String.raw`Suffix $z = 0^i$ does not work: all strings of 0s are palindromes. You need a separator.`,
        String.raw`Try $z = 10^i$ for $x = 0^i$.`
      ],
      solution: String.raw`Let $F = \{0^n : n \ge 0\}$. Let $x = 0^i$ and $y = 0^j$ be arbitrary distinct elements of $F$, so $i \ne j$. Let $z = 10^i$.

- $xz = 0^i10^i$, whose reversal is $0^i10^i$ again; so $xz \in \mathrm{PAL}$.
- $yz = 0^j10^i$, whose reversal is $0^i10^j$. These two strings each contain exactly one 1, at positions $j+1$ and $i+1$ respectively, which differ because $i \ne j$. So $yz \ne (yz)^R$ and $yz \notin \mathrm{PAL}$.

Hence $F$ is an infinite fooling set for PAL, and PAL is not regular. $\blacksquare$`
    },
    {
      id: 'nonregular-parens',
      type: 'written',
      title: 'Balanced parentheses are not regular',
      difficulty: 1,
      prompt: String.raw`Let $\mathrm{BAL}$ be the language of balanced strings of parentheses over $\Sigma = \{(, )\}$ (every prefix has at least as many ( as ), and the totals are equal). Prove BAL is not regular.`,
      rubric: [
        'Explicit infinite F, e.g. strings of open parentheses',
        'Arbitrary distinct x, y with parameters i ≠ j',
        'Suffix z of i close parentheses',
        'Justifies xz balanced and yz not balanced',
        'Correct conclusion'
      ],
      hints: ['Mimic the 0^n 1^n proof with ( playing the role of 0.'],
      solution: String.raw`Let $F = \{(^n : n \ge 0\}$, the strings consisting only of open parentheses. Let $x = (^i$ and $y = (^j$ be arbitrary distinct elements of $F$, so $i \ne j$. Let $z = )^i$.

- $xz = (^i)^i$ is balanced: in every prefix the number of ( is at least the number of ), and both totals are $i$. So $xz \in \mathrm{BAL}$.
- $yz = (^j)^i$ contains $j$ open and $i \ne j$ close parentheses, so the totals are unequal and $yz \notin \mathrm{BAL}$.

So $F$ is an infinite fooling set and BAL is not regular. $\blacksquare$`
    },
    {
      id: 'nonregular-squares',
      type: 'written',
      title: String.raw`Unary perfect squares $\{0^{n^2}\}$`,
      difficulty: 2,
      prompt: String.raw`Prove that $L = \{0^{n^2} : n \ge 0\}$ is not regular.`,
      rubric: [
        'Chooses a good infinite F (e.g. L itself)',
        'Arbitrary distinct pair, with WLOG i < j justified by symmetry',
        'Suffix z = 0^{2i+1} (or another valid suffix)',
        'Shows i^2 + 2i + 1 is a square',
        'Shows j^2 < j^2 + 2i + 1 < (j+1)^2 using i < j, so yz is not in L',
        'Correct conclusion'
      ],
      hints: [
        String.raw`Use $F = L$. From $0^{i^2}$, how many 0s get you to the next perfect square?`,
        String.raw`$(i+1)^2 - i^2 = 2i + 1$. Show that adding $2i+1$ to $j^2$ (with $j > i$) lands strictly between two consecutive squares.`
      ],
      solution: String.raw`Let $F = L = \{0^{n^2} : n \ge 0\}$. Let $x$ and $y$ be arbitrary distinct elements of $F$. Since distinguishability is symmetric, we may assume without loss of generality $x = 0^{i^2}$ and $y = 0^{j^2}$ where $0 \le i < j$. Let $z = 0^{2i+1}$.

- $xz = 0^{i^2+2i+1} = 0^{(i+1)^2} \in L$.
- $yz = 0^{j^2 + 2i + 1}$. Because $i \ge 0$, $j^2 < j^2 + 2i + 1$; because $i < j$, $j^2 + 2i + 1 < j^2 + 2j + 1 = (j+1)^2$. No perfect square lies strictly between $j^2$ and $(j+1)^2$, so $yz \notin L$.

Hence $F$ is a fooling set. It is infinite, so $L$ is not regular. $\blacksquare$`
    },
    {
      id: 'nonregular-ineq',
      type: 'written',
      title: String.raw`$\{0^i1^j : i \ne j\}$`,
      difficulty: 2,
      prompt: String.raw`Prove that $L = \{0^i1^j : i \ne j\}$ is not regular, using a fooling set.`,
      rubric: [
        'Explicit infinite F',
        'Arbitrary distinct x = 0^a, y = 0^b',
        'Suffix z = 1^a (or equivalent)',
        'Correctly shows exactly one of xz, yz is in L (here xz ∉ L and yz ∈ L)',
        'Correct conclusion'
      ],
      hints: [String.raw`Same $F$ and suffix as $0^n1^n$ — but check which of $xz$, $yz$ ends up in $L$ now.`],
      solution: String.raw`Let $F = \{0^n : n \ge 0\}$. Let $x = 0^a$ and $y = 0^b$ be arbitrary distinct elements of $F$, so $a \ne b$. Let $z = 1^a$.

- $xz = 0^a1^a$ has equally many 0s and 1s, so $xz \notin L$.
- $yz = 0^b1^a$ has the form $0^i1^j$ with $i = b \ne a = j$, so $yz \in L$.

Exactly one of $xz, yz$ is in $L$, so $x$ and $y$ are distinguishable. Thus $F$ is an infinite fooling set, and $L$ is not regular. $\blacksquare$

(Closure alternative: $\overline{L} \cap 0^*1^* = \{0^n1^n\}$; if $L$ were regular, so would be $\overline{L}$ and then $\{0^n1^n\}$.)`
    },
    {
      id: 'nonregular-ww',
      type: 'written',
      title: String.raw`Squares $\{ww\}$`,
      difficulty: 3,
      prompt: String.raw`Prove that $L = \{ww : w \in \{0,1\}^*\}$ is not regular.`,
      rubric: [
        'Good infinite F (e.g. {0^i 1 : i ≥ 0})',
        'Arbitrary distinct pair with parameters i ≠ j',
        'Suffix z = 0^i 1',
        'Shows xz = (0^i1)(0^i1) ∈ L',
        'Rigorous argument that 0^j 1 0^i 1 is not a square when i ≠ j',
        'Correct conclusion'
      ],
      hints: [
        String.raw`$F = 0^*$ is tricky here because $0^{i+j}$-type strings may be squares. Add a marker: try $F = \{0^i1 : i \ge 0\}$.`,
        String.raw`If $0^j10^i1 = ww$, then $w$ ends in 1 and contains exactly one 1 (the string has exactly two 1s, one in each half).`
      ],
      solution: String.raw`Let $F = \{0^i1 : i \ge 0\}$. Let $x = 0^i1$ and $y = 0^j1$ be arbitrary distinct elements of $F$, so $i \ne j$. Let $z = 0^i1$.

- $xz = 0^i1\,0^i1 = ww$ for $w = 0^i1$, so $xz \in L$.
- Suppose for contradiction $yz = 0^j10^i1 = ww$ for some $w$. The string $yz$ contains exactly two 1s, and both halves are equal, so each copy of $w$ contains exactly one 1. Since $yz$ ends in 1, $w$ ends in 1; with only one 1, $w = 0^k1$ for some $k$. Then $ww = 0^k10^k1$; comparing with $0^j10^i1$ (the position of the first 1 gives $k = j$, the number of 0s between the 1s gives $k = i$) forces $i = j$, a contradiction. So $yz \notin L$.

Therefore $F$ is an infinite fooling set and $L$ is not regular. $\blacksquare$`
    },
    {
      id: 'nonregular-powers2',
      type: 'written',
      title: String.raw`Unary powers of two $\{0^{2^n}\}$`,
      difficulty: 2,
      prompt: String.raw`Prove that $L = \{0^{2^n} : n \ge 0\}$ is not regular.`,
      rubric: [
        'F = L (or another infinite set) stated explicitly',
        'Arbitrary distinct pair, WLOG i < j',
        'Suffix z = 0^{2^i}',
        'Shows 2^i + 2^i = 2^{i+1} so xz ∈ L',
        'Shows 2^j + 2^i is not a power of 2 when i < j (odd factor argument)',
        'Correct conclusion'
      ],
      hints: [
        String.raw`Use $F = L$ and from $0^{2^i}$ jump to $0^{2^{i+1}}$.`,
        String.raw`Factor $2^j + 2^i = 2^i(2^{j-i} + 1)$.`
      ],
      solution: String.raw`Let $F = L$. Let $x, y$ be arbitrary distinct elements of $F$; by symmetry assume $x = 0^{2^i}$ and $y = 0^{2^j}$ with $0 \le i < j$. Let $z = 0^{2^i}$.

- $xz = 0^{2^i + 2^i} = 0^{2^{i+1}} \in L$.
- $yz = 0^{2^j + 2^i}$, and $2^j + 2^i = 2^i(2^{j-i} + 1)$. Since $j - i \ge 1$, the factor $2^{j-i}+1$ is odd and at least 3, so $2^j + 2^i$ has an odd factor greater than 1 and is not a power of 2. Hence $yz \notin L$.

So $F$ is an infinite fooling set and $L$ is not regular. $\blacksquare$`
    },
    {
      id: 'nonregular-closure',
      type: 'written',
      title: 'Non-regularity via closure properties',
      difficulty: 2,
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : \#_0(w) \ne \#_1(w)\}$.

(a) Prove that $L$ is not regular using closure properties of regular languages, assuming only that $\{0^n1^n : n \ge 0\}$ is known to be non-regular.

(b) A classmate writes: "$L$ contains the non-regular language $\{0^i1^j : i \ne j\}$, so $L$ is not regular." Explain precisely why this argument is invalid.`,
      rubric: [
        '(a) Sets up a proof by contradiction assuming L regular',
        '(a) Uses closure under complement to get {#0 = #1} regular',
        '(a) Intersects with the regular language 0*1* to get 0^n1^n',
        '(a) Derives the contradiction and concludes',
        '(b) Explains that containing a non-regular language says nothing, with a counterexample such as Σ*'
      ],
      hints: [
        String.raw`What is $\overline{L}$?`,
        String.raw`Which regular language $R$ makes $\overline{L} \cap R = \{0^n1^n\}$?`
      ],
      solution: String.raw`**(a)** Suppose for contradiction that $L$ is regular. Regular languages are closed under complement, so $\overline{L} = \{w : \#_0(w) = \#_1(w)\}$ is regular. The language $0^*1^*$ is regular (it is described by a regular expression), and regular languages are closed under intersection, so
$$\overline{L} \cap 0^*1^* = \{0^n1^n : n \ge 0\}$$
is regular. (A string of the form $0^a1^b$ has equally many 0s and 1s exactly when $a = b$.) This contradicts the known fact that $\{0^n1^n\}$ is not regular. Hence $L$ is not regular. $\blacksquare$

**(b)** Containing a non-regular language does not prevent a language from being regular. For example, $\Sigma^*$ contains $\{0^i1^j : i \ne j\}$ (indeed it contains every language over $\Sigma$), yet $\Sigma^*$ is regular. Regularity is not monotone under subset or superset, so the classmate's conclusion does not follow (even though the conclusion happens to be true).`
    },
    {
      id: 'nonregular-third-last',
      type: 'written',
      title: 'An 8-state lower bound',
      difficulty: 2,
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : \text{the third symbol from the end of } w \text{ is } 1\}$ (so $|w| \ge 3$). Prove that every DFA accepting $L$ has at least 8 states, and briefly describe an 8-state DFA, showing that 8 is optimal.`,
      rubric: [
        'Chooses F = {0,1}^3 (8 strings)',
        'For arbitrary distinct x, y uses a position k where they differ',
        'Suffix z = 0^{k-1} with a correct argument that the third-to-last symbols of xz, yz are x_k and y_k',
        'Concludes via the fooling-set lemma (at least 8 states)',
        'Describes a correct 8-state DFA (states = last three symbols)'
      ],
      hints: [
        'Use all 8 strings of length 3.',
        String.raw`If $x$ and $y$ differ at position $k$, append $k-1$ symbols so that position $k$ becomes third from the end.`
      ],
      solution: String.raw`**Lower bound.** Let $F = \{0,1\}^3$, which has 8 elements. Let $x = x_1x_2x_3$ and $y = y_1y_2y_3$ be arbitrary distinct elements of $F$, and let $k \in \{1,2,3\}$ be a position with $x_k \ne y_k$; without loss of generality $x_k = 1$, $y_k = 0$. Let $z = 0^{k-1}$. The strings $xz$ and $yz$ have length $3 + (k-1) = k + 2$, so their third symbol from the end is at position $(k+2) - 2 = k$, which is $x_k = 1$ for $xz$ and $y_k = 0$ for $yz$. Hence $xz \in L$ and $yz \notin L$. So $F$ is a fooling set of size 8, and by the fooling-set lemma every DFA for $L$ has at least 8 states.

**Upper bound.** Use states $Q = \{0,1\}^3$, representing the last three symbols read, where missing symbols (when fewer than three have been read) are treated as 0. Start state $000$; on reading $a$ from state $bcd$, go to $cda$; accept the states $1cd$. A string shorter than 3 has a padded 0 in the first position and is correctly rejected. This DFA has exactly 8 states, so 8 is the minimum.`
    },
    {
      id: 'nonregular-dfa-0110',
      type: 'dfa',
      title: 'A regular look-alike: #01 = #10',
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`At first glance this looks like a counting language, but it is regular. Build a DFA for
$$L = \{w \in \{0,1\}^* : w \text{ contains equally many occurrences of } 01 \text{ and } 10 \text{ as substrings}\}.$$
(Occurrences may overlap; e.g. $010$ has one of each, so $010 \in L$, while $01 \notin L$.)`,
      accepts: function (s) {
        var a = 0, b = 0;
        for (var i = 0; i + 1 < s.length; i++) {
          if (s[i] === '0' && s[i + 1] === '1') a++;
          if (s[i] === '1' && s[i + 1] === '0') b++;
        }
        return a === b;
      },
      sample: String.raw`start: s
accept: s, a0, a1
s 0 -> a0
s 1 -> a1
a0 0 -> a0
a0 1 -> b0
b0 1 -> b0
b0 0 -> a0
a1 1 -> a1
a1 0 -> b1
b1 0 -> b1
b1 1 -> a1`,
      maxLen: 10,
      hints: [
        'Each occurrence of 01 or 10 marks a place where the symbol changes. Changes alternate between 0-to-1 and 1-to-0.',
        'The counts are equal iff the string is empty or its first and last symbols are equal. Remember the first symbol and the current last symbol.'
      ],
      solution: String.raw`Every occurrence of $01$ or $10$ is a "switch" between adjacent symbols, and switches alternate between up ($01$) and down ($10$). So the two counts differ by at most one, and they are equal exactly when the number of switches is even — i.e. when $w = \varepsilon$ or the first and last symbols of $w$ are equal.

The DFA remembers the first symbol and whether the current last symbol equals it: state $s$ (empty), $a_c$ (first symbol $c$, last symbol $c$: accept), $b_c$ (first symbol $c$, last symbol different: reject).

~~~automaton
alphabet: 01
start: s
accept: s, a0, a1
s 0 -> a0
s 1 -> a1
a0 0 -> a0
a0 1 -> b0
b0 1 -> b0
b0 0 -> a0
a1 1 -> a1
a1 0 -> b1
b1 0 -> b1
b1 1 -> a1
~~~

This is a good reminder that "the definition mentions counting" does not imply non-regularity: here no fooling set larger than 5 exists.`
    },
    {
      id: 'nonregular-dfa-parity',
      type: 'dfa',
      title: String.raw`A regular look-alike: $0^i1^j$ with $i \equiv j \pmod 2$`,
      difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Unlike $\{0^n1^n\}$, the following language is regular. Build a DFA for
$$L = \{0^i1^j : i, j \ge 0 \text{ and } i \equiv j \pmod 2\}.$$`,
      accepts: function (s) { return /^0*1*$/.test(s) && s.length % 2 === 0; },
      sample: String.raw`start: e0
accept: e0, e1
e0 0 -> o0
o0 0 -> e0
e0 1 -> o1
o0 1 -> e1
e1 1 -> o1
o1 1 -> e1`,
      maxLen: 10,
      hints: [
        String.raw`$i \equiv j \pmod 2$ iff $i + j$ is even.`,
        'Track the parity of the length so far and whether you have started reading 1s. A 0 after a 1 is fatal.'
      ],
      solution: String.raw`$i \equiv j \pmod 2$ exactly when $i + j = |w|$ is even, so $L$ is the set of even-length strings in $0^*1^*$. States record (parity of length, phase): $e0, o0$ while reading 0s, $e1, o1$ while reading 1s; reading 0 in phase 1 goes to the (implicit) dead state.

~~~automaton
alphabet: 01
start: e0
accept: e0, e1
e0 0 -> o0
o0 0 -> e0
e0 1 -> o1
o0 1 -> e1
e1 1 -> o1
o1 1 -> e1
~~~

Only parity — a bounded amount of information — is needed, so finitely many states suffice. Compare $\{0^n1^n\}$, where the exact count must be remembered.`
    },
    {
      id: 'nonregular-factorial',
      type: 'written',
      title: String.raw`Unary factorials $\{0^{n!}\}$`,
      difficulty: 3,
      prompt: String.raw`Prove that $L = \{0^{n!} : n \ge 0\}$ is not regular.`,
      rubric: [
        'Explicit infinite F, e.g. {0^{n!} : n ≥ 1} (noting 0! = 1! so n ≥ 1 gives distinct strings)',
        'Arbitrary distinct pair, WLOG 1 ≤ i < j, justified by symmetry',
        'Suffix z = 0^{i·i!} and xz = 0^{(i+1)!} ∈ L',
        'Inequalities j! < j! + i·i! < (j+1)! with justification (uses i ≥ 1 and i+1 ≤ j)',
        'Concludes yz ∉ L because no factorial lies strictly between consecutive factorials; F infinite',
      ],
      hints: [String.raw`Use the language itself as $F$, and jump from $i!$ to the next factorial $(i+1)!$.`, String.raw`$(i+1)! - i! = i \cdot i!$. Show that adding $i \cdot i!$ to $j!$ (for $j > i$) cannot reach $(j+1)!$.`],
      solution: String.raw`Let $F = \{0^{n!} : n \ge 1\}$. (Since $0! = 1! = 1$, indexing from $n \ge 1$ makes distinct indices give distinct strings; $F$ is infinite because $n!$ is strictly increasing for $n \ge 1$.)

Let $x, y$ be arbitrary distinct elements of $F$. By symmetry of distinguishability, assume $x = 0^{i!}$ and $y = 0^{j!}$ with $1 \le i < j$. Let $z = 0^{i \cdot i!}$.

- $xz = 0^{i! + i \cdot i!} = 0^{(i+1) \cdot i!} = 0^{(i+1)!} \in L$.
- $yz = 0^{j! + i\cdot i!}$. Lower bound: $i \cdot i! \ge 1$, so $j! + i \cdot i! > j!$. Upper bound: $i \cdot i! < (i+1)! \le j!$ because $i + 1 \le j$, and $j! \le j \cdot j! = (j+1)! - j!$ because $j \ge 1$; hence $j! + i \cdot i! < j! + j! \le (j+1)!$. Since the factorials $1!, 2!, 3!, \ldots$ are strictly increasing and $j! + i\cdot i!$ lies strictly between the consecutive values $j!$ and $(j+1)!$, it is not a factorial. (It is also not $0! = 1$, being at least 3.) So $yz \notin L$.

Thus $F$ is an infinite fooling set and $L$ is not regular. $\blacksquare$`
    },
    {
      id: 'nonregular-divides',
      type: 'written',
      title: String.raw`$0^i1^j$ with $j$ a multiple of $i$`,
      difficulty: 2,
      prompt: String.raw`Prove that $L = \{0^i1^j : i \ge 1,\ j \ge 0, \text{ and } j \text{ is a multiple of } i\}$ is not regular.`,
      rubric: [
        'Explicit infinite F = {0^i : i ≥ 1}',
        'Arbitrary distinct pair with WLOG i < j justified',
        'Suffix z = 1^i',
        'xz ∈ L since i | i; yz ∉ L since 0 < i < j implies j ∤ i',
        'Correct conclusion',
      ],
      hints: [String.raw`Which number of 1s is certainly a multiple of $i$ but not of any larger $j$?`],
      solution: String.raw`Let $F = \{0^i : i \ge 1\}$. Let $x, y$ be arbitrary distinct elements; by symmetry assume $x = 0^i$, $y = 0^j$ with $1 \le i < j$. Let $z = 1^i$.

- $xz = 0^i1^i$, and $i$ is a multiple of $i$, so $xz \in L$.
- $yz = 0^j1^i$. A positive multiple of $j$ is at least $j > i$, and $i \ne 0$, so $i$ is not a multiple of $j$. Hence $yz \notin L$.

$F$ is an infinite fooling set, so $L$ is not regular. $\blacksquare$

(Pitfall: $z = 1^j$ does not work for all pairs — for $i = 2$, $j = 4$ both $0^21^4$ and $0^41^4$ are in $L$.)`
    },
    {
      id: 'nonregular-more0s',
      type: 'written',
      title: 'More 0s than 1s',
      difficulty: 2,
      prompt: String.raw`Prove that $L = \{w \in \{0,1\}^* : \#_0(w) > \#_1(w)\}$ is not regular, using a fooling set. Then give a one-line alternative proof via closure properties, assuming $\{0^n1^n\}$ is known to be non-regular.`,
      rubric: [
        'F = 0^* with arbitrary distinct pair, WLOG i < j',
        'Suffix z = 1^i, with xz ∉ L (equal counts) and yz ∈ L (j > i)',
        'Conclusion from the infinite fooling set',
        'Closure alternative, e.g. complement ∩ reversed-swapped copy, or another valid chain',
      ],
      hints: [String.raw`Same $F$ as for $0^n1^n$. Be careful: the suffix should be built from the **smaller** index.`, String.raw`For closure: $\overline{L} = \{\#_0 \le \#_1\}$. Swapping symbols turns it into $\{\#_0 \ge \#_1\}$.`],
      solution: String.raw`**Fooling set.** Let $F = 0^*$. Let $x, y \in F$ be arbitrary and distinct; by symmetry, $x = 0^i$ and $y = 0^j$ with $i < j$. Let $z = 1^i$.
- $xz = 0^i1^i$ has equally many 0s and 1s, so $xz \notin L$.
- $yz = 0^j1^i$ has $j > i$, so $yz \in L$.

Exactly one is in $L$, so $F$ is an infinite fooling set and $L$ is not regular. $\blacksquare$

**Closure.** If $L$ were regular, then $\overline{L} = \{w : \#_0(w) \le \#_1(w)\}$ and its image under $h(0) = 1, h(1) = 0$, namely $\{w : \#_1(w) \le \#_0(w)\}$, would be regular, and so would their intersection $\{w : \#_0(w) = \#_1(w)\}$, and then its intersection with $0^*1^*$, which is $\{0^n1^n\}$ — contradiction.`
    },
    {
      id: 'nonregular-notpal',
      type: 'written',
      title: String.raw`Non-palindromes $\{w : w \neq w^R\}$`,
      difficulty: 2,
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : w \ne w^R\}$. (a) Prove directly with a fooling set that $L$ is not regular. (b) Give a second proof using closure properties, assuming PAL $= \{w : w = w^R\}$ is not regular. (c) Is $L$ regular over the one-letter alphabet $\{0\}$?`,
      rubric: [
        '(a) F = 0^*, arbitrary i ≠ j, suffix z = 10^i',
        '(a) xz = 0^i10^i is a palindrome so ∉ L; yz = 0^j10^i is not a palindrome so ∈ L (position of the 1)',
        '(b) L is the complement of PAL; closure under complement',
        '(c) Over {0} every string is a palindrome, so L = ∅, regular',
      ],
      hints: [String.raw`Reuse the palindrome fooling set — the roles of "in" and "out" flip.`],
      solution: String.raw`**(a)** Let $F = 0^*$; let $x = 0^i$, $y = 0^j$ be arbitrary with $i \ne j$; let $z = 10^i$.
- $xz = 0^i10^i$ equals its reversal, so $xz \notin L$.
- $yz = 0^j10^i$ has its only 1 at position $j + 1$, while $(yz)^R = 0^i10^j$ has it at position $i + 1 \ne j + 1$. So $yz \ne (yz)^R$ and $yz \in L$.

$F$ is an infinite fooling set; $L$ is not regular. $\blacksquare$

**(b)** $L = \overline{\text{PAL}}$. If $L$ were regular, then $\overline{L} = \text{PAL}$ would be regular by closure under complement — contradiction.

**(c)** Over $\{0\}$, every string is a palindrome, so $L = \varnothing$, which is regular. The separator symbol 1 is essential to the proof in (a).`
    },
    {
      id: 'nonregular-substring',
      type: 'written',
      title: String.raw`$x\#y$ where $x$ is a substring of $y$`,
      difficulty: 2,
      prompt: String.raw`Over $\Sigma = \{0, 1, \#\}$, let $L = \{x\#y : x, y \in \{0,1\}^* \text{ and } x \text{ is a substring of } y\}$. Prove that $L$ is not regular.`,
      rubric: [
        'Explicit infinite F (e.g. 0^*), arbitrary distinct pair with WLOG i < j',
        'Suffix begins with the separator: z = #0^i',
        'xz = 0^i#0^i ∈ L (every string is a substring of itself)',
        'yz = 0^j#0^i ∉ L because a substring cannot be longer than the string',
        'Correct conclusion',
      ],
      hints: [String.raw`Before the $\#$, the DFA must remember $x$. Use $F = 0^*$.`, String.raw`Put the separator first in the suffix, followed by something only the shorter string fits into.`],
      solution: String.raw`Let $F = 0^* = \{0^n : n \ge 0\}$. Let $x, y \in F$ be arbitrary and distinct; by symmetry, $x = 0^i$ and $y = 0^j$ with $i < j$. Let $z = \#0^i$.

- $xz = 0^i\#0^i$: $0^i$ is a substring of itself, so $xz \in L$.
- $yz = 0^j\#0^i$: the part before $\#$ has length $j > i$, longer than the part after, so it cannot be a substring of it. (Also, $yz$ has exactly one $\#$, so this is the only way to parse it.) Hence $yz \notin L$.

$F$ is an infinite fooling set and $L$ is not regular. $\blacksquare$

(Compare: $\{x\#y : y \text{ is a substring of } x\}$ and $\{x\#y : |x| = |y|\}$ are non-regular by similar arguments, while $\{x\#y : x \text{ and } y \text{ have the same last symbol}\}$ is regular.)`
    },
    {
      id: 'nonregular-two-brackets',
      type: 'written',
      title: 'Balanced strings with two bracket types',
      difficulty: 3,
      prompt: String.raw`Let $L$ be the balanced strings over $\Sigma = \{(, ), [, ]\}$: every closing bracket matches the most recent unmatched opening bracket of the **same type**, and no opening bracket is left unmatched (e.g. $([])[]$ is in $L$, $([)]$ and $(()$ are not).

(a) Prove that $L$ is not regular.

(b) Prove the stronger statement that $F' = \{(, [\}^*$ — **all** strings of opening brackets — is a fooling set for $L$. (Hint: for $u \ne v$ of equal length, look at the **last** position where they differ.)`,
      rubric: [
        '(a) Valid infinite fooling set, e.g. (^n with suffix )^i, both memberships justified',
        '(b) Defines the closing suffix c(u) (mirror of u: reverse order, each opener replaced by its closer) with uc(u) ∈ L',
        '(b) Case |u| ≠ |v|: v c(u) has unequal numbers of openers and closers',
        '(b) Case |u| = |v|: the last differing position m causes a type mismatch when c(u) reaches it',
        'Concludes F\' is an infinite fooling set',
      ],
      hints: [String.raw`(a) is the same as for one bracket type.`, String.raw`(b) For $u = u_1 \cdots u_n$ let $c(u)$ close $u_n, u_{n-1}, \ldots, u_1$ in that order. In $v\,c(u)$, the closers first pop the positions where $u$ and $v$ agree at the end...`],
      solution: String.raw`**(a)** Let $F = \{(^n : n \ge 0\}$. For arbitrary $x = (^i$, $y = (^j$ with $i \neq j$, let $z = )^i$. Then $xz = (^i)^i \in L$ (each $)$ matches the most recent unmatched $($), but $yz = (^j)^i$ has $j \ne i$ openers and $i$ closers, so some bracket is unmatched: $yz \notin L$. $F$ is infinite, so $L$ is not regular.

**(b)** For $u = u_1\cdots u_n \in \{(, [\}^*$ let $c(u) = \overline{u_n}\,\overline{u_{n-1}} \cdots \overline{u_1}$ where $\overline{(} = )$ and $\overline{[} = ]$. Reading $u\,c(u)$, the $k$-th closer matches $u_{n-k+1}$, so $u\,c(u) \in L$.

Let $u \ne v$ be arbitrary elements of $F'$, and let $z = c(u)$; we show $vz \notin L$.
- If $|v| \ne |u|$, then $vz$ has $|v|$ openers and $|u|$ closers; a balanced string has equally many, so $vz \notin L$.
- If $|v| = |u| = n$, let $m$ be the **largest** index with $u_m \ne v_m$. While reading $z$, the first $n - m$ closers are $\overline{u_n}, \ldots, \overline{u_{m+1}}$ and they successively match $v_n, \ldots, v_{m+1}$, which equal $u_n, \ldots, u_{m+1}$. The next closer is $\overline{u_m}$, and the most recent unmatched opener is $v_m \neq u_m$ — a type mismatch. So $vz \notin L$.

Hence every two distinct strings of $F'$ are distinguishable; $F'$ is an infinite fooling set. $\blacksquare$ (Part (b) also shows that the strings of openers of length $\le k$ — there are $2^{k+1} - 1$ of them — must reach different states of any DFA for "balanced with nesting depth at most $k$", a finite but exponential lower bound.)`
    },
    {
      id: 'nonregular-primes',
      type: 'written',
      title: String.raw`Unary primes $\{0^p : p \text{ prime}\}$`,
      difficulty: 3,
      prompt: String.raw`Prove that $L = \{0^p : p \text{ is prime}\}$ is not regular. (You may use that there are infinitely many primes.) Your distinguishing suffix may be given by an existence argument rather than an explicit formula.`,
      rubric: [
        'F = 0^* (or another infinite set), arbitrary 0 ≤ i < j',
        'Sets up the contradiction: if no 0^k distinguishes, then m prime ⇔ m + d prime for all m ≥ i, where d = j − i',
        'Picks a prime p ≥ i (exists since there are infinitely many primes) and iterates to get p + pd = p(1 + d) prime',
        'Notes p(1 + d) is composite (p ≥ 2, 1 + d ≥ 2), contradiction; hence some suffix distinguishes',
        'Concludes F is an infinite fooling set',
      ],
      hints: [String.raw`Fix $i < j$ and $d = j - i$. Suppose every $z = 0^k$ fails, i.e. $i + k$ is prime iff $j + k$ is prime. What does that say about the primes beyond $i$?`, String.raw`Start at a prime $p \ge i$ and keep adding $d$. Which term is obviously composite?`],
      solution: String.raw`Let $F = 0^*$. Let $x, y$ be arbitrary distinct elements; by symmetry $x = 0^i$, $y = 0^j$ with $0 \le i < j$. Let $d = j - i \ge 1$.

**Claim:** some $k \ge 0$ has exactly one of $i + k$, $j + k$ prime; then $z = 0^k$ distinguishes $x$ and $y$.

Suppose not: for every $k \ge 0$, $i + k$ is prime iff $i + k + d$ is prime. Equivalently, for every $m \ge i$: $m$ prime $\iff$ $m + d$ prime. Since there are infinitely many primes, choose a prime $p \ge i$. Applying the equivalence to $m = p, p + d, p + 2d, \ldots$ (all $\ge i$), by induction $p + td$ is prime for every $t \ge 0$. Take $t = p$: $p + pd = p(1 + d)$ is prime. But $p \ge 2$ and $1 + d \ge 2$, so $p(1+d)$ is composite. Contradiction.

So every pair of distinct strings in $F$ is distinguishable, $F$ is an infinite fooling set, and $L$ is not regular. $\blacksquare$

(By closure under complement, $\{0^n : n \text{ is not prime}\}$ is not regular either.)`
    },
    {
      id: 'nonregular-closure-mix',
      type: 'written',
      title: 'Non-regularity via closure: three exercises',
      difficulty: 2,
      prompt: String.raw`Assume $\{0^n1^n : n \ge 0\}$ is not regular. Use closure properties (no fooling sets) for (a) and (b).

(a) $L_a = \{a^nb^nc^m : n, m \ge 0\}$ over $\{a, b, c\}$ is not regular.

(b) $L_b = \{w \in \{0,1\}^* : w \text{ has equally many occurrences of } 00 \text{ and of } 11\}$ (overlapping occurrences count, e.g. $000$ has two occurrences of $00$) is not regular. Contrast this with the regular language "equally many occurrences of 01 and 10".

(c) What is wrong with: "$L_b$ contains $\{0^n1^n : n \ge 1\}$, which is not regular, so $L_b$ is not regular"?`,
      rubric: [
        '(a) L_a ∩ a*b* = {a^nb^n}; rename with a homomorphism (a→0, b→1) to get 0^n1^n; contradiction',
        '(b) L_b ∩ 0^+1^+ = {0^n1^n : n ≥ 1}, with the count (#00 = a−1, #11 = b−1 in 0^a1^b)',
        '(b) Notes that adding the single string ε gives 0^n1^n (finite changes preserve regularity)',
        '(c) Containing a non-regular language proves nothing (Σ* contains everything)',
      ],
      hints: [String.raw`(a) Intersect with $a^*b^*$, then rename symbols.`, String.raw`(b) In $0^a1^b$ with $a, b \ge 1$, count the $00$s and $11$s.`],
      solution: String.raw`**(a)** Suppose $L_a$ is regular. Then $L_a \cap L(a^*b^*) = \{a^nb^n : n \ge 0\}$ is regular (take $m = 0$). Applying the homomorphism $h(a) = 0$, $h(b) = 1$, $h(c) = \varepsilon$ gives $\{0^n1^n\}$, which would be regular — contradiction.

**(b)** Suppose $L_b$ is regular. $0^+1^+ = L(00^*11^*)$ is regular, so $L_b \cap 0^+1^+$ is regular. For $a, b \ge 1$, the string $0^a1^b$ contains exactly $a - 1$ occurrences of $00$ and $b - 1$ of $11$ (no occurrence straddles the boundary, which reads $01$). So the intersection is $\{0^n1^n : n \ge 1\}$. Adding the single string $\varepsilon$ (union with the finite language $\{\varepsilon\}$) would give $\{0^n1^n : n \ge 0\}$ regular — contradiction.

Contrast: occurrences of $01$ and $10$ alternate, so their counts never differ by more than 1 and a 5-state DFA suffices. Occurrences of $00$ and $11$ are independent of each other and can drift apart without bound.

**(c)** Supersets of non-regular languages can be regular; e.g. $\Sigma^* \supseteq \{0^n1^n : n \ge 1\}$. Regularity is not monotone, so the argument is invalid even though its conclusion is true. The intersection in (b) is the valid way to "extract" the non-regular part.`
    },
    {
      id: 'nonregular-lb-mod5',
      type: 'written',
      title: 'Lower bound: binary multiples of 5',
      difficulty: 2,
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : \text{the binary value of } w \text{ is divisible by } 5\}$, reading $w$ most significant bit first, with $\text{val}(\varepsilon) = 0$. Prove that every DFA for $L$ has at least 5 states, and give a 5-state DFA.`,
      rubric: [
        'Fooling set of 5 strings with distinct values mod 5, e.g. ε, 1, 10, 11, 100',
        'Uses val(xz) = 2^{|z|}·val(x) + val(z)',
        'For residues a ≠ b chooses z (e.g. 3 bits) with 8a + val(z) ≡ 0 and argues 8b + val(z) ≢ 0 (8 invertible mod 5)',
        'Concludes ≥ 5 states via the fooling-set lemma',
        'Correct 5-state DFA r → (2r + b) mod 5',
      ],
      hints: [String.raw`$\text{val}(xz) = 2^{|z|}\text{val}(x) + \text{val}(z)$.`, String.raw`With $|z| = 3$, $\text{val}(z)$ ranges over $0..7$, which covers every residue mod 5.`],
      solution: String.raw`**Lower bound.** Let $F = \{\varepsilon, 1, 10, 11, 100\}$, with values $0, 1, 2, 3, 4$. Let $x \ne y$ be arbitrary elements of $F$, with values $a \ne b$ in $\{0, \ldots, 4\}$. Choose a 3-bit string $z$ with $\text{val}(z) \equiv -8a \pmod 5$ (possible because $\text{val}(z)$ takes every value $0, \ldots, 7$, covering all residues). Then
- $\text{val}(xz) = 8a + \text{val}(z) \equiv 0 \pmod 5$, so $xz \in L$;
- $\text{val}(yz) = 8b + \text{val}(z) \equiv 8(b - a) \pmod 5$. Since $8 \equiv 3$ is invertible mod 5 and $b - a \not\equiv 0$, this is nonzero, so $yz \notin L$.

So $F$ is a fooling set of size 5, and every DFA for $L$ has at least 5 states.

**Upper bound.** States $r \in \{0, 1, 2, 3, 4\}$ = value so far mod 5; start and accept $0$; $\delta(r, b) = (2r + b) \bmod 5$. Correct because appending bit $b$ maps value $v$ to $2v + b$. Exactly 5 states, so 5 is optimal. (The same argument gives exactly $k$ states for any odd $k$, where 2 is invertible mod $k$.)`
    },
    {
      id: 'nonregular-lb-allsymbols',
      type: 'written',
      title: 'Lower bound: every symbol appears',
      difficulty: 2,
      prompt: String.raw`Let $L$ be the strings over $\{a, b, c\}$ that contain each of $a$, $b$, $c$ at least once. Prove that every DFA for $L$ has at least 8 states, and describe an 8-state DFA.`,
      rubric: [
        'Fooling set: one string per subset of {a,b,c}, e.g. ε, a, b, c, ab, ac, bc, abc',
        'For distinct sets S ≠ T, WLOG a symbol σ ∈ S \\ T exists',
        'Suffix z = the symbols not in S; xz contains all symbols, yz misses σ',
        'Correct 8-state DFA (states = set of symbols seen; accept {a,b,c})',
      ],
      hints: [String.raw`A DFA must remember which symbols it has seen.`, String.raw`For strings with symbol sets $S \neq T$, append exactly the symbols missing from $S$.`],
      solution: String.raw`**Lower bound.** Let $F = \{\varepsilon, a, b, c, ab, ac, bc, abc\}$; the element $x_S$ has symbol set exactly $S$, one for each $S \subseteq \{a,b,c\}$. Let $x_S \ne x_T$ be arbitrary, so $S \neq T$; by symmetry assume some $\sigma \in S \setminus T$. Let $z$ list the symbols of $\{a,b,c\} \setminus S$ (in any order).
- $x_Sz$ contains every symbol of $S$ and of its complement: $x_Sz \in L$.
- $x_Tz$ has symbol set $T \cup (\{a,b,c\} \setminus S)$, which misses $\sigma$ (not in $T$, and in $S$): $x_Tz \notin L$.

So $F$ is a fooling set of size 8: at least 8 states.

**Upper bound.** States = subsets $S$ of $\{a, b, c\}$ ("symbols seen so far"); start $\varnothing$; $\delta(S, x) = S \cup \{x\}$; accept only $\{a, b, c\}$. 8 states. (Compare the NFA topic: the complement "some symbol is missing" has a 4-state NFA. NFAs cannot complement cheaply.)`
    },
    {
      id: 'nonregular-reg-wxwr',
      type: 'regex',
      title: 'Regular or not? {w x w^R}',
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = \{wxw^R : w, x \in \{0,1\}^+\}$ (both $w$ and $x$ **nonempty**). It looks like a palindrome language, but it is regular. Find a regular expression for it.`,
      accepts: s => { for (let k = 1; 2 * k + 1 <= s.length; k++) { const w = s.slice(0, k); if (s.endsWith(w.split('').reverse().join(''))) return true; } return false; },
      sample: String.raw`0ΣΣ*0 + 1ΣΣ*1`,
      hints: [String.raw`If $w$ works, does its first symbol alone also work (with a longer $x$)?`, String.raw`What must be true of the first and last symbols, and of the length?`],
      solution: String.raw`If $s = wxw^R$ with $w = a w'$, then $s = a\,(w'xw'^R)\,a$: it starts and ends with the same symbol and has length at least 3. Conversely, if $s = a u a$ with $|u| \ge 1$, take $w = a$ and $x = u$. So

<code>0ΣΣ*0 + 1ΣΣ*1</code>.

Lesson: when the "hard" part ($w$) can be shrunk to something bounded without loss, the language is regular. If $x$ were allowed to be empty, the same trick ($w = a$) shows the language is "length at least 2, first symbol = last symbol" — still regular. The genuinely non-regular cousin is $\{ww^R\}$, where $x$ is **forbidden**, so $w$ cannot be shrunk.`
    },
    {
      id: 'nonregular-reg-split',
      type: 'regex',
      title: 'Regular or not? A split with matching counts',
      difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Let $L = \{uv : u, v \in \{0,1\}^* \text{ and } \#_0(u) = \#_1(v) + 1\}$. Decide what $L$ is and give a regular expression for it.`,
      accepts: s => { for (let i = 0; i <= s.length; i++) { const u = s.slice(0, i), v = s.slice(i); if (u.split('0').length - 1 === v.split('1').length) return true; } return false; },
      sample: String.raw`Σ*0Σ*`,
      hints: [String.raw`For a fixed $w$ of length $n$, let $f(k) = \#_0(\text{first } k \text{ symbols}) - \#_1(\text{last } n - k \text{ symbols})$. How does $f$ change when $k$ increases by 1?`, String.raw`$f(0) = -\#_1(w)$ and $f(n) = \#_0(w)$, and each step increases $f$ by exactly 1.`],
      solution: String.raw`Fix $w$ with $|w| = n$, and let $f(k) = \#_0(w_1\cdots w_k) - \#_1(w_{k+1}\cdots w_n)$. Moving the split one step right moves $w_{k+1}$ from $v$ to $u$: if it is a 0, the first count grows by 1; if it is a 1, the second count shrinks by 1. Either way $f(k+1) = f(k) + 1$. So $f$ takes **every** integer value from $f(0) = -\#_1(w) \le 0$ to $f(n) = \#_0(w)$.

$w \in L$ iff $f(k) = 1$ for some $k$, iff $\#_0(w) \ge 1$ (since $f(0) \le 0 < 1$). Hence $L$ = strings containing a 0:

<code>Σ*0Σ*</code>.

(With "$= \#_1(v)$" instead of "$+1$", the same argument gives $L = \Sigma^*$.) The definition mentions counting, but the existential choice of split absorbs it.`
    },
    {
      id: 'nonregular-reg-product',
      type: 'dfa',
      title: String.raw`Regular or not? $0^i1^j$ with $i \cdot j$ even`,
      difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Let $L = \{0^i1^j : i, j \ge 0 \text{ and } i \cdot j \text{ is even}\}$. Is it regular? If so, build a DFA.`,
      accepts: s => { if (!/^0*1*$/.test(s)) return false; const i = s.split('0').length - 1, j = s.length - i; return (i * j) % 2 === 0; },
      sample: String.raw`start: e0
accept: e0, o0, E, q
e0 0 -> o0
o0 0 -> e0
e0 1 -> E
E 1 -> E
o0 1 -> p
p 1 -> q
q 1 -> p`,
      hints: [String.raw`$i \cdot j$ is even iff $i$ is even or $j$ is even.`, String.raw`Track the parity of $i$; if $i$ is odd, track the parity of $j$.`],
      solution: String.raw`$i \cdot j$ is even iff $i$ is even or $j$ is even — only parities matter, so $L$ is regular.

States: $e_0, o_0$ (reading 0s; $i$ even/odd); $E$ (reading 1s after an even number of 0s — always accept); $p, q$ (reading 1s after an odd number of 0s; $j$ odd/even). Accept $e_0, o_0$ ($j = 0$), $E$, and $q$. A 0 after a 1 goes to the implicit dead state.

~~~automaton
alphabet: 01
start: e0
accept: e0, o0, E, q
e0 0 -> o0
o0 0 -> e0
e0 1 -> E
E 1 -> E
o0 1 -> p
p 1 -> q
q 1 -> p
~~~`
    },
    {
      id: 'nonregular-reg-01ge10',
      type: 'dfa',
      title: 'Regular or not? At least as many 01s as 10s',
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : w \text{ has at least as many occurrences of } 01 \text{ as of } 10\}$. Is it regular? If so, build a DFA.`,
      accepts: s => { let a = 0, b = 0; for (let i = 0; i + 1 < s.length; i++) { if (s[i] === '0' && s[i + 1] === '1') a++; if (s[i] === '1' && s[i + 1] === '0') b++; } return a >= b; },
      sample: String.raw`start: s
accept: s, z, b1
s 0 -> z
s 1 -> b1
z 0,1 -> z
b1 1 -> b1
b1 0 -> b0
b0 0 -> b0
b0 1 -> b1`,
      hints: [String.raw`Occurrences of $01$ and $10$ alternate along the string.`, String.raw`$\#01 - \#10$ is $0$ if the first and last symbols are equal, $+1$ if $w$ starts with 0 and ends with 1, $-1$ if it starts with 1 and ends with 0.`],
      solution: String.raw`The symbol changes in $w$ alternate between up ($01$) and down ($10$). So $\#01(w) - \#10(w) \in \{-1, 0, 1\}$, and it equals $-1$ exactly when $w$ starts with 1 and ends with 0. Hence $L$ = all strings except those that start with 1 and end with 0 — regular.

DFA: $s$ (empty, accept); $z$ (starts with 0: always accept, absorbing); $b_1$ / $b_0$ (starts with 1, last symbol 1 / 0; accept $b_1$ only).

~~~automaton
alphabet: 01
start: s
accept: s, z, b1
s 0 -> z
s 1 -> b1
z 0,1 -> z
b1 1 -> b1
b1 0 -> b0
b0 0 -> b0
b0 1 -> b1
~~~`
    }
  ]
});
