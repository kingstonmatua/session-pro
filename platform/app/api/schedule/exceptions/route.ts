import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase.from('pros').select('id').eq('user_id', user.id).single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let query = supabase
    .from('availability_exceptions')
    .select('*')
    .eq('pro_id', pro.id)
    .order('starts_at');

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lte('starts_at', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exceptions: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase.from('pros').select('id').eq('user_id', user.id).single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const body = await req.json();
  const { starts_at, ends_at, is_available, reason } = body;

  if (!starts_at || !ends_at || is_available === undefined) {
    return NextResponse.json({ error: 'starts_at, ends_at, and is_available are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('availability_exceptions')
    .insert({ pro_id: pro.id, starts_at, ends_at, is_available, reason: reason ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exception: data });
}
