-- Optional seed data for the first SessionPro demo profile.
-- Run after supabase/schema.sql if you want Kenyon available in the database.

insert into public.pros (
  id,
  slug,
  full_name,
  discipline,
  title,
  club_or_business,
  bio,
  location_city,
  location_region,
  timezone,
  session_mode,
  years_experience,
  profile_photo_path,
  rating_average,
  rating_count,
  status
) values (
  '11111111-1111-4111-8111-111111111111',
  'kenyonmatua',
  'Kenyon Matua',
  'Golf Instruction',
  'Assistant Golf Professional',
  'Alpine Country Club',
  'Kenyon Matua is an Assistant Golf Professional at Alpine Country Club in Highland, Utah, with five years of hands-on instruction experience across multiple clubs. Kenyon specializes in helping golfers of all skill levels build a more consistent, confident game.',
  'Highland',
  'UT',
  'America/Denver',
  'in_person',
  5,
  'pros/11111111-1111-4111-8111-111111111111/profile.jpg',
  4.9,
  0,
  'active'
) on conflict (id) do update set
  slug = excluded.slug,
  full_name = excluded.full_name,
  discipline = excluded.discipline,
  title = excluded.title,
  club_or_business = excluded.club_or_business,
  bio = excluded.bio,
  location_city = excluded.location_city,
  location_region = excluded.location_region,
  timezone = excluded.timezone,
  session_mode = excluded.session_mode,
  years_experience = excluded.years_experience,
  profile_photo_path = excluded.profile_photo_path,
  rating_average = excluded.rating_average,
  rating_count = excluded.rating_count,
  status = excluded.status;

insert into public.services (
  id,
  pro_id,
  kind,
  name,
  level,
  session_count,
  duration_minutes,
  buffer_minutes,
  price_cents,
  compare_at_price_cents,
  sort_order
) values
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111111',
    'single',
    'Beginner lesson',
    'Beginner',
    1,
    60,
    15,
    8000,
    null,
    10
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111111',
    'single',
    'Advanced lesson',
    'Advanced',
    1,
    60,
    15,
    10000,
    null,
    20
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111111',
    'package',
    '5-Session Pack',
    'Beginner',
    5,
    60,
    15,
    37500,
    40000,
    30
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    '11111111-1111-4111-8111-111111111111',
    'package',
    '5-Session Pack',
    'Advanced',
    5,
    60,
    15,
    47500,
    50000,
    40
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    '11111111-1111-4111-8111-111111111111',
    'package',
    '10-Session Pack',
    'Beginner',
    10,
    60,
    15,
    72500,
    80000,
    50
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    '11111111-1111-4111-8111-111111111111',
    'package',
    '10-Session Pack',
    'Advanced',
    10,
    60,
    15,
    92500,
    100000,
    60
  )
on conflict (id) do update set
  kind = excluded.kind,
  name = excluded.name,
  level = excluded.level,
  session_count = excluded.session_count,
  duration_minutes = excluded.duration_minutes,
  buffer_minutes = excluded.buffer_minutes,
  price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.availability_rules (
  pro_id,
  day,
  start_time,
  end_time
) values
  ('11111111-1111-4111-8111-111111111111', 'mon', '08:00', '18:00'),
  ('11111111-1111-4111-8111-111111111111', 'tue', '08:00', '18:00'),
  ('11111111-1111-4111-8111-111111111111', 'wed', '08:00', '18:00'),
  ('11111111-1111-4111-8111-111111111111', 'thu', '08:00', '18:00'),
  ('11111111-1111-4111-8111-111111111111', 'fri', '08:00', '18:00')
on conflict do nothing;

