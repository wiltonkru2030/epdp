do $$
declare
  course_uuid uuid;
  module_uuid uuid;
  r record;
begin
  select id into course_uuid from public.courses where slug='portugues-completo' limit 1;
  if course_uuid is null then raise exception 'Curso portugues-completo não encontrado.'; end if;
  update public.lessons l set module_id=m.id, position=1
  from public.modules m
  where m.course_id=course_uuid and m.stage=2 and l.title='Interpretação de textos';
  for r in select * from (values
  (2,'Interpretação: localização de informações e paráfrase','Localize dados explícitos, reconheça paráfrases e diferencie fato de opinião.','## Localização de informações
Informações explícitas aparecem diretamente no texto, ainda que sejam apresentadas por palavras diferentes das usadas na pergunta. Identifique palavras-chave e releia o trecho correspondente.
## Paráfrase
Parafrasear é expressar uma ideia com outras palavras, preservando seu sentido. A troca de vocabulário não pode acrescentar, retirar ou inverter informações.
## Fato e opinião
Fato pode ser verificado; opinião expressa avaliação ou ponto de vista. Um texto pode combinar os dois. Observe marcas como “acredito”, “é necessário” e adjetivos avaliativos.'),
  (2,'Interpretação: inferência, pressupostos e implícitos','Construa inferências com evidências e reconheça pressupostos e subentendidos.','## Inferência
Inferir é concluir algo que não está dito literalmente, mas é sustentado por pistas do texto. A resposta correta precisa ser compatível com essas pistas.
## Pressuposto
É uma informação tomada como existente pela construção linguística. Em “João voltou a estudar”, pressupõe-se que ele já estudava antes.
## Subentendido
É uma interpretação sugerida pelo contexto e pela intenção comunicativa. Depende da situação e pode variar.
## Cuidado em provas
Não confunda inferência com opinião pessoal. Toda conclusão deve ter apoio no texto.'),
  (3,'Semântica: sinonímia, antonímia e paronímia','Analise relações de sentido e diferenças entre palavras semelhantes.','## Sinonímia
Sinônimos apresentam sentidos próximos, mas raramente são intercambiáveis em todos os contextos. “Casa” e “residência” podem ser equivalentes em muitas frases.
## Antonímia
Antônimos expressam oposição, como claro/escuro e aceitar/recusar. A oposição pode depender do contexto.
## Homônimos e parônimos
Homônimos apresentam identidade sonora ou gráfica com significados diferentes. Parônimos são parecidos na escrita ou pronúncia, mas têm sentidos distintos: descrição/discrição; comprimento/cumprimento.
## Uso em concursos
Leia a frase inteira antes de substituir uma palavra. A classe gramatical, a regência e o contexto também precisam ser preservados.'),
  (3,'Semântica: ambiguidade e sentido figurado','Identifique duplo sentido, denotação, conotação e efeitos expressivos.','## Denotação e conotação
Denotação é o sentido mais literal da palavra. Conotação é o sentido figurado construído pelo contexto.
## Ambiguidade
Uma construção é ambígua quando permite duas ou mais interpretações. Exemplo: “Vi o homem com o binóculo” pode indicar quem usava o binóculo.
## Como evitar
Reposicione termos, use pronomes com referentes claros e reescreva frases que permitam leituras indesejadas.
## Interpretação
A ambiguidade pode ser defeito em textos técnicos, mas também pode ser recurso intencional em humor e literatura.'),
  (4,'Organização textual: tipos e gêneros textuais','Diferencie tipologia textual, gênero, suporte e finalidade comunicativa.','## Tipos textuais
Narração apresenta acontecimentos; descrição caracteriza seres e ambientes; exposição explica; argumentação defende uma tese; injunção orienta ou instrui.
## Gêneros textuais
São formas de comunicação reconhecidas socialmente, como notícia, receita, e-mail, artigo de opinião, crônica e edital.
## Tipo e gênero não são a mesma coisa
Uma notícia é um gênero que pode combinar exposição e narração. Uma receita é gênero predominantemente injuntivo.
## Como identificar
Observe finalidade, público, linguagem, estrutura e situação de circulação.'),
  (4,'Organização textual: conectivos e progressão temática','Reconheça relações lógico-semânticas e a progressão das ideias.','## Conectivos
Conjunções e expressões conectivas explicitam relações entre ideias. “Porém” indica oposição; “portanto”, conclusão; “além disso”, adição; “embora”, concessão.
## Progressão temática
O texto progride quando apresenta informações novas relacionadas ao que já foi dito. Repetições excessivas podem tornar a leitura cansativa.
## Referenciação
Pronomes, sinônimos e expressões nominais retomam elementos anteriores ou antecipam informações.
## Atenção
A substituição de um conectivo pode mudar a lógica do período. Verifique se a relação original foi mantida.'),
  (5,'Fonética: encontros vocálicos e consonantais','Classifique ditongo, tritongo, hiato e encontros consonantais.','## Ditongo
Duas vogais pronunciadas na mesma sílaba formam ditongo, como em pai e noite.
## Tritongo
É a sequência semivogal + vogal + semivogal na mesma sílaba, como em Paraguai.
## Hiato
Duas vogais ficam em sílabas diferentes, como em sa-ú-de e po-e-ta.
## Encontro consonantal
Duas ou mais consoantes aparecem juntas, com sons preservados, como em prato e claro. Não confunda com dígrafo.'),
  (5,'Fonologia: sílaba, tonicidade e divisão silábica','Identifique sílabas, sílaba tônica e classificação quanto à tonicidade.','## Sílaba
Sílaba é uma unidade de emissão sonora organizada em torno de uma vogal. A divisão silábica segue critérios fonológicos e ortográficos.
## Tonicidade
Oxítona: última sílaba tônica. Paroxítona: penúltima. Proparoxítona: antepenúltima.
## Classificação pelo número de sílabas
Monossílaba tem uma sílaba; dissílaba, duas; trissílaba, três; polissílaba, quatro ou mais.
## Estratégia
Pronuncie a palavra naturalmente e identifique a sílaba pronunciada com maior intensidade.'),
  (6,'Ortografia: emprego de letras e dúvidas frequentes','Revise grafias que geram dúvidas e regras de uso de letras.','## S, SS, C, Ç e SC
A grafia depende da origem e da formação das palavras. Exemplos: exceção, necessário, crescer e passeio.
## G e J
Observe famílias de palavras e formas consagradas: viagem (substantivo) e viajem (verbo viajar).
## X e CH
Algumas grafias precisam ser memorizadas em famílias: enxergar, mexer, chave e chuva.
## Por que, porque, por quê e porquê
“Por que” aparece em perguntas e em construções equivalentes a “pelo qual”; “porque” explica; “por quê” ocorre no fim da pergunta; “porquê” é substantivo.'),
  (6,'Acentuação: regras gerais e casos especiais','Aplique regras de acentuação em oxítonas, paroxítonas e hiatos.','## Oxítonas
Acentuam-se, entre outros casos, as terminadas em a(s), e(s), o(s), em e ens: café, cipó, também.
## Paroxítonas
Acentuam-se as terminadas em l, n, r, x, ps, ã(s), ão(s), um/uns, i(s), us e ditongo, conforme as regras vigentes: fácil, hífen, tórax, álbum, história.
## Proparoxítonas
Todas são acentuadas: lâmpada, público, matemática.
## Hiatos
I e U tônicos em hiato recebem acento em condições específicas: saída, baú. Observe exceções e contexto ortográfico.'),
  (7,'Classes gramaticais: substantivo, adjetivo e artigo','Reconheça nomes, caracterizadores e determinantes no contexto.','## Substantivo
Nomeia seres, objetos, sentimentos, ações e conceitos. Pode ser comum, próprio, concreto, abstrato, simples, composto, primitivo ou derivado.
## Adjetivo
Caracteriza o substantivo e pode variar em gênero, número e grau. Em “ideias interessantes”, interessantes caracteriza ideias.
## Artigo
Define ou indef ine o substantivo: o, a, os, as; um, uma, uns, umas. O artigo também contribui para a determinação do referente.
## Contexto
A mesma palavra pode mudar de classe conforme a função: “o jantar” (substantivo) e “vamos jantar” (verbo).'),
  (7,'Classes gramaticais: pronomes, verbos e advérbios','Estude referência pronominal, flexão verbal e circunstâncias adverbiais.','## Pronomes
Podem substituir ou acompanhar nomes. Incluem pessoais, possessivos, demonstrativos, relativos, indefinidos e interrogativos.
## Verbos
Expressam ação, estado, mudança ou fenômeno. Flexionam em pessoa, número, tempo, modo e voz.
## Advérbios
Modificam verbos, adjetivos ou outros advérbios, indicando circunstâncias como tempo, lugar, modo, intensidade, afirmação, negação e dúvida.
## Análise
Em “Ela chegou muito cedo”, ela é pronome, chegou é verbo, muito intensifica o advérbio cedo.'),
  (8,'Morfologia: radical, desinência e afixos','Identifique os elementos que formam e flexionam as palavras.','## Radical
É o elemento que concentra o núcleo do significado lexical e aparece em famílias de palavras.
## Afixos
Prefixos antecedem o radical; sufixos aparecem depois. Em refazer, re- é prefixo; em felizmente, -mente é sufixo.
## Desinências
Indicam flexões nominais ou verbais. Em meninas, -s marca plural; em cantávamos, há marcas de tempo, modo, número e pessoa.
## Vogal temática
Liga o radical às desinências e caracteriza conjugações verbais: cantar, vender, partir.'),
  (8,'Morfologia: derivação e composição','Diferencie os principais processos de formação de palavras.','## Derivação
Pode ser prefixal (infeliz), sufixal (felizmente), prefixal e sufixal (infelizmente), parassintética (anoitecer), regressiva (pesca) e imprópria (o jantar).
## Composição
Justaposição reúne radicais sem perda significativa: passatempo. Aglutinação combina radicais com alteração fonética: planalto.
## Outros processos
Abreviação, sigla, onomatopeia e empréstimo também participam da formação e ampliação do léxico.
## Como resolver
Identifique a base, os elementos acrescentados e as mudanças de forma e classe.'),
  (9,'Sintaxe: sujeito, predicado e predicação verbal','Analise a estrutura básica da oração e a relação entre verbo e complementos.','## Sujeito
Pode ser simples, composto, oculto, indeterminado ou inexistente. Para identificá-lo, observe a concordância verbal e o sentido da oração.
## Predicado
É aquilo que se declara sobre o sujeito. Pode ser verbal, nominal ou verbo-nominal.
## Predicação verbal
Verbo intransitivo não exige complemento; transitivo direto exige objeto direto; transitivo indireto exige objeto preposicionado; bitransitivo admite dois complementos.
## Cuidado
O sujeito nem sempre pratica a ação. Em “O relatório foi revisado”, o sujeito recebe a ação.'),
  (9,'Sintaxe: complementos e adjuntos','Diferencie objetos, complemento nominal, adjunto adnominal e adverbial.','## Objeto direto e indireto
Completam o sentido de verbos transitivos. O objeto direto não exige preposição obrigatória; o indireto exige.
## Complemento nominal
Completa o sentido de um nome (substantivo, adjetivo ou advérbio) e é introduzido por preposição.
## Adjunto adnominal
Determina ou caracteriza um substantivo, podendo ser artigo, adjetivo, pronome, numeral ou locução adjetiva.
## Adjunto adverbial
Expressa circunstância: tempo, lugar, modo, causa, finalidade, entre outras.'),
  (10,'Pontuação: vírgula, ponto e sinais','Use os sinais de pontuação para organizar e dar clareza ao texto.','## Vírgula
Separa elementos de enumeração, isola vocativo e aposto, marca certas orações e termos deslocados. Não deve separar sujeito e predicado.
## Ponto e ponto e vírgula
O ponto encerra período. O ponto e vírgula separa partes coordenadas mais extensas ou itens complexos de uma enumeração.
## Dois-pontos e travessão
Dois-pontos anunciam explicação, enumeração ou fala. Travessão pode marcar diálogo ou intercalação.
## Efeito de sentido
A pontuação organiza a leitura e pode alterar a interpretação.'),
  (10,'Crase: casos obrigatórios, proibidos e facultativos','Reconheça a fusão da preposição a com o artigo ou pronome demonstrativo.','## Quando ocorre
A crase representa a fusão da preposição a com o artigo feminino a/as ou com certos pronomes demonstrativos. Exemplo: dirigir-se à escola.
## Casos proibidos
Em regra, não ocorre antes de verbo, palavra masculina, pronomes pessoais e artigos indefinidos.
## Casos facultativos
Pode ocorrer antes de nome próprio feminino e pronome possessivo feminino, conforme o contexto e a presença do artigo.
## Teste do masculino
Substitua o termo feminino por masculino. Se aparecer “ao”, há forte indicação de crase no feminino: fui ao mercado / fui à feira.'),
  (11,'Figuras de linguagem: metáfora, comparação e metonímia','Identifique figuras que aproximam ideias e produzem efeitos de sentido.','## Metáfora
Estabelece uma relação implícita: “Aquela criança é um raio de sol”.
## Comparação
Explicita a aproximação por conectivos: “A criança brilha como o sol”.
## Metonímia
Substitui um termo por outro com relação de proximidade: “Li Machado de Assis” (a obra do autor).
## Reconhecimento
Observe se a expressão deve ser entendida literalmente ou se cria uma associação expressiva.'),
  (11,'Figuras de linguagem: ironia, eufemismo e hipérbole','Reconheça recursos de intensificação, suavização e crítica.','## Ironia
Produz sentido diferente ou contrário ao literal, frequentemente com intenção crítica ou humorística. O contexto é decisivo.
## Eufemismo
Suaviza uma expressão considerada desagradável: “Ele nos deixou” em lugar de “morreu”.
## Hipérbole
Exagera intencionalmente: “Esperei uma eternidade”.
## Outras figuras
Antítese aproxima ideias opostas; personificação atribui características humanas a seres não humanos; onomatopeia imita sons.'),
  (12,'Reescrita: equivalência e substituição','Reescreva períodos preservando sentido, relações e correção gramatical.','## Equivalência semântica
Duas construções são equivalentes quando preservam a informação essencial e as relações de sentido no contexto.
## Substituição lexical
A troca por sinônimo exige atenção à regência, à classe gramatical, à concordância e às nuances de significado.
## Voz ativa e passiva
Na voz ativa, o sujeito pratica a ação; na passiva, recebe a ação. A transformação precisa preservar os participantes e o tempo verbal.
## Checklist
Compare o sentido, os conectivos, os pronomes, a pontuação e a estrutura sintática.'),
  (12,'Concursos: estratégias de resolução e revisão','Organize o tempo, leia comandos e analise alternativas com método.','## Leia o comando
Observe verbos como assinale, infere-se, exceto, incorreta e mantém-se. Uma palavra pode inverter o objetivo da questão.
## Analise as alternativas
Elimine opções que contradizem o texto, generalizam indevidamente ou acrescentam informações não autorizadas.
## Controle do tempo
Resolva primeiro o que domina, marque questões demoradas e reserve alguns minutos para revisão.
## Caderno de erros
Registre o assunto, o motivo do erro e a regra correta. Retorne ao tema e faça novas questões depois de um intervalo.')
  ) as x(stage,lesson_title,lesson_description,content)
  loop
    select id into module_uuid from public.modules where course_id=course_uuid and stage=r.stage limit 1;
    if not exists(select 1 from public.lessons where module_id=module_uuid and title=r.lesson_title) then
      insert into public.lessons(module_id,title,description,content,level,position,published,learning_objective,estimated_minutes)
      values(module_uuid,r.lesson_title,r.lesson_description,r.content,
        case when r.stage<=4 then 'iniciante' when r.stage<=8 then 'intermediario' else 'avancado' end,
        (select coalesce(max(position),0)+1 from public.lessons where module_id=module_uuid),
        true,r.lesson_description,20);
    end if;
  end loop;
end $$;
