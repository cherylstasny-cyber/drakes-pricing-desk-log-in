import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';

type Plan = {
  key: string;
  name: string;
  monthly_price_cents: number;
  summary: string;
  features: string[];
  plan_limits: Record<string, number>;
};

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('key, name, monthly_price_cents, summary, features, plan_limits')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <main>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className="brand" href="/">Drake&apos;s <span>Pricing Desk</span></Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/design-scout">Design Scout</Link>
          <Link className="nav-signin" href="/login">Sign in <span aria-hidden="true">→</span></Link>
        </div>
      </nav>

      <section className="hero-section" aria-labelledby="pricing-title">
        <div className="eyebrow">Beta pricing</div>
        <h1 id="pricing-title"><span>Simple plans.</span><span>Two engines.</span></h1>
        <p className="hero-lede">Pricing Intelligence and Design Scout, standalone or together. Beta pricing shown below &mdash; subject to change as we measure real inference and data costs.</p>
      </section>

      <section className="section-block" aria-labelledby="plans-title">
        <div className="section-heading"><h2 id="plans-title" className="sr-only">Plans</h2></div>
        <div className="solution-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {(plans as Plan[] | null)?.map((plan) => (
            <article className="solution-card" key={plan.key}>
              <span className="card-number">
                {plan.monthly_price_cents > 0 ? `$${(plan.monthly_price_cents / 100).toFixed(0)}/mo` : 'Custom'}
              </span>
              <h3>{plan.name}</h3>
              <p>{plan.summary}</p>
              {plan.features?.length > 0 && (
                <ul className="principle-list" style={{ marginTop: '.75rem' }}>
                  {plan.features.map((f) => (
                    <li key={f}><span>{f}</span></li>
                  ))}
                </ul>
              )}
            </article>
          ))}
          {!plans?.length && (
            <p className="lede">Plan configuration hasn&apos;t loaded yet &mdash; run the Design Scout migration against your Supabase project to seed it.</p>
          )}
        </div>
      </section>

      <section className="resource-section" aria-labelledby="pricing-note-title">
        <div><div className="section-kicker">Note</div><h2 id="pricing-note-title" className="sr-only">Pricing note</h2></div>
        <p>Unlimited AI/photo analysis is intentionally not offered yet &mdash; limits above will be tuned once real inference and MLS/data costs are measured. Annual billing and brokerage/enterprise terms are configured with your account team.</p>
      </section>

      <footer className="site-footer"><span>Drake&apos;s Pricing Desk</span><span>Beta pricing &middot; © 2026 Drake&apos;s Pricing Desk</span></footer>
    </main>
  );
}
