'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProgressProvider } from './ProgressProvider';
import ProgressBadge from './ProgressBadge';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';

const DESKTOP = '(min-width: 1025px)';

export default function AppShell({ nav, syllabus, questionIndex, siteName, children }) {
  const [open, setOpen] = useState(false); // phone/tablet drawer
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);

  // Close the drawer after any navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the drawer; growing to desktop width resets it.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const mq = window.matchMedia(DESKTOP);
    const onChange = () => mq.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, []);

  // Stop the page behind the drawer from scrolling.
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  const onMenu = () => {
    if (window.matchMedia(DESKTOP).matches) {
      // Desktop: collapse / expand the permanent sidebar (remembered).
      const root = document.documentElement;
      const next = root.getAttribute('data-sidebar') === 'collapsed' ? 'open' : 'collapsed';
      root.setAttribute('data-sidebar', next);
      try {
        localStorage.setItem('sidebar', next);
      } catch {}
    } else {
      setOpen((o) => !o);
    }
  };

  return (
    <ProgressProvider syllabus={syllabus} questionIndex={questionIndex}>
      <div className="shell">
        <Sidebar nav={nav} siteName={siteName} open={open} onClose={close} />
        <div className={`overlay ${open ? 'show' : ''}`} onClick={close} aria-hidden="true" />

        <div className="main-col">
          <header className="topbar">
            <button
              className="icon-btn menu-btn"
              onClick={onMenu}
              aria-label="Toggle navigation menu"
              aria-controls="sidebar"
              aria-expanded={open}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="topbar-title">
              {siteName}
            </Link>
            <ProgressBadge />
            <ThemeToggle />
          </header>
          <main className="main">{children}</main>
        </div>
      </div>
    </ProgressProvider>
  );
}
