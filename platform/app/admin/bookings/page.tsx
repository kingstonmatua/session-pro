import { createAdminClient } from '@/lib/supabase/admin';

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function AdminBookingsPage() {
  const db = createAdminClient();

  const { data: bookings } = await db
    .from('bookings')
    .select('id, starts_at, status, price_cents, platform_fee_cents, pro_payout_cents, payment_status, created_at, pros(full_name, slug), clients(full_name, email), services(name)')
    .order('created_at', { ascending: false })
    .limit(200);

  const total = (bookings ?? []).length;
  const totalGMV = (bookings ?? []).filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + (b.price_cents ?? 0), 0);
  const totalFees = (bookings ?? []).filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + (b.platform_fee_cents ?? 0), 0);

  return (
    <div className="admin-inner">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h1 className="admin-page-title">Bookings</h1>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {total} total · {dollars(totalGMV)} GMV · {dollars(totalFees)} platform fees
        </span>
      </div>

      <div className="admin-card">
        {(bookings ?? []).length === 0 ? (
          <p className="admin-empty">No bookings yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Pro</th>
                <th>Client</th>
                <th>Session</th>
                <th>Amount</th>
                <th>Payout</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {(bookings ?? []).map((b) => {
                const pro = b.pros as unknown as { full_name: string; slug: string } | null;
                const client = b.clients as unknown as { full_name: string; email: string } | null;
                const service = b.services as unknown as { name: string } | null;
                const date = new Date(b.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{date}</td>
                    <td>
                      <div className="admin-table-name">{pro?.full_name ?? '—'}</div>
                      {pro?.slug && <a href={`/${pro.slug}`} target="_blank" className="admin-table-link">/{pro.slug}</a>}
                    </td>
                    <td>
                      <div className="admin-table-name">{client?.full_name ?? '—'}</div>
                      <div className="admin-table-sub">{client?.email ?? ''}</div>
                    </td>
                    <td>{service?.name ?? '—'}</td>
                    <td>{dollars(b.price_cents ?? 0)}</td>
                    <td>{dollars(b.pro_payout_cents ?? 0)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{dollars(b.platform_fee_cents ?? 0)}</td>
                    <td><span className={`admin-status admin-badge-${b.status}`}>{b.status}</span></td>
                    <td><span className="admin-table-sub">{b.payment_status}</span></td>
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
