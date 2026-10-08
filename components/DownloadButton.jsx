'use client';

import { downloadText } from '@/lib/download';

export default function DownloadButton({ content, filename, mime = 'text/markdown' }) {
  return (
    <button className="btn" onClick={() => downloadText(filename, content, mime)} title={`Download ${filename}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
      Download
    </button>
  );
}
