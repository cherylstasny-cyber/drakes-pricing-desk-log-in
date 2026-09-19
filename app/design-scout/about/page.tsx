import Link from 'next/link';

/**
 * Video slot for the Design Scout about video. No file has been
 * generated/approved yet (see docs/design-scout/video-script-design-scout.md),
 * so this renders a designed placeholder instead of a broken <video> tag.
 * Once a final file exists, drop it at public/media/design-scout-about.mp4
 * (and a poster at public/media/design-scout-about-poster.jpg) and swap
 * the placeholder block below for:
 *
 * <video className="ds-about-video" controls playsInline preload="metadata" poster="/media/design-scout-about-poster.jpg">
 *   <source src="/media/design-scout-about.mp4" type="video/mp4" />
 * </video>
 */
function VideoPlaceholder() {
  return (
    <div className="ds-video-placeholder" role="img" aria-label="About Design Scout video -- coming soon">
      <span className="ds-video-play" aria-hidden="true">▶</span>
      <p>About Design Scout</p>
      <span>Video coming soon</span>
    </div>
  );
}

export default function DesignScoutAboutPage() {
  return (
    <main>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">Drake&apos;s <span>Pricing Desk</span></Link>
        <div className="nav-links">
          <Link href="/design-scout">Design Scout</Link>
          <Link className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <section className="hero-section" aria-labelledby="about-title">
        <div className="eyebrow">About Design Scout</div>
        <h1 id="about-title"><span>Your buyers don&apos;t search</span><span>four beds, three baths.</span></h1>
        <p className="hero-lede">They search for the house they can picture themselves living in. Here&apos;s how Design Scout finds it for them.</p>
      </section>

      <section className="section-block" aria-labelledby="agents-title">
        <div className="panel" style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <h2 id="agents-title" style={{ margin: '0 0 .5rem' }}>Built by agents, for agents.</h2>
          <p className="lede" style={{ margin: '0 auto' }}>
            Search by design, not by checkbox. Design Scout finds exactly what your client is picturing — then quantifies the
            upgrades, renovations, repairs, curb appeal, and interior style that MLS checkboxes can&apos;t capture.
          </p>
        </div>
      </section>

      <section className="section-block" aria-labelledby="video-title">
        <div className="section-heading"><h2 id="video-title" className="sr-only">Overview video</h2></div>
        <VideoPlaceholder />
      </section>

      <section className="split-section" aria-labelledby="explain-title">
        <div><div className="section-kicker">The problem</div><h2 id="explain-title">MLS fields can&apos;t describe a feeling.</h2></div>
        <div className="split-copy">
          <p>A buyer may want a Frank Lloyd Wright-inspired house, a white exterior, a warm wood kitchen, Sub-Zero appliances, a
            glass refrigerated wine room, a media room, and a freestanding tub — but most of that never becomes a searchable
            MLS field.</p>
          <ul className="principle-list">
            <li><strong>Describe it once</strong><span>The agent tells Design Scout exactly what the client wants, in plain language.</span></li>
            <li><strong>We watch, not you</strong><span>New, Active, Coming Soon, and reactivated inventory is analyzed as it appears.</span></li>
            <li><strong>A match, with reasons</strong><span>When a strong match appears, the buyer gets it and the agent is copied — with why.</span></li>
          </ul>
        </div>
      </section>

      <section className="security-section" aria-labelledby="closing-title">
        <div className="security-mark" aria-hidden="true">⌂</div>
        <div>
          <div className="section-kicker">Core message</div>
          <h2 id="closing-title">Stop asking buyers to search the inventory.</h2>
          <p>Let Design Scout watch the market for them.</p>
          <Link className="button button-primary" href="/login">Start a Design Scout <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="site-footer"><span>Drake&apos;s Pricing Desk</span><span>Design Scout is a private beta &middot; © 2026 Drake&apos;s Pricing Desk</span></footer>
    </main>
  );
}
