import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // club_id is only ever trusted from the invited user's own metadata (set
  // server-side at invite time in app/api/club-dashboard/roster/invite-new)
  // — never from anything the client sends in this request body.
  const clubId = user.user_metadata?.club_id as string | undefined;
  if (!clubId) return NextResponse.json({ error: 'No club invite found for this account' }, { status: 400 });

  const admin = createAdminClient();
  const { data: club } = await admin.from('clubs').select('id').eq('id', clubId).single();
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });

  const { data: existingPro } = await admin.from('pros').select('id').eq('user_id', user.id).maybeSingle();
  if (existingPro) return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });

  const body = await req.json().catch(() => null);
  const { slug, fullName, discipline, title, clubOrBusiness, bio, city, region } = (body ?? {}) as {
    slug?: string; fullName?: string; discipline?: string; title?: string;
    clubOrBusiness?: string; bio?: string; city?: string; region?: string;
  };

  if (!slug?.trim() || !fullName?.trim() || !discipline?.trim() || !city?.trim() || !region?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: pro, error: proError } = await admin
    .from('pros')
    .insert({
      user_id: user.id,
      club_id: club.id,
      slug: slug.trim(),
      full_name: fullName.trim(),
      discipline: discipline.trim(),
      title: title?.trim() || null,
      club_or_business: clubOrBusiness?.trim() || null,
      bio: bio?.trim() || null,
      location_city: city.trim(),
      location_region: region.trim(),
      status: 'active',
    })
    .select('id')
    .single();

  if (proError || !pro) {
    return NextResponse.json(
      { error: proError?.message.includes('duplicate') ? 'That profile URL is already taken.' : (proError?.message ?? 'Failed to create profile') },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, proId: pro.id });
}
