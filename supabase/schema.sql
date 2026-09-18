create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'analyst', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  address_line1 text not null,
  city text not null,
  state text not null,
  postal_code text,
  source_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  report_type text not null check (report_type in ('listing_price', 'offer_price')),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'approved', 'archived')),
  title text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (report_id, version_number)
);

create table if not exists public.accuracy_reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  predicted_value numeric,
  observed_value numeric,
  error_value numeric,
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists properties_workspace_idx on public.properties(workspace_id, created_at desc);
create index if not exists reports_workspace_idx on public.reports(workspace_id, updated_at desc);
create index if not exists report_versions_report_idx on public.report_versions(report_id, version_number desc);
create index if not exists accuracy_reviews_workspace_idx on public.accuracy_reviews(workspace_id, created_at desc);
create index if not exists audit_events_workspace_idx on public.audit_events(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.add_workspace_owner()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.properties enable row level security;
alter table public.reports enable row level security;
alter table public.report_versions enable row level security;
alter table public.accuracy_reviews enable row level security;
alter table public.audit_events enable row level security;

create policy "members can view workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "authenticated users can create workspaces" on public.workspaces for insert with check (auth.uid() = created_by);
create policy "admins can update workspaces" on public.workspaces for update using (public.has_workspace_role(id, array['owner','admin'])) with check (public.has_workspace_role(id, array['owner','admin']));

create policy "members can view memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "owners and admins manage memberships" on public.workspace_members for insert with check (public.has_workspace_role(workspace_id, array['owner','admin']));
create policy "owners and admins update memberships" on public.workspace_members for update using (public.has_workspace_role(workspace_id, array['owner','admin'])) with check (public.has_workspace_role(workspace_id, array['owner','admin']));
create policy "owners and admins remove memberships" on public.workspace_members for delete using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members can view properties" on public.properties for select using (public.is_workspace_member(workspace_id));
create policy "analysts can create properties" on public.properties for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']) and auth.uid() = created_by);
create policy "analysts can update properties" on public.properties for update using (public.has_workspace_role(workspace_id, array['owner','admin','analyst'])) with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create policy "admins delete properties" on public.properties for delete using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members can view reports" on public.reports for select using (public.is_workspace_member(workspace_id));
create policy "analysts can create reports" on public.reports for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']) and auth.uid() = created_by);
create policy "analysts can update reports" on public.reports for update using (public.has_workspace_role(workspace_id, array['owner','admin','analyst'])) with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create policy "admins delete reports" on public.reports for delete using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members can view report versions" on public.report_versions for select using (public.is_workspace_member(workspace_id));
create policy "analysts create report versions" on public.report_versions for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']) and auth.uid() = created_by);

create policy "members can view accuracy reviews" on public.accuracy_reviews for select using (public.is_workspace_member(workspace_id));
create policy "analysts manage accuracy reviews" on public.accuracy_reviews for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));
create policy "analysts update accuracy reviews" on public.accuracy_reviews for update using (public.has_workspace_role(workspace_id, array['owner','admin','analyst'])) with check (public.has_workspace_role(workspace_id, array['owner','admin','analyst']));

create policy "members can view audit events" on public.audit_events for select using (public.is_workspace_member(workspace_id));
create policy "members can create audit events" on public.audit_events for insert with check (public.is_workspace_member(workspace_id) and auth.uid() = actor_user_id);

create trigger workspace_owner_after_insert
after insert on public.workspaces
for each row execute function public.add_workspace_owner();

create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger properties_updated_at before update on public.properties for each row execute function public.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
create trigger accuracy_reviews_updated_at before update on public.accuracy_reviews for each row execute function public.set_updated_at();
