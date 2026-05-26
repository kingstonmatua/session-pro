import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ bookingId: string }> };

function toIcalDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, club_or_business')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { bookingId } = await params;

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, clients(full_name, email), services(name, duration_minutes)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const clientName = booking.clients?.full_name ?? 'Client';
  const clientEmail = booking.clients?.email ?? '';
  const serviceName = booking.services?.name ?? 'Session';
  const location = pro.club_or_business ?? '';
  const now = toIcalDate(new Date().toISOString());

  const description = escapeIcal(
    `Session: ${serviceName}\nClient: ${clientName}${clientEmail ? ` (${clientEmail})` : ''}`
  );

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SessionPro//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${bookingId}@sessionpro.io`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcalDate(booking.starts_at)}`,
    `DTEND:${toIcalDate(booking.ends_at)}`,
    `SUMMARY:${escapeIcal(`${serviceName} – ${clientName}`)}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${escapeIcal(location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="booking-${bookingId.slice(0, 8)}.ics"`,
    },
  });
}
