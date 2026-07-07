import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase.from('pros').select('id').eq('user_id', user.id).single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const { data: rules, error } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('pro_id', pro.id)
    .eq('is_active', true)
    .order('day');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rules: rules ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase.from('pros').select('id').eq('user_id', user.id).single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const body = await req.json();
  const rules: { day: string; start_time: string; end_time: string }[] = body.rules ?? [];

  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: 'rules must be an array' }, { status: 400 });
  }

  const { error: delError } = await supabase
    .from('availability_rules')
    .delete()
    .eq('pro_id', pro.id);

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (rules.length === 0) {
    return NextResponse.json({ rules: [] });
  }

  const { data: inserted, error: insError } = await supabase
    .from('availability_rules')
    .insert(rules.map(r => ({
      pro_id: pro.id,
      day: r.day,
      start_time: r.start_time,
      end_time: r.end_time,
      is_active: true,
    })))
    .select();

  if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  return NextResponse.json({ rules: inserted ?? [] });
}
