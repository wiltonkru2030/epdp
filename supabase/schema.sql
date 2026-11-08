-- EPDP: estrutura inicial do banco de dados.
-- Execute no SQL Editor do projeto Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

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
  total_questions integer not null default 0,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;
alter table public.assessment_attempts enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Read published lessons" on public.lessons;
create policy "Read published lessons" on public.lessons for select to authenticated using (published = true or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Manage own progress" on public.user_progress;
create policy "Read own progress" on public.user_progress for select to authenticated using (auth.uid() = user_id);
create policy "Insert own progress" on public.user_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own progress" on public.user_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Read own assessment attempts" on public.assessment_attempts;
create policy "Read own assessment attempts" on public.assessment_attempts for select to authenticated using (auth.uid() = user_id);
create policy "Insert own assessment attempts" on public.assessment_attempts for insert to authenticated with check (auth.uid() = user_id);

-- Não existe política pública para promover usuários a administrador.
-- Atribua o primeiro administrador manualmente, após verificar o usuário:
-- update public.profiles set role = 'admin' where id = 'UUID_DO_USUARIO';
