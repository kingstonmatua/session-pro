import Stripe from 'stripe';

const PLATFORM_FEE_PERCENT = 0.10;

type PayoutPro = {
  club_id: string | null;
  stripe_connect_account_id: string | null;
  billing_model?: string;
};
type PayoutClub = { stripe_connect_account_id: string | null } | null;

// Resolves which Stripe Connect account receives the payout and what platform
// fee applies. Solo/facility subscribers pay 0% fee; take_rate pros pay 10%.
// Club bookings always route through the club's Connect account.
export async function resolveConnectAccount(
  stripe: Stripe,
  pro: PayoutPro,
  club: PayoutClub
): Promise<{ connectAccountId: string | null; feePercent: number }> {
  const feePercent = (!pro.billing_model || pro.billing_model === 'take_rate') ? PLATFORM_FEE_PERCENT : 0;
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
