import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req: Request) {
  if (!checkRateLimit(getIP(req), 5, 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { bookingId, rating, quote, reviewerName } = body as {
    bookingId?: string;
    rating?: number;
    quote?: string;
    reviewerName?: string;
  };

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, pro_id, status')
    .eq('id', bookingId)
    .eq('status', 'confirmed')
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Prevent duplicate reviews
  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', bookingId);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Review already submitted' }, { status: 409 });
  }

  const { error } = await supabase.from('reviews').insert({
    pro_id: booking.pro_id,
    booking_id: bookingId,
    rating,
    quote: quote?.trim() || null,
    reviewer_name: reviewerName?.trim() || null,
    is_published: false,
  });

  if (error) {
    console.error('[reviews] insert failed:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
