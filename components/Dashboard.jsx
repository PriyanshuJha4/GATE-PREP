
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useProgress } from './ProgressProvider';
import { downloadText } from '@/lib/download';
import InstallPrompt from './InstallPrompt';

export default function Dashboard({ nav, siteName, tagline }) {
  const {
    syllabus,
    questionIndex,
    done,
    results,
    toggle,
    stats,
    qstats,
    setResult,
    importData,
    reset,
  } = useProgress();

  const [hideDone, setHideDone] = useState(false);
  const [closed, setClosed] = useState(() => new Set());
  const [openCh, setOpenCh] = useState(() => new Set());
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  const navBySlug = Object.fromEntries(
    nav.map((subject) => [subject.slug, subject])
  );

  const allClosed =
    closed.size === syllabus.length && syllabus.length > 0;

  const toggleSection = (slug) => {
    setClosed((prev) => {
      const next = new Set(prev);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  };

  const toggleChapter = (id) => {
    setOpenCh((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const exportProgress = () => {
    downloadText(
      'gate-progress.json',
      JSON.stringify({ version: 3, done, results }, null, 2),
      'application/json'
    );
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];

    // Allow the same backup file to be selected again.
    e.target.value = '';

    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());

      if (parsed.done || parsed.results) {
        importData(parsed.done, parsed.results);
      } else {
        importData(parsed);
      }

      setMessage('Progress restored.');
    } catch {
      setMessage(
        'Could not read that file. Use a valid backup created by this app.'
      );
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

      {/* Dashboard header */}
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

      {/* Overall syllabus progress */}
      <div
        className="progress-track big"
        role="progressbar"
        aria-valuenow={stats.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall syllabus completion"
      >
        <div
          className="progress-fill"
          style={{ width: `${stats.percent}%` }}
        />
      </div>

      {/* Dashboard controls */}
      <div className="dash-toolbar">
        <label className="check-inline">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          Hide completed topics
        </label>

        <button
          className="btn btn-ghost"
          onClick={() =>
            setClosed(
              allClosed
                ? new Set()
                : new Set(syllabus.map((subject) => subject.slug))
            )
          }
        >
          {allClosed ? 'Expand all' : 'Collapse all'}
        </button>
      </div>

      {/* Empty syllabus state */}
      {syllabus.length === 0 && (
        <p className="empty">
          No syllabus found. Add subjects in{' '}
          <code>content/syllabus.json</code>.
        </p>
      )}

      {/* Subject list */}
      <div className="subjects">
        {syllabus.map((s) => {
          const st = stats.bySubject[s.slug];
          const isClosed = closed.has(s.slug);

          const topics = hideDone
            ? s.topics.filter((topic) => !done[topic.id])
            : s.topics;

          const cats = navBySlug[s.slug]?.categories || [];
          const panelId = `panel-${s.slug}`;

          // Only show the three question-based categories here.
          const questionCategories = cats.filter((category) =>
            ['practice', 'dpp', 'pyq'].includes(category.slug)
          );

          return (
            <section key={s.slug} className="subject">
              {/* Subject heading */}
              <button
                className="subject-head"
                onClick={() => toggleSection(s.slug)}
                aria-expanded={!isClosed}
                aria-controls={panelId}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>

                <span className="subject-name">{s.title}</span>

                <span className="subject-count">
                  {st.done}/{st.total}
                </span>

                <svg
                  className={`chev ${isClosed ? '' : 'rot'}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>

              {/* Subject syllabus progress */}
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${st.percent}%` }}
                />
              </div>

              {!isClosed && (
                <div className="subject-body" id={panelId}>
                  {s.note && (
                    <p className="subject-note">{s.note}</p>
                  )}

                  {/* Syllabus topics */}
                  <ul className="topics">
                    {topics.map((t) => (
                      <li key={t.id}>
                        <label
                          className={`topic ${done[t.id] ? 'done' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(done[t.id])}
                            onChange={() => toggle(t.id)}
                          />

                          <span>
                            <span className="topic-title">
                              {t.title}
                            </span>

                            {t.detail && (
                              <span className="topic-detail">
                                {t.detail}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}

                    {topics.length === 0 && (
                      <li className="muted topic-empty">
                        All topics in this subject are done.
                      </li>
                    )}
                  </ul>

                  {/* Aggregate question progress */}
                  {qstats.bySubject?.[s.slug]?.total > 0 && (
                    <div className="practice">
                      <div className="practice-head">
                        <strong>Question progress</strong>

                        <span className="muted">
                          Solved{' '}
                          {qstats.bySubject[s.slug].solved}/
                          {qstats.bySubject[s.slug].total}
                        </span>
                      </div>

                      <p className="practice-sub">
                        <span className="ok-text">
                          ✓ {qstats.bySubject[s.slug].correct} correct
                        </span>

                        <span className="bad-text">
                          ✗ {qstats.bySubject[s.slug].wrong} wrong
                        </span>

                        <span className="muted">
                          {qstats.bySubject[s.slug].total -
                            qstats.bySubject[s.slug].solved}{' '}
                          to do
                        </span>
                      </p>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (qstats.bySubject[s.slug].solved /
                                qstats.bySubject[s.slug].total) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Practice, DPP and PYQ progress by category */}
                  {questionCategories.map((category) => {
                    const groupKey = `${s.slug}:${category.slug}`;
                    const chapters = questionIndex?.[groupKey] || [];
                    const categoryStats = qstats.byCategory?.[groupKey];

                    // Don't show an empty question category.
                    if (!chapters.length) return null;

                    return (
                      <div
                        key={groupKey}
                        className="q-category"
                      >
                        <div className="practice-head">
                          <strong>{category.label}</strong>

                          {categoryStats && (
                            <span className="muted">
                              Solved {categoryStats.solved}/
                              {categoryStats.total}
                            </span>
                          )}
                        </div>

                        {categoryStats?.total > 0 && (
                          <>
                            <p className="practice-sub">
                              <span className="ok-text">
                                ✓ {categoryStats.correct} correct
                              </span>

                              <span className="bad-text">
                                ✗ {categoryStats.wrong} wrong
                              </span>

                              <span className="muted">
                                {categoryStats.total -
                                  categoryStats.solved}{' '}
                                to do
                              </span>
                            </p>

                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${
                                    (categoryStats.solved /
                                      categoryStats.total) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* Chapters within this category */}
                        {chapters.map((ch, ci) => {
                          const cs = categoryStats?.chapters?.[ci] || {
                            solved: 0,
                            total: ch.questions.length,
                            correct: 0,
                            wrong: 0,
                          };

                          const chId = `${groupKey}:${ci}`;
                          const isOpen = openCh.has(chId);

                          return (
                            <div
                              key={chId}
                              className="q-chapter"
                            >
                              <button
                                type="button"
                                className="q-chapter-head"
                                onClick={() => toggleChapter(chId)}
                                aria-expanded={isOpen}
                              >
                                <span className="q-chapter-name">
                                  {ch.title}
                                </span>

                                <span className="q-chapter-count">
                                  {cs.solved}/{cs.total}
                                </span>
                              </button>

                              {isOpen && (
                                <ul className="q-rows">
                                  {ch.questions.map((q, qi) => {
                                    const key = `${s.slug}:${category.slug}:${q.id}`;
                                    const r = results[key];

                                    return (
                                      <li
                                        key={q.id}
                                        className={`q-row ${r || ''}`}
                                      >
                                        <span
                                          className={`q-status ${r || ''}`}
                                          aria-label={
                                            r === 'c'
                                              ? 'Correct'
                                              : r === 'w'
                                                ? 'Wrong'
                                                : 'Not attempted'
                                          }
                                        >
                                          {r === 'c'
                                            ? '✓'
                                            : r === 'w'
                                              ? '✗'
                                              : ''}
                                        </span>

                                        <Link
                                          href={`/${s.slug}/${category.slug}/#q-${q.id}`}
                                          className="q-row-link"
                                        >
                                          <span className="q-row-num">
                                            {qi + 1}.
                                          </span>

                                          <span>
                                            {q.title ||
                                              `Question ${qi + 1}`}
                                          </span>

                                          {q.kind && (
                                            <span className="q-row-kind">
                                              {q.kind}
                                            </span>
                                          )}
                                        </Link>

                                        {/* Mark correct or wrong */}
                                        <span className="mark">
                                          <button
                                            type="button"
                                            className={`mark-btn ok ${
                                              r === 'c' ? 'on' : ''
                                            }`}
                                            aria-label={`Mark question ${
                                              qi + 1
                                            } correct`}
                                            aria-pressed={r === 'c'}
                                            onClick={() =>
                                              setResult(
                                                key,
                                                r === 'c' ? null : 'c'
                                              )
                                            }
                                          >
                                            ✓
                                          </button>

                                          <button
                                            type="button"
                                            className={`mark-btn bad ${
                                              r === 'w' ? 'on' : ''
                                            }`}
                                            aria-label={`Mark question ${
                                              qi + 1
                                            } wrong`}
                                            aria-pressed={r === 'w'}
                                            onClick={() =>
                                              setResult(
                                                key,
                                                r === 'w' ? null : 'w'
                                              )
                                            }
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
                    );
                  })}

                  {/* Subject category navigation */}
                  {cats.length > 0 && (
                    <div className="subject-links">
                      {cats.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/${s.slug}/${c.slug}/`}
                          className="chip"
                        >
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

      {/* Backup and restore */}
      <details className="backup">
        <summary>Backup &amp; restore progress</summary>

        <p className="muted">
          Progress is saved only in this browser. Download a backup to move
          it to another device.
        </p>

        <div className="backup-actions">
          <button
            type="button"
            className="btn"
            onClick={exportProgress}
          >
            Download backup
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => fileRef.current?.click()}
          >
            Restore from file
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={onReset}
          >
            Reset progress
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImport}
          />
        </div>

        {message && <p role="status">{message}</p>}
      </details>
    </div>
  );
}
