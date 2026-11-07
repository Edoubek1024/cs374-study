CS374.topic({
  id: 'divide',
  unit: 'algorithms',
  order: 11,
  title: 'Divide and Conquer',
  summary: 'Split a problem into smaller pieces, solve them recursively, and combine: mergesort, quicksort, linear-time selection, Karatsuba, fast exponentiation, binary search, inversions and closest pair.',
  objectives: [
    'Prove correctness of and analyze mergesort and quicksort (worst case and randomized)',
    'Explain linear-time selection (median of medians) and why groups of 5 work but groups of 3 do not',
    'Derive Karatsuba multiplication and fast exponentiation and their running times',
    'Use binary search with a clear invariant, including on answers and on non-obvious monotone structure',
    'Design new divide-and-conquer algorithms (e.g. counting inversions) and analyze them with recurrences',
  ],
  lesson: String.raw`## The divide-and-conquer paradigm

A divide-and-conquer algorithm has three steps:

1. **Divide** the input into smaller instances of the same problem (usually a constant number of pieces, each a constant fraction of the size).
2. **Recurse** on the pieces — the Recursion Fairy solves them.
3. **Combine** the recursive answers into an answer for the whole input.

Its running time is a recurrence like $T(n) = aT(n/b) + (\text{divide} + \text{combine time})$, which you solve with a recursion tree or the Master theorem. A variant called **prune and search** (binary search, selection) recurses on only *one* piece after throwing a constant fraction of the input away: $T(n) = T(\alpha n) + O(f(n))$.

> **Key idea.** The cleverness in a D&C algorithm is almost always in the **combine** step (merging, counting crossing pairs, the "strip" in closest pair) or in a **guarantee that the pieces are small** (median of medians). Spend your design effort there.

## Mergesort

~~~pseudo
MergeSort(A[1..n]):
    if n > 1:
        m = floor(n/2)
        MergeSort(A[1..m])
        MergeSort(A[m+1..n])
        Merge(A[1..n], m)

Merge(A[1..n], m):          // A[1..m] and A[m+1..n] are each sorted
    i = 1; j = m+1
    for k = 1 to n:
        if j > n:                        B[k] = A[i]; i++
        else if i > m:                   B[k] = A[j]; j++
        else if A[i] <= A[j]:            B[k] = A[i]; i++
        else:                            B[k] = A[j]; j++
    copy B[1..n] into A[1..n]
~~~

**Correctness of Merge.** Invariant: at the start of iteration k, B[1..k−1] holds the k−1 smallest elements of the two halves in sorted order, and A[i] and A[j] are the smallest not-yet-copied elements of their halves. The smaller of A[i], A[j] is therefore the smallest remaining element overall, so copying it maintains the invariant. **Correctness of MergeSort** is then strong induction: the Recursion Fairy sorts both halves, and Merge combines two sorted arrays into one.

**Analysis.** Merge takes $\Theta(n)$ time, so
$$T(n) = T(\lceil n/2\rceil) + T(\lfloor n/2\rfloor) + \Theta(n) = \Theta(n\log n).$$
Every level of the recursion tree does $\Theta(n)$ work and there are $\lceil \lg n\rceil$ levels. Mergesort is **stable** (on ties Merge takes from the left half, i.e. it compares with ≤, which keeps equal elements in their original order) and uses $\Theta(n)$ extra space for B.

Splitting into three pieces doesn't help asymptotically: $T(n) = 3T(n/3) + \Theta(n)$ is still $\Theta(n\log n)$. In fact no comparison-based sort can beat $\Omega(n\log n)$ comparisons in the worst case: a decision tree with $n!$ leaves has depth $\ge \lg(n!) = \Omega(n\log n)$.

## Quicksort

~~~pseudo
QuickSort(A[1..n]):
    if n > 1:
        choose a pivot element A[p]
        r = Partition(A, p)            // rearranges A so A[1..r-1] < pivot = A[r] <= A[r+1..n]
        QuickSort(A[1..r-1])
        QuickSort(A[r+1..n])
~~~

Partition runs in $\Theta(n)$ time by a single left-to-right scan. If the pivot has rank r, then $T(n) = T(r-1) + T(n-r) + \Theta(n)$.

| Pivot quality | Recurrence | Time |
|---|---|---|
| always the smallest/largest (e.g. first element on sorted input) | $T(n-1) + \Theta(n)$ | $\Theta(n^2)$ |
| always the median (found by linear-time selection) | $2T(n/2) + \Theta(n)$ | $\Theta(n\log n)$ worst case |
| always within the middle 80% | $T(n/10) + T(9n/10) + \Theta(n)$ | $\Theta(n\log n)$ |
| uniformly random | — | $\Theta(n\log n)$ **expected**, for every input |

**Why random pivots work (sketch).** Let $z_1 < \dots < z_n$ be the sorted elements. $z_i$ and $z_j$ are compared iff one of them is the first pivot chosen among $z_i, \dots, z_j$ (once a pivot strictly between them is chosen, they go to different sides forever). That happens with probability $2/(j-i+1)$. By linearity of expectation,
$$\mathbb{E}[\#\text{comparisons}] = \sum_{i<j}\frac{2}{j-i+1} \le 2n H_n = O(n\log n).$$

> **Warning.** "Expected $O(n\log n)$" is over the algorithm's random choices, for **every** input. It is not an average over inputs. The worst case of randomized quicksort is still $\Theta(n^2)$ (with tiny probability).

## Selection: the k-th smallest element

**Quickselect** partitions around a pivot and recurses into only the side containing rank k:

~~~pseudo
QuickSelect(A[1..n], k):        // return the k-th smallest element, 1 <= k <= n
    if n = 1: return A[1]
    choose pivot; r = Partition(A, pivot)
    if k < r:  return QuickSelect(A[1..r-1], k)
    if k > r:  return QuickSelect(A[r+1..n], k - r)
    return A[r]
~~~

With a random pivot the expected time is $O(n)$ (with probability at least 1/2 the pivot lies in the middle half, shrinking the problem to $\le 3n/4$); the worst case is $T(n) = T(n-1) + \Theta(n) = \Theta(n^2)$.

~~~steps Why randomized quickselect runs in expected O(n) time
**Setup.** Suppose the current array has m elements and the pivot has rank r. The recursive call (if any) is on r − 1 or m − r elements. Call the pivot **good** if both of those are at most $3m/4$, i.e. $m/4 \le r \le 3m/4 + 1$. That is a closed interval of length $m/2 + 1$, so it contains at least $m/2$ integers: a uniformly random pivot is good with probability **at least 1/2**.
+++
**Phases.** Say the algorithm is in *phase j* while the current size is in the range $\big((3/4)^{j+1} n,\ (3/4)^j n\big]$. A good pivot shrinks the array by a factor $3/4$, so it always ends the current phase. Each call chooses a fresh random pivot, so the number of calls spent in phase j is at most the number of coin flips until the first success of a coin with success probability $\ge 1/2$: its expectation is **at most 2**.
+++
**Cost per phase.** Every call in phase j works on at most $(3/4)^j n$ elements, and partitioning costs at most $c$ per element. So the expected work in phase j is at most $2c(3/4)^j n$.
+++
**Add up (linearity of expectation).**
$$\mathbb{E}[T(n)] \le \sum_{j \ge 0} 2c\left(\tfrac34\right)^j n = 2cn \cdot \frac{1}{1 - 3/4} = 8cn = O(n).$$
The phases form a decreasing geometric series — exactly the "root dominates" case of a recursion tree, but in expectation.
+++
**What this does *not* say.** It says nothing about the worst case: an adversarial sequence of coin flips (always the minimum) still gives $\Theta(n^2)$. If an exam asks for a *worst-case* linear bound, you need median of medians.
~~~

### Median of medians: worst-case linear selection

Blum, Floyd, Pratt, Rivest and Tarjan (1973) choose a pivot that is *guaranteed* to be good:

~~~pseudo
MomSelect(A[1..n], k):
    if n <= 25: sort A by brute force and return A[k]
    m = ceil(n/5)
    for i = 1 to m:
        M[i] = median of the group A[5i-4 .. 5i]     // O(1) per group
    mom = MomSelect(M[1..m], floor(m/2))            // recursive call #1: median of the medians
    r = Partition(A[1..n], mom)
    if k < r:  return MomSelect(A[1..r-1], k)       // recursive call #2
    if k > r:  return MomSelect(A[r+1..n], k - r)
    return mom
~~~

**Why the pivot is good.** About half of the $n/5$ group medians are $\le$ mom, and each of those groups contains 3 elements $\le$ its median, hence $\le$ mom. So at least about $3 \cdot \frac{1}{2}\cdot\frac{n}{5} = \frac{3n}{10}$ elements are $\le$ mom; symmetrically at least about $3n/10$ are $\ge$ mom. Therefore the second recursive call has size at most about $7n/10$. Picture the groups as columns of 5 sorted vertically, with columns ordered by their medians: the upper-left quadrant is all $\le$ mom, the lower-right all $\ge$ mom.

$$T(n) \le T(n/5) + T(7n/10) + O(n) = O(n),$$
because $1/5 + 7/10 = 9/10 < 1$: the recursion-tree level sums decrease geometrically.

> **Key idea.** Why groups of **5**? With groups of size g, the two recursive calls have sizes $n/g$ and roughly $n - \frac{g+1}{2}\cdot\frac{n}{2g}$. For $g = 3$: sizes $n/3$ and $2n/3$, which sum to n, giving $\Theta(n\log n)$ — *no better than sorting*. For $g = 5$: $n/5 + 7n/10 = 9n/10 < n$, linear. For $g = 7$: $n/7 + 5n/7 = 6n/7 < n$, also linear (with a different constant). 5 is the smallest odd group size that works.

~~~steps Median of medians, rigorously (floors and all)
**Counting medians.** Let $m = \lceil n/5\rceil$ be the number of groups (the last group may have fewer than 5 elements). Assume the elements are distinct. The pivot mom has rank $\lfloor m/2\rfloor$ among the m medians, so at least $\lfloor m/2\rfloor$ medians are $\le$ mom and at least $\lceil m/2\rceil$ are $\ge$ mom.
+++
**Counting elements.** Every *full* group whose median is $\le$ mom contributes 3 elements $\le$ mom (its two smallest and its median). At most one group (the partial one) might not be full, so
$$\#\{x \le \text{mom}\} \ \ge\ 3\left(\lfloor m/2\rfloor - 1\right) \ \ge\ 3\left(\frac{n/5 - 1}{2} - 1\right) = \frac{3n}{10} - \frac92.$$
The same count with $\lceil m/2\rceil$ gives $\#\{x \ge \text{mom}\} \ge 3n/10 - 3$.
+++
**Size of the second call.** The second recursive call is on the elements strictly less than mom or strictly greater than mom. Each of those sets is the complement of one of the sets counted above, so it has at most $n - (3n/10 - 9/2) \le 7n/10 + 5$ elements.
+++
**Recurrence.** Finding the group medians and partitioning cost at most $an$ for some constant a, so for every n above the pseudocode's threshold of 25,
$$T(n) \le T(\lceil n/5\rceil) + T(7n/10 + 5) + an.$$
For any constant $n_0$ we like, there are only finitely many sizes $n \le n_0$, so $T(n) \le b$ for those n, for some constant b.
+++
**Induction.** Claim $T(n) \le cn$. For $n > n_0$, using $\lceil n/5\rceil \le n/5 + 1$:
$$T(n) \le c\left(\frac n5 + 1\right) + c\left(\frac{7n}{10} + 5\right) + an = \frac{9cn}{10} + 6c + an.$$
This is $\le cn$ exactly when $c(n - 60) \ge 10an$. If $n_0 = 120$, then $n - 60 \ge n/2$ for all $n > n_0$, so $c \ge 20a$ suffices. Taking $c = \max(20a, b)$ covers the base case too. Hence $T(n) = O(n)$. ∎
+++
**The moral.** The additive "+5" and the ceilings only change the constants and the base-case threshold. What really matters is $\frac15 + \frac7{10} < 1$: the subproblem sizes add up to a constant fraction less than n, so the recursion tree's level sums shrink geometrically.
~~~

## Karatsuba multiplication

The grade-school algorithm multiplies two n-digit numbers in $\Theta(n^2)$ time. Split each number in half, $x = 10^m a + b$ and $y = 10^m c + d$ with $m = n/2$:
$$xy = 10^{2m}ac + 10^m(ad + bc) + bd.$$
Four half-size products give $T(n) = 4T(n/2) + O(n) = \Theta(n^2)$ — no gain. **Karatsuba's trick** computes the middle term from only one extra product:
$$ad + bc = ac + bd - (a-b)(c-d).$$
Three recursive multiplications ($ac$, $bd$, $(a-b)(c-d)$) plus O(n) additions and shifts:
$$T(n) = 3T(n/2) + O(n) = \Theta(n^{\lg 3}) \approx \Theta(n^{1.585}).$$

**Example.** $1234 \times 5678$: $a = 12, b = 34, c = 56, d = 78$. $ac = 672$, $bd = 2652$, $(a-b)(c-d) = (-22)(-22) = 484$, so $ad + bc = 672 + 2652 - 484 = 2840$. Result: $672\cdot 10^4 + 2840\cdot 10^2 + 2652 = 7{,}006{,}652$. ✓

Generalizations: splitting into 3 pieces with 5 products (Toom–3) gives $5T(n/3) + O(n) = \Theta(n^{\log_3 5}) \approx n^{1.465}$. The same idea for matrices is Strassen: $7T(n/2) + O(n^2) = \Theta(n^{\lg 7}) \approx n^{2.807}$.

### Polynomial multiplication

Multiplying two polynomials of degree less than n given by coefficient arrays is the same problem without carries. Write $P(x) = P_0(x) + x^{m} P_1(x)$ and $Q(x) = Q_0(x) + x^{m} Q_1(x)$ with $m = \lceil n/2\rceil$, where $P_0, P_1, Q_0, Q_1$ have degree less than about n/2. Then
$$PQ = P_0Q_0 + x^{m}\big(P_0Q_1 + P_1Q_0\big) + x^{2m} P_1Q_1,$$
and the middle term is $(P_0 + P_1)(Q_0 + Q_1) - P_0Q_0 - P_1Q_1$. So three half-size products plus O(n) coefficient additions: $T(n) = 3T(n/2) + O(n) = \Theta(n^{\lg 3})$, versus $\Theta(n^2)$ for the schoolbook method. (The fast Fourier transform does even better, $O(n\log n)$, by evaluating at roots of unity — beyond this course's core material.)

> **Example.** $P = 1 + 2x + 3x^2 + 4x^3$, $Q = 5 + 6x + 7x^2 + 8x^3$, m = 2. $P_0Q_0 = (1+2x)(5+6x) = 5 + 16x + 12x^2$; $P_1Q_1 = (3+4x)(7+8x) = 21 + 52x + 32x^2$; $(P_0+P_1)(Q_0+Q_1) = (4+6x)(12+14x) = 48 + 128x + 84x^2$. Middle $= 48 + 128x + 84x^2 - P_0Q_0 - P_1Q_1 = 22 + 60x + 40x^2$. Assemble: $PQ = 5 + 16x + 34x^2 + 60x^3 + 61x^4 + 52x^5 + 32x^6$.

Try this one before reading the answer: **squaring** an n-digit number is a special case of multiplication. Can you square with fewer than 3 recursive *squarings*?

~~~reveal Answer: squaring with three half-size squarings
With $x = 10^m a + b$: $x^2 = 10^{2m}a^2 + 10^m\cdot 2ab + b^2$, and $2ab = (a+b)^2 - a^2 - b^2$. So three half-size **squarings** ($a^2$, $b^2$, $(a+b)^2$) plus O(n) work: $S(n) = 3S(n/2) + O(n) = \Theta(n^{\lg 3})$ — the same as Karatsuba, no better. Two squarings would give $2S(n/2) + O(n) = O(n\log n)$, but no such identity is known. (In fact squaring and multiplication have the same complexity up to constants, since $xy = ((x+y)^2 - (x-y)^2)/4$.)
~~~

## Fast exponentiation

To compute $a^n$, the naive loop uses $n - 1$ multiplications. Instead:

~~~pseudo
Power(a, n):
    if n = 0: return 1
    x = Power(a, floor(n/2))
    if n is even: return x * x
    else:         return x * x * a
~~~

$T(n) = T(n/2) + O(1) = O(\log n)$ multiplications. This works in any setting with an associative multiplication: integers mod m (modular exponentiation, RSA), matrices (compute Fibonacci numbers via $\begin{pmatrix}1&1\\1&0\end{pmatrix}^n$ in $O(\log n)$ matrix products), etc.

> **Warning.** For exact big-integer powers the *numbers* grow to about $n\lg a$ bits, so each multiplication is not O(1). "$O(\log n)$" counts multiplications; in modular arithmetic with word-size moduli it is also the running time.

## Binary search and its variants

Binary search is prune-and-search with $T(n) = T(n/2) + O(1) = O(\log n)$. Off-by-one bugs disappear if you write down an **invariant**.

~~~pseudo
LowerBound(A[0..n-1], x):    // A sorted; return the smallest i with A[i] >= x (n if none)
    lo = 0; hi = n            // invariant: A[j] < x for all j < lo, and A[j] >= x for all j >= hi
    while lo < hi:
        mid = floor((lo + hi) / 2)
        if A[mid] < x: lo = mid + 1
        else:          hi = mid
    return lo
~~~

Binary search works whenever you have a **monotone predicate** — something false, false, ..., false, true, ..., true — not only on sorted arrays:

- **Fixed point:** in a sorted array of distinct integers, $A[i] - i$ is nondecreasing, so search for $A[i] = i$.
- **Local minimum:** in an array of distinct numbers with $A[0] = A[n+1] = \infty$, if $A[mid-1] < A[mid]$ there is a local minimum to the left, else to the right (or mid itself is one).
- **Searching the answer:** "what is the smallest capacity C for which the packages can be shipped in d days?" — feasibility is monotone in C, so binary search C.
- **Unimodal / rotated arrays:** compare A[mid] with a neighbor or an endpoint to decide which half to keep.

## Counting inversions

An **inversion** in A[1..n] is a pair $i < j$ with $A[i] > A[j]$. Brute force checks all $\binom n2$ pairs in $\Theta(n^2)$ time. Divide and conquer: inversions are either inside the left half, inside the right half, or **crossing** (i in the left, j in the right). Recursively *sort and count* each half; then while merging, each time an element of the right half is copied, it is smaller than **all remaining** elements of the left half — each of those is a crossing inversion.

~~~pseudo
SortCount(A[1..n]):           // sorts A and returns its number of inversions
    if n <= 1: return 0
    m = floor(n/2)
    c = SortCount(A[1..m]) + SortCount(A[m+1..n])
    merge as in mergesort, and whenever B[k] = A[j] is taken from the right half
        (because A[j] < A[i]):  c = c + (m - i + 1)     // remaining left elements
    return c
~~~

$T(n) = 2T(n/2) + O(n) = O(n\log n)$. (On ties take the left element first, i.e. compare with ≤, so equal elements are not counted as inversions.)

## Closest pair of points (brief)

Given n points in the plane, find the two closest. Sort by x once. Split at the median x-coordinate; recursively find the closest pair distance $\delta_L, \delta_R$ in each half; let $\delta = \min(\delta_L, \delta_R)$. A closer crossing pair must lie in the vertical strip of width $2\delta$ around the dividing line. Sort the strip points by y; a packing argument shows each point needs to be compared only with the next **7** points in y-order. The combine step is O(n) if the y-sorted lists are maintained by merging, so $T(n) = 2T(n/2) + O(n) = O(n\log n)$ (or $O(n\log^2 n)$ if you re-sort the strip at every level).

~~~steps The closest-pair combine step, carefully
**What we know.** Let ℓ be the vertical dividing line, $\delta = \min(\delta_L, \delta_R)$. Any two points on the same side are at distance $\ge \delta$. We only care about a crossing pair (p, q) with $d(p, q) < \delta$; both must have horizontal distance $< \delta$ from ℓ, so both are in the **strip** S of width $2\delta$ centered on ℓ.
+++
**Sort the strip by y.** Let $s_1, s_2, \dots, s_k$ be the strip points in increasing y-order. If $d(s_i, s_j) < \delta$ with $i < j$, then $y(s_j) - y(s_i) < \delta$.
+++
**Packing.** Fix $s_i$ and consider the rectangle of width $2\delta$ (the strip) and height $\delta$ whose bottom edge is at height $y(s_i)$. Cut it into 8 squares of side $\delta/2$, four on each side of ℓ. Two points in the same little square are on the same side and at distance at most $\frac{\delta}{2}\sqrt2 < \delta$ — impossible. So each square holds at most one point, and the rectangle holds at most 8 points, $s_i$ included.
+++
**Conclusion.** Every $s_j$ with $j > i$ and $y(s_j) - y(s_i) < \delta$ lies in that rectangle, so there are at most 7 of them: they are among $s_{i+1}, \dots, s_{i+7}$. Comparing each strip point with the next 7 finds every crossing pair closer than δ, in $O(k) = O(n)$ time.
+++
**Keeping it linear.** If the recursion returns its points sorted by y (merge the two y-sorted lists, exactly as in mergesort), extracting the strip in y-order costs O(n). Total: $T(n) = 2T(n/2) + O(n) = O(n\log n)$ after one initial sort by x. Re-sorting the strip from scratch at every call gives $2T(n/2) + O(n\log n) = O(n\log^2 n)$ — still correct, just slower.
~~~

## Designing and analyzing your own D&C algorithm

1. **Find the split.** Halves by index? By value (median)? By a pivot?
2. **Ask what the recursive answers don't tell you** — usually the "crossing" part (pairs/subarrays spanning both halves). Can you compute it in O(n) (or $O(n\log n)$)? Sometimes you must **strengthen the recursion** to return extra information (e.g. also return the sorted array, or the best prefix and suffix sums).
3. **Write the recurrence** and solve it: $2T(n/2) + O(n)$ gives $O(n\log n)$; $2T(n/2) + O(1)$ gives $O(n)$; $T(n/2) + O(1)$ gives $O(\log n)$; $2T(n/2) + O(n\log n)$ gives $O(n\log^2 n)$.
4. **Prove correctness** by strong induction: base case, then "assuming the recursive calls are correct, the combine step is correct".

| Algorithm | Recurrence | Time |
|---|---|---|
| Binary search | $T(n/2) + O(1)$ | $O(\log n)$ |
| Mergesort, inversions, closest pair | $2T(n/2) + O(n)$ | $O(n\log n)$ |
| Quickselect (random) | expected $T(3n/4) + O(n)$ | expected $O(n)$ |
| Median of medians | $T(n/5) + T(7n/10) + O(n)$ | $O(n)$ |
| Karatsuba | $3T(n/2) + O(n)$ | $O(n^{\lg 3})$ |
| Strassen | $7T(n/2) + O(n^2)$ | $O(n^{\lg 7})$ |
| Fast exponentiation | $T(n/2) + O(1)$ | $O(\log n)$ mults |

> **Exam tip.** When asked to "describe and analyze" a D&C algorithm, give (1) the algorithm in pseudocode or precise English, (2) a short correctness argument focused on the combine step, (3) the recurrence, and (4) its solution. A correct $O(n\log n)$ algorithm earns more than an incorrect "O(n)" one.

## Proofs you should be able to write

### Mergesort is correct (strong induction on n)

**Claim.** For every $n \ge 0$, MergeSort(A[1..n]) rearranges A into sorted order.

*Base case.* If $n \le 1$ the algorithm does nothing, and an array with at most one element is already sorted.

*Inductive hypothesis.* Assume MergeSort correctly sorts every array with fewer than n elements, for some $n \ge 2$.

*Inductive step.* With $m = \lfloor n/2\rfloor$ we have $1 \le m < n$ and $1 \le n - m < n$, so both recursive calls are on strictly smaller arrays. By the hypothesis, after them A[1..m] and A[m+1..n] are each sorted. By the Merge invariant (above), Merge then writes the elements of A in sorted order, and since it only copies elements it produces a *permutation* of the input. ∎

Notice the two ingredients every D&C correctness proof needs: (1) the recursive calls are on **strictly smaller** valid instances (so the hypothesis applies, and the recursion terminates), and (2) a separate argument that the **combine** step is correct whenever its inputs are correct.

### Quicksort is correct

Same template: after Partition, every element of A[1..r−1] is less than the pivot, the pivot is at position r, and every element of A[r+1..n] is at least the pivot. Both sides have fewer than n elements (the pivot is excluded), so by induction they get sorted; a sorted left part, then the pivot, then a sorted right part is sorted. The proof does not depend on how the pivot is chosen — only the *running time* does.

### Expected comparisons of randomized quicksort

Let $z_1 < \dots < z_n$ be the elements in sorted order and $X_{ij}$ the indicator that $z_i$ and $z_j$ are ever compared. Elements are compared only with a pivot, and two elements are separated forever as soon as a pivot strictly between them is chosen. Consider the set $Z_{ij} = \{z_i, \dots, z_j\}$: until some element of $Z_{ij}$ becomes a pivot, all of $Z_{ij}$ stays in the same subarray. The first pivot chosen from $Z_{ij}$ is uniformly distributed over its $j - i + 1$ elements, and $z_i, z_j$ are compared iff that first pivot is $z_i$ or $z_j$. So $\Pr[X_{ij} = 1] = 2/(j-i+1)$ and
$$\mathbb{E}\Big[\sum_{i<j} X_{ij}\Big] = \sum_{i<j}\frac{2}{j-i+1} = \sum_{d=1}^{n-1}(n-d)\frac{2}{d+1} \le 2n\sum_{k=2}^{n}\frac1k < 2nH_n = O(n\log n).$$

### Comparison sorting needs $\Omega(n\log n)$ comparisons

A comparison sort on inputs of size n is a binary decision tree: each internal node compares two elements, each leaf outputs a permutation. Distinct input orders must reach distinct leaves, so there are at least $n!$ leaves, and a binary tree with $n!$ leaves has depth at least $\lg(n!)$. Since $n! \ge (n/2)^{n/2}$, $\lg(n!) \ge \frac n2\lg\frac n2 = \Omega(n\log n)$. So mergesort is optimal among comparison sorts.

## Worked examples: try it first

Each problem below is exam style. Cover the answer, spend a few minutes, then open it.

**Example 1 (binary search on structure).** A sorted array A[0..2n] has every value appearing exactly twice, except one value that appears once. Find the single value in $O(\log n)$ time.

~~~reveal Solution to Example 1
Look at pairs of positions (2k, 2k+1). **Before** the single element, every pair holds a matching couple: $A[2k] = A[2k+1]$. **From** the single element on, everything is shifted by one, so $A[2k] \ne A[2k+1]$. The predicate "$A[2k] \ne A[2k+1]$" (with $A[2n+1]$ treated as different from everything) is false, false, ..., false, true, ..., true over $k = 0, 1, \dots, n$, and the single element is at position $2k^*$ where $k^*$ is the first true k. Binary search for $k^*$: $T(n) = T(n/2) + O(1) = O(\log n)$.

*Correctness:* if the single element is at position 2s, then for $k < s$ the pair (2k, 2k+1) is a couple, while for $k \ge s$ position 2k holds the single element (k = s) or the second copy of a couple that starts at the odd position 2k − 1, so $A[2k] \ne A[2k+1]$.
~~~

**Example 2 (write and solve the recurrence).** What is the running time of this algorithm?

~~~pseudo
Weird(A[1..n]):
    if n <= 1: return
    Weird(A[1 .. n/2])
    Weird(A[n/2+1 .. n])
    Weird(A[n/4+1 .. 3n/4])
    for i = 1 to n: do O(1) work
~~~

~~~reveal Solution to Example 2
Three recursive calls, each on n/2 elements, plus $\Theta(n)$ work: $T(n) = 3T(n/2) + \Theta(n)$. Level i of the recursion tree has $3^i$ nodes of cost $n/2^i$, so the level sum is $(3/2)^i n$ — increasing. The leaves dominate: $3^{\lg n} = n^{\lg 3}$, so $T(n) = \Theta(n^{\lg 3}) \approx \Theta(n^{1.585})$. The *overlap* of the calls is irrelevant to the recurrence: you count calls and sizes, not which elements they touch.
~~~

**Example 3 (strengthen the recursion).** Given prices A[1..n], find the maximum of $A[j] - A[i]$ over all $i < j$ (best buy-low/sell-high profit) with a divide-and-conquer algorithm in O(n) time.

~~~reveal Solution to Example 3
The best pair (i, j) is inside the left half, inside the right half, or crossing ($i \le m < j$). The best crossing pair is simply $\max(\text{right half}) - \min(\text{left half})$. Have each call return a triple **(min, max, best)**:

- base case (one element x): (x, x, $-\infty$)
- combine L and R: min = min(L.min, R.min), max = max(L.max, R.max), best = max(L.best, R.best, R.max − L.min)

The combine is O(1), so $T(n) = 2T(n/2) + O(1) = O(n)$. Without the strengthening (recomputing the min and max by scanning), the combine is O(n) and the time is $O(n\log n)$. Correctness is induction on n: the three cases are exhaustive, and the triple returned for the whole array is right if the triples for the halves are.
~~~

**Example 4 (rotation point).** A sorted array of n distinct numbers has been rotated by an unknown amount (e.g. [15, 22, 31, 2, 5, 9]). Find the position of the minimum in $O(\log n)$ time.

~~~reveal Solution to Example 4
Compare with the **last** element $A[n]$. Every element of the "upper" run (before the rotation point) is larger than $A[n]$, and every element of the "lower" run (from the minimum to the end) is at most $A[n]$. So the predicate "$A[i] \le A[n]$" is false, ..., false, true, ..., true, and the minimum is the first index where it is true. Binary search with invariant "$A[j] > A[n]$ for $j < lo$, $A[j] \le A[n]$ for $j \ge hi$" (lo = 1, hi = n initially; $A[n] \le A[n]$ so hi = n is valid). $O(\log n)$.

(Comparing with $A[1]$ instead also works but needs a special case for an unrotated array; comparing with the last element avoids it.)
~~~

**Example 5 (Master theorem on a grid algorithm).** An algorithm on an $n \times n$ matrix splits it into four $n/2 \times n/2$ quadrants, recurses on **three** of them, and spends $O(n^2)$ time combining. What is its running time? What if it recursed on all four? On five subproblems of that size?

~~~reveal Solution to Example 5
Measure size by the side length n. $T(n) = 3T(n/2) + \Theta(n^2)$: level sums $3^i (n/2^i)^2 = (3/4)^i n^2$ decrease, so the root dominates: $\Theta(n^2)$ — linear in the size of the input matrix, which is optimal. With four quadrants, $4T(n/2) + \Theta(n^2)$ has equal level sums: $\Theta(n^2\log n)$. With five, $(5/4)^i n^2$ increases: $\Theta(n^{\lg 5}) \approx n^{2.32}$. The trap is to measure the input size as $N = n^2$ inconsistently; if you use N, the first recurrence becomes $3T(N/4) + \Theta(N) = \Theta(N)$, the same answer.
~~~

**Example 6 (counting crossing pairs).** Count the pairs $i < j$ with $A[i] > A[j] + 5$, in $O(n\log n)$ time. (Contrast: counting pairs with $A[i] + A[j] > 0$ needs no D&C at all, because that condition is symmetric in i and j, so you may simply sort the whole array and use two pointers. Here the condition is not symmetric, so the order i < j matters.)

~~~reveal Solution to Example 6
Sort-and-count. Recursively sort each half and count its own pairs. The crossing pairs (i in the left half, j in the right half) do not depend on the order *within* each half, so count them on the sorted halves with two pointers: for left elements L[p] in increasing order, the right elements with $R[q] < L[p] - 5$ form a prefix of R that only grows, so advance a pointer q and add its prefix length for each p. Then merge normally. The combine is O(n): $T(n) = 2T(n/2) + O(n) = O(n\log n)$.

Why sorting alone fails: the condition depends on the *positions* (i < j), not only on the values, so we cannot forget the original order — sorting the halves only scrambles positions *within* a half, which is harmless for crossing pairs.
~~~

## More designs worth knowing

### Local minimum in a grid in O(n)

An $n \times n$ grid of distinct numbers, surrounded by a border of $+\infty$. A cell is a local minimum if it is smaller than its (up to) four neighbors. Probing all $n^2$ cells is too slow; binary search on rows gives $O(n\log n)$; a "window" divide and conquer gets **O(n)**.

Keep a square region R (with its boundary) and a cell g inside R whose value is **smaller than every cell on R's boundary**. Then the minimum of R is not on the boundary, so all its neighbors are in R, and it is a local minimum of the whole grid — the region always contains an answer. Each round: scan the middle row and middle column of R, and let c be the smallest cell among those and g. If c is smaller than its four neighbors, return it. Otherwise move to a smaller neighbor x of c; x is not on the middle cross (c was the smallest there) and not on R's boundary (it is smaller than g), so it lies inside one of the four quadrants. Recurse on that quadrant with g = x: its boundary consists of parts of R's boundary and the cross, all larger than x. Each round costs O(side length) and halves the side: $T(n) = T(n/2) + O(n) = O(n)$.

### The skyline problem

Given n rectangular buildings (left, right, height) on a common ground line, output the outline as a list of (x, height) key points. Divide the buildings into two halves, recursively compute the two skylines, and **merge** them like mergesort: sweep the key points of both in x-order, remember the current height of each skyline, and emit (x, max of the two heights) whenever that maximum changes. The merge is linear in the sizes of the two skylines (each has at most twice as many points as buildings), so $T(n) = 2T(n/2) + O(n) = O(n\log n)$.

## Common exam problem patterns

| Pattern | Recipe | Typical time |
|---|---|---|
| **Count pairs $i<j$ with a property** (inversions, $A[i] > 2A[j]$, $A[i] - A[j] > j - i$) | Sort-and-count: recursion returns the sorted array *and* the count; count crossing pairs on the sorted halves with a monotone two-pointer scan; merge. Transform first if the property mixes values and indices ($A[i] + i > A[j] + j$). | $O(n\log n)$ |
| **Best contiguous piece** (max subarray, max profit) | Three cases: left, right, crossing. Crossing = best suffix of left + best prefix of right. Strengthen the recursion (return totals/prefix/suffix/min/max) for O(1) combine. | $O(n)$ or $O(n\log n)$ |
| **Find an element with a local property** (local min, peak, fixed point, rotation point, single element) | Binary search with an explicit invariant that guarantees an answer exists in the current range; show each probe lets you discard half while keeping the invariant. | $O(\log n)$ |
| **k-th / median / top-k** | Use linear-time selection as a black box; partition around the result; prune. For two sorted arrays, compare elements at rank about k/2 and discard. | $O(n)$ or $O(\log k)$ |
| **Majority / frequent element with only equality tests** | A majority of the whole is a majority of some half; return candidates; verify by counting. | $O(n\log n)$ |
| **Faster arithmetic** (integers, polynomials, matrices) | Split in halves; find an algebraic identity that reduces the number of products; recurrence is leaves-dominated, $\Theta(n^{\log_b a})$. | $n^{\lg 3}$, $n^{\lg 7}$, ... |
| **Geometric / merge-like** (closest pair, skyline) | Split by median x; recurse; combine with a linear sweep over both results (keep y-sorted lists by merging). | $O(n\log n)$ |
| **Analyze this code** | Count recursive calls and their sizes, then the non-recursive work *including hidden costs* (slicing, sorting, copying); write the recurrence; recursion tree. | — |

For every one of these, the write-up has the same skeleton: **algorithm, correctness (induction + combine argument), recurrence, solution.**

## Where students lose points

- **Forgetting the crossing case.** "Recurse on both halves and take the better answer" is wrong for max subarray, closest pair, inversions... The answer may straddle the split.
- **A combine step that is secretly slower.** Re-sorting inside every call, computing a min by scanning when you claimed O(1), or comparing all pairs in the strip. Write the combine cost explicitly in the recurrence.
- **Hidden copying.** A binary search that passes A[mid+1..n] by *copying* costs $T(n) = T(n/2) + \Theta(n) = \Theta(n)$. Pass index ranges.
- **"Fractions summing to 1 is still linear."** $T(n/3) + T(2n/3) + O(n)$ is $\Theta(n\log n)$. Linear time needs the subproblem sizes to sum to at most $(1-\varepsilon)n$.
- **Misusing the Master theorem.** It needs a constant number a of subproblems of the *same* size n/b. It does not cover $T(n-1) + n$, $T(n/5) + T(7n/10) + n$, or $2T(n/2) + n/\lg n$.
- **Binary search off-by-one.** Updates like lo = mid can loop forever; without a stated invariant, graders cannot tell whether your boundary cases are right. State the invariant and check that the range strictly shrinks.
- **Expected vs. worst case.** Randomized quickselect is expected O(n) and worst case $\Theta(n^2)$. Don't claim worst-case linear time without median of medians.
- **Unverified candidates.** In majority-style algorithms, a majority of a half need not be a majority of the whole; you must count.
- **Ignoring duplicates.** Fixed-point binary search needs distinct integers; a two-way partition never shrinks an array of equal elements; "equal elements are not inversions" needs ≤ in the merge.
- **A correctness "proof" that restates the algorithm.** The grader wants the induction hypothesis, why the recursive calls are on smaller instances, and why the combine step produces the right answer from correct sub-answers.

## Self-check

1. Why is $T(n) = T(n/3) + T(2n/3) + \Theta(n)$ not linear, while $T(n/5) + T(7n/10) + \Theta(n)$ is?

~~~reveal Answer 1
In the first, a node's children cost exactly as much as the node ($1/3 + 2/3 = 1$), so every full level sums to $\Theta(n)$ and there are $\Theta(\log n)$ levels: $\Theta(n\log n)$. In the second, children cost $9/10$ of their parent, so level sums decrease geometrically and the total is at most $10\times$ the root: $\Theta(n)$.
~~~

2. A recursive binary search passes the half it keeps as a *new copied array*. What is its running time?

~~~reveal Answer 2
$T(n) = T(n/2) + \Theta(n)$ (the copy), which is $\Theta(n)$ — no better than a linear scan. Passing indices restores $T(n/2) + O(1) = O(\log n)$.
~~~

3. In sort-and-count, why is it safe to count the crossing inversions *after* sorting the two halves?

~~~reveal Answer 3
Every left element precedes every right element no matter how each half is ordered internally, so the set of crossing pairs (left value, right value) with left > right is the same before and after sorting the halves. Sorting is what makes the count computable in linear time by merging.
~~~

4. Median of medians with groups of 5, but you find the median of the $n/5$ medians by **sorting** them. Recurrence and running time?

~~~reveal Answer 4
$T(n) = T(7n/10) + O(n\log n)$ (the sort of n/5 medians costs $O(n\log n)$). Level sums $(7/10)^i\, n\log n$ (roughly) decrease, so $T(n) = \Theta(n\log n)$ — worse than linear, and no better than just sorting the input.
~~~

5. Why must the majority algorithm count the candidates returned by the halves?

~~~reveal Answer 5
The lemma only says a majority of the whole is a majority of *some* half. The converse fails: in [1, 1, 2, 3], 1 is the majority of the left half [1, 1] but occurs only 2 times out of 4, which is not more than half. Counting each of the at most two candidates in O(n) decides correctly.
~~~

6. If Karatsuba's combine step took $\Theta(n^2)$ time instead of $\Theta(n)$, what would its running time be?

~~~reveal Answer 6
$T(n) = 3T(n/2) + \Theta(n^2)$: level sums $(3/4)^i n^2$ decrease, so $T(n) = \Theta(n^2)$ — the gain from three products would be wasted. Fast algorithms need both few subproblems **and** a cheap combine.
~~~

7. What invariant makes the O(log n) local-minimum search in a 1-D array correct?

~~~reveal Answer 7
The current range [lo, hi] satisfies $A[lo-1] > A[lo]$ and $A[hi] < A[hi+1]$. Then the minimum of A[lo..hi] is a local minimum of A, so an answer always exists in the range, and each probe of A[mid] either finds a local minimum or lets you keep a half that still satisfies the invariant.
~~~

## Midterm 2 exam patterns

On Midterm 2, divide and conquer usually appears as a full-page **"describe and analyze an algorithm"** problem, often with a target such as "in $O(n\log n)$ time" or "in $O(\log n)$ time", and sometimes as an **"analyze this algorithm"** part. The algorithm, its justification and its analysis are graded separately. A correct algorithm that is slower than the target usually earns partial credit; a fast but incorrect one earns little.

### The common shapes

| Shape | Signal in the prompt | Approach |
|---|---|---|
| Count or optimize over pairs or subarrays | "count the pairs $i < j$ such that ...", "number of subarrays with ...", $O(n\log n)$ target | Sort-and-count with a two-pointer crossing count. First transform to prefix sums, or to $B[i] = A[i] \pm i$, so the condition compares one quantity at i with one at j. |
| Search in structured data | sorted, rotated, bitonic or unimodal arrays; "$O(\log n)$"; unknown length | Binary search with a stated invariant; galloping when the length is unknown. |
| Selection | "k-th", "median", "weighted median", "closest to", "worst-case O(n)" | Linear-time selection as a black box, then partition and recurse into one side: $T(n) = T(n/2) + O(n) = O(n)$. |
| Analyze a given algorithm | pseudocode, or "what if groups of 7 were used?" | Count the executed calls and their sizes, add the hidden costs, then solve. |
| Faster arithmetic | "fewer multiplications", matrices, polynomials | An algebraic identity that saves products; the leaves dominate, so compare $\log_b a$. |
| Geometric / merge-like | points, buildings, maxima, skyline | Split by median x; combine with a linear sweep over both results. |

### The write-up graders look for

1. **The idea in one sentence**, for example "split by position; the answer lies in the left half, the right half, or crosses the middle".
2. **Pseudocode**, with the base case and with subarrays passed as index ranges rather than copies.
3. **Correctness** by strong induction on n. Say why the recursive calls are on smaller valid inputs, and why the combine (or crossing) step is correct *assuming* correct recursive answers. State the invariant or lemma it relies on.
4. **The recurrence**, including every cost inside the combine step (sorting, copying, scanning).
5. **Its solution**, and the final running time in terms of the original input.

You may cite these as black boxes without re-deriving them: sorting in $O(n\log n)$; linear-time selection (median of medians); Partition in O(n); merging two sorted lists in O(n); binary search; Karatsuba; the Master theorem.

### Mistakes that lose points

- **Missing the crossing case**, or trusting a candidate from one half without verifying it (majority).
- **Claiming worst-case O(n) for quickselect.** For a worst-case bound you need median of medians.
- **Forgetting to shift the rank** (k − r) when selection recurses into the right side.
- **Two-way partition with duplicates.** Equal keys all land on one side, and the recursion degrades to $T(n-1) + \Theta(n)$.
- **Binary-search off-by-one errors.** State the invariant and show that the range strictly shrinks: an update like lo = mid can loop forever.
- **Data-structure assumptions.** Binary search needs random access; on a linked list it costs $T(n) = T(n/2) + \Theta(n) = \Theta(n)$.
- **Lopsided "divide" steps.** Peeling off one element gives $T(n-1) + \dots$, which is not divide and conquer in the useful sense.
- **"Proof by example."** Tracing one input is not a correctness argument; the inductive argument about the combine step is.
- **Sorting inside every call** without accounting for it: $2T(n/2) + O(n\log n) = \Theta(n\log^2 n)$.

**Try it first (A).** A sorted array $A[1], A[2], \dots$ has *unknown* length, and reading any position past the end returns $+\infty$. Given x, find the smallest index p with $A[p] \ge x$ (x is present exactly when $A[p] = x$) using $O(\log p)$ probes. Why is this better than first finding the length n and then binary searching?

~~~~reveal Solution (A): galloping (exponential) search
~~~pseudo
Gallop(A, x):
    hi = 1
    while A[hi] < x: hi = 2 * hi        // positions past the end read +infinity, so this stops
    lo = floor(hi / 2) + 1
    while lo < hi:                       // invariant: A[j] < x for j < lo, and A[hi] >= x
        mid = floor((lo + hi) / 2)
        if A[mid] < x: lo = mid + 1
        else:          hi = mid
    return lo
~~~
**Correctness.** The doubling loop must stop, because past the end the array reads $+\infty$. It stops at the first power of two $hi = 2^k$ with $A[2^k] \ge x$. If $k \ge 1$, the previous probe found $A[2^{k-1}] < x$, so by sortedness $A[j] < x$ for every $j \le 2^{k-1} = lo - 1$. If k = 0, then lo = 1 and there is nothing to check. So the invariant holds when the binary search starts. Each iteration keeps it (as in LowerBound) and shrinks hi − lo, so the loop ends with lo = hi = p.

**Probes.** Since $A[2^{k-1}] < x$, we have $p > 2^{k-1}$, so $k \le \lceil\lg p\rceil$: the doubling phase makes at most $\lceil\lg p\rceil + 1$ probes. The binary search runs over fewer than $2^{k-1} < p$ positions, which costs $O(\log p)$ more. The total is $O(\log p)$.

**Why it beats "find n first".** Finding the length itself takes $\Theta(\log n)$ probes, which can be far more than $\log p$ when x is near the front (p = 5 in an array of a billion entries). Galloping is also the standard tool when there is no length at all, for example when binary searching for the smallest feasible answer without a known upper bound.
~~~~

**Try it first (B).** You are given k sorted lists that contain n elements in total. (i) What is the worst-case time of merging them one at a time into a growing result? (ii) Design a divide-and-conquer algorithm that runs in $O(n\log k)$ time, and analyze it carefully. The recursion is over the number of lists, but the work depends on their lengths.

~~~~reveal Solution (B): merging k sorted lists
~~~steps Analysis, one step at a time
**(i) One list at a time.** Suppose every list has n/k elements. The i-th merge combines a result of size $(i-1)n/k$ with one new list, so it costs $\Theta(i\,n/k)$. In total, $\sum_{i=1}^{k}\Theta(i\,n/k) = \Theta(nk)$. With k = n singleton lists this is insertion sort, $\Theta(n^2)$.
+++
**(ii) The algorithm.** MergeAll(lists 1..k): if k = 1, return that list. Otherwise, recursively merge lists $1..\lfloor k/2\rfloor$, recursively merge the remaining lists, and combine the two results with the standard linear-time Merge. *Correctness*, by induction on k: each recursive call returns the sorted union of its lists, and merging two sorted lists produces their sorted union.
+++
**Why a recurrence in k alone is sloppy.** "$T(k) = 2T(k/2) + O(n)$" is not right as written, because the subproblems do not each contain n elements. The honest statement is that a call costs time linear in the *total length of its lists*, plus O(1).
+++
**The recursion tree over the lists.** Each list belongs to exactly one call on every level of the tree. So on each level the merges cost O(n) in total, plus O(1) per call, which is O(k) over the whole tree. There are $\lceil\lg k\rceil$ levels, so the total is $O(n\log k + k)$. That is $O(n\log k)$ when every list is nonempty and $k \ge 2$.
+++
**Sanity checks.** With k = n singleton lists, the algorithm is exactly mergesort, $O(n\log n)$. ✓ With k = 2 it is a single merge, O(n). ✓ A min-heap holding the current head of each list achieves the same $O(n\log k)$. Counting the possible interleavings shows that no comparison-based method can do better.
~~~
~~~~
`,
  cheatsheet: String.raw`## Template
Divide → recurse (Recursion Fairy) → combine. Prune-and-search recurses on one part only.

## Core algorithms
| Algorithm | Recurrence | Time |
|---|---|---|
| Mergesort | $2T(n/2)+O(n)$ | $\Theta(n\log n)$, stable, $\Theta(n)$ extra space |
| Quicksort | $T(r-1)+T(n-r)+O(n)$ | worst $\Theta(n^2)$; random pivot $O(n\log n)$ expected |
| Quickselect | random pivot | expected $O(n)$, worst $\Theta(n^2)$ |
| Median of medians | $T(n/5)+T(7n/10)+O(n)$ | $O(n)$ worst case |
| Karatsuba | $3T(n/2)+O(n)$ | $O(n^{\lg 3})\approx n^{1.585}$ |
| Strassen | $7T(n/2)+O(n^2)$ | $O(n^{\lg 7})\approx n^{2.807}$ |
| Fast power | $T(n/2)+O(1)$ | $O(\log n)$ multiplications |
| Binary search | $T(n/2)+O(1)$ | $O(\log n)$ |
| Inversions | $2T(n/2)+O(n)$ | $O(n\log n)$ |
| Closest pair | $2T(n/2)+O(n)$ | $O(n\log n)$ |

## Key facts
- MoM: groups of 5; mom is $\ge$ and $\le$ at least $\approx 3n/10$ elements each. Groups of 3 give $T(n/3)+T(2n/3)+O(n)=\Theta(n\log n)$; groups of 7 also linear.
- Karatsuba: $ad+bc = ac+bd-(a-b)(c-d)$.
- Power: $a^n = (a^{\lfloor n/2\rfloor})^2 \cdot a^{n \bmod 2}$.
- Random quicksort: $z_i,z_j$ compared w.p. $2/(j-i+1)$; $\mathbb E \le 2nH_n$.
- Inversions: when taking from the right half, add the number of remaining left elements.
- Comparison sorting needs $\Omega(n\log n)$ comparisons ($\lg n!$).

## Binary search invariants
- LowerBound: $A[j]<x$ for $j<lo$; $A[j]\ge x$ for $j\ge hi$; loop while $lo<hi$.
- Works on any monotone predicate (fixed point $A[i]-i$, local min, searching the answer).

## Writing it up
Algorithm → correctness of combine step (induction) → recurrence → solution.

## Recurrences you will meet
| Shape | Example | Solution |
|---|---|---|
| $T(n/2)+O(1)$ | binary search, fast power | $\Theta(\log n)$ |
| $T(n/2)+O(n)$ | prune-and-search with linear work, 2-D local min (side n) | $\Theta(n)$ |
| $2T(n/2)+O(1)$ | max subarray with (total, pre, suf, best) | $\Theta(n)$ |
| $2T(n/2)+O(n)$ | mergesort, inversions, skyline, closest pair | $\Theta(n\log n)$ |
| $2T(n/2)+O(n\log n)$ | closest pair re-sorting the strip | $\Theta(n\log^2 n)$ |
| $3T(n/2)+O(n)$ | Karatsuba (integers, polynomials) | $\Theta(n^{\lg 3})$ |
| $4T(n/2)+O(n)$ | naive 4-product split | $\Theta(n^2)$ |
| $3T(n/2)+O(n^2)$ | 3 quadrants of an $n\times n$ grid | $\Theta(n^2)$ |
| $7T(n/2)+O(n^2)$ | Strassen | $\Theta(n^{\lg 7})$ |
| $T(n/5)+T(7n/10)+O(n)$ | median of medians | $\Theta(n)$ |
| $T(n/3)+T(2n/3)+O(n)$ | groups of 3 / 1:2 pivot | $\Theta(n\log n)$ |
| $T(n-1)+O(n)$ | quicksort/quickselect worst case | $\Theta(n^2)$ |
| $T(n-\sqrt n)+T(\sqrt n)+O(n)$ | pivot of rank $\sqrt n$ | $\Theta(n^{3/2})$ |

## Templates
- **Sort-and-count:** return (sorted, count); count crossing pairs on sorted halves with a pointer that only moves forward; then merge. $O(n\log n)$.
- **Strengthen the recursion:** return extra summaries (total, best prefix, best suffix, min, max) so the combine is O(1).
- **Three cases:** answer is in the left half, right half, or crosses the middle — always handle the crossing case.
- **Binary search on structure:** state an invariant that guarantees an answer in [lo, hi]; each probe discards half and keeps the invariant.
- **Select, then prune:** linear-time selection as a black box (median, k-th, top-k, k closest to the median).
- **Two sorted arrays, rank k:** compare $A[\min(m,k/2)]$ and $B[\min(n,k/2)]$; discard the smaller prefix; $O(\log k)$.
- **Majority (equality only):** candidates from halves, verify by counting: $O(n\log n)$.
- **Fewer products:** $ad+bc = (a+b)(c+d) - ac - bd$ (or with $a-b$, $c-d$).

## Proof checklist
1. Recursive calls are on **strictly smaller** valid instances.
2. Base case correct.
3. Combine step correct *assuming* correct sub-answers (state the invariant).
4. Count the combine's true cost (copying, sorting) in the recurrence.

## Quick facts
- Randomized quickselect: good pivot (both sides $\le 3m/4$) w.p. $\ge 1/2$; expected $\le 8cn$.
- MoM exact: $\ge 3n/10 - 9/2$ elements on each side of mom; second call $\le 7n/10 + 5$.
- Closest pair packing: $2\delta \times \delta$ box = 8 squares of side $\delta/2$, at most one point each $\Rightarrow$ next 7.
- 2-D local min: track a cell smaller than the whole boundary; scan the middle cross; recurse into one quadrant.

### Exam checklist
- **Write-up:** one-sentence idea, then pseudocode with a base case (pass index ranges), then correctness (strong induction, calls are smaller, combine step correct), then a recurrence with *every* combine cost, then its solution.
- **Crossing case:** can the answer straddle the split? If so, compute the crossing part; if that is too slow, strengthen what the recursion returns.
- **Counting pairs:** first transform the condition into "something at i versus something at j" (prefix sums, $A[i]\pm i$), then sort-and-count with a forward-only pointer.
- **Binary search:** state the invariant, show the range shrinks, and say what happens with duplicates. Unknown length: gallop $1,2,4,\dots$, then $O(\log p)$.
- **Selection:** a worst-case O(n) bound needs median of medians (quickselect is only *expected* O(n)). Prune and search: $T(n)=T(n/2)+O(n)=O(n)$. Shift the rank (k − r) when you recurse to the right.
- **Comparing splits:** a products of size $n/b$ costs $n^{\log_b a}$. To beat Strassen with $n/3$ blocks you need $a \le 21$.
- **Is an algorithm wrong?** Try $n = 2, 3, 4$ for a counterexample: [1, 1] for max subarray without the crossing case; [1, 2, 2, 2] for unverified majority.
- **Hidden costs:** copying, re-sorting inside calls, linked lists (no random access), and two-way partitions on duplicates.
`,
  quiz: [
    {
      type: 'mc',
      q: 'What is the worst-case running time of mergesort on n elements?',
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n\log^2 n)$`],
      answer: 1,
      explain: String.raw`$T(n) = 2T(n/2) + \Theta(n)$: every level of the recursion tree merges a total of n elements, and there are $\lceil\lg n\rceil$ levels. Unlike quicksort, mergesort's split is always balanced regardless of the input, so the worst case equals the best case up to constants.`,
    },
    {
      type: 'mc',
      q: 'Quicksort always picks the first element as the pivot. What is its running time on an already-sorted array?',
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(2^n)$`],
      answer: 2,
      explain: String.raw`On sorted input the first element is the minimum, so the partition is maximally unbalanced: sizes 0 and n−1. $T(n) = T(n-1) + \Theta(n) = \Theta(n^2)$. Random pivots or median pivots fix this.`,
    },
    {
      type: 'tf',
      q: 'Randomized quicksort (pivot chosen uniformly at random) runs in O(n log n) expected time on every input.',
      answer: true,
      explain: String.raw`The expectation is over the algorithm's coin flips, so it holds for every fixed input, including sorted ones. Expected comparisons $= \sum_{i<j} 2/(j-i+1) \le 2nH_n$. The worst case (over unlucky coin flips) is still $\Theta(n^2)$.`,
    },
    {
      type: 'mc',
      q: 'If median-of-medians selection used groups of 3 instead of 5, what would its recurrence and running time be?',
      choices: [String.raw`$T(n/3) + T(2n/3) + O(n) = O(n)$`, String.raw`$T(n/3) + T(2n/3) + O(n) = \Theta(n\log n)$`, String.raw`$T(n/3) + T(n/2) + O(n) = O(n)$`, String.raw`$2T(n/3) + O(n) = O(n)$`],
      answer: 1,
      explain: String.raw`With groups of 3, the median of medians is only guaranteed to beat about $2\cdot\frac12\cdot\frac n3 = n/3$ elements, so the second recursive call can have size $2n/3$. Since $1/3 + 2/3 = 1$, every level sums to n and the total is $\Theta(n\log n)$ — the guarantee is lost.`,
    },
    {
      type: 'mc',
      q: 'In median-of-medians with groups of 5, the pivot is guaranteed to be larger than at least roughly what fraction of the input?',
      choices: ['1/5', '3/10', '1/2', '7/10'],
      answer: 1,
      explain: String.raw`Half of the $n/5$ groups have median $\le$ mom, and each such group has 3 elements $\le$ its median: $3\cdot\frac12\cdot\frac n5 = \frac{3n}{10}$. Symmetrically for larger. So the recursive call is on at most about $7n/10$ elements.`,
    },
    {
      type: 'mc',
      q: 'Karatsuba multiplies two n-digit numbers by making how many recursive multiplications of n/2-digit numbers, and what is its running time?',
      choices: [String.raw`4; $\Theta(n^2)$`, String.raw`3; $\Theta(n^{\lg 3})$`, String.raw`3; $\Theta(n\log n)$`, String.raw`2; $\Theta(n\log n)$`],
      answer: 1,
      explain: String.raw`It computes $ac$, $bd$ and $(a-b)(c-d)$, and gets $ad + bc = ac + bd - (a-b)(c-d)$. So $T(n) = 3T(n/2) + O(n)$: leaves dominate, $3^{\lg n} = n^{\lg 3} \approx n^{1.585}$. The naive 4-product split gives $4T(n/2) + O(n) = \Theta(n^2)$, no improvement.`,
    },
    {
      type: 'mc',
      q: String.raw`Fast (repeated-squaring) exponentiation computes $a^n$ using how many multiplications?`,
      choices: [String.raw`$\Theta(1)$`, String.raw`$\Theta(\log n)$`, String.raw`$\Theta(\sqrt n)$`, String.raw`$\Theta(n)$`],
      answer: 1,
      explain: String.raw`$T(n) = T(\lfloor n/2\rfloor) + O(1)$: at most 2 multiplications per halving, so at most $2\lfloor\lg n\rfloor + O(1)$ multiplications.`,
    },
    {
      type: 'tf',
      q: 'Given an array of n distinct numbers (not sorted), with A[0] = A[n+1] = +∞ as sentinels, a local minimum can be found in O(log n) time.',
      answer: true,
      explain: String.raw`Maintain a range [lo, hi] such that $A[lo-1] > A[lo]$ and $A[hi] < A[hi+1]$; the minimum of A[lo..hi] is then a local minimum, so one exists. Look at mid: if $A[mid-1] < A[mid]$ keep [lo, mid−1]; else if $A[mid+1] < A[mid]$ keep [mid+1, hi]; else mid is a local minimum. Binary search does not need sorted input, just a rule that discards half while preserving "an answer exists here".`,
    },
    {
      type: 'multi',
      q: 'Which statements about mergesort (on arrays) are true? (select all that apply)',
      choices: ['It is stable when Merge prefers the left element on ties', String.raw`Its worst-case time is $\Theta(n\log n)$`, 'It sorts in place with O(1) extra space', String.raw`It makes at most $n\lceil\lg n\rceil$ comparisons`],
      answer: [0, 1, 3],
      explain: String.raw`Mergesort is stable when Merge breaks ties in favor of the left half (compares with ≤), and makes at most $n\lceil\lg n\rceil$ comparisons (each merge of k elements uses at most k−1). The standard array version needs a $\Theta(n)$ auxiliary buffer, so it is not in place.`,
    },
    {
      type: 'short',
      q: 'What is the maximum possible number of inversions in an array of 6 elements? (Give a number.)',
      answer: ['15'],
      explain: String.raw`Every pair $i < j$ is an inversion when the array is strictly decreasing: $\binom62 = 15$. This is why brute force is $\Theta(n^2)$ and why a counting algorithm can't afford to enumerate inversions one at a time; sort-and-count adds them up in batches during merges.`,
    },
    {
      type: 'tf',
      q: 'Quickselect with a uniformly random pivot has worst-case running time Θ(n²).',
      answer: true,
      explain: String.raw`If every pivot is the smallest remaining element (unlucky but possible), $T(n) = T(n-1) + \Theta(n) = \Theta(n^2)$. Its *expected* time is O(n). Median of medians gives O(n) in the worst case.`,
    },
    {
      type: 'mc',
      q: 'A divide-and-conquer algorithm splits an instance of size n into 4 subproblems of size n/2 and combines in O(n) time. Its running time is:',
      choices: [String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n^2\log n)$`, String.raw`$\Theta(n^4)$`],
      answer: 1,
      explain: String.raw`$T(n) = 4T(n/2) + O(n)$: level sums $4^i\cdot n/2^i = 2^i n$ increase, so leaves dominate: $4^{\lg n} = n^2$.`,
    },
    {
      type: 'tf',
      q: 'Quicksort that always uses linear-time selection (median of medians) to pick the exact median as its pivot runs in Θ(n log n) time in the worst case.',
      answer: true,
      explain: String.raw`Selection takes O(n) and partition O(n), and both halves have size about n/2: $T(n) = 2T(n/2) + O(n) = O(n\log n)$. The constant is large, so in practice random pivots are preferred.`,
    },
    {
      type: 'mc',
      q: 'In the closest-pair algorithm, why is the combine step linear time?',
      choices: [
        'Only points within distance δ of the dividing line are considered, and each needs comparing with only O(1) neighbors in y-order',
        'The strip always contains O(1) points',
        'Only the two closest points in each half need to be compared',
        'The combine step is actually quadratic; the algorithm is O(n²)',
      ],
      answer: 0,
      explain: String.raw`The strip can contain all n points, so we cannot compare all pairs in it. But in y-sorted order, a packing argument (at most a constant number of points with pairwise distance $\ge\delta$ fit in a $2\delta\times\delta$ box) shows each point only needs comparing with the next 7. With y-sorted lists maintained by merging, the combine is O(n) and the total is $O(n\log n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`LowerBound uses the invariant "$A[j] < x$ for $j < lo$ and $A[j] \ge x$ for $j \ge hi$". If $A[mid] \ge x$, which update preserves it?`,
      choices: ['hi = mid', 'hi = mid − 1', 'lo = mid', 'lo = mid + 1'],
      answer: 0,
      explain: String.raw`Since $A[mid] \ge x$ and A is sorted, every $j \ge mid$ has $A[j] \ge x$, so setting hi = mid keeps the invariant. hi = mid − 1 would wrongly claim nothing about index mid and could skip the answer. Because $mid < hi$ whenever $lo < hi$, the range still shrinks and the loop terminates.`,
    },
    {
      type: 'mc',
      q: 'A divide-and-conquer algorithm splits the input into two halves, recurses on both, and then sorts the combined result with mergesort as its combine step. Running time?',
      choices: [String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n\log^2 n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n^2\log n)$`],
      answer: 1,
      explain: String.raw`$T(n) = 2T(n/2) + \Theta(n\log n)$. Level i sums to $2^i\cdot (n/2^i)\lg(n/2^i) = n(\lg n - i)$, and $\sum_{i=0}^{\lg n} n(\lg n - i) = \Theta(n\log^2 n)$. The combine step's extra log factor survives. (This is the "re-sort the strip" version of closest pair.)`,
    },
    {
      type: 'mc',
      q: 'A recursive binary search on a sorted array copies the half it keeps into a new array before recursing. What is its running time?',
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(\log^2 n)$`, String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`],
      answer: 2,
      explain: String.raw`Copying n/2 elements costs $\Theta(n)$, so $T(n) = T(n/2) + \Theta(n)$, whose level sums $n/2^i$ decrease: $\Theta(n)$. That's no better than a linear scan. Pass index ranges (lo, hi) to get $T(n/2) + O(1) = O(\log n)$.`,
    },
    {
      type: 'multi',
      q: String.raw`To which of these recurrences does the standard Master theorem ($T(n) = aT(n/b) + f(n)$ with constants $a \ge 1$, $b > 1$) apply directly? (select all that apply)`,
      choices: [String.raw`$T(n) = 3T(n/2) + n$`, String.raw`$T(n) = T(n/5) + T(7n/10) + n$`, String.raw`$T(n) = T(n-1) + n$`, String.raw`$T(n) = nT(n/2) + 1$`, String.raw`$T(n) = 7T(n/2) + n^2$`],
      answer: [0, 4],
      explain: String.raw`(a) and (e) have the required form (Karatsuba and Strassen). (b) has two *different* subproblem sizes — use a recursion tree ($\Theta(n)$). (c) shrinks by subtraction, not division — unroll ($\Theta(n^2)$). (d) has a non-constant number of subproblems, $a = n$.`,
    },
    {
      type: 'tf',
      q: 'Quickselect whose pivot is always guaranteed to have rank between n/10 and 9n/10 runs in O(n) worst-case time.',
      answer: true,
      explain: String.raw`Quickselect recurses on only one side, of size at most $9n/10$: $T(n) \le T(9n/10) + O(n)$. The level sums $(9/10)^i n$ decrease geometrically, so $T(n) = O(n)$. (For quick*sort* the same guarantee gives $T(n/10) + T(9n/10) + O(n) = \Theta(n\log n)$, because it recurses on both sides.)`,
    },
    {
      type: 'mc',
      q: 'Median of medians with groups of 5, except the median of the n/5 group medians is found by sorting them instead of by a recursive call. Running time?',
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n\log^2 n)$`, String.raw`$\Theta(n^2)$`],
      answer: 1,
      explain: String.raw`Sorting n/5 medians costs $\Theta(n\log n)$, so $T(n) = T(7n/10) + \Theta(n\log n)$; the level sums decrease geometrically and the root dominates: $\Theta(n\log n)$. The point of the first recursive call is that finding the pivot costs only $T(n/5)$.`,
    },
    {
      type: 'tf',
      q: 'In sort-and-count for inversions, sorting the left half and the right half does not change the number of inversions (i, j) with i in the left half and j in the right half.',
      answer: true,
      explain: String.raw`Every left element precedes every right element regardless of the internal order of each half, so the crossing pairs are just (left value, right value) pairs with left > right — a property of the two *sets* of values. That's why we may count them on the sorted halves, in linear time.`,
    },
    {
      type: 'short',
      q: 'Karatsuba recursion all the way down to 1-digit numbers: how many 1-digit multiplications does it make for two 8-digit numbers? (Give a number.)',
      answer: ['27'],
      explain: String.raw`$M(n) = 3M(n/2)$, $M(1) = 1$, so $M(2^k) = 3^k$; for $n = 8 = 2^3$ that is $3^3 = 27$, compared with $8^2 = 64$ for the schoolbook method. In general $3^{\lg n} = n^{\lg 3}$.`,
    },
    {
      type: 'mc',
      q: 'The maximum-subarray D&C returns (total, best prefix, best suffix, best) from each call and combines two such tuples in O(1). Running time?',
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`],
      answer: 1,
      explain: String.raw`$T(n) = 2T(n/2) + O(1)$: level sums $2^i$ increase, so the leaves dominate and $T(n) = \Theta(n)$. Without the strengthening, computing the best crossing subarray by scanning costs $O(n)$ per call and gives $O(n\log n)$.`,
    },
    {
      type: 'mc',
      q: String.raw`An algorithm on an $n\times n$ grid scans the middle row and middle column, then recurses on one $n/2 \times n/2$ quadrant. Running time?`,
      choices: [String.raw`$\Theta(\log n)$`, String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n^2)$`],
      answer: 1,
      explain: String.raw`$T(n) = T(n/2) + \Theta(n)$ (the cross has about 2n cells): decreasing level sums, $\Theta(n)$. This is the 2-D local-minimum algorithm: sublinear in the $n^2$ input size. Searching every row by 1-D binary search instead would cost $\Theta(n\log n)$.`,
    },
    {
      type: 'tf',
      q: String.raw`In a sorted array of integers that may contain duplicates, a fixed point ($A[i] = i$) can still be found in $O(\log n)$ time by binary search on $A[i] - i$.`,
      answer: false,
      explain: String.raw`With duplicates, $A[i] - i$ is no longer monotone (it can decrease by 1 when $A[i+1] = A[i]$), so a probe cannot tell you which half to discard. An adversary argument shows $\Omega(n)$ probes may be needed. Distinctness gives $A[i+1] \ge A[i] + 1$, which makes $A[i] - i$ nondecreasing.`,
    },
    {
      type: 'mc',
      q: 'Quicksort always picks as pivot the element of rank ⌈√n⌉ (found in O(n) time). What is its running time?',
      choices: [String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n\sqrt n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n\log\log n)$`],
      answer: 1,
      explain: String.raw`$T(n) = T(\sqrt n) + T(n - \sqrt n) + \Theta(n)$. Each call peels off only about $\sqrt n$ elements, so it takes about $\sqrt n$ calls to halve the array, each costing $\Theta(n)$: $\Theta(n^{3/2})$. (Carefully, the sum behaves like $\int \sqrt m\,dm = \tfrac23 n^{3/2}$.) A pivot that is a constant *fraction* from the ends is needed for $\Theta(n\log n)$.`,
    },
    {
      type: 'multi',
      q: 'Which statements about the majority-element D&C (equality tests only) are true? (select all that apply)',
      choices: [
        'If x is a majority of A, then x is a majority of at least one half',
        'If x is a majority of the left half, then x is a majority of A',
        'If both halves have the same majority x, then x is a majority of A',
        'Each call must verify its at most two candidates by counting, giving 2T(n/2) + O(n) = O(n log n)',
      ],
      answer: [0, 2, 3],
      explain: String.raw`(a) is the key lemma (otherwise x occurs at most $n/2$ times). (b) is false: [1, 1, 2, 3] has left-half majority 1 but no majority. (c) is true: x occurs more than $m/2 + (n-m)/2 = n/2$ times. (d) describes the algorithm and its recurrence.`,
    },
    {
      type: 'mc',
      q: 'In the closest-pair algorithm, why does each strip point only need to be compared with the next 7 points in y-order?',
      choices: [
        String.raw`A $2\delta \times \delta$ rectangle splits into 8 squares of side $\delta/2$, each holding at most one point, since two points in one square (same side) would be closer than $\delta$`,
        'Because the strip contains at most 8 points',
        String.raw`Because points in the strip are at least $\delta$ apart in y`,
        'Because the recursion only returns 7 points from each side',
      ],
      answer: 0,
      explain: String.raw`Any partner $s_j$ of $s_i$ with distance $< \delta$ has $0 \le y(s_j) - y(s_i) < \delta$, so it lies in the $2\delta\times\delta$ box above $s_i$, which holds at most 8 points including $s_i$. The strip itself can contain all n points, and strip points can be arbitrarily close in y.`,
    },
    {
      type: 'mc',
      q: 'Two sorted arrays of sizes m and n. What is the fastest running time for finding the k-th smallest element of their union by divide and conquer?',
      choices: [String.raw`$O(k)$`, String.raw`$O(\log k)$`, String.raw`$O(\log m \cdot \log n)$`, String.raw`$O(m + n)$`],
      answer: 1,
      explain: String.raw`Compare $A[i]$ and $B[j]$ with $i, j \approx k/2$ (clamped to the array lengths). The smaller one and everything before it in its array have rank less than k, so about k/2 elements are discarded per O(1) step: $O(\log k)$. Merging would cost $O(k)$.`,
    },
    {
      type: 'mc',
      q: String.raw`A new algorithm multiplies $n \times n$ matrices by splitting each into $3 \times 3$ blocks of size $n/3$ and making a recursive block products, plus $O(n^2)$ extra work. What is the largest a for which it is asymptotically faster than Strassen's $\Theta(n^{\lg 7}) \approx n^{2.807}$?`,
      choices: ['20', '21', '22', '26'],
      answer: 1,
      explain: String.raw`$T(n) = aT(n/3) + O(n^2)$. For $a > 9$ the leaves dominate, so $T(n) = \Theta(n^{\log_3 a})$. We need $\log_3 a < \lg 7$, that is, $a < 3^{\lg 7} \approx 21.85$. With $a = 21$, $\log_3 21 \approx 2.771 < 2.807$, which is faster. With $a = 22$, $\log_3 22 \approx 2.814$, which is slower. (The naive block method uses 27 products and gives $n^3$.) When comparing D&C algorithms, compare their exponents $\log_b a$, not their numbers of subproblems.`,
    },
    {
      type: 'tf',
      q: 'Binary search on a sorted linked list of n elements runs in O(log n) time.',
      answer: false,
      explain: String.raw`Binary search needs random access. On a linked list, reaching the middle element costs $\Theta(\text{length})$, so $T(n) = T(n/2) + \Theta(n) = \Theta(n)$: no better than a linear scan. It still uses only $O(\log n)$ *comparisons*, but its running time is linear. This is the same hidden cost as copying the half you keep.`,
    },
    {
      type: 'mc',
      q: 'A "mergesort" sorts both halves recursively, then combines them by running insertion sort on the concatenation of the two sorted halves. What is its worst-case running time?',
      choices: [String.raw`$\Theta(n\log n)$`, String.raw`$\Theta(n\log^2 n)$`, String.raw`$\Theta(n^2)$`, String.raw`$\Theta(n^2\log n)$`],
      answer: 2,
      explain: String.raw`If every element of the right half is smaller than every element of the left half, insertion sort moves each of the n/2 right elements past all n/2 left elements: $\Theta(n^2)$ for the combine. Then $T(n) = 2T(n/2) + \Theta(n^2)$, whose level sums $n^2/2^i$ decrease, so $T(n) = \Theta(n^2)$. The root dominates, and the recursion bought nothing. Divide and conquer is only as fast as its combine step.`,
    },
    {
      type: 'tf',
      q: 'Quicksort that uses the median of the first, middle and last elements as its pivot runs in O(n log n) time in the worst case.',
      answer: false,
      explain: String.raw`Median-of-three only guarantees that the pivot is not the very smallest or largest element. An adversary can arrange the input so that the pivot is always the second smallest, and then $T(n) = T(n-2) + \Theta(n) = \Theta(n^2)$. Guaranteed $O(n\log n)$ needs a pivot guaranteed to have rank between $\alpha n$ and $(1-\alpha)n$ (for example the exact median, found by median of medians), or else randomization, which gives an *expected* bound.`,
    },
    {
      type: 'mc',
      q: 'Packages of weights w_1, ..., w_n (in a fixed order) must be shipped in at most d days. Each day ships a contiguous block, with total weight at most the capacity C. Checking whether a given C is feasible takes O(n) time by a greedy scan. If the total weight is S, how long does binary searching for the smallest feasible integer C take?',
      choices: [String.raw`$O(\log S)$`, String.raw`$O(n\log S)$`, String.raw`$O(n\log n)$`, String.raw`$O(nS)$`],
      answer: 1,
      explain: String.raw`Feasibility is monotone in C: if C works, then any larger capacity works too. So binary search over the integer range $[\max_i w_i, S]$ needs $O(\log S)$ feasibility tests of O(n) each: $O(n\log S)$ in total. $O(\log S)$ forgets the cost of each test. The time depends on $\log S$, which is the number of bits of S, so it is polynomial in the input size.`,
    },
    {
      type: 'multi',
      q: 'For which problems is "recurse on both halves and return the better (or combined) of the two answers, with no extra work" WRONG, because the answer can cross the split? (select all that apply)',
      choices: ['Maximum element of an array', 'Maximum-sum contiguous subarray', 'Number of inversions', 'Closest pair of points (split by x)', 'Minimum and maximum of an array', 'Sum of all elements'],
      answer: [1, 2, 3],
      explain: String.raw`A maximum subarray can straddle the middle (best suffix of the left half plus best prefix of the right half). An inversion can have i on the left and j on the right. The closest pair can have one point on each side of the dividing line, which is why the strip is needed. The max, the min-and-max, and the sum are *decomposable*: the answer for the whole is a simple function of the answers for the halves, with nothing crossing.`,
    },
    {
      type: 'tf',
      q: 'Standard mergesort performs Θ(n log n) comparisons even when its input is already sorted.',
      answer: true,
      explain: String.raw`On sorted input, every merge compares each left element with the first right element until the left half is exhausted: n/2 comparisons for a merge of size n. That gives $C(n) = 2C(n/2) + n/2$, which is $\frac n2\lg n = \Theta(n\log n)$. Mergesort does not adapt to sorted input the way insertion sort does (which takes O(n) on sorted input). Its best case and worst case are within a factor of 2 of each other.`,
    },
    {
      type: 'mc',
      q: String.raw`Quicksort with a uniformly random pivot uses a partition that puts elements $<$ pivot on the left and elements $\ge$ pivot on the right. What is its running time on an array of n *equal* elements?`,
      choices: [String.raw`$\Theta(n)$`, String.raw`$\Theta(n\log n)$ expected`, String.raw`$\Theta(n^2)$, whatever pivots are chosen`, String.raw`$\Theta(n^2)$ only with small probability`],
      answer: 2,
      explain: String.raw`Every element equals the pivot, so all n − 1 of them go to the right side, every time. The recursion is $T(n) = T(n-1) + \Theta(n) = \Theta(n^2)$, and randomness cannot help, because all pivots look the same. The fix is a **three-way partition** (less / equal / greater) that recurses only on the strict sides. Then an all-equal array takes O(n).`,
    },
    {
      type: 'mc',
      q: 'k sorted lists contain n elements in total. Merging them by divide and conquer (recursively merge the first half of the lists, recursively merge the second half, then merge the two results) takes how long?',
      choices: [String.raw`$O(nk)$`, String.raw`$O(n\log k)$`, String.raw`$O(n\log n)$, regardless of k`, String.raw`$O(k\log n)$`],
      answer: 1,
      explain: String.raw`Every element takes part in one linear-time merge on each level of the recursion tree over the lists, so each level costs O(n), and there are $\lceil\lg k\rceil$ levels: $O(n\log k)$. Merging the lists one at a time costs $\Theta(nk)$ in the worst case. With k = n singleton lists, $O(n\log k)$ becomes mergesort's $O(n\log n)$, as it should.`,
    },
    {
      type: 'mc',
      q: 'An algorithm recursively solves both halves of its input, then in the combine step does a binary search in the (sorted) left half for each of the n/2 elements of the right half. What is the recurrence and its solution?',
      choices: [String.raw`$2T(n/2) + O(\log n) = O(n)$`, String.raw`$2T(n/2) + O(n) = O(n\log n)$`, String.raw`$2T(n/2) + O(n\log n) = O(n\log^2 n)$`, String.raw`$T(n/2) + O(n\log n) = O(n\log n)$`],
      answer: 2,
      explain: String.raw`The combine step does n/2 binary searches of $O(\log n)$ each, which is $O(n\log n)$, and both halves are solved recursively. So $T(n) = 2T(n/2) + O(n\log n)$. The level sums are $n\lg(n/2^i) = n(\lg n - i)$, an arithmetic series, giving $O(n\log^2 n)$. Replacing the binary searches with one linear two-pointer scan over the two sorted halves brings the combine to O(n) and the total to $O(n\log n)$.`,
    },
  ],
  flashcards: [
    { front: 'Three steps of divide and conquer', back: 'Divide into smaller instances; recurse (Recursion Fairy); combine. The design work is usually in the combine step or in guaranteeing the pieces are small.' },
    { front: 'Mergesort recurrence and time', back: String.raw`$T(n) = 2T(n/2) + \Theta(n) = \Theta(n\log n)$ worst case; stable; $\Theta(n)$ extra space.` },
    { front: 'Quicksort worst / randomized expected', back: String.raw`Worst $\Theta(n^2)$ (pivot always extreme: $T(n-1) + n$). Random pivot: $O(n\log n)$ expected for every input; $\mathbb{E}[\text{comparisons}] = \sum_{i<j} 2/(j-i+1) \le 2nH_n$.` },
    { front: 'Median-of-medians recurrence', back: String.raw`$T(n) \le T(n/5) + T(7n/10) + O(n) = O(n)$, because $1/5 + 7/10 < 1$.` },
    { front: 'Why groups of 5 (not 3) in median of medians?', back: String.raw`Groups of 3: $T(n/3) + T(2n/3) + O(n) = \Theta(n\log n)$ since fractions sum to 1. Groups of 5: $9/10 < 1$, linear. Groups of 7 also linear.` },
    { front: 'Karatsuba identity and recurrence', back: String.raw`$ad + bc = ac + bd - (a-b)(c-d)$. Three half-size products: $T(n) = 3T(n/2) + O(n) = \Theta(n^{\lg 3}) \approx n^{1.585}$.` },
    { front: 'Fast exponentiation', back: String.raw`$a^n = (a^{\lfloor n/2\rfloor})^2$ times $a$ if n is odd. $O(\log n)$ multiplications. Works for matrices (Fibonacci) and modular arithmetic.` },
    { front: 'Counting inversions in O(n log n)', back: 'Sort-and-count each half recursively; during the merge, whenever the next element comes from the right half, add the number of elements remaining in the left half.' },
    { front: 'Closest pair combine step', back: String.raw`$\delta = \min(\delta_L, \delta_R)$; consider the strip of width $2\delta$; in y-order compare each point with the next 7. O(n) with presorting: $O(n\log n)$ total.` },
    { front: 'Comparison sorting lower bound', back: String.raw`Any comparison sort needs $\lceil\lg(n!)\rceil = \Omega(n\log n)$ comparisons in the worst case (decision tree with $n!$ leaves).` },
    { front: 'Binary search beyond sorted arrays', back: String.raw`Any monotone predicate works: fixed point ($A[i] - i$ nondecreasing for distinct sorted integers), local minimum, smallest feasible answer, peak of a unimodal array.` },
    { front: 'Quickselect', back: String.raw`Partition around a pivot, recurse only into the side containing rank k. Random pivot: expected O(n); worst case $\Theta(n^2)$.` },
    { front: 'Strassen matrix multiplication', back: String.raw`7 products of $n/2 \times n/2$ blocks instead of 8: $T(n) = 7T(n/2) + O(n^2) = \Theta(n^{\lg 7}) \approx n^{2.807}$.` },
    { front: 'Sort-and-count template', back: String.raw`Return (sorted array, count). Count = left count + right count + crossing count, where crossing pairs are counted on the *sorted* halves with a forward-only pointer, then merge. $2T(n/2) + O(n) = O(n\log n)$. Works for inversions, $A[i] > 2A[j]$, $A[i] > A[j] + c$, ...` },
    { front: 'Strengthening the recursion', back: String.raw`Make each call return extra summaries so the combine is cheap. Max subarray: (total, best prefix, best suffix, best) gives O(1) combine and $2T(n/2) + O(1) = O(n)$. Max profit: (min, max, best).` },
    { front: '2-D local minimum in O(n)', back: String.raw`Keep a region and a cell g smaller than its whole boundary. Scan the middle row + column; take the smallest c among them and g; if c is not a local min, move to a smaller neighbor and recurse on its quadrant. $T(n) = T(n/2) + O(n) = O(n)$.` },
    { front: 'Skyline by divide and conquer', back: String.raw`Split the buildings in half, compute both skylines recursively, merge them by sweeping key points in x-order, tracking each skyline's current height and emitting (x, max) when it changes. $2T(n/2) + O(n) = O(n\log n)$.` },
    { front: 'Karatsuba for polynomials', back: String.raw`$P = P_0 + x^m P_1$, $Q = Q_0 + x^m Q_1$; middle term $= (P_0+P_1)(Q_0+Q_1) - P_0Q_0 - P_1Q_1$. Three half-size products: $\Theta(n^{\lg 3})$.` },
    { front: 'Randomized quickselect: expected O(n) proof idea', back: String.raw`A pivot is good (both sides $\le 3m/4$) with probability $\ge 1/2$, so each phase (size shrinking by 3/4) lasts $\le 2$ calls in expectation; $\sum_j 2c(3/4)^j n = 8cn$.` },
    { front: 'Median of medians: exact pivot guarantee', back: String.raw`At least $3(\lfloor m/2\rfloor - 1) \ge 3n/10 - 9/2$ elements on each side ($m = \lceil n/5\rceil$), so the second call has $\le 7n/10 + 5$ elements; $T(n) \le T(\lceil n/5\rceil) + T(7n/10 + 5) + an \le cn$ for $c \ge 20a$, $n > 120$.` },
    { front: 'Closest pair: why 7 neighbors?', back: String.raw`The $2\delta\times\delta$ box above a strip point splits into 8 squares of side $\delta/2$; two points in one square would be on the same side and closer than $\delta$. So at most 8 points in the box: compare with the next 7 in y-order.` },
    { front: 'Hidden costs in recursive code', back: String.raw`Copying/slicing subarrays costs $\Theta(\text{size})$ per call: binary search with copies is $T(n/2) + \Theta(n) = \Theta(n)$. Sorting inside a combine adds a log: $2T(n/2) + O(n\log n) = \Theta(n\log^2 n)$.` },
    { front: 'k-th smallest of two sorted arrays', back: String.raw`Compare $A[i]$, $B[j]$ with $i = \min(m, \lfloor k/2\rfloor)$, $j = \min(n, \lfloor k/2\rfloor)$. If $A[i] < B[j]$, A[1..i] all have rank < k: drop them, k −= i. Symmetric otherwise. $O(\log k)$.` },
    { front: 'Mergesort on already-sorted input', back: String.raw`Still $\Theta(n\log n)$ comparisons: each merge makes about half as many comparisons as its size, so $C(n) = 2C(n/2) + n/2 = \frac n2\lg n$. Mergesort is not adaptive; insertion sort takes O(n) on sorted input.` },
    { front: 'Binary search on the answer', back: String.raw`If feasibility is monotone in a parameter C (if C works, so does every larger C), binary search C over its range $[lo, hi]$. Cost: $O(\text{feasibility test}\times\log(hi - lo))$. Example: shipping within d days, $O(n\log S)$.` },
    { front: 'Merging k sorted lists (n elements in total)', back: String.raw`Divide and conquer over the lists: every level of the recursion tree costs O(n), and there are $\lceil\lg k\rceil$ levels, so $O(n\log k)$. Merging one list at a time costs $\Theta(nk)$.` },
    { front: 'Quicksort and duplicates', back: String.raw`With a two-way partition (< pivot | ≥ pivot), an array of equal keys gives $T(n-1) + \Theta(n) = \Theta(n^2)$ even with random pivots. The fix is a three-way partition (<, =, >) that recurses only on the strict sides.` },
    { front: 'Comparing D&C algorithms: which split is faster?', back: String.raw`a products of size n/b, with a polynomially smaller combine, cost $n^{\log_b a}$. Compare the exponents: to beat Strassen ($\lg 7 \approx 2.807$) using $n/3$ blocks you need $\log_3 a < \lg 7$, i.e. $a \le 21$ (since $3^{\lg 7} \approx 21.85$).` },
    { front: 'Searching a sorted array of unknown length (galloping)', back: String.raw`Probe positions $1, 2, 4, \dots$ until $A[2^k] \ge x$, then binary search in $(2^{k-1}, 2^k]$. Uses $O(\log p)$ probes, where p is the answer's position.` },
    { front: 'Second largest with few comparisons (tournament)', back: String.raw`A recursive tournament finds the max with n − 1 comparisons and records who lost directly to it: at most $\lceil\lg n\rceil$ elements. The second largest lost only to the max, so it is in that list. Total $n + \lceil\lg n\rceil - 2$ comparisons.` },
    { front: 'Weighted median in O(n) worst case', back: String.raw`Select the (unweighted) median m in O(n), and partition. If the weight below m already reaches the target, recurse on the lower half; if adding w(m) reaches it, return m; otherwise recurse on the upper half with the target reduced. $T(n) = T(n/2) + O(n) = O(n)$.` },
  ],
  problems: [
    {
      id: 'divide-mergesort-variants', type: 'written', title: 'Mergesort: correctness and variants', difficulty: 1,
      prompt: String.raw`(a) State a loop invariant for Merge and use it to argue that Merge is correct.
(b) Prove MergeSort correct by induction.
(c) Analyze the running time of 3-way mergesort (split into three thirds, sort each recursively, then merge the three sorted lists in O(n) time).
(d) Analyze a "lopsided" mergesort that splits into pieces of size n/10 and 9n/10.`,
      rubric: ['Invariant mentions both "B[1..k−1] is the k−1 smallest, sorted" and "A[i], A[j] are the smallest remaining in their halves"', 'Induction with base case n ≤ 1 and trusting recursive calls', '3-way: 3T(n/3) + O(n) = Θ(n log n)', 'Lopsided: T(n/10) + T(9n/10) + O(n) = Θ(n log n)'],
      hints: ['Think about what is true about B and about positions i and j before each iteration.', String.raw`For (d), every full level of the recursion tree still sums to n; how deep is the tree?`],
      solution: String.raw`**(a)** Invariant (before iteration k): B[1..k−1] contains the k−1 smallest elements of the two halves, in sorted order; A[i..m] and A[j..n] are exactly the elements not yet copied, and A[i] (if $i \le m$) and A[j] (if $j \le n$) are the smallest remaining elements of their halves (because the halves are sorted). The loop copies the smaller of the two, which is the smallest remaining element overall, so B[1..k] is the k smallest in sorted order. Initially B is empty (true); at the end (k = n+1) B is the whole input sorted.

**(b)** Strong induction on n. If $n \le 1$ the array is sorted. Otherwise both halves are smaller, so by the inductive hypothesis the recursive calls sort them, and by (a) Merge produces a sorted permutation of A.

**(c)** $T(n) = 3T(n/3) + O(n)$: each of the $\log_3 n$ levels sums to O(n): $\Theta(n\log n)$. Same asymptotics as ordinary mergesort (constant changes only).

**(d)** $T(n) = T(n/10) + T(9n/10) + O(n)$. Fractions sum to 1, so each full level costs n; leaves lie between depth $\log_{10} n$ and $\log_{10/9} n$, both $\Theta(\log n)$. $T(n) = \Theta(n\log n)$. Any split by constant fractions gives $\Theta(n\log n)$; only extremely unbalanced splits like (1, n−1) hurt.`,
    },
    {
      id: 'divide-mom-groups', type: 'written', title: 'Median of medians with groups of 3 and 7', difficulty: 2,
      prompt: String.raw`Modify the median-of-medians selection algorithm to use groups of size 3, and separately groups of size 7. For each, (a) give a lower bound on the number of elements guaranteed to be at most (and at least) the median of medians, (b) write the recurrence for the running time, (c) solve it. Ignore floors, ceilings and additive constants.`,
      rubric: ['Groups of 3: guarantee ≈ n/3, call sizes n/3 and 2n/3', 'Groups of 3: Θ(n log n) with explanation (fractions sum to 1)', 'Groups of 7: guarantee ≈ 2n/7, call sizes n/7 and 5n/7', 'Groups of 7: O(n) since 1/7 + 5/7 < 1'],
      hints: [String.raw`With groups of size g (odd), each group whose median is $\le$ mom contributes $(g+1)/2$ elements $\le$ mom.`, 'Half of the n/g groups have median ≤ mom.'],
      solution: String.raw`With groups of odd size g there are $n/g$ groups. The median of medians mom is $\ge$ half of the group medians, i.e. $n/(2g)$ of them, and each of those groups has $(g+1)/2$ elements $\le$ its median, hence $\le$ mom. So at least $\frac{g+1}{2}\cdot\frac{n}{2g}$ elements are $\le$ mom (and symmetrically $\ge$ mom), and the second recursive call has size at most $n - \frac{(g+1)n}{4g}$. The first recursive call (finding mom) has size $n/g$. Computing the group medians and partitioning take O(n).

**g = 3.** Guarantee: $2\cdot\frac{n}{6} = n/3$ elements on each side. Recurrence:
$$T(n) = T(n/3) + T(2n/3) + O(n).$$
Since $1/3 + 2/3 = 1$, every full level of the recursion tree sums to $\Theta(n)$ and there are $\Theta(\log n)$ levels: $T(n) = \Theta(n\log n)$. No better than sorting.

**g = 7.** Guarantee: $4\cdot\frac{n}{14} = 2n/7$ on each side, so the recursive call has size $\le 5n/7$:
$$T(n) = T(n/7) + T(5n/7) + O(n).$$
Since $1/7 + 5/7 = 6/7 < 1$, level sums are at most $(6/7)^i\cdot cn$: $T(n) \le 7cn = O(n)$.

(Group size 5 gives $1/5 + 7/10 = 9/10$; 5 is the smallest odd group size for which the fractions sum to less than 1.)`,
    },
    {
      id: 'divide-local-min', type: 'written', title: 'Local minimum in O(log n)', difficulty: 2,
      prompt: String.raw`An array A[1..n] of distinct numbers is given; define $A[0] = A[n+1] = +\infty$. Index i is a **local minimum** if $A[i] < A[i-1]$ and $A[i] < A[i+1]$. Describe and analyze an algorithm that finds a local minimum in $O(\log n)$ time, and prove it correct.`,
      rubric: ['Algorithm discards half the range each step', 'States and maintains an invariant guaranteeing a local minimum exists in the range', 'Correct O(log n) analysis via T(n) = T(n/2) + O(1)'],
      hints: ['Why does a local minimum always exist? Consider the global minimum.', String.raw`Keep a range [lo, hi] with $A[lo-1] > A[lo]$ and $A[hi] < A[hi+1]$.`],
      solution: String.raw`**Invariant.** We maintain $1 \le lo \le hi \le n$ with $A[lo-1] > A[lo]$ and $A[hi] < A[hi+1]$. Initially lo = 1, hi = n, true by the sentinels. **Claim:** under the invariant, A[lo..hi] contains a local minimum of A. Proof: let p be the position of the minimum of A[lo..hi]. Its neighbors inside the range are larger; if $p = lo$, $A[lo-1] > A[lo]$ by the invariant; if $p = hi$, $A[hi+1] > A[hi]$. So p is a local minimum.

~~~pseudo
LocalMin(A[1..n]):
    lo = 1; hi = n
    loop:
        mid = floor((lo + hi) / 2)
        if A[mid-1] < A[mid]:   hi = mid - 1      // then A[hi] < A[hi+1] = A[mid]
        else if A[mid+1] < A[mid]: lo = mid + 1   // then A[lo-1] = A[mid] > A[lo]
        else: return mid                          // smaller than both neighbors
~~~

In the first branch, $mid > lo$ is guaranteed (if mid = lo then $A[mid-1] = A[lo-1] > A[lo]$, so the branch isn't taken), so the new range is nonempty, and the new right end satisfies $A[hi] < A[hi+1]$. The second branch is symmetric. If neither branch applies, A[mid] is smaller than both neighbors: a local minimum. Since the range always contains a local minimum and shrinks, the loop terminates with a correct answer.

**Time.** Each iteration does O(1) work and halves the range: $T(n) = T(n/2) + O(1) = O(\log n)$.`,
    },
    {
      id: 'divide-fixed-point', type: 'written', title: 'Fixed point in a sorted array', difficulty: 1,
      prompt: String.raw`A[1..n] is a sorted array of **distinct integers** (possibly negative). Describe an $O(\log n)$-time algorithm that finds an index i with $A[i] = i$ or reports that none exists. Then explain why your algorithm fails if the integers are not required to be distinct.`,
      rubric: ['Observes A[i] − i is nondecreasing (needs distinct integers)', 'Correct binary search with justification of which half to discard', 'O(log n) analysis', 'Counterexample / explanation for non-distinct case'],
      hints: [String.raw`For distinct integers, $A[i+1] \ge A[i] + 1$.`, String.raw`Let $B[i] = A[i] - i$. What do you know about B?`],
      solution: String.raw`Since the entries are distinct integers in sorted order, $A[i+1] \ge A[i] + 1$, so $B[i] = A[i] - i$ is **nondecreasing**. We want an index with $B[i] = 0$: binary search on B (computed on the fly).

~~~pseudo
FixedPoint(A[1..n]):
    lo = 1; hi = n
    while lo <= hi:
        mid = floor((lo + hi) / 2)
        if A[mid] = mid: return mid
        else if A[mid] < mid: lo = mid + 1     // B[mid] < 0, so B[j] < 0 for all j <= mid
        else: hi = mid - 1                     // B[mid] > 0, so B[j] > 0 for all j >= mid
    return NONE
~~~

Correctness: each discarded index has $B \ne 0$ by monotonicity, so if a fixed point exists it stays in [lo, hi]. Time: $T(n) = T(n/2) + O(1) = O(\log n)$.

**Without distinctness** B need not be monotone: e.g. A = [2, 2, 2, 4, 5]. Here $A[2] = 2$. Checking mid = 3 gives $A[3] = 2 < 3$, so the algorithm discards indices 1..3 — including the fixed point at 2 — and then finds A[4] = 4. That's a fixed point too here, but with A = [2, 2, 2, 5, 6] the algorithm discards 1..3, then sees A[4] = 5 > 4, sets hi = 3, and wrongly reports NONE although $A[2] = 2$. (In general an adversary argument shows $\Omega(n)$ time is needed without distinctness.)`,
    },
    {
      id: 'divide-kth-two-arrays', type: 'written', title: 'k-th smallest of two sorted arrays', difficulty: 3,
      prompt: String.raw`You are given two sorted arrays A[1..m] and B[1..n] (all elements distinct) and an integer $1 \le k \le m + n$. Describe and analyze an algorithm that returns the k-th smallest element of $A \cup B$ in $O(\log k)$ time — much faster than merging. Prove that your algorithm never discards the answer.`,
      rubric: ['Compares A[i] and B[j] with i, j ≈ k/2 (clamped to the array lengths)', 'Proof that the discarded elements all have rank < k', 'Correct base cases (one array empty, k = 1)', 'Shows k roughly halves or an array is exhausted each step: O(log k)'],
      hints: [String.raw`Compare $A[\lfloor k/2\rfloor]$ with $B[\lfloor k/2\rfloor]$. If the A-element is smaller, how many elements can possibly be smaller than it?`, 'Handle arrays shorter than k/2 by clamping the index to the array length.'],
      solution: String.raw`~~~pseudo
Select2(A[1..m], B[1..n], k):
    if m = 0: return B[k]
    if n = 0: return A[k]
    if k = 1: return min(A[1], B[1])
    i = min(m, floor(k/2));  j = min(n, floor(k/2))
    if A[i] < B[j]:  return Select2(A[i+1..m], B[1..n], k - i)
    else:            return Select2(A[1..m], B[j+1..n], k - j)
~~~
(Subarrays are passed as index ranges, so each call does O(1) work.)

**Correctness.** Suppose $A[i] < B[j]$. Any element smaller than A[i] is either in A[1..i−1] (at most i−1 of them) or in B and smaller than B[j], hence in B[1..j−1] (at most j−1 of them). So A[i] has rank at most $(i-1) + (j-1) + 1 = i + j - 1 \le k - 1$, since $i, j \le \lfloor k/2\rfloor$. Hence A[1..i] all have rank $< k$: none of them is the answer, and removing these i elements (all smaller than the answer) means the answer is the $(k-i)$-th smallest of what remains. The other case is symmetric. The base cases are clearly right. By induction the algorithm is correct.

**Time.** Each call does O(1) work. In a call, if neither array is shorter than $\lfloor k/2\rfloor$, then $i = j = \lfloor k/2\rfloor$ and k decreases to $\lceil k/2\rceil$. If, say, $m < \lfloor k/2\rfloor$ (so $i = m$), then either all of A is removed (next call is a base case) or $j = \lfloor k/2\rfloor$ elements of B are removed, again halving k. So within O(1) calls k at least halves (or we hit a base case), giving $O(\log k)$ calls in total.`,
    },
    {
      id: 'divide-significant-inversions', type: 'written', title: 'Counting significant inversions', difficulty: 2,
      prompt: String.raw`A **significant inversion** in A[1..n] is a pair $i < j$ with $A[i] > 2A[j]$. Describe and analyze an $O(n\log n)$ algorithm that counts the significant inversions.`,
      rubric: ['Recursively sort-and-count both halves', 'Counts crossing significant inversions in O(n) with a monotone two-pointer scan over the sorted halves', 'Counting is separate from the merge (merge uses ordinary comparisons)', 'Recurrence 2T(n/2) + O(n) = O(n log n)'],
      hints: ['Counting crossing pairs is easy if both halves are already sorted.', String.raw`For left elements in increasing order, the number of right elements with $2R[q] < L[p]$ only grows.`],
      solution: String.raw`Strengthen the recursion: **SortCount(A)** sorts A *and* returns its number of significant inversions.

~~~pseudo
SortCount(A[1..n]):
    if n <= 1: return 0
    m = floor(n/2)
    c = SortCount(A[1..m]) + SortCount(A[m+1..n])     // halves now sorted
    // count crossing pairs: p in left, q in right, A[p] > 2 A[q]
    q = m + 1
    for p = 1 to m:                     // A[1..m] increasing
        while q <= n and A[p] > 2 * A[q]: q = q + 1
        c = c + (q - (m+1))             // right elements A[m+1..q-1] all satisfy A[p] > 2A[.]
    Merge(A, m)                         // ordinary merge
    return c
~~~

**Correctness.** Every significant inversion (i, j) lies within the left half, within the right half, or crosses (i ≤ m < j). Recursive calls count the first two kinds (Recursion Fairy) and the order of elements *within* a half doesn't matter for crossing pairs (every left element precedes every right element), so we may count crossing pairs on the sorted halves. For a left element L = A[p], the right elements with $2A[q] < L$ form a prefix of the sorted right half; since the left half is increasing, this prefix only grows as p increases, so the pointer q never moves backward. Therefore the scan counts exactly the crossing pairs.

**Time.** The scan is O(n) total (q moves at most n/2 times), and so is the merge. $T(n) = 2T(n/2) + O(n) = O(n\log n)$.

Note: you can't simply count during the merge as in ordinary inversion counting, because the merge order (by $<$) differs from the counting condition ($> 2\times$).`,
    },
    {
      id: 'divide-max-subarray', type: 'written', title: 'Maximum subarray by divide and conquer', difficulty: 2,
      prompt: String.raw`Given A[1..n] of (possibly negative) integers, find the maximum sum of a nonempty contiguous subarray. (a) Give an $O(n\log n)$ divide-and-conquer algorithm. (b) Strengthen the recursion to obtain an O(n) divide-and-conquer algorithm.`,
      rubric: ['Three cases: left, right, crossing', 'Crossing case computed in O(n) as best suffix of left + best prefix of right', 'Recurrence 2T(n/2) + O(n) = O(n log n)', 'Strengthened version returns (total, best prefix, best suffix, best) with O(1) combine: 2T(n/2) + O(1) = O(n)'],
      hints: ['The best subarray is in the left half, in the right half, or crosses the middle.', 'For (b), have each call also return its total sum, best prefix sum, and best suffix sum.'],
      solution: String.raw`**(a)** The optimal subarray lies entirely in A[1..m], entirely in A[m+1..n], or crosses the midpoint. A crossing subarray A[i..j] with $i \le m < j$ has sum (sum of A[i..m]) + (sum of A[m+1..j]), and the two parts can be optimized independently: the best suffix of the left half (scan i from m down to 1 keeping a running sum) plus the best prefix of the right half (scan j from m+1 up). Both scans are O(n).

~~~pseudo
MaxSub(A[lo..hi]):
    if lo = hi: return A[lo]
    m = floor((lo + hi)/2)
    best = max(MaxSub(A[lo..m]), MaxSub(A[m+1..hi]))
    s = 0; suf = -infinity
    for i = m down to lo:   s += A[i]; suf = max(suf, s)
    s = 0; pre = -infinity
    for j = m+1 to hi:      s += A[j]; pre = max(pre, s)
    return max(best, suf + pre)
~~~

$T(n) = 2T(n/2) + O(n) = O(n\log n)$.

**(b)** Return a 4-tuple (total, pre, suf, best) for each subarray, where pre/suf are the best nonempty prefix/suffix sums. For a single element x all four are x. Combining a left tuple L and right tuple R:
- total = L.total + R.total
- pre = max(L.pre, L.total + R.pre)
- suf = max(R.suf, R.total + L.suf)
- best = max(L.best, R.best, L.suf + R.pre)

Each combine is O(1), so $T(n) = 2T(n/2) + O(1) = O(n)$. (Kadane's algorithm is a simpler O(n) scan, essentially a DP.)`,
    },
    {
      id: 'divide-majority', type: 'written', title: 'Majority element', difficulty: 2,
      prompt: String.raw`An element is a **majority** of A[1..n] if it occurs more than n/2 times. You may only test elements for **equality** (no ordering). Give an $O(n\log n)$ divide-and-conquer algorithm that returns the majority element or reports that there is none. Prove the key lemma your algorithm relies on.`,
      rubric: ['Lemma: a majority of A is a majority of at least one half (with proof)', 'Algorithm returns candidates from halves and verifies each by counting in O(n)', 'Recurrence 2T(n/2) + O(n) = O(n log n)'],
      hints: [String.raw`If x is not a majority of either half, how many times can it occur in total?`, 'Recursion returns at most one candidate per half; count each candidate in the whole array.'],
      solution: String.raw`**Lemma.** If x is a majority of A, then x is a majority of A[1..m] or of A[m+1..n] (where $m = \lfloor n/2\rfloor$).

*Proof.* Otherwise x occurs at most $m/2$ times in the left half and at most $(n-m)/2$ times in the right half, so at most $n/2$ times in total — not a majority. ∎

~~~pseudo
Majority(A[1..n]):          // returns the majority element or NONE
    if n = 1: return A[1]
    m = floor(n/2)
    c1 = Majority(A[1..m]);  c2 = Majority(A[m+1..n])
    for c in {c1, c2} (skipping NONE):
        if Count(A, c) > n/2: return c       // O(n) equality tests
    return NONE
~~~

**Correctness.** By the lemma and the inductive hypothesis, if a majority x exists it equals c1 or c2, and counting confirms it. Anything returned has been verified by counting, so a NONE answer is never wrong either.

**Time.** $T(n) = 2T(n/2) + O(n) = O(n\log n)$. (The Boyer–Moore voting algorithm solves this in O(n) time and O(1) space, but it is not divide and conquer.)`,
    },
    {
      id: 'divide-karatsuba', type: 'written', title: 'Karatsuba by hand, and beyond', difficulty: 2,
      prompt: String.raw`(a) Use one level of Karatsuba's method to compute $4321 \times 8765$, showing the three products.
(b) Suppose you discover how to multiply two n-digit numbers by splitting each into **three** pieces and making only **5** recursive multiplications of $n/3$-digit numbers, plus O(n) extra work. What is the running time? Is it better than Karatsuba?
(c) What if you needed 6 multiplications of thirds?`,
      rubric: ['Correct a, b, c, d and the three products', 'Correct final product 37,873,565', 'Recurrence 5T(n/3) + O(n) = Θ(n^{log_3 5}) ≈ n^{1.465}, better than n^{1.585}', '6T(n/3): n^{log_3 6} ≈ n^{1.631}, worse than Karatsuba'],
      hints: [String.raw`$a = 43, b = 21, c = 87, d = 65$; compute $ac$, $bd$, $(a-b)(c-d)$.`, String.raw`Compare $\log_3 5$ with $\lg 3$ numerically.`],
      solution: String.raw`**(a)** $x = 4321 = 43\cdot 100 + 21$, $y = 8765 = 87\cdot 100 + 65$.
- $ac = 43\cdot 87 = 3741$
- $bd = 21\cdot 65 = 1365$
- $(a-b)(c-d) = 22\cdot 22 = 484$
- middle $= ad + bc = 3741 + 1365 - 484 = 4622$ (check: $43\cdot65 + 21\cdot 87 = 2795 + 1827 = 4622$ ✓)

$xy = 3741\cdot 10^4 + 4622\cdot 10^2 + 1365 = 37{,}410{,}000 + 462{,}200 + 1{,}365 = 37{,}873{,}565.$

**(b)** $T(n) = 5T(n/3) + O(n)$; level sums $(5/3)^i n$ increase, so $T(n) = \Theta(5^{\log_3 n}) = \Theta(n^{\log_3 5})$, and $\log_3 5 = \ln 5/\ln 3 \approx 1.465 < \lg 3 \approx 1.585$. Better than Karatsuba. (This is Toom–Cook 3-way multiplication.)

**(c)** $T(n) = 6T(n/3) + O(n) = \Theta(n^{\log_3 6})$, $\log_3 6 \approx 1.631 > 1.585$: worse than Karatsuba (but still better than $n^2$; 9 products would give exactly $n^2$).`,
    },
    {
      id: 'divide-inversions-code', type: 'code', title: 'Count inversions in O(n log n)', difficulty: 2,
      prompt: String.raw`Write <code>countInversions(A)</code> returning the number of pairs $i < j$ with $A[i] > A[j]$. Elements may repeat (equal elements are **not** an inversion). Aim for $O(n\log n)$ with sort-and-count. Do not modify the input array.`,
      fn: 'countInversions',
      starter: 'function countInversions(A) {\n  // return the number of pairs i < j with A[i] > A[j]\n}\n',
      reference: function (A) {
        function sc(arr) {
          if (arr.length <= 1) return [arr.slice(), 0];
          const m = Math.floor(arr.length / 2);
          const [L, c1] = sc(arr.slice(0, m));
          const [R, c2] = sc(arr.slice(m));
          let c = c1 + c2, i = 0, j = 0;
          const out = [];
          while (i < L.length || j < R.length) {
            if (j >= R.length || (i < L.length && L[i] <= R[j])) out.push(L[i++]);
            else { c += L.length - i; out.push(R[j++]); }
          }
          return [out, c];
        }
        return sc(A)[1];
      },
      tests: [[[2, 4, 1, 3, 5]], [[]], [[7]], [[5, 4, 3, 2, 1]], [[1, 1, 1]], [[3, 1, 2, 3, 1]], [[1, 2, 3, 4, 5, 6]]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 15) }, () => Math.floor(Math.random() * 10))],
      hints: ['Write a helper that returns both the sorted array and the count.', 'When the merge takes R[j] because R[j] < L[i], all of L[i..] form inversions with R[j].'],
      solution: String.raw`~~~js
function countInversions(A) {
  function sc(arr) {                       // returns [sorted copy, count]
    if (arr.length <= 1) return [arr.slice(), 0];
    const m = Math.floor(arr.length / 2);
    const [L, c1] = sc(arr.slice(0, m));
    const [R, c2] = sc(arr.slice(m));
    let c = c1 + c2, i = 0, j = 0;
    const out = [];
    while (i < L.length || j < R.length) {
      if (j >= R.length || (i < L.length && L[i] <= R[j])) out.push(L[i++]);
      else { c += L.length - i; out.push(R[j++]); }
    }
    return [out, c];
  }
  return sc(A)[1];
}
~~~
Comparing with ≤ (the test L[i] ≤ R[j]) takes equal elements from the left first, so equal pairs are not counted. $T(n) = 2T(n/2) + O(n) = O(n\log n)$.`,
    },
    {
      id: 'divide-quickselect-code', type: 'code', title: 'Quickselect', difficulty: 2,
      prompt: String.raw`Write <code>kthSmallest(A, k)</code> returning the k-th smallest element of the array A (1-indexed: k = 1 is the minimum; duplicates count separately, so it equals the sorted array's element at position k). Use quickselect (random pivot, three-way partition into less / equal / greater) for expected O(n) time. Do not modify the input array.`,
      fn: 'kthSmallest',
      starter: 'function kthSmallest(A, k) {\n  // return the k-th smallest element (1-indexed)\n}\n',
      reference: function (A, k) {
        const s = A.slice().sort((x, y) => x - y);
        return s[k - 1];
      },
      tests: [[[3, 1, 4, 1, 5, 9, 2, 6], 1], [[3, 1, 4, 1, 5, 9, 2, 6], 2], [[3, 1, 4, 1, 5, 9, 2, 6], 5], [[3, 1, 4, 1, 5, 9, 2, 6], 8], [[7], 1], [[2, 2, 2, 2], 3], [[10, -3, 7, 0, -3], 3]],
      gen: () => {
        const n = 1 + Math.floor(Math.random() * 15);
        const A = Array.from({ length: n }, () => Math.floor(Math.random() * 21) - 10);
        return [A, 1 + Math.floor(Math.random() * n)];
      },
      hints: ['Partition into three lists: less than, equal to, and greater than the pivot.', 'If k ≤ |less|, recurse on less; if k ≤ |less| + |equal|, the pivot is the answer; otherwise recurse on greater with k reduced.'],
      solution: String.raw`~~~js
function kthSmallest(A, k) {
  let arr = A.slice();
  while (true) {
    const pivot = arr[Math.floor(Math.random() * arr.length)];
    const less = arr.filter(x => x < pivot);
    const equal = arr.filter(x => x === pivot);
    const greater = arr.filter(x => x > pivot);
    if (k <= less.length) arr = less;
    else if (k <= less.length + equal.length) return pivot;
    else { k -= less.length + equal.length; arr = greater; }
  }
}
~~~
The three-way partition handles duplicates (with a two-way partition, an array of equal elements would never shrink). Expected time O(n): with probability ≥ 1/2 the pivot is in the middle half and the next array has at most 3/4 of the elements. Worst case $\Theta(n^2)$.`,
    },
    {
      id: 'divide-powmod-code', type: 'code', title: 'Modular fast exponentiation', difficulty: 1,
      prompt: String.raw`Write <code>powMod(a, n, m)</code> returning $a^n \bmod m$ for integers $0 \le a \le 10^6$, $0 \le n \le 10^{12}$, $1 \le m \le 10^6$, using $O(\log n)$ multiplications. (All intermediate products stay below $10^{12}$ if you reduce mod m after every multiplication, so ordinary JavaScript numbers are exact. Do **not** use bitwise operators on n — they truncate to 32 bits.) Note $a^0 \bmod 1 = 0$.`,
      fn: 'powMod',
      starter: 'function powMod(a, n, m) {\n  // return a^n mod m using repeated squaring\n}\n',
      reference: function (a, n, m) {
        let result = 1 % m, base = a % m, e = n;
        while (e > 0) {
          if (e % 2 === 1) result = (result * base) % m;
          base = (base * base) % m;
          e = Math.floor(e / 2);
        }
        return result;
      },
      tests: [[2, 10, 1000], [3, 0, 7], [5, 3, 1], [0, 0, 13], [0, 5, 13], [7, 1000000000000, 999983], [123456, 789, 1000000]],
      gen: () => [Math.floor(Math.random() * 1000001), Math.floor(Math.random() * 1e9), 1 + Math.floor(Math.random() * 1000000)],
      hints: [String.raw`$a^n = (a^{\lfloor n/2\rfloor})^2 \cdot a^{n \bmod 2}$.`, 'Iteratively: scan the bits of n from least significant, squaring the base each step.'],
      solution: String.raw`~~~js
function powMod(a, n, m) {
  let result = 1 % m, base = a % m, e = n;
  while (e > 0) {
    if (e % 2 === 1) result = (result * base) % m;
    base = (base * base) % m;
    e = Math.floor(e / 2);
  }
  return result;
}
~~~
Invariant: $\text{result}\cdot \text{base}^e \equiv a^n \pmod m$. Each iteration halves e, so there are $O(\log n)$ iterations with at most two multiplications each. Starting from <code>1 % m</code> handles m = 1.`,
    },
    {
      id: 'divide-lowerbound-code', type: 'code', title: 'Binary search: lower bound', difficulty: 1,
      prompt: String.raw`Write <code>lowerBound(A, x)</code>: given an array A sorted in nondecreasing order (duplicates allowed), return the smallest index i (0-indexed) with $A[i] \ge x$, or <code>A.length</code> if there is none. Use $O(\log n)$ comparisons.`,
      fn: 'lowerBound',
      starter: 'function lowerBound(A, x) {\n  // smallest i with A[i] >= x, or A.length\n}\n',
      reference: function (A, x) {
        let lo = 0, hi = A.length;
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (A[mid] < x) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      tests: [[[1, 3, 3, 5, 8], 3], [[1, 3, 3, 5, 8], 4], [[1, 3, 3, 5, 8], 0], [[1, 3, 3, 5, 8], 9], [[], 5], [[2, 2, 2], 2], [[2, 2, 2], 3]],
      gen: () => {
        const A = Array.from({ length: Math.floor(Math.random() * 12) }, () => Math.floor(Math.random() * 10)).sort((p, q) => p - q);
        return [A, Math.floor(Math.random() * 12) - 1];
      },
      hints: [String.raw`Keep the invariant: $A[j] < x$ for $j < lo$ and $A[j] \ge x$ for $j \ge hi$.`, 'Loop while lo < hi; the answer is lo when they meet.'],
      solution: String.raw`~~~js
function lowerBound(A, x) {
  let lo = 0, hi = A.length;       // invariant: A[<lo] < x, A[>=hi] >= x
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (A[mid] < x) lo = mid + 1;  // everything up to mid is < x
    else hi = mid;                 // everything from mid on is >= x
  }
  return lo;
}
~~~
Because $lo \le mid < hi$, each iteration shrinks the range, and when $lo = hi$ the invariant says exactly that lo is the first index with $A[i] \ge x$.`,
    },
    {
      id: 'divide-grid-local-min', type: 'written', title: 'Local minimum in a grid in O(n)', difficulty: 3,
      prompt: String.raw`An $n \times n$ grid M of distinct numbers is surrounded by a border of $+\infty$ values. A cell is a **local minimum** if its value is smaller than the values of its four neighbors (up, down, left, right). Describe and analyze an algorithm that finds a local minimum while examining only $O(n)$ cells, and prove it correct.

(For comparison: examining all $n^2$ cells is trivial, and running the 1-D local-minimum binary search on the column minima gives $O(n\log n)$.)`,
      rubric: ['States an invariant that guarantees a local minimum inside the current region (a tracked cell smaller than the whole region boundary)', 'Scans only the middle row and middle column (plus the tracked cell) per round', 'Correctly argues the chosen smaller neighbor lies strictly inside one quadrant and the invariant is restored', 'Recurrence T(n) = T(n/2) + O(n) = O(n)'],
      hints: ['Why does a local minimum exist at all? Look at the global minimum of a region whose boundary is "high".', 'Keep a region R and a cell g in R whose value is smaller than every cell on the boundary of R. Why is the minimum of R then a local minimum of the whole grid?', 'Find the smallest cell c among the middle row, the middle column, and g. If c is not a local minimum, one of its neighbors is smaller. Where can that neighbor be?'],
      solution: String.raw`**Invariant.** We keep a square region R of the (bordered) grid, *including* its boundary rows and columns, and a cell g in R whose value is **smaller than every boundary cell of R**. Initially R is the whole bordered grid (its boundary is the $+\infty$ border) and g is any real cell.

**Lemma.** Under the invariant, the minimum cell of R is a local minimum of M. *Proof.* Let p be the minimum cell of R. Since $p \le g <$ every boundary cell, p is not on the boundary, so all four neighbors of p are in R and are larger than p. ∎

**Round.** Let rm and cm be the middle row and middle column of R; together with R's boundary they cut R into four quadrants, each a square region whose boundary lies on R's boundary or on the cross.

1. Scan the interior cells of row rm and column cm, and let c be the smallest among those cells and g.
2. Compare c with its four neighbors. If c is smaller than all of them, **return c**.
3. Otherwise let x be a neighbor of c with $x < c$. Set $g = x$ and recurse on the quadrant containing x.

If R is small (say side at most 4), find the minimum of R by brute force and return it (correct by the lemma).

**Correctness of a round.** In step 2, a returned c really is a local minimum of M (we compared it with its actual neighbors). In step 3: c is either on the cross or c = g; in both cases c is not on R's boundary (cross cells we scan are interior, and g is smaller than the boundary), so its neighbor x is in R. Now $x < c \le g <$ every boundary cell of R, so x is not on R's boundary; and $x < c \le$ every scanned cross cell, so x is not on the cross. Hence x lies strictly inside one quadrant Q. The boundary of Q consists of cells of R's boundary and of the cross, all of which are larger than x. So (Q, x) satisfies the invariant, and by induction the recursion returns a local minimum.

**Time.** A round on a region of side s examines $O(s)$ cells (the cross has fewer than 2s cells, plus 4 neighbors), and the quadrant has side about s/2:
$$T(n) = T(n/2) + O(n) = O(n),$$
since the level sums $n, n/2, n/4, \dots$ decrease geometrically. That is sublinear in the $n^2$ input size.

*Pitfall.* Recursing into the quadrant that contains the smaller neighbor *without* tracking g can fail: the smaller neighbor might lie outside the current region (next to its boundary). Tracking g, and choosing c as the minimum of the cross **and** g, is exactly what rules that out.`,
    },
    {
      id: 'divide-skyline', type: 'written', title: 'The skyline problem', difficulty: 3,
      prompt: String.raw`You are given n rectangular buildings standing on the x-axis; building i occupies $[l_i, r_i)$ horizontally and has height $h_i > 0$. The **skyline** is the upper outline of their union, represented as a list of key points $(x_1, y_1), (x_2, y_2), \dots$ in increasing x-order meaning "from $x_t$ on, the outline has height $y_t$"; consecutive heights differ and the last height is 0.

(a) Describe a divide-and-conquer algorithm that computes the skyline in $O(n\log n)$ time. Be precise about the merge step.
(b) Prove the merge step correct.
(c) Write and solve the recurrence. Why does the skyline of k buildings have $O(k)$ key points?
(d) Run your merge on the skylines of $\{(2, 9, 10), (3, 7, 15)\}$ and $\{(5, 12, 12), (15, 20, 10), (19, 24, 8)\}$ (each triple is $(l, r, h)$).`,
      rubric: ['Splits the buildings (not the x-axis) in half and recurses', 'Merge sweeps both key-point lists in x-order, tracking the current height of each, emitting (x, max) on change', 'Correctness: union height at x = max of the two skyline heights at x; height changes only at key points', 'Bounds key points by 2k and gets 2T(n/2) + O(n) = O(n log n)', 'Correct worked merge'],
      hints: ['A single building (l, r, h) has skyline [(l, h), (r, 0)].', 'At every x, the height of the combined outline is the maximum of the two outlines\' heights at x.', 'Walk both lists like the merge in mergesort; remember the most recent height of each list.'],
      solution: String.raw`**(a)** Skyline(buildings): if there is one building (l, r, h) return [(l, h), (r, 0)]. Otherwise split the list of buildings into two halves, compute their skylines $S_1, S_2$ recursively, and return Merge($S_1$, $S_2$):

~~~pseudo
Merge(S1, S2):
    h1 = 0; h2 = 0; out = empty list
    while S1 or S2 has key points left:
        x = smaller x-coordinate among the next key points of S1 and S2
        for each of S1, S2 whose next key point has x-coordinate x:
            update h1 (or h2) to that key point's height and advance past it
        y = max(h1, h2)
        if y differs from the last height in out (0 if out is empty):
            append (x, y) to out
    return out
~~~

**(b)** Let $f_1(x), f_2(x)$ be the heights of the two outlines at x. The union of all buildings has height $\max(f_1(x), f_2(x))$ at x, because the tallest building covering x is the taller of the tallest one in each half. The functions $f_1, f_2$ are constant between consecutive key points of their own lists, so $\max(f_1, f_2)$ can change only at x-coordinates that are key points of $S_1$ or $S_2$. The sweep visits exactly those x-coordinates in increasing order; after processing all key points at x, h1 and h2 equal $f_1(x)$ and $f_2(x)$ (invariant), so y is the true height from x on. Emitting only when y changes produces exactly the key points of the merged outline. By induction on the number of buildings, Skyline is correct.

**(c)** Every key point's x-coordinate is some building's left or right end, and no two key points share an x, so k buildings give at most 2k key points. Merge is linear in the lengths of its inputs, so $T(n) = 2T(n/2) + O(n) = O(n\log n)$, the mergesort recurrence.

**(d)** $S_1 = [(2,10),(3,15),(7,10),(9,0)]$ and $S_2 = [(5,12),(12,0),(15,10),(20,8),(24,0)]$. Sweep:

| x | h1 | h2 | y | emit? |
|---|---|---|---|---|
| 2 | 10 | 0 | 10 | (2, 10) |
| 3 | 15 | 0 | 15 | (3, 15) |
| 5 | 15 | 12 | 15 | no |
| 7 | 10 | 12 | 12 | (7, 12) |
| 9 | 0 | 12 | 12 | no |
| 12 | 0 | 0 | 0 | (12, 0) |
| 15 | 0 | 10 | 10 | (15, 10) |
| 20 | 0 | 8 | 8 | (20, 8) |
| 24 | 0 | 0 | 0 | (24, 0) |

Result: $[(2,10),(3,15),(7,12),(12,0),(15,10),(20,8),(24,0)]$.`,
    },
    {
      id: 'divide-poly-mult', type: 'written', title: 'Polynomial multiplication with three products', difficulty: 2,
      prompt: String.raw`Polynomials are given by coefficient arrays: $P(x) = \sum_{i<n} p_i x^i$ and $Q(x) = \sum_{i<n} q_i x^i$.

(a) Describe a divide-and-conquer algorithm that computes the coefficients of PQ using three recursive multiplications of polynomials with about n/2 coefficients, and prove the identity it relies on.
(b) Carry out one level of your algorithm on $P = 1 - x + 2x^2 + 3x^3$ and $Q = 2 + x - x^2 + 4x^3$.
(c) Write and solve the recurrence. Compare with the schoolbook method.
(d) A friend proposes computing all four products $P_0Q_0, P_0Q_1, P_1Q_0, P_1Q_1$ recursively "because additions are cheap". What is the running time of that version?`,
      rubric: ['Correct split P = P0 + x^m P1 and the identity P0Q1 + P1Q0 = (P0+P1)(Q0+Q1) − P0Q0 − P1Q1', 'Correct three products and final coefficients 2, −1, 2, 13, −3, 5, 12', 'T(n) = 3T(n/2) + O(n) = Θ(n^{lg 3}) vs Θ(n²)', 'Four products: 4T(n/2) + O(n) = Θ(n²)'],
      hints: [String.raw`Split at $m = n/2$: $P = P_0 + x^m P_1$ where $P_0$ holds the low coefficients.`, String.raw`Expand $(P_0 + P_1)(Q_0 + Q_1)$.`],
      solution: String.raw`**(a)** Let $m = \lceil n/2\rceil$, $P = P_0 + x^m P_1$, $Q = Q_0 + x^m Q_1$, where $P_0, Q_0$ hold coefficients $0..m-1$ and $P_1, Q_1$ the rest. Then
$$PQ = P_0Q_0 + x^m(P_0Q_1 + P_1Q_0) + x^{2m}P_1Q_1.$$
Expanding, $(P_0 + P_1)(Q_0 + Q_1) = P_0Q_0 + P_0Q_1 + P_1Q_0 + P_1Q_1$, so the middle term equals $(P_0+P_1)(Q_0+Q_1) - P_0Q_0 - P_1Q_1$. The algorithm computes the three products $Z_0 = P_0Q_0$, $Z_2 = P_1Q_1$, $Z_1 = (P_0+P_1)(Q_0+Q_1)$ recursively (base case: constant-size polynomials by the schoolbook method), and returns $Z_0 + x^m(Z_1 - Z_0 - Z_2) + x^{2m}Z_2$, which needs O(n) coefficient additions and index shifts. Correctness is induction on n plus the identity.

**(b)** m = 2: $P_0 = 1 - x$, $P_1 = 2 + 3x$, $Q_0 = 2 + x$, $Q_1 = -1 + 4x$.
- $Z_0 = (1-x)(2+x) = 2 - x - x^2$
- $Z_2 = (2+3x)(-1+4x) = -2 + 5x + 12x^2$
- $Z_1 = (3 + 2x)(1 + 5x) = 3 + 17x + 10x^2$
- middle $= Z_1 - Z_0 - Z_2 = 3 + 13x - x^2$

Assemble $Z_0 + x^2(\text{middle}) + x^4 Z_2$:
$$PQ = 2 - x + (-1 + 3)x^2 + 13x^3 + (-1 - 2)x^4 + 5x^5 + 12x^6 = 2 - x + 2x^2 + 13x^3 - 3x^4 + 5x^5 + 12x^6.$$
(Check: the $x^3$ coefficient directly is $1\cdot4 + (-1)(-1) + 2\cdot1 + 3\cdot2 = 13$ ✓.)

**(c)** $T(n) = 3T(n/2) + O(n)$. Level sums $(3/2)^i n$ increase; leaves dominate: $T(n) = \Theta(3^{\lg n}) = \Theta(n^{\lg 3}) \approx \Theta(n^{1.585})$, versus $\Theta(n^2)$ for the schoolbook method.

**(d)** $T(n) = 4T(n/2) + O(n)$: level sums $2^i n$, leaves dominate, $4^{\lg n} = n^2$. No improvement at all — the saving comes entirely from reducing the *number* of subproblems, because the leaves dominate.`,
    },
    {
      id: 'divide-nuts-bolts', type: 'written', title: 'Nuts and bolts', difficulty: 3,
      prompt: String.raw`You have n nuts and n bolts of distinct sizes; each nut fits exactly one bolt. You **cannot** compare two nuts or two bolts with each other; the only operation is to try a nut on a bolt, which tells you whether the nut is too small, too large, or fits.

(a) Describe a randomized divide-and-conquer algorithm that matches every nut with its bolt using $O(n\log n)$ comparisons in expectation.
(b) Prove it correct.
(c) Analyze its expected number of comparisons (you may relate it to an algorithm from the lesson, but explain why the relation holds).
(d) Prove that every algorithm needs $\Omega(n\log n)$ comparisons in the worst case.`,
      rubric: ['Pick a random nut, partition bolts, find its bolt, then partition nuts with that bolt', 'Recurse on (small nuts, small bolts) and (large nuts, large bolts); sizes match', 'Expected comparisons analyzed like randomized quicksort: O(n log n)', 'Lower bound via ternary decision tree with n! leaves'],
      hints: ['Mimic quicksort. A nut can partition the bolts; which object can then partition the nuts?', String.raw`After partitioning, the nuts smaller than the pivot nut fit exactly the bolts smaller than the pivot bolt.`, String.raw`For the lower bound: how many different matchings are possible, and how many outcomes does one test have?`],
      solution: String.raw`**(a)**

~~~pseudo
Match(nuts N, bolts B):          // |N| = |B|, and N's partners are exactly B
    if N is empty: return
    pick a nut v uniformly at random from N
    test v against every bolt: B< = bolts too small for v, B> = too large, b = the fitting bolt
    test b against every other nut: N< = nuts smaller than b, N> = nuts larger than b
    output the pair (v, b)
    Match(N<, B<);  Match(N>, B>)
~~~

**(b)** The nuts in $N_<$ are exactly the nuts smaller than v (since b has v's size), and the bolts in $B_<$ are exactly the bolts smaller than v. The partner of a nut smaller than v is a bolt smaller than v, so $N_<$ and $B_<$ contain each other's partners (in particular, they have equal size); likewise $N_>$ and $B_>$. So both recursive calls are valid, smaller instances, and by induction they match everything correctly; (v, b) is matched directly.

**(c)** Identify each nut-bolt pair with its size and sort the sizes $z_1 < \dots < z_n$. Each call does $2(|N| - 1) + 1$ tests, i.e. it compares the pivot size with every other size in the subproblem (twice), exactly like a quicksort partition with a uniformly random pivot. As in the analysis of randomized quicksort, sizes $z_i$ and $z_j$ are compared iff one of them is the first pivot chosen among $z_i, \dots, z_j$, which happens with probability $2/(j-i+1)$. So the expected number of tests is at most $2\sum_{i<j} 2/(j-i+1) + n \le 4nH_n + n = O(n\log n)$. (Worst case $\Theta(n^2)$, with unlucky pivots.)

**(d)** Any algorithm is a ternary decision tree (each test has 3 outcomes); each leaf determines a matching. All $n!$ matchings are possible, and different matchings need different leaves, so the depth is at least $\log_3(n!) = \Omega(n\log n)$ since $\lg(n!) \ge \frac n2\lg\frac n2$.`,
    },
    {
      id: 'divide-median-two-equal', type: 'written', title: 'Median of two equal-size sorted arrays', difficulty: 2,
      prompt: String.raw`A[1..n] and B[1..n] are sorted, and all 2n values are distinct. The **median** of the union is its n-th smallest element. Describe and analyze an $O(\log n)$-time algorithm that compares $A[i]$ and $B[i]$ for $i = \lceil n/2\rceil$ and discards $i - 1$ elements from each array per round. Prove that the discarded elements cannot be the median and that the median of what remains is the median of the original.`,
      rubric: ['Correct choice: if A[i] < B[i], discard A[1..i−1] and B[n−i+2..n] (symmetric otherwise)', 'Rank argument that discarded A-elements have rank < n and discarded B-elements have rank > n', 'Equal numbers removed below and above, so the target is again the median of two equal arrays', 'Base case n ≤ 2 and recurrence T(n) = T(⌊n/2⌋ + 1) + O(1) = O(log n)'],
      hints: [String.raw`If $A[i] < B[i]$, how many elements can be smaller than $A[i]$? How many must be smaller than $B[j]$ for $j \ge i$?`, 'To keep the "median of two equal arrays" form, remove the same number of elements below and above the median.', 'Watch the case n = 2: does the array shrink?'],
      solution: String.raw`~~~pseudo
Median2(A[1..n], B[1..n]):
    if n <= 2: merge the at most 4 elements and return the n-th smallest
    i = ceil(n/2)
    if A[i] < B[i]: return Median2(A[i .. n], B[1 .. n-i+1])
    else:           return Median2(A[1 .. n-i+1], B[i .. n])
~~~
(Pass index ranges, so each round is O(1).)

**Correctness** (case $A[i] < B[i]$; the other is symmetric). Let rank mean position in the sorted union.

- *Discarded A-elements are below the median.* Elements smaller than A[i] are among A[1..i−1] and those B-elements smaller than $A[i] < B[i]$, i.e. among B[1..i−1]. So $\text{rank}(A[i]) \le 2i - 1 \le n$ (as $2\lceil n/2\rceil - 1 \le n$), and each of A[1..i−1] has rank at most $n - 1$.
- *Discarded B-elements are above the median.* For $j \ge n - i + 2$ we have $j \ge i$ (because $2i \le n+1$), so $B[j] \ge B[i] > A[i]$ and B[j] is larger than all of A[1..i] and B[1..j−1]: $\text{rank}(B[j]) \ge i + j \ge n + 2$.

We removed $i - 1$ elements of rank below n and $i - 1$ of rank above n. The remaining arrays both have $n' = n - i + 1$ elements, and the median now has rank $n - (i-1) = n'$ among the $2n'$ remaining elements: it is the median of the new instance. By induction, the algorithm returns the median.

**Termination and time.** $n' = n - \lceil n/2\rceil + 1 = \lfloor n/2\rfloor + 1$, which is less than n for $n \ge 3$ (for n = 2 it would stay 2, which is why n ≤ 2 is a base case). $T(n) = T(\lfloor n/2\rfloor + 1) + O(1) = O(\log n)$.`,
    },
    {
      id: 'divide-index-inversions', type: 'written', title: 'Counting pairs that mix values and positions', difficulty: 2,
      prompt: String.raw`Given an integer array A[1..n], describe $O(n\log n)$ algorithms that count:

(a) the pairs $i < j$ with $A[i] - A[j] > j - i$ ("the value drops faster than the slope −1");
(b) the pairs $i < j$ with $A[i] - A[j] > -(j - i)$, i.e. $A[i] > A[j] - (j - i)$.

Justify the transformation you use, and state the running time.`,
      rubric: ['Rewrites (a) as A[i] + i > A[j] + j', 'Rewrites (b) as A[i] − i > A[j] − j', 'Reduces to counting inversions of the transformed array with sort-and-count', 'O(n) transformation + O(n log n) counting'],
      hints: ['Move everything that depends on i to the left side and everything that depends on j to the right.', 'Once the condition has the form B[i] > B[j], what problem is it?'],
      solution: String.raw`**(a)** $A[i] - A[j] > j - i \iff A[i] + i > A[j] + j$. Define $B[k] = A[k] + k$. The pairs to count are exactly the pairs $i < j$ with $B[i] > B[j]$: the **inversions** of B. Compute B in O(n), then run sort-and-count (recursively sort and count each half; while merging, whenever an element of the right half is output before the remaining left elements, add the number of remaining left elements; equal values are not counted, so take from the left on ties). Total $O(n\log n)$.

**(b)** $A[i] > A[j] - (j - i) \iff A[i] - i > A[j] - j$. With $C[k] = A[k] - k$, count the inversions of C, again $O(n\log n)$.

**Why this is legal.** The transformation is a bijection between the pairs satisfying the original condition and the inversions of the new array, pair by pair, with the same indices; no pair is gained or lost. The point of the trick is that sort-and-count needs a condition of the form "f(value at i) > f(value at j)" — a condition comparing one function of position i with the *same* function of position j — so that sorting the halves preserves the crossing count.

(Exam habit: whenever a counting condition mixes values and indices, first try to separate it into "something about i" versus "something about j".)`,
    },
    {
      id: 'divide-pivot-quality', type: 'written', title: 'How good must a quicksort pivot be?', difficulty: 2,
      prompt: String.raw`A quicksort variant always chooses its pivot (in O(n) time, by some selection method) according to one of the rules below. For each rule, write the recurrence for the worst-case running time and solve it.

(a) The pivot's rank is always between $n/100$ and $99n/100$.
(b) The pivot always has rank exactly 10 (for $n \ge 10$).
(c) The pivot always has rank exactly $\lceil\sqrt n\,\rceil$.
(d) The pivot is the exact median, found by **sorting a copy** of the array with mergesort.`,
      rubric: ['(a) T(n) ≤ T(n/100) + T(99n/100) + O(n) = Θ(n log n) with depth argument', '(b) T(n) = T(n−10) + Θ(n) = Θ(n²)', '(c) T(n) = T(√n) + T(n−√n) + Θ(n) = Θ(n^{3/2}) with justification', '(d) 2T(n/2) + Θ(n log n) = Θ(n log² n)'],
      hints: ['In (a) every full level of the recursion tree costs at most n. How deep can it be?', String.raw`For (c), how many calls does it take to reduce the size from n to n/2, and how much does each cost?`],
      solution: String.raw`**(a)** $T(n) \le \max_{n/100 \le r \le 99n/100}\big(T(r-1) + T(n-r)\big) + O(n)$. Each level of the recursion tree has total size at most n, and every subproblem shrinks by a factor at least $99/100$ per level, so the depth is at most $\log_{100/99} n = O(\log n)$: $T(n) = O(n\log n)$. It is also $\Omega(n\log n)$ (every comparison sort is), so $\Theta(n\log n)$. Any constant-fraction guarantee suffices.

**(b)** $T(n) = T(9) + T(n - 10) + \Theta(n)$. Unrolling, the sizes are $n, n-10, n-20, \dots$, so $T(n) = \Theta(n + (n-10) + (n-20) + \dots) = \Theta(n^2/20) = \Theta(n^2)$.

**(c)** $T(n) = T(\sqrt n) + T(n - \sqrt n) + \Theta(n)$.
- *Lower bound:* while the size m of the "big" side is at least n/2, each call removes at most $\sqrt m \le \sqrt n$ elements and costs at least $m \ge n/2$. Going from n to n/2 takes at least $(n/2)/\sqrt n = \sqrt n/2$ calls, so $T(n) \ge \frac{\sqrt n}{2}\cdot\frac n2 = \Omega(n^{3/2})$.
- *Upper bound:* prove $T(n) \le c\,n^{3/2}$ by induction. Using $(1 - t)^{3/2} \le 1 - t$ for $0 \le t \le 1$ with $t = 1/\sqrt n$: $(n - \sqrt n)^{3/2} \le n^{3/2} - n$. So $T(n) \le c\,n^{3/4} + c\,n^{3/2} - cn + an$, which is at most $c\,n^{3/2}$ when $c(n - n^{3/4}) \ge an$; for $n \ge 16$, $n^{3/4} \le n/2$, so $c \ge 2a$ works (and choose c large enough for the base cases).

So $T(n) = \Theta(n^{3/2})$. (Numerically, $T(n)/n^{3/2} \to 2/3$ when the non-recursive work is exactly n.)

**(d)** Finding the pivot costs $\Theta(n\log n)$, and the halves have size n/2: $T(n) = 2T(n/2) + \Theta(n\log n)$. Level i sums to $n\lg(n/2^i) = n(\lg n - i)$; summing over $\lg n$ levels gives $\Theta(n\log^2 n)$ — worse than plain mergesort. (Using linear-time selection instead gives $\Theta(n\log n)$.)`,
    },
    {
      id: 'divide-k-closest-median', type: 'written', title: 'The k values closest to the median', difficulty: 2,
      prompt: String.raw`Given an unsorted array of n distinct numbers and an integer $1 \le k \le n$, describe an O(n)-time algorithm that returns k elements whose values are closest to the median of the array (the median itself, at distance 0, counts as one of them; ties in distance may be broken arbitrarily). Prove it correct. You may use linear-time selection as a black box.`,
      rubric: ['Selects the median μ in O(n)', 'Computes distances |A[i] − μ| and selects the k-th smallest distance d in O(n)', 'Outputs all elements with distance < d, then fills up with elements at distance exactly d', 'Correctness argument and O(n) total'],
      hints: ['Selection works on any array of numbers you can compute — including an array of distances.', String.raw`If d is the k-th smallest distance, which elements are certainly in the answer?`],
      solution: String.raw`1. $\mu \leftarrow$ Select(A, $\lceil n/2\rceil$). — O(n)
2. Build $D[i] = |A[i] - \mu|$ for all i. — O(n)
3. $d \leftarrow$ Select(D, k), the k-th smallest distance. — O(n)
4. Output every A[i] with $D[i] < d$; then output elements with $D[i] = d$ until k elements have been output. — O(n)

**Correctness.** Let s be the number of elements with distance $< d$. Since d is the k-th smallest distance, $s \le k - 1$ and at least $k - s$ elements have distance exactly d, so step 4 outputs exactly k elements. Every output element has distance $\le d$, and every element not output has distance $\ge d$ (all elements with distance $< d$ were output). So no unchosen element is strictly closer than a chosen one: the output is a valid answer. (With distinct values at most two elements, $\mu - d$ and $\mu + d$, have distance exactly d.)

**Time.** Three linear passes and two calls to linear-time selection: O(n). Sorting would give $O(n\log n)$; a heap of size k gives $O(n\log k)$; selection is what makes it linear.`,
    },
    {
      id: 'divide-closest-pair-proof', type: 'written', title: 'Closest pair: the strip lemma and the running time', difficulty: 3,
      prompt: String.raw`In the closest-pair algorithm, after recursing on the left and right halves (split by the median x-coordinate at the vertical line ℓ), let $\delta = \min(\delta_L, \delta_R)$ and let $s_1, \dots, s_k$ be the points within horizontal distance $\delta$ of ℓ, sorted by y.

(a) Prove: if $d(s_i, s_j) < \delta$ for some $i < j$, then $j \le i + 7$.
(b) A student compares every pair of strip points instead. Give an input on which this makes the algorithm $\Theta(n^2)$.
(c) Another student sorts the strip by y from scratch in every call. Write the recurrence and solve it.
(d) How do you get $O(n\log n)$ overall? Write the final recurrence.`,
      rubric: ['Packing argument with eight δ/2 squares, at most one point each', 'Concludes at most 7 later points can be within δ', 'Example where all points lie in the strip (e.g. near the line)', '2T(n/2) + O(n log n) = Θ(n log² n)', 'Presort by x, return y-sorted lists by merging: 2T(n/2) + O(n)'],
      hints: [String.raw`Any $s_j$ with $j > i$ and $d(s_i, s_j) < \delta$ has $0 \le y(s_j) - y(s_i) < \delta$. Draw the $2\delta \times \delta$ rectangle above $s_i$.`, String.raw`Two points on the same side of ℓ are at distance at least $\delta$.`],
      solution: String.raw`**(a)** If $d(s_i, s_j) < \delta$ then $y(s_j) - y(s_i) < \delta$, and $y(s_j) \ge y(s_i)$ since $j > i$. So $s_j$ lies in the rectangle R of width $2\delta$ (the strip) and height $\delta$ whose bottom edge is at height $y(s_i)$. Divide R into 8 squares of side $\delta/2$, four on each side of ℓ (points on ℓ can be assigned to either side consistently with the split). Two points in the same square lie on the same side, so they are at distance $\ge \delta$; but their distance is at most the square's diagonal $\delta/\sqrt2 < \delta$. Hence each square has at most one point, and R contains at most 8 strip points, $s_i$ included. All of $s_{i+1}, \dots, s_j$ have y-coordinates between $y(s_i)$ and $y(s_j)$, so they all lie in R; thus $j - i \le 7$.

**(b)** Put all n points on (or very near) the dividing line, e.g. $(0, 1), (0, 2), \dots, (0, n)$ (break the x-ties consistently). Then every point is in the strip at every level, and the all-pairs combine costs $\Theta(n^2)$ at the root alone: $T(n) = 2T(n/2) + \Theta(n^2) = \Theta(n^2)$.

**(c)** $T(n) = 2T(n/2) + O(n\log n)$. Level i sums to $n\lg(n/2^i)$; summing gives $\Theta(n\log^2 n)$ (in the worst case, when the strip has $\Theta(n)$ points).

**(d)** Sort the points by x once ($O(n\log n)$). Let each recursive call also return its points **sorted by y**, obtained by merging the two y-sorted lists of its children in O(n). Then the strip (in y-order) is extracted by one linear scan, and the 7-neighbor check is O(n). So $T(n) = 2T(n/2) + O(n) = O(n\log n)$, plus the initial sort: $O(n\log n)$ overall.`,
    },
    {
      id: 'divide-majority-code', type: 'code', title: 'Majority element by divide and conquer', difficulty: 2,
      prompt: String.raw`Write <code>majority(A)</code> that returns the element occurring **more than** <code>A.length / 2</code> times in the array A of integers, or <code>null</code> if there is none (including for the empty array). Use the divide-and-conquer idea: a majority of A must be a majority of one of the halves, so recursively get a candidate from each half and verify the candidates by counting. Only use equality comparisons between elements. Target $O(n\log n)$ time.`,
      fn: 'majority',
      starter: 'function majority(A) {\n  // return the element occurring more than A.length/2 times, or null\n}\n',
      reference: function (A) {
        const cnt = {};
        for (const x of A) {
          cnt[x] = (cnt[x] || 0) + 1;
          if (2 * cnt[x] > A.length) return x;
        }
        return null;
      },
      tests: [[[3, 1, 3, 3, 2]], [[]], [[7]], [[1, 2]], [[2, 2]], [[1, 1, 2, 3]], [[4, 4, 5, 5, 4]], [[1, 2, 3, 4, 5, 6]], [[0, 0, 0, 1, 1, 1]]],
      gen: () => {
        const n = Math.floor(Math.random() * 16);
        const A = Array.from({ length: n }, () => Math.floor(Math.random() * 4));
        if (n && Math.random() < 0.5) { const v = Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) if (Math.random() < 0.6) A[i] = v; }
        return [A];
      },
      hints: ['Write a helper rec(lo, hi) that returns the majority of A[lo..hi-1] or null.', 'For each non-null candidate of the two halves, count its occurrences in the whole range [lo, hi).'],
      solution: String.raw`~~~js
function majority(A) {
  function rec(lo, hi) {                  // majority of A[lo..hi-1], or null
    if (hi - lo === 1) return A[lo];
    const m = Math.floor((lo + hi) / 2);
    for (const c of [rec(lo, m), rec(m, hi)]) {
      if (c === null) continue;
      let k = 0;
      for (let i = lo; i < hi; i++) if (A[i] === c) k++;
      if (2 * k > hi - lo) return c;
    }
    return null;
  }
  return A.length ? rec(0, A.length) : null;
}
~~~
Lemma: if c is a majority of A[lo..hi−1], it is a majority of one half (otherwise it occurs at most half of the time in each half, hence at most half overall). So checking the two candidates suffices. $T(n) = 2T(n/2) + O(n) = O(n\log n)$. (Boyer–Moore voting does it in O(n), but it is not D&C.)`,
    },
    {
      id: 'divide-skyline-code', type: 'code', title: 'Compute a skyline', difficulty: 3,
      prompt: String.raw`Write <code>skyline(B)</code>. Each building is <code>[l, r, h]</code> with integers $0 \le l < r$ and $h \ge 1$, covering the half-open interval $[l, r)$ at height h. Return the skyline as an array of key points <code>[x, y]</code> sorted by x, meaning "from x on, the outline has height y", with no two consecutive points of equal height, starting with the first point where the height becomes positive and ending with a point of height 0. Return <code>[]</code> for no buildings. Example: <code>[[2,9,10],[3,7,15],[5,12,12]]</code> gives <code>[[2,10],[3,15],[7,12],[12,0]]</code>. Use divide and conquer (split the buildings, merge the two skylines) for $O(n\log n)$.`,
      fn: 'skyline',
      starter: 'function skyline(B) {\n  // B is an array of [l, r, h]; return the list of [x, height] key points\n}\n',
      reference: function (B) {
        const xs = [];
        for (const b of B) { xs.push(b[0]); xs.push(b[1]); }
        const X = Array.from(new Set(xs)).sort((p, q) => p - q);
        const out = [];
        let prev = 0;
        for (const x of X) {
          let h = 0;
          for (const b of B) if (b[0] <= x && x < b[1] && b[2] > h) h = b[2];
          if (h !== prev) { out.push([x, h]); prev = h; }
        }
        return out;
      },
      tests: [[[[2, 9, 10], [3, 7, 15], [5, 12, 12]]], [[]], [[[1, 4, 3]]], [[[1, 3, 5], [3, 6, 5]]], [[[0, 10, 4], [2, 5, 2]]], [[[2, 9, 10], [3, 7, 15], [5, 12, 12], [15, 20, 10], [19, 24, 8]]], [[[1, 2, 1], [4, 5, 1]]], [[[1, 5, 3], [1, 5, 7], [2, 3, 7]]]],
      gen: () => {
        const n = Math.floor(Math.random() * 9);
        return [Array.from({ length: n }, () => { const l = Math.floor(Math.random() * 21); return [l, l + 1 + Math.floor(Math.random() * 8), 1 + Math.floor(Math.random() * 10)]; })];
      },
      hints: ['Base case: one building [l, r, h] has skyline [[l, h], [r, 0]].', 'Merge two skylines by walking both lists in x-order, tracking the latest height of each; when several points share an x, process all of them before emitting.', 'Emit [x, max(h1, h2)] only when this maximum differs from the last emitted height (treat "nothing emitted yet" as height 0).'],
      solution: String.raw`~~~js
function skyline(B) {
  if (B.length === 0) return [];
  if (B.length === 1) return [[B[0][0], B[0][2]], [B[0][1], 0]];
  const m = Math.floor(B.length / 2);
  const L = skyline(B.slice(0, m)), R = skyline(B.slice(m));
  const out = [];
  let i = 0, j = 0, h1 = 0, h2 = 0;
  while (i < L.length || j < R.length) {
    let x;
    if (j >= R.length || (i < L.length && L[i][0] < R[j][0])) { x = L[i][0]; h1 = L[i][1]; i++; }
    else if (i >= L.length || R[j][0] < L[i][0]) { x = R[j][0]; h2 = R[j][1]; j++; }
    else { x = L[i][0]; h1 = L[i][1]; h2 = R[j][1]; i++; j++; }   // same x in both
    const y = Math.max(h1, h2);
    const last = out.length ? out[out.length - 1][1] : 0;
    if (y !== last) out.push([x, y]);
  }
  return out;
}
~~~
The merged height at x is the max of the two heights, and it can only change at key points of either list, so this emits exactly the key points (proof as in the written skyline problem). Each skyline of k buildings has at most 2k points, the merge is linear, and $T(n) = 2T(n/2) + O(n) = O(n\log n)$. (Slicing B costs O(n) per call, which does not change the recurrence.)`,
    },
    {
      id: 'divide-polymul-code', type: 'code', title: 'Karatsuba polynomial multiplication', difficulty: 2,
      prompt: String.raw`Write <code>polyMultiply(P, Q)</code>: P and Q are arrays of integer coefficients, lowest degree first (<code>[1, 2]</code> is $1 + 2x$). Return the coefficient array of the product, of length <code>P.length + Q.length - 1</code>, or <code>[]</code> if either input is empty. Implement Karatsuba's method: pad both to the same length n, split at $m = \lfloor n/2\rfloor$, make three recursive products $Z_0 = P_0Q_0$, $Z_2 = P_1Q_1$, $Z_1 = (P_0 + P_1)(Q_0 + Q_1)$, and assemble $Z_0 + x^m(Z_1 - Z_0 - Z_2) + x^{2m}Z_2$. Use the schoolbook method for tiny inputs.`,
      fn: 'polyMultiply',
      starter: 'function polyMultiply(P, Q) {\n  // coefficient arrays, lowest degree first; return the product\'s coefficients\n}\n',
      reference: function (P, Q) {
        if (!P.length || !Q.length) return [];
        const R = new Array(P.length + Q.length - 1).fill(0);
        for (let i = 0; i < P.length; i++) for (let j = 0; j < Q.length; j++) R[i + j] += P[i] * Q[j];
        return R;
      },
      tests: [[[1, 2], [3, 4]], [[1, 2, 3, 4], [5, 6, 7, 8]], [[1, -1, 2, 3], [2, 1, -1, 4]], [[], [1, 2]], [[5], [7]], [[1, 0, 0, 1], [1, 1]], [[2, -3, 0, 4, 1, -1, 2], [3, 3, -2, 1, 0, 5]]],
      gen: () => {
        const r = () => Array.from({ length: Math.floor(Math.random() * 13) }, () => Math.floor(Math.random() * 19) - 9);
        return [r(), r()];
      },
      hints: ['Pad the shorter array with zeros so both have length n; at the end, cut the result to P.length + Q.length − 1 entries.', 'Base case: if n ≤ 2 (or some small constant), multiply directly with two nested loops.', String.raw`Add $Z_0$ at offset 0, $Z_1 - Z_0 - Z_2$ at offset m, and $Z_2$ at offset 2m.`],
      solution: String.raw`~~~js
function polyMultiply(P, Q) {
  if (!P.length || !Q.length) return [];
  const n = Math.max(P.length, Q.length);
  if (n <= 2) {                                   // schoolbook base case
    const R = new Array(P.length + Q.length - 1).fill(0);
    for (let i = 0; i < P.length; i++) for (let j = 0; j < Q.length; j++) R[i + j] += P[i] * Q[j];
    return R;
  }
  const pad = X => X.concat(new Array(n - X.length).fill(0));
  const p = pad(P), q = pad(Q), m = Math.floor(n / 2);
  const add = (a, b) => a.map((v, i) => v + (b[i] || 0));   // a is the longer one
  const p0 = p.slice(0, m), p1 = p.slice(m), q0 = q.slice(0, m), q1 = q.slice(m);
  const z0 = polyMultiply(p0, q0), z2 = polyMultiply(p1, q1);
  const z1 = polyMultiply(add(p1, p0), add(q1, q0));
  const res = new Array(2 * n - 1).fill(0);
  z0.forEach((v, i) => { res[i] += v; res[i + m] -= v; });
  z2.forEach((v, i) => { res[i + 2 * m] += v; res[i + m] -= v; });
  z1.forEach((v, i) => { res[i + m] += v; });
  return res.slice(0, P.length + Q.length - 1);
}
~~~
The high halves have $n - m \ge m$ coefficients, so <code>add(p1, p0)</code> adds the shorter low half into the high half. Correctness is the identity $P_0Q_1 + P_1Q_0 = Z_1 - Z_0 - Z_2$; the time is $T(n) = 3T(n/2) + O(n) = O(n^{\lg 3})$.`,
    },
    {
      id: 'divide-closest-pair-code', type: 'code', title: 'Closest pair of points', difficulty: 3,
      prompt: String.raw`Write <code>closestPair(P)</code>: P is an array of at least 2 points <code>[x, y]</code> with integer coordinates (points may coincide). Return the **squared** Euclidean distance of the closest pair (an integer, so no floating-point issues). Implement the $O(n\log n)$ divide-and-conquer algorithm: sort by x, split at the middle, recurse, then check the strip around the dividing line in y-order, comparing each strip point only with the next few points.`,
      fn: 'closestPair',
      starter: 'function closestPair(P) {\n  // return the smallest squared distance between two of the points\n}\n',
      reference: function (P) {
        let best = Infinity;
        for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
          const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1];
          if (dx * dx + dy * dy < best) best = dx * dx + dy * dy;
        }
        return best;
      },
      tests: [[[[0, 0], [3, 4]]], [[[0, 0], [10, 10], [1, 1], [11, 12]]], [[[5, 5], [5, 5], [0, 0]]], [[[0, 0], [0, 3], [0, 7], [0, 8]]], [[[-4, 2], [3, -1], [0, 0], [1, 5], [-2, -3], [4, 4], [2, 2]]], [[[0, 0], [1, 100], [2, 0], [3, 100], [4, 0]]]],
      gen: () => {
        const n = 2 + Math.floor(Math.random() * 60);
        const W = 5 + Math.floor(Math.random() * 100);
        return [Array.from({ length: n }, () => [Math.floor(Math.random() * (2 * W + 1)) - W, Math.floor(Math.random() * (2 * W + 1)) - W])];
      },
      hints: ['Keep squared distances throughout; compare (x − xmid)² with the current best d to decide strip membership.', 'Have the recursion return the points of its range sorted by y, merging the children\'s lists.', 'In the strip, for each point stop scanning once the y-difference squared is at least d (or after 7 points).'],
      solution: String.raw`~~~js
function closestPair(P) {
  const px = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  function rec(lo, hi) {                 // returns [best squared distance, points sorted by y]
    if (hi - lo <= 3) {
      let best = Infinity;
      for (let i = lo; i < hi; i++) for (let j = i + 1; j < hi; j++) best = Math.min(best, d2(px[i], px[j]));
      return [best, px.slice(lo, hi).sort((a, b) => a[1] - b[1])];
    }
    const mid = Math.floor((lo + hi) / 2), xm = px[mid][0];
    const [b1, Y1] = rec(lo, mid), [b2, Y2] = rec(mid, hi);
    let d = Math.min(b1, b2);
    const Y = [];                         // merge by y
    let i = 0, j = 0;
    while (i < Y1.length || j < Y2.length)
      Y.push(j >= Y2.length || (i < Y1.length && Y1[i][1] <= Y2[j][1]) ? Y1[i++] : Y2[j++]);
    const S = Y.filter(p => (p[0] - xm) ** 2 < d);
    for (let a = 0; a < S.length; a++)
      for (let b = a + 1; b < S.length && (S[b][1] - S[a][1]) ** 2 < d; b++)
        d = Math.min(d, d2(S[a], S[b]));
    return [d, Y];
  }
  return rec(0, px.length)[0];
}
~~~
The inner loop stops once the y-gap reaches $\sqrt d$; by the packing lemma it runs at most 7 times per point. With y-lists merged rather than re-sorted, $T(n) = 2T(n/2) + O(n) = O(n\log n)$.`,
    },
    {
      id: 'divide-smaller-right-code', type: 'code', title: 'Count smaller elements to the right', difficulty: 3,
      prompt: String.raw`Write <code>countSmallerRight(A)</code> returning an array C of the same length where <code>C[i]</code> is the number of indices $j > i$ with $A[j] < A[i]$ (strictly smaller). For example <code>[5, 2, 6, 1]</code> gives <code>[2, 1, 1, 0]</code>. The sum of C is the inversion count. Achieve $O(n\log n)$ by mergesorting **indices**: when an element of the left half is output during a merge, every right-half element already output is smaller than it and lies to its right.`,
      fn: 'countSmallerRight',
      starter: 'function countSmallerRight(A) {\n  // C[i] = number of j > i with A[j] < A[i]\n}\n',
      reference: function (A) {
        return A.map((x, i) => { let c = 0; for (let j = i + 1; j < A.length; j++) if (A[j] < x) c++; return c; });
      },
      tests: [[[5, 2, 6, 1]], [[]], [[1]], [[1, 2, 3]], [[3, 2, 1]], [[2, 2, 2]], [[3, 1, 2, 3, 1, 0]]],
      gen: () => [Array.from({ length: Math.floor(Math.random() * 16) }, () => Math.floor(Math.random() * 10))],
      hints: ['Sort an array of indices by value with mergesort, keeping a counts array C indexed by original position.', 'During a merge, keep j = number of right-half elements already output. When you output a left-half index i, add j to C[i].', 'To count strictly smaller elements only, output the left element first on ties (compare with ≤).'],
      solution: String.raw`~~~js
function countSmallerRight(A) {
  const C = new Array(A.length).fill(0);
  function sort(idx) {                     // mergesort an array of indices by value
    if (idx.length <= 1) return idx;
    const m = Math.floor(idx.length / 2);
    const L = sort(idx.slice(0, m)), R = sort(idx.slice(m));
    const out = [];
    let i = 0, j = 0;
    while (i < L.length || j < R.length) {
      if (j >= R.length || (i < L.length && A[L[i]] <= A[R[j]])) { C[L[i]] += j; out.push(L[i++]); }
      else out.push(R[j++]);
    }
    return out;
  }
  sort(A.map((_, i) => i));
  return C;
}
~~~
When left index L[i] is output, the j right-half elements output before it are exactly the right-half elements with value $< A[L[i]]$ (ties go left first), and all of them are to its right. Pairs inside a half are counted by the recursive calls. $T(n) = 2T(n/2) + O(n) = O(n\log n)$.`,
    },
    {
      id: 'divide-rotated-search-code', type: 'code', title: 'Search in a rotated sorted array', difficulty: 2,
      prompt: String.raw`An array of **distinct** integers was sorted in increasing order and then rotated by an unknown amount (e.g. <code>[15, 22, 31, 2, 5, 9]</code>). Write <code>searchRotated(A, x)</code> that returns the index of x in A, or −1 if x is absent, using $O(\log n)$ comparisons. (A may be empty or unrotated.)`,
      fn: 'searchRotated',
      starter: 'function searchRotated(A, x) {\n  // return the index of x in the rotated sorted array A, or -1\n}\n',
      reference: function (A, x) { return A.indexOf(x); },
      tests: [[[15, 22, 31, 2, 5, 9], 5], [[15, 22, 31, 2, 5, 9], 15], [[15, 22, 31, 2, 5, 9], 9], [[15, 22, 31, 2, 5, 9], 10], [[], 3], [[1, 2, 3, 4, 5], 4], [[7], 7], [[7], 8], [[3, 1], 1], [[5, 6, 7, 1, 2], 7]],
      gen: () => {
        const n = Math.floor(Math.random() * 13);
        const s = new Set();
        while (s.size < n) s.add(Math.floor(Math.random() * 41) - 20);
        const S = Array.from(s).sort((a, b) => a - b);
        const r = n ? Math.floor(Math.random() * n) : 0;
        const A = S.slice(r).concat(S.slice(0, r));
        const x = (n && Math.random() < 0.7) ? A[Math.floor(Math.random() * n)] : Math.floor(Math.random() * 43) - 21;
        return [A, x];
      },
      hints: ['In any range [lo, hi], at least one of the halves [lo, mid] and [mid, hi] is sorted. Which one? Compare A[lo] with A[mid].', 'If the sorted half contains x by its endpoint values, keep it; otherwise keep the other half.'],
      solution: String.raw`~~~js
function searchRotated(A, x) {
  let lo = 0, hi = A.length - 1;           // invariant: if x is in A, it is in A[lo..hi]
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (A[mid] === x) return mid;
    if (A[lo] <= A[mid]) {                 // A[lo..mid] is sorted
      if (A[lo] <= x && x < A[mid]) hi = mid - 1; else lo = mid + 1;
    } else {                               // A[mid..hi] is sorted
      if (A[mid] < x && x <= A[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
}
~~~
A range of a rotated sorted array contains at most one "drop", so one of the two halves around mid is sorted, and $A[lo] \le A[mid]$ identifies the left one. For the sorted half, x lies in it iff it is between its endpoint values; otherwise x can only be in the other half. Each step halves the range: $O(\log n)$.`,
    },
    {
      id: 'divide-second-largest', type: 'written', title: 'Second largest with n + ⌈lg n⌉ − 2 comparisons', difficulty: 3,
      prompt: String.raw`Given $n \ge 2$ distinct numbers, the obvious method finds the second largest with $2n - 3$ comparisons (find the max, then the max of the rest).

(a) Describe a recursive "tournament" algorithm that returns the maximum *together with* the list of elements that lost a comparison directly to the maximum, and show that it uses exactly n − 1 comparisons.
(b) Prove that this list has at most $\lceil\lg n\rceil$ elements, and that it contains the second-largest element.
(c) Conclude that the second largest can be found with at most $n + \lceil\lg n\rceil - 2$ comparisons, and state the running time of your algorithm.`,
      rubric: [
        String.raw`(a) A correct recursion returning (max, losers), with $C(n) = C(\lceil n/2\rceil) + C(\lfloor n/2\rfloor) + 1 = n - 1$`,
        String.raw`(b) An induction showing $|\text{losers}| \le \lceil\lg n\rceil$, using $\lceil\lg\lceil n/2\rceil\rceil = \lceil\lg n\rceil - 1$`,
        '(b) An argument that the second largest is compared with the maximum (in the smallest call containing both), so it is in the list',
        String.raw`(c) Total $(n - 1) + (\lceil\lg n\rceil - 1)$ comparisons, and O(n) time`,
      ],
      hints: ['Make each call return a pair: (winner, list of every element the winner beat directly).', 'Look at the smallest recursive call whose subarray contains both the maximum and the second largest. Who wins each half of that call?'],
      solution: String.raw`**(a)**
~~~pseudo
Tournament(A[1..n]):            // returns (max of A, list of elements that lost directly to it)
    if n = 1: return (A[1], [])
    m = ceil(n/2)
    (x, Lx) = Tournament(A[1..m])
    (y, Ly) = Tournament(A[m+1..n])
    if x > y: return (x, Lx + [y])     // 1 comparison
    else:     return (y, Ly + [x])

SecondLargest(A[1..n]):
    (x, L) = Tournament(A)
    return the maximum of L            // |L| - 1 comparisons
~~~
*Correctness of the max* is induction on n: the maximum of A is the larger of the maxima of the two halves. *Comparisons:* $C(1) = 0$ and $C(n) = C(\lceil n/2\rceil) + C(\lfloor n/2\rfloor) + 1$. By induction, $C(n) = (\lceil n/2\rceil - 1) + (\lfloor n/2\rfloor - 1) + 1 = n - 1$. (Directly: every comparison eliminates exactly one candidate for the maximum.)

**(b) Size of the list.** Let $\ell(n)$ be the largest possible list length. Then $\ell(1) = 0$, and the winner's list is its half's list plus one element, so $\ell(n) \le 1 + \ell(\lceil n/2\rceil)$, using the larger half. For $n \ge 2$, $\lceil\lg\lceil n/2\rceil\rceil = \lceil\lg n\rceil - 1$, so by induction $\ell(n) \le 1 + \lceil\lg n\rceil - 1 = \lceil\lg n\rceil$.

**The second largest is in the list.** Let x be the maximum and s the second largest. Consider the *smallest* recursive call whose subarray contains both. In that call they lie in different halves (otherwise a smaller call would contain both). In s's half every element other than s is smaller than s, because only x is larger. So s wins its half, x wins the other half, and they are compared: s is appended to x's list. From then on x wins every comparison, and its list is passed upward with only additions. So $s \in L$.

**(c)** The tournament uses n − 1 comparisons, and the maximum of L uses $|L| - 1 \le \lceil\lg n\rceil - 1$ more: at most $n + \lceil\lg n\rceil - 2$ in total. Time: with linked lists (O(1) append), $T(n) = 2T(n/2) + O(1) = O(n)$. Even if each combine step copies the list, the lists have $O(\log n)$ elements, so $T(n) = 2T(n/2) + O(\log n) = O(n)$. (This count is known to be optimal: no comparison algorithm can do better in the worst case.)`,
    },
    {
      id: 'divide-maxima', type: 'written', title: 'Maximal points in the plane', difficulty: 3,
      prompt: String.raw`A point $(x, y)$ **dominates** $(x', y')$ if $x > x'$ and $y > y'$. You are given n points in the plane, with distinct x-coordinates and distinct y-coordinates. A point is **maximal** if no other point dominates it. Describe a divide-and-conquer algorithm that outputs all maximal points in $O(n\log n)$ time, prove it correct, and analyze it.`,
      rubric: [
        'Sort by x once, then split at the median x',
        'Lemma: a right-half point is maximal in the whole set iff it is maximal in the right half',
        'Lemma: a left-half point is maximal in the whole set iff it is maximal in the left half and lies above every right-half point',
        String.raw`Combine in O(n), recurrence $2T(n/2) + O(n)$, and total $O(n\log n)$ including the sort`,
      ],
      hints: ['After splitting by x, can a point of the left half ever dominate a point of the right half?', 'A left point is dominated by some right point exactly when it lies below the highest right point.'],
      solution: String.raw`**Algorithm.** Sort the points by x once, in $O(n\log n)$ time. Then:
~~~pseudo
Maxima(P[1..n]):                 // P sorted by x; returns the maximal points, sorted by x
    if n = 1: return P
    m = floor(n/2)
    ML = Maxima(P[1..m]);  MR = Maxima(P[m+1..n])
    top = max{ y : (x, y) in P[m+1..n] }        // O(n) scan (or the first point of MR)
    return [ p in ML with p.y > top ] followed by MR
~~~

**Correctness** (strong induction on n; base case n = 1 is trivial). Let L = P[1..m] and R = P[m+1..n]. Every point of R has a larger x than every point of L.
- *A point q of R* is maximal in P if and only if it is maximal in R: no point of L can dominate q, because a dominator needs a larger x.
- *A point p of L* is maximal in P if and only if (i) no point of L dominates it, i.e. p is maximal in L, and (ii) no point of R dominates it. Every point of R already has a larger x, so (ii) says every point of R has a smaller y, i.e. $p.y > top$.

By the inductive hypothesis ML and MR are correct, so the returned set is exactly the maximal points of P. Its order is by x, because ML comes before MR.

**Analysis.** The combine step scans R and filters ML: O(n). So $T(n) = 2T(n/2) + O(n) = O(n\log n)$, and the initial sort adds another $O(n\log n)$.

(Remark: sorted by x, the maximal points form a "staircase" with decreasing y, so after sorting, one right-to-left scan that keeps the running maximum y also works. The exam asked for divide and conquer, and both versions are dominated by the sort. In general, $\Omega(n\log n)$ comparisons are needed.)`,
    },
    {
      id: 'divide-sorted-matrix', type: 'written', title: 'Searching a sorted matrix', difficulty: 3,
      prompt: String.raw`An $n \times n$ matrix M of distinct numbers has every row increasing from left to right and every column increasing from top to bottom. We want to decide whether a given x appears in M.

(a) Analyze this algorithm. Compare x with the center entry. If they are equal, stop. If x is smaller, discard the bottom-right quadrant (which contains the center) and recurse on the other three quadrants; if x is larger, discard the top-left quadrant instead. Justify the discarding, write the recurrence, and solve it.
(b) Give an O(n)-time algorithm, and prove it correct.
(c) Prove that every algorithm must examine $\Omega(n)$ entries in the worst case.`,
      rubric: [
        '(a) The discarding is justified by row and column monotonicity',
        String.raw`(a) $T(n) = 3T(n/2) + O(1) = \Theta(n^{\lg 3})$`,
        '(b) The staircase search from the top-right corner, with the invariant "if x is in M, it is in rows r..n and columns 1..c"',
        '(b) The O(n) bound: each step removes a row or a column',
        String.raw`(c) An $\Omega(n)$ lower bound via the anti-diagonal construction (an adversary argument)`,
      ],
      hints: [String.raw`If $x < M[c][c]$, compare x with any entry $M[i][j]$ with $i \ge c$ and $j \ge c$.`, 'Start at the top-right corner. Each comparison there rules out a whole row or a whole column.', 'The anti-diagonal entries are not constrained by one another. Can you change one of them without breaking sortedness?'],
      solution: String.raw`**(a)** Let c be the center index. If $x < M[c][c]$, every entry $M[i][j]$ with $i \ge c$ and $j \ge c$ is reachable from $M[c][c]$ by moving right and down, so $M[i][j] \ge M[c][c] > x$, and the bottom-right quadrant cannot contain x. Symmetrically, if $x > M[c][c]$, the top-left quadrant is all at most $M[c][c] < x$. Each step therefore recurses on three quadrants of side about n/2, after O(1) work:
$$T(n) = 3T(n/2) + O(1).$$
The leaves dominate: $T(n) = \Theta(3^{\lg n}) = \Theta(n^{\lg 3}) \approx \Theta(n^{1.585})$. That is correct, but worse than linear.

**(b) Staircase search.**
~~~pseudo
r = 1; c = n
while r <= n and c >= 1:
    if M[r][c] = x: return FOUND
    if M[r][c] > x: c = c - 1      // column c, rows r..n, are all >= M[r][c] > x
    else:           r = r + 1      // row r, columns 1..c, are all <= M[r][c] < x
return NOT FOUND
~~~
*Invariant:* if x is in M, it is in the submatrix of rows r..n and columns 1..c. It holds initially. If $M[r][c] > x$, every remaining entry of column c lies below $M[r][c]$, so it is larger than x and the column can go. If $M[r][c] < x$, every remaining entry of row r lies left of $M[r][c]$, so it is smaller than x and the row can go. When the submatrix becomes empty, x is not present. Each iteration removes a row or a column, so there are at most 2n − 1 iterations: O(n).

**(c) Lower bound.** Index from 1. For $i + j \ne n + 1$, set $M[i][j] = 4n(i+j) + i$; on the anti-diagonal ($i + j = n + 1$), set $M[i][j] = 4n(n+1) + i$. The rows and columns increase and all entries are distinct. Let $x = 4n(n+1) + 2n$, which does not appear. Each anti-diagonal cell $(i, n+1-i)$ can be changed to x without breaking sortedness: its left and upper neighbors are at most $4n^2 + n < x$, and its right and lower neighbors are at least $4n^2 + 8n + 1 > x$. The anti-diagonal cells are in different rows and columns, so changing one does not affect the others.

Now run any deterministic algorithm on this matrix. If it examines fewer than n anti-diagonal cells, some anti-diagonal cell is never examined. Put x in that cell: the algorithm sees exactly the same values, makes the same probes, and gives the same answer. But x is absent from one matrix and present in the other, so the algorithm is wrong on one of them. Hence every correct algorithm examines at least n entries in the worst case, and the staircase search is optimal up to a constant factor. The three-quadrant divide and conquer is not.`,
    },
    {
      id: 'divide-bug-hunt', type: 'written', title: 'Divide-and-conquer bug hunt', difficulty: 2,
      prompt: String.raw`Each algorithm below is wrong. For each, give a smallest (or very small) input on which it fails, explain what goes wrong, and give a corrected algorithm with its running time.

(a) Maximum-sum contiguous subarray:
~~~pseudo
MaxSub(A[1..n]):
    if n = 1: return A[1]
    m = floor(n/2)
    return max(MaxSub(A[1..m]), MaxSub(A[m+1..n]))
~~~
(b) Majority element (equality tests only):
~~~pseudo
Maj(A[1..n]):                  // should return the element occurring > n/2 times, or NONE
    if n = 1: return A[1]
    m = floor(n/2)
    a = Maj(A[1..m]);  b = Maj(A[m+1..n])
    if a != NONE: return a
    else:         return b
~~~
(c) Selection:
~~~pseudo
Select(A[1..n], k):            // should return the k-th smallest element
    if n = 1: return A[1]
    r = Partition(A, A[1])     // pivot A[1] ends at index r
    if k = r: return A[r]
    if k < r: return Select(A[1..r-1], k)
    else:     return Select(A[r+1..n], k)
~~~
(d) Closest pair: split the points at the median x-coordinate, recurse on both halves, and return $\min(\delta_L, \delta_R)$.`,
      rubric: [
        '(a) Counterexample such as [1, 1]; fix with the crossing case (best suffix + best prefix): O(n log n), or O(n) with a strengthened recursion',
        '(b) Counterexample such as [1, 2, 2, 2] (returns 1) or [1, 1, 2, 3] (no majority); fix by counting both candidates: O(n log n)',
        '(c) Counterexample such as [1, 2, 3] with k = 2; fix by recursing with k − r',
        '(d) Counterexample with the closest pair straddling the line; fix with the 2δ strip and the 7-neighbor scan: O(n log n)',
      ],
      hints: ['Try arrays of length 2, 3 and 4 first.', 'For (c), trace the ranks: after recursing into A[r+1..n], what rank does the answer have within the subarray?'],
      solution: String.raw`**(a)** On [1, 1], each half returns 1, so the algorithm returns 1, but the whole array sums to 2. *Bug:* the best subarray can cross the middle. *Fix:* also compute the best crossing subarray, which is (the best suffix sum of the left half) + (the best prefix sum of the right half), found by two O(n) scans outward from the middle. Return the maximum of the three. $T(n) = 2T(n/2) + O(n) = O(n\log n)$. Returning (total, best prefix, best suffix, best) from each call makes the combine step O(1), for O(n) total.

**(b)** On [1, 2, 2, 2]: Maj([1, 2]) calls Maj([1]) = 1, so it returns 1; then the top level also returns 1, but the majority is 2. On [1, 1, 2, 3] it returns 1, which occurs only twice out of four, so it is no majority. *Bug:* the lemma only says that a majority of A is a majority of *some* half. A majority of a half need not be a majority of A, and the base case of a half can even return a non-majority. *Fix:* compute both candidates a and b, count the occurrences of each in A[1..n] in O(n), and return whichever occurs more than n/2 times, or NONE. $T(n) = 2T(n/2) + O(n) = O(n\log n)$.

**(c)** On A = [1, 2, 3] with k = 2: the pivot 1 lands at r = 1 < k, so the algorithm calls Select([2, 3], 2). There the pivot 2 lands at r = 1 < 2, so it calls Select([3], 2), which returns 3. The correct answer is 2. *Bug:* the r elements A[1..r] are all smaller than the answer, so inside A[r+1..n] the answer has rank k − r, not k. *Fix:* return Select(A[r+1..n], k − r). (With the pivot A[1] the worst case is $\Theta(n^2)$; a random pivot gives expected O(n), and median of medians gives worst-case O(n).)

**(d)** Take the points (0, 0), (4, 0), (5, 0), (9, 0), split between x = 4 and x = 5. Then $\delta_L = \delta_R = 4$, but (4, 0) and (5, 0) are at distance 1. *Bug:* the closest pair can have one point on each side of the line. *Fix:* with $\delta = \min(\delta_L, \delta_R)$, collect the points within horizontal distance δ of the line, sort them by y (or keep them y-sorted by merging), and compare each one with the next 7 in y-order. $T(n) = 2T(n/2) + O(n) = O(n\log n)$ after presorting.

Common lesson: when a "divide and recurse" algorithm is wrong, the counterexample almost always has its answer *across* the split, or relies on information that a half cannot see.`,
    },
    {
      id: 'divide-frequent-sorted', type: 'written', title: 'Frequent values in a sorted array', difficulty: 2,
      prompt: String.raw`A[1..n] is sorted in nondecreasing order and may contain many duplicates.

(a) Given x, count the occurrences of x in $O(\log n)$ time.
(b) Find every value that occurs **more than n/4 times**, in $O(\log n)$ time. Prove that your algorithm cannot miss such a value.
(c) Generalize: find every value that occurs more than n/k times, in $O(k\log n)$ time.`,
      rubric: [
        '(a) Two binary searches (the first index ≥ x, and the first index > x), with invariants; the count is their difference',
        String.raw`(b) Probes the positions $g, 2g, 3g, 4g$ (those $\le n$), where $g = \lceil n/4\rceil$`,
        String.raw`(b) Proof: a value occurring more than n/4 times fills a contiguous block of at least g positions, which contains a multiple of g`,
        '(b) Each candidate is verified by counting: O(log n) total',
        String.raw`(c) Positions that are multiples of $\lceil n/k\rceil$: at most k candidates, $O(k\log n)$`,
      ],
      hints: ['In a sorted array, all copies of a value are contiguous.', String.raw`Any g consecutive integers contain exactly one multiple of g.`],
      solution: String.raw`**(a)** Let lb(x) be the smallest index i with $A[i] \ge x$, and ub(x) the smallest index i with $A[i] > x$ (n + 1 if there is none). Each is a binary search with the invariant "the predicate is false before lo and true from hi on", as in LowerBound. The occurrences of x are exactly the positions lb(x), ..., ub(x) − 1, so the count is ub(x) − lb(x). Two binary searches: $O(\log n)$.

**(b)** Let $g = \lceil n/4\rceil$. For each multiple p of g with $p \le n$ (that is, g, 2g, 3g, and 4g if it is at most n), let v = A[p], and count v with (a). Report v if its count exceeds n/4, skipping repeats.

*Why nothing is missed.* Suppose v occurs $L > n/4$ times. Since A is sorted, its copies fill a contiguous block of L positions inside [1, n]. L is an integer greater than n/4, so $L \ge \lfloor n/4\rfloor + 1 \ge \lceil n/4\rceil = g$. Any g consecutive integers contain a multiple of g, so the block contains some probed position p, and A[p] = v. So v is a candidate, and counting confirms it.

*Time.* At most 4 candidates, each needing $O(\log n)$: $O(\log n)$ total. (At most 3 values can qualify, since 4 of them would need more than n positions.)

**(c)** The same argument works with $g = \lceil n/k\rceil$: a value occurring more than n/k times fills at least g consecutive positions, which contain a multiple of g. There are at most $\lfloor n/g\rfloor \le k$ probed positions, each verified in $O(\log n)$: $O(k\log n)$ total. (For an *unsorted* array the problem needs $\Omega(n)$ time, since every entry must be read. Sortedness is what makes sublinear time possible.)`,
    },
    {
      id: 'divide-maxima-code', type: 'code', title: 'Maximal points', difficulty: 2,
      prompt: String.raw`Write <code>maximalPoints(P)</code>. P is an array of points <code>[x, y]</code> with distinct x-coordinates and distinct y-coordinates (P may be empty). A point is **maximal** if no other point has both a larger x and a larger y. Return the maximal points sorted by increasing x, as an array of <code>[x, y]</code> pairs. Do not modify P. Aim for $O(n\log n)$: sort by x, then use divide and conquer (or a scan).`,
      fn: 'maximalPoints',
      starter: 'function maximalPoints(P) {\n  // return the maximal points sorted by x\n}\n',
      reference: function (P) {
        const Q = P.map((p) => [p[0], p[1]]).sort((a, b) => a[0] - b[0]);
        const out = [];
        let best = -Infinity;
        for (let i = Q.length - 1; i >= 0; i--) {
          if (Q[i][1] > best) { out.push(Q[i]); best = Q[i][1]; }
        }
        return out.reverse();
      },
      tests: [[[[1, 5], [2, 3], [3, 4], [4, 1]]], [[]], [[[7, 7]]], [[[1, 1], [2, 2], [3, 3], [4, 4]]], [[[1, 4], [2, 3], [3, 2], [4, 1]]], [[[5, 2], [1, 9], [3, 6], [8, 0], [6, 7], [2, 1]]]],
      gen: () => {
        const n = Math.floor(Math.random() * 15);
        const pick = () => { const s = new Set(); while (s.size < n) s.add(Math.floor(Math.random() * 100)); return Array.from(s); };
        const xs = pick(), ys = pick();
        return [xs.map((x, i) => [x, ys[i]])];
      },
      hints: ['After splitting the x-sorted points in half, every point of the right half has a larger x than every point of the left half.', 'A left-half maximal point survives exactly when its y exceeds the largest y in the right half.'],
      solution: String.raw`~~~js
function maximalPoints(P) {
  const Q = P.map(p => [p[0], p[1]]).sort((a, b) => a[0] - b[0]);
  function rec(lo, hi) {                 // maximal points of Q[lo..hi-1], sorted by x
    if (hi - lo <= 1) return Q.slice(lo, hi);
    const mid = Math.floor((lo + hi) / 2);
    const L = rec(lo, mid), R = rec(mid, hi);
    let top = -Infinity;
    for (let i = mid; i < hi; i++) top = Math.max(top, Q[i][1]);
    return L.filter(p => p[1] > top).concat(R);
  }
  return rec(0, Q.length);
}
~~~
Right-half maxima stay maximal, because no left point has a larger x. A left-half maximum stays maximal exactly when no right point is higher. The combine step is O(n), so $T(n) = 2T(n/2) + O(n) = O(n\log n)$, plus the sort. An equivalent O(n) scan after sorting: walk from right to left, keeping the largest y seen so far, and output each point that beats it.`,
    },
    {
      id: 'divide-bitonic-code', type: 'code', title: 'Search in a bitonic array', difficulty: 2,
      prompt: String.raw`An array of **distinct** integers is **bitonic**: it strictly increases up to its maximum, then strictly decreases (either part may be empty, e.g. <code>[1, 4, 9, 7, 2]</code>, <code>[5, 3]</code> or <code>[2, 6]</code>). Write <code>searchBitonic(A, x)</code> returning the index of x in A, or −1 if x is absent, using $O(\log n)$ comparisons. A may be empty.`,
      fn: 'searchBitonic',
      starter: 'function searchBitonic(A, x) {\n  // return the index of x in the bitonic array A, or -1\n}\n',
      reference: function (A, x) { return A.indexOf(x); },
      tests: [[[1, 4, 9, 7, 2], 7], [[1, 4, 9, 7, 2], 1], [[1, 4, 9, 7, 2], 9], [[1, 4, 9, 7, 2], 5], [[], 3], [[5, 3], 3], [[2, 6], 2], [[8], 8], [[8], 1], [[1, 2, 3, 4, 5], 5], [[9, 7, 5, 3, 1], 9], [[-3, 0, 10, 4, -1, -8], -1]],
      gen: () => {
        const n = Math.floor(Math.random() * 14);
        const s = new Set();
        while (s.size < n) s.add(Math.floor(Math.random() * 61) - 30);
        const S = Array.from(s).sort((a, b) => a - b);
        const left = [], right = [];
        for (let i = 0; i < n - 1; i++) (Math.random() < 0.5 ? left : right).push(S[i]);
        const A = n ? left.concat([S[n - 1]], right.reverse()) : [];
        const x = (n && Math.random() < 0.7) ? A[Math.floor(Math.random() * n)] : Math.floor(Math.random() * 63) - 31;
        return [A, x];
      },
      hints: [String.raw`First find the peak: if $A[mid] < A[mid+1]$ the peak lies to the right of mid, otherwise at mid or to its left.`, 'Then do an ordinary binary search on the increasing part, and a reversed binary search on the decreasing part.'],
      solution: String.raw`~~~js
function searchBitonic(A, x) {
  const n = A.length;
  if (n === 0) return -1;
  let lo = 0, hi = n - 1;                    // invariant: the peak index is in [lo, hi]
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (A[mid] < A[mid + 1]) lo = mid + 1; else hi = mid;
  }
  const p = lo;
  let a = 0, b = p;                          // increasing part A[0..p]
  while (a <= b) {
    const m = Math.floor((a + b) / 2);
    if (A[m] === x) return m;
    if (A[m] < x) a = m + 1; else b = m - 1;
  }
  a = p + 1; b = n - 1;                      // decreasing part A[p+1..n-1]
  while (a <= b) {
    const m = Math.floor((a + b) / 2);
    if (A[m] === x) return m;
    if (A[m] > x) a = m + 1; else b = m - 1;
  }
  return -1;
}
~~~
**Peak search.** If $A[mid] < A[mid+1]$, then mid is on the strictly increasing side, so the peak is after mid. Otherwise $A[mid] > A[mid+1]$, so mid is the peak or lies on the decreasing side, and the peak is at most mid. The range strictly shrinks each time (mid < hi), so the search ends at the peak in $O(\log n)$ steps. Two more binary searches, one on each monotone side, also take $O(\log n)$: three binary searches in all.`,
    },
    {
      id: 'divide-mock1-subarray-sums', type: 'written', title: 'Counting subarrays with a large sum', difficulty: 3,
      tags: ['mt2-mock-1', 'divide-and-conquer', 'sort-and-count'],
      prompt: String.raw`You are given an array A[1..n] of integers, which may be negative, and an integer t. We want to count the pairs (i, j) with $1 \le i \le j \le n$ such that $A[i] + A[i+1] + \dots + A[j] \ge t$, i.e. the number of nonempty contiguous subarrays with sum at least t. Brute force takes $\Theta(n^2)$ time.

(a) Let $P[0] = 0$ and $P[k] = A[1] + \dots + A[k]$. Show that the answer equals the number of pairs $0 \le i < j \le n$ with $P[j] - P[i] \ge t$.
(b) If all entries were positive, a two-pointer (sliding-window) scan would solve the problem in O(n) time. Give a small example showing why that idea breaks when entries can be negative.
(c) Describe an $O(n\log n)$ divide-and-conquer algorithm that computes the count.
(d) Prove that your combine step counts exactly the right pairs.
(e) Give the recurrence for your algorithm's running time and solve it.`,
      rubric: [
        String.raw`(2 pts) (a) The bijection: subarray A[i+1..j] corresponds to the pair (i, j), with sum P[j] − P[i]`,
        String.raw`(1 pt) (b) A valid example where the valid right endpoints for a fixed left endpoint do not form a contiguous range (no monotonicity)`,
        String.raw`(3 pts) (c) Sort-and-count on P[0..n]: recurse on the halves, count crossing pairs with a forward-only pointer on the sorted halves, then merge`,
        String.raw`(2 pts) (d) Correctness: every left index precedes every right index, so sorting within the halves does not change the crossing pairs; the valid left values form a prefix that only grows as the right value increases; induction for the rest`,
        String.raw`(2 pts) (e) $T(N) = 2T(N/2) + O(N)$ with $N = n + 1$, so $O(n\log n)$ (plus O(n) for the prefix sums)`,
      ],
      hints: ['Once the condition is about two prefix sums, it compares "something at i" with "something at j", which is the shape sort-and-count handles.', String.raw`For the crossing count, sort both halves. For each right value b in increasing order, the left values a with $a \le b - t$ form a prefix of the sorted left half that only grows.`, 'Count before you merge, and pass index ranges rather than copies.'],
      solution: String.raw`**(a)** For $0 \le i < j \le n$, $P[j] - P[i] = A[i+1] + \dots + A[j]$. The map $(i, j) \mapsto$ subarray A[i+1..j] is a bijection between pairs $0 \le i < j \le n$ and nonempty subarrays (subarray A[a..b] comes from the pair (a − 1, b)). So the subarrays with sum at least t correspond exactly to the pairs with $P[j] - P[i] \ge t$.

**(b)** Take A = [3, −5, 3] and t = 3. For left endpoint 1, the subarray A[1..1] has sum 3 (valid), A[1..2] has sum −2 (invalid) and A[1..3] has sum 1 (invalid). Extending a window can make its sum smaller, so the valid right endpoints are not a suffix, and a pointer that only moves forward cannot track them. (The answer here is 2: A[1..1] and A[3..3].)

**(c)** Run a mergesort-style recursion on the array P[0..n] of n + 1 numbers. It sorts its range *and* returns the number of valid pairs inside that range.
~~~pseudo
Count(P[lo..hi]):        // sorts P[lo..hi]; returns #{(i,j) : lo <= i < j <= hi, P[j] - P[i] >= t}
    if lo >= hi: return 0
    mid = floor((lo + hi) / 2)
    c = Count(P[lo..mid]) + Count(P[mid+1..hi])     // both halves are now sorted
    p = lo
    for s = mid+1 to hi:                             // right values in increasing order
        while p <= mid and P[p] <= P[s] - t: p = p + 1
        c = c + (p - lo)                             // the left values P[lo..p-1] are all <= P[s] - t
    Merge(P[lo..mid], P[mid+1..hi])                  // standard linear merge
    return c
~~~
Compute P in O(n), then return Count(P[0..n]).

**(d)** The pairs counted inside a range split into three kinds: both indices in the left half, both in the right half, or i in the left half and j in the right half. The first two kinds are counted correctly by the recursive calls (strong induction on the range length; the base case of a single entry has no pairs). For the crossing kind, every left index is smaller than every right index, so the condition i < j holds automatically, and only the *multisets of values* on the two sides matter. Sorting each half permutes values only within that half, so it does not change the number of crossing pairs. For a right value b, the left values a with $b - a \ge t$ are those with $a \le b - t$. In the sorted left half these form a prefix P[lo..p−1]. As s advances, b increases, so b − t increases and the prefix can only grow. Therefore the pointer p never needs to move back, and the loop adds exactly the number of valid left partners for each right value. The merge then leaves the range sorted for the caller.

**(e)** With $N = n + 1$ entries, the counting loop moves p at most N/2 times in total and s exactly N/2 times, and the merge is linear. So $T(N) = 2T(N/2) + O(N) = O(N\log N) = O(n\log n)$, plus O(n) for the prefix sums.`,
    },
    {
      id: 'divide-mock2-weighted-median', type: 'written', title: 'Weighted median in linear time', difficulty: 3,
      tags: ['mt2-mock-2', 'selection', 'divide-and-conquer'],
      prompt: String.raw`You are given n distinct numbers $x_1, \dots, x_n$ with positive weights $w_1, \dots, w_n$, and $W = \sum_i w_i$. The **weighted median** is the element $x_k$ such that
$$\sum_{x_i < x_k} w_i < \frac W2 \qquad\text{and}\qquad \sum_{x_i \le x_k} w_i \ge \frac W2.$$
(With all weights equal, this is the ordinary lower median.)

(a) Give an $O(n\log n)$ algorithm, and explain why the weighted median exists and is unique.
(b) Give an algorithm that runs in O(n) time in the **worst case**. You may use a linear-time selection algorithm (median of medians) as a black box. *Suggestion:* solve the more general problem WSelect(S, τ), which returns the smallest element x of a set S whose cumulative weight $\sum_{y \in S,\, y \le x} w(y)$ is at least τ, for any $0 < \tau \le w(S)$.
(c) Prove your algorithm correct.
(d) Write the recurrence for its running time, solve it, and explain why the bound is worst-case rather than expected.`,
      rubric: [
        '(2 pts) (a) Sort, then scan the prefix weights; existence and uniqueness follow because the prefix weights increase strictly from w_(1) > 0 to W',
        '(4 pts) (b) WSelect: find the median m by selection, partition into L < m < R, compare w(L) and w(L) + w(m) with τ, then recurse into one side with the target adjusted',
        '(2 pts) (c) A case analysis (answer in L, the answer is m, or answer in R with target τ − w(L) − w(m)) with the inductive hypothesis, and a check that 0 < τ′ ≤ w(side)',
        String.raw`(2 pts) (d) $T(n) = T(n/2) + O(n) = O(n)$; worst case because the selection is deterministic and the side always has at most n/2 elements`,
      ],
      hints: ['The cumulative weight, in sorted order, of an element in the lower half is the same whether you measure it within the lower half or within the whole set.', String.raw`Partition around the true median. After computing w(L), you know whether the answer is below m, equal to m, or above m.`, String.raw`When you recurse into R, everything in L and m itself lies below, so subtract their weight from the target.`],
      solution: String.raw`**(a)** Sort the elements: $y_1 < y_2 < \dots < y_n$, with weights $v_1, \dots, v_n$. Let $C_j = v_1 + \dots + v_j$ be the prefix weights, so $C_0 = 0 < C_1 < \dots < C_n = W$; they increase strictly because the weights are positive. The definition says $C_{k-1} < W/2 \le C_k$, so $y_k$ is the *first* index whose prefix weight reaches W/2. Such an index exists because $C_n = W \ge W/2$, and it is unique because the prefix weights are strictly increasing. Algorithm: sort, then scan, accumulating weight until it reaches W/2. Time $O(n\log n)$.

**(b)**
~~~pseudo
WSelect(S, tau):        // 0 < tau <= w(S); returns the smallest x in S with w({y in S : y <= x}) >= tau
    if |S| = 1: return its element
    m = Select(S, ceil(|S|/2))           // the median, worst-case O(|S|) by median of medians
    L = {y in S : y < m};  R = {y in S : y > m}     // partition, O(|S|)
    wL = sum of the weights in L                     // O(|S|)
    if wL >= tau:              return WSelect(L, tau)
    else if wL + w(m) >= tau:  return m
    else:                      return WSelect(R, tau - wL - w(m))
~~~
The weighted median is WSelect({x_1, ..., x_n}, W/2).

**(c)** Strong induction on |S|. If |S| = 1, the only element has cumulative weight $w(S) \ge \tau$, so it is the answer. Otherwise, list S in sorted order: all of L, then m, then all of R. The cumulative weight of an element y of L, measured in S, equals its cumulative weight in L, because everything at most y lies in L.
- *If $w(L) \ge \tau$:* the largest element of L already has cumulative weight $w(L) \ge \tau$, so the answer is in L, and it is the smallest element of L whose cumulative weight within L is at least τ. That is WSelect(L, τ), which is correct by the hypothesis ($0 < \tau \le w(L)$ and |L| < |S|).
- *Else if $w(L) + w(m) \ge \tau$:* every element of L has cumulative weight at most $w(L) < \tau$, and m has cumulative weight $w(L) + w(m) \ge \tau$, so m is the answer.
- *Otherwise:* nothing in L, and not m, reaches τ. An element y of R has cumulative weight $w(L) + w(m) + (\text{its cumulative weight within } R)$, so we need the smallest y in R whose cumulative weight within R is at least $\tau' = \tau - w(L) - w(m)$. Here $\tau' > 0$ (because $w(L) + w(m) < \tau$) and $\tau' \le w(R)$ (because $\tau \le w(S) = w(L) + w(m) + w(R)$). So WSelect(R, τ′) is a valid call, correct by the hypothesis.

**(d)** Since m is the median, $|L| = \lceil n/2\rceil - 1$ and $|R| = \lfloor n/2\rfloor$, so the single recursive call has at most n/2 elements. Selection, partitioning and summing the weights are each O(n). So
$$T(n) \le T(n/2) + O(n) = O(n),$$
a decreasing geometric series dominated by its first term (about $2cn$). The bound is *worst-case* because median of medians is deterministic and always returns the true median, so the halving is guaranteed. With randomized quickselect in place of Select, the bound would hold only in expectation.

*Application (for fun):* placing a post office at position p to minimize $\sum_i w_i|p - x_i|$ is solved by p = the weighted median. Moving p past a point changes the cost at rate (weight on one side) − (weight on the other), and that rate changes sign exactly at the weighted median.`,
    },
    {
      id: 'divide-p1-closest', type: 'written', title: 'Practice Midterm 1 · Problem 5: Closest pair with black boxes', difficulty: 2,
      tags: ['mt2-practice-1', 'divide and conquer', 'closest pair'],
      prompt: String.raw`This problem asks you to design an algorithm to find the closest pair of points in a given set $P$ of $n$ points in the plane. Points in $P$ are represented by an array $P[1..n]$ of coordinate pairs; the coordinates of the $i$th point are $(P[i].x, P[i].y)$. The points are sorted by their $x$-coordinates, and all $x$- and $y$-coordinates are distinct. In particular, $P[i].x < P[i+1].x$ for every index $i$. Timothy has helpfully implemented a pair of subroutines for you.

- **IWalkTheLine$(P, a)$** computes the closest pair of points in a given $n$-point set $P$ that **cross** the vertical line $x = a$, in $O(n)$ time. Specifically, it returns the indices $i$ and $j$ of the closest pair of points such that $P[i].x \le a < P[j].x$.
- **Distance$(p, q)$** returns the Euclidean distance between two points $p$ and $q$, in $O(1)$ time.

Describe and analyze an algorithm to compute the Euclidean distance between the closest pair of points in $P$, using Timothy's subroutines as black boxes. (Do *not* try to implement Timothy's subroutines yourself!)

*From the official Fall 2026 Midterm 2 Practice 1.*`,
      rubric: [
        '(2 pts) Base case(s) for tiny inputs',
        '(3 pts) Split at the median x-coordinate and recurse on both halves',
        '(2 pts) Use IWalkTheLine on the current subarray to handle crossing pairs; return the minimum of the three',
        '(1 pt) Brief argument that every pair is counted in exactly one of the three cases',
        '(2 pts) Recurrence T(n) = 2T(n/2) + O(n) and its solution O(n log n)',
      ],
      hints: [
        String.raw`Every pair of points is either entirely left of a vertical line, entirely right of it, or crosses it.`,
        String.raw`Choose the line so that the two sides have equal size; the input is already sorted by $x$.`,
      ],
      checks: [
        { type: 'mc', q: String.raw`To split $P[lo..hi]$ with $m = \lfloor (lo + hi)/2 \rfloor$, which value of $a$ should you pass to IWalkTheLine?`, choices: [String.raw`$a = P[m].x$`, String.raw`$a = (P[lo].x + P[hi].x)/2$`, String.raw`$a = P[m].y$`, String.raw`$a = m$`], answer: 0,
          explain: String.raw`With $a = P[m].x$, the points with $x \le a$ are exactly $P[lo..m]$ and those with $x > a$ are exactly $P[m+1..hi]$, because the $x$-coordinates are sorted and distinct. So the crossing pairs are exactly the pairs with one point in each half. The midpoint of the $x$-range (option B) could put almost every point on one side, and then the recursion is no longer balanced.` },
        { type: 'mc', q: String.raw`What is the recurrence for the running time?`, choices: [String.raw`$T(n) = 2T(n/2) + O(n)$, so $O(n \log n)$`, String.raw`$T(n) = T(n/2) + O(n)$, so $O(n)$`, String.raw`$T(n) = 2T(n/2) + O(1)$, so $O(n)$`, String.raw`$T(n) = 2T(n/2) + O(n \log n)$, so $O(n \log^2 n)$`], answer: 0,
          explain: String.raw`Two recursive calls on halves, plus one $O(n)$ call to IWalkTheLine on the current subarray and $O(1)$ for Distance and the min. The points are already sorted, so there is no sorting cost inside the recursion.` },
        { type: 'tf', q: String.raw`It is fine to call IWalkTheLine on the whole original array $P[1..n]$ at every level of the recursion.`, answer: false,
          explain: String.raw`The answer would still be correct, but each call would cost $O(n)$ for the **whole** array. With $\Theta(n)$ recursive calls in total, that is $\Theta(n^2)$ time. Call it on the current subarray $P[lo..hi]$ so that the call costs $O(hi - lo + 1)$.` },
      ],
      solution: String.raw`**Algorithm.** Call $CP(1, n)$, where $CP(lo, hi)$ returns the smallest distance between two points of $P[lo..hi]$ ($\infty$ if there are fewer than two points):

~~~pseudo
CP(lo, hi):
    if hi - lo + 1 <= 3:
        return the minimum Distance over all pairs in P[lo..hi]    // infinity if fewer than 2 points
    m <- floor((lo + hi) / 2)
    dL <- CP(lo, m)
    dR <- CP(m + 1, hi)
    (i, j) <- IWalkTheLine(P[lo..hi], P[m].x)
    dX <- Distance(P[i], P[j])
    return min(dL, dR, dX)
~~~

**Correctness.** Let $a = P[m].x$. Because the $x$-coordinates are sorted and distinct, the points of $P[lo..hi]$ with $x \le a$ are exactly $P[lo..m]$, and those with $x > a$ are exactly $P[m+1..hi]$. So every pair of points in $P[lo..hi]$ falls into exactly one of three cases: both in the left half (found by $CP(lo, m)$, by induction), both in the right half (found by $CP(m+1, hi)$), or one on each side, which is exactly a pair crossing the line $x = a$ (found by IWalkTheLine). The minimum of the three is the closest pair overall. The base cases are checked directly.

**Time.** IWalkTheLine on $hi - lo + 1$ points costs $O(hi - lo + 1)$, and everything else outside the recursion costs $O(1)$:
$$T(n) = 2\,T(n/2) + O(n) \quad\Longrightarrow\quad T(n) = O(n \log n).$$

> **Exam tip.** The black box does the hard part (the strip argument). What you need to get right is that the line splits the current subarray exactly at index $m$, and that the black box runs on the subarray, not on all of $P$.`,
    },
    {
      id: 'divide-p2-mergek', type: 'written', title: 'Practice Midterm 2 · Problem 4: Merging k sorted arrays', difficulty: 2,
      tags: ['mt2-practice-2', 'divide and conquer', 'merging'],
      prompt: String.raw`Suppose you are given $k$ arrays $A_1[1..n], A_2[1..n], \dots, A_k[1..n]$, each with the same length $n$, and each sorted in increasing order. Describe an algorithm to merge the given arrays into a single sorted array. Analyze the running time of your algorithm as a function of $n$ and $k$.

*From the official Fall 2026 Midterm 2 Practice 2.*`,
      rubric: [
        '(4 pts) A correct algorithm that is faster than merging the arrays one at a time (e.g. pairwise divide and conquer, or a heap of the k fronts)',
        '(2 pts) Brief justification of correctness',
        '(2 pts) Recurrence or counting argument for the running time',
        '(2 pts) Correct bound O(nk log k)',
      ],
      hints: [
        String.raw`Merging two sorted arrays of total length $m$ takes $O(m)$ time. What does merging one array at a time cost?`,
        String.raw`Merge the first $k/2$ arrays recursively, merge the last $k/2$ recursively, then merge the two results.`,
      ],
      checks: [
        { type: 'mc', q: String.raw`Merging the arrays one at a time ($A_1$ with $A_2$, then the result with $A_3$, and so on) takes`, choices: [String.raw`$O(nk)$`, String.raw`$O(nk \log k)$`, String.raw`$O(nk^2)$`, String.raw`$O(n^2 k)$`], answer: 2,
          explain: String.raw`The $i$-th merge combines an array of length $(i-1)n$ with one of length $n$, costing $O(in)$. Summing over $i = 2..k$ gives $O(n k^2)$.` },
        { type: 'mc', q: String.raw`Divide and conquer: merge the first half of the arrays recursively, merge the second half recursively, then merge the two results. With $T(k)$ = the time for $k$ arrays of length $n$:`, choices: [String.raw`$T(k) = 2T(k/2) + O(nk)$, so $O(nk \log k)$`, String.raw`$T(k) = 2T(k/2) + O(n)$, so $O(nk)$`, String.raw`$T(k) = T(k/2) + O(nk)$, so $O(nk)$`, String.raw`$T(k) = 2T(k/2) + O(nk)$, so $O(nk^2)$`], answer: 0,
          explain: String.raw`The final merge combines two arrays of total length $nk$, which costs $O(nk)$. Each level of the recursion tree does $O(nk)$ work in total, and there are $\lg k$ levels.` },
        { type: 'tf', q: String.raw`Keeping the current front element of each array in a binary min-heap also merges in $O(nk \log k)$ time.`, answer: true,
          explain: String.raw`There are $nk$ output steps. Each one is an extract-min plus an insert of the next element from the same array, on a heap that never holds more than $k$ items: $O(\log k)$ per step.` },
      ],
      solution: String.raw`**Algorithm (divide and conquer).**

~~~pseudo
MergeAll(A_1, ..., A_k):
    if k = 1: return A_1
    L <- MergeAll(A_1, ..., A_{floor(k/2)})
    R <- MergeAll(A_{floor(k/2)+1}, ..., A_k)
    return Merge(L, R)            // the standard linear-time merge from mergesort
~~~

**Correctness.** By induction on $k$: the two recursive calls return sorted arrays containing exactly the elements of their halves, and Merge combines two sorted arrays into one sorted array containing all the elements of both.

**Time.** Let $T(k)$ be the time for $k$ arrays of length $n$. The final Merge handles $nk$ elements:
$$T(k) = 2\,T(k/2) + O(nk), \qquad T(1) = O(1).$$
Every level of the recursion tree merges all $nk$ elements once, so it costs $O(nk)$, and there are $\lceil \lg k \rceil$ levels. Total: **$O(nk \log k)$**.

**Alternative.** Keep a min-heap holding the current front element of each array. Repeatedly extract the minimum, append it to the output, and insert the next element from the same array. That is $nk$ steps at $O(\log k)$ each, for the same $O(nk \log k)$.

> **Warning.** Merging the arrays one at a time costs $\sum_{i=2}^{k} O(in) = O(nk^2)$. That is correct but slower, and on an exam it would get partial credit at best.`,
    },
    {
      id: 'divide-p3-parity', type: 'written', title: 'Practice Midterm 3 · Problem 4: The one even pair', difficulty: 2,
      tags: ['mt2-practice-3', 'binary search', 'divide and conquer'], code: 'divide-p3-parity-code',
      prompt: String.raw`Suppose you are given an array $A[1..n]$ of integers such that $A[i] + A[i+1]$ is even for *exactly one* index $i$. In other words, the elements of $A$ alternate between even and odd, except for exactly one adjacent pair that are either both even or both odd.

Describe and analyze an efficient algorithm to find the unique index $i$ such that $A[i] + A[i+1]$ is even. For example, given the following array as input, your algorithm should return the integer 6, because $A[6] + A[7] = 88 + 62$ is even.

| $i$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| $A[i]$ | 17 | **40** | 23 | **72** | 39 | **88** | **62** | 13 | **40** | 53 | **92** | 21 | **10** | 73 | **68** |

(Even entries are in bold.)

*From the official Fall 2026 Midterm 2 Practice 3.*`,
      rubric: [
        '(3 pts) Identify a property of each index that can be tested in O(1) and that changes exactly once, at the answer',
        '(3 pts) A correct binary search on that property (correct boundary handling)',
        '(2 pts) Correctness argument (the invariant)',
        '(2 pts) O(log n) running time with justification',
      ],
      hints: [
        String.raw`Before the bad pair, the parity of $A[j]$ is determined by the parity of $A[1]$ and of $j$. What happens after the bad pair?`,
        String.raw`Call index $j$ *on schedule* if $A[j] \equiv A[1] + (j - 1) \pmod 2$. Which indices are on schedule?`,
      ],
      checks: [
        { type: 'mc', q: String.raw`Call $j$ *on schedule* if $A[j] \equiv A[1] + (j-1) \pmod 2$. If the unique even pair is at index $i$, which indices are on schedule?`, choices: [String.raw`Exactly the indices $j \le i$`, String.raw`Exactly the indices $j \ge i$`, String.raw`Exactly the odd indices`, String.raw`All indices except $i$ and $i+1$`], answer: 0,
          explain: String.raw`Up to index $i$ the parities alternate, so $A[j]$ follows the schedule set by $A[1]$. At the pair $(i, i+1)$ the parity repeats instead of flipping, so from $i+1$ onward every element is exactly one step off schedule. The property is true, ..., true, false, ..., false, so it can be binary searched.` },
        { type: 'short', q: String.raw`For the 15-element example, which index does the algorithm return?`, answer: ['6'],
          explain: String.raw`$A[1] = 17$ is odd, so on schedule means odd at odd positions and even at even positions. $A[6] = 88$ is even at an even position (on schedule), but $A[7] = 62$ is even at an odd position (off schedule). The last on-schedule index is **6**.` },
        { type: 'mc', q: String.raw`The binary search runs in`, choices: [String.raw`$O(1)$`, String.raw`$O(\log n)$`, String.raw`$O(\sqrt n)$`, String.raw`$O(n)$`], answer: 1,
          explain: String.raw`Each step tests one index in $O(1)$ and halves the range: $T(n) = T(n/2) + O(1) = O(\log n)$. A linear scan would be $O(n)$, which works but misses the point of the question.` },
      ],
      solution: String.raw`**Key property.** Say index $j$ is *on schedule* if
$$A[j] \equiv A[1] + (j - 1) \pmod 2,$$
that is, $A[j]$ has the parity it would have if the whole array alternated perfectly starting from $A[1]$. Let $i$ be the answer. Then:

- for $j \le i$: the parities alternate from 1 up to $i$, so $j$ is on schedule;
- for $j \ge i + 1$: $A[i+1]$ has the **same** parity as $A[i]$ instead of the opposite one, and the parities alternate again after that, so every such $j$ is exactly one step off schedule.

So the on-schedule test reads true, ..., true, false, ..., false, and the answer $i$ is the **last** on-schedule index. (Index 1 is always on schedule, and index $n$ never is, because $i \le n - 1$.)

**Algorithm.** Binary search for the boundary.

~~~pseudo
FindEvenPair(A[1..n]):
    lo <- 1; hi <- n            // invariant: lo is on schedule, hi is not
    while hi - lo > 1:
        mid <- floor((lo + hi) / 2)
        if (A[mid] - A[1] - (mid - 1)) is even: lo <- mid
        else: hi <- mid
    return lo
~~~

**Correctness.** The invariant holds initially and is preserved by each step. When the loop ends, $hi = lo + 1$, with $lo$ on schedule and $lo + 1$ not, so $lo$ is the last on-schedule index, which is $i$.

**Time.** Each iteration halves $hi - lo$ and takes $O(1)$ time: **$O(\log n)$**.

**Example.** $A[1] = 17$ is odd, so position $j$ is on schedule when $A[j]$ is odd for odd $j$ and even for even $j$. Positions 1–6 are on schedule ($88$ is even at position 6); position 7 is not ($62$ is even at an odd position). The algorithm returns 6.`,
    },
    {
      id: 'divide-p3-parity-code', type: 'code', title: 'Practice 3 · The one even pair (code)', difficulty: 2,
      tags: ['mt2-practice-3', 'binary search'],
      prompt: String.raw`Implement the algorithm from [The one even pair](#/problem/divide-p3-parity).

<code>evenPair(A)</code> receives an array (0-indexed here) in which <code>A[i] + A[i+1]</code> is even for exactly one index. Return that index **using 1-based numbering**, as in the problem (so the handout example returns 6). Elements may be negative.

Use binary search: the grader can't measure your running time, so it is up to you to keep it $O(\log n)$. Note that in JavaScript, <code>-3 % 2</code> is <code>-1</code>.`,
      fn: 'evenPair',
      starter: 'function evenPair(A) {\n  // return the 1-based index i with A[i] + A[i+1] even\n}\n',
      reference: function (A) {
        const par = (x) => ((x % 2) + 2) % 2;
        const on = (j) => par(A[j - 1] - A[0] - (j - 1)) === 0;
        let lo = 1, hi = A.length;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (on(mid)) lo = mid; else hi = mid; }
        return lo;
      },
      tests: [
        [[17, 40, 23, 72, 39, 88, 62, 13, 40, 53, 92, 21, 10, 73, 68]],
        [[2, 4]],
        [[1, 3, 4]],
        [[-3, 2, -5, -7, 8]],
        [[0, 1, 2, 3, 4, 5, 7, 8, 9]],
      ],
      gen: () => {
        const n = 2 + Math.floor(Math.random() * 25), i = 1 + Math.floor(Math.random() * (n - 1));
        const A = []; let p = Math.random() < 0.5 ? 0 : 1;
        for (let j = 1; j <= n; j++) { A.push(2 * (Math.floor(Math.random() * 41) - 20) + p); if (j !== i) p ^= 1; }
        return [A];
      },
      hints: [String.raw`Keep the invariant "lo is on schedule, hi is not", starting from lo = 1, hi = n (1-based).`],
      solution: String.raw`~~~pseudo
function evenPair(A) {
  const par = (x) => ((x % 2) + 2) % 2;                      // parity that also works for negatives
  const on = (j) => par(A[j - 1] - A[0] - (j - 1)) === 0;    // is 1-based index j on schedule?
  let lo = 1, hi = A.length;                                  // lo on schedule, hi not
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (on(mid)) lo = mid; else hi = mid;
  }
  return lo;
}
~~~`,
    },
  ],
});
