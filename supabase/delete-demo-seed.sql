-- Run this against your Supabase project BEFORE Kenyon signs up.
-- It removes the hardcoded demo row so the kenyonmatua slug is free to claim
-- through the real signup/onboarding flow.
--
-- Services and availability_rules cascade-delete automatically via ON DELETE CASCADE.

delete from public.pros
where id = '11111111-1111-4111-8111-111111111111';
