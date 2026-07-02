import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRecurringInvite } from '@/lib/email';

type Params = { params: Promise<{ bookingId: string }> };

const FREQUENCY_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 28 };

export async function POST(req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const { bookingId } = await params;
  const body = await req.json().catch(() => ({}));
  const { frequency } = body as { frequency?: string };

  if (!frequency || !FREQUENCY_DAYS[frequency]) {
    return NextResponse.json({ error: 'frequency must be weekly, biweekly, or monthly' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('service_id, starts_at, ends_at, clients(full_name, email), services(name)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const client = booking.clients as unknown as { full_name: string; email: string };
  const service = booking.services as unknown as { name: string };

  // Advance from the last session time until next_starts_at is > now + 48h
  const minNextMs = Date.now() + 48 * 60 * 60 * 1000;
  const freqMs = FREQUENCY_DAYS[frequency] * 24 * 60 * 60 * 1000;
  let nextStartMs = new Date(booking.starts_at).getTime() + freqMs;
  let nextEndMs = new Date(booking.ends_at).getTime() + freqMs;
  while (nextStartMs < minNextMs) {
    nextStartMs += freqMs;
    nextEndMs += freqMs;
  }

  const { data: recurring, error: insertError } = await admin
    .from('recurring_bookings')
    .insert({
      pro_id: pro.id,
      client_name: client.full_name,
      client_email: client.email,
      service_id: booking.service_id,
      frequency,
      status: 'pending_client',
      next_starts_at: new Date(nextStartMs).toISOString(),
      next_ends_at: new Date(nextEndMs).toISOString(),
    })
    .select('id')
    .single();

  if (insertError || !recurring) {
    return NextResponse.json({ error: 'Failed to create recurring booking' }, { status: 500 });
  }

  await sendRecurringInvite({
    clientEmail: client.email,
    clientName: client.full_name,
    proName: pro.full_name,
    serviceName: service.name,
    frequency: frequency as 'weekly' | 'biweekly' | 'monthly',
    nextStartsAt: new Date(nextStartMs).toISOString(),
    timezone: pro.timezone,
    recurringBookingId: recurring.id,
  });

  return NextResponse.json({ ok: true });
}
