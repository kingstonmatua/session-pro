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
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const { serviceId, startsAt, endsAt, capacity, label } = body as {
    serviceId?: string;
    startsAt?: string;
    endsAt?: string;
    capacity?: number;
    label?: string;
  };

  if (!serviceId || !startsAt || !endsAt || !capacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (capacity < 2) {
    return NextResponse.json({ error: 'Capacity must be at least 2' }, { status: 400 });
  }

  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('pro_id', pro.id)
    .eq('is_active', true)
    .single();
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: groupSlot, error } = await admin
    .from('group_slots')
    .insert({
      pro_id: pro.id,
      service_id: serviceId,
      starts_at: startsAt,
      ends_at: endsAt,
      capacity,
      label: label ?? null,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A group slot already exists at this time.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create group slot' }, { status: 500 });
  }

  return NextResponse.json({ groupSlot });
}
