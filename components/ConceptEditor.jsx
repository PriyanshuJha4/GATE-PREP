'use client';

import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { downloadText } from '@/lib/download';

/* ════════════════════════════════════════════════════════════════
   Content Editor — one workspace for concepts, DPP, PYQ and practice
   JSON files. Outline on the left, form fields in the middle, live
   preview on the right. Chrome/Edge can open the real files (or the
   whole content/ folder) and save straight back to disk.
   ════════════════════════════════════════════════════════════════ */

const DRAFT_KEY = 'gate-content-editor-drafts-v2';
const PREF_KEY = 'gate-content-editor-prefs-v1';
const CONTENT_TYPES = [
  { id: 'concepts', label: 'Concepts', full: 'Concepts', file: 'concepts.json' },
  { id: 'dpp', label: 'DPP', full: 'DPP Questions', file: 'dpp-questions.json' },
  { id: 'pyq', label: 'PYQs', full: 'PYQs', file: 'pyq-questions.json' },
  { id: 'practice', label: 'Practice', full: 'Practice Questions', file: 'practice-questions.json' },
];
const QUESTION_TYPES = ['mcq', 'msq', 'nat'];
const DEFAULT_PREFS = { layout: 'side', split: 60, fontSize: 14, mono: true, spellcheck: false, smart: true, autosave: false, answers: true, outline: true, preview: true };
const FENCE = '```';
const GENERIC_NAME = /^(concepts|dpp[- ]?questions|pyq[- ]?questions|practice[- ]?questions)$/i;

const SNIPPETS = [
  { label: 'Table (3 columns)', text: '| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| a | b | c |\n| d | e | f |' },
  { label: 'Truth table', text: '| A | B | A AND B | A OR B |\n| --- | --- | --- | --- |\n| 0 | 0 | 0 | 0 |\n| 0 | 1 | 0 | 1 |\n| 1 | 0 | 0 | 1 |\n| 1 | 1 | 1 | 1 |' },
  { label: 'Matrix (KaTeX)', text: '$$\n\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}\n$$' },
  { label: 'Fraction / sum / integral', text: '$$\n\\frac{a}{b}, \\qquad \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}, \\qquad \\int_a^b f(x)\\,dx\n$$' },
  { label: 'Aligned equations', text: '$$\n\\begin{aligned}\nx &= a + b \\\\\n  &= c\n\\end{aligned}\n$$' },
  { label: 'Mermaid flowchart', text: `${FENCE}mermaid\nflowchart TD\n  A[Start] --> B{Condition?}\n  B -->|Yes| C[Do this]\n  B -->|No| D[Do that]\n  C --> E[End]\n  D --> E\n${FENCE}` },
  { label: 'Mermaid sequence', text: `${FENCE}mermaid\nsequenceDiagram\n  participant A as Client\n  participant B as Server\n  A->>B: Request\n  B-->>A: Response\n${FENCE}` },
  { label: 'Mermaid state machine', text: `${FENCE}mermaid\nstateDiagram-v2\n  [*] --> Idle\n  Idle --> Running: start\n  Running --> Idle: stop\n${FENCE}` },
  { label: 'C code block', text: `${FENCE}c\n#include <stdio.h>\n\nint main(void) {\n    printf("Hello\\n");\n    return 0;\n}\n${FENCE}` },
  { label: 'Callout (note)', text: '> **Note:** write the important point here.' },
  { label: 'Callout (GATE trap)', text: '> **GATE trap:** write the common mistake here.' },
];

const ICONS = {
  up: ['m5 12 7-7 7 7', 'M12 19V5'],
  down: ['M12 5v14', 'm19 12-7 7-7-7'],
  chev: ['m9 18 6-6-6-6'],
  copy: ['M9 11a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'm21 21-4.3-4.3'],
  undo: ['M3 7v6h6', 'M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13'],
  redo: ['M21 7v6h-6', 'M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7'],
  save: ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
  folder: ['m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
  help: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  history: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  panelL: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 3v18'],
  panelR: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M15 3v18'],
  cols: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M12 3v18'],
  rows: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3 12h18'],
  link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
};

function Icon({ name, size = 16 }) {
  return <svg className="ce-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{(ICONS[name] || []).map((d, i) => <path key={i} d={d} />)}</svg>;
}

function IconBtn({ icon, label, onClick, disabled, active, className = '', children }) {
  return <button type="button" className={`ce-ibtn ${active ? 'is-active' : ''} ${className}`} title={label} aria-label={label} aria-pressed={active === undefined ? undefined : active} onClick={onClick} disabled={disabled}><Icon name={icon} />{children}</button>;
}

/* ───────── pure helpers ───────── */

const text = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const letter = (i) => String.fromCharCode(65 + (i % 26));
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}`;
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const slug = (s) => text(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripMd = (s) => text(s).replace(/[#*_`$>\\[\]]/g, '').replace(/\s+/g, ' ').trim();
const asIndexList = (a) => (Array.isArray(a) ? a.filter(Number.isInteger) : Number.isInteger(a) ? [a] : []);
const insertAt = (arr, i, item) => [...arr.slice(0, i), item, ...arr.slice(i)];
const arr = (v) => (Array.isArray(v) ? v : []);

function merge(obj, patch) {
  const out = { ...obj };
  for (const k of Object.keys(patch)) { if (patch[k] === undefined) delete out[k]; else out[k] = patch[k]; }
  return out;
}

function remapAnswer(answer, f) {
  if (Array.isArray(answer)) return answer.map(f).filter((n) => n !== null).sort((a, b) => a - b);
  if (typeof answer === 'number') { const r = f(answer); return r === null ? 0 : r; }
  return answer;
}

function detectType(name, data) {
  const lower = (name || '').toLowerCase();
  const found = CONTENT_TYPES.find((t) => lower.endsWith(t.file));
  if (found) return found.id;
  if (Array.isArray(data?.sections)) return 'concepts';
  if (Array.isArray(data?.chapters)) {
    if (/dpp/.test(lower)) return 'dpp';
    if (/pyq|previous/.test(lower)) return 'pyq';
    return 'practice';
  }
  return 'unknown';
}

function guessSubject(path, data) {
  const parts = (path || '').split('/');
  const file = parts.pop() || '';
  if (parts.length) return parts[parts.length - 1].replace(/[-_]+/g, ' ');
  const cleaned = file.replace(/\.json$/i, '').replace(/-(concepts|dpp-questions|pyq-questions|practice-questions)$/i, '').replace(/[-_]+/g, ' ').trim();
  if (cleaned && !GENERIC_NAME.test(cleaned)) return cleaned;
  return data?.title || 'Imported content';
}

const groupLabel = (g, i, isC) => g?.title || g?.id || `${isC ? 'Section' : 'Chapter'} ${i + 1}`;
const questionLabel = (q, i) => q?.title || stripMd(q?.question).slice(0, 70) || q?.id || `Question ${i + 1}`;

function suggestId(group, n) {
  const base = slug(group?.id || group?.title) || 'q';
  const used = new Set(arr(group?.questions).map((q) => String(q?.id)));
  let k = n + 1;
  while (used.has(`${base}-q${k}`)) k += 1;
  return `${base}-q${k}`;
}

function blankQuestion(base, group, isC, type) {
  const t = QUESTION_TYPES.includes(base?.type) ? base.type : 'mcq';
  const q = { id: suggestId(group, arr(group?.questions).length), type: t, question: '' };
  if (t !== 'nat') { q.options = ['', '', '', '']; q.answer = t === 'msq' ? [] : 0; } else q.answer = '';
  q.solution = '';
  q.marks = base?.marks ?? 1;
  if (base?.source !== undefined || !isC) q.source = base?.source ?? (type === 'dpp' ? 'DPP' : type === 'pyq' ? 'GATE PYQ' : 'Practice');
  return q;
}

/* ───────── validation (errors block saving; warnings do not) ───────── */

function check(data, type) {
  const out = [];
  const add = (level, gi, qi, msg) => out.push({ level, gi, qi, msg });
  if (!isObj(data)) { add('error', null, null, 'Root must be a JSON object.'); return out; }
  const isC = type === 'concepts';
  const key = isC ? 'sections' : 'chapters';
  const noun = isC ? 'Section' : 'Chapter';
  if (!Array.isArray(data[key])) add('error', null, null, `Root must contain a "${key}" array.`);
  const groups = arr(data[key]);
  const gids = new Set();
  groups.forEach((g, gi) => {
    const label = `${noun} ${gi + 1}`;
    if (!isObj(g)) { add('error', gi, null, `${label} must be an object.`); return; }
    if (typeof g.title !== 'string' || !g.title.trim()) add('error', gi, null, `${label}: title must be a non-empty string.`);
    if (isC && g.id != null) {
      const id = String(g.id);
      if (gids.has(id)) add('error', gi, null, `${label}: duplicate section id "${id}".`);
      gids.add(id);
    }
    if (isC) {
      if (g.content != null && typeof g.content !== 'string') add('error', gi, null, `${label}: content must be a string.`);
      if (g.keyPoints != null && !Array.isArray(g.keyPoints)) add('error', gi, null, `${label}: keyPoints must be an array.`);
    }
    if (g.questions != null && !Array.isArray(g.questions)) add('error', gi, null, `${label}: questions must be an array.`);
    const ids = new Set();
    arr(g.questions).forEach((q, qi) => {
      const ql = `${label}, Q${qi + 1}`;
      if (!isObj(q)) { add('error', gi, qi, `${ql} must be an object.`); return; }
      if (q.id != null && String(q.id).trim()) {
        const id = String(q.id);
        if (ids.has(id)) add('error', gi, qi, `${ql}: duplicate question id "${id}".`);
        ids.add(id);
      }
      if (q.options != null && !Array.isArray(q.options)) add('error', gi, qi, `${ql}: options must be an array.`);
      if (q.question != null && typeof q.question !== 'string') add('error', gi, qi, `${ql}: question must be a string.`);
      const t = q.type;
      const opts = Array.isArray(q.options) ? q.options : null;
      if (typeof q.question === 'string' && !q.question.trim()) add('warn', gi, qi, `${ql}: question text is empty.`);
      if (t == null) add('warn', gi, qi, `${ql}: missing "type" (mcq, msq or nat).`);
      if (t === 'mcq' || t === 'msq') {
        if (!opts || opts.length < 2) add('warn', gi, qi, `${ql}: needs at least 2 options.`);
        else {
          if (opts.some((o) => !text(o).trim())) add('warn', gi, qi, `${ql}: has an empty option.`);
          if (t === 'mcq') {
            if (typeof q.answer !== 'number') add('warn', gi, qi, `${ql}: MCQ answer should be an option index.`);
            else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= opts.length) add('error', gi, qi, `${ql}: answer ${q.answer} is outside the options (0-${opts.length - 1}).`);
          } else if (!Array.isArray(q.answer) || !q.answer.length) add('warn', gi, qi, `${ql}: MSQ answer should be a non-empty array of option indexes.`);
          else if (q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= opts.length)) add('error', gi, qi, `${ql}: MSQ answer has an index outside the options.`);
        }
      }
      if (t === 'nat') {
        const okAns = typeof q.answer === 'number' && Number.isFinite(q.answer);
        const okRange = Array.isArray(q.range) && q.range.length === 2 && q.range.every((n) => typeof n === 'number' && Number.isFinite(n));
        if (!okAns && !okRange) add('error', gi, qi, `${ql}: NAT needs a numeric "answer" or a numeric "range": [min, max].`);
        if (okRange && q.range[0] > q.range[1]) add('error', gi, qi, `${ql}: range minimum is greater than maximum.`);
      }
      if (!text(q.solution).trim()) add('warn', gi, qi, `${ql}: solution is empty.`);
    });
  });
  return out;
}

/* ───────── what changed since the last save ───────── */

function computeChanges(orig, cur, gKey, isC) {
  const out = [];
  const idOf = (x, i) => (x && x.id != null && String(x.id).trim() ? `id:${x.id}` : `ix:${i}`);
  const index = (list) => { const m = new Map(); list.forEach((x, i) => m.set(idOf(x, i), { x, i })); return m; };
  const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
  if (!same({ ...orig, [gKey]: 0 }, { ...cur, [gKey]: 0 })) out.push({ kind: 'modified', gi: null, qi: null, label: 'Document metadata' });
  const og = index(arr(orig?.[gKey]));
  const seen = new Set();
  arr(cur?.[gKey]).forEach((g, gi) => {
    const k = idOf(g, gi);
    const o = og.get(k);
    if (!o) { out.push({ kind: 'added', gi, qi: null, label: groupLabel(g, gi, isC) }); return; }
    seen.add(k);
    if (!same({ ...g, questions: 0 }, { ...o.x, questions: 0 })) out.push({ kind: 'modified', gi, qi: null, label: groupLabel(g, gi, isC), orig: o.x });
    const oq = index(arr(o.x?.questions));
    const qseen = new Set();
    arr(g.questions).forEach((q, qi) => {
      const qk = idOf(q, qi);
      const oo = oq.get(qk);
      if (!oo) out.push({ kind: 'added', gi, qi, label: `${groupLabel(g, gi, isC)} → ${questionLabel(q, qi)}` });
      else { qseen.add(qk); if (!same(q, oo.x)) out.push({ kind: 'modified', gi, qi, label: `${groupLabel(g, gi, isC)} → ${questionLabel(q, qi)}`, orig: oo.x }); }
    });
    oq.forEach((v, qk) => { if (!qseen.has(qk)) out.push({ kind: 'removed', gi, qi: null, label: `${groupLabel(g, gi, isC)} → ${questionLabel(v.x, v.i)}` }); });
  });
  og.forEach((v, k) => { if (!seen.has(k)) out.push({ kind: 'removed', gi: null, qi: null, label: groupLabel(v.x, v.i, isC) }); });
  return out;
}

/* ───────── find & replace helpers ───────── */

function scanStrings(value, path, emit) {
  if (typeof value === 'string') emit(path, value);
  else if (Array.isArray(value)) value.forEach((v, i) => scanStrings(v, `${path}[${i + 1}]`, emit));
  else if (isObj(value)) Object.keys(value).forEach((k) => { if (k !== 'id') scanStrings(value[k], path ? `${path}.${k}` : k, emit); });
}

function collectHits(data, gKey, re, inScope, limit = 150) {
  const hits = [];
  let total = 0;
  const visit = (gi, qi, obj, skip) => Object.keys(obj).forEach((k) => {
    if (skip.includes(k) || k === 'id') return;
    scanStrings(obj[k], k, (field, s) => {
      const m = s.match(re);
      if (!m) return;
      total += m.length;
      if (hits.length < limit) {
        const at = s.search(re);
        hits.push({ gi, qi, field, snippet: s.slice(Math.max(0, at - 28), at + 60).replace(/\s+/g, ' ') });
      }
    });
  });
  if (inScope(null, null)) visit(null, null, data, [gKey]);
  arr(data[gKey]).forEach((g, gi) => {
    if (!isObj(g)) return;
    if (inScope(gi, null)) visit(gi, null, g, ['questions']);
    arr(g.questions).forEach((q, qi) => { if (isObj(q) && inScope(gi, qi)) visit(gi, qi, q, []); });
  });
  return { hits, total };
}

function replaceDeep(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) { const next = value.map((v) => replaceDeep(v, fn)); return next.every((v, i) => v === value[i]) ? value : next; }
  if (isObj(value)) {
    let changed = false;
    const next = {};
    for (const k of Object.keys(value)) { next[k] = k === 'id' ? value[k] : replaceDeep(value[k], fn); if (next[k] !== value[k]) changed = true; }
    return changed ? next : value;
  }
  return value;
}

function replaceInScope(data, gKey, inScope, fn) {
  const part = (obj, skip) => {
    let next = obj;
    for (const k of Object.keys(obj)) {
      if (skip.includes(k) || k === 'id') continue;
      const nv = replaceDeep(obj[k], fn);
      if (nv !== obj[k]) { if (next === obj) next = { ...obj }; next[k] = nv; }
    }
    return next;
  };
  const root = inScope(null, null) ? part(data, [gKey]) : data;
  const groups = arr(data[gKey]).map((g, gi) => {
    if (!isObj(g)) return g;
    let ng = inScope(gi, null) ? part(g, ['questions']) : g;
    if (Array.isArray(g.questions)) {
      const qs = g.questions.map((q, qi) => (isObj(q) && inScope(gi, qi) ? part(q, []) : q));
      if (!qs.every((q, i) => q === g.questions[i])) ng = { ...ng, questions: qs };
    }
    return ng;
  });
  return { ...root, [gKey]: groups };
}

/* ───────── textarea helpers (keep the browser's native undo working) ───────── */

function editTextarea(ta, start, end, insert, selStart, selEnd) {
  ta.focus();
  ta.setSelectionRange(start, end);
  let ok = false;
  try { ok = document.execCommand('insertText', false, insert); } catch { ok = false; }
  if (!ok) { ta.setRangeText(insert, start, end, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); }
  const a = selStart ?? start + insert.length;
  ta.setSelectionRange(a, selEnd ?? a);
}

function mdAction(ta, kind) {
  const v = ta.value;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const sel = v.slice(s, e);
  const lineStart = s === 0 ? 0 : v.lastIndexOf('\n', s - 1) + 1;
  let lineEnd = v.indexOf('\n', e);
  if (lineEnd < 0) lineEnd = v.length;
  const wrap = (a, b = a, ph = 'text') => {
    if (s - a.length >= 0 && v.slice(s - a.length, s) === a && v.slice(e, e + b.length) === b) return editTextarea(ta, s - a.length, e + b.length, sel, s - a.length, s - a.length + sel.length);
    const inner = sel || ph;
    return editTextarea(ta, s, e, a + inner + b, s + a.length, s + a.length + inner.length);
  };
  const lines = (fn) => { const out = fn(v.slice(lineStart, lineEnd).split('\n')).join('\n'); editTextarea(ta, lineStart, lineEnd, out, lineStart, lineStart + out.length); };
  const block = (str) => {
    const before = v.slice(0, s);
    const pre = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    editTextarea(ta, s, e, `${pre}${str}\n`);
  };
  if (kind.startsWith('snip:')) return block(SNIPPETS[Number(kind.slice(5))]?.text || '');
  switch (kind) {
    case 'bold': return wrap('**');
    case 'italic': return wrap('*');
    case 'code': return wrap('`', '`', 'code');
    case 'math': return wrap('$', '$', 'x');
    case 'link': { const label = sel || 'text'; const at = s + label.length + 3; return editTextarea(ta, s, e, `[${label}](url)`, at, at + 3); }
    case 'h': return lines((ls) => ls.map((l) => { const m = l.match(/^(#{1,6})\s+/); if (!m) return `## ${l}`; return m[1].length >= 4 ? l.replace(/^#{1,6}\s+/, '') : `#${l}`; }));
    case 'ul': return lines((ls) => { const all = ls.every((l) => /^\s*[-*+]\s/.test(l)); return ls.map((l) => (all ? l.replace(/^(\s*)[-*+]\s/, '$1') : `- ${l.replace(/^\s*\d+\.\s/, '')}`)); });
    case 'ol': return lines((ls) => { const all = ls.every((l) => /^\s*\d+\.\s/.test(l)); return ls.map((l, i) => (all ? l.replace(/^(\s*)\d+\.\s/, '$1') : `${i + 1}. ${l.replace(/^\s*[-*+]\s/, '')}`)); });
    case 'quote': return lines((ls) => { const all = ls.every((l) => l.startsWith('> ')); return ls.map((l) => (all ? l.slice(2) : `> ${l}`)); });
    case 'codeblock': return block(`${FENCE}c\n${sel || '// code'}\n${FENCE}`);
    case 'mathblock': return block(`$$\n${sel || 'x'}\n$$`);
    case 'table': return block(SNIPPETS[0].text);
    default: return undefined;
  }
}

function continueList(ta) {
  const { selectionStart: s, selectionEnd: e, value: v } = ta;
  if (s !== e || (v[s] !== undefined && v[s] !== '\n')) return false;
  const ls = s === 0 ? 0 : v.lastIndexOf('\n', s - 1) + 1;
  const m = v.slice(ls, s).match(/^(\s*)([-*+]|\d+\.)\s(\[[ xX]\]\s)?(.*)$/);
  if (!m) return false;
  const [, indent, marker, task, rest] = m;
  if (!rest.trim()) { editTextarea(ta, ls, s, '', ls, ls); return true; }
  const next = /\d/.test(marker) ? `${parseInt(marker, 10) + 1}.` : marker;
  editTextarea(ta, s, s, `\n${indent}${next} ${task ? '[ ] ' : ''}`);
  return true;
}

function tsvToTable(t) {
  const rows = t.replace(/\r/g, '').split('\n').filter((r) => r.length).map((r) => r.split('\t').map((c) => c.trim().replace(/\|/g, '\\|')));
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r) => `| ${Array.from({ length: width }, (_, i) => r[i] ?? '').join(' | ')} |`;
  return [pad(rows[0]), `| ${Array(width).fill('---').join(' | ')} |`, ...rows.slice(1).map(pad)].join('\n');
}

/* ───────── jump from the preview to the exact source position ───────── */

function caretOffset(ta, pos) {
  const cs = getComputedStyle(ta);
  const m = document.createElement('div');
  ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'tabSize', 'whiteSpace', 'overflowWrap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'boxSizing', 'width'].forEach((k) => { m.style[k] = cs[k]; });
  Object.assign(m.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', height: 'auto' });
  m.textContent = ta.value.slice(0, pos);
  const mark = document.createElement('span');
  mark.textContent = '\u200b';
  m.appendChild(mark);
  document.body.appendChild(m);
  const top = mark.offsetTop;
  m.remove();
  return top;
}

function revealField(el, pane, pos) {
  el.focus({ preventScroll: true });
  let inner = 0;
  if (pos != null && el.tagName === 'TEXTAREA') {
    const top = caretOffset(el, pos);
    if (el.scrollHeight > el.clientHeight + 4) { el.scrollTop = Math.max(0, top - el.clientHeight / 2); inner = el.clientHeight / 2; } else inner = top;
  }
  if (pane) {
    const y = el.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop + inner;
    pane.scrollTo({ top: Math.max(0, y - pane.clientHeight / 2), behavior: 'smooth' });
  } else el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.add('ce-flash');
  setTimeout(() => el.classList.remove('ce-flash'), 1800);
}

/* ───────── small form building blocks ───────── */

function AutoArea({ value, onChange, minRows = 2, maxPx = 760, taRef, className = '', ...rest }) {
  const own = useRef(null);
  const ref = taRef || own;
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight + 2, maxPx)}px`;
  }, [ref, maxPx]);
  useLayoutEffect(() => { fit(); }, [value, fit]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    let w = el.offsetWidth;
    const ro = new ResizeObserver(() => { if (el.offsetWidth !== w) { w = el.offsetWidth; fit(); } });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, ref]);
  return <textarea ref={ref} rows={minRows} value={value} onChange={onChange} className={`ce-area ${className}`} {...rest} />;
}

const TOOLS = [
  ['h', 'H', 'Heading (press again for a deeper level)'],
  ['bold', 'B', 'Bold (Ctrl+B)'],
  ['italic', 'I', 'Italic (Ctrl+I)'],
  ['code', '</>', 'Inline code (Ctrl+E)'],
  ['link', 'Link', 'Link (Ctrl+K)'],
  ['ul', 'List', 'Bulleted list'],
  ['ol', '1.', 'Numbered list'],
  ['quote', 'Quote', 'Quote / callout'],
  ['math', '$x$', 'Inline math (KaTeX)'],
  ['mathblock', '$$', 'Math block (KaTeX)'],
  ['codeblock', '{ }', 'Code block'],
  ['table', 'Table', 'Table'],
];

function MdToolbar({ run }) {
  return <div className="ce-toolbar" role="toolbar" aria-label="Formatting">
    {TOOLS.map(([k, label, title]) => <button type="button" key={k} className={`ce-tool ce-tool-${k}`} title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={() => run(k)}>{label}</button>)}
    <select className="ce-snip" value="" aria-label="Insert snippet" onChange={(e) => { if (e.target.value !== '') run(`snip:${e.target.value}`); }}>
      <option value="">Insert snippet…</option>
      {SNIPPETS.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
    </select>
  </div>;
}

function Field({ label, hint, onRemove, children, className = '', fieldKey }) {
  return <div className={`ce-field ${className}`} {...(fieldKey ? { 'data-editor-field': fieldKey, tabIndex: -1 } : {})}>
    <div className="ce-field-head"><span className="ce-label">{label}</span>{hint && <span className="ce-hint">{hint}</span>}{onRemove && <button type="button" className="ce-link" onClick={onRemove}>Remove field</button>}</div>
    {children}
  </div>;
}

function MdField({ label, value, onChange, minRows = 4, maxPx, placeholder, prefs, toolbar = true, hint, onRemove, field }) {
  const ref = useRef(null);
  const run = (kind) => { if (ref.current) mdAction(ref.current, kind); };
  const onKeyDown = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && !e.shiftKey) {
      const k = e.key.toLowerCase();
      const map = { b: 'bold', i: 'italic', k: 'link', e: 'code' };
      if (map[k]) { e.preventDefault(); run(map[k]); return; }
    }
    if (prefs.smart && e.key === 'Enter' && !mod && !e.shiftKey && !e.altKey && !e.nativeEvent.isComposing && continueList(ref.current)) e.preventDefault();
  };
  const onPaste = (e) => {
    if (!prefs.smart) return;
    const t = e.clipboardData?.getData('text') || '';
    if (t.includes('\t') && t.trim().includes('\n')) { e.preventDefault(); const ta = ref.current; editTextarea(ta, ta.selectionStart, ta.selectionEnd, `${tsvToTable(t.trim())}\n`); }
  };
  return <Field label={label} hint={hint} onRemove={onRemove}>
    {toolbar && <MdToolbar run={run} />}
    <AutoArea taRef={ref} data-editor-field={field} value={value} minRows={minRows} maxPx={maxPx} aria-label={label} placeholder={placeholder || 'Markdown, LaTeX ($x^2$), Mermaid and code blocks are supported…'} spellCheck={prefs.spellcheck} onKeyDown={onKeyDown} onPaste={onPaste} onChange={(e) => onChange(e.target.value)} />
  </Field>;
}

function TextInput({ label, value, onChange, placeholder, right, className = '', field }) {
  return <label className={`ce-field ${className}`}>
    <span className="ce-label">{label}</span>
    <span className="ce-input-wrap"><input className="ce-input" data-editor-field={field} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />{right}</span>
  </label>;
}

function NumInput({ label, value, onCommit, placeholder, className = '', field }) {
  const [s, setS] = useState(value == null ? '' : String(value));
  const last = useRef(value);
  useEffect(() => { if (value !== last.current) { last.current = value; setS(value == null ? '' : String(value)); } }, [value]);
  const change = (e) => {
    const v = e.target.value;
    setS(v);
    const t = v.trim();
    const out = t === '' ? undefined : Number.isFinite(Number(t)) ? Number(t) : t;
    last.current = out;
    onCommit(out);
  };
  return <label className={`ce-field ${className}`}><span className="ce-label">{label}</span><input className="ce-input" data-editor-field={field} inputMode="decimal" value={s} placeholder={placeholder} onChange={change} /></label>;
}

function RangeInput({ value, onCommit }) {
  const init = () => ({ lo: Array.isArray(value) && value[0] != null ? String(value[0]) : '', hi: Array.isArray(value) && value[1] != null ? String(value[1]) : '' });
  const [f, setF] = useState(init);
  const sig = JSON.stringify(value ?? null);
  const last = useRef(sig);
  useEffect(() => { if (sig !== last.current) { last.current = sig; setF(init()); } }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = (x) => x.trim() !== '' && Number.isFinite(Number(x));
  const set = (k, v) => {
    const nf = { ...f, [k]: v };
    setF(nf);
    const out = ok(nf.lo) && ok(nf.hi) ? [Number(nf.lo), Number(nf.hi)] : undefined;
    last.current = JSON.stringify(out ?? null);
    onCommit(out);
  };
  return <div className="ce-range">
    <label className="ce-field"><span className="ce-label">Range minimum</span><input className="ce-input" inputMode="decimal" value={f.lo} onChange={(e) => set('lo', e.target.value)} placeholder="e.g. 3.9" /></label>
    <label className="ce-field"><span className="ce-label">Range maximum</span><input className="ce-input" inputMode="decimal" value={f.hi} onChange={(e) => set('hi', e.target.value)} placeholder="e.g. 4.1" /></label>
  </div>;
}

function RawJson({ label, value, onApply, big = false, hint, spell = false }) {
  const pretty = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const [draft, setDraft] = useState(pretty);
  const [err, setErr] = useState('');
  const base = useRef(pretty);
  useEffect(() => { if (pretty !== base.current) { base.current = pretty; setDraft(pretty); setErr(''); } }, [pretty]);
  const dirty = draft !== pretty;
  const apply = () => { try { const msg = onApply(JSON.parse(draft)); setErr(msg || ''); } catch (e) { setErr(`Invalid JSON: ${e.message}`); } };
  const format = () => { try { setDraft(JSON.stringify(JSON.parse(draft), null, 2)); setErr(''); } catch (e) { setErr(`Invalid JSON: ${e.message}`); } };
  const props = { value: draft, spellCheck: spell, 'aria-label': label, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); apply(); } } };
  return <div className="ce-field">
    <div className="ce-field-head"><span className="ce-label">{label}</span>{hint && <span className="ce-hint">{hint}</span>}{dirty && <span className="ce-pill is-warn">Not applied</span>}</div>
    {big ? <textarea className="ce-area ce-json ce-json-big" {...props} /> : <AutoArea className="ce-json" minRows={4} maxPx={420} {...props} />}
    <div className="ce-row">
      <button type="button" className="btn btn-small" onClick={apply} disabled={!dirty}>Apply changes (Ctrl+Enter)</button>
      <button type="button" className="btn btn-ghost btn-small" onClick={format}>Format</button>
      {dirty && <button type="button" className="btn btn-ghost btn-small" onClick={() => { setDraft(pretty); setErr(''); }}>Discard</button>}
    </div>
    {err && <p className="ce-error" role="alert">{err}</p>}
  </div>;
}

/* ───────── question editor ───────── */

function QuestionEditor({ q, gi, qi, groups, isConcepts, patch, ops, prefs }) {
  const type = q.type;
  const idxs = asIndexList(q.answer);
  const opts = Array.isArray(q.options) ? q.options : [];
  const showOptions = Array.isArray(q.options) || type === 'mcq' || type === 'msq';
  const typing = (key, v) => patch({ [key]: v === '' && !(key in q) ? undefined : v }, `Edited ${key}`, key);
  const isCorrect = (i) => (type === 'msq' ? idxs.includes(i) : typeof q.answer === 'number' && q.answer === i);
  const setOpt = (i, v) => patch({ options: opts.map((o, k) => (k === i ? v : o)) }, 'Edited option', `opt${i}`);
  const mark = (i) => {
    if (type === 'msq') patch({ answer: idxs.includes(i) ? idxs.filter((x) => x !== i) : [...idxs, i].sort((a, b) => a - b) }, 'Toggled correct option');
    else patch({ answer: i }, 'Set correct option');
  };
  const delOpt = (i) => patch({ options: opts.filter((_, k) => k !== i), answer: remapAnswer(q.answer, (n) => (n === i ? null : n > i ? n - 1 : n)) }, 'Removed option');
  const moveOpt = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= opts.length) return;
    const next = [...opts];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ options: next, answer: remapAnswer(q.answer, (n) => (n === i ? j : n === j ? i : n)) }, 'Moved option');
  };
  const changeType = (t) => {
    const p = { type: t };
    if (t === 'mcq') { p.answer = idxs.length ? idxs[0] : 0; if (!Array.isArray(q.options)) p.options = ['', '', '', '']; }
    else if (t === 'msq') { p.answer = idxs; if (!Array.isArray(q.options)) p.options = ['', '', '', '']; }
    else if (t === 'nat') p.answer = typeof q.answer === 'number' ? q.answer : '';
    patch(p, `Changed type to ${t}`);
  };
  const known = ['id', 'type', 'title', 'question', 'options', 'answer', 'solution', 'marks', 'source', ...(type === 'nat' ? ['range'] : [])];
  const others = Object.fromEntries(Object.entries(q).filter(([k]) => !known.includes(k)));
  const correctText = idxs.length ? idxs.map(letter).join(', ') : 'none selected';

  return <div className="ce-form">
    <div className="ce-grid ce-grid-meta">
      <TextInput field="id" label="Question ID" value={text(q.id)} onChange={(v) => typing('id', v)} right={<button type="button" className="ce-inline-btn" title="Generate a unique ID" onClick={() => patch({ id: suggestId(groups[gi], qi) }, 'Generated ID')}>Auto</button>} />
      <label className="ce-field"><span className="ce-label">Type</span>
        <select className="ce-input" value={type ?? ''} onChange={(e) => changeType(e.target.value)}>
          {type == null && <option value="">(not set)</option>}
          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          {type != null && !QUESTION_TYPES.includes(type) && <option value={type}>{String(type)}</option>}
        </select>
      </label>
      <NumInput field="marks" label="Marks" value={q.marks} placeholder="1" onCommit={(v) => patch({ marks: v }, 'Edited marks', 'marks')} />
      <TextInput field="source" label="Source" value={text(q.source)} onChange={(v) => typing('source', v)} placeholder="DPP, GATE 2019…" />
    </div>
    <TextInput field="title" label="Title (optional)" value={text(q.title)} onChange={(v) => typing('title', v)} />
    <MdField field="question" label="Question" value={text(q.question)} onChange={(v) => patch({ question: v }, 'Edited question', 'question')} minRows={9} prefs={prefs} />

    {showOptions && <Field fieldKey={type === 'nat' ? 'options' : 'answer'} label="Options" hint={type === 'msq' ? 'Click the letters to mark every correct option' : 'Click a letter to mark the correct option'}>
      <div className="ce-opts">
        {opts.map((o, i) => <div key={i} className={`ce-opt ${isCorrect(i) ? 'is-correct' : ''}`}>
          <button type="button" className="ce-opt-key" aria-pressed={isCorrect(i)} title={isCorrect(i) ? `Option ${letter(i)} is correct` : `Mark option ${letter(i)} as correct`} onClick={() => mark(i)}>{letter(i)}</button>
          <AutoArea data-editor-field={`option-${i}`} value={text(o)} minRows={1} maxPx={260} placeholder={`Option ${letter(i)} (Markdown / LaTeX)`} spellCheck={prefs.spellcheck} aria-label={`Option ${letter(i)}`} onChange={(e) => setOpt(i, e.target.value)} />
          <div className="ce-opt-tools">
            <IconBtn icon="up" label="Move option up" onClick={() => moveOpt(i, -1)} disabled={i === 0} />
            <IconBtn icon="down" label="Move option down" onClick={() => moveOpt(i, 1)} disabled={i === opts.length - 1} />
            <IconBtn icon="trash" label="Delete option" onClick={() => delOpt(i)} />
          </div>
        </div>)}
      </div>
      <div className="ce-row"><button type="button" className="btn btn-ghost btn-small" onClick={() => patch({ options: [...opts, ''] }, 'Added option')}><Icon name="plus" size={14} /> Add option</button>
        {type !== 'nat' && <span className="ce-hint">Correct: <strong>{correctText}</strong></span>}
        {type === 'nat' && <button type="button" className="btn btn-ghost btn-small" onClick={() => patch({ options: undefined }, 'Removed options')}>Remove options (not used by NAT)</button>}
      </div>
    </Field>}

    {type === 'nat' && <Field fieldKey="answer" label="Numerical answer" hint="Give an exact answer, a range, or both">
      <div className="ce-grid ce-grid-nat">
        <NumInput label="Exact answer" value={q.answer === '' ? undefined : q.answer} placeholder="e.g. 4" onCommit={(v) => patch({ answer: v === undefined ? '' : v }, 'Edited answer', 'answer')} />
        <RangeInput value={q.range} onCommit={(v) => patch({ range: v }, 'Edited range', 'range')} />
      </div>
    </Field>}
    {type != null && !QUESTION_TYPES.includes(type) && <RawJson label="Answer (JSON)" value={q.answer ?? ''} hint="Number, array, or string" onApply={(v) => { patch({ answer: v }, 'Edited answer'); return ''; }} />}

    <MdField field="solution" label="Solution" value={text(q.solution)} onChange={(v) => patch({ solution: v }, 'Edited solution', 'solution')} minRows={9} prefs={prefs} />

    <details className="ce-details">
      <summary>Other fields and raw JSON for this question</summary>
      <RawJson label="Whole question (JSON)" value={q} hint="Edit any field, including ones this form does not know about" onApply={(v) => { if (!isObj(v)) return 'A question must be a JSON object.'; patch({ ...Object.fromEntries(Object.keys(q).map((k) => [k, undefined])), ...v }, 'Edited question JSON'); return ''; }} />
      {Object.keys(others).length > 0 && <p className="ce-hint">Extra fields on this question: {Object.keys(others).join(', ')}</p>}
    </details>

    <div className="ce-row ce-row-end">
      <label className="ce-inline-select">Move to {isConcepts ? 'section' : 'chapter'}
        <select className="ce-input" value="" onChange={(e) => { if (e.target.value !== '') ops.moveQuestionTo(gi, qi, Number(e.target.value)); }}>
          <option value="">Choose…</option>
          {groups.map((g, i) => (i === gi ? null : <option key={i} value={i}>{groupLabel(g, i, isConcepts)}</option>))}
        </select>
      </label>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => ops.duplicateQuestion(gi, qi)}><Icon name="copy" size={14} /> Duplicate</button>
      <button type="button" className="btn btn-ghost btn-small btn-danger" onClick={() => ops.deleteQuestion(gi, qi)}><Icon name="trash" size={14} /> Delete question</button>
    </div>
  </div>;
}

/* ───────── group (section / chapter) and document editors ───────── */

const OPTIONAL_GROUP_FIELDS = ['short', 'summary', 'content', 'keyPoints'];

function GroupEditor({ g, gi, isConcepts, noun, patch, ops, prefs }) {
  const typing = (key, v) => patch({ [key]: v === '' && !(key in g) ? undefined : v }, `Edited ${key}`, key);
  const known = ['id', 'title', 'questions', ...OPTIONAL_GROUP_FIELDS];
  const others = Object.fromEntries(Object.entries(g).filter(([k]) => !known.includes(k)));
  const missing = isConcepts ? OPTIONAL_GROUP_FIELDS.filter((k) => g[k] === undefined) : [];
  const qs = arr(g.questions);
  return <div className="ce-form">
    <div className="ce-grid ce-grid-2">
      <TextInput field="title" label={`${noun} title`} value={text(g.title)} onChange={(v) => patch({ title: v }, 'Edited title', 'title')} />
      {(isConcepts || g.id !== undefined) && <TextInput field="id" label={`${noun} ID`} value={text(g.id)} onChange={(v) => typing('id', v)} right={<button type="button" className="ce-inline-btn" title="Generate from the title" onClick={() => patch({ id: slug(g.title) || uid('section') }, 'Generated ID')}>Auto</button>} />}
    </div>
    {g.short !== undefined && <TextInput field="short" label="Short description" value={text(g.short)} onChange={(v) => patch({ short: v }, 'Edited short', 'short')} />}
    {g.summary !== undefined && <MdField field="summary" label="Summary" value={text(g.summary)} onChange={(v) => patch({ summary: v }, 'Edited summary', 'summary')} minRows={3} prefs={prefs} onRemove={() => patch({ summary: undefined }, 'Removed summary')} />}
    {g.content !== undefined && <MdField field="content" label="Content" hint="Markdown, KaTeX, Mermaid, tables, code" value={text(g.content)} onChange={(v) => patch({ content: v }, 'Edited content', 'content')} minRows={16} maxPx={1400} prefs={prefs} />}
    {g.keyPoints !== undefined && <Field label="Key points" hint="One per line" onRemove={() => patch({ keyPoints: undefined }, 'Removed key points')}>
      <AutoArea data-editor-field="keyPoints" value={arr(g.keyPoints).join('\n')} minRows={4} spellCheck={prefs.spellcheck} aria-label="Key points" onChange={(e) => patch({ keyPoints: e.target.value.split('\n') }, 'Edited key points', 'keyPoints')} onBlur={(e) => patch({ keyPoints: e.target.value.split('\n').filter((x) => x.trim()) }, 'Tidied key points')} />
    </Field>}
    {missing.length > 0 && <div className="ce-row"><span className="ce-hint">Add field:</span>{missing.map((k) => <button type="button" key={k} className="ce-chip" onClick={() => patch({ [k]: k === 'keyPoints' ? [] : '' }, `Added ${k}`)}>+ {k}</button>)}</div>}
    <div className="ce-callout">
      <strong>{qs.length} {qs.length === 1 ? 'question' : 'questions'} in this {noun.toLowerCase()}.</strong>
      <div className="ce-row"><button type="button" className="btn btn-small" onClick={() => ops.addQuestion(gi)}><Icon name="plus" size={14} /> Add question</button></div>
    </div>
    <details className="ce-details">
      <summary>Other fields and raw JSON for this {noun.toLowerCase()}</summary>
      <RawJson label={`${noun} fields without questions (JSON)`} value={Object.fromEntries(Object.entries(g).filter(([k]) => k !== 'questions'))} onApply={(v) => { if (!isObj(v)) return 'Must be a JSON object.'; patch({ ...Object.fromEntries(Object.keys(g).filter((k) => k !== 'questions').map((k) => [k, undefined])), ...v, questions: g.questions }, 'Edited JSON'); return ''; }} />
      <RawJson label="Questions array (JSON)" hint="Paste many questions at once" value={qs} onApply={(v) => { if (!Array.isArray(v)) return 'Must be a JSON array.'; patch({ questions: v }, 'Edited questions JSON'); return ''; }} />
      {Object.keys(others).length > 0 && <p className="ce-hint">Extra fields: {Object.keys(others).join(', ')}</p>}
    </details>
    <div className="ce-row ce-row-end">
      <button type="button" className="btn btn-ghost btn-small" onClick={() => ops.duplicateGroup(gi)}><Icon name="copy" size={14} /> Duplicate {noun.toLowerCase()}</button>
      <button type="button" className="btn btn-ghost btn-small btn-danger" onClick={() => ops.deleteGroup(gi)}><Icon name="trash" size={14} /> Delete {noun.toLowerCase()}</button>
    </div>
  </div>;
}

function RootEditor({ data, gKey, isConcepts, doc, issues, patchRoot, applyRoot, prefs }) {
  const groups = arr(data[gKey]);
  const qCount = groups.reduce((n, g) => n + arr(g?.questions).length, 0);
  const rest = Object.fromEntries(Object.entries(data).filter(([k]) => k !== gKey));
  return <div className="ce-form">
    <div className="ce-callout">
      <strong>{doc.path}</strong>
      <span className="ce-hint">{groups.length} {isConcepts ? 'sections' : 'chapters'}, {qCount} questions, {issues.filter((i) => i.level === 'error').length} errors, {issues.filter((i) => i.level === 'warn').length} warnings</span>
    </div>
    <TextInput field="title" label="Document title" value={text(data.title)} onChange={(v) => patchRoot({ title: v }, 'Edited title', 'title')} />
    {data.intro !== undefined
      ? <MdField field="intro" label="Intro" value={text(data.intro)} onChange={(v) => patchRoot({ intro: v }, 'Edited intro', 'intro')} minRows={5} prefs={prefs} onRemove={() => patchRoot({ intro: undefined }, 'Removed intro')} />
      : isConcepts && <div className="ce-row"><button type="button" className="ce-chip" onClick={() => patchRoot({ intro: '' }, 'Added intro')}>+ intro</button></div>}
    <details className="ce-details">
      <summary>Other document fields (JSON)</summary>
      <RawJson label="Document fields without the content list" value={rest} onApply={(v) => { if (!isObj(v)) return 'Must be a JSON object.'; applyRoot(v); return ''; }} />
    </details>
  </div>;
}

/* ───────── preview ───────── */

function QPreview({ q, n, showAnswers, nav }) {
  const type = q?.type || 'mcq';
  const opts = arr(q?.options);
  const idxs = asIndexList(q?.answer);
  const range = Array.isArray(q?.range) ? q.range : null;
  let answer = '';
  if (type === 'mcq' || type === 'msq') answer = idxs.length ? idxs.map(letter).join(', ') : text(JSON.stringify(q?.answer ?? ''));
  else if (type === 'nat') answer = [q?.answer !== '' && q?.answer != null ? text(q.answer) : '', range ? `range ${range[0]} to ${range[1]}` : ''].filter(Boolean).join(', ') || '(not set)';
  else answer = Array.isArray(q?.answer) ? q.answer.join(', ') : text(q?.answer);
  const go = (field, title) => ({ className: 'preview-edit-target', title, onClick: (e) => { e.stopPropagation(); nav?.(field); } });
  return <article className="ce-pq">
    <header>
      <strong {...go('title', 'Click to edit the title')}>{q?.title || `Question ${n}`}</strong>
      <span className="ce-tag">{type}</span>
      {q?.marks !== undefined && q.marks !== '' && <span className="ce-tag preview-edit-target" title="Click to edit marks" onClick={() => nav?.('marks')}>{q.marks} {Number(q.marks) === 1 ? 'mark' : 'marks'}</span>}
      {q?.source && <span className="ce-tag preview-edit-target" title="Click to edit the source" onClick={() => nav?.('source')}>{q.source}</span>}
    </header>
    <MarkdownRenderer content={text(q?.question) || '*Question statement is empty.*'} onSourceNavigate={(s, e) => nav?.('question', s, e)} />
    {opts.length > 0 && <ol className="ce-popts">{opts.map((o, i) => <li key={i} className={`preview-edit-target ${showAnswers && type !== 'nat' && idxs.includes(i) ? 'is-correct' : ''}`} title={`Click to edit option ${letter(i)}`} onClick={() => nav?.(`option-${i}`)}><span className="ce-pletter">{letter(i)}</span><div><MarkdownRenderer content={text(o) || '*empty option*'} onSourceNavigate={(s, e) => nav?.(`option-${i}`, s, e)} /></div></li>)}</ol>}
    {showAnswers && <>
      <p {...go('answer', 'Click to edit the answer')}><strong>Answer:</strong> {answer}</p>
      <MarkdownRenderer content={text(q?.solution) || '*No solution yet.*'} onSourceNavigate={(s, e) => nav?.('solution', s, e)} />
    </>}
  </article>;
}

function PreviewBody({ kind, data, group, question, gi, qi, isConcepts, noun, showAnswers, onNav }) {
  const [all, setAll] = useState(false);
  const here = { kind: 'group', gi };
  const click = (target, field, title) => ({ className: 'preview-edit-target', title, onClick: () => onNav(target, field) });
  if (kind === 'root') {
    const root = { kind: 'root' };
    return <>
      <h3 {...click(root, 'title', 'Click to edit the title')}>{data?.title || 'Untitled document'}</h3>
      {data?.intro && <MarkdownRenderer content={text(data.intro)} onSourceNavigate={(s, e) => onNav(root, 'intro', s, e)} />}
      <p className="muted">{isConcepts ? 'Sections' : 'Chapters'}: {arr(data?.[isConcepts ? 'sections' : 'chapters']).map((g, i) => groupLabel(g, i, isConcepts)).join(', ') || 'none yet'}</p>
    </>;
  }
  if (kind === 'question') return <QPreview q={question} n={qi + 1} showAnswers={showAnswers} nav={(f, s, e) => onNav({ kind: 'question', gi, qi }, f, s, e)} />;
  const qs = arr(group?.questions);
  const shown = all ? qs : qs.slice(0, 20);
  return <>
    <h3 {...click(here, 'title', `Click to edit the ${noun.toLowerCase()} title`)}>{group?.title || `Untitled ${noun.toLowerCase()}`}</h3>
    {isConcepts && group?.short && <p {...click(here, 'short', 'Click to edit the short description')}>{group.short}</p>}
    {isConcepts && group?.summary && <p className="muted preview-edit-target" title="Click to edit the summary" onClick={() => onNav(here, 'summary')}>{group.summary}</p>}
    {isConcepts && <MarkdownRenderer content={text(group?.content) || '*No content yet.*'} onSourceNavigate={(s, e) => onNav(here, 'content', s, e)} />}
    {isConcepts && arr(group?.keyPoints).length > 0 && <div {...click(here, 'keyPoints', 'Click to edit the key points')}><h4>Key points</h4><ul>{group.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
    {qs.length > 0 && <h4>Questions ({qs.length})</h4>}
    {shown.map((q, i) => <QPreview key={`${q?.id || i}-${i}`} q={q} n={i + 1} showAnswers={showAnswers} nav={(f, s, e) => onNav({ kind: 'question', gi, qi: i }, f, s, e)} />)}
    {qs.length > shown.length && <button type="button" className="btn btn-ghost btn-small" onClick={() => setAll(true)}>Show all {qs.length} questions</button>}
    {!qs.length && !isConcepts && <p className="muted">No questions in this chapter yet.</p>}
  </>;
}

/* ───────── outline (left column) ───────── */

function Outline({ data, gKey, isConcepts, noun, kind, gi, qi, setSel, filter, setFilter, issueMap, changedSet, collapsed, toggle, ops }) {
  const groups = arr(data?.[gKey]);
  const f = filter.trim().toLowerCase();
  const qMatch = (q, i) => !f || `${q?.title || ''} ${q?.id || ''} ${text(q?.question)}`.toLowerCase().includes(f) || `q${i + 1}` === f;
  const flag = (g, q) => { const n = issueMap.get(`${g}:${q}`); return n ? <span className={`ce-dot ${n.error ? 'is-error' : 'is-warn'}`} title={`${n.error} error(s), ${n.warn} warning(s)`} /> : null; };
  const onKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rows = [...e.currentTarget.querySelectorAll('[data-row]')];
    const at = rows.indexOf(document.activeElement);
    const next = rows[clamp(at + (e.key === 'ArrowDown' ? 1 : -1), 0, rows.length - 1)];
    if (next) { e.preventDefault(); next.focus(); }
  };
  return <nav className="ce-outline" aria-label="Document outline" onKeyDown={onKey}>
    <div className="ce-search"><Icon name="search" size={14} /><input value={filter} placeholder={`Filter ${isConcepts ? 'sections' : 'chapters'} and questions…`} aria-label="Filter outline" onChange={(e) => setFilter(e.target.value)} />{filter && <button type="button" className="ce-link" onClick={() => setFilter('')}>Clear</button>}</div>
    <button type="button" data-row className={`ce-node ce-node-root ${kind === 'root' ? 'is-active' : ''}`} onClick={() => setSel({ kind: 'root' })}><Icon name="file" size={14} /><span className="ce-node-label">Document settings</span>{flag(null, null)}{changedSet.has('root') && <span className="ce-dot is-changed" title="Changed" />}</button>
    <ul className="ce-tree">
      {groups.map((g, i) => {
        const qs = arr(g?.questions);
        const gMatch = !f || `${g?.title || ''} ${g?.id || ''}`.toLowerCase().includes(f);
        const visibleQs = qs.map((q, k) => ({ q, k })).filter(({ q, k }) => gMatch || qMatch(q, k));
        if (f && !gMatch && !visibleQs.length) return null;
        const open = f ? true : !collapsed[i];
        const active = kind === 'group' && gi === i;
        return <li key={`${g?.id || g?.title}-${i}`} className="ce-group">
          <div className={`ce-node ce-node-group ${active ? 'is-active' : ''}`}>
            <button type="button" className={`ce-twist ${open ? 'is-open' : ''}`} aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open} onClick={() => toggle(i)}><Icon name="chev" size={14} /></button>
            <button type="button" data-row className="ce-node-main" onClick={() => setSel({ kind: 'group', gi: i })}>
              <span className="ce-node-label">{groupLabel(g, i, isConcepts)}</span>
              <span className="ce-count">{qs.length}</span>{flag(i, null)}{changedSet.has(`g${i}`) && <span className="ce-dot is-changed" title="Changed" />}
            </button>
            <span className="ce-node-tools">
              <IconBtn icon="up" label={`Move ${noun.toLowerCase()} up`} onClick={() => ops.moveGroup(i, -1)} disabled={i === 0} />
              <IconBtn icon="down" label={`Move ${noun.toLowerCase()} down`} onClick={() => ops.moveGroup(i, 1)} disabled={i === groups.length - 1} />
            </span>
          </div>
          {open && <ul className="ce-qs">
            {visibleQs.map(({ q, k }) => {
              const qa = kind === 'question' && gi === i && qi === k;
              return <li key={`${q?.id || k}-${k}`}>
                <div className={`ce-node ce-node-q ${qa ? 'is-active' : ''}`}>
                  <button type="button" data-row className="ce-node-main" onClick={() => setSel({ kind: 'question', gi: i, qi: k })}>
                    <span className="ce-qn">{k + 1}</span><span className="ce-node-label">{questionLabel(q, k)}</span>
                    <span className="ce-tag ce-tag-sm">{q?.type || '?'}</span>{flag(i, k)}{changedSet.has(`q${i}.${k}`) && <span className="ce-dot is-changed" title="Changed" />}
                  </button>
                  <span className="ce-node-tools">
                    <IconBtn icon="up" label="Move question up" onClick={() => ops.moveQuestion(i, k, -1)} disabled={k === 0} />
                    <IconBtn icon="down" label="Move question down" onClick={() => ops.moveQuestion(i, k, 1)} disabled={k === qs.length - 1} />
                    <IconBtn icon="copy" label="Duplicate question" onClick={() => ops.duplicateQuestion(i, k)} />
                    <IconBtn icon="trash" label="Delete question" onClick={() => ops.deleteQuestion(i, k)} />
                  </span>
                </div>
              </li>;
            })}
            {!f && <li><button type="button" className="ce-add-q" onClick={() => ops.addQuestion(i)}><Icon name="plus" size={13} /> Add question</button></li>}
          </ul>}
        </li>;
      })}
    </ul>
    <button type="button" className="btn btn-ghost btn-small ce-add-group" onClick={ops.addGroup}><Icon name="plus" size={14} /> Add {noun.toLowerCase()}</button>
  </nav>;
}

/* ───────── side drawers ───────── */

function Drawer({ title, onClose, children }) {
  return <aside className="ce-drawer" aria-label={title}>
    <div className="ce-drawer-head"><h2>{title}</h2><IconBtn icon="x" label="Close panel" onClick={onClose} /></div>
    <div className="ce-drawer-body">{children}</div>
  </aside>;
}

function ProblemsPanel({ issues, onJump }) {
  const sorted = [...issues].sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
  if (!sorted.length) return <p className="ce-ok"><Icon name="check" size={16} /> No problems found in this file.</p>;
  return <ul className="ce-list">{sorted.map((it, i) => <li key={i}><button type="button" className={`ce-issue is-${it.level}`} onClick={() => onJump(it)}><Icon name="alert" size={14} /><span>{it.msg}</span></button></li>)}</ul>;
}

function ChangesPanel({ changes, onJump, onRevertItem, onRevertAll, dirty }) {
  return <>
    <div className="ce-row"><button type="button" className="btn btn-small" disabled={!dirty} onClick={onRevertAll}>Revert whole file to last saved</button></div>
    {!changes.length ? <p className="muted">No differences from the last saved version.</p> : <ul className="ce-list">{changes.map((c, i) => <li key={i} className="ce-change">
      <span className={`ce-pill is-${c.kind}`}>{c.kind}</span>
      <button type="button" className="ce-link ce-change-label" onClick={() => onJump(c)} disabled={c.kind === 'removed'}>{c.label}</button>
      {c.kind === 'modified' && c.orig && <button type="button" className="ce-link" onClick={() => onRevertItem(c)}>Revert</button>}
    </li>)}</ul>}
  </>;
}

function FindPanel({ data, gKey, kind, gi, qi, isConcepts, onApply, onJump }) {
  const [find, setFind] = useState('');
  const [rep, setRep] = useState('');
  const [scope, setScope] = useState('file');
  const [cs, setCs] = useState(false);
  const [rx, setRx] = useState(false);
  const inScope = useCallback((g, q) => {
    if (scope === 'file') return true;
    if (scope === 'chapter') return kind !== 'root' && g === gi;
    if (kind === 'root') return g === null;
    if (kind === 'group') return g === gi && q === null;
    return g === gi && q === qi;
  }, [scope, kind, gi, qi]);
  const re = useMemo(() => { if (!find) return null; try { return new RegExp(rx ? find : escapeRe(find), cs ? 'g' : 'gi'); } catch (e) { return e; } }, [find, rx, cs]);
  const res = useMemo(() => (re instanceof RegExp ? collectHits(data, gKey, re, inScope) : { hits: [], total: 0 }), [re, data, gKey, inScope]);
  const replaceAll = () => {
    if (!(re instanceof RegExp) || !res.total) return;
    if (!window.confirm(`Replace ${res.total} match(es) of "${find}" with "${rep}"? You can undo this.`)) return;
    const fn = (s) => s.replace(re, rx ? rep : () => rep);
    onApply(replaceInScope(data, gKey, inScope, fn), `Replaced "${find}" (${res.total})`);
  };
  const name = (h) => (h.gi == null ? 'Document' : h.qi == null ? `${isConcepts ? 'Section' : 'Chapter'} ${h.gi + 1}` : `${isConcepts ? 'S' : 'Ch'}${h.gi + 1} Q${h.qi + 1}`);
  return <>
    <label className="ce-field"><span className="ce-label">Find</span><input className="ce-input" autoFocus value={find} onChange={(e) => setFind(e.target.value)} placeholder="Text or regular expression" /></label>
    <label className="ce-field"><span className="ce-label">Replace with</span><input className="ce-input" value={rep} onChange={(e) => setRep(e.target.value)} /></label>
    <div className="ce-row">
      <label className="ce-inline-select">Where<select className="ce-input" value={scope} onChange={(e) => setScope(e.target.value)}><option value="file">Whole file</option><option value="chapter">Selected {isConcepts ? 'section' : 'chapter'}</option><option value="item">Selected item only</option></select></label>
      <label className="ce-check"><input type="checkbox" checked={cs} onChange={(e) => setCs(e.target.checked)} /> Match case</label>
      <label className="ce-check"><input type="checkbox" checked={rx} onChange={(e) => setRx(e.target.checked)} /> Regex</label>
    </div>
    {re instanceof Error && <p className="ce-error">{re.message}</p>}
    <div className="ce-row"><button type="button" className="btn btn-small" onClick={replaceAll} disabled={!res.total}>Replace all ({res.total})</button><span className="ce-hint">IDs are never changed.</span></div>
    <ul className="ce-list">{res.hits.map((h, i) => <li key={i}><button type="button" className="ce-hit" onClick={() => onJump(h)}><strong>{name(h)}</strong><span className="ce-hint">{h.field}</span><span className="ce-snippet">{h.snippet}</span></button></li>)}</ul>
    {find && re instanceof RegExp && !res.total && <p className="muted">No matches.</p>}
  </>;
}

function SettingsPanel({ prefs, setPref, fsOk }) {
  const Toggle = (k, label, hint) => <label key={k} className="ce-toggle"><input type="checkbox" checked={!!prefs[k]} onChange={(e) => setPref(k, e.target.checked)} /><span><strong>{label}</strong>{hint && <span className="ce-hint">{hint}</span>}</span></label>;
  return <div className="ce-form">
    <label className="ce-field"><span className="ce-label">Text size ({prefs.fontSize}px)</span><input type="range" min="12" max="20" step="1" value={prefs.fontSize} onChange={(e) => setPref('fontSize', Number(e.target.value))} /></label>
    {Toggle('mono', 'Monospace editor font', 'Easier for LaTeX, code and tables')}
    {Toggle('spellcheck', 'Spell check', 'Underlines unknown words, including LaTeX and code')}
    {Toggle('smart', 'Smart typing', 'Continue lists on Enter; paste spreadsheet cells as a table')}
    {Toggle('answers', 'Show answers in preview', 'Highlights correct options and shows solutions')}
    {Toggle('autosave', 'Auto-save to file', fsOk ? 'Writes to the linked file 2 seconds after you stop typing, only when there are no errors' : 'Needs Chrome or Edge on desktop')}
    <label className="ce-field"><span className="ce-label">Layout</span><select className="ce-input" value={prefs.layout} onChange={(e) => setPref('layout', e.target.value)}><option value="side">Editor and preview side by side</option><option value="stacked">Preview below the editor</option></select></label>
    <button type="button" className="btn btn-ghost btn-small" onClick={() => Object.entries(DEFAULT_PREFS).forEach(([k, v]) => setPref(k, v))}>Reset preferences</button>
  </div>;
}

function HelpPanel() {
  const rows = [['Ctrl + S', 'Save (to the linked file)'], ['Ctrl + Shift + S', 'Download a copy'], ['Ctrl + Shift + F', 'Find and replace'], ['Ctrl + Z / Ctrl + Y', 'Undo / redo (when not typing in a box)'], ['Alt + Page Up / Down', 'Previous / next item'], ['Ctrl + B / I / E / K', 'Bold, italic, code, link'], ['Ctrl + Enter', 'Apply raw JSON'], ['Esc', 'Close this panel']];
  return <>
    <table className="ce-keys"><tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row"><kbd>{k}</kbd></th><td>{v}</td></tr>)}</tbody></table>
    <h3>Writing tips</h3>
    <ul className="ce-tips">
      <li>Inline math: <code>$x^2$</code>; block math: <code>$$ ... $$</code>.</li>
      <li>Diagrams: use a fenced block with the language <code>mermaid</code>.</li>
      <li>Paste cells copied from Excel or Sheets and they become a Markdown table.</li>
      <li>MCQ answer = option index (A is 0). MSQ answer = array of indexes. NAT = number or a range.</li>
      <li>Use “Insert snippet” for tables, matrices, flowcharts and C code.</li>
    </ul>
  </>;
}

/* ───────── file-system helpers (Chrome / Edge) ───────── */

async function scanDir(dir, prefix, out, depth = 0) {
  for await (const [name, handle] of dir.entries()) {
    if (name.startsWith('.') || name === 'node_modules' || out.length >= 300) continue;
    if (handle.kind === 'file') { if (CONTENT_TYPES.some((t) => name.toLowerCase().endsWith(t.file))) out.push({ path: `${prefix}${name}`, name, handle }); }
    else if (depth < 4) await scanDir(handle, `${prefix}${name}/`, out, depth + 1);
  }
}

async function ensureWrite(handle) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission?.(opts)) === 'granted') return;
  if ((await handle.requestPermission?.(opts)) !== 'granted') throw new Error('Permission to write the file was denied.');
}

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */

export default function ConceptEditor() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState('');
  const [sel, setSel] = useState({ kind: 'group', gi: 0, qi: 0 });
  const [mode, setMode] = useState('visual');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [panel, setPanel] = useState(null);
  const [status, setStatus] = useState({ text: 'Open your content folder or JSON files to begin.', tone: 'info' });
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [mobileTab, setMobileTab] = useState('edit');
  const [pvTab, setPvTab] = useState('render');
  const [fsOk, setFsOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nav, setNav] = useState(null);

  const fileRef = useRef(null);
  const mainRef = useRef(null);
  const editPaneRef = useRef(null);
  const handlesRef = useRef({});
  const selMemo = useRef({});
  const loadedRef = useRef(false);
  const docsRef = useRef([]);
  const activeRef = useRef('');
  const actionsRef = useRef({});

  docsRef.current = documents;
  activeRef.current = activeDoc;

  const say = useCallback((t, tone = 'info') => setStatus({ text: t, tone }), []);
  const setPref = useCallback((k, v) => setPrefs((p) => ({ ...p, [k]: v })), []);

  /* ---- derived state ---- */
  const doc = documents.find((d) => d.key === activeDoc) || null;
  const type = doc?.type || 'unknown';
  const isConcepts = type === 'concepts';
  const gKey = isConcepts ? 'sections' : 'chapters';
  const noun = isConcepts ? 'Section' : 'Chapter';
  const data = doc?.data;
  const groups = useMemo(() => arr(data?.[gKey]), [data, gKey]);

  let kind = sel.kind;
  let gi = sel.gi ?? 0;
  let qi = sel.qi ?? 0;
  if (kind !== 'root') {
    if (!groups.length) kind = 'root';
    else {
      gi = clamp(gi, 0, groups.length - 1);
      if (kind === 'question') { const n = arr(groups[gi]?.questions).length; if (!n) kind = 'group'; else qi = clamp(qi, 0, n - 1); }
    }
  }
  const group = kind === 'root' ? null : groups[gi];
  const question = kind === 'question' ? group.questions[qi] : null;

  const checkData = useDeferredValue(data);
  const hasDoc = Boolean(doc && checkData);
  const issues = useMemo(() => (hasDoc ? check(checkData, type) : []), [checkData, type, hasDoc]);
  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warnCount = issues.length - errorCount;
  const issueMap = useMemo(() => {
    const m = new Map();
    issues.forEach((it) => {
      const bump = (k) => { const v = m.get(k) || { error: 0, warn: 0 }; v[it.level === 'error' ? 'error' : 'warn'] += 1; m.set(k, v); };
      bump(`${it.gi}:${it.qi}`);
      if (it.qi != null) bump(`${it.gi}:null`);
    });
    return m;
  }, [issues]);

  const docOriginal = doc?.original;
  const docDirty = Boolean(doc?.dirty);
  const changes = useMemo(() => (hasDoc && (panel === 'changes' || docDirty) ? computeChanges(docOriginal ?? checkData, checkData, gKey, isConcepts) : []), [hasDoc, checkData, docOriginal, docDirty, panel, gKey, isConcepts]);
  const changedSet = useMemo(() => {
    const s = new Set();
    changes.forEach((c) => { if (c.kind === 'removed') return; if (c.gi == null) s.add('root'); else if (c.qi == null) s.add(`g${c.gi}`); else s.add(`q${c.gi}.${c.qi}`); });
    return s;
  }, [changes]);

  const pvKind = useDeferredValue(kind);
  const pvGroup = useDeferredValue(group);
  const pvQuestion = useDeferredValue(question);
  const pvData = useDeferredValue(data);
  const pvGi = useDeferredValue(gi);
  const pvQi = useDeferredValue(qi);

  /* ---- boot: prefs, drafts, capability checks ---- */
  useEffect(() => {
    setFsOk(typeof window !== 'undefined' && 'showOpenFilePicker' in window && 'showDirectoryPicker' in window);
    try { const p = JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); if (isObj(p)) setPrefs({ ...DEFAULT_PREFS, ...p }); } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) {
        setDocuments(saved.filter((d) => d && d.data && d.type).map((d) => ({ ...d, path: d.path || d.name, original: d.original ?? d.data, history: [], future: [], dirty: d.dirty ?? true, linked: false, restored: true })));
        setActiveDoc(saved[0].key);
        setStatus({ text: 'Restored your last session from this browser. Use “Link file” to save straight to disk again.', tone: 'info' });
      }
    } catch {}
    loadedRef.current = true;
  }, []);
  useEffect(() => { if (loadedRef.current) { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {} } }, [prefs]);
  useEffect(() => {
    if (!loadedRef.current) return undefined;
    const t = setTimeout(() => {
      try {
        if (!documents.length) { localStorage.removeItem(DRAFT_KEY); return; }
        const slim = (d, withOriginal) => ({ key: d.key, name: d.name, path: d.path, subject: d.subject, type: d.type, data: d.data, dirty: d.dirty, ...(withOriginal && d.dirty ? { original: d.original } : {}) });
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(documents.map((d) => slim(d, true)))); }
        catch { localStorage.setItem(DRAFT_KEY, JSON.stringify(documents.filter((d) => d.dirty).map((d) => slim(d, false)))); }
      } catch { say('Browser storage is full. Save to the file or download a backup.', 'warn'); }
    }, 700);
    return () => clearTimeout(t);
  }, [documents, say]);
  useEffect(() => {
    if (!documents.some((d) => d.dirty)) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [documents]);

  /* ---- document updates (immutable, with merged history for typing) ---- */
  const updateDoc = useCallback((updater, label = 'Edited', coalesce) => {
    const id = activeRef.current;
    setDocuments((prev) => prev.map((d) => {
      if (d.key !== id) return d;
      const next = updater(d.data);
      if (next === d.data) return d;
      const now = Date.now();
      const last = d.history[d.history.length - 1];
      const merge = coalesce && last && last.coalesce === coalesce && now - last.at < 2500;
      const history = merge ? d.history.map((h, i, a) => (i === a.length - 1 ? { ...h, at: now } : h)) : [...d.history, { at: now, label, coalesce, data: d.data }].slice(-60);
      return { ...d, data: next, history, future: [], dirty: next !== d.original };
    }));
    if (!coalesce) setStatus({ text: label, tone: 'info' });
  }, []);

  const withGroups = (d, fn) => ({ ...d, [gKey]: fn(arr(d[gKey])) });
  const editGroup = (g, fn, label, co) => updateDoc((d) => withGroups(d, (gs) => gs.map((x, i) => (i === g ? fn(x) : x))), label, co);
  const patchRoot = (patch, label, co) => updateDoc((d) => merge(d, patch), label, co && `root.${co}`);
  const patchGroup = (patch, label, co) => editGroup(gi, (g) => merge(g, patch), label, co && `g${gi}.${co}`);
  const patchQuestion = (patch, label, co) => editGroup(gi, (g) => ({ ...g, questions: arr(g.questions).map((q, i) => (i === qi ? merge(q, patch) : q)) }), label, co && `q${gi}.${qi}.${co}`);

  const undo = () => {
    if (!doc?.history.length) return;
    const last = doc.history[doc.history.length - 1];
    setDocuments((prev) => prev.map((d) => (d.key === activeDoc ? { ...d, data: last.data, history: d.history.slice(0, -1), future: [...d.future, { at: Date.now(), label: last.label, data: d.data }], dirty: last.data !== d.original } : d)));
    say(`Undid: ${last.label}`);
  };
  const redo = () => {
    if (!doc?.future.length) return;
    const nx = doc.future[doc.future.length - 1];
    setDocuments((prev) => prev.map((d) => (d.key === activeDoc ? { ...d, data: nx.data, future: d.future.slice(0, -1), history: [...d.history, { at: Date.now(), label: nx.label, data: d.data }], dirty: nx.data !== d.original } : d)));
    say(`Redid: ${nx.label}`);
  };

  /* ---- structure operations ---- */
  const ops = {
    addGroup: () => {
      const at = kind === 'root' ? groups.length : gi + 1;
      const item = isConcepts ? { id: uid('new-section'), title: 'New section', content: '', questions: [] } : { title: 'New chapter', questions: [] };
      updateDoc((d) => withGroups(d, (gs) => insertAt(gs, at, item)), `Added ${noun.toLowerCase()}`);
      setSel({ kind: 'group', gi: at });
    },
    duplicateGroup: (g) => {
      const src = groups[g];
      const copy = JSON.parse(JSON.stringify(src));
      copy.title = `${text(src.title)} (copy)`;
      if (copy.id != null) copy.id = `${copy.id}-copy`;
      arr(copy.questions).forEach((q) => { if (q && q.id != null) q.id = `${q.id}-copy`; });
      updateDoc((d) => withGroups(d, (gs) => insertAt(gs, g + 1, copy)), `Duplicated ${noun.toLowerCase()}`);
      setSel({ kind: 'group', gi: g + 1 });
    },
    deleteGroup: (g) => {
      if (!window.confirm(`Delete this ${noun.toLowerCase()} and its ${arr(groups[g]?.questions).length} question(s)? You can undo with Ctrl+Z.`)) return;
      updateDoc((d) => withGroups(d, (gs) => gs.filter((_, i) => i !== g)), `Deleted ${noun.toLowerCase()}`);
      setSel({ kind: 'group', gi: Math.max(0, g - 1) });
    },
    moveGroup: (g, dir) => {
      const j = g + dir;
      if (j < 0 || j >= groups.length) return;
      updateDoc((d) => withGroups(d, (gs) => { const n = [...gs]; [n[g], n[j]] = [n[j], n[g]]; return n; }), `Moved ${noun.toLowerCase()}`);
      if (kind !== 'root' && gi === g) setSel({ ...sel, gi: j });
    },
    addQuestion: (g = gi) => {
      const target = groups[g];
      if (!target) return;
      const qs = arr(target.questions);
      const at = kind === 'question' && g === gi ? qi + 1 : qs.length;
      const base = kind === 'question' && g === gi ? question : qs[qs.length - 1];
      const q = blankQuestion(base, target, isConcepts, type);
      editGroup(g, (x) => ({ ...x, questions: insertAt(arr(x.questions), at, q) }), 'Added question');
      setSel({ kind: 'question', gi: g, qi: at });
      setCollapsed((c) => ({ ...c, [g]: false }));
    },
    duplicateQuestion: (g, k) => {
      const src = groups[g]?.questions?.[k];
      if (!src) return;
      const copy = JSON.parse(JSON.stringify(src));
      if (copy.id != null) copy.id = suggestId(groups[g], k + 1);
      editGroup(g, (x) => ({ ...x, questions: insertAt(arr(x.questions), k + 1, copy) }), 'Duplicated question');
      setSel({ kind: 'question', gi: g, qi: k + 1 });
    },
    deleteQuestion: (g, k) => {
      if (!window.confirm('Delete this question? You can undo with Ctrl+Z.')) return;
      const n = arr(groups[g]?.questions).length;
      editGroup(g, (x) => ({ ...x, questions: arr(x.questions).filter((_, i) => i !== k) }), 'Deleted question');
      setSel(n > 1 ? { kind: 'question', gi: g, qi: Math.max(0, k - 1) } : { kind: 'group', gi: g });
    },
    moveQuestion: (g, k, dir) => {
      const j = k + dir;
      if (j < 0 || j >= arr(groups[g]?.questions).length) return;
      editGroup(g, (x) => { const qs = [...arr(x.questions)]; [qs[k], qs[j]] = [qs[j], qs[k]]; return { ...x, questions: qs }; }, 'Moved question');
      if (kind === 'question' && gi === g && qi === k) setSel({ kind: 'question', gi: g, qi: j });
    },
    moveQuestionTo: (g, k, to) => {
      const q = groups[g]?.questions?.[k];
      if (!q || !groups[to]) return;
      updateDoc((d) => withGroups(d, (gs) => gs.map((x, i) => {
        if (i === g) return { ...x, questions: arr(x.questions).filter((_, n) => n !== k) };
        if (i === to) return { ...x, questions: [...arr(x.questions), q] };
        return x;
      })), `Moved question to ${groupLabel(groups[to], to, isConcepts)}`);
      setSel({ kind: 'question', gi: to, qi: arr(groups[to].questions).length });
    },
  };

  /* ---- opening files ---- */
  const loadEntries = async (entries) => {
    const loaded = [];
    const problems = [];
    for (const en of entries) {
      try {
        const file = en.file || await en.handle.getFile();
        const parsed = JSON.parse(await file.text());
        if (!isObj(parsed)) throw new Error('Root must be a JSON object.');
        const detected = detectType(en.name, parsed);
        if (detected === 'unknown') throw new Error('Could not identify the schema (needs a "sections" or "chapters" array).');
        const key = `${en.path}:${file.size}:${file.lastModified}`;
        if (en.handle) handlesRef.current[key] = en.handle;
        loaded.push({ key, name: en.name, path: en.path, subject: guessSubject(en.path, parsed), type: detected, data: parsed, original: parsed, history: [], future: [], dirty: false, linked: Boolean(en.handle) });
      } catch (e) { problems.push(`${en.path}: ${e.message}`); }
    }
    if (loaded.length) {
      const clashes = docsRef.current.filter((d) => d.dirty && loaded.some((n) => n.path === d.path));
      if (clashes.length && !window.confirm(`Replace unsaved edits in ${clashes.map((c) => c.path).join(', ')} with the version from disk?`)) { say('Open cancelled; your edits were kept.', 'warn'); return; }
      loaded.sort((a, b) => a.path.localeCompare(b.path));
      setDocuments((prev) => [...prev.filter((d) => !loaded.some((n) => n.path === d.path)), ...loaded]);
      setActiveDoc(loaded[0].key);
      setSel(selMemo.current[loaded[0].key] || { kind: 'group', gi: 0, qi: 0 });
      say(`Opened ${loaded.length} file(s).${problems.length ? ` Skipped: ${problems.join(' | ')}` : ''}`, problems.length ? 'warn' : 'ok');
    } else if (problems.length) say(problems.join(' | '), 'error');
  };

  const importFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    await loadEntries(files.map((f) => ({ file: f, name: f.name, path: f.webkitRelativePath || f.name })));
  };
  const openFiles = async () => {
    try {
      const handles = await window.showOpenFilePicker({ multiple: true, types: [{ description: 'JSON content files', accept: { 'application/json': ['.json'] } }] });
      await loadEntries(handles.map((h) => ({ handle: h, name: h.name, path: h.name })));
    } catch (e) { if (e?.name !== 'AbortError') say(`Could not open files: ${e.message}`, 'error'); }
  };
  const openFolder = async () => {
    try {
      setBusy(true);
      const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
      const found = [];
      await scanDir(dir, `${dir.name}/`, found);
      if (!found.length) { say(`No concepts / DPP / PYQ / practice JSON files found inside “${dir.name}”. Pick your content folder.`, 'warn'); return; }
      await loadEntries(found);
    } catch (e) { if (e?.name !== 'AbortError') say(`Could not open the folder: ${e.message}`, 'error'); } finally { setBusy(false); }
  };
  const linkFile = async () => {
    if (!doc) return;
    try {
      const [h] = await window.showOpenFilePicker({ types: [{ description: 'JSON content file', accept: { 'application/json': ['.json'] } }] });
      handlesRef.current[doc.key] = h;
      setDocuments((prev) => prev.map((d) => (d.key === doc.key ? { ...d, linked: true } : d)));
      say(`Linked to ${h.name}. Save will now write to that file.`, 'ok');
    } catch (e) { if (e?.name !== 'AbortError') say(`Could not link the file: ${e.message}`, 'error'); }
  };
  const newFile = (typeId) => {
    const t = CONTENT_TYPES.find((x) => x.id === typeId);
    const title = window.prompt(`Subject name for the new ${t.full} file:`, '');
    if (!title || !title.trim()) return;
    const subject = title.trim();
    const dataNew = typeId === 'concepts' ? { title: subject, intro: '', sections: [] } : { title: subject, chapters: [] };
    const path = `${slug(subject) || 'new-subject'}/${t.file}`;
    const key = `${path}:new:${Date.now()}`;
    setDocuments((prev) => [...prev, { key, name: t.file, path, subject: subject.toLowerCase(), type: typeId, data: dataNew, original: dataNew, history: [], future: [], dirty: true, linked: false }]);
    setActiveDoc(key);
    setSel({ kind: 'root' });
    say(`Created ${path}. Add ${typeId === 'concepts' ? 'a section' : 'a chapter'} to start.`, 'ok');
  };
  const onDrop = async (e) => {
    e.preventDefault();
    const items = Array.from(e.dataTransfer?.items || []);
    if (items.length && items[0].getAsFileSystemHandle) {
      const pending = items.filter((i) => i.kind === 'file').map((i) => i.getAsFileSystemHandle());
      const handles = (await Promise.all(pending)).filter(Boolean);
      const entries = [];
      for (const h of handles) {
        if (h.kind === 'directory') await scanDir(h, `${h.name}/`, entries);
        else entries.push({ handle: h, name: h.name, path: h.name });
      }
      if (entries.length) { await loadEntries(entries); return; }
    }
    const files = Array.from(e.dataTransfer?.files || []).filter((f) => /\.json$/i.test(f.name));
    if (files.length) await loadEntries(files.map((f) => ({ file: f, name: f.name, path: f.name })));
  };

  /* ---- saving ---- */
  const saveDoc = async (d, { auto = false, download = false } = {}) => {
    if (!d) return;
    const errs = check(d.data, d.type).filter((i) => i.level === 'error');
    if (errs.length) {
      if (auto) return;
      if (!window.confirm(`${errs.length} error(s) found, for example: ${errs[0].msg}\n\nSave anyway?`)) { setPanel('problems'); return; }
    }
    const body = `${JSON.stringify(d.data, null, 2)}\n`;
    const handle = handlesRef.current[d.key];
    try {
      if (handle && !download) {
        await ensureWrite(handle);
        const w = await handle.createWritable();
        await w.write(body);
        await w.close();
        say(`${auto ? 'Auto-saved' : 'Saved'} ${d.path}`, 'ok');
      } else {
        downloadText(d.name, body, 'application/json');
        say(`Downloaded ${d.name}. Replace the matching file under content/ and redeploy.`, 'ok');
      }
      const saved = d.data;
      setDocuments((prev) => prev.map((x) => (x.key === d.key ? { ...x, original: saved, dirty: x.data !== saved, savedAt: Date.now() } : x)));
    } catch (e) { say(`Could not save ${d.path}: ${e.message}`, 'error'); }
  };
  const saveAll = async () => { for (const d of docsRef.current.filter((x) => x.dirty)) await saveDoc(d); };

  useEffect(() => {
    if (!prefs.autosave || !doc?.dirty || !handlesRef.current[doc.key]) return undefined;
    const t = setTimeout(() => saveDoc(doc, { auto: true }), 2000);
    return () => clearTimeout(t);
  }, [prefs.autosave, doc]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeDoc = (key) => {
    const d = documents.find((x) => x.key === key);
    if (d?.dirty && !window.confirm(`${d.path} has unsaved changes. Close it anyway?`)) return;
    delete handlesRef.current[key];
    const rest = documents.filter((x) => x.key !== key);
    setDocuments(rest);
    if (key === activeDoc) { setActiveDoc(rest[0]?.key || ''); setSel(selMemo.current[rest[0]?.key] || { kind: 'group', gi: 0, qi: 0 }); }
  };

  const switchDoc = (key) => {
    if (!key || key === activeDoc) return;
    selMemo.current[activeDoc] = sel;
    setActiveDoc(key);
    setSel(selMemo.current[key] || { kind: 'group', gi: 0, qi: 0 });
    setFilter('');
  };

  /* ---- navigation helpers ---- */
  const goSource = (target, field, start, end) => {
    setMode('visual');
    setSel(target);
    setMobileTab('edit');
    if (target.gi != null) setCollapsed((c) => ({ ...c, [target.gi]: false }));
    setNav({ field, start, end, at: Date.now() });
  };
  useEffect(() => {
    if (!nav) return;
    const pane = editPaneRef.current;
    const el = pane?.querySelector(`[data-editor-field="${nav.field}"]`);
    if (el) {
      if (nav.start != null && typeof el.setSelectionRange === 'function') {
        const len = el.value?.length ?? 0;
        const a = clamp(nav.start, 0, len);
        el.setSelectionRange(a, clamp(nav.end ?? a, a, len));
      }
      revealField(el, pane, nav.start);
      say(nav.start != null ? 'Jumped to that spot in the source. Edit it now.' : `Jumped to “${nav.field.replace('-', ' ')}”.`);
    }
    setNav(null);
  }, [nav, say]);
  const nodes = useMemo(() => {
    const out = [{ kind: 'root' }];
    groups.forEach((g, i) => { out.push({ kind: 'group', gi: i }); arr(g?.questions).forEach((_, k) => out.push({ kind: 'question', gi: i, qi: k })); });
    return out;
  }, [groups]);
  const step = (d) => {
    const at = nodes.findIndex((n) => n.kind === kind && (kind === 'root' || (n.gi === gi && (kind === 'group' || n.qi === qi))));
    const nx = nodes[at + d];
    if (nx) setSel(nx);
  };
  const choose = (s) => { setSel(s); if (s.gi != null) setCollapsed((c) => ({ ...c, [s.gi]: false })); setMobileTab('edit'); };
  const jump = (it) => {
    if (it.gi == null) choose({ kind: 'root' });
    else if (it.qi == null) choose({ kind: 'group', gi: it.gi });
    else choose({ kind: 'question', gi: it.gi, qi: it.qi });
  };
  const revertItem = (c) => {
    if (c.gi == null || !c.orig) return;
    if (c.qi == null) editGroup(c.gi, (g) => ({ ...c.orig, questions: g.questions }), 'Reverted item');
    else editGroup(c.gi, (g) => ({ ...g, questions: arr(g.questions).map((q, i) => (i === c.qi ? c.orig : q)) }), 'Reverted item');
  };

  actionsRef.current = { save: () => saveDoc(doc), download: () => saveDoc(doc, { download: true }), undo, redo, step };
  useEffect(() => {
    const h = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const typing = ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement?.tagName);
      const a = actionsRef.current;
      if (mod && k === 's') { e.preventDefault(); if (e.shiftKey) a.download(); else a.save(); }
      else if (mod && e.shiftKey && k === 'f') { e.preventDefault(); setPanel('find'); }
      else if (mod && !typing && k === 'z') { e.preventDefault(); if (e.shiftKey) a.redo(); else a.undo(); }
      else if (mod && !typing && k === 'y') { e.preventDefault(); a.redo(); }
      else if (e.altKey && e.key === 'PageDown') { e.preventDefault(); a.step(1); }
      else if (e.altKey && e.key === 'PageUp') { e.preventDefault(); a.step(-1); }
      else if (e.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ---- split-pane dragging ---- */
  const startDrag = (e) => {
    e.preventDefault();
    const box = mainRef.current?.getBoundingClientRect();
    if (!box) return;
    const side = prefs.layout === 'side';
    const move = (ev) => setPref('split', Math.round(clamp(((side ? ev.clientX - box.left : ev.clientY - box.top) / (side ? box.width : box.height)) * 100, 30, 80)));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); document.body.classList.remove('is-resizing'); };
    document.body.classList.add('is-resizing');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /* ---- layout bits ---- */
  const subjects = useMemo(() => [...new Set(documents.map((d) => d.subject))], [documents]);
  const siblings = doc ? documents.filter((d) => d.subject === doc.subject).sort((a, b) => CONTENT_TYPES.findIndex((t) => t.id === a.type) - CONTENT_TYPES.findIndex((t) => t.id === b.type)) : [];
  const dirtyCount = documents.filter((d) => d.dirty).length;
  const showOutline = prefs.outline;
  const showPreview = prefs.preview;
  const mainStyle = prefs.layout === 'side'
    ? { gridTemplateColumns: showPreview ? `minmax(0, ${prefs.split}fr) 10px minmax(0, ${100 - prefs.split}fr)` : 'minmax(0, 1fr)' }
    : { gridTemplateRows: showPreview ? `minmax(0, ${prefs.split}fr) 10px minmax(0, ${100 - prefs.split}fr)` : 'minmax(0, 1fr)' };

  const editorBody = !doc ? null : mode === 'json'
    ? <RawJson big label="Complete document JSON" hint="Advanced: every field of this file" value={data} onApply={(v) => { const found = check(v, type).filter((i) => i.level === 'error'); if (found.length) return `Not applied: ${found[0].msg}${found.length > 1 ? ` (+${found.length - 1} more)` : ''}`; updateDoc(() => v, 'Edited document JSON'); return ''; }} />
    : kind === 'root'
      ? <RootEditor key="root" data={data} gKey={gKey} isConcepts={isConcepts} doc={doc} issues={issues} prefs={prefs} patchRoot={patchRoot} applyRoot={(v) => updateDoc((d) => ({ ...v, [gKey]: d[gKey] }), 'Edited document fields')} />
      : kind === 'group'
        ? <GroupEditor key={`g${gi}`} g={group} gi={gi} isConcepts={isConcepts} noun={noun} patch={patchGroup} ops={ops} prefs={prefs} />
        : <QuestionEditor key={`q${gi}.${qi}`} q={question} gi={gi} qi={qi} groups={groups} isConcepts={isConcepts} patch={patchQuestion} ops={ops} prefs={prefs} />;

  const crumb = kind === 'root' ? 'Document settings' : kind === 'group' ? groupLabel(group, gi, isConcepts) : `${groupLabel(group, gi, isConcepts)} / Question ${qi + 1}`;
  const saveLabel = doc?.linked ? 'Save to file' : 'Download JSON';
  const saveState = !doc ? '' : doc.dirty ? 'Unsaved changes' : doc.savedAt ? `Saved ${new Date(doc.savedAt).toLocaleTimeString()}` : 'No changes';

  return <div className="page concept-editor-page ce" style={{ '--ce-fs': `${prefs.fontSize}px` }} data-mono={prefs.mono ? 'on' : 'off'} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
    <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden onChange={importFiles} />

    {/* ---- file bar ---- */}
    <div className="ce-bar">
      <div className="ce-bar-group">
        {fsOk && <button type="button" className="btn btn-small" onClick={openFolder} disabled={busy} title="Pick your project's content/ folder. Every subject loads at once and saves straight back to disk."><Icon name="folder" size={14} /> Open content folder</button>}
        <button type="button" className="btn btn-ghost btn-small" onClick={fsOk ? openFiles : () => fileRef.current?.click()}><Icon name="file" size={14} /> {fsOk ? 'Open files' : 'Import files'}</button>
        <label className="ce-newfile"><span className="ce-sr">New file</span>
          <select className="btn btn-ghost btn-small" value="" aria-label="New file" onChange={(e) => { if (e.target.value) newFile(e.target.value); e.target.value = ''; }}>
            <option value="">+ New file…</option>
            {CONTENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.full}</option>)}
          </select>
        </label>
      </div>
      {doc && <div className="ce-bar-group ce-files">
        <label className="ce-subject"><span className="ce-sr">Subject</span>
          <select className="ce-input" value={doc.subject} aria-label="Subject" onChange={(e) => { const next = documents.find((d) => d.subject === e.target.value && d.type === doc.type) || documents.find((d) => d.subject === e.target.value); if (next) switchDoc(next.key); }}>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div className="ce-types" role="tablist" aria-label="Content type">
          {siblings.map((d) => <span key={d.key} className={`ce-type ${d.key === activeDoc ? 'is-active' : ''}`}>
            <button type="button" role="tab" aria-selected={d.key === activeDoc} title={d.path} onClick={() => switchDoc(d.key)}>{CONTENT_TYPES.find((t) => t.id === d.type)?.label}{d.dirty && <span className="ce-dot is-changed" title="Unsaved changes" />}</button>
            <button type="button" className="ce-type-x" aria-label={`Close ${d.path}`} onClick={() => closeDoc(d.key)}><Icon name="x" size={12} /></button>
          </span>)}
        </div>
      </div>}
    </div>

    {!doc ? <div className="ce-empty">
      <h1>Content Editor</h1>
      <p>Edit concepts, DPP, PYQ and practice-question files in one place, with a live preview.</p>
      <div className="ce-empty-actions">
        {fsOk && <button type="button" className="btn" onClick={openFolder} disabled={busy}><Icon name="folder" /> Open content folder</button>}
        <button type="button" className="btn btn-ghost" onClick={fsOk ? openFiles : () => fileRef.current?.click()}><Icon name="file" /> {fsOk ? 'Open JSON files' : 'Import JSON files'}</button>
      </div>
      <p className="ce-hint">{fsOk ? 'Pick the content/ folder of your project and every subject opens together. Ctrl+S then saves straight back into the files.' : 'This browser cannot write into your files directly, so you will download each updated file and replace it under content/. Chrome or Edge on a computer can save straight to disk.'}</p>
      <p className="ce-hint">You can also drag and drop files or folders onto this page.</p>
      <p className={`ce-status-line is-${status.tone}`} role="status">{status.text}</p>
    </div> : <>
      {/* ---- action bar ---- */}
      <div className="ce-actions" role="toolbar" aria-label="Editor actions">
        <button type="button" className="btn btn-primary btn-small" onClick={() => saveDoc(doc)}><Icon name={doc.linked ? 'save' : 'download'} size={14} /> {saveLabel}</button>
        {doc.linked && <IconBtn icon="download" label="Download a copy (Ctrl+Shift+S)" onClick={() => saveDoc(doc, { download: true })} />}
        {!doc.linked && fsOk && <button type="button" className="btn btn-ghost btn-small" onClick={linkFile} title="Choose the file on disk this draft belongs to"><Icon name="link" size={14} /> Link file</button>}
        {dirtyCount > 1 && <button type="button" className="btn btn-ghost btn-small" onClick={saveAll}>Save all ({dirtyCount})</button>}
        <span className="ce-sep" />
        <IconBtn icon="undo" label={doc.history.length ? `Undo: ${doc.history[doc.history.length - 1].label}` : 'Nothing to undo'} onClick={undo} disabled={!doc.history.length} />
        <IconBtn icon="redo" label={doc.future.length ? `Redo: ${doc.future[doc.future.length - 1].label}` : 'Nothing to redo'} onClick={redo} disabled={!doc.future.length} />
        <span className="ce-sep" />
        <IconBtn icon="search" label="Find and replace (Ctrl+Shift+F)" active={panel === 'find'} onClick={() => setPanel(panel === 'find' ? null : 'find')} />
        <IconBtn icon="history" label="Changes since last save" active={panel === 'changes'} onClick={() => setPanel(panel === 'changes' ? null : 'changes')}>{changes.length > 0 && <span className="ce-badge">{changes.length}</span>}</IconBtn>
        <IconBtn icon="alert" label="Problems" active={panel === 'problems'} onClick={() => setPanel(panel === 'problems' ? null : 'problems')}>{issues.length > 0 && <span className={`ce-badge ${errorCount ? 'is-error' : 'is-warn'}`}>{issues.length}</span>}</IconBtn>
        <span className="ce-grow" />
        <div className="ce-seg" role="group" aria-label="Editor mode"><button type="button" aria-pressed={mode === 'visual'} onClick={() => setMode('visual')}>Fields</button><button type="button" aria-pressed={mode === 'json'} onClick={() => setMode('json')}>JSON</button></div>
        <IconBtn icon="panelL" label="Show or hide outline" active={prefs.outline} onClick={() => setPref('outline', !prefs.outline)} />
        <IconBtn icon={prefs.layout === 'side' ? 'cols' : 'rows'} label={prefs.layout === 'side' ? 'Preview below editor' : 'Preview beside editor'} onClick={() => setPref('layout', prefs.layout === 'side' ? 'stacked' : 'side')} />
        <IconBtn icon="panelR" label="Show or hide preview" active={prefs.preview} onClick={() => setPref('preview', !prefs.preview)} />
        <IconBtn icon="sliders" label="Preferences" active={panel === 'settings'} onClick={() => setPanel(panel === 'settings' ? null : 'settings')} />
        <IconBtn icon="help" label="Shortcuts and tips (Esc closes)" active={panel === 'help'} onClick={() => setPanel(panel === 'help' ? null : 'help')} />
      </div>

      <div className="ce-mtabs" role="tablist" aria-label="Panels">
        {[['outline', 'Outline'], ['edit', 'Edit'], ['preview', 'Preview']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={mobileTab === k} className={mobileTab === k ? 'is-active' : ''} onClick={() => { setMobileTab(k); if (k === 'preview') setPref('preview', true); if (k === 'outline') setPref('outline', true); }}>{l}</button>)}
      </div>

      {/* ---- workspace ---- */}
      <div className={`ce-work ${showOutline ? '' : 'no-outline'}`} data-tab={mobileTab}>
        {showOutline && <div className="ce-pane ce-pane-outline"><Outline data={data} gKey={gKey} isConcepts={isConcepts} noun={noun} kind={kind} gi={gi} qi={qi} setSel={choose} filter={filter} setFilter={setFilter} issueMap={issueMap} changedSet={changedSet} collapsed={collapsed} toggle={(i) => setCollapsed((c) => ({ ...c, [i]: !c[i] }))} ops={ops} /></div>}
        <div ref={mainRef} className={`ce-main is-${prefs.layout}`} style={mainStyle}>
          <section className="ce-pane ce-pane-edit" aria-label="Editor">
            <div className="ce-pane-head">
              <div className="ce-crumb"><span className="ce-crumb-text" title={crumb}>{crumb}</span>{kind === 'question' && <span className="ce-tag">{question?.type || '?'}</span>}</div>
              <span className="ce-grow" />
              <IconBtn icon="up" label="Previous item (Alt+Page Up)" onClick={() => step(-1)} />
              <IconBtn icon="down" label="Next item (Alt+Page Down)" onClick={() => step(1)} />
            </div>
            <div className="ce-pane-scroll" ref={editPaneRef}>{editorBody}</div>
          </section>
          {showPreview && <div className={`ce-splitter ${prefs.layout === 'side' ? 'is-v' : 'is-h'}`} role="separator" tabIndex={0} aria-orientation={prefs.layout === 'side' ? 'vertical' : 'horizontal'} aria-label="Resize editor and preview" onPointerDown={startDrag} onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setPref('split', clamp(prefs.split - 5, 30, 80)); if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setPref('split', clamp(prefs.split + 5, 30, 80)); }} />}
          {showPreview && <aside className="ce-pane ce-pane-preview" aria-label="Live preview">
            <div className="ce-pane-head">
              <div className="ce-seg" role="group" aria-label="Preview type"><button type="button" aria-pressed={pvTab === 'render'} onClick={() => setPvTab('render')}>Preview</button><button type="button" aria-pressed={pvTab === 'json'} onClick={() => setPvTab('json')}>JSON</button></div>
              <span className="ce-hint ce-hide-sm">Click any block to edit its source</span>
              <span className="ce-grow" />
              <label className="ce-check"><input type="checkbox" checked={prefs.answers} onChange={(e) => setPref('answers', e.target.checked)} /> Answers</label>
            </div>
            <div className="ce-pane-scroll ce-preview">
              {pvTab === 'json'
                ? <pre className="json-inspector">{JSON.stringify(pvKind === 'root' ? pvData : pvKind === 'group' ? { ...pvGroup, questions: undefined } : pvQuestion, null, 2)}</pre>
                : <PreviewBody kind={pvKind} data={pvData} group={pvGroup} question={pvQuestion} gi={pvGi} qi={pvQi} isConcepts={isConcepts} noun={noun} showAnswers={prefs.answers} onNav={goSource} />}
            </div>
          </aside>}
        </div>

        {panel && <Drawer title={{ problems: `Problems (${errorCount} errors, ${warnCount} warnings)`, find: 'Find and replace', changes: 'Changes since last save', settings: 'Preferences', help: 'Shortcuts and tips' }[panel]} onClose={() => setPanel(null)}>
          {panel === 'problems' && <ProblemsPanel issues={issues} onJump={(it) => { jump(it); setPanel(null); }} />}
          {panel === 'changes' && <ChangesPanel changes={changes} dirty={doc.dirty} onJump={jump} onRevertItem={revertItem} onRevertAll={() => { if (window.confirm('Discard every change since the last save?')) updateDoc(() => doc.original, 'Reverted file'); }} />}
          {panel === 'find' && <FindPanel data={data} gKey={gKey} kind={kind} gi={gi} qi={qi} isConcepts={isConcepts} onApply={(next, label) => updateDoc(() => next, label)} onJump={jump} />}
          {panel === 'settings' && <SettingsPanel prefs={prefs} setPref={setPref} fsOk={fsOk} />}
          {panel === 'help' && <HelpPanel />}
        </Drawer>}
      </div>

      {/* ---- status bar ---- */}
      <div className="ce-statusbar">
        <span className={`ce-status-line is-${status.tone}`} role="status">{status.text}</span>
        <span className="ce-grow" />
        <span className={`ce-pill ${doc.dirty ? 'is-warn' : 'is-ok'}`}>{saveState}</span>
        <span className="ce-pill">{doc.linked ? 'Linked to file' : 'Download mode'}</span>
        <button type="button" className={`ce-pill ce-pill-btn ${errorCount ? 'is-error' : warnCount ? 'is-warn' : 'is-ok'}`} onClick={() => setPanel('problems')}>{errorCount} errors, {warnCount} warnings</button>
      </div>
    </>}
  </div>;
}
