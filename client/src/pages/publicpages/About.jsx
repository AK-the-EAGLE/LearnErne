import { Link } from 'react-router-dom'

export default function About() {
  return (
    <main className="page-container about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <p className="eyebrow">About LearnErne</p>
        <h1 id="about-title">Learning should move you forward.</h1>
        <p className="about-hero-description">
          LearnErne is built around a simple idea: learning feels more manageable
          when it starts with what matters to you and leaves room to move at your own pace.
        </p>
      </section>
      <section className="about-values" aria-labelledby="about-values-title">
        <h2 id="about-values-title" className="about-values-title">Principles for practical learning</h2>
        <div className="about-values-grid">
          <article className="value-card">
            <span className="value-number" aria-hidden="true">01</span>
            <h3>Start with your goals</h3>
            <p>Choose a skill or outcome that matters to you before deciding what to study.</p>
          </article>
          <article className="value-card">
            <span className="value-number" aria-hidden="true">02</span>
            <h3>Make progress practical</h3>
            <p>Break a broad topic into manageable steps you can use in your own context.</p>
          </article>
          <article className="value-card">
            <span className="value-number" aria-hidden="true">03</span>
            <h3>Keep moving at your pace</h3>
            <p>Leave room to practice, reflect, and adjust your next step as you learn.</p>
          </article>
        </div>
      </section>
      <section className="about-cta" aria-labelledby="about-cta-title">
        <div className="about-cta-copy">
          <p className="eyebrow">Your next step starts here</p>
          <h2 id="about-cta-title">Learn what you need. Next.</h2>
        </div>
        <Link className="button button-primary" to="/how-it-works">Explore the learning flow</Link>
      </section>
    </main>
  )
}
