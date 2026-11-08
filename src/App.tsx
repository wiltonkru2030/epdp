import { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import AuthModal from './components/AuthModal'
import GamesArcade from './components/GamesArcade'
import AssessmentCenter from './components/AssessmentCenter'
import ReinforcementCenter from './components/ReinforcementCenter'

type Page = 'Início' | 'Meu curso' | 'Avaliações' | 'Jogos educativos' | 'Reforço' | 'Meu perfil'
type Lesson = {
  id: string
  title: string
  description: string
  content: string
  level: string
  position: number
}
const pages: Page[] = ['Início', 'Meu curso', 'Avaliações', 'Jogos educativos', 'Reforço', 'Meu perfil']

function LessonBody({ content }: { content: string }) {
  const normalized = content.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '')
  const blocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean)
  return <div className="lesson-sections">
    {blocks.map((block, index) => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
      const first = lines[0] ?? ''
      if (first.startsWith('## ')) {
        const heading = first.replace(/^##\s+/, '')
        const rest = lines.slice(1)
        const isPractice = /pratique|exerc/i.test(heading)
        return <section className={isPractice ? 'lesson-section practice-section' : 'lesson-section'} key={index}>
          <div className="section-icon">{isPractice ? '✎' : ['Aa', '◈', '✦', '▤'][index % 4]}</div>
          <div className="section-copy"><h3>{heading}</h3>
            {rest.map((line, i) => <p key={i}>{line.replace(/^\d+\.\s*/, '')}</p>)}
          </div>
        </section>
      }
      if (lines.every(line => /^\d+\.\s/.test(line))) {
        return <ol className="lesson-steps" key={index}>{lines.map((line, i) => <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>)}</ol>
      }
      return <section className="lesson-note" key={index}>{lines.map((line, i) => <p key={i}>{line}</p>)}</section>
    })}
  </div>
}

export default function App() {
  const [page, setPage] = useState<Page>('Início')
  const { user } = useAuth()
  const [menu, setMenu] = useState(false)
  const [login, setLogin] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [lessonError, setLessonError] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [savingProgress, setSavingProgress] = useState(false)

  useEffect(() => {
    let active = true
    async function loadCourse() {
      setLessonsLoading(true)
      setLessonError('')
      const { data, error } = await supabase
        .from('lessons')
        .select('id,title,description,content,level,position')
        .eq('published', true)
        .order('position')
      if (!active) return
      if (error) {
        setLessonError('Não foi possível carregar as aulas. Entre na sua conta e tente novamente.')
        setLessons([])
      } else {
        setLessons((data ?? []) as Lesson[])
      }
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

  async function finishLesson(lesson: Lesson) {
    if (!user) {
      setLogin(true)
      return
    }
    setSavingProgress(true)
    const { error } = await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      completed: true,
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
      {selectedLesson ? <section className="lesson-page">
        <button className="back-course" onClick={() => setSelectedLesson(null)}>← Voltar para o curso</button>
        <div className="lesson-cover">
          <div className="cover-copy"><span className="lesson-kicker">PORTUGUÊS · {selectedLesson.level.toUpperCase()}</span><h2>{selectedLesson.title}</h2><p>{selectedLesson.description}</p><span className="cover-meta">AULA {String(selectedLesson.position).padStart(2, '0')} · LEITURA E PRÁTICA</span></div>
          <div className="cover-art" aria-hidden="true"><div className="art-circle">Aa</div><span className="art-star star-one">✦</span><span className="art-star star-two">✳</span><span className="art-pencil">✎</span></div>
        </div>
        <div className="lesson-layout">
          <article className="lesson-main"><div className="lesson-welcome"><span>✦</span><div><b>Vamos aprender?</b><small>Leia com calma e avance no seu ritmo.</small></div></div><LessonBody content={selectedLesson.content}/></article>
          <aside className="lesson-aside"><div className="aside-card"><span className="aside-icon">◷</span><b>Seu momento de estudar</b><p>Não tenha pressa. O importante é compreender cada parte.</p></div><div className="aside-card aside-highlight"><span className="aside-icon">★</span><b>Aprender é praticar</b><p>Ao terminar, marque a aula como concluída para acompanhar sua evolução.</p></div><button className="complete-lesson" disabled={savingProgress || completed.includes(selectedLesson.id)} onClick={() => void finishLesson(selectedLesson)}>{savingProgress ? 'Salvando...' : completed.includes(selectedLesson.id) ? '✓ Aula concluída' : 'Concluir esta aula →'}</button></aside>
        </div>
      </section> : <>
        <div className="intro"><small>TRILHA DE APRENDIZAGEM</small><h2>Português do básico ao avançado</h2><p>Estude cada conteúdo no seu ritmo. Sua conclusão ficará salva na sua conta.</p></div>
        <div className="course-progress"><b>{completed.length} de {lessons.length} aulas concluídas</b><div className="bar"><span style={{ width: lessons.length ? (completed.length / lessons.length * 100) + '%' : '0%' }} /></div></div>
        {lessonsLoading && <div className="card panel">Carregando aulas...</div>}
        {lessonError && <div className="card panel auth-error">{lessonError}</div>}
        {!lessonsLoading && lessons.length === 0 && <div className="card panel">Nenhuma aula publicada foi encontrada.</div>}
        {lessons.map(lesson => <article className="card lesson" key={lesson.id}>
          <b>{String(lesson.position).padStart(2, '0')}</b>
          <div><h3>{lesson.title}</h3><p>{lesson.description}</p></div>
          <small className={completed.includes(lesson.id) ? 'lesson-done' : ''}>{completed.includes(lesson.id) ? 'Concluída' : 'Disponível'}</small>
          <button className="soft" onClick={() => setSelectedLesson(lesson)}>Estudar</button>
        </article>)}
        {!user && <p className="course-login-note">Você pode ler as aulas. Entre na sua conta para salvar seu progresso.</p>}
      </>}
    </>
    if (page === 'Avaliações') return user ? <AssessmentCenter /> : <section className="card panel"><h2>Entre para realizar avaliações</h2><p>Suas tentativas e resultados ficam vinculados à sua conta.</p><button onClick={() => setLogin(true)}>Entrar ou criar conta</button></section>
    if (page === 'Reforço') return user ? <ReinforcementCenter /> : <section className="card panel"><h2>Entre para acessar seu reforço</h2><p>As recomendações são individuais e dependem do seu histórico de aprendizagem.</p><button onClick={() => setLogin(true)}>Entrar ou criar conta</button></section>
    if (page === 'Meu perfil') return <section className="card panel"><small>SUA CONTA</small><h2>Meu perfil</h2>{user ? <div className="profile-details"><b>{user.user_metadata.full_name || 'Estudante EPDP'}</b><span>{user.email}</span><small>Conta autenticada</small><button onClick={async () => { await supabase.auth.signOut(); setPage('Início') }}>Sair da conta</button></div> : <div className="empty"><b>Acesse ou crie sua conta</b><span>Entre para salvar seu progresso e acompanhar sua jornada.</span></div>}{!user && <button onClick={() => setLogin(true)}>Entrar ou criar conta</button>}</section>
    return <><section className="hero"><div><small>BEM-VINDO AO EPDP</small><h2>Aprender português abre novos caminhos.</h2><p>Estude no seu ritmo, pratique com atividades e acompanhe sua evolução.</p><button className="white" onClick={() => setPage('Meu curso')}>Explorar o curso →</button></div><div className="book">ABC<br/><span>✎</span></div></section><div className="stats"><article className="card"><small>Progresso do curso</small><strong>{lessons.length ? Math.round(completed.length / lessons.length * 100) : 0}%</strong><div className="bar"><span style={{ width: lessons.length ? (completed.length / lessons.length * 100) + '%' : '0%' }} /></div></article><article className="card"><small>Atividades concluídas</small><strong>{completed.length}</strong><p>Continue sua trilha de aprendizagem</p></article><article className="card"><small>Aulas disponíveis</small><strong>{lessons.length}</strong><p>Conteúdo de português</p></article></div><div className="columns"><section className="card panel"><small>AVALIAÇÕES</small><h2>Descubra o que você já domina.</h2><p>Faça avaliações publicadas, receba correção comentada e acompanhe seu desempenho real.</p><button className="soft" onClick={() => setPage('Avaliações')}>Acessar avaliações</button></section><section className="card panel tip"><small>DICA DE ESTUDO</small><h2>Um pouco por dia faz diferença.</h2><p>Reserve alguns minutos para ler, escrever e revisar. A constância ajuda a transformar conhecimento em confiança.</p><button className="link" onClick={() => setPage('Jogos educativos')}>Conhecer os jogos →</button></section></div></>
  }

  if (page === "Jogos educativos") return <div className="game-mode"><GamesArcade /></div>

  return <div className="layout"><aside className={menu ? 'sidebar open' : 'sidebar'}><div className="brand"><b>E</b><div><strong>EPDP</strong><small>Estudo Profundo de Português</small></div></div><small className="muted">MENU PRINCIPAL</small><nav>{pages.map((p, i) => <button className={page === p ? 'active' : ''} key={p} onClick={() => { setPage(p); setSelectedLesson(null); setMenu(false) }}><span>{['⌂', '▤', '✓', '◇', '↗', '○'][i]}</span>{p}</button>)}</nav><div className="bottom"><b>Continue evoluindo</b><p>Seu aprendizado começa com um passo.</p><button className="link" onClick={() => setPage('Meu curso')}>Ver trilha →</button></div></aside><main><header><button className="hamb" onClick={() => setMenu(!menu)}>☰</button><div>Painel <span>/</span> <b>{page}</b></div><button className="outline" onClick={() => user ? void supabase.auth.signOut() : setLogin(true)}>{user ? 'Sair' : 'Entrar'}</button></header><div className="content"><div className="heading"><div><small>SUA JORNADA DE APRENDIZADO</small><h1>{selectedLesson ? selectedLesson.title : page}</h1></div><small>Plataforma de estudos</small></div>{content()}<footer>© 2026 EPDP — Estudo Profundo de Português.</footer></div></main>{login && <AuthModal onClose={() => setLogin(false)} />}</div>
}
