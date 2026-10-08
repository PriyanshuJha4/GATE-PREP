'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Everything is saved in this browser only (localStorage).
// Use "Backup & restore" on the dashboard to move it between devices.
const TOPIC_KEY = 'gate-progress-v1'; // ticked syllabus topics
const RESULT_KEY = 'gate-questions-v1'; // question results: "subject:id" -> 'c' (correct) | 'w' (wrong)
const Ctx = createContext(null);

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function ProgressProvider({ syllabus, questionIndex, children }) {
  const [done, setDone] = useState({});
  const [results, setResults] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadAll = () => {
      setDone(load(TOPIC_KEY));
      setResults(load(RESULT_KEY));
    };
    loadAll();
    setReady(true);
    const onStorage = (e) => (e.key === TOPIC_KEY || e.key === RESULT_KEY) && loadAll(); // sync tabs
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((id) => {
    setDone((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      save(TOPIC_KEY, next);
      return next;
    });
  }, []);

  // value: 'c' | 'w' | null (clear)
  const setResult = useCallback((key, value) => {
    setResults((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      save(RESULT_KEY, next);
      return next;
    });
  }, []);

  const clearResults = useCallback((keys) => {
    setResults((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      save(RESULT_KEY, next);
      return next;
    });
  }, []);

  const importData = useCallback((doneObj, resultObj) => {
    const d = {};
    for (const [k, v] of Object.entries(doneObj || {})) if (v) d[k] = true;
    save(TOPIC_KEY, d);
    setDone(d);
    if (resultObj) {
      const r = {};
      for (const [k, v] of Object.entries(resultObj)) if (v === 'c' || v === 'w') r[k] = v;
      save(RESULT_KEY, r);
      setResults(r);
    }
  }, []);

  const reset = useCallback(() => {
    save(TOPIC_KEY, {});
    save(RESULT_KEY, {});
    setDone({});
    setResults({});
  }, []);

  const stats = useMemo(() => {
    const bySubject = {};
    let total = 0;
    let count = 0;
    for (const s of syllabus) {
      const t = s.topics.length;
      const d = s.topics.filter((x) => done[x.id]).length;
      bySubject[s.slug] = { done: d, total: t, percent: t ? Math.round((d / t) * 100) : 0 };
      total += t;
      count += d;
    }
    return { total, done: count, percent: total ? Math.round((count / total) * 100) : 0, bySubject };
  }, [syllabus, done]);

  // Practice-question progress per subject and per chapter
  const qstats = useMemo(() => {
    const bySubject = {};
    const all = { total: 0, solved: 0, correct: 0, wrong: 0 };
    for (const [slug, chapters] of Object.entries(questionIndex || {})) {
      const sub = { total: 0, solved: 0, correct: 0, wrong: 0, chapters: [] };
      for (const ch of chapters) {
        const c = { title: ch.title, total: ch.questions.length, solved: 0, correct: 0, wrong: 0 };
        for (const q of ch.questions) {
          const r = results[`${slug}:${q.id}`];
          if (r === 'c') c.correct++;
          if (r === 'w') c.wrong++;
        }
        c.solved = c.correct + c.wrong;
        sub.chapters.push(c);
        sub.total += c.total;
        sub.solved += c.solved;
        sub.correct += c.correct;
        sub.wrong += c.wrong;
      }
      bySubject[slug] = sub;
      for (const k of Object.keys(all)) all[k] += sub[k];
    }
    return { ...all, bySubject };
  }, [questionIndex, results]);

  const value = useMemo(
    () => ({
      syllabus, questionIndex: questionIndex || {}, done, results, ready, stats, qstats,
      toggle, setResult, clearResults, importData, reset,
    }),
    [syllabus, questionIndex, done, results, ready, stats, qstats, toggle, setResult, clearResults, importData, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress must be used inside <ProgressProvider>');
  return v;
}
