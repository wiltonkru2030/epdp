-- EPDP initial schema: profiles, lessons, progress and assessment attempts.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  content text not null default '',
  level text not null default 'iniciante' check (level in ('iniciante', 'intermediario', 'avancado')),
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  score numeric(5,2),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null,
  score numeric(5,2) not null default 0,
  total_questions integer not null default 0 check (total_questions >= 0),
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_progress_user_id_idx on public.user_progress(user_id);
create index if not exists user_progress_lesson_id_idx on public.user_progress(lesson_id);
create index if not exists assessment_attempts_user_created_idx on public.assessment_attempts(user_id, created_at desc);
create index if not exists lessons_published_position_idx on public.lessons(published, position);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'A alteração de permissões não é permitida por esta operação.';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger before update on public.profiles
for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;
alter table public.assessment_attempts enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Read published lessons" on public.lessons;
create policy "Read published lessons" on public.lessons for select to authenticated
using (published = true or exists (
  select 1 from public.profiles
  where id = (select auth.uid()) and role = 'admin'
));

drop policy if exists "Read own progress" on public.user_progress;
create policy "Read own progress" on public.user_progress for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Insert own progress" on public.user_progress;
create policy "Insert own progress" on public.user_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "Update own progress" on public.user_progress;
create policy "Update own progress" on public.user_progress for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Read own assessment attempts" on public.assessment_attempts;
create policy "Read own assessment attempts" on public.assessment_attempts for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Insert own assessment attempts" on public.assessment_attempts;
create policy "Insert own assessment attempts" on public.assessment_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Expose only the operations needed by signed-in students through the Data API.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.lessons to authenticated;
grant select, insert, update on public.user_progress to authenticated;
grant select, insert on public.assessment_attempts to authenticated;

-- If the project has a pre-existing RLS auto-enable RPC, keep it out of the Data API.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
