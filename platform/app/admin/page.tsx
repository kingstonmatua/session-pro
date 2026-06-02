import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const db = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: activePros },
    { count: draftPros },
    { count: pendingReviews },
    { count: newProsThisMonth },
    { data: allBookings },
    { data: recentBookings },
  ] = await Promise.all([
    db.from('pros').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('pros').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('reviews').select('id', { count: 'exact', head: true }).eq('is_published', false),
    db.from('pros').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    db.from('bookings').select('platform_fee_cents, pro_payout_cents, status, created_at').in('status', ['confirmed', 'completed']),
    db.from('bookings')
      .select('id, starts_at, status, price_cents, platform_fee_cents, pro_payout_cents, pros(full_name, slug), clients(full_name), services(name)')
      .in('status', ['confirmed', 'completed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const totalRevenue = (allBookings ?? []).reduce((s, b) => s + (b.platform_fee_cents ?? 0), 0);
  const totalBookings = (allBookings ?? []).length;

  const thisMonthBookings = (allBookings ?? []).filter(b => b.created_at >= monthStart);
  const revenueThisMonth = thisMonthBookings.reduce((s, b) => s + (b.platform_fee_cents ?? 0), 0);

  return (
    <div className="admin-inner">
      <h1 className="admin-page-title">Overview</h1>

      <div className="admin-kpi-grid">
        <div className="admin-kpi">
          <span className="admin-kpi-label">Platform Revenue</span>
          <span className="admin-kpi-value admin-kpi-value--green">{dollars(totalRevenue)}</span>
          <span className="admin-kpi-sub">{dollars(revenueThisMonth)} this month</span>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-label">Total Bookings</span>
          <span className="admin-kpi-value">{totalBookings}</span>
          <span className="admin-kpi-sub">{thisMonthBookings.length} this month</span>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-label">Active Pros</span>
          <span className="admin-kpi-value">{activePros ?? 0}</span>
          <span className="admin-kpi-sub">{draftPros ?? 0} in draft · {newProsThisMonth ?? 0} new this month</span>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-label">Pending Reviews</span>
          <span className="admin-kpi-value">{pendingReviews ?? 0}</span>
          <span className="admin-kpi-sub">
            {(pendingReviews ?? 0) > 0
              ? <Link href="/admin/reviews" style={{ color: 'var(--green)', fontWeight: 600 }}>Review now →</Link>
              : 'All caught up'}
          </span>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <span className="admin-card-title">Recent Bookings</span>
          <Link href="/admin/bookings" className="admin-table-link">View all →</Link>
        </div>
        {(recentBookings ?? []).length === 0 ? (
          <p className="admin-empty">No bookings yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pro</th>
                <th>Client</th>
                <th>Session</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(recentBookings ?? []).map((b) => {
                const pro = b.pros as unknown as { full_name: string; slug: string } | null;
                const client = b.clients as unknown as { full_name: string } | null;
                const service = b.services as unknown as { name: string } | null;
                const date = new Date(b.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="admin-table-name">{pro?.full_name ?? '—'}</div>
                      {pro?.slug && <a href={`/${pro.slug}`} target="_blank" className="admin-table-link">{pro.slug}</a>}
                    </td>
                    <td>{client?.full_name ?? '—'}</td>
                    <td>{service?.name ?? '—'}</td>
                    <td>{date}</td>
                    <td>{dollars(b.price_cents ?? 0)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{dollars(b.platform_fee_cents ?? 0)}</td>
                    <td><span className={`admin-status admin-badge-${b.status}`}>{b.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
