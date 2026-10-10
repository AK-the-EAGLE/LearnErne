import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page-container not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">This page is not available.</h1>
        <p>
          The link may be outdated, or the page may have moved. Head back to LearnErne to continue your learning path.
        </p>
        <div className="not-found-actions">
          <Link className="button button-primary" to="/">Return home</Link>
          <Link className="button button-secondary" to="/courses">Explore courses</Link>
        </div>
      </section>
    </main>
  )
}
