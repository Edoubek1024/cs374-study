CS374.topic({
  id: 'dp2',
  unit: 'algorithms',
  order: 14,
  title: 'Dynamic Programming II',
  summary: 'Harder dynamic programs: 0/1 knapsack and pseudo-polynomial time, DP on trees, interval DP (matrix chains, optimal BSTs, parenthesizing expressions), DP as paths in DAGs, grid DPs, saving space and reconstructing solutions.',
  objectives: [
    'Solve 0/1 knapsack in O(nW) time and explain why that is pseudo-polynomial',
    'Design DPs on rooted trees, with subproblems indexed by vertices and evaluated in postorder',
    'Design interval DPs (matrix-chain multiplication, optimal BST, parenthesizing expressions, cutting problems)',
    'View every DP as a computation over a DAG of subproblems; solve longest/shortest paths in DAGs',
    'Reduce space by keeping only needed rows, and reconstruct optimal solutions by tracing back choices',
    'Attack unfamiliar exam-level DP problems by deciding what state the recursion must remember',
  ],
  lesson: String.raw`## Beyond the classics: a strategy for harder DPs

Every DP in this unit is designed the same way as before: **find a backtracking recursion, specify it in English, and memoize it**. What changes is the *shape* of the subproblems:

| Shape | Subproblem indexed by | Examples |
|---|---|---|
| Prefix/suffix | one index i | LIS, segmentation, weighted interval scheduling |
| Prefix + resource | index i and a number (capacity, target) | knapsack, subset sum |
| Two sequences / grid | (i, j) | edit distance, LCS, grid paths, shuffles |
| Interval | (i, j) with $i \le j$ | matrix chain, optimal BST, palindromes, expression parenthesization |
| Tree | a vertex v (plus a few flags) | independent set, vertex cover, dominating set in trees |
| DAG | a vertex of a DAG | longest/shortest path in a DAG, counting paths |

> **Key idea.** When a natural recursion doesn't work, ask: **what does the rest of the computation need to know about the decisions made so far?** Add exactly that (as a small number or an index) to the subproblem. Examples: the remaining capacity (knapsack), the last element chosen (LIS), whether the parent is in the set (trees), the direction of the next step (zigzag).

## 0/1 knapsack

**Problem.** n items; item i has integer weight $w_i > 0$ and value $v_i \ge 0$. A knapsack holds total weight at most W. Choose a subset of items of total weight $\le W$ maximizing total value. Each item can be taken at most once.

Greedy by value/weight ratio fails: with W = 10 and items (weight, value) = (6, 30), (5, 20), (5, 20), the best ratio item (6, 30) blocks the optimal pair worth 40.

**Backtracking:** item 1 is either skipped or taken (if it fits); what remains is a knapsack problem on items 2..n with the same or reduced capacity.

1. **Spec.** For $1 \le i \le n+1$ and $0 \le w \le W$: K(i, w) = the maximum total value of a subset of items i..n with total weight at most w. Answer: K(1, W).
2. **Recurrence.**
$$K(i, w) = \begin{cases} 0 & i > n\\ K(i+1, w) & w_i > w\\ \max\{K(i+1, w),\ v_i + K(i+1, w - w_i)\} & \text{otherwise}\end{cases}$$
3. **Memo.** 2D array K[1..n+1][0..W].
4. **Order.** Row i depends only on row i + 1: fill i from n + 1 down to 1; within a row, any order of w.
5. **Time/space.** $O(nW)$ time and space; $O(W)$ space if only the value is needed (keep one row).

**Example.** W = 10, items (5, 10), (4, 40), (6, 30), (3, 50). The optimum is 90: items 2 and 4 (weight 7).

> **Warning.** $O(nW)$ is **pseudo-polynomial**. The input describes W with only $O(\log W)$ bits, so $nW$ is exponential in the input size. Knapsack is NP-hard; a truly polynomial algorithm would prove P = NP. On exams, whenever your running time contains a numeric input value (W, T, a target sum), say "pseudo-polynomial".

**Variants.**
- *Unbounded knapsack* (unlimited copies): $K(w) = \max\big(\{0\}\cup\{v_i + K(w - w_i) : w_i \le w\}\big)$, $O(nW)$.
- *Value-indexed DP:* $M(i, v)$ = minimum weight of a subset of items i..n with value exactly v; $O(nV)$ where V is the total value. Useful when values are small and weights are huge.

**Reconstructing the chosen items.** After filling the table, start at (1, W): if $K(1, W) = K(2, W)$, item 1 is skipped; otherwise it is taken and we continue from $(2, W - w_1)$. Repeat. This needs the full 2D table (or recomputation).

~~~steps Filling a knapsack table by hand (W = 6) and recovering the items
**Instance.** Items (weight, value): 1 = (3, 2), 2 = (2, 5), 3 = (4, 9), 4 = (1, 3). Capacity W = 6. Greedy by value/weight ratio takes item 4 (ratio 3), item 2 (2.5), skips item 3 (no room left for weight 4), then takes item 1: value 3 + 5 + 2 = 10. Let's see what the DP says.

We fill rows i = 5, 4, 3, 2, 1 (bottom-up, since row i reads row i + 1), columns w = 0..6. Row 5 (no items) is all 0.
+++
**Row 4 (item 4 = (1, 3)).** For w ≥ 1 the item fits: max(skip 0, take 3 + 0) = 3. Row: 0 3 3 3 3 3 3.

**Row 3 (item 3 = (4, 9)).** For w < 4 it doesn't fit: copy row 4. w = 4: max(3, 9 + K(4, 0) = 9) = 9. w = 5: max(3, 9 + K(4, 1) = 12) = 12. w = 6: max(3, 9 + K(4, 2) = 12) = 12. Row: 0 3 3 3 9 12 12.
+++
**Row 2 (item 2 = (2, 5)).** w = 1: doesn't fit, 3. w = 2: max(3, 5 + K(3, 0)) = 5. w = 3: max(3, 5 + K(3, 1) = 8) = 8. w = 4: max(9, 5 + K(3, 2) = 8) = 9. w = 5: max(12, 5 + K(3, 3) = 8) = 12. w = 6: max(12, 5 + K(3, 4) = 14) = **14**.

**Row 1 (item 1 = (3, 2)).** Taking it never helps here; for example w = 6: max(14, 2 + K(2, 3) = 10) = 14.

| i \ w | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 3 | 5 | 8 | 9 | 12 | **14** |
| 2 | 0 | 3 | 5 | 8 | 9 | 12 | 14 |
| 3 | 0 | 3 | 3 | 3 | 9 | 12 | 12 |
| 4 | 0 | 3 | 3 | 3 | 3 | 3 | 3 |
| 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
+++
**Traceback** from (1, 6):
- K(1, 6) = 14 = K(2, 6): skip item 1.
- K(2, 6) = 14 ≠ K(3, 6) = 12: take item 2, capacity becomes 6 − 2 = 4.
- K(3, 4) = 9 ≠ K(4, 4) = 3: take item 3, capacity becomes 0.
- K(4, 0) = 0 = K(5, 0): skip item 4.

Optimal set {2, 3}: weight 6, value **14**, beating greedy's 10. The traceback is O(n) because each row is visited once.
~~~

### Knapsack variants you should be able to write instantly

- **Exact capacity.** "Total weight exactly W": same recurrence, but the base case becomes K(n+1, 0) = 0 and K(n+1, w) = $-\infty$ for w > 0. Impossible states carry $-\infty$ through the max.
- **Unbounded (unlimited copies).** One parameter suffices: $U(w) = \max(\{0\}\cup\{v_i + U(w - w_i) : w_i \le w\})$. In the one-array implementation, the only difference from 0/1 knapsack is the direction of the inner loop (w increasing lets an item be reused).
- **A second resource** (weight ≤ W *and* volume ≤ V): add a parameter, K(i, w, u). Time $O(nWV)$, still pseudo-polynomial.
- **A cardinality limit** (at most k items): add the number of items still allowed. See Example 2 below.
- **Value-indexed** (small values, huge weights): M(i, v) = min weight to get value exactly v, $O(nV)$.

**Example 1 (unbounded knapsack: rod cutting).** A rod of integer length n can be cut into pieces of integer lengths; a piece of length i sells for p[i]. Maximize revenue. Prices for lengths 1..8: p = (1, 5, 8, 9, 10, 17, 17, 20), n = 8.

~~~reveal Solution: rod cutting
1. **Spec.** For $0 \le \ell \le n$, Cut(ℓ) = the maximum revenue obtainable from a rod of length ℓ. Answer Cut(n).
2. **Recurrence.** Cut(0) = 0; for $\ell \ge 1$: $\text{Cut}(\ell) = \max_{1 \le i \le \ell}\big(p[i] + \text{Cut}(\ell - i)\big)$. The leftmost piece has some length i; the rest of the rod is an independent, smaller instance. (Making no cut is the case i = ℓ.)
3. **Memo.** Array Cut[0..n] (plus the best first piece for reconstruction).
4. **Order.** ℓ from 0 up to n.
5. **Time/space.** O(n) entries × O(n) = $O(n^2)$ time, O(n) space. (Here n is the rod's length *and* the number of prices, so this is genuinely polynomial in the input size.)

| ℓ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| Cut(ℓ) | 0 | 1 | 5 | 8 | 10 | 13 | 17 | 18 | **22** |
| best first piece | – | 1 | 2 | 3 | 2 | 2 | 6 | 1 | 2 |

Reconstruction: 8 → piece 2, leaving 6 → piece 6. Revenue 5 + 17 = 22. This is unbounded knapsack with weights = lengths, values = prices and capacity n (all of it used — leftover length could always be sold as length-1 pieces anyway).
~~~

**Example 2 (an extra dimension for a count).** 0/1 knapsack, but you may take **at most k items**. Give a DP and evaluate it for W = 10, items (5, 10), (4, 40), (6, 30), (3, 50), with k = 1 and k = 2.

~~~reveal Solution: knapsack with a cardinality limit
1. **Spec.** For $1 \le i \le n+1$, $0 \le j \le k$, $0 \le w \le W$: K(i, j, w) = the maximum value of a subset of items i..n with at most j items and total weight at most w. Answer K(1, k, W).
2. **Recurrence.** K(n+1, j, w) = 0. For $i \le n$:
$$K(i,j,w) = \max\begin{cases} K(i+1, j, w) & \text{(skip item i)}\\ v_i + K(i+1, j-1, w - w_i) & \text{(take it; only if } j \ge 1 \text{ and } w_i \le w)\end{cases}$$
Taking item i uses one unit of the item budget and $w_i$ units of capacity; the rest of the decisions face exactly the reduced budgets.
3. **Memo.** 3D array K[1..n+1][0..k][0..W].
4. **Order.** i from n + 1 down to 1 (layer i reads only layer i + 1); j and w in any order.
5. **Time/space.** $O(nkW)$ time (pseudo-polynomial because of W), $O(kW)$ space if we keep two layers.

**Example.** With k = 1 the best single item is (3, 50): value **50**. With k = 2 the best pair is (4, 40) + (3, 50): weight 7, value **90** (the unrestricted optimum, since any three items weigh at least 12 > 10).
~~~

## Every DP is a DAG

Make a vertex for every subproblem and an edge from each subproblem to the subproblems its recurrence reads. Because the recursion terminates, this **dependency graph is a DAG**, and a valid evaluation order is exactly a **reverse topological order** (sinks first). Conversely, many DPs *are* path problems in an explicit DAG:

> **Theorem.** In a DAG G = (V, E) with edge weights, the longest (or shortest) path from s to t can be computed in $O(V + E)$ time: LLP(t) = 0, and for $v \ne t$, $\text{LLP}(v) = \max\{\ell(v \to u) + \text{LLP}(u) : v \to u \in E\}$ (with $\max\emptyset = -\infty$), evaluated in reverse topological order.

Longest paths are NP-hard in general graphs, but easy in DAGs because there are no cycles to repeat. LIS is a longest path in the DAG with an edge $i \to j$ whenever $i < j$ and $A[i] < A[j]$; edit distance is a shortest path in the grid DAG whose diagonal edges cost 0 or 1 and horizontal/vertical edges cost 1. Counting paths works the same way with + instead of max.

## DP on trees

Trees are perfect for recursion: the subtree of each vertex is a smaller instance. Subproblems are indexed by **vertices**, and the evaluation order is a **postorder** traversal (children before parents).

### Maximum-weight independent set in a tree

An **independent set** contains no two adjacent vertices. Given a tree T with vertex weights $w(v) \ge 0$, find the maximum total weight of an independent set. (In general graphs this is NP-hard!) Root the tree anywhere.

**Formulation with two states.** For each vertex v:

- In(v) = maximum weight of an independent set in the subtree of v that **contains** v.
- Out(v) = maximum weight of an independent set in the subtree of v that **does not contain** v.

$$\text{In}(v) = w(v) + \sum_{c \text{ child of } v} \text{Out}(c), \qquad \text{Out}(v) = \sum_{c \text{ child of } v} \max\{\text{In}(c), \text{Out}(c)\}.$$

Leaves: In(v) = w(v), Out(v) = 0. Answer: $\max\{\text{In}(r), \text{Out}(r)\}$ for the root r. If v is in the set, no child may be; if v is not, each child's subtree is independent of the others and can be optimized separately.

**Memo / order / time.** Store two fields at each vertex (or two arrays indexed by vertex). Evaluate in postorder. Each vertex does work proportional to its number of children, and the children counts sum to n − 1, so the total time is **O(n)**.

(Equivalent one-state version: $\text{MIS}(v) = \max\{\sum_{c}\text{MIS}(c),\ w(v) + \sum_{g \text{ grandchild}}\text{MIS}(g)\}$, also O(n) because each vertex is a grandchild of at most one vertex.)

**Example.** Root a (weight 3) with children b (5) and c (2); b has children d (4), e (1); c has child f (6). Postorder: d: (In, Out) = (4, 0); e: (1, 0); f: (6, 0); b: (5 + 0 + 0, 4 + 1) = (5, 5); c: (2 + 0, 6) = (2, 6); a: (3 + 5 + 6, 5 + 6) = (14, 11). Answer 14, achieved by {a, d, e, f}.

> **Exam tip.** For a tree DP, say explicitly: (1) how the tree is rooted; (2) what each function means *for the subtree of v*; (3) "we store these values at each vertex and compute them in postorder"; (4) total time O(n) because $\sum_v \deg(v) = O(n)$.

### Minimum-weight vertex cover in a tree

A **vertex cover** contains at least one endpoint of every edge. With costs $c(v) > 0$: In(v) = cheapest cover of v's subtree containing v, Out(v) = cheapest one not containing v.
$$\text{In}(v) = c(v) + \sum_{u \text{ child}} \min\{\text{In}(u), \text{Out}(u)\}, \qquad \text{Out}(v) = \sum_{u \text{ child}} \text{In}(u).$$
If v is out, every edge from v to a child must be covered by the child. Answer $\min\{\text{In}(r), \text{Out}(r)\}$.

~~~steps Evaluating a tree DP in postorder (weighted vertex cover)
**The tree**, rooted at a: a has children b and c; b has children d and e; c has child f; f has child g. Costs: a = 3, b = 2, c = 4, d = 1, e = 1, f = 5, g = 2.

A postorder (children before parents): d, e, b, g, f, c, a. We write each vertex's pair (In, Out).
+++
**Leaves.** d: (1, 0). e: (1, 0). g: (2, 0). A leaf's subtree has no edges, so leaving it out costs 0.
+++
**b** (children d, e): In = 2 + min(1, 0) + min(1, 0) = 2. Out = In(d) + In(e) = 2. So b: (2, 2).

**f** (child g): In = 5 + min(2, 0) = 5. Out = In(g) = 2. So f: (5, 2).
+++
**c** (child f): In = 4 + min(5, 2) = 6. Out = In(f) = 5. So c: (6, 5).

**a** (children b, c): In = 3 + min(2, 2) + min(6, 5) = 10. Out = In(b) + In(c) = 2 + 6 = 8. So a: (10, 8).
+++
**Answer** min(10, 8) = **8**. Trace back from the root: Out(a) was chosen, which forces b and c **in**. At b (in), each child takes its cheaper state: d and e out. At c (in), f takes min(5, 2) → out; f out forces g in. Cover {b, c, g}, cost 2 + 4 + 2 = 8. Each edge (a-b, a-c, b-d, b-e, c-f, f-g) has an endpoint in the set. ✓

Total work: one pass over the vertices, O(#children) each — O(n).
~~~

### More states when needed

Two states (in/out) suffice when a vertex's constraint involves only its neighbours' membership. Some problems need more: **dominating set** needs three (in the set; out but dominated by a child; out and waiting for the parent), **maximum matching** needs "v is still free to match its parent" vs "anything", and **counting colorings** needs one value per color. The method never changes: list the facts about v that the parent needs to know, make one function per fact, and combine children by **sum** (for optimization over independent subtrees) or **product** (for counting).

**Example 3 (a tree DP with negative weights).** Each vertex of a tree has an integer weight (possibly negative). Find the maximum total weight of a **connected** set of vertices (a subtree in the graph sense, not necessarily containing the root). Run it on the tree above with weights a = −2, b = 3, c = −1, d = −4, e = 2, f = 4, g = −3.

~~~reveal Solution: maximum-weight connected subtree
Every connected set has a unique **highest** vertex v (closest to the root). Below v, the set contains, for each child u, either nothing from u's subtree or a connected set that contains u.

1. **Spec.** For each vertex v, Best(v) = the maximum weight of a connected set whose highest vertex is v (it contains v and lies inside v's subtree). Answer $\max_v \text{Best}(v)$.
2. **Recurrence.** $\text{Best}(v) = w(v) + \sum_{u \text{ child of } v} \max\{0,\ \text{Best}(u)\}$ — for each child, attach its best hanging piece only if it helps. Leaves: Best(v) = w(v).
3. **Memo.** One number stored at each vertex.
4. **Order.** Postorder.
5. **Time/space.** O(n) total.

**Example.** g: −3; f: 4 + max(0, −3) = 4; e: 2; d: −4; b: 3 + 0 + 2 = 5; c: −1 + 4 = 3; a: −2 + 5 + 3 = **6**. The best set {a, b, e, c, f} has weight −2 + 3 + 2 − 1 + 4 = 6. Notice the answer is a max over *all* vertices: with a = −5 instead, Best(a) = 3 and the optimum would be Best(b) = 5 ({b, e}).
~~~

## Interval DP

When a problem splits a sequence into two contiguous parts at a **last** (or first) operation, the subproblems are intervals (i, j). The recurrence tries every split point k between i and j: $O(n^2)$ intervals × O(n) splits = $O(n^3)$ time. Evaluate by increasing interval length (or i decreasing, j increasing).

### Matrix-chain multiplication

Multiplying a $p\times q$ matrix by a $q\times r$ matrix takes pqr scalar multiplications. Given a chain $A_1 A_2\cdots A_n$ where $A_i$ is $d_{i-1}\times d_i$, choose the parenthesization minimizing total cost. The **last** multiplication splits the chain into $(A_i\cdots A_k)(A_{k+1}\cdots A_j)$:

1. **Spec.** M(i, j) = the minimum number of scalar multiplications needed to compute $A_i\cdots A_j$. Answer M(1, n).
2. **Recurrence.** $M(i, i) = 0$; for $i < j$: $M(i, j) = \min_{i \le k < j}\big(M(i,k) + M(k+1, j) + d_{i-1}d_k d_j\big)$.
3. **Memo.** M[1..n][1..n].
4. **Order.** By increasing length $j - i$ (or i from n down to 1, j from i to n).
5. **Time/space.** $O(n^3)$ time, $O(n^2)$ space.

Example $d = (10, 30, 5, 60)$: $M(1,2) = 10\cdot30\cdot5 = 1500$, $M(2,3) = 30\cdot5\cdot60 = 9000$, and $M(1,3) = \min(0 + 9000 + 10\cdot30\cdot60,\ 1500 + 0 + 10\cdot5\cdot60) = \min(27000, 4500) = 4500$, i.e. $(A_1A_2)A_3$.

~~~steps Matrix chain by diagonals, then printing the parenthesization
**Instance.** $d = (5, 4, 6, 2, 7)$: $A_1$ is 5×4, $A_2$ is 4×6, $A_3$ is 6×2, $A_4$ is 2×7. We fill M(i, j) for chain lengths 1, 2, 3, 4 and record the best split S(i, j). Diagonal entries M(i, i) are 0.
+++
**Length 2** (one way each):
- M(1, 2) = 5·4·6 = 120.
- M(2, 3) = 4·6·2 = 48.
- M(3, 4) = 6·2·7 = 84.
+++
**Length 3:**
- M(1, 3) = min{ k=1: M(1,1) + M(2,3) + 5·4·2 = 0 + 48 + 40 = **88**; k=2: M(1,2) + M(3,3) + 5·6·2 = 120 + 0 + 60 = 180 } = 88, S(1, 3) = 1.
- M(2, 4) = min{ k=2: 0 + 84 + 4·6·7 = 252; k=3: 48 + 0 + 4·2·7 = **104** } = 104, S(2, 4) = 3.
+++
**Length 4:**
- k = 1: M(1,1) + M(2,4) + 5·4·7 = 0 + 104 + 140 = 244.
- k = 2: M(1,2) + M(3,4) + 5·6·7 = 120 + 84 + 210 = 414.
- k = 3: M(1,3) + M(4,4) + 5·2·7 = 88 + 0 + 70 = **158**.

So M(1, 4) = **158** with S(1, 4) = 3.

| M | j=1 | j=2 | j=3 | j=4 |
|---|---|---|---|---|
| i=1 | 0 | 120 | 88 | **158** |
| i=2 | | 0 | 48 | 104 |
| i=3 | | | 0 | 84 |
| i=4 | | | | 0 |
+++
**Printing.** Print(1, 4) splits at S(1, 4) = 3: ( Print(1, 3) Print(4, 4) ). Print(1, 3) splits at S(1, 3) = 1: ( $A_1$ Print(2, 3) ), and Print(2, 3) = ( $A_2 A_3$ ). Result: $((A_1(A_2A_3))A_4)$. Check: $A_2A_3$ costs 48 and gives a 4×2 matrix; $A_1$ times it costs 5·4·2 = 40 (5×2 result); times $A_4$ costs 5·2·7 = 70. Total 158 ✓.
~~~

### Optimal binary search trees

Keys $k_1 < \dots < k_n$ are searched with frequencies $f[1..n]$. The cost of a BST is $\sum_i f[i]\cdot\text{depth}(k_i)$, where the root has depth 1 (number of comparisons). Choose the BST of minimum cost. The **root** $k_r$ splits the keys into intervals $[i, r-1]$ and $[r+1, j]$, and putting both subtrees one level below the root adds the total frequency $F(i,j) = \sum_{k=i}^{j} f[k]$ once:

$$\text{Opt}(i, j) = \begin{cases} 0 & i > j\\ F(i,j) + \min_{i \le r \le j}\big(\text{Opt}(i, r-1) + \text{Opt}(r+1, j)\big) & i \le j\end{cases}$$

With prefix sums, F(i, j) is O(1), giving $O(n^3)$ time and $O(n^2)$ space. (Knuth showed the optimal roots are monotone, which yields $O(n^2)$, but you don't need that.)

**Example.** f = (4, 2, 6, 3):

| interval | Opt | best root |
|---|---|---|
| [1,1], [2,2], [3,3], [4,4] | 4, 2, 6, 3 | itself |
| [1,2], [2,3], [3,4] | 8, 10, 12 | 1, 3, 3 |
| [1,3], [2,4] | 20, 16 | 3, 3 |
| [1,4] | **26** | 3 |

Greedy "most frequent key at the root" is not optimal in general: for f = (3, 3, 4) greedy puts key 3 at the root for cost $4 + 2\cdot3 + 3\cdot 3 = 19$, but rooting at key 2 costs $3 + 2\cdot 3 + 2\cdot4 = 17$.

### Parenthesizing an expression for maximum value

Given $x_0 \;\text{op}_1\; x_1 \;\text{op}_2\;\cdots\;\text{op}_n\; x_n$ with each $\text{op}_k \in \{+, -\}$, insert parentheses to maximize the value. The last operation evaluated splits the expression into two intervals. But **maximizing** $a - b$ requires **minimizing** b — so we need both:

- Max(i, j), Min(i, j) = the largest / smallest value obtainable by parenthesizing $x_i\,\text{op}_{i+1}\cdots\text{op}_j\,x_j$.
- Base: Max(i, i) = Min(i, i) = $x_i$.
- For $i < j$, over all split points k ($i \le k < j$, splitting at $\text{op}_{k+1}$):
  - if $\text{op}_{k+1} = +$: candidates Max(i, k) + Max(k+1, j) for Max and Min(i, k) + Min(k+1, j) for Min;
  - if $\text{op}_{k+1} = -$: candidates Max(i, k) − Min(k+1, j) for Max and Min(i, k) − Max(k+1, j) for Min.

$O(n^2)$ intervals, O(n) splits: $O(n^3)$. Example: $1 - 2 + 3 - 4 + 5$ evaluates to 3 left to right, but $1 - (2 + (3 - (4 + 5))) = 5$ is the maximum. With multiplication allowed (and negative numbers possible), take the max/min over all four combinations of $\{\text{Max}, \text{Min}\}\times\{\text{Max}, \text{Min}\}$ of the two sides.

### First or last? Choosing the splitting decision

An interval DP works when, after fixing one decision, the left part and the right part become **independent** problems. Choose the decision that makes this true:

| Problem | Decision that splits the interval | Why |
|---|---|---|
| Matrix chain, expressions | the **last** operation performed | everything before it happens inside one side |
| Optimal BST | the **root** | left and right subtrees hold disjoint key ranges |
| Cutting a stick, merging piles | the **first** cut / the **last** merge | pieces never interact again |
| Burst balloons | the **last** balloon to burst in (i, j) | while it survives, it shields the two sides from each other |
| Polygon triangulation | the apex k of the triangle on edge $v_iv_j$ | the triangle separates two smaller polygons |

Choosing the *first* balloon to burst, for example, fails: its neighbours become adjacent and the two sides interact. If your two "independent" sides actually depend on each other, try the opposite end of time.

**Example 4 (counting with an interval DP).** In how many ways can a product $x_1 x_2 \cdots x_n$ of n factors be fully parenthesized? Give a DP and compute the answer for n = 5.

~~~reveal Solution: counting parenthesizations
1. **Spec.** For $1 \le i \le j \le n$, P(i, j) = the number of full parenthesizations of $x_i \cdots x_j$. Answer P(1, n).
2. **Recurrence.** P(i, i) = 1; for $i < j$: $P(i,j) = \sum_{k=i}^{j-1} P(i,k)\cdot P(k+1,j)$. Parenthesizations are partitioned by the position k of the last multiplication (**sum**), and for a fixed k the two sides are chosen independently (**product**).
3. **Memo.** P[1..n][1..n].
4. **Order.** By increasing length j − i.
5. **Time/space.** $O(n^3)$ time, $O(n^2)$ space. (P depends only on the length, so a 1D table $C_\ell$ for lengths ℓ = 1..n gives $O(n^2)$.)

**Values** by length 1..5: 1, 1, 2, 5, **14** — the Catalan numbers $C_{n-1}$. This number grows like $4^n / n^{3/2}$, which is why brute-force enumeration of parenthesizations (for matrix chains, optimal BSTs, expression values) is hopeless and interval DP is essential.
~~~

## Grid and two-sequence DPs

A grid DP is a DAG whose vertices are cells (i, j) and whose edges go right/down (or similar). Example: a robot moves from the top-left to the bottom-right of an $m\times n$ grid, only right or down, collecting coins $c[i][j]$, avoiding blocked cells.

$$\text{Best}(i, j) = \begin{cases} -\infty & (i,j) \text{ blocked or outside the grid}\\ c[i][j] & (i,j) = (m, n)\\ c[i][j] + \max\{\text{Best}(i+1, j), \text{Best}(i, j+1)\} & \text{otherwise}\end{cases}$$

Answer Best(1, 1); fill i from m down to 1 and j from n down to 1: $O(mn)$. Counting paths: replace max by +, $-\infty$ by 0, and coins by nothing. Edit distance, LCS and shuffles are grid DPs over pairs of prefixes/suffixes.

Grid problems often need an **extra state**: the direction of the last move (to count or limit turns), the number of turns or obstacles removed so far, or the number of coins carried. The table becomes (i, j, state) and the time picks up the number of states.

**Example 5 (a grid DP that isn't a path).** Given an $m \times n$ 0/1 matrix, find the side length of the largest all-1 square submatrix. Example:

~~~pseudo
1 0 1 1 1
1 1 1 1 1
0 1 1 1 1
1 1 1 1 0
~~~

~~~reveal Solution: largest square of 1s
Anchor the square at its **bottom-right corner**.
1. **Spec.** For $1 \le i \le m$, $1 \le j \le n$: Sq(i, j) = the side length of the largest all-1 square whose bottom-right cell is (i, j) (0 if M[i][j] = 0). Answer $\max_{i,j} \text{Sq}(i,j)$.
2. **Recurrence.**
$$\text{Sq}(i,j) = \begin{cases} 0 & M[i][j] = 0\\ 1 & M[i][j] = 1 \text{ and } (i = 1 \text{ or } j = 1)\\ 1 + \min\{\text{Sq}(i-1,j),\ \text{Sq}(i,j-1),\ \text{Sq}(i-1,j-1)\} & \text{otherwise}\end{cases}$$
*Justification.* An s×s all-1 square ends at (i, j) iff M[i][j] = 1 and (s − 1)×(s − 1) all-1 squares end at the cell above, the cell to the left, and the cell diagonally up-left — those three smaller squares together with (i, j) cover exactly the s×s square. So the largest s is one more than the smallest of the three neighbours' values.
3. **Memo.** Sq[1..m][1..n].
4. **Order.** Row-major (i increasing, j increasing).
5. **Time/space.** $O(mn)$ time; $O(n)$ space with two rows.

**Example.** The Sq table, row by row, is 1 0 1 1 1 / 1 1 1 2 2 / 0 1 2 2 3 / 1 1 2 3 0; the maximum is **3** (for instance rows 2–4, columns 2–4). The tempting recurrence "1 + min of left and up" is wrong: it ignores the diagonal cell, which might be 0.
~~~

## Games: two players, one DP

In a two-player game with perfect information, the value of a position is determined by the values of the positions you can move to — a recursion on positions. If the positions are few (an interval of a row, a number of remaining stones), memoize it.

- **Win/lose games.** Win(p) = True iff some move leads to a position q with Win(q) = False (the opponent, now to move, loses). A position with no moves is lost (under "the player who cannot move loses").
- **Score games.** With both players maximizing their own total in a zero-sum setting, let Diff(p) = (mover's future total) − (opponent's future total) under optimal play. Then $\text{Diff}(p) = \max_{\text{moves } p \to q} \big(\text{gain} - \text{Diff}(q)\big)$: after my move the roles swap, so the opponent's advantage is subtracted.

The classic exam instance is a row of coins $v_1..v_n$ where each player takes a coin from either end: Diff(i, j) = $\max\{v_i - \text{Diff}(i+1, j),\ v_j - \text{Diff}(i, j-1)\}$, an interval DP. Greedy ("take the bigger end") fails on [8, 15, 3, 7]: if both players play greedily, the first player takes 8 and ends with 15 points against 18, while the optimal first move (7) guarantees 22.

**Example 6 (a win/lose game).** A pile has n stones; players alternate removing 1, 2 or 3 stones; whoever takes the last stone wins. For which n does the first player win? What changes if the allowed moves are {1, 3, 4}?

~~~reveal Solution: game DP on the pile size
1. **Spec.** For $0 \le s \le n$, Win(s) = True iff the player about to move with s stones left can force a win. Answer Win(n).
2. **Recurrence.** Win(0) = False (the previous player took the last stone, so the mover has already lost). For $s \ge 1$: $\text{Win}(s) = \bigvee_{t \in \{1,2,3\},\ t \le s} \neg\text{Win}(s - t)$ — I win iff some move leaves my opponent in a losing position.
3. **Memo.** Boolean array Win[0..n].
4. **Order.** s from 0 up to n.
5. **Time.** O(n) (O(n · #moves) in general). Note that n is a *number*: O(n) is pseudo-polynomial in the bit length of n — fine here, and often the table reveals a pattern with an O(1) formula.

**Values** for s = 0..12: L W W W L W W W L W W W L. The losing positions are exactly the multiples of 4 (from 4k stones, any move to 4k − t can be answered by taking 4 − t). With moves {1, 3, 4}, the table for s = 0..14 is L W L W W W W L W L W W W W L: the losing positions are those with s mod 7 ∈ {0, 2}.
~~~

## Scheduling: sort first, then DP

Scheduling problems usually become sequence DPs **after sorting** by a well-chosen key, justified by an exchange argument:

- **Weighted interval scheduling.** Sort by finish time; then the intervals compatible with interval j and earlier in the order form a *prefix* 1..p(j), giving $\text{OPT}(j) = \max\{\text{OPT}(j-1),\ w_j + \text{OPT}(p(j))\}$.
- **Jobs with deadlines** (processing time $p_i$, deadline $d_i$, profit $g_i$, one machine). Any set of jobs that can all meet their deadlines can also do so when run in order of deadline (swapping an adjacent out-of-order pair never hurts). So sort by deadline and decide each job in that order, remembering only the current time t: a knapsack-like table Best(i, t), $O(nD)$ for maximum deadline D — pseudo-polynomial.

## Graph DPs with a budget dimension

Shortest paths in a DAG are a DP over vertices. In a graph with cycles, the natural subproblem "cheapest path from s to v" is not well-founded (it can depend on itself). Adding a **budget** fixes this: D(i, v) = cheapest walk from s to v using **at most i edges**.
$$D(0, s) = 0,\quad D(0, v) = \infty\ (v \ne s), \qquad D(i, v) = \min\Big\{D(i-1, v),\ \min_{u \to v} \big(D(i-1, u) + w(u \to v)\big)\Big\}.$$
Layer i depends only on layer i − 1, so the order is i increasing; each layer costs O(V + E), for $O(k(V+E))$ total. With k = V − 1 and no negative cycles this is exactly **Bellman–Ford**. The same idea answers "cheapest flight with at most k legs", "longest path with exactly k edges in a DAG", or "number of walks of length k".

## Saving space

If row i of the table depends only on row i+1 (or i−1), keep **two rows**: $O(n)$ instead of $O(mn)$ space for edit distance, LCS or knapsack values. Fibonacci needs two numbers; LIS needs the whole O(n) array. But the traceback needs the full table — unless you use **Hirschberg's divide-and-conquer trick**: compute the middle row's optimal crossing point with two linear-space passes (forward on the first half, backward on the second), then recurse on the two halves. It reconstructs an optimal alignment in $O(mn)$ time and $O(m + n)$ space.

## Reconstructing solutions

The DP gives the optimal **value**. To recover an optimal **object**:

1. Either store, with each entry, the **choice** that achieved the optimum (the split point k, the next index j, take/skip), or recompute it from the table.
2. Start from the answer entry and follow the choices until a base case.

The extra time is usually proportional to the length of the reconstructed solution. In matrix chains, store the best split S(i, j) and print recursively: Print(i, j) = "(" Print(i, S) Print(S+1, j) ")".

## Designing hard DPs on exams

1. **Solve a small example by hand** and observe what the "first" or "last" decision is.
2. **Write the backtracking recursion** — what must the recursive call know? Add a parameter for exactly that.
3. **English spec first**, including index ranges and what is maximized/minimized.
4. **Base cases** for every boundary: empty prefix, $i > j$, leaves, capacity 0, impossible states ($\pm\infty$).
5. **Order + time.** Check that every entry reads only already-computed entries; compute #entries × work per entry.
6. **Sanity check** the recurrence on your small example.

| Problem | Subproblem | Time |
|---|---|---|
| 0/1 knapsack | K(i, w) | $O(nW)$ pseudo-poly |
| Weighted interval scheduling | OPT(j), first j intervals by finish time | $O(n\log n)$ |
| MIS / vertex cover in a tree | In(v), Out(v) | $O(n)$ |
| Longest path in a DAG | LLP(v) | $O(V+E)$ |
| Matrix chain | M(i, j) | $O(n^3)$ |
| Optimal BST | Opt(i, j) | $O(n^3)$ |
| Max-value parenthesization | Max(i, j), Min(i, j) | $O(n^3)$ |
| Grid path | Best(i, j) | $O(mn)$ |
| Coins-in-a-row game | Diff(i, j) | $O(n^2)$ |
| Walks with at most k edges | D(i, v) | $O(k(V+E))$ |
| Jobs with deadlines | Best(i, t), jobs sorted by deadline | $O(nD)$ pseudo-poly |

## How to find the right subproblem (beyond sequences)

The question is the same as in DP I — *after the first decision, what is left, and what does the rest need to know?* — but the "pieces of input" are richer.

| Input / structure | Natural subproblem | What to add if the rest needs more |
|---|---|---|
| a set of items with a budget | (next item i, remaining budget w) | more budgets (volume, item count): more parameters |
| a rooted tree | the subtree of v | the **status of v** that the parent cares about: in/out, matched/free, dominated/waiting, its color |
| a sequence that is split, merged or parenthesized | an interval (i, j) | which operation happens last/first or which element is the root |
| a grid | a cell (i, j) | the direction of the last move, turns used, obstacles removed |
| a DAG | a vertex v | usually nothing; maybe a parity or a count |
| a graph with cycles | (budget i, vertex v) | the budget is what makes the recursion terminate |
| a two-player game | the current position (a remaining interval, a pile size) | whose turn it is, if the payoffs are not symmetric |
| jobs or intervals | a prefix after **sorting** | the current time or the last compatible job |

**Rooting and the parent's view.** For trees, write down what the parent of v needs to know about v's subtree to make *its* decision. That list of facts is the list of states. For independent set it is "is v in the set?"; for dominating set it is "is v in, or already dominated, or still waiting?"; for matching it is "is v still free?".

**Independence test for intervals.** After fixing your splitting decision, try to describe the left and right sides without mentioning each other. If you can't (the balloon example), pick a different decision — usually the one that happens last.

**Is the state space polynomial?** Count the parameter combinations: vertices × 2 flags is fine; intervals × k is fine; an item index × a capacity W is pseudo-polynomial and must be labeled as such; a subset of vertices (as in the TSP DP over subsets, $2^n n$ states) is exponential — legitimate as an exponential algorithm, but never "efficient".

## Common exam problem patterns

| If the problem says... | Recipe |
|---|---|
| choose items subject to a capacity / budget / count | K(i, budgets...): skip or take item i; base 0 (or $-\infty$ for "exactly"); time = n × product of budget ranges; **pseudo-polynomial** if a budget is a number |
| a rooted tree (or "hierarchy", "company", "network with no cycles") | one function per status of v, defined on v's subtree; combine children with sum / min / product; postorder; O(n) × (states)² at most |
| insert parentheses, merge adjacent things, cut at given points, build a BST, triangulate | interval (i, j); try every split k; prefix sums for interval totals; by increasing length; $O(n^3)$ |
| two players alternately take from the ends | Diff(i, j) = max over the two ends of (coin − Diff of the rest); first player's total = (sum + Diff(1, n)) / 2 |
| a robot on a grid, possibly with obstacles or limited turns | (i, j[, direction, budget]); blocked = $-\infty$ / 0; order by i + j |
| a DAG | process vertices in reverse topological order; longest / shortest / count paths in O(V + E) |
| at most k edges / flights / hops in a general graph | layers D(i, v); O(k(V + E)); Bellman–Ford when k = V − 1 |
| intervals or jobs with weights, deadlines | sort (finish time / deadline) with an exchange argument, then a prefix DP |

## Where students lose points

- **Tree DPs without rooting or without "in the subtree of v"** in the spec. "In(v) = max independent set containing v" is ambiguous — of which graph?
- **Too few states.** Two states for dominating set (in / out) cannot express "out but already dominated by a child", so the recurrence is wrong. List the facts the parent needs.
- **Max over children instead of sum.** Children's subtrees are disjoint and independent: optimize each and **add**.
- **Interval DPs filled in the wrong order** (i increasing reads M(k+1, j) before it is computed), or a split decision whose sides are not independent.
- **Infeasible states**: forgetting $-\infty$ for "exactly W", or initializing a min with 0.
- **Counting base cases**: an empty object counts as 1, not 0; combine independent parts by product, disjoint cases by sum.
- **Running time**: forgetting the O(n) loop over split points (interval DP is $O(n^3)$, not $O(n^2)$), or over-counting a tree DP as $O(n^2)$ (the sum of the children counts is n − 1).
- **Pseudo-polynomial not stated** for knapsack, deadline scheduling, subset-sum-like tables.
- **DP on graphs with cycles** with a recurrence like D(v) = min over u → v of D(u) + w(u → v) and no budget: the dependency graph has cycles, so there is no evaluation order.
- **Greedy shortcuts** without proof: ratio-greedy knapsack, most-frequent-key-at-root BSTs, merging the two smallest adjacent piles, taking the bigger end in the coins game — all fail.

## Self-check

1. Knapsack runs in $O(nW)$ time and rod cutting in $O(n^2)$. Why is the first only pseudo-polynomial while the second is polynomial?

~~~reveal Answer
In knapsack, W is a single number in the input, written with about $\lg W$ bits, so W can be exponential in the input length. In rod cutting the input contains n prices, so n is (at least) the number of input items: $O(n^2)$ is polynomial in the input size.
~~~

2. In the tree independent-set DP, why is Out(v) a **sum** over children rather than a max?

~~~reveal Answer
An independent set in v's subtree that avoids v is the union of independent sets in the children's subtrees, and those subtrees are disjoint with no edges between them. Every child's part can be optimized independently and they all count, so the best total is the sum of the best parts.
~~~

3. M(i, j) reads M(i, k) and M(k+1, j) for $i \le k < j$. Is "i from 1 to n, and for each i, j from i to n" a valid order? Give a valid one.

~~~reveal Answer
No: M(1, j) needs M(2, j), M(3, j), …, which are in later rows. Valid orders: increasing length $j - i$; or i from n down to 1 with j from i up to n (then rows below i are complete and M(i, k) for k < j was just computed).
~~~

4. In unbounded knapsack implemented with one array U[0..W], what happens if the inner loop over w runs from W down to $w_i$ instead of up from $w_i$?

~~~reveal Answer
Running w downward reads U[w − w_i] **before** it has been updated for item i, so item i is used at most once: that is the 0/1 knapsack. Running w upward reads values that may already include item i, allowing repeats: the unbounded knapsack.
~~~

5. Why does the coins-in-a-row DP Diff(i, j) = max{v_i − Diff(i+1, j), v_j − Diff(i, j−1)} have a **minus** sign?

~~~reveal Answer
After I take a coin, my opponent moves on the remaining row and gets an advantage of Diff of that row *over me*. My advantage is the coin I took minus their advantage. The roles of "mover" and "opponent" swap at every move; the minus sign implements that swap.
~~~

6. A student writes D(v) = min over edges u → v of D(u) + w(u → v), D(s) = 0, for shortest paths in a directed graph with cycles, and memoizes it. What goes wrong, and how does a budget parameter fix it?

~~~reveal Answer
The recursion can call itself in a cycle (D(v) needs D(u), which needs D(v)), so there is no valid evaluation order and memoized recursion never finishes. With D(i, v) = cheapest walk using at most i edges, every call decreases i, so the dependency graph is a DAG (layers); i up to V − 1 suffices without negative cycles — Bellman–Ford.
~~~

7. A dominating-set DP uses only In(v) and Out(v). Find the flaw.

~~~reveal Answer
"Out" mixes two different situations: v is already dominated by one of its children, or v still needs its parent to be in the set. The parent's decision depends on which one holds, so the recurrence cannot be written correctly. Split Out into "dominated by a child" and "waiting for the parent" (three states in total).
~~~

## Midterm 2 exam patterns

The Midterm 2 DP question almost always takes one of four shapes. Once you recognize the shape, you know the subproblem, the evaluation order and roughly the running time before writing a single recurrence. Then the points come from precision: a spec that says exactly what is optimized over, base cases for every boundary, the answer read from the right entry, and an honest running time.

| Shape | Signals in the statement | Subproblem | Combine | Order | Typical time |
|---|---|---|---|---|---|
| Tree | "hierarchy", "company", "prerequisite", "rooted tree", "network without cycles" | f(v, status of v) on **the subtree of v** | sum (optimize), product (count), knapsack merge (shared budget) | postorder | O(n) × #states; $O(nB^2)$ with a budget |
| Interval | "parenthesize", "merge adjacent", "remove and the neighbours close up", "matching brackets", "palindrome" | f(i, j) on s[i..j] | min/max over a split point or a **partner** k | i decreasing, j increasing (or by length) | $O(n^3)$; $O(n^2)$ if O(1) choices |
| Knapsack-like | "budget", "capacity", "at most W", "hours", "total cost at most" | f(i, remaining budget) | skip/take, or "how much budget item i gets" | i decreasing | $O(nW)$ or $O(nW^2)$, usually pseudo-polynomial |
| Extra state | "no two consecutive", "different from the previous", "at most k turns", "one coupon", "two robots" | the base index plus the small fact the future needs | max/min over choices consistent with the state | as for the base index | base × #states × work |

### Choosing the subproblem

1. **Write the brute-force decision sequence.** "For each item: take or skip." "For each vertex: in or out." "Which later symbol is s[i] matched with?" "Which merge happens last?"
2. **Ask what the remaining decisions need to know.** That list *is* the parameter list: items left and budget left; a subtree and the status of its root; an interval and nothing else; a position and the previous color / turns left / whether the coupon is used.
3. **Count states × work before committing.** If a parameter is a subset or a whole path, the table is exponential: you remembered too much. Find a smaller summary (a count, a last element, a flag).
4. **Check independence.** After fixing your decision, the pieces you recurse on must not interact: different children's subtrees, the inside and the outside of a matched pair, the two sides of the last balloon. If they interact, move the decision (first ↔ last) or add a state.
5. **Decide where the answer lives** and write it down: the root entry? the best of several root states? the maximum over all entries? the largest v with $M(1, v) \le W$?

### Point-losing mistakes (Midterm 2 edition)

- **Pseudo-polynomial confusion.** $O(nW)$ is pseudo-polynomial when W is a binary number. But $O(nH^2)$ for a problem whose input *lists* H + 1 scores per exam is polynomial, because the input itself has size about nH. Say which case you are in and why.
- **Answer read from the wrong entry.** In(r) instead of max{In(r), Out(r)}; Best(r) when the optimal connected set need not contain the root; K(1, W) for exact-capacity knapsack without handling $-\infty$.
- **Tree specs without "in the subtree of v"**, or without saying how the tree is rooted (for an unrooted tree, root it at any vertex and say so).
- **Interval tables in the wrong order.** "for i = 1 to n, for j = i to n" reads row i + 1 before it exists. Check every dependency against your loops.
- **Counting only the subproblems.** A loop over a split point k makes interval DPs $O(n^3)$; a knapsack merge costs $O(B^2)$ per tree edge; painting with k colors is $O(nk^2)$ unless you use the best/second-best trick.
- **Greedy without proof.** Ratio-greedy knapsack, marginal-gain greedy for non-concave tables, cheapest-color painting, largest-subtree-first broadcasting, and "best path twice" for two robots all fail. A greedy step is allowed *inside* a DP only with an exchange argument (e.g. sorting children by their finishing times).
- **Missing infeasible values.** Best(v, b) = $-\infty$ when c(v) > b; M(i, v) = $\infty$ when a value is unreachable; a max that starts at 0 silently allows "choose nothing".

### Try it first

**Example 1 (counting on a tree).** Count the independent sets (including the empty set) of the tree rooted at a, where a has children b and c, b has children d and e, and c has child f. Give the DP in general, then run it.

~~~~reveal Solution: counting independent sets in a tree
1. **Spec.** Root the tree at r. For each vertex v: In(v) = the number of independent sets of v's subtree that contain v; Out(v) = the number that do not contain v. Answer In(r) + Out(r).
2. **Recurrence.** $\text{In}(v) = \prod_{c} \text{Out}(c)$ and $\text{Out}(v) = \prod_{c} \big(\text{In}(c) + \text{Out}(c)\big)$, products over the children c of v. If v is in the set, no child may be; if v is out, each child's subtree is unconstrained. Choices in different subtrees are independent, so counts **multiply**. Leaves: In = 1 (the set {v}) and Out = 1 (the empty set) — empty products are 1, not 0.
3. **Memo.** Two numbers stored at each vertex.
4. **Order.** Postorder.
5. **Time.** O(1 + #children) arithmetic operations per vertex: O(n) in total.

~~~steps Filling the counts in postorder
**Leaves** d, e, f: (In, Out) = (1, 1).
+++
**b** (children d, e): In = Out(d) · Out(e) = 1 and Out = (1 + 1)(1 + 1) = 4. Indeed the sets avoiding b are ∅, {d}, {e}, {d, e}, and only {b} contains b.

**c** (child f): In = Out(f) = 1 and Out = 1 + 1 = 2.
+++
**a**: In = Out(b) · Out(c) = 4 · 2 = 8 and Out = (1 + 4)(1 + 2) = 15. Answer 8 + 15 = **23**.

Sanity check: a set containing a cannot contain b or c, so it is {a} plus any subset of {d, e, f}: $2^3 = 8$ sets, matching In(a).
~~~
~~~~

**Example 2 (an interval DP with only O(1) choices).** You may insert any letter (inserting x costs ins(x)) or delete any letter (deleting x costs del(x)). Find the cheapest way to turn s = abcab into a palindrome, where ins(a) = 3, ins(b) = 2, ins(c) = 4 and del(a) = 1, del(b) = 5, del(c) = 4.

~~~~reveal Solution: cheapest palindrome
Let $f(x) = \min\{\text{ins}(x), \text{del}(x)\}$: an end letter that has no partner is either deleted or mirrored by inserting a copy of it at the other end.

1. **Spec.** For $1 \le i, j \le n$: C(i, j) = the minimum cost of turning s[i..j] into a palindrome (C(i, j) = 0 when $i \ge j$). Answer C(1, n).
2. **Recurrence.** For i < j:
$$C(i,j) = \min\begin{cases} C(i+1, j-1) & \text{if } s_i = s_j\\ f(s_i) + C(i+1, j) & \text{(handle } s_i \text{ alone)}\\ f(s_j) + C(i, j-1) & \text{(handle } s_j \text{ alone)}\end{cases}$$
*Why these cases suffice.* Look at the final palindrome. If $s_i$ and $s_j$ both survive and are both mirrored by original letters, they must be mirror partners of each other (the mirror of the leftmost surviving original letter is the rightmost one), which requires $s_i = s_j$. Otherwise one end letter is deleted or matched with an inserted copy, which costs at least f of that letter, and the rest of the work makes the remaining interval a palindrome.
3. **Memo.** C[1..n][1..n].
4. **Order.** i from n down to 1, j from i + 1 up to n (or by increasing length).
5. **Time/space.** Each entry has **three** choices, not O(n): $O(n^2)$ time and space. Always count the work per entry instead of assuming "interval DP = $O(n^3)$".

~~~steps Filling the table for abcab (f(a) = 1, f(b) = 2, f(c) = 4)
**Length 2.** C(1, 2) = ab: min(f(a), f(b)) = 1. C(2, 3) = bc: min(2, 4) = 2. C(3, 4) = ca: min(4, 1) = 1. C(4, 5) = ab: 1.
+++
**Length 3.**
- C(1, 3) = abc: min(f(a) + C(2, 3), f(c) + C(1, 2)) = min(3, 5) = 3.
- C(2, 4) = bca: min(f(b) + C(3, 4), f(a) + C(2, 3)) = min(3, 3) = 3.
- C(3, 5) = cab: min(f(c) + C(4, 5), f(b) + C(3, 4)) = min(5, 3) = 3.
+++
**Length 4.**
- C(1, 4) = abca: the ends match, so C(2, 3) = 2 is a candidate; the others give 1 + 3 = 4. Value **2**.
- C(2, 5) = bcab: the ends match: C(3, 4) = 1; the others give 2 + 3 = 5. Value **1**.
+++
**Length 5.** C(1, 5) = abcab: the ends differ: min(f(a) + C(2, 5), f(b) + C(1, 4)) = min(1 + 1, 2 + 2) = **2**.

| i \ j | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 | 0 | 1 | 3 | 2 | **2** |
| 2 | | 0 | 2 | 3 | 1 |
| 3 | | | 0 | 1 | 3 |
| 4 | | | | 0 | 1 |
| 5 | | | | | 0 |

**Traceback.** Delete the first a (cost 1), leaving bcab; its ends match; inside, ca is fixed by deleting the a (cost 1). Result: bcb, total cost **2**.
~~~
~~~~

**Example 3 (an extra state for a one-time exemption).** A 0/1 knapsack with capacity W, but you may carry **one** item in your hands, and its weight does not count. Give a DP, then evaluate it for W = 10 and items (weight, value) = (5, 10), (4, 40), (6, 30), (3, 50). Is "carry the heaviest item" a correct shortcut?

~~~reveal Solution: knapsack with a free hand
1. **Spec.** For $1 \le i \le n+1$, $0 \le w \le W$ and $h \in \{0, 1\}$: K(i, w, h) = the maximum value obtainable from items i..n with remaining capacity w, where h = 1 means the hands are still free. Answer K(1, W, 1).
2. **Recurrence.** K(n+1, w, h) = 0. For $i \le n$, K(i, w, h) is the maximum of
   - K(i+1, w, h) (skip item i);
   - $v_i + K(i+1, w - w_i, h)$ if $w_i \le w$ (item i goes in the bag);
   - $v_i + K(i+1, w, 0)$ if h = 1 (item i is carried; the hands are no longer free).
3. **Memo.** Array K[1..n+1][0..W][0..1].
4. **Order.** i from n + 1 down to 1; w and h in any order.
5. **Time/space.** 2(n + 1)(W + 1) entries, O(1) each: $O(nW)$ — the flag only doubles the table. Still pseudo-polynomial.

**Example.** Without the hands the optimum is 90. With them it is **120**, for instance carrying (6, 30) and packing (4, 40) and (3, 50) (weight 7). All four items are impossible: the three bagged items would weigh at least 12.

**The shortcut is wrong.** With W = 4 and items (5, 1), (4, 10), (4, 10), carrying the heaviest item gives 1 + 10 = 11, while carrying one (4, 10) and packing the other gives 20. Which item deserves the hands depends on everything else, so the DP must try every option. The same one-bit pattern handles "one free skip", "one coupon" and "break at most one wall"; use a counter instead of a bit when k exemptions are allowed.
~~~
`,
  cheatsheet: String.raw`## Five-part answer template
~~~pseudo
1. Spec:   For <ranges>, F(<params>) = <best/count/whether> of <subproblem in words>
           (tree: "...in the subtree of v, given that v is <status>").  Answer = F(<start>).
2. Rec:    base cases (empty, leaves, i > j, budget 0, infeasible = -inf/+inf)
           + max/min/sum over the first/last/splitting decision, one line of justification each.
3. Memo:   F[..][..]  (or fields stored at each tree vertex)
4. Order:  reverse topological order of the dependencies: i decreasing / by length / postorder
5. Time:   #entries x work per entry (count split points, children);  space.  Pseudo-poly?
~~~

## Classic DPs
| Problem | Subproblem | Recurrence | Time |
|---|---|---|---|
| 0/1 knapsack | K(i, w) | $\max\{K(i{+}1,w),\ v_i + K(i{+}1,w-w_i)\}$; $K(n{+}1,\cdot)=0$ | $O(nW)$ pseudo |
| Unbounded knapsack / rod cutting | U(w) | $\max\{0, \max_{w_i \le w} v_i + U(w - w_i)\}$ | $O(nW)$ |
| Exact capacity | K(i, w) | same; base $K(n{+}1,0)=0$, $K(n{+}1,w>0)=-\infty$ | $O(nW)$ |
| ≤ k items / 2nd resource | K(i, j, w) / K(i, w, u) | extra budget decreases when taking | $O(nkW)$ / $O(nWV)$ |
| Tree MIS | In(v), Out(v) | $w(v) + \sum Out(c)$; $\sum \max(In(c), Out(c))$ | $O(n)$ |
| Tree vertex cover | In(v), Out(v) | $c(v) + \sum \min(In(c), Out(c))$; $\sum In(c)$ | $O(n)$ |
| Tree max matching | Free(v), Best(v) | $Free = \sum Best(c)$; $Best = \max(Free, \max_c\, w_{vc} + Free(c) + Free(v) - Best(c))$ | $O(n)$ |
| Tree dominating set | A, B, C (in / dominated by child / waiting) | see problem; answer $\min(A(r), B(r))$ | $O(n)$ |
| Tree diameter | Down(v) | $\max_c (\ell_{vc} + Down(c))$; diameter = max over v of top two | $O(n)$ |
| Tree list-colorings | C(v, c) | $[c \in L(v)] \prod_u (S(u) - C(u,c))$ | $O(nk)$ |
| Matrix chain | M(i, j) | $\min_k M(i,k) + M(k{+}1,j) + d_{i-1}d_kd_j$ | $O(n^3)$ |
| Optimal BST | Opt(i, j) | $F(i,j) + \min_r Opt(i,r{-}1) + Opt(r{+}1,j)$ | $O(n^3)$ |
| Merge adjacent piles | M(i, j) | $S(i,j) + \min_k M(i,k) + M(k{+}1,j)$ | $O(n^3)$ |
| Burst balloons | B(i, j) open interval | $\max_{i<k<j} B(i,k) + B(k,j) + a_ia_ka_j$ (k burst **last**) | $O(n^3)$ |
| Polygon triangulation | T(i, j) | $\min_{i<k<j} T(i,k) + T(k,j) + w(i,k,j)$ | $O(n^3)$ |
| Boolean parenthesization | T(i, j), F(i, j) | sum over split of products of side counts | $O(n^3)$ |
| Coins-in-a-row game | Diff(i, j) | $\max\{v_i - D(i{+}1,j),\ v_j - D(i,j{-}1)\}$ | $O(n^2)$ |
| Grid with turns | P(i, j, t, dir) | continue: same t; turn: t − 1 | $O(mnk)$ |
| Largest square of 1s | Sq(i, j) bottom-right | $1 + \min$(up, left, diag) | $O(mn)$ |
| Weighted intervals | OPT(j) by finish time | $\max\{OPT(j{-}1),\ w_j + OPT(p(j))\}$ | $O(n\log n)$ |
| Deadlines | Best(i, t), sorted by deadline | skip, or take if $t + p_i \le d_i$ | $O(nD)$ pseudo |
| ≤ k edges in a graph | D(i, v) | $\min\{D(i{-}1,v), \min_{u\to v} D(i{-}1,u) + w\}$ | $O(k(V+E))$ |
| Longest path in a DAG | LLP(v) | $\max_{v \to u} \ell + LLP(u)$, reverse topo order | $O(V+E)$ |

## Trees (root it; postorder; O(n))
- One function per fact the parent needs about v. Combine children: **sum** (optimize), **product** (count).
- Time: $\sum_v (1 + \#children) = O(n)$.

## Interval DP ($O(n^3)$, fill by length)
- Split on the decision that makes the two sides **independent**: last multiplication, root, first cut, **last** balloon.
- Max of expressions with −: track Max **and** Min ($\max(a-b) = \text{Max}_L - \text{Min}_R$); with ×, try all four corner combinations.
- Cutting a stick: $C(i,j) = (c_j - c_i) + \min_{i<k<j}(C(i,k)+C(k,j))$.
- Number of parenthesizations of n factors: Catalan $C_{n-1}$ (1, 1, 2, 5, 14, …).

## Games
- Win(p) = OR over moves of NOT Win(q). Score games: Diff = max(gain − Diff(next)). First player total = (S + Diff)/2.
- Take 1–3 stones: lose iff n ≡ 0 (mod 4).

## DAGs & graphs
- DP dependency graph is a DAG; evaluation order = reverse topological order.
- Graph with cycles: add a budget (edges used) → layers → Bellman–Ford.

## Space & reconstruction
- Row depends on previous row only → keep 2 rows. 0/1 knapsack in one array: w **decreasing**; unbounded: w increasing.
- Reconstruct: store argmax/argmin choices, trace back from the answer. Hirschberg: alignment in linear space.

## Facts to remember
- Knapsack W = 10, (5,10),(4,40),(6,30),(3,50): 90. Matrix chain (10,30,5,60): 4500; (40,20,30,10,30): 26000.
- Burst [3,1,5,8]: 167. Coins game [8,15,3,7]: 22. T|T&F^T: 4 ways true. Rod prices (1,5,8,9,10,17,17,20), n = 8: 22.

## Exam checklist
English spec → recurrence + ALL base cases → memo → order → time (#entries × work). Say "pseudo-polynomial" when time depends on a numeric value. Never index by a set.

### Exam checklist (Midterm 2 DP questions)
- **Shape:** tree → f(v, status), postorder; interval → f(i, j), i decreasing / by length; budget → f(i, b); extra state → add the flag, counter or previous choice.
- **Spec** names the piece of input: "in the subtree of v", "of s[i..j]", "with b units of budget left", with index ranges.
- **Base cases:** leaves, empty interval, i = n + 1, budget too small ($-\infty$), unreachable value ($\infty$), empty product = 1 when counting.
- **Answer entry:** max/min over the root's states; max over **all** v for "highest vertex" DPs; largest v with $M(1, v) \le W$ for value-indexed knapsack.
- **Order** checked against every dependency of the recurrence.
- **Time** = #states × work (split points, child merges $O(B^2)$, color loops). Pseudo-polynomial if a number like W, B, T appears — unless the input lists that many values.
- **Greedy steps** only with an exchange argument; otherwise try every option.
`,
  quiz: [
    {
      type: 'mc',
      q: 'What is the running time of the standard DP for 0/1 knapsack with n items and capacity W?',
      choices: [String.raw`$O(n\log W)$`, String.raw`$O(nW)$`, String.raw`$O(2^n)$`, String.raw`$O(n^2 W^2)$`],
      answer: 1,
      explain: String.raw`K(i, w) has $(n+1)(W+1)$ entries, each a max of two values: $O(nW)$. This is pseudo-polynomial since W can be exponential in its bit length.`,
    },
    {
      type: 'tf',
      q: 'The O(nW) knapsack algorithm shows that 0/1 knapsack can be solved in polynomial time.',
      answer: false,
      explain: String.raw`Polynomial time means polynomial in the input *length*. W is given in binary using about $\lg W$ bits, so $nW = n\cdot 2^{\lg W}$ is exponential in the input length. Knapsack is NP-hard; the DP is pseudo-polynomial.`,
    },
    {
      type: 'mc',
      q: 'For maximum-weight independent set in a rooted tree, with In(v) / Out(v) = best weight in v\'s subtree with / without v, which recurrence is correct?',
      choices: [
        String.raw`$In(v) = w(v) + \sum_c Out(c)$, $Out(v) = \sum_c \max\{In(c), Out(c)\}$`,
        String.raw`$In(v) = w(v) + \sum_c In(c)$, $Out(v) = \sum_c Out(c)$`,
        String.raw`$In(v) = w(v) + \sum_c Out(c)$, $Out(v) = \sum_c In(c)$`,
        String.raw`$In(v) = w(v) + \max_c Out(c)$, $Out(v) = \max_c In(c)$`,
      ],
      answer: 0,
      explain: String.raw`If v is in the set, no child can be. If v is out, each child may be in or out, whichever is better — forcing children in (option C) is the vertex-cover recurrence, not independent set. The subtrees of different children are independent, so we **sum** over children, not max.`,
    },
    {
      type: 'mc',
      q: 'In what order should the values In(v), Out(v) of a tree DP be computed?',
      choices: ['Preorder (parents before children)', 'Postorder (children before parents)', 'In order of vertex weight', 'Breadth-first from the root'],
      answer: 1,
      explain: 'Each vertex\'s values depend on its children\'s values, so children must be computed first: a postorder traversal (or reverse BFS order). Total time O(n) since each vertex is processed once and looks at each child once.',
    },
    {
      type: 'mc',
      q: 'What is the running time of the matrix-chain multiplication DP for a chain of n matrices?',
      choices: [String.raw`$O(n)$`, String.raw`$O(n^2)$`, String.raw`$O(n^3)$`, String.raw`$O(2^n)$`],
      answer: 2,
      explain: String.raw`$O(n^2)$ intervals (i, j), each a min over O(n) split points k. (The number of parenthesizations is the Catalan number, exponential — that's what brute force would enumerate.)`,
    },
    {
      type: 'short',
      q: 'Minimum number of scalar multiplications to compute A1·A2·A3 where A1 is 10×30, A2 is 30×5, A3 is 5×60? (Give a number.)',
      answer: ['4500'],
      explain: String.raw`$(A_1A_2)A_3$ costs $10\cdot30\cdot5 + 10\cdot5\cdot60 = 1500 + 3000 = 4500$; $A_1(A_2A_3)$ costs $30\cdot5\cdot60 + 10\cdot30\cdot60 = 9000 + 18000 = 27000$.`,
    },
    {
      type: 'mc',
      q: String.raw`In the optimal BST recurrence $\text{Opt}(i,j) = F(i,j) + \min_r(\text{Opt}(i, r-1) + \text{Opt}(r+1, j))$, why is the term $F(i,j) = \sum_{k=i}^j f[k]$ added?`,
      choices: [
        'It is the cost of the root only',
        'Placing both subtrees one level below the new root increases the depth of every key in [i, j] by one (and the root itself is at depth 1)',
        'It accounts for unsuccessful searches',
        'It is a tie-breaking term and could be omitted',
      ],
      answer: 1,
      explain: String.raw`Opt(i, r−1) and Opt(r+1, j) are costs of the subtrees measured with *their* roots at depth 1. Hanging them under $k_r$ adds 1 to every depth, i.e. adds their total frequency; the root contributes $f[r]\cdot 1$. Together that is exactly F(i, j).`,
    },
    {
      type: 'mc',
      q: 'To maximize the value of an expression with + and − by inserting parentheses, why must the DP also compute minimum values of subexpressions?',
      choices: [
        'To detect overflow',
        String.raw`Because $\max(a - b)$ over the choices for the right operand is achieved by the **minimum** b`,
        'Because minimization is easier than maximization',
        'It doesn\'t need to; Max alone suffices',
      ],
      answer: 1,
      explain: String.raw`If the last operation is a subtraction, the value is (left) − (right); to maximize it we maximize the left and minimize the right. And to compute those minima we in turn need maxima (min of a − b uses max b). So Max and Min are computed together.`,
    },
    {
      type: 'tf',
      q: 'The longest path between two vertices of a directed acyclic graph can be computed in O(V + E) time.',
      answer: true,
      explain: String.raw`Process vertices in reverse topological order with LLP(v) = max over edges v→u of ℓ(v→u) + LLP(u). Each edge is examined once. In general graphs (with cycles) longest simple path is NP-hard — the DAG structure is what makes DP possible.`,
    },
    {
      type: 'multi',
      q: 'Which of these problems are naturally solved by an interval DP over (i, j)? (select all that apply)',
      choices: ['Matrix-chain multiplication', 'Optimal binary search tree', 'Longest palindromic subsequence', '0/1 knapsack', 'Longest increasing subsequence'],
      answer: [0, 1, 2],
      explain: 'Matrix chain (last multiplication splits the interval), optimal BST (root splits the key interval) and LPS (strip the two ends of an interval) are interval DPs. Knapsack is indexed by (item, capacity); LIS by a single index.',
    },
    {
      type: 'tf',
      q: 'Putting the most frequently searched key at the root (and recursing) always produces an optimal binary search tree.',
      answer: false,
      explain: String.raw`Counterexample: frequencies (3, 3, 4). Greedy roots at key 3: cost $4 + 2\cdot 3 + 3\cdot 3 = 19$. Rooting at key 2 gives $3 + 2\cdot 3 + 2\cdot 4 = 17$. The balance of the subtrees matters, which is why we try every root.`,
    },
    {
      type: 'mc',
      q: 'Weighted interval scheduling with intervals sorted by finish time; p(j) = the largest index i < j whose interval is compatible with j. Which recurrence is correct?',
      choices: [
        String.raw`$OPT(j) = \max\{OPT(j-1),\ w_j + OPT(p(j))\}$`,
        String.raw`$OPT(j) = w_j + OPT(p(j))$`,
        String.raw`$OPT(j) = \max\{OPT(j-1),\ w_j + OPT(j-1)\}$`,
        String.raw`$OPT(j) = \max_{i<j}\{w_i + OPT(i)\}$`,
      ],
      answer: 0,
      explain: String.raw`Either interval j is not used (OPT(j−1)) or it is, in which case the other chosen intervals must finish before it starts, i.e. come from 1..p(j) (by sorting, everything in 1..p(j) is compatible with j, everything in p(j)+1..j−1 is not). Option C ignores conflicts. Total $O(n\log n)$ including sorting and binary searches for p.`,
    },
    {
      type: 'mc',
      q: 'For the unbounded knapsack problem (unlimited copies of each item), which recurrence is correct for K(w) = best value with capacity w?',
      choices: [
        String.raw`$K(w) = \max\big(\{0\}\cup\{v_i + K(w - w_i) : w_i \le w\}\big)$`,
        String.raw`$K(w) = \max_i\{v_i + K(w)\}$`,
        String.raw`$K(w) = \max\{K(w-1),\ v_1 + K(w - w_1)\}$`,
        String.raw`$K(i, w) = \max\{K(i+1, w),\ v_i + K(i+1, w - w_i)\}$`,
      ],
      answer: 0,
      explain: String.raw`Look at any one item in the optimal multiset: removing it leaves an optimal solution for capacity $w - w_i$, and since items can repeat, all items remain available. Option D is the 0/1 recurrence (each item once). Option A is $O(nW)$ time with a 1D table filled for w = 0..W.`,
    },
    {
      type: 'mc',
      q: 'You need both the LCS length and an actual LCS of two strings of length n, using O(n) space. What works?',
      choices: [
        'Keep two rows of the table and trace back from them',
        'Hirschberg\'s divide-and-conquer: find where an optimal path crosses the middle row using linear-space passes, then recurse on both halves',
        'It is impossible in O(n) space',
        'Use memoization instead of iteration',
      ],
      answer: 1,
      explain: String.raw`Two rows give the length but not the traceback (the path information is discarded). Hirschberg computes forward values for the first half and backward values for the second half in linear space, picks the best crossing point in the middle row, and recurses: $O(n^2)$ time, O(n) space.`,
    },
    {
      type: 'mc',
      q: String.raw`Knapsack with one array: for each item i, the code runs "for w = $w_i$ up to W: K[w] = max(K[w], $v_i$ + K[w − $w_i$])". Which problem does this solve?`,
      choices: ['0/1 knapsack (each item at most once)', 'Unbounded knapsack (unlimited copies of each item)', 'Neither — it reads uninitialized entries', 'Exact-capacity knapsack'],
      answer: 1,
      explain: String.raw`With w increasing, K[w − $w_i$] may already include item i (it was updated earlier in the same pass), so item i can be used again: unbounded knapsack. For 0/1 knapsack, run w **downward** (or copy the previous row) so that K[w − $w_i$] still refers to the items processed before i.`,
    },
    {
      type: 'mc',
      q: 'In the tree vertex-cover DP, why is Out(v) = Σ over children c of In(c)?',
      choices: [
        'Because In(c) ≤ Out(c) always',
        'If v is not in the cover, each edge (v, c) must be covered by c, so every child must be in the cover',
        'Because vertex covers never contain leaves',
        'It is a heuristic; the correct formula uses min(In(c), Out(c))',
      ],
      answer: 1,
      explain: 'An edge needs at least one endpoint in the cover. With v excluded, the only way to cover the edge to child c is to include c. When v is included, each child is free to take its cheaper state, which gives In(v) = c(v) + Σ min(In(c), Out(c)).',
    },
    {
      type: 'mc',
      q: 'In the burst-balloons interval DP, B(i, j) chooses the balloon k that is burst LAST among those strictly between i and j. Why last rather than first?',
      choices: [
        'Choosing last gives a smaller table',
        'While k survives, the balloons on its left and right never become neighbours, so the two sides are independent subproblems with known boundary neighbours (i, k) and (k, j)',
        'Choosing first would give the same recurrence',
        'The first balloon burst is always the smallest one',
      ],
      answer: 1,
      explain: String.raw`If k is burst first, its two neighbours become adjacent and the left and right sides interact — no clean split. If k is burst last in (i, j), everything left of k is burst while i and k are its outer neighbours, and similarly on the right; finally k gains $a_i a_k a_j$. That gives $B(i,j) = \max_k B(i,k) + B(k,j) + a_ia_ka_j$ in $O(n^3)$.`,
    },
    {
      type: 'short',
      q: 'Two players alternately take a coin from either end of the row 8, 15, 3, 7; both play optimally to maximize their own total. How much does the first player get? (Give a number.)',
      answer: ['22'],
      explain: 'Take 7 first. If the opponent then takes 8, take 15; if they take 3, take 15. Either way the first player ends with 7 + 15 = 22 (the opponent gets 11). Greedily taking the larger end (8) lets the opponent take 7 and then 15. The DP: Diff(i, j) = max(v_i − Diff(i+1, j), v_j − Diff(i, j−1)), first player total = (33 + Diff(1, 4)) / 2 = (33 + 11) / 2 = 22.',
    },
    {
      type: 'short',
      q: 'How many of the 5 full parenthesizations of the Boolean expression T | T & F ^ T (| = or, & = and, ^ = xor) evaluate to true? (Give a number.)',
      answer: ['4'],
      explain: 'Check all five: (T|(T&(F^T))) = T, (T|((T&F)^T)) = T, ((T|T)&(F^T)) = T, ((T|(T&F))^T) = F, (((T|T)&F)^T) = T. Four are true. The DP keeps T(i, j) and F(i, j) for each interval and combines the two sides at the last operator: e.g. for &, T += T_L·T_R; for |, T += total − F_L·F_R; for ^, T += T_L·F_R + F_L·T_R.',
    },
    {
      type: 'mc',
      q: 'Counting proper colorings of a tree with n vertices where vertex v may use only colors from a list L(v) ⊆ {1..k}: C(v, c) = [c ∈ L(v)] · Π over children u of (S(u) − C(u, c)), where S(u) = Σ_c C(u, c). What is the running time?',
      choices: [String.raw`$O(n)$`, String.raw`$O(nk)$`, String.raw`$O(nk^2)$`, String.raw`$O(k^n)$`],
      answer: 1,
      explain: String.raw`There are nk values C(v, c). Computing C(v, c) multiplies one factor per child, so vertex v costs O(k · (1 + #children)), and summing gives $O(k(n + n - 1)) = O(nk)$. The trick $S(u) - C(u,c)$ (colorings of u's subtree where u avoids color c) avoids an inner loop over colors, which would give $O(nk^2)$.`,
    },
    {
      type: 'tf',
      q: 'A tree DP whose values at v depend on the values at v\'s children may be evaluated in preorder (each vertex before its children).',
      answer: false,
      explain: 'Preorder visits a vertex before its children, so their values would not be available yet. Use postorder (or reverse BFS order); memoized recursion from the root achieves the same automatically.',
    },
    {
      type: 'tf',
      q: 'Scheduling jobs with processing times, deadlines and profits on one machine via the DP Best(i, t) (jobs sorted by deadline, t = current time) runs in O(nD) time for maximum deadline D, so the problem is solvable in polynomial time.',
      answer: false,
      explain: String.raw`D is a number in the input, written in $O(\log D)$ bits, so $O(nD)$ is pseudo-polynomial. (The problem generalizes knapsack — set every deadline to W — so it is NP-hard.)`,
    },
    {
      type: 'mc',
      q: 'To find the cheapest route from s to t using at most k flights, why not just run Dijkstra on the flight graph?',
      choices: [
        'Dijkstra cannot handle positive weights',
        'The cheapest route overall may use more than k flights; the subproblem must remember how many flights remain, e.g. D(i, v) = cheapest walk to v with at most i edges',
        'Dijkstra is slower than O(k(V + E)) in all cases',
        'It would work; the limit k is irrelevant',
      ],
      answer: 1,
      explain: 'The edge budget is part of the state: the best way to reach v with 2 flights left can differ from the best way with 5 flights left. The layered DP computes D(i, v) for i = 0..k in O(k(V + E)). (One can also run Dijkstra on a graph with vertices (v, i), at a higher cost.)',
    },
    {
      type: 'mc',
      q: 'Count monotone (right/down) paths in an m × n grid with blocked cells that make at most k turns, using P(i, j, t, d) = number of ways to finish from cell (i, j) with t turns left when the last move was in direction d. What is the running time?',
      choices: [String.raw`$O(mn)$`, String.raw`$O(mnk)$`, String.raw`$O(mn \cdot 2^k)$`, String.raw`$O((m+n)^k)$`],
      answer: 1,
      explain: String.raw`There are $mn(k+1)\cdot 2$ subproblems, each a sum of at most two terms (continue straight with the same t, or turn and use t − 1), so $O(mnk)$ time.`,
    },
    {
      type: 'tf',
      q: 'For an interval DP where M(i, j) depends on M(i, k) and M(k+1, j) for i ≤ k < j, the loop order "for i = 1 to n: for j = i to n" is valid.',
      answer: false,
      explain: 'M(1, j) needs M(2, j), …, M(j, j) from later rows, which have not been computed yet. Fill by increasing length, or with i decreasing in the outer loop and j increasing in the inner loop.',
    },
    {
      type: 'tf',
      q: 'For merging a row of piles where each merge combines two ADJACENT piles at a cost equal to their total size, repeatedly merging the adjacent pair with the smallest total is optimal.',
      answer: false,
      explain: 'Piles 3, 2, 2, 3: greedy merges 2 + 2 (cost 4), then 3 + 4 (7), then 7 + 3 (10): total 21. Merging 3 + 2 and 2 + 3 first (5 + 5) and then 5 + 5 (10) costs 20. The interval DP M(i, j) = S(i, j) + min over k of M(i, k) + M(k+1, j) is needed. (If ANY two piles may be merged, the greedy is Huffman coding and is optimal.)',
    },
    {
      type: 'mc',
      q: 'How many different ways are there to fully parenthesize a product of 5 matrices?',
      choices: ['5', '10', '14', '24'],
      answer: 2,
      explain: String.raw`P(n) = Σ over the last split k of P(k)·P(n − k), with P(1) = 1: P(2) = 1, P(3) = 2, P(4) = 5, P(5) = 14 — the Catalan number $C_4$. Exponential growth ($\approx 4^n$) is why matrix-chain needs DP rather than enumeration.`,
    },
    {
      type: 'mc',
      q: 'A DP for the traveling salesman problem uses subproblems T(S, v) = the cheapest path that starts at city 1, visits exactly the cities in the set S, and ends at v. Which statement is correct?',
      choices: [
        'It runs in polynomial time because each subproblem takes O(n) time',
        String.raw`It is correct but has about $2^n n$ subproblems, so it takes $O(2^n n^2)$ time: exponential (though much faster than $n!$)`,
        'It is incorrect because sets cannot be subproblem parameters',
        'It is pseudo-polynomial',
      ],
      answer: 1,
      explain: String.raw`Indexing by a subset is legal — the recurrence is right — but there are $2^n$ subsets, so the algorithm is exponential. "Efficient" DPs need polynomially many subproblems; this one is the classic Held–Karp exponential algorithm. Pseudo-polynomial refers to dependence on numeric values, which isn't the issue here.`,
    },
    {
      type: 'tf',
      q: 'In a 0/1 knapsack instance where every item weight is at most n² (n = the number of items), the standard K(i, w) DP can be made to run in time polynomial in the input size.',
      answer: true,
      explain: String.raw`If $W \ge \sum_i w_i$ every subset fits, so we may replace W by $\min(W, \sum_i w_i) \le n \cdot n^2 = n^3$. The table then has $O(n \cdot n^3) = O(n^4)$ entries: polynomial. A pseudo-polynomial algorithm becomes polynomial exactly when the numbers it depends on are bounded by a polynomial in the input size (or written in unary). This does not contradict NP-hardness: the hard knapsack instances are the ones with exponentially large weights.`,
    },
    {
      type: 'multi',
      q: 'Which of these running times are polynomial in the size of the input? (select all that apply)',
      choices: [
        String.raw`$O(nW)$ for 0/1 knapsack, with the capacity W written in binary`,
        String.raw`$O(n^3)$ for an interval DP over a sequence of n numbers`,
        String.raw`$O(nT)$ for subset sum when the target T is given in unary (a string of T ones)`,
        String.raw`$O(VE)$ for Bellman–Ford on a graph with V vertices and E edges`,
        String.raw`$O(nD)$ for deadline scheduling, with the largest deadline D written in binary`,
      ],
      answer: [1, 2, 3],
      explain: String.raw`"Polynomial" is measured against the length of the input. A binary number W takes only about $\lg W$ bits, so $O(nW)$ and $O(nD)$ are exponential in the input length (pseudo-polynomial). In unary, T takes T symbols, so $O(nT)$ is polynomial in that (bloated) input. $O(n^3)$ and $O(VE)$ depend only on how many objects there are, never on numeric magnitudes.`,
    },
    {
      type: 'mc',
      q: 'L(i, j) is defined for 1 ≤ i ≤ j ≤ n and reads L(i+1, j), L(i, j−1) and L(i+1, j−1). Which evaluation order is NOT valid?',
      choices: [
        'By increasing length j − i',
        'i from n down to 1; for each i, j from i up to n',
        'j from 1 up to n; for each j, i from j down to 1',
        'i from 1 up to n; for each i, j from i up to n',
      ],
      answer: 3,
      explain: 'Row-by-row with i increasing computes L(1, j) before any entry of row 2, but L(1, j) needs L(2, j). The other three are valid: by length, every dependency is a shorter interval; with i decreasing, row i + 1 is complete and L(i, j−1) was just computed; column by column with i decreasing, column j − 1 is complete and L(i+1, j) was just computed. To test any order, check that each of the three dependencies is computed earlier.',
    },
    {
      type: 'mc',
      q: 'Every vertex of a rooted tree has a weight, possibly negative. Best(v) = the maximum weight of a connected set of vertices whose highest vertex (closest to the root) is v. What is the maximum weight of a nonempty connected set?',
      choices: [
        'Best(root)',
        'The maximum of Best(v) over all vertices v',
        'The sum over all vertices v of max(0, Best(v))',
        'max(Best(root), 0)',
      ],
      answer: 1,
      explain: 'Every connected set has exactly one highest vertex, so the optimum equals Best(v) for that vertex, and taking the maximum over all v covers every case. Best(root) only considers sets that contain the root, which can be terrible if the root is very negative. Summing over vertices glues together pieces that are not connected to each other (and counts vertices several times). The general lesson: decide where the answer lives in the table, and do not assume it is always at the root.',
    },
    {
      type: 'tf',
      q: 'For maximum-weight independent set in a rooted tree (In(v) / Out(v) = best in v\'s subtree with / without v), the answer is always In(root), since adding the root can only help.',
      answer: false,
      explain: 'Including the root forbids all of its children. A root of weight 1 with two children of weight 5 has In(root) = 1 but Out(root) = 10. The answer is max{In(root), Out(root)}. Use In(root) alone only when the problem forces the root into the solution (for example, "the CEO must attend").',
    },
    {
      type: 'mc',
      q: 'Features form a rooted tree (building a feature requires building its parent), and the budget is B. Best(v, b) is computed by folding in v\'s children one at a time: for each child c and each budget b, try every split of b between c\'s subtree and the children already merged. What is the total running time?',
      choices: [String.raw`$O(n + B)$`, String.raw`$O(nB)$`, String.raw`$O(nB^2)$`, String.raw`$O(n^2B^2)$`],
      answer: 2,
      explain: String.raw`Each merge of one child into its parent's running table computes B + 1 values, each a max over at most B + 1 splits: $O(B^2)$. There is exactly one merge per child, i.e. one per tree edge, so the total is $O(nB^2)$: not $O(n^2B^2)$, because each child is merged once, not once per sibling. It is pseudo-polynomial (B is a number). A preorder formulation (take $x_i$, or skip its whole subtree by jumping to $i + \text{size}(x_i)$) even achieves $O(nB)$.`,
    },
    {
      type: 'mc',
      q: 'In a rooted tree, each informed vertex can inform one of its children per time step. T(v) = the time needed to finish v\'s subtree once v is informed. In which order should v call its children?',
      choices: [
        'Children with more descendants first',
        'Children with larger T(c) first',
        'Children with smaller T(c) first (shortest job first)',
        'The order does not matter',
      ],
      answer: 1,
      explain: String.raw`With children called at steps 1, 2, …, d, the finishing time is $\max_i (i + T(c_i))$. If a child x with smaller T is called just before a child y with larger T, swapping them gives terms $i + T(y)$ and $i + 1 + T(x)$, both at most the old term $i + 1 + T(y)$, so sorting by T decreasing is optimal (exchange argument). Subtree size is the wrong key: a child whose subtree has 8 vertices but finishes in 3 steps should go after a child at the top of a 5-vertex path (which needs 4 steps); size order gives max(1 + 3, 2 + 4) = 6, T order gives max(1 + 4, 2 + 3) = 5.`,
    },
    {
      type: 'multi',
      q: 'Which of these greedy algorithms are guaranteed to be optimal? (select all that apply)',
      choices: [
        'Fractional knapsack (items may be split): take items in decreasing order of value/weight',
        '0/1 knapsack: take items in decreasing order of value/weight while they fit',
        'Unweighted interval scheduling: repeatedly take the compatible interval that finishes first',
        'Weighted interval scheduling: repeatedly take the compatible interval that finishes first',
        'Allocating H study hours: give each next hour to the exam with the largest marginal gain, for arbitrary score tables',
      ],
      answer: [0, 2],
      explain: 'Fractional knapsack and unweighted interval scheduling have exchange-argument proofs. Ratio-greedy 0/1 knapsack fails (W = 10, items (6, 30), (5, 20), (5, 20): greedy 30, optimum 40). Earliest-finish with weights fails (a weight-1 interval can block a weight-100 one). Marginal-gain greedy fails when a table has increasing returns: an exam whose scores go 0, 2, 5, 9 looks unattractive one hour at a time. (It is optimal when every table is concave, i.e. has diminishing returns.) When no exchange argument exists, use a DP that tries every option.',
    },
    {
      type: 'mc',
      q: 'Paint n houses in a row with k colors so that adjacent houses differ; c[i][a] is the cost of color a on house i. With P(i, a) = c[i][a] + min over b ≠ a of P(i+1, b), the naive time is O(nk²). How do you get O(nk)?',
      choices: [
        'You cannot: there are nk entries and each needs O(k) time',
        'For each row i + 1, precompute its smallest and second-smallest values; the min over b ≠ a is the smallest unless a is the color achieving it, in which case it is the second smallest',
        'Greedily give each house its cheapest color different from the previous house',
        'Drop the color from the state and keep only P(i)',
      ],
      answer: 1,
      explain: String.raw`Excluding one color from a min only matters for the color that achieves it, so two numbers per row (plus the argmin) answer all k queries in O(1) each: $O(k)$ per row and $O(nk)$ overall. The greedy fails: with rows (1, 9, 2), (3, 2, 4), (3, 6, 2), (6, 6, 1), greedy pays 1 + 2 + 2 + 6 = 11 but A, B, A, C costs 7. Dropping the color loses the information needed to enforce "different from the previous house".`,
    },
    {
      type: 'mc',
      q: 'Two robots start at the top-left cell of an n × n grid and walk to the bottom-right cell (right/down moves); a coin is collected only once even if both robots visit its cell. The DP moves them in lockstep with state (s, r₁, r₂), where s = row + column of both current cells. Which statement is correct?',
      choices: [
        'The columns are s − r₁ and s − r₂, so the state determines both positions; there are O(n³) states, and a shared cell is always visited at the same s, so double counting is easy to avoid',
        'Lockstep loses solutions; the state must be (r₁, c₁, r₂, c₂) with O(n⁴) states',
        'There are O(n²) states because the robots are interchangeable',
        'The state must include the paths so far, so it is exponential',
      ],
      answer: 0,
      explain: 'Every monotone path visits exactly one cell on each anti-diagonal row + column = s, so moving both robots one step at a time loses nothing. A cell lies on a single anti-diagonal, so if both robots visit it they do so at the same s, exactly when r₁ = r₂: add its coins once. That gives O(n) values of s times O(n²) row pairs = O(n³) states with O(1) work each. Symmetry (r₁ ≤ r₂) halves the table but does not change the bound.',
    },
    {
      type: 'tf',
      q: 'A tree DP that does O(1 + #children(v)) work at each vertex v runs in O(n) total time, even if one vertex has n − 1 children.',
      answer: true,
      explain: String.raw`Sum the work: $\sum_v (1 + \#\text{children}(v)) = n + (n - 1)$, because every vertex except the root is the child of exactly one vertex. A single high-degree vertex costs O(n) once; it cannot make the total quadratic. Quadratic bounds come from doing $O(\deg^2)$ work per vertex (e.g. recomputing "the sum over the other children" for each child), which the subtraction trick avoids.`,
    },
    {
      type: 'mc',
      q: 'A knapsack instance has n = 60 items, capacity W = 10¹², and every value is an integer between 1 and 50. Which approach is the practical one?',
      choices: [
        String.raw`K(i, w) over capacities: $O(nW)$`,
        String.raw`M(i, v) = the minimum weight of a subset of items i..n with total value exactly v: $O(n \sum_i v_i)$`,
        'Greedy by value/weight ratio',
        String.raw`Brute force over all $2^{60}$ subsets`,
      ],
      answer: 1,
      explain: String.raw`Swap the roles of weight and value. Here $\sum v_i \le 3000$, so the table has about $61 \times 3001$ entries. Recurrence: $M(i, v) = \min\{M(i+1, v),\ w_i + M(i+1, v - v_i)\}$ with $M(n+1, 0) = 0$ and $M(n+1, v) = \infty$ for v > 0; the answer is the largest v with $M(1, v) \le W$. The capacity table would need $10^{12}$ columns, ratio-greedy is not optimal, and $2^{60}$ is hopeless.`,
    },
  ],
  flashcards: [
    { front: '0/1 knapsack recurrence', back: String.raw`$K(i,w) = K(i+1,w)$ if $w_i > w$; else $\max\{K(i+1,w),\ v_i + K(i+1,w-w_i)\}$; $K(n+1,w) = 0$. $O(nW)$ time.` },
    { front: 'Why is O(nW) "pseudo-polynomial"?', back: String.raw`W is encoded in $\approx\lg W$ bits, so $nW$ is exponential in the input length. Polynomial only in the numeric value of W.` },
    { front: 'Tree MIS recurrences', back: String.raw`$In(v) = w(v) + \sum_c Out(c)$; $Out(v) = \sum_c \max\{In(c), Out(c)\}$. Postorder, O(n). Answer $\max\{In(r), Out(r)\}$.` },
    { front: 'Tree vertex cover recurrences', back: String.raw`$In(v) = 1 + \sum_c \min\{In(c), Out(c)\}$; $Out(v) = \sum_c In(c)$ (every edge to a child must be covered by the child).` },
    { front: 'Matrix-chain recurrence', back: String.raw`$M(i,i) = 0$; $M(i,j) = \min_{i\le k<j} M(i,k) + M(k+1,j) + d_{i-1}d_kd_j$. $O(n^3)$ time, $O(n^2)$ space.` },
    { front: 'Optimal BST recurrence', back: String.raw`$Opt(i,j) = 0$ if $i > j$; else $F(i,j) + \min_{i\le r\le j}\{Opt(i,r-1) + Opt(r+1,j)\}$ with $F(i,j) = \sum_{k=i}^j f_k$. $O(n^3)$.` },
    { front: 'Max-value parenthesization with +/−', back: String.raw`Track Max(i,j) and Min(i,j). For a split at '−': Max = Max(left) − Min(right), Min = Min(left) − Max(right). For '+': add maxes / add mins. $O(n^3)$.` },
    { front: 'Every DP is a ___', back: 'DAG of subproblems (edges = dependencies). Evaluation order = reverse topological order. Many DPs are literally longest/shortest paths in a DAG.' },
    { front: 'Longest path in a DAG', back: String.raw`LLP(v) = max over v→u of ℓ(v→u) + LLP(u); LLP(t) = 0; reverse topological order; $O(V+E)$. NP-hard in general graphs.` },
    { front: 'Weighted interval scheduling', back: String.raw`Sort by finish time; p(j) = last interval compatible with j (binary search). $OPT(j) = \max\{OPT(j-1), w_j + OPT(p(j))\}$. $O(n\log n)$.` },
    { front: 'Space-saving trick', back: 'If each row depends only on the previous row, keep two rows (O(n) space). Reconstruction then needs Hirschberg (divide & conquer) or recomputation.' },
    { front: 'How to reconstruct an optimal solution', back: 'Store (or recompute) the choice that achieved each optimum; trace from the answer entry to a base case.' },
    { front: 'Designing a DP: the key question', back: 'What does the remainder of the computation need to know about past decisions? Add exactly that (an index, a small number, a flag) to the subproblem.' },
    { front: '0/1 vs unbounded knapsack in one array', back: String.raw`For each item, update K[w] = max(K[w], $v_i$ + K[w − $w_i$]). w **decreasing** → each item at most once (0/1). w **increasing** → item may be reused (unbounded).` },
    { front: 'Exact-capacity knapsack', back: String.raw`Same recurrence as 0/1 knapsack, but base K(n+1, 0) = 0 and K(n+1, w) = $-\infty$ for w > 0. Impossible states propagate $-\infty$ through the max.` },
    { front: 'Rod cutting', back: String.raw`Cut(0) = 0; Cut(ℓ) = $\max_{1\le i\le \ell}$ (p[i] + Cut(ℓ − i)) — the first piece has length i. $O(n^2)$. Unbounded knapsack with weight = length.` },
    { front: 'Maximum-weight matching in a tree', back: String.raw`Free(v) = best in v's subtree with v unmatched = $\sum_c$ Best(c). Best(v) = max(Free(v), $\max_c$ [w(v,c) + Free(c) + Free(v) − Best(c)]). Postorder, O(n).` },
    { front: 'Tree diameter by DP', back: String.raw`Down(v) = longest downward path from v = $\max_c (\ell(v,c) + \text{Down}(c))$, 0 at leaves. Diameter = max over v of the sum of the two largest values $\ell(v,c) + \text{Down}(c)$. O(n).` },
    { front: 'Burst balloons recurrence', back: String.raw`Pad with $a_0 = a_{n+1} = 1$. B(i, j) over the open interval: B(i, i+1) = 0; $B(i,j) = \max_{i<k<j} B(i,k) + B(k,j) + a_ia_ka_j$ — k is burst **last**. $O(n^3)$.` },
    { front: 'Coins-in-a-row game', back: String.raw`Diff(i,i) = $v_i$; Diff(i, j) = max($v_i$ − Diff(i+1, j), $v_j$ − Diff(i, j−1)) = mover's advantage. First player's total = (sum + Diff(1, n)) / 2. $O(n^2)$.` },
    { front: 'Counting true parenthesizations of a Boolean expression', back: 'Keep T(i, j) and F(i, j). At a split k with left (T_L, F_L), right (T_R, F_R): AND: T += T_L·T_R. OR: T += total − F_L·F_R. XOR: T += T_L·F_R + F_L·T_R. F += total − (the T contribution). O(n³).' },
    { front: 'DP on a graph with cycles: budget layers', back: String.raw`D(i, v) = cheapest walk s → v with at most i edges: D(i, v) = min(D(i−1, v), $\min_{u\to v}$ D(i−1, u) + w(u→v)). Layers make it acyclic. $O(k(V+E))$; k = V − 1 is Bellman–Ford.` },
    { front: 'Largest all-1 square', back: 'Sq(i, j) = side of the largest all-1 square with bottom-right corner (i, j): 0 if the cell is 0; otherwise 1 + min(Sq(up), Sq(left), Sq(diagonal)). Answer = max entry. O(mn).' },
    { front: 'When is an O(nW) knapsack algorithm actually polynomial?', back: String.raw`When W is bounded by a polynomial in the input size: e.g. all weights $\le n^2$ (cap W at $\sum w_i \le n^3$), or numbers written in unary. With W in binary and unbounded, $nW$ is exponential in $\lg W$: pseudo-polynomial.` },
    { front: 'Value-indexed knapsack (huge weights, small values)', back: String.raw`M(i, v) = min weight of a subset of items i..n with value exactly v. $M(n+1, 0) = 0$, $M(n+1, v>0) = \infty$; $M(i,v) = \min\{M(i+1,v),\ w_i + M(i+1, v - v_i)\}$. Answer: largest v with $M(1,v) \le W$. $O(nV)$, $V = \sum v_i$.` },
    { front: 'Tree knapsack (prerequisite tree, budget B)', back: String.raw`Best(v, b) = best closed set inside v's subtree that contains v, cost $\le b$ ($-\infty$ if $c(v) > b$). Merge children like knapsack items: $K_j(b) = \max\{K_{j-1}(b),\ \max_a \text{Best}(u_j, a) + K_{j-1}(b-a)\}$; $\text{Best}(v,b) = g(v) + K_d(b - c(v))$. $O(nB^2)$ (preorder trick: $O(nB)$).` },
    { front: 'Broadcasting down a rooted tree', back: String.raw`T(leaf) = 0. Sort the children so $T(c_1) \ge T(c_2) \ge \dots$; then $T(v) = \max_i (i + T(c_i))$. Exchange argument: call the slowest subtree first. $O(n\log n)$. (Largest subtree first is wrong.)` },
    { front: 'Clearing a row (each move deletes a run of equal blocks)', back: String.raw`$D(i,j) = \min\{1 + D(i+1,j),\ \min_{i<k\le j,\ s_k = s_i} D(i+1,k-1) + D(k,j)\}$, D(empty) = 0. Either $s_i$ is deleted on its own, or it waits and is deleted with the next block $s_k$ deleted alongside it. $O(n^3)$.` },
    { front: 'Longest balanced bracket subsequence', back: String.raw`$L(i,j) = \max\{L(i+1,j),\ \max_k 2 + L(i+1,k-1) + L(k+1,j)\}$ over k with $s_i, s_k$ a matching open/close pair; L(empty) = 0. Inside and after the pair are independent. $O(n^3)$. Fewest deletions = $n - L(1,n)$.` },
    { front: 'Painting houses: adjacent colors differ', back: String.raw`$P(i,a) = c[i][a] + \min_{b \ne a} P(i+1,b)$; answer $\min_a P(1,a)$. Naive $O(nk^2)$; $O(nk)$ by keeping the smallest and second-smallest values of row i + 1. Greedy (cheapest allowed color per house) fails.` },
    { front: 'Two robots collecting coins on a grid', back: 'Move both in lockstep: state (s, r1, r2) with s = row + column, columns s − r1 and s − r2. Gain = coins of both cells, counted once when r1 = r2. O(n³) states for n × n, O(1) each. "Best path, then best path again" is NOT optimal.' },
    { front: 'Counting independent sets in a tree', back: String.raw`$\text{In}(v) = \prod_c \text{Out}(c)$; $\text{Out}(v) = \prod_c (\text{In}(c) + \text{Out}(c))$; leaves (1, 1). Answer In(r) + Out(r). Product = independent choices; empty product = 1.` },
    { front: 'Where is the answer of a tree DP?', back: 'Not always at one root entry. MIS: max(In(r), Out(r)). Dominating set: min(A(r), B(r)) (the root has no parent to rely on). Max-weight connected set, diameter: max over ALL v of the value with v as the highest vertex. Forced root: just In(r).' },
  ],
  problems: [
    {
      id: 'dp2-knapsack', type: 'written', title: '0/1 knapsack, fully', difficulty: 2,
      prompt: String.raw`(a) Give a complete DP solution (five parts) for 0/1 knapsack: n items with positive integer weights $w_i$ and values $v_i$, capacity W.
(b) Show how to recover the set of chosen items.
(c) Run it on W = 10 with items (weight, value) = (5, 10), (4, 40), (6, 30), (3, 50).
(d) Explain precisely why your algorithm is not polynomial time.`,
      rubric: ['English spec K(i, w) with index ranges', 'Recurrence with skip/take and the "doesn\'t fit" case, base case', 'Memo, order (i decreasing), O(nW) time', 'Correct traceback procedure', 'Example answer 90 (items 2 and 4)', 'Pseudo-polynomial explanation in terms of bit length of W'],
      hints: ['Item i is either skipped or taken; if taken, the capacity drops by w_i.', 'Traceback: compare K(i, w) with K(i+1, w).'],
      solution: String.raw`**(a)**
1. **Spec.** For $1 \le i \le n+1$, $0 \le w \le W$: K(i, w) = maximum total value of a subset of items i..n whose total weight is at most w. Answer K(1, W).
2. **Recurrence.**
$$K(i,w) = \begin{cases}0 & i = n+1\\ K(i+1,w) & w_i > w\\ \max\{K(i+1,w),\ v_i + K(i+1,w-w_i)\} & \text{otherwise}\end{cases}$$
An optimal subset of items i..n either omits item i (then it's an optimal subset of items i+1..n with capacity w) or includes it (then the rest is an optimal subset of items i+1..n with capacity $w - w_i$).
3. **Memo.** K[1..n+1][0..W].
4. **Order.** i from n+1 down to 1 (row i reads only row i+1); w in any order.
5. **Time/space.** $O(nW)$ time and space.

**(b)** w = W; for i = 1 to n: if $K(i, w) \ne K(i+1, w)$ then item i is taken and $w = w - w_i$; else it is skipped. (If they're equal, skipping is optimal.) O(n) extra time.

**(c)** Items 2 (4, 40) and 4 (3, 50): weight 7, value **90**. Checking alternatives: items 2, 3 weigh 10 for value 70; items 3, 4 weigh 9 for 80; items 1, 2 weigh 9 for 50; items 1, 4 weigh 8 for 60; any three items weigh at least 12 > 10. So 90 is optimal, which the table confirms.

**(d)** The input consists of 2n numbers plus W, written in binary: about $n\log(\max) + \log W$ bits. The running time $\Theta(nW)$ grows like $2^{\log W}$, exponential in the number of bits used for W. (E.g. W = $2^{100}$ fits in 101 bits but the table has $2^{100}$ columns.) This is *pseudo-polynomial*; since knapsack is NP-hard, no polynomial-time algorithm is known.`,
    },
    {
      id: 'dp2-tree-mis', type: 'written', title: 'Party planning (independent set in a tree)', difficulty: 2,
      prompt: String.raw`A company's hierarchy is a rooted tree: each employee except the CEO has one direct supervisor. Each employee v has a "fun" value $f(v) \ge 0$. Invite a set of employees maximizing total fun, such that no employee is invited together with their direct supervisor. Give a complete DP solution and analyze it. Then explain how to change it if the CEO **must** be invited.`,
      rubric: ['Two functions per vertex (with/without v), English specs for v\'s subtree', 'Correct recurrences and leaf base case', 'Postorder evaluation, stored at vertices', 'O(n) time with justification (sum of children counts)', 'CEO-must-attend: answer In(root)'],
      hints: ['If v is invited, none of v\'s children can be.', 'Answer: max of the two values at the root.'],
      solution: String.raw`This is maximum-weight independent set in a tree.

1. **Spec.** For each employee v: In(v) = maximum total fun of a valid guest list drawn from v's subtree (v and all its descendants) that **includes** v; Out(v) = the same but **excluding** v. Answer: $\max\{\text{In}(\text{CEO}), \text{Out}(\text{CEO})\}$.
2. **Recurrence.**
$$\text{In}(v) = f(v) + \sum_{c\in\text{children}(v)}\text{Out}(c),\qquad \text{Out}(v) = \sum_{c\in\text{children}(v)}\max\{\text{In}(c),\text{Out}(c)\}$$
(Leaves: In = f(v), Out = 0, which the formulas give with empty sums.) If v attends, its direct reports can't. If v doesn't, there's no constraint between v and its children, and different children's subtrees don't constrain each other, so each is optimized independently.
3. **Memo.** Two fields v.in, v.out stored at each tree node.
4. **Order.** Postorder traversal (each vertex after all its children).
5. **Time/space.** Vertex v costs O(1 + #children(v)); summing over all vertices gives O(n + (n − 1)) = O(n). O(n) space.

**CEO must attend:** return In(CEO) instead of the max. (Similarly, to force someone else to attend, set Out(v) = $-\infty$ for that v.)`,
    },
    {
      id: 'dp2-tree-dominating', type: 'written', title: 'Minimum dominating set in a tree', difficulty: 3,
      prompt: String.raw`A **dominating set** of a graph is a set D of vertices such that every vertex is in D or adjacent to a vertex in D. Describe and analyze an O(n)-time algorithm that computes the size of the smallest dominating set of a tree with n vertices.`,
      rubric: ['Three states per vertex (in D; not in D but dominated by a child; not in D and not yet dominated)', 'English specs for each state, all relative to v\'s subtree', 'Correct recurrences, including "at least one child in D" handled correctly', 'Correct leaf base cases (∞ where impossible) and answer min(A(r), B(r))', 'Postorder; O(n) time'],
      hints: ['Unlike independent set, a vertex not in D can be dominated by its parent — so a vertex\'s status depends on whether its parent is in D.', 'Track three states: v ∈ D; v ∉ D but some child ∈ D; v ∉ D and no child ∈ D (so the parent must be in D).'],
      solution: String.raw`Root the tree at r. For each vertex v define, for subsets D of v's subtree:

- **A(v)** = min |D| such that $v \in D$ and every vertex of the subtree is dominated (by vertices of the subtree).
- **B(v)** = min |D| such that $v \notin D$, some child of v is in D, and every vertex of the subtree is dominated.
- **C(v)** = min |D| such that $v \notin D$, **no** child of v is in D, and every vertex of the subtree **other than v** is dominated (v will have to be dominated by its parent).

Use $\infty$ for impossible. **Recurrences** (sums over children c of v):
$$A(v) = 1 + \sum_c \min\{A(c), B(c), C(c)\}$$
(v ∈ D dominates every child, so a child may be in state C.)
$$C(v) = \sum_c B(c)$$
(no child is in D, and v ∉ D can't dominate them, so each child must be dominated by its own child.)
$$B(v) = \sum_c \min\{A(c), B(c)\} + \max\Big\{0,\ \min_c\big(A(c) - \min\{A(c), B(c)\}\big)\Big\}$$
(each child is either in D or dominated from below; at least one child must be in D, so if the cheapest choice puts no child in D we pay the smallest extra cost of switching one child to A.)

**Leaves:** A = 1, B = $\infty$ (no children), C = 0.

**Answer:** $\min\{A(r), B(r)\}$ — the root has no parent, so state C is not allowed.

**Correctness** follows by induction on subtree height: the three states partition all valid partial solutions according to v's status, and the conditions on children listed above are exactly those needed for every vertex in the subtree (except possibly v in state C) to be dominated.

**Evaluation:** postorder, storing three numbers per vertex. Each vertex does O(1 + #children) work, so the total is O(n) time and space.

Sanity check, a path r – x – y rooted at r: y: (A, B, C) = (1, ∞, 0); x: A = 1 + 0 = 1, B = 1 + 0 = 1, C = ∞; r: A = 1 + 1 = 2, B = 1 + 0 = 1. Answer 1 ({x}). ✓`,
    },
    {
      id: 'dp2-matrix-chain', type: 'written', title: 'Matrix-chain multiplication', difficulty: 2,
      prompt: String.raw`Matrices $A_1, \dots, A_n$ have dimensions $d_{i-1}\times d_i$. (a) Give a five-part DP for the minimum number of scalar multiplications needed to compute the product. (b) Run it for $d = (40, 20, 30, 10, 30)$ and give an optimal parenthesization. (c) How would you print the parenthesization?`,
      rubric: ['Spec M(i, j)', 'Recurrence over split k with cost d_{i−1} d_k d_j, M(i, i) = 0', 'Order by increasing length, O(n³)', 'Example answer 26000 with parenthesization (A1 (A2 A3)) A4', 'Store split points and print recursively'],
      hints: ['The last multiplication performed is (A_i…A_k)(A_{k+1}…A_j) for some k.', 'Fill length-2 intervals first, then length 3, then length 4.'],
      solution: String.raw`**(a)**
1. **Spec.** M(i, j) = minimum number of scalar multiplications to compute $A_i A_{i+1}\cdots A_j$ ($1 \le i \le j \le n$). Answer M(1, n).
2. **Recurrence.** $M(i,i) = 0$; for $i < j$, $M(i,j) = \min_{i\le k<j}\{M(i,k) + M(k+1,j) + d_{i-1}d_kd_j\}$ — the last product multiplies a $d_{i-1}\times d_k$ matrix by a $d_k \times d_j$ matrix, and the two sides should be computed optimally (they are independent).
3. **Memo.** M[1..n][1..n] (upper triangle), plus S[i][j] = best k.
4. **Order.** By increasing length $\ell = j - i$ from 0 to n − 1.
5. **Time/space.** $O(n^2)$ entries × O(n) = $O(n^3)$ time, $O(n^2)$ space.

**(b)** $d = (40, 20, 30, 10, 30)$, n = 4.
- Length 1: $M(1,2) = 40\cdot20\cdot30 = 24000$; $M(2,3) = 20\cdot30\cdot10 = 6000$; $M(3,4) = 30\cdot10\cdot30 = 9000$.
- $M(1,3) = \min(M(2,3) + 40\cdot20\cdot10,\ M(1,2) + 40\cdot30\cdot10) = \min(6000 + 8000,\ 24000 + 12000) = 14000$ (k = 1).
- $M(2,4) = \min(M(3,4) + 20\cdot30\cdot30,\ M(2,3) + 20\cdot10\cdot30) = \min(9000+18000,\ 6000+6000) = 12000$ (k = 3).
- $M(1,4) = \min(M(2,4) + 40\cdot20\cdot30,\ M(1,2)+M(3,4) + 40\cdot30\cdot30,\ M(1,3) + 40\cdot10\cdot30)$ $= \min(12000 + 24000,\ 24000 + 9000 + 36000,\ 14000 + 12000) = \min(36000, 69000, 26000) = $ **26000** (k = 3).

Optimal: $(A_1(A_2A_3))A_4$.

**(c)** Print(i, j): if i = j print "A_i"; else print "(", Print(i, S[i][j]), Print(S[i][j]+1, j), ")". O(n) time.`,
    },
    {
      id: 'dp2-optimal-bst', type: 'written', title: 'Optimal binary search tree', difficulty: 3,
      prompt: String.raw`Sorted keys $k_1 < \cdots < k_n$ have search frequencies $f[1..n]$. The cost of a BST is $\sum_i f[i]\cdot\text{depth}(k_i)$ with the root at depth 1. (a) Derive a recurrence for the minimum cost, explaining where every term comes from. (b) Give the memo structure, evaluation order and running time. (c) Compute the optimal cost for f = (4, 2, 6, 3) and draw the optimal tree. (d) Show that choosing the most frequent key as the root can be suboptimal.`,
      rubric: ['Spec Opt(i, j) for key intervals, with empty interval = 0', 'Derivation of the F(i, j) term', 'Order by increasing length; O(n³) with prefix sums', 'Example cost 26 with root k3', 'Valid greedy counterexample'],
      hints: ['If $k_r$ is the root of the subtree for keys i..j, its left subtree holds keys i..r−1 and right subtree keys r+1..j.', 'Every key in the subtree is one level deeper than it would be in its own sub-subtree.'],
      solution: String.raw`**(a)** Let Opt(i, j) = minimum cost of a BST on keys $k_i..k_j$ (with its root at depth 1); Opt(i, i−1) = 0. If $k_r$ is the root, the left subtree is a BST on $k_i..k_{r-1}$ and the right on $k_{r+1}..k_j$. Measured within the whole tree, each key in a subtree is one level deeper than when measured within that subtree, so the cost is
$$f[r]\cdot 1 + \big(\text{cost}_L + \textstyle\sum_{k=i}^{r-1} f[k]\big) + \big(\text{cost}_R + \sum_{k=r+1}^{j} f[k]\big) = F(i,j) + \text{cost}_L + \text{cost}_R.$$
The subtrees can be optimized independently, so
$$\text{Opt}(i,j) = F(i,j) + \min_{i\le r\le j}\big(\text{Opt}(i,r-1) + \text{Opt}(r+1,j)\big), \quad F(i,j) = \sum_{k=i}^{j}f[k].$$
Answer Opt(1, n).

**(b)** Table Opt[1..n+1][0..n]; prefix sums $P[j] = f[1] + \dots + f[j]$ make $F(i,j) = P[j] - P[i-1]$ O(1). Fill by increasing length j − i (or i from n down to 1, j from i up to n). $O(n^2)$ entries, O(n) choices of r each: $O(n^3)$ time, $O(n^2)$ space.

**(c)** f = (4, 2, 6, 3).
- Singles: Opt = 4, 2, 6, 3.
- [1,2]: F = 6; roots: r=1: 0 + 2 = 2; r=2: 4 + 0 = 4 → 6 + 2 = **8** (root 1). [2,3]: F = 8; r=2: 6; r=3: 2 → **10** (root 3). [3,4]: F = 9; r=3: 3; r=4: 6 → **12** (root 3).
- [1,3]: F = 12; r=1: Opt(2,3) = 10; r=2: 4 + 6 = 10; r=3: Opt(1,2) = 8 → 12 + 8 = **20** (root 3). [2,4]: F = 11; r=2: 12; r=3: 2 + 3 = 5; r=4: 10 → **16** (root 3).
- [1,4]: F = 15; r=1: 16; r=2: 4 + 12 = 16; r=3: 8 + 3 = 11; r=4: 20 → 15 + 11 = **26** (root 3).

Optimal tree: root $k_3$; left child $k_1$ with right child $k_2$; right child $k_4$. Check: $6\cdot1 + 4\cdot2 + 3\cdot2 + 2\cdot3 = 6 + 8 + 6 + 6 = 26$ ✓.

**(d)** f = (3, 3, 4): greedy roots at $k_3$, then $k_1$ or $k_2$ below: cost $4 + 3\cdot2 + 3\cdot3 = 19$. Rooting at $k_2$: $3 + 3\cdot2 + 4\cdot2 = 17 < 19$.`,
    },
    {
      id: 'dp2-plus-minus', type: 'written', title: 'Maximize an expression with + and −', difficulty: 3,
      prompt: String.raw`You are given an arithmetic expression $x_0\ \text{op}_1\ x_1\ \text{op}_2\ \cdots\ \text{op}_n\ x_n$ where each $x_i$ is an integer and each $\text{op}_i \in \{+, -\}$. Describe and analyze an algorithm that computes the **maximum** value obtainable by fully parenthesizing the expression. For example, $1 - 2 + 3 - 4 + 5$ has maximum value 5, via $1 - (2 + (3 - (4 + 5)))$.`,
      rubric: ['Recognizes need for both Max and Min of subexpressions', 'English specs for Max(i, j), Min(i, j)', 'Correct recurrences for + and − splits, and base cases', 'Interval evaluation order', 'O(n³) time, O(n²) space'],
      hints: ['The last operation evaluated splits the expression into a left and a right part.', 'To maximize L − R you want L large and R small.'],
      solution: String.raw`1. **Spec.** For $0 \le i \le j \le n$: Max(i, j) and Min(i, j) are the maximum and minimum values obtainable by fully parenthesizing the subexpression $x_i\ \text{op}_{i+1}\cdots\text{op}_j\ x_j$. Answer Max(0, n).
2. **Recurrence.** Max(i, i) = Min(i, i) = $x_i$. For $i < j$, the last operation evaluated is some $\text{op}_{k+1}$ with $i \le k < j$, combining a parenthesization of (i, k) with one of (k+1, j); the two sides can be chosen independently. Since $a + b$ is increasing in both arguments and $a - b$ is increasing in a and decreasing in b:
$$\text{Max}(i,j) = \max_{i\le k<j}\begin{cases}\text{Max}(i,k) + \text{Max}(k+1,j) & \text{op}_{k+1} = +\\ \text{Max}(i,k) - \text{Min}(k+1,j) & \text{op}_{k+1} = -\end{cases}$$
$$\text{Min}(i,j) = \min_{i\le k<j}\begin{cases}\text{Min}(i,k) + \text{Min}(k+1,j) & \text{op}_{k+1} = +\\ \text{Min}(i,k) - \text{Max}(k+1,j) & \text{op}_{k+1} = -\end{cases}$$
3. **Memo.** Two 2D arrays Max[0..n][0..n], Min[0..n][0..n].
4. **Order.** By increasing length j − i; both tables are filled together (each entry reads only strictly shorter intervals).
5. **Time/space.** $O(n^2)$ entries × O(n) splits: $O(n^3)$ time, $O(n^2)$ space.

**Example check.** For $1 - 2 + 3 - 4 + 5$: Min of "$3 - 4 + 5$" is $3 - (4+5) = -6$; Min of "$2 + 3 - 4 + 5$" is $2 + (-6) = -4$; so Max(0, 4) ≥ $1 - (-4) = 5$, and the DP confirms 5 is the maximum.

(If × is also allowed, products of negatives can flip signs, so take the max/min over all four combinations Max·Max, Max·Min, Min·Max, Min·Min — the extremes of a bilinear function over a box occur at corners.)`,
    },
    {
      id: 'dp2-weighted-intervals', type: 'written', title: 'Weighted interval scheduling', difficulty: 3,
      prompt: String.raw`You are given n intervals; interval i is $[s_i, f_i)$ with weight $w_i > 0$. Two intervals are compatible if they don't overlap (touching endpoints are fine: $f_i \le s_j$). Find the maximum total weight of a set of pairwise compatible intervals. Give an $O(n\log n)$ algorithm with a full DP solution. Why doesn't the greedy "earliest finish time" algorithm work here?`,
      rubric: ['Sort by finish time; define p(j) correctly', 'Spec OPT(j) on the first j intervals', 'Recurrence max(OPT(j−1), w_j + OPT(p(j))) with OPT(0) = 0, justified', 'Computing all p(j) by binary search in O(n log n)', 'Greedy counterexample'],
      hints: ['After sorting by finish time, if interval j is chosen, which of the earlier intervals remain usable?', 'p(j) = largest i < j with f_i ≤ s_j; find it by binary search on the sorted finish times.'],
      solution: String.raw`Sort the intervals so that $f_1 \le f_2 \le \dots \le f_n$. Define $p(j)$ = the largest index $i < j$ with $f_i \le s_j$ (0 if none). Since finish times are sorted, every $i \le p(j)$ has $f_i \le f_{p(j)} \le s_j$, so intervals $1..p(j)$ are all compatible with j. Every i with $p(j) < i < j$ has $f_i > s_j$ (by the choice of p(j)) and $s_i < f_i \le f_j$, so $[s_i, f_i)$ overlaps $[s_j, f_j)$: these intervals are all incompatible with j.

1. **Spec.** OPT(j) = maximum total weight of a compatible subset of intervals 1..j. Answer OPT(n).
2. **Recurrence.** OPT(0) = 0; for $j \ge 1$:
$$\text{OPT}(j) = \max\{\text{OPT}(j-1),\ w_j + \text{OPT}(p(j))\}.$$
Either interval j is not in the optimal subset of 1..j, or it is, and then the others are a compatible subset of 1..p(j) (by the observation above), which should be optimal.
3. **Memo.** Array OPT[0..n] and array p[1..n].
4. **Order.** j from 0 up to n.
5. **Time.** Sorting $O(n\log n)$; each p(j) by binary search over $f_1..f_{j-1}$ for the last $f_i \le s_j$: $O(\log n)$, total $O(n\log n)$; the DP is O(n). Overall $O(n\log n)$ time, O(n) space.

**Greedy fails** with weights: intervals [0, 2) of weight 1 and [1, 10) of weight 100. Earliest finish picks [0, 2) and then can't take [1, 10): total 1 versus 100. (Greedy is optimal only when all weights are equal.)`,
    },
    {
      id: 'dp2-string-cutting', type: 'written', title: 'Cheapest way to cut a string', difficulty: 3,
      prompt: String.raw`A string-processing library can cut a string of length L into two pieces at any position at a cost of L (the length of the piece being cut). You must cut a string of length n at positions $0 < c_1 < c_2 < \dots < c_m < n$ (all of them), in some order. Describe and analyze an algorithm that finds the minimum total cost. Example: n = 10 and cuts at 2, 4, 7: cutting left to right costs 10 + 8 + 6 = 24, but the optimum is 20.`,
      rubric: ['Adds sentinels c_0 = 0 and c_{m+1} = n', 'Spec Cost(i, j) for the piece between consecutive-index cut points', 'Recurrence over the first cut k in (i, j), with base case j = i + 1', 'Increasing-length order; O(m³) time, O(m²) space', 'Example optimum 20 via cutting at 4 first'],
      hints: ['After the first cut at $c_k$, the two pieces are independent subproblems.', String.raw`Use pairs of cut indices (i, j) to describe pieces: the piece from $c_i$ to $c_j$.`],
      solution: String.raw`Let $c_0 = 0$ and $c_{m+1} = n$. Every piece that ever exists runs between two cut points $c_i$ and $c_j$.

1. **Spec.** For $0 \le i < j \le m+1$: Cost(i, j) = minimum total cost of making all the cuts $c_{i+1}, \dots, c_{j-1}$ in the piece from $c_i$ to $c_j$. Answer Cost(0, m+1).
2. **Recurrence.**
$$\text{Cost}(i,j) = \begin{cases}0 & j = i+1\\ (c_j - c_i) + \min_{i<k<j}\big(\text{Cost}(i,k) + \text{Cost}(k,j)\big) & j > i+1\end{cases}$$
The first cut in this piece is at some $c_k$ and costs the piece's length $c_j - c_i$; afterwards the two pieces are cut independently.
3. **Memo.** Cost[0..m+1][0..m+1].
4. **Order.** By increasing $j - i$.
5. **Time/space.** $O(m^2)$ entries × O(m) = $O(m^3)$ time, $O(m^2)$ space. (Independent of n.)

**Example.** c = (0, 2, 4, 7, 10). Length-2 intervals: Cost(0,2) = 4, Cost(1,3) = 5, Cost(2,4) = 6. Cost(0,3) = 7 + min(Cost(1,3), Cost(0,2)) = 7 + 4 = 11; Cost(1,4) = 8 + min(Cost(2,4), Cost(1,3)) = 8 + 5 = 13. Cost(0,4) = 10 + min(k=1: 0 + 13, k=2: 4 + 6, k=3: 11 + 0) = 10 + 10 = **20**: cut at 4 first (10), then the left piece at 2 (4) and the right piece at 7 (6).`,
    },
    {
      id: 'dp2-grid-coins', type: 'written', title: 'Robot on a grid', difficulty: 2,
      prompt: String.raw`An $m\times n$ grid has a coin value $c[i][j] \ge 0$ in each cell, and some cells are blocked. A robot starts at (1, 1) and must reach (m, n), moving only right or down, never entering a blocked cell. (a) Give a DP for the maximum total value collected (or report that (m, n) is unreachable). (b) Give a DP for the number of distinct valid paths. (c) Explain both as computations on a DAG.`,
      rubric: ['Spec on suffix paths from (i, j)', 'Correct recurrences with blocked/outside cells as −∞ (max) or 0 (count)', 'Correct base case at (m, n)', 'Valid order (i and j decreasing); O(mn)', 'DAG interpretation: longest path / path counting'],
      hints: ['From (i, j) the first move goes to (i+1, j) or (i, j+1).', 'For counting, replace max with + and −∞ with 0.'],
      solution: String.raw`**(a)** 1. **Spec.** Best(i, j) = the maximum total coin value of a valid path from (i, j) to (m, n) (including both endpoints' coins), or $-\infty$ if none exists. Answer Best(1, 1) (unreachable if $-\infty$).
2. **Recurrence.**
$$\text{Best}(i,j) = \begin{cases}-\infty & (i,j)\text{ blocked, or } i > m \text{ or } j > n\\ c[m][n] & (i,j) = (m,n)\\ c[i][j] + \max\{\text{Best}(i+1,j), \text{Best}(i,j+1)\} & \text{otherwise}\end{cases}$$
3. **Memo.** Best[1..m+1][1..n+1] (the extra row and column hold $-\infty$).
4. **Order.** i from m down to 1, j from n down to 1.
5. **Time/space.** $O(mn)$.

**(b)** Paths(i, j) = number of valid paths from (i, j) to (m, n): 0 if blocked or outside; 1 at (m, n) (if not blocked); otherwise Paths(i+1, j) + Paths(i, j+1). Same table shape, order and $O(mn)$ time. (Without blocked cells, Paths(1, 1) = $\binom{m+n-2}{m-1}$.)

**(c)** Vertices are the unblocked cells; edges go from each cell to its right and down neighbors; the graph is a DAG because every edge increases i + j. Best(1, 1) is a longest path from (1, 1) to (m, n) with vertex weights c, and Paths counts paths; the evaluation order (decreasing i, j) is a reverse topological order.`,
    },
    {
      id: 'dp2-knapsack-code', type: 'code', title: '0/1 knapsack', difficulty: 2,
      prompt: String.raw`Write <code>knapsack(W, wt, val)</code> returning the maximum total value of a subset of items with total weight at most W, where item i has weight <code>wt[i]</code> (positive integer) and value <code>val[i]</code> (nonnegative integer). Each item may be used at most once. Use the $O(nW)$ DP.`,
      fn: 'knapsack',
      starter: 'function knapsack(W, wt, val) {\n  // K[i][w] = best value using items i..n-1 with capacity w\n}\n',
      reference: function (W, wt, val) {
        const n = wt.length;
        let next = new Array(W + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) {
          const cur = next.slice();
          for (let w = wt[i]; w <= W; w++) cur[w] = Math.max(next[w], val[i] + next[w - wt[i]]);
          next = cur;
        }
        return next[W];
      },
      tests: [[10, [5, 4, 6, 3], [10, 40, 30, 50]], [0, [1], [5]], [50, [10, 20, 30], [60, 100, 120]], [5, [], []], [7, [1, 3, 4, 5], [1, 4, 5, 7]], [10, [6, 5, 5], [30, 20, 20]]],
      gen: () => {
        const n = Math.floor(Math.random() * 9);
        const wt = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 10));
        const val = Array.from({ length: n }, () => Math.floor(Math.random() * 21));
        return [Math.floor(Math.random() * 26), wt, val];
      },
      hints: ['K(n, w) = 0; K(i, w) = max(K(i+1, w), val[i] + K(i+1, w − wt[i])) when wt[i] ≤ w.', 'You only need the row for i+1 to compute row i.'],
      solution: String.raw`~~~js
function knapsack(W, wt, val) {
  const n = wt.length;
  let next = new Array(W + 1).fill(0);           // row i+1
  for (let i = n - 1; i >= 0; i--) {
    const cur = next.slice();                    // skip item i
    for (let w = wt[i]; w <= W; w++)
      cur[w] = Math.max(next[w], val[i] + next[w - wt[i]]);   // or take it
    next = cur;
  }
  return next[W];
}
~~~
$O(nW)$ time, $O(W)$ space. (A single array updated with w *decreasing* also works for 0/1 knapsack; updating with w increasing would allow reusing an item — the unbounded version.)`,
    },
    {
      id: 'dp2-tree-mis-code', type: 'code', title: 'Max-weight independent set in a tree', difficulty: 2,
      prompt: String.raw`A tree on vertices 0..n−1 (n ≥ 1) is given as a parent array: <code>parent[0] = -1</code> (vertex 0 is the root) and for every other v, <code>parent[v]</code> is v's parent. Vertex weights are <code>w[v] ≥ 0</code>. Write <code>treeMIS(parent, w)</code> returning the maximum total weight of an independent set (no two chosen vertices adjacent). Do not assume <code>parent[v] < v</code>.`,
      fn: 'treeMIS',
      starter: 'function treeMIS(parent, w) {\n  // In(v) = w[v] + sum Out(c);  Out(v) = sum max(In(c), Out(c))\n}\n',
      reference: function (parent, w) {
        const n = parent.length;
        const children = Array.from({ length: n }, () => []);
        let root = 0;
        for (let v = 0; v < n; v++) { if (parent[v] < 0) root = v; else children[parent[v]].push(v); }
        const order = [root];
        for (let k = 0; k < order.length; k++) for (const c of children[order[k]]) order.push(c);
        const inS = new Array(n).fill(0), outS = new Array(n).fill(0);
        for (let k = order.length - 1; k >= 0; k--) {
          const v = order[k];
          inS[v] = w[v];
          for (const c of children[v]) { inS[v] += outS[c]; outS[v] += Math.max(inS[c], outS[c]); }
        }
        return Math.max(inS[root], outS[root]);
      },
      tests: [[[-1], [7]], [[-1, 0, 1, 2], [1, 5, 1, 5]], [[-1, 0, 0, 1, 1, 2], [3, 5, 2, 4, 1, 6]], [[-1, 0, 0, 0], [10, 4, 4, 4]], [[-1, 0, 0, 0], [5, 2, 2, 2]], [[2, 2, -1, 0], [4, 1, 3, 6]]],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 12);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const parent = new Array(n).fill(-1);
        for (let i = 1; i < n; i++) parent[perm[i]] = perm[Math.floor(Math.random() * i)];
        const w = Array.from({ length: n }, () => Math.floor(Math.random() * 11));
        return [parent, w];
      },
      hints: ['Build children lists from the parent array and find the root (parent −1).', 'Get a BFS order from the root; processing it in reverse guarantees children before parents.'],
      solution: String.raw`~~~js
function treeMIS(parent, w) {
  const n = parent.length;
  const children = Array.from({ length: n }, () => []);
  let root = 0;
  for (let v = 0; v < n; v++) {
    if (parent[v] < 0) root = v; else children[parent[v]].push(v);
  }
  const order = [root];                       // BFS order: parents before children
  for (let k = 0; k < order.length; k++)
    for (const c of children[order[k]]) order.push(c);
  const inS = new Array(n).fill(0), outS = new Array(n).fill(0);
  for (let k = order.length - 1; k >= 0; k--) {   // reverse BFS = children first
    const v = order[k];
    inS[v] = w[v];
    for (const c of children[v]) {
      inS[v] += outS[c];
      outS[v] += Math.max(inS[c], outS[c]);
    }
  }
  return Math.max(inS[root], outS[root]);
}
~~~
O(n) time and space. Reverse BFS order avoids deep recursion on path-like trees.`,
    },
    {
      id: 'dp2-matrix-chain-code', type: 'code', title: 'Matrix-chain order', difficulty: 2,
      prompt: String.raw`Write <code>matrixChain(d)</code>: given dimensions $d = [d_0, d_1, \dots, d_n]$ ($n \ge 1$) where matrix $A_i$ is $d_{i-1}\times d_i$, return the minimum number of scalar multiplications needed to compute $A_1\cdots A_n$.`,
      fn: 'matrixChain',
      starter: 'function matrixChain(d) {\n  // M[i][j] = min cost for A_i..A_j\n}\n',
      reference: function (d) {
        const n = d.length - 1;
        const M = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
        for (let len = 1; len < n; len++) {
          for (let i = 1; i + len <= n; i++) {
            const j = i + len;
            let best = Infinity;
            for (let k = i; k < j; k++) best = Math.min(best, M[i][k] + M[k + 1][j] + d[i - 1] * d[k] * d[j]);
            M[i][j] = best;
          }
        }
        return n >= 1 ? M[1][n] : 0;
      },
      tests: [[[10, 30, 5, 60]], [[40, 20, 30, 10, 30]], [[10, 20, 30, 40, 30]], [[10, 20, 30]], [[5, 10]], [[1, 2, 3, 4, 3]]],
      gen: () => [Array.from({ length: 2 + Math.floor(Math.random() * 7) }, () => 1 + Math.floor(Math.random() * 20))],
      hints: ['M(i, i) = 0; M(i, j) = min over k of M(i, k) + M(k+1, j) + d[i−1]·d[k]·d[j].', 'Fill by increasing chain length.'],
      solution: String.raw`~~~js
function matrixChain(d) {
  const n = d.length - 1;
  const M = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let len = 1; len < n; len++)
    for (let i = 1; i + len <= n; i++) {
      const j = i + len;
      let best = Infinity;
      for (let k = i; k < j; k++)
        best = Math.min(best, M[i][k] + M[k + 1][j] + d[i - 1] * d[k] * d[j]);
      M[i][j] = best;
    }
  return M[1][n];
}
~~~
$O(n^3)$ time, $O(n^2)$ space. Expected: [10, 30, 5, 60] → 4500, [40, 20, 30, 10, 30] → 26000.`,
    },
    {
      id: 'dp2-max-expression-code', type: 'code', title: 'Maximize a parenthesized expression', difficulty: 3,
      prompt: String.raw`Write <code>maxExpression(nums, ops)</code>: <code>nums</code> has $n + 1 \ge 1$ integers and <code>ops</code> has n operators, each <code>'+'</code>, <code>'-'</code> or <code>'*'</code>, representing <code>nums[0] ops[0] nums[1] ops[1] ... nums[n]</code>. Return the maximum value obtainable by fully parenthesizing the expression. Example: <code>[1, 2, 3]</code> with <code>['+', '*']</code> gives 9, from (1 + 2) · 3.`,
      fn: 'maxExpression',
      starter: 'function maxExpression(nums, ops) {\n  // track both Max[i][j] and Min[i][j]\n}\n',
      reference: function (nums, ops) {
        const n = nums.length;
        const MX = [], MN = [];
        for (let i = 0; i < n; i++) { MX.push(new Array(n).fill(0)); MN.push(new Array(n).fill(0)); MX[i][i] = nums[i]; MN[i][i] = nums[i]; }
        for (let len = 2; len <= n; len++) {
          for (let i = 0; i + len - 1 < n; i++) {
            const j = i + len - 1;
            let hi = -Infinity, lo = Infinity;
            for (let k = i; k < j; k++) {
              const op = ops[k];
              for (const a of [MX[i][k], MN[i][k]]) for (const b of [MX[k + 1][j], MN[k + 1][j]]) {
                const v = op === '+' ? a + b : op === '-' ? a - b : a * b;
                if (v > hi) hi = v;
                if (v < lo) lo = v;
              }
            }
            MX[i][j] = hi; MN[i][j] = lo;
          }
        }
        return MX[0][n - 1];
      },
      tests: [[[1, 2, 3], ['+', '*']], [[5], []], [[1, 2, 3, 4, 5], ['-', '+', '-', '+']], [[2, 3, 4], ['-', '*']], [[-1, 2, -3], ['*', '*']], [[6, 1, 3, 2, 4], ['-', '-', '+', '-']], [[1, 5, 7, 2, 3], ['-', '*', '-', '*']]],
      gen: () => {
        const n = Math.floor(Math.random() * 7);
        const nums = Array.from({ length: n + 1 }, () => Math.floor(Math.random() * 10));
        const ops = Array.from({ length: n }, () => ['+', '-', '*'][Math.floor(Math.random() * 3)]);
        return [nums, ops];
      },
      hints: ['Split at the last operator evaluated: ops[k] combines nums[i..k] and nums[k+1..j].', 'For each side keep both the max and the min; the best combination is always among the four (max/min) × (max/min) pairs.'],
      solution: String.raw`~~~js
function maxExpression(nums, ops) {
  const n = nums.length;
  const MX = [], MN = [];
  for (let i = 0; i < n; i++) {
    MX.push(new Array(n).fill(0)); MN.push(new Array(n).fill(0));
    MX[i][i] = MN[i][i] = nums[i];
  }
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let hi = -Infinity, lo = Infinity;
      for (let k = i; k < j; k++)
        for (const a of [MX[i][k], MN[i][k]])
          for (const b of [MX[k + 1][j], MN[k + 1][j]]) {
            const v = ops[k] === '+' ? a + b : ops[k] === '-' ? a - b : a * b;
            hi = Math.max(hi, v); lo = Math.min(lo, v);
          }
      MX[i][j] = hi; MN[i][j] = lo;
    }
  return MX[0][n - 1];
}
~~~
For fixed op, $a + b$, $a - b$ and $a\cdot b$ are each monotone in a for fixed b (and vice versa), so their extremes over $[\text{Min}, \text{Max}]^2$ are attained at corners. $O(n^3)$ time, $O(n^2)$ space.`,
    },
    {
      id: 'dp2-unbounded-exact', type: 'written', title: 'Unbounded and exact-capacity knapsack', difficulty: 2,
      prompt: String.raw`There are n item types; type i has integer weight $w_i > 0$ and value $v_i \ge 0$, and **unlimited copies** of each type are available.
(a) Give a DP for the maximum value of a multiset of items with total weight **at most** W.
(b) Give a DP for the maximum value with total weight **exactly** W (report impossibility).
(c) Why does one parameter suffice here, while 0/1 knapsack needs two?
(d) Evaluate both for weights (4, 6), values (5, 8) and W = 9, and again for W = 10.`,
      rubric: ['Spec U(w) for capacity w (at most) and X(w) (exactly)', 'Recurrences over the item type of one copy; base cases U(0) = 0, X(0) = 0, max∅ = 0 vs −∞', 'Order w increasing; O(nW) time, O(W) space; pseudo-polynomial', 'Explanation: all types stay available after removing one copy', 'Example: W = 9 → 10 and impossible; W = 10 → 13 and 13'],
      hints: ['Remove one copy of some item from an optimal multiset. What is left?', 'For "exactly", impossible capacities must carry −∞, and the empty multiset only achieves weight 0.'],
      solution: String.raw`**(a)**
1. **Spec.** For $0 \le w \le W$, U(w) = the maximum value of a multiset of items with total weight at most w. Answer U(W).
2. **Recurrence.** $U(w) = \max\big(\{0\} \cup \{v_i + U(w - w_i) : w_i \le w\}\big)$. Either the multiset is empty (value 0), or it contains a copy of some type i; removing it leaves a multiset of weight at most $w - w_i$, which should be optimal.
3. **Memo.** Array U[0..W].
4. **Order.** w from 0 up to W.
5. **Time/space.** $O(nW)$ time, $O(W)$ space — pseudo-polynomial.

**(b)** X(w) = the maximum value of a multiset with total weight **exactly** w, or $-\infty$ if none exists. X(0) = 0 and, for $w \ge 1$, $X(w) = \max\{v_i + X(w - w_i) : w_i \le w\}$ with $\max\emptyset = -\infty$. (No "0" option: the empty multiset has weight 0, not w.) Same order and time; report "impossible" if $X(W) = -\infty$.

**(c)** In 0/1 knapsack, after deciding item i, the remaining problem may only use items i+1..n, so the subproblem must record which items remain. With unlimited copies, every type remains available after removing one copy, so the remaining capacity is the only thing that changes.

**(d)** Weights (4, 6), values (5, 8).
- W = 9: U(9) = **10** (two copies of the weight-4 item, weight 8). Exactly 9 is impossible — all weights are even — so X(9) = $-\infty$.
- W = 10: U(10) = X(10) = **13** (one of each, weight 10). Two 4s (value 10) and one 6 alone (8) are worse.`,
    },
    {
      id: 'dp2-knapsack-two', type: 'written', title: 'Knapsack with weight and volume limits', difficulty: 2,
      prompt: String.raw`Each of n items has an integer weight $w_i$, an integer volume $u_i$ and a value $g_i$. Choose a subset of items with total weight at most W **and** total volume at most V, maximizing total value (each item at most once). Give a five-part DP, analyze it, and run it on W = 10, V = 8 with items (weight, volume, value) = (4, 5, 10), (5, 2, 8), (3, 4, 7), (6, 3, 12).`,
      rubric: ['Three-parameter spec K(i, w, u)', 'Recurrence with skip/take, take only if both resources suffice', 'Base case and order (i decreasing)', 'O(nWV) time, pseudo-polynomial', 'Example answer 22 (items 1 and 4)'],
      hints: ['Each resource that is consumed needs its own parameter.', 'Taking item i reduces both remaining capacities.'],
      solution: String.raw`1. **Spec.** For $1 \le i \le n+1$, $0 \le w \le W$, $0 \le u \le V$: K(i, w, u) = the maximum value of a subset of items i..n with total weight at most w and total volume at most u. Answer K(1, W, V).
2. **Recurrence.** K(n+1, w, u) = 0. For $i \le n$:
$$K(i,w,u) = \max\begin{cases}K(i+1, w, u)\\ g_i + K(i+1, w - w_i, u - u_i) & \text{if } w_i \le w \text{ and } u_i \le u\end{cases}$$
An optimal subset either omits item i or contains it; in the second case the rest is an optimal subset of items i+1..n within the reduced capacities.
3. **Memo.** 3D array K[1..n+1][0..W][0..V].
4. **Order.** i from n + 1 down to 1 (each layer reads only layer i + 1); w and u in any order.
5. **Time/space.** $O(nWV)$ time; $O(nWV)$ space, or $O(WV)$ keeping two layers. **Pseudo-polynomial** in both W and V.

**Example.** Items 1 and 4: weight 4 + 6 = 10, volume 5 + 3 = 8, value **22**. Every other feasible pair is worse (2 + 3: 15; 1 + 2: 18; 3 + 4: 19), the pairs 1 + 3 (volume 9) and 2 + 4 (weight 11) don't fit, and no three items fit (the lightest three weigh 12).`,
    },
    {
      id: 'dp2-tree-vertex-cover', type: 'written', title: 'Minimum-weight vertex cover in a tree', difficulty: 2,
      prompt: String.raw`A **vertex cover** of a graph contains at least one endpoint of every edge. Given a tree with vertex costs $c(v) > 0$:
(a) Give a complete DP solution for the minimum total cost of a vertex cover, and run it on the path a – b – c – d with costs 1, 5, 5, 1.
(b) For **unweighted** trees, the greedy "put the parent of some leaf into the cover, delete it and the covered edges, repeat" is optimal. Show that the analogous greedy fails with weights.`,
      rubric: ['Rooted tree, two functions per vertex with subtree-relative specs', 'Recurrences: In = c(v) + Σ min(In, Out), Out = Σ In(child); leaf base cases', 'Answer min at the root; postorder; O(n)', 'Path example: 6', 'Weighted counterexample to the leaf-parent greedy'],
      hints: ['If v is not in the cover, which vertices must be?', 'For (b), think of a star with an expensive center.'],
      solution: String.raw`**(a)** Root the tree at any vertex r.
1. **Spec.** For each vertex v: In(v) = the minimum cost of a set of vertices in v's subtree that contains v and covers every edge of v's subtree; Out(v) = the same with v **not** in the set. Answer $\min\{\text{In}(r), \text{Out}(r)\}$.
2. **Recurrence.**
$$\text{In}(v) = c(v) + \sum_{u \text{ child of } v}\min\{\text{In}(u), \text{Out}(u)\}, \qquad \text{Out}(v) = \sum_{u \text{ child of } v}\text{In}(u)$$
Leaves: In = c(v), Out = 0. If v is in the set, all edges from v to its children are covered and each child's subtree is an independent subproblem. If v is not, each edge (v, u) must be covered by u.
3. **Memo.** Two numbers stored at each vertex.
4. **Order.** Postorder.
5. **Time/space.** O(1 + #children) per vertex: O(n) total.

**Path a – b – c – d, costs 1, 5, 5, 1**, rooted at a: d = (1, 0); c = (5 + min(1, 0), In(d)) = (5, 1); b = (5 + min(5, 1), In(c)) = (6, 5); a = (1 + min(6, 5), In(b)) = (6, 6). Answer **6**. Tracing In(a) = 6: a is in, b takes its cheaper state Out(b) = 5, which forces c in, and d then takes its cheaper state (out): the cover {a, c}. ({b, d} is another optimum.)

**(b)** A star: center x with cost 10 and three leaves of cost 1. The greedy puts the leaves' parent x into the cover: cost 10. Taking the three leaves instead costs 3. (The unweighted greedy works because there a leaf's parent covers at least as many edges as the leaf at the same cost; with weights that exchange argument breaks.)`,
    },
    {
      id: 'dp2-tree-matching', type: 'written', title: 'Maximum-weight matching in a tree', difficulty: 3,
      prompt: String.raw`A **matching** is a set of edges, no two sharing an endpoint. Given a tree whose edges have positive weights, describe and analyze an O(n) algorithm for the maximum total weight of a matching. Run it on the tree rooted at a with children b, c; b's children d, e; c's child f; f's child g; edge weights ab = 4, ac = 3, bd = 2, be = 5, cf = 6, fg = 1.`,
      rubric: ['Two functions per vertex: v free (unmatched within its subtree) vs unrestricted', 'Correct recurrence: Best(v) = max(Free(v), max over children of matching v with c)', 'O(1) per child via Free(v) − Best(c) + Free(c) trick (or equivalent), O(n) total', 'Postorder, answer Best(root)', 'Example answer 11'],
      hints: ['The parent of v can only use edge (parent, v) if v is not matched inside its own subtree.', 'If v is matched to child c, then c must be free in its subtree and every other child is unrestricted.'],
      solution: String.raw`Root the tree at r. For each vertex v:

1. **Spec.** Free(v) = the maximum weight of a matching using only edges inside v's subtree in which **v is unmatched**; Best(v) = the maximum weight of any matching inside v's subtree. Answer Best(r).
2. **Recurrence.**
$$\text{Free}(v) = \sum_{c \text{ child}} \text{Best}(c), \qquad \text{Best}(v) = \max\Big\{\text{Free}(v),\ \max_{c \text{ child}}\big(w(v,c) + \text{Free}(c) + \text{Free}(v) - \text{Best}(c)\big)\Big\}$$
*Justification.* If v is unmatched, the children's subtrees are independent: sum of their best values. Otherwise v is matched to exactly one child c by edge (v, c): then c must be unmatched inside its subtree (Free(c)), and every other child c' contributes Best(c'). That sum equals $\text{Free}(v) - \text{Best}(c)$. Leaves: Free = Best = 0.
3. **Memo.** Two numbers per vertex.
4. **Order.** Postorder.
5. **Time/space.** Computing Free(v) and then the max over children costs O(1 + #children(v)): O(n) total. (Recomputing the sum over "other children" for each c would cost $O(\deg^2)$ per vertex — the subtraction trick avoids it.)

**Example.** (Free, Best): g = (0, 0); f = (0, max(0, 1 + 0 + 0 − 0)) = (0, 1); c = (Best(f) = 1, max(1, 6 + 0 + 1 − 1)) = (1, 6); d = e = (0, 0); b = (0, max(0, 2, 5)) = (0, 5); a: Free = 5 + 6 = 11, Best = max(11, 4 + Free(b) + 11 − Best(b) = 4 + 0 + 6 = 10, 3 + Free(c) + 11 − Best(c) = 3 + 1 + 5 = 9) = **11**: the matching {be, cf}.`,
    },
    {
      id: 'dp2-tree-colorings', type: 'written', title: 'Counting list colorings of a tree', difficulty: 3,
      prompt: String.raw`A tree T has n vertices; each vertex v has a list $L(v) \subseteq \{1, \dots, k\}$ of allowed colors. A **proper list coloring** assigns each vertex a color from its list so that adjacent vertices get different colors. (a) Describe and analyze an $O(nk)$-time algorithm that counts the proper list colorings. (b) Show that when every list is $\{1, \dots, k\}$ the answer is $k(k-1)^{n-1}$. (c) Count the colorings of the path a – b – c with L(a) = {1, 2}, L(b) = {1, 2, 3}, L(c) = {1}.`,
      rubric: ['Spec C(v, c): colorings of v\'s subtree with v colored c', 'Product over children of (S(u) − C(u, c)) and the list indicator', 'Answer S(root); postorder', 'O(nk) time analysis (not O(nk²))', 'Closed form via the recurrence or a direct argument; example answer 3'],
      hints: ['Fix the color of v. The children\'s subtrees are then colored independently — multiply.', 'The number of colorings of u\'s subtree in which u avoids color c is S(u) − C(u, c).'],
      solution: String.raw`**(a)** Root T at r.
1. **Spec.** For each vertex v and color $1 \le c \le k$: C(v, c) = the number of proper list colorings of v's subtree in which v gets color c. Let $S(v) = \sum_{c} C(v, c)$. Answer S(r).
2. **Recurrence.**
$$C(v, c) = [c \in L(v)] \cdot \prod_{u \text{ child of } v} \big(S(u) - C(u, c)\big)$$
Once v's color is fixed to c, the only constraint between v and child u is that u's color differs from c; the colorings of u's subtree with u ≠ c number $S(u) - C(u,c)$, and different children's subtrees are independent, so the counts **multiply**. Leaves: C(v, c) = [c ∈ L(v)].
3. **Memo.** An array of k numbers (plus S) stored at each vertex.
4. **Order.** Postorder.
5. **Time/space.** At v, each of the k colors needs one factor per child: $O(k(1 + \#\text{children}))$, so $O(nk)$ total; $O(nk)$ space. (Summing over the child's colors $c' \ne c$ explicitly would cost $O(nk^2)$.)

**(b)** By induction on height, C(v, c) is the same for every c when all lists are full; write it $a_v$, so $S(v) = k a_v$. Then $a_v = \prod_u (k a_u - a_u) = \prod_u (k-1) a_u$. With $a = 1$ at leaves, $a_v = (k-1)^{(\text{size of } v\text{'s subtree}) - 1}$, so $S(r) = k(k-1)^{n-1}$. (Directly: color the root in k ways and each other vertex, top-down, in k − 1 ways avoiding its parent.)

**(c)** Root at a. c: C(c, ·) = (1, 0, 0), S(c) = 1. b: C(b, 1) = S(c) − C(c, 1) = 0, C(b, 2) = 1, C(b, 3) = 1, S(b) = 2. a: C(a, 1) = S(b) − C(b, 1) = 2, C(a, 2) = S(b) − C(b, 2) = 1, C(a, 3) = 0 (3 ∉ L(a)). Answer S(a) = **3**: (a, b, c) = (1, 2, 1), (1, 3, 1), (2, 3, 1).`,
    },
    {
      id: 'dp2-tree-diameter', type: 'written', title: 'Diameter of a weighted tree', difficulty: 2,
      prompt: String.raw`The **diameter** of a tree with nonnegative edge lengths is the maximum length of a path between two vertices. Describe and analyze an O(n) DP that computes it. Run it on the tree rooted at a with children b, c; b's children d, e; c's child f; f's child g; lengths ab = 4, ac = 3, bd = 2, be = 5, cf = 6, fg = 1. Why is "twice the longest root-to-leaf path" wrong?`,
      rubric: ['Spec Down(v): longest path from v down into its subtree', 'Recurrence for Down and combination of the two largest child values at each vertex', 'Answer = max over all vertices (the path\'s highest vertex)', 'O(n) postorder', 'Example answer 19; explanation of the wrong shortcut'],
      hints: ['Every path has a unique highest vertex v; the path goes down from v into at most two different child subtrees.', 'Keep the two largest values of ℓ(v, c) + Down(c) over the children c.'],
      solution: String.raw`Root the tree at r. Every path has a unique vertex closest to the root (its highest vertex) v, and consists of at most two downward paths from v into the subtrees of **different** children.

1. **Spec.** For each vertex v: Down(v) = the maximum length of a path that starts at v and goes down into v's subtree (0 for a leaf). Through(v) = the maximum length of a path whose highest vertex is v. Answer $\max_v \text{Through}(v)$.
2. **Recurrence.** For each child c, let $h_c = \ell(v, c) + \text{Down}(c)$. Then $\text{Down}(v) = \max(\{0\} \cup \{h_c\})$, and Through(v) = the sum of the two largest values in the multiset $\{h_c\} \cup \{0, 0\}$ (padding with zeros handles vertices with fewer than two children).
3. **Memo.** Two numbers per vertex (or just Down plus a global max).
4. **Order.** Postorder.
5. **Time/space.** O(1 + #children) per vertex: O(n).

**Example.** Down: d = e = g = 0; f = 1; c = ℓ(c, f) + Down(f) = 6 + 1 = 7; b = max(2 + 0, 5 + 0) = 5; a = max(4 + 5, 3 + 7) = 10. Through(a) = (4 + 5) + (3 + 7) = **19** — the path e – b – a – c – f – g. (Through(b) = 5 + 2 = 7, Through(c) = 7, others smaller.)

**Why 2 × (longest root path) is wrong:** the two halves of a path must go into *different* child subtrees — for a path a – b – c rooted at a, the longest root path has length 2 but the diameter is 2, not 4 — and the best path need not pass through the root at all (it may live entirely inside one child's subtree). The DP takes the sum of the two best *different* children, and the max over all highest vertices, for exactly these reasons.`,
    },
    {
      id: 'dp2-boolean-paren', type: 'written', title: 'Ways to parenthesize a Boolean expression to TRUE', difficulty: 3,
      prompt: String.raw`You are given a Boolean expression $s_1\ \text{op}_1\ s_2\ \text{op}_2\ \cdots\ \text{op}_{n-1}\ s_n$ where each $s_i \in \{T, F\}$ and each operator is $\wedge$ (and), $\vee$ (or) or $\oplus$ (xor). Describe and analyze an algorithm that counts the full parenthesizations that evaluate to T. Example: $T \vee T \wedge F \oplus T$ has 5 parenthesizations, 4 of which evaluate to T.`,
      rubric: ['Two tables T(i, j), F(i, j) with English specs', 'Correct combination formulas for each operator at the split point', 'Base cases on single symbols', 'Order by increasing length; O(n³)', 'Example check (4 true, 1 false)'],
      hints: ['Count both true and false parenthesizations of every interval; you need false counts for ∨ and ⊕.', 'Parenthesizations of an interval are partitioned by the last operator; for a fixed last operator, the two sides are chosen independently.'],
      solution: String.raw`1. **Spec.** For $1 \le i \le j \le n$: T(i, j) and F(i, j) = the number of full parenthesizations of $s_i\ \text{op}_i \cdots s_j$ that evaluate to T and to F respectively. Let N(i, j) = T(i, j) + F(i, j). Answer T(1, n).
2. **Recurrence.** T(i, i) = [s_i = T], F(i, i) = [s_i = F]. For i < j, sum over the last operator $\text{op}_k$ ($i \le k < j$), with $(t_1, f_1) = (T(i,k), F(i,k))$ and $(t_2, f_2) = (T(k+1, j), F(k+1, j))$:

| $\text{op}_k$ | contribution to T(i, j) | contribution to F(i, j) |
|---|---|---|
| ∧ | $t_1t_2$ | $N(i,k)N(k{+}1,j) - t_1t_2$ |
| ∨ | $N(i,k)N(k{+}1,j) - f_1f_2$ | $f_1f_2$ |
| ⊕ | $t_1f_2 + f_1t_2$ | $t_1t_2 + f_1f_2$ |

Different last operators give different parenthesizations (sum), and for a fixed one each pair (left parenthesization, right parenthesization) gives exactly one (product).
3. **Memo.** Two 2D arrays T[1..n][1..n], F[1..n][1..n].
4. **Order.** By increasing length j − i.
5. **Time/space.** $O(n^2)$ intervals × O(n) splits: $O(n^3)$ time, $O(n^2)$ space.

**Example** $T \vee T \wedge F \oplus T$: the five parenthesizations evaluate to $T \vee (T \wedge (F \oplus T)) = T$, $T \vee ((T \wedge F) \oplus T) = T$, $(T \vee T) \wedge (F \oplus T) = T$, $(T \vee (T \wedge F)) \oplus T = F$, $((T \vee T) \wedge F) \oplus T = T$: **4** true, 1 false, matching T(1, 4) = 4, F(1, 4) = 1.`,
    },
    {
      id: 'dp2-polygon-triangulation', type: 'written', title: 'Minimum-cost polygon triangulation', difficulty: 2,
      prompt: String.raw`A convex polygon has vertices $v_0, v_1, \dots, v_{n-1}$ in order, and vertex $v_i$ carries a positive label $x_i$. A **triangulation** cuts the polygon into n − 2 triangles using non-crossing diagonals; its cost is the sum, over its triangles $v_av_bv_c$, of $x_a x_b x_c$. Give an $O(n^3)$ DP for the minimum cost, and compute it for the square with labels (1, 2, 3, 4) and for the pentagon with labels (2, 1, 3, 1, 2).`,
      rubric: ['Spec on sub-polygons v_i..v_j cut off by the chord v_iv_j', 'Recurrence choosing the apex k of the triangle on edge v_iv_j; base j = i + 1', 'Order by increasing j − i; O(n³)', 'Examples: 18 and 9'],
      hints: ['In any triangulation, the edge $v_0v_{n-1}$ lies in exactly one triangle $v_0 v_k v_{n-1}$.', 'That triangle splits the polygon into the sub-polygons $v_0..v_k$ and $v_k..v_{n-1}$.'],
      solution: String.raw`1. **Spec.** For $0 \le i < j \le n-1$: Tri(i, j) = the minimum cost of triangulating the convex polygon $v_i v_{i+1} \cdots v_j$ (closed by the chord $v_iv_j$); for j = i + 1 this "polygon" is a single edge and costs 0. Answer Tri(0, n − 1).
2. **Recurrence.** Tri(i, i+1) = 0; for $j \ge i + 2$:
$$\text{Tri}(i,j) = \min_{i < k < j}\big(\text{Tri}(i,k) + \text{Tri}(k,j) + x_ix_kx_j\big)$$
In any triangulation of $v_i..v_j$, the side $v_iv_j$ belongs to exactly one triangle $v_iv_kv_j$ with $i < k < j$; it splits the rest into the sub-polygons $v_i..v_k$ and $v_k..v_j$, which are triangulated independently.
3. **Memo.** Tri[0..n−1][0..n−1].
4. **Order.** By increasing j − i (2, 3, …, n − 1).
5. **Time/space.** $O(n^2)$ entries × O(n) apexes: $O(n^3)$ time, $O(n^2)$ space.

**Square (1, 2, 3, 4):** diagonal $v_0v_2$ gives triangles (1·2·3) + (1·3·4) = 6 + 12 = 18; diagonal $v_1v_3$ gives (1·2·4) + (2·3·4) = 8 + 24 = 32. Minimum **18**.

**Pentagon (2, 1, 3, 1, 2):** every triangulation of a pentagon is a fan from one vertex. Fans from $v_0, \dots, v_4$ cost 16, 9, 24, 9, 16, so the minimum is **9** (fan from $v_1$: 1·3·1 + 1·1·2 + 1·2·2 = 3 + 2 + 4). The DP computes the same value without enumerating triangulations (there are Catalan-many).`,
    },
    {
      id: 'dp2-burst-balloons', type: 'written', title: 'Bursting balloons', difficulty: 3,
      prompt: String.raw`Balloons $1..n$ in a row carry positive integers $a_1, \dots, a_n$. Bursting balloon k earns $a_\ell \cdot a_k \cdot a_r$, where ℓ and r are its **current** left and right neighbours (a missing neighbour counts as 1); the burst balloon then disappears. Burst all balloons in the order that maximizes total earnings. (a) Explain why "the first balloon to burst" is a bad choice of split. (b) Give an $O(n^3)$ DP. (c) The answer for [3, 1, 5, 8] is 167 — give a bursting order achieving it.`,
      rubric: ['Explains dependence between the sides when choosing the first balloon', 'Pads a_0 = a_{n+1} = 1; spec over open intervals (i, j) with i and j alive', 'Recurrence with k burst last, base case j = i + 1', 'Order by length; O(n³)', 'Order achieving 167'],
      hints: ['After the first burst, its neighbours become adjacent — the two sides interact.', 'Instead choose the balloon k that is burst LAST among those strictly between i and j; while it lives, it separates the two sides.'],
      solution: String.raw`**(a)** If balloon k is burst first, its left and right neighbours become adjacent, so bursting a balloon on the left later may earn a factor from the right side: the two sides are not independent subproblems.

**(b)** Add $a_0 = a_{n+1} = 1$.
1. **Spec.** For $0 \le i < j \le n+1$: B(i, j) = the maximum total earned by bursting all balloons strictly between i and j, assuming balloons i and j are still present throughout. Answer B(0, n + 1).
2. **Recurrence.** B(i, i+1) = 0; for $j \ge i + 2$:
$$B(i,j) = \max_{i < k < j}\big(B(i,k) + B(k,j) + a_i a_k a_j\big)$$
Let k be the **last** balloon burst in (i, j). Until then, k is present, so the balloons in (i, k) only ever have neighbours in [i, k] and those in (k, j) only in [k, j]: the two sides are independent instances B(i, k) and B(k, j). When k is finally burst, its neighbours are i and j, earning $a_ia_ka_j$.
3. **Memo.** B[0..n+1][0..n+1].
4. **Order.** By increasing j − i.
5. **Time/space.** $O(n^2)$ intervals × O(n) choices: $O(n^3)$ time, $O(n^2)$ space.

**(c)** [3, 1, 5, 8]: burst 1 (3·1·5 = 15), then 5 (3·5·8 = 120), then 3 (1·3·8 = 24), then 8 (1·8·1 = 8): total **167**.`,
    },
    {
      id: 'dp2-merge-piles', type: 'written', title: 'Merging adjacent piles', difficulty: 2,
      prompt: String.raw`Piles of stones with sizes $s_1, \dots, s_n$ stand in a row. A move merges two **adjacent** piles into one, at a cost equal to the size of the new pile. Give a DP for the minimum total cost of merging everything into one pile. Show that greedily merging the cheapest adjacent pair fails on [3, 2, 2, 3]. How does the problem change if any two piles (not only adjacent ones) may be merged?`,
      rubric: ['Interval spec M(i, j)', 'Recurrence S(i, j) + min over the last merge split; base M(i, i) = 0', 'Prefix sums; order by length; O(n³) time', 'Greedy counterexample 21 vs 20', 'Non-adjacent version is Huffman (greedy optimal)'],
      hints: ['The last merge combines a pile made from s_i..s_k with a pile made from s_{k+1}..s_j.', 'Whatever happens, the final merge of an interval costs its total size.'],
      solution: String.raw`Let $P[0] = 0$, $P[j] = s_1 + \dots + s_j$ and $S(i, j) = P[j] - P[i-1]$.

1. **Spec.** For $1 \le i \le j \le n$, M(i, j) = the minimum cost of merging piles i..j into a single pile. Answer M(1, n).
2. **Recurrence.** M(i, i) = 0; for i < j:
$$M(i,j) = S(i,j) + \min_{i \le k < j}\big(M(i,k) + M(k+1,j)\big)$$
Since only adjacent piles merge, every intermediate pile is a contiguous block, and the last merge of block i..j joins i..k with k+1..j for some k; it costs S(i, j). The two blocks are built independently.
3. **Memo.** M[1..n][1..n] and the prefix sums.
4. **Order.** By increasing j − i.
5. **Time/space.** $O(n^3)$ time, $O(n^2)$ space.

**Greedy fails.** [3, 2, 2, 3]: greedy merges 2 + 2 (cost 4) → [3, 4, 3], then 3 + 4 (7) → [7, 3], then 10: total **21**. Merging 3 + 2 (5), then 2 + 3 (5), then 10 gives **20**, which the DP finds.

**Any two piles.** Then the merges form a binary tree whose leaves can be in any order, and the cost is $\sum_i s_i \cdot \text{depth}(i)$ — exactly Huffman coding, for which greedily merging the two smallest piles is optimal ($O(n\log n)$ with a heap). Adjacency is what forces the interval DP.`,
    },
    {
      id: 'dp2-grid-turns', type: 'written', title: 'Grid paths with at most k turns', difficulty: 3,
      prompt: String.raw`An $m \times n$ grid has some blocked cells. A robot goes from (1, 1) to (m, n), moving only right or down and never entering a blocked cell. A **turn** is a place where two consecutive moves have different directions. Describe and analyze an algorithm that counts the paths with at most k turns. Check it on the 3 × 4 grid whose only blocked cell is (2, 2), for k = 0, 1, 2, 3.`,
      rubric: ['State includes cell, remaining turn budget and last move direction', 'Recurrence: continue straight (same budget) or turn (budget − 1); blocked/outside = 0; base at (m, n)', 'Correct handling of the first move (no turn)', 'Order (i, j decreasing) and O(mnk) time', 'Example: 0, 2, 3, 4'],
      hints: ['Whether the next move is a turn depends on the direction of the previous move — put it in the state.', 'P(i, j, t, d) = number of ways to finish from (i, j) using at most t more turns, given the last move had direction d.'],
      solution: String.raw`1. **Spec.** For each unblocked cell (i, j), $0 \le t \le k$ and $d \in \{R, D\}$: P(i, j, t, d) = the number of valid paths from (i, j) to (m, n) with at most t turns, given that the robot arrived at (i, j) by a move in direction d (so a first move in the other direction counts as a turn). Answer: 1 if (1, 1) = (m, n); otherwise P(1, 2, k, R) + P(2, 1, k, D), where a term is 0 if that cell is blocked or outside the grid (the first move is never a turn).
2. **Recurrence.** P = 0 for blocked or outside cells; P(m, n, t, d) = 1. Otherwise, writing next(R) = (i, j+1) and next(D) = (i+1, j):
$$P(i,j,t,d) = P(\text{next}(d), t, d) + [t \ge 1]\cdot P(\text{next}(\bar d), t - 1, \bar d)$$
where $\bar d$ is the other direction. Paths are partitioned by their next move: straight costs no turn, the other direction costs one.
3. **Memo.** Array P[1..m+1][1..n+1][0..k][2] (the extra row/column are 0).
4. **Order.** i from m down to 1, j from n down to 1 (every entry reads a cell to the right or below); t and d in any order.
5. **Time/space.** $O(mnk)$ entries, O(1) each: $O(mnk)$ time and space.

**Example.** 3 × 4, blocked (2, 2). Of the 10 monotone paths, 6 pass (2, 2); the other 4 are DDRRR (1 turn), RRRDD (1 turn), RRDDR (2 turns) and RRDRD (3 turns). So the counts for k = 0, 1, 2, 3 are **0, 2, 3, 4**.`,
    },
    {
      id: 'dp2-coins-game', type: 'written', title: 'Coins in a row: optimal play', difficulty: 2,
      prompt: String.raw`A row of coins has values $v_1, \dots, v_n$. Two players alternately remove a coin from either end of the row, keeping its value; each wants to maximize their own total. (a) Give a DP that computes the first player's total under optimal play by both. (b) Show that the greedy strategy "take the larger end" is not optimal using [8, 15, 3, 7]. (c) Compute the answer for [20, 30, 2, 2, 2, 10].`,
      rubric: ['Interval spec in terms of the player to move (difference or total)', 'Recurrence with the minimax structure (minus sign or min over opponent replies)', 'Base case i = j; order by length; O(n²)', 'Conversion to the first player\'s total', 'Examples: 22 (greedy 15) and 42'],
      hints: ['A position is an interval i..j, and the player to move faces the same problem as at the start.', 'Let Diff(i, j) = (mover\'s total) − (other player\'s total) from i..j under optimal play.'],
      solution: String.raw`**(a)**
1. **Spec.** For $1 \le i \le j \le n$, Diff(i, j) = the largest possible value of (the total collected from coins i..j by the player about to move) minus (the total collected by the other player), when both play optimally from row i..j. Answer: first player's total $= \big(S + \text{Diff}(1, n)\big)/2$ where $S = \sum v_i$ (because total + other = S and total − other = Diff).
2. **Recurrence.** Diff(i, i) = $v_i$; for i < j:
$$\text{Diff}(i,j) = \max\{v_i - \text{Diff}(i+1, j),\ \ v_j - \text{Diff}(i, j-1)\}$$
After taking an end coin, the opponent becomes the mover on the remaining row and achieves advantage Diff of that row over us.
3. **Memo.** Diff[1..n][1..n].
4. **Order.** By increasing length (or i from n down to 1, j from i up to n).
5. **Time/space.** $O(n^2)$ entries, O(1) each: $O(n^2)$ time and space.

(Equivalently, Total(i, j) = S(i, j) − min{Total(i+1, j), Total(i, j−1)}: you get everything the opponent doesn't.)

**(b)** [8, 15, 3, 7]: if both players are greedy, the first takes 8, the second 7, the first 15, the second 3: **15** vs 18 — the first player loses. Optimal: take 7; whatever the opponent takes (8 or 3), take 15: **22** vs 11. Diff(1, 4) = 11 and (33 + 11)/2 = 22.

**(c)** [20, 30, 2, 2, 2, 10] (S = 66): the DP gives Diff(1, 6) = 18, so the first player gets (66 + 18)/2 = **42**: take 10 first (starting with 20 is a mistake: it gives Diff −2 instead of 18). In the remaining row [20, 30, 2, 2, 2] the opponent does best by taking 20, and then we take 30.`,
    },
    {
      id: 'dp2-deadlines', type: 'written', title: 'Scheduling jobs with deadlines', difficulty: 3,
      prompt: String.raw`One machine must process jobs one at a time, without interruption, starting at time 0. Job i has an integer processing time $p_i$, deadline $d_i$ and profit $g_i$; a job earns its profit only if it **finishes** by its deadline, and jobs that would be late are simply not scheduled. (a) Prove that some optimal schedule runs its chosen jobs in order of deadline. (b) Use this to give a DP for the maximum profit and analyze it. (c) Solve the instance (p, d, g) = (2, 2, 10), (1, 3, 6), (3, 5, 12), (2, 6, 8).`,
      rubric: ['Exchange argument for deadline order (adjacent swap keeps both on time)', 'Sort by deadline; spec Best(i, t) with current time t', 'Recurrence: skip, or take if t + p_i ≤ d_i', 'Base case, order, O(n log n + nD) time, pseudo-polynomial', 'Example answer 26 (jobs 2, 3, 4)'],
      hints: ['If two adjacent jobs in a schedule are out of deadline order, swap them. Does anyone become late?', 'After sorting, the only thing the remaining decisions need to know is the current time.'],
      solution: String.raw`**(a)** Take any feasible schedule of a set of jobs. If two consecutive jobs a, b (a first) have $d_a > d_b$, swap them. Let the pair occupy the time interval [s, f) with $f = s + p_a + p_b$. After the swap b finishes earlier than before, and a finishes at f, which was b's finish time: $f \le d_b < d_a$. Nothing else moves, so the schedule stays feasible. Repeating (bubble sort) yields a feasible schedule of the same jobs in deadline order.

**(b)** Sort jobs by deadline: $d_1 \le \dots \le d_n$, and let $D = \max_i d_i$.
1. **Spec.** For $1 \le i \le n+1$ and $0 \le t \le D$: Best(i, t) = the maximum total profit obtainable from jobs i..n if the machine becomes free at time t and the chosen jobs among i..n run back to back in sorted order. Answer Best(1, 0).
2. **Recurrence.** Best(n+1, t) = 0; for $i \le n$:
$$\text{Best}(i,t) = \max\begin{cases}\text{Best}(i+1, t) & \text{skip job } i\\ g_i + \text{Best}(i+1,\ t + p_i) & \text{if } t + p_i \le d_i\end{cases}$$
By (a) we may decide the jobs in deadline order, and a chosen job starts as soon as the machine is free (idling never helps).
3. **Memo.** Best[1..n+1][0..D] (t + p_i ≤ d_i ≤ D keeps indices in range).
4. **Order.** i from n + 1 down to 1; any order of t.
5. **Time/space.** $O(n\log n)$ to sort plus $O(nD)$: **pseudo-polynomial** (D is a number). The problem contains knapsack (all deadlines equal), so it is NP-hard.

**(c)** Already sorted by deadline. Jobs 2, 3, 4 run in [0, 1), [1, 4), [4, 6): all on time, profit 6 + 12 + 8 = **26**. Any set containing job 1 (which must run first, in [0, 2)) earns less: {1, 2, 4} = 24 and {1, 3} = 22 are feasible, while {1, 3, 4} and {1, 2, 3} are not (job 4 or job 3 would be late). So 26 is optimal, as the table confirms.`,
    },
    {
      id: 'dp2-k-flights', type: 'written', title: 'Cheapest route with at most k flights', difficulty: 2,
      prompt: String.raw`Airports are vertices of a directed graph G = (V, E) whose edges are flights with prices $w(u \to v) \ge 0$. Give an $O(k(V + E))$ algorithm for the cheapest way to fly from s to t using **at most k flights**. Run it on the graph with flights s→t (10), s→a (1), a→b (1), b→c (1), c→t (1), s→b (4), b→t (3) for k = 1, 2, 3, 4. Explain why dropping the flight-count parameter (or running Dijkstra) does not work.`,
      rubric: ['Two-parameter spec D(i, v) with the at-most-i-edges meaning', 'Recurrence with "stay" option and min over incoming edges; base layer i = 0', 'Order i increasing; O(k(V + E)) time, O(V) space with two layers', 'Example: 10, 7, 5, 4', 'Explanation: the limit makes the budget part of the state; cycles make the 1-parameter recursion ill-founded'],
      hints: ['The last flight of a route with at most i flights arrives at t from some u, and the rest is a route to u with at most i − 1 flights.', 'Layer i depends only on layer i − 1.'],
      solution: String.raw`1. **Spec.** For $0 \le i \le k$ and $v \in V$: D(i, v) = the minimum total price of a route (walk) from s to v using at most i flights ($\infty$ if none). Answer D(k, t).
2. **Recurrence.** D(0, s) = 0 and D(0, v) = $\infty$ for $v \ne s$. For $i \ge 1$:
$$D(i,v) = \min\Big\{D(i-1, v),\ \min_{u \to v \in E}\big(D(i-1, u) + w(u \to v)\big)\Big\}$$
A route to v with at most i flights either uses at most i − 1 flights, or ends with some flight u → v preceded by a route to u with at most i − 1 flights; the prefix should be as cheap as possible.
3. **Memo.** D[0..k][V] (two rows suffice).
4. **Order.** i from 0 up to k; within a layer, any order (layer i reads only layer i − 1).
5. **Time/space.** Each layer scans every vertex and edge once: $O(k(V + E))$ time, $O(V)$ space with two layers.

**Example.** D(·, t) for k = 1, 2, 3, 4: **10** (direct), **7** (s→b→t: 4 + 3), **5** (s→a→b→t: 1 + 1 + 3), **4** (s→a→b→c→t).

**Why the extra parameter.** The cheapest route overall (cost 4) uses 4 flights; with k = 2 we must pay 7. "Cheapest to v" and "cheapest to v with few flights" are different subproblems, so Dijkstra on the original graph answers the wrong question. Moreover, in a graph with cycles the one-parameter recurrence D(v) = min over u → v of D(u) + w(u → v) has cyclic dependencies and no evaluation order; the budget i makes every dependency go from layer i to layer i − 1, i.e. a DAG. (With k = V − 1 this is Bellman–Ford.)`,
    },
    {
      id: 'dp2-coins-game-code', type: 'code', title: 'Coins in a row (first player\'s total)', difficulty: 2,
      prompt: String.raw`Write <code>coinGame(v)</code>: two players alternately take a coin from either end of the array <code>v</code> of nonnegative integers, both playing optimally to maximize their own totals. Return the total collected by the player who moves first (0 for an empty array). Example: [8, 15, 3, 7] → 22.`,
      fn: 'coinGame',
      starter: 'function coinGame(v) {\n  // Diff[i][j] = (mover total) - (other total) on v[i..j]\n}\n',
      reference: function (v) {
        const n = v.length;
        if (n === 0) return 0;
        const D = [];
        for (let i = 0; i <= n; i++) D.push(new Array(n + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
          D[i][i] = v[i];
          for (let j = i + 1; j < n; j++) D[i][j] = Math.max(v[i] - D[i + 1][j], v[j] - D[i][j - 1]);
        }
        let S = 0;
        for (const x of v) S += x;
        return (S + D[0][n - 1]) / 2;
      },
      tests: [[[8, 15, 3, 7]], [[]], [[5]], [[2, 2, 2, 2]], [[20, 30, 2, 2, 2, 10]], [[5, 3, 7, 10]], [[1, 100, 1]], [[3, 9, 1, 2]]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 11) }, () => Math.floor(Math.random() * 20))],
      hints: ['Diff(i, i) = v[i]; Diff(i, j) = max(v[i] − Diff(i+1, j), v[j] − Diff(i, j−1)).', 'First player\'s total = (sum + Diff(0, n−1)) / 2.'],
      solution: String.raw`~~~js
function coinGame(v) {
  const n = v.length;
  if (n === 0) return 0;
  const D = [];
  for (let i = 0; i <= n; i++) D.push(new Array(n + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {        // i decreasing, j increasing
    D[i][i] = v[i];
    for (let j = i + 1; j < n; j++)
      D[i][j] = Math.max(v[i] - D[i + 1][j], v[j] - D[i][j - 1]);
  }
  const S = v.reduce((a, b) => a + b, 0);
  return (S + D[0][n - 1]) / 2;
}
~~~
Diff is the mover's advantage; after a move the roles swap, hence the subtraction. $O(n^2)$ time and space. [1, 100, 1] → 2: whichever end the first player takes, the opponent gets the 100.`,
    },
    {
      id: 'dp2-bool-code', type: 'code', title: 'Count TRUE parenthesizations', difficulty: 3,
      prompt: String.raw`Write <code>countTrue(expr)</code>: <code>expr</code> is a string alternating symbols and operators, such as <code>"T|T&F^T"</code>, with symbols <code>T</code>/<code>F</code> and operators <code>&</code> (and), <code>|</code> (or), <code>^</code> (xor). Return the number of full parenthesizations that evaluate to true. Example: <code>"T|T&F^T"</code> → 4; <code>"T"</code> → 1; <code>"F"</code> → 0.`,
      fn: 'countTrue',
      starter: 'function countTrue(expr) {\n  // symbols at even positions, operators at odd positions\n  // T[i][j], F[i][j] for symbol intervals\n}\n',
      reference: function (expr) {
        const sym = [], ops = [];
        for (let i = 0; i < expr.length; i++) (i % 2 === 0 ? sym : ops).push(expr[i]);
        const n = sym.length;
        const T = [], F = [];
        for (let i = 0; i < n; i++) { T.push(new Array(n).fill(0)); F.push(new Array(n).fill(0)); T[i][i] = sym[i] === 'T' ? 1 : 0; F[i][i] = 1 - T[i][i]; }
        for (let len = 2; len <= n; len++) {
          for (let i = 0; i + len - 1 < n; i++) {
            const j = i + len - 1;
            for (let k = i; k < j; k++) {
              const lt = T[i][k], lf = F[i][k], rt = T[k + 1][j], rf = F[k + 1][j];
              const tot = (lt + lf) * (rt + rf);
              let t;
              if (ops[k] === '&') t = lt * rt;
              else if (ops[k] === '|') t = tot - lf * rf;
              else t = lt * rf + lf * rt;
              T[i][j] += t; F[i][j] += tot - t;
            }
          }
        }
        return T[0][n - 1];
      },
      tests: [['T|T&F^T'], ['T'], ['F'], ['T^F|F'], ['T&F'], ['F|F|F'], ['T^T^T^T'], ['T|F&T^F&T|F']],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        let s = '';
        for (let i = 0; i < n; i++) { if (i) s += '&|^'[Math.floor(Math.random() * 3)]; s += 'TF'[Math.floor(Math.random() * 2)]; }
        return [s];
      },
      hints: ['Count both true and false parenthesizations for every interval of symbols.', 'At the last operator k: AND → T_L·T_R; OR → total − F_L·F_R; XOR → T_L·F_R + F_L·T_R. The false count is total minus the true count.'],
      solution: String.raw`~~~js
function countTrue(expr) {
  const sym = [], ops = [];
  for (let i = 0; i < expr.length; i++) (i % 2 === 0 ? sym : ops).push(expr[i]);
  const n = sym.length, T = [], F = [];
  for (let i = 0; i < n; i++) {
    T.push(new Array(n).fill(0)); F.push(new Array(n).fill(0));
    T[i][i] = sym[i] === 'T' ? 1 : 0; F[i][i] = 1 - T[i][i];
  }
  for (let len = 2; len <= n; len++)
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      for (let k = i; k < j; k++) {             // ops[k] is the last operator
        const lt = T[i][k], lf = F[i][k], rt = T[k + 1][j], rf = F[k + 1][j];
        const tot = (lt + lf) * (rt + rf);
        const t = ops[k] === '&' ? lt * rt
                : ops[k] === '|' ? tot - lf * rf
                : lt * rf + lf * rt;
        T[i][j] += t; F[i][j] += tot - t;
      }
    }
  return T[0][n - 1];
}
~~~
Interval DP by increasing length: $O(n^3)$ time, $O(n^2)$ space for n symbols. Sum over the last operator (disjoint cases), product of the two sides' counts (independent choices).`,
    },
    {
      id: 'dp2-burst-code', type: 'code', title: 'Burst balloons', difficulty: 3,
      prompt: String.raw`Write <code>maxBurst(a)</code>: bursting balloon k of the row <code>a</code> earns (left neighbour) · a[k] · (right neighbour), using its <b>current</b> neighbours (a missing neighbour counts as 1), and removes it. Return the maximum total for bursting all balloons (0 for an empty row). Example: [3, 1, 5, 8] → 167.`,
      fn: 'maxBurst',
      starter: 'function maxBurst(a) {\n  // pad with 1s; B[i][j] = best for balloons strictly between i and j, k burst last\n}\n',
      reference: function (a) {
        const n = a.length;
        const b = [1].concat(a, [1]);
        const B = [];
        for (let i = 0; i < n + 2; i++) B.push(new Array(n + 2).fill(0));
        for (let len = 2; len <= n + 1; len++) {
          for (let i = 0; i + len <= n + 1; i++) {
            const j = i + len;
            let best = 0;
            for (let k = i + 1; k < j; k++) {
              const v = B[i][k] + B[k][j] + b[i] * b[k] * b[j];
              if (v > best) best = v;
            }
            B[i][j] = best;
          }
        }
        return B[0][n + 1];
      },
      tests: [[[3, 1, 5, 8]], [[]], [[7]], [[1, 5]], [[2, 3]], [[4, 2, 3]], [[9, 9, 9]], [[1, 2, 3, 4, 5]]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 8) }, () => 1 + Math.floor(Math.random() * 9))],
      hints: ['Add sentinel balloons of value 1 at both ends: b = [1, ...a, 1].', 'B(i, j) = max over i < k < j of B(i, k) + B(k, j) + b[i]·b[k]·b[j], where k is the last balloon burst between i and j.'],
      solution: String.raw`~~~js
function maxBurst(a) {
  const n = a.length;
  const b = [1, ...a, 1];
  const B = [];
  for (let i = 0; i < n + 2; i++) B.push(new Array(n + 2).fill(0));
  for (let len = 2; len <= n + 1; len++)          // j - i = len
    for (let i = 0; i + len <= n + 1; i++) {
      const j = i + len;
      for (let k = i + 1; k < j; k++)              // k is burst last in (i, j)
        B[i][j] = Math.max(B[i][j], B[i][k] + B[k][j] + b[i] * b[k] * b[j]);
    }
  return B[0][n + 1];
}
~~~
$O(n^3)$ time, $O(n^2)$ space. Choosing the last balloon keeps the two sides independent, because k separates them until the very end.`,
    },
    {
      id: 'dp2-tree-cover-code', type: 'code', title: 'Weighted vertex cover in a tree', difficulty: 2,
      prompt: String.raw`A tree on vertices 0..n−1 (n ≥ 1) is given by a parent array (<code>parent[root] = -1</code>; do not assume <code>parent[v] < v</code>), and <code>cost[v] > 0</code>. Write <code>treeVertexCover(parent, cost)</code> returning the minimum total cost of a set of vertices containing at least one endpoint of every edge.`,
      fn: 'treeVertexCover',
      starter: 'function treeVertexCover(parent, cost) {\n  // In(v) = cost[v] + sum min(In(c), Out(c));  Out(v) = sum In(c)\n}\n',
      reference: function (parent, cost) {
        const n = parent.length;
        const children = [];
        for (let v = 0; v < n; v++) children.push([]);
        let root = 0;
        for (let v = 0; v < n; v++) { if (parent[v] < 0) root = v; else children[parent[v]].push(v); }
        const order = [root];
        for (let k = 0; k < order.length; k++) for (const c of children[order[k]]) order.push(c);
        const inC = new Array(n).fill(0), outC = new Array(n).fill(0);
        for (let k = order.length - 1; k >= 0; k--) {
          const v = order[k];
          inC[v] = cost[v];
          for (const c of children[v]) { inC[v] += Math.min(inC[c], outC[c]); outC[v] += inC[c]; }
        }
        return Math.min(inC[root], outC[root]);
      },
      tests: [[[-1], [5]], [[-1, 0, 1, 2], [1, 5, 5, 1]], [[-1, 0, 0, 0], [10, 1, 1, 1]], [[-1, 0, 0, 0], [2, 3, 3, 3]], [[-1, 0, 0, 1, 1, 2, 5], [3, 2, 4, 1, 1, 5, 2]], [[2, 2, -1, 0], [4, 1, 3, 6]]],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 12);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const parent = new Array(n).fill(-1);
        for (let i = 1; i < n; i++) parent[perm[i]] = perm[Math.floor(Math.random() * i)];
        const cost = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 10));
        return [parent, cost];
      },
      hints: ['Build children lists and a BFS order from the root; process it in reverse so children come first.', 'If v is out of the cover, every child must be in it.'],
      solution: String.raw`~~~js
function treeVertexCover(parent, cost) {
  const n = parent.length, children = [];
  for (let v = 0; v < n; v++) children.push([]);
  let root = 0;
  for (let v = 0; v < n; v++) {
    if (parent[v] < 0) root = v; else children[parent[v]].push(v);
  }
  const order = [root];                              // BFS order
  for (let k = 0; k < order.length; k++)
    for (const c of children[order[k]]) order.push(c);
  const inC = new Array(n).fill(0), outC = new Array(n).fill(0);
  for (let k = order.length - 1; k >= 0; k--) {      // children before parents
    const v = order[k];
    inC[v] = cost[v];
    for (const c of children[v]) {
      inC[v] += Math.min(inC[c], outC[c]);           // v covers edge (v, c)
      outC[v] += inC[c];                             // c must cover it
    }
  }
  return Math.min(inC[root], outC[root]);
}
~~~
O(n) time and space. The path with costs [1, 5, 5, 1] gives 6; a star with center cost 10 and leaves of cost 1 gives 3.`,
    },
    {
      id: 'dp2-tree-broadcast', type: 'written', title: 'Spreading news down a hierarchy', difficulty: 3,
      tags: ['tree dp', 'exchange argument'],
      prompt: String.raw`An organization is a rooted tree T with n vertices. At time 0 only the root knows some news. In each time step, every vertex that already knows the news may phone **at most one of its children** (a call takes one step, and vertices only call their own children).
(a) Describe and analyze an algorithm that computes the minimum number of steps until everyone knows the news.
(b) Prove that the order in which your algorithm has each vertex call its children is optimal.
(c) Run it on the tree rooted at a, where a has children b, c, d; b has children e, f, g; c has child h; and h has child i.
(d) Show that "call the child with the largest subtree first" is not optimal.`,
      rubric: ['Spec T(v): steps needed to finish v\'s subtree once v is informed; answer T(root)', 'Recurrence T(v) = max over i of (i + T(c_i)) with children sorted by T decreasing; leaves 0', 'Exchange argument for the sorted order (and no idling)', 'Postorder evaluation; O(n log n) time', 'Example answer 4 with a valid schedule', 'Counterexample to largest-subtree-first'],
      hints: ['Once child c is called at step i, its subtree evolves independently and finishes at i + T(c).', 'For a fixed calling order the finish time is the max over i of (i + T(c_i)). Which order minimizes that max?', 'Swap two adjacent children that are out of order and compare the two affected terms.'],
      solution: String.raw`Only v can inform its children, and vertices of v's subtree are informed only by calls made inside that subtree, so the subtrees of v's children evolve independently once each child has been called.

1. **Spec.** For each vertex v, T(v) = the minimum number of steps, counted from the moment v learns the news, until every vertex of v's subtree knows it. Answer T(root).
2. **Recurrence.** T(v) = 0 for a leaf. Otherwise sort v's children so that $T(c_1) \ge T(c_2) \ge \dots \ge T(c_d)$ and set
$$T(v) = \max_{1 \le i \le d}\big(i + T(c_i)\big).$$
*Justification.* Some schedule calls the children at distinct steps; idling never helps, so in an optimal schedule v calls them at steps 1, 2, …, d in some order π. Child $c_{\pi(i)}$ is informed at step i, and its subtree is then finished optimally after $T(c_{\pi(i)})$ more steps, so that order costs $\max_i (i + T(c_{\pi(i)}))$. Part (b) shows that the sorted order minimizes this.
3. **Memo.** One number T(v) stored at each vertex.
4. **Order.** Postorder (children before parents).
5. **Time/space.** Sorting the d children of v costs $O(d \log d)$; summed over all vertices this is $O(n \log n)$. O(n) space.

**(b) Exchange argument.** Take any order in which a child x is called at step i and a child y at step i + 1 with T(x) < T(y). The two terms are $i + T(x)$ and $i + 1 + T(y)$. After swapping, they become $i + T(y)$ and $i + 1 + T(x)$, both at most $i + 1 + T(y)$, and no other term changes. So the maximum does not increase. Repeating such swaps (bubble sort) reaches the sorted order without ever increasing the cost, so the sorted order is optimal.

**(c)** Leaves e, f, g, i, d: 0. h: 1 + T(i) = 1. c: 1 + T(h) = 2. b: three children with T = 0: max(1, 2, 3) = 3. a: children sorted b (3), c (2), d (0): max(1 + 3, 2 + 2, 3 + 0) = **4**.
Schedule: step 1 a→b; step 2 a→c, b→e; step 3 a→d, b→f, c→h; step 4 b→g, h→i. Calling d before c would give max(1 + 3, 2 + 0, 3 + 2) = 5.

**(d)** Let the root r have two children x and y. Below x: x has children x1, x2, x3; x1 has children x4, x5; x4 has child x6; x2 has child x7. That subtree has 8 vertices and T(x) = 3 (x6, x5, x3, x7 are leaves; T(x4) = 1, T(x1) = max(1 + 1, 2 + 0) = 2, T(x2) = 1, T(x) = max(1 + 2, 2 + 1, 3 + 0) = 3). Below y hangs a path y – y1 – y2 – y3 – y4: 5 vertices, T(y) = 4. Largest subtree first calls x first: max(1 + 3, 2 + 4) = 6 steps. Calling y first: max(1 + 4, 2 + 3) = **5**. Size is the wrong measure; the remaining *time* is what matters.`,
    },
    {
      id: 'dp2-clear-blocks', type: 'written', title: 'Clearing a row of colored blocks', difficulty: 3,
      tags: ['interval dp'],
      prompt: String.raw`A row of n colored blocks is described by a string s[1..n] (one letter per color). One **move** deletes a nonempty contiguous run of blocks that all have the same color (any such run, not necessarily a maximal one); afterwards the remaining blocks close the gap. You want to delete all blocks in as few moves as possible. For example, abcba needs only 3 moves (delete c, then the two b's that are now adjacent, then the two a's), and abacaba needs 4.
(a) Describe and analyze a DP for the minimum number of moves.
(b) A classmate proposes $D(i,j) = \min_{i \le k < j} \big(D(i,k) + D(k+1,j)\big)$ with D(i, i) = 1. What does this compute on abcba, and why is it wrong?`,
      rubric: ['Spec D(i, j): fewest moves to delete s[i..j]; empty interval 0', 'Recurrence: delete s[i] alone (1 + D(i+1, j)), or delete it together with the next block s[k] = s[i] removed in the same move (D(i+1, k−1) + D(k, j))', 'Justification: the blocks strictly between i and k are cleared by moves inside that interval', 'Valid evaluation order (i decreasing, j increasing) and O(n³) time, O(n²) space', 'Part (b): the split recurrence never lets equal colors merge (gives 5 on abcba)'],
      hints: ['Focus on the move that deletes the first block s[i]. Does it delete any other block of s[i..j]?', 'If it does, let s[k] be the leftmost other block deleted in that same move. What must have happened to the blocks strictly between i and k before that move?'],
      solution: String.raw`**(a)**
1. **Spec.** For $1 \le i \le n+1$ and $i - 1 \le j \le n$: D(i, j) = the minimum number of moves needed to delete all blocks of s[i..j], treating this piece as a row of its own. D(i, i − 1) = 0 (empty piece). Answer D(1, n).
2. **Recurrence.** For $i \le j$:
$$D(i,j) = \min\Big\{\,1 + D(i+1, j),\ \ \min_{\substack{i < k \le j\\ s_k = s_i}} \big(D(i+1, k-1) + D(k, j)\big)\Big\}$$
*Justification.* Consider the move that deletes $s_i$ in an optimal solution.
   - If it deletes no other block, the other moves are a valid way to clear s[i+1..j] (a run that avoids the leftmost block is still a run without it), so the cost is at least $1 + D(i+1, j)$, and that is achievable.
   - Otherwise, let $s_k$ be the leftmost other block deleted in that move; then $s_k = s_i$. That move is a contiguous run containing $s_i$ and $s_k$ but nothing in between, so every block strictly between them is already gone. Any move that deleted one of those blocks happened while $s_i$ and $s_k$ were both present, so it lay entirely inside s[i+1..k−1]: these moves clear that piece, at least $D(i+1, k-1)$ of them. The remaining moves, restricted to s[k..j], clear s[k..j] (the move containing $s_i$ is counted there, as the move deleting $s_k$): at least D(k, j) more. Conversely, first clear s[i+1..k−1] optimally, then clear s[k..j] optimally, and add $s_i$ to the move that deletes $s_k$ (at that moment $s_k$ is the leftmost remaining block of s[k..j] and $s_i$ is its left neighbour). This achieves $D(i+1, k-1) + D(k, j)$ moves.
3. **Memo.** D[1..n+1][0..n].
4. **Order.** i from n down to 1, and for each i, j from i up to n. D(i, j) reads D(i+1, ·) and D(k, j) with k > i, which are in rows already finished.
5. **Time/space.** $O(n^2)$ entries, O(n) choices of k each: $O(n^3)$ time, $O(n^2)$ space.

**Example abcba.** Row by row (i = 1..5, j = i..5): D(1, ·) = 1 2 3 3 3; D(2, ·) = 1 2 2 3; D(3, ·) = 1 2 3; D(4, ·) = 1 2; D(5, 5) = 1. For instance D(1, 5) = min(1 + D(2, 5), D(2, 4) + D(5, 5)) = min(1 + 3, 2 + 1) = **3**, using k = 5 (the last a waits for the first one).

**(b)** The split recurrence treats the two parts as rows that never interact, so blocks of the same color on different sides can never be deleted together. By induction its value is always the length j − i + 1 (every block deleted on its own): 5 for abcba, and even 2 for aa. The correct DP gets 3 because, after c and then bb disappear, the two a's become adjacent and go in one move. Capturing that interaction is exactly what the "partner" case $s_k = s_i$ does.`,
    },
    {
      id: 'dp2-study-hours', type: 'written', title: 'Allocating study hours', difficulty: 2,
      tags: ['knapsack'],
      prompt: String.raw`You have H whole hours to prepare for n exams. For each exam i you have estimated a table $g_i(0), g_i(1), \dots, g_i(H)$ of nondecreasing numbers: the score you expect if you spend h hours on exam i. Choose nonnegative integers $h_1, \dots, h_n$ with $\sum h_i \le H$ maximizing $\sum_i g_i(h_i)$.
(a) Give a complete DP solution.
(b) Is your running time polynomial in the input size? Careful: compare with knapsack.
(c) Run it with H = 5 and the tables below.
(d) Show that the greedy rule "give the next hour to the exam with the largest marginal gain" fails on this instance.

| hours h | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| exam 1 | 0 | 4 | 7 | 9 | 10 | 10 |
| exam 2 | 0 | 2 | 5 | 9 | 11 | 12 |
| exam 3 | 0 | 5 | 6 | 7 | 8 | 8 |`,
      rubric: ['Spec A(i, h): best total for exams i..n with at most h hours', 'Recurrence: max over the hours x given to exam i of g_i(x) + A(i+1, h − x); base A(n+1, h) = 0', 'Order i decreasing; O(nH²) time', 'Correct polynomial-vs-pseudo-polynomial discussion (the tables have n(H+1) entries)', 'Example answer 18 with hours (1, 3, 1)', 'Greedy reaches only 16 or 17'],
      hints: ['Decide exam i first: it gets some number x of hours, and the remaining exams share h − x.', 'How many numbers does the input contain?'],
      solution: String.raw`**(a)**
1. **Spec.** For $1 \le i \le n+1$ and $0 \le h \le H$: A(i, h) = the maximum total expected score on exams i..n using at most h hours. Answer A(1, H).
2. **Recurrence.** A(n+1, h) = 0. For $i \le n$:
$$A(i,h) = \max_{0 \le x \le h}\big(g_i(x) + A(i+1, h - x)\big)$$
An optimal plan gives exam i some number x of hours; the other exams then face the same problem with h − x hours and should be planned optimally. (This is a knapsack in which item i comes in H + 1 "sizes".)
3. **Memo.** A[1..n+1][0..H], plus the best x for reconstruction.
4. **Order.** i from n + 1 down to 1; h in any order.
5. **Time/space.** $O(nH)$ entries × O(H) choices = $O(nH^2)$ time, $O(nH)$ space.

**(b)** It **is** polynomial. The input lists n(H + 1) numbers, so the input size is at least nH, and $nH^2 \le (\text{input size})^2$. In knapsack, W is a single number written in about $\lg W$ bits, so $nW$ is exponential in the input size. Pseudo-polynomial means "polynomial in a numeric value that the input does not pay for".

**(c)**

| h | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| A(3, h) | 0 | 5 | 6 | 7 | 8 | 8 |
| A(2, h) | 0 | 5 | 7 | 10 | 14 | 16 |
| A(1, h) | 0 | 5 | 9 | 12 | 14 | **18** |

For example A(2, 4) = max(0 + 8, 2 + 7, 5 + 6, 9 + 5, 11 + 0) = 14 (three hours on exam 2, one on exam 3), and A(1, 5) = max(16, 4 + 14, 7 + 10, 9 + 7, 10 + 5, 10) = **18** with x = 1. Plan: (1, 3, 1) hours, scores 4 + 9 + 5 = 18.

**(d)** Greedy: hour 1 → exam 3 (+5); hour 2 → exam 1 (+4); hour 3 → exam 1 (+3); hour 4: exam 1 and exam 2 tie at +2. If exam 1 gets it, hour 5 goes to exam 2 (+2): total 16. If exam 2 gets it, hour 5 goes to exam 2 (+3): total 17. Either way less than 18. Exam 2 has *increasing* returns (+2, +3, +4), which one-hour-at-a-time greedy cannot see. (Greedy is optimal when every table is concave; these are not.)`,
    },
    {
      id: 'dp2-value-knapsack', type: 'written', title: 'Knapsack with huge weights and small values', difficulty: 2,
      tags: ['knapsack'],
      prompt: String.raw`In a 0/1 knapsack instance the n weights $w_i$ and the capacity W are arbitrary positive integers (up to $10^{15}$), but every value $v_i$ is a positive integer at most 100.
(a) Why is the usual K(i, w) table useless here?
(b) Give a complete DP solution indexed by value instead of weight, including how to read off the final answer.
(c) Analyze its running time in terms of n and $V = \sum_i v_i$. Is it polynomial for this family of instances?
(d) Run it for W = 5000 and items (weight, value) = (1200, 3), (3100, 5), (2300, 4), (1700, 2).`,
      rubric: ['Explains that K(i, w) has W + 1 ≈ 10¹⁵ columns', 'Spec M(i, v): minimum weight for value exactly v from items i..n', 'Recurrence with skip/take and base cases 0 / ∞', 'Answer = largest v with M(1, v) ≤ W', 'O(nV) time; polynomial (O(n²)) because values are at most 100', 'Example answer 8 (items 1 and 2, weight 4300)'],
      hints: ['Swap the roles: for each achievable value, what is the least weight needed?', 'Impossible values get weight ∞; the answer is the largest value whose minimum weight fits.'],
      solution: String.raw`**(a)** K(i, w) has a column for every capacity 0..W, i.e. about $10^{15}$ columns: far too many, and exponential in the bit length of W.

**(b)**
1. **Spec.** For $1 \le i \le n+1$ and $0 \le v \le V$: M(i, v) = the minimum total weight of a subset of items i..n whose total value is **exactly** v ($\infty$ if no subset has value v). Answer: the largest v with $M(1, v) \le W$ (v = 0 always qualifies).
2. **Recurrence.** M(n+1, 0) = 0 and M(n+1, v) = $\infty$ for v > 0. For $i \le n$:
$$M(i,v) = \min\begin{cases} M(i+1, v) & \text{skip item } i\\ w_i + M(i+1, v - v_i) & \text{if } v_i \le v \text{ (take it)}\end{cases}$$
3. **Memo.** M[1..n+1][0..V].
4. **Order.** i from n + 1 down to 1; v in any order.
5. **Time/space.** $O(nV)$ time and space ($O(V)$ space for the value only).

**(c)** $O(nV)$ is polynomial in n and the *values*; since $V \le 100n$ here, it is $O(n^2)$: polynomial for this family. In general it is pseudo-polynomial in the values (values can be large too). This trade-off (rounding values to make V small) is the basis of the knapsack approximation scheme.

**(d)** V = 14. Rows for v = 0..14 (∞ written as –):

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M(4, ·) | 0 | – | 1700 | – | – | – | – | – | – | – | – | – | – | – | – |
| M(3, ·) | 0 | – | 1700 | – | 2300 | – | 4000 | – | – | – | – | – | – | – | – |
| M(2, ·) | 0 | – | 1700 | – | 2300 | 3100 | 4000 | 4800 | – | 5400 | – | 7100 | – | – | – |
| M(1, ·) | 0 | – | 1700 | 1200 | 2300 | 2900 | 4000 | 3500 | **4300** | 5200 | 6000 | 7100 | 6600 | – | 8300 |

The largest v with $M(1, v) \le 5000$ is **8**, with weight 4300: items 1 and 2. (Value 9 already needs weight 5200.)`,
    },
    {
      id: 'dp2-two-robots', type: 'written', title: 'Two robots collecting coins', difficulty: 3,
      tags: ['grid dp', 'extra state'],
      prompt: String.raw`An $m \times n$ grid has $c[i][j] \ge 0$ coins in cell (i, j). Two robots both start at (1, 1) and must both reach (m, n), each moving only right or down. The coins in a cell are collected once, even if both robots pass through it.
(a) A friend suggests: compute the most valuable single path, remove its coins, then compute the most valuable path again. Show that this fails on the grid below.
(b) Describe and analyze a DP for the maximum total number of coins collected.
(c) What is the running time for an $n \times n$ grid?

~~~pseudo
0 0 2
3 4 3
0 2 0
~~~`,
      rubric: ['Counterexample: greedy 12, optimum 14', 'State (s, r1, r2) with s = row + column (lockstep), and why lockstep loses nothing', 'Gain counts a shared cell once (r1 = r2) and why no other double counting can occur', 'Recurrence over the four move combinations, with −∞ outside the grid and base case at (m, n)', 'Order s decreasing; O((m + n)m²) time, O(n³) for n × n'],
      hints: ['Each monotone path visits exactly one cell on each anti-diagonal i + j = s.', 'If both robots are on anti-diagonal s, their rows determine their cells. When can they be on the same cell?'],
      solution: String.raw`**(a)** The best single path is down, right, right, down: 3 + 4 + 3 = 10 (it is the unique best). After removing those coins, the two remaining 2's are at (1, 3) and (3, 2), and no monotone path visits both, so the second path collects 2: total **12**. Instead, robot A goes right, right, down, down, collecting 2 + 3 = 5, and robot B goes down, right, down, right, collecting 3 + 4 + 2 = 9: total **14**, every coin on the board. The greedy commits to a first path that is best alone but bad as a partner.

**(b)** Every monotone path from (1, 1) to (m, n) visits exactly one cell on each anti-diagonal $i + j = s$ for s = 2, 3, …, m + n. So we may move both robots in lockstep, and a robot on diagonal s at row r is in cell (r, s − r).

1. **Spec.** For $2 \le s \le m + n$ and rows $r_1, r_2$: R(s, r₁, r₂) = the maximum number of coins collected from the robots' current cells $(r_1, s - r_1)$, $(r_2, s - r_2)$ and all later cells (each distinct cell counted once) by two monotone paths from these cells to (m, n). Answer R(2, 1, 1).
2. **Recurrence.** R(s, r₁, r₂) = $-\infty$ if either cell is outside the grid. R(m + n, m, m) = c[m][n]. Otherwise
$$R(s, r_1, r_2) = \text{gain} + \max_{\delta_1, \delta_2 \in \{0, 1\}} R(s+1,\ r_1 + \delta_1,\ r_2 + \delta_2),$$
where δ = 1 means "move down" and δ = 0 means "move right", and gain = $c[r_1][s - r_1]$ plus $c[r_2][s - r_2]$ if $r_1 \ne r_2$ (if $r_1 = r_2$ the robots share the cell and its coins count once).
*Justification.* The four combinations are all possible next moves, and the future depends only on the current cells. A cell lies on exactly one anti-diagonal, so the robots can only share a cell at the same s, which is exactly the case $r_1 = r_2$. Hence the gain terms count every visited cell exactly once.
3. **Memo.** R[2..m+n][1..m][1..m] (by symmetry one may keep only $r_1 \le r_2$).
4. **Order.** s from m + n down to 2 (diagonal s reads only diagonal s + 1); rows in any order.
5. **Time/space.** $O((m + n) m^2)$ states with O(1) work each: $O((m+n)m^2)$ time; $O(m^2)$ space if we keep two diagonals.

**(c)** For an $n \times n$ grid: $O(n^3)$. Tracking both positions independently, (r₁, c₁, r₂, c₂), would give $O(n^4)$ states and would make it harder to see that coins are never counted twice. The lockstep view removes both problems.`,
    },
    {
      id: 'dp2-paint-houses', type: 'written', title: 'Painting a street', difficulty: 2,
      tags: ['extra state'],
      prompt: String.raw`n houses stand in a row. Painting house i with color $a \in \{1, \dots, k\}$ costs c[i][a], and adjacent houses must get different colors.
(a) Give a complete DP solution running in $O(nk^2)$ time.
(b) Improve it to $O(nk)$ time.
(c) Run it on the instance below (colors A, B, C).
(d) Show that painting each house, from left to right, with its cheapest color different from the previous house's fails on this instance.

| | A | B | C |
|---|---|---|---|
| house 1 | 1 | 9 | 2 |
| house 2 | 3 | 2 | 4 |
| house 3 | 3 | 6 | 2 |
| house 4 | 6 | 6 | 1 |`,
      rubric: ['Spec P(i, a): cheapest cost for houses i..n given house i has color a', 'Recurrence c[i][a] + min over b ≠ a of P(i+1, b); base at house n; answer min over a', 'Order i decreasing; O(nk²)', 'Best/second-best trick with justification giving O(nk)', 'Example answer 7 (A, B, A, C)', 'Greedy gives 11'],
      hints: ['What does house i + 1 need to know about the houses before it? Only the color of house i.', 'min over b ≠ a of a row equals the row minimum, unless a is the color achieving it.'],
      solution: String.raw`**(a)**
1. **Spec.** For $1 \le i \le n$ and each color a: P(i, a) = the minimum cost of painting houses i..n validly, given that house i gets color a. Answer $\min_a P(1, a)$.
2. **Recurrence.** P(n, a) = c[n][a]. For i < n:
$$P(i,a) = c[i][a] + \min_{b \ne a} P(i+1, b)$$
House i + 1 may take any color other than a, and once its color is fixed the houses after it face the same problem.
3. **Memo.** P[1..n][1..k].
4. **Order.** i from n down to 1.
5. **Time/space.** nk entries, each a min over k − 1 colors: $O(nk^2)$ time, $O(nk)$ space ($O(k)$ for the value only).

**(b)** After finishing row i + 1, compute its smallest value $m_1$ (achieved by color $b_1$) and its second-smallest value $m_2$ over the other colors, in O(k) time. Then $\min_{b \ne a} P(i+1, b) = m_1$ if $a \ne b_1$, and $m_2$ if $a = b_1$: removing one color can change the minimum only if it was the color achieving it. Each entry is now O(1), so the total is $O(nk)$.

**(c)** Rows (A, B, C):
- P(4, ·) = (6, 6, 1).
- P(3, ·): A: 3 + min(6, 1) = 4; B: 6 + min(6, 1) = 7; C: 2 + min(6, 6) = 8. So (4, 7, 8).
- P(2, ·): A: 3 + min(7, 8) = 10; B: 2 + min(4, 8) = 6; C: 4 + min(4, 7) = 8. So (10, 6, 8).
- P(1, ·): A: 1 + min(6, 8) = 7; B: 9 + min(10, 8) = 17; C: 2 + min(10, 6) = 8. So (7, 17, 8).

(With the trick: row 2 has $m_1 = 6$ at B and $m_2 = 8$, so P(1, A) = 1 + 6, P(1, B) = 9 + 8 and P(1, C) = 2 + 6, as above.) Answer **7**: tracing the choices gives A, B, A, C, costing 1 + 2 + 3 + 1.

**(d)** Greedy: house 1 A (1), house 2 B (2), house 3 C (2), and house 4 cannot use C, so it pays 6: total **11**. Taking the cheap C at house 3 forced an expensive house 4. The DP accounts for this because the state carries the color forward.`,
    },
    {
      id: 'dp2-broadcast-code', type: 'code', title: 'Broadcast time in a tree', difficulty: 2,
      prompt: String.raw`A rooted tree on vertices 0..n−1 (n ≥ 1) is given by a parent array (<code>parent[root] = -1</code>; do not assume <code>parent[v] < v</code>). At time 0 only the root knows a message. In each time step, every vertex that knows the message may send it to **at most one of its children**. Write <code>broadcastTime(parent)</code> returning the minimum number of steps until every vertex knows it. Example: <code>[-1, 0, 0, 0, 1, 1, 1, 2, 7]</code> → 4.`,
      fn: 'broadcastTime',
      starter: 'function broadcastTime(parent) {\n  // T(v) = max over i of (i + T(c_i)), children sorted by T decreasing\n}\n',
      reference: function (parent) {
        const n = parent.length;
        const children = [];
        for (let v = 0; v < n; v++) children.push([]);
        let root = 0;
        for (let v = 0; v < n; v++) { if (parent[v] < 0) root = v; else children[parent[v]].push(v); }
        const order = [root];
        for (let k = 0; k < order.length; k++) for (const c of children[order[k]]) order.push(c);
        const T = new Array(n).fill(0);
        for (let k = order.length - 1; k >= 0; k--) {
          const v = order[k];
          const t = children[v].map((c) => T[c]).sort((a, b) => b - a);
          let best = 0;
          for (let i = 0; i < t.length; i++) best = Math.max(best, i + 1 + t[i]);
          T[v] = best;
        }
        return T[root];
      },
      tests: [[[-1]], [[-1, 0, 0, 0, 1, 1, 1, 2, 7]], [[-1, 0, 1, 2, 3]], [[-1, 0, 0, 0, 0]], [[-1, 0, 1, 1, 1, 2, 2, 5, 3, 0, 9, 10, 11, 12]], [[2, 2, -1, 0]], [[-1, 0, 0, 1, 1, 2, 2]]],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 12);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const parent = new Array(n).fill(-1);
        for (let i = 1; i < n; i++) parent[perm[i]] = perm[Math.floor(Math.random() * i)];
        return [parent];
      },
      hints: ['Build children lists, find the root, and process vertices in reverse BFS order so children come first.', 'At each vertex, sort the children\'s T values in decreasing order; the child in position i (1-based) finishes at i + T.'],
      solution: String.raw`~~~js
function broadcastTime(parent) {
  const n = parent.length, children = [];
  for (let v = 0; v < n; v++) children.push([]);
  let root = 0;
  for (let v = 0; v < n; v++) {
    if (parent[v] < 0) root = v; else children[parent[v]].push(v);
  }
  const order = [root];                              // BFS order
  for (let k = 0; k < order.length; k++)
    for (const c of children[order[k]]) order.push(c);
  const T = new Array(n).fill(0);
  for (let k = order.length - 1; k >= 0; k--) {      // children before parents
    const v = order[k];
    const t = children[v].map(c => T[c]).sort((a, b) => b - a);   // slowest first
    let best = 0;
    for (let i = 0; i < t.length; i++) best = Math.max(best, i + 1 + t[i]);
    T[v] = best;
  }
  return T[root];
}
~~~
Calling the children with the largest T first is optimal by an exchange argument: swapping an adjacent out-of-order pair never increases $\max_i (i + T(c_i))$. Sorting costs $O(d \log d)$ at a vertex with d children, $O(n \log n)$ overall. A path of 5 vertices needs 4 steps; a star with 4 leaves also needs 4; the complete binary tree on 7 vertices needs 4.`,
    },
    {
      id: 'dp2-clear-blocks-code', type: 'code', title: 'Clear the row in fewest moves', difficulty: 3,
      prompt: String.raw`Write <code>clearRow(s)</code>: <code>s</code> is a string of lowercase letters describing a row of colored blocks. One move deletes a nonempty contiguous run of equal letters, and the remaining blocks close up. Return the minimum number of moves needed to delete everything (0 for the empty string). Examples: <code>"abcba"</code> → 3, <code>"abacaba"</code> → 4, <code>"abab"</code> → 3, <code>"aaaa"</code> → 1.`,
      fn: 'clearRow',
      starter: 'function clearRow(s) {\n  // D[i][j] = fewest moves to delete s[i..j]\n  // either s[i] goes alone, or it is deleted together with a later s[k] === s[i]\n}\n',
      reference: function (s) {
        const n = s.length;
        if (n === 0) return 0;
        const D = [];
        for (let i = 0; i <= n + 1; i++) D.push(new Array(n + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
          for (let j = i; j < n; j++) {
            let best = 1 + D[i + 1][j];
            for (let k = i + 1; k <= j; k++) {
              if (s[k] === s[i]) best = Math.min(best, (k - 1 >= i + 1 ? D[i + 1][k - 1] : 0) + D[k][j]);
            }
            D[i][j] = best;
          }
        }
        return D[0][n - 1];
      },
      tests: [['abcba'], ['abacaba'], [''], ['a'], ['aaaa'], ['abab'], ['abcabc'], ['aabcbba'], ['abcacba']],
      gen: () => {
        const n = Math.floor(Math.random() * 11);
        let s = '';
        for (let i = 0; i < n; i++) s += 'abc'[Math.floor(Math.random() * 3)];
        return [s];
      },
      hints: ['Look at the move that deletes s[i]. Either it deletes nothing else in s[i..j], or there is a leftmost other block s[k] (with s[k] = s[i]) deleted in the same move.', 'In the second case, everything strictly between i and k must be cleared first, on its own: D(i+1, k−1) + D(k, j).'],
      solution: String.raw`~~~js
function clearRow(s) {
  const n = s.length;
  if (n === 0) return 0;
  const D = [];                                  // D[i][j], with D[i][i-1] = 0
  for (let i = 0; i <= n + 1; i++) D.push(new Array(n + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)               // i decreasing
    for (let j = i; j < n; j++) {                //   j increasing
      let best = 1 + D[i + 1][j];                // s[i] deleted alone
      for (let k = i + 1; k <= j; k++)
        if (s[k] === s[i])                       // s[i] rides along with s[k]
          best = Math.min(best, (k - 1 >= i + 1 ? D[i + 1][k - 1] : 0) + D[k][j]);
      D[i][j] = best;
    }
  return D[0][n - 1];
}
~~~
$O(n^3)$ time, $O(n^2)$ space. Note that D[i+1][j] for j = i is the empty interval (0), so a single block costs 1. The tempting "split into two independent halves" recurrence with D[i][i] = 1 always returns the length of the string (5 for abcba), because it never lets equal blocks from different halves be deleted together.`,
    },
    {
      id: 'dp2-mock2-roadmap', type: 'written', title: 'Feature roadmap on a budget', difficulty: 3,
      tags: ['mt2-mock-2', 'tree dp', 'knapsack'],
      prompt: String.raw`A startup is planning which features to build next quarter. The features form a rooted tree T with n vertices: feature 1 is the core platform, and every other feature v has exactly one prerequisite p(v) (its parent in T), which must be built if v is built. Building feature v takes c(v) developer-weeks (a positive integer) and adds $g(v) \ge 0$ to the company's valuation. The team has B developer-weeks in total.

A set S of features is **buildable** if it is closed under prerequisites (if $v \in S$ and $v \ne 1$, then $p(v) \in S$) and its total cost is at most B. Building nothing is allowed.

(a) Describe and analyze an algorithm that computes the maximum total value of a buildable set. Give a full DP solution: English specification of your function(s), recurrence with base cases, memoization structure, evaluation order, and running time.
(b) Is your algorithm polynomial in the input size? Explain briefly.
(c) Run it on the following instance with B = 9.

| feature | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| prerequisite | – | 1 | 1 | 2 | 2 | 3 |
| cost c | 2 | 3 | 1 | 2 | 4 | 3 |
| value g | 1 | 6 | 2 | 7 | 8 | 5 |`,
      rubric: ['(2 pts) English specification: Best(v, b) for the subtree of v, containing v, cost at most b, plus a clear helper for combining the first j children', '(3 pts) Correct recurrences: child-by-child merge trying every budget split, −∞ when c(v) > b, correct base cases', '(1 pt) Final answer max(0, Best(1, B)), allowing the empty set', '(1 pt) Memoization structure and postorder evaluation order', '(2 pts) Running time O(nB²) (or O(nB) via preorder) with justification, labeled pseudo-polynomial', '(1 pt) Example answer 16 with features {1, 2, 3, 4}'],
      hints: ['If v is built, what is left of v\'s subtree? For each child, either nothing from its subtree or a closed set that contains that child.', 'The children only compete for budget. Fold them in one at a time, like knapsack items, trying every split of the budget between the new child and the children already merged.', 'Best(v, b) should be −∞ when c(v) > b, so impossible states never win a max.'],
      solution: String.raw`**(a)** Fix, for every vertex v, an order $u_1, \dots, u_d$ of its children. A set inside v's subtree is *closed* if every member other than v has its parent in the set.

1. **Spec.**
   - For each vertex v and $0 \le b \le B$: **Best(v, b)** = the maximum total value of a closed set inside v's subtree that **contains v** and has total cost at most b; $-\infty$ if there is none (that is, if c(v) > b).
   - For $0 \le j \le d$ and $0 \le b \le B$: **Kids(v, j, b)** = the maximum total value obtainable from the subtrees of the first j children $u_1..u_j$ with total cost at most b, where from each child's subtree we take either nothing or a closed set containing that child.

   Answer: $\max\{0,\ \text{Best}(1, B)\}$ (0 = build nothing).
2. **Recurrence.**
$$\text{Kids}(v, 0, b) = 0, \qquad \text{Kids}(v, j, b) = \max\Big\{\text{Kids}(v, j-1, b),\ \max_{0 \le a \le b}\big(\text{Best}(u_j, a) + \text{Kids}(v, j-1, b - a)\big)\Big\}$$
$$\text{Best}(v, b) = \begin{cases} g(v) + \text{Kids}(v, d, b - c(v)) & c(v) \le b\\ -\infty & c(v) > b\end{cases}$$
For a leaf, d = 0, so Best(v, b) = g(v) whenever $c(v) \le b$.
*Justification.* A closed set S containing v, minus v, splits into its intersections with the children's subtrees. Each intersection is either empty or contains its child (any member's ancestors up to the child are in S), and it is closed. Distinct subtrees impose no constraints on each other except the shared budget $b - c(v)$, so we distribute the budget among the children knapsack-style: child $u_j$ either gets nothing or some budget a, and the earlier children share the rest.
3. **Memo.** At each vertex an array Best(v, 0..B); while processing v, a temporary array Kids(v, j, 0..B) that is updated as each child is folded in.
4. **Order.** Postorder: all of v's children are finished before v. Within v, j = 1, 2, …, d.
5. **Time/space.** Folding child $u_j$ into v costs O(B) values × O(B) splits = $O(B^2)$. There is one fold per child, i.e. per tree edge: $O(nB^2)$ time, $O(nB)$ space.

(Alternative, $O(nB)$: list the vertices in preorder $x_1, \dots, x_n$ and let P(i, b) be the best value from $x_i..x_n$ with budget b, assuming the ancestors of $x_i$ are built. Then P(n+1, b) = 0 and P(i, b) = max{P(i + size($x_i$), b), $g(x_i)$ + P(i + 1, b − $c(x_i)$) if it fits}: skipping $x_i$ skips its whole subtree, which is a contiguous block in preorder.)

**(b)** No: B is a single number written with about $\lg B$ bits, so $O(nB^2)$ is exponential in the input size. The algorithm is **pseudo-polynomial**. (The problem contains 0/1 knapsack, as a star whose root has cost 1 and value 0 with budget W + 1, so it is NP-hard.)

**(c)** Best(·, b) for b = 0..9 (– means $-\infty$):

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Best(4) | – | – | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 |
| Best(5) | – | – | – | – | 8 | 8 | 8 | 8 | 8 | 8 |
| Best(6) | – | – | – | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| Best(3) | – | 2 | 2 | 2 | 7 | 7 | 7 | 7 | 7 | 7 |
| Best(2) | – | – | – | 6 | 6 | 13 | 13 | 14 | 14 | 21 |
| Best(1) | – | – | 1 | 3 | 3 | 7 | 9 | 14 | 16 | **16** |

Sample entries: Best(3, 4) = 2 + Best(6, 3) = 7. Best(2, 9) = 6 + Kids(2, 2, 6) = 6 + (7 + 8) = 21 (features 4 and 5 cost exactly 6). Best(1, 9) = 1 + Kids(1, 2, 7), where the best split of 7 weeks gives 5 to feature 2's subtree (Best(2, 5) = 13: features 2 and 4) and 2 to feature 3's (Best(3, 2) = 2): 1 + 13 + 2 = **16**.

Optimal roadmap {1, 2, 3, 4}: cost 2 + 3 + 1 + 2 = 8 ≤ 9, value 1 + 6 + 2 + 7 = 16. For comparison, {1, 2, 5} costs 9 for only 15, and {1, 2, 4, 6} would need feature 3 as well.`,
    },
    {
      id: 'dp2-mock3-tag-log', type: 'written', title: 'Repairing a corrupted tag log', difficulty: 3,
      tags: ['mt2-mock-3', 'interval dp'],
      prompt: String.raw`A server writes a log of section events. Each event is one of the four symbols ( ) [ ], meaning "open a round section", "close a round section", "open a square section", "close a square section". A log is **well formed** if it can be generated by the grammar $W \to \varepsilon \mid (W) \mid [W] \mid WW$. A bug dropped and duplicated some events, so the log s[1..n] you have may not be well formed. You want to keep as many events as possible: compute the length of the longest **subsequence** of s that is well formed (equivalently, n minus the fewest deletions that make the log well formed).

(a) Describe and analyze an algorithm: English specification, recurrence with base cases, memoization structure, evaluation order, and time/space.
(b) Explain why the cases in your recurrence cover every well-formed subsequence, and why the subproblems you combine are independent.
(c) Run it on s = ( ( ) ] ( [ ) ] ) (n = 9). Report the answer, a longest well-formed subsequence, and the number of deletions.`,
      rubric: ['(2 pts) English specification L(i, j) = longest well-formed subsequence of s[i..j], including the empty interval', '(3 pts) Recurrence: skip s[i], or match s[i] with a matching closer s[k], giving 2 + L(i+1, k−1) + L(k+1, j); base cases', '(1 pt) Justification that the cases are exhaustive and that the inside and outside parts are independent', '(1 pt) Memoization structure and a valid evaluation order (i decreasing with j increasing, or by length)', '(2 pts) O(n³) time and O(n²) space, with justification', '(1 pt) Example: answer 6, e.g. ( ( ) [ ] ), and 3 deletions'],
      hints: ['Look at the first symbol s[i]. Either it is not used, or it is an opening symbol matched with some closing symbol s[k] of the same kind.', 'If s[i] is matched with s[k], the kept symbols strictly between them form a well-formed sequence, and so do the kept symbols after s[k].', 'The answer is L(1, n); an empty interval has value 0.'],
      solution: String.raw`Call a pair (x, y) **matching** if x = ( and y = ), or x = [ and y = ].

**(a)**
1. **Spec.** For $1 \le i \le n+1$ and $i - 1 \le j \le n$: L(i, j) = the length of the longest well-formed subsequence of s[i..j] (0 for the empty interval j = i − 1). Answer L(1, n); the fewest deletions is n − L(1, n).
2. **Recurrence.** L(i, i − 1) = 0, and for $i \le j$:
$$L(i,j) = \max\Big\{\,L(i+1, j),\ \ \max_{\substack{i < k \le j\\ (s_i, s_k) \text{ matching}}} \big(2 + L(i+1, k-1) + L(k+1, j)\big)\Big\}$$
(the inner max is empty, and ignored, if no such k exists; in particular a closing symbol $s_i$ can only be skipped).
3. **Memo.** A 2D array L[1..n+1][0..n].
4. **Order.** i from n down to 1; for each i, j from i up to n. Every entry read has a larger first index (i + 1 or k + 1), or is the empty interval.
5. **Time/space.** $O(n^2)$ entries, each a max over O(n) choices of k: $O(n^3)$ time, $O(n^2)$ space.

**(b)** Take any well-formed subsequence Q of s[i..j]. If Q does not use $s_i$, it is a well-formed subsequence of s[i+1..j], covered by the first case. If it does, $s_i$ is Q's first symbol. The first symbol of a nonempty well-formed sequence is an opening symbol, and it has a unique matching partner: Q = (A) R or [A] R with A and R well formed. Let the partner be $s_k$. Then A uses only positions strictly between i and k, and R only positions after k, so A is a well-formed subsequence of s[i+1..k−1] and R of s[k+1..j]. The two parts use disjoint position ranges, so each can be chosen independently: the best choice is L(i+1, k−1) and L(k+1, j). Conversely, for any matching k, the sequence $s_i$ A $s_k$ R built from optimal A and R is a well-formed subsequence of s[i..j]. So the recurrence is an exact max over all possibilities.

(An equivalent accepted recurrence: $L(i, j) = \max\{[s_i, s_j \text{ match}](2 + L(i+1, j-1)),\ \max_{i \le k < j} L(i, k) + L(k+1, j)\}$, also $O(n^3)$.)

**(c)** s = ( ( ) ] ( [ ) ] ) at positions 1..9. Some entries: L(2, 3) = 2 ("()"); L(6, 8) = 2 ("[]" from positions 6, 8); L(5, 9) = 4 ("([])" from positions 5, 6, 8, 9); L(2, 6) = 2; L(2, 8) = 4 ("()" and "[]").
At the top: skipping $s_1$ gives L(2, 9) = 6; matching $s_1$ with $s_7$ gives 2 + L(2, 6) + L(8, 9) = 2 + 2 + 0 = 4; matching $s_1$ with $s_9$ gives 2 + L(2, 8) = 2 + 4 = 6. So L(1, 9) = **6**. A longest well-formed subsequence is ( ( ) [ ] ) from positions 1, 2, 3, 6, 8, 9; the fewest deletions is 9 − 6 = **3**. (Well-formed logs have even length, so the only possible improvement would be 8, i.e. a single deletion; the DP certifies that no single deletion works.)`,
    },
  ],
});
