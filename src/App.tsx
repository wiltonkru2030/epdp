import { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import AuthModal from './components/AuthModal'

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
const games = [
  ['Caça-palavras', 'Encontre palavras e amplie seu vocabulário.', 'Vocabulário'],
  ['Acentuação em foco', 'Treine a escrita correta das palavras.', 'Ortografia'],
  ['Monte a frase', 'Organize palavras e construa frases.', 'Gramática'],
]

export default function App() {
  const [page, setPage] = useState<Page>('Início')
  const { user } = useAuth()
  const [choice, setChoice] = useState('')
  const [checked, setChecked] = useState(false)
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
    if (page === 'Jogos educativos') return <><div className="intro"><small>APRENDER BRINCANDO</small><h2>Jogos educativos</h2><p>Pratique português com atividades leves e desafiadoras.</p></div><div className="games">{games.map(([name, desc, tag]) => <article className="card game" key={name}><span className="symbol">✳</span><small className="tag">{tag}</small><h3>{name}</h3><p>{desc}</p><button className="soft" onClick={() => setPage('Meu curso')}>Começar atividade</button></article>)}</div></>
    if (page === 'Meu curso') return <>
      {selectedLesson ? <section className="card panel lesson-reader">
        <button className="link" onClick={() => setSelectedLesson(null)}>← Voltar para as aulas</button>
        <small>{selectedLesson.level.toUpperCase()} · AULA {selectedLesson.position}</small>
        <h2>{selectedLesson.title}</h2>
        <p>{selectedLesson.description}</p>
        <div className="lesson-content">{selectedLesson.content}</div>
        <button disabled={savingProgress || completed.includes(selectedLesson.id)} onClick={() => void finishLesson(selectedLesson)}>
          {savingProgress ? 'Salvando...' : completed.includes(selectedLesson.id) ? 'Aula concluída' : 'Marcar aula como concluída'}
        </button>
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
    if (page === 'Avaliações' || page === 'Reforço' || page === 'Meu perfil') return <section className="card panel"><small>{page === 'Meu perfil' ? 'SUA CONTA' : 'SUA APRENDIZAGEM'}</small><h2>{page}</h2><p>{page === 'Avaliações' ? 'As avaliações vão identificar seus conhecimentos e acompanhar sua evolução.' : page === 'Reforço' ? 'As atividades de reforço serão organizadas de acordo com suas necessidades.' : 'Gerencie seu acesso e acompanhe sua jornada de aprendizagem.'}</p>{page === 'Meu perfil' && user ? <div className="profile-details"><b>{user.user_metadata.full_name || 'Estudante EPDP'}</b><span>{user.email}</span><small>Conta autenticada</small><button onClick={async () => { await supabase.auth.signOut(); setPage('Início') }}>Sair da conta</button></div> : <div className="empty"><b>{page === 'Meu perfil' ? 'Acesse ou crie sua conta' : 'Área em preparação'}</b><span>{page === 'Meu perfil' ? 'Entre ou faça seu cadastro para começar a salvar seu progresso.' : 'Esta etapa será implementada na sequência do desenvolvimento.'}</span></div>}{page === 'Meu perfil' && !user && <button onClick={() => setLogin(true)}>Entrar ou criar conta</button>}</section>
    return <><section className="hero"><div><small>BEM-VINDO AO EPDP</small><h2>Aprender português abre novos caminhos.</h2><p>Estude no seu ritmo, pratique com atividades e acompanhe sua evolução.</p><button className="white" onClick={() => setPage('Meu curso')}>Explorar o curso →</button></div><div className="book">ABC<br/><span>✎</span></div></section><div className="stats"><article className="card"><small>Progresso do curso</small><strong>{lessons.length ? Math.round(completed.length / lessons.length * 100) : 0}%</strong><div className="bar"><span style={{ width: lessons.length ? (completed.length / lessons.length * 100) + '%' : '0%' }} /></div></article><article className="card"><small>Atividades concluídas</small><strong>{completed.length}</strong><p>Continue sua trilha de aprendizagem</p></article><article className="card"><small>Aulas disponíveis</small><strong>{lessons.length}</strong><p>Conteúdo de português</p></article></div><div className="columns"><section className="card panel"><small>PARA COMEÇAR</small><h2>Teste rápido de português</h2><p>Qual alternativa apresenta uma palavra escrita corretamente?</p><div className="choices">{['Excessão', 'Exceção', 'Esceção'].map(v => <button className={choice === v ? 'selected' : ''} key={v} onClick={() => { setChoice(v); setChecked(false) }}>{v}</button>)}</div>{choice && <button onClick={() => setChecked(true)}>Conferir resposta</button>}{checked && <p className={choice === 'Exceção' ? 'good' : 'bad'}>{choice === 'Exceção' ? 'Correto! “Exceção” é a grafia adequada.' : 'A forma correta é “Exceção”.'}</p>}<small>Questão demonstrativa. Seu resultado não será salvo.</small></section><section className="card panel tip"><small>DICA DE ESTUDO</small><h2>Um pouco por dia faz diferença.</h2><p>Reserve alguns minutos para ler, escrever e revisar. A constância ajuda a transformar conhecimento em confiança.</p><button className="link" onClick={() => setPage('Jogos educativos')}>Conhecer os jogos →</button></section></div></>
  }

  return <div className="layout"><aside className={menu ? 'sidebar open' : 'sidebar'}><div className="brand"><b>E</b><div><strong>EPDP</strong><small>Estudo Profundo de Português</small></div></div><small className="muted">MENU PRINCIPAL</small><nav>{pages.map((p, i) => <button className={page === p ? 'active' : ''} key={p} onClick={() => { setPage(p); setSelectedLesson(null); setMenu(false) }}><span>{['⌂', '▤', '✓', '◇', '↗', '○'][i]}</span>{p}</button>)}</nav><div className="bottom"><b>Continue evoluindo</b><p>Seu aprendizado começa com um passo.</p><button className="link" onClick={() => setPage('Meu curso')}>Ver trilha →</button></div></aside><main><header><button className="hamb" onClick={() => setMenu(!menu)}>☰</button><div>Painel <span>/</span> <b>{page}</b></div><button className="outline" onClick={() => user ? void supabase.auth.signOut() : setLogin(true)}>{user ? 'Sair' : 'Entrar'}</button></header><div className="content"><div className="heading"><div><small>SUA JORNADA DE APRENDIZADO</small><h1>{selectedLesson ? selectedLesson.title : page}</h1></div><small>Plataforma de estudos</small></div>{content()}<footer>© 2026 EPDP — Estudo Profundo de Português.</footer></div></main>{login && <AuthModal onClose={() => setLogin(false)} />}</div>
}
