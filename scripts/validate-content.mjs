
/**
 * Validates GATE CSE study content before the build.
 *
 * Run:
 *   npm run validate
 *
 * Required structure:
 *   content/
 *     syllabus.json
 *     c-programming/
 *       concepts.json
 *       dpp-questions.json
 *       practice-questions.json
 *       pyq-questions.json
 *
 * Subject folders must contain exactly these four files.
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

const REQUIRED_SUBJECT_FILES = [
  'concepts.json',
  'dpp-questions.json',
  'practice-questions.json',
  'pyq-questions.json',
];

const QUESTION_FILES = new Set([
  'practice-questions.json',
  'dpp-questions.json',
  'pyq-questions.json',
]);

let errors = 0;
let filesChecked = 0;
let questionsChecked = 0;
let conceptsChecked = 0;

function fail(message) {
  console.error(`✗ ${message}`);
  errors++;
}

let warnings = 0;
function warn(message) {
  console.warn(`! ${message}`);
  warnings++;
}

function pass(message) {
  console.log(`✓ ${message}`);
}

function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function readJson(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    filesChecked++;

    return { data, relativePath };
  } catch (error) {
    fail(`${relativePath}: invalid JSON (${error.message})`);
    return null;
  }
}

/* -------------------------------------------------------
   Question validation
------------------------------------------------------- */

function checkQuestion(where, question) {
  questionsChecked++;

  if (!isObject(question)) {
    fail(`${where}: question must be a JSON object`);
    return;
  }

  if (
    typeof question.question !== 'string' ||
    !question.question.trim()
  ) {
    fail(`${where}: missing or empty "question" text`);
  }

  if (
    question.id !== undefined &&
    !['string', 'number'].includes(typeof question.id)
  ) {
    fail(`${where}: "id" must be a string or number`);
  }

  if (
    question.title !== undefined &&
    typeof question.title !== 'string'
  ) {
    fail(`${where}: "title" must be a string`);
  }

  const type = String(question.type || '').toLowerCase();
  const options = question.options;

  if (question.kind !== undefined) {
    warn(`${where}: "kind" is ignored by the app; use "type" ("mcq" | "msq" | "nat") instead`);
  }
  if (type && !['mcq', 'msq', 'nat', 'text'].includes(type)) {
    warn(`${where}: unknown type "${question.type}" (it will be shown as a self-check question)`);
  }
  if (type === 'mcq' && Array.isArray(question.answer)) {
    fail(`${where}: type "mcq" needs a single index; use type "msq" for an array answer`);
  }
  if (type === 'msq' && !Array.isArray(question.answer)) {
    fail(`${where}: type "msq" needs "answer" as an array of indexes`);
  }
  if (Array.isArray(options) && new Set(options.map((o) => String(o).trim())).size !== options.length) {
    warn(`${where}: two options have identical text`);
  }
  if (typeof question.solution !== 'string' || !question.solution.trim()) {
    warn(`${where}: no "solution"`);
  }
  if (question.id === undefined) {
    warn(`${where}: no "id" (saved results will break if questions are reordered)`);
  }

  // Numerical Answer Type (NAT)
  if (type === 'nat') {
    const validRange =
      Array.isArray(question.range) &&
      question.range.length === 2 &&
      question.range.every(
        (value) =>
          typeof value === 'number' &&
          Number.isFinite(value)
      ) &&
      question.range[0] <= question.range[1];

    const answerIsNumeric =
      question.answer !== undefined &&
      question.answer !== null &&
      question.answer !== '' &&
      Number.isFinite(Number(question.answer));

    if (!validRange && !answerIsNumeric) {
      fail(
        `${where}: NAT needs a numeric "answer" or a valid numeric "range": [min, max]`
      );
    }

    return;
  }

  // MCQ/MSQ questions should provide options.
  if (options !== undefined && !Array.isArray(options)) {
    fail(`${where}: "options" must be an array`);
    return;
  }

  if (Array.isArray(options)) {
    if (options.length < 2) {
      fail(`${where}: "options" must contain at least 2 items`);
    }

    options.forEach((option, index) => {
      if (
        typeof option !== 'string' &&
        !isObject(option)
      ) {
        fail(
          `${where}: option ${index + 1} must be a string or object`
        );
      }
    });

    const validIndex = (index) =>
      Number.isInteger(index) &&
      index >= 0 &&
      index < options.length;

    if (Array.isArray(question.answer)) {
      if (
        question.answer.length === 0 ||
        !question.answer.every(validIndex)
      ) {
        fail(
          `${where}: MSQ "answer" must be a non-empty array of 0-based option indexes`
        );
      }

      if (new Set(question.answer).size !== question.answer.length) {
        fail(`${where}: MSQ answer contains duplicate option indexes`);
      }
    } else if (!validIndex(question.answer)) {
      fail(
        `${where}: MCQ "answer" must be a 0-based option index from 0 to ${options.length - 1}`
      );
    }
  } else if (type === 'mcq' || type === 'msq') {
    fail(`${where}: question type "${type}" requires an "options" array`);
  }
}

/* -------------------------------------------------------
   Practice / DPP / PYQ validation
------------------------------------------------------- */

function checkQuiz(relativePath, data) {
  if (!isObject(data)) {
    fail(`${relativePath}: root must be a JSON object`);
    return;
  }

  let chapters;

  if (Array.isArray(data.chapters)) {
    chapters = data.chapters;
  } else if (Array.isArray(data.questions)) {
    // Also support a flat questions array.
    chapters = [
      {
        title: 'All Questions',
        questions: data.questions,
      },
    ];
  } else {
    fail(
      `${relativePath}: expected "chapters": [{ "title": "...", "questions": [...] }] or a "questions" array`
    );
    return;
  }

  const questionIds = new Set();

  chapters.forEach((chapter, chapterIndex) => {
    const chapterName =
      typeof chapter?.title === 'string' && chapter.title.trim()
        ? chapter.title
        : `Chapter ${chapterIndex + 1}`;

    const chapterPath = `${relativePath} › ${chapterName}`;

    if (!isObject(chapter)) {
      fail(`${chapterPath}: chapter must be an object`);
      return;
    }

    if (!Array.isArray(chapter.questions)) {
      fail(`${chapterPath}: missing "questions" array`);
      return;
    }

    chapter.questions.forEach((question, questionIndex) => {
      const questionPath =
        `${chapterPath} › Q${questionIndex + 1}`;

      checkQuestion(questionPath, question);

      if (!isObject(question)) return;

      const id =
        question.id !== undefined &&
        question.id !== null &&
        String(question.id).trim() !== ''
          ? String(question.id)
          : `${chapterIndex + 1}-${questionIndex + 1}`;

      if (questionIds.has(id)) {
        fail(`${relativePath}: duplicate question id "${id}"`);
      }

      questionIds.add(id);
    });
  });
}

/* -------------------------------------------------------
   Concepts validation
------------------------------------------------------- */

function checkConcepts(relativePath, data) {
  if (!isObject(data)) {
    fail(`${relativePath}: root must be a JSON object`);
    return;
  }

  if (Array.isArray(data.chapters) && !Array.isArray(data.sections)) {
    fail(
      `${relativePath}: concepts.json must use a top-level "sections" array, not "chapters" (see content/_templates/concepts.json)`
    );
    return;
  }

  if (
    !Array.isArray(data.sections) ||
    data.sections.length === 0
  ) {
    fail(
      `${relativePath}: requires a non-empty "sections" array`
    );
    return;
  }

  const sectionIds = new Set();

  data.sections.forEach((section, index) => {
    const sectionName =
      typeof section?.title === 'string' && section.title.trim()
        ? section.title
        : `Section ${index + 1}`;

    const sectionPath = `${relativePath} › ${sectionName}`;

    if (!isObject(section)) {
      fail(`${sectionPath}: section must be an object`);
      return;
    }

    if (
      typeof section.title !== 'string' ||
      !section.title.trim()
    ) {
      fail(`${sectionPath}: missing "title"`);
    }

    const id =
      section.id !== undefined &&
      section.id !== null &&
      String(section.id).trim() !== ''
        ? String(section.id)
        : `section-${index + 1}`;

    if (id === 'intro') {
      fail(
        `${sectionPath}: section id "intro" is reserved`
      );
    }

    if (sectionIds.has(id)) {
      fail(`${relativePath}: duplicate section id "${id}"`);
    }

    sectionIds.add(id);

    if (
      section.content !== undefined &&
      section.content !== null &&
      typeof section.content !== 'string'
    ) {
      fail(`${sectionPath}: "content" must be a string`);
    }

    if (section.questions === undefined || section.questions === null) {
      return;
    }

    if (!Array.isArray(section.questions)) {
      fail(`${sectionPath}: "questions" must be an array`);
      return;
    }

    const questionIds = new Set();

    section.questions.forEach((question, questionIndex) => {
      checkQuestion(
        `${sectionPath} › Q${questionIndex + 1}`,
        question
      );

      if (!isObject(question)) return;

      const questionId =
        question.id !== undefined &&
        question.id !== null &&
        String(question.id).trim() !== ''
          ? String(question.id)
          : String(questionIndex + 1);

      if (questionIds.has(questionId)) {
        fail(
          `${sectionPath}: duplicate question id "${questionId}"`
        );
      }

      questionIds.add(questionId);
    });
  });

  conceptsChecked++;
}

/* -------------------------------------------------------
   Syllabus validation
------------------------------------------------------- */

function checkSyllabus(relativePath, data) {
  if (!isObject(data)) {
    fail(`${relativePath}: root must be a JSON object`);
    return [];
  }

  if (!Array.isArray(data.subjects)) {
    fail(`${relativePath}: requires a "subjects" array`);
    return [];
  }

  const seenSlugs = new Set();

  data.subjects.forEach((subject, index) => {
    const location = `${relativePath} › Subject ${index + 1}`;

    if (!isObject(subject)) {
      fail(`${location}: subject must be an object`);
      return;
    }

    if (
      typeof subject.slug !== 'string' ||
      !subject.slug.trim()
    ) {
      fail(`${location}: missing "slug"`);
    } else {
      if (seenSlugs.has(subject.slug)) {
        fail(
          `${relativePath}: duplicate subject slug "${subject.slug}"`
        );
      }

      seenSlugs.add(subject.slug);
    }

    if (
      typeof subject.title !== 'string' ||
      !subject.title.trim()
    ) {
      fail(`${location}: missing "title"`);
    }

    if (!Array.isArray(subject.topics)) {
      fail(
        `${location}: subject "${subject.slug || index + 1}" requires a "topics" array`
      );
      return;
    }

    const topicIds = new Set();

    subject.topics.forEach((topic, topicIndex) => {
      if (!isObject(topic)) {
        fail(`${location} › Topic ${topicIndex + 1}: must be an object`);
        return;
      }

      if (
        typeof topic.id !== 'string' ||
        !topic.id.trim()
      ) {
        fail(
          `${location} › Topic ${topicIndex + 1}: missing "id"`
        );
      } else {
        if (topicIds.has(topic.id)) {
          fail(
            `${location}: duplicate topic id "${topic.id}"`
          );
        }

        topicIds.add(topic.id);
      }

      if (
        typeof topic.title !== 'string' ||
        !topic.title.trim()
      ) {
        fail(
          `${location} › Topic ${topicIndex + 1}: missing "title"`
        );
      }
    });
  });

  return data.subjects;
}

/* -------------------------------------------------------
   Subject folder and file validation
------------------------------------------------------- */

function validateSubjectFolder(subject) {
  const slug = subject.slug;
  const subjectDir = path.join(CONTENT_ROOT, slug);
  const relativeDir = path.relative(process.cwd(), subjectDir);

  if (!fs.existsSync(subjectDir)) {
    fail(`${relativeDir}: subject folder does not exist`);
    return;
  }

  if (!fs.statSync(subjectDir).isDirectory()) {
    fail(`${relativeDir}: subject path is not a directory`);
    return;
  }

  const entries = fs.readdirSync(subjectDir, {
    withFileTypes: true,
  });

  const expectedFiles = new Set(REQUIRED_SUBJECT_FILES);

  // Require exactly four files and no nested directories.
  for (const entry of entries) {
    const entryPath = path.join(subjectDir, entry.name);

    if (entry.isDirectory()) {
      fail(
        `${path.relative(process.cwd(), entryPath)}: unexpected nested directory in subject folder`
      );
      continue;
    }

    if (!expectedFiles.has(entry.name)) {
      fail(
        `${path.relative(process.cwd(), entryPath)}: unexpected file; only ${REQUIRED_SUBJECT_FILES.join(', ')} are allowed`
      );
    }
  }

  // Check all four required JSON files.
  for (const fileName of REQUIRED_SUBJECT_FILES) {
    const filePath = path.join(subjectDir, fileName);

    if (!fs.existsSync(filePath)) {
      fail(
        `${path.relative(process.cwd(), filePath)}: required file is missing`
      );
      continue;
    }

    if (!fs.statSync(filePath).isFile()) {
      fail(
        `${path.relative(process.cwd(), filePath)}: expected a file`
      );
      continue;
    }

    const parsed = readJson(filePath);

    if (!parsed) continue;

    const { data, relativePath } = parsed;

    if (fileName === 'concepts.json') {
      checkConcepts(relativePath, data);
    } else if (QUESTION_FILES.has(fileName)) {
      checkQuiz(relativePath, data);
    }
  }
}

/* -------------------------------------------------------
   Main
------------------------------------------------------- */

function main() {
  console.log('\nGATE CSE content validation\n');

  if (!fs.existsSync(CONTENT_ROOT)) {
    fail('content/ folder not found');
    process.exit(1);
  }

  if (!fs.statSync(CONTENT_ROOT).isDirectory()) {
    fail('content/ must be a directory');
    process.exit(1);
  }

  const syllabusPath = path.join(CONTENT_ROOT, 'syllabus.json');

  if (!fs.existsSync(syllabusPath)) {
    fail('content/syllabus.json is missing');
    process.exit(1);
  }

  const parsedSyllabus = readJson(syllabusPath);

  if (!parsedSyllabus) {
    process.exit(1);
  }

  const subjects = checkSyllabus(
    parsedSyllabus.relativePath,
    parsedSyllabus.data
  );

  // Ensure every syllabus subject has its required folder/files.
  const expectedSlugs = new Set();

  for (const subject of subjects) {
    if (
      typeof subject?.slug !== 'string' ||
      !subject.slug.trim()
    ) {
      continue;
    }

    expectedSlugs.add(subject.slug);
    validateSubjectFolder(subject);
  }

  // Flag extra top-level directories that are not syllabus subjects.
  const rootEntries = fs.readdirSync(CONTENT_ROOT, {
    withFileTypes: true,
  });

  for (const entry of rootEntries) {
    if (!entry.isDirectory()) continue;

    // Underscore-prefixed folders are reserved for non-subject data.
    if (entry.name.startsWith('_')) continue;

    if (!expectedSlugs.has(entry.name)) {
      fail(
        `content/${entry.name}: folder is not listed in syllabus.json`
      );
    }
  }

  // Templates must stay valid, otherwise copying them breaks the build.
  const templateDir = path.join(CONTENT_ROOT, '_templates');
  if (fs.existsSync(templateDir)) {
    for (const fileName of REQUIRED_SUBJECT_FILES) {
      const filePath = path.join(templateDir, fileName);
      if (!fs.existsSync(filePath)) {
        fail(`content/_templates/${fileName}: template file is missing`);
        continue;
      }
      const parsed = readJson(filePath);
      if (!parsed) continue;
      if (fileName === 'concepts.json') checkConcepts(parsed.relativePath, parsed.data);
      else checkQuiz(parsed.relativePath, parsed.data);
    }
  }

  console.log('');

  if (errors > 0) {
    console.error(
      `Validation failed: ${errors} problem(s) found.`
    );
    console.error('Fix the errors above and run npm run validate again.\n');
    process.exit(1);
  }

  pass(`Syllabus subjects checked: ${subjects.length}`);
  pass(`JSON files checked: ${filesChecked}`);
  pass(`Concept files checked: ${conceptsChecked}`);
  pass(`Questions checked: ${questionsChecked}`);
  if (warnings > 0) console.log(`! Warnings: ${warnings} (build still allowed)`);

  console.log('\nAll content validation checks passed.\n');
}

main();
