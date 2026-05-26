import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ reviewId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { reviewId } = await params;
  const { is_published } = await req.json() as { is_published: boolean };

  const { error } = await supabase
    .from('reviews')
    .update({ is_published })
    .eq('id', reviewId)
    .eq('pro_id', pro.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
