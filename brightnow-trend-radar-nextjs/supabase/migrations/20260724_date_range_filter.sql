-- BrightNow Trend Radar V7 migration
-- Run this ONCE in Supabase SQL Editor before deploying the V7 code.
-- Existing records are preserved.

begin;

-- The old V6 columns stay in the database for history, but new records no longer use them.
alter table public.trends
  alter column submission_week drop not null;

alter table public.actions
  alter column workspace_week drop not null,
  alter column work_period drop not null;

alter table public.trends
  add column if not exists observed_date date;

update public.trends
set observed_date = (created_at at time zone 'Asia/Jakarta')::date
where observed_date is null;

alter table public.trends
  alter column observed_date set default current_date,
  alter column observed_date set not null;

alter table public.actions
  add column if not exists start_date date,
  add column if not exists end_date date;

-- Old free-text work periods cannot be converted reliably.
-- Existing actions receive their creation date and can be edited later in the app.
update public.actions
set
  start_date = coalesce(start_date, (created_at at time zone 'Asia/Jakarta')::date),
  end_date = coalesce(end_date, (created_at at time zone 'Asia/Jakarta')::date)
where start_date is null or end_date is null;

alter table public.actions
  alter column start_date set default current_date,
  alter column start_date set not null,
  alter column end_date set default current_date,
  alter column end_date set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'action_date_order'
      and conrelid = 'public.actions'::regclass
  ) then
    alter table public.actions
      add constraint action_date_order check (start_date <= end_date);
  end if;
end $$;

alter table public.learnings
  add column if not exists published_date date;

update public.learnings
set published_date = (published_at at time zone 'Asia/Jakarta')::date
where published_date is null;

alter table public.learnings
  alter column published_date set default current_date,
  alter column published_date set not null;

create index if not exists idx_trends_observed_date
  on public.trends(observed_date);

create index if not exists idx_actions_date_range
  on public.actions(start_date, end_date);

create index if not exists idx_learnings_published_date
  on public.learnings(published_date);

commit;
