-- The profile RPC only reads rows already protected by RLS; run it as the caller.
alter function public.get_game_profile() security invoker;
revoke all on function public.get_game_profile() from public, anon;
grant execute on function public.get_game_profile() to authenticated;
