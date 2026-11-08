-- Keep the privileged reward transaction outside the exposed API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.record_game_attempt(
  p_game_slug text,
  p_correct_count integer,
  p_total_count integer,
  p_duration_seconds integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
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
  if p_total_count is null or p_total_count < 1 or p_total_count > 100
     or p_correct_count is null or p_correct_count < 0 or p_correct_count > p_total_count then
    raise exception 'Pontuação inválida.';
  end if;
  if p_duration_seconds is not null and (p_duration_seconds < 0 or p_duration_seconds > 86400) then
    raise exception 'Duração inválida.';
  end if;

  v_score := round((p_correct_count::numeric / p_total_count::numeric) * 100)::integer;
  v_xp := 20 + (p_correct_count * 25) + case when v_score = 100 then 20 else 0 end;
  v_coins := 5 + (p_correct_count * 3) + case when v_score = 100 then 5 else 0 end;

  insert into public.game_attempts(user_id,game_slug,score,correct_count,total_count,duration_seconds)
  values(v_user_id,p_game_slug,v_score,p_correct_count,p_total_count,p_duration_seconds)
  returning id into v_attempt_id;

  insert into public.game_player_stats(user_id,xp,coins,total_games,total_correct,best_score)
  values(v_user_id,v_xp,v_coins,1,p_correct_count,v_score)
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
    'attempt_id',v_attempt_id,'score',v_score,'correct_count',p_correct_count,
    'total_count',p_total_count,'xp_earned',v_xp+v_bonus_xp,
    'coins_earned',v_coins+v_bonus_coins,'total_xp',v_stats.xp,
    'total_coins',v_stats.coins,'total_games',v_stats.total_games,
    'best_score',v_stats.best_score,'new_achievements',v_new_achievements
  );
end;
$$;
revoke all on function private.record_game_attempt(text,integer,integer,integer) from public, anon;
grant execute on function private.record_game_attempt(text,integer,integer,integer) to authenticated;

create or replace function public.record_game_attempt(
  p_game_slug text,
  p_correct_count integer,
  p_total_count integer,
  p_duration_seconds integer default null
) returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.record_game_attempt(p_game_slug,p_correct_count,p_total_count,p_duration_seconds);
$$;
revoke all on function public.record_game_attempt(text,integer,integer,integer) from public, anon;
grant execute on function public.record_game_attempt(text,integer,integer,integer) to authenticated;
