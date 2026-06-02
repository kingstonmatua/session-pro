import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewActions } from './ReviewActions';

export default async function AdminReviewsPage() {
  const db = createAdminClient();

  const { data: reviews } = await db
    .from('reviews')
    .select('id, rating, quote, reviewer_name, created_at, pros(full_name, slug), bookings(starts_at)')
    .eq('is_published', false)
    .order('created_at', { ascending: false });

  return (
    <div className="admin-inner">
      <h1 className="admin-page-title">Pending Reviews ({reviews?.length ?? 0})</h1>

      <div className="admin-card">
        {(reviews ?? []).length === 0 ? (
          <p className="admin-empty">No pending reviews — all caught up.</p>
        ) : (
          (reviews ?? []).map((r) => {
            const pro = r.pros as unknown as { full_name: string; slug: string } | null;
            const booking = r.bookings as unknown as { starts_at: string } | null;
            const sessionDate = booking?.starts_at
              ? new Date(booking.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null;
            const submitted = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div key={r.id} className="admin-review-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span className="admin-review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.reviewer_name ?? 'Anonymous'}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>→</span>
                    {pro && <a href={`/${pro.slug}`} target="_blank" className="admin-table-link">{pro.full_name}</a>}
                  </div>
                  {r.quote && <p className="admin-review-quote">&ldquo;{r.quote}&rdquo;</p>}
                  <div className="admin-review-meta">
                    Submitted {submitted}{sessionDate ? ` · Session on ${sessionDate}` : ''}
                  </div>
                </div>
                <ReviewActions reviewId={r.id} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
