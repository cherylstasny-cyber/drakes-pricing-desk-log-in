-- Shared product gating.
-- Purely additive on top of schema.sql: no existing table is altered or
-- dropped, and existing Drake's Pricing behavior is unchanged (every
-- workspace still gets a 'pricing_desk' subscription automatically).
--
-- This table (and subscription_plans below) is shared infrastructure: the
-- separately-deployed Design Scout app reads/writes product_subscriptions
-- against this SAME Supabase project rather than owning its own copy, so
-- that a workspace's product access is consistent across both apps.

create table if not exists public.product_subscriptions (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product text not null check (product in ('pricing_desk', 'design_scout')),
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
  ('design_scout', 'Design Scout', 9900, '1 agent, up to 10 active client watches, AI niche-property monitoring, client + agent alerts.',
    '["AI niche-property monitoring","Client + agent alerts"]'::jsonb, '{"agent_seats":1,"active_watches":10}'::jsonb, 2),
  ('drake_pro', 'Drake Pro', 14900, 'Pricing + Design Scout, up to 25 active watches, Property Intelligence, buyer-match analysis, integrated pricing action.',
    '["Property Intelligence","Buyer-match analysis","Integrated Pricing action"]'::jsonb, '{"agent_seats":1,"active_watches":25}'::jsonb, 3),
  ('team', 'Team', 29900, 'Up to 5 agent seats, up to 100 active watches, shared administration, team analytics, Pricing + Design Scout.',
    '["Shared administration","Team analytics"]'::jsonb, '{"agent_seats":5,"active_watches":100}'::jsonb, 4),
  ('brokerage', 'Brokerage / Enterprise', 0, 'Custom MLS/data-source configuration, higher limits, SSO/API/white-label options where appropriate.',
    '["Custom MLS/data-source configuration","SSO / API / white-label (where appropriate)"]'::jsonb, '{}'::jsonb, 5)
on conflict (key) do nothing;
