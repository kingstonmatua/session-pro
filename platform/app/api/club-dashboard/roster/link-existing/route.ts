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
  const { email } = (body ?? {}) as { email?: string };
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: userList, error: listError } = await admin.auth.admin.listUsers();
  const matchedUser = userList?.users.find(u => u.email?.toLowerCase() === normalizedEmail);
  if (listError || !matchedUser) {
    return NextResponse.json({ error: 'No SessionPro account found for that email' }, { status: 404 });
  }

  const { data: pro } = await admin.from('pros').select('id, club_id').eq('user_id', matchedUser.id).single();
  if (!pro) {
    return NextResponse.json({ error: 'That account is not a pro on SessionPro' }, { status: 404 });
  }
  if (pro.club_id) {
    return NextResponse.json({ error: 'That pro already belongs to a club' }, { status: 409 });
  }

  const { error: updateError } = await admin.from('pros').update({ club_id: club.id }).eq('id', pro.id);
  if (updateError) return NextResponse.json({ error: 'Failed to link pro' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
