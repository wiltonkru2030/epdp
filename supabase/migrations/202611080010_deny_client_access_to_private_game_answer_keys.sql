-- Explicitly deny direct API access to the private answer key table.
drop policy if exists "Deny client access to game answer keys" on private.game_challenge_keys;
create policy "Deny client access to game answer keys"
on private.game_challenge_keys
for all
to anon, authenticated
using (false)
with check (false);
