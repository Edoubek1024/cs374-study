CS374.topic({
  id: 'recursion',
  unit: 'algorithms',
  order: 10,
  title: 'Recursion & Recurrences',
  summary: 'Think recursively with the Recursion Fairy, then analyze recursive algorithms by solving recurrences with unrolling, recursion trees, the Master theorem, and guess-and-induct.',
  objectives: [
    'Design recursive algorithms as reductions to smaller instances of the same problem, trusting the Recursion Fairy',
    'Write the recurrence for the running time of a recursive algorithm',
    'Solve recurrences by unrolling and by recursion trees (decreasing, equal, increasing level sums)',
    'Apply the Master theorem and recognize recurrences it does not cover',
    'Handle unbalanced and square-root recurrences, and verify guesses by induction',
    'Use asymptotic notation precisely and compare growth rates of common functions',
  ],
  lesson: String.raw`## Reductions and the Recursion Fairy

A **reduction** solves problem X by using an algorithm for problem Y as a black box. When you reduce X, you do *not* care how the black box works; you only care that it correctly solves Y. **Recursion** is the special case where the black box solves *the same problem* X, but on a *smaller* instance.

The CS 374 mantra (from Erickson's notes): when you design a recursive algorithm, imagine that a **Recursion Fairy** will solve every smaller instance for you, correctly and for free. Your only jobs are:

1. **Base case(s):** if the instance is small enough, solve it directly.
2. **Recursive case:** reduce the instance to one or more *simpler* instances of the same problem, hand them to the Recursion Fairy, and combine her answers.

> **Key idea.** Do **not** try to trace the recursion in your head. Trusting the recursive call is exactly the inductive hypothesis of a proof by induction. If the base case is right and the reduction is right *assuming* smaller instances are solved correctly, the algorithm is correct.

The formal justification is induction: "assume the algorithm is correct on all instances smaller than the current one" is the strong inductive hypothesis. That is why every recursive algorithm must make progress toward a base case — "smaller" must be measured by some well-founded quantity (length of the input, value of n, number of remaining items...).

### The correctness proof always has the same shape

Pick a size measure (n, the length of the array, the number of remaining items). Then:

1. **Base case.** Check that the algorithm returns the right answer on every input on which it does not recurse.
2. **Inductive hypothesis.** Assume the algorithm returns the right answer on *every* input of size smaller than n (strong induction).
3. **Inductive step.** Show that every recursive call is on a strictly smaller, *valid* input (so the hypothesis applies to it), and that, given correct answers from those calls, the combination step produces the right answer.

Most lost points come from the first half of step 3: forgetting to check that the recursive arguments really are smaller and really are legal inputs (an index range is nonempty, $\lfloor n/2\rfloor \ge 1$, and so on). An algorithm whose "smaller" call is not actually smaller is not wrong in its answers — it simply never returns.

**Try it first.** Design a recursive algorithm that computes $a^n$ for a number a and an integer $n \ge 0$ using only $O(\log n)$ multiplications. Write the recurrence for the number of multiplications and prove the algorithm correct.

~~~~reveal Solution: exponentiation by squaring
The Recursion Fairy can hand us $a^{\lfloor n/2\rfloor}$. Squaring it gives $a^{2\lfloor n/2\rfloor}$, which is $a^n$ if n is even and $a^{n-1}$ if n is odd.

~~~pseudo
Power(a, n):
    if n = 0: return 1
    h = Power(a, floor(n/2))
    if n is even: return h * h
    else:         return h * h * a
~~~

**Correctness** (strong induction on n). Base: $n = 0$ returns $1 = a^0$. Step: for $n \ge 1$ we have $0 \le \lfloor n/2\rfloor < n$, so by the hypothesis $h = a^{\lfloor n/2\rfloor}$. If n is even, $h^2 = a^{n}$; if n is odd, $\lfloor n/2\rfloor = (n-1)/2$ and $h^2 a = a^{n-1}a = a^n$.

**Cost.** Let M(n) be the number of multiplications: $M(0) = 0$ and $M(n) \le M(\lfloor n/2\rfloor) + 2$. This is the binary-search recurrence, so $M(n) = \Theta(\log n)$. Precisely, for $n \ge 1$ the chain $n, \lfloor n/2\rfloor, \dots, 1$ has $\lfloor\lg n\rfloor + 1$ calls, each doing at most 2 multiplications.

**A tempting mistake.** Writing <code>return Power(a, n/2) * Power(a, n/2)</code> makes *two* recursive calls: $M(n) = 2M(n/2) + 1 = \Theta(n)$ — no better than multiplying n times. Computing the same value twice destroys the speedup.
~~~~

## Tower of Hanoi

There are three pegs and n disks of distinct sizes stacked on peg 1, largest at the bottom. Move the whole stack to peg 3, moving one disk at a time and never placing a larger disk on a smaller one.

**The recursive insight.** Do not think about the smallest disk; think about the **largest**. At some moment the largest disk must move from peg 1 to peg 3. At that moment, all other n−1 disks must be on peg 2 (they can't be on peg 1 above it or on peg 3 where it is landing). So:

~~~pseudo
Hanoi(n, src, dst, tmp):
    if n > 0:
        Hanoi(n-1, src, tmp, dst)     // Recursion Fairy moves n-1 disks out of the way
        move disk n from src to dst
        Hanoi(n-1, tmp, dst, src)     // Recursion Fairy moves them back on top
~~~

Notice that the Recursion Fairy doesn't care that the bigger disk n is sitting on some peg: with respect to the n−1 smaller disks, a peg holding only larger disks behaves like an empty peg.

**Analysis.** Let T(n) be the number of moves. Then

$$T(0) = 0, \qquad T(n) = 2T(n-1) + 1.$$

Unrolling: $T(n) = 2T(n-1)+1 = 4T(n-2)+2+1 = \dots = 2^k T(n-k) + (2^{k-1} + \dots + 2 + 1)$. With k = n, $T(n) = 2^n - 1$. (Check by induction: $2(2^{n-1}-1)+1 = 2^n - 1$.)

This is also **optimal**: any solution must move disk n at least once, and before its first move the other n−1 disks must have been moved off it (≥ T(n−1) moves by induction), and after its last move they must be moved back on top (≥ T(n−1) more). So every solution uses at least $2T(n-1)+1$ moves.

## Asymptotic notation refresher

For functions $f, g : \mathbb{N} \to \mathbb{R}_{\ge 0}$:

| Notation | Meaning | Informally |
|---|---|---|
| $f = O(g)$ | $\exists c>0, n_0$ with $f(n) \le c\, g(n)$ for all $n \ge n_0$ | f grows no faster than g |
| $f = \Omega(g)$ | $\exists c>0, n_0$ with $f(n) \ge c\, g(n)$ for all $n \ge n_0$ | f grows at least as fast as g |
| $f = \Theta(g)$ | both $O(g)$ and $\Omega(g)$ | same growth rate |
| $f = o(g)$ | $\lim f(n)/g(n) = 0$ | f grows strictly slower |
| $f = \omega(g)$ | $\lim f(n)/g(n) = \infty$ | f grows strictly faster |

Facts you will use constantly:

- **Log bases don't matter:** $\log_a n = \log_b n / \log_b a$, so $\log_2 n = \Theta(\log_{10} n)$. But bases in *exponents* matter: $4^{\lg n} = n^2$ while $2^{\lg n} = n$.
- **Constants in exponents matter:** $2^{2n} = 4^n \ne O(2^n)$, but $2^{n+1} = 2\cdot 2^n = \Theta(2^n)$.
- **Hierarchy:** for any constants $a, \varepsilon > 0$ and $b > 1$: $\log^a n = o(n^{\varepsilon})$ and $n^a = o(b^n)$. Also $b^n = o(n!)$ and $n! = o(n^n)$.
- $\lg(n!) = \Theta(n \log n)$ (by Stirling, or since $(n/2)^{n/2} \le n! \le n^n$).
- **Sums:** $\sum_{i=1}^n i = n(n+1)/2 = \Theta(n^2)$; $\sum_{i=1}^n i^k = \Theta(n^{k+1})$; harmonic $H_n = \sum_{i=1}^n 1/i = \Theta(\log n)$.
- **Geometric series:** $\sum_{i=0}^{L} r^i$ is $\Theta(1)$ if $r<1$, $\Theta(L)$ if $r = 1$, and $\Theta(r^L)$ if $r>1$ (for constant r). *This one fact drives the entire recursion-tree method.*

> **Warning.** "$f(n) = O(g(n))$" is an upper bound only. Saying mergesort is $O(n^3)$ is true but useless. On exams, give **tight** ($\Theta$) bounds whenever asked to "solve" a recurrence.

## What a recurrence is (and why floors and ceilings don't matter)

A recurrence defines a function in terms of its values on smaller inputs. For a recursive algorithm, T(n) = (time for the recursive calls) + (time for the non-recursive work). Mergesort splits into halves of size $\lceil n/2 \rceil$ and $\lfloor n/2 \rfloor$ and merges in linear time:

$$T(n) = T(\lceil n/2 \rceil) + T(\lfloor n/2 \rfloor) + \Theta(n).$$

In CS 374 we routinely **drop floors and ceilings** and write $T(n) = 2T(n/2) + \Theta(n)$. This is safe for every recurrence you'll see in this course: changing the argument of a recursive call by a constant, or rounding it, does not change the asymptotic solution. (One way to justify it is a *domain transformation*: e.g. define $S(n) = T(n + \alpha)$ for a suitable constant $\alpha$ so that the rounded recurrence for S is bounded above and below by clean ones.) Likewise we ignore the exact base case: as long as T(n) is a constant for n below some constant, the asymptotic solution is the same.

## From code to a recurrence

Before you can solve a recurrence you have to write it down correctly, and exams test this directly. The recipe:

1. Name the size parameter n and let T(n) be the worst-case time on inputs of size n.
2. For each recursive call that is **executed**, write a term $T(\text{size of that call})$. A call inside a loop is executed once per iteration; a value computed once and reused costs one call.
3. Add the time of everything else (loops, merging, copying) as a function of n.
4. Add a base case: $T(n) = O(1)$ for n at most some constant.

~~~~steps Walkthrough: writing and solving the recurrence for a mystery function
Consider:

~~~pseudo
Mystery(n):
    if n <= 1: return 1
    s = 0
    for i = 1 to n:
        for j = 1 to n:
            s = s + i*j
    return s + Mystery(n/2) + Mystery(n/2) + Mystery(n/2) + Mystery(n/2) + Mystery(n/2)
~~~

We want the running time T(n), up to Θ.
+++
**Count the recursive calls.** Five calls are executed, each on an input of size n/2 (nothing is reused). That contributes $5T(n/2)$.
+++
**Count the other work.** The doubly nested loop does $n^2$ constant-time iterations; everything else is O(1). So
$$T(n) = 5T(n/2) + \Theta(n^2), \qquad T(1) = \Theta(1).$$
+++
**Draw the tree.** Level i has $5^i$ nodes of size $n/2^i$, each costing $(n/2^i)^2 = n^2/4^i$. The level sum is $(5/4)^i n^2$: **increasing** geometrically.
+++
**Conclude.** Increasing level sums mean the leaves dominate. There are $5^{\lg n} = n^{\lg 5} \approx n^{2.32}$ leaves, so $T(n) = \Theta(n^{\lg 5})$. (Master theorem check: $n^{\log_2 5} \approx n^{2.32}$ beats $f(n) = n^2$ by a polynomial factor, case 1.)
+++
**Exam trap.** If the last line were instead <code>t = Mystery(n/2); return s + 5*t</code>, only *one* call would be executed: $T(n) = T(n/2) + \Theta(n^2) = \Theta(n^2)$. Count executed calls, not the number of times the function's name appears in a formula.
~~~~

**Try it first.** Write and solve the recurrence for the running time of

~~~pseudo
Sum(n):
    if n <= 1: return 1
    s = 0
    for i = 1 to n-1:
        s = s + Sum(i)
    return s
~~~

~~~reveal Solution
The loop calls Sum(i) once for every i from 1 to n−1, plus Θ(n) loop overhead, so (writing the overhead as exactly cn)
$$T(n) = \sum_{i=1}^{n-1} T(i) + cn.$$
This is not a standard shape, so subtract the same equation for n−1: $T(n) - T(n-1) = T(n-1) + c$, i.e. $T(n) = 2T(n-1) + c$, which unrolls to $\Theta(2^n)$. The name Sum appears only once in the code, but it is called n−1 times per invocation. (Memoizing Sum(1), ..., Sum(n−1) would cut the time to Θ(n²), and a running total to Θ(n).)
~~~

## Method 1: Unrolling (iteration)

Expand the recurrence repeatedly until a pattern appears, then sum.

**Example: $T(n) = T(n-1) + n$, $T(0) = 0$.**

$$T(n) = n + (n-1) + T(n-2) = \dots = n + (n-1) + \dots + 1 + T(0) = \frac{n(n+1)}{2} = \Theta(n^2).$$

This is the running time of selection sort / insertion sort in the worst case and of quicksort with a terrible pivot.

**More unrolling results to know cold:**

| Recurrence | Solution |
|---|---|
| $T(n) = T(n-1) + 1$ | $\Theta(n)$ |
| $T(n) = T(n-1) + n$ | $\Theta(n^2)$ |
| $T(n) = T(n-1) + \log n$ | $\Theta(n \log n)$ (it's $\lg n!$) |
| $T(n) = T(n-2) + n$ | $\Theta(n^2)$ |
| $T(n) = 2T(n-1) + 1$ | $\Theta(2^n)$ |
| $T(n) = T(n-1) + T(n-2) + 1$ | $\Theta(\phi^n)$, $\phi = (1+\sqrt5)/2 \approx 1.618$ |
| $T(n) = T(n/2) + 1$ | $\Theta(\log n)$ |
| $T(n) = T(n/2) + n$ | $\Theta(n)$ |

### Subtract-and-conquer in general

For $T(n) = a\,T(n-b) + f(n)$ with constants $a \ge 1$ and $b \ge 1$, the recursion tree has depth about $n/b$ and $a^i$ nodes at level i.

- If $a = 1$, the tree is a path, and T(n) is just the sum of f along it: $T(n) = \Theta\big(\sum_{i} f(n - ib)\big)$.
- If $a > 1$ and f is at most polynomial, the leaves dominate and $T(n) = \Theta(a^{n/b})$. (Group the terms by their distance j from the leaves: $T(n) = a^{n/b}\sum_j f(jb)/a^j$, and the sum converges.) For example $2T(n-1) + n = \Theta(2^n)$, while $2T(n-2) + 1 = \Theta(2^{n/2}) = \Theta(\sqrt 2^{\,n})$ — *not* $\Theta(2^n)$, because bases of exponentials matter.

**Try it first.** Solve (a) $T(n) = T(n-1) + 1/n$; (b) $T(n) = n\,T(n-1) + 1$ with $T(0) = 1$; (c) $T(n) = T(n-1) + n\lg n$.

~~~reveal Solutions
**(a)** Unroll: $T(n) = T(0) + 1/1 + 1/2 + \dots + 1/n = T(0) + H_n = \Theta(\log n)$. T(n) keeps growing even though each step adds less and less, because the harmonic series diverges.

**(b)** The multiplier depends on n, so divide by $n!$: with $U(n) = T(n)/n!$ we get $U(n) = U(n-1) + 1/n!$, so $U(n) = \sum_{k=0}^n 1/k!$, which lies between 1 and $e$. Hence $T(n) = \Theta(n!)$. (In fact $T(n) = \lfloor e\cdot n!\rfloor$ for $n \ge 1$.)

**(c)** $T(n) = \sum_{k=2}^n k\lg k + O(1) \le n^2\lg n$, and the top half of the terms alone contribute at least $(n/2)\cdot(n/2)\lg(n/2)$. So $T(n) = \Theta(n^2\log n)$.
~~~

## Method 2: Recursion trees

Draw the tree of recursive calls. Label each node with the **non-recursive work** done by that call. T(n) is the sum of all labels. Sum **level by level**.

For $T(n) = r\,T(n/c) + f(n)$: level i has $r^i$ nodes, each labeled $f(n/c^i)$, and the depth is $L = \log_c n$. So

$$T(n) = \sum_{i=0}^{L} r^i f(n/c^i).$$

Very often the level sums form (roughly) a **geometric series**, and then there are exactly three cases:

| Level sums | T(n) is dominated by | Solution |
|---|---|---|
| **decreasing** geometrically | the root | $\Theta(f(n))$ |
| **all equal** (up to constants) | every level equally | $\Theta(f(n) \cdot L) = \Theta(f(n)\log n)$ |
| **increasing** geometrically | the leaves | $\Theta(\text{number of leaves}) = \Theta(r^L) = \Theta(n^{\log_c r})$ |

**Example (equal): mergesort, $T(n) = 2T(n/2) + n$.** Level i has $2^i$ nodes of cost $n/2^i$, so every level sums to n. There are $\lg n + 1$ levels, so $T(n) = \Theta(n \log n)$.

**Example (increasing): $T(n) = 3T(n/2) + n$.** Level i sums to $3^i \cdot n/2^i = (3/2)^i n$. Increasing, so the leaves dominate: $3^{\lg n} = n^{\lg 3} \approx n^{1.585}$. So $T(n) = \Theta(n^{\lg 3})$. (This is Karatsuba's multiplication algorithm.)

**Example (decreasing): $T(n) = 2T(n/2) + n^2$.** Level i sums to $2^i (n/2^i)^2 = n^2/2^i$. Decreasing, so the root dominates: $T(n) = \Theta(n^2)$.

> **Exam tip.** To decide the case, you usually only need to compare the **root** with the **sum of its children**. If the children sum to a constant factor less than the root, the sums decrease; equal, all levels are equal; more, they increase. Always write the level sum as a formula in i — graders want to see it.

### Unbalanced trees: $T(n) = T(n/5) + T(7n/10) + n$

This is the recurrence of linear-time selection (median of medians). The tree is not uniform, but level sums are easy: the root costs n; its children cost $n/5 + 7n/10 = 9n/10$; each node of cost m has children costing $9m/10$ in total, so level i sums to **at most** $(9/10)^i n$ (some branches end early, which only makes the sums smaller). The series is decreasing:

$$T(n) \le \sum_{i \ge 0} (9/10)^i n = 10n, \qquad\text{and clearly } T(n) \ge n, \text{ so } T(n) = \Theta(n).$$

The key is that $1/5 + 7/10 < 1$. Compare:

- $T(n) = T(n/3) + T(2n/3) + n$: every *full* level sums to exactly n. The shallowest leaf is at depth $\log_3 n$ and the deepest at $\log_{3/2} n$; both are $\Theta(\log n)$. Upper bound $n \log_{3/2} n$, lower bound $n \log_3 n$, so $T(n) = \Theta(n \log n)$.
- $T(n) = T(n/2) + T(n/3) + T(n/6) + n$: fractions sum to 1, so again $\Theta(n \log n)$.
- $T(n) = T(n/2) + T(n/4) + n^2$: children sum to $n^2/4 + n^2/16 = 5n^2/16 < n^2$, decreasing, $\Theta(n^2)$.

### The sum-of-fractions rule

For $T(n) = T(\alpha_1 n) + T(\alpha_2 n) + \dots + T(\alpha_k n) + n$ with constants $0 < \alpha_j < 1$, a node of cost m has children of total cost $s\cdot m$, where $s = \alpha_1 + \dots + \alpha_k$.

| s | level sums | solution |
|---|---|---|
| $s < 1$ | decrease geometrically | $\Theta(n)$ |
| $s = 1$ | equal (on full levels) | $\Theta(n\log n)$ |
| $s > 1$ | increase | $\Theta(n^p)$, where $p > 1$ solves $\sum_j \alpha_j^{\,p} = 1$ |

The third row is a special case of the **Akra–Bazzi theorem**. You will rarely need it in CS 374, but you should recognize that the answer is a polynomial with an unusual exponent. Example: $T(n) = T(n/2) + T(n/3) + T(n/4) + n$ has $s = 13/12 > 1$, and $2^{-p} + 3^{-p} + 4^{-p} = 1$ gives $p \approx 1.082$.

The same idea handles other work functions. In $T(n) = T(n/2) + T(n/4) + 1$ the work per node is tiny, so the leaves dominate and $T(n) = \Theta(n^p)$ where $(1/2)^p + (1/4)^p = 1$. Setting $x = 2^{-p}$ gives $x + x^2 = 1$, so $x = 1/\phi$ and $p = \lg\phi \approx 0.694$. (Equivalently, for $n = 2^k$, $L(k) = T(2^k)$ satisfies the Fibonacci-like $L(k) = L(k-1) + L(k-2) + 1$, so $T(n) = \Theta(\phi^k) = \Theta(n^{\lg\phi})$.)

**Try it first.** Solve $T(n) = T(n/2) + T(n/4) + T(n/8) + n$ and prove your answer by induction (ignore floors; take $T(n) = 1$ for $1 \le n < 8$).

~~~reveal Solution
The fractions sum to $1/2 + 1/4 + 1/8 = 7/8 < 1$, so level i sums to at most $(7/8)^i n$ and $T(n) \le n\sum_i (7/8)^i = 8n$. Guess $T(n) = \Theta(n)$.

*Proof that $T(n) \le 8n$ for all $n \ge 1$.* Base ($1 \le n < 8$): $T(n) = 1 \le 8n$. Step ($n \ge 8$): the arguments $n/2, n/4, n/8$ are at least 1 and less than n, so by the inductive hypothesis
$$T(n) \le 8\cdot\frac n2 + 8\cdot\frac n4 + 8\cdot\frac n8 + n = 4n + 2n + n + n = 8n.$$
The constant 8 is exactly $1/(1 - 7/8)$. Since the root alone gives $T(n) \ge n$, $T(n) = \Theta(n)$.
~~~

### When level sums are not geometric

$T(n) = 2T(n/2) + n\lg n$: level i sums to $2^i \cdot (n/2^i)\lg(n/2^i) = n(\lg n - i)$. Summing over $i = 0..\lg n$ gives $n \sum_{j=0}^{\lg n} j = \Theta(n \log^2 n)$.

$T(n) = 2T(n/2) + n/\lg n$: level i sums to $n/(\lg n - i)$. Summing gives $n(1 + 1/2 + \dots + 1/\lg n) = n H_{\lg n} = \Theta(n \log\log n)$.

~~~steps Walkthrough: a full recursion-tree solution of $T(n) = 4T(n/2) + n^2\lg n$
**Set up the tree.** A node of size m has 4 children of size m/2 and does $m^2\lg m$ non-recursive work. Level i has $4^i$ nodes of size $n/2^i$, and the leaves are at depth $L = \lg n$.
+++
**Cost of one node at level i.** $(n/2^i)^2\lg(n/2^i) = \dfrac{n^2}{4^i}(\lg n - i)$.
+++
**Level sum.** Multiply by the number of nodes: $4^i \cdot \dfrac{n^2}{4^i}(\lg n - i) = n^2(\lg n - i)$. The sums *decrease*, but only arithmetically (by $n^2$ per level), not geometrically — none of the three geometric cases applies, so we must actually add.
+++
**Add the levels.** Substitute $j = \lg n - i$:
$$\sum_{i=0}^{\lg n - 1} n^2(\lg n - i) = n^2\sum_{j=1}^{\lg n} j = n^2\cdot\frac{\lg n\,(\lg n + 1)}{2}.$$
The leaf level contributes $4^{\lg n}\cdot\Theta(1) = \Theta(n^2)$, which is lower order.
+++
**Answer.** $T(n) = \Theta(n^2\log^2 n)$, in agreement with the extended Master theorem (case 2 with $n^{\log_2 4} = n^2$ and $k = 1$). A numerical check with $T(n) = 1$ for $n \le 2$: at $n = 2^{40}$ the ratio $T(n)/(n^2\lg^2 n)$ is about 0.51, approaching the 1/2 predicted by the sum.
~~~

**Try it first.** Solve $T(n) = 2T(n/4) + \sqrt n$, then see what changes for $2T(n/4) + 1$ and $2T(n/4) + n$.

~~~reveal Solution
Level i has $2^i$ nodes of size $n/4^i$, each costing $\sqrt{n/4^i} = \sqrt n/2^i$. Level sum: $2^i\cdot\sqrt n/2^i = \sqrt n$ — **equal**. The depth is $\log_4 n$, so $T(n) = \Theta(\sqrt n\log n)$.

- $2T(n/4) + 1$: level sums $2^i$, increasing; there are $2^{\log_4 n} = n^{\log_4 2} = \sqrt n$ leaves, so $\Theta(\sqrt n)$.
- $2T(n/4) + n$: level sums $2^i \cdot n/4^i = n/2^i$, decreasing; the root dominates: $\Theta(n)$.

The "critical" amount of work is always the leaf count $n^{\log_b a}$ — here $\sqrt n$. Work polynomially smaller than that: the leaves win. Equal: multiply by the depth. Polynomially larger: the root wins.
~~~

## Method 3: The Master theorem

For recurrences of the form $T(n) = a\,T(n/b) + f(n)$ with constants $a \ge 1$, $b > 1$, compare $f(n)$ with the leaf count $n^{\log_b a}$:

> **Theorem.** (Master theorem.) Let $T(n) = a\,T(n/b) + f(n)$.
> 1. If $f(n) = O(n^{\log_b a - \varepsilon})$ for some $\varepsilon > 0$, then $T(n) = \Theta(n^{\log_b a})$. *(leaves dominate)*
> 2. If $f(n) = \Theta(n^{\log_b a} \log^k n)$ for some $k \ge 0$, then $T(n) = \Theta(n^{\log_b a} \log^{k+1} n)$. *(all levels comparable)*
> 3. If $f(n) = \Omega(n^{\log_b a + \varepsilon})$ for some $\varepsilon > 0$ **and** $a f(n/b) \le c f(n)$ for some constant $c < 1$ and all large n (regularity), then $T(n) = \Theta(f(n))$. *(root dominates)*

Erickson's notes phrase this exactly as the recursion-tree trichotomy: if $a f(n/b) = \kappa f(n)$ for a constant κ, then T(n) is $\Theta(f(n))$ if κ < 1, $\Theta(f(n)\log n)$ if κ = 1, and $\Theta(n^{\log_b a})$ if κ > 1. Knowing the recursion tree means you never need to memorize the Master theorem.

| Recurrence | a, b, $n^{\log_b a}$ | f(n) | Case | Solution |
|---|---|---|---|---|
| $2T(n/2) + n$ | 2, 2, n | n | 2 (k=0) | $\Theta(n \log n)$ |
| $T(n/2) + 1$ | 1, 2, 1 | 1 | 2 | $\Theta(\log n)$ |
| $3T(n/2) + n$ | 3, 2, $n^{1.585}$ | n | 1 | $\Theta(n^{\lg 3})$ |
| $7T(n/2) + n^2$ | 7, 2, $n^{2.807}$ | $n^2$ | 1 | $\Theta(n^{\lg 7})$ |
| $4T(n/2) + n^2$ | 4, 2, $n^2$ | $n^2$ | 2 | $\Theta(n^2 \log n)$ |
| $2T(n/4) + \sqrt n$ | 2, 4, $\sqrt n$ | $\sqrt n$ | 2 | $\Theta(\sqrt n \log n)$ |
| $2T(n/2) + n^2$ | 2, 2, n | $n^2$ | 3 | $\Theta(n^2)$ |
| $2T(n/2) + n \lg n$ | 2, 2, n | $n \lg n$ | 2 (k=1) | $\Theta(n \log^2 n)$ |

> **Warning.** The Master theorem does **not** apply to $T(n) = T(n-1) + n$ (not of the form $n/b$), to $T(n/5)+T(7n/10)+n$ (two different subproblem sizes), or to $2T(n/2) + n/\lg n$ (falls in the gap between cases 1 and 2; the answer is $\Theta(n\log\log n)$). Recursion trees handle all of these.

~~~steps Proof of the Master theorem via the recursion tree
**Setup.** Assume n is a power of b (floors don't matter) and $T(1) = \Theta(1)$. The tree has depth $L = \log_b n$, and level i has $a^i$ nodes of size $n/b^i$. Write $d = \log_b a$, so $a = b^d$ and the number of leaves is $a^L = a^{\log_b n} = n^{\log_b a} = n^d$. Then
$$T(n) = \Theta(n^d) + \sum_{i=0}^{L-1} a^i f(n/b^i).$$
+++
**Case 1: $f(n) \le C n^{d-\varepsilon}$.** Level i costs at most
$$a^i C\Big(\frac{n}{b^i}\Big)^{d-\varepsilon} = C n^{d-\varepsilon}\Big(\frac{a}{b^{d-\varepsilon}}\Big)^i = C n^{d-\varepsilon}\,(b^{\varepsilon})^i.$$
This is an **increasing** geometric series with ratio $b^\varepsilon > 1$, so the sum is dominated by its last term: $O(n^{d-\varepsilon}\, b^{\varepsilon L}) = O(n^{d-\varepsilon} n^{\varepsilon}) = O(n^d)$. Adding the leaves, $T(n) = \Theta(n^d)$.
+++
**Case 2: $f(n) = \Theta(n^d\log^k n)$.** Using $(n/b^i)^d = n^d/a^i$ and $\log(n/b^i) = (L-i)\log b$, level i costs
$$a^i\cdot\Theta\Big(\frac{n^d}{a^i}\,(L-i)^k\Big) = \Theta\big(n^d (L - i)^k\big).$$
Summing over i and substituting $j = L - i$: $n^d\sum_{j=1}^{L} j^k = \Theta(n^d L^{k+1})$. So $T(n) = \Theta(n^d\log^{k+1} n)$.
+++
**Case 3: regularity $a f(n/b) \le c f(n)$ with $c < 1$.** Applying it i times, level i costs $a^i f(n/b^i) \le c^i f(n)$: a **decreasing** geometric series, with total at most $f(n)/(1-c)$. The leaves cost $n^d = o(f(n))$ because $f(n) = \Omega(n^{d+\varepsilon})$, and the root alone costs $f(n)$. So $T(n) = \Theta(f(n))$.
+++
**What the proof tells you.** The three cases are exactly "level sums increase / stay level / decrease". When a recurrence falls outside the theorem's hypotheses, the same sum $\sum_i a^i f(n/b^i)$ still describes T(n); you just evaluate it by hand, as in the $n/\lg n$ and $n^2\lg n$ examples.
~~~

### Master theorem traps

- **a must be a constant ≥ 1 and b a constant > 1.** $T(n) = n\,T(n/2) + 1$ (a depends on n), $T(n) = \frac12T(n/2) + n$ (a < 1, which also doesn't describe a real algorithm) and $T(n) = T(n-1) + n$ (no division at all) are all out of scope.
- **Exactly one subproblem size.** $T(n/3) + T(2n/3) + n$ does not have the form; use the tree or the sum-of-fractions rule.
- **The gaps between cases.** In $2T(n/2) + n/\lg n$, f is smaller than $n^{\log_b a} = n$ but not polynomially smaller. Similarly $4T(n/2) + n^2/\lg^2 n$ is in a gap; its level sums $n^2/(\lg n - i)^2$ form a convergent series, so the answer is $\Theta(n^2)$.
- **Regularity.** For every polynomial-times-log f you will meet, the regularity condition of case 3 holds automatically. It can fail for oscillating functions (the classic example is $T(n) = T(n/2) + n(2 - \cos n)$).
- **Compute $\log_b a$ the right way up.** For $2T(n/4) + f(n)$, the leaf count is $n^{\log_4 2} = \sqrt n$, not $n^2$.

## Square-root recurrences

When the subproblem size is $\sqrt n$, the depth of the tree is the number of square roots needed to bring n down to a constant: $n^{1/2^L} = 2 \iff L = \lg\lg n$.

**$T(n) = \sqrt n\, T(\sqrt n) + n$.** The root costs n. Level 1 has $\sqrt n$ nodes each costing $\sqrt n$: total n. Level 2 has $\sqrt n \cdot n^{1/4}$ nodes each costing $n^{1/4}$: total n. Every level sums to n and there are $\Theta(\log\log n)$ levels, so $T(n) = \Theta(n \log\log n)$.

**Change of variables.** For $T(n) = 2T(\sqrt n) + \lg n$, set $m = \lg n$ and $S(m) = T(2^m)$. Then $\sqrt n = 2^{m/2}$ and

$$S(m) = 2S(m/2) + m \implies S(m) = \Theta(m \log m) \implies T(n) = \Theta(\log n \log\log n).$$

Similarly $T(n) = T(\sqrt n) + 1$ becomes $S(m) = S(m/2) + 1$, so $T(n) = \Theta(\log\log n)$; and $T(n) = 2T(\sqrt n) + 1$ becomes $S(m) = 2S(m/2) + 1$, so $T(n) = \Theta(\log n)$.

**Dividing out the multiplier.** When the recurrence has the form $T(n) = c\sqrt n\,T(\sqrt n) + f(n)$, divide both sides by n. Since $\sqrt n\,T(\sqrt n)/n = T(\sqrt n)/\sqrt n$, the function $U(n) = T(n)/n$ satisfies $U(n) = c\,U(\sqrt n) + f(n)/n$ — no multiplier left — and the change of variables finishes the job. For instance $\sqrt n\,T(\sqrt n) + n$ becomes $U(n) = U(\sqrt n) + 1 = \Theta(\log\log n)$, matching the tree.

**Try it first.** Solve $T(n) = 2\sqrt n\,T(\sqrt n) + n$.

~~~reveal Solution
Divide by n: $U(n) = 2U(\sqrt n) + 1$ where $U(n) = T(n)/n$. With $m = \lg n$ and $S(m) = U(2^m)$: $S(m) = 2S(m/2) + 1 = \Theta(m)$. So $U(n) = \Theta(\log n)$ and $T(n) = \Theta(n\log n)$.

Recursion-tree check: level 1 has $2\sqrt n$ nodes of cost $\sqrt n$ (sum $2n$); level 2 has $2\sqrt n\cdot 2n^{1/4}$ nodes of cost $n^{1/4}$ (sum $4n$); in general level j sums to $2^j n$. The sums *increase*, and with $\lg\lg n$ levels the last one dominates: $2^{\lg\lg n}\,n = n\lg n$. Without the factor 2, every level sums to n and the answer is only $\Theta(n\log\log n)$ — a small constant inside the recurrence changed the answer.
~~~

## Method 4: Guess and verify by induction

Recursion trees give you the answer; induction gives a rigorous proof. Guess a bound with an explicit constant, then prove it.

**Example.** $T(n) = T(\lfloor n/5\rfloor) + T(\lfloor 7n/10\rfloor) + n$ for $n \ge 10$ and $T(n) = 1$ for $1 \le n < 10$. *Claim:* $T(n) \le 10n$ for all $n \ge 1$.

- *Base* ($1 \le n < 10$): $T(n) = 1 \le 10n$.
- *Inductive step* ($n \ge 10$): both $\lfloor n/5\rfloor$ and $\lfloor 7n/10\rfloor$ are between 1 and n−1, so by the inductive hypothesis
$$T(n) \le 10\lfloor n/5\rfloor + 10\lfloor 7n/10 \rfloor + n \le 2n + 7n + n = 10n.$$

Where did 10 come from? We needed $c/5 + 7c/10 + 1 \le c$, i.e. $c \ge 10$ — exactly the recursion-tree sum $1/(1 - 9/10)$.

> **Warning.** Never put $O(\cdot)$ inside the inductive hypothesis. The "proof" "$T(n) = 2T(n/2) + n = 2\,O(n/2) + n = O(n)$" is **wrong** — the hidden constant grows at every level. With an explicit constant, $T(n) \le 2c(n/2) + n = cn + n$, which is *not* $\le cn$. The induction fails, as it must, since mergesort is $\Theta(n\log n)$.

**Correct version.** Claim $T(n) \le n\lg n$ for $T(n) = 2T(n/2) + n$, $T(1) = 0$, n a power of 2: $T(n) \le 2(n/2)\lg(n/2) + n = n(\lg n - 1) + n = n\lg n$. ✓

### Strengthening the hypothesis

Sometimes a correct guess fails in the inductive step by a lower-order term. For $T(n) = 2T(n/2) + 1$, $T(1) = 1$, the guess $T(n) \le cn$ gives only $T(n) \le cn + 1$ — even though the answer really is $\Theta(n)$. The fix is counterintuitive: prove something **stronger**, $T(n) \le cn - d$. Then
$$T(n) \le 2\Big(c\,\frac n2 - d\Big) + 1 = cn - 2d + 1 \le cn - d \quad\text{whenever } d \ge 1.$$
With $c = 2$, $d = 1$ the base case $T(1) = 1 \le 2 - 1$ holds, so $T(n) \le 2n - 1$ (with equality for powers of 2). A stronger claim is also a stronger *assumption* about the smaller instances, and that is what makes the step go through. (Contrast mergesort: there no choice of lower-order term rescues $T(n) \le cn$, because the bound is false.)

### Worked proof: $T(n) = T(n/3) + T(2n/3) + n$ is $\Theta(n\log n)$

Take $T(n) = 1$ for $1 \le n < 3$ and the recurrence for $n \ge 3$ (real n, no floors). The useful identity is
$$\frac n3\lg\frac n3 + \frac{2n}3\lg\frac{2n}3 = n\lg n - \Big(\lg 3 - \frac23\Big)n, \qquad \lg 3 - \frac23 \approx 0.918.$$

*Upper bound: $T(n) \le 2n\lg n + n$.* Base: $T(n) = 1 \le n$. Step: both $n/3$ and $2n/3$ are at least 1 and less than n, so by the hypothesis
$$T(n) \le 2\Big(n\lg n - \big(\lg 3 - \tfrac23\big)n\Big) + \frac n3 + \frac{2n}3 + n = 2n\lg n + \Big(2 - 2\big(\lg 3 - \tfrac23\big)\Big)n \le 2n\lg n + n,$$
because $2(\lg 3 - 2/3) \approx 1.84 \ge 1$.

*Lower bound: $T(n) \ge \frac15 n\lg n$.* Base: for $1 \le n < 3$, $\frac15 n\lg n < \frac15\cdot 3\lg 3 \approx 0.95 < 1 = T(n)$. Step:
$$T(n) \ge \frac15\Big(n\lg n - \big(\lg 3 - \tfrac23\big)n\Big) + n \ge \frac15 n\lg n,$$
because $\frac15(\lg 3 - \frac23) < 1$.

Notice why the "+ n" in the upper bound is there: the cleaner claim $T(n) \le c\,n\lg n$ is *false* at $n = 1$, where $n\lg n = 0 < 1 = T(1)$. Adding a lower-order term is the standard way to make the base case work.

## A checklist for analyzing a recursive algorithm

1. Let T(n) be the worst-case time on inputs of size n.
2. Count the recursive calls and their sizes; count the non-recursive work.
3. Write $T(n) = (\text{recursive calls}) + (\text{other work})$, with a base case.
4. Solve: unroll for "$n-1$" recurrences; recursion tree (or Master theorem) for "$n/b$"; change variables for "$\sqrt n$".
5. State a tight $\Theta$ bound, and (if asked) prove it by induction.

## Common exam problem patterns

**Pattern 1: "Solve this recurrence; justify briefly."** Identify the shape first, then use the matching tool.

| Shape | Tool | What to write |
|---|---|---|
| $aT(n/b) + f(n)$ | recursion tree / Master theorem | the level-i sum $a^i f(n/b^i)$ as a formula; decreasing, equal or increasing; or a, b, $n^{\log_b a}$ and the case |
| several sizes $T(\alpha_j n)$ | sum-of-fractions rule | the children's total cost relative to the parent ($s < 1$, $= 1$, $> 1$) |
| $T(n - c)$ terms | unrolling | the sum along the path; with two or more calls, an exponential |
| $\sqrt n$ arguments | divide out multipliers, then $m = \lg n$ | the new recurrence $S(m)$ and its solution, translated back |
| f has a log factor | sum the levels explicitly | $\sum_j j^k$ or $\sum_j 1/j$ or $\sum_j 1/j^2$, then the extra log or loglog (or nothing) |

**Pattern 2: "Write the recurrence for this algorithm."** One term $T(\cdot)$ per call actually executed (a call inside a loop counts once per iteration), plus the non-recursive work, plus a base case. Then solve it.

**Pattern 3: "Prove $T(n) = O(g(n))$ (or Θ) by induction."** Get the guess from a recursion tree. State the claim with explicit constants ($T(n) \le c\,g(n)$, possibly minus or plus a lower-order term). Check the base cases. In the step, verify the recursive arguments are in range, apply the hypothesis, and push the algebra until you reach exactly $\le c\,g(n)$. Choose c at the end from the inequality you needed.

**Pattern 4: "Design a recursive algorithm for X and analyze it."** Ask what the *largest / last / first* piece of the answer looks like (the largest disk, the last element, the top bit of n). Reduce to one or more smaller instances, handle the base case, argue correctness by strong induction, then write and solve the recurrence.

**Pattern 5: "Which algorithm is faster?" / "Rank these functions."** Solve each recurrence, then compare. For functions, rewrite each as $2^{(\cdot)}$ or $n^{(\cdot)}$ and compare exponents.

**Try it first (Pattern 5).** You can solve a problem with (A) five subproblems of half the size plus linear work, (B) two subproblems of size n−1 plus constant work, or (C) nine subproblems of a third of the size plus quadratic work. Which is fastest?

~~~reveal Solution
(A) $5T(n/2) + n$: leaves dominate, $\Theta(n^{\lg 5}) \approx \Theta(n^{2.32})$.
(B) $2T(n-1) + 1 = \Theta(2^n)$.
(C) $9T(n/3) + n^2$: $n^{\log_3 9} = n^2 = f(n)$, so every level sums to $n^2$ and $T(n) = \Theta(n^2\log n)$.

C is the fastest, since $n^2\log n = o(n^{2.32})$; B is by far the slowest.
~~~

## Where students lose points

- **Writing only the answer.** "Θ(n log n)" with no level sums or Master theorem parameters gets little partial credit when it's wrong. Show the level-i formula or name a, b, $n^{\log_b a}$ and the case.
- **Computing $\log_b a$ upside down** ($n^{\log_3 2}$ instead of $n^{\log_2 3}$), or turning $3T(n/2)$ into $n^{3/2}$.
- **Applying the Master theorem where it doesn't apply**: subtract-and-conquer, unequal splits, non-constant a, or the gaps such as $n/\lg n$.
- **Big-O inside an induction hypothesis.** Use explicit constants every time.
- **Forgetting base cases or range checks** in an induction: using the hypothesis on $\lfloor n/2\rfloor = 0$ when the claim is only for $n \ge 1$, or claiming $T(1) \le c\cdot 1\cdot\lg 1 = 0$.
- **Miscounting recursive calls in code**: a call inside a loop, or two identical calls whose result could have been reused.
- **Confusing $2^{n/2}$ with $2^n$**, or $\log(n^2)$ (which is $\Theta(\log n)$) with $\log^2 n$.
- **Giving O when Θ is asked.** An upper bound that isn't tight does not "solve" a recurrence.
- **Tracing instead of trusting.** In design questions, walking through an example is not a correctness proof; the inductive argument is.

## Self-check

1. Solve $T(n) = 3T(n/3) + n\lg n$.

~~~reveal Answer
$n^{\log_3 3} = n$, and level i sums to $3^i\cdot(n/3^i)\lg(n/3^i) = n\lg 3\,(\log_3 n - i)$. Summing an arithmetic series of $\log_3 n$ terms gives $\Theta(n\log^2 n)$ (extended Master case 2 with k = 1).
~~~

2. Solve $T(n) = T(n/2) + n\lg n$.

~~~reveal Answer
The single child costs $(n/2)\lg(n/2) < \frac12 n\lg n$, so the level sums decrease geometrically and the root dominates: $\Theta(n\log n)$. (Master case 3; regularity holds with $c = 1/2$.)
~~~

3. Does the three-case Master theorem apply to $T(n) = 2T(n/2) + n/\lg n$? What is the answer?

~~~reveal Answer
No — f is smaller than $n^{\log_2 2} = n$ but not polynomially smaller, and it is not of the form $n\log^k n$ with $k \ge 0$. The level sums $n/(\lg n - i)$ form a harmonic series: $\Theta(n\log\log n)$.
~~~

4. Solve $T(n) = 2T(n-1) + n$ with $T(0) = 0$.

~~~reveal Answer
$\Theta(2^n)$: the tree has $2^i$ nodes at depth i with cost $n - i$, and grouping by distance from the leaves shows the leaves dominate. Exactly, $T(n) = 2^{n+1} - n - 2$ (check: $T(1) = 1$, $T(2) = 4$, $T(3) = 11$).
~~~

5. Solve $T(n) = T(\sqrt n) + \lg n$.

~~~reveal Answer
With $m = \lg n$: $S(m) = S(m/2) + m = \Theta(m)$, so $T(n) = \Theta(\log n)$. The sum $\lg n + \frac12\lg n + \frac14\lg n + \dots$ is a decreasing geometric series dominated by the root.
~~~

6. Your induction for $T(n) = 2T(n/2) + 1$ with claim $T(n) \le cn$ gets stuck at $cn + 1$. Is the bound $O(n)$ false?

~~~reveal Answer
No. The bound is true; the claim is just too weak to carry through the induction. Strengthen it to $T(n) \le cn - 1$: then the step gives $2(cn/2 - 1) + 1 = cn - 1$. ✓
~~~

7. A recursive Max(A[1..n]) returns the larger of Max(left half) and Max(right half). A student writes $T(n) = T(n/2) + O(1) = O(\log n)$. What's wrong?

~~~reveal Answer
There are two recursive calls, not one: $T(n) = 2T(n/2) + O(1) = \Theta(n)$. (Any correct max algorithm must look at all n elements anyway, so $O(\log n)$ was impossible.)
~~~

## Midterm 2 exam patterns

On Midterm 2, recurrences rarely appear as a standalone topic. They show up in three ways: (1) a **short-answer problem** asking for tight bounds on a batch of recurrences; (2) the **"write the recurrence for this code"** part of an analysis question; and (3) the **last step of every design question** (divide and conquer, backtracking, dynamic programming). You need to be fast, and you need to write enough to earn partial credit.

### The common shapes

| Exam prompt | What earns full credit |
|---|---|
| "Give a tight Θ bound for each recurrence; justify briefly." | The Θ answer plus one line: the Master parameters and case, *or* the level-i sum and whether it decreases, stays level or increases, *or* the substitution you used. |
| "Write a recurrence for the running time of this algorithm, then solve it." | One $T(\cdot)$ per call that is actually *executed*, all the non-recursive work (including copying and inner loops), a base case, then the solution. |
| "Sort these functions by growth rate; mark the ties." | A chain $f_1 \ll f_2 \equiv f_3 \ll \dots$, with each tricky function rewritten as $2^{(\cdot)}$ or $n^{(\cdot)}$. |
| "Prove $T(n) \le \dots$ by induction." | Explicit constants, checked base cases, a check that the recursive arguments are in range, and algebra that ends in exactly the claimed bound. |
| "Describe a recursive algorithm and analyze it." | Base case, reduction to smaller instances, a strong-induction correctness argument, the recurrence, and its solution. |

### A 30-second triage for any recurrence

1. **Subtract and conquer** (terms like $T(n - c)$)? Unroll. With one call, add up f along the path. With $a \ge 2$ calls the answer is $\Theta(a^{n/c})$ for polynomial f. If f is itself exponential, divide by $a^n$ first.
2. **A single subproblem size** $n/b$? Write down $n^{\log_b a}$ *before anything else*, then compare f with it: polynomially smaller, equal up to $\log^k$, or polynomially larger.
3. **Several sizes** $T(\alpha_j n)$? Compare the total cost of a node's children with the node's own cost. When f = n this is just $\sum_j \alpha_j$.
4. **Square roots?** Divide out any $\sqrt n$ multiplier, then substitute $m = \lg n$.
5. **f within a log factor of $n^{\log_b a}$?** Write out the level sums and add them. They form an arithmetic series (one more log), a harmonic series ($\log\log$) or a convergent series (no extra factor).

### What one short-answer line should look like

> **Example.** $T(n) = 3T(n/4) + n$. *Answer:* $\Theta(n)$. *Why:* a = 3, b = 4, $n^{\log_4 3} \approx n^{0.79}$; f = n is polynomially larger, and $3f(n/4) = \frac34 f(n)$, so this is case 3 (the level sums $(3/4)^i n$ decrease geometrically).

That one line is the whole justification graders expect. A bare "Θ(n)" earns nothing if it is wrong, while a correct parameter line often earns partial credit even with an arithmetic slip.

### Mistakes that cost points on this topic

- **Upside-down logs.** $\log_4 8 = 3/2$ and $\log_4 2 = 1/2$. If in doubt, write $\log_b a = \lg a/\lg b$.
- **The phantom log factor.** The extra $\log n$ appears *only* when f matches $n^{\log_b a}$. For example, $16T(n/4) + n$ is $\Theta(n^2)$, not $\Theta(n^2\log n)$.
- **Exponential bases.** $3T(n-2) + 1 = \Theta(3^{n/2})$, not $\Theta(3^n)$. Likewise $T(n-1) + T(n-2) + 1 = \Theta(\phi^n)$, not $\Theta(2^n)$.
- **Exponential work in subtract recurrences.** $2T(n-1) + 2^n = \Theta(n2^n)$, $4T(n-1) + 2^n = \Theta(4^n)$ and $2T(n-1) + 3^n = \Theta(3^n)$. Whichever exponential is larger wins, and a tie adds a factor of n.
- **Miscounting calls in code.** Only one branch of an if/else runs. A value computed once and used twice is one call. A call inside a loop counts once per iteration.
- **Missing hidden work.** Copying a subarray costs its length. A loop that doubles j until it reaches n runs $\lg n$ times, not n times.
- **Base cases in exact counts.** Asymptotic bounds ignore base cases, but exact counts do not. In the max-and-min problem below, the same recurrence gives $3n/2 - 2$ or $2n - 2$ depending on the base case.
- **Writing O when Θ is asked**, and **putting big-O inside an induction hypothesis**.

**Try it first (A).** Give tight bounds, with a one-line justification for each: (a) $6T(n/3) + n^2$; (b) $T(2n/3) + 1$; (c) $3T(n/3) + n/\lg n$; (d) $2T(n-1) + 2^n$ with $T(0) = 1$; (e) $T(n/2) + 2T(n/4) + n$.

~~~~reveal Solution (A)
~~~steps Five short answers
**(a)** a = 6, b = 3, and $n^{\log_3 6} \approx n^{1.63}$ is polynomially smaller than $n^2$. Regularity holds because $6(n/3)^2 = \frac23 n^2$, so this is case 3: the level sums $(2/3)^i n^2$ decrease, and $T(n) = \Theta(n^2)$.
+++
**(b)** One call on a constant fraction of the input, with constant work, so the recursion is a path of $\log_{3/2} n$ nodes: $\Theta(\log n)$. (In Master terms: a = 1, b = 3/2, $n^{0} = 1 = f(n)$, case 2.)
+++
**(c)** $n^{\log_3 3} = n$, and $f = n/\lg n$ is smaller by only a log factor, so this is a gap case. With $L = \log_3 n$, level i sums to $3^i\cdot\dfrac{n/3^i}{\lg(n/3^i)} = \dfrac{n}{\lg 3\,(L - i)}$. That is a harmonic series, so $T(n) = \Theta(n\log\log n)$.
+++
**(d)** Divide by $2^n$. Then $U(n) = T(n)/2^n$ satisfies $U(n) = U(n-1) + 1$, so $U(n) = n + 1$ and $T(n) = (n+1)2^n = \Theta(n2^n)$. In the tree, level i costs $2^i\cdot 2^{n-i} = 2^n$, and there are n + 1 levels.
+++
**(e)** The fractions add up to $\frac12 + \frac14 + \frac14 = 1$, so every full level sums to n, and the depth is between $\log_4 n$ and $\lg n$. $T(n) = \Theta(n\log n)$.
~~~
~~~~

**Try it first (B).** A $2^k \times 2^k$ board has one square removed. Describe a recursive algorithm that covers every other square exactly once with L-shaped trominoes (three squares forming an L). Prove it correct, count the trominoes, and give the running time as a function of the side length $n = 2^k$.

~~~~reveal Solution (B): recursive tromino tiling
**Idea.** Think about the coarsest structure. Split the board into four quadrants of side $2^{k-1}$. The hole lies in exactly one of them. The four squares at the center of the board form a $2\times 2$ block with one square in each quadrant. Place one tromino on the three central squares that lie in the quadrants *without* the hole. Now every quadrant is a $2^{k-1}\times 2^{k-1}$ board with exactly one unavailable square, which is the same problem one size smaller.

~~~pseudo
Tile(B, h):           // B: a 2^k x 2^k board, h: the one unavailable square of B
    if k = 0: return  // the only square is h; nothing to cover
    let Q1..Q4 be the quadrants of B, with h in Q1
    place a tromino on the central squares c2, c3, c4 of Q2, Q3, Q4
    Tile(Q1, h); Tile(Q2, c2); Tile(Q3, c3); Tile(Q4, c4)
~~~

**Correctness** (induction on k). *Base* k = 0: the board is just the hole, so there is nothing to cover. *Step:* the three central squares form an L, so the central tromino is legal. The four calls are on boards of side $2^{k-1}$, each with exactly one unavailable square, so by the inductive hypothesis each one tiles its quadrant minus that square. The quadrants are disjoint, so no two tiles overlap. Every square other than the hole is covered, either by the central tromino or inside its quadrant's tiling.

**Count.** $P(0) = 0$ and $P(k) = 4P(k-1) + 1$, which unrolls to $P(k) = (4^k - 1)/3$. That is exactly (number of squares − 1)/3, as it must be.

**Time.** In terms of the side length, $T(n) = 4T(n/2) + O(1)$. Since $n^{\log_2 4} = n^2$ is polynomially larger than 1, case 1 gives $T(n) = \Theta(n^2)$. This is linear in the number of squares, and therefore optimal, because the output has $\Theta(n^2)$ tiles. *Hidden-cost trap:* if each call copied its quadrant into a new array, the recurrence would become $4T(n/2) + \Theta(n^2) = \Theta(n^2\log n)$.
~~~~
`,
  cheatsheet: String.raw`## Recursion
- **Recursion Fairy:** solve base cases directly; reduce to *smaller* instances of the same problem; trust the recursive calls (= strong induction hypothesis).
- **Hanoi:** $T(n)=2T(n-1)+1$, $T(0)=0 \Rightarrow 2^n-1$ moves, and this is optimal.

## Asymptotics
- Log bases don't matter; exponent bases do ($4^{\lg n}=n^2$). $2^{n+1}=\Theta(2^n)$ but $4^n \ne O(2^n)$.
- $\log^a n \ll n^\varepsilon \ll n^a \ll b^n \ll n! \ll n^n$; $\lg n! = \Theta(n\log n)$; $H_n=\Theta(\log n)$.
- Geometric $\sum_{i\le L} r^i$: $\Theta(1)$ / $\Theta(L)$ / $\Theta(r^L)$ for $r<1$ / $r=1$ / $r>1$.

## Recursion trees: $T(n)=\sum_i(\text{level } i \text{ sum})$
| Level sums | Answer |
|---|---|
| decreasing | $\Theta(\text{root})$ |
| equal | $\Theta(\text{root}\cdot\#\text{levels})$ |
| increasing | $\Theta(\#\text{leaves})$ |

## Master theorem $T(n)=aT(n/b)+f(n)$, compare $f$ to $n^{\log_b a}$
1. $f$ polynomially smaller: $\Theta(n^{\log_b a})$
2. $f=\Theta(n^{\log_b a}\log^k n)$: $\Theta(n^{\log_b a}\log^{k+1} n)$
3. $f$ polynomially larger (+ regularity): $\Theta(f(n))$

## Must-know solutions
| Recurrence | Solution |
|---|---|
| $T(n-1)+1$ / $T(n-1)+n$ | $n$ / $n^2$ |
| $2T(n-1)+1$ | $2^n$ |
| $T(n/2)+1$ / $T(n/2)+n$ | $\log n$ / $n$ |
| $2T(n/2)+1$ / $2T(n/2)+n$ | $n$ / $n\log n$ |
| $3T(n/2)+n$ | $n^{\lg 3}\approx n^{1.585}$ |
| $4T(n/2)+n$ / $4T(n/2)+n^2$ | $n^2$ / $n^2\log n$ |
| $T(n/5)+T(7n/10)+n$ | $n$ |
| $T(n/3)+T(2n/3)+n$ | $n\log n$ |
| $2T(n/2)+n\lg n$ | $n\log^2 n$ |
| $2T(n/2)+n/\lg n$ | $n\log\log n$ |
| $\sqrt n\,T(\sqrt n)+n$ | $n\log\log n$ |
| $T(\sqrt n)+1$ / $2T(\sqrt n)+1$ | $\log\log n$ / $\log n$ |
| $2T(\sqrt n)+\lg n$ | $\log n\log\log n$ |

## More solved recurrences (by shape)
| Shape | Recurrence | Solution |
|---|---|---|
| same $n^{\log_b a}$, vary f | $2T(n/4)+1$ / $+\sqrt n$ / $+n$ | $\sqrt n$ / $\sqrt n\log n$ / $n$ |
| log factor in f | $4T(n/2)+n^2\lg n$ | $n^2\log^2 n$ |
| | $4T(n/2)+n^2/\lg n$ | $n^2\log\log n$ |
| | $4T(n/2)+n^2/\lg^2 n$ | $n^2$ (convergent sum) |
| | $2T(n/2)+n\lg^2 n$ | $n\log^3 n$ |
| unequal splits | $T(n/2)+T(n/4)+T(n/8)+n$ | $n$ (fractions sum to 7/8) |
| | $T(n/4)+T(3n/4)+n$ | $n\log n$ |
| | $T(n/2)+T(n/4)+1$ | $n^{\lg\phi}\approx n^{0.694}$ |
| | $T(n/2)+T(n/3)+T(n/4)+n$ | $n^{p}$, $p\approx 1.082$ |
| subtract | $T(n-1)+1/n$ | $\log n$ |
| | $T(n-1)+n\lg n$ | $n^2\log n$ |
| | $2T(n-1)+n$ | $2^n$ |
| | $2T(n-2)+1$ | $2^{n/2}$ (not $2^n$) |
| | $T(n-1)+T(n-2)+n$ | $\phi^n$ |
| | $nT(n-1)+1$ | $n!$ |
| square roots | $\sqrt n\,T(\sqrt n)+n^2$ | $n^2$ |
| | $2\sqrt n\,T(\sqrt n)+n$ | $n\log n$ |
| | $\sqrt n\,T(\sqrt n)+n\lg n$ | $n\log n$ |
| | $T(\sqrt n)+\lg n$ / $4T(\sqrt n)+\lg n$ | $\log n$ / $\log^2 n$ |
| from code | $\sum_{i<n}T(i)+n$ | $2^n$ (subtract consecutive equations) |

## Templates
- **Level sum** for $aT(n/b)+f(n)$: level i $= a^i f(n/b^i)$, depth $\log_b n$, leaves $n^{\log_b a}$.
- **Sum-of-fractions** $\sum_j T(\alpha_j n)+n$: $s=\sum\alpha_j$; $s<1\Rightarrow n$, $s=1\Rightarrow n\log n$, $s>1\Rightarrow n^p$ with $\sum\alpha_j^p=1$.
- **Subtract-and-conquer** $aT(n-b)+f$: $a=1$: sum f along the path; $a>1$: $\Theta(a^{n/b})$ (polynomial f).
- **Square roots:** $c\sqrt n\,T(\sqrt n)+f$: let $U=T/n$, then $m=\lg n$, $S(m)=U(2^m)$.
- **Induction template:** claim $T(n)\le c\,g(n)$ [$-$ lower-order term]; base cases; step: arguments in range, apply hypothesis, algebra to exactly $\le c\,g(n)$; pick c last.
- **Strengthening:** if the step leaves $c\,g(n)+(\text{small})$, prove $T(n)\le c\,g(n)-d\,h(n)$ instead. E.g. $2T(n/2)+1\le 2n-1$; $4T(n/2)+n \le 2n^2-n$.
- **Correctness of a recursive algorithm:** base case; strong IH on all smaller inputs; every call is on a smaller *valid* input; combination is correct.
- **Code to recurrence:** one $T(\cdot)$ per *executed* call (loops multiply), plus non-recursive work, plus base case.

## Master theorem does NOT apply to
- $T(n-1)+\dots$ (no division), several different sizes, non-constant $a$ (e.g. $nT(n/2)$), $a<1$.
- the gaps: $2T(n/2)+n/\lg n$ ($n\log\log n$), $4T(n/2)+n^2/\lg^2 n$ ($n^2$).
- case 3 with failed regularity (oscillating f).

## Recursive design classics
- **Power by squaring:** $a^n = (a^{\lfloor n/2\rfloor})^2\cdot a^{n \bmod 2}$; $\Theta(\log n)$ multiplications. Two identical calls instead of one: $\Theta(n)$.
- **Peasant multiplication:** $xy = 2\,(x\lfloor y/2\rfloor) + x\,(y \bmod 2)$; $\Theta(n^2)$ bit operations for n-bit inputs.
- **Josephus (every 2nd):** $J(1)=1$, $J(2k)=2J(k)-1$, $J(2k+1)=2J(k)+1$.
- **Fibonacci fast doubling:** $F_{2k}=F_k(2F_{k+1}-F_k)$, $F_{2k+1}=F_k^2+F_{k+1}^2$.

## Tricks
- Floors/ceilings and base cases don't change the asymptotics.
- $\sqrt n$ recurrences: substitute $m=\lg n$, $S(m)=T(2^m)$.
- Induction: use an **explicit constant** ($T(n)\le cn$), never $O(\cdot)$ in the hypothesis.
- $n\lg n$ claims fail at $n=1$ ($\lg 1=0$): add $+n$ or start the base at $n=2$.

### Exam checklist
- **Name the shape first:** subtract, single $n/b$, several sizes, $\sqrt n$, or log factors near $n^{\log_b a}$.
- For $aT(n/b)+f$, write $n^{\log_b a}$ first and check that the log is the right way up ($\log_4 8=3/2$).
- **Justify in one line:** the Master parameters and case, or the level-$i$ sum and its trend. Give Θ, not O.
- **Code to recurrence:** count only executed calls (an if/else contributes its worst branch, not the sum of both; loops multiply; a reused result is one call). Include hidden work: copies, and doubling loops, which run $\lg n$ times.
- **Exponential work in subtract recurrences:** divide by $a^n$. $2T(n-1)+2^n=\Theta(n2^n)$; $4T(n-1)+2^n=\Theta(4^n)$.
- **Exact counts depend on base cases:** max and min is $3n/2-2$ with $C(2)=1$, but $2n-2$ with only $C(1)=0$.
- **Growth ordering:** rewrite as powers. $(\lg n)^{\lg n}=n^{\lg\lg n}$, $3^{\lg n}=n^{\lg 3}$, $\sqrt2^{\lg n}=\sqrt n$, $n^{1/\lg n}=2$, $\binom{n}{n/2}=\Theta(2^n/\sqrt n)$.
- **Induction:** use explicit constants, check the base cases and the argument range, and end with exactly the claimed bound.
`,
  quiz: [
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 2T(n/2) + n$.`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n\log^2 n)$`],
      answer: 1,
      explain: String.raw`Each of the $\lg n + 1$ levels of the recursion tree sums to exactly n ($2^i$ nodes of cost $n/2^i$). Equal level sums means root × depth $= \Theta(n\log n)$. This is mergesort. Master theorem case 2 with $n^{\log_2 2} = n$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = T(n/5) + T(7n/10) + n$.`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^{1.2})$`, String.raw`The Master theorem gives $\Theta(n\log n)$`],
      answer: 0,
      explain: String.raw`The children of a node with cost m cost $m/5 + 7m/10 = 9m/10$ in total, so level i sums to at most $(9/10)^i n$: a decreasing geometric series bounded by $10n$. The root dominates: $\Theta(n)$. The Master theorem does not apply at all (two different subproblem sizes). The crucial fact is $1/5 + 7/10 < 1$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 3T(n/2) + n$.`,
      choices: [String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^{3/2})$`, String.raw`$\Theta(n^{\log_2 3})$`, String.raw`$\Theta(n^{\log_3 2})$`],
      answer: 2,
      explain: String.raw`Level i sums to $(3/2)^i n$, increasing, so the leaves dominate. There are $3^{\lg n} = n^{\lg 3} \approx n^{1.585}$ leaves. ($n^{\log_3 2}$ has the log upside down; $n^{3/2}$ confuses the ratio 3/2 with the exponent.)`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = T(n-1) + n$ with $T(0)=0$.`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(2^n)$`],
      answer: 2,
      explain: String.raw`Unrolling gives $T(n) = n + (n-1) + \dots + 1 = n(n+1)/2 = \Theta(n^2)$. The Master theorem does not apply (subproblem is $n-1$, not $n/b$). This is quicksort's worst case.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = \sqrt n\, T(\sqrt n) + n$.`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log\log n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^{3/2})$`],
      answer: 1,
      explain: String.raw`Level 1 has $\sqrt n$ nodes each costing $\sqrt n$, total n; level 2 has $n^{1/2}\cdot n^{1/4}$ nodes each costing $n^{1/4}$, total n; every level sums to n. The depth is the number of square roots to reach a constant, $\lg\lg n$. So $\Theta(n\log\log n)$.`,
    },
    {
      type: 'tf',
      q: String.raw`The standard three-case Master theorem determines the solution of $T(n) = 2T(n/2) + n/\lg n$.`,
      answer: false,
      explain: String.raw`Here $n^{\log_b a} = n$ and $f(n) = n/\lg n$ is smaller than n, but not *polynomially* smaller (not $O(n^{1-\varepsilon})$), and it is not $\Theta(n\log^k n)$ for any $k \ge 0$. It falls in a gap. The recursion tree gives level sums $n/(\lg n - i)$, a harmonic series, so $T(n) = \Theta(n\log\log n)$.`,
    },
    {
      type: 'short',
      q: 'What is the minimum number of moves needed to solve the Tower of Hanoi with 10 disks? (Give a number.)',
      answer: ['1023'],
      explain: String.raw`$T(n) = 2T(n-1) + 1$, $T(0) = 0$ solves to $2^n - 1$, and the argument about the largest disk shows no solution can do better. $2^{10} - 1 = 1023$.`,
    },
    {
      type: 'multi',
      q: String.raw`Which of the following functions are $O(n^2)$? (select all that apply)`,
      choices: [String.raw`$n\lg n$`, String.raw`$1000n^2 + n$`, String.raw`$n^2\lg n$`, String.raw`$2^{2\lg n}$`, String.raw`$n^3/(n+1)$`, String.raw`$2^n$`],
      answer: [0, 1, 3, 4],
      explain: String.raw`$n\lg n$ grows slower than $n^2$; constants don't matter for $1000n^2 + n$; $2^{2\lg n} = (2^{\lg n})^2 = n^2$; $n^3/(n+1) \le n^2$. But $n^2\lg n / n^2 = \lg n \to \infty$, so $n^2\lg n \ne O(n^2)$, and $2^n$ is exponential.`,
    },
    {
      type: 'tf',
      q: String.raw`$\log_2 n = \Theta(\log_{10} n)$.`,
      answer: true,
      explain: String.raw`$\log_2 n = \log_{10} n / \log_{10} 2 \approx 3.32\log_{10} n$: they differ by a constant factor. That's why we write $O(\log n)$ without a base. (Bases inside exponents *do* matter: $2^{\lg n} = n$ but $4^{\lg n} = n^2$.)`,
    },
    {
      type: 'tf',
      q: String.raw`$2^{2n} = O(2^n)$.`,
      answer: false,
      explain: String.raw`$2^{2n} / 2^n = 2^n \to \infty$, so no constant c works. A constant factor *in the exponent* changes the growth rate. Contrast $2^{n+1} = 2\cdot 2^n = \Theta(2^n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 4T(n/2) + n^2$.`,
      choices: [String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n^2\log n)$`, String.raw`$\Theta(n^3)$`, String.raw`$\Theta(n^4)$`],
      answer: 1,
      explain: String.raw`Level i: $4^i$ nodes each costing $(n/2^i)^2 = n^2/4^i$, so every level sums to $n^2$. Equal sums over $\lg n$ levels: $\Theta(n^2\log n)$. In Master-theorem terms $n^{\log_2 4} = n^2 = f(n)$, case 2.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = T(n/3) + T(2n/3) + n$.`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^{\log_{3/2} 2})$`, String.raw`$\Theta(n^2)$`],
      answer: 1,
      explain: String.raw`$1/3 + 2/3 = 1$, so every full level of the recursion tree sums to exactly n. Leaves occur between depth $\log_3 n$ and $\log_{3/2} n$, both $\Theta(\log n)$, so $n\log_3 n \lesssim T(n) \lesssim n\log_{3/2} n$, i.e. $\Theta(n\log n)$. Contrast $T(n/5)+T(7n/10)+n$, where the fractions sum to less than 1.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 2T(\sqrt n) + \lg n$.`,
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(\log n \log\log n)$`, String.raw`$\Theta(\log^2 n)$`, String.raw`$\Theta(\sqrt n)$`],
      answer: 1,
      explain: String.raw`Substitute $m = \lg n$, $S(m) = T(2^m)$: since $\sqrt n = 2^{m/2}$, $S(m) = 2S(m/2) + m = \Theta(m\log m)$. Translating back, $T(n) = \Theta(\log n\log\log n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`A student "proves" $T(n) = 2T(n/2) + n$ is $O(n)$: "By induction $T(n/2) = O(n/2)$, so $T(n) = 2\,O(n/2) + n = O(n)$." What is wrong?`,
      choices: [
        'Nothing; the proof is correct.',
        'The base case is missing, but otherwise it is fine.',
        String.raw`The hypothesis must use an explicit constant; with $T(n/2) \le c(n/2)$ we only get $T(n) \le cn + n$, which is not $\le cn$.`,
        'Induction cannot be used for recurrences.',
      ],
      answer: 2,
      explain: String.raw`Big-O hides a constant, and here the constant silently grows by 1 at each level of recursion. Induction needs a *fixed* constant c in the statement being proved. With an explicit constant the inductive step fails, which is good, because the true answer is $\Theta(n\log n)$.`,
    },
    {
      type: 'tf',
      q: 'If the level sums of a recursion tree decrease geometrically, then T(n) is within a constant factor of the cost of the root.',
      answer: true,
      explain: String.raw`If level i sums to at most $r^i \cdot f(n)$ with constant $r < 1$, the total is at most $f(n)/(1-r) = O(f(n))$, and the root alone contributes $f(n)$. So $T(n) = \Theta(f(n))$. Example: $2T(n/2) + n^2 = \Theta(n^2)$.`,
    },
    {
      type: 'short',
      q: String.raw`Solve $T(n) = 2T(n/4) + \sqrt n$. Type a Θ bound such as "n log n" (no Θ needed; write the square root as sqrt(n)).`,
      answer: ['sqrt(n) log n', 'sqrt(n) log(n)', 'sqrt(n)log n', 'sqrt n log n', 'sqrt(n) lg n', 'sqrt n lg n', '√n log n', '√n lg n', 'n^(1/2) log n', 'n^0.5 log n', 'sqrt(n)*log(n)', 'sqrt(n)*log n', 'Θ(sqrt(n) log n)', 'log n sqrt(n)', 'log(n) sqrt(n)'],
      explain: String.raw`Level i has $2^i$ nodes, each costing $\sqrt{n/4^i} = \sqrt n/2^i$, so every level sums to $\sqrt n$; there are $\log_4 n$ levels. Equal level sums give $\Theta(\sqrt n\log n)$. Master check: $n^{\log_4 2} = \sqrt n = f(n)$, case 2. A common slip is computing $n^{\log_4 2}$ as $n^2$.`,
    },
    {
      type: 'short',
      q: String.raw`Solve $T(n) = T(n-1) + 1/n$ with $T(0) = 0$. Give a Θ bound (e.g. "n").`,
      answer: ['log n', 'lg n', 'ln n', 'log(n)', 'logn', 'Θ(log n)', 'H_n', 'log n'],
      explain: String.raw`Unrolling gives the harmonic number $T(n) = 1 + 1/2 + \dots + 1/n = H_n = \Theta(\log n)$. It is not $\Theta(1)$: the terms shrink, but the harmonic series diverges.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 4T(n/2) + n^2\lg n$.`,
      choices: [String.raw`$\Theta(n^2\log n)$`, String.raw`$\Theta(n^2\log^2 n)$`, String.raw`$\Theta(n^2\log\log n)$`, String.raw`$\Theta(n^3)$`],
      answer: 1,
      explain: String.raw`Level i: $4^i$ nodes, each costing $(n/2^i)^2\lg(n/2^i) = (n^2/4^i)(\lg n - i)$, so the level sum is $n^2(\lg n - i)$. Summing over $\lg n$ levels gives $n^2\cdot\Theta(\log^2 n)$. Extended Master case 2 with k = 1 adds one log to $n^2\log n$. $\Theta(n^2\log n)$ is what you'd get by ignoring the log in f, and $n^2\log\log n$ is the answer for $f = n^2/\lg n$.`,
    },
    {
      type: 'multi',
      q: String.raw`To which recurrences can the Master theorem (form $aT(n/b) + f(n)$, constants $a \ge 1$, $b > 1$, three cases with the $\log^k$ extension) NOT be applied directly? (select all that apply)`,
      choices: [String.raw`$T(n) = T(n-1) + n$`, String.raw`$T(n) = 2T(n/2) + n/\lg n$`, String.raw`$T(n) = T(n/3) + T(2n/3) + n$`, String.raw`$T(n) = n\,T(n/2) + 1$`, String.raw`$T(n) = 4T(n/2) + n^2\lg n$`, String.raw`$T(n) = 3T(n/4) + n\lg n$`],
      answer: [0, 1, 2, 3],
      explain: String.raw`(a) has no division by b. (b) falls in the gap: $n/\lg n$ is neither polynomially smaller than n nor $\Theta(n\log^k n)$ with $k \ge 0$. (c) has two different subproblem sizes. (d) has a non-constant number of subproblems. (e) is extended case 2: $\Theta(n^2\log^2 n)$. (f) is case 3: $n^{\log_4 3} \approx n^{0.79}$ is polynomially smaller than $n\lg n$ and regularity holds ($3\cdot\frac n4\lg\frac n4 \le \frac34 n\lg n$), so $\Theta(n\log n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`What is the running time of the following?
~~~pseudo
Foo(n):
    if n <= 1: return
    for i = 1 to n: print(i)
    Foo(n/2)
    Foo(n/2)
~~~`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(\log n)$`],
      answer: 1,
      explain: String.raw`Two executed calls on size n/2 plus a linear loop: $T(n) = 2T(n/2) + \Theta(n)$, the mergesort recurrence, $\Theta(n\log n)$. With only one call it would be $T(n/2) + n = \Theta(n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`What is the running time of the following?
~~~pseudo
Bar(n):
    if n <= 1: return 1
    s = 0
    for i = 1 to n-1: s = s + Bar(i)
    return s
~~~`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(2^n)$`],
      answer: 3,
      explain: String.raw`$T(n) = \sum_{i=1}^{n-1} T(i) + \Theta(n)$. Subtracting the same equation for $n-1$ gives $T(n) = 2T(n-1) + \Theta(1)$, so $T(n) = \Theta(2^n)$. The function is called once per loop iteration, so the single appearance of its name in the code is misleading. With memoization it would be $\Theta(n^2)$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = T(n/2) + T(n/4) + 1$.`,
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(\log^2 n)$`, String.raw`$\Theta(n^{\lg\phi}) \approx \Theta(n^{0.694})$`, String.raw`$\Theta(n)$`],
      answer: 2,
      explain: String.raw`The work per node is constant, so the number of leaves dominates. Look for $T(n) \approx n^p$ with $(1/2)^p + (1/4)^p = 1$; with $x = 2^{-p}$ this is $x + x^2 = 1$, so $x = 1/\phi$ and $p = \lg\phi \approx 0.694$. (For $n = 2^k$, $T(2^k)$ follows a Fibonacci recurrence in k.) It is more than $\log n$ because there are two calls, and less than n because $1/2 + 1/4 < 1$.`,
    },
    {
      type: 'tf',
      q: String.raw`$T(n) = 2T(n-2) + 1$ is $\Theta(2^n)$.`,
      answer: false,
      explain: String.raw`The depth is only $n/2$, so there are about $2^{n/2}$ leaves: $T(n) = \Theta(2^{n/2}) = \Theta(\sqrt2^{\,n})$. Since $2^n/2^{n/2} = 2^{n/2} \to \infty$, this is genuinely smaller than $2^n$; constants in exponents matter.`,
    },
    {
      type: 'tf',
      q: String.raw`If $T(n) = aT(n/b) + f(n)$ and $f(n) = \Theta(n^{\log_b a})$, then $T(n) = \Theta(f(n))$.`,
      answer: false,
      explain: String.raw`When f matches the leaf count, every level of the recursion tree sums to $\Theta(f(n))$, and there are $\Theta(\log n)$ levels: $T(n) = \Theta(f(n)\log n)$. Example: $2T(n/2) + n = \Theta(n\log n)$, not $\Theta(n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 2\sqrt n\,T(\sqrt n) + n$.`,
      choices: [String.raw`$\Theta(n\log\log n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n)$`, String.raw`$\Theta(n^{3/2})$`],
      answer: 1,
      explain: String.raw`Divide by n: $U(n) = T(n)/n$ satisfies $U(n) = 2U(\sqrt n) + 1$. With $m = \lg n$, $S(m) = 2S(m/2) + 1 = \Theta(m)$, so $U(n) = \Theta(\log n)$ and $T(n) = \Theta(n\log n)$. In the tree, level j sums to $2^j n$, and the last of the $\lg\lg n$ levels dominates. Without the factor 2 the answer would be $\Theta(n\log\log n)$.`,
    },
    {
      type: 'tf',
      q: String.raw`$T(n) = 2T(n/2 + 17) + n$ has the same Θ solution as $T(n) = 2T(n/2) + n$.`,
      answer: true,
      explain: String.raw`Shifting the argument of a recursive call by a constant does not change the asymptotics (for large n, $n/2 + 17 \le 0.51n$, and the tree still has $\Theta(\log n)$ levels each summing to about n). Both are $\Theta(n\log n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`A student writes Power(a, n) as: if n = 0 return 1; else return Power(a, n/2) * Power(a, n/2) (times a if n is odd). How many multiplications does it perform?`,
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(\log^2 n)$`],
      answer: 1,
      explain: String.raw`Both factors are computed by separate recursive calls, so $M(n) = 2M(n/2) + O(1) = \Theta(n)$ (leaves dominate). Storing $h = $ Power(a, ⌊n/2⌋) once and returning $h\cdot h$ gives $M(n) = M(n/2) + O(1) = \Theta(\log n)$.`,
    },
    {
      type: 'short',
      q: String.raw`Solve $T(n) = 8T(n/2) + n^2$. Give a Θ bound (e.g. "n^2").`,
      answer: ['n^3', 'n³', 'Θ(n^3)', 'n**3', 'n*n*n'],
      explain: String.raw`$n^{\log_2 8} = n^3$ is polynomially larger than $n^2$ (case 1), so the leaves dominate: level sums are $8^i(n/2^i)^2 = 2^i n^2$, increasing, and there are $n^3$ leaves. This is the naive divide-and-conquer matrix multiplication.`,
    },
    {
      type: 'mc',
      q: String.raw`What goes wrong in this binary search?
~~~pseudo
Search(A, lo, hi, x):      // is x in sorted A[lo..hi]?
    if lo = hi: return (A[lo] = x)
    mid = floor((lo + hi) / 2)
    if x <= A[mid]: return Search(A, lo, mid, x)
    else:           return Search(A, mid, hi, x)
~~~`,
      choices: [
        'Nothing; it is correct and runs in O(log n) time.',
        'It can return a wrong answer when x is not in A.',
        String.raw`When $hi = lo + 1$ and $x > A[mid]$, the call Search(A, mid, hi, x) is on the same range, so it never terminates; the inductive step fails because the recursive instance is not smaller.`,
        String.raw`It runs in $\Theta(n)$ time.`,
      ],
      answer: 2,
      explain: String.raw`With $hi = lo + 1$, $mid = lo$, so the else-branch calls Search on exactly [lo..hi] again. The answers it *would* give are fine; the problem is progress. A correctness proof by induction must check that every recursive call is on a strictly smaller instance, and that check fails here. The fix is Search(A, mid+1, hi, x), which is valid because $x > A[mid]$.`,
    },
    {
      type: 'tf',
      q: String.raw`$T(n) = T(n/2) + n\lg n$ is $\Theta(n\log n)$.`,
      answer: true,
      explain: String.raw`There is a single child, costing $(n/2)\lg(n/2) < \frac12 n\lg n$, so the level sums decrease geometrically and the root dominates. Master case 3: $n^{\log_2 1} = 1$ is polynomially smaller than $n\lg n$, and regularity holds with $c = 1/2$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 3T(n/4) + n$.`,
      choices: [String.raw`$\Theta(n^{\log_4 3})$`, String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^{\log_3 4})$`],
      answer: 1,
      explain: String.raw`Level i has $3^i$ nodes, each costing $n/4^i$, so the level sum is $(3/4)^i n$. That is a decreasing geometric series, so the root dominates and $T(n) = \Theta(n)$. In Master terms, $n^{\log_4 3} \approx n^{0.79}$ is polynomially smaller than f = n, and regularity holds ($3f(n/4) = \frac34 f(n)$): case 3. The answer $n^{\log_4 3}$ would be right only if the leaves dominated, as in $3T(n/4) + 1$. The answer $n^{\log_3 4}$ has the log upside down. The answer $n\log n$ needs equal level sums, as in $4T(n/4) + n$.`,
    },
    {
      type: 'mc',
      q: String.raw`Which Master-theorem case applies to $T(n) = 8T(n/4) + n^{3/2}$, and what is the solution?`,
      choices: [String.raw`Case 1: $\Theta(n^{3/2})$`, String.raw`Case 2: $\Theta(n^{3/2}\log n)$`, String.raw`Case 3: $\Theta(n^{3/2})$`, String.raw`Case 1: $\Theta(n^{\log_8 4}) = \Theta(n^{2/3})$`],
      answer: 1,
      explain: String.raw`$\log_4 8 = \lg 8/\lg 4 = 3/2$, so the leaf count is exactly $n^{3/2}$, which matches f. Level i costs $8^i(n/4^i)^{3/2} = 8^i n^{3/2}/8^i = n^{3/2}$. The level sums are equal over $\log_4 n$ levels, giving $\Theta(n^{3/2}\log n)$. The two classic slips are computing $\log_8 4 = 2/3$ (upside down), and noticing that f equals $n^{\log_b a}$ but forgetting the extra log factor.`,
    },
    {
      type: 'tf',
      q: String.raw`$T(n) = T(n-1) + T(n-2) + 1$ is $\Theta(2^n)$.`,
      answer: false,
      explain: String.raw`It is $O(2^n)$, since $T(n) \le 2T(n-1) + 1$, but it is not $\Omega(2^n)$. The function $U(n) = T(n) + 1$ satisfies $U(n) = U(n-1) + U(n-2)$, which is exactly the Fibonacci recurrence, so $T(n) = \Theta(\phi^n)$ with $\phi \approx 1.618$. Since $2^n/\phi^n = (2/\phi)^n \to \infty$, the two are not Θ of each other: the base of an exponential matters.`,
    },
    {
      type: 'mc',
      q: String.raw`What is the running time of the following?
~~~pseudo
Q(n):
    if n <= 0: return
    for i = 1 to n: print(i)
    Q(n-1)
    Q(n-1)
~~~`,
      choices: [String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n\,2^n)$`, String.raw`$\Theta(2^n)$`, String.raw`$\Theta(n\log n)$`],
      answer: 2,
      explain: String.raw`$T(n) = 2T(n-1) + \Theta(n)$. Depth i of the tree has $2^i$ nodes, each doing $n - i$ work. Grouping by the distance $j = n - i$ from the bottom gives $\sum_j 2^{n-j}j = 2^n\sum_j j/2^j = \Theta(2^n)$, because $\sum_j j/2^j$ converges (to 2). Exactly, $T(n) = 2^{n+1} - n - 2$ when the loop does n units of work. The tempting answer $n2^n$ charges every node the root's cost, but most nodes are near the bottom, where the work is small.`,
    },
    {
      type: 'multi',
      q: String.raw`Which of these recurrences have solution $\Theta(n\log n)$? (select all that apply)`,
      choices: [String.raw`$2T(n/2) + n$`, String.raw`$T(n/4) + T(3n/4) + n$`, String.raw`$4T(n/4) + n\lg n$`, String.raw`$T(n/2) + n\lg n$`, String.raw`$2T(n/2) + \sqrt n$`, String.raw`$\sqrt n\,T(\sqrt n) + n$`, String.raw`$T(n-1) + \lg n$`],
      answer: [0, 1, 3, 6],
      explain: String.raw`(a) Mergesort: the levels are equal. (b) The fractions sum to 1, so full levels cost n over $\Theta(\log n)$ levels. (c) No: the level sums are $n(\lg n - 2i)$, giving $\Theta(n\log^2 n)$. (d) Yes: a single child costing less than half its parent, so the root dominates and the answer is $\Theta(n\log n)$. (e) No: the leaves dominate, $\Theta(n)$. (f) No: n per level over $\lg\lg n$ levels gives $\Theta(n\log\log n)$. (g) Yes: unrolling gives $\sum_k \lg k = \lg(n!) = \Theta(n\log n)$.`,
    },
    {
      type: 'tf',
      q: String.raw`If $f(n) = O(n^{\log_b a})$, then $T(n) = aT(n/b) + f(n)$ is $\Theta(n^{\log_b a})$.`,
      answer: false,
      explain: String.raw`Case 1 needs f to be *polynomially* smaller: $f(n) = O(n^{\log_b a - \varepsilon})$. Plain O is not enough. If $f = \Theta(n^{\log_b a})$, which certainly is $O(n^{\log_b a})$, every level costs the same and an extra log appears: $2T(n/2) + n = \Theta(n\log n)$. Even a slightly smaller f can break it: $2T(n/2) + n/\lg n = \Theta(n\log\log n)$. The leaves win only when f is polynomially smaller, or when the level sums form a convergent series, as for $n/\lg^2 n$.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 2T(n/2) + n^2/\lg n$.`,
      choices: [String.raw`$\Theta(n^2/\log n)$`, String.raw`$\Theta(n^2\log\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n\log n)$`],
      answer: 0,
      explain: String.raw`The leaf count is $n^{\log_2 2} = n$, and $f = n^2/\lg n$ is *polynomially* larger: it is $\Omega(n^{1.5})$. So case 3 applies, once we check regularity: $2f(n/2) = \dfrac{n^2}{2\lg(n/2)} \le \dfrac34\cdot\dfrac{n^2}{\lg n}$ once $\lg n \ge 3$. Hence $T(n) = \Theta(f(n)) = \Theta(n^2/\log n)$. The "log gap" answers like $\log\log$ arise only when f is within a log factor of $n^{\log_b a}$, and here f is far above n. The answer $\Theta(n^2)$ is a valid upper bound, but it is not tight.`,
    },
    {
      type: 'mc',
      q: String.raw`Solve $T(n) = 3T(\sqrt n) + \lg n$.`,
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(\log n\,\log\log n)$`, String.raw`$\Theta\big((\log n)^{\lg 3}\big)$`, String.raw`$\Theta(n^{\lg 3})$`],
      answer: 2,
      explain: String.raw`Substitute $m = \lg n$ and $S(m) = T(2^m)$. Since $\sqrt n = 2^{m/2}$, we get $S(m) = 3S(m/2) + m$. Now $m^{\lg 3} \approx m^{1.585}$ is polynomially larger than m, so case 1 gives $S(m) = \Theta(m^{\lg 3})$, and translating back, $T(n) = \Theta((\lg n)^{\lg 3})$. With 2 calls instead of 3 the answer would be $\log n\log\log n$. The answer is polylogarithmic, not polynomial: $n^{\lg 3}$ forgets that the "size" variable is now m.`,
    },
    {
      type: 'tf',
      q: String.raw`$(\lg n)^{\lg n} = O(n^{100})$.`,
      answer: false,
      explain: String.raw`Rewrite it as a power of n: $(\lg n)^{\lg n} = 2^{\lg n\cdot\lg\lg n} = n^{\lg\lg n}$. The exponent $\lg\lg n$ eventually exceeds 100 (for $n > 2^{2^{100}}$) and keeps growing, so this function beats every polynomial. It is still far below $2^n$, because $\lg n\lg\lg n = o(n)$. Rewriting everything as $2^{(\cdot)}$ or $n^{(\cdot)}$ is the standard move for growth-rate questions.`,
    },
    {
      type: 'mc',
      q: String.raw`Which list is in increasing order of growth rate?`,
      choices: [
        String.raw`$\lg(n!) \ll \sqrt2^{\,\lg n} \ll n^{1.5} \ll 4^{\lg n}$`,
        String.raw`$\sqrt2^{\,\lg n} \ll \lg(n!) \ll n^{1.5} \ll 4^{\lg n}$`,
        String.raw`$\sqrt2^{\,\lg n} \ll \lg(n!) \ll 4^{\lg n} \ll n^{1.5}$`,
        String.raw`$\sqrt2^{\,\lg n} \ll n^{1.5} \ll \lg(n!) \ll 4^{\lg n}$`,
      ],
      answer: 1,
      explain: String.raw`Rewrite each one: $\sqrt2^{\,\lg n} = 2^{(\lg n)/2} = \sqrt n$; $\lg(n!) = \Theta(n\log n)$ by Stirling; and $4^{\lg n} = 2^{2\lg n} = n^2$. So the order is $\sqrt n \ll n\log n \ll n^{1.5} \ll n^2$. The trap is to read $4^{\lg n}$ as "small, because the exponent is only a log", or $\lg(n!)$ as "a log, so tiny".`,
    },
  ],
  flashcards: [
    { front: 'The Recursion Fairy principle', back: String.raw`Handle the base case directly; reduce the instance to *smaller* instances of the same problem; assume (trust) the recursive calls are correct and just combine. Formally this is the inductive hypothesis of strong induction.` },
    { front: 'Tower of Hanoi recurrence and solution', back: String.raw`$T(n) = 2T(n-1)+1$, $T(0)=0$, so $T(n) = 2^n - 1$. Optimal, because the largest disk must move, and the other $n-1$ disks must be moved off it before and back on after.` },
    { front: 'Recursion tree: three cases', back: String.raw`Level sums **decreasing** geometrically: $\Theta(\text{root})$. **Equal**: $\Theta(\text{root} \times \text{depth})$. **Increasing**: $\Theta(\#\text{leaves})$.` },
    { front: String.raw`Master theorem for $T(n) = aT(n/b) + f(n)$`, back: String.raw`Compare $f(n)$ with $n^{\log_b a}$. Smaller by $n^\varepsilon$: $\Theta(n^{\log_b a})$. Equal up to $\log^k n$: $\Theta(n^{\log_b a}\log^{k+1} n)$. Larger by $n^\varepsilon$ (+ regularity $af(n/b) \le cf(n)$): $\Theta(f(n))$.` },
    { front: String.raw`$T(n) = T(n/5) + T(7n/10) + n$`, back: String.raw`$\Theta(n)$. Level sums are at most $(9/10)^i n$ (decreasing). Induction: $T(n) \le 10n$ since $10/5 + 70/10 + 1 = 10$.` },
    { front: String.raw`$T(n) = T(n/3) + T(2n/3) + n$`, back: String.raw`$\Theta(n\log n)$. Fractions sum to 1, so full levels sum to n; depth is $\Theta(\log n)$.` },
    { front: String.raw`$T(n) = \sqrt n\,T(\sqrt n) + n$`, back: String.raw`$\Theta(n\log\log n)$. Every level sums to n, and there are $\lg\lg n$ levels.` },
    { front: String.raw`How to solve $T(n) = aT(\sqrt n) + f(n)$`, back: String.raw`Change variables $m = \lg n$, $S(m) = T(2^m)$: $S(m) = aS(m/2) + f(2^m)$. E.g. $2T(\sqrt n) + \lg n$ gives $S(m) = 2S(m/2)+m = \Theta(m\log m)$, i.e. $\Theta(\log n\log\log n)$.` },
    { front: String.raw`$T(n) = 2T(n/2) + n/\lg n$`, back: String.raw`$\Theta(n\log\log n)$ (level sums $n/(\lg n - i)$ form a harmonic series). Not covered by the 3-case Master theorem.` },
    { front: String.raw`$T(n) = 2T(n/2) + n\lg n$`, back: String.raw`$\Theta(n\log^2 n)$. Level i sums to $n(\lg n - i)$; summing gives $n \cdot \Theta(\log^2 n)$.` },
    { front: 'Do floors and ceilings matter in recurrences?', back: String.raw`No (for all recurrences in this course). $T(\lceil n/2\rceil) + T(\lfloor n/2\rfloor) + n$ and $2T(n/2)+n$ have the same $\Theta$ solution; base-case values don't matter either.` },
    { front: 'Why is "T(n) = 2 O(n/2) + n = O(n)" an invalid induction?', back: String.raw`The hidden constant grows at each level. Induction needs an explicit fixed constant: $T(n) \le cn$. With it, the step gives $cn + n \not\le cn$.` },
    { front: String.raw`Growth hierarchy`, back: String.raw`$1 \ll \log\log n \ll \log n \ll \log^k n \ll n^\varepsilon \ll n \ll n\log n \ll n^2 \ll 2^n \ll 3^n \ll n! \ll n^n$. Also $\lg n! = \Theta(n\log n)$, $H_n = \Theta(\log n)$.` },
    { front: String.raw`Sum-of-fractions rule for $T(\alpha_1 n) + \dots + T(\alpha_k n) + n$`, back: String.raw`Let $s = \sum\alpha_j$. $s < 1$: $\Theta(n)$ (level sums decrease). $s = 1$: $\Theta(n\log n)$. $s > 1$: $\Theta(n^p)$ with $\sum\alpha_j^p = 1$ (Akra–Bazzi). E.g. $T(n/2)+T(n/4)+T(n/8)+n = \Theta(n)$, $T(n/4)+T(3n/4)+n = \Theta(n\log n)$.` },
    { front: String.raw`How to solve $T(n) = c\sqrt n\,T(\sqrt n) + f(n)$`, back: String.raw`Divide by n: $U(n) = T(n)/n$ satisfies $U(n) = c\,U(\sqrt n) + f(n)/n$. Then set $m = \lg n$. E.g. $2\sqrt n\,T(\sqrt n) + n$: $U = 2U(\sqrt n) + 1 = \Theta(\log n)$, so $T = \Theta(n\log n)$.` },
    { front: 'Strengthening the inductive hypothesis', back: String.raw`If the step leaves $cn + 1$ (or similar), prove a *stronger* claim with a subtracted lower-order term, e.g. $T(n) \le cn - 1$ for $2T(n/2)+1$, or $T(n) \le 2n^2 - n$ for $4T(n/2)+n$. The stronger assumption on smaller inputs makes the step work.` },
    { front: String.raw`Subtract-and-conquer $T(n) = aT(n-b) + f(n)$`, back: String.raw`$a = 1$: sum f along the path, e.g. $T(n-1)+1/n = \Theta(\log n)$, $T(n-1)+n\lg n = \Theta(n^2\log n)$. $a > 1$ (polynomial f): $\Theta(a^{n/b})$, e.g. $2T(n-1)+n = \Theta(2^n)$, $2T(n-2)+1 = \Theta(2^{n/2})$.` },
    { front: String.raw`$T(n) = T(n/2) + T(n/4) + 1$`, back: String.raw`$\Theta(n^{\lg\phi}) \approx \Theta(n^{0.694})$: solve $(1/2)^p + (1/4)^p = 1$, i.e. $x + x^2 = 1$ for $x = 2^{-p}$, so $2^p = \phi$. For $n = 2^k$ it is a Fibonacci recurrence in k.` },
    { front: String.raw`Log factors: $4T(n/2) + n^2\lg n$, $n^2/\lg n$, $n^2/\lg^2 n$`, back: String.raw`Level sums are $n^2(\lg n - i)$, $n^2/(\lg n - i)$, $n^2/(\lg n - i)^2$, giving $\Theta(n^2\log^2 n)$, $\Theta(n^2\log\log n)$, $\Theta(n^2)$ (the last sum converges).` },
    { front: 'Template: proving a recursive algorithm correct', back: String.raw`Strong induction on input size. (1) Base cases return correct answers. (2) IH: correct on all smaller inputs. (3) Step: every recursive call is on a strictly smaller *valid* input, and combining correct sub-answers gives the correct answer.` },
    { front: 'Exponentiation by squaring', back: String.raw`$a^n = (a^{\lfloor n/2\rfloor})^2 \cdot a^{n \bmod 2}$, computed with ONE recursive call: $M(n) = M(n/2) + O(1) = \Theta(\log n)$ multiplications. Two calls for the same half give $2M(n/2)+1 = \Theta(n)$.` },
    { front: 'Writing a recurrence from code: the two classic traps', back: String.raw`(1) A call inside a loop runs once per iteration: <code>for i < n: f(i)</code> gives $T(n) = \sum_{i<n} T(i) + n = \Theta(2^n)$. (2) Two calls on the same argument cost $2T(\cdot)$ even if they return the same value; storing the result once costs $T(\cdot)$.` },
    { front: 'Master theorem proof in one sentence', back: String.raw`$T(n) = \sum_{i < \log_b n} a^i f(n/b^i) + \Theta(n^{\log_b a})$; in case 1 the level sums grow geometrically (leaves win), in case 2 each level is $\Theta(n^{\log_b a}\log^k)$ of its size (multiply by depth), in case 3 regularity makes them shrink geometrically (root wins).` },
    { front: String.raw`First step for any $aT(n/b) + f(n)$`, back: String.raw`Compute the critical exponent $\log_b a$ (the leaf count is $n^{\log_b a}$), the right way up: $\log_4 8 = 3/2$, $\log_4 2 = 1/2$. Then compare f with it. Polynomially smaller: the leaves win. Equal up to $\log^k$: one extra log. Polynomially larger (with regularity): the root wins.` },
    { front: String.raw`$T(n) = 8T(n/4) + n^{3/2}$`, back: String.raw`$\Theta(n^{3/2}\log n)$. Since $\log_4 8 = 3/2$, every level sums to $n^{3/2}$ (case 2). The usual errors are inverting the log, or dropping the log factor.` },
    { front: String.raw`Is $T(n) = T(n-1) + T(n-2) + O(1)$ equal to $\Theta(2^n)$?`, back: String.raw`No. It is $\Theta(\phi^n)$ with $\phi \approx 1.618$, because T + 1 satisfies the Fibonacci recurrence. $O(2^n)$ is only an upper bound, and the bases of exponentials matter.` },
    { front: String.raw`Subtract and conquer with exponential work: $aT(n-1) + c^n$`, back: String.raw`Divide by $a^n$. If a > c the answer is $\Theta(a^n)$ (the series converges); if a = c it is $\Theta(n\,a^n)$; if a < c it is $\Theta(c^n)$. Examples: $2T(n-1) + 2^n = (n+1)2^n$ when $T(0) = 1$; $4T(n-1) + 2^n = \Theta(4^n)$. Compare $2T(n-1) + n = \Theta(2^n)$.` },
    { front: 'Rewriting tricky functions for growth-rate ordering', back: String.raw`$(\lg n)^{\lg n} = n^{\lg\lg n}$ (superpolynomial but subexponential); $3^{\lg n} = n^{\lg 3}$; $\sqrt2^{\,\lg n} = \sqrt n$; $n^{1/\lg n} = 2$; $2^{\sqrt{\lg n}}$ lies between polylog and $n^{\varepsilon}$; $\binom{n}{n/2} = \Theta(2^n/\sqrt n)$; $\lg(n!) = \Theta(n\log n)$.` },
    { front: String.raw`$T(n) = 3T(\sqrt n) + \lg n$`, back: String.raw`With $m = \lg n$: $S(m) = 3S(m/2) + m = \Theta(m^{\lg 3})$, so $T(n) = \Theta((\log n)^{\lg 3})$. Compare $2T(\sqrt n) + \lg n = \Theta(\log n\log\log n)$ and $T(\sqrt n) + \lg n = \Theta(\log n)$.` },
    { front: 'Max and min together: the recurrence, and why base cases matter', back: String.raw`Split in half, solve both halves, then compare the two minima and the two maxima: $C(n) = 2C(n/2) + 2$. With the base cases $C(2) = 1$ and $C(1) = 0$ this gives $3n/2 - 2$. With only the base case $C(1) = 0$ the same recurrence gives $2n - 2$. Exact counts depend on base cases; Θ bounds do not.` },
    { front: 'Recurrence from code: if/else branches, and loops of calls on shrinking sizes', back: String.raw`Only one branch of an if/else runs, so take the worst branch, not the sum. <code>for k = 1 to lg n: F(n/2^k)</code> gives $T(n) = \sum_k T(n/2^k) + f(n)$. With linear f, subtracting consecutive equations (for $n = 2^m$) gives $\Theta(n\log n)$. The number of calls grows with n, so the Master theorem does not apply.` },
  ],
  problems: [
    {
      id: 'recursion-unroll-linear', type: 'written', title: 'Unrolling a linear recurrence', difficulty: 1,
      prompt: String.raw`Find an exact closed form for $T(n) = T(n-1) + n$ with $T(0) = 0$, and give its $\Theta$ bound. Then, by unrolling, find the exact solution of $H(n) = 2H(n-1) + 1$ with $H(0) = 0$ and verify it by induction.`,
      rubric: ['Correct unrolling pattern for T', 'Exact closed form n(n+1)/2 and Θ(n²)', 'Correct closed form 2^n − 1 for H', 'Valid induction (base case + step)'],
      hints: [String.raw`Write out $T(n) = n + T(n-1) = n + (n-1) + T(n-2) = \dots$ and stop at $T(0)$.`, String.raw`For H, after k steps: $H(n) = 2^k H(n-k) + (2^{k-1} + \dots + 1)$.`],
      solution: String.raw`**T.** Unrolling k times: $T(n) = n + (n-1) + \dots + (n-k+1) + T(n-k)$. With $k = n$:
$$T(n) = \sum_{i=1}^n i + T(0) = \frac{n(n+1)}{2} = \Theta(n^2).$$

**H.** Unrolling k times: $H(n) = 2^k H(n-k) + \sum_{j=0}^{k-1} 2^j = 2^k H(n-k) + 2^k - 1$. With $k = n$, $H(n) = 2^n H(0) + 2^n - 1 = 2^n - 1$.

**Induction proof.** Base: $H(0) = 0 = 2^0 - 1$. Step: for $n \ge 1$, assuming $H(n-1) = 2^{n-1} - 1$, we get $H(n) = 2(2^{n-1} - 1) + 1 = 2^n - 1$. ∎

(H is the Tower of Hanoi move count.)`,
    },
    {
      id: 'recursion-tree-three', type: 'written', title: 'Three recursion trees', difficulty: 2,
      prompt: String.raw`Use recursion trees to solve each recurrence. For each, give the number of nodes at level i, the cost per node at level i, the level sum, the depth, and the final $\Theta$ bound.

(a) $A(n) = 2A(n/2) + n^2$  (b) $B(n) = 8B(n/2) + n^2$  (c) $C(n) = 4C(n/2) + n^2$`,
      rubric: ['Correct level sums as formulas in i', 'Correct identification of decreasing / increasing / equal', 'Correct final bounds Θ(n²), Θ(n³), Θ(n² log n)'],
      hints: [String.raw`In all three, the depth is $\lg n$ and a node at level i has cost $(n/2^i)^2 = n^2/4^i$.`, 'Compare the number of nodes per level, $a^i$, with $4^i$.'],
      solution: String.raw`In each tree the depth is $L = \lg n$ and a node at level i has size $n/2^i$ and cost $n^2/4^i$.

| | nodes at level i | level sum | type | answer |
|---|---|---|---|---|
| (a) | $2^i$ | $n^2/2^i$ | decreasing | $\Theta(n^2)$ (root) |
| (b) | $8^i$ | $2^i n^2$ | increasing | $\Theta(8^{\lg n}) = \Theta(n^3)$ (leaves) |
| (c) | $4^i$ | $n^2$ | equal | $\Theta(n^2\lg n)$ |

(a) $\sum_{i=0}^{\lg n} n^2/2^i \le 2n^2$, and the root alone is $n^2$, so $A(n) = \Theta(n^2)$.

(b) The sum is dominated by its last term, $2^{\lg n} n^2 = n^3$; equivalently, the number of leaves is $8^{\lg n} = n^{\lg 8} = n^3$. So $B(n) = \Theta(n^3)$.

(c) $\lg n + 1$ levels each summing to $n^2$: $C(n) = \Theta(n^2\log n)$.

Master theorem check: $n^{\log_2 a}$ is $n$, $n^3$, $n^2$ respectively, versus $f(n) = n^2$: cases 3, 1, 2.`,
    },
    {
      id: 'recursion-mom-induction', type: 'written', title: 'Median-of-medians recurrence, rigorously', difficulty: 2,
      prompt: String.raw`Let $T(n) = T(\lfloor n/5\rfloor) + T(\lfloor 7n/10\rfloor) + n$ for $n \ge 10$, and $T(n) = 1$ for $1 \le n \le 9$.

(a) Use a recursion tree to guess a tight bound.
(b) Prove by induction that $T(n) \le cn$ for all $n \ge 1$, for an explicit constant c.
(c) Explain why the same approach fails for $T(n) = T(n/3) + T(2n/3) + n$.`,
      rubric: ['Recursion tree level sums bounded by (9/10)^i n', 'Explicit constant c ≥ 10 identified', 'Base case and inductive step both correct, including that recursive arguments are in range', 'Explains that fractions summing to 1 give equal level sums and Θ(n log n)'],
      hints: [String.raw`A node of cost m has two children of total cost $m/5 + 7m/10$.`, String.raw`In the inductive step you need $c/5 + 7c/10 + 1 \le c$.`],
      solution: String.raw`**(a)** A node of cost m has children costing $m/5 + 7m/10 = 9m/10$ in total, so level i sums to at most $(9/10)^i n$ (branches that hit the base case early only reduce later sums; base-case nodes cost 1, and there are at most n of them in total). The series decreases geometrically: guess $T(n) = \Theta(n)$, with $T(n) \le \sum_i (9/10)^i n = 10n$.

**(b)** Claim: $T(n) \le 10n$ for all $n \ge 1$.

*Base case* $1 \le n \le 9$: $T(n) = 1 \le 10n$.

*Inductive step* $n \ge 10$: assume $T(k) \le 10k$ for all $1 \le k < n$. Since $n \ge 10$, $\lfloor n/5\rfloor \ge 2$ and $\lfloor 7n/10\rfloor \ge 7$, and both are less than n, so the hypothesis applies:
$$T(n) \le 10\lfloor n/5\rfloor + 10\lfloor 7n/10\rfloor + n \le 2n + 7n + n = 10n.$$
Together with $T(n) \ge n$, $T(n) = \Theta(n)$. ∎

**(c)** For $T(n) = T(n/3) + T(2n/3) + n$ the inductive step would need $c/3 + 2c/3 + 1 \le c$, i.e. $c + 1 \le c$ — impossible. The recursion tree explains why: every full level sums to exactly n (since $1/3 + 2/3 = 1$), and there are $\Theta(\log n)$ levels, so $T(n) = \Theta(n\log n)$, not O(n). (One can prove $T(n) \le c\, n\lg n$ by induction instead.)`,
    },
    {
      id: 'recursion-sqrt', type: 'written', title: 'Square-root recurrences', difficulty: 2,
      prompt: String.raw`Solve each recurrence (assume $T(n) = 1$ for $n \le 2$).

(a) $T(n) = 2T(\sqrt n) + \lg n$  (b) $T(n) = \sqrt n\, T(\sqrt n) + n$  (c) $T(n) = T(\sqrt n) + 1$  (d) $T(n) = 4T(\sqrt n) + \lg^2 n$`,
      rubric: ['Uses substitution m = lg n correctly (or a correct recursion tree)', 'Correct depth lg lg n where relevant', 'All four bounds correct'],
      hints: [String.raw`Let $m = \lg n$ and $S(m) = T(2^m)$; then $T(\sqrt n)$ becomes $S(m/2)$.`, String.raw`For (b), the change of variables is awkward because of the $\sqrt n$ multiplier; draw the recursion tree instead and compute each level's sum.`],
      solution: String.raw`Let $m = \lg n$, $S(m) = T(2^m)$, so $T(\sqrt n) = S(m/2)$.

**(a)** $S(m) = 2S(m/2) + m$, so $S(m) = \Theta(m\log m)$ and $T(n) = \Theta(\log n\,\log\log n)$.

**(b)** Recursion tree: level 0 is one node of cost n. Level 1 has $\sqrt n$ nodes of cost $\sqrt n$ (sum n). Level j has $n^{1/2}\cdot n^{1/4}\cdots n^{1/2^j} = n^{1 - 1/2^j}$ nodes, each of cost $n^{1/2^j}$, so every level sums to n. The size at level j is $n^{1/2^j}$, which reaches 2 when $j = \lg\lg n$. Hence $T(n) = \Theta(n\log\log n)$.

(Alternatively divide by n: $T(n)/n = T(\sqrt n)/\sqrt n + 1$, so $U(n) = T(n)/n$ satisfies $U(n) = U(\sqrt n) + 1 = \Theta(\log\log n)$.)

**(c)** $S(m) = S(m/2) + 1 = \Theta(\log m)$, so $T(n) = \Theta(\log\log n)$.

**(d)** $S(m) = 4S(m/2) + m^2$. Master theorem case 2 ($m^{\log_2 4} = m^2$): $S(m) = \Theta(m^2\log m)$, so $T(n) = \Theta(\log^2 n\,\log\log n)$.`,
    },
    {
      id: 'recursion-hanoi-adjacent', type: 'written', title: 'Adjacent-peg Tower of Hanoi', difficulty: 2,
      prompt: String.raw`The pegs of the Tower of Hanoi are in a row: 1, 2, 3. A disk may only move between **adjacent** pegs (1↔2 or 2↔3, never directly 1↔3). Describe a recursive algorithm that moves n disks from peg 1 to peg 3, write the recurrence for its number of moves, and solve it exactly.`,
      rubric: ['Correct recursive algorithm that respects the adjacency rule', 'Correct recurrence T(n) = 3T(n−1) + 2, T(0) = 0', 'Exact solution 3^n − 1 with verification'],
      hints: ['The largest disk must travel 1 → 2 → 3. Where must the other n−1 disks be during each of those two moves?', String.raw`During the move 1→2 they must all be on peg 3; during the move 2→3 they must all be on peg 1.`],
      solution: String.raw`To move disk n from 1 to 2, the other n−1 disks must all be on peg 3; to move it from 2 to 3, they must all be on peg 1. So:

~~~pseudo
AdjHanoi(n, a, c):        // move n disks from end peg a to the other end peg c (middle peg is 2)
    if n > 0:
        AdjHanoi(n-1, a, c)    // n-1 disks: a -> c
        move disk n: a -> 2
        AdjHanoi(n-1, c, a)    // n-1 disks: c -> a
        move disk n: 2 -> c
        AdjHanoi(n-1, a, c)    // n-1 disks: a -> c
~~~

The recursive calls move a smaller stack between the two *end* pegs, which is the same problem (the larger disk sitting on peg 2 behaves like an empty peg for them), so the Recursion Fairy handles them.

**Recurrence.** $T(0) = 0$, $T(n) = 3T(n-1) + 2$.

**Solution.** Unrolling: $T(n) = 3^k T(n-k) + 2(3^{k-1} + \dots + 1) = 3^k T(n-k) + (3^k - 1)$. With $k = n$: $T(n) = 3^n - 1$.

Check: $T(1) = 2$ (1→2→3) ✓; induction: $3(3^{n-1} - 1) + 2 = 3^n - 1$ ✓.

(Fun fact: $3^n$ is the number of legal configurations, and this algorithm visits every one of them exactly once.)`,
    },
    {
      id: 'recursion-guess-induct', type: 'written', title: 'Guess and verify: mergesort', difficulty: 2,
      prompt: String.raw`Let $T(1) = 0$ and $T(n) = T(\lceil n/2\rceil) + T(\lfloor n/2\rfloor) + n$ for $n \ge 2$.

(a) Prove by induction that $T(n) \le n\lceil \lg n\rceil$ for all $n \ge 1$.
(b) Explain precisely why the "proof" that $T(n) = O(n)$ via "$T(n) = 2\,O(n/2) + n = O(n)$" is invalid.`,
      rubric: [String.raw`Correct base case`, String.raw`Correct bound on ⌈lg⌈n/2⌉⌉ ≤ ⌈lg n⌉ − 1`, 'Inductive step algebra correct', 'Identifies the growing hidden constant in the bogus proof'],
      hints: [String.raw`For $n \ge 2$, $\lceil \lg \lceil n/2\rceil \rceil = \lceil \lg n\rceil - 1$.`, String.raw`Use that bound for both recursive terms: $\lceil n/2\rceil + \lfloor n/2\rfloor = n$.`],
      solution: String.raw`**(a)** Base: $T(1) = 0 = 1\cdot\lceil\lg 1\rceil$.

Key fact: for $n \ge 2$, $\lceil\lg\lceil n/2\rceil\rceil = \lceil\lg n\rceil - 1$. (If $2^{k-1} < n \le 2^k$ then $2^{k-2} < \lceil n/2\rceil \le 2^{k-1}$.) Also $\lfloor n/2 \rfloor \le \lceil n/2\rceil$, so $\lceil\lg\lfloor n/2\rfloor\rceil \le \lceil\lg n\rceil - 1$ too.

Step ($n \ge 2$; both halves are between 1 and n−1): with $k = \lceil\lg n\rceil$,
$$T(n) \le \lceil n/2\rceil (k-1) + \lfloor n/2\rfloor (k-1) + n = n(k-1) + n = nk = n\lceil\lg n\rceil.$$ ∎

**(b)** "O(n/2)" means "at most $c\cdot n/2$ for some constant c". Substituting gives $T(n) \le cn + n = (c+1)n$: the constant has increased. Applied recursively over $\lg n$ levels, the "constant" becomes $c + \lg n$ — not a constant at all. A valid induction must prove $T(n) \le cn$ for a **single fixed c**, and the step $cn + n \le cn$ fails. Indeed $T(n) = \Theta(n\log n)$.`,
    },
    {
      id: 'recursion-mixed-bag', type: 'written', title: 'A bag of recurrences', difficulty: 3,
      prompt: String.raw`Give tight $\Theta$ bounds, with a one- or two-line justification each (recursion tree level sums, or a Master theorem case with a, b, f stated).

(a) $3T(n/3) + \sqrt n$  (b) $2T(n/4) + \sqrt n$  (c) $7T(n/2) + n^2$  (d) $T(n/2) + T(n/3) + T(n/6) + n$  (e) $2T(n/2) + n\lg n$  (f) $2T(n/2) + n/\lg n$  (g) $T(n-2) + n$  (h) $T(n/2) + T(n/4) + n^2$`,
      rubric: ['Each answer correct (8 parts)', 'Justification identifies the dominant part of the tree / correct Master case', 'Recognizes (d), (f), (g), (h) are not plain Master-theorem recurrences'],
      hints: ['For (d) and (h), compute the sum of the children\'s costs relative to the parent.', String.raw`For (e) and (f), the level sums are $n(\lg n - i)$ and $n/(\lg n - i)$.`],
      solution: String.raw`**(a)** Level i: $3^i\sqrt{n/3^i} = \sqrt{3^i n}$ — increasing by factor $\sqrt3$. Leaves: $3^{\log_3 n} = n$. $\Theta(n)$. (Master case 1: $f = \sqrt n = O(n^{1-\varepsilon})$.)

**(b)** $n^{\log_4 2} = \sqrt n = f(n)$, case 2: $\Theta(\sqrt n\log n)$. (Level sums: $2^i\sqrt{n/4^i} = \sqrt n$ each.)

**(c)** $n^{\lg 7} \approx n^{2.807}$ beats $n^2$: case 1, $\Theta(n^{\lg 7})$ (Strassen).

**(d)** Children of a cost-m node sum to $m(1/2 + 1/3 + 1/6) = m$: full levels sum to n; depth between $\log_6 n$ and $\lg n$: $\Theta(n\log n)$.

**(e)** Level i sums to $n\lg(n/2^i) = n(\lg n - i)$; $\sum_{i=0}^{\lg n} n(\lg n - i) = n\sum_{j=0}^{\lg n} j = \Theta(n\log^2 n)$. (Extended Master case 2 with k = 1.)

**(f)** Level i sums to $n/(\lg n - i)$ (stop one level before the leaves, which add $\Theta(n)$): $n(1/\lg n + \dots + 1/1) = nH_{\lg n} = \Theta(n\log\log n)$.

**(g)** Unroll: $n + (n-2) + (n-4) + \dots \approx n^2/4$: $\Theta(n^2)$.

**(h)** Children of a node of cost $m^2$ (size m) cost $(m/2)^2 + (m/4)^2 = 5m^2/16$: decreasing geometric, root dominates: $\Theta(n^2)$.`,
    },
    {
      id: 'recursion-growth-order', type: 'written', title: 'Ordering growth rates', difficulty: 2,
      prompt: String.raw`Sort these functions from slowest-growing to fastest-growing, marking any that are $\Theta$ of each other:

$n^2$, $\lg(n!)$, $2^{\sqrt{\lg n}}$, $n!$, $\sqrt n$, $4^{\lg n}$, $n^{\lg n}$, $\lg n$, $n\lg n$, $2^n$, $n/\lg n$, $n^n$, $n$.`,
      rubric: ['Correct overall order', 'Recognizes lg(n!) = Θ(n lg n) and 4^{lg n} = n²', 'Correctly places 2^{√lg n} between lg n and √n', 'Correct ordering of n^{lg n}, 2^n, n!, n^n'],
      hints: [String.raw`Write everything as a power of 2: e.g. $n^{\lg n} = 2^{\lg^2 n}$, $\lg n = 2^{\lg\lg n}$, $\sqrt n = 2^{(\lg n)/2}$.`, String.raw`$\lg(n!) = \Theta(n\log n)$ by Stirling or $(n/2)^{n/2} \le n! \le n^n$.`],
      solution: String.raw`$$\lg n \;\ll\; 2^{\sqrt{\lg n}} \;\ll\; \sqrt n \;\ll\; n/\lg n \;\ll\; n \;\ll\; n\lg n \equiv \lg(n!) \;\ll\; n^2 \equiv 4^{\lg n} \;\ll\; n^{\lg n} \;\ll\; 2^n \;\ll\; n! \;\ll\; n^n$$

Justifications (exponents of 2): $\lg n = 2^{\lg\lg n}$, $2^{\sqrt{\lg n}}$, $\sqrt n = 2^{(\lg n)/2}$; since $\lg\lg n \ll \sqrt{\lg n} \ll (\lg n)/2$, the order follows (differences in the exponent tend to infinity).

- $\lg(n!) = \Theta(n\lg n)$: $n! \le n^n$ gives $\le n\lg n$; $n! \ge (n/2)^{n/2}$ gives $\ge (n/2)\lg(n/2)$.
- $4^{\lg n} = 2^{2\lg n} = n^2$.
- $n^{\lg n} = 2^{\lg^2 n}$ and $\lg^2 n \ll n$, so $n^{\lg n} \ll 2^n$ (but it beats every polynomial).
- $2^n \ll n!$ (ratio $\prod (i/2) \to \infty$) and $n! \ll n^n$ (ratio $n!/n^n \le 1/n$).`,
    },
    {
      id: 'recursion-stooge', type: 'written', title: 'Stooge sort', difficulty: 3,
      prompt: String.raw`Consider:

~~~pseudo
StoogeSort(A[1..n]):
    if n = 2 and A[1] > A[2]: swap A[1] and A[2]
    else if n > 2:
        m = ceil(2n/3)
        StoogeSort(A[1..m])          // first two-thirds
        StoogeSort(A[n-m+1..n])      // last two-thirds
        StoogeSort(A[1..m])          // first two-thirds again
~~~

(a) Prove that StoogeSort correctly sorts. (b) Would it still be correct with $m = \lfloor 2n/3\rfloor$? (c) Give the recurrence for its running time and solve it.`,
      rubric: ['Correctness: shows the ⌊n/3⌋ largest elements end in the last positions after the second call', 'Uses that the middle block is large enough (needs the ceiling)', 'Counterexample or argument for floor version', 'Recurrence T(n) = 3T(2n/3) + O(1) solved as Θ(n^{log_{3/2} 3}) ≈ n^{2.71}'],
      hints: [String.raw`Let $k = n - m = \lfloor n/3\rfloor$ and let L be the set of k largest elements. Where can the elements of L be after the first call?`, String.raw`Try $n = 4$ with the floor version: $m = 2$.`],
      solution: String.raw`**(a)** Induction on n; n ≤ 2 is clearly handled. Let $n > 2$, $m = \lceil 2n/3\rceil$ and $k = n - m = \lfloor n/3\rfloor$. Let L be the k largest elements. By induction each recursive call sorts its subarray.

After call 1, A[1..m] is sorted. Positions $k+1..m$ (the overlap of the two thirds) hold the $m - k$ largest elements of A[1..m]. Since $m - k = \lceil 2n/3\rceil - \lfloor n/3\rfloor \ge k$, every element of L that lies in A[1..m] is among the top $m-k$ elements of that block, hence now lies in positions $k+1..m$. So after call 1, **all of L lies in A[k+1..n]**, which is exactly the range of call 2 (n − m + 1 = k + 1).

After call 2, the k largest elements of A[k+1..n] — which are exactly L — occupy A[m+1..n] in sorted order. These are the k largest overall, in their final positions. Call 3 sorts the remaining A[1..m]. So A is sorted. ∎

**(b)** No. With $m = \lfloor 2n/3\rfloor$ and $n = 4$, $m = 2$: the calls sort A[1..2], A[3..4], A[1..2] — the two halves never interact, so elements never cross between them. For A = [1, 3, 2, 4], the first call leaves [1, 3], the second leaves [2, 4], the third leaves [1, 3]: the result [1, 3, 2, 4] is unsorted. (The overlap is too small: we need $m - k \ge k$, which fails here since $m - k = 0$.)

**(c)** $T(n) = 3T(\lceil 2n/3\rceil) + O(1)$. The level sums are $3^i \cdot O(1)$, increasing, so T(n) is the number of leaves: $3^{\log_{3/2} n} = n^{\log_{3/2} 3}$. With $\log_{3/2} 3 = \ln 3/\ln 1.5 \approx 2.7095$, $T(n) = \Theta(n^{\log_{3/2} 3}) \approx \Theta(n^{2.71})$ — worse than bubble sort.`,
    },
    {
      id: 'recursion-hanoi-code', type: 'code', title: 'Generate the Hanoi moves', difficulty: 1,
      prompt: String.raw`Write <code>hanoi(n)</code> that returns an optimal list of moves that transfers n disks (n ≥ 0) from peg 1 to peg 3 using peg 2. Each move is a pair <code>[from, to]</code> of peg numbers. Your list must be legal (never put a larger disk on a smaller one) and have exactly $2^n - 1$ moves.`,
      fn: 'hanoi',
      starter: 'function hanoi(n) {\n  // return an array of [from, to] moves taking n disks from peg 1 to peg 3\n}\n',
      reference: function (n) {
        const moves = [];
        function go(k, s, d, t) {
          if (k === 0) return;
          go(k - 1, s, t, d);
          moves.push([s, d]);
          go(k - 1, t, d, s);
        }
        go(n, 1, 3, 2);
        return moves;
      },
      tests: [[0], [1], [2], [3], [5]],
      gen: () => [Math.floor(Math.random() * 8)],
      check: (out, expected, args) => {
        const n = args[0];
        if (!Array.isArray(out) || out.length !== Math.pow(2, n) - 1) return false;
        const pegs = [null, [], [], []];
        for (let d = n; d >= 1; d--) pegs[1].push(d);
        for (const mv of out) {
          if (!Array.isArray(mv) || mv.length !== 2) return false;
          const a = mv[0], b = mv[1];
          if (![1, 2, 3].includes(a) || ![1, 2, 3].includes(b) || a === b) return false;
          if (pegs[a].length === 0) return false;
          const disk = pegs[a][pegs[a].length - 1];
          if (pegs[b].length > 0 && pegs[b][pegs[b].length - 1] < disk) return false;
          pegs[b].push(pegs[a].pop());
        }
        return pegs[3].length === n;
      },
      hints: ['Move n−1 disks to the spare peg, move disk n, then move the n−1 disks onto it.', 'Write a helper go(k, src, dst, tmp) that appends moves to a shared array.'],
      solution: String.raw`~~~js
function hanoi(n) {
  const moves = [];
  function go(k, src, dst, tmp) {
    if (k === 0) return;
    go(k - 1, src, tmp, dst);
    moves.push([src, dst]);
    go(k - 1, tmp, dst, src);
  }
  go(n, 1, 3, 2);
  return moves;
}
~~~
The number of moves satisfies $T(n) = 2T(n-1) + 1$, so exactly $2^n - 1$.`,
    },
    {
      id: 'recursion-eval-code', type: 'code', title: 'Evaluate the mergesort recurrence exactly', difficulty: 2,
      prompt: String.raw`Let $T(1) = 0$ and $T(n) = T(\lceil n/2\rceil) + T(\lfloor n/2\rfloor) + n$ for $n \ge 2$ (this counts the work of mergesort). Write <code>mergeRec(n)</code> returning $T(n)$ exactly for $1 \le n \le 10^6$. A naive recursion makes about 2n calls; use memoization so you only evaluate $O(\log n)$ distinct arguments. (Sanity check: for $n = 2^k$, $T(n) = n\lg n$.)`,
      fn: 'mergeRec',
      starter: 'function mergeRec(n) {\n  // T(1) = 0, T(n) = T(ceil(n/2)) + T(floor(n/2)) + n\n}\n',
      reference: function (n) {
        const memo = {};
        function T(m) {
          if (m <= 1) return 0;
          if (memo[m] !== undefined) return memo[m];
          const v = T(Math.ceil(m / 2)) + T(Math.floor(m / 2)) + m;
          memo[m] = v;
          return v;
        }
        return T(n);
      },
      tests: [[1], [2], [3], [8], [10], [1024], [1000000]],
      gen: () => [1 + Math.floor(Math.random() * 5000)],
      hints: [String.raw`At each recursion depth, the arguments that appear are only $\lfloor n/2^d\rfloor$ and $\lceil n/2^d\rceil$ — at most two distinct values.`, 'Store computed values in an object keyed by m.'],
      solution: String.raw`~~~js
function mergeRec(n) {
  const memo = {};
  function T(m) {
    if (m <= 1) return 0;
    if (memo[m] !== undefined) return memo[m];
    return memo[m] = T(Math.ceil(m / 2)) + T(Math.floor(m / 2)) + m;
  }
  return T(n);
}
~~~
At depth d, every argument is $\lfloor n/2^d\rfloor$ or $\lceil n/2^d\rceil$, so memoization evaluates only $O(\log n)$ distinct values. (The exact closed form is $T(n) = n\lceil\lg n\rceil - 2^{\lceil\lg n\rceil} + n$.)`,
    },
    {
      id: 'recursion-gray-code', type: 'code', title: 'Reflected Gray code', difficulty: 2,
      prompt: String.raw`The reflected binary Gray code of order n is a list of all $2^n$ bit strings of length n in which consecutive strings differ in exactly one bit. It is defined recursively: $G(1) = [\text{"0"}, \text{"1"}]$, and $G(n)$ is $G(n-1)$ with "0" prepended to every string, followed by the **reverse** of $G(n-1)$ with "1" prepended to every string. Write <code>grayCode(n)</code> (for $n \ge 1$) returning $G(n)$ as an array of strings. E.g. $G(2) = [\text{"00"},\text{"01"},\text{"11"},\text{"10"}]$.`,
      fn: 'grayCode',
      starter: 'function grayCode(n) {\n  // return the reflected Gray code of order n as an array of strings\n}\n',
      reference: function (n) {
        function g(k) {
          if (k === 1) return ['0', '1'];
          const p = g(k - 1);
          return p.map(s => '0' + s).concat(p.slice().reverse().map(s => '1' + s));
        }
        return g(n);
      },
      tests: [[1], [2], [3], [4]],
      gen: () => [1 + Math.floor(Math.random() * 6)],
      hints: ['Trust the Recursion Fairy to produce G(n−1).', 'Why does the reflection guarantee that the middle pair and the wrap-around differ in one bit?'],
      solution: String.raw`~~~js
function grayCode(n) {
  if (n === 1) return ['0', '1'];
  const p = grayCode(n - 1);
  return p.map(s => '0' + s).concat(p.slice().reverse().map(s => '1' + s));
}
~~~
Correctness of the one-bit property (by induction): within each half, consecutive strings differ in one bit by the inductive hypothesis (prepending the same bit preserves that, and reversing a list preserves adjacency). At the junction, the last string of the first half is "0" + last(G(n−1)) and the first of the second half is "1" + last(G(n−1)): they differ only in the first bit. Running time $T(n) = T(n-1) + \Theta(n2^n)$, which is $\Theta(n 2^n)$ — linear in the output size.`,
    },
    {
      id: 'recursion-thirds-proof', type: 'written', title: 'Unbalanced split: a full Θ(n log n) proof', difficulty: 3,
      prompt: String.raw`Let $T(n) = 1$ for real $1 \le n < 3$ and $T(n) = T(n/3) + T(2n/3) + n$ for $n \ge 3$ (ignore floors).

(a) Describe the recursion tree: what does each full level sum to? At what depths are the shallowest and deepest leaves? What bounds does this suggest?
(b) Prove by induction that $T(n) \le 2n\lg n + n$ for all $n \ge 1$.
(c) Prove by induction that $T(n) \ge \frac15 n\lg n$ for all $n \ge 1$.
(d) Why would the claim "$T(n) \le c\,n\lg n$ for all $n \ge 1$" fail no matter how large c is?`,
      rubric: ['Level sums: every full level sums to n; leaves between depth log_3 n and log_{3/2} n', 'Uses the identity (n/3)lg(n/3) + (2n/3)lg(2n/3) = n lg n − (lg 3 − 2/3)n', 'Upper-bound induction: base case, range check on arguments, correct algebra', 'Lower-bound induction with a valid base case', 'Explains the failure at n = 1 (lg 1 = 0)'],
      hints: [String.raw`A node of cost m has children of cost $m/3$ and $2m/3$; the shrinking is fastest along the $1/3$ branch and slowest along the $2/3$ branch.`, String.raw`Expand $\frac n3\lg\frac n3 + \frac{2n}3\lg\frac{2n}3$ using $\lg(xy) = \lg x + \lg y$; you should get $n\lg n$ minus a constant times n.`, 'In (b) the hypothesis for n/3 and 2n/3 contributes an extra n/3 + 2n/3 from the "+ n" term.'],
      solution: String.raw`**(a)** A node of cost m has children of total cost $m/3 + 2m/3 = m$, so every *full* level sums to exactly n. Along the all-$1/3$ path the size is $n/3^i$, which reaches the base case at depth about $\log_3 n$; along the all-$2/3$ path it is $(2/3)^i n$, reaching the base case at depth about $\log_{3/2} n$. So the first $\log_3 n$ levels are full (total $n\log_3 n$), and there are at most $\log_{3/2} n + 1$ levels, each summing to at most n. Suggests $n\log_3 n \lesssim T(n) \lesssim n\log_{3/2} n$, i.e. $\Theta(n\log n)$.

**Key identity.**
$$\frac n3\lg\frac n3 + \frac{2n}3\lg\frac{2n}3 = \frac n3(\lg n - \lg 3) + \frac{2n}3(\lg n + 1 - \lg 3) = n\lg n - \Big(\lg 3 - \frac23\Big)n.$$
Let $\beta = \lg 3 - 2/3 \approx 0.918$.

**(b)** Claim: $T(n) \le 2n\lg n + n$. *Base* ($1 \le n < 3$): $T(n) = 1 \le n \le 2n\lg n + n$. *Step* ($n \ge 3$): $n/3 \ge 1$ and $2n/3 < n$, so the hypothesis applies to both arguments:
$$T(n) \le \Big(2\tfrac n3\lg\tfrac n3 + \tfrac n3\Big) + \Big(2\tfrac{2n}3\lg\tfrac{2n}3 + \tfrac{2n}3\Big) + n = 2(n\lg n - \beta n) + 2n = 2n\lg n + (2 - 2\beta)n.$$
Since $2\beta \approx 1.84 \ge 1$, this is at most $2n\lg n + n$. ∎

**(c)** Claim: $T(n) \ge \frac15 n\lg n$. *Base*: for $1 \le n < 3$, $\frac15 n\lg n < \frac15\cdot 3\lg 3 \approx 0.95 < 1 = T(n)$. *Step*:
$$T(n) \ge \tfrac15\Big(\tfrac n3\lg\tfrac n3 + \tfrac{2n}3\lg\tfrac{2n}3\Big) + n = \tfrac15 n\lg n - \tfrac{\beta}{5}n + n \ge \tfrac15 n\lg n,$$
since $\beta/5 < 1$. ∎ Together, $T(n) = \Theta(n\log n)$.

**(d)** At $n = 1$, $c\cdot 1\cdot\lg 1 = 0 < 1 = T(1)$: the base case is false for every c. The cure is either to add a lower-order term (as in (b)) or to start the claim at $n \ge 2$ and treat $[2, 6)$ as the base region. Note the inductive step itself works for any $c \ge 1/\beta \approx 1.09$: the trouble is only the base case.`,
    },
    {
      id: 'recursion-quarter-family', type: 'written', title: 'Same tree shape, different work', difficulty: 2,
      prompt: String.raw`All five recurrences split into subproblems of size n/4. For each, give the level-i sum as a formula, say whether the level sums decrease, stay equal or increase, and state the Θ solution.

(a) $2T(n/4) + 1$  (b) $2T(n/4) + \sqrt n$  (c) $2T(n/4) + n$  (d) $2T(n/4) + \sqrt n\lg n$  (e) $3T(n/4) + \sqrt n$`,
      rubric: ['Correct level sums for all five', 'Correct depth log_4 n and leaf counts n^{log_4 2} = √n, n^{log_4 3}', 'Correct answers √n, √n log n, n, √n log² n, n^{log_4 3}', 'Part (d) actually sums the arithmetic series rather than guessing'],
      hints: [String.raw`At level i there are $a^i$ nodes of size $n/4^i$, and $\sqrt{n/4^i} = \sqrt n/2^i$.`, String.raw`For (d), $\lg(n/4^i) = \lg n - 2i$.`],
      solution: String.raw`The depth is $\log_4 n$ in all five. Level i has $a^i$ nodes of size $n/4^i$.

| | level-i sum | trend | answer |
|---|---|---|---|
| (a) | $2^i$ | increasing | leaves: $2^{\log_4 n} = n^{1/2}$, so $\Theta(\sqrt n)$ |
| (b) | $2^i\cdot\sqrt n/2^i = \sqrt n$ | equal | $\Theta(\sqrt n\log n)$ |
| (c) | $2^i\cdot n/4^i = n/2^i$ | decreasing | root: $\Theta(n)$ |
| (d) | $2^i\cdot\frac{\sqrt n}{2^i}(\lg n - 2i) = \sqrt n(\lg n - 2i)$ | decreasing arithmetically | $\Theta(\sqrt n\log^2 n)$ |
| (e) | $3^i\cdot\sqrt n/2^i = (3/2)^i\sqrt n$ | increasing | leaves: $3^{\log_4 n} = n^{\log_4 3} \approx n^{0.792}$ |

**(d) in detail.** $\sum_{i=0}^{\log_4 n} \sqrt n(\lg n - 2i)$: the terms go from $\sqrt n\lg n$ down to 0 in steps of $2\sqrt n$, about $\frac12\lg n$ terms, averaging $\frac12\sqrt n\lg n$. Total $\approx \frac14\sqrt n\lg^2 n = \Theta(\sqrt n\log^2 n)$. (Extended Master case 2 with k = 1.)

**(e)** is not $\Theta(\sqrt n\log n)$: changing a from 2 to 3 raised the leaf count from $\sqrt n$ to $n^{0.792}$, which is now polynomially larger than the work $\sqrt n$, so the leaves win (Master case 1).

The pattern: compare f with the leaf count $n^{\log_b a}$. Polynomially smaller → leaves; equal up to $\log^k$ → one more log; polynomially larger → root.`,
    },
    {
      id: 'recursion-log-factors', type: 'written', title: 'Log factors in the work', difficulty: 3,
      prompt: String.raw`Solve each recurrence by computing the level sums of the recursion tree and adding them explicitly. Say which ones the basic three-case Master theorem (without the $\log^k$ extension) handles.

(a) $4T(n/2) + n^2\lg n$  (b) $4T(n/2) + n^2/\lg n$  (c) $4T(n/2) + n^2/\lg^2 n$  (d) $2T(n/2) + n\lg^2 n$`,
      rubric: ['Correct level sums n²(lg n − i), n²/(lg n − i), n²/(lg n − i)², n(lg n − i)²', 'Correct evaluation of arithmetic, harmonic, and convergent sums', 'Answers n² log² n, n² log log n, n², n log³ n', 'Accounts for the leaf level (Θ(n²) or Θ(n))', 'Notes that none of the four is covered by the basic three cases'],
      hints: [String.raw`In (a)–(c), level i has $4^i$ nodes of size $n/2^i$, so the $4^i$ cancels against $(n/2^i)^2$.`, String.raw`Substitute $j = \lg n - i$. You will need $\sum_{j \le L} j = \Theta(L^2)$, $\sum_{j \le L} 1/j = \Theta(\log L)$, $\sum_j 1/j^2 \le \pi^2/6$, $\sum_{j \le L} j^2 = \Theta(L^3)$.`],
      solution: String.raw`Let $L = \lg n$ and substitute $j = L - i$ (so j runs from 1 to L over the internal levels). The leaf level has $4^L = n^2$ (or $2^L = n$) leaves of constant cost.

**(a)** Level sum $4^i\cdot\frac{n^2}{4^i}(L - i) = n^2 j$. Total $n^2\sum_{j=1}^{L} j + \Theta(n^2) = \Theta(n^2\log^2 n)$.

**(b)** Level sum $n^2/j$. Total $n^2 H_L + \Theta(n^2) = \Theta(n^2\log\log n)$.

**(c)** Level sum $n^2/j^2$. Total $n^2\sum_{j=1}^{L} 1/j^2 + \Theta(n^2) \le n^2(\pi^2/6 + O(1))$, and the leaves alone give $\Omega(n^2)$. So $\Theta(n^2)$ — the same as $4T(n/2) + 1$ would give (asymptotically), even though f is only *slightly* smaller than $n^2$.

**(d)** Level sum $2^i\cdot\frac n{2^i}(L - i)^2 = nj^2$. Total $n\sum_{j=1}^{L} j^2 + \Theta(n) = \Theta(n\log^3 n)$.

**Master theorem.** In all four, f differs from $n^{\log_b a}$ ($n^2$ or $n$) by only a log factor, so neither case 1 nor case 3 applies (they need a polynomial gap $n^\varepsilon$), and case 2 in its basic form needs $f = \Theta(n^{\log_b a})$ exactly. The extended case 2 ($\log^k$ with $k \ge 0$) handles (a) and (d); (b) and (c) have negative powers of log and need the explicit sums. (A further extension of the Master theorem covers $k = -1$, giving loglog, and $k < -1$, giving $n^{\log_b a}$ — exactly what we computed.)`,
    },
    {
      id: 'recursion-sqrt-divide', type: 'written', title: 'Square-root recurrences with multipliers', difficulty: 3,
      prompt: String.raw`Solve each recurrence (take $T(n) = 1$ for $n \le 2$). For (a)–(c) use the substitution $U(n) = T(n)/n$; confirm one of them with a recursion tree.

(a) $T(n) = \sqrt n\,T(\sqrt n) + n^2$  (b) $T(n) = 2\sqrt n\,T(\sqrt n) + n$  (c) $T(n) = \sqrt n\,T(\sqrt n) + n\lg n$  (d) $T(n) = 4T(\sqrt n) + \lg n$`,
      rubric: ['Correct derivation of the U recurrences', 'Correct change of variables m = lg n', 'Answers n², n log n, n log n, log² n', 'One recursion-tree confirmation with correct level sums'],
      hints: [String.raw`$\sqrt n\,T(\sqrt n)/n = T(\sqrt n)/\sqrt n = U(\sqrt n)$.`, String.raw`After dividing, set $m = \lg n$, $S(m) = U(2^m)$; then $U(\sqrt n) = S(m/2)$.`],
      solution: String.raw`Dividing $T(n) = c\sqrt n\,T(\sqrt n) + f(n)$ by n gives $U(n) = c\,U(\sqrt n) + f(n)/n$. Let $m = \lg n$, $S(m) = U(2^m)$.

**(a)** $U(n) = U(\sqrt n) + n$. So $U(n) = n + \sqrt n + n^{1/4} + \dots$, which is $n + O(\sqrt n\log\log n) = \Theta(n)$. Hence $T(n) = nU(n) = \Theta(n^2)$. (Tree: level 1 has $\sqrt n$ nodes of cost $(\sqrt n)^2 = n$, total $n$, far below the root's $n^2$; the sums $n^2, n^{3/2}, n^{5/4}, \dots$ drop fast, so the root dominates.)

**(b)** $U(n) = 2U(\sqrt n) + 1$, i.e. $S(m) = 2S(m/2) + 1 = \Theta(m)$. So $U(n) = \Theta(\log n)$ and $T(n) = \Theta(n\log n)$.

*Recursion tree for (b):* level 1 has $2\sqrt n$ nodes of cost $\sqrt n$ (sum 2n); each of those has $2n^{1/4}$ children of cost $n^{1/4}$, so level 2 has $4n^{3/4}$ nodes and sums to 4n; level j sums to $2^j n$. The sizes reach a constant after $\lg\lg n$ levels, and the increasing sums are dominated by the last: $2^{\lg\lg n}n = n\lg n$. ✓

**(c)** $U(n) = U(\sqrt n) + \lg n$, i.e. $S(m) = S(m/2) + m = \Theta(m)$. So $U(n) = \Theta(\log n)$ and $T(n) = \Theta(n\log n)$. (In the tree, level j sums to $n\lg n/2^j$: decreasing, root dominates.)

**(d)** No multiplier, so directly $S(m) = 4S(m/2) + m$, where now $S(m) = T(2^m)$. Master case 1: $m^{\log_2 4} = m^2$ beats m, so $S(m) = \Theta(m^2)$ and $T(n) = \Theta(\log^2 n)$.`,
    },
    {
      id: 'recursion-subtract-family', type: 'written', title: 'Subtract-and-conquer recurrences', difficulty: 2,
      prompt: String.raw`Solve each recurrence, giving a Θ bound with justification (exact closed forms where easy).

(a) $T(n) = T(n-1) + 1/n$, $T(0) = 0$
(b) $T(n) = 2T(n-2) + 1$, $T(0) = T(1) = 1$
(c) $T(n) = T(n-1) + n\lg n$, $T(1) = 0$
(d) $T(n) = n\,T(n-1) + 1$, $T(0) = 1$
(e) $T(n) = 2T(n-1) + n$, $T(0) = 0$`,
      rubric: ['(a) harmonic series Θ(log n)', '(b) Θ(2^{n/2}) with exact form, noting it is not Θ(2^n)', '(c) Θ(n² log n) with both upper and lower bounds', '(d) divide by n! to get Θ(n!)', '(e) Θ(2^n) with exact form 2^{n+1} − n − 2 verified'],
      hints: [String.raw`For (d), look at $T(n)/n!$.`, String.raw`For (c), bound the sum $\sum k\lg k$ above by $n\cdot n\lg n$ and below using only the terms with $k \ge n/2$.`, String.raw`For (e), guess $T(n) = A2^n + Bn + C$ and solve for A, B, C.`],
      solution: String.raw`**(a)** $T(n) = \sum_{k=1}^n 1/k = H_n = \Theta(\log n)$ (indeed $\ln(n+1) \le H_n \le 1 + \ln n$).

**(b)** Even n: $T(2k) = 2T(2k-2) + 1$ gives $T(2k) = 2^{k+1} - 1$ (check: $T(0) = 1$, $T(2) = 3$, $T(4) = 7$); odd n is the same with $T(1) = 1$. So $T(n) = 2^{\lfloor n/2\rfloor + 1} - 1 = \Theta(2^{n/2}) = \Theta((\sqrt2)^n)$. This is *not* $\Theta(2^n)$: the ratio $2^n/2^{n/2}$ is unbounded.

**(c)** $T(n) = \sum_{k=2}^n k\lg k$. Upper: each term is at most $n\lg n$, so $T(n) \le n^2\lg n$. Lower: the terms with $k \ge n/2$ are each at least $\frac n2\lg\frac n2$ and there are at least $n/2$ of them, so $T(n) \ge \frac{n^2}{4}\lg\frac n2$. Hence $\Theta(n^2\log n)$.

**(d)** Let $U(n) = T(n)/n!$. Dividing the recurrence by $n!$: $U(n) = U(n-1) + 1/n!$, so $U(n) = \sum_{k=0}^n 1/k! \in [1, e)$. Therefore $T(n) = \Theta(n!)$. (Exactly, $T(n) = \lfloor e\cdot n!\rfloor$ for $n \ge 1$: 2, 5, 16, 65, ...)

**(e)** Try $T(n) = A2^n + Bn + C$: then $A2^n + Bn + C = 2A2^{n-1} + 2B(n-1) + 2C + n$, so $B = 2B + 1$ and $C = -2B + 2C$, giving $B = -1$, $C = -2$; $T(0) = 0$ gives $A = 2$. So $T(n) = 2^{n+1} - n - 2 = \Theta(2^n)$. Check: $T(1) = 1$, $T(2) = 4$, $T(3) = 11$ ✓.

General lesson: one call on $n - b$ means "sum f along a path"; $a \ge 2$ calls mean $\Theta(a^{n/b})$ for polynomial f.`,
    },
    {
      id: 'recursion-fractions', type: 'written', title: 'Several unequal subproblems', difficulty: 3,
      prompt: String.raw`Solve each recurrence and prove your answer by induction (ignore floors; take $T(n) = 1$ for $1 \le n < 8$ in (a) and for $1 \le n < 4$ in (b)–(d)).

(a) $T(n) = T(n/2) + T(n/4) + T(n/8) + n$
(b) $T(n) = T(n/2) + T(n/4) + 1$
(c) $T(n) = T(n/2) + T(n/3) + T(n/4) + n$ (you may leave the exponent as the root of an equation)
(d) $T(n) = T(n/4) + T(3n/4) + n$ (recursion-tree argument suffices)`,
      rubric: ['(a) Θ(n) with induction T(n) ≤ 8n', '(b) Θ(n^{lg φ}) with exponent derivation and a strengthened induction (c n^p − 1)', '(c) identifies s = 13/12 > 1, answer Θ(n^p) with 2^{-p}+3^{-p}+4^{-p} = 1, p ≈ 1.08', '(c) upper-bound induction with a subtracted linear term', '(d) Θ(n log n) since the fractions sum to 1'],
      hints: [String.raw`Compare the total cost of a node's children to the node's own cost: the ratio is $\sum\alpha_j$ when the work is n.`, String.raw`For (b) and (c), guess $T(n) = \Theta(n^p)$ where $\sum\alpha_j^p = 1$; then $c(\alpha_1 n)^p + c(\alpha_2 n)^p + \dots = cn^p$ exactly.`, String.raw`If the leftover terms don't cancel in the upper bound, subtract something: try $cn^p - 1$ in (b) and $cn^p - dn$ in (c).`],
      solution: String.raw`**(a)** $1/2 + 1/4 + 1/8 = 7/8 < 1$: level sums are at most $(7/8)^i n$, so $T(n) \le 8n$. Induction: base $T(n) = 1 \le 8n$; step $T(n) \le 4n + 2n + n + n = 8n$. With $T(n) \ge n$: $\Theta(n)$.

**(b)** Guess $n^p$ with $(1/2)^p + (1/4)^p = 1$. With $x = 2^{-p}$: $x^2 + x - 1 = 0$, $x = (\sqrt5 - 1)/2 = 1/\phi$, so $2^p = \phi$ and $p = \lg\phi \approx 0.694$.

*Upper bound $T(n) \le 2n^p - 1$.* Base ($1 \le n < 4$): $2n^p - 1 \ge 1 = T(n)$. Step:
$$T(n) \le (2(n/2)^p - 1) + (2(n/4)^p - 1) + 1 = 2n^p\big(2^{-p} + 4^{-p}\big) - 1 = 2n^p - 1.$$
(The plain claim $T(n) \le cn^p$ fails: it leaves $cn^p + 1$.)

*Lower bound $T(n) \ge c'n^p$ with $c' = 4^{-p} = \phi^{-2}$.* Base: $c'n^p < c'4^p = 1 = T(n)$ for $n < 4$. Step: $T(n) \ge c'(n/2)^p + c'(n/4)^p + 1 \ge c'n^p$. So $T(n) = \Theta(n^{\lg\phi}) \approx \Theta(n^{0.694})$.

**(c)** $1/2 + 1/3 + 1/4 = 13/12 > 1$, so level sums increase and the answer is $\Theta(n^p)$ where $2^{-p} + 3^{-p} + 4^{-p} = 1$; the left side is decreasing in p and equals $13/12$ at $p = 1$, so $p > 1$ (numerically $p \approx 1.082$).

*Upper bound $T(n) \le cn^p - 12n$.* Step:
$$T(n) \le \sum_j\big(c(\alpha_j n)^p - 12\alpha_j n\big) + n = cn^p - 12\cdot\tfrac{13}{12}n + n = cn^p - 12n.$$
Base: need $1 \le cn^p - 12n$ for $1 \le n < 4$; since $n^p \ge n$ there, $c = 13$ works ($13n^p - 12n \ge n \ge 1$).
*Lower bound* $T(n) \ge c'n^p$ with $c' = 4^{-p}$: base as in (b), step $c'n^p + n \ge c'n^p$. So $T(n) = \Theta(n^p)$, $p \approx 1.082$.

**(d)** $1/4 + 3/4 = 1$: every full level sums to n, the shallowest leaf is at depth $\log_4 n$ and the deepest at $\log_{4/3} n$. So $n\log_4 n \lesssim T(n) \lesssim n\log_{4/3} n$: $\Theta(n\log n)$.`,
    },
    {
      id: 'recursion-code-recurrences', type: 'written', title: 'Write the recurrence for the code', difficulty: 2,
      prompt: String.raw`For each function, write a recurrence for its running time T(n) (with a base case) and solve it. Assume arithmetic is O(1) and n/2 means integer division.

~~~pseudo
A(n):  if n <= 1: return
       for i = 1 to n: for j = 1 to n: x = x + 1
       A(n/2); A(n/2); A(n/2)

B(n):  if n <= 1: return
       for i = 1 to n: x = x + 1
       B(n-1); B(n-2)

C(n):  if n <= 1: return
       i = 1
       while i < n: i = 2*i
       C(n/2); C(n/2)

D(n):  if n < 4: return
       for i = 1 to n: x = x + 1
       r = floor(sqrt(n))
       for k = 1 to r: D(r)
~~~`,
      rubric: ['A: T(n) = 3T(n/2) + Θ(n²) = Θ(n²)', 'B: T(n) = T(n−1) + T(n−2) + Θ(n) = Θ(φ^n)', 'C: T(n) = 2T(n/2) + Θ(log n) = Θ(n)', 'D: T(n) = √n T(√n) + Θ(n) = Θ(n log log n)', 'Each solution justified (level sums / unrolling / known recurrence)'],
      hints: ['Count executed calls; a call inside a loop of r iterations contributes r copies.', 'The while loop in C doubles i until it reaches n: how many iterations?', 'For B, compare with the Fibonacci recurrence.'],
      solution: String.raw`**A.** Three calls of size n/2 plus $n^2$ loop iterations: $T(n) = 3T(n/2) + \Theta(n^2)$. Level i sums to $3^i(n/2^i)^2 = (3/4)^i n^2$, decreasing: $\Theta(n^2)$. (Master: $n^{\lg 3} \approx n^{1.58}$ is polynomially smaller than $n^2$; case 3.)

**B.** $T(n) = T(n-1) + T(n-2) + \Theta(n)$. This is at least the Fibonacci recurrence, so $T(n) = \Omega(\phi^n)$. For the upper bound, $T(n) \le c\phi^n - dn - e$ can be verified by induction for suitable constants (the linear work is absorbed because the homogeneous part grows exponentially; $T(n) + n + 3$ satisfies the pure Fibonacci recurrence when the work is exactly n). So $T(n) = \Theta(\phi^n)$, $\phi \approx 1.618$.

**C.** The while loop runs $\lceil\lg n\rceil$ times. $T(n) = 2T(n/2) + \Theta(\log n)$. Level i sums to $2^i\lg(n/2^i)$, which grows (roughly doubling), so the leaves dominate: $\Theta(n)$. (Master case 1: $\lg n = O(n^{1-\varepsilon})$.) Directly: $\sum_{i} 2^i(\lg n - i) = n\sum_{j} j/2^j = \Theta(n)$ with $j = \lg n - i$.

**D.** The inner loop makes $r = \lfloor\sqrt n\rfloor$ calls, each of size r: $T(n) = \sqrt n\,T(\sqrt n) + \Theta(n)$. Every level of the tree sums to Θ(n) and there are $\Theta(\log\log n)$ levels: $\Theta(n\log\log n)$. (Or divide by n: $U(n) = U(\sqrt n) + 1$.)`,
    },
    {
      id: 'recursion-fast-power', type: 'written', title: 'Exponentiation by squaring, carefully', difficulty: 2,
      prompt: String.raw`(a) Give a recursive algorithm Power(a, n) that computes $a^n$ (integer $n \ge 0$) using $O(\log n)$ multiplications, and prove it correct by induction.
(b) Write the recurrence for the number of multiplications M(n) and give an exact upper bound in terms of $\lfloor\lg n\rfloor$.
(c) A classmate's version returns Power(a, ⌊n/2⌋) · Power(a, ⌊n/2⌋) (times a when n is odd). Write and solve its recurrence.
(d) Now suppose a is an m-bit integer, there is no modulus, and multiplying an x-bit number by a y-bit number costs $\Theta(xy)$ (schoolbook). Compare the total bit cost of your algorithm with the naive loop that multiplies by a, n − 1 times. Which is asymptotically faster?`,
      rubric: ['Correct one-call algorithm', 'Induction with base case n = 0 and both parity cases', 'M(n) = M(⌊n/2⌋) + O(1); bound ≤ 2(⌊lg n⌋ + 1)', 'Classmate version: 2M(n/2) + O(1) = Θ(n)', 'Bit-cost analysis: both Θ(n²m²); squaring dominated by the last squaring'],
      hints: [String.raw`Compute $h = a^{\lfloor n/2\rfloor}$ once.`, String.raw`In (d), $a^k$ has about km bits; the last squaring multiplies two numbers of about nm/2 bits.`],
      solution: String.raw`**(a)**
~~~pseudo
Power(a, n):
    if n = 0: return 1
    h = Power(a, floor(n/2))
    if n even: return h*h
    else:      return h*h*a
~~~
*Proof* by strong induction on n. Base $n = 0$: returns $1 = a^0$. Step $n \ge 1$: $\lfloor n/2\rfloor < n$, so $h = a^{\lfloor n/2\rfloor}$ by the IH. If n is even, $h^2 = a^n$. If n is odd, $2\lfloor n/2\rfloor = n - 1$, so $h^2a = a^n$. ∎

**(b)** $M(0) = 0$, $M(n) \le M(\lfloor n/2\rfloor) + 2$. For $n \ge 1$ the arguments $n, \lfloor n/2\rfloor, \lfloor n/4\rfloor, \dots, 1$ form a chain of $\lfloor\lg n\rfloor + 1$ calls with $n \ge 1$, each doing at most 2 multiplications, so $M(n) \le 2(\lfloor\lg n\rfloor + 1) = O(\log n)$. (It is also $\Omega(\log n)$: at least one squaring per level.)

**(c)** $M(n) = 2M(\lfloor n/2\rfloor) + O(1)$. Level sums double, so the leaves dominate: about $2^{\lg n} = n$ leaves, $M(n) = \Theta(n)$. The redundant second call throws away the whole advantage.

**(d)** *Squaring:* the top-level squaring multiplies two numbers of about $nm/2$ bits, costing $\Theta(n^2m^2)$; the level below costs about a quarter of that, and so on (plus the occasional multiply by a, costing $O(nm\cdot m)$). Decreasing geometric series: $\Theta(n^2m^2)$.
*Naive:* computing $a^{k}$ from $a^{k-1}$ multiplies a $(k-1)m$-bit number by an m-bit number: $\Theta(km^2)$. Summing over $k \le n$: $\Theta(n^2m^2)$.
They are **asymptotically the same**! With schoolbook multiplication and no modulus, the cost is dominated by the size of the final answer ($nm$ bits). Repeated squaring wins when the numbers stay small (working mod some M, where every multiplication costs the same, so $\Theta(\log n)$ vs $n - 1$ multiplications is all that matters) or when a subquadratic multiplication algorithm is used for the big squarings.`,
    },
    {
      id: 'recursion-peasant', type: 'written', title: 'Peasant multiplication, recursively', difficulty: 2,
      prompt: String.raw`(a) Using only addition, doubling, halving (⌊y/2⌋), and parity tests, write a recursive algorithm Mult(x, y) that returns $x\cdot y$ for nonnegative integers x, y.
(b) Prove it correct by induction.
(c) If x and y each have n bits, write a recurrence for the number of bit operations and solve it.`,
      rubric: ['Correct recursion on ⌊y/2⌋ with base case y = 0', 'Induction using y = 2⌊y/2⌋ + (y mod 2)', 'Recurrence T(n) = T(n−1) + O(n)', 'Solution Θ(n²)'],
      hints: [String.raw`$y = 2\lfloor y/2\rfloor + (y \bmod 2)$.`, 'Each level adds numbers of O(n) bits (the partial products have at most 2n bits); how many levels are there?'],
      solution: String.raw`**(a)**
~~~pseudo
Mult(x, y):
    if y = 0: return 0
    z = Mult(x, floor(y/2))
    if y is even: return z + z
    else:         return z + z + x
~~~

**(b)** Strong induction on y. Base $y = 0$: returns $0 = x\cdot 0$. Step $y \ge 1$: $\lfloor y/2\rfloor < y$, so $z = x\lfloor y/2\rfloor$. Since $y = 2\lfloor y/2\rfloor + (y \bmod 2)$, $xy = 2z + x\,(y \bmod 2)$, which is exactly what is returned in each case. ∎

**(c)** Halving y removes one bit, so measure size by the number of bits n of y (x stays fixed with n bits). Each call does one recursive call on an $(n-1)$-bit y plus a constant number of additions/doublings of numbers with at most $2n$ bits: $T(n) = T(n-1) + O(n)$, $T(0) = O(1)$. Unrolling: $T(n) = O(n + (n-1) + \dots + 1) = O(n^2)$; and the top half of the levels each add numbers of at least about n bits, so $\Theta(n^2)$ — the same as grade-school multiplication (which it essentially is, in binary).`,
    },
    {
      id: 'recursion-strengthen', type: 'written', title: 'When the induction almost works', difficulty: 2,
      prompt: String.raw`(a) Let $T(1) = 1$ and $T(n) = 2T(n/2) + 1$ for n a power of 2. Show that the inductive step for the claim "$T(n) \le cn$" fails for every c, then prove $T(n) \le 2n - 1$ instead.
(b) Let $T(1) = 1$ and $T(n) = 4T(n/2) + n$. Find constants c, d with $T(n) \le cn^2 - dn$ and prove it.
(c) In one or two sentences: why can proving a *stronger* statement be *easier*?`,
      rubric: ['Shows cn + 1 ≰ cn', 'Correct induction for 2n − 1 (base + step)', 'Finds c = 2, d = 1 (or any valid pair with base case checked)', 'Explains that the stronger hypothesis is also a stronger assumption'],
      hints: [String.raw`In (a), the hypothesis $T(n/2) \le c(n/2) - d$ gives $T(n) \le cn - 2d + 1$.`, String.raw`In (b), the step needs $-2dn + n \le -dn$, i.e. $d \ge 1$; then use the base case to choose c.`],
      solution: String.raw`**(a)** Hypothesis $T(n/2) \le cn/2$ gives $T(n) \le cn + 1$, which is never $\le cn$. Instead claim $T(n) \le 2n - 1$. Base: $T(1) = 1 = 2 - 1$. Step: $T(n) = 2T(n/2) + 1 \le 2(n - 1) + 1 = 2n - 1$. ∎ (Equality holds throughout, so $T(n) = 2n - 1$.)

**(b)** Hypothesis $T(n/2) \le c(n/2)^2 - d(n/2)$:
$$T(n) \le 4\Big(\frac{cn^2}{4} - \frac{dn}{2}\Big) + n = cn^2 - 2dn + n \le cn^2 - dn \iff d \ge 1.$$
Base: $T(1) = 1 \le c - d$. Take $d = 1$, $c = 2$: $T(n) \le 2n^2 - n$. (Again exact: $T(2) = 6 = 8 - 2$, $T(4) = 28 = 32 - 4$.) So $T(n) = O(n^2)$, and the leaves give $\Omega(n^2)$.

**(c)** In the inductive step we *assume* the claim for smaller inputs. A stronger claim gives a stronger assumption ("T is at most $cn - 1$" rather than "at most cn"), and here the extra slack is exactly what absorbs the $+1$ (or $+n$) work at each level.`,
    },
    {
      id: 'recursion-choose-algorithm', type: 'written', title: 'Which algorithm should you pick?', difficulty: 2,
      prompt: String.raw`(a) You have three algorithms for a problem of size n:
- A divides into 5 subproblems of size n/2, solves them recursively, and combines in linear time.
- B solves 2 subproblems of size n − 1 and combines in constant time.
- C divides into 9 subproblems of size n/3, solves them recursively, and combines in $O(n^2)$ time.

Give the running time of each and rank them.
(b) A new algorithm D divides into a subproblems of size n/4 and combines in linear time. What is the largest integer a for which D is asymptotically faster than C? For which a is D faster than $\Theta(n^2)$?`,
      rubric: ['A: Θ(n^{lg 5}) ≈ n^{2.32}', 'B: Θ(2^n)', 'C: Θ(n² log n)', 'Correct ranking C < A < B', 'D: a = 16 gives Θ(n²) (case 1), which beats n² log n; a = 17 does not; a ≤ 15 beats n²'],
      hints: [String.raw`Compute $n^{\log_b a}$ for each.`, String.raw`For D with $a = 16$: $n^{\log_4 16} = n^2$, and f(n) = n is polynomially smaller.`],
      solution: String.raw`**(a)**
- A: $T(n) = 5T(n/2) + O(n)$. $n^{\lg 5} \approx n^{2.32}$ beats n: $\Theta(n^{\lg 5})$.
- B: $T(n) = 2T(n-1) + O(1) = \Theta(2^n)$.
- C: $T(n) = 9T(n/3) + O(n^2)$. $n^{\log_3 9} = n^2 = f(n)$: $\Theta(n^2\log n)$.

Ranking (fastest first): C, A, B.

**(b)** $T(n) = aT(n/4) + n$. For $a > 4$ the leaves dominate: $\Theta(n^{\log_4 a})$.
- $a = 16$: $\Theta(n^{\log_4 16}) = \Theta(n^2)$. The work n is polynomially smaller than $n^2$, so there is **no** extra log factor — this beats C's $n^2\log n$.
- $a = 17$: $\Theta(n^{\log_4 17}) \approx \Theta(n^{2.044})$, and $n^{2.044}/(n^2\log n) \to \infty$: slower than C.

So the largest such a is **16**. D is $o(n^2)$ exactly when $\log_4 a < 2$, i.e. $a \le 15$. (Watch the trap: the extra log appears only when f matches $n^{\log_b a}$, and here f = n does not match $n^2$.)`,
    },
    {
      id: 'recursion-powmod-code', type: 'code', title: 'Modular exponentiation', difficulty: 2,
      prompt: String.raw`Write <code>powMod(a, n, m)</code> returning $a^n \bmod m$ for integers $0 \le a < 2^{31}$, $0 \le n \le 10^{15}$ and $1 \le m \le 46340$ (so a product of two residues fits comfortably in a JS number). Use the convention $a^0 = 1$ (so the answer for n = 0 is <code>1 % m</code>). The tests use n up to $10^{15}$, so you need $O(\log n)$ multiplications: use exponentiation by squaring with one recursive call.`,
      fn: 'powMod',
      starter: 'function powMod(a, n, m) {\n  // return a^n mod m using O(log n) multiplications\n}\n',
      reference: function (a, n, m) {
        function go(k) {
          if (k === 0) return 1 % m;
          const h = go(Math.floor(k / 2));
          const sq = (h * h) % m;
          return k % 2 === 0 ? sq : (sq * (a % m)) % m;
        }
        return go(n);
      },
      tests: [[2, 10, 1000], [3, 0, 7], [5, 3, 1], [0, 0, 13], [0, 5, 13], [7, 1000000000000000, 46337], [123456, 999999999999, 40000], [2, 62, 46340]],
      gen: () => [Math.floor(Math.random() * 2147483647), Math.floor(Math.random() * 1e15), 1 + Math.floor(Math.random() * 46340)],
      hints: [String.raw`$a^n = (a^{\lfloor n/2\rfloor})^2\cdot a^{n \bmod 2}$; reduce mod m after every multiplication.`, 'Reduce a mod m first — a can be much bigger than m.', 'Use Math.floor(n / 2) — n can be as large as 10^15, which is still exactly representable.'],
      solution: String.raw`~~~js
function powMod(a, n, m) {
  if (n === 0) return 1 % m;
  const h = powMod(a, Math.floor(n / 2), m);
  const sq = (h * h) % m;
  return n % 2 === 0 ? sq : (sq * (a % m)) % m;
}
~~~
Correctness is the induction from the lesson, applied to residues: $(xy) \bmod m = ((x \bmod m)(y \bmod m)) \bmod m$. Every intermediate product is below $46340^2 < 2^{31}$, so floating-point numbers represent it exactly. The recursion depth and the number of multiplications are $O(\log n)$ — about 50 levels for $n = 10^{15}$, versus $10^{15}$ iterations for the naive loop.`,
    },
    {
      id: 'recursion-fibmod-code', type: 'code', title: 'Fibonacci by fast doubling', difficulty: 3,
      prompt: String.raw`With $F_0 = 0$, $F_1 = 1$, $F_{k+1} = F_k + F_{k-1}$, write <code>fibMod(n, m)</code> returning $F_n \bmod m$ for $0 \le n \le 10^{15}$ and $1 \le m \le 30000$. A loop over n is far too slow; use the **fast doubling** identities
$$F_{2k} = F_k\,(2F_{k+1} - F_k), \qquad F_{2k+1} = F_k^2 + F_{k+1}^2,$$
recursing on $\lfloor n/2\rfloor$ and returning the pair $(F_k, F_{k+1})$. The recursion makes one call per level, so it uses $O(\log n)$ arithmetic operations.`,
      fn: 'fibMod',
      starter: 'function fibMod(n, m) {\n  // return F(n) mod m in O(log n) time\n}\n',
      reference: function (n, m) {
        function fd(k) {
          if (k === 0) return [0, 1 % m];
          const p = fd(Math.floor(k / 2));
          const a = p[0], b = p[1];
          const c = (a * ((2 * b - a + m) % m)) % m;
          const d = (a * a + b * b) % m;
          return k % 2 === 0 ? [c, d] : [d, (c + d) % m];
        }
        return fd(n)[0];
      },
      tests: [[0, 10], [1, 10], [2, 10], [10, 1000], [100, 1000], [90, 1], [1000000000000, 10007], [1000000000000000, 9973], [999999999999999, 30000]],
      gen: () => [Math.floor(Math.random() * 1e15), 1 + Math.floor(Math.random() * 30000)],
      hints: [String.raw`Write a helper that returns $[F_k \bmod m, F_{k+1} \bmod m]$. From $(F_k, F_{k+1})$ the identities give $(F_{2k}, F_{2k+1})$, and then $F_{2k+2} = F_{2k} + F_{2k+1}$.`, String.raw`$2F_{k+1} - F_k$ can be negative mod m; add m before reducing.`, 'Base case: k = 0 gives [0, 1 % m].'],
      solution: String.raw`~~~js
function fibMod(n, m) {
  function fd(k) {                       // returns [F(k) mod m, F(k+1) mod m]
    if (k === 0) return [0, 1 % m];
    const [a, b] = fd(Math.floor(k / 2)); // a = F(j), b = F(j+1), j = floor(k/2)
    const c = (a * ((2 * b - a + m) % m)) % m;   // F(2j)
    const d = (a * a + b * b) % m;               // F(2j+1)
    return k % 2 === 0 ? [c, d] : [d, (c + d) % m];
  }
  return fd(n)[0];
}
~~~
**Correctness** by induction on k: if fd(j) returns $(F_j, F_{j+1})$ mod m, the identities give $(F_{2j}, F_{2j+1})$; for even $k = 2j$ that is the answer, and for odd $k = 2j + 1$ the answer is $(F_{2j+1}, F_{2j} + F_{2j+1})$.
**Time:** $T(n) = T(n/2) + O(1) = O(\log n)$. All products are below $2\cdot 30000^2 < 2^{31}$, so they are exact.`,
    },
    {
      id: 'recursion-josephus-code', type: 'code', title: 'Josephus with every second person', difficulty: 2,
      prompt: String.raw`People numbered $1, \dots, n$ stand in a circle. Starting from person 1, every second person is eliminated: first 2, then 4, and so on around the circle, skipping people already gone, until one person remains. Write <code>josephus(n)</code> returning the survivor's number for $1 \le n \le 10^{15}$. Simulation is too slow for the large tests; find a recursion on $\lfloor n/2\rfloor$.

Example: n = 5 eliminates 2, 4, 1, 5, leaving **3**.`,
      fn: 'josephus',
      starter: 'function josephus(n) {\n  // survivor when every second person is eliminated, starting with person 2\n}\n',
      reference: function (n) {
        function J(k) {
          if (k === 1) return 1;
          const j = J(Math.floor(k / 2));
          return k % 2 === 0 ? 2 * j - 1 : 2 * j + 1;
        }
        return J(n);
      },
      tests: [[1], [2], [3], [4], [5], [6], [7], [41], [100], [1000000000000], [1099511627776], [999999999999999]],
      gen: () => [1 + Math.floor(Math.random() * (Math.random() < 0.5 ? 200 : 1e15))],
      hints: ['After one full trip around the circle, half the people are gone. Who is left, and whose turn is it?', String.raw`For $n = 2k$: the survivors of the first lap are $1, 3, \dots, 2k-1$ and we start again at 1, so this is the same game with k people, relabeled by $j \mapsto 2j - 1$.`, String.raw`For $n = 2k + 1$: after eliminating $2, 4, \dots, 2k$, person 1 is eliminated next; the survivors $3, 5, \dots, 2k+1$ start a k-person game at 3.`],
      solution: String.raw`~~~js
function josephus(n) {
  if (n === 1) return 1;
  const j = josephus(Math.floor(n / 2));
  return n % 2 === 0 ? 2 * j - 1 : 2 * j + 1;
}
~~~
**Recurrence.** $J(1) = 1$. If $n = 2k$, the first lap removes all even numbers and we restart at person 1 with the k people $1, 3, \dots, 2k-1$; the i-th of them is $2i - 1$, so $J(2k) = 2J(k) - 1$. If $n = 2k + 1$, the first lap removes $2, \dots, 2k$ and then person 1; the k remaining people $3, 5, \dots, 2k+1$ (the i-th is $2i + 1$) start a fresh game at 3, so $J(2k+1) = 2J(k) + 1$.

**Time** $T(n) = T(n/2) + O(1) = O(\log n)$. (Closed form: writing $n = 2^p + \ell$ with $0 \le \ell < 2^p$, $J(n) = 2\ell + 1$ — move the leading 1 bit of n to the end.)`,
    },
    {
      id: 'recursion-spot-wrong', type: 'written', title: 'Find the flaw in each analysis', difficulty: 2,
      prompt: String.raw`Each "solution" below reaches a wrong or unjustified conclusion. For each one, say precisely which step is wrong, and give the correct tight bound with a justification.

(a) "$T(n) = 2T(n/4) + \sqrt n$. The leaf count is $n^{\log_2 4} = n^2$, which is polynomially larger than $\sqrt n$, so by case 1, $T(n) = \Theta(n^2)$."

(b) "$T(n) = T(n/2) + T(n/3) + n$. There are two recursive calls, so the recursion tree is binary with $\Theta(\log n)$ levels, each costing at most n. Hence $T(n) = \Theta(n\log n)$."

(c) "$T(n) = 4T(n/2) + n$ with $T(1) = 1$. Claim: $T(n) \le cn^2$. Step: $T(n) \le 4c(n/2)^2 + n = cn^2 + n = O(n^2)$. So $T(n) = O(n^2)$."

(d) "$T(n) = 2T(n/2) + n\lg n$. Here $n^{\log_2 2} = n$, and $f(n) = n\lg n$ is bigger than n, so by case 3, $T(n) = \Theta(n\log n)$."

(e) "$T(n) = 2T(n-2) + 1$. Every call makes two calls, so the recursion tree is a complete binary tree and $T(n) = \Theta(2^n)$."`,
      rubric: [
        String.raw`(a) The log is computed upside down; $n^{\log_4 2} = \sqrt n$ matches f, so $\Theta(\sqrt n\log n)$`,
        String.raw`(b) $n\log n$ is a valid upper bound but not tight: the level sums are $(5/6)^i n$, so $\Theta(n)$`,
        String.raw`(c) $cn^2 + n \not\le cn^2$ (you cannot switch to O in the middle of an induction); fix with $T(n) \le 2n^2 - n$`,
        String.raw`(d) $n\lg n$ is not polynomially larger than n; the level sums $n(\lg n - i)$ give $\Theta(n\log^2 n)$`,
        String.raw`(e) The depth is n/2, not n: $\Theta(2^{n/2})$, which is not $\Theta(2^n)$`,
      ],
      hints: ['For each part, recompute the one quantity the argument depends on: the leaf count, the level sums, the inequality the induction actually needs, or the depth of the tree.', 'In (b), what fraction of a node\'s cost do its two children cost together?'],
      solution: String.raw`**(a) Wrong exponent.** The leaf count is $n^{\log_b a} = n^{\log_4 2} = n^{1/2}$, not $n^{\log_2 4}$: the base of the log is b (the shrink factor), and its argument is a (the number of calls). Now f matches the leaf count exactly. Level i has $2^i$ nodes, each costing $\sqrt{n/4^i} = \sqrt n/2^i$, so every level sums to $\sqrt n$, over $\log_4 n + 1$ levels. Hence $T(n) = \Theta(\sqrt n\log n)$ (case 2).

**(b) A true upper bound, but the wrong Θ.** It is true that each level costs at most n, so $T(n) = O(n\log n)$, but that bound is not tight. A node of cost m has children of total cost $m/2 + m/3 = 5m/6$, so level i costs at most $(5/6)^i n$, and $T(n) \le n\sum_i (5/6)^i = 6n$. The root alone gives $T(n) \ge n$, so $T(n) = \Theta(n)$. The number of children tells you nothing by itself; what matters is how much work the children do compared with their parent.

**(c) The induction does not close.** The step must end with "$\le cn^2$" for the *same* c, but it ends with $cn^2 + n$, which is larger. Writing "$= O(n^2)$" hides a constant that grows at every level. The bound itself is true, but proving it needs a stronger claim: $T(n) \le 2n^2 - n$. Base: $T(1) = 1 = 2 - 1$. Step (n a power of 2): $T(n) \le 4\big(2(n/2)^2 - n/2\big) + n = 2n^2 - 2n + n = 2n^2 - n$. ✓ The matching lower bound $\Omega(n^2)$ comes from the $n^2$ leaves.

**(d) Not polynomially larger.** Case 3 needs $f(n) = \Omega(n^{1+\varepsilon})$ for some $\varepsilon > 0$, and $n\lg n$ is not even $\Omega(n^{1.0001})$. The level sums are $2^i\cdot\frac{n}{2^i}\lg\frac{n}{2^i} = n(\lg n - i)$, an arithmetic series, so the total is $n\sum_{j=1}^{\lg n} j + \Theta(n) = \Theta(n\log^2 n)$ (extended case 2 with k = 1).

**(e) Wrong depth.** The argument drops by 2 at each level, so the depth is about n/2 and there are about $2^{n/2}$ leaves. Unrolling gives $T(n) = 2^kT(n-2k) + 2^k - 1$, so $T(n) = \Theta(2^{n/2}) = \Theta(\sqrt2^{\,n})$. This is not $\Theta(2^n)$, because $2^n/2^{n/2} = 2^{n/2} \to \infty$.`,
    },
    {
      id: 'recursion-hidden-code', type: 'written', title: 'Recurrences hiding in code', difficulty: 3,
      prompt: String.raw`For each procedure, write a recurrence for its worst-case running time (with a base case) and solve it. Assume arithmetic takes O(1) time and n/2 means integer division.

~~~pseudo
A(n):  if n <= 1: return
       for i = 1 to n:
           j = 1
           while j < n: j = 2*j
       A(n/2); A(n/2)

B(L[1..n]):  if n <= 1: return
       M = copy of L[1..n/2]                 // Theta(n) time
       if L[1] < L[n]: B(M)
       else:           B(copy of L[n/2+1..n])

C(n):  if n <= 1: return
       for k = 1 to floor(lg n): C(floor(n / 2^k))
       for i = 1 to n: x = x + 1

D(n):  if n < 4: return
       for i = 1 to n: for j = 1 to n: x = x + 1
       D(n/4); D(3n/4)
~~~`,
      rubric: [
        String.raw`A: the while loop runs $\lceil\lg n\rceil$ times; $2T(n/2) + \Theta(n\log n) = \Theta(n\log^2 n)$`,
        String.raw`B: exactly one executed call plus $\Theta(n)$ copying: $T(n/2) + \Theta(n) = \Theta(n)$`,
        String.raw`C: the recurrence $\sum_k T(n/2^k) + \Theta(n)$, solved correctly as $\Theta(n\log n)$ (e.g. by subtracting consecutive equations for $n = 2^m$)`,
        String.raw`D: $T(n/4) + T(3n/4) + \Theta(n^2) = \Theta(n^2)$, because the children cost 10/16 of the parent`,
        'Every answer is justified, not just stated',
      ],
      hints: ['The while loop in A does not depend on i. How many times does j double before it reaches n?', 'An if/else executes exactly one branch. What does each branch of B cost?', String.raw`For C, take $n = 2^m$ and $S(m) = T(2^m)$. Write the equation for S(m) and the one for S(m − 1), and subtract them.`],
      solution: String.raw`**A.** For each of the n values of i, the while loop doubles j from 1 until $j \ge n$, which takes $\lceil\lg n\rceil$ iterations whatever i is. So the loops do $\Theta(n\log n)$ work, and two calls are executed:
$$T(n) = 2T(n/2) + \Theta(n\log n).$$
Level i sums to $2^i\cdot\frac n{2^i}\lg\frac n{2^i} = n(\lg n - i)$, an arithmetic series, so $T(n) = \Theta(n\log^2 n)$.

**B.** Exactly one branch of the if/else runs, and either branch makes exactly one recursive call on about n/2 elements, after $\Theta(n)$ copying. So
$$T(n) = T(n/2) + \Theta(n) = \Theta(n)$$
(a decreasing geometric series, so the root dominates). The classic mistake is to add the two branches and write $2T(n/2) + \Theta(n) = \Theta(n\log n)$. Passing index ranges instead of copies would make the time $\Theta(\log n)$.

**C.** The first loop makes one call for each $k = 1, \dots, \lfloor\lg n\rfloor$, on sizes about $n/2, n/4, \dots, 1$, and the second loop does $\Theta(n)$ work:
$$T(n) = \sum_{k=1}^{\lfloor\lg n\rfloor} T(\lfloor n/2^k\rfloor) + \Theta(n).$$
The number of calls grows with n, so neither the Master theorem nor the sum-of-fractions rule applies. Take $n = 2^m$, $S(m) = T(2^m)$, and say the work is exactly $2^m$. Then $S(m) = \sum_{j=0}^{m-1} S(j) + 2^m$. Subtracting the same equation for m − 1:
$$S(m) - S(m-1) = S(m-1) + 2^{m-1}, \qquad\text{so}\qquad S(m) = 2S(m-1) + 2^{m-1}.$$
Dividing by $2^m$ gives $\dfrac{S(m)}{2^m} = \dfrac{S(m-1)}{2^{m-1}} + \dfrac12$, so $S(m) = \Theta(m2^m)$, that is, $T(n) = \Theta(n\log n)$. Intuitively, the children's sizes add up to almost n, so each level of the tree costs almost n, just as when the fractions sum to 1. (A numerical check: $T(n)/(n\lg n)$ tends to 1/2.)

**D.** There are two calls, on n/4 and 3n/4, plus $n^2$ loop iterations:
$$T(n) = T(n/4) + T(3n/4) + \Theta(n^2).$$
A node of size m costs $m^2$, and its children cost $(m/4)^2 + (3m/4)^2 = \frac{10}{16}m^2$ together. The level sums decrease geometrically, so the root dominates: $T(n) = \Theta(n^2)$. Compare: with *linear* work, the fractions $\frac14 + \frac34 = 1$ would give $\Theta(n\log n)$. The decision depends on the work function, not only on the split.`,
    },
    {
      id: 'recursion-maxmin', type: 'written', title: 'Max and min together: when base cases matter', difficulty: 2,
      prompt: String.raw`We want both the maximum and the minimum of n distinct numbers A[1..n], and we count only comparisons between elements.

(a) How many comparisons does the obvious method use (one scan for the max, then one scan for the min)?
(b) Design a divide-and-conquer algorithm: split A into halves, recursively find the (min, max) of each half, and combine the results with 2 comparisons. Use two base cases: n = 1 (0 comparisons) and n = 2 (1 comparison), and recurse only when $n \ge 3$. Write the recurrence for the number of comparisons C(n), and solve it exactly when n is a power of 2.
(c) A classmate uses only the base case n = 1 and recurses whenever $n \ge 2$. Write and solve that recurrence for n a power of 2. Both answers are Θ(n). Why are they different?
(d) Prove your exact answer to (b) by induction.`,
      rubric: [
        String.raw`(a) $2n - 2$ comparisons (or $2n - 3$ if the second scan skips the maximum)`,
        String.raw`(b) Correct algorithm, and the recurrence $C(n) = 2C(n/2) + 2$ with $C(2) = 1$, $C(1) = 0$`,
        String.raw`(b) Exact solution $3n/2 - 2$`,
        String.raw`(c) $2n - 2$, and the explanation that the leaves dominate the count, so the base case changes the constant`,
        String.raw`(d) A valid induction with base case n = 2`,
      ],
      hints: ['Two numbers need only one comparison to decide which is the min and which is the max.', String.raw`In $2C(n/2) + O(1)$ the leaves dominate, so the cost at the bottom of the tree sets the constant in front of n.`],
      solution: String.raw`**(a)** Finding the max takes n − 1 comparisons, and finding the min takes another n − 1, for $2n - 2$ in total. (Skipping the maximum in the second scan saves one: $2n - 3$.)

**(b)**
~~~pseudo
MinMax(A[1..n]):
    if n = 1: return (A[1], A[1])
    if n = 2: if A[1] < A[2] return (A[1], A[2]) else return (A[2], A[1])     // 1 comparison
    m = floor(n/2)
    (a1, b1) = MinMax(A[1..m]);  (a2, b2) = MinMax(A[m+1..n])
    return (min(a1, a2), max(b1, b2))                                          // 2 comparisons
~~~
Correctness: the minimum of A is the smaller of the two halves' minima, and similarly for the maximum (strong induction on n; both halves are nonempty and smaller than n when $n \ge 3$).

For n a power of 2: $C(1) = 0$, $C(2) = 1$, and $C(n) = 2C(n/2) + 2$ for $n \ge 4$. Unroll until the size reaches 2, that is, $k = \lg n - 1$ times:
$$C(n) = 2^kC(n/2^k) + 2(2^{k-1} + \dots + 1) = \frac n2\cdot 1 + 2\Big(\frac n2 - 1\Big) = \frac{3n}{2} - 2.$$

**(c)** $C(1) = 0$ and $C(n) = 2C(n/2) + 2$ for $n \ge 2$. Unroll $\lg n$ times: $C(n) = n\cdot 0 + 2(n - 1) = 2n - 2$. This is no better than the obvious method.

Why they differ: in a recurrence like $2C(n/2) + O(1)$, the leaves dominate the total, so what happens at the bottom of the tree decides the constant. The classmate's version handles a pair of elements as two singletons plus a combine, which costs 2 comparisons (min against min, max against max). One comparison suffices for a pair. There are n/2 pairs at the bottom, so the classmate pays n/2 extra comparisons. Asymptotics ignore base cases; exact counts do not.

**(d)** Claim: $C(n) = 3n/2 - 2$ for every power of two $n \ge 2$. Base n = 2: $C(2) = 1 = 3 - 2$. Step ($n \ge 4$): by the hypothesis for n/2,
$$C(n) = 2\Big(\frac{3n}{4} - 2\Big) + 2 = \frac{3n}2 - 2.\ \checkmark$$
(Remark: $\lceil 3n/2\rceil - 2$ comparisons are known to be necessary, so this algorithm is optimal. The usual iterative version processes the elements in pairs.)`,
    },
    {
      id: 'recursion-asymptotic-tf', type: 'written', title: 'Asymptotic claims: prove or refute', difficulty: 2,
      prompt: String.raw`Let f and g be functions from the positive integers to the reals with $f(n) \ge 2$ and $g(n) \ge 2$ for all n. For each statement, decide whether it is always true. Prove the true ones from the definition of O, and give a counterexample for each false one.

(a) If $f(n) = O(g(n))$, then $2^{f(n)} = O(2^{g(n)})$.
(b) If $f(n) = O(g(n))$, then $\lg f(n) = O(\lg g(n))$.
(c) $f(n) = O(f(\lfloor n/2\rfloor))$ (take $f(0) = 2$ if needed).
(d) $f(n) + g(n) = \Theta(\max(f(n), g(n)))$.
(e) $n^{1/\lg n} = \Theta(1)$.
(f) For any such f and g, either $f(n) = O(g(n))$ or $g(n) = O(f(n))$.`,
      rubric: [
        String.raw`(a) False, with a counterexample such as f = 2n, g = n`,
        String.raw`(b) True, with a proof that uses $\lg g \ge 1$ to absorb $\lg c$`,
        String.raw`(c) False ($f = 2^n$); notes that it holds for polynomials`,
        String.raw`(d) True: $\max \le f + g \le 2\max$`,
        String.raw`(e) True: it equals 2 for $n \ge 2$`,
        '(f) False, with an oscillating counterexample',
      ],
      hints: ['A constant factor inside an exponent becomes a polynomial factor outside it.', String.raw`For (f), try a g that jumps between something tiny and something huge depending on the parity of n.`],
      solution: String.raw`**(a) False.** Take $f(n) = 2n$ and $g(n) = n$ (both at least 2 for $n \ge 2$). Then $f = O(g)$, but $2^{f(n)}/2^{g(n)} = 2^n$ is unbounded, so $4^n \ne O(2^n)$. A constant factor inside the exponent changes the base of the exponential.

**(b) True.** Suppose $f(n) \le c\,g(n)$ for all $n \ge n_0$, where we may assume $c \ge 1$. Then $\lg f(n) \le \lg c + \lg g(n)$. Since $g(n) \ge 2$, we have $\lg g(n) \ge 1$, so $\lg c \le \lg c\cdot\lg g(n)$. Therefore $\lg f(n) \le (\lg c + 1)\lg g(n)$ for $n \ge n_0$. ∎ (The hypothesis $g \ge 2$ matters: if g could approach 1, then $\lg g$ would approach 0.)

**(c) False.** Take $f(n) = 2^n$. Then $f(n)/f(\lfloor n/2\rfloor) \ge 2^{n/2}$, which is unbounded. The statement does hold for polynomially bounded functions such as $n^k$ or $n^k\log n$. This is exactly why "the size halves" is harmless for polynomial work but not for exponential work.

**(d) True.** For all n, $\max(f, g) \le f + g \le 2\max(f, g)$. Take $c_1 = 1$, $c_2 = 2$ and $n_0 = 1$. ∎

**(e) True.** For $n \ge 2$, $n^{1/\lg n} = (2^{\lg n})^{1/\lg n} = 2$. A constant, so $\Theta(1)$.

**(f) False.** Let $f(n) = n$, and let $g(n) = n^2$ for even n and $g(n) = 2$ for odd n. On odd n, $f/g = n/2$ is unbounded, so $f \ne O(g)$. On even n, $g/f = n$ is unbounded, so $g \ne O(f)$. Asymptotic notation is a *partial* order. The functions that come out of algorithm analysis are usually comparable, but not all functions are.`,
    },
    {
      id: 'recursion-binomial-calls', type: 'written', title: 'Counting the calls of naive binomial recursion', difficulty: 2,
      prompt: String.raw`Consider
~~~pseudo
Choose(n, k):              // requires 0 <= k <= n
    if k = 0 or k = n: return 1
    return Choose(n-1, k-1) + Choose(n-1, k)
~~~
(a) Prove by induction that Choose(n, k) returns $\binom nk$.
(b) Let N(n, k) be the total number of calls made, including the top-level call. Write a recurrence for N, and prove that $N(n, k) = 2\binom nk - 1$.
(c) What is the running time for $k = \lfloor n/2\rfloor$? Compare it with $2^n$. You may use $\binom{n}{\lfloor n/2\rfloor} = \Theta(2^n/\sqrt n)$, and you may count each addition as O(1).
(d) How many distinct subproblems are there? What running time does memoization give?`,
      rubric: [
        String.raw`(a) Induction with base cases, and a check that the recursive arguments are valid ($0 \le k-1$ and $k \le n-1$ when $0 < k < n$)`,
        String.raw`(b) The recurrence $N(n,k) = 1 + N(n-1,k-1) + N(n-1,k)$ with base value 1`,
        String.raw`(b) An induction proof of $2\binom nk - 1$ (or the full-binary-tree leaf-count argument)`,
        String.raw`(c) $\Theta(2^n/\sqrt n)$ for $k = n/2$: exponential, smaller than $2^n$ only by a $\sqrt n$ factor`,
        String.raw`(d) O(nk) distinct subproblems; O(nk) time with memoization`,
      ],
      hints: ['Every leaf of the recursion tree returns 1, and the answer is the sum of the leaves.', 'A binary tree in which every internal node has exactly two children has one fewer internal node than leaves.'],
      solution: String.raw`**(a)** Strong induction on n. If k = 0 or k = n, the call returns $1 = \binom nk$. Otherwise $0 < k < n$, so $0 \le k - 1 \le n - 1$ and $0 \le k \le n - 1$: both recursive calls are valid instances with first argument n − 1 < n. By the hypothesis they return $\binom{n-1}{k-1}$ and $\binom{n-1}{k}$, and Pascal's rule says these add up to $\binom nk$. ∎

**(b)** $N(n, k) = 1$ if $k \in \{0, n\}$, and otherwise $N(n,k) = 1 + N(n-1, k-1) + N(n-1, k)$.
*Claim:* $N(n,k) = 2\binom nk - 1$. Base: $2\cdot 1 - 1 = 1$. ✓ Step: by the hypothesis,
$$N(n,k) = 1 + \Big(2\tbinom{n-1}{k-1} - 1\Big) + \Big(2\tbinom{n-1}{k} - 1\Big) = 2\tbinom nk - 1.\ \checkmark$$
*The slick argument:* every leaf returns 1 and the root returns the sum of the leaves, so there are exactly $\binom nk$ leaves. Every internal node has exactly two children, and such a tree with L leaves has $2L - 1$ nodes.

**(c)** Each call does O(1) work outside its recursive calls, so the time is $\Theta(N(n,k)) = \Theta(\binom nk)$. For $k = \lfloor n/2\rfloor$ that is $\Theta(2^n/\sqrt n)$: exponential, and below $2^n$ only by a $\sqrt n$ factor. (The answer $\binom nk$ itself has about n bits, so with big-integer additions the true cost is even higher.)

**(d)** Every call has the form Choose(n − i, k − j) with $0 \le j \le i$, so there are at most $(n+1)(k+1)$ distinct subproblems, each costing O(1) once its two children are known. Memoization gives O(nk) time: this is Pascal's triangle, filled row by row. The exponential blow-up came entirely from recomputing the same subproblems, which is exactly the motivation for dynamic programming.`,
    },
    {
      id: 'recursion-isqrt-code', type: 'code', title: 'Integer square root by recursion', difficulty: 2,
      prompt: String.raw`Write <code>isqrt(n)</code> returning $\lfloor\sqrt n\rfloor$ for integers $0 \le n \le 10^{15}$, **without** <code>Math.sqrt</code> or <code>Math.pow</code>, using $O(\log n)$ arithmetic operations. Use this recursion: let $s = $ isqrt($\lfloor n/4\rfloor$); then the answer is either 2s or 2s + 1. (Every intermediate value stays below $2^{53}$, so ordinary JavaScript numbers are exact.)`,
      fn: 'isqrt',
      starter: 'function isqrt(n) {\n  // floor(sqrt(n)) using recursion on floor(n/4); no Math.sqrt\n}\n',
      reference: function (n) {
        function go(m) {
          if (m === 0) return 0;
          const s = go(Math.floor(m / 4));
          const r = 2 * s;
          return (r + 1) * (r + 1) <= m ? r + 1 : r;
        }
        return go(n);
      },
      tests: [[0], [1], [2], [3], [4], [8], [9], [15], [16], [99], [100], [1000000], [999999961946175], [999999961946176], [999999999999999], [1000000000000000]],
      gen: () => [Math.random() < 0.5 ? Math.floor(Math.random() * 1e15) : Math.floor(Math.random() * 2000)],
      hints: [String.raw`If $s^2 \le \lfloor n/4\rfloor < (s+1)^2$, multiply by 4: what does that tell you about $(2s)^2$ and $(2s+2)^2$ compared with n?`, String.raw`Base case: n = 0 returns 0. For $1 \le n \le 3$ the recursion gives s = 0, then checks whether $1 \le n$.`],
      solution: String.raw`~~~js
function isqrt(n) {
  if (n === 0) return 0;
  const s = isqrt(Math.floor(n / 4));
  const r = 2 * s;
  return (r + 1) * (r + 1) <= n ? r + 1 : r;
}
~~~
**Correctness** (strong induction on n). Base: isqrt(0) = 0. Step: $\lfloor n/4\rfloor < n$ for $n \ge 1$, so by the hypothesis $s^2 \le \lfloor n/4\rfloor < (s+1)^2$. Then
- $(2s)^2 = 4s^2 \le 4\lfloor n/4\rfloor \le n$, and
- $(2s+2)^2 = 4(s+1)^2 \ge 4(\lfloor n/4\rfloor + 1) > n$, because $n < 4\lfloor n/4\rfloor + 4$.

So $2s \le \sqrt n < 2s + 2$, and $\lfloor\sqrt n\rfloor$ is 2s or 2s + 1. One comparison decides which.

**Time.** $T(n) = T(n/4) + O(1) = O(\log n)$: about 26 levels for $n = 10^{15}$. This is the same pattern as exponentiation by squaring: one recursive call on a constant fraction of the input, plus a constant-time fix-up.`,
    },
    {
      id: 'recursion-mock1-shortanswer', type: 'written', title: 'Short answer: five recurrences', difficulty: 3,
      tags: ['mt2-mock-1', 'recurrences', 'short-answer'],
      prompt: String.raw`Give an asymptotically tight ($\Theta$) solution to each recurrence, with a brief justification: Master-theorem parameters and case, recursion-tree level sums, unrolling, or a substitution. Assume $T(n) = \Theta(1)$ for n below some constant. No proofs are required.

(a) $T(n) = 5T(n/4) + n\sqrt n$

(b) $T(n) = 2T(n/3) + T(n/4) + n$

(c) $T(n) = 2T(\sqrt n) + \lg^2 n$

(d) $T(n) = 3T(n-2) + 1$

(e) Write a recurrence for the running time of Puzzle(n), and solve it.
~~~pseudo
Puzzle(n):
    if n <= 1: return 0
    s = 0
    for i = 1 to n:
        j = 1
        while j < i:
            j = 2 * j
            s = s + 1
    t = Puzzle(n/2)
    return s + t + t + Puzzle(n/2) + Puzzle(n/2)
~~~`,
      rubric: [
        String.raw`(2 pts) (a) $\Theta(n^{3/2})$: $n^{\log_4 5} \approx n^{1.16}$ is polynomially smaller than $n^{1.5}$, and regularity holds since $5(n/4)^{3/2} = \frac58 n^{3/2}$`,
        String.raw`(2 pts) (b) $\Theta(n)$: the children cost $\frac23 + \frac14 = \frac{11}{12}$ of the parent, so the level sums decrease`,
        String.raw`(2 pts) (c) $\Theta(\log^2 n)$: $m = \lg n$ gives $S(m) = 2S(m/2) + m^2$, which is root-dominated`,
        String.raw`(2 pts) (d) $\Theta(3^{n/2}) = \Theta(\sqrt3^{\,n})$, not $\Theta(3^n)$, because the depth is n/2`,
        String.raw`(2 pts) (e) $T(n) = 3T(n/2) + \Theta(n\log n)$ (three executed calls; the inner loop runs $\lceil\lg i\rceil$ times), solved as $\Theta(n^{\lg 3})$`,
      ],
      hints: ['Before applying any theorem, compute either the critical exponent log_b a or the total fraction of the input passed to the children.', 'In (e), count only executed calls: t is computed once but used twice, and the other two calls each run.', 'In (d), how deep is the recursion when n drops by 2 at each step?'],
      solution: String.raw`**(a)** a = 5, b = 4, and $\log_4 5 = \lg 5/2 \approx 1.16$. Since $f(n) = n^{1.5}$ is polynomially larger than $n^{1.16}$, and regularity holds ($5f(n/4) = 5n^{1.5}/8 = \frac58 f(n)$), this is case 3. The level sums $(5/8)^i n^{3/2}$ decrease, so $T(n) = \Theta(n^{3/2})$.

**(b)** This is not Master-theorem form, because it has two subproblem sizes. A node of cost m has children of total cost $\frac{2m}{3} + \frac m4 = \frac{11}{12}m$, so level i costs at most $(11/12)^i n$, and $T(n) \le 12n$. (By induction: $c\cdot\frac{2n}3 + c\cdot\frac n4 + n \le cn$ exactly when $c \ge 12$.) The root gives $T(n) \ge n$, so $T(n) = \Theta(n)$.

**(c)** Let $m = \lg n$ and $S(m) = T(2^m)$. Since $\sqrt n = 2^{m/2}$, we get $S(m) = 2S(m/2) + m^2$. Here $m^{\log_2 2} = m$ is polynomially smaller than $m^2$, and $2(m/2)^2 = m^2/2$, so case 3 gives $S(m) = \Theta(m^2)$. Therefore $T(n) = \Theta(\log^2 n)$. Equivalently, the level sums $\lg^2 n,\ \frac12\lg^2 n,\ \frac14\lg^2 n, \dots$ decrease geometrically.

**(d)** Unroll: $T(n) = 3T(n-2) + 1 = 9T(n-4) + 3 + 1 = \dots = 3^kT(n-2k) + \frac{3^k - 1}2$. The base case is reached at $k \approx n/2$, so $T(n) = \Theta(3^{n/2}) = \Theta((\sqrt3)^n) \approx \Theta(1.732^n)$. This is *not* $\Theta(3^n)$: the ratio $3^n/3^{n/2} = 3^{n/2}$ is unbounded.

**(e)** *Non-recursive work.* For each i, the while loop doubles j from 1 until $j \ge i$, so it runs $\lceil\lg i\rceil$ times. In total that is $\sum_{i=1}^n\lceil\lg i\rceil$, which is between $\frac n2\lg\frac n2$ (from the top half of the terms) and $n\lg n + n$. So the work is $\Theta(n\log n)$.
*Recursive calls.* t = Puzzle(n/2) is computed once and then used twice, which is one call. The return line makes two more calls. So three calls of size n/2 are executed:
$$T(n) = 3T(n/2) + \Theta(n\log n), \qquad T(1) = \Theta(1).$$
*Solve.* $n^{\log_2 3} \approx n^{1.585}$, and $n\lg n = O(n^{1.5}) = O(n^{\lg 3 - \varepsilon})$ with $\varepsilon \approx 0.08$, so case 1 applies: the leaves dominate and $T(n) = \Theta(n^{\lg 3})$. (In the tree, level i costs about $(3/2)^i n\lg(n/2^i)$, which increases toward the leaves.) Writing $5T(n/2)$ by counting the name Puzzle in the return line, or $2T(n/2)$ by forgetting the call that computes t, are the two classic errors.`,
    },
    {
      id: 'recursion-mock3-shortanswer', type: 'written', title: 'Short answer: growth rates, a recursion tree, and code', difficulty: 3,
      tags: ['mt2-mock-3', 'recurrences', 'short-answer', 'asymptotics'],
      prompt: String.raw`Answer each part with a brief justification.

(a) Sort these functions from slowest-growing to fastest-growing, marking any pairs that are $\Theta$ of each other:
$$n^{1/\lg n},\quad \lg^3 n,\quad 2^{\sqrt{\lg n}},\quad \sqrt n\,\lg n,\quad 3^{\lg n},\quad n^{\lg 3},\quad n^2/\lg n,\quad (\lg n)^{\lg n},\quad 1.01^n,\quad \tbinom{n}{\lfloor n/2\rfloor}.$$

(b) Use a recursion tree to solve $T(n) = 9T(n/3) + n^2\lg n$. Give the number of nodes at level i, the cost of each node at level i, the level sum, the depth, and the final $\Theta$ bound.

(c) Solve $T(n) = T(\sqrt n) + \lg\lg n$.

(d) Solve $T(n) = 4T(n-1) + 2^n$, with $T(0) = 1$.

(e) Give the worst-case and best-case running times of Shrink, with a recurrence for each and an input that achieves the worst case.
~~~pseudo
Shrink(A[1..n]):
    if n <= 1: return
    B = copy of A[1..floor(n/2)]          // Theta(n) time
    if A[1] < A[n]:
        Shrink(B)
    else:
        Shrink(B); Shrink(B)
~~~`,
      rubric: [
        String.raw`(2 pts) (a) The correct order, with the tie $3^{\lg n} = n^{\lg 3}$, and $n^{1/\lg n} = 2$ recognized as a constant`,
        String.raw`(2 pts) (b) The correct level sum $n^2(\lg n - i\lg 3)$, depth $\log_3 n$, and total $\Theta(n^2\log^2 n)$`,
        String.raw`(2 pts) (c) $\Theta((\log\log n)^2)$, via a double substitution or the arithmetic level sums`,
        String.raw`(2 pts) (d) $\Theta(4^n)$: dividing by $4^n$ leaves a convergent series`,
        String.raw`(2 pts) (e) Worst case $2T(n/2) + \Theta(n) = \Theta(n\log n)$ on a decreasing array; best case $T(n/2) + \Theta(n) = \Theta(n)$`,
      ],
      hints: [String.raw`For (a), rewrite each function as $2^{(\text{something})}$ and compare the exponents.`, String.raw`For (c), the argument at depth i is $n^{1/2^i}$. What is $\lg\lg$ of that?`, String.raw`For (e), which inputs make the else-branch run at every level? Note that B is a prefix of A.`],
      solution: String.raw`**(a)**
$$n^{1/\lg n} \ll \lg^3 n \ll 2^{\sqrt{\lg n}} \ll \sqrt n\lg n \ll 3^{\lg n} \equiv n^{\lg 3} \ll n^2/\lg n \ll (\lg n)^{\lg n} \ll 1.01^n \ll \tbinom{n}{\lfloor n/2\rfloor}.$$
The exponents of 2 are, in order: 1 (since $n^{1/\lg n} = 2$); $3\lg\lg n$; $\sqrt{\lg n}$; $\frac12\lg n + \lg\lg n$; $\lg 3\cdot\lg n$ for both $3^{\lg n} = n^{\lg 3}$; $2\lg n - \lg\lg n$; $\lg n\lg\lg n$; about $0.0144\,n$; and $n - \frac12\lg n + O(1)$, because $\binom{n}{n/2} = \Theta(2^n/\sqrt n)$. Each exponent minus the previous one tends to infinity. For example, $\sqrt{\lg n} - 3\lg\lg n \to \infty$, since $\sqrt x$ beats $3\lg x$.

**(b)** Level i has $9^i$ nodes of size $n/3^i$. Each costs $\big(\frac{n}{3^i}\big)^2\lg\frac{n}{3^i} = \frac{n^2}{9^i}(\lg n - i\lg 3)$, so the level sum is $n^2(\lg n - i\lg 3) = n^2\lg 3\,(L - i)$, where $L = \log_3 n$ is the depth. The sums decrease only arithmetically, so add them:
$$\sum_{i=0}^{L-1} n^2\lg 3\,(L - i) = n^2\lg 3\cdot\frac{L(L+1)}2 = \Theta(n^2\log^2 n).$$
The $9^L = n^2$ leaves add only $\Theta(n^2)$. So $T(n) = \Theta(n^2\log^2 n)$ (extended Master case 2 with k = 1).

**(c)** The argument at depth i is $n^{1/2^i}$, and $\lg\lg(n^{1/2^i}) = \lg\lg n - i$. So the costs along the path are $\lg\lg n, \lg\lg n - 1, \dots, 1$, an arithmetic series of $\lg\lg n$ terms: $T(n) = \Theta((\log\log n)^2)$. Equivalently, set $m = \lg n$, so $S(m) = S(m/2) + \lg m$; then set $p = \lg m$, so $R(p) = R(p-1) + p = \Theta(p^2)$.

**(d)** Divide by $4^n$: $U(n) = T(n)/4^n$ satisfies $U(n) = U(n-1) + 2^{-n}$, so $U(n) = 1 + \sum_{k=1}^n 2^{-k} < 2$. Hence $T(n) = \Theta(4^n)$. The four-way branching wins, because the work $2^n$ shrinks relative to $4^n$. (Compare: $2T(n-1) + 2^n = \Theta(n2^n)$, and $T(n-1) + 2^n = \Theta(2^n)$.)

**(e)** Every call copies half of its input in $\Theta(n)$ time, then makes one or two calls on n/2 elements.
- *Worst case:* $T(n) = 2T(n/2) + \Theta(n) = \Theta(n\log n)$. A strictly decreasing array achieves it: every prefix of a decreasing array is decreasing, so $A[1] > A[n]$ in every call with $n \ge 2$, and the else-branch runs at every level.
- *Best case:* $T(n) = T(n/2) + \Theta(n) = \Theta(n)$, for an increasing array.
Worst-case analysis must take the more expensive branch, and you should check that some input really forces it at every level. It does here, because B is a prefix of A.`,
    },
  ],
});
