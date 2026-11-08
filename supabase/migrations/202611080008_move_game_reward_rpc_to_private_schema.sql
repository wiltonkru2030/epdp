-- Move the SECURITY DEFINER reward transaction to a non-exposed schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- The private.record_game_attempt function contains the validated, transactional
-- implementation and is executable only by authenticated users. The public RPC
-- is a SECURITY INVOKER wrapper and is the only function called by the client.
