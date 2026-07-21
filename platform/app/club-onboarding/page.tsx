'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ClubOnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [checking, setChecking] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInvalidLink(true);
        setChecking(false);
        return;
      }
      const { data: club } = await supabase.from('clubs').select('id, name, description').eq('user_id', user.id).single();
      if (!club) {
        setInvalidLink(true);
        setChecking(false);
        return;
      }
      setClubId(club.id);
      setName(club.name ?? '');
      setDescription(club.description ?? '');
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Club name is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);

    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      setError(passwordError.message);
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('clubs')
      .update({ name: name.trim(), description: description.trim() || null, status: 'active' })
      .eq('id', clubId);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push('/club-dashboard');
  }

  if (checking) {
    return (
      <div className="auth-shell">
        <div className="auth-card"><p>Loading…</p></div>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Link not found</h1>
          <p>This invite link is invalid or has expired. Contact SessionPro for a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Welcome to SessionPro</h1>
        <p>Set a password and confirm your club&rsquo;s details to finish setting up your dashboard.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="club-name">Club name</label>
            <input
              id="club-name" type="text" className="form-input"
              value={name} onChange={e => setName(e.target.value)} required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="club-description">Description (optional)</label>
            <textarea
              id="club-description" className="form-input form-textarea"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" className="form-input"
              placeholder="At least 8 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="new-password"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm" type="password" className="form-input"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              required autoComplete="new-password"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="button button-primary" style={{ width: '100%', marginTop: 20 }} disabled={saving}>
            {saving ? 'Setting up…' : 'Finish setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
