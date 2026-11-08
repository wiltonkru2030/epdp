import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const auth = await readFile(new URL('../src/components/AuthModal.tsx', import.meta.url), 'utf8')
const assessment = await readFile(new URL('../src/components/AssessmentCenter.tsx', import.meta.url), 'utf8')
const migration = await readFile(new URL('../supabase/migrations/202611080015_auth_required_and_assessment_options.sql', import.meta.url), 'utf8')
const assessmentFix = await readFile(new URL('../supabase/migrations/202611080018_fix_assessment_recommendation_uuid_aggregate.sql', import.meta.url), 'utf8')

assert.match(app, /if \(authLoading\) return/, 'App must wait for Supabase session resolution')
assert.match(app, /if \(!user\) return .*AuthModal required/s, 'App must block all pages when there is no authenticated user')
assert.match(app, /if \(!user\) \{\s*setLessons\(\[\]\)/, 'Course data must not load for unauthenticated visitors')
assert.match(app, /learning_objective/, 'Course lessons must show their learning objective')
assert.match(app, /estimated_minutes/, 'Course lessons must show their estimated study time')
assert.match(auth, /required \? 'overlay auth-required-overlay'/, 'Required authentication modal must not be dismissible by clicking outside')
assert.match(auth, /!required && .*className="close"/, 'Required authentication modal must hide the close control')

assert.match(migration, /revoke all on all tables in schema public from anon, public/i, 'Anonymous database role must lose table access')
assert.match(migration, /drop policy if exists "Read public published lessons"/i, 'Public lesson policy must be removed')
assert.match(migration, /create policy "Read published courses"[\s\S]*to authenticated/i, 'Courses must be readable only by authenticated users')
assert.match(migration, /create policy "Read published modules"[\s\S]*to authenticated/i, 'Modules must be readable only by authenticated users')
assert.match(migration, /create or replace view public\.assessment_options/i, 'Safe assessment options view must exist')
assert.doesNotMatch(migration.match(/create or replace view public\.assessment_options[\s\S]*?grant select on public\.assessment_options/i)?.[0] ?? '', /is_correct/i, 'Assessment options view must never expose the answer key')
assert.match(migration, /if v_user_id is null then raise exception/i, 'Assessment submission RPC must require a signed-in user')
assert.match(migration, /coalesce\(chosen\.option_text, 'Não respondida'\)/, 'Timed-out unanswered questions must be reported')
assert.match(migration, /alter default privileges in schema public revoke all on tables from anon/i, 'Future tables must not receive anonymous access by default')

assert.match(assessment, /from\('assessment_options'\)/, 'Assessment UI must read safe options view, not answer-key table')
assert.match(assessment, /time_limit_seconds/, 'Assessment timer must honor configured time limits')
assert.match(assessment, /setExpired\(true\)/, 'Assessment must handle timer expiry')
assert.match(assessment, /option_id: answers\[q\.id\] \?\? null/, 'Unanswered questions must be submitted as unanswered')
assert.match(assessment, /assessment_attempts/, 'Assessment center must show attempt history')
assert.match(assessment, /mock_exam/, 'Assessment center must distinguish mock exams')
assert.match(assessment, /correct_explanation/, 'Assessment results must show correction explanations')
assert.match(assessmentFix, /array_agg\(q\.review_lesson_id\)/, 'Assessment recommendations must aggregate UUID lesson references safely')

console.log('EPDP learning checks passed: mandatory authentication, anonymous database lockout, protected answer key, timed assessments, history and course objectives.')
