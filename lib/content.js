import fs from 'node:fs';
import path from 'node:path';

/**
 * Everything is read from /content at BUILD time (static export).
 * - content/syllabus.json        -> subject order, titles and the topic checklist
 * - content/<subject>/...        -> notes and practice questions for each subject
 */
const CONTENT_DIR = path.join(process.cwd(), 'content');


export const CATEGORIES = [
  {
    slug: 'concepts',
    label: 'Concepts',
    description: 'Chapter-wise concepts and explanations.',
    files: ['concepts.json'],
  },
  {
    slug: 'dpp',
    label: 'DPP',
    description: 'Daily practice problems.',
    files: ['dpp-questions.json'],
  },
  {
    slug: 'practice',
    label: 'Practice Questions',
    description: 'Chapter-wise practice questions.',
    files: ['practice-questions.json'],
  },
  {
    slug: 'pyq',
    label: 'Previous Year Questions',
    description: 'GATE previous year questions.',
    files: ['pyq-questions.json'],
  },
];

function titleCase(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'topic'
  );
}

function readSyllabusFile() {
  const file = path.join(CONTENT_DIR, 'syllabus.json');
  if (!fs.existsSync(file)) return [];
  try {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(json.subjects) ? json.subjects : [];
  } catch (e) {
    throw new Error(`Invalid JSON in content/syllabus.json: ${e.message}`);
  }
}

function folderNames() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !/^[._]/.test(d.name))
    .map((d) => d.name);
}

/** Subjects in syllabus order first, then any extra folders (alphabetical). */
export function getSubjects() {
  const ordered = [...new Set(readSyllabusFile().map((s) => s.slug))];
  const extra = folderNames()
    .filter((f) => !ordered.includes(f))
    .sort();
  return [...ordered, ...extra];
}

function readMeta(subject) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, subject, 'meta.json'), 'utf8'));
  } catch {
    return {};
  }
}

export function getSubject(subject) {
  if (!getSubjects().includes(subject)) return null;
  const fromSyllabus = readSyllabusFile().find((s) => s.slug === subject) || {};
  const meta = readMeta(subject);
  return {
    slug: subject,
    title: fromSyllabus.title || meta.title || titleCase(subject),
    description: fromSyllabus.description || meta.description || '',
  };
}

/** Syllabus checklist with a stable id for every topic (used for saved progress). */
export function getSyllabus() {
  return readSyllabusFile().map((s) => {
    const used = new Set();
    const topics = (s.topics || []).map((t) => {
      const title = typeof t === 'string' ? t : t.title;
      const detail = typeof t === 'string' ? '' : t.detail || '';
      let id = `${s.slug}:${slugify(title)}`;
      let n = 2;
      while (used.has(id)) id = `${s.slug}:${slugify(title)}-${n++}`;
      used.add(id);
      return { id, title, detail };
    });
    return {
      slug: s.slug,
      title: s.title || titleCase(s.slug),
      note: s.note || '',
      topics,
    };
  });
}

function findFile(subject, category) {
  for (const file of category.files) {
    const fullPath = path.join(CONTENT_DIR, subject, file);
    if (fs.existsSync(fullPath)) return { file, fullPath };
  }
  return null;
}

export function getDoc(subject, categorySlug) {
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category || !getSubjects().includes(subject)) return null;

  const found = findFile(subject, category);
  if (!found) return null;

  const raw = fs.readFileSync(found.fullPath, 'utf8').replace(/^\uFEFF/, '');
  const base = {
    subject,
    categorySlug: category.slug,
    categoryLabel: category.label,
    filename: `${subject}-${found.file}`,
    raw,
  };

  if (path.extname(found.file) === '.json') {
    try {
      return { 
        ...base,
        // type: category.slug === 'practice' ? 'quiz' : 'concepts',
        type: ['practice', 'dpp', 'pyq'].includes(category.slug) ? 'quiz' : 'concepts',
        mime: 'application/json', 
          data: JSON.parse(raw) };
    } catch (e) {
      throw new Error(`Invalid JSON in content/${subject}/${found.file}: ${e.message}`);
    }
  }
  return { ...base, type: 'markdown', mime: 'text/markdown' };
}

export function getNavigation() {
  return getSubjects().map((slug) => ({
    ...getSubject(slug),
    categories: CATEGORIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      description: c.description,
      available: Boolean(findFile(slug, c)),
    })).filter((c) => c.available),
  }));
}

export function getAllParams() {
  return getNavigation().flatMap((s) =>
    s.categories.map((c) => ({ subject: s.slug, category: c.slug }))
  );
}

function kindOf(q) {
  const hasOptions = Array.isArray(q.options) && q.options.length > 1;
  const t = String(q.type || '').toLowerCase();
  if (t === 'nat') return 'NAT';
  if (hasOptions && (t === 'msq' || (!t && Array.isArray(q.answer)))) return 'MSQ';
  if (hasOptions && (t === 'mcq' || !t)) return 'MCQ';
  return 'Self-check';
}

/**
 * Light-weight list of every practice question (ids only) so the dashboard can
 * show progress without loading the full question text.
 */

export function getQuestionIndex() {
  const out = {};

  const questionFiles = [
    ['practice', 'practice-questions.json'],
    ['dpp', 'dpp-questions.json'],
    ['pyq', 'pyq-questions.json'],
  ];

  for (const subject of getSubjects()) {
    for (const [category, filename] of questionFiles) {
      const file = path.join(CONTENT_DIR, subject, filename);

      if (!fs.existsSync(file)) continue;

      let data;
      try {
        data = JSON.parse(
          fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')
        );
      } catch (e) {
        throw new Error(
          `Invalid JSON in content/${subject}/${filename}: ${e.message}`
        );
      }

      const chapters = Array.isArray(data.chapters)
        ? data.chapters
        : Array.isArray(data.questions)
          ? [{ title: 'All questions', questions: data.questions }]
          : [];

      out[`${subject}:${category}`] = chapters.map((chapter, ci) => ({
        title: chapter.title || `Chapter ${ci + 1}`,
        questions: (chapter.questions || []).map((q, qi) => ({
          id: String(q.id ?? `${ci + 1}-${qi + 1}`),
          title: q.title || '',
          kind: kindOf(q),
        })),
      }));
    }
  }

  return out;
}
