import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: slot } = await admin
    .from('group_slots')
    .select('id, pro_id')
    .eq('id', id)
    .single();

  if (!slot || slot.pro_id !== pro.id) {
    return NextResponse.json({ error: 'Group slot not found' }, { status: 404 });
  }

  const { error } = await admin.from('group_slots').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete group slot' }, { status: 500 });

  return NextResponse.json({ success: true });
}
