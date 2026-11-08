begin;

do $$
declare
  v_course uuid;
  v_module uuid;
  v_assessment uuid;
  v_question uuid;
  v_item jsonb;
  v_option jsonb;
  v_questions jsonb := '[
    {"subject":"Classes de palavras","prompt":"Em “A menina curiosa leu o livro”, a palavra “curiosa” é:","difficulty":1,"explanation":"“Curiosa” caracteriza o substantivo “menina”; por isso, é um adjetivo.","lesson_position":1,"options":[{"label":"A","text":"Substantivo","correct":false,"explanation":"Substantivo nomeia seres, objetos, lugares ou ideias."},{"label":"B","text":"Adjetivo","correct":true,"explanation":"Adjetivo atribui característica ao substantivo."},{"label":"C","text":"Verbo","correct":false,"explanation":"Verbo indica ação, estado ou fenômeno."},{"label":"D","text":"Advérbio","correct":false,"explanation":"Advérbio modifica verbo, adjetivo ou outro advérbio."}]},
    {"subject":"Tempos verbais","prompt":"Na frase “Ontem, eles chegaram cedo”, a forma verbal “chegaram” está no:","difficulty":2,"explanation":"“Ontem” situa a ação no passado; “chegaram” indica ação concluída no pretérito perfeito do indicativo.","lesson_position":1,"options":[{"label":"A","text":"Presente do indicativo","correct":false,"explanation":"O presente indica ação atual ou habitual."},{"label":"B","text":"Pretérito imperfeito do indicativo","correct":false,"explanation":"O pretérito imperfeito costuma indicar ação passada habitual ou em curso."},{"label":"C","text":"Pretérito perfeito do indicativo","correct":true,"explanation":"Expressa ação concluída no passado."},{"label":"D","text":"Futuro do presente","correct":false,"explanation":"O futuro do presente indica ação posterior ao momento da fala."}]},
    {"subject":"Concordância verbal","prompt":"Assinale a frase que apresenta concordância verbal adequada à norma-padrão.","difficulty":2,"explanation":"O sujeito “As crianças” está no plural e exige o verbo “brincam” também no plural.","lesson_position":3,"options":[{"label":"A","text":"As crianças brincam no pátio.","correct":true,"explanation":"Sujeito e verbo concordam em número e pessoa."},{"label":"B","text":"As crianças brinca no pátio.","correct":false,"explanation":"O verbo deveria estar no plural: brincam."},{"label":"C","text":"A crianças brincam no pátio.","correct":false,"explanation":"O artigo deve concordar com o substantivo: as crianças."},{"label":"D","text":"As criança brinca no pátio.","correct":false,"explanation":"Há problemas de concordância nominal e verbal."}]},
    {"subject":"Crase","prompt":"Complete corretamente: “Entreguei o documento ___ professora”.","difficulty":3,"explanation":"O verbo entregar, nessa construção, pede a preposição “a”; “professora” admite o artigo feminino “a”. A fusão resulta em “à”.","lesson_position":2,"options":[{"label":"A","text":"a","correct":false,"explanation":"Falta o acento indicativo da fusão da preposição com o artigo."},{"label":"B","text":"à","correct":true,"explanation":"Ocorre a fusão da preposição “a” com o artigo feminino “a”."},{"label":"C","text":"há","correct":false,"explanation":"“Há” é forma do verbo haver e não cabe nesta construção."},{"label":"D","text":"á","correct":false,"explanation":"“Á” não é a forma adequada para indicar crase."}]},
    {"subject":"Regência verbal","prompt":"De acordo com a norma-padrão, complete: “Assistimos ___ filme ontem”.","difficulty":3,"explanation":"No sentido de ver ou presenciar, o verbo assistir é transitivo indireto e exige a preposição “a”: assistir ao filme.","lesson_position":3,"options":[{"label":"A","text":"o","correct":false,"explanation":"No sentido de ver, a norma-padrão exige a preposição “a”."},{"label":"B","text":"ao","correct":true,"explanation":"“Ao” reúne a preposição “a” e o artigo “o”."},{"label":"C","text":"no","correct":false,"explanation":"A preposição “em” não é exigida pelo verbo nesse sentido."},{"label":"D","text":"pelo","correct":false,"explanation":"“Pelo” não corresponde à regência do verbo assistir nesse contexto."}]},
    {"subject":"Pontuação","prompt":"Na frase “Maria, venha aqui”, a vírgula foi usada para isolar:","difficulty":2,"explanation":"“Maria” é vocativo: o termo usado para chamar ou interpelar alguém deve ser separado por vírgula.","lesson_position":3,"options":[{"label":"A","text":"O sujeito","correct":false,"explanation":"A vírgula não separa sujeito e verbo."},{"label":"B","text":"O objeto direto","correct":false,"explanation":"“Maria” não completa o sentido de um verbo como objeto."},{"label":"C","text":"O vocativo","correct":true,"explanation":"O vocativo chama ou interpela o interlocutor."},{"label":"D","text":"O predicado","correct":false,"explanation":"O predicado não está isolado nessa frase."}]},
    {"subject":"Acentuação","prompt":"A palavra “lâmpada” é classificada como:","difficulty":1,"explanation":"A sílaba tônica é “lâm”, a antepenúltima. Portanto, a palavra é proparoxítona; todas as proparoxítonas são acentuadas.","lesson_position":2,"options":[{"label":"A","text":"Oxítona","correct":false,"explanation":"Oxítona tem a última sílaba tônica."},{"label":"B","text":"Paroxítona","correct":false,"explanation":"Paroxítona tem a penúltima sílaba tônica."},{"label":"C","text":"Proparoxítona","correct":true,"explanation":"Proparoxítona tem a antepenúltima sílaba tônica."},{"label":"D","text":"Monossílabo tônico","correct":false,"explanation":"“Lâmpada” tem três sílabas."}]},
    {"subject":"Concordância verbal","prompt":"Complete de acordo com a norma-padrão: “___ dois anos que estudo português”.","difficulty":3,"explanation":"O verbo fazer, indicando tempo decorrido, é impessoal e permanece na terceira pessoa do singular: faz dois anos.","lesson_position":3,"options":[{"label":"A","text":"Faz","correct":true,"explanation":"O verbo fazer indicando tempo decorrido é impessoal e fica no singular."},{"label":"B","text":"Fazem","correct":false,"explanation":"Nesse sentido temporal, o verbo não vai para o plural."},{"label":"C","text":"Fizeram","correct":false,"explanation":"A forma no pretérito não se encaixa na construção apresentada."},{"label":"D","text":"Faziam-se","correct":false,"explanation":"A construção pronominal não corresponde ao sentido da frase."}]},
    {"subject":"Interpretação de textos","prompt":"Leia: “A biblioteca do bairro ampliou o horário de atendimento e criou um espaço infantil”. Qual conclusão é sustentada pelo trecho?","difficulty":2,"explanation":"O trecho informa duas mudanças concretas: ampliação do horário e criação de um espaço infantil. Não permite afirmar, por si só, quantas pessoas passaram a frequentar o local.","lesson_position":4,"options":[{"label":"A","text":"A biblioteca encerrou suas atividades para adultos.","correct":false,"explanation":"O texto não informa encerramento de atendimento a adultos."},{"label":"B","text":"A biblioteca passou a oferecer mais tempo de atendimento e um espaço para crianças.","correct":true,"explanation":"A alternativa reúne as duas informações explicitamente apresentadas."},{"label":"C","text":"Todos os moradores passaram a frequentar a biblioteca.","correct":false,"explanation":"O trecho não apresenta dados sobre a frequência dos moradores."},{"label":"D","text":"A biblioteca mudou de endereço.","correct":false,"explanation":"Não há informação sobre mudança de endereço."}]},
    {"subject":"Coesão textual","prompt":"Complete com o conectivo que estabelece oposição: “Queria sair, ___ começou a chover”.","difficulty":2,"explanation":"“Porém” é uma conjunção adversativa: introduz uma ideia que contrasta com a expectativa apresentada anteriormente.","lesson_position":4,"options":[{"label":"A","text":"Portanto","correct":false,"explanation":"“Portanto” indica conclusão ou consequência."},{"label":"B","text":"Porque","correct":false,"explanation":"“Porque” introduz causa ou explicação."},{"label":"C","text":"Porém","correct":true,"explanation":"“Porém” estabelece oposição entre as duas ideias."},{"label":"D","text":"Logo","correct":false,"explanation":"“Logo” indica conclusão ou consequência."}]},
    {"subject":"Ortografia","prompt":"Assinale a palavra escrita corretamente.","difficulty":1,"explanation":"A grafia correta é “exceção”, com ç e sem s após o e.","lesson_position":2,"options":[{"label":"A","text":"Excessão","correct":false,"explanation":"A palavra não é escrita com “ss” nessa posição."},{"label":"B","text":"Exceção","correct":true,"explanation":"“Exceção” é a grafia oficial."},{"label":"C","text":"Esceção","correct":false,"explanation":"A palavra não começa com “es”."},{"label":"D","text":"Excesssão","correct":false,"explanation":"A forma apresenta letras duplicadas indevidas."}]},
    {"subject":"Sintaxe","prompt":"Na oração “Os estudantes revisaram o conteúdo”, qual termo exerce a função de sujeito?","difficulty":2,"explanation":"“Os estudantes” é o termo sobre o qual se declara a ação de revisar; é o sujeito da oração.","lesson_position":3,"options":[{"label":"A","text":"Os estudantes","correct":true,"explanation":"É o sujeito que pratica a ação expressa pelo verbo."},{"label":"B","text":"Revisaram","correct":false,"explanation":"“Revisaram” é o núcleo verbal do predicado."},{"label":"C","text":"O conteúdo","correct":false,"explanation":"“O conteúdo” funciona como objeto direto."},{"label":"D","text":"Conteúdo","correct":false,"explanation":"É apenas o núcleo do objeto direto."}]}
  ]'::jsonb;
begin
  select c.id into v_course from public.courses c where c.slug = 'portugues-completo' limit 1;
  if v_course is null then raise exception 'Curso base não encontrado.'; end if;
  select m.id into v_module from public.modules m where m.course_id = v_course and m.stage = 1 limit 1;
  if v_module is null then raise exception 'Módulo inicial não encontrado.'; end if;
  if exists (select 1 from public.assessments where title = 'Simulado de Português — fundamentos e gramática') then return; end if;

  insert into public.assessments(module_id,title,description,assessment_type,time_limit_seconds,published)
  values(v_module,'Simulado de Português — fundamentos e gramática',
    '12 questões autorais sobre classes de palavras, verbos, concordância, crase, regência, pontuação, acentuação, interpretação e coesão. Ao finalizar, você recebe nota, tempo e correção comentada.',
    'mock_exam',1800,true)
  returning id into v_assessment;

  for v_item in select value from jsonb_array_elements(v_questions)
  loop
    insert into public.questions(assessment_id,subject,prompt,difficulty,explanation,review_lesson_id,position,published)
    values(
      v_assessment,
      v_item->>'subject',
      v_item->>'prompt',
      (v_item->>'difficulty')::smallint,
      v_item->>'explanation',
      (select l.id from public.lessons l where l.module_id = v_module and l.position = (v_item->>'lesson_position')::integer limit 1),
      (select count(*) + 1 from public.questions where assessment_id = v_assessment),
      true
    ) returning id into v_question;

    for v_option in select value from jsonb_array_elements(v_item->'options')
    loop
      insert into public.question_options(question_id,option_label,option_text,is_correct,explanation,position)
      values(v_question,v_option->>'label',v_option->>'text',(v_option->>'correct')::boolean,v_option->>'explanation',
        (select count(*) + 1 from public.question_options where question_id = v_question));
    end loop;
  end loop;
end;
$$;

commit;