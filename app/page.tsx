import Link from 'next/link'

const solutions = [
  { number: '01', title: 'Listing Price Reports', text: 'Build a clear pricing position from property context, comparable evidence, and transparent assumptions.' },
  { number: '02', title: 'Offer Price Reports', text: 'Evaluate an offer with a documented view of market movement, risk, and the evidence behind the recommendation.' },
  { number: '03', title: 'Market Direction', text: 'Read local activity across time increments instead of relying on a single snapshot.' },
]

const pillars = [
  { number: 'I', title: 'Comps', text: 'Disciplined comparable-sales selection and qualification — not a black-box average.' },
  { number: 'II', title: 'MAR', text: 'The Market Assumption Report: like-property behavior across time increments — list price, sold price, days on market, absorption rate.' },
  { number: 'III', title: 'Buyer Dead Zone', text: 'Pricing bands mapped against where buyer interest measurably drops off — below-market, optimal, and resistance.' },
  { number: 'IV', title: 'Upgrades & Repairs', text: 'Curb appeal, interior style, and renovation quality quantified from listing evidence — powered by Search by Design.', href: '/search-by-design' },
]

export default function HomePage() {
  return (
    <main>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">Drake&apos;s <span>Pricing Desk</span></Link>
        <div className="nav-links">
          <Link href="#engines">Platform</Link>
          <Link href="#solutions">Solutions</Link>
          <Link href="#methodology">Methodology</Link>
          <Link href="#security">Security</Link>
          <Link href="/about">About</Link>
          <Link className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="eyebrow">Data · Analysis · Clearer decisions</div>
        <h1 id="hero-title"><span>Smarter Pricing.</span><span>Stronger Outcomes.</span></h1>
        <p className="hero-lede">A private real-estate intelligence workspace for housing professionals who want the reasoning behind a recommendation—not just a number.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/login">Sign in to your workspace <span aria-hidden="true">→</span></Link>
          <Link className="button button-secondary" href="/request-access">Request access</Link>
        </div>
        <p className="hero-note">Currently in private development. Report access is limited to verified users.</p>
      </section>

      <section id="engines" className="section-block" aria-labelledby="engines-title">
        <div className="section-kicker">Two intelligence engines</div>
        <div className="section-heading"><h2 id="engines-title">Know the number. Know the home.</h2></div>
        <div className="solution-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <article className="solution-card">
            <span className="card-number">Pricing</span>
            <h3>Pricing Intelligence</h3>
            <p>Know what the property should sell for and how the market is likely to respond.</p>
            <Link className="button button-secondary" href="/login">Run a Pricing Analysis <span aria-hidden="true">→</span></Link>
          </article>
          <article className="solution-card">
            <span className="card-number">Search by Design</span>
            <h3>Search by Design</h3>
            <p>Tell us the home your client is actually waiting for. We monitor incoming listings and alert you when we find it.</p>
            <Link className="button button-secondary" href="/search-by-design">Create a Search by Design <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>

      <section id="solutions" className="section-block" aria-labelledby="solutions-title">
        <div className="section-kicker">What the desk supports</div>
        <div className="section-heading"><h2 id="solutions-title">Pricing intelligence built around the decision.</h2><p>Keep the workflow focused: understand the property, inspect the evidence, produce a report, and learn from the outcome.</p></div>
        <div className="solution-grid">{solutions.map((solution) => <article className="solution-card" key={solution.number}><span className="card-number">{solution.number}</span><h3>{solution.title}</h3><p>{solution.text}</p><Link href="/request-access">Explore the workflow <span aria-hidden="true">→</span></Link></article>)}</div>
      </section>

      <section id="methodology" className="section-block" aria-labelledby="methodology-title">
        <div className="section-kicker">Methodology</div>
        <div className="section-heading"><h2 id="methodology-title">Four pillars of stability and accuracy.</h2><p>Each report keeps its inputs, evidence, and assumptions close to the conclusion — built to be inspected, not just trusted.</p></div>
        <div className="solution-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {pillars.map((pillar) => (
            <article className="solution-card" key={pillar.number}>
              <span className="card-number">{pillar.number}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
              {pillar.href && <Link href={pillar.href}>See Search by Design <span aria-hidden="true">→</span></Link>}
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="security-section" aria-labelledby="security-title"><div className="security-mark" aria-hidden="true">⌂</div><div><div className="section-kicker">Private by design</div><h2 id="security-title">Your reports belong in your workspace.</h2><p>Authenticated workspaces are being built with verified accounts, role-based access, isolated tenant data, server-side report generation, and an audit trail for sensitive activity.</p><Link className="text-link" href="/request-access">Learn about access <span aria-hidden="true">→</span></Link></div></section>

      <section id="resources" className="resource-section" aria-labelledby="resources-title"><div><div className="section-kicker">Resources</div><h2 id="resources-title">A clear path from question to report.</h2></div><p>Start with the public overview, then move into your verified workstation when access is approved. Documentation and sample formats will live alongside the product as it develops.</p></section>

      <footer className="site-footer"><span>Drake&apos;s Pricing Desk</span><span>Private application in development · © 2026 Drake&apos;s Pricing Desk</span></footer>
    </main>
  )
}
