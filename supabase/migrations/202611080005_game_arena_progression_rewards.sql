-- EPDP Game Arena: progressão persistente, moedas e conquistas.
create table if not exists public.game_player_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  total_games integer not null default 0 check (total_games >= 0),
  total_correct integer not null default 0 check (total_correct >= 0),
  best_score integer not null default 0 check (best_score between 0 and 100),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_achievements (
  code text primary key,
  title text not null,
  description text not null,
  icon text not null,
  xp_reward integer not null default 0 check (xp_reward >= 0),
  coin_reward integer not null default 0 check (coin_reward >= 0)
);

create table if not exists public.user_game_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.game_achievements(code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_code)
);

insert into public.game_achievements(code,title,description,icon,xp_reward,coin_reward) values
('first-victory','Primeira vitória','Conclua sua primeira partida.','star',25,10),
('five-games','Aventureiro','Conclua cinco partidas.','trophy',50,20),
('ten-games','Mestre da arena','Conclua dez partidas.','crown',100,40),
('perfect-game','Perfeição','Finalize uma partida sem errar.','spark',40,15),
('xp-500','Estudante dedicado','Acumule 500 pontos de experiência.','book',75,25)
on conflict (code) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,xp_reward=excluded.xp_reward,coin_reward=excluded.coin_reward;

alter table public.game_player_stats enable row level security;
alter table public.game_achievements enable row level security;
alter table public.user_game_achievements enable row level security;

drop policy if exists "Read own game stats" on public.game_player_stats;
create policy "Read own game stats" on public.game_player_stats for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Read achievement catalog" on public.game_achievements;
create policy "Read achievement catalog" on public.game_achievements for select to authenticated
using (true);
drop policy if exists "Read own game achievements" on public.user_game_achievements;
create policy "Read own game achievements" on public.user_game_achievements for select to authenticated
using ((select auth.uid()) = user_id);

grant select on public.game_player_stats, public.game_achievements, public.user_game_achievements to authenticated;
revoke insert, update, delete on public.game_player_stats, public.game_achievements, public.user_game_achievements from anon, authenticated;

create or replace function public.record_game_attempt(
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
  on conflict(user_id,achievement_code) do nothing;

  select coalesce(jsonb_agg(jsonb_build_object(
    'code', a.code, 'title', a.title, 'description', a.description,
    'icon', a.icon, 'xp_reward', a.xp_reward, 'coin_reward', a.coin_reward
  ) order by uga.unlocked_at desc), '[]'::jsonb)
  into v_new_achievements
  from public.user_game_achievements uga
  join public.game_achievements a on a.code = uga.achievement_code
  where uga.user_id = v_user_id
    and uga.unlocked_at >= now() - interval '2 seconds';

  return jsonb_build_object(
    'attempt_id',v_attempt_id,'score',v_score,'correct_count',p_correct_count,
    'total_count',p_total_count,'xp_earned',v_xp,'coins_earned',v_coins,
    'total_xp',v_stats.xp,'total_coins',v_stats.coins,
    'total_games',v_stats.total_games,'best_score',v_stats.best_score,
    'new_achievements',v_new_achievements
  );
end;
$$;
revoke all on function public.record_game_attempt(text,integer,integer,integer) from public, anon;
grant execute on function public.record_game_attempt(text,integer,integer,integer) to authenticated;

create or replace function public.get_game_profile()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_stats public.game_player_stats%rowtype;
  v_achievements jsonb;
  v_recent jsonb;
begin
  if v_user_id is null then raise exception 'Entre na sua conta para consultar seu progresso.'; end if;
  select * into v_stats from public.game_player_stats where user_id = v_user_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'code', a.code,'title',a.title,'description',a.description,'icon',a.icon,'unlocked_at',uga.unlocked_at
  ) order by uga.unlocked_at desc),'[]'::jsonb)
  into v_achievements
  from public.user_game_achievements uga
  join public.game_achievements a on a.code = uga.achievement_code
  where uga.user_id = v_user_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'game_slug',ga.game_slug,'score',ga.score,'correct_count',ga.correct_count,
    'total_count',ga.total_count,'duration_seconds',ga.duration_seconds,'created_at',ga.created_at
  ) order by ga.created_at desc),'[]'::jsonb)
  into v_recent
  from (select * from public.game_attempts where user_id=v_user_id order by created_at desc limit 10) ga;
  return jsonb_build_object(
    'xp',coalesce(v_stats.xp,0),'coins',coalesce(v_stats.coins,0),
    'total_games',coalesce(v_stats.total_games,0),'total_correct',coalesce(v_stats.total_correct,0),
    'best_score',coalesce(v_stats.best_score,0),'achievements',v_achievements,'recent_games',v_recent
  );
end;
$$;
revoke all on function public.get_game_profile() from public, anon;
grant execute on function public.get_game_profile() to authenticated;
