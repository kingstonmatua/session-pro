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
  booking_mode: "instant" | "request";
};

export type CancellationRefundTier = {
  hours_before: number;
  refund_percent: number;
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
  cancellation_window_hours: number;
  cancellation_refund_tiers: CancellationRefundTier[];
  reschedule_window_hours: number;
  client_reschedule_limit: number;
  no_show_policy: "forfeit" | "credit";
};

export type AvailabilityRule = {
  id: string;
  pro_id: string;
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type AvailabilityException = {
  id: string;
  pro_id: string;
  starts_at: string;
  ends_at: string;
  is_available: boolean;
  reason: string | null;
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

export type BookingRequest = {
  id: string;
  pro_id: string;
  service_id: string;
  client_name: string;
  client_email: string;
  requested_starts_at: string;
  requested_ends_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'paid';
  stripe_checkout_session_id: string | null;
  payment_expires_at: string | null;
  created_at: string;
};

export type BlockedTime = {
  id: string;
  pro_id: string;
  starts_at: string;
  ends_at: string;
  label: string | null;
  created_at: string;
};

export type RescheduleRequest = {
  id: string;
  booking_id: string;
  pro_id: string;
  new_starts_at: string;
  new_ends_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  initiated_by: 'pro' | 'client';
  reason: string | null;
  created_at: string;
};

export type GroupSlot = {
  id: string;
  pro_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  label: string | null;
  created_at: string;
};

export type GroupSlotWithCount = GroupSlot & {
  booked: number;
  serviceName: string;
};

export type PackageEnrollment = {
  id: string;
  pro_id: string;
  client_id: string;
  service_id: string;
  payment_id: string | null;
  sessions_total: number;
  sessions_used: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
};

export type EnrollmentMode = {
  id: string;
  sessionsTotal: number;
  sessionsUsed: number;
  service: Service;
};

