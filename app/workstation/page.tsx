import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function WorkstationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
        <nav className="topnav" aria-label="Primary navigation">
          <Link href="/workstation">Workstation</Link>
          <Link href="/reports">Reports</Link>
          <Link href="/workstation/market">Market intelligence</Link>
          <Link href="/account">Account</Link>
          <Link className="button button-secondary" href="/auth/signout">Sign out</Link>
        </nav>
      </header>

      <div className="workspace-layout">
        <aside className="sidebar" aria-label="Workstation navigation">
          <div className="sidebar-section">
            <p className="eyebrow">Workstation</p>
            <nav className="side-nav">
              <Link className="active" href="/workstation">Overview</Link>
              <Link href="/workstation/properties">Properties</Link>
              <Link href="/reports">Reports</Link>
              <Link href="/workstation/market">Market intelligence</Link>
              <Link href="/workstation/accuracy">Accuracy review</Link>
            </nav>
          </div>
          <div className="sidebar-section">
            <p className="eyebrow">Account</p>
            <nav className="side-nav">
              <Link href="/account/team">Team and access</Link>
              <Link href="/account/security">Security</Link>
            </nav>
          </div>
          <div className="sidebar-note">
            <span className="status-dot" aria-hidden="true" />
            <span>Private workspace</span>
          </div>
        </aside>

        <section className="workspace-main" aria-labelledby="workstation-title">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Private workstation</p>
              <h1 id="workstation-title">Good morning. Let&apos;s price with evidence.</h1>
              <p className="lede">Your secure pricing workspace is ready for its first property and report.</p>
            </div>
            <div className="user-chip" aria-label={`Signed in as ${user.email ?? 'verified user'}`}>
              <span className="avatar" aria-hidden="true">{(user.email?.[0] ?? 'U').toUpperCase()}</span>
              <span>{user.email}</span>
            </div>
          </div>

          <section className="status-grid" aria-label="Workspace status">
            <article className="status-card"><p>Open properties</p><strong>0</strong><span>No private records loaded</span></article>
            <article className="status-card"><p>Draft reports</p><strong>0</strong><span>Start from a property workspace</span></article>
            <article className="status-card"><p>Accuracy reviews</p><strong className="status-copy">Ready</strong><span>When outcomes arrive</span></article>
            <article className="status-card"><p>Workspace status</p><strong className="status-copy">Protected</strong><span>Verified session active</span></article>
          </section>

          <div className="content-grid">
            <section className="panel" aria-labelledby="recent-work-title">
              <div className="panel-heading"><div><p className="eyebrow">Workspace activity</p><h2 id="recent-work-title">Recent work</h2></div><Link className="text-link" href="/reports">View reports</Link></div>
              <div className="empty-state">
                <div className="empty-icon" aria-hidden="true">↗</div>
                <h3>No private records yet</h3>
                <p>Properties, report versions, and evidence will appear here after you add them to this protected workspace.</p>
                <Link className="button button-primary" href="/workstation/properties/new">Add a property</Link>
              </div>
            </section>
            <section className="panel panel-accent" aria-labelledby="next-action-title">
              <p className="eyebrow">Suggested next step</p>
              <h2 id="next-action-title">Create your first property workspace</h2>
              <p>Keep the subject property, comparable evidence, assumptions, and reviewer notes together from the start.</p>
              <Link className="button button-primary" href="/workstation/properties/new">Start a property</Link>
              <p className="panel-footnote">Nothing is shared outside your workspace unless you explicitly export or invite someone.</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
