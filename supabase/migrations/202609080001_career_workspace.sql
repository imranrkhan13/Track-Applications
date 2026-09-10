-- Additive migration. Existing identity IDs and application rows are preserved.
begin;
create table if not exists public.jobs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null, role text not null, status text not null default 'Saved',
  location text default '', salary text default '', date date, url text default '',
  notes text default '', created_at timestamptz not null default now()
);
alter table public.jobs add column if not exists workspace jsonb not null default '{}'::jsonb;
alter table public.jobs add column if not exists revision integer not null default 0;
alter table public.jobs add column if not exists updated_at timestamptz not null default now();
create or replace function public.career_job_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end; $$;
create trigger career_job_revision_before_update before update on public.jobs
for each row execute function public.career_job_revision();
alter table public.jobs enable row level security;
-- The restrictive policy prevents a pre-existing permissive policy from
-- allowing cross-account access. Ownership cannot be changed by an update.
create policy career_jobs_owner_guard on public.jobs as restrictive for all to authenticated
using ((select auth.uid())::text = user_id::text)
with check ((select auth.uid())::text = user_id::text);
create policy career_jobs_owner_access on public.jobs for all to authenticated
using ((select auth.uid())::text = user_id::text)
with check ((select auth.uid())::text = user_id::text);
grant select, insert, update, delete on public.jobs to authenticated;
revoke all on public.jobs from anon;
-- Rate-limit paid research persistently, not in one server process's memory.
create table public.career_research_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(), calls integer not null default 0
);
alter table public.career_research_usage enable row level security;
create function public.claim_career_research() returns boolean
language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  if auth.uid() is null then return false; end if;
  insert into public.career_research_usage (user_id, calls) values (auth.uid(), 1)
  on conflict (user_id) do update set
    calls = case when public.career_research_usage.window_start < now() - interval '1 hour' then 1 else public.career_research_usage.calls + 1 end,
    window_start = case when public.career_research_usage.window_start < now() - interval '1 hour' then now() else public.career_research_usage.window_start end
  returning calls <= 8 into allowed;
  return allowed;
end; $$;
revoke all on function public.claim_career_research() from public;
grant execute on function public.claim_career_research() to authenticated;
commit;
