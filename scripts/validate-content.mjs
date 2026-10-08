// Checks every .json file in /content before the build. Run: npm run validate
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'content');
let errors = 0;
let files = 0;
let questions = 0;

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  errors++;
};

function checkQuestion(where, q) {
  questions++;
  if (typeof q.question !== 'string' || !q.question.trim()) return fail(`${where}: missing "question" text`);
  const t = String(q.type || '').toLowerCase();
  const opts = q.options;

  if (t === 'nat') {
    const okRange = Array.isArray(q.range) && q.range.length === 2 && q.range.every((n) => typeof n === 'number');
    if (!okRange && Number.isNaN(Number(q.answer))) fail(`${where}: NAT needs a numeric "answer" (or "range": [min, max])`);
    return;
  }
  if (Array.isArray(opts)) {
    if (opts.length < 2) return fail(`${where}: "options" needs at least 2 items`);
    const inRange = (n) => Number.isInteger(n) && n >= 0 && n < opts.length;
    if (Array.isArray(q.answer)) {
      if (!q.answer.length || !q.answer.every(inRange)) fail(`${where}: MSQ "answer" must be 0-based option indexes, e.g. [0, 2]`);
    } else if (!inRange(q.answer)) {
      fail(`${where}: MCQ "answer" must be a 0-based option index (0 to ${opts.length - 1})`);
    }
  }
}

function checkQuiz(rel, data) {
  const chapters = Array.isArray(data.chapters) ? data.chapters : [{ title: 'All', questions: data.questions }];
  if (!chapters.every((c) => Array.isArray(c.questions))) return fail(`${rel}: needs "chapters": [{ "title", "questions": [...] }]`);
  const ids = new Set();
  chapters.forEach((c, ci) =>
    c.questions.forEach((q, qi) => {
      checkQuestion(`${rel} › ${c.title || `chapter ${ci + 1}`} › Q${qi + 1}`, q);
      const id = String(q.id ?? `${ci + 1}-${qi + 1}`);
      if (ids.has(id)) fail(`${rel}: duplicate question id "${id}"`);
      ids.add(id);
    })
  );
}

function checkConcepts(rel, data) {
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    return fail(`${rel}: needs a "sections" array, e.g. "sections": [{ "id", "title", "content", "questions": [...] }]`);
  }
  const ids = new Set();
  data.sections.forEach((s, i) => {
    const where = `${rel} › ${s.title || `section ${i + 1}`}`;
    if (!s.title) fail(`${rel}: section ${i + 1} needs a "title"`);
    const id = String(s.id || `section-${i + 1}`);
    if (id === 'intro') fail(`${rel}: section id "intro" is reserved, use another id`);
    if (ids.has(id)) fail(`${rel}: duplicate section id "${id}"`);
    ids.add(id);
    if (s.content != null && typeof s.content !== 'string') fail(`${where}: "content" must be a string (Markdown)`);
    if (s.questions == null) return;
    if (!Array.isArray(s.questions)) return fail(`${where}: "questions" must be an array`);
    const qids = new Set();
    s.questions.forEach((q, qi) => {
      checkQuestion(`${where} › Q${qi + 1}`, q);
      const qid = String(q.id ?? qi + 1);
      if (qids.has(qid)) fail(`${where}: duplicate question id "${qid}"`);
      qids.add(qid);
    });
  });
}

function checkSyllabus(rel, data) {
  if (!Array.isArray(data.subjects)) return fail(`${rel}: needs a "subjects" array`);
  const seen = new Set();
  for (const s of data.subjects) {
    if (!s.slug || !s.title) fail(`${rel}: every subject needs "slug" and "title"`);
    if (seen.has(s.slug)) fail(`${rel}: duplicate subject slug "${s.slug}"`);
    seen.add(s.slug);
    if (!Array.isArray(s.topics)) fail(`${rel}: subject "${s.slug}" needs a "topics" array`);
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.json')) checkJson(p);
  }
}

function checkJson(p) {
  files++;
  const rel = path.relative(process.cwd(), p);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return fail(`${rel}: invalid JSON (${e.message})`);
  }
  const name = path.basename(p);
  if (name === 'practice-questions.json') checkQuiz(rel, data);
  if (name === 'concepts.json') checkConcepts(rel, data);
  if (name === 'syllabus.json') checkSyllabus(rel, data);
}

if (!fs.existsSync(ROOT)) {
  console.error('✗ content/ folder not found');
  process.exit(1);
}
walk(ROOT);

if (errors) {
  console.error(`\n${errors} problem(s) found. Fix them and run again.`);
  process.exit(1);
}
console.log(`✓ content OK (${files} JSON files, ${questions} questions)`);