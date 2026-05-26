import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PublishToggle } from './PublishToggle';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={16}
          fill={n <= rating ? 'var(--amber)' : 'none'}
          color={n <= rating ? 'var(--amber)' : 'var(--border)'}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ReviewsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, rating_average')
    .eq('user_id', user.id)
    .single();

  if (!pro) redirect('/onboarding');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, clients(full_name, email)')
    .eq('pro_id', pro.id)
    .order('created_at', { ascending: false });

  const all = reviews ?? [];
  const published = all.filter(r => r.is_published);
  const avgRating = pro.rating_average
    ? Number(pro.rating_average).toFixed(1)
    : null;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">

        <div className="edit-page-header">
          <Link href="/dashboard" className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1>Reviews</h1>
        </div>

        {/* Stats */}
        <div className="bookings-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
          <div className="bookings-stat">
            <Star size={20} color="var(--amber)" />
            <strong>{avgRating ?? '—'}</strong>
            <span>Average rating</span>
          </div>
          <div className="bookings-stat">
            <Star size={20} color="var(--amber)" />
            <strong>{all.length}</strong>
            <span>Total reviews</span>
          </div>
          <div className="bookings-stat">
            <Star size={20} color="var(--green)" />
            <strong>{published.length}</strong>
            <span>Published on profile</span>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>All reviews</h3>

          {all.length === 0 ? (
            <div className="bookings-empty">
              <p>No reviews yet.</p>
              <p>Reviews will appear here once clients submit them after their session.</p>
            </div>
          ) : (
            <div className="reviews-list">
              {all.map(review => (
                <div key={review.id} className="review-row">
                  <div className="review-row-top">
                    <StarRating rating={review.rating} />
                    <span className="review-date">{formatDate(review.created_at)}</span>
                  </div>

                  {review.quote && (
                    <p className="review-quote">&ldquo;{review.quote}&rdquo;</p>
                  )}

                  <div className="review-row-bottom">
                    <span className="review-reviewer">
                      {review.reviewer_name ?? review.clients?.full_name ?? 'Anonymous'}
                      {review.clients?.email && (
                        <span className="review-email"> · {review.clients.email}</span>
                      )}
                    </span>
                    <PublishToggle
                      reviewId={review.id}
                      isPublished={review.is_published}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
