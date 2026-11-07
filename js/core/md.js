/* Small markdown renderer with KaTeX math and interactive-widget fences. */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const WIDGETS = new Set(['automaton', 'regex', 'cfg', 'tm', 'graph']);
  const CALLOUTS = { definition: 'def', definitions: 'def', theorem: 'thm', lemma: 'thm', corollary: 'thm', claim: 'thm', 'key idea': 'key', 'key ideas': 'key', idea: 'key', intuition: 'key', example: 'ex', 'worked example': 'ex', warning: 'warn', caution: 'warn', 'common mistake': 'warn', 'common mistakes': 'warn', pitfall: 'warn', 'exam tip': 'tip', tip: 'tip', note: 'note', remark: 'note', proof: 'note' };

  function renderMath(tex, display) {
    if (root.katex) {
      try { return root.katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', trust: false }); }
      catch (e) { /* fall through */ }
    }
    return display ? `<div class="math-raw display">${esc(tex)}</div>` : `<span class="math-raw">${esc(tex)}</span>`;
  }

  function inline(text, store) {
    const ph = (html) => { store.push(html); return `\u0001${store.length - 1}\u0001`; };
    text = text.replace(/<code>([\s\S]*?)<\/code>/g, (m, c) => ph(`<code>${c}</code>`));
    text = text.replace(/\\\$/g, () => ph('$'));
    text = text.replace(/\$([^$\n]+?)\$/g, (m, t) => ph(renderMath(t, false)));
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);
    text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^*\w\\])\*([^*\s](?:[^*]*?[^*\s])?)\*(?![\w*])/g, '$1<em>$2</em>');
    return text;
  }
  function restore(html, store) {
    let prev;
    do { prev = html; html = html.replace(/\u0001(\d+)\u0001/g, (m, i) => store[+i]); } while (html !== prev);
    return html;
  }

  function render(src, opts = {}) {
    const store = [], blocks = [], headings = [];
    let text = String(src || '').replace(/\r\n?/g, '\n');
    text = text.replace(/^([ \t]*)(~{3,}|`{3,})[ \t]*([\w-]*)([^\n]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/gm, (m, ind, f, lang, title, body) => {
      const lines = body.replace(/\n$/, '').split('\n');
      const strip = ind.length ? lines.map((l) => (l.startsWith(ind) ? l.slice(ind.length) : l.replace(/^\s+/, ''))) : lines;
      blocks.push({ lang: (lang || '').toLowerCase(), title: (title || '').trim(), body: strip.join('\n') });
      return `${ind}\u0002${blocks.length - 1}\u0002`;
    });
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => { store.push(renderMath(t.trim(), true)); return `\u0001${store.length - 1}\u0001`; });
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, (m, t) => { store.push(renderMath(t.trim(), true)); return `\u0001${store.length - 1}\u0001`; });

    const isBlank = (l) => !l || !l.trim();
    const indentOf = (l) => l.match(/^\s*/)[0].length;
    const listRe = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
    const blockLine = /^\s*\u0002(\d+)\u0002\s*$/;
    const isTableStart = (L, i) => /^\s*\|/.test(L[i]) && i + 1 < L.length && /^\s*\|?\s*:?-{2,}/.test(L[i + 1]);
    const startsBlock = (L, i) => /^\s*(#{1,6})\s/.test(L[i]) || /^\s*>/.test(L[i]) || blockLine.test(L[i]) || /^\s*(---+)\s*$/.test(L[i]) || isTableStart(L, i);

    function renderBlock(bi) {
      const b = blocks[bi];
      const lang = b.lang === 'dfa' || b.lang === 'nfa' ? 'automaton' : b.lang;
      if (lang === 'reveal' || lang === 'solution' || lang === 'answer') {
        return `<details class="reveal"><summary>${inlineTitle(b.title || (lang === 'reveal' ? 'Show answer' : 'Show solution'))}</summary><div class="reveal-body">${render(b.body, opts).html}</div></details>`;
      }
      if (lang === 'steps') {
        const parts = b.body.split(/^\s*\+\+\+\s*$/m);
        return `<div class="widget steps-w" data-kind="steps">${b.title ? `<div class="steps-title">${inlineTitle(b.title)}</div>` : ''}${parts.map((x, i) => `<div class="step"><span class="step-no">Step ${i + 1}</span>${render(x, opts).html}</div>`).join('')}</div>`;
      }
      if (WIDGETS.has(lang) && opts.widgets !== false) return `<div class="widget" data-kind="${lang}" data-src="${esc(b.body)}"></div>`;
      return `<pre class="code${lang ? ' lang-' + lang : ''}"><code>${esc(b.body)}</code></pre>`;
    }

    function inlineTitle(t) { const st = []; return restore(inline(t, st), st); }

    function parseList(L, start) {
      const m0 = L[start].match(listRe);
      const base = m0[1].length, ordered = /\d/.test(m0[2]);
      const startNum = ordered ? parseInt(m0[2], 10) : 1;
      const items = [];
      let j = start;
      while (j < L.length) {
        const line = L[j];
        const m = line.match(listRe);
        const ind = indentOf(line);
        if (m && ind <= base + 1 && ind >= base && /\d/.test(m[2]) === ordered) { items.push({ text: [m[3]], sub: [] }); j++; continue; }
        if (m && ind > base + 1 && items.length) { const [h, nj] = parseList(L, j); items[items.length - 1].sub.push(h); j = nj; continue; }
        if (m) break; // different list type at same level
        if (isBlank(line)) {
          let k = j; while (k < L.length && isBlank(L[k])) k++;
          if (k >= L.length || !items.length) break;
          const m2 = L[k].match(listRe), ind2 = indentOf(L[k]);
          if (m2 && ind2 >= base && /\d/.test(m2[2]) === ordered) { j = k; continue; }
          if (m2 && ind2 > base + 1) { j = k; continue; }
          if (!m2 && ind2 > base) { // indented continuation paragraph(s)
            const chunk = []; while (k < L.length && (isBlank(L[k]) || indentOf(L[k]) > base)) { chunk.push(L[k]); k++; }
            const minInd = Math.min(...chunk.filter((x) => !isBlank(x)).map(indentOf));
            items[items.length - 1].sub.push(parseLines(chunk.map((x) => x.slice(Math.min(minInd, indentOf(x))))));
            j = k; continue;
          }
          break;
        }
        if (!items.length) break;
        if (blockLine.test(line)) { items[items.length - 1].sub.push(renderBlock(+line.match(blockLine)[1])); j++; continue; }
        if (ind > base || !startsBlock(L, j)) {
          if (items[items.length - 1].sub.length && ind > base) { // text after a nested element
            const chunk = []; while (j < L.length && !isBlank(L[j]) && indentOf(L[j]) > base && !listRe.test(L[j])) { chunk.push(L[j].trim()); j++; }
            items[items.length - 1].sub.push(`<p>${inline(chunk.join(' '), store)}</p>`); continue;
          }
          items[items.length - 1].text.push(line.trim()); j++; continue;
        }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      const attr = ordered && startNum !== 1 ? ` start="${startNum}"` : '';
      return [`<${tag}${attr}>` + items.map((it) => `<li>${inline(it.text.join(' '), store)}${it.sub.join('')}</li>`).join('') + `</${tag}>`, j];
    }

    function parseLines(L) {
      const out = [];
      let i = 0;
      while (i < L.length) {
        const line = L[i];
        if (isBlank(line)) { i++; continue; }
        let m;
        if ((m = line.match(blockLine))) { out.push(renderBlock(+m[1])); i++; continue; }
        if ((m = line.match(/^\s*(#{1,6})\s+(.*?)\s*#*\s*$/))) {
          const level = Math.min(6, m[1].length + (opts.shiftHeadings || 0));
          const html = inline(m[2], store);
          const id = 'h-' + m[2].toLowerCase().replace(/<[^>]+>|\$[^$]*\$/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
          if (m[1].length === 2) headings.push({ id, html });
          out.push(`<h${level} id="${id}">${html}</h${level}>`); i++; continue;
        }
        if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
        if (/^\s*>/.test(line)) {
          const inner = [];
          while (i < L.length && /^\s*>/.test(L[i])) { inner.push(L[i].replace(/^\s*>\s?/, '')); i++; }
          let cls = 'quote';
          const first = (inner[0] || '').match(/^\s*\*\*([^*]+?)\*\*/);
          if (first) {
            const k = first[1].trim().toLowerCase().replace(/[.:]+$/, '').replace(/\s*\(.*\)$/, '').trim();
            for (const key of Object.keys(CALLOUTS)) if (k === key || k.startsWith(key + ' ') || k.startsWith(key + ':')) { cls = 'callout ' + CALLOUTS[key]; break; }
          }
          out.push(`<blockquote class="${cls}">${parseLines(inner)}</blockquote>`);
          continue;
        }
        if (isTableStart(L, i)) {
          const row = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
          const head = row(line); i += 2;
          const body = [];
          while (i < L.length && /^\s*\|/.test(L[i])) { body.push(row(L[i])); i++; }
          out.push('<div class="table-wrap"><table><thead><tr>' + head.map((h) => `<th>${inline(h, store)}</th>`).join('') + '</tr></thead><tbody>' + body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c, store)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
          continue;
        }
        if (listRe.test(line)) { const [h, nj] = parseList(L, i); out.push(h); i = nj; continue; }
        const para = [];
        while (i < L.length && !isBlank(L[i]) && !startsBlock(L, i) && !(para.length && listRe.test(L[i]))) { para.push(L[i].trim()); i++; }
        if (!para.length) { para.push(L[i].trim()); i++; }
        const ptxt = para.join(' ').trim();
        const only = ptxt.match(/^\u0001(\d+)\u0001$/);
        if (only && /katex-display|math-raw display/.test(store[+only[1]])) out.push(ptxt);
        else out.push(`<p>${inline(ptxt, store)}</p>`);
      }
      return out.join('\n');
    }

    const html = restore(parseLines(text.split('\n')), store);
    headings.forEach((h) => { h.html = restore(h.html, store); });
    return { html, headings };
  }

  function md(src, opts) { return render(src, opts).html; }
  /** Inline-only rendering (quiz choices etc.): falls back to block rendering for multi-paragraph text. */
  function mdInline(src) {
    const s = String(src || '');
    if (/\n\s*\n|^\s*([-*]|\d+\.)\s|~~~|\$\$|\n\s*[-*]\s/.test(s)) return md(s);
    const store = []; return restore(inline(s.replace(/\n/g, ' '), store), store);
  }
  const API = { md, render, mdInline, esc, renderMath };
  root.MD = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
