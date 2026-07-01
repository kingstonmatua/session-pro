import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ proId: string }> },
) {
  const { proId } = await params;
  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get('year') ?? '');
  const month = parseInt(url.searchParams.get('month') ?? ''); // 0-indexed

  if (!proId || isNaN(year) || isNaN(month)) {
    return NextResponse.json({ error: 'proId, year, and month are required' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ bookedStartTimes: [], blockedTimes: [], groupSlots: [] });
  }

  const startOfMonth = new Date(Date.UTC(year, month, 1)).toISOString();
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();

  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const [
    { data: bookings },
    { data: holds },
    { data: pendingRequests },
    { data: acceptedRequests },
    { data: blocked },
    { data: groupSlots },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('starts_at, group_slot_id')
      .eq('pro_id', proId)
      .in('status', ['pending_payment', 'confirmed'])
      .gte('starts_at', startOfMonth)
      .lte('starts_at', endOfMonth),
    supabase
      .from('booking_holds')
      .select('starts_at')
      .eq('pro_id', proId)
      .eq('status', 'active')
      .gt('expires_at', now)
      .gte('starts_at', startOfMonth)
      .lte('starts_at', endOfMonth),
    // Pending requests block the slot until the pro responds or the slot passes
    supabase
      .from('booking_requests')
      .select('requested_starts_at')
      .eq('pro_id', proId)
      .eq('status', 'pending')
      .gt('requested_starts_at', now)
      .gte('requested_starts_at', startOfMonth)
      .lte('requested_starts_at', endOfMonth),
    // Accepted requests block the slot until payment is received or the payment window expires
    supabase
      .from('booking_requests')
      .select('requested_starts_at')
      .eq('pro_id', proId)
      .eq('status', 'accepted')
      .gt('payment_expires_at', now)
      .gte('requested_starts_at', startOfMonth)
      .lte('requested_starts_at', endOfMonth),
    supabase
      .from('blocked_times')
      .select('starts_at, ends_at')
      .eq('pro_id', proId)
      .gte('starts_at', startOfMonth)
      .lte('starts_at', endOfMonth),
    supabase
      .from('group_slots')
      .select('id, starts_at, ends_at, capacity, service_id, label, services(name)')
      .eq('pro_id', proId)
      .gte('starts_at', startOfMonth)
      .lte('starts_at', endOfMonth),
  ]);

  // Build lookup sets
  const groupSlotStartTimes = new Set((groupSlots ?? []).map((gs) => gs.starts_at));
  const groupSlotById = new Map((groupSlots ?? []).map((gs) => [gs.id, gs]));

  // Count confirmed/pending bookings per group slot
  const groupBookingCounts = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (b.group_slot_id && groupSlotById.has(b.group_slot_id)) {
      groupBookingCounts.set(b.group_slot_id, (groupBookingCounts.get(b.group_slot_id) ?? 0) + 1);
    }
  }

  // Count active holds at group slot start times (they count against group capacity)
  const holdCountAtGroupTime = new Map<string, number>();
  for (const h of holds ?? []) {
    if (groupSlotStartTimes.has(h.starts_at)) {
      holdCountAtGroupTime.set(h.starts_at, (holdCountAtGroupTime.get(h.starts_at) ?? 0) + 1);
    }
  }

  // Build group slot response with live spot counts
  const groupSlotData = (groupSlots ?? []).map((gs) => {
    const booked = groupBookingCounts.get(gs.id) ?? 0;
    const pendingHolds = holdCountAtGroupTime.get(gs.starts_at) ?? 0;
    return {
      id: gs.id,
      startsAt: gs.starts_at,
      endsAt: gs.ends_at,
      capacity: gs.capacity,
      booked: booked + pendingHolds,
      serviceId: gs.service_id,
      serviceName: (gs.services as unknown as { name: string } | null)?.name ?? 'Group Session',
      label: gs.label,
    };
  });

  // bookedStartTimes = individual bookings + active holds + pending requests + accepted-but-unpaid requests
  // Group slots (even full ones) are handled separately via groupSlotData
  const bookedStartTimes = [
    ...(bookings ?? []).filter((b) => !b.group_slot_id).map((b) => b.starts_at),
    ...(holds ?? []).filter((h) => !groupSlotStartTimes.has(h.starts_at)).map((h) => h.starts_at),
    ...(pendingRequests ?? []).map((r) => r.requested_starts_at),
    ...(acceptedRequests ?? []).map((r) => r.requested_starts_at),
  ];

  return NextResponse.json({ bookedStartTimes, blockedTimes: blocked ?? [], groupSlots: groupSlotData });
}
