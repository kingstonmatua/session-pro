import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEnrollmentSessionConfirmation, sendProNotification, sendReminderEmail } from '@/lib/email';

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const { enrollmentId } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const { date, timeSlot } = body as { date?: string; timeSlot?: string };
  if (!date || !timeSlot) {
    return NextResponse.json({ error: 'date and timeSlot are required' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();

  // Load enrollment with all related data in one query
  const { data: enrollment } = await supabase
    .from('package_enrollments')
    .select('*, pros(id, full_name, timezone, club_or_business, slug, user_id), services(name, duration_minutes, buffer_minutes), clients(full_name, email)')
    .eq('id', enrollmentId)
    .eq('status', 'active')
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found or no longer active' }, { status: 404 });
  }

  if (enrollment.sessions_used >= enrollment.sessions_total) {
    return NextResponse.json({ error: 'All sessions in this package have been used' }, { status: 409 });
  }

  const pro = enrollment.pros as { id: string; full_name: string; timezone: string; club_or_business: string | null; slug: string; user_id: string | null };
  const service = enrollment.services as { name: string; duration_minutes: number; buffer_minutes: number };
  const client = enrollment.clients as { full_name: string; email: string };

  const startsAt = parseSlotToISO(date, timeSlot, pro.timezone);
  const endsAt = new Date(
    new Date(startsAt).getTime() + (service.duration_minutes + service.buffer_minutes) * 60_000,
  ).toISOString();

  // Check for conflicts
  const [{ count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .in('status', ['pending_payment', 'confirmed'])
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt),
    supabase
      .from('booking_holds')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt),
  ]);

  if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0) {
    return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 });
  }

  const sessionNumber = enrollment.sessions_used + 1;
  const newSessionsUsed = sessionNumber;
  const isLastSession = newSessionsUsed >= enrollment.sessions_total;

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      pro_id: pro.id,
      client_id: enrollment.client_id,
      service_id: enrollment.service_id,
      enrollment_id: enrollmentId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'confirmed',
      payment_status: 'not_required',
      price_cents: 0,
      platform_fee_cents: 0,
      pro_payout_cents: 0,
      currency: 'usd',
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    console.error('[enrollment/book] booking insert failed:', bookingError);
    return NextResponse.json({ error: 'Failed to create booking. Please try again.' }, { status: 500 });
  }

  // Update enrollment in parallel with emails
  let proEmail: string | undefined;
  if (pro.user_id) {
    const { data: { user: proUser } } = await supabase.auth.admin.getUserById(pro.user_id);
    proEmail = proUser?.email;
  }

  await Promise.all([
    supabase
      .from('package_enrollments')
      .update({
        sessions_used: newSessionsUsed,
        status: isLastSession ? 'completed' : 'active',
      })
      .eq('id', enrollmentId),
    sendEnrollmentSessionConfirmation({
      clientEmail: client.email,
      clientName: client.full_name,
      proName: pro.full_name,
      serviceName: service.name,
      sessionNumber,
      sessionsTotal: enrollment.sessions_total,
      startsAt,
      timezone: pro.timezone,
      location: pro.club_or_business,
    }),
    new Date(startsAt).getTime() - Date.now() > 25 * 60 * 60 * 1000
      ? sendReminderEmail({
          clientEmail: client.email,
          clientName: client.full_name,
          proName: pro.full_name,
          serviceName: service.name,
          startsAt,
          timezone: pro.timezone,
          location: pro.club_or_business,
          scheduledAt: new Date(new Date(startsAt).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        })
      : Promise.resolve(),
    proEmail ? sendProNotification({
      proEmail,
      proName: pro.full_name,
      clientName: client.full_name,
      clientEmail: client.email,
      serviceName: `${service.name} — Session ${sessionNumber} of ${enrollment.sessions_total}`,
      startsAt,
      timezone: pro.timezone,
      payoutCents: 0,
    }) : Promise.resolve(),
  ]);

  return NextResponse.json({ bookingId: booking.id });
}
