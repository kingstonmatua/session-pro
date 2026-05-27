import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRescheduleRequestToClient } from '@/lib/email';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone, slug')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { bookingId, newStartsAt, newEndsAt } = (body ?? {}) as {
    bookingId?: string; newStartsAt?: string; newEndsAt?: string;
  };

  if (!bookingId || !newStartsAt || !newEndsAt) {
    return NextResponse.json({ error: 'bookingId, newStartsAt, and newEndsAt are required' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, clients(full_name, email), services(name)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .in('status', ['confirmed', 'pending_payment'])
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  // Conflict check on new time (excluding this booking)
  const [{ count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .neq('id', bookingId)
      .in('status', ['pending_payment', 'confirmed'])
      .lt('starts_at', newEndsAt)
      .gt('ends_at', newStartsAt),
    admin
      .from('booking_holds')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .lt('starts_at', newEndsAt)
      .gt('ends_at', newStartsAt),
  ]);

  if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0) {
    return NextResponse.json({ error: 'This time slot has a conflict.' }, { status: 409 });
  }

  const { data: rescheduleRequest, error: insertError } = await admin
    .from('reschedule_requests')
    .insert({
      booking_id: bookingId,
      pro_id: pro.id,
      new_starts_at: newStartsAt,
      new_ends_at: newEndsAt,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !rescheduleRequest) {
    return NextResponse.json({ error: 'Failed to create reschedule request' }, { status: 500 });
  }

  const client = booking.clients as { full_name: string; email: string };
  const service = booking.services as { name: string };

  await sendRescheduleRequestToClient({
    clientEmail: client.email,
    clientName: client.full_name,
    proName: pro.full_name,
    serviceName: service.name,
    oldStartsAt: booking.starts_at,
    newStartsAt,
    newEndsAt,
    timezone: pro.timezone,
    rescheduleRequestId: rescheduleRequest.id,
  });

  return NextResponse.json({ ok: true, rescheduleRequestId: rescheduleRequest.id });
}
