CS374.topic({
  id: 'mst',
  unit: 'algorithms',
  order: 18,
  title: 'Minimum Spanning Trees',
  summary: 'Safe and useless edges, the cut and cycle properties, uniqueness with distinct weights, and the three classic MST algorithms (Borůvka, Jarník/Prim, Kruskal with union-find), plus variations and exchange-argument proofs.',
  objectives: [
    'State and prove the cut property (safe edges) and the cycle property (useless edges) by an exchange argument',
    'Prove that distinct edge weights imply a unique minimum spanning tree',
    'Run Borůvka, Jarník/Prim and Kruskal by hand and state their running times and data structures',
    'Solve MST variations: maximum spanning tree, bottleneck/minimax paths, updates after a weight change, membership of an edge',
    'Write greedy-correctness proofs using exchange arguments'
  ],

  lesson: String.raw`
## The problem

Let $G = (V, E)$ be a **connected, undirected** graph with edge weights $w(e)$ (any real numbers, negative allowed). A **spanning tree** is a subgraph that is a tree and contains every vertex; it has exactly $V - 1$ edges. A **minimum spanning tree (MST)** is a spanning tree of minimum total weight. If $G$ is disconnected, the analogous object is a **minimum spanning forest** (an MST of each component).

Useful tree facts: a tree on $n$ vertices has $n - 1$ edges; adding any edge to a tree creates exactly one cycle; removing any edge of a tree splits it into exactly two components.

> **Key idea.** Only the **order** of the weights matters for MSTs, not their values. Adding a constant to every weight, or applying any strictly increasing function, does not change which trees are minimum. (This is very different from shortest paths!)

### Distinct weights

To simplify proofs we assume the edge weights are **distinct**. This is no real restriction: break ties consistently (e.g., by comparing $(w(e), \text{index}(e))$ pairs).

> **Lemma.** If all edge weights are distinct, then $G$ has a **unique** minimum spanning tree.

*Proof.* Suppose $T \neq T'$ are both MSTs. Let $e$ be the **lightest** edge in the symmetric difference $T \oplus T'$; say $e \in T \setminus T'$ (the other case is symmetric). Adding $e$ to $T'$ creates a cycle $C$. Since $T$ is acyclic, $C$ contains some edge $f \notin T$; then $f \in T' \setminus T \subseteq T \oplus T'$ and $f \ne e$, so $w(f) > w(e)$ by the choice of $e$ and distinctness. Now $T' + e - f$ is a spanning tree (removing an edge of the cycle keeps it connected) with weight $w(T') + w(e) - w(f) < w(T')$, contradicting that $T'$ is minimum. ∎

The converse is false: a graph can have a unique MST despite repeated weights (e.g., a graph that is already a tree).

## Safe and useless edges

All MST algorithms are instances of one generic greedy algorithm. They maintain an **intermediate spanning forest** $F$, a subgraph of the (unique) MST, starting from $F = (V, \emptyset)$. Relative to $F$, each edge not in $F$ is one of:

> **Definition.** An edge is **useless** if both endpoints lie in the same component of $F$. An edge is **safe** if it is the minimum-weight edge with exactly one endpoint in some component of $F$. All other edges are **undecided**.

Each component of $F$ has exactly one safe edge (its lightest outgoing edge), but one edge may be safe for two components.

> **Lemma.** (Prim's lemma / cut property.) The minimum spanning tree contains every safe edge. More generally, for any partition of $V$ into $S$ and $V \setminus S$, the lightest edge crossing the cut belongs to the MST.

*Proof (exchange argument).* Let $e = uv$ be the lightest edge crossing the cut $(S, V\setminus S)$, with $u \in S$, and suppose the MST $T$ does not contain $e$. The path in $T$ from $u$ to $v$ starts in $S$ and ends outside $S$, so it contains some edge $e'$ crossing the cut, and $w(e') > w(e)$. Then $T - e' + e$ is a spanning tree (we removed an edge from the unique cycle of $T + e$) that weighs less than $T$: contradiction. ∎

> **Lemma.** (Cycle property.) For any cycle $C$ in $G$, the heaviest edge of $C$ is **not** in the MST. In particular, the MST contains no useless edge (a useless edge closes a cycle with edges of $F$, all of which are in the MST).

*Proof.* Let $e = uv$ be the heaviest edge on $C$ and suppose $e \in T$. Removing $e$ splits $T$ into two components; the rest of $C$ is a path from $u$ to $v$, so it contains an edge $e'$ crossing between them, with $w(e') < w(e)$. Then $T - e + e'$ is a lighter spanning tree. ∎

So the generic algorithm is: **repeatedly add one or more safe edges to $F$** (and ignore useless edges). After $V - 1$ additions $F$ is the MST. The three classic algorithms differ only in which safe edges they add, and in what order.

### Why the generic algorithm is correct

> **Theorem.** Start with $F = (V, \emptyset)$ and repeatedly add one or more safe edges until no safe edge remains. With distinct weights, the final $F$ is the minimum spanning tree $T$.

*Proof.* We maintain the invariant $F \subseteq T$. It holds at the start. Every safe edge is the lightest edge leaving some component $C$ of $F$, i.e., the lightest edge crossing the cut $(C, V \setminus C)$, so by the cut property it belongs to $T$. Hence adding any collection of safe edges, even several at once as Borůvka does, keeps $F \subseteq T$; in particular $F$ stays acyclic, because $T$ is.

When does the process stop? As long as $F$ has two or more components, each component $C$ has at least one edge leaving it (because $G$ is connected), so $C$ has a safe edge. Therefore the process only stops when $F$ is connected. A connected spanning subgraph of the tree $T$ must be all of $T$ (deleting any edge of a tree disconnects it). So $F = T$. ∎

Notice what the proof needs: the cut property (to show safe edges are correct choices) and connectivity of $G$ (to show we never get stuck). Each concrete algorithm then only has to argue that the edges it adds are safe.

### Proving the cut property carefully

The exchange argument is the single most reused proof in this unit, so here it is with every step justified.

> **Lemma.** (Cut property, distinct weights.) Let $S$ be any set with $\emptyset \ne S \ne V$ and let $e = uv$ be the lightest edge with $u \in S$, $v \notin S$. Then $e$ is in the MST $T$.

1. Suppose not: $e \notin T$.
2. $T$ is a spanning tree, so it contains a unique path $P$ from $u$ to $v$.
3. $P$ starts at $u \in S$ and ends at $v \notin S$, so at some point it must step from a vertex in $S$ to a vertex outside $S$: some edge $e'$ of $P$ crosses the cut. Since $e \notin T$, $e' \ne e$.
4. $e$ is the lightest crossing edge and weights are distinct, so $w(e') > w(e)$.
5. $T + e$ contains exactly one cycle, namely $P + e$, and $e'$ lies on it. Deleting $e'$ from $T + e$ leaves a connected graph (any walk that used $e'$ can detour around the rest of the cycle) with $V - 1$ edges, i.e., a spanning tree $T' = T + e - e'$.
6. $w(T') = w(T) + w(e) - w(e') < w(T)$, contradicting minimality of $T$. ∎

The cycle property is the mirror image: delete the heaviest cycle edge from $T$ and reconnect the two halves with another (lighter) edge of the same cycle.

**Running example** (each algorithm produces the same MST, of weight 19):

~~~graph
undirected
a b 4
a c 1
b c 3
b d 2
c d 7
c e 6
d e 5
d f 9
e f 8
~~~

## Borůvka's algorithm

Add **all** safe edges in each round.

~~~pseudo
Boruvka(V, E):
    F <- (V, empty set)
    count <- CountAndLabel(F)          // label each vertex with its component of F
    while count > 1:
        AddAllSafeEdges(E, F, count)
        count <- CountAndLabel(F)
    return F

AddAllSafeEdges(E, F, count):
    for i <- 1 to count: S[i] <- nil
    for each edge uv in E:
        if comp(u) != comp(v):
            if S[comp(u)] = nil or w(uv) < w(S[comp(u)]): S[comp(u)] <- uv
            if S[comp(v)] = nil or w(uv) < w(S[comp(v)]): S[comp(v)] <- uv
    for i <- 1 to count:
        if S[i] != nil: add S[i] to F
~~~

Each round takes $O(V + E)$ time (one component-labeling search plus one scan of the edges). Every component gets merged with at least one other, so the number of components at least **halves** each round: at most $O(\log V)$ rounds. Total: $O(E \log V)$.

*Example.* Round 1: lightest edges at $a, b, c, d, e, f$ are $ac$, $bd$, $ac$, $bd$, $de$, $ef$; adding them leaves components $\{a, c\}$ and $\{b, d, e, f\}$. Round 2: both components' lightest outgoing edge is $bc$ (3). Done: $\{ac, bd, de, ef, bc\}$, weight $1 + 2 + 5 + 8 + 3 = 19$.

> **Warning.** Borůvka relies on distinct weights (or consistent tie-breaking). With ties, two components could pick different equal-weight edges that together close a cycle, e.g., a triangle with all weights equal.

Borůvka is also naturally parallel and is the basis of the fastest known (randomized linear-time) MST algorithms.

## Jarník's algorithm (a.k.a. Prim's)

Grow a **single** tree $T$ from a start vertex, always adding $T$'s safe edge (the lightest edge with exactly one endpoint in $T$). Implement with a priority queue: whatever-first search where the bag is a priority queue keyed by edge weight.

~~~pseudo
Jarnik(G, s):
    for each v: key(v) <- infinity; parent(v) <- nil
    key(s) <- 0
    put all vertices in priority queue Q keyed by key
    while Q is not empty:
        u <- ExtractMin(Q)              // add edge parent(u)-u to T
        for each edge uv:
            if v is in Q and w(uv) < key(v):
                key(v) <- w(uv); parent(v) <- u
                DecreaseKey(Q, v, key(v))
~~~

Here $key(v)$ is the weight of the lightest edge from the current tree to $v$. Time: $O(E \log V)$ with a binary heap; $O(E + V \log V)$ with a Fibonacci heap (better for dense graphs).

*Example from $a$.* Add $ac$ (1); then $bc$ (3); then $bd$ (2); then $de$ (5); then $ef$ (8). Weight 19.

~~~steps Jarník from a, tracking the keys
**Start.** key$(a) = 0$ and every other key is $\infty$. ExtractMin returns $a$. Scanning $a$'s edges sets key$(b) = 4$ and key$(c) = 1$ (both with parent $a$).

| vertex | b | c | d | e | f |
|---|---|---|---|---|---|
| key | 4 | 1 | ∞ | ∞ | ∞ |
+++
**Extract $c$ (key 1)**, adding the edge $ac$. Scan $c$: $w(cb) = 3 < 4$, so key$(b) \leftarrow 3$ with parent $c$; key$(d) \leftarrow 7$; key$(e) \leftarrow 6$.

| vertex | b | d | e | f |
|---|---|---|---|---|
| key | 3 | 7 | 6 | ∞ |
+++
**Extract $b$ (key 3)**, adding $cb$. Scan $b$: $w(bd) = 2 < 7$, so key$(d) \leftarrow 2$ with parent $b$. ($a$ is already in the tree, so $ab$ is ignored.)

| vertex | d | e | f |
|---|---|---|---|
| key | 2 | 6 | ∞ |
+++
**Extract $d$ (key 2)**, adding $bd$. Scan $d$: $w(de) = 5 < 6$, so key$(e) \leftarrow 5$; key$(f) \leftarrow 9$. ($cd$ is ignored: $c$ is in the tree.)
+++
**Extract $e$ (key 5)**, adding $de$. Scan $e$: $w(ef) = 8 < 9$, so key$(f) \leftarrow 8$.
+++
**Extract $f$ (key 8)**, adding $ef$. The queue is empty. Tree: $\{ac, cb, bd, de, ef\}$, weight 19, the same tree Kruskal finds (as it must, since the weights are distinct).

Observe: keys only ever **decrease**, and key$(v)$ is always the lightest edge from the current tree to $v$. Dijkstra would use $dist(u) + w(uv)$ instead and would build a different tree.
~~~

**Correctness of Jarník.** When $u$ is extracted, its key edge parent$(u)u$ is the lightest edge with exactly one endpoint in the current tree $T$ (every such edge was offered to its outside endpoint when the inside endpoint was extracted, and the queue minimum is the minimum over all of them). So it is $T$'s safe edge, and the generic theorem applies.

**Dense graphs.** If the "priority queue" is just an array of keys, ExtractMin is a linear scan ($O(V)$) and DecreaseKey is $O(1)$, for $O(V^2 + E) = O(V^2)$ total. When $E = \Theta(V^2)$ this beats the binary heap's $O(E \log V) = O(V^2 \log V)$ and matches the Fibonacci heap bound.

Note the similarity with Dijkstra: the only difference is the key (edge weight $w(uv)$ for Jarník versus path length $dist(u) + w(uv)$ for Dijkstra).

## Kruskal's algorithm

Scan the edges in **increasing** order of weight; add an edge whenever its endpoints are in different components of $F$.

~~~pseudo
Kruskal(V, E):
    sort E by increasing weight
    F <- empty set
    for each vertex v: MakeSet(v)
    for each edge uv in sorted order:
        if Find(u) != Find(v):          // uv is not useless
            add uv to F
            Union(u, v)
    return F
~~~

*Why each added edge is safe.* When we examine $uv$ with $u$, $v$ in different components, every lighter edge has already been examined: each was either added or useless. So no lighter edge leaves $u$'s component, and $uv$ is that component's safe edge.

*Example.* Scan: $ac$ (1) add, $bd$ (2) add, $bc$ (3) add, $ab$ (4) useless, $de$ (5) add, $ce$ (6) useless, $cd$ (7) useless, $ef$ (8) add, $df$ (9) useless.

**Running time.** Sorting: $O(E \log E) = O(E \log V)$ (since $E < V^2$). Then $2E$ Finds and $V - 1$ Unions. With **union by rank and path compression**, any sequence of $m$ union-find operations on $n$ elements takes $O(m\, \alpha(n))$ time, where $\alpha$ is the inverse Ackermann function ($\le 4$ for any conceivable input). So the scan is $O(E \alpha(V))$ and sorting dominates: $O(E \log V)$. If the edges are already sorted (or can be sorted in linear time, e.g., small integer weights), Kruskal runs in $O(E\, \alpha(V))$.

### Union–find in brief

Each set is a rooted tree; $Find(x)$ follows parent pointers to the root. **Union by rank** hangs the shallower root under the deeper one, so trees have height $O(\log n)$ (giving $O(\log n)$ per operation already). **Path compression** makes every node on a Find path point directly to the root, giving the $O(\alpha(n))$ amortized bound.

> **Lemma.** With union by rank (no compression), a root of rank $r$ has at least $2^r$ nodes in its tree. Hence every rank, and every tree height, is at most $\log_2 n$.

*Proof.* Induction on the operations. A singleton has rank 0 and $2^0 = 1$ node. A root's rank changes only when two roots of equal rank $r$ are linked; the new root then has rank $r + 1$ and at least $2^r + 2^r = 2^{r+1}$ nodes. Linking a smaller-rank root underneath only adds nodes. Without compression, the height of a tree equals its root's rank, so heights are at most $\log_2 n$. ∎

Without union by rank, the sequence $Union(v_1, v_2), Union(v_2, v_3), \dots$ (always hanging the first root under the second) builds a path of height $n - 1$, and $n$ Finds on $v_1$ then cost $\Theta(n^2)$ in total.

~~~steps Kruskal with union–find on the running example
**Setup.** Sorted edges: $ac$ 1, $bd$ 2, $bc$ 3, $ab$ 4, $de$ 5, $ce$ 6, $cd$ 7, $ef$ 8, $df$ 9. Every vertex is its own root with rank 0. Convention: when two roots of equal rank are linked, the second becomes a child of the first, and the first root's rank increases by one; otherwise the lower-rank root goes under the higher-rank root.
+++
**Edge $ac$ (1).** Find$(a) = a$, Find$(c) = c$: different roots, so add $ac$. Equal ranks: parent$(c) \leftarrow a$, rank$(a) = 1$. Forest $\{ac\}$.
+++
**Edge $bd$ (2).** Find$(b) = b$, Find$(d) = d$: add $bd$. parent$(d) \leftarrow b$, rank$(b) = 1$. Sets: $\{a, c\}$ (root $a$), $\{b, d\}$ (root $b$), $\{e\}$, $\{f\}$.
+++
**Edge $bc$ (3).** Find$(b) = b$; Find$(c)$ follows $c \to a$, root $a$. Different: add $bc$. Both roots have rank 1, so parent$(a) \leftarrow b$ and rank$(b) = 2$. Pointers now: $c \to a \to b$, $d \to b$.
+++
**Edge $ab$ (4).** Find$(a)$: $a \to b$, root $b$. Find$(b) = b$. Same root: $ab$ is **useless** (it would close the cycle $a, c, b$). Skip it.
+++
**Edge $de$ (5).** Find$(d) = b$, Find$(e) = e$: add $de$. rank$(b) = 2 >$ rank$(e) = 0$, so parent$(e) \leftarrow b$; ranks unchanged.
+++
**Edge $ce$ (6).** Find$(c)$ walks $c \to a \to b$, and **path compression** resets parent$(c) \leftarrow b$. Find$(e) = b$. Same root: useless. **Edge $cd$ (7):** Find$(c)$ now takes one hop to $b$; Find$(d) = b$. Useless.
+++
**Edge $ef$ (8).** Find$(e) = b$, Find$(f) = f$: add $ef$, parent$(f) \leftarrow b$. The forest has $5 = V - 1$ edges, so we may stop; $df$ (9) would be useless anyway.

**Result:** $\{ac, bd, bc, de, ef\}$ of weight $1 + 2 + 3 + 5 + 8 = 19$, using exactly $V - 1 = 5$ Unions and two Finds per examined edge.
~~~

## Summary of algorithms

| Algorithm | Safe edges added | Data structure | Time |
|---|---|---|---|
| Borůvka | all safe edges, each round | component labels (WFS) | $O(E \log V)$ |
| Jarník/Prim | safe edge of the one growing tree | binary heap / Fibonacci heap | $O(E \log V)$ / $O(E + V\log V)$ |
| Kruskal | globally lightest non-useless edge | sorting + union–find | $O(E \log V)$ |

## Ties: what survives without distinct weights

Exam problems do not always promise distinct weights. Here is exactly what remains true; every proof is the same exchange argument with $\le$ in place of $<$.

- **Weak cut property.** If $e$ is *a* lightest edge crossing some cut (ties allowed), then *some* MST contains $e$. If $e$ is the *unique* lightest edge crossing some cut, then *every* MST contains $e$.
- **Weak cycle property.** If $e$ is the *unique* heaviest edge on some cycle, then *no* MST contains $e$. If $e$ is only tied for heaviest, it may be in some MST: in a triangle with three equal weights, every edge belongs to some MST.
- **Algorithms.** Kruskal and Jarník return *an* MST however ties are broken. Borůvka needs a *consistent* tie-breaking rule (compare $(w(e), \text{index}(e))$), or it can create a cycle.
- **Every MST is reachable.** For any MST $M$, running Kruskal with ties broken in favor of the edges of $M$ outputs exactly $M$.
- **Same weight profile.** All MSTs of a graph have the same sorted list of edge weights, so "the heaviest MST edge" or "the $j$-th lightest MST edge" is well defined.

*Proof of the weak cut property.* Let $e = uv$ be a lightest edge crossing $(S, V \setminus S)$ and let $T$ be any MST. If $e \notin T$, the $T$-path from $u$ to $v$ crosses the cut at some edge $e' \ne e$ with $w(e') \ge w(e)$. Then $T - e' + e$ is a spanning tree of weight at most $w(T)$, so it is also an MST, and it contains $e$. If $e$ is the unique lightest crossing edge, then $w(e') > w(e)$ and $T - e' + e$ would be strictly lighter than $T$; so $e \notin T$ is impossible. ∎

*Proof of the weight profile.* Fix a threshold $x$, let $G_{\le x}$ be the subgraph of edges of weight at most $x$, and let $c(x)$ be its number of components. For any MST $M$, the edges $M_{\le x}$ form a forest inside $G_{\le x}$. If this forest had more than $c(x)$ components, some edge $f$ of $G_{\le x}$ would join two of its components; the $M$-path between $f$'s endpoints must then use an edge heavier than $x \ge w(f)$, and swapping that edge for $f$ makes $M$ lighter, which is impossible. So $|M_{\le x}| = V - c(x)$ for every MST $M$ and every $x$, which pins down how many MST edges have each weight. ∎

## Variations and standard facts

**Maximum spanning tree.** Negate all weights (or scan in decreasing order in Kruskal). The cut property becomes "the heaviest edge across any cut is in the max spanning tree".

**Minimum bottleneck spanning tree.** The *bottleneck* of a spanning tree is its heaviest edge. Every MST minimizes the bottleneck. Even better: for every pair $u, v$, the path between them in the MST minimizes the maximum edge weight over all $u$-$v$ paths in $G$ (the **minimax path**). *Proof sketch:* if some $u$-$v$ path $P$ had all edges lighter than the heaviest edge $e$ on the MST path, then removing $e$ from the MST splits it into two parts with $u$ and $v$ on different sides; $P$ crosses between them via an edge lighter than $e$, and swapping gives a lighter spanning tree.

**Is a given edge in the MST?** With distinct weights, edge $e = uv$ is in the MST **iff** there is no $u$-$v$ path using only edges lighter than $w(e)$. ($\Leftarrow$ by the cut property applied to the component of $u$ in the "lighter-than-$e$" subgraph; $\Rightarrow$ by the cycle property.) Test with one whatever-first search: $O(V + E)$.

**Updating after a weight change** (distinct weights, current MST $T$):

| Change | Effect | Update time |
|---|---|---|
| tree edge gets lighter | $T$ unchanged | $O(1)$ |
| non-tree edge gets heavier | $T$ unchanged | $O(1)$ |
| non-tree edge $e$ gets lighter | add $e$, delete the heaviest edge on the cycle it closes | $O(V)$ |
| tree edge $e$ gets heavier | delete $e$, add the lightest edge crossing the resulting cut | $O(V + E)$ |

**Monotone transformations.** Replacing $w$ by $f(w)$ for any strictly increasing $f$ (e.g., $w + c$, $\log w$, $w^3$) keeps the MST. For example, to minimize the *product* of positive weights, the ordinary MST works.

**Shortest-path trees are not MSTs.** The MST minimizes the total weight of the tree; a shortest-path tree minimizes each root-to-vertex distance. Counterexample: triangle $s, a, b$ with $w(sa) = w(sb) = 2$ and $w(ab) = 1$: the shortest-path tree from $s$ is $\{sa, sb\}$ (weight 4), while the MST is $\{ab, sa\}$ (weight 3) or $\{ab, sb\}$.

## Writing exchange-argument proofs

Greedy correctness proofs in CS 374 almost always follow one template:

1. Assume an optimal solution $T$ that does **not** agree with the greedy choice $e$.
2. Show how to **exchange**: add $e$ and remove some element $e'$ of $T$ so that the result is still feasible (for trees: remove an edge of the cycle created, or reconnect across the cut).
3. Show the exchange **does not make things worse** (here: $w(e) \le w(e')$, strictly with distinct weights), contradicting optimality or showing an optimal solution containing the greedy choice exists.
4. Conclude by induction over the greedy steps.

> **Exam tip.** In exchange arguments for spanning trees, be explicit about *why* the result is still a spanning tree: "$T + e$ contains exactly one cycle $C$, which contains $e$; deleting any other edge of $C$ leaves a connected graph with $V-1$ edges, hence a spanning tree." Also say *which* edge you remove and why it is heavier, usually "because it crosses the same cut as $e$, and $e$ is the lightest edge crossing that cut".

## Worked examples (try each before opening the solution)

### Example 1: lightest on a cycle

*True or false (distinct weights): if $e$ is the lightest edge on some cycle of $G$, then $e$ is in the MST.*

~~~~reveal Solution
**False.** Being the lightest edge on *one* cycle says nothing, because a *different* cycle may make $e$ the heaviest. Counterexample:

~~~graph
undirected
a b 5
b c 6
c a 7
a d 1
d b 2
~~~

$ab$ (5) is the lightest edge on the cycle $a, b, c$, but it is the heaviest edge on the cycle $a, d, b$, so the cycle property excludes it. Indeed Kruskal takes $ad$ (1) and $db$ (2), rejects $ab$ (5) as useless, and takes $bc$ (6): the MST is $\{ad, db, bc\}$.

*Lesson:* to show an edge is **in** the MST, exhibit a **cut** on which it is the lightest; to show it is **out**, exhibit a **cycle** on which it is the heaviest. Any other kind of evidence proves nothing.
~~~~

### Example 2: squaring the weights

*Let $T$ be the MST of $G$ under distinct real weights $w$. Is $T$ necessarily an MST under $w'(e) = w(e)^2$?*

~~~reveal Solution
**Not if negative weights are allowed.** Take a triangle with $w(xy) = -3$, $w(yz) = 1$, $w(zx) = 2$. Under $w$ the MST is $\{xy, yz\}$ (weight $-2$). Under the squares the weights become $9, 1, 4$ and the MST is $\{yz, zx\}$.

If all weights are **nonnegative**, the answer is yes: $t \mapsto t^2$ is strictly increasing on $[0, \infty)$, so it preserves the order of the weights, and Kruskal makes exactly the same decisions.

General rule: the MST depends only on the *relative order* of the weights. A transformation preserves every MST exactly when it is strictly increasing on the set of weights that occur. Safe: $w + c$, $3w$, $w^3$, $2^w$, $\log w$ (for positive $w$). Not safe in general: $w^2$, $|w|$, $1/w$, $-w$.
~~~

### Example 3: a vertex that must be a leaf

*Given a connected weighted graph $G$ and a vertex $v$, find a minimum-weight spanning tree in which $v$ has degree exactly 1. Assume $G - v$ is connected.*

~~~reveal Solution
**Decouple the two parts.** If $T$ is a spanning tree in which $v$ is a leaf, then $T - v$ is a spanning tree of $G - v$ (deleting a leaf keeps a tree), and $T$ is $T - v$ plus one edge $vx$. Conversely, any spanning tree of $G - v$ plus any single edge $vx$ is a spanning tree of $G$ in which $v$ is a leaf. So

$$\min w(T) = \big(\text{MST weight of } G - v\big) + \min_{x} w(vx),$$

and the two terms can be minimized independently. **Algorithm:** compute an MST of $G - v$ with Kruskal, then attach $v$ by its lightest incident edge. $O(E \log V)$.

Why not "compute the MST and repair it"? Because the best tree with $v$ as a leaf can differ from the MST in many edges elsewhere; the clean decomposition avoids having to reason about repairs. (If $G - v$ is disconnected, no such tree exists, since $v$ would have to connect the pieces.)
~~~

### Example 4: a new vertex arrives

*You already have the MST $T$ of $G$ (distinct weights). A new vertex $z$ is added together with $d$ edges from $z$ to existing vertices. Compute the new MST in $O(V \log V)$ time, independent of $E$.*

~~~reveal Solution
**Claim.** The new MST uses only edges of $T$ and the new edges $E_z$.

*Proof.* Let $f = xy$ be an old edge not in $T$. The $T$-path from $x$ to $y$ plus $f$ is a cycle in $G$; its heaviest edge is not in the MST, and every edge other than $f$ is in $T$, so $f$ is the heaviest edge on it. The same cycle exists in $G + z$, with the same weights, so by the cycle property $f$ is not in the new MST either.

**Algorithm.** Run Kruskal on the graph with vertex set $V \cup \{z\}$ and edge set $T \cup E_z$. It has at most $(V - 1) + d \le 2V - 1$ edges, so this takes $O(V \log V)$ time. By the claim, the MST of this small graph is the MST of $G + z$ (it is a subgraph that contains the true MST, and the MST of a subgraph that contains the true MST must be that MST, by uniqueness).

The same claim with $d = 1$ gives the single-edge case: adding one new edge $e$ only requires removing the heaviest edge on the cycle that $e$ closes in $T$, in $O(V)$ time.
~~~

### Example 5: clustering

*Given $n$ points and a distance $d(p, q)$ for each pair, split the points into exactly $k$ nonempty clusters so that the **spacing** (the smallest distance between two points in different clusters) is as large as possible.*

~~~reveal Solution
**Algorithm.** Run Kruskal on the complete graph with weights $d(p, q)$, and stop as soon as exactly $k$ components remain. Output those components. (Equivalently: compute an MST and delete its $k - 1$ heaviest edges.) Time $O(n^2 \log n)$.

**Correctness.** Let $\mathcal C$ be Kruskal's clustering and $d^*$ the weight of the next edge Kruskal *would* add. Every edge between different clusters of $\mathcal C$ comes at or after that edge in sorted order, so the spacing of $\mathcal C$ is exactly $d^*$.

Take any other $k$-clustering $\mathcal C'$. Both have $k$ clusters and differ, so some cluster of $\mathcal C$ is not contained in a single cluster of $\mathcal C'$ (otherwise $\mathcal C$ would refine $\mathcal C'$, and two partitions with the same number of parts where one refines the other are equal). Pick points $p, q$ that are together in $\mathcal C$ but separated in $\mathcal C'$. Kruskal connected $p$ and $q$ by a path of added edges, each of weight at most $d^*$. That path starts in $p$'s $\mathcal C'$-cluster and ends elsewhere, so one of its edges joins two different $\mathcal C'$-clusters. Hence the spacing of $\mathcal C'$ is at most $d^*$. ∎
~~~

## Common exam problem patterns

| Pattern | Recipe |
|---|---|
| **"Prove or disprove" about MSTs** | For "$e$ is in the MST" look for a cut where $e$ is lightest; for "$e$ is not in the MST" look for a cycle where $e$ is heaviest. For counterexamples try a triangle, a triangle with a pendant edge (bridges!), or two triangles sharing an edge. Ask yourself: what about ties, negative weights, bridges, disconnected graphs? |
| **Modify the graph, then run a standard MST algorithm** | Forced edges: union them first, then run Kruskal. Forbidden edges: delete them. Vertex must be a leaf: MST of the rest plus lightest attaching edge. Extra source of cost (e.g., "build a well at a vertex for cost $c_v$"): add a super-vertex joined to each $v$ with weight $c_v$. |
| **Update after a change** | Non-tree edge lighter or new edge: add it and delete the heaviest edge on its cycle ($O(V)$). Tree edge heavier or deleted: delete it and add the lightest edge across the cut ($O(V+E)$). Tree edge lighter or non-tree edge heavier: nothing changes. |
| **Is edge $e$ in the MST / some MST / every MST?** | Search from $u$ using edges lighter than $w(e)$ (in some MST iff $v$ is unreachable). For *every* MST, use edges of weight $\le w(e)$ other than $e$ itself. $O(V + E)$. |
| **Bottleneck / minimax** | The MST path is a minimax path; every MST is a minimum bottleneck spanning tree; Kruskal-until-connected answers "smallest $W$ such that $s$ reaches $t$ using edges $\le W$". |
| **Faster MST for special weights** | Few distinct or small integer weights: sort in linear time, then Kruskal is $O(E\,\alpha(V))$. Weights in $\{1, 2\}$: two rounds of spanning forest plus contraction, $O(V+E)$. |
| **Greedy correctness proof** | Exchange argument: assume an optimal tree without the greedy edge, add it, remove a heavier edge from the created cycle or the same cut, justify that the result is a spanning tree. |
| **Applications** | Clustering (stop Kruskal early), maximum-reliability network (maximize a product: use $\log$, an increasing map), cheapest set of edges whose removal breaks all cycles (complement of a maximum spanning forest). |

## Where students lose points

- **Using the wrong property.** "Lightest edge on a cycle is in the MST" and "heaviest edge across a cut is not in the MST" are both false. The correct pairs are *lightest/cut/in* and *heaviest/cycle/out*.
- **Forgetting bridges.** "The heaviest edge of $G$ is not in the MST" fails when that edge is a bridge, because every spanning tree must contain it.
- **Assuming distinct weights when the problem does not say so.** With ties, the MST may not be unique, and statements should say "some MST" or "every MST".
- **Confusing MSTs with shortest-path trees.** The MST path between two vertices is a minimax path, not a shortest path. Adding a constant to every weight changes shortest paths but not MSTs.
- **Non-monotone transformations.** Squaring, absolute values, and reciprocals do not preserve the order of the weights in general.
- **Incomplete exchange arguments.** Say which edge is removed, why the result is still a spanning tree, and why its weight did not increase.
- **Running time slips.** Kruskal is $O(E \log V)$ because of sorting, not $O(E\,\alpha(V))$, unless the edges can be sorted in linear time. Recomputing the MST from scratch ($O(E \log V)$) when an $O(V)$ update was asked for loses most of the credit.
- **Disconnected inputs.** If $G$ might be disconnected, say what you return (a minimum spanning forest, or "no spanning tree exists").

## Self-check

1. Why does adding the same constant to every edge weight never change the MST, while it can change shortest paths?

~~~reveal Answer
Every spanning tree has exactly $V - 1$ edges, so every tree's weight shifts by the same amount $(V-1)c$ and the ordering of trees is unchanged. Paths have different numbers of edges, so a path with many edges is penalized more than a path with few edges.
~~~

2. Can the heaviest edge of a connected graph belong to the MST?

~~~reveal Answer
Yes, exactly when it is a bridge (it lies on no cycle). Then every spanning tree, including the MST, must contain it. If it lies on some cycle, it is the heaviest edge on that cycle and (with distinct weights) is not in the MST.
~~~

3. What is the running time of Kruskal if the edges are given already sorted by weight?

~~~reveal Answer
$O(E\,\alpha(V))$: one pass with $2E$ Finds and $V - 1$ Unions, using union by rank and path compression.
~~~

4. The weight of a non-tree edge $e$ decreases. Which edge leaves the MST, if any?

~~~reveal Answer
$T + e$ has a unique cycle (the tree path between $e$'s endpoints plus $e$). The heaviest edge on that cycle leaves; if that heaviest edge is $e$ itself, the tree is unchanged. $O(V)$ time.
~~~

5. Why can Borůvka's algorithm fail when there are ties, and how is it fixed?

~~~reveal Answer
Different components may choose different equal-weight edges that together close a cycle (in a triangle with equal weights, each vertex may choose a different edge). Fix: break ties consistently by comparing $(w(e), \text{index}(e))$; then all chosen edges are safe for the same strict order and lie in the unique MST for that order.
~~~

6. Is every minimum bottleneck spanning tree an MST?

~~~reveal Answer
No. The bottleneck only measures the heaviest edge. If every spanning tree must contain a heavy bridge, every spanning tree is bottleneck-optimal, including ones that waste weight elsewhere.
~~~

7. How many minimum spanning trees does a cycle on $n$ vertices with all weights equal have?

~~~reveal Answer
$n$: a spanning tree of a cycle is obtained by deleting exactly one of its $n$ edges, and all such trees have the same weight.
~~~

8. Kruskal and Jarník always produce the same tree. True?

~~~reveal Answer
True when the weights are distinct (the MST is unique). With ties they may return different trees, but both trees are MSTs and have the same multiset of edge weights.
~~~

## Midterm 2 exam patterns

MST questions on Midterm 2 come in three shapes. (1) A block of **true/false with justification**, often the opening problem, mixing MST facts with shortest-path facts. (2) **"Modify the graph, then call a standard MST algorithm"** modeling questions. (3) **Exchange-argument proofs**: "prove your greedy rule is correct", "prove the updated tree is an MST". All three are answered with the same two tools: the **cut property** (lightest across a cut is in) and the **cycle property** (heaviest on a cycle is out).

### True/false toolbox

| Claim | Verdict | Proof idea or counterexample |
|---|---|---|
| Adding $c$ to every weight preserves the MST | True | every spanning tree has exactly $V-1$ edges |
| Adding $c$ to every length preserves shortest paths | False | path $1 + 1 < 3$, but $6 + 6 > 8$ after adding 5 |
| Squaring weights preserves the MST | only if weights $\ge 0$ | $-3, 1, 2$ become $9, 1, 4$ |
| Distinct weights ⇒ unique MST | True | lightest edge of $T \oplus T'$ |
| Unique MST ⇒ distinct weights | False | $G$ is itself a tree |
| Lightest edge across a cut is in the MST | True | cut property |
| Heaviest edge across a cut is not in the MST | False | a cut crossed only by a bridge |
| Heaviest edge on a cycle is not in the MST | True (distinct) | cycle property |
| Lightest edge on a cycle is in the MST | False | it can be heaviest on another cycle |
| Heaviest edge of $G$ is not in the MST | False | bridges, even if all degrees are $\ge 2$ |
| Lightest edge at each vertex is in the MST | True | cut $(\{v\}, V \setminus \{v\})$ |
| MST edge $uv$ is a shortest $u$-$v$ path (weights $> 0$) | True | a shorter path would make $uv$ the heaviest on a cycle |
| MST path between $u, v$ is a shortest path | False | triangle $2, 2, 3$ |
| The MST is a shortest-path tree from some root | False | path $1, 1.1, 1.2$ plus chords $1.5, 1.6, 1.7$ |
| Prim extracts keys in nondecreasing order | False | path $s$-$a$ (5), $a$-$b$ (1) |
| All MSTs have the same multiset of weights | True | threshold-counting argument |

### Templates that earn full credit

- **"$e$ is in every MST":** name a cut $(S, V \setminus S)$ on which $e$ is the *unique* lightest crossing edge.
- **"$e$ is in no MST":** name a cycle on which $e$ is the *unique* heaviest edge.
- **"$T$ is still an MST after the change":** for each tree edge $g$, look at the fundamental cut of $T - g$; or for each non-tree edge $f$, look at the fundamental cycle of $T + f$. A spanning tree is an MST iff every non-tree edge is a heaviest edge on its fundamental cycle.
- **Modeling:** "either pay at a vertex or connect to something that paid" ⇒ add a super-vertex $z$ with edges $zv$ of weight $c(v)$. Pre-built links ⇒ weight 0 (or contract). Forbidden links ⇒ delete. Maximize the weakest link ⇒ maximum spanning tree. Secondary objective among MSTs ⇒ break ties in Kruskal in its favor.
- **Exchange argument:** say which edge enters, which leaves (on the created cycle or across the same cut), why the result is still a spanning tree, and why the weight did not go up.

### Mistakes that cost the most points

- **Naming the property but not the cut or cycle.** "True by the cut property" earns little unless you say *which* cut and why $e$ is lightest on it.
- **Counterexamples with ties** when the statement assumed distinct weights, or with no numbers at all.
- **Exchanging the wrong edge.** Removing an arbitrary tree edge after adding $e$ need not leave a spanning tree; it must be on the cycle $e$ creates.
- **Mixing up the two worlds.** Order-only reasoning works for MSTs; shortest paths depend on sums. "Prim is Dijkstra" is wrong: Prim's key is the weight of a single edge, Dijkstra's is a path length.
- **Forgetting the size of the modified graph.** A super-vertex adds one vertex and $V$ edges; still say $O((V + E)\log V)$.

### Worked example A (try it first): two quick claims

*Problem.* Prove or disprove. (1) Weights are distinct. If $e$ is the heaviest edge crossing some cut, then $e$ is not in the MST. (2) Weights may be tied. If $e$ belongs to *some* MST and we decrease $w(e)$, then $e$ belongs to *every* MST of the new graph.

~~~~reveal Solution
**(1) False.** In the 4-cycle below, Kruskal adds $ab$ (1), $bc$ (2), $cd$ (3) and rejects $da$ (4), so the MST is $\{ab, bc, cd\}$. The cut $(\{b\}, \{a, c, d\})$ is crossed by $ab$ and $bc$ only, and $bc$, the heavier of the two, is in the MST. (Even simpler: a cut crossed by a single bridge.) Being heaviest across a cut says nothing; the useful facts are "lightest across a cut" and "heaviest on a cycle".

~~~graph
undirected
a b 1
b c 2
c d 3
d a 4
~~~

**(2) True.** Let $M$ be an MST containing $e$, and decrease $w(e)$ by $\Delta > 0$. In the new weights, $M$ weighs $w(M) - \Delta$. Any spanning tree $T'$ **not** containing $e$ keeps its old weight, $w(T') \ge w(M) > w(M) - \Delta$. So every tree without $e$ is strictly heavier than $M$ in the new graph, and therefore every new MST contains $e$. (In particular $M$ itself is still an MST: trees containing $e$ all dropped by the same $\Delta$.)
~~~~

### Worked example B (try it first): one free cable

*Problem.* A connected graph $G$ with positive weights and an MST $T$ is given. The government will pay for **one** existing edge $e \in E$ of your choice, so that $w(e)$ becomes 0. Which edge should you choose to minimize the weight of the new MST, and what is that weight? Prove it.

~~~reveal Solution
**Answer.** Choose the heaviest edge $g$ of $T$. The new MST weighs $w(T) - w(g)$.

*Achievable.* After making $g$ free, $T$ is still a spanning tree and now weighs $w(T) - w(g)$, so the new MST weighs at most that.

*Optimal.* Fix any choice $e$ and any spanning tree $T'$; we show its new weight is at least $w(T) - w(g)$. If $e \notin T'$, its weight is unchanged: $w(T') \ge w(T) \ge w(T) - w(g)$. If $e \in T'$, its new weight is $w(T') - w(e)$. Removing $e$ splits $T'$ into two parts; the connected tree $T$ has some edge $f$ crossing between them, and $T' - e + f$ is a spanning tree, so $w(T') - w(e) + w(f) \ge w(T)$. Hence $w(T') - w(e) \ge w(T) - w(f) \ge w(T) - w(g)$, since $f \in T$ and $g$ is the heaviest edge of $T$. ∎

No distinctness was needed. Note the pattern: an upper bound by exhibiting a tree, a lower bound by an exchange with $T$ across the cut defined by $T' - e$.
~~~

~~~steps Checking the answer on the running example
**The MST.** Kruskal on the running example takes $ac$ (1), $bd$ (2), $bc$ (3), rejects $ab$ (4), takes $de$ (5), rejects $ce$ (6) and $cd$ (7), takes $ef$ (8), rejects $df$ (9). $T = \{ac, bd, bc, de, ef\}$, $w(T) = 19$.
+++
**Predicted answer.** The heaviest tree edge is $ef$ (8), so the best new MST should weigh $19 - 8 = 11$.
+++
**Try a non-tree edge instead: make $df$ free.** Adding $df$ (now 0) to $T$ closes the cycle $d, e, f$; its heaviest edge is $ef$ (8), which leaves. New weight $19 - 8 = 11$: no better than the prediction, as the proof says.
+++
**Try $ab$ free.** The cycle closed in $T$ is $a, c, b$ with tree edges $ac$ (1), $bc$ (3); the heaviest, $bc$, leaves: $19 - 3 = 16$. Worse. In general a free non-tree edge $uv$ saves the heaviest weight on the $T$-path from $u$ to $v$, which is at most $w(g)$.
~~~
`,

  cheatsheet: String.raw`
**Setup.** Connected undirected weighted graph; spanning tree has $V-1$ edges. Distinct weights ⇒ unique MST (break ties by index). Only the order of weights matters.

**Intermediate forest $F$.** Useless edge: both ends in one component of $F$. Safe edge: lightest edge leaving some component.

**Cut property.** Lightest edge across any cut is in the MST (so every safe edge is).
**Cycle property.** Heaviest edge on any cycle is not in the MST (so no useless edge is).

| Algorithm | Idea | Time |
|---|---|---|
| Borůvka | add all safe edges; components halve each round | $O(E\log V)$ |
| Jarník/Prim | grow one tree; PQ keyed by edge weight | $O(E\log V)$; $O(E+V\log V)$ Fib heap |
| Kruskal | sorted edges, skip useless (union–find) | $O(E\log V)$; $O(E\alpha(V))$ if presorted |

**Union–find.** Union by rank + path compression: $O(\alpha(n))$ amortized per op.

**Facts.**
- MST path between $u,v$ = minimax (bottleneck) path; MST minimizes the max edge.
- $e=uv \in$ MST $\iff$ no $u$–$v$ path using only lighter edges. $O(V+E)$ test.
- Non-tree $e$ lighter: add $e$, drop max edge on its cycle ($O(V)$). Tree $e$ heavier: drop $e$, add min edge across cut ($O(E)$).
- Max spanning tree: negate weights. Product of weights: same MST.
- MST $\ne$ shortest-path tree.
- Second-best MST differs from the MST by one swap.

**Exchange template.** Optimal $T \not\ni e$; $T+e$ has a cycle through $e$; remove a heavier edge $e'$ of that cycle crossing the same cut; get a lighter (or equal) tree.

**Ties.** A lightest edge across a cut is in *some* MST; the *unique* lightest is in *every* MST. The *unique* heaviest edge on a cycle is in *no* MST. All MSTs share the same sorted weight list.

**Membership with ties.** $e = uv \in$ some MST $\iff$ $u \not\leadsto v$ using edges $< w(e)$. $e \in$ every MST $\iff$ $u \not\leadsto v$ using edges $\le w(e)$ other than $e$.

**Proving T/F claims.** In: find a cut where $e$ is lightest. Out: find a cycle where $e$ is heaviest. Counterexamples: triangle, triangle + pendant (bridge), negative weights, ties.

**Updates (distinct weights).**
| Change | Fix | Time |
|---|---|---|
| new edge / non-tree edge lighter | add, drop heaviest on its cycle | $O(V)$ |
| tree edge heavier / deleted | drop, add lightest across cut | $O(V+E)$ |
| new vertex $z$ with $d$ edges | MST of $T \cup E_z$ | $O(V \log V)$ |
| tree edge lighter / non-tree heavier | nothing | $O(1)$ |

**Constraints.** Forced edges $F$: union them first (must be acyclic), then Kruskal. Forbidden: delete. $v$ must be a leaf: MST$(G - v)$ + lightest edge at $v$.

**Special weights.** Integers in $1..W$: counting sort, $O(E\,\alpha(V) + W)$. $k$ distinct values: $O(E \log k + E\,\alpha(V))$. Dense graphs: Jarník with an array, $O(V^2)$.

**Union–find.** Rank-$r$ root has $\ge 2^r$ nodes, so height $\le \log_2 n$. Kruskal on a connected graph: $V-1$ Unions, $\le 2E$ Finds.

**Applications.** Max-spacing $k$-clustering: stop Kruskal at $k$ components (delete $k-1$ heaviest MST edges). Max product of reliabilities: maximum spanning tree (use $\log$). Min-weight edge set breaking all cycles: complement of a maximum spanning forest. Reverse-delete (drop heaviest non-bridge edges) also yields the MST. Minimum bottleneck spanning tree in $O(E)$ by median splitting.

### Exam checklist
- "In the MST" ⇒ name the cut where it is lightest. "Not in" ⇒ name the cycle where it is heaviest.
- Distinct or tied? With ties say "some MST" / "every MST" and use *unique* lightest / heaviest.
- Counterexample sources: bridges, negative weights, ties, a triangle, a 4-cycle with chords.
- Only the order of weights matters: $+c$, $\times c > 0$, $w^3$ keep the MST; $+c$ still changes shortest paths.
- MST edge $uv$ is a shortest $u$-$v$ path (positive weights); the MST path between two vertices is only a minimax path.
- Prim's keys are single edge weights, not distances, and need not be extracted in increasing order.
- Exchange: which edge enters, which leaves, why still a spanning tree, why not heavier.
- Modeling: super-vertex for per-vertex costs, contract required edges, delete forbidden ones, tie-break for secondary goals; state the new sizes and the time.
`,

  quiz: [
    {
      type: 'tf',
      q: 'If all edge weights of a connected graph are distinct, the minimum spanning tree is unique.',
      answer: true,
      explain: String.raw`If $T \ne T'$ were both MSTs, take the lightest edge $e$ in their symmetric difference, say $e \in T$. Adding $e$ to $T'$ creates a cycle containing an edge $f \in T' \setminus T$, heavier than $e$. Then $T' + e - f$ is lighter than $T'$, a contradiction.`
    },
    {
      type: 'tf',
      q: 'If a connected graph has a unique minimum spanning tree, then its edge weights must be distinct.',
      answer: false,
      explain: String.raw`Distinctness is sufficient, not necessary. If the graph is itself a tree, its only spanning tree is the MST, whatever the weights. Another example: a triangle with weights 1, 1, 2 has the unique MST consisting of the two weight-1 edges.`
    },
    {
      type: 'mc',
      q: String.raw`With respect to an intermediate spanning forest $F$, a **safe** edge is...`,
      choices: [
        String.raw`any edge with both endpoints in the same component of $F$`,
        String.raw`the minimum-weight edge with exactly one endpoint in some component of $F$`,
        'the globally lightest edge of the graph',
        String.raw`any edge not in $F$ that does not create a cycle`
      ],
      answer: 1,
      explain: String.raw`Safe = the lightest edge leaving some component. Edges inside a component are *useless*. Non-cycle-creating edges that are not the lightest out of their component are *undecided*: they might or might not be in the MST.`
    },
    {
      type: 'tf',
      q: 'Adding the same constant c to every edge weight never changes the minimum spanning tree.',
      answer: true,
      explain: String.raw`Every spanning tree has exactly $V-1$ edges, so every tree's weight increases by the same $(V-1)c$. More generally, MST algorithms only compare weights, so any strictly increasing transformation preserves the MST. (Contrast with shortest paths, where adding a constant changes the answer.)`
    },
    {
      type: 'tf',
      q: 'The shortest-path tree from a vertex s (computed by Dijkstra) is always a minimum spanning tree.',
      answer: false,
      explain: String.raw`Triangle $s, a, b$ with $w(sa) = w(sb) = 2$, $w(ab) = 1$: the shortest-path tree from $s$ is $\{sa, sb\}$ with weight 4, but $\{sa, ab\}$ has weight 3. The two trees optimize different objectives.`
    },
    {
      type: 'mc',
      q: "What bounds the number of rounds in Borůvka's algorithm?",
      choices: [String.raw`$O(1)$`, String.raw`$O(\log V)$`, String.raw`$O(\sqrt V)$`, String.raw`$O(V)$`],
      answer: 1,
      explain: String.raw`In each round every component adds its safe edge and merges with at least one other component, so the number of components at least halves. Starting from $V$ components, after $O(\log V)$ rounds one remains. Each round is $O(V+E)$, so the total is $O(E\log V)$.`
    },
    {
      type: 'multi',
      q: 'Assume distinct edge weights and a connected graph. Which statements are always true? (select all that apply)',
      choices: [
        'The lightest edge of the whole graph is in the MST',
        'The heaviest edge of the whole graph is not in the MST',
        'The heaviest edge on any cycle is not in the MST',
        'For every vertex v, the lightest edge incident to v is in the MST'
      ],
      answer: [0, 2, 3],
      explain: String.raw`The lightest edge at $v$ is the lightest edge across the cut $(\{v\}, V - \{v\})$, so it is in the MST by the cut property; the globally lightest edge is a special case. The cycle property excludes the heaviest edge on any cycle. But the heaviest edge of the graph may be a **bridge** (on no cycle), in which case every spanning tree must contain it.`
    },
    {
      type: 'mc',
      q: 'What is the running time of Kruskal\'s algorithm with union by rank and path compression, if the edges must first be sorted by comparisons?',
      choices: [String.raw`$O(E\,\alpha(V))$`, String.raw`$O(E \log V)$`, String.raw`$O(V^2)$`, String.raw`$O(VE)$`],
      answer: 1,
      explain: String.raw`Sorting takes $O(E \log E) = O(E \log V)$ because $E < V^2$ implies $\log E < 2 \log V$. The union–find operations cost only $O(E\,\alpha(V))$, so sorting dominates. If the edges are presorted, Kruskal is $O(E\,\alpha(V))$.`
    },
    {
      type: 'tf',
      q: 'Every minimum spanning tree minimizes the weight of its heaviest edge among all spanning trees (it is a minimum bottleneck spanning tree).',
      answer: true,
      explain: String.raw`If some spanning tree $T'$ had all edges lighter than the heaviest MST edge $e$, remove $e$ from the MST: the cut between the two halves is crossed by some edge of $T'$, which is lighter than $e$; swapping gives a lighter spanning tree. The converse fails: a minimum bottleneck spanning tree need not be an MST.`
    },
    {
      type: 'mc',
      q: String.raw`You have the MST $T$ and the weight of a non-tree edge $e = uv$ decreases. What is the correct update?`,
      choices: [
        String.raw`Nothing changes; non-tree edges never enter the MST`,
        String.raw`Add $e$ to $T$ and remove the heaviest edge on the cycle formed (possibly $e$ itself)`,
        'Rerun Kruskal from scratch; there is no faster correct method',
        String.raw`Add $e$ and remove the lightest edge on the cycle formed`
      ],
      answer: 1,
      explain: String.raw`$T + e$ contains exactly one cycle (the tree path from $u$ to $v$ plus $e$). By the cycle property the heaviest edge on it is not in the new MST; removing it yields the new MST. Finding the path and its maximum takes $O(V)$ time. If $e$ is still the heaviest on the cycle, $T$ is unchanged.`
    },
    {
      type: 'mc',
      q: 'In Jarník/Prim, what is the priority (key) of a vertex v not yet in the tree?',
      choices: [
        'Its distance from the start vertex',
        'The weight of the lightest edge from v to any vertex currently in the tree',
        'Its degree',
        'The weight of the heaviest edge on the tree path to v'
      ],
      answer: 1,
      explain: String.raw`$key(v) = \min\{w(uv) : u \in T\}$. Extracting the minimum key vertex adds the tree's safe edge. Using $dist(u) + w(uv)$ instead would be Dijkstra, which builds a shortest-path tree, not an MST.`
    },
    {
      type: 'tf',
      q: 'Kruskal\'s and Jarník\'s algorithms remain correct when some edge weights are negative.',
      answer: true,
      explain: String.raw`Both algorithms only compare weights, and the cut/cycle properties never use the sign of weights. (Negative weights are a problem for shortest paths, not for MSTs.)`
    },
    {
      type: 'tf',
      q: 'For any two vertices u and v, the path between them in the MST is a shortest (minimum total weight) u–v path in G.',
      answer: false,
      explain: String.raw`MST paths are **minimax** paths (they minimize the maximum edge weight), not shortest paths. In a triangle with weights $w(uv) = 3$, $w(ux) = 2$, $w(xv) = 2$, the MST is $\{ux, xv\}$, so the MST path from $u$ to $v$ has total weight 4 while the edge $uv$ has weight 3.`
    },
    {
      type: 'tf',
      q: 'Assume distinct weights. If e is the lightest edge on some cycle of G, then e belongs to the MST.',
      answer: false,
      explain: String.raw`Lightest on one cycle proves nothing; another cycle may make $e$ the heaviest. Example: triangle $a, b, c$ with $w(ab) = 5$, $w(bc) = 6$, $w(ca) = 7$, plus $ad$ (1) and $db$ (2). $ab$ is lightest on $a, b, c$ but heaviest on $a, d, b$, so it is not in the MST. The correct tools: lightest across a **cut** means in; heaviest on a **cycle** means out.`
    },
    {
      type: 'tf',
      q: 'Assume distinct weights. If an edge e belongs to the MST T, then e is the lightest edge crossing some cut of G.',
      answer: true,
      explain: String.raw`Delete $e$ from $T$; the two components $A$, $B$ define a cut that $e$ crosses. If some edge $f$ crossing $(A, B)$ were lighter than $e$, then $T - e + f$ would be a lighter spanning tree. So $e$ is the lightest edge across $(A, B)$. Together with the cut property, this says: $e$ is in the MST iff it is the lightest edge across some cut.`
    },
    {
      type: 'mc',
      q: String.raw`$T$ is an MST of $G$ under real weights $w$ (some may be negative). Under which new weights is $T$ **guaranteed** to still be an MST, for every graph?`,
      choices: [String.raw`$w(e)^2$`, String.raw`$|w(e)|$`, String.raw`$w(e)^3$`, String.raw`$1 / w(e)$ (assuming no zero weights)`],
      answer: 2,
      explain: String.raw`MSTs depend only on the order of the weights, so any strictly increasing transformation preserves them. $t \mapsto t^3$ is strictly increasing on all reals. Squaring and absolute value reverse the order of negative numbers (e.g., $-3 < 1$ but $9 > 1$), and $1/t$ reverses the order of positive numbers.`
    },
    {
      type: 'mc',
      q: 'How do you compute a k-clustering of n points that maximizes the spacing (the minimum distance between points in different clusters)?',
      choices: [
        'Run Dijkstra from k random points and assign each point to its nearest source',
        'Run Kruskal on the complete distance graph and stop when k components remain',
        'Compute an MST and delete its k − 1 lightest edges',
        'Compute a shortest-path tree and delete its k − 1 heaviest edges'
      ],
      answer: 1,
      explain: String.raw`Stopping Kruskal at $k$ components is the same as deleting the $k-1$ **heaviest** MST edges. The spacing equals the next edge Kruskal would add, and an exchange argument shows no other $k$-clustering does better: any other clustering splits some Kruskal cluster, and the Kruskal path inside that cluster uses only edges no heavier than that next edge.`
    },
    {
      type: 'mc',
      q: 'Jarník/Prim is implemented with a plain array of keys (ExtractMin by linear scan, DecreaseKey in O(1)). What is its running time?',
      choices: [String.raw`$O(E \log V)$`, String.raw`$O(V^2)$`, String.raw`$O(E + V)$`, String.raw`$O(V^2 \log V)$`],
      answer: 1,
      explain: String.raw`$V$ extractions at $O(V)$ each plus $O(1)$ per edge for decreases: $O(V^2 + E) = O(V^2)$. For dense graphs ($E = \Theta(V^2)$) this beats a binary heap ($O(V^2 \log V)$) and matches a Fibonacci heap.`
    },
    {
      type: 'multi',
      q: 'Weights may be TIED. Which statements are always true? (select all that apply)',
      choices: [
        'A lightest edge crossing a cut belongs to some MST',
        'A lightest edge crossing a cut belongs to every MST',
        'An edge that is the unique lightest edge crossing some cut belongs to every MST',
        'An edge tied for heaviest on some cycle belongs to no MST',
        'All MSTs have the same multiset of edge weights'
      ],
      answer: [0, 2, 4],
      explain: String.raw`The exchange argument with $\le$ shows a tied-lightest crossing edge can be swapped into any MST without increasing the weight (so it is in *some* MST); with strict inequality the swap would make an MST lighter, so a *unique* lightest crossing edge is in *every* MST. A triangle with equal weights shows tied-heaviest edges can be in an MST, and tied-lightest edges need not be in every MST. The weight multiset is invariant because, for every threshold $x$, every MST has exactly $V - c(x)$ edges of weight $\le x$, where $c(x)$ is the number of components of the subgraph of edges of weight $\le x$.`
    },
    {
      type: 'tf',
      q: 'Distinct weights: a tree edge e is deleted from G (and G − e remains connected). Removing e from the MST T and adding the lightest edge that reconnects the two halves gives the MST of G − e.',
      answer: true,
      explain: String.raw`Each remaining tree edge $f$ is the lightest edge across the cut defined by $T - f$; deleting $e$ (which does not cross that cut) leaves this true, so all of $T - e$ stays. The last edge must cross the cut $(A, B)$ created by removing $e$, and by the cut property it is the lightest such edge. $O(V + E)$.`
    },
    {
      type: 'tf',
      q: 'In a simple connected graph with distinct weights, the two lightest edges always belong to the MST.',
      answer: true,
      explain: String.raw`Kruskal examines them first. The first edge is always added. The second is useless only if its endpoints are already connected, i.e., only if it is parallel to the first edge, which a simple graph does not allow. (The **third** lightest edge can be rejected: it may close a triangle with the first two.)`
    },
    {
      type: 'tf',
      q: 'In a simple connected graph with distinct weights, the three lightest edges always belong to the MST.',
      answer: false,
      explain: String.raw`If the three lightest edges form a triangle, Kruskal adds the first two and rejects the third as useless (it is the heaviest edge on that triangle).`
    },
    {
      type: 'mc',
      q: 'Kruskal runs on a connected graph with V vertices and E edges. How many Union operations does it perform?',
      choices: ['E', 'V − 1', 'E − V + 1', String.raw`$\log V$`],
      answer: 1,
      explain: String.raw`Each Union corresponds to an added tree edge, and a spanning tree has exactly $V - 1$ edges. The other $E - V + 1$ edges are rejected as useless after two Finds each.`
    },
    {
      type: 'tf',
      q: 'With union by rank but WITHOUT path compression, every Find takes O(log n) time in the worst case.',
      answer: true,
      explain: String.raw`A root of rank $r$ has at least $2^r$ nodes (ranks grow only when two equal-rank roots merge), so ranks and hence heights are at most $\log_2 n$. Path compression is what improves the amortized bound to $O(\alpha(n))$.`
    },
    {
      type: 'tf',
      q: 'Every minimum bottleneck spanning tree is a minimum spanning tree.',
      answer: false,
      explain: String.raw`Every MST is a minimum bottleneck spanning tree, but not conversely. If a heavy bridge must be in every spanning tree, all spanning trees have the same bottleneck, including ones with large total weight.`
    },
    {
      type: 'mc',
      q: String.raw`Distinct weights. You know the MST $T$ of $G$. A new vertex $z$ arrives with $d$ edges to existing vertices. Which is a correct and efficient way to get the new MST?`,
      choices: [
        String.raw`Add the lightest edge at $z$ to $T$; nothing else can change`,
        String.raw`Compute the MST of the graph with edges $T \cup E_z$ only, in $O((V + d)\log V)$`,
        'Recompute the MST of the whole new graph; no shortcut is correct',
        String.raw`Add all $d$ new edges, then delete the $d - 1$ heaviest edges of $T$`
      ],
      answer: 1,
      explain: String.raw`Each old non-tree edge is the heaviest edge on its cycle with $T$, and that cycle survives, so it stays out. Hence the new MST lies inside $T \cup E_z$, a graph with fewer than $V + d$ edges. Adding only the lightest $z$-edge is wrong: another $z$-edge may replace a heavy tree edge.`
    },
    {
      type: 'tf',
      q: 'If all edge weights are integers between 1 and V, Kruskal can be implemented in O(E α(V)) time.',
      answer: true,
      explain: String.raw`Counting sort sorts the edges in $O(E + V)$ time, and the union–find phase is $O(E\,\alpha(V))$. Since the graph is connected, $V = O(E)$, so the total is $O(E\,\alpha(V))$.`
    },
    {
      type: 'tf',
      q: 'Distinct weights: if e is the heaviest edge crossing some cut, then e is not in the MST.',
      answer: false,
      explain: String.raw`"Heaviest across a cut" is not one of the two useful properties. In the 4-cycle $ab$ (1), $bc$ (2), $cd$ (3), $da$ (4), the MST is $\{ab, bc, cd\}$; the cut $(\{b\}, \{a,c,d\})$ is crossed only by $ab$ and $bc$, and the heavier one, $bc$, is in the MST. Even simpler, a bridge is the heaviest (and only) edge across its cut and lies in every spanning tree. The correct pairs: lightest + cut ⇒ in; heaviest + cycle ⇒ out.`
    },
    {
      type: 'tf',
      q: 'Distinct weights: if an edge e is not the heaviest edge on any cycle of G, then e is in the MST.',
      answer: true,
      explain: String.raw`Contrapositive: suppose $e = uv \notin T$. Then $T + e$ contains a cycle $C$ made of $e$ and the tree path from $u$ to $v$. If some tree edge $f$ on that path were heavier than $e$, then $T - f + e$ would be a lighter spanning tree. So every other edge of $C$ is lighter and $e$ is the heaviest edge on $C$. Together with the cycle property: $e \in T$ iff $e$ is the heaviest edge on no cycle.`
    },
    {
      type: 'tf',
      q: "Like Dijkstra's algorithm, Jarník's (Prim's) algorithm extracts vertices in nondecreasing order of key.",
      answer: false,
      explain: String.raw`Prim's key is the weight of a single edge to the current tree, not a path length, so it can go down. On the path $s - a - b$ with $w(sa) = 5$ and $w(ab) = 1$, Prim extracts $s$ (key 0), $a$ (key 5), then $b$ (key 1). Dijkstra's keys are nondecreasing because path lengths only grow when extended by nonnegative edges; nothing similar holds for Prim.`
    },
    {
      type: 'tf',
      q: 'If a connected graph has a unique MST, then every cut has a unique lightest crossing edge.',
      answer: false,
      explain: String.raw`Take the path $a - b - c$ with both weights equal to 1. It is a tree, so its MST is unique, yet the cut $(\{b\}, \{a, c\})$ is crossed by two edges of weight 1. Uniqueness of the MST does not require ties to be absent everywhere; it only requires that no tie lets you swap one tree for another of equal weight.`
    },
    {
      type: 'tf',
      q: 'Distinct positive weights: the MST of G is a shortest-path tree rooted at some vertex.',
      answer: false,
      explain: String.raw`Path $a - b - c - d$ with weights 1, 1.1, 1.2, plus chords $ac$ (1.5), $bd$ (1.6), $ad$ (1.7). Each chord is the heaviest edge on a cycle with path edges, so the MST is the path (weight 3.3). From $a$ or $d$, the far end is 1.7 away directly but 3.3 along the tree; from $b$, $d$ is 1.6 directly versus 2.3 in the tree; from $c$, $a$ is 1.5 versus 2.1. So no root makes the MST a shortest-path tree.`
    },
    {
      type: 'mc',
      q: String.raw`A graph has $V$ vertices, $E$ edges and $c$ connected components. How many edges does a minimum spanning forest have?`,
      choices: [String.raw`$V - 1$`, String.raw`$V - c$`, String.raw`$E - V + c$`, String.raw`$c(V - 1)$`],
      answer: 1,
      explain: String.raw`A spanning tree of a component with $n_i$ vertices has $n_i - 1$ edges, and $\sum_i (n_i - 1) = V - c$. Kruskal on a disconnected graph performs exactly $V - c$ Unions. The number $E - V + c$ is the number of edges **not** in the forest (the cycle rank).`
    },
    {
      type: 'multi',
      q: 'Which running times are correct for a connected graph? (select all that apply)',
      choices: [
        String.raw`Kruskal with comparison sorting: $O(E \log V)$`,
        String.raw`Jarník/Prim with a binary heap: $O(E \log V)$`,
        String.raw`Borůvka: $O(E)$, because the number of components halves every round`,
        String.raw`Kruskal on presorted edges, union by rank + path compression: $O(E\,\alpha(V))$`,
        String.raw`Jarník/Prim with a Fibonacci heap: $O(E + V \log V)$`
      ],
      answer: [0, 1, 3, 4],
      explain: String.raw`Borůvka is $O(E \log V)$: halving bounds the number of **rounds** by $O(\log V)$, but each round still scans all the edges, $O(V + E)$; the number of components halves, the number of edges need not. The other four are the standard bounds; sorting dominates Kruskal unless edges come presorted.`
    },
    {
      type: 'mc',
      q: 'All weights are distinct and positive. Replacing every weight w by which function can change the MST for some graph?',
      choices: [String.raw`$3w + 2$`, String.raw`$w^3$`, String.raw`$e^{-w}$`, String.raw`$\log(w + 1)$`],
      answer: 2,
      explain: String.raw`The MST depends only on the order of the weights, so every strictly increasing function preserves it: $3w + 2$, $w^3$ and $\log(w+1)$ all are. $e^{-w}$ is strictly **decreasing**, so it reverses the order and turns the computation into a maximum spanning tree of $w$: in a triangle with weights 1, 2, 3 the MST $\{1, 2\}$ becomes $\{2, 3\}$.`
    },
    {
      type: 'tf',
      q: 'Weights may be tied. If T is an MST and the weight of one edge of T decreases, then T is still an MST.',
      answer: true,
      explain: String.raw`Say $w(e)$ drops by $\Delta > 0$ with $e \in T$. Then $T$ gets lighter by exactly $\Delta$, and any other spanning tree gets lighter by $\Delta$ (if it contains $e$) or not at all. So for every spanning tree $T'$, new $w(T') \ge w(T') - \Delta \ge w(T) - \Delta$ = new $w(T)$. Symmetrically, increasing the weight of a non-tree edge never changes the MST.`
    },
    {
      type: 'mc',
      q: String.raw`Distinct weights. Kruskal examines $e = uv$ and rejects it because $u$ and $v$ are already in the same component. Which fact certifies that $e$ is not in the MST?`,
      choices: [
        String.raw`The cut property applied to the cut $(\{u\}, V \setminus \{u\})$`,
        String.raw`The cycle property: $e$ plus the forest path from $u$ to $v$ is a cycle whose other edges were all examined earlier, so $e$ is its heaviest edge`,
        String.raw`$e$ is the heaviest edge of the whole graph`,
        'Union by rank guarantees that rejected edges are heavy'
      ],
      answer: 1,
      explain: String.raw`Every edge already in Kruskal's forest was examined before $e$, so it is lighter than $e$. The forest path between $u$ and $v$ plus $e$ is a cycle on which $e$ is the heaviest edge, and the cycle property excludes $e$. Accepted edges are certified the other way: an accepted edge is the lightest edge leaving its endpoint's current component, a cut.`
    }
  ],

  flashcards: [
    { front: 'Cut property', back: 'For any cut (S, V−S), the lightest edge crossing it belongs to the MST (distinct weights). Hence every safe edge is in the MST.' },
    { front: 'Cycle property', back: 'The heaviest edge on any cycle is not in the MST (distinct weights). Hence useless edges are never in the MST.' },
    { front: 'Safe vs useless edge (w.r.t. forest F)', back: 'Useless: both endpoints in the same component of F. Safe: the lightest edge with exactly one endpoint in some component of F.' },
    { front: 'Why distinct weights ⇒ unique MST', back: String.raw`Two MSTs $T\ne T'$: take the lightest edge $e$ of $T \oplus T'$ (say in $T$); $T' + e$ has a cycle with an edge $f \in T'\setminus T$, $w(f) > w(e)$; $T'+e-f$ is lighter. Contradiction.` },
    { front: "Borůvka's algorithm", back: String.raw`Each round: label components, add every component's lightest outgoing edge. Components halve ⇒ $O(\log V)$ rounds of $O(E)$: $O(E\log V)$.` },
    { front: "Jarník/Prim's algorithm", back: String.raw`Grow one tree; PQ of vertices keyed by lightest edge to the tree. $O(E \log V)$ binary heap, $O(E + V \log V)$ Fibonacci heap.` },
    { front: "Kruskal's algorithm", back: String.raw`Sort edges ascending; add an edge iff its endpoints are in different union–find sets. $O(E\log V)$ (sorting dominates).` },
    { front: 'Union–find complexity', back: String.raw`Union by rank + path compression: $m$ operations on $n$ elements in $O(m\,\alpha(n))$. Union by rank alone: $O(\log n)$ per Find.` },
    { front: 'Test whether edge e=uv is in the MST', back: String.raw`Search from $u$ using only edges lighter than $w(e)$; $e \in$ MST iff $v$ is NOT reached. $O(V+E)$.` },
    { front: 'MST and bottleneck/minimax paths', back: 'The MST path between u and v minimizes the maximum edge weight over all u–v paths; every MST is a minimum bottleneck spanning tree.' },
    { front: 'Update MST when a non-tree edge gets lighter', back: String.raw`Add it; remove the heaviest edge on the unique cycle created. $O(V)$.` },
    { front: 'Update MST when a tree edge gets heavier', back: String.raw`Remove it (splitting the tree in two); add the lightest edge crossing that cut (possibly the same edge). $O(V+E)$.` },
    { front: 'Second-best MST structure', back: String.raw`With distinct weights, some second-best spanning tree equals $T - g + f$ for a non-tree edge $f$ and the heaviest edge $g$ on $f$'s tree cycle. $O(V^2)$ algorithm.` },
    { front: 'Cut and cycle properties WITH ties', back: 'A lightest edge across a cut is in SOME MST; the unique lightest is in EVERY MST. The unique heaviest edge on a cycle is in NO MST; a tied-heaviest edge may be in some MST.' },
    { front: 'Edge in some MST / every MST (ties allowed)', back: String.raw`$e = uv$ is in some MST iff $u$ cannot reach $v$ via edges strictly lighter than $w(e)$. In every MST iff $u$ cannot reach $v$ via edges of weight $\le w(e)$ other than $e$. One WFS each, $O(V+E)$.` },
    { front: 'Max-spacing k-clustering', back: 'Run Kruskal on the complete distance graph and stop at k components (= delete the k − 1 heaviest MST edges). Spacing = weight of the next edge Kruskal would add.' },
    { front: 'Reverse-delete algorithm', back: 'Scan edges in DECREASING order; delete an edge if the graph stays connected. Each deleted edge is the heaviest on a cycle, so the result is the MST. O(E(V+E)) naively.' },
    { front: 'MST with forced and forbidden edges', back: 'Delete forbidden edges; check forced edges are acyclic and Union them first; then run Kruskal on the rest. Equivalent to an MST of the contracted graph. O(E log V).' },
    { front: 'MST after adding a new vertex z with d edges', back: String.raw`New MST $\subseteq T \cup E_z$ (old non-tree edges stay heaviest on their cycles). Run Kruskal on those $< V + d$ edges: $O((V+d) \log V)$.` },
    { front: 'Union by rank: why height ≤ log n', back: String.raw`A root of rank $r$ has $\ge 2^r$ nodes: rank increases only when two rank-$r$ roots merge, giving $\ge 2^{r+1}$ nodes. Height = rank without compression.` },
    { front: 'Jarník/Prim on dense graphs', back: String.raw`Array of keys: ExtractMin by scan $O(V)$, DecreaseKey $O(1)$: total $O(V^2)$, optimal when $E = \Theta(V^2)$.` },
    { front: 'All MSTs share...', back: String.raw`The same sorted list of edge weights: for every $x$, each MST has exactly $V - c(x)$ edges of weight $\le x$, where $c(x)$ = number of components of $G_{\le x}$.` },
    { front: 'Minimum bottleneck spanning tree in linear time', back: String.raw`Split edges at the median weight. If the light half connects $G$, recurse on it; else contract its components and recurse on the heavy half. $T(E) = T(E/2) + O(E) = O(E)$.` },
    { front: 'Heaviest edge across a cut: excluded?', back: String.raw`No. A bridge is the heaviest (only) edge across its cut and is in every spanning tree; in the 4-cycle 1, 2, 3, 4 the cut around the vertex between edges 1 and 2 has the MST edge 2 as its heaviest. Useful pairs: lightest + cut ⇒ in, heaviest + cycle ⇒ out.` },
    { front: 'Three equivalent statements about an edge e (distinct weights)', back: String.raw`(i) $e \in$ MST. (ii) $e$ is the lightest edge across some cut (take the cut of $T - e$). (iii) $e$ is the heaviest edge on no cycle (if $e \notin T$, it is heaviest on its fundamental cycle in $T + e$).` },
    { front: "Prim's keys vs Dijkstra's keys", back: String.raw`Prim: $key(v) = \min_{u \in T} w(uv)$, a single edge; extracted keys can DECREASE (path $s$-$a$ 5, $a$-$b$ 1). Dijkstra: $dist(v) = \min dist(u) + \ell(uv)$, a path length; extracted keys are nondecreasing. Swapping the update turns Prim into Dijkstra (a shortest-path tree, not an MST).` },
    { front: 'Unique MST but tied cut minima?', back: String.raw`Possible: the path $a$-$b$-$c$ with weights 1, 1 has a unique MST (it is a tree), yet the cut $(\{b\}, \{a,c\})$ has two lightest edges. Unique MST does not force distinct weights or unique cut minima.` },
    { front: 'MST edges versus shortest paths', back: String.raw`Positive weights: every MST edge $uv$ is a shortest $u$-$v$ path (a shorter path would make $uv$ the unique heaviest edge on a cycle). But the MST path between non-adjacent vertices need not be shortest, and the MST need not be a shortest-path tree from any root.` },
    { front: 'Wells and pipes (cost per vertex OR connect)', back: String.raw`Add a super-vertex $z$ and an edge $zv$ of weight $c(v)$ (the cost of a well at $v$). Feasible plans = connected spanning subgraphs of $G + z$; optimal plan = MST of $G + z$. $O((V+E)\log V)$.` },
    { front: 'Among all MSTs, fewest red edges', back: String.raw`Kruskal with ties broken blue before red (sort by $(w, [\text{red}])$). Proof: it is Kruskal for $w + \varepsilon\,[\text{red}]$ with $\varepsilon$ tiny; that perturbation cannot beat a real weight difference, so the result is an MST, and it minimizes reds among MSTs.` },
    { front: 'Sensitivity of an MST edge (distinct weights)', back: String.raw`Non-tree $f = uv$: $T$ stays optimal while $w(f) > \max_T(u,v)$ (heaviest edge on the tree path). Tree edge $e$: stays while $w(e) <$ the lightest non-tree edge crossing the cut of $T - e$.` }
  ],

  problems: [
    {
      id: 'mst-kruskal-code', type: 'code', title: 'Minimum spanning forest weight', difficulty: 2,
      prompt: String.raw`Write <code>mstWeight(n, edges)</code>: given an undirected graph on vertices <code>0..n-1</code> with weighted edges <code>[u, v, w]</code> (integers, possibly negative or equal; self-loops and parallel edges may appear), return the total weight of a **minimum spanning forest** (the sum of the MST weights of all connected components). An edgeless graph has weight 0.`,
      fn: 'mstWeight',
      starter: 'function mstWeight(n, edges) {\n  // Kruskal: sort edges, union-find\n}\n',
      reference: function (n, edges) {
        const parent = Array.from({ length: n }, (_, i) => i);
        const rank = new Array(n).fill(0);
        const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        const sorted = edges.slice().sort((a, b) => a[2] - b[2]);
        let total = 0;
        for (const [u, v, w] of sorted) {
          let a = find(u), b = find(v);
          if (a === b) continue;
          if (rank[a] < rank[b]) { const t = a; a = b; b = t; }
          parent[b] = a;
          if (rank[a] === rank[b]) rank[a]++;
          total += w;
        }
        return total;
      },
      tests: [
        [1, []],
        [3, []],
        [6, [[0, 1, 4], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 7], [2, 4, 6], [3, 4, 5], [3, 5, 9], [4, 5, 8]]],
        [4, [[0, 1, 1], [2, 3, 5]]],
        [3, [[0, 1, -2], [1, 2, -3], [0, 2, -1]]],
        [3, [[0, 0, -10], [0, 1, 4], [0, 1, 2], [1, 2, 2], [0, 2, 2]]],
        [5, [[0, 1, 3], [1, 2, 3], [2, 3, 3], [3, 4, 3], [4, 0, 3]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10);
        const m = Math.floor(Math.random() * 3 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 20) - 5]);
        return [n, edges];
      },
      hints: [
        'Sort a copy of the edges by weight (do not mutate the input array).',
        'Union–find: an edge is added iff Find(u) != Find(v). Self-loops are automatically skipped.'
      ],
      solution: String.raw`**Kruskal.** Sort the edges by weight. Initialize a union–find structure with each vertex in its own set. For each edge $uv$ in order, if $Find(u) \ne Find(v)$, add $w(uv)$ to the total and $Union(u, v)$. Every added edge is the lightest edge leaving its component (all lighter edges were already handled), so it is safe; every skipped edge is useless. On a disconnected graph this produces an MST of every component, i.e., a minimum spanning forest. Ties and negative weights are harmless: ties can be broken by sorted position.

Time $O(E \log E)$ for sorting plus $O(E\,\alpha(V))$ for union–find.`
    },
    {
      id: 'mst-minimax-code', type: 'code', title: 'Minimax (bottleneck) path', difficulty: 2,
      prompt: String.raw`Write <code>minimaxPath(n, edges, s, t)</code>. The graph is undirected on <code>0..n-1</code> with edges <code>[u, v, w]</code> ($w$ positive integers). Among all paths from <code>s</code> to <code>t</code>, find the minimum possible value of the **largest edge weight** on the path. Return <code>0</code> if <code>s === t</code> and <code>-1</code> if <code>t</code> is unreachable from <code>s</code>.`,
      fn: 'minimaxPath',
      starter: 'function minimaxPath(n, edges, s, t) {\n  // hint: think about Kruskal\n}\n',
      reference: function (n, edges, s, t) {
        if (s === t) return 0;
        const parent = Array.from({ length: n }, (_, i) => i);
        const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        const sorted = edges.slice().sort((a, b) => a[2] - b[2]);
        for (const [u, v, w] of sorted) {
          const a = find(u), b = find(v);
          if (a !== b) parent[a] = b;
          if (find(s) === find(t)) return w;
        }
        return -1;
      },
      tests: [
        [1, [], 0, 0],
        [2, [], 0, 1],
        [2, [[0, 1, 7]], 0, 1],
        [4, [[0, 1, 5], [1, 3, 5], [0, 2, 1], [2, 3, 9]], 0, 3],
        [6, [[0, 1, 4], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 7], [2, 4, 6], [3, 4, 5], [3, 5, 9], [4, 5, 8]], 0, 5],
        [5, [[0, 1, 2], [1, 2, 2], [3, 4, 1]], 0, 4],
        [3, [[0, 1, 10], [0, 1, 3], [1, 2, 4]], 2, 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const m = Math.floor(Math.random() * 3 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), 1 + Math.floor(Math.random() * 15)]);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
      },
      hints: [
        'The answer is the smallest W such that s and t are connected using only edges of weight at most W.',
        'Run Kruskal and stop the moment s and t land in the same set; the weight of the current edge is the answer. (Equivalently, the heaviest edge on the MST path from s to t.)'
      ],
      solution: String.raw`The answer is the smallest $W$ such that $s$ and $t$ are connected in the subgraph $G_{\le W}$ of edges with weight $\le W$: a path with bottleneck $W$ lies in $G_{\le W}$, and conversely any $s$-$t$ path in $G_{\le W}$ has bottleneck at most $W$.

Kruskal adds edges in increasing weight order and maintains exactly the connected components of $G_{\le w}$ (after processing all edges of weight $\le w$). So process edges in sorted order, union their endpoints, and return the weight of the edge after which $Find(s) = Find(t)$ first holds. If this never happens, $t$ is unreachable.

Equivalently: the minimax $s$-$t$ path is the MST path from $s$ to $t$, and the answer is its heaviest edge. Time $O(E \log V)$. (A modified Dijkstra with key = bottleneck so far also works, in $O(E \log V)$.)`
    },
    {
      id: 'mst-inmst-code', type: 'code', title: 'Is this edge in the MST?', difficulty: 2,
      prompt: String.raw`Write <code>inMST(n, edges, i)</code>. The graph is undirected on <code>0..n-1</code> with edges <code>[u, v, w]</code>; **all weights are distinct**, so the minimum spanning forest is unique. Return <code>true</code> iff <code>edges[i]</code> belongs to it. Aim for $O(V+E)$ (no sorting needed).`,
      fn: 'inMST',
      starter: 'function inMST(n, edges, i) {\n  // is there a u-v path using only lighter edges?\n}\n',
      reference: function (n, edges, i) {
        const [u, v, w] = edges[i];
        if (u === v) return false;
        const adj = Array.from({ length: n }, () => []);
        for (const [a, b, c] of edges) if (c < w) { adj[a].push(b); adj[b].push(a); }
        const seen = new Array(n).fill(false);
        const st = [u]; seen[u] = true;
        while (st.length) {
          const x = st.pop();
          for (const y of adj[x]) if (!seen[y]) { seen[y] = true; st.push(y); }
        }
        return !seen[v];
      },
      tests: [
        [2, [[0, 1, 5]], 0],
        [3, [[0, 1, 1], [1, 2, 2], [0, 2, 3]], 2],
        [3, [[0, 1, 1], [1, 2, 2], [0, 2, 3]], 1],
        [6, [[0, 1, 4], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 7], [2, 4, 6], [3, 4, 5], [3, 5, 9], [4, 5, 8]], 0],
        [6, [[0, 1, 4], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 7], [2, 4, 6], [3, 4, 5], [3, 5, 9], [4, 5, 8]], 8],
        [6, [[0, 1, 4], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 7], [2, 4, 6], [3, 4, 5], [3, 5, 9], [4, 5, 8]], 7],
        [3, [[0, 0, 1], [0, 1, 2]], 0],
        [4, [[0, 1, 10], [2, 3, 1]], 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const m = 1 + Math.floor(Math.random() * 3 * n);
        const ws = Array.from({ length: m }, (_, j) => j + 1);
        for (let j = m - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); const tmp = ws[j]; ws[j] = ws[r]; ws[r] = tmp; }
        const edges = [];
        for (let j = 0; j < m; j++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), ws[j]]);
        return [n, edges, Math.floor(Math.random() * m)];
      },
      hints: [
        'Cycle property: if u and v are already connected by lighter edges, e is the heaviest edge on a cycle.',
        'Cut property: otherwise, the component of u in the lighter-edge subgraph gives a cut that e crosses as the lightest edge.'
      ],
      solution: String.raw`Let $e = uv$ with weight $w$. Let $G_{<w}$ be the subgraph of edges lighter than $w$. Claim: $e$ is in the MST iff $u$ and $v$ are in different components of $G_{<w}$.

- If some $u$-$v$ path $P$ uses only lighter edges, then $P + e$ is a cycle on which $e$ is the heaviest edge, so by the cycle property $e$ is not in the MST.
- Otherwise, let $S$ be the component of $G_{<w}$ containing $u$. Every edge leaving $S$ has weight $\ge w$ (lighter ones would be inside $S$), with equality only for $e$ itself since weights are distinct. So $e$ is the lightest edge across the cut $(S, V \setminus S)$ and is in the MST by the cut property.

A self-loop is never in a spanning forest. Algorithm: one whatever-first search from $u$ in $G_{<w}$; return true iff $v$ is not reached. Time $O(V+E)$.`
    },
    {
      id: 'mst-trace', type: 'written', title: 'Run the three MST algorithms', difficulty: 1,
      prompt: String.raw`For the weighted graph below, list the edges in the order they are added by (a) Kruskal, (b) Jarník/Prim starting from $a$, and (c) Borůvka (by round). Give the total MST weight.

~~~graph
undirected
a b 6
a d 4
b c 10
b d 9
b e 2
c e 5
d e 7
d f 3
e f 8
c f 11
~~~`,
      rubric: [
        'Kruskal order be, df, ad, ce, ab with rejected edges identified as useless',
        'Prim order from a: ad, df, ab, be, ce',
        'Borůvka round 1 {ad, be, ce, df}, round 2 {ab}',
        'Total weight 20'
      ],
      hints: ['Weights are distinct, so all three algorithms must find the same tree.'],
      solution: String.raw`**(a) Kruskal.** Sorted: $be$ (2) add; $df$ (3) add; $ad$ (4) add, giving components $\{a,d,f\}$, $\{b,e\}$, $\{c\}$; $ce$ (5) add; $ab$ (6) add, joining $\{a,d,f\}$ and $\{b,c,e\}$. Now we have $5 = V - 1$ edges; the remaining edges $de$ (7), $ef$ (8), $bd$ (9), $bc$ (10), $cf$ (11) are all useless.

**(b) Jarník from $a$.** Tree $\{a\}$: candidates $ab$ 6, $ad$ 4 → add $ad$. Tree $\{a,d\}$: $ab$ 6, $bd$ 9, $de$ 7, $df$ 3 → add $df$. Tree $\{a,d,f\}$: $ab$ 6, $bd$ 9, $de$ 7, $ef$ 8, $cf$ 11 → add $ab$. Tree $\{a,b,d,f\}$: $be$ 2, $bc$ 10, $de$ 7, $ef$ 8, $cf$ 11 → add $be$. Tree $\{a,b,d,e,f\}$: $ce$ 5, $bc$ 10, $cf$ 11 → add $ce$.

**(c) Borůvka.** Round 1: lightest edge at $a$: $ad$; $b$: $be$; $c$: $ce$; $d$: $df$; $e$: $be$; $f$: $df$. Add $\{ad, be, ce, df\}$; components $\{a,d,f\}$ and $\{b,c,e\}$. Round 2: the lightest edge leaving either component is $ab$ (6). Add it.

**MST** $= \{be, df, ad, ce, ab\}$ with weight $2 + 3 + 4 + 5 + 6 = 20$.`
    },
    {
      id: 'mst-unique-proof', type: 'written', title: 'Uniqueness of the MST', difficulty: 2,
      prompt: String.raw`Prove that if all edge weights of a connected undirected graph $G$ are distinct, then $G$ has exactly one minimum spanning tree. Then give an example showing that the conclusion can fail if two edges have equal weight.`,
      rubric: [
        'Assumes two distinct MSTs and picks the lightest edge in the symmetric difference',
        'Adds it to the other tree to form a cycle and finds an edge of the other tree on that cycle not in the first tree',
        'Argues that this edge is strictly heavier (choice of lightest + distinctness)',
        'Shows the exchange yields a spanning tree of smaller weight (contradiction)',
        'Valid counterexample with ties (e.g., a triangle with all weights equal)'
      ],
      hints: ['Consider the lightest edge that belongs to exactly one of the two trees.'],
      solution: String.raw`Suppose $T_1 \ne T_2$ are both MSTs. Since both have $V - 1$ edges and are different, the symmetric difference $T_1 \oplus T_2$ is nonempty. Let $e$ be its lightest edge; without loss of generality $e \in T_1 \setminus T_2$.

$T_2 + e$ contains exactly one cycle $C$, and $e \in C$. Not every edge of $C$ is in $T_1$ (since $T_1$ is acyclic), so some $f \in C$ satisfies $f \notin T_1$. Then $f \in T_2$ (all edges of $C$ other than $e$ are in $T_2$), so $f \in T_2 \setminus T_1 \subseteq T_1 \oplus T_2$, and $f \ne e$. By the choice of $e$ and distinctness, $w(f) > w(e)$.

$T' = T_2 + e - f$ is a spanning tree: deleting an edge of the unique cycle of $T_2 + e$ leaves the graph connected, with $V - 1$ edges. Its weight is $w(T_2) + w(e) - w(f) < w(T_2)$, contradicting the minimality of $T_2$. Hence the MST is unique. ∎

**With ties:** a triangle with all three edges of weight 1 has three different MSTs (any two edges), each of weight 2.`
    },
    {
      id: 'mst-update', type: 'written', title: 'Updating an MST after a weight change', difficulty: 2,
      prompt: String.raw`You are given a connected graph $G$ with distinct edge weights and its MST $T$. One edge $e = uv$ has its weight changed to a new value (weights remain distinct). Describe how to compute the new MST in each of the four cases: (i) $e \in T$ and its weight decreases; (ii) $e \notin T$ and its weight increases; (iii) $e \notin T$ and its weight decreases; (iv) $e \in T$ and its weight increases. Give running times and justify correctness of cases (iii) and (iv).`,
      rubric: [
        '(i) and (ii): T is unchanged, with a one-line justification',
        '(iii): add e, find the u-v tree path, remove its heaviest edge (or e if heavier): O(V)',
        '(iii) correctness via the cycle property / edge membership criterion',
        '(iv): remove e, label the two components, add the lightest crossing edge: O(V+E)',
        '(iv) correctness via the cut property'
      ],
      hints: [
        'Which edges could possibly change status? Use the membership test: e is in the MST iff no path of lighter edges joins its endpoints.',
        'Case (iii) creates exactly one cycle; case (iv) creates exactly one cut.'
      ],
      solution: String.raw`Write $w$ for the old weights and $w'$ for the new ones; only $e$'s weight changes.

**(i) $e \in T$ gets lighter (by $\delta > 0$).** For every spanning tree $T'$, $w'(T') = w(T') - \delta \cdot [e \in T']$. Hence $w'(T) = w(T) - \delta \le w(T') - \delta \le w'(T')$. $T$ is still an MST. $O(1)$.

**(ii) $e \notin T$ gets heavier.** $w'(T) = w(T) \le w(T') \le w'(T')$ for every spanning tree $T'$. $T$ is still an MST. $O(1)$.

**(iii) $e \notin T$ gets lighter.** Find the path $P$ from $u$ to $v$ in $T$ (one search in the tree, $O(V)$) and its heaviest edge $g$. If $w'(e) > w(g)$, output $T$; otherwise output $T - g + e$.

*Correctness.* Consider any edge $f \notin T$, $f \ne e$. In the old graph, by the cycle property applied to the cycle formed by $f$ and its $T$-path, every edge on that $T$-path is lighter than $f$. Those edges are tree edges, whose weights did not change, so in the new graph $f$ is still the heaviest edge on that cycle and is not in the new MST. Therefore the new MST is a spanning tree of the subgraph $T + e$. That subgraph has exactly one cycle, $P + e$, and its spanning trees are obtained by deleting one edge of that cycle; by the cycle property the deleted edge must be the heaviest one, which is $g$ or $e$. $O(V)$ total.

**(iv) $e \in T$ gets heavier.** Remove $e$ from $T$, splitting it into trees $A \ni u$ and $B \ni v$; label the vertices by side with one search ($O(V)$). Scan all edges and let $h$ be the lightest edge (under $w'$) with one endpoint in $A$ and the other in $B$; this may be $e$ itself. Output $T - e + h$.

*Correctness.* Take any tree edge $f \ne e$. Removing $f$ from $T$ defines a cut, and in the old graph $f$ is the lightest edge across it (otherwise the lighter crossing edge could replace $f$). The edge $e$ does not cross this cut, because $e \in T - f$ lies inside one of the two pieces. So the weights of the crossing edges are unchanged, $f$ is still the lightest across the cut, and by the cut property $f$ is in the new MST. Thus the new MST contains $T - e$, and its remaining edge must cross $(A, B)$; by the cut property it is $h$. $O(V + E)$ total.`
    },
    {
      id: 'mst-bottleneck', type: 'written', title: 'MSTs are bottleneck-optimal', difficulty: 2,
      prompt: String.raw`The *bottleneck* of a spanning tree is the maximum weight of its edges. (a) Prove that every MST of a connected graph is a minimum bottleneck spanning tree. (b) Show that the converse is false. (c) Prove that for any vertices $u, v$, the path between them in the MST minimizes the maximum edge weight among all $u$-$v$ paths in $G$ (assume distinct weights).`,
      rubric: [
        '(a) Exchange: remove the heaviest MST edge, find a crossing edge of the better tree, swap to get a lighter tree',
        '(b) Concrete counterexample',
        '(c) Remove the heaviest edge of the MST path; a better path must cross the cut with a lighter edge; swap',
        'All exchanges justified as producing spanning trees'
      ],
      hints: ['Remove the heaviest edge e of the MST; the two pieces define a cut. Any spanning tree (or u-v path) must cross that cut.'],
      solution: String.raw`**(a)** Let $T$ be an MST with heaviest edge $e$, and suppose some spanning tree $T'$ has bottleneck $< w(e)$, i.e., every edge of $T'$ is lighter than $e$. Removing $e$ from $T$ leaves two components $A$, $B$. $T'$ is connected, so some edge $f \in T'$ crosses between $A$ and $B$, and $w(f) < w(e)$. Then $T - e + f$ is a spanning tree (it reconnects $A$ and $B$ with $V-1$ edges) lighter than $T$. Contradiction.

**(b)** The bottleneck only sees the heaviest edge, so a tree can be bottleneck-optimal while wasting weight elsewhere. Example: vertices $a, b, c, d$; edges $ab$ (1), $bc$ (2), $ac$ (3), $cd$ (5). Every spanning tree must contain the bridge $cd$, so every spanning tree has bottleneck 5. The tree $\{ac, bc, cd\}$ (weight 10) is therefore a minimum bottleneck spanning tree but not an MST (the MST $\{ab, bc, cd\}$ weighs 8).

**(c)** Let $P$ be the $u$-$v$ path in the MST $T$, with heaviest edge $e$, and suppose some $u$-$v$ path $Q$ in $G$ uses only edges lighter than $e$. Removing $e$ from $T$ separates $T$ into two components, with $u$ and $v$ on different sides (since $e$ is on the unique tree path between them). $Q$ goes from $u$'s side to $v$'s side, so it has an edge $f$ crossing between the components, and $w(f) < w(e)$. Then $T - e + f$ is a lighter spanning tree, a contradiction. So no $u$-$v$ path has a smaller maximum edge than $P$.`
    },
    {
      id: 'mst-weights-12', type: 'written', title: 'MST with weights 1 and 2', difficulty: 2,
      prompt: String.raw`Every edge of a connected undirected graph $G$ has weight 1 or 2. Describe an $O(V + E)$-time algorithm to compute an MST and justify its correctness.`,
      rubric: [
        'Kruskal with a linear-time sort (bucket the edges by weight), or equivalent two-phase spanning forest construction',
        'Explains how to avoid the O(E log V) sort',
        'Union-find gives O(E alpha(V)); for strict O(V+E), uses WFS-based spanning forests / contraction',
        'Correctness: it is exactly Kruskal\'s order (ties broken arbitrarily), so it produces an MST'
      ],
      hints: [
        'Kruskal only needs the edges in sorted order, and sorting two values is easy.',
        'For strict linear time, avoid union-find: compute a spanning forest of the weight-1 edges, contract its components, then a spanning forest of the weight-2 edges in the contracted graph.'
      ],
      solution: String.raw`**Idea.** Kruskal is correct with any tie-breaking order, and here sorting is trivial: put all weight-1 edges before all weight-2 edges ($O(E)$ bucket sort). With union–find this is already $O(E\,\alpha(V))$. For a strict $O(V+E)$ bound, replace union–find with searches:

1. Let $G_1$ be the subgraph of weight-1 edges. Compute a spanning forest $F_1$ of $G_1$ (e.g., the search trees of the component-labeling WFS) and label each vertex with its component $comp(v)$. $O(V+E)$.
2. Build the multigraph $H$ whose vertices are the components of $G_1$, with an edge $comp(u)comp(v)$ for each weight-2 edge $uv$ with $comp(u) \ne comp(v)$, remembering the original edge. $O(V+E)$.
3. Compute a spanning tree $F_2$ of $H$ (WFS from any vertex; $H$ is connected because $G$ is). Output $F_1 \cup$ (original edges of $F_2$). $O(V+E)$.

**Correctness.** Kruskal produces an MST for *every* way of breaking ties. Run it with the edge order: edges of $F_1$, then the other weight-1 edges, then the weight-2 edges of $F_2$, then the other weight-2 edges. The $F_1$ edges are all added (they form a forest); every other weight-1 edge is then useless (its endpoints are in the same component of $G_1$). Each $F_2$ edge joins two different current components (since $F_2$ is acyclic in $H$), so it is added; afterwards everything is connected and the remaining edges are useless. So Kruskal with this order outputs exactly $F_1 \cup F_2$, which is therefore an MST.

**Time.** $O(V + E)$.`
    },
    {
      id: 'mst-second-best', type: 'written', title: 'Second-best minimum spanning tree', difficulty: 3,
      prompt: String.raw`Let $G$ be connected with distinct edge weights, and let $T$ be its (unique) MST. A *second-best MST* is a spanning tree $T' \ne T$ of minimum weight among all spanning trees other than $T$.

(a) Prove that some second-best MST has the form $T - g + f$ for a single edge $f \notin T$ and a single edge $g \in T$.

(b) Describe an $O(V^2)$-time algorithm (given $T$) to compute the weight of a second-best MST.`,
      rubric: [
        '(a) Takes a second-best tree T\' and an edge e in T \\ T\'; considers the cycle in T\' + e',
        '(a) Shows that some edge f on that cycle with f in T\' \\ T is heavier than e (e.g. via the cycle property and an even-traversal/parity argument, or a valid alternative)',
        '(a) If |T\' \\ T| >= 2, the swap gives a lighter tree different from T: contradiction',
        '(b) Computes max-weight edge on the tree path for all pairs in O(V^2) (search from each vertex in T)',
        '(b) Answer: w(T) + min over non-tree edges uv of (w(uv) - maxedge(u,v)); total O(V^2)'
      ],
      hints: [
        'Assume T\' is a second-best tree with |T\' \\ T| >= 2 and derive a contradiction by exhibiting a lighter tree that is still different from T.',
        'For each non-tree edge f = uv, the best swap removes the heaviest edge on the tree path from u to v.',
        'Max edge on tree paths from a fixed root r to every vertex can be computed in O(V) by one DFS/BFS in T.'
      ],
      solution: String.raw`**(a)** Let $T'$ be a second-best MST, and suppose for contradiction that $|T' \setminus T| \ge 2$ (and hence also $|T \setminus T'| \ge 2$). Pick any $e \in T \setminus T'$. $T' + e$ has a unique cycle $C$ through $e$.

*Claim: some edge $f \in C$ with $f \in T' \setminus T$ satisfies $w(f) > w(e)$.* Suppose instead every edge of $C$ that lies outside $T$ is lighter than $e$. Each such edge $f = xy \notin T$ satisfies the cycle property: all edges on the $T$-path between $x$ and $y$ are lighter than $f$, hence lighter than $e$, so none of them is $e$. Replace each such $f$ in $C$ by its $T$-path. The result is a closed walk using only edges of $T$, in which $e$ appears **exactly once** (the original occurrence; the other edges of $C$ that are in $T$ are in $T'$, so they are not $e$, and the substituted paths avoid $e$). But in a tree, a closed walk crosses each edge an even number of times (removing the edge disconnects its endpoints, so every crossing must be undone). Contradiction.

So take such an $f$. $T'' = T' + e - f$ is a spanning tree with $w(T'') = w(T') + w(e) - w(f) < w(T')$. Moreover $T'' \ne T$, because $T'' \setminus T = (T' \setminus T) \setminus \{f\}$, which is nonempty since $|T' \setminus T| \ge 2$. This contradicts the choice of $T'$ as a lightest tree other than $T$. Hence $|T' \setminus T| = 1$: $T' = T - g + f$ for some $f \notin T$, $g \in T$. ∎

**(b)** By (a), the second-best weight is
$$\min_{f = uv \notin T} \big(w(T) + w(f) - \max(u, v)\big),$$
where $\max(u,v)$ is the heaviest edge on the $T$-path from $u$ to $v$: for a fixed $f$, $T - g + f$ is a spanning tree exactly when $g$ lies on that path, and removing the heaviest such $g$ is best.

*Computing all $\max(u,v)$.* For each root $r$, run a DFS/BFS in $T$ from $r$, setting $\max(r, r) = -\infty$ and $\max(r, y) = \max(\max(r, x), w(xy))$ when $y$ is discovered from $x$. Each search is $O(V)$ (a tree has $V-1$ edges), so all pairs take $O(V^2)$.

*Total.* $O(V^2)$ for the table plus $O(E) = O(V^2)$ to scan non-tree edges. (If $G$ is itself a tree there is no second-best tree.)`
    },
    {
      id: 'mst-certify', type: 'written', title: 'Certifying a minimum spanning tree', difficulty: 3,
      prompt: String.raw`Let $G$ be connected with distinct edge weights, and let $T$ be a spanning tree of $G$. For a non-tree edge $f = uv$, let $\max_T(u, v)$ denote the heaviest edge weight on the path from $u$ to $v$ in $T$.

(a) Prove: $T$ is the MST **if and only if** every non-tree edge $f = uv$ satisfies $w(f) > \max_T(u, v)$.

(b) Use (a) to give an $O(V^2)$-time algorithm that checks whether a given spanning tree is the MST.`,
      rubric: [
        '(⇒) via the cycle property applied to the cycle f + T-path',
        '(⇐) assumes T is not the MST M; takes the lightest edge e of T ⊕ M',
        'Case e in M \\ T: uses the condition on e to find a lighter edge of T \\ M on e\'s T-path (contradiction)',
        'Case e in T \\ M: uses the cycle property of M to find a lighter edge of M \\ T on e\'s M-path (contradiction)',
        '(b) all-pairs path maxima in T by V searches (O(V^2)), then check each non-tree edge'
      ],
      hints: [
        'One direction is the cycle property.',
        'For the other direction, compare T with the true MST M and look at the lightest edge on which they disagree.'
      ],
      solution: String.raw`**(a) (⇒)** Suppose $T$ is the MST and $f = uv \notin T$. The $T$-path from $u$ to $v$ plus $f$ is a cycle. By the cycle property its heaviest edge is not in the MST; all its edges other than $f$ are in $T$, so the heaviest edge must be $f$. Hence $w(f) > \max_T(u,v)$.

**(⇐)** Suppose the condition holds but $T \ne M$, where $M$ is the unique MST. Let $e$ be the lightest edge of $T \oplus M$.

- *Case $e \in M \setminus T$.* $e$ is a non-tree edge for $T$, so by the condition every edge on the $T$-path between $e$'s endpoints is lighter than $e$. Not all of these edges are in $M$ (together with $e \in M$ they would form a cycle in $M$), so one of them, $g$, lies in $T \setminus M$, and $w(g) < w(e)$. This contradicts the choice of $e$.
- *Case $e \in T \setminus M$.* $e$ is a non-tree edge for $M$, and $M$ satisfies the condition by (⇒), so every edge on the $M$-path between $e$'s endpoints is lighter than $e$. Not all of them are in $T$ (else $T$ would contain a cycle with $e$), so one of them, $g$, lies in $M \setminus T$, with $w(g) < w(e)$. Again a contradiction.

So $T = M$. ∎

**(b)** For each vertex $r$, run a DFS/BFS in $T$ from $r$, computing $\max_T(r, y)$ for all $y$ via $\max_T(r, y) = \max(\max_T(r, x), w(xy))$ when $y$ is discovered from $x$. Each search costs $O(V)$ because $T$ has $V - 1$ edges, so the full table takes $O(V^2)$. Then check every non-tree edge $uv$ against $\max_T(u, v)$ in $O(1)$ each, $O(E) = O(V^2)$ in total. Answer YES iff all checks pass.`
    },
    {
      id: 'mst-feedback-edges', type: 'written', title: 'Cheapest way to break all cycles', difficulty: 3,
      prompt: String.raw`Let $G = (V, E)$ be an undirected graph with **positive** edge weights. Describe and analyze an efficient algorithm to find a minimum-weight set of edges $F \subseteq E$ whose removal leaves an acyclic graph (a forest). Prove that your algorithm is correct.`,
      rubric: [
        'Reformulation: minimizing w(F) is equivalent to maximizing w(E \\ F) over forests E \\ F',
        'Shows a maximum-weight forest can be taken to be a maximum spanning forest (positive weights: extend any forest to a spanning forest without decreasing weight)',
        'Computes a maximum spanning forest (Kruskal in decreasing order / negated weights) and outputs its complement',
        'Running time O(E log V)'
      ],
      hints: [
        'The edges you keep must form a forest. What forest do you want to keep?',
        'With positive weights, adding edges to a forest (without creating cycles) only increases its weight.'
      ],
      solution: String.raw`**Reformulation.** Removing $F$ leaves a forest iff $K = E \setminus F$ is a forest. Since $w(F) = w(E) - w(K)$, minimizing $w(F)$ is the same as **maximizing** $w(K)$ over all forests $K \subseteq E$.

**Max-weight forests are maximum spanning forests.** Any forest $K$ can be extended, by adding edges that join different components of $K$, to a spanning forest of $G$ (one spanning tree per component of $G$). Because weights are positive, extension never decreases the weight. So some maximum-weight forest is a spanning forest, and among spanning forests the heaviest is a **maximum spanning forest**.

**Algorithm.** Compute a maximum spanning forest $K$ with Kruskal, scanning edges in **decreasing** order of weight (equivalently, an MST with weights negated, which is valid since MST algorithms allow negative weights). Output $F = E \setminus K$.

**Correctness.** By the two paragraphs above, $w(K)$ is the maximum weight of any forest, so $F$ has minimum weight among edge sets whose removal leaves a forest.

**Time.** $O(E \log V)$ for Kruskal (sorting dominates), plus $O(E)$ to output the complement.

(Positivity is used only in the extension step. If some weights were negative, keeping a negative edge could only lower $w(K)$; the right algorithm would then compute a maximum spanning forest of the subgraph of nonnegative edges and remove everything else.)`
    },
    {
      id: 'mst-clustering-code', type: 'code', title: 'Max-spacing k-clustering', difficulty: 2,
      prompt: String.raw`Write <code>maxSpacing(points, k)</code>. <code>points</code> is an array of $n \ge 2$ points <code>[x, y]</code> with integer coordinates (points may coincide), and $2 \le k \le n$. The distance between two points is the **Manhattan distance** $|x_1 - x_2| + |y_1 - y_2|$. Among all ways to partition the points into exactly $k$ nonempty clusters, return the **largest possible spacing**, where the spacing of a clustering is the minimum distance between two points in different clusters.`,
      fn: 'maxSpacing',
      starter: 'function maxSpacing(points, k) {\n  // Kruskal on all pairs; stop when k components remain\n}\n',
      reference: function (points, k) {
        const n = points.length;
        const pairs = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]), i, j]);
        pairs.sort((a, b) => a[0] - b[0]);
        const parent = Array.from({ length: n }, (_, i) => i);
        const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        let comps = n;
        for (const [d, i, j] of pairs) {
          const a = find(i), b = find(j);
          if (a === b) continue;
          if (comps === k) return d;
          parent[a] = b; comps--;
        }
        return -1;
      },
      tests: [
        [[[0, 0], [1, 0], [10, 0]], 2],
        [[[0, 0], [3, 4]], 2],
        [[[0, 0], [0, 1], [5, 5], [5, 6], [10, 0]], 3],
        [[[0, 0], [0, 0], [1, 1]], 2],
        [[[0, 0], [1, 0], [2, 0], [3, 0]], 4],
        [[[0, 0], [2, 0], [4, 0], [6, 0], [100, 100]], 2],
        [[[1, 1], [2, 2], [8, 8], [9, 9], [1, 9], [2, 8]], 3]
      ],
      gen: () => {
        const n = 2 + Math.floor(Math.random() * 9);
        const pts = Array.from({ length: n }, () => [Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)]);
        return [pts, 2 + Math.floor(Math.random() * (n - 1))];
      },
      hints: [
        'Think of the points as a complete graph whose edge weights are distances.',
        'Run Kruskal. While more than k components remain, keep merging. The first edge that would merge two components once exactly k remain gives the answer.',
        'Skip edges whose endpoints are already in the same component, both before and after reaching k components.'
      ],
      solution: String.raw`**Algorithm.** Build all $\binom{n}{2}$ pairs with their distances, sort them, and run Kruskal with union–find. Merge components until exactly $k$ remain. Then keep scanning: the first pair whose endpoints lie in different components has distance $d^*$; return $d^*$.

**Why it is optimal.** Kruskal's $k$ components form a clustering $\mathcal C$ whose spacing is exactly $d^*$: every inter-cluster pair appears at or after that edge in sorted order. For any other $k$-clustering $\mathcal C'$, some cluster of $\mathcal C$ is split by $\mathcal C'$ (two different partitions with the same number of parts cannot refine one another). Take $p, q$ together in $\mathcal C$ but apart in $\mathcal C'$; Kruskal joined them by a path of edges of length $\le d^*$, and some edge of that path crosses between two clusters of $\mathcal C'$. So the spacing of $\mathcal C'$ is at most $d^*$.

Equivalently: compute an MST and return the weight of its $(k-1)$-th heaviest edge. Ties do not matter, because all MSTs have the same multiset of weights.

**Time.** $O(n^2 \log n)$ for sorting the pairs; union–find is negligible.`
    },
    {
      id: 'mst-second-best-code', type: 'code', title: 'Second-best spanning tree weight', difficulty: 3,
      prompt: String.raw`Write <code>secondBestMST(n, edges)</code>. The graph is undirected, **connected**, and **simple** on vertices <code>0..n-1</code> ($n \ge 2$), with edges <code>[u, v, w]</code> whose weights are **distinct** integers. Return the minimum weight of a spanning tree that is **different from** the (unique) MST, or <code>-1</code> if the graph has no other spanning tree (i.e., it is itself a tree). Aim for $O(V^2 + E \log E)$.`,
      fn: 'secondBestMST',
      starter: 'function secondBestMST(n, edges) {\n  // 1. Kruskal for the MST\n  // 2. max edge on tree paths between all pairs\n  // 3. best single swap\n}\n',
      reference: function (n, edges) {
        const parent = Array.from({ length: n }, (_, i) => i);
        const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        const order = edges.map((e, i) => i).sort((a, b) => edges[a][2] - edges[b][2]);
        const inT = new Array(edges.length).fill(false);
        const adj = Array.from({ length: n }, () => []);
        let total = 0;
        for (const i of order) {
          const [u, v, w] = edges[i];
          const a = find(u), b = find(v);
          if (a === b) continue;
          parent[a] = b; inT[i] = true; total += w;
          adj[u].push([v, w]); adj[v].push([u, w]);
        }
        const mx = [];
        for (let r = 0; r < n; r++) {
          const row = new Array(n).fill(-Infinity);
          const seen = new Array(n).fill(false);
          const st = [r]; seen[r] = true;
          while (st.length) {
            const x = st.pop();
            for (const [y, w] of adj[x]) if (!seen[y]) { seen[y] = true; row[y] = Math.max(row[x], w); st.push(y); }
          }
          mx.push(row);
        }
        let best = Infinity;
        edges.forEach(([u, v, w], i) => { if (!inT[i]) best = Math.min(best, total + w - mx[u][v]); });
        return best === Infinity ? -1 : best;
      },
      tests: [
        [2, [[0, 1, 5]]],
        [3, [[0, 1, 1], [1, 2, 2], [0, 2, 3]]],
        [4, [[0, 1, 1], [1, 2, 2], [2, 3, 3], [3, 0, 4], [0, 2, 5]]],
        [6, [[0, 1, 4], [0, 2, 1], [1, 2, 3], [1, 3, 2], [2, 3, 7], [2, 4, 6], [3, 4, 5], [3, 5, 9], [4, 5, 8]]],
        [5, [[0, 1, 3], [0, 2, 1], [0, 3, 4], [0, 4, 2]]],
        [4, [[0, 1, -5], [1, 2, 10], [2, 3, -1], [0, 3, 7], [1, 3, 0]]]
      ],
      gen: () => {
        const n = 2 + Math.floor(Math.random() * 8);
        const pairs = [];
        for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) pairs.push([u, v]);
        const verts = [0]; const edges = []; const has = new Set();
        for (let v = 1; v < n; v++) { const u = verts[Math.floor(Math.random() * verts.length)]; verts.push(v); edges.push([u, v]); has.add(Math.min(u, v) + ',' + Math.max(u, v)); }
        for (const [u, v] of pairs) if (!has.has(u + ',' + v) && Math.random() < 0.4) { edges.push([u, v]); has.add(u + ',' + v); }
        const m = edges.length;
        const ws = Array.from({ length: m }, (_, j) => 1 + 2 * j + Math.floor(Math.random() * 2));
        for (let j = m - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); const t = ws[j]; ws[j] = ws[r]; ws[r] = t; }
        return [n, edges.map(([u, v], j) => (Math.random() < 0.5 ? [u, v, ws[j]] : [v, u, ws[j]]))];
      },
      hints: [
        'Some second-best tree is T − g + f for one non-tree edge f and one tree edge g (see the written problem on second-best MSTs).',
        'For a fixed non-tree edge f = uv, the best g to remove is the heaviest edge on the tree path from u to v.',
        'Compute maxEdge[r][y] for all pairs with one DFS/BFS of the tree from each root r: maxEdge[r][y] = max(maxEdge[r][x], w(xy)) when y is discovered from x.'
      ],
      solution: String.raw`**Structure.** With distinct weights, some second-best spanning tree has the form $T - g + f$ where $f \notin T$ and $g$ is on the $T$-path between $f$'s endpoints (proof in the written problem *Second-best minimum spanning tree*). For a fixed $f = uv$ the cheapest valid choice removes the heaviest edge $g$ on that path, giving weight $w(T) + w(f) - \max_T(u, v)$. Every such swap gives a tree different from $T$ (it contains $f$).

**Algorithm.**
1. Kruskal: find $T$ and $w(T)$. $O(E \log E)$.
2. For every root $r$, a DFS of $T$ computes $\max_T(r, y)$ for all $y$. Each DFS is $O(V)$, so the table costs $O(V^2)$.
3. Return $w(T) + \min_{f = uv \notin T} \big(w(f) - \max_T(u, v)\big)$, or $-1$ if there is no non-tree edge.

**Time.** $O(V^2 + E \log E)$. (Negative weights are fine: only comparisons and differences are used.)`
    },
    {
      id: 'mst-tf-cycles-cuts', type: 'written', title: 'Prove or disprove: MST facts', difficulty: 2,
      prompt: String.raw`Let $G$ be a connected, **simple** undirected graph with **distinct** edge weights and MST $T$. For each statement, prove it or give a counterexample.

(a) The heaviest edge of $G$ is not in $T$.

(b) If the heaviest edge of $G$ lies on some cycle, it is not in $T$.

(c) The two lightest edges of $G$ are both in $T$.

(d) The three lightest edges of $G$ are all in $T$.

(e) For every vertex $v$, the lightest edge incident to $v$ is in $T$.

(f) For every vertex $v$ of degree at least 2, the heaviest edge incident to $v$ is not in $T$.`,
      rubric: [
        '(a) False: a bridge must be in every spanning tree; concrete example',
        '(b) True: cycle property applied to that cycle',
        '(c) True: Kruskal adds the first two edges (simple graph, no parallel edges); or cut-property argument',
        '(d) False: the three lightest edges form a triangle',
        '(e) True: cut property with the cut ({v}, V − {v})',
        '(f) False: concrete counterexample (e.g., a path, or a vertex whose heaviest edge is a bridge)'
      ],
      hints: [
        'Statements about being IN the MST want a cut; statements about being OUT want a cycle.',
        'Bridges are the usual source of counterexamples for "heaviest edge" statements.'
      ],
      solution: String.raw`**(a) False.** Path $a - b - c$ with $w(ab) = 1$, $w(bc) = 2$: the heaviest edge $bc$ is a bridge, and the only spanning tree is the whole graph.

**(b) True.** If the heaviest edge $e$ of $G$ lies on a cycle $C$, then $e$ is the heaviest edge on $C$, and by the cycle property it is not in $T$.

**(c) True.** Kruskal examines the lightest edge $e_1$ first and adds it. It examines the second-lightest $e_2$ next; $e_2$ would be useless only if its endpoints were already in one component, i.e., joined by $e_1$, so $e_2$ would be parallel to $e_1$. A simple graph has no parallel edges, so $e_2$ is added too. (With distinct weights, Kruskal's output is the unique MST.)

**(d) False.** Triangle $x, y, z$ with weights 1, 2, 3: the third-lightest edge is the heaviest edge on the triangle and is not in $T$.

**(e) True.** The lightest edge at $v$ is the lightest edge crossing the cut $(\{v\}, V \setminus \{v\})$, so it is in $T$ by the cut property.

**(f) False.** Path $a - b - c$ with $w(ab) = 1$, $w(bc) = 2$: vertex $b$ has degree 2 and its heaviest edge $bc$ is in $T$. (More generally the heaviest edge at $v$ is excluded only if it is heaviest on some cycle.)`
    },
    {
      id: 'mst-tf-transforms', type: 'written', title: 'Which weight changes preserve the MST?', difficulty: 2,
      prompt: String.raw`Let $T$ be an MST of a connected graph $G$ with **distinct** real weights $w$ (negative weights allowed). For each new weight function, decide whether $T$ is necessarily an MST of $G$ under the new weights. Prove or give a counterexample.

(a) $w_1(e) = w(e) + 7$

(b) $w_2(e) = w(e)^2$; also answer for the special case where all weights are positive

(c) $w_3(e) = -w(e)$

(d) $w_4(e) = 2^{w(e)}$

(e) $w_5(e) = 1 / w(e)$, assuming all weights are positive

Finally, (f): is the shortest-path tree from a vertex $s$ preserved under $w_1$ (assuming positive weights)?`,
      rubric: [
        'Principle: the MST depends only on the order of weights; strictly increasing maps preserve it',
        '(a) yes, (d) yes, with justification',
        '(b) no in general (negative weights counterexample); yes for positive weights',
        '(c) no: gives a maximum spanning tree; counterexample',
        '(e) no: reverses order on positives; counterexample',
        '(f) no: adding a constant penalizes paths with more edges; counterexample'
      ],
      hints: [
        'Kruskal only ever compares weights. When does a transformation leave every comparison unchanged?',
        'For counterexamples, a triangle almost always suffices.'
      ],
      solution: String.raw`**Principle.** Kruskal's behavior depends only on the sorted order of the edges. If $g$ is strictly increasing on the set of weights that occur, then $g \circ w$ sorts the edges identically, Kruskal outputs the same tree, and since the new weights are still distinct this tree is the unique MST. If $g$ changes the order, a small example usually breaks it.

**(a) Yes.** $t \mapsto t + 7$ is strictly increasing. (Alternatively: every spanning tree gains exactly $7(V-1)$.)

**(b) Not in general.** Triangle with $w(xy) = -3$, $w(yz) = 1$, $w(zx) = 2$: the MST is $\{xy, yz\}$. Squares: $9, 1, 4$; the MST becomes $\{yz, zx\}$. **For positive weights, yes**: $t \mapsto t^2$ is strictly increasing on $(0, \infty)$.

**(c) No.** Negation reverses the order, so Kruskal now builds a *maximum* spanning tree of $w$. Triangle with weights 1, 2, 3: the MST under $w$ is $\{1, 2\}$, under $-w$ it is $\{2, 3\}$ (weights $-2, -3$).

**(d) Yes.** $t \mapsto 2^t$ is strictly increasing on all reals.

**(e) No.** $t \mapsto 1/t$ is strictly decreasing on positives. Same triangle 1, 2, 3: new weights $1, \tfrac12, \tfrac13$, and the MST becomes the edges originally weighted 2 and 3.

**(f) No.** Vertices $s, a, b$ with $w(sa) = 1$, $w(ab) = 1$, $w(sb) = 3$. The shortest path to $b$ is $s, a, b$ (length 2 < 3). After adding 7: $s, a, b$ has length 16 while $sb$ has length 10, so the shortest-path tree changes. Paths with more edges are penalized more, unlike spanning trees, which all have exactly $V - 1$ edges.`
    },
    {
      id: 'mst-ties-some-every', type: 'written', title: 'Edges in some MST and in every MST', difficulty: 3,
      prompt: String.raw`Let $G$ be connected with real weights that **may be tied**. For a weight $x$, let $G_{<x}$ and $G_{\le x}$ denote the subgraphs of edges with weight $< x$ and $\le x$ respectively. Let $e = uv$ with $w(e) = x$, $u \ne v$.

(a) Prove: $e$ belongs to **some** MST $\iff$ $u$ and $v$ are in different components of $G_{<x}$.

(b) Prove: $e$ belongs to **every** MST $\iff$ $u$ and $v$ are in different components of $G_{\le x} - e$.

(c) Give $O(V + E)$-time algorithms for both tests.`,
      rubric: [
        '(a ⇐) component S of u in G_<x gives a cut on which e is a lightest edge; exchange shows some MST contains e',
        '(a ⇒) a lighter u–v path crosses the cut created by removing e from an MST; swap gives a lighter tree',
        '(b ⇐) an MST without e: the tree path from u to v leaves the component of u in G_≤x − e through an edge heavier than x; swapping in e is strictly better: contradiction',
        '(b ⇒) a u–v path of edges ≤ x avoiding e lets you swap e out of any MST containing it without increasing weight',
        '(c) one whatever-first search in the appropriate subgraph for each test'
      ],
      hints: [
        'Both parts are exchange arguments. Track carefully whether each inequality is strict.',
        'For (b), if no MST contains e at all, then "e is in every MST" is false trivially; otherwise start from an MST containing e.'
      ],
      solution: String.raw`**(a) ($\Leftarrow$)** Let $S$ be the component of $u$ in $G_{<x}$; then $v \notin S$. Every edge leaving $S$ has weight $\ge x$ (a lighter one would be inside $G_{<x}$ and would extend $S$). So $e$ is *a* lightest edge across the cut $(S, V \setminus S)$. Let $T$ be any MST; if $e \in T$ we are done. Otherwise the $T$-path from $u$ to $v$ crosses the cut at some edge $f \ne e$ with $w(f) \ge x$. $T - f + e$ is a spanning tree of weight $\le w(T)$, hence an MST containing $e$.

**($\Rightarrow$)** Suppose a $u$-$v$ path $P$ in $G_{<x}$ exists, yet some MST $T$ contains $e$. Removing $e$ from $T$ leaves two components with $u$ and $v$ on different sides. $P$ must cross between them using some edge $f$ with $w(f) < x$. Then $T - e + f$ is a spanning tree lighter than $T$: contradiction. So no MST contains $e$.

**(b) ($\Leftarrow$)** Let $S$ be the component of $u$ in $G_{\le x} - e$, so $v \notin S$. Suppose some MST $T$ does not contain $e$. Its path from $u$ to $v$ leaves $S$ through some edge $f$. Since $f$ has an endpoint outside $S$, $f$ is not an edge of $G_{\le x} - e$; and $f \ne e$ because $e \notin T$. So $w(f) > x$. Then $T - f + e$ is a spanning tree strictly lighter than $T$: contradiction. Hence every MST contains $e$.

**($\Rightarrow$)** Suppose a $u$-$v$ path $P$ in $G_{\le x} - e$ exists. If no MST contains $e$, then $e$ is not in every MST and we are done. Otherwise let $T$ be an MST containing $e$. Removing $e$ splits $T$ into two components separating $u$ from $v$; $P$ crosses them through an edge $f \ne e$ with $w(f) \le x$. Then $T - e + f$ is a spanning tree with weight $\le w(T)$: an MST that avoids $e$. So $e$ is not in every MST.

**(c)** Test (a): whatever-first search from $u$ using only edges of weight $< x$; answer "in some MST" iff $v$ is not reached. Test (b): search from $u$ using edges of weight $\le x$, skipping $e$ itself; answer "in every MST" iff $v$ is not reached. Each is $O(V + E)$.

*Sanity check:* with distinct weights, $G_{\le x} - e = G_{<x}$, so both conditions coincide, matching uniqueness of the MST.`
    },
    {
      id: 'mst-grow-shrink', type: 'written', title: 'Adding and deleting edges and vertices', difficulty: 2,
      prompt: String.raw`$G$ is connected with **distinct** weights, and you are given its MST $T$ (as an adjacency list). Describe and analyze an algorithm for each update, and justify correctness.

(a) A new edge $e = uv$ (with a new distinct weight) is added to $G$. Target: $O(V)$.

(b) A new vertex $z$ is added together with $d$ new edges between $z$ and existing vertices. Target: $O((V + d) \log V)$.

(c) An edge $e$ is deleted from $G$ (assume $G - e$ is still connected). Handle both $e \notin T$ and $e \in T$. Targets: $O(1)$ and $O(V + E)$.`,
      rubric: [
        '(a) Find the u–v path in T, remove the heaviest edge of the cycle formed with e (possibly e); O(V); cycle property justification that no other edge can change',
        '(b) Key claim: the new MST is contained in T ∪ E_z (old non-tree edges remain heaviest on their T-cycles); Kruskal on at most V − 1 + d edges',
        '(c) e not in T: nothing changes; e in T: remove it, label the two sides, add the lightest crossing edge; cut property justification',
        'Running times stated in terms of V, E, d'
      ],
      hints: [
        'Old non-tree edges are each the heaviest edge on the cycle they form with T. Adding things to the graph does not destroy those cycles.',
        'Deleting a tree edge creates one cut. Every other tree edge was the lightest edge across its own cut, and that is unaffected.'
      ],
      solution: String.raw`**Key fact.** For an old non-tree edge $f = xy$, the cycle formed by $f$ and the $T$-path from $x$ to $y$ has $f$ as its heaviest edge (its heaviest edge is not in the MST, and all other edges are in $T$). Adding edges or vertices keeps this cycle, so $f$ stays out of the MST.

**(a)** By the key fact the new MST lies inside $T + e$, which has exactly one cycle: $e$ plus the $T$-path $P$ from $u$ to $v$. Find $P$ with one DFS of $T$ from $u$ ($O(V)$, since $T$ has $V-1$ edges), let $g$ be its heaviest edge. If $w(e) > w(g)$, $T$ is unchanged; otherwise output $T - g + e$. Correctness: the spanning trees of $T + e$ are obtained by deleting one edge of its unique cycle, and the cycle property says the deleted edge must be the heaviest. $O(V)$.

**(b)** By the key fact, the new MST uses only edges of $T \cup E_z$. Run Kruskal on the graph $H = (V \cup \{z\}, T \cup E_z)$, which has at most $V - 1 + d$ edges. The true new MST $T^*$ is a spanning tree of $H$, and every spanning tree of $H$ is a spanning tree of $G + z$, so $T^*$ is the (unique) MST of $H$. Time $O((V + d) \log V)$. (When $d = 1$ the only possible tree is $T$ plus that edge.)

**(c)** If $e \notin T$, then $T$ is still a spanning tree of $G - e$, and it is still minimum since $G - e$ has fewer spanning trees. $O(1)$.

If $e \in T$: remove $e$, splitting $T$ into $A \ni u$ and $B \ni v$; label each vertex by side with one DFS ($O(V)$). Scan all edges for the lightest edge $h$ with one endpoint in $A$ and one in $B$ ($O(E)$). Output $T - e + h$.

Correctness: for any other tree edge $f$, removing $f$ from $T$ defines a cut on which $f$ was the lightest edge in $G$. Deleting $e$ (which lies inside one side of that cut, since $e \in T - f$) does not change the crossing edges, so $f$ is still lightest across that cut and is in the new MST by the cut property. So the new MST contains $T - e$, and its last edge must cross $(A, B)$; by the cut property it is the lightest such edge, $h$. $O(V + E)$.`
    },
    {
      id: 'mst-forced-forbidden', type: 'written', title: 'Spanning trees with required and forbidden edges', difficulty: 2,
      prompt: String.raw`You are given a connected weighted graph $G = (V, E)$, a set $R \subseteq E$ of **required** edges and a set $X \subseteq E$ of **forbidden** edges ($R \cap X = \emptyset$). Describe an $O(E \log V)$ algorithm that finds a minimum-weight spanning tree containing every edge of $R$ and no edge of $X$, or correctly reports that none exists. Prove it correct. (Weights may be tied.)`,
      rubric: [
        'Delete X; check that R is acyclic (union–find); report failure if R has a cycle',
        'Initialize union–find by uniting the endpoints of every edge in R, then run Kruskal on E − X − R',
        'Report failure if the result is not spanning (G − X disconnected)',
        'Correctness: spanning trees containing R correspond to spanning trees of the contracted graph G/R, with weights shifted by the constant w(R); Kruskal with R pre-merged is Kruskal on G/R',
        'Running time O(E log V)'
      ],
      hints: [
        'Forbidden edges are easy: just remove them.',
        'Required edges: imagine contracting each component of R to a single vertex. What does a spanning tree containing R look like after contraction?'
      ],
      solution: String.raw`**Algorithm.**
1. Delete every edge of $X$. Let $G' = G - X$.
2. Initialize union–find on $V$. For each $e = uv \in R$: if $Find(u) = Find(v)$, then $R$ contains a cycle, so report "no such tree"; else $Union(u, v)$.
3. Run Kruskal on the remaining edges $E \setminus (X \cup R)$ in increasing order, adding an edge iff its endpoints are in different sets.
4. If the final structure has more than one set, $G'$ is disconnected: report "no such tree". Otherwise output $R$ plus the edges added in step 3.

**Correctness.** A tree cannot contain a cycle, so if $R$ is cyclic nothing exists. Otherwise $R$ is a forest; let $G'/R$ be the multigraph obtained from $G'$ by contracting each component of $(V, R)$ to a single vertex and deleting the resulting self-loops. Claim: $T \supseteq R$ is a spanning tree of $G'$ iff $T \setminus R$ is a spanning tree of $G'/R$. (Contracting the connected pieces of $R$ preserves connectivity, and edge counts match: $|T \setminus R| = (V - 1) - |R|$ equals the number of contracted vertices minus one, since $(V, R)$ has $V - |R|$ components.) Since $w(T) = w(R) + w(T \setminus R)$ and $w(R)$ is a constant, minimizing $w(T)$ over trees containing $R$ is the same as finding an MST of $G'/R$.

Steps 2-3 are exactly Kruskal on $G'/R$: after step 2 the union–find sets are the contracted vertices, edges inside one set are its deleted self-loops, and Kruskal is correct for any multigraph with any tie-breaking. A spanning tree exists iff $G'/R$ is connected iff $G'$ is connected, which step 4 checks.

**Time.** Sorting $O(E \log V)$; union–find $O(E\,\alpha(V))$. Total $O(E \log V)$.`
    },
    {
      id: 'mst-leaves', type: 'written', title: 'Spanning tree with prescribed leaves', difficulty: 2,
      prompt: String.raw`Let $G = (V, E)$ be a connected weighted graph with $|V| \ge 3$, and let $L \subsetneq V$ be a set of vertices. Describe an efficient algorithm to find a minimum-weight spanning tree in which **every vertex of $L$ is a leaf** (degree exactly 1), or report that none exists. Prove it correct and analyze it.`,
      rubric: [
        'Observation: in such a tree no two L-vertices are adjacent (else they would form a separate component since n >= 3), so each L-vertex attaches to V − L',
        'Removing the L-leaves leaves a spanning tree of G[V − L]; conversely any spanning tree of G[V − L] plus one edge from each L-vertex into V − L works',
        'Algorithm: MST of G[V − L] plus, for each v in L, its lightest edge into V − L',
        'Failure cases: G[V − L] disconnected, or some L-vertex has no neighbor in V − L',
        'Running time O(E log V)'
      ],
      hints: [
        'Delete all vertices of L from a tree in which they are all leaves. What remains?',
        'Can a vertex of L be attached to another vertex of L?'
      ],
      solution: String.raw`Let $K = V \setminus L$ (nonempty).

**Structure.** Let $T$ be a spanning tree in which every vertex of $L$ is a leaf. If two vertices $p, q \in L$ were adjacent in $T$, both would have degree 1, so $\{p, q\}$ would be a whole component of $T$; since $|V| \ge 3$, $T$ would be disconnected. So each $v \in L$ is attached to a vertex of $K$ by its unique tree edge. Removing all of $L$ (leaves) leaves a tree spanning $K$, i.e., a spanning tree of the induced subgraph $G[K]$. Conversely, any spanning tree $T_K$ of $G[K]$ plus one edge from each $v \in L$ to some vertex of $K$ is a spanning tree of $G$ in which every vertex of $L$ is a leaf.

**So** the optimal weight is (MST weight of $G[K]$) $+ \sum_{v \in L} \min\{w(vx) : x \in K\}$, and these terms are independent.

**Algorithm.** Build $G[K]$; compute its MST with Kruskal (if $G[K]$ is disconnected, report failure). For each $v \in L$, scan its edges for the lightest one into $K$ (if none, report failure). Output the union.

**Time.** $O(E \log V)$ for Kruskal plus $O(V + E)$ for the scans.`
    },
    {
      id: 'mst-bottleneck-linear', type: 'written', title: 'Minimum bottleneck spanning tree in linear time', difficulty: 3,
      prompt: String.raw`The *bottleneck* of a spanning tree is its maximum edge weight. Every MST is a minimum bottleneck spanning tree (MBST), so an MBST can be found in $O(E \log V)$ time. Give an $O(V + E)$-time algorithm for a connected graph. You may use the fact that the median of $m$ numbers can be found in $O(m)$ time.`,
      rubric: [
        'Reduces to finding b* = the smallest weight b such that G_≤b is connected, then any spanning tree of G_≤b is an MBST',
        'Split edges at the median: light half L and heavy half H',
        'If (V, L) is connected recurse on it; otherwise contract its components and recurse on the contracted graph with edges H (dropping self-loops)',
        'Correctness of both recursive cases',
        'Analysis: each level is linear, V is O(E) in each (connected) subproblem, edges halve: T(E) = T(E/2) + O(E) = O(E)'
      ],
      hints: [
        'An MBST has bottleneck b*, the smallest b for which the edges of weight at most b already connect G.',
        'Compare b* with the median edge weight. Which half of the edges can you throw away (or contract)?'
      ],
      solution: String.raw`**Reformulation.** Order the edges by $(w, \text{index})$ so all keys are distinct. Let $b^*$ be the smallest key such that the subgraph $G_{\le b^*}$ is connected. Every spanning tree uses some edge with key $\ge b^*$ (otherwise it would lie in a disconnected subgraph), and any spanning tree of $G_{\le b^*}$ has bottleneck exactly $b^*$. So it suffices to find $b^*$; then one whatever-first search of $G_{\le b^*}$ produces an MBST in $O(V + E)$.

**Recursive algorithm** $\mathrm{Bot}(G)$, for a connected multigraph $G$ without self-loops:
- If $G$ has one vertex, return $-\infty$. If $G$ has a single edge, return its key.
- Find the median key in $O(E)$ and split the edges into the lighter half $L$ ($\lceil E/2 \rceil$ edges) and the heavier half $H$.
- Find the components of $(V, L)$ by whatever-first search.
  - If $(V, L)$ is connected: return $\mathrm{Bot}((V, L))$.
  - Otherwise: contract each component of $(V, L)$ to a single vertex, keep the edges of $H$ that join different components, and return $\mathrm{Bot}$ of that contracted graph.

**Correctness.** If $(V, L)$ is connected then $b^* \le \max L$, and for keys $b \le \max L$ we have $G_{\le b} = L_{\le b}$, so the threshold for $G$ equals the threshold for $(V, L)$. If $(V, L)$ is not connected then $b^* > \max L$, so every edge of $L$ belongs to $G_{\le b^*}$; for $b > \max L$, $G_{\le b}$ is connected iff the contracted graph using the edges of $H$ with key $\le b$ is connected. Either way the recursive call returns $b^*$. The recursive graphs are connected (connectivity is preserved by contraction), so the base cases and assumptions hold.

**Time.** Each call does $O(V + E)$ work on its current graph. Because the graph is connected, $V \le E + 1$, so the work is $O(E)$. Each call recurses on at most $\lceil E/2 \rceil$ edges, so $T(E) \le T(\lceil E/2 \rceil) + O(E) = O(E)$. Adding the final search, the total is $O(V + E)$.`
    },
    {
      id: 'mst-few-weights', type: 'written', title: 'MST with few distinct weights', difficulty: 2,
      prompt: String.raw`Let $G$ be connected with $V$ vertices and $E$ edges.

(a) Every weight is an integer in $\{1, 2, \dots, W\}$. Give an $O(E\,\alpha(V) + W)$ algorithm.

(b) The weights are arbitrary reals, but only $k$ distinct values occur (you are not told which). Give an $O(E \log k + E\,\alpha(V))$ algorithm.

(c) Explain why both algorithms are correct even though many weights are tied.`,
      rubric: [
        '(a) Counting/bucket sort in O(E + W), then the Kruskal scan with union–find',
        '(b) Build a balanced BST (or sorted array via sorting the distinct values) of the k distinct values in O(E log k); bucket edges by value; scan buckets in order',
        '(c) Kruskal is correct for any order consistent with the weights, i.e., any tie-breaking',
        'Running time accounting (union–find O(E α(V)))'
      ],
      hints: [
        'Kruskal needs the edges in sorted order, nothing more.',
        'Sorting E items that take only k distinct values can be done with about E log k comparisons.'
      ],
      solution: String.raw`**(a)** Create buckets $1..W$, drop each edge into the bucket of its weight ($O(E + W)$), and concatenate the buckets: a sorted edge list. Then run the Kruskal scan with union by rank and path compression: $O(E\,\alpha(V))$. Total $O(E\,\alpha(V) + W)$.

**(b)** Insert each edge's weight into a balanced binary search tree that stores each distinct value once, with a list of edges attached to it. The tree never holds more than $k$ keys, so each insertion is $O(\log k)$, for $O(E \log k)$ total. An in-order traversal lists the buckets in increasing order in $O(k + E)$. Then run the Kruskal scan: $O(E\,\alpha(V))$. Total $O(E \log k + E\,\alpha(V))$.

**(c)** Kruskal's correctness proof only needs that, when an edge $uv$ is examined, no edge strictly lighter than $uv$ leaves $u$'s component. Any order that is non-decreasing in weight guarantees this, so $uv$ is *a* lightest edge leaving that component $C$. Induction: suppose the current forest $F$ lies inside some MST $M$. If $uv \notin M$, the $M$-path from $u$ to $v$ leaves $C$ through some edge $e'$; $e' \notin F$ (edges of $F$ do not leave components of $F$) and $w(e') \ge w(uv)$. Then $M - e' + uv$ is an MST containing $F + uv$. So the forest always lies inside some MST, and at the end it *is* an MST. Hence Kruskal returns an MST for every tie-breaking order, in particular for the arbitrary order inside each bucket.`
    },
    {
      id: 'mst-boruvka-analysis', type: 'written', title: 'Analyzing Borůvka', difficulty: 2,
      prompt: String.raw`Consider Borůvka's algorithm on a connected graph with $V$ vertices and **distinct** weights.

(a) Prove that the edges added in one round never form a cycle.

(b) Prove that the number of components at least halves each round, and conclude a bound of $O(E \log V)$.

(c) Show that the bound on the number of rounds is tight: for every $V = 2^j$, describe a graph on which Borůvka needs exactly $j$ rounds.

(d) Show by example that with **tied** weights and arbitrary tie-breaking, one round can create a cycle.`,
      rubric: [
        '(a) Every chosen edge is safe, hence in the unique MST, which is acyclic',
        '(b) Each component chooses an edge to another component, so every new component contains at least two old ones; O(log V) rounds of O(V + E)',
        '(c) A path with weights arranged by the 2-adic valuation of the edge index (or an equivalent construction) so that each round exactly pairs up neighboring blocks',
        '(d) Triangle with equal weights, each vertex choosing a different edge'
      ],
      hints: [
        'Use the cut property for (a).',
        'For (c), use a path. Make the edges that should be chosen in round r lighter than all edges chosen later.'
      ],
      solution: String.raw`**(a)** Each chosen edge is the lightest edge leaving some component, hence safe, hence in the unique MST by the cut property. All chosen edges lie in one tree, so they cannot form a cycle.

**(b)** Every component (when there are at least two) chooses an edge to a different component, so after adding the chosen edges no old component is alone: each new component contains at least two old ones. So $c$ components become at most $c/2$. Starting from $V$, after $\lceil \log_2 V \rceil$ rounds one component remains. Each round is $O(V + E)$ (labeling plus one edge scan) and $V = O(E)$ for connected graphs, so the total is $O(E \log V)$.

**(c)** Take the path $v_1, v_2, \dots, v_n$ with $n = 2^j$, and edges $e_i = v_i v_{i+1}$ for $1 \le i < n$. Let $t(i)$ be the exponent of the largest power of 2 dividing $i$, and set $w(e_i) = n \cdot t(i) + i$. Weights are distinct, and edges with smaller $t$ are always lighter.

*Claim:* before round $r$ (starting at $r = 1$), the components are the $n/2^{r-1}$ blocks of $2^{r-1}$ consecutive vertices. The edges between blocks are exactly the $e_i$ with $i$ a multiple of $2^{r-1}$. A block has at most two such edges, $e_a$ and $e_b$ with $b = a + 2^{r-1}$; exactly one of $a/2^{r-1}$ and $b/2^{r-1}$ is odd, so exactly one of them has $t = r - 1$ while the other has $t \ge r$ and is heavier. (End blocks have only one outgoing edge, which is the one with $t = r - 1$ for the first block and the last block alike, since $2^{r-1}$ and $n - 2^{r-1}$ are odd multiples of $2^{r-1}$ when $r \le j$.) So every block selects its edge with index an odd multiple of $2^{r-1}$, and these edges pair the blocks up into blocks of size $2^r$. By induction the number of components exactly halves each round, so Borůvka needs exactly $j = \log_2 V$ rounds.

**(d)** Triangle $a, b, c$ with all weights 1. If $a$ chooses $ab$, $b$ chooses $bc$ and $c$ chooses $ca$, all three edges are added and form a cycle. Breaking ties consistently by edge index prevents this, because then the choices are the safe edges of a distinct-weight instance.`
    },
    {
      id: 'mst-union-find', type: 'written', title: 'Union–find under the microscope', difficulty: 2,
      prompt: String.raw`(a) Union by rank, no path compression: prove that a root of rank $r$ has at least $2^r$ nodes in its tree, and deduce that Find takes $O(\log n)$ time.

(b) Naive union (always make the root of the first argument a child of the root of the second, no ranks, no compression): give a sequence of $O(n)$ operations on $n$ elements that takes $\Theta(n^2)$ time.

(c) Kruskal is run on a connected graph with $V$ vertices and $E$ edges. Exactly how many Union operations does it perform, and at most how many Finds?

(d) What is Kruskal's running time with union by rank but without path compression, and why does it not matter much?`,
      rubric: [
        '(a) Induction: rank increases only when linking two equal-rank roots; size doubles; height ≤ rank ≤ log2 n',
        '(b) Chain Union(v1,v2), Union(v2,v3), ..., then n Finds on v1, each Θ(n)',
        '(c) V − 1 Unions; at most 2E Finds',
        '(d) O(E log V) for the Finds, same as the sorting cost, so the total stays O(E log V)'
      ],
      hints: ['When exactly does a root\'s rank increase?'],
      solution: String.raw`**(a)** Induction over operations. Initially every root has rank 0 and 1 node. Linking a root of smaller rank under one of larger rank leaves all ranks unchanged and only increases sizes. Linking two roots of equal rank $r$ makes one the child of the other, whose rank becomes $r + 1$; its tree now has at least $2^r + 2^r = 2^{r+1}$ nodes. So a rank-$r$ root has $\ge 2^r$ nodes, which forces $r \le \log_2 n$. Without compression, the height of each tree equals its root's rank (height increases only in the equal-rank case, by exactly one). A Find walks at most the height, so it costs $O(\log n)$.

**(b)** Perform $Union(v_1, v_2), Union(v_2, v_3), \dots, Union(v_{n-1}, v_n)$. In $Union(v_i, v_{i+1})$, $v_i$ is still a root (only $v_{i-1}$ points to it) and $v_{i+1}$ is a singleton, so each costs $O(1)$ and makes $v_i$ a child of $v_{i+1}$. The result is the path $v_1 \to v_2 \to \dots \to v_n$. Now $n$ calls of $Find(v_1)$ each walk $n - 1$ pointers: $\Theta(n^2)$ total for $2n - 1$ operations.

**(c)** Each Union adds one tree edge, so exactly $V - 1$ Unions. Each examined edge needs two Finds, so at most $2E$ Finds (fewer if Kruskal stops once $V - 1$ edges are chosen).

**(d)** $2E$ Finds at $O(\log V)$ each: $O(E \log V)$, plus $O(V)$ for the Unions. Sorting already costs $O(E \log V)$, so the total is still $O(E \log V)$. Path compression matters only when the edges are presorted (or sortable in linear time), where it brings Kruskal down to $O(E\,\alpha(V))$.`
    },
    {
      id: 'mst-clustering', type: 'written', title: 'Clustering with maximum spacing', difficulty: 2,
      prompt: String.raw`You are given $n$ objects and a distance $d(p, q) \ge 0$ for every pair. A $k$-clustering is a partition of the objects into $k$ nonempty groups; its **spacing** is the minimum distance between two objects in different groups. Describe an algorithm that finds a $k$-clustering of maximum spacing, prove that it is optimal, and analyze its running time.`,
      rubric: [
        'Algorithm: Kruskal on the complete graph, stopped when k components remain (equivalently, delete the k − 1 heaviest MST edges)',
        'Shows the spacing of the output equals d*, the next edge Kruskal would add',
        'For any other k-clustering, finds two objects together in Kruskal\'s clustering but separated in the other',
        'Uses the Kruskal path between them (edges ≤ d*) to show the other clustering has spacing ≤ d*',
        'Running time O(n^2 log n)'
      ],
      hints: [
        'Think of single-linkage clustering: repeatedly merge the two closest clusters.',
        'For optimality, compare with an arbitrary other k-clustering and use a path of Kruskal edges.'
      ],
      solution: String.raw`**Algorithm.** Form the complete graph on the objects with weights $d(p, q)$. Run Kruskal, merging components, and stop as soon as exactly $k$ components remain. Output them. (Equivalently: compute an MST and delete its $k - 1$ heaviest edges; the components of what is left are the clusters.)

**Spacing of the output.** Let $d^*$ be the weight of the next edge Kruskal would add (the first remaining edge whose endpoints are in different clusters). Every pair in different clusters has not yet been examined or is examined at or after that point in sorted order, so its distance is $\ge d^*$, and the pair of that next edge achieves $d^*$. So the spacing is exactly $d^*$.

**Optimality.** Let $\mathcal C'$ be any $k$-clustering different from Kruskal's clustering $\mathcal C$. If every cluster of $\mathcal C$ were contained in some cluster of $\mathcal C'$, then $\mathcal C$ would refine $\mathcal C'$; with the same number $k$ of parts, they would be equal. So some cluster of $\mathcal C$ contains objects $p, q$ in different clusters of $\mathcal C'$. Within that cluster, Kruskal connected $p$ and $q$ by a path of added edges, each of weight at most $d^*$ (all added before the stopping point). Walking along the path from $p$'s $\mathcal C'$-cluster we must at some step move to a different $\mathcal C'$-cluster; that step is a pair at distance $\le d^*$ in different $\mathcal C'$-clusters. Hence spacing($\mathcal C'$) $\le d^*$.

**Time.** $\binom{n}{2}$ edges: sorting is $O(n^2 \log n)$ and union–find is $O(n^2\,\alpha(n))$. (Jarník with an array, $O(n^2)$, followed by deleting the $k-1$ heaviest MST edges is also fine.)`
    },
    {
      id: 'mst-reverse-delete', type: 'written', title: 'The reverse-delete algorithm', difficulty: 2,
      prompt: String.raw`**Reverse-delete:** start with $H = G$ (connected, distinct weights). Examine the edges in **decreasing** order of weight; when examining $e$, delete it from $H$ if $H - e$ is still connected. Prove that the final $H$ is the MST, and analyze a straightforward implementation.`,
      rubric: [
        'Invariant: H is connected and contains the MST T',
        'A deleted edge e lies on a cycle of H whose other edges are all lighter (heavier edges still in H were bridges when examined, and remain bridges), so e is not in T by the cycle property',
        'Termination: the final H is acyclic (the heaviest edge of any remaining cycle would have been deleted), hence a spanning tree containing T, hence equal to T',
        'Running time O(E log E + E(V + E)) with a connectivity search per edge'
      ],
      hints: [
        'Show that every deleted edge is the heaviest edge on some cycle.',
        'An edge that was kept was a bridge of H at the time. Can it ever stop being a bridge as H loses edges?'
      ],
      solution: String.raw`Let $T$ be the MST. **Invariant:** $H$ is connected and $T \subseteq H$. It holds initially.

*Deleting preserves it.* Suppose $e$ is deleted, so $H - e$ is connected and $e$ lies on some cycle $C$ of $H$. Every edge heavier than $e$ was examined earlier; any such edge still in $H$ was kept because removing it would have disconnected $H$ at that time, i.e., it was a bridge. $H$ has only lost edges since then, so it is still a bridge (removing edges cannot create new paths), and a bridge lies on no cycle. Hence every other edge of $C$ is lighter than $e$; $e$ is the heaviest edge on $C$ and by the cycle property $e \notin T$. Deleting it keeps $T \subseteq H$, and connectivity is checked explicitly.

*Final $H$ is a tree.* Suppose $H$ still had a cycle $C$ at the end, with heaviest edge $e$. When $e$ was examined, all edges of $C$ were present (edges are never added), so $H - e$ was connected and $e$ would have been deleted. Contradiction. So the final $H$ is connected and acyclic: a spanning tree containing $T$. Both have $V - 1$ edges, so $H = T$. ∎

**Time.** Sort in $O(E \log E)$. For each edge, one whatever-first search tests whether $H - e$ is connected: $O(V + E)$ each, so $O(E(V + E))$ in total. (Much slower than Kruskal, but a good exercise in using the cycle property.)`
    },
    {
      id: 'mst-vs-spt', type: 'written', title: 'MSTs versus shortest-path trees', difficulty: 2,
      prompt: String.raw`Let $G$ be connected with **positive distinct** weights and let $s$ be a vertex. Let $T$ be the MST and $S$ a shortest-path tree rooted at $s$.

(a) Prove that $T$ and $S$ always share at least one edge.

(b) Prove or disprove: if all edge weights are equal, every BFS tree from $s$ is both an MST and a shortest-path tree.

(c) Show that $w(S)$ can be $\Theta(V)$ times larger than $w(T)$.

(d) Show that for some vertex $v$, the length of the $s$–$v$ path in $T$ can be $\Theta(V)$ times larger than $dist(s, v)$.`,
      rubric: [
        '(a) The lightest edge sv at s is in T (cut property) and is the unique shortest s–v path (positive weights), so it is in S',
        '(b) True: all spanning trees have equal weight; BFS distances are shortest paths in unit-weight graphs',
        '(c) Correct family: e.g., a star of heavy edges from s plus a light path among the leaves',
        '(d) Correct family: e.g., a cycle whose one heavy edge is excluded from the MST'
      ],
      hints: [
        'For (a), look at the edges incident to s.',
        'For (c) and (d), you may first find an example with equal weights and then perturb slightly to make the weights distinct.'
      ],
      solution: String.raw`**(a)** Let $sv$ be the lightest edge incident to $s$. It is the lightest edge crossing $(\{s\}, V \setminus \{s\})$, so $sv \in T$. Any $s$-$v$ path other than the single edge $sv$ begins with a different edge at $s$, of weight $> w(sv)$, and all weights are positive, so it is strictly longer than $w(sv)$. Hence the edge $sv$ is the unique shortest path to $v$, and any shortest-path tree contains it.

**(b) True.** With all weights equal to $c$, every spanning tree weighs $c(V - 1)$, so every spanning tree is an MST. A BFS tree from $s$ contains, for each $v$, a path with the fewest edges, which is a shortest path when all weights are equal. So a BFS tree is both.

**(c)** Vertices $s, v_1, \dots, v_n$. Edges $s v_i$ with weight $n + i/n$, and path edges $v_i v_{i+1}$ with weight $1 + i/n^2$. Weights are distinct and positive. MST: the path edges are the $n - 1$ lightest edges and form a tree on $v_1..v_n$; then the lightest star edge $s v_1$ connects $s$. So $w(T) < (n - 1)(1 + 1/n) + n + 1 = O(n)$. Shortest paths: any path from $s$ to $v_i$ starts with a star edge $s v_j$; if $j = i$ that's the whole path; if $j > i$ the star edge alone already weighs more than $w(s v_i)$; if $j < i$ the path needs at least $i - j$ path edges of weight $\ge 1 > (i - j)/n$. So $s v_i$ is the unique shortest path, and $S$ is the star with $w(S) > n^2$. Ratio $\Theta(n) = \Theta(V)$.

**(d)** A cycle $s = u_0, u_1, \dots, u_{n-1}, u_0$: edges $u_i u_{i+1}$ ($0 \le i \le n - 2$) with weight $1 + i/n^2$, and the closing edge $u_{n-1} s$ with weight 2. The closing edge is the heaviest on the only cycle, so the MST is the path $u_0, u_1, \dots, u_{n-1}$. The MST path from $s$ to $u_{n-1}$ has length more than $n - 1$, while $dist(s, u_{n-1}) \le 2$. Ratio $\Theta(V)$.`
    },
    {
      id: 'mst-wells', type: 'written', title: 'Wells and pipes', difficulty: 2,
      prompt: String.raw`There are $n$ villages. Drilling a well in village $v$ costs $c(v) > 0$. For certain pairs of villages a pipe can be laid between them at cost $w(uv) > 0$; these pairs form an undirected graph $G = (V, E)$, which need **not** be connected. A village has water if it has a well, or if it is connected through laid pipes to a village that has a well. Describe and analyze an algorithm that finds a cheapest plan (a set of wells and a set of pipes) that gives every village water, and prove it correct.`,
      rubric: [
        'Adds a virtual vertex z and an edge zv of weight c(v) for every village v',
        'Spanning tree of G + z ⇒ feasible plan of the same cost (wells = edges at z, pipes = the other edges)',
        'Feasible plan ⇒ connected spanning subgraph of G + z of the same cost, which contains a spanning tree of no greater cost (positive weights)',
        'Concludes optimum = MST of G + z; running time O((V + E) log V)'
      ],
      hints: [
        'Think of "the groundwater" as one extra vertex that every village can connect to.',
        'A well at v is just a pipe from v to that extra vertex, with cost c(v).'
      ],
      solution: String.raw`**Construction.** Let $G^*$ be $G$ plus a new vertex $z$ and an edge $zv$ of weight $c(v)$ for every village $v$. $G^*$ is connected (every village is adjacent to $z$). Compute an MST $T^*$ of $G^*$ with Kruskal; build a well at every $v$ with $zv \in T^*$ and lay every pipe in $T^* \cap E$.

**Spanning trees give plans.** Let $T$ be any spanning tree of $G^*$. For a village $v$, the $T$-path from $v$ to $z$ visits $z$ only at its end, so all its edges except the last are pipes, and the last edge is $zu$ for a village $u$ with a well. So $v$ is connected by pipes to a well: the plan is feasible, and its cost is exactly $w(T)$.

**Plans give connected subgraphs.** Conversely let (wells $W$, pipes $P$) be a feasible plan, and let $S = P \cup \{zu : u \in W\}$, a subgraph of $G^*$ of the same cost. Every village is connected through $P$ to some $u \in W$, which is adjacent to $z$ in $S$; so $S$ is connected and spans $G^*$. It contains a spanning tree (delete edges on cycles until none remain), whose cost is at most $cost(S)$ because all weights are positive. Hence $cost(\text{plan}) \ge w(\text{MST of } G^*)$.

Together: the cheapest plan costs exactly $w(T^*)$, and $T^*$ itself describes one.

**Time.** $G^*$ has $V + 1$ vertices and $E + V$ edges: $O((V + E) \log V)$.

*Why not "MST of $G$, then the cheapest well in each component"?* Several wells inside one component can beat long pipes: two villages joined by a pipe of cost 100, each with a well of cost 1. The optimal plan is two wells (cost 2); the MST-first plan costs 101.`
    },
    {
      id: 'mst-characterize', type: 'written', title: 'Three ways to say "e is in the MST"', difficulty: 2,
      prompt: String.raw`Let $G$ be a connected graph with **distinct** edge weights and MST $T$. For an edge $e$, prove that the following are equivalent:

(i) $e \in T$;

(ii) $e$ is the lightest edge crossing some cut $(S, V \setminus S)$;

(iii) $e$ is not the heaviest edge on any cycle of $G$.

Finally, (iv): show by example that with **tied** weights an edge can belong to some MST even though it is a heaviest edge on some cycle.`,
      rubric: [
        '(ii) ⇒ (i) via the cut property (or its exchange proof)',
        '(i) ⇒ (ii): the cut given by the two components of T − e, with an exchange argument',
        '(i) ⇒ (iii): contrapositive of the cycle property',
        '(iii) ⇒ (i): contrapositive using the fundamental cycle of e in T + e, showing all its other edges are lighter',
        '(iv) Correct tied example'
      ],
      hints: [
        'For a tree edge, delete it from T. Which cut appears, and why must e be the lightest edge across it?',
        'For a non-tree edge, add it to T. Which cycle appears, and how do its other edges compare with e?'
      ],
      solution: String.raw`**(ii) ⇒ (i).** This is the cut property: if $e$ is the lightest edge crossing $(S, V\setminus S)$, then $e \in T$.

**(i) ⇒ (ii).** Let $e \in T$. Removing $e$ from $T$ leaves two components $A$ and $B = V \setminus A$, and $e$ crosses the cut $(A, B)$. Suppose some other edge $f$ crossing $(A, B)$ had $w(f) < w(e)$. Then $T - e + f$ is connected (it joins $A$ and $B$ again) and has $V - 1$ edges, so it is a spanning tree, and it is lighter than $T$: a contradiction. With distinct weights, $e$ is the lightest edge crossing $(A, B)$.

**(i) ⇒ (iii).** Contrapositive: if $e$ is the heaviest edge on some cycle, the cycle property says $e \notin T$.

**(iii) ⇒ (i).** Contrapositive: suppose $e = uv \notin T$. The tree path $P$ from $u$ to $v$ together with $e$ forms a cycle $C$. Let $f$ be any edge of $P$. Then $f$ lies on the unique cycle of $T + e$, so $T + e - f$ is a spanning tree; since $T$ is minimum, $w(T) + w(e) - w(f) \ge w(T)$, i.e. $w(f) \le w(e)$, and by distinctness $w(f) < w(e)$. So $e$ is the heaviest edge on $C$, i.e. (iii) fails.

**(iv)** Triangle with all three weights equal to 1. Each edge lies in some MST (any two edges form one), yet each is a heaviest (tied) edge on the triangle. With ties, the correct statement is: an edge that is the **unique** heaviest on some cycle is in **no** MST.`
    },
    {
      id: 'mst-sensitivity', type: 'written', title: 'How far can a weight move?', difficulty: 3,
      prompt: String.raw`Let $G$ be connected with distinct weights and MST $T$. Only one edge's weight changes at a time, and weights stay distinct.

(a) For a non-tree edge $f = uv$, let $\max_T(u, v)$ be the heaviest weight on the $T$-path between $u$ and $v$. Prove that $T$ remains the MST if and only if the new weight of $f$ is greater than $\max_T(u, v)$.

(b) For a tree edge $e$, let $A, B$ be the two components of $T - e$, and let $r(e)$ be the minimum weight of a non-tree edge crossing $(A, B)$ ($\infty$ if there is none). Prove that $T$ remains the MST if and only if the new weight of $e$ is less than $r(e)$.

(c) Describe an algorithm that computes $\max_T(u, v)$ for every non-tree edge and $r(e)$ for every tree edge in $O(VE)$ time.`,
      rubric: [
        'Uses the criterion: T is the MST iff every tree edge g is the lightest edge crossing the cut of T − g',
        '(a) Observes that f crosses the cut of T − g exactly when g is on the T-path from u to v; proves both directions (explicit lighter tree T − g + f when the new weight is smaller)',
        '(b) Observes that changing w(e) affects only the cut of T − e; proves both directions (explicit lighter tree T − e + f otherwise)',
        '(c) A search of T from every vertex gives all path maxima in O(V^2); walking each non-tree edge\'s tree path gives every r(e) in O(VE)'
      ],
      hints: [
        'With distinct weights, T is the MST iff every tree edge g is the lightest edge across the cut defined by T − g. Changing one weight changes only some of these comparisons. Which ones?',
        'A non-tree edge uv crosses the cut of T − g exactly when g lies on the T-path between u and v.'
      ],
      solution: String.raw`**Criterion.** With distinct weights, a spanning tree $T$ is the MST iff for every $g \in T$, $g$ is the lightest edge crossing the cut $C_g$ formed by the two components of $T - g$. ($\Rightarrow$ was shown by the exchange $T - g + f$; $\Leftarrow$ is the cut property applied to each of the $V - 1$ tree edges.) A non-tree edge $f = uv$ crosses $C_g$ exactly when $g$ lies on the $T$-path between $u$ and $v$ (removing $g$ separates $u$ from $v$ iff the unique path uses $g$).

**(a)** Changing $w(f)$ only affects the comparisons in the cuts $C_g$ that $f$ crosses, i.e. for the tree edges $g$ on the $u$-$v$ path. If the new weight $w'$ exceeds $\max_T(u,v)$, every such $g$ is still lighter than $f$, all other comparisons are unchanged, and by the criterion $T$ is still the MST. If $w' < \max_T(u,v) = w(g)$ for the heaviest path edge $g$, then $T - g + f$ is a spanning tree (we removed an edge of the cycle $T + f$) lighter than $T$, so $T$ is no longer the MST; the new MST is exactly $T - g + f$.

**(b)** The edge $e$ lies inside one component of $T - g$ for every other tree edge $g$, so changing $w(e)$ does not affect any cut $C_g$ with $g \ne e$. In $C_e$, the crossing edges are $e$ and the non-tree edges counted in $r(e)$ (no other tree edge crosses it). If the new weight is below $r(e)$, $e$ is still the lightest edge across $C_e$, so by the criterion $T$ is the MST. If it is above $r(e)$, attained by the non-tree edge $f$, then $T - e + f$ is a lighter spanning tree, and it is the new MST. (If $e$ is a bridge, $r(e) = \infty$ and $e$ stays forever.)

**(c)** *Path maxima.* For every vertex $x$, run a whatever-first search of the tree $T$ from $x$, recording for each $y$ the maximum weight on the path from $x$ to $y$ ($M[x][y] = \max(M[x][parent(y)], w(parent(y)\,y))$). Each search is $O(V)$, so all pairs take $O(V^2)$; then each non-tree edge $uv$ reads $M[u][v]$ in $O(1)$.

*Replacement weights.* Root $T$ and compute depths and parents. Initialize $r(e) = \infty$. For each non-tree edge $f = uv$, walk from $u$ and $v$ toward the root, always advancing the deeper endpoint, until they meet; this lists the tree path between $u$ and $v$ in $O(V)$ time, and for each tree edge $g$ on it set $r(g) \leftarrow \min(r(g), w(f))$. By the observation above, $r(g)$ ends as the minimum over exactly the non-tree edges crossing $C_g$. Time $O(VE)$.

Total $O(V^2 + VE) = O(VE)$ since $E \ge V - 1$. (Faster methods exist, but this is what an exam expects.)`
    },
    {
      id: 'mst-fewest-red', type: 'written', title: 'The MST with the fewest red edges', difficulty: 3,
      prompt: String.raw`Each edge of a connected graph $G$ has a weight $w(e)$ (ties allowed) and a color, red or blue. Among **all** minimum spanning trees of $G$, we want one with the fewest red edges.

(a) Describe an $O(E \log V)$ algorithm.

(b) Prove it correct.

(c) Use the same idea to decide, for a given edge $e$, whether some MST contains $e$, and to produce one if so.`,
      rubric: [
        'Algorithm: Kruskal with ties in weight broken blue before red; O(E log V)',
        'Proof idea: perturbed weights w + ε·[red] with ε small enough (or lexicographic weights), so the algorithm is Kruskal for the perturbed weights',
        'Shows the output is an MST for the original weights (the perturbation is smaller than any positive gap between spanning-tree weights)',
        'Shows it has the fewest red edges among all MSTs',
        '(c) Put e first among the edges of its weight; e is in some MST iff Kruskal then picks it'
      ],
      hints: [
        'Kruskal returns an MST however ties are broken. Which tie-breaking rule favors blue edges?',
        'For the proof, imagine adding a tiny ε to the weight of every red edge. How small must ε be so that no genuine weight difference is overturned?'
      ],
      solution: String.raw`**(a) Algorithm.** Sort the edges by the pair $(w(e), red(e))$, where $red(e) = 1$ for red and $0$ for blue, and run Kruskal. In words: among equal weights, consider blue edges first. Time $O(E \log V)$.

**(b) Proof.** Let $red(T)$ be the number of red edges of a tree $T$. There are finitely many spanning trees, so there is a $\delta > 0$ smaller than every **positive** difference $|w(T_1) - w(T_2)|$ between weights of spanning trees and smaller than every positive difference between two edge weights. Let $\varepsilon = \delta / V$ and define $w'(e) = w(e) + \varepsilon \cdot red(e)$. (The algorithm never computes $\varepsilon$; it exists only for the proof.)

1. *The algorithm is Kruskal for $w'$.* If $w(e_1) < w(e_2)$, then $w(e_2) - w(e_1) \ge \delta > \varepsilon$, so $w'(e_1) < w'(e_2)$; if $w(e_1) = w(e_2)$, a blue $e_1$ has the smaller $w'$. So our order is a sorted order for $w'$, and since Kruskal returns an MST for any tie-breaking, the output $K$ is an MST for $w'$.
2. *$K$ is an MST for $w$.* For any spanning tree $T$, $w'(T) = w(T) + \varepsilon\, red(T)$ with $0 \le \varepsilon\, red(T) \le \varepsilon (V - 1) < \delta$. Let $M$ be any $w$-MST. From $w'(K) \le w'(M)$: $w(K) - w(M) \le \varepsilon(red(M) - red(K)) < \delta$. Also $w(K) \ge w(M)$, and a positive difference would be at least $\delta$, so $w(K) = w(M)$.
3. *$K$ has the fewest reds among MSTs.* With $w(K) = w(M)$, the inequality $w'(K) \le w'(M)$ becomes $red(K) \le red(M)$, for every MST $M$. ∎

(Equivalently: weights $(w(e), red(e))$ in a lexicographically ordered group; the cut-property and Kruskal proofs only use comparisons and sums, so Kruskal minimizes $(w(T), red(T))$ lexicographically.)

**(c)** Treat every edge other than $e$ as "red" and $e$ as "blue", i.e. put $e$ first among the edges of weight $w(e)$, and run Kruskal. By (b) the output $K$ is an MST maximizing the number of "blue" edges, i.e. containing $e$ whenever some MST does. So $e$ is in some MST iff $e \in K$. (This agrees with the direct test: $e = uv$ is in some MST iff $u$ and $v$ are not connected by edges strictly lighter than $w(e)$; with $e$ first in its weight class, Kruskal examines $e$ exactly when only the lighter edges have been processed.)`
    },
    {
      id: 'mst-prim-proof', type: 'written', title: "Proving Jarník's algorithm, and breaking it", difficulty: 2,
      prompt: String.raw`(a) Prove that Jarník's (Prim's) algorithm outputs the MST of a connected graph with distinct weights. State the invariants explicitly (what the tree is, and what the keys mean).

(b) Show by example that the sequence of keys extracted by Jarník's algorithm need not be nondecreasing, unlike in Dijkstra's algorithm.

(c) A student changes the update rule to $key(v) \leftarrow \min(key(v),\ key(u) + w(uv))$ when $u$ is extracted. What does the modified algorithm compute? Give a small graph on which its output is not an MST.`,
      rubric: [
        '(a) Invariant 1: the current tree (vertex set S) is a subgraph of the MST; Invariant 2: key(v) = min weight of an edge from v to S',
        '(a) The extracted vertex attaches by the lightest edge crossing (S, V − S), so the cut property applies; connectivity ensures progress; V − 1 edges at the end ⇒ the MST',
        '(b) Concrete example with a decreasing extracted key',
        '(c) Identifies Dijkstra (a shortest-path tree) and gives a concrete graph where it is not an MST'
      ],
      hints: [
        'The vertices already in the tree define a cut. Which edge crossing it does the algorithm add?',
        'For (c): after the change, what does key(v) mean in words?'
      ],
      solution: String.raw`**(a)** Let $S$ be the set of vertices already extracted and $T_S$ the edges chosen so far ($parent(v)\,v$ for $v \in S \setminus \{s\}$). Invariants, before each extraction:
1. $T_S$ is a tree on $S$ and $T_S \subseteq M$, the (unique) MST.
2. For every $v \notin S$: $key(v) = \min\{w(uv) : u \in S\}$ (or $\infty$), and $parent(v)$ attains it.

Initially $S = \emptyset$, $key(s) = 0$, and the first extraction just puts $s$ in $S$. When $x \notin S$ is extracted with minimum key, by invariant 2 the edge $parent(x)\,x$ is a lightest edge with one endpoint in $S$ and the other outside, i.e. the lightest edge crossing the cut $(S, V \setminus S)$ (the minimum over $v \notin S$ of the minimum over $u \in S$). By the cut property it belongs to $M$, so invariant 1 is maintained. Then for each neighbor $v \notin S$ of $x$ the algorithm sets $key(v) \leftarrow \min(key(v), w(xv))$, which restores invariant 2 for $S + x$. Since $G$ is connected, while $S \ne V$ some edge crosses the cut, so the minimum key is finite and the algorithm never gets stuck. After all $V$ extractions, $T_S$ has $V - 1$ edges and is contained in $M$, which also has $V - 1$ edges, so $T_S = M$. ∎

**(b)** The path $s - a - b$ with $w(sa) = 5$ and $w(ab) = 1$: extract $s$ (key 0), then $a$ (key 5), then $b$ (key 1). The keys go $0, 5, 1$.

**(c)** With $key(s) = 0$ and the update $key(v) \leftarrow \min(key(v), key(u) + w(uv))$, the algorithm **is** Dijkstra: $key(v)$ is the length of the best path found so far, and the parent pointers form a **shortest-path tree** from $s$. Counterexample: triangle $s, a, b$ with $w(sa) = 2$, $w(sb) = 3$, $w(ab) = 1.5$. Shortest paths from $s$: $a$ at 2 via $sa$, $b$ at 3 via $sb$ (since $2 + 1.5 > 3$), so the output is $\{sa, sb\}$ of weight 5. The MST is $\{ab, sa\}$ of weight 3.5 ($sb$ is the heaviest edge on the triangle).`
    },
    {
      id: 'mst-wells-code', type: 'code', title: 'Wells and pipes', difficulty: 2,
      prompt: String.raw`Write <code>waterNetwork(n, wellCost, pipes)</code>. Villages are <code>0..n-1</code> ($n \ge 1$); <code>wellCost[v]</code> $> 0$ is the cost of a well at $v$; <code>pipes</code> is a list of <code>[u, v, w]</code> (possible pipe between $u$ and $v$ costing $w > 0$; the pipe graph may be disconnected and may have parallel edges). Every village must have a well or be connected through laid pipes to a village with a well. Return the minimum total cost.`,
      fn: 'waterNetwork',
      starter: 'function waterNetwork(n, wellCost, pipes) {\n  // add a virtual vertex n joined to every village v with weight wellCost[v],\n  // then compute an MST\n}\n',
      reference: function (n, wellCost, pipes) {
        const edges = pipes.map(([u, v, w]) => [u, v, w]);
        for (let v = 0; v < n; v++) edges.push([v, n, wellCost[v]]);
        edges.sort((a, b) => a[2] - b[2]);
        const parent = Array.from({ length: n + 1 }, (_, i) => i);
        const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        let total = 0;
        for (const [u, v, w] of edges) {
          const a = find(u), b = find(v);
          if (a !== b) { parent[a] = b; total += w; }
        }
        return total;
      },
      tests: [
        [1, [5], []],
        [2, [1, 1], [[0, 1, 100]]],
        [2, [10, 50], [[0, 1, 3]]],
        [3, [1, 2, 2], [[0, 1, 1], [1, 2, 1]]],
        [4, [8, 9, 9, 7], [[0, 1, 2], [1, 2, 2], [2, 3, 2], [0, 3, 10]]],
        [4, [3, 3, 3, 3], [[0, 1, 5], [2, 3, 1]]],
        [5, [20, 20, 1, 20, 20], [[0, 1, 2], [1, 2, 9], [2, 3, 4], [3, 4, 1], [0, 4, 30]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const wellCost = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 20));
        const m = Math.floor(Math.random() * 2 * n);
        const pipes = [];
        for (let i = 0; i < m && n > 1; i++) {
          const u = Math.floor(Math.random() * n), v = Math.floor(Math.random() * n);
          if (u !== v) pipes.push([u, v, 1 + Math.floor(Math.random() * 20)]);
        }
        return [n, wellCost, pipes];
      },
      hints: [
        'A well at v behaves exactly like a pipe from v to an imaginary "groundwater" vertex.',
        'Add vertex n with an edge [v, n, wellCost[v]] for each v, then run Kruskal on the n + 1 vertices.'
      ],
      solution: String.raw`Add a virtual vertex $z = n$ and an edge $zv$ of weight $wellCost[v]$ for every village. Spanning trees of this augmented graph correspond to feasible plans of equal cost (edges at $z$ are wells, the rest are pipes), and every feasible plan contains such a tree of no greater cost because all costs are positive (see the written problem "Wells and pipes"). So the answer is the MST weight of the augmented graph.

Kruskal: sort the $E + n$ edges, scan with union–find, add an edge when its endpoints are in different sets. The augmented graph is always connected, so exactly $n$ edges are added. Time $O((n + E)\log(n + E))$.`
    },
    {
      id: 'mst-minred-code', type: 'code', title: 'Fewest red edges among MSTs', difficulty: 2,
      prompt: String.raw`Write <code>minRedMST(n, edges)</code>. The graph is undirected, **connected**, on vertices <code>0..n-1</code> ($n \ge 1$), with edges <code>[u, v, w, r]</code>: integer weight <code>w</code> (ties are common) and color <code>r</code> (<code>1</code> = red, <code>0</code> = blue). Return <code>[W, R]</code> where <code>W</code> is the MST weight and <code>R</code> is the **minimum number of red edges** over all minimum spanning trees.`,
      fn: 'minRedMST',
      starter: 'function minRedMST(n, edges) {\n  // Kruskal, breaking weight ties in favor of blue edges\n}\n',
      reference: function (n, edges) {
        const order = edges.map((e, i) => i);
        order.sort((a, b) => (edges[a][2] - edges[b][2]) || (edges[a][3] - edges[b][3]));
        const parent = Array.from({ length: n }, (_, i) => i);
        const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        let W = 0, R = 0;
        for (const i of order) {
          const [u, v, w, r] = edges[i];
          const a = find(u), b = find(v);
          if (a !== b) { parent[a] = b; W += w; R += r; }
        }
        return [W, R];
      },
      tests: [
        [1, []],
        [2, [[0, 1, 5, 1]]],
        [2, [[0, 1, 5, 1], [0, 1, 5, 0]]],
        [3, [[0, 1, 1, 1], [1, 2, 1, 1], [0, 2, 1, 0]]],
        [3, [[0, 1, 1, 1], [1, 2, 2, 0], [0, 2, 1, 0]]],
        [4, [[0, 1, 2, 1], [1, 2, 2, 1], [2, 3, 2, 1], [3, 0, 2, 0], [0, 2, 3, 0]]],
        [4, [[0, 1, 1, 0], [1, 2, 1, 1], [2, 3, 1, 0], [0, 3, 1, 1], [1, 3, 2, 0]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 6);
        const edges = [];
        for (let v = 1; v < n; v++) edges.push([Math.floor(Math.random() * v), v, 1 + Math.floor(Math.random() * 3), Math.random() < 0.5 ? 1 : 0]);
        const extra = Math.floor(Math.random() * (n + 2));
        for (let i = 0; i < extra && n > 1; i++) {
          const u = Math.floor(Math.random() * n), v = Math.floor(Math.random() * n);
          if (u !== v) edges.push([u, v, 1 + Math.floor(Math.random() * 3), Math.random() < 0.5 ? 1 : 0]);
        }
        return [n, edges];
      },
      hints: [
        'Kruskal returns an MST no matter how ties are broken. Choose the tie-breaking rule that favors blue.',
        'Sort by weight, and among equal weights put blue (r = 0) before red (r = 1).'
      ],
      solution: String.raw`Sort edges by $(w, r)$ lexicographically and run Kruskal with union–find, summing the weights and the red flags of the accepted edges.

**Why it is right.** The order is a valid sorted order for the perturbed weights $w(e) + \varepsilon\, r(e)$ with $\varepsilon > 0$ tiny, so the output is an MST for those weights. The perturbation adds less than $\varepsilon V$ to any tree, too little to overturn any genuine difference in $w$-weight, so the output is a $w$-MST; and among $w$-MSTs the perturbed weight is minimized exactly by the ones with the fewest red edges. (Full proof in the written problem "The MST with the fewest red edges".)

Time $O(E \log E)$.`
    },
    {
      id: 'mst-mock2-short-answer', type: 'written', title: 'Short answer: true or false, with proof', difficulty: 3,
      tags: ['mt2-mock-2', 'true/false', 'short answer'],
      prompt: String.raw`For each statement, say whether it is **true** or **false** and justify it: a short proof if true, a concrete counterexample **with numbers** if false. A bare "true" or "false" earns no credit. MST statements are about connected undirected graphs; shortest-path statements are about directed graphs. Each part is worth 2 points.

(a) Adding 5 to every edge weight never changes the minimum spanning tree, but it can change the shortest $s$-$t$ path.

(b) If all weights are distinct and every vertex has degree at least 2, then the heaviest edge of $G$ is not in the MST.

(c) Dijkstra's algorithm computes correct distances on every directed acyclic graph, even if some edge lengths are negative.

(d) If in-place Bellman–Ford on a graph with $V$ vertices still changes some distance during its $(V-1)$-st round, then the graph contains a negative cycle reachable from $s$.

(e) If all weights are positive and edge $uv$ belongs to some MST of $G$, then the single edge $uv$ is a shortest path from $u$ to $v$.`,
      rubric: [
        '(2 pts) (a) TRUE: every spanning tree has exactly V − 1 edges, so all trees shift by 5(V − 1) and their order is unchanged; concrete example where a path with more edges loses (e.g. s→a→t with 1 + 1 beats s→t with 3, but after adding 5 it is 12 versus 8)',
        '(2 pts) (b) FALSE: e.g. two triangles joined by a heavy bridge; every degree is at least 2, but the bridge is in every spanning tree',
        '(2 pts) (c) FALSE: s→a 2, s→b 3, b→a −2 is a DAG; Dijkstra finalizes a with 2 but dist(a) = 1 (the topological-order DP is the right algorithm)',
        '(2 pts) (d) FALSE: a path whose edges are scanned in reverse order still changes in round V − 1 with no cycle at all; the correct test is an edge still tense AFTER V − 1 rounds',
        '(2 pts) (e) TRUE: a shorter u–v path would contain only edges lighter than uv, so uv would be the unique heaviest edge on a cycle and in no MST'
      ],
      hints: [
        'For each MST claim ask: is there a cut where the edge is lightest, or a cycle where it is heaviest? Bridges and ties are the classic counterexamples.',
        'For (d), remember what the Bellman–Ford invariant guarantees after i rounds, and how many edges a shortest path may need.'
      ],
      solution: String.raw`**(a) True.** *MST:* every spanning tree has exactly $V - 1$ edges, so adding 5 to every weight adds exactly $5(V - 1)$ to every tree; the ordering of trees by weight is unchanged, so the MST (or set of MSTs) is the same. (Alternatively: $x \mapsto x + 5$ is strictly increasing, and Kruskal only compares weights.) *Shortest paths:* edges $s \to a$ (1), $a \to t$ (1), $s \to t$ (3). Originally $s \to a \to t$ is shortest ($2 < 3$). After adding 5: $6 + 6 = 12$ versus $8$, so now $s \to t$ is shortest. Paths with more edges gain more.

**(b) False.** Two triangles $\{a, b, c\}$ with weights $ab = 1$, $bc = 2$, $ca = 3$ and $\{d, e, f\}$ with $de = 4$, $ef = 5$, $fd = 6$, joined by the edge $cd$ of weight 100. Every vertex has degree 2 or 3. The heaviest edge $cd$ is a **bridge**: deleting it disconnects the graph, so every spanning tree, in particular the MST, contains it. (Degree $\ge 2$ does not rule out bridges; "lies on a cycle" is what the cycle property needs.)

**(c) False.** The DAG with edges $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$). Dijkstra extracts $s$, sets $a = 2$, $b = 3$, extracts $a$ with key 2 and finalizes it; when $b$ is extracted the edge $b \to a$ would give 1, but $a$ is already done. The true distance is $dist(a) = 1$. Acyclicity removes negative cycles, not negative edges. The correct algorithm on a DAG is to relax out-edges in topological order, $O(V + E)$, valid for any signs.

**(d) False.** Three vertices $s, a, b$ and edges $a \to b$ (1), $s \to a$ (1), scanned in that order every round; $V - 1 = 2$. Round 1: $a \to b$ is skipped ($dist(a) = \infty$), then $dist(a) = 1$. Round 2: $dist(b) = 2$, a change during round $V - 1$, yet the graph has no cycle at all. The invariant only promises that after $i$ rounds, walks with at most $i$ edges are accounted for, and a shortest path may need all $V - 1$ edges. The correct test: if some edge is still tense **after** the $V - 1$ rounds (a change in round $V$), there is a negative cycle reachable from $s$.

**(e) True.** Suppose $uv$ is in some MST but some $u$-$v$ path $P$ has total length $< w(uv)$. Then $P$ does not use the edge $uv$ (it would already weigh at least $w(uv)$), and since all weights are positive, every edge of $P$ weighs at most $\ell(P) < w(uv)$. So $P + uv$ is a cycle on which $uv$ is the **unique** heaviest edge, and by the cycle property $uv$ is in no MST (with ties: the unique heaviest edge on a cycle is in no MST), a contradiction. (With negative weights this fails: triangle $ux = -5$, $uv = 1$, $xv = 2$ has MST $\{ux, uv\}$, but $u \to x \to v$ has length $-3 < 1$.)`
    }
  ]
});
