import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getOrCreateWorkspaceId } from '../../../lib/workspace';
import { hasProductAccess } from '../../../lib/products';
import { enableSearchByDesignBeta } from './actions';

export default async function SearchByDesignDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/search-by-design/app');

  const workspaceId = await getOrCreateWorkspaceId(supabase, user.id, user.email ?? 'agent');
  const enabled = await hasProductAccess(supabase, workspaceId, 'search_by_design');

  if (!enabled) {
    return (
      <main className="app-shell">
        <header className="topbar">
          <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
          <nav className="topnav" aria-label="Primary navigation">
            <Link href="/workstation">Pricing Desk</Link>
            <Link className="button button-secondary" href="/auth/signout">Sign out</Link>
          </nav>
        </header>
        <div className="workspace-layout">
          <section className="workspace-main">
            <div className="panel" style={{ maxWidth: 560, margin: '3rem auto', textAlign: 'center' }}>
              <div className="empty-icon" aria-hidden="true" style={{ margin: '0 auto 1rem' }}>SD</div>
              <h1>Search by Design isn&apos;t enabled for your workspace yet</h1>
              <p className="lede">This beta product line isn&apos;t billed yet -- an admin (or you, for now) can turn it on manually.</p>
              <form action={enableSearchByDesignBeta}>
                <button className="button button-primary" type="submit">Enable Search by Design (beta)</button>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { data: watches } = await supabase
    .from('sbd_watches')
    .select('id, name, status, price_min, price_max, last_alert_at, updated_at, sbd_clients(full_name)')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  const watchIds = (watches ?? []).map((w) => w.id);
  const { data: criteriaRows } = watchIds.length
    ? await supabase.from('sbd_watch_criteria').select('watch_id, requirement').in('watch_id', watchIds)
    : { data: [] as Array<{ watch_id: string; requirement: string }> };
  const { data: matchRows } = watchIds.length
    ? await supabase.from('sbd_match_results').select('watch_id, passed').in('watch_id', watchIds)
    : { data: [] as Array<{ watch_id: string; passed: boolean }> };

  const requirementCounts = (watchIds: string) => {
    const rows = (criteriaRows ?? []).filter((c) => c.watch_id === watchIds);
    return {
      must: rows.filter((r) => r.requirement === 'MUST').length,
      prefer: rows.filter((r) => r.requirement === 'PREFER').length,
      avoid: rows.filter((r) => r.requirement === 'AVOID').length,
    };
  };
  const matchesThisPass = (watchId: string) => (matchRows ?? []).filter((m) => m.watch_id === watchId && m.passed).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
        <nav className="topnav" aria-label="Primary navigation">
          <Link href="/workstation">Pricing Desk</Link>
          <Link className="active" href="/search-by-design/app">Search by Design</Link>
          <Link className="button button-secondary" href="/auth/signout">Sign out</Link>
        </nav>
      </header>
      <div className="workspace-layout">
        <section className="workspace-main" aria-labelledby="sbd-dashboard-title">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Search by Design</p>
              <h1 id="sbd-dashboard-title">Agent dashboard</h1>
              <p className="lede">Describe what a client is waiting for, and let Search by Design watch new inventory for it.</p>
            </div>
            <Link className="button button-primary" href="/search-by-design/app/clients/new">+ New client &amp; watch</Link>
          </div>

          {(!watches || watches.length === 0) && (
            <section className="panel empty-state" aria-labelledby="sbd-empty-title">
              <div className="empty-icon" aria-hidden="true">SD</div>
              <h2 id="sbd-empty-title">No Search by Design watches yet</h2>
              <p>Create a client, describe the home they&apos;re waiting for, and Search by Design will watch new listings for a match.</p>
              <Link className="button button-primary" href="/search-by-design/app/clients/new">Add your first client</Link>
            </section>
          )}

          {watches && watches.length > 0 && (
            <div className="sbd-watch-list">
              {watches.map((w: any) => {
                const counts = requirementCounts(w.id);
                return (
                  <article className="panel" key={w.id}>
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">{w.sbd_clients?.full_name ?? 'Unknown client'}</p>
                        <h2>{w.name}</h2>
                      </div>
                      <span className={`sbd-status sbd-status-${w.status}`}>{w.status}</span>
                    </div>
                    <p className="panel-footnote">
                      {w.price_min || w.price_max
                        ? `$${Number(w.price_min ?? 0).toLocaleString()} - $${Number(w.price_max ?? 0).toLocaleString()}`
                        : 'No price range set'}
                    </p>
                    <div className="sbd-tag-row">
                      <span className="sbd-tag sbd-tag-must">{counts.must} must</span>
                      <span className="sbd-tag sbd-tag-prefer">{counts.prefer} prefer</span>
                      <span className="sbd-tag sbd-tag-avoid">{counts.avoid} avoid</span>
                    </div>
                    <p className="panel-footnote">
                      {matchesThisPass(w.id)} passing match(es) so far &middot; last alert {w.last_alert_at ? new Date(w.last_alert_at).toLocaleString() : 'none yet'}
                    </p>
                    <div className="action-row">
                      <Link className="button button-secondary" href={`/search-by-design/app/watches/${w.id}`}>Open watch</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
