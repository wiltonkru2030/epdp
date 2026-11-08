import { useEffect, useMemo, useState } from 'react'
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
type Lesson = { id: string; title: string; description: string; content: string; level: string; position: number; learning_objective?: string; estimated_minutes?: number; module_id?: string | null }
const pages: Page[] = ['Início', 'Meu curso', 'Testes e avaliações', 'Jogos educativos', 'Reforço', 'Meu perfil']
const moduleArt = ['✦','▤','Aa','✎','◉','✓','ABC','⌘','¶','“ ”','❝','↗']
const moduleColors = ['lavender','blue','peach','mint','gold','rose']

export default function App() {
  const [page, setPage] = useState<Page>('Início')
  const { user, loading: authLoading } = useAuth()
  const [menu, setMenu] = useState(false)
  const [login, setLogin] = useState(false)
  const [signup, setSignup] = useState(false)
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
      if (!user) { setLessons([]); setCourseModules([]); setCompleted([]); setLessonsLoading(false); return }
      setLessonsLoading(true); setLessonError('')
      const [{ data, error }, { data: moduleData }] = await Promise.all([
        supabase.from('lessons').select('id,title,description,content,level,position,learning_objective,estimated_minutes,module_id').eq('published', true).order('position'),
        supabase.from('modules').select('id,title,stage,description').eq('published', true).order('stage'),
      ])
      if (!active) return
      if (error) { setLessonError('Não foi possível carregar as aulas. Atualize a página ou tente novamente.'); setLessons([]) }
      else setLessons((data ?? []) as Lesson[])
      setCourseModules((moduleData ?? []) as CourseModule[])
      const { data: progress } = await supabase.from('user_progress').select('lesson_id,completed').eq('user_id', user.id).eq('completed', true)
      if (active) { setCompleted((progress ?? []).map(item => item.lesson_id)); setLessonsLoading(false) }
    }
    void loadCourse()
    return () => { active = false }
  }, [user])

  async function finishLesson(lesson: Lesson, score?: number) {
    if (!user) { setLogin(true); return }
    setSavingProgress(true)
    const { error } = await supabase.from('user_progress').upsert({ user_id: user.id, lesson_id: lesson.id, completed: true, score: score ?? null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
    setSavingProgress(false)
    if (error) { setLessonError('Não foi possível salvar sua conclusão. Tente novamente.'); return }
    setCompleted(current => current.includes(lesson.id) ? current : [...current, lesson.id])
    setSelectedLesson(null)
  }

  const grouped = useMemo(() => courseModules.map(module => ({ ...module, lessons: lessons.filter(lesson => lesson.module_id === module.id) })).filter(module => module.lessons.length), [courseModules, lessons])
  const totalDone = completed.length
  const progressPercent = lessons.length ? Math.round(totalDone / lessons.length * 100) : 0
  const firstPending = lessons.find(lesson => !completed.includes(lesson.id)) ?? lessons[0] ?? null

  const content = () => {
    if (page === 'Jogos educativos') return <GamesArcade />
    if (page === 'Meu curso') return selectedLesson ? <LessonExperience lesson={selectedLesson} completed={completed.includes(selectedLesson.id)} saving={savingProgress} onBack={() => setSelectedLesson(null)} onFinish={score => void finishLesson(selectedLesson, score)} /> : <div className="course-catalog">
      <section className="catalog-hero"><div className="catalog-hero-copy"><span className="eyebrow-light">SUA JORNADA COMEÇA AQUI</span><h2>Português com clareza.<br/><em>Conhecimento para a vida.</em></h2><p>Uma trilha completa, do essencial à preparação para provas. Aprenda no seu ritmo, pratique e acompanhe cada conquista.</p><div className="catalog-hero-pills"><span>12 módulos</span><span>Aulas guiadas</span><span>Prática interativa</span></div></div><div className="catalog-illustration" aria-hidden="true"><div className="catalog-orbit orbit-a"></div><div className="catalog-book"><span>EP</span><b>Português</b><small>APRENDER • PRATICAR • AVANÇAR</small></div><i className="float-letter letter-a">A</i><i className="float-letter letter-b">?</i><i className="float-letter letter-c">á</i></div></section>
      <div className="catalog-summary"><div><span className="summary-icon">▤</span><div><small>CONTEÚDO PROGRAMÁTICO</small><b>{lessons.length} aulas disponíveis</b></div></div><div><span className="summary-icon">✓</span><div><small>SEU DESEMPENHO</small><b>{totalDone} aulas concluídas</b></div></div><div className="summary-progress"><div><small>PROGRESSO GERAL</small><b>{progressPercent}%</b></div><div className="catalog-progress-track"><span style={{width: progressPercent + '%'}}/></div></div></div>
      <div className="catalog-section-title"><div><span className="eyebrow">TRILHA DE APRENDIZAGEM</span><h2>Explore os módulos</h2><p>Avance etapa por etapa. Cada módulo reúne explicações, exemplos e atividades para fixar o conteúdo.</p></div><span className="catalog-count">12 ETAPAS</span></div>
      {lessonsLoading && <div className="catalog-empty">Preparando sua trilha de aprendizagem…</div>}
      {lessonError && <div className="catalog-empty catalog-error">{lessonError}</div>}
      {!lessonsLoading && grouped.length === 0 && <div className="catalog-empty">Nenhuma aula publicada foi encontrada.</div>}
      <div className="module-grid">{grouped.map((module,index) => { const done = module.lessons.filter(lesson => completed.includes(lesson.id)).length; const pct = Math.round(done / module.lessons.length * 100); return <article className="module-card" key={module.id}><div className={'module-art '+moduleColors[index % moduleColors.length]}><span>{moduleArt[index % moduleArt.length]}</span><small>MÓDULO {String(module.stage).padStart(2,'0')}</small></div><div className="module-card-body"><div className="module-card-meta"><span>{index < 3 ? 'FUNDAMENTOS' : index < 8 ? 'GRAMÁTICA' : 'APLICAÇÃO'}</span><span>{module.lessons.length} aulas</span></div><h3>{module.title}</h3><p>{module.description}</p><div className="module-progress-label"><span>{done} de {module.lessons.length} concluídas</span><b>{pct}%</b></div><div className="module-progress-track"><span style={{width:pct+'%'}}/></div><div className="module-card-footer"><span className={pct === 100 ? 'module-status finished' : 'module-status'}>{pct === 100 ? '✓ Concluído' : '• Em andamento'}</span><button onClick={() => setSelectedLesson(module.lessons.find(lesson => !completed.includes(lesson.id)) ?? module.lessons[0])}>{pct === 100 ? 'Revisar módulo' : done ? 'Continuar' : 'Começar'} <b>→</b></button></div></div></article> })}</div>
      <section className="catalog-bottom-note"><span>✦</span><div><b>Aprender é uma construção diária.</b><p>Estude uma aula por vez, pratique com os exercícios e volte aos conteúdos sempre que precisar.</p></div></section>
    </div>
    if (page === 'Testes e avaliações') return <AssessmentCenter onOpenLesson={lessonId => { const lesson = lessons.find(item => item.id === lessonId); if (lesson) setSelectedLesson(lesson); setPage('Meu curso') }} />
    if (page === 'Reforço') return <ReinforcementCenter onOpenLesson={lessonId => { const lesson = lessons.find(item => item.id === lessonId); if (lesson) setSelectedLesson(lesson); setPage('Meu curso') }} />
    if (page === 'Meu perfil') return <ProfileCenter onSignOut={async () => { await supabase.auth.signOut(); setPage('Início') }} />
    return <DashboardCenter onNavigate={nextPage => setPage(nextPage)} />
  }

  if (authLoading) return <main className="auth-gate-shell"><div className="auth-gate-loading"><span className="auth-gate-mark">E</span><b>EPDP</b><p>Preparando seu ambiente de aprendizagem…</p></div></main>

  if (!user) return <div className="public-site">
    <header className="public-header"><a className="public-brand" href="#inicio"><span>E</span><div><b>EPDP</b><small>ESTUDO PROFUNDO DE PORTUGUÊS</small></div></a><nav><a href="#metodo">Nossa proposta</a><a href="#trilha">O curso</a><a href="#recursos">Recursos</a></nav><div className="public-actions"><button className="public-login" onClick={() => {setSignup(false);setLogin(true)}}>Entrar</button><button className="public-cta" onClick={() => {setSignup(true);setLogin(true)}}>Começar agora <span>→</span></button></div></header>
    <main>
      <section className="public-hero" id="inicio"><div className="public-hero-copy"><span className="public-kicker"><i/> APRENDIZAGEM QUE FAZ SENTIDO</span><h1>Domine o português.<br/><em>Abra novos caminhos.</em></h1><p>Aprenda com aulas visuais, atividades interativas e uma jornada organizada para você evoluir com confiança — do básico à preparação para provas.</p><div className="public-hero-actions"><button onClick={() => {setSignup(true);setLogin(true)}}>Quero começar a estudar <span>→</span></button><a href="#metodo">Conheça a plataforma</a></div><div className="public-proof"><div className="proof-avatars"><span>A</span><span>É</span><span>Ç</span></div><div><b>Aprenda no seu ritmo</b><small>Conteúdo organizado para acompanhar sua evolução.</small></div></div></div><div className="public-hero-visual"><div className="hero-image-frame"><img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1100&q=85" alt="Livros e caderno em uma mesa de estudos"/><div className="image-shade"></div><div className="visual-caption"><span>EPDP • PORTUGUÊS</span><b>Conhecimento que transforma.</b></div></div><div className="floating-note note-top"><span>✦</span><div><b>Aprenda fazendo</b><small>Prática em cada etapa</small></div></div><div className="floating-note note-bottom"><span>✓</span><div><b>Seu progresso</b><small>Acompanhe suas conquistas</small></div></div><div className="visual-decoration"></div></div></section>
      <div className="public-trustbar"><span>UMA PLATAFORMA PARA APRENDER DE VERDADE</span><b>Aulas guiadas</b><i></i><b>Exercícios comentados</b><i></i><b>Jogos educativos</b><i></i><b>Progresso individual</b></div>
      <section className="public-method section-wrap" id="metodo"><div className="section-heading"><span className="eyebrow">UM JEITO MAIS COMPLETO DE ESTUDAR</span><h2>Não é só assistir ou ler.<br/><em>É aprender na prática.</em></h2><p>O EPDP reúne diferentes formas de aprendizagem para tornar o estudo mais claro, dinâmico e consistente.</p></div><div className="feature-grid" id="recursos"><article className="feature-card feature-large"><div className="feature-visual lesson-visual"><div className="mini-window"><span>✦ AULA EM DESTAQUE</span><b>Conhecendo a língua portuguesa</b><div className="mini-lines"><i/><i/><i/></div><div className="mini-image">Aa</div></div></div><small>01 · CONTEÚDO DIDÁTICO</small><h3>Aulas que explicam de verdade</h3><p>Conteúdo dividido em pequenas etapas, com exemplos do cotidiano, recursos visuais e resumos para revisar.</p></article><article className="feature-card"><div className="feature-visual quiz-visual"><div className="quiz-sheet"><span>QUIZ RÁPIDO</span><b>Qual é a alternativa correta?</b><i>○ Linguagem verbal</i><i className="selected">✓ Linguagem não verbal</i><i>○ Linguagem mista</i></div></div><small>02 · PRÁTICA INTERATIVA</small><h3>Exercícios com explicação</h3><p>Responda, confira o resultado e entenda por que cada alternativa está certa ou errada.</p></article><article className="feature-card"><div className="feature-visual game-visual"><div className="game-tiles"><i>Á</i><i>B</i><i>C</i><i>Ç</i><i>D</i><i>E</i></div></div><small>03 · APRENDER BRINCANDO</small><h3>Jogos que reforçam o conteúdo</h3><p>Desafios de palavras, memória, ortografia e raciocínio para praticar de um jeito leve.</p></article><article className="feature-card"><div className="feature-visual progress-visual"><div className="progress-ring"><b>72<small>%</small></b></div><div className="progress-bars"><i/><i/><i/></div></div><small>04 · EVOLUÇÃO INDIVIDUAL</small><h3>Seu progresso em um só lugar</h3><p>Acompanhe aulas concluídas, resultados e assuntos que merecem uma nova revisão.</p></article></div></section>
      <section className="public-course-band" id="trilha"><div><span className="eyebrow-light">DO BÁSICO À PRÁTICA</span><h2>Uma trilha completa<br/>para construir conhecimento.</h2><p>Fundamentos, interpretação, gramática, escrita e resolução de questões organizados em uma sequência de aprendizagem.</p><button onClick={() => {setSignup(true);setLogin(true)}}>Acessar a plataforma <span>→</span></button></div><div className="public-course-list">{['Fundamentos da língua','Interpretação de textos','Semântica e significação','Organização textual','Fonética e fonologia','Ortografia e acentuação','Classes gramaticais','Morfologia e formação','Sintaxe','Pontuação e crase','Figuras de linguagem','Reescrita e concursos'].map((item,index)=><div key={item}><span>{String(index+1).padStart(2,'0')}</span><b>{item}</b><i>↗</i></div>)}</div></section>
      <section className="public-final-cta"><div><span className="eyebrow">SEU PRÓXIMO PASSO COMEÇA AQUI</span><h2>Aprenda com método.<br/><em>Evolua com confiança.</em></h2><p>Crie sua conta e comece sua jornada de aprendizagem no EPDP.</p></div><button onClick={() => {setSignup(true);setLogin(true)}}>Criar minha conta <span>→</span></button></section>
    </main><footer className="public-footer"><a className="public-brand" href="#inicio"><span>E</span><div><b>EPDP</b><small>ESTUDO PROFUNDO DE PORTUGUÊS</small></div></a><p>Educação, prática e evolução em cada etapa.</p><small>© 2026 EPDP. Todos os direitos reservados.</small></footer>
    {login && <AuthModal onClose={() => setLogin(false)} initialMode={signup ? 'signup' : 'login'} />}
  </div>

  if (page === 'Jogos educativos') return <div className="game-mode"><GamesArcade /></div>
  return <div className="layout"><aside className={menu ? 'sidebar open' : 'sidebar'}><div className="brand"><b>E</b><div><strong>EPDP</strong><small>Estudo Profundo de Português</small></div></div><small className="muted">ÁREA DO ESTUDANTE</small><nav>{pages.map((p,i)=><button className={page===p?'active':''} key={p} onClick={()=>{setPage(p);setSelectedLesson(null);setMenu(false)}}><span>{['⌂','▤','✓','◇','↗','○'][i]}</span>{p}</button>)}</nav><div className="bottom"><b>Continue evoluindo</b><p>Um passo de cada vez faz diferença.</p><button className="link" onClick={()=>setPage('Meu curso')}>Ver minha trilha →</button></div></aside><main><header><button className="hamb" onClick={()=>setMenu(!menu)}>☰</button><div>EPDP <span>/</span> <b>{page}</b></div><button className="outline" onClick={()=>void supabase.auth.signOut()}>Sair da conta</button></header><div className="content"><div className="heading"><div><small>ÁREA DO ESTUDANTE</small><h1>{selectedLesson?selectedLesson.title:page}</h1></div><small>Estudo profundo de português</small></div>{content()}<footer>© 2026 EPDP — Estudo Profundo de Português.</footer></div></main></div>
}
