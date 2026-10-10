import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNavigation } from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams() {
  return getNavigation().map((s) => ({ subject: s.slug }));
}

export function generateMetadata({ params }) {
  const s = getNavigation().find((x) => x.slug === params.subject);
  return { title: s ? s.title : 'Not found' };
}

export default function SubjectPage({ params }) {
  const subject = getNavigation().find((x) => x.slug === params.subject);
  if (!subject) notFound();

  return (
    <div className="page">
      <header className="page-head">
        <h1>{subject.title}</h1>
      </header>
      {subject.description && <p className="muted">{subject.description}</p>}
      {subject.categories.length === 0 && (
        <p className="empty">
         <p className="empty">
  No content available yet. Add the required JSON files
  to <code>content/{subject.slug}/</code>.
</p>
          <code>practice-questions.json</code> to <code>content/{subject.slug}/</code>.
        </p>
      )}
      <div className="category-grid">
        {subject.categories.map((c) => (
          <Link key={c.slug} href={`/${subject.slug}/${c.slug}/`} className="category-card">
            <strong>{c.label}</strong>
            <span className="muted">{c.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
