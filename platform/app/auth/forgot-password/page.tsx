'use client';

import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Reset your password</h1>

        {sent ? (
          <>
            <p>Check your email — we sent a password reset link to <strong>{email}</strong>.</p>
            <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-soft)' }}>
              Didn&rsquo;t receive it? Check your spam folder or{' '}
              <button
                onClick={() => setSent(false)}
                style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: 0, fontSize: 14 }}
              >
                try again
              </button>.
            </p>
          </>
        ) : (
          <>
            <p>Enter your email and we&rsquo;ll send you a reset link.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <button
                type="submit"
                className="button button-primary"
                style={{ width: '100%', marginTop: 20 }}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="auth-footer">
          <Link href="/auth/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
