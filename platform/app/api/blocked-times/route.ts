import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { startsAt, endsAt, label } = (body ?? {}) as {
    startsAt?: string; endsAt?: string; label?: string;
  };

  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: 'startsAt and endsAt are required' }, { status: 400 });
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: blocked, error } = await admin
    .from('blocked_times')
    .insert({ pro_id: pro.id, starts_at: startsAt, ends_at: endsAt, label: label?.trim() || null })
    .select('id, starts_at, ends_at, label')
    .single();

  if (error || !blocked) {
    return NextResponse.json({ error: 'Failed to block time' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, blockedTime: blocked });
}
