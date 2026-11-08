-- Estudantes podem alterar apenas o próprio nome; o papel é controlado pelo servidor.
revoke update on table public.profiles from authenticated;
grant update (full_name, updated_at) on table public.profiles to authenticated;
