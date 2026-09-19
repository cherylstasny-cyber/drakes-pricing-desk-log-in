-- Search by Design + shared product gating.
-- Purely additive on top of supabase/schema.sql: no existing table is
-- altered or dropped, and existing Drake's Pricing behavior is unchanged
-- (every workspace still gets a 'pricing_desk' subscription automatically,
-- matching pre-migration behavior where Pricing was the only product).
--
-- Reuses the existing workspaces / workspace_members / is_workspace_member /
-- has_workspace_role infrastructure from schema.sql rather than duplicating it.

-- ---------------------------------------------------------------------------
-- Shared: which products a workspace has access to.
-- Manual/admin-managed for now (no billing integration yet). Swap the insert
-- source for real Stripe webhooks later without changing the shape callers read.
-- ---------------------------------------------------------------------------
create table if not exists public.product_subscriptions (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product text not null check (product in ('pricing_desk', 'search_by_design')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, product)
);

alter table public.product_subscriptions enable row level security;
create policy "members can view product subscriptions" on public.product_subscriptions
  for select using (public.is_workspace_member(workspace_id));

create trigger product_subscriptions_updated_at before update on public.product_subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.add_default_pricing_subscription()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.product_subscriptions (workspace_id, product, status)
  values (new.id, 'pricing_desk', 'active')
  on conflict (workspace_id, product) do nothing;
  return new;
end;
$$;

create trigger workspace_pricing_subscription_after_insert
after insert on public.workspaces
for each row execute function public.add_default_pricing_subscription();

-- Config-driven, admin-editable subscription plan catalog (public marketing content).
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  monthly_price_cents integer not null,
  annual_price_cents integer,
  summary text not null,
  features jsonb not null default '[]'::jsonb,
  plan_limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.subscription_plans enable row level security;
create policy "anyone can view active plans" on public.subscription_plans
  for select using (is_active);

create trigger subscription_plans_updated_at before update on public.subscription_plans
  for each row execute function public.set_updated_at();

insert into public.subscription_plans (key, name, monthly_price_cents, summary, features, plan_limits, sort_order)
values
  ('pricing_desk', 'Drake''s Pricing', 7900, 'Pricing and offer/listing analyses.',
    '["Listing price reports","Offer price reports","Market direction"]'::jsonb, '{}'::jsonb, 1),
  ('search_by_design', 'Search by Design', 9900, '1 agent, up to 10 active client watches, AI niche-property monitoring, client + agent alerts.',
    '["AI niche-property monitoring","Client + agent alerts"]'::jsonb, '{"agent_seats":1,"active_watches":10}'::jsonb, 2),
  ('drake_pro', 'Drake Pro', 14900, 'Pricing + Search by Design, up to 25 active watches, Property Intelligence, buyer-match analysis, integrated pricing action.',
    '["Property Intelligence","Buyer-match analysis","Integrated Pricing action"]'::jsonb, '{"agent_seats":1,"active_watches":25}'::jsonb, 3),
  ('team', 'Team', 29900, 'Up to 5 agent seats, up to 100 active watches, shared administration, team analytics, Pricing + Search by Design.',
    '["Shared administration","Team analytics"]'::jsonb, '{"agent_seats":5,"active_watches":100}'::jsonb, 4),
  ('brokerage', 'Brokerage / Enterprise', 0, 'Custom MLS/data-source configuration, higher limits, SSO/API/white-label options where appropriate.',
    '["Custom MLS/data-source configuration","SSO / API / white-label (where appropriate)"]'::jsonb, '{}'::jsonb, 5)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Extensible taxonomy reference tables (Category -> Attribute). Values,
-- confidence, and evidence live on sbd_property_traits, not here, so this
-- schema never needs to change as attributes are added -- only rows do.
-- Seeded/maintained from lib/search-by-design/taxonomy.ts; not directly
-- user-editable yet.
-- ---------------------------------------------------------------------------
create table if not exists public.sbd_taxonomy_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.sbd_taxonomy_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.sbd_taxonomy_categories(id) on delete cascade,
  key text not null,
  label text not null,
  sort_order integer not null default 0,
  unique (category_id, key)
);

alter table public.sbd_taxonomy_categories enable row level security;
alter table public.sbd_taxonomy_attributes enable row level security;
create policy "anyone can view taxonomy categories" on public.sbd_taxonomy_categories for select using (true);
create policy "anyone can view taxonomy attributes" on public.sbd_taxonomy_attributes for select using (true);

-- ---------------------------------------------------------------------------
-- Clients and watches (tenant-scoped like properties/reports).
-- ---------------------------------------------------------------------------
create table if not exists public.sbd_clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sbd_watches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.sbd_clients(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  price_min numeric,
  price_max numeric,
  raw_preferences text,
  alert_threshold numeric not null default 70 check (alert_threshold between 0 and 100),
  last_alert_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sbd_watch_geographies (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid not null references public.sbd_watches(id) on delete cascade,
  label text not null,
  geography_type text not null default 'area' check (geography_type in ('area', 'radius', 'polygon')),
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sbd_watch_criteria (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid not null references public.sbd_watches(id) on delete cascade,
  category_key text not null,
  attribute_key text not null,
  target_value text,
  requirement text not null check (requirement in ('MUST', 'PREFER', 'AVOID')),
  weight numeric not null default 1,
  confidence_threshold numeric not null default 0.6 check (confidence_threshold between 0 and 1),
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Property Intelligence: one record per property/listing, analyzed once and
-- compared against every relevant watch (never re-analyzed per client).
-- ---------------------------------------------------------------------------
create table if not exists public.sbd_properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  external_listing_id text not null,
  address_line1 text not null,
  city text not null,
  state text not null,
  postal_code text,
  price numeric,
  status text not null check (status in ('coming_soon', 'new', 'active', 'reactivated', 'pending', 'sold', 'off_market')),
  list_date timestamptz,
  raw_source jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, external_listing_id)
);

create table if not exists public.sbd_listing_status_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.sbd_properties(id) on delete cascade,
  status text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  source text
);

create table if not exists public.sbd_property_traits (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.sbd_properties(id) on delete cascade,
  category_key text not null,
  attribute_key text not null,
  value text not null,
  confidence numeric not null check (confidence between 0 and 1),
  source_type text not null check (source_type in ('photo', 'remarks', 'structured', 'historical')),
  evidence text not null,
  model_version text not null,
  analyzed_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz
);

create index if not exists sbd_property_traits_property_idx on public.sbd_property_traits(property_id);

-- ---------------------------------------------------------------------------
-- Matching, alerts, and engagement.
-- ---------------------------------------------------------------------------
create table if not exists public.sbd_match_results (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid not null references public.sbd_watches(id) on delete cascade,
  property_id uuid not null references public.sbd_properties(id) on delete cascade,
  score numeric not null check (score between 0 and 100),
  passed boolean not null,
  reasons jsonb not null default '[]'::jsonb,
  must_failures jsonb not null default '[]'::jsonb,
  missing_preferred jsonb not null default '[]'::jsonb,
  scored_at timestamptz not null default timezone('utc', now())
);

create index if not exists sbd_match_results_watch_idx on public.sbd_match_results(watch_id, scored_at desc);

create table if not exists public.sbd_alerts (
  id uuid primary key default gen_random_uuid(),
  match_result_id uuid not null references public.sbd_match_results(id) on delete cascade,
  client_id uuid not null references public.sbd_clients(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'opened', 'clicked', 'saved', 'dismissed', 'showing_requested')),
  buyer_email_id text,
  agent_email_id text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger sbd_alerts_updated_at before update on public.sbd_alerts
  for each row execute function public.set_updated_at();

create table if not exists public.sbd_client_activity (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.sbd_clients(id) on delete cascade,
  alert_id uuid references public.sbd_alerts(id) on delete set null,
  event_type text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.sbd_client_feedback (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.sbd_clients(id) on delete cascade,
  property_id uuid not null references public.sbd_properties(id) on delete cascade,
  feedback_type text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- Row level security: same tenant-isolation pattern as schema.sql.
-- ---------------------------------------------------------------------------
alter table public.sbd_clients enable row level security;
alter table public.sbd_watches enable row level security;
alter table public.sbd_watch_geographies enable row level security;
alter table public.sbd_watch_criteria enable row level security;
alter table public.sbd_properties enable row level security;
alter table public.sbd_listing_status_events enable row level security;
alter table public.sbd_property_traits enable row level security;
alter table public.sbd_match_results enable row level security;
alter table public.sbd_alerts enable row level security;
alter table public.sbd_client_activity enable row level security;
alter table public.sbd_client_feedback enable row level security;

create policy "members can view clients" on public.sbd_clients for select using (public.is_workspace_member(workspace_id));
create policy "analysts manage clients" on public.sbd_clients for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']) and auth.uid() = created_by);
create policy "analysts update clients" on public.sbd_clients for update using (public.has_workspace_role(workspace_id, array['owner','admin','analyst'])) with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create policy "admins delete clients" on public.sbd_clients for delete using (public.has_workspace_role(workspace_id, array['owner','admin']));
create trigger sbd_clients_updated_at before update on public.sbd_clients for each row execute function public.set_updated_at();

create policy "members can view watches" on public.sbd_watches for select using (public.is_workspace_member(workspace_id));
create policy "analysts manage watches" on public.sbd_watches for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']) and auth.uid() = created_by);
create policy "analysts update watches" on public.sbd_watches for update using (public.has_workspace_role(workspace_id, array['owner','admin','analyst'])) with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create policy "admins delete watches" on public.sbd_watches for delete using (public.has_workspace_role(workspace_id, array['owner','admin']));
create trigger sbd_watches_updated_at before update on public.sbd_watches for each row execute function public.set_updated_at();

create policy "members can view watch geographies" on public.sbd_watch_geographies for select using (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.is_workspace_member(w.workspace_id)));
create policy "analysts manage watch geographies" on public.sbd_watch_geographies for insert with check (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.has_workspace_role(w.workspace_id, array['owner','admin','analyst'])));
create policy "analysts delete watch geographies" on public.sbd_watch_geographies for delete using (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.has_workspace_role(w.workspace_id, array['owner','admin','analyst'])));

create policy "members can view watch criteria" on public.sbd_watch_criteria for select using (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.is_workspace_member(w.workspace_id)));
create policy "analysts manage watch criteria" on public.sbd_watch_criteria for insert with check (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.has_workspace_role(w.workspace_id, array['owner','admin','analyst'])));
create policy "analysts delete watch criteria" on public.sbd_watch_criteria for delete using (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.has_workspace_role(w.workspace_id, array['owner','admin','analyst'])));

create policy "members can view properties" on public.sbd_properties for select using (public.is_workspace_member(workspace_id));
create policy "analysts manage sbd properties" on public.sbd_properties for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create policy "analysts update sbd properties" on public.sbd_properties for update using (public.has_workspace_role(workspace_id, array['owner','admin','analyst'])) with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create trigger sbd_properties_updated_at before update on public.sbd_properties for each row execute function public.set_updated_at();

create policy "members can view listing status events" on public.sbd_listing_status_events for select using (
  exists (select 1 from public.sbd_properties p where p.id = property_id and public.is_workspace_member(p.workspace_id)));
create policy "analysts insert listing status events" on public.sbd_listing_status_events for insert with check (
  exists (select 1 from public.sbd_properties p where p.id = property_id and public.has_workspace_role(p.workspace_id, array['owner','admin','analyst'])));

create policy "members can view property traits" on public.sbd_property_traits for select using (
  exists (select 1 from public.sbd_properties p where p.id = property_id and public.is_workspace_member(p.workspace_id)));
create policy "analysts insert property traits" on public.sbd_property_traits for insert with check (
  exists (select 1 from public.sbd_properties p where p.id = property_id and public.has_workspace_role(p.workspace_id, array['owner','admin','analyst'])));

create policy "members can view match results" on public.sbd_match_results for select using (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.is_workspace_member(w.workspace_id)));
create policy "analysts insert match results" on public.sbd_match_results for insert with check (
  exists (select 1 from public.sbd_watches w where w.id = watch_id and public.has_workspace_role(w.workspace_id, array['owner','admin','analyst'])));

create policy "members can view alerts" on public.sbd_alerts for select using (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.is_workspace_member(c.workspace_id)));
create policy "analysts manage alerts" on public.sbd_alerts for insert with check (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.has_workspace_role(c.workspace_id, array['owner','admin','analyst'])));
create policy "analysts update alerts" on public.sbd_alerts for update using (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.is_workspace_member(c.workspace_id))
) with check (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.is_workspace_member(c.workspace_id)));

create policy "members can view client activity" on public.sbd_client_activity for select using (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.is_workspace_member(c.workspace_id)));
create policy "analysts insert client activity" on public.sbd_client_activity for insert with check (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.has_workspace_role(c.workspace_id, array['owner','admin','analyst'])));

create policy "members can view client feedback" on public.sbd_client_feedback for select using (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.is_workspace_member(c.workspace_id)));
create policy "analysts insert client feedback" on public.sbd_client_feedback for insert with check (
  exists (select 1 from public.sbd_clients c where c.id = client_id and public.has_workspace_role(c.workspace_id, array['owner','admin','analyst'])));

create index if not exists sbd_clients_workspace_idx on public.sbd_clients(workspace_id, created_at desc);
create index if not exists sbd_watches_workspace_idx on public.sbd_watches(workspace_id, updated_at desc);
create index if not exists sbd_watches_client_idx on public.sbd_watches(client_id);
create index if not exists sbd_properties_workspace_idx on public.sbd_properties(workspace_id, created_at desc);
create index if not exists sbd_alerts_client_idx on public.sbd_alerts(client_id, created_at desc);
