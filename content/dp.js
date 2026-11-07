CS374.topic({
  id: 'dp',
  unit: 'algorithms',
  order: 13,
  title: 'Dynamic Programming I',
  summary: 'Turn a backtracking recursion with few distinct subproblems into an efficient algorithm by memoizing or filling a table: Fibonacci, text segmentation, LIS, edit distance, LCS, subset sum and palindromic subsequences — written up in the five-part format the course grades.',
  objectives: [
    'Explain why memoization turns exponential recursions into polynomial algorithms, and compare top-down memoization with bottom-up iteration',
    'Write a complete DP solution in the 5-part format: English specification, recurrence with base cases, memo structure, evaluation order, time and space',
    'Solve the classic problems: text segmentation, LIS, edit distance, LCS, subset sum, longest palindromic subsequence',
    'Choose a correct evaluation order from the dependency structure of a recurrence',
    'Recognize pseudo-polynomial running times and common DP mistakes',
  ],
  lesson: String.raw`## Dynamic programming is smart recursion

Dynamic programming (DP) is **not** about filling in tables. It is about finding a recursive (backtracking) algorithm whose subproblems **repeat**, and then solving each distinct subproblem **only once**. The table is just the place where the answers live.

> **Key idea.** DP = backtracking recursion + memoization. First get a correct recursion with a *small* number of distinct subproblems (typically indexed by one, two or three integers). Then store each subproblem's answer so it is computed once. Running time ≈ (number of distinct subproblems) × (time to evaluate one, given the answers it depends on).

## Fibonacci: the canonical example

$F_0 = 0$, $F_1 = 1$, $F_n = F_{n-1} + F_{n-2}$. The direct recursion

~~~pseudo
RecFib(n):
    if n < 2: return n
    return RecFib(n-1) + RecFib(n-2)
~~~

makes $C(n) = 1 + C(n-1) + C(n-2)$ calls ($C(0) = C(1) = 1$), so $C(n) = 2F_{n+1} - 1 = \Theta(\phi^n)$ with $\phi = (1+\sqrt 5)/2 \approx 1.618$. It is exponential because it recomputes the same values: RecFib(n−2) is computed twice, RecFib(n−3) three times, RecFib(n−k) $F_{k+1}$ times. There are only n + 1 distinct subproblems.

**Memoization (top-down):** keep the recursion, but remember answers.

~~~pseudo
MemFib(n):
    if n < 2: return n
    if F[n] is undefined:
        F[n] = MemFib(n-1) + MemFib(n-2)
    return F[n]
~~~

**Iteration (bottom-up):** fill the array in an order where dependencies are already filled.

~~~pseudo
IterFib(n):
    F[0] = 0; F[1] = 1
    for i = 2 to n:
        F[i] = F[i-1] + F[i-2]
    return F[n]
~~~

Both use O(n) additions. Since each F[i] depends only on the previous two, we can keep just two variables: O(1) space. (The numbers themselves have $\Theta(n)$ bits; in this course we count arithmetic operations as O(1) unless told otherwise.)

### Memoization vs. iteration

| | Top-down memoization | Bottom-up iteration |
|---|---|---|
| Code | the recursion plus a lookup | explicit loops |
| Evaluation order | automatic | you must choose one consistent with dependencies |
| Solves | only subproblems actually reached | every subproblem in the table |
| Overhead | recursion stack (can overflow for deep recursions) | none |
| Space optimizations | hard | easy (keep only the rows you need) |

Asymptotically they are the same in almost all CS 374 problems. Course solutions present the **iterative** version, because stating the evaluation order forces you to check that the dependencies make sense (the dependency graph of subproblems must be a DAG, and the evaluation order is a topological order of it).

## The five-part DP solution format

On homework and exams, a DP solution must include all of these. Missing the English specification is the most common way to lose most of the credit.

1. **Specification (in English).** Define the recursive function: what does it return, in terms of its parameters? E.g. "*LISfirst(i) is the length of the longest increasing subsequence of A[i..n] that starts with A[i].*" Also say **how to get the final answer** from it (e.g. "we need LISfirst(0)").
2. **Recurrence with base cases.** A recursive formula for the function, covering every case. A short justification ("either A[i] is in the optimal solution or not...") is expected.
3. **Memoization data structure.** "We store LISfirst(i) in an array LISfirst[0..n]."
4. **Evaluation order.** An order in which every entry's dependencies are filled first. "Each LISfirst[i] depends on LISfirst[j] for j > i, so we fill i from n down to 0."
5. **Time and space.** Usually (number of entries) × (time per entry) and (number of entries).

> **Exam tip.** Write the English specification **first**, before the recurrence. If you can't say what your function means, your recurrence is almost certainly wrong. Also: the specification must describe *what* is computed, not *how* ("the length of the longest ..." not "the maximum over j of ...").

Optionally, give the pseudocode for the iterative algorithm — it's a direct translation of parts 2–4.

Here is a template you can copy onto scratch paper at the start of every DP question:

~~~pseudo
1. Spec:       For <index ranges>, let F(<params>) = <the best/number/whether ...>
               of <the subproblem described in words>.  We want F(<initial params>).
2. Recurrence: F(...) = <base case(s)>                      if <boundary>
                        max / min / OR / sum over <choices> otherwise
               (one sentence per case: why these choices cover every solution)
3. Memo:       F[<range>][<range>] ...
4. Order:      F(...) depends on F(...) with <larger i / shorter interval / ...>,
               so fill <loops in this order>.
5. Time:       <#entries> x <work per entry> = O(...);  space O(...).
~~~

## Walkthrough: from backtracking to a table

The fastest way to get a DP right is to *derive* it from a backtracking algorithm instead of guessing a table. Here is the whole pipeline on a warm-up problem.

~~~~steps Maximum-sum non-adjacent selection: backtracking → recurrence → table → solution
**The problem.** Given nonnegative numbers A[1..n] (say, the amount of money in n houses along a street), choose a set of positions with **no two adjacent** positions chosen, maximizing the total. Example: A = [6, 1, 2, 7, 3, 4].

Greedy ideas fail: on [5, 6, 5], "take the largest available value" takes 6 and is stuck at 6, while 5 + 5 = 10. Instead of guessing, ask what happens to **the first element**.
+++
**Backtracking.** Either A[1] is not chosen — then the rest is the same problem on A[2..n] — or A[1] is chosen — then A[2] must not be chosen and the rest is the same problem on A[3..n]. Generalizing from 1 to i:

~~~pseudo
MaxNA(i):                      // best total using only A[i..n]
    if i > n: return 0
    skip = MaxNA(i + 1)
    take = A[i] + MaxNA(i + 2)
    return max(skip, take)
~~~

The answer is MaxNA(1).
+++
**Why it's slow, and why that's good news.** The running time satisfies $T(n) = T(n-1) + T(n-2) + O(1)$ — the Fibonacci recurrence, so $T(n) = \Theta(\phi^n)$. But the only thing that changes between calls is the integer i, which lies in $\{1, \dots, n+2\}$. There are only $n + 2$ distinct subproblems, each recomputed exponentially often. That is the signature of a DP.
+++
**Write the five parts.**
1. **Spec.** For $1 \le i \le n+2$, MaxNA(i) = the maximum total of a set of pairwise non-adjacent positions in A[i..n] (0 if $i > n$). Answer MaxNA(1).
2. **Recurrence.** $\text{MaxNA}(i) = 0$ for $i > n$; otherwise $\text{MaxNA}(i) = \max\{\text{MaxNA}(i+1),\ A[i] + \text{MaxNA}(i+2)\}$.
3. **Memo.** Array M[1..n+2].
4. **Order.** M[i] reads M[i+1] and M[i+2]: fill i from n + 2 down to 1.
5. **Time/space.** n + 2 entries, O(1) each: O(n) time and O(n) space (O(1) with two variables).
+++
**Fill the table** for A = [6, 1, 2, 7, 3, 4], right to left:

| i | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|---|---|
| A[i] | – | – | 4 | 3 | 7 | 2 | 1 | 6 |
| skip = M[i+1] | – | – | 0 | 4 | 4 | 11 | 11 | 12 |
| take = A[i] + M[i+2] | – | – | 4 | 3 | 11 | 6 | 12 | 17 |
| M[i] | 0 | 0 | **4** | **4** | **11** | **11** | **12** | **17** |

The answer is M[1] = 17.
+++
**Reconstruct the choice.** Walk forward from i = 1, repeating the comparison that produced each entry:
- i = 1: take (17) beats skip (12): choose A[1] = 6, jump to i = 3.
- i = 3: skip (11) beats take (6): move to i = 4.
- i = 4: take (11) beats skip (4): choose A[4] = 7, jump to i = 6.
- i = 6: take (4) beats skip (0): choose A[6] = 4, jump to i = 8 > n: stop.

Chosen positions {1, 4, 6}: 6 + 7 + 4 = 17. ✓ Reconstruction costs only O(n) extra time because we recompute each decision from the stored table.
~~~~

## Example: text segmentation

From backtracking: Splittable(i) is True iff the suffix A[i..n] can be split into words.

1. **Spec.** Splittable(i) = True iff A[i..n] can be partitioned into words. Answer: Splittable(1).
2. **Recurrence.**
$$\text{Splittable}(i) = \begin{cases}\text{True} & i > n\\ \bigvee_{j=i}^{n}\big(\text{IsWord}(i, j) \wedge \text{Splittable}(j+1)\big) & \text{otherwise}\end{cases}$$
3. **Memo.** Boolean array SplitTable[1..n+1].
4. **Order.** Entry i depends on entries j + 1 > i: fill i from n + 1 down to 1.
5. **Time.** n + 1 entries, each O(n) calls to IsWord: $O(n^2)$ IsWord calls and $O(n)$ space.

~~~pseudo
Splittable(A[1..n]):
    SplitTable[n+1] = True
    for i = n down to 1:
        SplitTable[i] = False
        for j = i to n:
            if IsWord(i, j) and SplitTable[j+1]:
                SplitTable[i] = True
    return SplitTable[1]
~~~

## Example: longest increasing subsequence in $O(n^2)$

Using the "jump" formulation with a sentinel $A[0] = -\infty$:

1. **Spec.** For $0 \le i \le n$, LISfirst(i) = length of the longest increasing subsequence of A[i..n] that starts with A[i]. Answer: LISfirst(0) − 1 (subtract the sentinel).
2. **Recurrence.** $\text{LISfirst}(i) = 1 + \max\{\text{LISfirst}(j) : i < j \le n,\ A[j] > A[i]\}$, with $\max\emptyset = 0$. (Base case: LISfirst(n) = 1, covered by the empty max.)
3. **Memo.** Array LISfirst[0..n].
4. **Order.** i from n down to 0.
5. **Time.** n + 1 entries × O(n) each = $O(n^2)$ time, O(n) space.

~~~pseudo
LIS(A[1..n]):
    A[0] = -infinity
    for i = n down to 0:
        best = 0
        for j = i+1 to n:
            if A[j] > A[i] and LISfirst[j] > best: best = LISfirst[j]
        LISfirst[i] = 1 + best
    return LISfirst[0] - 1
~~~

To **reconstruct** the subsequence, record for each i the j achieving the max (a "next" pointer) and follow the pointers from 0. (An $O(n\log n)$ algorithm exists using binary search, but the $O(n^2)$ DP is what you should be able to derive.)

## Example: edit distance

The **edit distance** between strings A[1..m] and B[1..n] is the minimum number of single-character insertions, deletions and substitutions that transform A into B. Think of an optimal **alignment**: write A above B with gaps; each column is a match (free), a substitution (cost 1), an insertion or a deletion (cost 1). Look at the **last column**: it is one of

- A[m] above a gap (delete A[m]),
- a gap above B[n] (insert B[n]),
- A[m] above B[n] (free if equal, else a substitution).

Removing the last column leaves an optimal alignment of shorter prefixes. So:

1. **Spec.** Edit(i, j) = edit distance between the prefixes A[1..i] and B[1..j]. Answer: Edit(m, n).
2. **Recurrence.**
$$\text{Edit}(i,j) = \begin{cases} j & i = 0 \\ i & j = 0 \\ \min\left\{\begin{array}{l}\text{Edit}(i-1, j) + 1\\ \text{Edit}(i, j-1) + 1\\ \text{Edit}(i-1, j-1) + [A[i] \ne B[j]]\end{array}\right\} & \text{otherwise}\end{cases}$$
3. **Memo.** 2D array Edit[0..m][0..n].
4. **Order.** Each entry depends on the entries above, to the left, and diagonally up-left. Fill row by row (i from 0 to m), each row left to right.
5. **Time.** $(m+1)(n+1)$ entries, O(1) each: $O(mn)$ time and space. (Space can be reduced to $O(\min(m,n))$ by keeping two rows if only the distance is needed.)

**Worked table:** A = FOOD (rows), B = MONEY (columns).

| A \ B | ε | M | O | N | E | Y |
|---|---|---|---|---|---|---|
| ε | 0 | 1 | 2 | 3 | 4 | 5 |
| F | 1 | 1 | 2 | 3 | 4 | 5 |
| O | 2 | 2 | 1 | 2 | 3 | 4 |
| O | 3 | 3 | 2 | 2 | 3 | 4 |
| D | 4 | 4 | 3 | 3 | 3 | 4 |

The edit distance is 4. Tracing back from the bottom-right corner along choices that achieved the minimum gives an optimal alignment:

~~~pseudo
F O O - D
M O N E Y
s . s i s        (s = substitute, i = insert, . = match)  -> 4 operations
~~~

## Example: longest common subsequence

1. **Spec.** LCS(i, j) = length of the longest common subsequence of the suffixes A[i..m] and B[j..n]. Answer: LCS(1, 1).
2. **Recurrence.**
$$\text{LCS}(i,j) = \begin{cases} 0 & i > m \text{ or } j > n\\ 1 + \text{LCS}(i+1, j+1) & A[i] = B[j]\\ \max\{\text{LCS}(i+1, j), \text{LCS}(i, j+1)\} & \text{otherwise}\end{cases}$$
(Matching equal first characters is always safe — see the backtracking lesson.)
3. **Memo.** LCS[1..m+1][1..n+1].
4. **Order.** Entry (i, j) depends on (i+1, j), (i, j+1), (i+1, j+1): fill i from m+1 down to 1, and within each row j from n+1 down to 1.
5. **Time.** $O(mn)$ time and space.

Example: LCS(ABCBDAB, BDCABA) = 4 (e.g. BCBA). Note the close relationship with edit distance: if only insertions and deletions are allowed, the distance is $m + n - 2\cdot\text{LCS}$.

The same problem can be written on **prefixes** instead of suffixes: L(i, j) = LCS of A[1..i] and B[1..j], with L(i, j) = L(i−1, j−1) + 1 if A[i] = B[j] and max{L(i−1, j), L(i, j−1)} otherwise, filled row by row. Both are correct; pick whichever makes your English spec easiest to state. (The DP Table Lab at [#/lab/dp](#/lab/dp) animates the prefix version and the traceback.)

~~~~steps Filling an LCS table by hand, then reconstructing the subsequence
**Setup.** A = BACB (rows), B = ABCB (columns), prefix version. Row 0 and column 0 are all 0 (an empty prefix has only the empty common subsequence). Each other cell looks at three neighbours: **diagonal** (up-left) when the row and column letters match, otherwise the larger of **up** and **left**.
+++
**Row 1 (A[1] = B).** Column A: B ≠ A, max(up 0, left 0) = 0. Column B: match, diagonal 0 + 1 = 1. Column C: no match, max(up 0, left 1) = 1. Column B: match, diagonal L(0, 3) + 1 = 1.

| | ε | A | B | C | B |
|---|---|---|---|---|---|
| ε | 0 | 0 | 0 | 0 | 0 |
| B | 0 | 0 | 1 | 1 | 1 |
+++
**Row 2 (A[2] = A).** Column A: match, diagonal 0 + 1 = 1. Then no more A's in B: every remaining cell is max(up, left) = 1.

**Row 3 (A[3] = C).** Columns A, B: max(up, left) = 1. Column C: match, diagonal L(2, 2) + 1 = 2. Column B: max(up 1, left 2) = 2.
+++
**Row 4 (A[4] = B).** Column A: 1. Column B: match, diagonal L(3, 1) + 1 = 2. Column C: max(up 2, left 2) = 2. Column B: match, diagonal L(3, 3) + 1 = **3**.

| | ε | A | B | C | B |
|---|---|---|---|---|---|
| ε | 0 | 0 | 0 | 0 | 0 |
| B | 0 | 0 | 1 | 1 | 1 |
| A | 0 | 1 | 1 | 1 | 1 |
| C | 0 | 1 | 1 | 2 | 2 |
| B | 0 | 1 | 2 | 2 | 3 |

So LCS(BACB, ABCB) = 3.
+++
**Traceback.** Start at the bottom-right cell (4, 4) and walk back to row or column 0:
- (4, 4): B = B and the value came from the diagonal: output **B**, go to (3, 3).
- (3, 3): C = C, diagonal: output **C**, go to (2, 2).
- (2, 2): A ≠ B. Up (1, 2) and left (2, 1) both hold 1, so either is fine; go up to (1, 2).
- (1, 2): B = B, diagonal: output **B**, go to (0, 1). Stop.

Reading the outputs in reverse gives **BCB**. Going left at (2, 2) instead would give ACB — ties mean several optimal answers. The traceback takes O(m + n) steps, but it needs the whole table (or Hirschberg's trick, see DP II).
~~~~

## Example: subset sum and pseudo-polynomial time

1. **Spec.** SS(i, t) = True iff some subset of X[i..n] sums to exactly t, for $1 \le i \le n+1$ and $0 \le t \le T$. Answer: SS(1, T).
2. **Recurrence.**
$$\text{SS}(i, t) = \begin{cases}\text{True} & t = 0\\ \text{False} & i > n \text{ and } t > 0\\ \text{SS}(i+1, t) & X[i] > t \\ \text{SS}(i+1, t) \vee \text{SS}(i+1, t - X[i]) & \text{otherwise}\end{cases}$$
(The case $X[i] > t$ replaces the "t < 0" check so that all indices stay in the table.)
3. **Memo.** Boolean array SS[1..n+1][0..T].
4. **Order.** Row i depends only on row i + 1: fill i from n + 1 down to 1 (any order of t within a row).
5. **Time.** $O(nT)$ time and space.

> **Warning.** $O(nT)$ is **not** polynomial in the input size: T is written with about $\lg T$ bits, so $nT$ can be exponential in the length of the input. This is a **pseudo-polynomial** algorithm. Subset sum is NP-hard; this DP is efficient only when T is small.

### A target-indexed table: fewest coins

When items can be reused, the "index into the item list" can disappear and only the remaining target matters. MinCoins(t) = the fewest coins (unlimited supply of denominations $d_1, \dots, d_k$) with total exactly t; MinCoins(0) = 0 and $\text{MinCoins}(t) = 1 + \min\{\text{MinCoins}(t - d_i) : d_i \le t\}$, with $\min\emptyset = \infty$. Time $O(kT)$, again pseudo-polynomial.

~~~~steps Fewest coins for T = 8 with denominations {1, 4, 5}
**Greedy first.** "Always take the largest coin that fits" gives 5 + 1 + 1 + 1: four coins. We'll see the DP find two.

Fill t = 0, 1, 2, … in increasing order: entry t reads entries $t - 1$, $t - 4$, $t - 5$ (when they exist).
+++
- t = 0: 0 (base case).
- t = 1, 2, 3: only coin 1 fits: 1, 2, 3.
- t = 4: min(1 + M[3], 1 + M[0]) = min(4, **1**) — one coin of 4.
- t = 5: min(1 + M[4], 1 + M[1], 1 + M[0]) = min(2, 2, **1**) — one coin of 5.
+++
- t = 6: min(1 + M[5], 1 + M[2], 1 + M[1]) = min(2, 3, 2) = **2**.
- t = 7: min(1 + M[6], 1 + M[3], 1 + M[2]) = min(3, 4, 3) = **3**.
- t = 8: min(1 + M[7], 1 + M[4], 1 + M[3]) = min(4, **2**, 4) = **2**, achieved by the coin 4.

| t | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| M[t] | 0 | 1 | 2 | 3 | 1 | 1 | 2 | 3 | 2 |
| best last coin | – | 1 | 1 | 1 | 4 | 5 | 1 or 5 | 1 or 5 | 4 |
+++
**Reconstruct.** From t = 8 the best last coin is 4, leaving t = 4, whose best last coin is 4, leaving t = 0. The optimal multiset is {4, 4}. In general: store (or recompute) the argmin at each t, then repeatedly subtract it — O(answer) extra time.
~~~~

## Example: longest palindromic subsequence (interval DP)

A palindrome reads the same forwards and backwards. Find the length of the longest palindromic subsequence of A[1..n]. Subproblems are **intervals** A[i..j]:

1. **Spec.** LPS(i, j) = length of the longest palindromic subsequence of A[i..j]. Answer: LPS(1, n).
2. **Recurrence.**
$$\text{LPS}(i,j) = \begin{cases} 0 & i > j\\ 1 & i = j\\ 2 + \text{LPS}(i+1, j-1) & i < j,\ A[i] = A[j]\\ \max\{\text{LPS}(i+1, j), \text{LPS}(i, j-1)\} & i < j,\ A[i] \ne A[j]\end{cases}$$
If the end characters differ, they can't both be used (they'd have to pair with each other). If they are equal, pairing them is safe (exchange argument).
3. **Memo.** LPS[1..n+1][0..n] (the extra row/column hold the empty intervals).
4. **Order.** (i, j) depends on (i+1, j−1), (i+1, j), (i, j−1) — shorter intervals. Fill i from n down to 1, and for each i, j from i up to n. (Or by increasing length j − i.)
5. **Time.** $O(n^2)$ entries, O(1) each: $O(n^2)$ time and space.

Example: BBABCBCAB has the palindromic subsequence BABCBAB of length 7, which is optimal. Corollary: the fewest characters to *insert* to make a string a palindrome is $n - \text{LPS}(1, n)$.

## Choosing an evaluation order

Draw each entry's dependencies as arrows:

| Recurrence depends on | Valid order |
|---|---|
| larger indices (suffixes): $f(i+1)$, $f(j)$ for $j > i$ | i decreasing |
| smaller indices (prefixes): $f(i-1, j)$, $f(i, j-1)$, $f(i-1, j-1)$ | row-major, increasing i and j |
| shorter intervals: $f(i+1, j)$, $f(i, j-1)$ | i decreasing and j increasing, or by length |
| previous row only: $f(i+1, \cdot)$ | row by row; any order inside a row |

## How to find the right subproblem

Almost every difficulty in DP is choosing the subproblem. The recipe is always the same: **imagine the first (or last) decision of a solution, make it, and describe what is left.** If what is left is "the same kind of problem on a smaller piece of the input", the description of that piece is your subproblem. If what is left also depends on something about the decisions you made, add that something as a parameter. Below are the shapes that cover nearly all CS 374 sequence problems.

### Shape 1: a prefix or a suffix (one index)

Use it when decisions are made left to right and **nothing about earlier decisions constrains later ones** except where you are. After deciding how the first piece looks, the rest is "the same problem on A[j..n]".

- Splittable(i), fewest words, number of segmentations: the first word is A[i..j]; recurse on A[j+1..n].
- Maximum non-adjacent sum: take A[i] (recurse on i + 2) or skip it (recurse on i + 1).
- Fewest coins MinCoins(t): here the "suffix" is the remaining amount.

### Shape 2: one index, *anchored* ("starts at i" or "ends at i")

Use it when consecutive chosen elements must be compatible with each other (increasing, alternating, differences bounded...). Then the rest of the solution depends on **the last element chosen**, so make the subproblem *start with* A[i] (or *end with* A[i]) and loop over the next chosen index j. The answer is a max over all anchors (or use a sentinel).

- LISfirst(i), longest alternating subsequence (two anchored functions, Up and Down), maximum subarray MaxEnd(i).
- Typical cost: n entries × O(n) choices of j = $O(n^2)$.

### Shape 3: two indices into two sequences

Use it when the input is two strings and the solution "walks" through both: alignment, common subsequences, interleavings. Subproblem = (prefix of A, prefix of B) or (suffix, suffix); look at the last (or first) characters and list the possible "columns".

- Edit distance, LCS, shortest common supersequence, shuffles, longest common substring (anchored on both: "common suffix ending exactly at i and j").

### Shape 4: two indices into one sequence

Three different meanings, all $O(n^2)$ subproblems:
- **Intervals A[i..j]** when a solution peels off both ends or splits the interval in the middle: palindromic subsequences and substrings, interval DPs in DP II.
- **The last two chosen elements** (i, j) when the constraint involves *two* previous elements: convex subsequences ("differences increase"), Fibonacci-like subsequences.
- **(previous chosen, current position)** as in the backtracking LISbigger(i, j).

### Shape 5: add an extra state variable

When the subproblem "the rest of the input" is not enough, ask: **what must the rest of the computation know about what I already did?** Add exactly that as a small parameter.

| The rest needs to know... | Extra parameter | Example |
|---|---|---|
| how much budget is left | k = operations remaining | at most k drops, at most k transactions, at most k deletions |
| the direction of the last step | a flag up/down | alternating subsequences |
| whether something is "open" | a flag | holding a stock or not |
| a short history | a small counter | number of trailing 1s (no 111 strings) |
| a remaining numeric target | t | subset sum, coins (pseudo-polynomial!) |

The table size multiplies: n positions × (k + 1) budgets × 2 flags, etc. That's fine as long as every parameter ranges over a polynomial (or explicitly pseudo-polynomial) set.

### Shape 6 (DP II): a vertex of a tree or DAG

Subtrees and DAG vertices play the role of suffixes. See the next topic.

> **Key idea.** A good subproblem passes four tests: (1) you can define it in **one English sentence**; (2) the recurrence only calls the **same function** on **smaller** parameters; (3) the number of distinct parameter values is **polynomial**; (4) the final answer can be read off from it. If a parameter is a set, a sequence, or "the solution so far", test (3) fails — compress it to the one fact the future needs.

## Counting with DP

To count objects instead of optimizing, replace max/min by **sum** and OR by **sum**, and set base cases to 1 (one empty object) instead of 0. The one extra requirement: **the cases of the recurrence must partition the objects**, so each object is counted exactly once.

- Number of segmentations: Count(n+1) = 1, $\text{Count}(i) = \sum_{j : \text{IsWord}(i,j)} \text{Count}(j+1)$. Two different segmentations differ in their first word or in the rest, so nothing is double counted.
- Number of increasing subsequences: $\text{Cnt}(i) = 1 + \sum_{j>i,\ A[j] > A[i]} \text{Cnt}(j)$ (the 1 is the subsequence consisting of A[i] alone).

The classic trap is coins. With denominations {1, 2, 5} and T = 5:

- $\text{Seq}(t) = \sum_{d_i \le t}\text{Seq}(t - d_i)$, Seq(0) = 1, counts **ordered** sequences of coins: 1+2+2, 2+1+2 and 2+2+1 are three different objects. Seq(5) = 9.
- To count **multisets** (the usual meaning of "ways to make change"), force a canonical order by deciding the denominations one at a time: Ways(i, t) = number of multisets of coins from $d_i, \dots, d_k$ with total t, $\text{Ways}(i,t) = \text{Ways}(i+1, t) + \text{Ways}(i, t - d_i)$ ("use no more $d_i$'s" or "use one more"). Ways(1, 5) = 4: {5}, {2,2,1}, {2,1,1,1}, {1,1,1,1,1}.

Counts can be exponentially large (they have O(n) bits); CS 374 counts each addition as O(1) unless a problem says otherwise.

## Try it first: exam-style worked examples

Each problem below is stated first; try to write all five parts before opening the solution. Then compare part by part — exactly how a grader would.

**Example 1 (segmentation, three ways).** You are given A[1..n] and a subroutine IsWord(i, j). (a) Compute the fewest words in a segmentation of A into words ($\infty$ if none). (b) Count the segmentations. Run both on PENPINEAPPLE with dictionary {PEN, PINE, APPLE, PINEAPPLE, PENPINE, APP, LE}.

~~~reveal Solution: fewest words and number of segmentations
**(a)**
1. **Spec.** For $1 \le i \le n+1$, Fewest(i) = the minimum number of words in a segmentation of the suffix A[i..n] ($\infty$ if there is none). Answer: Fewest(1).
2. **Recurrence.** Fewest(n+1) = 0, and for $i \le n$: $\text{Fewest}(i) = \min\{1 + \text{Fewest}(j+1) : i \le j \le n,\ \text{IsWord}(i,j)\}$, with $\min\emptyset = \infty$. The first word of any segmentation of A[i..n] is some A[i..j]; the rest should use as few words as possible.
3. **Memo.** Array Fewest[1..n+1].
4. **Order.** Entry i reads entries j + 1 > i: i from n + 1 down to 1.
5. **Time.** n + 1 entries × O(n) IsWord calls = $O(n^2)$ time, O(n) space.

**(b)** Count(i) = the number of segmentations of A[i..n]. Count(n+1) = **1** (the empty suffix has exactly one segmentation: no words). $\text{Count}(i) = \sum_{i \le j \le n,\ \text{IsWord}(i,j)} \text{Count}(j+1)$ — segmentations are partitioned by their first word. Same table shape, order and $O(n^2)$ time.

**Example.** Words begin at positions 1 (PEN, PENPINE), 4 (PINE, PINEAPPLE), 8 (APPLE, APP) and 11 (LE). Count(13) = 1, Count(11) = 1, Count(8) = Count(13) + Count(11) = 2, Count(4) = Count(8) + Count(13) = 3, Count(1) = Count(4) + Count(8) = **5**. Fewest(1) = **2** (PEN + PINEAPPLE, or PENPINE + APPLE).

Base case Count(n+1) = 0 would make every count 0 — a common slip.
~~~

**Example 2 (substring vs subsequence).** Find the length of the longest **contiguous** palindromic substring of A[1..n]. (For BANANAS the answer is 5: ANANA.)

~~~reveal Solution: longest palindromic substring
1. **Spec.** For $1 \le i \le n+1$ and $i - 1 \le j \le n$, IsPal(i, j) = True iff A[i..j] is a palindrome (empty and one-letter strings are). Answer: $\max\{j - i + 1 : 1 \le i \le j \le n,\ \text{IsPal}(i,j)\}$ (0 if n = 0).
2. **Recurrence.** $\text{IsPal}(i,j) = \text{True}$ if $i \ge j$; otherwise $\text{IsPal}(i,j) = (A[i] = A[j]) \wedge \text{IsPal}(i+1, j-1)$. A string of length ≥ 2 is a palindrome iff its end letters agree and its middle is a palindrome.
3. **Memo.** Boolean array IsPal[1..n+1][0..n].
4. **Order.** (i, j) reads (i+1, j−1): i from n down to 1, and j from i up to n (or by increasing length). Keep a running max of j − i + 1 over True entries.
5. **Time.** $O(n^2)$ entries, O(1) each: $O(n^2)$ time and space.

Compare with the *subsequence* version: there we could drop an end letter (the max of two options); here a substring cannot skip letters, so the recurrence has no choices at all — it is a pure Boolean check. Expanding around each of the 2n − 1 possible centers also takes $O(n^2)$ time with O(1) space.
~~~

**Example 3 (anchoring).** Find the maximum sum of a nonempty contiguous subarray of A[1..n] (entries may be negative). Example: [−2, 1, −3, 4, −1, 2, 1, −5, 4] has answer 6.

~~~reveal Solution: maximum subarray as an anchored DP
The unanchored subproblem "best subarray of A[1..i]" doesn't lead to a recurrence: to know whether A[i+1] can extend it, we'd need to know whether that subarray ends at i. So anchor it.

1. **Spec.** For $1 \le i \le n$, MaxEnd(i) = the maximum sum of a nonempty subarray that **ends exactly at** position i. Answer: $\max_{1 \le i \le n}\text{MaxEnd}(i)$.
2. **Recurrence.** MaxEnd(1) = A[1]; for $i \ge 2$: $\text{MaxEnd}(i) = A[i] + \max\{0,\ \text{MaxEnd}(i-1)\}$. A subarray ending at i is either A[i] alone, or a subarray ending at i − 1 extended by A[i]; extend only if that helps.
3. **Memo.** Array MaxEnd[1..n] (or one running variable).
4. **Order.** i from 1 up to n.
5. **Time.** O(n) time, O(1) extra space with a running variable.

**Example.** MaxEnd = (−2, 1, −2, 4, 3, 5, 6, 1, 5); the maximum is **6**, for the subarray [4, −1, 2, 1]. (This is Kadane's algorithm.)
~~~

**Example 4 (an extra state variable).** How many binary strings of length n contain no three consecutive 1s? Give a DP and compute the value for n = 5.

~~~reveal Solution: counting with a "trailing ones" state
What does the rest of the string need to know about the bits written so far? Only how many 1s the string currently **ends** with (0, 1 or 2).

1. **Spec.** For $0 \le i \le n$ and $r \in \{0, 1, 2\}$, N(i, r) = the number of ways to write i more bits so that the whole string has no 111, given that the bits written so far end with exactly r consecutive 1s. Answer: N(n, 0).
2. **Recurrence.** N(0, r) = 1. For $i \ge 1$: $N(i, r) = N(i-1, 0) + [r < 2]\cdot N(i-1, r+1)$ — the next bit is 0 (resetting the run) or, if allowed, 1 (extending it).
3. **Memo.** Array N[0..n][0..2].
4. **Order.** i from 0 up to n; any order of r.
5. **Time.** 3(n + 1) entries, O(1) each: O(n).

| i | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| N(i, 0) | 1 | 2 | 4 | 7 | 13 | **24** |
| N(i, 1) | 1 | 2 | 3 | 6 | 11 | |
| N(i, 2) | 1 | 1 | 2 | 4 | 7 | |

So 24 of the 32 strings of length 5 avoid 111. Notice the three states are exactly the states of a DFA for "no 111": counting accepted strings of length n is a DP over (length, DFA state).
~~~

**Example 5 (custom costs).** Insertions and deletions cost 1 each and a substitution costs 2. Give a DP for the cheapest way to turn A[1..m] into B[1..n], and show that the answer equals $m + n - 2\cdot\text{LCS}(A, B)$.

~~~reveal Solution: weighted edit distance
1. **Spec.** For $0 \le i \le m$, $0 \le j \le n$: D(i, j) = the minimum cost of transforming A[1..i] into B[1..j]. Answer D(m, n).
2. **Recurrence.** D(i, 0) = i, D(0, j) = j, and otherwise
$$D(i,j) = \min\{D(i-1,j) + 1,\ D(i,j-1) + 1,\ D(i-1,j-1) + 2\cdot[A[i] \ne B[j]]\}.$$
Same last-column argument as ordinary edit distance; only the price of a substitution column changed.
3. **Memo.** D[0..m][0..n].
4. **Order.** Row-major (i increasing, j increasing).
5. **Time.** $O(mn)$ time and space.

**Why it equals m + n − 2 LCS.** A substitution column (cost 2) can be replaced by a deletion column and an insertion column (cost 1 + 1) without changing the total, so some optimal alignment has only matches, insertions and deletions. Its matched columns spell a common subsequence of length ℓ, and the cost is $(m - \ell) + (n - \ell)$, minimized by $\ell = \text{LCS}$. Example: ABCBDAB → BDCABA costs $7 + 6 - 2\cdot 4 = 5$.
~~~

**Example 6 (segmentation with leftovers).** Split A[1..n] into pieces, each of which is either a dictionary word (checked by IsWord) or a single *leftover* character; minimize the number of leftover characters. For THEDOGXRAN with words {THE, DOG, RAN, AN, HE, DO, GO} the answer is 1.

~~~reveal Solution: fewest leftover characters
1. **Spec.** For $1 \le i \le n+1$, Extra(i) = the minimum number of leftover characters in a split of the suffix A[i..n]. Answer Extra(1).
2. **Recurrence.** Extra(n+1) = 0; for $i \le n$:
$$\text{Extra}(i) = \min\Big(1 + \text{Extra}(i+1),\ \min_{i \le j \le n,\ \text{IsWord}(i,j)} \text{Extra}(j+1)\Big).$$
The first piece is either the leftover character A[i] or a word A[i..j].
3. **Memo.** Array Extra[1..n+1].
4. **Order.** i from n + 1 down to 1.
5. **Time.** $O(n^2)$ IsWord calls, O(n) space.

**Example.** Extra(8) = 0 (RAN), Extra(7) = 1 + Extra(8) = 1 (X is left over), Extra(4) = Extra(7) = 1 (DOG), Extra(1) = Extra(4) = **1** (THE). Note that the min always has at least one option (the leftover character), so this function is never $\infty$.
~~~

**Example 7 (one string, two indices).** A *repeated subsequence* of A is a string w with two occurrences as subsequences of A, at index sequences $i_1 < \dots < i_k$ and $j_1 < \dots < j_k$ with $i_t \ne j_t$ for every t. Find the length of the longest repeated subsequence. (AABEBCDD: ABD, length 3.)

~~~reveal Solution: longest repeated subsequence
Treat it as an LCS of A with itself, except that a position may not be paired with itself.
1. **Spec.** For $1 \le i, j \le n+1$, R(i, j) = the length of the longest string with one occurrence in A[i..n] and another in A[j..n] such that corresponding positions differ. Answer R(1, 1).
2. **Recurrence.**
$$R(i,j) = \begin{cases} 0 & i > n \text{ or } j > n\\ 1 + R(i+1, j+1) & A[i] = A[j] \text{ and } i \ne j\\ \max\{R(i+1, j),\ R(i, j+1)\} & \text{otherwise}\end{cases}$$
As in LCS, when the first characters can be paired, pairing them is safe (replace the first pair of any optimal solution by (i, j); since $i \ne j$ the result is still valid).
3. **Memo.** R[1..n+1][1..n+1].
4. **Order.** i from n + 1 down to 1, and for each i, j from n + 1 down to 1.
5. **Time.** $O(n^2)$ time and space.
~~~

## Common exam problem patterns

| If the problem says... | Recipe |
|---|---|
| "longest / heaviest **subsequence** such that consecutive chosen elements..." | Anchored f(i) = best solution starting at A[i]; loop over the next chosen j > i; answer max over i (or a sentinel). $O(n^2)$, times the size of any extra state. If the condition involves the last **two** chosen elements, index by the pair. |
| "split / partition / segment A into pieces" | f(i) = best for the suffix A[i..n]; loop over the end j of the first piece; precompute piece properties (IsWord, IsPal table, prefix sums for piece sums) so each option costs O(1). Add a parameter if the number of pieces is constrained. |
| "two strings": align, transform, interleave, common sub-something | f(i, j) on prefixes (or suffixes); list what the **last column** can be; $O(mn)$. Substring (contiguous) versions anchor both ends and reset to 0 on a mismatch. |
| "palindrome", or anything that peels both ends | Interval f(i, j); fill by increasing length. |
| "sum exactly / at most T", coins, knapsack | f(i, t) (or f(t) with unlimited reuse); say **pseudo-polynomial**. |
| "at most k" operations, transactions, drops, exceptions, deletions | Add the remaining budget as a parameter; the running time picks up a factor of k. |
| "how many ways" | Same recurrence with +, base case 1, and check that the cases are disjoint (ordered vs unordered!). |
| a process with modes (holding/not holding, last step up/down) | One function per mode, or a mode flag in the parameters; the recurrence moves between modes. |

> **Exam tip.** If you're stuck, solve a tiny instance by brute force and write down *which choice you'd make first*. The set of possible first choices is the min/max in your recurrence; what remains after a choice is the subproblem.

## Where students lose points

- **No English specification**, or a specification that describes the recurrence instead of the meaning ("L(i) is the max over j of ..."). Most rubrics give little or no credit to a recurrence without a spec.
- **The spec doesn't match the recurrence.** E.g. defining LIS(i) as "the LIS of A[i..n]" but writing the anchored recurrence that assumes A[i] is used.
- **Specification and answer mismatch**: defining LISfirst(i) (must start at A[i]) but returning LISfirst(1) instead of a max or a sentinel.
- **Missing or wrong base cases**: empty prefix, $i > j$, $t = 0$, Count(n+1) = 1 for counting, $\pm\infty$ for impossible states, and indices that run off the table (t − X[i] < 0).
- **Greedy shortcuts** in the recurrence (always take an element, always match) without a proof — when in doubt, take the max/min over all options. (Matching equal first letters in LCS *is* proven safe; matching in edit distance with custom costs may not be.)
- **Wrong evaluation order**, reading an entry before it is computed — e.g. filling a suffix recurrence left to right, or an interval table row by row with i increasing.
- **Exponentially many subproblems**: parameters that are sets, sequences or "the solution so far". Compress them to the one fact the future needs.
- **Running time = #subproblems only**, forgetting the per-subproblem cost (LISfirst: n entries × O(n) = $O(n^2)$, not O(n)), or forgetting the cost of subroutine calls such as checking whether a piece is a palindrome.
- **Claiming $O(nT)$ is polynomial.** Always flag pseudo-polynomial running times.
- **Writing only code.** Pseudocode without the spec, recurrence and order is hard to grade and usually loses the "explanation" points even when it works.

## Self-check

1. Why does memoization turn RecFib into a linear-time algorithm but does nothing for mergesort?

~~~reveal Answer
RecFib makes exponentially many calls but only n + 1 *distinct* ones, so caching removes the repetition. Mergesort never solves the same subarray twice — its subproblems are all distinct — so there is nothing to reuse. DP helps exactly when distinct subproblems are few and repeated.
~~~

2. A classmate writes: "Let L(i) = 1 + max{L(j) : j > i, A[j] > A[i]}." What is missing, and what is the correct English spec?

~~~reveal Answer
That's a recurrence, not a specification. A spec says *what* L(i) means: "L(i) is the length of the longest increasing subsequence of A[i..n] that begins with A[i]." Without it, no one (including the grader) can check the recurrence, the base case or the final answer (which is $\max_i L(i)$, not L(1)).
~~~

3. f(i, j) depends on f(i+1, j), f(i, j−1) and f(i+1, j−1). Give a valid loop order.

~~~reveal Answer
Outer loop i from n down to 1; inner loop j from i up to n. When computing (i, j), row i + 1 is complete and (i, j − 1) was just computed. Filling by increasing length j − i also works. Row-major with i increasing does **not** work: it reads row i + 1 before it is filled.
~~~

4. A table has entries f(i, j, k) for $1 \le i, j \le n$ and $0 \le k \le n$, each computed by a min over O(n) earlier entries. What is the running time?

~~~reveal Answer
$n \cdot n \cdot (n+1) = O(n^3)$ entries × O(n) per entry = $O(n^4)$ time; $O(n^3)$ space (often reducible if k only depends on k − 1).
~~~

5. In the segmentation-counting DP, why is the base case Count(n+1) = 1 rather than 0?

~~~reveal Answer
Count(n+1) is the number of segmentations of the empty string, and there is exactly one: the segmentation with no words. Each complete segmentation is counted when its last word reaches position n + 1, so a base case of 0 would make every count 0.
~~~

6. You want the longest subsequence of A in which every element (from the third on) is at least the sum of the previous two chosen elements. What should the subproblem be indexed by, and what is the running time?

~~~reveal Answer
Whether A[k] can come next depends on the previous **two** chosen elements, so index by the pair: F(i, j) = the longest such subsequence of A[i..n] whose first two elements are A[i] and A[j] (i < j). $F(i,j) = 1 + \max(\{1\} \cup \{F(j,k) : k > j,\ A[k] \ge A[i] + A[j]\})$. $O(n^2)$ entries × O(n) = $O(n^3)$ time. (Handle answers of length ≤ 2 separately, as in the convex-subsequence problem.)
~~~

7. The subset sum DP runs in $O(nT)$ time. Is that polynomial?

~~~reveal Answer
No. T is written in about $\lg T$ bits, so $O(nT) = O(n \cdot 2^{\lg T})$ is exponential in the input length. It is pseudo-polynomial; subset sum is NP-hard.
~~~

8. After computing LISfirst[0..n], how do you output an actual longest increasing subsequence?

~~~reveal Answer
Start at i = 0 (the sentinel). Repeatedly find a j > i with A[j] > A[i] and LISfirst[j] = LISfirst[i] − 1 (or follow a stored "next" pointer recorded when the max was computed), output A[j], and set i = j, until LISfirst[i] = 1. This takes O(n) time with pointers, $O(n^2)$ without.
~~~

## Midterm 2 exam patterns

A Midterm 2 DP question is usually a 20–25 minute problem wrapped in a short story (passes, billboards, a robot, a spam filter). The work is always the same: strip the story down to an abstract input, recognize the shape, and write the five parts. The shape tells you the subproblem almost immediately.

### The five shapes and how they are worded

| Shape | Typical wording | Subproblem | Typical time |
|---|---|---|---|
| Prefix / suffix | "split", "days 1..n", "walk along", "positions with spacing", "cover all the ..." | F(i) on A[i..n] (or A[1..i]); the first decision covers A[i..j] | O(n) to $O(n^2)$ |
| Anchored | "subsequence in which consecutive chosen elements ..." | F(i) = best solution starting (or ending) at A[i]; answer = max over i | $O(n^2)$ |
| Two sequences | "two strings", "transform", "occurs in", "merge", "common" | F(i, j) on two suffixes or prefixes | $O(mn)$ |
| "With at most k" | "at most k passes / transactions / deletions / study days" | add the budget left: F(i, b) | × (k + 1) |
| Interval | "palindrome", "take from either end", "substring A[i..j]" | F(i, j) on A[i..j]; fill by length | $O(n^2)$ (or $O(n^3)$ with a split point) |

### A skeleton that earns the points

~~~pseudo
0. Abstract:   "Given A[1..n] ..., compute the max/min/number/whether ..."
1. Spec:       for <ranges>, F(<params>) = <what it returns> for <which part of the input>;
               we want F(<start>)            (or max over anchors / a sentinel)
2. Recurrence: base cases, then one case per possibility for the first (or last) decision,
               plus one sentence on why these cases cover every solution
3. Memo:       F[<range>][<range>]
4. Order:      F(...) reads F(...) with <larger i / smaller j / shorter interval>  =>  loops
5. Time/space: #entries x work per entry;  "pseudo-polynomial" if a numeric value is an index
6. Sanity:     run the recurrence on the example in the problem statement
~~~

> **Exam tip.** Graders read parts 1 and 2 first. A one-line specification plus a correct recurrence earns most of the credit even without pseudocode; perfect pseudocode without a specification usually does not. If time runs out, skip the pseudocode — never the spec.

### Point-losing mistakes, Midterm 2 edition

- **A prefix spec where an anchor is needed.** "The LIS of A[1..i]" cannot tell whether A[i+1] extends it; "the LIS *ending at* A[i]" can.
- **Wrong base cases.** Suffix edit distance needs Edit(m+1, j) = n − j + 1 (insert the rest of B), not 0. Counting needs 1 for the empty object. Overshooting a target gives 0 ways or cost $\infty$ — it must not be silently ignored.
- **Evaluation order backwards**: a suffix recurrence filled left to right reads entries that do not exist yet.
- **A shortcut that holds for one cost model only.** Matching equal end letters is safe for unit-cost palindromes but not for weighted deletions; greedy change works for US coins but not for {1, 3, 4}.
- **Running time = #entries only**, forgetting the loop over choices or a subroutine (IsWord costing O(n), a scan to find the next compatible position).
- **Budget bugs**: decrementing the budget in the wrong branch, or solving "exactly k" when the question says "at most k" (or the reverse).
- **Losing the story's constraints** while abstracting: the first hop must have length 1, the last line is free, at least one element must be kept.
- **Indexing by a huge number** (calendar days, positions, prices) instead of by the n input items, which turns an O(n) DP into a pseudo-polynomial one.

### Try it first: a palindrome by insertions

**Problem.** Find the fewest characters that must be inserted (anywhere) into $A[1..n]$ to make it a palindrome. Write the DP directly, without going through the longest palindromic subsequence, and fill the table for A = ABCAB.

~~~~reveal Solution: fewest insertions to make a palindrome
1. **Spec.** For $1 \le i \le n+1$ and $i - 1 \le j \le n$, Ins(i, j) = the fewest insertions that turn the substring A[i..j] into a palindrome. Answer Ins(1, n).
2. **Recurrence.**
$$\text{Ins}(i, j) = \begin{cases} 0 & i \ge j\\ \text{Ins}(i+1, j-1) & i < j,\ A[i] = A[j]\\ 1 + \min\{\text{Ins}(i+1, j),\ \text{Ins}(i, j-1)\} & i < j,\ A[i] \ne A[j].\end{cases}$$
*Why.* The final palindrome begins and ends with the same letter. If $A[i] \ne A[j]$, they cannot be partners, so one of them is matched with an inserted copy: insert a copy of A[i] at the right end and fix A[i+1..j], or a copy of A[j] at the left end and fix A[i..j−1]. If $A[i] = A[j]$, pairing them is safe: Ins(i, j) = (j − i + 1) − LPS(i, j), and some longest palindromic subsequence uses both equal ends (the exchange argument for LPS).
3. **Memo.** Ins[1..n+1][0..n].
4. **Order.** Every entry reads strictly shorter intervals: fill by increasing length j − i (or i from n down to 1, and j from i + 1 up to n).
5. **Time.** $O(n^2)$ entries, O(1) each: $O(n^2)$ time and space.

~~~steps Filling Ins for ABCAB by increasing length
**Length ≤ 1.** All 0: the empty string and single letters are palindromes.
+++
**Length 2.** AB, BC, CA, AB: the ends differ, so each is 1 + min(0, 0) = **1**.
+++
**Length 3.** ABC: A ≠ C, so 1 + min(Ins(BC), Ins(AB)) = 1 + 1 = **2**. Likewise BCA = 2 and CAB = 2.
+++
**Length 4.** ABCA: equal ends, so Ins(BC) = **1**. BCAB: equal ends, so Ins(CA) = **1**.
+++
**Length 5.** ABCAB: A ≠ B, so 1 + min(Ins(BCAB), Ins(ABCA)) = 1 + 1 = **2**.
+++
**Answer and reconstruction.** Ins(1, 5) = 2. Following the choices: insert a B at the left end (the B partners the last B), then fix ABCA by inserting B between C and A: BABCBAB. Check: 5 − LPS(ABCAB) = 5 − 3 = 2.
~~~
~~~~

### Try it first: at most k study days

**Problem.** Over n days, studying on day i earns $v[i] \ge 0$ points. You may not study on two consecutive days, and you only have the energy for **at most k** study days in total. Maximize your points. Give the DP and fill the table for v = [4, 7, 6, 3, 8] and k = 2. Would "solve it without the budget, then drop the smallest days" work?

~~~reveal Solution: at most k study days
1. **Spec.** For $1 \le i \le n+2$ and $0 \le b \le k$: Best(i, b) = the maximum number of points obtainable from days i..n using at most b study days, no two consecutive. Answer Best(1, k).
2. **Recurrence.** Best(i, b) = 0 if $i > n$. Otherwise
$$\text{Best}(i, b) = \max\{\text{Best}(i+1, b),\ \ v[i] + \text{Best}(i+2, b-1) \text{ (only if } b \ge 1)\}.$$
Either we rest on day i, or we study on day i — which spends one unit of budget and forces a rest on day i + 1. With b = 0 only the first option exists, so Best(i, 0) = 0.
3. **Memo.** Best[1..n+2][0..k].
4. **Order.** Row i reads rows i + 1 and i + 2: fill i from n + 2 down to 1, any order of b.
5. **Time.** $O(nk)$ entries, O(1) each: $O(nk)$ time; $O(k)$ space if we keep only three rows.

| Best(i, b) | i = 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| b = 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| b = 1 | 8 | 8 | 8 | 8 | 8 | 0 | 0 |
| b = 2 | **15** | 15 | 14 | 8 | 8 | 0 | 0 |

For example Best(3, 2) = max(Best(4, 2), 6 + Best(5, 1)) = max(8, 14) = 14, and Best(2, 2) = max(14, 7 + Best(4, 1)) = 15. The answer is **15**: days 2 and 5.

**The shortcut fails.** Without the budget the best plan is days 1, 3, 5 for 18 points. Dropping its smallest day leaves 6 + 8 = 14 < 15: the budget changes *which* days are chosen, not just how many. That is why the budget must be a parameter of the subproblem.
~~~
`,
  cheatsheet: String.raw`## DP = backtracking + memoization
Time ≈ #distinct subproblems × time per subproblem. Space = #subproblems (often reducible).

## Five-part format (graded!)
1. **English spec** of the function (in terms of its parameters) + how to get the final answer
2. **Recurrence + base cases** (with brief justification)
3. **Memo structure** (array dimensions and index ranges)
4. **Evaluation order** (every dependency computed first)
5. **Time and space**

~~~pseudo
Spec:   For <ranges>, F(<params>) = <best/count/whether> <object> of <piece of input>.
        Answer = F(<start>)   (or max over anchors / sentinel)
Rec:    F = <base>                         if <boundary>
        F = max/min/OR/sum over <choices>  otherwise   (+ one-line justification)
Memo:   F[..][..]           Order: <loops>, because F(..) reads F(..) with <larger/smaller>
Time:   #entries x work per entry;  space = #entries (say "pseudo-polynomial" if a number like T appears)
~~~

## Classic recurrences
| Problem | Recurrence | Time |
|---|---|---|
| Fibonacci | $F_i = F_{i-1} + F_{i-2}$ | $O(n)$; naive $\Theta(\phi^n)$ |
| Splittable(i) | $\bigvee_{j\ge i}$ IsWord(i,j) ∧ Split(j+1); Split(n+1)=T | $O(n^2)$ |
| LISfirst(i) | $1+\max\{L(j): j>i, A[j]>A[i]\}$; answer $L(0)-1$ | $O(n^2)$ |
| Edit(i,j) | $\min\{E(i{-}1,j){+}1, E(i,j{-}1){+}1, E(i{-}1,j{-}1){+}[A_i{\ne}B_j]\}$; $E(i,0)=i$, $E(0,j)=j$ | $O(mn)$ |
| LCS(i,j) | match: $1+L(i{+}1,j{+}1)$; else $\max(L(i{+}1,j), L(i,j{+}1))$ | $O(mn)$ |
| SS(i,t) | $SS(i{+}1,t) \lor SS(i{+}1,t{-}X_i)$; $SS(\cdot,0)=$T | $O(nT)$ pseudo-poly |
| LPS(i,j) | equal ends: $2+P(i{+}1,j{-}1)$; else $\max(P(i{+}1,j),P(i,j{-}1))$; $P(i,i)=1$ | $O(n^2)$ |

## Variants
| Problem | Subproblem | Recurrence | Time |
|---|---|---|---|
| Max non-adjacent sum | M(i): suffix A[i..n] | $\max\{M(i{+}1),\ A_i + M(i{+}2)\}$; $M(i>n)=0$ | $O(n)$ |
| Max subarray (Kadane) | E(i): ends at i | $A_i + \max\{0, E(i{-}1)\}$; answer $\max_i E(i)$ | $O(n)$ |
| Fewest coins | C(t): amount t | $1 + \min_{d_i\le t} C(t-d_i)$; $C(0)=0$ | $O(kT)$ pseudo |
| Coin multisets | W(i,t): coins $d_i..d_k$ | $W(i{+}1,t) + W(i,t-d_i)$; $W(k{+}1,0)=1$ | $O(kT)$ pseudo |
| Fewest words / count | F(i): suffix | $\min_j 1{+}F(j{+}1)$ / $\sum_j C(j{+}1)$ over words A[i..j]; $C(n{+}1)=1$ | $O(n^2)$ |
| Palindrome partition | P(i): suffix + IsPal table | $\min\{1 + P(j{+}1) : A[i..j] \text{ pal}\}$ | $O(n^2)$ |
| Longest pal. substring | IsPal(i,j) | $A_i{=}A_j \wedge \text{IsPal}(i{+}1,j{-}1)$ | $O(n^2)$ |
| Longest common substring | S(i,j): common suffix | $1 + S(i{-}1,j{-}1)$ if $A_i{=}B_j$, else 0; answer max | $O(mn)$ |
| Shortest common superseq. | (i,j) suffixes | match: $1 + S(i{+}1,j{+}1)$; else $1 + \min(\cdot,\cdot)$ | $O(mn)$; $=m{+}n{-}$LCS |
| Shuffle | Sh(i,j) prefixes | $(A_i{=}C_{i+j} \wedge Sh(i{-}1,j)) \vee (B_j{=}C_{i+j} \wedge Sh(i,j{-}1))$ | $O(mn)$ |
| Alternating subseq. | Up(i), Down(i) | $Up(i) = 1+\max\{Down(j): j>i, A_j>A_i\}$ | $O(n^2)$ |
| At most k drops | L(i,d) | next up: $L(j,d)$; next not up: $L(j,d{-}1)$ | $O(n^2k)$ |
| Stock, k trades | B(i,j,h) | hold: sell or wait; free: buy (j−1) or wait | $O(nk)$ |
| LCS of 3 strings | (i,j,k) | all equal: $1+L(\cdot{+}1)$; else max of 3 skips | $O(n^3)$ |

"pseudo" = pseudo-polynomial.

## Choosing the subproblem
- Decisions left to right, no memory needed → **prefix/suffix** f(i).
- Consecutive chosen elements must be compatible → **anchored** f(i) ("starts with A[i]"), loop over next j.
- Two strings → **(i, j)** prefixes/suffixes, analyze the last column.
- Peel both ends / split → **interval** (i, j). Constraint on last two chosen → **pair** (i, j).
- Future needs a fact about the past → add it: budget k, flag, counter, remaining target t.
- Never index by a set or "the solution so far" (exponential).

## Counting
Replace max/min/OR by sum, base case 1 (empty object), cases must be **disjoint**. Ordered sequences: $\sum_i S(t-d_i)$; multisets: fix the order of denominations, $W(i,t)$.

## Evaluation orders
- Suffix subproblems: i from n down. Prefix: i from 0 up.
- 2D prefix (edit distance): row-major. 2D suffix: both indices decreasing.
- Intervals: i decreasing, j increasing (or by length).

## Facts
- Edit(FOOD, MONEY) = 4; Edit(KITTEN, SITTING) = 3.
- Insert/delete-only distance $= m+n-2\,\text{LCS}$. Insertions to make a palindrome $= n - \text{LPS}$.
- Two-row trick: $O(\min(m,n))$ space for edit distance/LCS values.
- $O(nT)$ is pseudo-polynomial (T has $\lg T$ bits).
- Substitution cost 2 ⇒ edit distance $= m + n - 2\,\text{LCS}$. SCS $= m + n - \text{LCS}$.
- Coins {1,2,5}, T = 5: 4 multisets, 9 ordered sequences. Binary strings of length 5 without 111: 24.

## Where points are lost
No English spec · spec/answer mismatch · missing base cases (empty, $i>j$, $t=0$, count base = 1) · wrong fill order · exponential state · time = #entries only · calling $O(nT)$ polynomial.

### Exam checklist
- Story stripped to an abstract input; shape identified (suffix, anchored, two sequences, at most k, interval).
- **Spec in English** with index ranges, and the **final answer** (F(1)? $\max_i$? F(1, k)?).
- **Base cases**: empty suffix/prefix, $i > j$, budget 0, impossible states ($\pm\infty$ or 0 ways), count base = 1. Suffix edit distance: Edit(m+1, j) = n − j + 1.
- Recurrence: one case per first/last decision, plus a sentence why that covers everything. No unproven greedy shortcut (weighted costs break "match equal ends").
- Memo dimensions match the parameters; index by the n items, not by huge values (days, positions).
- **Evaluation order** follows the dependencies (suffix ⇒ i decreasing; prefix ⇒ increasing; intervals ⇒ by length).
- **Time** = entries × choices × cost per choice (include IsWord / palindrome tests / lookups); space; "pseudo-polynomial" if a numeric value indexes the table.
- Checked against the example given in the problem.
`,
  quiz: [
    {
      type: 'mc',
      q: 'What is the running time of the naive recursive Fibonacci algorithm RecFib(n)?',
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(\phi^n)$ where $\phi \approx 1.618$`, String.raw`$\Theta(n!)$`],
      answer: 2,
      explain: String.raw`The number of calls satisfies $C(n) = 1 + C(n-1) + C(n-2)$, so $C(n) = 2F_{n+1} - 1 = \Theta(\phi^n)$. It recomputes the same subproblems exponentially often; memoization gives O(n).`,
    },
    {
      type: 'tf',
      q: 'For typical DP problems, top-down memoization and bottom-up iteration have the same asymptotic running time.',
      answer: true,
      explain: 'Both evaluate each distinct subproblem once, at the same cost. Differences are in constants, recursion-stack depth, whether unreachable subproblems are skipped (memoization) and how easily space can be reduced (iteration). Course write-ups usually use iteration with an explicit evaluation order.',
    },
    {
      type: 'mc',
      q: 'What is the running time of the standard DP for the edit distance of strings of lengths m and n?',
      choices: [String.raw`$O(m + n)$`, String.raw`$O(mn)$`, String.raw`$O(mn(m+n))$`, String.raw`$O(2^{m+n})$`],
      answer: 1,
      explain: String.raw`There are $(m+1)(n+1)$ subproblems Edit(i, j), each a min of three already-computed values: $O(mn)$ time. The space is $O(mn)$, or $O(\min(m,n))$ if you keep only two rows and don't need the alignment.`,
    },
    {
      type: 'mc',
      q: String.raw`Which is the correct recurrence for Edit(i, j) = edit distance between A[1..i] and B[1..j], for $i, j \ge 1$?`,
      choices: [
        String.raw`$\min\{\text{Edit}(i-1,j)+1,\ \text{Edit}(i,j-1)+1,\ \text{Edit}(i-1,j-1)+[A[i]\ne B[j]]\}$`,
        String.raw`$\text{Edit}(i-1,j-1)$ if $A[i]=B[j]$, else $1+\text{Edit}(i-1,j-1)$`,
        String.raw`$\max\{\text{Edit}(i-1,j),\ \text{Edit}(i,j-1)\} + 1$`,
        String.raw`$\min\{\text{Edit}(i-1,j),\ \text{Edit}(i,j-1),\ \text{Edit}(i-1,j-1)\}+1$`,
      ],
      answer: 0,
      explain: String.raw`The last column of an optimal alignment is a deletion, an insertion, or a (mis)match — try all three. Option B only allows substitutions (forgets insertions/deletions). Option D charges 1 even for a match.`,
    },
    {
      type: 'short',
      q: 'What is the edit distance between KITTEN and SITTING? (Give a number.)',
      answer: ['3'],
      explain: 'K→S (substitute), E→I (substitute), insert G at the end: 3 operations. Filling the 7 × 8 DP table gives Edit(6, 7) = 3, so no sequence of 2 operations exists. (Intuition: the length difference forces one insertion, and the first letters K/S and the fifth letters E/I still disagree.)',
    },
    {
      type: 'mc',
      q: String.raw`LISfirst(i) depends on LISfirst(j) for all $j > i$. What is the total running time of the DP, and the evaluation order?`,
      choices: [String.raw`$O(n)$; i increasing`, String.raw`$O(n^2)$; i decreasing`, String.raw`$O(n^2)$; i increasing`, String.raw`$O(n\log n)$; any order`],
      answer: 1,
      explain: String.raw`There are n + 1 entries, and each takes O(n) time to scan all later j: $O(n^2)$. Since entry i needs entries with larger indices, fill from n down to 0. (A different, cleverer algorithm achieves $O(n\log n)$, but not this DP.)`,
    },
    {
      type: 'mc',
      q: 'For LPS(i, j) = longest palindromic subsequence of A[i..j], which evaluation order is valid?',
      choices: ['i increasing, j increasing', 'i decreasing; for each i, j increasing from i', 'j decreasing; for each j, i increasing', 'Any order — all entries are independent'],
      answer: 1,
      explain: String.raw`LPS(i, j) depends on LPS(i+1, j), LPS(i, j−1) and LPS(i+1, j−1): a larger i, or the same i with smaller j. With i decreasing in the outer loop and j increasing in the inner loop, all of these are ready. Filling by increasing interval length also works.`,
    },
    {
      type: 'tf',
      q: 'The subset sum DP runs in O(nT) time, so subset sum can be solved in polynomial time.',
      answer: false,
      explain: String.raw`The input encodes T in about $\lg T$ bits, so $nT$ is exponential in the input length when T is large: **pseudo-polynomial**. Subset sum is NP-hard; a truly polynomial algorithm would imply P = NP.`,
    },
    {
      type: 'multi',
      q: 'Which of these are required parts of a complete CS 374 dynamic programming solution? (select all that apply)',
      choices: ['An English description of what the recursive function computes', 'A recurrence with base cases', 'The memoization data structure', 'An evaluation order', 'Running time (and space)', 'A proof that the problem is NP-hard'],
      answer: [0, 1, 2, 3, 4],
      explain: 'The five parts are specification, recurrence + base cases, memo structure, evaluation order, and time/space. The English specification is the most important: without it, the recurrence cannot be checked.',
    },
    {
      type: 'short',
      q: 'What is the length of the longest common subsequence of ABCBDAB and BDCABA? (Give a number.)',
      answer: ['4'],
      explain: 'For example BCBA (A: B-C-B-A at positions 2,3,4,6; B: B-C-B-A at positions 1,3,5,6) or BDAB. The DP over suffix pairs confirms that no common subsequence of length 5 exists.',
    },
    {
      type: 'mc',
      q: 'For text segmentation with Splittable(i) on a string of length n, what is the memoization structure and the number of IsWord calls?',
      choices: [String.raw`A 1D array of size n + 1; $O(n^2)$ IsWord calls`, String.raw`A 2D array $n\times n$; $O(n^3)$ IsWord calls`, String.raw`A 1D array of size n + 1; $O(n)$ IsWord calls`, String.raw`A hash set of strings; $O(2^n)$ IsWord calls`],
      answer: 0,
      explain: String.raw`There is one parameter, i ∈ {1, …, n+1}. Each entry tries every end position j ≥ i, i.e. O(n) IsWord calls: $O(n^2)$ in total.`,
    },
    {
      type: 'tf',
      q: 'The minimum number of characters that must be inserted into a string s of length n to make it a palindrome equals n − LPS(s), where LPS(s) is the length of its longest palindromic subsequence.',
      answer: true,
      explain: String.raw`Keep a longest palindromic subsequence P; every other character c can be "mirrored" by inserting a copy of c at the matching position, giving $n - \lvert P\rvert$ insertions. Conversely, if k insertions produce a palindrome, the original characters that are paired with each other (or are the center) form a palindromic subsequence of length at least $n - k$.`,
    },
    {
      type: 'mc',
      q: 'If you only need the edit distance (not the alignment) of strings of lengths m ≥ n, how much space is needed?',
      choices: [String.raw`$O(1)$`, String.raw`$O(n)$`, String.raw`$O(m)$`, String.raw`$O(mn)$`],
      answer: 1,
      explain: String.raw`Each row of the table depends only on the previous row, so two rows of length n + 1 suffice (swap the roles of the strings so that the rows are along the shorter one). Recovering the alignment in linear space is possible too (Hirschberg's divide-and-conquer), at the cost of a constant factor in time.`,
    },
    {
      type: 'mc',
      q: String.raw`A DP has $O(n^2)$ subproblems, and evaluating each requires a min over O(n) earlier subproblems plus an O(n)-time check per option. What is the running time?`,
      choices: [String.raw`$O(n^2)$`, String.raw`$O(n^3)$`, String.raw`$O(n^4)$`, String.raw`$O(n^2\log n)$`],
      answer: 2,
      explain: String.raw`Time = #subproblems × time per subproblem = $n^2 \times (n \text{ options} \times O(n) \text{ each}) = O(n^4)$. A common improvement is to precompute the checks in a table so each option costs O(1), giving $O(n^3)$.`,
    },
    {
      type: 'mc',
      q: String.raw`A DP has one entry f(i, j, k) for every $1 \le i \le j \le n$ and $0 \le k \le K$, and each entry is a max over O(1) previously computed entries. What is the running time?`,
      choices: [String.raw`$O(n^2 + K)$`, String.raw`$O(n^2 K)$`, String.raw`$O(n^3 K)$`, String.raw`$O(nK)$`],
      answer: 1,
      explain: String.raw`There are about $\frac{n^2}{2}(K+1) = \Theta(n^2K)$ entries and O(1) work each, so $O(n^2K)$. Sizes of independent parameters **multiply**, they don't add. If K is a numeric input (not a count bounded by n), say the algorithm is pseudo-polynomial.`,
    },
    {
      type: 'mc',
      q: 'Suf(i, j) = the length of the longest common suffix of A[1..i] and B[1..j]; the longest common substring is the maximum entry. Which recurrence (for i, j ≥ 1, with Suf = 0 when i = 0 or j = 0) is correct?',
      choices: [
        String.raw`$\text{Suf}(i,j) = 1 + \text{Suf}(i-1,j-1)$ if $A[i] = B[j]$, else 0`,
        String.raw`$\text{Suf}(i,j) = 1 + \text{Suf}(i-1,j-1)$ if $A[i] = B[j]$, else $\max\{\text{Suf}(i-1,j), \text{Suf}(i,j-1)\}$`,
        String.raw`$\text{Suf}(i,j) = \max\{\text{Suf}(i-1,j), \text{Suf}(i,j-1)\} + [A[i] = B[j]]$`,
        String.raw`$\text{Suf}(i,j) = \text{Suf}(i-1,j-1) + [A[i] = B[j]]$`,
      ],
      answer: 0,
      explain: String.raw`A common suffix ending exactly at i and j must use A[i] and B[j]; if they differ there is no nonempty common suffix, so the value **resets to 0**. Option B is the LCS recurrence (subsequences may skip characters). Option D never resets, so it counts all matching diagonal positions, not a contiguous run. Example: XABCY vs ABZCY has longest common substring 2 but LCS 4.`,
    },
    {
      type: 'mc',
      q: 'A student implements Splittable with the correct recurrence Split(i) = OR over j ≥ i of [IsWord(i, j) AND Split(j+1)], Split(n+1) = True, but fills the array with "for i = 1 to n". What goes wrong?',
      choices: [
        'Nothing; any order works for a 1D table',
        'Split(i) reads Split(j+1) for j + 1 > i, which has not been computed yet when i increases, so the algorithm reads garbage or default values',
        'The running time becomes exponential',
        'It only fails when the string has no valid segmentation',
      ],
      answer: 1,
      explain: 'The evaluation order must respect dependencies: suffix subproblems depend on larger indices, so i must go from n + 1 down to 1. Increasing i reads uninitialized entries (typically False), giving wrong answers even though the time is still O(n²).',
    },
    {
      type: 'mc',
      q: 'For a 0/1 selection problem a student defines Best(S) = the best value obtainable given that S is the set of items chosen so far, memoized in a hash table. What is the main problem?',
      choices: [
        'Hash tables are not allowed in DP',
        'There can be up to 2ⁿ different sets S, so the memo table (and running time) is exponential',
        'The recurrence cannot have a base case',
        'Sets cannot be compared for equality',
      ],
      answer: 1,
      explain: 'A DP is only fast if the number of distinct subproblems is small. Indexing by a set (or by "the solution so far") gives exponentially many subproblems — this is just backtracking with extra memory. Compress the state to what the future needs: usually an index i plus a small number (remaining capacity, last chosen element, a flag).',
    },
    {
      type: 'tf',
      q: 'The fewest-coins DP takes O(kT) time with k denominations and target T. Since k and T are both part of the input, this is a polynomial-time algorithm.',
      answer: false,
      explain: String.raw`T is part of the input, but it is written in about $\lg T$ bits. $O(kT)$ is polynomial in the *value* T but exponential in its *length*: pseudo-polynomial. (k is fine — it counts input items.)`,
    },
    {
      type: 'short',
      q: 'Digits are decoded with 1 = A, 2 = B, …, 26 = Z. In how many ways can the digit string 226 be decoded? (Give a number.)',
      answer: ['3'],
      explain: 'BBF (2|2|6), BZ (2|26) and VF (22|6). The DP: D(i) = D(i+1) [if digit i is 1–9] + D(i+2) [if digits i, i+1 form 10–26], with D(n+1) = 1. From the right: D(4) = 1, D(3) = 1, D(2) = D(3) + D(4) = 2 (6 and 26), D(1) = D(2) + D(3) = 3.',
    },
    {
      type: 'short',
      q: 'What is the minimum number of cuts needed to partition BANANA into palindromes? (Give a number.)',
      answer: ['1'],
      explain: 'B | ANANA: one cut, two palindromic pieces. Zero cuts is impossible because BANANA itself is not a palindrome. The DP: Pieces(i) = min over palindromic A[i..j] of 1 + Pieces(j+1), with an O(n²) IsPal table; cuts = pieces − 1.',
    },
    {
      type: 'mc',
      q: 'MaxEnd(i) = the maximum sum of a nonempty contiguous subarray that ends exactly at A[i]. Which recurrence (for i ≥ 2, with MaxEnd(1) = A[1]) is correct?',
      choices: [
        String.raw`$\text{MaxEnd}(i) = \max\{A[i],\ A[i] + \text{MaxEnd}(i-1)\}$`,
        String.raw`$\text{MaxEnd}(i) = \max\{\text{MaxEnd}(i-1),\ \text{MaxEnd}(i-1) + A[i]\}$`,
        String.raw`$\text{MaxEnd}(i) = \text{MaxEnd}(i-1) + A[i]$`,
        String.raw`$\text{MaxEnd}(i) = \max\{\text{MaxEnd}(i-1),\ A[i]\}$`,
      ],
      answer: 0,
      explain: String.raw`A subarray ending at i is A[i] alone or a subarray ending at i − 1 plus A[i]. Options B and D allow the value to come from a subarray that does *not* end at i, breaking the spec; C forces extending even when the previous sum is negative. The final answer is $\max_i \text{MaxEnd}(i)$ — Kadane's algorithm, O(n).`,
    },
    {
      type: 'mc',
      q: 'A student writes the edit-distance recurrence Edit(i, j) = min{Edit(i−1, j) + 1, Edit(i, j−1) + 1, Edit(i−1, j−1) + [A[i] ≠ B[j]]} with the single base case Edit(0, 0) = 0. What is wrong?',
      choices: [
        'Nothing; the other entries follow from the recurrence',
        'Entries in row 0 and column 0 (other than (0,0)) would read indices −1, which are outside the table; the base cases Edit(i, 0) = i and Edit(0, j) = j are missing',
        'The recurrence should use max instead of min',
        'The base case should be Edit(0, 0) = 1',
      ],
      answer: 1,
      explain: 'For Edit(i, 0) with i > 0 the recurrence would look at Edit(i, −1) and Edit(i−1, −1). Base cases must cover every boundary of the table: turning a prefix of length i into the empty string takes exactly i deletions, and turning the empty string into B[1..j] takes j insertions.',
    },
    {
      type: 'tf',
      q: 'With denominations d₁, …, d_k, the recurrence Ways(t) = Σ over d_i ≤ t of Ways(t − d_i), with Ways(0) = 1, counts the number of multisets of coins with total t.',
      answer: false,
      explain: 'It counts ordered sequences: the last coin can be any denomination, so 1+2+2, 2+1+2 and 2+2+1 are counted separately. For {1, 2, 5} and t = 5 it gives 9, but there are only 4 multisets. To count multisets, add an index fixing the order of denominations: Ways(i, t) = Ways(i+1, t) + Ways(i, t − d_i).',
    },
    {
      type: 'mc',
      q: 'Strings A and B have lengths m and n and their longest common subsequence has length ℓ. What is the length of their shortest common supersequence (shortest string having both A and B as subsequences)?',
      choices: [String.raw`$m + n$`, String.raw`$m + n - \ell$`, String.raw`$m + n - 2\ell$`, String.raw`$\max(m, n)$`],
      answer: 1,
      explain: String.raw`Write the LCS once and insert the remaining $m - \ell$ letters of A and $n - \ell$ letters of B around it: $\ell + (m-\ell) + (n-\ell) = m + n - \ell$. Conversely, the letters of a supersequence that serve both A and B form a common subsequence. $m + n - 2\ell$ is the insert/delete edit distance, a different quantity. Example: ABCBDAB, BDCABA: 7 + 6 − 4 = 9.`,
    },
    {
      type: 'mc',
      q: 'Stock trading with at most k buy/sell transactions over n days, with subproblems Best(i, j, h) = max profit from days i..n with j purchases still allowed and h ∈ {holding, not holding}. What is the running time?',
      choices: [String.raw`$O(n)$`, String.raw`$O(nk)$`, String.raw`$O(n^2k)$`, String.raw`$O(2^n)$`],
      answer: 1,
      explain: String.raw`There are $(n+1)(k+1)\cdot 2$ entries and each is a max of two options (wait, or buy/sell today), so $O(nk)$. A formulation that loops over the next sell day for every buy day would cost $O(n^2k)$ — the holding flag removes that inner loop.`,
    },
    {
      type: 'multi',
      q: 'Edit(i, j) on prefixes depends on Edit(i−1, j), Edit(i, j−1) and Edit(i−1, j−1). Which evaluation orders are valid? (select all that apply)',
      choices: ['Row by row: i increasing, j increasing within each row', 'Column by column: j increasing, i increasing within each column', 'By anti-diagonals: i + j increasing', 'i decreasing, j decreasing'],
      answer: [0, 1, 2],
      explain: 'Each entry needs entries with a smaller i, a smaller j, or both. Row-major, column-major and anti-diagonal orders all compute those first (every dependency has a smaller i + j). Decreasing orders are for suffix formulations and read entries before they exist here.',
    },
    {
      type: 'mc',
      q: 'LD(i, d) = the longest subsequence of A[i..n] that starts with A[i] and has at most d "drops" (consecutive chosen pairs that do not increase). For 0 ≤ d ≤ k, each entry loops over all next indices j > i. What is the running time?',
      choices: [String.raw`$O(nk)$`, String.raw`$O(n^2)$`, String.raw`$O(n^2k)$`, String.raw`$O(n^2 2^k)$`],
      answer: 2,
      explain: String.raw`There are $n(k+1)$ entries and each scans O(n) next indices: $O(n^2k)$. The extra budget parameter multiplies both the table size and the total time by about k. (Since k ≤ n − 1 is meaningful, this is at most $O(n^3)$ — truly polynomial.)`,
    },
    {
      type: 'mc',
      q: 'You memoize Splittable(i) correctly, but each call IsWord(A[i..j]) costs O(j − i + 1) time (it compares characters). What is the total running time?',
      choices: [String.raw`$O(n)$`, String.raw`$O(n^2)$`, String.raw`$O(n^3)$`, String.raw`$O(2^n)$`],
      answer: 2,
      explain: String.raw`n + 1 entries × O(n) choices of j × O(n) per IsWord call = $O(n^3)$. "#subproblems × time per subproblem" must include the cost of every subroutine call inside a subproblem. (With O(1) IsWord the same DP is $O(n^2)$; exponential time only happens without the memo.)`,
    },
    {
      type: 'tf',
      q: 'For every set of coin denominations that includes 1, the greedy algorithm "repeatedly take the largest coin that fits" uses the fewest coins.',
      answer: false,
      explain: String.raw`With denominations {1, 3, 4} and T = 6, greedy takes 4 + 1 + 1 (three coins), but 3 + 3 uses two. Having a 1 only guarantees that greedy finds *some* solution. The DP $C(t) = 1 + \min_{d_i \le t} C(t - d_i)$, C(0) = 0, is always correct, in $O(kT)$ pseudo-polynomial time. (Greedy happens to be optimal for US coins, but proving that takes an argument specific to those denominations.)`,
    },
    {
      type: 'mc',
      q: 'A student defines L(i) = "the length of the longest increasing subsequence of A[1..i]" and tries to write L(i+1) in terms of L(1), ..., L(i). Why does this fail?',
      choices: [
        'There are too many subproblems',
        'L(i) does not record which element the best subsequence ends with, so we cannot tell whether A[i+1] extends it',
        'The base case L(0) = 0 is wrong',
        'Prefix subproblems can never be used for subsequence problems',
      ],
      answer: 1,
      explain: String.raw`Whether A[i+1] can be appended depends on the last element of the subsequence, which the value L(i) forgets: for A = [5, 6, 1, 2, 3], L(4) = 2 is achieved by both 5, 6 and 1, 2, and only the second can be extended by A[5] = 3 — the number 2 alone cannot tell them apart. Anchoring fixes this: E(i) = the longest increasing subsequence **ending at** A[i], $E(i) = 1 + \max\{E(j) : j < i, A[j] < A[i]\}$, answer $\max_i E(i)$. Prefix subproblems are fine when the rest of the problem does not depend on the details of the earlier choices.`,
    },
    {
      type: 'mc',
      q: String.raw`W(i) = the number of ways to climb from step i to step n using moves of +1 or +2 (never overshooting step n). The recurrence is W(i) = W(i+1) + W(i+2) for $i \le n - 1$, with W(n) = 1. What value must W(n+1) have?`,
      choices: ['0', '1', 'It is never used', String.raw`$\infty$`],
      answer: 0,
      explain: String.raw`W(n − 1) = W(n) + W(n + 1) must equal 1 (the single move +1); a +2 move from step n − 1 overshoots and is not a way at all, so W(n + 1) = 0. Setting it to 1 counts the overshoot as a valid climb and makes every count too large. Impossible states get 0 in counting DPs, $\infty$ in minimization DPs and $-\infty$ in maximization DPs; only the "empty, successful" state gets the count 1.`,
    },
    {
      type: 'multi',
      q: 'F(i, j) for 1 ≤ i ≤ j ≤ n depends on F(i+1, j), F(i, j−1) and F(i+1, j−1). Which evaluation orders are valid? (select all that apply)',
      choices: [
        'Outer loop i from n down to 1; inner loop j from i up to n',
        'Outer loop j from 1 up to n; inner loop i from j down to 1',
        'Outer loop i from 1 up to n; inner loop j from i up to n',
        'By increasing length j − i',
        'Outer loop j from n down to 1; inner loop i from 1 up to j',
      ],
      answer: [0, 1, 3],
      explain: String.raw`An order is valid iff every entry is computed after the entries it reads. A: row i + 1 is complete and (i, j − 1) was just computed. B (column by column): column j − 1 is complete, and (i+1, j) was just computed because i decreases. D: all three dependencies are shorter intervals. C reads row i + 1 before it exists. E computes column j before column j − 1, which it needs. Several orders can be correct — say which one you use and why.`,
    },
    {
      type: 'mc',
      q: 'A top-down, memoized LCS on strings of lengths m and n is run. Counting every call — including calls that just return a stored value — how many calls are made in total?',
      choices: [String.raw`$O(m + n)$`, String.raw`$O(mn)$`, String.raw`$O(mn(m+n))$`, String.raw`$\Theta\big(\binom{m+n}{m}\big)$`],
      answer: 1,
      explain: String.raw`Each of the $(m+1)(n+1)$ subproblems is *computed* at most once, and each computation makes at most 2 recursive calls (1 in the match case). So there are at most $2(m+1)(n+1) + 1$ calls in total, and the ones that hit the memo cost O(1). This is the general argument: total time = $\sum$ over subproblems of the work done when it is first computed. The binomial count is for the plain recursion without the memo.`,
    },
    {
      type: 'tf',
      q: 'If a recurrence defines F(i) in terms of both F(i − 1) and F(i + 1), we can still evaluate it with a single loop over i, as long as we choose the direction of the loop correctly.',
      answer: false,
      explain: String.raw`F(i) needs F(i + 1), and F(i + 1) needs F(i): the dependency graph has a cycle, so no evaluation order exists and the "recursion" would never terminate. A valid DP needs a dependency graph that is a DAG; an evaluation order is a topological order of it. If you write such a recurrence, your subproblems are wrong (often you need an extra parameter, such as a direction or a step count, that strictly decreases).`,
    },
    {
      type: 'mc',
      q: 'A student\'s LIS algorithm starts at A[1] and always appends the next element that is larger than the last one taken. On which input does it give the wrong length?',
      choices: ['[1, 2, 3, 4]', '[1, 5, 2, 3]', '[3, 2, 1]', '[2, 2, 2]'],
      answer: 1,
      explain: String.raw`On [1, 5, 2, 3] the greedy takes 1, 5 and gets stuck (length 2), but 1, 2, 3 has length 3: grabbing 5 early blocked two later elements. On the other inputs greedy happens to be right. The DP tries every next element: $\text{LISfirst}(i) = 1 + \max\{\text{LISfirst}(j) : j > i, A[j] > A[i]\}$. One small counterexample is all an exam needs to refute a greedy algorithm.`,
    },
    {
      type: 'mc',
      q: 'Edit distance written on suffixes: Edit(i, j) = the edit distance between A[i..m] and B[j..n]. What is the correct base case Edit(m+1, j)?',
      choices: ['0', 'j', 'n − j + 1', 'n − j'],
      answer: 2,
      explain: String.raw`When A's suffix is empty, B[j..n] must be built by insertions: it has n − j + 1 characters. Symmetrically Edit(i, n+1) = m − i + 1, the answer is Edit(1, 1), and the table is filled with i and j **decreasing**. Option B is the *prefix* formula (Edit(0, j) = j) copied into the suffix version — a classic mismatch between spec and base case.`,
    },
    {
      type: 'mc',
      q: 'You want the maximum-sum set of positions of A[1..n] (entries may be negative) that never contains three consecutive positions. Which is a correct O(n) formulation, with Best(i) = the best such set inside A[i..n] and Best(i) = 0 for i > n?',
      choices: [
        String.raw`$\text{Best}(i) = \max\{\text{Best}(i+1),\ A[i] + \text{Best}(i+2),\ A[i] + A[i+1] + \text{Best}(i+3)\}$ (last option only if $i + 1 \le n$)`,
        String.raw`$\text{Best}(i) = \max\{\text{Best}(i+1),\ A[i] + \text{Best}(i+1)\}$`,
        String.raw`$\text{Best}(i) = A[i] + A[i+1] + \text{Best}(i+3)$`,
        'It is impossible in O(n): the subproblem must remember the whole set chosen so far',
      ],
      answer: 0,
      explain: String.raw`Look at the start of the suffix: either A[i] is skipped, or A[i] is chosen and A[i+1] skipped, or A[i] and A[i+1] are both chosen and A[i+2] must be skipped. These three cases cover every valid set exactly, and each leaves a smaller suffix with no memory needed. Option B ignores the constraint, C forces a choice, and D overstates what the future needs to know — the run length is absorbed into which suffix we jump to (an equivalent fix is a parameter r ∈ {0, 1, 2} for the current run length).`,
    },
  ],
  flashcards: [
    { front: 'What is dynamic programming?', back: 'Smart recursion: a backtracking algorithm with few distinct, repeated subproblems, where each subproblem is solved once and its answer stored (memoized or filled bottom-up).' },
    { front: 'The five parts of a DP solution', back: '(1) English spec of the function + final answer; (2) recurrence with base cases; (3) memo data structure; (4) evaluation order; (5) running time and space.' },
    { front: 'DP running time rule of thumb', back: String.raw`(# distinct subproblems) × (time to compute one from its dependencies). E.g. LISfirst: $n \times O(n) = O(n^2)$.` },
    { front: 'Naive vs DP Fibonacci', back: String.raw`Naive: $2F_{n+1}-1 = \Theta(\phi^n)$ calls. Memoized/iterative: O(n) additions; O(1) space with two variables.` },
    { front: 'Edit distance recurrence', back: String.raw`$E(i,0)=i$, $E(0,j)=j$, $E(i,j) = \min\{E(i-1,j)+1,\ E(i,j-1)+1,\ E(i-1,j-1)+[A_i\ne B_j]\}$. $O(mn)$ time.` },
    { front: 'LCS recurrence (suffixes)', back: String.raw`$L(i,j)=0$ if $i>m$ or $j>n$; $1+L(i+1,j+1)$ if $A_i=B_j$; else $\max(L(i+1,j), L(i,j+1))$. $O(mn)$.` },
    { front: 'LIS in O(n²)', back: String.raw`LISfirst(i) $= 1 + \max\{\text{LISfirst}(j) : j > i, A[j] > A[i]\}$ with sentinel $A[0]=-\infty$; fill i from n down to 0; answer LISfirst(0) − 1.` },
    { front: 'Subset sum DP', back: String.raw`SS(i,t): True if t = 0; False if i > n; SS(i+1,t) if $X_i > t$; else SS(i+1,t) ∨ SS(i+1,t−X_i). Table $(n+1)\times(T+1)$, $O(nT)$ — pseudo-polynomial.` },
    { front: 'Longest palindromic subsequence', back: String.raw`P(i,j): 0 if i > j; 1 if i = j; $2 + P(i+1,j-1)$ if $A_i = A_j$; else $\max(P(i+1,j), P(i,j-1))$. Fill i down, j up. $O(n^2)$.` },
    { front: 'Pseudo-polynomial time', back: String.raw`Polynomial in the numeric value of the input (e.g. T) but exponential in its bit length. $O(nT)$ subset sum / knapsack.` },
    { front: 'Evaluation order for interval DPs', back: 'Entries depend on shorter intervals: fill by increasing length, or i from n down to 1 with j from i up to n.' },
    { front: 'How to reconstruct an optimal solution', back: 'Store which option achieved the min/max at each entry (or recompute it), then trace from the answer entry back to a base case.' },
    { front: 'Most common DP mistake', back: 'No (or a vague) English specification of the subproblem — the recurrence cannot be checked, and graders give little credit. Second: mismatch between the spec and the returned answer.' },
    { front: 'Maximum subarray (Kadane) as a DP', back: String.raw`MaxEnd(i) = best nonempty subarray **ending at** i: MaxEnd(1) = A[1], MaxEnd(i) = A[i] + max{0, MaxEnd(i−1)}. Answer $\max_i$ MaxEnd(i). O(n) time, O(1) space.` },
    { front: 'Longest common substring vs subsequence', back: String.raw`Substring: S(i,j) = 1 + S(i−1,j−1) if $A_i = B_j$, else **0** (reset); answer = max entry. Subsequence (LCS): on a mismatch take $\max$ of skipping either letter. Both $O(mn)$.` },
    { front: 'Shortest common supersequence', back: String.raw`SCS(i,j) on suffixes: if one is empty, the other's length; match: 1 + SCS(i+1,j+1); else 1 + min(SCS(i+1,j), SCS(i,j+1)). Length $= m + n - \text{LCS}$.` },
    { front: 'Palindrome partitioning (fewest pieces)', back: String.raw`Precompute IsPal(i,j) = $A_i = A_j \wedge$ IsPal(i+1,j−1) in $O(n^2)$. Then P(n+1) = 0, P(i) = min over palindromic A[i..j] of 1 + P(j+1). $O(n^2)$ total; cuts = P(1) − 1.` },
    { front: 'Counting ordered vs unordered coin combinations', back: String.raw`Ordered sequences: S(0) = 1, $S(t) = \sum_{d_i\le t} S(t-d_i)$. Multisets: W(i,t) = W(i+1,t) + W(i,t−d_i), W(k+1,0) = 1. For {1,2,5}, T = 5: 9 vs 4.` },
    { front: 'Extra state variable: when and how', back: 'When the future depends on something about past choices, add exactly that as a small parameter: remaining budget k, a direction/holding flag, a short counter, a remaining target t. Table size and time multiply by its range.' },
    { front: 'Subproblem shapes for sequence DPs', back: 'Prefix/suffix f(i); anchored f(i) ("starts with A[i]") with a loop over the next index; (i, j) on two strings; interval A[i..j]; last two chosen (i, j); any of these plus a small extra state.' },
    { front: 'Stock trading with at most k transactions', back: String.raw`Best(i, j, h): days i..n, j buys left, h = holding? Not holding: max(wait, $-P_i$ + Best(i+1, j−1, holding)) if j ≥ 1. Holding: max(wait, $P_i$ + Best(i+1, j, free)). Base Best(n+1, ·, free) = 0, holding = $-\infty$. O(nk).` },
    { front: 'Four tests for a good DP subproblem', back: '(1) One-sentence English definition; (2) recurrence calls the same function on smaller parameters; (3) polynomially many distinct parameter values; (4) the final answer can be read off from it.' },
    { front: 'Running time when a subroutine is expensive', back: String.raw`#entries × choices per entry × cost per choice. Memoized Splittable with an O(n)-time IsWord: $(n+1) \cdot O(n) \cdot O(n) = O(n^3)$. Precompute tables (IsPal, prefix sums, Next pointers) to make each choice O(1).` },
    { front: 'Edit distance on suffixes: base cases and answer', back: String.raw`Edit(i, j) on A[i..m], B[j..n]: Edit(m+1, j) = n − j + 1, Edit(i, n+1) = m − i + 1; answer Edit(1, 1); fill i and j decreasing. (Prefix version: Edit(0, j) = j, Edit(i, 0) = i, answer Edit(m, n).)` },
    { front: 'Evaluation order = ?', back: 'A topological order of the dependency DAG of the subproblems: every entry after everything it reads. If F(i) needs F(i+1) and F(i+1) needs F(i), there is a cycle and the recurrence is broken — rethink the subproblem.' },
    { front: 'Greedy fewest-coins counterexample', back: String.raw`Denominations {1, 3, 4}, T = 6: greedy 4 + 1 + 1 (3 coins), optimal 3 + 3 (2 coins). Use $C(t) = 1 + \min_{d_i \le t} C(t - d_i)$, C(0) = 0: $O(kT)$, pseudo-polynomial.` },
    { front: 'Prefix spec vs anchored spec', back: String.raw`"Best for A[1..i]" fails when the next choice must be compatible with the last chosen element (LIS: is A[i+1] bigger than the last element?). Anchor it: "best solution **ending at** A[i]" (or starting at), answer $\max_i$.` },
    { front: '"With at most k" pattern', back: String.raw`Add the budget left b as a parameter; the branch that spends budget calls b − 1; base case b = 0 allows only free choices; time × (k + 1). Shortcut for pure feasibility: minimize the amount used and compare with k ("at most k words" ⇔ Fewest ≤ k). "Exactly k" needs the parameter.` },
    { front: 'When is "match equal end letters" safe?', back: String.raw`Unit costs (LPS, insertions to make a palindrome, LCS): yes, by an exchange argument. Position-dependent costs: **no** — ABAA with deletion costs [1, 10, 10, 1] costs 1 (delete the last A), but forcing the outer pair costs 10. Take the min over all options.` },
    { front: 'Five-part DP answer: what the grader checks first', back: '(1) English spec with ranges + final answer, (2) recurrence with base cases and a reason, (3) memo structure, (4) evaluation order, (5) time and space. Spec and recurrence carry most of the points — write them before any pseudocode.' },
  ],
  problems: [
    {
      id: 'dp-fib-calls', type: 'written', title: 'Counting Fibonacci calls', difficulty: 1,
      prompt: String.raw`(a) Let C(n) be the number of calls (including the top one) made by RecFib(n), where RecFib(n) returns n if n < 2 and RecFib(n−1) + RecFib(n−2) otherwise. Prove that $C(n) = 2F_{n+1} - 1$ (with $F_0 = 0, F_1 = 1$).
(b) How many times is RecFib(1) called during RecFib(n)?
(c) Give an iterative O(n)-time, O(1)-space algorithm.`,
      rubric: ['Correct recurrence C(n) = 1 + C(n−1) + C(n−2), C(0) = C(1) = 1', 'Induction proof of 2F_{n+1} − 1', 'Count of RecFib(1) calls is F_n', 'Two-variable iterative algorithm'],
      hints: [String.raw`$C(0) = C(1) = 1$; check $2F_1 - 1 = 1$ and $2F_2 - 1 = 1$.`, 'The leaves of the recursion tree are calls with n ∈ {0, 1}; RecFib(n) is the sum of their return values.'],
      solution: String.raw`**(a)** $C(0) = C(1) = 1$ and $C(n) = 1 + C(n-1) + C(n-2)$ for $n \ge 2$. Claim $C(n) = 2F_{n+1} - 1$. Base: $2F_1 - 1 = 1$, $2F_2 - 1 = 1$ ✓. Step: $1 + (2F_n - 1) + (2F_{n-1} - 1) = 2(F_n + F_{n-1}) - 1 = 2F_{n+1} - 1$ ✓. Since $F_n = \Theta(\phi^n)$, the running time is exponential.

**(b)** The return value RecFib(n) = $F_n$ is the sum of the values returned by the leaves; leaves RecFib(1) return 1 and leaves RecFib(0) return 0. So RecFib(1) is called exactly $F_n$ times (for $n \ge 1$).

**(c)**
~~~pseudo
IterFib(n):
    prev = 0; cur = 1          // F(0), F(1)
    if n = 0: return 0
    repeat n - 1 times:
        (prev, cur) = (cur, prev + cur)
    return cur
~~~
O(n) additions and O(1) space, because each value depends only on the two before it.`,
    },
    {
      id: 'dp-edit-table', type: 'written', title: 'Filling an edit distance table', difficulty: 1,
      prompt: String.raw`Compute the edit distance between SUNDAY and SATURDAY by filling the full DP table Edit(i, j) (rows: prefixes of SUNDAY, columns: prefixes of SATURDAY). Then trace back an optimal alignment and list the operations.`,
      rubric: ['Correct base row/column', 'Correct table entries', 'Final answer 3', 'Valid alignment using 3 operations'],
      hints: ['Row 0 is 0..8 and column 0 is 0..6.', 'Fill row by row; each entry is the min of up+1, left+1, diagonal+(mismatch ? 1 : 0).'],
      solution: String.raw`| A \ B | ε | S | A | T | U | R | D | A | Y |
|---|---|---|---|---|---|---|---|---|---|
| ε | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| S | 1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| U | 2 | 1 | 1 | 2 | 2 | 3 | 4 | 5 | 6 |
| N | 3 | 2 | 2 | 2 | 3 | 3 | 4 | 5 | 6 |
| D | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 4 | 5 |
| A | 5 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | 4 |
| Y | 6 | 5 | 4 | 4 | 5 | 5 | 5 | 4 | 3 |

Edit(SUNDAY, SATURDAY) = **3**.

Traceback from (6, 8): Y = Y (diagonal, free) → (5,7): A = A (free) → (4,6): D = D (free) → (3,5): N vs R, value 3 came from (2,4) = 2 by substitution → (2,4): U = U (free) → (1,3): value 2 came from (1,2) = 1 by insertion of T → (1,2): from (1,1) = 0 by insertion of A → (1,1): S = S.

~~~pseudo
S - - U N D A Y
S A T U R D A Y
. i i . s . . .      -> insert A, insert T, substitute N -> R
~~~`,
    },
    {
      id: 'dp-max-score-split', type: 'written', title: 'Best-scoring segmentation', difficulty: 2,
      prompt: String.raw`You are given a string A[1..n] and a subroutine Score(i, j) that returns an integer score for the substring A[i..j] if it is a word, and $-\infty$ if it is not a word. Scores may be negative. Describe and analyze a DP algorithm that computes the maximum total score of a segmentation of A into words (or $-\infty$ if A cannot be segmented). Use the five-part format.`,
      rubric: ['English spec Best(i) for suffixes', 'Recurrence with max over j and base case Best(n+1) = 0', '1D memo array and decreasing evaluation order', 'O(n²) Score calls'],
      hints: ['Copy Splittable, replacing OR by max and True by 0.', String.raw`Be careful with $-\infty$: $-\infty + x = -\infty$.`],
      solution: String.raw`1. **Spec.** For $1 \le i \le n+1$, Best(i) = the maximum total score of a segmentation of the suffix A[i..n] into words, or $-\infty$ if none exists. Answer: Best(1).
2. **Recurrence.**
$$\text{Best}(i) = \begin{cases}0 & i = n+1\\ \max_{i \le j \le n}\big(\text{Score}(i,j) + \text{Best}(j+1)\big) & \text{otherwise}\end{cases}$$
(Non-words contribute $-\infty$, so they never win the max unless nothing works.) Justification: the first word of any segmentation of A[i..n] is A[i..j] for some j, and the rest must be an optimal segmentation of A[j+1..n].
3. **Memo.** Array Best[1..n+1].
4. **Order.** Best[i] depends on Best[j+1] with j + 1 > i: fill i from n + 1 down to 1.
5. **Time/space.** n + 1 entries, O(n) Score calls each: $O(n^2)$ time (counting Score calls as O(1)), O(n) space.

~~~pseudo
BestSplit(A[1..n]):
    Best[n+1] = 0
    for i = n down to 1:
        Best[i] = -infinity
        for j = i to n:
            Best[i] = max(Best[i], Score(i, j) + Best[j+1])
    return Best[1]
~~~`,
    },
    {
      id: 'dp-coin-change', type: 'written', title: 'Fewest coins', difficulty: 2,
      prompt: String.raw`Given coin denominations $d_1, \dots, d_k$ (positive integers, unlimited supply of each) and a target T, find the minimum number of coins that sum to exactly T, or report that it is impossible. (a) Show that the greedy algorithm (always take the largest coin that fits) is not optimal for denominations {1, 3, 4}. (b) Give a DP in the five-part format. (c) Is your algorithm polynomial time?`,
      rubric: ['Greedy counterexample (T = 6: greedy 4+1+1, optimal 3+3)', 'Spec MinCoins(t) and recurrence with ∞ for impossible', 'Evaluation order t increasing', 'O(kT) time, O(T) space; pseudo-polynomial'],
      hints: ['The last coin used is one of the k denominations.', 'MinCoins(0) = 0.'],
      solution: String.raw`**(a)** T = 6: greedy takes 4, then 1, then 1 (3 coins), but 3 + 3 uses 2 coins.

**(b)**
1. **Spec.** For $0 \le t \le T$, MinCoins(t) = the minimum number of coins with total exactly t, or $\infty$ if impossible. Answer: MinCoins(T) (report impossible if $\infty$).
2. **Recurrence.**
$$\text{MinCoins}(t) = \begin{cases}0 & t = 0\\ 1 + \min\{\text{MinCoins}(t - d_i) : d_i \le t\} & t > 0\end{cases}$$
with $\min\emptyset = \infty$. Justification: any nonempty multiset of coins summing to t contains some coin $d_i$; removing it leaves a multiset summing to $t - d_i$, which should be optimal.
3. **Memo.** Array MinCoins[0..T].
4. **Order.** Entry t depends on smaller entries: t from 0 up to T.
5. **Time/space.** T + 1 entries × O(k) each: $O(kT)$ time, $O(T)$ space.

**(c)** No — $O(kT)$ is **pseudo-polynomial**: the input has size about $k\log(\max d_i) + \log T$, and T is exponential in $\log T$. (The general problem is NP-hard.)`,
    },
    {
      id: 'dp-lps', type: 'written', title: 'Longest palindromic subsequence', difficulty: 2,
      prompt: String.raw`Give a complete DP solution (five parts) for the length of the longest palindromic subsequence of A[1..n], including a justification of each case of the recurrence. Then compute it for A = CHARACTER.`,
      rubric: ['Interval spec LPS(i, j)', 'Base cases i > j and i = j', 'Equal-ends case justified by exchange argument; unequal-ends case justified', 'Valid evaluation order (i decreasing, j increasing)', 'O(n²) time/space; answer 5 for CHARACTER'],
      hints: ['If A[i] ≠ A[j], they cannot both be in a palindromic subsequence of A[i..j] as its two ends... why?', 'CARAC is a palindromic subsequence of CHARACTER.'],
      solution: String.raw`1. **Spec.** For $1 \le i \le n+1$ and $i - 1 \le j \le n$, LPS(i, j) = the length of the longest palindromic subsequence of A[i..j] (0 for the empty interval). Answer: LPS(1, n).
2. **Recurrence.**
$$\text{LPS}(i,j)=\begin{cases}0 & i > j\\1 & i = j\\2+\text{LPS}(i+1,j-1) & i<j,\ A[i]=A[j]\\ \max\{\text{LPS}(i+1,j),\ \text{LPS}(i,j-1)\} & i<j,\ A[i]\ne A[j]\end{cases}$$
*Justification.* Let P be a longest palindromic subsequence of A[i..j] with $i<j$. If A[i] and A[j] are both used, they must be P's first and last characters (nothing precedes A[i] or follows A[j] in the interval), so they are equal. Hence if $A[i] \ne A[j]$, one of them is unused and P lies in A[i+1..j] or A[i..j−1]. If $A[i] = A[j] = c$: if P has at most one character, the subsequence A[i]A[j] = cc is at least as long. Otherwise P's first and last characters (at positions $p < q$, with $i \le p$ and $q \le j$) are equal because P is a palindrome; replace position p by i and position q by j. The result is c, then the middle of P, then c — still a palindrome of the same length. So some optimal P uses both ends, and its middle is a palindromic subsequence of A[i+1..j−1], giving $2 + \text{LPS}(i+1, j-1)$ (and this value is achievable).
3. **Memo.** 2D array LPS[1..n+1][0..n].
4. **Order.** (i, j) depends on (i+1, j−1), (i+1, j), (i, j−1): fill i from n down to 1, and for each i, j from i to n (entries with $j = i - 1$ are the base case 0).
5. **Time/space.** $O(n^2)$ entries, O(1) each: $O(n^2)$ time and space.

**CHARACTER** (C H A R A C T E R): CARAC (positions 1, 3, 4, 5, 6) is a palindromic subsequence of length 5; the table gives LPS(1, 9) = **5**.`,
    },
    {
      id: 'dp-shuffle', type: 'written', title: 'Is it a shuffle?', difficulty: 2,
      prompt: String.raw`A string C is a **shuffle** of strings A and B if C can be obtained by interleaving the characters of A and B while keeping each string's characters in order. E.g. BANANAANANAS is a shuffle of BANANA and ANANAS. Given A[1..m], B[1..n] and C[1..m+n], describe and analyze a DP algorithm that decides whether C is a shuffle of A and B.`,
      rubric: ['Spec Sh(i, j) on prefixes, with C[1..i+j]', 'Recurrence with both options, guarded by character equality', 'Base case Sh(0, 0) = True and boundary handling', 'O(mn) time'],
      hints: ['The last character of C[1..i+j] came from A[i] or from B[j].', 'Greedy (take from A whenever possible) fails when A[i] = B[j].'],
      solution: String.raw`1. **Spec.** For $0 \le i \le m$, $0 \le j \le n$: Sh(i, j) = True iff C[1..i+j] is a shuffle of A[1..i] and B[1..j]. Answer: Sh(m, n).
2. **Recurrence.**
$$\text{Sh}(i,j) = \begin{cases}\text{True} & i = j = 0\\ \big(i > 0 \wedge A[i] = C[i+j] \wedge \text{Sh}(i-1,j)\big) \vee \big(j>0 \wedge B[j]=C[i+j]\wedge \text{Sh}(i,j-1)\big) & \text{otherwise}\end{cases}$$
*Justification:* in any interleaving of A[1..i] and B[1..j], the last character comes from A (then it is A[i]) or from B (then it is B[j]), and removing it leaves an interleaving of the shorter prefixes.
3. **Memo.** Boolean array Sh[0..m][0..n].
4. **Order.** Entry (i, j) depends on (i−1, j) and (i, j−1): row-major order, i from 0 to m and j from 0 to n.
5. **Time/space.** $O(mn)$ time and space ($O(n)$ space with two rows).

(Checking $\lvert C\rvert = m + n$ first is required; and a greedy choice is wrong: with A = AB, B = AC, C = ACAB, taking C[1] from A leads to a dead end.)`,
    },
    {
      id: 'dp-convex', type: 'written', title: 'Longest convex subsequence', difficulty: 3,
      prompt: String.raw`A sequence $X[1..k]$ is **convex** if $X[i] - X[i-1] < X[i+1] - X[i]$ for every $1 < i < k$ (differences strictly increase). Every sequence of length at most 2 is convex. Describe and analyze an algorithm that computes the length of the longest convex subsequence of an array A[1..n] of integers.`,
      rubric: ['Recognizes the subproblem needs the last TWO chosen indices', 'English spec LCX(i, j) for i < j', 'Correct recurrence and base value 2', 'Correct final answer (handles n ≤ 2)', 'O(n²) subproblems × O(n) = O(n³) time, O(n²) space, valid evaluation order'],
      hints: ['Whether A[k] can follow depends on the previous two elements of the subsequence, not just the last one.', String.raw`Define LCX(i, j) = longest convex subsequence of A[i..n] whose first two elements are A[i] and A[j].`],
      solution: String.raw`To extend a convex subsequence we need its last difference, i.e. its last two elements; using the "jump" formulation on suffixes, we fix the first two.

1. **Spec.** For $1 \le i < j \le n$, LCX(i, j) = the length of the longest convex subsequence of A[i..n] whose first two elements are A[i] and A[j] (in positions i and j). Answer: n if $n \le 2$; otherwise $\max_{1 \le i < j \le n}\text{LCX}(i, j)$.
2. **Recurrence.**
$$\text{LCX}(i,j) = 1 + \max\big(\{1\} \cup \{\text{LCX}(j,k) : j < k \le n,\ A[k] - A[j] > A[j] - A[i]\}\big)$$
The option 1 corresponds to stopping after A[j] (length 2). *Justification:* a convex subsequence starting A[i], A[j] is either just those two, or continues with some A[k] ($k > j$) such that the difference increases; the remainder starting with A[j], A[k] must itself be convex (the convexity conditions of the whole sequence are exactly the condition at A[j] plus those of the remainder), and conversely any such combination is convex.
3. **Memo.** 2D array LCX[1..n][1..n] (only $i < j$ used).
4. **Order.** LCX(i, j) depends on LCX(j, k) whose first index j is larger than i. Fill i from n − 1 down to 1; for each i, j in any order (say j from n down to i + 1).
5. **Time/space.** $O(n^2)$ entries, O(n) each: $O(n^3)$ time, $O(n^2)$ space.

~~~pseudo
LongestConvex(A[1..n]):
    if n <= 2: return n
    best = 2
    for i = n-1 down to 1:
        for j = n down to i+1:
            LCX[i][j] = 2
            for k = j+1 to n:
                if A[k] - A[j] > A[j] - A[i]:
                    LCX[i][j] = max(LCX[i][j], 1 + LCX[j][k])
            best = max(best, LCX[i][j])
    return best
~~~`,
    },
    {
      id: 'dp-bitonic', type: 'written', title: 'Longest bitonic subsequence', difficulty: 3,
      prompt: String.raw`A sequence is **bitonic** if it is strictly increasing and then strictly decreasing, i.e. $x_1 < x_2 < \dots < x_p > x_{p+1} > \dots > x_k$ for some $1 \le p \le k$ (either part may consist of just the peak). Describe and analyze an $O(n^2)$ algorithm for the length of the longest bitonic subsequence of A[1..n]. Example: for A = [1, 11, 2, 10, 4, 5, 2, 1] the answer is 6 (1, 2, 10, 4, 2, 1).`,
      rubric: ['Two DP tables: longest increasing ending at i and longest decreasing starting at i', 'Correct recurrences and evaluation orders', 'Combines as max over peak i of Inc(i) + Dec(i) − 1', 'O(n²) time, O(n) space'],
      hints: ['Fix the peak position p. The part before the peak and the part after are independent.', 'Inc(i) = longest increasing subsequence ending at A[i]; Dec(i) = longest decreasing subsequence starting at A[i].'],
      solution: String.raw`Fix the peak A[p]: a bitonic subsequence with peak at position p is an increasing subsequence ending at A[p] glued to a decreasing subsequence starting at A[p] (sharing A[p]). The two halves use disjoint index ranges (< p and > p), so they can be optimized independently.

1. **Spec.** For $1 \le i \le n$: Inc(i) = length of the longest strictly increasing subsequence of A[1..i] that **ends** with A[i]; Dec(i) = length of the longest strictly decreasing subsequence of A[i..n] that **starts** with A[i]. Answer: $\max_{1\le p\le n}\big(\text{Inc}(p) + \text{Dec}(p) - 1\big)$ (0 if n = 0).
2. **Recurrences.**
$$\text{Inc}(i) = 1 + \max\big(\{0\}\cup\{\text{Inc}(h) : h < i,\ A[h] < A[i]\}\big)$$
$$\text{Dec}(i) = 1 + \max\big(\{0\}\cup\{\text{Dec}(j) : j > i,\ A[j] < A[i]\}\big)$$
3. **Memo.** Arrays Inc[1..n] and Dec[1..n].
4. **Order.** Inc: i from 1 up to n. Dec: i from n down to 1. Then one pass for the max.
5. **Time/space.** 2n entries, O(n) each: $O(n^2)$ time, O(n) space.

Example A = [1, 11, 2, 10, 4, 5, 2, 1]: Inc = [1, 2, 2, 3, 3, 4, 2, 1], Dec = [1, 5, 2, 4, 3, 3, 2, 1]. Sums minus 1: [1, 6, 3, 6, 5, 6, 3, 1], so the answer is 6.`,
    },
    {
      id: 'dp-linear-partition', type: 'written', title: 'Fair partition into k blocks', difficulty: 3,
      prompt: String.raw`You are given positive integers A[1..n] (e.g. page counts of chapters) and an integer $1 \le k \le n$. Split A into k nonempty **contiguous** blocks (k volumes) so that the **largest block sum is as small as possible**. Describe and analyze a DP algorithm for the optimal value.`,
      rubric: ['Spec with two parameters: prefix length and number of blocks', 'Recurrence: min over the start of the last block of max(previous, last block sum)', 'Base cases (one block; impossible when fewer elements than blocks)', 'Prefix sums for O(1) block sums', 'O(kn²) time, O(kn) space, valid order'],
      hints: ['Consider the last block A[j+1..i]. What remains is a smaller instance with one fewer block.', 'Precompute prefix sums S[i] = A[1] + ... + A[i].'],
      solution: String.raw`Precompute prefix sums $S[0] = 0$, $S[i] = S[i-1] + A[i]$, so the sum of A[j+1..i] is $S[i] - S[j]$.

1. **Spec.** For $1 \le \ell \le k$ and $\ell \le i \le n$: P(i, ℓ) = the minimum, over all ways to split the prefix A[1..i] into exactly ℓ nonempty contiguous blocks, of the largest block sum. Answer: P(n, k).
2. **Recurrence.**
$$P(i, \ell) = \begin{cases} S[i] & \ell = 1\\ \min_{\ell - 1 \le j \le i-1} \max\{P(j, \ell - 1),\ S[i] - S[j]\} & \ell \ge 2\end{cases}$$
*Justification:* in any split of A[1..i] into ℓ blocks, the last block is A[j+1..i] for some j with $\ell - 1 \le j \le i - 1$ (the first j elements must form ℓ − 1 nonempty blocks), and its cost is the max of the last block's sum and the cost of the split of A[1..j]; the latter should be optimal, since max is monotone.
3. **Memo.** 2D array P[1..n][1..k].
4. **Order.** P(i, ℓ) depends on P(j, ℓ − 1): fill ℓ from 1 to k (outer loop), any order of i within a column.
5. **Time/space.** O(kn) entries, O(n) each: $O(kn^2)$ time, O(kn) space (O(n) if you keep two columns).

(Because the numbers are positive, "exactly k nonempty blocks" and "at most k blocks" give the same optimum. Binary search on the answer with a greedy feasibility check is an alternative $O(n\log S)$ algorithm.)`,
    },
    {
      id: 'dp-edit-code', type: 'code', title: 'Edit distance', difficulty: 2,
      prompt: String.raw`Write <code>editDistance(a, b)</code> returning the minimum number of single-character insertions, deletions and substitutions needed to turn string a into string b. Use the $O(mn)$ DP.`,
      fn: 'editDistance',
      starter: 'function editDistance(a, b) {\n  // Edit[i][j] = distance between a[0..i) and b[0..j)\n}\n',
      reference: function (a, b) {
        const m = a.length, n = b.length;
        let prev = [];
        for (let j = 0; j <= n; j++) prev.push(j);
        for (let i = 1; i <= m; i++) {
          const cur = [i];
          for (let j = 1; j <= n; j++) {
            cur.push(Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
          }
          prev = cur;
        }
        return prev[n];
      },
      tests: [['FOOD', 'MONEY'], ['KITTEN', 'SITTING'], ['', 'abc'], ['abc', ''], ['', ''], ['ALGORITHM', 'ALTRUISTIC'], ['SUNDAY', 'SATURDAY'], ['same', 'same']],
      gen: () => {
        const r = () => { let s = ''; const L = Math.floor(Math.random() * 9); for (let i = 0; i < L; i++) s += 'abc'[Math.floor(Math.random() * 3)]; return s; };
        return [r(), r()];
      },
      hints: ['Base cases: Edit(i, 0) = i and Edit(0, j) = j.', 'Edit(i, j) = min(up + 1, left + 1, diagonal + (a[i−1] ≠ b[j−1])).'],
      solution: String.raw`~~~js
function editDistance(a, b) {
  const m = a.length, n = b.length;
  let prev = [];
  for (let j = 0; j <= n; j++) prev.push(j);        // row 0
  for (let i = 1; i <= m; i++) {
    const cur = [i];                                 // column 0
    for (let j = 1; j <= n; j++)
      cur.push(Math.min(prev[j] + 1,                 // delete a[i-1]
                        cur[j - 1] + 1,              // insert b[j-1]
                        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
    prev = cur;
  }
  return prev[n];
}
~~~
Row-major order with two rows: $O(mn)$ time, $O(n)$ space.`,
    },
    {
      id: 'dp-lcs-code', type: 'code', title: 'Longest common subsequence', difficulty: 2,
      prompt: String.raw`Write <code>lcsLength(a, b)</code> returning the length of the longest common subsequence of strings a and b.`,
      fn: 'lcsLength',
      starter: 'function lcsLength(a, b) {\n  // L[i][j] = LCS of suffixes a[i..] and b[j..]\n}\n',
      reference: function (a, b) {
        const m = a.length, n = b.length;
        const L = [];
        for (let i = 0; i <= m; i++) L.push(new Array(n + 1).fill(0));
        for (let i = m - 1; i >= 0; i--)
          for (let j = n - 1; j >= 0; j--)
            L[i][j] = a[i] === b[j] ? 1 + L[i + 1][j + 1] : Math.max(L[i + 1][j], L[i][j + 1]);
        return L[0][0];
      },
      tests: [['ABCBDAB', 'BDCABA'], ['', 'abc'], ['abc', 'abc'], ['abc', 'def'], ['AGGTAB', 'GXTXAYB'], ['aaaa', 'aa']],
      gen: () => {
        const r = () => { let s = ''; const L = Math.floor(Math.random() * 10); for (let i = 0; i < L; i++) s += 'ab'[Math.floor(Math.random() * 2)]; return s; };
        return [r(), r()];
      },
      hints: ['L(i, j) = 0 if either suffix is empty.', 'If a[i] = b[j], L(i, j) = 1 + L(i+1, j+1); otherwise the max of skipping either character.'],
      solution: String.raw`~~~js
function lcsLength(a, b) {
  const m = a.length, n = b.length;
  const L = [];
  for (let i = 0; i <= m; i++) L.push(new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      L[i][j] = a[i] === b[j] ? 1 + L[i + 1][j + 1]
                              : Math.max(L[i + 1][j], L[i][j + 1]);
  return L[0][0];
}
~~~
Both indices decreasing so that (i+1, ·) and (·, j+1) are ready. $O(mn)$ time and space.`,
    },
    {
      id: 'dp-lis-code', type: 'code', title: 'LIS length in O(n²)', difficulty: 1,
      prompt: String.raw`Write <code>lisLength(A)</code> returning the length of the longest **strictly** increasing subsequence of the array A (0 for an empty array). Use the $O(n^2)$ DP.`,
      fn: 'lisLength',
      starter: 'function lisLength(A) {\n  // return the length of the longest strictly increasing subsequence\n}\n',
      reference: function (A) {
        const n = A.length;
        const L = new Array(n).fill(1);
        let best = 0;
        for (let i = n - 1; i >= 0; i--) {
          for (let j = i + 1; j < n; j++) if (A[j] > A[i] && L[j] + 1 > L[i]) L[i] = L[j] + 1;
          if (L[i] > best) best = L[i];
        }
        return best;
      },
      tests: [[[3, 1, 4, 1, 5, 9, 2, 6]], [[]], [[5, 4, 3]], [[1, 2, 3, 4]], [[2, 2, 2]], [[10, 9, 2, 5, 3, 7, 101, 18]]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 13) }, () => Math.floor(Math.random() * 20))],
      hints: ['LISfirst(i) = 1 + max over j > i with A[j] > A[i] of LISfirst(j).', 'The answer is the max over all i (or 0 if empty).'],
      solution: String.raw`~~~js
function lisLength(A) {
  const n = A.length;
  const L = new Array(n).fill(1);      // L[i] = LISfirst(i)
  let best = 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j < n; j++)
      if (A[j] > A[i] && L[j] + 1 > L[i]) L[i] = L[j] + 1;
    best = Math.max(best, L[i]);
  }
  return best;
}
~~~
Strictness matters: [2, 2, 2] has LIS length 1. $O(n^2)$ time, O(n) space.`,
    },
    {
      id: 'dp-coins-code', type: 'code', title: 'Fewest coins', difficulty: 2,
      prompt: String.raw`Write <code>minCoins(coins, T)</code> returning the minimum number of coins (unlimited supply of each positive denomination in <code>coins</code>) that sum to exactly T (T ≥ 0), or <code>-1</code> if it is impossible.`,
      fn: 'minCoins',
      starter: 'function minCoins(coins, T) {\n  // M[t] = fewest coins summing to t (Infinity if impossible)\n}\n',
      reference: function (coins, T) {
        const M = new Array(T + 1).fill(Infinity);
        M[0] = 0;
        for (let t = 1; t <= T; t++)
          for (const c of coins) if (c <= t && M[t - c] + 1 < M[t]) M[t] = M[t - c] + 1;
        return M[T] === Infinity ? -1 : M[T];
      },
      tests: [[[1, 3, 4], 6], [[2], 3], [[1, 5, 10, 25], 63], [[5, 7], 0], [[5, 7], 24], [[5, 7], 23], [[], 4]],
      gen: () => {
        const k = 1 + Math.floor(Math.random() * 4);
        const coins = Array.from({ length: k }, () => 1 + Math.floor(Math.random() * 12));
        return [coins, Math.floor(Math.random() * 60)];
      },
      hints: ['M[0] = 0; M[t] = 1 + min over coins c ≤ t of M[t − c].', 'Fill t from 1 up to T and use Infinity for impossible amounts.'],
      solution: String.raw`~~~js
function minCoins(coins, T) {
  const M = new Array(T + 1).fill(Infinity);
  M[0] = 0;
  for (let t = 1; t <= T; t++)
    for (const c of coins)
      if (c <= t && M[t - c] + 1 < M[t]) M[t] = M[t - c] + 1;
  return M[T] === Infinity ? -1 : M[T];
}
~~~
$O(kT)$ time (pseudo-polynomial), $O(T)$ space. For [1, 3, 4] and T = 6 the answer is 2 (3 + 3), which greedy misses. [5, 7] with T = 23: no combination works (23 − 7a must be a multiple of 5 for a ∈ {0..3}: 23, 16, 9, 2 — none are), so −1.`,
    },
    {
      id: 'dp-alternating', type: 'written', title: 'Longest alternating subsequence', difficulty: 2,
      prompt: String.raw`A sequence $x_1, \dots, x_k$ is **alternating** if its consecutive differences $x_{t+1} - x_t$ are all nonzero and alternate in sign (up, down, up, … or down, up, down, …). Every sequence of length at most 1 is alternating, and a sequence of length 2 is alternating iff its two elements differ. Describe and analyze an $O(n^2)$-time algorithm for the length of the longest alternating subsequence of A[1..n]. Example: for A = [1, 17, 5, 10, 13, 15, 10, 5, 16, 8] the answer is 7.`,
      rubric: ['Two anchored functions (next step up / next step down) with clear English specs', 'Recurrences that switch between the two functions, with the "stop here" option giving 1', 'Final answer as a max over all start positions (0 for n = 0)', 'Valid order (i decreasing) and O(n²) time, O(n) space'],
      hints: ['Whether A[k] may follow A[j] depends on the direction of the step into A[j]. Keep one function per direction.', 'Up(i) = longest alternating subsequence of A[i..n] that starts with A[i] and whose first step (if any) goes up.'],
      solution: String.raw`After an up-step the next step must go down and vice versa, so we track the direction of the *first* step of a subsequence anchored at A[i].

1. **Spec.** For $1 \le i \le n$: Up(i) = the length of the longest alternating subsequence of A[i..n] that starts with A[i] and whose first step (if it has at least two elements) goes **up**; Down(i) = the same with a first step **down**. Answer: $\max_{1 \le i \le n}\max\{\text{Up}(i), \text{Down}(i)\}$, or 0 if n = 0.
2. **Recurrence.**
$$\text{Up}(i) = 1 + \max\big(\{0\} \cup \{\text{Down}(j) : i < j \le n,\ A[j] > A[i]\}\big)$$
$$\text{Down}(i) = 1 + \max\big(\{0\} \cup \{\text{Up}(j) : i < j \le n,\ A[j] < A[i]\}\big)$$
*Justification.* A subsequence counted by Up(i) is either A[i] alone (length 1) or A[i] followed by some A[j] > A[i], j > i; the part starting at A[j] must then begin with a down-step (or be just A[j]), which is exactly what Down(j) measures, and any such part can be attached. Symmetrically for Down.
3. **Memo.** Two arrays Up[1..n], Down[1..n].
4. **Order.** Both entries at i read entries at j > i: fill i from n down to 1, computing Up[i] and Down[i] together.
5. **Time/space.** 2n entries × O(n) = $O(n^2)$ time, O(n) space.

**Example.** For [1, 17, 5, 10, 13, 15, 10, 5, 16, 8], one optimal subsequence is 1, 17, 5, 10, 5, 16, 8 (up, down, up, down, up, down): length **7**.

(There is also a clever O(n) greedy — count the "turning points" — but the DP is what you should be able to derive and prove.)`,
    },
    {
      id: 'dp-k-drops', type: 'written', title: 'Longest subsequence with at most k drops', difficulty: 3,
      prompt: String.raw`In a sequence $x_1, \dots, x_m$, call a position t ($1 \le t < m$) a **drop** if $x_{t+1} \le x_t$. So a strictly increasing sequence has no drops. Given A[1..n] and an integer $0 \le k \le n$, describe and analyze an algorithm that computes the length of the longest subsequence of A with at most k drops. Example: for A = [5, 1, 6, 2, 7, 3] the answers for k = 0, 1, 2 are 3, 4, 5.`,
      rubric: ['Two-parameter spec: start index (anchored) and remaining drop budget', 'Recurrence: next element bigger keeps the budget; otherwise spends one drop (only if budget ≥ 1)', 'Base value 1 (stop after A[i]); answer max over i', 'Memo n × (k+1), order i decreasing', 'O(n²k) time, O(nk) space'],
      hints: ['This is LISfirst plus a budget. What must the rest of the subsequence know about the drops used so far?', String.raw`Define LD(i, d) = longest subsequence of A[i..n] that starts with A[i] and has at most d drops.`],
      solution: String.raw`1. **Spec.** For $1 \le i \le n$ and $0 \le d \le k$: LD(i, d) = the length of the longest subsequence of A[i..n] that starts with A[i] and has at most d drops. Answer: $\max_{1 \le i \le n} \text{LD}(i, k)$ (0 if n = 0).
2. **Recurrence.**
$$\text{LD}(i,d) = 1 + \max\Big(\{0\} \cup \{\text{LD}(j, d) : j > i,\ A[j] > A[i]\} \cup \{\text{LD}(j, d-1) : j > i,\ A[j] \le A[i],\ d \ge 1\}\Big)$$
*Justification.* Either the subsequence stops after A[i], or its next element is some A[j] with j > i. If $A[j] > A[i]$ the step i → j is not a drop and the rest (starting at A[j]) may use all d drops; otherwise the step is a drop, allowed only if $d \ge 1$, and the rest may use $d - 1$. The rest should be as long as possible.
3. **Memo.** 2D array LD[1..n][0..k].
4. **Order.** LD(i, ·) reads only rows j > i: i from n down to 1; within a row, any order of d.
5. **Time/space.** $n(k+1)$ entries, O(n) each: $O(n^2k)$ time, $O(nk)$ space. (Since k ≥ n − 1 makes the answer n, this is at most $O(n^3)$: truly polynomial.)

**Example.** A = [5, 1, 6, 2, 7, 3]: k = 0 gives 3 (e.g. 1, 2, 3); k = 1 gives 4 (1, 6, 2, 7: one drop 6 → 2); k = 2 gives 5 (5, 6, 2, 7, 3).`,
    },
    {
      id: 'dp-scs', type: 'written', title: 'Shortest common supersequence', difficulty: 2,
      prompt: String.raw`A **common supersequence** of strings A[1..m] and B[1..n] is a string that contains both A and B as subsequences. (a) Give a five-part DP for the length of the shortest common supersequence (SCS). (b) Prove that this length equals $m + n - \text{LCS}(A, B)$. (c) Explain how to output an SCS. (d) Find one for A = ABCBDAB, B = BDCABA.`,
      rubric: ['Suffix (or prefix) spec SCS(i, j)', 'Base cases when one suffix is empty; match case 1 + SCS(i+1, j+1); mismatch case 1 + min', 'Order and O(mn) time', 'Proof of m + n − LCS in both directions', 'Traceback and the example (length 9)'],
      hints: ['The first letter of a shortest supersequence of A[i..m] and B[j..n] is A[i] or B[j].', 'If A[i] = B[j], one letter can serve both strings.'],
      solution: String.raw`**(a)**
1. **Spec.** For $1 \le i \le m+1$, $1 \le j \le n+1$: SCS(i, j) = the length of a shortest string containing both A[i..m] and B[j..n] as subsequences. Answer SCS(1, 1).
2. **Recurrence.**
$$\text{SCS}(i,j) = \begin{cases} n - j + 1 & i = m+1\\ m - i + 1 & j = n+1 \text{ (and } i \le m)\\ 1 + \text{SCS}(i+1, j+1) & A[i] = B[j]\\ 1 + \min\{\text{SCS}(i+1, j),\ \text{SCS}(i, j+1)\} & \text{otherwise}\end{cases}$$
The first letter of an optimal supersequence must be A[i] or B[j] (any other first letter could be deleted). If $A[i] = B[j]$, that letter can be the first letter of both embeddings (an exchange argument like LCS's); otherwise it serves exactly one of them.
3. **Memo.** SCS[1..m+1][1..n+1].
4. **Order.** i from m + 1 down to 1, j from n + 1 down to 1.
5. **Time/space.** $O(mn)$.

**(b)** *(≤)* Take an LCS of length ℓ and insert the other $m - \ell$ letters of A and $n - \ell$ letters of B in the right places: a supersequence of length $m + n - \ell$. *(≥)* Given any common supersequence S of length s, fix embeddings of A and B into S. Every position of S is used by A, by B, or by both (otherwise delete it); the positions used by both spell a common subsequence of length at most ℓ. So $s \ge m + n - \ell$.

**(c)** Trace back from (1, 1): if a suffix is empty, output the rest of the other; if $A[i] = B[j]$ output it and move diagonally; otherwise output A[i] and move to (i+1, j) if SCS(i+1, j) ≤ SCS(i, j+1), else output B[j] and move to (i, j+1).

**(d)** LCS = 4, so the SCS has length 7 + 6 − 4 = **9**; the traceback produces **ABCBDCABA**. Check: ABCBDAB embeds at positions 1, 2, 3, 4, 5, 7, 8 and BDCABA at positions 2, 5, 6, 7, 8, 9.`,
    },
    {
      id: 'dp-lcsubstring', type: 'written', title: 'Longest common substring', difficulty: 2,
      prompt: String.raw`A **substring** is a contiguous block of a string. (a) Describe and analyze an $O(mn)$ algorithm for the length of the longest common substring of A[1..m] and B[1..n]. (b) A student uses the LCS recurrence and returns LCS(1, 1). Give an example where this is wrong, and explain which part of the LCS recurrence is illegal for substrings.`,
      rubric: ['Anchored spec: longest common suffix of A[1..i] and B[1..j] (ending exactly at i and j)', 'Recurrence with reset to 0 on mismatch; answer = max over all entries', 'Order and O(mn) time, O(n) space possible', 'Counterexample where LCS ≠ longest common substring, and why skipping is illegal'],
      hints: ['"Longest common substring of the prefixes" does not give a recurrence. Anchor it: require the substring to end exactly at A[i] and B[j].', 'What happens to an anchored common substring if A[i] ≠ B[j]?'],
      solution: String.raw`**(a)**
1. **Spec.** For $0 \le i \le m$, $0 \le j \le n$: Suf(i, j) = the length of the longest common **suffix** of A[1..i] and B[1..j] (i.e. the longest common substring that ends exactly at A[i] and at B[j]). Answer: $\max_{i,j} \text{Suf}(i, j)$.
2. **Recurrence.**
$$\text{Suf}(i,j) = \begin{cases} 0 & i = 0 \text{ or } j = 0 \text{ or } A[i] \ne B[j]\\ 1 + \text{Suf}(i-1, j-1) & A[i] = B[j]\end{cases}$$
A common suffix of length L ≥ 1 needs A[i] = B[j] and a common suffix of length L − 1 of the two shorter prefixes.
3. **Memo.** Suf[0..m][0..n] (two rows suffice, plus a running max).
4. **Order.** Row-major: i increasing, j increasing.
5. **Time/space.** $O(mn)$ time, $O(mn)$ space or $O(n)$ with two rows.

**(b)** A = XABCY, B = ABZCY: the longest common substring has length 2 (AB or CY), but LCS = 4 (ABCY). The LCS recurrence's mismatch case $\max\{L(i+1, j), L(i, j+1)\}$ **skips** a character and then continues matching — fine for subsequences, illegal for substrings, which must stay contiguous. The substring version instead resets to 0 on a mismatch and takes the max over all anchors at the end.`,
    },
    {
      id: 'dp-edit-swap', type: 'written', title: 'Edit distance with adjacent swaps', difficulty: 3,
      prompt: String.raw`Typing errors often swap two adjacent letters. Consider alignments of A[1..m] with B[1..n] built from these column types: **delete** one letter of A (cost 1), **insert** one letter of B (cost 1), **match/substitute** A[i] with B[j] (cost 0 if equal, 1 otherwise), and a **swap block** that aligns the two letters A[i−1]A[i] with B[j−1]B[j] where $A[i-1] = B[j]$ and $A[i] = B[j-1]$ (cost 1). The distance is the minimum total cost.
(a) Give a five-part DP. (b) Compute the distance from ABCD to BADC, and from TRAIN to TRIAN. (c) How would you change the DP if the four operations had arbitrary costs $c_{del}$, $c_{ins}$, $c_{sub}$, $c_{swap}$?`,
      rubric: ['Prefix spec D(i, j)', 'Recurrence with four options, swap guarded by i, j ≥ 2 and the two letter equalities', 'Base cases D(i, 0) = i, D(0, j) = j', 'Row-major order, O(mn) time', 'Examples: 2 and 1; custom costs replace the constants'],
      hints: ['Look at the last block of an optimal alignment: it covers A[i] or B[j] or both — and a swap block covers two letters of each.', 'The swap option reads D(i−2, j−2).'],
      solution: String.raw`**(a)**
1. **Spec.** For $0 \le i \le m$, $0 \le j \le n$: D(i, j) = the minimum cost of an alignment of A[1..i] with B[1..j] using the four block types. Answer D(m, n).
2. **Recurrence.** D(i, 0) = i and D(0, j) = j. For $i, j \ge 1$, D(i, j) is the minimum of
   - D(i−1, j) + 1 (last block deletes A[i]),
   - D(i, j−1) + 1 (last block inserts B[j]),
   - D(i−1, j−1) + [A[i] ≠ B[j]] (last block matches or substitutes),
   - D(i−2, j−2) + 1, only if $i, j \ge 2$, $A[i-1] = B[j]$ and $A[i] = B[j-1]$ (last block is a swap).

   Removing the last block of an optimal alignment leaves an optimal alignment of the shorter prefixes, and these four are all the possible last blocks.
3. **Memo.** D[0..m][0..n].
4. **Order.** Row-major: (i, j) reads (i−1, ·) and (i−2, ·) rows and (i, j−1).
5. **Time/space.** $O(mn)$ time and space.

**(b)** ABCD → BADC: two swap blocks (AB/BA and CD/DC), distance **2** (without swaps it would be 4). TRAIN → TRIAN: match T, R, swap AI/IA, match N: distance **1**.

**(c)** Replace each constant 1 by the corresponding cost (and the 0/1 match cost by $c_{sub}\cdot[A[i] \ne B[j]]$); the recurrence, order and running time are unchanged.

*Remark.* This model never edits a swapped pair again, so e.g. CA → ABC costs 3 here (it cannot swap to AC and then insert B in between). The unrestricted "Damerau–Levenshtein" distance (which gives 2) needs a more complicated recurrence.`,
    },
    {
      id: 'dp-palpartition', type: 'written', title: 'Partition into palindromes', difficulty: 2,
      prompt: String.raw`Describe and analyze an $O(n^2)$ algorithm that computes the minimum number of pieces in a partition of A[1..n] into contiguous palindromes. Examples: ABACDC needs 2 pieces (ABA | CDC); BANANA needs 2 (B | ANANA); ABCDE needs 5. Make sure your running time accounts for checking whether a piece is a palindrome.`,
      rubric: ['Separate O(n²) table IsPal(i, j) with its own recurrence and order', 'Spec Pieces(i) for suffixes; recurrence min over palindromic first pieces; base Pieces(n+1) = 0', 'Correct order for both tables', 'Total O(n²) time (not O(n³) from naive palindrome checks)'],
      hints: ['First compute a Boolean table telling, in O(1) per query, whether A[i..j] is a palindrome.', 'Then it is a segmentation problem: the first piece is A[i..j] for some palindromic A[i..j].'],
      solution: String.raw`**Step 1: palindrome table.** IsPal(i, j) = True iff A[i..j] is a palindrome: True if $i \ge j$, otherwise $(A[i] = A[j]) \wedge \text{IsPal}(i+1, j-1)$. Store it in IsPal[1..n+1][0..n], filling i from n down to 1 and j from i up to n: $O(n^2)$ time.

**Step 2: the segmentation DP.**
1. **Spec.** For $1 \le i \le n+1$, Pieces(i) = the minimum number of palindromes in a partition of A[i..n]. Answer Pieces(1) (the minimum number of cuts is Pieces(1) − 1).
2. **Recurrence.** Pieces(n+1) = 0; for $i \le n$: $\text{Pieces}(i) = \min\{1 + \text{Pieces}(j+1) : i \le j \le n,\ \text{IsPal}(i,j)\}$. The min is never over an empty set, because the single letter A[i..i] is a palindrome.
3. **Memo.** Array Pieces[1..n+1].
4. **Order.** i from n + 1 down to 1 (after the IsPal table is complete).
5. **Time/space.** $O(n)$ entries × $O(n)$ options × O(1) lookup = $O(n^2)$, plus $O(n^2)$ for IsPal: $O(n^2)$ time and space.

Checking each piece by scanning it would cost O(n) per option and $O(n^3)$ overall — the precomputed table is what makes the bound $O(n^2)$.

Examples: ABACDC → ABA | CDC (2); BANANA → B | ANANA (2); ABCDE has no palindrome longer than one letter, so 5.`,
    },
    {
      id: 'dp-coin-counting', type: 'written', title: 'Counting ways to make change', difficulty: 2,
      prompt: String.raw`Distinct positive denominations $d_1, \dots, d_k$ are available in unlimited supply, and T is a target. (a) Give a DP for the number of **ordered sequences** of coins with total T. (b) Give a DP for the number of **multisets** of coins with total T (the usual "number of ways to make change"). (c) Compute both for {1, 2, 5} and T = 5, and explain why the recurrence in (a) overcounts multisets. (d) What are the running times, and are they polynomial?`,
      rubric: ['(a) Seq(t) = sum over last coin, Seq(0) = 1', '(b) Two-parameter spec fixing an order of denominations; recurrence Ways(i+1, t) + Ways(i, t − d_i); base cases', 'Correct orders of evaluation', 'Example values 9 and 4 with explanation', 'O(kT), pseudo-polynomial'],
      hints: ['Ordered: condition on the last coin. Unordered: decide how many coins of denomination d_1 to use, then never use d_1 again.', 'Ways(i, t) = number of multisets using only d_i, …, d_k.'],
      solution: String.raw`**(a)** Seq(t) = number of sequences of coins with total t. Seq(0) = 1 (the empty sequence) and $\text{Seq}(t) = \sum_{i : d_i \le t} \text{Seq}(t - d_i)$ for $t \ge 1$ — sequences are partitioned by their last coin. Array Seq[0..T], t increasing, $O(kT)$ time.

**(b)**
1. **Spec.** For $1 \le i \le k+1$ and $0 \le t \le T$: Ways(i, t) = the number of multisets of coins drawn from denominations $d_i, \dots, d_k$ with total exactly t. Answer Ways(1, T).
2. **Recurrence.**
$$\text{Ways}(i,t) = \begin{cases} 1 & i = k+1,\ t = 0\\ 0 & i = k+1,\ t > 0\\ \text{Ways}(i+1, t) + [d_i \le t]\cdot\text{Ways}(i, t - d_i) & i \le k\end{cases}$$
A multiset either contains no coin $d_i$ (counted by Ways(i+1, t)) or contains at least one (remove one copy: a multiset from $d_i, \dots, d_k$ with total $t - d_i$). The two cases are disjoint, so nothing is double-counted.
3. **Memo.** Ways[1..k+1][0..T].
4. **Order.** Entry (i, t) reads (i+1, t) and (i, t − d_i): i from k + 1 down to 1, and within a row t increasing.
5. **Time/space.** $O(kT)$ time, $O(kT)$ space ($O(T)$ with one row updated in place, t increasing).

**(c)** For {1, 2, 5} and T = 5: Seq = 1, 1, 2, 3, 5, **9** for t = 0..5; Ways(1, 5) = **4**: {5}, {2, 2, 1}, {2, 1, 1, 1}, {1, 1, 1, 1, 1}. Recurrence (a) conditions on the *last* coin, so the multiset {2, 2, 1} appears as 1+2+2, 2+1+2 and 2+2+1. Recurrence (b) fixes a canonical order (all $d_1$'s, then all $d_2$'s, …), so each multiset is generated once.

**(d)** Both are $O(kT)$: **pseudo-polynomial**, since T is given in $O(\log T)$ bits. (The counts themselves can be large; we treat each addition as O(1).)`,
    },
    {
      id: 'dp-stock-k', type: 'written', title: 'Stock trading with at most k transactions', difficulty: 3,
      prompt: String.raw`You know the price P[i] of a stock on each of days 1..n. A **transaction** is buying one share on some day and selling it on a later day; you may hold at most one share at a time, and you may make at most k transactions. Describe and analyze an $O(nk)$ algorithm for the maximum total profit. Example: P = [3, 2, 6, 5, 0, 3] gives 7 for k = 2 and 4 for k = 1.`,
      rubric: ['State includes day, transactions remaining, and whether a share is held', 'English spec covering all three parameters', 'Recurrence: wait / buy (spend a transaction) / sell, with correct base cases (end with no share)', 'Order: day decreasing', 'O(nk) time; answer Best(1, k, not holding)'],
      hints: ['On each day you either do nothing, or buy (if not holding), or sell (if holding). What must future days know?', 'Count a transaction when you buy.'],
      solution: String.raw`1. **Spec.** For $1 \le i \le n+1$, $0 \le j \le k$ and $h \in \{0, 1\}$: Best(i, j, h) = the maximum profit obtainable from the actions on days i..n, given that j more purchases are allowed and that we currently hold a share iff h = 1, and requiring that no share is held after day n. Answer Best(1, k, 0).
2. **Recurrence.** Base: Best(n+1, j, 0) = 0 and Best(n+1, j, 1) = $-\infty$ (an unsold share is not allowed). For $i \le n$:
$$\text{Best}(i,j,0) = \max\{\text{Best}(i+1, j, 0),\ -P[i] + \text{Best}(i+1, j-1, 1) \text{ (only if } j \ge 1)\}$$
$$\text{Best}(i,j,1) = \max\{\text{Best}(i+1, j, 1),\ P[i] + \text{Best}(i+1, j, 0)\}$$
On day i we either do nothing or change state (buy or sell); the rest of the days face exactly the situation described by the new parameters.
3. **Memo.** Array Best[1..n+1][0..k][0..1].
4. **Order.** Every entry for day i reads day i + 1: i from n + 1 down to 1; any order of j and h within a day.
5. **Time/space.** $2(n+1)(k+1)$ entries, O(1) each: $O(nk)$ time; $O(k)$ space if we keep only two days.

**Example.** P = [3, 2, 6, 5, 0, 3]. With k = 2: buy at 2, sell at 6, buy at 0, sell at 3: profit 4 + 3 = **7**. With k = 1 the best single transaction is 2 → 6: **4**.

(Forbidding a buy and sell on the same day changes nothing: such a transaction earns 0.)`,
    },
    {
      id: 'dp-jumps', type: 'written', title: 'Hopscotch with tolls', difficulty: 2,
      prompt: String.raw`Squares 1..n are in a row. Square i holds a positive integer A[i] (the longest jump allowed from it) and a toll C[i] (possibly negative, i.e. a reward), paid when you **land** on square i. You start on square 1 (no toll) and must reach square n; from square i you may jump to any square j with $i < j \le \min(n, i + A[i])$.
(a) Give a DP for the fewest jumps. (b) Give a DP for the number of different jump sequences. (c) Give a DP for the minimum total toll. (d) Evaluate all three for A = [2, 3, 1, 1, 4] and C = [0, 5, 1, 2, 0].`,
      rubric: ['Suffix specs (from square i to square n) for all three functions', 'Correct base cases at i = n and ∞ / 0 for impossible', 'Recurrences over the reachable next squares', 'Order i decreasing; O(n²) (or O(n · max A)) time', 'Example: 2 jumps, 4 ways, toll 3'],
      hints: ['From square i the first jump lands on some j in (i, i + A[i]].', 'All three DPs have the same structure; only the combining operation (min, +, min with toll) changes.'],
      solution: String.raw`All three functions are about getting from square i to square n.

1. **Specs.** For $1 \le i \le n$: Jumps(i) = the fewest jumps from i to n ($\infty$ if impossible); Ways(i) = the number of jump sequences from i to n; Toll(i) = the minimum total toll paid on the way from i to n, not counting square i itself. Answers Jumps(1), Ways(1), Toll(1).
2. **Recurrences.** Let $R(i) = \{j : i < j \le \min(n, i + A[i])\}$. Base cases Jumps(n) = 0, Ways(n) = 1, Toll(n) = 0. For $i < n$:
$$\text{Jumps}(i) = 1 + \min_{j \in R(i)} \text{Jumps}(j), \quad \text{Ways}(i) = \sum_{j \in R(i)} \text{Ways}(j), \quad \text{Toll}(i) = \min_{j \in R(i)}\big(C[j] + \text{Toll}(j)\big)$$
(R(i) is nonempty since A[i] ≥ 1 and i < n.) The first jump goes to some j ∈ R(i); the remaining trip is a trip from j. Different first jumps give different sequences, so the sum counts each sequence once.
3. **Memo.** Three arrays indexed 1..n.
4. **Order.** i from n down to 1.
5. **Time/space.** Each entry looks at $\lvert R(i)\rvert \le \min(n, A[i])$ options: $O(n^2)$ time (better, $O(\sum_i \min(A[i], n))$), O(n) space.

**(d)** A = [2, 3, 1, 1, 4], C = [0, 5, 1, 2, 0]. Fewest jumps: 1 → 2 → 5, **2** jumps. Ways: Ways(5) = 1, Ways(4) = 1, Ways(3) = 1, Ways(2) = Ways(3) + Ways(4) + Ways(5) = 3, Ways(1) = Ways(2) + Ways(3) = **4**. Toll: Toll(4) = 0, Toll(3) = 2, Toll(2) = min(1 + 2, 2 + 0, 0 + 0) = 0, Toll(1) = min(5 + 0, 1 + 2) = **3** via 1 → 3 → 4 → 5. Note that the cheapest route uses 3 jumps, not 2 — different objectives, different optima.`,
    },
    {
      id: 'dp-maxsub-deletions', type: 'written', title: 'Maximum subarray with up to k deletions', difficulty: 3,
      prompt: String.raw`Given integers A[1..n] (possibly negative) and $k \ge 0$, choose a contiguous block A[a..b] and delete at most k of its elements, keeping at least one; maximize the sum of the kept elements. (k = 0 is the ordinary maximum subarray problem.) Describe and analyze an $O(nk)$ algorithm. Example: for A = [3, −5, 4, −1, −8, 6] the answers for k = 0, 1, 2 are 6, 9 and 12.`,
      rubric: ['Anchored spec: block ending exactly at position i, at most d deletions, at least one kept element', 'Recurrence with three cases: keep A[i] alone, keep A[i] and extend, delete A[i] (d ≥ 1)', 'Base case at i = 1 and the "at least one kept" requirement', 'Answer max over i of G(i, k)', 'O(nk) time; valid order'],
      hints: ['Anchor the block at its right end i. Is A[i] kept or deleted?', 'If A[i] is deleted, what remains is a block ending at i − 1 with one fewer deletion allowed — and it must still keep something.'],
      solution: String.raw`1. **Spec.** For $1 \le i \le n$ and $0 \le d \le k$: G(i, d) = the maximum sum of kept elements over all blocks A[a..i] **ending at i** with at most d deleted elements and at least one kept element. Answer $\max_{1 \le i \le n} G(i, k)$.
2. **Recurrence.** $G(1, d) = A[1]$ (deleting the only element would keep nothing). For $i \ge 2$:
$$G(i, d) = \max\Big\{A[i],\ \ A[i] + G(i-1, d),\ \ G(i-1, d-1) \text{ (only if } d \ge 1)\Big\}$$
*Justification.* Suppose A[i] is kept. Either nothing in A[a..i−1] is kept (sum A[i]), or A[a..i−1] is a block ending at i − 1 with at most d deletions and at least one kept element, contributing at most G(i−1, d) — and any such block can be extended by A[i]. Suppose A[i] is deleted (needs d ≥ 1): then A[a..i−1] must keep at least one element using at most d − 1 deletions: G(i−1, d−1).
3. **Memo.** G[1..n][0..k].
4. **Order.** i from 1 up to n; any order of d.
5. **Time/space.** $n(k+1)$ entries, O(1) each: $O(nk)$ time; $O(k)$ space with two rows.

**Example.** A = [3, −5, 4, −1, −8, 6]. k = 0: best block [6] = 6. k = 1: block 4, −1, −8, 6 deleting −8: 9. k = 2: the whole array deleting −5 and −8: 3 + 4 − 1 + 6 = 12.

(Deleting elements at the *ends* of a block is never useful — shrink the block instead — but the recurrence doesn't need that observation.)`,
    },
    {
      id: 'dp-text-justify', type: 'written', title: 'Pretty printing (minimum-cost line breaks)', difficulty: 2,
      prompt: String.raw`A paragraph has n words with lengths $\ell_1, \dots, \ell_n$ (each at most L). It is printed in lines of width L: a line holding words i..j has length $\ell_i + \dots + \ell_j + (j - i)$ (one space between words), which must be at most L. Every line except the last costs $(L - \text{length})^2$; the last line costs 0. Describe and analyze an algorithm for the minimum total cost. Show that the greedy algorithm (put as many words as fit on each line) is not optimal, using lengths 3, 2, 2, 5 and L = 6.`,
      rubric: ['Suffix spec Cost(i): words i..n starting on a fresh line', 'Recurrence over the last word j of the first line, with fit check and the free last line', 'Prefix sums for O(1) line lengths', 'Order i decreasing; O(n²) time (or O(nL))', 'Greedy counterexample: greedy 16, optimal 10'],
      hints: ['The first line holds words i..j for some j; the rest is the same problem on words j+1..n.', 'Precompute prefix sums of the lengths so the length of a line is O(1).'],
      solution: String.raw`Let $S[0] = 0$ and $S[j] = \ell_1 + \dots + \ell_j$; the line with words i..j has length $\text{len}(i,j) = S[j] - S[i-1] + (j - i)$.

1. **Spec.** For $1 \le i \le n+1$, Cost(i) = the minimum total cost of printing words i..n, starting at the beginning of a line. Answer Cost(1).
2. **Recurrence.** Cost(n+1) = 0; for $i \le n$:
$$\text{Cost}(i) = \min_{\substack{i \le j \le n\\ \text{len}(i,j) \le L}} \big(\text{lineCost}(i,j) + \text{Cost}(j+1)\big), \qquad \text{lineCost}(i,j) = \begin{cases}0 & j = n\\ (L - \text{len}(i,j))^2 & j < n\end{cases}$$
The first line contains words i..j for some j (it must fit); the remaining words are printed optimally starting on a new line. j = i always fits since every $\ell_i \le L$.
3. **Memo.** Array Cost[1..n+1], plus prefix sums S[0..n].
4. **Order.** i from n + 1 down to 1.
5. **Time/space.** O(n) options per entry: $O(n^2)$ time (or $O(nL)$, since a line holds at most (L+1)/2 words), O(n) space. Record the best j per i to print the layout.

**Greedy fails.** Lengths 3, 2, 2, 5, L = 6. Greedy: [3 2] (length 6, cost 0), [2] (length 2, cost 16), [5] (last line, 0): total **16**. Optimal: [3] (cost 9), [2 2] (length 5, cost 1), [5] (0): total **10**. Greedy packs the first line perfectly but leaves a nearly empty middle line; squaring the slack punishes that.`,
    },
    {
      id: 'dp-balanced-partition', type: 'written', title: 'Balanced partition', difficulty: 2,
      prompt: String.raw`Given positive integers X[1..n] with total $S = \sum_i X[i]$, split them into two groups so that the difference between the group sums is as small as possible. Describe and analyze an algorithm, state whether it is polynomial, and run it on X = [7, 5, 4, 1].`,
      rubric: ['Reduces to which subset sums t are achievable', 'Correct subset-sum style spec and recurrence with base cases', 'Answer min over achievable t of |S − 2t|', 'O(nS) time, pseudo-polynomial', 'Example answer 1'],
      hints: ['If one group sums to t, the other sums to S − t.', 'Compute, for every t from 0 to S, whether some subset sums to t.'],
      solution: String.raw`If one group has sum t, the difference is $\lvert S - 2t\rvert$. So we need the set of achievable subset sums.

1. **Spec.** For $1 \le i \le n+1$ and $0 \le t \le S$: Reach(i, t) = True iff some subset of X[i..n] has sum exactly t. Answer: $\min\{\lvert S - 2t\rvert : 0 \le t \le S,\ \text{Reach}(1, t)\}$.
2. **Recurrence.** Reach(n+1, t) = [t = 0]; for $i \le n$: $\text{Reach}(i,t) = \text{Reach}(i+1, t) \vee \big(X[i] \le t \wedge \text{Reach}(i+1, t - X[i])\big)$ — X[i] is in the subset or not.
3. **Memo.** Boolean array Reach[1..n+1][0..S].
4. **Order.** i from n + 1 down to 1; any order of t.
5. **Time/space.** $O(nS)$ time and space, plus O(S) for the final scan. This is **pseudo-polynomial** (S can be exponential in the number of bits of the input); the problem (PARTITION) is NP-hard, so no polynomial algorithm is expected.

**Example.** X = [7, 5, 4, 1], S = 17. Achievable sums include 8 = 7 + 1, so the groups {7, 1} and {5, 4} differ by $\lvert 17 - 16\rvert$ = **1**. A difference of 0 is impossible because S is odd.`,
    },
    {
      id: 'dp-count-increasing', type: 'written', title: 'Counting increasing subsequences', difficulty: 2,
      prompt: String.raw`Describe and analyze an $O(n^2)$ algorithm that computes the **number** of nonempty strictly increasing subsequences of A[1..n] (subsequences are distinguished by their index sets, so equal values at different positions give different subsequences). Example: [1, 3, 2, 4] has 11.`,
      rubric: ['Anchored counting spec Cnt(i): subsequences starting with A[i]', 'Recurrence 1 + sum over valid next indices; justification that each subsequence is counted once', 'Final answer = sum over i (not max)', 'Order i decreasing; O(n²) time'],
      hints: ['Count by the first element: every increasing subsequence starts somewhere.', 'An increasing subsequence starting at A[i] is either A[i] alone or A[i] followed by one starting at some A[j] > A[i], j > i.'],
      solution: String.raw`1. **Spec.** For $1 \le i \le n$, Cnt(i) = the number of strictly increasing subsequences of A[i..n] whose first element is A[i]. Answer: $\sum_{i=1}^{n} \text{Cnt}(i)$ (every nonempty increasing subsequence has exactly one first index).
2. **Recurrence.** $\text{Cnt}(i) = 1 + \sum\{\text{Cnt}(j) : i < j \le n,\ A[j] > A[i]\}$. The 1 counts the subsequence (A[i]); every longer one is A[i] followed by an increasing subsequence starting at its second index j. Different j's give different subsequences, so nothing is counted twice.
3. **Memo.** Array Cnt[1..n].
4. **Order.** i from n down to 1.
5. **Time/space.** n entries × O(n) = $O(n^2)$ time, O(n) space. (The counts can reach $2^n - 1$, i.e. O(n) bits; we count additions as O(1).)

**Example** [1, 3, 2, 4]: Cnt(4) = 1, Cnt(3) = 1 + Cnt(4) = 2, Cnt(2) = 1 + Cnt(4) = 2, Cnt(1) = 1 + 2 + 2 + 1 = 6. Total 6 + 2 + 2 + 1 = **11**: four singletons, five pairs (13, 12, 14, 34, 24) and two triples (134, 124).

Notice the contrast with the LIS DP: same subproblems, but **sum** instead of **max**, and the answer is a sum over anchors instead of a max.`,
    },
    {
      id: 'dp-lcs3', type: 'written', title: 'LCS of three strings', difficulty: 2,
      prompt: String.raw`Describe and analyze an algorithm for the length of the longest common subsequence of three strings A[1..p], B[1..q], C[1..r]. Justify the "match" case. Why can't you simply compute LCS(LCS(A, B), C) using some longest common subsequence of A and B?`,
      rubric: ['Three-index suffix spec', 'Recurrence: all three first letters equal → 1 + diagonal; else max of skipping one of the three', 'Justification of both cases', 'O(pqr) time and space, valid order', 'Counterexample or argument for why the two-step approach fails'],
      hints: ['Generalize the suffix LCS recurrence to three indices.', 'If the three first letters are not all equal, at least one of them is not used.'],
      solution: String.raw`1. **Spec.** L(i, j, k) = the length of the longest common subsequence of A[i..p], B[j..q] and C[k..r], for $1 \le i \le p+1$, $1 \le j \le q+1$, $1 \le k \le r+1$. Answer L(1, 1, 1).
2. **Recurrence.**
$$L(i,j,k) = \begin{cases} 0 & i > p \text{ or } j > q \text{ or } k > r\\ 1 + L(i+1, j+1, k+1) & A[i] = B[j] = C[k]\\ \max\{L(i+1,j,k),\ L(i,j+1,k),\ L(i,j,k+1)\} & \text{otherwise}\end{cases}$$
*Justification.* If one of A[i], B[j], C[k] is used in a common subsequence at all, it must be matched to the subsequence's first letter (it is the first letter of its suffix). If the three letters are not all equal, they can't all be matched to that first letter, so at least one is unused and can be dropped. If all three are equal, take any optimal common subsequence and replace the positions of its first letter in each string by i, j, k: still valid, same length — so matching is safe.
3. **Memo.** 3D array L[1..p+1][1..q+1][1..r+1].
4. **Order.** All three indices decreasing (nested loops i, then j, then k, each from its max down to 1).
5. **Time/space.** $O(pqr)$ time and space.

**Example.** ABCBDAB, BDCABA, BADACB have a common subsequence BDAB, and the DP confirms 4 is optimal.

**Two-step fails** because the LCS of A and B isn't unique and a particular choice may be useless for C: A = AB, B = BA, C = A. A longest common subsequence of A and B could be "B", and "B" has no common letter with C — yet "A" is a common subsequence of all three strings, so the answer is 1.`,
    },
    {
      id: 'dp-decode-code', type: 'code', title: 'Count decodings of a digit string', difficulty: 2,
      prompt: String.raw`Letters are encoded as numbers: A = 1, B = 2, …, Z = 26, and a message is written as the concatenation of these numbers. Write <code>numDecodings(s)</code> returning the number of ways to decode the digit string s (codes have no leading zeros, so "06" is not a code, but "10" and "20" are). The empty string has exactly one decoding. Examples: "226" → 3, "06" → 0, "10" → 1.`,
      fn: 'numDecodings',
      starter: 'function numDecodings(s) {\n  // D[i] = number of decodings of the suffix s[i..]\n}\n',
      reference: function (s) {
        const n = s.length;
        const D = new Array(n + 2).fill(0);
        D[n] = 1;
        for (let i = n - 1; i >= 0; i--) {
          if (s[i] === '0') { D[i] = 0; continue; }
          D[i] = D[i + 1];
          if (i + 1 < n && (s[i] === '1' || (s[i] === '2' && s[i + 1] <= '6'))) D[i] += D[i + 2];
        }
        return D[0];
      },
      tests: [['12'], ['226'], ['06'], [''], ['10'], ['101'], ['2626'], ['1111111111'], ['27'], ['110'], ['1201234'], ['0'], ['100']],
      gen: () => {
        const L = Math.floor(Math.random() * 16);
        let s = '';
        for (let i = 0; i < L; i++) s += '0112223456789'[Math.floor(Math.random() * 13)];
        return [s];
      },
      hints: ['D(n) = 1 for the empty suffix. A suffix starting with 0 has no decodings.', 'Otherwise D(i) = D(i+1), plus D(i+2) if s[i]s[i+1] is between 10 and 26.'],
      solution: String.raw`~~~js
function numDecodings(s) {
  const n = s.length;
  const D = new Array(n + 2).fill(0);
  D[n] = 1;                                  // empty suffix: one decoding
  for (let i = n - 1; i >= 0; i--) {
    if (s[i] === '0') { D[i] = 0; continue; } // no code starts with 0
    D[i] = D[i + 1];                          // one-digit code s[i]
    if (i + 1 < n && (s[i] === '1' || (s[i] === '2' && s[i + 1] <= '6')))
      D[i] += D[i + 2];                       // two-digit code 10..26
  }
  return D[0];
}
~~~
Spec: D(i) = number of decodings of the suffix s[i..]. Decodings are partitioned by the length (1 or 2) of their first code, so the sum counts each once. Suffix order, O(n) time. Ten 1s give 89 decodings (a Fibonacci number), "06" gives 0 and "110" gives 1 (only 1 | 10).`,
    },
    {
      id: 'dp-coinways-code', type: 'code', title: 'Number of ways to make change', difficulty: 2,
      prompt: String.raw`Write <code>countChange(coins, T)</code> returning the number of **multisets** of coins (unlimited supply of each of the distinct positive denominations in <code>coins</code>) whose total is exactly T ≥ 0. Order does not matter: for coins [1, 2, 5] and T = 5 the answer is 4. The empty multiset makes T = 0.`,
      fn: 'countChange',
      starter: 'function countChange(coins, T) {\n  // W[i][t] = multisets using only coins[i..] with total t\n}\n',
      reference: function (coins, T) {
        const W = new Array(T + 1).fill(0);
        W[0] = 1;
        for (const c of coins) for (let t = c; t <= T; t++) W[t] += W[t - c];
        return W[T];
      },
      tests: [[[1, 2, 5], 5], [[2], 3], [[10], 10], [[1, 2, 3], 0], [[], 0], [[], 5], [[2, 5, 3, 6], 10], [[1, 2, 5], 11], [[3, 7], 20]],
      gen: () => {
        const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const coins = [];
        const k = Math.floor(Math.random() * 5);
        for (let i = 0; i < k; i++) { const j = Math.floor(Math.random() * pool.length); coins.push(pool[j]); pool.splice(j, 1); }
        return [coins, Math.floor(Math.random() * 40)];
      },
      hints: ['Process the denominations one at a time; this fixes a canonical order so each multiset is counted once.', 'Ways(i, t) = Ways(i+1, t) + Ways(i, t − d_i). With one array: for each coin c, for t from c up to T, W[t] += W[t − c].'],
      solution: String.raw`~~~js
function countChange(coins, T) {
  const W = new Array(T + 1).fill(0);
  W[0] = 1;                                  // empty multiset
  for (const c of coins)                     // outer loop over denominations!
    for (let t = c; t <= T; t++)
      W[t] += W[t - c];                      // "use one more coin c"
  return W[T];
}
~~~
This is Ways(i, t) = Ways(i+1, t) + Ways(i, t − d_i) with the rows collapsed into one array: before processing coin c, W[t] holds the count without c; the inner loop (t increasing) adds the multisets that use c at least once. Swapping the loops (t outer, coins inner) would count **ordered** sequences instead (9 instead of 4 for the example). $O(kT)$ time, pseudo-polynomial.`,
    },
    {
      id: 'dp-palcuts-code', type: 'code', title: 'Minimum palindrome cuts', difficulty: 2,
      prompt: String.raw`Write <code>minPalCuts(s)</code> returning the minimum number of cuts needed to split the string s into pieces that are all palindromes (0 for the empty string or for a palindrome). Example: "aab" → 1 ("aa" | "b"). Aim for $O(n^2)$ time.`,
      fn: 'minPalCuts',
      starter: 'function minPalCuts(s) {\n  // isPal[i][j] table, then P[i] = fewest pieces for s[i..]\n}\n',
      reference: function (s) {
        const n = s.length;
        if (n === 0) return 0;
        const P = [];
        for (let i = 0; i <= n; i++) P.push(new Array(n + 1).fill(false));
        for (let i = n - 1; i >= 0; i--)
          for (let j = i; j < n; j++) P[i][j] = s[i] === s[j] && (j - i < 2 || P[i + 1][j - 1]);
        const M = new Array(n + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) {
          M[i] = Infinity;
          for (let j = i; j < n; j++) if (P[i][j] && 1 + M[j + 1] < M[i]) M[i] = 1 + M[j + 1];
        }
        return M[0] - 1;
      },
      tests: [['aab'], ['a'], ['ab'], ['banana'], ['abacdc'], [''], ['abcde'], ['racecars'], ['aaaa'], ['abba'], ['abbab']],
      gen: () => {
        const L = Math.floor(Math.random() * 13);
        let s = '';
        for (let i = 0; i < L; i++) s += 'abc'[Math.floor(Math.random() * 3)];
        return [s];
      },
      hints: ['First fill isPal[i][j] (i decreasing, j increasing): s[i] = s[j] and the inside is a palindrome.', 'Then P[n] = 0 and P[i] = min over palindromic s[i..j] of 1 + P[j+1]; the answer is P[0] − 1.'],
      solution: String.raw`~~~js
function minPalCuts(s) {
  const n = s.length;
  if (n === 0) return 0;
  const isPal = [];
  for (let i = 0; i <= n; i++) isPal.push(new Array(n + 1).fill(false));
  for (let i = n - 1; i >= 0; i--)
    for (let j = i; j < n; j++)
      isPal[i][j] = s[i] === s[j] && (j - i < 2 || isPal[i + 1][j - 1]);
  const P = new Array(n + 1).fill(0);        // P[i] = fewest pieces for s[i..]
  for (let i = n - 1; i >= 0; i--) {
    P[i] = Infinity;
    for (let j = i; j < n; j++)
      if (isPal[i][j]) P[i] = Math.min(P[i], 1 + P[j + 1]);
  }
  return P[0] - 1;                           // cuts = pieces - 1
}
~~~
Both tables take $O(n^2)$ time. "banana" → 1 (b | anana), "abacdc" → 1 (aba | cdc), "abcde" → 4.`,
    },
    {
      id: 'dp-stock-code', type: 'code', title: 'Stock profit with at most k transactions', difficulty: 3,
      prompt: String.raw`Write <code>maxProfit(k, prices)</code>: <code>prices[i]</code> is the price on day i. A transaction buys one share and sells it on a later day; you can hold at most one share at a time and make at most k ≥ 0 transactions. Return the maximum total profit (0 if no trade helps). Example: k = 2, prices [3, 2, 6, 5, 0, 3] → 7.`,
      fn: 'maxProfit',
      starter: 'function maxProfit(k, prices) {\n  // Best(i, j, holding?) for days i..n-1 with j purchases left\n}\n',
      reference: function (k, prices) {
        const n = prices.length;
        let free = new Array(k + 1).fill(0);
        let hold = new Array(k + 1).fill(-Infinity);
        for (let i = n - 1; i >= 0; i--) {
          const nf = new Array(k + 1), nh = new Array(k + 1);
          for (let j = 0; j <= k; j++) {
            nf[j] = Math.max(free[j], j >= 1 ? -prices[i] + hold[j - 1] : -Infinity);
            nh[j] = Math.max(hold[j], prices[i] + free[j]);
          }
          free = nf; hold = nh;
        }
        return free[k];
      },
      tests: [[2, [3, 2, 6, 5, 0, 3]], [1, [3, 2, 6, 5, 0, 3]], [2, [2, 4, 1]], [0, [1, 5]], [3, []], [2, [1, 2, 4, 2, 5, 7, 2, 4, 9, 0]], [3, [1, 2, 4, 2, 5, 7, 2, 4, 9, 0]], [5, [9, 7, 5, 3]], [1, [7]]],
      gen: () => {
        const n = Math.floor(Math.random() * 12);
        return [Math.floor(Math.random() * 4), Array.from({ length: n }, () => Math.floor(Math.random() * 15))];
      },
      hints: ['Keep two arrays indexed by j = purchases left: the best profit from day i on when not holding, and when holding.', 'Not holding: wait, or buy (−price, j − 1, now holding). Holding: wait, or sell (+price, now not holding). After the last day, holding is −∞.'],
      solution: String.raw`~~~js
function maxProfit(k, prices) {
  const n = prices.length;
  let free = new Array(k + 1).fill(0);           // day n, not holding: 0
  let hold = new Array(k + 1).fill(-Infinity);   // day n, holding: not allowed
  for (let i = n - 1; i >= 0; i--) {
    const nf = new Array(k + 1), nh = new Array(k + 1);
    for (let j = 0; j <= k; j++) {
      nf[j] = Math.max(free[j], j >= 1 ? -prices[i] + hold[j - 1] : -Infinity);
      nh[j] = Math.max(hold[j], prices[i] + free[j]);
    }
    free = nf; hold = nh;
  }
  return free[k];
}
~~~
Best(i, j, h) with days processed from last to first; only the previous day's two arrays are kept. $O(nk)$ time, $O(k)$ space. For [1, 2, 4, 2, 5, 7, 2, 4, 9, 0]: k = 2 gives 13 (1 → 7, 2 → 9) and k = 3 gives 15 (1 → 4, 2 → 7, 2 → 9).`,
    },
    {
      id: 'dp-billboards', type: 'written', title: 'Billboards along a highway', difficulty: 2,
      prompt: String.raw`An advertising company may build billboards at n sites along a highway, at mile markers $x[1] < x[2] < \cdots < x[n]$. A billboard at site i earns revenue $r[i] > 0$. Regulations require any two billboards to be **more than 5 miles apart**. Choose sites to maximize the total revenue.

(a) Show that the greedy algorithm "repeatedly build at the remaining site with the highest revenue, then discard the sites within 5 miles of it" is not optimal, using x = [2, 4, 7, 9, 13, 15, 18] and r = [6, 2, 3, 7, 9, 5, 8].
(b) Give an O(n)-time dynamic programming algorithm, in the five-part format. (The mile markers are integers but may be huge; your running time must not depend on them.)
(c) Run your algorithm on the example.`,
      rubric: ['Greedy counterexample: greedy 15 vs optimal 21', 'Spec Best(i) for sites i..n, answer Best(1); Next(i) = first site more than 5 miles after x[i]', 'Recurrence max{Best(i+1), r[i] + Best(Next(i))} with base case Best(n+1) = 0 and justification', 'Order i decreasing; Next computed by two pointers in O(n) (or binary search, O(n log n))', 'Correct table for the example'],
      hints: ['Either site i is not used, or it is used — and then which sites are ruled out?', 'If site i is used, the next usable site is the first one with x[j] > x[i] + 5. As i increases, does that index ever move backwards?'],
      solution: String.raw`**(a)** Greedy first takes revenue 9 (mile 13), which rules out miles 9, 15 and 18 (all within 5 miles). It then takes 6 (mile 2), ruling out miles 4 and 7. Nothing is left: total 15. But miles 2, 9 and 18 are pairwise more than 5 apart and earn 6 + 7 + 8 = **21**.

**(b)** Let **Next(i)** = the smallest index j > i with $x[j] > x[i] + 5$, or n + 1 if there is none.
1. **Spec.** For $1 \le i \le n+1$, Best(i) = the maximum total revenue of a valid set of billboards using only sites i..n. Answer Best(1).
2. **Recurrence.** Best(n+1) = 0, and for $i \le n$:
$$\text{Best}(i) = \max\{\text{Best}(i+1),\ r[i] + \text{Best}(\text{Next}(i))\}.$$
If site i is not used, the rest is a valid set among sites i+1..n. If it is used, sites i+1, ..., Next(i) − 1 are within 5 miles of x[i] and must be empty, while every site from Next(i) on is more than 5 miles from x[i]; so the rest is exactly a valid set among sites Next(i)..n.
3. **Memo.** Arrays Best[1..n+1] and Next[1..n].
4. **Order.** Best(i) reads larger indices only: i from n + 1 down to 1. Compute Next first with two pointers: Next(i) never decreases as i increases, so a single pointer j sweeps forward once over all i.
5. **Time.** Two pointers: O(n) for Next; O(1) per Best entry: **O(n)** total, O(n) space. (Binary search for each Next(i) gives O(n log n). A table indexed by mile markers would be pseudo-polynomial in the coordinates — avoid it.)

**(c)** Next = [4, 5, 5, 6, 8, 8, 8]. Best(8) = 0; Best(7) = max(0, 8) = 8; Best(6) = max(8, 5) = 8; Best(5) = max(8, 9) = 9; Best(4) = max(9, 7 + Best(6)) = 15; Best(3) = max(15, 3 + Best(5)) = 15; Best(2) = max(15, 2 + Best(5)) = 15; Best(1) = max(15, 6 + Best(4)) = **21**. Tracing the choices: use site 1, jump to 4, use it, jump to 6; skip 6, use 7: miles 2, 9, 18.`,
    },
    {
      id: 'dp-weighted-delete-equal', type: 'written', title: 'Cheapest deletions to make two strings equal', difficulty: 2,
      prompt: String.raw`You are given strings $A[1..m]$ and $B[1..n]$ and a positive deletion cost w(c) for every letter c. You may delete characters from either string; deleting one copy of letter c costs w(c). Find the minimum total cost of deletions after which the two strings are **equal**.

(a) Give a dynamic programming algorithm in the five-part format.
(b) For A = SEAT, B = EAST, w(S) = 4, w(T) = 5, w(E) = w(A) = 1, show that keeping a *longest* common subsequence is not optimal, and give the optimal cost.
(c) Express the answer in terms of a "heaviest common subsequence".`,
      rubric: ['Spec D(i, j) on prefixes (or suffixes) with the answer D(m, n)', 'Base cases: delete everything from the nonempty prefix', 'Recurrence: delete A[i], delete B[j], or keep both when A[i] = B[j]', 'Row-major order; O(mn) time', 'Example: LCS EAT costs 8, optimal ST costs 4', 'Answer = w(A) + w(B) − 2 · (max weight of a common subsequence)'],
      hints: ['Look at the last characters A[i] and B[j]. In the final equal strings, is A[i] kept? Is B[j]?', 'If both are kept, they are the last characters of the common string — so they are equal and paired.'],
      solution: String.raw`**(a)**
1. **Spec.** For $0 \le i \le m$ and $0 \le j \le n$, D(i, j) = the minimum cost of deletions that make the prefixes A[1..i] and B[1..j] equal. Answer D(m, n).
2. **Recurrence.** D(0, 0) = 0; D(i, 0) = D(i−1, 0) + w(A[i]) and D(0, j) = D(0, j−1) + w(B[j]) (everything must go). For $i, j \ge 1$:
$$D(i, j) = \min\begin{cases} w(A[i]) + D(i-1, j)\\ w(B[j]) + D(i, j-1)\\ D(i-1, j-1) & \text{if } A[i] = B[j].\end{cases}$$
*Why.* In an optimal solution, A[i] is deleted, or B[j] is deleted, or both survive. If both survive, each is the last character of the common remaining string, so they must be equal (and are paired); the rest is a solution for A[1..i−1] and B[1..j−1].
3. **Memo.** D[0..m][0..n].
4. **Order.** Each entry reads the entry above, to the left, and diagonally above-left: fill row by row, i increasing and j increasing.
5. **Time.** $O(mn)$ time and space ($O(\min(m, n))$ space for the value with two rows).

(Since costs depend only on the *letter*, keeping both when A[i] = B[j] is actually always optimal — swapping which copy of the same letter is kept doesn't change the cost — but taking the min over all three options is correct regardless and needs no argument.)

**(b)** The longest common subsequence of SEAT and EAST is EAT: keeping it means deleting S from both strings, cost 4 + 4 = 8. Keeping ST instead deletes E and A from both strings, cost 1 + 1 + 1 + 1 = **4**, which the DP confirms is optimal. A longer common subsequence is not necessarily a heavier one.

**(c)** Writing w(X) for the total cost of the letters of a string X, deleting everything except a common subsequence C costs $w(A) + w(B) - 2\,w(C)$. So the answer is $w(A) + w(B) - 2 \cdot \max\{w(C) : C \text{ a common subsequence}\}$: a weighted LCS. Here w(SEAT) = w(EAST) = 11 and the heaviest common subsequence is ST with weight 9: 22 − 18 = 4.`,
    },
    {
      id: 'dp-k-runs', type: 'written', title: 'Selling on at most k stretches of days', difficulty: 3,
      prompt: String.raw`A food truck has a forecast profit $P[i]$ (possibly negative) for each day $i = 1, \dots, n$. Its permit allows it to operate on **at most k runs**, where a run is a block of consecutive days; on days outside the runs it stays home (profit 0). Choose at most k disjoint nonempty runs to maximize the total profit (0 if staying home every day is best).

For P = [4, −6, 3, 3, −1, −7, 5, −2, 2], the answers for k = 1, 2, 3 are 6, 11 and 15.

Describe and analyze an $O(nk)$-time algorithm, in the five-part format.`,
      rubric: ['Two functions (or a flag): best with day i free vs. a run ending exactly on day i, with the run budget as a parameter', 'English specs with ranges; answer Best(n, k)', 'Recurrence: extend the current run (same budget) or start a new run (budget − 1); Best = max(day i idle, run ends at i)', 'Base cases: zero budget gives 0, empty prefix gives 0 / −∞', 'Order i increasing; O(nk) time, O(k) space possible'],
      hints: ['A single function Best(i, b) is not enough: when day i is in a run, you must know whether day i − 1 was too, to know whether day i costs a new run.', 'Define End(i, b): the best total when the last run ends exactly on day i.', 'Day i in a run either continues the run that contains day i − 1, or starts a new one.'],
      solution: String.raw`1. **Spec.** For $0 \le i \le n$ and $0 \le b \le k$:
   - **Best(i, b)** = the maximum total profit of at most b disjoint nonempty runs inside days 1..i (0 if no run is used).
   - **End(i, b)** (for $b \ge 1$) = the maximum total profit of at most b disjoint nonempty runs inside days 1..i such that the **last run ends exactly on day i** ($-\infty$ if i = 0).

   Answer Best(n, k).
2. **Recurrence.** Base cases Best(i, 0) = 0, Best(0, b) = 0, End(0, b) = $-\infty$. For $i \ge 1$, $b \ge 1$:
$$\text{End}(i, b) = P[i] + \max\{\text{End}(i-1, b),\ \text{Best}(i-1, b-1)\}$$
$$\text{Best}(i, b) = \max\{\text{Best}(i-1, b),\ \text{End}(i, b)\}$$
*Why.* Suppose the last run ends on day i. Either it also contains day i − 1 — then removing day i leaves at most b runs inside days 1..i−1 whose last run ends on day i − 1 (the End(i−1, b) kind), and conversely any such solution can be extended by day i — or it *starts* on day i, and the other at most b − 1 runs lie anywhere inside days 1..i−1 (any solution counted by Best(i−1, b−1)). For Best(i, b): either day i is outside every run (Best(i−1, b)) or it is the last day of the last run (End(i, b)).
3. **Memo.** Arrays Best[0..n][0..k] and End[0..n][1..k].
4. **Order.** Row i reads only row i − 1, except that Best(i, b) reads End(i, b): loop i from 1 to n, and for each b compute End(i, b) before Best(i, b).
5. **Time/space.** $O(nk)$ entries, O(1) each: $O(nk)$ time; $O(k)$ space keeping two rows.

**Example.** For k = 1 the best run is days 3–4 (3 + 3 = 6). For k = 2 add day 7 (5): 11. For k = 3 add day 1 (4): 15. (Allowing a fourth run would add day 9: 17.)

**Why two functions?** With only Best(i, b) and a choice "day i is in a run or not", we cannot tell whether putting day i in a run *continues* a run (free) or *starts* one (costs budget) — that depends on day i − 1. End is the anchored function that remembers exactly this. (This is the stock-trading problem in disguise: a buy on day a and a sell on day b earn the sum of the daily price changes over a..b−1, so k transactions are k runs of daily changes.)`,
    },
    {
      id: 'dp-weighted-pal-delete', type: 'written', title: 'Cheapest palindrome by deletions', difficulty: 3,
      prompt: String.raw`You are given a string $A[1..n]$ and positive costs $c[1..n]$: deleting the character at **position** i costs c[i]. Delete characters so that the remaining string is a palindrome (the empty string counts), minimizing the total cost.

(a) A classmate adapts the longest-palindromic-subsequence recurrence: "if A[i] = A[j], keep both ends and recurse on A[i+1..j−1]". Show that this is wrong, using A = ABAA and c = [1, 10, 10, 1].
(b) Give a correct dynamic programming algorithm in the five-part format.
(c) Explain why the classmate's rule *is* correct when all costs are equal, and exactly where that argument breaks with position-dependent costs.`,
      rubric: ['Counterexample: the rule gives 10, the optimum is 1', 'Spec Del(i, j) on the substring A[i..j]; answer Del(1, n)', 'Recurrence: min of deleting A[i], deleting A[j], or keeping both when equal; base case i ≥ j gives 0', 'Order by increasing length (or i decreasing, j increasing); O(n²)', 'Exchange argument for unit costs and why it fails with weights'],
      hints: ['In an optimal solution, what can happen to A[i] and A[j]?', 'For (c): with unit costs, if an optimal palindrome keeps A[i] paired with some A[k], k < j, you can swap A[k] for A[j]. What does that swap cost with weights?'],
      solution: String.raw`**(a)** The classmate pairs the two outer A's of ABAA and must then fix the middle "BA" by deleting B or the second A, cost 10. But deleting only the last A (cost 1) leaves ABA, a palindrome. So the optimum is **1**, and the rule gives 10.

**(b)**
1. **Spec.** For $1 \le i \le n+1$ and $i - 1 \le j \le n$, Del(i, j) = the minimum total cost of deletions that turn the substring A[i..j] into a palindrome. Answer Del(1, n).
2. **Recurrence.** Del(i, j) = 0 if $i \ge j$. Otherwise
$$\text{Del}(i, j) = \min\begin{cases} c[i] + \text{Del}(i+1, j)\\ c[j] + \text{Del}(i, j-1)\\ \text{Del}(i+1, j-1) & \text{if } A[i] = A[j].\end{cases}$$
*Why.* In an optimal solution, A[i] is deleted, or A[j] is deleted, or both are kept. If both are kept they are the first and last characters of the palindrome, so they are partners, must be equal, and the inside must be a palindrome made from A[i+1..j−1].
3. **Memo.** Del[1..n+1][0..n].
4. **Order.** All three options read shorter intervals: fill by increasing length j − i (or i from n down to 1 and j from i + 1 up to n).
5. **Time.** $O(n^2)$ entries, O(1) each: $O(n^2)$ time and space.

On the example the DP gives Del(1, 4) = min(1 + Del(2, 4), 1 + Del(1, 3), Del(2, 3)) = min(1 + 10, 1 + 0, 10) = 1.

**(c)** With unit costs, the cost is (length) − (number of kept characters), so we want a longest palindromic subsequence, and some longest one uses both equal ends: if a palindrome P keeps A[i] but pairs it with A[k] for some k < j, replace A[k] by A[j] (the same letter) — still a palindrome, the same length, and therefore **the same cost**. (If P uses neither end, adding both makes it longer.) With position costs the swap deletes A[k] instead of A[j], changing the cost by c[k] − c[j], which can be positive. In ABAA the optimal solution keeps positions 1–3 and pairs A[1] with A[3]; swapping A[3] for A[4] would cost c[3] = 10 instead of c[4] = 1. The safe fix is to take the min over all options, as in (b).`,
    },
    {
      id: 'dp-paint-houses', type: 'written', title: 'Painting a row of houses', difficulty: 2,
      prompt: String.raw`n houses stand in a row and k ≥ 2 colors are available. Painting house i with color c costs C[i][c]. Adjacent houses must get different colors. Find the minimum total cost.

(a) Show that painting left to right, giving each house its cheapest color that differs from its left neighbor, is not optimal.
(b) Give an $O(nk^2)$ dynamic programming algorithm in the five-part format.
(c) Improve it to $O(nk)$.
(d) Run it on C = [[7, 3, 8], [5, 6, 1], [2, 4, 7], [6, 2, 5]] (house i is row i, colors 1–3).`,
      rubric: ['Greedy counterexample', 'Spec Paint(i, c): houses i..n with house i colored c; answer min over c', 'Recurrence C[i][c] + min over c′ ≠ c of Paint(i+1, c′); base case i = n', 'Order i decreasing; O(nk²)', 'O(nk) with the smallest and second-smallest values of the next row', 'Example answer 8'],
      hints: ['What does the rest of the row need to know about the house you just painted? Only its color.', 'For (c): the minimum over all colors except c is the overall minimum, unless c is the color achieving it.'],
      solution: String.raw`**(a)** Two houses, two colors, C = [[1, 2], [1, 100]]. Greedy paints house 1 with color 1 (cost 1), forcing color 2 on house 2 (cost 100): total 101. Painting house 1 with color 2 and house 2 with color 1 costs 2 + 1 = 3.

**(b)**
1. **Spec.** For $1 \le i \le n$ and $1 \le c \le k$, Paint(i, c) = the minimum cost of painting houses i..n, adjacent houses different, **given that house i gets color c** (its cost included). Answer $\min_c \text{Paint}(1, c)$.
2. **Recurrence.** Paint(n, c) = C[n][c]; for i < n,
$$\text{Paint}(i, c) = C[i][c] + \min_{c' \ne c} \text{Paint}(i+1, c').$$
House i + 1 can have any color except c, and the rest only depends on that color.
3. **Memo.** Paint[1..n][1..k].
4. **Order.** Row i reads row i + 1: i from n down to 1.
5. **Time.** nk entries × O(k) for the min: $O(nk^2)$ time, $O(nk)$ space (O(k) with two rows).

**(c)** For each row i + 1, compute once its smallest value $m_1$ (attained at color $c_1$) and second-smallest value $m_2$, in O(k). Then $\min_{c' \ne c}\text{Paint}(i+1, c') = m_1$ if $c \ne c_1$ and $m_2$ if $c = c_1$. Each entry becomes O(1): $O(nk)$ total.

**(d)** Paint(4, ·) = [6, 2, 5]. Paint(3, ·) = [2 + 2, 4 + 5, 7 + 2] = [4, 9, 9]. Paint(2, ·) = [5 + 9, 6 + 4, 1 + 4] = [14, 10, 5]. Paint(1, ·) = [7 + 5, 3 + 5, 8 + 10] = [12, 8, 18]. The answer is **8**: colors 2, 3, 1, 2 with costs 3 + 1 + 2 + 2.`,
    },
    {
      id: 'dp-mock1-passes', type: 'written', title: 'Commuter passes', difficulty: 3, tags: ['mt2-mock-1'],
      prompt: String.raw`Rosa will ride the train on n days $d[1] < d[2] < \cdots < d[n]$ (positive integers: day numbers of the year, or any calendar). The railway sells three kinds of passes: a **1-day** pass for price $p_1$, a **7-day** pass for price $p_7$ and a **30-day** pass for price $p_{30}$. A pass can be activated on any day and is valid on that day and the following $L - 1$ days, where L = 1, 7 or 30 is its length. Rosa wants to cover all her travel days as cheaply as possible.

**(a)** [2 pts] Rosa's friend suggests: "On the earliest travel day d that is not yet covered, buy a 7-day pass starting on d if at least 4 travel days fall in [d, d + 6]; otherwise buy a 1-day pass for d." Show that this is not optimal for $p_1 = 2$, $p_7 = 7$, $p_{30} = 25$ and travel days 1, 4, 5, 6, 8, 9, 10.

**(b)** [6 pts] Describe and analyze an efficient dynamic programming algorithm for the minimum total price. Use the five-part format. Your running time must depend only on n (the day numbers can be huge). You may use without proof that some optimal solution activates every pass on a travel day — but say in one sentence why it is true.

**(c)** [2 pts] A promotion limits Rosa to **at most K** 7-day passes (1-day and 30-day passes are unlimited). Modify your algorithm and give its running time.`,
      rubric: [
        '(2 pts) (a) Greedy cost 13 (7-day pass on day 1, then three 1-day passes) vs. 9 (1-day pass on day 1, 7-day pass from day 4)',
        '(2 pts) (b) English spec Cost(i) = minimum price to cover travel days d[i..n]; answer Cost(1)',
        '(2 pts) (b) Recurrence min over the three pass types using Next pointers, base case Cost(n+1) = 0, plus the one-line justification (shift the pass covering d[i] to start on d[i])',
        '(1 pt) (b) Memo array Cost[1..n+1] and evaluation order i from n+1 down to 1',
        '(1 pt) (b) Running time O(n) with two pointers (or O(n log n) with binary search) — not depending on d[n]',
        '(2 pts) (c) Budget parameter Cost(i, b), 7-day option only if b ≥ 1 and calls b − 1, answer Cost(1, K), O(nK) time',
      ],
      hints: ['Consider the earliest travel day d[i] that still needs a pass. Which pass covers it, and from when?', 'Define Next_L(i) = the first travel day index j with d[j] ≥ d[i] + L.', 'For (c), what must the rest of the computation know that it didn\'t before?'],
      solution: String.raw`**(a)** Greedy: on day 1 the window [1, 7] contains travel days 1, 4, 5, 6 — four of them — so it buys a 7-day pass (7), covering days 1–7. The first uncovered day is 8; [8, 14] contains only 8, 9, 10, so it buys three 1-day passes (6). Total **13**. Better: a 1-day pass for day 1 (2) and a 7-day pass activated on day 4, covering days 4–10 (7). Total **9** (optimal, as the DP below confirms). Greedy looked only at the window starting at d and missed the better window starting later.

**(b)** *Why passes may start on travel days:* take the pass covering the earliest travel day not covered by earlier passes; moving its activation later to exactly that day loses no needed coverage (the days before it are already covered) and can only extend coverage at the end.

So the first decision is: **which type of pass is activated on day d[i]?** Let $\text{Next}_L(i)$ = the smallest index j > i with $d[j] \ge d[i] + L$, or n + 1 if there is none (so $\text{Next}_1(i) = i + 1$).

1. **Spec.** For $1 \le i \le n+1$, **Cost(i)** = the minimum total price of passes covering all travel days d[i], d[i+1], ..., d[n]. Answer Cost(1).
2. **Recurrence.** Cost(n+1) = 0, and for $i \le n$:
$$\text{Cost}(i) = \min\{p_1 + \text{Cost}(i+1),\ \ p_7 + \text{Cost}(\text{Next}_7(i)),\ \ p_{30} + \text{Cost}(\text{Next}_{30}(i))\}.$$
*Justification.* Some optimal cover of d[i..n] activates a pass of some length L on day d[i]. It covers exactly the travel days d[i..Next_L(i) − 1]; the remaining passes must cover d[Next_L(i)..n], which costs at least Cost(Next_L(i)) — and an optimal cover of those days together with this pass is a valid cover. So the min over the three types is exact.
3. **Memo.** Arrays Cost[1..n+1], Next7[1..n], Next30[1..n].
4. **Order.** Cost(i) reads only larger indices: i from n + 1 down to 1 (after computing the Next arrays).
5. **Time and space.** $\text{Next}_L(i)$ is nondecreasing in i, so each Next array is computed by one forward sweep of two pointers in O(n) (or by binary search in O(log n) each). Then O(1) per entry: **O(n)** time and O(n) space. A table indexed by calendar days would take $O(d[n])$ time, which is pseudo-polynomial in the day numbers — not acceptable here.

**(c)** The rest of the computation now needs to know how many 7-day passes are still allowed. **Cost(i, b)** = the minimum price to cover d[i..n] using at most b 7-day passes, for $0 \le b \le K$. Cost(n+1, b) = 0 and
$$\text{Cost}(i, b) = \min\{p_1 + \text{Cost}(i+1, b),\ \ p_{30} + \text{Cost}(\text{Next}_{30}(i), b),\ \ p_7 + \text{Cost}(\text{Next}_7(i), b-1) \text{ (only if } b \ge 1)\}.$$
Answer Cost(1, K). Table Cost[1..n+1][0..K], i from n + 1 down to 1 (any order of b), O(1) per entry: $O(nK)$ time (and since at most n passes are ever useful, K can be capped at n: $O(n \min(n, K))$).`,
    },
    {
      id: 'dp-mock3-subseq', type: 'written', title: 'Hidden phrases', difficulty: 3, tags: ['mt2-mock-3'],
      prompt: String.raw`A spam filter flags a message $A[1..m]$ if a banned word $B[1..n]$ (with $n \ge 1$) occurs in it **as a subsequence**: its letters appear in A in order, not necessarily contiguously. An **occurrence** is a sequence of positions $1 \le p_1 < p_2 < \cdots < p_n \le m$ with $A[p_t] = B[t]$ for every t. For example, ANA occurs 4 times in BANANA.

**(a)** [4 pts] Give a dynamic programming algorithm that counts the occurrences of B in A. Use the five-part format.

**(b)** [5 pts] A spammer wants to delete as few characters of A as possible so that B no longer occurs in what remains. Give a dynamic programming algorithm for the minimum number of deletions, and justify your recurrence carefully (this is where the points are). For BANANA and ANA the answer is 2.

**(c)** [1 pt] State the running time and space of both algorithms, and say how to reduce the space.`,
      rubric: [
        '(1 pt) (a) Spec Occ(i, j) = number of occurrences of B[j..n] in A[i..m]; answer Occ(1, 1)',
        '(2 pts) (a) Recurrence Occ(i+1, j) + [A[i] = B[j]]·Occ(i+1, j+1); base cases Occ(i, n+1) = 1 and Occ(m+1, j) = 0 for j ≤ n',
        '(1 pt) (a) Memo (m+1)×(n+1) table, order i decreasing (j any order), O(mn) time',
        '(1 pt) (b) Spec Del(i, j) = fewest deletions from A[i..m] so that B[j..n] is not a subsequence of what remains; answer Del(1, 1)',
        '(2 pts) (b) Recurrence: Del(i+1, j) if A[i] ≠ B[j]; min{1 + Del(i+1, j), Del(i+1, j+1)} if A[i] = B[j]; base cases Del(i, n+1) = ∞ and Del(m+1, j) = 0 for j ≤ n',
        '(2 pts) (b) Justification: a kept A[i] = B[j] can serve as the first letter, so B[j..n] survives iff B[j+1..n] survives in the rest; a kept A[i] ≠ B[j] is useless to B[j..n], so deleting it never helps',
        '(1 pt) (c) O(mn) time for both; O(n) space keeping one row',
      ],
      hints: ['Both parts look at the first remaining character of A and the first unmatched character of B.', 'For counting: occurrences of B[j..n] in A[i..m] either use position i (as B[j]) or do not.', 'For deletions: if A[i] = B[j] is kept, can you assume an occurrence of B[j..n] uses it as its first letter?'],
      solution: String.raw`**(a) Counting.**
1. **Spec.** For $1 \le i \le m+1$ and $1 \le j \le n+1$, Occ(i, j) = the number of occurrences of B[j..n] as a subsequence of A[i..m] (position sequences in i..m). Answer Occ(1, 1).
2. **Recurrence.** Occ(i, n+1) = 1 (the empty word occurs once: the empty position sequence); Occ(m+1, j) = 0 for $j \le n$. Otherwise
$$\text{Occ}(i, j) = \text{Occ}(i+1, j) + [A[i] = B[j]] \cdot \text{Occ}(i+1, j+1).$$
An occurrence either does not use position i (then it is an occurrence in A[i+1..m]) or uses it — necessarily as $p_1$, matching B[j], so A[i] = B[j] and the rest is an occurrence of B[j+1..n] in A[i+1..m]. The two cases are disjoint, so nothing is counted twice.
3. **Memo.** Occ[1..m+1][1..n+1].
4. **Order.** Row i reads only row i + 1: i from m + 1 down to 1, any order of j.
5. **Time.** $O(mn)$ entries, O(1) each (counting each addition as O(1)): $O(mn)$.

**(b) Destroying all occurrences.**
1. **Spec.** Del(i, j) = the fewest characters to delete from A[i..m] so that B[j..n] is **not** a subsequence of what remains ($\infty$ if impossible). Answer Del(1, 1).
2. **Recurrence.** Del(i, n+1) = $\infty$ (the empty word is a subsequence of everything); Del(m+1, j) = 0 for $j \le n$ (a nonempty word does not occur in the empty string). Otherwise
$$\text{Del}(i, j) = \begin{cases}\text{Del}(i+1, j) & A[i] \ne B[j]\\ \min\{1 + \text{Del}(i+1, j),\ \text{Del}(i+1, j+1)\} & A[i] = B[j].\end{cases}$$
*Justification.* Let R be what remains of A[i..m] after the deletions, and R' the part of R that comes from A[i+1..m].
- **Key fact (leftmost matching):** if A[i] = B[j] is kept, then B[j..n] is a subsequence of R iff B[j+1..n] is a subsequence of R'. ($\Leftarrow$: put the kept A[i] in front. $\Rightarrow$: any occurrence of B[j..n] in R uses some position $p \ge i$ for B[j] and positions after p, hence inside A[i+1..m], for B[j+1..n].) So keeping A[i] costs nothing now but forces us to destroy B[j+1..n] in A[i+1..m]: Del(i+1, j+1). Deleting it costs 1 and leaves the task of destroying B[j..n] in A[i+1..m]: 1 + Del(i+1, j).
- If $A[i] \ne B[j]$, a kept A[i] cannot be the first letter of an occurrence of B[j..n], so B[j..n] occurs in R iff it occurs in R'. Deleting A[i] would be a wasted deletion; the best is Del(i+1, j).
3. **Memo.** Del[1..m+1][1..n+1].
4. **Order.** i from m + 1 down to 1; any order of j.
5. **Time.** $O(mn)$. (Del(1, 1) is always finite since $n \ge 1$: deleting every copy of B[1] works.)

**Example: A = BANANA, B = ANA.** Columns are i = 1..7 (i = 7 is the empty suffix).

| | i = 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Occ(i, 1) | **4** | 4 | 1 | 1 | 0 | 0 | 0 |
| Occ(i, 2) | 3 | 3 | 3 | 1 | 1 | 0 | 0 |
| Occ(i, 3) | 3 | 3 | 2 | 2 | 1 | 1 | 0 |
| Del(i, 1) | **2** | 2 | 1 | 1 | 0 | 0 | 0 |
| Del(i, 2) | 2 | 2 | 2 | 1 | 1 | 0 | 0 |
| Del(i, 3) | 3 | 3 | 2 | 2 | 1 | 1 | 0 |

For instance Del(2, 1) = min(1 + Del(3, 1), Del(3, 2)) = min(2, 2) = 2: deleting both N's (or the first and last A) works, and no single deletion does — whichever character is deleted, at least one of the 4 occurrences avoids it.

**(c)** Both tables have $O(mn)$ entries with O(1) work each: $O(mn)$ time and space. Each row i depends only on row i + 1, so keeping two rows (or one row updated with j increasing) gives O(n) space. (The counts can be exponentially large, about $\binom{m}{n}$, so in a bit-level model each addition costs O(n log m).)`,
    },
    {
      id: 'dp-k-runs-code', type: 'code', title: 'Profit from at most k runs', difficulty: 3,
      prompt: String.raw`Write <code>maxKRuns(P, k)</code>: P[i] is the (possibly negative) profit of day i, and you may choose **at most k** disjoint nonempty blocks of consecutive days; the result is the total profit of the chosen days (0 if choosing nothing is best). Example: <code>maxKRuns([4, -6, 3, 3, -1, -7, 5, -2, 2], 2)</code> is 11. Aim for $O(nk)$ time with two functions: the best for days 1..i, and the best when the last block ends exactly on day i.`,
      fn: 'maxKRuns',
      starter: 'function maxKRuns(P, k) {\n  // best[b] = best with at most b blocks so far; end[b] = best with the last block ending today\n}\n',
      reference: function (P, k) {
        let best = new Array(k + 1).fill(0);
        let end = new Array(k + 1).fill(-Infinity);
        for (let i = 0; i < P.length; i++) {
          const nb = new Array(k + 1).fill(0), ne = new Array(k + 1).fill(-Infinity);
          for (let b = 1; b <= k; b++) {
            ne[b] = P[i] + Math.max(end[b], best[b - 1]);
            nb[b] = Math.max(best[b], ne[b]);
          }
          best = nb; end = ne;
        }
        return best[k];
      },
      tests: [[[4, -6, 3, 3, -1, -7, 5, -2, 2], 1], [[4, -6, 3, 3, -1, -7, 5, -2, 2], 2], [[4, -6, 3, 3, -1, -7, 5, -2, 2], 3], [[4, -6, 3, 3, -1, -7, 5, -2, 2], 0], [[], 3], [[-5, -1, -3], 2], [[1, 2, 3], 2], [[5, -1, 5], 1], [[5, -10, 5], 1], [[1, -1, 1, -1, 1, -1, 1], 10]],
      gen: () => {
        const n = Math.floor(Math.random() * 14);
        return [Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10), Math.floor(Math.random() * 5)];
      },
      hints: ['End(i, b) = P[i] + max(End(i−1, b), Best(i−1, b−1)): day i continues the block through day i − 1, or starts a new block.', 'Best(i, b) = max(Best(i−1, b), End(i, b)). Base: Best = 0 everywhere at the start, End = −∞.'],
      solution: String.raw`~~~js
function maxKRuns(P, k) {
  let best = new Array(k + 1).fill(0);           // at most b blocks inside days 0..i-1
  let end = new Array(k + 1).fill(-Infinity);    // ... with the last block ending on day i-1
  for (let i = 0; i < P.length; i++) {
    const nb = new Array(k + 1).fill(0), ne = new Array(k + 1).fill(-Infinity);
    for (let b = 1; b <= k; b++) {
      ne[b] = P[i] + Math.max(end[b], best[b - 1]);  // extend the block, or start a new one
      nb[b] = Math.max(best[b], ne[b]);              // day i idle, or last block ends today
    }
    best = nb; end = ne;
  }
  return best[k];
}
~~~
$O(nk)$ time, $O(k)$ space. Note that two adjacent blocks are allowed (they just use two units of budget), so "at most k" is handled without any special case.`,
    },
    {
      id: 'dp-cheap-pal-code', type: 'code', title: 'Cheapest palindrome by deletions', difficulty: 3,
      prompt: String.raw`Write <code>cheapPalindrome(s, cost)</code>: deleting the character at position i of the string s costs <code>cost[i]</code> (a positive integer). Return the minimum total cost of deletions that leave a palindrome (the empty string is a palindrome). Example: <code>cheapPalindrome("ABAA", [1, 10, 10, 1])</code> is 1 — note that keeping both equal end letters is **not** always optimal. Strings have length at most 60.`,
      fn: 'cheapPalindrome',
      starter: 'function cheapPalindrome(s, cost) {\n  // Del(i, j) = cheapest way to make s[i..j] a palindrome\n}\n',
      reference: function (s, cost) {
        const n = s.length;
        if (n === 0) return 0;
        const D = [];
        for (let i = 0; i <= n; i++) D.push(new Array(n + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
          for (let j = i + 1; j < n; j++) {
            let v = Math.min(cost[i] + D[i + 1][j], cost[j] + D[i][j - 1]);
            if (s[i] === s[j]) v = Math.min(v, i + 1 <= j - 1 ? D[i + 1][j - 1] : 0);
            D[i][j] = v;
          }
        }
        return D[0][n - 1];
      },
      tests: [['ABAA', [1, 10, 10, 1]], ['', []], ['A', [5]], ['AB', [3, 2]], ['ABBA', [1, 1, 1, 1]], ['ABCA', [1, 1, 1, 1]], ['MADXAM', [1, 2, 3, 4, 5, 6]], ['ABCBA', [9, 9, 1, 9, 9]], ['AABAA', [1, 1, 100, 1, 1]], ['ABACABA', [2, 7, 1, 8, 2, 8, 1]]],
      gen: () => {
        const n = Math.floor(Math.random() * 13);
        let s = '';
        for (let i = 0; i < n; i++) s += 'ABC'[Math.floor(Math.random() * 3)];
        return [s, Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 9))];
      },
      hints: ['Del(i, j) = min(cost[i] + Del(i+1, j), cost[j] + Del(i, j−1), and Del(i+1, j−1) if s[i] = s[j]).', 'Base case: substrings of length 0 or 1 cost 0. Fill i from n−1 down to 0 and j from i+1 up.'],
      solution: String.raw`~~~js
function cheapPalindrome(s, cost) {
  const n = s.length;
  if (n === 0) return 0;
  // D[i][j] = cheapest deletions making s[i..j] a palindrome (0 when j <= i)
  const D = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j < n; j++) {
      let v = Math.min(cost[i] + D[i + 1][j],      // delete s[i]
                       cost[j] + D[i][j - 1]);     // delete s[j]
      if (s[i] === s[j])                           // keep both as partners
        v = Math.min(v, i + 1 <= j - 1 ? D[i + 1][j - 1] : 0);
      D[i][j] = v;
    }
  }
  return D[0][n - 1];
}
~~~
$O(n^2)$ time and space. Taking the min over all three options (instead of always pairing equal ends) is what makes it correct for position-dependent costs.`,
    },
    {
      id: 'dp-p1-quadhopper', type: 'written', title: 'Practice Midterm 1 · Problem 2: Quadhopper', difficulty: 2,
      tags: ['mt2-practice-1', 'dp', 'greedy counterexample'], code: 'dp-p1-quadhopper-code',
      prompt: String.raw`*Quadhopper* is a solitaire game played on a row of $n$ squares. Each square contains four positive integers. The player begins by placing a token on the leftmost square. On each move, the player chooses one of the numbers on the token's current square, and then moves the token that number of squares to the right. The game ends when the token moves past the rightmost square. The object of the game is to make as many moves as possible before the game ends.

(The handout shows a 14-square puzzle with a legal sequence of six moves, and notes that six is **not** the longest possible.)

**(a)** ***Prove*** that the obvious greedy strategy (always choose the smallest number) does not give the largest possible number of moves for every quadhopper puzzle.

**(b)** Describe and analyze an efficient algorithm to find the largest possible number of legal moves for a given quadhopper puzzle.

*From the official Fall 2026 Midterm 2 Practice 1.*`,
      rubric: [
        '(3 pts) (a) A concrete puzzle, the greedy number of moves, and a strictly better sequence of moves',
        '(2 pts) (b) Clear English description of the recursive function and how to call it',
        '(2 pts) (b) Correct recurrence with base case',
        '(1 pt) (b) Memoization structure and evaluation order',
        '(1 pt) (b) Running time',
        '(1 pt) (b) Treats the final move off the board consistently',
      ],
      hints: [
        String.raw`For (a), make the smallest number on the first square lead to a square where every number is huge.`,
        String.raw`For (b), the only thing that matters about the game so far is which square the token is on now.`,
      ],
      checks: [
        { type: 'short', q: String.raw`A 4-square puzzle has squares $\{1, 2, 10, 11\}$, $\{10, 11, 12, 13\}$, $\{1, 10, 11, 12\}$, $\{10, 11, 12, 13\}$. What is the **largest** number of moves (counting the move that leaves the board)?`, answer: ['3'],
          explain: String.raw`Take 2 (square 1 to 3), then 1 (square 3 to 4), then any number (off the board): **3** moves. Greedy takes 1 first (to square 2), where every number leaves the board: only 2 moves. This is a complete answer to part (a).` },
        { type: 'mc', q: String.raw`Which subproblem leads to an efficient algorithm?`, choices: [String.raw`$Hops(i)$ = the most moves possible starting with the token on square $i$`, String.raw`$Hops(i, m)$ = whether exactly $m$ moves can reach square $i$`, String.raw`$Hops(i)$ = the most moves possible using only squares $1..i$`, String.raw`$Hops(i, d)$ = the most moves if the previous jump had length $d$`], answer: 0,
          explain: String.raw`The future depends only on the current square, so one index is enough: $Hops(i) = 1 + \max_d Hops(i + d)$ over the four numbers $d$ on square $i$, with $Hops(i) = 0$ for $i > n$. The second option works but wastes a factor of $n$; the fourth adds state that has no effect on the future.` },
        { type: 'mc', q: String.raw`The resulting algorithm runs in`, choices: [String.raw`$O(n)$`, String.raw`$O(n \log n)$`, String.raw`$O(n^2)$`, String.raw`$O(4^n)$`], answer: 0,
          explain: String.raw`$n$ subproblems, each a max over 4 options: $O(n)$. Without memoization the recursion branches 4 ways and can take exponential time.` },
      ],
      solution: String.raw`### (a) Greedy fails

Consider the puzzle with four squares:

| square | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| numbers | 1, 2, 10, 11 | 10, 11, 12, 13 | 1, 10, 11, 12 | 10, 11, 12, 13 |

- **Greedy** picks 1 and moves to square 2. Every number there leaves the board, so the game ends after **2 moves**.
- **Better:** pick 2 (to square 3), then 1 (to square 4), then anything (off the board): **3 moves**.

Since 3 > 2, always choosing the smallest number is not optimal. (The answer counts the final move off the board as a move. Not counting it gives 1 versus 2, so the conclusion is the same.)

### (b) Dynamic programming

**Subproblem.** For each index $i$, let $Hops(i)$ be the largest number of moves the player can make starting with the token on square $i$. We want $Hops(1)$.

**Recurrence.** Let $d_1(i), \dots, d_4(i)$ be the numbers on square $i$.
$$Hops(i) = \begin{cases} 0 & \text{if } i > n \\ 1 + \max\limits_{1 \le r \le 4} Hops\big(i + d_r(i)\big) & \text{otherwise} \end{cases}$$
Each move goes strictly to the right, because all the numbers are positive, so the recursion is well-founded.

**Memoization.** A one-dimensional array $Hops[1..n]$. Any index $i > n$ returns 0 without a table lookup.

**Evaluation order.** $i$ from $n$ down to 1, because $Hops(i)$ only reads entries to its right.

**Time.** $n$ entries with 4 options each: **$O(n)$** time and $O(n)$ space.

~~~pseudo
QuadHop(d[1..n][1..4]):
    for i <- n down to 1
        best <- 0
        for r <- 1 to 4
            j <- i + d[i][r]
            if j <= n: best <- max(best, Hops[j])
        Hops[i] <- 1 + best
    return Hops[1]
~~~

> **Exam tip.** In a "prove greedy fails" part, a small concrete counterexample with both move counts written out earns full credit. A general argument is not needed.`,
    },
    {
      id: 'dp-p1-quadhopper-code', type: 'code', title: 'Practice 1 · Quadhopper (code)', difficulty: 2,
      tags: ['mt2-practice-1', 'dp'],
      prompt: String.raw`Implement the algorithm from [Quadhopper](#/problem/dp-p1-quadhopper).

<code>quadhopper(squares)</code> receives an array of $n \ge 1$ squares; <code>squares[i]</code> is an array of four positive integers (squares are 0-indexed here). The token starts on square 0. Return the largest possible number of moves, **counting** the final move that takes the token past the last square.

Example: <code>quadhopper([[1,2,10,11],[10,11,12,13],[1,10,11,12],[10,11,12,13]])</code> returns 3.

Aim for $O(n)$ time; the larger tests have 20,000 squares.`,
      fn: 'quadhopper',
      starter: 'function quadhopper(squares) {\n  // squares[i] = [a, b, c, d], four positive integers\n  // return the maximum number of moves\n}\n',
      reference: function (squares) {
        const n = squares.length, H = new Array(n + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) { let best = 0; for (const d of squares[i]) if (i + d < n) best = Math.max(best, H[i + d]); H[i] = 1 + best; }
        return H[0];
      },
      tests: [
        [[[1, 2, 10, 11], [10, 11, 12, 13], [1, 10, 11, 12], [10, 11, 12, 13]]],
        [[[5, 6, 7, 8]]],
        [[[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]]],
        [[[3, 1, 4, 1], [5, 9, 2, 6], [5, 3, 5, 8], [9, 7, 9, 3], [2, 3, 8, 4], [6, 2, 6, 4]]],
        [Array.from({ length: 20000 }, (_, i) => [1 + (i * 7) % 5, 2 + (i * 3) % 4, 3, 1 + (i % 2)])],
      ],
      gen: () => [Array.from({ length: 1 + Math.floor(Math.random() * 15) }, () => Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)))],
      hints: [String.raw`Fill an array from right to left. An index past the end means 0 more moves.`],
      solution: String.raw`~~~pseudo
function quadhopper(squares) {
  const n = squares.length, H = new Array(n + 1).fill(0);   // H[i] = most moves from square i
  for (let i = n - 1; i >= 0; i--) {
    let best = 0;                                           // jumping off the board: 0 more moves after this one
    for (const d of squares[i]) if (i + d < n) best = Math.max(best, H[i + d]);
    H[i] = 1 + best;
  }
  return H[0];
}
~~~
$O(n)$ time. See the [written problem](#/problem/dp-p1-quadhopper) for the recurrence.`,
    },
    {
      id: 'dp-p1-verbal', type: 'written', title: 'Practice Midterm 1 · Problem 4: Longest verbal subsequence', difficulty: 2,
      tags: ['mt2-practice-1', 'dp', 'text segmentation'], code: 'dp-p1-verbal-code',
      prompt: String.raw`Suppose you are given a string of symbols, representing a message in some foreign language that you do not understand, in an array $T[1..n]$. You have access to a black-box subroutine IsWord that can decide whether an arbitrary string $w$ is a word in $O(\lvert w \rvert)$ time.

You eagerly implement and run the text-splitting algorithm from class, only to discover that the given string *cannot* be split into words! Apparently, as a crude form of cryptography, the message has been corrupted by adding extra symbols between words. So you decide instead to look for as many non-overlapping words in $T$ as possible.

A ***verbal subsequence*** of $T$ is a sequence of non-overlapping substrings of $T$, each of which is a word. The *length* of a verbal subsequence is the number of words it contains. Describe and analyze an algorithm to find the length of the longest verbal subsequence of a given string $T$.

For example, if IsWord accepts common English words, then (STUDY, AM, ICE, TRAP, RAMBLE) and (DYNAMIC, EXTRA, PROGRAM) are verbal subsequences of STUDYNAMICEXTRAPROGRAMBLE:

<code>[STUDY] N [AM] [ICE] X [TRAP] ROG [RAMBLE]</code> and <code>STU [DYNAMIC] [EXTRA] [PROGRAM] BLE</code>

So on that input your algorithm should output at least 5. (The string may contain longer verbal subsequences.)

*From the official Fall 2026 Midterm 2 Practice 1.*`,
      rubric: [
        '(3 pts) Clear English description of the recursive function, and how to call it',
        '(4 pts) Correct recurrence with base case: both "skip this symbol" and "a word starts here"',
        '(1 pt) Memoization structure and evaluation order',
        '(2 pts) Running time, including the cost of the IsWord calls',
      ],
      hints: [
        String.raw`This is the text-segmentation recurrence with one extra option: the first symbol of the suffix might not belong to any word.`,
        String.raw`Let $MaxWords(i)$ be the answer for the suffix $T[i..n]$. Either $T[i]$ is thrown away, or some word $T[i..j]$ starts at $i$.`,
      ],
      checks: [
        { type: 'mc', q: String.raw`Let $MaxWords(i)$ be the length of the longest verbal subsequence of $T[i..n]$. Which recurrence is correct (for $i \le n$)?`, choices: [
          String.raw`$\max\big\{ MaxWords(i+1),\ \max\{ 1 + MaxWords(j+1) : j \ge i,\ IsWord(T[i..j]) \} \big\}$`,
          String.raw`$\max\{ 1 + MaxWords(j+1) : j \ge i,\ IsWord(T[i..j]) \}$`,
          String.raw`$MaxWords(i+1) + [IsWord(T[i..n])]$`,
          String.raw`$\max\{ MaxWords(i+1),\ 1 + MaxWords(i+1) \}$`], answer: 0,
          explain: String.raw`Either $T[i]$ is not part of any chosen word (skip it: $MaxWords(i+1)$), or the first chosen word starts at $i$ and is $T[i..j]$ for some $j$, followed by the best answer for $T[j+1..n]$. Option B forgets the skip case, so it returns $-\infty$ whenever no word starts at $i$, which is exactly the corrupted case this problem is about.` },
        { type: 'short', q: String.raw`Suppose the only words are <code>ab</code>, <code>ba</code> and <code>aba</code>. What is the length of the longest verbal subsequence of <code>ababa</code>?`, answer: ['2'],
          explain: String.raw`For example ab + ab (positions 1–2 and 3–4), or ba + ba (positions 2–3 and 4–5). Three words would need at least 6 symbols, since every word has length at least 2. So the answer is **2**.` },
        { type: 'mc', q: String.raw`What is the running time if IsWord is called directly inside the recurrence?`, choices: [String.raw`$O(n)$`, String.raw`$O(n^2)$`, String.raw`$O(n^3)$`, String.raw`$O(2^n)$`], answer: 2,
          explain: String.raw`$n$ subproblems; each tries $O(n)$ end positions $j$; each IsWord call costs $O(j - i + 1) = O(n)$. Total $O(n^3)$. The DP itself is only $O(n^2)$ table work; the calls to the black box dominate.` },
      ],
      solution: String.raw`**Subproblem.** For $1 \le i \le n+1$, let $MaxWords(i)$ be the length of the longest verbal subsequence of the suffix $T[i..n]$. We want $MaxWords(1)$.

**Recurrence.**
$$MaxWords(i) = \begin{cases} 0 & \text{if } i > n \\ \max \begin{cases} MaxWords(i+1) \\ \max\big\{ 1 + MaxWords(j+1) \;:\; i \le j \le n,\ IsWord(T[i..j]) \big\} \end{cases} & \text{otherwise} \end{cases}$$
(A max over an empty set is $-\infty$, so the first option always wins when no word starts at $i$.)

*Why it is correct.* Look at the leftmost symbol $T[i]$ of the suffix. In an optimal verbal subsequence, either $T[i]$ is not covered by any word, in which case the rest is a verbal subsequence of $T[i+1..n]$, or $T[i]$ is the first symbol of the first word $T[i..j]$, and the remaining words lie inside $T[j+1..n]$, where they should be as many as possible.

**Memoization.** A one-dimensional array $MaxWords[1..n+1]$.

**Evaluation order.** $i$ from $n+1$ down to 1.

**Time.** There are $n$ entries. Entry $i$ tries every $j$ from $i$ to $n$, and each IsWord call costs $O(j - i + 1) = O(n)$. Total: **$O(n^3)$**, with $O(n)$ space. (Precomputing a table of all IsWord answers also costs $O(n^3)$, so it does not help.)

~~~pseudo
MaxWords(T[1..n]):
    M[n+1] <- 0
    for i <- n down to 1
        M[i] <- M[i+1]                       // skip T[i]
        for j <- i to n
            if IsWord(T[i..j]): M[i] <- max(M[i], 1 + M[j+1])
    return M[1]
~~~

> **Warning.** Do not drop the "skip $T[i]$" option. Without it this is exactly the class algorithm, which fails on inputs that cannot be split into words.`,
    },
    {
      id: 'dp-p1-verbal-code', type: 'code', title: 'Practice 1 · Longest verbal subsequence (code)', difficulty: 2,
      tags: ['mt2-practice-1', 'dp'],
      prompt: String.raw`Implement the algorithm from [Longest verbal subsequence](#/problem/dp-p1-verbal).

<code>verbal(T, words)</code> receives a string <code>T</code> and an array <code>words</code> (the dictionary; a substring is a word exactly when it appears in this array). Return the largest number of non-overlapping substrings of <code>T</code> that are all words.

Examples: <code>verbal("ababa", ["ab", "ba", "aba"])</code> returns 2; <code>verbal("xyz", ["ab"])</code> returns 0.`,
      fn: 'verbal',
      starter: 'function verbal(T, words) {\n  const dict = new Set(words);   // dict.has(s) plays the role of IsWord(s)\n  // return the length of the longest verbal subsequence of T\n}\n',
      reference: function (T, words) {
        const dict = new Set(words), n = T.length, M = new Array(n + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) { M[i] = M[i + 1]; for (let j = i; j < n; j++) if (dict.has(T.slice(i, j + 1))) M[i] = Math.max(M[i], 1 + M[j + 1]); }
        return M[0];
      },
      tests: [
        ['ababa', ['ab', 'ba', 'aba']],
        ['xyz', ['ab']],
        ['', ['a']],
        ['STUDYNAMICEXTRAPROGRAMBLE', ['STUDY', 'AM', 'ICE', 'TRAP', 'RAMBLE', 'DYNAMIC', 'EXTRA', 'PROGRAM', 'A', 'I', 'RAM', 'PRO', 'GRAM', 'DY', 'NAM', 'MIC', 'RAP', 'BLE', 'AMBLE']],
        ['aaaaaaa', ['aa', 'aaa']],
        ['abcabcabc', ['abc', 'bca', 'cab', 'b']],
      ],
      gen: () => {
        const al = 'abc', rnd = (k) => Array.from({ length: k }, () => al[Math.floor(Math.random() * 3)]).join('');
        const words = Array.from({ length: 1 + Math.floor(Math.random() * 5) }, () => rnd(1 + Math.floor(Math.random() * 3)));
        return [rnd(Math.floor(Math.random() * 14)), words];
      },
      hints: [String.raw`$M[i]$ = answer for the suffix starting at index $i$; start with $M[i] = M[i+1]$ (skip), then try every word $T[i..j]$.`],
      solution: String.raw`~~~pseudo
function verbal(T, words) {
  const dict = new Set(words), n = T.length, M = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    M[i] = M[i + 1];                                   // T[i] is not in any word
    for (let j = i; j < n; j++)
      if (dict.has(T.slice(i, j + 1))) M[i] = Math.max(M[i], 1 + M[j + 1]);
  }
  return M[0];
}
~~~`,
    },
  ],
});
