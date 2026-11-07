CS374.topic({
  id: 'cfg',
  unit: 'models',
  order: 7,
  title: 'Context-Free Grammars',
  summary: 'Grammars, derivations, parse trees and ambiguity; designing grammars for counting and mirroring languages; proving a grammar correct; closure properties of context-free languages.',
  objectives: [
    'Read and apply the formal definition of a context-free grammar, derivations and parse trees',
    'Design grammars for languages built from matching, mirroring, counting, unions and concatenations',
    'Recognize ambiguity and, for simple grammars, give an equivalent unambiguous grammar',
    'Prove that a grammar generates exactly a given language (both inclusions, by induction)',
    'State and use the closure properties of context-free languages, including the failures (intersection, complement)'
  ],
  lesson: String.raw`## From finite memory to recursion

Regular languages can only remember a bounded amount of information. Languages like $\{0^n1^n\}$, palindromes and balanced parentheses need *nesting*: every 0 must be matched with a 1 that comes later, in mirrored order. Context-free grammars describe exactly this kind of recursive structure — they are the formalism behind the syntax of almost every programming language.

## Definitions

> **Definition.** A **context-free grammar** (CFG) is a tuple $G = (V, \Sigma, R, S)$ where
> - $V$ is a finite set of **nonterminals** (variables),
> - $\Sigma$ is a finite set of **terminals** (the alphabet), disjoint from $V$,
> - $R$ is a finite set of **production rules** of the form $A \to \alpha$ with $A \in V$ and $\alpha \in (V \cup \Sigma)^*$,
> - $S \in V$ is the **start symbol**.

We write $A \to \alpha_1 \mid \alpha_2 \mid \cdots$ to abbreviate several rules with the same left side. In this app nonterminals are uppercase letters (optionally with digits or primes), terminals are other single characters, and $\varepsilon$ is written <code>ε</code> or <code>eps</code>.

> **Definition.** For strings $u, v \in (V \cup \Sigma)^*$, $u$ **yields** $v$ in one step, written $u \Rightarrow v$, if $u = xAy$ and $v = x\alpha y$ for some rule $A \to \alpha$. We write $u \Rightarrow^* v$ if $v$ can be reached from $u$ in zero or more steps. The **language** of $G$ is
> $$L(G) = \{w \in \Sigma^* : S \Rightarrow^* w\}.$$
> A language is **context-free** if some CFG generates it.

"Context-free" means a nonterminal can be rewritten regardless of what surrounds it.

**Example.** $G$: $S \to 0S1 \mid \varepsilon$. Then
$$S \Rightarrow 0S1 \Rightarrow 00S11 \Rightarrow 000S111 \Rightarrow 000111,$$
and $L(G) = \{0^n1^n : n \ge 0\}$. Try it:

~~~cfg
alphabet: 01
S -> 0 S 1 | ε
~~~

## Derivations and parse trees

A **leftmost derivation** always rewrites the leftmost nonterminal. A **parse tree** records a derivation while forgetting the order of independent steps: the root is $S$, each internal node is a nonterminal $A$ whose children, read left to right, are the right side of a rule $A \to \alpha$, and the leaves (read left to right) spell the generated string (with $\varepsilon$-leaves contributing nothing).

Parse trees, leftmost derivations and rightmost derivations are in one-to-one correspondence: each parse tree has exactly one leftmost derivation and vice versa.

**Example.** With $S \to SS \mid (S) \mid \varepsilon$ the string <code>()()</code> has the leftmost derivation
$$S \Rightarrow SS \Rightarrow (S)S \Rightarrow ()S \Rightarrow ()(S) \Rightarrow ()().$$

## Ambiguity

> **Definition.** A grammar $G$ is **ambiguous** if some string $w \in L(G)$ has two different parse trees (equivalently, two different leftmost derivations).

Ambiguity is a property of the *grammar*, not of the language. The classic example is arithmetic:
$$E \to E + E \mid E * E \mid x$$
The string <code>x+x*x</code> has two parse trees: one with $+$ at the root (meaning $x + (x * x)$), one with $*$ at the root (meaning $(x+x)*x$). Compilers need one meaning, so we use an unambiguous grammar that encodes precedence and associativity with layers:

~~~cfg
alphabet: x+*()
E -> E + T | T
T -> T * F | F
F -> x | ( E )
~~~

Other small examples:

- $S \to SS \mid a$ is ambiguous: <code>aaa</code> can be split as $(aa)a$ or $a(aa)$. The language $a^+$ also has the unambiguous grammar $S \to aS \mid a$.
- $S \to SS \mid (S) \mid \varepsilon$ is ambiguous (even <code>()</code> has infinitely many parse trees, via $S \to SS \to S$ with an $\varepsilon$). The unambiguous grammar $S \to (S)S \mid \varepsilon$ generates the same balanced-parentheses language: every nonempty balanced string splits *uniquely* as $(x)y$ where $(x)$ is its shortest nonempty balanced prefix.

> **Theorem.** Some context-free languages are **inherently ambiguous**: every grammar for them is ambiguous. A standard example is $\{a^ib^jc^k : i = j \text{ or } j = k\}$ (strings $a^nb^nc^n$ are generated "both ways"). Deciding whether a given CFG is ambiguous is undecidable.

> **Exam tip.** To show a grammar is ambiguous, exhibit **one specific string** and **two different parse trees** (or two leftmost derivations) for it. To show a grammar is unambiguous you need an argument that every string has a unique decomposition.

**Why the balanced grammar $S \to (S)S \mid \varepsilon$ is unambiguous (full argument).** Induction on $|w|$. The empty string has one parse tree (rule $S \to \varepsilon$; the other rule produces a nonempty string). For nonempty $w$, the root must use $S \to (S)S$, so $w = (x)y$ where $x$ and $y$ are generated by $S$ and hence balanced. The ) produced by the root closes the first (: since $x$ is balanced, every nonempty prefix of $(x$ has strictly more ( than ), so the first point at which a prefix of $w$ is balanced is exactly after $(x)$. That point is determined by $w$ alone, so $x$ and $y$ are determined, and by induction each has a unique parse tree. Hence so does $w$. The same "the split point is forced" argument is the template for almost every unambiguity proof.

**Try it first.** Is $S \to aSb \mid aSbb \mid \varepsilon$ ambiguous? What language does it generate? If it is ambiguous, give an unambiguous grammar for the same language.

~~~~reveal Solution
**Ambiguous.** The string $aabbb$ has two leftmost derivations:
$$S \Rightarrow aSb \Rightarrow a\,aSbb\,b \Rightarrow aabbb \qquad\text{and}\qquad S \Rightarrow aSbb \Rightarrow a\,aSb\,bb \Rightarrow aabbb.$$
The root uses a different rule in each, so these are different parse trees.

**Language.** Using $aSb$ $p$ times and $aSbb$ $q$ times (in any order) gives $a^{p+q}b^{p+2q}$, so $L = \{a^ib^j : i \le j \le 2i\}$ (given such $i, j$, take $q = j - i$ and $p = 2i - j$).

**Unambiguous grammar.** The ambiguity comes from the freedom to interleave the two rule types. Force an order — all single-$b$ steps outside, all double-$b$ steps inside:
~~~pseudo
S -> a S b | T        S: a^p (a^q b^2q) b^p
T -> a T bb | ε       T: a^q b^2q
~~~
A string $a^ib^j$ in $L$ forces $q = j - i$ and $p = 2i - j$, and the shape of the derivation (first $p$ steps of $S \to aSb$, then $S \to T$, then $q$ steps of $T \to aTbb$, then $T \to \varepsilon$) is completely determined by $p$ and $q$. So every string has exactly one parse tree.
~~~~

~~~~steps Removing ambiguity from an expression grammar, step by step
**The problem.** $E \to E + E \mid E * E \mid (E) \mid x$ is ambiguous in two ways: *precedence* (<code>x+x*x</code> could mean $(x+x)*x$) and *associativity* (<code>x+x+x</code> could group either way). We want one parse tree per string, and we want it to be the "right" one: $*$ binds tighter than $+$, and both group to the left.
+++
**One nonterminal per precedence level.** Introduce a nonterminal for each level, from loosest to tightest:
- $E$ — an *expression*: a sum of one or more terms;
- $T$ — a *term*: a product of one or more factors;
- $F$ — a *factor*: an atom, $x$ or a parenthesized expression.

A $+$ can only appear at the $E$ level and a $*$ only at the $T$ level, so a $*$ can never be "above" a $+$ unless parentheses intervene.
+++
**Left recursion for left associativity.** Write the lists as $E \to E + T \mid T$ and $T \to T * F \mid F$. The *rightmost* $+$ outside parentheses is the one at the root, so <code>x+x+x</code> is forced to parse as $(x+x)+x$. (Writing $E \to T + E$ instead would give right associativity — also unambiguous, but the wrong meaning for subtraction.)
+++
**The grammar.**
~~~cfg
alphabet: x+*()
E -> E + T | T
T -> T * F | F
F -> x | ( E )
~~~
Try <code>x+x*x</code> in the widget: the only parse tree has $+$ at the root and $x*x$ as its right term.
+++
**Why it is unambiguous (sketch).** For a string derived from $E$, look at the $+$ signs that are not inside parentheses. If there are none, the root must use $E \to T$. Otherwise the root must use $E \to E + T$ with the **last** such $+$ (because $T$ cannot generate an unparenthesized $+$). So the root rule and the split are forced; the same argument applies to $T$ and $*$, and to $F$ (a string of $F$ is either $x$ or starts with a parenthesis). Induction on length finishes the proof.
~~~~

## Designing grammars

Think of each nonterminal as a *language* with an English description. Write that description down next to each nonterminal — graders love it, and it keeps you honest.

### Matching from the outside in

$\{0^n1^n\}$: $S \to 0S1 \mid \varepsilon$. Each rule application adds one matched pair around the middle.

**Palindromes** over $\{a, b\}$: a palindrome is empty, a single symbol, or $c\,w\,c$ for a symbol $c$ and a palindrome $w$:
$$S \to aSa \mid bSb \mid a \mid b \mid \varepsilon$$
Dropping $a \mid b$ gives the even-length palindromes $\{ww^R\}$.

### Balanced strings and equal counts

**Balanced parentheses:** $S \to (S)S \mid \varepsilon$.

**Equal numbers of $a$ and $b$:** $S \to aSbS \mid bSaS \mid \varepsilon$. Intuition: plot $\#_a - \#_b$ over the prefixes; a nonempty string with equal counts returns to 0 for the first time after some prefix $a\,x\,b$ (or $b\,x\,a$), and both $x$ and the remainder have equal counts.

~~~cfg
alphabet: ab
S -> a S b S | b S a S | ε
~~~

### Inequalities

$\{0^i1^j : i \ne j\}$: either more 0s or more 1s. Generate the matched part, then *at least one* extra symbol on one side:
$$S \to 0S1 \mid A \mid B, \qquad A \to 0A \mid 0, \qquad B \to 1B \mid 1$$
Here $A$ generates $0^+$ and $B$ generates $1^+$.

$\{0^i1^j : i \le 2j\}$: each 1 may "pay for" zero, one or two 0s:
$$S \to 00S1 \mid 0S1 \mid S1 \mid \varepsilon$$
Every derivation produces $0^{2p+q}1^{p+q+r}$ where $p, q, r$ count the three rule types, so $i = 2p + q \le 2(p+q+r) = 2j$. Conversely, given $i \le 2j$, use $p = \lfloor i/2 \rfloor$, $q = i \bmod 2$, $r = j - p - q \ge 0$.

### Unions and concatenations

If $S_1$ and $S_2$ are start symbols of grammars with **disjoint** nonterminals:
- **union:** add $S \to S_1 \mid S_2$;
- **concatenation:** add $S \to S_1 S_2$;
- **star:** add $S \to S_1 S \mid \varepsilon$.

**Example.** $\{a^ib^jc^k : j = i + k\} = \{a^ib^i\,b^kc^k\}$: $S \to XY$, $X \to aXb \mid \varepsilon$, $Y \to bYc \mid \varepsilon$.

**Example.** $\{a^ib^jc^k : i = j \text{ or } j = k\}$: $S \to XC \mid AY$ with $X \to aXb \mid \varepsilon$, $C \to cC \mid \varepsilon$, $A \to aA \mid \varepsilon$, $Y \to bYc \mid \varepsilon$.

> **Key idea.** Decompose the language into pieces you already know (matched blocks, free blocks like $c^*$, mirrored strings), give each piece its own nonterminal, and glue them with concatenation and union.

**Why the union / concatenation / star constructions are correct.** Let $G_1, G_2$ have start symbols $S_1, S_2$ and *disjoint* nonterminal sets. In the union grammar, a derivation from $S$ starts with $S \to S_1$ or $S \to S_2$; after that, only rules of one grammar can ever apply (the nonterminals never mix), so $S \Rightarrow^* w$ iff $S_1 \Rightarrow^* w$ or $S_2 \Rightarrow^* w$. In the concatenation grammar, the sentential form $S_1S_2$ rewrites its two halves independently (that is exactly what *context-free* buys us), so the generated strings are $\{uv : S_1 \Rightarrow^* u,\ S_2 \Rightarrow^* v\}$. For star, $S \to S_1S \mid \varepsilon$ unrolls to $S \Rightarrow^* S_1^k$ for every $k$, giving $L(G_1)^k$. Disjointness is essential: if $G_1$ and $G_2$ both used a nonterminal $A$ with different rules, the combined grammar could mix them and generate strings in neither language.

**Try it first.** Give grammars for (a) $\{a^ib^jc^k : i = 2k\}$ and (b) $\{a^ib^jc^k : j \ge i + k\}$.

~~~~reveal Solution
**(a)** The $a$'s match the $c$'s (two $a$'s per $c$), with a free block of $b$'s in the middle:
~~~pseudo
S -> a a S c | B      S: a^2k B c^k
B -> b B | ε          B: b^*
~~~
**(b)** Split the $b$'s: $b^j = b^i\,b^m\,b^k$ with $m = j - i - k \ge 0$. So the language is $\{a^ib^i\}\cdot b^*\cdot\{b^kc^k\}$:
~~~pseudo
S -> X B Y
X -> a X b | ε        X: a^i b^i
B -> b B | ε          B: b^m
Y -> b Y c | ε        Y: b^k c^k
~~~
Both inclusions are immediate from the decomposition: every derived string is $a^ib^{i+m+k}c^k$ with $m \ge 0$, and every string in the language decomposes that way with $m = j - i - k$.
~~~~

~~~~steps Designing a grammar piece by piece: $\{a^mb^nc^pd^q : m + n = p + q\}$
**Understand the constraint.** Every $a$ or $b$ must be "paid for" by a $c$ or $d$. The outermost symbols are $a$ (left) and $d$ (right), so start matching from the outside: pair $a$'s with $d$'s as long as both exist.
+++
**Case split on which runs out first.** After peeling $\min(m, q)$ pairs of $a \ldots d$:
- if $m \ge q$, the $d$'s are gone: what remains is $a^{m-q}b^nc^p$ with $(m - q) + n = p$;
- if $m < q$, the $a$'s are gone: what remains is $b^nc^pd^{q-m}$ with $n = p + (q - m)$.
+++
**Solve each remaining piece.** $a^rb^nc^{r+n} = a^r(b^nc^n)c^r$: match $a$'s with the *outer* $c$'s, then $b$'s with the inner $c$'s. Symmetrically $b^{s+p}c^pd^s = b^s(b^pc^p)d^s$.
+++
**Assemble, naming every nonterminal.**
~~~pseudo
S -> a S d | X | Y    S: peel a...d pairs
X -> a X c | Z        X: a^r (b^n c^n) c^r
Y -> b Y d | Z        Y: b^s (b^p c^p) d^s
Z -> b Z c | ε        Z: b^n c^n
~~~
+++
**Test it.** Shortest strings should include $\varepsilon$, $ad$, $ac$, $bd$, $bc$, $abcd$, $aacc$... and must exclude $ab$, $cd$, $abc$:
~~~cfg
alphabet: abcd
S -> a S d | X | Y
X -> a X c | Z
Y -> b Y d | Z
Z -> b Z c | ε
~~~
+++
**Argue both inclusions.** *Sound:* a derivation gives $a^k\,a^r b^n c^n c^r\,d^k$ (with $m = k + r$, $p = n + r$, $q = k$, so $m + n = p + q$) or $a^k\,b^s b^p c^p d^s\,d^k$ (with $m = k$, $n = s + p$, $q = s + k$, again $m + n = p + q$). *Complete:* the case split in step 2 shows every string of the language has one of these two shapes.
~~~~

### Worked example: strings that are *not* palindromes

Complements are usually hard for grammars, but this one has a clean structure. Compare a string with its reversal from the outside in: $w$ is not a palindrome exactly when, after peeling off some number of matching outer pairs, we reach a pair of **different** symbols — and after that, the middle can be anything.

$$S \to aSa \mid bSb \mid aTb \mid bTa, \qquad T \to aT \mid bT \mid \varepsilon$$

Here $T$ generates $\{a,b\}^*$ ("anything"), and $S$ means "a non-palindrome". The rules $aSa$, $bSb$ peel matching outer pairs; $aTb$ and $bTa$ record the first mismatch. There is no rule $S \to \varepsilon$, because the empty string and single symbols are palindromes.

~~~cfg
alphabet: ab
S -> a S a | b S b | a T b | b T a
T -> a T | b T | ε
~~~

*Why it is correct.* ($\subseteq$) Every derivation ends by using $aTb$ or $bTa$ at some depth $k$, producing $u\,c\,t\,d\,u^R$ with $|u| = k$, $c \ne d$; then position $k+1$ from the left holds $c$ and position $k+1$ from the right holds $d$, so the string is not a palindrome. ($\supseteq$) If $w \ne w^R$, let $k$ be the number of outer pairs that match before the first mismatch; $w = u\,c\,t\,d\,u^R$ with $c \ne d$, which the grammar derives by $k$ peeling steps, one mismatch step, and $T \Rightarrow^* t$.

### A design checklist

1. Write an English description of the language and of each nonterminal.
2. Identify the *outermost* structure: matched from the outside in? A concatenation of independent blocks? A union of cases?
3. Handle the base cases ($\varepsilon$, single symbols) deliberately — off-by-one errors here are the most common bug.
4. Test small strings: generate the shortest few strings by hand (or with the widget) and check a couple of strings that should be *excluded*.

## Proving that a grammar is correct

To prove $L(G) = L$ you must prove **two inclusions**:

1. **Soundness,** $L(G) \subseteq L$: everything the grammar generates is in $L$. Usually by induction on the length of the derivation, proving a stronger statement about *sentential forms* or about every nonterminal.
2. **Completeness,** $L \subseteq L(G)$: every string in $L$ can be generated. Usually by strong induction on $|w|$, decomposing $w$ to match a rule.

**Example.** Let $G$: $S \to 0S1 \mid \varepsilon$ and $L = \{0^n1^n : n \ge 0\}$.

*Soundness.* Claim: every sentential form derivable from $S$ is either $0^nS1^n$ or $0^n1^n$ for some $n \ge 0$. Induction on the number of steps: $S = 0^0S1^0$. A step from $0^nS1^n$ produces $0^{n+1}S1^{n+1}$ or $0^n1^n$; a string with no $S$ cannot step. So every terminal string derived is $0^n1^n \in L$.

*Completeness.* Induction on $n$: $\varepsilon = 0^01^0$ via $S \to \varepsilon$. If $S \Rightarrow^* 0^{n-1}1^{n-1}$, then $S \Rightarrow 0S1 \Rightarrow^* 0\,0^{n-1}1^{n-1}\,1 = 0^n1^n$.

**Example (equal counts).** $G$: $S \to aSbS \mid bSaS \mid \varepsilon$, $L = \{w \in \{a,b\}^* : \#_a(w) = \#_b(w)\}$.

*Soundness* by strong induction on derivation length: if $S \Rightarrow^* w$ starts with $S \to aSbS$, then $w = a\,x\,b\,y$ where $S \Rightarrow^* x$ and $S \Rightarrow^* y$ by shorter derivations, so $x, y \in L$ and $w$ has $1 + \#_a(x) + \#_a(y) = 1 + \#_b(x) + \#_b(y)$ of each letter. Symmetric for $bSaS$; trivial for $\varepsilon$.

*Completeness* by strong induction on $|w|$. If $w = \varepsilon$, use $S \to \varepsilon$. Otherwise suppose $w$ starts with $a$ (the case $b$ is symmetric). Let $d(u) = \#_a(u) - \#_b(u)$. Along the prefixes of $w$, $d$ starts at 0, becomes 1 after the first symbol, changes by $\pm 1$ each step and ends at $0$. Let $p$ be the shortest nonempty prefix with $d(p) = 0$; the step into $p$ decreased $d$ from 1 to 0, so $p = a\,x\,b$, and $d(x) = 0$. Write $w = a\,x\,b\,y$; then $d(y) = d(w) - d(p) = 0$. Both $x$ and $y$ are shorter than $w$ and in $L$, so by induction $S \Rightarrow^* x$ and $S \Rightarrow^* y$, giving $S \Rightarrow aSbS \Rightarrow^* axby = w$. $\blacksquare$

> **Warning.** A common error is proving only one inclusion. "Every string the grammar generates has equal counts" does *not* show the grammar generates *all* such strings ($S \to aSb \mid \varepsilon$ is sound for this $L$ but misses <code>ba</code>).

**Try it first.** Let $G$ be $S \to SS \mid (S) \mid \varepsilon$ and let $B$ be the set of balanced strings: equal numbers of ( and ), and no prefix with more ) than (. Prove $L(G) = B$.

~~~reveal Solution
Write $d(u) = \#_{(}(u) - \#_{)}(u)$ (the *depth*). Then $u \in B$ iff $d(u) = 0$ and $d(p) \ge 0$ for every prefix $p$ of $u$.

**$L(G) \subseteq B$** (strong induction on the length of the derivation). If the first step is $S \to \varepsilon$, we get $\varepsilon \in B$. If it is $S \to (S)$, the string is $(x)$ with $x \in L(G)$ derived by a shorter derivation, so $x \in B$; then $d((x)) = 0$, and a prefix of $(x)$ is $\varepsilon$, or $(p$ for a prefix $p$ of $x$ (depth $1 + d(p) \ge 1$), or the whole string — all nonnegative. If it is $S \to SS$, the string is $xy$ with $x, y \in B$ by induction; $d(xy) = 0$, and a prefix is either a prefix of $x$ or $x$ followed by a prefix of $y$, with depth $0 + d(\cdot) \ge 0$.

**$B \subseteq L(G)$** (strong induction on $|w|$). If $w = \varepsilon$, use $S \to \varepsilon$. Otherwise $w$ starts with ( (a first ) would have depth $-1$). Let $p$ be the shortest nonempty prefix with $d(p) = 0$ (it exists because $d(w) = 0$).
- If $p = w$: then $w = (x)$, and every prefix of $w$ other than $\varepsilon$ and $w$ has depth $\ge 1$, so every prefix of $x$ has depth $\ge 0$ and $d(x) = 0$: $x \in B$, shorter, so $S \Rightarrow (S) \Rightarrow^* (x)$.
- If $p \ne w$: then $w = p\,y$ with $p, y$ nonempty, $p \in B$, and $y \in B$ (its depth is $0$, and its prefixes have depth $d(py') - d(p) \ge 0$). Both are shorter, so $S \Rightarrow SS \Rightarrow^* py$. $\blacksquare$
~~~

## Closure properties

> **Theorem.** Context-free languages are closed under **union**, **concatenation**, **Kleene star**, **reversal**, and **intersection with a regular language**. They are **not** closed under **intersection**, **complement**, or set difference.

- **Union / concatenation / star:** the constructions above (with disjoint nonterminals).
- **Reversal:** reverse the right side of every rule. By induction on derivations, $A \Rightarrow^* w$ in the old grammar iff $A \Rightarrow^* w^R$ in the new one.
- **Intersection with a regular language:** run a PDA for $L$ and a DFA for $R$ in parallel. The product machine's states are pairs (PDA state, DFA state); on reading a symbol both components move, on an $\varepsilon$-move only the PDA component moves; it still uses a single stack, so it is a PDA. It accepts iff both components accept.
- **Image under a homomorphism** (replace each terminal by a fixed string) also preserves context-freeness: substitute in every rule.

### Full proof: CFLs are not closed under intersection

> **Theorem.** There are context-free languages $L_1, L_2$ such that $L_1 \cap L_2$ is not context-free.

*Proof.* Let $L_1 = \{a^nb^nc^m : n, m \ge 0\}$ and $L_2 = \{a^mb^nc^n : n, m \ge 0\}$.
1. $L_1$ is context-free: $S \to XC$, $X \to aXb \mid \varepsilon$, $C \to cC \mid \varepsilon$ ($X$ generates $a^nb^n$, $C$ generates $c^*$, concatenation). Symmetrically $L_2$: $S \to AY$, $A \to aA \mid \varepsilon$, $Y \to bYc \mid \varepsilon$.
2. $L_1 \cap L_2 = \{a^nb^nc^n\}$: both languages consist only of strings $a^ib^jc^k$; such a string is in $L_1$ iff $i = j$ and in $L_2$ iff $j = k$, so it is in both iff $i = j = k$.
3. $\{a^nb^nc^n\}$ is not context-free (a standard fact, proved with the pumping lemma for CFLs: a parse tree for a long string has a repeated nonterminal on some root-to-leaf path, and pumping the two subtrees changes at most two of the three blocks).

So $L_1, L_2$ are CF while their intersection is not. $\blacksquare$

**Complement.** Suppose CFLs were closed under complement. Then for any CFLs $L_1, L_2$, the languages $\overline{L_1}$, $\overline{L_2}$, $\overline{L_1} \cup \overline{L_2}$ and finally $\overline{\overline{L_1} \cup \overline{L_2}} = L_1 \cap L_2$ would all be CF, contradicting the theorem. **Difference** fails too, since $\overline{L} = \Sigma^* \setminus L$.

Interesting consequences: $\{ww : w \in \{a,b\}^*\}$ is **not** context-free, but its complement **is** (odd-length strings, plus even-length strings with a mismatch between the halves). And the complement of $\{a^nb^nc^n\}$ is CF: it is $\overline{a^*b^*c^*} \cup \{a^ib^jc^k : i \ne j\} \cup \{a^ib^jc^k : j \ne k\}$.

### Using closure in both directions

- **To prove $L$ is CF:** express it with union, concatenation, star, reversal and intersection *with a regular language*, starting from languages you already have grammars for.
- **To prove $L$ is NOT CF:** intersect it with a cleverly chosen *regular* language (or apply another closure operation) to get a known non-CF language. If $L$ were CF, the result would be CF too. Example: $L = \{w \in \{a,b,c\}^* : \#_a(w) = \#_b(w) = \#_c(w)\}$ is not CF, because $L \cap a^*b^*c^* = \{a^nb^nc^n\}$.

> **Warning.** "$L \subseteq L'$ and $L'$ is CF" proves nothing about $L$ (every language over $\Sigma$ is a subset of $\Sigma^*$). And "$L = L_1 \cap L_2$ with both CF" proves nothing either — you may only intersect with a **regular** language.

**Try it first.** Prove that $P_3 = \{w \in \{a,b\}^* : w = w^R \text{ and } |w| \text{ is divisible by } 3\}$ is context-free, without writing a grammar. Then prove that $\{w\,c\,w : w \in \{a,b\}^*\}$ is not context-free, assuming that $\{a^nb^mc\,a^nb^m : n, m \ge 0\}$ is not.

~~~reveal Solution
**$P_3$ is CF.** $P_3 = \mathrm{PAL} \cap R$ where $\mathrm{PAL}$ (palindromes, grammar $S \to aSa \mid bSb \mid a \mid b \mid \varepsilon$) is CF and $R = \{w : |w| \equiv 0 \pmod 3\}$ is regular (a 3-state DFA counting the length mod 3). A CFL intersected with a regular language is CF.

**$\{wcw\}$ is not CF.** Suppose it were. Intersect with the regular language $a^*b^*c\,a^*b^*$: a string $wcw$ lies in it iff $w \in a^*b^*$, so the intersection is $\{a^nb^m c\,a^nb^m\}$, which would then be CF — contradicting the assumption. $\blacksquare$
~~~

## Regular languages are context-free

> **Theorem.** Every regular language is context-free, and the inclusion is strict.

*Proof.* Given a DFA $(Q, s, A, \delta)$, make a nonterminal for each state, start symbol $s$, a rule $q \to a\,r$ for every transition $\delta(q, a) = r$, and $q \to \varepsilon$ for each $q \in A$. This is a **right-linear** grammar: every sentential form is a terminal string followed by at most one nonterminal.

*Lemma: $q \Rightarrow^* w\,r$ iff $\delta^*(q, w) = r$.* Induction on $|w|$. For $w = \varepsilon$: every rule either adds a terminal or deletes the nonterminal, so $q \Rightarrow^* r$ (a form consisting of a single nonterminal) holds iff $q = r = \delta^*(q, \varepsilon)$. For $w = ax$: any derivation of $a\,x\,r$ from $q$ begins with the unique rule $q \to a\,p$ with $p = \delta(q, a)$ and continues with $p \Rightarrow^* x\,r$; by induction this happens iff $\delta^*(p, x) = r$, i.e. iff $\delta^*(q, ax) = r$.

A terminal string is produced only by a final step $r \to \varepsilon$ with $r \in A$. So $s \Rightarrow^* w$ iff $\delta^*(s, w) \in A$, i.e. $L(G) = L(M)$. Strictness: $\{0^n1^n\}$ is context-free but not regular. $\blacksquare$

Conversely, every right-linear grammar can be read as an NFA (states = nonterminals, $A \xrightarrow{a} B$ for each rule $A \to aB$, accepting states = nonterminals with an $\varepsilon$-rule), so right-linear grammars generate exactly the regular languages.

**Try it first.** Convert the DFA for "even number of $a$'s" over $\{a, b\}$ into a grammar, and use the lemma to explain why <code>abab</code> is generated but <code>ab</code> is not.

~~~~reveal Solution
States $E$ (even, start, accepting) and $O$ (odd).
~~~cfg
alphabet: ab
E -> a O | b E | ε
O -> a E | b O
~~~
$E \Rightarrow aO \Rightarrow abO \Rightarrow abaE \Rightarrow ababE \Rightarrow abab$: the derivation follows the run $E \xrightarrow{a} O \xrightarrow{b} O \xrightarrow{a} E \xrightarrow{b} E$ and finishes with $E \to \varepsilon$. For <code>ab</code>, the only derivation of a form $ab\,r$ is $E \Rightarrow aO \Rightarrow abO$, and $O$ has no $\varepsilon$-rule, so <code>ab</code> cannot be finished — exactly because the DFA ends in the rejecting state $O$.
~~~~

## Beyond grammars: PDAs and normal forms (brief)

- A **pushdown automaton** (PDA) is an NFA with a stack. Nondeterministic PDAs accept exactly the context-free languages. *Deterministic* PDAs are strictly weaker (they cannot do even-length palindromes, which need to guess the middle).
- **Chomsky normal form** (CNF): every rule is $A \to BC$ or $A \to a$ (plus $S \to \varepsilon$ if needed, with $S$ never on a right side). Every CFG can be converted to CNF. In CNF, every derivation of a string of length $n \ge 1$ takes exactly $2n - 1$ steps, and the **CYK** dynamic-programming algorithm decides membership in $O(n^3)$ time for a fixed grammar.
- Non-context-free languages include $\{a^nb^nc^n\}$, $\{ww\}$ and $\{0^{n^2}\}$ (provable with a pumping lemma for CFLs; not emphasized in this course).
- Membership ("is $w \in L(G)$?") and emptiness ("is $L(G) = \emptyset$?") are **decidable** for CFGs; equivalence of two CFGs and "does $G$ generate every string?" are **undecidable** (see the undecidability topic).

## Common exam problem patterns

| Pattern | Recipe |
|---|---|
| **Counting with equality** ($a^ib^jc^k$, $i = j + k$, ...) | Rewrite the counts as nested or concatenated matched blocks ($a^{j+k}b^jc^k = a^k(a^jb^j)c^k$). Outer symbols that must match go in the outermost rule. |
| **Inequality / "$\ne$"** | Peel matched pairs from the outside; list every way the peeling can stop; each stopping case is a NONEMPTY unbalanced middle with its own nonterminal. Test the boundary strings. |
| **"Or" / union of cases** | One nonterminal per case, $S \to S_1 \mid S_2$, disjoint nonterminals. |
| **Mirror with a separator** ($x\,c\,y$, $y$ related to $x^R$) | Peel pairs $a \ldots a$, $b \ldots b$ around the separator; whatever is "free" in the middle gets its own anything-nonterminal. |
| **Counts in any order** ($\#_a = \#_b$, $\#_a > \#_b$, $\#_0 = 2\#_1$) | Plot the height of prefixes; split at the first return to 0 or the last visit to 0; justify that the next symbol is forced. |
| **Complement-style** (non-palindromes, $\overline{ww}$) | Characterize "fails" positively: there is a mismatch at some position; generate the matched part, the mismatch, and a free middle. |
| **Prove $L(G) = L$** | Two labeled inclusions. Soundness: invariant on sentential forms, induction on derivation length. Completeness: strong induction on $\lvert w \rvert$, decompose $w$ to match a rule. |
| **Ambiguity** | One string, two parse trees. To fix: force a canonical decomposition (shortest balanced prefix, fixed order of rule types, layered precedence). |
| **CF via closure** | Write $L$ as unions/concatenations/stars of CF pieces, or (CF) $\cap$ (regular). Name the closure property at each step. |
| **Regular language $\to$ grammar** | Build a DFA, then $q \to a\,\delta(q,a)$ and $q \to \varepsilon$ for accepting $q$. |

## Where students lose points

- **Missing base cases.** $S \to aSb \mid ab$ misses $\varepsilon$; $S \to aSa \mid bSb \mid \varepsilon$ misses the odd-length palindromes. Always derive the 3–4 shortest strings of $L$ by hand.
- **Empty "unbalanced" middles.** In $\ne$ languages, $A \to aA \mid \varepsilon$ instead of $A \to aA \mid a$ silently adds the balanced strings back in.
- **Matching the wrong pairs.** For $0^i1^j0^k$ with $j = i + k$, the outer 0s are *not* matched with each other; the 1s split into two groups.
- **Generating strings of the wrong shape.** For $a^ib^jc^k$-type languages, rules like $S \to SS$ or $S \to bSa$ produce out-of-order strings.
- **Proving only one inclusion**, or proving soundness only for terminal strings without an invariant for the intermediate sentential forms.
- **"Two derivations" that are the same tree.** $S \Rightarrow AB \Rightarrow aB \Rightarrow ab$ and $S \Rightarrow AB \Rightarrow Ab \Rightarrow ab$ are the same parse tree. Use *leftmost* derivations.
- **Using non-closure properties as if they held**: intersecting two CFLs, complementing a CFL, or concluding "$L$ is a subset of a CFL, so $L$ is CF".
- **Shared nonterminals in a union/concatenation construction**, which can mix the two grammars.
- **Nonterminal names in this app:** <code>R0</code> is read as $R$ followed by the terminal 0; use <code>A</code>, <code>B</code>, <code>A_0</code> or <code>&lt;zero&gt;</code>.

## Self-check

1. Give a grammar for $\{a^nb^{n+1} : n \ge 0\}$.

~~~reveal Answer
$S \to aSb \mid b$. The base case produces the single extra $b$; each recursive step adds a matched pair around it.
~~~

2. True or false: $\{a^ib^jc^k : i = j \text{ and } j = k\}$ is the intersection of two CFLs, so it is context-free.

~~~reveal Answer
False — both the reasoning and the conclusion. The language is $\{a^nb^nc^n\}$, which is not CF. CFLs are not closed under intersection, so "intersection of two CFLs" proves nothing.
~~~

3. What is wrong with $S \to aSb \mid bSa \mid \varepsilon$ as a grammar for "equal numbers of $a$ and $b$"?

~~~reveal Answer
It is sound but not complete. Every nonempty string it generates starts and ends with *different* symbols, so it misses equal-count strings such as <code>abba</code> and <code>baab</code>. Fix: $S \to aSbS \mid bSaS \mid \varepsilon$ (or add the rule $S \to SS$).
~~~

4. Is $\{w \in \{a,b\}^* : \#_a(w) = \#_b(w) \text{ and } |w| \le 100\}$ context-free? Regular?

~~~reveal Answer
Both. It is finite (only strings of length at most 100), and every finite language is regular, hence context-free.
~~~

5. How do you show a grammar is ambiguous? How do you show it is unambiguous?

~~~reveal Answer
Ambiguous: exhibit one string with two different parse trees (two different leftmost derivations). Unambiguous: prove that for every string the rule used at the root and the way the string splits among the children are forced, then use induction on the length.
~~~

6. Give a grammar for $\{x\,c\,x^R : x \in \{a,b\}^*\}$ and explain why no grammar exists for $\{x\,c\,x\}$.

~~~reveal Answer
$S \to aSa \mid bSb \mid c$. The language $\{xcx\}$ is not context-free: intersecting it with the regular language $a^*b^*ca^*b^*$ gives $\{a^nb^mca^nb^m\}$, whose dependencies *cross* (the $a$-block matches the $a$-block, the $b$-block the $b$-block), and that language is not CF. Grammars build matched pairs from the outside in, which only produces nested (mirrored) dependencies.
~~~

7. If $L$ is context-free, is $\{w \in L : |w| \text{ is even}\}$ context-free?

~~~reveal Answer
Yes: it is $L \cap (\Sigma\Sigma)^*$, the intersection of a CFL with a regular language.
~~~
`,
  cheatsheet: String.raw`## Definitions

- CFG $G = (V, \Sigma, R, S)$; rules $A \to \alpha$, $\alpha \in (V \cup \Sigma)^*$.
- $L(G) = \{w \in \Sigma^* : S \Rightarrow^* w\}$.
- Parse trees $\leftrightarrow$ leftmost derivations (one-to-one).
- **Ambiguous:** some string has 2 parse trees (= 2 leftmost derivations). Property of the grammar. Some CFLs are inherently ambiguous ($a^ib^jc^k$, $i = j$ or $j = k$).

## Standard grammars

| Language | Grammar |
|---|---|
| $0^n1^n$ | $S \to 0S1 \mid \varepsilon$ |
| palindromes | $S \to aSa \mid bSb \mid a \mid b \mid \varepsilon$ |
| $ww^R$ | $S \to aSa \mid bSb \mid \varepsilon$ |
| non-palindromes | $S \to aSa \mid bSb \mid aTb \mid bTa$; $T \to aT \mid bT \mid \varepsilon$ |
| balanced parens | $S \to (S)S \mid \varepsilon$ (unambiguous) |
| prefixes of balanced | $S \to D \mid D(S$; $D \to (D)D \mid \varepsilon$ |
| $\#_a = \#_b$ | $S \to aSbS \mid bSaS \mid \varepsilon$ |
| $\#_a > \#_b$ | $S \to EaE \mid EaS$; $E$ = equal counts |
| $\#_0 = 2\#_1$ | $S \to S1S0S0S \mid S0S1S0S \mid S0S0S1S \mid \varepsilon$ |
| $0^i1^j$, $i \ne j$ | $S \to 0S1 \mid A \mid B$; $A \to 0A \mid 0$; $B \to 1B \mid 1$ |
| $0^i1^j$, $i \le 2j$ | $S \to 00S1 \mid 0S1 \mid S1 \mid \varepsilon$ |
| $a^ib^j$, $j \le i \le 2j$ | $S \to aSb \mid aaSb \mid \varepsilon$ |
| $a^ib^jc^k$, $j = i+k$ | $S \to XY$; $X \to aXb \mid \varepsilon$; $Y \to bYc \mid \varepsilon$ |
| $a^ib^jc^k$, $i = j+k$ | $S \to aSc \mid T$; $T \to aTb \mid \varepsilon$ |
| $x\,c\,x^R$ | $S \to aSa \mid bSb \mid c$ |
| $\overline{ww}$ | $S \to O \mid AB \mid BA$; $A$/$B$ = odd length, middle $a$/$b$ |

## Design templates

~~~pseudo
Nested match      S -> a S d | X          (outer pairs first)
Concatenation     S -> X Y                (independent blocks)
Union of cases    S -> S1 | S2            (disjoint nonterminals)
"not equal"       S -> a S b | A | B ;  A -> a A | a ;  B -> b B | b
Free block        W -> a W | b W | ε
Mismatch          S -> a S a | b S b | a W b | b W a
~~~
- Write an English description next to every nonterminal.
- Check the 3–4 shortest strings and 2 strings that must be excluded.
- "Any order" counts: split at the first return to height 0 or the last visit to 0.

## Proving $L(G) = L$

1. $L(G) \subseteq L$: induction on derivation length; invariant on **sentential forms** (e.g. "$0^aS1^b$ with $a \ge b$").
2. $L \subseteq L(G)$: strong induction on $|w|$; decompose $w$ to match a rule (shortest balanced prefix, last visit to 0, explicit rule counts).

## Ambiguity

- Show ambiguous: one string, two parse trees / two **leftmost** derivations.
- Show unambiguous: the root rule and the split are forced by the string; induction.
- Fixes: force an order of rule types; layered precedence $E \to E+T \mid T$, $T \to T*F \mid F$, $F \to (E) \mid x$; matched pairs contain only balanced strings (dangling else).

## Closure

- **Closed:** union, concatenation, star, reversal, $\cap$ regular, homomorphism.
- **Not closed:** intersection ($a^nb^nc^m \cap a^mb^nc^n = a^nb^nc^n$), complement (De Morgan), difference.
- $L$ CF, $R$ regular: $L \cup R$, $L \cap R$, $L \setminus R$, $LR$ are CF; $R \setminus L$ need not be.
- Not CF via closure: $L \cap R$ = known non-CFL $\Rightarrow$ $L$ not CF.
- Regular $\subsetneq$ CFL. Not CF: $a^nb^nc^n$, $ww$, $wcw$, $\#_a = \#_b = \#_c$. CF: $\overline{ww}$, $\overline{a^nb^nc^n}$.

## DFA $\to$ grammar

- Nonterminal per state; $q \to a\,\delta(q,a)$; $q \to \varepsilon$ for accepting $q$; start = start state.
- Lemma: $q \Rightarrow^* w\,r \iff \delta^*(q, w) = r$. Right-linear grammars = regular languages.

## Machines and algorithms

- CFL = nondeterministic PDA languages; deterministic PDAs are weaker.
- CNF: $A \to BC \mid a$; length-$n$ derivations take $2n-1$ steps; CYK $O(n^3)$.
- Decidable for CFGs: membership, emptiness. Undecidable: $L(G) = \Sigma^*$, equivalence, ambiguity.
`,
  quiz: [
    {
      type: 'mc',
      q: String.raw`Which string is **not** generated by $S \to aSb \mid bSa \mid \varepsilon$?`,
      choices: ['abab', 'aabb', 'abba', 'ba'],
      answer: 2,
      explain: String.raw`Every nonempty string generated starts and ends with *different* symbols, and recursively the inside has the same property. <code>abba</code> starts and ends with <code>a</code>, so it cannot be generated. The others: $abab = a(ba)b$, $aabb = a(ab)b$, $ba = b\varepsilon a$.`
    },
    {
      type: 'tf',
      q: 'A grammar is ambiguous if and only if some string in its language has two different leftmost derivations.',
      answer: true,
      explain: 'Leftmost derivations are in one-to-one correspondence with parse trees, so "two parse trees" and "two leftmost derivations" are equivalent definitions. Two different derivations that are not both leftmost do NOT prove ambiguity: one parse tree has many derivations in different orders.'
    },
    {
      type: 'tf',
      q: 'The intersection of two context-free languages is always context-free.',
      answer: false,
      explain: String.raw`$\{a^nb^nc^m\} \cap \{a^mb^nc^n\} = \{a^nb^nc^n\}$, which is not context-free. A PDA has only one stack and cannot check two independent matchings.`
    },
    {
      type: 'tf',
      q: 'The intersection of a context-free language with a regular language is always context-free.',
      answer: true,
      explain: 'Run a PDA for the CFL and a DFA for the regular language in parallel: the product machine still needs only one stack. This is often used to prove a language is NOT context-free (intersect with a regular language to get a known non-CFL).'
    },
    {
      type: 'tf',
      q: 'Context-free languages are closed under complement.',
      answer: false,
      explain: String.raw`If they were, De Morgan ($L_1 \cap L_2 = \overline{\overline{L_1} \cup \overline{L_2}}$) and closure under union would give closure under intersection, which fails. Concretely, $\overline{\{ww\}}$ is context-free but $\{ww\}$ is not.`
    },
    {
      type: 'multi',
      q: 'Which of these languages over {a,b,c} are context-free? (select all that apply)',
      choices: [
        String.raw`$\{a^nb^nc^n : n \ge 0\}$`,
        String.raw`$\{ww^R : w \in \{a,b\}^*\}$`,
        String.raw`$\{ww : w \in \{a,b\}^*\}$`,
        String.raw`$\{a,b\}^* \setminus \{ww : w \in \{a,b\}^*\}$`,
        String.raw`$\{a^ib^jc^k : i = j \text{ or } j = k\}$`,
        String.raw`$\{a^ib^jc^k : i + k = j\}$`
      ],
      answer: [1, 3, 4, 5],
      explain: String.raw`$ww^R$: $S \to aSa \mid bSb \mid \varepsilon$. The complement of $\{ww\}$ is CF (odd length, or a mismatch at distance $n$; grammar $S \to O \mid AB \mid BA$ with $A$/$B$ = odd-length strings with middle $a$/$b$). The "or" language is a union of two CFLs. $i + k = j$ is $\{a^ib^i\}\{b^kc^k\}$. But $a^nb^nc^n$ and $ww$ are classic non-CFLs.`
    },
    {
      type: 'mc',
      q: String.raw`How many different parse trees does the string <code>aaa</code> have in the grammar $S \to SS \mid a$?`,
      choices: ['1', '2', '3', 'Infinitely many'],
      answer: 1,
      explain: String.raw`Parse trees correspond to full binary bracketings of the three leaves: $(aa)a$ and $a(aa)$. (In general, a string of $n$ $a$'s has $C_{n-1}$ parse trees, the Catalan number.) There is no $\varepsilon$ or unit rule that could create infinitely many.`
    },
    {
      type: 'mc',
      q: 'In a grammar in Chomsky normal form, how many derivation steps does it take to derive a string of length n ≥ 1?',
      choices: ['n', 'n + 1', '2n − 1', String.raw`$n^2$`],
      answer: 2,
      explain: String.raw`Each $A \to BC$ step increases the number of symbols by one, so $n - 1$ such steps are needed to get $n$ symbols; then each of the $n$ nonterminals is turned into a terminal by an $A \to a$ step. Total $(n-1) + n = 2n - 1$.`
    },
    {
      type: 'tf',
      q: 'Every regular language is context-free, but not every context-free language is regular.',
      answer: true,
      explain: String.raw`A DFA converts to a right-linear grammar ($q \to a\,r$ per transition, $q \to \varepsilon$ per accepting state). $\{0^n1^n\}$ is context-free but not regular.`
    },
    {
      type: 'mc',
      q: String.raw`Grammars $G_1$ and $G_2$ have start symbols $S_1$, $S_2$ and disjoint sets of nonterminals. Which new rule (with new start symbol $S$) generates $L(G_1)\,L(G_2)$?`,
      choices: [String.raw`$S \to S_1 \mid S_2$`, String.raw`$S \to S_1 S_2$`, String.raw`$S \to S_1 S \mid \varepsilon$`, String.raw`$S \to S_1 S S_2 \mid \varepsilon$`],
      answer: 1,
      explain: String.raw`Concatenation is $S \to S_1S_2$. The first choice gives the union, the third gives $L(G_1)^*$, and the last gives $\bigcup_{n \ge 0} L(G_1)^n L(G_2)^n$ (n strings from the first grammar followed by n from the second) — not the concatenation. Disjointness matters: shared nonterminals could mix rules from both grammars.`
    },
    {
      type: 'tf',
      q: 'There are context-free languages for which every grammar is ambiguous.',
      answer: true,
      explain: String.raw`Such languages are *inherently ambiguous*; the standard example is $\{a^ib^jc^k : i = j \text{ or } j = k\}$, where strings $a^nb^nc^n$ must have two parse trees in any grammar.`
    },
    {
      type: 'mc',
      q: 'Which machine model accepts exactly the context-free languages?',
      choices: ['DFAs', 'Deterministic pushdown automata', 'Nondeterministic pushdown automata', 'Pushdown automata with two stacks'],
      answer: 2,
      explain: 'Nondeterministic PDAs are equivalent to CFGs. Deterministic PDAs are strictly weaker (e.g. even-length palindromes need nondeterminism to guess the middle). A PDA with two stacks can simulate a Turing machine tape, so it is far more powerful.'
    },
    {
      type: 'tf',
      q: String.raw`The grammar $S \to aS \mid Sa \mid a$ is unambiguous.`,
      answer: false,
      explain: String.raw`<code>aa</code> has two parse trees: $S \Rightarrow aS \Rightarrow aa$ and $S \Rightarrow Sa \Rightarrow aa$ (two different leftmost derivations). The language $a^+$ has the unambiguous grammar $S \to aS \mid a$.`
    },
    {
      type: 'mc',
      q: String.raw`To prove that a grammar $G$ generates exactly the language $L$, what must you show?`,
      choices: [
        String.raw`$L(G) \subseteq L$ only`,
        String.raw`$L \subseteq L(G)$ only`,
        String.raw`Both $L(G) \subseteq L$ and $L \subseteq L(G)$`,
        'That G is unambiguous'
      ],
      answer: 2,
      explain: 'Soundness (everything generated is in L) and completeness (everything in L is generated) are independent: S -> ε is sound for any language containing ε, and S -> aS | bS | ε is complete for any language over {a,b}. Ambiguity is irrelevant to which strings are generated.'
    },
    {
      type: 'tf',
      q: 'If a context-free language L is generated by some ambiguous grammar, then L is inherently ambiguous.',
      answer: false,
      explain: String.raw`Ambiguity is a property of a *grammar*. $\{a^n\}$ has the ambiguous grammar $S \to SS \mid a \mid \varepsilon$ and the unambiguous grammar $S \to aS \mid \varepsilon$. A language is inherently ambiguous only if **every** grammar for it is ambiguous.`
    },
    {
      type: 'tf',
      q: 'Every regular language has an unambiguous context-free grammar.',
      answer: true,
      explain: String.raw`Convert a **DFA** to a right-linear grammar ($q \to a\,\delta(q,a)$, $q \to \varepsilon$ for accepting $q$). Leftmost derivations correspond to runs of the DFA, and a DFA has exactly one run per string, so each string has one parse tree. (Converting an NFA this way can give an ambiguous grammar, since an NFA may have several accepting runs.)`
    },
    {
      type: 'mc',
      q: String.raw`$L_1$ is context-free and $R$ is regular. Which of these is **not** guaranteed to be context-free?`,
      choices: [String.raw`$L_1 \cup R$`, String.raw`$L_1 \cap R$`, String.raw`$L_1 \setminus R$`, String.raw`$R \setminus L_1$`],
      answer: 3,
      explain: String.raw`$L_1 \setminus R = L_1 \cap \overline{R}$ is CF ($\overline{R}$ is regular). $L_1 \cup R$ and $L_1 \cap R$ are CF. But $R \setminus L_1 = R \cap \overline{L_1}$ involves the complement of a CFL: with $R = \Sigma^*$ it is $\overline{L_1}$, which need not be CF (take $L_1 = \overline{\{ww\}}$; then $R \setminus L_1 = \{ww\}$).`
    },
    {
      type: 'tf',
      q: String.raw`If $L_1 \cup L_2$ is context-free, then both $L_1$ and $L_2$ are context-free.`,
      answer: false,
      explain: String.raw`Take $L_1 = \{a^nb^nc^n\}$ (not CF) and $L_2 = \{a,b,c\}^*$. Then $L_1 \cup L_2 = \{a,b,c\}^*$ is regular. Closure properties only go one way: CF pieces give a CF union, not the converse.`
    },
    {
      type: 'tf',
      q: String.raw`Every subset of a context-free language is context-free.`,
      answer: false,
      explain: String.raw`$\{a^nb^nc^n\} \subseteq \{a,b,c\}^*$, and $\{a,b,c\}^*$ is even regular. Subsets can be arbitrarily complicated (even undecidable).`
    },
    {
      type: 'mc',
      q: String.raw`Which grammar generates exactly $\{0^i1^j : i \ne j\}$?`,
      choices: [
        String.raw`$S \to 0S1 \mid A \mid B$, $A \to 0A \mid \varepsilon$, $B \to 1B \mid \varepsilon$`,
        String.raw`$S \to 0S1 \mid A \mid B$, $A \to 0A \mid 0$, $B \to 1B \mid 1$`,
        String.raw`$S \to 0S \mid S1 \mid 0 \mid 1$`,
        String.raw`$S \to 0S1 \mid 0 \mid 1$`
      ],
      answer: 1,
      explain: String.raw`The middle must be a **nonempty** block of only 0s or only 1s. Choice 1 allows an empty middle and so also generates $0^n1^n$. Choice 3 generates all of $0^*1^*$ minus $\varepsilon$ (including <code>01</code>). Choice 4 only allows a difference of exactly one.`
    },
    {
      type: 'tf',
      q: String.raw`The grammar $S \to aSb \mid ab$ generates $\{a^nb^n : n \ge 0\}$.`,
      answer: false,
      explain: String.raw`It generates $\{a^nb^n : n \ge 1\}$ — it misses $\varepsilon$. Off-by-one base cases are the most common grammar bug; always check the shortest strings of the language.`
    },
    {
      type: 'multi',
      q: 'Which statements about proving L(G) = L are correct? (select all that apply)',
      choices: [
        'Showing every string generated by G is in L proves L ⊆ L(G).',
        'Soundness (L(G) ⊆ L) is usually proved by induction on the length of the derivation.',
        'Completeness (L ⊆ L(G)) is usually proved by strong induction on |w|, decomposing w to match a rule.',
        'Testing all strings up to length 10 proves the grammar correct.',
        'For soundness it often helps to prove a stronger claim about all sentential forms.'
      ],
      answer: [1, 2, 4],
      explain: 'Showing generated strings are in L is soundness, L(G) ⊆ L — the first choice has the inclusion backwards. Testing short strings is a good sanity check but not a proof. Strengthening the soundness claim to sentential forms (e.g. "every form is 0^a S 1^b with a ≥ b") is the standard way to make the induction go through.'
    },
    {
      type: 'tf',
      q: String.raw`$\{ww^R : w \in \{a,b\}^*\}$ is context-free, but $\{ww : w \in \{a,b\}^*\}$ is not.`,
      answer: true,
      explain: String.raw`Mirrored structure is nested (first symbol matches last), which a grammar builds from the outside in: $S \to aSa \mid bSb \mid \varepsilon$. Copying ($ww$) requires matching the first symbol with the one in the middle — crossing dependencies, which grammars (and one stack) cannot handle.`
    },
    {
      type: 'mc',
      q: String.raw`Which string shows that $E \to E - E \mid x$ is ambiguous?`,
      choices: [String.raw`<code>x</code>`, String.raw`<code>x-x</code>`, String.raw`<code>x-x-x</code>`, 'It is not ambiguous'],
      answer: 2,
      explain: String.raw`<code>x-x-x</code> has a parse tree with the left $-$ at the bottom, meaning $(x - x) - x$, and one with the right $-$ at the bottom, meaning $x - (x - x)$ — and those even evaluate differently. <code>x-x</code> has only one parse tree. Fix: $E \to E - x \mid x$ (left associative).`
    },
    {
      type: 'tf',
      q: String.raw`The context-free languages are closed under reversal: if $L$ is CF then $L^R = \{w^R : w \in L\}$ is CF.`,
      answer: true,
      explain: String.raw`Reverse the right-hand side of every rule. A derivation of $w$ in the old grammar becomes, rule by rule, a derivation of $w^R$ in the new one (induction on the derivation).`
    },
    {
      type: 'mc',
      q: String.raw`To show $L = \{a^ib^jc^k : i \ne j \text{ or } j \ne k\}$ is context-free, which argument is valid?`,
      choices: [
        String.raw`$L$ is the complement of $\{a^nb^nc^n\}$, and CFLs are closed under complement.`,
        String.raw`$L = \{a^ib^jc^k : i \ne j\} \cup \{a^ib^jc^k : j \ne k\}$, both CF, and CFLs are closed under union.`,
        String.raw`$L$ is the intersection of two CFLs.`,
        String.raw`$L$ is infinite, so it is context-free.`
      ],
      answer: 1,
      explain: String.raw`Union of two CF languages is CF. Choice 1 is wrong twice: CFLs are not closed under complement, and $L$ is not the complement of $\{a^nb^nc^n\}$ anyway (the complement also contains strings not of the form $a^*b^*c^*$). Intersection of CFLs need not be CF, and being infinite says nothing.`
    },
    {
      type: 'tf',
      q: String.raw`If $L$ is context-free and $R$ is regular, then $L \cdot R$ (concatenation) is context-free.`,
      answer: true,
      explain: String.raw`Every regular language is context-free, and CFLs are closed under concatenation ($S \to S_1S_2$ with disjoint nonterminals).`
    },
    {
      type: 'mc',
      q: String.raw`What language does $S \to aSb \mid aS \mid \varepsilon$ generate?`,
      choices: [String.raw`$\{a^nb^n\}$`, String.raw`$\{a^ib^j : i \ge j\}$`, String.raw`$\{a^ib^j : i \le j\}$`, String.raw`$a^*b^*$`],
      answer: 1,
      explain: String.raw`Every sentential form is $a^pSb^q$ with $p \ge q$: $aSb$ adds one of each, $aS$ adds an extra $a$. Every $a^ib^j$ with $i \ge j$ is reached by $j$ uses of $aSb$ and $i - j$ uses of $aS$. (This grammar is ambiguous — the dangling-else grammar in disguise — but that does not change its language.)`
    }
  ],
  flashcards: [
    { front: 'Context-free grammar (formal)', back: String.raw`$G = (V, \Sigma, R, S)$: nonterminals, terminals, rules $A \to \alpha$ with $\alpha \in (V\cup\Sigma)^*$, start symbol $S$. $L(G) = \{w \in \Sigma^* : S \Rightarrow^* w\}$.` },
    { front: 'Ambiguous grammar', back: 'Some string in L(G) has two different parse trees (equivalently two different leftmost derivations).' },
    { front: 'Inherently ambiguous language (example)', back: String.raw`$\{a^ib^jc^k : i = j \text{ or } j = k\}$ — every grammar for it is ambiguous.` },
    { front: String.raw`Grammar for $\#_a(w) = \#_b(w)$`, back: String.raw`$S \to aSbS \mid bSaS \mid \varepsilon$ (split at the first return of $\#_a - \#_b$ to zero).` },
    { front: 'Grammar for palindromes over {a,b}', back: String.raw`$S \to aSa \mid bSb \mid a \mid b \mid \varepsilon$` },
    { front: String.raw`Grammar for $\{0^i1^j : i \ne j\}$`, back: String.raw`$S \to 0S1 \mid A \mid B$, $A \to 0A \mid 0$, $B \to 1B \mid 1$.` },
    { front: 'Unambiguous grammar for balanced parentheses', back: String.raw`$S \to (S)S \mid \varepsilon$ — split at the shortest nonempty balanced prefix, which is unique.` },
    { front: 'Closure properties of CFLs', back: 'Closed: union, concatenation, star, reversal, intersection with regular. NOT closed: intersection, complement.' },
    { front: 'Why are CFLs not closed under intersection?', back: String.raw`$\{a^nb^nc^m\} \cap \{a^mb^nc^n\} = \{a^nb^nc^n\}$, which is not context-free.` },
    { front: 'How to prove L(G) = L', back: 'Two inclusions: L(G) ⊆ L by induction on derivation length; L ⊆ L(G) by strong induction on |w|, decomposing w to match a rule.' },
    { front: 'Regular to CFG', back: String.raw`For each DFA transition $\delta(q,a) = r$ add $q \to a\,r$; for each accepting $q$ add $q \to \varepsilon$; start symbol = start state.` },
    { front: 'Chomsky normal form', back: String.raw`Rules $A \to BC$ or $A \to a$ (plus $S \to \varepsilon$). Derivation of a length-$n$ string takes $2n-1$ steps; CYK decides membership in $O(n^3)$.` },
    { front: 'PDA vs CFG', back: 'Nondeterministic pushdown automata accept exactly the CFLs; deterministic PDAs are strictly weaker.' },
    { front: 'Showing a grammar is ambiguous (what to write)', back: 'One specific string and two different parse trees (or two different LEFTMOST derivations) for it. Two derivations that differ only in the order of steps are the same tree.' },
    { front: String.raw`Grammar for "not a palindrome" over $\{a,b\}$`, back: String.raw`$S \to aSa \mid bSb \mid aTb \mid bTa$, $T \to aT \mid bT \mid \varepsilon$: peel matching pairs, then one mismatched pair around an arbitrary middle.` },
    { front: String.raw`Grammar for $\#_a(w) > \#_b(w)$`, back: String.raw`$S \to EaE \mid EaS$ with $E \to aEbE \mid bEaE \mid \varepsilon$. Cut at the LAST time the height $\#_a - \#_b$ is 0; the next symbol must be $a$.` },
    { front: String.raw`Grammar for $a^ib^jc^k$ with $i = j + k$`, back: String.raw`$S \to aSc \mid T$, $T \to aTb \mid \varepsilon$ (outer $a$'s match $c$'s, inner $a$'s match $b$'s).` },
    { front: String.raw`Why is $\overline{\{a^nb^nc^n\}}$ context-free?`, back: String.raw`It equals $\overline{a^*b^*c^*} \cup \{a^ib^jc^k : i \ne j\} \cup \{a^ib^jc^k : j \ne k\}$: a regular language union two CFLs.` },
    { front: 'Proving a language is CF via closure: allowed operations', back: 'Union, concatenation, star, reversal, intersection WITH A REGULAR language (and any regular language is CF). Never intersect two CFLs or complement a CFL.' },
    { front: 'Unambiguous grammar for the dangling-else language (every prefix #a ≥ #b)', back: String.raw`$S \to aS \mid aTbS \mid \varepsilon$, $T \to aTbT \mid \varepsilon$ — between a matched $a$ and its $b$ only balanced strings are allowed.` },
    { front: 'Right-linear grammar', back: String.raw`Every rule is $A \to aB$ or $A \to \varepsilon$. Generates exactly the regular languages (nonterminals = automaton states).` },
    { front: 'Grammar for prefixes of balanced strings', back: String.raw`$S \to D \mid D(S$, $D \to (D)D \mid \varepsilon$: cut at the last time the depth is 0; the next ( is never closed.` },
    { front: 'Design trick: "≠" languages', back: 'Peel matched pairs from the outside; the middle must be a NONEMPTY unbalanced block. List every way the peeling can stop and test boundary strings.' }
  ],
  problems: [
    {
      id: 'cfg-0n1n',
      type: 'cfg',
      title: String.raw`Warm-up: $0^n1^n$`,
      difficulty: 1,
      alphabet: '01',
      prompt: String.raw`Give a context-free grammar for $L = \{0^n1^n : n \ge 0\}$.`,
      accepts: function (s) {
        if (!/^0*1*$/.test(s)) return false;
        var z = s.split('0').length - 1;
        return 2 * z === s.length;
      },
      sample: String.raw`S -> 0 S 1 | ε`,
      maxLen: 10,
      hints: ['Build the string from the outside in: each step adds one 0 on the left and one 1 on the right.'],
      solution: String.raw`$S \to 0S1 \mid \varepsilon$. Each use of $S \to 0S1$ adds a matched pair around the middle; $S \to \varepsilon$ finishes. After $n$ applications we get exactly $0^n1^n$.`
    },
    {
      id: 'cfg-pal',
      type: 'cfg',
      title: 'Palindromes',
      difficulty: 1,
      alphabet: 'ab',
      prompt: String.raw`Give a CFG for $\{w \in \{a,b\}^* : w = w^R\}$.`,
      accepts: function (s) { return s === s.split('').reverse().join(''); },
      sample: String.raw`S -> a S a | b S b | a | b | ε`,
      maxLen: 10,
      hints: ['A palindrome is empty, a single symbol, or c w c where w is a palindrome.', 'Do not forget the odd-length palindromes.'],
      solution: String.raw`$S \to aSa \mid bSb \mid a \mid b \mid \varepsilon$. Recursive definition: a palindrome of length at least 2 starts and ends with the same symbol and has a palindrome in the middle; the base cases are the palindromes of length 0 and 1.`
    },
    {
      id: 'cfg-parens',
      type: 'cfg',
      title: 'Balanced parentheses',
      difficulty: 2,
      alphabet: '()',
      prompt: String.raw`Give a CFG for the balanced strings of parentheses over $\{(, )\}$: equal numbers of ( and ), and no prefix has more ) than (. For a bonus, make it unambiguous.`,
      accepts: function (s) {
        var d = 0;
        for (var i = 0; i < s.length; i++) {
          d += (s[i] === '(') ? 1 : -1;
          if (d < 0) return false;
        }
        return d === 0;
      },
      sample: String.raw`S -> ( S ) S | ε`,
      maxLen: 10,
      hints: ['Look at the parenthesis matching the very first (.', 'Every nonempty balanced string is ( x ) y with x and y balanced.'],
      solution: String.raw`$S \to (S)S \mid \varepsilon$.

Every nonempty balanced string $w$ starts with (; let ) be its matching parenthesis, i.e. the end of the shortest nonempty balanced prefix. Then $w = (x)y$ with $x$ and $y$ balanced, and this decomposition is unique, so the grammar is unambiguous. The grammar $S \to SS \mid (S) \mid \varepsilon$ generates the same language but is ambiguous.`
    },
    {
      id: 'cfg-equal',
      type: 'cfg',
      title: 'Equal numbers of a and b',
      difficulty: 2,
      alphabet: 'ab',
      prompt: String.raw`Give a CFG for $\{w \in \{a,b\}^* : \#_a(w) = \#_b(w)\}$, in any order (e.g. <code>abba</code> and <code>baab</code> are in the language).`,
      accepts: function (s) {
        var d = 0;
        for (var i = 0; i < s.length; i++) d += (s[i] === 'a') ? 1 : -1;
        return d === 0;
      },
      sample: String.raw`S -> a S b S | b S a S | ε`,
      maxLen: 10,
      hints: [
        String.raw`Track $d = \#_a - \#_b$ along the string. Where does it first return to 0?`,
        String.raw`If $w$ starts with $a$, then $w = a\,x\,b\,y$ where $x$ and $y$ both have equal counts.`
      ],
      solution: String.raw`$S \to aSbS \mid bSaS \mid \varepsilon$.

Soundness: each rule adds one $a$ and one $b$. Completeness: for nonempty $w$ starting with $a$, let $axb$ be the shortest nonempty prefix with equal counts (the counter $\#_a - \#_b$ goes from 1 back down to 0 at that $b$); then $x$ and the rest $y$ both have equal counts, so $S \Rightarrow aSbS \Rightarrow^* axby$ by induction. The case starting with $b$ is symmetric. (See the lesson for the full proof.)

Note $S \to aSb \mid bSa \mid SS \mid \varepsilon$ also works (but is ambiguous). $S \to aSb \mid bSa \mid \varepsilon$ alone does **not**: it misses <code>abba</code>.`
    },
    {
      id: 'cfg-neq',
      type: 'cfg',
      title: String.raw`$0^i1^j$ with $i \ne j$`,
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Give a CFG for $\{0^i1^j : i \ne j\}$.`,
      accepts: function (s) {
        if (!/^0*1*$/.test(s)) return false;
        var z = s.split('0').length - 1;
        return 2 * z !== s.length;
      },
      sample: String.raw`S -> 0 S 1 | A | B
A -> 0 A | 0
B -> 1 B | 1`,
      maxLen: 10,
      hints: [
        'Either there are more 0s than 1s, or more 1s than 0s.',
        String.raw`Generate matched pairs $0\ldots1$ around a middle that is a nonempty block $0^+$ or a nonempty block $1^+$.`
      ],
      solution: String.raw`~~~pseudo
S -> 0 S 1 | A | B      S: 0^i 1^j with i != j
A -> 0 A | 0            A: 0^+  (at least one extra 0)
B -> 1 B | 1            B: 1^+  (at least one extra 1)
~~~
A derivation applies $S \to 0S1$ some $k$ times and then produces $0^m$ or $1^m$ with $m \ge 1$, yielding $0^{k+m}1^k$ or $0^k1^{k+m}$ — exactly the strings $0^i1^j$ with $i \ne j$. Conversely, if $i > j$ take $k = j$, $m = i - j$; if $i < j$ take $k = i$, $m = j - i$.

The key detail is that $A$ and $B$ generate **nonempty** blocks; with $A \to 0A \mid \varepsilon$ the grammar would also generate $0^n1^n$.`
    },
    {
      id: 'cfg-le2',
      type: 'cfg',
      title: String.raw`$0^i1^j$ with $i \le 2j$`,
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Give a CFG for $\{0^i1^j : i \le 2j\}$. (So $\varepsilon$, <code>1</code>, <code>001</code> and <code>00011</code> are in the language, but <code>0</code> and <code>0001</code> are not.)`,
      accepts: function (s) {
        if (!/^0*1*$/.test(s)) return false;
        var z = s.split('0').length - 1;
        var o = s.length - z;
        return z <= 2 * o;
      },
      sample: String.raw`S -> 0 0 S 1 | 0 S 1 | S 1 | ε`,
      maxLen: 10,
      hints: [
        'Each 1 can be matched with zero, one, or two 0s.',
        'Use one rule for each of those three options.'
      ],
      solution: String.raw`$S \to 00S1 \mid 0S1 \mid S1 \mid \varepsilon$.

**Soundness.** Every derivation uses the three recursive rules some numbers of times $p, q, r$ (in some order) and produces $0^{2p+q}1^{p+q+r}$; indeed every sentential form has the shape $0^aS1^b$. Then $i = 2p + q \le 2p + 2q + 2r = 2j$.

**Completeness.** Given $0^i1^j$ with $i \le 2j$, let $p = \lfloor i/2 \rfloor$ and $q = i \bmod 2$, so $2p + q = i$ and $p + q = \lceil i/2 \rceil \le j$. Let $r = j - p - q \ge 0$. Apply $S \to S1$ $r$ times, $S \to 0S1$ $q$ times, $S \to 00S1$ $p$ times, then $S \to \varepsilon$.`
    },
    {
      id: 'cfg-abc-union',
      type: 'cfg',
      title: String.raw`$a^ib^jc^k$ with $i = j$ or $j = k$`,
      difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Give a CFG for $\{a^ib^jc^k : i = j \text{ or } j = k\}$.`,
      accepts: function (s) {
        var m = /^(a*)(b*)(c*)$/.exec(s);
        if (!m) return false;
        return m[1].length === m[2].length || m[2].length === m[3].length;
      },
      sample: String.raw`S -> X C | A Y
X -> a X b | ε
C -> c C | ε
A -> a A | ε
Y -> b Y c | ε`,
      maxLen: 8,
      hints: [
        'This is the union of two languages. Write a grammar for each with disjoint nonterminals.',
        String.raw`$\{a^ib^ic^k\} = \{a^ib^i\} \cdot c^*$.`
      ],
      solution: String.raw`~~~pseudo
S -> X C | A Y        union of the two cases
X -> a X b | ε        X: a^n b^n
C -> c C | ε          C: c^*
A -> a A | ε          A: a^*
Y -> b Y c | ε        Y: b^n c^n
~~~
$XC$ generates $\{a^nb^n\}c^* = \{a^ib^jc^k : i = j\}$ and $AY$ generates $a^*\{b^nc^n\} = \{a^ib^jc^k : j = k\}$. This language is inherently ambiguous: strings $a^nb^nc^n$ are generated both ways, and no grammar can avoid that.`
    },
    {
      id: 'cfg-not-ww',
      type: 'cfg',
      title: String.raw`The complement of $\{ww\}$`,
      difficulty: 3,
      alphabet: 'ab',
      prompt: String.raw`$\{ww : w \in \{a,b\}^*\}$ is not context-free, but its complement is. Give a CFG for
$$L = \{x \in \{a,b\}^* : x \ne ww \text{ for every } w\}.$$`,
      accepts: function (s) {
        if (s.length % 2 === 1) return true;
        var h = s.length / 2;
        return s.slice(0, h) !== s.slice(h);
      },
      sample: String.raw`S -> O | A B | B A
O -> a | b | a a O | a b O | b a O | b b O
A -> a | a A a | a A b | b A a | b A b
B -> b | a B a | a B b | b B a | b B b`,
      maxLen: 10,
      hints: [
        'Odd-length strings are all in L. For even length 2n, x is in L iff some position k has x_k ≠ x_{k+n}.',
        String.raw`If $x_k = a$ and $x_{k+n} = b$, cut $x$ into two odd-length pieces: one centered at position $k$, one centered at position $k+n$.`,
        'Let A generate odd-length strings whose middle symbol is a, and B those whose middle is b. Then the even-length part is AB ∪ BA.'
      ],
      solution: String.raw`~~~pseudo
S -> O | A B | B A
O -> a | b | aaO | abO | baO | bbO       odd-length strings
A -> a | aAa | aAb | bAa | bAb           odd length, middle symbol a
B -> b | aBa | aBb | bBa | bBb           odd length, middle symbol b
~~~
**Why it works.** Odd-length strings are never squares, and $O$ generates all of them.

($\subseteq$) Suppose $x = uv$ with $u \in L(A)$, $|u| = 2p+1$ and $v \in L(B)$, $|v| = 2q+1$. Then $|x| = 2n$ with $n = p + q + 1$; the $a$ at the center of $u$ is at position $p + 1$ and the $b$ at the center of $v$ is at position $2p + 1 + q + 1 = (p+1) + n$. So $x_{p+1} \ne x_{p+1+n}$, and the two halves of $x$ differ. Same for $BA$.

($\supseteq$) Let $x$ have even length $2n$ and suppose its two halves differ: there is a position $k$ with $1 \le k \le n$ and $x_k \ne x_{n+k}$. Say $x_k = a$ and $x_{n+k} = b$. Cut $x$ after position $2k - 1$:

- the first piece $x_1 \cdots x_{2k-1}$ has odd length $2k - 1$ and its center is position $k$, which holds $a$; so it is in $L(A)$;
- the second piece $x_{2k} \cdots x_{2n}$ has odd length $2n - 2k + 1 \ge 1$ and its center is at position $(2k - 1) + (n - k + 1) = n + k$, which holds $b$; so it is in $L(B)$.

Hence $x \in L(A)L(B)$. If instead $x_k = b$ and $x_{n+k} = a$, the same cut shows $x \in L(B)L(A)$. $\blacksquare$`
    },
    {
      id: 'cfg-ambiguity',
      type: 'written',
      title: 'Ambiguity: find it and fix it',
      difficulty: 2,
      prompt: String.raw`Consider the grammar $G$: $S \to SS \mid aSb \mid \varepsilon$.

(a) Prove that $G$ is ambiguous.

(b) Give an unambiguous grammar for $L(G)$ and explain why it is unambiguous.`,
      rubric: [
        '(a) Names one specific string in L(G)',
        '(a) Gives two genuinely different parse trees or leftmost derivations for it',
        '(b) Gives a correct grammar for the same language (balanced strings with a = open, b = close)',
        '(b) Argues uniqueness of the decomposition (shortest nonempty balanced prefix)'
      ],
      hints: [
        'Try the string ab. Can you derive it both with and without using S -> SS first?',
        'L(G) is the balanced-parentheses language with a as ( and b as ).'
      ],
      solution: String.raw`**(a)** The string $ab$ has two different leftmost derivations:
$$S \Rightarrow aSb \Rightarrow ab \qquad\text{and}\qquad S \Rightarrow SS \Rightarrow aSbS \Rightarrow abS \Rightarrow ab.$$
They correspond to different parse trees (the root has 3 children $a, S, b$ in the first and 2 children $S, S$ in the second), so $G$ is ambiguous. (In fact $ab$ has infinitely many parse trees, since $S \Rightarrow SS \Rightarrow S$ can be repeated.)

**(b)** $L(G)$ is the set of balanced strings with $a$ as an open and $b$ as a close parenthesis. An unambiguous grammar:
$$S \to aSbS \mid \varepsilon.$$
It generates $L(G)$: every nonempty balanced $w$ starts with $a$; let $p$ be the shortest nonempty prefix of $w$ that is balanced. Then $p = axb$ with $x$ balanced, and $w = axby$ with $y$ balanced.

It is unambiguous: in any parse tree for a nonempty $w$, the root uses $S \to aSbS$, and the $b$ produced by the root must be the one that closes the first $a$, i.e. the last symbol of the shortest balanced prefix $p$. (The subtree for the first $S$ generates a balanced $x$, so $ax$ has one more $a$ than $b$ and every proper nonempty prefix of $axb$ is unbalanced.) Thus $x$ and $y$ are uniquely determined by $w$, and by induction on $|w|$ their parse trees are unique. Hence each string has exactly one parse tree.`
    },
    {
      id: 'cfg-prove-correct',
      type: 'written',
      title: 'Prove a grammar correct',
      difficulty: 3,
      prompt: String.raw`Let $G$ be the grammar
$$S \to 0S1 \mid 0S \mid \varepsilon.$$
Prove that $L(G) = \{0^i1^j : i \ge j \ge 0\}$. Prove both inclusions.`,
      rubric: [
        'Soundness: a precise invariant for sentential forms (0^a S 1^b with a ≥ b), proved by induction on derivation length',
        'Soundness: concludes every generated terminal string has i ≥ j',
        'Completeness: explicit derivation (or induction) for an arbitrary 0^i 1^j with i ≥ j',
        'Clearly separates the two inclusions'
      ],
      hints: [
        String.raw`Claim: every sentential form is $0^aS1^b$ or $0^a1^b$ with $a \ge b$.`,
        String.raw`For completeness, write $0^i1^j = 0^{i-j}\,0^j1^j$ and count rule uses.`
      ],
      solution: String.raw`Let $L = \{0^i1^j : i \ge j \ge 0\}$.

**$L(G) \subseteq L$.** Claim: every sentential form derivable from $S$ is $0^aS1^b$ or $0^a1^b$ for some $a \ge b \ge 0$. Proof by induction on the number of derivation steps. Zero steps: $S = 0^0S1^0$. Inductive step: a sentential form of the form $0^a1^b$ has no nonterminal and cannot be rewritten, so the previous form was $0^aS1^b$ with $a \ge b$, and the step used one of:
- $S \to 0S1$, giving $0^{a+1}S1^{b+1}$ with $a+1 \ge b+1$;
- $S \to 0S$, giving $0^{a+1}S1^b$ with $a + 1 \ge b$;
- $S \to \varepsilon$, giving $0^a1^b$ with $a \ge b$.

In all cases the claim holds. Every terminal string in $L(G)$ is therefore $0^a1^b$ with $a \ge b$, i.e. in $L$.

**$L \subseteq L(G)$.** Let $w = 0^i1^j$ with $i \ge j$. Then
$$S \Rightarrow^{(i-j)\ \text{times}} 0^{i-j}S \Rightarrow^{j\ \text{times}} 0^{i-j}0^jS1^j \Rightarrow 0^i1^j,$$
using $S \to 0S$ exactly $i - j$ times, then $S \to 0S1$ exactly $j$ times, then $S \to \varepsilon$. (Each application of $S \to 0S$ to $0^aS$ gives $0^{a+1}S$; each application of $S \to 0S1$ to $0^aS1^b$ gives $0^{a+1}S1^{b+1}$.) Hence $w \in L(G)$.

Both inclusions hold, so $L(G) = L$. $\blacksquare$`
    },
    {
      id: 'cfg-closure',
      type: 'written',
      title: 'Closure under intersection and complement fails',
      difficulty: 2,
      prompt: String.raw`You may assume that $\{a^nb^nc^n : n \ge 0\}$ is not context-free.

(a) Give context-free grammars for $L_1 = \{a^nb^nc^m : n, m \ge 0\}$ and $L_2 = \{a^mb^nc^n : n, m \ge 0\}$.

(b) Conclude that context-free languages are not closed under intersection.

(c) Conclude that context-free languages are not closed under complement.

(d) Is $L_1 \cap a^*b^*$ context-free? Justify.`,
      rubric: [
        '(a) Correct grammars for both L1 and L2',
        '(b) Computes L1 ∩ L2 = {a^n b^n c^n} correctly and concludes',
        '(c) Correct De Morgan argument using closure under union',
        '(d) Yes: intersection with a regular language preserves context-freeness (or: it equals {a^n b^n}, which is CF)'
      ],
      hints: [
        String.raw`$L_1 = \{a^nb^n\} \cdot c^*$.`,
        String.raw`$L_1 \cap L_2 = \overline{\overline{L_1} \cup \overline{L_2}}$.`
      ],
      solution: String.raw`**(a)** $L_1$: $S \to XC$, $X \to aXb \mid \varepsilon$, $C \to cC \mid \varepsilon$. $L_2$: $S \to AY$, $A \to aA \mid \varepsilon$, $Y \to bYc \mid \varepsilon$.

**(b)** A string is in both $L_1$ and $L_2$ iff it has the form $a^ib^jc^k$ with $i = j$ and $j = k$. So $L_1 \cap L_2 = \{a^nb^nc^n\}$, which is not context-free. Two CFLs whose intersection is not context-free show that CFLs are not closed under intersection.

**(c)** Suppose CFLs were closed under complement. CFLs are closed under union, so $\overline{L_1} \cup \overline{L_2}$ would be context-free, and then so would its complement, which by De Morgan's law is $L_1 \cap L_2 = \{a^nb^nc^n\}$. Contradiction. So CFLs are not closed under complement.

**(d)** Yes. $a^*b^*$ is regular and the intersection of a CFL with a regular language is context-free. Directly: $L_1 \cap a^*b^* = \{a^nb^n : n \ge 0\}$ (the case $m = 0$), generated by $S \to aSb \mid \varepsilon$.`
    },
    {
      id: 'cfg-0i1j0k',
      type: 'cfg',
      title: String.raw`$0^i1^j0^k$ with $j = i + k$`,
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Give a CFG for $L = \{0^i1^j0^k : j = i + k\}$. (So $\varepsilon$, <code>01</code>, <code>10</code>, <code>0110</code>, <code>011100</code> and <code>001110</code> are in $L$, but <code>0100</code> and <code>011110</code> are not.)`,
      accepts: function (s) {
        var m = /^(0*)(1*)(0*)$/.exec(s);
        if (!m) return false;
        return m[2].length === m[1].length + m[3].length;
      },
      sample: String.raw`S -> X Y
X -> 0 X 1 | ε
Y -> 1 Y 0 | ε`,
      maxLen: 10,
      hints: [
        String.raw`Split the block of 1s into two parts: $1^j = 1^i\,1^k$.`,
        String.raw`Then $0^i1^j0^k = (0^i1^i)(1^k0^k)$ — a concatenation of two matched languages.`
      ],
      solution: String.raw`Because $j = i + k$, we can write $0^i1^j0^k = (0^i1^i)\,(1^k0^k)$, so $L = \{0^n1^n\}\cdot\{1^n0^n\}$:
~~~pseudo
S -> X Y            S: the concatenation
X -> 0 X 1 | ε      X: 0^n 1^n
Y -> 1 Y 0 | ε      Y: 1^n 0^n
~~~
**Soundness.** $X$ generates exactly $0^i1^i$ and $Y$ exactly $1^k0^k$ (each is the standard matched grammar), so $S$ generates $0^i1^{i+k}0^k \in L$.

**Completeness.** Given $0^i1^j0^k$ with $j = i + k$, derive $X \Rightarrow^* 0^i1^i$ and $Y \Rightarrow^* 1^k0^k$; their concatenation is the string.

Common bug: $S \to 0S0 \mid T$, $T \to 1T \mid \varepsilon$ matches the *outer* 0s with each other, giving $0^n1^*0^n$ — a different language.`
    },
    {
      id: 'cfg-twice',
      type: 'cfg',
      title: String.raw`Twice as many 0s as 1s`,
      difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Give a CFG for $L = \{w \in \{0,1\}^* : \#_0(w) = 2\cdot\#_1(w)\}$ (in any order; e.g. <code>001</code>, <code>010</code>, <code>100</code>, <code>110000</code> are in $L$).`,
      accepts: function (s) {
        var z = 0, o = 0;
        for (var i = 0; i < s.length; i++) { if (s[i] === '0') z++; else o++; }
        return z === 2 * o;
      },
      sample: String.raw`S -> S 1 S 0 S 0 S | S 0 S 1 S 0 S | S 0 S 0 S 1 S | ε`,
      maxLen: 9,
      hints: [
        String.raw`Let $h(u) = \#_0(u) - 2\#_1(u)$. Walking along $w$, each 0 is a step $+1$ and each 1 is a step $-2$. Up-steps never skip a level.`,
        String.raw`Show: a string with $h = 1$ always splits as $x\,0\,y$ with $h(x) = h(y) = 0$ (cut at the *last* time the height is 0).`,
        String.raw`Find a 1 in $w$ whose prefix before it has height 0, 1 or 2. Then the part after it has height 2, 1 or 0.`
      ],
      solution: String.raw`~~~pseudo
S -> S1S0S0S | S0S1S0S | S0S0S1S | ε
~~~
Think of $w$ as a walk: $h(u) = \#_0(u) - 2\#_1(u)$, a 0 is a step up by 1, a 1 is a step down by 2. $L$ is the set of walks ending at height 0.

**Soundness.** Each non-$\varepsilon$ rule adds two 0s and one 1, so every generated string has $\#_0 = 2\#_1$ (induction on the derivation).

**Two facts.** Let $T_d$ be the set of strings with $h = d$ (so $L = T_0$).
- $T_1 = L\,0\,L$: if $h(t) = 1$, let $i$ be the *last* prefix length with height 0. The next step cannot be a 1 (it would go to $-2$, and since up-steps have size 1 the walk would have to pass through 0 again on its way to 1). So it is a 0, and $t = u\,0\,v$ with $h(u) = 0$ and $h(v) = 0$.
- $T_2 = L\,0\,T_1 = L0L0L$, by the same argument.

**Completeness** (strong induction on $|w|$). Let $w \in L$ be nonempty; it contains a 1. We find a 1 whose prefix has height $a \in \{0,1,2\}$:
- if the walk ever goes below 0, the first step that does so is a 1 taken from height 0 or 1;
- otherwise the walk stays $\ge 0$; after the *last* 1 only up-steps follow and the walk ends at 0, so that 1 lands on height $\le 0$, i.e. exactly 0, and it was taken from height 2.

Write $w = x\,1\,y$ with $h(x) = a$, $h(y) = 2 - a$. By the two facts, $x$ and $y$ are concatenations of shorter strings of $L$ separated by 0s, matching one of the three rules: $(a, 2-a) = (0,2)$ gives $S1S0S0S$, $(1,1)$ gives $S0S1S0S$, $(2,0)$ gives $S0S0S1S$. The pieces are shorter than $w$, so by induction $S$ derives them.`
    },
    {
      id: 'cfg-i-eq-jk',
      type: 'cfg',
      title: String.raw`$a^ib^jc^k$ with $i = j + k$`,
      difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Give a CFG for $\{a^ib^jc^k : i = j + k\}$.`,
      accepts: function (s) {
        var m = /^(a*)(b*)(c*)$/.exec(s);
        return !!m && m[1].length === m[2].length + m[3].length;
      },
      sample: String.raw`S -> a S c | T
T -> a T b | ε`,
      maxLen: 8,
      hints: [
        String.raw`Write $a^{j+k}b^jc^k = a^k\,(a^jb^j)\,c^k$.`,
        'Match the outer a’s with the c’s first, then the inner a’s with the b’s.'
      ],
      solution: String.raw`$a^{j+k}b^jc^k = a^k(a^jb^j)c^k$: nested matching.
~~~pseudo
S -> a S c | T      S: a^k (a^j b^j) c^k
T -> a T b | ε      T: a^j b^j
~~~
Every derivation applies $S \to aSc$ some $k$ times, then $S \to T$, then $T \to aTb$ some $j$ times, giving exactly $a^{k+j}b^jc^k$; and every string of the language arises this way with those $k, j$.`
    },
    {
      id: 'cfg-i-neq-jk',
      type: 'cfg',
      title: String.raw`$a^ib^jc^k$ with $i \ne j + k$`,
      difficulty: 3,
      alphabet: 'abc',
      prompt: String.raw`Give a CFG for $\{a^ib^jc^k : i \ne j + k\}$. (Note: strings not of the form $a^*b^*c^*$ are **not** in the language.)`,
      accepts: function (s) {
        var m = /^(a*)(b*)(c*)$/.exec(s);
        return !!m && m[1].length !== m[2].length + m[3].length;
      },
      sample: String.raw`S -> a S c | M
M -> A | Q | R
A -> a A | a E
E -> a E b | ε
Q -> a Q b | B
B -> b B | b
R -> b R | R c | b | c`,
      maxLen: 8,
      hints: [
        String.raw`Peel matched pairs $a \ldots c$ from the outside. What can the middle look like when you stop?`,
        String.raw`When the peeling stops, either the $a$'s ran out (middle $b^jc^m$, nonempty), or the $c$'s ran out (middle $a^rb^j$ with $r \ne j$).`,
        String.raw`For the middle $a^rb^j$ with $r \ne j$ use the idea of the $i \ne j$ grammar — but be careful: in "too many $a$'s" the middle can still contain $b$'s (test <code>aab</code>).`
      ],
      solution: String.raw`Peel matched $a\ldots c$ pairs from the outside ($S \to aSc$). When we stop, the middle $M$ must be "unbalanced" in one of three ways:
~~~pseudo
S -> a S c | M
M -> A | Q | R
A -> a A | a E            A: a^p a^r b^r with p >= 1   (more a's than b's)
E -> a E b | ε            E: a^r b^r
Q -> a Q b | B            Q: a^r b^j with j > r       (more b's than a's)
B -> b B | b              B: b^+
R -> b R | R c | b | c    R: b^j c^m with j + m >= 1  (a's used up)
~~~
**Soundness.** A derivation gives $a^n\,u\,c^n$ with $u$ from $A$, $Q$ or $R$.
- $u = a^{p+r}b^r$, $p \ge 1$: then $i = n + p + r > n + r = j + k$.
- $u = a^rb^j$, $j > r$: then $i = n + r < n + j = j + k$.
- $u = b^jc^m$, $j + m \ge 1$: then $i = n < n + j + m = j + k$.

**Completeness.** Let $w = a^ib^jc^k$ with $i \ne j + k$, and peel $n = \min(i, k)$ pairs.
- If $i \le k$: the middle is $b^jc^{k-i}$. It is nonempty, since $j = 0$ and $k = i$ would give $i = j + k$. Use $R$.
- If $i > k$: the middle is $a^{i-k}b^j$ with $i - k \ne j$. If $i - k > j$ it equals $a^{(i-k-j)}\,(a^jb^j)$ with $i - k - j \ge 1$: use $A$. If $i - k < j$: use $Q$.

**Pitfall.** A first attempt often uses $A \to aA \mid a$ (just extra $a$'s) for the "too many $a$'s" case. That misses strings like <code>aab</code> ($i = 2 > 1 = j + k$), where after peeling (nothing to peel: $k = 0$) the middle has both extra $a$'s *and* matched $a$/$b$ pairs. Always test the boundary cases of your case split.`
    },
    {
      id: 'cfg-nonpal3',
      type: 'cfg',
      title: 'Non-palindromes over three symbols',
      difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Give a CFG for $\{w \in \{a,b,c\}^* : w \ne w^R\}$, the strings that are **not** palindromes.`,
      accepts: function (s) { return s !== s.split('').reverse().join(''); },
      sample: String.raw`S -> a S a | b S b | c S c | a T b | a T c | b T a | b T c | c T a | c T b
T -> a T | b T | c T | ε`,
      maxLen: 7,
      hints: [
        'Compare the string with its reversal from the outside in. Where is the first mismatch?',
        'Before the first mismatch the outer symbols match in pairs; after it, the middle is arbitrary.'
      ],
      solution: String.raw`~~~pseudo
S -> aSa | bSb | cSc                     peel matching outer pairs
   | aTb | aTc | bTa | bTc | cTa | cTb    first mismatched pair (x != y)
T -> aT | bT | cT | ε                    anything
~~~
$w$ is not a palindrome iff $w = u\,x\,t\,y\,u^R$ for some strings $u, t$ and symbols $x \ne y$. Indeed, if $w = w_1 \cdots w_n \ne w^R$, let $k$ be the smallest index with $w_k \ne w_{n+1-k}$; then $k < n + 1 - k$ (the middle symbol of an odd-length string always matches itself), $u = w_1 \cdots w_{k-1}$, and the last $k - 1$ symbols are $u^R$ by minimality of $k$. The grammar derives $u\,x\,t\,y\,u^R$ by $|u|$ peeling steps, one mismatch step and $T \Rightarrow^* t$. Conversely every generated string has a mismatched pair at distance $|u|$ from the two ends, so it is not a palindrome. There is no $\varepsilon$ rule for $S$: the empty string and single symbols are palindromes.`
    },
    {
      id: 'cfg-xr-substring',
      type: 'cfg',
      title: String.raw`$x\,c\,y$ where $x^R$ occurs inside $y$`,
      difficulty: 3,
      alphabet: 'abc',
      prompt: String.raw`Give a CFG for $L = \{x\,c\,y : x, y \in \{a,b\}^* \text{ and } x^R \text{ is a substring of } y\}$. (E.g. <code>abcbba</code> is in $L$: $x = ab$, $x^R = ba$, and $y = bba$ contains <code>ba</code>. But <code>abcab</code> is not, and neither is <code>ab</code> (no $c$).)`,
      accepts: function (s) {
        var p = s.split('c');
        if (p.length !== 2) return false;
        return p[1].indexOf(p[0].split('').reverse().join('')) >= 0;
      },
      sample: String.raw`S -> P W
P -> a P a | b P b | c W
W -> a W | b W | ε`,
      maxLen: 8,
      hints: [
        String.raw`If $x^R$ occurs in $y$, then $y = u\,x^R\,v$. So the string is $x\,c\,u\,x^R\,v$.`,
        String.raw`$x \ldots x^R$ is a mirrored pair around the middle $c\,u$. Generate that, then append an arbitrary $v$.`
      ],
      solution: String.raw`$x^R$ is a substring of $y$ iff $y = u\,x^R\,v$ for some $u, v \in \{a,b\}^*$. So
$$L = \{x\,c\,u\,x^R\,v : x, u, v \in \{a,b\}^*\}.$$
~~~pseudo
S -> P W                  P: x c u x^R ;  then W: arbitrary v
P -> a P a | b P b | c W  mirrored pairs around "c u"
W -> a W | b W | ε        W: {a,b}^*
~~~
**Soundness.** $P$ generates $x\,c\,u\,x^R$ (induction on the number of mirror steps), so $S$ generates $x\,c\,u\,x^R\,v$; here $y = ux^Rv$ contains $x^R$. Exactly one $c$ is produced and all other symbols are $a$/$b$.

**Completeness.** If $x\,c\,y \in L$, fix an occurrence $y = u\,x^R\,v$; derive $P \Rightarrow^* x\,c\,u\,x^R$ using the mirror rule for each symbol of $x$ (outermost first) and $c\,W \Rightarrow^* c\,u$, then $W \Rightarrow^* v$.

(The language with "$x^R$ is a **prefix** of $y$" would just drop the $u$: $P \to aPa \mid bPb \mid c$.)`
    },
    {
      id: 'cfg-not-mirror',
      type: 'cfg',
      title: String.raw`$x\,c\,y$ with $y \ne x^R$`,
      difficulty: 2,
      alphabet: 'abc',
      prompt: String.raw`Give a CFG for $L = \{x\,c\,y : x, y \in \{a,b\}^*,\ y \ne x^R\}$. Strings with zero or two or more $c$'s are not in $L$.`,
      accepts: function (s) {
        var p = s.split('c');
        if (p.length !== 2) return false;
        return p[1] !== p[0].split('').reverse().join('');
      },
      sample: String.raw`S -> a S a | b S b | a A b | b A a | P c | c P
A -> W c W
W -> a W | b W | ε
P -> a W | b W`,
      maxLen: 8,
      hints: [
        String.raw`$y = x^R$ means: same length, and the first symbol of $x$ equals the last of $y$, the second equals the second-to-last, ... Compare from the outside in.`,
        'Peel matching outer pairs. The first failure is either a mismatched pair, or one side running out before the other.'
      ],
      solution: String.raw`$y = x^R$ iff pairing the symbols from the two ends of $x\,c\,y$ inward always matches and both sides run out at the same time (at the $c$). So $y \ne x^R$ iff, after peeling some matching outer pairs, we see either a **mismatched** pair or a $c$ with **one side nonempty**.
~~~pseudo
S -> aSa | bSb            peel matching pairs
   | aAb | bAa            first mismatched pair; the rest is anything
   | Pc  | cP             one side ran out first (P nonempty)
A -> W c W                A: {a,b}* c {a,b}*
W -> aW | bW | ε          W: {a,b}*
P -> aW | bW              P: {a,b}^+
~~~
Soundness: a generated string is $u\,z\,u^R$ where $u$ is the peeled part and $z \in a\,A\,b \cup b\,A\,a \cup P\,c \cup c\,P$; in the first two cases the pair at depth $|u|$ mismatches, and in the last two the two sides have different lengths. Either way $y \ne x^R$. Completeness: given $x\,c\,y$ with $y \ne x^R$, peel matching outer pairs as long as both ends are $a/b$ symbols and match; we stop at a mismatch (use $aAb$/$bAa$) or because one end has reached the $c$ while the other side is nonempty (it cannot be that both sides are empty, since then $y = x^R$) — use $Pc$ or $cP$.`
    },
    {
      id: 'cfg-more-a',
      type: 'cfg',
      title: 'More a’s than b’s',
      difficulty: 3,
      alphabet: 'ab',
      prompt: String.raw`Give a CFG for $\{w \in \{a,b\}^* : \#_a(w) > \#_b(w)\}$.`,
      accepts: function (s) {
        var d = 0;
        for (var i = 0; i < s.length; i++) d += (s[i] === 'a') ? 1 : -1;
        return d > 0;
      },
      sample: String.raw`S -> E a E | E a S
E -> a E b E | b E a E | ε`,
      maxLen: 10,
      hints: [
        String.raw`Let $E$ generate the strings with equal counts. Plot the height $\#_a - \#_b$ of each prefix.`,
        String.raw`Look at the **last** time the height is 0. What must the next symbol be?`
      ],
      solution: String.raw`~~~pseudo
S -> E a E | E a S          S: #a > #b
E -> a E b E | b E a E | ε  E: #a = #b
~~~
**Soundness.** $E$ generates equal-count strings (lesson). By induction, $S$ generates strings whose height (count of $a$ minus count of $b$) is $0 + 1 + 0 = 1$ or $0 + 1 + (\text{positive}) \ge 2$.

**Completeness.** Let $w$ have height $d \ge 1$. Consider the prefix heights $h_0 = 0, h_1, \ldots, h_n = d$, and let $i$ be the **last** index with $h_i = 0$. The symbol after position $i$ must be $a$: if it were $b$, the height would drop to $-1$ and, moving in steps of $\pm 1$, would have to pass through 0 again to reach $d \ge 1$, contradicting the choice of $i$. So $w = u\,a\,v$ with $h(u) = 0$ (so $u \in L(E)$) and $h(v) = d - 1$. If $d = 1$, $v \in L(E)$ and we use $S \to EaE$; otherwise $v$ has height $d - 1 \ge 1$ and is shorter than $w$, so by induction $S \Rightarrow^* v$ and we use $S \to EaS$.`
    },
    {
      id: 'cfg-prefix-balanced',
      type: 'cfg',
      title: 'Prefixes of balanced strings',
      difficulty: 2,
      alphabet: '()',
      prompt: String.raw`Give a CFG for the strings $w$ over $\{(, )\}$ such that **every prefix** of $w$ has at least as many ( as ). (These are exactly the prefixes of balanced strings; the whole string need not be balanced. E.g. <code>((</code>, <code>()(</code>, <code>(()</code> are in the language, <code>)(</code> is not.)`,
      accepts: function (s) {
        var d = 0;
        for (var i = 0; i < s.length; i++) { d += (s[i] === '(') ? 1 : -1; if (d < 0) return false; }
        return true;
      },
      sample: String.raw`S -> D | D ( S
D -> ( D ) D | ε`,
      maxLen: 10,
      hints: [
        'Let D generate balanced strings. If w is not balanced, some ( is never closed.',
        'Consider the last time the depth is 0: the next symbol is an unmatched ( and the rest again has all prefixes nonnegative.'
      ],
      solution: String.raw`~~~pseudo
S -> D | D ( S        S: every prefix has #( >= #)
D -> ( D ) D | ε      D: balanced
~~~
**Soundness.** A generated string is $D_1 ( D_2 ( \cdots ( D_k$ with balanced $D_i$; the depth of a prefix is (number of unmatched ( passed) + (depth inside a balanced block) $\ge 0$.

**Completeness.** If $w$ is balanced, use $S \to D$. Otherwise its final depth is $d \ge 1$. Let $i$ be the last time the depth is 0. Then $w_{i+1} = ($ (a ) would make the depth negative), the prefix $u = w_1\cdots w_i$ is balanced, and in the rest $v$ every prefix has depth $\ge 0$ relative to the start of $v$ (the depth of $w$ never returns to 0 after $i$, so it stays $\ge 1$). So $w = u\,(\,v$ with $u \in L(D)$ and $v \in L(S)$ shorter: use $S \to D(S$.

Note the language is not "balanced": the grammar $S \to (S)S \mid \varepsilon$ misses <code>(</code>.`
    },
    {
      id: 'cfg-div3',
      type: 'cfg',
      title: 'From a DFA to a grammar: binary multiples of 3',
      difficulty: 2,
      alphabet: '01',
      prompt: String.raw`Give a CFG for the binary strings (most significant bit first, leading zeros allowed) whose value is divisible by 3. The empty string counts as the value 0. Build a DFA first, then convert it to a right-linear grammar. (Remember: in this app a digit right after a letter is a terminal, so name your nonterminals with letters only, e.g. A, B, C.)`,
      accepts: function (s) {
        var r = 0;
        for (var i = 0; i < s.length; i++) r = (2 * r + (s[i] === '1' ? 1 : 0)) % 3;
        return r === 0;
      },
      sample: String.raw`A -> 0 A | 1 B | ε
B -> 0 C | 1 A
C -> 0 B | 1 C`,
      maxLen: 10,
      hints: [
        String.raw`Reading bit $b$ changes the value $v$ to $2v + b$. Track $v \bmod 3$.`,
        String.raw`States $A, B, C$ for remainders 0, 1, 2. Rule $q \to b\,r$ for each transition, and $A \to \varepsilon$ because remainder 0 is accepting.`
      ],
      solution: String.raw`DFA: states = remainders $\{0, 1, 2\}$, $\delta(r, b) = (2r + b) \bmod 3$, start and accept = 0. Transitions: $0 \xrightarrow{0} 0$, $0 \xrightarrow{1} 1$, $1 \xrightarrow{0} 2$, $1 \xrightarrow{1} 0$, $2 \xrightarrow{0} 1$, $2 \xrightarrow{1} 2$.

Right-linear grammar (one nonterminal per state, $A, B, C$ for remainders $0, 1, 2$):
~~~pseudo
A -> 0A | 1B | ε      A: strings that take the DFA from remainder 0 to acceptance
B -> 0C | 1A
C -> 0B | 1C
~~~
Correctness: by induction on $|w|$, $q \Rightarrow^* w\,r$ iff $\delta^*(q, w) = r$, and a terminal string is produced exactly when the last nonterminal is $A$ (the only one with an $\varepsilon$ rule). So $A \Rightarrow^* w$ iff $\delta^*(0, w) = 0$.`
    },
    {
      id: 'cfg-i-neq-2j',
      type: 'cfg',
      title: String.raw`$0^i1^j$ with $i \ne 2j$`,
      difficulty: 3,
      alphabet: '01',
      prompt: String.raw`Give a CFG for $\{0^i1^j : i \ne 2j\}$.`,
      accepts: function (s) {
        var m = /^(0*)(1*)$/.exec(s);
        return !!m && m[1].length !== 2 * m[2].length;
      },
      sample: String.raw`S -> 0 0 S 1 | A | B | 0 B
A -> 0 A | 0
B -> 1 B | 1`,
      maxLen: 10,
      hints: [
        String.raw`Peel off pairs $00\ldots1$ from the outside. When you have to stop, what is left in the middle?`,
        String.raw`The middle is $0^+$ (too many 0s), or $1^+$ (too many 1s), or $0\,1^+$ (odd number of 0s with 1s left over).`
      ],
      solution: String.raw`~~~pseudo
S -> 00S1 | A | B | 0B     peel (00, 1) pairs, then an unbalanced middle
A -> 0A | 0                A: 0^+
B -> 1B | 1                B: 1^+
~~~
**Soundness.** After $q$ peeling steps the string is $0^{2q}\,m\,1^q$ with middle $m$:
- $m = 0^r$, $r \ge 1$: $i = 2q + r \ne 2q = 2j$.
- $m = 1^s$, $s \ge 1$: $i = 2q \ne 2(q + s) = 2j$.
- $m = 0\,1^s$: $i = 2q + 1$ is odd, so $i \ne 2j$.

**Completeness.** Let $i \ne 2j$. If $i > 2j$, peel $j$ pairs, middle $0^{i - 2j}$. If $i < 2j$, peel $q = \lfloor i/2 \rfloor$ pairs ($q \le j$ since $2q \le i < 2j$); the middle is $0^{i - 2q}1^{j - q}$ with $i - 2q \in \{0, 1\}$ and $j - q \ge 1$ (if $i$ is even, $q = i/2 < j$; if odd, $2q + 1 < 2j$ gives $q < j$). That is a $B$ or a $0B$ middle.`
    },
    {
      id: 'cfg-prove-range',
      type: 'written',
      title: 'Prove a grammar correct: between j and 2j',
      difficulty: 3,
      prompt: String.raw`Let $G$ be $S \to aSb \mid aaSb \mid \varepsilon$. Prove that
$$L(G) = \{a^ib^j : j \le i \le 2j\}.$$
Prove both inclusions carefully.`,
      rubric: [
        'Soundness: states an invariant about every sentential form (a^p S b^q or a^p b^q with q ≤ p ≤ 2q)',
        'Soundness: proves the invariant by induction on the number of derivation steps, checking all three rules',
        'Completeness: for arbitrary a^i b^j with j ≤ i ≤ 2j, gives explicit counts of each rule (r = i − j uses of aaSb, j − r uses of aSb)',
        'Completeness: verifies the counts are nonnegative and produce the right string',
        'Both directions clearly labeled'
      ],
      hints: [
        String.raw`Invariant: every sentential form is $a^pSb^q$ or $a^pb^q$ with $q \le p \le 2q$.`,
        String.raw`For completeness: if you use $aaSb$ exactly $r$ times and $aSb$ exactly $s$ times, you get $a^{s+2r}b^{s+r}$. Solve for $r$, $s$.`
      ],
      solution: String.raw`Let $L = \{a^ib^j : j \le i \le 2j\}$.

**$L(G) \subseteq L$.** Claim: every sentential form derivable from $S$ is $a^pSb^q$ or $a^pb^q$ with $q \le p \le 2q$. Induction on the number of steps. Zero steps: $S = a^0Sb^0$ and $0 \le 0 \le 0$. Step: a form $a^pb^q$ has no nonterminal, so the previous form was $a^pSb^q$ with $q \le p \le 2q$, and
- $S \to aSb$ gives $a^{p+1}Sb^{q+1}$: $q + 1 \le p + 1 \le 2q + 1 \le 2(q+1)$;
- $S \to aaSb$ gives $a^{p+2}Sb^{q+1}$: $q + 1 \le p + 2$ (as $q \le p$) and $p + 2 \le 2q + 2 = 2(q+1)$;
- $S \to \varepsilon$ gives $a^pb^q$ with the same inequalities.

So every terminal string generated is $a^ib^j$ with $j \le i \le 2j$.

**$L \subseteq L(G)$.** Let $j \le i \le 2j$ and set $r = i - j$ and $s = j - r = 2j - i$. Both are $\ge 0$ by the two inequalities. Apply $S \to aaSb$ $r$ times, then $S \to aSb$ $s$ times, then $S \to \varepsilon$. Each $aaSb$ step adds $aa$ on the left of $S$ and $b$ on the right; each $aSb$ step adds $a$ and $b$. The result is $a^{2r + s}b^{r + s}$, and $2r + s = 2(i - j) + 2j - i = i$, $r + s = j$. So $a^ib^j \in L(G)$. $\blacksquare$`
    },
    {
      id: 'cfg-dangling',
      type: 'written',
      title: 'Ambiguity: the dangling else',
      difficulty: 3,
      prompt: String.raw`Think of $a$ as "if-then" and $b$ as "else". Consider the grammar $G$: $S \to aS \mid aSbS \mid \varepsilon$.

(a) Show that $G$ is ambiguous.

(b) Describe $L(G)$ in English (you do not need to prove it).

(c) Give an unambiguous grammar for $L(G)$ and justify why each string has only one parse tree.`,
      rubric: [
        '(a) A specific string (e.g. aab) with two different parse trees / leftmost derivations, shown explicitly',
        '(b) L(G) = strings in which every prefix has #a ≥ #b',
        '(c) Correct grammar, e.g. S → aS | aTbS | ε with T → aTbT | ε',
        '(c) Uniqueness argument: whether the first a is matched is determined by the string; the matching b is unique; induction'
      ],
      hints: [
        'Try the string aab ("if if then else"): which "if" does the else belong to?',
        'In an unambiguous grammar, an a that is matched with a b must have a *balanced* string between them — forbid an unmatched a inside a matched pair.'
      ],
      solution: String.raw`**(a)** The string $aab$ has two leftmost derivations:
$$S \Rightarrow aS \Rightarrow a\,aSbS \Rightarrow aabS \Rightarrow aab$$
(the $b$ belongs to the *second* $a$), and
$$S \Rightarrow aSbS \Rightarrow a\,aS\,bS \Rightarrow aabS \Rightarrow aab$$
(the $b$ belongs to the *first* $a$). Different parse trees (root rule $aS$ vs. $aSbS$), so $G$ is ambiguous.

**(b)** $L(G)$ is the set of strings over $\{a, b\}$ in which every prefix has at least as many $a$'s as $b$'s ("every else has an if").

**(c)** Unambiguous grammar: force everything between a matched $a$ and its $b$ to be **balanced** (no dangling $a$ inside):
~~~pseudo
S -> a S | a T b S | ε     S: every prefix has #a >= #b
T -> a T b T | ε           T: balanced (#a = #b, prefixes >= 0)
~~~
*Why unambiguous.* Let $w \in L$ be nonempty; it starts with $a$. Look at the depth (count of $a$ minus count of $b$) of prefixes.
- If the depth returns to 0 at some point, the root must use $S \to aTbS$: indeed with $S \to aS$ the rest $y$ has all prefix depths $\ge 0$, so the depth of $w$ would stay $\ge 1$ forever. Moreover the $b$ produced by the root is the one at the **first** return to depth 0: $T$ generates a balanced $x$, and every proper prefix of $axb$ has depth $\ge 1$. So $x$ and the rest $y$ are uniquely determined.
- If the depth never returns to 0, the root cannot use $aTbS$ (that would create a return to 0), so it uses $S \to aS$, and the rest is determined.

So the root rule and the split are determined by $w$; $T$ is the standard unambiguous balanced grammar; by induction on $|w|$ every string has exactly one parse tree. (The same languages are generated: the argument above also shows every $w \in L$ has a parse tree.)`
    },
    {
      id: 'cfg-closure-proof',
      type: 'written',
      title: 'Context-free via closure properties',
      difficulty: 2,
      prompt: String.raw`Use closure properties (and small grammars) to prove that each language is context-free. You may use that $\{0^n1^n\}$-style languages are CF and that CFLs are closed under union, concatenation, star, reversal, and intersection with a regular language.

(a) $L_a = \{a^ib^jc^k : i \ne j \text{ or } j \ne k\}$.

(b) $L_b = \overline{\{a^nb^nc^n : n \ge 0\}}$ (complement within $\{a,b,c\}^*$) — even though CFLs are not closed under complement.

(c) $L_c = \{w \in \{a,b\}^* : \#_a(w) = \#_b(w) \text{ and } w \text{ contains no two consecutive } b\text{'s}\}$.

(d) $L_d = \{w\,w^R\,w' : w, w' \in \{a,b\}^*\} \cup \{0^n1^n\}^*$ over $\{a,b,0,1\}$.`,
      rubric: [
        '(a) Writes L_a as a union of CF pieces such as {a^i b^j c^k : i ≠ j} and {a^i b^j c^k : j ≠ k}, each with a grammar or closure argument',
        '(b) Writes the complement as (strings not in a*b*c*) ∪ L_a; notes the first part is regular hence CF',
        '(c) Intersection of the CF equal-count language with the regular language "no bb"',
        '(d) Concatenation / union / star of CF pieces, each justified',
        'Never uses closure under intersection or complement of two CFLs'
      ],
      hints: [
        String.raw`For (a): $\{a^ib^j : i \ne j\} \cdot c^*$ is CF.`,
        String.raw`For (b): a string fails to be $a^nb^nc^n$ either because it is not of the form $a^*b^*c^*$ at all, or because its counts are off.`
      ],
      solution: String.raw`**(a)** $L_a = L_1 \cup L_2$ where $L_1 = \{a^ib^jc^k : i \ne j\} = \{a^ib^j : i \ne j\}\cdot c^*$ and $L_2 = \{a^ib^jc^k : j \ne k\} = a^*\cdot\{b^jc^k : j \ne k\}$. The language $\{a^ib^j : i \ne j\}$ is CF ($S \to aSb \mid A \mid B$, $A \to aA \mid a$, $B \to bB \mid b$), $c^*$ is regular hence CF, and CFLs are closed under concatenation; same for $L_2$. Closure under union gives $L_a$.

**(b)** A string $x \in \{a,b,c\}^*$ is **not** of the form $a^nb^nc^n$ iff either $x \notin a^*b^*c^*$, or $x = a^ib^jc^k$ with not all three equal, i.e. $i \ne j$ or $j \ne k$. So $L_b = \overline{a^*b^*c^*} \cup L_a$. The first part is regular (regular languages are closed under complement), hence CF; $L_a$ is CF by (a); union preserves CF. (This does not contradict non-closure under complement: we used the specific structure of this language.)

**(c)** $L_c = E \cap R$ where $E = \{w : \#_a = \#_b\}$ is CF ($S \to aSbS \mid bSaS \mid \varepsilon$) and $R$ = strings with no $bb$ is regular (a 3-state DFA, or the regex $(a + ba)^*(\varepsilon + b)$). The intersection of a CFL with a regular language is CF.

**(d)** $\{ww^R\}$ is CF ($P \to aPa \mid bPb \mid \varepsilon$), $\{a,b\}^*$ is regular, so $\{ww^R\}\cdot\{a,b\}^*$ is CF by concatenation. $\{0^n1^n\}$ is CF and closed under star gives $\{0^n1^n\}^*$ CF. Union gives $L_d$. Grammar, if wanted: $S \to PW \mid Z$, $P \to aPa \mid bPb \mid \varepsilon$, $W \to aW \mid bW \mid \varepsilon$, $Z \to XZ \mid \varepsilon$, $X \to 0X1 \mid \varepsilon$.`
    },
    {
      id: 'cfg-right-linear',
      type: 'written',
      title: 'Right-linear grammars are exactly the regular languages',
      difficulty: 3,
      prompt: String.raw`A grammar is **right-linear** if every rule has the form $A \to aB$ or $A \to \varepsilon$ (with $a \in \Sigma$ and $A, B$ nonterminals).

(a) Given a DFA $M = (Q, \Sigma, \delta, s, F)$, construct a right-linear grammar $G$ with $L(G) = L(M)$ and prove it correct.

(b) Conversely, given a right-linear grammar $G$, construct an NFA $N$ with $L(N) = L(G)$ and explain why it is correct.

(c) Conclude that right-linear grammars generate exactly the regular languages, and explain why this does not contradict the fact that $S \to 0S1 \mid \varepsilon$ generates a non-regular language.`,
      rubric: [
        '(a) Nonterminals = states, start = s, rules q → a δ(q,a) and q → ε for q ∈ F',
        '(a) Proof by induction on |w| that q ⇒* w r iff δ*(q, w) = r (and the role of the ε rules)',
        '(b) NFA with states = nonterminals, transitions A –a→ B for rules A → aB, accepting states = nonterminals with A → ε',
        '(b) Correctness: derivations correspond to accepting paths',
        '(c) Conclusion and explanation that S → 0S1 is not right-linear (terminal after the nonterminal)'
      ],
      hints: [
        String.raw`Every sentential form of a right-linear grammar is $w\,A$ (terminals followed by a single nonterminal) or a terminal string.`,
        'A derivation step A → aB is exactly a transition of an automaton.'
      ],
      solution: String.raw`**(a)** Nonterminals $Q$, start $s$, rules $q \to a\,\delta(q,a)$ for all $q, a$ and $q \to \varepsilon$ for $q \in F$.

*Lemma.* For all $q, r \in Q$ and $w \in \Sigma^*$: $q \Rightarrow^* w\,r$ iff $\delta^*(q, w) = r$. Induction on $|w|$: for $w = \varepsilon$, the only way to derive a form ending in a nonterminal in zero steps is $q = r$, and $\delta^*(q, \varepsilon) = q$ (a derivation step either applies $q \to a\delta(q,a)$, adding a terminal, or an $\varepsilon$-rule, removing the nonterminal). For $w = a\,x$: a derivation $q \Rightarrow^* a\,x\,r$ must begin with $q \to a\,p$ for $p = \delta(q, a)$ and continue $p \Rightarrow^* x\,r$; by induction that holds iff $\delta^*(p, x) = r$, i.e. iff $\delta^*(q, ax) = r$.

Every terminal derivation is $s \Rightarrow^* w\,r \Rightarrow w$, the last step using $r \to \varepsilon$, which exists iff $r \in F$. So $s \Rightarrow^* w$ iff $\delta^*(s, w) \in F$, i.e. $L(G) = L(M)$.

**(b)** Let $N$ have one state per nonterminal, start state $S$, a transition $A \xrightarrow{a} B$ for each rule $A \to aB$, and accepting states $\{A : A \to \varepsilon \text{ is a rule}\}$. Every sentential form of $G$ is $w\,A$ or a terminal string, so a derivation of $w = a_1\cdots a_n$ is a sequence $S \Rightarrow a_1A_1 \Rightarrow a_1a_2A_2 \Rightarrow \cdots \Rightarrow wA_n \Rightarrow w$, which corresponds exactly to a path $S \xrightarrow{a_1} A_1 \xrightarrow{a_2} \cdots \xrightarrow{a_n} A_n$ in $N$ ending in an accepting state (since $A_n \to \varepsilon$ is a rule). Hence $L(N) = L(G)$.

**(c)** By (a) every regular language has a right-linear grammar; by (b) every right-linear grammar has an NFA, hence a regular language. $S \to 0S1$ is not right-linear: it has a terminal *after* the nonterminal, which lets a derivation remember an unbounded count "on both sides". General CFGs allow that; right-linear ones do not.`
    }
  ]
});
