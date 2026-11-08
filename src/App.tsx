import { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import AuthModal from './components/AuthModal'
import GamesArcade from './components/GamesArcade'
import AssessmentCenter from './components/AssessmentCenter'
import ReinforcementCenter from './components/ReinforcementCenter'
import DashboardCenter from './components/DashboardCenter'
import ProfileCenter from './components/ProfileCenter'
import LessonExperience from './components/LessonExperience'

type Page = 'Início' | 'Meu curso' | 'Testes e avaliações' | 'Jogos educativos' | 'Reforço' | 'Meu perfil'
type CourseModule = { id: string; title: string; stage: number; description: string }
type Lesson = {
  id: string
  title: string
  description: string
  content: string
  level: string
  position: number
  learning_objective?: string
  estimated_minutes?: number
  module_id?: string | null
}
const pages: Page[] = ['Início', 'Meu curso', 'Testes e avaliações', 'Jogos educativos', 'Reforço', 'Meu perfil']

export default function App() {
  const [page, setPage] = useState<Page>('Início')
  const { user, loading: authLoading } = useAuth()
  const [menu, setMenu] = useState(false)
  const [login, setLogin] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courseModules, setCourseModules] = useState<CourseModule[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonError, setLessonError] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [savingProgress, setSavingProgress] = useState(false)

  useEffect(() => {
    let active = true
    async function loadCourse() {
      if (!user) {
        setLessons([]); setCourseModules([]); setCompleted([]); setLessonsLoading(false); setLessonError('')
        return
      }
      setLessonsLoading(true)
      setLessonError('')
      const [{ data, error }, { data: moduleData }] = await Promise.all([
        supabase.from('lessons').select('id,title,description,content,level,position,learning_objective,estimated_minutes,module_id').eq('published', true).order('position'),
        supabase.from('modules').select('id,title,stage,description').eq('published', true).order('stage'),
      ])
      if (!active) return
      if (error) {
        setLessonError('Não foi possível carregar as aulas. Entre na sua conta e tente novamente.')
        setLessons([])
      } else {
        setLessons((data ?? []) as Lesson[])
      }
      setCourseModules((moduleData ?? []) as CourseModule[])
      if (user) {
        const { data: progress } = await supabase
          .from('user_progress')
          .select('lesson_id,completed')
          .eq('user_id', user.id)
          .eq('completed', true)
        if (active) setCompleted((progress ?? []).map(item => item.lesson_id))
      } else if (active) {
        setCompleted([])
      }
      if (active) setLessonsLoading(false)
    }
    void loadCourse()
    return () => { active = false }
  }, [user])

  async function finishLesson(lesson: Lesson, score?: number) {
    if (!user) {
      setLogin(true)
      return
    }
    setSavingProgress(true)
    const { error } = await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      completed: true,
      score: score ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    setSavingProgress(false)
    if (error) {
      setLessonError('Não foi possível salvar sua conclusão. Tente novamente.')
      return
    }
    setCompleted(current => current.includes(lesson.id) ? current : [...current, lesson.id])
    setSelectedLesson(null)
  }

  const content = () => {
    if (page === 'Jogos educativos') return <GamesArcade />
    if (page === 'Meu curso') return <>
      {selectedLesson ? <LessonExperience lesson={selectedLesson} completed={completed.includes(selectedLesson.id)} saving={savingProgress} onBack={() => setSelectedLesson(null)} onFinish={(score) => void finishLesson(selectedLesson, score)} /> : <>
        <div className="intro"><small>TRILHA DE APRENDIZAGEM</small><h2>Português — sua trilha de aprendizagem</h2><p>Comece pelos fundamentos, avance com aulas organizadas e acompanhe seu progresso. Novas etapas serão liberadas conforme forem publicadas.</p></div>
        
        <div className="course-progress"><b>{completed.length} de {lessons.length} aulas concluídas</b><div className="bar"><span style={{ width: lessons.length ? (completed.length / lessons.length * 100) + '%' : '0%' }} /></div></div>
        {lessonsLoading && <div className="card panel">Carregando aulas...</div>}
        {lessonError && <div className="card panel auth-error">{lessonError}</div>}
        {!lessonsLoading && lessons.length === 0 && <div className="card panel">Nenhuma aula publicada foi encontrada.</div>}
        {courseModules.map(module => {
          const moduleLessons = lessons.filter(lesson => lesson.module_id === module.id)
          if (!moduleLessons.length) return null
          const moduleCompleted = moduleLessons.filter(lesson => completed.includes(lesson.id)).length
          return <section className="course-module-group" key={module.id}>
            <div className="course-module-banner"><small>ETAPA {String(module.stage).padStart(2, '0')}</small><b>{module.title}</b><span>{moduleLessons.length} aula(s) · {moduleCompleted} concluída(s)</span><p>{module.description}</p></div>
            {moduleLessons.map(lesson => <article className="card lesson" key={lesson.id}>
              <b>{String(lesson.position).padStart(2, '0')}</b>
              <div><h3>{lesson.title}</h3><p>{lesson.description}</p><small className="lesson-meta">{lesson.estimated_minutes ?? 15} min de estudo · {lesson.level}</small></div>
              <small className={completed.includes(lesson.id) ? 'lesson-done' : ''}>{completed.includes(lesson.id) ? 'Concluída' : 'Disponível'}</small>
              <button className="soft" onClick={() => setSelectedLesson(lesson)}>Estudar</button>
            </article>)}
          </section>
        })}
        {!user && <p className="course-login-note">Você pode ler as aulas. Entre na sua conta para salvar seu progresso.</p>}
      </>}
    </>
    if (page === 'Testes e avaliações') return user ? <AssessmentCenter onOpenLesson={(lessonId) => { const lesson = lessons.find(item => item.id === lessonId); if (lesson) setSelectedLesson(lesson); setPage('Meu curso') }} /> : <section className="card panel"><h2>Entre para realizar avaliações</h2><p>Suas tentativas e resultados ficam vinculados à sua conta.</p><button onClick={() => setLogin(true)}>Entrar ou criar conta</button></section>
    if (page === 'Reforço') return user ? <ReinforcementCenter onOpenLesson={(lessonId) => { const lesson = lessons.find(item => item.id === lessonId); if (lesson) setSelectedLesson(lesson); setPage('Meu curso') }} /> : <section className="card panel"><h2>Entre para acessar seu reforço</h2><p>As recomendações são individuais e dependem do seu histórico de aprendizagem.</p><button onClick={() => setLogin(true)}>Entrar ou criar conta</button></section>
    if (page === 'Meu perfil') return <ProfileCenter onSignOut={async () => { await supabase.auth.signOut(); setPage('Início') }} />
    return <DashboardCenter onNavigate={(nextPage) => setPage(nextPage)} />
  }

  if (authLoading) return <main className="auth-gate-shell"><div className="auth-gate-loading"><span className="auth-gate-mark">E</span><b>EPDP</b><p>Verificando sua sessão segura...</p></div></main>
  if (!user) return <main className="auth-gate-shell"><div className="auth-gate-brand"><span className="auth-gate-mark">E</span><div><b>EPDP</b><small>ESTUDO PROFUNDO DE PORTUGUÊS</small></div><h1>Seu próximo passo começa pelo conhecimento.</h1><p>Entre na sua conta para acessar aulas, atividades, jogos, avaliações e acompanhar sua evolução.</p><ul><li>Curso organizado por etapas</li><li>Exercícios e avaliações com correção</li><li>Progresso salvo na sua conta</li></ul></div><AuthModal required onClose={() => {}} /></main>

  if (page === "Jogos educativos") return <div className="game-mode"><GamesArcade /></div>

  return <div className="layout"><aside className={menu ? 'sidebar open' : 'sidebar'}><div className="brand"><b>E</b><div><strong>EPDP</strong><small>Estudo Profundo de Português</small></div></div><small className="muted">MENU PRINCIPAL</small><nav>{pages.map((p, i) => <button className={page === p ? 'active' : ''} key={p} onClick={() => { setPage(p); setSelectedLesson(null); setMenu(false) }}><span>{['⌂', '▤', '✓', '◇', '↗', '○'][i]}</span>{p}</button>)}</nav><div className="bottom"><b>Continue evoluindo</b><p>Seu aprendizado começa com um passo.</p><button className="link" onClick={() => setPage('Meu curso')}>Ver trilha →</button></div></aside><main><header><button className="hamb" onClick={() => setMenu(!menu)}>☰</button><div>Painel <span>/</span> <b>{page}</b></div><button className="outline" onClick={() => user ? void supabase.auth.signOut() : setLogin(true)}>{user ? 'Sair' : 'Entrar'}</button></header><div className="content"><div className="heading"><div><small>SUA JORNADA DE APRENDIZADO</small><h1>{selectedLesson ? selectedLesson.title : page}</h1></div><small>Plataforma de estudos</small></div>{content()}<footer>© 2026 EPDP — Estudo Profundo de Português.</footer></div></main>{login && <AuthModal onClose={() => setLogin(false)} />}</div>
}
