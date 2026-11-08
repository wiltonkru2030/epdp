-- EPDP: índices de chaves estrangeiras e avaliação diagnóstica inicial.
create index if not exists assessment_attempts_assessment_id_idx on public.assessment_attempts(assessment_id);
create index if not exists assessments_module_id_idx on public.assessments(module_id);
create index if not exists questions_review_lesson_id_idx on public.questions(review_lesson_id);
create index if not exists study_recommendations_lesson_id_idx on public.study_recommendations(lesson_id);
create index if not exists study_recommendations_source_attempt_id_idx on public.study_recommendations(source_attempt_id);
create index if not exists user_answers_question_id_idx on public.user_answers(question_id);
create index if not exists user_answers_selected_option_id_idx on public.user_answers(selected_option_id);

do $$
declare v_course uuid; v_module uuid; v_assessment uuid; v_question uuid;
begin
 insert into public.courses(title,description,slug,published,position)
 values('Português do básico ao avançado','Trilha estruturada de língua portuguesa, interpretação, gramática e preparação para avaliações.','portugues-completo',true,1)
 on conflict(slug) do update set title=excluded.title returning id into v_course;
 insert into public.modules(course_id,title,description,stage,position,published)
 values(v_course,'Fundamentos da língua portuguesa','Primeiros conceitos para compreender e utilizar a língua com clareza.',1,1,true)
 on conflict(course_id,stage) do update set title=excluded.title returning id into v_module;
 if exists(select 1 from public.assessments where title='Avaliação inicial de português') then return; end if;
 insert into public.assessments(module_id,title,description,assessment_type,published)
 values(v_module,'Avaliação inicial de português','Avaliação diagnóstica de interpretação, vocabulário, coesão, figuras de linguagem e ortografia.','general',true)
 returning id into v_assessment;

 insert into public.questions(assessment_id,subject,prompt,difficulty,explanation,position,published)
 values(v_assessment,'Interpretação de textos','No trecho “Embora estivesse cansada, Ana terminou a leitura”, o que se pode concluir?',1,'“Embora” introduz concessão: o cansaço existia, mas não impediu Ana de terminar a leitura.',1,true) returning id into v_question;
 insert into public.question_options(question_id,option_label,option_text,is_correct,explanation,position) values
 (v_question,'A','Ana desistiu da leitura por estar cansada.',false,'O trecho informa que ela terminou a leitura.',1),(v_question,'B','Ana terminou a leitura apesar do cansaço.',true,'A oração concessiva apresenta uma dificuldade que não impediu a ação principal.',2),(v_question,'C','Ana não estava cansada.',false,'O trecho afirma que ela estava cansada.',3),(v_question,'D','Ana começou a leitura depois de descansar.',false,'Não há informação sobre descanso.',4);

 insert into public.questions(assessment_id,subject,prompt,difficulty,explanation,position,published)
 values(v_assessment,'Significação das palavras','No contexto “A notícia trouxe grande alegria”, qual palavra pode substituir “alegria” sem alterar substancialmente o sentido?',1,'“Felicidade” é sinônimo de “alegria” nesse contexto. A escolha deve considerar o sentido da frase.',2,true) returning id into v_question;
 insert into public.question_options(question_id,option_label,option_text,is_correct,explanation,position) values
 (v_question,'A','Tristeza',false,'Tristeza expressa sentido oposto.',1),(v_question,'B','Felicidade',true,'Felicidade mantém o sentido positivo de alegria.',2),(v_question,'C','Dúvida',false,'Dúvida não corresponde ao sentido de alegria.',3),(v_question,'D','Receio',false,'Receio indica medo ou apreensão.',4);

 insert into public.questions(assessment_id,subject,prompt,difficulty,explanation,position,published)
 values(v_assessment,'Coesão textual','Qual conectivo completa adequadamente: “Estudou com dedicação; _____, conseguiu melhorar seu desempenho”?',2,'“Por isso” estabelece relação de consequência entre o estudo dedicado e a melhora do desempenho.',3,true) returning id into v_question;
 insert into public.question_options(question_id,option_label,option_text,is_correct,explanation,position) values
 (v_question,'A','Entretanto',false,'“Entretanto” introduz oposição.',1),(v_question,'B','Por isso',true,'“Por isso” apresenta a consequência do fato anterior.',2),(v_question,'C','Embora',false,'“Embora” introduz concessão.',3),(v_question,'D','Enquanto',false,'“Enquanto” indica simultaneidade ou contraste temporal.',4);

 insert into public.questions(assessment_id,subject,prompt,difficulty,explanation,position,published)
 values(v_assessment,'Figuras de linguagem','Na frase “O vento sussurrava entre as árvores”, qual figura de linguagem está presente?',2,'Atribuir ao vento a ação humana de sussurrar caracteriza personificação ou prosopopeia.',4,true) returning id into v_question;
 insert into public.question_options(question_id,option_label,option_text,is_correct,explanation,position) values
 (v_question,'A','Hipérbole',false,'Não há exagero intencional.',1),(v_question,'B','Personificação',true,'Um elemento da natureza recebe uma ação tipicamente humana.',2),(v_question,'C','Antítese',false,'Não há oposição de ideias.',3),(v_question,'D','Eufemismo',false,'Não há suavização de ideia desagradável.',4);

 insert into public.questions(assessment_id,subject,prompt,difficulty,explanation,position,published)
 values(v_assessment,'Ortografia e acentuação','Assinale a palavra escrita corretamente de acordo com a ortografia atual.',1,'“Saúde” recebe acento agudo porque apresenta hiato: a vogal “u” é tônica e aparece sozinha na sílaba.',5,true) returning id into v_question;
 insert into public.question_options(question_id,option_label,option_text,is_correct,explanation,position) values
 (v_question,'A','Saude',false,'A palavra precisa de acento para marcar a vogal tônica do hiato.',1),(v_question,'B','Saúde',true,'A grafia correta é “saúde”.',2),(v_question,'C','Saúdi',false,'A terminação não corresponde à palavra pretendida.',3),(v_question,'D','Saùde',false,'O acento grave não é utilizado nessa palavra.',4);
end $$;
