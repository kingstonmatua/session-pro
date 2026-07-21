import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: club } = await supabase.from('clubs').select('id').eq('user_id', user.id).single();
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { proId } = (body ?? {}) as { proId?: string };
  if (!proId) return NextResponse.json({ error: 'proId is required' }, { status: 400 });

  const admin = createAdminClient();

  const { data: pro } = await admin.from('pros').select('id, club_id').eq('id', proId).single();
  if (!pro || pro.club_id !== club.id) {
    return NextResponse.json({ error: 'Pro not found on this roster' }, { status: 404 });
  }

  const { error } = await admin.from('pros').update({ club_id: null }).eq('id', proId);
  if (error) return NextResponse.json({ error: 'Failed to remove pro' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
