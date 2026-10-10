import { Link } from 'react-router-dom'

export default function HowItWorks() {
  return (
    <main className="page-container how-page-shell">
      <section className="how-page-header" aria-labelledby="how-it-works-page-title">
        <p className="eyebrow">How it works</p>
        <h1 id="how-it-works-page-title">A simple routine for your next learning goal.</h1>
        <p className="how-page-description">
          Use these steps to choose a focus, shape a manageable plan, and decide what to practice next.
          They describe a practical approach, not an automated service.
        </p>
      </section>

      <section className="how-flow-section" aria-labelledby="how-flow-title">
        <h2 id="how-flow-title" className="how-flow-title">A practical learning flow</h2>
        <ol className="how-steps-grid">
          <li className="home-step-card how-step-card">
            <span className="home-step-icon" aria-hidden="true">01</span>
            <h3>Choose one learning goal</h3>
            <p>Name the skill you want to build and write down why it matters to you.</p>
          </li>

          <li className="home-step-card how-step-card">
            <span className="home-step-icon" aria-hidden="true">02</span>
            <h3>Break it into next steps</h3>
            <p>List a few topics, lessons, or tasks that would help you work toward that goal.</p>
          </li>

          <li className="home-step-card how-step-card">
            <span className="home-step-icon" aria-hidden="true">03</span>
            <h3>Practice, then review</h3>
            <p>Try one step, reflect on what helped, and choose what to focus on next.</p>
          </li>
        </ol>
      </section>

      <section className="how-process-cta" aria-labelledby="how-process-cta-title">
        <div className="how-process-cta-copy">
          <p className="eyebrow">Want to explore?</p>
          <h2 id="how-process-cta-title">Ready to start your learning plan?</h2>
          <p className="how-process-cta-note">Create an account to save your learning progress and preferences.</p>
        </div>
        <Link className="button button-primary" to="/auth?mode=signup">Get started</Link>
      </section>
    </main>
  )
}
