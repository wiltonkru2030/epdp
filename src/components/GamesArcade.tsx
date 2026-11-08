import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'hangman' | 'complete' | 'sentence' | 'accent'
type Challenge = { prompt: string; answer: string; options?: string[]; hint: string; explanation: string; category: string }

const pools: Record<Exclude<Mode, 'hangman'>, Challenge[]> = {
  complete: [
    { prompt: 'Complete a palavra: exce__ão', answer: 'ç', options: ['s', 'ç', 'ss'], hint: 'A palavra indica uma situação que foge à regra.', explanation: 'A grafia correta é exceção, com ç.', category: 'Ortografia' },
    { prompt: 'Complete a palavra: privilé__io', answer: 'g', options: ['j', 'g', 'gu'], hint: 'É um benefício ou vantagem especial.', explanation: 'Privilégio é escrito com g.', category: 'Ortografia' },
    { prompt: 'Complete a palavra: empeci__ho', answer: 'l', options: ['l', 'u', 'lh'], hint: 'Significa obstáculo ou dificuldade.', explanation: 'Empecilho é escrito com lh.', category: 'Ortografia' },
    { prompt: 'Complete a palavra: consciên__ia', answer: 'c', options: ['s', 'sc', 'c'], hint: 'É a capacidade de perceber a própria existência e os próprios atos.', explanation: 'Consciência é escrita com sc e termina em cia.', category: 'Ortografia' },
    { prompt: 'Complete a palavra: benefi__ente', answer: 'c', options: ['ss', 's', 'c'], hint: 'Refere-se a quem faz o bem ou ajuda.', explanation: 'Beneficente é escrito com c.', category: 'Ortografia' },
  ],
  sentence: [
    { prompt: 'Organize as palavras para formar uma frase correta.', answer: 'A leitura amplia o conhecimento.', options: ['conhecimento.', 'A', 'amplia', 'leitura', 'o'], hint: 'Comece pelo artigo que acompanha “leitura”.', explanation: 'A ordem forma uma oração com sujeito “A leitura” e predicado “amplia o conhecimento”.', category: 'Organização textual' },
    { prompt: 'Organize as palavras para formar uma frase correta.', answer: 'Os alunos estudaram para a prova.', options: ['prova.', 'estudaram', 'Os', 'a', 'para', 'alunos'], hint: 'O sujeito aparece antes do verbo.', explanation: '“Os alunos” é o sujeito; “estudaram para a prova” é o predicado.', category: 'Sintaxe' },
    { prompt: 'Organize as palavras para formar uma frase correta.', answer: 'A professora explicou a matéria.', options: ['matéria.', 'explicou', 'A', 'professora', 'a'], hint: 'A frase começa com quem realizou a ação.', explanation: 'A professora é o sujeito; explicou é o verbo; a matéria completa o sentido.', category: 'Sintaxe' },
  ],
  accent: [
    { prompt: 'Qual palavra está escrita corretamente?', answer: 'saúde', options: ['saude', 'saúde', 'saùde'], hint: 'Observe o hiato formado pelas vogais.', explanation: 'Saúde recebe acento porque o u tônico forma hiato e fica sozinho na sílaba.', category: 'Acentuação' },
    { prompt: 'Qual é a forma correta segundo a ortografia atual?', answer: 'ideia', options: ['idéia', 'ideia', 'idéía'], hint: 'O acordo ortográfico retirou o acento dos ditongos abertos ei e oi em palavras paroxítonas.', explanation: 'Ideia é paroxítona e não recebe mais acento no ditongo ei.', category: 'Acentuação' },
    { prompt: 'Assinale a palavra proparoxítona corretamente acentuada.', answer: 'lâmpada', options: ['lampada', 'lâmpada', 'lâmpâda'], hint: 'Toda proparoxítona recebe acento.', explanation: 'Lâmpada tem a antepenúltima sílaba tônica; por isso recebe acento.', category: 'Acentuação' },
    { prompt: 'Qual palavra é oxítona e está acentuada corretamente?', answer: 'café', options: ['cafe', 'café', 'càfé'], hint: 'Oxítonas terminadas em a, e, o, em e ens podem receber acento.', explanation: 'Café é oxítona terminada em e, por isso recebe acento agudo.', category: 'Acentuação' },
    { prompt: 'Qual alternativa está correta?', answer: 'voo', options: ['vôo', 'voo', 'vóo'], hint: 'O acordo ortográfico eliminou o circunflexo de alguns hiatos oo.', explanation: 'A forma atual é voo, sem acento circunflexo.', category: 'Acentuação' },
  ],
}

const words = [
  { word: 'COERÊNCIA', hint: 'Qualidade de um texto cujas ideias fazem sentido entre si.', category: 'Texto' },
  { word: 'SUBSTANTIVO', hint: 'Classe de palavras que nomeia seres, objetos, lugares e sentimentos.', category: 'Gramática' },
  { word: 'PRONOME', hint: 'Classe que pode acompanhar ou substituir um nome.', category: 'Gramática' },
  { word: 'METÁFORA', hint: 'Figura de linguagem que estabelece uma comparação implícita.', category: 'Linguagem' },
  { word: 'OXÍTONA', hint: 'Palavra cuja última sílaba é a tônica.', category: 'Acentuação' },
]

const modes: { id: Mode; name: string; subtitle: string; icon: string; color: string; tag: string }[] = [
  { id: 'hangman', name: 'Forca de palavras', subtitle: 'Descubra o termo usando as pistas.', icon: 'A _', color: 'violet', tag: 'VOCABULÁRIO' },
  { id: 'complete', name: 'Complete a palavra', subtitle: 'Escolha a letra que completa a escrita.', icon: 'Aa', color: 'blue', tag: 'ORTOGRAFIA' },
  { id: 'sentence', name: 'Monte a frase', subtitle: 'Coloque as palavras na ordem correta.', icon: '≡', color: 'green', tag: 'SINTAXE' },
  { id: 'accent', name: 'Desafio de acentuação', subtitle: 'Escolha a grafia correta e entenda a regra.', icon: 'Á', color: 'amber', tag: 'ACENTUAÇÃO' },
]

function shuffle<T,>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

export default function GamesArcade() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [choice, setChoice] = useState('')
  const [checked, setChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [seconds, setSeconds] = useState(90)
  const [guessed, setGuessed] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [saveMessage, setSaveMessage] = useState('')
  const [sentenceOrder, setSentenceOrder] = useState<string[]>([])
  const [wordIndex, setWordIndex] = useState(0)

  const challenge = mode && mode !== 'hangman' ? pools[mode][round % pools[mode].length] : null
  const hangmanWord = words[wordIndex % words.length]
  const letters = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÂÊÔÃÕÇ'.split(''), [])
  const revealed = hangmanWord.word.split('').map(letter => letter === ' ' || guessed.includes(letter) ? letter : '')
  const hangmanWon = hangmanWord.word.split('').every(letter => guessed.includes(letter) || letter === ' ')
  const hangmanLost = mistakes >= 6

  useEffect(() => {
    if (!mode || finished || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [mode, finished, seconds])

  useEffect(() => {
    if (seconds === 0 && mode && !finished) {
      setFinished(true)
      if (mode === 'hangman') void saveGame('forca-palavras', hangmanWon ? 1 : 0, 1)
      else void saveGame(mode === 'accent' ? 'acentuacao' : mode === 'complete' ? 'complete-word' : 'build-sentence', score, 5)
    }
  }, [seconds, mode, finished])

  useEffect(() => {
    if (mode === 'sentence' && challenge) setSentenceOrder(shuffle(challenge.options ?? []))
  }, [mode, round])

  async function saveGame(slug: string, correct: number, total: number) {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setSaveMessage('Entre na sua conta para guardar este resultado no histórico.')
      return
    }
    const { error } = await supabase.rpc('record_game_attempt', {
      p_game_slug: slug,
      p_correct_count: correct,
      p_total_count: total,
      p_duration_seconds: 90 - seconds,
    })
    setSaveMessage(error ? 'Não foi possível salvar a rodada. Tente novamente mais tarde.' : 'Resultado salvo no seu histórico.')
  }

  function start(next: Mode) {
    setMode(next); setRound(0); setScore(0); setChoice(''); setChecked(false); setFinished(false)
    setSeconds(90); setGuessed([]); setMistakes(0); setSaveMessage(''); setWordIndex(Math.floor(Math.random() * words.length))
    if (next === 'sentence') setSentenceOrder(shuffle(pools.sentence[0].options ?? []))
  }

  function answer() {
    if (!challenge || !choice || checked) return
    const correct = mode === 'sentence' ? sentenceOrder.join(' ') === challenge.answer : choice === challenge.answer
    setChecked(true)
    if (correct) setScore(value => value + 1)
  }

  function next() {
    if (round === 4) {
      setFinished(true)
      void saveGame(mode === 'accent' ? 'acentuacao' : mode === 'complete' ? 'complete-word' : 'build-sentence', score + (mode === 'sentence' ? (sentenceOrder.join(' ') === challenge?.answer ? 1 : 0) : choice === challenge?.answer ? 1 : 0), 5)
      return
    }
    setRound(value => value + 1); setChoice(''); setChecked(false)
  }

  function guess(letter: string) {
    if (guessed.includes(letter) || hangmanWon || hangmanLost) return
    setGuessed(value => [...value, letter])
    if (!hangmanWord.word.includes(letter)) setMistakes(value => value + 1)
  }

  function finishHangman() {
    setFinished(true)
    void saveGame('forca-palavras', hangmanWon ? 1 : 0, 1)
  }

  function resetHome() {
    setMode(null); setFinished(false); setSaveMessage('')
  }

  return <section className="arcade">
    {!mode ? <>
      <div className="arcade-banner">
        <div><span className="arcade-eyebrow">CENTRAL DE JOGOS EPDP</span><h2>Aprenda jogando.<br/><em>Conquiste conhecimento.</em></h2><p>Desafios rápidos de português, com explicações e evolução registrada na sua conta.</p><div className="arcade-banner-meta"><span>04 modalidades jogáveis</span><i /> <span>Partidas de até 90 segundos</span></div></div>
        <div className="arcade-orbit" aria-hidden="true"><div className="orbit-book">Aa</div><span className="orbit-letter">Ç</span><span className="orbit-dot" /></div>
      </div>
      <div className="arcade-section-head"><div><small>ESCOLHA SEU DESAFIO</small><h3>Qual jogo vamos jogar?</h3></div><span>04 JOGOS</span></div>
      <div className="arcade-grid">{modes.map((item, index) => <button className="arcade-card" key={item.id} onClick={() => start(item.id)}><div className={'arcade-card-art ' + item.color}><span>{item.icon}</span><small>NÍVEL {index === 0 ? '1' : '1–3'}</small></div><div className="arcade-card-copy"><small>{item.tag}</small><h3>{item.name}</h3><p>{item.subtitle}</p><span className="arcade-play">JOGAR AGORA <b>→</b></span></div></button>)}</div>
      <div className="arcade-note"><b>Seu progresso importa.</b><span>Ao entrar na sua conta, as rodadas concluídas são registradas no seu histórico de jogos.</span></div>
    </> : <div className="arcade-play-screen">
      <div className="arcade-game-header"><button onClick={resetHome}>← Todos os jogos</button><span>{modes.find(item => item.id === mode)?.tag}</span><div className="arcade-timer">00:{String(seconds).padStart(2, '0')}</div></div>
      {finished ? <div className="arcade-finish"><div className="arcade-finish-mark">✓</div><small>PARTIDA FINALIZADA</small><h2>{seconds === 0 ? 'Tempo encerrado!' : 'Desafio concluído!'}</h2><strong>{score}<small> / {mode === 'hangman' ? '1' : '5'}</small></strong><p>Você acertou {score} de {mode === 'hangman' ? '1 palavra' : '5 desafios'} nesta partida.</p>{saveMessage && <span role="status">{saveMessage}</span>}<button onClick={() => start(mode)}>Jogar novamente</button><button className="arcade-secondary" onClick={resetHome}>Escolher outro jogo</button></div> : mode === 'hangman' ? <div className="hangman-game">
        <div className="arcade-roundline"><span>DESCUBRA A PALAVRA</span><b>{Math.max(0, 6 - mistakes)} tentativas restantes</b></div>
        <div className="hangman-stage"><div className="hangman-scaffold"><span className="scaffold-top"/><span className="scaffold-side"/><span className="scaffold-base"/><span className="scaffold-rope"/>{mistakes > 0 && <i className="hangman-head"/>}{mistakes > 1 && <i className="hangman-body"/>}{mistakes > 2 && <i className="hangman-arm left"/>}{mistakes > 3 && <i className="hangman-arm right"/>}{mistakes > 4 && <i className="hangman-leg left"/>}{mistakes > 5 && <i className="hangman-leg right"/>}</div><div className="hangman-word">{revealed.map((letter, i) => <span key={i}>{letter || '_'}</span>)}</div></div>
        <div className="hangman-hint"><small>PISTA · {hangmanWord.category.toUpperCase()}</small><p>{hangmanWord.hint}</p></div>
        <div className="hangman-keyboard">{letters.map(letter => <button key={letter} disabled={guessed.includes(letter) || hangmanWon || hangmanLost} className={guessed.includes(letter) ? hangmanWord.word.includes(letter) ? 'hit' : 'miss' : ''} onClick={() => guess(letter)}>{letter}</button>)}</div>
        {(hangmanWon || hangmanLost) && <div className="arcade-feedback"><b>{hangmanWon ? 'Você encontrou a palavra!' : 'As tentativas terminaram.'} Palavra: {hangmanWord.word}</b><p>{hangmanWord.hint}</p><button onClick={finishHangman}>Ver resultado</button></div>}
      </div> : challenge ? <div className="arcade-challenge">
        <div className="arcade-roundline"><span>DESAFIO {round + 1} DE 5</span><b>{score} pontos</b></div>
        <div className="arcade-challenge-card"><small>{challenge.category.toUpperCase()}</small><h2>{challenge.prompt}</h2>
          {mode === 'sentence' ? <><p className="sentence-instruction">Toque nas palavras na ordem em que devem aparecer.</p><div className="sentence-answer">{sentenceOrder.map((word, i) => <button key={i} disabled={checked} onClick={() => setSentenceOrder(current => current.filter((_, index) => index !== i))}>{word}<span>×</span></button>)}</div><div className="sentence-bank">{(challenge.options ?? []).filter(word => !sentenceOrder.includes(word)).map((word, i) => <button key={i} disabled={checked} onClick={() => setSentenceOrder(current => [...current, word])}>{word}</button>)}</div><button className="sentence-reset" disabled={checked} onClick={() => setSentenceOrder(shuffle(challenge.options ?? []))}>Embaralhar novamente</button></> : <div className="arcade-answer-options">{(challenge.options ?? []).map(option => <button key={option} disabled={checked} className={choice === option ? 'selected' : ''} onClick={() => setChoice(option)}><span>{option}</span><i>{choice === option ? '●' : '○'}</i></button>)}</div>}
          {checked && <div className={'arcade-feedback ' + ((mode === 'sentence' ? sentenceOrder.join(' ') === challenge.answer : choice === challenge.answer) ? 'is-correct' : 'is-wrong')}><b>{(mode === 'sentence' ? sentenceOrder.join(' ') === challenge.answer : choice === challenge.answer) ? 'Muito bem! Resposta correta.' : 'Vamos aprender com esse erro.'}</b><p>{challenge.explanation}</p></div>}
          {!checked ? <button className="arcade-submit" disabled={mode === 'sentence' ? sentenceOrder.length === 0 : !choice} onClick={answer}>Confirmar resposta</button> : <button className="arcade-submit" onClick={next}>{round === 4 ? 'Finalizar partida' : 'Próximo desafio'}</button>}
        </div>
      </div> : null}
    </div>}
  </section>
}
