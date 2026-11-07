CS374.topic({
  id: 'shortest',
  unit: 'algorithms',
  order: 17,
  title: 'Shortest Paths',
  summary: 'Single-source shortest paths via tense edges and relaxation: BFS, DAG shortest paths, Dijkstra, Bellman–Ford with negative-cycle detection, all-pairs algorithms (Floyd–Warshall), and modeling constrained shortest-path problems with layered graphs.',
  objectives: [
    'Explain tense edges, relaxation and why "no tense edges" certifies correct distances',
    'Choose the right SSSP algorithm (BFS, DAG DP, Dijkstra, Bellman–Ford) and state its running time and requirements',
    'Detect negative cycles with Bellman–Ford and explain why Dijkstra fails on negative edges',
    'Solve all-pairs shortest paths with repeated Dijkstra or Floyd–Warshall',
    'Model constrained shortest-path problems (coupons, alternating colors, required stops) with product/layered graphs'
  ],

  lesson: String.raw`
## The single-source shortest path problem

We are given a directed graph $G = (V, E)$ with edge lengths (weights) $\ell(u \to v)$ and a source $s$. The **length** of a walk is the sum of its edge lengths, and $dist(v)$ is the minimum length of a walk from $s$ to $v$. An undirected graph is handled by replacing each edge $uv$ with $u \to v$ and $v \to u$, both of length $\ell(uv)$.

- If $v$ is unreachable, $dist(v) = \infty$.
- If some walk from $s$ to $v$ can pass through a **negative cycle** (a cycle of negative total length), then going around it repeatedly makes the length arbitrarily small, and $dist(v) = -\infty$. Shortest paths are well defined only when no negative cycle is reachable from $s$.
- If there is no negative cycle, a shortest walk can always be taken to be a simple path (cut out any cycle, which has nonnegative length), so it has at most $V - 1$ edges.

> **Lemma.** (Optimal substructure.) If $P$ is a shortest path from $s$ to $v$ and $u$ lies on $P$, then the prefix of $P$ from $s$ to $u$ is a shortest path from $s$ to $u$.

*Proof.* If some walk $W$ from $s$ to $u$ were strictly shorter than the prefix, then $W$ followed by the suffix of $P$ from $u$ to $v$ would be a walk from $s$ to $v$ strictly shorter than $P$. ∎

So the shortest paths from $s$ can be stored compactly as a **shortest-path tree**: each vertex $v$ records its predecessor $pred(v)$ on some shortest path, and following $pred$ pointers from $v$ back to $s$ spells out that path in reverse.

> **Warning.** If an undirected graph has a negative edge $uv$, turning it into two directed edges creates the negative cycle $u \to v \to u$. Undirected shortest paths with negative edges need entirely different techniques (not covered here); in this course negative weights come with directed graphs.

There are three textbook reasons a problem might carry negative lengths: costs that can be refunds (profits), logarithms of quantities that can exceed 1 (exchange rates), and differences of potentials (Johnson's reweighting). In each case, ask first: **can a negative cycle exist, and what would it mean?** For arbitrage, a negative cycle is exactly the thing you are looking for.

## Tense edges and Ford's generic algorithm

Every algorithm in this topic maintains tentative distances $dist(v)$ and predecessors, initialized to $dist(s) = 0$ and $dist(v) = \infty$ for $v \ne s$.

> **Definition.** An edge $u \to v$ is **tense** if $dist(u) + \ell(u \to v) < dist(v)$. **Relaxing** a tense edge sets $dist(v) \leftarrow dist(u) + \ell(u \to v)$ and $pred(v) \leftarrow u$.

~~~pseudo
FordSSSP(s):
    dist(s) <- 0; pred(s) <- nil
    for every v != s: dist(v) <- infinity; pred(v) <- nil
    while some edge u -> v is tense:
        dist(v) <- dist(u) + l(u -> v)      // relax
        pred(v) <- u
~~~

> **Lemma.** (Walk invariant.) At every moment of Ford's algorithm, for every vertex $v$ with $dist(v) < \infty$, there is a walk from $s$ to $v$ of length exactly $dist(v)$. Consequently $dist(v) \ge d^*(v)$ always, where $d^*(v)$ is the true distance.

*Proof.* By induction on the number of relaxations. Initially only $dist(s) = 0$ is finite, the length of the empty walk. When we relax $u \to v$, by induction there is a walk $W$ from $s$ to $u$ of length $dist(u)$, and $W$ followed by the edge $u \to v$ is a walk of length $dist(u) + \ell(u \to v)$, the new value of $dist(v)$. No other value changes. ∎

> **Theorem.** (No tense edges means correct.) Suppose no negative cycle is reachable from $s$. If no edge is tense, then $dist(v) = d^*(v)$ for every vertex $v$, and the $pred$ pointers form a shortest-path tree.

*Proof.* Fix a reachable $v$ and a shortest path $s = v_0 \to v_1 \to \dots \to v_k = v$. We show $dist(v_i) \le d^*(v_i)$ by induction on $i$. For $i = 0$, $dist(s) \le 0 = d^*(s)$ (it starts at 0 and only decreases; it cannot go below $d^*(s) = 0$ by the walk invariant). For $i \ge 1$, because $v_{i-1} \to v_i$ is not tense,
$$dist(v_i) \le dist(v_{i-1}) + \ell(v_{i-1} \to v_i) \le d^*(v_{i-1}) + \ell(v_{i-1} \to v_i) = d^*(v_i),$$
where the last equality is optimal substructure. Combined with the walk invariant, $dist(v_i) = d^*(v_i)$. Unreachable vertices keep $\infty$ by the walk invariant. For the tree: when $pred(v)$ was last set to $u$ we had $dist(v) = dist(u) + \ell(u \to v)$ with the then-current $dist(u)$, which can only have decreased since, so now $dist(v) \ge dist(u) + \ell(u \to v)$; non-tenseness gives the reverse inequality. So every $pred$ edge is tight, $d^*(v) = d^*(pred(v)) + \ell(pred(v) \to v)$, and following $pred$ pointers traces a shortest path. ∎

*Termination.* With integer lengths and no reachable negative cycle, every relaxation lowers some $dist(v)$ by at least 1 and $dist(v)$ never drops below $d^*(v) > -\infty$, so the loop ends. (It also terminates for real lengths, but the argument is more delicate.) An arbitrary relaxation order can take **exponentially** many steps. Each specific algorithm below is Ford's algorithm with a **clever choice of which edges to relax, in which order**, and its correctness proof always boils down to "when we stop, nothing is tense".

## Unweighted graphs: BFS

If every edge has length 1, BFS computes all distances in $O(V+E)$ time. BFS is Ford's algorithm in which the queue guarantees that each vertex's out-edges are relaxed exactly once, after its distance is final: vertices leave the queue in nondecreasing order of distance. If every edge has the same length $c > 0$, BFS still finds the shortest paths (multiply its answer by $c$).

> **Warning.** BFS on a graph with **different** positive lengths is wrong: BFS minimizes the number of edges, not their total length. A two-edge path of length 2 beats a one-edge path of length 10, but BFS reaches the far end first along the single edge.

**Small integer lengths.** If all lengths are in $\{0, 1\}$, use **0-1 BFS**: a deque in which a vertex reached by a 0-edge is pushed to the front and one reached by a 1-edge to the back. It is Dijkstra with a two-bucket priority queue and runs in $O(V+E)$. If lengths are positive integers bounded by a small constant $L$, subdividing each edge into unit edges and running BFS costs $O(V + LE)$.

## DAGs: relax in topological order

If $G$ is a DAG, process the vertices in topological order and relax all edges out of each vertex. Equivalently, solve the recurrence
$$dist(v) = \begin{cases} 0 & v = s \\ \min_{u \to v} \big(dist(u) + \ell(u \to v)\big) & \text{otherwise}\end{cases}$$
in topological order (an empty minimum is $\infty$).

*Why it is correct.* When vertex $v$ is processed, every in-neighbor $u$ precedes it in the order, so $dist(u)$ is already final and $u \to v$ has already been relaxed. After $v$'s out-edges are relaxed they can never become tense again, because $dist(v)$ never changes afterward. So at the end nothing is tense, and the theorem above applies.

Time $O(V+E)$. **Negative edge lengths are fine** (a DAG has no cycles at all, let alone negative ones). Negating all lengths gives **longest** paths in DAGs, and replacing $\min$ by $\max$ directly does the same.

## Dijkstra's algorithm

When all edge lengths are **nonnegative**, always relax the out-edges of the unfinished vertex with the smallest tentative distance.

~~~pseudo
Dijkstra(s):
    initialize dist and pred as in Ford
    put every vertex in a priority queue Q keyed by dist
    while Q is not empty:
        u <- ExtractMin(Q)
        for each edge u -> v:
            if dist(u) + l(u -> v) < dist(v):     // tense
                dist(v) <- dist(u) + l(u -> v)
                pred(v) <- u
                DecreaseKey(Q, v, dist(v))
~~~

> **Theorem.** If all edge lengths are nonnegative, then when Dijkstra extracts $u$, $dist(u)$ already equals the true distance $d^*(u)$. Hence every vertex is extracted once and the final distances are correct.

*Proof.* Suppose not, and let $u$ be the first vertex extracted with $dist(u) > d^*(u)$. Then $u \ne s$ and $d^*(u) < \infty$. Take a shortest path $P$ from $s$ to $u$, and let $y$ be the first vertex on $P$ that has not yet been extracted at the moment $u$ is extracted ($y$ exists because $u$ itself is not yet extracted), with predecessor $x$ on $P$. Since $x$ was extracted before $u$, by the choice of $u$ we have $dist(x) = d^*(x)$, and the edge $x \to y$ was relaxed when $x$ was extracted. Therefore
$$dist(y) \le d^*(x) + \ell(x \to y) = d^*(y) \le d^*(u) < dist(u).$$
The equality is optimal substructure; the inequality $d^*(y) \le d^*(u)$ holds because the rest of $P$ from $y$ to $u$ has **nonnegative** length. So $y$ has a strictly smaller key than $u$, contradicting that $u$ was extracted first. ∎

The proof also shows that the extracted keys are **nondecreasing**: Dijkstra finalizes vertices in order of distance from $s$, like BFS does for unit lengths. That is why you can stop Dijkstra as soon as $t$ is extracted.

**Running time.** $V$ Inserts, $V$ ExtractMins, and at most $E$ DecreaseKeys. With a binary heap each costs $O(\log V)$: total $O((V+E)\log V)$, usually written $O(E \log V)$ when every vertex is reachable. With a Fibonacci heap: $O(E + V \log V)$. With an unsorted array (scan for the minimum): $O(V^2 + E) = O(V^2)$, which is the best choice for dense graphs. A common "lazy" implementation inserts a new copy of $v$ instead of decreasing its key and skips stale copies on extraction; that is still $O(E \log V)$ since the heap holds at most $E + 1$ entries and $\log E \le 2 \log V$.

**Example.** Dijkstra from $s$ on the graph below. Try it yourself first, then step through it (you can also paste it into the [Graph Algorithms Lab](#/lab/graph) and choose Dijkstra).

~~~graph
directed
s a 4
s b 1
b a 2
a c 1
b c 5
c t 3
b t 8
~~~

~~~steps Dijkstra by hand
**Initialize.** $dist(s) = 0$; $a, b, c, t$ are $\infty$. Every vertex is in the queue.
+++
**Extract $s$ (0).** Relax $s \to a$: $a = 4$. Relax $s \to b$: $b = 1$. Queue keys: $a{:}4$, $b{:}1$, $c{:}\infty$, $t{:}\infty$.
+++
**Extract $b$ (1)**, the smallest key. Relax $b \to a$: $1 + 2 = 3 < 4$, so $a = 3$, $pred(a) = b$. Relax $b \to c$: $c = 6$. Relax $b \to t$: $t = 9$.
+++
**Extract $a$ (3).** Relax $a \to c$: $3 + 1 = 4 < 6$, so $c = 4$, $pred(c) = a$.
+++
**Extract $c$ (4).** Relax $c \to t$: $4 + 3 = 7 < 9$, so $t = 7$, $pred(t) = c$.
+++
**Extract $t$ (7).** No out-edges. Done. Final distances: $s{:}0$, $b{:}1$, $a{:}3$, $c{:}4$, $t{:}7$. Following $pred$ from $t$: $t \leftarrow c \leftarrow a \leftarrow b \leftarrow s$, so the shortest path is $s \to b \to a \to c \to t$ of length 7. Notice the extracted keys $0, 1, 3, 4, 7$ are nondecreasing, as the proof promised.
~~~

**Why negative edges break it.** With edges $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$), Dijkstra extracts $a$ with $dist(a) = 2$ before discovering the shorter path $s \to b \to a$ of length 1. Once $a$ is extracted, its out-edges are never revisited, so anything after $a$ is wrong too. In the proof, the step $d^*(y) \le d^*(u)$ is exactly what fails: here $y = b$ has $d^*(b) = 3 > d^*(a) = 1$.

~~~graph
directed
s a 2
s b 3
b a -2
a c 1
~~~

> **Warning.** "Fixing" negative weights by adding a large constant $c$ to every edge does **not** work: a path with $k$ edges grows by $kc$, which penalizes paths with many edges and can change which path is shortest. (Multiplying all lengths by a positive constant is harmless.)

(Erickson's notes present a variant of Dijkstra that may re-insert a vertex whose distance drops. That variant is still correct with negative edges as long as there is no negative cycle, but it can take exponential time; with nonnegative edges it is the algorithm above.)

## Bellman–Ford

Bellman–Ford handles **arbitrary** lengths and detects negative cycles: relax **every** edge, $V - 1$ times.

~~~pseudo
BellmanFord(s):
    initialize dist and pred as in Ford
    repeat V - 1 times:
        for every edge u -> v:
            if u -> v is tense: relax it
    for every edge u -> v:
        if u -> v is tense: return "negative cycle reachable from s"
    return dist
~~~

> **Lemma.** (Bellman–Ford invariant.) After $i$ rounds, for every vertex $v$, $dist(v)$ is at most the length of the shortest walk from $s$ to $v$ that uses at most $i$ edges.

*Proof.* Induction on $i$. After 0 rounds, $dist(s) = 0$ and the only walk with 0 edges is the empty walk at $s$; other vertices have no such walk, so the claim is vacuous ($\infty \le \infty$). For $i \ge 1$, let $W$ be a shortest walk from $s$ to $v$ with at most $i$ edges. If $W$ has fewer than $i$ edges, the claim follows from the induction hypothesis (values only decrease). Otherwise $W$ is a walk $W'$ to some $u$ with $i-1$ edges followed by the edge $u \to v$. After round $i-1$, $dist(u) \le \ell(W')$ by induction. During round $i$ the edge $u \to v$ is examined, and immediately afterward $dist(v) \le dist(u) + \ell(u \to v) \le \ell(W') + \ell(u \to v) = \ell(W)$. Later steps only decrease $dist(v)$. ∎

If no negative cycle is reachable from $s$, every vertex has a shortest walk that is a simple path with at most $V - 1$ edges, so after $V - 1$ rounds $dist(v) \le d^*(v)$, and with the walk invariant, equality. Time: $O(VE)$. A round that changes nothing means nothing is tense, so you may stop early.

~~~steps Bellman–Ford, round by round
**Setup.** Vertices $s, a, b, c$. Edges, processed in this fixed order each round: (1) $a \to c$ (2), (2) $b \to a$ ($-3$), (3) $s \to a$ (4), (4) $s \to b$ (2), (5) $c \to b$ (5). Initially $s = 0$, $a = b = c = \infty$. There are $V - 1 = 3$ rounds.
+++
**Round 1.** (1) $a$ is $\infty$: skip. (2) $b$ is $\infty$: skip. (3) $a = 4$. (4) $b = 2$. (5) $c$ is $\infty$: skip. Now $a = 4$, $b = 2$, $c = \infty$: exactly the best walks with at most one edge.
+++
**Round 2.** (1) $c = 4 + 2 = 6$. (2) $2 - 3 = -1 < 4$, so $a = -1$. (3), (4) not tense. (5) $6 + 5 = 11 > 2$: not tense. Now $a = -1$, $b = 2$, $c = 6$. Note $c = 6$ is the best walk with at most 2 edges ($s \to a \to c$), even though $a$ has just improved.
+++
**Round 3.** (1) $-1 + 2 = 1 < 6$, so $c = 1$. Nothing else is tense ((5): $1 + 5 = 6 > 2$). Final: $s = 0$, $a = -1$, $b = 2$, $c = 1$; the path to $c$ is $s \to b \to a \to c$ with three edges, which is why it needed three rounds with this edge order.
+++
**Check round.** Scanning all edges again finds nothing tense, so there is no negative cycle reachable from $s$, and the distances are final. (If edge (5) had length 0, the cycle $b \to a \to c \to b$ would have length $-1$ and the check would find a tense edge.)
~~~

> **Theorem.** (Negative-cycle detection.) After $V-1$ rounds, some edge is still tense if and only if a negative cycle is reachable from $s$.

*Proof.* If no negative cycle is reachable, the distances are correct after $V-1$ rounds, and correct distances satisfy $d^*(v) \le d^*(u) + \ell(u \to v)$ for every edge (the triangle inequality), so nothing is tense. Conversely, suppose a negative cycle $v_0 \to v_1 \to \dots \to v_k = v_0$ is reachable from $s$. All its vertices are reachable by paths with at most $V - 1$ edges, so their $dist$ values are finite. If none of its edges were tense, then $dist(v_i) \le dist(v_{i-1}) + \ell(v_{i-1} \to v_i)$ for each $i$; summing over the cycle, the $dist$ terms cancel (each vertex appears once on each side) and we get $0 \le \sum_i \ell(v_{i-1} \to v_i) < 0$, a contradiction. ∎

To find **every** negative cycle (not only those reachable from $s$), add a new vertex $z$ with a 0-length edge to every vertex and run Bellman–Ford from $z$. To output an actual negative cycle: take the head $v$ of a tense edge, relax it, follow $pred$ pointers $V$ times to land on a vertex $x$ that is certainly on a cycle of the predecessor graph, and then follow $pred$ from $x$ until you return to $x$.

**DP view.** Bellman–Ford is the dynamic program
$$d_i(v) = \min\Big(d_{i-1}(v),\ \min_{u \to v} \big(d_{i-1}(u) + \ell(u\to v)\big)\Big), \qquad d_0(s) = 0,\ d_0(v) = \infty \text{ otherwise},$$
where $d_i(v)$ is the length of the shortest walk from $s$ to $v$ using **at most $i$ edges**.

> **Exam tip.** If a problem asks for the shortest walk with **at most $k$ edges**, use this DP with **two separate arrays** ($d_{i-1}$ and $d_i$) for $k$ rounds: $O(kE)$ time. The usual in-place Bellman–Ford may chain several relaxations in a single round and so can use more than $i$ edges after $i$ rounds; that is fine for ordinary SSSP but wrong for an edge-count constraint.

## Choosing an SSSP algorithm

| Graph | Algorithm | Time |
|---|---|---|
| unweighted (all lengths 1, or all equal) | BFS | $O(V+E)$ |
| lengths in $\{0, 1\}$ | 0-1 BFS (deque) | $O(V+E)$ |
| DAG, any lengths | DP in topological order | $O(V+E)$ |
| nonnegative lengths | Dijkstra (binary heap) | $O(E \log V)$ |
| nonnegative lengths, dense | Dijkstra (array) | $O(V^2)$ |
| arbitrary lengths, maybe negative cycles | Bellman–Ford | $O(VE)$ |

Use the **first applicable row**. Ask in order: Is it unweighted? Is it a DAG (or is the constructed graph a DAG, e.g. because some coordinate strictly increases along every edge)? Are lengths nonnegative? Only if all answers are no do you pay for Bellman–Ford.

> **Warning.** **Longest simple path** in a general graph is NP-hard (it contains Hamiltonian path). Negating lengths and running Bellman–Ford does not help: positive cycles become negative cycles and the "distances" are $-\infty$. Longest paths are easy only in DAGs.

## All-pairs shortest paths

Compute $dist(u, v)$ for every pair.

- **Run an SSSP algorithm from every vertex.** BFS: $O(V(V+E))$. Dijkstra (nonnegative): $O(VE \log V)$. Bellman–Ford: $O(V^2 E)$.
- **Johnson's algorithm** (for negative edges, no negative cycles): add a vertex $z$ with 0-length edges to every vertex, run Bellman–Ford once from $z$ to get potentials $\pi(v) = dist(z, v)$, reweight $\ell'(u \to v) = \pi(u) + \ell(u\to v) - \pi(v)$, then run Dijkstra from every vertex: $O(VE \log V)$. The new lengths are nonnegative by the triangle inequality $\pi(v) \le \pi(u) + \ell(u \to v)$, and every $x$-to-$y$ path changes by the same amount $\pi(x) - \pi(y)$ (the sum telescopes), so shortest paths are preserved.
- **Floyd–Warshall** (dynamic programming, any lengths, $O(V^3)$). Number the vertices $1..V$ and let $D(u, v, r)$ be the length of the shortest path from $u$ to $v$ whose **intermediate** vertices all lie in $\{1, \dots, r\}$:
$$D(u, v, r) = \min\big(D(u, v, r-1),\ D(u, r, r-1) + D(r, v, r-1)\big),$$
with $D(u, v, 0) = \ell(u \to v)$ if the edge exists, $0$ if $u = v$, and $\infty$ otherwise.

*Proof of the recurrence (no negative cycles).* Let $P$ be a shortest $u$-$v$ path with intermediates in $\{1..r\}$; it can be taken simple. If $r$ is not an intermediate vertex of $P$, then $P$ has intermediates in $\{1..r-1\}$ and $\ell(P) = D(u, v, r-1)$. Otherwise $r$ appears exactly once, splitting $P$ into a $u$-$r$ path and an $r$-$v$ path whose intermediates lie in $\{1..r-1\}$; by optimal substructure each is shortest among such paths, so $\ell(P) = D(u,r,r-1) + D(r,v,r-1)$. Both terms of the minimum are lengths of genuine walks with intermediates in $\{1..r\}$, so the minimum is exactly $D(u,v,r)$. ∎

~~~pseudo
FloydWarshall(V, l):
    for all u, v: D[u][v] <- l(u -> v), or 0 if u = v, or infinity if no edge
    for r <- 1 to V:
        for u <- 1 to V:
            for v <- 1 to V:
                if D[u][r] + D[r][v] < D[u][v]:
                    D[u][v] <- D[u][r] + D[r][v]
    return D
~~~

The third index can be dropped: during iteration $r$, entries $D[u][r]$ and $D[r][v]$ would change only if $D[r][r] < 0$, i.e. only with a negative cycle. Time $O(V^3)$, space $O(V^2)$. A negative cycle exists iff some $D[v][v] < 0$ at the end. **Order of loops matters:** $r$ must be the outermost loop.

| APSP setting | Best choice |
|---|---|
| unweighted | BFS from each vertex, $O(VE)$ (for connected graphs) |
| nonnegative, sparse | Dijkstra from each vertex, $O(VE \log V)$ |
| nonnegative, dense | Floyd–Warshall $O(V^3)$ or array Dijkstra $V \times O(V^2)$ |
| negative edges, sparse | Johnson, $O(VE \log V)$ |
| negative edges, dense | Floyd–Warshall, $O(V^3)$ |

## Modeling with shortest paths

Exactly as with reachability, constrained shortest-path problems are solved by building a new graph and running Dijkstra (or BFS/Bellman–Ford/DAG DP) on it as a **black box**. A complete answer has these parts:

1. **Vertices** of the new graph $H$ and what each one means in English.
2. **Edges** of $H$ and their **lengths** (say which original edge or action each one models).
3. **Source and target(s)**; if there are several target copies, take a minimum or add a super-target with 0-length edges.
4. **Algorithm**, justified by the edge lengths (nonnegative ⇒ Dijkstra; DAG ⇒ DP; unit ⇒ BFS).
5. **Correctness** in one or two sentences: valid solutions ↔ walks in $H$, with equal cost.
6. **Running time** in terms of the **original** input: count $|V(H)|$, $|E(H)|$ and substitute.

### Vertex costs

If passing through vertex $v$ costs $c(v) \ge 0$, either add $c(v)$ to every edge **entering** $v$ (and pay $c(s)$ separately), or split $v$ into $v_{in} \to v_{out}$ with an edge of length $c(v)$ (all edges into $v$ go to $v_{in}$, all edges out of $v$ leave from $v_{out}$). Splitting doubles the vertex count and adds $V$ edges; neither changes the asymptotic time.

### Worked example 1 (try it first): at most $k$ discount coupons

*Problem.* Directed graph with nonnegative lengths; you hold $k$ coupons, each of which lets you traverse one edge at half price. Find the cheapest $s$-$t$ route.

~~~reveal Solution: coupons
*Model.* Vertices $(v, i)$ for $0 \le i \le k$: "at $v$, having used $i$ coupons". For each edge $u \to v$ of length $\ell$ and each $i$: edge $(u,i) \to (v,i)$ of length $\ell$ (pay full price), and if $i < k$, edge $(u, i) \to (v, i+1)$ of length $\ell/2$ (use a coupon). All lengths are nonnegative, so run Dijkstra from $(s, 0)$; answer $\min_i dist(t, i)$.

*Correctness.* A route together with a choice of at most $k$ discounted edges maps to the walk in $H$ that moves up a layer exactly at the discounted edges, at the same cost, and every walk from $(s,0)$ maps back.

*Time.* $(k+1)V$ vertices and at most $2(k+1)E$ edges: $O(kE \log(kV))$. An optimal route can be taken to be a simple path (cutting out a loop never increases cost), so at most $V-1$ coupons are useful; we may assume $k < V$ and the bound is $O(kE \log V)$.
~~~

~~~~steps Building the coupon graph for a tiny instance
**Instance.** Edges $s \to a$ (10), $a \to t$ (10), $s \to t$ (40), and $k = 1$ coupon. Without coupons the best route is $s \to a \to t$ for 20.
+++
**Layers.** Two copies of every vertex: layer 0 ($s_0, a_0, t_0$, no coupon used) and layer 1 ($s_1, a_1, t_1$, coupon used). Each original edge is copied inside each layer at full price.
+++
**Coupon edges.** Each original edge also gets a half-price copy from layer 0 to layer 1: $s_0 \to a_1$ (5), $a_0 \to t_1$ (5), $s_0 \to t_1$ (20). There are no edges from layer 1 back to layer 0 (coupons are never returned), so $H$ is directed even if $G$ had been undirected.

~~~graph
directed
s0 a0 10
a0 t0 10
s0 t0 40
s1 a1 10
a1 t1 10
s1 t1 40
s0 a1 5
a0 t1 5
s0 t1 20
~~~
+++
**Run Dijkstra from $s_0$.** Extract $s_0$ (0): $a_0 = 10$, $t_0 = 40$, $a_1 = 5$, $t_1 = 20$. Extract $a_1$ (5): $t_1 = \min(20, 15) = 15$. Extract $a_0$ (10): $t_0 = 20$, and $a_0 \to t_1$ offers $15$, no improvement. Extract $t_1$ (15).
+++
**Read off the answer.** $\min(dist(t_0), dist(t_1)) = \min(20, 15) = 15$, achieved by $s \to a$ with the coupon and then $a \to t$ at full price (or the reverse). Time on this instance is tiny, but in general: $(k+1)V$ vertices, $\le 2(k+1)E$ edges.
~~~~

### Worked example 2 (try it first): the fuel tank

*Problem.* A road network is an undirected graph $G = (V,E)$; driving edge $e$ uses $\ell(e)$ units of fuel, a positive integer. Every vertex $v$ has a gas station selling fuel at $p(v) \ge 0$ dollars per unit. Your tank holds at most $C$ units (an integer), and you start at $s$ with an empty tank. Find the minimum amount of money needed to reach $t$.

~~~reveal Solution: fuel tank
The amount of fuel in the tank determines which edges you can drive next, so it must be part of the state.

*Vertices.* $(v, g)$ for $v \in V$ and $0 \le g \le C$: "at $v$ with exactly $g$ units in the tank". That is $V(C+1)$ vertices.

*Edges.*
- **Buy one unit:** $(v, g) \to (v, g+1)$ with length $p(v)$, for $0 \le g < C$. Buying $j$ units is a chain of $j$ such edges, costing $j \cdot p(v)$.
- **Drive:** for every edge $uv \in E$ (both directions) and every $g \ge \ell(uv)$: $(u, g) \to (v, g - \ell(uv))$ with length $0$.

*Algorithm.* All lengths are nonnegative: Dijkstra from $(s, 0)$; the answer is $\min_g dist(t, g)$ (or add a super-target).

*Correctness.* Any legal plan (sequence of purchases and drives that never needs more fuel than the tank holds) is a walk in $H$ from $(s,0)$ with cost equal to the money spent, and conversely.

*Size and time.* $|V(H)| = V(C+1)$. Buy edges: $VC$. Drive edges: at most $2E(C+1)$. So $|E(H)| = O((V+E)C)$ and Dijkstra takes $O((V+E) C \log(VC))$. This is **pseudo-polynomial**: polynomial in the *value* $C$, not in its bit length. A common mistake is to model "buy any amount" as one edge per amount $j$, which gives $O(VC^2)$ edges; the unit-purchase chain keeps it linear in $C$.
~~~

### Worked example 3 (try it first): turning is expensive

*Problem.* A robot moves on an $n \times n$ grid in which some cells are blocked. It always faces one of the four compass directions. Moving forward one cell (into an unblocked cell) costs 1; rotating $90°$ left or right in place costs $c \ge 0$. The robot starts at cell $s$ facing north. Find the minimum cost to reach cell $t$ (facing any direction).

~~~reveal Solution: turn costs
*Vertices.* $(x, d)$ for each unblocked cell $x$ and direction $d \in \{N, E, S, W\}$: at most $4n^2$ vertices.

*Edges.* From $(x, d)$: to $(x + d, d)$ with length 1 if the neighboring cell $x + d$ exists and is unblocked; to $(x, \mathrm{left}(d))$ and $(x, \mathrm{right}(d))$ with length $c$. At most 3 out-edges per vertex, so at most $12 n^2$ edges.

*Algorithm.* Dijkstra from $(s, N)$; the answer is $\min_d dist(t, d)$. If $c$ is 0 or 1, all lengths are in $\{0,1\}$ and 0-1 BFS gives $O(n^2)$.

*Time.* $O(n^2 \log n)$ with a binary heap.

*Generalization.* For an arbitrary directed graph where the cost of a turn depends on the pair of consecutive edges, the vertices of $H$ are the **edges** of $G$ ("I just arrived along $u \to v$"), and $H$ has an edge $(u \to v) \Rightarrow (v \to w)$ of length $\ell(v \to w) + turn(u, v, w)$. Then $|V(H)| = E$ and $|E(H)| = \sum_v indeg(v) \cdot outdeg(v)$, which is $O(E \cdot \Delta)$ for maximum degree $\Delta$ and can be as large as $\Theta(E^2)$ when one intersection is very busy; say so in the analysis.
~~~

### Worked example 4 (try it first): widest path

*Problem.* Each edge of an undirected graph has a capacity $c(e) > 0$. The *bottleneck* of a path is the minimum capacity of its edges. Find the maximum bottleneck of any $s$-$t$ path.

~~~reveal Solution: bottleneck paths
**Black-box approach.** For a threshold $\beta$, let $G_\beta$ contain only the edges with $c(e) \ge \beta$. There is an $s$-$t$ path with bottleneck at least $\beta$ iff $t$ is reachable from $s$ in $G_\beta$. This property is monotone in $\beta$, and the optimum is one of the $E$ capacities. Sort the distinct capacities and binary search for the largest $\beta$ for which $t$ is reachable in $G_\beta$: $O(\log E)$ searches of $O(V + E)$ each, plus sorting, so $O(E \log E) = O(E \log V)$.

**Modified Dijkstra.** Replace "sum" by "min" and "minimize" by "maximize": $width(s) = \infty$, extract the vertex with the **largest** width, and update $width(v) \leftarrow \max(width(v), \min(width(u), c(u \to v)))$. The Dijkstra proof goes through because extending a path can never *increase* its bottleneck (the analogue of nonnegative lengths). Time $O(E \log V)$. If you modify the algorithm on an exam, you must say why its proof still works.

**MST view (preview of the next topic).** In a maximum spanning tree, the tree path between $s$ and $t$ is a widest path.
~~~

### Worked example 5 (try it first): currency arbitrage

*Problem.* There are $n$ currencies, and one unit of currency $i$ buys $R[i][j] > 0$ units of currency $j$. An *arbitrage* is a cycle $i_0 \to i_1 \to \dots \to i_k = i_0$ with $\prod R[i_{j-1}][i_j] > 1$. Decide whether an arbitrage exists.

~~~reveal Solution: arbitrage
Products turn into sums with logarithms, and "greater than 1" turns into "negative" with a minus sign:
$$\prod_j R[i_{j-1}][i_j] > 1 \iff \sum_j \log R[i_{j-1}][i_j] > 0 \iff \sum_j \big(-\log R[i_{j-1}][i_j]\big) < 0.$$

*Graph.* A complete directed graph on the $n$ currencies with $\ell(i \to j) = -\log R[i][j]$ (lengths may be negative). An arbitrage is exactly a **negative cycle**.

*Algorithm.* Add a vertex $z$ with 0-length edges to every currency (so every cycle is reachable) and run Bellman–Ford from $z$; report an arbitrage iff some edge is still tense after the rounds. Alternatively run Floyd–Warshall and check whether some $D[i][i] < 0$.

*Time.* $V = n + 1$, $E = \Theta(n^2)$, so Bellman–Ford takes $O(n^3)$; Floyd–Warshall also $O(n^3)$.

*Caveat.* In real code, floating-point logarithms need a small tolerance, but on exams assume exact arithmetic. Dijkstra is useless here: lengths are negative whenever a rate exceeds 1.
~~~

### Worked example 6 (try it first): uphill, then downhill

*Problem.* A cyclist's road network is an undirected graph with positive lengths; every vertex $v$ has a distinct elevation $h(v)$. A route from home $s$ to the office $t$ must go strictly uphill for a while and then strictly downhill (either part may be empty). Find the shortest such route.

~~~reveal Solution: uphill-downhill
*Vertices.* $(v, \mathrm{up})$ and $(v, \mathrm{down})$: at $v$, still climbing / already descending.

*Edges.* For every road $uv$ with $h(u) < h(v)$: $(u, \mathrm{up}) \to (v, \mathrm{up})$ and $(v, \mathrm{down}) \to (u, \mathrm{down})$, both of length $\ell(uv)$. For every vertex: $(v, \mathrm{up}) \to (v, \mathrm{down})$ of length 0 (the summit).

*Choose the algorithm.* Along every "up" edge elevation strictly increases, along every "down" edge it strictly decreases, and the only edges between layers go from up to down. So ordering up-vertices by increasing $h$, followed by down-vertices by decreasing $h$, is a **topological order**: $H$ is a DAG. Run the DAG shortest-path DP from $(s, \mathrm{up})$ and return $dist(t, \mathrm{down})$.

*Time.* $2V$ vertices, $2E + V$ edges: $O(V + E)$, better than Dijkstra's $O(E \log V)$ (and it would work even with negative lengths). Recognizing a hidden DAG is a frequent source of "faster" full credit.
~~~

### More standard transformations

- **Must visit a checkpoint.** To require the walk to pass through some vertex of a set $X$: two copies of the graph, layer 0 ("not yet visited $X$") and layer 1 ("visited"). Edges stay within their layer, except that an edge entering a vertex $x \in X$ from layer 0 goes to $(x, 1)$; if $s \in X$, start at $(s, 1)$. Answer: $dist((t, 1))$. For a single required vertex $x$, simply compute $dist(s, x) + dist(x, t)$.
- **Alternating colors.** Vertices $(v, c)$ = "at $v$, last edge had color $c$"; a red edge $u \to v$ gives $(u, \text{blue}) \to (v, \text{red})$, a blue one $(u, \text{red}) \to (v, \text{blue})$; a super-source lets the first edge have either color. $O(E \log V)$.
- **Maximum reliability.** If edge $e$ succeeds with probability $p(e) \in (0, 1]$, maximize the product by minimizing $\sum -\log p(e)$; these lengths are **nonnegative**, so Dijkstra applies (contrast arbitrage, where rates can exceed 1).
- **Time-dependent edges with waiting.** If you may wait at vertices and the arrival time along each edge is a nondecreasing function of the departure time (e.g., trains every $p$ minutes), then "arrive earlier" is never worse, and Dijkstra keyed by earliest arrival time is correct.
- **Second-shortest walk.** With $d_s$ from $s$ and $d_t$ to $t$ (Dijkstra on $rev(G)$), the shortest walk strictly longer than $d_s(t)$ has length $\min\{d_s(u) + \ell(u\to v) + d_t(v) : \text{this value} > d_s(t)\}$ over all edges.

## Common exam problem patterns

| Pattern | Recipe |
|---|---|
| "at most $k$ special edges / coupons / free rides" | Layers $V \times \{0..k\}$; special edges go up one layer; Dijkstra; $\min_i dist(t,i)$; time $O(kE \log V)$ |
| "exactly $k$" or "at least one" special edge | Same layers; target only $(t, k)$, or cap the counter: $\{0, 1\}$ with $1$ = "at least one" |
| "at most $k$ edges total", arbitrary signs | Bellman–Ford DP with two arrays, $k$ rounds, $O(kE)$ |
| alternating colors / no two consecutive X | State = last color or last edge type |
| turn penalties | State = direction (grid) or incoming edge (general graph) |
| fuel, battery, budget measured in integers | State = (vertex, remaining amount); note pseudo-polynomial size |
| charging stations / refuel to full | Precompute distances between stations, build a "hop" graph of pairs within range, Dijkstra on it |
| cost on vertices | Add to entering edges, or split vertices |
| maximize product of probabilities | $-\log$, Dijkstra (lengths $\ge 0$) |
| detect profitable cycle | $-\log$, Bellman–Ford from super-source, negative cycle |
| maximize the minimum edge (bottleneck) | Binary search + reachability, or max-min Dijkstra |
| path must go through $x$ | $dist(s,x) + dist(x,t)$ |
| edges on some shortest path / count shortest paths | $d_s$ and $d_t$; tight edges $d_s(u) + \ell + d_t(v) = d_s(t)$; DP on the tight DAG |
| monotone coordinate (elevation, time, layer index) | Constructed graph is a DAG: DP in $O(V+E)$ |
| many queries from few sources | Run SSSP once per source, or once on $rev(G)$ per target |

## Where students lose points

- **Running time in the wrong variables.** Writing "Dijkstra: $O(E \log V)$" for a layered graph with $(k+1)V$ vertices and $2(k+1)E$ edges. Write $O(kE \log(kV))$, then simplify if you can.
- **Not saying how edges are built.** "Make a graph where vertices are (city, fuel)" is half an answer. List every edge type, its endpoints in the new graph, and its length.
- **Forgetting the start and target copies.** State the start vertex of $H$ and how the answer is read off ($\min$ over copies of $t$, or a super-target).
- **BFS on weighted graphs**, or Dijkstra with **negative** edges (even one). Check the lengths you created, not just the original ones.
- **Treating "add a constant to every edge" as a fix** for negative lengths.
- **Unbounded state spaces.** A counter that can grow without bound must be capped (e.g., "at most $V - 1$ coupons are ever useful") or the graph is infinite.
- **Pseudo-polynomial blowups unacknowledged.** A state indexed by a numeric value $C$ gives size proportional to $C$; say "this is polynomial in $C$" rather than claiming a strongly polynomial bound.
- **In-place Bellman–Ford for an edge budget**, which can use more than $i$ edges after $i$ rounds.
- **Missing a hidden DAG.** If the constructed graph is acyclic, the DAG DP is linear and handles negative lengths.
- **Modifying Dijkstra without re-proving it.** Prefer changing the graph; if you must change the algorithm (bottleneck, time-dependent), explain which step of the proof still holds.

## Self-check

1. Why must Dijkstra's lengths be nonnegative? Point to the exact step of the proof.

~~~reveal Answer
The step $d^*(y) \le d^*(u)$: the rest of the shortest path from $y$ to $u$ must have nonnegative length. With a negative edge after $y$, a not-yet-extracted vertex can lead to a shorter path to an already-extracted vertex.
~~~

2. You have a graph with $V$ vertices, $E$ edges, positive integer lengths, and you build a product with 3 copies of each vertex. What is the running time of Dijkstra on it, in terms of $V$ and $E$?

~~~reveal Answer
$3V$ vertices and $O(3E)$ edges, so $O(E \log V)$: a constant factor of layers does not change the bound. With $k$ layers it would be $O(kE \log(kV))$.
~~~

3. Is $O(VE)$ Bellman–Ford ever the right choice when all lengths are nonnegative?

~~~reveal Answer
Essentially never: Dijkstra is faster ($O(E \log V)$). One exception is an **edge-count budget** ("at most $k$ edges"), where the Bellman–Ford DP with two arrays is the natural algorithm regardless of signs.
~~~

4. After $V - 1$ rounds of Bellman–Ford, no edge is tense. Can the graph still contain a negative cycle?

~~~reveal Answer
Yes, if that cycle is **not reachable from $s$**: its vertices have $dist = \infty$ and their edges are never tense. To detect all negative cycles, add a super-source with 0-length edges to every vertex.
~~~

5. A graph has edges with lengths in $\{1, 2\}$. Give a linear-time SSSP algorithm.

~~~reveal Answer
Subdivide every length-2 edge with a new midpoint vertex into two length-1 edges, then run BFS: $V + E$ vertices and at most $2E$ edges, so $O(V + E)$.
~~~

6. What does Floyd–Warshall's $D(u, v, r)$ mean, and why must $r$ be the outermost loop?

~~~reveal Answer
The shortest $u$-$v$ path all of whose intermediate vertices are in $\{1, \dots, r\}$. Computing level $r$ needs the entire level $r - 1$ table, so $r$ must be outermost; putting $u$ or $v$ outside would use incomplete values.
~~~

7. Your layered graph has vertex $(v, i)$ meaning "at $v$ with $i$ minutes elapsed", with edges going from time $i$ to time $i + \ell(e) > i$. Which algorithm should you use?

~~~reveal Answer
The time coordinate strictly increases along every edge, so the graph is a DAG (topological order: sort by time). Use the DAG DP, linear in the size of the layered graph, instead of Dijkstra.
~~~

8. True or false: negating all lengths and running Bellman–Ford finds the longest simple path.

~~~reveal Answer
False. Any positive cycle becomes a negative cycle, so the "distances" are $-\infty$ and Bellman–Ford reports a negative cycle. Longest simple path is NP-hard in general; it is linear only in DAGs.
~~~

## Midterm 2 exam patterns

Shortest-path questions on Midterm 2 are almost always **modeling** questions: a story, one or two constraints, and the instruction "describe and analyze an efficient algorithm". Graders look for the same items every time: the graph you build (vertices with their meaning, every edge type with its length), the source and target, the algorithm with a reason it applies, a one-line correctness argument, and the running time **in the original parameters**. The rest of this section is about recognizing the shape quickly and not leaking points.

### Recognize the shape

| The story says... | Build... | Then run... |
|---|---|---|
| "at most $k$ coupons / tolls / risky roads" | $V \times \{0..k\}$; special edges go up one layer | Dijkstra; $\min_i dist(t, i)$ |
| "must pass a café / checkpoint / at least one X" | $V \times \{0, 1\}$ | Dijkstra; $dist(t, 1)$ |
| "even number of edges", "length mod $q$" | $V \times \{0..q-1\}$, each edge advances the counter | Dijkstra (or BFS if unweighted) |
| "delay at intersections", "cost per visit" | vertex weights moved onto entering (or leaving) edges, or split vertices | Dijkstra |
| "from every vertex to $t$", "nearest of several targets" | reverse graph $rev(G)$, super-source joined to every target | **one** Dijkstra |
| "build one new road", "must pass through $x$" | $d_s$ from $s$ in $G$, $d_t$ from $t$ in $rev(G)$ | combine $d_s(u) + \ell + d_t(v)$ |
| "profit", "refund", "reward" (negative lengths) | the plain graph | Bellman–Ford, or the DAG DP if acyclic |
| "at most $k$ flights / edges", negative cycles allowed | layers $0..k$ where **every** edge goes up a layer (a DAG) | two-array Bellman–Ford DP, $O(kE)$ |
| "time limit $H$", integer durations | $V \times \{0..H\}$, the clock strictly increases | DAG DP, $O(H(V+E))$ |
| "deadline", "floods at time $f(v)$", "trains every $p$ minutes" | no new graph: Dijkstra keyed by arrival time | re-prove the greedy step |

### The answer skeleton

~~~pseudo
H = (V', E') where
    V' = { (v, x) : ... }           -- say in English what (v, x) means
    E' = one bullet per move type: from, to, length, which action it models
source: (s, ...)     target: (t, ...), or min over copies, or a super-target
algorithm: BFS | Dijkstra | DAG DP | Bellman-Ford, because <unit / lengths >= 0 / acyclic>
correctness: valid solutions <-> walks in H from source to target, with equal cost
time: |V'| = ..., |E'| = ...   =>   O(|E'| log |V'|) = O( ... in V, E, k ... )
~~~

### Mistakes that cost the most points

- **Running time in the wrong graph.** "Dijkstra, $O(E \log V)$" for a graph with $(k+1)V$ vertices. Always count $|V'|$ and $|E'|$ and substitute.
- **Not checking the lengths you created.** Rewards and refunds make some edges of $H$ negative even if $G$ "looks" harmless. Dijkstra needs *every* edge of $H$ to be nonnegative; the DAG DP needs only acyclicity.
- **"It is a DAG, so Dijkstra is fine."** Acyclicity rules out negative *cycles*, not negative *edges*: on $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$), a DAG, Dijkstra still finalizes $a$ at 2 instead of 1. Use the topological-order DP.
- **Dijkstra from every vertex** when a single run on $rev(G)$ answers "distance from every vertex to $t$": $O(VE \log V)$ instead of $O(E \log V)$.
- **Fuzzy start state.** Is $s$ itself a checkpoint? Does boarding the first train count as a transfer? Say so.
- **"Bellman–Ford finds negative cycles"** without "reachable from $s$". Add a super-source when the question is about the whole graph.
- **"A change in round $V-1$ means a negative cycle."** No: a legitimate path with $V - 1$ edges can still be improving in round $V-1$. Only an edge that is still tense **after** $V - 1$ rounds proves a negative cycle.
- **True/false without numbers.** A counterexample is a concrete graph with concrete lengths and the two competing paths compared side by side.

### Worked example A (try it first): nearest hospital, with intersection delays

*Problem.* A city is a directed graph $G = (V, E)$ with driving times $\ell(e) \ge 0$. Each intersection $v$ has a traffic-light delay $d(v) \ge 0$, paid whenever an ambulance *leaves* $v$ (so it pays at its starting point and at every intermediate intersection, but not at the hospital where it stops). A set $H \subseteq V$ of intersections are hospitals. Compute, for **every** intersection $v$, the minimum time for an ambulance starting at $v$ to reach some hospital.

~~~reveal Solution: one Dijkstra on the reversed graph
**Step 1: vertex weights to edge weights.** A trip $v_0 \to v_1 \to \dots \to v_k$ costs $\sum_i \ell(v_{i-1} \to v_i) + \sum_{i < k} d(v_i)$: every vertex except the last is *left* exactly once per visit. So give every edge the length $\ell'(u \to w) = \ell(u \to w) + d(u)$. Then every trip costs exactly its $\ell'$-length. All $\ell' \ge 0$.

**Step 2: many targets, every source.** We want $\min_{h \in H} dist_{\ell'}(v, h)$ for every $v$. Reverse every edge (keeping its $\ell'$ length) to get $rev(G)$, and add a super-source $z$ with an edge $z \to h$ of length 0 for each hospital $h$. A walk $v \leadsto h$ in $G$ is exactly a walk $h \leadsto v$ in $rev(G)$ with the same length, so
$$dist_{rev(G) + z}(z, v) = \min_{h \in H} dist_{G, \ell'}(v, h).$$

**Step 3: algorithm.** One Dijkstra from $z$ in $rev(G) + z$ (lengths nonnegative). The answer for $v$ is $dist(z, v)$; it is 0 for hospitals and $\infty$ if no hospital is reachable from $v$.

**Time.** $V + 1$ vertices and $E + |H|$ edges: $O(E \log V)$ (plus $O(V)$). Compare with the tempting alternatives: Dijkstra from every intersection costs $O(VE \log V)$; Dijkstra from every hospital costs $O(|H| \cdot E \log V)$.

**Common slip.** Putting $d(v)$ on edges *entering* $v$ would charge the delay at the hospital and not at the start, which is the wrong accounting for this story. Read carefully which visits pay.
~~~

### Worked example B (try it first): cheapest itinerary with at most two flights

*Problem.* Flights form the directed graph below (fares in dollars). Find the cheapest itinerary from $s$ to $t$ that uses **at most two flights**. Then explain why ordinary in-place Bellman–Ford, stopped after two rounds, can give the wrong answer.

~~~graph
directed
s a 1
a b 1
b t 1
s b 5
s t 10
~~~

~~~reveal Solution: the edge-budget DP
Let $d_i(v)$ be the cheapest fare from $s$ to $v$ using at most $i$ flights:
$$d_0(s) = 0,\quad d_0(v) = \infty \ (v \ne s), \qquad d_i(v) = \min\Big(d_{i-1}(v),\ \min_{u \to v} d_{i-1}(u) + \ell(u \to v)\Big).$$
Compute it with **two arrays** (read only from $d_{i-1}$ while writing $d_i$). Equivalently: layered graph with vertices $(v, i)$, $0 \le i \le 2$, edges $(u, i-1) \to (v, i)$ of length $\ell(u \to v)$ and "stay" edges $(v, i-1) \to (v, i)$ of length 0; it is a DAG, so negative fares and even negative cycles would be fine. The answer is $d_2(t) = 6$ (fly $s \to b \to t$). The overall cheapest route $s \to a \to b \to t$ costs 3 but uses three flights. Time in general: $O(k(V + E))$ for a budget of $k$ flights.
~~~

~~~steps Tracing the two-array DP, then the in-place mistake
**Round 0.** $d_0$: $s = 0$; $a, b, t = \infty$.
+++
**Round 1 (reads $d_0$ only).** $a = d_0(s) + 1 = 1$, $b = d_0(s) + 5 = 5$, $t = d_0(s) + 10 = 10$. The edges $a \to b$ and $b \to t$ see $d_0(a) = d_0(b) = \infty$ and do nothing. So $d_1$: $s = 0$, $a = 1$, $b = 5$, $t = 10$, exactly the cheapest one-flight fares.
+++
**Round 2 (reads $d_1$ only).** $b = \min(5, d_1(a) + 1) = 2$. $t = \min(10, d_1(b) + 1, d_1(s) + 10) = \min(10, 6, 10) = 6$. Note that $t$ used $d_1(b) = 5$, **not** the freshly computed $d_2(b) = 2$. So $d_2(t) = 6$.
+++
**The in-place mistake.** Ordinary Bellman–Ford updates one array. If the edges happen to be scanned in the order $s \to a$, $a \to b$, $b \to t$, $s \to b$, $s \to t$, then already in round 1: $a = 1$, then $b = 1 + 1 = 2$, then $t = 2 + 1 = 3$. After "one round" it reports 3, which needs three flights. In-place relaxation can chain several edges inside one round; that is harmless for plain shortest paths but wrong for an edge budget.
+++
**Exam phrasing.** "Let $d_i(v)$ denote the minimum cost of a walk from $s$ to $v$ with at most $i$ edges", the recurrence above, "we fill the table row by row, $i = 0, 1, \dots, k$, using only row $i - 1$ to compute row $i$", answer $d_k(t)$, time $O(k(V+E))$, space $O(V)$ with two rows.
~~~
`,

  cheatsheet: String.raw`
**Tense edge** $u\to v$: $dist(u) + \ell(u\to v) < dist(v)$. **Relax**: $dist(v) \leftarrow dist(u) + \ell$, $pred(v) \leftarrow u$. Invariant: every finite $dist(v)$ is the length of a real walk. No tense edges + no negative cycles ⇒ distances correct.

**Which algorithm when** (take the first row that applies, to the graph you BUILT):
| Situation | Algorithm | Time |
|---|---|---|
| all lengths 1 (or all equal) | BFS | $O(V+E)$ |
| lengths in $\{0,1\}$ | 0-1 BFS (deque) | $O(V+E)$ |
| DAG (some coordinate strictly increases), any signs | DP in topological order | $O(V+E)$ |
| lengths $\ge 0$ | Dijkstra, binary heap | $O(E\log V)$ |
| lengths $\ge 0$, dense | Dijkstra, array | $O(V^2)$ |
| negative lengths / detect negative cycle | Bellman–Ford | $O(VE)$ |
| at most $k$ edges, any signs | BF DP, two arrays | $O(kE)$ |
| APSP, $\ge 0$, sparse | $V \times$ Dijkstra | $O(VE\log V)$ |
| APSP, negative edges, sparse | Johnson | $O(VE \log V)$ |
| APSP, dense or any | Floyd–Warshall | $O(V^3)$ |
| longest simple path, general graph | NP-hard | — |

**Dijkstra proof hinge:** first wrongly-extracted $u$; first unextracted $y$ on a shortest path has $dist(y) = d^*(y) \le d^*(u)$ (needs lengths $\ge 0$ after $y$). Extracted keys are nondecreasing.

**Bellman–Ford:** after $i$ rounds $dist(v) \le$ best walk with $\le i$ edges. $V-1$ rounds; still tense ⇒ negative cycle reachable from $s$ (sum around the cycle gives $0 \le \ell(C) < 0$). Super-source with 0-edges finds every negative cycle.

**Floyd–Warshall:** $D(u,v,r) = \min(D(u,v,r-1),\ D(u,r,r-1) + D(r,v,r-1))$; $r$ outermost. Neg cycle iff some $D[v][v] < 0$.

**Johnson:** $\pi$ from Bellman–Ford at super-source; $\ell' = \pi(u) + \ell - \pi(v) \ge 0$; paths shift by $\pi(x) - \pi(y)$.

**Transformations.**
- Undirected ⇒ two directed edges (never with negative lengths).
- Vertex cost $c(v)$ ⇒ add to entering edges, or split $v_{in}\to v_{out}$.
- Adding a constant to all lengths changes shortest paths; scaling by $c > 0$ does not.
- Longest path in a DAG ⇒ negate lengths (or max-DP).
- Product of probabilities ⇒ $-\log p \ge 0$, Dijkstra. Exchange rates ⇒ $-\log r$, negative cycle = arbitrage.
- Through vertex $x$: $d(s,x) + d(x,t)$. Edge on some shortest path: $d_s(u) + \ell + d_t(v) = d_s(t)$.
- Second-shortest walk: min over edges of $d_s(u)+\ell+d_t(v)$ among values $> d_s(t)$.
- Bottleneck: binary search on threshold + reachability, or max-min Dijkstra.

**Layered models.**
| Constraint | States | Size |
|---|---|---|
| $\le k$ coupons | $V\times\{0..k\}$ | $kV$, $2kE$ |
| last color | $V \times \{R,B\}$ | $2V$, $E$ |
| checkpoint visited | $V\times\{0,1\}$ | $2V$, $2E$ |
| fuel $0..C$ (unit purchases) | $V \times \{0..C\}$ | $VC$, $(V+E)C$ |
| grid with heading | cells $\times$ 4 | $4n^2$, $12n^2$ |
| uphill then downhill | $V \times \{up, down\}$ | DAG! |

**Modeling answer template.**
1. Vertices of $H$: "(v, x) means ..."
2. Edges of $H$ and lengths: one bullet per move type.
3. Source, target(s) (min over copies or super-target).
4. Algorithm + why it applies (signs / DAG / unit).
5. Correctness: solutions ↔ walks in $H$, same cost.
6. Time: $|V(H)|$, $|E(H)|$ in original parameters, plugged in.

### Exam checklist
- Described $H$ completely? Vertices (with meaning), every edge type with its length, source, target / min over copies.
- Checked the lengths **of $H$**: all $\ge 0$ ⇒ Dijkstra; acyclic (a coordinate strictly increases) ⇒ DAG DP, negatives OK; unit ⇒ BFS; otherwise Bellman–Ford.
- DAG with negative edges ⇒ **not** Dijkstra.
- Distances *to* $t$, or to the nearest of many targets ⇒ one Dijkstra on $rev(G)$ from a super-source.
- One optional edge / through a vertex ⇒ $d_s(u) + \ell + d_t(v)$; one negative edge $x \to y$ ⇒ delete it, Dijkstra from $s$ and $y$.
- Edge budget ⇒ two-array DP; negative cycle ⇒ tense **after** $V-1$ rounds, reachable from $s$.
- Time stated in $V, E, k$ (e.g. $O(kE\log(kV))$), pseudo-polynomial blowups ($C$, $H$) acknowledged.
- True/false: $+c$ changes shortest paths (not MSTs); $\times c > 0$ preserves them; squaring does not; give numbers.
`,

  quiz: [
    {
      type: 'mc',
      q: 'A directed graph has some negative edge lengths but no negative cycles, and is NOT a DAG. Which single-source algorithm is appropriate?',
      choices: ['BFS', 'Dijkstra', 'Bellman–Ford', 'DFS'],
      answer: 2,
      explain: String.raw`Bellman–Ford handles arbitrary lengths in $O(VE)$ time. Dijkstra's correctness proof needs nonnegative lengths (it may finalize a vertex too early). BFS ignores lengths. DFS does not compute shortest paths at all. If the graph were a DAG, the $O(V+E)$ topological-order DP would be best.`
    },
    {
      type: 'tf',
      q: 'If no negative cycle is reachable from s and no edge is tense, then every tentative distance dist(v) equals the true shortest-path distance from s.',
      answer: true,
      explain: String.raw`Tentative distances never go below the truth (they are lengths of real walks). Along a shortest path $s = v_0, \dots, v_k$, non-tenseness of each edge gives $dist(v_i) \le d^*(v_i)$ by induction. So equality holds everywhere. This is the core correctness lemma behind every SSSP algorithm.`
    },
    {
      type: 'tf',
      q: 'Adding the same positive constant to every edge length preserves which paths are shortest.',
      answer: false,
      explain: String.raw`A path with $k$ edges increases by $kc$, so paths with more edges are penalized more. Example: $s \to a$ (1), $a \to t$ (1) has length 2, beating $s \to t$ (3); after adding 2 to each edge, the two-edge path has length 6 and the direct edge 5. So this does not "fix" negative edges. Multiplying by a positive constant does preserve shortest paths.`
    },
    {
      type: 'mc',
      q: 'What is the running time of Dijkstra\'s algorithm with a binary heap on a graph with V vertices and E edges (all reachable)?',
      choices: [String.raw`$O(V+E)$`, String.raw`$O(E \log V)$`, String.raw`$O(VE)$`, String.raw`$O(V^2 \log V)$`],
      answer: 1,
      explain: String.raw`There are $V$ ExtractMins and at most $E$ DecreaseKeys, each $O(\log V)$ with a binary heap: $O((V+E)\log V) = O(E\log V)$ when the graph is connected from $s$. Fibonacci heaps improve this to $O(E + V\log V)$.`
    },
    {
      type: 'multi',
      q: 'Which statements about single-source shortest paths in a DAG are true? (select all that apply)',
      choices: [
        'Relaxing out-edges of vertices in topological order computes correct distances',
        'The algorithm requires nonnegative edge lengths',
        'It runs in O(V+E) time',
        'Negating all lengths turns it into a longest-path algorithm for DAGs'
      ],
      answer: [0, 2, 3],
      explain: String.raw`When a vertex is processed in topological order, all its in-neighbors are already final, so one relaxation pass suffices: $O(V+E)$. A DAG has no cycles at all, so negative lengths cause no trouble, and negating lengths converts longest to shortest.`
    },
    {
      type: 'tf',
      q: 'After V−1 rounds of Bellman–Ford from s, if some edge is still tense, then G contains a negative cycle reachable from s.',
      answer: true,
      explain: String.raw`Without a reachable negative cycle, $V-1$ rounds give correct distances and so no tense edges. With one, summing the non-tense inequalities around the cycle would give $0 \le \ell(C) < 0$, so some edge on it stays tense. Note that a negative cycle **not** reachable from $s$ is not detected (its vertices keep $dist = \infty$).`
    },
    {
      type: 'mc',
      q: String.raw`In Floyd–Warshall, $D(u,v,r)$ is the shortest $u$-to-$v$ path with all intermediate vertices in $\{1,\dots,r\}$. Which recurrence is correct?`,
      choices: [
        String.raw`$D(u,v,r) = \min_{w} \big(D(u,w,r-1) + \ell(w \to v)\big)$`,
        String.raw`$D(u,v,r) = \min\big(D(u,v,r-1),\ D(u,r,r-1) + D(r,v,r-1)\big)$`,
        String.raw`$D(u,v,r) = D(u,r,r-1) + D(r,v,r-1)$`,
        String.raw`$D(u,v,r) = \min\big(D(u,v,r-1),\ D(u,r,r) + D(r,v,r)\big) + \ell(u\to v)$`
      ],
      answer: 1,
      explain: String.raw`The shortest path with intermediates in $\{1..r\}$ either avoids $r$ (first term) or passes through $r$ once, splitting into $u \leadsto r$ and $r \leadsto v$, each with intermediates in $\{1..r-1\}$. The first choice is the Bellman–Ford-style "number of edges" recurrence, which leads to an $O(V^4)$ or $O(V^3 \log V)$ algorithm instead.`
    },
    {
      type: 'tf',
      q: 'If all edge lengths are distinct positive numbers, then the shortest path from s to each vertex is unique.',
      answer: false,
      explain: String.raw`Distinct edge lengths do not prevent ties between path sums: $s \to a$ (1), $a \to b$ (3), and $s \to b$ (4) give two shortest paths to $b$ of length 4. (Contrast with MSTs, where distinct weights do force uniqueness.)`
    },
    {
      type: 'mc',
      q: String.raw`You model "cheapest route using at most $k$ half-price coupons" with vertices $V \times \{0..k\}$ and run Dijkstra. Ignoring the observation that $k < V$ may be assumed, what is the running time?`,
      choices: [String.raw`$O(E \log V)$`, String.raw`$O(kE \log(kV))$`, String.raw`$O(k + E\log V)$`, String.raw`$O(VE)$`],
      answer: 1,
      explain: String.raw`The layered graph has $(k+1)V$ vertices and $O(kE)$ edges (two per original edge per layer). Dijkstra on it takes $O(|E'| \log |V'|) = O(kE\log(kV))$. Since useful coupon counts are below $V$, $\log(kV) = O(\log V)$, giving $O(kE \log V)$.`
    },
    {
      type: 'tf',
      q: 'Replacing an undirected edge of negative length by two opposite directed edges creates a negative cycle.',
      answer: true,
      explain: String.raw`The edges $u \to v$ and $v \to u$ form a 2-cycle of length $2\ell(uv) < 0$. That is why the standard reduction from undirected to directed graphs is only used with nonnegative lengths.`
    },
    {
      type: 'mc',
      q: String.raw`In the lesson's Dijkstra example (edges $s\to a$ 4, $s \to b$ 1, $b \to a$ 2, $a \to c$ 1, $b \to c$ 5, $c \to t$ 3, $b \to t$ 8), in which order are vertices extracted?`,
      choices: ['s, a, b, c, t', 's, b, a, c, t', 's, b, c, a, t', 's, b, a, t, c'],
      answer: 1,
      explain: String.raw`After $s$: $a=4$, $b=1$; extract $b$. Relaxing from $b$: $a = 3$, $c = 6$, $t = 9$; extract $a$ (3). Relax $a \to c$: $c = 4$; extract $c$. Relax $c \to t$: $t = 7$; extract $t$. Final distances $0, 3, 1, 4, 7$ for $s, a, b, c, t$.`
    },
    {
      type: 'mc',
      q: 'You need all-pairs shortest paths in a sparse graph (E = O(V)) with nonnegative lengths. Which is asymptotically fastest?',
      choices: ['Floyd–Warshall, O(V^3)', 'Dijkstra from every vertex, O(VE log V) = O(V^2 log V)', 'Bellman–Ford from every vertex, O(V^2 E) = O(V^3)', 'They are all the same'],
      answer: 1,
      explain: String.raw`With $E = O(V)$, repeated Dijkstra costs $O(V^2 \log V)$, beating $O(V^3)$. For dense graphs ($E = \Theta(V^2)$) repeated Dijkstra is $O(V^3 \log V)$ with binary heaps and Floyd–Warshall's simple $O(V^3)$ wins.`
    },
    {
      type: 'tf',
      q: 'To compute the shortest walk from s to t using AT MOST k edges, running k rounds of ordinary in-place Bellman–Ford and reading dist(t) is always correct.',
      answer: false,
      explain: String.raw`In-place relaxation can propagate along several edges within one round (if edges happen to be processed in path order), so after $k$ rounds $dist(t)$ may reflect a walk with more than $k$ edges, which is too short. Use the DP with separate arrays $d_{i-1}$ and $d_i$.`
    },
    {
      type: 'tf',
      q: 'If every edge of a directed graph has length exactly 5, BFS (multiplying its edge counts by 5) computes correct shortest-path distances.',
      answer: true,
      explain: String.raw`When all lengths are equal to $c > 0$, a path's length is $c$ times its number of edges, so minimizing length is the same as minimizing edge count. BFS fails only when lengths **differ**: then a path with more edges can be shorter.`
    },
    {
      type: 'mc',
      q: String.raw`A graph has edge lengths in $\{1, 2\}$ only. Which approach gives correct distances in $O(V+E)$ time?`,
      choices: [
        'BFS directly on the graph',
        'Subdivide every length-2 edge into two length-1 edges, then BFS',
        'DFS, keeping the smallest distance seen',
        String.raw`Dijkstra, which is $O(V+E)$ here`
      ],
      answer: 1,
      explain: String.raw`Subdividing adds at most $E$ vertices and $E$ edges, so the new graph has $O(V+E)$ size and BFS on it is linear and correct. Plain BFS ignores the lengths. DFS does not compute shortest paths. Dijkstra is correct but $O(E \log V)$ with a binary heap.`
    },
    {
      type: 'tf',
      q: 'Negating all edge lengths and running Bellman–Ford computes longest simple paths in any directed graph.',
      answer: false,
      explain: String.raw`Any cycle of positive length becomes a negative cycle after negation, so Bellman–Ford just reports a negative cycle (distances $-\infty$). Longest simple path is NP-hard in general (it solves Hamiltonian path). The negation trick is valid only for DAGs, which have no cycles.`
    },
    {
      type: 'tf',
      q: 'Suppose there is no negative cycle and the ONLY negative-length edges are edges leaving the source s. Then the extract-each-vertex-once Dijkstra still computes correct distances.',
      answer: true,
      explain: String.raw`Rerun the proof: the first wrongly-extracted $u$ has a shortest path $P$, which is simple, so after its first edge it never uses an edge out of $s$ again. The first unextracted $y$ on $P$ is not $s$ (which is extracted first), so the part of $P$ after $y$ has only nonnegative edges and $d^*(y) \le d^*(u)$ still holds. Negative edges anywhere else break this.`
    },
    {
      type: 'mc',
      q: String.raw`Currency $i$ converts to currency $j$ at rate $R[i][j]$. To detect a cycle of trades whose product of rates exceeds 1, which edge lengths and algorithm should you use?`,
      choices: [
        String.raw`$\ell(i\to j) = R[i][j]$, Dijkstra`,
        String.raw`$\ell(i\to j) = \log R[i][j]$, Dijkstra`,
        String.raw`$\ell(i\to j) = -\log R[i][j]$, Bellman–Ford to find a negative cycle`,
        String.raw`$\ell(i\to j) = 1/R[i][j]$, Floyd–Warshall`
      ],
      answer: 2,
      explain: String.raw`$\prod R > 1 \iff \sum \log R > 0 \iff \sum (-\log R) < 0$, so profitable cycles are exactly negative cycles under lengths $-\log R$. Those lengths can be negative, so Dijkstra is out; Bellman–Ford (from a super-source) or Floyd–Warshall ($D[i][i] < 0$) detects them in $O(n^3)$.`
    },
    {
      type: 'mc',
      q: String.raw`Each edge succeeds independently with probability $p(e) \in (0,1]$. You want the $s$-$t$ path maximizing the product of probabilities. Which is right?`,
      choices: [
        String.raw`Use lengths $-\log p(e) \ge 0$ and Dijkstra`,
        String.raw`Use lengths $-\log p(e)$, which may be negative, so Bellman–Ford is required`,
        String.raw`Use lengths $p(e)$ and Dijkstra`,
        'This problem is NP-hard'
      ],
      answer: 0,
      explain: String.raw`Maximizing $\prod p$ is minimizing $\sum -\log p$. Since $p \le 1$, $\log p \le 0$, so $-\log p \ge 0$ and Dijkstra applies in $O(E \log V)$. (Contrast arbitrage, where rates above 1 give negative lengths.) Summing raw $p(e)$ optimizes the wrong quantity.`
    },
    {
      type: 'multi',
      q: 'Which statements about Bellman–Ford are true? (select all that apply)',
      choices: [
        'It reports only negative cycles that are reachable from the source',
        'If a whole round relaxes nothing, you can stop early with correct distances',
        'Adding a new vertex with 0-length edges to every vertex lets it detect any negative cycle in the graph',
        'Replacing each undirected edge by two directed edges makes it correct for undirected graphs with negative edges'
      ],
      answer: [0, 1, 2],
      explain: String.raw`Unreachable vertices keep $dist = \infty$, so unreachable cycles are invisible; a super-source fixes that. A round with no relaxation means nothing is tense, which certifies correctness. But a negative undirected edge becomes a negative 2-cycle $u \to v \to u$, so the doubling trick fails.`
    },
    {
      type: 'mc',
      q: String.raw`Cities and roads form a graph with $V$ vertices and $E$ edges. Fuel levels are integers $0..C$ and you model the state as (city, fuel) with "buy one unit" and "drive" edges. What is the Dijkstra running time on this model?`,
      choices: [
        String.raw`$O(E \log V)$`,
        String.raw`$O((V+E)C \log(VC))$`,
        String.raw`$O(VC^2 \log V)$`,
        String.raw`$O(VE \cdot C)$`
      ],
      answer: 1,
      explain: String.raw`There are $V(C+1)$ states. Buy edges: $VC$. Drive edges: each road gives one edge per fuel level, $O(EC)$. Dijkstra is $O(|E_H| \log |V_H|) = O((V+E)C \log(VC))$, polynomial in the *value* $C$ (pseudo-polynomial). Modeling purchases as one edge per amount would give $\Theta(VC^2)$ buy edges.`
    },
    {
      type: 'tf',
      q: 'A shortest-path tree from s (with positive lengths) is always a minimum spanning tree of the underlying undirected graph.',
      answer: false,
      explain: String.raw`Triangle $s,a,b$ with $sa = 2$, $sb = 2$, $ab = 1$. The shortest-path tree from $s$ uses $sa, sb$ (weight 4), but the MST uses $ab$ plus one of the others (weight 3). The two trees optimize different things.`
    },
    {
      type: 'mc',
      q: String.raw`With nonnegative lengths, $d_s$ = distances from $s$ and $d_t$ = distances to $t$. Which expression gives the length of the shortest $s$-$t$ walk that is strictly longer than $d_s(t)$?`,
      choices: [
        String.raw`$d_s(t) + \min_e \ell(e)$`,
        String.raw`$\min$ over edges $u\to v$ of $d_s(u) + \ell(u \to v) + d_t(v)$, restricted to values $> d_s(t)$`,
        String.raw`$2\,d_s(t)$`,
        String.raw`The second-smallest value of $d_s(v) + d_t(v)$ over vertices $v$`
      ],
      answer: 1,
      explain: String.raw`Each value $d_s(u) + \ell + d_t(v)$ is the length of a real walk. Conversely, for any walk longer than $d_s(t)$, look at the last vertex up to which its prefix is a shortest path; the next edge gives a value that is $> d_s(t)$ and at most the walk's length. So the minimum over edges of the values exceeding $d_s(t)$ is exact.`
    },
    {
      type: 'mc',
      q: 'All edge lengths are 0 or 1. What is the best running time for single-source shortest paths?',
      choices: [String.raw`$O(V+E)$ with a deque (0-1 BFS)`, String.raw`$O(E \log V)$; nothing faster is possible`, String.raw`$O(VE)$`, String.raw`$O(V^2)$`],
      answer: 0,
      explain: String.raw`0-1 BFS pushes a vertex reached by a 0-edge to the front of a deque and one reached by a 1-edge to the back. The deque always holds keys $d$ and $d+1$ in order, so it acts as a priority queue with $O(1)$ operations: $O(V+E)$.`
    },
    {
      type: 'tf',
      q: 'Floyd–Warshall computes correct all-pairs distances when some edges are negative, as long as there is no negative cycle.',
      answer: true,
      explain: String.raw`The recurrence over the allowed intermediate set $\{1..r\}$ relies only on shortest paths being simple, which holds without negative cycles. With a negative cycle, some diagonal entry $D[v][v]$ becomes negative, which is how it is detected.`
    },
    {
      type: 'mc',
      q: String.raw`In Johnson's algorithm, why are the reweighted lengths $\ell'(u \to v) = \pi(u) + \ell(u \to v) - \pi(v)$ nonnegative, where $\pi(v)$ is the distance from the added vertex $z$?`,
      choices: [
        String.raw`Because $\pi(v) \ge 0$ for every $v$`,
        String.raw`Because of the triangle inequality $\pi(v) \le \pi(u) + \ell(u\to v)$ for shortest-path distances`,
        'Because Bellman–Ford only produces nonnegative distances',
        'They are not always nonnegative; Dijkstra is run with a fix-up step'
      ],
      answer: 1,
      explain: String.raw`Shortest-path distances satisfy $\pi(v) \le \pi(u) + \ell(u \to v)$ for every edge (otherwise the edge would be tense). Rearranging gives $\ell' \ge 0$. In fact $\pi(v) \le 0$ (the 0-length edge from $z$), so the first choice is false.`
    },
    {
      type: 'tf',
      q: 'With nonnegative edge lengths, the sequence of keys extracted by Dijkstra is nondecreasing.',
      answer: true,
      explain: String.raw`When $u$ is extracted with key $d$, every remaining key is at least $d$, and relaxations from $u$ only create keys $d + \ell \ge d$. So later extractions have keys $\ge d$. With a negative edge this can fail, which is another way to see why Dijkstra breaks.`
    },
    {
      type: 'mc',
      q: String.raw`A layered graph has vertices $(v, i)$ where $i$ is the time elapsed, and every edge goes from time $i$ to a strictly larger time. Edge lengths may be negative (rewards). Which algorithm is most appropriate?`,
      choices: ['Dijkstra', 'Bellman–Ford', 'DAG shortest paths in order of increasing time', 'BFS'],
      answer: 2,
      explain: String.raw`Because the time coordinate strictly increases along every edge, there are no cycles: sorting by time is a topological order. The DAG DP is linear in the size of the layered graph and handles negative lengths. Dijkstra is wrong with negative lengths; Bellman–Ford is correct but slower.`
    },
    {
      type: 'tf',
      q: 'Squaring every edge length (all lengths positive) preserves which s–t paths are shortest.',
      answer: false,
      explain: String.raw`Take $s \to t$ of length 3 and $s \to a \to t$ with lengths 2 and 2. Originally the direct edge wins ($3 < 4$). After squaring: $9$ versus $4 + 4 = 8$, so the two-edge path wins. Squaring is increasing, but shortest paths compare **sums**, and $x \mapsto x^2$ does not preserve the order of sums. Only scaling by a positive constant (and Johnson-style potentials) preserves shortest paths in general. Contrast MSTs: there only the order of individual weights matters, so squaring positive weights is harmless.`
    },
    {
      type: 'mc',
      q: String.raw`There is no negative cycle, and the shortest $s \to v$ path has exactly 4 edges. After how many rounds of Bellman–Ford is $dist(v)$ **guaranteed** to be correct, whatever order the edges are scanned in?`,
      choices: ['1', '4', String.raw`$V - 1$`, String.raw`$V$`],
      answer: 1,
      explain: String.raw`The Bellman–Ford invariant says that after $i$ rounds, $dist(v)$ is at most the length of the best walk with at most $i$ edges. The shortest path has 4 edges, so after 4 rounds $dist(v) \le d^*(v)$, and $dist(v)$ is never below the truth. With a lucky scan order (edges in path order) one round might suffice, but that is not guaranteed. $V - 1$ rounds is the bound that works for **every** vertex at once, since every shortest path has at most $V-1$ edges.`
    },
    {
      type: 'tf',
      q: String.raw`On a dense graph ($E = \Theta(V^2)$), Dijkstra's algorithm with a binary heap runs in $O(V^2)$ time.`,
      answer: false,
      explain: String.raw`With a binary heap each of the up to $E$ DecreaseKeys costs $O(\log V)$, so the time is $O(E \log V) = O(V^2 \log V)$. To get $O(V^2)$ use an **unsorted array** of keys (ExtractMin by an $O(V)$ scan, DecreaseKey in $O(1)$): $O(V^2 + E) = O(V^2)$. A Fibonacci heap gives $O(E + V \log V) = O(V^2)$ as well.`
    },
    {
      type: 'multi',
      q: 'All edge lengths are positive. Which transformations are guaranteed to keep exactly the same set of shortest s–t paths, in every graph? (select all that apply)',
      choices: [
        String.raw`$\ell'(e) = 3\,\ell(e)$`,
        String.raw`$\ell'(e) = \ell(e) + 1$`,
        String.raw`$\ell'(e) = \ell(e)^2$`,
        String.raw`$\ell'(u \to v) = \ell(u \to v) + \pi(u) - \pi(v)$ for an arbitrary real function $\pi$ on vertices`,
        String.raw`$\ell'(e) = \log_2 \ell(e)$ (assume all lengths exceed 1)`
      ],
      answer: [0, 3],
      explain: String.raw`Scaling multiplies every path length by 3, preserving the order. With potentials, the sum telescopes: every $s$-$t$ path changes by exactly $\pi(s) - \pi(t)$, the same amount for all of them (this is the heart of Johnson's algorithm; note it may create negative edges, so Dijkstra would need $\pi$ chosen as in Johnson). Adding 1 penalizes paths by their number of edges. Squaring and logarithms do not preserve the order of **sums**. Squaring: direct edge 3 versus path $2 + 2$ becomes $9$ versus $8$. Logarithm: since $\sum \log \ell = \log \prod \ell$, it ranks paths by the *product* of lengths; direct edge 7 versus path $3 + 3 = 6$ (the path wins) becomes $\log 7$ versus $\log 9$ (the edge wins).`
    },
    {
      type: 'tf',
      q: 'If some negative cycle is reachable from s, then dist(s, v) = −∞ for every vertex v reachable from s.',
      answer: false,
      explain: String.raw`Only vertices that can be reached **from the negative cycle** have distance $-\infty$ (go around the cycle as often as you like, then continue to $v$). Example: $s \to a$ (1), $s \to b$ (1), and a negative 2-cycle $b \to c \to b$ of lengths $-1, -1$. Then $b$ and $c$ are at $-\infty$, but $a$ is not reachable from the cycle and $dist(s, a) = 1$. To find the $-\infty$ vertices, take the heads of edges still tense after $V - 1$ rounds and mark everything reachable from them.`
    },
    {
      type: 'mc',
      q: String.raw`In a directed graph with nonnegative lengths you need $dist(v, t)$ for **every** vertex $v$ (distances *to* a fixed $t$). What is the fastest correct approach?`,
      choices: [
        String.raw`Run Dijkstra from every vertex $v$: $O(VE \log V)$`,
        String.raw`Run Dijkstra once from $t$ in the reversed graph $rev(G)$: $O(E \log V)$`,
        String.raw`Run Dijkstra once from $t$ in $G$: $O(E \log V)$`,
        String.raw`Floyd–Warshall: $O(V^3)$`
      ],
      answer: 1,
      explain: String.raw`A walk $v \leadsto t$ in $G$ is exactly a walk $t \leadsto v$ in $rev(G)$ with the same edges reversed and the same length, so one SSSP computation in $rev(G)$ from $t$ gives all distances to $t$. Dijkstra from $t$ in $G$ computes distances **from** $t$, which in a directed graph are different. The other options are correct but much slower.`
    },
    {
      type: 'tf',
      q: "A DAG has no cycles, hence no negative cycles; therefore Dijkstra's algorithm computes correct distances on every DAG, even with negative edge lengths.",
      answer: false,
      explain: String.raw`Dijkstra needs nonnegative **edges**, not just the absence of negative cycles. The DAG $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$) breaks it: $a$ is extracted with key 2 before $b$ is processed, but the true distance is 1. On a DAG the right tool is the topological-order DP: relax each vertex's out-edges in topological order, $O(V + E)$, correct for any signs.`
    },
    {
      type: 'mc',
      q: String.raw`Edges are free, but every vertex $v$ charges a toll $c(v) \ge 0$ each time you are at it (including at $s$ and at $t$). Which construction gives the cheapest $s \to t$ walk?`,
      choices: [
        String.raw`Length $\ell(u \to v) = c(v)$; answer $dist(t) + c(s)$`,
        String.raw`Length $\ell(u \to v) = c(v)$; answer $dist(t)$`,
        'BFS, minimizing the number of vertices visited',
        String.raw`Length $\ell(u \to v) = \max(c(u), c(v))$; answer $dist(t)$`
      ],
      answer: 0,
      explain: String.raw`Charging $c(v)$ on every edge that **enters** $v$ pays exactly once per visit to every vertex of the walk except the starting one, so add $c(s)$ at the end (option B forgets it). All lengths are nonnegative, so Dijkstra applies, $O(E \log V)$. Equivalent alternative: split each $v$ into $v_{in} \to v_{out}$ with length $c(v)$. BFS ignores the tolls, and the max rule pays the wrong amounts.`
    },
    {
      type: 'tf',
      q: "In Dijkstra's algorithm, each vertex's key is decreased at most once before that vertex is extracted.",
      answer: false,
      explain: String.raw`A key can drop many times while the vertex waits in the queue: in the lesson's example, $t$ goes $\infty \to 9 \to 7$ and $c$ goes $\infty \to 6 \to 4$. What is true is that each **edge** causes at most one DecreaseKey (when its tail is extracted), so there are at most $E$ DecreaseKeys in total, which is where the $O(E \log V)$ bound comes from. Once a vertex is extracted its key never changes (with nonnegative lengths).`
    },
    {
      type: 'multi',
      q: 'On which inputs is the extract-each-vertex-once Dijkstra guaranteed to return correct distances from s? (select all that apply)',
      choices: [
        'Nonnegative lengths, including zero-length edges that form a cycle',
        'Negative lengths only on edges leaving s, and no negative cycles',
        'A DAG with some negative edge lengths',
        'An undirected graph with one negative edge, converted to two directed edges'
      ],
      answer: [0, 1],
      explain: String.raw`Zero-length edges (even zero cycles) are fine: the proof only needs every length $\ge 0$. Negative edges out of $s$ only are fine too: a shortest path is simple, so after its first edge it uses only nonnegative edges, and the proof's step $d^*(y) \le d^*(u)$ survives. A DAG with a negative edge elsewhere can fool Dijkstra ($s \to a$ 2, $s \to b$ 3, $b \to a$ $-2$). And a negative undirected edge becomes a negative 2-cycle $u \to v \to u$, so distances are not even defined.`
    }
  ],

  flashcards: [
    { front: 'Tense edge / relaxation', back: String.raw`$u \to v$ tense if $dist(u) + \ell(u\to v) < dist(v)$. Relax: set $dist(v) = dist(u) + \ell(u\to v)$, $pred(v) = u$.` },
    { front: "Ford's generic SSSP algorithm", back: 'Initialize dist(s)=0, others infinity; while some edge is tense, relax it. Correct when it stops (if no negative cycles); every SSSP algorithm is a particular relaxation order.' },
    { front: 'SSSP in a DAG', back: String.raw`Relax all out-edges of each vertex in topological order. $O(V+E)$. Negative lengths allowed.` },
    { front: "Dijkstra: requirement, time, key invariant", back: String.raw`Nonnegative lengths. $O(E\log V)$ with a binary heap ($O(E + V \log V)$ Fibonacci). When a vertex is extracted its distance is final.` },
    { front: 'Why Dijkstra fails with negative edges (example)', back: String.raw`$s\to a$ (2), $s \to b$ (3), $b \to a$ ($-2$): $a$ is extracted with 2, but the true distance is 1.` },
    { front: 'Bellman–Ford: algorithm and time', back: String.raw`$V-1$ rounds, each relaxing every edge; then check for tense edges (negative cycle reachable from $s$). $O(VE)$.` },
    { front: 'Bellman–Ford DP meaning', back: String.raw`$d_i(v)$ = shortest walk from $s$ to $v$ with at most $i$ edges; $d_i(v) = \min(d_{i-1}(v), \min_{u\to v} d_{i-1}(u) + \ell(u\to v))$.` },
    { front: 'Floyd–Warshall recurrence and time', back: String.raw`$D(u,v,r) = \min(D(u,v,r-1), D(u,r,r-1) + D(r,v,r-1))$; $O(V^3)$ time, $O(V^2)$ space. Negative cycle iff $D[v][v] < 0$.` },
    { front: "Johnson's algorithm", back: String.raw`Bellman–Ford from a new source gives potentials $\pi$; reweight $\ell' = \pi(u) + \ell - \pi(v) \ge 0$; Dijkstra from every vertex. $O(VE\log V)$.` },
    { front: 'Vertex costs → edge costs', back: String.raw`Add $c(v)$ to every edge entering $v$, or split $v$ into $v_{in} \to v_{out}$ with length $c(v)$.` },
    { front: 'Edges on some shortest s–t path', back: String.raw`Compute $d_s$ (Dijkstra from $s$) and $d_t$ (Dijkstra from $t$ in $rev(G)$). Edge $u\to v$ is on one iff $d_s(u) + \ell(u\to v) + d_t(v) = d_s(t)$.` },
    { front: 'Layered graph for k coupons', back: String.raw`Vertices $(v,i)$, $0\le i\le k$; full-price edge stays in layer $i$, discounted edge goes to layer $i+1$. Dijkstra from $(s,0)$; $\min_i dist(t,i)$. $O(kE \log V)$.` },
    { front: 'Which SSSP algorithm when? (decision order)', back: String.raw`Unit lengths ⇒ BFS $O(V+E)$. Lengths in $\{0,1\}$ ⇒ 0-1 BFS. DAG (any signs) ⇒ topological DP $O(V+E)$. Lengths $\ge 0$ ⇒ Dijkstra $O(E\log V)$. Otherwise Bellman–Ford $O(VE)$. Apply this to the graph you BUILT.` },
    { front: 'Bottleneck (widest) path', back: String.raw`Maximize the minimum capacity. Binary search over sorted capacities + reachability using edges $\ge \beta$: $O(E\log E)$. Or max-min Dijkstra (extract largest width; $width(v) = \max(width(v), \min(width(u), c))$): $O(E\log V)$. Also: path in a maximum spanning tree.` },
    { front: 'Arbitrage detection', back: String.raw`Lengths $-\log R[i][j]$; profitable cycle = negative cycle. Super-source + Bellman–Ford, or Floyd–Warshall ($D[i][i]<0$). $O(n^3)$ for $n$ currencies.` },
    { front: 'Most reliable path (max product of probabilities)', back: String.raw`Lengths $-\log p(e) \ge 0$ since $p \le 1$; Dijkstra, $O(E \log V)$.` },
    { front: '0-1 BFS', back: String.raw`Lengths in $\{0,1\}$: deque; 0-edge ⇒ push front, 1-edge ⇒ push back. Acts as a 2-bucket priority queue. $O(V+E)$.` },
    { front: 'Second-shortest s–t walk length', back: String.raw`Compute $d_s$ and $d_t$ (Dijkstra on $rev(G)$). Answer $= \min\{d_s(u)+\ell(u\to v)+d_t(v)\}$ over edges, restricted to values $> d_s(t)$. $O(E\log V)$.` },
    { front: 'Fuel-tank model: states, edges, size', back: String.raw`States $(v,g)$, $0\le g\le C$. Buy: $(v,g)\to(v,g+1)$ cost $p(v)$. Drive: $(u,g)\to(v,g-\ell)$ cost 0. $V(C+1)$ vertices, $O((V+E)C)$ edges; Dijkstra $O((V+E)C\log(VC))$ — pseudo-polynomial in $C$.` },
    { front: 'Turn costs: what is the state?', back: String.raw`Grid: (cell, heading), $4n^2$ states, forward = 1, rotate = $c$. General graph: vertices of $H$ are the edges of $G$; $(u\to v) \Rightarrow (v \to w)$ costs $\ell(v\to w) + turn(u,v,w)$; $|E(H)| = \sum_v indeg(v)\,outdeg(v)$.` },
    { front: 'APSP update after adding edge u→v of length w', back: String.raw`New negative cycle iff $w + D(v,u) < 0$. Otherwise $D'(x,y) = \min(D(x,y),\ D(x,u) + w + D(v,y))$ for all pairs: $O(V^2)$.` },
    { front: 'Dijkstra with negative edges only out of s', back: String.raw`Still correct (no negative cycles): a shortest path is simple, so after its first edge it uses only nonnegative edges, and the proof's step $d^*(y) \le d^*(u)$ survives.` },
    { front: 'Hidden DAG in a layered graph', back: 'If some coordinate (time, elevation, layer index) strictly increases along every edge, the constructed graph is a DAG: use the O(V+E) topological DP, which also allows negative lengths.' },
    { front: 'Distances TO t from every vertex', back: String.raw`Reverse every edge and run one SSSP from $t$ in $rev(G)$: $dist_{rev(G)}(t, v) = dist_G(v, t)$. Nearest of several targets: super-source with 0-length edges to each target in $rev(G)$. $O(E \log V)$, not $V$ separate runs.` },
    { front: 'Which length transformations preserve shortest paths?', back: String.raw`Preserve: $c \cdot \ell$ with $c > 0$; potentials $\ell + \pi(u) - \pi(v)$ (every $s$-$t$ path shifts by $\pi(s) - \pi(t)$). Do NOT preserve: $\ell + c$ (penalizes many-edge paths), $\ell^2$, $\log \ell$. (MSTs, by contrast, survive any strictly increasing map.)` },
    { front: 'Bellman–Ford: when is dist(v) guaranteed final? What proves a negative cycle?', back: String.raw`After $i$ rounds if some shortest path to $v$ has $\le i$ edges. A change during round $V-1$ is NOT evidence of a negative cycle; an edge still tense AFTER $V-1$ rounds is (and the cycle is reachable from $s$).` },
    { front: 'Dijkstra on a DAG with negative edges?', back: String.raw`Wrong: $s\to a$ (2), $s\to b$ (3), $b \to a$ ($-2$) is a DAG and Dijkstra finalizes $a = 2$ (true 1). Use the topological-order DP: $O(V+E)$, any signs.` },
    { front: 'Exactly one negative edge x→y', back: String.raw`$G' = G - (x\to y)$ is nonnegative; Dijkstra in $G'$ from $s$ and from $y$. Negative cycle iff $\ell(x\to y) + \delta(y,x) < 0$. Otherwise $dist(v) = \min(\delta(s,v),\ \delta(s,x) + \ell(x\to y) + \delta(y,v))$. $O(E\log V)$.` },
    { front: 'Best single new road from a candidate list F', back: String.raw`$d_s$ from $s$ in $G$, $d_t$ from $t$ in $rev(G)$. With candidate $(u,v)$ of length $\lambda$: new distance $\min(d_s(t),\ d_s(u) + \lambda + d_t(v))$ (a shortest path uses it at most once). $O(E\log V + |F|)$.` },
    { front: 'Multi-source Dijkstra / arbitrary starting keys', back: String.raw`Initialize several vertices with keys $b(v)$ (any reals, even negative) and run Dijkstra on nonnegative edges: computes $\min_u b(u) + \delta(u, v)$. Same as a super-source with edges of length $b(u)$: negative edges only out of the source are harmless.` },
    { front: 'Parity / remainder constraints on the number of edges', back: String.raw`States $(v, i)$, $i \in \{0..q-1\}$; every edge $u \to v$ gives $(u, i) \to (v, (i+1) \bmod q)$. Dijkstra from $(s,0)$, answer $dist(t, r)$. $qV$ vertices, $qE$ edges. Optimal walks may repeat vertices.` }
  ],

  problems: [
    {
      id: 'shortest-dijkstra-code', type: 'code', title: "Implement Dijkstra's algorithm", difficulty: 2,
      prompt: String.raw`Write <code>dijkstra(n, edges, s)</code> for a **directed** graph on vertices <code>0..n-1</code> with edges <code>[u, v, w]</code> meaning $u \to v$ with length $w \ge 0$ (integers). Return an array of shortest-path distances from <code>s</code>, using <code>-1</code> for unreachable vertices. Parallel edges may appear.`,
      fn: 'dijkstra',
      starter: 'function dijkstra(n, edges, s) {\n  // return dist array, -1 for unreachable\n}\n',
      reference: function (n, edges, s) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v, w] of edges) adj[u].push([v, w]);
        const dist = new Array(n).fill(Infinity);
        const done = new Array(n).fill(false);
        dist[s] = 0;
        for (let it = 0; it < n; it++) {
          let u = -1;
          for (let v = 0; v < n; v++) if (!done[v] && dist[v] < Infinity && (u === -1 || dist[v] < dist[u])) u = v;
          if (u === -1) break;
          done[u] = true;
          for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
        }
        return dist.map(d => (d === Infinity ? -1 : d));
      },
      tests: [
        [1, [], 0],
        [5, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3], [2, 4, 8]], 0],
        [4, [[0, 1, 0], [1, 2, 0], [2, 3, 7], [0, 3, 9]], 0],
        [3, [[0, 1, 5], [0, 1, 2], [1, 2, 1]], 0],
        [4, [[1, 0, 1], [2, 3, 1]], 0],
        [6, [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [2, 5, 2], [3, 4, 6], [5, 4, 9]], 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const m = Math.floor(Math.random() * 3 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 10)]);
        return [n, edges, Math.floor(Math.random() * n)];
      },
      hints: [
        'Keep dist[] (Infinity initially) and a finished[] flag. Repeatedly finish the unfinished vertex with the smallest finite dist.',
        'An O(V^2) array scan is fine here; a binary heap gives O(E log V).'
      ],
      solution: String.raw`Initialize $dist(s) = 0$ and all others $\infty$. Repeat: pick the unfinished vertex $u$ with the smallest finite $dist(u)$ (stop if none), mark it finished, and relax every edge $u \to v$: if $dist(u) + w < dist(v)$, set $dist(v) = dist(u) + w$. Because weights are nonnegative, $dist(u)$ is final when $u$ is picked (see the lesson's proof). Convert $\infty$ to $-1$ at the end.

With a linear scan for the minimum this is $O(V^2 + E)$, which is optimal for dense graphs; with a binary heap (insert duplicates and skip stale entries, or use DecreaseKey) it is $O(E \log V)$. Zero-weight edges are fine.`
    },
    {
      id: 'shortest-bellmanford-code', type: 'code', title: 'Bellman–Ford with negative-cycle detection', difficulty: 2,
      prompt: String.raw`Write <code>bellmanFord(n, edges, s)</code> for a directed graph on vertices <code>0..n-1</code> with edges <code>[u, v, w]</code> (integer $w$, possibly negative). If a negative cycle is **reachable from** <code>s</code>, return <code>null</code>. Otherwise return the array of shortest distances from <code>s</code>, using <code>null</code> for unreachable vertices.`,
      fn: 'bellmanFord',
      starter: 'function bellmanFord(n, edges, s) {\n  // V-1 rounds of relaxing every edge, then one more check\n}\n',
      reference: function (n, edges, s) {
        const dist = new Array(n).fill(Infinity);
        dist[s] = 0;
        for (let r = 0; r < n - 1; r++) {
          let changed = false;
          for (const [u, v, w] of edges) {
            if (dist[u] !== Infinity && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; changed = true; }
          }
          if (!changed) break;
        }
        for (const [u, v, w] of edges) if (dist[u] !== Infinity && dist[u] + w < dist[v]) return null;
        return dist.map(d => (d === Infinity ? null : d));
      },
      tests: [
        [1, [], 0],
        [3, [[0, 1, 4], [0, 2, 5], [2, 1, -3]], 0],
        [3, [[0, 1, 1], [1, 2, -1], [2, 1, -1]], 0],
        [4, [[1, 2, -5], [2, 1, 1], [0, 3, 2]], 0],
        [5, [[0, 1, 6], [0, 2, 7], [1, 2, 8], [1, 3, 5], [1, 4, -4], [2, 3, -3], [2, 4, 9], [3, 1, -2], [4, 3, 7]], 0],
        [2, [[0, 0, -1]], 0],
        [2, [[1, 1, -1], [1, 0, 3]], 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const m = Math.floor(Math.random() * 2.5 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 13) - 3]);
        return [n, edges, Math.floor(Math.random() * n)];
      },
      hints: [
        'Only relax an edge u → v when dist[u] is finite; otherwise unreachable negative cycles would be "detected".',
        'After n-1 rounds, any edge that is still tense proves a negative cycle reachable from s.'
      ],
      solution: String.raw`Set $dist(s) = 0$, all others $\infty$. Repeat $n-1$ times: for every edge $u \to v$ with $dist(u) < \infty$ and $dist(u) + w < dist(v)$, relax it. (Stopping early when a round changes nothing is a valid optimization.) Then scan all edges once more: if any edge with finite $dist(u)$ is still tense, a negative cycle is reachable from $s$, so return null. Otherwise the distances are correct; map $\infty$ to null.

**Why only reachable cycles are reported.** Vertices not reachable from $s$ keep $dist = \infty$, and edges out of them are never considered tense, so a negative cycle elsewhere in the graph is ignored, as required. A self-loop of negative weight at a reachable vertex is a negative cycle.

Time $O(VE)$.`
    },
    {
      id: 'shortest-coupons-code', type: 'code', title: 'Cheapest route with k half-price coupons', difficulty: 3,
      prompt: String.raw`Write <code>couponPath(n, edges, s, t, k)</code>. The graph is directed on vertices <code>0..n-1</code>, with edges <code>[u, v, w]</code> where each $w$ is a nonnegative **even** integer. You hold <code>k</code> coupons; using a coupon on an edge lets you traverse it for $w/2$. Each edge traversal can use at most one coupon. Return the minimum total cost of a walk from <code>s</code> to <code>t</code>, or <code>-1</code> if <code>t</code> is unreachable.`,
      fn: 'couponPath',
      starter: 'function couponPath(n, edges, s, t, k) {\n  // Dijkstra on states (vertex, coupons used)\n}\n',
      reference: function (n, edges, s, t, k) {
        const L = k + 1;
        const N = n * L;
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v, w] of edges) adj[u].push([v, w]);
        const dist = new Array(N).fill(Infinity);
        const done = new Array(N).fill(false);
        dist[s * L] = 0;
        for (let it = 0; it < N; it++) {
          let x = -1;
          for (let y = 0; y < N; y++) if (!done[y] && dist[y] < Infinity && (x === -1 || dist[y] < dist[x])) x = y;
          if (x === -1) break;
          done[x] = true;
          const u = Math.floor(x / L), i = x % L;
          for (const [v, w] of adj[u]) {
            const a = v * L + i;
            if (dist[x] + w < dist[a]) dist[a] = dist[x] + w;
            if (i < k) {
              const b = v * L + i + 1;
              if (dist[x] + w / 2 < dist[b]) dist[b] = dist[x] + w / 2;
            }
          }
        }
        let best = Infinity;
        for (let i = 0; i <= k; i++) best = Math.min(best, dist[t * L + i]);
        return best === Infinity ? -1 : best;
      },
      tests: [
        [1, [], 0, 0, 2],
        [2, [[0, 1, 10]], 0, 1, 0],
        [2, [[0, 1, 10]], 0, 1, 1],
        [3, [[0, 1, 2], [1, 2, 2], [0, 2, 20]], 0, 2, 0],
        [3, [[0, 1, 2], [1, 2, 2], [0, 2, 20]], 0, 2, 1],
        [3, [[0, 1, 2], [1, 2, 2], [0, 2, 6]], 0, 2, 1],
        [4, [[0, 1, 8], [1, 3, 8], [0, 2, 2], [2, 3, 12]], 0, 3, 2],
        [3, [[1, 2, 4]], 0, 2, 3]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const m = Math.floor(Math.random() * 3 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), 2 * Math.floor(Math.random() * 10)]);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 4)];
      },
      hints: [
        'The extra information you need is how many coupons you have used so far.',
        'States (v, i), 0 <= i <= k. Each edge u→v gives (u,i)→(v,i) with cost w and (u,i)→(v,i+1) with cost w/2 when i < k. Run Dijkstra from (s,0); take the min over i at t.'
      ],
      solution: String.raw`**Model.** Graph $H$ with vertices $(v, i)$, $v \in V$, $0 \le i \le k$: "at $v$ having used $i$ coupons". For every edge $u \to v$ of length $w$ and every $i$: edge $(u, i) \to (v, i)$ of length $w$; and if $i < k$, edge $(u, i) \to (v, i+1)$ of length $w/2$. All lengths are nonnegative.

Walks in $G$ with a choice of at most $k$ discounted traversals correspond exactly (same cost) to walks in $H$ from $(s, 0)$, with the layer recording coupons used.

**Algorithm.** Dijkstra in $H$ from $(s, 0)$; answer $\min_{0 \le i \le k} dist((t, i))$, or $-1$ if all are infinite.

**Time.** $|V(H)| = (k+1)V$, $|E(H)| \le 2(k+1)E$, so Dijkstra with a binary heap runs in $O(kE \log(kV))$. An optimal walk can be taken simple (removing a loop never increases cost, and frees coupons), so at most $V - 1$ coupons are ever useful and we can cap $k$ at $V - 1$, giving $O(kE \log V)$. The reference code uses an $O(|V(H)|^2)$ array-based Dijkstra, fine for small inputs.`
    },
    {
      id: 'shortest-negative-fix', type: 'written', title: 'Negative edges and Dijkstra', difficulty: 1,
      prompt: String.raw`(a) Give a directed graph with **one** negative edge (and no negative cycle) on which Dijkstra's algorithm (the version that extracts each vertex once) computes a wrong distance. Trace the algorithm.

(b) A classmate proposes: "add $c = -\min_e \ell(e)$ to every edge so all lengths are nonnegative, run Dijkstra, then subtract." Show with a concrete example that this can return a path that is not shortest.`,
      rubric: [
        '(a) Valid counterexample with a trace showing a vertex finalized with too large a distance',
        '(b) Example where the shortest path has more edges than an alternative, so adding c changes the winner',
        'Explanation: a path with k edges gains kc, so the shift is not uniform across paths'
      ],
      hints: ['(b) Compare a one-edge path with a two-edge path.'],
      solution: String.raw`**(a)** Edges $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$). Dijkstra: extract $s$ ($0$); set $a = 2$, $b = 3$. Extract $a$ ($2$) and finalize it. Extract $b$ ($3$); edge $b \to a$ would give $a = 1$, but $a$ was already extracted, so (in the extract-once version) its value is never corrected. The true distance is $dist(a) = 1$ via $s \to b \to a$. If $a$ had out-edges, their heads would also be wrong.

**(b)** Edges $s \to a$ (1), $a \to t$ ($-2$), $s \to t$ (0). Shortest $s$-$t$ path: $s \to a \to t$ with length $-1$. Add $c = 2$: $s \to a$ (3), $a \to t$ (0), $s \to t$ (2). Now the direct edge (2) beats the two-edge path (3), so Dijkstra returns $s \to t$, whose true length 0 is not the minimum $-1$.

The flaw: a path with $k$ edges increases by exactly $kc$, so paths with more edges are penalized more; the shift is not the same for all $s$-$t$ paths. (Johnson's reweighting $\ell'(u\to v) = \pi(u) + \ell(u \to v) - \pi(v)$ works precisely because every $s$-$t$ path changes by the same amount $\pi(s) - \pi(t)$.)`
    },
    {
      id: 'shortest-k-edges', type: 'written', title: 'Shortest walk with at most k edges', difficulty: 2,
      prompt: String.raw`Given a directed graph with arbitrary (possibly negative) edge lengths, vertices $s, t$, and an integer $k \ge 0$, describe an algorithm that computes the minimum length of a walk from $s$ to $t$ using **at most $k$ edges**. (Negative cycles are allowed: the walk length is bounded because the number of edges is.) Analyze the running time.`,
      rubric: [
        'English definition of d_i(v): minimum length of a walk s ⇝ v with at most i edges',
        'Correct recurrence and base case',
        'Uses separate arrays per round (explains why in-place relaxation could exceed the edge budget)',
        'Answer d_k(t); time O(k(V+E)) and space O(V)'
      ],
      hints: [
        'This is Bellman–Ford viewed as a dynamic program indexed by the number of edges.',
        'Why does it matter that the graph may contain negative cycles?'
      ],
      solution: String.raw`**Subproblem.** $d_i(v)$ = minimum length of a walk from $s$ to $v$ with at most $i$ edges ($\infty$ if none).

**Recurrence.** $d_0(s) = 0$, $d_0(v) = \infty$ for $v \neq s$, and for $i \ge 1$
$$d_i(v) = \min\Big(d_{i-1}(v),\ \min_{u \to v} \big(d_{i-1}(u) + \ell(u \to v)\big)\Big).$$
A walk with at most $i$ edges either has at most $i-1$ edges, or its last edge is some $u \to v$ preceded by a walk with at most $i-1$ edges.

**Evaluation.** Keep two arrays, $prev = d_{i-1}$ and $cur = d_i$. For $i = 1..k$: copy $cur \leftarrow prev$, then for every edge $u \to v$ set $cur[v] \leftarrow \min(cur[v], prev[u] + \ell(u\to v))$; then swap. Return $d_k(t)$.

Using two arrays is essential: in-place updates could use a value $d_i(u)$ already improved in the same round, allowing more than $i$ edges, which (especially with negative cycles) could make the answer too small.

**Time/space.** $k$ rounds, each $O(V + E)$: $O(k(V+E))$ time and $O(V)$ space.`
    },
    {
      id: 'shortest-alternating', type: 'written', title: 'Shortest alternating walk', difficulty: 2,
      prompt: String.raw`$G = (V, E)$ is a directed graph with nonnegative edge lengths; each edge is red or blue. A walk is *alternating* if no two consecutive edges have the same color. Describe and analyze an algorithm to find the length of the shortest alternating walk from $s$ to $t$.`,
      rubric: [
        'Vertices (v, c): at v, last edge had color c',
        'Red edge u→v gives (u, blue) → (v, red); blue edge gives (u, red) → (v, blue); same length',
        'Handles the first edge (either color) via a super-source or two starts, and s = t',
        'Dijkstra (nonnegative lengths); answer min over colors at t',
        'Time O(E log V) in terms of the original graph'
      ],
      hints: ['What must you remember to know which edges you may take next?'],
      solution: String.raw`**Graph $H$.** Vertices $(v, R)$ and $(v, B)$ for each $v$: "at $v$, and the last edge used was red / blue". Plus a start vertex $s^*$ meaning "at $s$, no edge used yet".
- Each red edge $u \to v$ of length $\ell$: edge $(u, B) \to (v, R)$ of length $\ell$, and if $u = s$, also $s^* \to (v, R)$.
- Each blue edge $u \to v$: edge $(u, R) \to (v, B)$ of length $\ell$, and if $u = s$, also $s^* \to (v, B)$.

An alternating walk from $s$ corresponds exactly to a walk in $H$ from $s^*$ of the same length: the second coordinate forces each next edge to have the opposite color of the previous one.

**Algorithm.** Dijkstra in $H$ from $s^*$ (lengths are nonnegative). If $s = t$ the answer is 0 (empty walk); otherwise $\min(dist(t, R), dist(t, B))$.

**Time.** $H$ has $2V + 1$ vertices and at most $2E$ edges, so $O(E \log V)$ with a binary heap.`
    },
    {
      id: 'shortest-edges-on-sp', type: 'written', title: 'Edges on shortest paths', difficulty: 2,
      prompt: String.raw`Given a directed graph with **positive** edge lengths and vertices $s, t$, describe an $O(E \log V)$ algorithm that marks every edge that lies on **at least one** shortest path from $s$ to $t$. Prove the criterion you use.`,
      rubric: [
        'Dijkstra from s in G (d_s) and from t in rev(G) (d_t)',
        'Criterion: u→v on some shortest path iff d_s(u) + l(u→v) + d_t(v) = d_s(t) (with d_s(t) finite)',
        'Proof of both directions',
        'O(E log V) total'
      ],
      hints: ['A shortest s-t path through edge u→v consists of a shortest s-u path, the edge, and a shortest v-t path.'],
      solution: String.raw`**Algorithm.** Run Dijkstra from $s$ in $G$ to get $d_s(\cdot)$, and from $t$ in the reversed graph $rev(G)$ to get $d_t(v)$ = distance from $v$ to $t$ in $G$. If $d_s(t) = \infty$ mark nothing. Otherwise mark $u \to v$ iff
$$d_s(u) + \ell(u \to v) + d_t(v) = d_s(t).$$

**Proof.** (⇐) If equality holds, concatenating a shortest $s \leadsto u$ path, the edge $u \to v$, and a shortest $v \leadsto t$ path gives an $s$-$t$ walk of length $d_s(t)$. It is a shortest walk; since lengths are positive it is automatically a simple path (a repeated vertex would allow a strictly shorter walk). So $u \to v$ lies on a shortest path.
(⇒) If $u \to v$ is on a shortest path $P$, the prefix of $P$ up to $u$ has length $\ge d_s(u)$ and the suffix from $v$ has length $\ge d_t(v)$, so $d_s(t) = \ell(P) \ge d_s(u) + \ell(u\to v) + d_t(v)$; the reverse inequality holds for any walk, so equality holds.

**Time.** Two Dijkstra runs $O(E \log V)$ plus an $O(E)$ scan.`
    },
    {
      id: 'shortest-count', type: 'written', title: 'Counting shortest paths', difficulty: 3,
      prompt: String.raw`Given a directed graph with **positive** edge lengths and vertices $s, t$, describe and analyze an algorithm that computes the **number** of distinct shortest paths from $s$ to $t$. Explain what goes wrong if zero-length edges are allowed.`,
      rubric: [
        'Compute d_s by Dijkstra',
        'Defines tight edges u→v with d_s(u) + l = d_s(v); shows the tight subgraph is a DAG (positive lengths)',
        'Shortest s-t paths are exactly s-t paths in the tight DAG',
        'Counting recurrence in topological order (e.g. increasing d_s); answer N(t)',
        'O(E log V) time',
        'Zero-length cycles: tight subgraph may have cycles (infinitely many shortest walks / DP ill-defined)'
      ],
      hints: [
        'Which edges can appear on a shortest path from s? Those that are "tight".',
        'Sorting vertices by d_s gives a topological order of the tight edges when lengths are positive.'
      ],
      solution: String.raw`**Step 1.** Run Dijkstra from $s$ to get $d(v) = d_s(v)$.

**Step 2: tight edges.** Call $u \to v$ *tight* if $d(u) < \infty$ and $d(u) + \ell(u \to v) = d(v)$. Let $T$ be the subgraph of tight edges. Every tight edge strictly increases $d$ (positive lengths), so $T$ is a DAG, and sorting vertices by $d$ is a topological order of $T$ (Dijkstra's extraction order works).

**Claim.** The shortest $s$-$v$ paths in $G$ are exactly the $s$-$v$ paths in $T$. A path $s = v_0 \to \dots \to v_k = v$ has length $\ell(P) = \sum \ell(v_{i-1}v_i) \ge \sum (d(v_i) - d(v_{i-1})) = d(v)$, with equality iff every edge is tight.

**Step 3: count.** $N(s) = 1$ and, for $v \ne s$, $N(v) = \sum_{u \to v \text{ tight}} N(u)$. Evaluate in increasing order of $d$ (all tight in-neighbors of $v$ have smaller $d$). Answer: $N(t)$ (0 if $t$ is unreachable).

**Time.** Dijkstra $O(E \log V)$, then $O(V + E)$ arithmetic operations.

**Zero-length edges.** A zero-length cycle among vertices with equal $d$ makes $T$ cyclic: there may then be infinitely many shortest *walks*, the order by $d$ is no longer topological, and the recurrence is circular. (Counting shortest *simple paths* in that case is a much harder problem.)`
    },
    {
      id: 'shortest-neg-inf', type: 'written', title: 'Which distances are minus infinity?', difficulty: 3,
      prompt: String.raw`Given a directed graph $G$ with arbitrary edge lengths and a source $s$, describe an $O(VE)$ algorithm that classifies every vertex $v$ as: $dist(v) = +\infty$ (unreachable), $dist(v) = -\infty$ (some walk from $s$ to $v$ can include a negative cycle), or $dist(v)$ finite (in which case output it). Prove correctness.`,
      rubric: [
        'Run V-1 rounds of Bellman–Ford',
        'Mark heads of edges still tense; then mark everything reachable from marked vertices (WFS)',
        'Proof: every reachable negative cycle has a tense edge, so its vertices (and everything after) are caught',
        'Proof: a vertex with finite true distance has the correct value after V-1 rounds and is never marked',
        'Unreachable vertices keep infinity; time O(VE)'
      ],
      hints: [
        'dist(v) = −∞ exactly when v is reachable from a negative cycle that is reachable from s.',
        'After V-1 rounds, a vertex whose true distance is finite already has its correct value.'
      ],
      solution: String.raw`**Characterization.** $dist(v) = -\infty$ iff $v$ is reachable from some vertex of a negative cycle that is itself reachable from $s$.

**Algorithm.**
1. Run $V-1$ rounds of Bellman–Ford from $s$ (relax only from finite $dist(u)$).
2. Mark the head $v$ of every edge $u \to v$ that is still tense.
3. Run whatever-first search from all marked vertices; mark everything reached.
4. Output: unmarked with $dist(v) = \infty$ ⇒ $+\infty$; marked ⇒ $-\infty$; otherwise $dist(v)$.

**Every $-\infty$ vertex is marked.** Let $C$ be a negative cycle reachable from $s$. After $V-1$ rounds all its vertices have finite $dist$ (each reachable vertex is reached by a path of $\le V-1$ edges). If no edge of $C$ were tense, summing $dist(v_i) \le dist(v_{i-1}) + \ell(v_{i-1}v_i)$ around $C$ gives $0 \le \ell(C) < 0$. So some edge of $C$ is tense and its head is marked in step 2; step 3 then marks every vertex reachable from $C$.

**Every marked vertex is $-\infty$.** First, a vertex $x$ with finite true distance $d^*(x)$ has $dist(x) = d^*(x)$ after $V-1$ rounds: no walk from $s$ to $x$ touches a negative cycle, so some shortest walk is a simple path with at most $V-1$ edges, and Bellman–Ford's lemma gives $dist(x) \le d^*(x)$ (while $dist(x) \ge d^*(x)$ always). Now suppose step 2 marks $v$ because $u \to v$ is tense. Then $dist(u) < \infty$, so $u$ and $v$ are reachable. If $d^*(u)$ and $d^*(v)$ were both finite, then $dist(v) = d^*(v) \le d^*(u) + \ell(u \to v) = dist(u) + \ell(u \to v)$, so the edge would not be tense. If $d^*(u) = -\infty$ then also $d^*(v) = -\infty$ (extend those walks by $u \to v$). Either way $d^*(v) = -\infty$. Finally, everything reachable from a $-\infty$ vertex is $-\infty$, so step 3 marks only $-\infty$ vertices.

**Unreachable vertices** keep $dist = \infty$ and are not reachable from anything reachable from $s$, so they are not marked.

**Time.** Bellman–Ford $O(VE)$, plus $O(V+E)$ for the marking search.`
    },
    {
      id: 'shortest-ev-charging', type: 'written', title: 'Electric car with limited range', difficulty: 3,
      prompt: String.raw`An undirected road network $G = (V, E)$ has positive edge lengths. A subset $S \subseteq V$ of vertices have charging stations. An electric car can drive at most $R$ miles on a full charge; it starts at $s$ fully charged and fully recharges whenever it stops at a station. Describe and analyze an algorithm to find the length of the shortest route from $s$ to $t$ that never runs out of charge (or report that none exists).`,
      rubric: [
        'Identifies that between consecutive charges the car drives some walk of length at most R, which may be replaced by a shortest path',
        'Builds graph H on S ∪ {s, t} with an edge xy of length dist_G(x,y) whenever dist_G(x,y) <= R',
        'Computes the needed distances with Dijkstra from each vertex of S ∪ {s}',
        'Dijkstra on H from s; answer dist_H(t)',
        'Correctness argument in both directions',
        'Running time O(|S| E log V + |S|^2 log |S|) or similar, correctly derived'
      ],
      hints: [
        'Break any valid route at the points where the car recharges.',
        'Between two consecutive charging stops, what is the best way to drive?'
      ],
      solution: String.raw`Let $K = S \cup \{s, t\}$, $k = |K|$.

**Step 1: distances between important vertices.** For each $x \in K \setminus \{t\}$ run Dijkstra in $G$ from $x$ to get $dist_G(x, y)$ for all $y \in K$. ($G$ is undirected, so $dist_G(x, t) = dist_G(t, x)$ and we do not need to run from $t$.)

**Step 2: the hop graph.** Build an undirected graph $H$ on vertex set $K$, with an edge $xy$ of length $dist_G(x,y)$ whenever $dist_G(x, y) \le R$.

**Step 3.** Run Dijkstra in $H$ from $s$; output $dist_H(s, t)$ (or "impossible" if infinite).

**Correctness.** (Route ⇒ walk in $H$.) Take a valid route and cut it at the stations where the car recharges: $s = x_0, x_1, \dots, x_m = t$, with each $x_i \in S$ for $0 < i < m$. Each segment from $x_{i-1}$ to $x_i$ is driven on one charge, so its length is at most $R$ and at least $dist_G(x_{i-1}, x_i)$. Hence each $x_{i-1}x_i$ is an edge of $H$ and the route is at least as long as the walk $x_0, \dots, x_m$ in $H$.
(Walk in $H$ ⇒ route.) Conversely, a walk $s = x_0, \dots, x_m = t$ in $H$ yields a valid route of the same length: drive a shortest path from $x_{i-1}$ to $x_i$ (length $\le R$), recharging at each intermediate $x_i \in S$.
So the shortest valid route has length exactly $dist_H(s,t)$.

**Time.** Step 1: at most $|S| + 1$ Dijkstra runs, $O(|S| \cdot E \log V)$. Step 2: $O(k^2)$. Step 3: Dijkstra on a graph with $k$ vertices and $O(k^2)$ edges, $O(k^2 \log k)$. Total $O(|S| E \log V + |S|^2 \log |S|)$, which is $O(VE \log V)$ in the worst case.`
    },
    {
      id: 'shortest-vertex-tolls', type: 'written', title: 'Tolls on vertices', difficulty: 1,
      prompt: String.raw`Each edge $u \to v$ of a directed graph has a travel time $\ell(u \to v) \ge 0$, and each vertex $v$ charges a waiting time $c(v) \ge 0$ whenever a route passes through it (including the endpoints $s$ and $t$). Show how to compute the minimum total time from $s$ to $t$ with a single call to Dijkstra on a suitable graph. State the running time.`,
      rubric: [
        'Transformation: add c(v) to every edge entering v (plus c(s) separately), or split vertices',
        'Correctness: each route\'s total cost is preserved exactly',
        'Nonnegative lengths so Dijkstra applies; O(E log V)'
      ],
      hints: ['Every time you enter a vertex, you pay its toll exactly once.'],
      solution: String.raw`Define new lengths $\ell'(u \to v) = \ell(u \to v) + c(v)$. A walk $s = v_0 \to \dots \to v_k = t$ has original cost $c(v_0) + \sum_{i=1}^{k} (\ell(v_{i-1}v_i) + c(v_i))$, which equals $c(s) + \ell'$-length of the walk. Since $c(s)$ is the same for all walks, run Dijkstra from $s$ with lengths $\ell' \ge 0$ and output $c(s) + dist'(t)$.

(Equivalent: split each $v$ into $v_{in} \to v_{out}$ of length $c(v)$, redirect edges into $v_{in}$ and out of $v_{out}$, and compute the distance from $s_{in}$ to $t_{out}$.)

The new graph has the same number of vertices and edges (or $2V$ vertices and $E + V$ edges when splitting), so the time is $O(E \log V)$.`
    },
    {
      id: 'shortest-girth', type: 'written', title: 'Shortest cycle in a weighted digraph', difficulty: 2,
      prompt: String.raw`Given a directed graph with **positive** edge lengths, describe an algorithm to find the length of its shortest directed cycle. Give two versions: one using Floyd–Warshall and one using repeated Dijkstra, and compare their running times.`,
      rubric: [
        'Shortest cycle through edge u→v has length l(u→v) + dist(v, u)',
        'Answer = min over edges u→v of l(u→v) + dist(v,u)',
        'Floyd–Warshall version O(V^3)',
        'Dijkstra version O(VE log V)',
        'Comparison (sparse vs dense)'
      ],
      hints: ['Any cycle contains some edge u → v; the rest of the cycle is a path from v back to u.'],
      solution: String.raw`**Key fact.** A cycle containing the edge $u \to v$ consists of that edge plus a path from $v$ back to $u$, so it has length at least $\ell(u \to v) + dist(v, u)$. Conversely, a shortest $v \leadsto u$ walk is a simple path (lengths are positive), and appending the edge $u \to v$ closes it into a cycle of exactly that length. So
$$\text{girth} = \min_{u \to v \in E} \big(\ell(u \to v) + dist(v, u)\big),$$
with $\infty$ meaning the graph is acyclic. A self-loop $u \to u$ counts with $dist(u,u) = 0$.

**Version 1.** Floyd–Warshall computes all $dist(v, u)$ in $O(V^3)$; then scan the edges in $O(E)$. Total $O(V^3)$.

**Version 2.** Run Dijkstra from every vertex: $O(VE \log V)$; then scan edges. Total $O(VE\log V)$.

**Comparison.** For sparse graphs ($E = O(V)$), version 2 takes $O(V^2 \log V)$, better than $O(V^3)$. For dense graphs ($E = \Theta(V^2)$), version 2 is $O(V^3 \log V)$ and Floyd–Warshall wins.`
    },
    {
      id: 'shortest-kedges-code', type: 'code', title: 'Cheapest walk with at most k edges', difficulty: 2,
      prompt: String.raw`Write <code>atMostKEdges(n, edges, s, t, k)</code>. The graph is directed on vertices <code>0..n-1</code> with edges <code>[u, v, w]</code> meaning $u \to v$ of integer length $w$ (**possibly negative; negative cycles may exist**). Return the minimum length of a walk from <code>s</code> to <code>t</code> that uses **at most** <code>k</code> edges, or <code>null</code> if there is none. The empty walk (0 edges, length 0) counts when <code>s === t</code>.

Because the number of edges is bounded, the answer is always a finite number even with negative cycles. Watch out for the classic in-place relaxation bug.`,
      fn: 'atMostKEdges',
      starter: 'function atMostKEdges(n, edges, s, t, k) {\n  // Bellman-Ford DP: d_i(v) = shortest walk s->v with at most i edges\n  // use two arrays per round!\n}\n',
      reference: function (n, edges, s, t, k) {
        let prev = new Array(n).fill(Infinity);
        prev[s] = 0;
        for (let i = 1; i <= k; i++) {
          const cur = prev.slice();
          for (const [u, v, w] of edges) if (prev[u] !== Infinity && prev[u] + w < cur[v]) cur[v] = prev[u] + w;
          prev = cur;
        }
        return prev[t] === Infinity ? null : prev[t];
      },
      tests: [
        [1, [], 0, 0, 0],
        [3, [[0, 1, 4], [1, 2, 4], [0, 2, 10]], 0, 2, 1],
        [3, [[0, 1, 4], [1, 2, 4], [0, 2, 10]], 0, 2, 2],
        [2, [[0, 1, 1], [1, 0, -3]], 0, 1, 5],
        [3, [[1, 2, 1]], 0, 2, 3],
        [2, [[0, 0, -1]], 0, 0, 3],
        [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 5]], 0, 3, 2],
        [4, [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 3, 5]], 0, 3, 3],
        [4, [[2, 3, 1], [1, 2, 1], [0, 1, 1]], 0, 3, 2]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 6);
        const m = Math.floor(Math.random() * 2.5 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 15) - 5]);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 5)];
      },
      hints: [
        'Let d_i(v) be the minimum length of a walk from s to v with at most i edges. Then d_i(v) = min(d_{i-1}(v), min over edges u->v of d_{i-1}(u) + w).',
        'Compute round i into a fresh array, reading only the previous round. If you update in place and the edges happen to be listed along a path, one round can follow several edges (one of the tests is designed to catch exactly that).'
      ],
      solution: String.raw`**Subproblem.** $d_i(v)$ = minimum length of a walk from $s$ to $v$ using at most $i$ edges ($\infty$ if none).

**Recurrence.** $d_0(s) = 0$ and $d_0(v) = \infty$ otherwise; for $i \ge 1$,
$$d_i(v) = \min\Big(d_{i-1}(v),\ \min_{u \to v}\big(d_{i-1}(u) + w(u \to v)\big)\Big).$$
A walk with at most $i$ edges either has at most $i - 1$ edges or ends with an edge $u \to v$ after a walk of at most $i - 1$ edges.

**Evaluation.** Two arrays: <code>cur</code> starts as a copy of <code>prev</code>, and every edge updates <code>cur[v]</code> from <code>prev[u]</code>. After $k$ rounds return $d_k(t)$ (null for $\infty$).

**Why two arrays.** With in-place updates, if the edges are processed in path order $0 \to 1, 1 \to 2, 2 \to 3$, a single round already reaches vertex 3, so "after 2 rounds" might report a 3-edge walk. With negative cycles this can make the answer too small.

**Time.** $O(k(V + E))$, space $O(V)$. No negative-cycle check is needed: walks with at most $k$ edges have bounded length.`
    },
    {
      id: 'shortest-bottleneck-code', type: 'code', title: 'Maximum-bottleneck path', difficulty: 2,
      prompt: String.raw`Write <code>maxBottleneck(n, edges, s, t)</code>. The graph is **undirected** on vertices <code>0..n-1</code>; each edge <code>[u, v, c]</code> has a positive integer capacity $c$. The *bottleneck* of a path is the smallest capacity on it. Return the largest bottleneck of any path from <code>s</code> to <code>t</code>, or <code>0</code> if <code>t</code> is not reachable. You may assume <code>s !== t</code>. Parallel edges and self-loops may appear.`,
      fn: 'maxBottleneck',
      starter: 'function maxBottleneck(n, edges, s, t) {\n  // option 1: max-min Dijkstra\n  // option 2: try thresholds + reachability\n}\n',
      reference: function (n, edges, s, t) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v, c] of edges) { adj[u].push([v, c]); adj[v].push([u, c]); }
        const width = new Array(n).fill(-1);
        const done = new Array(n).fill(false);
        width[s] = Infinity;
        for (let it = 0; it < n; it++) {
          let u = -1;
          for (let v = 0; v < n; v++) if (!done[v] && width[v] >= 0 && (u === -1 || width[v] > width[u])) u = v;
          if (u === -1) break;
          done[u] = true;
          for (const [v, c] of adj[u]) { const b = Math.min(width[u], c); if (b > width[v]) width[v] = b; }
        }
        return width[t] < 0 ? 0 : width[t];
      },
      tests: [
        [2, [], 0, 1],
        [2, [[0, 1, 7]], 0, 1],
        [4, [[0, 1, 5], [1, 3, 2], [0, 2, 3], [2, 3, 4]], 0, 3],
        [3, [[0, 1, 4], [1, 2, 9], [0, 2, 1], [0, 1, 6]], 0, 2],
        [5, [[0, 1, 10], [1, 2, 1], [3, 4, 8]], 0, 4],
        [3, [[0, 0, 50], [0, 1, 3], [1, 2, 3]], 2, 0],
        [6, [[0, 1, 9], [1, 2, 9], [2, 5, 1], [0, 3, 2], [3, 4, 8], [4, 5, 8], [1, 4, 5]], 0, 5]
      ],
      gen: () => {
        const n = 2 + Math.floor(Math.random() * 8);
        const m = Math.floor(Math.random() * 2 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), 1 + Math.floor(Math.random() * 20)]);
        const s = Math.floor(Math.random() * n);
        let t = Math.floor(Math.random() * (n - 1));
        if (t >= s) t++;
        return [n, edges, s, t];
      },
      hints: [
        'For a threshold b, there is a path with bottleneck >= b iff t is reachable from s using only edges of capacity >= b. The answer is one of the capacities.',
        'Faster: Dijkstra where width(s) = infinity, you extract the vertex with the LARGEST width, and an edge (u, v, c) offers width min(width(u), c) to v.'
      ],
      solution: String.raw`**Threshold view.** Let $G_b$ keep only edges with capacity $\ge b$. A path of bottleneck $\ge b$ exists iff $t$ is reachable from $s$ in $G_b$, and this is monotone in $b$. The optimum equals some edge capacity, so binary search over the sorted distinct capacities with a reachability search per probe: $O(E \log E)$.

**Max-min Dijkstra.** Keep $width(v)$, the best bottleneck found so far ($width(s) = \infty$, others "none"). Repeatedly finalize the unfinished vertex with the largest width $u$ and, for every edge $(u, v, c)$, set $width(v) \leftarrow \max(width(v), \min(width(u), c))$. The Dijkstra proof carries over because extending a path never increases its bottleneck, the analogue of nonnegative lengths: when $u$ is finalized, any better path to $u$ would pass through an unfinalized vertex $y$ whose width is at least that path's bottleneck, which is more than $width(u)$, contradicting the choice of $u$. Time $O(E \log V)$ with a heap ($O(V^2)$ with the array scan used in the reference).

Answer $width(t)$, or 0 if $t$ was never reached. (Equivalently: the $s$-$t$ path in a **maximum** spanning tree.)`
    },
    {
      id: 'shortest-second-code', type: 'code', title: 'Second-shortest walk length', difficulty: 3,
      prompt: String.raw`Write <code>secondShortest(n, edges, s, t)</code>. The graph is directed on vertices <code>0..n-1</code> with edges <code>[u, v, w]</code>, each $w$ a **positive** integer. Let $D$ be the length of a shortest walk from <code>s</code> to <code>t</code> (the empty walk has length 0 if <code>s === t</code>). Return the smallest length of a walk from <code>s</code> to <code>t</code> that is **strictly greater** than $D$ (walks may repeat vertices and edges), or <code>-1</code> if no such walk exists (including when <code>t</code> is unreachable).

Note: a second walk of the *same* length $D$ does not count.`,
      fn: 'secondShortest',
      starter: 'function secondShortest(n, edges, s, t) {\n  // distances from s, distances to t (reverse graph), then scan edges\n}\n',
      reference: function (n, edges, s, t) {
        function dij(src, rev) {
          const adj = Array.from({ length: n }, () => []);
          for (const [u, v, w] of edges) { if (rev) adj[v].push([u, w]); else adj[u].push([v, w]); }
          const d = new Array(n).fill(Infinity), done = new Array(n).fill(false);
          d[src] = 0;
          for (let it = 0; it < n; it++) {
            let u = -1;
            for (let v = 0; v < n; v++) if (!done[v] && d[v] < Infinity && (u === -1 || d[v] < d[u])) u = v;
            if (u === -1) break;
            done[u] = true;
            for (const [v, w] of adj[u]) if (d[u] + w < d[v]) d[v] = d[u] + w;
          }
          return d;
        }
        const ds = dij(s, false), dt = dij(t, true);
        const D = ds[t];
        if (D === Infinity) return -1;
        let best = Infinity;
        for (const [u, v, w] of edges) {
          const val = ds[u] + w + dt[v];
          if (val > D && val < best) best = val;
        }
        return best === Infinity ? -1 : best;
      },
      tests: [
        [1, [], 0, 0],
        [2, [[0, 1, 3]], 0, 1],
        [2, [[0, 1, 3], [0, 1, 5]], 0, 1],
        [2, [[0, 1, 3], [1, 0, 2]], 0, 1],
        [3, [[0, 1, 1], [1, 2, 1], [0, 2, 2]], 0, 2],
        [3, [[0, 1, 1], [1, 2, 1], [0, 2, 3]], 0, 2],
        [1, [[0, 0, 4]], 0, 0],
        [4, [[0, 1, 2], [1, 3, 2], [1, 2, 1], [2, 1, 1], [0, 3, 9]], 0, 3],
        [3, [[1, 2, 1]], 0, 2]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const m = Math.floor(Math.random() * 2 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), 1 + Math.floor(Math.random() * 9)]);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
      },
      hints: [
        'Compute d_s (Dijkstra from s) and d_t (Dijkstra from t in the reversed graph). For any edge u->v, d_s(u) + w + d_t(v) is the length of some s-t walk.',
        'Take any walk W longer than D. Let v_i be the LAST vertex such that the prefix of W up to v_i is a shortest path to v_i. What can you say about the next edge of W?'
      ],
      solution: String.raw`**Algorithm.** Compute $d_s$ by Dijkstra from $s$ and $d_t$ by Dijkstra from $t$ in $rev(G)$. Let $D = d_s(t)$; if it is $\infty$ return $-1$. Return the minimum of $val(u \to v) = d_s(u) + w(u \to v) + d_t(v)$ over all edges whose value is **strictly greater** than $D$ ($-1$ if there is none). Time $O(E \log V)$.

**Every value is achievable.** $val(u\to v)$ is the length of the walk "shortest path to $u$, the edge, shortest path from $v$ to $t$".

**The minimum is not too large.** Let $W = v_0 v_1 \dots v_k$ be any $s$-$t$ walk with length $L > D$, and let $p_i$ be the length of its prefix up to $v_i$. Let $i$ be the largest index with $p_i = d_s(v_i)$ (index 0 qualifies). If $i = k$ then $L = d_s(t) = D$, impossible, so $i < k$. For the edge $v_i \to v_{i+1}$: $val \le p_i + w + (L - p_{i+1}) = L$, since the suffix of $W$ from $v_{i+1}$ has length at least $d_t(v_{i+1})$. And $val > D$: otherwise $val = D$, and then $D \le d_s(v_{i+1}) + d_t(v_{i+1}) \le d_s(v_i) + w + d_t(v_{i+1}) = D$ forces $d_s(v_{i+1}) = d_s(v_i) + w = p_{i+1}$, contradicting the maximality of $i$. So every longer walk has length at least some value $> D$, and the minimum over such values is exactly the answer.

**Traps.** Two different shortest paths of the same length do not give a "second shortest" (the test with edges $0\to1\to2$ and $0 \to 2$ both of length 2 expects $-1$). If $s = t$, $D = 0$ and the answer is the shortest closed walk through $s$.`
    },
    {
      id: 'shortest-fuel-time', type: 'written', title: 'Truck with a fuel tank, minimizing time', difficulty: 3,
      prompt: String.raw`A truck drives on a directed road network $G = (V, E)$. Road $e$ takes $\tau(e) > 0$ minutes and burns $f(e)$ units of fuel, a positive integer. The tank holds at most $C$ units ($C$ a positive integer). A subset $S \subseteq V$ of intersections have fuel pumps; at a pump the truck may add fuel at a rate of one unit per minute, stopping whenever it likes. The truck starts at $s$ with a **full** tank. Describe and analyze an algorithm to compute the minimum total time (driving plus refueling) to reach $t$, or report that $t$ cannot be reached. State whether your algorithm is polynomial in the input size.`,
      rubric: [
        'Vertices (v, g), 0 <= g <= C, with a clear English meaning',
        'Refuel edges (v,g) -> (v,g+1) of length 1 only for v in S and g < C',
        'Drive edges (u,g) -> (v, g - f(e)) of length tau(e), only when g >= f(e)',
        'Dijkstra from (s, C); answer min over g of dist(t, g) (or super-target)',
        'Size: V(C+1) vertices, at most |S|C + E(C+1) edges; time O((V+E) C log(VC))',
        'Notes the bound is pseudo-polynomial (polynomial in the value C, exponential in its bit length)'
      ],
      hints: [
        'Whether you can drive a road depends on how much fuel you have, so fuel belongs in the state.',
        'Model refueling one unit at a time so you do not need an edge for every possible amount.'
      ],
      solution: String.raw`**Vertices.** $H$ has a vertex $(v, g)$ for each $v \in V$ and $0 \le g \le C$: "the truck is at $v$ with exactly $g$ units of fuel".

**Edges.**
- *Refuel:* for every pump $v \in S$ and $0 \le g < C$, an edge $(v, g) \to (v, g+1)$ of length 1 (one minute). Adding $j$ units is a chain of $j$ of these edges.
- *Drive:* for every road $e = u \to v$ and every $g$ with $f(e) \le g \le C$, an edge $(u, g) \to (v, g - f(e))$ of length $\tau(e)$.

**Algorithm.** All lengths are positive, so run Dijkstra on $H$ from $(s, C)$. The answer is $\min_{0 \le g \le C} dist((t, g))$; if all are infinite, $t$ is unreachable.

**Correctness.** Any legal trip (a sequence of drives and refuels in which the fuel never goes negative or above $C$) corresponds to a walk in $H$ from $(s, C)$ with one edge per minute of refueling and per road driven, with the same total time; conversely every walk in $H$ from $(s, C)$ describes a legal trip, since drive edges exist only when there is enough fuel and refuel edges never exceed $C$.

**Size and time.** $|V(H)| = V(C+1)$. Refuel edges: at most $|S| \cdot C$. Drive edges: at most $E(C+1)$. With a binary heap Dijkstra takes
$$O\big((|S|C + EC + VC)\log(VC)\big) = O\big((V + E)\,C \log(VC)\big).$$

**Polynomial?** The input encodes $C$ with $O(\log C)$ bits, so this bound is **pseudo-polynomial**: polynomial in $V$, $E$ and the *value* $C$, but exponential in the length of $C$'s encoding. (If $C \ge \sum_e f(e)$ the tank never runs dry along a simple route, so one may cap $C$ at that sum, but that does not make the bound polynomial in the bit-length when the $f(e)$ are large.)`
    },
    {
      id: 'shortest-no-left-turns', type: 'written', title: 'No left turns', difficulty: 3,
      prompt: String.raw`A city is modeled as a directed graph $G = (V, E)$ with positive lengths. For every pair of consecutive roads $u \to v$, $v \to w$ you are told (in $O(1)$ time) whether turning from $u \to v$ onto $v \to w$ is a *left turn*. Left turns are forbidden. Describe and analyze an algorithm to find the shortest route from $s$ to $t$ that makes no left turns. Express the running time in terms of $V$, $E$ and the in- and out-degrees of $G$, and simplify it for a road network in which every vertex has degree at most 4.`,
      rubric: [
        'Explains why a vertex alone is not enough state (the legal next roads depend on the incoming road)',
        'Vertices of H = edges of G (plus a start vertex), with English meaning',
        'Edges of H: (u->v) to (v->w) of length l(v->w) when the turn is not a left turn; start edges for roads out of s',
        'Dijkstra from the start vertex; answer min over roads into t (and 0 if s = t)',
        'Size |V(H)| = E + 1, |E(H)| <= sum_v indeg(v) outdeg(v) + outdeg(s)',
        'Time O(sum_v indeg(v) outdeg(v) log E), which is O(E log V) for bounded degree'
      ],
      hints: [
        'Whether you may take road v -> w depends on which road you used to arrive at v.',
        'Let the vertices of the new graph be the roads of G.'
      ],
      solution: String.raw`**State.** Which roads you may take out of $v$ depends on the road you arrived on, so the state is the last road driven.

**Graph $H$.** One vertex $[u \to v]$ for each road of $G$, meaning "I have just driven along $u \to v$ and am now at $v$", plus a start vertex $\sigma$ meaning "at $s$, nothing driven yet".
- For each road $s \to w$: an edge $\sigma \to [s \to w]$ of length $\ell(s \to w)$ (no turn is made at the start).
- For each pair of roads $u \to v$, $v \to w$ such that the turn is not a left turn: an edge $[u \to v] \to [v \to w]$ of length $\ell(v \to w)$.

**Algorithm.** Dijkstra from $\sigma$ (lengths positive). If $s = t$ the answer is 0; otherwise it is $\min$ of $dist([u \to t])$ over all roads into $t$ (infinite means impossible).

**Correctness.** A route $s = v_0 \to v_1 \to \dots \to v_k = t$ without left turns corresponds to the walk $\sigma, [v_0 \to v_1], [v_1 \to v_2], \dots, [v_{k-1} \to v_k]$ in $H$, whose length is $\sum \ell(v_{i-1} \to v_i)$, and every walk in $H$ from $\sigma$ arises this way from a legal route.

**Size.** $|V(H)| = E + 1$. The number of candidate turns at $v$ is $indeg(v) \cdot outdeg(v)$, so $|E(H)| \le outdeg(s) + \sum_v indeg(v)\,outdeg(v)$. Building $H$ takes time proportional to its size.

**Time.** $O\big(\sum_v indeg(v)\,outdeg(v) \cdot \log E\big)$ (plus $O(V+E)$). If every degree is at most 4, the sum is at most $4E$ and $\log E = O(\log V)$, so the time is $O(E \log V)$. For general graphs the sum can be as large as $\Theta(E^2)$ (one huge intersection), which must be stated rather than hidden.`
    },
    {
      id: 'shortest-arbitrage', type: 'written', title: 'Currency arbitrage', difficulty: 2,
      prompt: String.raw`You are given $n$ currencies and an $n \times n$ table $R$ where one unit of currency $i$ buys $R[i][j] > 0$ units of currency $j$. (a) Describe an $O(n^3)$ algorithm that decides whether some cycle of exchanges $i_0 \to i_1 \to \dots \to i_k = i_0$ turns one unit of $i_0$ into **more** than one unit. (b) Explain how to output such a cycle. (c) Explain why Dijkstra's algorithm cannot be used. Assume exact arithmetic.`,
      rubric: [
        'Transforms products to sums: lengths -log R[i][j]; arbitrage iff negative cycle (with the chain of equivalences)',
        'Bellman–Ford from a super-source with 0-length edges (or Floyd–Warshall diagonal test); O(n^3) justified',
        'Cycle extraction via predecessor pointers (or FW successor matrix)',
        'Dijkstra fails because lengths are negative whenever a rate exceeds 1'
      ],
      hints: [
        'Logarithms turn products into sums.',
        'You want a cycle whose product is greater than 1; after taking -log, what does that become?'
      ],
      solution: String.raw`**(a) Transformation.** Build the complete directed graph on the currencies with $\ell(i \to j) = -\log R[i][j]$. For a cycle $C$,
$$\prod_{(i,j) \in C} R[i][j] > 1 \iff \sum_{(i,j)\in C} \log R[i][j] > 0 \iff \sum_{(i,j) \in C} \ell(i\to j) < 0.$$
So an arbitrage exists iff the graph has a **negative cycle**. Add a vertex $z$ with a 0-length edge to every currency, so every cycle is reachable from $z$, and run Bellman–Ford from $z$: $V = n+1$ and $E = n^2 + n$, so $O(VE) = O(n^3)$. Report arbitrage iff some edge is still tense afterward. (Floyd–Warshall also works in $O(n^3)$: arbitrage iff some $D[i][i] < 0$.)

**(b) Output.** Let $u \to v$ be an edge still tense after the $V - 1$ rounds. Relax it (set $pred(v) = u$). Walk $pred$ pointers from $v$ $V$ times to reach a vertex $x$; $x$ lies on a cycle of the predecessor graph, and every such cycle is a negative cycle. Follow $pred$ from $x$ until returning to $x$ and output that cycle reversed (the order of trades). $O(n)$ extra time.

**(c) Dijkstra.** Whenever $R[i][j] > 1$, $\ell(i\to j) < 0$. Dijkstra's correctness needs nonnegative lengths, and here negative cycles are exactly what we are looking for; Dijkstra has no way to detect them.`
    },
    {
      id: 'shortest-reliable', type: 'written', title: 'Most reliable route', difficulty: 2,
      prompt: String.raw`In a directed communication network, a message sent along link $e$ arrives intact with probability $p(e) \in (0, 1]$, independently of other links. (a) Describe an algorithm to find the route from $s$ to $t$ with the **highest** probability of delivering the message intact. (b) Now routes may use at most $h$ links. Describe an algorithm for this version. Give running times.`,
      rubric: [
        '(a) Lengths -log p(e) >= 0 and justification that maximizing the product = minimizing the sum',
        '(a) Dijkstra, O(E log V); correctness of using a nonnegative-length algorithm',
        '(b) Hop-limited: Bellman–Ford DP with two arrays (or a layered DAG V x {0..h}), O(h(V+E))',
        '(b) Explains why plain Dijkstra on the original graph ignores the hop limit'
      ],
      hints: [
        'Products become sums under logarithms; check the sign of log p for p <= 1.',
        'For (b), the hop count is the extra state, and it strictly increases along every edge.'
      ],
      solution: String.raw`**(a)** The probability of a route $P$ is $\prod_{e \in P} p(e)$. Since $\log$ is increasing, maximizing it is the same as minimizing $\sum_{e\in P} -\log p(e)$. Set $\ell(e) = -\log p(e)$; because $0 < p(e) \le 1$, $\ell(e) \ge 0$. Run Dijkstra from $s$ and follow $pred$ pointers from $t$. Time $O(E \log V)$. (An edge with $p(e) = 0$ would get length $\infty$ and can simply be deleted.)

**(b)** With at most $h$ links, use the edge-budget DP: $d_i(v)$ = minimum $\sum -\log p$ over walks from $s$ to $v$ with at most $i$ edges, $d_i(v) = \min(d_{i-1}(v), \min_{u\to v} d_{i-1}(u) + \ell(u \to v))$, computed with two arrays for $i = 1..h$. Answer $e^{-d_h(t)}$. Time $O(h(V + E))$.

Equivalently, build the layered graph with vertices $(v, i)$, $0 \le i \le h$, and edges $(u, i) \to (v, i+1)$; it is a DAG (the layer index increases), so the DAG DP runs in $O(h(V+E))$. Plain Dijkstra on $G$ is wrong for (b): the most reliable route may use more than $h$ links. Since walks never help here (all $\ell \ge 0$), we may assume $h \le V - 1$.`
    },
    {
      id: 'shortest-choose-algo', type: 'written', title: 'Pick the right algorithm', difficulty: 1,
      prompt: String.raw`For each scenario, name the most appropriate algorithm and its running time in terms of $V$ and $E$ (or say why no efficient algorithm is known).

(a) Directed graph, all edges length 1, distances from $s$.
(b) Directed **acyclic** graph with lengths in $\{-3, \dots, 10\}$, distances from $s$.
(c) Road network (undirected, positive lengths) with 5 depots; for every vertex, the distance to its **nearest** depot.
(d) Directed graph with some negative edges; decide whether it contains a negative cycle **anywhere**.
(e) Directed graph, positive lengths; distances from **every** vertex **to** a single target $t$.
(f) Dense graph ($E = \Theta(V^2)$) with nonnegative lengths; all-pairs distances.
(g) Directed graph with positive lengths; the longest simple path from $s$ to $t$.`,
      rubric: [
        '(a) BFS O(V+E)',
        '(b) DAG DP in topological order O(V+E) (Dijkstra is wrong with negative edges)',
        '(c) Super-source with 0-length edges to the depots + one Dijkstra, O(E log V)',
        '(d) Super-source with 0-length edges to all vertices + Bellman–Ford, O(VE)',
        '(e) Dijkstra from t in the reversed graph, O(E log V)',
        '(f) Floyd–Warshall O(V^3) (or V array-Dijkstras, O(V^3))',
        '(g) NP-hard; negating + Bellman–Ford does not work'
      ],
      hints: ['For (c) and (e), one run of Dijkstra suffices if you change the graph slightly.'],
      solution: String.raw`**(a)** BFS, $O(V + E)$.

**(b)** Relax edges in topological order (DAG DP), $O(V + E)$. Dijkstra could be wrong because of negative lengths; Bellman–Ford is correct but needlessly $O(VE)$.

**(c)** Add a super-source $z$ with 0-length edges to the 5 depots and run Dijkstra once from $z$: $dist(z, v) = \min_{\text{depot } x} dist(x, v)$. $O(E \log V)$. (Five separate Dijkstras is also $O(E\log V)$, but the super-source trick works for any number of depots.)

**(d)** Add $z$ with 0-length edges to every vertex, run Bellman–Ford from $z$, and check for a tense edge: $O(VE)$. Running from an arbitrary $s$ would miss cycles not reachable from $s$.

**(e)** Reverse every edge and run Dijkstra from $t$: a path $v \leadsto t$ in $G$ is a path $t \leadsto v$ in $rev(G)$ with the same length. $O(E \log V)$.

**(f)** Floyd–Warshall, $O(V^3)$. Repeated binary-heap Dijkstra would be $O(V^3 \log V)$; repeated array-based Dijkstra is $V \cdot O(V^2) = O(V^3)$ too.

**(g)** NP-hard (it solves Hamiltonian path), so no polynomial-time algorithm is known. Negating lengths turns every cycle into a negative cycle, so Bellman–Ford just reports $-\infty$. (If the graph were a DAG, the DAG DP would solve it in $O(V+E)$.)`
    },
    {
      id: 'shortest-neg-source', type: 'written', title: 'When does one negative edge hurt Dijkstra?', difficulty: 2,
      prompt: String.raw`Consider the version of Dijkstra that extracts each vertex once. Assume there are no negative cycles.

(a) Prove: if every negative-length edge **leaves the source** $s$, Dijkstra computes correct distances.

(b) Give a graph with exactly one negative edge, not leaving $s$, on which Dijkstra computes a wrong distance for some vertex, regardless of whether your implementation still updates $dist(v)$ for an already-extracted $v$. Trace the run.`,
      rubric: [
        '(a) Follows the standard proof: first wrongly extracted u, first unextracted y on a shortest path P',
        '(a) Uses that P is simple, so after its first edge no edge leaves s; y != s; so the suffix from y is nonnegative',
        '(b) Valid counterexample whose error propagates to a vertex AFTER the extracted one',
        '(b) Correct trace'
      ],
      hints: [
        'Where exactly does the standard proof use nonnegativity? Which edges lie on the part of the path after y?',
        'For (b), even if dist(a) is later corrected, a vertex reached from a was relaxed with the old value.'
      ],
      solution: String.raw`**(a)** Suppose some vertex is extracted with a wrong value, and let $u$ be the first. Take a shortest $s$-$u$ path $P$; with no negative cycles we may take $P$ simple. Let $y$ be the first vertex of $P$ not extracted before $u$, and $x$ its predecessor on $P$. Since $s$ is extracted first, $y \ne s$. As in the usual proof, $dist(x) = d^*(x)$ and the edge $x \to y$ was relaxed, so $dist(y) \le d^*(y)$. The part of $P$ after $y$ contains no edge out of $s$, because $P$ is simple and visits $s$ only at its start; hence all its edges are nonnegative and $d^*(y) \le d^*(u)$. Therefore $dist(y) \le d^*(y) \le d^*(u) < dist(u)$, contradicting that $u$ was extracted before $y$.

(Intuitively: after $s$ is extracted, every edge out of $s$ has been relaxed, and the rest of the run is ordinary Dijkstra with nonnegative lengths.)

**(b)** Edges $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$), $a \to c$ (1). True distances: $a = 1$ (via $b$), $b = 3$, $c = 2$.
Run: extract $s$: $a = 2$, $b = 3$. Extract $a$ (2): relax $a \to c$, $c = 3$. Then $b$ and $c$ are extracted (both have key 3, in either order). When $b$ is extracted, edge $b \to a$ gives $1 < 2$. An implementation that skips extracted vertices leaves $a = 2$ (wrong); one that still updates sets $a = 1$, but $a$'s out-edges are never relaxed again, so $c = 3$ is wrong either way (true value 2).`
    },
    {
      id: 'shortest-wall-breaking', type: 'written', title: 'Fewest walls to demolish', difficulty: 2,
      prompt: String.raw`An $n \times n$ grid has each cell either open or a wall. You start in open cell $s$ and want to reach open cell $t$, moving between edge-adjacent cells. You may demolish walls; walking into a wall cell requires demolishing it. (a) Describe an $O(n^2)$ algorithm computing the minimum number of walls that must be demolished. (b) Among all routes that demolish the minimum number of walls, find one with the fewest moves. Analyze both.`,
      rubric: [
        '(a) Vertices = cells; directed edge x -> y of length 1 if y is a wall, 0 if open',
        '(a) 0-1 BFS (deque) with justification, O(n^2); or Dijkstra O(n^2 log n) for partial credit',
        '(b) Lexicographic cost: length M * [y is wall] + 1 with M > max number of moves on a simple path (e.g. M = n^2)',
        '(b) Argues that comparing combined lengths compares (walls, moves) lexicographically; Dijkstra O(n^2 log n)'
      ],
      hints: [
        'Charge for entering a cell, not for leaving it.',
        'For (b), make one demolition cost more than any possible number of moves.'
      ],
      solution: String.raw`**(a) Graph.** One vertex per cell ($n^2$). For each pair of adjacent cells $x, y$, a directed edge $x \to y$ of length 1 if $y$ is a wall and 0 if $y$ is open (the cost is paid on entering $y$). The length of a walk is the number of times it enters a wall cell, which is at least the number of distinct walls it must demolish. Conversely, a route that demolishes a set $W$ of walls contains a simple path from $s$ to $t$ (shortcut repeated cells), which enters each cell at most once and so has length at most $|W|$. Hence $dist(t)$ equals the minimum number of demolitions.

**Algorithm.** All lengths are 0 or 1: run **0-1 BFS** from $s$. Keep a deque; when relaxing a 0-edge improves $dist(y)$, push $y$ to the front; for a 1-edge, push to the back. The deque always holds vertices with keys $d$ then $d + 1$ in order, so it behaves as Dijkstra's priority queue with $O(1)$ operations. Answer $dist(t)$. There are at most $4n^2$ edges, so $O(n^2)$ time.

**(b) Lexicographic lengths.** Let $M = n^2$, which exceeds the number of moves on any simple route. Give the edge $x \to y$ length $M \cdot [y \text{ is a wall}] + 1$. A route with $w$ demolitions and $m$ moves has length $Mw + m$. A shortest route has at most $n^2 - 1 < M$ moves, so among candidate optima comparing $Mw + m$ compares $w$ first and then $m$. Dijkstra (lengths positive) from $s$ gives the optimum; recover $w = \lfloor dist(t) / M \rfloor$ and $m = dist(t) \bmod M$. Time $O(n^2 \log n)$.

(Alternative for (b): run (a) to get $w^*$, then BFS in the product graph cells $\times \{0..w^*\}$, which costs $O(w^* n^2)$; the lexicographic trick avoids the factor $w^*$.)`
    },
    {
      id: 'shortest-train-schedule', type: 'written', title: 'Earliest arrival with train schedules', difficulty: 3,
      prompt: String.raw`A rail network is a directed graph $G = (V, E)$. On connection $e = u \to v$, trains depart from $u$ at times $0, p(e), 2p(e), 3p(e), \dots$ (with $p(e)$ a positive integer) and take $\tau(e) \ge 0$ minutes to reach $v$. You may wait at stations as long as you like. You are at station $s$ at time 0. Describe an algorithm that computes the earliest time you can arrive at every station, prove it correct, and analyze it.`,
      rubric: [
        'Defines the arrival function a_e(T) = p(e) * ceil(T / p(e)) + tau(e) and notes it is nondecreasing and >= T',
        'Dijkstra keyed by earliest arrival time, relaxing with a_e(arr(u))',
        'Correctness proof adapted from Dijkstra (uses monotonicity / FIFO: arriving earlier never hurts)',
        'Explains why a static graph with fixed edge lengths does not directly work, or why waiting is allowed matters',
        'O(E log V) time'
      ],
      hints: [
        'If you arrive at u at time T, when do you reach v using e? Write it as a function a_e(T).',
        'Is it ever bad to arrive at a station earlier? Use that to adapt the proof of Dijkstra.'
      ],
      solution: String.raw`**Arrival function.** If you are at $u$ at time $T$ and take connection $e = u \to v$, you board the first train at or after $T$, at time $p(e)\lceil T / p(e) \rceil$, and arrive at
$$a_e(T) = p(e)\left\lceil \frac{T}{p(e)} \right\rceil + \tau(e).$$
Two properties: $a_e(T) \ge T$ (time never goes backward), and $a_e$ is **nondecreasing** in $T$ (arriving at $u$ earlier never makes you arrive at $v$ later, because you could just wait). This "FIFO" property plays the role of nonnegative lengths.

**Algorithm.** Dijkstra with keys $arr(v)$: $arr(s) = 0$, others $\infty$. Repeatedly extract the unextracted station $u$ with the smallest $arr(u)$ and, for each connection $e = u \to v$, set $arr(v) \leftarrow \min(arr(v), a_e(arr(u)))$. Each relaxation is $O(1)$ arithmetic.

**Correctness.** Let $A^*(v)$ be the true earliest arrival time. Every $arr(v)$ is always the arrival time of some actual itinerary, so $arr(v) \ge A^*(v)$. Suppose $u$ is the first station extracted with $arr(u) > A^*(u)$. Take an itinerary $s = v_0 \to \dots \to v_k = u$ that reaches $u$ at time $A^*(u)$, let $T_i$ be its arrival time at $v_i$, and let $y = v_j$ be the first station on it not extracted before $u$, $x = v_{j-1}$. Then $x$ was extracted with $arr(x) = A^*(x) \le T_{j-1}$, so after relaxing $e = x \to y$,
$$arr(y) \le a_e(A^*(x)) \le a_e(T_{j-1}) \le T_j \le T_k = A^*(u) < arr(u),$$
using monotonicity of $a_e$ (and that the itinerary departs $x$ no earlier than $T_{j-1}$), and that arrival times along an itinerary are nondecreasing. So $y$ would have been extracted before $u$, a contradiction.

**Time.** $O(E \log V)$ with a binary heap.

*Remark.* Precomputing a single fixed length per edge is impossible because the waiting time depends on when you arrive; and if waiting were *forbidden*, arriving earlier could hurt (you might miss the only good connection), the FIFO property would fail, and this greedy algorithm would be incorrect.`
    },
    {
      id: 'shortest-apsp-update', type: 'written', title: 'Updating all-pairs distances', difficulty: 2,
      prompt: String.raw`You have already computed the all-pairs distance matrix $D$ of a directed graph $G$ with no negative cycles. A new edge $u \to v$ with length $w$ (possibly negative) is added. Describe an $O(V^2)$ algorithm that either reports that the new graph has a negative cycle or computes its distance matrix $D'$. Prove correctness.`,
      rubric: [
        'Negative cycle test: w + D(v,u) < 0',
        "Update rule D'(x,y) = min(D(x,y), D(x,u) + w + D(v,y))",
        'Proof that some shortest path uses the new edge at most once (removing a cycle through it does not increase the length)',
        'O(V^2) time'
      ],
      hints: ['Any new negative cycle must use the new edge. A shortest path in the new graph uses the new edge zero times or once.'],
      solution: String.raw`**Negative cycle.** $G$ had none, so any negative cycle in $G + (u \to v)$ uses the new edge; such a cycle is the edge plus a walk from $v$ to $u$ in $G$, of length at least $w + D(v,u)$. Conversely, the edge plus a shortest $v$-$u$ path in $G$ is a closed walk of length $w + D(v, u)$. So there is a negative cycle iff $w + D(v,u) < 0$ (with $D(v,u) = \infty$ meaning no). $O(1)$.

**Update.** Otherwise, for all $x, y$:
$$D'(x,y) = \min\big(D(x,y),\ D(x,u) + w + D(v,y)\big).$$
*Proof.* Each term is the length of a walk in the new graph, so the true new distance is at most the formula. For the other direction, take a shortest $x$-$y$ walk $P$ in the new graph that uses the new edge as few times as possible. If $P$ uses it twice or more, the part of $P$ between two consecutive uses, together with one use of the edge, is a closed walk through $u \to v$, of length $\ge w + D(v,u) \ge 0$; deleting it does not increase the length and reduces the number of uses, a contradiction. So $P$ uses the new edge at most once: if never, $\ell(P) \ge D(x,y)$; if once, $P$ is an $x$-$u$ walk in $G$, the edge, and a $v$-$y$ walk in $G$, so $\ell(P) \ge D(x,u) + w + D(v,y)$. Hence the true distance is at least the formula.

**Time.** $V^2$ pairs, $O(1)$ each: $O(V^2)$, far better than rerunning Floyd–Warshall ($O(V^3)$).`
    },
    {
      id: 'shortest-up-down-k', type: 'written', title: 'Mountain route with at most k direction changes', difficulty: 3,
      prompt: String.raw`A hiking map is an undirected graph $G = (V, E)$ with positive trail lengths, and each vertex $v$ has a distinct elevation $h(v)$; so every trail is uphill in one direction and downhill in the other. A route is a walk from $s$ to $t$; it *changes direction* whenever an uphill step is followed by a downhill step or vice versa. Given $k \ge 0$, describe and analyze an algorithm for the shortest route from $s$ to $t$ with **at most $k$ direction changes**. Use the fastest algorithm you can justify.`,
      rubric: [
        'States (v, j, d): at v, j changes so far, last step direction d in {up, down}',
        'Edges: continue in the same direction keeps j; switching direction increments j (only if j < k); lengths = trail lengths',
        'Start: super-source with edges to the states after the first step (either direction), handling s = t',
        'Observes the state graph is a DAG (j never decreases; within fixed (j, d), elevation strictly monotone) and gives a topological order',
        'DAG DP in O(k(V+E)); answer min over states at t',
        'Correctness: routes with <= k changes <-> walks in H'
      ],
      hints: [
        'Remember the number of changes so far and the direction of the last step.',
        'Before reaching for Dijkstra, ask whether the state graph can have a cycle. What happens to the elevation while j and the direction stay fixed?'
      ],
      solution: String.raw`**Vertices.** $(v, j, d)$ for $v \in V$, $0 \le j \le k$, $d \in \{\mathrm{up}, \mathrm{down}\}$: "at $v$, having changed direction $j$ times, and the last step was in direction $d$". Plus a start vertex $\sigma$ ("at $s$, no step taken yet"). That is $2(k+1)V + 1$ vertices.

**Edges.** For each trail $\{x, y\}$ with $h(x) < h(y)$ and length $\ell$ (so $x \to y$ is uphill and $y \to x$ downhill), and each $j$:
- $(x, j, \mathrm{up}) \to (y, j, \mathrm{up})$ and $(y, j, \mathrm{down}) \to (x, j, \mathrm{down})$, length $\ell$ (no change);
- if $j < k$: $(x, j, \mathrm{down}) \to (y, j+1, \mathrm{up})$ and $(y, j, \mathrm{up}) \to (x, j+1, \mathrm{down})$, length $\ell$ (a change);
- if $x = s$: $\sigma \to (y, 0, \mathrm{up})$; if $y = s$: $\sigma \to (x, 0, \mathrm{down})$, length $\ell$.

That is $O(k E)$ edges.

**It is a DAG.** Along every edge, either $j$ increases, or $j$ and $d$ stay the same and the elevation strictly increases (for up) or strictly decreases (for down). So the order: $\sigma$; then for $j = 0, 1, \dots, k$: the $(\cdot, j, \mathrm{up})$ vertices by increasing $h$, then the $(\cdot, j, \mathrm{down})$ vertices by decreasing $h$, is a topological order. (Edges between the up and down groups with the same $j$ do not exist.)

**Algorithm.** Sort vertices by elevation once ($O(V \log V)$), list $H$'s vertices in the order above, and run the DAG shortest-path DP from $\sigma$. Answer: 0 if $s = t$, else $\min_{j, d} dist((t, j, d))$.

**Correctness.** A route with at most $k$ changes, step by step, determines a walk in $H$ from $\sigma$ in which $j$ counts the changes so far; lengths agree. Conversely every walk in $H$ from $\sigma$ projects to a route whose number of changes equals the final $j \le k$.

**Time.** $O(V \log V + k(V + E))$. Using Dijkstra instead would give $O(kE \log(kV))$: correct but slower, and it would miss the point that the state graph is acyclic.`
    },
    {
      id: 'shortest-widest-then-short', type: 'written', title: 'Widest, then shortest', difficulty: 2,
      prompt: String.raw`An undirected network has, on each link $e$, a bandwidth $b(e) > 0$ and a latency $\ell(e) > 0$. The bandwidth of a path is the minimum bandwidth of its links. Describe and analyze an $O(E \log V)$ algorithm that finds, among all $s$-$t$ paths of **maximum bandwidth**, one of minimum total latency.`,
      rubric: [
        'Phase 1: compute the maximum bottleneck B* (binary search + reachability, or max-min Dijkstra, or maximum spanning tree)',
        'Phase 2: delete links with b(e) < B*; Dijkstra by latency from s',
        'Correctness: paths in the pruned graph are exactly the paths of bandwidth >= B* (= B*)',
        'O(E log V) total'
      ],
      hints: ['Solve the problem in two phases: first figure out what the best bandwidth is, then optimize latency subject to it.'],
      solution: String.raw`**Phase 1: best bandwidth.** Compute $B^*$, the maximum bottleneck of an $s$-$t$ path, e.g. by max-min Dijkstra ($O(E \log V)$), or by sorting the distinct bandwidths and binary searching for the largest $\beta$ such that $t$ is reachable from $s$ using only links with $b(e) \ge \beta$ ($O(E \log E) = O(E \log V)$). If $t$ is unreachable, report that.

**Phase 2: shortest among the widest.** Let $G^*$ keep only the links with $b(e) \ge B^*$. An $s$-$t$ path has bandwidth $\ge B^*$ iff all its links are in $G^*$, and no path has bandwidth $> B^*$, so the maximum-bandwidth paths are exactly the $s$-$t$ paths of $G^*$. Run Dijkstra on $G^*$ with lengths $\ell$ from $s$ and return the path to $t$.

**Time.** $O(E \log V)$ for each phase.

(Why not a single Dijkstra with a combined key? It can be done with pairs (bandwidth, latency) compared lexicographically, but you would then have to re-prove that Dijkstra works for this order; the two-phase approach uses only black boxes.)`
    },
    {
      id: 'shortest-meet-and-ride', type: 'written', title: 'Meet, then ride together', difficulty: 2,
      prompt: String.raw`Alice lives at vertex $a$ and Bob at vertex $b$ of a directed road network $G = (V, E)$ with travel times $\ell(e) \ge 0$. Their concert is at vertex $t$.

(a) Each drives their own car, both leaving home at time 0. They want to meet at some vertex $m$ as early as possible, that is, minimize the time at which the **later** of the two arrives at $m$. Describe an algorithm to choose $m$.

(b) Now they want to minimize **total fuel**: each drives alone to a meeting vertex $m$, then they continue together to $t$ in one car. Fuel is proportional to the total length driven by all cars. Describe an $O(E \log V)$ algorithm to choose $m$ (any vertex, including $a$, $b$ or $t$).

(c) What would running Dijkstra from every candidate meeting vertex cost, and why is it unnecessary?`,
      rubric: [
        'Three single-source computations: from a and from b in G, and from t in rev(G)',
        '(a) Minimize max(d_a(m), d_b(m)) over m, with the argument that each person should drive a shortest path to m',
        '(b) Minimize d_a(m) + d_b(m) + d_t(m) over m, with the argument that the three legs are independent once m is fixed',
        '(c) V runs cost O(VE log V); reversing the graph gives every dist(m, t) in one run',
        'Handles impossibility (no common reachable m, or t unreachable) and states O(E log V) total'
      ],
      hints: [
        'Once the meeting vertex m is fixed, the legs of the trip do not interact. What is the best way to drive each leg?',
        'How can a single Dijkstra give dist(m, t) for every m at once?'
      ],
      solution: String.raw`**Three distance arrays.** Run Dijkstra from $a$ in $G$ to get $d_a(v) = dist(a, v)$, from $b$ in $G$ to get $d_b(v)$, and from $t$ in the reversed graph $rev(G)$ (every edge $u \to v$ replaced by $v \to u$ with the same length) to get $d_t(v) = dist_{rev(G)}(t, v) = dist_G(v, t)$. The last identity holds because a walk $v \leadsto t$ in $G$, reversed, is a walk $t \leadsto v$ in $rev(G)$ of the same length, and vice versa. All lengths are nonnegative, so Dijkstra applies. Time $3 \cdot O(E \log V)$.

**(a)** For a fixed $m$, Alice cannot arrive before $d_a(m)$ and can arrive exactly then by driving a shortest path; likewise Bob. Their routes do not interact, so the earliest meeting time at $m$ is $\max(d_a(m), d_b(m))$. Scan all $m$ and return the minimizer, in $O(V)$ after the Dijkstra runs. If every $m$ has $\max = \infty$, no meeting is possible.

**(b)** For a fixed $m$, a plan consists of an $a \leadsto m$ walk, a $b \leadsto m$ walk and an $m \leadsto t$ walk, and its fuel is the sum of their lengths. The three choices are independent, so the best plan through $m$ costs
$$F(m) = d_a(m) + d_b(m) + d_t(m).$$
Return $\arg\min_m F(m)$ (report impossibility if all values are infinite). Note that $m = t$ (meet at the concert) and $m = a$ (Bob picks Alice up at home) are both allowed and included in the scan. Total time $O(E \log V + V) = O(E \log V)$ (assuming, as usual, $E \ge V - 1$ or ignoring isolated vertices).

**(c)** Computing $dist(m, t)$ by a separate Dijkstra from each $m$ costs $V \cdot O(E \log V) = O(VE \log V)$. The reversed graph gives all of these distances with one run. This "distances **to** a fixed target means one run on $rev(G)$" trick appears constantly on exams.`
    },
    {
      id: 'shortest-build-one-road', type: 'written', title: 'Which new road to build?', difficulty: 2,
      prompt: String.raw`A county's roads form a directed graph $G = (V, E)$ with lengths $\ell(e) \ge 0$. The county can afford to build **at most one** new one-way road, chosen from a list $F$ of candidates; candidate $f = (u, v)$ would be a road $u \to v$ of length $\lambda(f) \ge 0$. Describe an algorithm that chooses the candidate (or none) that minimizes the resulting distance from $s$ to $t$, prove it correct, and show that it runs in $O(E \log V + |F|)$ time.`,
      rubric: [
        'Computes d_s by Dijkstra from s in G and d_t by Dijkstra from t in rev(G)',
        'For each candidate (u, v): value d_s(u) + λ + d_t(v); compare the best value with d_s(t)',
        'Proof that a shortest walk in G + f uses f at most once (nonnegative lengths: take it simple), giving both inequalities',
        'Running time O(E log V + |F|), not one Dijkstra per candidate'
      ],
      hints: [
        'Running Dijkstra in G + f for every candidate f costs O(|F| E log V). Which two numbers about the endpoints of a candidate determine how useful it is?',
        'How many times can a shortest path use the new road?'
      ],
      solution: String.raw`**Algorithm.** Run Dijkstra from $s$ in $G$ to get $d_s(\cdot)$, and Dijkstra from $t$ in $rev(G)$ to get $d_t(x) = dist_G(x, t)$ for every $x$. For each candidate $f = (u, v)$ compute
$$val(f) = d_s(u) + \lambda(f) + d_t(v).$$
If $\min_f val(f) < d_s(t)$, build the minimizing candidate; otherwise build nothing (or anything: nothing helps). The new distance is $\min(d_s(t), \min_f val(f))$.

**Correctness.** Fix a candidate $f$ and let $G + f$ be the graph with the new road. We show $dist_{G+f}(s, t) = \min(d_s(t), val(f))$.

- ($\le$) The old shortest path is still available, and so is the walk "shortest $s \leadsto u$ in $G$, then $f$, then shortest $v \leadsto t$ in $G$", of length $val(f)$.
- ($\ge$) Let $P$ be a shortest $s$-$t$ walk in $G + f$. Since all lengths are nonnegative, deleting a closed subwalk never increases the length, so we may take $P$ to be a simple path; in particular it uses $f$ at most once. If it does not use $f$, it lies in $G$ and $\ell(P) \ge d_s(t)$. If it uses $f$ once, it splits into an $s \leadsto u$ walk in $G$, the road $f$, and a $v \leadsto t$ walk in $G$, so $\ell(P) \ge d_s(u) + \lambda(f) + d_t(v)$.

Taking the minimum over all candidates (and "none") gives the optimum.

**Time.** Two Dijkstra runs, $O(E \log V)$, plus $O(1)$ per candidate: $O(E \log V + |F|)$.

*Remark.* The same argument breaks if lengths may be negative and $G + f$ has a negative cycle through $f$; then the "simple path" step fails. With nonnegative lengths there is no such issue.`
    },
    {
      id: 'shortest-one-negative-edge', type: 'written', title: 'Exactly one negative edge', difficulty: 2,
      prompt: String.raw`In the directed graph $G = (V, E)$ every edge has a nonnegative length **except one edge** $x \to y$ with $\ell(x \to y) < 0$.

(a) Describe an $O(E \log V)$-time algorithm that decides whether $G$ has a negative cycle.

(b) If it has none, compute $dist(s, v)$ for every vertex $v$ in $O(E \log V)$ time. Prove your formula correct.

(c) Why is running Dijkstra directly on $G$ not good enough, and why is Bellman–Ford not the best answer?`,
      rubric: [
        "Works in G' = G − (x→y), where all lengths are nonnegative, so Dijkstra applies",
        "(a) Negative cycle iff ℓ(x→y) + δ(y, x) < 0, with proof that every negative cycle uses the negative edge",
        "(b) Dijkstra in G' from s and from y; dist(v) = min(δ(s,v), δ(s,x) + ℓ(x→y) + δ(y,v))",
        '(b) Proof: with no negative cycle some shortest walk is a simple path, which uses x→y at most once',
        '(c) Concrete reason Dijkstra on G fails; Bellman–Ford is correct but O(VE) versus O(E log V)'
      ],
      hints: [
        'Delete the negative edge. Then every remaining length is nonnegative.',
        'Without negative cycles, a shortest walk can be taken to be a simple path. How often can a simple path use one particular edge?'
      ],
      solution: String.raw`Let $G' = G - (x \to y)$; all its lengths are nonnegative. Write $\delta(p, q)$ for distances in $G'$; each single-source computation in $G'$ is one Dijkstra run, $O(E \log V)$.

**(a) Negative cycles.** Every edge other than $x \to y$ is nonnegative, so every cycle of negative length uses $x \to y$. A simple cycle through $x \to y$ is the edge followed by a $y \leadsto x$ path in $G'$, so the cheapest one has length $\ell(x\to y) + \delta(y, x)$ (and any negative closed walk contains a negative simple cycle). Hence: run Dijkstra from $y$ in $G'$; $G$ has a negative cycle iff $\ell(x \to y) + \delta(y, x) < 0$ (if $\delta(y,x) = \infty$, no cycle uses the edge at all).

**(b) Distances.** Run Dijkstra in $G'$ from $s$ (giving $\delta(s, \cdot)$) and from $y$ (giving $\delta(y, \cdot)$, already computed in (a)). Output
$$dist(s, v) = \min\big(\delta(s, v),\ \delta(s, x) + \ell(x \to y) + \delta(y, v)\big),$$
with $\infty$ arithmetic as usual.

*Proof.* ($\le$) Both terms are lengths of genuine walks in $G$ (a walk in $G'$; or a walk to $x$, the negative edge, a walk from $y$ to $v$). ($\ge$) Since there is no negative cycle, deleting any closed subwalk from a walk does not increase its length, so some shortest $s \leadsto v$ walk $P$ is a simple path, and it uses the edge $x \to y$ at most once. If it never uses it, $P$ lies in $G'$ and $\ell(P) \ge \delta(s, v)$. If it uses it once, $P$ is an $s \leadsto x$ path in $G'$, the edge, and a $y \leadsto v$ path in $G'$, so $\ell(P) \ge \delta(s,x) + \ell(x\to y) + \delta(y,v)$.

**Time.** Two Dijkstra runs and an $O(V)$ combination: $O(E \log V)$.

**(c)** Plain Dijkstra on $G$ can finalize a vertex before discovering a cheaper route through the negative edge: with $s \to a$ (2), $s \to b$ (3), $b \to a$ ($-2$), it extracts $a$ with key 2 although $dist(a) = 1$. Bellman–Ford is correct but takes $O(VE)$; exploiting the structure ("only one edge is negative") gives $O(E \log V)$. The same idea extends to $k$ negative edges with $k + 1$ Dijkstra runs and a small DP over the order in which negative edges are used.`
    },
    {
      id: 'shortest-even-walk', type: 'written', title: 'Walks with an even number of edges', difficulty: 2,
      prompt: String.raw`$G = (V, E)$ is a directed graph with nonnegative edge lengths, and $s, t \in V$.

(a) Describe and analyze an algorithm for the length of the shortest walk from $s$ to $t$ that uses an **even** number of edges.

(b) Generalize: for given integers $q \ge 2$ and $0 \le r < q$, find the shortest walk whose number of edges is congruent to $r$ modulo $q$.

(c) A classmate claims: "the answer to (a) is the shortest path if it has an even number of edges, and otherwise no even walk exists." Refute this with a concrete example, and give a second example in which the optimal even walk must repeat a vertex.`,
      rubric: [
        'States (v, p) with p the parity of the number of edges used so far',
        'Each edge u→v of length ℓ gives (u,0)→(v,1) and (u,1)→(v,0) with length ℓ; source (s,0), target (t,0)',
        'Dijkstra justified by nonnegative lengths; 2V vertices, 2E edges, O(E log V)',
        '(b) Counter modulo q: qV vertices, qE edges, O(qE log(qV)), answer dist(t, r)',
        '(c) Two concrete counterexamples'
      ],
      hints: [
        'What single bit of information about the walk so far do you need to remember?',
        'For (c), make the shortest path a single edge, and give the graph an odd cycle somewhere.'
      ],
      solution: String.raw`**(a) Graph.** $H$ has vertices $(v, p)$ for $v \in V$ and $p \in \{0, 1\}$, meaning "at $v$, having used a number of edges with parity $p$". For each edge $u \to v$ of length $\ell$, $H$ has edges $(u, 0) \to (v, 1)$ and $(u, 1) \to (v, 0)$, both of length $\ell$.

*Correctness.* Every walk $s = v_0, v_1, \dots, v_k$ in $G$ corresponds to the walk $(v_0, 0), (v_1, 1), (v_2, 0), \dots, (v_k, k \bmod 2)$ in $H$ of the same length, and every walk in $H$ from $(s, 0)$ projects to a walk in $G$ whose parity is recorded in the second coordinate. So even walks from $s$ to $t$ correspond exactly to walks from $(s, 0)$ to $(t, 0)$.

*Algorithm.* Lengths are nonnegative, so run Dijkstra in $H$ from $(s, 0)$ and return $dist((t, 0))$ ($\infty$ if no even walk exists; 0 if $s = t$, the empty walk).

*Time.* $|V(H)| = 2V$, $|E(H)| = 2E$: $O(E \log V)$.

**(b)** Use vertices $(v, i)$ with $i \in \{0, \dots, q-1\}$ and edges $(u, i) \to (v, (i + 1) \bmod q)$ of length $\ell(u \to v)$. Dijkstra from $(s, 0)$; answer $dist((t, r))$. Size $qV$ vertices and $qE$ edges, time $O(qE \log(qV))$.

**(c)** *First example:* edges $s \to t$ (1), $s \to a$ (5), $a \to t$ (5). The shortest path $s \to t$ has one edge, yet the even walk $s \to a \to t$ of length 10 exists. *Second example:* edges $s \to t$ (1), $t \to x$ (1), $x \to y$ (1), $y \to t$ (1), and nothing else. Every $s \leadsto t$ walk starts with $s \to t$ and then goes around the triangle $t, x, y$ some number of times, so it has $1 + 3j$ edges; the shortest even one is $s \to t \to x \to y \to t$ (4 edges, length 4), which visits $t$ twice. This is why the problem asks for a *walk* and why the product graph (which allows revisiting $t$ with a different parity) is the right tool.`
    },
    {
      id: 'shortest-flood-escape', type: 'written', title: 'Escaping a flood', difficulty: 3,
      prompt: String.raw`A storm is flooding a city, modeled as a directed graph $G = (V, E)$ with travel times $\ell(e) > 0$. Intersection $v$ becomes impassable at time $f(v) \in (0, \infty]$: you may be at $v$ only at times $T < f(v)$. (Only arrival times at intersections matter; roads themselves stay open.) You are at $s$ at time 0, with $f(s) > 0$, and want to reach the shelter $t$.

(a) Describe an $O(E \log V)$ algorithm that computes the earliest time you can reach $t$, or reports that it is impossible.

(b) Prove your algorithm correct.

(c) Suppose you are also allowed to wait at an intersection (as long as it is not flooded while you are there). Can waiting ever help? Justify.`,
      rubric: [
        'Feasibility: a walk is valid iff its arrival time T_i at each vertex v_i satisfies T_i < f(v_i)',
        'Algorithm: Dijkstra that relaxes u→v only when dist(u) + ℓ(u→v) < f(v); answer dist(t)',
        'Invariant: every finite dist(v) is the arrival time of some valid walk',
        'Proof (first wrongly-extracted vertex, or induction) that extracted values are the earliest valid arrival times, using that arriving earlier never hurts',
        '(c) Waiting never helps: removing waits only makes later arrival times earlier, and every constraint is an upper bound',
        'Running time O(E log V)'
      ],
      hints: [
        'Is it ever bad to arrive at an intersection earlier? Use that to argue that only the earliest arrival time at each intersection matters.',
        'Run Dijkstra, but refuse to relax an edge into v when the arrival time would be too late for v. Then redo the usual proof.'
      ],
      solution: String.raw`**Model.** A walk $s = v_0 \to v_1 \to \dots \to v_k$ without waiting arrives at $v_i$ at time $T_i = \sum_{j \le i} \ell(v_{j-1} \to v_j)$. It is **valid** iff $T_i < f(v_i)$ for every $i$. Let $A(v)$ be the earliest arrival time over all valid walks to $v$ ($\infty$ if none). A static graph with fixed edge lengths cannot capture validity directly (whether you may enter $v$ depends on *when*), but the key observation is monotonicity: **if a valid walk reaches $u$ at time $T$, then any valid walk reaching $u$ at a time $T' \le T$ can replace its prefix**, because all later arrival times only decrease and every constraint is of the form "arrival $< f$".

**(a) Algorithm.** Dijkstra with a pruning rule: $dist(s) = 0$, all others $\infty$; repeatedly extract the unextracted vertex $u$ with minimum finite $dist(u)$; for each edge $u \to v$, if $dist(u) + \ell(u \to v) < f(v)$ and $dist(u) + \ell(u \to v) < dist(v)$, set $dist(v) \leftarrow dist(u) + \ell(u \to v)$. Report $dist(t)$, or "impossible" if it stays $\infty$. Time $O(E \log V)$ with a binary heap.

**(b) Correctness.** *Invariant:* every finite $dist(v)$ is the arrival time of a valid walk. Initially true for $s$ ($0 < f(s)$). A relaxation extends a valid walk to $u$ arriving at $dist(u)$ by the edge $u \to v$, and the rule guarantees the new arrival is $< f(v)$, so the extended walk is valid. Hence $dist(v) \ge A(v)$ always.

*Claim:* when $u$ is extracted, $dist(u) = A(u)$. Suppose not, and let $u$ be the first extracted vertex with $dist(u) > A(u)$; so $A(u) < \infty$. Take a valid walk $s = v_0, \dots, v_k = u$ arriving at times $T_0 < T_1 < \dots < T_k = A(u)$ (strictly increasing, since lengths are positive). Let $v_j$ be the first vertex on it not extracted before $u$ ($j \ge 1$ because $s$ is extracted first), and $x = v_{j-1}$. Then $x$ was extracted earlier, so $dist(x) = A(x) \le T_{j-1}$. When $x$ was extracted, the edge $x \to v_j$ was examined, and
$$dist(x) + \ell(x \to v_j) \le T_{j-1} + \ell(x \to v_j) = T_j < f(v_j),$$
so the pruning rule allowed the relaxation and $dist(v_j) \le T_j$. If $v_j = u$, this already says $dist(u) \le T_k = A(u)$, a contradiction. Otherwise $dist(v_j) \le T_j < T_k = A(u) < dist(u)$, so $v_j$ had a smaller key than $u$ and would have been extracted first, again a contradiction. Vertices never extracted have $dist = \infty$, and by the same argument $A = \infty$ for them. So $dist(t) = A(t)$.

**(c) Waiting never helps.** Take any valid plan with waits and delete all the waiting. Every subsequent arrival time weakly decreases, and every constraint ("present at $v$ only before $f(v)$") is an upper bound on times, so the plan stays valid and reaches $t$ no later. Hence the answer is unchanged. (Contrast with the train-schedule problem, where waiting is essential because trains leave at fixed times.)

*Why not "run plain Dijkstra, then delete vertices that are reached too late"?* Removing a vertex can force detours that make *other* vertices late too, and the plain Dijkstra distances already used routes through forbidden vertices. The pruning has to happen inside the search, exactly as above.`
    },
    {
      id: 'shortest-dag-code', type: 'code', title: 'Shortest paths in a DAG with negative edges', difficulty: 2,
      prompt: String.raw`Write <code>dagShortest(n, edges, s)</code>. The graph is a **directed acyclic graph** on vertices <code>0..n-1</code> with edges <code>[u, v, w]</code> meaning $u \to v$ of integer length $w$, which **may be negative**; parallel edges may appear. Return the array of shortest-path distances from <code>s</code>, using <code>null</code> for vertices not reachable from <code>s</code>. Aim for $O(V + E)$ time (no Dijkstra, no Bellman–Ford).`,
      fn: 'dagShortest',
      starter: 'function dagShortest(n, edges, s) {\n  // 1. topological order (e.g. Kahn\'s algorithm)\n  // 2. relax out-edges of each vertex in that order\n}\n',
      reference: function (n, edges, s) {
        const indeg = new Array(n).fill(0);
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v, w] of edges) { adj[u].push([v, w]); indeg[v]++; }
        const order = [];
        const stack = [];
        for (let v = 0; v < n; v++) if (indeg[v] === 0) stack.push(v);
        while (stack.length) {
          const u = stack.pop();
          order.push(u);
          for (const [v] of adj[u]) { indeg[v]--; if (indeg[v] === 0) stack.push(v); }
        }
        const dist = new Array(n).fill(Infinity);
        dist[s] = 0;
        for (const u of order) {
          if (dist[u] === Infinity) continue;
          for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
        }
        return dist.map(d => (d === Infinity ? null : d));
      },
      tests: [
        [1, [], 0],
        [3, [[0, 1, 2], [0, 2, 3], [2, 1, -2]], 0],
        [4, [[0, 1, 5], [1, 2, -10], [0, 2, 1], [2, 3, 4]], 0],
        [4, [[1, 0, -3], [0, 2, 1], [1, 2, 7]], 0],
        [5, [[3, 1, -1], [3, 0, 4], [1, 0, -2], [0, 4, -5], [1, 4, 3], [2, 4, 1]], 3],
        [3, [[0, 1, 4], [0, 1, -4], [1, 2, 0]], 0],
        [6, [[0, 1, -1], [0, 2, -2], [1, 3, -3], [2, 3, 1], [3, 4, -4], [2, 5, 10], [4, 5, -10]], 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const perm = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp; }
        const m = Math.floor(Math.random() * 2.5 * n);
        const edges = [];
        for (let k = 0; k < m && n > 1; k++) {
          let a = Math.floor(Math.random() * n), b = Math.floor(Math.random() * n);
          if (a === b) continue;
          if (a > b) { const tmp = a; a = b; b = tmp; }
          edges.push([perm[a], perm[b], Math.floor(Math.random() * 21) - 10]);
        }
        return [n, edges, Math.floor(Math.random() * n)];
      },
      hints: [
        "Compute a topological order first: repeatedly remove a vertex of in-degree 0 (Kahn's algorithm).",
        'Process vertices in that order; when you reach u, dist[u] is final because all its in-neighbors come earlier. Skip u if it is unreachable.'
      ],
      solution: String.raw`**Topological order.** Compute in-degrees and repeatedly remove a vertex of in-degree 0 (Kahn's algorithm), $O(V + E)$; since the graph is acyclic this lists every vertex.

**Relaxation in order.** Set $dist(s) = 0$, others $\infty$. For each $u$ in topological order with $dist(u) < \infty$, relax every edge $u \to v$: $dist(v) \leftarrow \min(dist(v), dist(u) + w)$.

**Why it is correct (any signs).** By induction along the order: when $u$ is processed, every in-neighbor of $u$ was processed earlier with its final distance, and each in-edge was relaxed, so $dist(u) = \min_{p \to u} \big(dist(p) + \ell(p \to u)\big)$, which is the true distance (the last edge of a shortest path comes from some in-neighbor). Negative lengths are harmless because a DAG has no cycles, so no "future" improvement can come back to $u$. Vertices before $s$ in the order are unreachable and stay $\infty$.

**Time.** $O(V + E)$. Dijkstra would be wrong here (negative edges), and Bellman–Ford would be correct but $O(VE)$.`
    },
    {
      id: 'shortest-checkpoint-code', type: 'code', title: 'Shortest walk through a checkpoint', difficulty: 2,
      prompt: String.raw`Write <code>viaCheckpoint(n, edges, s, t, marked)</code>. The graph is directed on vertices <code>0..n-1</code> with edges <code>[u, v, w]</code>, $w \ge 0$ an integer. <code>marked</code> is an array of vertex ids (the cafés). Return the minimum length of a walk from <code>s</code> to <code>t</code> that **visits at least one marked vertex** (the endpoints $s$ and $t$ count if they are marked), or <code>-1</code> if no such walk exists. Use the two-layer graph idea: one Dijkstra, no "for each café" loop.`,
      fn: 'viaCheckpoint',
      starter: 'function viaCheckpoint(n, edges, s, t, marked) {\n  // states (v, b): b = 1 once a marked vertex has been visited\n}\n',
      reference: function (n, edges, s, t, marked) {
        const isM = new Array(n).fill(false);
        for (const x of marked) isM[x] = true;
        const N = 2 * n;
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v, w] of edges) adj[u].push([v, w]);
        const dist = new Array(N).fill(Infinity);
        const done = new Array(N).fill(false);
        dist[isM[s] ? n + s : s] = 0;
        for (let it = 0; it < N; it++) {
          let x = -1;
          for (let y = 0; y < N; y++) if (!done[y] && dist[y] < Infinity && (x === -1 || dist[y] < dist[x])) x = y;
          if (x === -1) break;
          done[x] = true;
          const layer = x >= n ? 1 : 0;
          const u = x % n;
          for (const [v, w] of adj[u]) {
            const y = (layer === 1 || isM[v]) ? n + v : v;
            if (dist[x] + w < dist[y]) dist[y] = dist[x] + w;
          }
        }
        return dist[n + t] === Infinity ? -1 : dist[n + t];
      },
      tests: [
        [1, [], 0, 0, []],
        [1, [], 0, 0, [0]],
        [3, [[0, 2, 1], [0, 1, 5], [1, 2, 5]], 0, 2, [1]],
        [3, [[0, 2, 1], [0, 1, 5], [1, 2, 5]], 0, 2, [2]],
        [4, [[0, 1, 1], [1, 2, 1], [2, 1, 1], [1, 3, 1]], 0, 3, [2]],
        [4, [[0, 1, 2], [1, 3, 2], [0, 2, 1], [2, 3, 9]], 0, 3, [1, 2]],
        [3, [[0, 1, 3], [1, 2, 3]], 0, 2, []],
        [3, [[0, 1, 3]], 0, 1, [2]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const m = Math.floor(Math.random() * 3 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 10)]);
        const marked = [];
        for (let v = 0; v < n; v++) if (Math.random() < 0.3) marked.push(v);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n), marked];
      },
      hints: [
        'Make two copies of the graph: layer 0 = "no café yet", layer 1 = "already visited a café". Edges stay in their layer, except that entering a café from layer 0 lands in layer 1.',
        'Start at (s, 1) if s itself is a café, else at (s, 0). The answer is dist of (t, 1).'
      ],
      solution: String.raw`**Graph.** $H$ has vertices $(v, b)$ with $b \in \{0, 1\}$: "at $v$; $b = 1$ iff some marked vertex has been visited". For each edge $u \to v$ of length $w$: $(u, 1) \to (v, 1)$ with length $w$; and $(u, 0) \to (v, 0)$ if $v$ is unmarked, or $(u, 0) \to (v, 1)$ if $v$ is marked, with length $w$. The start is $(s, 1)$ if $s$ is marked and $(s, 0)$ otherwise; the target is $(t, 1)$.

**Correctness.** Along any walk in $G$ the bit "visited a marked vertex yet" is determined, and the edges of $H$ update it exactly; so walks of $G$ from $s$ visiting a marked vertex and ending at $t$ correspond to walks in $H$ from the start to $(t, 1)$ with the same length.

**Algorithm and time.** Lengths are nonnegative: Dijkstra on $H$, which has $2V$ vertices and $2E$ edges, $O(E \log V)$. (The reference uses an array-based Dijkstra, $O(V^2)$, fine for small inputs.)

**Alternative.** $\min_{m \text{ marked}} dist(s, m) + dist(m, t)$ using Dijkstra from $s$ in $G$ and from $t$ in $rev(G)$: also $O(E \log V)$, and a good way to cross-check. The layered version generalizes better (e.g., to "visit a café, then a gas station, in that order").`
    },
    {
      id: 'shortest-mock2-metro', type: 'written', title: 'Metro trip with line changes', difficulty: 3,
      tags: ['mt2-mock-2', 'modeling', 'product graph', 'Dijkstra'],
      prompt: String.raw`A city's metro has a set $V$ of stations and $m$ lines. Line $i$ is a one-way route visiting distinct stations $v_{i,0}, v_{i,1}, \dots, v_{i,n_i}$ in this order; riding line $i$ from $v_{i,j}$ to $v_{i,j+1}$ takes $\tau_{i,j} > 0$ minutes. Several lines may share a station. Getting off one train and boarding another at the same station (a **transfer**) takes $c > 0$ minutes. Boarding your first train at the start and leaving your last train at the destination are free. Ignore waiting for trains. Let $N = \sum_i (n_i + 1)$ be the total number of (line, station) stops, and assume every station is on at least one line (so $|V| \le N$). You are at station $s$ and want to reach station $t \ne s$.

(a) **[4 points]** Describe and analyze an algorithm that computes the minimum travel time from $s$ to $t$. Describe your graph precisely.

(b) **[3 points]** Your ticket allows **at most $k$ transfers**. Modify your solution to compute the minimum travel time under this rule.

(c) **[3 points]** You hate transfers. Among all trips that use the **fewest possible** number of transfers, find the minimum travel time, in $O(N \log N)$ time.`,
      rubric: [
        '(2 pts) (a) Vertices encode which line you are on (stop vertices (i, j)), plus a mechanism for transfers (station/platform vertices), with every edge type and its length listed',
        '(1 pt) (a) Start and end handled (first boarding and final exit free; transfer costs c exactly once) and Dijkstra justified by nonnegative lengths',
        '(1 pt) (a) Size O(N) vertices and edges, time O(N log N); avoids, or correctly analyzes, the Θ(N^2) edges of "all pairs of lines at a station"',
        '(2 pts) (b) Layered graph with a transfer counter 0..k; only transfers move up a layer; answer is the minimum over layers (or a super-target)',
        '(1 pt) (b) Size O(kN) and time O(kN log(kN))',
        '(2 pts) (c) Lexicographic (transfers, time) weights or big-M scalarization, with a reason Dijkstra remains correct',
        '(1 pt) (c) O(N log N) analysis (running (b) for increasing k is correct but slower)'
      ],
      hints: [
        'A station alone is not enough as a vertex: you need to know which train you are on, since staying on it is free and switching costs c.',
        'Use a "platform" vertex per station: getting off costs c, getting on costs 0. For (b), add a transfer counter; for (c), compare (transfers, time) pairs.'
      ],
      solution: String.raw`**(a) The graph $H$.**

*Vertices.*
- A **stop vertex** $(i, j)$ for each line $i$ and $0 \le j \le n_i$: "on a train of line $i$, standing at its $j$-th station $v_{i,j}$". There are $N$ of them.
- A **platform vertex** $\hat x$ for each station $x$: "in station $x$, not on any train".
- A target vertex $t^*$.

*Edges.*
- **Ride:** $(i, j) \to (i, j+1)$ with length $\tau_{i,j}$.
- **Get off (to transfer):** $(i, j) \to \hat x$ with length $c$, where $x = v_{i,j}$.
- **Board:** $\hat x \to (i, j)$ with length 0, for every stop $(i, j)$ with $v_{i,j} = x$.
- **Arrive:** $(i, j) \to t^*$ with length 0, for every stop with $v_{i,j} = t$.

Source: $\hat s$. Answer: $dist(\hat s, t^*)$, or "unreachable".

*Correctness.* A trip boards some line at $s$, rides, makes some number $q$ of transfers (each = get off + board at the same station), rides again, and finally gets off at $t$. It corresponds to the walk $\hat s \to$ board $\to$ rides $\to$ (get off $\to$ board) $q$ times $\to$ rides $\to t^*$, whose length is the total riding time plus $qc$, which is exactly the trip's duration (the first boarding and the final arrive edge are free, as required). Conversely, every walk from $\hat s$ to $t^*$ alternates in this way and describes a trip of the same duration. (Getting off and re-boarding the same line costs $c$ and gains nothing, so it never appears in an optimal walk, but allowing it does no harm.)

*Algorithm.* All lengths are nonnegative, so run Dijkstra from $\hat s$.

*Time.* $|V(H)| = N + |V| + 1 = O(N)$. Edges: at most $N$ ride, $N$ get-off, $N$ board and $N$ arrive edges, so $O(N)$. Dijkstra: $O(N \log N)$.

*Note.* Joining every pair of stops at the same station directly with a transfer edge of length $c$ is also correct, but it creates $\sum_x deg(x)^2$ edges, which can be $\Theta(N^2)$ when one hub is on many lines; if you do that, the running time must say so. The platform vertex avoids the blowup.

**(b) At most $k$ transfers.** Add a counter $q \in \{0, \dots, k\}$ = number of transfers so far.
- Vertices: $(i, j, q)$ and $(\hat x, q)$ for $0 \le q \le k$, plus a start vertex $\sigma$ and $t^*$.
- $\sigma \to (i, j, 0)$ with length 0 for each stop at $s$ (the first boarding is not a transfer).
- Ride: $(i, j, q) \to (i, j+1, q)$, length $\tau_{i,j}$.
- Get off: $(i, j, q) \to (\hat x, q)$, length $c$, only for $q < k$ (a transfer must follow).
- Board after a transfer: $(\hat x, q) \to (i', j', q + 1)$, length 0, for stops at $x$.
- Arrive: $(i, j, q) \to t^*$, length 0, for stops at $t$, any $q$.

Walks from $\sigma$ to $t^*$ correspond to trips with at most $k$ transfers, with $q$ counting them, at equal cost. Dijkstra from $\sigma$; answer $dist(t^*)$. Size: $O(k(N + |V|)) = O(kN)$ vertices and $O(kN)$ edges, so $O(kN \log(kN))$. (Optional refinement: a shortest walk in the graph of (a) is a simple path and so has at most $N$ transfers, hence one may assume $k \le N$.)

**(c) Fewest transfers, then fastest.** Use the graph of (a), but give each edge a **pair** weight: get-off edges $(1, c)$, ride edges $(0, \tau_{i,j})$, board and arrive edges $(0, 0)$. Path weights add componentwise and are compared **lexicographically**: first the number of transfers, then the time. Dijkstra remains correct with these weights because its proof uses only that weights come from a totally ordered set with an addition that respects the order, and that every edge weight is $\ge (0, 0)$, so extending a path never makes it lexicographically smaller (the analogue of nonnegative lengths). The result is $(q^*, T^*)$: the minimum number of transfers and the fastest time among such trips. Time $O(N \log N)$.

Equivalent scalar version: let $M = 1 + \sum_{i,j} \tau_{i,j} + cN$, which exceeds the duration of any trip corresponding to a simple path in $H$, and give get-off edges length $M + c$. A trip with $q$ transfers and duration $T$ then costs $qM + T$, and since $T < M$ for the optimal candidates, comparing $qM + T$ compares $q$ first and then $T$.

(Partial credit: find $q^*$ with 0-1 BFS (get-off edges weight 1, others 0), then run (b) with $k = q^*$. That is correct, but costs $O(q^* N \log N)$, which can be $\Theta(N^2 \log N)$.)`
    },
    {
      id: 'shortest-mock3-courier', type: 'written', title: 'Courier with paid deliveries', difficulty: 3,
      tags: ['mt2-mock-3', 'negative edges', 'layered graph', 'DAG', 'Bellman–Ford'],
      prompt: String.raw`A courier drives on a directed road network $G = (V, E)$, starting at the depot $s$ and ending her shift at home $t$. Driving road $e$ takes $\tau(e)$ hours, a **positive integer**. Some roads are **job roads** $J \subseteq E$: driving one delivers a package. Each road has a net cost $c(e)$ (fuel minus pay): for $e \notin J$, $c(e) \ge 0$; for $e \in J$, $c(e)$ is an arbitrary integer, often negative. She may drive any road many times, and each traversal of a job road is paid again. She wants an $s$-to-$t$ walk of minimum total net cost.

(a) **[3 points]** Assume $G$ has no negative cycle. Give an algorithm and its running time. In one sentence each, explain why Dijkstra's algorithm, and "add a large constant to every cost, then run Dijkstra", are not correct here.

(b) **[4 points]** Now $G$ may contain negative cycles, but the shift lasts at most $H$ hours: the walk's total driving time must be at most $H$, a positive integer given as part of the input. Compute the minimum net cost. Give the running time in terms of $V$, $E$ and $H$.

(c) **[3 points]** There is no time limit now, and $G$ may contain negative cycles, but the company allows **at most $k$ job-road traversals** per shift. Compute the minimum net cost in $O(kE \log V)$ time.`,
      rubric: [
        '(1 pt) (a) Bellman–Ford from s, answer dist(t), O(VE)',
        '(2 pts) (a) Dijkstra can finalize a vertex before a negative road reveals a cheaper route; adding a constant penalizes walks by their number of edges, which changes the optimum',
        '(2 pts) (b) Vertices (v, h), 0 ≤ h ≤ H; edges (u, h) → (v, h + τ(e)) of length c(e) when h + τ(e) ≤ H; source (s, 0); answer min over h of dist(t, h)',
        '(2 pts) (b) The graph is a DAG because h strictly increases (τ ≥ 1); topological-order DP (by increasing h) handles negative costs; O(H(V + E)), pseudo-polynomial in H',
        '(1 pt) (c) Layered graph (v, j), 0 ≤ j ≤ k: non-job roads stay in a layer, job roads go up one layer',
        '(1 pt) (c) No negative cycle in the layered graph: a cycle cannot use a job road, so it stays in one layer and uses only nonnegative roads',
        '(1 pt) (c) Layer-by-layer multi-source Dijkstra with justification, O(kE log V) (Bellman–Ford on the layered graph is correct but O(k^2 VE) and does not earn this point)'
      ],
      hints: [
        '(b) Put the clock into the state. What happens to the clock along every edge, and what does that imply about cycles?',
        '(c) Where could a negative cycle of the layered graph live? Within one layer, which roads remain, and what are their costs?'
      ],
      solution: String.raw`**(a) No negative cycles.** Run **Bellman–Ford** from $s$ with lengths $c(e)$ and return $dist(t)$ ($\infty$ if unreachable): $O(VE)$. It is correct for arbitrary lengths when no negative cycle is reachable.

- *Dijkstra fails:* once a vertex is extracted its value is frozen, but a negative job road discovered later can make it cheaper; e.g. $s \to a$ (cost 2), $s \to b$ (3), job road $b \to a$ ($-2$): Dijkstra fixes $a$ at 2, the truth is 1.
- *Adding a constant fails:* a walk with $q$ roads gains $qC$, so walks with more roads are penalized more and the optimum can change; e.g. $s \to t$ (cost 0) versus $s \to a \to t$ (costs $1, -2$, total $-1$): after adding 2, the direct road costs 2 and the two-road walk costs 3.

**(b) Shift of at most $H$ hours.**

*Vertices.* $(v, h)$ for $v \in V$ and $0 \le h \le H$: "at $v$, having driven exactly $h$ hours".

*Edges.* For each road $e = u \to v$ and each $h$ with $h + \tau(e) \le H$: $(u, h) \to (v, h + \tau(e))$ with length $c(e)$.

*Source and answer.* $(s, 0)$; answer $\min_{0 \le h \le H} dist((t, h))$.

*Correctness.* An $s$-$t$ walk with total driving time at most $H$ corresponds to a path in this graph from $(s, 0)$ (the second coordinate is the running total of driving time), with the same total cost, and conversely.

*Algorithm.* Since $\tau(e) \ge 1$, the second coordinate strictly increases along every edge, so the graph is a **DAG** and ordering vertices by $h$ is a topological order. Negative costs (and negative cycles of $G$) are therefore harmless. DP: $D(s, 0) = 0$, $D(v, 0) = \infty$ for $v \ne s$, and for $h = 1, \dots, H$:
$$D(v, h) = \min_{e = u \to v,\ \tau(e) \le h} D(u, h - \tau(e)) + c(e).$$

*Time.* $V(H+1)$ vertices and at most $E(H+1)$ edges: $O(H(V + E))$. This is pseudo-polynomial: polynomial in the value $H$, not in its number of bits.

**(c) At most $k$ job roads.**

*Vertices.* $(v, j)$ for $0 \le j \le k$: "at $v$, having driven $j$ job roads".

*Edges.* Non-job road $u \to v$: $(u, j) \to (v, j)$ with length $c \ge 0$, for every $j$. Job road $u \to v$: $(u, j) \to (v, j + 1)$ with length $c$ (any sign), for $j < k$.

*Source and answer.* $(s, 0)$; answer $\min_j dist((t, j))$. Walks with at most $k$ job-road traversals correspond to walks in this graph, at the same cost.

*No negative cycles.* Job edges strictly increase $j$, so a cycle cannot contain one; a cycle stays inside a single layer and uses only non-job roads, whose costs are $\ge 0$. So distances are well defined, and Bellman–Ford on this graph would be correct, but it costs $O\big((kV)(kE)\big) = O(k^2 VE)$.

*Faster: layer by layer.* Process $j = 0, 1, \dots, k$.
- $j = 0$: Dijkstra from $s$ using only non-job roads gives $D_0(v)$.
- $j \ge 1$: set the starting keys $B_j(v) = \min\{D_{j-1}(u) + c(u \to v) : u \to v \in J\}$ (possibly negative), then run Dijkstra on the non-job roads starting with **all** these keys at once; it returns $D_j(v) = \min_u \big(B_j(u) + \delta(u, v)\big)$, where $\delta$ is distance using non-job roads.

Every walk to $(v, j)$ with $j \ge 1$ is a walk to some $(u', j - 1)$, one job edge into layer $j$, and then non-job edges inside layer $j$; so this computes exactly the layered distances. Multi-source Dijkstra with arbitrary (even negative) initial keys is correct: it is ordinary Dijkstra from a super-source $z_j$ with an edge $z_j \to u$ of length $B_j(u)$, and negative edges leaving the source are harmless (equivalently, add a constant $M$ to every $B_j(u)$: every path from $z_j$ uses exactly one such edge, so all paths shift by the same $M$).

*Time.* $k + 1$ Dijkstra runs on at most $E$ edges plus $O(E)$ per layer to compute the $B_j$: $O(kE \log V)$.`
    }
  ]
});
