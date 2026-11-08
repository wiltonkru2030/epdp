import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import TopicVisual from './TopicVisual'

type Assessment = { id: string; title: string; description: string; assessment_type: string; time_limit_seconds: number | null }
type Question = { id: string; subject: string; prompt: string; context_text: string; difficulty: number; position: number }
type Option = { id: string; question_id: string; option_label: string; option_text: string; position: number }
type Feedback = { question_id: string; subject: string; prompt: string; selected_option: string; correct_option: string; is_correct: boolean; explanation: string; correct_explanation: string; review_lesson_id: string | null }
type Result = { attempt_id: string; total_questions: number; correct_answers: number; percentage: number; score: number; duration_seconds: number | null; feedback: Feedback[] }
type Attempt = { id: string; assessment_id: string | null; score: number; total_questions: number; duration_seconds: number | null; created_at: string }
type Filter = 'all' | 'assessment' | 'mock_exam'
type Props = { onOpenLesson?: (lessonId: string) => void }

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export default function AssessmentCenter({ onOpenLesson }: Props) {
  const { user } = useAuth()
  const [items, setItems] = useState<Assessment[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [startedAt, setStartedAt] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [expired, setExpired] = useState(false)

  async function refreshAttempts() {
    if (!user) return
    const { data } = await supabase.from('assessment_attempts')
      .select('id,assessment_id,score,total_questions,duration_seconds,created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(8)
    setAttempts((data ?? []) as Attempt[])
  }

  useEffect(() => {
    let active = true
    async function load() {
      if (!user) { setLoading(false); return }
      const [{ data, error: listError }, { data: history }] = await Promise.all([
        supabase.from('assessments')
          .select('id,title,description,assessment_type,time_limit_seconds')
          .eq('published', true).order('created_at', { ascending: false }),
        supabase.from('assessment_attempts')
          .select('id,assessment_id,score,total_questions,duration_seconds,created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
      ])
      if (!active) return
      if (listError) setError('Não foi possível carregar as avaliações. Tente novamente mais tarde.')
      else setItems((data ?? []) as Assessment[])
      setAttempts((history ?? []) as Attempt[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (!selected || !selected.time_limit_seconds || !startedAt || result || expired) return
    const tick = () => {
      const remaining = Math.max(0, selected.time_limit_seconds! - Math.floor((Date.now() - startedAt) / 1000))
      setRemainingSeconds(remaining)
      if (remaining === 0) setExpired(true)
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [selected, startedAt, result, expired])

  async function openAssessment(item: Assessment) {
    setError(''); setResult(null); setAnswers({}); setActiveIndex(0); setExpired(false)
    setRemainingSeconds(item.time_limit_seconds); setStartedAt(0); setSelected(item); setLoading(true)
    const { data: qs, error: qError } = await supabase.from('questions')
      .select('id,subject,prompt,context_text,difficulty,position')
      .eq('assessment_id', item.id).eq('published', true).order('position')
    if (qError || !qs?.length) {
      setError('Esta avaliação ainda não possui questões publicadas.')
      setQuestions([]); setOptions([]); setLoading(false); return
    }
    const ids = qs.map(q => q.id)
    const { data: opts, error: oError } = await supabase.from('assessment_options')
      .select('id,question_id,option_label,option_text,position')
      .in('question_id', ids).order('position')
    if (oError) setError('Não foi possível carregar as alternativas com segurança.')
    setQuestions(qs as Question[]); setOptions((opts ?? []) as Option[])
    setStartedAt(Date.now()); setLoading(false)
  }

  async function submit(fromTimeout = false) {
    if (!selected || sending || !questions.length) return
    const answered = Object.keys(answers).length
    if (!fromTimeout && answered < questions.length) {
      const unanswered = questions.length - answered
      if (!window.confirm(`Você ainda tem ${unanswered} questão(ões) sem resposta. Deseja finalizar assim mesmo?`)) return
    }
    setSending(true); setError('')
    const duration = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    const payload = questions.map(q => ({ question_id: q.id, option_id: answers[q.id] ?? null }))
    const { data, error: submitError } = await supabase.rpc('submit_assessment', {
      p_assessment_id: selected.id, p_answers: payload, p_duration_seconds: duration,
    })
    if (submitError) setError('Não foi possível finalizar a avaliação. Tente novamente.')
    else {
      setResult(data as Result)
      await refreshAttempts()
    }
    setSending(false)
  }

  useEffect(() => {
    if (expired && selected && !result && !sending && questions.length) void submit(true)
  }, [expired, selected, result, sending, questions.length])

  const visibleItems = useMemo(() => items.filter(item => {
    if (filter === 'mock_exam') return item.assessment_type === 'mock_exam'
    if (filter === 'assessment') return item.assessment_type !== 'mock_exam'
    return true
  }), [items, filter])

  const level = useMemo(() => {
    if (!result) return ''
    if (result.percentage < 50) return 'Precisa reforçar'
    if (result.percentage < 70) return 'Em desenvolvimento'
    if (result.percentage < 85) return 'Bom domínio'
    if (result.percentage < 95) return 'Domínio avançado'
    return 'Excelente desempenho'
  }, [result])

  const activeQuestion = questions[activeIndex]
  const answeredCount = Object.keys(answers).length
  const attemptCount = attempts.length

  if (loading) return <section className="card panel assessment-loading">Preparando seu ambiente de avaliação...</section>

  if (selected && !result) {
    if (!activeQuestion) return <section className="card panel">Carregando questões...</section>
    const questionOptions = options.filter(option => option.question_id === activeQuestion.id)
    return <section className="assessment-panel">
      <div className="assessment-topbar">
        <button className="soft" onClick={() => { setSelected(null); setError(''); setExpired(false) }}>← Sair da avaliação</button>
        <div className="assessment-timer-wrap">
          <span>{selected.assessment_type === 'mock_exam' ? 'SIMULADO' : 'AVALIAÇÃO'}</span>
          {remainingSeconds !== null && <strong className={remainingSeconds <= 60 ? 'timer-warning' : ''}>{formatTime(remainingSeconds)}</strong>}
        </div>
      </div>
      <div className="assessment-heading">
        <div><small>{selected.assessment_type === 'mock_exam' ? 'SIMULADO' : 'CENTRO DE AVALIAÇÕES'}</small><h2>{selected.title}</h2><p>{selected.description}</p></div>
        <div className="assessment-completion"><strong>{Math.round(answeredCount / questions.length * 100)}%</strong><span>concluído</span></div>
      </div>
      <div className="assessment-progress"><span style={{ width: answeredCount / questions.length * 100 + '%' }} /></div>
      <div className="assessment-workspace">
        <aside className="assessment-question-nav">
          <b>Questões</b><span>{answeredCount} de {questions.length} respondidas</span>
          <div>{questions.map((question, index) => <button key={question.id} className={`${activeIndex === index ? 'current ' : ''}${answers[question.id] ? 'answered' : ''}`} onClick={() => setActiveIndex(index)}>{index + 1}</button>)}</div>
        </aside>
        <article className="assessment-question assessment-current-question">
          <small>QUESTÃO {activeIndex + 1} DE {questions.length} · {activeQuestion.subject} · NÍVEL {activeQuestion.difficulty}/5</small>
          {activeQuestion.context_text && <blockquote>{activeQuestion.context_text}</blockquote>}
          <TopicVisual topic={activeQuestion.subject} compact />
          <h3>{activeQuestion.prompt}</h3>
          <div className="assessment-options">{questionOptions.map(option =>
            <button key={option.id} className={answers[activeQuestion.id] === option.id ? 'chosen' : ''} onClick={() => setAnswers(current => ({ ...current, [activeQuestion.id]: option.id }))}>
              <b>{option.option_label}</b><span>{option.option_text}</span>
            </button>)}</div>
          <div className="assessment-question-actions">
            <button className="soft" disabled={activeIndex === 0} onClick={() => setActiveIndex(index => Math.max(0, index - 1))}>Questão anterior</button>
            {activeIndex < questions.length - 1
              ? <button className="game-primary" onClick={() => setActiveIndex(index => Math.min(questions.length - 1, index + 1))}>Próxima questão →</button>
              : <button className="game-primary" disabled={sending || (!answeredCount && !expired)} onClick={() => void submit()}>{sending ? 'Corrigindo...' : 'Finalizar avaliação'}</button>}
          </div>
        </article>
      </div>
      {expired && <p className="auth-error" role="alert">O tempo terminou. Suas respostas estão sendo enviadas para correção.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {activeIndex < questions.length - 1 && <div className="assessment-submit-row"><button className="game-primary" disabled={sending || (!answeredCount && !expired)} onClick={() => void submit()}>{sending ? 'Corrigindo...' : 'Finalizar agora'}</button></div>}
    </section>
  }

  if (result) return <section className="assessment-panel">
    <div className="assessment-result">
      <small>RESULTADO DA AVALIAÇÃO</small><strong>{result.percentage.toFixed(0)}%</strong><h2>{level}</h2>
      <p>Nota {result.score.toFixed(2)} de 10 · {result.correct_answers} acertos em {result.total_questions} questões</p>
      <p>Tempo utilizado: {Math.floor((result.duration_seconds ?? 0) / 60)} min {(result.duration_seconds ?? 0) % 60} s</p>
    </div>
    <div className="assessment-result-actions"><button className="soft" onClick={() => { setSelected(null); setResult(null); setAnswers({}); setExpired(false) }}>Voltar às avaliações</button><button className="game-primary" onClick={() => { setSelected(null); setResult(null); setAnswers({}); setExpired(false) }}>Escolher outra atividade</button></div>
    <h2 className="assessment-review-title">Correção comentada</h2>
    {result.feedback.map((feedback, index) => <article className="assessment-review" key={feedback.question_id}>
      <small>QUESTÃO {index + 1} · {feedback.subject}</small><h3>{feedback.prompt}</h3>
      <p className={feedback.is_correct ? 'good' : 'bad'}>{feedback.is_correct ? 'Resposta correta.' : feedback.selected_option === 'Não respondida' ? 'Você não respondeu esta questão.' : 'Sua resposta: ' + feedback.selected_option}</p>
      {!feedback.is_correct && <p><b>Resposta correta:</b> {feedback.correct_option}</p>}
      <p>{feedback.explanation}</p>{feedback.correct_explanation && <p>{feedback.correct_explanation}</p>}{feedback.review_lesson_id && onOpenLesson && <button className="soft" onClick={() => onOpenLesson(feedback.review_lesson_id!)}>Revisar aula relacionada</button>}
    </article>)}
  </section>

  return <section className="assessment-list">
    <div className="intro"><small>APRENDIZAGEM E DIAGNÓSTICO</small><h2>Testes e avaliações</h2><p>Faça uma atividade por vez, acompanhe o tempo quando houver limite e receba correção comentada com recomendações de reforço.</p></div>
    <div className="assessment-overview">
      <article><small>ATIVIDADES DISPONÍVEIS</small><strong>{items.length}</strong></article>
      <article><small>SUAS TENTATIVAS RECENTES</small><strong>{attemptCount}</strong></article>
      <article><small>ÚLTIMO RESULTADO</small><strong>{attempts[0] ? `${Math.round(Number(attempts[0].score) * 10) / 10}/10` : '—'}</strong></article>
    </div>
    <div className="assessment-filters">
      <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Todas</button>
      <button className={filter === 'assessment' ? 'active' : ''} onClick={() => setFilter('assessment')}>Avaliações</button>
      <button className={filter === 'mock_exam' ? 'active' : ''} onClick={() => setFilter('mock_exam')}>Simulados</button>
    </div>
    {error && <p className="auth-error">{error}</p>}
    {visibleItems.length === 0 ? <div className="card panel empty"><b>Nenhuma atividade encontrada</b><span>Quando houver avaliações e simulados publicados, eles aparecerão aqui.</span></div> :
      visibleItems.map(item => <article className="card assessment-card" key={item.id}>
        <div><small>{item.assessment_type === 'mock_exam' ? 'SIMULADO' : item.assessment_type.replace('_', ' ').toUpperCase()}</small><h3>{item.title}</h3><p>{item.description}</p><span className="assessment-card-meta">{item.time_limit_seconds ? `Tempo limite: ${Math.ceil(item.time_limit_seconds / 60)} minutos` : 'Sem limite de tempo'} · Correção comentada</span></div>
        <button className="soft" onClick={() => void openAssessment(item)}>Iniciar atividade</button>
      </article>)}
    {attempts.length > 0 && <section className="assessment-history"><h3>Seu histórico recente</h3>{attempts.slice(0, 5).map(attempt => {
      const title = items.find(item => item.id === attempt.assessment_id)?.title ?? 'Atividade'
      return <article key={attempt.id}><div><b>{title}</b><small>{new Date(attempt.created_at).toLocaleString('pt-BR')}</small></div><strong>{Number(attempt.score).toFixed(1)}/10</strong></article>
    })}</section>}
  </section>
}
