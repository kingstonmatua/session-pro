import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentLinkToClient } from '@/lib/email';
import { createBookingRequestCheckout } from '@/lib/bookingRequestCheckout';

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { requestId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone, slug, stripe_connect_account_id')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: request } = await admin
    .from('booking_requests')
    .select('*, services(*)')
    .eq('id', requestId)
    .eq('pro_id', pro.id)
    .eq('status', 'accepted')
    .single();

  if (!request) return NextResponse.json({ error: 'Request not found or not awaiting payment' }, { status: 404 });

  const service = request.services as {
    id: string; name: string; price_cents: number; duration_minutes: number;
    buffer_minutes: number; currency: string;
  };

  const startsAt = request.requested_starts_at;
  const endsAt = request.requested_ends_at;

  // Release any stale hold from the original (now-expired) link so it doesn't
  // conflict with itself when we reserve a fresh one below.
  await admin
    .from('booking_holds')
    .update({ status: 'released' })
    .eq('pro_id', pro.id)
    .eq('service_id', service.id)
    .eq('starts_at', startsAt)
    .eq('ends_at', endsAt)
    .eq('status', 'active');

  const result = await createBookingRequestCheckout({
    admin,
    pro,
    service,
    requestId,
    startsAt,
    endsAt,
    clientEmail: request.client_email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await admin
    .from('booking_requests')
    .update({ payment_expires_at: result.paymentExpiresAt, stripe_checkout_session_id: result.checkoutSessionId })
    .eq('id', requestId);

  await sendPaymentLinkToClient({
    clientEmail: request.client_email,
    clientName: request.client_name,
    proName: pro.full_name,
    serviceName: service.name,
    requestedStartsAt: startsAt,
    timezone: pro.timezone,
    location: null,
    paymentUrl: result.checkoutUrl,
    paymentExpiresAt: result.paymentExpiresAt,
  });

  return NextResponse.json({ ok: true, paymentUrl: result.checkoutUrl });
}
