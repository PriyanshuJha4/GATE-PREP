'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useProgress } from './ProgressProvider';
import { downloadText } from '@/lib/download';
import InstallPrompt from './InstallPrompt';

export default function Dashboard({ nav, siteName, tagline }) {
  const { syllabus, questionIndex, done, results, toggle, stats, qstats, setResult, importData, reset } = useProgress();
  const [hideDone, setHideDone] = useState(false);
  const [closed, setClosed] = useState(() => new Set());
  const [openCh, setOpenCh] = useState(() => new Set()); // practice chapters that are expanded
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const navBySlug = Object.fromEntries(nav.map((s) => [s.slug, s]));
  const allClosed = closed.size === syllabus.length && syllabus.length > 0;

  const toggleSection = (slug) =>
    setClosed((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });

  const toggleChapter = (id) =>
    setOpenCh((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportProgress = () =>
    downloadText('gate-progress.json', JSON.stringify({ version: 2, done, results }, null, 2), 'application/json');

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed.done || parsed.results) importData(parsed.done, parsed.results);
      else importData(parsed);
      setMessage('Progress restored.');
    } catch {
      setMessage('Could not read that file. Use a backup created by this app.');
    }
  };

  const onReset = () => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      reset();
      setMessage('Progress reset.');
    }
  };

  return (
    <div className="page dash">
      <InstallPrompt />
      <header className="dash-head">
        <div>
          <h1>{siteName}</h1>
          <p className="muted">{tagline}</p>
        </div>
        <div className="dash-total" aria-live="polite">
          <strong>{stats.percent}%</strong>
          <span>
            {stats.done}/{stats.total} topics
          </span>
          {qstats.total > 0 && (
            <span>
              {qstats.solved}/{qstats.total} questions solved
            </span>
          )}
        </div>
      </header>
      <div
        className="progress-track big"
        role="progressbar"
        aria-valuenow={stats.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall syllabus completion"
      >
        <div className="progress-fill" style={{ width: `${stats.percent}%` }} />
      </div>

      <div className="dash-toolbar">
        <label className="check-inline">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          Hide completed topics
        </label>
        <button
          className="btn btn-ghost"
          onClick={() => setClosed(allClosed ? new Set() : new Set(syllabus.map((s) => s.slug)))}
        >
          {allClosed ? 'Expand all' : 'Collapse all'}
        </button>
      </div>

      {syllabus.length === 0 && (
        <p className="empty">
          No syllabus found. Add subjects in <code>content/syllabus.json</code>.
        </p>
      )}

      <div className="subjects">
        {syllabus.map((s) => {
          const st = stats.bySubject[s.slug];
          const isClosed = closed.has(s.slug);
          const topics = hideDone ? s.topics.filter((t) => !done[t.id]) : s.topics;
          const cats = navBySlug[s.slug]?.categories || [];
          const panelId = `panel-${s.slug}`;

          return (
            <section key={s.slug} className="subject">
              <button
                className="subject-head"
                onClick={() => toggleSection(s.slug)}
                aria-expanded={!isClosed}
                aria-controls={panelId}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>
                <span className="subject-name">{s.title}</span>
                <span className="subject-count">
                  {st.done}/{st.total}
                </span>
                <svg className={`chev ${isClosed ? '' : 'rot'}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${st.percent}%` }} />
              </div>

              {!isClosed && (
                <div className="subject-body" id={panelId}>
                  {s.note && <p className="subject-note">{s.note}</p>}
                  <ul className="topics">
                    {topics.map((t) => (
                      <li key={t.id}>
                        <label className={`topic ${done[t.id] ? 'done' : ''}`}>
                          <input type="checkbox" checked={Boolean(done[t.id])} onChange={() => toggle(t.id)} />
                          <span>
                            <span className="topic-title">{t.title}</span>
                            {t.detail && <span className="topic-detail">{t.detail}</span>}
                          </span>
                        </label>
                      </li>
                    ))}
                    {topics.length === 0 && <li className="muted topic-empty">All topics in this subject are done.</li>}
                  </ul>
                  {qstats.bySubject[s.slug]?.total > 0 && (
                    <div className="practice">
                      <div className="practice-head">
                        <strong>Practice questions</strong>
                        <span className="muted">
                          Solved {qstats.bySubject[s.slug].solved}/{qstats.bySubject[s.slug].total}
                        </span>
                      </div>
                      <p className="practice-sub">
                        <span className="ok-text">✓ {qstats.bySubject[s.slug].correct} correct</span>
                        <span className="bad-text">✗ {qstats.bySubject[s.slug].wrong} wrong</span>
                        <span className="muted">
                          {qstats.bySubject[s.slug].total - qstats.bySubject[s.slug].solved} to do
                        </span>
                      </p>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(qstats.bySubject[s.slug].solved / qstats.bySubject[s.slug].total) * 100}%`,
                          }}
                        />
                      </div>

                      {(questionIndex[s.slug] || []).map((ch, ci) => {
                        const cs = qstats.bySubject[s.slug].chapters[ci];
                        const chId = `${s.slug}:${ci}`;
                        const isOpen = openCh.has(chId);
                        return (
                          <div key={chId} className="q-chapter">
                            <button
                              className="q-chapter-head"
                              onClick={() => toggleChapter(chId)}
                              aria-expanded={isOpen}
                            >
                              <svg className={`chev ${isOpen ? 'rot' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 6l6 6-6 6" />
                              </svg>
                              <span className="q-chapter-name">{ch.title}</span>
                              <span className="q-chapter-count">
                                {cs.solved}/{cs.total}
                              </span>
                            </button>
                            {!isOpen && (
                              <div className="q-dots" aria-hidden="true">
                                {ch.questions.map((q) => (
                                  <span key={q.id} className={`qdot ${results[`${s.slug}:${q.id}`] || ''}`} />
                                ))}
                              </div>
                            )}
                            {isOpen && (
                              <ul className="q-rows">
                                {ch.questions.map((q, qi) => {
                                  const key = `${s.slug}:${q.id}`;
                                  const r = results[key];
                                  return (
                                    <li key={q.id} className={`q-row ${r || ''}`}>
                                      <span className={`q-status ${r || ''}`} aria-hidden="true">
                                        {r === 'c' ? '✓' : r === 'w' ? '✗' : ''}
                                      </span>
                                      <Link href={`/${s.slug}/practice/#q-${q.id}`} className="q-row-link">
                                        <span className="q-row-num">{qi + 1}.</span>
                                        <span>{q.title || `Question ${qi + 1}`}</span>
                                        <span className="q-row-kind">{q.kind}</span>
                                      </Link>
                                      <span className="mark">
                                        <button
                                          className={`mark-btn ok ${r === 'c' ? 'on' : ''}`}
                                          aria-pressed={r === 'c'}
                                          aria-label={`Mark question ${qi + 1} correct`}
                                          onClick={() => setResult(key, r === 'c' ? null : 'c')}
                                        >
                                          ✓
                                        </button>
                                        <button
                                          className={`mark-btn bad ${r === 'w' ? 'on' : ''}`}
                                          aria-pressed={r === 'w'}
                                          aria-label={`Mark question ${qi + 1} wrong`}
                                          onClick={() => setResult(key, r === 'w' ? null : 'w')}
                                        >
                                          ✗
                                        </button>
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {cats.length > 0 && (
                    <div className="subject-links">
                      {cats.map((c) => (
                        <Link key={c.slug} href={`/${s.slug}/${c.slug}/`} className="chip">
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <details className="backup">
        <summary>Backup &amp; restore progress</summary>
        <p className="muted">
          Progress is saved only in this browser. Download a backup to move it to another device.
        </p>
        <div className="backup-actions">
          <button className="btn" onClick={exportProgress}>
            Download backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Restore from file
          </button>
          <button className="btn btn-danger" onClick={onReset}>
            Reset progress
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        </div>
        {message && <p role="status">{message}</p>}
      </details>
    </div>
  );
}
