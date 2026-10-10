import { quickLinks } from '@/site.config';

export const metadata = { title: 'Quick Links' };

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function QuickLinksPage() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Quick Links</h1>
      </header>
      <p className="muted">Title par click karo, link naye tab me khul jayega.</p>

      {quickLinks.length === 0 && (
        <p className="empty">
          Abhi koi link nahi hai. <code>site.config.js</code> me <code>quickLinks</code> list me add karo.
        </p>
      )}

      <div className="quick-grid">
        {quickLinks.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-card"
          >
            <span className="quick-title">
              {l.title}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </span>
            {l.description && <span className="muted quick-desc">{l.description}</span>}
            <span className="quick-host">{hostOf(l.url)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
