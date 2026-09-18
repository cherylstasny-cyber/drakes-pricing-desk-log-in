import Link from 'next/link'

const solutions = [
  { number: '01', title: 'Listing Price Reports', text: 'Build a clear pricing position from property context, comparable evidence, and transparent assumptions.' },
  { number: '02', title: 'Offer Price Reports', text: 'Evaluate an offer with a documented view of market movement, risk, and the evidence behind the recommendation.' },
  { number: '03', title: 'Market Direction', text: 'Read local activity across time increments instead of relying on a single snapshot.' },
]

export default function HomePage() {
  return (
    <main>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">Drake&apos;s <span>Pricing Desk</span></Link>
        <div className="nav-links">
          <Link href="#solutions">Solutions</Link>
          <Link href="#methodology">Methodology</Link>
          <Link href="#security">Security</Link>
          <Link href="#resources">Resources</Link>
          <Link className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="eyebrow">Data · Analysis · Clearer decisions</div>
        <h1 id="hero-title"><span>Smarter Pricing.</span><span>Stronger Outcomes.</span></h1>
        <p className="hero-lede">A private pricing intelligence workspace for housing professionals who want the reasoning behind a recommendation—not just a number.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/login">Sign in to your workspace <span aria-hidden="true">→</span></Link>
          <Link className="button button-secondary" href="/request-access">Request access</Link>
        </div>
        <p className="hero-note">Currently in private development. Report access is limited to verified users.</p>
      </section>

      <section id="solutions" className="section-block" aria-labelledby="solutions-title">
        <div className="section-kicker">What the desk supports</div>
        <div className="section-heading"><h2 id="solutions-title">Pricing intelligence built around the decision.</h2><p>Keep the workflow focused: understand the property, inspect the evidence, produce a report, and learn from the outcome.</p></div>
        <div className="solution-grid">{solutions.map((solution) => <article className="solution-card" key={solution.number}><span className="card-number">{solution.number}</span><h3>{solution.title}</h3><p>{solution.text}</p><Link href="/request-access">Explore the workflow <span aria-hidden="true">→</span></Link></article>)}</div>
      </section>

      <section id="methodology" className="split-section" aria-labelledby="methodology-title">
        <div><div className="section-kicker">Methodology</div><h2 id="methodology-title">Make the reasoning inspectable.</h2></div>
        <div className="split-copy"><p>Each report is designed to keep its inputs, comparable evidence, adjustments, assumptions, and review history close to the conclusion.</p><ul className="principle-list"><li><strong>Evidence first</strong><span>Trace recommendations back to the property and market context used.</span></li><li><strong>Assumptions visible</strong><span>Separate observed information from analyst judgment and estimated values.</span></li><li><strong>Accuracy review</strong><span>Record outcomes so the process can improve over time.</span></li></ul></div>
      </section>

      <section id="security" className="security-section" aria-labelledby="security-title"><div className="security-mark" aria-hidden="true">⌂</div><div><div className="section-kicker">Private by design</div><h2 id="security-title">Your reports belong in your workspace.</h2><p>Authenticated workspaces are being built with verified accounts, role-based access, isolated tenant data, server-side report generation, and an audit trail for sensitive activity.</p><Link className="text-link" href="/request-access">Learn about access <span aria-hidden="true">→</span></Link></div></section>

      <section id="resources" className="resource-section" aria-labelledby="resources-title"><div><div className="section-kicker">Resources</div><h2 id="resources-title">A clear path from question to report.</h2></div><p>Start with the public overview, then move into your verified workstation when access is approved. Documentation and sample formats will live alongside the product as it develops.</p></section>

      <footer className="site-footer"><span>Drake&apos;s Pricing Desk</span><span>Private application in development · © 2026 Drake&apos;s Pricing Desk</span></footer>
    </main>
  )
}
