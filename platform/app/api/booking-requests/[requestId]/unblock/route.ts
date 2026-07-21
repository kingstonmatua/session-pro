import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingRequestPaymentExpired } from '@/lib/email';

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { requestId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: request } = await admin
    .from('booking_requests')
    .select('*, services(name, id)')
    .eq('id', requestId)
    .eq('pro_id', pro.id)
    .eq('status', 'accepted')
    .single();

  if (!request) return NextResponse.json({ error: 'Request not found or not awaiting payment' }, { status: 404 });

  const service = request.services as { name: string; id: string };

  // Release any hold reserved for this slot so it's immediately bookable again.
  await admin
    .from('booking_holds')
    .update({ status: 'released' })
    .eq('pro_id', pro.id)
    .eq('service_id', service.id)
    .eq('starts_at', request.requested_starts_at)
    .eq('ends_at', request.requested_ends_at)
    .eq('status', 'active');

  await admin.from('booking_requests').update({ status: 'expired' }).eq('id', requestId);

  await sendBookingRequestPaymentExpired({
    clientEmail: request.client_email,
    clientName: request.client_name,
    proName: pro.full_name,
    serviceName: service.name,
    requestedStartsAt: request.requested_starts_at,
    timezone: pro.timezone,
  });

  return NextResponse.json({ ok: true });
}
