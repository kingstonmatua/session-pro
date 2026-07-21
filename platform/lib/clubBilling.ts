import Stripe from 'stripe';

const PLATFORM_FEE_PERCENT = 0.10;

type PayoutPro = { club_id: string | null; stripe_connect_account_id: string | null };
type PayoutClub = { stripe_connect_account_id: string | null } | null;

// Resolves which Stripe Connect account should receive a booking's payout and
// what platform fee (if any) applies. Club bookings route 100% to the club's
// own Connect account with $0 fee; solo pros keep the usual 90/10 split.
export async function resolveConnectAccount(
  stripe: Stripe,
  pro: PayoutPro,
  club: PayoutClub
): Promise<{ connectAccountId: string | null; feePercent: number }> {
  const feePercent = pro.club_id ? 0 : PLATFORM_FEE_PERCENT;
  const targetAccountId = pro.club_id ? club?.stripe_connect_account_id ?? null : pro.stripe_connect_account_id;

  if (!targetAccountId) {
    return { connectAccountId: null, feePercent };
  }

  try {
    const account = await stripe.accounts.retrieve(targetAccountId);
    if (!account.charges_enabled) {
      return { connectAccountId: null, feePercent };
    }
  } catch {
    return { connectAccountId: null, feePercent };
  }

  return { connectAccountId: targetAccountId, feePercent };
}
