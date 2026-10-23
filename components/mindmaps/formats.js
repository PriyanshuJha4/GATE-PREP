// Import / export formats: JSON, Markdown outline, OPML, FreeMind (.mm), SVG, PNG.
import { mapFromTree, mapsFromJson, treeIndex, createMap, createNode, createEdge, autoLayout } from './model';

export const slug = (v) => String(v || 'mind-map').normalize('NFKD').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'mind-map';
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = (s) => String(s ?? '').replace(/\s*\n\s*/g, ' ').trim();

// Convert map to nested outline (tree edges only; collapsed state ignored).
export function mapToTree(map) {
  const idx = treeIndex(map); const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const walk = (id, seen) => { if (seen.has(id)) return null; seen.add(id); const n = byId.get(id); const kids = (idx.children.get(id) || []).map((k) => walk(k, seen)).filter(Boolean); return { text: clean(n.type === 'image' ? n.text || 'Image' : n.text), children: kids }; };
  const seen = new Set(); const roots = map.nodes.filter((n) => !idx.parent.has(n.id)).sort((a, b) => a.y - b.y || a.x - b.x);
  return roots.map((r) => walk(r.id, seen)).filter(Boolean);
}

export function exportMarkdown(map) {
  const lines = [`# ${clean(map.title)}`, ''];
  const roots = mapToTree(map);
  const walk = (items, d) => items.forEach((it) => { lines.push(`${'  '.repeat(d)}- ${it.text}`); walk(it.children, d + 1); });
  // Skip the first root's own line when it duplicates the title; keep others.
  roots.forEach((r, i) => { if (i === 0 && clean(r.text) === clean(map.title)) walk(r.children, 0); else walk([r], 0); });
  return lines.join('\n') + '\n';
}
export function exportOpml(map) {
  const walk = (items, d) => items.map((it) => `${'  '.repeat(d)}<outline text="${esc(it.text)}"${it.children.length ? `>\n${walk(it.children, d + 1)}\n${'  '.repeat(d)}</outline>` : '/>'}`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head><title>${esc(map.title)}</title></head>\n  <body>\n${walk(mapToTree(map), 2)}\n  </body>\n</opml>\n`;
}
export function exportFreemind(map) {
  const roots = mapToTree(map); const rootTree = roots[0] || { text: map.title, children: [] };
  const extra = roots.slice(1); const kids = [...rootTree.children, ...extra];
  const walk = (it, d) => `${'  '.repeat(d)}<node TEXT="${esc(it.text)}"${it.children.length ? `>\n${it.children.map((c) => walk(c, d + 1)).join('\n')}\n${'  '.repeat(d)}</node>` : '/>'}`;
  return `<map version="1.0.1">\n${walk({ text: rootTree.text || map.title, children: kids }, 1)}\n</map>\n`;
}

// ---- parsers ----
export function parseOutline(text) {
  const rows = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim());
  const items = []; const stack = [{ indent: -1, children: items }];
  let base = 0; // list items under a Markdown heading nest beneath that heading
  rows.forEach((raw) => {
    const heading = raw.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    let indent; let content;
    if (heading) { indent = (heading[1].length - 1) * 2; content = heading[2].replace(/\s+#+\s*$/, ''); base = indent + 2; }
    else {
      const m = raw.match(/^(\s*)(?:[-*+•]|\d+[.)])?\s*(.*)$/); const lead = m[1].replace(/\t/g, '    ').length; content = m[2];
      indent = base + lead;
    }
    content = content.trim(); if (!content) return;
    const item = { text: content, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    stack[stack.length - 1].children.push(item); stack.push({ indent, children: item.children });
  });
  // A single top-level item becomes the title/root.
  if (items.length === 1) return { title: items[0].text, tree: items[0].children };
  return { title: '', tree: items };
}
const xmlDoc = (text) => { const d = new DOMParser().parseFromString(text, 'application/xml'); if (d.querySelector('parsererror')) throw new Error('This XML file could not be read.'); return d; };
export function parseOpml(text) {
  const doc = xmlDoc(text); const title = doc.querySelector('head > title')?.textContent || '';
  const walk = (el) => [...el.children].filter((c) => c.tagName === 'outline').map((c) => ({ text: c.getAttribute('text') || c.getAttribute('title') || '', children: walk(c) }));
  const tree = walk(doc.querySelector('body')); return tree.length === 1 ? { title: title || tree[0].text, tree: tree[0].children } : { title, tree };
}
export function parseFreemind(text) {
  const doc = xmlDoc(text); const root = doc.querySelector('map > node'); if (!root) throw new Error('No mind map found in this file.');
  const walk = (el) => [...el.children].filter((c) => c.tagName === 'node').map((c) => ({ text: c.getAttribute('TEXT') || '', children: walk(c) }));
  return { title: root.getAttribute('TEXT') || '', tree: walk(root) };
}

// Parse any supported file/text into an array of normalized maps.
export function parseAnyToMaps(text, filename = '') {
  const name = filename.toLowerCase(); const t = text.trim();
  if (t.startsWith('{') || t.startsWith('[')) { const maps = mapsFromJson(JSON.parse(t)); if (!maps.length) throw new Error('This JSON file does not contain a supported mind map.'); return maps; }
  const base = filename.replace(/\.[^.]+$/, '').replace(/\.mindmap$/i, '') || 'Imported outline';
  let parsed;
  if (name.endsWith('.opml') || /<opml[\s>]/i.test(t.slice(0, 500))) parsed = parseOpml(t);
  else if (name.endsWith('.mm') || /<map[\s>]/i.test(t.slice(0, 500))) parsed = parseFreemind(t);
  else parsed = parseOutline(t);
  if (!parsed.tree.length && !parsed.title) throw new Error('No outline lines were found in this file.');
  return [mapFromTree(parsed.title || base, parsed.tree)];
}

// ---- image export (SVG / PNG) ----
let _ctx; const measureCtx = () => (_ctx ||= document.createElement('canvas').getContext('2d'));
function wrap(text, maxW, font) {
  const ctx = measureCtx(); ctx.font = font; const out = [];
  String(text).split('\n').forEach((para) => {
    let line = ''; para.split(/(\s+)/).forEach((word) => {
      const test = line + word; if (ctx.measureText(test).width > maxW && line.trim()) { out.push(line.trimEnd()); line = word.trimStart(); } else line = test;
    }); out.push(line.trimEnd());
  });
  return out;
}
export function mapToSvg(map, sizes = {}, { dark = false, hidden = new Set(), background = true } = {}) {
  const nodes = map.nodes.filter((n) => !hidden.has(n.id)); const PAD = 40;
  const dims = (n) => ({ w: sizes[n.id]?.w || n.width, h: sizes[n.id]?.h || n.height });
  if (!nodes.length) return { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"/>', width: 200, height: 100 };
  const minX = Math.min(...nodes.map((n) => n.x)) - PAD; const minY = Math.min(...nodes.map((n) => n.y)) - PAD;
  const maxX = Math.max(...nodes.map((n) => n.x + dims(n).w)) + PAD; const maxY = Math.max(...nodes.map((n) => n.y + dims(n).h)) + PAD;
  const W = Math.ceil(maxX - minX); const H = Math.ceil(maxY - minY); const byId = new Map(nodes.map((n) => [n.id, n]));
  const text = dark ? '#ececec' : '#172033'; let body = '';
  map.edges.forEach((e) => {
    const a = byId.get(e.from); const b = byId.get(e.to); if (!a || !b) return; const da = dims(a); const db = dims(b);
    const ax = a.x + da.w / 2; const ay = a.y + da.h / 2; const bx = b.x + db.w / 2; const by = b.y + db.h / 2; const right = bx >= ax;
    const sx = right ? a.x + da.w : a.x; const ex = right ? b.x : b.x + db.w; const mid = (sx + ex) / 2;
    body += `<path d="M ${sx} ${ay} C ${mid} ${ay}, ${mid} ${by}, ${ex} ${by}" fill="none" stroke="${esc(e.color)}" stroke-width="2.5"${e.style === 'dashed' || e.cross ? ' stroke-dasharray="7 5"' : ''}/>`;
    if (e.label) body += `<text x="${mid}" y="${(ay + by) / 2 - 6}" font-size="12" text-anchor="middle" fill="${text}" font-family="sans-serif">${esc(e.label)}</text>`;
  });
  nodes.forEach((n) => {
    const { w, h } = dims(n); const fs = n.fontSize || 15; const weight = n.bold ? 700 : 400; const style = n.italic ? 'italic' : 'normal';
    if (n.type !== 'sticker') body += `<rect x="${n.x}" y="${n.y}" width="${w}" height="${h}" rx="12" fill="${n.color === 'transparent' ? 'none' : esc(n.color)}" stroke="${n.type === 'text' ? 'none' : '#94a3b8'}"/>`;
    if (n.type === 'image' && n.image) { body += `<image x="${n.x + 5}" y="${n.y + 5}" width="${w - 10}" height="${Math.max(10, h - 30)}" href="${esc(n.image)}" preserveAspectRatio="xMidYMid meet"/>`; if (n.text) body += `<text x="${n.x + w / 2}" y="${n.y + h - 10}" font-size="11" text-anchor="middle" fill="#334155" font-family="sans-serif">${esc(n.text)}</text>`; return; }
    const fill = n.type === 'text' || n.color === 'transparent' ? (dark ? '#ececec' : '#0d0d0d') : '#172033';
    const lines = wrap(n.text, w - 24, `${style} ${weight} ${fs}px sans-serif`); const lh = fs * 1.35; const startY = n.y + h / 2 - ((lines.length - 1) * lh) / 2;
    const anchor = n.align === 'left' ? 'start' : 'middle'; const tx = n.align === 'left' ? n.x + 12 : n.x + w / 2;
    lines.forEach((l, i) => { body += `<text x="${tx}" y="${startY + i * lh}" font-size="${fs}" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}" dominant-baseline="middle" fill="${fill}" font-family="sans-serif">${esc(l)}</text>`; });
  });
  const bg = background ? `<rect x="${minX}" y="${minY}" width="${W}" height="${H}" fill="${dark ? '#212121' : '#ffffff'}"/>` : '';
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="${minX} ${minY} ${W} ${H}">${bg}${body}</svg>`, width: W, height: H };
}
export function svgToPngBlob(svg, width, height, scale = 2) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })); const img = new Image();
    img.onload = () => { const max = 8000; const s = Math.min(scale, max / width, max / height); const c = document.createElement('canvas'); c.width = Math.round(width * s); c.height = Math.round(height * s); const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create PNG.'))), 'image/png'); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not render the image.')); }; img.src = url;
  });
}

// Compress a user image to keep maps small enough for browser storage.
export function compressImage(file, maxSide = 1400) {
  return new Promise((resolve, reject) => {
    if (/svg|gif/.test(file.type)) { if (file.size > 1.5 * 1024 * 1024) return reject(new Error('SVG/GIF images must be under 1.5 MB.')); const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => resolve({ data: r.result, w: i.width || 240, h: i.height || 170 }); i.onerror = () => resolve({ data: r.result, w: 240, h: 170 }); i.src = r.result; }; r.onerror = () => reject(new Error('Could not read the image.')); r.readAsDataURL(file); return; }
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height)); const w = Math.max(1, Math.round(img.width * s)); const h = Math.max(1, Math.round(img.height * s));
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      let data = c.toDataURL('image/webp', 0.85); if (!data.startsWith('data:image/webp')) data = c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
      resolve({ data, w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file is not a readable image.')); }; img.src = url;
  });
}
export { createMap, createNode, createEdge, autoLayout };
