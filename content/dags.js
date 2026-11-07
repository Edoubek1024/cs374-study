CS374.topic({
  id: 'dags',
  unit: 'algorithms',
  order: 16,
  title: 'DFS, DAGs, Topological Sort & SCCs',
  summary: 'Depth-first search with pre/post clocks, edge classification, cycle detection, topological sorting, dynamic programming on DAGs, and strongly connected components via Kosaraju–Sharir.',
  objectives: [
    'Run DFS with pre/post clocks and classify every edge as tree, forward, back or cross',
    'Use the post-order lemma to detect cycles and compute a topological order in O(V+E)',
    'Solve longest-path and path-counting problems on DAGs by dynamic programming in topological order',
    'Explain why the strong-component graph is a DAG and how Kosaraju–Sharir finds all SCCs in O(V+E)',
    'Model problems using the condensation (SCC meta-graph) of a directed graph',
    'Model pairwise boolean constraints as 2SAT and solve them with strongly connected components'
  ],

  lesson: String.raw`
## What this topic is about

Breadth-first search answers "how far?". Depth-first search answers a different family of questions: *in what order can things happen?*, *is there a cycle?*, *which vertices are mutually reachable?*, and *what is the best path when the graph has no cycles?* All of these come from a single DFS that records two timestamps per vertex. This lesson builds that machinery carefully, proves every fact you are allowed to cite on an exam, and then spends a long time on the modeling patterns that exam problems actually use: dynamic programming on DAGs, collapsing strongly connected components, and 2SAT.

> **Note.** Every graph drawing in this lesson has a link to the [Graph Algorithms Lab](#/lab/graph). There you can run DFS (with pre/post clocks and edge colors), topological sort and Kosaraju–Sharir one step at a time on the same graph, or type in your own. Try predicting each step before you click.

## DFS with a clock

Depth-first search becomes far more useful once we record **when** each vertex is first discovered and when its recursive call finishes. Keep a global counter *clock*:

~~~pseudo
DFSAll(G):
    clock <- 0
    for each vertex v: unmark v
    for each vertex v:
        if v is unmarked:
            DFS(v)

DFS(v):
    mark v
    clock <- clock + 1; pre(v) <- clock
    for each edge v -> w:
        if w is unmarked:
            parent(w) <- v
            DFS(w)
    clock <- clock + 1; post(v) <- clock
~~~

Each vertex gets an interval $[pre(v), post(v)]$. At any moment a vertex has one of three **statuses**:

- **new** (before $pre(v)$): not yet discovered;
- **active** (between $pre(v)$ and $post(v)$): its call DFS($v$) is on the recursion stack;
- **finished** (after $post(v)$): its call has returned.

The parent pointers form the **DFS forest**: one tree per top-level call made by DFSAll. Each vertex is marked once and each edge is examined once (twice for undirected graphs), so DFSAll runs in $O(V+E)$ time with adjacency lists. The clock values are the integers $1, \dots, 2V$, each used exactly once.

A crucial observation about the recursion stack: **at any moment, the active vertices are exactly the vertices on the current root-to-current-vertex path of the DFS forest.** The call stack holds DFS($r$), DFS(child of $r$), ..., DFS(current vertex), and each of these was called from the one below it.

### The parenthesis lemma

> **Lemma.** (Parenthesis property.) For any two vertices $u \ne v$, the intervals $[pre(u), post(u)]$ and $[pre(v), post(v)]$ are either **disjoint** or **nested**. They are nested with $u$'s containing $v$'s exactly when $v$ is a proper descendant of $u$ in the DFS forest.

*Proof.* Suppose without loss of generality that $pre(u) < pre(v)$. Consider the moment DFS($v$) is called.

- If $u$ is still active at that moment, then DFS($v$) was invoked (directly or through a chain of calls) from within DFS($u$), so $v$ is a descendant of $u$. Calls on a stack return in last-in-first-out order, so DFS($v$) returns before DFS($u$) does: $pre(u) < pre(v) < post(v) < post(u)$. Nested.
- If $u$ is already finished, then $post(u) < pre(v)$, so the intervals are disjoint, and $v$ is not a descendant of $u$ (descendants of $u$ are discovered while $u$ is active).

Since $u$ was discovered before $v$, it cannot be new, so these are the only cases. Conversely, if $v$ is a descendant of $u$, DFS($v$) is called inside DFS($u$), which is the first case. ∎

So the intervals behave like matched parentheses: writing "(" at $pre(v)$ and ")" at $post(v)$ always gives a well-formed parenthesization.

### The white-path lemma

> **Lemma.** (White-path.) $v$ becomes a descendant of $u$ if and only if, at time $pre(u)$, there is a path from $u$ to $v$ consisting entirely of **new** vertices (other than $u$ itself).

*Proof.* (⇒) If $v$ is a descendant of $u$, look at the tree path $u = w_0 \to w_1 \to \dots \to w_k = v$. Each $w_i$ ($i \ge 1$) is a descendant of $u$, so by the parenthesis lemma $pre(w_i) > pre(u)$: all of them were new at time $pre(u)$.

(⇐) Let $u = w_0 \to w_1 \to \dots \to w_k = v$ be a path of vertices that are new at time $pre(u)$, and suppose for contradiction that some $w_i$ is not a descendant of $u$. Take the smallest such $i$ (so $i \ge 1$, and $w_{i-1}$ is $u$ or a descendant of $u$). DFS($w_{i-1}$) examines the edge $w_{i-1} \to w_i$ before it returns, which happens no later than $post(u)$. At that moment either $w_i$ is still unmarked, so it becomes a child of $w_{i-1}$ and hence a descendant of $u$; or $w_i$ has already been marked, at some time after $pre(u)$ (it was new at $pre(u)$) and before $post(u)$, while $u$ was active, so it is a descendant of $u$ by the parenthesis lemma's first case. Either way $w_i$ is a descendant: contradiction. ∎

> **Warning.** "Reachable from $u$" is **not** the same as "descendant of $u$". If the only path from $u$ to $v$ passes through a vertex that was already discovered when $u$ started, $v$ can end up outside $u$'s subtree. The white-path lemma is precise about when the two coincide.

## Classifying edges

After DFSAll on a directed graph, each edge $u \to v$ is classified by **the status of $v$ at the moment DFS($u$) examines the edge**:

| status of $v$ when $u \to v$ is examined | Type | Interval pattern |
|---|---|---|
| new | **tree** ($parent(v) = u$) | $pre(u) < pre(v) < post(v) < post(u)$ |
| finished, and $pre(u) < pre(v)$ | **forward** (non-child descendant) | $pre(u) < pre(v) < post(v) < post(u)$ |
| active | **back** ($v$ is an ancestor of $u$, or $u = v$) | $pre(v) \le pre(u) < post(u) \le post(v)$ |
| finished, and $pre(v) < pre(u)$ | **cross** (neither is an ancestor) | $pre(v) < post(v) < pre(u) < post(u)$ |

Why the patterns are right: a new $v$ becomes a child, so it is nested inside $u$. An active $v$ is on the stack below $u$, so it is an ancestor (the observation about active vertices). A finished $v$ with $pre(u) < pre(v)$ was discovered and finished while $u$ was active, so it is a descendant. A finished $v$ with $pre(v) < pre(u)$ finished before $u$ even started (it cannot contain $u$'s interval, since it is finished while $u$ is active), so the intervals are disjoint with $v$'s first.

Note the cross-edge pattern: cross edges always point **backward in time**, to a vertex that is already finished. A cross edge "forward in time" is impossible: if $v$ were still new when $u$ examined $u \to v$, it would become a descendant of $u$.

~~~steps DFS trace with clocks and edge types
**The graph.** Directed edges $a \to b$, $a \to c$, $b \to c$, $b \to d$, $c \to a$, $d \to c$, $e \to d$. DFSAll tries vertices and out-neighbors in alphabetical order. (Open the drawing below in the Graph Lab and run DFS to watch the same trace.)

| | a | b | c | d | e |
|---|---|---|---|---|---|
| pre | | | | | |
| post | | | | | |
+++
**clock 1:** DFS($a$) starts, $pre(a) = 1$. Its first edge is $a \to b$ and $b$ is new, so $a \to b$ is a **tree** edge. **clock 2:** $pre(b) = 2$. Stack: $a, b$.
+++
From $b$, the edge $b \to c$ finds $c$ new: **tree** edge. **clock 3:** $pre(c) = 3$. Stack: $a, b, c$.
+++
From $c$, the edge $c \to a$ finds $a$ **active** (it is on the stack): **back** edge. This single edge already proves the graph has a cycle, namely $a \to b \to c \to a$. $c$ has no more edges. **clock 4:** $post(c) = 4$.
+++
Back in $b$: the edge $b \to d$ finds $d$ new: **tree** edge. **clock 5:** $pre(d) = 5$. From $d$, the edge $d \to c$ finds $c$ **finished** with $pre(c) = 3 < pre(d) = 5$: **cross** edge. **clock 6:** $post(d) = 6$. **clock 7:** $post(b) = 7$.
+++
Back in $a$: the edge $a \to c$ finds $c$ **finished** with $pre(a) = 1 < pre(c) = 3$: $c$ is a descendant but not a child, so a **forward** edge. **clock 8:** $post(a) = 8$.
+++
DFSAll moves on: $b, c, d$ are marked; $e$ is new. **clock 9:** $pre(e) = 9$. The edge $e \to d$ finds $d$ finished with $pre(d) < pre(e)$: **cross**. **clock 10:** $post(e) = 10$.

| | a | b | c | d | e |
|---|---|---|---|---|---|
| pre | 1 | 2 | 3 | 5 | 9 |
| post | 8 | 7 | 4 | 6 | 10 |

Tree: $a \to b$, $b \to c$, $b \to d$. Forward: $a \to c$. Back: $c \to a$. Cross: $d \to c$ and $e \to d$. Check the post-order lemma: every edge except the back edge $c \to a$ goes from a larger post to a smaller post.
~~~

~~~graph
directed
a b
a c
b c
b d
c a
d c
e d
~~~

### The post-order lemma

> **Lemma.** (Post-order lemma.) For every edge $u \to v$: if it is a tree, forward or cross edge then $post(u) > post(v)$; if it is a back edge then $post(u) \le post(v)$ (with equality only for a self-loop). In other words, **an edge goes "up" in post order only if it is a back edge.**

*Proof.* Look at the moment DFS($u$) examines $u \to v$. If $v$ is new, DFS($v$) runs to completion right now, inside DFS($u$), so $post(v) < post(u)$. If $v$ is finished, $post(v)$ is already assigned while $post(u)$ is still in the future, so $post(v) < post(u)$. If $v$ is active, it is $u$ itself or an ancestor of $u$ and finishes no earlier than $u$, so $post(u) \le post(v)$. The three cases correspond to (tree), (forward/cross), (back). ∎

> **Warning.** In an **undirected** graph, DFS produces only tree and back edges: if $uv$ is an edge and $u$ is discovered first, $v$ is discovered before $u$ finishes (DFS($u$) looks at $v$), so $v$ is a descendant of $u$. There are no cross edges, and "forward" edges are just back edges seen from the other end.

**Try it first.** A DFS of some directed graph produced these intervals: $p[1,10]$, $q[2,5]$, $r[3,4]$, $s[6,9]$, $t[7,8]$, $u[11,12]$. Assume there are no parallel edges. For each potential edge, say what type it would be, or that it **cannot exist**: $q \to r$, $p \to r$, $r \to q$, $s \to q$, $t \to s$, $u \to t$, $t \to u$.

~~~reveal Solution: reasoning from intervals
First reconstruct the forest from nesting: $p$ contains $q$ and $s$; $q$ contains $r$; $s$ contains $t$; $u$ is a separate tree. A vertex's parent is the vertex whose interval most tightly contains it, so the tree is $p \to q \to r$, $p \to s \to t$, and $u$ alone.

- $q \to r$: $r$ is a child of $q$ (nothing sits between them), so with no parallel edges this is the **tree** edge.
- $p \to r$: $r$ is a descendant but not a child: **forward**.
- $r \to q$: $q$ is an ancestor of $r$: **back** (so the graph has the cycle $q \to r \to q$).
- $s \to q$: disjoint intervals, $q$'s first: **cross**.
- $t \to s$: ancestor: **back**.
- $u \to t$: disjoint, $t$'s first: **cross**.
- $t \to u$: disjoint intervals with the **tail's** interval first. When $t$ examined this edge, $u$ was still new, so $u$ would have become a descendant of $t$. This edge **cannot exist**.

The general rule: an edge between disjoint intervals must point from the later interval to the earlier one.
~~~

## Cycle detection

> **Theorem.** A directed graph $G$ has a directed cycle if and only if DFSAll($G$) produces at least one back edge.

*Proof.* If $u \to v$ is a back edge, then $v$ is an ancestor of $u$ (or $v = u$), so the tree path $v \leadsto u$ plus the edge $u \to v$ is a cycle. Conversely, suppose there are no back edges. Then by the post-order lemma $post(u) > post(v)$ for every edge $u \to v$. Along a cycle $v_0 \to v_1 \to \dots \to v_k = v_0$ the post values would strictly decrease and return to where they started, which is impossible. ∎

So to test for a cycle: run DFS, and whenever an edge $v \to w$ finds $w$ **active**, report a cycle. To output it, follow parent pointers from $v$ up to $w$. Total $O(V+E)$. You need three statuses, not two: an edge into a **finished** vertex is harmless (forward or cross), and treating "marked" as "cycle" is a classic bug.

## Topological sort

A **topological ordering** of a directed graph lists its vertices so that every edge goes from an earlier vertex to a later vertex. A graph has one if and only if it is a **directed acyclic graph (DAG)**: a cycle cannot be ordered (its first vertex in the order has an incoming cycle edge from a later vertex), and the algorithm below orders any DAG.

> **Theorem.** If $G$ is a DAG, listing its vertices in **decreasing order of post** is a topological order.

*Proof.* A DAG has no back edges (by the cycle theorem), so by the post-order lemma every edge $u \to v$ has $post(u) > post(v)$, i.e., $u$ comes first. ∎

~~~pseudo
TopologicalSort(G):
    run DFSAll(G); when DFS(v) finishes, push v onto the FRONT of list L
    (if any edge reaches an active vertex, report "G has a cycle")
    return L
~~~

Time $O(V+E)$. Two useful facts in any DAG: the vertex with the **largest** post is a **source** (an incoming edge $w \to v$ would need $post(w) > post(v)$), and the vertex with the **smallest** post is a **sink**. Every nonempty DAG has at least one source and one sink. Beware: these facts are about the extreme vertices only. It is false that every source has a larger post than every sink.

**Kahn's algorithm.** Repeatedly output a source and delete it. Maintain in-degrees and a queue of current sources; each edge deletion is $O(1)$, so the total is $O(V+E)$. Correctness: when a vertex is output, all of its in-neighbors were output earlier (its in-degree reached 0), so every edge goes forward. If the queue empties while vertices remain, every remaining vertex has an in-edge from another remaining vertex; walking backward along such edges must eventually repeat a vertex, so the remaining graph has a cycle. So Kahn's algorithm is also a cycle detector.

> **Key idea.** Kahn's algorithm is the right tool when the problem asks for a *particular* topological order: use a min-heap instead of a queue to get the lexicographically smallest order in $O(E + V \log V)$ time, or process the graph level by level to get the "earliest round" of each vertex.

## Dynamic programming on DAGs

Every memoized recursion has a **dependency graph**: subproblems are vertices, and there is an edge from each subproblem to the ones it calls. The recursion terminates exactly when this graph is a DAG, and a valid evaluation order is a **reverse topological order** (evaluate sinks first). Conversely, many DAG problems are natural dynamic programs whose subproblems are "the best/number of paths starting (or ending) at $v$".

**Longest path.** For each vertex $v$ define $LLP(v)$ = the maximum total length of a path that **starts** at $v$ (the trivial path has length 0):
$$LLP(v) = \max\Big(0,\ \max_{v \to w} \big( \ell(v \to w) + LLP(w) \big) \Big).$$
Evaluate in reverse topological order, which is exactly **increasing post order**. So you can fill in $LLP(v)$ at the moment DFS finishes $v$: all its out-neighbors are already finished (no back edges in a DAG). Total time $O(V+E)$.

*Correctness* is the usual DP argument: a path starting at $v$ is either just $v$, or an edge $v \to w$ followed by a path starting at $w$; the best path starting at $w$ is the best continuation because in a DAG a path from $w$ can never come back to $v$, so the two parts never conflict.

> **Key idea.** Longest path is NP-hard in general graphs (it generalizes Hamiltonian path), but it is linear-time in DAGs, because there are no cycles to repeat and the recurrence's dependency graph is the DAG itself. The tempting trick "negate the weights and run Bellman–Ford" fails on general graphs: every positive cycle becomes a negative cycle.

**Paths that must start at $s$ and end at $t$.** If the problem fixes both endpoints, the recurrence must not allow the "stop anywhere" option. Define $LP(v)$ = the maximum length of a path from $v$ to $t$, with $LP(t) = 0$ and $LP(v) = \max_{v \to w} (\ell(v \to w) + LP(w))$ for $v \ne t$, where the maximum of an empty set (or of a set containing only $-\infty$ values) is $-\infty$. A value of $-\infty$ means "$t$ is not reachable from here". Forgetting this is one of the most common errors in DAG DP.

**Counting paths.** The number of paths from $v$ to $t$ in a DAG is
$$N(v) = \begin{cases} 1 & v = t \\ \sum_{v \to w} N(w) & \text{otherwise.}\end{cases}$$
Again evaluate in reverse topological order: $O(V+E)$ arithmetic operations. (The counts themselves can be exponential, up to $2^{V-2}$, so each number may have $\Theta(V)$ bits; exam problems normally count arithmetic operations as $O(1)$ or ask for the answer modulo some $m$.)

**Example.** In the weighted DAG below:

~~~graph
directed
s a 3
s b 2
a c 4
b c 1
b d 5
c t 2
d t 1
~~~

Reverse topological order $t, c, d, a, b, s$ gives: $LLP(t) = 0$, $LLP(c) = 2$, $LLP(d) = 1$, $LLP(a) = 4 + 2 = 6$, $LLP(b) = \max(1 + 2,\ 5 + 1) = 6$, $LLP(s) = \max(3 + 6,\ 2 + 6) = 9$, achieved by $s \to a \to c \to t$. Counting paths to $t$: $N(t)=N(c)=N(d)=N(a)=1$, $N(b)=2$, $N(s)=3$.

**Try it first.** Let $G$ be a DAG with vertices $s$, $t$ and a required vertex $x$. (a) Count the $s$-to-$t$ paths that pass through $x$. (b) Find the maximum length of an $s$-to-$t$ path through $x$. Both in $O(V+E)$ time.

~~~reveal Solution: paths through a required vertex
**Key observation.** In a DAG, a path from $s$ to $t$ through $x$ splits uniquely at $x$ into a path $s \leadsto x$ and a path $x \leadsto t$, and **any** such pair glues back into a path: the two parts cannot share a vertex other than $x$, because a shared vertex $y$ would give $x \leadsto y$ (in the second part) and $y \leadsto x$ (in the first part), a cycle.

**(a)** Let $A(v)$ = number of paths from $s$ to $v$ ($A(s) = 1$, $A(v) = \sum_{u \to v} A(u)$, evaluated in topological order) and $B(v)$ = number of paths from $v$ to $t$ ($B(t) = 1$, $B(v) = \sum_{v \to w} B(w)$, in reverse topological order). The answer is $A(x) \cdot B(x)$, by the bijection above.

**(b)** Similarly, $F(v)$ = longest $s \leadsto v$ path ($-\infty$ if none) and $G(v)$ = longest $v \leadsto t$ path ($-\infty$ if none). Answer $F(x) + G(x)$; if either is $-\infty$ there is no such path.

**Time.** One topological sort and two linear passes: $O(V+E)$.

**Remark.** The gluing argument is exactly where acyclicity is used. In a general graph the two halves might intersect, and "longest simple path through $x$" is NP-hard.
~~~

**Try it first.** A DAG $G$ has a **reward** $r(v)$ (possibly negative) on each vertex. Describe an $O(V+E)$ algorithm for the maximum total reward of a path from $s$ to $t$, where a path collects the reward of every vertex on it, including $s$ and $t$.

~~~reveal Solution: best path with vertex rewards
**Subproblem.** $R(v)$ = maximum total reward of a path from $v$ to $t$, counting both endpoints; $R(v) = -\infty$ if $t$ is unreachable from $v$.

**Recurrence.**
$$R(v) = \begin{cases} r(t) & v = t \\ r(v) + \max_{v \to w} R(w) & v \neq t \end{cases}$$
with the convention $\max \emptyset = -\infty$ and $r(v) + (-\infty) = -\infty$.

**Memoization and order.** Store $R$ in an array indexed by vertex; fill it in reverse topological order (increasing post order), so every out-neighbor $w$ is done before $v$.

**Answer.** $R(s)$; report "no path" if it is $-\infty$. Negative rewards are no problem: we cannot skip a vertex on a path, and the recurrence accounts for every vertex exactly once.

**Time.** $O(V+E)$: topological sort plus constant work per edge.

**Alternative.** Put the rewards on edges: give $u \to v$ length $r(v)$ and add $r(s)$ at the end. Then it is a longest-path problem with edge lengths.
~~~

## Strongly connected components

Vertices $u$ and $v$ are **strongly connected** if $u$ reaches $v$ **and** $v$ reaches $u$. This is an equivalence relation (reflexive via the empty path; transitive by concatenating walks); its classes are the **strongly connected components (SCCs)**. A DAG is exactly a graph in which every SCC is a single vertex and there are no self-loops. A vertex lies on a directed cycle iff its SCC has at least two vertices or it has a self-loop, and an edge $u \to v$ lies on a cycle iff $u$ and $v$ are in the same SCC.

> **Definition.** The **condensation** (strong-component graph, meta-graph) $scc(G)$ has one vertex per SCC of $G$, and an edge $C \to C'$ whenever some edge of $G$ goes from a vertex in $C$ to a vertex in $C'$ (with $C \ne C'$).

> **Theorem.** $scc(G)$ is always a DAG.

*Proof.* A cycle $C_1 \to C_2 \to \dots \to C_k \to C_1$ in $scc(G)$ with $k \ge 2$ would let every vertex in these components reach every other (follow the edges between components, moving inside each component freely), so they would all be one SCC, contradicting maximality. ∎

Example: SCCs $\{a,b,c\}$, $\{d,e\}$, $\{f,g\}$.

~~~graph
directed
a b
b c
c a
c d
d e
e d
e f
f g
g f
a g
~~~

Its condensation is the DAG $A \to D \to F$ plus $A \to F$, where $A = \{a,b,c\}$, $D = \{d,e\}$, $F = \{f,g\}$.

Reachability between vertices depends only on their components: for $u \in C$ and $v \in C'$, $u \leadsto v$ in $G$ iff $C \leadsto C'$ in $scc(G)$. This is why so many problems become easy after contracting SCCs.

**Naive algorithm.** The SCC of a single vertex $v$ is $reach(v) \cap reach^{-1}(v)$: search from $v$ in $G$ and in the reversal $rev(G)$, $O(V+E)$. Doing this for every vertex costs $O(VE)$. We can do much better.

### The key lemma

> **Lemma.** Run DFSAll on $G$. If there is an edge from SCC $C$ to a different SCC $C'$, then $\max_{x \in C} post(x) > \max_{y \in C'} post(y)$. In particular, the vertex with the **largest** post lies in a **source** SCC of $G$.

*Proof.* Consider the first vertex of $C \cup C'$ that DFS discovers.
- If it is some $x \in C$: at time $pre(x)$ all of $C \cup C'$ is new, and every vertex of $C \cup C'$ is reachable from $x$ by a path inside $C \cup C'$ (inside $C$ to the tail of the edge into $C'$, then inside $C'$). By the white-path lemma all of $C \cup C'$ become descendants of $x$, so they finish before $x$. So $x$ has the largest post in $C \cup C'$.
- If it is some $y \in C'$: no vertex of $C$ is reachable from $y$ (else $C \leadsto C'$ and $C' \leadsto C$, and the two components would merge). So DFS($y$) finishes without discovering any vertex of $C$, and every vertex of $C$ is discovered, hence finished, after $post(y)$. Meanwhile every vertex of $C'$ is a descendant of $y$ (white-path lemma) and finishes by $post(y)$. So every post in $C$ exceeds every post in $C'$.

For the last claim: if the overall maximum lies in $C$ and some edge entered $C$ from $C''$, the lemma would give $C''$ a larger maximum. ∎

> **Warning.** The symmetric statement is **false**: the vertex with the *smallest* post need not lie in a sink SCC. Example: edges $a \to b$, $b \to a$, $a \to c$, with DFS starting at $a$ and visiting $b$ first: $b$ finishes first, but $\{a, b\}$ is a source component, and the sink is $\{c\}$.

Why do we want a **sink** SCC? Because a search in $G$ started from any vertex of a sink SCC finds exactly that SCC and nothing else. The trick: a source SCC of $rev(G)$ is a sink SCC of $G$ (reversal reverses every edge of the condensation, and the SCCs of $rev(G)$ are the same vertex sets).

### Kosaraju–Sharir

~~~pseudo
KosarajuSharir(G):
    run DFSAll(rev(G)), recording the post-order of the vertices
    unmark all vertices; count <- 0
    for each vertex v in DECREASING post order (from the first pass):
        if v is unmarked:
            count <- count + 1
            whatever-first search from v in G, labeling each newly marked vertex with count
    return labels
~~~

> **Theorem.** Kosaraju–Sharir labels each vertex with its SCC, and runs in $O(V+E)$ time.

*Proof.* We prove by induction on the number of searches in phase 2 the invariant: **the set of marked vertices is a union of whole SCCs, and each search marks exactly one SCC.**

Initially nothing is marked. Suppose the invariant holds and phase 2 starts a search at $v$, the unmarked vertex with the largest $rev(G)$-post. Let $C$ be $v$'s SCC; by the invariant, all of $C$ is unmarked, so $v$ has the largest post within $C$ too.

*Claim: every edge of $G$ leaving $C$ goes to a marked vertex.* Suppose instead $x \to y$ with $x \in C$ and $y$ unmarked in a different SCC $C'$; by the invariant all of $C'$ is unmarked. In $rev(G)$ this is an edge $y \to x$ from $C'$ to $C$, so the key lemma (applied to the DFS of $rev(G)$) gives $\max post(C') > \max post(C) = post(v)$. But then some unmarked vertex of $C'$ has a larger post than $v$, contradicting the choice of $v$.

The search from $v$ in $G$ reaches every vertex of $C$ (strongly connected, all unmarked) and, by the claim, cannot step from $C$ to any unmarked vertex outside $C$; it never walks through marked vertices. So it marks exactly $C$, and the invariant is preserved. Every vertex is eventually marked, so every SCC gets its own label.

*Time.* Building $rev(G)$, one DFSAll, sorting by post (just record vertices as they finish), and phase 2 (each vertex marked once overall) are each $O(V+E)$. ∎

(Some textbooks state the mirror image: DFS on $G$ first, then search in $rev(G)$ in decreasing post order. Both are correct; just be consistent about which graph each pass uses.)

~~~steps Kosaraju–Sharir on the example graph
**Phase 1 setup.** Reverse every edge of the example graph. $rev(G)$ has edges $b \to a$, $c \to b$, $a \to c$, $d \to c$, $e \to d$, $d \to e$, $f \to e$, $g \to f$, $f \to g$, $g \to a$. Out-neighbors in alphabetical order: $a: c$; $b: a$; $c: b$; $d: c, e$; $e: d$; $f: e, g$; $g: a, f$.
+++
**DFS of $rev(G)$ from $a$.** $pre(a)=1$, go to $c$: $pre(c)=2$, go to $b$: $pre(b)=3$. Edge $b \to a$ hits an active vertex. $post(b)=4$, $post(c)=5$, $post(a)=6$.
+++
**Next top-level call: $d$.** $pre(d)=7$. Edge $d \to c$: finished. Edge $d \to e$: $pre(e)=8$; edge $e \to d$ is active. $post(e)=9$, $post(d)=10$.
+++
**Next top-level call: $f$.** $pre(f)=11$. Edge $f \to e$: finished. Edge $f \to g$: $pre(g)=12$; edges $g \to a$ (finished) and $g \to f$ (active). $post(g)=13$, $post(f)=14$.

Decreasing post order: $f(14), g(13), d(10), e(9), a(6), c(5), b(4)$.
+++
**Phase 2, first search (in $G$!) from $f$.** In $G$, $f \to g$ and $g \to f$, and nothing else leaves $\{f, g\}$. Label $\{f, g\}$ as SCC 1. It is a sink of the condensation, as the theorem promised.
+++
**Next unmarked in the order: $d$** ($g$ is already marked). Search in $G$: $d \to e$, $e \to d$, $e \to f$ (marked, so blocked). Label $\{d, e\}$ as SCC 2: a sink of what remains.
+++
**Next unmarked: $a$.** Search in $G$: $a \to b \to c \to a$; the edges $c \to d$ and $a \to g$ hit marked vertices. Label $\{a, b, c\}$ as SCC 3. The remaining vertices $c, b$ in the order are already marked. **Done: three SCCs, discovered sink-first.**
~~~

### Tarjan's algorithm (idea)

Tarjan's algorithm finds all SCCs in a **single** DFS. It keeps active-or-unassigned vertices on a stack and computes $low(v)$, the smallest $pre$ value reachable from $v$'s subtree using one non-tree edge into a vertex still on the stack. A vertex $v$ is the first-discovered vertex (the "root") of its SCC exactly when $low(v) = pre(v)$; at that moment, pop the stack down to $v$ to output the SCC. Also $O(V+E)$, and it also outputs SCCs in sink-first (reverse topological) order. On exams you may cite either algorithm as a black box: "compute the SCCs in $O(V+E)$ time".

### Computing the condensation

After labeling SCCs, build $scc(G)$ by scanning every edge $u \to v$ and adding $comp(u) \to comp(v)$ when the labels differ. Duplicate meta-edges are harmless for reachability and DP, or can be removed by radix sorting the pairs. Time $O(V+E)$, and the condensation has at most $V$ vertices and $E$ edges. Then you can run any DAG algorithm (topological sort, DP) on it. A bonus: Kosaraju–Sharir and Tarjan both number components in reverse topological order, so you often get a topological order of the condensation for free.

> **Exam tip.** A very common exam pattern: "in a directed graph where cycles let you repeat things for free, compute the best X". Answer: compute SCCs, collapse each into a single vertex with aggregated data (sum of values, max, OR of flags, whether it has a cycle), then solve a DP on the condensation DAG in $O(V+E)$. State the aggregation explicitly, and explain why it is valid (inside an SCC you can visit everything and leave from anywhere).

**Try it first.** Each vertex $v$ of a directed graph has a value $val(v)$. For **every** vertex $v$, compute $best(v)$, the largest value of any vertex reachable from $v$ (including $v$ itself). Target: $O(V+E)$ total, not $O(V(V+E))$.

~~~reveal Solution: largest reachable value
**Collapse.** Compute the SCCs and the condensation $H$ in $O(V+E)$. For each component $C$ let $m(C) = \max_{v \in C} val(v)$.

**Why this is valid.** All vertices in one SCC reach exactly the same set of vertices (anything reachable from one is reachable from all, by first walking to it inside the component). So $best$ is constant on each SCC, and the set reachable from $C$ is $C$ together with everything reachable from its successors in $H$.

**DP on the DAG.** $B(C)$ = largest value reachable from component $C$:
$$B(C) = \max\Big(m(C),\ \max_{C \to D} B(D)\Big).$$
Evaluate in reverse topological order of $H$ (sink components first; this is the order in which Kosaraju–Sharir discovers them). Output $best(v) = B(comp(v))$.

**Time.** SCCs and condensation $O(V+E)$; computing $m$ is $O(V)$; the DP touches each meta-edge once, $O(V+E)$. Total $O(V+E)$.

**Why not just DP on $G$?** The recurrence $best(v) = \max(val(v), \max_{v \to w} best(w))$ is circular when $G$ has cycles; collapsing SCCs is exactly what makes the dependency graph acyclic.
~~~

**Try it first.** Given a directed graph $G$, decide in $O(V+E)$ time whether adding **one** new edge can make $G$ strongly connected, and if so find such an edge.

~~~reveal Solution: one edge to strong connectivity
Compute the condensation $H$ and count its **sources** (components with no incoming meta-edge) and **sinks** (no outgoing meta-edge). A single-component graph is already strongly connected (0 edges needed).

**Claim.** If $H$ has at least two vertices, one new edge suffices iff $H$ has **exactly one source** $A$ and **exactly one sink** $Z$; then any edge from a vertex of $Z$ to a vertex of $A$ works.

*Sufficiency.* In a DAG every vertex is reachable from some source and reaches some sink. With a unique source $A$ and unique sink $Z$, every component is reachable from $A$ and reaches $Z$. After adding $z \to a$ ($z \in Z$, $a \in A$), any vertex $u$ reaches $z$, then $a$, then any vertex $v$. So the graph is strongly connected.

*Necessity.* In a strongly connected graph every source component of $H$ must receive a new edge entering it (otherwise nothing outside it can reach it), and every sink component must have a new edge leaving it. One edge enters at most one component and leaves at most one component. So two sources, or two sinks, cannot both be fixed by one edge. (A component that is both a source and a sink, i.e., isolated in $H$, needs both.)

**Time.** SCCs, condensation, and in/out-degree counts: $O(V+E)$.

**Generalization (worth knowing).** If $H$ has $k \ge 2$ vertices, with $p$ sources and $q$ sinks, the minimum number of edges to add is exactly $\max(p, q)$. The lower bound is the counting argument above; the matching construction is a theorem of Eswaran and Tarjan (1976). For one component the answer is 0, not $\max(1,1) = 1$.
~~~

## Application: 2SAT

A **2CNF formula** is an AND of clauses, each an OR of at most two literals, e.g. $(x \vee \bar y) \wedge (\bar x \vee z) \wedge (y \vee y)$. Deciding satisfiability is NP-hard for 3CNF, but for 2CNF it is a linear-time SCC computation.

**Implication graph.** Make a vertex for each literal $x_i$ and $\bar x_i$ ($2n$ vertices). A clause $(a \vee b)$ is logically equivalent to both $\bar a \Rightarrow b$ and $\bar b \Rightarrow a$, so it contributes the edges $\bar a \to b$ and $\bar b \to a$. A unit clause $(a)$ is $(a \vee a)$, giving the edge $\bar a \to a$. The graph has $2n$ vertices and $2m$ edges, and it is **skew-symmetric**: $a \to b$ is an edge iff $\bar b \to \bar a$ is.

The meaning of a path: if $a \leadsto b$, then every satisfying assignment that makes $a$ true makes $b$ true (each edge is a valid implication).

> **Theorem.** A 2CNF formula is satisfiable if and only if no variable $x$ has $x$ and $\bar x$ in the same SCC of the implication graph. When it is satisfiable, the following assignment works: fix a topological order $\tau$ of the condensation, and make literal $a$ **true** iff $\tau(comp(a)) > \tau(comp(\bar a))$ (the component of $a$ comes later, closer to the sinks).

*Proof.* (Only if.) If $x \leadsto \bar x$ and $\bar x \leadsto x$, then $x$ true forces $\bar x$ true, and $x$ false ($\bar x$ true) forces $x$ true. Either way a contradiction, so no assignment satisfies the formula.

(If.) Suppose no $x$ shares a component with $\bar x$. Then $\tau(comp(a)) \ne \tau(comp(\bar a))$ for every literal, so the rule sets exactly one of $a, \bar a$ true: a consistent assignment. Write $\tau(a)$ for $\tau(comp(a))$; along any edge $p \to q$ we have $\tau(p) \le \tau(q)$. Suppose a clause $(a \vee b)$ were false: $a$ and $b$ both false, so $\tau(a) < \tau(\bar a)$ and $\tau(b) < \tau(\bar b)$. The clause's edges $\bar a \to b$ and $\bar b \to a$ give $\tau(\bar a) \le \tau(b)$ and $\tau(\bar b) \le \tau(a)$. Chaining,
$$\tau(a) < \tau(\bar a) \le \tau(b) < \tau(\bar b) \le \tau(a),$$
a contradiction. So every clause is satisfied. ∎

Since Kosaraju–Sharir and Tarjan number components sink-first, the rule becomes: $a$ is true iff $a$'s component was **found before** $\bar a$'s. Total time $O(n + m)$.

**Try it first.** A conference has $n$ talks, each to be scheduled in the morning or the afternoon. You are given: a list of pairs of talks that share a speaker (they must be in **different** halves of the day); a list of pairs that must **not both** be in the afternoon (room shortage); and a list of talks whose speakers can only come in the morning. Decide whether a valid schedule exists, in time linear in the input size.

~~~reveal Solution: modeling as 2SAT
**Variables.** $x_i$ = "talk $i$ is in the morning" ($\bar x_i$ = afternoon).

**Clauses.**
- Shared speaker $\{i, j\}$: different halves means $x_i \ne x_j$, i.e., $(x_i \vee x_j) \wedge (\bar x_i \vee \bar x_j)$ ("at least one morning" and "at least one afternoon").
- Not both afternoon $\{i, j\}$: $(x_i \vee x_j)$.
- Morning only, talk $i$: the unit clause $(x_i)$, written $(x_i \vee x_i)$.

Valid schedules correspond exactly to satisfying assignments, since each constraint is equivalent to its clause(s).

**Algorithm.** Build the implication graph ($2n$ literal vertices; each clause $(a \vee b)$ adds $\bar a \to b$ and $\bar b \to a$), compute SCCs, and answer "no schedule" iff some $x_i$ and $\bar x_i$ share a component. Otherwise read off the schedule with the topological-order rule.

**Time.** With $p$ constraint pairs and $q$ morning-only talks, there are at most $2p + q$ clauses, so the graph has $2n$ vertices and $O(p+q)$ edges; SCCs take $O(n + p + q)$, linear in the input.

**Watch out.** Before reaching for 2SAT, check that every constraint really is a conjunction of 2-clauses. "At least two of talks $i, j, k$ in the morning" is fine: $(x_i \vee x_j) \wedge (x_j \vee x_k) \wedge (x_i \vee x_k)$. But "at least one of $i, j, k$ in the morning" is a genuine 3-clause and cannot be rewritten with 2-clauses over the same variables; problems built from such constraints are 3SAT-like and NP-hard in general.
~~~

## Common exam problem patterns

Most DFS/DAG/SCC exam problems are one of the following. Recognize the pattern, then apply the recipe and write the standard pieces.

**1. "Is there a valid order / schedule?"**
*Recipe:* vertex per task, edge $p \to c$ per precedence constraint. A valid order exists iff the graph is a DAG; produce it by topological sort (decreasing post, or Kahn). If inconsistent, the back edge gives an explicit cycle. $O(V+E)$.

**2. "Fewest rounds / earliest finish / critical path."**
*Recipe:* DAG DP over the precedence graph: $S(v) = 1 + \max_{u \to v} S(u)$ (or with durations, $\text{finish}(v) = d(v) + \max_{u \to v}\text{finish}(u)$), evaluated in topological order. Prove necessity (a chain forces that many rounds) and sufficiency (schedule each task at its earliest time).

**3. "Best path / count paths in an acyclic structure."** Grids where you only move right/down, increasing sequences, nesting boxes, word chains, prerequisite chains.
*Recipe:* (1) say what the vertices and edges are and **why the graph is acyclic** (some quantity strictly increases along each edge); (2) English definition of $f(v)$; (3) recurrence with base cases and the $-\infty$ / 0 conventions; (4) evaluation order = reverse topological (or the natural sorted order); (5) time = (time to build the DAG) + $O(V+E)$, in terms of the original input.

**4. "Cycles let you repeat for free."** Collect coins, max reachable value, can you get from $s$ to $t$ collecting something, infinite walks.
*Recipe:* compute SCCs, contract to the condensation, aggregate per component (sum, max, OR, "has a cycle"), then DAG DP. Justify both directions: inside a component you can collect everything and exit anywhere; a walk can never return to a component it left.

**5. "Mutual reachability / fixing connectivity."** Is every vertex reachable from some vertex? Can one edge make it strongly connected? Minimum edges to add?
*Recipe:* reason about **sources and sinks** of the condensation. A root exists iff there is exactly one source component; a vertex reachable from all exists iff exactly one sink component; one extra edge suffices iff exactly one source and one sink; in general $\max(\#\text{sources}, \#\text{sinks})$ edges (0 if already one SCC).

**6. "Boolean choices with pairwise constraints."** Each item is in one of two states; constraints mention at most two items.
*Recipe:* 2SAT. Variables, clauses for each constraint type, implication graph ($2n$ vertices, two edges per clause), SCCs, check $x$ versus $\bar x$. Time linear in $n$ plus the number of constraints.

**7. "Reasoning about a DFS."** True/false statements about pre/post numbers, or "which edge types are possible?".
*Recipe:* use the parenthesis lemma (nested = ancestor/descendant, otherwise disjoint), the edge-type table, the rule that edges between disjoint intervals point from the later interval to the earlier one, and the post-order lemma. For a "false" statement, give a tiny counterexample with an explicit DFS order.

**8. "Edges or vertices on cycles."**
*Recipe:* $u \to v$ is on a cycle iff $comp(u) = comp(v)$; $v$ is on a cycle iff its SCC has $\ge 2$ vertices or a self-loop. Combine with reachability from $s$ and to $t$ (search in $G$ and in $rev(G)$) for questions like "infinitely many walks from $s$ to $t$".

## Where students lose points

- **Wrong order.** Saying "increasing post order is a topological order" (it is the *reverse*), or "pre order is a topological order" (false: with edges $a \to c$, $b \to c$ and DFS order $a, c, b$, pre order puts $c$ before $b$).
- **Smallest post = sink SCC.** False in general graphs (true only in DAGs). Only the **largest** post is guaranteed to be in a source SCC.
- **Running DAG DP on a graph with cycles.** If the problem's graph can have cycles, you must either prove it is acyclic (point to a strictly increasing quantity) or contract SCCs first. Applying the longest-path recurrence to a cyclic graph is circular and gets no credit.
- **Claiming longest path is easy in general.** "Negate weights and run Bellman–Ford/Dijkstra" does not compute longest simple paths in general graphs; that problem is NP-hard.
- **Forgetting how the new graph is built.** "Build the condensation and run DP" is not enough: say what each meta-vertex stores, how meta-edges are found (scan all edges, compare component labels), and that this takes $O(V+E)$.
- **Running time of the wrong graph.** If you build a DAG of size $N$ from an input of size $n$ (boxes, grid cells, words), state the time in terms of $n$, including the time to construct the edges (e.g., $O(n^2 d)$ to compare all pairs of $d$-dimensional boxes).
- **Base cases and impossible states.** Forgetting $-\infty$ for "cannot reach $t$", or using 0 for both "empty path" and "impossible". Say explicitly what an empty max/min/sum is.
- **Edge cases in SCC arguments.** Forgetting that a single SCC needs 0 extra edges; forgetting self-loops when deciding whether a vertex is on a cycle; treating an isolated meta-vertex as only a source or only a sink.
- **Two statuses instead of three.** In cycle detection, an edge to a *marked* vertex is not a cycle; only an edge to an *active* vertex is.
- **2SAT edges.** Each clause $(a \vee b)$ needs **both** edges $\bar a \to b$ and $\bar b \to a$. Writing $a \to b$ is a logic error that changes the problem.

## Summary

| Task | Method | Time |
|---|---|---|
| Edge classification | DFS with pre/post | $O(V+E)$ |
| Cycle detection | back edge (edge into an active vertex)? | $O(V+E)$ |
| Topological sort | decreasing post / Kahn | $O(V+E)$ |
| Lexicographically smallest topological order | Kahn with a min-heap | $O(E + V\log V)$ |
| Longest/shortest path, path counting in DAG | DP in reverse topological order | $O(V+E)$ |
| All SCCs | Kosaraju–Sharir or Tarjan | $O(V+E)$ |
| Condensation | relabel edges by SCC | $O(V+E)$ |
| 2SAT with $n$ variables, $m$ clauses | SCCs of implication graph | $O(n+m)$ |

## Self-check

1. Edge $u \to v$ has $pre(v) < post(v) < pre(u) < post(u)$. What type is it, and does it say anything about cycles?

~~~reveal Answer
A **cross** edge: disjoint intervals with the head's first. On its own it says nothing about cycles; only back edges certify cycles. (It is consistent with a DAG.)
~~~

2. True or false: if $u$ can reach $v$ and $pre(u) < pre(v)$, then $v$ is a descendant of $u$.

~~~reveal Answer
**False.** Edges $a \to b$, $b \to a$, $a \to c$, DFS from $a$ visiting $b$ first: $b[2,3]$, $c[4,5]$. Then $b$ reaches $c$ (through $a$) and $pre(b) < pre(c)$, but $c$ is not a descendant of $b$. The white-path lemma needs a path of **new** vertices at time $pre(u)$; here the path goes through the active vertex $a$.
~~~

3. Why does Kosaraju–Sharir run its first DFS on $rev(G)$ rather than on $G$?

~~~reveal Answer
The largest post value of a DFS lands in a **source** SCC of the graph searched. Searching from a source SCC of $G$ would leak into other components. A source SCC of $rev(G)$ is a **sink** SCC of $G$, and a search in $G$ from a sink SCC marks exactly that component.
~~~

4. A DAG has $V$ vertices. How many SCCs does it have, and how many vertices does its condensation have?

~~~reveal Answer
$V$ of each: every SCC of a DAG is a single vertex, and the condensation is the DAG itself (minus any duplicate edges).
~~~

5. The condensation of $G$ has 4 components: two sources, one sink, and one component in the middle. What is the minimum number of edges to add to make $G$ strongly connected? Can one edge do it?

~~~reveal Answer
$\max(2, 1) = 2$. One edge cannot: both sources need a new incoming edge, and a single edge enters only one component.
~~~

6. Which edges of the implication graph does the clause $(\bar x \vee y)$ produce?

~~~reveal Answer
Edges $x \to y$ (if $x$ is true then $y$ must be) and $\bar y \to \bar x$ (if $y$ is false then $x$ must be false). Always add both.
~~~

7. You computed $LLP(v)$ when DFS finished $v$. Why were all of $v$'s out-neighbors already done?

~~~reveal Answer
In a DAG there are no back edges, so by the post-order lemma every edge $v \to w$ has $post(w) < post(v)$: $w$ finished first, and its value was filled in at that time.
~~~

8. Why is counting $s$-$t$ paths through a required vertex $x$ simply $A(x) \cdot B(x)$ in a DAG, but not in a general graph?

~~~reveal Answer
In a DAG, the $s \leadsto x$ part and the $x \leadsto t$ part can never share a vertex other than $x$ (a shared vertex would create a cycle through $x$), so every pair glues into a valid path. In a general graph the two parts may intersect, producing walks that are not paths, and cycles also make the number of walks infinite.
~~~

## Midterm 2 exam patterns

DFS/DAG/SCC questions on Midterm 2 combine this topic with dynamic programming and shortest paths. The recurring move is: **find (or create) a DAG, then do DP in topological order**. Sometimes the DAG is given; sometimes you prove a graph is acyclic because some quantity strictly increases along every edge; sometimes you build it (layers, BFS levels); and sometimes you get it by contracting strongly connected components.

### The shapes

| Shape | Where the DAG comes from | What you compute | Time |
|---|---|---|---|
| **DP over a topological order** | given, or "value/time/length strictly increases along edges" | longest/shortest path, number of paths, best reward | $O(V+E)$ plus building |
| **Layered (time-expanded) graph** | vertices $(v, i)$, edges only from layer $i$ to $i+1$ | best walk with exactly $k$ steps, deadlines | $O(k(V+E))$ |
| **Shortest-path DAG** | BFS levels: keep edges $u \to v$ with $d(v) = d(u) + 1$ | number of shortest paths, vertices on shortest paths | $O(V+E)$ |
| **Condensation + DP** | contract each SCC to one vertex with aggregated data | best value when cycles allow free repetition | $O(V+E)$ |
| **Sources and sinks of the condensation** | same | roots, seeds, edges needed for strong connectivity | $O(V+E)$ |
| **Games on a DAG** | the game graph has no cycles (e.g. tokens only move forward) | win/lose for every position | $O(V+E)$ |
| **DFS clock reasoning** | none | prove or refute statements about $pre$/$post$ | — |

Two facts do most of the work:

- **Why topological order needs a DAG.** In any linear order of the vertices of a directed cycle, the cycle vertex that comes first has an incoming cycle edge from a vertex that comes later. So no order of a cyclic graph has all edges pointing forward. And every DAG does have one (decreasing post). That is also exactly why the DP's dependency graph must be acyclic: otherwise some value depends on itself.
- **Sink versus source components.** A search from any vertex of a **sink** SCC marks exactly that SCC; a search from a **source** SCC may mark everything downstream. The vertex with the largest post always lies in a source SCC of the searched graph, but the vertex with the smallest post need not lie in a sink SCC. Kosaraju–Sharir uses $rev(G)$ precisely to turn sources into sinks.

### A DAG-DP template that earns full credit

1. **The DAG.** Vertices, edges (and weights). Why it is acyclic: "edges go from layer $i$ to layer $i+1$", "the value strictly increases along every edge", or "it is the condensation". If the given graph may have cycles, contract SCCs first and *say how each component's data is aggregated*.
2. **Subproblem in English.** "$f(v)$ = the maximum total reward of a path that starts at $v$ and ends at $t$, or $-\infty$ if no such path exists."
3. **Recurrence with base cases**, including the empty-max convention ($-\infty$ for "impossible", $0$ for "empty path allowed").
4. **Evaluation order.** Reverse topological order for "paths starting at $v$"; topological order for "paths ending at $v$". Say where the answer is.
5. **Time** in the ORIGINAL input, including building the DAG, computing SCCs, and the topological sort.

### Mistakes that cost the most points

- **DP on a graph that might have cycles.** The recurrence is circular. Either prove acyclicity or contract SCCs.
- **Wrong order.** Increasing post order is *reverse* topological order; pre order is neither.
- **Using a sum where the aggregation must be idempotent.** "Number of vertices reachable from $v$" is not $1 + \sum_{v \to w} reach(w)$: two successors can reach the same vertex, which gets counted twice. Max, min, OR and "reachable at all" are safe; sums over *paths* (path counting) are fine because different paths are different objects.
- **Dijkstra on a DAG with negative edges.** Unnecessary and possibly wrong; the topological-order DP handles any real weights in $O(V+E)$.
- **Forgetting the size of the built DAG.** A layered graph with $k+1$ layers has $(k+1)V$ vertices and $kE$ edges; the condensation has at most $V$ vertices and $E$ edges; a "compare all pairs" DAG on $n$ items has up to $\binom n2$ edges.
- **Smallest post = sink SCC.** False in general graphs.
- **Not justifying condensation aggregation.** Say why it is valid: inside an SCC you can visit everything and leave from anywhere; a walk can never return to a component it has left.

### Worked example: counting shortest paths

**Try it first.** Given an unweighted directed graph $G$ and a vertex $s$, compute for every vertex $v$ the number $\sigma(v)$ of distinct shortest paths from $s$ to $v$, in $O(V+E)$ arithmetic operations.

~~~~reveal Solution: counting shortest paths
**Step 1: BFS.** Run BFS from $s$ to get $d(v)$ for every $v$.

**Step 2: the shortest-path DAG.** Keep exactly the edges $u \to v$ with $d(v) = d(u) + 1$ (both finite). Call this graph $D$. It is a DAG because $d$ strictly increases along every kept edge. A path from $s$ to $v$ is a shortest path iff it uses only kept edges: a path of length $d(v)$ visits vertices at distances $0, 1, \dots, d(v)$ in order (the $i$-th vertex has distance at most $i$ because of the prefix, and at least $i$, or else the path could be shortened), so each of its edges is kept; conversely, a path in $D$ from $s$ to $v$ has exactly $d(v)$ edges.

**Step 3: DP.** $\sigma(s) = 1$, and for $v \ne s$
$$\sigma(v) = \sum_{u \to v \text{ kept}} \sigma(u),$$
evaluated in increasing order of $d$ (the BFS order is a topological order of $D$). Unreachable vertices get $\sigma = 0$.

**Time.** BFS, one scan of the edges and one pass of the DP: $O(V+E)$ arithmetic operations.

~~~graph
directed
s a
s b
a c
b c
a d
b e
e d
c t
d t
t a
~~~

~~~steps Counting shortest paths from s on the graph above
**BFS distances.** $d(s) = 0$; $d(a) = d(b) = 1$; $d(c) = d(d) = d(e) = 2$; $d(t) = 3$.
+++
**Keep or drop each edge.** Kept: $s \to a$, $s \to b$, $a \to c$, $b \to c$, $a \to d$, $b \to e$, $c \to t$, $d \to t$. Dropped: $e \to d$ (both at distance 2) and $t \to a$ (goes from distance 3 to distance 1). The dropped edges lie on no shortest path from $s$.
+++
**Distance 0 and 1.** $\sigma(s) = 1$. $\sigma(a) = \sigma(s) = 1$, $\sigma(b) = \sigma(s) = 1$.
+++
**Distance 2.** $\sigma(c) = \sigma(a) + \sigma(b) = 2$. $\sigma(d) = \sigma(a) = 1$ (the edge $e \to d$ was dropped). $\sigma(e) = \sigma(b) = 1$.
+++
**Distance 3.** $\sigma(t) = \sigma(c) + \sigma(d) = 3$: the paths $s\,a\,c\,t$, $s\,b\,c\,t$, $s\,a\,d\,t$. The walk $s\,b\,e\,d\,t$ has length 4 and is correctly not counted.
~~~
~~~~

### Worked example: a game on a DAG

**Try it first.** A token sits on a vertex of a DAG $G$. Two players alternate moving the token along one outgoing edge; a player who cannot move (the token is on a sink) **loses**. For every vertex $v$, decide whether the player about to move from $v$ wins with perfect play. Give an $O(V+E)$ algorithm and prove it correct.

~~~~reveal Solution: winning positions
**Subproblem.** $W(v)$ = TRUE iff the player to move from $v$ can force a win.

**Recurrence.** $W(v) = $ TRUE iff some edge $v \to w$ has $W(w) = $ FALSE. In particular a sink (no edges) has $W(v) = $ FALSE: the "exists" over an empty set is false, which matches the rule that a player who cannot move loses.

**Why it is correct.** By induction in reverse topological order (every $w$ with $v \to w$ is handled before $v$). If some move leads to a position $w$ that is losing for the player to move there (the opponent), moving there wins. If every move leads to a winning position for the opponent, then whatever we do, the opponent wins. The DAG guarantees the game ends (every play is a path, of length less than $V$) and that the recursion is well founded.

**Order and time.** Evaluate in increasing post order (reverse topological), or memoize inside DFS when each vertex finishes. One pass over the edges: $O(V+E)$.

~~~graph
directed
a b
a c
b d
c d
c e
d f
e f
~~~

~~~steps Evaluating W in reverse topological order f, d, e, b, c, a
**$f$** is a sink: $W(f) = $ FALSE.
+++
**$d$** can move to $f$, which is losing for the opponent: $W(d) = $ TRUE. Likewise **$e$**: $W(e) = $ TRUE.
+++
**$b$** can only move to $d$, a winning position for the opponent: $W(b) = $ FALSE.
+++
**$c$** can move to $d$ or $e$, both winning for the opponent: $W(c) = $ FALSE.
+++
**$a$** can move to $b$ (losing for the opponent): $W(a) = $ TRUE. The winning first move from $a$ is $a \to b$; moving to $c$ would hand the win to the opponent.
~~~

**What if the graph has cycles?** Then play can go on forever and positions can be *draws*. The recurrence is circular, and one needs the more careful "retrograde analysis" that labels positions starting from the sinks. The DAG is what makes the simple DP valid.
~~~~
`,

  cheatsheet: String.raw`
**DFS clock.** $pre(v)$ when discovered, $post(v)$ when finished; statuses new / active / finished. Active vertices = the current root-to-vertex path. Intervals are nested (ancestor/descendant) or disjoint. $O(V+E)$.

**White-path lemma.** $v$ becomes a descendant of $u$ iff at time $pre(u)$ there is a $u \leadsto v$ path of new vertices.

**Edge $u\to v$ types** (by status of $v$ when examined).
| Status of $v$ | Type | Pattern |
|---|---|---|
| new | tree | $pre(u) < pre(v) < post(v) < post(u)$ |
| finished, $pre(u) < pre(v)$ | forward | same as tree |
| active | back | $pre(v) \le pre(u) < post(u) \le post(v)$ |
| finished, $pre(v) < pre(u)$ | cross | $pre(v) < post(v) < pre(u) < post(u)$ |
Edges between disjoint intervals point from later to earlier. Undirected DFS: only tree and back edges.

**Post-order lemma.** For edge $u \to v$: $post(u) > post(v)$ unless it is a back edge.

**Cycle** $\iff$ some back edge (edge to an *active* vertex).

**Topological sort** = decreasing post order (DAG has no back edges). Or Kahn: repeatedly remove a source (min-heap ⇒ lexicographically smallest order). $O(V+E)$. Largest post = a source; smallest post = a sink (in a DAG only).

**DAG DP.** Evaluate in reverse topological order = increasing post order.
- $LLP(v) = \max(0, \max_{v\to w} \ell(vw) + LLP(w))$; fixed endpoint $t$: use $-\infty$ for "cannot reach $t$".
- $N(v) = \sum_{v \to w} N(w)$, $N(t) = 1$.
- Through required $x$: (paths $s \leadsto x$) $\times$ (paths $x \leadsto t$); longest: $F(x) + G(x)$.
Longest path: NP-hard in general, $O(V+E)$ in DAGs.

**SCCs.** Condensation $scc(G)$ is a DAG. Edge $C \to C'$ ⇒ max post in $C$ > max post in $C'$. Largest post ⇒ source SCC. (Smallest post does NOT give a sink SCC.) $u \to v$ on a cycle iff same SCC.

**Kosaraju–Sharir.** DFS on $rev(G)$ → post order. In decreasing order, search $G$ from each unmarked vertex; each search = one SCC (sink-first). $O(V+E)$. **Tarjan:** one DFS; root of SCC iff $low(v) = pre(v)$.

**Sources/sinks of the condensation** ($k \ge 2$ components, $p$ sources, $q$ sinks).
- root (reaches all) exists iff $p = 1$; vertex reached by all exists iff $q = 1$
- one added edge suffices iff $p = q = 1$ (edge from sink to source)
- min edges to make strongly connected: $\max(p, q)$; 0 if $k = 1$

**2SAT.** Clause $(a \vee b)$ ⇒ edges $\bar a \to b$, $\bar b \to a$. Unsatisfiable iff $x$, $\bar x$ share an SCC. Else set $a$ true iff $comp(a)$ is later in topological order than $comp(\bar a)$ (found earlier by Kosaraju/Tarjan). $O(n+m)$.

**Which algorithm when.**
| Question | Tool | Time |
|---|---|---|
| order / schedule exists? | cycle detection + topological sort | $O(V+E)$ |
| fewest rounds, critical path | DAG DP (longest path) | $O(V+E)$ |
| best/count paths, acyclic | DAG DP in topological order | $O(V+E)$ |
| best/count with cycles allowed, repeats free | SCCs + DP on condensation | $O(V+E)$ |
| mutual reachability, fix connectivity | sources/sinks of condensation | $O(V+E)$ |
| pairwise boolean constraints | 2SAT via SCCs | $O(n+m)$ |
| vertex/edge on a cycle | SCC labels (size $\ge 2$ or self-loop) | $O(V+E)$ |
| longest simple path, general graph | NP-hard — look for structure | — |

**Modeling answer template.**
1. Graph: vertices = ?, edges = ? (and weights); how they are built and in what time.
2. Why it is a DAG (strictly increasing quantity), or "compute SCCs and contract".
3. Subproblem in English; recurrence with base cases ($-\infty$, 0, 1).
4. Evaluation order (reverse topological), where the answer is read.
5. Correctness: solutions ↔ paths in the (condensed) graph.
6. Running time in terms of the ORIGINAL input.

### Exam checklist

- Is the graph a DAG? Point to a strictly increasing quantity, a layer index, or contract SCCs first. Never run a DAG DP on a graph that may have cycles.
- English definition of $f(v)$; recurrence with base cases; empty max $= -\infty$ ("impossible") vs $0$ ("may stop here").
- Order: reverse topological (= increasing post) for "paths starting at $v$"; topological for "paths ending at $v$".
- Condensation: say what each component stores (sum, max, OR, has-a-cycle) and why that is valid.
- Aggregations over reachable SETS must be idempotent (max, min, OR); sums over reachable vertices double-count.
- Negative weights in a DAG: topological DP, not Dijkstra, not Bellman–Ford.
- Largest post ⇒ source SCC. Search from a sink SCC marks exactly that SCC.
- Edge between disjoint DFS intervals points from the later interval to the earlier one; back edge ⇔ cycle.
- Time in the ORIGINAL input: building the DAG (e.g. $O(n^2)$ comparisons), SCCs $O(V+E)$, DP $O(V+E)$, layered graphs $O(k(V+E))$.
`,

  quiz: [
    {
      type: 'mc',
      q: String.raw`After DFSAll on a directed graph, an edge $u \to v$ has $pre(v) < pre(u) < post(u) < post(v)$. What type of edge is it?`,
      choices: ['Tree edge', 'Forward edge', 'Back edge', 'Cross edge'],
      answer: 2,
      explain: String.raw`The interval of $u$ is nested inside the interval of $v$, so $u$ is a descendant of $v$: the edge points from a descendant to an ancestor, which is a back edge. Tree/forward edges have $u$'s interval containing $v$'s; cross edges have disjoint intervals with $v$'s first.`
    },
    {
      type: 'tf',
      q: String.raw`In DFS of a directed graph, it is possible to have a cross edge $u \to v$ with $pre(u) < pre(v)$.`,
      answer: false,
      explain: String.raw`If $pre(u) < pre(v)$ and the intervals are disjoint, then $v$ was still new (unmarked) when $u$ examined the edge $u \to v$ (because $u$ finished before $v$ started). But then DFS would have visited $v$ from $u$, making $v$ a descendant. So cross edges always go from a later-discovered vertex to an already-finished one.`
    },
    {
      type: 'mc',
      q: 'Which ordering of the vertices of a DAG is guaranteed to be a topological order?',
      choices: ['Increasing pre order', 'Decreasing pre order', 'Increasing post order', 'Decreasing post order'],
      answer: 3,
      explain: String.raw`In a DAG there are no back edges, so every edge $u \to v$ has $post(u) > post(v)$: sorting by decreasing post puts tails before heads. Increasing pre order fails: e.g., with edges $a \to c$ and $b \to c$ and DFS order $a, c, b$, pre order puts $c$ before $b$ even though $b \to c$. Increasing post order is a *reverse* topological order (useful for DP evaluation).`
    },
    {
      type: 'tf',
      q: 'A directed graph has a cycle if and only if DFSAll finds at least one back edge.',
      answer: true,
      explain: String.raw`A back edge $u \to v$ plus the tree path $v \leadsto u$ is a cycle. Conversely, without back edges every edge decreases post, which is impossible around a cycle. Note that forward and cross edges do **not** indicate cycles.`
    },
    {
      type: 'mc',
      q: 'DFS is run on a connected UNDIRECTED graph. Which edge types can occur?',
      choices: ['Tree edges only', 'Tree and back edges only', 'Tree, back and cross edges', 'All four types'],
      answer: 1,
      explain: String.raw`If $uv$ is an edge and $u$ is discovered first, then $v$ is discovered before $u$ finishes (DFS explores $u$'s neighbors), so $v$ is a descendant of $u$. Hence every non-tree edge connects an ancestor and a descendant: a back edge (seen from the descendant end). Cross edges cannot occur.`
    },
    {
      type: 'tf',
      q: 'The strong-component graph (condensation) of any directed graph is acyclic.',
      answer: true,
      explain: String.raw`A cycle through components $C_1 \to C_2 \to \dots \to C_1$ would make all of their vertices mutually reachable, contradicting that they are distinct (maximal) SCCs.`
    },
    {
      type: 'mc',
      q: 'After DFSAll on an arbitrary directed graph G, the vertex with the LARGEST post value is guaranteed to lie in...',
      choices: ['a sink SCC of G', 'a source SCC of G', 'the largest SCC of G', 'an SCC with at least two vertices'],
      answer: 1,
      explain: String.raw`Key lemma: an edge $C \to C'$ between SCCs implies $\max post(C) > \max post(C')$. So the component containing the overall maximum has no incoming edges in the condensation: it is a source SCC. That is why Kosaraju–Sharir runs DFS on $rev(G)$: a source SCC of $rev(G)$ is a sink SCC of $G$.`
    },
    {
      type: 'tf',
      q: 'After DFSAll on a directed graph G, the vertex with the SMALLEST post value always lies in a sink SCC of G.',
      answer: false,
      explain: String.raw`Counterexample: edges $a \to b$, $b \to a$, $a \to c$; DFS from $a$ visits $b$ first. Then $b$ finishes first (smallest post), but $\{a,b\}$ is a source component with an edge to the sink $\{c\}$. The guarantee holds only for the **maximum** post (which lands in a source SCC). In a DAG, however, the smallest post is a sink.`
    },
    {
      type: 'multi',
      q: 'Which of the following can be solved in O(V+E) time? (select all that apply)',
      choices: [
        'Longest path in a DAG with arbitrary (possibly negative) edge weights',
        'Longest simple path in a general directed graph',
        'Counting the number of s-t paths in a DAG (counting arithmetic operations as O(1))',
        'Finding all strongly connected components of a directed graph'
      ],
      answer: [0, 2, 3],
      explain: String.raw`In a DAG, longest path and path counting are DP over a topological order, linear time regardless of weight signs. SCCs take $O(V+E)$ with Kosaraju–Sharir or Tarjan. Longest simple path in a general graph is NP-hard (it would solve Hamiltonian path).`
    },
    {
      type: 'mc',
      q: String.raw`How many topological orderings does the DAG with edges $a \to b$, $a \to c$, $b \to d$, $c \to d$ have?`,
      choices: ['1', '2', '3', '4'],
      answer: 1,
      explain: String.raw`$a$ must be first (only source) and $d$ last (only sink). $b$ and $c$ are incomparable, so they can appear in either order: $a,b,c,d$ and $a,c,b,d$. A DAG has a unique topological order exactly when it has a Hamiltonian path (consecutive vertices joined by edges).`
    },
    {
      type: 'tf',
      q: "In Kahn's algorithm, if at some point vertices remain but none has in-degree 0 (among the remaining vertices), then the graph contains a directed cycle.",
      answer: true,
      explain: String.raw`If every remaining vertex has an incoming edge from another remaining vertex, walk backward along incoming edges forever; since there are finitely many vertices, some vertex repeats, giving a cycle. So Kahn's algorithm doubles as a cycle detector.`
    },
    {
      type: 'mc',
      q: 'In Kosaraju–Sharir (DFS on rev(G) first, then searches in G in decreasing order of the rev(G) post values), the FIRST search in G discovers exactly...',
      choices: ['a source SCC of G', 'a sink SCC of G', 'the SCC containing vertex 1', 'all vertices reachable from a source of G'],
      answer: 1,
      explain: String.raw`The vertex with the largest $rev(G)$-post lies in a source SCC of $rev(G)$, which is a sink SCC of $G$. A search in $G$ from inside a sink SCC cannot leave it, and it reaches the whole SCC, so it marks exactly that component.`
    },
    {
      type: 'tf',
      q: 'A 2CNF formula is unsatisfiable if and only if some variable x has x and NOT x in the same strongly connected component of its implication graph.',
      answer: true,
      explain: String.raw`If $x \leadsto \bar x$ and $\bar x \leadsto x$, then any assignment makes some implication chain fail. Conversely, if no such pair exists, assigning true to each literal whose SCC comes later in topological order of the condensation gives a satisfying assignment. This gives a linear-time 2SAT algorithm.`
    },
    {
      type: 'mc',
      q: String.raw`You compute $LLP(v)$ (longest path starting at $v$) for a DAG by memoized recursion inside DFS, filling in $LLP(v)$ when DFS finishes $v$. Why are all the values $LLP(w)$ for out-neighbors $w$ available at that moment?`,
      choices: [
        'Because DFS visits vertices in topological order',
        String.raw`Because in a DAG every edge $v \to w$ has $post(w) < post(v)$, so $w$ finished earlier`,
        'Because DFS processes sinks first',
        'They are not always available; you need a second pass'
      ],
      answer: 1,
      explain: String.raw`No back edges in a DAG, so by the post-order lemma every out-neighbor finishes before $v$. Increasing post order is a reverse topological order, exactly the evaluation order the recurrence needs.`
    },
    {
      type: 'tf',
      q: 'In a DAG, the vertex with the smallest post value (after DFSAll) is a sink.',
      answer: true,
      explain: String.raw`If $v$ had an out-edge $v \to w$, then (no back edges in a DAG) the post-order lemma gives $post(w) < post(v)$, contradicting minimality. Contrast with general graphs, where the smallest post need not lie in a sink SCC.`
    },
    {
      type: 'mc',
      q: 'What is the running time of Kosaraju–Sharir if the graph is given as an adjacency MATRIX?',
      choices: [String.raw`$O(V+E)$`, String.raw`$O(V^2)$`, String.raw`$O(V^2 \log V)$`, String.raw`$O(VE)$`],
      answer: 1,
      explain: String.raw`Both passes are graph searches; with a matrix, listing the neighbors of a vertex costs $O(V)$, so each pass is $O(V^2)$. (Reversing a matrix graph is just reading the transpose.) The $O(V+E)$ bound assumes adjacency lists; you could also convert the matrix to lists in $O(V^2)$ first.`
    },
    {
      type: 'mc',
      q: String.raw`After DFSAll, an edge $u \to v$ satisfies $pre(u) < pre(v) < post(v) < post(u)$. Which types are possible?`,
      choices: ['Tree only', 'Tree or forward', 'Back or cross', 'Cross only'],
      answer: 1,
      explain: String.raw`The head's interval is nested inside the tail's, so $v$ is a descendant of $u$. If $v$ was discovered through this very edge it is a tree edge; otherwise it is a forward edge. The intervals alone cannot distinguish the two; the parent pointers can.`
    },
    {
      type: 'tf',
      q: 'The longest simple path in a general directed graph can be computed in O(VE) time by negating all edge lengths and running Bellman–Ford.',
      answer: false,
      explain: String.raw`Negating turns every positive-length cycle into a negative cycle, so Bellman–Ford reports a negative cycle instead of a simple path. Longest simple path is NP-hard in general (it solves Hamiltonian path). The negation trick is valid only in DAGs, where there are no cycles at all.`
    },
    {
      type: 'tf',
      q: 'In every DAG, every source vertex has a larger post value than every sink vertex (for any DFS order).',
      answer: false,
      explain: String.raw`Only the extreme vertices are guaranteed: the largest post is a source and the smallest is a sink. Counterexample: edge $a \to b$ plus an isolated vertex $c$, DFSAll in order $a, b, c$: $a[1,4]$, $b[2,3]$, $c[5,6]$. Then $c$ is a sink with post 6, larger than the post 4 of the source $a$.`
    },
    {
      type: 'mc',
      q: 'The condensation of a directed graph G has 7 components, of which 3 are sources and 5 are sinks (no component is both). What is the minimum number of new edges needed to make G strongly connected?',
      choices: ['3', '5', '7', '8'],
      answer: 1,
      explain: String.raw`Each sink component needs a new outgoing edge, and one new edge leaves only one component, so at least 5 edges are needed; similarly at least 3 for the sources. The theorem of Eswaran and Tarjan says $\max(\#\text{sources}, \#\text{sinks}) = 5$ edges always suffice when there are at least two components.`
    },
    {
      type: 'tf',
      q: 'If G is not strongly connected, adding one edge from a vertex in some sink SCC to a vertex in some source SCC always makes G strongly connected.',
      answer: false,
      explain: String.raw`This works only when the condensation has exactly one source and exactly one sink. With two sinks $Z_1, Z_2$, one new edge can give an outgoing edge to only one of them, so the other still cannot reach anything outside itself.`
    },
    {
      type: 'mc',
      q: String.raw`Which edges does the 2SAT clause $(x \vee \bar y)$ add to the implication graph?`,
      choices: [
        String.raw`$x \to \bar y$ and $y \to \bar x$`,
        String.raw`$\bar x \to \bar y$ and $y \to x$`,
        String.raw`$\bar x \to y$ and $\bar y \to x$`,
        String.raw`only $\bar x \to \bar y$`
      ],
      answer: 1,
      explain: String.raw`A clause $(a \vee b)$ gives $\bar a \to b$ and $\bar b \to a$. With $a = x$, $b = \bar y$: $\bar x \to \bar y$ (if $x$ is false, $y$ must be false) and $y \to x$ (if $y$ is true, $x$ must be true). Both edges are needed; the graph must be skew-symmetric.`
    },
    {
      type: 'tf',
      q: 'If DFS is started at a source of a DAG, the order in which vertices are first discovered (pre order) is a topological order.',
      answer: false,
      explain: String.raw`Counterexample: edges $s \to a$, $s \to b$, $b \to a$. DFS from $s$ visiting $a$ first discovers $s, a, b$, but the edge $b \to a$ requires $b$ before $a$. Decreasing **post** order ($s, b, a$) is correct.`
    },
    {
      type: 'multi',
      q: 'Which of the following prove that a directed graph is NOT a DAG? (select all that apply)',
      choices: [
        'DFSAll finds a back edge',
        'DFSAll finds a cross edge',
        "Kahn's algorithm stops with vertices remaining, none of in-degree 0",
        'Some SCC contains at least two vertices',
        'Some vertex has in-degree 0'
      ],
      answer: [0, 2, 3],
      explain: String.raw`A back edge closes a cycle with the tree path; Kahn getting stuck means every remaining vertex has an in-edge from a remaining vertex, which forces a cycle; two mutually reachable vertices lie on a common closed walk, hence on a cycle. Cross edges and sources occur in DAGs all the time.`
    },
    {
      type: 'mc',
      q: String.raw`In Tarjan's SCC algorithm, what does $low(v) = pre(v)$ mean when DFS finishes $v$?`,
      choices: [
        String.raw`$v$ is a sink of $G$`,
        String.raw`$v$ is the first-discovered vertex (root) of its SCC, so the SCC can be popped off the stack now`,
        String.raw`$v$ lies on no cycle`,
        String.raw`$v$'s subtree contains a back edge`
      ],
      answer: 1,
      explain: String.raw`$low(v) = pre(v)$ says nothing in $v$'s subtree can reach a still-unassigned vertex discovered before $v$, so $v$'s SCC consists exactly of $v$ and the vertices above it on Tarjan's stack. It does not mean $v$ is on no cycle: $v$ can be the root of a large SCC.`
    },
    {
      type: 'mc',
      q: String.raw`In a DAG, $A(x)$ is the number of paths from $s$ to $x$ and $B(x)$ the number of paths from $x$ to $t$. How many $s$-$t$ paths pass through $x$?`,
      choices: [String.raw`$A(x) + B(x)$`, String.raw`$A(x) \cdot B(x)$`, String.raw`$\max(A(x), B(x))$`, String.raw`$A(t) - A(x)$`],
      answer: 1,
      explain: String.raw`Each such path splits uniquely at $x$ into an $s \leadsto x$ part and an $x \leadsto t$ part, and in a DAG every pair of parts glues into a path (they cannot share another vertex without creating a cycle). So the count is the product.`
    },
    {
      type: 'mc',
      q: String.raw`DFS(u) examines the edge $u \to v$ and finds $v$ already **finished**. Which edge types are possible?`,
      choices: ['Tree or back', 'Forward or cross', 'Back only', 'Cross only'],
      answer: 1,
      explain: String.raw`A finished head rules out tree (head new) and back (head active). It is forward if $pre(u) < pre(v)$ ($v$ was discovered and finished inside $u$'s call) and cross if $pre(v) < pre(u)$. Either way $post(v) < post(u)$, consistent with the post-order lemma.`
    },
    {
      type: 'tf',
      q: 'The number of distinct paths from s to t in a DAG with V vertices can be exponential in V.',
      answer: true,
      explain: String.raw`Chain diamonds: $s \to a_1, s \to b_1$, then $a_1, b_1 \to c_1$, and repeat from $c_1$. Each diamond doubles the count, giving $2^{\Theta(V)}$ paths. The DP still uses $O(V+E)$ arithmetic operations, but the numbers can have $\Theta(V)$ bits, which is why problems often ask for counts modulo $m$.`
    },
    {
      type: 'tf',
      q: 'If a directed graph has at least one vertex with no incoming edges and at least one vertex with no outgoing edges, then it is a DAG.',
      answer: false,
      explain: String.raw`Sources and sinks can coexist with a cycle elsewhere: $s \to a$, $a \to b$, $b \to a$, $b \to t$ has the source $s$, the sink $t$, and the cycle $a \to b \to a$. The implication only goes one way: every nonempty DAG has a source and a sink. To *prove* acyclicity, run DFS and check for back edges (or run Kahn's algorithm and check that it outputs every vertex).`
    },
    {
      type: 'mc',
      q: 'Why does a directed graph with a cycle have no topological order?',
      choices: [
        'Because DFS on a cyclic graph does not assign post numbers to every vertex',
        'Because in any ordering, the first cycle vertex in the order has an incoming cycle edge from a later vertex',
        "Because Kahn's algorithm runs forever on a cyclic graph",
        'Because a cyclic graph has no source vertex'
      ],
      answer: 1,
      explain: String.raw`Take any linear order and let $v$ be the earliest vertex of the cycle in it. The cycle edge entering $v$ comes from a cycle vertex that is later in the order, so that edge points backward. This is a property of the graph, not of any algorithm: DFS still numbers every vertex (it just finds a back edge), Kahn's algorithm stops with vertices left over, and a cyclic graph can certainly have a source (e.g. $s \to a \to b \to a$).`
    },
    {
      type: 'mc',
      q: String.raw`You compute the SCCs of a directed graph with $V$ vertices and $E$ edges, build the condensation $H$, topologically sort it and run a longest-path DP on it. What is the total running time?`,
      choices: [String.raw`$O(V+E)$`, String.raw`$O(V^2)$, because $H$ can have an edge between every pair of components`, String.raw`$O(VE)$, one search per component`, String.raw`$O(E \log V)$`],
      answer: 0,
      explain: String.raw`Every step is linear. SCCs: $O(V+E)$ (Kosaraju–Sharir or Tarjan). $H$ has at most $V$ vertices and at most $E$ edges, because every meta-edge comes from at least one original edge, and it is built by one scan of the edges. Topological sort and the DP on $H$ are $O(V+E)$ as well. $H$ can have $\Theta(V^2)$ edges only if $G$ already has that many edges, in which case $E = \Theta(V^2)$ too.`
    },
    {
      type: 'multi',
      q: 'DFSAll is run on a directed graph G (arbitrary vertex and adjacency orders). Which statements are ALWAYS true? (select all that apply)',
      choices: [
        'The vertex with the largest post value lies in a source SCC of G',
        'The vertex with the smallest pre value lies in a source SCC of G',
        'If u → v is a cross edge, then post(v) < pre(u)',
        'If pre(u) < pre(v) < post(u), then v is a descendant of u',
        'If G is a DAG, listing vertices in decreasing pre order gives a topological order'
      ],
      answer: [0, 2, 3],
      explain: String.raw`(A) is the key SCC lemma. (B) is false: DFSAll may start anywhere; with the single edge $b \to a$ and DFS starting at $a$, $a$ has the smallest pre but $\{a\}$ is a sink. (C) is the cross-edge pattern $pre(v) < post(v) < pre(u) < post(u)$. (D) holds because intervals are nested or disjoint, and here they overlap, so $v$'s interval is inside $u$'s. (E) is false: with edges $a \to c$, $b \to c$ and DFS order $a, c, b$, the pre values are $a{:}1$, $c{:}2$, $b{:}5$, so decreasing pre lists $b, c, a$, and the edge $a \to c$ points backward. Only decreasing **post** is guaranteed.`
    },
    {
      type: 'mc',
      q: 'A student implements Kosaraju–Sharir but runs the first DFS on G itself (not rev(G)), then searches G from each unmarked vertex in decreasing order of those post values. What goes wrong?',
      choices: [
        'Nothing; both versions are correct',
        'The first search starts in a source SCC of G and may mark several SCCs as one component',
        'The first search starts in a sink SCC of G and marks too little',
        'The algorithm becomes O(V^2)'
      ],
      answer: 1,
      explain: String.raw`The largest post of a DFS on $G$ lies in a **source** SCC of $G$. A search in $G$ from a source component reaches everything downstream, so unrelated components are lumped together. Example: $a \to b$ with DFS from $a$: $post(a) = 4 > post(b) = 3$, the second phase searches from $a$ in $G$ and marks $\{a, b\}$ as one SCC, although they are two. The two correct versions pair the passes oppositely: DFS on $rev(G)$ then search $G$, or DFS on $G$ then search $rev(G)$.`
    },
    {
      type: 'tf',
      q: 'A DAG with exactly one source and exactly one sink has exactly one topological order.',
      answer: false,
      explain: String.raw`The diamond $a \to b$, $a \to c$, $b \to d$, $c \to d$ has the unique source $a$ and unique sink $d$, but two topological orders, $a\,b\,c\,d$ and $a\,c\,b\,d$. The correct criterion: a DAG has a unique topological order iff consecutive vertices in (any) topological order are always joined by an edge, i.e. iff it has a Hamiltonian path.`
    },
    {
      type: 'mc',
      q: 'A DAG has real edge weights, some negative. What is the best way to compute shortest-path distances from s to every vertex?',
      choices: [
        "Dijkstra's algorithm, O(E log V)",
        'Bellman–Ford, O(VE)',
        'Relax the out-edges of each vertex in topological order, O(V+E)',
        'Add a large constant to every weight to make them positive, then run Dijkstra'
      ],
      answer: 2,
      explain: String.raw`In a DAG, $dist(v) = \min_{u \to v}(dist(u) + w(u \to v))$ with $dist(s) = 0$, evaluated in topological order: every predecessor is final before $v$ is processed, so negative weights are no problem and there are no cycles, hence no negative cycles. Dijkstra (finalizing each vertex once) can be wrong with negative edges. Bellman–Ford is correct but needlessly slow. Adding a constant changes which path is shortest, since paths with more edges get penalized more.`
    },
    {
      type: 'tf',
      q: 'In a DAG, if there is a path from u to v (u ≠ v), then post(u) > post(v) in every DFS of the graph.',
      answer: true,
      explain: String.raw`A DAG has no back edges, so by the post-order lemma every edge $x \to y$ has $post(x) > post(y)$. Along the path $u = x_0 \to x_1 \to \dots \to x_k = v$ the post values strictly decrease, so $post(u) > post(v)$. This is exactly why decreasing post order is a topological order. In a graph with cycles the statement fails for vertices in the same SCC.`
    },
    {
      type: 'mc',
      q: 'Let C be a SINK strongly connected component of G and x any vertex of C. A whatever-first search in G from x marks exactly...',
      choices: [
        'the vertices of C',
        'every vertex of G',
        'C together with every source component',
        'only x, unless C is a single vertex'
      ],
      answer: 0,
      explain: String.raw`From $x$ the search reaches all of $C$ (strongly connected), and it cannot leave $C$: a sink component has no edges to other components. This is the reason SCC algorithms want to start from a sink. From a **source** component, by contrast, the search marks the component and everything downstream of it.`
    },
    {
      type: 'multi',
      q: 'Which of the following can be computed by finding SCCs and then running a simple O(V+E) DP over the condensation? (select all that apply)',
      choices: [
        "The most coins collectable on a walk starting at s, if each vertex's coins can be collected once",
        'The longest simple path in G',
        'For every vertex v, the NUMBER of vertices reachable from v',
        'For every vertex v, whether v can reach some red vertex',
        'For every vertex v, the smallest value of any vertex reachable from v'
      ],
      answer: [0, 3, 4],
      explain: String.raw`Coins: sum the coins per component, then a max-path DP on the condensation from $comp(s)$. Red: OR per component, then propagate OR. Smallest value: min per component, then propagate min. These work because max, min and OR are **idempotent**: reaching the same vertex along two routes does no harm. Counting reachable vertices fails: $reach(C) = |C| + \sum_{C \to D} reach(D)$ double-counts vertices reachable through two successors (e.g. a diamond), and no linear-time algorithm for all counts is known. Longest simple path is NP-hard; the condensation does not help because a simple path cannot revisit vertices inside a component.`
    }
  ],

  flashcards: [
    { front: 'Parenthesis property of DFS', back: String.raw`For any $u, v$: intervals $[pre, post]$ are disjoint or nested; nested ($u$ contains $v$) iff $v$ is a descendant of $u$.` },
    { front: 'Interval pattern of a back edge u→v', back: String.raw`$pre(v) \le pre(u) < post(u) \le post(v)$ — $v$ is an ancestor (or $u = v$, a self-loop).` },
    { front: 'Interval pattern of a cross edge u→v', back: String.raw`$pre(v) < post(v) < pre(u) < post(u)$ — always points to an already-finished vertex, "backward in time".` },
    { front: 'Post-order lemma', back: String.raw`For an edge $u \to v$: $post(u) < post(v)$ iff it is a back edge. Hence in a DAG every edge has $post(u) > post(v)$.` },
    { front: 'How to detect a directed cycle', back: 'Run DFS; a cycle exists iff some edge reaches an ACTIVE vertex (a back edge). O(V+E).' },
    { front: 'Topological sort algorithm', back: String.raw`Decreasing post order from DFSAll (or Kahn: repeatedly remove sources). $O(V+E)$. Exists iff DAG.` },
    { front: 'Evaluation order for DP on a DAG', back: 'Reverse topological order = increasing post order (sinks first). Fill a vertex when DFS finishes it.' },
    { front: 'Number of s→t paths in a DAG', back: String.raw`$N(t) = 1$; $N(v) = \sum_{v \to w} N(w)$; evaluate in reverse topological order. $O(V+E)$ operations.` },
    { front: 'Definition of SCC and condensation', back: String.raw`SCC: maximal set of mutually reachable vertices. Condensation $scc(G)$: one vertex per SCC, edge $C\to C'$ if some edge goes from $C$ to $C'$. Always a DAG.` },
    { front: 'Key lemma for SCC algorithms', back: String.raw`Edge from SCC $C$ to SCC $C'$ ⇒ $\max post(C) > \max post(C')$. So the overall max post lies in a SOURCE SCC.` },
    { front: 'Kosaraju–Sharir steps', back: String.raw`1) DFSAll on $rev(G)$, record post. 2) For $v$ in decreasing post: if unmarked, WFS in $G$ from $v$; everything newly marked is one SCC. $O(V+E)$.` },
    { front: 'Unique topological order criterion', back: 'A DAG has exactly one topological order iff every consecutive pair in some (any) topological order is joined by an edge (i.e., it has a Hamiltonian path).' },
    { front: 'Collapse-SCC pattern', back: 'When revisiting is free inside cycles: compute SCCs, aggregate data per component (sum, OR, has-cycle), then DP on the condensation DAG.' },
    { front: 'White-path lemma', back: String.raw`$v$ becomes a descendant of $u$ iff at time $pre(u)$ there is a path $u \leadsto v$ through vertices that are all still new. (Reachable is not enough: the path may run through already-visited vertices.)` },
    { front: 'Edge type from the status of v when DFS(u) examines u→v', back: 'new → tree; active → back; finished with pre(u) < pre(v) → forward; finished with pre(v) < pre(u) → cross.' },
    { front: 'Minimum edges to add to make G strongly connected', back: String.raw`0 if $G$ is already one SCC. Otherwise $\max(p, q)$, where $p$ and $q$ are the numbers of source and sink components of the condensation (an isolated component counts as both). Lower bound: each source needs a new in-edge, each sink a new out-edge.` },
    { front: 'When does ONE new edge make G strongly connected?', back: 'Iff G is not already strongly connected and its condensation has exactly one source A and exactly one sink Z; add any edge from Z to A.' },
    { front: '2SAT: building the implication graph and reading an assignment', back: String.raw`Clause $(a \vee b)$ gives $\bar a \to b$ and $\bar b \to a$. Unsatisfiable iff some $x$, $\bar x$ share an SCC. Otherwise set $a$ true iff $comp(a)$ comes after $comp(\bar a)$ in topological order of the condensation.` },
    { front: 's–t paths through a required vertex x in a DAG', back: String.raw`Count: $A(x) \cdot B(x)$ with $A$ = paths from $s$, $B$ = paths to $t$. Longest: $F(x) + G(x)$. Valid because the two halves cannot intersect in a DAG.` },
    { front: 'Which vertices / edges lie on a directed cycle?', back: String.raw`Vertex $v$: its SCC has at least 2 vertices, or $v$ has a self-loop. Edge $u \to v$: $comp(u) = comp(v)$.` },
    { front: 'Kosaraju–Sharir correctness invariant', back: 'Marked vertices always form a union of whole SCCs; the unmarked vertex with the largest rev(G)-post lies in an SCC whose outgoing G-edges all lead to marked vertices, so the next search marks exactly that SCC.' },
    { front: 'Largest reachable value from every vertex', back: String.raw`Contract SCCs; $m(C) = \max_{v \in C} val(v)$; $B(C) = \max(m(C), \max_{C \to D} B(D))$ in reverse topological order; $best(v) = B(comp(v))$. $O(V+E)$.` },
    { front: 'DAG DP with fixed endpoints s and t: what base values?', back: String.raw`$LP(t) = 0$; for $v \ne t$, $LP(v) = \max_{v\to w} (\ell(vw) + LP(w))$ with empty max $= -\infty$ ("cannot reach $t$"). Do not use 0 for impossible.` },
    { front: 'Why only DAGs have topological orders', back: 'In any linear order, the earliest vertex of a directed cycle has an incoming cycle edge from a later vertex, so some edge points backward. Conversely every DAG is ordered by decreasing post.' },
    { front: 'Path u ⇝ v in a DAG: what does it say about post values?', back: String.raw`$post(u) > post(v)$ in every DFS: no back edges, so post strictly decreases along each edge of the path.` },
    { front: 'Shortest paths in a DAG with negative weights', back: String.raw`$dist(s) = 0$; $dist(v) = \min_{u \to v} (dist(u) + w(uv))$ in topological order. $O(V+E)$, any real weights. Not Dijkstra (can fail), not Bellman–Ford (slower).` },
    { front: 'Why is "number of vertices reachable from v" not a DAG DP?', back: 'Summing over successors double-counts vertices reachable along two routes (a diamond). DP over reachable sets needs an idempotent aggregation: max, min, OR. Path COUNTS are fine because different paths are different objects.' },
    { front: 'WFS from a sink SCC vs from a source SCC', back: 'From any vertex of a sink SCC: marks exactly that SCC. From a source SCC: marks that SCC and everything downstream. Hence Kosaraju–Sharir searches G in decreasing rev(G)-post order (sink components first).' },
    { front: 'Number of shortest paths from s (unweighted)', back: String.raw`BFS for $d$; keep edges with $d(v) = d(u) + 1$ (a DAG); $\sigma(s) = 1$, $\sigma(v) = \sum_{u \to v \text{ kept}} \sigma(u)$ in BFS order. $O(V+E)$.` },
    { front: 'One source and one sink: is the topological order unique?', back: 'No. The diamond a→b, a→c, b→d, c→d has orders abcd and acbd. Unique iff consecutive vertices of a topological order are all adjacent (a Hamiltonian path).' },
    { front: 'Two-player game on a DAG (cannot move = lose)', back: String.raw`$W(v)$ = TRUE iff some edge $v \to w$ has $W(w)$ = FALSE; sinks are FALSE. Evaluate in reverse topological order: $O(V+E)$. With cycles, draws appear and this DP is circular.` }
  ],

  problems: [
    {
      id: 'dags-toposort-code', type: 'code', title: 'Topological sort', difficulty: 1,
      prompt: String.raw`Write <code>topoSort(n, edges)</code>: given a **DAG** on vertices <code>0..n-1</code> with directed edges <code>[u, v]</code> (meaning $u \to v$), return an array containing every vertex exactly once such that for every edge, <code>u</code> appears before <code>v</code>. Any valid order is accepted.`,
      fn: 'topoSort',
      starter: 'function topoSort(n, edges) {\n  // DFS post-order reversed, or Kahn\'s algorithm\n}\n',
      reference: function (n, edges) {
        const adj = Array.from({ length: n }, () => []);
        const indeg = new Array(n).fill(0);
        for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }
        const q = [];
        for (let v = 0; v < n; v++) if (indeg[v] === 0) q.push(v);
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
        }
        return q;
      },
      check: function (out, expected, args) {
        const n = args[0], edges = args[1];
        if (!Array.isArray(out) || out.length !== n) return false;
        const pos = new Array(n).fill(-1);
        for (let i = 0; i < n; i++) {
          const v = out[i];
          if (!Number.isInteger(v) || v < 0 || v >= n || pos[v] !== -1) return false;
          pos[v] = i;
        }
        return edges.every(e => pos[e[0]] < pos[e[1]]);
      },
      tests: [
        [1, []],
        [3, []],
        [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
        [5, [[4, 3], [3, 2], [2, 1], [1, 0]]],
        [6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]],
        [5, [[0, 1], [0, 1], [1, 2], [0, 2], [3, 4]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const edges = [];
        const m = Math.floor(Math.random() * 2 * n);
        for (let k = 0; k < m && n > 1; k++) {
          let a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
          if (a === b) continue;
          if (a > b) { const t = a; a = b; b = t; }
          edges.push([perm[a], perm[b]]);
        }
        return [n, edges];
      },
      hints: [
        'Option 1: DFS from every unmarked vertex; when a vertex finishes, append it to a list; reverse the list at the end.',
        'Option 2 (Kahn): compute in-degrees, put all in-degree-0 vertices in a queue, and repeatedly pop one, output it, and decrement its out-neighbors\' in-degrees.'
      ],
      solution: String.raw`**Kahn's algorithm.** Compute in-degrees in $O(V+E)$. Put every vertex with in-degree 0 into a queue. Repeatedly remove a vertex $u$, append it to the output, and for every edge $u \to v$ decrement $indeg(v)$, enqueuing $v$ when it reaches 0. A vertex is output only after all its in-neighbors have been output, so every edge goes forward. In a DAG every vertex is eventually output (otherwise the remaining vertices would contain a cycle). Time $O(V+E)$.

**DFS alternative.** Run DFSAll; record vertices in the order they finish; output that list reversed (decreasing post). Correct because a DAG has no back edges, so $post(u) > post(v)$ for each edge $u \to v$.`
    },
    {
      id: 'dags-scc-code', type: 'code', title: 'Count strongly connected components', difficulty: 2,
      prompt: String.raw`Write <code>sccCount(n, edges)</code> returning the number of strongly connected components of a directed graph on vertices <code>0..n-1</code> with edge list <code>edges</code> (pairs <code>[u, v]</code>). Self-loops and repeated edges may appear. Aim for $O(V+E)$ (Kosaraju–Sharir or Tarjan).`,
      fn: 'sccCount',
      starter: 'function sccCount(n, edges) {\n  // pass 1: DFS on the reversed graph to get post-order\n  // pass 2: search G in decreasing post order; count searches\n}\n',
      reference: function (n, edges) {
        const adj = Array.from({ length: n }, () => []);
        const radj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); radj[v].push(u); }
        // pass 1: iterative DFS on reversed graph, record post order
        const seen = new Array(n).fill(false);
        const order = [];
        for (let s = 0; s < n; s++) {
          if (seen[s]) continue;
          seen[s] = true;
          const stack = [[s, 0]];
          while (stack.length) {
            const top = stack[stack.length - 1];
            const u = top[0];
            if (top[1] < radj[u].length) {
              const w = radj[u][top[1]++];
              if (!seen[w]) { seen[w] = true; stack.push([w, 0]); }
            } else { order.push(u); stack.pop(); }
          }
        }
        // pass 2: search in G in decreasing post order
        const mark = new Array(n).fill(false);
        let count = 0;
        for (let i = order.length - 1; i >= 0; i--) {
          const s = order[i];
          if (mark[s]) continue;
          count++;
          mark[s] = true;
          const st = [s];
          while (st.length) {
            const u = st.pop();
            for (const w of adj[u]) if (!mark[w]) { mark[w] = true; st.push(w); }
          }
        }
        return count;
      },
      tests: [
        [1, []],
        [3, []],
        [3, [[0, 1], [1, 2], [2, 0]]],
        [7, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3], [4, 5], [5, 6], [6, 5], [0, 6]]],
        [4, [[0, 1], [1, 2], [2, 3]]],
        [5, [[0, 0], [1, 2], [2, 1], [3, 4]]],
        [3, [[0, 1], [1, 0], [0, 2]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10);
        const m = Math.floor(Math.random() * 2.5 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        return [n, edges];
      },
      hints: [
        'Build both G and its reversal rev(G).',
        'DFS on rev(G) and record vertices in the order they finish. Then process vertices from last-finished to first-finished, starting a search in G from each one that is still unmarked. Each such search marks exactly one new SCC.'
      ],
      solution: String.raw`**Kosaraju–Sharir.**
1. Run DFSAll on $rev(G)$ and record the finishing order.
2. Unmark everything. For each vertex $v$ in **decreasing** finishing time: if $v$ is unmarked, increment the count and run any search in $G$ from $v$, marking everything it reaches.

The unmarked vertex with the latest $rev(G)$-finish lies in a source SCC of $rev(G)$ among the remaining vertices, i.e., a sink SCC of the remaining part of $G$; a search in $G$ from it reaches exactly that SCC because edges out of it lead only to already-marked components. Both passes are $O(V+E)$.

In JavaScript, an iterative DFS (stack of [vertex, next-edge-index] pairs) avoids recursion-depth limits; for post order you must pop a vertex only after all of its edges are processed.`
    },
    {
      id: 'dags-longest-code', type: 'code', title: 'Longest path in a weighted DAG', difficulty: 2,
      prompt: String.raw`Write <code>longestPath(n, edges)</code>: the input is a **DAG** on vertices <code>0..n-1</code> with weighted edges <code>[u, v, w]</code> (integer weights, possibly negative). Return the maximum total weight of any directed path in the graph. A single vertex is a path of weight 0, so the answer is always at least 0.`,
      fn: 'longestPath',
      starter: 'function longestPath(n, edges) {\n  // topologically sort, then DP\n}\n',
      reference: function (n, edges) {
        const adj = Array.from({ length: n }, () => []);
        const indeg = new Array(n).fill(0);
        for (const [u, v, w] of edges) { adj[u].push([v, w]); indeg[v]++; }
        const q = [];
        for (let v = 0; v < n; v++) if (indeg[v] === 0) q.push(v);
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          for (const [v] of adj[u]) if (--indeg[v] === 0) q.push(v);
        }
        const best = new Array(n).fill(0); // best path weight ending at v
        let ans = 0;
        for (const u of q) {
          if (best[u] > ans) ans = best[u];
          for (const [v, w] of adj[u]) if (best[u] + w > best[v]) best[v] = best[u] + w;
        }
        for (const b of best) if (b > ans) ans = b;
        return ans;
      },
      tests: [
        [1, []],
        [2, [[0, 1, 5]]],
        [6, [[0, 1, 3], [0, 2, 2], [1, 3, 4], [2, 3, 1], [2, 4, 5], [3, 5, 2], [4, 5, 1]]],
        [3, [[0, 1, -2], [1, 2, -3]]],
        [4, [[0, 1, -1], [1, 2, 10], [2, 3, -1]]],
        [5, [[0, 4, 1], [0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const edges = [];
        const m = Math.floor(Math.random() * 2 * n);
        for (let k = 0; k < m && n > 1; k++) {
          let a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
          if (a === b) continue;
          if (a > b) { const t = a; a = b; b = t; }
          edges.push([perm[a], perm[b], Math.floor(Math.random() * 15) - 4]);
        }
        return [n, edges];
      },
      hints: [
        'Let best(v) be the maximum weight of a path ENDING at v (at least 0, using the trivial path).',
        'Process vertices in topological order; when you process u, relax each out-edge: best(v) = max(best(v), best(u) + w).'
      ],
      solution: String.raw`Define $B(v)$ = maximum weight of a path that ends at $v$. Then
$$B(v) = \max\Big(0, \max_{u \to v} \big(B(u) + w(u\to v)\big)\Big).$$
Every in-neighbor precedes $v$ in topological order, so computing $B$ in topological order (pushing each $B(u)$ forward along out-edges) is valid. The answer is $\max_v B(v)$. Negative weights cause no trouble: the recurrence considers every path, and the 0 option covers the trivial path. Time $O(V+E)$ for the topological sort plus $O(V+E)$ for the DP.

(Equivalently use $LLP(v)$, the best path *starting* at $v$, evaluated in reverse topological order.)`
    },
    {
      id: 'dags-classify', type: 'written', title: 'Run DFS and classify edges', difficulty: 1,
      prompt: String.raw`Run DFSAll on the directed graph below, starting at $a$ and always considering vertices and out-neighbors in alphabetical order. Give $pre$ and $post$ for every vertex, classify every edge as tree, forward, back or cross, and state which edge(s) show that the graph is not a DAG.

~~~graph
directed
a b
a c
a f
b c
b e
c d
d b
e d
f e
~~~`,
      rubric: [
        'Correct pre/post intervals for all six vertices',
        'Correct classification of all nine edges',
        'Identifies the back edge d -> b as the witness of a cycle (b -> c -> d -> b)'
      ],
      hints: ['Keep a running clock. A vertex is active from its pre time until its post time; an edge into an active vertex is a back edge.'],
      solution: String.raw`Trace:
- $pre(a)=1$; go to $b$: $pre(b)=2$; go to $c$: $pre(c)=3$; go to $d$: $pre(d)=4$.
- Edge $d \to b$: $b$ is active: **back**. $post(d)=5$, $post(c)=6$.
- Back in $b$: edge $b \to e$: $pre(e)=7$. Edge $e \to d$: $d$ finished, not a descendant of $e$: **cross**. $post(e)=8$, $post(b)=9$.
- Back in $a$: edge $a \to c$: $c$ finished and is a descendant of $a$: **forward**. Edge $a \to f$: $pre(f)=10$. Edge $f \to e$: finished, not a descendant of $f$: **cross**. $post(f)=11$, $post(a)=12$.

| vertex | a | b | c | d | e | f |
|---|---|---|---|---|---|---|
| pre | 1 | 2 | 3 | 4 | 7 | 10 |
| post | 12 | 9 | 6 | 5 | 8 | 11 |

Tree: $a\to b$, $b \to c$, $c \to d$, $b \to e$, $a \to f$. Forward: $a \to c$. Back: $d \to b$. Cross: $e \to d$, $f \to e$.

Check with the post-order lemma: only $d \to b$ has $post(\text{tail}) = 5 < 9 = post(\text{head})$. The back edge $d \to b$ with tree path $b \to c \to d$ gives the cycle $b \to c \to d \to b$, so the graph is not a DAG.`
    },
    {
      id: 'dags-cycle-output', type: 'written', title: 'Find a cycle or a topological order', difficulty: 2,
      prompt: String.raw`Describe an $O(V+E)$ algorithm that, given a directed graph $G$, outputs **either** a topological ordering of $G$ **or** an explicit directed cycle in $G$. Prove that whichever it outputs is correct.`,
      rubric: [
        'DFS tracking active vertices (status new/active/finished)',
        'On finding an edge to an active vertex, reconstructs the cycle via parent pointers',
        'Otherwise outputs vertices in decreasing post order',
        'Correctness of the cycle (back edge + tree path)',
        'Correctness of the order via the post-order lemma (no back edges ⇒ post(u) > post(v))',
        'O(V+E) time'
      ],
      hints: [
        'Track three statuses: new, active (on the recursion stack), finished.',
        'An edge v → w with w active closes a cycle along the tree path from w down to v.'
      ],
      solution: String.raw`**Algorithm.** Run DFSAll with each vertex's status (new / active / finished), parent pointers, and a list $L$ to which we prepend each vertex when it finishes. When DFS($v$) examines edge $v \to w$:
- if $w$ is new: set $parent(w) = v$ and recurse;
- if $w$ is active: stop and output the cycle $w \to \dots \to v \to w$, obtained by following parent pointers from $v$ up to $w$ and reversing;
- if $w$ is finished: do nothing.

If DFSAll completes without stopping, output $L$ (decreasing post order).

**Cycle correctness.** If $w$ is active when $v$ examines $v \to w$, then $w$'s recursive call is on the stack below $v$'s, so $w$ is an ancestor of $v$ and parent pointers from $v$ lead to $w$ along tree edges. Those tree edges plus $v \to w$ form a directed cycle.

**Order correctness.** If we never see an edge into an active vertex, there are no back edges. For an edge $u \to v$ examined while $u$ is active: if $v$ was new, $v$ becomes a descendant and finishes first; if $v$ was finished, it finished first. Either way $post(v) < post(u)$, so $u$ precedes $v$ in $L$.

**Time.** One DFS, $O(V+E)$; extracting the cycle costs $O(V)$.`
    },
    {
      id: 'dags-semesters', type: 'written', title: 'Minimum number of semesters', difficulty: 2,
      prompt: String.raw`A degree program has $n$ courses and a list of $m$ prerequisite pairs "$p$ must be taken in a strictly earlier semester than $c$". There is no limit on the number of courses per semester. Describe and analyze an algorithm that computes the minimum number of semesters needed to take all courses, or reports that the requirements are inconsistent.`,
      rubric: [
        'Graph: vertex per course, edge p -> c for each prerequisite',
        'Inconsistent iff the graph has a directed cycle (detected by DFS)',
        'Recurrence: S(v) = 1 + max over prerequisites u of S(u) (1 if none), i.e., longest path counted in vertices',
        'Evaluation in topological order; answer max_v S(v)',
        'Argues both that this many semesters is necessary and sufficient',
        'O(n + m) time'
      ],
      hints: [
        'A chain of k courses, each a prerequisite of the next, forces k distinct semesters.',
        'Schedule each course as early as its prerequisites allow.'
      ],
      solution: String.raw`**Graph.** $G$ has a vertex per course and an edge $p \to c$ per prerequisite pair: $n$ vertices, $m$ edges.

**Inconsistency.** If $G$ has a directed cycle, the courses on it would each need to be strictly earlier than themselves: report inconsistent. Detect cycles with DFS in $O(n+m)$.

**Recurrence.** Otherwise $G$ is a DAG. Let $S(v)$ be the earliest semester in which $v$ can be taken:
$$S(v) = 1 + \max_{u \to v} S(u), \quad\text{with } S(v) = 1 \text{ if } v \text{ has no prerequisites.}$$
$S(v)$ equals the number of vertices on the longest path ending at $v$. Compute $S$ in topological order (every in-neighbor is earlier), and output $\max_v S(v)$.

**Correctness.** *Necessary:* along any path $v_1 \to \dots \to v_k$, semesters strictly increase, so $k$ semesters are needed; the longest path forces $\max_v S(v)$ semesters. *Sufficient:* taking each course $v$ in semester $S(v)$ is valid, since every prerequisite $u$ of $v$ has $S(u) \le S(v) - 1$.

**Time.** Topological sort plus one pass over all edges: $O(n+m)$.`
    },
    {
      id: 'dags-unique-topo', type: 'written', title: 'Unique topological order', difficulty: 2,
      prompt: String.raw`Describe an $O(V+E)$ algorithm to decide whether a given DAG has **exactly one** topological ordering. Prove your criterion.`,
      rubric: [
        'Compute one topological order v1..vn',
        'Criterion: unique iff for every i there is an edge v_i -> v_{i+1}',
        'Proof (⇐): consecutive edges force the order',
        'Proof (⇒): if v_i -> v_{i+1} is missing, swapping them gives another valid order',
        'Checking all consecutive pairs in O(V+E) total'
      ],
      hints: ['Compute any topological order, then ask: could two adjacent vertices in it be swapped?'],
      solution: String.raw`**Algorithm.** Compute a topological order $v_1, \dots, v_n$ (DFS, $O(V+E)$). For each $i < n$, scan the adjacency list of $v_i$ for $v_{i+1}$ (total $O(V+E)$). Answer "unique" iff every edge $v_i \to v_{i+1}$ is present.

**If all consecutive edges exist:** any topological order must put $v_i$ before $v_{i+1}$ for every $i$, so it must be exactly $v_1, \dots, v_n$.

**If some edge $v_i \to v_{i+1}$ is missing:** swap $v_i$ and $v_{i+1}$. Only the relative order of these two vertices changes. There is no edge $v_{i+1} \to v_i$ (the original order was topological) and no edge $v_i \to v_{i+1}$ (by assumption), so every edge still goes forward and the new order is a second topological ordering.

(Equivalently: a DAG has a unique topological order iff it has a Hamiltonian path; in DAGs, Hamiltonian path is easy.)`
    },
    {
      id: 'dags-mother', type: 'written', title: 'A vertex that reaches everything', difficulty: 2,
      prompt: String.raw`A vertex $r$ of a directed graph $G$ is a *root* if every vertex is reachable from $r$. Describe an $O(V+E)$ algorithm that finds a root or reports that none exists. Prove it correct.`,
      rubric: [
        'Run DFSAll; take x = vertex with largest post',
        'Verify x by a second search from x',
        'Proof: if a root exists, its SCC is the unique source SCC of the condensation',
        'Proof: the max-post vertex lies in a source SCC, hence in the root\'s SCC, so it is itself a root',
        'O(V+E)'
      ],
      hints: [
        'If a root exists, what does the condensation look like near the root\'s component?',
        'Which SCC is guaranteed to contain the vertex that finishes last?'
      ],
      solution: String.raw`**Algorithm.** Run DFSAll($G$); let $x$ be the vertex with the largest $post$. Run one more search from $x$. If it marks every vertex, output $x$; otherwise report that no root exists. Time $O(V+E)$.

**Correctness.** If the algorithm outputs $x$, the second search verified that $x$ is a root. Conversely suppose some root $r$ exists, with SCC $C_r$. Every SCC is reachable from $C_r$, so in the condensation every component other than $C_r$ has an incoming path from $C_r$, and in particular a DAG with a vertex reaching everything has that vertex as its **only source** (any other component has an in-edge on its path from $C_r$). By the key lemma, $x$ (largest post) lies in a source SCC, hence in $C_r$. Since $x$ and $r$ are strongly connected, $x$ reaches $r$, which reaches everything, so $x$ is a root and the verification succeeds.`
    },
    {
      id: 'dags-coins', type: 'written', title: 'Collecting coins in a directed graph', difficulty: 3,
      prompt: String.raw`Each vertex $v$ of a directed graph $G=(V,E)$ holds $c(v) \ge 0$ coins. You start at vertex $s$ and walk along directed edges as long as you like (vertices and edges may be repeated), collecting the coins at every vertex you visit; the coins at a vertex can be collected only once. Describe and analyze an algorithm to compute the maximum number of coins you can collect.`,
      rubric: [
        'Compute SCCs and the condensation in O(V+E)',
        'Weight each SCC by the total coins in it',
        'Argues that entering an SCC lets you collect all of it and leave from any of its vertices',
        'Argues that a walk visits SCCs along a path in the condensation (cannot return)',
        'DP: Best(C) = W(C) + max over successors (0 if none), in reverse topological order; answer Best(comp(s))',
        'O(V+E) total'
      ],
      hints: [
        'Inside a strongly connected component you can wander anywhere and leave from any vertex you like.',
        'Once a walk leaves an SCC it can never return. So what does a walk look like in the condensation?'
      ],
      solution: String.raw`**Step 1: collapse.** Compute the SCCs of $G$ (Kosaraju–Sharir, $O(V+E)$) and the condensation $H = scc(G)$, a DAG. Give each component $C$ the weight $W(C) = \sum_{v \in C} c(v)$.

**Step 2: key facts.**
- *Any walk from $s$ visits components along a directed path in $H$:* consecutive components are joined by an edge of $H$, and since $H$ is acyclic the walk can never return to a component it left.
- *Any path $comp(s) = C_1 \to C_2 \to \dots \to C_k$ in $H$ can be realized collecting all coins in every $C_i$:* entering $C_i$ at some vertex $x$, the component is strongly connected, so we can walk from $x$ through every vertex of $C_i$ and finish at the tail $y$ of an edge $y \to z$ into $C_{i+1}$.

Hence the maximum is the maximum total $W$ along a path in $H$ starting at $comp(s)$.

**Step 3: DP on the DAG.** For each component $C$ let $Best(C)$ = maximum coins on a path in $H$ starting at $C$:
$$Best(C) = W(C) + \max\big(0, \max_{C \to D} Best(D)\big).$$
Evaluate in reverse topological order of $H$ (e.g., increasing post order). Answer: $Best(comp(s))$. (Since coins are nonnegative the "max with 0" only matters for sinks.)

**Time.** SCCs, building $H$ (scan every edge, map endpoints to components), summing weights, and the DP each take $O(V+E)$.`
    },
    {
      id: 'dags-infinite-walks', type: 'written', title: 'Infinitely many walks', difficulty: 3,
      prompt: String.raw`Given a directed graph $G$ and vertices $s, t$, describe and analyze an algorithm that decides whether there are **infinitely many** distinct walks from $s$ to $t$. Prove your characterization.`,
      rubric: [
        'Characterization: infinitely many walks iff some vertex v with s ⇝ v and v ⇝ t lies on a directed cycle',
        'Proof (⇐): pump the cycle',
        'Proof (⇒): a walk with more than V vertices repeats a vertex, which then lies on a closed walk and hence on a cycle',
        'Computes reach(s) in G and the set reaching t (search in rev(G))',
        'Identifies vertices on cycles: SCC of size >= 2, or self-loop',
        'O(V+E) total'
      ],
      hints: [
        'Finitely many walks of each length exist. So infinitely many walks means arbitrarily long walks.',
        'Which vertices can lie on a cycle? Think about SCCs.'
      ],
      solution: String.raw`**Characterization.** There are infinitely many $s$-$t$ walks iff there is a vertex $v$ such that $s \leadsto v$, $v \leadsto t$, and $v$ lies on a directed cycle (a closed walk of positive length).

*(⇐)* Take a walk $P$ from $s$ to $v$, a closed walk $Z$ through $v$ of length $\ge 1$, and a walk $Q$ from $v$ to $t$. For each $j \ge 0$, $P Z^j Q$ is an $s$-$t$ walk, all of different lengths, hence distinct.

*(⇒)* There are at most $\Delta^\ell$ walks of length $\ell$ from $s$ (where $\Delta$ is the maximum out-degree), so infinitely many walks means some walk has length $\ge V$, i.e., at least $V+1$ vertex occurrences. By pigeonhole some vertex $v$ occurs twice; the portion between the occurrences is a closed walk through $v$, which contains a directed cycle through $v$ (or $v$ has a self-loop). And $v$ is on an $s$-$t$ walk, so $s \leadsto v \leadsto t$.

**Algorithm.**
1. Search from $s$ in $G$: set $A$ = vertices reachable from $s$.
2. Search from $t$ in $rev(G)$: set $B$ = vertices that reach $t$.
3. Compute SCCs. A vertex lies on a cycle iff its SCC has at least two vertices or it has a self-loop.
4. Answer YES iff some vertex in $A \cap B$ lies on a cycle.

**Time.** Two searches, one SCC computation, and linear scans: $O(V+E)$.`
    },
    {
      id: 'dags-semiconnected', type: 'written', title: 'Semi-connected graphs', difficulty: 3,
      prompt: String.raw`A directed graph $G$ is *semi-connected* if for every pair of vertices $u, v$, at least one of $u \leadsto v$ or $v \leadsto u$ holds. Describe an $O(V+E)$ algorithm to decide whether $G$ is semi-connected, and prove it correct.`,
      rubric: [
        'Compute SCCs, condensation, and a topological order C1..Ck of it',
        'Criterion: semi-connected iff every consecutive pair C_i -> C_{i+1} is an edge of the condensation',
        'Proof (⇐) using strong connectivity inside components and the chain of consecutive edges',
        'Proof (⇒): if C_i -> C_{i+1} is missing, a vertex of C_i and a vertex of C_{i+1} are mutually unreachable',
        'O(V+E) implementation of the consecutive-edge test'
      ],
      hints: [
        'Reachability between vertices only depends on reachability between their SCCs.',
        'In a topological order of the condensation, can a path from C_i to C_{i+1} skip the direct edge?'
      ],
      solution: String.raw`**Algorithm.** Compute the SCCs and the condensation $H$ (a DAG), and a topological order $C_1, \dots, C_k$ of $H$. Let $idx(C_i) = i$. Mark $i$ as "linked" whenever some edge $u \to v$ of $G$ has $idx(comp(v)) = idx(comp(u)) + 1$. Answer YES iff all $i \in \{1, \dots, k-1\}$ are linked. Every step is $O(V+E)$.

**Correctness.** For $u \in C_i$ and $v \in C_j$: since components are strongly connected, $u \leadsto v$ iff $C_i \leadsto C_j$ in $H$.

*(⇐)* If every edge $C_i \to C_{i+1}$ exists, then for $i \le j$ the chain $C_i \to C_{i+1} \to \dots \to C_j$ shows $C_i \leadsto C_j$. So for any two vertices, the one in the earlier (or same) component reaches the other.

*(⇒)* Suppose $C_i \to C_{i+1}$ is not an edge. Pick $u \in C_i$, $v \in C_{i+1}$. Every edge of $H$ goes from a lower index to a higher one, so $v \not\leadsto u$. Any path from $C_i$ to $C_{i+1}$ in $H$ visits components with strictly increasing indices starting at $i$ and ending at $i+1$, so it must be the single edge $C_i \to C_{i+1}$, which does not exist. Hence $u \not\leadsto v$ either, and $G$ is not semi-connected.`
    },
    {
      id: 'dags-countpaths-code', type: 'code', title: 'Count s-t paths in a DAG', difficulty: 2,
      prompt: String.raw`Write <code>countPaths(n, edges, s, t)</code>: the input is a **DAG** on vertices <code>0..n-1</code> with directed edges <code>[u, v]</code>. Return the number of distinct directed paths from <code>s</code> to <code>t</code>. A path is a sequence of edges, so two parallel copies of an edge give two different paths. If <code>s === t</code> the answer is 1 (the empty path). Aim for $O(V+E)$ arithmetic operations; do not enumerate paths.`,
      fn: 'countPaths',
      starter: 'function countPaths(n, edges, s, t) {\n  // topological order, then N(v) = number of paths from s to v\n}\n',
      reference: function (n, edges, s, t) {
        const adj = Array.from({ length: n }, () => []);
        const indeg = new Array(n).fill(0);
        for (const [u, v] of edges) { adj[u].push(v); indeg[v]++; }
        const q = [];
        for (let v = 0; v < n; v++) if (indeg[v] === 0) q.push(v);
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
        }
        const N = new Array(n).fill(0);
        N[s] = 1;
        for (const u of q) for (const v of adj[u]) N[v] += N[u];
        return N[t];
      },
      tests: [
        [1, [], 0, 0],
        [2, [], 0, 1],
        [2, [[0, 1]], 1, 0],
        [4, [[0, 1], [0, 2], [1, 3], [2, 3]], 0, 3],
        [3, [[0, 1], [0, 1], [1, 2]], 0, 2],
        [7, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]], 0, 6],
        [6, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [5, 4], [0, 4]], 0, 4]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const edges = [];
        const m = Math.floor(Math.random() * 3 * n);
        for (let k = 0; k < m && n > 1; k++) {
          let a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
          if (a === b) continue;
          if (a > b) { const t = a; a = b; b = t; }
          edges.push([perm[a], perm[b]]);
        }
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
      },
      hints: [
        'Let N(v) be the number of paths from s to v. What is N(s)? How does N(v) depend on the in-neighbors of v?',
        'Compute a topological order (Kahn), then process vertices in that order, adding N(u) to N(v) for every edge u → v.'
      ],
      solution: String.raw`**Subproblem.** $N(v)$ = number of paths from $s$ to $v$.

**Recurrence.** $N(s) = 1$ and, for $v \ne s$, $N(v) = \sum_{u \to v} N(u)$ (one term per edge, so parallel edges are counted separately). Every path from $s$ to $v \neq s$ ends with a unique last edge $u \to v$, preceded by a path from $s$ to $u$. (Since $G$ is a DAG, no path from $s$ returns to $s$, so $N(s) = 1$ is correct.)

**Order.** Every in-neighbor of $v$ precedes $v$ in topological order, so compute a topological order with Kahn's algorithm and push each $N(u)$ forward along its out-edges in that order. Vertices before $s$ in the order keep $N = 0$ (they are not reachable from $s$).

**Answer** $N(t)$. **Time** $O(V+E)$ arithmetic operations. (Counts can be exponential in $V$; in a real exam problem you would usually be asked for the count modulo some number.)`
    },
    {
      id: 'dags-minstrong-code', type: 'code', title: 'Minimum edges to make a graph strongly connected', difficulty: 3,
      prompt: String.raw`Write <code>minEdgesStrong(n, edges)</code> for a directed graph on vertices <code>0..n-1</code> (with $n \ge 1$; self-loops and repeated edges may appear). Return the minimum number of new directed edges that must be added to make the graph strongly connected.

Use the theorem: if the graph is already strongly connected the answer is 0; otherwise, with $p$ source components and $q$ sink components in the condensation (a component with no meta-edges at all counts as both), the answer is $\max(p, q)$. Your code must run in $O(V+E)$.`,
      fn: 'minEdgesStrong',
      starter: 'function minEdgesStrong(n, edges) {\n  // 1) label SCCs  2) mark components with an incoming / outgoing meta-edge\n  // 3) count sources and sinks of the condensation\n}\n',
      reference: function (n, edges) {
        const adj = Array.from({ length: n }, () => []);
        const radj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); radj[v].push(u); }
        const seen = new Array(n).fill(false);
        const order = [];
        for (let s = 0; s < n; s++) {
          if (seen[s]) continue;
          seen[s] = true;
          const stack = [[s, 0]];
          while (stack.length) {
            const top = stack[stack.length - 1];
            const u = top[0];
            if (top[1] < radj[u].length) {
              const w = radj[u][top[1]++];
              if (!seen[w]) { seen[w] = true; stack.push([w, 0]); }
            } else { order.push(u); stack.pop(); }
          }
        }
        const comp = new Array(n).fill(-1);
        let c = 0;
        for (let i = order.length - 1; i >= 0; i--) {
          const s = order[i];
          if (comp[s] !== -1) continue;
          comp[s] = c;
          const st = [s];
          while (st.length) {
            const u = st.pop();
            for (const w of adj[u]) if (comp[w] === -1) { comp[w] = c; st.push(w); }
          }
          c++;
        }
        if (c <= 1) return 0;
        const hasIn = new Array(c).fill(false), hasOut = new Array(c).fill(false);
        for (const [u, v] of edges) if (comp[u] !== comp[v]) { hasOut[comp[u]] = true; hasIn[comp[v]] = true; }
        let p = 0, q = 0;
        for (let i = 0; i < c; i++) { if (!hasIn[i]) p++; if (!hasOut[i]) q++; }
        return Math.max(p, q);
      },
      tests: [
        [1, []],
        [2, []],
        [3, [[0, 1], [1, 2], [2, 0]]],
        [3, [[0, 1], [1, 2]]],
        [4, [[0, 1], [0, 2], [0, 3]]],
        [5, [[0, 1], [1, 0], [2, 3], [3, 4]]],
        [7, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3], [4, 5], [5, 6], [6, 5], [0, 6]]],
        [4, [[0, 0], [1, 1], [0, 1]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const m = Math.floor(Math.random() * 2 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        return [n, edges];
      },
      hints: [
        'First compute the SCCs (Kosaraju–Sharir). If there is only one, return 0.',
        'Scan every edge u → v with comp(u) ≠ comp(v): it gives comp(u) an outgoing meta-edge and comp(v) an incoming one. Components with no incoming meta-edge are sources; with no outgoing, sinks.'
      ],
      solution: String.raw`**Algorithm.** Compute SCC labels with Kosaraju–Sharir ($O(V+E)$). If there is one component, return 0. Otherwise scan all edges; for each $u \to v$ with $comp(u) \ne comp(v)$ mark $comp(u)$ as having an out-edge and $comp(v)$ as having an in-edge. Let $p$ be the number of components with no in-edge (sources) and $q$ the number with no out-edge (sinks); return $\max(p, q)$. Total $O(V+E)$.

**Why at least $\max(p, q)$ edges are needed.** In a strongly connected graph, every source component $C$ must be entered by some edge from outside $C$ (otherwise vertices outside cannot reach it), and the original graph has no such edge, so a new edge must end in $C$. Each new edge ends in only one component, so at least $p$ new edges are needed. Symmetrically, each sink component needs a new edge leaving it: at least $q$.

**Why $\max(p, q)$ edges suffice.** This is a theorem of Eswaran and Tarjan (1976). The idea of the construction is to pair up sources and sinks so that adding edges from each sink to the next source chains all of them into one big cycle through the condensation, then attach the leftover unpaired sources or sinks with one edge each. You may cite it.

**Edge case.** A single SCC needs 0 edges, even though it is formally both a source and a sink of a one-vertex condensation. Isolated components (no meta-edges) count as both a source and a sink.`
    },
    {
      id: 'dags-2sat-code', type: 'code', title: 'Solve 2SAT with SCCs', difficulty: 3,
      prompt: String.raw`Write <code>twoSat(n, clauses)</code>. There are $n$ boolean variables $x_0, \dots, x_{n-1}$. A literal is a nonzero integer: $+(i+1)$ means $x_i$ and $-(i+1)$ means $\neg x_i$. Each clause is a pair <code>[a, b]</code> of literals meaning $(a \vee b)$; a unit clause is written <code>[a, a]</code>. Return an array of $n$ booleans that satisfies every clause, or <code>null</code> if the formula is unsatisfiable. Any satisfying assignment is accepted. Aim for $O(n + m)$ using the implication graph.`,
      fn: 'twoSat',
      starter: 'function twoSat(n, clauses) {\n  // vertex 2i = x_i, vertex 2i+1 = NOT x_i\n  // clause (a OR b): edges NOT a -> b and NOT b -> a\n  // unsatisfiable iff some x_i and NOT x_i share an SCC\n}\n',
      reference: function (n, clauses) {
        const N = 2 * n;
        const node = (lit) => (lit > 0 ? 2 * (lit - 1) : 2 * (-lit - 1) + 1);
        const adj = Array.from({ length: N }, () => []);
        const radj = Array.from({ length: N }, () => []);
        const add = (u, v) => { adj[u].push(v); radj[v].push(u); };
        for (const [a, b] of clauses) { add(node(a) ^ 1, node(b)); add(node(b) ^ 1, node(a)); }
        const seen = new Array(N).fill(false);
        const order = [];
        for (let s = 0; s < N; s++) {
          if (seen[s]) continue;
          seen[s] = true;
          const stack = [[s, 0]];
          while (stack.length) {
            const top = stack[stack.length - 1];
            const u = top[0];
            if (top[1] < radj[u].length) {
              const w = radj[u][top[1]++];
              if (!seen[w]) { seen[w] = true; stack.push([w, 0]); }
            } else { order.push(u); stack.pop(); }
          }
        }
        const comp = new Array(N).fill(-1);
        let c = 0;
        for (let i = order.length - 1; i >= 0; i--) {
          const s = order[i];
          if (comp[s] !== -1) continue;
          comp[s] = c;
          const st = [s];
          while (st.length) {
            const u = st.pop();
            for (const w of adj[u]) if (comp[w] === -1) { comp[w] = c; st.push(w); }
          }
          c++;
        }
        const res = [];
        for (let i = 0; i < n; i++) {
          if (comp[2 * i] === comp[2 * i + 1]) return null;
          res.push(comp[2 * i] < comp[2 * i + 1]);
        }
        return res;
      },
      check: function (out, expected, args) {
        const n = args[0], clauses = args[1];
        if (expected === null) return out === null;
        if (!Array.isArray(out) || out.length !== n) return false;
        if (!out.every((b) => b === true || b === false)) return false;
        const val = (lit) => (lit > 0 ? out[lit - 1] : !out[-lit - 1]);
        return clauses.every(([a, b]) => val(a) || val(b));
      },
      tests: [
        [1, []],
        [1, [[1, 1]]],
        [1, [[1, 1], [-1, -1]]],
        [2, [[1, 2], [-1, 2], [1, -2]]],
        [2, [[1, 2], [-1, 2], [1, -2], [-1, -2]]],
        [3, [[1, -2], [2, -3], [3, -1], [1, 3]]],
        [3, [[1, 2], [-1, 3], [-3, -2], [2, 3]]],
        [4, [[1, 2], [-1, -2], [2, 3], [-2, -3], [3, 4], [-3, -4], [4, 1], [-4, -1]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 6);
        const m = Math.floor(Math.random() * 3 * n);
        const lit = () => (1 + Math.floor(Math.random() * n)) * (Math.random() < 0.5 ? 1 : -1);
        const clauses = [];
        for (let i = 0; i < m; i++) clauses.push([lit(), lit()]);
        return [n, clauses];
      },
      hints: [
        'Use 2n vertices: 2i for x_i and 2i+1 for NOT x_i, so negating a literal is "XOR 1".',
        'Kosaraju–Sharir (DFS on the reversed graph, then search in G in decreasing post order) numbers components sink-first. Make x_i true iff comp(x_i) < comp(NOT x_i), i.e., the component of x_i was found first (it is later in topological order).'
      ],
      solution: String.raw`**Implication graph.** Vertices: the $2n$ literals. Each clause $(a \vee b)$ adds $\bar a \to b$ and $\bar b \to a$; a unit clause $(a \vee a)$ adds $\bar a \to a$. That is $2n$ vertices and $2m$ edges.

**Satisfiability.** Compute SCCs. If some $x_i$ and $\bar x_i$ are in the same component, return null: $x_i$ would imply $\bar x_i$ and vice versa.

**Assignment.** Kosaraju–Sharir discovers components in reverse topological order (sink components first), so component numbers decrease along edges between components: an edge $p \to q$ implies $comp(p) \ge comp(q)$. Set $x_i$ true iff $comp(x_i) < comp(\bar x_i)$, i.e., the component of $x_i$ is closer to the sinks. This is the "later in topological order" rule from the lesson, which provably satisfies every clause: if $(a \vee b)$ had both literals false, we would get $\tau(a) < \tau(\bar a) \le \tau(b) < \tau(\bar b) \le \tau(a)$, where $\tau$ is the topological position.

**Time.** $O(n + m)$.`
    },
    {
      id: 'dags-red-vertex-paths', type: 'written', title: 'Paths through at least one red vertex', difficulty: 2,
      prompt: String.raw`Let $G$ be a DAG in which some vertices are colored red, and let $s, t$ be vertices. Describe $O(V+E)$ algorithms to compute (a) the number of paths from $s$ to $t$ that visit **at least one** red vertex, and (b) the maximum length of such a path, where edges have arbitrary real lengths $\ell(e)$.`,
      rubric: [
        '(a) Correct method: total paths minus red-free paths, or a DP with a seen-red flag',
        '(a) Counting recurrences with correct base cases, evaluated in (reverse) topological order',
        '(b) DP with state (v, flag) or a two-layer DAG; uses -infinity for impossible states',
        'Correct handling of s or t being red',
        'O(V+E) time with justification'
      ],
      hints: [
        'Complement counting: paths that visit at least one red vertex = all paths minus paths that visit none.',
        'For the maximum, a complement trick does not work. Instead remember one extra bit: have we seen a red vertex yet?'
      ],
      solution: String.raw`**(a) Counting by complement.** Let $T$ = number of $s$-$t$ paths in $G$, and $T'$ = number of $s$-$t$ paths in the subgraph $G'$ obtained by deleting every red vertex (if $s$ or $t$ is red, $T' = 0$). Every path either visits a red vertex or is a path of $G'$, so the answer is $T - T'$. Each count is the standard DAG DP: $N(t) = 1$, $N(v) = \sum_{v \to w} N(w)$, in reverse topological order. Time $O(V+E)$.

**(b) One extra bit.** For a vertex $v$ and a flag $b \in \{0, 1\}$, let $F(v, b)$ be the maximum length of a path from $v$ to $t$, assuming that the part of the walk *up to and including* $v$ has seen a red vertex iff $b = 1$, and requiring that the whole path has seen a red vertex by the time it reaches $t$. For an edge $v \to w$ the flag at $w$ is $b \vee \mathrm{red}(w)$. So
$$F(t, b) = \begin{cases} 0 & b = 1 \\ -\infty & b = 0 \end{cases}, \qquad F(v, b) = \max_{v \to w} \big(\ell(v \to w) + F(w,\ b \vee \mathrm{red}(w))\big) \text{ for } v \ne t,$$
with an empty maximum equal to $-\infty$. (A path in a DAG cannot pass through $t$ and come back, so $t$ is always the last vertex.) The answer is $F(s, \mathrm{red}(s))$; $-\infty$ means no such path.

Equivalently, build the product DAG on $V \times \{0, 1\}$ (layer 1 = "seen red"), where each edge $u \to w$ becomes $(u, b) \to (w, b \vee \mathrm{red}(w))$, start at $(s, \mathrm{red}(s))$, and compute the longest path to $(t, 1)$. The product is still acyclic (any cycle would project onto a cycle of $G$), so DAG longest path applies.

**Time.** $2V$ states and $2E$ transitions, evaluated in reverse topological order of $G$ (for each $v$, both flags): $O(V+E)$.`
    },
    {
      id: 'dags-best-any-path', type: 'written', title: 'Best path with vertex rewards, any endpoints', difficulty: 2,
      prompt: String.raw`Each vertex $v$ of a DAG $G$ has a reward $r(v)$, which may be negative. A path may start and end anywhere but must contain at least one vertex; its value is the sum of the rewards of its vertices. Describe and analyze an algorithm to compute the maximum value of a path. Give the subproblem in English, the recurrence, the evaluation order, and the running time.`,
      rubric: [
        'Subproblem: best value of a nonempty path STARTING at v (or ending at v)',
        'Recurrence R(v) = r(v) + max(0, max over out-neighbors R(w))',
        'Answer max over all v of R(v) (not R of a single vertex); handles all-negative rewards',
        'Reverse topological evaluation order and O(V+E) time'
      ],
      hints: [
        'Fix the first vertex of the path. What is the best way to continue?',
        'Stopping immediately is always an option, so the continuation contributes max(0, ...).'
      ],
      solution: String.raw`**Subproblem.** $R(v)$ = maximum value of a (nonempty) path that **starts** at $v$.

**Recurrence.** A path starting at $v$ is either just $v$, or $v$ followed by an edge $v \to w$ and a path starting at $w$:
$$R(v) = r(v) + \max\Big(0,\ \max_{v \to w} R(w)\Big),$$
where the empty inner maximum is ignored (only the 0 option remains). Because $G$ is a DAG, the continuation from $w$ never revisits $v$, so the parts are independent.

**Answer.** $\max_{v} R(v)$, since the best path starts somewhere. If all rewards are negative this correctly returns the largest single reward (the path must be nonempty).

**Evaluation order.** Reverse topological order (increasing post order), so each $R(w)$ is ready before $R(v)$ for every edge $v \to w$. Store $R$ in an array indexed by vertex.

**Time.** Topological sort $O(V+E)$; each edge is examined once in the DP: $O(V+E)$ total.`
    },
    {
      id: 'dags-one-edge-strong', type: 'written', title: 'Can one edge make it strongly connected?', difficulty: 2,
      prompt: String.raw`Given a directed graph $G = (V, E)$ that is **not** strongly connected, describe an $O(V+E)$ algorithm that decides whether there exist vertices $x, y$ such that adding the edge $x \to y$ makes $G$ strongly connected, and finds such an edge if it exists. Prove your criterion in both directions.`,
      rubric: [
        'Computes SCCs and the condensation; counts source and sink components',
        'Criterion: exactly one source A and exactly one sink Z',
        'Sufficiency: in a DAG every vertex is reachable from a source and reaches a sink; adding Z→A connects everything',
        'Necessity: every source needs a new in-edge and every sink a new out-edge; one edge provides one of each',
        'O(V+E) time'
      ],
      hints: [
        'Think in the condensation. Which components can nothing else reach? Which can reach nothing else?',
        'In a DAG, following edges backward from any vertex eventually stops at a source.'
      ],
      solution: String.raw`**Algorithm.** Compute the SCCs and the condensation $H$ ($O(V+E)$); it has at least two vertices since $G$ is not strongly connected. Scan the edges to find which components have incoming and outgoing meta-edges. If $H$ has exactly one source $A$ and exactly one sink $Z$, output an edge from any vertex of $Z$ to any vertex of $A$; otherwise answer "impossible".

**Sufficiency.** In a DAG every vertex is reachable from some source (walk backward along in-edges; it must stop, and it stops at a source) and reaches some sink. With unique $A$ and $Z$, every component is reachable from $A$ and reaches $Z$, and reachability between components lifts to vertices because components are strongly connected. After adding $z \to a$, for any $u, v$: $u \leadsto z \to a \leadsto v$. So $G$ becomes strongly connected. (Note $A \ne Z$: if one component were both the unique source and the unique sink, it would be isolated in $H$, and the other components, which exist since $H$ has at least two vertices, would contain another source.)

**Necessity.** Suppose adding $x \to y$ makes $G$ strongly connected. Let $C$ be any source component of $H$. Some vertex outside $C$ must reach $C$ in the new graph, so some edge of the new graph enters $C$ from outside; no old edge does, so $y \in C$. Hence every source component contains $y$: there is exactly one source. Symmetrically every sink component contains $x$: exactly one sink.

**Time.** $O(V+E)$ for SCCs, the condensation, and degree counts.`
    },
    {
      id: 'dags-coins-to-t', type: 'written', title: 'Collect coins on the way to t', difficulty: 3,
      prompt: String.raw`Each vertex $v$ of a directed graph $G$ holds $c(v) \ge 0$ coins. You start at $s$, walk along directed edges (repeating vertices and edges is allowed), and must **end at $t$**. The coins at a vertex are collected the first time you visit it. Describe and analyze an algorithm that computes the maximum number of coins you can collect, or reports that $t$ is unreachable from $s$.`,
      rubric: [
        'Contract SCCs; weight W(C) = total coins in C',
        'Explains why a walk visits components along a path in the condensation and why each visited component can be fully collected',
        'Explains why the walk must END in comp(t): components after comp(t) can never return',
        'DP with -infinity for components that cannot reach comp(t); Best(comp(t)) = W(comp(t))',
        'Answer Best(comp(s)); O(V+E) time'
      ],
      hints: [
        'Start from the solution without a target (collapse SCCs, longest path in the condensation). What changes when the walk must end at t?',
        'Once the walk leaves the component of t, can it ever come back?'
      ],
      solution: String.raw`**Collapse.** Compute SCCs and the condensation $H$ (a DAG) in $O(V+E)$. Give each component $C$ weight $W(C) = \sum_{v \in C} c(v)$. Let $T = comp(t)$.

**Structure of a walk.** A walk from $s$ to $t$ visits a sequence of components forming a path $comp(s) = C_1 \to C_2 \to \dots \to C_k$ in $H$; it can never return to a component it left (that would be a cycle in $H$). Since it ends at $t$, $C_k = T$. Conversely, for any such path in $H$ ending at $T$ there is a walk collecting **all** coins of every $C_i$: inside $C_i$ walk through every vertex and leave from the tail of an edge into $C_{i+1}$; inside $T$, visit every vertex and finish at $t$ (possible because $T$ is strongly connected).

**DP.** $Best(C)$ = maximum total weight of a path in $H$ from $C$ to $T$, or $-\infty$ if $C$ cannot reach $T$:
$$Best(T) = W(T), \qquad Best(C) = W(C) + \max_{C \to D} Best(D) \ \text{ for } C \ne T,$$
with $\max \emptyset = -\infty$. There is no "stop here" option for $C \ne T$: the walk must reach $t$. And $Best(T)$ does not look further, since continuing past $T$ would make returning to $t$ impossible. Evaluate in reverse topological order of $H$.

**Answer.** $Best(comp(s))$; if it is $-\infty$, report that $t$ is unreachable.

**Time.** SCCs, building $H$ and the weights, and the DP: $O(V+E)$ in total.`
    },
    {
      id: 'dags-forever', type: 'written', title: 'Vertices with an infinite walk', difficulty: 2,
      prompt: String.raw`Given a directed graph $G$, describe an $O(V+E)$ algorithm that marks every vertex $v$ from which there is an **infinite** walk (a walk that never stops, possibly repeating vertices and edges). Prove your characterization.`,
      rubric: [
        'Characterization: infinite walk from v iff v can reach a vertex lying on a directed cycle',
        'Proof of both directions (pumping a cycle; pigeonhole on a long walk)',
        'Cycle vertices identified by SCCs of size >= 2 or self-loops',
        'One search in rev(G) from all cycle vertices simultaneously; O(V+E)'
      ],
      hints: [
        'An infinite walk visits some vertex twice. What does the part between the two visits form?',
        'Doing one search per cycle vertex would be too slow. Search backward from all of them at once.'
      ],
      solution: String.raw`**Characterization.** There is an infinite walk from $v$ iff $v$ reaches some vertex $x$ that lies on a directed cycle.

*(⇐)* Walk from $v$ to $x$, then go around the cycle through $x$ forever.

*(⇒)* An infinite walk has infinitely many positions but only $V$ vertices, so some vertex $x$ appears twice; the portion between two appearances is a closed walk of positive length through $x$, which contains a directed cycle; that cycle's vertices are reachable from $v$. (Simplest to say: $x$ is in a nontrivial SCC or has a self-loop, so it lies on a cycle.)

**Algorithm.**
1. Compute SCCs. Mark $x$ as a *cycle vertex* iff its SCC has at least two vertices or $x$ has a self-loop.
2. Run one whatever-first search in $rev(G)$, starting with all cycle vertices in the bag (equivalently, add a super-source with edges to all of them). Every vertex marked by this search reaches a cycle vertex in $G$.
3. Output the marked vertices.

**Time.** SCCs $O(V+E)$, the multi-source search $O(V+E)$. Running a separate search from each vertex would cost $O(V(V+E))$; the reverse multi-source search is the standard way to answer "which vertices can reach the set $X$" in linear time.`
    },
    {
      id: 'dags-2sat-labels', type: 'written', title: 'Map labeling via 2SAT', difficulty: 3,
      prompt: String.raw`A map has $n$ cities. Each city's name label must be placed either to the **left** or to the **right** of the city's dot. You are given a list of $m$ conflicts, each of the form "city $i$'s label on side $a$ overlaps city $j$'s label on side $b$" (with $i \neq j$, $a, b \in \{L, R\}$). Describe and analyze an algorithm that finds a placement of all labels with no overlapping pair, or reports that none exists.`,
      rubric: [
        'Boolean variable per city (e.g. x_i = label on the right)',
        'Each conflict becomes the 2-clause NOT(side_i = a AND side_j = b)',
        'Implication graph with 2n vertices and 2m edges; correct edge directions',
        'Unsatisfiable iff x_i and NOT x_i share an SCC; assignment read off from topological order',
        'O(n + m) time'
      ],
      hints: [
        'Each city makes a binary choice. Each conflict forbids one combination of two choices.',
        'Forbidding "p AND q" is the clause (NOT p OR NOT q).'
      ],
      solution: String.raw`**Variables.** $x_i$ = "city $i$'s label is on the right" ($\bar x_i$ = left). For a city $i$ and side $a$ write $\lambda(i, a)$ for the literal meaning "label $i$ is on side $a$": $\lambda(i, R) = x_i$, $\lambda(i, L) = \bar x_i$.

**Clauses.** A conflict ($i$ on side $a$ overlaps $j$ on side $b$) forbids $\lambda(i,a) \wedge \lambda(j,b)$, i.e., requires the clause $\big(\overline{\lambda(i,a)} \vee \overline{\lambda(j,b)}\big)$. A placement has no overlapping pair iff every clause is satisfied, so placements correspond exactly to satisfying assignments of this 2CNF formula with $n$ variables and $m$ clauses.

**Implication graph.** $2n$ literal vertices. The clause $(p \vee q)$ adds $\bar p \to q$ and $\bar q \to p$; here that means $\lambda(i,a) \to \overline{\lambda(j,b)}$ ("if $i$ is on side $a$, then $j$ must not be on side $b$") and $\lambda(j,b) \to \overline{\lambda(i,a)}$.

**Algorithm.** Compute SCCs. If some $x_i$ and $\bar x_i$ share a component, report that no placement exists. Otherwise place label $i$ on the right iff $comp(x_i)$ comes after $comp(\bar x_i)$ in a topological order of the condensation (with Kosaraju–Sharir or Tarjan: iff $comp(x_i)$ was found first).

**Correctness.** Unsatisfiable when $x_i \leadsto \bar x_i \leadsto x_i$: either choice for city $i$ forces the other. The topological-order assignment satisfies every clause by the 2SAT theorem (a violated clause $(p \vee q)$ would give $\tau(p) < \tau(\bar p) \le \tau(q) < \tau(\bar q) \le \tau(p)$).

**Time.** Building the graph $O(n + m)$, SCCs $O(n + m)$, reading the assignment $O(n)$: $O(n+m)$ total.`
    },
    {
      id: 'dags-dfs-truefalse', type: 'written', title: 'Prove or disprove: DFS clock facts', difficulty: 2,
      prompt: String.raw`DFSAll is run on a directed graph $G$ (any vertex order, any adjacency order). For each statement, prove it or give a small counterexample with an explicit DFS order.

(a) If $u \to v$ is an edge and $pre(u) < pre(v)$, then $post(v) < post(u)$.

(b) If $u$ can reach $v$ and $pre(u) < pre(v)$, then $v$ is a descendant of $u$.

(c) If $pre(u) < pre(v)$ and $v$ is **not** reachable from $u$, then $post(u) < pre(v)$.

(d) The vertex with the smallest $pre$ value lies in a source SCC of $G$.

(e) If $G$ is a DAG and $post(u) < post(v)$, then $u$ cannot reach $v$.`,
      rubric: [
        '(a) True: edge type must be tree or forward, so nested',
        '(b) False, with a valid counterexample (path through an already-active or finished vertex)',
        '(c) True: v is not a descendant of u, so intervals are disjoint with u first',
        '(d) False: DFSAll may start inside a sink component',
        '(e) True: posts strictly decrease along every path in a DAG'
      ],
      hints: [
        'Use the edge-type table: which types have pre(tail) < pre(head)?',
        'For (b), the white-path lemma needs a path of NEW vertices at time pre(u).'
      ],
      solution: String.raw`**(a) True.** Back edges have $pre(v) \le pre(u)$ and cross edges have $pre(v) < pre(u)$, so an edge with $pre(u) < pre(v)$ is a tree or forward edge, whose head's interval is nested inside the tail's: $post(v) < post(u)$.

**(b) False.** Edges $a \to b$, $b \to a$, $a \to c$; DFS from $a$ visits $b$ before $c$. Intervals: $a[1,6]$, $b[2,3]$, $c[4,5]$. Then $b \leadsto c$ (via $a$) and $pre(b) < pre(c)$, but $c$ is not a descendant of $b$: the only path from $b$ to $c$ runs through $a$, which was already active at time $pre(b)$.

**(c) True.** Descendants of $u$ are reachable from $u$, so $v$ is not a descendant. Since $pre(u) < pre(v)$, $u$'s interval cannot be nested inside $v$'s either. By the parenthesis lemma the intervals are disjoint, and since $u$ starts first, $post(u) < pre(v)$.

**(d) False.** Single edge $b \to a$, and DFSAll considers $a$ first: $pre(a) = 1$, but $\{a\}$ is a sink component, not a source. (The **largest post** is the one guaranteed to lie in a source SCC.)

**(e) True.** In a DAG every edge $x \to y$ has $post(x) > post(y)$ (no back edges, post-order lemma), so along any path from $u$ to $v$ the post values strictly decrease, giving $post(u) > post(v)$ if $u \leadsto v$ with $u \ne v$. The contrapositive is the statement.`
    },
    {
      id: 'dags-lex-topo', type: 'written', title: 'Lexicographically smallest topological order', difficulty: 2,
      prompt: String.raw`The vertices of a DAG are numbered $1..V$. Among all topological orders, we want the one that is lexicographically smallest (smallest possible first vertex; among those, smallest possible second vertex; and so on). Describe an $O(E + V \log V)$ algorithm and prove it is correct. Then explain why the *reverse* of the DFS decreasing-post order does not in general give this order.`,
      rubric: [
        'Kahn with a min-priority queue of current sources',
        'Proof: the first vertex of any topological order must be a source; choosing the smallest source is optimal; induct on the remaining DAG',
        'Running time O(E + V log V) (V inserts/extracts, E decrements)',
        'Explains that DFS-based order depends on search order and is not lexicographically minimal (small counterexample)'
      ],
      hints: [
        'Which vertices can appear first in a topological order?',
        'After you fix the first vertex, the rest must be a topological order of the remaining DAG.'
      ],
      solution: String.raw`**Algorithm.** Kahn's algorithm with a **min-heap** instead of a queue: compute in-degrees, insert all sources into the heap; repeatedly extract the smallest vertex $u$, output it, and decrement the in-degree of each out-neighbor, inserting those that reach 0.

**Correctness.** Claim: the first vertex of every topological order is a source (an in-edge would have to come from an earlier vertex). So the smallest possible first vertex is the smallest source, which is what the heap returns. After outputting $u$, the remaining positions must form a topological order of $G - u$ (removing a vertex keeps a DAG, and every topological order of $G$ starting with $u$ is $u$ followed by a topological order of $G - u$, and vice versa). By induction on $V$, the algorithm produces the lexicographically smallest order of $G - u$, so the whole output is lexicographically smallest. The heap always contains exactly the sources of the remaining graph, by the usual Kahn invariant.

**Time.** $V$ insertions and $V$ extractions at $O(\log V)$ each, and $E$ in-degree decrements at $O(1)$ each: $O(E + V\log V)$.

**DFS does not do this.** Decreasing post order is *some* topological order, determined by the order DFS explores. Example: vertices $1, 2, 3$ with the single edge $3 \to 2$, and DFSAll in order $1, 2, 3$: posts are $1[1,2]$, $2[3,4]$, $3[5,6]$, so decreasing post gives $3, 2, 1$, while the lexicographically smallest order is $1, 3, 2$.`
    },
    {
      id: 'dags-cycle-edges', type: 'written', title: 'Edges that lie on cycles', difficulty: 1,
      prompt: String.raw`Given a directed graph $G$, describe an $O(V+E)$ algorithm that marks every edge lying on at least one directed cycle. Prove the criterion you use. As a corollary, prove that deleting all **unmarked** edges never changes the SCCs of $G$.`,
      rubric: [
        'Criterion: u→v lies on a cycle iff u and v are in the same SCC (self-loops included)',
        'Proof of both directions',
        'Algorithm: compute SCC labels, compare endpoints; O(V+E)',
        'Corollary: deleting edges between different SCCs never changes the SCCs, because no path inside an SCC can use them'
      ],
      hints: ['An edge u → v lies on a cycle iff there is a path back from v to u.'],
      solution: String.raw`**Criterion.** $u \to v$ lies on a directed cycle iff $comp(u) = comp(v)$.

*(⇒)* If $u \to v$ is on a cycle, the rest of the cycle is a path from $v$ to $u$, so $u$ and $v$ reach each other.
*(⇐)* If $u = v$, the edge is a self-loop, itself a cycle. Otherwise $v$ reaches $u$; take a simple path $P$ from $v$ to $u$. On $P$, $v$ appears only at the start and $u$ only at the end. So the closed walk "edge $u \to v$, then $P$" repeats no vertex except that it starts and ends at $u$: it is a cycle containing the edge.

**Algorithm.** Compute SCC labels (Kosaraju–Sharir or Tarjan) in $O(V+E)$, then mark each edge whose endpoints have equal labels: $O(E)$.

**Corollary.** Deleting all unmarked edges never changes the SCCs. An unmarked edge goes between two different SCCs $C \to C'$, and no path leads from $C'$ back to $C$. So a path between two vertices of the same SCC never uses an inter-component edge: once it left its component it could never return. Hence every path witnessing mutual reachability survives the deletion, and no new mutual reachability can appear when edges are removed.`
    },
    {
      id: 'dags-grid-increasing', type: 'written', title: 'Longest increasing path in a grid', difficulty: 2,
      prompt: String.raw`You are given an $n \times n$ grid of integers $A[i][j]$. A path moves between horizontally or vertically adjacent cells, and must be **strictly increasing**: each cell's value is larger than the previous one's. Describe and analyze an algorithm to compute the maximum number of cells on such a path. Explain explicitly why your recurrence is well-founded.`,
      rubric: [
        'Graph: vertex per cell, edge to each neighbor with a strictly larger value',
        'Argues the graph is a DAG (values strictly increase along edges)',
        'Subproblem L(i,j) = most cells on an increasing path starting at (i,j); recurrence with base case',
        'Evaluation order: decreasing value (or memoized DFS)',
        'Time O(n^2) (or O(n^2 log n) if sorting), stated in terms of n'
      ],
      hints: [
        'Make each cell a vertex. Which way should each edge point?',
        'Why can this graph not have a cycle?'
      ],
      solution: String.raw`**Graph.** Vertices: the $n^2$ cells. For each cell and each of its up to 4 neighbors with a strictly larger value, add a directed edge to that neighbor. Increasing paths in the grid are exactly paths in this graph.

**Acyclicity.** Values strictly increase along every edge, so a cycle would need a value larger than itself. Hence the graph is a DAG and DAG DP applies (sorting cells by value gives a topological order).

**Subproblem.** $L(i, j)$ = maximum number of cells on an increasing path that starts at cell $(i, j)$.

**Recurrence.** $L(i,j) = 1 + \max\{ L(i', j') : (i',j') \text{ adjacent to } (i,j),\ A[i'][j'] > A[i][j] \}$, where the max of an empty set is 0 (a single cell is a path of 1 cell).

**Evaluation order.** Any reverse topological order: process cells in **decreasing** order of value (sorting costs $O(n^2 \log n)$), or use memoized recursion / DFS, which fills $L$ in post order in $O(n^2)$ without sorting.

**Answer** $\max_{i,j} L(i,j)$.

**Time.** $n^2$ vertices and at most $4n^2$ edges: $O(n^2)$ with memoized DFS ($O(n^2 \log n)$ with sorting). This is linear in the size of the grid.`
    },
    {
      id: 'dags-box-nesting', type: 'written', title: 'Nesting boxes', difficulty: 2,
      prompt: String.raw`You have $n$ boxes in $d$ dimensions; box $i$ has side lengths $(b_{i,1}, \dots, b_{i,d})$. Box $i$ **fits inside** box $j$ if the sides of $i$ can be permuted (the box rotated) so that each side of $i$ is strictly smaller than the corresponding side of $j$. Describe and analyze an algorithm to find the largest number of boxes that can be nested one inside the next.`,
      rubric: [
        'Observation: i fits in j iff sorted(i) < sorted(j) coordinatewise (with justification or citation)',
        'Graph: vertex per box, edge i→j if i fits in j; argued acyclic (e.g. sum of sides strictly increases)',
        'Longest path in a DAG counted in vertices, DP with base case',
        'Running time O(n d log d + n^2 d), in terms of n and d'
      ],
      hints: [
        'Sort each box\'s side lengths first. Then the best rotation is easy.',
        'If i fits in j, how does the sum of i\'s sides compare to j\'s?'
      ],
      solution: String.raw`**Normalize.** Sort each box's side lengths: $O(nd\log d)$. Fact: $i$ fits in $j$ iff the sorted vectors satisfy $\text{sort}(i)_k < \text{sort}(j)_k$ for every $k$. Write the sorted sides as $a_1 \le \dots \le a_d$ for $i$ and $c_1 \le \dots \le c_d$ for $j$. If some rotation works, each side of $i$ is matched to a distinct, strictly larger side of $j$. The $d-k+1$ sides $a_k, \dots, a_d$ are all $\ge a_k$, so their partners are $d-k+1$ distinct sides of $j$ that are all $> a_k$; hence the $(d-k+1)$-th largest side of $j$, which is $c_k$, exceeds $a_k$. Conversely, if $a_k < c_k$ for all $k$, the sorted pairing is itself a valid rotation.

**Graph.** Vertex per box, edge $i \to j$ when $i$ fits in $j$; building it compares all pairs, $O(n^2 d)$. It is a DAG: if $i$ fits in $j$, the sum of $i$'s sides is strictly smaller than $j$'s, so sums strictly increase along edges, and sorting boxes by side sum gives a topological order.

**DP.** $N(j)$ = largest number of boxes in a nesting sequence whose outermost box is $j$:
$$N(j) = 1 + \max\{N(i) : i \to j\}, \quad \text{empty max} = 0.$$
Evaluate in increasing order of side sum (a topological order). Answer $\max_j N(j)$.

**Time.** $O(nd \log d)$ to sort sides, $O(n^2 d)$ to build edges, $O(n \log n)$ to sort by sum, $O(n^2)$ for the DP: $O(nd\log d + n^2 d)$ total. (Note the graph has up to $\Theta(n^2)$ edges, so state the running time in terms of $n$ and $d$, not "$O(V+E)$".)`
    },
    {
      id: 'dags-universal-sink', type: 'written', title: 'A vertex everyone can reach', difficulty: 2,
      prompt: String.raw`Given a directed graph $G$, describe an $O(V+E)$ algorithm that finds a vertex $z$ that is reachable **from every** vertex, or reports that none exists. Characterize when such a vertex exists in terms of the condensation, and prove your algorithm correct.`,
      rubric: [
        'Characterization: exists iff the condensation has exactly one sink component; then exactly its vertices qualify',
        'Algorithm: apply the root-finding algorithm to rev(G) (DFS on rev(G), take max post, verify)',
        'Proof using the key lemma on rev(G) (max post lies in a source SCC of rev(G) = sink SCC of G)',
        'Verification search and O(V+E) time'
      ],
      hints: [
        'Reverse the edges: a vertex reachable from everyone in G is a vertex that reaches everyone in rev(G).',
        'The vertex with the largest post value lies in a source SCC of the graph you searched.'
      ],
      solution: String.raw`**Characterization.** Such a $z$ exists iff the condensation $H$ has exactly one sink component $Z$, and then the valid vertices are exactly those of $Z$. If $H$ has a unique sink $Z$, every component reaches some sink (follow out-edges until stuck), hence reaches $Z$, so every vertex reaches every vertex of $Z$. If $H$ has two sinks $Z_1 \ne Z_2$, nothing in $Z_1$ reaches anything outside $Z_1$, and likewise for $Z_2$, so no vertex is reachable from both.

**Algorithm.** Run DFSAll on $rev(G)$ and let $z$ be the vertex with the largest post. Search from $z$ in $rev(G)$ (equivalently, check that every vertex reaches $z$ in $G$). If every vertex is marked, output $z$; otherwise report none.

**Correctness.** If the algorithm outputs $z$, verification proved it. Conversely, suppose a valid vertex exists, so $H$ has a unique sink $Z$. The SCCs of $rev(G)$ are the same sets, and its condensation is $H$ with every edge reversed, so $Z$ is the unique **source** of $rev(H)$. By the key lemma, the largest post of a DFS of $rev(G)$ lies in a source SCC of $rev(G)$, which must be $Z$. So $z \in Z$ and the verification succeeds.

**Time.** Reversal, one DFSAll and one search: $O(V+E)$.`
    },
    {
      id: 'dags-negative-dag-paths', type: 'written', title: 'Shortest paths and their number in a DAG with negative edges', difficulty: 2,
      prompt: String.raw`$G = (V, E)$ is a DAG with real edge weights $w(u \to v)$, some of them negative, and $s$ is a vertex.

(a) Describe an $O(V+E)$ algorithm that computes $dist(v)$, the minimum weight of a path from $s$ to $v$, for every vertex $v$.

(b) Extend it to also compute $N(v)$, the **number** of minimum-weight paths from $s$ to $v$, in $O(V+E)$ arithmetic operations.

(c) Give a 3-vertex example on which Dijkstra's algorithm (each vertex extracted once and then treated as final) reports a wrong distance.`,
      rubric: [
        'English definition of dist(v) and recurrence dist(s) = 0, dist(v) = min over u -> v of dist(u) + w(u -> v), with +infinity for no path',
        'Evaluation in topological order and why predecessors are final (and why negative weights are harmless: no cycles)',
        'Counting recurrence: N(s) = 1; N(v) = sum of N(u) over u -> v with dist(u) + w = dist(v); justification',
        'O(V+E) including the topological sort',
        'A correct Dijkstra counterexample with the trace'
      ],
      hints: [
        'Every path to v arrives through its last edge u -> v. What must be true of the prefix if the whole path is shortest?',
        'For counting, only the incoming edges that achieve the minimum matter.'
      ],
      solution: String.raw`**(a) Subproblem.** $dist(v)$ = minimum weight of a path from $s$ to $v$ ($+\infty$ if none).

**Recurrence.** $dist(s) = 0$ (in a DAG no path returns to $s$, so the empty path is the only $s$-$s$ path), and for $v \ne s$
$$dist(v) = \min_{u \to v} \big( dist(u) + w(u \to v) \big), \qquad \min \emptyset = +\infty.$$
Correctness: a path to $v \ne s$ ends with some edge $u \to v$, and its prefix is a path from $s$ to $u$; the best choice of prefix is a minimum-weight one, and in a DAG appending $u \to v$ to *any* $s$-$u$ path gives a path (it cannot already contain $v$, since $v \leadsto u$ and $u \to v$ would form a cycle).

**Order.** Compute a topological order ($O(V+E)$) and evaluate $dist$ in that order, so all in-neighbors of $v$ are done before $v$. Equivalently: process vertices in topological order and relax their out-edges. Negative weights are harmless because nothing depends on itself. Time $O(V+E)$.

**(b) Counting.** $N(s) = 1$, and for $v \ne s$ with $dist(v) < \infty$,
$$N(v) = \sum_{u \to v,\ dist(u) + w(u \to v) = dist(v)} N(u),$$
and $N(v) = 0$ if $dist(v) = \infty$. A minimum-weight path to $v$ is a minimum-weight path to some in-neighbor $u$ followed by $u \to v$, where $u \to v$ achieves the minimum; distinct $(u, \text{prefix})$ pairs give distinct paths, so the counts add. Evaluate in the same topological order, right after $dist(v)$: $O(V+E)$ arithmetic operations.

**(c)** Edges $s \to a$ (weight 1), $s \to b$ (weight 2), $b \to a$ (weight $-5$). Dijkstra extracts $s$ and sets $a = 1$, $b = 2$; it extracts $a$ and declares $dist(a) = 1$ final; it extracts $b$ and finds $2 - 5 = -3 < 1$, but $a$ is already final, so it reports $1$. The true distance is $-3$. The topological DP processes $s, b, a$ and gets $-3$.`
    },
    {
      id: 'dags-timestamps', type: 'written', title: 'Consistent timestamps for historical events', difficulty: 2,
      prompt: String.raw`A historian has $n$ events and two kinds of constraints: $m_1$ constraints of the form "$a$ happened strictly before $b$" and $m_2$ constraints of the form "$a$ and $b$ happened at the same time". She wants to assign each event a positive integer timestamp satisfying every constraint.

(a) Describe an $O(n + m_1 + m_2)$ algorithm that decides whether the constraints are consistent.

(b) If they are, compute an assignment whose **largest** timestamp is as small as possible, and prove it is optimal.`,
      rubric: [
        'Group simultaneous events: components of the undirected "same time" graph (WFS in a loop)',
        'Directed graph H on the groups with an edge per "before" constraint; inconsistent iff some before-constraint lies inside a group or H has a cycle; both directions argued',
        'Optimal timestamps: T(C) = 1 + max over C2 -> C of T(C2) (empty max 0), in topological order',
        'Optimality: a path of k groups forces k distinct increasing timestamps (lower bound); the DP assignment is valid (upper bound)',
        'Linear running time'
      ],
      hints: [
        'Events that must be simultaneous can be merged into one super-event. What graph gives the merged groups?',
        'After merging, "before" constraints form a directed graph on the groups. When does it admit a valid numbering?'
      ],
      solution: String.raw`**Group simultaneous events.** Build an undirected graph $S$ on the events with an edge per "same time" constraint, and label its connected components by WFS in a loop: $O(n + m_2)$. Any valid assignment gives all events of a component the same timestamp (equality is transitive along the edges), and conversely assigning one value per component satisfies every "same time" constraint. So it suffices to choose a timestamp $T(C)$ per component $C$.

**(a) The group graph.** Build a directed graph $H$ with one vertex per component and, for each constraint "$a$ before $b$", the edge $comp(a) \to comp(b)$: $O(n + m_1)$. The constraints are consistent iff $H$ has no self-loop and no cycle, i.e. $H$ is a DAG.

- If $H$ has a self-loop (some "$a$ before $b$" with $a$, $b$ forced simultaneous) or a cycle $C_1 \to \dots \to C_k \to C_1$, then $T(C_1) < T(C_2) < \dots < T(C_1)$, a contradiction.
- If $H$ is a DAG, number its vertices by a topological order $1, 2, \dots$ and use that number as the timestamp: every edge goes from a smaller number to a larger one, so every constraint holds.

Check with DFS (look for an edge to an active vertex) or Kahn's algorithm: $O(n + m_1)$.

**(b) Smallest maximum timestamp.** Define $T(C)$ = 1 + the largest $T$ among components with an edge into $C$:
$$T(C) = 1 + \max_{C' \to C} T(C'), \qquad \max \emptyset = 0,$$
evaluated in topological order of $H$. So $T(C)$ is the number of components on the longest path in $H$ ending at $C$. Output each event's timestamp $T(comp(\cdot))$.

- *Valid:* for an edge $C' \to C$, $T(C) \ge T(C') + 1$.
- *Optimal:* if $H$ has a path $C_1 \to C_2 \to \dots \to C_k$, any valid assignment has $T(C_1) < \dots < T(C_k)$, so its largest timestamp is at least $k$. The DP's largest value equals the number of vertices on the longest path, so it matches this lower bound.

(Since every valid assignment needs at least that many *distinct* values too, the same assignment also minimizes the number of distinct timestamps.)

**Time.** Components $O(n + m_2)$, building $H$ $O(n + m_1)$, cycle check, topological sort and DP $O(n + m_1)$: total $O(n + m_1 + m_2)$.`
    },
    {
      id: 'dags-k-edge-walk', type: 'written', title: 'Best walk with exactly k edges', difficulty: 2,
      prompt: String.raw`$G = (V, E)$ is a directed graph, possibly with cycles, with real edge weights $w(e)$. Given $s$, $t$ and an integer $1 \le k \le V$:

(a) Describe an $O(k(V+E))$ algorithm that computes the maximum total weight of a walk from $s$ to $t$ with **exactly** $k$ edges (edges may repeat), or reports that none exists. Use a DAG.

(b) Adapt it to walks with **at most** $k$ edges.

(c) Explain why the problem with no limit on the number of edges can have no finite answer, and why this does not contradict the fact that the longest simple path problem is NP-hard.`,
      rubric: [
        'Layered graph: vertices (v, i) for 0 <= i <= k, edge (u, i-1) -> (v, i) of weight w(u -> v) for every edge u -> v; it is a DAG because the layer index increases',
        'DP: B(v, i) = max weight of a walk from s to v with exactly i edges; B(s, 0) = 0, B(v, 0) = -infinity otherwise; B(v, i) = max over u -> v of B(u, i-1) + w(u -> v)',
        'Evaluate layer by layer; answer B(t, k); time O(k(V+E)), O(V) memory with two layers',
        'Part (b): max over i <= k of B(t, i)',
        'Part (c): a positive-weight cycle reachable from s and reaching t makes walks unboundedly heavy; walks are not paths, so no contradiction'
      ],
      hints: [
        'The graph has cycles, so a DP over G itself is circular. What extra index makes the dependencies acyclic?',
        'Let B(v, i) be the best walk to v using exactly i edges.'
      ],
      solution: String.raw`**(a) The layered DAG.** Build $H$ with vertices $(v, i)$ for $v \in V$ and $0 \le i \le k$, and for every edge $u \to v$ of $G$ and every $1 \le i \le k$ an edge $(u, i-1) \to (v, i)$ of weight $w(u \to v)$. Every edge goes from layer $i-1$ to layer $i$, so $H$ is a **DAG** even though $G$ may have cycles, and walks with exactly $i$ edges in $G$ from $s$ correspond to paths in $H$ from $(s, 0)$ to layer $i$.

**Subproblem.** $B(v, i)$ = maximum weight of a walk from $s$ to $v$ with exactly $i$ edges ($-\infty$ if none).

**Recurrence.**
$$B(s, 0) = 0, \quad B(v, 0) = -\infty \ (v \ne s), \qquad B(v, i) = \max_{u \to v} \big( B(u, i-1) + w(u \to v) \big) \ \text{ for } i \ge 1,$$
with $\max \emptyset = -\infty$ and $-\infty + w = -\infty$. Correct because a walk with $i \ge 1$ edges to $v$ is a walk with $i-1$ edges to some in-neighbor $u$ followed by $u \to v$, and the best prefix is the best walk to $u$ with $i-1$ edges (walks may repeat vertices, so any prefix combines with any last edge).

**Order and answer.** Fill layer $i = 0, 1, \dots, k$ in increasing order (a topological order of $H$); within a layer any order works. Answer $B(t, k)$, "none" if $-\infty$. Each layer scans every edge once: $O(k(V+E))$ time, $O(V)$ memory keeping two layers.

**(b)** Return $\max_{0 \le i \le k} B(t, i)$ (only $i \ge 1$ if the empty walk should not count), same time.

**(c)** If some cycle of positive total weight is reachable from $s$ and can reach $t$, going around it $j$ more times adds $j$ times its weight, so walk weights are unbounded and there is no maximum. The bound $k$ is what keeps the problem finite. There is no contradiction with NP-hardness: walks may repeat vertices, and the layered DAG is allowed to visit $(v, i)$ and $(v, j)$ for the same $v$. The *simple* path version has to remember which vertices were used, which no polynomial-size layering can do.`
    },
    {
      id: 'dags-red-infinitely-often', type: 'written', title: 'Visiting red vertices infinitely often', difficulty: 3,
      prompt: String.raw`$G = (V, E)$ is a directed graph with a start vertex $s$. Some vertices are red, some are blue (no vertex is both), the rest uncolored. An *infinite walk* never stops (vertices and edges may repeat).

(a) Describe an $O(V+E)$ algorithm that decides whether there is an infinite walk from $s$ that visits red vertices **infinitely often**. Prove the characterization you use.

(b) Same question for an infinite walk that visits red vertices infinitely often **and** blue vertices infinitely often.`,
      rubric: [
        'Characterization (a): some red vertex reachable from s lies on a directed cycle (its SCC has at least 2 vertices or it has a self-loop)',
        'Proof of (a) in both directions; the necessity direction uses finiteness (some red vertex repeats) to extract a cycle',
        'Characterization (b): some SCC reachable from s is nontrivial and contains both a red and a blue vertex',
        'Proof of (b): vertices seen infinitely often lie in one SCC; conversely loop inside the SCC between a red and a blue vertex',
        'Algorithm: SCCs, mark qualifying components, one search from s; O(V+E)'
      ],
      hints: [
        'An infinite walk in a finite graph must repeat some vertex infinitely often. What does the stretch between two visits of the same vertex give you?',
        'For (b): after some point the walk only visits vertices it will visit again. Are those mutually reachable?'
      ],
      solution: String.raw`Call an SCC **nontrivial** if it has at least two vertices or its single vertex has a self-loop. A vertex lies on a directed cycle (closed walk of positive length) iff its SCC is nontrivial. Compute SCCs in $O(V+E)$.

**(a) Claim.** Such a walk exists iff some red vertex $r$ that is reachable from $s$ lies in a nontrivial SCC.

- (⇐) Walk from $s$ to $r$, then go around a cycle through $r$ forever. Every lap visits $r$.
- (⇒) $G$ is finite, so an infinite walk visiting red vertices infinitely often visits some single red vertex $r$ infinitely often. $r$ is reachable from $s$ (the walk gets there). Between two consecutive visits of $r$ the walk is a closed walk $r \to x \to \dots \to r$ of positive length. If $x = r$, it is a self-loop; otherwise $r$ reaches $x$ and $x$ reaches $r$, so $r$ and $x$ share an SCC with at least two vertices. Either way $r$'s SCC is nontrivial.

**Algorithm (a).** Mark each red vertex whose SCC is nontrivial (sizes and self-loops are found while scanning edges). Run WFS from $s$; answer YES iff it marks some marked red vertex. $O(V+E)$.

**(b) Claim.** Such a walk exists iff some nontrivial SCC $C$ reachable from $s$ contains at least one red vertex and at least one blue vertex.

- (⇐) Walk from $s$ into $C$, then forever alternate: walk inside $C$ to a red vertex $r \in C$, then to a blue vertex $b \in C$, then back to $r$, and so on. All these walks stay inside $C$ because $C$ is strongly connected, and $r \ne b$ so each leg has positive length.
- (⇒) Let $I$ be the set of vertices visited infinitely often; it is nonempty (finitely many vertices) and contains a red and a blue vertex. After some time $T_0$ the walk visits only vertices of $I$. For any $x, y \in I$, after $T_0$ the walk visits $x$ and later $y$, and later $x$ again, so $x \leadsto y$ and $y \leadsto x$: all of $I$ lies in one SCC $C$. $C$ contains the red and the blue vertex, so it has at least two vertices and is nontrivial, and it is reachable from $s$.

**Algorithm (b).** For each SCC record whether it contains a red vertex and a blue vertex (one pass over the vertices). Mark the components that contain both (they are automatically nontrivial). WFS from $s$; YES iff it reaches a vertex of a marked component. $O(V+E)$.

**Remark.** Condition (a) is the "Büchi acceptance" check used in model checking. Note that in (b), finding a red cycle and a separate blue cycle is **not** enough: once the walk leaves a component it can never come back.`
    },
    {
      id: 'dags-kosaraju-trace', type: 'written', title: 'Trace Kosaraju–Sharir and read the condensation', difficulty: 2,
      prompt: String.raw`Consider the directed graph $G$ with edges $a \to b$, $b \to a$, $b \to c$, $c \to d$, $d \to e$, $e \to c$, $d \to f$, $a \to f$, $g \to h$, $h \to g$, $g \to e$.

~~~graph
directed
a b
b a
b c
c d
d e
e c
d f
a f
g h
h g
g e
~~~

(a) Run DFSAll on $rev(G)$, trying vertices and out-neighbors (in $rev(G)$) in alphabetical order. Give $pre$ and $post$ for every vertex.

(b) Run the second phase of Kosaraju–Sharir in $G$ and list the SCCs in the order they are found.

(c) Draw the condensation and give a topological order of it.

(d) What is the minimum number of edges that must be added to make $G$ strongly connected? Give such a set of edges.`,
      rubric: [
        'Correct reversed adjacency lists and the DFS intervals of part (a)',
        'Phase 2 searches G in decreasing post order and finds {f}, {c,d,e}, {g,h}, {a,b} in that order',
        'Condensation edges A -> C, A -> F, C -> F, G -> C and a valid topological order (e.g. A, G, C, F)',
        'Two sources and one sink, so max(2, 1) = 2 edges, with a valid explicit pair such as f -> a and f -> g'
      ],
      hints: [
        'Reversing u -> v gives v -> u. Write the reversed out-neighbor lists of all eight vertices before starting.',
        'In phase 2, every search starts at the unmarked vertex with the largest post from phase 1, and only marks unmarked vertices.'
      ],
      solution: String.raw`**(a) Reversed graph.** Out-neighbors in $rev(G)$: $a: b$; $b: a$; $c: b, e$; $d: c$; $e: d, g$; $f: a, d$; $g: h$; $h: g$.

DFS($a$): $pre(a) = 1$, go to $b$: $pre(b) = 2$; $b$'s only neighbor $a$ is active; $post(b) = 3$, $post(a) = 4$.
DFS($c$): $pre(c) = 5$; $b$ is finished; go to $e$: $pre(e) = 6$; go to $d$: $pre(d) = 7$; $d \to c$ is active; $post(d) = 8$. Back in $e$, go to $g$: $pre(g) = 9$; go to $h$: $pre(h) = 10$; $h \to g$ is active; $post(h) = 11$, $post(g) = 12$, $post(e) = 13$, $post(c) = 14$.
DFS($f$): $pre(f) = 15$; $a$ and $d$ are finished; $post(f) = 16$.

| | a | b | c | d | e | f | g | h |
|---|---|---|---|---|---|---|---|---|
| pre | 1 | 2 | 5 | 7 | 6 | 15 | 9 | 10 |
| post | 4 | 3 | 14 | 8 | 13 | 16 | 12 | 11 |

Decreasing post: $f, c, e, g, h, d, a, b$.

**(b) Phase 2 (searches in $G$).**
1. From $f$: $f$ has no out-edges in $G$. SCC $\{f\}$.
2. From $c$: $c \to d \to e \to c$, and $d \to f$ hits a marked vertex. SCC $\{c, d, e\}$.
3. $e$ is marked; from $g$: $g \to h \to g$, and $g \to e$ is marked. SCC $\{g, h\}$.
4. $h$, $d$ are marked; from $a$: $a \to b \to a$; $a \to f$ and $b \to c$ are marked. SCC $\{a, b\}$.

Note that the search from $c$ did not leak into $\{g, h\}$: in $G$ the edge goes $g \to e$, into $C$, not out of it.

**(c) Condensation.** Write $A = \{a,b\}$, $C = \{c,d,e\}$, $F = \{f\}$, $K = \{g,h\}$. Meta-edges: $A \to C$ (from $b \to c$), $A \to F$ (from $a \to f$), $C \to F$ (from $d \to f$), $K \to C$ (from $g \to e$). Reversing the discovery order gives a topological order: $A, K, C, F$ ($K, A, C, F$ also works).

**(d)** The sources are $A$ and $K$ (no incoming meta-edges); the only sink is $F$. At least $\max(2, 1) = 2$ edges are needed, since each source needs a new incoming edge and one edge enters only one component. Two suffice: add $f \to a$ and $f \to g$. Then every vertex reaches $f$ (every component reaches the unique sink), and $f$ reaches $a$ and $g$, from which every vertex is reachable (every component is reachable from $A$ or $K$). So the graph becomes strongly connected.`
    },
    {
      id: 'dags-dagshortest-code', type: 'code', title: 'Shortest paths in a DAG with negative weights', difficulty: 2,
      prompt: String.raw`Write <code>dagShortest(n, edges, s)</code>. The input is a **DAG** on vertices <code>0..n-1</code> with weighted edges <code>[u, v, w]</code> meaning $u \to v$ with integer weight $w$ (possibly negative; parallel edges may appear). Return an array <code>d</code> of length <code>n</code> where <code>d[v]</code> is the minimum total weight of a path from <code>s</code> to <code>v</code>, or <code>null</code> if <code>v</code> is unreachable from <code>s</code> (<code>d[s] = 0</code>). Target $O(V+E)$: no Dijkstra, no Bellman–Ford.`,
      fn: 'dagShortest',
      starter: 'function dagShortest(n, edges, s) {\n  // topological order (Kahn or DFS), then relax out-edges in that order\n}\n',
      reference: function (n, edges, s) {
        const adj = Array.from({ length: n }, () => []);
        const indeg = new Array(n).fill(0);
        for (const [u, v, w] of edges) { adj[u].push([v, w]); indeg[v]++; }
        const order = [];
        for (let v = 0; v < n; v++) if (indeg[v] === 0) order.push(v);
        for (let h = 0; h < order.length; h++) for (const [v] of adj[order[h]]) if (--indeg[v] === 0) order.push(v);
        const d = new Array(n).fill(null);
        d[s] = 0;
        for (const u of order) {
          if (d[u] === null) continue;
          for (const [v, w] of adj[u]) if (d[v] === null || d[u] + w < d[v]) d[v] = d[u] + w;
        }
        return d;
      },
      tests: [
        [1, [], 0],
        [3, [[0, 1, 1], [0, 2, 2], [2, 1, -5]], 0],
        [4, [[0, 1, 3], [1, 2, -2], [0, 2, 4], [2, 3, 1]], 1],
        [5, [[4, 3, -1], [3, 2, -1], [2, 1, -1], [1, 0, -1], [4, 0, 0]], 4],
        [5, [[0, 1, 2], [0, 1, -3], [1, 2, 5], [3, 4, 1]], 0],
        [6, [[5, 2, 7], [5, 0, -4], [4, 0, 1], [4, 1, 2], [2, 3, -6], [3, 1, 3], [0, 3, 2]], 5]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
        const edges = [];
        const m = Math.floor(Math.random() * 2.5 * n);
        for (let k = 0; k < m && n > 1; k++) {
          let a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
          if (a === b) continue;
          if (a > b) { const t = a; a = b; b = t; }
          edges.push([perm[a], perm[b], Math.floor(Math.random() * 21) - 10]);
        }
        return [n, edges, Math.floor(Math.random() * n)];
      },
      hints: [
        'In a DAG, processing vertices in topological order guarantees every predecessor of v is final before v.',
        'Initialize every distance to null (unreachable) except d[s] = 0; skip vertices that are still null when their turn comes.'
      ],
      solution: String.raw`**Recurrence.** $d(s) = 0$; $d(v) = \min_{u \to v} (d(u) + w(u \to v))$, where unreachable predecessors are ignored.

**Algorithm.** Compute a topological order (Kahn's algorithm: repeatedly remove an in-degree-0 vertex). Walk through the order; for each vertex $u$ with a known distance, relax every out-edge $u \to v$: $d(v) \leftarrow \min(d(v), d(u) + w)$. When $u$'s turn comes, all its in-neighbors precede it, so $d(u)$ is already final. Negative weights are no problem because there are no cycles.

**Time.** $O(V+E)$ for the order plus one relaxation per edge. (The test with edges $0 \to 1$ (1), $0 \to 2$ (2), $2 \to 1$ ($-5$) is the Dijkstra counterexample: the answer for vertex 1 is $-3$.)`
    },
    {
      id: 'dags-maxcoins-code', type: 'code', title: 'Implement coin collecting with SCCs', difficulty: 3,
      prompt: String.raw`Write <code>maxCoins(n, edges, coins, s)</code>. The directed graph has vertices <code>0..n-1</code> and edges <code>[u, v]</code> (cycles, self-loops and repeated edges allowed). <code>coins[v]</code> is the (nonnegative) number of coins at <code>v</code>. You start at <code>s</code> and walk along edges as long as you like, stopping anywhere; the coins at a vertex are collected the first time you are there (including <code>s</code>). Return the maximum number of coins you can collect. Target $O(V+E)$: compute SCCs, then DP over the condensation.`,
      fn: 'maxCoins',
      starter: 'function maxCoins(n, edges, coins, s) {\n  // 1) SCCs (Kosaraju-Sharir or Tarjan)\n  // 2) total coins per component\n  // 3) best(C) = total(C) + max over meta-edges C -> D of best(D)\n}\n',
      reference: function (n, edges, coins, s) {
        const adj = Array.from({ length: n }, () => []);
        const radj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); radj[v].push(u); }
        const seen = new Array(n).fill(false), order = [];
        for (let r = 0; r < n; r++) {
          if (seen[r]) continue;
          seen[r] = true;
          const st = [[r, 0]];
          while (st.length) {
            const top = st[st.length - 1];
            const v = top[0];
            if (top[1] < radj[v].length) {
              const w = radj[v][top[1]++];
              if (!seen[w]) { seen[w] = true; st.push([w, 0]); }
            } else { order.push(v); st.pop(); }
          }
        }
        const comp = new Array(n).fill(-1);
        let c = 0;
        for (let i = n - 1; i >= 0; i--) {
          const r = order[i];
          if (comp[r] !== -1) continue;
          comp[r] = c;
          const st = [r];
          while (st.length) { const x = st.pop(); for (const y of adj[x]) if (comp[y] === -1) { comp[y] = c; st.push(y); } }
          c++;
        }
        const total = new Array(c).fill(0);
        for (let v = 0; v < n; v++) total[comp[v]] += coins[v];
        const madj = Array.from({ length: c }, () => []);
        for (const [u, v] of edges) if (comp[u] !== comp[v]) madj[comp[u]].push(comp[v]);
        const best = new Array(c).fill(0);
        for (let C = 0; C < c; C++) {
          let m = 0;
          for (const D of madj[C]) if (best[D] > m) m = best[D];
          best[C] = total[C] + m;
        }
        return best[comp[s]];
      },
      tests: [
        [1, [], [5], 0],
        [3, [[0, 1], [1, 2]], [1, 2, 3], 0],
        [3, [[0, 1], [1, 2]], [1, 2, 3], 2],
        [4, [[0, 1], [1, 0], [0, 2], [1, 3]], [1, 1, 5, 7], 0],
        [5, [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 3], [0, 4]], [1, 2, 3, 4, 5], 1],
        [6, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 3], [2, 4], [4, 5], [5, 4]], [2, 10, 1, 4, 3, 3], 0],
        [4, [[1, 0], [2, 0], [3, 2]], [9, 1, 1, 1], 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 8);
        const m = Math.floor(Math.random() * 2.2 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        const coins = Array.from({ length: n }, () => Math.floor(Math.random() * 10));
        return [n, edges, coins, Math.floor(Math.random() * n)];
      },
      hints: [
        'Inside one strongly connected component you can visit every vertex and leave from any of them, so collect a component as a whole.',
        'Kosaraju–Sharir numbers components sink-first, so if C -> D is a meta-edge then D got a smaller number: process components in increasing number.',
        'Use iterative DFS if you worry about recursion depth.'
      ],
      solution: String.raw`**Collapse.** Compute SCCs; let $total(C)$ be the sum of coins in component $C$. Inside $C$ you can reach every vertex from every other, so entering $C$ lets you collect all of $total(C)$ and still leave through any of its out-edges. Once you leave $C$ you can never return (the condensation is a DAG).

**DP.** $best(C)$ = most coins collectable starting anywhere in $C$:
$$best(C) = total(C) + \max\Big(0,\ \max_{C \to D} best(D)\Big).$$
Coins are nonnegative, so continuing is never harmful, but stopping is allowed (the 0). An optimal walk visits a path $C = C_0 \to C_1 \to \dots \to C_j$ of components and collects exactly their totals, which the recurrence maximizes.

**Order.** Kosaraju–Sharir (DFS on $rev(G)$, then searches in $G$ in decreasing post order) discovers components sink-first, so every meta-edge $C \to D$ has $D$ numbered before $C$; evaluate in increasing component number. Answer $best(comp(s))$.

**Time.** SCCs, component totals, meta-edges and the DP are each $O(V+E)$.`
    },
    {
      id: 'dags-mock1-build-bundles', type: 'written', title: 'Building packages in bundles', difficulty: 3,
      tags: ['mt2-mock-1', 'scc', 'dag-dp'],
      prompt: String.raw`A software project has $n$ packages and $m$ dependency pairs. A pair $(p, q)$ means "$q$ uses $p$", so $p$ must be compiled no later than $q$; draw it as the edge $p \to q$ of the dependency graph $G$. Package $p$ takes $\tau(p) > 0$ seconds to compile. Dependencies may be cyclic, so the build tool compiles packages in **bundles**: it partitions the packages into groups, and a partition is *valid* if the **group graph** (one vertex per group, an edge $X \to Y$ whenever some $p \in X$ and $q \in Y \ne X$ have $p \to q$) is acyclic. A group takes the sum of its packages' times to compile, a group may start only once every group with an edge into it has finished, and there are unlimited machines.

**(a)** Prove that in every valid partition, each strongly connected component of $G$ lies entirely inside one group, and that the partition into SCCs is itself valid.

**(b)** The tool uses the SCC partition. Describe and analyze an $O(n + m)$ algorithm that computes the time at which the whole build finishes.

**(c)** Prove that no valid partition gives an earlier finishing time than the SCC partition.`,
      rubric: [
        '(2 pts) (a) Two packages of one SCC in different groups give a cycle in the group graph, so valid partitions are unions of SCCs',
        '(1 pt) (a) The SCC partition is valid because its group graph is the condensation, which is a DAG',
        '(1 pt) (b) Compute SCCs and the condensation H with weights T(C) = sum of tau over C, in O(n + m)',
        '(2 pts) (b) DP: F(C) = T(C) + max over C2 -> C of F(C2) (empty max 0), in topological order; answer max over C of F(C)',
        '(1 pt) (b) Justification that F(C) is the finish time of C, and O(n + m) total',
        '(3 pts) (c) Groups along any path of the condensation form contiguous blocks; the last group finishes no earlier than the sum of the SCC times along the path; so every valid partition finishes no earlier than the heaviest condensation path'
      ],
      hints: [
        'If two packages can each reach the other in G, what happens to their groups in the group graph?',
        'With unlimited machines, a group finishes at its own time plus the latest finish among the groups it waits for: a longest-path DP.',
        'For (c): on a path C_1 -> C_2 -> ... -> C_k of the condensation, can a group contain C_i and C_j but not some C_l in between?'
      ],
      solution: String.raw`Let $H$ be the condensation of $G$, with weight $T(C) = \sum_{p \in C} \tau(p)$ on each component $C$.

**(a) Valid partitions are unions of SCCs.** Suppose $p$ and $q$ are in the same SCC but in different groups $X \ni p$ and $Y \ni q$. Take a path $p \leadsto q$ in $G$. Each of its edges stays inside a group or produces a group-graph edge, so the group graph has a walk $X \leadsto Y$; it is nonempty because the groups differ. Likewise the path $q \leadsto p$ gives a walk $Y \leadsto X$. Together they form a closed walk through $X \ne Y$ in the group graph, which therefore contains a cycle. So the partition is not valid. Hence in a valid partition every SCC lies inside one group.

**The SCC partition is valid.** Its group graph is exactly the condensation $H$, and the condensation of any directed graph is a DAG.

**(b) Algorithm.**
1. Compute the SCCs of $G$ (Kosaraju–Sharir or Tarjan), $O(n + m)$.
2. Compute $T(C)$ for every component, $O(n)$, and the meta-edges $comp(p) \to comp(q)$ for every edge with different labels, $O(m)$.
3. DP. $F(C)$ = the time at which bundle $C$ finishes compiling:
$$F(C) = T(C) + \max_{C' \to C} F(C'), \qquad \max \emptyset = 0.$$
Evaluate in topological order of $H$ (for Kosaraju–Sharir, the reverse of the order in which it discovers the components, since it finds them sink-first).
4. Output $\max_C F(C)$.

*Why $F(C)$ is the finish time.* With unlimited machines, a bundle starts exactly when the last bundle with an edge into it finishes (at time 0 if there is none), and then runs for $T(C)$ seconds. That is the recurrence; induction in topological order shows $F(C)$ is the actual finish time. Unrolling it, $F(C)$ is the maximum total weight of a path in $H$ ending at $C$, so the build time is the weight of the heaviest path in $H$.

*Time.* Each step is linear: $O(n + m)$.

**(c) Coarser bundles cannot help.** Fix any valid partition $\mathcal P$; by (a) each of its groups is a union of SCCs. Let $C_1 \to C_2 \to \dots \to C_k$ be a heaviest path in $H$, of weight $W = \sum_i T(C_i)$, which is the SCC partition's finish time by (b).

*Claim: the groups of $\mathcal P$ containing $C_1, \dots, C_k$ form contiguous blocks along the path.* Suppose $C_i$ and $C_j$ ($i < j$) lie in the same group $X$ but some $C_l$ with $i < l < j$ lies in a different group $Y$. The path segment from $C_i$ to $C_l$ gives a group-graph walk $X \leadsto Y$, and the segment from $C_l$ to $C_j$ gives a walk $Y \leadsto X$, both nonempty since $X \ne Y$: a cycle in the group graph, contradicting validity.

So the path passes through distinct groups $X_1, X_2, \dots, X_r$ in this order, each consecutive pair joined by a group-graph edge (from the path edge where the block changes). Hence $X_{i+1}$ cannot start before $X_i$ finishes, and $X_r$ finishes no earlier than $\sum_i time(X_i)$. Each block's time is at least the total of the path components it contains, and the blocks partition $C_1, \dots, C_k$, so $\sum_i time(X_i) \ge W$. Therefore $\mathcal P$ finishes no earlier than $W$, which is what the SCC partition achieves. ∎`
    },
    {
      id: 'dags-p2-structures', type: 'written', title: 'Practice Midterm 2 · Problem 1: Find the structures', difficulty: 1,
      tags: ['mt2-practice-2', 'dfs', 'bfs', 'shortest paths', 'topological sort'],
      prompt: String.raw`***Clearly*** indicate the following structures in the directed graph below. To indicate a subset of edges, draw a heavy line along each edge. If the requested structure does not exist, write NONE.

~~~graph
directed
t u 4
t v 3
t x 6
t y 2
v u 2
u x 1
u w 5
u z 4
v w 6
v z -2
w y 2
w z 4
z y -7
y x 2
z x 1
~~~

- **(a)** A depth-first search tree rooted at $v$
- **(b)** A breadth-first search tree rooted at $w$
- **(c)** A shortest-path tree rooted at $t$
- **(d)** A list of vertices in topological order

*From the official Fall 2026 Midterm 2 Practice 2. The graph is redrawn from the handout; its 15 edges are:* $t{\to}u\ 4$, $t{\to}v\ 3$, $t{\to}x\ 6$, $t{\to}y\ 2$, $v{\to}u\ 2$, $u{\to}x\ 1$, $u{\to}w\ 5$, $u{\to}z\ 4$, $v{\to}w\ 6$, $v{\to}z\ {-2}$, $w{\to}y\ 2$, $w{\to}z\ 4$, $z{\to}y\ {-7}$, $y{\to}x\ 2$, $z{\to}x\ 1$. *If your copy of the figure differs from this list, trust your copy.*`,
      rubric: [
        '(2 pts) (a) A valid DFS tree from v: spans exactly the vertices reachable from v, and every non-tree edge is consistent with some DFS order',
        '(3 pts) (b) A valid BFS tree from w: spans the vertices reachable from w, with each vertex at its correct BFS depth',
        '(3 pts) (c) A correct shortest-path tree from t (negative edges are fine here because the graph is a DAG)',
        '(2 pts) (d) A correct topological order',
      ],
      hints: [
        String.raw`Check first whether the graph has a cycle. If it is a DAG, (d) exists and (c) can be computed by dynamic programming in topological order, negative edges and all.`,
        String.raw`Only vertices reachable from the root belong in a search tree.`,
      ],
      checks: [
        { type: 'short', q: String.raw`Give the topological order, as a string of vertex names (for example <code>tuvwxyz</code>).`, answer: ['tvuwzyx', 't,v,u,w,z,y,x', 't v u w z y x'],
          explain: String.raw`$t$ is the only source. Next $v$ must come before $u$ (edge $v \to u$), $u$ before $w$, $w$ before $z$, $z$ before $y$, and $y$ before $x$. Since $t \to v \to u \to w \to z \to y \to x$ is a path through every vertex, this order **t v u w z y x** is the **only** topological order.` },
        { type: 'short', q: String.raw`What is $dist(t, x)$, the length of a shortest path from $t$ to $x$?`, answer: ['-4', '−4'],
          explain: String.raw`In topological order: $d(t) = 0$, $d(v) = 3$, $d(u) = \min(4, 3 + 2) = 4$, $d(w) = \min(4 + 5, 3 + 6) = 9$, $d(z) = \min(4 + 4, 3 - 2, 9 + 4) = 1$, $d(y) = \min(2, 9 + 2, 1 - 7) = -6$, $d(x) = \min(6, 4 + 1, -6 + 2, 1 + 1) = \mathbf{-4}$, via $t \to v \to z \to y \to x$.` },
        { type: 'mc', q: String.raw`In the shortest-path tree rooted at $t$, what is the parent of $y$?`, choices: [String.raw`$t$`, String.raw`$w$`, String.raw`$z$`, String.raw`$x$`], answer: 2,
          explain: String.raw`$d(y) = d(z) + \ell(z \to y) = 1 - 7 = -6$, which beats the direct edge $t \to y$ of length 2. So $y$'s parent is $z$. (The direct edge is a trap: with negative edges, one hop is not necessarily the shortest.)` },
        { type: 'multi', q: String.raw`Which vertices does a breadth-first search from $w$ reach? (select all that apply)`, choices: ['t', 'u', 'v', 'x', 'y', 'z'], answer: [3, 4, 5],
          explain: String.raw`$w$'s out-edges go to $y$ and $z$ (depth 1), and both lead to $x$ (depth 2). Nothing reaches back to $t$, $u$ or $v$. The BFS tree is $w \to y$, $w \to z$, plus one of $y \to x$ or $z \to x$.` },
        { type: 'tf', q: String.raw`Running Dijkstra's algorithm from $t$ on this graph would compute correct distances.`, answer: false,
          explain: String.raw`Dijkstra extracts $y$ early, with tentative distance 2 from the edge $t \to y$, and never revisits it, so it misses the $-6$ path through $z \to y$ (weight $-7$). For a DAG, the correct tool is the dynamic program over a topological order, which handles negative edges in $O(V + E)$ time.` },
      ],
      solution: String.raw`**First, is it a DAG?** Yes. The order $t, v, u, w, z, y, x$ puts every edge forward (check: $t \to$ everything, $v \to u, w, z$; $u \to w, z, x$; $w \to z, y$; $z \to y, x$; $y \to x$). So (d) exists, and in (c) the negative edges cause no trouble.

### (a) DFS tree rooted at $v$

$v$ reaches $u, w, x, y, z$ but not $t$. One valid DFS (neighbors in alphabetical order): $v \to u$, $u \to w$, $w \to y$, $y \to x$, then back up to $w$ and $w \to z$.

**Tree edges:** $v{\to}u,\ u{\to}w,\ w{\to}y,\ y{\to}x,\ w{\to}z$.

Other DFS trees are also correct if they come from some order of visiting neighbors. For example, starting $v \to z$ first gives $v{\to}z$, $z{\to}x$, $z{\to}y$, $v{\to}u$, $u{\to}w$.

### (b) BFS tree rooted at $w$

$w$ reaches only $y, z$ (depth 1) and $x$ (depth 2).

**Tree edges:** $w{\to}y,\ w{\to}z$, and one of $y{\to}x$ or $z{\to}x$.

### (c) Shortest-path tree rooted at $t$

Process the vertices in topological order, relaxing each vertex's out-edges:

| vertex | $t$ | $v$ | $u$ | $w$ | $z$ | $y$ | $x$ |
|---|---|---|---|---|---|---|---|
| distance | 0 | 3 | 4 | 9 | 1 | $-6$ | $-4$ |
| parent | — | $t$ | $t$ | $u$ or $v$ (tie) | $v$ | $z$ | $y$ |

**Tree edges:** $t{\to}v,\ t{\to}u,\ u{\to}w$ (or $v{\to}w$),$\ v{\to}z,\ z{\to}y,\ y{\to}x$.

### (d) Topological order

$t, v, u, w, z, y, x$. It is the **only** topological order, because consecutive vertices are joined by edges ($t{\to}v{\to}u{\to}w{\to}z{\to}y{\to}x$ is a Hamiltonian path).

> **Exam tip.** Before drawing a shortest-path tree, look at the edge signs. A negative edge means you cannot use Dijkstra. A DAG means you can simply relax in topological order. A negative **cycle** reachable from the root would mean the tree does not exist.`,
    },
    {
      id: 'dags-p2-burgoo', type: 'written', title: 'Practice Midterm 2 · Problem 5: Speed-running a degree', difficulty: 3,
      tags: ['mt2-practice-2', 'dag', 'longest path', 'scheduling'], code: 'dags-p2-burgoo-code',
      prompt: String.raw`You decide to complete your degree at Burgoo Polytechnic. Burgoo has an extremely rigid CS program: there is a single set of classes that *all* CS majors *must* take, and prerequisites are strictly enforced. On the other hand, the classes are easy and there is no limit on the number of classes you can take in a single term. You rationally decide to speed-run your degree, but how?

**(a)** Suppose you are given a directed acyclic graph $G = (V, E)$, where every vertex represents a required class and each edge $u \to v$ indicates that class $u$ must be completed before you can begin class $v$. Describe an algorithm that computes a class schedule that uses the minimum number of terms; for each required class, the output of your algorithm should specify the term when you will take that class.

**(b)** Burgoo relaxes its degree requirements due to massive overcrowding. Describe an algorithm that computes the minimum number of terms required to take ***at least 75%*** of the classes represented in $G$, while still obeying all prerequisite constraints. *[Hint: Use the output of your algorithm for part (a).]*

*From the official Fall 2026 Midterm 2 Practice 2 (story shortened).*`,
      rubric: [
        '(2 pts) (a) Define term(v) as 1 + the max term of its prerequisites (the number of vertices on a longest path ending at v)',
        '(2 pts) (a) Compute it in topological order in O(V + E); output term(v) for every class',
        '(1 pt) (a) Argue optimality: no schedule can put v earlier than term(v)',
        '(3 pts) (b) Observe that in T terms you can take exactly the classes with term(v) <= T',
        '(2 pts) (b) Return the smallest T for which that count is at least 0.75 V; running time',
      ],
      hints: [
        String.raw`Class $v$ cannot be taken before every class on any prerequisite chain ending at $v$ has been taken, one per term.`,
        String.raw`For (b): if you are allowed $T$ terms, which classes can you possibly take, and can you take all of them at once?`,
      ],
      checks: [
        { type: 'mc', q: String.raw`In the optimal schedule for (a), class $v$ is taken in term`, choices: [
          String.raw`The number of vertices on a **longest** path that ends at $v$ (so term 1 if $v$ has no prerequisites)`,
          String.raw`1 + the number of edges on a shortest path from a source to $v$`,
          String.raw`The position of $v$ in an arbitrary topological order`,
          String.raw`1 + the number of prerequisites of $v$`], answer: 0,
          explain: String.raw`$term(v) = 1 + \max\{ term(u) : u \to v \}$, or 1 when $v$ has no prerequisites: the length (in vertices) of the longest prerequisite chain ending at $v$. Shortest paths are wrong because the **longest** chain is what forces the delay. Position in a topological order is too pessimistic, since it schedules one class per term.` },
        { type: 'short', q: String.raw`The classes are $a \to b \to c$ (a chain) plus an isolated class $d$. How many terms are needed to take at least 75% of the classes?`, answer: ['2'],
          explain: String.raw`The terms are $term(a) = term(d) = 1$, $term(b) = 2$, $term(c) = 3$. 75% of 4 classes is 3 classes. With $T = 1$ you can take 2 classes ($a, d$); with $T = 2$ you can take 3 ($a, b, d$). So the answer is **2**.` },
        { type: 'mc', q: String.raw`Both parts together run in`, choices: [String.raw`$O(V + E)$`, String.raw`$O(E \log V)$`, String.raw`$O(VE)$`, String.raw`$O(2^V)$`], answer: 0,
          explain: String.raw`A topological sort plus one pass of relaxations computes every $term(v)$ in $O(V + E)$. Counting how many classes have each term value and scanning prefix sums takes $O(V)$.` },
      ],
      solution: String.raw`### (a) Minimum-term schedule

For each class $v$, define
$$term(v) = \begin{cases} 1 & \text{if } v \text{ has no prerequisites} \\ 1 + \max\{ term(u) : u \to v \in E \} & \text{otherwise.} \end{cases}$$
Equivalently, $term(v)$ is the number of vertices on a longest path in $G$ that ends at $v$.

**Algorithm.** Topologically sort $G$. Process the vertices in that order, computing $term(v)$ from its already-computed in-neighbors (or, symmetrically, push $term(u) + 1$ forward along each edge $u \to v$). Output $term(v)$ for every class. The number of terms used is $\max_v term(v)$.

**Correctness.**

- *The schedule is valid.* For every edge $u \to v$, $term(v) \ge term(u) + 1$, so $u$ is finished before $v$ starts.
- *It is optimal.* If $v_1 \to v_2 \to \dots \to v_k = v$ is any prerequisite chain, any valid schedule puts the $v_i$ in strictly increasing terms, so $v$ is taken in term $k$ or later. Applied to a longest chain, this shows no schedule can take $v$ before $term(v)$. In particular, no schedule uses fewer than $\max_v term(v)$ terms.

**Time.** $O(V + E)$ for the topological sort and the DP.

### (b) At least 75% of the classes

**Key fact.** Using at most $T$ terms, the set of classes you can take is exactly $\{ v : term(v) \le T \}$.

- *You can take all of these.* Take each such $v$ in term $term(v)$. Every prerequisite $u$ of $v$ has $term(u) < term(v) \le T$, so it is also in the set and is taken earlier.
- *You cannot take any other class.* If $term(v) > T$, then by part (a) no valid schedule finishes $v$ within $T$ terms.

**Algorithm.** Compute $term(v)$ for all $v$ as in (a). Count $N[k] = \lvert\{ v : term(v) = k \}\rvert$ for each $k$. Scan $T = 1, 2, \dots$, keeping the running sum $N[1] + \dots + N[T]$, and return the first $T$ where the sum is at least $\lceil 0.75\, V \rceil$.

**Time.** $O(V + E)$ for part (a), plus $O(V)$ for the counting and the scan: **$O(V + E)$**.`,
    },
    {
      id: 'dags-p2-burgoo-code', type: 'code', title: 'Practice 2 · Speed-running a degree (code)', difficulty: 2,
      tags: ['mt2-practice-2', 'dag', 'longest path'],
      prompt: String.raw`Implement both parts of [Speed-running a degree](#/problem/dags-p2-burgoo).

<code>speedRun(n, edges)</code>: classes are <code>0..n-1</code> ($n \ge 1$), and each pair <code>[u, v]</code> means $u$ must be completed before $v$. The graph is a DAG. Return <code>[allTerms, terms75]</code>, where <code>allTerms</code> is the minimum number of terms to take every class, and <code>terms75</code> is the minimum number of terms to take at least <code>Math.ceil(0.75 * n)</code> classes.

Example: <code>speedRun(4, [[0,1],[1,2]])</code> returns <code>[3, 2]</code>.`,
      fn: 'speedRun',
      starter: 'function speedRun(n, edges) {\n  // return [minimum terms for all classes, minimum terms for at least 75% of them]\n}\n',
      reference: function (n, edges) {
        const out = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
        for (const [u, v] of edges) { out[u].push(v); indeg[v]++; }
        const term = new Array(n).fill(1), q = [];
        for (let v = 0; v < n; v++) if (!indeg[v]) q.push(v);
        for (let h = 0; h < q.length; h++) { const u = q[h]; for (const v of out[u]) { term[v] = Math.max(term[v], term[u] + 1); if (--indeg[v] === 0) q.push(v); } }
        const maxT = Math.max(...term), cnt = new Array(maxT + 2).fill(0);
        for (const t of term) cnt[t]++;
        const need = Math.ceil(0.75 * n); let sum = 0, T = 0;
        while (sum < need) { T++; sum += cnt[T]; }
        return [maxT, T];
      },
      tests: [
        [4, [[0, 1], [1, 2]]],
        [1, []],
        [4, [[0, 1], [1, 2], [2, 3]]],
        [8, [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [0, 6], [6, 7]]],
        [5, [[0, 4], [1, 4], [2, 4], [3, 4]]],
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10), edges = [];
        for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) if (Math.random() < 0.25) edges.push([u, v]);
        // relabel vertices randomly so the input is not already topologically sorted
        const p = Array.from({ length: n }, (_, i) => i).sort(() => Math.random() - 0.5);
        return [n, edges.map(([u, v]) => [p[u], p[v]])];
      },
      hints: [String.raw`Compute term(v) = 1 + max term of its prerequisites in a topological order (Kahn's algorithm works well), then count classes by term.`],
      solution: String.raw`~~~pseudo
function speedRun(n, edges) {
  const out = Array.from({ length: n }, () => []), indeg = new Array(n).fill(0);
  for (const [u, v] of edges) { out[u].push(v); indeg[v]++; }
  const term = new Array(n).fill(1), q = [];
  for (let v = 0; v < n; v++) if (!indeg[v]) q.push(v);
  for (let h = 0; h < q.length; h++) {                 // Kahn's algorithm = topological order
    const u = q[h];
    for (const v of out[u]) { term[v] = Math.max(term[v], term[u] + 1); if (--indeg[v] === 0) q.push(v); }
  }
  const maxT = Math.max(...term), cnt = new Array(maxT + 2).fill(0);
  for (const t of term) cnt[t]++;
  const need = Math.ceil(0.75 * n);
  let sum = 0, T = 0;
  while (sum < need) { T++; sum += cnt[T]; }
  return [maxT, T];
}
~~~`,
    },
  ],
});
