import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { name, slug, adminEmail } = (body ?? {}) as { name?: string; slug?: string; adminEmail?: string };

  if (!name?.trim() || !slug?.trim() || !adminEmail?.trim()) {
    return NextResponse.json({ error: 'name, slug, and adminEmail are required' }, { status: 400 });
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only' }, { status: 400 });
  }

  const db = createAdminClient();

  const { data: existingClub } = await db.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (existingClub) {
    return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const email = adminEmail.trim().toLowerCase();

  let clubUserId: string;
  const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/club-onboarding`,
  });

  if (invited?.user) {
    clubUserId = invited.user.id;
  } else if (inviteError?.message?.toLowerCase().includes('already been registered') || inviteError?.message?.toLowerCase().includes('already registered')) {
    // This person already has a SessionPro login (e.g. as a pro) — link the club to their existing account.
    const { data: list, error: listError } = await db.auth.admin.listUsers();
    const match = list?.users.find(u => u.email?.toLowerCase() === email);
    if (listError || !match) {
      return NextResponse.json({ error: 'Could not find or invite that email' }, { status: 500 });
    }
    clubUserId = match.id;
  } else {
    return NextResponse.json({ error: inviteError?.message ?? 'Failed to invite club admin' }, { status: 500 });
  }

  const { data: club, error: insertError } = await db
    .from('clubs')
    .insert({ user_id: clubUserId, slug, name: name.trim(), status: 'draft' })
    .select('id, slug')
    .single();

  if (insertError || !club) {
    return NextResponse.json({ error: insertError?.message ?? 'Failed to create club' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clubId: club.id, slug: club.slug });
}
