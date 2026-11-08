import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Assessment = { id: string; title: string; description: string; assessment_type: string; time_limit_seconds: number | null }
type Question = { id: string; subject: string; prompt: string; context_text: string; difficulty: number; position: number }
type Option = { id: string; question_id: string; option_label: string; option_text: string; position: number }
type Feedback = { question_id: string; subject: string; prompt: string; selected_option: string; correct_option: string; is_correct: boolean; explanation: string; correct_explanation: string; review_lesson_id: string | null }
type Result = { attempt_id: string; total_questions: number; correct_answers: number; percentage: number; score: number; duration_seconds: number | null; feedback: Feedback[] }

export default function AssessmentCenter() {
  const [items, setItems] = useState<Assessment[]>([])
  const [selected, setSelected] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [startedAt, setStartedAt] = useState<number>(0)

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase.from('assessments')
        .select('id,title,description,assessment_type,time_limit_seconds')
        .eq('published', true).order('created_at', { ascending: false })
      if (!active) return
      if (error) setError('Não foi possível carregar as avaliações. Tente novamente mais tarde.')
      else setItems((data ?? []) as Assessment[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  async function openAssessment(item: Assessment) {
    setError(''); setResult(null); setAnswers({}); setSelected(item); setLoading(true)
    const { data: qs, error: qError } = await supabase.from('questions')
      .select('id,subject,prompt,context_text,difficulty,position')
      .eq('assessment_id', item.id).eq('published', true).order('position')
    if (qError || !qs?.length) {
      setError('Esta avaliação ainda não possui questões publicadas.')
      setQuestions([]); setOptions([]); setLoading(false); return
    }
    const ids = qs.map(q => q.id)
    const { data: opts, error: oError } = await supabase.from('question_options')
      .select('id,question_id,option_label,option_text,position')
      .in('question_id', ids).order('position')
    if (oError) setError('Não foi possível carregar as alternativas.')
    setQuestions(qs as Question[]); setOptions((opts ?? []) as Option[])
    setStartedAt(Date.now()); setLoading(false)
  }

  async function submit() {
    if (!selected || sending || Object.keys(answers).length !== questions.length) return
    setSending(true); setError('')
    const duration = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    const payload = questions.map(q => ({ question_id: q.id, option_id: answers[q.id] }))
    const { data, error: submitError } = await supabase.rpc('submit_assessment', {
      p_assessment_id: selected.id, p_answers: payload, p_duration_seconds: duration,
    })
    if (submitError) setError('Não foi possível finalizar a avaliação. Confira suas respostas e tente novamente.')
    else setResult(data as Result)
    setSending(false)
  }

  const level = useMemo(() => {
    if (!result) return ''
    if (result.percentage < 50) return 'Precisa reforçar'
    if (result.percentage < 70) return 'Em desenvolvimento'
    if (result.percentage < 85) return 'Bom domínio'
    if (result.percentage < 95) return 'Domínio avançado'
    return 'Excelente desempenho'
  }, [result])

  if (loading) return <section className="card panel">Carregando avaliações...</section>
  if (selected && !result) return <section className="card assessment-panel">
    <button className="soft" onClick={() => { setSelected(null); setError('') }}>Voltar às avaliações</button>
    <div className="intro"><small>AVALIAÇÃO</small><h2>{selected.title}</h2><p>{selected.description}</p></div>
    <div className="assessment-progress"><span style={{ width: questions.length ? Object.keys(answers).length / questions.length * 100 + '%' : '0%' }} /></div>
    <p className="assessment-count">{Object.keys(answers).length} de {questions.length} questões respondidas</p>
    {questions.map((q, index) => <article className="assessment-question" key={q.id}>
      <small>QUESTÃO {index + 1} · {q.subject} · NÍVEL {q.difficulty}</small>
      {q.context_text && <blockquote>{q.context_text}</blockquote>}
      <h3>{q.prompt}</h3>
      <div className="assessment-options">{options.filter(o => o.question_id === q.id).map(o =>
        <button key={o.id} className={answers[q.id] === o.id ? 'chosen' : ''} onClick={() => setAnswers(current => ({ ...current, [q.id]: o.id }))}>
          <b>{o.option_label}</b><span>{o.option_text}</span>
        </button>)}</div>
    </article>)}
    {error && <p className="auth-error">{error}</p>}
    <button className="game-primary" disabled={sending || questions.length === 0 || Object.keys(answers).length !== questions.length} onClick={() => void submit()}>
      {sending ? 'Corrigindo avaliação...' : 'Finalizar e corrigir'}
    </button>
  </section>

  if (result) return <section className="card assessment-panel">
    <button className="soft" onClick={() => { setSelected(null); setResult(null); setAnswers({}) }}>Voltar às avaliações</button>
    <div className="assessment-result"><small>RESULTADO DA AVALIAÇÃO</small><strong>{result.percentage.toFixed(0)}%</strong><h2>{level}</h2><p>Nota {result.score.toFixed(2)} de 10 · {result.correct_answers} acertos em {result.total_questions} questões</p><p>Tempo utilizado: {Math.floor((result.duration_seconds ?? 0) / 60)} min {(result.duration_seconds ?? 0) % 60} s</p></div>
    <h2>Correção comentada</h2>
    {result.feedback.map((f, i) => <article className="assessment-review" key={f.question_id}>
      <small>QUESTÃO {i + 1} · {f.subject}</small><h3>{f.prompt}</h3>
      <p className={f.is_correct ? 'good' : 'bad'}>{f.is_correct ? 'Você acertou.' : 'Você errou. Sua resposta: ' + f.selected_option}</p>
      {!f.is_correct && <p><b>Resposta correta:</b> {f.correct_option}</p>}
      <p>{f.explanation}</p>{f.correct_explanation && <p>{f.correct_explanation}</p>}
    </article>)}
  </section>

  return <section className="assessment-list">
    <div className="intro"><small>ACOMPANHAMENTO DO APRENDIZADO</small><h2>Avaliações</h2><p>Responda às avaliações publicadas e receba uma correção explicada, calculada pelo banco de dados.</p></div>
    {error && <p className="auth-error">{error}</p>}
    {items.length === 0 ? <div className="card panel empty"><b>Nenhuma avaliação publicada no momento</b><span>Quando houver avaliações preparadas e publicadas, elas aparecerão aqui.</span></div> :
      items.map(item => <article className="card assessment-card" key={item.id}><div><small>{item.assessment_type.replace('_', ' ').toUpperCase()}</small><h3>{item.title}</h3><p>{item.description}</p></div><button className="soft" onClick={() => void openAssessment(item)}>Iniciar avaliação</button></article>)}
  </section>
}
