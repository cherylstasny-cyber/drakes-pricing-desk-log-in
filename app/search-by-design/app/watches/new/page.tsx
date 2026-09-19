import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import WatchForm from './WatchForm';

export default async function NewWatchPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/search-by-design/app/watches/new');

  const { clientId } = await searchParams;
  if (!clientId) redirect('/search-by-design/app/clients/new');

  const { data: client } = await supabase.from('sbd_clients').select('id, full_name').eq('id', clientId).single();
  if (!client) redirect('/search-by-design/app/clients/new');

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
              <p className="eyebrow">Search by Design &middot; {client.full_name}</p>
              <h1>Describe the home {client.full_name.split(' ')[0]} is waiting for.</h1>
              <p className="lede">Type it naturally, add attributes manually, or both. You&apos;ll confirm the interpretation before it goes live.</p>
            </div>
          </div>
          <WatchForm clientId={client.id} clientName={client.full_name} />
        </section>
      </div>
    </main>
  );
}
