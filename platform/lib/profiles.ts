import { getSupabaseClient } from "@/lib/supabase/client";
import type { AvailabilityRule, Pro, ProPageData, Review, Service } from "@/types/sessionpro";

export const DEMO_PRO_ID = "11111111-1111-4111-8111-111111111111";

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
    return getDemoFallback(slug);
  }

  const [{ data: services }, { data: availability }, { data: reviews }] = await Promise.all([
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
      .returns<AvailabilityRule[]>(),
    supabase
      .from("reviews")
      .select("id, rating, quote, reviewer_name, created_at")
      .eq("pro_id", pro.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<Review[]>()
  ]);

  return {
    pro,
    services: services ?? [],
    availability: availability ?? [],
    reviews: reviews ?? [],
  };
}

function getDemoFallback(slug: string): ProPageData | null {
  if (slug !== "marcusreed") {
    return null;
  }

  const proId = "11111111-1111-4111-8111-111111111111";

  return {
    pro: {
      id: proId,
      slug: "marcusreed",
      full_name: "Marcus Reed",
      discipline: "Golf Instruction",
      title: "PGA Golf Professional",
      club_or_business: "Scottsdale Golf Club",
      bio: "Marcus Reed is a PGA Golf Professional at Scottsdale Golf Club in Scottsdale, Arizona, with over twelve years of teaching experience at some of the Southwest's top clubs. Marcus specializes in helping golfers at every level build a more consistent, repeatable swing — from first-timers learning the basics to single-digit handicappers chasing their personal best.\n\nEvery lesson is built around you. Marcus uses a combination of video analysis, on-course drills, and clear, jargon-free coaching to help you make real improvements that stick. Book a session below and start playing the golf you know you're capable of.",
      location_city: "Scottsdale",
      location_region: "AZ",
      timezone: "America/Phoenix",
      session_mode: "in_person",
      years_experience: 12,
      profile_photo_path: "/images/marcus-reed.png",
      rating_average: 4.9,
      rating_count: 47,
      status: "active",
      stripe_connect_account_id: null,
      booking_mode: "instant"
    },
    services: [
      makeService(proId, "Beginner lesson", "Beginner", "single", 1, 10000, null, 10),
      makeService(proId, "Advanced lesson", "Advanced", "single", 1, 12000, null, 20),
      makeService(proId, "5-Session Pack", "Beginner", "package", 5, 47500, 50000, 30),
      makeService(proId, "5-Session Pack", "Advanced", "package", 5, 57500, 60000, 40),
      makeService(proId, "10-Session Pack", "Beginner", "package", 10, 90000, 100000, 50),
      makeService(proId, "10-Session Pack", "Advanced", "package", 10, 110000, 120000, 60)
    ],
    availability: ["mon", "tue", "wed", "thu", "fri", "sat"].map((day, index) => ({
      id: `availability-${index}`,
      pro_id: proId,
      day: day as AvailabilityRule["day"],
      start_time: "07:00:00",
      end_time: "17:00:00",
      is_active: true
    })),
    reviews: [
      { id: "r1", rating: 5, quote: "Marcus completely transformed my swing in just three sessions. I'm hitting the ball more consistently than I ever have. Highly recommend.", reviewer_name: "James T.", created_at: "2025-03-15T00:00:00Z" },
      { id: "r2", rating: 5, quote: "Patient, knowledgeable, and great at explaining the why behind every adjustment. Best golf investment I've made.", reviewer_name: "Sarah K.", created_at: "2025-03-02T00:00:00Z" },
      { id: "r3", rating: 5, quote: "Dropped 6 strokes off my handicap after a 5-session pack. Marcus knows exactly how to diagnose your weaknesses.", reviewer_name: "David R.", created_at: "2025-02-18T00:00:00Z" },
      { id: "r4", rating: 4, quote: "Great instructor who keeps things simple and practical. My short game has improved dramatically.", reviewer_name: "Michelle P.", created_at: "2025-02-05T00:00:00Z" },
      { id: "r5", rating: 5, quote: "First time taking lessons and Marcus made me feel completely comfortable. Already booked another session.", reviewer_name: "Tom W.", created_at: "2025-01-22T00:00:00Z" },
      { id: "r6", rating: 5, quote: "Worth every penny. Marcus is the real deal — clear, focused, and results-driven.", reviewer_name: "Linda M.", created_at: "2025-01-10T00:00:00Z" },
    ],
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
    sort_order: sortOrder,
    cancellation_window_hours: 24,
    cancellation_refund_tiers: [{ hours_before: 0, refund_percent: 100 }],
    reschedule_window_hours: 24,
    client_reschedule_limit: 1,
    no_show_policy: "forfeit"
  };
}

