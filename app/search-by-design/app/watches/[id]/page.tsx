import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { findAttribute } from '../../../../../lib/search-by-design/taxonomy';
import { updateWatchStatusAction, duplicateWatchAction, runDemoMatchingAction } from '../../actions';

function label(categoryKey: string, attributeKey: string) {
  if (categoryKey === 'budget') return 'Price ceiling';
  return findAttribute(categoryKey, attributeKey)?.label ?? attributeKey;
}

export default async function WatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/search-by-design/app/watches/${id}`);

  const { data: watch } = await supabase.from('sbd_watches').select('*, sbd_clients(id, full_name, email)').eq('id', id).single();
  if (!watch) notFound();

  const { data: criteria } = await supabase
    .from('sbd_watch_criteria')
    .select('category_key, attribute_key, requirement, weight')
    .eq('watch_id', id);

  const { data: matches } = await supabase
    .from('sbd_match_results')
    .select('id, score, passed, scored_at, sbd_properties(address_line1, city, state, price)')
    .eq('watch_id', id)
    .order('scored_at', { ascending: false })
    .limit(20);

  const matchIds = (matches ?? []).map((m) => m.id);
  const { data: alerts } = matchIds.length
    ? await supabase.from('sbd_alerts').select('match_result_id, status, sent_at').in('match_result_id', matchIds)
    : { data: [] as Array<{ match_result_id: string; status: string; sent_at: string | null }> };

  const grouped: Record<string, typeof criteria> = { MUST: [], PREFER: [], AVOID: [] };
  (criteria ?? []).forEach((c) => grouped[c.requirement]?.push(c as any));

  async function runDemo() {
    'use server';
    await runDemoMatchingAction(id);
  }
  const pause = updateWatchStatusAction.bind(null, id, 'paused');
  const resume = updateWatchStatusAction.bind(null, id, 'active');
  const archive = updateWatchStatusAction.bind(null, id, 'archived');
  const duplicate = duplicateWatchAction.bind(null, id);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
        <nav className="topnav" aria-label="Primary navigation">
          <Link href="/search-by-design/app">Search by Design</Link>
          <Link className="button button-secondary" href="/auth/signout">Sign out</Link>
        </nav>
      </header>
      <div className="workspace-layout">
        <section className="workspace-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{(watch as any).sbd_clients?.full_name} &middot; <span className={`sbd-status sbd-status-${watch.status}`}>{watch.status}</span></p>
              <h1>{watch.name}</h1>
              <p className="lede">
                {watch.price_min || watch.price_max
                  ? `$${Number(watch.price_min ?? 0).toLocaleString()} - $${Number(watch.price_max ?? 0).toLocaleString()}`
                  : 'No price range set'}
                {' '}&middot; alert threshold {Number(watch.alert_threshold)}%
              </p>
            </div>
            <div className="action-row">
              {watch.status !== 'paused' && (
                <form action={pause}><button className="button button-secondary" type="submit">Pause</button></form>
              )}
              {watch.status === 'paused' && (
                <form action={resume}><button className="button button-secondary" type="submit">Resume</button></form>
              )}
              <form action={duplicate}><button className="button button-secondary" type="submit">Duplicate</button></form>
              {watch.status !== 'archived' && (
                <form action={archive}><button className="button button-secondary" type="submit">Archive</button></form>
              )}
            </div>
          </div>

          {watch.raw_preferences && (
            <section className="panel">
              <p className="eyebrow">Original description</p>
              <p>{watch.raw_preferences}</p>
            </section>
          )}

          <section className="panel">
            <p className="eyebrow">Structured criteria</p>
            {(['MUST', 'PREFER', 'AVOID'] as const).map((req) =>
              grouped[req] && grouped[req]!.length > 0 ? (
                <div key={req} className="sbd-criteria-group">
                  <h3 className={`sbd-tag sbd-tag-${req.toLowerCase()}`}>{req}</h3>
                  <ul className="sbd-criteria-list">
                    {grouped[req]!.map((c: any) => (
                      <li key={`${c.category_key}:${c.attribute_key}`}><span>{label(c.category_key, c.attribute_key)}</span></li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </section>

          <section className="panel panel-accent">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Demo / vertical slice</p>
                <h2>Run listing analysis now</h2>
              </div>
              <form action={runDemo}><button className="button button-primary" type="submit">Analyze new listings</button></form>
            </div>
            <p className="panel-footnote">
              Runs against synthetic test listings only (no live MLS feed is connected yet -- see the data-rights doc). Each property is
              analyzed once and stored, then scored against this watch.
            </p>
          </section>

          <section className="panel" aria-labelledby="matches-title">
            <div className="panel-heading"><h2 id="matches-title">Matches</h2></div>
            {(!matches || matches.length === 0) && <p className="lede">No listings analyzed yet -- run the demo above.</p>}
            {matches && matches.length > 0 && (
              <table className="sbd-match-table">
                <thead>
                  <tr><th>Property</th><th>Price</th><th>Score</th><th>Result</th><th>Alert</th></tr>
                </thead>
                <tbody>
                  {matches.map((m: any) => {
                    const alert = (alerts ?? []).find((a) => a.match_result_id === m.id);
                    return (
                      <tr key={m.id}>
                        <td>{m.sbd_properties?.address_line1}, {m.sbd_properties?.city} {m.sbd_properties?.state}</td>
                        <td>${Number(m.sbd_properties?.price ?? 0).toLocaleString()}</td>
                        <td>{m.score}%</td>
                        <td>{m.passed ? 'Passed' : 'Rejected (MUST not met)'}</td>
                        <td>{alert ? `${alert.status}${alert.sent_at ? ` @ ${new Date(alert.sent_at).toLocaleTimeString()}` : ''}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <p className="eyebrow">Drake&apos;s Pricing integration</p>
            <p className="lede">From any match, an agent can hand the property straight to Drake&apos;s Pricing for a valuation and listing/offer strategy.</p>
            <Link className="button button-secondary" href="/workstation">Run Drake&apos;s Pricing analysis (opens Pricing Desk)</Link>
          </section>
        </section>
      </div>
    </main>
  );
}
