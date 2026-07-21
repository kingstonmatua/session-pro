-- Club feature: multi-pro club booking + self-service club dashboard
-- Run this in the Supabase SQL editor.

-- 1. Club entity
do $$ begin
  create type public.club_status as enum ('draft', 'active', 'paused');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.clubs (
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

drop trigger if exists set_clubs_updated_at on public.clubs;
create trigger set_clubs_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

-- 2. Link pros to a club (nullable — most pros stay solo)
alter table public.pros
  add column if not exists club_id uuid references public.clubs(id) on delete set null;

alter table public.pros
  add column if not exists stripe_connect_account_id text;

create index if not exists pros_club_id_idx on public.pros (club_id);

-- 3. RLS
alter table public.clubs enable row level security;

drop policy if exists "Public can read active clubs" on public.clubs;
create policy "Public can read active clubs"
on public.clubs for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Club admins can read their own club" on public.clubs;
create policy "Club admins can read their own club"
on public.clubs for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Club admins can update their own club" on public.clubs;
create policy "Club admins can update their own club"
on public.clubs for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Club admins can read their roster" on public.pros;
create policy "Club admins can read their roster"
on public.pros for select
to authenticated
using (
  club_id in (
    select id from public.clubs
    where clubs.user_id = (select auth.uid())
  )
);

drop policy if exists "Club admins can read their roster's bookings" on public.bookings;
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

-- 4. Club logos share the pro-media bucket under a clubs/{clubId}/... prefix.
drop policy if exists "Authenticated users can upload club media" on storage.objects;
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

drop policy if exists "Authenticated users can update club media" on storage.objects;
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
