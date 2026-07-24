-- BrightNow Trend Radar
-- Run this entire file in Supabase: SQL Editor → New query → Run.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('contributor', 'curator', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'trend_board_status') then
    create type public.trend_board_status as enum (
      'validate', 'watchlist', 'ready', 'activated', 'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'action_status') then
    create type public.action_status as enum (
      'planned', 'in_progress', 'needs_review', 'done'
    );
  end if;
end $$;

create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  division_id uuid references public.divisions(id) on delete set null,
  role public.user_role not null default 'contributor',
  pin_hash text,
  photo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privileged_user_requires_pin
    check (role = 'contributor' or pin_hash is not null)
);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_active_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  observed_date date not null default current_date,
  title text not null,
  category text not null,
  platform text not null,
  momentum text not null,
  source_url text,
  evidence_description text,
  relevance text not null,
  suggested_action text,
  board_status public.trend_board_status not null default 'validate',
  submitted_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trend_status_history (
  id uuid primary key default gen_random_uuid(),
  trend_id uuid not null references public.trends(id) on delete cascade,
  previous_status public.trend_board_status,
  new_status public.trend_board_status not null,
  changed_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.trend_votes (
  trend_id uuid not null references public.trends(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trend_id, user_id)
);

create table if not exists public.trend_scores (
  id uuid primary key default gen_random_uuid(),
  trend_id uuid not null references public.trends(id) on delete cascade,
  curator_id uuid not null references public.app_users(id),
  momentum_score smallint not null check (momentum_score between 1 and 5),
  gen_z_relevance smallint not null check (gen_z_relevance between 1 and 5),
  brightnow_relevance smallint not null check (brightnow_relevance between 1 and 5),
  adaptability smallint not null check (adaptability between 1 and 5),
  speed_required smallint not null check (speed_required between 1 and 5),
  business_potential smallint not null check (business_potential between 1 and 5),
  feasibility smallint not null check (feasibility between 1 and 5),
  final_score numeric(5,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trend_id, curator_id)
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  start_date date not null default current_date,
  end_date date not null default current_date,
  source_trend_id uuid references public.trends(id) on delete set null,
  title text not null,
  accountable_user_id uuid not null references public.app_users(id),
  status public.action_status not null default 'planned',
  created_by uuid not null references public.app_users(id),
  updated_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint action_date_order check (start_date <= end_date)
);

create table if not exists public.learnings (
  id uuid primary key default gen_random_uuid(),
  source_action_id uuid not null unique references public.actions(id) on delete cascade,
  source_trend_id uuid references public.trends(id) on delete set null,
  action_owner_id uuid not null references public.app_users(id),
  title text not null,
  result_kpi text not null,
  what_worked text,
  what_didnt_work text,
  why_it_happened text,
  reusable_principle text not null,
  evidence_url text,
  published_date date not null default current_date,
  published_at timestamptz not null default now()
);

create table if not exists public.sheet_sync_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('trend','action','learning')),
  entity_id uuid not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_app_users_display_name_ci on public.app_users(lower(display_name));
create index if not exists idx_trends_observed_date on public.trends(observed_date);
create index if not exists idx_trends_status on public.trends(board_status);
create index if not exists idx_actions_date_range on public.actions(start_date, end_date);
create index if not exists idx_actions_source_trend on public.actions(source_trend_id);
create index if not exists idx_learnings_published_date on public.learnings(published_date);
create index if not exists idx_sessions_hash on public.app_sessions(token_hash);
create index if not exists idx_sync_status on public.sheet_sync_queue(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists divisions_set_updated_at on public.divisions;
create trigger divisions_set_updated_at
before update on public.divisions
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on public.app_users;
create trigger users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists trends_set_updated_at on public.trends;
create trigger trends_set_updated_at
before update on public.trends
for each row execute function public.set_updated_at();

drop trigger if exists scores_set_updated_at on public.trend_scores;
create trigger scores_set_updated_at
before update on public.trend_scores
for each row execute function public.set_updated_at();

drop trigger if exists actions_set_updated_at on public.actions;
create trigger actions_set_updated_at
before update on public.actions
for each row execute function public.set_updated_at();

-- Atomic transaction:
-- Action becomes Done only when its Action Owner also publishes a learning.
create or replace function public.complete_action_with_learning(
  p_action_id uuid,
  p_user_id uuid,
  p_title text,
  p_result_kpi text,
  p_what_worked text,
  p_what_didnt_work text,
  p_why_it_happened text,
  p_reusable_principle text,
  p_evidence_url text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action public.actions%rowtype;
  v_learning_id uuid;
begin
  select *
  into v_action
  from public.actions
  where id = p_action_id
  for update;

  if not found then
    raise exception 'ACTION_NOT_FOUND';
  end if;

  if v_action.accountable_user_id <> p_user_id then
    raise exception 'ONLY_ACTION_OWNER_CAN_COMPLETE';
  end if;

  if exists (
    select 1 from public.learnings where source_action_id = p_action_id
  ) then
    raise exception 'LEARNING_ALREADY_EXISTS';
  end if;

  update public.actions
  set
    status = 'done',
    updated_by = p_user_id,
    updated_at = now()
  where id = p_action_id;

  insert into public.learnings (
    source_action_id,
    source_trend_id,
    action_owner_id,
    title,
    result_kpi,
    what_worked,
    what_didnt_work,
    why_it_happened,
    reusable_principle,
    evidence_url
  )
  values (
    p_action_id,
    v_action.source_trend_id,
    p_user_id,
    p_title,
    p_result_kpi,
    nullif(p_what_worked, ''),
    nullif(p_what_didnt_work, ''),
    nullif(p_why_it_happened, ''),
    p_reusable_principle,
    nullif(p_evidence_url, '')
  )
  returning id into v_learning_id;

  return v_learning_id;
end;
$$;

revoke all on function public.complete_action_with_learning(
  uuid,uuid,text,text,text,text,text,text,text
) from public;
grant execute on function public.complete_action_with_learning(
  uuid,uuid,text,text,text,text,text,text,text
) to service_role;

-- Private avatar bucket. The app accesses it only through server-side Supabase.
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The browser never talks to Supabase directly. All database calls use
-- Next.js Route Handlers and a server-only Supabase secret key.
alter table public.divisions enable row level security;
alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.trends enable row level security;
alter table public.trend_status_history enable row level security;
alter table public.trend_votes enable row level security;
alter table public.trend_scores enable row level security;
alter table public.actions enable row level security;
alter table public.learnings enable row level security;
alter table public.sheet_sync_queue enable row level security;

revoke all on all tables in schema public from anon, authenticated;
