-- Expand each EPDP game from eight to ten server-scored challenges.
begin;
alter table private.game_challenge_keys drop constraint if exists game_challenge_keys_challenge_index_check;
alter table private.game_challenge_keys add constraint game_challenge_keys_challenge_index_check check (challenge_index between 0 and 9);
insert into private.game_challenge_keys(game_slug,challenge_index,answer) values
('caca-palavras',8,'NORMA'),('caca-palavras',9,'LETRA'),
('forca-palavras',8,'ADVÉRBIO'),('forca-palavras',9,'ARTIGO'),
('complete-word',8,'X'),('complete-word',9,'SS'),
('acentuacao',8,'Lógico'),('acentuacao',9,'Têm'),
('separacao-silabica',8,'BOR-BO-LE-TA'),('separacao-silabica',9,'COM-PU-TA-DOR'),
('classificacao-substantivos',8,'Coletivo'),('classificacao-substantivos',9,'Próprio'),
('identifique-adjetivos',8,'Longa'),('identifique-adjetivos',9,'Nublado'),
('desafio-pronomes',8,'Possessivo'),('desafio-pronomes',9,'Interrogativo'),
('conjugacao-verbos',8,'Eu escrevi'),('conjugacao-verbos',9,'partiremos'),
('corrida-tempos-verbais',8,'Subjuntivo'),('corrida-tempos-verbais',9,'Futuro do presente'),
('monte-frase',8,'Os estudantes revisaram o conteúdo.'),('monte-frase',9,'A professora corrigiu as atividades.'),
('organize-palavras',8,'A prática fortalece a aprendizagem.'),('organize-palavras',9,'O estudo exige constância.'),
('encontre-erro',8,'Fazem'),('encontre-erro',9,'Houveram'),
('sinonimos-antonimos',8,'Tranquilo'),('sinonimos-antonimos',9,'Expandir'),
('homonimos-paronimos',8,'Circulação'),('homonimos-paronimos',9,'Confirmar'),
('interpretacao',8,'Facilitou a localização dos livros.'),('interpretacao',9,'Tornou a pesquisa mais prática.'),
('figuras-linguagem',8,'Metonímia'),('figuras-linguagem',9,'Onomatopeia'),
('pontuacao',8,','),('pontuacao',9,';'),
('concordancia',8,'chegou'),('concordancia',9,'fiz'),
('batalha-conhecimentos',8,'Ficamos em casa porque choveu.'),('batalha-conhecimentos',9,'Entreguei o documento à diretora.')
on conflict(game_slug,challenge_index) do update set answer=excluded.answer;
do $migration$
declare v_definition text;
begin
 select pg_get_functiondef('private.record_game_attempt(text,jsonb,integer)'::regprocedure) into v_definition;
 if position('v_total integer := 8;' in v_definition)>0 then
  v_definition:=replace(v_definition,'v_total integer := 8;','v_total integer := 10;');
  v_definition:=replace(v_definition,'Envie as oito respostas da partida.','Envie as dez respostas da partida.');
  execute v_definition;
 elsif position('v_total integer := 10;' in v_definition)=0 then
  raise exception 'A função de pontuação não está na versão esperada de oito ou dez rodadas.';
 end if;
end;
$migration$;
commit;
