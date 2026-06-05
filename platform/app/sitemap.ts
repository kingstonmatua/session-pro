import { createAdminClient } from '@/lib/supabase/admin';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${appUrl}/for-pros`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return staticRoutes;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('pros')
    .select('slug, updated_at')
    .eq('status', 'active')
    .eq('marketplace_listed', true);

  const proRoutes: MetadataRoute.Sitemap = (data ?? []).map((pro) => ({
    url: `${appUrl}/${pro.slug}`,
    lastModified: new Date(pro.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...proRoutes];
}
