import Link from 'next/link';
import { TAXONOMY } from '../../lib/search-by-design/taxonomy';

const sampleTerms = [
  'wooden beams on ceiling', 'white exterior', 'Frank Lloyd Wright-inspired', 'granite countertops',
  'green kitchen', 'claw-foot tub', 'historic charm', 'shiplap', 'glass wine room', 'mature trees',
];

const steps = [
  { number: '01', title: 'Describe the home', text: 'Type what the client wants in plain language, select attributes manually, or both.' },
  { number: '02', title: 'We watch new inventory', text: 'Coming Soon, New, Active, and newly reactivated listings are analyzed as they appear, subject to your MLS/data source’s rules.' },
  { number: '03', title: 'You get the match, not the search', text: 'When a listing clears the bar, the client is alerted and you’re copied — with the reasons, not just a score.' },
];

export default function SearchByDesignPage() {
  return (
    <main>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">Drake&apos;s <span>Pricing Desk</span></Link>
        <div className="nav-links">
          <Link href="/">Pricing</Link>
          <Link href="/search-by-design/about">About</Link>
          <Link className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <section className="hero-section" aria-labelledby="sbd-hero-title">
        <div className="eyebrow">Search by Design</div>
        <h1 id="sbd-hero-title"><span>Buyers don&apos;t search</span><span>in MLS fields.</span></h1>
        <p className="hero-lede">
          Traditional alerts search the information entered into the MLS. Search by Design analyzes the property itself —
          reading listing photos, remarks, and history for the details a checkbox search can never find.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/login">Create a Search by Design <span aria-hidden="true">→</span></Link>
          <Link className="button button-secondary" href="/search-by-design/about">Watch the overview</Link>
        </div>
        <p className="hero-note">Currently in private beta. Available based on your workspace subscription.</p>
      </section>

      <section className="section-block" aria-labelledby="terms-title">
        <div className="section-kicker">Terms you can&apos;t search in the MLS</div>
        <div className="section-heading"><h2 id="terms-title">Say it the way your client says it.</h2></div>
        <div className="sbd-tag-row" style={{ marginTop: 0 }}>
          {sampleTerms.map((term) => (
            <span className="sbd-tag sbd-tag-prefer" key={term}>{term}</span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section-block" aria-labelledby="how-title">
        <div className="section-kicker">How it works</div>
        <div className="section-heading"><h2 id="how-title">From a sentence to a structured watch.</h2></div>
        <div className="solution-grid">
          {steps.map((step) => (
            <article className="solution-card" key={step.number}>
              <span className="card-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split-section" aria-labelledby="taxonomy-title">
        <div><div className="section-kicker">Property Intelligence</div><h2 id="taxonomy-title">Hundreds of design attributes, organized.</h2></div>
        <div className="split-copy">
          <p>Every trait is stored with its category, confidence, and the evidence behind it — never a bare label. Brand and
            style claims (&quot;Sub-Zero&quot;, &quot;Frank Lloyd Wright-inspired&quot;) require enough evidence to be called confirmed;
            otherwise they&apos;re shown as likely.</p>
          <ul className="principle-list">
            {TAXONOMY.slice(0, 6).map((category) => (
              <li key={category.key}><strong>{category.label}</strong><span>{category.attributes.length} tracked attributes</span></li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="site-footer"><span>Drake&apos;s Pricing Desk</span><span>Search by Design is a private beta &middot; © 2026 Drake&apos;s Pricing Desk</span></footer>
    </main>
  );
}
