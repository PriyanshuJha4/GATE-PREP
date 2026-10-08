// Runs automatically after `next build`. Fills the service worker in ./out with
// the list of every file to cache for offline use and a version hash.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const OUT = path.join(process.cwd(), 'out');
const swPath = path.join(OUT, 'sw.js');
if (!fs.existsSync(swPath)) {
  console.warn('postbuild: out/sw.js not found, skipping');
  process.exit(0);
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else files.push(full);
  }
})(OUT);

const urls = [];
const hash = crypto.createHash('sha1');
for (const full of files.sort()) {
  const rel = path.relative(OUT, full).split(path.sep).join('/');
  if (rel === 'sw.js' || rel === '404.html' || rel === '404/index.html') continue;
  let url = null;
  if (rel === 'index.html') url = '/';
  else if (rel.endsWith('/index.html')) url = '/' + rel.slice(0, -'index.html'.length);
  else if (rel.endsWith('/index.txt') || rel === 'index.txt') url = '/' + rel;
  else if (rel.startsWith('_next/static/') || rel.startsWith('icons/') || rel === 'manifest.webmanifest' || rel === 'favicon.ico') url = '/' + rel;
  if (!url) continue;
  urls.push(url);
  hash.update(url).update(fs.readFileSync(full));
}

const version = hash.digest('hex').slice(0, 12);
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace("'__VERSION__'", JSON.stringify(version)).replace('/*__PRECACHE__*/ []', JSON.stringify(urls));
fs.writeFileSync(swPath, sw);
console.log(`✓ Service worker ready: ${urls.length} files cached for offline use (version ${version})`);
