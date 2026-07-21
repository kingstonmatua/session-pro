-- SessionPro Supabase schema
-- Phase 1: pros, clients, bookings, availability, payments, reviews, and media.
-- Run this in the Supabase SQL editor for a new project.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------- Enums ----------

create type public.pro_status as enum ('draft', 'active', 'paused', 'archived');
create type public.club_status as enum ('draft', 'active', 'paused');
create type public.session_mode as enum ('in_person', 'online', 'hybrid');
create type public.service_kind as enum ('single', 'package');
create type public.booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show');
create type public.payment_status as enum ('not_required', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.hold_status as enum ('active', 'converted', 'expired', 'released');
create type public.day_of_week as enum ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- ---------- Shared helpers ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

-- ---------- Club-owned data ----------

-- A club is a multi-pro customer: one shared public booking page, one Stripe
-- Connect account receiving 100% of every booking made with any of its pros
-- (no platform fee), and its own self-service dashboard for roster/branding.
-- Subscription billing is manual/off-platform — plan_name/monthly_fee_cents/
-- subscription_status are bookkeeping only, not wired to real billing.
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  slug text not null unique,
  name text not null,
  logo_path text,
  description text,
  stripe_connect_account_id text,
  status public.club_status not null default 'draft',
  plan_name text,
  monthly_fee_cents integer,
  subscription_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger set_clubs_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

-- ---------- Pro-owned data ----------

create table public.pros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  slug text not null unique,
  full_name text not null,
  discipline text not null,
  title text,
  club_or_business text,
  bio text,
  location_city text,
  location_region text,
  location_country text default 'US',
  timezone text not null default 'America/Denver',
  session_mode public.session_mode not null default 'in_person',
  years_experience numeric(4,1),
  profile_photo_path text,
  rating_average numeric(2,1),
  rating_count integer not null default 0,
  status public.pro_status not null default 'draft',
  stripe_connect_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pros_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint pros_rating_average_range check (rating_average is null or rating_average between 0 and 5),
  constraint pros_rating_count_nonnegative check (rating_count >= 0)
);

create index pros_club_id_idx on public.pros (club_id);

create trigger set_pros_updated_at
before update on public.pros
for each row execute function public.set_updated_at();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  kind public.service_kind not null,
  name text not null,
  level text,
  description text,
  session_count integer not null default 1,
  duration_minutes integer not null default 60,
  buffer_minutes integer not null default 15,
  price_cents integer not null,
  compare_at_price_cents integer,
  currency text not null default 'usd',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_session_count_positive check (session_count > 0),
  constraint services_duration_positive check (duration_minutes > 0),
  constraint services_buffer_nonnegative check (buffer_minutes >= 0),
  constraint services_price_nonnegative check (price_cents >= 0),
  constraint services_compare_price_nonnegative check (compare_at_price_cents is null or compare_at_price_cents >= 0),
  constraint services_currency_lower check (currency = lower(currency))
);

create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  day public.day_of_week not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_valid_range check (start_time < end_time)
);

create unique index availability_rules_unique_active_window
on public.availability_rules (pro_id, day, start_time, end_time)
where is_active = true;

create trigger set_availability_rules_updated_at
before update on public.availability_rules
for each row execute function public.set_updated_at();

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  is_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_exceptions_valid_range check (starts_at < ends_at)
);

create index availability_exceptions_pro_time_idx
on public.availability_exceptions (pro_id, starts_at, ends_at);

create trigger set_availability_exceptions_updated_at
before update on public.availability_exceptions
for each row execute function public.set_updated_at();

-- ---------- Client and booking data ----------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email citext not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_email_idx on public.clients (email);

create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create table public.booking_holds (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  status public.hold_status not null default 'active',
  client_email citext,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_holds_valid_range check (starts_at < ends_at),
  constraint booking_holds_expiry_future check (expires_at > created_at)
);

create index booking_holds_active_slot_idx
on public.booking_holds (pro_id, starts_at, ends_at)
where status = 'active';

create trigger set_booking_holds_updated_at
before update on public.booking_holds
for each row execute function public.set_updated_at();

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  hold_id uuid references public.booking_holds(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  price_cents integer not null,
  platform_fee_cents integer not null default 0,
  pro_payout_cents integer not null default 0,
  currency text not null default 'usd',
  client_notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_range check (starts_at < ends_at),
  constraint bookings_price_nonnegative check (price_cents >= 0),
  constraint bookings_platform_fee_nonnegative check (platform_fee_cents >= 0),
  constraint bookings_pro_payout_nonnegative check (pro_payout_cents >= 0),
  constraint bookings_currency_lower check (currency = lower(currency))
);

-- Prevent double-booking confirmed or pending paid slots for the same pro.
create unique index bookings_unique_active_slot
on public.bookings (pro_id, starts_at, ends_at)
where status in ('pending_payment', 'confirmed');

create index bookings_pro_time_idx on public.bookings (pro_id, starts_at);
create index bookings_client_idx on public.bookings (client_id);

create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  amount_cents integer not null,
  platform_fee_cents integer not null default 0,
  currency text not null default 'usd',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_nonnegative check (amount_cents >= 0),
  constraint payments_platform_fee_nonnegative check (platform_fee_cents >= 0),
  constraint payments_currency_lower check (currency = lower(currency))
);

create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Credit ledger for pre-paid session packages (and, later, no-show make-up credits).
-- Formalized here on 2026-07-20: this table already exists live in Supabase but was
-- never added to this file. Columns reconstructed from how the app reads/writes it
-- (app/api/webhooks/stripe/route.ts, app/api/enrollments/**) — diff against the live
-- schema before running this file against an existing database.
create table public.package_enrollments (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  sessions_total integer not null,
  sessions_used integer not null default 0,
  -- 'cancelled' is declared in types/sessionpro.ts but not written by any route today.
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint package_enrollments_sessions_total_positive check (sessions_total > 0),
  constraint package_enrollments_sessions_used_nonnegative check (sessions_used >= 0)
);

create index package_enrollments_pro_idx on public.package_enrollments (pro_id);
create index package_enrollments_client_idx on public.package_enrollments (client_id);

-- Reschedule proposals on an existing booking. Formalized here on 2026-07-20: this
-- table already exists live in Supabase but was never added to this file. Columns
-- reconstructed from app/api/reschedule-requests/** — diff against the live schema
-- before running this file against an existing database.
create table public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  pro_id uuid not null references public.pros(id) on delete cascade,
  new_starts_at timestamptz not null,
  new_ends_at timestamptz not null,
  -- 'expired' is declared in types/sessionpro.ts but not written by any route today.
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  constraint reschedule_requests_valid_range check (new_starts_at < new_ends_at)
);

create index reschedule_requests_booking_idx on public.reschedule_requests (booking_id);
create index reschedule_requests_pro_idx on public.reschedule_requests (pro_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  booking_id uuid unique references public.bookings(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  rating integer not null,
  quote text,
  reviewer_name text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_rating_range check (rating between 1 and 5)
);

create index reviews_published_pro_idx
on public.reviews (pro_id, created_at desc)
where is_published = true;

create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- ---------- QR and tracking ----------

create table public.pro_links (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  label text not null,
  target_path text not null,
  qr_image_path text,
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pro_links_scan_count_nonnegative check (scan_count >= 0)
);

create trigger set_pro_links_updated_at
before update on public.pro_links
for each row execute function public.set_updated_at();

-- ---------- Storage ----------
-- Create a public bucket named `pro-media` in the Supabase dashboard before using
-- these policies. Recommended limits: 5 MB max file size; JPEG, PNG, and WebP.

-- ---------- RLS ----------

alter table public.clubs enable row level security;
alter table public.pros enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.clients enable row level security;
alter table public.booking_holds enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.package_enrollments enable row level security;
alter table public.reschedule_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.pro_links enable row level security;

-- Public club profile data needed for sessionpro.io/clubs/[slug].
create policy "Public can read active clubs"
on public.clubs for select
to anon, authenticated
using (status = 'active');

create policy "Club admins can read their own club"
on public.clubs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Club admins can update their own club"
on public.clubs for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Public profile data needed for sessionpro.io/[slug].
create policy "Public can read active pros"
on public.pros for select
to anon, authenticated
using (status = 'active');

create policy "Pros can read their own profile"
on public.pros for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Pros can update their own profile"
on public.pros for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Club admins need to see their roster's names/status for the roster page,
-- but club_id itself is only ever written via the service-role client.
create policy "Club admins can read their roster"
on public.pros for select
to authenticated
using (
  club_id in (
    select id from public.clubs
    where clubs.user_id = (select auth.uid())
  )
);

create policy "Pros can read active services"
on public.services for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.pros
    where pros.id = services.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can manage their own services"
on public.services for all
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = services.pro_id
      and pros.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.pros
    where pros.id = services.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Public can read active availability rules"
on public.availability_rules for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.pros
    where pros.id = availability_rules.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can manage their own availability rules"
on public.availability_rules for all
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = availability_rules.pro_id
      and pros.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.pros
    where pros.id = availability_rules.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Public can read unavailable exceptions"
on public.availability_exceptions for select
to anon, authenticated
using (
  is_available = false
  and exists (
    select 1 from public.pros
    where pros.id = availability_exceptions.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can manage their own availability exceptions"
on public.availability_exceptions for all
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = availability_exceptions.pro_id
      and pros.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.pros
    where pros.id = availability_exceptions.pro_id
      and pros.user_id = (select auth.uid())
  )
);

-- Clients can be created by unauthenticated booking flow, but cannot be read publicly.
create policy "Anyone can create a client during booking"
on public.clients for insert
to anon, authenticated
with check (true);

-- Slot holds can be created by public booking flow. Conversion should happen server-side later.
create policy "Anyone can create a booking hold"
on public.booking_holds for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.pros
    where pros.id = booking_holds.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can read their own booking holds"
on public.booking_holds for select
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = booking_holds.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Pros can read their own bookings"
on public.bookings for select
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = bookings.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Club admins can read their roster's bookings"
on public.bookings for select
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = bookings.pro_id
      and pros.club_id in (
        select id from public.clubs
        where clubs.user_id = (select auth.uid())
      )
  )
);

-- For the production app, create bookings through a server/RPC after payment.
create policy "Anyone can create a pending booking"
on public.bookings for insert
to anon, authenticated
with check (
  status = 'pending_payment'
  and exists (
    select 1 from public.pros
    where pros.id = bookings.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can read payments for their bookings"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.bookings
    join public.pros on pros.id = bookings.pro_id
    where bookings.id = payments.booking_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Pros can read their own package enrollments"
on public.package_enrollments for select
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = package_enrollments.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Pros can read their own reschedule requests"
on public.reschedule_requests for select
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = reschedule_requests.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Public can read published reviews"
on public.reviews for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1 from public.pros
    where pros.id = reviews.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can manage their own reviews"
on public.reviews for all
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = reviews.pro_id
      and pros.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.pros
    where pros.id = reviews.pro_id
      and pros.user_id = (select auth.uid())
  )
);

create policy "Pros can manage their own links"
on public.pro_links for all
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = pro_links.pro_id
      and pros.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.pros
    where pros.id = pro_links.pro_id
      and pros.user_id = (select auth.uid())
  )
);

-- Public profile photos are readable by design. Writes are restricted to signed-in users.
create policy "Public can read pro media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'pro-media');

create policy "Authenticated users can upload pro media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'pros'
  and exists (
    select 1 from public.pros
    where pros.id = public.safe_uuid((storage.foldername(name))[2])
      and pros.user_id = (select auth.uid())
  )
);

create policy "Authenticated users can update pro media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'pros'
  and exists (
    select 1 from public.pros
    where pros.id = public.safe_uuid((storage.foldername(name))[2])
      and pros.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'pros'
  and exists (
    select 1 from public.pros
    where pros.id = public.safe_uuid((storage.foldername(name))[2])
      and pros.user_id = (select auth.uid())
  )
);

create policy "Authenticated users can delete pro media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'pros'
  and exists (
    select 1 from public.pros
    where pros.id = public.safe_uuid((storage.foldername(name))[2])
      and pros.user_id = (select auth.uid())
  )
);

-- Club logos share the same bucket under a clubs/{clubId}/... prefix.
create policy "Authenticated users can upload club media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'clubs'
  and exists (
    select 1 from public.clubs
    where clubs.id = public.safe_uuid((storage.foldername(name))[2])
      and clubs.user_id = (select auth.uid())
  )
);

create policy "Authenticated users can update club media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'clubs'
  and exists (
    select 1 from public.clubs
    where clubs.id = public.safe_uuid((storage.foldername(name))[2])
      and clubs.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'pro-media'
  and (storage.foldername(name))[1] = 'clubs'
  and exists (
    select 1 from public.clubs
    where clubs.id = public.safe_uuid((storage.foldername(name))[2])
      and clubs.user_id = (select auth.uid())
  )
);
