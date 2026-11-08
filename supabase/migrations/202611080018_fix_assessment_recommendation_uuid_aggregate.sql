do $$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.submit_assessment(uuid,jsonb,integer)'::regprocedure)
  into v_definition;
  v_definition := replace(
    v_definition,
    'min(q.review_lesson_id)',
    '(array_agg(q.review_lesson_id) filter (where q.review_lesson_id is not null))[1]'
  );
  execute v_definition;
end;
$$;