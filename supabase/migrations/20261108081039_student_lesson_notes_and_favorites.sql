create table if not exists public.lesson_study_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  is_favorite boolean not null default false,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  constraint lesson_study_tools_user_lesson_key unique (user_id, lesson_id),
  constraint lesson_study_tools_notes_length check (char_length(notes) <= 12000)
);

alter table public.lesson_study_tools enable row level security;

drop policy if exists "Students can read their lesson study tools" on public.lesson_study_tools;
create policy "Students can read their lesson study tools"
on public.lesson_study_tools for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Students can create their lesson study tools" on public.lesson_study_tools;
create policy "Students can create their lesson study tools"
on public.lesson_study_tools for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Students can update their lesson study tools" on public.lesson_study_tools;
create policy "Students can update their lesson study tools"
on public.lesson_study_tools for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.lesson_study_tools to authenticated;
