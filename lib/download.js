// Client-side helper: save a string as a file in the user's browser.
export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'download.txt';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Delay revocation so browsers have time to begin the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
