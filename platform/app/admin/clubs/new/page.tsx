'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
}

export default function NewClubPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(generateSlug(value));
  }

  async function handleSubmit() {
    setError('');
    if (!name.trim() || !slug.trim() || !adminEmail.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), adminEmail: adminEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        setSaving(false);
        return;
      }
      router.push('/admin/clubs');
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div className="admin-inner">
      <div className="admin-card-header" style={{ marginBottom: 16 }}>
        <Link href="/admin/clubs" className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
          <ArrowLeft size={15} /> Clubs
        </Link>
        <h1 className="admin-page-title" style={{ margin: 0 }}>New club</h1>
      </div>

      <div className="admin-card" style={{ padding: 24, maxWidth: 480 }}>
        <div className="form-field">
          <label className="form-label" htmlFor="club-name">Club name</label>
          <input
            id="club-name" type="text" className="form-input"
            value={name} onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Pinecrest Golf Club"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="club-slug">Slug</label>
          <input
            id="club-slug" type="text" className="form-input"
            value={slug} onChange={e => { setSlug(e.target.value); setSlugEdited(true); }}
          />
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
            Public URL: sessionpro.io/clubs/{slug || '…'}
          </p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="club-admin-email">Club admin email</label>
          <input
            id="club-admin-email" type="email" className="form-input"
            value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
            placeholder="admin@pinecrestgolf.com"
          />
          <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
            They&rsquo;ll get an email invite to set a password and manage their club dashboard.
            If this email already has a SessionPro login, the club is linked to their existing account.
          </p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="button button-primary" onClick={handleSubmit} disabled={saving} style={{ minWidth: 140, marginTop: 8 }}>
          {saving ? 'Creating…' : 'Create club'}
        </button>
      </div>
    </div>
  );
}
