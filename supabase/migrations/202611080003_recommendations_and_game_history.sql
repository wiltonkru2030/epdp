-- EPDP: geração automática de reforço após avaliação e gravação segura de jogos.
create unique index if not exists study_recommendations_attempt_subject_uidx
on public.study_recommendations(user_id,subject,source_attempt_id)
where source_attempt_id is not null;

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
 insert into public.study_recommendations(user_id,subject,reason,recommendation_type,lesson_id,source_attempt_id)
 select v_user_id,q.subject,
 'Nesta avaliação, seu aproveitamento em '||q.subject||' ficou abaixo de 70%. Revise a explicação das questões e pratique novamente esse assunto.',
 'review',min(q.review_lesson_id),v_attempt_id
 from public.user_answers ua join public.questions q on q.id=ua.question_id
 where ua.attempt_id=v_attempt_id group by q.subject
 having count(*) filter(where ua.is_correct)::numeric/nullif(count(*),0)<0.70
 on conflict(user_id,subject,source_attempt_id) where source_attempt_id is not null do nothing;
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

create or replace function public.record_game_attempt(p_game_slug text,p_correct_count integer,p_total_count integer,p_duration_seconds integer default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user_id uuid:=auth.uid(); v_attempt_id uuid; v_score integer;
begin
 if v_user_id is null then raise exception 'Entre na sua conta para salvar o resultado do jogo.'; end if;
 if p_game_slug is null or p_game_slug !~ '^[a-z0-9-]{2,60}$' then raise exception 'Identificador de jogo inválido.'; end if;
 if p_total_count is null or p_total_count<1 or p_correct_count is null or p_correct_count<0 or p_correct_count>p_total_count then raise exception 'Pontuação inválida.'; end if;
 if p_duration_seconds is not null and p_duration_seconds<0 then raise exception 'Duração inválida.'; end if;
 v_score:=round((p_correct_count::numeric/p_total_count::numeric)*100)::integer;
 insert into public.game_attempts(user_id,game_slug,score,correct_count,total_count,duration_seconds)
 values(v_user_id,p_game_slug,v_score,p_correct_count,p_total_count,p_duration_seconds) returning id into v_attempt_id;
 return jsonb_build_object('attempt_id',v_attempt_id,'score',v_score,'correct_count',p_correct_count,'total_count',p_total_count);
end;
$$;
revoke all on function public.record_game_attempt(text,integer,integer,integer) from public,anon;
grant execute on function public.record_game_attempt(text,integer,integer,integer) to authenticated;
