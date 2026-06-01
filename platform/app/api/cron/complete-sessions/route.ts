import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Mark all confirmed bookings whose session has ended as completed
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('status', 'confirmed')
    .lt('ends_at', now)
    .select('id');

  if (error) {
    console.error('[cron/complete-sessions]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data?.length ?? 0;
  console.log(`[cron/complete-sessions] marked ${count} booking(s) completed`);
  return NextResponse.json({ completed: count, at: now });
}
