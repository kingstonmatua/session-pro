-- Per-service cancellation / reschedule / no-show policy
-- Run this in the Supabase SQL editor.
-- All new columns are additive with defaults that reproduce today's hardcoded
-- behavior exactly (24h cancellation window, full refund, pro-only reschedule,
-- no-show forfeits with no refund) — existing bookings are unaffected until a
-- pro edits their service policy in the dashboard.

-- 1. Cancellation, reschedule, and no-show policy fields on services
alter table public.services
  add column if not exists cancellation_window_hours integer not null default 24
    check (cancellation_window_hours >= 0);

alter table public.services
  add column if not exists cancellation_refund_tiers jsonb not null
    default '[{"hours_before": 0, "refund_percent": 100}]'::jsonb;

alter table public.services
  add column if not exists reschedule_window_hours integer not null default 24
    check (reschedule_window_hours >= 0);

alter table public.services
  add column if not exists client_reschedule_limit integer not null default 1
    check (client_reschedule_limit >= 0);

alter table public.services
  add column if not exists no_show_policy text not null default 'forfeit'
    check (no_show_policy in ('forfeit', 'credit'));

-- 2. Distinguish pro-initiated from client-initiated reschedule requests
alter table public.reschedule_requests
  add column if not exists initiated_by text not null default 'pro'
    check (initiated_by in ('pro', 'client'));

alter table public.reschedule_requests
  add column if not exists reason text;

-- 3. Track partial refund amounts (payment_status already has 'partially_refunded')
alter table public.payments
  add column if not exists refunded_amount_cents integer
    check (refunded_amount_cents is null or refunded_amount_cents >= 0);
