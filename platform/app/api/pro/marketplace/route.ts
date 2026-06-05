import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { marketplace_listed } = await req.json() as { marketplace_listed: boolean };
  if (typeof marketplace_listed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }

  const { error } = await supabase
    .from('pros')
    .update({ marketplace_listed })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
