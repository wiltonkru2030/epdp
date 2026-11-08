-- Allow students to update only the status of their own recommendations.
grant update(status) on public.study_recommendations to authenticated;
