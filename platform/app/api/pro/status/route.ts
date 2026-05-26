import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json() as { status: string };
  if (status !== 'active' && status !== 'draft') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('pros')
    .update({ status })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
