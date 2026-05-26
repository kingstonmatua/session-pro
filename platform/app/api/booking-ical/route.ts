import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function toICalDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICalText(str: string): string {
  return str.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return new NextResponse('Missing session_id', { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse('Service not configured', { status: 503 });
  }

  const supabase = createAdminClient();

  const { data: hold } = await supabase
    .from('booking_holds')
    .select('starts_at, ends_at, pro_id, service_id')
    .eq('stripe_checkout_session_id', sessionId)
    .single();

  if (!hold) {
    return new NextResponse('Booking not found', { status: 404 });
  }

  const [{ data: pro }, { data: service }] = await Promise.all([
    supabase
      .from('pros')
      .select('full_name, club_or_business, location_city, location_region')
      .eq('id', hold.pro_id)
      .single(),
    supabase
      .from('services')
      .select('name')
      .eq('id', hold.service_id)
      .single(),
  ]);

  if (!pro || !service) {
    return new NextResponse('Booking details not found', { status: 404 });
  }

  const location =
    (pro.club_or_business as string | null) ??
    `${pro.location_city ?? ''}, ${pro.location_region ?? ''}`.trim().replace(/^,\s*|,\s*$/, '');

  const summary = escapeICalText(`${service.name} with ${pro.full_name}`);
  const now = toICalDate(new Date().toISOString());
  const uid = `${sessionId}@sessionpro.io`;

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SessionPro//SessionPro//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICalDate(hold.starts_at)}`,
    `DTEND:${toICalDate(hold.ends_at)}`,
    `SUMMARY:${summary}`,
    ...(location ? [`LOCATION:${escapeICalText(location)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const filename = `session-with-${pro.full_name.replace(/\s+/g, '-').toLowerCase()}.ics`;

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
