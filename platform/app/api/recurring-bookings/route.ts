import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Client accepts or declines a recurring booking invite
export async function POST(req: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, action } = body as { id?: string; action?: 'accept' | 'decline' | 'cancel' };

  if (!id || !action || !['accept', 'decline', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'id and action are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: recurring } = await admin
    .from('recurring_bookings')
    .select('status')
    .eq('id', id)
    .single();

  if (!recurring) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'accept' && recurring.status !== 'pending_client') {
    return NextResponse.json({ error: 'Already responded' }, { status: 409 });
  }
  if (action === 'decline' && recurring.status !== 'pending_client') {
    return NextResponse.json({ error: 'Already responded' }, { status: 409 });
  }
  if (action === 'cancel' && recurring.status !== 'active') {
    return NextResponse.json({ error: 'Not active' }, { status: 409 });
  }

  const newStatus = action === 'accept' ? 'active' : 'cancelled';

  await admin
    .from('recurring_bookings')
    .update({ status: newStatus })
    .eq('id', id);

  return NextResponse.json({ ok: true, status: newStatus });
}
