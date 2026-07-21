import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRescheduleResultToPro, sendRescheduleResultToClient } from '@/lib/email';

type Params = { params: Promise<{ requestId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { requestId } = await params;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: rescheduleRequest } = await admin
    .from('reschedule_requests')
    .select('*, bookings(starts_at, ends_at, pro_id, clients(full_name, email), services(name))')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (!rescheduleRequest) {
    return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 });
  }

  const booking = rescheduleRequest.bookings as {
    starts_at: string; ends_at: string; pro_id: string;
    clients: { full_name: string; email: string };
    services: { name: string };
  };

  await admin
    .from('reschedule_requests')
    .update({ status: 'declined' })
    .eq('id', requestId);

  const { data: pro } = await admin
    .from('pros')
    .select('full_name, timezone, user_id')
    .eq('id', booking.pro_id)
    .single();
  if (!pro) return NextResponse.json({ ok: true });

  // Pro-initiated requests are declined by the client — notify the pro.
  // Client-initiated requests are declined by the pro — notify the client.
  if (rescheduleRequest.initiated_by === 'client') {
    await sendRescheduleResultToClient({
      clientEmail: booking.clients.email,
      clientName: booking.clients.full_name,
      proName: pro.full_name,
      serviceName: booking.services.name,
      requestedStartsAt: rescheduleRequest.new_starts_at,
      timezone: pro.timezone,
      accepted: false,
    });
  } else if (pro.user_id) {
    const { data: { user: proUser } } = await admin.auth.admin.getUserById(pro.user_id);
    if (proUser?.email) {
      await sendRescheduleResultToPro({
        proEmail: proUser.email,
        proName: pro.full_name,
        clientName: booking.clients.full_name,
        serviceName: booking.services.name,
        newStartsAt: rescheduleRequest.new_starts_at,
        timezone: pro.timezone,
        accepted: false,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
