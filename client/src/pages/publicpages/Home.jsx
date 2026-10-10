import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="page-container home-page-shell">
      <section className="home-hero-section" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="eyebrow">Learning designed around your goals</p>
          <h1 id="home-title">Turn your next skill into a clear learning plan.</h1>
          <p className="home-hero-description">
            LearnErne helps you map what you want to learn, break it into focused steps,
            and keep momentum with a simple path built for real progress.
          </p>

          <div className="home-hero-actions">
            <Link className="button button-primary" to="/auth?mode=signup">Get started</Link>
            <Link className="button button-secondary" to="/how-it-works">Learn how it works</Link>
          </div>

          <ul className="home-trust-list" aria-label="Key LearnErne capabilities">
            <li>Goal-based learning</li>
            <li>Clear next steps</li>
            <li>Progress that stays practical</li>
          </ul>
        </div>

        <aside className="home-visual-panel" aria-label="Illustrative learning plan preview">
          <div className="home-preview-window">
            <div className="home-preview-header">
              <span className="home-dot home-dot-indigo" aria-hidden="true" />
              <span className="home-dot home-dot-violet" aria-hidden="true" />
              <span className="home-dot home-dot-cyan" aria-hidden="true" />
            </div>

            <div className="home-preview-body">
              <div className="home-preview-sidebar">
                <p>Focus</p>
                <div className="home-badge-pill">Product Design</div>
                <div className="home-mini-card home-mini-card-highlight">
                  <span>Current goal</span>
                  <strong>Design system basics</strong>
                </div>
              </div>

              <div className="home-preview-main">
                <div className="home-plan-summary">
                  <div>
                    <span className="home-label">Learning path</span>
                    <h2>Build confidence with structured practice</h2>
                  </div>
                  <span className="home-preview-status">Preview</span>
                </div>

                <ol className="home-plan-items" aria-label="Example learning plan steps">
                  <li className="home-plan-item is-complete">
                    <span className="home-plan-status" aria-hidden="true">✓</span>
                    <div>
                      <strong>Define your goal</strong>
                      <small>Clarify the skill you want to build.</small>
                    </div>
                  </li>

                  <li className="home-plan-item is-current">
                    <span className="home-plan-status" aria-hidden="true">•</span>
                    <div>
                      <strong>Map the next lessons</strong>
                      <small>Choose the most useful steps next.</small>
                    </div>
                  </li>

                  <li className="home-plan-item">
                    <span className="home-plan-status" aria-hidden="true">•</span>
                    <div>
                      <strong>Practice and review</strong>
                      <small>Turn each lesson into applied progress.</small>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="home-benefits-section" aria-labelledby="benefits-title">
        <div className="home-section-heading home-benefit-heading">
          <p className="eyebrow">Why learners use LearnErne</p>
          <h2 id="benefits-title">Learning that feels clear, focused, and realistic.</h2>
        </div>

        <div className="home-benefit-grid">
          <article className="home-benefit-card">
            <h3>Stay focused on what matters</h3>
            <p>Prioritize the skills that move you forward instead of juggling too many ideas at once.</p>
          </article>

          <article className="home-benefit-card">
            <h3>Build momentum steadily</h3>
            <p>Break learning into manageable steps so each session feels useful and achievable.</p>
          </article>

          <article className="home-benefit-card">
            <h3>Keep learning practical</h3>
            <p>Connect each lesson to outcomes you can actually use in your work and goals.</p>
          </article>
        </div>
      </section>

      <section className="home-cta-section" aria-labelledby="home-cta-title">
        <div className="home-cta-content">
          <p className="eyebrow home-cta-eyebrow">Start now</p>
          <h2 id="home-cta-title">Build a learning path that fits your next move.</h2>
        </div>
        <Link className="button button-primary home-cta-button" to="/auth?mode=signup">Create your account</Link>
      </section>
    </main>
  )
}
