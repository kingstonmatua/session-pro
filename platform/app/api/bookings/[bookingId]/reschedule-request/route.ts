import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRescheduleRequestToPro } from '@/lib/email';

type Params = { params: Promise<{ bookingId: string }> };

function parseSlotToISO(dateStr: string, timeSlot: string, timezone: string): string {
  const [time, ampm] = timeSlot.split(' ');
  const [h, m] = time.split(':').map(Number);
  let hour = h;
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  const approxUTC = new Date(Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    hour, m, 0,
  ));

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(approxUTC);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value);
  const tzHour = get('hour') % 24;
  const localAsUTC = Date.UTC(get('year'), get('month') - 1, get('day'), tzHour, get('minute'), get('second'));
  const offsetMs = approxUTC.getTime() - localAsUTC;

  return new Date(Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    hour, m, 0,
  ).valueOf() + offsetMs).toISOString();
}

export async function POST(req: Request, { params }: Params) {
  const { bookingId } = await params;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const { date, timeSlot, reason } = (body ?? {}) as {
    date?: string; timeSlot?: string; reason?: string;
  };

  if (!date || !timeSlot) {
    return NextResponse.json({ error: 'date and timeSlot are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, pros(full_name, timezone, user_id), clients(full_name, email), services(name, duration_minutes, reschedule_window_hours, client_reschedule_limit)')
    .eq('id', bookingId)
    .in('status', ['confirmed', 'pending_payment'])
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const pro = booking.pros as { full_name: string; timezone: string; user_id: string | null };
  const client = booking.clients as { full_name: string; email: string };
  const service = booking.services as {
    name: string; duration_minutes: number; reschedule_window_hours: number; client_reschedule_limit: number;
  };

  const newStartsAt = parseSlotToISO(date, timeSlot, pro.timezone);
  const newEndsAt = new Date(new Date(newStartsAt).getTime() + service.duration_minutes * 60000).toISOString();

  const hoursUntilSession = (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilSession < service.reschedule_window_hours) {
    return NextResponse.json(
      { error: `Reschedule requests must be made at least ${service.reschedule_window_hours} hours before the session.` },
      { status: 409 }
    );
  }

  const { count: clientRequestCount } = await admin
    .from('reschedule_requests')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('initiated_by', 'client')
    .neq('status', 'declined');

  if ((clientRequestCount ?? 0) >= service.client_reschedule_limit) {
    return NextResponse.json({ error: 'You have reached the reschedule limit for this booking.' }, { status: 409 });
  }

  // Conflict check on the requested new time (excluding this booking)
  const [{ count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', booking.pro_id)
      .neq('id', bookingId)
      .in('status', ['pending_payment', 'confirmed'])
      .lt('starts_at', newEndsAt)
      .gt('ends_at', newStartsAt),
    admin
      .from('booking_holds')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', booking.pro_id)
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
      pro_id: booking.pro_id,
      new_starts_at: newStartsAt,
      new_ends_at: newEndsAt,
      status: 'pending',
      initiated_by: 'client',
      reason: reason?.trim() || null,
    })
    .select('id')
    .single();

  if (insertError || !rescheduleRequest) {
    return NextResponse.json({ error: 'Failed to create reschedule request' }, { status: 500 });
  }

  if (pro.user_id) {
    const { data: { user: proUser } } = await admin.auth.admin.getUserById(pro.user_id);
    if (proUser?.email) {
      await sendRescheduleRequestToPro({
        proEmail: proUser.email,
        proName: pro.full_name,
        clientName: client.full_name,
        serviceName: service.name,
        oldStartsAt: booking.starts_at,
        newStartsAt,
        newEndsAt,
        timezone: pro.timezone,
        reason: reason?.trim() || undefined,
      });
    }
  }

  return NextResponse.json({ ok: true, rescheduleRequestId: rescheduleRequest.id });
}
