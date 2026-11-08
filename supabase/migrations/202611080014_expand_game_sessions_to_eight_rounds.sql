begin;
alter table private.game_challenge_keys drop constraint if exists game_challenge_keys_challenge_index_check;
alter table private.game_challenge_keys add constraint game_challenge_keys_challenge_index_check check (challenge_index between 0 and 7);
insert into private.game_challenge_keys(game_slug,challenge_index,answer) values
('caca-palavras',6,'LEITURA'),
('caca-palavras',7,'FRASE'),
('forca-palavras',6,'PORTUGUÊS'),
('forca-palavras',7,'SINTAXE'),
('complete-word',6,'Ç'),
('complete-word',7,'SS'),
('acentuacao',6,'sofá'),
('acentuacao',7,'têm'),
('separacao-silabica',6,'A-BA-CA-XI'),
('separacao-silabica',7,'FA-MÍ-LIA'),
('classificacao-substantivos',6,'Abstrato'),
('classificacao-substantivos',7,'Coletivo'),
('identifique-adjetivos',6,'Florido'),
('identifique-adjetivos',7,'Precisa'),
('desafio-pronomes',6,'Demonstrativo'),
('desafio-pronomes',7,'Indefinido'),
('conjugacao-verbos',6,'fizemos'),
('conjugacao-verbos',7,'chegar'),
('corrida-tempos-verbais',6,'Pretérito mais-que-perfeito composto'),
('corrida-tempos-verbais',7,'Futuro do subjuntivo'),
('monte-frase',6,'A escrita clara facilita a comunicação.'),
('monte-frase',7,'Os bons leitores interpretam melhor os textos.'),
('organize-palavras',6,'A revisão melhora a escrita.'),
('organize-palavras',7,'O diálogo aproxima diferentes ideias.'),
('encontre-erro',6,'Existe'),
('encontre-erro',7,'livro'),
('sinonimos-antonimos',6,'Egoísta'),
('sinonimos-antonimos',7,'Prudente'),
('homonimos-paronimos',6,'Confirmar'),
('homonimos-paronimos',7,'Prestes a acontecer'),
('interpretacao',6,'A revisão ajuda a identificar e corrigir problemas.'),
('interpretacao',7,'Para deixar o texto mais claro.'),
('figuras-linguagem',6,'Personificação'),
('figuras-linguagem',7,'Hipérbole'),
('pontuacao',6,':'),
('pontuacao',7,'—'),
('concordancia',6,'foi'),
('concordancia',7,'sozinhas'),
('batalha-conhecimentos',6,'A sala estava silenciosa.'),
('batalha-conhecimentos',7,'Cheguei à escola cedo.')
on conflict(game_slug,challenge_index) do update set answer=excluded.answer;
CREATE OR REPLACE FUNCTION private.record_game_attempt(p_game_slug text, p_answers jsonb, p_duration_seconds integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_correct integer := 0;
  v_total integer := 8;
  v_score integer;
  v_xp integer;
  v_coins integer;
  v_bonus_xp integer := 0;
  v_bonus_coins integer := 0;
  v_stats public.game_player_stats%rowtype;
  v_new_achievements jsonb := '[]'::jsonb;
begin
  if v_user_id is null then raise exception 'Entre na sua conta para salvar o resultado do jogo.'; end if;
  if p_game_slug is null or p_game_slug !~ '^[a-z0-9-]{2,60}$' then raise exception 'Identificador de jogo inválido.'; end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> v_total then
    raise exception 'Envie as oito respostas da partida.';
  end if;
  if p_duration_seconds is not null and (p_duration_seconds < 0 or p_duration_seconds > 86400) then
    raise exception 'Duração inválida.';
  end if;
  if (select count(distinct s.challenge_index) from jsonb_to_recordset(p_answers) as s(challenge_index integer,answer text)) <> v_total
     or exists (
       select 1
       from jsonb_to_recordset(p_answers) as s(challenge_index integer,answer text)
       left join private.game_challenge_keys k
         on k.game_slug=p_game_slug and k.challenge_index=s.challenge_index
       where k.game_slug is null or s.answer is null
     ) then
    raise exception 'As respostas enviadas não correspondem às fases desta partida.';
  end if;

  select count(*) filter (
    where regexp_replace(lower(btrim(translate(s.answer,
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
      'AAAAAEEEEIIIIOOOOOUUUUCAAAAAEEEEIIIIOOOOOUUUUC'))), '\s+', ' ', 'g')
    =
    regexp_replace(lower(btrim(translate(k.answer,
      'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
      'AAAAAEEEEIIIIOOOOOUUUUCAAAAAEEEEIIIIOOOOOUUUUC'))), '\s+', ' ', 'g')
  ) into v_correct
  from jsonb_to_recordset(p_answers) as s(challenge_index integer,answer text)
  join private.game_challenge_keys k
    on k.game_slug=p_game_slug and k.challenge_index=s.challenge_index;

  v_score := round((v_correct::numeric / v_total::numeric) * 100)::integer;
  v_xp := 20 + (v_correct * 25) + case when v_score = 100 then 20 else 0 end;
  v_coins := 5 + (v_correct * 3) + case when v_score = 100 then 5 else 0 end;

  insert into public.game_attempts(user_id,game_slug,score,correct_count,total_count,duration_seconds)
  values(v_user_id,p_game_slug,v_score,v_correct,v_total,p_duration_seconds)
  returning id into v_attempt_id;

  insert into public.game_player_stats(user_id,xp,coins,total_games,total_correct,best_score)
  values(v_user_id,v_xp,v_coins,1,v_correct,v_score)
  on conflict(user_id) do update set
    xp = public.game_player_stats.xp + excluded.xp,
    coins = public.game_player_stats.coins + excluded.coins,
    total_games = public.game_player_stats.total_games + 1,
    total_correct = public.game_player_stats.total_correct + excluded.total_correct,
    best_score = greatest(public.game_player_stats.best_score, excluded.best_score),
    updated_at = now()
  returning * into v_stats;

  with unlocked as (
    insert into public.user_game_achievements(user_id,achievement_code)
    select v_user_id, earned.code
    from (values
      ('first-victory'::text, v_stats.total_games >= 1),
      ('five-games'::text, v_stats.total_games >= 5),
      ('ten-games'::text, v_stats.total_games >= 10),
      ('perfect-game'::text, v_score = 100),
      ('xp-500'::text, v_stats.xp >= 500)
    ) as earned(code, qualifies)
    where earned.qualifies
    on conflict(user_id,achievement_code) do nothing
    returning achievement_code
  )
  select coalesce(sum(a.xp_reward),0),coalesce(sum(a.coin_reward),0),
    coalesce(jsonb_agg(jsonb_build_object(
      'code',a.code,'title',a.title,'description',a.description,'icon',a.icon,
      'xp_reward',a.xp_reward,'coin_reward',a.coin_reward
    )),'[]'::jsonb)
  into v_bonus_xp,v_bonus_coins,v_new_achievements
  from unlocked u join public.game_achievements a on a.code=u.achievement_code;

  if v_bonus_xp > 0 or v_bonus_coins > 0 then
    update public.game_player_stats
    set xp=xp+v_bonus_xp,coins=coins+v_bonus_coins,updated_at=now()
    where user_id=v_user_id
    returning * into v_stats;
  end if;

  return jsonb_build_object(
    'attempt_id',v_attempt_id,'score',v_score,'correct_count',v_correct,
    'total_count',v_total,'xp_earned',v_xp+v_bonus_xp,
    'coins_earned',v_coins+v_bonus_coins,'total_xp',v_stats.xp,
    'total_coins',v_stats.coins,'total_games',v_stats.total_games,
    'best_score',v_stats.best_score,'new_achievements',v_new_achievements
  );
end;
$function$
;
create index if not exists user_game_achievements_achievement_code_idx on public.user_game_achievements(achievement_code);
commit;