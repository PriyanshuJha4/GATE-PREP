// Runs automatically before `npm run dev` (see "predev" in package.json).
// Removes Next's cache so a stale list of pages never survives a restart.
import fs from 'node:fs';

try {
  fs.rmSync('.next', { recursive: true, force: true });
  console.log('✓ Cleared .next cache');
} catch (e) {
  console.warn(`Could not clear .next (${e.code || e.message}). Stop other dev servers and try again.`);
}
