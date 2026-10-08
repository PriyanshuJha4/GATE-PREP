'use client';

import { useCallback, useEffect, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { useProgress } from './ProgressProvider';

const LETTERS = 'ABCDEFGH';

function normalise(data) {
  if (Array.isArray(data?.chapters) && data.chapters.length) return data.chapters;
  if (Array.isArray(data?.questions)) return [{ title: 'All questions', questions: data.questions }];
  return [];
}

// GATE question types: mcq (one correct), msq (one or more correct), nat (numerical), text (self-check).
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

export default function Quiz({ data, subject }) {
  const { results, setResult, clearResults } = useProgress();
  const chapters = normalise(data);
  const [active, setActive] = useState('all'); // 'all' or a chapter index
  const [resp, setResp] = useState({}); // question key -> { sel, checked, correct } (this visit only)
  const [shown, setShown] = useState({}); // question key -> solution visible

  const qid = (q, ci, qi) => String(q.id ?? `${ci + 1}-${qi + 1}`);
  const keyOf = (q, ci, qi) => `${subject}:${qid(q, ci, qi)}`;

  // Open the chapter / scroll to the question given in the URL (#q-<id>), e.g. from the dashboard.
  const goToHash = useCallback(() => {
    const m = window.location.hash.match(/^#q-(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    const ci = chapters.findIndex((c, i) => (c.questions || []).some((q, qi) => qid(q, i, qi) === id));
    if (ci < 0) return;
    setActive((prev) => (prev === 'all' ? 'all' : ci));
    setTimeout(() => document.getElementById(`q-${id}`)?.scrollIntoView({ block: 'start' }), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    goToHash();
    window.addEventListener('hashchange', goToHash);
    return () => window.removeEventListener('hashchange', goToHash);
  }, [goToHash]);

  if (chapters.length === 0) return <p className="empty">No questions found in this file.</p>;

  // Which chapters are currently shown: all of them, or just the selected one.
  const view =
    active === 'all'
      ? chapters.map((c, ci) => ({ c, ci }))
      : [{ c: chapters[active] || chapters[0], ci: chapters[active] ? active : 0 }];

  const countFor = (c, ci) => {
    let solved = 0;
    let correct = 0;
    (c.questions || []).forEach((q, qi) => {
      const r = results[keyOf(q, ci, qi)];
      if (r) solved++;
      if (r === 'c') correct++;
    });
    return { solved, correct, total: (c.questions || []).length };
  };
  const sum = (items) =>
    items.reduce(
      (a, { c, ci }) => {
        const n = countFor(c, ci);
        return { solved: a.solved + n.solved, correct: a.correct + n.correct, total: a.total + n.total };
      },
      { solved: 0, correct: 0, total: 0 }
    );
  const cur = sum(view);
  const allCount = sum(chapters.map((c, ci) => ({ c, ci })));

  const patch = (key, p) => setResp((r) => ({ ...r, [key]: { ...r[key], ...p } }));
  const finish = (key, q, ok) => {
    patch(key, { checked: true, correct: ok });
    setResult(key, ok ? 'c' : 'w');
  };

  const pickMcq = (key, q, oi) => {
    patch(key, { sel: oi });
    finish(key, q, oi === q.answer);
  };
  const toggleMsq = (key, oi) =>
    setResp((r) => {
      const c = r[key]?.sel || [];
      const sel = c.includes(oi) ? c.filter((x) => x !== oi) : [...c, oi];
      return { ...r, [key]: { ...r[key], sel } };
    });
  const checkMsq = (key, q) => finish(key, q, sameSet(resp[key]?.sel || [], q.answer || []));
  const checkNatQ = (key, q) => finish(key, q, checkNat(q, resp[key]?.sel));

  const resetView = () => {
    const label = active === 'all' ? 'all chapters' : 'this chapter';
    if (!window.confirm(`Clear saved results and answers for ${label}?`)) return;
    const keys = new Set(view.flatMap(({ c, ci }) => (c.questions || []).map((q, qi) => keyOf(q, ci, qi))));
    clearResults([...keys]);
    const clear = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.has(k)));
    setResp(clear);
    setShown(clear);
  };

  return (
    <div className="quiz">
      {data.title && <p className="muted quiz-title">{data.title}</p>}

      <div className="chapter-tabs" role="tablist" aria-label="Chapters">
        <button
          role="tab"
          aria-selected={active === 'all'}
          className={`chip ${active === 'all' ? 'active' : ''}`}
          onClick={() => setActive('all')}
        >
          All questions
          <span className="chip-count">
            {allCount.solved}/{allCount.total}
          </span>
        </button>
        {chapters.map((c, i) => {
          const n = countFor(c, i);
          return (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              className={`chip ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              {c.title}
              <span className="chip-count">
                {n.solved}/{n.total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="quiz-bar">
        <span className="muted" aria-live="polite">
          Solved {cur.solved}/{cur.total} · Correct {cur.correct} · Wrong {cur.solved - cur.correct}
        </span>
        <button className="btn btn-ghost" onClick={resetView}>
          {active === 'all' ? 'Reset all' : 'Reset chapter'}
        </button>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${cur.total ? (cur.solved / cur.total) * 100 : 0}%` }} />
      </div>

      {view.map(({ c, ci }) => (
        <section key={ci} className="q-section">
          {active === 'all' && (
            <h2 className="q-section-title">
              {c.title}
              <span className="muted">
                {' '}
                {countFor(c, ci).solved}/{(c.questions || []).length} solved
              </span>
            </h2>
          )}
          <ol className="questions">
            {(c.questions || []).map((q, qi) => {
          const key = keyOf(q, ci, qi);
          const id = qid(q, ci, qi);
          const kind = kindOf(q);
          const r = resp[key] || {};
          const saved = results[key];
          const visible = Boolean(shown[key]);
          const answers = kind === 'mcq' ? [q.answer] : kind === 'msq' ? q.answer || [] : [];

          return (
            <li key={key} id={`q-${id}`} className={`q-card ${saved ? (saved === 'c' ? 'is-correct' : 'is-wrong') : ''}`}>
              <div className="q-num">{qi + 1}</div>
              <div className="q-body">
                <div className="q-tags">
                  {kind !== 'text' && <span className="tag">{kind.toUpperCase()}</span>}
                  {q.marks && (
                    <span className="tag">
                      {q.marks} mark{q.marks > 1 ? 's' : ''}
                    </span>
                  )}
                  {q.source && <span className="tag tag-soft">{q.source}</span>}
                  {saved && (
                    <span className={`tag ${saved === 'c' ? 'tag-ok' : 'tag-bad'}`}>
                      {saved === 'c' ? '✓ Solved: correct' : '✗ Solved: wrong'}
                    </span>
                  )}
                </div>

                {q.title && <p className="q-title">{q.title}</p>}
                <MarkdownRenderer content={q.question} className="compact" />

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
                          className={`option ${state}`}
                          disabled={r.checked}
                          aria-pressed={kind === 'msq' ? selected : undefined}
                          onClick={() => (kind === 'mcq' ? pickMcq(key, q, oi) : toggleMsq(key, oi))}
                        >
                          <span className="letter">{LETTERS[oi]}</span>
                          <MarkdownRenderer content={String(opt)} className="compact" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {kind === 'msq' && !r.checked && (
                  <button className="btn" disabled={!(r.sel || []).length} onClick={() => checkMsq(key, q)}>
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
                      disabled={r.checked}
                      onChange={(e) => patch(key, { sel: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && !r.checked && checkNatQ(key, q)}
                    />
                    {!r.checked && (
                      <button className="btn" onClick={() => checkNatQ(key, q)}>
                        Check
                      </button>
                    )}
                  </div>
                )}

                {r.checked && (
                  <p className={`verdict ${r.correct ? 'ok' : 'bad'}`} role="status">
                    {r.correct ? '✓ Correct' : '✗ Incorrect'}
                  </p>
                )}

                <div className="q-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShown((s) => ({ ...s, [key]: !s[key] }))}
                    aria-expanded={visible}
                  >
                    {visible ? 'Hide solution' : 'Show solution'}
                  </button>

                  <div className="mark" role="group" aria-label="Mark this question">
                    <span className="muted">My result</span>
                    <button
                      className={`mark-btn ok ${saved === 'c' ? 'on' : ''}`}
                      aria-pressed={saved === 'c'}
                      onClick={() => setResult(key, saved === 'c' ? null : 'c')}
                    >
                      ✓ Correct
                    </button>
                    <button
                      className={`mark-btn bad ${saved === 'w' ? 'on' : ''}`}
                      aria-pressed={saved === 'w'}
                      onClick={() => setResult(key, saved === 'w' ? null : 'w')}
                    >
                      ✗ Wrong
                    </button>
                  </div>
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
        })}
          </ol>
        </section>
      ))}
    </div>
  );
}
