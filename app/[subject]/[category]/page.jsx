import { notFound } from 'next/navigation';
import { getAllParams, getDoc, getSubject } from '@/lib/content';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Quiz from '@/components/Quiz';
import DownloadButton from '@/components/DownloadButton';
import concepts from '@/components/concepts';import Concepts from '@/components/concepts';
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllParams();
}

export function generateMetadata({ params }) {
  const subject = getSubject(params.subject);
  const doc = getDoc(params.subject, params.category);
  if (!subject || !doc) return { title: 'Not found' };
  return { title: `${subject.title} – ${doc.categoryLabel}` };
}

export default function CategoryPage({ params }) {
  const subject = getSubject(params.subject);
  const doc = getDoc(params.subject, params.category);
  if (!subject || !doc) notFound();

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="crumb">{subject.title}</p>
          <h1>{doc.categoryLabel}</h1>
        </div>
        <DownloadButton content={doc.raw} filename={doc.filename} mime={doc.mime} />
      </header>

      {doc.type === 'quiz' ? (
  <Quiz data={doc.data} subject={subject.slug} />
) : doc.type === 'concepts' ? (
  <Concepts data={doc.data} />
) : (
  <MarkdownRenderer content={doc.raw} />
)}
    </div>
  );
}
