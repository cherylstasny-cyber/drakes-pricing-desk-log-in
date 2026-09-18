import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/workstation">Drake&apos;s Pricing Desk</Link>
        <nav className="topnav" aria-label="Private workspace navigation">
          <Link href="/workstation">Workstation</Link>
          <Link className="active" href="/reports">Reports</Link>
          <Link href="/workstation/market">Market intelligence</Link>
          <Link href="/account">Account</Link>
          <Link href="/auth/signout">Sign out</Link>
        </nav>
      </header>
      <div className="workspace-layout">
        <aside className="sidebar" aria-label="Workspace sections">
          <p className="sidebar-label">Workstation</p>
          <Link href="/workstation">Overview</Link>
          <Link href="/workstation/properties">Properties</Link>
          <Link className="active" href="/reports">Reports</Link>
          <Link href="/workstation/market">Market intelligence</Link>
          <Link href="/workstation/accuracy">Accuracy review</Link>
          <p className="sidebar-label">Account</p>
          <Link href="/account/team">Team and access</Link>
          <Link href="/account/security">Security</Link>
        </aside>
        <main className="main-content">
          <div className="eyebrow">Private workspace</div>
          <h1>Report center</h1>
          <p className="lede">Listing-price and offer-price reports will appear here after a verified user adds a property and creates a report.</p>
          <section className="empty-state panel" aria-labelledby="reports-empty-title">
            <div className="empty-icon" aria-hidden="true">R</div>
            <h2 id="reports-empty-title">No private reports yet</h2>
            <p>No private records are present yet. Start with a property, then keep each report version and its evidence in this protected workspace.</p>
            <div className="action-row">
              <Link className="button primary" href="/workstation/properties/new">Add a property</Link>
              <Link className="button secondary" href="/workstation">Back to workstation</Link>
            </div>
          </section>
          <p className="privacy-note">Report data is tenant-scoped and is only available to verified members of this workspace.</p>
        </main>
      </div>
    </div>
  );
}
