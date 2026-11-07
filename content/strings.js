CS374.topic({
  id: 'strings',
  unit: 'models',
  order: 1,
  title: 'Strings, Languages & Induction',
  summary: 'The vocabulary of the whole course: strings, languages, and the operations on them, plus the inductive definitions and induction proofs that CS 374 uses to reason about strings.',
  objectives: [
    'Use the formal (inductive) definitions of strings, length, concatenation and reversal',
    'Compute unions, concatenations, Kleene stars and complements of languages',
    'Write a clean induction proof about strings using the course template',
    'Prove properties of inductively defined languages by structural induction',
    'Avoid common confusions: empty string vs empty language, Kleene star of a set vs a string',
  ],

  lesson: String.raw`## Why start with strings?

Everything in the first half of CS 374 is about **languages**: sets of strings. A DFA, an NFA, a regular expression, a context-free grammar and a Turing machine are all just *finite descriptions of (possibly infinite) sets of strings*. Before we can ask "which languages can a DFA recognize?", we need a precise vocabulary for strings and languages and a reliable way to prove things about them. That reliable way is **induction**, and in this course it is used constantly, so it is worth getting the template into muscle memory now.

This lesson has three layers. First, the definitions: strings, the functions on them, languages and the operations on languages. Second, the proof technique: induction on strings and structural induction on recursively defined languages, with complete proofs of the standard facts. Third, the exam layer: the recurring problem types, a recipe for each, and the places where points are usually lost.

## Alphabets and strings

> **Definition.** An **alphabet** $\Sigma$ is a finite, non-empty set of **symbols** (e.g. $\Sigma = \{0,1\}$ or $\Sigma = \{a,b,c\}$). A **string** over $\Sigma$ is a finite sequence of symbols from $\Sigma$. The set of *all* strings over $\Sigma$ is written $\Sigma^*$.

The **empty string** has no symbols at all and is written $\varepsilon$. It is a perfectly good string: $\varepsilon \in \Sigma^*$ for every alphabet. Strings are always *finite*, even though $\Sigma^*$ is an infinite set.

The course (following Erickson) actually *defines* strings inductively, because an inductive definition hands us an induction principle for free:

> **Definition.** A string over $\Sigma$ is either
> - the empty string $\varepsilon$, or
> - $a \cdot x$, where $a \in \Sigma$ is a symbol and $x$ is a string.

So $0110$ is shorthand for $0 \cdot (1 \cdot (1 \cdot (0 \cdot \varepsilon)))$. Every non-empty string has a well-defined *first symbol* $a$ and *tail* $x$, and that decomposition is unique. Uniqueness is what makes recursive definitions well defined: when we say "$f(a \cdot x) = \ldots$", there is exactly one way to match a non-empty string against the pattern $a \cdot x$.

### Length

Length is defined by recursion that follows the shape of the definition:

$$|\varepsilon| = 0, \qquad |a \cdot x| = 1 + |x|.$$

### Counting a symbol

We write $\#(a, w)$ (or $\#_a(w)$) for the number of occurrences of symbol $a$ in $w$; for instance $\#(1, 0110) = 2$. Recursively, for a fixed symbol $a$:

$$\#(a, \varepsilon) = 0, \qquad \#(a, b \cdot x) = \begin{cases} 1 + \#(a, x) & \text{if } b = a \\ \#(a, x) & \text{if } b \ne a. \end{cases}$$

### Concatenation

The concatenation $w \bullet z$ (usually written just $wz$) is defined by recursion on the *first* argument:

$$\varepsilon \bullet z = z, \qquad (a \cdot x) \bullet z = a \cdot (x \bullet z).$$

Concatenation is associative, $(wx)y = w(xy)$, and $\varepsilon$ is its identity: $\varepsilon w = w \varepsilon = w$. It is **not** commutative: $01 \cdot 1 = 011 \neq 101$. Notice the asymmetry hidden in the definition: $\varepsilon w = w$ is a *definition*, while $w \varepsilon = w$ is a *theorem* that needs an induction proof (below).

Powers are repeated concatenation: $w^0 = \varepsilon$ and $w^{n+1} = w \, w^n$. So $(01)^3 = 010101$.

### Reversal

$$\varepsilon^R = \varepsilon, \qquad (a \cdot x)^R = x^R \bullet a.$$

For example $(011)^R = 110$. A string with $w = w^R$ is a **palindrome**. Note that the right-hand side $x^R \bullet a$ concatenates a string with the one-symbol string $a = a \cdot \varepsilon$; reversal is defined in terms of concatenation, so proofs about reversal lean on facts about concatenation.

### More recursive functions (homework favorites)

CS 374 homework loves to define a new function on strings by recursion and ask you to prove something about it. A few typical ones:

- **Stutter** doubles every symbol: $\textit{stutter}(\varepsilon) = \varepsilon$, $\textit{stutter}(a \cdot x) = a \cdot a \cdot \textit{stutter}(x)$. So $\textit{stutter}(011) = 001111$.
- **Odds and evens**, defined by *mutual* recursion, pick out the symbols at odd positions and at even positions:
$$\textit{odds}(\varepsilon) = \varepsilon,\quad \textit{odds}(a \cdot x) = a \cdot \textit{evens}(x); \qquad \textit{evens}(\varepsilon) = \varepsilon,\quad \textit{evens}(a \cdot x) = \textit{odds}(x).$$
For example $\textit{odds}(abcde) = a \cdot \textit{evens}(bcde) = a \cdot \textit{odds}(cde) = ac \cdot \textit{evens}(de) = ac \cdot \textit{odds}(e) = ace$.
- **Delete** removes every copy of a symbol $c$: $\textit{del}_c(\varepsilon) = \varepsilon$; $\textit{del}_c(a \cdot x) = \textit{del}_c(x)$ if $a = c$, and $a \cdot \textit{del}_c(x)$ otherwise.

The *outputs* of stutter over $\{0,1\}$ are exactly the concatenations of blocks $00$ and $11$ (each symbol of the input becomes one block). Here is that language as a regex you can test:

~~~regex
(00+11)*
alphabet: 01
~~~

> **Exam tip.** Before proving anything about a new recursive function, *unfold it on two or three small inputs by hand*. You will understand what it does, you will catch misreadings of the definition, and you will often see the shape of the inductive step.

### Substrings, prefixes, suffixes, subsequences

- $x$ is a **prefix** of $w$ if $w = xy$ for some string $y$; a **suffix** if $w = yx$ for some $y$.
- $x$ is a **substring** of $w$ if $w = uxv$ for some strings $u, v$ (the symbols of $x$ are *contiguous* in $w$).
- $x$ is a **subsequence** of $w$ if $x$ can be obtained by deleting zero or more symbols of $w$ (not necessarily contiguous).

Note that $\varepsilon$ and $w$ itself are always prefixes, suffixes and substrings of $w$. A *proper* prefix is one that is not equal to $w$. A string of length $n$ has exactly $n+1$ prefixes and $n+1$ suffixes, but the number of *distinct* substrings depends on the string ($000$ has only 4: $\varepsilon, 0, 00, 000$). Substring vs subsequence is a classic exam trap: $101$ is a subsequence of $1001$ but not a substring.

## Languages

> **Definition.** A **language** over $\Sigma$ is any set $L \subseteq \Sigma^*$.

Languages can be finite ($\{\varepsilon, 0, 01\}$), infinite ($\{0^n : n \ge 0\}$), empty ($\varnothing$), or everything ($\Sigma^*$).

> **Warning.** $\varnothing$ and $\{\varepsilon\}$ are different languages. $\varnothing$ contains *no* strings; $\{\varepsilon\}$ contains exactly *one* string, the empty one. This distinction matters constantly: $L \cdot \varnothing = \varnothing$ but $L \cdot \{\varepsilon\} = L$.

### Operations on languages

Because languages are sets, we get the usual set operations:

- **Union** $A \cup B$, **intersection** $A \cap B$, **difference** $A \setminus B$.
- **Complement** $\overline{A} = \Sigma^* \setminus A$ (complement is always relative to $\Sigma^*$).

And we get operations that come from strings:

- **Concatenation** $A \bullet B = \{\, xy : x \in A,\ y \in B \,\}$.
- **Powers** $A^0 = \{\varepsilon\}$, $A^{n+1} = A \bullet A^n$.
- **Kleene star** $A^* = \bigcup_{n \ge 0} A^n$, i.e. all strings formed by concatenating zero or more strings from $A$. Equivalently, $A^*$ is the smallest language that contains $\varepsilon$ and contains $xy$ whenever $x \in A$ and $y \in A^*$.
- **Kleene plus** $A^+ = A \bullet A^*$ (one or more pieces).
- **Reversal** $A^R = \{\, w^R : w \in A \,\}$.

> **Example.** Let $A = \{0, 01\}$ and $B = \{\varepsilon, 1\}$.
> - $A \bullet B = \{0, 01, 011\}$. Note $01$ arises twice ($0 \cdot 1$ and $01 \cdot \varepsilon$) but a set lists it once.
> - $B \bullet A = \{0, 01, 10, 101\}$ — concatenation of languages is not commutative either.
> - $A^2 = \{00, 001, 010, 0101\}$.
> - $\varnothing^* = \{\varepsilon\}$ and $\{\varepsilon\}^* = \{\varepsilon\}$.

A few facts worth internalizing:

1. $\varepsilon \in A^*$ for **every** language $A$, even $A = \varnothing$.
2. $|A \bullet B| \le |A| \cdot |B|$ for finite languages, with strict inequality possible (collisions, as above).
3. $A^*$ is infinite unless $A \subseteq \{\varepsilon\}$.
4. $(A^*)^* = A^*$, and $A^* A^* = A^*$.
5. $\Sigma^*$ is the Kleene star of the alphabet viewed as a language of length-1 strings — the notation is consistent.
6. Concatenation distributes over union, $A(B \cup C) = AB \cup AC$, but **not** over intersection: $A(B \cap C) \subseteq AB \cap AC$, and the inclusion can be strict.
7. $A^+ = A^*$ exactly when $\varepsilon \in A$.

### A star example you can play with

Let $A = \{ab, b\}$. Every string of $A^*$ is a sequence of blocks <code>ab</code> and <code>b</code>, so every $a$ in such a string is immediately followed by a $b$. Conversely, any string in which every $a$ is immediately followed by $b$ can be chopped into such blocks. So $A^* = \{w \in \{a,b\}^* : \text{every } a \text{ in } w \text{ is immediately followed by } b\}$. Try a few strings in the tester (in regex notation, $+$ means union):

~~~regex
(ab+b)*
alphabet: ab
~~~

And here is a tiny DFA for the language of even-length binary strings, $(\Sigma\Sigma)^*$, which is the star of $\Sigma^2 = \{00,01,10,11\}$:

~~~automaton
alphabet: 01
start: even
accept: even
even 0,1 -> odd
odd 0,1 -> even
~~~

### Try it first: computing with languages

Let $A = \{\varepsilon, a\}$ and $B = \{b, ab\}$ over $\{a, b\}$. Compute $AB$, $BA$, $A^2$ and describe $A^*$ and $B^*$ in words. Is $ab \in B^*$? Is $ba \in B^*$?

~~~reveal Solution
- $AB = \{\varepsilon b, \varepsilon ab, ab, aab\} = \{b, ab, aab\}$ (the string $ab$ arises twice).
- $BA = \{b, ba, ab, aba\}$.
- $A^2 = \{\varepsilon, a, aa\}$ ($a$ arises as $\varepsilon a$ and $a \varepsilon$).
- $A^* = \{a\}^* = \{a^n : n \ge 0\}$: adding $\varepsilon$ to a language never changes its star.
- $B^* = \{b, ab\}^*$: strings in which every $a$ is immediately followed by $b$ (the same block argument as above).
- $ab \in B^*$ (one block). $ba \notin B^*$: its final $a$ has nothing after it.
~~~

### Try it first: are these two stars equal?

Is $\{a, ab\}^* = \{a, ba\}^*$? Prove your answer.

~~~~reveal Solution
**No.** The string $ab$ is in $\{a, ab\}^*$ (one block). Suppose $ab \in \{a, ba\}^*$; then $ab$ is a concatenation of blocks $a$ and $ba$. The last block must be a suffix of $ab$, but neither $a$ nor $ba$ is a suffix of $ab$. Contradiction, so $ab \notin \{a, ba\}^*$.

Describing both languages makes the difference clear: $\{a, ab\}^*$ is "every $b$ is immediately preceded by an $a$" (equivalently: does not start with $b$ and has no $bb$), while $\{a, ba\}^*$ is the mirror image, "every $b$ is immediately followed by an $a$". In fact $\{a, ba\}^* = (\{a,ab\}^*)^R$, because $(L^*)^R = (L^R)^*$. Compare the two testers: try $ab$, $ba$, $aab$, $baa$.

~~~regex
(a+ab)*
alphabet: ab
~~~

~~~regex
(a+ba)*
alphabet: ab
~~~

To disprove a language equality, one string in the symmetric difference is enough — and you must *prove* it is not in the other side, not just assert it.
~~~~

## Induction on strings: the course template

Almost every claim of the form "for every string $w$, ..." is proved by induction on $w$ (equivalently on $|w|$). CS 374 strongly prefers a *strong induction* template that is hard to get wrong:

> **Key idea.** **Template.** Let $w$ be an arbitrary string. Assume, for every string $x$ with $|x| < |w|$, that the claim holds for $x$ (the *inductive hypothesis*). There are two cases.
> - **Case $w = \varepsilon$:** verify the claim directly (base case).
> - **Case $w = a x$** for some symbol $a$ and string $x$: then $|x| < |w|$, so the inductive hypothesis applies to $x$. Use the recursive definitions to rewrite the claim for $w$ in terms of $x$, apply the hypothesis, and finish.
>
> In both cases the claim holds, so by induction it holds for every string.

Three habits make these proofs smooth:

1. **Induct on the variable the definitions recurse on.** Concatenation recurses on its *left* argument, so to prove facts about $wz$ you induct on $w$ and keep $z$ arbitrary.
2. **Write each step with a justification**: "by definition of $\bullet$", "by the inductive hypothesis", "by associativity".
3. **Say what you are inducting on and state the hypothesis explicitly.** "By induction" alone earns little credit.

### The two basic lemmas, proved in full

**Lemma 1 (right identity).** For every string $w$, $w \bullet \varepsilon = w$.

**Proof.** Let $w$ be arbitrary and assume $x \bullet \varepsilon = x$ for every $x$ with $|x| < |w|$.
- If $w = \varepsilon$: $\varepsilon \bullet \varepsilon = \varepsilon$ by definition of $\bullet$.
- If $w = ax$: $(ax) \bullet \varepsilon = a \cdot (x \bullet \varepsilon) = a \cdot x = w$, by definition of $\bullet$ and then the IH applied to $x$. $\blacksquare$

**Lemma 2 (associativity).** For all strings $w, y, z$: $(w y) z = w (y z)$.

**Proof.** Fix arbitrary $y$ and $z$; induct on $w$. Assume $(xy)z = x(yz)$ for every $x$ with $|x| < |w|$.
- If $w = \varepsilon$: $(\varepsilon y) z = y z = \varepsilon (y z)$, using the definition of $\bullet$ twice.
- If $w = ax$:
$$((ax) y) z = (a (x y)) z = a ((x y) z) = a (x (y z)) = (ax)(yz).$$
The steps are: definition of $\bullet$; definition of $\bullet$ again (applied to the string $a(xy)$); the IH for $x$; definition of $\bullet$ read backwards. $\blacksquare$

Both proofs induct on the **leftmost** argument, because that is the one the definition of $\bullet$ can take apart.

### Worked proof: $|wz| = |w| + |z|$

**Claim.** For all strings $w$ and $z$, $|wz| = |w| + |z|$.

**Proof.** Fix an arbitrary string $z$; we prove the claim for every $w$ by induction. Let $w$ be an arbitrary string and assume $|xz| = |x| + |z|$ for every string $x$ with $|x| < |w|$.

- If $w = \varepsilon$: $|\varepsilon z| = |z|$ by definition of $\bullet$, and $|\varepsilon| + |z| = 0 + |z| = |z|$.
- If $w = a x$: then
$$|wz| = |(a x) z| = |a (x z)| = 1 + |xz| = 1 + |x| + |z| = |ax| + |z| = |w| + |z|,$$
using the definition of $\bullet$, the definition of length, the inductive hypothesis (valid because $|x| < |w|$), and the definition of length again.

In both cases the claim holds. $\blacksquare$

### Worked proof: $(wz)^R = z^R w^R$

**Claim.** For all strings $w$ and $z$, $(wz)^R = z^R w^R$.

This one uses both lemmas above: right identity and associativity.

**Proof.** Fix $z$ and induct on $w$. Let $w$ be arbitrary and assume $(xz)^R = z^R x^R$ for all $x$ with $|x| < |w|$.

- If $w = \varepsilon$: $(\varepsilon z)^R = z^R = z^R \varepsilon = z^R \varepsilon^R$, using the definition of $\bullet$, the right-identity lemma, and $\varepsilon^R = \varepsilon$.
- If $w = a x$:
$$(wz)^R = (a(xz))^R = (xz)^R \bullet a = (z^R x^R) \bullet a = z^R (x^R \bullet a) = z^R (ax)^R = z^R w^R.$$
The steps use: definition of $\bullet$; definition of reversal; the inductive hypothesis; associativity; definition of reversal again.

$\blacksquare$

A pleasant corollary (prove it yourself, again by induction): $(w^R)^R = w$.

> **Exam tip.** When a step needs a fact you have not proven (associativity, right identity), either cite it as a standard lemma if the problem allows, or prove it as a separate lemma *first*. Graders look for every equality to be justified.

### Walkthrough: counting is additive

~~~steps Prove that #(a, wz) = #(a, w) + #(a, z) for all strings w, z
**Decide what to induct on.** Both $\#$ and $\bullet$ recurse on the first symbol of their string argument, and in $wz$ the first symbol comes from $w$ (when $w \ne \varepsilon$). So fix an arbitrary symbol $a$ and an arbitrary string $z$, and induct on $w$.
+++
**State the hypothesis.** Let $w$ be an arbitrary string, and assume $\#(a, xz) = \#(a, x) + \#(a, z)$ for every string $x$ with $|x| < |w|$.
+++
**Base case $w = \varepsilon$.** $\#(a, \varepsilon z) = \#(a, z)$ by definition of $\bullet$, and $\#(a,\varepsilon) + \#(a,z) = 0 + \#(a,z)$ by definition of $\#$. Equal.
+++
**Inductive case $w = bx$.** By definition of $\bullet$, $wz = (bx)z = b(xz)$. Now the definition of $\#$ has two cases depending on whether $b = a$, so the proof splits too.
- If $b = a$: $\#(a, b(xz)) = 1 + \#(a, xz) = 1 + \#(a,x) + \#(a,z) = \#(a, bx) + \#(a, z)$.
- If $b \ne a$: $\#(a, b(xz)) = \#(a, xz) = \#(a,x) + \#(a,z) = \#(a, bx) + \#(a,z)$.

Each middle equality is the IH applied to $x$, which is legal because $|x| = |w| - 1 < |w|$; the outer equalities are the definition of $\#$.
+++
**Conclude.** In every case the claim holds for $w$, so by induction it holds for all $w$. Since $a$ and $z$ were arbitrary, it holds for all symbols and all strings. $\blacksquare$

Notice the pattern: *a case split in the definition becomes a case split in the proof.*
~~~

### Why strong induction?

In the template we assume the claim for *all* shorter strings, not just for the tail $x$. For the proofs above, the tail suffices, but many proofs need to split $w$ somewhere else — e.g. $w = xa$ (peeling off the *last* symbol), $w = abx$ (peeling off two symbols), $w = xay$ with the interesting symbol in the middle, or $w = xy$ where both $x$ and $y$ are shorter. Strong induction covers all of these with no extra work, which is why the course uses it by default.

### Try it first: peeling two symbols

Prove that $|\textit{odds}(w)| = \lceil |w|/2 \rceil$ for every string $w$, using the mutually recursive definitions of *odds* and *evens* above.

~~~reveal Solution
First unfold twice: for $w = abx$ we get $\textit{odds}(abx) = a \cdot \textit{evens}(bx) = a \cdot \textit{odds}(x)$. So *odds* "skips ahead by two", and the natural induction peels off **two** symbols — which strong induction allows, since $|x| = |w| - 2 < |w|$.

Let $w$ be arbitrary and assume $|\textit{odds}(x)| = \lceil |x|/2 \rceil$ for all $x$ with $|x| < |w|$. There are three cases.
- $w = \varepsilon$: $|\textit{odds}(\varepsilon)| = 0 = \lceil 0/2 \rceil$.
- $w = a$ (one symbol, i.e. $a \cdot \varepsilon$): $\textit{odds}(a) = a \cdot \textit{evens}(\varepsilon) = a$, length $1 = \lceil 1/2 \rceil$.
- $w = abx$: $|\textit{odds}(w)| = |a \cdot \textit{odds}(x)| = 1 + \lceil |x|/2 \rceil = \lceil (|x| + 2)/2 \rceil = \lceil |w|/2 \rceil$, using the unfolding above, the definition of length, and the IH for $x$.

The three cases cover every string (length 0, length 1, length $\ge 2$). $\blacksquare$

A common mistake is to only handle $w = \varepsilon$ as a base case: then the case $w = a$ falls through the cracks, because $a$ is not of the form $abx$. **Every base case your inductive step cannot reach must be handled directly.**
~~~

## Inductively defined languages and structural induction

Languages are often defined by rules, exactly like strings:

> **Example.** Let $L \subseteq \{0,1\}^*$ be the smallest set such that
> 1. $\varepsilon \in L$;
> 2. if $x \in L$ then $0x1 \in L$;
> 3. if $x, y \in L$ then $xy \in L$.

"Smallest" means: a string is in $L$ only if it can be built by finitely many applications of the rules. To prove that *every* string in $L$ has some property $P$, use **structural induction**: show $P$ holds for the base element, and that each rule preserves $P$.

**Claim.** Every $w \in L$ satisfies $\#(0, w) = \#(1, w)$.

**Proof.** We induct on the number of rule applications in a derivation of $w$. Let $w \in L$ have a derivation with $k$ steps, and assume the claim for every string of $L$ that has a derivation with fewer than $k$ steps. Consider the last rule used:

- Rule 1: $w = \varepsilon$ has zero 0s and zero 1s.
- Rule 2: $w = 0x1$ where $x \in L$ was derived in fewer steps. By the hypothesis $\#(0,x) = \#(1,x)$, so $\#(0,w) = 1 + \#(0,x) = 1 + \#(1,x) = \#(1,w)$.
- Rule 3: $w = xy$ where $x, y \in L$ were each derived in fewer steps. By the hypothesis applied to both, $\#(0,w) = \#(0,x) + \#(0,y) = \#(1,x) + \#(1,y) = \#(1,w)$.

$\blacksquare$

(The last two lines silently use $\#(a, uv) = \#(a,u) + \#(a,v)$ — the additivity lemma from the walkthrough above.)

Why count derivation steps instead of inducting on $|w|$? In rule 3, $x$ might be $\varepsilon$, in which case $y = w$ is *not* shorter than $w$, and an induction on length would have to treat that case separately. Sub-derivations, on the other hand, always use strictly fewer steps, so the hypothesis applies with no fuss.

> **Warning.** Structural induction proves "every string in $L$ has property $P$". It says nothing about the converse ("every string with property $P$ is in $L$"). For this $L$ the converse is false — $10$ has equal counts but is not in $L$ (every string in $L$ starts with 0 or is empty). Proving that a language *equals* a description always needs **both** directions.

### Proving a language equals a description

To show $L = D$ for a rule-defined $L$ and a description $D$:

- **($L \subseteq D$)** Structural induction on derivations: each rule maps strings satisfying $D$ to strings satisfying $D$.
- **($D \subseteq L$)** Strong induction on $|w|$ for $w \in D$: show how to *decompose* $w$ into smaller pieces that are themselves in $D$, so by the IH they are in $L$, and then one rule reassembles $w$.

The second direction is where the creativity is: you have to find the decomposition. The small example first:

> **Example.** Let $K$ be the smallest set with $\varepsilon \in K$ and ($x \in K \Rightarrow axb \in K$). Then $K = \{a^n b^n : n \ge 0\}$. ($\subseteq$): $\varepsilon = a^0b^0$, and if $x = a^m b^m$ then $axb = a^{m+1}b^{m+1}$. ($\supseteq$): by induction on $n$; $a^0b^0 = \varepsilon \in K$, and $a^n b^n = a\,(a^{n-1}b^{n-1})\,b$ with $a^{n-1}b^{n-1} \in K$ by the IH.

Now the classic, exam-level one.

~~~steps The balanced language L (rules: ε; 0x1; xy) equals B = {w : #0(w) = #1(w) and every prefix p has #0(p) ≥ #1(p)}
**Notation.** For a string $q$ let $d(q) = \#(0,q) - \#(1,q)$. Appending one symbol changes $d$ by exactly $\pm 1$, and $d(uv) = d(u) + d(v)$ by additivity of $\#$. So $B = \{w : d(w) = 0 \text{ and } d(p) \ge 0 \text{ for every prefix } p \text{ of } w\}$.
+++
**($L \subseteq B$), structural induction.** Assume the claim for strings with shorter derivations; look at the last rule.
- Rule 1: $\varepsilon$ has $d = 0$ and its only prefix is $\varepsilon$.
- Rule 2: $w = 0x1$, $x \in B$. Then $d(w) = 1 + d(x) - 1 = 0$. A prefix of $w$ is $\varepsilon$ ($d = 0$), or $0p'$ for a prefix $p'$ of $x$ ($d = 1 + d(p') \ge 1$), or $w$ itself ($d = 0$).
- Rule 3: $w = xy$, $x, y \in B$. Then $d(w) = 0 + 0$. A prefix of $w$ is either a prefix of $x$ ($d \ge 0$) or $xp'$ for a prefix $p'$ of $y$ ($d = 0 + d(p') \ge 0$).
+++
**($B \subseteq L$), setup.** Strong induction on $|w|$. Let $w \in B$ and assume every string of $B$ shorter than $w$ is in $L$. If $w = \varepsilon$, rule 1 puts it in $L$. Otherwise we must *find a decomposition*.
+++
**The key idea: cut at the first return to zero.** Let $p$ be the **shortest non-empty** prefix of $w$ with $d(p) = 0$. It exists because $w$ itself qualifies. Write $w = py$. Every non-empty proper prefix of $p$ has $d \ge 0$ (since $w \in B$) and $d \ne 0$ (by minimality), so $d \ge 1$.
+++
**The shape of $p$.** The first symbol of $p$ must be 0 (a first symbol 1 would give a prefix with $d = -1$). A one-symbol string has $d = \pm 1 \ne 0$, so $|p| \ge 2$, and dropping the last symbol of $p$ leaves a non-empty proper prefix $p'$ with $d(p') \ge 1$. One step takes $d$ from $d(p') \ge 1$ to $d(p) = 0$, which forces $d(p') = 1$ and a last symbol 1. So $p = 0x1$ for some (possibly empty) string $x$.
+++
**The pieces are in $B$.** For $x$: $d(x) = d(p) - 1 + 1 = 0$, and for any prefix $q$ of $x$, $0q$ is a non-empty proper prefix of $p$, so $d(q) = d(0q) - 1 \ge 0$. Hence $x \in B$. For $y$: $d(y) = d(w) - d(p) = 0$, and for any prefix $q$ of $y$, $pq$ is a prefix of $w$, so $d(q) = d(pq) - d(p) = d(pq) \ge 0$. Hence $y \in B$.
+++
**Apply the IH and reassemble.** $|x| < |w|$ and $|y| < |w|$ (because $p$ is non-empty), so $x, y \in L$ by the IH. Rule 2 gives $p = 0x1 \in L$; rule 3 gives $w = py \in L$. $\blacksquare$

This "first return to zero" decomposition shows up again and again — in grammar proofs (the CFG topic) and in counting arguments.
~~~

### Try it first: palindromes

Let $P \subseteq \{a,b\}^*$ be the smallest set such that $\varepsilon, a, b \in P$, and if $x \in P$ then $axa \in P$ and $bxb \in P$. Prove that every $w \in P$ satisfies $w^R = w$. You may use $(uv)^R = v^R u^R$ and associativity.

~~~reveal Solution
Structural induction on the derivation of $w$. Assume the claim for all strings of $P$ with shorter derivations.
- Base rules: $\varepsilon^R = \varepsilon$; for a symbol $c$, $c^R = (c \cdot \varepsilon)^R = \varepsilon^R \bullet c = c$.
- Rule $w = cxc$ with $c \in \{a, b\}$ and $x \in P$ derived in fewer steps, so $x^R = x$:
$$w^R = (c\,(xc))^R = (xc)^R \bullet c = (c^R x^R) \bullet c = (c\,x)\,c = w.$$
Steps: definition of reversal; the reversal-of-concatenation lemma; $c^R = c$ and the IH; associativity.

So every member of $P$ is a palindrome. (The converse is also true — every palindrome is in $P$ — and is proved by strong induction on $|w|$: a palindrome of length $\ge 2$ has the form $cxc$ with $x$ a shorter palindrome. That converse needs its own argument; it does not follow from this one.)
~~~

### Try it first: what is wrong with this proof?

**Claim (false).** Every string $w \in \{0,1\}^*$ with $\#(0,w) = \#(1,w)$ is in $L$ (the balanced language above).

**"Proof."** Strong induction on $|w|$. If $w = \varepsilon$, rule 1 applies. Otherwise $w$ has equal numbers of 0s and 1s, so $w = 0x1$ where $x$ also has equal numbers of 0s and 1s. By the IH $x \in L$, so $w \in L$ by rule 2.

~~~reveal What is wrong
The claim is false ($10$ has equal counts but is not in $L$), so some step must fail. The broken step is "**so $w = 0x1$**": nothing forces a string with equal counts to start with 0 and end with 1. The strings $10$ (starts with 1) and $0110$ (ends with 0) are instances where that step fails. The rest of the argument is fine: *if* $w = 0x1$ has equal counts then so does $x$, and the IH would apply to the shorter string $x$.

When grading a flawed proof, (1) find a counterexample to the claim if it is false, and (2) point to the *first* step that does not follow, with a concrete instance where that step fails. "The induction is wrong" earns nothing; "the step $w = 0x1$ assumes $w$ starts with 0, but $w = 10$ does not" earns full credit.
~~~

## Common exam problem patterns

These are the question types that recur on CS 374 homework and exams for this material, with a recipe for each.

**1. "Prove $f(\ldots) = g(\ldots)$ for all strings" (identity about recursive functions).**
Recipe: unfold the definitions on small examples; pick the argument the definitions recurse on (usually the leftmost string argument); fix the other arguments as arbitrary; strong-induction template with cases $\varepsilon$ and $ax$ (plus extra base cases if your step peels more than one symbol); justify every equality by name; mirror every case split in the definitions.

**2. "Prove every string in this recursively defined language has property $P$."**
Recipe: structural induction (induct on the number of rule applications); one case per rule; in each case, apply the IH to the strings the rule was applied to; conclude $P$ for the result.

**3. "Prove the language defined by these rules equals this description."**
Recipe: both directions. $\subseteq$ by structural induction as in pattern 2. $\supseteq$ by strong induction on length: given $w$ satisfying the description, find a decomposition into strictly shorter strings satisfying the description, then reassemble with one rule. The decomposition is usually "cut at the first/last time something happens".

**4. "Prove or disprove a language identity" ($A(B \cap C) = AB \cap AC$, $(A \cup B)^* = A^* \cup B^*$, $(AB)^R = B^R A^R$, ...).**
Recipe: test with tiny languages first ($A = \{\varepsilon, a\}$, $B = \{a\}$, $C = \{aa\}$ breaks many claims). To disprove, give one string and *prove* it lies in exactly one side. To prove, show both inclusions by chasing an arbitrary element: "let $w \in$ left side; then $w = \ldots$; hence $w \in$ right side".

**5. "Compute / describe" ($AB$, $A^2$, $A^*$, $L^R$, $\overline{L}$ for given $L$).**
Recipe: list systematically, remove duplicates; describe stars by their "block" structure; for complements, remember $\varepsilon$ and short strings.

**6. "Define a function recursively."** (e.g. "define $\textit{dup}(w)$ that doubles the string", "define the number of occurrences of $ab$".)
Recipe: one equation for $\varepsilon$ and one for $a \cdot x$ (possibly with cases on $a$ or on the first two symbols); check your definition on three examples; make sure every string matches exactly one equation.

**7. "Find the flaw in this proof."**
Recipe: test the claim on tiny strings; if it is false, give a counterexample; locate the first unjustified step and show an instance where it fails. Typical flaws: a decomposition that is not always possible, IH applied to a string that is not shorter, a missing base case, or proving the converse of what was asked.

## Where students lose points

- **Not stating the inductive hypothesis**, or stating it only for $|w| - 1$ when the proof then uses it on something else. Write "assume the claim for every string shorter than $w$".
- **Inducting on the wrong variable.** Proving $(wz)^R = z^R w^R$ by induction on $z$ gets stuck, because nothing in the definitions simplifies $w \bullet (a \cdot y)$.
- **Fixing too much.** If the IH must be applied with a *different* value of another parameter, that parameter must be universally quantified inside the hypothesis, not fixed outside. (You will see this in DFA proofs, where the IH must hold for every state.)
- **Unjustified equalities**, especially silent uses of associativity or $w\varepsilon = w$.
- **Missing base cases** when the step peels two symbols or splits in the middle.
- **One direction only** when asked to prove a language equals a description.
- **Confusing $\varnothing$, $\{\varepsilon\}$ and $\varepsilon$**, or claiming $\varnothing^* = \varnothing$.
- **Substring vs subsequence**, and forgetting that $\varepsilon$ is a prefix, suffix and substring of everything.
- **Hand-waving with "..."**: "$w = a_1 a_2 \cdots a_n$, so clearly..." is not an induction proof. Graders want the recursive structure.

## Common confusions, collected

| Thing | What it is |
|---|---|
| $\varepsilon$ | a string (length 0) |
| $\{\varepsilon\}$ | a language with one string |
| $\varnothing$ | a language with no strings |
| $\Sigma$ | an alphabet; also the language of all length-1 strings |
| $\Sigma^*$ | the language of all strings |
| $w^*$ | not a standard object for a string $w$; we mean $\{w\}^*$ |
| $L^R$ | reverse each string in $L$ |
| $\overline{L}$ | all strings **not** in $L$ (relative to $\Sigma^*$) |

Also remember that $\overline{L^*}$ and $(\overline{L})^*$ are different: for any $L$, $(\overline{L})^*$ contains $\varepsilon$, but $\overline{L^*}$ never does.

## Self-check

**1.** How many strings are in $\{\varepsilon, 0\} \bullet \{\varepsilon, 0\}$?

~~~reveal Answer
Three: $\{\varepsilon, 0, 00\}$. The string $0$ arises twice ($\varepsilon 0$ and $0 \varepsilon$).
~~~

**2.** Which of these is a definition and which is a theorem: $\varepsilon w = w$; $w \varepsilon = w$?

~~~reveal Answer
$\varepsilon w = w$ is the base case of the definition of concatenation (which recurses on the left argument). $w \varepsilon = w$ is a theorem, proved by induction on $w$.
~~~

**3.** You want to prove a statement $P(w)$ and your inductive step writes $w = abx$ and uses the IH on $x$. Which base cases do you need?

~~~reveal Answer
Every string not of the form $abx$: that is $w = \varepsilon$ **and** every one-symbol string $w = a$. Handle both directly.
~~~

**4.** True or false: if structural induction shows every string of $L$ has equally many $a$s and $b$s, then $L = \{w : \#(a,w) = \#(b,w)\}$.

~~~reveal Answer
False. Structural induction only gives $L \subseteq \{w : \#(a,w) = \#(b,w)\}$. Equality needs the other inclusion too, and it is often false (e.g. the balanced language does not contain $10$).
~~~

**5.** Give a counterexample to $A(B \cap C) = AB \cap AC$.

~~~reveal Answer
$A = \{\varepsilon, a\}$, $B = \{a\}$, $C = \{aa\}$. Then $B \cap C = \varnothing$ so the left side is $\varnothing$, but $AB = \{a, aa\}$ and $AC = \{aa, aaa\}$ share $aa$.
~~~

**6.** Unfold $\textit{evens}(abcd)$ using the definitions.

~~~reveal Answer
$\textit{evens}(abcd) = \textit{odds}(bcd) = b \cdot \textit{evens}(cd) = b \cdot \textit{odds}(d) = b \cdot d \cdot \textit{evens}(\varepsilon) = bd$.
~~~

**7.** Is $\varepsilon \in \overline{\{0,1\}^*}$ (complement over $\{0,1\}$)? Is $\varepsilon \in \overline{\varnothing}$?

~~~reveal Answer
$\overline{\{0,1\}^*} = \varnothing$, which contains nothing, so no. $\overline{\varnothing} = \Sigma^*$, which contains $\varepsilon$, so yes.
~~~

## Looking ahead

The next topics ask: which languages can be described by a **regular expression** (a finite expression built from $\cup$, $\bullet$, $*$), and which can be recognized by a **finite automaton** (a machine with finite memory)? Kleene's theorem says these are the same class — the regular languages — and the inductive definitions you met here are exactly what make those constructions and their correctness proofs work. Every time you see "by induction on the regular expression" or "by induction on $w$, for every state $q$", it is the same template you practised here.
`,

  cheatsheet: String.raw`## Definitions (recursive)
- String: $\varepsilon$ or $a \cdot x$ ($a \in \Sigma$, $x$ a string).
- $|\varepsilon| = 0$, $|ax| = 1 + |x|$.
- $\#(c,\varepsilon) = 0$; $\#(c, ax) = [a = c] + \#(c, x)$.
- $\varepsilon z = z$, $(ax)z = a(xz)$ — recursion on the **left** argument.
- $\varepsilon^R = \varepsilon$, $(ax)^R = x^R a$.
- $w^0 = \varepsilon$, $w^{n+1} = w w^n$.
- $\textit{stutter}(ax) = aa\,\textit{stutter}(x)$; $\textit{odds}(ax) = a\,\textit{evens}(x)$, $\textit{evens}(ax) = \textit{odds}(x)$.

## Language operations
- $AB = \{xy : x \in A, y \in B\}$; $A^0 = \{\varepsilon\}$; $A^* = \bigcup_{n\ge0} A^n$; $A^+ = AA^*$.
- $\overline{A} = \Sigma^* \setminus A$; $A^R = \{w^R : w \in A\}$.
- $L\varnothing = \varnothing L = \varnothing$; $L\{\varepsilon\} = L$; $\varnothing^* = \{\varepsilon\}^* = \{\varepsilon\}$.
- $\varepsilon \in A^*$ always; $(A^*)^* = A^*$; $A^+ = A^*$ iff $\varepsilon \in A$.
- $A(B \cup C) = AB \cup AC$, but only $A(B \cap C) \subseteq AB \cap AC$.
- $(AB)^R = B^R A^R$; $(A^*)^R = (A^R)^*$. Concatenation is not commutative.

## Standard facts (each by induction)
- $w\varepsilon = w$; $(wx)y = w(xy)$; $|wz| = |w| + |z|$; $\#(c, wz) = \#(c,w) + \#(c,z)$.
- $(wz)^R = z^R w^R$; $(w^R)^R = w$; $|w^R| = |w|$; $\#(c, w^R) = \#(c, w)$.
- $|\textit{odds}(w)| = \lceil |w|/2 \rceil$, $|\textit{evens}(w)| = \lfloor |w|/2 \rfloor$.

## Strong induction template
1. Let $w$ be arbitrary; assume claim for all $x$ with $|x| < |w|$.
2. Case $w = \varepsilon$: check directly.
3. Case $w = ax$: rewrite via definitions, apply IH to $x$, conclude.
4. Justify every equality. Induct on the argument the definitions recurse on; keep the others arbitrary.
5. Peeling 2 symbols ($w = abx$)? Add base case $|w| = 1$. Split $w = xa$? Fine — strong IH covers $x$.

## Structural induction (rule-defined $L$)
- Induct on the number of rule applications; one case per rule; IH on the pieces.
- Proves only "in $L \Rightarrow P$".

## Proving $L = D$ (both directions)
- $L \subseteq D$: structural induction.
- $D \subseteq L$: strong induction on $|w|$; **decompose** $w$ into shorter strings in $D$ (e.g. cut at the first prefix where a count returns to 0), apply IH, reassemble with a rule.

## Disproving
- Language identity: one string, with proof it is in exactly one side. Try $A = \{\varepsilon, a\}$, $B = \{a\}$, $C = \{aa\}$.
- Flawed proof: counterexample to the claim + the first step that fails, with an instance.

## Traps
- $\varnothing \ne \{\varepsilon\}$. Substring (contiguous) $\ne$ subsequence.
- $\overline{L^*} \neq (\overline{L})^*$ ($\varepsilon$ is in exactly one).
- Missing base cases; IH applied to non-shorter strings; only one direction.
`,

  quiz: [
    {
      type: 'mc',
      q: String.raw`Let $A = \{0, 01\}$ and $B = \{\varepsilon, 1\}$. How many strings are in $A \bullet B$?`,
      choices: ['2', '3', '4', '5'],
      answer: 1,
      explain: String.raw`The four products are $0\cdot\varepsilon = 0$, $0 \cdot 1 = 01$, $01 \cdot \varepsilon = 01$, $01 \cdot 1 = 011$. The string $01$ appears twice, but a language is a *set*, so $A \bullet B = \{0, 01, 011\}$ has 3 strings. The bound $|AB| \le |A||B| = 4$ is not always tight.`,
    },
    {
      type: 'tf',
      q: String.raw`$\varnothing^* = \varnothing$.`,
      answer: false,
      explain: String.raw`$\varnothing^* = \varnothing^0 \cup \varnothing^1 \cup \cdots = \{\varepsilon\} \cup \varnothing \cup \cdots = \{\varepsilon\}$. The zeroth power of *any* language is $\{\varepsilon\}$, so $\varepsilon$ is in every Kleene star.`,
    },
    {
      type: 'mc',
      q: String.raw`Which of the following equals $L \bullet \varnothing$ for every language $L$?`,
      choices: [String.raw`$L$`, String.raw`$\varnothing$`, String.raw`$\{\varepsilon\}$`, String.raw`$L^*$`],
      answer: 1,
      explain: String.raw`A string of $L\varnothing$ has the form $xy$ with $y \in \varnothing$ — but there is no such $y$, so the result is empty. Contrast with $L\{\varepsilon\} = L$. Mixing up $\varnothing$ and $\{\varepsilon\}$ is one of the most common early mistakes.`,
    },
    {
      type: 'multi',
      q: String.raw`Which strings are **substrings** of $w = 10110$? (select all that apply)`,
      choices: [String.raw`$\varepsilon$`, String.raw`$011$`, String.raw`$111$`, String.raw`$100$`, String.raw`$10110$`],
      answer: [0, 1, 4],
      explain: String.raw`Substrings must be contiguous. $\varepsilon$ and $w$ itself are always substrings. $011$ appears at positions 2–4. $111$ is a *subsequence* (positions 1, 3, 4) and $100$ is a subsequence (positions 1, 2, 5), but neither appears contiguously, so neither is a substring.`,
    },
    {
      type: 'tf',
      q: String.raw`For all strings $w$ and $z$: $(wz)^R = w^R z^R$.`,
      answer: false,
      explain: String.raw`Reversal swaps the order: $(wz)^R = z^R w^R$. Counterexample: $w = 0$, $z = 1$. Then $(wz)^R = (01)^R = 10$ but $w^R z^R = 01$.`,
    },
    {
      type: 'mc',
      q: String.raw`To prove $|wz| = |w| + |z|$ by induction using the course's recursive definition of concatenation ($\varepsilon z = z$, $(ax)z = a(xz)$), which variable should you induct on?`,
      choices: [String.raw`$z$, keeping $w$ fixed`, String.raw`$w$, keeping $z$ arbitrary`, String.raw`$|w| + |z|$ simultaneously, with no fixed variable`, 'Either works equally easily'],
      answer: 1,
      explain: String.raw`Concatenation is defined by recursion on its *left* argument, so the definition can only simplify $(ax)z$, not $w(az)$. Inducting on $w$ lets you rewrite $(ax)z$ as $a(xz)$ and apply the hypothesis to $xz$. Inducting on $z$ is possible but needs extra lemmas about appending on the right.`,
    },
    {
      type: 'multi',
      q: String.raw`Let $A = \{ab, b\}$ over $\{a,b\}$. Which strings are in $A^*$? (select all that apply)`,
      choices: [String.raw`$\varepsilon$`, String.raw`$bab$`, String.raw`$abba$`, String.raw`$abab$`, String.raw`$aab$`],
      answer: [0, 1, 3],
      explain: String.raw`$A^*$ is exactly the set of strings in which every $a$ is immediately followed by $b$. $\varepsilon$ (zero pieces), $bab = b \cdot ab$, and $abab = ab \cdot ab$ are in. $abba$ ends in an $a$ with nothing after it, and in $aab$ the first $a$ is followed by $a$.`,
    },
    {
      type: 'tf',
      q: String.raw`For every language $L$, $\overline{L^*} = (\overline{L})^*$.`,
      answer: false,
      explain: String.raw`$(\overline{L})^*$ always contains $\varepsilon$ (it is a star), while $\overline{L^*}$ never contains $\varepsilon$ (because $\varepsilon \in L^*$). So they always differ. Complement and star do not commute.`,
    },
    {
      type: 'mc',
      q: String.raw`What is $|\{0,1\}^3 \cdot \{0,1\}^2|$, the number of strings in that concatenation?`,
      choices: ['10', '32', '64', '6'],
      answer: 1,
      explain: String.raw`$\{0,1\}^3\{0,1\}^2 = \{0,1\}^5$, all binary strings of length exactly 5. There are $2^5 = 32$ of them. Here every string arises from exactly one split (the first 3 symbols and the last 2), so there are no collisions and the bound $8 \cdot 4 = 32$ is tight.`,
    },
    {
      type: 'tf',
      q: String.raw`If $L$ is defined as the smallest set containing $\varepsilon$ and closed under $x \mapsto 0x1$ and $(x, y) \mapsto xy$, then every string with equally many 0s and 1s is in $L$.`,
      answer: false,
      explain: String.raw`Structural induction shows every string *in* $L$ has equal counts, but not the converse. The string $10$ has equal counts yet every non-empty string in $L$ starts with $0$ (each rule produces a string starting with 0, or concatenates strings that do). $L$ is the language of balanced "parentheses" with $0 = ($ and $1 = )$.`,
    },
    {
      type: 'mc',
      q: String.raw`In the strong induction template, in the case $w = ax$, why are we allowed to apply the inductive hypothesis to $x$?`,
      choices: [String.raw`Because $x$ is a suffix of $w$`, String.raw`Because $|x| = |w| - 1 < |w|$`, String.raw`Because $a$ is a single symbol`, String.raw`Because $x \ne \varepsilon$`],
      answer: 1,
      explain: String.raw`The hypothesis is "the claim holds for every string strictly shorter than $w$". Since $|w| = 1 + |x|$, $x$ is strictly shorter, so the hypothesis covers it. $x$ may well be $\varepsilon$ — that is fine.`,
    },
    {
      type: 'multi',
      q: String.raw`Which of these languages contain the empty string $\varepsilon$? (select all that apply)`,
      choices: [String.raw`$\{0\}^*$`, String.raw`$\{0\}^+$`, String.raw`$\{\varepsilon, 0\}\{1\}$`, String.raw`$\overline{\{0,1\}^+}$ over $\{0,1\}$`, String.raw`$\{\varepsilon\} \cdot \{\varepsilon\}$`],
      answer: [0, 3, 4],
      explain: String.raw`Any star contains $\varepsilon$. $\{0\}^+ = \{0, 00, \ldots\}$ does not. $\{\varepsilon,0\}\{1\} = \{1, 01\}$ does not. $\{0,1\}^+$ is all non-empty strings, so its complement is exactly $\{\varepsilon\}$. And $\{\varepsilon\}\{\varepsilon\} = \{\varepsilon\}$.`,
    },
    {
      type: 'mc',
      q: String.raw`Using only the recursive definitions, what is $(a \cdot (b \cdot \varepsilon))^R$?`,
      choices: [String.raw`$ab$`, String.raw`$ba$`, String.raw`$\varepsilon$`, String.raw`$b$`],
      answer: 1,
      explain: String.raw`$(a \cdot (b\varepsilon))^R = (b\varepsilon)^R \bullet a = (\varepsilon^R \bullet b) \bullet a = (\varepsilon \bullet b) \bullet a = b \bullet a = ba$. Unfolding small examples like this is a great sanity check before writing an induction proof.`,
    },
    {
      type: 'tf',
      q: String.raw`$\{a, ab\}^* = \{a, ba\}^*$.`,
      answer: false,
      explain: String.raw`$ab$ is in the left side (one block). It is not in the right side: the last block of any concatenation of blocks $a$ and $ba$ must be a suffix of the string, and neither $a$ nor $ba$ is a suffix of $ab$. The two languages are reverses of each other: $(\{a,ab\}^*)^R = (\{a,ab\}^R)^* = \{a,ba\}^*$.`,
    },
    {
      type: 'mc',
      q: String.raw`Using $\textit{odds}(\varepsilon) = \varepsilon$, $\textit{odds}(ax) = a\cdot\textit{evens}(x)$, $\textit{evens}(\varepsilon) = \varepsilon$, $\textit{evens}(ax) = \textit{odds}(x)$, what is $\textit{odds}(01101)$?`,
      choices: [String.raw`$011$`, String.raw`$101$`, String.raw`$10$`, String.raw`$001$`],
      answer: 0,
      explain: String.raw`$\textit{odds}$ keeps positions 1, 3, 5: the symbols $0, 1, 1$. Unfolding: $\textit{odds}(01101) = 0\,\textit{evens}(1101) = 0\,\textit{odds}(101) = 01\,\textit{evens}(01) = 01\,\textit{odds}(1) = 011\,\textit{evens}(\varepsilon) = 011$. The choice $10$ is $\textit{evens}(01101)$.`,
    },
    {
      type: 'mc',
      q: String.raw`A student proves "every string in $L$ has property $P$", where $L$ is the smallest set with $\varepsilon \in L$, $x \in L \Rightarrow 0x1 \in L$, and $x, y \in L \Rightarrow xy \in L$. The proof is by strong induction on $|w|$; in the rule-3 case it says "$w = xy$, so by the IH both $x$ and $y$ have property $P$". What is the problem?`,
      choices: [
        'Nothing: x and y are always shorter than w',
        String.raw`$x$ or $y$ may be $\varepsilon$, so the other one equals $w$ and is not shorter; the IH does not apply to it`,
        'The base case is missing',
        'Structural induction can never be done by induction on length',
      ],
      answer: 1,
      explain: String.raw`If $x = \varepsilon$ then $y = w$, and the hypothesis "the claim holds for strings shorter than $w$" says nothing about $y$. Fixes: induct on the number of rule applications (sub-derivations are always strictly shorter), or treat the case $x = \varepsilon$ or $y = \varepsilon$ separately. Induction on length is fine in principle; it just needs this care.`,
    },
    {
      type: 'tf',
      q: String.raw`For all languages $A, B, C$: $A(B \cap C) = AB \cap AC$.`,
      answer: false,
      explain: String.raw`Only $\subseteq$ holds. Counterexample: $A = \{\varepsilon, a\}$, $B = \{a\}$, $C = \{aa\}$. $B \cap C = \varnothing$, so the left side is $\varnothing$; but $aa \in AB$ (as $a \cdot a$) and $aa \in AC$ (as $\varepsilon \cdot aa$). The same string can be split in different ways on the two sides. Distributivity over **union** does hold.`,
    },
    {
      type: 'tf',
      q: String.raw`For all languages $A, B$: $(AB)^R = B^R A^R$.`,
      answer: true,
      explain: String.raw`$w \in (AB)^R$ iff $w = (xy)^R$ for some $x \in A$, $y \in B$ iff $w = y^R x^R$ with $y^R \in B^R$, $x^R \in A^R$ (using $(xy)^R = y^R x^R$) iff $w \in B^R A^R$. The string-level identity lifts to languages.`,
    },
    {
      type: 'mc',
      q: String.raw`Your inductive step handles strings of the form $w = abx$ (two symbols peeled off) and applies the IH to $x$. Which cases must you handle separately as base cases?`,
      choices: [String.raw`Only $w = \varepsilon$`, String.raw`$w = \varepsilon$ and every one-symbol string`, 'Only the one-symbol strings', 'None: strong induction takes care of everything'],
      answer: 1,
      explain: String.raw`Every string either is $\varepsilon$, has length 1, or has the form $abx$. Strings of length 0 and 1 cannot be written as $abx$, so the inductive step never reaches them: both must be checked directly. Forgetting the length-1 case is a classic lost point.`,
    },
    {
      type: 'multi',
      q: String.raw`Which statements hold for **every** language $A$? (select all that apply)`,
      choices: [String.raw`$\varepsilon \in A^*$`, String.raw`$A^+ = A^*$`, String.raw`$A \subseteq A^*$`, String.raw`$A^* A = A^+$`, String.raw`$(A^*)^R = (A^R)^*$`],
      answer: [0, 2, 3, 4],
      explain: String.raw`$A^+ = A^*$ only when $\varepsilon \in A$ (e.g. $A = \{0\}$: $\varepsilon \in A^*$ but not $A^+$). $A^*A$ and $AA^*$ are both $\bigcup_{n\ge1} A^n$. Reversing a concatenation of pieces of $A$ gives the reversed pieces in reverse order, all from $A^R$, so $(A^*)^R = (A^R)^*$.`,
    },
    {
      type: 'mc',
      q: String.raw`With $\textit{stutter}(\varepsilon) = \varepsilon$ and $\textit{stutter}(ax) = aa\,\textit{stutter}(x)$, which is true for every string $w$?`,
      choices: [String.raw`$|\textit{stutter}(w)| = |w| + 2$`, String.raw`$|\textit{stutter}(w)| = 2|w|$`, String.raw`$|\textit{stutter}(w)| = |w|^2$`, String.raw`$\textit{stutter}(w) = ww$`],
      answer: 1,
      explain: String.raw`Each symbol becomes two: $|\textit{stutter}(ax)| = 2 + |\textit{stutter}(x)| = 2 + 2|x| = 2|ax|$ by the IH. Note $\textit{stutter}(01) = 0011 \ne 0101 = ww$.`,
    },
    {
      type: 'short',
      q: 'How many prefixes (including the empty string and the string itself) does a string of length 5 have?',
      answer: ['6', 'six'],
      explain: String.raw`A prefix is determined by its length, which can be $0, 1, \ldots, 5$: six prefixes. (Distinct *substrings* are a different story — their number depends on the string.)`,
    },
    {
      type: 'mc',
      q: String.raw`Which description matches $\{0, 01\}^*$ over $\{0,1\}$?`,
      choices: ['Strings in which every 1 is immediately preceded by a 0', 'Strings in which every 0 is immediately followed by a 1', 'Strings with no 00', 'Strings of even length'],
      answer: 0,
      explain: String.raw`In a concatenation of blocks $0$ and $01$, each 1 is the end of an $01$ block, so it is preceded by a 0. Conversely, if every 1 is preceded by a 0, attach each 1 to the 0 before it. "Every 0 is followed by 1" fails for the block $0$ itself; $00 \in \{0,01\}^*$ rules out "no 00".`,
    },
    {
      type: 'tf',
      q: String.raw`If every string in $L$ has even length, then every string in $L^*$ has even length.`,
      answer: true,
      explain: String.raw`A string of $L^*$ is $x_1 x_2 \cdots x_k$ with each $x_i \in L$; by $|uv| = |u| + |v|$ (and induction on $k$) its length is a sum of even numbers, hence even. For $k = 0$ it is $\varepsilon$, of length 0.`,
    },
    {
      type: 'mc',
      q: String.raw`In the base case of the proof that $(wz)^R = z^R w^R$ (induction on $w$), we must show $(\varepsilon z)^R = z^R \varepsilon^R$. Which fact is needed beyond the definitions?`,
      choices: [String.raw`$x\varepsilon = x$ (right identity)`, 'Associativity', String.raw`$(x^R)^R = x$`, String.raw`$|x^R| = |x|$`],
      answer: 0,
      explain: String.raw`$(\varepsilon z)^R = z^R$ by definition of $\bullet$, and $z^R \varepsilon^R = z^R \varepsilon$. To equate them we need $z^R\varepsilon = z^R$ — right identity, which is a theorem (the definition only gives $\varepsilon x = x$). Associativity is needed in the inductive case.`,
    },
    {
      type: 'short',
      q: 'How many distinct substrings (including the empty string) does the string aba have?',
      answer: ['6', 'six'],
      explain: String.raw`$\varepsilon$; $a$, $b$; $ab$, $ba$; $aba$. That is 6. The substring $a$ occurs twice but counts once. Subsequences would add $aa$, for 7.`,
    },
    {
      type: 'multi',
      q: String.raw`Which of these languages equal $\{\varepsilon\}$? (select all that apply; complements are over $\Sigma = \{0,1\}$)`,
      choices: [String.raw`$\varnothing^*$`, String.raw`$\varnothing^+$`, String.raw`$\{\varepsilon\}^+$`, String.raw`$\varnothing \bullet \{\varepsilon\}$`, String.raw`$\overline{\Sigma^+}$`],
      answer: [0, 2, 4],
      explain: String.raw`$\varnothing^* = \{\varepsilon\}$. $\varnothing^+ = \varnothing \bullet \varnothing^* = \varnothing$ (concatenating with $\varnothing$ annihilates). $\{\varepsilon\}^+ = \{\varepsilon\}\{\varepsilon\}^* = \{\varepsilon\}$. $\varnothing\{\varepsilon\} = \varnothing$. $\Sigma^+$ is all non-empty strings, so its complement is $\{\varepsilon\}$.`,
    },
  ],

  flashcards: [
    { front: String.raw`Recursive definition of a string`, back: String.raw`Either $\varepsilon$, or $a \cdot x$ where $a \in \Sigma$ and $x$ is a string.` },
    { front: String.raw`Recursive definition of concatenation`, back: String.raw`$\varepsilon \bullet z = z$; $(a\cdot x)\bullet z = a\cdot(x \bullet z)$. Recursion is on the **left** argument.` },
    { front: String.raw`Recursive definition of reversal`, back: String.raw`$\varepsilon^R = \varepsilon$; $(a\cdot x)^R = x^R \bullet a$.` },
    { front: String.raw`$(wz)^R = \;?$`, back: String.raw`$z^R w^R$ (order flips). Proved by induction on $w$ using associativity and $x\varepsilon = x$.` },
    { front: String.raw`$\varnothing$ vs $\{\varepsilon\}$`, back: String.raw`$\varnothing$ has no strings; $\{\varepsilon\}$ has one (the empty string). $L\varnothing = \varnothing$, $L\{\varepsilon\} = L$.` },
    { front: String.raw`$\varnothing^*$`, back: String.raw`$\{\varepsilon\}$, because $A^0 = \{\varepsilon\}$ for every $A$.` },
    { front: String.raw`Kleene star $A^*$`, back: String.raw`$\bigcup_{n \ge 0} A^n$: all concatenations of zero or more strings from $A$. Always contains $\varepsilon$.` },
    { front: String.raw`Concatenation of languages $AB$`, back: String.raw`$\{xy : x \in A, y \in B\}$. Not commutative; $|AB| \le |A||B|$ (collisions possible).` },
    { front: String.raw`Substring vs subsequence`, back: String.raw`Substring: contiguous ($w = uxv$). Subsequence: obtained by deleting symbols (not necessarily contiguous).` },
    { front: String.raw`Strong induction template for strings`, back: String.raw`Let $w$ be arbitrary; assume claim for all shorter strings. Case $w = \varepsilon$ (direct). Case $w = ax$: unfold definitions, apply IH to $x$, conclude.` },
    { front: String.raw`What does structural induction on an inductively defined $L$ prove?`, back: String.raw`That every string **in** $L$ has a property $P$ (base satisfies $P$, rules preserve $P$). It does not prove the converse.` },
    { front: String.raw`Complement of a language`, back: String.raw`$\overline{L} = \Sigma^* \setminus L$ — always relative to all strings over the alphabet.` },
    { front: String.raw`Recursive definition of $\#(c, w)$`, back: String.raw`$\#(c, \varepsilon) = 0$; $\#(c, ax) = 1 + \#(c,x)$ if $a = c$, else $\#(c, x)$. Additive: $\#(c, wz) = \#(c,w) + \#(c,z)$.` },
    { front: String.raw`$\textit{stutter}$: definition and two facts`, back: String.raw`$\textit{stutter}(\varepsilon) = \varepsilon$, $\textit{stutter}(ax) = aa\,\textit{stutter}(x)$. $|\textit{stutter}(w)| = 2|w|$; $\textit{stutter}(wz) = \textit{stutter}(w)\,\textit{stutter}(z)$.` },
    { front: String.raw`$\textit{odds}$ / $\textit{evens}$ (mutual recursion)`, back: String.raw`$\textit{odds}(ax) = a\,\textit{evens}(x)$, $\textit{evens}(ax) = \textit{odds}(x)$, both $\varepsilon$ on $\varepsilon$. $\textit{odds}(abx) = a\,\textit{odds}(x)$; $|\textit{odds}(w)| = \lceil |w|/2\rceil$.` },
    { front: String.raw`Recipe: prove a rule-defined $L$ equals a description $D$`, back: String.raw`$L \subseteq D$ by structural induction (one case per rule). $D \subseteq L$ by strong induction on $|w|$: decompose $w \in D$ into shorter strings in $D$, apply the IH, reassemble with a rule.` },
    { front: 'The "first return to zero" decomposition', back: String.raw`For a balanced string $w \ne \varepsilon$, let $p$ be its shortest non-empty prefix with $\#0 = \#1$. Then $p = 0x1$ and $w = py$ with $x, y$ balanced and shorter than $w$.` },
    { front: 'Inductive step peels two symbols (w = abx). Base cases?', back: String.raw`Both $w = \varepsilon$ and every one-symbol string $w = a$ — the step cannot reach them.` },
    { front: String.raw`Does concatenation distribute over $\cap$?`, back: String.raw`No: only $A(B\cap C) \subseteq AB \cap AC$. Counterexample $A = \{\varepsilon,a\}$, $B=\{a\}$, $C=\{aa\}$. It does distribute over $\cup$.` },
    { front: String.raw`$(AB)^R$ and $(A^*)^R$`, back: String.raw`$(AB)^R = B^R A^R$ and $(A^*)^R = (A^R)^*$, both from $(xy)^R = y^R x^R$.` },
    { front: String.raw`$w\varepsilon = w$: definition or theorem?`, back: String.raw`Theorem (induction on $w$). Only $\varepsilon w = w$ is part of the definition of concatenation.` },
    { front: 'How to critique a flawed induction proof', back: 'Give a counterexample to the claim (if false) and point to the FIRST step that does not follow, with a concrete instance where it fails (e.g. a decomposition that is not always possible, IH on a non-shorter string, a missing base case).' },
  ],

  problems: [
    {
      id: 'strings-len3', type: 'regex', title: 'Exactly length 3', difficulty: 1,
      alphabet: 'ab',
      prompt: String.raw`Write a regular expression for $\Sigma^3$, the language of all strings over $\{a,b\}$ of length exactly 3. (Recall $\Sigma$ stands for "any one symbol".)`,
      accepts: s => s.length === 3,
      sample: String.raw`ΣΣΣ`,
      hints: [String.raw`$\Sigma^3 = \Sigma \bullet \Sigma \bullet \Sigma$.`],
      solution: String.raw`$\Sigma^3$ is the concatenation of three copies of $\Sigma = \{a, b\}$, so the regex is <code>ΣΣΣ</code>, equivalently <code>(a+b)(a+b)(a+b)</code>. It has $2^3 = 8$ strings.`,
      tags: ['languages', 'concatenation'],
    },
    {
      id: 'strings-concat-finite', type: 'regex', title: 'Concatenating finite languages', difficulty: 1,
      alphabet: 'ab',
      prompt: String.raw`Let $A = \{a, ab\}$ and $B = \{\varepsilon, b\}$. Write a regular expression whose language is **exactly** $A \bullet B$. (Work out the set first.)`,
      accepts: s => ['a', 'ab', 'abb'].includes(s),
      sample: String.raw`a + ab + abb`,
      hints: [String.raw`List all four products $xy$ with $x \in A$, $y \in B$.`, String.raw`One product appears twice.`],
      solution: String.raw`The products are $a\varepsilon = a$, $ab$, $ab\varepsilon = ab$, $abb$. As a set, $AB = \{a, ab, abb\}$, so a regex is <code>a + ab + abb</code> (or <code>(a+ab)(ε+b)</code>, which is the direct translation of $A \bullet B$).`,
      tags: ['concatenation'],
    },
    {
      id: 'strings-star-blocks', type: 'regex', title: 'Every a is followed by b', difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Write a regular expression for the language of strings over $\{a,b\}$ in which **every** $a$ is immediately followed by a $b$. (Hint: express it as $A^*$ for a small finite language $A$.)`,
      accepts: s => !/a(?!b)/.test(s),
      sample: String.raw`(ab+b)*`,
      hints: [String.raw`Chop such a string into blocks. What blocks can you use?`, String.raw`Each $a$ goes with the $b$ right after it; every other $b$ is a block by itself.`],
      solution: String.raw`Any string where every $a$ is immediately followed by $b$ splits uniquely into blocks <code>ab</code> and <code>b</code>: scan left to right; an $a$ starts an <code>ab</code> block, a $b$ not consumed by a preceding $a$ is its own block. Conversely, concatenating such blocks never creates an $a$ without a following $b$. Hence the language is $\{ab, b\}^*$, i.e. <code>(ab+b)*</code>. Note $\varepsilon$ is included (vacuously every $a$ is followed by $b$).`,
      tags: ['kleene star'],
    },
    {
      id: 'strings-nonempty', type: 'regex', title: 'Complement of the empty string', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Over $\Sigma = \{0,1\}$, write a regular expression for $\overline{\{\varepsilon\}}$, the complement of the language containing only the empty string.`,
      accepts: s => s.length >= 1,
      sample: String.raw`ΣΣ*`,
      hints: [String.raw`The complement of $\{\varepsilon\}$ is every string except $\varepsilon$.`],
      solution: String.raw`$\overline{\{\varepsilon\}} = \Sigma^* \setminus \{\varepsilon\} = \Sigma^+ = \Sigma\Sigma^*$, all non-empty strings. Regex: <code>ΣΣ*</code> or <code>(0+1)(0+1)*</code>. A common mistake is to answer <code>∅</code>, confusing $\{\varepsilon\}$ with $\varnothing$ (the complement of $\varnothing$ is $\Sigma^*$).`,
      tags: ['complement'],
    },
    {
      id: 'strings-len-mod3', type: 'regex', title: 'Length 1 mod 3', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for $\{w \in \{0,1\}^* : |w| \bmod 3 = 1\}$.`,
      accepts: s => s.length % 3 === 1,
      sample: String.raw`Σ(ΣΣΣ)*`,
      hints: [String.raw`Lengths $1, 4, 7, \ldots$ = one symbol followed by any number of length-3 blocks.`],
      solution: String.raw`A length $\equiv 1 \pmod 3$ means $|w| = 1 + 3k$. So $w$ is one symbol followed by $k$ blocks of 3 symbols: $\Sigma(\Sigma^3)^*$, i.e. <code>Σ(ΣΣΣ)*</code>.`,
      tags: ['length'],
    },
    {
      id: 'strings-reverse-dfa', type: 'dfa', title: 'Reverse of "starts with 01"', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : w \text{ starts with } 01\}$. Build a DFA for $L^R$. (First describe $L^R$ in words.)`,
      accepts: s => s.endsWith('10'),
      sample: String.raw`start: s
accept: t
s 0 -> s
s 1 -> o
o 0 -> t
o 1 -> o
t 0 -> s
t 1 -> o`,
      hints: [String.raw`$w = 01x$ reverses to $x^R 10$.`, String.raw`So $L^R$ is "ends with 10". Remember the last symbol, and whether the last two were $10$.`],
      solution: String.raw`If $w = 01x$ then $w^R = x^R(01)^R = x^R 10$ (using $(uv)^R = v^R u^R$). Since $x$ ranges over all strings, so does $x^R$; therefore $L^R = \{\text{strings ending in } 10\}$.

DFA states: <code>s</code> = "last symbol was not 1 and we did not just see 10" (start), <code>o</code> = "last symbol was 1", <code>t</code> = "last two symbols were 10" (accept). From any state, reading 1 goes to <code>o</code>; reading 0 goes to <code>t</code> from <code>o</code>, and to <code>s</code> otherwise.`,
      tags: ['reversal'],
    },
    {
      id: 'strings-even-a', type: 'dfa', title: 'Even number of a symbols', difficulty: 1,
      alphabet: 'abc',
      prompt: String.raw`Build a DFA over $\{a,b,c\}$ for $\{w : \#(a, w) \text{ is even}\}$.`,
      accepts: s => (s.split('a').length - 1) % 2 === 0,
      sample: String.raw`start: e
accept: e
e a -> o
e b,c -> e
o a -> e
o b,c -> o`,
      hints: [String.raw`You only need to remember the parity of the number of $a$s seen so far.`],
      solution: String.raw`Two states: <code>e</code> (even number of $a$s so far; start and accepting) and <code>o</code> (odd). Reading $a$ flips the state; reading $b$ or $c$ leaves it unchanged. Note $\varepsilon$ is accepted since 0 is even.`,
      tags: ['counting'],
    },
    {
      id: 'strings-length-proof', type: 'written', title: 'Length of a reversal', difficulty: 1,
      prompt: String.raw`Prove by induction that $|w^R| = |w|$ for every string $w$. You may use the fact $|xz| = |x| + |z|$ (proved in the lesson). Use the strong induction template.`,
      rubric: [
        'States the inductive hypothesis explicitly (for all strings shorter than w)',
        'Base case w = ε handled using the definitions',
        'Inductive case w = ax: unfolds (ax)^R = x^R a, applies |x^R a| = |x^R| + |a|',
        'Applies the IH to x (with justification that |x| < |w|) and concludes |w^R| = |w|',
      ],
      hints: [String.raw`$(ax)^R = x^R \bullet a$; now use the length-of-concatenation fact.`],
      solution: String.raw`Let $w$ be an arbitrary string and assume $|x^R| = |x|$ for every string $x$ with $|x| < |w|$.

- **Case $w = \varepsilon$.** $|\varepsilon^R| = |\varepsilon|$ since $\varepsilon^R = \varepsilon$ by definition.
- **Case $w = ax$.** Then
$$|w^R| = |x^R \bullet a| = |x^R| + |a| = |x| + 1 = 1 + |x| = |ax| = |w|.$$
Justifications: definition of reversal; the length-of-concatenation lemma; the IH (valid as $|x| < |w|$) and $|a| = 1$; definition of length.

In both cases $|w^R| = |w|$, so the claim holds for all strings by induction. $\blacksquare$`,
    },
    {
      id: 'strings-revrev-proof', type: 'written', title: 'Double reversal', difficulty: 2,
      prompt: String.raw`Prove that $(w^R)^R = w$ for every string $w$. You may use the lemma $(xz)^R = z^R x^R$ for all strings $x, z$.`,
      rubric: [
        'Correct strong-induction setup with explicit hypothesis',
        'Base case ε',
        'Inductive case: (ax)^R = x^R a, then applies the reversal-of-concatenation lemma to get a^R (x^R)^R',
        'Uses a^R = a (a one-symbol string reverses to itself) and the IH to conclude ax',
      ],
      hints: [String.raw`Write $w = ax$. Then $(w^R)^R = (x^R a)^R$; apply the lemma with $x^R$ and $a$.`, String.raw`You need $a^R = a$ for a single symbol: $(a\varepsilon)^R = \varepsilon^R a = a$.`],
      solution: String.raw`Let $w$ be arbitrary and assume $(x^R)^R = x$ for all $x$ with $|x| < |w|$.

- **Case $w = \varepsilon$:** $(\varepsilon^R)^R = \varepsilon^R = \varepsilon$.
- **Case $w = ax$:**
$$(w^R)^R = (x^R \bullet a)^R = a^R \bullet (x^R)^R = a \bullet x = w.$$
Steps: definition of reversal; the lemma $(uz)^R = z^R u^R$ with $u = x^R$, $z = a$; $a^R = a$ (since $a = a\cdot\varepsilon$ and $(a\varepsilon)^R = \varepsilon^R \bullet a = a$) together with the IH applied to $x$ (shorter than $w$); finally $a \bullet x = ax$ by definition of concatenation (with $\varepsilon x = x$).

$\blacksquare$`,
    },
    {
      id: 'strings-structural', type: 'written', title: 'Structural induction on a defined language', difficulty: 2,
      prompt: String.raw`Let $L \subseteq \{a,b\}^*$ be the smallest set such that (1) $a \in L$; (2) if $x \in L$ then $bxb \in L$; (3) if $x, y \in L$ then $xby \in L$.

Consider two statements about every $w \in L$: (i) $|w|$ is odd; (ii) $\#(a,w) = \#(b,w) + 1$. Exactly one of them is true for all $w \in L$. Find a counterexample to the false one and prove the true one by structural induction.`,
      rubric: [
        'Correctly identifies that (i) is true and (ii) is false, with a concrete counterexample to (ii) such as bab',
        'Proof of (i) by structural induction (or induction on derivation length) with explicit IH',
        'Handles all three rules: |a| = 1; |bxb| = |x| + 2; |xby| = |x| + |y| + 1 (odd + odd + 1 = odd)',
        'Explains why the IH applies to the sub-strings (they are shorter / derived in fewer steps)',
      ],
      hints: [String.raw`Small members: $a$, $bab$, $aba$, $bbabb$, ...`, String.raw`For (ii), count symbols in $bab$.`],
      solution: String.raw`**Exploring.** $a \in L$; rule 2 gives $bab$; rule 3 with $x = y = a$ gives $aba$. In $bab$: $\#(a) = 1$, $\#(b) = 2$, so (ii) **fails**. (Rule 2 adds two $b$s and no $a$s, which breaks any fixed relationship between the counts.)

**Claim (i): every $w \in L$ has odd length.** Induct on the number of rule applications used to derive $w$. Assume the claim for all strings of $L$ with shorter derivations.
- Rule 1: $w = a$, $|w| = 1$, odd.
- Rule 2: $w = bxb$ with $x \in L$ derived in fewer steps, so $|x|$ is odd by the IH and $|w| = |x| + 2$ is odd.
- Rule 3: $w = xby$ with $x, y \in L$ each derived in fewer steps, so $|x|, |y|$ are odd and $|w| = |x| + |y| + 1$ = odd + odd + 1, which is odd.

So every string of $L$ has odd length. $\blacksquare$

(Inducting on the number of rule applications avoids any worry about whether sub-strings are shorter; here they always are anyway.)`,
    },
    {
      id: 'strings-preceded-by-0', type: 'regex', title: 'Every 1 is preceded by a 0', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Write a regular expression for the binary strings in which every $1$ is **immediately preceded** by a $0$. (Express the language as $A^*$ for a small finite language $A$.)`,
      accepts: s => !s.startsWith('1') && !s.includes('11'),
      sample: String.raw`(0+01)*`,
      hints: [String.raw`Glue each 1 to the 0 just before it. What blocks do you get?`, String.raw`Is $\varepsilon$ in the language? Is $0$? Is $1$?`],
      solution: String.raw`<code>(0+01)*</code>, i.e. $\{0, 01\}^*$.

(Generated $\Rightarrow$ property.) In a concatenation of blocks $0$ and $01$, every 1 is the last symbol of an $01$ block, so the symbol right before it is that block's 0.

(Property $\Rightarrow$ generated.) Scan left to right. Each 1 has a 0 immediately before it; pair them into an $01$ block. Different 1s use different 0s (the 0 before a 1 is not itself a 1, so two 1s cannot share it). Every remaining 0 is a block $0$.

Equivalently, the language is "does not start with 1 and contains no $11$". Note $\varepsilon$ is included (vacuously).`,
      tags: ['kleene star', 'blocks'],
    },
    {
      id: 'strings-third-reverse', type: 'regex', title: 'Reverse of "third symbol is 1"', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Let $L = \{w \in \{0,1\}^* : \text{the third symbol of } w \text{ is } 1\}$ (so every $w \in L$ has length at least 3). Write a regular expression for $L^R$.`,
      accepts: s => s.length >= 3 && s[s.length - 3] === '1',
      sample: String.raw`Σ*1ΣΣ`,
      hints: [String.raw`$L = L(\Sigma\Sigma1\Sigma^*)$. What does reversing do to "position 3 from the left"?`, String.raw`Use $(xyz)^R = z^R y^R x^R$ and the fact that $\Sigma^*$ is closed under reversal.`],
      solution: String.raw`Every $w \in L$ is $w = ab1x$ with $a, b$ symbols and $x$ arbitrary. Then $w^R = x^R\,1\,b\,a$ by the reversal-of-concatenation identity. As $x$ ranges over all strings so does $x^R$, and $b, a$ range over all symbols. So $L^R$ is "the **third symbol from the end** is 1":

<code>Σ*1ΣΣ</code>.

(In general, if $r$ is a regex then reversing the order of every concatenation in $r$ gives a regex for $L(r)^R$; here $\Sigma\Sigma1\Sigma^*$ becomes $\Sigma^*1\Sigma\Sigma$.)`,
      tags: ['reversal'],
    },
    {
      id: 'strings-complement-sorted', type: 'regex', title: 'Complement of 0*1*', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Over $\Sigma = \{0,1\}$, write a regular expression for $\overline{L(0^*1^*)}$, the complement of the language of strings consisting of some 0s followed by some 1s.`,
      accepts: s => s.includes('10'),
      sample: String.raw`Σ*10Σ*`,
      hints: [String.raw`When does a binary string fail to be of the form $0^i1^j$?`, String.raw`Some 1 must come before some 0. Look at the first such place where a 1 is immediately followed by a 0.`],
      solution: String.raw`A string is in $L(0^*1^*)$ iff no 1 appears before a 0. If some 1 is before some 0, then somewhere a 1 is *immediately* followed by a 0 (walk from that 1 to that 0: the symbol changes from 1 to 0 at some step). Conversely an occurrence of $10$ is a 1 before a 0. So

$$\overline{L(0^*1^*)} = \{w : w \text{ contains } 10\} = L(\Sigma^*10\Sigma^*).$$

Common mistakes: <code>1*0*</code> (that is a different language that *overlaps* $0^*1^*$: both contain $\varepsilon$, $0$, $1$) and forgetting that the complement must not contain $\varepsilon$.`,
      tags: ['complement'],
    },
    {
      id: 'strings-short-pal', type: 'regex', title: 'Short palindromes', difficulty: 1,
      alphabet: 'ab',
      prompt: String.raw`Write a regular expression for the set of all palindromes over $\{a,b\}$ of length **at most 3**.`,
      accepts: s => s.length <= 3 && s === s.split('').reverse().join(''),
      sample: String.raw`ε + a + b + aa + bb + aΣa + bΣb`,
      hints: [String.raw`List them by length: 0, 1, 2, 3.`, String.raw`A length-3 palindrome is $cxc$ for symbols $c, x$.`],
      solution: String.raw`Length 0: $\varepsilon$. Length 1: $a$, $b$. Length 2: $aa$, $bb$ (not $ab$, $ba$). Length 3: $cxc$ with $c, x \in \{a,b\}$: $aaa, aba, bab, bbb$. Total 9 strings:

<code>ε + a + b + aa + bb + aΣa + bΣb</code>.

Don't forget $\varepsilon$ — it equals its own reversal.`,
      tags: ['palindromes', 'finite languages'],
    },
    {
      id: 'strings-prefix-ab', type: 'regex', title: 'All prefixes of (ab)*', difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`For a language $L$, let $\textit{Pref}(L) = \{x : xy \in L \text{ for some string } y\}$ be the set of all prefixes of strings in $L$. Write a regular expression for $\textit{Pref}(L)$ where $L = \{ab\}^*$.`,
      accepts: s => /^(ab)*a?$/.test(s),
      sample: String.raw`(ab)*(ε+a)`,
      hints: [String.raw`A prefix of $(ab)^k$ stops either between two blocks or in the middle of a block.`],
      solution: String.raw`A prefix of $(ab)^k$ consists of some number $j \le k$ of whole blocks, possibly followed by the first half of the next block, $a$. So $\textit{Pref}(L) = \{ab\}^*\{\varepsilon, a\}$:

<code>(ab)*(ε+a)</code>.

Conversely each such string is a prefix: $(ab)^j$ is a prefix of itself, and $(ab)^j a$ is a prefix of $(ab)^{j+1}$. Note $\textit{Pref}(L)$ always contains $L$ itself and (if $L \ne \varnothing$) $\varepsilon$.`,
      tags: ['prefixes'],
    },
    {
      id: 'strings-subseq-aba', type: 'regex', title: 'aba as a subsequence', difficulty: 1,
      alphabet: 'ab',
      prompt: String.raw`Write a regular expression for the strings over $\{a,b\}$ that contain $aba$ as a **subsequence** (not necessarily contiguous).`,
      accepts: s => /a.*b.*a/.test(s),
      sample: String.raw`Σ*aΣ*bΣ*aΣ*`,
      hints: [String.raw`Between the chosen $a$, $b$, $a$ anything may appear.`],
      solution: String.raw`$w$ has $aba$ as a subsequence iff $w = u\,a\,v\,b\,x\,a\,y$ for some strings $u, v, x, y$. That is literally <code>Σ*aΣ*bΣ*aΣ*</code>.

Compare with the substring version <code>Σ*abaΣ*</code>: $abba$ has $aba$ as a subsequence but not as a substring. A more "economical" equivalent regex is <code>b*aa*bΣ*aΣ*</code>, obtained by choosing the *first* $a$, the first $b$ after it, and any later $a$.`,
      tags: ['subsequence'],
    },
    {
      id: 'strings-odds-equal-evens', type: 'regex', title: 'odds(w) = evens(w)', difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Recall $\textit{odds}(\varepsilon) = \textit{evens}(\varepsilon) = \varepsilon$, $\textit{odds}(ax) = a\cdot\textit{evens}(x)$ and $\textit{evens}(ax) = \textit{odds}(x)$; so $\textit{odds}(w)$ is the subsequence of symbols at positions $1, 3, 5, \ldots$ and $\textit{evens}(w)$ the subsequence at positions $2, 4, 6, \ldots$. Write a regular expression for $\{w \in \{0,1\}^* : \textit{odds}(w) = \textit{evens}(w)\}$.`,
      accepts: s => { let o = '', e = ''; for (let i = 0; i < s.length; i++) { if (i % 2 === 0) o += s[i]; else e += s[i]; } return o === e; },
      sample: String.raw`(00+11)*`,
      hints: [String.raw`If the two strings are equal, they have equal length. What does that say about $|w|$?`, String.raw`Compare position $2i-1$ with position $2i$.`],
      solution: String.raw`If $\textit{odds}(w) = \textit{evens}(w)$ then their lengths agree: $\lceil |w|/2 \rceil = \lfloor |w|/2 \rfloor$, so $|w|$ is even, say $w = a_1 b_1 a_2 b_2 \cdots a_k b_k$. Then $\textit{odds}(w) = a_1 \cdots a_k$ and $\textit{evens}(w) = b_1 \cdots b_k$, which are equal iff $a_i = b_i$ for every $i$. So $w$ is a concatenation of blocks $00$ and $11$ — equivalently, $w = \textit{stutter}(x)$ for some $x$:

<code>(00+11)*</code>.`,
      tags: ['recursive functions'],
    },
    {
      id: 'strings-parity-trap', type: 'dfa', title: 'Same parity of 0s and 1s', difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Build a DFA for $\{w \in \{0,1\}^* : \#(0,w) \equiv \#(1,w) \pmod 2\}$. Use as few states as you can.`,
      accepts: s => (s.split('0').length - 1) % 2 === (s.split('1').length - 1) % 2,
      sample: String.raw`start: e
accept: e
e 0,1 -> o
o 0,1 -> e`,
      hints: [String.raw`$\#(0,w) + \#(1,w) = |w|$.`, String.raw`Two numbers have the same parity iff their sum is even.`],
      solution: String.raw`Since every symbol is a 0 or a 1, $\#(0,w) + \#(1,w) = |w|$ (provable by induction on $w$). Two integers have the same parity iff their sum is even, so the language is exactly the **even-length** strings. Two states suffice: <code>e</code> (even length so far; start, accepting) and <code>o</code>, with every symbol flipping between them.

The "obvious" 4-state product of two parity counters is correct too, but not minimal: the states (even, even) and (odd, odd) are equivalent, as are (even, odd) and (odd, even).`,
      tags: ['counting', 'dfa'],
    },
    {
      id: 'strings-stutter-proof', type: 'written', title: 'Two facts about stutter', difficulty: 2,
      prompt: String.raw`Define $\textit{stutter}(\varepsilon) = \varepsilon$ and $\textit{stutter}(a \cdot x) = a \cdot a \cdot \textit{stutter}(x)$. Prove, by induction, that for all strings $w, z$:

1. $|\textit{stutter}(w)| = 2|w|$;
2. $\textit{stutter}(wz) = \textit{stutter}(w) \bullet \textit{stutter}(z)$.

You may use associativity of concatenation and $|uv| = |u| + |v|$.`,
      rubric: [
        'Part 1: explicit strong-induction hypothesis; base case ε; case ax unfolds |aa·stutter(x)| = 2 + |stutter(x)| and applies the IH',
        'Part 2: inducts on w with z fixed and arbitrary (the definitions recurse on the left)',
        'Part 2 base case: stutter(εz) = stutter(z) = ε·stutter(z) = stutter(ε)·stutter(z)',
        'Part 2 inductive case: stutter(a(xz)) = aa·stutter(xz) = aa·(stutter(x)stutter(z)) = (aa·stutter(x))stutter(z), with associativity cited',
      ],
      hints: [String.raw`For part 2, which variable do the definitions of $\bullet$ and $\textit{stutter}$ let you take apart? Fix the other one.`, String.raw`$(ax)z = a(xz)$, then unfold $\textit{stutter}$ once.`],
      solution: String.raw`**1.** Let $w$ be arbitrary; assume $|\textit{stutter}(x)| = 2|x|$ for all $x$ shorter than $w$.
- $w = \varepsilon$: $|\textit{stutter}(\varepsilon)| = |\varepsilon| = 0 = 2 \cdot 0$.
- $w = ax$: $|\textit{stutter}(ax)| = |a \cdot a \cdot \textit{stutter}(x)| = 2 + |\textit{stutter}(x)| = 2 + 2|x| = 2(1 + |x|) = 2|w|$, by the definition of stutter, the definition of length (twice), the IH (as $|x| < |w|$), and the definition of length.

**2.** Fix an arbitrary $z$ and induct on $w$. Let $w$ be arbitrary and assume $\textit{stutter}(xz) = \textit{stutter}(x)\,\textit{stutter}(z)$ for all $x$ shorter than $w$.
- $w = \varepsilon$: $\textit{stutter}(\varepsilon z) = \textit{stutter}(z) = \varepsilon \bullet \textit{stutter}(z) = \textit{stutter}(\varepsilon) \bullet \textit{stutter}(z)$ (definition of $\bullet$ twice, definition of stutter).
- $w = ax$:
$$\textit{stutter}((ax)z) = \textit{stutter}(a(xz)) = aa\,\textit{stutter}(xz) = aa\,(\textit{stutter}(x)\,\textit{stutter}(z)) = (aa\,\textit{stutter}(x))\,\textit{stutter}(z) = \textit{stutter}(ax)\,\textit{stutter}(z).$$
Justifications: definition of $\bullet$; definition of stutter; IH for $x$; associativity; definition of stutter.

In both parts every case holds, so both claims hold for all strings. $\blacksquare$`,
      tags: ['induction', 'recursive functions'],
    },
    {
      id: 'strings-stutter-reverse', type: 'written', title: 'Stutter commutes with reversal', difficulty: 3,
      prompt: String.raw`Prove that $\textit{stutter}(w^R) = (\textit{stutter}(w))^R$ for every string $w$. You may use: $\textit{stutter}(xy) = \textit{stutter}(x)\,\textit{stutter}(y)$; $(xy)^R = y^R x^R$; associativity; and the definitions of reversal and stutter.`,
      rubric: [
        'Strong induction on w with an explicit hypothesis',
        'Base case ε',
        'Inductive case w = ax: rewrites stutter((ax)^R) = stutter(x^R a) = stutter(x^R) stutter(a) and applies the IH to x',
        'Shows stutter(a) = aa = (aa)^R and recombines with (uv)^R = v^R u^R to get (aa·stutter(x))^R = stutter(ax)^R',
      ],
      hints: [String.raw`$(ax)^R = x^R \bullet a$, and $\textit{stutter}$ of a concatenation splits.`, String.raw`$\textit{stutter}(a) = aa$, and $(aa)^R = aa$. Now read $(uv)^R = v^R u^R$ backwards.`],
      solution: String.raw`Let $w$ be arbitrary and assume $\textit{stutter}(x^R) = \textit{stutter}(x)^R$ for every $x$ shorter than $w$.

- **$w = \varepsilon$:** $\textit{stutter}(\varepsilon^R) = \textit{stutter}(\varepsilon) = \varepsilon = \varepsilon^R = \textit{stutter}(\varepsilon)^R$.
- **$w = ax$:**
$$\begin{aligned}
\textit{stutter}((ax)^R) &= \textit{stutter}(x^R \bullet a) && \text{def. of reversal}\\
&= \textit{stutter}(x^R)\,\textit{stutter}(a) && \text{stutter of a concatenation}\\
&= \textit{stutter}(x)^R \bullet aa && \text{IH } (|x| < |w|) \text{ and } \textit{stutter}(a) = aa\,\textit{stutter}(\varepsilon) = aa\\
&= \textit{stutter}(x)^R \bullet (aa)^R && (aa)^R = aa\\
&= (aa \bullet \textit{stutter}(x))^R && (uv)^R = v^R u^R \text{ with } u = aa,\ v = \textit{stutter}(x)\\
&= \textit{stutter}(ax)^R && \text{def. of stutter.}
\end{aligned}$$

(For $(aa)^R = aa$: $(a \cdot a\varepsilon)^R = (a\varepsilon)^R \bullet a = (\varepsilon \bullet a) \bullet a = aa$.) Hence the claim holds for all $w$. $\blacksquare$`,
      tags: ['induction', 'reversal'],
    },
    {
      id: 'strings-odds-evens-sum', type: 'written', title: 'odds and evens split the string', difficulty: 2,
      prompt: String.raw`With $\textit{odds}(\varepsilon) = \textit{evens}(\varepsilon) = \varepsilon$, $\textit{odds}(ax) = a\cdot\textit{evens}(x)$, $\textit{evens}(ax) = \textit{odds}(x)$:

1. Prove that $|\textit{odds}(w)| + |\textit{evens}(w)| = |w|$ for every string $w$.
2. Using part 1 and the fact (proved in the lesson) that $|\textit{odds}(w)| = \lceil |w|/2 \rceil$, conclude that $|\textit{evens}(w)| = \lfloor |w|/2 \rfloor$.`,
      rubric: [
        'Recognizes that because odds and evens are mutually recursive, the claim should be about both at once (it is, here: the sum)',
        'Base case ε: 0 + 0 = 0',
        'Inductive case ax: |a·evens(x)| + |odds(x)| = 1 + |evens(x)| + |odds(x)| = 1 + |x|, IH applied to x',
        'Part 2: |evens(w)| = |w| − ⌈|w|/2⌉ = ⌊|w|/2⌋ (any integer n satisfies n = ⌈n/2⌉ + ⌊n/2⌋)',
      ],
      hints: [String.raw`Unfold both functions on $ax$. Notice that each one is defined in terms of the *other* — and the sum swaps the roles harmlessly.`],
      solution: String.raw`**1.** Let $w$ be arbitrary; assume $|\textit{odds}(x)| + |\textit{evens}(x)| = |x|$ for all $x$ shorter than $w$.
- $w = \varepsilon$: $|\varepsilon| + |\varepsilon| = 0 = |\varepsilon|$.
- $w = ax$:
$$|\textit{odds}(ax)| + |\textit{evens}(ax)| = |a \cdot \textit{evens}(x)| + |\textit{odds}(x)| = 1 + |\textit{evens}(x)| + |\textit{odds}(x)| = 1 + |x| = |ax|.$$
(Definitions of odds and evens; definition of length; IH for $x$; definition of length.)

The nice feature: unfolding swaps odds and evens, and the *sum* is symmetric, so the IH applies directly. If we tried to prove a statement about odds alone with single-symbol peeling, the step would produce a statement about evens, and we would need a combined hypothesis anyway.

**2.** For every integer $n \ge 0$, $n = \lceil n/2 \rceil + \lfloor n/2 \rfloor$. So $|\textit{evens}(w)| = |w| - |\textit{odds}(w)| = |w| - \lceil |w|/2 \rceil = \lfloor |w|/2 \rfloor$. $\blacksquare$`,
      tags: ['induction', 'mutual recursion'],
    },
    {
      id: 'strings-astar-bstar-rules', type: 'written', title: 'A rule-defined language equals a*b*', difficulty: 2,
      prompt: String.raw`Let $K \subseteq \{a,b\}^*$ be the smallest set such that (1) $\varepsilon \in K$; (2) if $x \in K$ then $ax \in K$; (3) if $x \in K$ then $xb \in K$. Prove that $K = \{a^i b^j : i, j \ge 0\}$. Prove **both** inclusions.`,
      rubric: [
        'Direction K ⊆ {a^i b^j}: structural induction with one case per rule',
        'Rule 2 case: a·a^i b^j = a^(i+1) b^j; rule 3 case: a^i b^j · b = a^i b^(j+1) (associativity/powers)',
        'Direction {a^i b^j} ⊆ K: induction (e.g. on i + j or on |w|) with a correct decomposition',
        'Handles the cases j > 0 (peel the last b with rule 3), j = 0 and i > 0 (peel the first a with rule 2), and i = j = 0 (rule 1)',
      ],
      hints: [String.raw`For $\supseteq$: given $a^ib^j$ with $i + j > 0$, which rule could have produced it last?`],
      solution: String.raw`Let $D = \{a^i b^j : i, j \ge 0\}$.

**($K \subseteq D$).** Structural induction on the derivation of $w \in K$; assume the claim for strings with shorter derivations.
- Rule 1: $\varepsilon = a^0b^0 \in D$.
- Rule 2: $w = ax$ with $x \in K$, so by the IH $x = a^ib^j$; then $w = a\,a^ib^j = a^{i+1}b^j \in D$.
- Rule 3: $w = xb$ with $x = a^ib^j$ by the IH; then $w = a^ib^j b = a^i b^{j+1} \in D$ (associativity).

**($D \subseteq K$).** Strong induction on $n = i + j$ (the length). Let $w = a^ib^j$ and assume every string of $D$ of length less than $i + j$ is in $K$.
- If $i = j = 0$: $w = \varepsilon \in K$ by rule 1.
- If $j \ge 1$: $w = (a^ib^{j-1})\,b$, and $a^ib^{j-1} \in D$ is shorter, so it is in $K$ by the IH; rule 3 gives $w \in K$.
- If $j = 0$ and $i \ge 1$: $w = a\,a^{i-1}$, and $a^{i-1} \in D$ is shorter, so it is in $K$; rule 2 gives $w \in K$.

Both inclusions hold, so $K = D$. $\blacksquare$`,
      tags: ['structural induction', 'language equality'],
    },
    {
      id: 'strings-palindrome-converse', type: 'written', title: 'Every palindrome is generated', difficulty: 3,
      prompt: String.raw`Let $P \subseteq \{a,b\}^*$ be the smallest set such that $\varepsilon, a, b \in P$ and, if $x \in P$, then $axa \in P$ and $bxb \in P$. The lesson shows every string in $P$ is a palindrome. Prove the converse: **every** $w \in \{a,b\}^*$ with $w = w^R$ is in $P$.

You may use: $(uv)^R = v^R u^R$; every non-empty string can be written as $yd$ for a string $y$ and a symbol $d$; and cancellation (if $cu = cv$ or $uc = vc$ for a symbol $c$, then $u = v$).`,
      rubric: [
        'Strong induction on |w| with an explicit hypothesis about all shorter palindromes',
        'Base cases |w| = 0 and |w| = 1 handled directly (both needed, since the step removes two symbols)',
        'For |w| ≥ 2 writes w = c x d and computes w^R = d x^R c',
        'Concludes c = d and x = x^R (by comparing first symbols and cancelling), applies IH to x, and uses the rule cxc',
      ],
      hints: [String.raw`A palindrome of length $\ge 2$ looks like $c\,x\,d$. What does $w = w^R$ say about $c$, $d$ and $x$?`, String.raw`$(c\,x\,d)^R = d\,x^R\,c$.`],
      solution: String.raw`Let $w$ be a palindrome and assume every palindrome shorter than $w$ is in $P$.

- $|w| = 0$: $w = \varepsilon \in P$.
- $|w| = 1$: $w \in \{a, b\} \subseteq P$.
- $|w| \ge 2$: write $w = c\,y$ with $c$ a symbol; $y$ is non-empty, so $y = x\,d$ for a string $x$ and symbol $d$. Thus $w = c\,x\,d$, and
$$w^R = (c\,(xd))^R = (xd)^R\, c^R = (d^R x^R)\, c = d\,x^R\,c,$$
using $(uv)^R = v^R u^R$ twice and $c^R = c$, $d^R = d$. Since $w = w^R$, we get $c\,x\,d = d\,x^R\,c$. Comparing first symbols, $c = d$. Cancelling the first symbol gives $x\,d = x^R\,c = x^R\,d$, and cancelling the last symbol gives $x = x^R$. So $x$ is a palindrome with $|x| = |w| - 2 < |w|$, hence $x \in P$ by the IH, and $w = c\,x\,c \in P$ by the rule for $c$.

So every palindrome is in $P$; together with the lesson's direction, $P$ is exactly the set of palindromes over $\{a, b\}$. $\blacksquare$`,
      tags: ['structural induction', 'palindromes', 'language equality'],
    },
    {
      id: 'strings-flawed-count', type: 'written', title: 'Find the flaw', difficulty: 2,
      prompt: String.raw`Here is a "proof" of a claim.

**Claim.** For every $w \in \{0,1\}^*$, $\#(0, w) \le \#(1, w) + 1$.

**Proof.** Strong induction on $|w|$. If $|w| \le 1$ then $w \in \{\varepsilon, 0, 1\}$ and the inequality is $0 \le 1$, $1 \le 1$, or $0 \le 2$. Otherwise write $w = xy$ with $x$ and $y$ both non-empty; then both are shorter than $w$, so by the IH $\#(0,x) \le \#(1,x) + 1$ and $\#(0,y) \le \#(1,y) + 1$. Adding, $\#(0,w) = \#(0,x) + \#(0,y) \le \#(1,x) + \#(1,y) + 1 = \#(1,w) + 1$. $\blacksquare$

(a) Show the claim is false. (b) Identify precisely the first step that does not follow, and explain why. (c) Is the decomposition $w = xy$ with both parts non-empty legitimate?`,
      rubric: [
        '(a) Counterexample such as 00 (two 0s, zero 1s: 2 ≤ 1 fails)',
        '(b) The addition step: adding the two IH inequalities gives #1(w) + 2, not #1(w) + 1',
        '(b) Explains concretely, e.g. for w = 00 with x = y = 0 both IH instances hold with equality, and the sum is 2 ≤ 0 + 2',
        '(c) Yes: for |w| ≥ 2 such a split exists, both parts are shorter, and the IH legitimately applies; additivity of # is also fine',
      ],
      hints: [String.raw`Try $w = 00$.`, String.raw`Redo the addition of the two inequalities carefully.`],
      solution: String.raw`(a) $w = 00$: $\#(0,w) = 2$ but $\#(1, w) + 1 = 1$.

(b) The base cases, the decomposition and the use of the IH are all fine; the error is the **arithmetic** in the last line. Adding $\#(0,x) \le \#(1,x) + 1$ and $\#(0,y) \le \#(1,y) + 1$ gives $\#(0,w) \le \#(1,w) + 2$, not $+1$. For $w = 00$ with $x = y = 0$: both IH instances are $1 \le 1$ (true), and the sum is $2 \le 2$, which does not give $2 \le 1$.

(c) Yes. For $|w| \ge 2$ we may take $x$ = first symbol and $y$ = the rest; both are strictly shorter, so the strong IH applies, and $\#(0, xy) = \#(0,x) + \#(0,y)$ is the additivity lemma. The moral: an induction whose inductive step weakens the bound (here, from $+1$ to $+2$) proves nothing, and a false claim must fail *somewhere* — find exactly where.`,
      tags: ['induction', 'flawed proof'],
    },
    {
      id: 'strings-lang-identities', type: 'written', title: 'Prove or disprove: language identities', difficulty: 2,
      prompt: String.raw`For each statement about arbitrary languages $A, B, C$ over $\Sigma$, either prove it (show both inclusions) or give a specific counterexample (concrete languages and a string, with justification).

1. $A(B \cup C) = AB \cup AC$
2. $A(B \cap C) = AB \cap AC$
3. $(A \cup B)^* = A^* \cup B^*$
4. $(AB)^R = B^R A^R$`,
      rubric: [
        '1 true: both inclusions by element chasing (w = xy with y ∈ B or y ∈ C)',
        '2 false: explicit counterexample, e.g. A = {ε, a}, B = {a}, C = {aa}, string aa',
        '3 false: e.g. A = {0}, B = {1}, string 01 is in the left side only (with justification)',
        '4 true: uses the string identity (xy)^R = y^R x^R in both directions',
      ],
      hints: [String.raw`For (2), the trouble is that one string can be split as $xy$ in more than one way. Use a language $A$ containing $\varepsilon$.`],
      solution: String.raw`**1. True.** ($\subseteq$) If $w \in A(B \cup C)$ then $w = xy$ with $x \in A$, $y \in B \cup C$. If $y \in B$ then $w \in AB$; otherwise $y \in C$ and $w \in AC$. ($\supseteq$) If $w \in AB$, $w = xy$ with $x \in A$, $y \in B \subseteq B \cup C$, so $w \in A(B\cup C)$; symmetrically for $AC$.

**2. False.** $A = \{\varepsilon, a\}$, $B = \{a\}$, $C = \{aa\}$. Then $B \cap C = \varnothing$, so $A(B \cap C) = \varnothing$. But $aa = a \cdot a \in AB$ and $aa = \varepsilon \cdot aa \in AC$, so $aa \in AB \cap AC$. (The inclusion $A(B\cap C) \subseteq AB \cap AC$ is always true.)

**3. False.** $A = \{0\}$, $B = \{1\}$. $01 = 0 \cdot 1 \in (A \cup B)^*$. But $A^* = \{0^n\}$ and $B^* = \{1^n\}$, and $01$ is neither all 0s nor all 1s, so $01 \notin A^* \cup B^*$.

**4. True.** $w \in (AB)^R \iff w = (xy)^R$ for some $x \in A, y \in B \iff w = y^R x^R$ for some $x \in A, y \in B$ (by $(xy)^R = y^R x^R$) $\iff w = uv$ for some $u \in B^R$, $v \in A^R$ (take $u = y^R$, $v = x^R$; conversely given $u, v$ take $y = u^R$, $x = v^R$ and use $(z^R)^R = z$) $\iff w \in B^R A^R$.`,
      tags: ['languages', 'identities'],
    },
  ],
});
