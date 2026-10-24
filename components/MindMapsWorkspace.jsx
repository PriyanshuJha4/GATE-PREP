'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BRANCH_COLORS, COLORS, EDGE_COLORS, STICKERS, TEMPLATES, autoLayout, createEdge, createMap, createNode, depthOf,
  descendants, hiddenSet, mapFromTree, normalizeMap, now, treeIndex, uid,
} from './mindmaps/model';
import {
  compressImage, downloadBlob, exportFreemind, exportMarkdown, exportOpml, mapToSvg, parseAnyToMaps, parseOutline, slug, svgToPngBlob,
} from './mindmaps/formats';
import {
  CLOUD_KEY, CLOUD_LOG_KEY, META_KEY, createStorage, formatBytes, readJson, requestPersistence, storageEstimate, writeJson,
} from './mindmaps/storage';
import { CLOUD_FOLDER, cloudReady, fetchBackup, makeSetupCode, parseSetupCode, uploadBackup } from './mindmaps/cloud';
import { Dropdown, Modal, Toast } from './mindmaps/ui';

const WELCOME = [
  { text: 'Add ideas', children: [{ text: 'Select a topic, press Tab → child' }, { text: 'Press Enter → sibling' }, { text: 'Double-click or F2 → edit text' }] },
  { text: 'Move around', children: [{ text: 'Drag empty space to pan' }, { text: 'Ctrl + scroll or pinch to zoom' }, { text: 'Shift + drag → select several' }] },
  { text: 'Keep it safe', children: [{ text: 'Saved automatically in this browser' }, { text: 'Export ▾ and Import ▾ in the header' }, { text: '☁ Cloud → back up to Cloudinary' }] },
];
const ZMIN = 0.25; const ZMAX = 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DAY = 86400000;

/* ----------------------------------------------------------------------- node */
const NodeView = memo(function NodeView({ node, selected, single, editing, hasKids, hiddenCount, register, on }) {
  const taRef = useRef(null);
  useEffect(() => {
    if (!editing || !taRef.current) return;
    const ta = taRef.current; ta.focus(); ta.select();
  }, [editing]);
  useEffect(() => { const ta = taRef.current; if (ta) { ta.style.height = '0px'; ta.style.height = `${ta.scrollHeight}px`; } }, [editing, node.text, node.width, node.fontSize]);
  const style = {
    left: node.x, top: node.y, width: node.width, background: node.color, fontSize: node.fontSize,
    fontWeight: node.bold ? 700 : 400, fontStyle: node.italic ? 'italic' : 'normal', textAlign: node.align || 'center',
  };
  return (
    <div
      ref={(el) => register(node.id, el)} data-mmid={node.id}
      className={`mm-node mm-node-${node.type} ${selected ? 'selected' : ''} ${editing ? 'editing' : ''}`} style={style}
      onPointerDown={(e) => on.down(e, node.id)} onDoubleClick={(e) => { e.stopPropagation(); on.edit(node.id); }}
      role="treeitem" aria-selected={selected} aria-label={node.type === 'image' ? node.text || 'Image' : node.text || 'Empty topic'}
    >
      {node.type === 'image' && node.image && (<><img src={node.image} alt={node.text || 'Mind map image'} draggable="false" />{(node.text || editing) && !editing && <div className="mm-image-caption">{node.text}</div>}</>)}
      {editing ? (
        <textarea
          ref={taRef} value={node.text} rows={1} spellCheck="false" aria-label="Edit text" onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => on.text(node.id, e.target.value)} onBlur={() => on.commit(node.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); on.commit(node.id, 'done'); }
            else if (e.key === 'Escape') { e.preventDefault(); on.commit(node.id, 'done'); }
            else if (e.key === 'Tab') { e.preventDefault(); on.commit(node.id, e.shiftKey ? 'sibling' : 'child'); }
          }}
        />
      ) : (node.type !== 'image' || !node.image) && <div className={`mm-node-text-body ${node.text ? '' : 'empty'}`}>{node.text || (node.type === 'sticker' ? '⭐' : 'Empty — double-click')}</div>}
      {hasKids && (
        <button className={`mm-collapse ${node.collapsed ? 'on' : ''}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); on.toggle(node.id); }} aria-label={node.collapsed ? 'Expand branch' : 'Collapse branch'} title={node.collapsed ? 'Expand (Space)' : 'Collapse (Space)'}>
          {node.collapsed ? `+${hiddenCount}` : '−'}
        </button>
      )}
      {selected && single && !editing && (<>
        <span className="mm-handle" onPointerDown={(e) => on.linkStart(e, node.id)} title="Click: add child · Drag onto another node: connect" role="button" aria-label="Add child or drag to connect">＋</span>
        <span className="mm-resize" onPointerDown={(e) => on.resizeStart(e, node.id)} title="Drag to resize" aria-hidden="true" />
      </>)}
    </div>
  );
});

/* ------------------------------------------------------------------ workspace */
export default function MindMapsWorkspace() {
  const [maps, setMaps] = useState([]);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [sel, setSel] = useState([]);
  const [selEdge, setSelEdge] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState({ x: 60, y: 60, zoom: 1 });
  const [sizes, setSizes] = useState({});
  const [hist, setHist] = useState({ past: [], future: [] });
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saveState, setSaveState] = useState({ s: 'loading' });
  const [storageMode, setStorageMode] = useState('');
  const [usage, setUsage] = useState(null);
  const [meta, setMeta] = useState({ wheelZoom: false, lastExportAt: null, lastCloudAt: null, autoMinutes: 0, propsOpen: true });
  const [cloud, setCloud] = useState({ cloudName: '', uploadPreset: '' });
  const [cloudLog, setCloudLog] = useState([]);
  const [busy, setBusy] = useState('');
  const [libOpen, setLibOpen] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [marquee, setMarquee] = useState(null);
  const [linkLine, setLinkLine] = useState(null);
  const [dropping, setDropping] = useState(false);
  const [fs, setFs] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const mapsRef = useRef([]); mapsRef.current = maps;
  const activeRef = useRef(null); activeRef.current = activeId;
  const viewRef = useRef(view); viewRef.current = view;
  const sizesRef = useRef({}); sizesRef.current = sizes;
  const selRef = useRef([]); selRef.current = sel;
  const histRef = useRef(hist); histRef.current = hist;
  const metaRef = useRef(meta); metaRef.current = meta;
  const cloudRef = useRef(cloud); cloudRef.current = cloud;
  const storageRef = useRef(null);
  const savedRef = useRef(new Map());
  const sizeCacheRef = useRef(new Map());
  const roRef = useRef(null); const elsRef = useRef(new Map());
  const viewportRef = useRef(null); const surfaceRef = useRef(null);
  const fileRef = useRef(null); const imageRef = useRef(null); const dragDepth = useRef(0);
  const lastHist = useRef({ key: '', t: 0 });
  const ptrs = useRef(new Map()); const pinch = useRef(null); const panRef = useRef(null);
  const lastChangeRef = useRef(0); const lastAutoRef = useRef(0); const interacted = useRef(false); const lastTap = useRef({ id: null, t: 0 }); const nativeFs = useRef(false);
  const L = useRef({}); // always-latest handlers for native listeners / stable callbacks

  const activeMap = useMemo(() => maps.find((m) => m.id === activeId) || null, [maps, activeId]);
  const idx = useMemo(() => (activeMap ? treeIndex(activeMap) : { children: new Map(), parent: new Map() }), [activeMap]);
  const hidden = useMemo(() => (activeMap ? hiddenSet(activeMap, idx) : new Set()), [activeMap, idx]);
  const selNodes = useMemo(() => (activeMap ? activeMap.nodes.filter((n) => sel.includes(n.id)) : []), [activeMap, sel]);
  const primary = selNodes.length ? selNodes[selNodes.length - 1] : null;
  const edgeSel = activeMap?.edges.find((e) => e.id === selEdge) || null;

  const say = useCallback((msg, extra = {}) => setToast({ msg, ...extra, id: Date.now() }), []);

  /* ---------------------------------------------------------------- load */
  useEffect(() => {
    let alive = true;
    (async () => {
      let loaded = []; let storage = null;
      try { storage = await createStorage(); loaded = await storage.loadAll(); } catch (e) { setSaveState({ s: 'error', msg: 'Could not open browser storage' }); }
      if (!alive) return;
      storageRef.current = storage; setStorageMode(storage?.mode || '');
      let list = (loaded || []).map((m) => normalizeMap(m)).filter(Boolean);
      const m0 = readJson(META_KEY, {}); const c0 = readJson(CLOUD_KEY, {}); const log0 = readJson(CLOUD_LOG_KEY, []);
      let seedFlush = false;
      if (!list.length) { const w = mapFromTree('Welcome to Mind Maps', WELCOME); w.autoLayout = true; list = [w]; seedFlush = true; }
      list = list.map((m) => ({ ...m, autoLayout: m.autoLayout ?? false }));
      savedRef.current = new Map(seedFlush ? [] : list.map((m) => [m.id, m]));
      setMaps(list); const first = list.find((m) => m.id === m0.activeId) || list[0]; setActiveId(first.id);
      setMeta((o) => ({ ...o, ...m0 })); setCloud({ cloudName: c0.cloudName || '', uploadPreset: c0.uploadPreset || '' }); setCloudLog(Array.isArray(log0) ? log0 : []);
      setReady(true); setSaveState({ s: 'saved', at: Date.now() });
      requestPersistence(); storageEstimate().then((u) => alive && setUsage(u));
    })();
    return () => { alive = false; };
  }, []);

  /* ---------------------------------------------------------------- save */
  const flush = useCallback(async () => {
    const storage = storageRef.current; if (!storage) return;
    const current = mapsRef.current; const dirty = current.filter((m) => savedRef.current.get(m.id) !== m);
    const removed = [...savedRef.current.keys()].filter((id) => !current.some((m) => m.id === id));
    if (!dirty.length && !removed.length) { setSaveState((s) => (s.s === 'saving' ? { s: 'saved', at: Date.now() } : s)); return; }
    try {
      await storage.saveMany(dirty, removed);
      dirty.forEach((m) => { savedRef.current.set(m.id, m); sizeCacheRef.current.set(m.id, JSON.stringify(m).length); }); removed.forEach((id) => { savedRef.current.delete(id); sizeCacheRef.current.delete(id); });
      setSaveState({ s: 'saved', at: Date.now() }); storageEstimate().then(setUsage);
    } catch (e) { setSaveState({ s: 'error', msg: 'Storage full or blocked — export a backup now' }); }
  }, []);
  useEffect(() => {
    if (!ready) return undefined;
    setSaveState((s) => (s.s === 'error' ? s : { s: 'saving' }));
    const t = setTimeout(flush, 350); return () => clearTimeout(t);
  }, [maps, ready, flush]);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide); window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', onHide); window.removeEventListener('pagehide', flush); };
  }, [flush]);
  useEffect(() => { if (ready) writeJson(META_KEY, { ...meta, activeId }); }, [meta, activeId, ready]);
  useEffect(() => { if (ready) writeJson(CLOUD_KEY, cloud); }, [cloud, ready]);
  useEffect(() => { if (ready) writeJson(CLOUD_LOG_KEY, cloudLog.slice(0, 40)); }, [cloudLog, ready]);

  /* ------------------------------------------------------------- mutation */
  const snap = (m) => ({ nodes: m.nodes, edges: m.edges, title: m.title, autoLayout: m.autoLayout });
  const pushHistory = useCallback((m, key) => {
    const t = Date.now(); if (key && lastHist.current.key === key && t - lastHist.current.t < 900) { lastHist.current.t = t; return; }
    lastHist.current = { key: key || '', t };
    setHist((h) => ({ past: [...h.past.slice(-59), snap(m)], future: [] }));
  }, []);
  // apply(fn, {track, key}) — fn receives the active map and returns the new map
  const apply = useCallback((fn, opts = {}) => {
    const { track = true, key } = opts; const cur = mapsRef.current.find((m) => m.id === activeRef.current); if (!cur) return null;
    const next = { ...fn(cur), updatedAt: now() }; if (track) pushHistory(cur, key);
    lastChangeRef.current = Date.now();
    mapsRef.current = mapsRef.current.map((m) => (m.id === cur.id ? next : m)); setMaps(mapsRef.current); return next;
  }, [pushHistory]);
  const patchNodes = useCallback((ids, patch, opts) => apply((m) => ({ ...m, nodes: m.nodes.map((n) => (ids.includes(n.id) ? { ...n, ...(typeof patch === 'function' ? patch(n) : patch) } : n)) }), opts), [apply]);
  const undo = useCallback(() => {
    const h = histRef.current; const cur = mapsRef.current.find((m) => m.id === activeRef.current); if (!h.past.length || !cur) return;
    const prev = h.past[h.past.length - 1]; setHist({ past: h.past.slice(0, -1), future: [...h.future, snap(cur)] });
    mapsRef.current = mapsRef.current.map((m) => (m.id === cur.id ? { ...m, ...prev, updatedAt: now() } : m)); setMaps(mapsRef.current); setEditingId(null); setSel((s) => s.filter((id) => prev.nodes.some((n) => n.id === id)));
  }, []);
  const redo = useCallback(() => {
    const h = histRef.current; const cur = mapsRef.current.find((m) => m.id === activeRef.current); if (!h.future.length || !cur) return;
    const nx = h.future[h.future.length - 1]; setHist({ past: [...h.past, snap(cur)], future: h.future.slice(0, -1) });
    mapsRef.current = mapsRef.current.map((m) => (m.id === cur.id ? { ...m, ...nx, updatedAt: now() } : m)); setMaps(mapsRef.current); setEditingId(null);
  }, []);

  // Keep the layout tidy automatically while "auto layout" is on for this map.
  useEffect(() => {
    if (!activeMap?.autoLayout) return undefined;
    const t = setTimeout(() => {
      const cur = mapsRef.current.find((m) => m.id === activeRef.current); if (!cur?.autoLayout) return;
      const laid = autoLayout(cur, sizesRef.current);
      const changed = laid.nodes.some((n, i) => n.x !== cur.nodes[i].x || n.y !== cur.nodes[i].y);
      if (changed) apply(() => laid, { track: false });
    }, 90);
    return () => clearTimeout(t);
  }, [activeMap, sizes, apply]);

  /* ----------------------------------------------------------- measurement */
  const register = useCallback((id, el) => {
    const els = elsRef.current; const prev = els.get(id);
    if (!roRef.current && typeof ResizeObserver !== 'undefined') {
      roRef.current = new ResizeObserver((entries) => {
        const upd = {}; let any = false;
        entries.forEach((en) => { const el2 = en.target; const nid = el2.dataset.mmid; if (!nid) return; const w = el2.offsetWidth; const h = el2.offsetHeight; const o = sizesRef.current[nid]; if (!o || o.w !== w || o.h !== h) { upd[nid] = { w, h }; any = true; } });
        if (any) setSizes((s) => ({ ...s, ...upd }));
      });
    }
    if (prev && prev !== el) { roRef.current?.unobserve(prev); els.delete(id); }
    if (el && prev !== el) { els.set(id, el); roRef.current?.observe(el); }
  }, []);
  useEffect(() => () => roRef.current?.disconnect(), []);
  const sizeOf = (n) => sizes[n.id] || { w: n.width, h: n.height };

  /* ------------------------------------------------------------ view / zoom */
  const toWorld = (cx, cy) => { const r = viewportRef.current.getBoundingClientRect(); const v = viewRef.current; return { x: (cx - r.left - v.x) / v.zoom, y: (cy - r.top - v.y) / v.zoom }; };
  const zoomAt = useCallback((factor, cx, cy) => {
    const el = viewportRef.current; if (!el) return; interacted.current = true; const r = el.getBoundingClientRect(); const v = viewRef.current;
    const z = clamp(v.zoom * factor, ZMIN, ZMAX); const px = (cx ?? r.left + r.width / 2) - r.left; const py = (cy ?? r.top + r.height / 2) - r.top;
    setView({ zoom: z, x: px - ((px - v.x) / v.zoom) * z, y: py - ((py - v.y) / v.zoom) * z });
  }, []);
  const fit = useCallback((nodesOverride) => {
    const el = viewportRef.current; const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!el || !m) return;
    const list = (nodesOverride || m.nodes).filter((n) => !hiddenSet(m).has(n.id)); if (!list.length) { setView({ x: 60, y: 60, zoom: 1 }); return; }
    const sz = (n) => sizesRef.current[n.id] || { w: n.width, h: n.height };
    const x1 = Math.min(...list.map((n) => n.x)); const y1 = Math.min(...list.map((n) => n.y));
    const x2 = Math.max(...list.map((n) => n.x + sz(n).w)); const y2 = Math.max(...list.map((n) => n.y + sz(n).h));
    const r = el.getBoundingClientRect(); const pad = 50; const z = clamp(Math.min((r.width - pad * 2) / (x2 - x1 || 1), (r.height - pad * 2) / (y2 - y1 || 1)), ZMIN, 1.2);
    setView({ zoom: z, x: (r.width - (x2 - x1) * z) / 2 - x1 * z, y: (r.height - (y2 - y1) * z) / 2 - y1 * z });
  }, []);
  // fit when switching maps (after first measurement)
  useEffect(() => { if (!ready || !activeId) return undefined; interacted.current = false; const t1 = setTimeout(() => { if (!interacted.current) fit(); }, 160); const t2 = setTimeout(() => { if (!interacted.current) fit(); }, 650); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [activeId, ready, fit]);
  const centerOn = useCallback((id) => {
    const el = viewportRef.current; const m = mapsRef.current.find((x) => x.id === activeRef.current); const n = m?.nodes.find((x) => x.id === id); if (!el || !n) return;
    const r = el.getBoundingClientRect(); const v = viewRef.current; const s = sizesRef.current[id] || { w: n.width, h: n.height };
    const sx = n.x * v.zoom + v.x; const sy = n.y * v.zoom + v.y;
    if (sx < 20 || sy < 20 || sx + s.w * v.zoom > r.width - 20 || sy + s.h * v.zoom > r.height - 20) setView({ ...v, x: r.width / 2 - (n.x + s.w / 2) * v.zoom, y: r.height / 2 - (n.y + s.h / 2) * v.zoom });
  }, []);
  useEffect(() => {
    const el = viewportRef.current; if (!el) return undefined;
    const wheel = (e) => {
      e.preventDefault(); interacted.current = true; const zoomMode = e.ctrlKey || e.metaKey || metaRef.current.wheelZoom;
      if (zoomMode) zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY);
      else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    el.addEventListener('wheel', wheel, { passive: false }); return () => el.removeEventListener('wheel', wheel);
  }, [zoomAt, ready, activeId]);

  /* -------------------------------------------------------------- node ops */
  const selectOnly = (ids) => { setSel(ids); setSelEdge(null); };
  const placeChild = (m, parent) => {
    const kids = (treeIndex(m).children.get(parent.id) || []).map((k) => m.nodes.find((n) => n.id === k)).filter(Boolean);
    const ps = sizesRef.current[parent.id] || { w: parent.width, h: parent.height };
    if (!kids.length) return { x: parent.x + ps.w + 70, y: parent.y };
    const last = kids[kids.length - 1]; const ls = sizesRef.current[last.id] || { w: last.width, h: last.height }; return { x: last.x, y: last.y + ls.h + 18 };
  };
  const addChild = useCallback((parentId, opts = {}) => {
    const m0 = mapsRef.current.find((m) => m.id === activeRef.current); const parent = m0?.nodes.find((n) => n.id === parentId); if (!parent) return null;
    let created = null;
    apply((m) => {
      const i = treeIndex(m); const depth = depthOf(i, parentId) + 1; const pos = placeChild(m, parent);
      const siblings = i.children.get(parentId) || [];
      const color = depth === 1 ? BRANCH_COLORS[siblings.length % BRANCH_COLORS.length] : parent.type === 'topic' || parent.type === 'box' ? parent.color : '#ffffff';
      created = createNode(opts.type || (depth <= 2 ? 'topic' : 'box'), pos.x, pos.y, opts.text ?? '', { color: opts.type === 'sticker' ? 'transparent' : color, bold: depth <= 1, fontSize: depth <= 1 ? 16 : 14, ...(opts.extra || {}) });
      if (opts.pos) { created.x = opts.pos.x; created.y = opts.pos.y; }
      const edge = createEdge(parentId, created.id, { color: parent.type === 'sticker' ? '#94a3b8' : '#94a3b8' });
      const edges = opts.afterEdgeOf ? (() => { const at = m.edges.findIndex((e) => e.to === opts.afterEdgeOf && !e.cross); const c = [...m.edges]; c.splice(at < 0 ? c.length : at + 1, 0, edge); return c; })() : [...m.edges, edge];
      return { ...m, nodes: [...m.nodes.map((n) => (n.id === parentId && n.collapsed ? { ...n, collapsed: false } : n)), created], edges };
    });
    if (created) { selectOnly([created.id]); if (opts.edit !== false) setEditingId(created.id); setTimeout(() => centerOn(created.id), 160); }
    return created;
  }, [apply, centerOn]);
  const addSibling = useCallback((id) => {
    const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!m) return; const parent = treeIndex(m).parent.get(id);
    if (!parent) { addChild(id); return; } addChild(parent, { afterEdgeOf: id });
  }, [addChild]);
  const addFree = useCallback((type, text, extra) => {
    const el = viewportRef.current; const r = el.getBoundingClientRect(); const c = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const jitter = (mapsRef.current.find((m) => m.id === activeRef.current)?.nodes.length || 0) % 6 * 18;
    const n = createNode(type, c.x - 90 + jitter, c.y - 30 + jitter, text ?? '', type === 'box' ? { color: '#dcfce7', bold: false } : type === 'text' ? { color: 'transparent', bold: false, align: 'left' } : type === 'sticker' ? { color: 'transparent' } : {});
    Object.assign(n, extra || {}); apply((m) => ({ ...m, nodes: [...m.nodes, n] })); selectOnly([n.id]); if (type !== 'sticker' && type !== 'image') setEditingId(n.id); return n;
  }, [apply]);
  const deleteNodes = useCallback((ids, branch = true) => {
    const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!m || !ids.length) return; const i = treeIndex(m);
    const kill = new Set(ids); if (branch) ids.forEach((id) => descendants(m, id, i).forEach((d) => kill.add(d)));
    apply((cur) => {
      let edges = cur.edges;
      if (!branch) { ids.forEach((id) => { const p = i.parent.get(id); (i.children.get(id) || []).forEach((k) => { if (p && !kill.has(p) && !kill.has(k)) edges = [...edges.filter((e) => !(e.to === k && !e.cross && e.from === id)), createEdge(p, k)]; }); }); }
      return { ...cur, nodes: cur.nodes.filter((n) => !kill.has(n.id)), edges: edges.filter((e) => !kill.has(e.from) && !kill.has(e.to)) };
    });
    selectOnly([]); setEditingId(null);
    say(`Deleted ${kill.size} object${kill.size === 1 ? '' : 's'}`, { action: { label: 'Undo', run: undo } });
  }, [apply, say, undo]);
  const connect = useCallback((from, to) => {
    const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!m || from === to) return false;
    if (m.edges.some((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))) { say('Those two are already connected'); return false; }
    const i = treeIndex(m); const cycle = descendants(m, to, i).includes(from) || from === to; const cross = i.parent.has(to) || cycle;
    apply((cur) => ({ ...cur, edges: [...cur.edges, createEdge(from, to, cross ? { cross: true, style: 'dashed', color: '#8b5cf6' } : {})] }));
    say(cross ? 'Added a cross-link (dashed)' : 'Connected'); return true;
  }, [apply, say]);
  const toggleCollapse = useCallback((id) => patchNodes([id], (n) => ({ collapsed: !n.collapsed })), [patchNodes]);
  const duplicateBranch = useCallback((ids) => {
    const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!m || !ids.length) return; const i = treeIndex(m); const id = ids[ids.length - 1];
    const set = new Set([id, ...descendants(m, id, i)]); const map = new Map([...set].map((o) => [o, uid()]));
    const copies = m.nodes.filter((n) => set.has(n.id)).map((n) => ({ ...n, id: map.get(n.id), x: n.x + 30, y: n.y + 30 }));
    const inner = m.edges.filter((e) => set.has(e.from) && set.has(e.to)).map((e) => ({ ...e, id: uid(), from: map.get(e.from), to: map.get(e.to) }));
    const p = i.parent.get(id); const top = p ? [createEdge(p, map.get(id))] : [];
    apply((cur) => ({ ...cur, nodes: [...cur.nodes, ...copies], edges: [...cur.edges, ...inner, ...top] })); selectOnly([map.get(id)]);
  }, [apply]);
  const tidy = useCallback(() => { apply((m) => ({ ...autoLayout(m, sizesRef.current), autoLayout: true })); setTimeout(() => fit(), 200); say('Layout tidied — it will stay tidy as you add topics'); }, [apply, fit, say]);
  const setAllCollapsed = (collapsed) => apply((m) => { const i = treeIndex(m); return { ...m, nodes: m.nodes.map((n) => ({ ...n, collapsed: collapsed && (i.children.get(n.id) || []).length > 0 && i.parent.has(n.id) ? true : collapsed ? n.collapsed : false })) }; });

  const startEdit = useCallback((id) => { const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!m) return; pushHistory(m, `edit-${id}`); lastHist.current = { key: '', t: 0 }; selectOnly([id]); setEditingId(id); }, [pushHistory]);
  const commitEdit = useCallback((id, next) => {
    setEditingId((cur) => (cur === id ? null : cur));
    if (next === 'child') addChild(id); else if (next === 'sibling') addSibling(id); else if (next === 'done') setTimeout(() => surfaceRef.current?.focus({ preventScroll: true }), 0);
  }, [addChild, addSibling]);
  const changeText = useCallback((id, text) => patchNodes([id], { text }, { track: false }), [patchNodes]);

  /* ------------------------------------------------------------ full screen */
  const enterFs = useCallback(() => {
    setFs(true); setLibOpen(false); setSheetOpen(false);
    try { const r = document.documentElement.requestFullscreen?.(); if (r?.then) r.then(() => { nativeFs.current = true; }).catch(() => {}); } catch {}
  }, []);
  const exitFs = useCallback(() => {
    setFs(false); setLibOpen(false); setSheetOpen(false);
    try { if (document.fullscreenElement) document.exitFullscreen?.(); } catch {}
    nativeFs.current = false;
  }, []);
  useEffect(() => {
    document.body.classList.toggle('no-scroll', fs);
    interacted.current = false; const t = setTimeout(() => { if (!interacted.current) fit(); }, 260);
    return () => { clearTimeout(t); if (fs) document.body.classList.remove('no-scroll'); };
  }, [fs, fit]);
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement && nativeFs.current) { nativeFs.current = false; setFs(false); setSheetOpen(false); } };
    document.addEventListener('fullscreenchange', onChange); return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 950px)'); const f = () => setNarrow(mq.matches); f();
    mq.addEventListener?.('change', f); return () => mq.removeEventListener?.('change', f);
  }, []);
  useEffect(() => { // keep the map fitted when the screen changes size / rotates (until you pan or zoom yourself)
    const el = viewportRef.current; if (!el || typeof ResizeObserver === 'undefined') return undefined; let t;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (!interacted.current) fit(); }, 150); });
    ro.observe(el); return () => { clearTimeout(t); ro.disconnect(); };
  }, [ready, activeId, fit]);

  /* ------------------------------------------------------------ pointer: node */
  const startDrag = (onMove, onEnd) => {
    const move = (e) => onMove(e); const up = (e) => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); onEnd(e); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  const nodeDown = (e, id) => {
    if (e.button !== undefined && e.button !== 0) return; if (editingId === id) return;
    e.stopPropagation(); surfaceRef.current?.focus({ preventScroll: true });
    const m = mapsRef.current.find((x) => x.id === activeRef.current); if (!m) return;
    if (linkMode) { const from = selRef.current[selRef.current.length - 1]; if (from && from !== id) { connect(from, id); } else selectOnly([id]); return; }
    if (e.pointerType === 'touch') { const t = Date.now(); const lt = lastTap.current; if (lt.id === id && t - lt.t < 350) { lastTap.current = { id: null, t: 0 }; startEdit(id); return; } lastTap.current = { id, t }; }
    let ids = selRef.current;
    if (e.shiftKey || e.ctrlKey || e.metaKey) { ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]; selectOnly(ids); return; }
    const wasSelectedOnly = ids.length === 1 && ids[0] === id;
    if (!ids.includes(id)) { ids = [id]; selectOnly(ids); } else if (ids.length > 1) { ids = [...ids.filter((x) => x !== id), id]; setSel(ids); }
    // drag moves selected nodes (and their branches stay put unless branch moves with its parent)
    const i = treeIndex(m); const moving = new Set(ids); ids.forEach((s) => descendants(m, s, i).forEach((d) => moving.add(d)));
    const startPos = new Map(m.nodes.filter((n) => moving.has(n.id)).map((n) => [n.id, { x: n.x, y: n.y }]));
    const sx = e.clientX; const sy = e.clientY; let started = false; const z = viewRef.current.zoom;
    startDrag((ev) => {
      const dx = (ev.clientX - sx) / z; const dy = (ev.clientY - sy) / z;
      if (!started) { if (Math.hypot(dx, dy) * z < 4) return; started = true; const cur = mapsRef.current.find((x) => x.id === activeRef.current); pushHistory(cur); lastHist.current = { key: '', t: 0 }; }
      apply((cur) => ({ ...cur, autoLayout: false, nodes: cur.nodes.map((n) => (startPos.has(n.id) ? { ...n, x: Math.round(startPos.get(n.id).x + dx), y: Math.round(startPos.get(n.id).y + dy) } : n)) }), { track: false });
    }, () => { if (!started && wasSelectedOnly) { /* click on already-selected node: no-op (use double-click / F2 to edit) */ } });
  };
  const resizeStart = (e, id) => {
    e.stopPropagation(); e.preventDefault(); const m = mapsRef.current.find((x) => x.id === activeRef.current); const n = m?.nodes.find((x) => x.id === id); if (!n) return;
    const sx = e.clientX; const w0 = n.width; const z = viewRef.current.zoom; let started = false;
    startDrag((ev) => { if (!started) { started = true; pushHistory(mapsRef.current.find((x) => x.id === activeRef.current)); lastHist.current = { key: '', t: 0 }; } patchNodes([id], { width: Math.round(clamp(w0 + (ev.clientX - sx) / z, n.type === 'sticker' ? 40 : 80, 700)) }, { track: false }); }, () => {});
  };
  const linkStart = (e, id) => {
    e.stopPropagation(); e.preventDefault(); const sx = e.clientX; const sy = e.clientY; let moved = false; let hover = null;
    const m = mapsRef.current.find((x) => x.id === activeRef.current); const n = m.nodes.find((x) => x.id === id); const s = sizesRef.current[id] || { w: n.width, h: n.height };
    const from = { x: n.x + s.w / 2, y: n.y + s.h };
    startDrag((ev) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return; moved = true; const w = toWorld(ev.clientX, ev.clientY); setLinkLine({ x1: from.x, y1: from.y, x2: w.x, y2: w.y });
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.mm-node'); const tid = el?.dataset.mmid; if (hover && hover !== el) hover.classList.remove('link-hover');
      hover = el && tid !== id ? el : null; hover?.classList.add('link-hover');
    }, (ev) => {
      hover?.classList.remove('link-hover'); setLinkLine(null);
      if (!moved) { addChild(id); return; }
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.mm-node'); const tid = el?.dataset.mmid;
      if (tid && tid !== id) connect(id, tid); else if (!tid && viewportRef.current.contains(document.elementFromPoint(ev.clientX, ev.clientY))) { const w = toWorld(ev.clientX, ev.clientY); addChild(id, { pos: { x: w.x, y: w.y - 20 } }); }
    });
  };

  /* --------------------------------------------------------- pointer: canvas */
  const canvasDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    surfaceRef.current?.focus({ preventScroll: true }); const el = viewportRef.current; el.setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size === 2) { const [a, b] = [...ptrs.current.values()]; pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: viewRef.current.zoom, v: viewRef.current }; panRef.current = null; setMarquee(null); return; }
    if ((e.shiftKey && e.pointerType === 'mouse') || selectMode) { const r = el.getBoundingClientRect(); panRef.current = { mode: 'marquee', x0: e.clientX - r.left, y0: e.clientY - r.top, base: e.ctrlKey || e.metaKey ? selRef.current : [] }; return; }
    panRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y, moved: false };
  };
  const canvasMove = (e) => {
    if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = viewportRef.current.getBoundingClientRect(); const p = pinch.current;
      const z = clamp(p.z * (d / (p.d || 1)), ZMIN, ZMAX); const cx = (a.x + b.x) / 2 - r.left; const cy = (a.y + b.y) / 2 - r.top;
      setView({ zoom: z, x: cx - ((cx - p.v.x) / p.v.zoom) * z, y: cy - ((cy - p.v.y) / p.v.zoom) * z }); return;
    }
    const p = panRef.current; if (!p) return;
    if (p.mode === 'pan') { const dx = e.clientX - p.sx; const dy = e.clientY - p.sy; if (!p.moved && Math.hypot(dx, dy) < 3) return; p.moved = true; interacted.current = true; setView((v) => ({ ...v, x: p.vx + dx, y: p.vy + dy })); }
    else if (p.mode === 'marquee') {
      const r = viewportRef.current.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top; const box = { x: Math.min(p.x0, x), y: Math.min(p.y0, y), w: Math.abs(x - p.x0), h: Math.abs(y - p.y0) }; setMarquee(box);
      const v = viewRef.current; const m = mapsRef.current.find((q) => q.id === activeRef.current); const hid = hiddenSet(m);
      const hit = m.nodes.filter((n) => { if (hid.has(n.id)) return false; const s = sizesRef.current[n.id] || { w: n.width, h: n.height }; const nx = n.x * v.zoom + v.x; const ny = n.y * v.zoom + v.y; return nx < box.x + box.w && nx + s.w * v.zoom > box.x && ny < box.y + box.h && ny + s.h * v.zoom > box.y; }).map((n) => n.id);
      setSel([...new Set([...p.base, ...hit])]); setSelEdge(null);
    }
  };
  const canvasUp = (e) => {
    ptrs.current.delete(e.pointerId); if (ptrs.current.size < 2) pinch.current = null;
    const p = panRef.current; if (p && ptrs.current.size === 0) { if (p.mode === 'pan' && !p.moved) { selectOnly([]); setLinkMode(false); } setMarquee(null); panRef.current = null; }
  };

  /* ------------------------------------------------------------- keyboard */
  const navigate = (dir) => {
    const m = activeMap; if (!m || !primary) return; const i = idx; let target = null;
    if (dir === 'right') target = (i.children.get(primary.id) || []).find((k) => !hidden.has(k)) && !primary.collapsed ? (i.children.get(primary.id) || [])[0] : null;
    else if (dir === 'left') target = i.parent.get(primary.id);
    else { const p = i.parent.get(primary.id); const sibs = p ? i.children.get(p) : m.nodes.filter((n) => !i.parent.has(n.id)).sort((a, b) => a.y - b.y).map((n) => n.id); const at = sibs.indexOf(primary.id); target = sibs[at + (dir === 'down' ? 1 : -1)]; }
    if (target) { selectOnly([target]); centerOn(target); }
  };
  const onKeyDown = (e) => {
    const tag = e.target.tagName; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable || !activeMap) return;
    const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k === 'a') { e.preventDefault(); selectOnly(activeMap.nodes.filter((n) => !hidden.has(n.id)).map((n) => n.id)); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicateBranch(sel); return; }
    if (mod && k === '0') { e.preventDefault(); fit(); return; }
    if (mod && k === 's') { e.preventDefault(); flush().then(() => say('Saved in this browser')); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomAt(1.2); return; }
    if (mod && k === '-') { e.preventDefault(); zoomAt(1 / 1.2); return; }
    if (e.key === 'Escape') { if (!sel.length && !linkMode && !selectMode && !selEdge && fs) { exitFs(); return; } setLinkMode(false); setSelectMode(false); selectOnly([]); return; }
    if (e.key === '?' ) { setModal({ type: 'help' }); return; }
    if (!primary) return;
    if (e.key === 'Tab') { e.preventDefault(); e.shiftKey ? addSibling(primary.id) : addChild(primary.id); }
    else if (e.key === 'Enter') { e.preventDefault(); addSibling(primary.id); }
    else if (e.key === 'F2') { e.preventDefault(); startEdit(primary.id); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteNodes(sel, !e.shiftKey); }
    else if (e.key === ' ') { e.preventDefault(); toggleCollapse(primary.id); }
    else if (e.key.startsWith('Arrow')) { e.preventDefault(); navigate(e.key.slice(5).toLowerCase()); }
  };

  /* ---------------------------------------------------------------- library */
  const openMap = (id) => { if (id === activeId) { setLibOpen(false); return; } flush(); setActiveId(id); selectOnly([]); setEditingId(null); setHist({ past: [], future: [] }); setLinkMode(false); setLibOpen(false); setSizes({}); };
  const addMapToLibrary = (map, { open = true } = {}) => { mapsRef.current = [map, ...mapsRef.current]; setMaps(mapsRef.current); if (open) { setActiveId(map.id); activeRef.current = map.id; selectOnly([map.nodes[0]?.id].filter(Boolean)); setHist({ past: [], future: [] }); setSizes({}); setEditingId(null); } };
  const createFromTemplate = (title, tplId, outline) => {
    const t = TEMPLATES.find((x) => x.id === tplId) || TEMPLATES[0]; const name = title.trim() || 'Untitled mind map';
    let map; if (outline?.trim()) { const p = parseOutline(outline); map = mapFromTree(name, p.title && !title.trim() ? p.tree : p.title ? [{ text: p.title, children: p.tree }] : p.tree); } else map = mapFromTree(name, t.tree);
    map.autoLayout = true; addMapToLibrary(map); setModal(null); say(`Created “${name}”`);
  };
  const duplicateMap = () => {
    if (!activeMap) return; const copy = normalizeMap(JSON.parse(JSON.stringify(activeMap)), { fresh: true }); copy.title = `${activeMap.title} (copy)`; copy.createdAt = now(); copy.updatedAt = now(); copy.cloudBackup = null; copy.autoLayout = activeMap.autoLayout;
    addMapToLibrary(copy); say('Duplicated');
  };
  const deleteMap = () => {
    if (!activeMap) return; const gone = activeMap; const remaining = mapsRef.current.filter((m) => m.id !== gone.id); mapsRef.current = remaining; setMaps(remaining);
    setActiveId(remaining[0]?.id || null); activeRef.current = remaining[0]?.id || null; selectOnly([]); setHist({ past: [], future: [] }); setModal(null);
    say(`Deleted “${gone.title}” from this browser`, { action: { label: 'Undo', run: () => { addMapToLibrary(gone); } } });
    if (!remaining.length) { const w = mapFromTree('My first mind map', []); w.autoLayout = true; addMapToLibrary(w); }
  };
  const visibleMaps = useMemo(() => {
    const q = query.trim().toLowerCase(); const list = maps.filter((m) => !q || m.title.toLowerCase().includes(q) || m.nodes.some((n) => n.text?.toLowerCase().includes(q)));
    return [...list].sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title) : String(b.updatedAt).localeCompare(String(a.updatedAt))));
  }, [maps, query, sort]);

  /* --------------------------------------------------------------- import */
  const finishImport = (incoming, label = 'Imported') => {
    const have = new Set(mapsRef.current.map((m) => m.id)); const conflicts = incoming.filter((m) => have.has(m.id));
    if (conflicts.length) { setModal({ type: 'conflict', incoming, conflicts, label }); return; }
    commitImport(incoming, 'keep', label);
  };
  const commitImport = (incoming, mode, label = 'Imported') => {
    const have = new Set(mapsRef.current.map((m) => m.id)); let add = []; let list = mapsRef.current;
    incoming.forEach((m) => {
      const dup = have.has(m.id);
      if (!dup) add.push({ ...m, autoLayout: m.autoLayout ?? false });
      else if (mode === 'replace') list = list.map((x) => (x.id === m.id ? { ...m, updatedAt: now() } : x));
      else if (mode === 'keep') add.push({ ...normalizeMap(m, { fresh: true }), title: `${m.title} (imported)`, autoLayout: m.autoLayout ?? false });
    });
    mapsRef.current = [...add, ...list]; setMaps(mapsRef.current); setModal(null);
    const first = add[0] || incoming.find((m) => list.some((x) => x.id === m.id));
    if (first) { setActiveId(first.id); activeRef.current = first.id; selectOnly([]); setHist({ past: [], future: [] }); setSizes({}); }
    say(`${label} ${incoming.length} mind map${incoming.length === 1 ? '' : 's'}`);
  };
  const importText = (text, filename) => { try { finishImport(parseAnyToMaps(text, filename)); return true; } catch (err) { say(`Import failed: ${err.message}`, { kind: 'bad' }); return false; } };
  const addImageFile = async (file, at) => {
    try {
      const { data, w, h } = await compressImage(file); const width = 240; const ratio = h / (w || 1);
      const n = createNode('image', 0, 0, file.name?.replace(/\.[^.]+$/, '') || '', { image: data, width, height: Math.round(width * ratio) + 28, color: '#ffffff', bold: false });
      const p = at || (() => { const r = viewportRef.current.getBoundingClientRect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); })(); n.x = Math.round(p.x - 120); n.y = Math.round(p.y - 80);
      apply((m) => ({ ...m, nodes: [...m.nodes, n], edges: primary && at === undefined ? [...m.edges, createEdge(primary.id, n.id, { cross: false })] : m.edges })); selectOnly([n.id]);
    } catch (err) { say(err.message || 'Could not add that image', { kind: 'bad' }); }
  };
  const handleFiles = async (files, dropAt) => {
    for (const f of Array.from(files)) {
      if (f.type.startsWith('image/')) { if (activeMap) await addImageFile(f, dropAt); continue; }
      if (f.size > 40 * 1024 * 1024) { say('That file is too large to import', { kind: 'bad' }); continue; }
      importText(await f.text(), f.name);
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const onPaste = async (e) => {
    const tag = e.target.tagName; if (['INPUT', 'TEXTAREA'].includes(tag) || !activeMap) return;
    const files = Array.from(e.clipboardData?.files || []).filter((f) => f.type.startsWith('image/')); if (files.length) { e.preventDefault(); files.forEach((f) => addImageFile(f)); return; }
    const text = e.clipboardData?.getData('text/plain') || ''; if (!text.trim()) return; e.preventDefault();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 1 && primary) { addChild(primary.id, { text: lines[0].trim(), edit: false }); return; }
    setModal({ type: 'paste', text, parent: primary?.id || null });
  };
  const pasteIntoMap = (text, parentId, asNew, title) => {
    const parsed = parseOutline(text); if (!parsed.tree.length && !parsed.title) { say('Nothing to import', { kind: 'bad' }); return; }
    if (asNew || !parentId) { const map = mapFromTree(title?.trim() || parsed.title || 'Imported outline', parsed.title && !title?.trim() ? parsed.tree : parsed.title ? [{ text: parsed.title, children: parsed.tree }] : parsed.tree); map.autoLayout = true; addMapToLibrary(map); setModal(null); say('Outline imported as a new map'); return; }
    const items = parsed.title ? [{ text: parsed.title, children: parsed.tree }] : parsed.tree;
    apply((m) => {
      let nodes = [...m.nodes]; let edges = [...m.edges]; const i0 = treeIndex(m); const base = depthOf(i0, parentId) + 1; let count = 0;
      const walk = (list, pid, depth, color) => list.forEach((it, k) => {
        const c = depth === base ? BRANCH_COLORS[(count++ + (i0.children.get(pid) || []).length) % BRANCH_COLORS.length] : color;
        const n = createNode(depth <= 2 ? 'topic' : 'box', 0, 0, it.text, { color: c, bold: depth <= 1, fontSize: depth <= 1 ? 16 : 14 }); nodes.push(n); edges.push(createEdge(pid, n.id)); walk(it.children || [], n.id, depth + 1, c);
      });
      walk(items, parentId, base, '#ffffff'); return { ...m, nodes: nodes.map((n) => (n.id === parentId ? { ...n, collapsed: false } : n)), edges, autoLayout: true };
    }); setModal(null); say('Outline added under the selected topic'); setTimeout(() => fit(), 250);
  };

  /* --------------------------------------------------------------- export */
  const markExport = () => setMeta((o) => ({ ...o, lastExportAt: Date.now() }));
  const doExport = async (kind) => {
    if (!activeMap) return; const base = slug(activeMap.title);
    try {
      if (kind === 'json') downloadBlob(new Blob([JSON.stringify({ format: 'gate-notebook-mindmap', version: 1, exportedAt: now(), map: activeMap }, null, 2)], { type: 'application/json' }), `${base}.mindmap.json`);
      else if (kind === 'all') downloadBlob(new Blob([JSON.stringify({ format: 'gate-notebook-mindmaps', version: 1, exportedAt: now(), maps }, null, 2)], { type: 'application/json' }), 'gate-notebook-mindmaps-backup.json');
      else if (kind === 'md') downloadBlob(new Blob([exportMarkdown(activeMap)], { type: 'text/markdown' }), `${base}.md`);
      else if (kind === 'opml') downloadBlob(new Blob([exportOpml(activeMap)], { type: 'text/x-opml' }), `${base}.opml`);
      else if (kind === 'mm') downloadBlob(new Blob([exportFreemind(activeMap)], { type: 'application/x-freemind' }), `${base}.mm`);
      else if (kind === 'copy') { await navigator.clipboard.writeText(exportMarkdown(activeMap)); say('Outline copied to clipboard'); return; }
      else { const { svg, width, height } = mapToSvg(activeMap, sizes, { hidden });
        if (kind === 'svg') downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${base}.svg`);
        else if (kind === 'png') downloadBlob(await svgToPngBlob(svg, width, height, 2), `${base}.png`);
        else if (kind === 'pdf') { const html = `<!doctype html><title>${activeMap.title.replace(/</g, '&lt;')}</title><style>@page{size:${width > height ? 'landscape' : 'portrait'};margin:10mm}body{margin:0}svg{max-width:100%;height:auto}</style>${svg}<script>onload=()=>setTimeout(()=>print(),300)<\/script>`; const url = URL.createObjectURL(new Blob([html], { type: 'text/html' })); if (!window.open(url, '_blank')) { say('Pop-up blocked — allow pop-ups to print / save as PDF', { kind: 'bad' }); return; } setTimeout(() => URL.revokeObjectURL(url), 60000); } }
      if (kind !== 'pdf') say('Exported'); markExport();
    } catch (err) { say(`Export failed: ${err.message}`, { kind: 'bad' }); }
  };

  /* --------------------------------------------------------------- cloud */
  const logBackup = (entry) => setCloudLog((l) => [{ id: uid(), at: Date.now(), ...entry }, ...l].slice(0, 40));
  const markCloud = (ids, url) => { const t = now(); mapsRef.current = mapsRef.current.map((m) => (ids.includes(m.id) ? { ...m, cloudBackup: { url, backedUpAt: t } } : m)); setMaps(mapsRef.current); setMeta((o) => ({ ...o, lastCloudAt: Date.now() })); };
  const needCloud = () => { if (cloudReady(cloudRef.current)) return true; setModal({ type: 'cloud', tab: 'setup' }); say('Set up Cloudinary first (2 minutes)'); return false; };
  const backupMap = async () => {
    if (!activeMap || !needCloud()) return; setBusy('map');
    try { const r = await uploadBackup(cloud, { name: activeMap.title, payload: { format: 'gate-notebook-mindmap', version: 1, backedUpAt: now(), map: activeMap }, tags: ['mindmap'] }); markCloud([activeMap.id], r.url); logBackup({ scope: 'map', label: activeMap.title, url: r.url, bytes: r.bytes, count: 1 }); say('Backed up to Cloudinary ☁'); }
    catch (err) { say(err.message, { kind: 'bad' }); } finally { setBusy(''); }
  };
  const backupAll = async (silent = false) => {
    if (!mapsRef.current.length || !cloudReady(cloudRef.current)) { if (!silent) needCloud(); return; } setBusy('all'); const list = mapsRef.current;
    try { const r = await uploadBackup(cloudRef.current, { name: 'library', payload: { format: 'gate-notebook-mindmaps', version: 1, backedUpAt: now(), maps: list }, tags: ['mindmap-library'] }); markCloud(list.map((m) => m.id), r.url); logBackup({ scope: 'all', label: `All maps (${list.length})`, url: r.url, bytes: r.bytes, count: list.length, auto: silent }); lastAutoRef.current = Date.now(); if (!silent) say('All maps backed up to Cloudinary ☁'); }
    catch (err) { if (!silent) say(err.message, { kind: 'bad' }); } finally { setBusy(''); }
  };
  const restoreUrl = async (url) => {
    setBusy('restore'); try { const text = await fetchBackup(url); const maps2 = parseAnyToMaps(text, 'backup.json'); setModal(null); finishImport(maps2, 'Restored'); } catch (err) { say(`Restore failed: ${err.message}`, { kind: 'bad' }); } finally { setBusy(''); }
  };
  const testCloud = async () => {
    if (!cloudReady(cloud)) { say('Enter both cloud name and preset first', { kind: 'bad' }); return; } setBusy('test');
    try { await uploadBackup(cloud, { name: 'connection-test', payload: { format: 'gate-notebook-test', at: now() }, tags: ['test'] }); say('Connection works ✓ Cloudinary accepted the test upload'); } catch (err) { say(err.message, { kind: 'bad' }); } finally { setBusy(''); }
  };
  useEffect(() => { // optional automatic cloud backup of the whole library
    if (!ready || !meta.autoMinutes || !cloudReady(cloud)) return undefined;
    const t = setInterval(() => { if (lastChangeRef.current > lastAutoRef.current && Date.now() - lastAutoRef.current >= meta.autoMinutes * 60000 && !document.hidden) backupAll(true); }, 30000);
    return () => clearInterval(t);
  }, [ready, meta.autoMinutes, cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------- stable handlers */
  L.current = { down: nodeDown, edit: startEdit, commit: commitEdit, text: changeText, toggle: toggleCollapse, linkStart, resizeStart };
  const on = useMemo(() => ({
    down: (e, id) => L.current.down(e, id), edit: (id) => L.current.edit(id), commit: (id, n) => L.current.commit(id, n), text: (id, t) => L.current.text(id, t),
    toggle: (id) => L.current.toggle(id), linkStart: (e, id) => L.current.linkStart(e, id), resizeStart: (e, id) => L.current.resizeStart(e, id),
  }), []);

  /* ------------------------------------------------------------------ render */
  const nodeById = (id) => activeMap?.nodes.find((n) => n.id === id);
  const edgeGeom = (e) => {
    const a = nodeById(e.from); const b = nodeById(e.to); if (!a || !b || hidden.has(a.id) || hidden.has(b.id)) return null;
    const sa = sizeOf(a); const sb = sizeOf(b); const right = b.x + sb.w / 2 >= a.x + sa.w / 2; const sx = right ? a.x + sa.w : a.x; const ex = right ? b.x : b.x + sb.w; const sy = a.y + sa.h / 2; const ey = b.y + sb.h / 2; const mid = (sx + ex) / 2;
    return { d: `M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ey}, ${ex} ${ey}`, mx: mid, my: (sy + ey) / 2 };
  };
  const hiddenCountOf = (id) => descendants(activeMap, id, idx).length;
  const hasBackupNote = maps.length && !(meta.lastExportAt && Date.now() - meta.lastExportAt < 14 * DAY) && !(meta.lastCloudAt && Date.now() - meta.lastCloudAt < 14 * DAY);
  const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : new Date(t).toLocaleDateString(); };
  const cloudState = (m) => (!m.cloudBackup ? null : String(m.cloudBackup.backedUpAt) >= String(m.updatedAt) ? 'ok' : 'stale');
  const approxBytes = [...sizeCacheRef.current.values()].reduce((a, b) => a + b, 0);

  const exportItems = [
    { head: 'Save a copy' },
    { icon: '{ }', label: 'This map (JSON)', onClick: () => doExport('json') }, { icon: '🗂', label: `All maps backup (${maps.length})`, onClick: () => doExport('all') },
    { head: 'Images & print' },
    { icon: '🖼', label: 'Image (PNG)', onClick: () => doExport('png') }, { icon: '◇', label: 'Vector image (SVG)', onClick: () => doExport('svg') }, { icon: '🖨', label: 'PDF / Print…', onClick: () => doExport('pdf') },
    { head: 'Other mind map apps' },
    { icon: '≡', label: 'Markdown outline (.md)', onClick: () => doExport('md') }, { icon: '⌥', label: 'OPML (XMind, MindNode…)', onClick: () => doExport('opml') }, { icon: '✱', label: 'FreeMind / XMind (.mm)', onClick: () => doExport('mm') }, { icon: '⧉', label: 'Copy outline text', onClick: () => doExport('copy') },
  ];
  const importItems = [
    { icon: '📂', label: 'From file… (JSON, MD, OPML, MM)', onClick: () => fileRef.current?.click() },
    { icon: '📋', label: 'Paste an outline…', onClick: () => setModal({ type: 'paste', text: '', parent: primary?.id || null }) },
    { icon: '🔗', label: 'From a web link…', onClick: () => setModal({ type: 'link' }) },
    { icon: '☁', label: 'Restore from cloud backup…', onClick: () => setModal({ type: 'cloud', tab: 'backups' }) },
  ];
  const moreItems = [
    { icon: '＋', label: 'New mind map…', onClick: () => setModal({ type: 'new' }) }, { icon: '☰', label: 'All my maps', onClick: () => (fs ? setLibOpen(true) : document.querySelector('.mm-library')?.scrollIntoView({ behavior: 'smooth' })) }, { sep: true },
    { icon: '✎', label: 'Rename map', onClick: () => document.getElementById('mm-title')?.select() }, { icon: '⧉', label: 'Duplicate map', onClick: duplicateMap }, { sep: true },
    { icon: '⊟', label: 'Collapse all branches', onClick: () => setAllCollapsed(true) }, { icon: '⊞', label: 'Expand all branches', onClick: () => setAllCollapsed(false) }, { sep: true },
    { icon: '🗑', label: 'Delete map…', danger: true, onClick: () => setModal({ type: 'delete' }) },
  ];
  const viewItems = [
    { icon: '⤢', label: 'Fit to screen', hint: 'Ctrl+0', onClick: () => fit() }, { icon: '1:1', label: 'Actual size (100%)', onClick: () => setView((v) => ({ ...v, zoom: 1 })) },
    { icon: '🖱', label: `Mouse wheel: ${meta.wheelZoom ? 'zooms ✓' : 'scrolls ✓'} — switch`, onClick: () => setMeta((o) => ({ ...o, wheelZoom: !o.wheelZoom })) }, { sep: true },
    { icon: '⌨', label: 'Keyboard shortcuts', hint: '?', onClick: () => setModal({ type: 'help' }) },
  ];
  const addItems = [
    { icon: 'T', label: 'Text label', onClick: () => addFree('text', 'Text') }, { icon: '▱', label: 'Box', onClick: () => addFree('box', 'Box') },
    { icon: '▧', label: 'Image…', onClick: () => imageRef.current?.click() }, { sep: true }, ...STICKERS.slice(0, 6).map((s) => ({ icon: s, label: 'Sticker', onClick: () => addFree('sticker', s) })),
  ];

  const canvasEmpty = activeMap && !activeMap.nodes.length;
  return (
    <div className={`mindmaps-page ${fs ? 'fs' : ''}`} onDragEnter={(e) => { if (e.dataTransfer?.types?.includes('Files')) { dragDepth.current++; setDropping(true); } }} onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDropping(false); }} onDragOver={(e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); dragDepth.current = 0; setDropping(false); if (e.dataTransfer.files?.length) { const inCanvas = viewportRef.current?.contains(e.target); handleFiles(e.dataTransfer.files, inCanvas ? toWorld(e.clientX, e.clientY) : undefined); } }}>
      <header className="mm-page-heading">
        <div><p className="crumb">GATE CSE workspace</p><h1>Mind Maps</h1><p className="muted">Draw ideas, keep them in your browser, and back them up or move them anywhere.</p></div>
        <div className="mm-page-actions"><Dropdown label="⬆ Import" items={importItems} align="right" /><button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}>＋ New mind map</button></div>
      </header>

      <div className="mm-layout">
        {fs && libOpen && <div className="mm-drawer-backdrop" onClick={() => setLibOpen(false)} />}
        <aside className={`mm-library ${libOpen ? 'open' : ''}`} aria-label="Your mind maps">
          <button className="mm-lib-toggle" onClick={() => setLibOpen((v) => !v)} aria-expanded={libOpen}><span>☰ {activeMap?.title || 'Your maps'}</span><span>{maps.length} {maps.length === 1 ? 'map' : 'maps'} ▾</span></button>
          <div className="mm-library-top"><strong>Your maps</strong><span>{maps.length}</span><button className="btn btn-small mm-lib-new" onClick={() => setModal({ type: 'new' })}>＋ New</button>{fs && <button className="mm-x" onClick={() => setLibOpen(false)} aria-label="Close maps list">×</button>}</div>
          <div className="mm-search-row"><input className="mm-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search maps & topics…" aria-label="Search mind maps" /><select className="mm-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort maps"><option value="recent">Recent</option><option value="name">A–Z</option></select></div>
          <div className="mm-map-list" role="list">
            {visibleMaps.map((m) => { const cs = cloudState(m); return (
              <button key={m.id} role="listitem" className={`mm-map-item ${m.id === activeId ? 'active' : ''}`} onClick={() => openMap(m.id)}>
                <span className="mm-map-icon">🧠</span><span className="mm-map-item-copy"><strong>{m.title}</strong><small>{m.nodes.length} objects · {new Date(m.updatedAt || m.createdAt).toLocaleDateString()}</small></span>
                {cs && <span className={`mm-cloud-dot ${cs}`} title={cs === 'ok' ? 'Cloud backup is up to date' : 'Changed since last cloud backup'}>{cs === 'ok' ? '☁✓' : '☁!'}</span>}
              </button>); })}
            {!visibleMaps.length && <p className="mm-empty-small">{query ? 'No maps match your search.' : 'No maps yet — create one to begin.'}</p>}
          </div>
          <div className="mm-library-actions"><button className="btn btn-ghost" onClick={() => doExport('all')} disabled={!maps.length}>⬇ Backup all</button><button className="btn btn-ghost" onClick={() => setModal({ type: 'cloud', tab: 'backups' })}>☁ Cloud</button></div>
          <div className="mm-storage-note">
            <div className="mm-status-line"><span className={`mm-status-dot ${saveState.s}`} /><span>{saveState.s === 'saving' ? 'Saving…' : saveState.s === 'error' ? saveState.msg : saveState.s === 'loading' ? 'Loading…' : `Saved in this browser ${storageMode === 'indexeddb' ? '' : '(basic mode)'}`}</span></div>
            {usage && <small>{formatBytes(approxBytes || usage.used)} used{usage.quota ? ` of ${formatBytes(usage.quota)} available` : ''}</small>}
            {hasBackupNote ? <button className="mm-link" onClick={() => doExport('all')}>⚠ No backup yet — download one</button> : <small>Last backup: {ago(Math.max(meta.lastExportAt || 0, meta.lastCloudAt || 0))}</small>}
          </div>
        </aside>

        <section className="mm-editor" ref={surfaceRef} tabIndex={-1} onKeyDown={onKeyDown} onPaste={onPaste} aria-label="Mind map editor">
          {!activeMap ? <div className="mm-no-map"><h2>No map selected</h2><button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}>Create your first map</button></div> : <>
            <div className="mm-editor-head">
              <div className="mm-map-title-wrap">
                {fs && <button className="mm-min-btn" onClick={exitFs} title="Minimize — back to the page (Esc)" aria-label="Minimize full screen">⤡<span className="mm-lbl"> Minimize</span></button>}
                {fs && <button className="mm-icon-btn" onClick={() => setLibOpen(true)} title="Your maps" aria-label="Open maps list">☰</button>}
                <input id="mm-title" className="mm-title-input" value={activeMap.title} onChange={(e) => apply((m) => ({ ...m, title: e.target.value }), { key: 'title' })} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} aria-label="Mind map title" placeholder="Map title" />
                <span className={`mm-save-label ${saveState.s}`}>{saveState.s === 'saving' ? 'Saving…' : saveState.s === 'error' ? '⚠ Not saved' : '✓ Saved'}</span>
              </div>
              <div className="mm-head-actions">
                {fs && <Dropdown label={<><span>⬆</span><span className="mm-lbl"> Import</span></>} items={importItems} align="right" title="Import" />}
                <Dropdown label={<><span>⬇</span><span className="mm-lbl"> Export</span></>} items={exportItems} align="right" title="Export or print this map" />
                <button className="btn mm-cloud-btn" onClick={() => setModal({ type: 'cloud', tab: cloudReady(cloud) ? 'backups' : 'setup' })} title="Cloud backup">☁<span className="mm-lbl"> Cloud</span>{cloudState(activeMap) === 'stale' ? ' •' : ''}</button>
                {!fs && <button className="btn mm-fs-btn" onClick={enterFs} title="Edit in full screen">⛶<span className="mm-lbl"> Full screen</span></button>}
                <Dropdown label="⋯" items={moreItems} align="right" title="More map actions" className="mm-dd-icon" />
              </div>
            </div>

            <div className="mm-toolbar" role="toolbar" aria-label="Mind map tools">
              <div className="mm-toolbar-group">
                <button className="primary" onClick={() => (primary ? addChild(primary.id) : addChild(activeMap.nodes[0]?.id))} disabled={!activeMap.nodes.length} title="Add child topic (Tab)">＋ Child</button>
                <button onClick={() => primary && addSibling(primary.id)} disabled={!primary} title="Add sibling topic (Enter)">＋ Sibling</button>
                <button onClick={() => primary && startEdit(primary.id)} disabled={!primary || sel.length !== 1} title="Edit text (F2 / double-tap)">✎ Edit</button>
                <Dropdown label="＋ More" items={addItems} />
                <button className={linkMode ? 'on' : ''} onClick={() => { if (!primary) { say('Select a topic first, then click another one to connect them'); return; } setLinkMode((v) => !v); }} title="Connect the selected topic to another" aria-pressed={linkMode}>↗ Connect</button>
                <button className={selectMode ? 'on' : ''} onClick={() => setSelectMode((v) => !v)} title="Drag on empty space to select many topics" aria-pressed={selectMode}>⬚ Select</button>
                <button onClick={() => deleteNodes(sel, true)} disabled={!sel.length} title="Delete selected (Delete)" className="mm-tb-del">🗑</button>
              </div>
              <div className="mm-toolbar-group">
                <button onClick={undo} disabled={!hist.past.length} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button><button onClick={redo} disabled={!hist.future.length} title="Redo (Ctrl+Y)" aria-label="Redo">↷</button>
                <button onClick={tidy} title="Neatly arrange all topics" className={activeMap.autoLayout ? 'on' : ''}>✦ Tidy</button>
              </div>
              <div className="mm-toolbar-group mm-zoom">
                <button onClick={() => zoomAt(1 / 1.2)} aria-label="Zoom out">−</button><span>{Math.round(view.zoom * 100)}%</span><button onClick={() => zoomAt(1.2)} aria-label="Zoom in">＋</button><button onClick={() => fit()} title="Fit all to screen (Ctrl+0)">Fit</button>
                {fs && narrow && <button className={sheetOpen ? 'on' : ''} onClick={() => setSheetOpen((v) => !v)} aria-pressed={sheetOpen}>🎨 Style</button>}
                <Dropdown label="View" items={viewItems} align="right" />
              </div>
            </div>
            {selectMode && <div className="mm-message" role="status"><span>Select mode: drag on empty space to select several topics, then move, style or delete them together.</span><button onClick={() => setSelectMode(false)} aria-label="Stop selecting">×</button></div>}
            {linkMode && <div className="mm-message" role="status"><span>Connect mode: click the topic you want to link <strong>to “{primary?.text || 'selection'}”</strong>. Press Esc to stop.</span><button onClick={() => setLinkMode(false)} aria-label="Stop connecting">×</button></div>}

            <div className="mm-workarea">
              <div ref={viewportRef} className={`mm-canvas-viewport ${linkMode ? 'linking' : ''}`} onPointerDown={canvasDown} onPointerMove={canvasMove} onPointerUp={canvasUp} onPointerCancel={canvasUp} role="tree" aria-label="Mind map canvas"
                style={{ backgroundSize: `${22 * view.zoom}px ${22 * view.zoom}px`, backgroundPosition: `${view.x}px ${view.y}px` }}>
                <div className="mm-world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
                  <svg className="mm-edges" width="1" height="1" aria-hidden="true">
                    <defs><marker id="mm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="context-stroke" /></marker></defs>
                    {activeMap.edges.map((edge) => { const g = edgeGeom(edge); if (!g) return null; const chosen = selEdge === edge.id; const col = edge.color || '#94a3b8'; return (
                      <g key={edge.id}>
                        <path d={g.d} fill="none" stroke="transparent" strokeWidth="16" style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onPointerDown={(ev) => { ev.stopPropagation(); surfaceRef.current?.focus({ preventScroll: true }); setSelEdge(edge.id); setSel([]); }} />
                        <path d={g.d} fill="none" stroke={col} strokeWidth={chosen ? 4 : 2.5} strokeDasharray={edge.style === 'dashed' || edge.cross ? '7 5' : undefined} markerEnd={edge.cross ? 'url(#mm-arrow)' : undefined} style={{ pointerEvents: 'none' }} />
                        {edge.label && <text x={g.mx} y={g.my - 7} textAnchor="middle" className="mm-edge-label">{edge.label}</text>}
                      </g>); })}
                    {linkLine && <path d={`M ${linkLine.x1} ${linkLine.y1} L ${linkLine.x2} ${linkLine.y2}`} stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="5 4" fill="none" markerEnd="url(#mm-arrow)" style={{ pointerEvents: 'none' }} />}
                  </svg>
                  {activeMap.nodes.filter((n) => !hidden.has(n.id)).map((node) => (
                    <NodeView key={node.id} node={node} selected={sel.includes(node.id)} single={sel.length === 1} editing={editingId === node.id}
                      hasKids={(idx.children.get(node.id) || []).length > 0} hiddenCount={node.collapsed ? hiddenCountOf(node.id) : 0} register={register} on={on} />
                  ))}
                </div>
                {marquee && <div className="mm-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
                {canvasEmpty && <div className="mm-canvas-empty"><p>This map is empty.</p><button className="btn btn-primary" onClick={() => { const n = createNode('topic', 80, 200, 'Central topic', { fontSize: 18 }); apply((m) => ({ ...m, nodes: [n] })); selectOnly([n.id]); setEditingId(n.id); }}>＋ Add central topic</button></div>}
                {dropping && <div className="mm-drop"><div>⬇ Drop a file to import it<small>JSON · Markdown · OPML · FreeMind · images</small></div></div>}
                {!fs && <button className="mm-fs-fab" onPointerDown={(e) => e.stopPropagation()} onClick={enterFs}>⛶ Edit full screen</button>}
                <div className="mm-canvas-hint">Drag to pan · {meta.wheelZoom ? 'Scroll' : 'Ctrl + scroll'} to zoom · Shift + drag to select</div>
              </div>

              <aside className={`mm-properties ${meta.propsOpen ? '' : 'collapsed'} ${sheetOpen ? 'sheet-open' : ''}`}>
                <button className="mm-properties-title" onClick={() => (fs && narrow ? setSheetOpen(false) : setMeta((o) => ({ ...o, propsOpen: !o.propsOpen })))} aria-expanded={meta.propsOpen}><strong>Properties</strong><span>{edgeSel ? 'connector' : selNodes.length > 1 ? `${selNodes.length} selected` : primary ? primary.type : 'map'} {fs && narrow ? '✕' : meta.propsOpen ? '▾' : '▸'}</span></button>
                {(meta.propsOpen || (fs && narrow)) && (edgeSel ? <EdgePanel edge={edgeSel} apply={apply} onDelete={() => { apply((m) => ({ ...m, edges: m.edges.filter((e) => e.id !== edgeSel.id) })); setSelEdge(null); }} />
                  : primary ? <NodePanel nodes={selNodes} primary={primary} patch={(p, key) => patchNodes(sel, p, { key: key || JSON.stringify(Object.keys(p)) })} onEdit={() => startEdit(primary.id)} onChild={() => addChild(primary.id)} onSibling={() => addSibling(primary.id)} onDup={() => duplicateBranch(sel)} onDelete={(branch) => deleteNodes(sel, branch)} onToggle={() => toggleCollapse(primary.id)} hasKids={(idx.children.get(primary.id) || []).length > 0} />
                  : <MapPanel map={activeMap} addSticker={(s) => addFree('sticker', s)} />)}
              </aside>
            </div>
            <footer className="mm-editor-footer"><span>{selNodes.length ? `${selNodes.length} selected · ` : ''}{activeMap.nodes.length} objects · {activeMap.edges.length} connections</span><span className="mm-tip-line">Tab = child · Enter = sibling · F2 = edit · Space = fold · ? = all shortcuts</span></footer>
          </>}
        </section>
      </div>

      <input ref={fileRef} type="file" accept=".json,.md,.markdown,.txt,.opml,.mm,.xml,application/json,text/*,image/*" multiple hidden onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />
      <input ref={imageRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) addImageFile(e.target.files[0]); e.target.value = ''; }} />
      <Toast toast={toast} onClose={() => setToast(null)} />
      {modal?.type === 'new' && <NewMapModal onClose={() => setModal(null)} onCreate={createFromTemplate} />}
      {modal?.type === 'delete' && activeMap && <Modal title="Delete this mind map?" onClose={() => setModal(null)} footer={<><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-danger-solid" onClick={deleteMap}>Delete map</button></>}><p>“<strong>{activeMap.title}</strong>” will be removed from this browser. You can undo right after. {activeMap.cloudBackup ? 'Its Cloudinary backup is not deleted.' : 'It has no cloud backup — consider exporting it first.'}</p></Modal>}
      {modal?.type === 'conflict' && <Modal title="Some maps already exist" onClose={() => setModal(null)} footer={<><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn" onClick={() => commitImport(modal.incoming, 'skip', modal.label)}>Skip duplicates</button><button className="btn" onClick={() => commitImport(modal.incoming, 'replace', modal.label)}>Replace existing</button><button className="btn btn-primary" data-autofocus onClick={() => commitImport(modal.incoming, 'keep', modal.label)}>Keep both</button></>}><p><strong>{modal.conflicts.length}</strong> of {modal.incoming.length} map(s) in this file are already in your library: {modal.conflicts.slice(0, 4).map((m) => `“${m.title}”`).join(', ')}{modal.conflicts.length > 4 ? '…' : ''}</p><p className="muted">“Keep both” is the safest choice — it adds the file’s copy without touching your current map.</p></Modal>}
      {modal?.type === 'paste' && <PasteModal key="paste" initial={modal.text} parent={modal.parent ? nodeById(modal.parent) : null} onClose={() => setModal(null)} onImport={pasteIntoMap} />}
      {modal?.type === 'link' && <LinkModal busy={busy === 'restore'} onClose={() => setModal(null)} onRestore={restoreUrl} />}
      {modal?.type === 'help' && <HelpModal onClose={() => setModal(null)} />}
      {modal?.type === 'cloud' && <CloudModal tab={modal.tab} setTab={(tab) => setModal({ type: 'cloud', tab })} onClose={() => setModal(null)} cloud={cloud} setCloud={setCloud} log={cloudLog} setLog={setCloudLog} busy={busy} activeMap={activeMap} mapCount={maps.length}
        onBackupMap={backupMap} onBackupAll={() => backupAll(false)} onRestore={restoreUrl} onTest={testCloud} meta={meta} setMeta={setMeta} say={say} ago={ago} cloudState={activeMap ? cloudState(activeMap) : null} />}
    </div>
  );
}

/* ----------------------------------------------------------- side panels */
function NodePanel({ nodes, primary, patch, onEdit, onChild, onSibling, onDup, onDelete, onToggle, hasKids }) {
  const multi = nodes.length > 1; const isImg = primary.type === 'image'; const isSticker = primary.type === 'sticker';
  return (<>
    {!multi && <label className="mm-prop-label">{isImg ? 'Caption' : 'Text'}<textarea value={primary.text} onChange={(e) => patch({ text: e.target.value }, 'text')} rows={3} /></label>}
    {!multi && <div className="mm-prop-buttons"><button className="btn" onClick={onChild}>＋ Child</button><button className="btn" onClick={onSibling}>＋ Sibling</button></div>}
    {!isImg && !isSticker && (<div className="mm-prop-label">Fill color
      <div className="mm-color-grid">{COLORS.map((c) => <button key={c} className={primary.color === c ? 'chosen' : ''} style={{ background: c }} onClick={() => patch({ color: c }, 'color')} aria-label={`Fill ${c}`} />)}
        <label className="mm-color-custom" title="Custom color">🎨<input type="color" value={/^#[0-9a-f]{6}$/i.test(primary.color) ? primary.color : '#ffffff'} onChange={(e) => patch({ color: e.target.value }, 'color')} /></label>
        <button className={primary.color === 'transparent' ? 'chosen none' : 'none'} onClick={() => patch({ color: 'transparent' }, 'color')} aria-label="No fill" title="No fill">∅</button></div></div>)}
    {!isImg && <label className="mm-prop-label">Font size <span>{primary.fontSize || 15}px</span><input type="range" min="11" max="48" value={primary.fontSize || 15} onChange={(e) => patch({ fontSize: Number(e.target.value) }, 'font')} /></label>}
    {!isImg && <div className="mm-prop-buttons"><button className={`btn ${primary.bold ? 'btn-primary' : ''}`} onClick={() => patch({ bold: !primary.bold })} aria-pressed={!!primary.bold}><strong>B</strong></button><button className={`btn ${primary.italic ? 'btn-primary' : ''}`} onClick={() => patch({ italic: !primary.italic })} aria-pressed={!!primary.italic}><em>I</em></button>
      <button className="btn" onClick={() => patch({ align: primary.align === 'left' ? 'center' : primary.align === 'center' ? 'right' : 'left' })} title="Cycle text alignment">{primary.align === 'left' ? '⇤ Left' : primary.align === 'right' ? '⇥ Right' : '↔ Center'}</button></div>}
    {!isSticker && <label className="mm-prop-label">Width <span>{Math.round(primary.width)}px</span><input type="range" min="80" max="600" value={primary.width} onChange={(e) => patch({ width: Number(e.target.value) }, 'width')} /></label>}
    <div className="mm-prop-buttons">{hasKids && <button className="btn" onClick={onToggle}>{primary.collapsed ? '⊞ Expand' : '⊟ Collapse'}</button>}<button className="btn" onClick={onDup} title="Ctrl+D">⧉ Duplicate</button></div>
    <button className="btn btn-danger mm-delete-object" onClick={() => onDelete(true)}>🗑 Delete{hasKids || multi ? ' with branch' : ''}</button>
    {hasKids && !multi && <button className="btn mm-delete-object" onClick={() => onDelete(false)}>Delete only this topic</button>}
  </>);
}
function EdgePanel({ edge, apply, onDelete }) {
  const set = (p, key) => apply((m) => ({ ...m, edges: m.edges.map((e) => (e.id === edge.id ? { ...e, ...p } : e)) }), { key });
  return (<>
    <label className="mm-prop-label">Label<input className="mm-prop-input" value={edge.label || ''} onChange={(e) => set({ label: e.target.value }, 'elabel')} placeholder="e.g. leads to…" /></label>
    <div className="mm-prop-label">Color<div className="mm-color-grid">{EDGE_COLORS.map((c) => <button key={c} className={edge.color === c ? 'chosen' : ''} style={{ background: c }} onClick={() => set({ color: c }, 'ecolor')} aria-label={`Line ${c}`} />)}</div></div>
    <div className="mm-prop-buttons"><button className={`btn ${edge.style !== 'dashed' && !edge.cross ? 'btn-primary' : ''}`} onClick={() => set({ style: 'solid', cross: false })}>Solid</button><button className={`btn ${edge.style === 'dashed' || edge.cross ? 'btn-primary' : ''}`} onClick={() => set({ style: 'dashed' })}>Dashed</button></div>
    <button className="btn btn-danger mm-delete-object" onClick={onDelete}>Delete connector</button>
  </>);
}
function MapPanel({ map, addSticker }) {
  return (<>
    <div className="mm-property-empty"><span>👆</span><p>Select a topic to edit it.</p><small>Click a line to style it. Hold <kbd>Shift</kbd> and drag to select many.</small></div>
    <dl className="mm-map-facts"><div><dt>Created</dt><dd>{new Date(map.createdAt).toLocaleDateString()}</dd></div><div><dt>Edited</dt><dd>{new Date(map.updatedAt).toLocaleString()}</dd></div><div><dt>Cloud</dt><dd>{map.cloudBackup ? new Date(map.cloudBackup.backedUpAt).toLocaleString() : 'Not backed up'}</dd></div></dl>
    <div className="mm-sticker-palette"><strong>Quick stickers</strong><div>{STICKERS.map((s) => <button key={s} onClick={() => addSticker(s)} aria-label={`Add ${s}`}>{s}</button>)}</div></div>
  </>);
}

/* --------------------------------------------------------------- modals */
function NewMapModal({ onClose, onCreate }) {
  const [title, setTitle] = useState(''); const [tpl, setTpl] = useState('subject'); const [outline, setOutline] = useState(''); const [more, setMore] = useState(false);
  const submit = (e) => { e?.preventDefault(); onCreate(title, tpl, more ? outline : ''); };
  return (
    <Modal title="New mind map" onClose={onClose} wide footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Create map</button></>}>
      <form onSubmit={submit}>
        <label className="mm-prop-label">Name<input className="mm-prop-input" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Operating Systems" /></label>
        <div className="mm-tpl-grid" role="radiogroup" aria-label="Template">{TEMPLATES.map((t) => <button type="button" key={t.id} role="radio" aria-checked={tpl === t.id && !more} className={`mm-tpl ${tpl === t.id && !more ? 'on' : ''}`} onClick={() => { setTpl(t.id); setMore(false); }}><span>{t.icon}</span><strong>{t.name}</strong><small>{t.desc}</small></button>)}
          <button type="button" role="radio" aria-checked={more} className={`mm-tpl ${more ? 'on' : ''}`} onClick={() => setMore(true)}><span>📋</span><strong>From an outline</strong><small>Paste indented text or bullets</small></button></div>
        {more && <label className="mm-prop-label">Outline<textarea className="mm-outline-box" rows={7} value={outline} onChange={(e) => setOutline(e.target.value)} placeholder={'Operating Systems\n  Processes\n    Scheduling\n    Deadlocks\n  Memory\n    Paging'} /></label>}
      </form>
    </Modal>
  );
}
function PasteModal({ initial, parent, onClose, onImport }) {
  const [text, setText] = useState(initial || ''); const [where, setWhere] = useState(parent ? 'under' : 'new'); const [title, setTitle] = useState('');
  return (
    <Modal title="Paste an outline" onClose={onClose} wide footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!text.trim()} onClick={() => onImport(text, parent?.id, where === 'new', title)}>Import</button></>}>
      <p className="muted">Paste indented text, a bulleted list or Markdown headings — each line becomes a topic.</p>
      <textarea className="mm-outline-box" data-autofocus rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={'- Main idea\n  - Detail one\n  - Detail two'} />
      <div className="mm-radio-row">
        {parent && <label><input type="radio" checked={where === 'under'} onChange={() => setWhere('under')} /> Add under “{parent.text || 'selected topic'}”</label>}
        <label><input type="radio" checked={where === 'new'} onChange={() => setWhere('new')} /> Create a new map</label>
      </div>
      {where === 'new' && <label className="mm-prop-label">Map name (optional)<input className="mm-prop-input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>}
    </Modal>
  );
}
function LinkModal({ busy, onClose, onRestore }) {
  const [url, setUrl] = useState('');
  return (
    <Modal title="Import from a web link" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy || !url.trim()} onClick={() => onRestore(url)}>{busy ? 'Downloading…' : 'Import'}</button></>}>
      <p className="muted">Paste a public https link to a mind map JSON, Markdown or OPML file (for example a Cloudinary backup link).</p>
      <input className="mm-prop-input" data-autofocus value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && url.trim() && onRestore(url)} placeholder="https://res.cloudinary.com/…/map.json" />
    </Modal>
  );
}
function HelpModal({ onClose }) {
  const rows = [['Tab', 'Add child topic'], ['Enter', 'Add sibling topic'], ['F2 / double-click', 'Edit text (Enter to finish)'], ['Space', 'Collapse / expand branch'], ['Delete', 'Delete topic with its branch'], ['Shift + Delete', 'Delete only this topic'], ['Arrow keys', 'Move between topics'], ['Shift + click', 'Add to selection'], ['Shift + drag', 'Box-select'], ['Ctrl + A', 'Select all'], ['Ctrl + D', 'Duplicate branch'], ['Ctrl + Z / Y', 'Undo / redo'], ['Ctrl + 0', 'Fit map to screen'], ['Ctrl + scroll / pinch', 'Zoom'], ['Ctrl + V', 'Paste text outline or image'], ['Drop a file', 'Import JSON, MD, OPML, MM or image']];
  return (<Modal title="Keyboard shortcuts & gestures" onClose={onClose} wide footer={<button className="btn btn-primary" onClick={onClose}>Got it</button>}><table className="mm-keys"><tbody>{rows.map(([k, d]) => <tr key={k}><td><kbd>{k}</kbd></td><td>{d}</td></tr>)}</tbody></table></Modal>);
}
function CloudModal({ tab, setTab, onClose, cloud, setCloud, log, setLog, busy, activeMap, mapCount, onBackupMap, onBackupAll, onRestore, onTest, meta, setMeta, say, ago, cloudState }) {
  const ready = cloudReady(cloud); const [url, setUrl] = useState(''); const [code, setCode] = useState('');
  const copy = async (text, msg) => { try { await navigator.clipboard.writeText(text); say(msg); } catch { say('Could not copy — select and copy manually', { kind: 'bad' }); } };
  return (
    <Modal title="☁ Cloud backup (Cloudinary)" onClose={onClose} wide>
      <div className="mm-tabs" role="tablist"><button role="tab" aria-selected={tab === 'backups'} className={tab === 'backups' ? 'on' : ''} onClick={() => setTab('backups')}>Backups & restore</button><button role="tab" aria-selected={tab === 'setup'} className={tab === 'setup' ? 'on' : ''} onClick={() => setTab('setup')}>{ready ? 'Settings' : 'Set up'}{!ready && ' •'}</button></div>
      {tab === 'backups' ? (<>
        {!ready && <div className="mm-callout">Cloud backup isn’t set up yet. <button className="mm-link" onClick={() => setTab('setup')}>Set it up in 2 minutes →</button> (Restoring from a link works without setup.)</div>}
        <div className="mm-cloud-actions">
          <button className="btn btn-primary" disabled={!ready || !!busy || !activeMap} onClick={onBackupMap}>{busy === 'map' ? 'Uploading…' : '☁ Back up this map'}</button>
          <button className="btn" disabled={!ready || !!busy || !mapCount} onClick={onBackupAll}>{busy === 'all' ? 'Uploading…' : `☁ Back up all ${mapCount} maps`}</button>
        </div>
        {activeMap && <p className="mm-cloud-status muted">“{activeMap.title}”: {cloudState === 'ok' ? '✓ cloud copy is up to date' : cloudState === 'stale' ? '• changed since last cloud backup' : 'never backed up to the cloud'}</p>}
        <label className="mm-prop-label">Automatic backup of all maps<select className="mm-prop-input" disabled={!ready} value={meta.autoMinutes} onChange={(e) => setMeta((o) => ({ ...o, autoMinutes: Number(e.target.value) }))}><option value={0}>Off (manual only)</option><option value={15}>At most every 15 minutes after changes</option><option value={60}>At most every hour after changes</option></select></label>
        <h4 className="mm-h4">Restore from a link</h4>
        <div className="mm-restore-row"><input className="mm-prop-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a backup link (https://res.cloudinary.com/…)" aria-label="Backup link" /><button className="btn" disabled={!!busy || !url.trim()} onClick={() => onRestore(url)}>{busy === 'restore' ? 'Restoring…' : 'Restore'}</button></div>
        <h4 className="mm-h4">Recent backups from this browser</h4>
        {log.length ? <ul className="mm-log">{log.slice(0, 8).map((l) => (<li key={l.id}><div><strong>{l.scope === 'all' ? '🗂' : '🧠'} {l.label}</strong>{l.auto && <em> · auto</em>}<small>{ago(l.at)} · {formatBytes(l.bytes || 0)}</small></div><div className="mm-log-actions"><button className="btn btn-small" disabled={!!busy} onClick={() => onRestore(l.url)}>Restore</button><button className="btn btn-small" onClick={() => copy(l.url, 'Backup link copied')}>Copy link</button><button className="btn btn-small" onClick={() => setLog((x) => x.filter((i) => i.id !== l.id))} aria-label="Forget this entry" title="Remove from this list (the cloud file stays)">✕</button></div></li>))}</ul> : <p className="muted">Nothing yet. After you back up, links appear here so you can restore with one click — or copy a link to open your maps on another device.</p>}
      </>) : (<>
        <ol className="mm-steps">
          <li>In Cloudinary open <strong>Settings → Upload → Upload presets → Add upload preset</strong>.</li>
          <li>Set <strong>Signing mode: Unsigned</strong> and give it a name (for example <code>mindmaps</code>). Allow <strong>raw</strong> files if asked.</li>
          <li>Copy your <strong>Cloud name</strong> (top-left of the dashboard) and the preset name here.</li>
        </ol>
        <div className="mm-cloud-fields"><label>Cloud name<input className="mm-prop-input" data-autofocus value={cloud.cloudName} onChange={(e) => setCloud((c) => ({ ...c, cloudName: e.target.value.trim() }))} placeholder="your-cloud-name" autoComplete="off" /></label><label>Unsigned upload preset<input className="mm-prop-input" value={cloud.uploadPreset} onChange={(e) => setCloud((c) => ({ ...c, uploadPreset: e.target.value.trim() }))} placeholder="mindmaps" autoComplete="off" /></label></div>
        <div className="mm-toolbar-row"><button className="btn btn-primary" disabled={!ready || !!busy} onClick={onTest}>{busy === 'test' ? 'Testing…' : 'Test connection'}</button>{ready && <button className="btn" onClick={() => setTab('backups')}>Done →</button>}</div>
        <h4 className="mm-h4">Use on another device</h4>
        <div className="mm-restore-row"><button className="btn" disabled={!ready} onClick={() => copy(makeSetupCode(cloud), 'Setup code copied — paste it on your other device')}>Copy setup code</button><input className="mm-prop-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste a setup code here" aria-label="Setup code" /><button className="btn" disabled={!code.trim()} onClick={() => { try { setCloud(parseSetupCode(code)); setCode(''); say('Cloudinary settings applied'); } catch (err) { say(err.message, { kind: 'bad' }); } }}>Apply</button></div>
        <p className="mm-cloud-help muted">Settings stay in this browser only. Never enter your API secret — it isn’t needed. Backups go to the <code>{CLOUD_FOLDER}</code> folder as JSON files that anyone with the link can open, so avoid private information. Delete old backups in the Cloudinary Media Library whenever you like.</p>
      </>)}
    </Modal>
  );
}
