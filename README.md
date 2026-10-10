# GATE CSE Notebook

Static study app for GATE CSE (Next.js static export, no database). Everything lives in `content/`.

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # checks all JSON files (also runs automatically before every build)
npm run build      # static site in ./out
```

## What is where

```
content/
  syllabus.json              <- dashboard checklist (subjects, topics, order)
  _templates/                <- copy-paste templates (validated, not shown on the site)
  <subject>/                 <- one folder per subject, exactly these 4 files:
    concepts.json            <- Concepts notes (chapters as "sections", optional questions per chapter)
    practice-questions.json  <- Practice questions
    dpp-questions.json       <- DPP questions
    pyq-questions.json       <- Previous year questions
```

Every subject listed in `syllabus.json` must have its folder and all 4 files (`npm run validate` enforces this).
Copy the matching file from `content/_templates/` to start a new one.

## concepts.json format

```json
{
  "title": "Subject — Concepts",
  "intro": "optional markdown (shows an Intro tab)",
  "sections": [
    {
      "id": "unique-id", "title": "Chapter 1 — Title", "short": "Tab label",
      "summary": "optional", "content": "markdown ...", "keyPoints": ["optional"],
      "questions": [ /* same format as practice-questions.json, optional */ ]
    }
  ]
}
```

Use a top-level `"sections"` array (not `"chapters"`). Math: `$x^2$` / `$$...$$`; code blocks, tables and checklists work; raw HTML is not rendered.
Question progress for Practice, DPP and PYQ is tracked on the dashboard; questions inside concepts.json are for in-page revision only.

## Importing your content

1. Overwrite the JSON file in `content/<subject>/` (keep the exact file name), then run `npm run validate`.
2. **Syllabus / topics**: edit `content/syllabus.json`. Keep a topic title unchanged to keep its ticked state.
3. **New subject**: add it to `syllabus.json`, create `content/<slug>/` with the 4 files.
4. Commit and push to GitHub; Vercel redeploys automatically.
5. JSON: every LaTeX backslash must be doubled (`"\\frac{1}{2}"`), newline is `\n`. Images: put in `public/images/` and use `![](/images/pic.png)`.

## Practice question format

```json
{
  "title": "DBMS practice",
  "chapters": [
    {
      "title": "Normalization",
      "questions": [
        { "question": "MCQ text with $math$", "options": ["A", "B", "C", "D"], "answer": 1, "solution": "Explanation", "marks": 1, "source": "GATE 2022" },
        { "type": "msq", "question": "One or more correct", "options": ["A", "B", "C", "D"], "answer": [0, 2], "solution": "..." },
        { "type": "nat", "question": "Numerical answer", "answer": 42, "solution": "..." },
        { "type": "nat", "question": "Answer with accepted range", "answer": 4.5, "range": [4.4, 4.6], "solution": "..." },
        { "question": "Self-check (no options)", "answer": "Final answer", "solution": "..." }
      ]
    }
  ]
}
```

- `answer` for MCQ is the **0-based** option index (A = 0, B = 1 ...). For MSQ it is a list of indexes.
- In JSON, every LaTeX backslash must be doubled: `"\\frac{1}{2}"`. Newline inside a string is `\n`. Code blocks go inside the string with triple backticks.
- Marks and source are optional and show as small tags. Use `"type"` (not `"kind"`); a question without options and not `nat` is a self-check question.

### Prompt to convert questions with an AI

> Convert the questions below into this JSON format (see example). Use `"type": "msq"` / `"nat"` where needed, 0-based answer indexes, LaTeX with doubled backslashes (`\\`), and a short solution for each. Return only valid JSON.

Paste the example from above plus your questions, copy the result into `practice-questions.json`, then run `npm run validate`.

## Question tracker (dashboard)

Every subject that has `practice-questions.json` shows a **Practice questions** block on the dashboard: solved / correct / wrong counts, a chapter list, and one row per question with ✓ (correct) and ✗ (wrong) buttons. Tap a question title to open it directly in the Practice page. Inside the Practice page a question is marked automatically when you answer it (MCQ, MSQ, NAT), or you can use **My result** for self-check questions. Give each question a unique `"id"` (e.g. `"cf-05"`) so saved results survive re-ordering. `"title"` is optional and is shown in the dashboard list.

C Programming already contains 130 practice questions in 7 chapters. A few questions carry a **Note** in their solution where the source had a problem (missing `;`, options that do not match the code, or an answer key that disagrees with the code). Please review those.

## Progress tracking

Ticking a topic on the dashboard is saved in your browser (localStorage). The percentage shows in the top-right corner of every page. To move progress (topics **and** question results) to another device use **Backup & restore progress** at the bottom of the dashboard.

## Install on your phone (PWA)

The app is an installable web app: home-screen icon, full-screen, and it works offline after the first visit.

1. Deploy to Vercel (see below). Phones can only install over **HTTPS**, which Vercel gives you automatically.
2. **Android (Chrome):** open your Vercel link, tap **Install** on the dashboard card (or menu ⋮ → *Install app* / *Add to Home screen*).
3. **iPhone/iPad (Safari):** open the link, tap **Share** → **Add to Home Screen** → **Add**. It must be Safari.
4. Open it once while online so the pages are saved; after that it also opens without internet. New content you push appears the next time you open the app online.

Notes:
- Progress is stored on each device separately. On iPhone the home-screen app has its own storage, so use **Backup & restore** on the dashboard if you switch between Safari and the app.
- To test locally: `npm run build` then `npm start` and open `http://localhost:3000` (the install prompt only appears on `localhost` or HTTPS, not on `http://<your-pc-ip>`).
- `npm run dev` always removes the service worker, so you never see stale pages while editing.

## Troubleshooting

**Error: Page "/[subject]/[category]/page" is missing exported function "generateStaticParams()"**
The function exists; the dev server just has a stale list of pages (usually after content files were replaced while `npm run dev` was running). Stop the server (Ctrl+C) and run `npm run dev` again. It now clears the `.next` cache and validates `content/` automatically on every start. Errors for `/sw.js` or `/favicon.ico` are harmless.

If a page still returns 404, check that the file exists with the exact name (for example `content/c-programming/practice-questions.json`) and run `npm run validate`.

## Menu behaviour

- Phone / tablet: hamburger opens the drawer; tap outside, tap a link, press the close button or Escape to close it.
- Desktop: the sidebar is permanent; the hamburger collapses and expands it (remembered).

## Deploy on Vercel

Push to GitHub, import the repo in Vercel, no settings needed.
