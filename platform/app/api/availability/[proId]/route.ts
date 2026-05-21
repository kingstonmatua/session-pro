import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ proId: string }> },
) {
  const { proId } = await params;
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get('year') ?? '');
  const month = parseInt(url.searchParams.get('month') ?? ''); // 0-indexed

  if (!proId || isNaN(year) || isNaN(month)) {
    return NextResponse.json({ error: 'proId, year, and month are required' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ bookedStartTimes: [] });
  }

  const startOfMonth = new Date(Date.UTC(year, month, 1)).toISOString();
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();

  const supabase = createAdminClient();

  const [{ data: bookings }, { data: holds }] = await Promise.all([
    supabase
      .from('bookings')
      .select('starts_at')
      .eq('pro_id', proId)
      .in('status', ['pending_payment', 'confirmed'])
      .gte('starts_at', startOfMonth)
      .lte('starts_at', endOfMonth),
    supabase
      .from('booking_holds')
      .select('starts_at')
      .eq('pro_id', proId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .gte('starts_at', startOfMonth)
      .lte('starts_at', endOfMonth),
  ]);

  const bookedStartTimes = [
    ...(bookings ?? []).map((b) => b.starts_at),
    ...(holds ?? []).map((h) => h.starts_at),
  ];

  return NextResponse.json({ bookedStartTimes });
}
