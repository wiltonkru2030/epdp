begin;
alter view public.assessment_options set (security_invoker = true, security_barrier = true);
revoke select on public.question_options from authenticated, anon, public;
grant select (id, question_id, option_label, option_text, position)
on public.question_options to authenticated;
commit;