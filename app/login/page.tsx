import Link from 'next/link';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="auth-page">
      <nav className="auth-nav" aria-label="Sign-in navigation">
        <Link className="brand" href="/">Drake&apos;s Pricing Desk</Link>
        <Link className="text-link" href="/">Back to home</Link>
      </nav>
      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-copy">
          <p className="eyebrow">Private workspace</p>
          <h1 id="login-title">Sign in to your Pricing Desk.</h1>
          <p>Access your verified workstation, reports, market evidence, and accuracy review queue.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
