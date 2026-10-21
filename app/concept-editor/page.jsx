import { getNavigation, getDoc } from '@/lib/content';
import ConceptEditor from '@/components/ConceptEditor';

export const metadata = { title: 'Concept Editor' };

export default function ConceptEditorPage() {
  const subjects = getNavigation().map((subject) => {
    const doc = getDoc(subject.slug, 'concepts');
    return { slug: subject.slug, title: subject.title, data: doc?.data || { title: `${subject.title} — Concepts`, sections: [] } };
  });
  return <ConceptEditor subjects={subjects} />;
}
