-- EPDP learning and assessment security migration
-- Applied to the configured Supabase project. Keep this file as the source of truth.

create table if not exists public.courses (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '',
 slug text not null unique, published boolean not null default false, position integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.modules (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 title text not null, description text not null default '', stage integer not null check(stage > 0),
 position integer not null default 0, published boolean not null default false, created_at timestamptz not null default now(),
 unique(course_id,stage)
);
alter table public.lessons add column if not exists module_id uuid references public.modules(id) on delete set null;
alter table public.lessons add column if not exists learning_objective text not null default '';
alter table public.lessons add column if not exists estimated_minutes integer not null default 15 check(estimated_minutes > 0);

create table if not exists public.assessments (
 id uuid primary key default gen_random_uuid(), module_id uuid references public.modules(id) on delete set null,
 title text not null, description text not null default '',
 assessment_type text not null default 'practice' check(assessment_type in ('lesson','module','general','mock_exam')),
 time_limit_seconds integer check(time_limit_seconds is null or time_limit_seconds > 0),
 published boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.questions (
 id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id) on delete cascade,
 subject text not null, prompt text not null, context_text text not null default '',
 difficulty smallint not null default 1 check(difficulty between 1 and 5), explanation text not null default '',
 review_lesson_id uuid references public.lessons(id) on delete set null, position integer not null default 0,
 published boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.question_options (
 id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete cascade,
 option_label text not null check(length(option_label) between 1 and 8), option_text text not null,
 is_correct boolean not null default false, explanation text not null default '', position integer not null default 0,
 unique(question_id,option_label)
);
alter table public.assessment_attempts add column if not exists assessment_id uuid references public.assessments(id) on delete set null;
alter table public.assessment_attempts add column if not exists duration_seconds integer check(duration_seconds is null or duration_seconds >= 0);
create table if not exists public.user_answers (
 id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
 question_id uuid not null references public.questions(id) on delete cascade,
 selected_option_id uuid references public.question_options(id) on delete set null,
 is_correct boolean not null, created_at timestamptz not null default now(), unique(attempt_id,question_id)
);
create table if not exists public.game_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 game_slug text not null, score integer not null default 0 check(score >= 0),
 correct_count integer not null default 0 check(correct_count >= 0),
 total_count integer not null default 0 check(total_count >= correct_count),
 duration_seconds integer check(duration_seconds is null or duration_seconds >= 0),
 details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.study_recommendations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 subject text not null, reason text not null,
 recommendation_type text not null check(recommendation_type in ('lesson','practice','review')),
 lesson_id uuid references public.lessons(id) on delete set null,
 source_attempt_id uuid references public.assessment_attempts(id) on delete set null,
 status text not null default 'pending' check(status in ('pending','completed','dismissed')),
 created_at timestamptz not null default now()
);

create index if not exists modules_course_position_idx on public.modules(course_id,position);
create index if not exists lessons_module_position_idx on public.lessons(module_id,position);
create index if not exists questions_assessment_position_idx on public.questions(assessment_id,position);
create index if not exists question_options_question_position_idx on public.question_options(question_id,position);
create index if not exists user_answers_attempt_idx on public.user_answers(attempt_id);
create index if not exists game_attempts_user_created_idx on public.game_attempts(user_id,created_at desc);
create index if not exists recommendations_user_status_idx on public.study_recommendations(user_id,status,created_at desc);
create unique index if not exists question_options_one_correct_idx on public.question_options(question_id) where is_correct = true;

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.user_answers enable row level security;
alter table public.game_attempts enable row level security;
alter table public.study_recommendations enable row level security;

drop policy if exists "Read published courses" on public.courses;
create policy "Read published courses" on public.courses for select to anon,authenticated
 using(published or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses" on public.courses for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

drop policy if exists "Read published modules" on public.modules;
create policy "Read published modules" on public.modules for select to anon,authenticated
 using(published or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
drop policy if exists "Admins manage modules" on public.modules;
create policy "Admins manage modules" on public.modules for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

drop policy if exists "Read published assessments" on public.assessments;
create policy "Read published assessments" on public.assessments for select to authenticated
 using(published or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
drop policy if exists "Admins manage assessments" on public.assessments;
create policy "Admins manage assessments" on public.assessments for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

drop policy if exists "Read published questions" on public.questions;
create policy "Read published questions" on public.questions for select to authenticated
 using((published and exists(select 1 from public.assessments a where a.id=assessment_id and a.published)) or
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions" on public.questions for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

drop policy if exists "Read options for published questions" on public.question_options;
create policy "Read options for published questions" on public.question_options for select to authenticated
 using(exists(select 1 from public.questions q join public.assessments a on a.id=q.assessment_id
 where q.id=question_id and q.published and a.published) or
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));
drop policy if exists "Admins manage options" on public.question_options;
create policy "Admins manage options" on public.question_options for all to authenticated
 using(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'))
 with check(exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'));

drop policy if exists "Read own answers" on public.user_answers;
create policy "Read own answers" on public.user_answers for select to authenticated
 using(exists(select 1 from public.assessment_attempts aa where aa.id=attempt_id and aa.user_id=(select auth.uid())));
drop policy if exists "Read own game attempts" on public.game_attempts;
create policy "Read own game attempts" on public.game_attempts for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Read own recommendations" on public.study_recommendations;
create policy "Read own recommendations" on public.study_recommendations for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Update own recommendation status" on public.study_recommendations;
create policy "Update own recommendation status" on public.study_recommendations for update to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

revoke insert,update,delete on public.assessment_attempts from anon,authenticated;
revoke insert,update,delete on public.user_answers from anon,authenticated;
revoke insert,update,delete on public.game_attempts from anon,authenticated;
revoke insert,delete on public.study_recommendations from anon,authenticated;
revoke select on table public.question_options from anon,authenticated;
grant select(id,question_id,option_label,option_text,position) on public.question_options to authenticated;
grant select on public.courses,public.modules,public.assessments,public.questions,public.user_answers,public.game_attempts,public.study_recommendations to authenticated;

create or replace function public.submit_assessment(p_assessment_id uuid,p_answers jsonb,p_duration_seconds integer default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_user_id uuid:=auth.uid(); v_total integer; v_correct integer; v_attempt_id uuid;
 v_score numeric(5,2); v_feedback jsonb; v_answer_count integer;
begin
 if v_user_id is null then raise exception 'É necessário entrar na conta para enviar a avaliação.'; end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)=0 then raise exception 'A avaliação precisa conter respostas.'; end if;
 if p_duration_seconds is not null and p_duration_seconds<0 then raise exception 'Duração inválida.'; end if;
 select count(*) into v_total from public.questions q join public.assessments a on a.id=q.assessment_id
 where q.assessment_id=p_assessment_id and q.published and a.published;
 if v_total=0 then raise exception 'Avaliação indisponível.'; end if;
 if exists(select 1 from public.questions q where q.assessment_id=p_assessment_id and q.published
 and not exists(select 1 from public.question_options o where o.question_id=q.id and o.is_correct))
 then raise exception 'A avaliação possui questão sem gabarito configurado.'; end if;
 select count(*) into v_answer_count from jsonb_array_elements(p_answers);
 if v_answer_count<>v_total then raise exception 'Responda a todas as questões antes de finalizar.'; end if;
 if exists(select 1 from jsonb_to_recordset(p_answers) as s(question_id uuid,option_id uuid)
 left join public.questions q on q.id=s.question_id and q.assessment_id=p_assessment_id and q.published
 left join public.question_options o on o.id=s.option_id and o.question_id=q.id where q.id is null or o.id is null)
 then raise exception 'Há respostas inválidas nesta avaliação.'; end if;
 if (select count(distinct s.question_id) from jsonb_to_recordset(p_answers) as s(question_id uuid,option_id uuid))<>v_total
 then raise exception 'Há questões repetidas ou ausentes nas respostas.'; end if;
 select count(*) into v_correct from jsonb_to_recordset(p_answers) as s(question_id uuid,option_id uuid)
 join public.question_options o on o.id=s.option_id and o.question_id=s.question_id where o.is_correct;
 v_score:=round((v_correct::numeric/v_total::numeric)*10,2);
 insert into public.assessment_attempts(user_id,assessment_type,score,total_questions,answers,assessment_id,duration_seconds)
 select v_user_id,a.assessment_type,v_score,v_total,p_answers,a.id,p_duration_seconds from public.assessments a where a.id=p_assessment_id
 returning id into v_attempt_id;
 insert into public.user_answers(attempt_id,question_id,selected_option_id,is_correct)
 select v_attempt_id,s.question_id,s.option_id,o.is_correct from jsonb_to_recordset(p_answers) as s(question_id uuid,option_id uuid)
 join public.question_options o on o.id=s.option_id and o.question_id=s.question_id;
 select coalesce(jsonb_agg(jsonb_build_object(
 'question_id',q.id,'subject',q.subject,'prompt',q.prompt,'selected_option_id',s.option_id,
 'selected_option',chosen.option_text,'correct_option_id',correct.id,'correct_option',correct.option_text,
 'is_correct',correct.id=s.option_id,'explanation',q.explanation,'correct_explanation',correct.explanation,
 'review_lesson_id',q.review_lesson_id) order by q.position),'[]'::jsonb) into v_feedback
 from jsonb_to_recordset(p_answers) as s(question_id uuid,option_id uuid)
 join public.questions q on q.id=s.question_id join public.question_options chosen on chosen.id=s.option_id
 join public.question_options correct on correct.question_id=q.id and correct.is_correct;
 return jsonb_build_object('attempt_id',v_attempt_id,'total_questions',v_total,'correct_answers',v_correct,
 'percentage',round((v_correct::numeric/v_total::numeric)*100,2),'score',v_score,
 'duration_seconds',p_duration_seconds,'feedback',v_feedback);
end;
$$;
revoke all on function public.submit_assessment(uuid,jsonb,integer) from public,anon;
grant execute on function public.submit_assessment(uuid,jsonb,integer) to authenticated;
