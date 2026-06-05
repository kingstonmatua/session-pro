import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { DiscoverClient, type ProListing } from './DiscoverClient';
import './discover.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SessionPro — Find an instructor',
  description: 'Browse coaches, trainers, and instructors near you. Book a session in minutes.',
  openGraph: {
    title: 'SessionPro — Find an instructor',
    description: 'Browse coaches, trainers, and instructors near you. Book a session in minutes.',
    url: 'https://sessionpro.io',
    siteName: 'SessionPro',
    type: 'website',
    images: [{ url: 'https://sessionpro.io/api/og', width: 1200, height: 630, alt: 'SessionPro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SessionPro — Find an instructor',
    description: 'Browse coaches, trainers, and instructors near you. Book a session in minutes.',
    images: ['https://sessionpro.io/api/og'],
  },
};

export default async function DiscoverPage() {
  let pros: ProListing[] = [];

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('pros')
      .select(
        'id, slug, full_name, discipline, location_city, location_region, profile_photo_path, rating_average, rating_count, services(price_cents, kind, is_active)',
      )
      .eq('status', 'active')
      .eq('marketplace_listed', true)
      .order('rating_count', { ascending: false });

    pros = (data ?? []).map((pro) => {
      const svc = (pro.services ?? []) as { price_cents: number; kind: string; is_active: boolean }[];
      const singles = svc.filter((s) => s.kind === 'single' && s.is_active);
      return {
        id: pro.id,
        slug: pro.slug,
        full_name: pro.full_name,
        discipline: pro.discipline ?? null,
        location_city: pro.location_city ?? null,
        location_region: pro.location_region ?? null,
        profile_photo_path: pro.profile_photo_path ?? null,
        rating_average: pro.rating_average ?? null,
        rating_count: pro.rating_count ?? 0,
        starting_price_cents: singles.length > 0 ? Math.min(...singles.map((s) => s.price_cents)) : null,
      };
    });
  }

  return <DiscoverClient pros={pros} />;
}
