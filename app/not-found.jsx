import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="muted">This subject or section does not exist.</p>
      <p>
        <Link href="/">Go to the home page</Link>
      </p>
    </div>
  );
}
