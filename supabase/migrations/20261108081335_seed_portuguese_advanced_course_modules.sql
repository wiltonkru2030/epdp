do $$
declare r record; mid uuid; course_uuid uuid;
begin
  select id into course_uuid from public.courses where slug = 'portugues-completo' limit 1;
  if course_uuid is null then raise exception 'Curso portugues-completo não encontrado.'; end if;
  for r in select * from (values
    (2,'Interpretação de textos','Compreensão, ideia central, inferência e finalidade.','Leitura estratégica: tema, ideia central e inferência','Interpretar textos com apoio em evidências.','## Tema e ideia central
O tema é o assunto geral; a ideia central é o que o texto afirma sobre esse assunto.
## Informação e inferência
A informação explícita aparece diretamente. Inferir é construir uma conclusão plausível com base em pistas, sem inventar detalhes.
## Estratégia
Leia o texto inteiro, identifique a finalidade, localize a evidência e elimine alternativas que contradizem o trecho.'),
    (3,'Semântica e significação','Sentidos, relações semânticas e efeitos de contexto.','Semântica: como o contexto constrói o sentido','Reconhecer sinônimos, antônimos, polissemia e sentido figurado.','## Relações de sentido
Sinônimos têm sentidos próximos; antônimos expressam oposição. A substituição depende do contexto.
## Polissemia
Uma palavra pode ter mais de um sentido. “Banco” pode indicar assento ou instituição financeira.
## Denotação e conotação
Denotação é o sentido literal; conotação é o sentido figurado, como em “coração de pedra”.'),
    (4,'Organização textual','Coesão, coerência, conectivos e gêneros textuais.','Coesão, coerência e gêneros textuais','Identificar mecanismos de conexão e unidade de sentido.','## Coesão e coerência
Coesão liga linguisticamente as partes do texto. Coerência é a unidade de sentido global.
## Conectivos
“Mas” indica oposição; “porque” pode indicar causa; “portanto” introduz conclusão; “embora” indica concessão.
## Gêneros e tipos
Notícia, receita e e-mail são gêneros. Narração, descrição, exposição, argumentação e injunção são tipos textuais.'),
    (5,'Fonética e fonologia','Sons, fonemas, sílabas e encontros sonoros.','Fonética e fonologia na prática','Diferenciar letra, fonema, sílaba, dígrafo e encontros vocálicos.','## Fonética e fonologia
Fonética observa a produção dos sons; fonologia estuda a função dos sons na língua.
## Letra e fonema
Letra é sinal gráfico; fonema é unidade sonora distintiva. Em “chave”, CH representa um fonema.
## Encontros
Ditongo ocorre na mesma sílaba; hiato separa vogais. Dígrafos como CH, LH e NH usam duas letras para um fonema.'),
    (6,'Ortografia e acentuação','Grafia, acentuação, hífen e casos especiais.','Ortografia avançada, acentuação e hífen','Aplicar regras de escrita formal e acentuação.','## Tonicidade
Oxítonas têm a última sílaba tônica; paroxítonas, a penúltima; proparoxítonas, a antepenúltima. Todas as proparoxítonas são acentuadas.
## Acentos diferenciais
“Pôde” indica passado; “pode” indica presente. “Pôr” é verbo; “por” é preposição.
## Hífen
O uso depende do prefixo e da palavra seguinte. Exemplos: anti-inflamatório, micro-ondas e recém-nascido.'),
    (7,'Classes gramaticais','Classes de palavras, funções e flexões.','Classes gramaticais: funções e flexões','Identificar classes e funções no contexto.','## Classes variáveis
Substantivo nomeia; adjetivo caracteriza; artigo acompanha o nome; pronome acompanha ou substitui nomes; verbo expressa ação, estado ou fenômeno.
## Classes invariáveis
Advérbio modifica; preposição relaciona termos; conjunção conecta orações; interjeição expressa reação.
## Contexto
Em “O jantar estava pronto”, jantar é substantivo. Em “Vamos jantar”, é verbo.'),
    (8,'Morfologia e formação de palavras','Estrutura, radical, afixos, derivação e composição.','Estrutura e formação das palavras','Reconhecer elementos mórficos e processos de formação.','## Elementos mórficos
Radical é a base de significado. Prefixo vem antes do radical; sufixo vem depois.
## Derivação
Prefixal: infeliz. Sufixal: felicidade. Parassintética: anoitecer.
## Composição
Une radicais. Justaposição: passatempo. Aglutinação: planalto.'),
    (9,'Sintaxe','Termos da oração, complementos e período.','Sintaxe: termos da oração e período','Analisar sujeito, predicado e complementos.','## Sujeito e predicado
Sujeito é o termo sobre o qual se declara algo. Predicado é a informação declarada.
## Complementos
Objeto direto completa verbo sem preposição obrigatória: “Li o livro”. Objeto indireto exige preposição: “Preciso de ajuda”.
## Período
Período simples tem uma oração; composto tem duas ou mais.'),
    (10,'Pontuação e crase','Sinais de pontuação e acento indicativo de crase.','Pontuação e crase: uso e efeitos de sentido','Usar pontuação e reconhecer casos de crase.','## Pontuação
Ponto final encerra declaração; interrogação marca pergunta; dois-pontos anunciam explicação ou enumeração.
## Vírgula
Separa enumerações, isola vocativo e aposto. Não separe sujeito e verbo.
## Crase
É a fusão da preposição a com o artigo feminino a. Em “Fui à escola”, ocorre a + a. Não ocorre antes de verbo.'),
    (11,'Figuras de linguagem e discursos','Recursos expressivos e formas de apresentar falas.','Figuras de linguagem e tipos de discurso','Identificar metáfora, hipérbole, ironia e discursos.','## Figuras
Metáfora aproxima elementos sem conectivo. Hipérbole exagera; eufemismo suaviza; ironia sugere sentido diferente do literal.
## Discurso
Direto reproduz a fala; indireto integra a fala à narração; indireto livre mistura as vozes do narrador e da personagem.'),
    (12,'Reescrita e concursos','Equivalência de sentido e estratégia para questões.','Reescrita, equivalência e questões de concurso','Preservar sentido e relações lógicas ao reescrever.','## Reescrita
Uma boa reescrita preserva a informação central e as relações lógicas. Sinônimos nem sempre são equivalentes.
## Conectivos
A troca pode alterar causa, consequência, oposição, condição ou concessão. “Embora” não equivale a “porque”.
## Voz ativa e passiva
Ativa: “A equipe concluiu o relatório”. Passiva: “O relatório foi concluído pela equipe”.')
  ) as x(stage,module_title,module_description,lesson_title,lesson_description,content)
  loop
    select id into mid from public.modules where course_id=course_uuid and stage=r.stage limit 1;
    if mid is null then
      insert into public.modules(course_id,title,description,stage,position,published)
      values(course_uuid,r.module_title,r.module_description,r.stage,r.stage,true)
      returning id into mid;
    end if;
    if not exists(select 1 from public.lessons where title=r.lesson_title) then
      insert into public.lessons(module_id,title,description,content,level,position,published,learning_objective,estimated_minutes)
      values(mid,r.lesson_title,r.lesson_description,r.content,'intermediario',1,true,r.lesson_description,25);
    end if;
  end loop;
end $$;
