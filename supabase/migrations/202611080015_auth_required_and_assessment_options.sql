begin;

drop policy if exists "Read public published lessons" on public.lessons;
drop policy if exists "Read published courses" on public.courses;
drop policy if exists "Read published modules" on public.modules;

create policy "Read published courses"
on public.courses for select to authenticated
using (published = true or exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

create policy "Read published modules"
on public.modules for select to authenticated
using (published = true or exists (
  select 1 from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'admin'
));

revoke all on all tables in schema public from anon, public;
revoke all on all sequences in schema public from anon, public;
alter default privileges in schema public revoke all on tables from anon, public;
alter default privileges in schema public revoke all on sequences from anon, public;

create or replace view public.assessment_options
with (security_barrier = true)
as
select o.id, o.question_id, o.option_label, o.option_text, o.position
from public.question_options o
join public.questions q on q.id = o.question_id
join public.assessments a on a.id = q.assessment_id
where q.published = true and a.published = true;

revoke all on public.assessment_options from anon, public;
grant select on public.assessment_options to authenticated;

update public.lessons l
set module_id = m.id,
    learning_objective = case l.position
      when 1 then 'Diferenciar letras, fonemas, sílabas e classes de palavras em exemplos do cotidiano.'
      when 2 then 'Identificar a grafia correta, a sílaba tônica e aplicar regras essenciais de acentuação.'
      when 3 then 'Reconhecer frase, oração, sujeito e predicado e usar a pontuação com clareza.'
      when 4 then 'Localizar informações explícitas, identificar a ideia central e construir inferências apoiadas no texto.'
      else l.learning_objective
    end,
    estimated_minutes = case l.position when 1 then 25 when 2 then 30 when 3 then 30 when 4 then 35 else l.estimated_minutes end
from public.modules m
join public.courses c on c.id = m.course_id
where m.stage = 1 and c.slug = 'portugues-completo' and l.position between 1 and 4;

create or replace function public.submit_assessment(
  p_assessment_id uuid,
  p_answers jsonb,
  p_duration_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_total integer;
  v_correct integer;
  v_attempt_id uuid;
  v_score numeric(5,2);
  v_feedback jsonb;
  v_answer_count integer;
begin
  if v_user_id is null then raise exception 'É necessário entrar na conta para enviar a avaliação.'; end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) = 0 then raise exception 'A avaliação precisa conter respostas.'; end if;
  if p_duration_seconds is not null and (p_duration_seconds < 0 or p_duration_seconds > 86400) then raise exception 'Duração inválida.'; end if;

  select count(*) into v_total
  from public.questions q join public.assessments a on a.id = q.assessment_id
  where q.assessment_id = p_assessment_id and q.published and a.published;
  if v_total = 0 then raise exception 'Avaliação indisponível.'; end if;

  if exists (
    select 1 from public.questions q
    where q.assessment_id = p_assessment_id and q.published
      and not exists (select 1 from public.question_options o where o.question_id = q.id and o.is_correct)
  ) then raise exception 'A avaliação possui questão sem gabarito configurado.'; end if;

  select count(*) into v_answer_count from jsonb_array_elements(p_answers);
  if v_answer_count <> v_total then raise exception 'A estrutura das respostas não corresponde à avaliação.'; end if;

  if exists (
    select 1 from jsonb_to_recordset(p_answers) as s(question_id uuid, option_id uuid)
    left join public.questions q on q.id = s.question_id and q.assessment_id = p_assessment_id and q.published
    left join public.question_options o on o.id = s.option_id and o.question_id = q.id
    where q.id is null or (s.option_id is not null and o.id is null)
  ) then raise exception 'Há respostas inválidas nesta avaliação.'; end if;

  if (select count(distinct s.question_id) from jsonb_to_recordset(p_answers) as s(question_id uuid, option_id uuid)) <> v_total
  then raise exception 'Há questões repetidas ou ausentes nas respostas.'; end if;

  select count(*) into v_correct
  from jsonb_to_recordset(p_answers) as s(question_id uuid, option_id uuid)
  join public.question_options o on o.id = s.option_id and o.question_id = s.question_id
  where o.is_correct;
  v_score := round((v_correct::numeric / v_total::numeric) * 10, 2);

  insert into public.assessment_attempts(user_id, assessment_type, score, total_questions, answers, assessment_id, duration_seconds)
  select v_user_id, a.assessment_type, v_score, v_total, p_answers, a.id, p_duration_seconds
  from public.assessments a where a.id = p_assessment_id returning id into v_attempt_id;

  insert into public.user_answers(attempt_id, question_id, selected_option_id, is_correct)
  select v_attempt_id, s.question_id, s.option_id, coalesce(o.is_correct, false)
  from jsonb_to_recordset(p_answers) as s(question_id uuid, option_id uuid)
  left join public.question_options o on o.id = s.option_id and o.question_id = s.question_id;

  insert into public.study_recommendations(user_id, subject, reason, recommendation_type, lesson_id, source_attempt_id)
  select v_user_id, q.subject,
    'Nesta avaliação, seu aproveitamento em ' || q.subject || ' ficou abaixo de 70%. Revise a explicação das questões e pratique novamente esse assunto.',
    'review', min(q.review_lesson_id), v_attempt_id
  from public.user_answers ua join public.questions q on q.id = ua.question_id
  where ua.attempt_id = v_attempt_id group by q.subject
  having count(*) filter (where ua.is_correct)::numeric / nullif(count(*), 0) < 0.70
  on conflict(user_id, subject, source_attempt_id) where source_attempt_id is not null do nothing;

  select coalesce(jsonb_agg(jsonb_build_object(
    'question_id', q.id, 'subject', q.subject, 'prompt', q.prompt,
    'selected_option_id', s.option_id, 'selected_option', coalesce(chosen.option_text, 'Não respondida'),
    'correct_option_id', correct.id, 'correct_option', correct.option_text,
    'is_correct', coalesce(correct.id = s.option_id, false),
    'explanation', q.explanation, 'correct_explanation', correct.explanation,
    'review_lesson_id', q.review_lesson_id
  ) order by q.position), '[]'::jsonb) into v_feedback
  from jsonb_to_recordset(p_answers) as s(question_id uuid, option_id uuid)
  join public.questions q on q.id = s.question_id
  left join public.question_options chosen on chosen.id = s.option_id and chosen.question_id = q.id
  join public.question_options correct on correct.question_id = q.id and correct.is_correct;

  return jsonb_build_object(
    'attempt_id', v_attempt_id, 'total_questions', v_total, 'correct_answers', v_correct,
    'percentage', round((v_correct::numeric / v_total::numeric) * 100, 2),
    'score', v_score, 'duration_seconds', p_duration_seconds, 'feedback', v_feedback
  );
end;
$$;
revoke all on function public.submit_assessment(uuid, jsonb, integer) from public, anon;
grant execute on function public.submit_assessment(uuid, jsonb, integer) to authenticated;

commit;