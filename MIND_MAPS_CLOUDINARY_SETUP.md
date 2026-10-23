# Permanent Mind Maps Cloud Sync (Cloudinary + Vercel)

This version keeps an editable local copy in IndexedDB and synchronizes each map to Cloudinary through a protected Next.js API route. Cloud map files are encrypted on the server before upload; the browser never receives the Cloudinary API secret.

## 1. Cloudinary credentials

1. Sign in at https://console.cloudinary.com/.
2. Open the account dashboard and copy the **Cloud name**.
3. Open **Settings → Access Keys** (the exact label can vary) and copy the API Key and API Secret. Never put the API Secret in client-side code or send it in chat.

No unsigned upload preset is required for this server-side flow.

## 2. Vercel environment variables

Open **Vercel → your project → Settings → Environment Variables** and add these four values for Production (and Preview if you want preview deployments to sync too):

- `CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name
- `CLOUDINARY_API_KEY` = your Cloudinary API key
- `CLOUDINARY_API_SECRET` = your Cloudinary API secret
- `MINDMAP_SYNC_PASSWORD` = create a long, unique password only you know

Use a strong password (ideally 20+ characters). This is a shared single-user password for the sync endpoint, not a full user-account system. Do not commit credentials to GitHub. After adding or changing variables, redeploy the project.

## 3. Local development

Create `.env.local` in the project root with the same four variables. Do not commit it; `.env*` should be ignored by Git. Restart `npm run dev` after changing it.

## 4. Connect each device

1. Open **Mind Maps → Cloud sync → Connection settings**.
2. Enter the value of `MINDMAP_SYNC_PASSWORD`.
3. Click **Test connection & load cloud maps**.
4. Click **Sync this map** or **Sync all maps**.
5. On another device, open the same deployed dashboard, enter the same sync password, and refresh the cloud library. Choose **Restore** beside a map to copy it into that device's local library.

Automatic sync can be enabled in the Cloud library panel. It runs while the page is open, after local edits, and needs an internet connection. This is not continuous real-time collaboration; keep one device editing a given map at a time to avoid overwriting newer changes from another device.

## 5. Important behavior and safety

- Local maps remain available in that browser, including while offline.
- Cloud maps are encrypted before being stored as Cloudinary raw assets. Cloudinary URLs alone contain encrypted data, not readable map JSON.
- The same sync password is required to decrypt cloud maps. If you lose it, restore is not possible. Keep it in a password manager.
- Cloud sync uses a single shared password. For multiple users, per-user accounts and authorization should be implemented before sharing the dashboard publicly.
- Restoring a cloud map imports it into local storage. If a local map has the same ID, the import flow should be used carefully to avoid replacing work unexpectedly.
- Cloud deletion removes the cloud copy only; it does not delete local copies.
- Keep regular JSON exports as an additional independent backup.

## 6. Deployment change

Static export has been disabled because Next.js API routes do not run in a static export. Deploy this project as a standard Next.js app on Vercel (`next build`). `npm start` now runs `next start` for local production testing.

The uploaded project ZIP did not include the real `content/` subject data folders. Restore your existing `content/` directory before running `npm run validate` or deploying; this patch intentionally does not invent study content.
