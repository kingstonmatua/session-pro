import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingRequestToPro } from '@/lib/email';
import { checkRateLimit, getIP } from '@/lib/rateLimit';

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

export async function POST(req: Request) {
  if (!checkRateLimit(getIP(req), 3, 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const { proId, serviceId, date, timeSlot, clientName, clientEmail } = body as {
    proId?: string; serviceId?: string; date?: string; timeSlot?: string;
    clientName?: string; clientEmail?: string;
  };

  if (!proId || !serviceId || !date || !timeSlot || !clientName?.trim() || !clientEmail?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();

  const [{ data: pro }, { data: service }] = await Promise.all([
    supabase.from('pros').select('id, full_name, timezone, slug, status, user_id').eq('id', proId).single(),
    supabase.from('services').select('*').eq('id', serviceId).eq('is_active', true).single(),
  ]);

  if (!pro || pro.status !== 'active') {
    return NextResponse.json({ error: 'Pro not found' }, { status: 404 });
  }
  if (!service || service.pro_id !== proId) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const startsAt = parseSlotToISO(date, timeSlot, pro.timezone);
  const endsAt = new Date(
    new Date(startsAt).getTime() + (service.duration_minutes + service.buffer_minutes) * 60_000,
  ).toISOString();

  // Conflict check
  const now = new Date().toISOString();
  const [{ count: bookingConflicts }, { count: holdConflicts }, { count: requestConflicts }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', proId)
      .in('status', ['pending_payment', 'confirmed'])
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt),
    supabase
      .from('booking_holds')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', proId)
      .eq('status', 'active')
      .gt('expires_at', now)
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt),
    supabase
      .from('booking_requests')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', proId)
      .eq('status', 'pending')
      .gt('requested_starts_at', now)
      .lt('requested_starts_at', endsAt)
      .gt('requested_ends_at', startsAt),
  ]);

  if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0 || (requestConflicts ?? 0) > 0) {
    return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 });
  }

  const { data: request, error: insertError } = await supabase
    .from('booking_requests')
    .insert({
      pro_id: proId,
      service_id: serviceId,
      client_name: clientName.trim(),
      client_email: clientEmail.trim().toLowerCase(),
      requested_starts_at: startsAt,
      requested_ends_at: endsAt,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !request) {
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }

  // Notify pro — get their email from auth
  if (pro.user_id) {
    const { data: { user: proUser } } = await supabase.auth.admin.getUserById(pro.user_id);
    if (proUser?.email) {
      await sendBookingRequestToPro({
        proEmail: proUser.email,
        proName: pro.full_name,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        serviceName: service.name,
        requestedStartsAt: startsAt,
        timezone: pro.timezone,
        requestId: request.id,
      });
    }
  }

  return NextResponse.json({ ok: true, requestId: request.id });
}
