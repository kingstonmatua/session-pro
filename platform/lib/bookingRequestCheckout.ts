import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveConnectAccount } from '@/lib/clubBilling';

type AdminClient = ReturnType<typeof createAdminClient>;

type Params = {
  admin: AdminClient;
  pro: { id: string; full_name: string; slug: string; stripe_connect_account_id: string | null; club_id: string | null };
  service: { id: string; name: string; price_cents: number; currency: string };
  requestId: string;
  startsAt: string;
  endsAt: string;
  clientEmail: string;
};

type Result =
  | { ok: true; checkoutUrl: string; checkoutSessionId: string; paymentExpiresAt: string }
  | { ok: false; status: number; error: string };

// Reserves a 24h hold on the slot and creates a Stripe Checkout session for a
// booking request. Shared by the initial accept and by resending a fresh link
// after the original one expires.
export async function createBookingRequestCheckout(params: Params): Promise<Result> {
  const { admin, pro, service, requestId, startsAt, endsAt, clientEmail } = params;

  const [{ count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .in('status', ['pending_payment', 'confirmed'])
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt),
    admin
      .from('booking_holds')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .lt('starts_at', endsAt)
      .gt('ends_at', startsAt),
  ]);

  if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0) {
    return { ok: false, status: 409, error: 'This time slot now has a conflict.' };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  const { data: hold, error: holdError } = await admin
    .from('booking_holds')
    .insert({ pro_id: pro.id, service_id: service.id, starts_at: startsAt, ends_at: endsAt, expires_at: expiresAt })
    .select('id')
    .single();

  if (holdError || !hold) {
    return { ok: false, status: 500, error: 'Failed to reserve time slot' };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  let club: { stripe_connect_account_id: string | null } | null = null;
  if (pro.club_id) {
    const { data: clubRow } = await admin.from('clubs').select('stripe_connect_account_id').eq('id', pro.club_id).single();
    club = clubRow;
  }
  const { connectAccountId, feePercent } = await resolveConnectAccount(stripe, pro, club);
  const platformFeeCents = Math.round(service.price_cents * feePercent);

  let session: Stripe.Checkout.Session;
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer_email: clientEmail,
      line_items: [{
        price_data: {
          currency: service.currency,
          product_data: { name: service.name, description: `with ${pro.full_name}` },
          unit_amount: service.price_cents,
        },
        quantity: 1,
      }],
      metadata: { holdId: hold.id, proId: pro.id, serviceId: service.id, requestId, proSlug: pro.slug },
      success_url: `${appUrl}/booking/success?proSlug=${pro.slug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${pro.slug}`,
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    };

    if (connectAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: connectAccountId },
      };
    }

    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (err) {
    await admin.from('booking_holds').update({ status: 'released' }).eq('id', hold.id);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, status: 500, error: 'Failed to create payment session: ' + msg };
  }

  await admin.from('booking_holds').update({ stripe_checkout_session_id: session.id }).eq('id', hold.id);

  return { ok: true, checkoutUrl: session.url!, checkoutSessionId: session.id, paymentExpiresAt: expiresAt };
}
