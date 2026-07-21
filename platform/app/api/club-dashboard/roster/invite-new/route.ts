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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo: `${appUrl}/onboarding`,
    data: { club_id: club.id },
  });

  if (inviteError) {
    const alreadyExists = inviteError.message?.toLowerCase().includes('already been registered')
      || inviteError.message?.toLowerCase().includes('already registered');
    return NextResponse.json(
      { error: alreadyExists ? 'That email already has a SessionPro account — use "Link existing pro" instead.' : inviteError.message },
      { status: alreadyExists ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
