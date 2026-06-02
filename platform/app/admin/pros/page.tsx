import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function AdminProsPage() {
  const db = createAdminClient();

  const [{ data: pros }, { data: bookings }] = await Promise.all([
    db.from('pros').select('id, full_name, slug, discipline, location_city, location_region, status, rating_average, rating_count, stripe_connect_account_id, created_at').order('created_at', { ascending: false }),
    db.from('bookings').select('pro_id, platform_fee_cents, pro_payout_cents, status').in('status', ['confirmed', 'completed']),
  ]);

  // Aggregate booking stats per pro
  const statsMap = new Map<string, { bookingCount: number; totalFees: number; totalPayout: number }>();
  for (const b of bookings ?? []) {
    const existing = statsMap.get(b.pro_id) ?? { bookingCount: 0, totalFees: 0, totalPayout: 0 };
    statsMap.set(b.pro_id, {
      bookingCount: existing.bookingCount + 1,
      totalFees: existing.totalFees + (b.platform_fee_cents ?? 0),
      totalPayout: existing.totalPayout + (b.pro_payout_cents ?? 0),
    });
  }

  const STATUS_ORDER: Record<string, number> = { active: 0, draft: 1, paused: 2, archived: 3 };
  const sorted = [...(pros ?? [])].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  return (
    <div className="admin-inner">
      <h1 className="admin-page-title">Pros ({pros?.length ?? 0})</h1>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pro</th>
              <th>Discipline</th>
              <th>Location</th>
              <th>Status</th>
              <th>Bookings</th>
              <th>Pro Payout</th>
              <th>Platform Fee</th>
              <th>Rating</th>
              <th>Stripe</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pro) => {
              const stats = statsMap.get(pro.id) ?? { bookingCount: 0, totalFees: 0, totalPayout: 0 };
              const joined = new Date(pro.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const location = [pro.location_city, pro.location_region].filter(Boolean).join(', ') || '—';
              return (
                <tr key={pro.id}>
                  <td>
                    <div className="admin-table-name">{pro.full_name}</div>
                    <a href={`/${pro.slug}`} target="_blank" className="admin-table-link">/{pro.slug}</a>
                  </td>
                  <td>{pro.discipline ?? '—'}</td>
                  <td>{location}</td>
                  <td><span className={`admin-status admin-badge-${pro.status}`}>{pro.status}</span></td>
                  <td>{stats.bookingCount}</td>
                  <td>{stats.totalPayout > 0 ? dollars(stats.totalPayout) : '—'}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{stats.totalFees > 0 ? dollars(stats.totalFees) : '—'}</td>
                  <td>{pro.rating_count > 0 ? `${pro.rating_average} ★ (${pro.rating_count})` : '—'}</td>
                  <td>
                    {pro.stripe_connect_account_id
                      ? <span className="admin-status admin-badge-active">Connected</span>
                      : <span className="admin-status admin-badge-draft">Not set up</span>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{joined}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(pros ?? []).length === 0 && <p className="admin-empty">No pros yet.</p>}
      </div>
    </div>
  );
}
