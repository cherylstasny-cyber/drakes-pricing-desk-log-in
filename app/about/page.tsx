import Link from 'next/link';

/**
 * Video slot for the Drake's Pricing about video. No file has been
 * generated/approved yet (see docs/search-by-design/video-script-pricing.md),
 * so this renders a designed placeholder instead of a broken <video> tag.
 * Once a final file exists, drop it at public/media/pricing-about.mp4
 * (and a poster at public/media/pricing-about-poster.jpg) and swap the
 * placeholder block below for:
 *
 * <video className="sbd-about-video" controls playsInline preload="metadata" poster="/media/pricing-about-poster.jpg">
 *   <source src="/media/pricing-about.mp4" type="video/mp4" />
 * </video>
 */
function VideoPlaceholder() {
  return (
    <div className="sbd-video-placeholder" role="img" aria-label="About Drake's Pricing video -- coming soon">
      <span className="sbd-video-play" aria-hidden="true">▶</span>
      <p>About Drake&apos;s Pricing</p>
      <span>Video coming soon</span>
    </div>
  );
}

export default function PricingAboutPage() {
  return (
    <main>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">Drake&apos;s <span>Pricing Desk</span></Link>
        <div className="nav-links">
          <Link href="/search-by-design">Search by Design</Link>
          <Link className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <section className="hero-section" aria-labelledby="about-title">
        <div className="eyebrow">About Drake&apos;s Pricing</div>
        <h1 id="about-title"><span>Comps tell you</span><span>what happened.</span></h1>
        <p className="hero-lede">Drake&apos;s Pricing is designed to help determine what the market is likely to do next &mdash; for both the list price and the offer.</p>
      </section>

      <section className="section-block" aria-labelledby="agents-title">
        <div className="section-heading"><h2 id="agents-title" className="sr-only">Built for agents</h2></div>
        <div className="solution-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <article className="solution-card">
            <h3>Built by agents, for agents</h3>
            <p>Every part of this was shaped by real pricing conversations with sellers and buyers &mdash; not designed from the outside looking in.</p>
          </article>
          <article className="solution-card">
            <h3>A huge time saver</h3>
            <p>What used to take hours of comp-pulling and cross-referencing now takes minutes &mdash; so you spend more time with clients and less time in spreadsheets.</p>
          </article>
        </div>
      </section>

      <section className="section-block" aria-labelledby="video-title">
        <div className="section-heading"><h2 id="video-title" className="sr-only">Overview video</h2></div>
        <VideoPlaceholder />
      </section>

      <section className="split-section" aria-labelledby="explain-title">
        <div><div className="section-kicker">The problem</div><h2 id="explain-title">A comparable-sales report only looks backward.</h2></div>
        <div className="split-copy">
          <p>It tells you what already sold. It doesn&apos;t tell you where buyer interest drops off, how fast this price band is
            moving, or what a competing listing two doors down is about to do to your pricing decision &mdash; whether you&apos;re
            setting a list price or evaluating an offer.</p>
          <ul className="principle-list">
            <li><strong>Read the competition</strong><span>Current listings, failed listings, and market velocity around this exact property.</span></li>
            <li><strong>Find the dead zone</strong><span>The price band where buyer interest measurably drops off &mdash; before you list, not after.</span></li>
            <li><strong>Get a strategy, not just a number</strong><span>A recommended list or offer price with the reasoning behind it.</span></li>
          </ul>
        </div>
      </section>

      <section className="security-section" aria-labelledby="closing-title">
        <div className="security-mark" aria-hidden="true">⌂</div>
        <div>
          <div className="section-kicker">Core message</div>
          <h2 id="closing-title">Comparable sales tell you what happened.</h2>
          <p>Drake&apos;s Pricing is designed to help determine what the market is likely to do next.</p>
          <Link className="button button-primary" href="/login">Run a Pricing Analysis <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="site-footer"><span>Drake&apos;s Pricing Desk</span><span>Private application in development &middot; © 2026 Drake&apos;s Pricing Desk</span></footer>
    </main>
  );
}
