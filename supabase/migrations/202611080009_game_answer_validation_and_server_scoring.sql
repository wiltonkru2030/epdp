-- Server-side answer validation: never trust client-supplied correct counts.
create table if not exists private.game_challenge_keys (
  game_slug text not null,
  challenge_index integer not null check (challenge_index between 0 and 2),
  answer text not null,
  primary key (game_slug,challenge_index)
);
alter table private.game_challenge_keys enable row level security;
revoke all on table private.game_challenge_keys from public, anon, authenticated;

insert into private.game_challenge_keys(game_slug,challenge_index,answer) values
('caca-palavras',0,'LIVRO'),
('caca-palavras',1,'VERBO'),
('caca-palavras',2,'TEXTO'),
('forca-palavras',0,'COERÊNCIA'),
('forca-palavras',1,'SUBSTANTIVO'),
('forca-palavras',2,'METÁFORA'),
('complete-word',0,'Ç'),
('complete-word',1,'G'),
('complete-word',2,'L'),
('acentuacao',0,'saúde'),
('acentuacao',1,'ideia'),
('acentuacao',2,'lâmpada'),
('separacao-silabica',0,'JA-NE-LA'),
('separacao-silabica',1,'ES-CO-LA'),
('separacao-silabica',2,'CA-DEI-RA'),
('classificacao-substantivos',0,'Próprio'),
('classificacao-substantivos',1,'Abstrato'),
('classificacao-substantivos',2,'Coletivo'),
('identifique-adjetivos',0,'Azul'),
('identifique-adjetivos',1,'Dedicado'),
('identifique-adjetivos',2,'Tranquila'),
('desafio-pronomes',0,'Ela chegou cedo.'),
('desafio-pronomes',1,'Nós'),
('desafio-pronomes',2,'Comprei-os.'),
('conjugacao-verbos',0,'Eu canto'),
('conjugacao-verbos',1,'estudamos'),
('conjugacao-verbos',2,'viajarão'),
('corrida-tempos-verbais',0,'Pretérito imperfeito'),
('corrida-tempos-verbais',1,'Subjuntivo'),
('corrida-tempos-verbais',2,'Imperativo'),
('monte-frase',0,'A leitura amplia o conhecimento.'),
('monte-frase',1,'Os alunos estudaram para a prova.'),
('monte-frase',2,'A professora explicou a matéria.'),
('organize-palavras',0,'Todos devem respeitar as diferenças.'),
('organize-palavras',1,'A leitura transforma realidades.'),
('organize-palavras',2,'O conhecimento exige dedicação.'),
('encontre-erro',0,'vai'),
('encontre-erro',1,'Fazem'),
('encontre-erro',2,'Menas'),
('sinonimos-antonimos',0,'Contente'),
('sinonimos-antonimos',1,'Abundante'),
('sinonimos-antonimos',2,'Começar'),
('homonimos-paronimos',0,'Reparo'),
('homonimos-paronimos',1,'Reservada'),
('homonimos-paronimos',2,'Saudação'),
('interpretacao',0,'A leitura amplia conhecimentos e perspectivas.'),
('interpretacao',1,'Conhecer outras realidades.'),
('interpretacao',2,'Envolve compreensão e reflexão.'),
('figuras-linguagem',0,'Metáfora'),
('figuras-linguagem',1,'Hipérbole'),
('figuras-linguagem',2,'Personificação'),
('pontuacao',0,'!'),
('pontuacao',1,'?'),
('pontuacao',2,','),
('concordancia',0,'As meninas chegaram cedo.'),
('concordancia',1,'É proibida a entrada.'),
('concordancia',2,'anexos'),
('batalha-conhecimentos',0,'Público'),
('batalha-conhecimentos',1,'Indeterminado'),
('batalha-conhecimentos',2,'Entretanto')
on conflict(game_slug,challenge_index) do update set answer=excluded.answer;

drop function if exists public.record_game_attempt(text,integer,integer,integer);
drop function if exists private.record_game_attempt(text,integer,integer,integer);

create or replace function private.record_game_attempt(
  p_game_slug text,
  p_answers jsonb,
  p_duration_seconds integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_correct integer := 0;
  v_total integer := 3;
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
    raise exception 'Envie as três respostas da partida.';
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
$$;
revoke all on function private.record_game_attempt(text,jsonb,integer) from public, anon;
grant execute on function private.record_game_attempt(text,jsonb,integer) to authenticated;

create or replace function public.record_game_attempt(
  p_game_slug text,
  p_answers jsonb,
  p_duration_seconds integer default null
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.record_game_attempt(p_game_slug,p_answers,p_duration_seconds);
$$;
revoke all on function public.record_game_attempt(text,jsonb,integer) from public, anon;
grant execute on function public.record_game_attempt(text,jsonb,integer) to authenticated;
