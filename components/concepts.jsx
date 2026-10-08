'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Concepts page driven by content/<subject>/concepts.json
 *
 *  {
 *    "intro": "optional markdown shown under the 'Intro' tab",
 *    "sections": [
 *      {
 *        "id": "pointers",                 // unique, used in the URL (#pointers)
 *        "title": "Chapter 12 — Pointers", // heading of the chapter
 *        "short": "Pointers",              // optional, label on the chapter tab
 *        "summary": "optional one-liner",
 *        "content": "markdown ...",        // the concepts
 *        "keyPoints": ["optional", "bullets"],
 *        "questions": [ ... ]              // optional, same format as practice-questions.json
 *      }
 *    ]
 *  }
 *
 * Questions are shown right below the concepts of the same chapter.
 * Answers given here are kept only while the page is open and do NOT change the
 * dashboard counters (those belong to the Practice page).
 */

const LETTERS = 'ABCDEFGH';
const INTRO_ID = 'intro';

const secId = (s, i) => String(s.id || `section-${i + 1}`);
const qKey = (sid, q, qi) => `${sid}:${q.id ?? qi + 1}`;

// mcq (one correct) | msq (one or more correct) | nat (numerical) | text (self-check)
function kindOf(q) {
  const hasOptions = Array.isArray(q.options) && q.options.length > 1;
  const t = String(q.type || '').toLowerCase();
  if (t === 'nat') return 'nat';
  if (hasOptions && (t === 'msq' || (!t && Array.isArray(q.answer)))) return 'msq';
  if (hasOptions && (t === 'mcq' || !t)) return 'mcq';
  return 'text';
}

function sameSet(a, b) {
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

function checkNat(q, input) {
  const text = String(input ?? '').trim();
  const v = Number(text);
  if (text === '' || Number.isNaN(v)) return false;
  if (Array.isArray(q.range) && q.range.length === 2) return v >= q.range[0] && v <= q.range[1];
  return Math.abs(v - Number(q.answer)) <= Number(q.tolerance || 0) + 1e-9;
}

function answerText(q, kind) {
  const opt = (i) => `${LETTERS[i]}. ${q.options?.[i] ?? ''}`;
  if (kind === 'mcq' && typeof q.answer === 'number') return opt(q.answer);
  if (kind === 'msq' && Array.isArray(q.answer)) return q.answer.map(opt).join(';  ');
  if (kind === 'nat') return Array.isArray(q.range) ? `${q.range[0]} to ${q.range[1]}` : String(q.answer);
  return String(q.answer ?? '');
}

function QuestionCard({ q, num, k, r, visible, update, toggleSolution, retry }) {
  const kind = kindOf(q);
  const answers = kind === 'mcq' ? [q.answer] : kind === 'msq' ? q.answer || [] : [];
  const label = q.tag || (kind === 'text' ? '' : kind.toUpperCase());
  const touched = Boolean(r.checked) || (Array.isArray(r.sel) ? r.sel.length > 0 : r.sel !== undefined && r.sel !== '');

  const finish = (ok, extra = {}) => update(k, { ...extra, checked: true, correct: ok });
  const pickMcq = (oi) => finish(oi === q.answer, { sel: oi });
  const toggleMsq = (oi) => {
    const cur = r.sel || [];
    update(k, { sel: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi] });
  };
  const checkMsq = () => finish(sameSet(r.sel || [], q.answer || []));
  const checkNatQ = () => finish(checkNat(q, r.sel));

  return (
    <li id={`cq-${k}`} className={`q-card ${r.checked ? (r.correct ? 'is-correct' : 'is-wrong') : ''}`}>
      <div className="q-num">{num}</div>
      <div className="q-body">
        <div className="q-tags">
          {label && <span className="tag">{label}</span>}
          {q.marks && (
            <span className="tag">
              {q.marks} mark{q.marks > 1 ? 's' : ''}
            </span>
          )}
          {q.source && <span className="tag tag-soft">{q.source}</span>}
          {r.checked && (
            <span className={`tag ${r.correct ? 'tag-ok' : 'tag-bad'}`}>{r.correct ? '✓ Correct' : '✗ Wrong'}</span>
          )}
        </div>

        {q.title && <p className="q-title">{q.title}</p>}
        <MarkdownRenderer content={q.question || ''} className="compact" />

        {(kind === 'mcq' || kind === 'msq') && (
          <div className="options" role="group" aria-label="Options">
            {q.options.map((opt, oi) => {
              const selected = kind === 'mcq' ? r.sel === oi : (r.sel || []).includes(oi);
              let state = '';
              if (r.checked) {
                if (answers.includes(oi)) state = 'correct';
                else if (selected) state = 'wrong';
              } else if (selected) state = 'selected';
              return (
                <button
                  key={oi}
                  type="button"
                  className={`option ${state}`}
                  disabled={Boolean(r.checked)}
                  aria-pressed={kind === 'msq' ? selected : undefined}
                  onClick={() => (kind === 'mcq' ? pickMcq(oi) : toggleMsq(oi))}
                >
                  <span className="letter">{LETTERS[oi]}</span>
                  <MarkdownRenderer content={String(opt)} className="compact" />
                </button>
              );
            })}
          </div>
        )}

        {kind === 'msq' && !r.checked && (
          <button type="button" className="btn" disabled={!(r.sel || []).length} onClick={checkMsq}>
            Check answer
          </button>
        )}

        {kind === 'nat' && (
          <div className="nat-row">
            <input
              className="nat-input"
              type="text"
              inputMode="decimal"
              placeholder="Type your answer"
              aria-label="Numerical answer"
              value={r.sel ?? ''}
              disabled={Boolean(r.checked)}
              onChange={(e) => update(k, { sel: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && !r.checked && checkNatQ()}
            />
            {!r.checked && (
              <button type="button" className="btn" onClick={checkNatQ}>
                Check
              </button>
            )}
          </div>
        )}

        {r.checked && (
          <p className={`verdict ${r.correct ? 'ok' : 'bad'}`} role="status">
            {r.correct ? '✓ Correct' : '✗ Incorrect'}
            {kind === 'nat' && !r.correct && <span className="muted"> · Correct answer: {answerText(q, kind)}</span>}
          </p>
        )}

        <div className="q-actions">
          <button type="button" className="btn btn-ghost" onClick={() => toggleSolution(k)} aria-expanded={visible}>
            {visible ? 'Hide solution' : 'Show solution'}
          </button>
          {touched && (
            <button type="button" className="btn btn-ghost" onClick={() => retry(k)}>
              Try again
            </button>
          )}
        </div>

        {visible && (
          <div className="solution">
            <MarkdownRenderer className="compact" content={`**Answer:** ${answerText(q, kind)}`} />
            {q.solution && <MarkdownRenderer content={q.solution} className="compact" />}
          </div>
        )}
      </div>
    </li>
  );
}

export default function Concepts({ data }) {
  const pathname = usePathname();
  const sections = useMemo(() => (Array.isArray(data?.sections) ? data.sections : []), [data]);
  const hasIntro = Boolean(data?.intro);

  // One tab per chapter (+ optional Intro tab first).
  const tabs = useMemo(
    () => [
      ...(hasIntro ? [{ id: INTRO_ID, label: 'Intro' }] : []),
      ...sections.map((s, i) => ({ id: secId(s, i), label: `${i + 1}. ${s.short || s.title}`, section: s })),
    ],
    [sections, hasIntro]
  );

  const storeKey = `gate-concepts-last:${pathname}`;
  const firstId = sections.length ? secId(sections[0], 0) : hasIntro ? INTRO_ID : null;
  const [activeId, setActiveId] = useState(firstId);
  const [resp, setResp] = useState({}); // question key -> { sel, checked, correct } (this visit only)
  const [shown, setShown] = useState({}); // question key -> solution visible
  const topRef = useRef(null);

  // Open the chapter from the URL (#chapter-id), or the one you read last time.
  useEffect(() => {
    const valid = (id) => Boolean(id) && tabs.some((t) => t.id === id);
    const fromHash = () => {
      try {
        return decodeURIComponent(window.location.hash.replace(/^#/, ''));
      } catch {
        return '';
      }
    };
    let saved = null;
    try {
      saved = localStorage.getItem(storeKey);
    } catch {}
    const h = fromHash();
    const next = valid(h) ? h : valid(saved) ? saved : null;
    if (next) setActiveId(next);

    const onHash = () => {
      const id = fromHash();
      if (valid(id)) setActiveId(id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [tabs, storeKey]);

  // Keep the selected chapter tab visible in the horizontal tab bar.
  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`concept-tab-${activeId}`);
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [activeId]);

  const go = useCallback(
    (id) => {
      setActiveId(id);
      try {
        window.history.replaceState(null, '', `#${encodeURIComponent(id)}`);
      } catch {}
      try {
        localStorage.setItem(storeKey, id);
      } catch {}
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start' }));
    },
    [storeKey]
  );

  const update = useCallback((k, patch) => setResp((p) => ({ ...p, [k]: { ...p[k], ...patch } })), []);
  const toggleSolution = useCallback((k) => setShown((p) => ({ ...p, [k]: !p[k] })), []);
  const dropKeys = (keys) => {
    const drop = (obj) => Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));
    setResp(drop);
    setShown(drop);
  };
  const retry = useCallback((k) => dropKeys([k]), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (tabs.length === 0) return <p className="empty">No concepts found in this file.</p>;

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeId));
  const active = tabs[activeIndex];
  const prev = tabs[activeIndex - 1];
  const next = tabs[activeIndex + 1];
  const section = active.section;
  const sid = active.id;
  const questions = section && Array.isArray(section.questions) ? section.questions : [];

  const countFor = (id, qs) => {
    let attempted = 0;
    let correct = 0;
    qs.forEach((q, qi) => {
      const r = resp[qKey(id, q, qi)];
      if (r && r.checked) {
        attempted++;
        if (r.correct) correct++;
      }
    });
    return { attempted, correct, total: qs.length };
  };
  const cur = countFor(sid, questions);
  const totalMarks = questions.reduce((a, q) => a + (Number(q.marks) || 0), 0);

  const resetChapter = () => {
    if (!window.confirm('Clear your answers for this chapter?')) return;
    dropKeys(questions.map((q, qi) => qKey(sid, q, qi)));
  };

  return (
    <div className="concepts">
      <div
        style={{
          position: 'sticky',
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          zIndex: 5,
          background: 'var(--bg)',
          padding: '8px 0 0',
          marginBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="chapter-tabs" role="tablist" aria-label="Chapters">
          {tabs.map((t) => {
            const qs = t.section && Array.isArray(t.section.questions) ? t.section.questions : [];
            const n = countFor(t.id, qs);
            return (
              <button
                key={t.id}
                id={`concept-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={t.id === active.id}
                className={`chip ${t.id === active.id ? 'active' : ''}`}
                onClick={() => go(t.id)}
              >
                {t.label}
                {qs.length > 0 && (
                  <span className="chip-count">
                    {n.attempted}/{n.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <article key={active.id} ref={topRef} style={{ scrollMarginTop: 'calc(124px + env(safe-area-inset-top, 0px))' }}>
        {active.id === INTRO_ID ? (
          <MarkdownRenderer content={data.intro} />
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>{section.title}</h2>
            {section.summary && <p className="muted">{section.summary}</p>}
            <MarkdownRenderer content={section.content || ''} />
            {Array.isArray(section.keyPoints) && section.keyPoints.length > 0 && (
              <ul className="key-points">
                {section.keyPoints.map((p, j) => (
                  <li key={j}>
                    <MarkdownRenderer content={p} className="compact" />
                  </li>
                ))}
              </ul>
            )}

            {questions.length > 0 && (
              <section className="concept" aria-label="Practice questions">
                <h3 style={{ margin: '0 0 4px' }}>
                  Practice questions{' '}
                  <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>
                    · {questions.length} question{questions.length > 1 ? 's' : ''}
                    {totalMarks ? ` · ${totalMarks} marks` : ''}
                  </span>
                </h3>
                <div className="quiz-bar">
                  <span className="muted" aria-live="polite">
                    Attempted {cur.attempted}/{cur.total} · Correct {cur.correct} · Wrong {cur.attempted - cur.correct}
                  </span>
                  <button type="button" className="btn btn-ghost" onClick={resetChapter}>
                    Reset answers
                  </button>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${cur.total ? (cur.attempted / cur.total) * 100 : 0}%` }} />
                </div>
                <ol className="questions" style={{ marginTop: 16 }}>
                  {questions.map((q, qi) => {
                    const k = qKey(sid, q, qi);
                    return (
                      <QuestionCard
                        key={k}
                        q={q}
                        num={qi + 1}
                        k={k}
                        r={resp[k] || {}}
                        visible={Boolean(shown[k])}
                        update={update}
                        toggleSolution={toggleSolution}
                        retry={retry}
                      />
                    );
                  })}
                </ol>
              </section>
            )}
          </>
        )}

        <nav aria-label="Chapter navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 32 }}>
          {prev ? (
            <button type="button" className="btn" onClick={() => go(prev.id)}>
              ← {prev.label}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button type="button" className="btn" onClick={() => go(next.id)}>
              {next.label} →
            </button>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  );
}
