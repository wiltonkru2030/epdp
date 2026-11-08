import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './LessonExperience.css'

type Lesson = { id: string; title: string; description: string; content: string; level: string; position: number; learning_objective?: string; estimated_minutes?: number }
type Question = { prompt: string; options: string[]; answer: number; explanation: string }
type Props = { lesson: Lesson; completed: boolean; saving: boolean; onFinish: (score?: number) => void; onBack: () => void }

function questionsFor(title: string): Question[] {
  const t = title.toLowerCase()
  if (t.includes('fundamento')) return [
    { prompt: 'Em “A estudante dedicada chegou cedo”, qual palavra é um adjetivo?', options: ['estudante', 'dedicada', 'chegou', 'cedo'], answer: 1, explanation: '“Dedicada” caracteriza o substantivo “estudante”; portanto, é um adjetivo.' },
    { prompt: 'Em “chave”, as letras CH representam:', options: ['Dois fonemas', 'Um fonema', 'Três fonemas', 'Nenhum fonema'], answer: 1, explanation: 'CH é um dígrafo: duas letras representam um único fonema.' },
    { prompt: 'A palavra “lâmpada” é:', options: ['Oxítona', 'Paroxítona', 'Proparoxítona', 'Monossílaba'], answer: 2, explanation: 'A sílaba tônica é “lâm”, a antepenúltima. Toda proparoxítona é acentuada.' },
  ]
  if (t.includes('ortografia') || t.includes('acentua')) return [
    { prompt: 'Qual alternativa apresenta a grafia correta?', options: ['excessão', 'exceção', 'escessão', 'ecessão'], answer: 1, explanation: 'A grafia correta é “exceção”, com XC e Ç.' },
    { prompt: 'Qual palavra é proparoxítona?', options: ['café', 'fácil', 'médico', 'também'], answer: 2, explanation: '“Médico” tem a antepenúltima sílaba tônica. Todas as proparoxítonas recebem acento.' },
    { prompt: 'Na frase “Ontem ele não pôde vir”, “pôde” indica:', options: ['Presente', 'Futuro', 'Passado', 'Ordem'], answer: 2, explanation: '“Pôde” (com circunflexo) é a forma do passado; “pode” indica presente.' },
  ]
  if (t.includes('pontua')) return [
    { prompt: 'Qual frase usa corretamente a vírgula para separar o vocativo?', options: ['Pedro venha estudar.', 'Pedro, venha estudar.', 'Pedro venha, estudar.', 'Pedro venha estudar,'], answer: 1, explanation: 'O vocativo “Pedro” deve ser isolado por vírgula.' },
    { prompt: 'Em “Os estudantes revisaram a matéria”, o sujeito é:', options: ['revisaram', 'a matéria', 'Os estudantes', 'a matéria revisaram'], answer: 2, explanation: '“Os estudantes” é o termo sobre o qual se declara algo.' },
    { prompt: 'Qual conectivo expressa oposição?', options: ['portanto', 'porque', 'mas', 'logo'], answer: 2, explanation: '“Mas” é uma conjunção adversativa e indica oposição.' },
  ]
  if (t.includes('interpreta')) return [
    { prompt: 'Uma informação explícita é aquela que:', options: ['Está diretamente apresentada no texto', 'Depende de adivinhação', 'Contradiz o texto', 'É sempre uma opinião'], answer: 0, explanation: 'A informação explícita aparece diretamente no texto.' },
    { prompt: 'Inferir significa:', options: ['Copiar uma frase', 'Concluir a partir de pistas do texto', 'Ignorar o contexto', 'Inventar uma informação'], answer: 1, explanation: 'A inferência é uma conclusão plausível sustentada por pistas textuais.' },
    { prompt: 'Em “Marina comprou um livro. Ela começou a leitura”, “ela” retoma:', options: ['leitura', 'livro', 'Marina', 'começou'], answer: 2, explanation: 'O pronome “ela” retoma o nome Marina, estabelecendo coesão referencial.' },
  ]
  return [
    { prompt: 'Qual é a melhor estratégia para estudar este conteúdo?', options: ['Ler os exemplos e praticar', 'Memorizar sem compreender', 'Pular as explicações', 'Responder sem ler'], answer: 0, explanation: 'Compreender os conceitos, observar exemplos e praticar ajuda a consolidar a aprendizagem.' },
    { prompt: 'Ao analisar uma frase, devemos observar:', options: ['Somente o tamanho', 'O contexto e a função das palavras', 'Apenas a primeira palavra', 'Somente a pontuação'], answer: 1, explanation: 'O contexto é essencial para compreender o sentido e a função dos elementos da língua.' },
    { prompt: 'Depois de errar uma questão, o melhor é:', options: ['Ignorar o erro', 'Rever a explicação e tentar novamente', 'Apagar a atividade', 'Desistir do assunto'], answer: 1, explanation: 'O erro orienta a revisão: leia a explicação, identifique a dificuldade e pratique novamente.' },
  ]
}

function Illustration({ title }: { title: string }) {
  const t = title.toLowerCase()
  const label = t.includes('interpreta') ? 'LEITURA' : t.includes('ortografia') || t.includes('acentua') ? 'ESCRITA' : t.includes('pontua') ? 'FRASES' : 'LINGUAGEM'
  const words = t.includes('interpreta') ? ['TEXTO', 'PISTAS', 'SENTIDO'] : t.includes('ortografia') ? ['LETRA', 'SÍLABA', 'ACENTO'] : t.includes('pontua') ? ['FRASE', 'PAUSA', 'IDEIA'] : ['LETRAS', 'SONS', 'PALAVRAS']
  return <div className="lesson-illustration" role="img" aria-label={'Ilustração educativa sobre ' + title}>
    <div className="lesson-illustration-orbit orbit-one" /><div className="lesson-illustration-orbit orbit-two" />
    <div className="lesson-illustration-book"><span>{label}</span><strong>Aa</strong><small>EPDP · APRENDER</small></div>
    <div className="lesson-illustration-word word-one">{words[0]}</div><div className="lesson-illustration-word word-two">{words[1]}</div><div className="lesson-illustration-word word-three">{words[2]}</div>
    <span className="lesson-illustration-spark spark-one">✦</span><span className="lesson-illustration-spark spark-two">✧</span>
  </div>
}

function contentSections(content: string) {
  const normalized = content.replace(/\r/g, '').replace(/\\n/g, '\n').trim()
  const blocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean)
  return blocks.map((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
    const first = lines[0] || ''
    if (first.startsWith('## ')) {
      const heading = first.replace(/^##\s+/, '')
      if (/gabarito/i.test(heading)) return null
      const practice = /pratique|exerc/i.test(heading)
      return <section className={practice ? 'lesson-content-section lesson-content-practice' : 'lesson-content-section'} key={index}>
        <span className="lesson-section-number">{String(index + 1).padStart(2, '0')}</span>
        <div><h3>{heading}</h3>{lines.slice(1).map((line, i) => <p key={i}>{line.replace(/^\d+\.\s*/, '')}</p>)}</div>
      </section>
    }
    if (lines.every(line => /^\d+\.\s/.test(line))) return <ol className="lesson-content-list" key={index}>{lines.map((line, i) => <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>)}</ol>
    if (/^Na primeira atividade:|^“Café” é|^“A estudante” é|^O tema é/i.test(first)) return null
    return <div className="lesson-content-note" key={index}>{lines.map((line, i) => <p key={i}>{line}</p>)}</div>
  })
}

export default function LessonExperience({ lesson, completed, saving, onFinish, onBack }: Props) {
  const { user } = useAuth()
  const [favorite, setFavorite] = useState(false)
  const [notes, setNotes] = useState('')
  const [toolsLoading, setToolsLoading] = useState(false)
  const [toolsSaving, setToolsSaving] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [reading, setReading] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const questions = useMemo(() => questionsFor(lesson.title), [lesson.title])
  const score = questions.filter((question, index) => answers[index] === question.answer).length

  useEffect(() => {
    let active = true
    async function loadTools() {
      setToolsLoading(true); setFavorite(false); setNotes('')
      if (user) {
        const { data } = await supabase.from('lesson_study_tools').select('is_favorite,notes').eq('user_id', user.id).eq('lesson_id', lesson.id).maybeSingle()
        if (active && data) { setFavorite(Boolean(data.is_favorite)); setNotes(data.notes || '') }
      }
      if (active) setToolsLoading(false)
    }
    void loadTools()
    return () => { active = false }
  }, [user, lesson.id])

  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [lesson.id])

  async function saveTools(nextFavorite = favorite, nextNotes = notes) {
    if (!user) return
    setToolsSaving(true)
    const { error } = await supabase.from('lesson_study_tools').upsert({
      user_id: user.id, lesson_id: lesson.id, is_favorite: nextFavorite, notes: nextNotes, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    setToolsSaving(false)
    if (error) window.alert('Não foi possível salvar. Tente novamente.')
  }

  function toggleReading() {
    if (!('speechSynthesis' in window)) { window.alert('A leitura em voz alta não está disponível neste navegador.'); return }
    if (reading) { window.speechSynthesis.cancel(); setReading(false); return }
    const text = lesson.title + '. ' + lesson.description + '. ' + lesson.content.replace(/##/g, '').replace(/\n/g, ' ')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'; utterance.rate = 0.92
    utterance.onend = () => setReading(false); utterance.onerror = () => setReading(false)
    setReading(true); window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance)
  }

  return <section className="lesson-experience">
    <button className="lesson-back-button" onClick={onBack}>← Voltar para o curso</button>
    <header className="lesson-hero"><div className="lesson-hero-copy">
      <span className="lesson-eyebrow">ETAPA DE APRENDIZAGEM · {lesson.level.toUpperCase()}</span><h2>{lesson.title}</h2><p>{lesson.description}</p>
      <div className="lesson-hero-meta"><span>◷ {lesson.estimated_minutes || 15} minutos</span><span>✦ Aula {String(lesson.position).padStart(2, '0')}</span></div>
    </div><Illustration title={lesson.title} /></header>

    <div className="lesson-actionbar">
      <button onClick={toggleReading} className={reading ? 'is-active' : ''}>{reading ? 'Ⅱ Parar áudio' : '▶ Ouvir aula'}</button>
      <div className="lesson-font-controls"><span>Tamanho do texto</span><button aria-label="Diminuir fonte" onClick={() => setFontScale(value => Math.max(.9, +(value - .1).toFixed(1)))}>A−</button><button aria-label="Aumentar fonte" onClick={() => setFontScale(value => Math.min(1.3, +(value + .1).toFixed(1)))}>A+</button></div>
      <button className={favorite ? 'is-favorite' : ''} disabled={toolsLoading || !user} onClick={() => { const next = !favorite; setFavorite(next); void saveTools(next, notes) }}>{favorite ? '★ Favoritada' : '☆ Favoritar'}</button>
    </div>

    <div className="lesson-experience-grid">
      <article className="lesson-content-card" style={{ '--lesson-font-scale': fontScale } as CSSProperties}>
        <div className="lesson-objective"><span>◎</span><div><b>Objetivo desta aula</b><p>{lesson.learning_objective || 'Compreender o conteúdo, observar exemplos e praticar.'}</p></div></div>
        <div className="lesson-explanation"><div className="lesson-explanation-heading"><span>CONTEÚDO DA AULA</span><h3>Vamos aprender juntos</h3></div>{contentSections(lesson.content)}</div>
        <div className="lesson-notes"><label htmlFor="lesson-notes">Minhas anotações</label><textarea id="lesson-notes" value={notes} maxLength={12000} onChange={event => setNotes(event.target.value)} placeholder="Registre exemplos, dúvidas e pontos importantes..." />
          <div><small>{notes.length}/12000 caracteres · {user ? 'Suas anotações são privadas.' : 'Entre para salvar suas anotações.'}</small><button disabled={!user || toolsSaving || toolsLoading} onClick={() => void saveTools()}>{toolsSaving ? 'Salvando...' : 'Salvar anotações'}</button></div>
        </div>
      </article>
      <aside className="lesson-side-column">
        <div className="lesson-side-card"><span className="lesson-side-icon">✓</span><b>Estude no seu ritmo</b><p>Leia cada parte, observe os exemplos e volte aos tópicos sempre que precisar.</p></div>
        <div className="lesson-side-card lesson-side-tip"><span className="lesson-side-icon">✦</span><b>Dica de aprendizagem</b><p>Explique o conceito com suas próprias palavras. Se conseguir, você está construindo conhecimento.</p></div>
        <div className="lesson-side-card lesson-side-progress"><b>Seu estudo</b><span>{completed ? 'Aula concluída' : 'Aula em andamento'}</span><div className="lesson-side-progress-track"><i style={{ width: completed ? '100%' : submitted ? '85%' : '45%' }} /></div><small>{completed ? 'Conclusão registrada na sua conta.' : 'Faça o teste e conclua para salvar seu avanço.'}</small></div>
      </aside>
    </div>

    <section className="lesson-quiz"><div className="lesson-quiz-heading"><span>DESAFIO DE APRENDIZAGEM</span><h3>Teste seus conhecimentos</h3><p>Responda às questões e receba uma explicação para cada alternativa correta.</p></div>
      {questions.map((question, index) => <article className="lesson-quiz-question" key={index}><span>QUESTÃO {index + 1} DE {questions.length}</span><h4>{question.prompt}</h4>
        <div className="lesson-quiz-options">{question.options.map((option, optionIndex) => {
          const correct = submitted && optionIndex === question.answer
          const wrong = submitted && answers[index] === optionIndex && !correct
          return <button key={option} disabled={submitted} className={(answers[index] === optionIndex ? 'selected ' : '') + (correct ? 'correct ' : '') + (wrong ? 'wrong' : '')} onClick={() => setAnswers(current => ({ ...current, [index]: optionIndex }))}><b>{String.fromCharCode(65 + optionIndex)}</b>{option}</button>
        })}</div>
        {submitted && <div className="lesson-quiz-explanation"><b>{answers[index] === question.answer ? 'Muito bem! Resposta correta.' : 'Vamos revisar este ponto.'}</b><p>{question.explanation}</p></div>}
      </article>)}
      {!submitted ? <button className="lesson-quiz-submit" disabled={Object.keys(answers).length !== questions.length} onClick={() => setSubmitted(true)}>Corrigir minhas respostas</button> :
        <div className="lesson-quiz-result"><strong>{score}/{questions.length}</strong><div><b>{score === questions.length ? 'Excelente! Você dominou esta etapa.' : score >= 2 ? 'Bom trabalho! Revise os pontos que errou.' : 'Continue praticando. Você consegue!'}</b><p>Seu aproveitamento foi de {Math.round(score / questions.length * 100)}%.</p></div><button onClick={() => { setAnswers({}); setSubmitted(false) }}>Tentar novamente</button></div>}
    </section>

    <div className="lesson-finish-row"><div><b>{completed ? 'Você já concluiu esta aula!' : 'Terminou de estudar?'}</b><p>Marque a aula como concluída para atualizar seu progresso.</p></div><button disabled={saving || completed} onClick={() => onFinish(submitted ? Math.round(score / questions.length * 100) : undefined)}>{saving ? 'Salvando...' : completed ? '✓ Aula concluída' : 'Concluir aula →'}</button></div>
  </section>
}
