import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Question = {
  prompt: string
  options: string[]
  answer: string
  explanation: string
}
const questions: Question[] = [
  { prompt: 'Qual palavra está acentuada corretamente?', options: ['ideia', 'heróico', 'saúde'], answer: 'saúde', explanation: '“Saúde” recebe acento porque há hiato: a vogal u é tônica e fica sozinha na sílaba.' },
  { prompt: 'Assinale a grafia correta.', options: ['lâmpada', 'lampada', 'lâmpâda'], answer: 'lâmpada', explanation: '“Lâmpada” é proparoxítona. Todas as palavras proparoxítonas são acentuadas.' },
  { prompt: 'Qual forma está correta segundo a ortografia atual?', options: ['vôo', 'voo', 'vôô'], answer: 'voo', explanation: '“Voo” perdeu o acento circunflexo com o Acordo Ortográfico.' },
  { prompt: 'Qual palavra é oxítona e recebe acento?', options: ['café', 'mesa', 'árvore'], answer: 'café', explanation: '“Café” é oxítona terminada em e. Oxítonas terminadas em a(s), e(s), o(s), em e ens recebem acento.' },
  { prompt: 'Qual alternativa apresenta uma paroxítona acentuada corretamente?', options: ['fácil', 'cajù', 'juri'], answer: 'fácil', explanation: '“Fácil” é paroxítona terminada em l, terminação que exige acento.' },
]

export default function AccentGame() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [finished, setFinished] = useState(false)
  const [startedAt, setStartedAt] = useState(Date.now())
  const [saveStatus, setSaveStatus] = useState('')
  const question = questions[index]

  useEffect(() => {
    if (!finished) return
    let active = true
    async function saveResult() {
      const { data } = await supabase.auth.getUser()
      if (!active) return
      if (!data.user) {
        setSaveStatus('Entre na sua conta para salvar seu recorde e consultar seu histórico.')
        return
      }
      const duration = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
      const { error } = await supabase.rpc('record_game_attempt', {
        p_game_slug: 'acentuacao',
        p_correct_count: score,
        p_total_count: questions.length,
        p_duration_seconds: duration,
      })
      if (active) setSaveStatus(error ? 'Não foi possível salvar esta rodada. Você ainda pode jogar novamente.' : 'Resultado salvo no seu histórico.')
    }
    void saveResult()
    return () => { active = false }
  }, [finished, score, startedAt])

  function checkAnswer() {
    if (!selected || answered) return
    if (selected === question.answer) setScore(value => value + 1)
    setAnswered(true)
  }
  function next() {
    if (index === questions.length - 1) setFinished(true)
    else {
      setIndex(value => value + 1)
      setSelected('')
      setAnswered(false)
    }
  }
  function restart() {
    setIndex(0); setSelected(''); setScore(0); setAnswered(false); setFinished(false); setStartedAt(Date.now()); setSaveStatus('')
  }

  return <section className="accent-game card">
    <div className="game-topline"><span>DESAFIO DE ORTOGRAFIA</span><b>{finished ? 'RESULTADO' : `QUESTÃO ${index + 1} DE ${questions.length}`}</b></div>
    {finished ? <div className="game-result">
      <div className="game-score">{score}<small>/{questions.length}</small></div>
      <h3>{score === questions.length ? 'Excelente domínio!' : score >= 3 ? 'Bom trabalho. Continue praticando.' : 'Vamos reforçar esse conteúdo.'}</h3>
      <p>Você acertou {score} de {questions.length} questões nesta rodada.</p>
      {saveStatus && <p className="game-save-status" role="status">{saveStatus}</p>}
      <button className="soft" onClick={restart}>Jogar novamente</button>
    </div> : <>
      <div className="game-progress"><span style={{width: `${((index + 1) / questions.length) * 100}%`}} /></div>
      <h3>{question.prompt}</h3>
      <div className="game-options">{question.options.map(option => <button key={option} disabled={answered} className={selected === option ? 'chosen' : ''} onClick={() => setSelected(option)}>{option}</button>)}</div>
      {answered && <div className={selected === question.answer ? 'game-feedback correct' : 'game-feedback incorrect'} role="status">
        <b>{selected === question.answer ? 'Resposta correta' : `A resposta correta é “${question.answer}”.`}</b>
        <p>{question.explanation}</p>
      </div>}
      {!answered ? <button className="game-primary" disabled={!selected} onClick={checkAnswer}>Conferir resposta</button> : <button className="game-primary" onClick={next}>{index === questions.length - 1 ? 'Ver resultado' : 'Próxima questão'}</button>}
    </>}
    <small className="game-disclaimer">Pontuação desta rodada. O histórico individual será conectado ao banco na etapa de avaliações e jogos.</small>
  </section>
}
