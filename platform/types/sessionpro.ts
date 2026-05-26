export type Pro = {
  id: string;
  slug: string;
  full_name: string;
  discipline: string;
  title: string | null;
  club_or_business: string | null;
  bio: string | null;
  location_city: string | null;
  location_region: string | null;
  timezone: string;
  session_mode: "in_person" | "online" | "hybrid";
  years_experience: number | null;
  profile_photo_path: string | null;
  rating_average: number | null;
  rating_count: number;
  status: "draft" | "active" | "paused" | "archived";
  stripe_connect_account_id: string | null;
};

export type Service = {
  id: string;
  pro_id: string;
  kind: "single" | "package";
  name: string;
  level: string | null;
  description: string | null;
  session_count: number;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  is_active: boolean;
  sort_order: number;
};

export type AvailabilityRule = {
  id: string;
  pro_id: string;
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type Review = {
  id: string;
  rating: number;
  quote: string | null;
  reviewer_name: string | null;
  created_at: string;
};

export type ProPageData = {
  pro: Pro;
  services: Service[];
  availability: AvailabilityRule[];
  reviews: Review[];
};

