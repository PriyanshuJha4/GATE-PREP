'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const DRAFT_PREFIX = 'gate-concept-editor:draft:';
const HISTORY_PREFIX = 'gate-concept-editor:history:';
const clone = (value) => JSON.parse(JSON.stringify(value));
const pretty = (value) => JSON.stringify(value, null, 2);

function validateConcepts(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['Root must be a JSON object.'];
  if (typeof data.title !== 'string') errors.push('Top-level "title" must be a string.');
  if (!Array.isArray(data.sections)) errors.push('"sections" must be an array.');
  else {
    const ids = new Set();
    data.sections.forEach((section, index) => {
      const at = `sections[${index}]`;
      if (!section || typeof section !== 'object' || Array.isArray(section)) {
        errors.push(`${at} must be an object.`); return;
      }
      if (typeof section.id !== 'string' || !section.id.trim()) errors.push(`${at}.id must be a non-empty string.`);
      else if (ids.has(section.id)) errors.push(`Duplicate section id "${section.id}".`);
      else ids.add(section.id);
      if (typeof section.title !== 'string') errors.push(`${at}.title must be a string.`);
      for (const field of ['intro', 'summary', 'content', 'short']) {
        if (section[field] !== undefined && typeof section[field] !== 'string') errors.push(`${at}.${field} must be a string.`);
      }
      if (section.keyPoints !== undefined && !Array.isArray(section.keyPoints)) errors.push(`${at}.keyPoints must be an array.`);
      if (section.questions !== undefined && !Array.isArray(section.questions)) errors.push(`${at}.questions must be an array.`);
    });
  }
  if (data.intro !== undefined && typeof data.intro !== 'string') errors.push('Top-level "intro" must be a string.');
  return errors;
}

function saveHistory(subject, data) {
  try {
    const key = HISTORY_PREFIX + subject;
    const previous = JSON.parse(localStorage.getItem(key) || '[]');
    const serialized = pretty(data);
    if (previous[0]?.json === serialized) return;
    const next = [{ at: new Date().toISOString(), json: serialized }, ...previous].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

export default function ConceptEditor({ subjects }) {
  const [subject, setSubject] = useState(subjects[0]?.slug || '');
  const [docs, setDocs] = useState(() => Object.fromEntries(subjects.map((s) => [s.slug, clone(s.data || { title: `${s.title} — Concepts`, sections: [] })])));
  const [sectionId, setSectionId] = useState('');
  const [mode, setMode] = useState('visual');
  const [status, setStatus] = useState('');
  const [validation, setValidation] = useState(null);
  const [history, setHistory] = useState([]);
  const [rawQuestions, setRawQuestions] = useState('');
  const [rawKeyPoints, setRawKeyPoints] = useState('');
  const lastAutosavedSubject = useRef(subject);

  const data = docs[subject] || { title: '', sections: [] };
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const selectedIndex = Math.max(0, sections.findIndex((s) => s.id === sectionId));
  const section = sections[selectedIndex] || null;
  const subjectTitle = subjects.find((s) => s.slug === subject)?.title || subject;

  useEffect(() => {
    if (!sectionId || !sections.some((s) => s.id === sectionId)) setSectionId(sections[0]?.id || '');
  }, [subject, sections, sectionId]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_PREFIX + subject);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && Array.isArray(parsed.sections)) {
          setDocs((old) => ({ ...old, [subject]: parsed }));
          setStatus('Restored local draft.');
        }
      }
      setHistory(JSON.parse(localStorage.getItem(HISTORY_PREFIX + subject) || '[]'));
    } catch {}
  }, [subject]);

  useEffect(() => {
    setRawQuestions(pretty(section?.questions || []));
    setRawKeyPoints(pretty(section?.keyPoints || []));
  }, [subject, sectionId]);

  const errors = useMemo(() => validateConcepts(data), [data]);

  // Automatically keep a local draft and a bounded version history after edits.
  useEffect(() => {
    if (lastAutosavedSubject.current !== subject) {
      lastAutosavedSubject.current = subject;
      return;
    }
    const timer = setTimeout(() => {
      try {
        const serialized = pretty(data);
        JSON.parse(serialized);
        localStorage.setItem(DRAFT_PREFIX + subject, serialized);
        saveHistory(subject, data);
        setHistory(JSON.parse(localStorage.getItem(HISTORY_PREFIX + subject) || '[]'));
      } catch {}
    }, 1200);
    return () => clearTimeout(timer);
  }, [subject, data]);

  const updateDoc = (patch) => setDocs((old) => ({ ...old, [subject]: { ...old[subject], ...patch } }));
  const updateSection = (patch) => {
    if (!section) return;
    const nextSections = sections.map((s, i) => i === selectedIndex ? { ...s, ...patch } : s);
    updateDoc({ sections: nextSections });
  };
  const checkJson = () => {
    try {
      const parsed = JSON.parse(pretty(data));
      const issues = validateConcepts(parsed);
      setValidation({ ok: issues.length === 0, issues });
      setStatus(issues.length ? 'JSON parsed, but schema validation found issues.' : 'JSON and concepts schema are valid.');
    } catch (e) {
      setValidation({ ok: false, issues: [e.message] });
      setStatus('JSON validation failed.');
    }
  };
  const saveDraft = () => {
    try {
      const serialized = pretty(data);
      JSON.parse(serialized);
      localStorage.setItem(DRAFT_PREFIX + subject, serialized);
      saveHistory(subject, data);
      setHistory(JSON.parse(localStorage.getItem(HISTORY_PREFIX + subject) || '[]'));
      setStatus('Draft saved in this browser.');
      checkJson();
    } catch (e) { setStatus(`Could not save draft: ${e.message}`); }
  };
  const exportJson = () => {
    const issues = validateConcepts(data);
    if (issues.length) {
      setValidation({ ok: false, issues });
      setStatus('Export blocked: fix validation errors first.');
      return;
    }
    const blob = new Blob([pretty(data) + '\n'], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject}-concepts.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    saveHistory(subject, data);
    setHistory(JSON.parse(localStorage.getItem(HISTORY_PREFIX + subject) || '[]'));
    setStatus(`Exported ${subject}-concepts.json. Replace content/${subject}/concepts.json, validate, then redeploy.`);
    setValidation({ ok: true, issues: [] });
  };
  const importFile = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const issues = validateConcepts(parsed);
      if (issues.length) {
        setValidation({ ok: false, issues });
        setStatus('File parsed, but schema validation failed. Original editor content was kept.');
        return;
      }
      setDocs((old) => ({ ...old, [subject]: parsed }));
      setSectionId(parsed.sections[0]?.id || '');
      setStatus(`Loaded ${file.name} into the editor. Nothing in the project folder has been changed.`);
      setValidation({ ok: true, issues: [] });
    } catch (e) {
      setValidation({ ok: false, issues: [e.message] });
      setStatus(`Could not import JSON: ${e.message}`);
    }
  };
  const restoreVersion = (item) => {
    try {
      const parsed = JSON.parse(item.json);
      setDocs((old) => ({ ...old, [subject]: parsed }));
      setSectionId(parsed.sections?.[0]?.id || '');
      setStatus(`Restored version from ${new Date(item.at).toLocaleString()}. Save or export to keep it.`);
    } catch { setStatus('That version could not be restored.'); }
  };
  const commitArray = (field, raw) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Value must be a JSON array.');
      updateSection({ [field]: parsed });
      setStatus(`${field} updated.`);
    } catch (e) { setStatus(`${field}: ${e.message}`); }
  };

  return (
    <div className="page concept-editor-page">
      <header className="page-head">
        <div><p className="crumb">GATE CSE · Content tools</p><h1>Concept Editor</h1><p className="muted">Edit concepts safely, preview Markdown, validate, and export JSON.</p></div>
      </header>
      <div className="editor-notice">
        <strong>Browser-only editing:</strong> changes are saved to this browser's local storage, not directly to your repository. Import an existing concepts.json to edit it, then export and replace the project file.
      </div>
      <div className="editor-toolbar">
        <label>Subject<select value={subject} onChange={(e) => { setSubject(e.target.value); setValidation(null); }}>{
          subjects.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)
        }</select></label>
        <label className="editor-file">Import concepts.json<input type="file" accept=".json,application/json" onChange={(e) => importFile(e.target.files?.[0])} /></label>
        <div className="editor-actions">
          <button className="btn" onClick={saveDraft}>Save Draft</button>
          <button className="btn" onClick={checkJson}>Validate JSON</button>
          <button className="btn editor-primary" onClick={exportJson}>Export Updated JSON</button>
        </div>
      </div>
      <div className="editor-layout">
        <aside className="editor-sections">
          <div className="editor-section-head"><strong>Sections</strong><button className="btn btn-ghost" onClick={() => {
            const base = 'new-section'; let id = base; let n = 2; while (sections.some((s) => s.id === id)) id = `${base}-${n++}`;
            updateDoc({ sections: [...sections, { id, title: 'New section', short: 'New section', summary: '', content: '', keyPoints: [], questions: [] }] }); setSectionId(id);
          }}>+ Add</button></div>
          {sections.map((s) => <button key={s.id} className={`editor-section-item ${section?.id === s.id ? 'active' : ''}`} onClick={() => setSectionId(s.id)}><span>{s.title || '(Untitled section)'}</span><small>{s.id}</small></button>)}
          {!sections.length && <p className="muted">No sections yet. Import a file or add a section.</p>}
          <hr />
          <label className="editor-field">Document title<input value={data.title || ''} onChange={(e) => updateDoc({ title: e.target.value })} /></label>
          <label className="editor-field">Document intro (Markdown)<textarea rows={4} value={data.intro || ''} onChange={(e) => updateDoc({ intro: e.target.value })} /></label>
        </aside>
        <section className="editor-workspace">
          {section ? <>
            <div className="editor-modebar"><strong>{section.title || section.id}</strong><div><button className={`btn ${mode === 'visual' ? 'editor-selected' : ''}`} onClick={() => setMode('visual')}>Visual editor</button><button className={`btn ${mode === 'structured' ? 'editor-selected' : ''}`} onClick={() => setMode('structured')}>Structured fields</button></div></div>
            {mode === 'visual' ? <>
              <div className="editor-fields-grid">
                <label className="editor-field">Section title<input value={section.title || ''} onChange={(e) => updateSection({ title: e.target.value })} /></label>
                <label className="editor-field">Short label<input value={section.short || ''} onChange={(e) => updateSection({ short: e.target.value })} /></label>
                <label className="editor-field editor-full">Summary<input value={section.summary || ''} onChange={(e) => updateSection({ summary: e.target.value })} /></label>
              </div>
              <label className="editor-field">Content (Markdown, LaTeX, Mermaid, code, tables)<textarea className="editor-markdown-input" value={section.content || ''} onChange={(e) => updateSection({ content: e.target.value })} spellCheck={false} /></label>
              <div className="editor-preview"><div className="editor-preview-head">Live preview</div><MarkdownRenderer content={section.content || ''} /></div>
              <div className="editor-fields-grid">
                <label className="editor-field">Key points (one per line)<textarea rows={5} value={(section.keyPoints || []).join('\n')} onChange={(e) => updateSection({ keyPoints: e.target.value.split('\n').filter((x) => x.trim()) })} /></label>
                <label className="editor-field">Questions (JSON array)<textarea rows={5} value={rawQuestions} onChange={(e) => setRawQuestions(e.target.value)} onBlur={() => commitArray('questions', rawQuestions)} spellCheck={false} /></label>
              </div>
              <p className="muted editor-hint">Question JSON is applied when you leave its field. Use Validate JSON before export.</p>
            </> : <>
              <p className="muted">Fields not listed here remain untouched. Paste JSON arrays into keyPoints/questions.</p>
              {['id', 'title', 'short', 'summary', 'content'].map((field) => <label className="editor-field" key={field}>{field}{field === 'content' ? <textarea rows={12} value={section[field] || ''} onChange={(e) => updateSection({ [field]: e.target.value })} spellCheck={false} /> : <input value={section[field] || ''} onChange={(e) => updateSection({ [field]: e.target.value })} disabled={field === 'id'} />}</label>)}
              <label className="editor-field">keyPoints — JSON array<textarea rows={5} value={rawKeyPoints} onChange={(e) => setRawKeyPoints(e.target.value)} onBlur={() => commitArray('keyPoints', rawKeyPoints)} spellCheck={false} /></label>
              <label className="editor-field">questions — JSON array<textarea rows={10} value={rawQuestions} onChange={(e) => setRawQuestions(e.target.value)} onBlur={() => commitArray('questions', rawQuestions)} spellCheck={false} /></label>
              <div className="editor-preview"><div className="editor-preview-head">Live preview</div><MarkdownRenderer content={section.content || ''} /></div>
              <div className="editor-preview"><div className="editor-preview-head">Key points preview</div><ul>{(section.keyPoints || []).map((p, i) => <li key={i}><MarkdownRenderer content={String(p)} className="compact" /></li>)}</ul></div>
            </>}
            <div className="editor-danger-zone"><button className="btn btn-danger" onClick={() => { if (confirm(`Delete section "${section.title || section.id}"?`)) { const next = sections.filter((_, i) => i !== selectedIndex); updateDoc({ sections: next }); setSectionId(next[0]?.id || ''); } }}>Delete section</button></div>
          </> : <div className="empty">Select a section or click “Add”.</div>}
        </section>
      </div>
      {status && <p className="editor-status" role="status">{status}</p>}
      {validation && <div className={`editor-validation ${validation.ok ? 'valid' : 'invalid'}`}><strong>{validation.ok ? 'Validation passed' : 'Validation issues'}</strong>{validation.issues.length ? <ul>{validation.issues.map((e, i) => <li key={i}>{e}</li>)}</ul> : <p>JSON syntax and the basic concepts schema are valid.</p>}</div>}
      <details className="editor-history" open={history.length > 0}><summary>Automatic backup & version history ({history.length})</summary><p className="muted">Versions are stored locally in this browser when you save or export. Keep exported files as an additional backup.</p>{history.map((item, i) => <div className="editor-history-row" key={`${item.at}-${i}`}><span>{new Date(item.at).toLocaleString()}</span><button className="btn btn-ghost" onClick={() => restoreVersion(item)}>Restore</button><button className="btn btn-ghost" onClick={() => { const blob = new Blob([item.json + '\n'], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${subject}-concepts-backup-${i + 1}.json`; a.click(); URL.revokeObjectURL(url); }}>Download backup</button></div>)}</details>
      <div className="editor-deploy-note"><strong>After export</strong><ol><li>Replace <code>content/{subject}/concepts.json</code> with the downloaded file.</li><li>Run <code>npm run validate</code> and <code>npm run build</code>.</li><li>Commit and push to GitHub; your hosting provider can redeploy from the updated repository.</li></ol><p>Directly writing into your laptop's project folder requires a local desktop/file-system integration. Saving changes from the hosted website across devices requires a backend or authenticated storage service; static hosting alone cannot modify repository files.</p></div>
    </div>
  );
}
