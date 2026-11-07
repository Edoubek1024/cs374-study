CS374.topic({
  id: 'graphs',
  unit: 'algorithms',
  order: 15,
  title: 'Graphs, BFS & DFS',
  summary: 'Graph vocabulary and representations, whatever-first search, BFS and DFS, components and bipartiteness, and the central CS 374 skill: modeling a problem as reachability in a carefully built graph.',
  objectives: [
    'Choose between adjacency lists and matrices and state the cost of basic operations',
    'Run whatever-first search, BFS and DFS and state their O(V+E) running times',
    'Count connected components and test bipartiteness in linear time',
    'Model a problem as reachability/BFS in a state graph (product graphs, parity, counters, keys)',
    'Describe a reduction precisely: vertices, edges, start/target, algorithm, running time in terms of the ORIGINAL input'
  ],

  lesson: String.raw`
## Why graphs?

A huge fraction of algorithm problems in CS 374 are "secretly" graph problems. The course expects two separate skills:

1. Knowing the standard toolbox (whatever-first search, BFS, DFS, topological sort, Dijkstra, Bellman–Ford, MST algorithms) and their running times **as black boxes**.
2. **Modeling**: turning a word problem into a graph so that a black-box algorithm answers the question. On exams this second skill is where the points are.

This lesson covers the basics, proves the key facts about BFS, and then spends most of its time on modeling with reachability. Each worked example is posed first; try it yourself before opening the solution. Every graph drawing has a link that opens it in the **Graph Algorithms Lab** ([#/lab/graph](#/lab/graph)), where you can step through BFS and DFS one vertex at a time. Running a few traces there is the fastest way to make the algorithms feel mechanical.

## Vocabulary

A **graph** $G = (V, E)$ has a set $V$ of **vertices** and a set $E$ of **edges**. We write $V$ and $E$ both for the sets and for their sizes (so "$O(V+E)$" means $O(|V|+|E|)$).

- **Undirected** edge $uv$: an unordered pair. **Directed** edge $u \to v$: an ordered pair with **tail** $u$ and **head** $v$.
- A **walk** is a sequence of vertices $v_0, v_1, \dots, v_k$ with each consecutive pair joined by an edge (in the right direction, if directed). A **path** is a walk with no repeated vertices. A **cycle** is a closed walk $v_0, \dots, v_k = v_0$ with no other repeated vertices (and, in undirected graphs, length at least 3).
- $v$ is **reachable** from $u$ if there is a walk (equivalently, a path) from $u$ to $v$. Any walk from $u$ to $v$ can be shortcut to a path by cutting out the part between two visits of the same vertex.
- An undirected graph is **connected** if every vertex is reachable from every other. Its **components** are its maximal connected subgraphs.
- The **degree** of $v$ is the number of incident edges. Handshake lemma: $\sum_v \deg(v) = 2E$.
- Simple graphs satisfy $E \le {V \choose 2} = O(V^2)$. A connected graph has $E \ge V - 1$.

> **Definition.** A graph is **bipartite** if its vertices can be split into two sets $L, R$ so that every edge has one endpoint in $L$ and one in $R$. Equivalently, it can be properly 2-colored.

Here is a small undirected graph with two components:

~~~graph
undirected
a b
b c
c a
c d
e f
~~~

## Representations

| Operation | Adjacency list | Adjacency matrix |
|---|---|---|
| Space | $O(V + E)$ | $O(V^2)$ |
| Is $uv$ an edge? | $O(1 + \deg(u))$ | $O(1)$ |
| List neighbors of $v$ | $O(1 + \deg(v))$ | $O(V)$ |
| List all edges | $O(V + E)$ | $O(V^2)$ |

An **adjacency list** stores, for each vertex, a linked list (or array) of its neighbors (out-neighbors, for directed graphs). An **adjacency matrix** is a $V \times V$ array $A$ with $A[u][v] = 1$ iff $uv \in E$.

> **Exam tip.** Unless stated otherwise, CS 374 assumes graphs are given as **adjacency lists**. All the standard linear-time bounds, like $O(V+E)$ for BFS/DFS, assume adjacency lists. With a matrix, searching takes $O(V^2)$ because listing neighbors costs $O(V)$ per vertex.

Many modeling problems never build the graph explicitly: a grid, a puzzle, or a set of states can be explored by computing each vertex's neighbors on the fly. That is still a graph search, and the analysis is the same, as long as each vertex's neighbor list can be generated in time proportional to its length.

## Whatever-first search

All the basic traversal algorithms are instances of one generic algorithm. Keep a **bag** of edges waiting to be explored. Repeatedly take something out of the bag; if it leads to an unmarked vertex, mark that vertex and put all its outgoing edges in the bag.

~~~pseudo
WhateverFirstSearch(s):
    put (nil, s) in the bag
    while the bag is not empty:
        take (p, v) out of the bag
        if v is unmarked:
            mark v
            parent(v) <- p
            for each edge v -> w:
                put (v, w) in the bag
~~~

> **Lemma.** WhateverFirstSearch(s) marks exactly the vertices reachable from $s$. The parent pointers form a tree (the *search tree*) rooted at $s$ containing every reachable vertex, and following parent pointers from $v$ back to $s$ gives a path from $s$ to $v$.

*Proof sketch.* Only vertices reachable from $s$ ever enter the bag, so marked ⇒ reachable. Conversely, suppose $v$ is reachable but unmarked; take a path $s = v_0, \dots, v_k = v$ and let $v_i$ be the first unmarked vertex on it. Then $v_{i-1}$ was marked, so the edge $(v_{i-1}, v_i)$ went into the bag and was eventually removed, at which point $v_i$ would have been marked: contradiction.

**Running time.** Each vertex is marked once and, when marked, puts its $\deg(v)$ out-edges in the bag. So the bag sees at most $E$ insertions in a directed graph (at most $2E$ in an undirected one). If each bag operation takes $O(1)$ time (stack or queue), the total is $O(V + E)$; restricted to the part reachable from $s$ it is $O(E)$ plus initialization. With a priority queue (bag operations $O(\log E)$) it is $O(V + E \log E) = O(V + E \log V)$.

The choice of bag determines the algorithm:

| Bag | Algorithm | Notable property |
|---|---|---|
| Stack | Depth-first search (DFS) | Tree has a recursive, nested structure (pre/post clocks, see next topic) |
| Queue | Breadth-first search (BFS) | Tree is a shortest-path tree for edge counts |
| Priority queue keyed by edge weight | Jarník/Prim MST | Builds a minimum spanning tree |
| Priority queue keyed by distance | Dijkstra | Shortest paths with nonnegative weights |

## Breadth-first search

BFS uses a queue. It is usually written with distances directly:

~~~pseudo
BFS(s):
    for all v: dist(v) <- infinity
    dist(s) <- 0
    enqueue s
    while the queue is not empty:
        u <- dequeue
        for each edge u -> v:
            if dist(v) = infinity:
                dist(v) <- dist(u) + 1
                parent(v) <- u
                enqueue v
~~~

> **Theorem.** After BFS(s), for every vertex $v$, $dist(v)$ equals the minimum number of edges on any path from $s$ to $v$ (infinity if $v$ is unreachable). BFS runs in $O(V + E)$ time.

Informally: BFS dequeues vertices in nondecreasing order of distance, processing all vertices at distance $d$ (the **level** $d$) before any at distance $d+1$. Each level is exactly the set of unvisited out-neighbors of the previous level. Here is the full proof, which is worth knowing because the same structure (an upper bound, a lower bound, and a monotonicity invariant) reappears in the proof of Dijkstra's algorithm.

Write $\delta(v)$ for the true edge-count distance from $s$ to $v$.

**Claim 1 (no underestimates).** At all times, if $dist(v) < \infty$ then there is a walk from $s$ to $v$ with $dist(v)$ edges, so $dist(v) \ge \delta(v)$. *Proof:* induction on the number of assignments. $dist(s) = 0$ is the empty walk. When BFS sets $dist(v) = dist(u) + 1$, append the edge $u \to v$ to the walk for $u$.

**Claim 2 (the queue is sorted and spans at most two levels).** At every moment, if the queue holds $u_1, \dots, u_r$ from head to tail, then $dist(u_1) \le dist(u_2) \le \dots \le dist(u_r) \le dist(u_1) + 1$. *Proof:* true initially (only $s$). A dequeue removes $u_1$, which can only make the condition easier. While processing $u_1$, each newly enqueued vertex gets $dist(u_1) + 1$, which is at least the old tail value (because $dist(u_r) \le dist(u_1)+1$) and at most $dist(u_2) + 1$ for the new head $u_2$ (because $dist(u_1) \le dist(u_2)$). So the condition is preserved. As a consequence, vertices are dequeued in nondecreasing order of $dist$.

**Claim 3 (no overestimates).** For every reachable $v$, $dist(v) \le \delta(v)$. *Proof:* induction on $\delta(v)$. The case $\delta(v) = 0$ is $v = s$. If $\delta(v) = d > 0$, let $u$ be the vertex just before $v$ on a shortest path, so $\delta(u) = d-1$ and by induction $dist(u) = d - 1$ (combine with Claim 1). When $u$ is dequeued and scans the edge $u \to v$, either $v$ is still undiscovered and gets $dist(v) = d$, or $v$ was already discovered by some vertex $w$ dequeued no later than $u$. By Claim 2, $dist(w) \le dist(u)$, so $dist(v) = dist(w) + 1 \le d$.

Claims 1 and 3 together give $dist(v) = \delta(v)$. Unreachable vertices are never discovered (they never enter the queue), so they keep $dist = \infty$. ∎

> **Warning.** BFS computes shortest paths only when every edge counts as length 1 (or all edges have the same length). With arbitrary positive weights you need Dijkstra. A common trick: if weights are small positive integers, subdivide an edge of weight $w$ into $w$ unit edges, but that is only polynomial if the weights are bounded by a polynomial in the input size.

**Example.** Run BFS from $s$ on the directed graph below.

~~~graph
directed
s a
s b
a c
b c
c d
b e
e d
d f
~~~

Level 0: $s$. Level 1: $a, b$. Level 2: $c, e$. Level 3: $d$. Level 4: $f$. So $dist(f) = 4$, and one shortest path is $s \to a \to c \to d \to f$. Here is the same run, one dequeue at a time (out-neighbors scanned alphabetically).

~~~steps BFS from s, tracking the queue
**Initialize.** $dist(s) = 0$, every other distance is $\infty$. Queue: $[s]$.
+++
**Dequeue $s$** (distance 0). Scan $s \to a$: $a$ is new, so $dist(a) = 1$, $parent(a) = s$. Scan $s \to b$: $dist(b) = 1$, $parent(b) = s$. Queue: $[a, b]$.
+++
**Dequeue $a$** (distance 1). Scan $a \to c$: $dist(c) = 2$, $parent(c) = a$. Queue: $[b, c]$.
+++
**Dequeue $b$** (distance 1). Scan $b \to c$: $c$ is already discovered, so nothing happens. This is the moment Claim 3 of the proof talks about: $c$ was discovered by $a$, which left the queue before $b$, so its distance is no larger than what $b$ would give it. Scan $b \to e$: $dist(e) = 2$, $parent(e) = b$. Queue: $[c, e]$.
+++
**Dequeue $c$** (distance 2). Scan $c \to d$: $dist(d) = 3$, $parent(d) = c$. Queue: $[e, d]$. Notice the queue holds distances $2, 3$: never more than two consecutive values (Claim 2).
+++
**Dequeue $e$** (distance 2). Scan $e \to d$: already discovered. Queue: $[d]$.
+++
**Dequeue $d$** (distance 3). Scan $d \to f$: $dist(f) = 4$, $parent(f) = d$. Queue: $[f]$.
+++
**Dequeue $f$.** No out-edges. The queue is empty, so BFS stops. Parent pointers give the BFS tree $s \to a \to c \to d \to f$ and $s \to b \to e$. Every vertex was enqueued once and every edge scanned once: $O(V+E)$.
~~~

## Depth-first search

DFS uses a stack, and is almost always written recursively:

~~~pseudo
DFS(v):
    mark v
    for each edge v -> w:
        if w is unmarked:
            parent(w) <- v
            DFS(w)

DFSAll(G):
    unmark every vertex
    for each vertex v:
        if v is unmarked:
            DFS(v)
~~~

DFS also takes $O(V + E)$ time. On its own it answers reachability just as well as BFS; its real power (pre/post-order clocks, cycle detection, topological sort, strong components) is the subject of the next topic. DFS does **not** compute shortest paths.

## Reachability and connected components

To decide whether $t$ is reachable from $s$: run any whatever-first search from $s$ and check whether $t$ is marked. $O(V+E)$ time.

To count (or label) the components of an undirected graph, wrap the search in a loop:

~~~pseudo
CountAndLabel(G):
    count <- 0
    for each vertex v: unmark v
    for each vertex v:
        if v is unmarked:
            count <- count + 1
            WFS from v, setting comp(w) <- count for every vertex w it marks
    return count
~~~

Each vertex is marked exactly once overall and each edge is examined at most twice overall, so the total time is $O(V + E)$, **not** $O(V \cdot (V+E))$. This "amortize over all the searches" argument comes up repeatedly.

> **Warning.** For a **directed** graph, "components" in this sense are not well defined: $u$ may reach $v$ without $v$ reaching $u$. The right notion is *strongly connected components*, computed in the next topic.

## Bipartiteness

> **Theorem.** An undirected graph is bipartite if and only if it has no cycle of odd length.

**Algorithm (BFS 2-coloring).** In each component, run BFS from an arbitrary vertex $r$ and color each vertex by the parity of its level: even levels red, odd levels blue. Then check every edge.

- If no edge joins two vertices of the same color, the coloring is a valid bipartition.
- If some edge $uw$ joins two vertices of the same color, then (since BFS edges only connect the same or adjacent levels) $u$ and $w$ are on the same level $d$. Let $a$ be their lowest common ancestor in the BFS tree, at level $d_a$. The two tree paths $a \leadsto u$ and $a \leadsto w$ share only $a$, so together with $uw$ they form a cycle of length $2(d - d_a) + 1$, which is **odd**. An odd cycle cannot be 2-colored (colors must alternate around it), so the graph is not bipartite.

Total time $O(V+E)$. DFS works too: color each child opposite to its parent and look for an edge between equal colors.

For example, the 4-cycle below is bipartite ($\{a, c\}$ versus $\{b, d\}$), but adding the chord $ac$ creates the odd cycle $a, b, c$:

~~~graph
undirected
a b
b c
c d
d a
~~~

Two facts used constantly: every **tree** is bipartite (it has no cycles at all), and every graph whose cycles all have even length is bipartite. In the BFS argument, notice also that the bipartition is forced inside each component once one vertex's color is chosen, so a connected bipartite graph has exactly two valid 2-colorings (swap the colors).

**Try it first: two exam slots.** A registrar has $n$ final exams and a list of $m$ pairs of exams that share at least one student. Each exam must go in the morning slot or the afternoon slot, and two exams that share a student must be in different slots. Describe an algorithm that finds a valid schedule or reports that none exists.

~~~reveal Solution: two exam slots
**Graph.** Build the undirected *conflict graph* $G$: one vertex per exam, an edge between two exams whenever they share a student. $n$ vertices, $m$ edges.

**Observation.** A valid schedule is exactly a proper 2-coloring of $G$ (color = slot), so one exists iff $G$ is bipartite.

**Algorithm.** For each component, BFS from any vertex and color by level parity; then scan all edges. If no edge joins equal colors, output morning = even levels, afternoon = odd levels. Otherwise report "impossible"; as a certificate, the offending edge plus the two tree paths to the lowest common ancestor form an odd cycle of exams, and an odd cycle cannot alternate between two slots.

**Time.** $O(n + m)$.

**Follow-up.** With **three** slots the question becomes graph 3-coloring, which is NP-hard. Two is special because once one vertex is colored, every neighbor's color is forced; with three colors there are choices, and the BFS argument collapses.
~~~

## Graph modeling: reductions to reachability

This is the most important part of the topic. A typical exam question says: *"Describe and analyze an efficient algorithm for ... "* where the problem is about mazes, robots, puzzles, colored edges, or constraints on paths. The intended solution builds a new graph whose vertices encode **everything you need to remember** about a partial solution, then runs BFS/WFS (or later Dijkstra).

> **Key idea.** If a constraint makes some walks in $G$ legal and others illegal, and checking legality requires remembering a small amount of extra information $x$ as you walk, make the vertices of the new graph pairs $(v, x)$. Edges of the new graph are the legal single steps, updating $x$. Then legal walks in $G$ correspond exactly to walks in the new graph.

The standard write-up has these pieces:

1. **Vertices**: what each vertex of the new graph $H$ represents. Be explicit: "$V' = V \times \{0, 1, \dots, k\}$; vertex $(v, i)$ means we are at $v$ having used $i$ red edges."
2. **Edges**: exactly when there is an edge from one state to another, with weights if any.
3. **The question in $H$**: from which start vertex, to which target vertex/vertices, and which algorithm (WFS for reachability, BFS for fewest steps, Dijkstra for weighted).
4. **Correctness**: one or two sentences why walks in $H$ correspond to valid solutions.
5. **Running time** in terms of the **original** input: count $|V'|$ and $|E'|$, then plug into the algorithm's bound.

### Example 1: an even number of red edges

*Problem.* A directed graph $G$ has each edge colored red or blue. Given $s, t$, decide whether there is a walk from $s$ to $t$ that uses an even number of red edges.

*Model.* Remember the parity of red edges used so far.

- $V' = V \times \{0, 1\}$, where $(v, b)$ means "at $v$, and the number of red edges so far has parity $b$".
- For each blue edge $u \to v$ of $G$: edges $(u, 0) \to (v, 0)$ and $(u, 1) \to (v, 1)$.
- For each red edge $u \to v$ of $G$: edges $(u, 0) \to (v, 1)$ and $(u, 1) \to (v, 0)$.
- Answer: run WFS in $H$ from $(s, 0)$; report YES iff $(t, 0)$ is marked.

*Correctness.* By induction on length, a walk $s = v_0, \dots, v_k$ in $G$ with $r$ red edges corresponds to the walk $(v_0, 0), \dots, (v_k, r \bmod 2)$ in $H$, and every walk in $H$ from $(s,0)$ projects to a walk in $G$ in this way.

*Time.* $|V'| = 2V$, $|E'| = 2E$, so $O(V + E)$.

The product graph for a two-vertex example with a red edge $s \to t$ and a blue edge $t \to s$ is the 4-vertex graph below (red edges flip the second coordinate, blue edges keep it):

~~~graph
directed
s0 t1
s1 t0
t0 s0
t1 s1
~~~

Here $s0$ stands for $(s, 0)$ and so on. The red edge $s \to t$ becomes $(s,0) \to (t,1)$ and $(s,1) \to (t,0)$; the blue edge $t \to s$ becomes $(t,0) \to (s,0)$ and $(t,1) \to (s,1)$. Searching from $s0$ visits $t1$, then $s1$, then $t0$. So $(t, 0)$ is reachable, matching the walk $s \to t \to s \to t$, which uses two red edges. (The one-edge walk $s \to t$ uses one red edge, so it reaches only $t1$.)

> **Warning.** Reachability models find **walks**, which may repeat vertices. If the problem genuinely requires a *simple path* with a parity or counting constraint, the product graph does not directly solve it (a walk in $H$ may visit $(v,0)$ and $(v,1)$, i.e., visit $v$ twice). Read the problem carefully; exam problems that intend a product construction say "walk", or the constraint is such that shortest walks are automatically paths.

### Example 2: at most $k$ red edges, fewest total edges

*Problem.* Same colored graph; find the minimum number of edges in a walk from $s$ to $t$ that uses **at most $k$** red edges.

*Model.* $V' = V \times \{0, 1, \dots, k\}$: $(v, i)$ means "at $v$ having used $i$ red edges". Blue edge $u \to v$ gives $(u, i) \to (v, i)$ for all $0 \le i \le k$; red edge $u \to v$ gives $(u, i) \to (v, i+1)$ for $0 \le i < k$. There is no edge that would make the counter exceed $k$, which enforces the constraint. Run **BFS** from $(s, 0)$; the answer is $\min_{0 \le i \le k} dist(t, i)$.

*Time.* $|V'| = (k+1)V$, $|E'| \le (k+1)E$, so $O(k(V + E))$. Since we may assume $k \le E$, this is polynomial.

A neat alternative to taking the minimum over $i$: add a target vertex $t^*$ with edges $(t, i) \to t^*$, then ask for $dist(t^*) - 1$. Either is fine; say which you use.

### Example 3: a maze with keys and doors

*Problem.* An $n \times n$ grid maze has walls, $k$ colored keys lying on cells, and doors; a door of color $c$ can be passed only if you hold key $c$. You start at cell $s$ with no keys; picking up a key happens automatically on entering its cell. Find the fewest moves to reach the exit.

*Model.* The state is your cell **and the set of keys you hold**.

- $V' = \{(x, S) : x \text{ a non-wall cell}, S \subseteq \{1, \dots, k\}\}$, so $|V'| \le n^2 2^k$.
- From $(x, S)$, for each of the up-to-4 neighbors $y$ of $x$ that is not a wall and is not a door whose color is missing from $S$: an edge to $(y, S \cup \mathrm{key}(y))$, where $\mathrm{key}(y)$ is the (possibly empty) set of keys at $y$.
- BFS from $(s, \emptyset)$; the answer is the minimum of $dist(\mathrm{exit}, S)$ over all $S$.

*Time.* $O(n^2 2^k)$ vertices with at most 4 out-edges each, so $O(2^k n^2)$ time. This is polynomial only when $k = O(\log n)$; the exponential dependence on $k$ is inherent in this state space.

### Example 4: implicit puzzles

Puzzles like "two jugs of capacity $a$ and $b$; fill, empty, or pour; can you measure exactly $c$ liters?" are reachability in a state graph whose vertices are pairs $(x, y)$ with $0 \le x \le a$, $0 \le y \le b$, and whose edges are the six possible operations. The graph has $(a+1)(b+1)$ vertices and at most 6 edges out of each, so BFS takes $O(ab)$ time and also finds the fewest operations. (Note this is polynomial in the *values* $a, b$, not in their bit-lengths.)

### Building a product graph by hand

It helps to see a product graph built explicitly once, so that the abstract description "$V \times \mathbb{Z}_3$ with edges $(u, j) \to (v, j+1 \bmod 3)$" has a picture behind it.

~~~~steps A walk from s to t whose length is a multiple of 3
**The problem.** The directed graph has edges $s \to a$, $a \to t$, $t \to s$, $a \to s$. We want the fewest edges in a walk from $s$ to $t$ whose length is divisible by 3. The obvious path $s \to a \to t$ has length 2, so it does not qualify.

~~~graph
directed
s a
a t
t s
a s
~~~
+++
**What to remember.** Whether a walk can be finished legally depends only on where we are and on the current length mod 3. So the states are $(v, j)$ with $j \in \{0, 1, 2\}$: "at $v$, having used a number of edges congruent to $j$ mod 3". That gives $3 \cdot 4 = 12$ vertices.
+++
**Edges.** Every original edge $u \to v$ becomes three edges $(u, j) \to (v, (j+1) \bmod 3)$. For example $s \to a$ becomes $s0 \to a1$, $s1 \to a2$, $s2 \to a0$. Doing this for all four edges gives 12 edges:

~~~graph
directed
s0 a1
s1 a2
s2 a0
a0 t1
a1 t2
a2 t0
t0 s1
t1 s2
t2 s0
a0 s1
a1 s2
a2 s0
~~~
+++
**Start and target.** Start at $s0$ (at $s$, zero edges so far). The target is $t0$ (at $t$, length $\equiv 0$). Any other copy of $t$ is a walk of the wrong length.
+++
**Run BFS from $s0$.** Level 1: $a1$. Level 2: $t2, s2$. Level 3: $a0$ (from $s2$; the edge $t2 \to s0$ returns to the start). Level 4: $t1, s1$. Level 5: $a2$ (from $s1$). Level 6: $t0$ (from $a2$).
+++
**Read off the answer.** $dist(t0) = 6$. Following parents back gives $s0, a1, s2, a0, s1, a2, t0$, which projects to the walk $s \to a \to s \to a \to s \to a \to t$: six edges, a multiple of 3, as required. Note it is a **walk**, not a path, since $s$ and $a$ repeat. In general this construction has $3V$ vertices and $3E$ edges, so it costs $O(V+E)$; for "length $\equiv r \pmod m$" it costs $O(m(V+E))$.
~~~~

### More worked examples (try each one first)

Each of the following is a typical exam question. Read the problem, decide what a state must remember, and write down vertices, edges, algorithm and running time before opening the solution.

**Example 5: visit a checkpoint.** In a directed graph some vertices are red. Find the fewest edges in a walk from $s$ to $t$ that visits at least one red vertex (the endpoints count).

~~~reveal Solution: visit a red vertex
**State.** The only thing that matters about the past is whether we have seen a red vertex yet. Vertices of $H$: $(v, f)$ with $f \in \{0, 1\}$, meaning "at $v$; $f = 1$ iff a red vertex has been visited".

**Edges.** For each edge $u \to v$ of $G$ and each $f$: an edge $(u, f) \to (v, f')$ where $f' = 1$ if $f = 1$ or $v$ is red, and $f' = 0$ otherwise. Note that layer 1 is never left: once the flag is set it stays set, so $H$ is directed even if $G$ were not.

**Search.** BFS from $(s, f_0)$ where $f_0 = 1$ iff $s$ is red. Answer $dist(t, 1)$.

**Time.** $2V$ vertices and $2E$ edges: $O(V + E)$.

**Alternative.** BFS from $s$ in $G$ gives $d_s$; BFS from $t$ in the reversed graph gives $d_t(v)$, the distance from $v$ to $t$. The answer is $\min_{r \text{ red}} \big(d_s(r) + d_t(r)\big)$. Also $O(V+E)$. Both are full-credit answers; the product graph generalizes better (for example to "visit a red vertex and then a blue vertex").
~~~

**Example 6: breaking walls.** An $n \times n$ grid has open cells and wall cells. You may move between edge-adjacent cells; stepping into a wall cell destroys it, but you can destroy at most $k$ walls in total. Find the fewest moves from the top-left to the bottom-right cell.

~~~reveal Solution: breaking walls
**State.** $(x, b)$: you are on cell $x$ and have destroyed $b$ walls so far, $0 \le b \le k$. This is the "bounded counter" pattern.

**Edges.** From $(x, b)$, for each of the at most four neighbors $y$ of $x$: if $y$ is open, an edge to $(y, b)$; if $y$ is a wall and $b < k$, an edge to $(y, b + 1)$. All edges have length 1 (one move each).

**Search.** BFS from (top-left, 0). Answer $\min_{b} dist(\text{bottom-right}, b)$, or "impossible" if all are infinite.

**Why walks are fine.** Re-entering a cell you already broke counts as another break in this model, which looks wrong. But a fewest-move route never revisits a cell (cut out the loop: fewer moves and no more breaks), so the minimum is unaffected.

**Time.** $(k+1) n^2$ states with at most 4 out-edges each: $O(k n^2)$. We may assume $k \le 2n - 2$ or so: some monotone staircase route from corner to corner has $2n - 2$ moves and so enters at most $2n-2$ walls, so capping $k$ at $2n - 2$ changes nothing and the time is $O(\min(k, n) \cdot n^2)$.
~~~

**Example 7: a robot with a heading.** A robot on an $n \times n$ grid with obstacles faces north, east, south or west. Each second it executes one command: move one cell forward (if that cell is open and on the grid), turn left 90°, or turn right 90°. Find the minimum number of seconds to reach cell $t$ from cell $s$, starting facing north.

~~~reveal Solution: robot with a heading
**State.** Position alone does not determine which moves are available; the heading matters. Vertices: $(x, h)$ with $x$ an open cell and $h \in \{N, E, S, W\}$, so $4n^2$ vertices.

**Edges.** From $(x, h)$: to $(x, \text{left}(h))$, to $(x, \text{right}(h))$, and, if the cell $y$ one step from $x$ in direction $h$ is open, to $(y, h)$. The graph is **directed**: moving forward from $(x, N)$ to $(y, N)$ cannot be undone by a single command.

**Search.** BFS from $(s, N)$; answer $\min_h dist(t, h)$ (or add a super-target $t^*$ with edges from all four copies of $t$ and subtract 1).

**Time.** $4n^2$ vertices, 3 out-edges each: $O(n^2)$.
~~~

**Example 8: two friends meeting.** Alice is at vertex $a$ and Bob at vertex $b$ of a connected undirected graph. Every round, **both** must move along an edge, simultaneously. Find the minimum number of rounds until they are on the same vertex at the end of a round.

~~~reveal Solution: two friends meeting
**State.** The configuration is the pair of positions: vertices of $H$ are $(x, y) \in V \times V$.

**Edges.** $(x, y) \to (x', y')$ for every edge $xx'$ and every edge $yy'$. (They move together, so one round changes both coordinates.)

**Search.** BFS from $(a, b)$; answer $\min_v dist(v, v)$, or add a super-target with edges from every diagonal vertex $(v, v)$.

**Size.** $V^2$ vertices. The number of edges out of $(x, y)$ is $\deg(x) \cdot \deg(y)$, so
$$|E(H)| = \sum_x \sum_y \deg(x)\deg(y) = \Big(\sum_x \deg x\Big)^2 = (2E)^2.$$
BFS takes $O(V^2 + E^2) = O(E^2)$ time for a connected graph.

**Contrast.** If only **one** person moves per round, $(x, y)$ has $\deg x + \deg y$ out-edges and the total is $O(VE)$. Count the edges of a product graph carefully; this is where answers lose points.

**Subtlety.** In a bipartite graph, if $a$ and $b$ are on opposite sides, the parity of their distance never changes when both move, and they can never meet. BFS discovers this automatically (no diagonal vertex is reached); you do not need a special case.
~~~

**Example 9: teleporters.** A maze on an $n \times n$ grid has $p$ pairs of teleporter pads. Standing on a pad, you may spend one move to jump to its partner. Find the fewest moves from $s$ to $t$.

~~~reveal Solution: teleporters
No extra state is needed: a teleport is just another kind of move. Vertices are the open cells; edges join adjacent open cells (both directions) and each pad to its partner (both directions). BFS from $s$; answer $dist(t)$. The graph has $O(n^2)$ vertices and $O(n^2 + p) = O(n^2)$ edges, so $O(n^2)$ time.

The lesson: **not every problem needs a product graph**. Add state only when the legality or cost of future moves depends on something besides the current vertex. If the teleporter could be used **at most once**, that changes: add a flag $(x, u)$ with $u \in \{0,1\}$, and teleport edges go from layer 0 to layer 1 only.
~~~

### Checklist and common mistakes

> **Exam tip.** Graders look for: a precise description of vertices and edges (not just "make a graph of the maze"), the exact algorithm called and from where, how the answer is read off, and a running time in terms of the original parameters ($V$, $E$, $n$, $k$). "BFS takes $O(V+E)$" is wrong if your graph has $V' = kV$ vertices; say $O(k(V+E))$.

- **Don't modify BFS/Dijkstra** if you can avoid it. Modifying the algorithm requires re-proving correctness; changing the *graph* lets you use the black box with its known guarantees.
- **Don't forget the target set.** If the goal is "reach $t$ in any state", either minimize over all copies of $t$ or add a super-target.
- **Count edges correctly.** A product $V \times X$ typically has $|E| \cdot |X|$ edges, not $|E|$.
- **Weights.** BFS only for unit lengths. If moves have costs, use Dijkstra on the same model (next topics).
- **Direction.** If the original graph is undirected but the state update is one-way (e.g., the counter only increases), the new graph is **directed**.

## Summary of running times

| Task | Algorithm | Time |
|---|---|---|
| Reachability from $s$ | WFS / BFS / DFS | $O(V+E)$ |
| Fewest edges from $s$ (unweighted) | BFS | $O(V+E)$ |
| Connected components (undirected) | WFS in a loop | $O(V+E)$ |
| Bipartite test / 2-coloring | BFS or DFS | $O(V+E)$ |
| Reachability in product $V \times X$ | WFS on product graph | $O(|X|(V+E))$ |
| Distance to the nearest of several sources | BFS from a super-source | $O(V+E)$ |
| Two agents, one moves per step | BFS on $V \times V$ | $O(VE)$ |
| Two agents, both move each step | BFS on $V \times V$ | $O(E^2)$ |

## Common exam problem patterns

Almost every reachability question on a CS 374 exam is one of the following, sometimes two combined. For each pattern, the recipe says what the state is and what usually goes wrong.

1. **Implicit graph, no extra state** (mazes, knight moves, jumping arrays, sliding pucks, teleporters). *Recipe:* vertices = positions; edges = single legal moves (directed if moves are not reversible); BFS for fewest moves. *Watch:* precompute expensive moves (like slide destinations) so each edge costs $O(1)$.
2. **Bounded counter** ("at most $k$ red edges / wall breaks / coupons"). *Recipe:* $V \times \{0, \dots, k\}$; the counted move goes up one layer; no edge leaves the top layer. *Time:* $O(k(V+E))$. *Watch:* the answer is the best over all layers at the target.
3. **Parity or residue** ("even number of red edges", "length divisible by $m$"). *Recipe:* $V \times \mathbb{Z}_m$; edges add to the residue. *Time:* $O(m(V+E))$. *Watch:* "positive even" needs a third state to separate zero from even.
4. **One-way flag** ("visit a red vertex", "use the teleporter at most once", "pick up the package first"). *Recipe:* two layers; the triggering move goes from layer 0 to layer 1. Several ordered checkpoints give several layers.
5. **Last move matters** ("alternate colors", "no two consecutive left turns", "facing direction"). *Recipe:* state = (vertex, last color / heading / run length). *Watch:* the first move has no predecessor; add a start state or super-source.
6. **Several agents** (two robots, a robot and a guard, Alice and Bob). *Recipe:* state = tuple of positions, plus whose turn it is if they alternate. *Time:* count edges carefully: $O(VE)$ if one moves per step, $O(E^2)$ if both move.
7. **Periodic world** (a guard on a fixed patrol of length $p$, traffic lights with period $p$, doors toggled by switches). *Recipe:* state = (position, time mod $p$) or (position, toggle parity). *Time:* $O(p \cdot \text{size})$.
8. **Regular constraint on labels** ("the colors spell a string in $L$"). *Recipe:* product with a DFA for $L$: $V \times Q$. Patterns 3–5 are all special cases with tiny DFAs.
9. **Two-coloring** (two teams, two slots, "same/different" constraints). *Recipe:* bipartite test by BFS level parity, or BFS with edge labels for same/different; certificate = odd cycle. *Watch:* three groups is NP-hard.
10. **Many sources** ("distance from every cell to the nearest fire / exit / hospital"). *Recipe:* add a super-source with an edge to every source (or start BFS with all sources in the queue at distance 0). One BFS, $O(V+E)$, not one BFS per source.
11. **Counting or labeling components** ("how many islands", "minimum edges to connect"). *Recipe:* WFS in a loop; total $O(V+E)$. Minimum edges to make an undirected graph connected is (number of components) $- 1$.

## Where students lose points

- **Running time in the wrong units.** If your graph has $(k+1)V$ vertices and $(k+1)E$ edges, the answer is $O(k(V+E))$, not "$O(V+E)$ by BFS". Always translate $|V'|$ and $|E'|$ back to the original parameters ($n$, $k$, $V$, $E$, $p$, ...).
- **Not saying how edges are built.** "Make a graph where each vertex is a state and edges are moves" is not a solution. Graders want the rule: "from $(x, b)$ there is an edge to $(y, b+1)$ whenever $y$ is a wall adjacent to $x$ and $b < k$."
- **Forgetting the start state or the target set.** Say exactly which vertex the search starts from, and whether the answer is $dist$ of one vertex, a minimum over several copies, or $dist(t^*) - 1$ for a super-target.
- **Undercounting product edges.** Copying each edge into every layer multiplies $E$ by the number of layers; simultaneous moves multiply degrees. Do the sum.
- **BFS on a weighted graph.** BFS counts edges. If moves have different costs, you need Dijkstra (next topics), unless the costs are small integers and you subdivide edges.
- **Undirected when it should be directed.** One-way flags, counters that only increase, headings, and sliding moves all make the state graph directed.
- **Claiming a simple path.** Product graphs give walks. If the problem demands a simple path with a parity or counting constraint, you need an argument that shortest walks are paths, or a different method.
- **Modifying BFS instead of the graph.** "Run BFS but also remember the key set" is a modified algorithm whose correctness you would have to prove. Put the extra information in the vertices and call BFS unchanged.
- **Pseudo-polynomial blowups without comment.** A state space indexed by numeric values (capacities, times, fuel) is polynomial in the values, not in their bit-lengths. Say so.

## Self-check

Answer each question in a sentence or two before opening it.

~~~reveal 1. Why does WFS mark every vertex reachable from s, no matter what bag it uses?
Take a path from $s$ to a reachable $v$ and suppose some vertex on it is never marked; let $v_i$ be the first such vertex. Its predecessor $v_{i-1}$ was marked, so the pair $(v_{i-1}, v_i)$ went into the bag and was later taken out, at which point $v_i$ would have been marked. Contradiction. The argument never uses the order in which the bag returns items.
~~~

~~~reveal 2. Give a two-sentence argument that DFS does not compute shortest paths.
With edges $s \to a$, $a \to b$, $s \to b$ and $a$ explored first, DFS reaches $b$ through $a$ at depth 2, while $dist(b) = 1$. DFS commits to the first route it finds; only BFS's level-by-level order guarantees fewest edges.
~~~

~~~reveal 3. During BFS on an undirected graph, why can't an edge join levels 3 and 5?
When the level-3 endpoint $u$ was dequeued, it scanned the edge to the other endpoint $w$. Either $w$ was undiscovered and got level 4, or it had already been discovered by a vertex dequeued no later than $u$, giving it level at most 4. Either way $level(w) \le 4$.
~~~

~~~reveal 4. A product graph uses states (v, i) for 0 ≤ i ≤ k, and each original edge produces edges in every layer. What is the BFS running time?
$(k+1)V$ vertices and at most $(k+1)E$ edges, so $O(k(V+E))$. Writing $O(V+E)$ ignores the blowup.
~~~

~~~reveal 5. When must a state graph be directed even though the original graph is undirected?
Whenever a move changes the extra information in a way that the reverse move does not undo: a counter that only increases, a flag that is only set, a heading that changes, a slide that ends at a wall. Then the reverse of a legal step may be illegal.
~~~

~~~reveal 6. You need, for every cell of a grid, the distance to the nearest exit. What do you run, and how long does it take?
One BFS from a super-source joined to all exits (equivalently, start BFS with every exit in the queue at distance 0). Time $O(\text{number of cells})$. Running a separate BFS from each exit would multiply the time by the number of exits.
~~~

~~~reveal 7. Why does the product-graph method fail for "is there a simple s-t path of even length in a directed graph"?
A path in $V \times \{0,1\}$ may visit both $(v,0)$ and $(v,1)$, which uses $v$ twice in $G$. The product graph answers the walk version. The simple-path version for directed graphs is NP-hard, so no polynomial trick of this kind should be expected.
~~~

~~~reveal 8. Two robots must both move every round. Why is the state graph's edge count Θ(E²) and not Θ(VE)?
From $(x, y)$ there are $\deg(x) \cdot \deg(y)$ joint moves, and $\sum_{x,y} \deg(x)\deg(y) = (\sum_x \deg x)^2 = 4E^2$. The $O(VE)$ count applies when only one robot moves per step, giving $\deg x + \deg y$ moves.
~~~

## Midterm 2 exam patterns

On Midterm 2 the graph questions almost never say "run BFS". They tell a story (robots, mazes, buses, rovers, locks) and expect you to *find* the graph. The grading is predictable: most of the points go to a precise description of the graph, a few to naming the right black-box algorithm and reading off the answer, and a few to a running time stated in the original parameters. This section collects the shapes that keep reappearing and the mistakes that cost the most points.

### The shapes

| Shape | What a vertex remembers | Typical size | Algorithm |
|---|---|---|---|
| **State space / product graph** | position plus whatever the rules depend on (heading, flag, keys, parity, the other robot) | $V \cdot x$ vertices, for $x$ extra states | BFS / WFS |
| **Layered graph** | position plus the number of steps taken so far, $0 \dots L$ | $(L+1)V$ vertices, $LE$ edges | sweep the layers (it is a DAG) or BFS |
| **"At most $k$" counter** | position plus how many times the limited resource was used | $(k+1)V$ vertices | BFS; answer is the best layer at the target |
| **Reverse graph** | nothing extra; edges flipped | same as $G$ | one search from the target(s) in $rev(G)$ |
| **Multi-source / super-source** | nothing extra; one new vertex | $V + 1$ | one BFS instead of one per source |
| **Bipartite "route" graph** | stops *and* routes (or people and groups) as vertices | $n + r$ vertices, one edge per (stop, route) incidence | BFS; divide the distance by 2 |
| **Condensation + DP** (next topic) | one vertex per strongly connected component | $\le V$ vertices, $\le E$ edges | SCCs, then DP in topological order |

The layered graph deserves a remark: because every edge goes from layer $i$ to layer $i+1$, it is a **DAG even when $G$ has cycles**. That is why questions like "a walk with *exactly* $L$ edges" or "the best walk with exactly $k$ edges" are easy, even though "longest simple path" is NP-hard.

### A modeling template that earns full credit

1. **Vertices.** "Let $H$ have a vertex $(x, i)$ for every open cell $x$ and every $0 \le i \le k$; it means *I am at $x$ and have used $i$ ...*." Count them.
2. **Edges.** A rule, not a picture: "for every edge $u \to v$ of $G$ and every $i < k$, $H$ has the edge $(u, i) \to (v, i+1)$ ...". Say whether $H$ is directed and what the weights are (none, for BFS). Count them.
3. **Algorithm.** Name it and its start: "run BFS in $H$ from $(s, 0)$". Name the answer: "$\min_i dist(t, i)$", or "YES iff some $(t, i)$ is marked", or "$dist(t^*) - 1$".
4. **Correctness.** One sentence: "a sequence of legal moves corresponds to a walk in $H$ from the start vertex, one edge per move, and conversely."
5. **Time.** "$H$ has $O(\cdot)$ vertices and $O(\cdot)$ edges and can be built in that time, so the total is $O(\cdot)$" in terms of $n$, $k$, $V$, $E$.

### Mistakes that cost the most points

- **Forgetting to count the built graph.** "BFS runs in $O(V+E)$" is wrong when you run it on $H$ with $(k+1)V$ vertices. Always plug $|V(H)|$ and $|E(H)|$ into the bound, and include the time to *build* $H$.
- **Dijkstra where BFS suffices.** If every move costs 1, BFS gives $O(V+E)$; Dijkstra gives $O(E \log V)$ and graders deduct for the slower bound when a linear one was expected. Conversely, BFS on genuinely weighted edges is simply wrong. Edge lengths in $\{1, 2\}$: subdivide the 2-edges and use BFS.
- **Unspecified edges.** "Connect states that are one move apart" leaves the grader guessing which moves are legal. Spell out every edge type and every condition (walls, door colors, counter limit, the "stay put" rule).
- **Missing start or target set.** The answer is often a minimum over several copies of $t$, or a whole set of target states (for instance the diagonal $\{(v, v)\}$ for two robots meeting).
- **Undirected by habit.** Counters, flags, headings and "stay put if blocked" rules make the state graph directed.
- **Modifying BFS.** "BFS, but also track the battery" is a new algorithm needing a new proof. Put the battery in the vertex instead.
- **Pseudo-polynomial sizes without comment.** A state that stores a number (battery level, time, fuel, lock digits) makes the graph as large as that number. Say so, and cap it when a cap is valid.

### Worked example: nearest hospital on one-way streets

**Try it first.** A city has $V$ intersections and $E$ one-way streets, and $h$ of the intersections have a hospital. For **every** intersection $v$, compute the fewest streets an ambulance starting at $v$ must drive to reach *some* hospital. Aim for $O(V+E)$ total.

~~~~reveal Solution: nearest hospital
**Why the obvious approaches are wrong or slow.** BFS from each intersection costs $O(V(V+E))$. BFS from each hospital in $G$ computes distances *from* the hospital, which is the wrong direction on one-way streets, and costs $O(h(V+E))$ anyway.

**Graph.** Let $R = rev(G)$: the same intersections, every street reversed. Add a super-source $z$ with an edge $z \to x$ for every hospital $x$. A walk $v \leadsto x$ in $G$ is exactly a walk $x \leadsto v$ in $R$, so the fewest streets from $v$ to the nearest hospital is $dist_{R}(z, v) - 1$.

**Algorithm.** Build $R$ plus $z$ in $O(V+E)$ and run one BFS from $z$ (equivalently: start BFS with every hospital in the queue at distance 0). Report $dist(z, v) - 1$, or "unreachable" if $v$ was never discovered.

**Time.** $V + 1$ vertices and $E + h \le E + V$ edges: $O(V+E)$.

Here is a small instance with hospitals $h$ and $k$:

~~~graph
directed
e a
a b
a c
b h
c d
d b
d k
c e
~~~

~~~steps BFS in the reversed graph from both hospitals
**Reverse the streets.** $R$ has $a \to e$, $b \to a$, $c \to a$, $h \to b$, $d \to c$, $b \to d$, $k \to d$, $e \to c$. Start the queue as $[h, k]$, both at distance 0.
+++
**Dequeue $h$.** In $R$, $h \to b$: $b$ gets distance 1. **Dequeue $k$.** $k \to d$: $d$ gets 1. Queue $[b, d]$.
+++
**Dequeue $b$.** $b \to a$: $a$ gets 2; $b \to d$: already discovered. **Dequeue $d$.** $d \to c$: $c$ gets 2. Queue $[a, c]$.
+++
**Dequeue $a$.** $a \to e$: $e$ gets 3. **Dequeue $c$.** $c \to a$: already discovered. **Dequeue $e$.** $e \to c$: already discovered. Done.
+++
**Read off.** $b{:}\,1$, $d{:}\,1$, $a{:}\,2$, $c{:}\,2$, $e{:}\,3$. Check one in the original direction: from $e$ the ambulance drives $e \to a \to b \to h$, three streets. Note that $e$'s other option $e \to a \to c \to d \to k$ is longer; one BFS sorted that out for every vertex at once.
~~~
~~~~

### Worked example: a walk with exactly L edges

**Try it first.** Given a directed graph $G$, vertices $s, t$ and an integer $L \le V^2$, decide whether there is a walk from $s$ to $t$ with **exactly** $L$ edges. A classmate proposes: "run BFS from $s$ and answer YES iff $dist(t) \le L$." Find a counterexample, then give a correct $O(L(V+E))$ algorithm.

~~~~reveal Solution: exactly L edges
**Counterexample.** Take the edges $s \to a$, $a \to b$, $b \to t$, $s \to t$, $t \to a$ and $L = 2$. BFS gives $dist(t) = 1 \le 2$, but no walk of length exactly 2 reaches $t$ (the only length-2 walks are $s \to a \to b$ and $s \to t \to a$). Walks cannot "wait", so a short walk does not extend to a longer one of every length.

**Layered graph.** $H$ has a vertex $(v, i)$ for every $v \in V$ and $0 \le i \le L$, meaning "at $v$ after exactly $i$ edges". For every edge $u \to v$ of $G$ and every $0 \le i < L$, $H$ has the edge $(u, i) \to (v, i+1)$.

**Algorithm.** Search $H$ from $(s, 0)$; answer YES iff $(t, L)$ is marked. Because $H$ is layered (a DAG), the search is just a sweep: $R_0 = \{s\}$ and $R_{i+1} = \{v : u \to v \in E,\ u \in R_i\}$, keeping only two layers in memory.

**Correctness.** By induction on $i$: $v \in R_i$ iff $G$ has a walk from $s$ to $v$ with exactly $i$ edges (a walk of length $i+1$ is a walk of length $i$ plus one edge, and conversely).

**Time.** $(L+1)V$ vertices and $LE$ edges: $O(L(V+E))$. This is polynomial because we assumed $L \le V^2$; for an arbitrary $L$ written in binary it would be only pseudo-polynomial.

~~~steps The layers for the counterexample
**Layer 0.** $R_0 = \{s\}$.
+++
**Layer 1.** Out-neighbors of $s$: $R_1 = \{a, t\}$. (So $dist(t) = 1$.)
+++
**Layer 2.** From $a$: $b$. From $t$: $a$. $R_2 = \{a, b\}$, and $t \notin R_2$: the answer for $L = 2$ is NO.
+++
**Layer 3.** From $a$: $b$. From $b$: $t$. $R_3 = \{b, t\}$.
+++
**Layer 4.** From $b$: $t$. From $t$: $a$. $R_4 = \{a, t\}$, so $L = 4$ works: $s \to t \to a \to b \to t$. Next, $R_5 = \{a, b\} = R_2$, so from layer 2 on the layers repeat with period 3. The YES lengths are therefore $1$ and every $L \ge 3$ with $L \not\equiv 2 \pmod 3$. The layered graph found this without any number theory.
~~~
~~~~
`,

  cheatsheet: String.raw`
**Representations.** Adjacency list: $O(V+E)$ space, neighbors of $v$ in $O(1+\deg v)$. Matrix: $O(V^2)$ space, edge test $O(1)$, neighbors $O(V)$. Assume lists unless told otherwise.

**Whatever-first search.** Bag of edges; take one out; if its head is unmarked, mark it, record parent, add its out-edges. Marks exactly the vertices reachable from $s$. Stack ⇒ DFS, queue ⇒ BFS, priority queue ⇒ Prim/Dijkstra. Time $O(V+E)$ with $O(1)$ bag ops; $O(E\log V)$ with a heap.

**BFS.** Levels = distances in edge count. $O(V+E)$. Not valid for general weights.

**Components.** Loop over vertices; start a new search from each unmarked one. Total $O(V+E)$ (amortized over all searches).

**Bipartite** ⟺ no odd cycle. BFS-color by level parity; an edge inside one level closes an odd cycle through the LCA (length $2(d-d_a)+1$).

**Modeling recipe.**
1. Vertices: states $(v, \text{extra info})$ — say what each means.
2. Edges: legal single moves, updating the extra info.
3. Start state, target state(s); which algorithm.
4. Why walks in $H$ ↔ valid solutions.
5. Time in terms of original input: $|V'|$, $|E'|$.

**Standard products.**
| Constraint | States | Time |
|---|---|---|
| parity of red edges | $V \times \{0,1\}$ | $O(V+E)$ |
| at most $k$ red edges | $V \times \{0..k\}$ | $O(k(V+E))$ |
| walk length mod $m$ | $V \times \mathbb{Z}_m$ | $O(m(V+E))$ |
| label sequence accepted by DFA $M$ | $V \times Q$ | $O(|Q|(V+E))$ |
| keys collected | $\text{cells} \times 2^{k}$ | $O(2^k \cdot \text{cells})$ |
| two tokens, one moves per step | $V \times V$ | $O(V \cdot E)$ |
| one-way flag (visited red, used teleporter) | $V \times \{0,1\}$ | $O(V+E)$ |
| heading / last color | $V \times \{\text{4 dirs}\}$ or $V \times \{R,B\}$ | $O(V+E)$ |
| periodic obstacle, period $p$ | $\text{cells} \times \mathbb{Z}_p$ | $O(p \cdot \text{cells})$ |
| two tokens, both move each step | $V \times V$ | $O(E^2)$ |

**Pitfalls.** Product graphs give walks, not simple paths. Counter that only increases ⇒ directed edges. Don't modify the black box — modify the graph.

**Which algorithm when.**
| Question | Use | Time |
|---|---|---|
| Can $t$ be reached at all? | any WFS (DFS or BFS) | $O(V+E)$ |
| Fewest moves, every move costs 1 | BFS | $O(V+E)$ |
| Distance to the nearest of many sources | BFS from a super-source | $O(V+E)$ |
| Components / labels / "how many islands" | WFS in a loop | $O(V+E)$ |
| Two groups with conflicts | BFS 2-coloring (bipartite test) | $O(V+E)$ |
| Same/different constraints | BFS with XOR labels; fail ⇔ cycle with odd number of "different" edges | $O(V+E)$ |
| Moves have different positive costs | Dijkstra (not BFS) | $O(E\log V)$ |
| Cycles, topological order, SCCs | DFS with clocks (next topic) | $O(V+E)$ |
| Three or more groups (3-coloring) | NP-hard, no fast algorithm expected | — |

**BFS proof skeleton.** (1) $dist(v)$ is always the length of a real walk, so $\ge \delta(v)$. (2) Queue holds nondecreasing distances spanning at most two values. (3) Induction on $\delta(v)$ along a shortest path gives $dist(v) \le \delta(v)$.

**Modeling answer template.**
1. *Vertices:* "$V' = \dots$; vertex $(x, i)$ means ..."
2. *Edges:* "for each ... there is an edge from $(x, i)$ to $(y, j)$ iff ..." (directed? weights?)
3. *Algorithm:* "run BFS / WFS / Dijkstra from $(s, \cdot)$; the answer is $dist(\dots)$ / $\min_i dist(t, i)$ / whether $t^*$ is marked."
4. *Correctness:* "legal sequences of moves correspond exactly to walks in $H$ from the start state, one edge per move."
5. *Time:* "$|V'| = \dots$, $|E'| = \dots$, so $O(\dots)$ in terms of the original input."

### Exam checklist

- Vertices of the built graph described in words ("$(x, i)$ means ...") and **counted**.
- Every edge type given by a rule with its conditions (walls, limits, colors, stay-put); directed or not; weights or "unweighted".
- Algorithm named with its start vertex (or super-source), and the answer read off precisely (one vertex, min over copies, a target set, $dist - 1$).
- One-sentence correctness: legal move sequences ↔ walks in $H$.
- Time in the ORIGINAL parameters, including building $H$: e.g. $O(k(V+E))$, $O(n^4)$, $O(L(V+E))$.
- Unit costs ⇒ BFS, not Dijkstra. Lengths in $\{1,2\}$ ⇒ subdivide, still BFS. Real weights ⇒ Dijkstra.
- "From every vertex to the target(s)" ⇒ one search in $rev(G)$ from a super-source.
- "Exactly $L$ steps" ⇒ layered graph (a DAG); $dist \le L$ is not enough.
- Numbers inside states (battery, time, digits) ⇒ say pseudo-polynomial or justify a cap.
`,

  quiz: [
    {
      type: 'mc',
      q: String.raw`A graph is stored as an adjacency matrix. What is the running time of BFS from a single vertex, in the worst case?`,
      choices: [String.raw`$O(V+E)$`, String.raw`$O(V^2)$`, String.raw`$O(E \log V)$`, String.raw`$O(VE)$`],
      answer: 1,
      explain: String.raw`BFS processes each vertex once, and listing the neighbors of a vertex in a matrix requires scanning its whole row, $O(V)$. That gives $O(V \cdot V) = O(V^2)$. The $O(V+E)$ bound assumes adjacency lists, where listing neighbors of $v$ costs $O(1+\deg v)$. Note $O(V^2)$ is never better than $O(V+E)$ since $E = O(V^2)$.`
    },
    {
      type: 'tf',
      q: String.raw`Whatever-first search from $s$ marks a vertex $v$ if and only if $v$ is reachable from $s$, regardless of which data structure is used for the bag.`,
      answer: true,
      explain: String.raw`The reachability guarantee holds for any bag (stack, queue, priority queue, even a random bag). Only the *shape* of the search tree and the running time depend on the bag. Proof: consider the first unmarked vertex on a path from $s$; its predecessor's edge to it must have entered the bag, so it would have been marked.`
    },
    {
      type: 'mc',
      q: String.raw`You run the component-labeling loop (start a new whatever-first search from every unmarked vertex) on an undirected graph with $V$ vertices and $E$ edges stored as adjacency lists. What is the total running time?`,
      choices: [String.raw`$O(V(V+E))$`, String.raw`$O(V+E)$`, String.raw`$O(V^2)$`, String.raw`$O(E \log V)$`],
      answer: 1,
      explain: String.raw`Although there may be many searches, each vertex is marked exactly once and each edge is examined at most twice **in total over all searches**, because a search never re-enters an already-marked vertex's adjacency list. So the total is $O(V+E)$. Multiplying the cost of one search by the number of searches overcounts.`
    },
    {
      type: 'multi',
      q: 'Which of the following correctly compute, for a directed graph with all edge lengths equal to 1, the minimum number of edges from s to every vertex? (select all that apply)',
      choices: ['BFS from s', 'DFS from s', 'Dijkstra from s', 'Whatever-first search with a stack'],
      answer: [0, 2],
      explain: String.raw`BFS computes edge-count distances. Dijkstra works for any nonnegative weights, including all-ones (it is just slower, $O(E \log V)$). DFS (= WFS with a stack) can reach a vertex via a long path first; e.g., with edges $s\to a \to b$ and $s \to b$, DFS may assign $b$ depth 2 while the true distance is 1.`
    },
    {
      type: 'tf',
      q: 'An undirected graph is bipartite if and only if it contains no cycle of odd length.',
      answer: true,
      explain: String.raw`An odd cycle cannot be 2-colored since colors must alternate around it. Conversely, if there is no odd cycle, BFS level-parity coloring works: an edge inside a level would close an odd cycle through the lowest common ancestor of its endpoints.`
    },
    {
      type: 'mc',
      q: String.raw`During BFS from $r$ on an undirected connected graph, you find an edge $uw$ with $u$ and $w$ both at level 5, and their lowest common ancestor in the BFS tree is at level 2. What can you conclude?`,
      choices: [
        'Nothing; BFS levels say nothing about cycles',
        'The graph contains a cycle of length 7, so it is not bipartite',
        'The graph contains a cycle of length 6, so it is bipartite',
        'The graph contains a cycle of length 11'
      ],
      answer: 1,
      explain: String.raw`The tree paths from the LCA $a$ to $u$ and to $w$ each have $5 - 2 = 3$ edges and share only $a$. Together with $uw$ they form a cycle of length $3 + 3 + 1 = 7$, which is odd, so the graph is not bipartite. In general the cycle has length $2(d - d_a) + 1$.`
    },
    {
      type: 'mc',
      q: String.raw`A directed graph has red and blue edges. You want the fewest-edge walk from $s$ to $t$ using **at most $k$** red edges. You build a graph with vertices $V \times \{0, \dots, k\}$ and run BFS. What is the running time in terms of the original input?`,
      choices: [String.raw`$O(V+E)$`, String.raw`$O(k(V+E))$`, String.raw`$O(kV + E)$`, String.raw`$O(2^k (V+E))$`],
      answer: 1,
      explain: String.raw`The new graph has $(k+1)V$ vertices and up to $(k+1)E$ edges (each original edge is copied once per counter value). BFS is linear in the size of the **new** graph, so $O(k(V+E))$. Writing $O(V+E)$ ignores the blowup; writing $O(kV+E)$ forgets that edges are copied too.`
    },
    {
      type: 'tf',
      q: String.raw`In the product-graph model for "walk from $s$ to $t$ with an even number of red edges" (vertices $V \times \{0,1\}$), a path in the product graph always projects to a simple path in the original graph.`,
      answer: false,
      explain: String.raw`A path in the product graph may visit both $(v,0)$ and $(v,1)$, which projects to a walk visiting $v$ twice. That is why such models answer questions about **walks**. (In fact, deciding whether a directed graph has a *simple* $s$-$t$ path of even length is NP-hard, so no simple product trick can solve it.)`
    },
    {
      type: 'mc',
      q: String.raw`An $n \times n$ maze has $k$ distinct colored keys and matching doors. A state-space BFS uses states (cell, set of keys held). Which bound is correct?`,
      choices: [String.raw`$O(n^2)$`, String.raw`$O(k n^2)$`, String.raw`$O(2^k n^2)$`, String.raw`$O(n^{2k})$`],
      answer: 2,
      explain: String.raw`There are $n^2$ cells and $2^k$ possible key sets, so $n^2 2^k$ states, each with at most 4 outgoing moves. BFS takes time linear in this: $O(2^k n^2)$. The counter-style bound $O(kn^2)$ would be correct only if what mattered was *how many* keys you hold rather than *which* ones.`
    },
    {
      type: 'multi',
      q: 'Which of these are good practice when writing a graph-modeling solution on an exam? (select all that apply)',
      choices: [
        'State precisely what each vertex of the new graph represents',
        'Modify Dijkstra/BFS internals rather than building a new graph whenever possible',
        'Give the running time in terms of the original input parameters',
        'Say which vertex the search starts from and how the answer is read off'
      ],
      answer: [0, 2, 3],
      explain: String.raw`Graders want explicit vertices, edges, start/target, algorithm, and time in the original parameters. Modifying a standard algorithm is discouraged: you would need to re-prove its correctness. Building a new graph and calling the algorithm as a black box inherits its correctness for free.`
    },
    {
      type: 'tf',
      q: 'Every walk from u to v contains a path from u to v (using a subset of its edges).',
      answer: true,
      explain: String.raw`If a vertex repeats in the walk, delete the portion between its two occurrences; repeat until no vertex repeats. The result is a path from $u$ to $v$. This is why "reachable by a walk" and "reachable by a path" are the same notion.`
    },
    {
      type: 'mc',
      q: String.raw`Two-jug puzzle: jugs of capacities $a$ and $b$ liters, operations fill/empty/pour. BFS over states $(x, y)$ finds the fewest operations to measure $c$ liters. Is this a polynomial-time algorithm when $a$ and $b$ are given in binary?`,
      choices: [
        String.raw`Yes, it runs in $O(ab)$ time`,
        String.raw`No: $O(ab)$ is exponential in the number of bits of $a$ and $b$`,
        'Yes, because BFS is always linear time',
        'No, because the state graph is infinite'
      ],
      answer: 1,
      explain: String.raw`The state graph has $(a+1)(b+1)$ vertices, so BFS takes $O(ab)$ time. That is polynomial in the *values* (pseudo-polynomial) but exponential in the input length $\Theta(\log a + \log b)$. Whenever a state graph is indexed by numeric values, be explicit about this distinction.`
    },
    {
      type: 'mc',
      q: String.raw`An undirected graph $G$ is given. You build a directed product graph to model a walk where you must alternate between red and blue edges. Why is the product graph directed even though $G$ is undirected?`,
      choices: [
        'Product graphs are always directed',
        String.raw`Because the edge from $(u, \text{last}=\text{red})$ via blue edge $uv$ goes to $(v, \text{last}=\text{blue})$, but the reverse step from $(v,\text{blue})$ back along $uv$ (blue) is not allowed`,
        'Because BFS only works on directed graphs',
        'It is not; the product graph should be undirected'
      ],
      answer: 1,
      explain: String.raw`The state records the color of the last edge. Traversing blue edge $uv$ from state "last was red" lands in state "last was blue", and from there you cannot traverse a blue edge, so the reverse edge does not exist. Whenever the extra information changes asymmetrically, the product graph must be directed.`
    },
    {
      type: 'mc',
      q: String.raw`A road map has positive integer travel times on its edges (some 1, some 7, some 300). A student runs BFS from $s$ and reports $dist(t)$ as the fastest travel time. What is wrong?`,
      choices: [
        'Nothing; BFS works for any positive weights',
        'BFS minimizes the number of edges, not the total weight, so it can return a route with fewer but slower roads',
        'BFS only works on undirected graphs',
        'BFS is correct but too slow; Dijkstra is faster'
      ],
      answer: 1,
      explain: String.raw`BFS is correct only when every edge has the same length. With edges $s \to t$ (300) and $s \to a \to t$ (1 + 1), BFS reports the one-edge route, but the two-edge route takes 2. Use Dijkstra for nonnegative weights. (Subdividing each edge of weight $w$ into $w$ unit edges also works but costs time proportional to the total weight, which is not polynomial when weights are written in binary.)`
    },
    {
      type: 'mc',
      q: String.raw`A grid has $N$ cells, some of which contain fire hydrants. You want, for every cell, the number of steps to the nearest hydrant. What is the best approach?`,
      choices: [
        String.raw`Run BFS from each hydrant and take the minimum per cell: $O(hN)$ for $h$ hydrants`,
        String.raw`Run a single BFS that starts with every hydrant in the queue at distance 0 (equivalently, from a super-source joined to all hydrants): $O(N)$`,
        String.raw`Run BFS from each cell until it finds a hydrant: $O(N^2)$`,
        'Run DFS from an arbitrary hydrant'
      ],
      answer: 1,
      explain: String.raw`Add a super-source $s^*$ with an edge to every hydrant. Then $dist(s^*, x) - 1$ is the distance from $x$ to the nearest hydrant, and one BFS computes it for all cells in time linear in the grid. Starting BFS with all hydrants enqueued at distance 0 is the same computation without the extra vertex. The other options are correct but slower, or (DFS) wrong.`
    },
    {
      type: 'tf',
      q: 'A connected undirected simple graph with V vertices contains a cycle if and only if it has at least V edges.',
      answer: true,
      explain: String.raw`A connected graph with no cycle is a tree, and every tree has exactly $V-1$ edges. So a connected graph with $E \ge V$ edges is not a tree and must contain a cycle; conversely a connected graph with a cycle has at least $V$ edges, since deleting one cycle edge leaves it connected with $E-1 \ge V-1$ edges. This gives a quick $O(V+E)$ cycle test for undirected graphs: count components $c$; the graph is acyclic iff $E = V - c$.`
    },
    {
      type: 'mc',
      q: String.raw`A robot on an $n \times n$ grid can move forward one cell, turn left, or turn right; each command takes one second. You model it for BFS. How many vertices does the state graph need, and is it directed?`,
      choices: [
        String.raw`$n^2$ vertices, undirected`,
        String.raw`$4n^2$ vertices, undirected`,
        String.raw`$4n^2$ vertices, directed`,
        String.raw`$n^2$ vertices, directed`
      ],
      answer: 2,
      explain: String.raw`The available moves depend on both the cell and the heading, so states are (cell, heading): $4n^2$. Moving forward from $(x, N)$ to $(y, N)$ cannot be reversed by one command (you would have to turn around first), so the graph is directed. BFS takes $O(n^2)$.`
    },
    {
      type: 'mc',
      q: String.raw`Two tokens sit on a connected undirected graph with $V$ vertices and $E$ edges. Each round, **both** tokens move along an edge. How many edges does the configuration graph on $V \times V$ have?`,
      choices: [String.raw`$O(V+E)$`, String.raw`$\Theta(VE)$`, String.raw`exactly $4E^2$ (directed edges)`, String.raw`$\Theta(V^2)$`],
      answer: 2,
      explain: String.raw`From $(x, y)$ the joint moves are all pairs (move of token 1, move of token 2): $\deg(x)\deg(y)$ of them. Summing over all pairs, $\sum_x\sum_y \deg(x)\deg(y) = (\sum_x \deg x)^2 = (2E)^2 = 4E^2$. The $\Theta(VE)$ count is for the variant where only one token moves per round.`
    },
    {
      type: 'mc',
      q: String.raw`You want the shortest walk from $s$ to $t$ in a directed graph whose length is congruent to $r \pmod m$. What is the running time of BFS on the appropriate product graph?`,
      choices: [String.raw`$O(V+E)$`, String.raw`$O(m(V+E))$`, String.raw`$O(m^2 (V+E))$`, String.raw`$O((V+E)\log m)$`],
      answer: 1,
      explain: String.raw`Vertices $(v, j)$ for $j \in \mathbb{Z}_m$ and edges $(u, j) \to (v, j+1 \bmod m)$: $mV$ vertices and $mE$ edges. BFS from $(s, 0)$ and read $dist(t, r)$. Time $O(m(V+E))$.`
    },
    {
      type: 'tf',
      q: 'Every tree is bipartite.',
      answer: true,
      explain: String.raw`A tree has no cycles, so in particular no odd cycles. Concretely, root it anywhere and color vertices by the parity of their depth; every edge joins a parent and child, whose depths differ by one.`
    },
    {
      type: 'tf',
      q: 'Generalizing the BFS 2-coloring algorithm gives a linear-time algorithm to decide whether a graph can be properly colored with 3 colors.',
      answer: false,
      explain: String.raw`3-coloring is NP-hard. 2-coloring is easy because coloring one vertex forces the colors of all its neighbors, and hence of its whole component. With three colors a neighbor has two possible colors, and greedy choices can fail in ways that require backtracking.`
    },
    {
      type: 'mc',
      q: String.raw`An $n \times n$ grid has walls; you may break through at most $k$ walls. You BFS over states (cell, walls broken so far). What is the running time?`,
      choices: [String.raw`$O(n^2)$`, String.raw`$O(kn^2)$`, String.raw`$O(2^k n^2)$`, String.raw`$O(n^{2k})$`],
      answer: 1,
      explain: String.raw`States are $(x, b)$ with $0 \le b \le k$: $(k+1)n^2$ of them, each with at most 4 out-edges. Only the **number** of walls broken matters for future legality, not which ones (a shortest route never needs to re-enter a broken wall), so no $2^k$ subset state is needed. Compare the keys-and-doors maze, where *which* keys you hold matters and the state is a subset.`
    },
    {
      type: 'tf',
      q: 'In BFS on an undirected graph, every edge (tree or not) joins two vertices whose BFS levels differ by at most 1.',
      answer: true,
      explain: String.raw`If $uw$ is an edge and $u$ is dequeued first, then when $u$ scans $uw$, $w$ is either undiscovered (and gets level $level(u)+1$) or was discovered by a vertex dequeued no later than $u$ (so its level is at most $level(u)+1$). And $level(w) \ge level(u)$ because $w$ is dequeued after $u$. So the levels differ by 0 or 1. In a **directed** graph, an edge can go from a deep level back to a much shallower one, but never forward by more than one level.`
    },
    {
      type: 'mc',
      q: 'Moving between adjacent maze cells costs 1, but while standing on a teleporter pad you may (if you wish) jump to its partner pad at cost 0. Which method correctly finds the cheapest route?',
      choices: [
        'Plain BFS, treating the teleport as an ordinary edge',
        'Plain BFS on the graph with teleporter edges contracted (merge each pad with its partner), or Dijkstra / 0-1 BFS on the original graph',
        'DFS, since teleports make distances irrelevant',
        'There is no polynomial-time method'
      ],
      answer: 1,
      explain: String.raw`Plain BFS treats every edge as length 1 and would overcount teleports. Zero-cost moves can be handled by merging the two endpoints of each zero-cost edge into one vertex (then BFS is correct), or by Dijkstra on the 0/1-weighted graph, or by the 0-1 BFS deque trick. If the teleport costs 1 like any other move, plain BFS is fine.`
    },
    {
      type: 'mc',
      q: String.raw`You must find the fewest edges in a walk from $s$ to $t$ that visits at least one red vertex. What extra information should each state carry?`,
      choices: [
        'The set of red vertices visited so far',
        'A single bit: whether some red vertex has been visited yet',
        'The number of red vertices visited so far, up to V',
        'Nothing; run BFS from s and check whether the BFS path to t hits a red vertex'
      ],
      answer: 1,
      explain: String.raw`Future legality depends only on whether the requirement is already met, so a one-way flag suffices: $V \times \{0,1\}$, $O(V+E)$. Tracking the set is exponential and unnecessary. The last option fails because the BFS path to $t$ is just one shortest path; a slightly longer walk through a red vertex might be the intended answer.`
    },
    {
      type: 'mc',
      q: String.raw`An undirected graph has $V$ vertices, $E$ edges and $c$ connected components. What is the minimum number of edges that must be added to make it connected?`,
      choices: [String.raw`$c$`, String.raw`$c - 1$`, String.raw`$V - 1 - E$`, String.raw`$V - c$`],
      answer: 1,
      explain: String.raw`Adding one edge merges at most two components, decreasing the count by at most one, so at least $c-1$ edges are needed; joining a representative of component $i$ to one of component $i+1$ for $i = 1..c-1$ achieves it. $V - 1 - E$ is wrong when the graph has cycles (extra edges inside components do not help connect).`
    },
    {
      type: 'multi',
      q: 'Which of the following can be decided in O(V+E) time? (select all that apply)',
      choices: [
        'Whether an undirected graph is bipartite',
        'Whether a given edge uv of an undirected graph lies on some cycle',
        'Whether a directed graph has a simple s-t path of even length',
        'Whether there is a walk from s to t with an odd number of edges'
      ],
      answer: [0, 1, 3],
      explain: String.raw`Bipartiteness: BFS 2-coloring. Edge on a cycle: delete $uv$ and check whether $u$ still reaches $v$. Odd walk: BFS on $V \times \{0,1\}$. The simple-path version with a parity constraint in directed graphs is NP-hard; the product graph only handles walks.`
    },
    {
      type: 'mc',
      q: String.raw`Two robots move on an $n \times n$ grid with walls; in each step **exactly one** robot moves to an adjacent open cell, and they may never share a cell. You BFS over configurations. What is the running time in terms of $n$?`,
      choices: [String.raw`$O(n^2)$`, String.raw`$O(n^4)$`, String.raw`$O(n^8)$`, String.raw`$O(V+E)$, so linear`],
      answer: 1,
      explain: String.raw`A configuration is a pair of cells, so there are at most $(n^2)^2 = n^4$ vertices, and each has at most $4 + 4 = 8$ out-edges (either robot moves in one of 4 directions). BFS is therefore $O(n^4)$. $O(n^2)$ forgets that the state is a *pair*; $O(n^8)$ squares the vertex count as if every pair of configurations were adjacent. "$O(V+E)$" is true of the built graph but not an answer: the grader wants the bound in terms of the original input size $n$.`
    },
    {
      type: 'tf',
      q: String.raw`In BFS from $s$ on a **directed** graph, an edge $u \to v$ can join a vertex at level 5 to a vertex at level 2.`,
      answer: true,
      explain: String.raw`In a directed graph the only restriction is $dist(v) \le dist(u) + 1$ for every edge $u \to v$ (the edge gives a walk to $v$ of length $dist(u)+1$). Nothing stops an edge from pointing back to a much earlier level, e.g. a long path $s \to a \to b \to c \to d \to e$ plus the edge $e \to b$. The "levels differ by at most 1" fact is for **undirected** graphs, where every edge can be used in both directions.`
    },
    {
      type: 'mc',
      q: String.raw`For a directed graph $G$ and a vertex $t$, you must find **every** vertex that can reach $t$. Which is the best correct approach?`,
      choices: [
        String.raw`Run BFS from every vertex $v$ and check whether $t$ is marked: $O(V(V+E))$`,
        String.raw`Run one search from $t$ in $G$: $O(V+E)$`,
        String.raw`Run one search from $t$ in $rev(G)$: $O(V+E)$`,
        String.raw`Compute a topological order and scan it: $O(V+E)$`
      ],
      answer: 2,
      explain: String.raw`$v$ reaches $t$ in $G$ iff $t$ reaches $v$ in the reversed graph, so one search from $t$ in $rev(G)$ marks exactly the right set in $O(V+E)$ (building $rev(G)$ is also $O(V+E)$). Searching from $t$ in $G$ finds the vertices $t$ reaches, the wrong direction. Running a BFS per vertex is correct but a factor of $V$ too slow, and a topological order need not exist.`
    },
    {
      type: 'multi',
      q: 'Each problem below is on a graph with V vertices and E edges. Which can be solved in polynomial time by one BFS/WFS on a suitably built graph? (select all that apply)',
      choices: [
        'Fewest edges in an s-t walk with an even number of edges',
        'Longest simple s-t path',
        'Fewest edges in an s-t walk using at most k red edges (k ≤ E)',
        'Whether some s-t path visits every vertex exactly once',
        'Fewest knight moves between two squares of an n×n board with some squares blocked'
      ],
      answer: [0, 2, 4],
      explain: String.raw`Parity: $V \times \{0,1\}$. At most $k$ red edges: $V \times \{0, \dots, k\}$, polynomial because $k \le E$. Knight moves: an implicit graph on $n^2$ squares with at most 8 moves each. Longest simple path and Hamiltonian path are NP-hard: the constraint "never repeat a vertex" would require the state to remember the whole set of visited vertices, which is exponential. Product graphs handle constraints that need a *small* memory.`
    },
    {
      type: 'mc',
      q: String.raw`Every edge of a directed graph has length 1 or 2. Which method computes all shortest-path distances from $s$ correctly **and** in $O(V+E)$ time?`,
      choices: [
        'BFS, ignoring the lengths',
        'Dijkstra with a binary heap',
        'Replace each length-2 edge u→v by u→x→v through a new vertex x, then BFS',
        'BFS, but add 2 instead of 1 when crossing a length-2 edge'
      ],
      answer: 2,
      explain: String.raw`Subdividing gives a graph in which every edge has length 1 and path lengths are preserved, with at most $V + E$ vertices and $2E$ edges, so BFS runs in $O(V+E)$. Ignoring lengths is wrong. Dijkstra is correct but $O(E \log V)$, not linear. "BFS adding 2" is a modified algorithm that is **wrong**: with edges $s \to x$ (2), $x \to y$ (1), $s \to a$ (1), $a \to y$ (1), scanning $x$ before $a$ discovers $y$ at "distance" 3, although $s \to a \to y$ has length 2, and BFS never revisits a discovered vertex.`
    },
    {
      type: 'mc',
      q: String.raw`A student claims: "there is a walk from $s$ to $t$ with **exactly** $L$ edges iff BFS from $s$ gives $dist(t) \le L$." What is the right verdict?`,
      choices: [
        'Correct: pad a shortest walk with extra edges',
        'Wrong in general; use the layered graph V × {0, ..., L} and check (t, L), O(L(V+E)) time',
        'Correct for undirected graphs, so it is correct in general',
        'Wrong; the problem is NP-hard'
      ],
      answer: 1,
      explain: String.raw`A walk cannot wait in place, so a short walk does not extend to every longer length. Directed counterexample: the single edge $s \to t$ and $L = 2$. It even fails for undirected graphs: in a bipartite graph every $s$-$t$ walk has the same parity, so if $dist(t) = 1$ there is no walk of length 2. The fix is a layered graph: $(v, i)$ = "at $v$ after exactly $i$ edges", edges $(u, i) \to (v, i+1)$, which is a DAG with $(L+1)V$ vertices and $LE$ edges.`
    },
    {
      type: 'mc',
      q: String.raw`In a directed graph, which vertices lie on **some walk** from $s$ to $t$?`,
      choices: [
        String.raw`Exactly the vertices reachable from $s$`,
        String.raw`Exactly the vertices reachable from $s$ that can also reach $t$`,
        String.raw`Exactly the vertices on the BFS tree path from $s$ to $t$`,
        String.raw`Exactly the vertices in the strongly connected component of $s$`
      ],
      answer: 1,
      explain: String.raw`$v$ is on an $s$-$t$ walk iff $s \leadsto v$ and $v \leadsto t$ (glue the two walks at $v$; walks may repeat vertices, so no disjointness is needed). Compute the first set by a search from $s$ in $G$ and the second by a search from $t$ in $rev(G)$, then intersect: $O(V+E)$. For *paths* (no repeats) the question is much harder in directed graphs, so read whether the problem says walk or path.`
    },
    {
      type: 'tf',
      q: 'Whatever-first search using a priority queue keyed by EDGE WEIGHT computes shortest-path distances from s.',
      answer: false,
      explain: String.raw`Keyed by the weight of the single edge, the bag produces **Prim's** minimum spanning tree, not shortest paths. To get Dijkstra the key must be the tentative **distance** $dist(u) + w(u \to v)$. Example: edges $s \to a$ (1), $a \to b$ (1), $s \to b$ (1.5). Prim attaches $b$ through $a$ (edge weight 1 is smaller than 1.5), giving $b$ a tree path of length 2, but $dist(b) = 1.5$.`
    },
    {
      type: 'tf',
      q: 'For a connected undirected graph and a start vertex s, the BFS tree and every DFS tree rooted at s have the same depth.',
      answer: false,
      explain: String.raw`On the triangle $s, a, b$, the BFS tree has depth 1 (both $a$ and $b$ are neighbors of $s$), but DFS goes $s \to a \to b$ and has depth 2. BFS trees are shortest-path trees, so their depth is the largest distance from $s$; DFS trees can be as deep as $V - 1$ even when every vertex is a neighbor of $s$. Both run in $O(V+E)$; only BFS answers distance questions.`
    },
    {
      type: 'mc',
      q: String.raw`An exam asks for the fewest moves in a puzzle whose state graph has $N$ states and $M$ moves, every move counting as one step. You correctly model it and run Dijkstra. What is the likely grading outcome?`,
      choices: [
        'Full credit: Dijkstra is always at least as good as BFS',
        'Zero: Dijkstra is incorrect on unweighted graphs',
        'Correct answer, but a time bound of O(M log N) instead of O(N + M); points lost for efficiency',
        'Correct and equally fast, since all weights are 1'
      ],
      answer: 2,
      explain: String.raw`Dijkstra is correct with nonnegative weights, so the answer is right, but it costs $O(M \log N)$ with a binary heap, while BFS solves unit-weight shortest paths in $O(N + M)$. When the intended solution is linear, the extra log factor typically loses efficiency points. Use BFS whenever every edge has the same length.`
    }
  ],

  flashcards: [
    { front: 'Adjacency list vs matrix: space and neighbor-listing cost', back: String.raw`List: $O(V+E)$ space, neighbors of $v$ in $O(1+\deg v)$, edge test $O(\deg u)$. Matrix: $O(V^2)$ space, edge test $O(1)$, neighbors in $O(V)$.` },
    { front: 'Whatever-first search: what does it compute and how fast?', back: String.raw`Marks exactly the vertices reachable from $s$; parent pointers form a spanning tree of them. $O(V+E)$ with stack/queue; $O(E \log V)$ with a priority queue.` },
    { front: 'Bag = stack / queue / priority queue gives...', back: 'Stack: DFS. Queue: BFS. Priority queue: Prim (key = edge weight) or Dijkstra (key = tentative distance).' },
    { front: 'What does BFS compute?', back: String.raw`Minimum number of edges from $s$ to each vertex (unweighted shortest paths), plus a shortest-path tree. $O(V+E)$.` },
    { front: 'Why is counting components $O(V+E)$ and not $O(V(V+E))$?', back: 'Each vertex is marked once and each edge examined at most twice across ALL the searches combined; marked vertices are never re-explored.' },
    { front: 'Characterization of bipartite graphs', back: String.raw`Bipartite $\iff$ no odd cycle. Test: BFS-color levels by parity; an edge within a level gives an odd cycle of length $2(d-d_a)+1$ through the LCA.` },
    { front: 'Modeling recipe (5 parts)', back: '1) vertices = states and their meaning; 2) edges = legal moves; 3) start, target(s), algorithm; 4) correctness: walks ↔ solutions; 5) running time in original parameters.' },
    { front: 'Product graph for "even number of red edges"', back: String.raw`$V \times \{0,1\}$. Blue $u\to v$: $(u,b)\to(v,b)$. Red $u \to v$: $(u,b) \to (v,1-b)$. Search from $(s,0)$, check $(t,0)$. $O(V+E)$.` },
    { front: 'Product graph for "at most k red edges"', back: String.raw`$V \times \{0..k\}$; red edges increment the counter, no edge past $k$. BFS from $(s,0)$, answer $\min_i dist(t,i)$. $O(k(V+E))$.` },
    { front: 'Walk with labels accepted by a DFA M', back: String.raw`Product $V \times Q$: edge $u \xrightarrow{a} v$ and state $q$ give $(u,q) \to (v, \delta(q,a))$. Search from $(s, q_0)$; target any $(t, f)$ with $f$ accepting. $O(|Q|(V+E))$.` },
    { front: 'Two tokens on a graph (state space size)', back: String.raw`States $(u,v) \in V \times V$; moving one token gives $\deg(u)+\deg(v)$ edges out of $(u,v)$, so $O(V^2)$ vertices and $O(VE)$ edges; BFS $O(VE)$ (for connected graphs).` },
    { front: 'Walk vs path in product-graph models', back: 'Product graphs certify WALKS (vertices may repeat with different extra state). Simple-path constraints (e.g. even-length simple path in a digraph) can be NP-hard.' },
    { front: 'BFS correctness proof: three ingredients', back: String.raw`(1) $dist(v)$ is the length of a real walk, so $dist \ge \delta$. (2) The queue holds nondecreasing distances spanning at most two consecutive values. (3) Induction on $\delta(v)$ along a shortest path gives $dist \le \delta$.` },
    { front: 'Multi-source BFS', back: String.raw`Distance from every vertex to the NEAREST of several sources: add a super-source joined to all sources (or enqueue all of them at distance 0). One BFS, $O(V+E)$.` },
    { front: 'Robot with a heading (forward / turn left / turn right)', back: String.raw`States (cell, heading): $4n^2$ vertices, 3 out-edges each, directed. BFS from (s, N); answer $\min_h dist(t, h)$. $O(n^2)$.` },
    { front: 'Obstacle on a periodic schedule (period p)', back: String.raw`States (position, time mod $p$); every move advances the clock coordinate by 1. BFS; $O(p \cdot (V+E))$. Waiting in place is an edge $(x, j) \to (x, j+1)$ if allowed.` },
    { front: 'Grid with at most k wall breaks', back: String.raw`States (cell, walls broken so far), $0..k$; entering a wall moves up one layer. BFS; answer $\min_b dist(\text{goal}, b)$. $O(kn^2)$. Only the count matters, not which walls.` },
    { front: 'Two tokens that BOTH move each round: graph size', back: String.raw`$V^2$ states; $(x,y)$ has $\deg x \cdot \deg y$ out-edges, total $(2E)^2$. BFS $O(V^2 + E^2)$. (One token per round: $O(VE)$.)` },
    { front: '"Same team / different team" constraints', back: String.raw`Edge labels 0 (same) / 1 (different). BFS, set $c(w) = c(u) \oplus label(uw)$, check every edge. Inconsistent iff some cycle has an odd number of "different" edges. $O(V+E)$.` },
    { front: 'Minimum edges to add to connect an undirected graph', back: String.raw`(number of components) $- 1$. Lower bound: each new edge merges at most two components. Upper bound: chain one representative per component.` },
    { front: 'Does edge uv lie on a cycle (undirected)?', back: String.raw`Delete $uv$; it lies on a cycle iff $u$ still reaches $v$. $O(V+E)$. (Edges on no cycle are called bridges.)` },
    { front: 'Walk with EXACTLY L edges from s to t', back: String.raw`Layered graph: $(v, i)$ for $0 \le i \le L$, edges $(u, i) \to (v, i+1)$. Check whether $(t, L)$ is reachable from $(s, 0)$. $O(L(V+E))$. It is a DAG even if $G$ has cycles. "$dist(t) \le L$" is NOT equivalent: walks cannot wait.` },
    { front: 'Shortest paths when every edge has length 1 or 2', back: String.raw`Subdivide each length-2 edge $u \to v$ into $u \to x \to v$ with a new vertex $x$; BFS on the result. At most $V+E$ vertices and $2E$ edges: $O(V+E)$. (Dijkstra is correct but $O(E \log V)$.)` },
    { front: 'Which vertices lie on some s→t WALK?', back: String.raw`Those reachable from $s$ (search in $G$) that also reach $t$ (search from $t$ in $rev(G)$). Intersect: $O(V+E)$.` },
    { front: 'Which vertices lie on some SHORTEST s→t path (unweighted)?', back: String.raw`BFS from $s$ in $G$ gives $d_s$; BFS from $t$ in $rev(G)$ gives $d_t$. Vertex $v$ qualifies iff $d_s(v) + d_t(v) = d_s(t) < \infty$; edge $u \to v$ iff $d_s(u) + 1 + d_t(v) = d_s(t)$. $O(V+E)$.` },
    { front: 'Distance from EVERY vertex to the nearest target in a directed graph', back: String.raw`Reverse all edges, add a super-source joined to every target (or start BFS with all targets at distance 0), run one BFS. $O(V+E)$, not one BFS per vertex.` },
    { front: 'Fewest buses / fewest groups to change through', back: String.raw`Bipartite graph: a vertex per stop and per route, an edge stop–route when the route serves the stop. BFS from stop $s$; buses $= dist(t)/2$. Size: stops + routes + total route length. Do NOT connect all stops on a route pairwise (quadratic).` },
    { front: 'BFS levels: undirected vs directed', back: String.raw`Every edge $u \to v$ satisfies $level(v) \le level(u) + 1$. Undirected: also $level(u) \le level(v) + 1$, so levels differ by at most 1. Directed: an edge can point back to ANY earlier level.` },
    { front: 'State graph size for a grid with extra state', back: String.raw`$n \times n$ grid, extra state from a set of size $x$: at most $x n^2$ vertices and $4 x n^2$ edges, so BFS is $O(x n^2)$. Two robots (one moves per step): $n^4$ states, 8 moves each, $O(n^4)$.` }
  ],

  problems: [
    {
      id: 'graphs-components-code', type: 'code', title: 'Count connected components', difficulty: 1,
      prompt: String.raw`Write <code>countComponents(n, edges)</code> that returns the number of connected components of an undirected graph with vertices <code>0..n-1</code>. <code>edges</code> is an array of pairs <code>[u, v]</code>; it may contain duplicate edges and self-loops. Isolated vertices are components of size 1. Aim for $O(V+E)$.`,
      fn: 'countComponents',
      starter: 'function countComponents(n, edges) {\n  // build adjacency lists, then run a search from every unmarked vertex\n}\n',
      reference: function (n, edges) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
        const mark = new Array(n).fill(false);
        let count = 0;
        for (let s = 0; s < n; s++) {
          if (mark[s]) continue;
          count++;
          const stack = [s]; mark[s] = true;
          while (stack.length) {
            const u = stack.pop();
            for (const w of adj[u]) if (!mark[w]) { mark[w] = true; stack.push(w); }
          }
        }
        return count;
      },
      tests: [
        [0, []],
        [1, []],
        [5, []],
        [5, [[0, 1], [1, 2], [3, 4]]],
        [6, [[0, 1], [1, 2], [2, 0], [2, 3], [4, 5]]],
        [4, [[0, 0], [1, 1], [0, 1], [1, 0]]],
        [7, [[0, 6], [6, 5], [5, 4], [4, 3], [3, 2], [2, 1]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 12);
        const m = Math.floor(Math.random() * 14);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        return [n, edges];
      },
      hints: [
        'Build an adjacency list: for each edge [u, v] push v onto adj[u] and u onto adj[v].',
        'Loop over all vertices; each time you find an unmarked vertex, increment the count and mark everything reachable from it.'
      ],
      solution: String.raw`Build adjacency lists in $O(V+E)$. Then for $s = 0, \dots, n-1$: if $s$ is unmarked, increment the counter and run a whatever-first search (an explicit stack avoids recursion-depth issues) that marks every vertex reachable from $s$. Each vertex is pushed once and each adjacency entry scanned once across all searches, so the total time is $O(V+E)$. Self-loops and duplicate edges are harmless: they only cause already-marked vertices to be inspected again.

~~~pseudo
count <- 0
for s in 0..n-1:
    if not marked[s]:
        count <- count + 1
        stack <- [s]; marked[s] <- true
        while stack nonempty:
            u <- pop
            for w in adj[u]:
                if not marked[w]: marked[w] <- true; push w
return count
~~~`
    },
    {
      id: 'graphs-bfs-code', type: 'code', title: 'BFS distances in a directed graph', difficulty: 1,
      prompt: String.raw`Write <code>bfsDist(n, edges, s)</code> for a **directed** graph on vertices <code>0..n-1</code> with edge list <code>edges</code> (pairs <code>[u, v]</code> meaning $u \to v$). Return an array <code>d</code> of length <code>n</code> where <code>d[v]</code> is the minimum number of edges on a path from <code>s</code> to <code>v</code>, or <code>-1</code> if <code>v</code> is unreachable. <code>d[s] = 0</code>.`,
      fn: 'bfsDist',
      starter: 'function bfsDist(n, edges, s) {\n  // return array of edge-count distances, -1 if unreachable\n}\n',
      reference: function (n, edges, s) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) adj[u].push(v);
        const d = new Array(n).fill(-1);
        d[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          for (const v of adj[u]) if (d[v] === -1) { d[v] = d[u] + 1; q.push(v); }
        }
        return d;
      },
      tests: [
        [1, [], 0],
        [3, [[0, 1], [1, 2]], 0],
        [3, [[0, 1], [1, 2]], 2],
        [7, [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [2, 5], [5, 4], [4, 6]], 0],
        [5, [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]], 0],
        [5, [[4, 3], [3, 2], [2, 1], [1, 0], [0, 4]], 0],
        [4, [[0, 0], [0, 1], [1, 0], [2, 3]], 1]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10);
        const m = Math.floor(Math.random() * 20);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        return [n, edges, Math.floor(Math.random() * n)];
      },
      hints: [
        'Use a queue. When you first discover a vertex, its distance is one more than the vertex you discovered it from.',
        'In JavaScript, an array with a moving head index is an O(1) queue; Array.shift is O(n).'
      ],
      solution: String.raw`Standard BFS. Initialize every distance to $-1$ (unvisited) and $d[s] = 0$; enqueue $s$. Repeatedly dequeue $u$ and, for each out-neighbor $v$ with $d[v] = -1$, set $d[v] = d[u] + 1$ and enqueue $v$. Because BFS dequeues vertices in nondecreasing order of distance, the first time a vertex is discovered is along a shortest path. Time $O(V + E)$.`
    },
    {
      id: 'graphs-evenwalk-code', type: 'code', title: 'Shortest even-length walk', difficulty: 2,
      prompt: String.raw`Write <code>evenWalk(n, edges, s, t)</code> for an **undirected** graph on vertices <code>0..n-1</code> (edge list of pairs). Return the minimum number of edges in a walk from <code>s</code> to <code>t</code> that uses an **even** number of edges (vertices and edges may repeat), or <code>-1</code> if no such walk exists. A walk of length 0 counts, so if <code>s === t</code> the answer is 0.

This is a modeling problem: think about what extra information you must remember.`,
      fn: 'evenWalk',
      starter: 'function evenWalk(n, edges, s, t) {\n  // BFS on a product graph with vertices (v, parity)\n}\n',
      reference: function (n, edges, s, t) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
        const d = new Array(2 * n).fill(-1);
        d[2 * s] = 0;
        const q = [2 * s];
        for (let h = 0; h < q.length; h++) {
          const x = q[h];
          const u = x >> 1, p = x & 1;
          for (const v of adj[u]) {
            const y = 2 * v + (1 - p);
            if (d[y] === -1) { d[y] = d[x] + 1; q.push(y); }
          }
        }
        return d[2 * t];
      },
      tests: [
        [1, [], 0, 0],
        [2, [[0, 1]], 0, 1],
        [3, [[0, 1], [1, 2], [2, 0]], 0, 1],
        [4, [[0, 1], [1, 2], [2, 3]], 0, 3],
        [4, [[0, 1], [1, 2], [2, 3]], 0, 2],
        [2, [[0, 1]], 0, 0],
        [5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], 0, 1],
        [4, [[0, 1], [2, 3]], 0, 3]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const m = Math.floor(Math.random() * 14);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
      },
      hints: [
        'The parity of the number of edges used so far is the only extra information you need.',
        'Build (implicitly) a graph on vertices (v, p) for p in {0,1}; each edge uv gives (u,p)-(v,1-p) and (v,p)-(u,1-p). BFS from (s,0) and read dist(t,0).'
      ],
      solution: String.raw`**Model.** Let $H$ have vertex set $V \times \{0,1\}$, where $(v,p)$ means "at $v$ after a walk whose length has parity $p$". For each edge $uv$ of $G$ and each $p$, add edges $(u,p)$–$(v,1-p)$. Walks in $G$ from $s$ of length $\ell$ ending at $v$ correspond exactly to walks in $H$ from $(s,0)$ of length $\ell$ ending at $(v, \ell \bmod 2)$.

**Algorithm.** BFS in $H$ from $(s,0)$; return $dist_H((t,0))$, or $-1$ if it is infinite.

**Time.** $H$ has $2V$ vertices and $2E$ edges, so $O(V+E)$. In code, encode $(v,p)$ as the integer $2v+p$.

Note an even walk from $s$ to $t$ exists iff $s$ and $t$ are in the same component and either the component has an odd cycle or $s$, $t$ are on the same side of its bipartition; the BFS handles all cases uniformly.`
    },
    {
      id: 'graphs-red-parity', type: 'written', title: 'Even number of red edges', difficulty: 2,
      prompt: String.raw`Let $G = (V,E)$ be a directed graph in which every edge is colored red or blue, and let $s, t$ be vertices. Describe and analyze an algorithm to decide whether there is a walk from $s$ to $t$ that uses an **even, positive** number of red edges (so at least 2).`,
      rubric: [
        'Defines the vertex set of the new graph and the meaning of each vertex precisely',
        'Defines the edges precisely for both colors',
        'Correctly handles "positive": the walk must use at least one red edge (state must distinguish 0 from even positive)',
        'Names the algorithm, start vertex and target vertex',
        'Running time O(V+E) justified by counting vertices and edges of the new graph'
      ],
      hints: [
        'Parity alone is not enough: "zero red edges" and "two red edges" both have parity 0, but only one is allowed.',
        'Use three states: 0 = no red edges yet, 1 = odd number, 2 = even and at least 2.'
      ],
      solution: String.raw`**Vertices.** $V' = V \times \{\mathtt{zero}, \mathtt{odd}, \mathtt{even}\}$. Vertex $(v, \mathtt{zero})$ means we are at $v$ having used no red edges; $(v, \mathtt{odd})$ means an odd number; $(v, \mathtt{even})$ means an even number that is at least 2.

**Edges.** For each blue edge $u \to v$ in $G$, add $(u, x) \to (v, x)$ for each of the three states $x$. For each red edge $u \to v$, add
$(u, \mathtt{zero}) \to (v, \mathtt{odd})$, $(u, \mathtt{odd}) \to (v, \mathtt{even})$, $(u, \mathtt{even}) \to (v, \mathtt{odd})$.

**Algorithm.** Run whatever-first search (e.g., DFS or BFS) in $G'$ from $(s, \mathtt{zero})$. Answer YES iff $(t, \mathtt{even})$ is marked.

**Correctness.** By induction on the number of edges, there is a walk in $G$ from $s$ to $v$ using exactly $r$ red edges iff there is a walk in $G'$ from $(s,\mathtt{zero})$ to $(v, \sigma(r))$, where $\sigma(0) = \mathtt{zero}$, $\sigma(r) = \mathtt{odd}$ for odd $r$, $\sigma(r) = \mathtt{even}$ for even $r \ge 2$. Each step of a walk in $G$ maps to exactly one edge in $G'$ and vice versa, because the edge rules above implement $r \mapsto r$ (blue) and $r \mapsto r+1$ (red) on the class $\sigma(r)$.

**Time.** $|V'| = 3V$ and $|E'| = 3E$, so the search takes $O(V + E)$ time.

(Without the word "positive", two states $V \times \{0,1\}$ suffice.)`
    },
    {
      id: 'graphs-kred-bfs', type: 'written', title: 'Fewest edges with at most k red edges', difficulty: 2,
      prompt: String.raw`$G=(V,E)$ is a directed graph with each edge red or blue, and $k \ge 0$ is an integer. Describe an algorithm that computes the minimum number of edges in a walk from $s$ to $t$ that uses **at most $k$ red edges** (or reports that no such walk exists). Analyze its running time in terms of $V$, $E$ and $k$.`,
      rubric: [
        'Vertices (v, i) with 0 <= i <= k and their meaning',
        'Blue edges keep the counter, red edges increment it, no edges exceed k',
        'BFS from (s,0); answer is min over i of dist(t,i) (or super-target)',
        'Running time O(k(V+E)), with justification'
      ],
      hints: ['The extra information is how many red edges you have used so far, capped at k.'],
      solution: String.raw`Build $H$ with vertices $(v, i)$ for $v \in V$, $0 \le i \le k$: "at $v$ having used exactly $i$ red edges".

- Blue edge $u \to v$: edges $(u,i) \to (v,i)$ for $0 \le i \le k$.
- Red edge $u \to v$: edges $(u,i) \to (v,i+1)$ for $0 \le i \le k-1$.

Walks in $G$ from $s$ with $i \le k$ red edges ending at $v$ correspond, step for step and with the same length, to walks in $H$ from $(s,0)$ to $(v,i)$; walks with more than $k$ red edges have no counterpart because no edge leaves level $k$ along a red edge.

Run BFS in $H$ from $(s,0)$ and return $\min_{0\le i\le k} dist((t,i))$ (infinite means no valid walk).

$H$ has $(k+1)V$ vertices and at most $(k+1)E$ edges, so BFS takes $O((k+1)(V+E)) = O(k(V+E))$ time for $k \ge 1$.

**Refinement (optional).** If $k \ge V-1$, the constraint is irrelevant: a fewest-edge walk from $s$ to $t$ ignoring colors is a simple path with at most $V-1$ edges, hence at most $V - 1 \le k$ red edges. So we may replace $k$ by $\min(k, V-1)$, giving $O(\min(k, V) \cdot (V+E))$ time, which is polynomial even if $k$ is huge and written in binary.`
    },
    {
      id: 'graphs-bipartite-oddcycle', type: 'written', title: 'Bipartite or odd cycle certificate', difficulty: 2,
      prompt: String.raw`Describe an $O(V+E)$-time algorithm that, given a connected undirected graph $G$, either outputs a bipartition $(L,R)$ of $V$ such that every edge crosses it, or outputs an explicit **odd cycle** in $G$. Prove that your output is correct.`,
      rubric: [
        'BFS from an arbitrary root, color by level parity',
        'Checks every edge for equal colors',
        'Constructs the odd cycle from the two tree paths to the LCA plus the offending edge',
        'Proves the cycle is odd (and is a genuine cycle: the two paths are disjoint except at the LCA)',
        'O(V+E) time, including the time to find the LCA by walking up parent pointers'
      ],
      hints: [
        'In BFS on an undirected graph, every edge joins vertices whose levels differ by at most 1.',
        'If uw joins two vertices at the same level, walk both up the tree in lockstep until they meet.'
      ],
      solution: String.raw`**Algorithm.** Run BFS from an arbitrary root $r$, recording $level(v)$ and $parent(v)$. Let $L$ be the vertices at even level and $R$ those at odd level. Scan every edge $uw$.

- If no edge has $level(u) \equiv level(w) \pmod 2$, output $(L,R)$.
- Otherwise take such an edge $uw$. In BFS of an undirected graph, the levels of adjacent vertices differ by at most 1 (if $level(w) \ge level(u) + 2$, then $w$ would have been discovered from $u$). So equal parity means $level(u) = level(w) = d$. Walk $x \leftarrow u$, $y \leftarrow w$ up the parent pointers simultaneously until $x = y$; call this vertex $a$ (the lowest common ancestor) at level $d_a$. Output the cycle: tree path $a \leadsto u$, edge $uw$, tree path $w \leadsto a$ reversed.

**Correctness.** If every edge joins levels of different parity, $(L,R)$ is a valid bipartition by definition. Otherwise, the paths $a \leadsto u$ and $a \leadsto w$ in the BFS tree share no vertex other than $a$ (they diverge at $a$ by definition of the lowest common ancestor and tree paths go strictly down in level). Each has length $d - d_a$, so the output is a cycle of length $2(d - d_a) + 1$, which is odd. (It has length at least 3 because $u \ne w$ implies $d > d_a$.)

**Time.** BFS and the edge scan take $O(V+E)$. The lockstep walk takes $O(d - d_a) = O(V)$. Total $O(V+E)$.`
    },
    {
      id: 'graphs-jump-array', type: 'written', title: 'Jumping through an array', difficulty: 1,
      prompt: String.raw`You are given an array $A[1..n]$ of positive integers. A token starts at index 1. If the token is at index $i$, it may jump to index $i + A[i]$ or $i - A[i]$, provided the new index lies in $[1, n]$. Describe and analyze an algorithm to compute the minimum number of jumps needed to reach index $n$, or report that it is impossible.`,
      rubric: [
        'Vertices are the indices 1..n',
        'Directed edges i -> i+A[i] and i -> i-A[i] when in range',
        'BFS from 1, answer dist(n)',
        'O(n) time (the graph has n vertices and at most 2n edges)'
      ],
      hints: ['Every index has at most two outgoing moves. Which algorithm finds fewest moves?'],
      solution: String.raw`Build a **directed** graph $G$ with vertices $\{1, \dots, n\}$ and an edge $i \to j$ whenever $j \in \{i + A[i], i - A[i]\}$ and $1 \le j \le n$. (It is directed because $j$ can be reached from $i$ without $i$ being reachable from $j$.) A sequence of legal jumps is exactly a walk in $G$ starting at 1, with one edge per jump. Run BFS from vertex 1; the answer is $dist(n)$, or "impossible" if $n$ is not reached.

$G$ has $n$ vertices and at most $2n$ edges, and the edges out of $i$ can be computed in $O(1)$ time on the fly, so BFS runs in $O(n)$ time.`
    },
    {
      id: 'graphs-dfa-walk', type: 'written', title: 'Walks spelling a regular language', difficulty: 3,
      prompt: String.raw`Let $G=(V,E)$ be a directed graph where each edge $e$ has a label $\ell(e) \in \Sigma$, and let $M = (Q, \Sigma, \delta, q_0, F)$ be a DFA. The *label* of a walk is the concatenation of its edge labels. Describe and analyze an algorithm that decides whether there is a walk from $s$ to $t$ whose label is in $L(M)$. Then explain how to find the **shortest** such walk.`,
      rubric: [
        'Product graph with vertices V x Q and the meaning of (v, q)',
        'Edge (u,q) -> (v, delta(q, a)) for each edge u -a-> v and each q',
        'Search from (s, q0); YES iff some (t, f) with f in F is reachable (or super-target)',
        'Correctness: label of a walk ↔ DFA run, by induction',
        'Time O(|Q|(V+E)); BFS for shortest'
      ],
      hints: [
        'This is the product construction from automata theory, applied to a graph and a DFA.',
        'What does the DFA need to remember while you walk? Exactly its current state.'
      ],
      solution: String.raw`**Graph.** Let $H$ have vertices $V \times Q$; vertex $(v, q)$ means "we are at $v$, and the DFA, having read the label of the walk so far, is in state $q$". For each edge $u \to v$ of $G$ with label $a$ and each state $q \in Q$, add the edge $(u, q) \to (v, \delta(q, a))$. Add one extra vertex $t^*$ and edges $(t, f) \to t^*$ for every $f \in F$.

**Algorithm.** Run whatever-first search in $H$ from $(s, q_0)$; answer YES iff $t^*$ is marked. For the shortest walk, run BFS instead; the shortest walk in $G$ has $dist_H(t^*) - 1$ edges, and following parent pointers back from $t^*$ (dropping the second coordinates and the final edge) recovers it.

**Correctness.** Claim: there is a walk from $s$ to $v$ in $G$ with label $w$ iff there is a walk of the same length from $(s,q_0)$ to $(v, \delta^*(q_0, w))$ in $H$. Induction on $|w|$: the empty walk corresponds to staying at $(s,q_0)$; extending a walk ending at $u$ with label $w$ by edge $u \xrightarrow{a} v$ corresponds to the $H$-edge $(u, \delta^*(q_0,w)) \to (v, \delta(\delta^*(q_0,w), a)) = (v, \delta^*(q_0, wa))$, and every $H$-edge arises this way. Hence a walk to $t$ with label in $L(M)$ exists iff some $(t, f)$ with $f \in F$ is reachable, iff $t^*$ is reachable.

**Time.** $|V(H)| = V|Q| + 1$, $|E(H)| = E|Q| + |F|$. Search: $O(|Q|(V+E))$. Computing each $\delta(q,a)$ is $O(1)$ with a transition table.`
    },
    {
      id: 'graphs-two-robots', type: 'written', title: 'Two robots that must keep their distance', difficulty: 3,
      prompt: String.raw`Two robots sit at vertices $a$ and $b$ of a connected undirected graph $G = (V, E)$. In each step, **exactly one** robot moves along an edge to an adjacent vertex. At no time may the two robots occupy the same vertex or two **adjacent** vertices. Describe and analyze an algorithm that computes the minimum number of steps to move the robots so that the first robot is at $c$ and the second at $d$ (or reports that it is impossible).`,
      rubric: [
        'Vertices are ordered pairs (x, y) of non-equal, non-adjacent vertices (configurations)',
        'Edges: move one robot along an edge, landing in a legal configuration',
        'BFS from (a, b), answer dist((c, d))',
        'Explains how to test adjacency quickly (matrix or hashing) or accounts for it in the time',
        'Running time O(VE) (or O(V^2 + VE)) justified'
      ],
      hints: [
        'A configuration is the pair of robot positions; order matters because the robots are distinguishable.',
        'Count edges: from (x, y) there are deg(x) + deg(y) potential moves. Sum over all pairs.'
      ],
      solution: String.raw`**Graph.** Let $H$ have a vertex $(x, y)$ for every ordered pair of vertices $x, y \in V$ with $x \ne y$ and $xy \notin E$: robot 1 at $x$, robot 2 at $y$, a legal configuration. $H$ has an (undirected) edge between $(x, y)$ and $(x', y)$ whenever $xx' \in E$ and both are legal configurations, and between $(x, y)$ and $(x, y')$ whenever $yy' \in E$ and both are legal. These are exactly the legal single steps.

**Algorithm.** Run BFS in $H$ from $(a, b)$ (assume this is legal; otherwise report impossible). The answer is $dist_H((c, d))$, or impossible if $(c,d)$ is illegal or unreached. A sequence of legal steps is precisely a walk in $H$, one edge per step, so BFS gives the minimum number of steps.

**Time.** Precompute an adjacency matrix (or hash set of edges) in $O(V^2)$ time so legality of a pair is an $O(1)$ test. $H$ has at most $V^2$ vertices. The number of edges out of $(x,y)$ is at most $\deg(x) + \deg(y)$, so
$$|E(H)| \le \sum_{x}\sum_{y} (\deg x + \deg y) = V \cdot 2E + V \cdot 2E = 4VE.$$
Generating neighbors on the fly costs $O(1)$ per candidate. BFS therefore takes $O(V^2 + VE) = O(VE)$ time, since $G$ is connected and so $E \ge V-1$.`
    },
    {
      id: 'graphs-racetrack', type: 'written', title: 'One-dimensional racetrack', difficulty: 3,
      prompt: String.raw`A car moves along positions $0, 1, \dots, n$. Some positions are marked as potholes, given by a boolean array $P[0..n]$ (with $P[0] = P[n] = \mathrm{False}$). The car starts at position 0 with speed 0. In each move, if the car is at position $i$ with speed $v$, it chooses a new speed $v' \in \{v-1, v, v+1\}$ with $v' \ge 1$, and then jumps to position $i + v'$. The move is legal only if $i + v' \le n$ and $P[i+v']$ is False. Describe and analyze an algorithm to compute the minimum number of moves needed to land exactly on position $n$ (at any speed), or report that this is impossible. For full credit, your algorithm should run in $o(n^2)$ time.`,
      rubric: [
        'Vertices are pairs (position, speed); explains why position alone is not enough',
        'Directed edges (i, v) -> (i + v\', v\') for legal v\' in {v-1, v, v+1}, v\' >= 1',
        'BFS from (0, 0); answer min over v of dist(n, v) (or super-target)',
        'Bounds the speed by O(sqrt n) since reaching speed v requires covering at least 1+2+...+v positions',
        'Running time O(n^{3/2}) justified (O(n^2) with a naive speed bound earns partial credit)'
      ],
      hints: [
        'The future options depend on both where you are and how fast you are going.',
        'Speed only changes by 1 per move. If the speed ever reaches v, how far must the car have traveled?'
      ],
      solution: String.raw`**State.** Position alone does not determine which moves are available, so the vertices are pairs $(i, v)$: "the car is at position $i$ with current speed $v$".

**Speed bound.** Speed increases by at most 1 per move, starting from 0. If the car ever has speed $v$, then its previous moves used speeds that include (at least) $1, 2, \dots, v$, so it has traveled at least $1 + 2 + \dots + v = v(v+1)/2$ positions. Since it never passes $n$, $v(v+1)/2 \le n$, so $v \le \sqrt{2n}$. Let $S = \lfloor \sqrt{2n} \rfloor$.

**Graph.** Vertices: $(i, v)$ with $0 \le i \le n$, $0 \le v \le S$, $P[i] = \mathrm{False}$. Directed edges: from $(i, v)$ to $(i + v', v')$ for each $v' \in \{v-1, v, v+1\}$ with $1 \le v' \le S$, $i + v' \le n$, and $P[i+v'] = \mathrm{False}$. Add a target vertex $T$ with an edge from $(n, v)$ to $T$ for every $v$.

**Algorithm.** BFS from $(0,0)$. If $T$ is unreached, report impossible; otherwise return $dist(T) - 1$.

**Correctness.** Legal move sequences from the start are exactly walks from $(0,0)$ in this graph, one edge per move (the speed bound removes no reachable state). So the fewest moves to reach position $n$ is the minimum over $v$ of $dist((n, v))$, which equals $dist(T) - 1$.

**Time.** There are $O(n \cdot S) = O(n^{3/2})$ vertices, each with at most 3 out-edges computable in $O(1)$ time. BFS takes $O(n^{3/2})$ time, which is $o(n^2)$.`
    },
    {
      id: 'graphs-ice-slide', type: 'written', title: 'Sliding on ice', difficulty: 2,
      prompt: String.raw`An $n \times n$ grid has some cells blocked by rocks; the boundary acts as a wall. A puck sits on an unblocked cell $s$. In one move you push the puck in one of four directions, and it slides in that direction until the next cell is a rock or off the grid; it stops there (it cannot stop in mid-slide). Describe and analyze an algorithm to find the minimum number of moves to make the puck **stop** on cell $t$.`,
      rubric: [
        'Vertices = unblocked cells; each has at most 4 out-edges, to the cell where each slide stops',
        'Graph is directed',
        'Efficient precomputation of slide destinations (O(n^2) total, or argues O(n) per move is acceptable with correct total)',
        'BFS from s; answer dist(t)',
        'Running time O(n^2) (or O(n^3) with naive simulation, stated correctly)'
      ],
      hints: [
        'The puck can only be at rest on a cell; each move goes from one resting cell to another.',
        'Compute the stopping cell for "slide right" from every cell in one right-to-left sweep per row.'
      ],
      solution: String.raw`**Graph.** Vertices: the unblocked cells ($\le n^2$). For each cell $x$ and each direction $D \in \{\text{up, down, left, right}\}$, add a directed edge from $x$ to $stop_D(x)$, the cell where the puck comes to rest if pushed from $x$ in direction $D$ (omit self-loops). The graph is directed: sliding right from $x$ to $y$ does not mean sliding left from $y$ returns to $x$.

**Precomputation.** For "right": in each row, sweep from right to left; $stop_R(x) = x$ if the cell right of $x$ is a rock or the boundary, and otherwise $stop_R(x) = stop_R(\text{right neighbor})$. Similarly for the other directions. This takes $O(n^2)$ total.

**Algorithm.** BFS from $s$; output $dist(t)$, or "impossible" if $t$ is unreached. Each move is exactly one edge, and each walk in the graph is a legal sequence of moves.

**Time.** $O(n^2)$ vertices, at most $4n^2$ edges, $O(n^2)$ precomputation: $O(n^2)$ total, linear in the size of the grid. (Simulating each slide naively costs $O(n)$ per edge, giving $O(n^3)$; correct but slower.)`
    },
    {
      id: 'graphs-bipartite-code', type: 'code', title: 'Bipartiteness test', difficulty: 1,
      prompt: String.raw`Write <code>isBipartite(n, edges)</code> that returns <code>true</code> if the undirected graph on vertices <code>0..n-1</code> with edge list <code>edges</code> (pairs <code>[u, v]</code>) is bipartite, and <code>false</code> otherwise. The graph may be disconnected and may contain repeated edges and self-loops (a self-loop makes a graph non-bipartite). Aim for $O(V+E)$.`,
      fn: 'isBipartite',
      starter: 'function isBipartite(n, edges) {\n  // BFS-color each component; look for an edge between equal colors\n}\n',
      reference: function (n, edges) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
        const color = new Array(n).fill(-1);
        for (let r = 0; r < n; r++) {
          if (color[r] !== -1) continue;
          color[r] = 0;
          const q = [r];
          for (let h = 0; h < q.length; h++) {
            const u = q[h];
            for (const w of adj[u]) {
              if (color[w] === -1) { color[w] = 1 - color[u]; q.push(w); }
              else if (color[w] === color[u]) return false;
            }
          }
        }
        return true;
      },
      tests: [
        [1, []],
        [3, [[0, 1], [1, 2], [2, 0]]],
        [4, [[0, 1], [1, 2], [2, 3], [3, 0]]],
        [2, [[0, 0]]],
        [6, [[0, 1], [2, 3], [3, 4], [4, 2]]],
        [5, [[0, 1], [0, 1], [1, 2]]],
        [7, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]]],
        [6, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]]],
        [5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 10);
        const m = Math.floor(Math.random() * 13);
        const edges = [];
        for (let i = 0; i < m; i++) {
          const u = Math.floor(Math.random() * n);
          let v = Math.floor(Math.random() * n);
          if (Math.random() < 0.85 && n > 1) while (v === u) v = Math.floor(Math.random() * n);
          edges.push([u, v]);
        }
        return [n, edges];
      },
      hints: [
        'Handle every component: loop over all vertices and start a BFS from each uncolored one.',
        'Give the BFS root color 0 and each newly discovered vertex the opposite color of the vertex that discovered it. Any edge between two vertices of the same color means the graph is not bipartite.'
      ],
      solution: String.raw`For each uncolored vertex $r$, color it 0 and run BFS. When $u$ scans a neighbor $w$: if $w$ is uncolored, give it $1 - color(u)$ and enqueue it; if $w$ already has the same color as $u$, return false. If every component finishes without a conflict, return true.

**Why this is correct.** If no conflict is found, every edge was scanned from both ends and joins different colors, so the coloring is a valid bipartition. If a conflict is found on edge $uw$, then (as in the lesson) $u$ and $w$ are on the same BFS level, and the two tree paths to their lowest common ancestor plus $uw$ form an odd cycle, which cannot be 2-colored. A self-loop $uu$ is detected immediately ($u$ sees itself with its own color), and it is an odd cycle of length 1.

Each vertex is colored once and each adjacency entry scanned once over all the BFS runs: $O(V+E)$.`
    },
    {
      id: 'graphs-wallbreak-code', type: 'code', title: 'Fewest moves breaking at most k walls', difficulty: 2,
      prompt: String.raw`Write <code>wallBreak(grid, k)</code>. <code>grid</code> is an array of $R$ equal-length strings over the characters <code>.</code> (open) and <code>#</code> (wall); the top-left cell <code>grid[0][0]</code> and the bottom-right cell <code>grid[R-1][C-1]</code> are open. You start at the top-left and move one step at a time up, down, left or right (staying on the grid). Stepping into a wall cell is allowed but destroys that wall, and you may destroy **at most <code>k</code> walls** in total. Return the minimum number of moves needed to reach the bottom-right cell, or <code>-1</code> if it is impossible. (For a 1×1 grid the answer is 0.)

This is a modeling problem: decide what a state must remember, then run BFS on the state graph.`,
      fn: 'wallBreak',
      starter: 'function wallBreak(grid, k) {\n  // BFS over states (row, col, wallsBrokenSoFar)\n}\n',
      reference: function (grid, k) {
        const R = grid.length, C = grid[0].length, L = k + 1;
        const d = new Array(R * C * L).fill(-1);
        const id = (r, c, b) => (r * C + c) * L + b;
        d[id(0, 0, 0)] = 0;
        const q = [[0, 0, 0]];
        const dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
        for (let h = 0; h < q.length; h++) {
          const [r, c, b] = q[h];
          const cur = d[id(r, c, b)];
          for (let t = 0; t < 4; t++) {
            const r2 = r + dr[t], c2 = c + dc[t];
            if (r2 < 0 || r2 >= R || c2 < 0 || c2 >= C) continue;
            const b2 = b + (grid[r2][c2] === '#' ? 1 : 0);
            if (b2 > k) continue;
            const j = id(r2, c2, b2);
            if (d[j] === -1) { d[j] = cur + 1; q.push([r2, c2, b2]); }
          }
        }
        let best = -1;
        for (let b = 0; b <= k; b++) {
          const x = d[id(R - 1, C - 1, b)];
          if (x !== -1 && (best === -1 || x < best)) best = x;
        }
        return best;
      },
      tests: [
        [['.'], 0],
        [['.#.'], 0],
        [['.#.'], 1],
        [['..', '..'], 0],
        [['.#..', '.#.#', '...#', '##..'], 0],
        [['.###', '####', '###.'], 2],
        [['.###', '####', '###.'], 4],
        [['.#...', '.#.#.', '.#.#.', '...#.'], 0],
        [['.#...', '.#.#.', '.#.#.', '...#.'], 1]
      ],
      gen: () => {
        const R = 1 + Math.floor(Math.random() * 5), C = 1 + Math.floor(Math.random() * 5);
        const grid = [];
        for (let r = 0; r < R; r++) {
          let row = '';
          for (let c = 0; c < C; c++) row += Math.random() < 0.45 ? '#' : '.';
          grid.push(row);
        }
        grid[0] = '.' + grid[0].slice(1);
        grid[R - 1] = grid[R - 1].slice(0, C - 1) + '.';
        return [grid, Math.floor(Math.random() * 4)];
      },
      hints: [
        'Position alone is not enough: two visits to the same cell with different numbers of walls already broken have different futures.',
        'States (r, c, b) with 0 <= b <= k. Moving into an open cell keeps b; moving into a wall cell goes to b + 1 (only if b < k). Every move costs 1, so BFS works.',
        'The answer is the minimum over b of the distance to (R-1, C-1, b).'
      ],
      solution: String.raw`**Model.** Vertices $(x, b)$: on cell $x$, having destroyed $b \le k$ walls. From $(x, b)$, for each grid neighbor $y$ of $x$: if $y$ is open, an edge to $(y, b)$; if $y$ is a wall and $b < k$, an edge to $(y, b+1)$. Every edge is one move.

**Algorithm.** BFS from (top-left, 0); return $\min_b dist(\text{bottom-right}, b)$, or $-1$.

**Correctness.** A legal route corresponds to a walk in the state graph with one edge per move (the second coordinate counts walls entered). The model charges a break each time a wall cell is entered, even a second time, but a fewest-move route never revisits a cell (removing the loop saves moves and does not add breaks), so the minimum equals the true answer.

**Time.** $(k+1)RC$ states, at most 4 edges each: $O(kRC)$. The reference encodes $(r, c, b)$ as the integer $(rC + c)(k+1) + b$.`
    },
    {
      id: 'graphs-modwalk-code', type: 'code', title: 'Shortest walk with length r mod m', difficulty: 2,
      prompt: String.raw`Write <code>modWalk(n, edges, s, t, m, r)</code> for a **directed** graph on vertices <code>0..n-1</code> with edges <code>[u, v]</code> meaning $u \to v$. Given integers $m \ge 1$ and $0 \le r < m$, return the minimum number of edges in a walk from <code>s</code> to <code>t</code> whose length is congruent to $r$ modulo $m$, or <code>-1</code> if no such walk exists. Vertices and edges may repeat; the empty walk (length 0) counts when <code>s === t</code> and <code>r === 0</code>.`,
      fn: 'modWalk',
      starter: 'function modWalk(n, edges, s, t, m, r) {\n  // BFS on states (vertex, length mod m)\n}\n',
      reference: function (n, edges, s, t, m, r) {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) adj[u].push(v);
        const d = new Array(n * m).fill(-1);
        d[s * m] = 0;
        const q = [s * m];
        for (let h = 0; h < q.length; h++) {
          const x = q[h];
          const u = Math.floor(x / m), j = x % m;
          for (const v of adj[u]) {
            const y = v * m + (j + 1) % m;
            if (d[y] === -1) { d[y] = d[x] + 1; q.push(y); }
          }
        }
        return d[t * m + r];
      },
      tests: [
        [1, [], 0, 0, 1, 0],
        [1, [], 0, 0, 2, 1],
        [3, [[0, 1], [1, 2], [2, 0], [1, 0]], 0, 2, 3, 0],
        [2, [[0, 1], [1, 0]], 0, 1, 2, 0],
        [2, [[0, 1], [1, 0]], 0, 1, 2, 1],
        [3, [[0, 1], [1, 2], [2, 0]], 0, 0, 2, 1],
        [4, [[0, 1], [1, 2], [2, 3], [3, 1]], 0, 3, 4, 2],
        [5, [[0, 1], [1, 2], [2, 3], [3, 4]], 4, 0, 3, 0]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 8);
        const e = Math.floor(Math.random() * 2.2 * n);
        const edges = [];
        for (let i = 0; i < e; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        const m = 1 + Math.floor(Math.random() * 5);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n), m, Math.floor(Math.random() * m)];
      },
      hints: [
        'Whether a partial walk can be completed correctly depends only on the current vertex and the current length mod m.',
        'Encode state (v, j) as v*m + j. Each edge u -> v gives (u, j) -> (v, (j+1) mod m). BFS from (s, 0) and read the distance of (t, r).'
      ],
      solution: String.raw`**Model.** $H$ has vertices $(v, j)$ for $v \in V$, $j \in \{0, \dots, m-1\}$: "at $v$ after a walk whose length is $\equiv j \pmod m$". Each edge $u \to v$ of $G$ yields the $m$ edges $(u, j) \to (v, (j+1) \bmod m)$.

**Correctness.** By induction on $\ell$, $G$ has a walk of length $\ell$ from $s$ to $v$ iff $H$ has a walk of length $\ell$ from $(s, 0)$ to $(v, \ell \bmod m)$: each step in one graph corresponds to exactly one step in the other. So the shortest qualifying walk has length $dist_H((t, r))$.

**Algorithm and time.** BFS in $H$ from $(s, 0)$; $H$ has $mV$ vertices and $mE$ edges, so $O(m(V+E))$. The worked example in the lesson (edges $s \to a$, $a \to t$, $t \to s$, $a \to s$, $m = 3$, answer 6) is one of the tests.`
    },
    {
      id: 'graphs-red-checkpoint', type: 'written', title: 'Pass through a red vertex', difficulty: 2,
      prompt: String.raw`$G = (V, E)$ is a directed graph, and some vertices are colored red. Given $s$ and $t$, describe and analyze an algorithm to compute the minimum number of edges in a walk from $s$ to $t$ that visits **at least one** red vertex ($s$ or $t$ count if they are red). Then extend your algorithm to walks that visit a red vertex and **afterwards** a blue vertex (the blue vertex must come at or after the red one).`,
      rubric: [
        'States (v, f) with a one-way flag f, and a precise meaning',
        'Edges: flag becomes 1 when entering a red vertex and never resets; handles s red',
        'BFS from the correct start; answer dist(t, 1)',
        'Extension with three layers (none / red seen / red then blue seen)',
        'O(V+E) time for both, justified by counting vertices and edges'
      ],
      hints: [
        'What single fact about the past determines whether a walk that ends at t is acceptable?',
        'For the extension, the progress is "nothing yet", "seen red", "seen red then blue": three layers.'
      ],
      solution: String.raw`**Part 1. Vertices.** $V \times \{0, 1\}$; $(v, f)$ means "at $v$, and $f = 1$ iff some red vertex has been visited so far".

**Edges.** For each edge $u \to v$ and $f \in \{0,1\}$: $(u, f) \to (v, f')$ where $f' = 1$ if $f = 1$ or $v$ is red, else $f' = 0$.

**Algorithm.** BFS from $(s, f_0)$, where $f_0 = 1$ iff $s$ is red. Report $dist((t, 1))$, or "none" if it is infinite.

**Correctness.** By induction along the walk, a walk $s = v_0, \dots, v_k$ in $G$ corresponds to the walk $(v_0, f_0), \dots, (v_k, f_k)$ in $H$, where $f_i = 1$ iff one of $v_0..v_i$ is red; every walk in $H$ from the start arises this way, with the same number of edges.

**Time.** $2V$ vertices, $2E$ edges: $O(V+E)$.

**Part 2.** Use three layers $p \in \{0, 1, 2\}$: 0 = no red yet, 1 = red seen but no blue since, 2 = red seen and then blue. Entering vertex $v$ updates $p$: from 0 to 1 if $v$ is red; from 1 to 2 if $v$ is blue; layer 2 is permanent. (If one vertex may be both red and blue, entering it from layer 0 can go straight to layer 2; also apply the same update to $s$ to get the start layer.) BFS from the start state; answer $dist((t, 2))$. Still $3V$ vertices, $3E$ edges, $O(V+E)$. In general, $k$ ordered checkpoints cost $O(k(V+E))$.`
    },
    {
      id: 'graphs-teleport-once', type: 'written', title: 'A teleporter with one charge', difficulty: 2,
      prompt: String.raw`A maze is an $n \times n$ grid of open and blocked cells. There are $p$ pairs of teleporter pads on open cells (each pad belongs to exactly one pair). Each move takes you to an adjacent open cell. In addition, while standing on a pad you may spend one move to jump to its partner pad, but your teleporter device has only **one charge**: you may teleport at most once in total. Describe and analyze an algorithm to find the minimum number of moves from $s$ to $t$.`,
      rubric: [
        'States (cell, used) with used in {0,1}',
        'Walking edges inside each layer; teleport edges only from layer 0 to layer 1',
        'BFS from (s, 0); answer min(dist(t,0), dist(t,1))',
        'Graph is directed (cannot return to layer 0)',
        'O(n^2) time, with vertex/edge counts'
      ],
      hints: ['Does the set of legal future moves depend on anything besides your cell?'],
      solution: String.raw`**Vertices.** $(x, u)$ for each open cell $x$ and $u \in \{0, 1\}$: "on cell $x$; $u = 1$ iff the charge has been used". At most $2n^2$ vertices.

**Edges.** For each pair of adjacent open cells $x, y$ and each $u$: $(x, u) \to (y, u)$ (and back). For each pad $x$ with partner $x'$: an edge $(x, 0) \to (x', 1)$. There is no edge from layer 1 back to layer 0, so the graph is directed.

**Algorithm.** BFS from $(s, 0)$. Answer $\min(dist(t, 0), dist(t, 1))$, or "impossible" if both are infinite.

**Correctness.** Legal move sequences from $s$ correspond one-to-one to walks from $(s, 0)$, one edge per move: walking moves keep the layer, and the single permitted teleport is the only way into layer 1.

**Time.** $O(n^2)$ vertices; each has at most 4 walking edges and at most one teleport edge, so $O(n^2)$ edges (note $p \le n^2/2$). BFS: $O(n^2)$.

(Without the one-charge restriction, no layers are needed: teleports are just extra edges in the grid graph.)`
    },
    {
      id: 'graphs-same-different', type: 'written', title: 'Same-team and different-team constraints', difficulty: 2,
      prompt: String.raw`A coach must split $n$ players into two teams, Red and Blue. She is given $m$ constraints, each of the form "players $x$ and $y$ must be on the **same** team" or "players $x$ and $y$ must be on **different** teams". Describe an $O(n + m)$-time algorithm that finds a valid split or reports that none exists. Prove that when your algorithm reports failure, no valid split exists.`,
      rubric: [
        'Undirected graph with an edge per constraint, labeled 0 (same) or 1 (different)',
        'BFS/DFS per component, assigning c(w) = c(u) XOR label(uw)',
        'Checks every constraint edge after (or during) the search',
        'Proof of failure: tree paths + violated edge form a closed walk with an odd number of "different" edges; XOR around any closed walk must be 0 for a valid split',
        'O(n+m) time'
      ],
      hints: [
        'Write team membership as a bit c(v). A constraint says c(x) XOR c(y) = 0 or = 1.',
        'Within a connected component, choosing one player\'s team forces everyone else\'s.'
      ],
      solution: String.raw`**Graph.** Undirected graph $G$ on the players, with an edge $xy$ for each constraint, labeled $\lambda(xy) = 0$ for "same" and $1$ for "different". A split is a function $c: V \to \{0, 1\}$, and it is valid iff $c(x) \oplus c(y) = \lambda(xy)$ for every edge.

**Algorithm.** For each component, pick a root $r$, set $c(r) = 0$, and run BFS; when $u$ discovers $w$ along edge $uw$, set $c(w) = c(u) \oplus \lambda(uw)$. Afterwards scan every edge; if all satisfy $c(x) \oplus c(y) = \lambda(xy)$, output $c$ (0 = Red, 1 = Blue). Otherwise report failure.

**Correctness of success.** The check verifies every constraint directly.

**Correctness of failure.** Suppose edge $uw$ violates the check, in the component of root $r$. Along the BFS tree path from $r$ to $u$, every edge satisfies its constraint by construction, so the XOR of labels along it equals $c(r) \oplus c(u) = c(u)$; similarly for $w$. Consider the closed walk $r \leadsto u \to w \leadsto r$. The XOR of its labels is $c(u) \oplus \lambda(uw) \oplus c(w) = 1$, since the violation means $\lambda(uw) \ne c(u) \oplus c(w)$. But for **any** valid split $c^*$, the XOR of labels around a closed walk $v_0, v_1, \dots, v_k = v_0$ is $\bigoplus_i (c^*(v_{i-1}) \oplus c^*(v_i)) = 0$, since every vertex occurrence cancels. So no valid split exists. (Equivalently: a split exists iff no cycle has an odd number of "different" edges. When all constraints are "different", this is exactly the bipartiteness test.)

**Time.** One BFS per component plus an edge scan: $O(n + m)$.`
    },
    {
      id: 'graphs-word-ladder', type: 'written', title: 'Word ladders', difficulty: 2,
      prompt: String.raw`You are given a dictionary $D$ of $n$ distinct words, each of length exactly $L$ over the 26 lowercase letters, and two words $a, b \in D$. A *ladder* from $a$ to $b$ is a sequence of words of $D$, starting with $a$ and ending with $b$, in which each word differs from the previous one in exactly one position. Describe and analyze an algorithm to find the shortest ladder.

(a) Give a simple algorithm running in $O(n^2 L)$ time.
(b) Give a faster algorithm, assuming you can hash a string of length $L$ in $O(L)$ time and dictionary operations take $O(1)$ expected time after that.`,
      rubric: [
        '(a) Vertices = words; edge between words differing in exactly one position; built by comparing all pairs in O(n^2 L); BFS',
        '(b) Avoids building all edges: wildcard patterns as intermediate vertices (or equivalent bucketing)',
        '(b) Explains that word distance = (graph distance)/2 in the bipartite word-pattern graph',
        'States the answer as the number of steps (or words) consistently',
        '(b) Running time O(n L^2) expected, justified'
      ],
      hints: [
        'The obvious graph has an edge for every pair of words at Hamming distance 1. Building it is the expensive part.',
        'For (b): words "cat" and "cot" both match the pattern "c*t". Make the patterns into vertices.'
      ],
      solution: String.raw`**(a)** Graph $G$: one vertex per word; an edge between two words iff they differ in exactly one position. Compare all $\binom{n}{2}$ pairs letter by letter: $O(n^2 L)$ time; $G$ has at most $\binom{n}{2}$ edges. A ladder is exactly a walk in $G$ (a shortest one is a path), so BFS from $a$ gives the minimum number of steps $dist(b)$ in $O(n + n^2)$ more time. Total $O(n^2 L)$.

**(b)** The bottleneck is that $G$ can have $\Theta(n^2)$ edges (e.g. all words sharing a long common part). Instead build a bipartite graph $H$:
- one vertex per word, and one vertex per **pattern**: a word with one position replaced by the wildcard $*$;
- an edge between each word $w$ and each of its $L$ patterns.

Two distinct words are adjacent in $G$ iff they share a pattern (the pattern's wildcard is the position where they differ). Hence a path $w_0, w_1, \dots, w_k$ in $G$ corresponds to the path $w_0, P_1, w_1, \dots, P_k, w_k$ in $H$, and conversely every word-to-word path in $H$ alternates words and patterns. So $dist_G(a, b) = dist_H(a, b)/2$.

*Building $H$:* for each word and each of its $L$ positions, form the pattern string ($O(L)$) and look it up in a hash table, creating a vertex if new: $O(nL \cdot L) = O(nL^2)$ expected time. $H$ has at most $n + nL$ vertices and exactly $nL$ edges, so BFS takes $O(nL)$.

**Total:** $O(nL^2)$ expected time, which beats $O(n^2L)$ whenever $L < n$.`
    },
    {
      id: 'graphs-robot-heading', type: 'written', title: 'Robot with a heading and no U-turns', difficulty: 2,
      prompt: String.raw`A robot moves on an $n \times n$ grid in which some cells are blocked. It always faces one of the four compass directions. Each command takes one second and is one of: **F** (move one cell forward, if that cell is on the grid and open), **L** (turn 90° left), **R** (turn 90° right). For safety reasons the robot may **never execute two turn commands in a row** (so turning around requires moving in between). It starts on cell $s$ facing north. Describe and analyze an algorithm that computes the minimum number of seconds to reach cell $t$ (facing any direction), or reports that $t$ cannot be reached.`,
      rubric: [
        'States include cell, heading, and whether the last command was a turn',
        'Edges for F, L, R with the no-two-turns rule; correct start state',
        'Directed graph; BFS from start; answer min over the copies of t',
        'O(n^2) time with explicit vertex/edge counts'
      ],
      hints: [
        'Which commands are allowed next depends on the cell, the heading, and one more bit.',
        'There are 8 states per cell.'
      ],
      solution: String.raw`**Vertices.** $(x, h, b)$: on open cell $x$, facing $h \in \{N, E, S, W\}$, and $b = 1$ iff the previous command was a turn. At most $8n^2$ vertices.

**Edges.** From $(x, h, b)$:
- **F:** if the cell $y$ adjacent to $x$ in direction $h$ is open, an edge to $(y, h, 0)$;
- **L, R:** only if $b = 0$, edges to $(x, \text{left}(h), 1)$ and $(x, \text{right}(h), 1)$.

The graph is directed. Every edge is one second.

**Algorithm.** BFS from $(s, N, 0)$ (no command has been executed yet, so a turn is allowed). The answer is the minimum of $dist(t, h, b)$ over all 8 copies of $t$, or "unreachable" if all are infinite.

**Correctness.** Legal command sequences from the start are exactly walks from $(s, N, 0)$, one edge per command, because the third coordinate records precisely the information the safety rule needs.

**Time.** $8n^2$ vertices with at most 3 out-edges each: $O(n^2)$.`
    },
    {
      id: 'graphs-sync-tokens', type: 'written', title: 'Two tokens moving in lockstep', difficulty: 3,
      prompt: String.raw`Let $G = (V, E)$ be a directed graph. Token 1 starts at $a$ and token 2 at $b$ (with $a \ne b$). In every round **both** tokens move simultaneously, each along an out-edge of its current vertex. After a round the two tokens may not be on the same vertex (they may pass each other along a pair of opposite edges). Describe and analyze an algorithm that computes the minimum number of rounds after which token 1 is at $a'$ and token 2 is at $b'$ **at the same time**, or reports that this is impossible. Express the running time in terms of $V$ and $E$, and compare it with the variant where exactly one token moves per round.`,
      rubric: [
        'Vertices: ordered pairs (x, y) with x != y',
        'Edges (x, y) -> (x\', y\') for x -> x\' and y -> y\' in E with x\' != y\'',
        'BFS from (a, b); answer dist((a\', b\'))',
        'Edge count: sum over pairs of outdeg(x) * outdeg(y) = E^2, so O(V^2 + E^2) time',
        'Comparison with one-token-per-round: sum of outdeg(x) + outdeg(y) = 2VE, so O(V^2 + VE)'
      ],
      hints: [
        'A configuration is an ordered pair of positions.',
        'Count the out-edges of (x, y): every choice of an out-edge for token 1 combined with every choice for token 2.'
      ],
      solution: String.raw`**Vertices.** $H$ has a vertex $(x, y)$ for each ordered pair with $x \ne y$: token 1 at $x$, token 2 at $y$. At most $V^2$ vertices.

**Edges.** For each $(x, y)$, each edge $x \to x'$ and each edge $y \to y'$ of $G$ with $x' \ne y'$: a directed edge $(x, y) \to (x', y')$. These are exactly the legal rounds.

**Algorithm.** BFS in $H$ from $(a, b)$; output $dist((a', b'))$, or "impossible" if it is infinite (in particular if $a' = b'$). A sequence of legal rounds is precisely a walk in $H$ with one edge per round, so BFS returns the minimum number of rounds.

**Time.** Generate the out-edges of $(x, y)$ on the fly by a double loop over the two adjacency lists. The number of edges is at most
$$\sum_{x}\sum_{y} \mathrm{outdeg}(x)\cdot\mathrm{outdeg}(y) = \Big(\sum_x \mathrm{outdeg}(x)\Big)^2 = E^2,$$
so BFS takes $O(V^2 + E^2)$ time (the $V^2$ term is initialization of the distance table).

**Comparison.** If exactly one token moves per round, $(x, y)$ has $\mathrm{outdeg}(x) + \mathrm{outdeg}(y)$ out-edges, and the sum over all pairs is $V \cdot E + V \cdot E = 2VE$, giving $O(V^2 + VE)$. For sparse graphs both are $O(V^2)$; for dense graphs ($E = \Theta(V^2)$) the lockstep version costs $\Theta(V^4)$ against $\Theta(V^3)$.`
    },
    {
      id: 'graphs-switch-doors', type: 'written', title: 'Switches that toggle every door', difficulty: 2,
      prompt: String.raw`An $n \times n$ maze has four kinds of cells: walls, open floor, doors and switches. All doors start **closed**. A closed door cannot be entered; an open one behaves like floor. Whenever you step **onto** a switch cell, every door in the maze toggles (open doors close and closed doors open). No cell is both a door and a switch, and your start cell $s$ is floor. Each move goes to an adjacent cell. Describe and analyze an algorithm that finds the minimum number of moves to reach the exit cell $t$.`,
      rubric: [
        'Recognizes that the whole door configuration is determined by the parity of switch-steps',
        'States (cell, parity) and the precise rule for entering doors and switches',
        'BFS from (s, 0); answer min over parity at t',
        'O(n^2) time'
      ],
      hints: [
        'You do not need to remember which doors are open: they are all open or all closed together.',
        'Does entering a door depend on the parity before or after the move? (Doors and switches are different cells.)'
      ],
      solution: String.raw`**Key observation.** All doors are always in the same state, determined by the parity $p$ of the number of switch cells entered so far: doors are open iff $p = 1$. So the state is (cell, $p$): $2n^2$ vertices instead of an exponential door configuration.

**Edges.** From $(x, p)$, for each neighbor $y$ of $x$:
- $y$ a wall: no edge;
- $y$ floor: edge to $(y, p)$;
- $y$ a door: edge to $(y, p)$ only if $p = 1$ (doors currently open);
- $y$ a switch: edge to $(y, 1 - p)$ (entering the switch toggles the doors; you stand on the switch, not on a door, so the toggle never traps you inside a door).

The graph is directed: for example, you can step from a door cell onto a switch, but the toggle may close the door and prevent the step back.

**Algorithm.** BFS from $(s, 0)$. Answer $\min(dist(t, 0), dist(t, 1))$, or "unreachable".

**Correctness.** By induction on the number of moves, the state $(x, p)$ after a legal move sequence records your cell and the door state, and the edges allow exactly the legal next moves.

**Time.** $2n^2$ vertices, at most 4 out-edges each: $O(n^2)$.

(If different switches controlled different sets of doors, the state would have to record which subsets are toggled, and the state space could become exponential, just like the keys-and-doors example in the lesson.)`
    },
    {
      id: 'graphs-color-runs', type: 'written', title: 'No long runs of one color', difficulty: 2,
      prompt: String.raw`Each edge of a directed graph $G = (V, E)$ is red or blue. A walk is *$k$-varied* if it never uses more than $k$ consecutive edges of the same color. Given $s$, $t$ and $k \ge 1$, describe and analyze an algorithm that finds the minimum number of edges in a $k$-varied walk from $s$ to $t$.`,
      rubric: [
        'States (v, c, j): at v, last edge color c, current run length j in 1..k, plus a start state',
        'Edges: same color increments j (only if j < k), different color resets j to 1',
        'BFS; answer at s itself (0) or min over copies of t',
        'O(k(V+E)) time with counts'
      ],
      hints: ['To decide whether the next edge is allowed you need the color of the current run and its length.'],
      solution: String.raw`**Vertices.** A start vertex $\sigma$ ("at $s$, no edge used yet") and $(v, c, j)$ for $v \in V$, $c \in \{R, B\}$, $1 \le j \le k$: "at $v$; the walk's last $j$ edges have color $c$, and the edge before them (if any) does not". $2kV + 1$ vertices.

**Edges.** For each edge $u \to v$ of color $c$:
- $\sigma \to (v, c, 1)$ if $u = s$;
- $(u, c, j) \to (v, c, j + 1)$ for $1 \le j < k$ (continuing the run);
- $(u, \bar c, j) \to (v, c, 1)$ for $1 \le j \le k$, where $\bar c$ is the other color (starting a new run).

So each original edge yields at most $2k + 1$ edges: $O(kE)$ in total.

**Algorithm.** If $s = t$ the answer is 0. Otherwise BFS from $\sigma$ and output $\min_{c, j} dist(t, c, j)$, or "none".

**Correctness.** By induction on walk length, a walk from $s$ in $G$ is $k$-varied iff it corresponds to a walk from $\sigma$ in $H$ (with the same number of edges), where the state after each prefix records the color and length of the final run. The edge rules allow a step exactly when the run would not exceed $k$.

**Time.** $O(kV)$ vertices and $O(kE)$ edges: $O(k(V+E))$.`
    },
    {
      id: 'graphs-edge-on-cycle', type: 'written', title: 'Is this edge on a cycle?', difficulty: 1,
      prompt: String.raw`Let $G$ be an undirected simple graph and $uv$ one of its edges. Describe an $O(V+E)$ algorithm that decides whether $uv$ lies on some cycle of $G$, and prove it correct.`,
      rubric: [
        'Algorithm: delete uv and test whether u still reaches v',
        'Proof (⇐): a u-v path avoiding the edge plus the edge gives a cycle (length at least 3)',
        'Proof (⇒): the rest of the cycle is a u-v path avoiding the edge',
        'O(V+E)'
      ],
      hints: ['A cycle through the edge uv, with the edge removed, is a path between its endpoints.'],
      solution: String.raw`**Algorithm.** Run WFS from $u$ in $G - uv$ (simply skip that one edge while scanning adjacency lists). Answer YES iff $v$ is marked. Time $O(V+E)$.

**Correctness.** (⇐) If $v$ is reachable from $u$ in $G - uv$, take a **path** $P$ from $u$ to $v$ there. Because $G$ is simple and $P$ avoids the edge $uv$, $P$ has at least 2 edges, so $P$ plus $uv$ is a cycle (of length at least 3) through $uv$.

(⇒) If $uv$ lies on a cycle $u = x_0, x_1, \dots, x_k = v, u$, then $x_0, \dots, x_k$ is a $u$-$v$ path that does not use the edge $uv$, so $v$ is reachable from $u$ in $G - uv$.

(An edge on no cycle is called a **bridge**; all bridges can be found in $O(V+E)$ total with a single DFS, but that is beyond what this problem needs.)`
    },
    {
      id: 'graphs-connect-cost', type: 'written', title: 'Connecting the network', difficulty: 1,
      prompt: String.raw`An undirected graph $G$ with $V$ vertices and $E$ edges represents a computer network. Describe an $O(V+E)$ algorithm that computes the minimum number of new links (edges) needed to make the network connected, and outputs such a set of links. Prove that your number is optimal.`,
      rubric: [
        'Counts components c with WFS in a loop, O(V+E)',
        'Outputs c - 1 edges joining representatives of consecutive components',
        'Proof of sufficiency: the result is connected',
        'Proof of necessity: each added edge reduces the number of components by at most one'
      ],
      hints: ['How much can a single new edge reduce the number of components?'],
      solution: String.raw`**Algorithm.** Label components with WFS in a loop, recording one representative $r_1, \dots, r_c$ per component ($O(V+E)$). Output the $c - 1$ links $r_1 r_2, r_2 r_3, \dots, r_{c-1} r_c$.

**Sufficiency.** After adding these links, every vertex reaches its component's representative, and the representatives are joined in a chain, so the graph is connected.

**Necessity.** Adding one edge $xy$ either joins two vertices of the same component (the number of components is unchanged) or merges the two components of $x$ and $y$ into one (the number drops by exactly one). Starting from $c$ components and ending with 1 therefore requires at least $c - 1$ new edges.

So the minimum is exactly $c - 1$. (Note that this is not $V - 1 - E$: extra edges inside a component, which create cycles, do nothing for connectivity.)`
    },
    {
      id: 'graphs-ghost-patrol', type: 'written', title: 'Avoiding a patrolling ghost', difficulty: 3,
      prompt: String.raw`An $n \times n$ maze has open and wall cells. A ghost follows a fixed patrol route given as a list of open cells $g_0, g_1, \dots, g_{p-1}$, where consecutive cells (including $g_{p-1}$ and $g_0$) are equal or adjacent; at time $T$ the ghost is on $g_{T \bmod p}$. You start on cell $s \ne g_0$ at time 0. Each second you either stay put or move to an adjacent open cell, while the ghost simultaneously advances one step along its route. You are caught if you are on the ghost's cell at the end of a second, or if you and the ghost **swap** cells during a second. Describe and analyze an algorithm that computes the earliest time at which you can stand on the exit cell $t$ without being caught.`,
      rubric: [
        'Identifies that (cell, time mod p) determines the ghost\'s position now and forever',
        'Vertices (x, j) for open cells x and j in Z_p',
        'Edges (x, j) -> (y, j+1 mod p) for y = x or y adjacent, with both catching rules enforced',
        'BFS from (s, 0); answer min over j of dist(t, j); explains why the BFS distance equals the time',
        'O(p n^2) time; comments that this is polynomial since the route is part of the input'
      ],
      hints: [
        'The absolute time is unbounded, but the ghost only cares about time mod p.',
        'Every edge of your state graph takes exactly one second, so BFS distance = elapsed time.'
      ],
      solution: String.raw`**State.** At time $T$ the ghost's position is $g_{T \bmod p}$, so the pair (your cell, $T \bmod p$) determines everything relevant about the present and the future. Vertices: $(x, j)$ for each open cell $x$ and $j \in \{0, \dots, p - 1\}$. At most $p n^2$ vertices.

**Edges.** From $(x, j)$, let $j' = (j + 1) \bmod p$. For each $y \in \{x\} \cup \{\text{open neighbors of } x\}$, add an edge $(x, j) \to (y, j')$ unless
- $y = g_{j'}$ (you end the second on the ghost), or
- $y = g_j$ and $x = g_{j'}$ (you and the ghost swap).

**Algorithm.** BFS from $(s, 0)$. The answer is $\min_j dist((t, j))$, or "never" if no copy of $t$ is reached.

**Correctness.** Every edge represents one second. By induction on $T$, the safe move sequences of length $T$ from $s$ correspond exactly to walks of length $T$ from $(s, 0)$, ending at $(x, T \bmod p)$ where $x$ is your cell at time $T$: the edge conditions check precisely the two ways of being caught during the second from $T$ to $T+1$. Hence the earliest safe arrival time at $t$ equals the BFS distance to the nearest copy of $t$. (If no copy of $t$ is reachable in this finite graph, no safe schedule reaches $t$ at any time.)

**Time.** $O(pn^2)$ vertices with at most 5 out-edges each: $O(pn^2)$. This is polynomial in the input size because the patrol route is listed explicitly ($p$ cells are part of the input).`
    },
    {
      id: 'graphs-fire-escape', type: 'written', title: 'Escaping a spreading fire', difficulty: 3,
      prompt: String.raw`A building floor is an $n \times n$ grid of open and wall cells. At time 0 fire burns in a given set $F_0$ of open cells, and every minute it spreads from each burning cell to all adjacent open cells. You start at cell $s \notin F_0$ at time 0 and each minute move to an adjacent open cell (or stay put). You may never be on a cell at a time when it is burning: if you arrive at cell $y$ at time $T$, you need $T < \mathit{fire}(y)$, where $\mathit{fire}(y)$ is the time the fire reaches $y$ ($\infty$ if never). Describe and analyze an $O(n^2)$ algorithm that decides whether you can reach the exit $e$, and if so the earliest time.`,
      rubric: [
        'Computes fire(y) for all cells with one multi-source BFS (super-source), O(n^2)',
        'Second BFS from s that only enters y at time T if T < fire(y)',
        'Correctness argument: arriving earlier is never worse (or an induction showing BFS finds earliest safe arrival times)',
        'Answer dist(e) if finite',
        'O(n^2) total; notes that one BFS per fire source would be too slow'
      ],
      hints: [
        'First compute when the fire reaches each cell. Which single search does that for all starting fires at once?',
        'Then run BFS for yourself, but refuse to step onto a cell that will already be burning when you arrive.'
      ],
      solution: String.raw`**Step 1: fire times.** Run one BFS on the grid graph (open cells, adjacency) starting with **all** cells of $F_0$ in the queue at distance 0 (equivalently, BFS from a super-source joined to $F_0$, subtracting 1). This gives $\mathit{fire}(y)$, the distance from $y$ to the nearest initial fire, which is exactly when the fire reaches $y$. Time $O(n^2)$.

**Step 2: your BFS.** Run BFS from $s$ (time 0), but when the current cell $x$ with $arr(x) = T$ scans a neighbor $y$, discover $y$ only if it is undiscovered and $T + 1 < \mathit{fire}(y)$; then $arr(y) = T + 1$. Output $arr(e)$ if $e$ is discovered, otherwise "trapped".

**Correctness.** Let $T^*(y)$ be the earliest time you can safely stand on $y$. Note waiting is never needed to reach a cell *earlier*, and arriving earlier is never worse, because the constraint "$T < \mathit{fire}(y)$" only gets easier for smaller $T$.
- *BFS times are achievable:* by induction, BFS's $arr(y)$ comes from a sequence of moves each satisfying the fire constraint, so it is a safe schedule.
- *BFS times are optimal:* by induction on $T^*(y)$. Take a fastest safe schedule to $y$ and let $x$ be your cell one minute before arriving; we may assume you move from $x$ to $y$ (if you stayed on $y$, an earlier arrival at $y$ exists). Then $T^*(x) \le T^*(y) - 1$, so by induction BFS discovers $x$ with $arr(x) \le T^*(y) - 1$, and since $arr(x) + 1 \le T^*(y) < \mathit{fire}(y)$, the edge to $y$ passes the test when $x$ is processed. BFS (which processes cells in nondecreasing $arr$ order) therefore sets $arr(y) \le T^*(y)$.

So $arr(e) = T^*(e)$.

**Time.** Two BFS runs on a graph with $n^2$ vertices and $O(n^2)$ edges: $O(n^2)$. Running a separate BFS from each initial fire cell instead of one multi-source BFS could cost $O(|F_0| \cdot n^2)$.`
    },
    {
      id: 'graphs-combination-lock', type: 'written', title: 'A combination lock with jammed combinations', difficulty: 2,
      prompt: String.raw`A combination lock has $k$ wheels, each showing a digit $0$–$9$. One **move** turns a single wheel one step up or one step down (up from 9 gives 0, down from 0 gives 9). You are given a list $F$ of $m$ forbidden combinations: if the lock ever shows one of them it jams. The lock currently shows $00\cdots0$ (not forbidden).

(a) Describe and analyze an algorithm that computes the fewest moves needed to make the lock show a target combination $c$ without ever jamming, or reports that this is impossible. State the running time in terms of $k$ and $m$.

(b) A deluxe lock also allows a move that turns any **block of consecutive wheels** $i, i+1, \dots, j$ together by one step (all up or all down). How do the graph and the running time change?`,
      rubric: [
        'Vertices: the 10^k combinations that are not forbidden; meaning stated',
        'Edges: 2k neighbors per combination (each wheel up/down, with wraparound), undirected because every move can be undone',
        'BFS from 00...0; answer dist(c), impossible if undiscovered; correctness sentence',
        'Time O(k 10^k + mk), with a remark that this is exponential in k (the state space really is that large)',
        'Part (b): k(k+1) neighbors per vertex, O(k^2 10^k)'
      ],
      hints: [
        'The whole state of the puzzle is the combination currently showing. How many are there?',
        'Every move costs one step, so BFS (not Dijkstra) gives the fewest moves.'
      ],
      solution: String.raw`**(a) Graph.** Let $H$ have one vertex for every combination $x \in \{0, \dots, 9\}^k$ with $x \notin F$; the vertex means "the lock shows $x$". For each wheel $i$ and each direction $\pm 1$, join $x$ to the combination obtained by changing digit $i$ of $x$ by $\pm 1 \pmod{10}$, provided that combination is not forbidden. Each move can be undone by the opposite move, so $H$ is undirected. $H$ has at most $10^k$ vertices, each of degree at most $2k$.

**Algorithm.** Mark the forbidden combinations in a boolean array indexed by the combination read as a $k$-digit number ($O(10^k)$ to initialize, $O(mk)$ to read $F$). Run BFS in $H$ from $00\cdots0$, generating neighbors on the fly: with precomputed powers of 10, each neighbor is computed in $O(1)$. Answer $dist(c)$, or "impossible" if $c$ is never discovered (this includes $c \in F$).

**Correctness.** A sequence of moves that never jams is exactly a walk in $H$ from $00\cdots0$, one edge per move, so the fewest moves is the BFS distance.

**Time.** $O(10^k)$ vertices and $O(k \cdot 10^k)$ edges: $O(k \cdot 10^k + mk)$. This is exponential in $k$, but that is the honest size of the state space; the algorithm is linear in the size of $H$. (Always say which quantity your bound is polynomial in.)

**(b)** A block is a pair $i \le j$, so there are $k(k+1)/2$ blocks and $k(k+1)$ moves per combination. The vertices are unchanged; each vertex now has up to $k(k+1)$ neighbors (still undirected, since turning the same block the other way undoes a move). BFS takes $O(k^2 \cdot 10^k + mk)$.`
    },
    {
      id: 'graphs-shortest-path-vertices', type: 'written', title: 'Which intersections lie on a shortest route?', difficulty: 2,
      prompt: String.raw`A city is a simple directed graph $G = (V, E)$ (one-way streets, every street counts as one block). Given $s$ and $t$ with $t$ reachable from $s$, describe $O(V+E)$ algorithms to

(a) mark every vertex that lies on at least one **shortest** $s$-$t$ path;

(b) mark every edge that lies on at least one shortest $s$-$t$ path;

(c) decide whether the shortest $s$-$t$ path is **unique**.

Prove the criterion you use in (a).`,
      rubric: [
        'Two BFS runs: from s in G (d_s) and from t in rev(G) (d_t), and why rev(G) gives distances TO t',
        'Vertex criterion d_s(v) + d_t(v) = d_s(t), proved in both directions (prefix/suffix of a shortest path are shortest; a walk of length D is a path)',
        'Edge criterion d_s(u) + 1 + d_t(v) = d_s(t)',
        'Uniqueness test (one marked vertex per distance level, or count paths in the shortest-path DAG) with justification',
        'O(V+E) total'
      ],
      hints: [
        'You need distances from s and distances to t. Which graph gives distances to t with a single BFS?',
        'Let D = d_s(t). If v is on a shortest path, how long are the parts before and after v?'
      ],
      solution: String.raw`**Distances.** BFS from $s$ in $G$ gives $d_s(v)$. BFS from $t$ in $rev(G)$ gives $d_t(v)$, the fewest edges from $v$ **to** $t$ in $G$ (a $v \leadsto t$ walk in $G$ is a $t \leadsto v$ walk in $rev(G)$). Let $D = d_s(t)$. Both runs are $O(V+E)$.

**(a) Criterion.** $v$ lies on a shortest $s$-$t$ path iff $d_s(v) + d_t(v) = D$.

- (⇒) Let $P$ be a shortest $s$-$t$ path through $v$, split at $v$ into $P_1$ ($s \leadsto v$) and $P_2$ ($v \leadsto t$). Then $|P_1| \ge d_s(v)$ and $|P_2| \ge d_t(v)$, so $D = |P_1| + |P_2| \ge d_s(v) + d_t(v)$. Conversely, gluing a shortest $s \leadsto v$ path to a shortest $v \leadsto t$ path gives an $s$-$t$ walk, so $d_s(v) + d_t(v) \ge D$. Hence equality.
- (⇐) If $d_s(v) + d_t(v) = D$, glue a shortest $s \leadsto v$ path and a shortest $v \leadsto t$ path. The result is an $s$-$t$ walk of length $D$ through $v$. It is a path: if it repeated a vertex, cutting out the loop would give an $s$-$t$ walk shorter than $D$, impossible.

Mark every $v$ with $d_s(v) + d_t(v) = D$ (both finite): $O(V)$.

**(b)** By the same argument, $u \to v$ lies on a shortest path iff $d_s(u) + 1 + d_t(v) = D$. Scan all edges: $O(E)$.

**(c)** Every marked vertex $v$ sits at position $d_s(v)$ of every shortest path through it, and each shortest path has exactly one vertex at each position $0, \dots, D$. If every level $i$ has exactly one marked vertex $v_i$, every shortest path is $v_0, v_1, \dots, v_D$, and since $G$ is simple there is only one edge $v_i \to v_{i+1}$, so the path is unique. If some level $i$ has two marked vertices $x \ne y$, then a shortest path through $x$ and one through $y$ differ. So: unique iff each level $0..D$ contains exactly one marked vertex. (Alternative: count paths from $s$ to $t$ in the DAG of marked edges with the DAG-DP from the next topic, and test whether the count is 1.)

**Time.** Two BFS runs and linear scans: $O(V+E)$.`
    },
    {
      id: 'graphs-lengths-one-two', type: 'written', title: 'Roads of length 1 or 2', difficulty: 2,
      prompt: String.raw`Every edge of a directed graph $G = (V, E)$ has length $\ell(e) \in \{1, 2\}$.

(a) Describe an $O(V+E)$ algorithm that computes the shortest-path distance from $s$ to every vertex, and prove it correct.

(b) Generalize to lengths in $\{1, 2, \dots, c\}$ and state the running time in terms of $V$, $E$ and $c$.

(c) Why does this approach not give a polynomial-time algorithm for arbitrary positive integer lengths?`,
      rubric: [
        'Subdivision: each length-2 edge u -> v replaced by u -> x_e -> v with a new vertex x_e; length-1 edges kept',
        'Correctness: path lengths are preserved in both directions (new vertices have in- and out-degree 1)',
        'BFS from s on the new graph; distances of original vertices are the answer; O(V+E) since the new graph has at most V+E vertices and 2E edges',
        'Part (b): O(V + cE)',
        'Part (c): total subdivided size is the sum of lengths, which can be exponential in the bit-length (pseudo-polynomial); use Dijkstra instead'
      ],
      hints: [
        'BFS only handles unit lengths. Can you make every edge a unit edge without changing any distance?',
        'A new vertex in the middle of an edge has exactly one way in and one way out.'
      ],
      solution: String.raw`**(a) Construction.** Build $G'$: keep all vertices of $G$ and all length-1 edges. For every length-2 edge $e = u \to v$ add a new vertex $x_e$ and the two edges $u \to x_e$, $x_e \to v$. $G'$ has at most $V + E$ vertices and $2E$ edges and is built in $O(V+E)$ time.

**Claim.** For original vertices $v$, $dist_{G'}(s, v) = dist_G(s, v)$.

- Any $s$-$v$ path in $G$ of length $L$ becomes an $s$-$v$ path in $G'$ with exactly $L$ edges (each length-2 edge becomes its two halves), so $dist_{G'} \le dist_G$.
- Conversely, a walk in $G'$ that enters a subdivision vertex $x_e$ must arrive from $u$ and leave to $v$, since $x_e$ has in-degree 1 and out-degree 1. Collapsing each such pair back to $e$ turns an $s$-$v$ walk in $G'$ with $L$ edges into an $s$-$v$ walk in $G$ of length $L$. So $dist_G \le dist_{G'}$.

**Algorithm.** BFS from $s$ in $G'$; report $dist_{G'}(s, v)$ for every original $v$. Time $O(V+E)$.

**(b)** Replace an edge of length $\ell$ by a chain of $\ell$ unit edges through $\ell - 1$ new vertices. $G'$ has at most $V + (c-1)E$ vertices and at most $cE$ edges, so BFS takes $O(V + cE)$. The proof is identical.

**(c)** The size of $G'$ is about $V + \sum_e \ell(e)$. If lengths are written in binary, a length of $2^{b}$ costs only $b$ bits of input but adds $2^{b}$ vertices. The algorithm is **pseudo-polynomial**: polynomial in the values, exponential in their bit-lengths. For general lengths use Dijkstra, $O(E \log V)$.`
    },
    {
      id: 'graphs-bus-transfers', type: 'written', title: 'Fewest bus rides', difficulty: 2,
      prompt: String.raw`A city has $n$ bus stops and $r$ bus routes. Route $j$ is given as a list of the stops it serves, and a bus on route $j$ can carry you between **any** two stops of its list (you can ride as far as you like). Let $N$ be the total length of all the route lists. Describe and analyze an $O(n + r + N)$-time algorithm that computes the fewest bus rides needed to get from stop $s$ to stop $t$ (0 if $s = t$), or reports that $t$ cannot be reached by bus.

Explain why the "obvious" graph, with an edge between every two stops that share a route, does not meet this time bound.`,
      rubric: [
        'Bipartite graph: a vertex for each stop and each route; an edge between stop x and route j whenever route j serves x',
        'BFS from stop s; the answer is dist(t)/2 (distances to stops are even)',
        'Correctness: a sequence of k rides corresponds to an s-t walk of length 2k alternating stop, route, stop, ... and conversely',
        'Time O(n + r + N) and the observation that the stop-to-stop graph can have about the sum of squared route lengths edges (quadratic)'
      ],
      hints: [
        'A ride is "board route j at x, get off at y". What if routes themselves were vertices?',
        'In your graph every path from a stop to a stop has even length.'
      ],
      solution: String.raw`**Graph.** Build an undirected bipartite graph $B$ with a vertex for each of the $n$ stops and each of the $r$ routes, and an edge between stop $x$ and route $j$ whenever $x$ appears in route $j$'s list. $B$ has $n + r$ vertices and at most $N$ edges, built in $O(n + r + N)$.

**Algorithm.** BFS in $B$ from stop $s$. If $t$ is not discovered, report "unreachable"; otherwise output $dist_B(s, t) / 2$.

**Correctness.** $B$ is bipartite (stops on one side, routes on the other), so every walk alternates stop, route, stop, ... and every stop-to-stop walk has even length. A trip with $k$ rides, boarding route $j_1$ at $s$, getting off at $x_1$, boarding $j_2$ at $x_1$, ..., getting off route $j_k$ at $t$, is exactly the walk $s, j_1, x_1, j_2, \dots, j_k, t$ in $B$, with $2k$ edges, because each consecutive (stop, route) pair is an edge precisely when the route serves that stop. Conversely, every $s$-$t$ walk with $2k$ edges reads as such a trip with $k$ rides. So the fewest rides is $dist_B(s,t)/2$.

**Time.** $O(n + r + N)$.

**Why not stop-to-stop edges?** Joining every pair of stops on a route creates about $\binom{|R_j|}{2}$ edges for route $j$. A single route through all $n$ stops already gives $\Theta(n^2)$ edges, although its list has length $n$. The bipartite "route vertex" replaces each such clique by a star with $|R_j|$ edges. (BFS on the clique graph would also be correct, just slower: $O(n + \sum_j |R_j|^2)$.)`
    },
    {
      id: 'graphs-palindrome-walk', type: 'written', title: 'Shortest palindromic walk', difficulty: 3,
      prompt: String.raw`$G = (V, E)$ is a directed graph whose edges are labeled with letters. The *label* of a walk is the string of its edge labels in order. Given vertices $s$ and $t$, describe and analyze an algorithm that computes the minimum number of edges in a walk from $s$ to $t$ whose label is a **palindrome** (reads the same forwards and backwards), or reports that no such walk exists. The empty walk counts if $s = t$. Your algorithm should run in $O(V^2 + E^2)$ time.`,
      rubric: [
        'State (u, v): a prefix walk from s to u and a suffix walk from v to t whose labels are reverses of each other',
        'Edges (u, v) -> (u2, v2) for every edge u -> u2 and every edge v2 -> v with the same label; start (s, t)',
        'Two kinds of finish: (x, x) gives even length 2d; (u, v) with an edge u -> v gives odd length 2d + 1; answer is the minimum',
        'Correctness argument splitting a palindromic walk into its two halves (and middle edge)',
        'Size V^2 vertices and at most E^2 edges, BFS O(V^2 + E^2)'
      ],
      hints: [
        'Build the walk from both ends at once: one token walks forward from s, another walks backward from t.',
        'The two tokens must use edges with equal labels at every step. When are you done? Think about even and odd lengths separately.'
      ],
      solution: String.raw`**Idea.** A palindrome is determined by matching its first and last letters, then the second and second-to-last, and so on. Grow the walk from both ends simultaneously.

**Graph.** $H$ has a vertex $(u, v)$ for every $u, v \in V$. Meaning: "there is a walk $P$ from $s$ to $u$ and a walk $Q$ from $v$ to $t$ with the same number of edges, and the label of $Q$ is the reverse of the label of $P$." For every edge $u \to u'$ with label $a$ and every edge $v' \to v$ with the **same** label $a$, add the directed edge $(u, v) \to (u', v')$ to $H$. Start vertex: $(s, t)$.

**Algorithm.** BFS in $H$ from $(s, t)$, giving $d(u, v)$. Then compute
$$\text{ans} = \min\Big( \min_{x \in V} 2\,d(x, x),\ \ \min_{u \to v \in E} \big(2\,d(u, v) + 1\big) \Big),$$
ignoring infinite terms, and report "no such walk" if everything is infinite.

**Correctness.** By induction on $d$, $H$ has a walk of length $d$ from $(s, t)$ to $(u, v)$ iff there are walks $P: s \leadsto u$ and $Q: v \leadsto t$, each with $d$ edges, with $label(Q) = \text{reverse}(label(P))$. (Extending $P$ by an edge labeled $a$ at its end and $Q$ by an edge labeled $a$ at its front keeps the property, and every such pair arises this way.)

Now take any palindromic $s$-$t$ walk $W$.
- If $W$ has $2d$ edges, let $x$ be its middle vertex, $P$ the first $d$ edges and $Q$ the last $d$. $W$ is a palindrome iff $label(Q)$ is the reverse of $label(P)$, i.e. iff $(x, x)$ is reachable in $d$ steps.
- If $W$ has $2d + 1$ edges, let $u \to v$ be its middle edge, $P$ the first $d$ edges (ending at $u$), $Q$ the last $d$ (starting at $v$). The middle letter is unconstrained, so $W$ is a palindrome iff $(u, v)$ is reachable in $d$ steps.

So the shortest palindromic walk has length exactly the formula above, using BFS distances (the smallest $d$ for each state).

**Time.** $H$ has $V^2$ vertices. The out-edges of $(u, v)$ are found by trying every out-edge of $u$ against every in-edge of $v$, at most $\deg^+(u)\deg^-(v)$ pairs, and $\sum_{u, v} \deg^+(u)\deg^-(v) = E \cdot E$. So building and searching $H$ takes $O(V^2 + E^2)$, and the final minimum is $O(V + E)$.

**Remark.** This is the "two tokens" pattern: one token walks forward in $G$, the other walks forward in $rev(G)$, and they must read the same letter at each step.`
    },
    {
      id: 'graphs-bus-code', type: 'code', title: 'Implement fewest bus rides', difficulty: 2,
      prompt: String.raw`Write <code>fewestBuses(n, routes, s, t)</code>. Stops are <code>0..n-1</code>; <code>routes</code> is an array of routes, each an array of the stops it serves (a bus on a route can take you between any two of its stops). Return the minimum number of bus rides to get from stop <code>s</code> to stop <code>t</code>, <code>0</code> if <code>s === t</code>, or <code>-1</code> if it is impossible. Aim for time linear in <code>n</code> + (number of routes) + (total length of all routes): put the routes themselves into the graph.`,
      fn: 'fewestBuses',
      starter: 'function fewestBuses(n, routes, s, t) {\n  // BFS on a bipartite graph: stop vertices 0..n-1, route vertices n..n+r-1\n}\n',
      reference: function (n, routes, s, t) {
        if (s === t) return 0;
        const r = routes.length;
        const adj = Array.from({ length: n + r }, () => []);
        routes.forEach((stops, j) => { for (const x of stops) { adj[x].push(n + j); adj[n + j].push(x); } });
        const d = new Array(n + r).fill(-1);
        d[s] = 0;
        const q = [s];
        for (let h = 0; h < q.length; h++) {
          const u = q[h];
          for (const v of adj[u]) if (d[v] === -1) { d[v] = d[u] + 1; q.push(v); }
        }
        return d[t] === -1 ? -1 : d[t] / 2;
      },
      tests: [
        [3, [], 0, 0],
        [3, [], 0, 2],
        [4, [[0, 1, 2, 3]], 0, 3],
        [5, [[0, 1], [1, 2], [2, 3], [3, 4]], 0, 4],
        [6, [[0, 1, 2], [2, 3], [3, 4, 5], [0, 5]], 1, 4],
        [6, [[0, 1], [2, 3], [4, 5]], 0, 5],
        [7, [[0, 2, 4, 6], [1, 3, 5], [6, 5], [4, 1]], 0, 3]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 9);
        const r = Math.floor(Math.random() * 6);
        const routes = [];
        for (let j = 0; j < r; j++) {
          const len = 1 + Math.floor(Math.random() * Math.min(n, 4));
          const stops = [];
          while (stops.length < len) { const x = Math.floor(Math.random() * n); if (!stops.includes(x)) stops.push(x); }
          routes.push(stops);
        }
        return [n, routes, Math.floor(Math.random() * n), Math.floor(Math.random() * n)];
      },
      hints: [
        'Make a vertex for every stop AND every route; connect a stop to each route that serves it.',
        'Every ride is two edges in this graph (stop -> route -> stop), so the answer is half the BFS distance.'
      ],
      solution: String.raw`**Model.** Vertices $0..n-1$ are stops and $n..n+r-1$ are routes; stop $x$ is adjacent to route vertex $n + j$ whenever route $j$ serves $x$. The graph is bipartite, and a trip with $k$ rides is exactly a walk $s, R_1, x_1, R_2, \dots, R_k, t$ with $2k$ edges.

**Algorithm.** BFS from $s$; return $dist(t)/2$, or $-1$ if $t$ was not reached. Handle $s = t$ first (0 rides).

**Time.** $n + r$ vertices and $2N$ adjacency entries, where $N$ is the total route length: $O(n + r + N)$. Joining all pairs of stops on a route would also be correct, but it can create $\Theta(N^2)$ edges.`
    },
    {
      id: 'graphs-exactwalk-code', type: 'code', title: 'Walk with exactly L edges', difficulty: 2,
      prompt: String.raw`Write <code>exactWalk(n, edges, s, t, L)</code> for a **directed** graph on vertices <code>0..n-1</code> with edges <code>[u, v]</code> meaning $u \to v$. Return <code>true</code> if there is a walk from <code>s</code> to <code>t</code> with **exactly** <code>L</code> edges (vertices and edges may repeat; for <code>L = 0</code> the answer is <code>s === t</code>), and <code>false</code> otherwise. Target time $O(L(V+E))$ with $O(V)$ extra memory.`,
      fn: 'exactWalk',
      starter: 'function exactWalk(n, edges, s, t, L) {\n  // sweep the layered graph: R_0 = {s}, R_{i+1} = out-neighbors of R_i\n}\n',
      reference: function (n, edges, s, t, L) {
        let cur = new Array(n).fill(false);
        cur[s] = true;
        for (let i = 0; i < L; i++) {
          const nxt = new Array(n).fill(false);
          for (const [u, v] of edges) if (cur[u]) nxt[v] = true;
          cur = nxt;
        }
        return cur[t];
      },
      tests: [
        [1, [], 0, 0, 0],
        [1, [], 0, 0, 1],
        [1, [[0, 0]], 0, 0, 5],
        [2, [[0, 1]], 0, 1, 2],
        [4, [[0, 1], [1, 2], [2, 3], [0, 3], [3, 1]], 0, 3, 2],
        [4, [[0, 1], [1, 2], [2, 3], [0, 3], [3, 1]], 0, 3, 4],
        [4, [[0, 1], [1, 2], [2, 3], [0, 3], [3, 1]], 0, 3, 5],
        [4, [[0, 1], [1, 2], [2, 3], [0, 3], [3, 1]], 0, 3, 30],
        [3, [[0, 1], [1, 0], [1, 2]], 0, 2, 4],
        [3, [[0, 1], [1, 0], [1, 2]], 0, 2, 7]
      ],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 7);
        const m = Math.floor(Math.random() * 2 * n);
        const edges = [];
        for (let i = 0; i < m; i++) edges.push([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]);
        return [n, edges, Math.floor(Math.random() * n), Math.floor(Math.random() * n), Math.floor(Math.random() * 13)];
      },
      hints: [
        'BFS distance is not enough: a walk cannot wait, so a short walk need not extend to length exactly L.',
        'Keep the set R_i of vertices reachable from s by walks of exactly i edges; R_{i+1} is the set of heads of edges leaving R_i.'
      ],
      solution: String.raw`**Model.** The layered graph $H$ has vertices $(v, i)$ for $0 \le i \le L$ and an edge $(u, i) \to (v, i+1)$ for each edge $u \to v$. A walk of exactly $L$ edges from $s$ to $t$ is a path from $(s, 0)$ to $(t, L)$ in $H$. Since every edge goes up one layer, $H$ is a DAG and can be explored layer by layer.

**Algorithm.** $R_0 = \{s\}$; $R_{i+1} = \{v : u \to v \in E,\ u \in R_i\}$. Return whether $t \in R_L$. By induction, $R_i$ is exactly the set of vertices reachable by walks with $i$ edges.

**Time.** Each layer costs $O(V + E)$, so $O(L(V+E))$ total, keeping only two boolean arrays. (In the lesson's example, edges $s \to a$, $a \to b$, $b \to t$, $s \to t$, $t \to a$, the answer is false for $L = 2$ and $L = 5$ but true for $L = 4$; that graph is one of the tests, with $s, a, b, t = 0, 1, 2, 3$.)`
    },
    {
      id: 'graphs-mock1-rover', type: 'written', title: 'The solar rover', difficulty: 3,
      tags: ['mt2-mock-1', 'modeling', 'bfs'],
      prompt: String.raw`A rover explores an $n \times n$ grid. Each cell is **rock**, **open**, or a **charging pad** (pads are open cells you can drive over). The rover's battery holds an integer amount between $0$ and $B$, where $B \ge 1$. Every second the rover performs exactly one action:

- **drive** to an edge-adjacent cell that is not rock, which uses 1 unit of battery and is allowed only if the battery is at least 1; or
- **recharge**, allowed only while standing on a pad, which sets the battery to $B$.

The rover starts on cell $s$ at time 0 with a full battery. It must reach cell $t$ (with any battery level).

**(a)** Describe and analyze an algorithm that computes the minimum number of seconds needed to reach $t$, or reports that $t$ is unreachable. Describe your graph precisely and state the running time in terms of $n$ and $B$.

**(b)** $B$ is given in binary and may be astronomically large. Show how to make your algorithm run in time polynomial in $n$ regardless of $B$.

**(c)** Each recharge now costs a fee, and the mission budget allows **at most $r$ recharges** in total. Modify your solution and give the new running time.`,
      rubric: [
        '(3 pts) Vertices (x, b): x a non-rock cell, 0 <= b <= B, with meaning; drive edges (x, b) -> (y, b-1) for adjacent non-rock y when b >= 1; recharge edges (x, b) -> (x, B) on pads; directed',
        '(1 pt) BFS from (s, B); answer min over b of dist(t, b), unreachable if no copy of t is reached',
        '(1 pt) Correctness: action sequences correspond to walks from (s, B), one edge per second, so BFS distance = time',
        '(1 pt) Running time O(n^2 B): (B+1)n^2 vertices, at most 5 out-edges each',
        '(2 pts) Part (b): if B >= n^2 - 1 the battery never binds (a fewest-move route is a simple path with at most n^2 - 1 drives and needs no recharge), so run plain BFS on the grid; otherwise use (a); total O(n^2 min(B, n^2)) = O(n^4)',
        '(2 pts) Part (c): add a recharge counter c in 0..r; recharge edges go from layer c to c+1 only; BFS from (s, B, 0); O(r n^2 min(B, n^2)) time'
      ],
      hints: [
        'Two visits to the same cell with different battery levels have different futures. What must a state remember?',
        'Every action takes one second, so BFS (not Dijkstra) works on your state graph.',
        'For (b): how many drives does a fastest route use if the battery were unlimited?'
      ],
      solution: String.raw`**(a) Graph.** Let $H$ have a vertex $(x, b)$ for every non-rock cell $x$ and every $0 \le b \le B$, meaning "the rover is on $x$ with $b$ units of battery". Edges (directed):

- **Drive:** for every $(x, b)$ with $b \ge 1$ and every edge-adjacent non-rock cell $y$ of $x$: $(x, b) \to (y, b - 1)$.
- **Recharge:** for every pad $x$ and every $b < B$: $(x, b) \to (x, B)$.

$H$ is directed: a drive lowers the battery and cannot be undone by another drive.

**Algorithm.** Run BFS in $H$ from $(s, B)$. The answer is $\min_{0 \le b \le B} dist((t, b))$; if no copy of $t$ is reached, report "unreachable". (Equivalently, add a super-target $t^*$ with edges from every $(t, b)$ and report $dist(t^*) - 1$.)

**Correctness.** Each second the rover performs one legal action, and the legal actions from a configuration (cell, battery) are exactly the out-edges of the corresponding vertex. By induction on time, the configurations reachable after exactly $T$ seconds are the endpoints of walks of length $T$ from $(s, B)$. So the earliest time the rover can be on $t$ is the smallest BFS distance to a copy of $t$. (A recharge at full battery is a wasted second, so omitting the edge $(x, B) \to (x, B)$ changes nothing.)

**Time.** $(B+1)n^2$ vertices, each with at most 4 drive edges and 1 recharge edge, generated on the fly in $O(1)$ each: $O(n^2 B)$.

**(b) Capping $B$.** Ignore the battery for a moment and let $d$ be the BFS distance from $s$ to $t$ in the plain grid graph (non-rock cells, adjacency). A shortest route is a simple path, so $d \le n^2 - 1$. With the battery, the rover can never arrive earlier than $d$ seconds, since every second moves it at most one cell. If $B \ge n^2 - 1$, the rover can drive that shortest route directly without ever recharging, so the answer is exactly $d$. Algorithm: if $B \ge n^2 - 1$, run BFS on the plain grid, $O(n^2)$; otherwise run (a), $O(n^2 B) = O(n^4)$. In all cases the time is $O(n^2 \min(B, n^2)) = O(n^4)$, polynomial in $n$, and comparing $B$ to $n^2$ takes time proportional to its bit-length.

**(c) At most $r$ recharges.** Add a counter: vertices $(x, b, c)$ with $0 \le c \le r$, meaning "on $x$, battery $b$, $c$ recharges used". Drive edges keep $c$: $(x, b, c) \to (y, b-1, c)$. Recharge edges increase it: $(x, b, c) \to (x, B, c+1)$ for pads $x$, $b < B$, and $c < r$; there is no recharge edge out of layer $r$, which enforces the budget. BFS from $(s, B, 0)$; answer $\min_{b, c} dist((t, b, c))$. The correctness argument is the same, with the counter recording the recharges. Time $O(r n^2 B)$, and with the cap from (b) (which still applies, because the capped route uses no recharges at all) $O(r n^2 \min(B, n^2))$, polynomial in $n$ and $r$.`
    },
    {
      id: 'graphs-mock3-twin-robots', type: 'written', title: 'Twin robots, one joystick', difficulty: 3,
      tags: ['mt2-mock-3', 'modeling', 'bfs', 'product-graph'],
      prompt: String.raw`Two robots, $A$ and $B$, stand on distinct open cells $a$ and $b$ of an $n \times n$ grid in which some cells are walls. A single joystick sends commands from $\{N, E, S, W\}$. Each command is executed by **both** robots at the same time: each robot moves one cell in that direction if that cell is on the grid and open, and otherwise **stays where it is**. Robots are small, so they may share a cell.

**(a)** Describe and analyze an algorithm that computes the shortest command sequence after which both robots stand on the **same** cell (any cell), or reports that this is impossible. Describe your graph precisely and state the running time in terms of $n$.

**(b)** New rule: the robots must **never** be on the same cell, and the goal is to bring $A$ to cell $t_A$ and $B$ to cell $t_B$ (with $t_A \ne t_B$) at the same moment. Modify your solution.

**(c)** Suppose there are $k$ robots instead of two, all obeying the same joystick, and the goal is again to gather all of them on one cell. How large is the analogous state graph? Is the resulting algorithm polynomial when $k$ is part of the input?`,
      rubric: [
        '(2 pts) Vertices: ordered pairs (p, q) of open cells (positions of A and B), at most n^4, meaning stated',
        '(2 pts) Edges: for each command d, (p, q) -> (move(p, d), move(q, d)) with the stay-put rule spelled out; graph is directed',
        '(1 pt) BFS from (a, b); answer = min over diagonal vertices (p, p) of dist (or a super-target); impossible if none reached',
        '(1 pt) Correctness: command sequences correspond to walks from (a, b), one edge per command',
        '(1 pt) Time O(n^4): n^4 vertices, 4 out-edges each, each computed in O(1)',
        '(2 pts) Part (b): delete all diagonal vertices (p, p) (and edges into them); BFS from (a, b) to (t_A, t_B); still O(n^4)',
        '(1 pt) Part (c): n^(2k) states with 4 edges each, so O(n^(2k)); polynomial for constant k but exponential when k is part of the input'
      ],
      hints: [
        'One robot alone is an ordinary grid BFS. What do you need to know to predict the next configuration of both?',
        'The stay-put rule means a command cannot always be undone by the opposite command. Is your graph directed?',
        'For (b), which configurations are forbidden? Remove them from the graph rather than changing BFS.'
      ],
      solution: String.raw`For a cell $p$ and direction $d$, let $move(p, d)$ be the cell one step from $p$ in direction $d$ if it is on the grid and open, and $p$ itself otherwise.

**(a) Graph.** $H$ has a vertex $(p, q)$ for every ordered pair of open cells, meaning "$A$ is on $p$ and $B$ is on $q$". For each vertex and each of the four commands $d$, there is an edge
$$(p, q) \to (move(p, d),\ move(q, d)).$$
$H$ is **directed**: if $A$ is blocked by a wall and stays while $B$ moves, the opposite command moves $A$ away, so the move is not undone. (Self-loops, when both robots are blocked, are harmless.)

**Algorithm.** BFS in $H$ from $(a, b)$. Answer $\min_p dist((p, p))$ over all open cells $p$, or "impossible" if no diagonal vertex is reached. Equivalently, add a super-target $z$ with an edge from every $(p, p)$ and report $dist(z) - 1$. The command sequence is read off the BFS parent pointers.

**Correctness.** A command changes the configuration from $(p, q)$ to exactly $(move(p,d), move(q,d))$, so command sequences of length $T$ starting from $(a, b)$ are in one-to-one correspondence with walks of length $T$ from $(a, b)$ in $H$, and the configuration after the sequence is the endpoint of the walk. The robots share a cell exactly when the configuration is diagonal, so the shortest gathering sequence has length equal to the BFS distance to the nearest diagonal vertex. (Once the robots meet they stay together forever, since they occupy the same cell and receive the same commands; so "at the end of the sequence" and "at some moment" coincide.)

**Time.** At most $n^2 \cdot n^2 = n^4$ vertices, 4 out-edges each, each computed in $O(1)$ from the grid: $O(n^4)$.

**(b)** Remove every diagonal vertex $(p, p)$ from $H$, together with all edges entering or leaving it. Walks in the remaining graph $H'$ are exactly the command sequences that never put both robots on the same cell (the start $(a, b)$ is not diagonal because $a \ne b$). Run BFS in $H'$ from $(a, b)$ and report $dist((t_A, t_B))$, or "impossible". Same correctness argument; time still $O(n^4)$.

**(c)** A configuration is a $k$-tuple of open cells: up to $(n^2)^k = n^{2k}$ vertices, each with 4 out-edges, so BFS takes $O(n^{2k})$ time (times $O(k)$ to compute each move). For any fixed $k$ this is polynomial, but when $k$ is part of the input it is exponential: the state space genuinely grows as $n^{2k}$. (Gathering many robots this way is closely related to finding a synchronizing word for an automaton, where the "track all subsets" approach is exponential too.)`
    }
  ]
});
