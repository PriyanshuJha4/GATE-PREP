'use client';

import Link from 'next/link';
import { useProgress } from './ProgressProvider';

const R = 11;
const C = 2 * Math.PI * R;

// Top-right corner badge: ring + percentage of the syllabus completed.
export default function ProgressBadge() {
  const { stats, qstats, ready } = useProgress();
  const pct = ready ? stats.percent : 0;
  return (
    <Link
      href="/"
      className="progress-badge"
      aria-label={`Syllabus completed: ${pct} percent. Open dashboard`}
      title={`${stats.done}/${stats.total} topics completed · ${qstats.solved}/${qstats.total} questions solved`}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r={R} className="ring-bg" />
        <circle
          cx="14"
          cy="14"
          r={R}
          className="ring-fg"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          transform="rotate(-90 14 14)"
        />
      </svg>
      <strong>{pct}%</strong>
    </Link>
  );
}
