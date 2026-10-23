# Apply the permanent Mind Maps sync patch

## Before applying

1. Back up your existing GATE dashboard folder (or commit your current changes to Git).
2. Keep your real `content/` directory untouched. The ZIP originally uploaded in this chat did not include the subject data folders, so this patch does not contain or replace them.
3. Extract this patch ZIP into the root of your existing project and allow the listed files to replace their matching files.

## After applying

1. Confirm `next.config.mjs` no longer sets `output: 'export'`.
2. Run `npm install` if needed, then `npm run validate` and `npm run dev`.
3. Visit `/mind-maps/`. The Mind Maps link is in the sidebar.
4. Configure the four Vercel environment variables described in `MIND_MAPS_CLOUDINARY_SETUP.md` and redeploy.
5. In Mind Maps → Cloud sync → Connection settings, enter the same `MINDMAP_SYNC_PASSWORD` value and test the connection.

## Files in this patch

- `app/api/mindmaps/route.js` — server-side, password-protected Cloudinary API; encrypts map payloads before storing them in Cloudinary.
- `app/mind-maps/page.jsx` — Mind Maps route.
- `app/globals.css` — existing styles plus Mind Maps workspace styles.
- `components/Sidebar.jsx` — adds the sidebar link.
- `components/MindMapsWorkspace.jsx` and `components/mindmaps/*` — editor, local persistence, cloud library and sync client.
- `next.config.mjs`, `package.json` — switch from static export to normal Next.js deployment so the API route can run.
- `public/sw.js` — prevents the service worker from caching API responses.
- `.gitignore`, `README.md` — deployment/security notes.

## Important

Static export cannot execute `/api/mindmaps`. This patch therefore changes production deployment to standard Next.js on Vercel. Existing pages and content schemas are preserved in the patch, but the actual `content/` files must be present in your local repository. I could not run a full production build against the uploaded archive because it omitted those content files and the archive did not include installed dependencies.
