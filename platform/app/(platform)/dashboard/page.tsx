import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CheckCircle2, ExternalLink, Calendar, Star, Settings, Banknote, AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from './LogoutButton';
import { ConnectStripeButton } from './ConnectStripeButton';
import { ShareButtons } from './ShareButtons';
import { StatusToggle } from './StatusToggle';
import Stripe from 'stripe';

async function getConnectStatus(accountId: string | null): Promise<'not_connected' | 'pending' | 'active'> {
  if (!accountId || !process.env.STRIPE_SECRET_KEY) return 'not_connected';
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(accountId);
    return account.charges_enabled ? 'active' : 'pending';
  } catch {
    return 'pending';
  }
}

type PageProps = {
  searchParams: Promise<{ connect?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!pro) redirect('/onboarding');

  const [{ count: bookingCount }, { count: reviewCount }, connectStatus, { connect: connectParam }] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('pro_id', pro.id),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('pro_id', pro.id),
    getConnectStatus(pro.stripe_connect_account_id),
    searchParams,
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const profileUrl = `sessionpro.io/${pro.slug}`;
  const fullProfileUrl = `${appUrl}/${pro.slug}`;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">

        <div className="dashboard-welcome">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Welcome back, {pro.full_name.split(' ')[0]}</h1>
              <p>Your SessionPro page is {pro.status === 'active' ? 'live and accepting bookings.' : 'currently in draft mode.'}</p>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Connect success/pending banner */}
        {connectParam === 'success' && (
          <div className="dashboard-banner dashboard-banner--success">
            <CheckCircle2 size={18} />
            Stripe payouts connected — you&rsquo;re ready to receive payments.
          </div>
        )}
        {connectParam === 'pending' && (
          <div className="dashboard-banner dashboard-banner--warning">
            <AlertCircle size={18} />
            Stripe setup isn&rsquo;t complete yet. Finish your account to receive payouts.
          </div>
        )}

        {/* Profile URL */}
        <div className="dashboard-card" style={{ marginBottom: 16 }}>
          <h3>Your public page</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="profile-url-display">
              <ExternalLink size={15} />
              {profileUrl}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                href={`/${pro.slug}`}
                target="_blank"
                className="button"
                style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}
              >
                View page
              </Link>
              <ShareButtons url={fullProfileUrl} slug={pro.slug} />
              <StatusToggle status={pro.status as 'active' | 'draft'} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-grid" style={{ marginBottom: 16 }}>
          <div className="dashboard-card">
            <h3>Bookings</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={28} color="var(--green)" />
              <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: 36, fontWeight: 800 }}>
                {bookingCount ?? 0}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>Total bookings received</p>
          </div>

          <div className="dashboard-card">
            <h3>Reviews</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Star size={28} color="var(--amber)" />
              <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: 36, fontWeight: 800 }}>
                {reviewCount ?? 0}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
              {pro.rating_average ? `${pro.rating_average} average rating` : 'No reviews yet'}
            </p>
          </div>
        </div>

        {/* Stripe Connect */}
        <div className="dashboard-card" style={{ marginBottom: 16 }}>
          <h3>Payouts</h3>
          {connectStatus === 'active' && (
            <div className="connect-status connect-status--active">
              <CheckCircle2 size={18} />
              <div>
                <strong>Stripe connected</strong>
                <p>You&rsquo;ll receive 90% of each booking automatically. Platform fee: 10%.</p>
              </div>
            </div>
          )}
          {connectStatus === 'pending' && (
            <div className="connect-status connect-status--pending">
              <AlertCircle size={18} />
              <div>
                <strong>Setup incomplete</strong>
                <p>Finish your Stripe account to start receiving payouts.</p>
              </div>
              <ConnectStripeButton label="Complete setup" />
            </div>
          )}
          {connectStatus === 'not_connected' && (
            <div className="connect-status connect-status--none">
              <Banknote size={18} />
              <div>
                <strong>Connect your bank account</strong>
                <p>Set up Stripe to receive 90% of each booking directly to your bank. Takes about 2 minutes.</p>
              </div>
              <ConnectStripeButton label="Set up payouts" />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="dashboard-card">
          <h3>Quick actions</h3>
          <div className="dashboard-actions">
            <Link href={`/${pro.slug}`} target="_blank" className="button">
              <ExternalLink size={15} /> View public page
            </Link>
            <Link href="/dashboard/edit" className="button">
              <Settings size={15} /> Edit profile
            </Link>
            <Link href="/dashboard/bookings" className="button">
              <Calendar size={15} /> Manage bookings
            </Link>
            <Link href="/dashboard/reviews" className="button">
              <MessageSquare size={15} /> Reviews
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
