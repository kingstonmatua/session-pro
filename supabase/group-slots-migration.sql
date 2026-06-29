-- Group Sessions Migration
-- Run this in the Supabase SQL editor.

-- 1. Create group_slots table
create table public.group_slots (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references public.pros(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 2,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_slots_capacity_min check (capacity >= 2),
  constraint group_slots_valid_range check (starts_at < ends_at),
  unique (pro_id, starts_at)
);

create index group_slots_pro_time_idx on public.group_slots (pro_id, starts_at);

create trigger set_group_slots_updated_at
before update on public.group_slots
for each row execute function public.set_updated_at();

-- 2. Add group_slot_id to bookings
alter table public.bookings
  add column group_slot_id uuid references public.group_slots(id) on delete set null;

-- 3. Update unique index to only enforce uniqueness for individual (non-group) bookings
drop index bookings_unique_active_slot;

create unique index bookings_unique_active_slot
on public.bookings (pro_id, starts_at, ends_at)
where status in ('pending_payment', 'confirmed') and group_slot_id is null;

-- 4. RLS
alter table public.group_slots enable row level security;

create policy "Public can read group slots for active pros"
on public.group_slots for select
to anon, authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = group_slots.pro_id
      and pros.status = 'active'
  )
);

create policy "Pros can manage their own group slots"
on public.group_slots for all
to authenticated
using (
  exists (
    select 1 from public.pros
    where pros.id = group_slots.pro_id
      and pros.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.pros
    where pros.id = group_slots.pro_id
      and pros.user_id = (select auth.uid())
  )
);
