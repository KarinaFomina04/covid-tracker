import { Link } from 'react-router-dom';

export default function NotFoundPage(): JSX.Element {
  return (
    <main className="container page-content not-found">
      <p className="eyebrow eyebrow--muted">PAGE NOT FOUND</p>
      <h1>We couldn't find that page.</h1>
      <p>The address may be incorrect or the page may have moved.</p>
      <Link className="primary-link" to="/">Return to dashboard</Link>
    </main>
  );
}
