// Mind map data model, hierarchy helpers and auto layout.
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export const now = () => new Date().toISOString();

export const COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#ffedd5', '#e2e8f0', '#ffffff'];
export const BRANCH_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#ffedd5'];
export const EDGE_COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
export const STICKERS = ['⭐', '💡', '🎯', '📌', '🧠', '🔥', '✅', '⚠️', '💯', '📚', '🚀', '❓'];

export function createNode(type, x, y, text, extra = {}) {
  const base = {
    id: uid(), type, x, y,
    width: type === 'sticker' ? 76 : type === 'text' ? 220 : type === 'image' ? 240 : 190,
    height: type === 'sticker' ? 76 : type === 'text' ? 44 : type === 'image' ? 170 : 52,
    text: text ?? '', color: type === 'topic' ? '#dbeafe' : '#ffffff',
    fontSize: type === 'sticker' ? 36 : 15, image: '', bold: type === 'topic', italic: false,
    align: 'center', collapsed: false,
  };
  return { ...base, ...extra };
}

export function createEdge(from, to, extra = {}) {
  return { id: uid(), from, to, color: '#94a3b8', style: 'solid', cross: false, label: '', ...extra };
}

export function createMap(title = 'Untitled mind map') {
  const root = createNode('topic', 80, 200, title, { fontSize: 18, color: '#dbeafe' });
  return { id: uid(), title, createdAt: now(), updatedAt: now(), nodes: [root], edges: [], cloudBackup: null };
}

// Fill missing fields so older (v1) maps and foreign files always work.
export function normalizeMap(m, { fresh = false } = {}) {
  if (!m || typeof m !== 'object' || !Array.isArray(m.nodes)) return null;
  const idMap = new Map();
  const nodes = m.nodes.filter((n) => n && typeof n === 'object').map((n) => {
    const id = fresh || !n.id ? uid() : String(n.id);
    idMap.set(String(n.id ?? id), id);
    const type = ['topic', 'text', 'box', 'sticker', 'image'].includes(n.type) ? n.type : 'topic';
    const d = createNode(type, 0, 0, '');
    return { ...d, ...n, id, type, x: Number(n.x) || 0, y: Number(n.y) || 0, text: String(n.text ?? ''), width: Math.max(60, Number(n.width) || d.width), height: Number(n.height) || d.height, collapsed: !!n.collapsed };
  });
  const edges = (Array.isArray(m.edges) ? m.edges : []).filter(Boolean).map((e) => ({
    id: fresh || !e.id ? uid() : String(e.id), color: e.color || '#94a3b8', style: e.style === 'dashed' ? 'dashed' : 'solid',
    cross: !!e.cross, label: e.label || '', from: idMap.get(String(e.from)), to: idMap.get(String(e.to)),
  })).filter((e) => e.from && e.to && e.from !== e.to);
  return {
    id: fresh || !m.id ? uid() : String(m.id), title: String(m.title || 'Untitled mind map').slice(0, 200),
    createdAt: m.createdAt || now(), updatedAt: m.updatedAt || now(), nodes, edges, cloudBackup: m.cloudBackup || null,
  };
}

// Extract maps from any supported JSON shape.
export function mapsFromJson(data) {
  const raw = Array.isArray(data) ? data : data?.maps ? data.maps : data?.map ? [data.map] : data?.nodes ? [data] : [];
  return raw.map((m) => normalizeMap(m)).filter(Boolean);
}

// ---- hierarchy (tree edges only; "cross" edges are free links) ----
export function treeIndex(map) {
  const children = new Map(); const parent = new Map();
  for (const n of map.nodes) children.set(n.id, []);
  for (const e of map.edges) {
    if (e.cross || !children.has(e.from) || !children.has(e.to) || parent.has(e.to)) continue;
    parent.set(e.to, e.from); children.get(e.from).push(e.to);
  }
  return { children, parent };
}
export function descendants(map, id, idx = treeIndex(map)) {
  const out = []; const seen = new Set([id]); const stack = [...(idx.children.get(id) || [])];
  while (stack.length) { const c = stack.pop(); if (seen.has(c)) continue; seen.add(c); out.push(c); stack.push(...(idx.children.get(c) || [])); }
  return out;
}
export function depthOf(idx, id) { let d = 0; let cur = id; const seen = new Set(); while (idx.parent.has(cur) && !seen.has(cur)) { seen.add(cur); cur = idx.parent.get(cur); d++; } return d; }
export function hiddenSet(map, idx = treeIndex(map)) {
  const hidden = new Set();
  for (const n of map.nodes) if (n.collapsed) descendants(map, n.id, idx).forEach((d) => hidden.add(d));
  return hidden;
}

// ---- auto layout: left-to-right tidy tree ----
export function autoLayout(map, sizes = {}) {
  const idx = treeIndex(map); const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const size = (n) => ({ w: sizes[n.id]?.w || n.width, h: sizes[n.id]?.h || n.height });
  const GAP_X = 70; const GAP_Y = 18;
  const roots = map.nodes.filter((n) => !idx.parent.has(n.id) && (idx.children.get(n.id) || []).length);
  if (!roots.length) return map;
  const pos = new Map(); const heights = new Map();
  const measure = (id, seen = new Set()) => {
    if (seen.has(id)) return 0; seen.add(id); const n = byId.get(id); const kids = n.collapsed ? [] : idx.children.get(id) || [];
    const own = size(n).h; const sum = kids.reduce((a, k, i) => a + measure(k, seen) + (i ? GAP_Y : 0), 0);
    const h = Math.max(own, sum); heights.set(id, h); return h;
  };
  const place = (id, x, top, seen = new Set()) => {
    if (seen.has(id)) return; seen.add(id); const n = byId.get(id); const { w, h } = size(n); const total = heights.get(id);
    pos.set(id, { x, y: top + (total - h) / 2 });
    const kids = n.collapsed ? [] : idx.children.get(id) || []; let cy = top + (total - kids.reduce((a, k, i) => a + heights.get(k) + (i ? GAP_Y : 0), 0)) / 2;
    for (const k of kids) { place(k, x + w + GAP_X, cy, seen); cy += heights.get(k) + GAP_Y; }
  };
  // Lay out from top = 0, then shift everything so the first root keeps its on-screen centre (prevents drift).
  let top = 0; const startX = roots[0].x;
  roots.forEach((r) => { const h = measure(r.id); place(r.id, startX, top); top += h + 50; });
  const r0 = roots[0]; const oldCy = r0.y + size(r0).h / 2; const newCy = pos.get(r0.id).y + size(r0).h / 2; const dy = oldCy - newCy;
  return { ...map, nodes: map.nodes.map((n) => (pos.has(n.id) ? { ...n, x: Math.round(pos.get(n.id).x), y: Math.round(pos.get(n.id).y + dy) } : n)) };
}

// ---- build a map from an outline tree [{text, children}] ----
export function mapFromTree(title, tree) {
  const map = createMap(title); const root = map.nodes[0]; root.text = title; root.fontSize = 18;
  const walk = (items, parent, depth, branchColor) => {
    items.forEach((it, i) => {
      const color = depth === 1 ? BRANCH_COLORS[i % BRANCH_COLORS.length] : branchColor;
      const n = createNode(depth <= 2 ? 'topic' : 'box', 0, 0, it.text, { color, bold: depth <= 1, fontSize: depth <= 1 ? 16 : 14 });
      map.nodes.push(n); map.edges.push(createEdge(parent.id, n.id)); walk(it.children || [], n, depth + 1, color);
    });
  };
  walk(tree, root, 1, '#ffffff');
  return autoLayout(map);
}

// ---- template library ----
export const TEMPLATES = [
  { id: 'blank', name: 'Blank map', desc: 'Just a central topic', icon: '◻', tree: [] },
  { id: 'subject', name: 'GATE subject', desc: 'Syllabus, formulas, PYQs, revision', icon: '🎓', tree: [
    { text: 'Syllabus topics', children: [{ text: 'Topic 1' }, { text: 'Topic 2' }, { text: 'Topic 3' }] },
    { text: 'Key formulas', children: [{ text: 'Formula 1' }, { text: 'Formula 2' }] },
    { text: 'Previous year questions', children: [{ text: 'Pattern / trend' }, { text: 'Hard questions' }] },
    { text: 'Common mistakes', children: [{ text: 'Mistake 1' }] },
    { text: 'Revision plan', children: [{ text: 'Week 1' }, { text: 'Week 2' }] },
  ] },
  { id: 'chapter', name: 'Chapter notes', desc: 'Definition, key points, examples', icon: '📘', tree: [
    { text: 'Definition' }, { text: 'Key points', children: [{ text: 'Point 1' }, { text: 'Point 2' }] },
    { text: 'Examples' }, { text: 'Traps & exceptions' }, { text: 'Practice questions' },
  ] },
  { id: 'brainstorm', name: 'Brainstorm', desc: 'Ideas, pros, cons, next steps', icon: '💡', tree: [
    { text: 'Ideas', children: [{ text: 'Idea A' }, { text: 'Idea B' }] }, { text: 'Pros' }, { text: 'Cons' }, { text: 'Next steps' },
  ] },
];
