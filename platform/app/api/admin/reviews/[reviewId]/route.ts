import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { reviewId } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body as { action?: 'publish' | 'reject' };

  if (action !== 'publish' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const db = createAdminClient();

  if (action === 'publish') {
    const { error } = await db.from('reviews').update({ is_published: true }).eq('id', reviewId);
    if (error) return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  } else {
    const { error } = await db.from('reviews').delete().eq('id', reviewId);
    if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
