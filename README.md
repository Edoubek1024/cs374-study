# CS 374 Study

A self-contained study platform for UIUC **CS 374: Introduction to Algorithms & Models of Computation**.

**To start:** double-click `index.html`. It opens in your browser. There is nothing to install and no server to run. You need an internet connection the first time so the math renderer (KaTeX) can load from a CDN. Without it, math shows as raw TeX.

## What's inside

**19 topics** that follow the course:

| Models of Computation | Algorithms |
|---|---|
| 1 Strings, languages & induction | 10 Recursion & recurrences |
| 2 Regular expressions | 11 Divide and conquer |
| 3 DFAs & the product construction | 12 Backtracking |
| 4 NFAs, Thompson & subset construction | 13 Dynamic programming I |
| 5 Closure properties | 14 Dynamic programming II |
| 6 Non-regularity (fooling sets) | 15 Graphs, BFS & DFS, modeling |
| 7 Context-free grammars | 16 DAGs, topological sort, SCCs |
| 8 Turing machines | 17 Shortest paths |
| 9 Undecidability & reductions | 18 Minimum spanning trees |
| | 19 P, NP & NP-hardness |

Each topic has five tabs:

- **Lesson:** a written lesson with worked examples. Some lessons embed live widgets: automata you can run strings through step by step, regex and grammar testers with parse trees, Turing-machine tape simulators, and graphs.
- **Quiz:** multiple-choice, true/false and short-answer questions. Each one explains why the answer is right. You can retry only the questions you missed.
- **Flashcards:** spaced repetition with Again / Hard / Good / Easy ratings. Cards come back just before you'd forget them.
- **Practice:** problems in two kinds.
  - *Auto-graded:* you type a DFA, NFA, regex, grammar, Turing machine or JavaScript function. When you're wrong, the grader shows the **shortest string your answer gets wrong** or the failing test case. Regular-language answers are checked for exact equivalence, not just against sample strings.
  - *Written, exam-style:* fooling-set proofs, DP recurrences, graph modeling, reductions and NP-hardness. You get a rubric, hints, a model solution and self-grading. A button copies a prompt you can paste into an AI tutor to have your answer graded.
- **Cheat sheet:** the key facts for the topic.

Lessons include **"try it first" worked examples**: the solution stays hidden until you click to reveal it. They also include **step-by-step walkthroughs** that show one step at a time.

**Other pages:**

- **Drills:** endless practice, randomly generated and checked instantly. There are 42 drill types, at least one for every topic. Examples:
  - run a DFA or NFA, do a subset construction, find the minimal DFA size;
  - decide regex membership or whether two regexes are equivalent; say whether a grammar generates a string; trace a Turing machine;
  - decide whether a language is regular, decidable, or one Rice's theorem applies to;
  - solve a recurrence with the Master theorem or another method, compare growth rates;
  - give an edit distance, LCS, LIS, knapsack, subset-sum, matrix-chain or palindrome-subsequence answer (the DP table is shown afterward);
  - give BFS distances, test bipartiteness, give DFS preorder or an edge type, give a topological order, count SCCs;
  - find a Dijkstra distance or extraction order, detect a negative cycle, find an MST weight or MST membership;
  - classify a problem as in P or NP-complete, pick the right reduction direction.

  You can filter drills by topic. Your accuracy is tracked per drill type.

- **Midterm 2:** a prep hub for topics 10–18. It has:
  - a countdown to your exam date and a readiness score;
  - a 25-question timed quiz and a random 5-problem set;
  - the three **official Fall 2026 practice midterms**. Every problem has a worked solution (the handouts came without an answer key) and **quick checks**: multiple-choice and short-answer questions with instant feedback. Algorithmic problems also have an auto-graded **code version**;
  - three full **mock midterms** (5 written problems each, with 10-point rubrics) and a 120-minute timer that stays on screen while you move between problems;
  - a per-topic checklist that links to each lesson's *Midterm 2 exam patterns* section;
  - a printable cheat sheet for Midterm 2 topics only.
- **Review:** flashcards due today, quiz questions you missed, and problems you should revisit.
- **Exam mode:** a timed, mixed-topic quiz with no feedback until you submit. It can also generate a practice problem set.
- **Lab:** sandboxes.
  - *Automata Lab:* run strings, do subset construction, minimize a DFA, convert a regex to an NFA, and check whether two machines are equivalent.
  - *Grammar Lab:* see parse trees and leftmost derivations.
  - *TM Lab*
  - *Graph Algorithms Lab:* BFS, DFS with edge types, topological sort, SCCs, Dijkstra, Bellman–Ford, DAG paths, Prim, Kruskal and Floyd–Warshall, step by step.
  - *DP Table Lab:* watch the table fill, with dependencies and the traceback highlighted.
  - *Recurrence Lab:* the Master theorem with recursion-tree reasoning, plus a numeric evaluator for checking a guessed bound.
- **Cheat sheet:** every topic's cheat sheet on one page, ready to print. It opens with a **symbol guide** that explains each piece of notation, including symbols whose meaning changes between topics (such as δ). Each topic's cheat sheet tab also has a "What do the symbols mean?" box. The guide lives in `js/core/notation.js`.
- **Progress:** mastery per topic. You can export or import your progress.

Progress is saved in your browser's local storage. Use **Progress → Export** to move it to another browser or computer.

**Keyboard shortcuts:**
- Quizzes: press `1`–`9` or `A`–`I` to pick a choice, `T`/`F` for true/false, and `Enter` to check.
- Flashcards: press `Space` to flip and `1`–`4` to rate.
- Problem editors: press `Ctrl+Enter` to check your answer.

## Answer formats (auto-graded problems)

```
# DFA / NFA
start: q0
accept: q2
q0 0 -> q1        # state symbol -> target   (q0 0,1 -> q1 for several symbols)
q1 eps -> q2      # ε-move (NFAs only); "q1 1 -> q0, q2" for several targets

# Regex (course notation)
(0+1)*00(0+1)*    # + is union, ε / eps, ∅, Σ = any symbol

# Grammar
S -> 0S1 | ε

# Turing machine
start: q0
accept: qa
reject: qr
blank: _
q0 0 -> q1 X R    # state read -> new-state write move(L/R/S)
```

Every problem page has a "Format help" link with these details.

## Adding or editing content

Content lives in `content/<topic>.js`. The file format is documented in [content/SPEC.md](content/SPEC.md).

After editing, run the validator. It checks structure and string escaping, and it checks that every auto-graded problem's sample answer agrees with the problem's reference predicate:

```
node tools/validate.js                 # all topics
node tools/validate.js content/dfa.js  # one topic
```

## Project layout

```
index.html          entry point
css/style.css       styles (light/dark)
js/core/            engines: markdown+math, automata, CFG (Earley), TM, grader, graph algorithms, DP tables
js/ui/              SVG drawing, interactive widgets, labs
js/app.js           router, progress store, pages
content/            one file per topic + SPEC.md
tools/validate.js   content validator (Node)
```

*This is an unofficial study aid. It is not affiliated with the University of Illinois or with course staff. Always check the current semester's course website for the exact syllabus and the course's own conventions.*
