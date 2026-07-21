'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserMinus } from 'lucide-react';

type RosterPro = { id: string; full_name: string; slug: string; discipline: string; status: string };

type Props = { pros: RosterPro[] };

export function RosterManager({ pros }: Props) {
  const router = useRouter();
  const [linkEmail, setLinkEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [linkState, setLinkState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [inviteState, setInviteState] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle');
  const [linkError, setLinkError] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleLinkExisting() {
    if (!linkEmail.trim()) return;
    setLinkState('saving');
    setLinkError('');
    const res = await fetch('/api/club-dashboard/roster/link-existing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: linkEmail.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLinkError(body.error ?? 'Something went wrong.');
      setLinkState('error');
      return;
    }
    setLinkEmail('');
    setLinkState('idle');
    router.refresh();
  }

  async function handleInviteNew() {
    if (!inviteEmail.trim()) return;
    setInviteState('saving');
    setInviteError('');
    const res = await fetch('/api/club-dashboard/roster/invite-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteError(body.error ?? 'Something went wrong.');
      setInviteState('error');
      return;
    }
    setInviteEmail('');
    setInviteState('sent');
    setTimeout(() => setInviteState('idle'), 4000);
  }

  async function handleRemove(proId: string) {
    setRemovingId(proId);
    const res = await fetch('/api/club-dashboard/roster/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proId }),
    });
    if (res.ok) {
      router.refresh();
    }
    setRemovingId(null);
  }

  return (
    <>
      <div className="admin-kpi-grid" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Link an existing pro</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -4, marginBottom: 12 }}>
            For a pro who already has a SessionPro account.
          </p>
          <div className="form-field">
            <input
              type="email" className="form-input" placeholder="pro@email.com"
              value={linkEmail} onChange={e => setLinkEmail(e.target.value)}
            />
          </div>
          {linkState === 'error' && <div className="form-error">{linkError}</div>}
          <button className="button button-primary" onClick={handleLinkExisting} disabled={linkState === 'saving'}>
            {linkState === 'saving' ? <Loader2 size={14} className="slots-spinner" /> : null} Add to roster
          </button>
        </div>

        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Invite a new pro</h3>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -4, marginBottom: 12 }}>
            For someone who doesn&rsquo;t have a SessionPro account yet — they&rsquo;ll get a signup link.
          </p>
          <div className="form-field">
            <input
              type="email" className="form-input" placeholder="newpro@email.com"
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            />
          </div>
          {inviteState === 'error' && <div className="form-error">{inviteError}</div>}
          {inviteState === 'sent' && <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 8 }}>Invite sent!</p>}
          <button className="button button-primary" onClick={handleInviteNew} disabled={inviteState === 'saving'}>
            {inviteState === 'saving' ? <Loader2 size={14} className="slots-spinner" /> : null} Send invite
          </button>
        </div>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pro</th>
              <th>Discipline</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pros.map((pro) => (
              <tr key={pro.id}>
                <td>
                  <div className="admin-table-name">{pro.full_name}</div>
                  <a href={`/${pro.slug}`} target="_blank" className="admin-table-link">/{pro.slug}</a>
                </td>
                <td>{pro.discipline ?? '—'}</td>
                <td><span className={`admin-status admin-badge-${pro.status}`}>{pro.status}</span></td>
                <td>
                  <button
                    className="button"
                    style={{ fontSize: 13, minHeight: 32, padding: '0 12px' }}
                    onClick={() => handleRemove(pro.id)}
                    disabled={removingId === pro.id}
                  >
                    {removingId === pro.id ? <Loader2 size={13} className="slots-spinner" /> : <UserMinus size={13} />} Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pros.length === 0 && <p className="admin-empty">No pros on your roster yet.</p>}
      </div>
    </>
  );
}
