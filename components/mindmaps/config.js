// ─────────────────────────────────────────────────────────────────────────────
// PERMANENT CLOUDINARY LINK
// Fill these two values ONCE (or set the env vars in .env.local / Vercel) and every
// device that opens the site is linked automatically — no setup screen needed.
//
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
//
// Only the cloud name and an UNSIGNED preset name go here. Never put an API secret in this file.
// ─────────────────────────────────────────────────────────────────────────────
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '', // e.g. 'my-cloud'
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '', // e.g. 'mindmaps'
  autoBackupMinutes: 15, // when linked: back up all maps at most this often after changes (0 = manual only)
};
export const CLOUD_LINKED = !!(CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset);
