/* Graph parsing + step-traced classic algorithms for the visualizer. */
(function (root) {
  'use strict';
  function parseGraph(text) {
    const errors = [];
    let directed = false;
    const names = [], idx = new Map();
    const v = (n) => { if (!idx.has(n)) { idx.set(n, names.length); names.push(n); } return idx.get(n); };
    const edges = [];
    String(text || '').split(/\r?\n/).forEach((raw, i) => {
      const line = raw.replace(/(\/\/|#).*$/, '').trim();
      if (!line) return;
      if (/^directed$/i.test(line)) { directed = true; return; }
      if (/^undirected$/i.test(line)) { directed = false; return; }
      const tok = line.replace(/\s*(->|→|--|—)\s*/g, ' ').replace(/[(),:]/g, ' ').split(/\s+/).filter(Boolean);
      if (tok.length === 1) { v(tok[0]); return; }
      if (tok.length < 2 || tok.length > 3) { errors.push(`Line ${i + 1}: expected "u v [weight]".`); return; }
      const w = tok.length === 3 ? Number(tok[2]) : 1;
      if (Number.isNaN(w)) { errors.push(`Line ${i + 1}: weight "${tok[2]}" is not a number.`); return; }
      edges.push({ u: v(tok[0]), v: v(tok[1]), w, weighted: tok.length === 3 });
    });
    edges.forEach((e, i) => { e.id = i; });
    const n = names.length;
    const adj = Array.from({ length: n }, () => []);
    for (const e of edges) { adj[e.u].push({ to: e.v, w: e.w, id: e.id }); if (!directed) adj[e.v].push({ to: e.u, w: e.w, id: e.id }); }
    for (const a of adj) a.sort((x, y) => names[x.to].localeCompare(names[y.to], undefined, { numeric: true }));
    const weighted = edges.some((e) => e.weighted);
    return { graph: errors.length ? null : { names, idx, edges, adj, directed, weighted, n }, errors };
  }
  const fmt = (x) => (x === Infinity ? '∞' : x === -Infinity ? '−∞' : String(Math.round(x * 1000) / 1000));

  function snapshot(state) { return JSON.parse(JSON.stringify(state)); }

  /* Each algorithm returns { steps: [{msg, nodes:{i:cls}, edges:{id:cls}, table:{cols, rows}, extra}], summary } */
  function bfs(G, s) {
    const steps = []; const nodes = {}, edges = {};
    const dist = Array(G.n).fill(Infinity), pred = Array(G.n).fill(null);
    const table = () => ({ cols: ['vertex', 'dist', 'pred'], rows: G.names.map((nm, i) => [nm, fmt(dist[i]), pred[i] === null ? '—' : G.names[pred[i]]]) });
    const push = (msg, extra) => steps.push(snapshot({ msg, nodes, edges, table: table(), extra }));
    dist[s] = 0; nodes[s] = 'frontier'; const Q = [s];
    push(`Start: put ${G.names[s]} in the queue with dist 0.`, { queue: Q.map((x) => G.names[x]) });
    while (Q.length) {
      const u = Q.shift(); nodes[u] = 'current';
      push(`Dequeue ${G.names[u]} (dist ${dist[u]}). Scan its out-edges.`, { queue: Q.map((x) => G.names[x]) });
      for (const { to, id } of G.adj[u]) {
        if (dist[to] === Infinity) {
          dist[to] = dist[u] + 1; pred[to] = u; nodes[to] = 'frontier'; edges[id] = 'tree'; Q.push(to);
          push(`Discover ${G.names[to]} via ${G.names[u]}→${G.names[to]}: dist = ${dist[to]}, enqueue.`, { queue: Q.map((x) => G.names[x]) });
        } else if (edges[id] !== 'tree') { edges[id] = edges[id] || 'nontree'; }
      }
      nodes[u] = 'done';
    }
    push('Queue empty — BFS done. Tree edges form a shortest-path tree (fewest edges).', { queue: [] });
    return { steps };
  }

  function dfs(G, s0) {
    const steps = []; const nodes = {}, edges = {};
    const pre = Array(G.n).fill(null), post = Array(G.n).fill(null), parent = Array(G.n).fill(null);
    let clock = 0; const order = [];
    const table = () => ({ cols: ['vertex', 'pre', 'post', 'parent'], rows: G.names.map((nm, i) => [nm, pre[i] ?? '', post[i] ?? '', parent[i] === null ? '—' : G.names[parent[i]]]) });
    const push = (msg) => steps.push(snapshot({ msg, nodes, edges, table: table() }));
    const visit = (u) => {
      pre[u] = ++clock; nodes[u] = 'current';
      push(`Enter ${G.names[u]}: pre(${G.names[u]}) = ${clock}.`);
      for (const { to, id } of G.adj[u]) {
        if (pre[to] === null) {
          edges[id] = 'tree'; parent[to] = u;
          push(`Edge ${G.names[u]}→${G.names[to]} is a tree edge; recurse.`);
          visit(to); nodes[u] = 'current';
        } else if (G.directed) {
          let kind;
          if (post[to] === null) kind = 'back';
          else if (pre[u] < pre[to]) kind = 'forward';
          else kind = 'cross';
          if (!edges[id]) { edges[id] = kind; push(`Edge ${G.names[u]}→${G.names[to]} is a ${kind} edge (${kind === 'back' ? G.names[to] + ' is still active: cycle!' : kind === 'forward' ? 'to a finished descendant' : G.names[to] + ' finished earlier, not a descendant'}).`); }
        } else if (to !== parent[u] && !edges[id]) {
          edges[id] = 'back'; push(`Edge ${G.names[u]}–${G.names[to]} is a back edge (cycle in undirected graph).`);
        }
      }
      post[u] = ++clock; nodes[u] = 'done'; order.push(u);
      push(`Leave ${G.names[u]}: post(${G.names[u]}) = ${clock}.`);
    };
    const starts = [s0, ...[...Array(G.n).keys()].filter((x) => x !== s0)];
    for (const s of starts) if (pre[s] === null) { if (s !== s0) push(`Restart DFS from unvisited vertex ${G.names[s]}.`); visit(s); }
    const hasBack = Object.values(edges).includes('back');
    const msg = G.directed ? (hasBack ? 'Done. A back edge exists ⇒ the graph has a directed cycle.' : `Done. No back edges ⇒ DAG. Reverse postorder (topological order): ${order.slice().reverse().map((x) => G.names[x]).join(', ')}.`) : 'Done.';
    push(msg);
    return { steps, order };
  }

  function topo(G) {
    if (!G.directed) return { steps: [{ msg: 'Topological sort needs a directed graph (add a line "directed").', nodes: {}, edges: {}, table: null }] };
    const r = dfs(G, 0);
    const steps = r.steps;
    const last = steps[steps.length - 1];
    if (!Object.values(last.edges).includes('back')) {
      const order = r.order.slice().reverse();
      const nodes = {}; order.forEach((x) => { nodes[x] = 'done'; });
      steps.push({ msg: 'Topological order = vertices sorted by decreasing post time: ' + order.map((x) => G.names[x]).join(' → '), nodes, edges: last.edges, table: { cols: ['position', 'vertex', 'post'], rows: order.map((x, i) => [i + 1, G.names[x], last.table.rows[x][2]]) } });
    }
    return { steps };
  }

  function scc(G) {
    if (!G.directed) return { steps: [{ msg: 'SCCs are defined for directed graphs (add a line "directed"). For undirected graphs, components = whatever-first search.', nodes: {}, edges: {}, table: null }] };
    const steps = [];
    // DFS on reversed graph for postorder
    const radj = Array.from({ length: G.n }, () => []);
    G.edges.forEach((e) => radj[e.v].push({ to: e.u, id: e.id }));
    const seen = Array(G.n).fill(false); const post = []; const postNum = Array(G.n).fill(null); let clock = 0;
    const visitR = (u) => { seen[u] = true; clock++; for (const { to } of radj[u]) if (!seen[to]) visitR(to); postNum[u] = ++clock; post.push(u); };
    for (let s = 0; s < G.n; s++) if (!seen[s]) visitR(s);
    steps.push({ msg: 'Phase 1: DFS on the REVERSED graph rev(G) records post times. The vertex with the largest post time lies in a source SCC of rev(G) = a sink SCC of G.', nodes: {}, edges: {}, table: { cols: ['vertex', 'post in rev(G)'], rows: G.names.map((nm, i) => [nm, postNum[i]]) } });
    const comp = Array(G.n).fill(null); let c = 0; const nodes = {}, edges = {};
    const order = post.slice().reverse();
    for (const s of order) {
      if (comp[s] !== null) continue;
      c++;
      const stack = [s]; comp[s] = c; const members = [];
      while (stack.length) { const u = stack.pop(); members.push(u); nodes[u] = 'c' + ((c - 1) % 8); for (const { to, id } of G.adj[u]) { if (comp[to] === null) { comp[to] = c; stack.push(to); edges[id] = 'c' + ((c - 1) % 8); } else if (comp[to] === c) edges[id] = 'c' + ((c - 1) % 8); } }
      steps.push(snapshot({ msg: `Phase 2: highest remaining post time is ${G.names[s]}. Search from it in G (ignoring already-labeled vertices): SCC #${c} = {${members.map((x) => G.names[x]).join(', ')}} — a sink component of what remains.`, nodes, edges, table: { cols: ['vertex', 'SCC'], rows: G.names.map((nm, i) => [nm, comp[i] ?? '']) } }));
    }
    steps.push(snapshot({ msg: `Done: ${c} strongly connected component(s). Contracting each gives the meta-graph, which is a DAG.`, nodes, edges, table: steps[steps.length - 1].table }));
    return { steps };
  }

  function dijkstra(G, s) {
    const steps = []; const nodes = {}, edges = {};
    const dist = Array(G.n).fill(Infinity), pred = Array(G.n).fill(null), predE = Array(G.n).fill(null), done = Array(G.n).fill(false);
    const neg = G.edges.some((e) => e.w < 0);
    const table = () => ({ cols: ['vertex', 'dist', 'pred', 'finalized'], rows: G.names.map((nm, i) => [nm, fmt(dist[i]), pred[i] === null ? '—' : G.names[pred[i]], done[i] ? '✓' : '']) });
    const push = (msg) => steps.push(snapshot({ msg, nodes, edges, table: table() }));
    dist[s] = 0; nodes[s] = 'frontier';
    push(`Initialize dist(${G.names[s]}) = 0, all others ∞.${neg ? ' ⚠ Negative edge weights present: Dijkstra may give WRONG answers (use Bellman–Ford).' : ''}`);
    for (;;) {
      let u = -1; for (let i = 0; i < G.n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break;
      done[u] = true; nodes[u] = 'current';
      if (predE[u] !== null) edges[predE[u]] = 'tree';
      push(`Extract-min: ${G.names[u]} with dist ${fmt(dist[u])} — now final.`);
      for (const { to, w, id } of G.adj[u]) {
        if (dist[u] + w < dist[to]) {
          const old = dist[to];
          if (predE[to] !== null && edges[predE[to]] === 'considered') delete edges[predE[to]];
          dist[to] = dist[u] + w; pred[to] = u; predE[to] = id; edges[id] = 'considered'; if (!done[to]) nodes[to] = 'frontier';
          push(`Edge ${G.names[u]}→${G.names[to]} (w=${fmt(w)}) is tense: relax dist(${G.names[to]}) ${fmt(old)} → ${fmt(dist[to])}.`);
        }
      }
      nodes[u] = 'done';
    }
    push('Done. Final distances in the table; highlighted edges form the shortest-path tree.');
    return { steps };
  }

  function bellmanFord(G, s) {
    const steps = []; const nodes = {}, edges = {};
    const dist = Array(G.n).fill(Infinity), pred = Array(G.n).fill(null), predE = Array(G.n).fill(null);
    const table = () => ({ cols: ['vertex', 'dist', 'pred'], rows: G.names.map((nm, i) => [nm, fmt(dist[i]), pred[i] === null ? '—' : G.names[pred[i]]]) });
    const push = (msg) => steps.push(snapshot({ msg, nodes, edges, table: table() }));
    const arcs = []; G.edges.forEach((e) => { arcs.push([e.u, e.v, e.w, e.id]); if (!G.directed) arcs.push([e.v, e.u, e.w, e.id]); });
    dist[s] = 0; nodes[s] = 'done';
    push(`Initialize dist(${G.names[s]}) = 0. Each phase relaxes every edge; after i phases, dist is correct for all shortest paths with ≤ i edges.`);
    for (let round = 1; round <= G.n - 1; round++) {
      let changed = false;
      for (const [u, v, w, id] of arcs) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; if (predE[v] !== null) delete edges[predE[v]]; pred[v] = u; predE[v] = id; edges[id] = 'tree'; nodes[v] = 'done'; changed = true; }
      push(`Phase ${round}: relaxed all tense edges.${changed ? '' : ' Nothing changed — we can stop early.'}`);
      if (!changed) break;
    }
    const tense = arcs.filter(([u, v, w]) => dist[u] + w < dist[v]);
    if (tense.length) { tense.forEach(([, , , id]) => { edges[id] = 'back'; }); push(`An edge is still tense after V−1 phases ⇒ a NEGATIVE CYCLE is reachable from ${G.names[s]}; shortest paths are undefined.`); }
    else push('No tense edges remain ⇒ no reachable negative cycle; distances are final. Time O(VE).');
    return { steps };
  }

  function dagSP(G, s, longest) {
    if (!G.directed) return { steps: [{ msg: 'DAG algorithms need a directed graph.', nodes: {}, edges: {}, table: null }] };
    const r = dfs(G, s);
    if (Object.values(r.steps[r.steps.length - 1].edges).includes('back')) return { steps: [{ msg: 'The graph has a cycle, so it is not a DAG.', nodes: {}, edges: {}, table: null }] };
    const order = r.order.slice().reverse();
    const steps = []; const nodes = {}, edges = {};
    const init = longest ? -Infinity : Infinity;
    const dist = Array(G.n).fill(init), pred = Array(G.n).fill(null), predE = Array(G.n).fill(null);
    const better = (a, b) => (longest ? a > b : a < b);
    const table = () => ({ cols: ['vertex', longest ? 'longest' : 'dist', 'pred'], rows: G.names.map((nm, i) => [nm, fmt(dist[i]), pred[i] === null ? '—' : G.names[pred[i]]]) });
    const push = (msg) => steps.push(snapshot({ msg, nodes, edges, table: table() }));
    dist[s] = 0;
    push(`Topological order: ${order.map((x) => G.names[x]).join(', ')}. Process vertices in this order; each vertex's value is final when reached.`);
    for (const u of order) {
      nodes[u] = 'current';
      if (dist[u] !== init) for (const { to, w, id } of G.adj[u]) if (better(dist[u] + w, dist[to])) { dist[to] = dist[u] + w; if (predE[to] !== null) delete edges[predE[to]]; pred[to] = u; predE[to] = id; edges[id] = 'tree'; }
      push(`Process ${G.names[u]} (value ${fmt(dist[u])}): update its out-neighbors.`);
      nodes[u] = 'done';
    }
    push(`Done in O(V+E). ${longest ? 'Longest paths are easy in DAGs (NP-hard in general graphs!).' : ''}`);
    return { steps };
  }

  function prim(G, s) {
    if (G.directed) return { steps: [{ msg: 'MSTs are defined for undirected graphs (remove the "directed" line).', nodes: {}, edges: {}, table: null }] };
    const steps = []; const nodes = {}, edges = {};
    const inT = Array(G.n).fill(false), key = Array(G.n).fill(Infinity), via = Array(G.n).fill(null), viaV = Array(G.n).fill(null);
    let total = 0;
    const table = () => ({ cols: ['vertex', 'cheapest edge to tree', 'in tree'], rows: G.names.map((nm, i) => [nm, key[i] === Infinity ? '∞' : `${fmt(key[i])} (from ${G.names[viaV[i]]})`, inT[i] ? '✓' : '']) });
    const push = (msg) => steps.push(snapshot({ msg, nodes, edges, table: table() }));
    key[s] = 0;
    push(`Jarník/Prim: grow one tree from ${G.names[s]}; repeatedly add the lightest edge leaving the tree (it is safe by the cut property).`);
    for (;;) {
      let u = -1; for (let i = 0; i < G.n; i++) if (!inT[i] && key[i] < Infinity && (u < 0 || key[i] < key[u])) u = i;
      if (u < 0) break;
      inT[u] = true; nodes[u] = 'done';
      if (via[u] !== null) { edges[via[u]] = 'tree'; total += key[u]; push(`Add safe edge ${G.names[viaV[u]]}–${G.names[u]} (w=${fmt(key[u])}). Tree weight ${fmt(total)}.`); }
      else push(`Start tree at ${G.names[u]}.`);
      for (const { to, w, id } of G.adj[u]) if (!inT[to] && w < key[to]) { if (via[to] !== null && edges[via[to]] === 'considered') delete edges[via[to]]; key[to] = w; via[to] = id; viaV[to] = u; edges[id] = 'considered'; nodes[to] = 'frontier'; }
    }
    if (inT.some((x) => !x)) push('Some vertices are unreachable: the graph is disconnected (Prim finds an MST of one component).');
    push(`Done. MST weight = ${fmt(total)}.`);
    return { steps };
  }

  function kruskal(G) {
    if (G.directed) return { steps: [{ msg: 'MSTs are defined for undirected graphs (remove the "directed" line).', nodes: {}, edges: {}, table: null }] };
    const steps = []; const nodes = {}, edges = {};
    const parent = [...Array(G.n).keys()];
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const sorted = G.edges.slice().sort((a, b) => a.w - b.w || a.id - b.id);
    let total = 0;
    const table = () => ({ cols: ['vertex', 'component'], rows: G.names.map((nm, i) => [nm, G.names[find(i)]]) });
    const push = (msg) => steps.push(snapshot({ msg, nodes, edges, table: table() }));
    push('Kruskal: scan edges in increasing weight order: ' + sorted.map((e) => `${G.names[e.u]}${G.names[e.v]}(${fmt(e.w)})`).join(', ') + '. Add an edge iff it joins two different components (union–find).');
    for (const e of sorted) {
      const a = find(e.u), b = find(e.v);
      if (a !== b) { parent[a] = b; edges[e.id] = 'tree'; nodes[e.u] = nodes[e.v] = 'done'; total += e.w; push(`${G.names[e.u]}–${G.names[e.v]} (w=${fmt(e.w)}) joins two components ⇒ safe, add it. Weight so far ${fmt(total)}.`); }
      else { edges[e.id] = 'rejected'; push(`${G.names[e.u]}–${G.names[e.v]} (w=${fmt(e.w)}) has both ends in the same component ⇒ useless (would form a cycle), skip.`); }
    }
    push(`Done. MST weight = ${fmt(total)}. Time O(E log E) = O(E log V).`);
    return { steps };
  }

  function floydWarshall(G) {
    const n = G.n; const D = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
    G.edges.forEach((e) => { D[e.u][e.v] = Math.min(D[e.u][e.v], e.w); if (!G.directed) D[e.v][e.u] = Math.min(D[e.v][e.u], e.w); });
    const steps = [];
    const table = (k) => ({ cols: ['', ...G.names], rows: G.names.map((nm, i) => [nm, ...D[i].map(fmt)]), k });
    steps.push({ msg: 'dist⁰(u,v) = weight of edge u→v (0 on diagonal, ∞ if no edge). Recurrence: distᵏ(u,v) = min(distᵏ⁻¹(u,v), distᵏ⁻¹(u,k) + distᵏ⁻¹(k,v)).', nodes: {}, edges: {}, table: table() });
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (D[i][k] + D[k][j] < D[i][j]) D[i][j] = D[i][k] + D[k][j];
      steps.push({ msg: `After allowing ${G.names.slice(0, k + 1).join(', ')} as intermediate vertices (k = ${G.names[k]}).`, nodes: { [k]: 'current' }, edges: {}, table: table(k) });
    }
    const negCycle = D.some((r, i) => r[i] < 0);
    steps.push({ msg: negCycle ? 'A negative diagonal entry ⇒ negative cycle.' : 'Done in O(V³).', nodes: {}, edges: {}, table: table() });
    return { steps };
  }

  const ALGOS = {
    bfs: { name: 'Breadth-first search', needsStart: true, run: bfs },
    dfs: { name: 'Depth-first search (pre/post, edge types)', needsStart: true, run: dfs },
    topo: { name: 'Topological sort (DFS)', run: (G) => topo(G) },
    scc: { name: 'Strongly connected components', run: (G) => scc(G) },
    dijkstra: { name: 'Dijkstra', needsStart: true, run: dijkstra },
    bellman: { name: 'Bellman–Ford', needsStart: true, run: bellmanFord },
    dagsp: { name: 'DAG shortest paths', needsStart: true, run: (G, s) => dagSP(G, s, false) },
    daglp: { name: 'DAG longest paths', needsStart: true, run: (G, s) => dagSP(G, s, true) },
    prim: { name: 'Jarník / Prim MST', needsStart: true, run: prim },
    kruskal: { name: 'Kruskal MST', run: (G) => kruskal(G) },
    floyd: { name: 'Floyd–Warshall (all pairs)', run: (G) => floydWarshall(G) },
  };
  const API = { parseGraph, ALGOS, fmt };
  root.GraphAlgo = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
