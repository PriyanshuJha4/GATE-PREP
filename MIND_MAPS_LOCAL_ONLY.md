# Mind Maps — offline, local-only (no cloud)

Page: `/mind-maps/` (already linked in the sidebar). No new npm packages, no env variables, no network calls — everything stays on this device.

**Delete these old files from your project if they exist:** `components/mindmaps/cloud.js` and `components/mindmaps/config.js`. You can also remove the `NEXT_PUBLIC_CLOUDINARY_*` variables from Vercel.

## Files in this patch

- `app/mind-maps/page.jsx` – unchanged route
- `components/Sidebar.jsx` – unchanged (Mind Maps link)
- `components/MindMapsWorkspace.jsx` – the editor (rewritten)
- `components/mindmaps/model.js` – data model, templates, auto layout
- `components/mindmaps/formats.js` – import/export (JSON, Markdown, OPML, FreeMind, SVG, PNG)
- `components/mindmaps/storage.js` – IndexedDB storage with localStorage fallback
- `components/mindmaps/ui.jsx` – modal, dropdown, toast
- `app/globals.css` – the "Mind maps workspace" section at the end is replaced (everything above it is unchanged)

Copy the folders over your project (same paths) and keep the existing `@/components/...` setup.

## Using it

- **Add topics:** select a topic, press `Tab` (child) or `Enter` (sibling), or use the green **＋** under a selected node (click = child, drag onto another node = connect, drag onto empty space = new linked topic).
- **Edit:** double-click or `F2`; `Enter` finishes. Drag to move (a branch moves with its parent), drag the corner square to resize, `Space` folds a branch.
- **Layout:** maps stay tidy automatically until you drag a topic by hand; press **✦ Tidy** to re-arrange.
- **Navigate:** drag empty space to pan, `Ctrl` + scroll or pinch to zoom, **Fit** (`Ctrl+0`), `Shift` + drag to box-select. Press `?` for all shortcuts.
- **Undo/redo**, duplicate branch (`Ctrl+D`), colours, fonts, stickers, images (paste or drop them in), connector labels/colours, search across map titles *and* topic text.
- Templates when creating a map (GATE subject, chapter notes, brainstorm) or **From an outline**.

## Save to a folder on your computer

Header **⋯ → Save to a folder on this device…** (or the 💾 line in the maps list). Choose a folder once (e.g. Documents/MindMaps); every created/edited map is then also written there as `<name>-<id>.mindmap.json`. Works in Chrome/Edge/Opera on desktop; after a browser restart a **Resume** button re-grants permission. Phones/Safari/Firefox cannot write to a chosen folder — there maps stay in the browser's storage and you can use Export. Deleting a map in the app never deletes its file; **Load maps from folder…** brings files back in.

## Phone & full screen

- **⛶ Full screen** (header, or the green button on the canvas) gives the whole screen to the map; **⤡ Minimize** (or `Esc`) returns to the page. Works on phone and Windows.
- One finger drags the map, two fingers pinch-zoom and move it. **⬚ Select** lets you box-select with a finger.
- Bottom toolbar scrolls sideways with all tools (Child, Sibling, Edit, Connect, Select, Delete, Undo/Redo, Tidy, Zoom, Fit, View). **🎨 Style** opens a bottom sheet for colour, font, width etc.
- **☰** opens your maps list; Import, Export and ⋯ stay in the top bar.
- Double-tap a topic to edit it. On the normal page the canvas lets you scroll the page with one finger.

## Local storage

- Maps are stored in the browser's **IndexedDB** (hundreds of MB), so images no longer hit the old ~5 MB localStorage limit. The page also asks the browser to treat the data as persistent.
- Maps saved by the previous version (`gate-notebook-mindmaps-v1`) are migrated automatically; the old copy is left untouched as a safety net.
- Saving is automatic; the header shows "Saving… / ✓ Saved". If the browser refuses a write, a red warning appears.
- Pictures are compressed (max 1400 px, WebP) when added.
- Deleting a map can be undone from the toast. Storage is per browser/device — clearing site data erases it, so export a JSON backup (or use the folder copy) regularly — the library shows how long ago you last did.

## Import

**Import ▾** (header) or drag & drop a file anywhere on the page:

- `.json` – single map, full-library backup, or older exports
- `.md` / `.txt` – indented or bulleted outline, Markdown headings
- `.opml`, `.mm` (FreeMind; XMind and MindNode can export these)
- images (dropped on the canvas or pasted with `Ctrl+V`)
- **Paste an outline…** – or just paste multi-line text onto the canvas to add it under the selected topic
- **From a web link…** – public https link to any of the above
- If an imported map already exists you choose **Keep both** (default), **Replace** or **Skip**.

## Export

**Export ▾**: map JSON, all-maps JSON backup, PNG, SVG, PDF/Print, Markdown, OPML, FreeMind `.mm`, or copy the outline text. The OPML/`.mm`/Markdown outputs open in XMind, MindNode, FreeMind and most outliners (outline structure only — styles and images stay in JSON/PNG/SVG).
