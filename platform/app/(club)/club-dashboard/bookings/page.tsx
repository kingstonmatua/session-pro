import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function ClubBookingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: club } = await supabase.from('clubs').select('id').eq('user_id', user.id).single();
  if (!club) redirect('/dashboard');

  const { data: roster } = await supabase.from('pros').select('id').eq('club_id', club.id);
  const proIds = (roster ?? []).map((p) => p.id);

  const { data: bookings } = proIds.length > 0
    ? await supabase
        .from('bookings')
        .select('id, starts_at, status, price_cents, payment_status, created_at, pros(full_name), clients(full_name, email), services(name)')
        .in('pro_id', proIds)
        .order('starts_at', { ascending: false })
        .limit(200)
    : { data: [] };

  const total = (bookings ?? []).length;
  const totalRevenue = (bookings ?? []).filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + (b.price_cents ?? 0), 0);

  return (
    <div className="admin-inner">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <h1 className="admin-page-title">Bookings</h1>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          {total} total · {dollars(totalRevenue)} revenue
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
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {(bookings ?? []).map((b) => {
                const pro = b.pros as unknown as { full_name: string } | null;
                const client = b.clients as unknown as { full_name: string; email: string } | null;
                const service = b.services as unknown as { name: string } | null;
                const date = new Date(b.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{date}</td>
                    <td>{pro?.full_name ?? '—'}</td>
                    <td>
                      <div className="admin-table-name">{client?.full_name ?? '—'}</div>
                      <div className="admin-table-sub">{client?.email ?? ''}</div>
                    </td>
                    <td>{service?.name ?? '—'}</td>
                    <td>{dollars(b.price_cents ?? 0)}</td>
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
