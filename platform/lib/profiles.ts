import { getSupabaseClient } from "@/lib/supabase/client";
import type { AvailabilityRule, Pro, ProPageData, Service } from "@/types/sessionpro";

const dayLabels: Record<AvailabilityRule["day"], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday"
};

export function centsToDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function formatAvailability(rule: AvailabilityRule) {
  return `${dayLabels[rule.day]} ${rule.start_time.slice(0, 5)}-${rule.end_time.slice(0, 5)}`;
}

export async function getProPageData(slug: string): Promise<ProPageData | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getDemoFallback(slug);
  }

  const { data: pro, error: proError } = await supabase
    .from("pros")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single<Pro>();

  if (proError || !pro) {
    return null;
  }

  const [{ data: services }, { data: availability }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("pro_id", pro.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .returns<Service[]>(),
    supabase
      .from("availability_rules")
      .select("*")
      .eq("pro_id", pro.id)
      .eq("is_active", true)
      .returns<AvailabilityRule[]>()
  ]);

  return {
    pro,
    services: services ?? [],
    availability: availability ?? []
  };
}

function getDemoFallback(slug: string): ProPageData | null {
  if (slug !== "kenyonmatua") {
    return null;
  }

  const proId = "11111111-1111-4111-8111-111111111111";

  return {
    pro: {
      id: proId,
      slug: "kenyonmatua",
      full_name: "Kenyon Matua",
      discipline: "Golf Instruction",
      title: "Assistant Golf Professional",
      club_or_business: "Alpine Country Club",
      bio: "Kenyon Matua is an Assistant Golf Professional at Alpine Country Club in Highland, Utah, with five years of hands-on instruction experience across multiple clubs. Kenyon specializes in helping golfers of all skill levels build a more consistent, confident game — from fundamentals for beginners to course management and shot-shaping for advanced players.\n\nEvery session is tailored to where you are in your game. Whether you're picking up a club for the first time or looking to break 80, Kenyon brings patience, precision, and a genuine passion for the sport to every lesson.",
      location_city: "Highland",
      location_region: "UT",
      timezone: "America/Denver",
      session_mode: "in_person",
      years_experience: 5,
      profile_photo_path: "/images/kenyon-matua-golf.jpeg",
      rating_average: 4.9,
      rating_count: 0,
      status: "active",
      stripe_connect_account_id: null
    },
    services: [
      makeService(proId, "Beginner lesson", "Beginner", "single", 1, 8000, null, 10),
      makeService(proId, "Advanced lesson", "Advanced", "single", 1, 10000, null, 20),
      makeService(proId, "5-Session Pack", "Beginner", "package", 5, 37500, 40000, 30),
      makeService(proId, "5-Session Pack", "Advanced", "package", 5, 47500, 50000, 40),
      makeService(proId, "10-Session Pack", "Beginner", "package", 10, 72500, 80000, 50),
      makeService(proId, "10-Session Pack", "Advanced", "package", 10, 92500, 100000, 60)
    ],
    availability: ["mon", "tue", "wed", "thu", "fri"].map((day, index) => ({
      id: `availability-${index}`,
      pro_id: proId,
      day: day as AvailabilityRule["day"],
      start_time: "08:00:00",
      end_time: "18:00:00",
      is_active: true
    }))
  };
}

function makeService(
  proId: string,
  name: string,
  level: string,
  kind: Service["kind"],
  sessionCount: number,
  priceCents: number,
  compareAtPriceCents: number | null,
  sortOrder: number
): Service {
  return {
    id: `${sortOrder}`,
    pro_id: proId,
    kind,
    name,
    level,
    description: null,
    session_count: sessionCount,
    duration_minutes: 60,
    buffer_minutes: 15,
    price_cents: priceCents,
    compare_at_price_cents: compareAtPriceCents,
    currency: "usd",
    is_active: true,
    sort_order: sortOrder
  };
}

