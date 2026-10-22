'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { downloadText } from '@/lib/download';

const clone = (value) => JSON.parse(JSON.stringify(value));
const text = (value) => typeof value === 'string' ? value : value == null ? '' : String(value);
const CONTENT_TYPES = [
  { id: 'concepts', label: 'Concepts', file: 'concepts.json' },
  { id: 'dpp', label: 'DPP Questions', file: 'dpp-questions.json' },
  { id: 'pyq', label: 'PYQs', file: 'pyq-questions.json' },
  { id: 'practice', label: 'Practice Questions', file: 'practice-questions.json' },
];

function detectType(name, data) {
  const lower = (name || '').toLowerCase();
  const found = CONTENT_TYPES.find((t) => lower.endsWith(t.file));
  if (found) return found.id;
  if (Array.isArray(data?.sections)) return 'concepts';
  if (Array.isArray(data?.chapters)) {
    if (/dpp/.test(lower)) return 'dpp';
    if (/pyq|previous/.test(lower)) return 'pyq';
    if (/practice/.test(lower)) return 'practice';
    return 'practice';
  }
  return 'unknown';
}

function validateDocument(data, type) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['Root must be a JSON object.'];
  const isConcepts = type === 'concepts';
  const collectionKey = isConcepts ? 'sections' : 'chapters';
  if (!Array.isArray(data[collectionKey])) errors.push(`Root must contain a "${collectionKey}" array.`);
  const groups = Array.isArray(data[collectionKey]) ? data[collectionKey] : [];
  const groupIds = new Set();
  groups.forEach((group, i) => {
    const label = `${isConcepts ? 'Section' : 'Chapter'} ${i + 1}`;
    if (!group || typeof group !== 'object' || Array.isArray(group)) { errors.push(`${label} must be an object.`); return; }
    if (typeof group.title !== 'string' || !group.title.trim()) errors.push(`${label}: title must be a non-empty string.`);
    if (isConcepts && group.id != null) {
      const id = String(group.id);
      if (groupIds.has(id)) errors.push(`${label}: duplicate section id "${id}".`);
      groupIds.add(id);
    }
    if (isConcepts) {
      if (group.content != null && typeof group.content !== 'string') errors.push(`${label}: content must be a string.`);
      if (group.keyPoints != null && !Array.isArray(group.keyPoints)) errors.push(`${label}: keyPoints must be an array.`);
    }
    if (group.questions != null && !Array.isArray(group.questions)) errors.push(`${label}: questions must be an array.`);
    const questions = Array.isArray(group.questions) ? group.questions : [];
    const ids = new Set();
    questions.forEach((q, qi) => {
      const qlabel = `${label}, Q${qi + 1}`;
      if (!q || typeof q !== 'object' || Array.isArray(q)) { errors.push(`${qlabel} must be an object.`); return; }
      if (q.id != null && String(q.id).trim()) {
        const id = String(q.id);
        if (ids.has(id)) errors.push(`${qlabel}: duplicate question id "${id}".`);
        ids.add(id);
      }
      if (q.options != null && !Array.isArray(q.options)) errors.push(`${qlabel}: options must be an array.`);
      if (q.question != null && typeof q.question !== 'string') errors.push(`${qlabel}: question must be a string.`);
    });
  });
  return errors;
}

function guessSubject(name, data) {
  const cleaned = (name || '').replace(/\.json$/i, '').replace(/-(concepts|dpp-questions|pyq-questions|practice-questions)$/i, '').replace(/[-_]+/g, ' ').trim();
  return cleaned || data?.title || 'Imported content';
}

export default function ConceptEditor() {
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState('');
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [mode, setMode] = useState('visual');
  const [field, setField] = useState('content');
  const [message, setMessage] = useState('Import any of the four JSON content files to begin.');
  const [validation, setValidation] = useState(null);
  const [previewSelection, setPreviewSelection] = useState('');
  const [pendingSourceRange, setPendingSourceRange] = useState(null);
  const [paneLayout, setPaneLayout] = useState('side');
  const [editorWidth, setEditorWidth] = useState(60);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(null);
  const fileRef = useRef(null);
  const editorPanelRef = useRef(null);

  const doc = documents.find((d) => d.key === activeDoc) || null;
  const type = doc?.type || 'unknown';
  const isConcepts = type === 'concepts';
  const collectionKey = isConcepts ? 'sections' : 'chapters';
  const groups = Array.isArray(doc?.data?.[collectionKey]) ? doc.data[collectionKey] : [];
  const group = groups[activeGroup] || null;
  const questions = Array.isArray(group?.questions) ? group.questions : [];
  const question = questions[activeQuestion] || null;
  const errors = useMemo(() => doc ? validateDocument(doc.data, doc.type) : [], [doc]);
  const dirty = Boolean(doc?.dirty);

  useEffect(() => { setJsonDraft(null); }, [activeDoc, activeGroup, activeQuestion, field]);
  useEffect(() => {
    if (!previewSelection || mode !== 'visual') return;
    const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(previewSelection) : previewSelection.replace(/[^a-zA-Z0-9_-]/g, '');
    const target = editorPanelRef.current?.querySelector(`[data-editor-field="${escaped}"]`);
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (pendingSourceRange && pendingSourceRange.field === previewSelection && typeof target.setSelectionRange === 'function') {
        const valueLength = target.value?.length ?? 0;
        const start = Math.max(0, Math.min(valueLength, pendingSourceRange.start ?? 0));
        const end = Math.max(start, Math.min(valueLength, pendingSourceRange.end ?? start));
        target.setSelectionRange(start, end);
        setPendingSourceRange(null);
      }
      target.classList.add('editor-field-highlight');
      const removeHighlight = () => target.classList.remove('editor-field-highlight');
      target.addEventListener('blur', removeHighlight, { once: true });
    }
    setPreviewSelection('');
  }, [field, mode, previewSelection, pendingSourceRange]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gate-content-editor-drafts-v2') || '[]');
      if (Array.isArray(saved) && saved.length) {
        setDocuments(saved.map((d) => ({ ...d, dirty: true, restored: true })));
        setActiveDoc(saved[0].key);
        setMessage('Recovered browser draft(s). Import the original file to compare or start fresh.');
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (!documents.length) return;
    try { localStorage.setItem('gate-content-editor-drafts-v2', JSON.stringify(documents)); } catch {}
  }, [documents]);

  const updateDoc = (updater, label = 'Draft updated.') => {
    setDocuments((prev) => prev.map((d) => {
      if (d.key !== activeDoc) return d;
      const nextData = typeof updater === 'function' ? updater(clone(d.data)) : updater;
      const history = [...(d.history || []), { at: new Date().toISOString(), label, data: clone(d.data) }].slice(-40);
      return { ...d, data: nextData, history, dirty: true };
    }));
    setValidation(null);
    setMessage(label);
  };

  const importFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    const loaded = [];
    for (const file of files) {
      try {
        const data = JSON.parse(await file.text());
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Root must be a JSON object.');
        const detected = detectType(file.name, data);
        if (detected === 'unknown') throw new Error('Could not identify the schema. Choose a concepts, DPP, PYQ, or practice JSON file.');
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        loaded.push({ key, name: file.name, subject: guessSubject(file.name, data), type: detected, data, original: clone(data), history: [], dirty: false });
      } catch (e) { setMessage(`${file.name}: ${e.message}`); }
    }
    if (loaded.length) {
      setDocuments((prev) => [...prev.filter((d) => !loaded.some((n) => n.key === d.key)), ...loaded]);
      setActiveDoc(loaded[0].key); setActiveGroup(0); setActiveQuestion(0);
      setMessage(`Imported ${loaded.length} file(s). IDs, metadata, and untouched fields are retained.`);
    }
  };

  const patchRoot = (key, value) => updateDoc((data) => { data[key] = value; return data; });
  const patchGroup = (key, value) => updateDoc((data) => {
    const item = data[collectionKey][activeGroup];
    if (key === 'keyPoints') item[key] = value.split('\n').filter((x) => x.trim());
    else if (key === 'questionsJson') item.questions = JSON.parse(value || '[]');
    else item[key] = value;
    return data;
  });
  const patchQuestion = (key, value) => updateDoc((data) => {
    const item = data[collectionKey][activeGroup];
    if (!Array.isArray(item.questions)) item.questions = [];
    const q = item.questions[activeQuestion];
    if (!q) return data;
    if (key === 'options') q.options = value.split('\n');
    else if (key === 'answer') {
      try { q.answer = JSON.parse(value); } catch { q.answer = value; }
    } else if (key === 'marks') {
      const parsed = value.trim() === '' ? '' : Number(value);
      q.marks = parsed === '' || Number.isNaN(parsed) ? value : parsed;
    } else q[key] = value;
    return data;
  });
  const addQuestion = () => {
    const nextIndex = questions.length;
    updateDoc((data) => {
      const g = data[collectionKey][activeGroup];
      if (!Array.isArray(g.questions)) g.questions = [];
      const q = isConcepts
        ? { id: `new-question-${Date.now()}`, type: 'mcq', question: '', options: ['', '', '', ''], answer: 0, solution: '', marks: 1 }
        : { id: `new-question-${Date.now()}`, type: 'mcq', question: '', options: ['', '', '', ''], answer: 0, solution: '', marks: 1, source: type === 'dpp' ? 'DPP' : type === 'pyq' ? 'GATE PYQ' : 'Practice' };
      g.questions.push(q);
      return data;
    }, 'Added question.');
    setActiveQuestion(nextIndex);
    setField('question');
  };
  const deleteQuestion = () => {
    if (!question || !window.confirm('Delete this question? This change affects only the current draft until exported.')) return;
    updateDoc((data) => { data[collectionKey][activeGroup].questions.splice(activeQuestion, 1); return data; }, 'Deleted question.');
    setActiveQuestion(Math.max(0, activeQuestion - 1));
  };
  const addGroup = () => {
    const nextIndex = groups.length;
    updateDoc((data) => {
      const item = isConcepts ? { id: `new-section-${Date.now()}`, title: 'New section', content: '', questions: [] } : { title: 'New chapter', questions: [] };
      if (!Array.isArray(data[collectionKey])) data[collectionKey] = [];
      data[collectionKey].push(item);
      return data;
    }, `Added ${isConcepts ? 'section' : 'chapter'}.`);
    setActiveGroup(nextIndex);
    setActiveQuestion(0);
    setField(isConcepts ? 'content' : 'group');
  };

  const saveDraft = () => {
    try { localStorage.setItem('gate-content-editor-drafts-v2', JSON.stringify(documents)); setMessage('Draft saved in this browser. Export JSON to update the project file.'); }
    catch { setMessage('Could not save draft; browser storage may be full. Export a backup instead.'); }
  };
  const validate = () => {
    if (!doc) return;
    try { JSON.parse(JSON.stringify(doc.data)); const issues = validateDocument(doc.data, doc.type); setValidation(issues); setMessage(issues.length ? 'Validation found issues.' : 'JSON syntax and content structure checks passed.'); }
    catch (e) { setValidation([`Invalid JSON: ${e.message}`]); }
  };
  const exportFile = () => {
    if (!doc) return;
    const issues = validateDocument(doc.data, doc.type);
    if (issues.length) { setValidation(issues); setMessage('Export blocked: fix validation errors first.'); return; }
    downloadText(doc.name, JSON.stringify(doc.data, null, 2) + '\n', 'application/json');
    setMessage(`Exported ${doc.name}. Replace the matching file under content/<subject>/ and redeploy.`);
  };
  const undo = () => {
    if (!doc?.history?.length) return;
    const last = doc.history[doc.history.length - 1];
    setDocuments((prev) => prev.map((d) => d.key === activeDoc ? { ...d, data: clone(last.data), history: d.history.slice(0, -1), dirty: true } : d));
    setMessage('Restored previous editor version.');
  };

  const rootFields = ['title', ...(isConcepts && doc?.data?.intro !== undefined ? ['intro'] : [])];
  const groupFields = isConcepts ? ['sectionTitle', 'short', 'summary', 'content', 'keyPoints', 'questionsJson'] : ['chapterTitle'];
  const questionFields = question ? ['questionTitle', 'type', 'question', ...(question.options !== undefined ? ['options'] : []), 'answer', 'solution', ...(question.marks !== undefined ? ['marks'] : []), ...(question.source !== undefined ? ['source'] : [])] : [];
  const fields = field === 'root' ? rootFields : field === 'group' ? groupFields : questionFields;
  const selectedValue = () => {
    if (!doc) return '';
    if (field === 'root') return text(doc.data.title);
    if (field === 'group') return text(group?.title);
    if (!question) return '';
    if (field === 'question') return text(question.question);
    return text(question[field]);
  };
  const fieldValue = (f) => {
    if (f === 'title') return text(doc?.data?.title);
    if (f === 'questionTitle') return text(question?.title);
    if (f === 'intro') return text(doc?.data?.intro);
    if (f === 'sectionTitle' || f === 'chapterTitle') return text(group?.title);
    if (f === 'keyPoints') return (group?.keyPoints || []).join('\n');
    if (f === 'questionsJson') return JSON.stringify(group?.questions || [], null, 2);
    if (f === 'options') return (question?.options || []).map(text).join('\n');
    if (f === 'answer') return JSON.stringify(question?.answer ?? '', null, 2);
    return text(question?.[f] ?? group?.[f]);
  };
  const applyField = (f, value) => {
    if (f === 'title' || f === 'intro') return patchRoot(f, value);
    if (f === 'questionTitle') return patchQuestion('title', value);
    if (f === 'sectionTitle' || f === 'chapterTitle') return patchGroup('title', value);
    if (f === 'questionsJson') return patchGroup('questionsJson', value);
    if (['short', 'summary', 'content', 'keyPoints'].includes(f)) return patchGroup(f, value);
    return patchQuestion(f, value);
  };
  const jumpToField = (targetField, sourceStart = null, sourceEnd = null) => {
    setEditorCollapsed(false);
    setMode('visual');
    const editorField = targetField === 'group' ? (isConcepts ? 'sectionTitle' : 'chapterTitle') : targetField;
    setField(targetField);
    setPendingSourceRange(sourceStart == null ? null : { field: editorField, start: sourceStart, end: sourceEnd ?? sourceStart });
    setPreviewSelection(editorField);
    setMessage(sourceStart == null ? `Navigated to ${targetField} in Edit Fields.` : `Navigated to the corresponding source location in ${targetField}. You can edit it now.`);
  };
  const fieldPreview = field === 'root' ? (doc?.data?.intro || doc?.data?.title || '') : field === 'group' ? (group?.content || group?.summary || '') : field === 'question' ? (question?.question || '') : field === 'questionsJson' ? (group?.questions || []).map((q, i) => `### ${q.title || `Question ${i + 1}`}\n\n${q.question || ''}\n\n${q.solution || ''}`).join('\n\n') : field === 'content' ? (group?.content || '') : text(question?.[field] ?? group?.[field]);

  return <div className="page concept-editor-page">
    <header className="page-head"><div><p className="crumb">Study tools</p><h1>Content Editor</h1><p className="muted">One editor for concepts, DPPs, PYQs, and practice questions.</p></div>
      <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON files</button>
      <input ref={fileRef} type="file" accept=".json,application/json" multiple hidden onChange={importFiles} />
    </header>
    <div className="editor-notice"><strong>Browser-only editing:</strong> import the existing JSON file(s). Drafts stay in this browser; export downloads a replacement file. Hosted edits do not automatically write to GitHub.</div>
    <div className="editor-toolbar">
      <label>Subject / file<select value={activeDoc} onChange={(e) => { setActiveDoc(e.target.value); setActiveGroup(0); setActiveQuestion(0); setValidation(null); }} disabled={!documents.length}>
        {!documents.length && <option value="">Import a JSON file</option>}{documents.map((d) => <option key={d.key} value={d.key}>{d.subject} — {CONTENT_TYPES.find((t) => t.id === d.type)?.label || d.type} ({d.name})</option>)}
      </select></label>
      <label>Content type<select value={type} disabled><option>{CONTENT_TYPES.find((t) => t.id === type)?.label || 'Unknown'}</option></select></label>
      <label>{isConcepts ? 'Chapter / section' : 'Chapter'}<select value={activeGroup} onChange={(e) => { setActiveGroup(Number(e.target.value)); setActiveQuestion(0); setValidation(null); }} disabled={!group}>
        {groups.map((g, i) => <option key={`${g.id || g.title}-${i}`} value={i}>{g.title || g.id || `${isConcepts ? 'Section' : 'Chapter'} ${i + 1}`}</option>)}
      </select></label>
      <label>Editor mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="visual">Visual fields</option><option value="structured">Structured JSON</option></select></label>
    </div>

    {!doc ? <div className="editor-empty"><h2>Start by importing your files</h2><p>Import any combination of <code>concepts.json</code>, <code>dpp-questions.json</code>, <code>pyq-questions.json</code>, and <code>practice-questions.json</code>. The editor detects the file type and reads the existing schema.</p><button className="btn" onClick={() => fileRef.current?.click()}>Choose JSON files</button></div> : <>
      <div className="editor-actions"><button className="btn btn-ghost" onClick={saveDraft}>Save Draft</button><button className="btn btn-ghost" onClick={validate}>Validate JSON</button><button className="btn" onClick={exportFile}>Export Updated {doc.name}</button><button className="btn btn-ghost" onClick={undo} disabled={!doc.history?.length}>Undo last change</button><span className={`editor-state ${dirty ? 'is-dirty' : ''}`}>{dirty ? 'Unsaved edits' : 'Imported original'}</span></div>
      <p className="editor-message" role="status">{message}</p>
      {validation && <div className={`validation-panel ${validation.length ? 'has-errors' : 'is-valid'}`}><strong>{validation.length ? `${validation.length} issue(s)` : 'Validation passed'}</strong>{validation.length > 0 && <ul>{validation.map((e, i) => <li key={i}>{e}</li>)}</ul>}</div>}
      <div className="editor-actions content-actions"><label>Editing target<select value={field} onChange={(e) => setField(e.target.value)}><option value="root">Document metadata</option><option value="group">{isConcepts ? 'Section fields' : 'Chapter fields'}</option>{question && <option value="question">Question statement</option>}{question && questionFields.filter((f) => !['question'].includes(f)).map((f) => <option key={f} value={f}>{f === 'questionTitle' ? 'title' : f}</option>)}{isConcepts && group?.short !== undefined && <option value="short">short</option>}{isConcepts && group?.summary !== undefined && <option value="summary">summary</option>}{isConcepts && group?.content !== undefined && <option value="content">content (Markdown)</option>}{isConcepts && group?.keyPoints !== undefined && <option value="keyPoints">keyPoints</option>}{isConcepts && <option value="questionsJson">Section questions (JSON)</option>}</select></label>
        {!isConcepts && <label>Question<select value={activeQuestion} onChange={(e) => { setActiveQuestion(Number(e.target.value)); setField('question'); }} disabled={!questions.length}>{questions.map((q, i) => <option key={`${q.id || i}-${i}`} value={i}>{q.id ? `${q.id} — ` : ''}${q.title || `Question ${i + 1}`}</option>)}</select></label>}
        <button className="btn btn-ghost" onClick={addGroup}>Add {isConcepts ? 'section' : 'chapter'}</button><button className="btn btn-ghost" onClick={addQuestion} disabled={!group}>Add question</button>{!isConcepts && question && <button className="btn btn-ghost" onClick={deleteQuestion}>Delete question</button>}
      </div>
      <div className="editor-layout-controls" aria-label="Editor layout controls"><label>Pane layout<select value={paneLayout} onChange={(e) => setPaneLayout(e.target.value)}><option value="side">Side by side</option><option value="stacked">Stacked</option></select></label>
        {paneLayout === 'side' && !editorCollapsed && !previewCollapsed && <label className="pane-width-control">Editor width <input type="range" min="40" max="80" step="5" value={editorWidth} onChange={(e) => setEditorWidth(Number(e.target.value))} aria-label="Editor pane width" /><span>{editorWidth}%</span></label>}
        <div className="pane-toggle-actions"><button type="button" className="btn btn-ghost btn-small" onClick={() => setEditorCollapsed((v) => !v)}>{editorCollapsed ? 'Show editor' : 'Minimize editor'}</button><button type="button" className="btn btn-ghost btn-small" onClick={() => setPreviewCollapsed((v) => !v)}>{previewCollapsed ? 'Show preview' : 'Minimize preview'}</button></div>
      </div>
      <div className={`editor-grid ${paneLayout === 'stacked' ? 'is-stacked' : 'is-side'} ${editorCollapsed ? 'editor-is-collapsed' : ''} ${previewCollapsed ? 'preview-is-collapsed' : ''}`} style={paneLayout === 'side' && !editorCollapsed && !previewCollapsed ? { gridTemplateColumns: `${editorWidth}fr ${100 - editorWidth}fr` } : undefined}>
        {!editorCollapsed && <section ref={editorPanelRef} className="editor-panel"><div className="editor-panel-head"><h2>{mode === 'visual' ? 'Edit fields' : 'Structured JSON'}</h2><span className="muted">{question?.id || group?.id || ''}</span></div>
          {mode === 'structured' ? <label className="editor-label">Complete document JSON<textarea data-editor-field="structured-json" rows={28} spellCheck={false} value={jsonDraft ?? JSON.stringify(doc.data, null, 2)} onChange={(e) => setJsonDraft(e.target.value)} onBlur={(e) => { try { const parsed = JSON.parse(e.target.value); const issues = validateDocument(parsed, type); if (issues.length) { setValidation(issues); setMessage('JSON parses, but schema validation found issues.'); } else { updateDoc(() => parsed, 'Structured JSON updated.'); setJsonDraft(null); } } catch (err) { setValidation([`Invalid JSON: ${err.message}`]); setMessage('Structured JSON has a syntax error; draft has not been applied.'); } }} /></label> : <>
            {field === 'root' && <div className="editor-field-stack">{rootFields.map((f) => <label className="editor-label" key={f}>{f}<textarea data-editor-field={f} rows={f === 'intro' ? 6 : 2} value={fieldValue(f)} onChange={(e) => applyField(f, e.target.value)} /></label>)}</div>}
            {field === 'group' && <div className="editor-field-stack">{(isConcepts ? ['sectionTitle', ...(group?.short !== undefined ? ['short'] : []), ...(group?.summary !== undefined ? ['summary'] : []), ...(group?.content !== undefined ? ['content'] : [])] : ['chapterTitle']).map((f) => <label className="editor-label" key={f}>{f}<textarea data-editor-field={f} rows={f === 'content' ? 18 : 3} value={fieldValue(f)} onChange={(e) => applyField(f, e.target.value)} placeholder="Paste text, Markdown, LaTeX, Mermaid, code, or tables…" /></label>)}</div>}
            {field === 'keyPoints' && <label className="editor-label">One key point per line<textarea data-editor-field="keyPoints" rows={12} value={fieldValue('keyPoints')} onChange={(e) => applyField('keyPoints', e.target.value)} /></label>}
            {field === 'questionsJson' && <label className="editor-label">Questions array JSON<textarea data-editor-field="questionsJson" rows={22} spellCheck={false} value={jsonDraft ?? fieldValue('questionsJson')} onChange={(e) => setJsonDraft(e.target.value)} onBlur={(e) => { try { const parsed = JSON.parse(e.target.value || '[]'); if (!Array.isArray(parsed)) throw new Error('Must be a JSON array.'); patchGroup('questionsJson', e.target.value); setJsonDraft(null); } catch (err) { setValidation([`Questions JSON: ${err.message}`]); } }} /></label>}
            {field !== 'root' && field !== 'group' && field !== 'keyPoints' && field !== 'questionsJson' && <label className="editor-label">{field}<textarea data-editor-field={field} rows={['content', 'question', 'solution'].includes(field) ? 14 : 5} value={fieldValue(field)} onChange={(e) => applyField(field, e.target.value)} placeholder={field === 'options' ? 'One option per line' : 'Paste text, Markdown, LaTeX, Mermaid, code, or tables…'} /></label>}
            {field === 'answer' && <p className="muted small">Enter a JSON value: for MCQ use an option index (for example 1), for MSQ an array (for example [0,2]), for NAT a number, or a string for self-check questions.</p>}
          </>}
        </section>}
        {!previewCollapsed && <aside className="editor-panel editor-preview-panel"><div className="editor-panel-head"><h2>Live preview</h2><span className="muted small">Click any part to edit its source</span></div>
          {isConcepts ? <>
            <h3 className="preview-edit-target" onClick={() => jumpToField('group')} title="Click to edit section title">{group?.title || 'Untitled section'}</h3>
            {group?.short && <p className="preview-edit-target" onClick={() => jumpToField('short')} title="Click to edit short description">{group.short}</p>}
            {group?.summary && <p className="muted preview-edit-target" onClick={() => jumpToField('summary')} title="Click to edit summary">{group.summary}</p>}
            <div className="preview-edit-target" title="Click a rendered block to navigate to its Markdown source"><MarkdownRenderer content={group?.content || '*No content yet.*'} onSourceNavigate={(start, end) => jumpToField('content', start, end)} /></div>
            {!!group?.keyPoints?.length && <div className="preview-edit-target" onClick={() => jumpToField('keyPoints')} title="Click to edit key points"><h3>Key points</h3><ul>{group.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
            {questions.length > 0 && <div className="preview-edit-target" onClick={() => jumpToField('questionsJson')} title="Click to edit this section's questions in JSON"><h3>Questions ({questions.length})</h3>{questions.map((q, i) => <div key={`${q.id || i}-${i}`} className="preview-question"><strong>{q.title || `Q${i + 1}`}</strong><MarkdownRenderer content={q.question || ''} onSourceNavigate={() => jumpToField('questionsJson')} />{q.options && <ol type="A">{q.options.map((o, oi) => <li key={oi}>{o}</li>)}</ol>}<MarkdownRenderer content={q.solution || ''} onSourceNavigate={() => jumpToField('questionsJson')} /></div>)}</div>}
          </> : <>
            <h3 className="preview-edit-target" onClick={() => jumpToField('group')} title="Click to edit chapter title">{group?.title || 'Untitled chapter'}</h3>
            {question ? <div className="preview-question">
              <strong className="preview-edit-target" onClick={() => jumpToField('questionTitle')} title="Click to edit question title">{question.title || question.id || `Question ${activeQuestion + 1}`}</strong>
              <div className="preview-edit-target" title="Click a rendered block to navigate to the question source"><MarkdownRenderer content={question.question || '*Question statement is empty.*'} onSourceNavigate={(start, end) => jumpToField('question', start, end)} /></div>
              {question.options && <div className="preview-edit-target" onClick={() => jumpToField('options')} title="Click to edit options"><ol type="A">{question.options.map((o, i) => <li key={i}><MarkdownRenderer content={text(o)} /></li>)}</ol></div>}
              <p className="preview-edit-target" onClick={() => jumpToField('answer')} title="Click to edit answer"><strong>Answer:</strong> {Array.isArray(question.answer) ? question.answer.join(', ') : text(question.answer)}</p>
              <div className="preview-edit-target" title="Click a rendered block to navigate to the solution source"><MarkdownRenderer content={question.solution || '*No solution provided.*'} onSourceNavigate={(start, end) => jumpToField('solution', start, end)} /></div>
              {question.marks !== undefined && <p className="muted preview-edit-target" onClick={() => jumpToField('marks')} title="Click to edit marks">Marks: {question.marks}</p>}
              {question.source && <p className="muted preview-edit-target" onClick={() => jumpToField('source')} title="Click to edit source">Source: {question.source}</p>}
            </div> : <p>No questions in this chapter yet. Use “Add question”.</p>}
          </>}
        </aside>}
      </div>
      <details className="version-history"><summary>Version history ({doc.history?.length || 0} in this session)</summary>{doc.history?.length ? <ol>{[...doc.history].reverse().map((h, i) => <li key={`${h.at}-${i}`}><strong>{h.label}</strong> <span className="muted">{new Date(h.at).toLocaleString()}</span></li>)}</ol> : <p className="muted">Edit history appears here as you make changes.</p>}</details>
    </>}
  </div>;
}
