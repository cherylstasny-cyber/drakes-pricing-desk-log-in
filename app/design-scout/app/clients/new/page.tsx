import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { createClientAction } from '../../actions';

export default async function NewClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/design-scout/app/clients/new');

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
        <nav className="topnav" aria-label="Primary navigation">
          <Link href="/design-scout/app">Design Scout</Link>
          <Link className="button button-secondary" href="/auth/signout">Sign out</Link>
        </nav>
      </header>
      <div className="workspace-layout">
        <section className="workspace-main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Design Scout</p>
              <h1>Add a client</h1>
              <p className="lede">Then describe the home they&apos;re waiting for.</p>
            </div>
          </div>
          <section className="panel" style={{ maxWidth: 520 }}>
            <form action={createClientAction}>
              <label htmlFor="fullName">Client name</label>
              <input id="fullName" name="fullName" required placeholder="Susan Smith" />
              <label htmlFor="email">Client email</label>
              <input id="email" name="email" type="email" required placeholder="susan@example.com" />
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" placeholder="(555) 555-5555" />
              <div className="form-actions">
                <button className="button button-primary" type="submit">Continue to Design Scout setup</button>
                <Link className="text-link" href="/design-scout/app">Cancel</Link>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
