import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminClubsPage() {
  const db = createAdminClient();

  const [{ data: clubs }, { data: pros }] = await Promise.all([
    db.from('clubs').select('id, name, slug, status, stripe_connect_account_id, created_at').order('created_at', { ascending: false }),
    db.from('pros').select('id, club_id').not('club_id', 'is', null),
  ]);

  const rosterCounts = new Map<string, number>();
  for (const p of pros ?? []) {
    rosterCounts.set(p.club_id as string, (rosterCounts.get(p.club_id as string) ?? 0) + 1);
  }

  return (
    <div className="admin-inner">
      <div className="admin-card-header" style={{ marginBottom: 16 }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Clubs ({clubs?.length ?? 0})</h1>
        <Link href="/admin/clubs/new" className="button button-primary" style={{ minHeight: 38, padding: '0 16px' }}>
          New club
        </Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>Status</th>
              <th>Roster</th>
              <th>Stripe</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(clubs ?? []).map((club) => {
              const created = new Date(club.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <tr key={club.id}>
                  <td>
                    <div className="admin-table-name">{club.name}</div>
                    <a href={`/clubs/${club.slug}`} target="_blank" className="admin-table-link">/clubs/{club.slug}</a>
                  </td>
                  <td><span className={`admin-status admin-badge-${club.status}`}>{club.status}</span></td>
                  <td>{rosterCounts.get(club.id) ?? 0} pros</td>
                  <td>
                    {club.stripe_connect_account_id
                      ? <span className="admin-status admin-badge-active">Connected</span>
                      : <span className="admin-status admin-badge-draft">Not set up</span>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{created}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(clubs ?? []).length === 0 && <p className="admin-empty">No clubs yet.</p>}
      </div>
    </div>
  );
}
