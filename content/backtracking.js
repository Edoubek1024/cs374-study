CS374.topic({
  id: 'backtracking',
  unit: 'algorithms',
  order: 12,
  title: 'Backtracking',
  summary: 'Recursive brute force over a sequence of decisions: n-queens, subset sum, text segmentation, LIS, palindromes, two-string and interval problems, games and graph search — and how the right recursive formulation leads directly to dynamic programming.',
  objectives: [
    'Structure a backtracking algorithm as a sequence of decisions with a recursive call per choice',
    'Distinguish decision, search, counting and optimization versions of a problem',
    'Write backtracking algorithms for subset sum, n-queens and text segmentation, and analyze their running time',
    'Give both the "take it or leave it" and the "what comes next" (jump) recursive formulations of LIS',
    'Choose recursion parameters (indices into the input) so that the algorithm can later be memoized into a DP',
    'Recognize the standard shapes (pieces, subsequences, two strings, intervals, targets, games, graph brute force), prove backtracking algorithms correct by induction, and solve their running-time recurrences',
  ],
  lesson: String.raw`## What is backtracking?

Many problems ask us to find a structure (a subset, a sequence, a placement) satisfying some constraints, or the best such structure. A **backtracking** algorithm builds the solution **one decision at a time**. At each step it considers every possible choice for the next decision that is consistent with the decisions made so far, and for each choice it **recursively** solves the remaining problem. If a choice leads to a dead end, the algorithm "backtracks" and tries the next choice.

> **Key idea.** A backtracking algorithm is a recursive brute-force search, organized so that each recursive call solves a **smaller instance of the same problem**. The recursion tree is the tree of partial solutions. To design one, ask: *What is the first decision? What are its possible outcomes? After making it, what smaller problem remains, and what information about past decisions does the rest of the search need?*

Generic shape:

~~~pseudo
Backtrack(state of the partial solution):
    if the partial solution is complete:
        return whether / how good it is
    for each possible next choice c consistent with the state:
        result_c = Backtrack(state after making choice c)
    combine the results (OR for decision, + for counting, max/min for optimization)
~~~

The key design principle (Erickson): the recursive subproblem should be described by **as little information as possible** — ideally just a few indices into the original input. Not only does that make the algorithm simpler; it is exactly what makes the later conversion to dynamic programming possible.

### The five design questions

Every backtracking solution you write in this course should answer these five questions, in this order. On exams, the answers *are* the solution.

1. **What does a solution look like as a sequence of decisions?** A subset: in/out per element. A segmentation: where each word ends. A subsequence: take/skip per element, or "which element comes next".
2. **What is the next decision, and what are its outcomes?** Two outcomes for in/out; at most n for "where does the piece end".
3. **What smaller problem remains, and what must it know about the past?** This determines the **parameters** — as little as possible: "the suffix starting at i", "the last element taken was A[j]", "the remaining target is t".
4. **What does the function return, in English, in terms of its parameters?** "F(i, j) is the length of the longest ... of A[i..n] such that ...". Without this sentence nobody can check the recurrence.
5. **What are the base cases and the top-level call?** The answer might be F(1), $\max_i F(i)$, or F(0, 1) with a sentinel.

> **Exam tip.** Graders read the English specification first. A recurrence without one loses many points; a flawed recurrence *with* a clear specification can still earn partial credit.

## The n-queens problem

Place n queens on an $n\times n$ chessboard so that no two attack each other (no two share a row, a column, or a diagonal). Since each row holds exactly one queen, the decisions are: *in which column does the queen in row 1 go? Row 2? ...* Represent a partial solution by $Q[1..r-1]$, where $Q[i]$ is the column of the queen in row i.

~~~pseudo
PlaceQueens(Q[1..n], r):          // queens already placed legally in rows 1..r-1
    if r = n + 1:
        print Q                     // a complete solution
    else:
        for j = 1 to n:             // try column j for row r
            legal = True
            for i = 1 to r - 1:
                if Q[i] = j or Q[i] = j + r - i or Q[i] = j - r + i:
                    legal = False   // same column or same diagonal
            if legal:
                Q[r] = j
                PlaceQueens(Q[1..n], r + 1)
~~~

Call PlaceQueens(Q, 1). The test Q[i] = j ± (r − i) detects diagonals: two squares are on a common diagonal iff their row difference equals their column difference in absolute value.

**Analysis.** A legal partial placement of r queens uses r distinct columns, so there are at most $n!/(n-r)!$ nodes at depth r of the recursion tree, and at most $\sum_r n!/(n-r)! \le e\cdot n!$ nodes in all; each node does $O(n^2)$ work checking. The number of solutions for n = 1, ..., 8 is 1, 0, 0, 2, 10, 4, 40, 92. For n = 4 the two solutions are $Q = (2,4,1,3)$ and $(3,1,4,2)$.

~~~steps Tracing PlaceQueens on a 4×4 board
**Root.** PlaceQueens(Q, 1) tries columns 1, 2, 3, 4 for row 1; all are legal, so the root has four children. We write a partial solution as the list of columns chosen so far.
+++
**Branch (1).** Row 2: column 1 is the same column, column 2 is on a diagonal ($\lvert 1-2\rvert = 1 = 2-1$). Columns 3 and 4 are legal.

- (1, 3): row 3 — columns 1 and 3 are already used; columns 2 and 4 are diagonal to the queen at (2, 3). **Dead end.**
- (1, 4): row 3 — only column 2 is legal. Then (1, 4, 2): row 4 — columns 1, 2, 4 are used; column 3 is diagonal to (3, 2). **Dead end.**

The whole subtree under column 1 fails. Backtrack to the root.
+++
**Branch (2).** Row 2: columns 1 and 3 are diagonal, 2 is used; only column 4 is legal. (2, 4): row 3 — only column 1 is legal (2 and 4 used, 3 diagonal to (2, 4)). (2, 4, 1): row 4 — column 3 is not attacked by any queen. **Solution (2, 4, 1, 3).** The loops continue (we want *all* solutions) but find nothing else here.
+++
**Branches (3) and (4).** The board is symmetric under the reflection $j \mapsto 5 - j$, and the algorithm's behavior mirrors: under (3) it finds **(3, 1, 4, 2)**; under (4) it explores (4, 1), then (4, 1, 3), then (4, 2), and every one dies.
+++
**Counting.** The recursion tree has 17 nodes: the root, 4 nodes at depth 1, 6 at depth 2, 4 at depth 3, and 2 at depth 4 (the two solutions). Compare $4^4 = 256$ one-queen-per-row placements: pruning illegal partial placements early is what makes backtracking practical, though the worst case stays exponential.
~~~

## Decision, search, counting, optimization

The same recursive structure answers different questions — only the **combine** step changes:

| Version | Question | Combine the recursive results with |
|---|---|---|
| Decision | *Is there* a solution? | OR (return True as soon as one branch succeeds) |
| Search | *Find* a solution | return the first successful branch's solution, extended by the choice |
| Counting | *How many* solutions? | sum |
| Optimization | What is the *best* value? | max or min |

In CS 374 we usually first solve the **decision or value version** (True/False, or the optimal value), then recover an actual solution afterward by retracing the choices. Exam questions that ask for "the length of the longest ..." want the value only.

## Subset sum

**Problem.** Given positive integers $X[1..n]$ and a target T, is there a subset of X whose elements sum to exactly T?

**First decision:** is X[1] (or X[n]) in the subset? Either way, what remains is a subset sum problem on the other elements, with target T − X[1] if we took it, or T if we didn't. Using an index into X instead of copying arrays:

~~~pseudo
SubsetSum(i, t):    // is there a subset of X[i..n] summing to t?
    if t = 0: return True
    if t < 0 or i > n: return False
    return SubsetSum(i+1, t) or SubsetSum(i+1, t - X[i])
~~~

The answer is SubsetSum(1, T). (A full correctness proof follows below.)

**Running time.** $T(n) = 2T(n-1) + O(1) = O(2^n)$. The recursion tree is a full binary tree of depth n — one leaf for every subset.

**A small trace.** X = [3, 5, 2], T = 7. The recursion tree branches on "skip X[i]" (left) or "take X[i]" (right):

~~~pseudo
SS(1,7)
├─ skip 3: SS(2,7)
│   ├─ skip 5: SS(3,7)
│   │   ├─ skip 2: SS(4,7) -> False (i > n)
│   │   └─ take 2: SS(4,5) -> False
│   └─ take 5: SS(3,2)
│       ├─ skip 2: SS(4,2) -> False
│       └─ take 2: SS(4,0) -> True      // subset {5, 2}
└─ (never explored: the OR already succeeded)
~~~

With short-circuit OR the search stops at the first success; in the worst case (answer False) all $2^n$ leaves are visited.

**Search version.** Return the subset instead of True:

~~~pseudo
FindSubset(i, t):        // returns a subset of X[i..n] with sum t, or NONE
    if t = 0: return {}
    if t < 0 or i > n: return NONE
    S = FindSubset(i+1, t)
    if S != NONE: return S
    S = FindSubset(i+1, t - X[i])
    if S != NONE: return S + {X[i]}
    return NONE
~~~

### A complete correctness proof

Backtracking correctness proofs are always the same strong induction, whose hypothesis is "the Recursion Fairy's answers are right". Here is SubsetSum, written as you would on an exam.

> **Theorem.** For every index $1 \le i \le n+1$ and every integer t, SubsetSum(i, t) returns True if and only if some subset of $X[i..n]$ sums to t.

*Proof.* By induction on $n - i + 1$, the number of remaining elements; assume the claim for all calls with fewer remaining elements. We follow the algorithm's cases in order.

- **t = 0.** The algorithm returns True, and the empty subset sums to 0. Correct.
- **t < 0.** The algorithm returns False. Every element is positive, so every subset of $X[i..n]$ has a nonnegative sum and none sums to t. Correct.
- **i > n and t > 0.** The only subset of the empty range is the empty set, with sum $0 \ne t$. False is correct.
- **i ≤ n and t > 0.** Both recursive calls have $n - i$ remaining elements, so the inductive hypothesis applies to them.
  - ($\Rightarrow$) Suppose the algorithm returns True. If SubsetSum(i+1, t) is True, some $S \subseteq X[i+1..n]$ sums to t, and S is also a subset of $X[i..n]$. If SubsetSum(i+1, t − X[i]) is True, some $S \subseteq X[i+1..n]$ sums to $t - X[i]$, and $S \cup \{X[i]\}$ is a subset of $X[i..n]$ summing to t.
  - ($\Leftarrow$) Suppose some subset S of $X[i..n]$ sums to t. If S does not contain X[i], then S is a subset of $X[i+1..n]$ with sum t, so the first call returns True. If S contains X[i], then $S \setminus \{X[i]\}$ is a subset of $X[i+1..n]$ with sum $t - X[i]$, so the second call returns True. Either way the algorithm returns True.

Termination is clear because i increases in every call. ∎

The shape generalizes: **one case per outcome of the decision**. The "$\Leftarrow$" direction uses that you tried *every* outcome; the "$\Rightarrow$" direction checks that every outcome you tried was *legal*.

### Try it first: three equal parts

**Problem.** Given positive integers $X[1..n]$ with total S, decide whether X can be split into **three** sub-multisets with equal sums. A tempting idea: if S is divisible by 3, find one subset with sum S/3 using SubsetSum, remove it, and check whether the rest can be split in two. Is that correct? If not, give a correct backtracking algorithm.

~~~~reveal Solution: three equal parts
**The two-phase idea is wrong.** Take X = [1, 1, 1, 2, 2, 2], S = 9, target 3. The split {1, 2}, {1, 2}, {1, 2} works, but if the first phase returns {1, 1, 1}, the remaining {2, 2, 2} cannot be split into two parts of sum 3.

**Backtracking.** The decision for each element is *which bin gets it*. The rest of the search only needs to know how much more each bin needs; the three needs add up to the sum of the remaining elements, so two numbers suffice.

Let $R(i) = X[i] + \cdots + X[n]$. Define **Part3(i, a, b)** = True iff the elements $X[i..n]$ can be distributed among three bins so that bin 1 receives exactly a, bin 2 receives exactly b, and bin 3 receives exactly $R(i) - a - b$.

~~~pseudo
Part3(i, a, b):
    c = R(i) - a - b
    if a < 0 or b < 0 or c < 0: return False
    if i > n: return True                  // here a = b = c = 0 automatically
    return Part3(i+1, a - X[i], b)         // X[i] goes to bin 1
        or Part3(i+1, a, b - X[i])         // X[i] goes to bin 2
        or Part3(i+1, a, b)                // X[i] goes to bin 3 (c drops by X[i])
~~~

If 3 does not divide S, answer False; otherwise call Part3(1, S/3, S/3). (At $i > n$, $R(i) = 0$ and $a, b, c \ge 0$ sum to 0, so all needs are met.)

**Time.** Three recursive calls on $n - 1$ remaining elements: $T(n) = 3T(n-1) + O(1) = O(3^n)$. The parameters are (i, a, b) with $0 \le a, b \le S/3$, so memoizing gives $O(nS^2)$ time, again pseudo-polynomial. (Symmetry trick: X[1] may always go to bin 1, cutting the plain search by a factor of 3.)
~~~~

## Text segmentation (splittable strings)

**Problem.** Given a string $A[1..n]$ and a subroutine IsWord(w) that says whether w is a word, can A be split into a sequence of words? For example BOTHEARTHANDSATURNSPIN splits as BOTH·EARTH·AND·SATURN·SPIN (and also as BOT·HEART·HANDS·AT·URNS·PIN).

**First decision:** where does the first word end? If the first word is $A[i..j]$, the rest of the problem is whether the suffix $A[j+1..n]$ is splittable. The only information the recursive call needs is where the suffix starts:

~~~pseudo
Splittable(i):          // can the suffix A[i..n] be split into words?
    if i > n: return True                 // the empty string is splittable
    for j = i to n:
        if IsWord(A[i..j]) and Splittable(j+1):
            return True
    return False
~~~

Call Splittable(1).

**Running time without memoization.** In the worst case (a string that is not splittable, such as AAA...AB with every string of A's a word), every split is explored. Counting IsWord calls, $T(n) \le \sum_{k=0}^{n-1} T(k) + O(n)$ with $T(0) = O(1)$, which solves to $T(n) = O(2^n)$ (indeed $T(n) - T(n-1) \approx T(n-1)$). There are $2^{n-1}$ ways to segment a string of length n, and the recursion may explore all of them.

**But notice:** Splittable has only **n + 1 distinct arguments** (i = 1, ..., n+1). The exponential time comes from recomputing the same Splittable(i) over and over. Memoizing it gives $O(n^2)$ calls to IsWord — this is the bridge to dynamic programming.

### Variations on "where does the first piece end?"

The Splittable recursion is a template for every problem that **cuts a sequence into contiguous pieces**. Only the test on a piece and the combine step change:

| Problem | Test on the first piece A[i..j] | Combine over j | Base case $i > n$ |
|---|---|---|---|
| Can A be split into words? | IsWord | OR | True |
| How many splits into words? | IsWord | sum | 1 |
| Fewest palindromes | IsPalindrome | min of $1 + F(j+1)$ | 0 |
| Maximum total score | none (score of every piece) | max of $\text{Score}(A[i..j]) + F(j+1)$ | 0 |

If the problem also limits the number of pieces, add the number of pieces still allowed as a second parameter.

### Try it first: the most balanced split

**Problem.** Given positive integers $A[1..n]$ and an integer $1 \le k \le n$, split A into exactly k **contiguous** nonempty pieces so that the **largest piece sum is as small as possible**. Example: A = [7, 2, 5, 10, 8], k = 2: the best split is [7, 2, 5 | 10, 8] with largest sum 18. Give a backtracking algorithm with an English specification and analyze the memoized version.

~~~reveal Solution: the most balanced split
**Decision.** Where does the first piece end? If it is $A[i..j]$, the rest $A[j+1..n]$ must be split into $k - 1$ pieces, and the cost of the whole split is the larger of the first piece's sum and the cost of the rest.

**Specification.** For $1 \le i \le n$ and $1 \le p \le n - i + 1$, let **Bal(i, p)** = the minimum, over all ways to split $A[i..n]$ into exactly p contiguous nonempty pieces, of the largest piece sum.

**Recurrence.** Writing $\Sigma(i, j) = A[i] + \cdots + A[j]$,
$$\text{Bal}(i, p) = \begin{cases} \Sigma(i, n) & \text{if } p = 1 \\ \displaystyle\min_{i \le j \le n - p + 1} \max\{\Sigma(i, j),\ \text{Bal}(j+1, p-1)\} & \text{if } p \ge 2.\end{cases}$$
The upper limit $j \le n - p + 1$ leaves at least one element for each of the remaining $p - 1$ pieces. The answer is Bal(1, k).

**Check on the example.** Bal(1, 2) = min over first pieces [7], [7,2], [7,2,5], [7,2,5,10] of max(first sum, rest sum) = min(max(7, 25), max(9, 23), max(14, 18), max(24, 8)) = 18.

**Analysis.** Plain recursion explores all $\binom{n-1}{k-1}$ splits (choose $k-1$ of the $n-1$ gaps). Memoized: $O(nk)$ pairs (i, p), each scanning O(n) values of j with O(1)-time prefix sums: $O(n^2k)$ total, filling i from n down to 1.
~~~

## Longest increasing subsequence

A **subsequence** of A[1..n] keeps some elements in their original order (not necessarily contiguous). Find the length of the longest **strictly increasing** subsequence. For A = [3, 1, 4, 1, 5, 9, 2, 6], one LIS is 3, 4, 5, 9 (another is 1, 4, 5, 6): length 4.

### Formulation 1: take it or leave it ("next element")

Scan left to right; for each element, decide whether to include it. To decide whether A[j] *can* be included, we must remember the last element taken — so the recursive subproblem has two parameters:

> **Definition.** LISbigger(i, j) = the length of the longest increasing subsequence of A[j..n] whose elements are all larger than A[i].

$$\text{LISbigger}(i, j) = \begin{cases} 0 & \text{if } j > n \\ \text{LISbigger}(i, j+1) & \text{if } A[i] \ge A[j] \\ \max\{\text{LISbigger}(i, j+1),\; 1 + \text{LISbigger}(j, j+1)\} & \text{otherwise} \end{cases}$$

Add a sentinel $A[0] = -\infty$; the answer is LISbigger(0, 1).

### Formulation 2: what comes next ("jump")

Instead of deciding about every element, decide **which element comes next** in the subsequence:

> **Definition.** LISfirst(i) = the length of the longest increasing subsequence of A[i..n] that **starts with** A[i].

$$\text{LISfirst}(i) = 1 + \max\{\text{LISfirst}(j) : i < j \le n \text{ and } A[j] > A[i]\},$$

where the max of an empty set is 0. The LIS can start anywhere, so the answer is $\max_{1 \le i \le n}\text{LISfirst}(i)$ — or add the sentinel $A[0] = -\infty$ and return LISfirst(0) − 1.

For A = [3, 1, 4, 1, 5, 9, 2, 6]:

| i | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| A[i] | 3 | 1 | 4 | 1 | 5 | 9 | 2 | 6 |
| LISfirst(i) | 4 | 4 | 3 | 3 | 2 | 1 | 2 | 1 |

Both formulations take exponential time as plain recursion ($\Theta(2^n)$ in the worst case, e.g. on a sorted array), but LISbigger has only $O(n^2)$ distinct arguments and LISfirst only $O(n)$, each computable in O(n) time from smaller ones — both lead to $O(n^2)$ dynamic programs.

> **Exam tip.** When the natural recursion needs to remember something about the past (here: the last element chosen), add it to the parameters — but make it an **index** into the input (j), not a value or a whole list. Indices keep the number of distinct subproblems polynomial.

## Two sequences: look at the first (or last) characters

With two strings A[1..m] and B[1..n], the subproblems are pairs of suffixes (or prefixes), and the decision is about the **first characters** A[i] and B[j]: is A[i] used, is B[j] used, are they matched to each other?

- **LCS(i, j)**, the longest common subsequence of A[i..m] and B[j..n]: if $A[i] = B[j]$ it is safe to match them, giving $1 + \text{LCS}(i+1, j+1)$; otherwise one of them is unused, giving $\max\{\text{LCS}(i+1, j), \text{LCS}(i, j+1)\}$; 0 if either suffix is empty.
- **Edit distance** is usually written on *prefixes*: Edit(i, j) is the fewest insertions, deletions and substitutions turning A[1..i] into B[1..j]. The last column of an optimal alignment deletes A[i], inserts B[j], or lines up A[i] with B[j]:
$$\text{Edit}(i, j) = \min\{\text{Edit}(i-1, j) + 1,\ \text{Edit}(i, j-1) + 1,\ \text{Edit}(i-1, j-1) + [A[i] \ne B[j]]\},$$
with Edit(i, 0) = i and Edit(0, j) = j. For example, Edit(FOOD, MONEY) = 4.

Without memoization both are exponential: the mismatch case of LCS makes two calls whose sizes shrink by one, so on two strings with no common characters the tree has $\binom{m+n}{m}$ leaves. With $(m+1)(n+1)$ distinct subproblems, memoization gives $O(mn)$.

### Try it first: interleaving

**Problem.** A string C is a **shuffle** of A and B if C interleaves the characters of A and B, keeping each string's characters in order (e.g. CHOCOLATE is a shuffle of CHOAT and COLE). Given A[1..m], B[1..n] and C[1..m+n], give a backtracking algorithm that decides whether C is a shuffle of A and B.

~~~reveal Solution: interleaving
**Decision.** The next character of C came from the front of A or of B. After using i characters of A and j of B, exactly $i + j$ characters of C are consumed, so (i, j) is all the recursion needs.

**Specification.** **Shuf(i, j)** = True iff $C[i+j+1..m+n]$ is a shuffle of $A[i+1..m]$ and $B[j+1..n]$, for $0 \le i \le m$, $0 \le j \le n$.

$$\text{Shuf}(i, j) = \begin{cases} \text{True} & i = m \text{ and } j = n \\ \big(i < m \wedge A[i+1] = C[i+j+1] \wedge \text{Shuf}(i+1, j)\big) \vee \big(j < n \wedge B[j+1] = C[i+j+1] \wedge \text{Shuf}(i, j+1)\big) & \text{otherwise.}\end{cases}$$

The answer is Shuf(0, 0). (Check the lengths first: if $\lvert C\rvert \ne m + n$, the answer is False.)

**Why both branches are needed.** When $A[i+1] = B[j+1] = C[i+j+1]$, either string could supply the character. "Prefer A" fails on A = AB, B = AC, C = ACAB: taking the first A from A leaves B and AC to produce CAB, which is impossible; taking it from B works.

**Time.** Plain recursion: two calls, each reducing $(m - i) + (n - j)$ by one: $O(2^{m+n})$. Memoized: $(m+1)(n+1)$ subproblems, O(1) each, $O(mn)$ total.
~~~

## Intervals: look at both ends

Some problems are naturally about a **substring** A[i..j] that shrinks from either end: palindromes, games where players take from either end of a row, parenthesizations. The subproblem then has two parameters, the endpoints.

~~~steps Designing an algorithm for the longest palindromic subsequence
**The problem.** Given A[1..n], find the length of the longest subsequence that is a palindrome (reads the same forwards and backwards). For A = BBABCBCAB the answer is 7, for example BABCBAB. We answer the five design questions one at a time.
+++
**Q1–Q2: the next decision.** A palindrome is built from its outermost pair inwards. So look at the two **ends** A[i] and A[j] of the current string: is A[i] used? Is A[j]? If both are used, they are the outermost pair, matched to each other — which requires $A[i] = A[j]$.
+++
**Q3: what remains?** Drop A[i] (leaves A[i+1..j]), drop A[j] (leaves A[i..j−1]), or match them (leaves A[i+1..j−1] and adds 2). Every remaining problem is a substring: two indices describe it.
+++
**Q4: specification.** **LPS(i, j)** = the length of the longest palindromic subsequence of the substring A[i..j].
+++
**Q5: recurrence, base cases, final call.**
$$\text{LPS}(i, j) = \begin{cases} 0 & i > j \\ 1 & i = j \\ 2 + \text{LPS}(i+1, j-1) & i < j \text{ and } A[i] = A[j] \\ \max\{\text{LPS}(i+1, j),\ \text{LPS}(i, j-1)\} & \text{otherwise.}\end{cases}$$
The answer is LPS(1, n).
+++
**Justify the greedy-looking case.** When $A[i] = A[j]$, why is matching them optimal? Take any palindromic subsequence P of A[i..j]. If P uses neither end, wrap A[i] and A[j] around it: longer. If P uses only A[i], matched with a last character at position $j' < j$, replace that character by A[j] (the same letter): same length, both ends used. So some optimal P matches A[i] with A[j], and its inside is a palindromic subsequence of A[i+1..j−1].
+++
**Running time.** Plain recursion: the mismatch case makes two calls on strings one shorter, $T(\ell) = 2T(\ell - 1) + O(1)$, so $O(2^n)$. But there are only $O(n^2)$ pairs (i, j), each O(1) from shorter substrings. Memoize, filling by increasing length $j - i$: $O(n^2)$ time.
~~~

## Game trees

Two-player games with perfect information (tic-tac-toe, Nim) are also solved by backtracking: the decision at each node is the current player's move, and the recursion tree is the **game tree**.

Assume the game always ends, has no draws, and **a player who cannot move loses**. A position is **winning** if the player about to move can force a win, **losing** otherwise:

- A position is **winning** iff *some* move leads to a **losing** position (for the opponent, who moves next).
- A position is **losing** iff *every* move leads to a **winning** position. In particular, a position with no moves is losing.

~~~pseudo
Win(P):          // True iff the player to move at position P can force a win
    for each legal move from P to P':
        if not Win(P'):
            return True     // move to P' and the opponent is stuck in a losing position
    return False            // every move hands the opponent a winning position (or no moves)
~~~

Correctness is induction on the length of the longest remaining game. The game tree is usually exponentially large, but **positions repeat**, so memoizing on the position helps whenever positions have a compact description.

### Try it first: a subtraction game

**Problem.** A pile has n tokens; a move removes 1, 3 or 4 tokens; whoever cannot move (empty pile) loses. Write the recursion for Win(n), compute it for n = 0..10, and find (and prove) the pattern of losing positions.

~~~reveal Solution: a subtraction game
Win(n) = True iff one of Win(n−1), Win(n−3), Win(n−4) (those with a nonnegative argument) is False; Win(0) = False. Computing upward:

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Win(n) | L | W | L | W | W | W | W | L | W | L | W |

The losing positions are exactly the n with $n \bmod 7 \in \{0, 2\}$. *Proof by induction:* from residue 0 or 2 every move lands on residue 6, 4, 3 (from 0) or 1, 6, 5 (from 2) — never on 0 or 2, so all moves go to winning positions. From every other residue there is a move to residue 0 or 2: from 1 remove 1, from 3 remove 3, from 4 remove 4, from 5 remove 3, from 6 remove 4 (each move is available since $n \ge$ the residue).

Memoized, Win(n) costs O(n) total time — but the pattern answers it in O(1).
~~~

**Games with scores: minimax.** With numeric outcomes, the player to move takes the **max** over moves of what they can guarantee. When the players split a fixed total V, "what I can guarantee" is V minus "what my opponent can guarantee from the position I leave".

### Try it first: coins in a row

**Problem.** A row of coins with positive values $A[1..n]$ lies on the table. Two players alternate turns; on each turn a player takes the coin at **either end** of the row. Each player wants to maximize the total value they collect. Describe a backtracking algorithm that computes the largest total the first player can guarantee. Then show that the greedy strategy "always take the larger end coin" is not optimal.

~~~reveal Solution: coins in a row
**State.** The remaining coins are always a contiguous block A[i..j]. Phrasing the function from the point of view of "the player to move" means we need not record whose turn it is.

**Specification.** **Best(i, j)** = the largest total that the player about to move can guarantee to collect from the row A[i..j], assuming the opponent also plays optimally.

**Recurrence.** Let $\Sigma(i, j) = A[i] + \cdots + A[j]$. If the mover takes A[i], the opponent moves first on A[i+1..j] and guarantees Best(i+1, j); the mover gets everything else, $\Sigma(i, j) - \text{Best}(i+1, j)$. Similarly for A[j]. So
$$\text{Best}(i, j) = \begin{cases} 0 & i > j \\ \Sigma(i, j) - \min\{\text{Best}(i+1, j),\ \text{Best}(i, j-1)\} & i \le j. \end{cases}$$
The answer is Best(1, n).

**Greedy fails.** A = [8, 15, 3, 7]. Greedy takes 8 (larger than 7); then the opponent takes 15 and the first player ends with at most $8 + 7 = 15$. Optimal: take 7. Now the row is [8, 15, 3]; whichever end the opponent takes, the first player takes 15 next, and the first player finishes with 22. The recurrence confirms Best(1, 4) = 22.

**Time.** Plain recursion: two calls on rows one shorter, $O(2^n)$. Memoized: $O(n^2)$ pairs, O(1) each with prefix sums: $O(n^2)$.
~~~

## Brute force on graphs

Problems like independent set, clique, vertex cover and coloring are **NP-hard**, so no polynomial-time algorithm is expected — but backtracking still gives a correct algorithm, and a careful choice of decision beats the obvious $2^n$.

**Maximum independent set.** An independent set contains no two adjacent vertices. The decision: is vertex v in the set?

~~~pseudo
MaxIS(G):                         // size of the largest independent set of G
    if G has no vertices: return 0
    pick any vertex v
    if v has no neighbors: return 1 + MaxIS(G - v)      // always safe to take v
    without = MaxIS(G - v)                               // v is not in the set
    with    = 1 + MaxIS(G - N[v])                        // v is in: delete v and all its neighbors
    return max(without, with)
~~~

Here N[v] is v plus its neighbors. *Correctness:* an independent set either avoids v (so it is an independent set of G − v) or contains v and none of its neighbors (so the rest of it is an independent set of G − N[v]); conversely each option yields an independent set of G.

*Running time.* If v has a neighbor, the second call deletes at least two vertices: $T(n) \le T(n-1) + T(n-2) + \text{poly}(n)$, the Fibonacci recurrence, so $T(n) = O(\phi^n \cdot \text{poly}(n)) = O(1.62^n)$ — better than all $2^n$ subsets. (Branching on a vertex of degree at least 3 gives $T(n-1) + T(n-4)$, about $1.38^n$; graphs with maximum degree 2 are disjoint paths and cycles, which are easy.)

**Graph coloring.** To decide whether G can be colored with k colors, color the vertices in order and let the decision for vertex i be its color, trying every color not used by an already-colored neighbor. The recursion tree has $O(k^n)$ nodes. Its state includes the whole partial coloring, not just the index i — which is why this backtracking algorithm does **not** turn into a polynomial DP (and for $k \ge 3$ none is expected: 3-coloring is NP-hard).

> **Key idea.** Backtracking is always available as a correct (exponential) algorithm. It becomes an efficient DP only when the information the recursion needs about past decisions can be summarized by a few indices or small numbers.

## Analyzing backtracking algorithms

- Write the recurrence by counting recursive calls: SubsetSum makes 2 calls on size n−1, so $2T(n-1) + O(1) = O(2^n)$. PlaceQueens is bounded by counting legal partial solutions.
- Exponential running time is **expected** for backtracking — the point is correctness first. Pruning (stopping a branch as soon as it can't succeed, like $t < 0$ in subset sum or illegal queens) helps in practice but rarely changes the worst case.
- The real payoff comes from noticing that the recursion has **few distinct subproblems**:

| Recursion | Distinct subproblems | Work per subproblem | Memoized time |
|---|---|---|---|
| Splittable(i) | n + 1 | O(n) IsWord calls | $O(n^2)$ |
| LISbigger(i, j) | $O(n^2)$ | O(1) | $O(n^2)$ |
| LISfirst(i) | n + 1 | O(n) | $O(n^2)$ |
| SubsetSum(i, t) | $O(nT)$ | O(1) | $O(nT)$ |
| LCS(i, j), Shuf(i, j) | $O(mn)$ | O(1) | $O(mn)$ |
| LPS(i, j), Best(i, j) | $O(n^2)$ | O(1) | $O(n^2)$ |
| Bal(i, p) | $O(nk)$ | O(n) | $O(n^2k)$ |

### Recurrences that show up in backtracking

Plain backtracking costs (**number of recursion-tree nodes**) × (work per node). These recurrences cover almost every case:

| Recursion shape | Recurrence | Solution | Example |
|---|---|---|---|
| two choices, one element consumed | $T(n) = 2T(n-1) + O(1)$ | $\Theta(2^n)$ | subset sum, LPS mismatch case |
| k choices, one element consumed | $T(n) = kT(n-1) + O(1)$ | $\Theta(k^n)$ | k-coloring, 3-way partition (k = 3) |
| one choice consumes 1, the other 2 | $T(n) = T(n-1) + T(n-2) + O(1)$ | $\Theta(\phi^n)$, $\phi \approx 1.618$ | max independent set |
| "where does the first piece end?" | $T(n) = \sum_{k=0}^{n-1} T(k) + O(1)$ | $\Theta(2^n)$ | Splittable, palindrome splits |
| choose the next of the remaining items | $T(n) = nT(n-1) + O(1)$ | $\Theta(n!)$ | generating all permutations |
| two sequences, one advances | $T(m, n) = T(m-1, n) + T(m, n-1) + O(1)$ | $\Theta\big(\binom{m+n}{m}\big)$ | LCS on disjoint alphabets |

Derivations: for the "first piece" recurrence (with equality), subtracting the equation for $T(n-1)$ gives $T(n) = 2T(n-1)$. For $T(n) = nT(n-1) + c$, divide by $n!$: $T(n)/n! = T(n-1)/(n-1)! + c/n!$, and $\sum c/n!$ converges (to at most $c\,e$), so $T(n) = \Theta(n!)$.

> **Warning.** Count *nodes*, not just leaves, and multiply by the work per node. A recursion that loops over n choices does O(n) work per node even if most choices are pruned.

## From backtracking to dynamic programming

Dynamic programming = **smart recursion**: a backtracking algorithm + memoization (store each subproblem's answer the first time it is computed) or, equivalently, filling a table in an order where every subproblem's dependencies are ready. Hence the workflow you'll use for every DP problem in this course:

1. Find a correct **backtracking** recursion whose parameters are a few indices/small numbers.
2. Describe in **English** what each recursive call returns (in terms of its parameters).
3. Count distinct subproblems; store answers in an array indexed by the parameters; fill it in a good order.

## Common exam problem patterns

Almost every backtracking (and later DP) exam question has one of these shapes. Recognize the shape and the parameters nearly write themselves.

| Shape | Parameters | The decision | Examples |
|---|---|---|---|
| 1. Cut a sequence into pieces | i = start of the remaining suffix (+ pieces left) | where the first piece ends | segmentation, palindrome pieces, balanced split |
| 2. Subsequence, take-or-skip | (last taken index, next index) | take A[j] (if compatible) or skip it | LIS, zigzag |
| 3. Subsequence, jump | i = current element; "starts at A[i]" | which element comes next | LISfirst |
| 4. Two sequences | (i, j) positions in both | first/last characters: unused, or matched | LCS, edit distance, interleaving |
| 5. Intervals | (i, j) endpoints | one end, both ends, or a split point | LPS, coins game |
| 6. Numbers and targets | (i, remaining target) | skip or use X[i] / which bin | subset sum, partition |
| 7. Games | the position | the mover's move | subtraction game, coins |
| 8. Graph brute force | the remaining graph (+ budget) | vertex in/out, or which endpoint of an edge | independent set, vertex cover, coloring |

**Recipes.**
- *Shape 1:* try every end j of the first piece, test it, recurse on j + 1; base case is the empty suffix (True / 1 / 0 depending on the combine).
- *Shapes 2–3:* remember the past as an **index**, never as a value list. With "starts at A[i]", the final answer is a max over i or uses a sentinel.
- *Shapes 4–5:* list *everything* that can happen to the first characters (or the two ends). Committing to a match without trying alternatives needs an exchange argument. Memoize by increasing total length.
- *Shape 6:* prune negative targets only when inputs are positive; memoized time is **pseudo-polynomial** — say so.
- *Shape 7:* phrase the function from the point of view of the player to move; Win(P) = OR over moves of NOT Win(P'); scores use "total minus the opponent's best".
- *Shape 8:* shrink the graph in each branch, bound the recursion tree ($2^n$, $\phi^n$, $2^k$, $k^n$), and don't promise polynomial time — these problems are NP-hard.

## Where students lose points

- **No English specification.** A formula alone is not checkable. Say what the function returns *in terms of its parameters*, and make sure the value depends only on the parameters and the input ("the best answer so far" is not a function of i).
- **Missing the top-level call.** Splittable(1), $\max_i \text{LISfirst}(i)$, Bal(1, k) — say it. Returning LISfirst(1) is wrong.
- **Wrong base cases.** Splittable(n+1) is True; the number of splits of the empty string is 1, not 0; SubsetSum must check t = 0 *before* checking whether elements remain.
- **Greedy instead of trying all choices.** Taking every allowed A[j] in LIS, the longest dictionary word first, the A-branch first in interleaving, or the larger coin are all wrong. If you do commit to one choice (LCS and LPS match cases), **prove** it safe.
- **Forgetting to update the state.** After taking A[j] in LISbigger, the "last" parameter becomes j; after a move in a game, the players swap roles.
- **Miscounting in counting versions.** Each solution must be exactly one root-to-leaf path. Returning 1 as soon as t = 0 undercounts when X may contain zeros: for X = [5, 0], T = 5 it returns 1, but {5} and {5, 0} both work.
- **Sets as parameters.** "The set of items chosen so far" gives exponentially many subproblems. Look for an index-based reformulation — or, for an NP-hard problem, say the algorithm is exponential.
- **Running time errors.** A loop that recurses for every j gives $\sum_k T(k)$, not $T(n-1) + O(n)$; distinct subproblems are not the same as recursive calls; $O(nT)$ is not polynomial.

## Self-check

Answer each question before opening its box.

~~~reveal 1. What does Splittable(n+1) return, and why does that matter?
True: the empty suffix is a sequence of zero words. Every successful chain of recursive calls ends at Splittable(n+1), so if it returned False no string could ever be split.
~~~

~~~reveal 2. An algorithm on input size n loops over j = 1..n and recurses once on size n − j for each j. What is its running time?
$T(n) = \sum_{k=0}^{n-1} T(k) + O(n)$. Subtracting the equation for $T(n-1)$ gives $T(n) = 2T(n-1) + O(1)$, so $\Theta(2^n)$.
~~~

~~~reveal 3. In the subtraction game where a move removes 1 or 2 tokens (a player who cannot move loses), which pile sizes are losing?
The multiples of 3. From 3k every move goes to 3k − 1 or 3k − 2, from which the opponent can return to a multiple of 3; from 3k + 1 or 3k + 2 you can move to 3k. Win(0) = False starts the induction.
~~~

~~~reveal 4. Is MaxIS(G − N[v]) a good subproblem for dynamic programming?
Not in general: subproblems are induced subgraphs, and there can be $2^n$ of them. The backtracking algorithm is still correct, in $O(1.62^n)$ time. (The problem is NP-hard; on special graphs such as trees a DP does exist.)
~~~

~~~reveal 5. LPS(i, j) with A[i] = A[j]: why is 2 + LPS(i+1, j−1) correct without a max over the other options?
Exchange argument: any palindromic subsequence of A[i..j] can be changed to use A[i] and A[j] as its outer pair without getting shorter (add the pair if neither end is used; if one end is used, replace its partner by the other end, which is the same letter).
~~~

~~~reveal 6. Memoized subset sum runs in O(nT) time. Why doesn't that prove P = NP?
$O(nT)$ is not polynomial in the input size: T takes about $\log T$ bits to write, and $nT$ is exponential in $\log T$. This is pseudo-polynomial time.
~~~

## Midterm 2 exam patterns

On Midterm 2, backtracking rarely appears on its own. The usual question is "**(a)** describe a recursive backtracking algorithm and analyze it, **(b)** turn it into an efficient dynamic program", or a two-player game whose recursion you must memoize. The recursion you write in part (a) *is* the DP of part (b), so choose its parameters with part (b) in mind: indices into the input and small numbers, never lists or sets.

### Recognize the shape from the wording

| The question says... | Parameters | The first decision | Plain → memoized |
|---|---|---|---|
| "split / segment / cut A into pieces" (prefix/suffix) | i: the suffix A[i..n] still to cut | where the first piece ends | $2^n$ → $O(n^2)$ |
| "subsequence in which consecutive chosen elements ..." | i: the current (last chosen) element | which element comes next | $2^n$ → $O(n^2)$ |
| two strings, two lists, two stacks | (i, j): positions in both | what happens to the two first elements | $\binom{m+n}{m}$ → $O(mn)$ |
| "using at most k ..." | the usual indices + budget left b | as without the budget; some choices spend one unit | multiply by $k + 1$ |
| "substring", "palindrome", "take from either end" (interval) | (i, j): the endpoints | the two ends | $2^n$ → $O(n^2)$ |
| two players alternate | the position | the mover's move | game tree → #positions × #moves |
| graph or set problems (NP-hard) | the remaining graph / visited set | is v in? which endpoint? | stays exponential |

### An answer template for "(a) backtrack, (b) DP"

~~~pseudo
(a) Decision:  "Consider the first <element / character / move>. Either ..., or ..."
    Spec:      F(<indices>) = <what it returns> for <the part of the input that remains>
    Recursion: base cases;  F(...) = OR / + / max / min over the legal choices
    Top call:  answer = F(<start>)   (or a max over anchors, or a sentinel)
    Time:      recurrence for the calls, e.g. T(n) = 2T(n-1) + O(1) = O(2^n)
(b) Memo:      F[<index ranges>]          (#distinct parameter values = #subproblems)
    Order:     F(...) reads F(...) with larger i / a shorter interval  =>  loops
    Time:      #subproblems x work per subproblem;  space = #subproblems
~~~

The plain running time in part (a) is graded separately: give the recurrence for the *unmemoized* recursion there, and the memoized bound only in part (b).

### Mistakes that cost points on these questions

- **Unmemoizable parameters**: "the list chosen so far", "the partial string built so far". Part (b) then has no polynomial table. Pass indices; carry sums or budgets only as small integers.
- **Mixing up the two running times**: the memoized time in part (a), or the plain recurrence in part (b).
- **Greedy commitments** inside the recursion (the longest word, the larger coin, always matching) without an exchange argument. When in doubt, try every choice.
- **Base cases copied instead of derived**: subset sum checks t = 0 before i > n; in a *misère* game (taking the last token loses), the empty position is a **win** for the player to move.
- **Pruning that needs positive inputs** (stop when t < 0) used when the input may contain negative numbers.
- **Games written from a fixed player's view** with no "whose turn" information. Phrase the function for the player to move.
- **Promising polynomial time for an NP-hard problem.** If the state must contain a set, say "exponential" and give the best bound you can prove.

### Try it first: divisibility chains

**Problem.** Given distinct positive integers $A[1..n]$, find the length of the longest subsequence in which **every element divides the next one**. (a) Give a backtracking algorithm and its running time. (b) Turn it into a dynamic program. (c) Run it on A = [3, 2, 6, 4, 12, 8, 24].

~~~~reveal Solution: divisibility chains
**(a) Backtracking.** Consecutive chosen elements must be compatible, so anchor the recursion on the current element and decide **which element comes next** (the "jump" formulation of LIS).

**Spec.** For $1 \le i \le n$, **Chain(i)** = the length of the longest subsequence of A[i..n] that **starts with** A[i] and in which every element divides the next.

$$\text{Chain}(i) = 1 + \max\big(\{0\} \cup \{\text{Chain}(j) : i < j \le n \text{ and } A[i] \text{ divides } A[j]\}\big).$$

The base case is built in: when no j qualifies (for example i = n), Chain(i) = 1. The chain may start anywhere, so the answer is $\max_{1 \le i \le n} \text{Chain}(i)$ (or add a sentinel A[0] = 1, which divides everything, and return Chain(0) − 1).

**Plain running time.** If every A[i] divides every later A[j] (for example 1, 2, 4, 8, ...), Chain(i) calls Chain(j) for every j > i, so $T(n) = \sum_{k < n} T(k) + O(n)$, which is $\Theta(2^n)$.

**(b) Dynamic program.** Only n distinct subproblems. Memo: an array Chain[1..n]. Order: Chain[i] reads Chain[j] only for j > i, so fill i from n down to 1. Time: n entries × O(n) candidates = $O(n^2)$; space O(n).

~~~steps Filling Chain[i] for A = [3, 2, 6, 4, 12, 8, 24], right to left
**i = 7, 6, 5.** Chain[7] = 1 (24 has no later element). Chain[6] = 1 + Chain[7] = 2, since 8 divides 24. Chain[5] = 1 + Chain[7] = 2: 12 does not divide 8, but it divides 24.
+++
**i = 4 (A[4] = 4).** Candidates: 12 (Chain 2), 8 (Chain 2), 24 (Chain 1). Chain[4] = 1 + 2 = 3, for example 4, 8, 24.
+++
**i = 3 (A[3] = 6).** 6 does not divide 4 or 8; it divides 12 (Chain 2) and 24 (Chain 1). Chain[3] = 3: 6, 12, 24.
+++
**i = 2 (A[2] = 2).** 2 divides 6, 4, 12, 8, 24 with Chain values 3, 3, 2, 2, 1. Chain[2] = 4. Notice that Chain[5] and Chain[7] are read again here: the plain recursion would recompute them each time.
+++
**i = 1 (A[1] = 3).** 3 divides 6 (Chain 3), 12 (2) and 24 (1). Chain[1] = 4.
+++
**Answer.** Chain = [4, 4, 3, 3, 2, 2, 1], so the answer is **4**: for example 3, 6, 12, 24 or 2, 4, 8, 24. To output a chain, start at an i with the maximum value and repeatedly move to a later j with A[i] dividing A[j] and Chain[j] = Chain[i] − 1.
~~~
~~~~

### Try it first: the two-stack game

**Problem.** Two stacks of coins with positive values $A[1..m]$ and $B[1..n]$ lie on the table, with A[1] and B[1] on top. Two players alternate; on each turn the player to move takes the **top coin of either nonempty stack**. Each player wants to maximize their own total. (a) Give a backtracking algorithm for the largest total the first player can guarantee, and analyze it. (b) Memoize it. (c) Show that "always take the larger top coin" is not optimal, using A = [4, 8] and B = [1].

~~~reveal Solution: the two-stack game
**State.** The coins left are always A[i..m] and B[j..n], so (i, j) describes the position. Phrase the function for the **player to move**, so no turn flag is needed.

**Spec.** **Best(i, j)** = the largest total that the player about to move can guarantee from the coins A[i..m] and B[j..n], against an optimal opponent. Let R(i, j) = A[i] + ... + A[m] + B[j] + ... + B[n].

**Recurrence.** Whatever the opponent can guarantee from the position we leave, we get the rest:
$$\text{Best}(i, j) = \begin{cases} 0 & i > m \text{ and } j > n\\ R(i, j) - \min\{\text{Best}(i+1, j) \text{ (if } i \le m),\ \text{Best}(i, j+1) \text{ (if } j \le n)\} & \text{otherwise.}\end{cases}$$
The answer is Best(1, 1).

**(a) Plain time.** Two recursive calls, each removing one coin: $T(N) = 2T(N - 1) + O(1)$ with $N = m + n$, so $O(2^{m+n})$ (plus the cost of computing R, which is O(1) with precomputed suffix sums).

**(b) Memoized.** Table Best[1..m+1][1..n+1]; Best(i, j) reads (i+1, j) and (i, j+1), so fill i from m + 1 down to 1 and, for each i, j from n + 1 down to 1. $O(mn)$ time and space.

**(c) Greedy fails.** The values: Best(3, 2) = 0, Best(2, 2) = 8, Best(3, 1) = 1, Best(2, 1) = 9 − min(1, 8) = 8, Best(1, 2) = 12 − 8 = 4, and Best(1, 1) = 13 − min(Best(2, 1), Best(1, 2)) = 13 − min(8, 4) = **9**. Greedy takes the 4 (larger than 1); that uncovers the 8 for the opponent, and the first player ends with 4 + 1 = 5. Optimal: take the 1. The opponent is forced to take the 4, uncovering the 8 for us: 1 + 8 = 9. The recurrence finds this because it minimizes the *opponent's* value over the positions we can leave.
~~~
`,
  cheatsheet: String.raw`## Backtracking recipe (the five questions)
1. Solution = sequence of decisions. What is the **next decision** and its outcomes?
2. For each outcome, recurse on what remains (Recursion Fairy).
3. Parameters = **indices into the input** (plus small numbers), never sets or copies.
4. **English spec** of the function in terms of its parameters.
5. Base cases + **top-level call** (F(1)? $\max_i F(i)$? sentinel?).
6. Combine: OR (decision), first success (search), + (count), max/min (optimize).

## Templates
~~~pseudo
Decide(i):                      Count(i):                     Best(i):
  if i > n: return True           if i > n: return 1            if i > n: return 0
  for each choice c:              total = 0                     best = -infinity
    if legal(c) and Decide(i')      for each legal choice c:      for each legal choice c:
      return True                     total += Count(i')            best = max(best, val(c) + Best(i'))
  return False                    return total                  return best
~~~
Games: <code>Win(P) = OR over moves P->P' of (not Win(P'))</code>; no moves ⇒ losing.

## Standard recursions
- **Subset sum:** $SS(i,t) = SS(i+1,t) \lor SS(i+1, t - X[i])$; $t=0$: True; $t<0$ or $i>n$: False.
- **n-queens:** row by row; column $j$ legal iff no $Q[i]=j$ and no $\lvert Q[i]-j\rvert = r-i$. Counts 1,0,0,2,10,4,40,92.
- **Splittable(i):** True if $i>n$; else $\bigvee_{j\ge i}$ [IsWord(A[i..j]) ∧ Splittable(j+1)].
- **LISbigger(i, j):** skip A[j], or (if A[j] > A[i]) $1 + $LISbigger(j, j+1). Answer LISbigger(0,1), $A[0]=-\infty$.
- **LISfirst(i)** $= 1 + \max\{\text{LISfirst}(j): j>i, A[j]>A[i]\}$. Answer $\max_i$ LISfirst(i).
- **LCS(i, j):** 0 if a suffix is empty; $1+$LCS(i+1,j+1) if $A[i]=B[j]$; else max(LCS(i+1,j), LCS(i,j+1)).
- **Edit(i, j)** (prefixes) $= \min\{E(i-1,j)+1, E(i,j-1)+1, E(i-1,j-1)+[A[i]\ne B[j]]\}$; $E(i,0)=i$, $E(0,j)=j$.
- **LPS(i, j):** 0 if $i>j$, 1 if $i=j$; $2+$LPS(i+1,j−1) if $A[i]=A[j]$; else max(LPS(i+1,j), LPS(i,j−1)).
- **Shuf(i, j):** C[i+j+1] taken from A[i+1] or B[j+1] (try both); True at $(m,n)$.
- **Bal(i, p)** (min largest piece, p contiguous pieces): $\min_j \max\{\Sigma(i,j), \text{Bal}(j+1,p-1)\}$; Bal(i,1) = $\Sigma(i,n)$.
- **Coins game Best(i, j)** $= \Sigma(i,j) - \min\{\text{Best}(i+1,j), \text{Best}(i,j-1)\}$.
- **MaxIS(G)** $= \max\{\text{MaxIS}(G-v),\ 1+\text{MaxIS}(G-N[v])\}$.
- **Vertex cover ≤ k:** pick an edge uv; VC(G−u, k−1) ∨ VC(G−v, k−1). $O(2^k(n+m))$.

## Backtracking recurrences
| Recurrence | Solution | Typical source |
|---|---|---|
| $2T(n-1)+O(1)$ | $\Theta(2^n)$ | in/out per element |
| $kT(n-1)+O(1)$ | $\Theta(k^n)$ | k choices per element (coloring) |
| $T(n-1)+T(n-2)+O(1)$ | $\Theta(\phi^n)\approx 1.618^n$ | MaxIS branching |
| $\sum_{k<n}T(k)+O(1)$ | $\Theta(2^n)$ | "where does the first piece end" |
| $nT(n-1)+O(1)$ | $\Theta(n!)$ | permutations |
| $T(m-1,n)+T(m,n-1)+O(1)$ | $\Theta\binom{m+n}{m}$ | two strings, one advances |

## Memoized costs
| Recursion | Subproblems | Time |
|---|---|---|
| Splittable, LISfirst | $n+1$ | $O(n^2)$ |
| LISbigger, LPS, coins | $O(n^2)$ | $O(n^2)$ |
| LCS, edit distance, shuffle | $O(mn)$ | $O(mn)$ |
| SubsetSum(i,t) | $O(nT)$ | $O(nT)$ pseudo-poly |
| Bal(i,p) | $O(nk)$ | $O(n^2k)$ |

## Pitfalls
- Empty-suffix base cases: Splittable(n+1) = True; #splits of "" = 1.
- LISfirst answer is a max over all start positions, not LISfirst(1).
- Committing to one choice (LCS/LPS match case) needs an exchange argument; greedy usually fails (coins, interleaving, 3-partition).
- Counting: each solution exactly once (early "t = 0 ⇒ 1" is wrong if zeros allowed).
- $O(nT)$ is **pseudo-polynomial**; graph brute force (IS, coloring) stays exponential.

### Exam checklist
- The decision in words: "either X[i] is in or out", "the first piece is A[i..j]", "the mover takes ...".
- **English spec** of F in terms of its parameters (indices / small integers only).
- Base cases derived from the rules: empty suffix; t = 0 before i > n; no moves ⇒ lose (misère: Win(0) = True).
- **Top-level call**: F(1)? $\max_i F(i)$? sentinel? Win(start)?
- **Plain** time: recurrence for the calls × work per call ($2T(n-1) + O(n) = \Theta(2^n)$; $\sum_{k<n} T(k) = \Theta(2^n)$; three calls ⇒ $3^n$).
- **Memoized** time: #distinct subproblems × work each; say "pseudo-polynomial" if a numeric target appears.
- Any greedy commitment has an exchange argument; otherwise try every choice.
- Games: "total minus the opponent's best", or OR of NOT; the turn alternates.
- State contains a set ⇒ exponential; say so instead of claiming a polynomial DP.
`,
  quiz: [
    {
      type: 'short',
      q: 'How many solutions does the 8-queens problem have? (Give a number.)',
      answer: ['92'],
      explain: String.raw`Backtracking (PlaceQueens) finds all 92. The sequence for n = 1..8 is 1, 0, 0, 2, 10, 4, 40, 92. The brute-force space of $\binom{64}{8} \approx 4.4\times 10^9$ placements is never enumerated: one queen per row and pruning illegal partial placements cut the tree down to a few thousand nodes.`,
    },
    {
      type: 'mc',
      q: 'The backtracking SubsetSum(i, t) makes two recursive calls on i+1. What is its worst-case running time on n numbers?',
      choices: [String.raw`$O(n)$`, String.raw`$O(n^2)$`, String.raw`$O(nT)$`, String.raw`$O(2^n)$`],
      answer: 3,
      explain: String.raw`$T(n) = 2T(n-1) + O(1) = O(2^n)$: the recursion tree is a full binary tree with one leaf per subset. $O(nT)$ is what you get only after **memoizing** on (i, t).`,
    },
    {
      type: 'tf',
      q: 'Without memoization, the backtracking algorithm Splittable(i) for text segmentation can take exponential time.',
      answer: true,
      explain: String.raw`On a non-splittable string like AAA...AB where every run of A's is a word, all $2^{n-1}$ segmentations of the prefix are explored. The recurrence $T(n) \le \sum_{k<n} T(k) + O(n)$ gives $O(2^n)$. Memoizing the n + 1 distinct values Splittable(i) brings it to $O(n^2)$ IsWord calls.`,
    },
    {
      type: 'mc',
      q: String.raw`LISbigger(i, j) is the length of the longest increasing subsequence of A[j..n] whose elements all exceed A[i]. If $A[j] > A[i]$, which is correct?`,
      choices: [
        String.raw`$\text{LISbigger}(i,j) = 1 + \text{LISbigger}(i, j+1)$`,
        String.raw`$\text{LISbigger}(i,j) = \max\{\text{LISbigger}(i, j+1),\ 1 + \text{LISbigger}(j, j+1)\}$`,
        String.raw`$\text{LISbigger}(i,j) = \max\{\text{LISbigger}(i, j+1),\ 1 + \text{LISbigger}(i, j+1)\}$`,
        String.raw`$\text{LISbigger}(i,j) = 1 + \text{LISbigger}(j, j+1)$`,
      ],
      answer: 1,
      explain: String.raw`We may skip A[j] (the remaining elements must still exceed A[i]) or take it (then the remaining elements must exceed A[j], the new last element — so the first parameter becomes j). Taking A[j] is not always optimal (e.g. A[j] is huge), so we need the max. Option C forgets to update the "last element" parameter.`,
    },
    {
      type: 'multi',
      q: 'Which of these are decision problems? (select all that apply)',
      choices: ['Does X contain a subset summing to T?', 'Find a subset of X summing to T.', 'How many subsets of X sum to T?', 'Can string A be split into words?', 'What is the length of the longest increasing subsequence of A?'],
      answer: [0, 3],
      explain: 'Decision problems have yes/no answers. "Find a subset" is a search problem, "how many" is counting, and "the length of the longest" is an optimization (value) problem. All can be solved by the same recursion with a different combine step (OR, first success, +, max).',
    },
    {
      type: 'mc',
      q: 'How many distinct subproblems does the recursion Splittable(i) have on a string of length n?',
      choices: ['n + 1', String.raw`$O(n^2)$`, String.raw`$2^{n-1}$`, 'n!'],
      answer: 0,
      explain: String.raw`The only parameter is the start index i of the suffix, from 1 to n + 1. The recursion tree can have exponentially many *nodes*, but they are repeated copies of these n + 1 subproblems — which is why memoization helps so much. ($2^{n-1}$ is the number of segmentations, not subproblems.)`,
    },
    {
      type: 'tf',
      q: String.raw`With LISfirst(i) = length of the longest increasing subsequence of A[i..n] that starts with A[i], the length of the LIS of A is always LISfirst(1).`,
      answer: false,
      explain: String.raw`The LIS need not start with A[1]: for A = [9, 1, 2, 3], LISfirst(1) = 1 but the LIS has length 3. The answer is $\max_i \text{LISfirst}(i)$, or LISfirst(0) − 1 with a sentinel $A[0] = -\infty$.`,
    },
    {
      type: 'mc',
      q: 'Which recursion parameters for subset sum make the algorithm easiest to memoize later?',
      choices: [
        'The list of elements chosen so far',
        'An index i (meaning we only consider X[i..n]) and the remaining target t',
        'A copy of the remaining array and the remaining target',
        'The set of elements not yet considered',
      ],
      answer: 1,
      explain: String.raw`(i, t) has at most $(n+1)(T+1)$ values, so a 2D table can store every answer. Sets or arrays as parameters describe the same subproblems but can't be indexed into a polynomial-size table (there are $2^n$ possible sets).`,
    },
    {
      type: 'mc',
      q: 'Why does the recursion tree of PlaceQueens have O(n!) nodes rather than n^n?',
      choices: [
        'Because the algorithm stops after the first solution',
        'A legal placement of r queens in rows 1..r uses r distinct columns, so there are at most n!/(n−r)! of them',
        'Because only queens on the main diagonal are tried',
        'It actually has n^n nodes',
      ],
      answer: 1,
      explain: String.raw`Every node at depth r corresponds to a legal partial solution, which assigns distinct columns to rows 1..r: an injective map, of which there are $n!/(n-r)!$. Summing over r gives at most $e\cdot n!$ nodes. Diagonal pruning cuts this further in practice.`,
    },
    {
      type: 'tf',
      q: 'Memoizing SubsetSum(i, t) gives an O(nT)-time algorithm, which is polynomial in the size of the input.',
      answer: false,
      explain: String.raw`The input size is about $n\log T$ bits (T is written in binary), and $nT$ is exponential in $\log T$. Such algorithms are called **pseudo-polynomial**. Subset sum is NP-hard, so we don't expect a truly polynomial algorithm.`,
    },
    {
      type: 'mc',
      q: 'To decide whether a multiset X of positive integers can be split into two parts with equal sums, a good reduction is:',
      choices: [
        'Run SubsetSum(X, S) where S is the total sum',
        'If the total S is odd answer No; otherwise run SubsetSum(X, S/2)',
        'Sort X and alternate elements between the two parts',
        'Run SubsetSum(X, 0)',
      ],
      answer: 1,
      explain: String.raw`A part with sum S/2 exists iff the complement also has sum S/2. Greedy alternation fails (e.g. [3, 3, 2, 2, 2]: sum 12, parts {3,3} and {2,2,2} work, but alternating sorted elements gives {3,2,2} = 7 vs {3,2} = 5). SubsetSum(X, 0) is trivially True.`,
    },
    {
      type: 'short',
      q: 'What is the length of the longest increasing subsequence of [3, 1, 4, 1, 5, 9, 2, 6]? (Give a number.)',
      answer: ['4'],
      explain: String.raw`For example 3, 4, 5, 9 or 1, 4, 5, 6. LISfirst values are 4, 4, 3, 3, 2, 1, 2, 1, and the maximum is 4. No length-5 increasing subsequence exists.`,
    },
    {
      type: 'mc',
      q: 'In the game-tree view of a two-player game, a position is a winning position for the player to move if:',
      choices: [
        'every move leads to a winning position for the opponent',
        'some move leads to a losing position for the opponent',
        'some move leads to a winning position for the opponent',
        'the game tree below it has an even number of leaves',
      ],
      answer: 1,
      explain: 'The player to move needs just one good move: one that leaves the opponent in a position from which they lose no matter what. A position is losing if every move leads to a winning position for the opponent. The recursion alternates "exists" and "for all".',
    },
    {
      type: 'mc',
      q: String.raw`LPS(i, j) is the length of the longest palindromic subsequence of A[i..j]. If $i < j$ and $A[i] \ne A[j]$, which recurrence is correct?`,
      choices: [
        String.raw`$\text{LPS}(i,j) = \text{LPS}(i+1, j-1)$`,
        String.raw`$\text{LPS}(i,j) = \max\{\text{LPS}(i+1, j),\ \text{LPS}(i, j-1)\}$`,
        String.raw`$\text{LPS}(i,j) = 1 + \max\{\text{LPS}(i+1, j),\ \text{LPS}(i, j-1)\}$`,
        String.raw`$\text{LPS}(i,j) = \text{LPS}(i+1, j) + \text{LPS}(i, j-1)$`,
      ],
      answer: 1,
      explain: String.raw`Different end characters cannot be the outer pair of the same palindrome, so at least one of them is unused: drop A[i] or drop A[j], and take the better. Option A drops both, which can lose a palindrome that uses one end (e.g. ABA inside ABAC). Option C adds a character that isn't matched to anything, and D double-counts.`,
    },
    {
      type: 'short',
      q: 'What is the length of the longest palindromic subsequence of BBABCBCAB? (Give a number.)',
      answer: ['7'],
      explain: String.raw`For example BABCBAB (positions 2, 3, 4, 5, 6, 8, 9 are B, A, B, C, B, A, B). The interval recursion LPS(i, j) with memoization computes this in $O(n^2)$ time and confirms that no palindromic subsequence of length 8 or 9 exists.`,
    },
    {
      type: 'mc',
      q: String.raw`The backtracking algorithm for maximum independent set branches on a vertex v of degree at least 1: either delete v, or take v and delete v and all its neighbors. Which bound on its running time follows?`,
      choices: [String.raw`$O(2^n)$ and nothing better`, String.raw`$O(\phi^n \cdot \text{poly}(n))$ with $\phi \approx 1.618$`, String.raw`$O(n^2)$`, String.raw`$O(n!)$`],
      answer: 1,
      explain: String.raw`Taking v removes at least 2 vertices, so $T(n) \le T(n-1) + T(n-2) + \text{poly}(n)$, the Fibonacci recurrence, giving $O(\phi^n \text{poly}(n)) \approx O(1.62^n)$. (Vertices of degree 0 are simply taken, a single call.) $O(2^n)$ is also a valid upper bound, but not the best this analysis gives; no polynomial bound is expected since the problem is NP-hard.`,
    },
    {
      type: 'tf',
      q: 'In a game where a player who cannot move loses, a position from which no moves are possible is a losing position for the player to move.',
      answer: true,
      explain: String.raw`"Winning" requires *some* move to a losing position; with no moves, there is none. In the pseudocode Win(P), the loop over moves is empty and the function returns False. This is the base case of every game-tree recursion.`,
    },
    {
      type: 'mc',
      q: 'In the subtraction game where a move removes 1, 3 or 4 tokens (and a player who cannot move loses), which of these pile sizes is a LOSING position for the player to move?',
      choices: ['5', '6', '9', '10'],
      answer: 2,
      explain: String.raw`The losing positions are exactly $n \bmod 7 \in \{0, 2\}$: 0, 2, 7, 9, 14, 16, ... From 9 the moves go to 8, 6 and 5, all winning (8 → 7, 6 → 2, 5 → 2). From 5 or 6 you can move to 2, and from 10 you can move to 9 or 7.`,
    },
    {
      type: 'short',
      q: 'Coins with values 8, 15, 3, 7 lie in a row; players alternately take a coin from either end, each maximizing their own total. What is the largest total the first player can guarantee? (Give a number.)',
      answer: ['22'],
      explain: String.raw`Take 7 first. The row is 8, 15, 3; whichever end the opponent takes, the first player then takes 15, for $7 + 15 = 22$. Greedily taking the larger end (8) lets the opponent grab 15 and leaves the first player with only 15. Best(i, j) = $\Sigma(i,j) - \min\{\text{Best}(i+1,j), \text{Best}(i,j-1)\}$ confirms 22.`,
    },
    {
      type: 'multi',
      q: 'Which recursion parameters give only polynomially many distinct subproblems (in n, the input length)? (select all that apply)',
      choices: ['A start index i into A[1..n]', 'A pair of indices (i, j)', 'The set of vertices still in the graph', 'The partial coloring of vertices 1..i−1', 'An index i and the number of pieces p ≤ n still to form'],
      answer: [0, 1, 4],
      explain: String.raw`An index has n + 1 values, a pair $O(n^2)$, and (i, p) $O(n^2)$. A subset of vertices has $2^n$ possibilities and a partial coloring up to $k^{n}$, so recursions carrying those cannot be memoized into a polynomial table. (A remaining *numeric target* t gives O(nT) subproblems, which is pseudo-polynomial — not polynomial in the input length.)`,
    },
    {
      type: 'mc',
      q: String.raw`A backtracking algorithm that generates all orderings of n items picks the first item (n choices) and recurses on the remaining $n - 1$ items, doing O(1) extra work per call. Its number of calls satisfies $T(n) = nT(n-1) + O(1)$. What is $T(n)$?`,
      choices: [String.raw`$\Theta(n^2)$`, String.raw`$\Theta(2^n)$`, String.raw`$\Theta(n!)$`, String.raw`$\Theta(n^n)$`],
      answer: 2,
      explain: String.raw`Divide by $n!$: $T(n)/n! = T(n-1)/(n-1)! + c/n!$, and $\sum_k c/k!$ converges, so $T(n) = \Theta(n!)$. The extra O(1) per call adds only a constant factor (about e) — there are $n!$ leaves and fewer than $e \cdot n!$ nodes in total. $n^n$ would require n choices at *every* level.`,
    },
    {
      type: 'tf',
      q: String.raw`Pruning the branch "t < 0" in the subset-sum backtracking algorithm reduces its worst-case running time to a polynomial.`,
      answer: false,
      explain: String.raw`Pruning helps in practice but not in the worst case: if every element is small relative to T (or the answer is False for another reason), the recursion still explores $\Omega(2^n)$ or close to it. For example, with X = [1, 1, ..., 1] and T = n + 1 no branch ever goes negative before i > n, and all $2^n$ leaves are visited. Only memoization changes the bound (to the pseudo-polynomial O(nT)).`,
    },
    {
      type: 'mc',
      q: 'For the simultaneous segmentation problem (one set of break positions must split both A and B into words), a student runs Splittable on A and on B separately and returns the AND of the answers. This is:',
      choices: [
        'correct, and faster than the joint recursion',
        'wrong: each string may be splittable using different break positions',
        'correct only if A and B have the same length',
        'wrong: it can say No when the answer is Yes',
      ],
      answer: 1,
      explain: String.raw`If both strings are splittable with a common set of breaks, both separate tests say Yes — so the AND never says No wrongly. But the converse fails: A and B might each be splittable only at *different* positions, and the AND would answer Yes incorrectly. The correct recursion Split2(i) requires IsWord(A[i..j]) **and** IsWord(B[i..j]) for the same j.`,
    },
    {
      type: 'mc',
      q: 'How many ways are there to split an array of n elements into exactly k nonempty contiguous pieces?',
      choices: [String.raw`$k^n$`, String.raw`$\binom{n-1}{k-1}$`, String.raw`$\binom{n}{k}$`, String.raw`$2^{n-1}$`],
      answer: 1,
      explain: String.raw`A split is determined by which of the $n - 1$ gaps between consecutive elements are cut, and exactly $k - 1$ cuts are needed: $\binom{n-1}{k-1}$. Summing over all k gives $2^{n-1}$, the number of splits with any number of pieces. $k^n$ counts assignments of elements to k labeled bins, ignoring contiguity.`,
    },
    {
      type: 'mc',
      q: String.raw`A student counts subsets of X summing to T with: Count(i, t) = 0 if t < 0; **1 if t = 0**; 0 if i > n; else Count(i+1, t) + Count(i+1, t − X[i]). On which input is the answer wrong?`,
      choices: [String.raw`X = [5, 2, 3], T = 5`, String.raw`X = [5, 0], T = 5`, String.raw`X = [1, 1], T = 1`, String.raw`X = [], T = 0`],
      answer: 1,
      explain: String.raw`Returning 1 as soon as t = 0 assumes the only way to finish is to skip everything that remains — true for positive inputs, false with zeros. For X = [5, 0], T = 5: taking 5 reaches t = 0 with the 0 still unconsidered, so the subsets {5} and {5, 0} are counted once instead of twice; the function returns 1 instead of 2. The fix: declare success only when i > n and t = 0.`,
    },
    {
      type: 'mc',
      q: String.raw`In the interleaving problem, Shuf(i, j) asks whether C[i+j+1..] is a shuffle of A[i+1..] and B[j+1..]. When $A[i+1] = B[j+1] = C[i+j+1]$, what should the algorithm do?`,
      choices: [
        'Always take the character from A (any choice works)',
        'Try both: Shuf(i+1, j) OR Shuf(i, j+1)',
        'Take it from whichever string is longer',
        'Return False, since the shuffle is ambiguous',
      ],
      answer: 1,
      explain: String.raw`Either string might be the right source, and a wrong choice can fail later: A = AB, B = AC, C = ACAB succeeds only if the first A comes from B. Backtracking tries both; memoizing over the $(m+1)(n+1)$ pairs keeps the total time O(mn).`,
    },
    {
      type: 'mc',
      q: String.raw`A backtracking algorithm makes two recursive calls on inputs of size $n - 1$ and does $O(n)$ extra work in each call (for example, copying an array). What is its running time?`,
      choices: [String.raw`$\Theta(n \cdot 2^n)$`, String.raw`$\Theta(2^n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(4^n)$`],
      answer: 1,
      explain: String.raw`A call on size k does O(k) work, and there are $2^{n-k}$ calls on size k, so the total is $\sum_k 2^{n-k}\cdot O(k) = 2^n \cdot O\big(\sum_k k/2^k\big) = O(2^n)$, because $\sum_k k/2^k$ converges (to 2). Equivalently, divide by $2^n$: $T(n)/2^n = T(n-1)/2^{n-1} + O(n/2^n)$. The bound $O(n \cdot 2^n)$ is true but not tight: most calls are near the bottom of the tree, where the extra work is small. $\Theta(n^2)$ would need only one call per level, and $4^n$ would need four calls.`,
    },
    {
      type: 'tf',
      q: String.raw`If a backtracking algorithm always makes at least two recursive calls, each on an input of size at least $n - 3$, then its running time is exponential in n.`,
      answer: true,
      explain: String.raw`$T(n) \ge 2T(n-3)$ gives $T(n) \ge 2^{\lfloor n/3 \rfloor} \approx 1.26^n$. Shrinking by a *constant amount* only changes the base of the exponential; only shrinking by a constant *fraction* (n/2 in divide and conquer) gives polynomial time. This is why plain backtracking is exponential even when each choice consumes several elements.`,
    },
    {
      type: 'tf',
      q: String.raw`If a backtracking recursion has only $O(n^2)$ distinct subproblems, then running it **without** memoization takes polynomial time.`,
      answer: false,
      explain: String.raw`The number of distinct subproblems bounds the **memoized** running time. Without a memo, the recursion recomputes the same subproblems again and again: RecFib has n + 1 distinct subproblems but $\Theta(\phi^n)$ calls; LCS on strings with no common characters has $(m+1)(n+1)$ distinct subproblems but $\binom{m+n}{m}$ leaves. Few distinct but heavily repeated subproblems is exactly the situation in which memoization pays off.`,
    },
    {
      type: 'mc',
      q: String.raw`In a *misère* subtraction game a move removes 1, 2 or 3 tokens, and the player who takes the **last** token **loses**. With Win(n) = True iff the player to move with n tokens can force a win, and Win(n) = OR over legal moves m of NOT Win(n − m), what is the correct base case?`,
      choices: [
        'Win(0) = False, since no move is possible',
        'Win(0) = True, since the opponent just took the last token',
        'Win(1) = True, since a move is possible',
        'No base case is needed',
      ],
      answer: 1,
      explain: String.raw`With 0 tokens left, the previous player took the last token and lost, so the player "to move" has already won: Win(0) = True. Then Win(1) = NOT Win(0) = False (you must take the last token), Win(2) = Win(3) = Win(4) = True, Win(5) = False, and the losing positions are exactly $n \equiv 1 \pmod 4$. Copying the normal-play base case Win(0) = False silently solves a different game. Always derive the base case from the rules of the game.`,
    },
    {
      type: 'multi',
      q: 'In SubsetSum(i, t) the numbers X may now include **negative** integers. Which shortcuts are still correct? (select all that apply)',
      choices: [
        'Return False as soon as t < 0',
        'Return True as soon as t = 0 (decision version)',
        'Return False if i > n and t ≠ 0',
        'Return False if t is larger than the sum of the positive elements of X[i..n]',
        'Return False if t is smaller than the sum of the negative elements of X[i..n]',
      ],
      answer: [1, 2, 3, 4],
      explain: String.raw`With negative numbers a negative remaining target can come back up: for X = [5, −3] and T = 2, taking 5 leaves t = −3, and taking −3 then reaches 0 — pruning at t < 0 would wrongly answer False. t = 0 can always be completed by taking nothing more (in the decision version; a counting version must wait until i > n). The last two are valid bounds: every subset of X[i..n] has a sum between the sum of its negative elements and the sum of its positive elements.`,
    },
    {
      type: 'mc',
      q: 'To speed up Splittable, a student commits to the **longest** prefix of A[i..n] that is a word and recurses only on what follows it. With dictionary {THE, THEM, MAN}, what does this return on THEMAN?',
      choices: ['True, correctly', 'False, although THEMAN is splittable', 'True, although THEMAN is not splittable', 'It never terminates'],
      answer: 1,
      explain: String.raw`The longest word prefix is THEM, and the rest, AN, has no word prefix, so the greedy answers False — but THE·MAN works. Shortest-first fails too: with dictionary {A, ABC, D}, ABCD starts with A, then BCD fails, although ABC·D works. Backtracking must try **every** end of the first word; memoization still keeps it at $O(n^2)$.`,
    },
    {
      type: 'multi',
      q: 'For which of these backtracking recursions does memoization give a polynomial-time algorithm (polynomial in the input length)? (select all that apply)',
      choices: [
        'Splittable(i) for text segmentation',
        'LISbigger(i, j) for the longest increasing subsequence',
        'SubsetSum(i, t) on n numbers with target T',
        'k-coloring that remembers the colors of vertices 1..i−1',
        'MaxIS(G), recursing on G − v and G − N[v]',
        'Shuf(i, j) for interleaving two strings',
      ],
      answer: [0, 1, 5],
      explain: String.raw`Memoized time = #distinct subproblems × work per subproblem. Splittable has n + 1 subproblems, LISbigger $O(n^2)$ and Shuf $O(mn)$: polynomial. SubsetSum has $O(nT)$ subproblems — pseudo-polynomial, exponential in the bit length of T. The states of the coloring search are partial colorings (up to $k^n$) and those of MaxIS are induced subgraphs (up to $2^n$), so memoizing them does not give a polynomial bound — consistent with both problems being NP-hard.`,
    },
    {
      type: 'mc',
      q: 'MinPal(i) = the fewest palindromes into which A[i..n] can be cut, computed by trying every end j of the first piece. You memoize MinPal, but test "is A[i..j] a palindrome?" by scanning the substring each time. What is the total running time?',
      choices: [String.raw`$O(n)$`, String.raw`$O(n^2)$`, String.raw`$O(n^3)$`, String.raw`$O(2^n)$`],
      answer: 2,
      explain: String.raw`n + 1 subproblems × O(n) choices of j × O(n) per palindrome test = $O(n^3)$. Precomputing a table IsPal(i, j) = $[A[i] = A[j]] \wedge$ IsPal(i+1, j−1) in $O(n^2)$ time makes every test O(1) and the total $O(n^2)$. Running time = entries × choices per entry × **cost of each choice** — the subroutine is part of the cost.`,
    },
    {
      type: 'mc',
      q: String.raw`For the coins-in-a-row game (players alternately take an end coin; all values positive), a student writes $F(i, j) = \max\{A[i] + F(i+1, j),\ A[j] + F(i, j-1)\}$ with F = 0 on an empty row, and claims F(1, n) is the first player's optimal total. What does F(1, n) actually compute?`,
      choices: ['The correct answer', 'The total value of all the coins', 'The total that the greedy strategy collects', 'The second player\'s total'],
      answer: 1,
      explain: String.raw`The recurrence lets the **same** player take every coin; the opponent never moves. Since all values are positive, F(1, n) = A[1] + ... + A[n]. A correct version phrases the function for the player to move and subtracts what the opponent can guarantee: Best(i, j) = $\Sigma(i, j) - \min\{\text{Best}(i+1, j), \text{Best}(i, j-1)\}$ (or carries a "whose turn" flag and alternates max and min).`,
    },
    {
      type: 'mc',
      q: 'For interleaving (is C[1..m+n] a shuffle of A[1..m] and B[1..n]?), a student\'s recursion has parameters (i, j, k): the positions reached in A, B and C. How many distinct subproblems actually occur?',
      choices: [
        'O(mn(m+n)), since the three indices vary independently',
        'O(mn), because k is always i + j',
        'O(m + n), since only k matters',
        String.raw`$2^{m+n}$, one per interleaving`,
      ],
      answer: 1,
      explain: String.raw`Every character of C consumed so far came from A or from B, so k = i + j in every call: the third parameter is determined by the other two. Memoizing on (i, j) gives $(m+1)(n+1)$ subproblems, O(1) each, so $O(mn)$. Dropping a parameter that the others determine is a standard way to shrink a table. Keeping only k is wrong: the same prefix of C can be divided between A and B in different ways.`,
    },
  ],
  flashcards: [
    { front: 'Backtracking in one sentence', back: 'Recursive brute force: make the next decision in every consistent way, recurse on the smaller remaining problem, and combine (OR / first success / sum / max).' },
    { front: 'Subset sum backtracking recursion', back: String.raw`$SS(i,t)$: True if $t = 0$; False if $t < 0$ or $i > n$; else $SS(i+1,t) \lor SS(i+1,t-X[i])$. Time $O(2^n)$.` },
    { front: 'n-queens strategy', back: String.raw`Place one queen per row; for row r try every column j not attacked by earlier queens (same column, or $\lvert Q[i]-j\rvert = r - i$). At most $e\cdot n!$ recursion nodes.` },
    { front: 'Splittable(i)', back: String.raw`Can A[i..n] be split into words? True if $i > n$; otherwise True iff some $j \ge i$ has IsWord(A[i..j]) and Splittable(j+1). Exponential without memoization; n + 1 distinct subproblems.` },
    { front: 'LISbigger(i, j) recurrence', back: String.raw`0 if $j > n$; LISbigger(i, j+1) if $A[i] \ge A[j]$; else $\max\{\text{LISbigger}(i,j+1), 1 + \text{LISbigger}(j, j+1)\}$. Answer: LISbigger(0, 1) with $A[0] = -\infty$.` },
    { front: 'LISfirst(i) recurrence', back: String.raw`$1 + \max\{\text{LISfirst}(j) : j > i, A[j] > A[i]\}$ (empty max = 0). Answer: $\max_i \text{LISfirst}(i)$.` },
    { front: 'Decision vs search vs counting vs optimization', back: 'Same recursion; only the combine changes: OR, return first successful branch, sum, max/min.' },
    { front: 'Why use indices as recursion parameters?', back: 'A few indices have polynomially many values, so subproblems can be stored in a table (memoization). Sets/lists as parameters have exponentially many values.' },
    { front: 'Backtracking → DP', back: 'If the recursion has few distinct subproblems that are solved repeatedly, store each answer (memoize) or fill a table in dependency order. DP = smart recursion.' },
    { front: 'Running time of Splittable without memo', back: String.raw`$T(n) \le \sum_{k=0}^{n-1} T(k) + O(n) = O(2^n)$ (there are $2^{n-1}$ segmentations).` },
    { front: 'Game tree rule', back: 'Position is winning iff some move leads to a losing position for the opponent; losing iff every move leads to a winning position for the opponent.' },
    { front: 'Pseudo-polynomial', back: String.raw`Polynomial in the numeric *value* (e.g. $O(nT)$ for subset sum) but exponential in the input *length* ($\approx \log T$ bits for T).` },
    { front: 'The five backtracking design questions', back: '(1) Solution as a sequence of decisions. (2) The next decision and its outcomes. (3) What remains, and what it must know about the past (= parameters, as indices). (4) English spec of the function in terms of its parameters. (5) Base cases and the top-level call.' },
    { front: 'Longest palindromic subsequence recurrence', back: String.raw`LPS(i, j) on A[i..j]: 0 if $i > j$; 1 if $i = j$; $2 + \text{LPS}(i+1, j-1)$ if $A[i] = A[j]$; else $\max\{\text{LPS}(i+1,j), \text{LPS}(i,j-1)\}$. $O(n^2)$ memoized.` },
    { front: 'Edit distance recurrence (prefixes)', back: String.raw`$\text{Edit}(i,j) = \min\{\text{Edit}(i-1,j)+1,\ \text{Edit}(i,j-1)+1,\ \text{Edit}(i-1,j-1)+[A[i]\ne B[j]]\}$, with Edit(i, 0) = i, Edit(0, j) = j. Decision: what happens in the last column of the alignment.` },
    { front: 'Interleaving (shuffle) recursion', back: String.raw`Shuf(i, j): is C[i+j+1..] a shuffle of A[i+1..] and B[j+1..]? True at (m, n); else try taking C[i+j+1] from A (if it matches A[i+1]) OR from B (if it matches B[j+1]). Try both — greedy fails. $O(mn)$ memoized.` },
    { front: 'Coins-in-a-row game recursion', back: String.raw`Best(i, j) = most the player to move can guarantee from A[i..j] $= \Sigma(i,j) - \min\{\text{Best}(i+1,j), \text{Best}(i,j-1)\}$; Best = 0 on an empty row. Greedy (larger end) fails: [8, 15, 3, 7] gives 22, not 15.` },
    { front: 'Maximum independent set by backtracking', back: String.raw`Pick v. If deg v = 0, take it. Else $\max\{\text{MaxIS}(G - v),\ 1 + \text{MaxIS}(G - N[v])\}$. $T(n) \le T(n-1) + T(n-2) + \text{poly}$, so $O(1.62^n)$.` },
    { front: 'Most balanced split into k contiguous pieces', back: String.raw`Bal(i, p) = min over first-piece ends j of $\max\{\Sigma(i,j), \text{Bal}(j+1, p-1)\}$; Bal(i, 1) = $\Sigma(i, n)$. Answer Bal(1, k). $O(n^2 k)$ memoized.` },
    { front: String.raw`Solve $T(n) = nT(n-1) + O(1)$ and $T(n) = T(n-1) + T(n-2) + O(1)$`, back: String.raw`$\Theta(n!)$ (divide by $n!$; the series $\sum 1/k!$ converges) and $\Theta(\phi^n)$, $\phi = (1+\sqrt5)/2 \approx 1.618$ (Fibonacci).` },
    { front: 'Proof template for a backtracking algorithm', back: String.raw`Strong induction on the size of the remaining input. Check each base case. For the recursive case, one case per outcome of the decision: ($\Rightarrow$) any answer built from a legal outcome is a real solution; ($\Leftarrow$) any real solution falls under some outcome you tried, and the Recursion Fairy finds the rest.` },
    { front: 'Vertex cover of size ≤ k by backtracking', back: String.raw`Pick any edge uv; some endpoint is in every cover. Return VC(G − u, k − 1) OR VC(G − v, k − 1); True if no edges, False if k = 0 and edges remain. $O(2^k (n+m))$ time.` },
    { front: String.raw`Solve $T(n) = 2T(n-1) + O(n)$`, back: String.raw`$\Theta(2^n)$, not $\Theta(n 2^n)$: dividing by $2^n$ gives $T(n)/2^n = T(n-1)/2^{n-1} + O(n/2^n)$, and $\sum_k k/2^k$ converges. Polynomial extra work per call is absorbed when the number of calls doubles per level.` },
    { front: 'Misère game base case', back: String.raw`If taking the last token **loses**, then Win(0) = True: the opponent just took the last token. Derive base cases from the rules. With moves 1, 2, 3 the losing positions become $n \equiv 1 \pmod 4$ instead of multiples of 4.` },
    { front: 'Subset-sum pruning when numbers may be negative', back: String.raw`"Stop when t < 0" is valid only for positive inputs. Always valid: t = 0 ⇒ True (decision version); t outside [sum of remaining negatives, sum of remaining positives] ⇒ False.` },
    { front: 'Few distinct subproblems — so the plain recursion is fast?', back: String.raw`No. The number of distinct subproblems bounds the **memoized** time. Without a memo the recursion repeats them: RecFib has n + 1 subproblems and $\Theta(\phi^n)$ calls.` },
    { front: 'Why can\'t text segmentation commit to one word?', back: 'Longest-first: {THE, THEM, MAN} on THEMAN takes THEM and gets stuck on AN. Shortest-first: {A, ABC, D} on ABCD takes A and gets stuck on BCD. Try every end of the first word (memoized: O(n²)).' },
    { front: 'Scoring games: the right recursion', back: String.raw`Best(position) = (value still on the table) − $\min$ over moves of Best(next position), from the point of view of the player to move. A recurrence like $\max\{A[i] + F(\ldots), A[j] + F(\ldots)\}$ lets one player take everything.` },
    { front: 'Template: "(a) backtracking, (b) DP" exam question', back: '(a) The decision in words, English spec, recursion with base cases, top-level call, and the PLAIN running-time recurrence. (b) Memo table indexed by the parameters, evaluation order, #subproblems × work per subproblem, space.' },
    { front: 'Hamiltonian path: backtracking vs memoization', back: String.raw`Extending a simple path one vertex at a time: up to $e \cdot (n-1)!$ partial paths per start vertex, so $O(n \cdot n!)$ time over all n starts. Memoize on (visited set S, endpoint v): $2^n n$ states × O(n) = $O(2^n n^2)$ — far better, still exponential (the problem is NP-hard).` },
  ],
  problems: [
    {
      id: 'backtracking-nqueens-trace', type: 'written', title: 'Tracing n-queens', difficulty: 1,
      prompt: String.raw`(a) Run PlaceQueens on n = 4 by hand and list every complete solution, written as $(Q[1], Q[2], Q[3], Q[4])$.
(b) In the legality test, explain why the condition $Q[i] = j + r - i$ or $Q[i] = j - r + i$ detects diagonal attacks.
(c) Explain why the number of recursive calls made by PlaceQueens is $O(n!)$.`,
      rubric: ['Both solutions (2,4,1,3) and (3,1,4,2) found, and no others', 'Diagonal condition: |row difference| = |column difference|', 'Counting argument via distinct columns: at most n!/(n−r)! nodes at depth r'],
      hints: ['Start with Q[1] = 1 and see that every branch dies; then Q[1] = 2.', String.raw`Two squares (i, a) and (r, j) share a diagonal iff $\lvert a - j\rvert = \lvert i - r\rvert$.`],
      solution: String.raw`**(a)** Row 1, column 1: row 2 can only use columns 3 or 4. (1,3): row 3 has no legal column. (1,4): row 3 must be column 2, then row 4 has none. So Q[1] = 1 fails. Q[1] = 2: row 2 must be 4; row 3 must be 1; row 4 must be 3: **(2, 4, 1, 3)** ✓. Q[1] = 3: by mirror symmetry **(3, 1, 4, 2)** ✓. Q[1] = 4 mirrors Q[1] = 1 and fails. Exactly two solutions.

**(b)** The queen in row i is at column Q[i]; the new queen is at row r, column j, with $i < r$. They share a diagonal iff $\lvert Q[i] - j\rvert = r - i$, i.e. $Q[i] = j + (r - i)$ (anti-diagonal) or $Q[i] = j - (r - i)$ (main diagonal). Same column is $Q[i] = j$; same row is impossible by construction.

**(c)** Every call PlaceQueens(Q, r+1) is made with a legal placement of queens in rows 1..r, which in particular uses r distinct columns. The number of injective assignments of columns to r rows is $n(n-1)\cdots(n-r+1) = n!/(n-r)!$. Summing, the number of calls is at most $\sum_{r=0}^{n} n!/(n-r)! = n!\sum_{k=0}^{n} 1/k! < e\cdot n!$.`,
    },
    {
      id: 'backtracking-subset-variants', type: 'written', title: 'Subset sum: search and counting', difficulty: 2,
      prompt: String.raw`Let $X[1..n]$ be positive integers and T a target.
(a) Give a backtracking algorithm that returns an actual subset summing to T (or NONE).
(b) Give a backtracking algorithm that **counts** the subsets of X summing to T (subsets are sets of indices, so equal values at different positions are different elements).
(c) Give a backtracking algorithm that decides whether some subset of **exactly k** elements sums to T. State the recursion in English first.
Analyze each.`,
      rubric: ['Search version returns the subset by extending the successful branch', 'Counting version: base case t = 0 at i > n returns 1 (not at first t = 0!), sum of the two branches', 'Exactly-k version has parameters (i, k, t) with correct base cases', 'O(2^n) analysis for each'],
      hints: [String.raw`For counting, be careful: if t = 0 but elements remain, you may still add nothing more — but you must not count the same subset twice. Simplest: only declare success when i > n.`, 'For (c), add the number of elements still to choose as a parameter.'],
      solution: String.raw`**(a)** FindSubset(i, t) returns a subset of X[i..n] with sum t, or NONE:

~~~pseudo
FindSubset(i, t):
    if t = 0: return {}
    if t < 0 or i > n: return NONE
    S = FindSubset(i+1, t);           if S != NONE: return S
    S = FindSubset(i+1, t - X[i]);    if S != NONE: return S + {i}
    return NONE
~~~

**(b)** Count(i, t) = number of subsets of X[i..n] with sum t:

~~~pseudo
Count(i, t):
    if t < 0: return 0
    if i > n: return (1 if t = 0 else 0)
    return Count(i+1, t) + Count(i+1, t - X[i])
~~~

Each subset of X[i..n] corresponds to exactly one root-to-leaf path (include/exclude for each index), so nothing is double-counted. (Returning 1 as soon as $t = 0$ is also correct here *because X is positive*: once t = 0, the only completion is to exclude all remaining elements. But the version above is safer and also works with zeros in X.)

**(c)** SubK(i, k, t) = True iff some subset of X[i..n] with exactly k elements sums to t:

~~~pseudo
SubK(i, k, t):
    if k = 0: return (t = 0)
    if i > n or t < 0: return False
    return SubK(i+1, k, t) or SubK(i+1, k-1, t - X[i])
~~~

Answer SubK(1, k, T).

**Analysis.** Each version makes at most two recursive calls with i increased by one and O(1) other work (plus O(n) to build the set in (a)), so $T(n) = 2T(n-1) + O(1) = O(2^n)$. (Memoized versions take $O(nT)$, $O(nT)$ and $O(n k T)$ time.)`,
    },
    {
      id: 'backtracking-splittable-analysis', type: 'written', title: 'Splittable: algorithm and worst case', difficulty: 2,
      prompt: String.raw`(a) Write the backtracking algorithm Splittable(i) for text segmentation and prove it correct.
(b) Give an input on which it makes exponentially many calls to IsWord, and justify an $O(2^n)$ upper bound with a recurrence.
(c) How many distinct subproblems are there, and what does that suggest?`,
      rubric: ['Correct base case Splittable(n+1) = True', 'Correctness: the first word ends at some j; recursion on the rest', 'Exponential example (e.g. A^{n−1}B with all strings of A\'s being words)', 'Recurrence T(n) ≤ Σ T(k) + O(n) solved to O(2^n)', 'n + 1 distinct subproblems; memoize to O(n²)'],
      hints: ['A splittable string is either empty or begins with a word followed by a splittable string.', 'For the bad input, make sure the answer is False so that the algorithm cannot stop early.'],
      solution: String.raw`**(a)**
~~~pseudo
Splittable(i):                // True iff A[i..n] can be split into words
    if i > n: return True
    for j = i to n:
        if IsWord(A[i..j]) and Splittable(j+1): return True
    return False
~~~
*Correctness* (induction on $n - i$): the empty string is a sequence of zero words. A nonempty A[i..n] is splittable iff its first word is some A[i..j] and the rest A[j+1..n] is splittable; the loop tries every j and (by induction) Splittable(j+1) correctly answers the rest.

**(b)** Let $A = \texttt{AA}\cdots\texttt{AB}$ ($n-1$ A's then a B), and let IsWord accept exactly the nonempty strings of A's. The answer is False (no word contains B), so the loop never exits early: Splittable(i) calls Splittable(j+1) for every j with A[i..j] all A's. Every one of the $2^{n-2}$ ways to segment the prefix of A's is explored before reaching the B.

*Upper bound.* Let T(m) be the maximum number of IsWord calls made by Splittable on a suffix of length m. Then $T(0) = 0$ and $T(m) \le \sum_{k=0}^{m-1} T(k) + m$. Let U satisfy this with equality, $U(0) = 0$; by induction $T \le U$. Subtracting consecutive equations, $U(m) - U(m-1) = U(m-1) + 1$, so $U(m) + 1 = 2(U(m-1) + 1)$ and $U(m) = 2^m - 1$. Hence $T(n) \le 2^n - 1 = O(2^n)$.

**(c)** Only n + 1 distinct calls Splittable(1..n+1) exist; the exponential blow-up is recomputation. Store SplitTable[i] and fill it for i = n+1 down to 1: $O(n^2)$ IsWord calls. That's the DP solution.`,
    },
    {
      id: 'backtracking-lis-two-ways', type: 'written', title: 'Two backtracking formulations of LIS', difficulty: 2,
      prompt: String.raw`(a) Define LISbigger(i, j) precisely in English, give its recurrence with base cases, and say how to get the LIS length of A[1..n].
(b) Do the same for LISfirst(i).
(c) Modify one formulation to compute the longest **non-decreasing** subsequence (equal neighbors allowed).
(d) How many distinct subproblems does each formulation have?`,
      rubric: ['English definitions in terms of the parameters', 'Correct recurrences including the "skip" option and empty max', 'Correct final answers (sentinel or max over i)', 'Correct change for non-decreasing (≥ instead of >)', 'O(n²) and O(n) subproblems'],
      hints: ['LISbigger needs to remember the last chosen element — as an index.', 'LISfirst chooses the next element of the subsequence directly.'],
      solution: String.raw`**(a)** LISbigger(i, j) = length of the longest increasing subsequence of A[j..n] in which every element is larger than A[i]. With sentinel $A[0] = -\infty$:
$$\text{LISbigger}(i, j) = \begin{cases} 0 & j > n \\ \text{LISbigger}(i, j+1) & A[j] \le A[i] \\ \max\{\text{LISbigger}(i,j+1),\ 1 + \text{LISbigger}(j, j+1)\} & A[j] > A[i]\end{cases}$$
LIS length = LISbigger(0, 1).

**(b)** LISfirst(i) = length of the longest increasing subsequence of A[i..n] whose first element is A[i]:
$$\text{LISfirst}(i) = 1 + \max\big(\{0\} \cup \{\text{LISfirst}(j) : i < j \le n,\ A[j] > A[i]\}\big).$$
LIS length = $\max_{1\le i\le n}\text{LISfirst}(i)$ (or LISfirst(0) − 1 with $A[0] = -\infty$; and 0 if n = 0).

**(c)** Replace the strict comparison by a weak one. In LISfirst: allow $A[j] \ge A[i]$. In LISbigger: take A[j] when $A[j] \ge A[i]$ (skip-only case when $A[j] < A[i]$).

**(d)** LISbigger: $0 \le i < j \le n+1$, so $O(n^2)$ subproblems, O(1) work each. LISfirst: n + 1 subproblems, O(n) work each. Both memoize to $O(n^2)$ time.`,
    },
    {
      id: 'backtracking-zigzag', type: 'written', title: 'Longest zigzag subsequence', difficulty: 3,
      prompt: String.raw`A sequence $b_1, b_2, \dots, b_k$ is a **zigzag** if $b_1 < b_2 > b_3 < b_4 > \cdots$ (the comparisons alternate, starting with $<$). Every sequence of length 0 or 1 is a zigzag. Describe a backtracking algorithm that computes the length of the longest zigzag subsequence of A[1..n], with a precise English description of your recursive function. Then explain how to turn it into an $O(n^2)$ algorithm.`,
      rubric: ['Recursive function has the last index and the direction of the next comparison as parameters', 'English specification of the function', 'Correct recurrence and base cases', 'Correct final answer (max over start index, starting with "up")', 'Memoization: O(n) subproblems × O(n) work = O(n²)'],
      hints: ['After choosing an element, the next element must be bigger or smaller depending on the position — that is the information to remember.', String.raw`Define Zig(i, up): the longest zigzag subsequence of A[i..n] that starts with A[i], where the next comparison must be "up" if up = True.`],
      solution: String.raw`**Recursive function.** For $1 \le i \le n$ and $d \in \{\text{UP}, \text{DOWN}\}$, let **Zig(i, d)** = the length of the longest subsequence of A[i..n] that starts with A[i], in which the comparison between the first two elements is d (UP means the second is larger, DOWN smaller), and the comparisons then alternate.

**Recurrence.** Choose the next element A[j] (the "jump" formulation):
$$\text{Zig}(i, \text{UP}) = 1 + \max\big(\{0\}\cup\{\text{Zig}(j, \text{DOWN}) : j > i,\ A[j] > A[i]\}\big)$$
$$\text{Zig}(i, \text{DOWN}) = 1 + \max\big(\{0\}\cup\{\text{Zig}(j, \text{UP}) : j > i,\ A[j] < A[i]\}\big)$$
The "0" option means A[i] is the last element. Base case is built in: Zig(n, d) = 1.

**Answer.** The zigzag must start with an up-step, so the answer is $\max_{1\le i\le n}\text{Zig}(i, \text{UP})$ (or 0 if n = 0).

**Correctness.** Any zigzag subsequence starting at A[i] whose next step is UP is either just A[i] or consists of A[i] followed by a zigzag starting at some later A[j] > A[i] whose next step is DOWN — and any such combination is valid. So the recurrence takes the max over exactly the right set.

**Running time.** As plain recursion this is exponential (on an alternating input, the recursion tree branches at almost every element). But there are only 2n distinct subproblems. Memoize in a table Zig[1..n][UP, DOWN] filled for i = n down to 1 (each entry depends only on larger j); each entry takes O(n) time: $O(n^2)$ time and O(n) space.`,
    },
    {
      id: 'backtracking-palindrome-split', type: 'written', title: 'Fewest palindromes', difficulty: 2,
      prompt: String.raw`Given a string A[1..n], we want to split it into the **fewest** pieces such that every piece is a palindrome (e.g. BUBBASEESABANANA = BUB·BASEESAB·ANANA, 3 pieces). Every single character is a palindrome, so a solution always exists. Give a backtracking algorithm with an English specification, and analyze the running time of the memoized version (assume checking whether A[i..j] is a palindrome takes O(j − i + 1) time).`,
      rubric: ['English spec MinPal(i) = fewest palindromes for suffix A[i..n]', 'Recurrence: min over j of 1 + MinPal(j+1) where A[i..j] is a palindrome; MinPal(n+1) = 0', 'Memoized running time O(n³) (or O(n²) with a palindrome table)'],
      hints: ['Mimic Splittable: decide where the first piece ends.', 'Replace OR by min and True/False by counts.'],
      solution: String.raw`**Recursive function.** MinPal(i) = the minimum number of palindromes into which the suffix A[i..n] can be split.

$$\text{MinPal}(i) = \begin{cases} 0 & \text{if } i > n \\ \min\{1 + \text{MinPal}(j+1) : i \le j \le n,\ A[i..j] \text{ is a palindrome}\} & \text{otherwise}\end{cases}$$

The set is never empty since $A[i..i]$ is a palindrome. Answer: MinPal(1).

**Correctness.** The first piece of any split of A[i..n] is some palindrome A[i..j]; the rest is a split of A[j+1..n], which by induction needs at least MinPal(j+1) pieces, and that many suffice.

**Analysis.** Plain backtracking is exponential (e.g. on AAAA...A every segmentation is explored). Memoized: n + 1 subproblems MinPal[1..n+1], filled from i = n+1 down to 1; entry i tries n − i + 1 values of j with an O(j − i + 1) palindrome check, so $O(n^2)$ per entry and $O(n^3)$ total. Precomputing a table IsPal[i][j] (IsPal[i][j] = A[i] = A[j] and IsPal[i+1][j−1]) in $O(n^2)$ reduces the total to $O(n^2)$.`,
    },
    {
      id: 'backtracking-lcs', type: 'written', title: 'Longest common subsequence by backtracking', difficulty: 2,
      prompt: String.raw`Given strings A[1..m] and B[1..n], describe a backtracking algorithm for the length of their longest common subsequence. Specify your function in English, give the recurrence, justify the case where $A[i] = B[j]$, and state the number of distinct subproblems.`,
      rubric: ['LCS(i, j) defined on suffixes A[i..m], B[j..n]', 'Correct base case (empty suffix gives 0)', 'Mismatch case: max of skipping A[i] or B[j]', 'Match case justified (exchange argument) or max over all three options', 'O(mn) distinct subproblems'],
      hints: ['Look at the first characters A[i] and B[j]. Either one of them is not used, or they are matched to each other.', 'If A[i] = B[j], argue that some LCS matches them to each other.'],
      solution: String.raw`**Function.** LCS(i, j) = length of the longest common subsequence of the suffixes A[i..m] and B[j..n].

$$\text{LCS}(i, j) = \begin{cases} 0 & i > m \text{ or } j > n \\ 1 + \text{LCS}(i+1, j+1) & A[i] = B[j] \\ \max\{\text{LCS}(i+1, j),\ \text{LCS}(i, j+1)\} & \text{otherwise}\end{cases}$$

Answer LCS(1, 1).

**Why the cases are right.** In any common subsequence, either A[i] is unused (then it's a common subsequence of A[i+1..m] and B[j..n]), or B[j] is unused, or both are used — and then they must be matched *to each other* (if A[i] were matched to a later B[j'], B[j] would have to be matched to a later A-character, crossing the first match). If $A[i] \ne B[j]$ they can't be matched together, so one is unused: the max of two options. If $A[i] = B[j]$, matching them is safe: take an optimal common subsequence; if it doesn't use both, replace its first character's match by the pair (A[i], B[j]) (or add the pair if neither is used) without decreasing the length. So $1 + \text{LCS}(i+1,j+1)$ is optimal. (Writing the max of all three options is also correct.)

**Subproblems.** $(m+1)(n+1)$ pairs (i, j). Plain recursion is exponential in the worst case (all mismatches give a binary tree of depth up to m + n), but memoizing gives $O(mn)$ time.`,
    },
    {
      id: 'backtracking-two-strings-split', type: 'written', title: 'Simultaneous segmentation', difficulty: 3,
      prompt: String.raw`Given two strings A[1..n] and B[1..n] of the same length and a subroutine IsWord, decide whether there is a single set of break positions that splits **both** strings into words. For example, A = BOTHEARTH and B = SNOWFLAKE can both be broken after position 4: BOTH·EARTH and SNOW·FLAKE. (A can also be split as BOT·HEARTH, but that break position does not work for B.) Give a backtracking algorithm with an English specification, and the running time of its memoized version in terms of the number of IsWord calls.`,
      rubric: ['Function parameter is a single index i (the common start of both suffixes)', 'Recurrence checks IsWord on both A[i..j] and B[i..j]', 'Correct base case', 'Memoized: O(n) subproblems, O(n²) IsWord calls'],
      hints: ['Both strings are broken at the same places, so the remaining suffixes always start at the same index.', 'This is Splittable with a stronger test for each candidate first word.'],
      solution: String.raw`**Function.** Split2(i) = True iff the suffixes A[i..n] and B[i..n] can both be split into words using the **same** break positions.

$$\text{Split2}(i) = \begin{cases}\text{True} & i > n \\ \bigvee_{j=i}^{n}\big(\text{IsWord}(A[i..j]) \wedge \text{IsWord}(B[i..j]) \wedge \text{Split2}(j+1)\big) & \text{otherwise}\end{cases}$$

Answer Split2(1).

**Correctness.** A common segmentation of the two suffixes starting at i has a first break after some position j; the pieces A[i..j] and B[i..j] must both be words and the rest must be a common segmentation of the suffixes starting at j + 1. The recursion tries every j.

**Analysis.** Plain recursion: $O(2^n)$ as for Splittable. There are only n + 1 distinct subproblems; memoize in an array Split2[1..n+1] filled from n + 1 down to 1. Each entry makes at most 2(n − i + 1) IsWord calls, for $O(n^2)$ IsWord calls and $O(n^2)$ additional time in total.

**Warning.** Running Splittable on A and B separately is wrong: each might be splittable with *different* break positions.`,
    },
    {
      id: 'backtracking-partition', type: 'written', title: 'Partition via subset sum', difficulty: 1,
      prompt: String.raw`The **Partition** problem asks whether a list X[1..n] of positive integers can be split into two sublists with equal sums. (a) Reduce Partition to Subset Sum. (b) Show by example that the greedy strategy "sort decreasing, put each element in the currently lighter part" can fail. (c) What is the running time of your algorithm if Subset Sum is solved by backtracking?`,
      rubric: ['Odd total ⇒ No; else SubsetSum(X, S/2)', 'Both directions of correctness', 'Valid counterexample for greedy', 'O(n + 2^n) = O(2^n) running time'],
      hints: ['If one side has sum S/2, what is the sum of the other side?', 'Try X = [3, 3, 2, 2, 2].'],
      solution: String.raw`**(a)** Let $S = \sum X[i]$. If S is odd, answer No. Otherwise return SubsetSum(X, S/2).

*Correctness.* If a partition into two equal sums exists, either part is a subset with sum S/2. Conversely, if a subset Y has sum S/2, then Y and its complement both sum to S/2.

**(b)** X = [3, 3, 2, 2, 2] (sum 12). Greedy: 3 → part 1; 3 → part 2; 2 → part 1 (5, 3); 2 → part 2 (5, 5); 2 → part 1: (7, 5) — fails. But {3, 3} and {2, 2, 2} both sum to 6.

**(c)** Computing S takes O(n); backtracking SubsetSum takes $O(2^n)$; total $O(2^n)$. (With memoization, $O(nS)$, which is pseudo-polynomial.)`,
    },
    {
      id: 'backtracking-nqueens-code', type: 'code', title: 'Count n-queens solutions', difficulty: 2,
      prompt: String.raw`Write <code>countQueens(n)</code> that returns the number of ways to place n non-attacking queens on an $n\times n$ board, for $1 \le n \le 9$, using backtracking (row by row). Expected values: 1, 0, 0, 2, 10, 4, 40, 92, 352 for n = 1..9.`,
      fn: 'countQueens',
      starter: 'function countQueens(n) {\n  // backtracking: place one queen per row\n}\n',
      reference: function (n) {
        let count = 0;
        const cols = new Array(n).fill(false), d1 = new Array(2 * n).fill(false), d2 = new Array(2 * n).fill(false);
        function place(r) {
          if (r === n) { count++; return; }
          for (let j = 0; j < n; j++) {
            if (cols[j] || d1[r + j] || d2[r - j + n]) continue;
            cols[j] = d1[r + j] = d2[r - j + n] = true;
            place(r + 1);
            cols[j] = d1[r + j] = d2[r - j + n] = false;
          }
        }
        place(0);
        return count;
      },
      tests: [[1], [2], [3], [4], [5], [6], [8]],
      gen: () => [1 + Math.floor(Math.random() * 8)],
      hints: ['Keep boolean arrays for used columns and both diagonal directions (r + j and r − j are constant along diagonals).', 'Undo the marks after the recursive call returns — that is the "backtrack".'],
      solution: String.raw`~~~js
function countQueens(n) {
  let count = 0;
  const cols = new Array(n).fill(false);
  const d1 = new Array(2 * n).fill(false);   // r + j constant
  const d2 = new Array(2 * n).fill(false);   // r - j constant (shifted by n)
  function place(r) {
    if (r === n) { count++; return; }
    for (let j = 0; j < n; j++) {
      if (cols[j] || d1[r + j] || d2[r - j + n]) continue;
      cols[j] = d1[r + j] = d2[r - j + n] = true;
      place(r + 1);
      cols[j] = d1[r + j] = d2[r - j + n] = false;   // backtrack
    }
  }
  place(0);
  return count;
}
~~~
The boolean arrays make each legality check O(1) instead of O(r).`,
    },
    {
      id: 'backtracking-subsetsum-code', type: 'code', title: 'Subset sum by backtracking', difficulty: 1,
      prompt: String.raw`Write <code>subsetSum(X, T)</code> that returns <code>true</code> if some subset of the array X of positive integers sums to exactly T (with $T \ge 0$; the empty subset sums to 0), and <code>false</code> otherwise. Inputs are small (n ≤ 12), so plain backtracking is fine.`,
      fn: 'subsetSum',
      starter: 'function subsetSum(X, T) {\n  // return true iff some subset of X sums to T\n}\n',
      reference: function (X, T) {
        function ss(i, t) {
          if (t === 0) return true;
          if (t < 0 || i >= X.length) return false;
          return ss(i + 1, t) || ss(i + 1, t - X[i]);
        }
        return ss(0, T);
      },
      tests: [[[8, 6, 7, 5, 3, 10, 9], 15], [[11, 6, 5, 1, 7, 13, 12], 15], [[], 0], [[], 3], [[2, 4, 6], 5], [[1, 2, 3], 6], [[5], 5]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 11) }, () => 1 + Math.floor(Math.random() * 15)), Math.floor(Math.random() * 40)],
      hints: ['Recurse on an index i and remaining target t.', 'Base cases: t = 0 is a success; t < 0 or no elements left is a failure.'],
      solution: String.raw`~~~js
function subsetSum(X, T) {
  function ss(i, t) {                 // subset of X[i..] summing to t?
    if (t === 0) return true;
    if (t < 0 || i >= X.length) return false;
    return ss(i + 1, t) || ss(i + 1, t - X[i]);
  }
  return ss(0, T);
}
~~~
$O(2^n)$ time in the worst case. Because X is positive, $t < 0$ is a valid prune.`,
    },
    {
      id: 'backtracking-segment-count-code', type: 'code', title: 'Count segmentations', difficulty: 2,
      prompt: String.raw`Write <code>countSplits(s, words)</code> returning the number of ways to split the string s into a sequence of words from the array <code>words</code> (a word may be used many times). The empty string has exactly one segmentation (zero words). For example, s = "catsanddog" with words ["cat", "cats", "and", "sand", "dog"] has 2 segmentations. Start from the backtracking recursion on the start index, and memoize it so it runs in polynomial time.`,
      fn: 'countSplits',
      starter: 'function countSplits(s, words) {\n  // number of ways to split s into dictionary words\n}\n',
      reference: function (s, words) {
        const dict = Object.create(null);
        for (const w of words) dict[w] = true;
        const n = s.length;
        const ways = new Array(n + 1).fill(0);
        ways[n] = 1;
        for (let i = n - 1; i >= 0; i--) {
          let c = 0;
          for (let j = i + 1; j <= n; j++) if (dict[s.slice(i, j)] && s.slice(i, j).length > 0) c += ways[j];
          ways[i] = c;
        }
        return ways[0];
      },
      tests: [['catsanddog', ['cat', 'cats', 'and', 'sand', 'dog']], ['', ['a']], ['aaaa', ['a', 'aa']], ['aaab', ['a', 'aa', 'aaa']], ['pineapplepenapple', ['apple', 'pen', 'applepen', 'pine', 'pineapple']], ['abc', []]],
      gen: () => {
        const L = Math.floor(Math.random() * 11);
        let s = '';
        for (let i = 0; i < L; i++) s += Math.random() < 0.5 ? 'a' : 'b';
        const pool = ['a', 'b', 'aa', 'ab', 'ba', 'bb', 'aab', 'aba', 'abb', 'baa', 'bab', 'bba', 'aaa', 'bbb'];
        const words = pool.filter(() => Math.random() < 0.4);
        return [s, words];
      },
      hints: ['Ways(i) = number of segmentations of the suffix s[i..]. Ways(n) = 1.', 'Ways(i) = sum over j > i with s[i..j) a word of Ways(j). Fill i from n down to 0.'],
      solution: String.raw`~~~js
function countSplits(s, words) {
  const dict = new Set(words);
  const n = s.length;
  const ways = new Array(n + 1).fill(0);
  ways[n] = 1;                                   // empty suffix
  for (let i = n - 1; i >= 0; i--)
    for (let j = i + 1; j <= n; j++)
      if (dict.has(s.slice(i, j))) ways[i] += ways[j];
  return ways[0];
}
~~~
This is Splittable with OR replaced by + and True by 1. Memoizing over the n + 1 start positions gives $O(n^2)$ dictionary lookups (each on a substring of length up to n).`,
    },
    {
      id: 'backtracking-lps', type: 'written', title: 'Longest palindromic subsequence', difficulty: 2,
      prompt: String.raw`A **palindrome** reads the same forwards and backwards. Given a string A[1..n], describe a backtracking algorithm that computes the length of the longest subsequence of A that is a palindrome. For example, the answer for BBABCBCAB is 7 (BABCBAB).

Give (a) a precise English specification of your recursive function, (b) the recurrence with base cases and the top-level call, (c) a proof that the case $A[i] = A[j]$ is handled correctly, and (d) the running time without and with memoization.`,
      rubric: ['Function on a substring A[i..j] with a clear English specification', 'Base cases i > j (0) and i = j (1); top-level call LPS(1, n)', 'Mismatch case: max of dropping either end', 'Match case 2 + LPS(i+1, j−1) justified by an exchange argument (or by taking the max of all three options)', 'Exponential plain recursion; O(n²) memoized'],
      hints: ['Look at both ends of the current substring. Can they both be in the palindrome? If so, what role must they play?', String.raw`If $A[i] \ne A[j]$, at least one end is unused.`, 'For the match case, start from an optimal palindrome and modify it so it uses both ends.'],
      solution: String.raw`**(a)** For $1 \le i \le j + 1 \le n + 1$, **LPS(i, j)** = the length of the longest palindromic subsequence of the substring A[i..j].

**(b)**
$$\text{LPS}(i, j) = \begin{cases} 0 & i > j \\ 1 & i = j \\ 2 + \text{LPS}(i+1, j-1) & i < j,\ A[i] = A[j] \\ \max\{\text{LPS}(i+1, j),\ \text{LPS}(i, j-1)\} & i < j,\ A[i] \ne A[j]\end{cases}$$
The answer is LPS(1, n).

*Mismatch case.* A palindromic subsequence that uses both A[i] and A[j] has them as its first and last characters, which must be equal. So if $A[i] \ne A[j]$, it misses A[i] (it lives in A[i+1..j]) or misses A[j] (it lives in A[i..j−1]); both options are legal, so the max is right.

**(c)** Suppose $A[i] = A[j]$, $i < j$. The value $2 + \text{LPS}(i+1, j-1)$ is achievable: wrap A[i] and A[j] around an optimal palindrome of A[i+1..j−1]. Conversely, let P be any palindromic subsequence of A[i..j]; we show $\lvert P\rvert \le 2 + \text{LPS}(i+1, j-1)$.
- If P uses neither A[i] nor A[j], it lies inside A[i+1..j−1], so $\lvert P\rvert \le \text{LPS}(i+1, j-1)$.
- If P uses A[i] but not A[j]: A[i] is P's first character, paired with P's last character at some $j' < j$. Since $A[j'] = A[i] = A[j]$, replacing position $j'$ by position j gives a palindromic subsequence of the same length using both ends; its middle part lies in A[i+1..j−1]. So $\lvert P\rvert \le 2 + \text{LPS}(i+1, j-1)$. The case "A[j] but not A[i]" is symmetric.
- If P uses both, they are its outer pair and its middle lies in A[i+1..j−1]: $\lvert P\rvert \le 2 + \text{LPS}(i+1, j-1)$.

**(d)** Without memoization the mismatch case makes two calls on substrings one shorter: $T(\ell) = 2T(\ell - 1) + O(1)$, so $O(2^n)$ (for a string with all distinct characters, the tree really is that big). With memoization there are $O(n^2)$ pairs (i, j), each computed in O(1) from pairs with a shorter substring; filling a table LPS[1..n+1][0..n] by increasing $j - i$ takes $O(n^2)$ time and space.`,
    },
    {
      id: 'backtracking-mis-branch', type: 'written', title: 'Independent set by branching', difficulty: 3,
      prompt: String.raw`An **independent set** in a graph G = (V, E) is a set of vertices no two of which are adjacent.

(a) Describe a backtracking algorithm MaxIS(G) that returns the size of the largest independent set, branching on whether a chosen vertex v is in the set. Prove it correct.
(b) Show that if v always has at least one neighbor when you branch (handle isolated vertices separately), the running time satisfies $T(n) \le T(n-1) + T(n-2) + \text{poly}(n)$, and conclude $T(n) = O(1.62^n)$.
(c) Suppose instead you always branch on a vertex of degree at least 3, if one exists. What recurrence do you get? (You may assume graphs of maximum degree at most 2 can be handled in polynomial time.)
(d) Why does this algorithm not become a polynomial-time dynamic program when memoized?`,
      rubric: ['Algorithm: isolated vertex taken; otherwise max of G − v and 1 + G − N[v]', 'Correctness proof covering both directions', 'Recurrence T(n−1) + T(n−2) + poly, solved via the Fibonacci growth rate φ ≈ 1.618', 'Degree-3 branching gives T(n−1) + T(n−4) + poly ≈ 1.38^n', 'Subproblems are induced subgraphs — exponentially many'],
      hints: ['In the branch where v is taken, which other vertices can no longer be in the set?', String.raw`For (b), the number of nodes in the recursion tree grows like the Fibonacci numbers.`, String.raw`For (c), when v is taken you delete v and at least 3 neighbors.`],
      solution: String.raw`**(a)**
~~~pseudo
MaxIS(G):
    if G has no vertices: return 0
    pick a vertex v
    if v has no neighbors: return 1 + MaxIS(G - v)
    return max( MaxIS(G - v), 1 + MaxIS(G - N[v]) )     // N[v] = v and its neighbors
~~~
*Correctness* (induction on the number of vertices). Base case: the empty graph has only the empty independent set. Otherwise let S be a maximum independent set of G.
- If v is isolated: $S \cup \{v\}$ is still independent, so some maximum independent set contains v, and the rest of it is an independent set of G − v; conversely adding v to an independent set of G − v keeps it independent. So the answer is 1 + MaxIS(G − v).
- If $v \notin S$, S is an independent set of G − v, so $\lvert S\rvert \le$ MaxIS(G − v). If $v \in S$, no neighbor of v is in S, so $S \setminus \{v\}$ is an independent set of G − N[v] and $\lvert S\rvert \le 1 + $ MaxIS(G − N[v]).
- Conversely both values are achievable: an independent set of G − v is independent in G, and adding v to an independent set of G − N[v] is independent in G (no neighbor of v remains).
By the inductive hypothesis the recursive calls are correct, so the max is exactly $\lvert S\rvert$.

**(b)** Each call does polynomial work p(n) (finding v, building subgraphs). When v has a neighbor, G − v has $n - 1$ vertices and G − N[v] has at most $n - 2$. Isolated vertices produce a single call of size $n - 1$. Let N(n) be the maximum number of nodes in the recursion tree for an n-vertex graph and $M(n) = N(n) + 1$. Branching gives $M(n) \le M(n-1) + M(n-2)$; a single call gives $M(n) \le M(n-1) + 1 \le M(n-1) + M(n-2)$ since $M \ge 1$. So M grows at most like the Fibonacci numbers: $M(n) = O(\phi^n)$ with $\phi = (1 + \sqrt5)/2 \approx 1.618$. Total time $O(\phi^n \cdot p(n)) = O(1.62^n)$, since the polynomial is absorbed by the gap between 1.618 and 1.62.

**(c)** Taking v deletes v and at least 3 neighbors: $T(n) \le T(n-1) + T(n-4) + \text{poly}(n)$. The growth rate is the largest root of $x^4 = x^3 + 1$, about 1.3803, so $T(n) = O(1.39^n)$. When no vertex of degree ≥ 3 exists, the graph is a disjoint union of paths and cycles; a path on k vertices has a maximum independent set of size $\lceil k/2\rceil$ and a cycle on k vertices $\lfloor k/2\rfloor$.

**(d)** The subproblems are *induced subgraphs* G[U] for subsets $U \subseteq V$ — up to $2^n$ of them — so a memo table indexed by subproblems would be exponentially large. This is expected: maximum independent set is NP-hard. (On special graph classes, such as trees, a different recursion with polynomially many subproblems does exist.)`,
    },
    {
      id: 'backtracking-coloring', type: 'written', title: 'Graph coloring by backtracking', difficulty: 2,
      prompt: String.raw`A **proper k-coloring** of a graph with vertices 1, ..., n assigns each vertex one of the colors 1, ..., k so that adjacent vertices get different colors.

(a) Give a backtracking algorithm that decides whether a proper k-coloring exists, coloring vertices in the order 1, 2, ..., n. State precisely what each recursive call assumes and what it returns.
(b) Prove it correct.
(c) Bound its running time.
(d) Explain a simple symmetry-breaking trick that reduces the work by a factor of k, and why it is valid.`,
      rubric: ['Recursive call Color(i) with the invariant that c[1..i−1] is a proper partial coloring', 'Tries every color not used by an earlier neighbor; base case i > n', 'Correctness: both directions, using that the partial coloring is extended', 'O(k^n · (n + m)) or similar bound', 'Symmetry: colors can be permuted, so fix c[1] = 1'],
      hints: ['The decision for vertex i is its color. Which colors are legal given the colors of vertices 1..i−1?', 'For correctness, prove: Color(i) returns True iff the current partial coloring c[1..i−1] can be extended to a proper coloring of all vertices.'],
      solution: String.raw`**(a)** A global array c[1..n] holds the colors chosen so far.
~~~pseudo
Color(i):    // assumes c[1..i-1] is a proper coloring of vertices 1..i-1
             // returns True iff it can be extended to a proper k-coloring of all n vertices
    if i > n: return True
    for x = 1 to k:
        if no neighbor u < i of vertex i has c[u] = x:
            c[i] = x
            if Color(i+1): return True
    return False
~~~
Top-level call: Color(1).

**(b)** Claim: under the stated assumption, Color(i) returns True iff the partial coloring c[1..i−1] extends to a proper coloring. Induction on n − i.
*Base* $i > n$: the coloring is complete and proper. True is correct.
*Step.* ($\Rightarrow$) If Color(i) returns True, then for some color x not used by an earlier neighbor of i, c[1..i] is proper and (by induction) Color(i+1) found an extension of it — which extends c[1..i−1] too. ($\Leftarrow$) If some proper coloring c* extends c[1..i−1], let $x = c^*(i)$. Then no earlier neighbor of i has color x (c* is proper and agrees with c on 1..i−1), so the loop tries x, and c[1..i] is extended by c*; by induction Color(i+1) returns True (unless an earlier x already returned True).

**(c)** Each node of the recursion tree at depth d corresponds to a proper coloring of vertices 1..d, so there are at most $k^d$ nodes at depth d and $O(k^n)$ nodes in total (for $k \ge 2$). Each node checks k colors against the neighbors of i, $O(k \cdot \deg(i))$ time, or $O(n + m)$ with a "colors used by neighbors" marker array. Total $O(k^n (n + m))$.

**(d)** Permuting the color names turns any proper coloring into another proper coloring. So if any proper coloring exists, one exists with c[1] = 1. Trying only color 1 for vertex 1 is therefore valid and divides the size of the search tree by k. (More generally, vertex i only needs to try the colors already used plus *one* new color.)`,
    },
    {
      id: 'backtracking-fair-split', type: 'written', title: 'The fairest split', difficulty: 3,
      prompt: String.raw`An array $A[1..n]$ of positive integers must be split into exactly k **contiguous** nonempty pieces (for example, a row of n parcels of land divided among k heirs who each get a contiguous stretch). We want the split to be as fair as possible to the poorest heir: **maximize the minimum piece sum**.

For A = [7, 2, 5, 10, 8] and k = 2, the best split is [7, 2, 5 | 10, 8], with minimum piece sum 14.

Give a backtracking algorithm: specify the recursive function in English, give the recurrence with base cases and the top-level call, and analyze the running time without and with memoization.`,
      rubric: ['Parameters: start index i and number of pieces p still to form', 'English specification', 'Recurrence max over j of min(Σ(i, j), F(j+1, p−1)) with the correct range of j', 'Base case p = 1 gives Σ(i, n)', 'Plain: C(n−1, k−1) splits explored; memoized O(n²k) with prefix sums'],
      hints: ['Decide where the first piece ends.', 'The value of a split is the minimum of the first piece and the value of the rest.', 'Leave enough elements for the remaining pieces.'],
      solution: String.raw`**Specification.** For $1 \le i \le n$ and $1 \le p \le n - i + 1$, **Fair(i, p)** = the maximum, over all splits of A[i..n] into exactly p contiguous nonempty pieces, of the smallest piece sum.

**Recurrence.** With $\Sigma(i, j) = A[i] + \cdots + A[j]$:
$$\text{Fair}(i, p) = \begin{cases}\Sigma(i, n) & p = 1\\ \displaystyle\max_{i \le j \le n-p+1} \min\{\Sigma(i, j),\ \text{Fair}(j+1, p-1)\} & p \ge 2\end{cases}$$
The first piece is A[i..j]; the remaining $p - 1$ pieces need at least $p - 1$ elements, so $j \le n - p + 1$. The answer is Fair(1, k).

**Correctness.** Every split of A[i..n] into p pieces consists of a first piece A[i..j] (for some j in the range) and a split of A[j+1..n] into $p - 1$ pieces; its value is the min of the first piece's sum and the rest's smallest piece. For a fixed j the best choice of the rest is the one maximizing its own minimum, which is Fair(j+1, p−1) by induction (min is monotone, so improving the rest never hurts). Maximizing over j covers all splits.

**Example.** Fair(1, 2) = max over j = 1..4 of min(7, 25), min(9, 23), min(14, 18), min(24, 8) = max(7, 9, 14, 8) = 14.

**Running time.** Plain recursion enumerates all $\binom{n-1}{k-1}$ splits (one leaf per split), times O(n) work per node — exponential when k is around n/2. Memoized: $O(nk)$ subproblems (i, p); precompute prefix sums so $\Sigma(i, j)$ takes O(1); each subproblem scans O(n) values of j. Total $O(n^2 k)$ time and $O(nk)$ space, filling i from n down to 1.`,
    },
    {
      id: 'backtracking-take-front-game', type: 'written', title: 'Taking 1, 2 or 3 from the front', difficulty: 3,
      prompt: String.raw`Coins with positive values $A[1..n]$ lie in a row. Two players alternate; on each turn a player takes **1, 2 or 3 coins from the front** (left end) of the row (fewer if fewer remain). Each player wants to maximize their own total.

(a) Give a backtracking recursion computing the largest total the first player can guarantee. Specify it in English.
(b) Evaluate it on A = [1, 2, 3, 7].
(c) Analyze the running time without and with memoization.`,
      rubric: ['One parameter: index i of the first remaining coin; spec from the point of view of the player to move', 'Recurrence Best(i) = Σ(i, n) − min over k of Best(i + k)', 'Correct base case Best(n+1) = 0 and limits on k', 'Correct value 6 on the example', 'Plain O(3^n); memoized O(n)'],
      hints: ['The remaining coins are always a suffix A[i..n].', 'Whatever the opponent guarantees from the position you leave, you get the rest.'],
      solution: String.raw`**(a)** **Best(i)** = the largest total the player about to move can guarantee from the coins A[i..n], against an optimal opponent. Let $\Sigma(i) = A[i] + \cdots + A[n]$. If the mover takes k coins, the opponent becomes the mover on A[i+k..n] and guarantees Best(i+k); the mover gets all the rest of $\Sigma(i)$. So
$$\text{Best}(i) = \begin{cases}0 & i > n\\ \Sigma(i) - \min\{\text{Best}(i+k) : 1 \le k \le 3,\ i + k \le n + 1\} & i \le n\end{cases}$$
The answer is Best(1).

**(b)** Best(5) = 0. Best(4) = 7 − Best(5) = 7. Best(3) = 10 − min(Best(4), Best(5)) = 10 − 0 = 10. Best(2) = 12 − min(10, 7, 0) = 12. Best(1) = 13 − min(Best(2), Best(3), Best(4)) = 13 − min(12, 10, 7) = 6. The first player can guarantee only **6** (take all three small coins; the opponent takes the 7). Any other first move hands the opponent a position worth 10 or 12.

**(c)** Plain recursion: $T(n) = T(n-1) + T(n-2) + T(n-3) + O(1)$, which grows like $1.839^n$ (the "tribonacci" constant), so it is exponential (and $O(3^n)$). There are only n + 1 distinct subproblems; memoizing and filling i from n + 1 down to 1, with suffix sums precomputed, takes O(1) per entry: **O(n)** total.`,
    },
    {
      id: 'backtracking-two-pile-nim', type: 'written', title: 'Two-pile Nim', difficulty: 2,
      prompt: String.raw`Two piles hold a and b tokens. On each turn, a player removes any positive number of tokens from **one** pile. A player who cannot move (both piles empty) loses.

(a) Write the backtracking recursion Win(a, b) (True iff the player to move can force a win).
(b) Prove by induction that (a, b) is a losing position iff a = b.
(c) Describe the winning strategy, and say how long the plain recursion and the memoized recursion take compared to your closed-form answer.`,
      rubric: ['Recurrence: Win(a,b) = OR over a′ < a of ¬Win(a′, b) OR over b′ < b of ¬Win(a, b′); Win(0,0) = False', 'Induction proof of both directions (equal ⇒ losing, unequal ⇒ winning)', 'Strategy: equalize the piles', 'Running-time comparison (exponential / O(ab(a+b)) / O(1))'],
      hints: ['From (a, a), what do all moves look like?', 'From (a, b) with a > b, which move restores equality?'],
      solution: String.raw`**(a)**
$$\text{Win}(a, b) = \bigvee_{0 \le a' < a} \neg\text{Win}(a', b)\ \ \vee \bigvee_{0 \le b' < b} \neg\text{Win}(a, b').$$
With no moves (a = b = 0) both ORs are empty and Win(0, 0) = False.

**(b)** Induction on a + b. Base: (0, 0) is losing and 0 = 0.
- *If a = b,* every move changes exactly one pile, producing (a', a) or (a, b') with unequal piles. By induction those are winning for the opponent. So (a, a) is losing.
- *If a ≠ b,* say a > b. Moving to (b, b) is legal (remove a − b > 0 tokens from the first pile), and (b, b) is losing by induction. So (a, b) is winning.

**(c)** Strategy: whenever the piles are unequal, remove tokens from the larger pile to make them equal; the opponent must then unbalance them again, and eventually faces (0, 0). The plain recursion explores an exponentially large game tree (the number of move sequences grows exponentially in a + b). Memoized, there are $(a+1)(b+1)$ positions, each scanning $a + b$ moves: $O(ab(a + b))$ time — pseudo-polynomial in the input, since a and b are written in binary. The closed form "losing iff a = b" answers in O(1) comparisons (O(log a) bit operations).`,
    },
    {
      id: 'backtracking-edit-distance', type: 'written', title: 'Edit distance by backtracking', difficulty: 2,
      prompt: String.raw`The **edit distance** between strings A[1..m] and B[1..n] is the minimum number of single-character insertions, deletions and substitutions that transform A into B.

(a) Give a backtracking recursion for the edit distance, deciding what happens to the **last** characters. Give an English specification, the recurrence, base cases, and top-level call, and justify that the cases are exhaustive.
(b) Compute the edit distance between FOOD and MONEY.
(c) Write the recurrence for the running time of the plain recursion, and give the memoized running time.`,
      rubric: ['Edit(i, j) defined on prefixes A[1..i], B[1..j]', 'Base cases Edit(i, 0) = i, Edit(0, j) = j', 'Three options: delete, insert, substitute/match with cost [A[i] ≠ B[j]]', 'Justification via the last column of an alignment', 'Correct answer 4 for FOOD → MONEY', 'Exponential plain recursion; O(mn) memoized'],
      hints: ['Think of an optimal sequence of edits as an alignment (two rows, gaps allowed). What can the last column contain?', 'The last column has A[i] over a gap, a gap over B[j], or A[i] over B[j].'],
      solution: String.raw`**(a)** **Edit(i, j)** = the edit distance between the prefixes A[1..i] and B[1..j].

Write any edit sequence as an **alignment**: A's characters on top, B's on the bottom, gaps allowed, each column costing 1 unless it holds two equal characters. The last column of an optimal alignment of A[1..i] and B[1..j] is one of:
- A[i] over a gap (delete A[i]): cost $1 + \text{Edit}(i-1, j)$;
- a gap over B[j] (insert B[j]): cost $1 + \text{Edit}(i, j-1)$;
- A[i] over B[j]: cost $[A[i] \ne B[j]] + \text{Edit}(i-1, j-1)$.

Removing the last column leaves an alignment of the corresponding prefixes, which by induction costs at least the recursive value, and an optimal alignment of those prefixes can be extended by that column. Hence
$$\text{Edit}(i, j) = \min\{\text{Edit}(i-1, j) + 1,\ \text{Edit}(i, j-1) + 1,\ \text{Edit}(i-1, j-1) + [A[i] \ne B[j]]\}$$
for $i, j \ge 1$, with Edit(i, 0) = i (delete everything) and Edit(0, j) = j (insert everything). The answer is Edit(m, n).

**(b)** FOOD → MONEY has distance **4**. One optimal alignment: F/M (substitute), O/O, O/N (substitute), insert E, D/Y (substitute) — 4 operations. Filling the table confirms that 3 is impossible.

**(c)** Plain recursion: $T(i, j) = T(i-1, j) + T(i, j-1) + T(i-1, j-1) + O(1)$, which is at least $3^{\min(m, n)}$ — exponential. Memoized: $(m+1)(n+1)$ subproblems, O(1) each, filled row by row (each entry needs the entries to its left, above, and diagonally above-left): $O(mn)$ time.`,
    },
    {
      id: 'backtracking-two-knapsacks', type: 'written', title: 'Two knapsacks', difficulty: 3,
      prompt: String.raw`There are n items; item i has a positive integer weight w[i] and value v[i]. You have **two** knapsacks with integer capacities $C_1$ and $C_2$. Each item can be put in knapsack 1, knapsack 2, or left out. Maximize the total value of the packed items, subject to each knapsack's capacity.

(a) Show that "pack knapsack 1 optimally, then pack knapsack 2 optimally from the remaining items" can fail.
(b) Give a backtracking algorithm with an English specification, base cases and top-level call.
(c) Analyze the plain and the memoized running times. Is the memoized algorithm polynomial?`,
      rubric: ['Valid counterexample to the sequential greedy', 'Parameters (i, remaining c1, remaining c2) with an English spec', 'Three options per item with capacity checks; base case i > n gives 0', 'Plain O(3^n); memoized O(n C1 C2), pseudo-polynomial'],
      hints: ['Make knapsack 1 grab small items that knapsack 2 could have used, while a big item only fits in knapsack 1.', 'The decision for item i: which knapsack (if any) receives it.'],
      solution: String.raw`**(a)** Items (weight, value): a = (1, 5), b = (3, 5), c = (2, 1); $C_1 = 3$, $C_2 = 2$. Packing knapsack 1 optimally takes {a, c} (weight 3, value 6) rather than {b} (value 5). Then b does not fit in knapsack 2: total 6. But {b} in knapsack 1 and {a} in knapsack 2 gives 10.

**(b)** **Pack(i, c₁, c₂)** = the maximum total value obtainable from items i..n when knapsack 1 has remaining capacity c₁ and knapsack 2 has remaining capacity c₂.
$$\text{Pack}(i, c_1, c_2) = \begin{cases} 0 & i > n\\ \max\begin{cases}\text{Pack}(i+1, c_1, c_2) \\ v[i] + \text{Pack}(i+1, c_1 - w[i], c_2) & \text{if } w[i] \le c_1\\ v[i] + \text{Pack}(i+1, c_1, c_2 - w[i]) & \text{if } w[i] \le c_2\end{cases} & i \le n\end{cases}$$
The answer is Pack(1, C₁, C₂). Correctness: in any feasible packing of items i..n, item i is left out or goes into one knapsack (where it must fit); the rest is a feasible packing of items i+1..n with the reduced capacities, and by induction the recursive call finds the best one.

**(c)** Plain recursion: up to three calls on $n - 1$ items, $T(n) = 3T(n-1) + O(1) = O(3^n)$. Memoized: the parameters satisfy $1 \le i \le n+1$, $0 \le c_1 \le C_1$, $0 \le c_2 \le C_2$, so there are $O(n C_1 C_2)$ subproblems, O(1) each: $O(n C_1 C_2)$ time. This is **pseudo-polynomial**, not polynomial: the capacities are written in $O(\log C)$ bits. (Even one knapsack is NP-hard.)`,
    },
    {
      id: 'backtracking-vertex-cover-k', type: 'written', title: 'Small vertex covers', difficulty: 3,
      prompt: String.raw`A **vertex cover** of a graph G = (V, E) is a set $C \subseteq V$ such that every edge has at least one endpoint in C. Given G with n vertices and m edges and an integer k, we want to decide whether G has a vertex cover of size at most k.

(a) Trying all subsets of size at most k takes about $\binom{n}{k}$ steps. Give a backtracking algorithm that runs in $O(2^k (n + m))$ time instead, by branching on an **edge**.
(b) Prove it correct.
(c) Explain why branching on a vertex ("is v in the cover?") without further thought does not give this bound, and how to fix it.`,
      rubric: ['Algorithm: pick an edge uv, recurse on G − u and G − v with k − 1', 'Base cases: no edges ⇒ True; k = 0 with edges ⇒ False', 'Correctness: every cover contains u or v; both directions', 'Recursion tree of depth ≤ k with ≤ 2^{k+1} nodes, O(n + m) per node', 'Explains why vertex branching needs the "all neighbors in" rule'],
      hints: ['Every edge must be covered, so for any edge uv, one of u, v is in the cover.', 'Which parameter decreases in every recursive call?'],
      solution: String.raw`**(a)**
~~~pseudo
VC(G, k):        // True iff G has a vertex cover with at most k vertices
    if G has no edges: return True
    if k = 0: return False
    pick any edge uv
    return VC(G - u, k - 1) or VC(G - v, k - 1)
~~~
Here G − u deletes u and all edges incident to it (they are now covered).

**(b)** Induction on k (and the graph size).
*Base cases.* With no edges, the empty set is a cover: True is correct. With $k = 0$ and at least one edge, no set of size 0 covers it: False is correct.
*Step.* ($\Leftarrow$) If VC(G − u, k − 1) is True, G − u has a cover C' of size at most k − 1; then $C' \cup \{u\}$ covers every edge of G (edges at u are covered by u, the rest by C') and has size at most k. Similarly for v.
($\Rightarrow$) If G has a cover C with $\lvert C\rvert \le k$, then C contains u or v because the edge uv must be covered. If $u \in C$, then $C \setminus \{u\}$ covers all edges of G − u and has at most $k - 1$ vertices, so VC(G − u, k − 1) is True by induction. Similarly if $v \in C$.

**Time.** Every call decreases k by 1, so the recursion tree is a binary tree of depth at most k, with at most $2^{k+1} - 1$ nodes; each node does O(n + m) work. Total $O(2^k (n + m))$ — linear time for any constant k, even though Vertex Cover is NP-hard in general.

**(c)** With the branches "v in the cover" (k − 1) and "v not in the cover" (k unchanged), the second branch makes no progress on k, so the depth is bounded only by n: about $2^n$ in the worst case. The fix: if v is *not* in the cover, then **all** neighbors of v must be, so that branch becomes VC(G − N[v], k − deg(v)); choosing v with $\deg(v) \ge 1$ makes k drop in both branches and again gives $O(2^k(n+m))$ (and better when degrees are large).`,
    },
    {
      id: 'backtracking-recurrence-zoo', type: 'written', title: 'Running times of backtracking algorithms', difficulty: 2,
      prompt: String.raw`For each algorithm, write a recurrence for its worst-case running time (or number of recursive calls) **without memoization**, and solve it asymptotically.

(a) SubK(i, k, t): does some subset of X[i..n] with exactly k elements sum to t? (Two calls with i + 1.)
(b) MinPal(i): fewest palindromes into which A[i..n] can be split (loops over every end j of the first piece; assume palindrome tests cost O(1)).
(c) Part3(i, a, b): can X[i..n] be distributed among three bins with the given needs? (Three calls with i + 1.)
(d) Generating all permutations of n items by choosing the first item and recursing on the rest.
(e) LCS(i, j) on two strings of length n with no common characters (two calls, each advancing one index).
(f) A game where each move removes 1 or 2 tokens, evaluated from a pile of n tokens by a plain game-tree search that evaluates **both** moves at every position (no early exit).`,
      rubric: ['(a) 2T(n−1) + O(1) = Θ(2^n)', '(b) Σ T(k) + O(n) = Θ(2^n)', '(c) 3T(n−1) + O(1) = Θ(3^n)', '(d) nT(n−1) + O(n) = Θ(n!) calls times polynomial work', '(e) T(m,n) = T(m−1,n) + T(m,n−1) + O(1) = Θ(C(2n, n)) = Θ(4^n/√n)', '(f) T(n−1) + T(n−2) + O(1) = Θ(φ^n)'],
      hints: [String.raw`For "loop over all first pieces" recursions, subtract the equation for $T(n-1)$ from the one for $T(n)$.`, String.raw`For (d), divide by $n!$.`, String.raw`For (e), count leaves: they correspond to monotone lattice paths.`],
      solution: String.raw`**(a)** $T(n) = 2T(n-1) + O(1) = \Theta(2^n)$ (a full binary tree of depth n when the answer is False and no branch is pruned).

**(b)** On a string where many prefixes are palindromes (e.g. AAAA...A), $T(n) = \sum_{k=0}^{n-1} T(k) + O(n)$. Subtracting the equation for $T(n-1)$: $T(n) - T(n-1) = T(n-1) + O(1)$, so $T(n) = 2T(n-1) + O(1) = \Theta(2^n)$. (MinPal must explore every segmentation since it takes a min, so it cannot stop early; there are $2^{n-1}$ segmentations of AAAA...A, all into palindromes.)

**(c)** $T(n) = 3T(n-1) + O(1) = \Theta(3^n)$ in the worst case (no pruning).

**(d)** With r items remaining, the call loops over r choices: $T(r) = rT(r-1) + O(r)$. Dividing by $r!$: $T(r)/r! = T(r-1)/(r-1)! + O(1/(r-1)!)$, and $\sum 1/(r-1)!$ converges, so $T(n) = \Theta(n!)$ (plus O(n) per leaf if each permutation is printed).

**(e)** $T(a, b) = T(a-1, b) + T(a, b-1) + O(1)$ with $T(0, b) = T(a, 0) = O(1)$. The leaves correspond to lattice paths from (n, n) to an axis, and $L(a, b) = L(a-1, b) + L(a, b-1)$, $L = 1$ on the axes, gives $L(a, b) = \binom{a+b}{a}$. So $T(n, n) = \Theta\big(\binom{2n}{n}\big) = \Theta(4^n/\sqrt n)$.

**(f)** $T(n) = T(n-1) + T(n-2) + O(1) = \Theta(\phi^n)$, $\phi \approx 1.618$ — even though only n + 1 positions exist. (Stopping early as soon as a winning move is found prunes some branches, but the search stays exponential: at every losing position both moves must be examined.) Memoization makes it O(n), and the closed form (losing iff 3 divides n) makes it O(1).`,
    },
    {
      id: 'backtracking-lps-code', type: 'code', title: 'Longest palindromic subsequence', difficulty: 2,
      prompt: String.raw`Write <code>lpsLength(s)</code> returning the length of the longest subsequence of the string s that is a palindrome (0 for the empty string). For example, <code>lpsLength("BBABCBCAB")</code> is 7. Strings have length at most 40, so use the interval recursion LPS(i, j) **with memoization**.`,
      fn: 'lpsLength',
      starter: 'function lpsLength(s) {\n  // LPS(i, j) = longest palindromic subsequence of s[i..j]\n}\n',
      reference: function (s) {
        const n = s.length, memo = {};
        function L(i, j) {
          if (i > j) return 0;
          if (i === j) return 1;
          const key = i * 100 + j;
          if (memo[key] !== undefined) return memo[key];
          const v = s[i] === s[j] ? 2 + L(i + 1, j - 1) : Math.max(L(i + 1, j), L(i, j - 1));
          memo[key] = v;
          return v;
        }
        return L(0, n - 1);
      },
      tests: [['BBABCBCAB'], [''], ['a'], ['ab'], ['character'], ['aaaa'], ['abcba'], ['abcdefghij'], ['agbdba']],
      gen: () => {
        const L = Math.floor(Math.random() * 30);
        let s = '';
        for (let i = 0; i < L; i++) s += 'abc'[Math.floor(Math.random() * 3)];
        return [s];
      },
      hints: ['If s[i] === s[j], they can be the outer pair: 2 + LPS(i+1, j−1).', 'Otherwise drop one end: max(LPS(i+1, j), LPS(i, j−1)). Memoize on the pair (i, j).'],
      solution: String.raw`~~~js
function lpsLength(s) {
  const n = s.length;
  const memo = new Map();
  function L(i, j) {                    // longest palindromic subsequence of s[i..j]
    if (i > j) return 0;
    if (i === j) return 1;
    const key = i * (n + 1) + j;
    if (memo.has(key)) return memo.get(key);
    const v = s[i] === s[j] ? 2 + L(i + 1, j - 1)
                            : Math.max(L(i + 1, j), L(i, j - 1));
    memo.set(key, v);
    return v;
  }
  return L(0, n - 1);
}
~~~
$O(n^2)$ subproblems, O(1) each. Without the memo, a string of distinct characters would take $\Theta(2^n)$ time.`,
    },
    {
      id: 'backtracking-mis-code', type: 'code', title: 'Maximum independent set (brute force)', difficulty: 3,
      prompt: String.raw`Write <code>maxIndependentSet(n, edges)</code> returning the size of a largest independent set in the undirected graph with vertices <code>0..n-1</code> and the given edge list (each edge is a pair <code>[u, v]</code> with u ≠ v; duplicates may appear). Graphs have $n \le 16$. Use backtracking: pick a vertex v; if it has no remaining neighbors take it; otherwise return the better of "delete v" and "take v, delete v and its neighbors".`,
      fn: 'maxIndependentSet',
      starter: 'function maxIndependentSet(n, edges) {\n  // branch on a vertex: leave it out, or take it and delete its neighbors\n}\n',
      reference: function (n, edges) {
        const adj = new Array(n).fill(0);
        for (const e of edges) { const u = e[0], v = e[1]; if (u !== v) { adj[u] |= (1 << v); adj[v] |= (1 << u); } }
        function mis(mask) {
          if (mask === 0) return 0;
          let v = 0;
          while (!(mask & (1 << v))) v++;
          const rest = mask & ~(1 << v);
          if ((adj[v] & rest) === 0) return 1 + mis(rest);
          return Math.max(mis(rest), 1 + mis(rest & ~adj[v]));
        }
        return mis((1 << n) - 1);
      },
      tests: [[0, []], [1, []], [3, []], [5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]], [4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]], [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]], [7, [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]]], [10, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 7], [7, 9], [9, 6], [6, 8], [8, 5]]]],
      gen: () => {
        const n = Math.floor(Math.random() * 15);
        const edges = [];
        if (n >= 2) {
          const m = Math.floor(Math.random() * (n * (n - 1) / 2 + 1));
          for (let k = 0; k < m; k++) {
            const u = Math.floor(Math.random() * n);
            let v = Math.floor(Math.random() * (n - 1));
            if (v >= u) v++;
            edges.push([u, v]);
          }
        }
        return [n, edges];
      },
      hints: ['Represent the remaining vertex set as a bitmask (or a boolean array) and the neighborhoods as bitmasks.', String.raw`Taking v removes v and all its neighbors; leaving v out removes only v. Isolated vertices should always be taken.`],
      solution: String.raw`~~~js
function maxIndependentSet(n, edges) {
  const adj = new Array(n).fill(0);            // adj[v] = bitmask of neighbors
  for (const [u, v] of edges) { adj[u] |= 1 << v; adj[v] |= 1 << u; }
  function mis(mask) {                         // largest independent set inside 'mask'
    if (mask === 0) return 0;
    let v = 0;
    while (!(mask & (1 << v))) v++;            // lowest remaining vertex
    const rest = mask & ~(1 << v);
    if ((adj[v] & rest) === 0) return 1 + mis(rest);   // isolated: take it
    return Math.max(mis(rest),                          // v out
                    1 + mis(rest & ~adj[v]));           // v in: drop its neighbors
  }
  return mis((1 << n) - 1);
}
~~~
Running time $O(\phi^n)$ calls ($\phi \approx 1.618$), since the "take v" branch removes at least two vertices. The 10-vertex test graph is the Petersen graph, whose maximum independent set has size 4.`,
    },
    {
      id: 'backtracking-chromatic-code', type: 'code', title: 'Chromatic number by backtracking', difficulty: 3,
      prompt: String.raw`Write <code>chromaticNumber(n, edges)</code> returning the smallest k such that the graph with vertices <code>0..n-1</code> and the given undirected edges (pairs <code>[u, v]</code>, u ≠ v) has a proper k-coloring. Return 0 when n = 0. Graphs have $n \le 9$. For k = 1, 2, 3, ..., run a backtracking k-coloring test that colors vertices in order and tries every color not used by an earlier neighbor.`,
      fn: 'chromaticNumber',
      starter: 'function chromaticNumber(n, edges) {\n  // smallest k with a proper k-coloring\n}\n',
      reference: function (n, edges) {
        if (n === 0) return 0;
        const nb = Array.from({ length: n }, () => []);
        for (const e of edges) { if (e[0] !== e[1]) { nb[e[0]].push(e[1]); nb[e[1]].push(e[0]); } }
        const c = new Array(n).fill(-1);
        function color(i, k) {
          if (i === n) return true;
          for (let x = 0; x < k; x++) {
            let ok = true;
            for (const u of nb[i]) if (u < i && c[u] === x) { ok = false; break; }
            if (ok) { c[i] = x; if (color(i + 1, k)) { c[i] = -1; return true; } c[i] = -1; }
          }
          return false;
        }
        for (let k = 1; k <= n; k++) if (color(0, k)) return k;
        return n;
      },
      tests: [[0, []], [3, []], [2, [[0, 1]]], [5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]], [4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]], [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]], [6, [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [5, 1]]], [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]]]],
      gen: () => {
        const n = Math.floor(Math.random() * 9);
        const edges = [];
        if (n >= 2) {
          const m = Math.floor(Math.random() * (n * (n - 1) / 2 + 1));
          for (let k = 0; k < m; k++) {
            const u = Math.floor(Math.random() * n);
            let v = Math.floor(Math.random() * (n - 1));
            if (v >= u) v++;
            edges.push([u, v]);
          }
        }
        return [n, edges];
      },
      hints: ['Write a helper canColor(i, k) that assumes vertices 0..i−1 are already colored legally.', 'Try every color for vertex i that no earlier neighbor uses; undo the assignment if the recursive call fails.'],
      solution: String.raw`~~~js
function chromaticNumber(n, edges) {
  if (n === 0) return 0;
  const nb = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { nb[u].push(v); nb[v].push(u); }
  const c = new Array(n).fill(-1);
  function canColor(i, k) {              // c[0..i-1] is proper; can we finish with k colors?
    if (i === n) return true;
    for (let x = 0; x < k; x++) {
      if (nb[i].some(u => u < i && c[u] === x)) continue;
      c[i] = x;
      const ok = canColor(i + 1, k);
      c[i] = -1;                         // backtrack
      if (ok) return true;
    }
    return false;
  }
  for (let k = 1; k <= n; k++) if (canColor(0, k)) return k;
}
~~~
Each test explores $O(k^n)$ partial colorings. The odd cycle $C_5$ needs 3 colors, the wheel with a 5-cycle rim needs 4, the even cycle $C_6$ needs 2.`,
    },
    {
      id: 'backtracking-palpart-code', type: 'code', title: 'Count palindrome partitions', difficulty: 2,
      prompt: String.raw`Write <code>countPalPartitions(s)</code> returning the number of ways to split the string s into a sequence of nonempty contiguous pieces that are **all palindromes**. The empty string has exactly 1 partition (zero pieces). For example, "aab" has 2 (a·a·b and aa·b), and "aaaa" has 8. Strings have length at most 30, so memoize the recursion on the start index.`,
      fn: 'countPalPartitions',
      starter: 'function countPalPartitions(s) {\n  // number of ways to cut s into palindromes\n}\n',
      reference: function (s) {
        const n = s.length, memo = new Array(n + 1).fill(-1);
        function isPal(i, j) { while (i < j) { if (s[i] !== s[j]) return false; i++; j--; } return true; }
        function W(i) {
          if (i === n) return 1;
          if (memo[i] >= 0) return memo[i];
          let c = 0;
          for (let j = i; j < n; j++) if (isPal(i, j)) c += W(j + 1);
          memo[i] = c;
          return c;
        }
        return W(0);
      },
      tests: [['aab'], [''], ['a'], ['aaaa'], ['abc'], ['racecar'], ['abba'], ['ababab']],
      gen: () => {
        const L = Math.floor(Math.random() * 20);
        let s = '';
        for (let i = 0; i < L; i++) s += Math.random() < 0.6 ? 'a' : 'b';
        return [s];
      },
      hints: ['Ways(i) = number of palindrome partitions of the suffix s[i..]. Ways(n) = 1.', 'Ways(i) = sum over j ≥ i with s[i..j] a palindrome of Ways(j+1).'],
      solution: String.raw`~~~js
function countPalPartitions(s) {
  const n = s.length;
  const isPal = (i, j) => { while (i < j) if (s[i++] !== s[j--]) return false; return true; };
  const ways = new Array(n + 1).fill(0);
  ways[n] = 1;                                  // empty suffix: one (empty) partition
  for (let i = n - 1; i >= 0; i--)
    for (let j = i; j < n; j++)
      if (isPal(i, j)) ways[i] += ways[j + 1];
  return ways[0];
}
~~~
This is the Splittable recursion with IsWord replaced by IsPalindrome and OR replaced by +. $O(n^3)$ time as written ($O(n^2)$ with a precomputed palindrome table). A string of n equal letters has $2^{n-1}$ partitions — the plain recursion would enumerate them one by one.`,
    },
    {
      id: 'backtracking-coins-code', type: 'code', title: 'Coins in a row', difficulty: 2,
      prompt: String.raw`Coins with positive values lie in a row (array A). Two players alternate turns; on each turn a player takes the coin at either end of the row. Both play optimally to maximize their own totals. Write <code>coinGame(A)</code> returning the total collected by the **first** player. For example, <code>coinGame([8, 15, 3, 7])</code> is 22. Arrays have length at most 40, so memoize on the pair of endpoints.`,
      fn: 'coinGame',
      starter: 'function coinGame(A) {\n  // Best(i, j) = most the player to move can guarantee from A[i..j]\n}\n',
      reference: function (A) {
        const n = A.length, memo = {};
        const pre = [0];
        for (let k = 0; k < n; k++) pre.push(pre[k] + A[k]);
        function B(i, j) {
          if (i > j) return 0;
          const key = i * 100 + j;
          if (memo[key] !== undefined) return memo[key];
          const v = (pre[j + 1] - pre[i]) - Math.min(B(i + 1, j), B(i, j - 1));
          memo[key] = v;
          return v;
        }
        return B(0, n - 1);
      },
      tests: [[[8, 15, 3, 7]], [[]], [[5]], [[5, 3, 7, 10]], [[2, 2, 2, 2]], [[20, 30, 2, 2, 2, 10]], [[1, 100, 1]]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 25) }, () => 1 + Math.floor(Math.random() * 50))],
      hints: ['Whatever the opponent can guarantee from the row you leave, you get everything else.', String.raw`Best(i, j) = Sum(i..j) − min(Best(i+1, j), Best(i, j−1)); Best = 0 on an empty row.`],
      solution: String.raw`~~~js
function coinGame(A) {
  const n = A.length;
  const pre = [0];
  for (const x of A) pre.push(pre[pre.length - 1] + x);
  const memo = new Map();
  function best(i, j) {                     // player to move, coins A[i..j]
    if (i > j) return 0;
    const key = i * (n + 1) + j;
    if (memo.has(key)) return memo.get(key);
    const total = pre[j + 1] - pre[i];
    const v = total - Math.min(best(i + 1, j), best(i, j - 1));
    memo.set(key, v);
    return v;
  }
  return best(0, n - 1);
}
~~~
$O(n^2)$ subproblems, O(1) each. On [1, 100, 1] the first player gets only 2: whichever end they take, the opponent takes the 100.`,
    },
    {
      id: 'backtracking-signs-target', type: 'written', title: 'Plus or minus', difficulty: 2,
      prompt: String.raw`Given positive integers $X[1..n]$ and an integer T, we want to put a sign + or − in front of every X[i] so that the signed sum equals T. For example, for X = [3, 1, 4, 1, 5] and T = 4, one solution is $-3 - 1 + 4 - 1 + 5 = 4$.

(a) Give a backtracking algorithm that decides whether this is possible: an English specification, the recursion with base cases, the top-level call, and the running time.
(b) Modify it to **count** the sign assignments that work. (There are 4 for the example.)
(c) Memoize it. How many distinct subproblems are there, in terms of n and $S = X[1] + \cdots + X[n]$? Is the memoized algorithm polynomial?
(d) Show that the decision problem reduces to a single subset-sum question.`,
      rubric: ['English spec Signs(i, t): can X[i..n] be signed to sum to t', 'Recursion Signs(i+1, t − X[i]) OR Signs(i+1, t + X[i]); base case i > n returns (t = 0); top call Signs(1, T)', 'Counting version: + instead of OR, base case 1 if t = 0 else 0', 'Plain O(2^n); memoized O(nS) because t stays within T ± S — pseudo-polynomial', 'Reduction: the + elements must sum to (S + T)/2, with parity and |T| ≤ S checks'],
      hints: ['Decide the sign of X[i]; what must the rest of the signed sum be?', String.raw`In any call, t differs from T by a signed sum of some elements. What range does that put t in?`, String.raw`If P is the set of elements with a + sign, then $\text{sum}(P) - (S - \text{sum}(P)) = T$.`],
      solution: String.raw`**(a)** The next decision is the sign of X[i]. If it is +, the remaining elements must contribute $t - X[i]$; if it is −, they must contribute $t + X[i]$.

**Spec.** **Signs(i, t)** = True iff signs can be chosen for $X[i..n]$ so that their signed sum is exactly t.
$$\text{Signs}(i, t) = \begin{cases} (t = 0) & i > n\\ \text{Signs}(i+1, t - X[i]) \vee \text{Signs}(i+1, t + X[i]) & i \le n\end{cases}$$
The answer is Signs(1, T). *Correctness* (induction on n − i): every assignment for X[i..n] gives X[i] a sign, and the rest must make up the difference; the two calls cover both signs. The empty sequence has signed sum 0.

*Running time:* $T(n) = 2T(n-1) + O(1) = O(2^n)$ — one leaf per sign assignment.

**(b)** Count(i, t) = the number of sign assignments for X[i..n] with signed sum t: Count(i, t) = [t = 0] if $i > n$, else Count(i+1, t − X[i]) + Count(i+1, t + X[i]). Each assignment is exactly one root-to-leaf path, so nothing is counted twice. For the example S = 14 and the + elements must sum to 9: {4, 5}, {3, 1, 5} (with either 1) and {3, 1, 4, 1}, so Count(1, 4) = 4.

**(c)** In every call, t equals T minus a signed sum of X[1..i−1], so $T - S \le t \le T + S$: at most $(n+1)(2S+1)$ distinct subproblems. Memo: a table Signs[1..n+1][T−S..T+S] (shift the second index by $S - T$ to make it nonnegative). Order: row i reads only row i + 1, so fill i from n + 1 down to 1. Each entry is O(1): $O(nS)$ time and space. This is **pseudo-polynomial**, not polynomial: S can be exponential in the number of bits needed to write the input. (The problem is NP-hard, so no polynomial algorithm is expected.)

**(d)** Let P be the set of elements with sign +. Then $\text{sum}(P) - (S - \text{sum}(P)) = T$, i.e. $\text{sum}(P) = (S + T)/2$. So: if $\lvert T\rvert > S$ or $S + T$ is odd, answer False; otherwise answer SubsetSum(X, (S + T)/2). Every subset with that sum gives a valid sign assignment and vice versa.`,
    },
    {
      id: 'backtracking-at-most-k-words', type: 'written', title: 'Splitting into at most k words', difficulty: 2,
      prompt: String.raw`You are given a string $A[1..n]$, a subroutine IsWord(i, j) that decides in O(1) time whether A[i..j] is a word, and an integer k.

(a) Give a backtracking algorithm that decides whether A can be split into **at most k** words. Give an English specification, the recursion with base cases, the top-level call, and the running time.
(b) Memoize it and analyze the result.
(c) Show that for this question a recursion with only **one** parameter suffices, and that it gives an $O(n^2)$ algorithm.
(d) Now the question is whether A can be split into **exactly** k words. Does the trick of part (c) still work? If not, what does?`,
      rubric: ['Spec Split(i, p): A[i..n] can be split into at most p words', 'Base cases Split(n+1, p) = True and Split(i, 0) = False for i ≤ n; recursion over the end j of the first word with p − 1', 'Plain O(2^n); memoized O(nk) subproblems × O(n) = O(n²k)', 'One-parameter version: Fewest(i), answer Fewest(1) ≤ k, O(n²), justified by monotonicity', 'Exactly k: counterexample to the shortcut and the two-parameter recursion'],
      hints: ['Add the number of words still allowed as a parameter.', String.raw`"At most k" is monotone: if a split into fewer words exists, that's good enough. What is the fewest number of words?`, 'For exactly k words, think about a string whose possible word counts have a gap.'],
      solution: String.raw`**(a)** **Split(i, p)** = True iff the suffix A[i..n] can be split into at most p words.
$$\text{Split}(i, p) = \begin{cases} \text{True} & i > n\\ \text{False} & i \le n \text{ and } p = 0\\ \displaystyle\bigvee_{i \le j \le n} \big(\text{IsWord}(i, j) \wedge \text{Split}(j+1, p-1)\big) & \text{otherwise}\end{cases}$$
The first word is some A[i..j]; the rest must be split into at most p − 1 words. Answer Split(1, k). *Plain time:* as for Splittable, $T(n) \le \sum_{m<n} T(m) + O(n)$, which is $O(2^n)$.

**(b)** The parameters satisfy $1 \le i \le n+1$ and $0 \le p \le k$, so there are $O(nk)$ subproblems. Memo: Split[1..n+1][0..k]. Split(·, p) reads only Split(·, p − 1), so fill p from 0 up to k (any order of i within a layer). Each entry loops over O(n) values of j: $O(n^2 k)$ time, $O(nk)$ space.

**(c)** Let **Fewest(i)** = the minimum number of words in a split of A[i..n] ($\infty$ if there is none). Fewest(n+1) = 0 and $\text{Fewest}(i) = \min\{1 + \text{Fewest}(j+1) : i \le j \le n,\ \text{IsWord}(i, j)\}$ (min of the empty set is $\infty$). A split into at most k words exists iff the best split uses at most k words, so the answer is **Fewest(1) ≤ k**. Table Fewest[1..n+1], filled for i from n + 1 down to 1: $O(n^2)$ time, independent of k. Lesson: when a budget only needs to be respected ("at most k"), minimize the amount used instead of carrying the budget.

**(d)** No: "exactly k" is not monotone. With dictionary {AB} and A = AB, Fewest(1) = 1 ≤ 2, but no split into exactly 2 words exists. Even the minimum and maximum together do not suffice, because the achievable counts can have gaps: with dictionary {A, AAA}, the string AAA splits into 1 word (AAA) or 3 words (A·A·A) but not 2. Use **Exact(i, p)** = True iff A[i..n] splits into exactly p words: Exact(n+1, p) = (p = 0); Exact(i, 0) = False for $i \le n$; otherwise the same OR over j with Exact(j+1, p−1). Same $O(n^2 k)$ time as part (b).`,
    },
    {
      id: 'backtracking-wildcard', type: 'written', title: 'Wildcard matching', difficulty: 3,
      prompt: String.raw`A **pattern** $P[1..m]$ consists of letters and two wildcards: <code>?</code> matches exactly one arbitrary character and <code>*</code> matches any string of characters, including the empty string. A text $T[1..n]$ consists of letters. P **matches** T if the wildcards can be replaced so that P becomes T. For example, <code>a*b?c</code> matches axbbyc (with <code>*</code> = xb and <code>?</code> = y).

(a) Give a backtracking algorithm that decides whether P matches T. Give an English specification, the recursion with base cases and the top-level call. Handle <code>*</code> with only **two** recursive choices.
(b) Show that the plain recursion can take exponential time.
(c) Memoize it: memo structure, evaluation order, running time.
(d) A friend matches each <code>*</code> "as little as possible": it absorbs only as many characters as needed until the next pattern character matches. Show on the example above that committing to that choice (without trying others) gives the wrong answer.`,
      rubric: ['Spec Match(i, j): P[i..m] matches T[j..n]; answer Match(1, 1)', 'Base case i > m returns (j > n); star case Match(i+1, j) OR (j ≤ n and Match(i, j+1)); ? / letter case; mismatch and j > n cases', 'Justification of the two star choices (empty, or first character absorbed)', 'Exponential example such as many stars followed by b against aaa...a, with a counting argument', 'Memo (m+1)×(n+1), i and j decreasing, O(mn) time', 'Counterexample to the "as little as possible" commitment'],
      hints: ['Look at P[i]. If it is a letter or ?, the next text character is forced. If it is a star, either it matches nothing, or it swallows T[j] and is still there.', 'For (b), use a pattern of many stars followed by a letter that does not occur in the text: the answer is False, so nothing stops the search early.', 'For (d), try star = empty and star = x first.'],
      solution: String.raw`**(a)** **Match(i, j)** = True iff the pattern suffix P[i..m] matches the text suffix T[j..n].
$$\text{Match}(i, j) = \begin{cases} (j > n) & i > m\\ \text{Match}(i+1, j) \vee \big(j \le n \wedge \text{Match}(i, j+1)\big) & P[i] = \text{star}\\ \text{False} & P[i] \ne \text{star},\ j > n\\ \text{Match}(i+1, j+1) & P[i] = \text{?} \text{ or } P[i] = T[j]\\ \text{False} & \text{otherwise.}\end{cases}$$
The answer is Match(1, 1).

**Why two choices suffice for a star.** In any match, a star P[i] matches some T[j..j'−1]. If that string is empty, P[i+1..m] matches T[j..n]: the first branch. Otherwise its first character is T[j], and the rest of its match together with the rest of the pattern shows that P[i..m] (the star still in front) matches T[j+1..n]: the second branch. Conversely each branch clearly yields a match. Letters and <code>?</code> consume exactly one text character, which must exist (and be equal, for a letter).

**(b)** Take P = <code>**...*b</code> (k stars, then b) and T = $a^n$. The answer is False (T has no b), so no branch succeeds early. Every way to distribute the n characters among the k stars before reaching the b — a composition of n into k nonnegative parts — is a different path in the recursion tree, so there are at least $\binom{n+k-1}{k-1}$ leaves. With k = n this is $\binom{2n-1}{n-1} = \Theta(4^n/\sqrt n)$.

**(c)** Memo: Boolean table Match[1..m+1][1..n+1]. Match(i, j) reads (i+1, j), (i, j+1) and (i+1, j+1), so fill i from m + 1 down to 1 and, for each i, j from n + 1 down to 1. Each entry is O(1): $O(mn)$ time and space. (Letting a star loop over every possible length instead would cost O(n) per entry, $O(mn^2)$ in total — the two-choice formulation saves a factor of n.)

**(d)** On P = <code>a*b?c</code> and T = axbbyc: after the a, the friend lets the star absorb x (the smallest amount that makes the next pattern letter b match T[3] = b). Then <code>?</code> matches T[4] = b and c is compared with T[5] = y: failure, and the friend answers False. But star = xb works: b matches T[4], <code>?</code> matches y and c matches c. A commitment that looks safe locally can fail later — the backtracking (or the DP) tries both choices at every star.`,
    },
    {
      id: 'backtracking-ham-path', type: 'written', title: 'Hamiltonian paths: backtracking vs. memoization', difficulty: 3,
      prompt: String.raw`A **Hamiltonian path** in an undirected graph G = (V, E) with n vertices is a path that visits every vertex exactly once.

(a) Give a backtracking algorithm that decides whether G has a Hamiltonian path by extending a simple path one vertex at a time. Specify your recursive function in English and bound its running time.
(b) What does the rest of the search need to know about the path built so far? Use your answer to memoize the algorithm, and analyze the result.
(c) Your memoized algorithm is still exponential. Explain why the state cannot be reduced to "the current endpoint" as in the longest-path DP for DAGs.`,
      rubric: ['Spec Ext(S, v): a path that has visited exactly S and ends at v can be extended to all of V', 'Recursion over neighbors w ∉ S; base case S = V; top-level OR over all start vertices', 'Running time O(n · n!) via counting simple paths', 'Memoization on (S, v): 2^n · n states, O(n) each ⇒ O(2^n n²); evaluation order by decreasing |S| (or decreasing bitmask)', 'Explanation that the visited set is essential in general graphs, unlike DAGs; consistent with NP-hardness'],
      hints: ['The decision: which unvisited neighbor of the current endpoint comes next?', 'Does the future depend on the order in which the visited vertices were visited?', 'In a DAG, can a path ever return to a vertex it has already passed?'],
      solution: String.raw`**(a)** **Ext(S, v)**, for $S \subseteq V$ and $v \in S$, is True iff a simple path that has visited exactly the vertices of S and currently ends at v can be extended to a Hamiltonian path.

~~~pseudo
Ext(S, v):
    if S = V: return True
    for each neighbor w of v with w not in S:
        if Ext(S + {w}, w): return True
    return False

HamPath(G):  return OR over all v in V of Ext({v}, v)
~~~

*Correctness:* the next vertex of any extension is an unvisited neighbor of v, and after appending it we face the same question with $S \cup \{w\}$ and endpoint w.
*Running time:* every call corresponds to a different simple path (the sequence of vertices visited so far). From a fixed start there are at most $(n-1)!/(n-1-r)!$ simple paths with r more vertices, at most $e\cdot(n-1)!$ in total; each call does O(n) work with an adjacency matrix and a bitmask for S. Over all n starts: $O(n \cdot n!)$.

**(b)** Whether the path can be completed depends only on **which** vertices are used (they may not be revisited) and **where** the path currently ends — not on the order in which S was visited. So many different paths lead to the same subproblem (S, v), and we can memoize. Memo: a Boolean table indexed by S (an n-bit mask) and v: $2^n \cdot n$ entries. Order: Ext(S, v) reads only entries with the larger set $S \cup \{w\}$, whose mask is numerically larger, so process masks from $2^n - 1$ down to 1. Each entry scans O(n) neighbors: $O(2^n n^2)$ time, $O(2^n n)$ space. For n = 20, $n! \approx 2.4 \times 10^{18}$ while $2^n n^2 \approx 4 \times 10^8$.

**(c)** The parameter S ranges over $2^n$ subsets, so the number of subproblems is exponential — memoization cannot make this polynomial, which is consistent with Hamiltonian path being NP-hard. In a DAG, every path visits vertices in topological order, so a path can never return to a vertex it has already passed: the current vertex alone determines which moves are legal, and LongestPath(v) has only n subproblems. In a general graph the endpoint does not tell us which neighbors were already used, so the visited set is genuinely needed (as far as anyone knows).`,
    },
    {
      id: 'backtracking-square-game', type: 'written', title: 'The square-removal game', difficulty: 2,
      prompt: String.raw`A pile holds n tokens. Two players alternate; a move removes a **positive perfect square** number of tokens (1, 4, 9, 16, ...), at most the number in the pile. A player who cannot move (empty pile) loses.

(a) Write the recursion Win(n) (True iff the player to move can force a win).
(b) Compute Win(n) for n = 0, ..., 12 and list the losing positions.
(c) Analyze the running time of the plain recursion and of the memoized version.
(d) Is the memoized algorithm polynomial in the size of the input?`,
      rubric: ['Win(0) = False; Win(n) = OR over squares s ≤ n of NOT Win(n − s)', 'Correct table; losing positions 0, 2, 5, 7, 10, 12', 'Plain recursion exponential, via T(n) ≥ T(n−1) + T(n−4)', String.raw`Memoized: n + 1 entries × O(√n) moves = O(n^{3/2})`, 'Pseudo-polynomial: n is written with about log n bits'],
      hints: ['A position is winning iff some move leads to a losing position.', String.raw`Fill the table upward from n = 0; from n there are $\lfloor\sqrt n\rfloor$ moves.`],
      solution: String.raw`**(a)** Win(0) = False (no move is possible), and for $n \ge 1$
$$\text{Win}(n) = \bigvee_{k \ge 1,\ k^2 \le n} \neg\,\text{Win}(n - k^2).$$
The answer for a pile of n is Win(n).

**(b)**

| n | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Win(n) | L | W | L | W | W | L | W | L | W | W | L | W | L |

For example, Win(5) = False because its moves lead to 4 and 1, both winning; Win(10) = False because 9, 6 and 1 are all winning; Win(12) = False because 11, 8 and 3 are all winning. The losing positions up to 12 are **0, 2, 5, 7, 10, 12** (the next ones are 15, 17, 20, 22, 34, 39 — the pattern is not periodic, so there is no shortcut formula to memorize).

**(c)** If the plain recursion evaluates every move, $T(n) = \sum_{k^2 \le n} T(n - k^2) + O(\sqrt n) \ge T(n-1) + T(n-4)$ for $n \ge 4$, which grows like $c^n$ with $c \approx 1.38$ (the root of $x^4 = x^3 + 1$): exponential. Stopping at the first winning move does not rescue it, since at losing positions every move must be examined. Memoized, there are n + 1 subproblems, each looping over $\lfloor\sqrt n\rfloor$ moves; filling Win[0..n] in increasing order takes $O(n^{3/2})$ time and O(n) space.

**(d)** No. The input is the single number n, written with about $\log_2 n$ bits, and $n^{3/2} = 2^{1.5\log_2 n}$ is exponential in that. Like the subset-sum DP, this is **pseudo-polynomial**.`,
    },
    {
      id: 'backtracking-mock2-hops', type: 'written', title: 'The hopping robot', difficulty: 3, tags: ['mt2-mock-2'],
      prompt: String.raw`A robot moves along a straight track with n platforms at distinct integer positions $0 = x[1] < x[2] < \cdots < x[n]$ (a sorted array). It starts on platform 1. Its **first hop has length exactly 1**. After a hop of length L, its next hop must have length $L - 1$, L or $L + 1$ (and length at least 1). Every hop goes forward and must land exactly on a platform. For example, with x = [0, 1, 3, 5, 6, 8, 12, 17] the robot can reach the last platform with hops of lengths 1, 2, 2, 3, 4, 5; with x = [0, 1, 2, 3, 4, 8, 9, 11] it cannot.

**(a)** [4 pts] Describe a recursive backtracking algorithm that decides whether the robot can reach platform n. Give an English specification of your recursive function, the recursion with base cases, the top-level call, and the running time of the plain (unmemoized) recursion.

**(b)** [4 pts] Turn your algorithm into a dynamic program: bound the number of distinct subproblems, describe the memoization structure and a valid evaluation order, and give the running time. (You may assume that "which platform, if any, is at position p?" can be answered in O(1) time after O(n) preprocessing, for example with a hash table — or explain how to avoid that assumption.)

**(c)** [2 pts] Modify your algorithm to compute the **minimum number of hops** needed to reach platform n ($\infty$ if it is unreachable), and give its running time.`,
      rubric: [
        '(1 pt) English specification: Reach(i, L) = whether the robot, standing on platform i after a hop of length L, can reach platform n',
        '(2 pts) Recursion over the next hop length L − 1, L, L + 1 (at least 1, landing on a platform); base case i = n; top-level call Reach(1, 0) (or an explicit first hop of 1)',
        '(1 pt) Plain running time O(3^n): at most 3 calls, each to a later platform, so depth ≤ n − 1',
        '(1 pt) Bound L ≤ i − 1 (hop lengths grow by at most 1 per hop), hence O(n²) subproblems',
        '(1 pt) Memoization structure, e.g. Boolean array Reach[1..n][0..n]',
        '(1 pt) Evaluation order: i from n down to 1 (calls only go to larger i), any order of L',
        '(1 pt) Running time O(n²) with O(1) platform lookups (O(n² log n) with binary search)',
        '(2 pts) Fewest hops: same table, 0 at i = n, 1 + min over the legal hops, ∞ if none; answer Hops(1, 0); O(n²)',
      ],
      hints: ['To know which hops are legal next, what must the robot remember? Only where it stands and the length of its last hop.', 'Use L = 0 as a "virtual" previous hop at the start: then the only legal first hop has length 1.', 'After h hops the last hop has length at most h, and the robot stands on platform h + 1 or later.'],
      solution: String.raw`**(a) Backtracking.** The robot's next decision is the length of its next hop: $L - 1$, L or $L + 1$. After the hop, the remaining problem is the same one from a new platform with a new "last hop"; nothing else about the past matters.

**Spec.** For a platform index i and an integer $L \ge 0$, **Reach(i, L)** = True iff the robot, standing on platform i with its previous hop of length L, can reach platform n by a sequence of legal hops. Let Plat(p) be the index j with x[j] = p, or NONE.

~~~pseudo
Reach(i, L):
    if i = n: return True
    for L2 in {L - 1, L, L + 1}:
        if L2 >= 1:
            j = Plat(x[i] + L2)
            if j != NONE and Reach(j, L2): return True
    return False
~~~

**Top-level call:** Reach(1, 0). With "previous hop" 0 the candidate lengths are −1, 0 and 1, and only 1 is legal — exactly the rule for the first hop.

*Correctness* (induction on n − i): if i = n we are done. Otherwise any successful hop sequence starts with a legal hop of some length L2 to a platform j, and the rest of it is a successful sequence for the robot standing on j with last hop L2, which is exactly what Reach(j, L2) decides. The algorithm tries all (at most three) legal first hops.

**Plain running time.** Each call makes at most 3 recursive calls, each to a platform with a larger index, so the recursion tree has depth at most n − 1 and at most $1 + 3 + \cdots + 3^{n-1} = O(3^n)$ nodes, each doing O(1) work: $O(3^n)$ time. (The same pair (i, L) is reached by many different hop sequences, which is what memoization exploits.)

**(b) Dynamic program.** *Bounding L.* Hop lengths start at 1 and grow by at most 1 per hop, so after h hops, $L \le h$. Every hop moves to a larger platform index, so after h hops the robot stands on platform $i \ge h + 1$. Hence every call that actually occurs has $0 \le L \le i - 1 \le n - 1$: at most $n^2$ distinct subproblems.

*Memo:* a Boolean array Reach[1..n][0..n] (only entries with L < i are used).
*Order:* Reach(i, L) reads only entries Reach(j, ·) with j > i. Fill i from n down to 1; for each i, any order of L.
*Time:* $O(n^2)$ entries, each with three O(1) lookups: $O(n^2)$ time and space. The answer is Reach[1][0].

*Avoiding hashing:* only hop lengths up to n matter, so precompute Next[i][d] = the index j with x[j] = x[i] + d for $1 \le d \le n$ (or NONE) by scanning j = i + 1, i + 2, ... while $x[j] - x[i] \le n$: $O(n^2)$ total, the same bound. With binary search instead, $O(n^2 \log n)$.

*Examples.* In the first example the robot goes 0 → 1 → 3 → 5 → 8 → 12 → 17. In the second, on platforms 0–4 it can never build up a hop longer than 2, but reaching 8 needs a hop of length 4 from position 4 (or 5 from position 3); so Reach[1][0] = False.

**(c) Fewest hops.** **Hops(i, L)** = the minimum number of hops that take the robot from platform i (previous hop L) to platform n, or $\infty$ if impossible. Hops(n, L) = 0, and for i < n
$$\text{Hops}(i, L) = \min\{1 + \text{Hops}(j, L_2) : L_2 \in \{L-1, L, L+1\},\ L_2 \ge 1,\ x[j] = x[i] + L_2\},$$
with $\min \emptyset = \infty$. Same table shape, same evaluation order, O(1) per entry: $O(n^2)$ time. The answer is Hops(1, 0); for the first example it is 6. (Unlike the decision version there is no early exit, but each entry still examines only three options.)`,
    },
    {
      id: 'backtracking-signs-code', type: 'code', title: 'Count sign assignments', difficulty: 2,
      prompt: String.raw`Write <code>countSigns(X, T)</code>: given an array X of nonnegative integers and an integer T, return the number of ways to put a sign + or − in front of every element so that the signed sum equals T. Assignments are counted by position, so for X = [0] and T = 0 the answer is 2 (+0 and −0). The empty array has one assignment, with sum 0. Example: <code>countSigns([3, 1, 4, 1, 5], 4)</code> is 4. Arrays have length at most 20; memoize on (index, remaining target) or use plain backtracking.`,
      fn: 'countSigns',
      starter: 'function countSigns(X, T) {\n  // Count(i, t) = number of sign choices for X[i..] with signed sum t\n}\n',
      reference: function (X, T) {
        const n = X.length, memo = new Map();
        function C(i, t) {
          if (i === n) return t === 0 ? 1 : 0;
          const key = i + ',' + t;
          if (memo.has(key)) return memo.get(key);
          const v = C(i + 1, t - X[i]) + C(i + 1, t + X[i]);
          memo.set(key, v);
          return v;
        }
        return C(0, T);
      },
      tests: [[[3, 1, 4, 1, 5], 4], [[], 0], [[], 3], [[1, 1, 1, 1], 0], [[0], 0], [[0, 0, 2], 2], [[2, 3, 5], 0], [[7], -7], [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], [[5, 5, 5], 1]],
      gen: () => {
        const n = Math.floor(Math.random() * 15);
        const X = Array.from({ length: n }, () => Math.floor(Math.random() * 10));
        let T = 0;
        if (Math.random() < 0.6) { for (const x of X) T += Math.random() < 0.5 ? x : -x; }
        else T = Math.floor(Math.random() * 31) - 15;
        return [X, T];
      },
      hints: ['Count(i, t): if X[i] gets +, the rest must sum to t − X[i]; if −, to t + X[i].', 'Base case: past the end, the count is 1 if t = 0 and 0 otherwise. Use a Map keyed by "i,t" since t can be negative.'],
      solution: String.raw`~~~js
function countSigns(X, T) {
  const n = X.length;
  const memo = new Map();
  function count(i, t) {                  // sign choices for X[i..n-1] with signed sum t
    if (i === n) return t === 0 ? 1 : 0;
    const key = i + ',' + t;
    if (memo.has(key)) return memo.get(key);
    const v = count(i + 1, t - X[i])      // X[i] gets +
            + count(i + 1, t + X[i]);     // X[i] gets -
    memo.set(key, v);
    return v;
  }
  return count(0, T);
}
~~~
Plain backtracking is $O(2^n)$. With the memo, t always lies in $[T - S, T + S]$ where S is the sum of X, so there are $O(nS)$ subproblems: pseudo-polynomial time. Zeros are handled correctly because the base case waits until i = n.`,
    },
    {
      id: 'backtracking-wildcard-code', type: 'code', title: 'Wildcard matching', difficulty: 2,
      prompt: String.raw`Write <code>wildcardMatch(p, s)</code> returning true iff the pattern p matches the whole string s. In p, the character <code>?</code> matches exactly one arbitrary character and <code>*</code> matches any string, including the empty one; every other character matches itself. Examples: <code>wildcardMatch("a*b?c", "axbbyc")</code> is true, <code>wildcardMatch("*ab?", "cabab")</code> is false. Lengths are at most 60, so memoize Match(i, j) (or fill the table) — plain backtracking can take exponential time.`,
      fn: 'wildcardMatch',
      starter: 'function wildcardMatch(p, s) {\n  // Match(i, j): does p[i..] match s[j..]?\n}\n',
      reference: function (p, s) {
        const m = p.length, n = s.length;
        const M = [];
        for (let i = 0; i <= m; i++) M.push(new Array(n + 1).fill(false));
        for (let i = m; i >= 0; i--) {
          for (let j = n; j >= 0; j--) {
            if (i === m) M[i][j] = (j === n);
            else if (p[i] === '*') M[i][j] = M[i + 1][j] || (j < n && M[i][j + 1]);
            else if (j === n) M[i][j] = false;
            else M[i][j] = (p[i] === '?' || p[i] === s[j]) && M[i + 1][j + 1];
          }
        }
        return M[0][0];
      },
      tests: [['a*b?c', 'axbbyc'], ['*ab?', 'cabab'], ['', ''], ['*', ''], ['?', ''], ['a', 'a'], ['a', 'b'], ['**b', 'aaa'], ['*a*b*', 'xxaybz'], ['?*?', 'ab'], ['*****************b', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'], ['a*a*a*a*a*a*a*a*b', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']],
      gen: () => {
        const plen = Math.floor(Math.random() * 9);
        let p = '';
        for (let i = 0; i < plen; i++) p += 'ab?*'[Math.floor(Math.random() * 4)];
        let s = '';
        if (Math.random() < 0.5) {
          for (const c of p) {
            if (c === '?') s += 'ab'[Math.floor(Math.random() * 2)];
            else if (c === '*') { const k = Math.floor(Math.random() * 3); for (let t = 0; t < k; t++) s += 'ab'[Math.floor(Math.random() * 2)]; }
            else s += c;
          }
        } else {
          const slen = Math.floor(Math.random() * 10);
          for (let i = 0; i < slen; i++) s += 'ab'[Math.floor(Math.random() * 2)];
        }
        return [p, s];
      },
      hints: ['If p[i] is a letter or ?, it must consume s[j] (which must exist). If p[i] is *, either it matches nothing — Match(i+1, j) — or it swallows s[j] and stays — Match(i, j+1).', 'Base case: an exhausted pattern matches only an exhausted string. Fill the table with i and j both decreasing.'],
      solution: String.raw`~~~js
function wildcardMatch(p, s) {
  const m = p.length, n = s.length;
  // M[i][j] = does p[i..m-1] match s[j..n-1]?
  const M = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
  for (let i = m; i >= 0; i--) {
    for (let j = n; j >= 0; j--) {
      if (i === m) M[i][j] = (j === n);
      else if (p[i] === '*') M[i][j] = M[i + 1][j] || (j < n && M[i][j + 1]);
      else if (j === n) M[i][j] = false;
      else M[i][j] = (p[i] === '?' || p[i] === s[j]) && M[i + 1][j + 1];
    }
  }
  return M[0][0];
}
~~~
$O(mn)$ time and space. Without memoization, a pattern such as many stars followed by a letter missing from the text makes the recursion try every way of distributing the text among the stars.`,
    },
  ],
});
