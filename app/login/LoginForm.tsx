'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    else window.location.assign('/workstation');
    setLoading(false);
  }

  async function createAccount() {
    setLoading(true);
    setMessage('');
    setError('');
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signUpError) setError(signUpError.message);
    else setMessage('Check your email to verify your account before signing in.');
    setLoading(false);
  }

  return (
    <section className="auth-panel" aria-labelledby="login-title">
      <p className="eyebrow">Private access</p>
      <h1 id="login-title">Welcome back.</h1>
      <p className="muted">Sign in to your verified Pricing Desk workstation.</p>
      <form onSubmit={signIn}>
        <label htmlFor="email">Email address</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <label htmlFor="password">Password</label>
        <div className="password-row">
          <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="current-password" />
          <button type="button" className="icon-button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
        <div className="form-actions"><a href="/forgot-password">Forgot password?</a></div>
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Working…' : 'Sign in'}</button>
        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </form>
      <button className="button button-secondary" type="button" onClick={createAccount} disabled={loading}>Create verified account</button>
    </section>
  );
}
