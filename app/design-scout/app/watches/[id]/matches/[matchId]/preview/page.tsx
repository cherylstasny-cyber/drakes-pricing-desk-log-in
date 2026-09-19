import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '../../../../../../../../lib/supabase/server';
import { findAttribute } from '../../../../../../../../lib/design-scout/taxonomy';
import { buildBuyerAlertEmail, buildAgentAlertNotice } from '../../../../../../../../lib/design-scout/notify';
import type { MatchResult } from '../../../../../../../../lib/design-scout/types';

function label(categoryKey: string, attributeKey: string) {
  if (categoryKey === 'budget') return 'Price ceiling';
  return findAttribute(categoryKey, attributeKey)?.label ?? attributeKey;
}

export default async function AlertPreviewPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id, matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/design-scout/app/watches/${id}/matches/${matchId}/preview`);

  const { data: match } = await supabase
    .from('ds_match_results')
    .select('id, score, passed, reasons, missing_preferred, ds_properties(id, address_line1, city, state, price)')
    .eq('id', matchId)
    .eq('watch_id', id)
    .single();
  if (!match) notFound();

  const { data: watch } = await supabase.from('ds_watches').select('id, name, ds_clients(id, full_name, email)').eq('id', id).single();
  if (!watch) notFound();

  const client = (watch as any).ds_clients;
  const property = (match as any).ds_properties;

  const result: MatchResult = {
    propertyId: property.id,
    watchId: id,
    score: match.score,
    passed: match.passed,
    mustFailures: [],
    avoidMatches: [],
    reasons: (match.reasons ?? []) as MatchResult['reasons'],
    missingPreferred: (match.missing_preferred ?? []) as MatchResult['missingPreferred'],
    scoredAt: new Date().toISOString(),
  };

  const buyerEmail = buildBuyerAlertEmail(
    result,
    { id: property.id, addressLine1: property.address_line1, city: property.city, state: property.state, price: property.price },
    { id: client.id, fullName: client.full_name, email: client.email },
    { id: 'agent', fullName: user.email ?? 'Your agent', email: user.email ?? 'agent@example.com', brandName: "Drake's Pricing" },
    `/design-scout/app/watches/${id}?property=${property.id}`
  );
  const agentNotice = buildAgentAlertNotice(
    result,
    { id: property.id, addressLine1: property.address_line1, city: property.city, state: property.state, price: property.price },
    { id: client.id, fullName: client.full_name, email: client.email }
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
        <nav className="topnav" aria-label="Primary navigation">
          <Link href={`/design-scout/app/watches/${id}`}>Back to watch</Link>
          <Link className="button button-secondary" href="/auth/signout">Sign out</Link>
        </nav>
      </header>
      <div className="workspace-layout">
        <section className="workspace-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Alert preview &middot; {watch.name}</p>
              <h1>What {client.full_name} would see</h1>
              <p className="lede">This is a preview only -- nothing is sent from this screen.</p>
            </div>
          </div>

          <section className="panel" aria-labelledby="buyer-email-title">
            <p className="eyebrow">Buyer email</p>
            <h2 id="buyer-email-title" style={{ margin: '0 0 1rem' }}>{buyerEmail.subject}</h2>
            <p className="panel-footnote" style={{ margin: '0 0 1rem' }}>To: {buyerEmail.to}</p>

            <div className="ds-video-placeholder" style={{ aspectRatio: '16/10', maxWidth: 480, marginBottom: '1rem' }} role="img" aria-label={`Photo of ${buyerEmail.property.addressLine1}`}>
              <span className="ds-video-play" aria-hidden="true">⌂</span>
              <p>{buyerEmail.property.addressLine1}</p>
              <span>{buyerEmail.property.city}, {buyerEmail.property.state} &middot; ${Number(buyerEmail.property.price).toLocaleString()}</span>
            </div>

            <p><strong>{buyerEmail.matchPercent}% match.</strong> {buyerEmail.whySelected}</p>

            {buyerEmail.topMatchingTraits.length > 0 && (
              <>
                <p className="eyebrow" style={{ marginTop: '1rem' }}>Top matching characteristics</p>
                <ul className="principle-list">
                  {buyerEmail.topMatchingTraits.map((t) => <li key={t}><span>{t}</span></li>)}
                </ul>
              </>
            )}

            {buyerEmail.missingPreferredTraits.length > 0 && (
              <>
                <p className="eyebrow" style={{ marginTop: '1rem' }}>Worth knowing</p>
                <ul className="principle-list">
                  {buyerEmail.missingPreferredTraits.map((t) => <li key={t}><span>Missing: {t}</span></li>)}
                </ul>
              </>
            )}

            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <span className="button button-primary" aria-hidden="true">Request a Showing <span aria-hidden="true">→</span></span>
            </div>
            <p className="panel-footnote">Sent as {buyerEmail.agent.brandName}, from {buyerEmail.agent.fullName}.</p>
          </section>

          <section className="panel">
            <p className="eyebrow">Agent copy</p>
            <p>{agentNotice.subject}</p>
            <p className="lede">{agentNotice.body}</p>
          </section>
        </section>
      </div>
    </main>
  );
}
