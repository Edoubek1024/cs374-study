/* Dynamic-programming table builders for the DP visualizer.
 * Each builder returns { title, rowLabels, colLabels, cells[i][j] (value|null), order:[[i,j,{deps,expl}]], trace:[[i,j]], answer, spec } */
(function (root) {
  'use strict';
  const cellsOf = (r, c, v = null) => Array.from({ length: r }, () => Array(c).fill(v));
  const parseList = (s) => String(s).split(/[\s,]+/).filter(Boolean).map(Number);

  const PROBLEMS = {
    edit: {
      name: 'Edit distance',
      inputs: [{ key: 'A', label: 'String A', def: 'ALGORITHM' }, { key: 'B', label: 'String B', def: 'ALTRUISTIC' }],
      spec: String.raw`$\mathit{Edit}(i,j)$ = edit distance between prefixes $A[1..i]$ and $B[1..j]$.

$$\mathit{Edit}(i,j)=\begin{cases} i & j=0\\ j & i=0\\ \min\{\mathit{Edit}(i-1,j)+1,\ \mathit{Edit}(i,j-1)+1,\ \mathit{Edit}(i-1,j-1)+[A_i\ne B_j]\} & \text{otherwise}\end{cases}$$

Fill row by row; answer is $\mathit{Edit}(m,n)$. Time $O(mn)$.`,
      build({ A, B }) {
        A = [...String(A).slice(0, 14)]; B = [...String(B).slice(0, 14)];
        const m = A.length, n = B.length, T = cellsOf(m + 1, n + 1), order = [], from = cellsOf(m + 1, n + 1);
        for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
          if (i === 0 || j === 0) { T[i][j] = i + j; from[i][j] = i === 0 ? (j ? [0, j - 1] : null) : [i - 1, 0]; order.push([i, j, { deps: from[i][j] ? [from[i][j]] : [], expl: `Base case: ${i === 0 ? `insert ${j} chars` : `delete ${i} chars`} → ${i + j}` }]); continue; }
          const sub = A[i - 1] === B[j - 1] ? 0 : 1;
          const opts = [[T[i - 1][j] + 1, [i - 1, j], 'delete ' + A[i - 1]], [T[i][j - 1] + 1, [i, j - 1], 'insert ' + B[j - 1]], [T[i - 1][j - 1] + sub, [i - 1, j - 1], sub ? `substitute ${A[i - 1]}→${B[j - 1]}` : `match ${A[i - 1]}`]];
          const best = opts.reduce((a, b) => (b[0] < a[0] ? b : a));
          T[i][j] = best[0]; from[i][j] = best[1];
          order.push([i, j, { deps: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], expl: `min(${opts[0][0]} del, ${opts[1][0]} ins, ${opts[2][0]} ${sub ? 'sub' : 'match'}) = ${best[0]}  [${best[2]}]` }]);
        }
        const trace = []; let p = [m, n]; while (p) { trace.push(p); p = from[p[0]][p[1]]; }
        return { rowLabels: ['ε', ...A], colLabels: ['ε', ...B], cells: T, order, trace, answer: `Edit distance = ${T[m][n]}` };
      },
    },
    lcs: {
      name: 'Longest common subsequence',
      inputs: [{ key: 'A', label: 'String A', def: 'ABCBDAB' }, { key: 'B', label: 'String B', def: 'BDCABA' }],
      spec: String.raw`$\mathit{LCS}(i,j)$ = length of a longest common subsequence of $A[1..i]$ and $B[1..j]$.

$$\mathit{LCS}(i,j)=\begin{cases}0 & i=0 \text{ or } j=0\\ \mathit{LCS}(i-1,j-1)+1 & A_i=B_j\\ \max\{\mathit{LCS}(i-1,j),\mathit{LCS}(i,j-1)\} & \text{otherwise}\end{cases}$$`,
      build({ A, B }) {
        A = [...String(A).slice(0, 14)]; B = [...String(B).slice(0, 14)];
        const m = A.length, n = B.length, T = cellsOf(m + 1, n + 1), from = cellsOf(m + 1, n + 1), order = [];
        for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
          if (!i || !j) { T[i][j] = 0; order.push([i, j, { deps: [], expl: 'Base case: empty prefix → 0' }]); continue; }
          if (A[i - 1] === B[j - 1]) { T[i][j] = T[i - 1][j - 1] + 1; from[i][j] = [i - 1, j - 1]; order.push([i, j, { deps: [[i - 1, j - 1]], expl: `A${i} = B${j} = ${A[i - 1]}: 1 + LCS(${i - 1},${j - 1}) = ${T[i][j]}` }]); }
          else { const up = T[i - 1][j] >= T[i][j - 1]; T[i][j] = Math.max(T[i - 1][j], T[i][j - 1]); from[i][j] = up ? [i - 1, j] : [i, j - 1]; order.push([i, j, { deps: [[i - 1, j], [i, j - 1]], expl: `${A[i - 1]} ≠ ${B[j - 1]}: max(${T[i - 1][j]}, ${T[i][j - 1]}) = ${T[i][j]}` }]); }
        }
        const trace = []; let p = [m, n]; let s = '';
        while (p && p[0] && p[1]) { trace.push(p); const f = from[p[0]][p[1]]; if (f[0] === p[0] - 1 && f[1] === p[1] - 1) s = A[p[0] - 1] + s; p = f; }
        return { rowLabels: ['ε', ...A], colLabels: ['ε', ...B], cells: T, order, trace, answer: `LCS length = ${T[m][n]}, e.g. "${s}"` };
      },
    },
    lis: {
      name: 'Longest increasing subsequence',
      inputs: [{ key: 'A', label: 'Array A', def: '3 1 4 1 5 9 2 6 5 3 5' }],
      spec: String.raw`$\mathit{LISfirst}(i)$ = length of the longest increasing subsequence of $A[i..n]$ that **starts with** $A[i]$.

$$\mathit{LISfirst}(i) = 1 + \max\{\mathit{LISfirst}(j) : j>i,\ A[j]>A[i]\}\quad(\max\emptyset = 0)$$

Evaluate $i$ from $n$ down to $1$; answer $= \max_i \mathit{LISfirst}(i)$. Time $O(n^2)$.`,
      build({ A }) {
        A = parseList(A).slice(0, 16); const n = A.length;
        const T = cellsOf(1, n), nxt = Array(n).fill(null), order = [];
        for (let i = n - 1; i >= 0; i--) {
          let best = 0, bj = null; const deps = [];
          for (let j = i + 1; j < n; j++) if (A[j] > A[i]) { deps.push([0, j]); if (T[0][j] > best) { best = T[0][j]; bj = j; } }
          T[0][i] = 1 + best; nxt[i] = bj;
          order.push([0, i, { deps, expl: deps.length ? `1 + max over later larger elements (${deps.map(([, j]) => A[j]).join(', ')}) = ${T[0][i]}` : `No later element exceeds ${A[i]} → 1` }]);
        }
        let start = 0; for (let i = 0; i < n; i++) if (T[0][i] > T[0][start]) start = i;
        const trace = []; const seq = []; let p = n ? start : null; while (p !== null) { trace.push([0, p]); seq.push(A[p]); p = nxt[p]; }
        return { rowLabels: ['LISfirst'], colLabels: A.map((x, i) => `${i + 1}: ${x}`), cells: T, order, trace, answer: n ? `LIS length = ${T[0][start]}: ${seq.join(', ')}` : 'Empty array' };
      },
    },
    subset: {
      name: 'Subset sum',
      inputs: [{ key: 'X', label: 'Set X', def: '3 34 4 12 5 2' }, { key: 'T', label: 'Target T', def: '9' }],
      spec: String.raw`$\mathit{SS}(i,t)$ = TRUE iff some subset of $X[i..n]$ sums to exactly $t$.

$$\mathit{SS}(i,t)=\begin{cases}\text{TRUE} & t=0\\ \text{FALSE} & t<0 \text{ or } i>n\\ \mathit{SS}(i+1,t)\ \lor\ \mathit{SS}(i+1,t-X[i]) & \text{otherwise}\end{cases}$$

Rows $i = n+1$ down to $1$. Time $O(nT)$ — **pseudo-polynomial**.`,
      build({ X, T: tgt }) {
        X = parseList(X).slice(0, 10); const n = X.length; const T = Math.max(0, Math.min(30, parseInt(tgt, 10) || 0));
        const C = cellsOf(n + 1, T + 1), order = [];
        for (let i = n; i >= 0; i--) for (let t = 0; t <= T; t++) {
          if (t === 0) { C[i][t] = true; order.push([i, t, { deps: [], expl: 't = 0: empty subset works' }]); continue; }
          if (i === n) { C[i][t] = false; order.push([i, t, { deps: [], expl: 'No items left and t > 0' }]); continue; }
          const skip = C[i + 1][t], take = t - X[i] >= 0 ? C[i + 1][t - X[i]] : false;
          C[i][t] = skip || take;
          const deps = [[i + 1, t]]; if (t - X[i] >= 0) deps.push([i + 1, t - X[i]]);
          order.push([i, t, { deps, expl: `skip ${X[i]}: ${skip ? 'T' : 'F'}; take ${X[i]}: ${t - X[i] < 0 ? 'too big' : take ? 'T' : 'F'} → ${C[i][t] ? 'T' : 'F'}` }]);
        }
        const trace = []; const pick = [];
        if (C[0][T]) { let t = T; for (let i = 0; i < n; i++) { trace.push([i, t]); if (!C[i + 1][t]) { pick.push(X[i]); t -= X[i]; } } trace.push([n, t]); }
        const disp = C.map((r) => r.map((v) => (v ? 'T' : 'F')));
        return { rowLabels: [...X.map((x, i) => `${i + 1}: ${x}`), 'n+1'], colLabels: [...Array(T + 1).keys()].map(String), cells: disp, order, trace, answer: C[0][T] ? `Yes: {${pick.join(', ')}} sums to ${T}` : `No subset sums to ${T}` };
      },
    },
    knap: {
      name: '0/1 Knapsack',
      inputs: [{ key: 'W', label: 'Weights', def: '1 3 4 5' }, { key: 'V', label: 'Values', def: '1 4 5 7' }, { key: 'C', label: 'Capacity', def: '7' }],
      spec: String.raw`$K(i,w)$ = max value obtainable from items $i..n$ with capacity $w$.

$$K(i,w)=\begin{cases}0 & i>n\\ K(i+1,w) & w_i > w\\ \max\{K(i+1,w),\ v_i+K(i+1,w-w_i)\} & \text{otherwise}\end{cases}$$

Time $O(nW)$ — pseudo-polynomial (polynomial in the *value* of $W$, exponential in its bit-length).`,
      build({ W, V, C: cap }) {
        W = parseList(W).slice(0, 10); V = parseList(V).slice(0, W.length); const n = Math.min(W.length, V.length); const C = Math.max(0, Math.min(30, parseInt(cap, 10) || 0));
        const K = cellsOf(n + 1, C + 1), order = [];
        for (let i = n; i >= 0; i--) for (let w = 0; w <= C; w++) {
          if (i === n) { K[i][w] = 0; order.push([i, w, { deps: [], expl: 'No items left → 0' }]); continue; }
          const skip = K[i + 1][w];
          if (W[i] > w) { K[i][w] = skip; order.push([i, w, { deps: [[i + 1, w]], expl: `item ${i + 1} (w=${W[i]}) doesn't fit → ${skip}` }]); continue; }
          const take = V[i] + K[i + 1][w - W[i]]; K[i][w] = Math.max(skip, take);
          order.push([i, w, { deps: [[i + 1, w], [i + 1, w - W[i]]], expl: `max(skip ${skip}, take ${V[i]}+${K[i + 1][w - W[i]]}=${take}) = ${K[i][w]}` }]);
        }
        const trace = []; const pick = []; let w = C;
        for (let i = 0; i < n; i++) { trace.push([i, w]); if (K[i][w] !== K[i + 1][w]) { pick.push(i + 1); w -= W[i]; } }
        trace.push([n, w]);
        return { rowLabels: [...W.slice(0, n).map((x, i) => `${i + 1}: w${x} v${V[i]}`), 'n+1'], colLabels: [...Array(C + 1).keys()].map(String), cells: K, order, trace, answer: `Best value = ${K[0][C]} using items {${pick.join(', ')}}` };
      },
    },
    lps: {
      name: 'Longest palindromic subsequence',
      inputs: [{ key: 'A', label: 'String', def: 'CHARACTER' }],
      spec: String.raw`$\mathit{LPS}(i,j)$ = length of the longest palindromic subsequence of $A[i..j]$.

$$\mathit{LPS}(i,j)=\begin{cases}0 & i>j\\ 1 & i=j\\ 2+\mathit{LPS}(i+1,j-1) & A_i=A_j\\ \max\{\mathit{LPS}(i+1,j),\mathit{LPS}(i,j-1)\} & \text{otherwise}\end{cases}$$

Interval DP: fill by increasing length $j-i$. Time $O(n^2)$.`,
      build({ A }) {
        A = [...String(A).slice(0, 14)]; const n = A.length; const T = cellsOf(n, n), from = cellsOf(n, n), order = [];
        const g = (i, j) => (i > j ? 0 : T[i][j]);
        for (let len = 1; len <= n; len++) for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          if (i === j) { T[i][j] = 1; order.push([i, j, { deps: [], expl: 'single character → 1' }]); continue; }
          if (A[i] === A[j]) { T[i][j] = 2 + g(i + 1, j - 1); from[i][j] = [i + 1, j - 1, 'both']; order.push([i, j, { deps: i + 1 <= j - 1 ? [[i + 1, j - 1]] : [], expl: `${A[i]} = ${A[j]}: 2 + LPS(${i + 2},${j}) = ${T[i][j]}` }]); }
          else { const a = g(i + 1, j), b = g(i, j - 1); T[i][j] = Math.max(a, b); from[i][j] = a >= b ? [i + 1, j] : [i, j - 1]; order.push([i, j, { deps: [[i + 1, j], [i, j - 1]], expl: `${A[i]} ≠ ${A[j]}: max(${a}, ${b}) = ${T[i][j]}` }]); }
        }
        const trace = []; let p = n ? [0, n - 1] : null;
        while (p && p[0] <= p[1]) { trace.push([p[0], p[1]]); if (p[0] === p[1]) break; p = from[p[0]][p[1]]; }
        return { rowLabels: A.map((c, i) => `${i + 1}:${c}`), colLabels: A.map((c, i) => `${i + 1}:${c}`), cells: T, order, trace, answer: n ? `LPS length = ${T[0][n - 1]}` : 'Empty string' };
      },
    },
    chain: {
      name: 'Matrix-chain multiplication',
      inputs: [{ key: 'D', label: 'Dimensions d₀…dₙ', def: '30 35 15 5 10 20 25' }],
      spec: String.raw`Matrix $M_i$ is $d_{i-1}\times d_i$. $\mathit{Cost}(i,j)$ = min scalar multiplications to compute $M_i\cdots M_j$.

$$\mathit{Cost}(i,j)=\begin{cases}0 & i=j\\ \min_{i\le k<j}\{\mathit{Cost}(i,k)+\mathit{Cost}(k+1,j)+d_{i-1}d_kd_j\} & i<j\end{cases}$$

Interval DP by increasing $j-i$. Time $O(n^3)$.`,
      build({ D }) {
        D = parseList(D).slice(0, 11); const n = Math.max(0, D.length - 1);
        const T = cellsOf(n, n), split = cellsOf(n, n), order = [];
        for (let len = 1; len <= n; len++) for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          if (i === j) { T[i][j] = 0; order.push([i, j, { deps: [], expl: 'single matrix → 0' }]); continue; }
          let best = Infinity, bk = -1; const deps = [];
          for (let k = i; k < j; k++) { deps.push([i, k], [k + 1, j]); const c = T[i][k] + T[k + 1][j] + D[i] * D[k + 1] * D[j + 1]; if (c < best) { best = c; bk = k; } }
          T[i][j] = best; split[i][j] = bk;
          order.push([i, j, { deps, expl: `best split after M${bk + 1}: ${T[i][bk]} + ${T[bk + 1][j]} + ${D[i]}·${D[bk + 1]}·${D[j + 1]} = ${best}` }]);
        }
        const paren = (i, j) => (i === j ? `M${i + 1}` : `(${paren(i, split[i][j])}${paren(split[i][j] + 1, j)})`);
        const trace = []; const walk = (i, j) => { trace.push([i, j]); if (i < j) { walk(i, split[i][j]); walk(split[i][j] + 1, j); } };
        if (n) walk(0, n - 1);
        return { rowLabels: [...Array(n).keys()].map((i) => 'M' + (i + 1)), colLabels: [...Array(n).keys()].map((i) => 'M' + (i + 1)), cells: T, order, trace, answer: n ? `Min cost = ${T[0][n - 1]}: ${paren(0, n - 1)}` : 'Need at least 2 dimensions' };
      },
    },
  };
  const API = { PROBLEMS };
  root.DPViz = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
