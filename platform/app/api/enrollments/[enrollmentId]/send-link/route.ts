import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNextSessionLink } from '@/lib/email';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const { enrollmentId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, slug')
    .eq('user_id', user.id)
    .single();

  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  const admin = createAdminClient();

  const { data: enrollment } = await admin
    .from('package_enrollments')
    .select('*, clients(full_name, email), services(name)')
    .eq('id', enrollmentId)
    .eq('pro_id', pro.id)
    .single();

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  if (enrollment.status !== 'active') {
    return NextResponse.json({ error: 'This enrollment is no longer active' }, { status: 409 });
  }
  if (enrollment.sessions_used >= enrollment.sessions_total) {
    return NextResponse.json({ error: 'All sessions in this package have been used' }, { status: 409 });
  }

  const client = enrollment.clients as { full_name: string; email: string };
  const service = enrollment.services as { name: string };
  const sessionNumber = enrollment.sessions_used + 1;

  await sendNextSessionLink({
    clientEmail: client.email,
    clientName: client.full_name,
    proName: pro.full_name,
    proSlug: pro.slug,
    serviceName: service.name,
    enrollmentId,
    sessionNumber,
    sessionsTotal: enrollment.sessions_total,
  });

  return NextResponse.json({ sent: true });
}
