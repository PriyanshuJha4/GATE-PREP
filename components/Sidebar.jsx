'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProgress } from './ProgressProvider';

export default function Sidebar({ nav, siteName, open, onClose }) {
  const { stats } = useProgress();
  const pathname = (usePathname() || '/').replace(/\/$/, '') || '/';
  const activeSubject = pathname.split('/')[1] || '';
  const [expanded, setExpanded] = useState(activeSubject); // one subject folder open at a time

  useEffect(() => {
    if (activeSubject) setExpanded(activeSubject);
  }, [activeSubject]);

  return (
    <aside id="sidebar" className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      <div className="sidebar-head">
        <Link href="/" className="brand" onClick={onClose}>
          {siteName}
        </Link>
        <button className="icon-btn close-btn" onClick={onClose} aria-label="Close navigation menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        <Link
          href="/"
          className={`nav-link nav-home ${pathname === '/' ? 'active' : ''}`}
          aria-current={pathname === '/' ? 'page' : undefined}
          onClick={onClose}
        >
          Dashboard
        </Link>

        <div className="nav-divider" />

        {nav.map((s) => {
          const isOpen = expanded === s.slug;
          const st = stats.bySubject[s.slug];
          return (
            <div key={s.slug} className="nav-group">
              <button
                className="nav-subject"
                onClick={() => setExpanded(isOpen ? '' : s.slug)}
                aria-expanded={isOpen}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isOpen ? 'currentColor' : 'none'} fillOpacity={isOpen ? 0.18 : 0} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                </svg>
                <span className="nav-subject-name">{s.title}</span>
                {st && st.total > 0 && (
                  <span className="nav-count">
                    {st.done}/{st.total}
                  </span>
                )}
                <svg className={`chev ${isOpen ? 'rot' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>

              {isOpen && (
                <ul className="nav-list">
                  {s.categories.length === 0 && <li className="nav-empty">No notes added yet</li>}
                  {s.categories.map((c) => {
                    const href = `/${s.slug}/${c.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={c.slug}>
                        <Link
                          href={`${href}/`}
                          className={`nav-link ${active ? 'active' : ''}`}
                          aria-current={active ? 'page' : undefined}
                          onClick={onClose}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
