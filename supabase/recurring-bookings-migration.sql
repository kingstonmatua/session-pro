-- Recurring bookings: pro invites a client to auto-pay per session on a repeating schedule
create table recurring_bookings (
  id                uuid primary key default gen_random_uuid(),
  pro_id            uuid not null references pros(id) on delete cascade,
  client_name       text not null,
  client_email      citext not null,
  service_id        uuid not null references services(id) on delete cascade,
  frequency         text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  status            text not null default 'pending_client'
                      check (status in ('pending_client', 'active', 'cancelled')),
  next_starts_at    timestamptz not null,
  next_ends_at      timestamptz not null,
  last_link_sent_at timestamptz,   -- null = ready to send; set when link sent; cleared when payment received
  created_at        timestamptz not null default now()
);

alter table recurring_bookings enable row level security;

create policy "Pro can manage own recurring_bookings"
  on recurring_bookings for all
  using (pro_id in (select id from pros where user_id = auth.uid()));
