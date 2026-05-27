import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingRequestDeclined } from '@/lib/email';

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { requestId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone, slug')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: request } = await admin
    .from('booking_requests')
    .select('*, services(name)')
    .eq('id', requestId)
    .eq('pro_id', pro.id)
    .eq('status', 'pending')
    .single();

  if (!request) return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 });

  await admin.from('booking_requests').update({ status: 'declined' }).eq('id', requestId);

  const service = request.services as { name: string };
  await sendBookingRequestDeclined({
    clientEmail: request.client_email,
    clientName: request.client_name,
    proName: pro.full_name,
    serviceName: service.name,
    requestedStartsAt: request.requested_starts_at,
    timezone: pro.timezone,
  });

  return NextResponse.json({ ok: true });
}
