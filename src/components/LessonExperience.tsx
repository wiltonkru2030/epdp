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
  if (t.includes('pontua') && !t.includes('crase')) return [
    { prompt: 'Qual frase usa corretamente a vírgula para separar o vocativo?', options: ['Pedro venha estudar.', 'Pedro, venha estudar.', 'Pedro venha, estudar.', 'Pedro venha estudar,'], answer: 1, explanation: 'O vocativo “Pedro” deve ser isolado por vírgula.' },
    { prompt: 'Em “Os estudantes revisaram a matéria”, o sujeito é:', options: ['revisaram', 'a matéria', 'Os estudantes', 'a matéria revisaram'], answer: 2, explanation: '“Os estudantes” é o termo sobre o qual se declara algo.' },
    { prompt: 'Qual conectivo expressa oposição?', options: ['portanto', 'porque', 'mas', 'logo'], answer: 2, explanation: '“Mas” é uma conjunção adversativa e indica oposição.' },
  ]
  if (t.includes('interpreta')) return [
    { prompt: 'Uma informação explícita é aquela que:', options: ['Está diretamente apresentada no texto', 'Depende de adivinhação', 'Contradiz o texto', 'É sempre uma opinião'], answer: 0, explanation: 'A informação explícita aparece diretamente no texto.' },
    { prompt: 'Inferir significa:', options: ['Copiar uma frase', 'Concluir a partir de pistas do texto', 'Ignorar o contexto', 'Inventar uma informação'], answer: 1, explanation: 'A inferência é uma conclusão plausível sustentada por pistas textuais.' },
    { prompt: 'Em “Marina comprou um livro. Ela começou a leitura”, “ela” retoma:', options: ['leitura', 'livro', 'Marina', 'começou'], answer: 2, explanation: 'O pronome “ela” retoma o nome Marina, estabelecendo coesão referencial.' },
  ]
  if (t.includes('semântica')) return [
    { prompt: 'Em “Sentei no banco da praça”, banco significa:', options: ['Instituição financeira', 'Assento', 'Margem de rio', 'Conjunto de dados'], answer: 1, explanation: 'O contexto “da praça” indica que banco é um assento.' },
    { prompt: 'A expressão “coração de pedra” está em sentido:', options: ['Denotativo', 'Conotativo', 'Técnico', 'Literal'], answer: 1, explanation: 'A expressão é figurada: indica insensibilidade, não um coração feito de pedra.' },
    { prompt: 'Palavras com sentidos opostos são:', options: ['Sinônimas', 'Homônimas', 'Antônimas', 'Polissêmicas'], answer: 2, explanation: 'Antônimos expressam oposição de sentido.' },
  ]
  if (t.includes('coesão') || t.includes('organização textual')) return [
    { prompt: 'Em “Ana chegou. Ela trouxe os livros”, “ela” é um recurso de:', options: ['Coesão referencial', 'Ironia', 'Ambiguidade', 'Hipérbole'], answer: 0, explanation: 'O pronome retoma Ana e conecta as frases.' },
    { prompt: 'Qual conectivo indica oposição?', options: ['portanto', 'porque', 'mas', 'logo'], answer: 2, explanation: '“Mas” introduz uma relação adversativa.' },
    { prompt: 'Notícia, receita e e-mail são exemplos de:', options: ['Fonemas', 'Gêneros textuais', 'Figuras de linguagem', 'Orações'], answer: 1, explanation: 'São gêneros textuais usados em situações sociais de comunicação.' },
  ]
  if (t.includes('fonética') || t.includes('fonologia')) return [
    { prompt: 'Em “chave”, CH é:', options: ['Encontro consonantal', 'Dígrafo', 'Hiato', 'Ditongo'], answer: 1, explanation: 'Duas letras representam um único fonema.' },
    { prompt: 'A palavra “saúde” apresenta:', options: ['Ditongo', 'Tritongo', 'Hiato', 'Dígrafo'], answer: 2, explanation: 'As vogais a e ú ficam em sílabas diferentes: sa-ú-de.' },
    { prompt: 'Fonema é:', options: ['Sinal gráfico', 'Unidade sonora distintiva', 'Uma sílaba escrita', 'Um tipo de acento'], answer: 1, explanation: 'Fonema é uma unidade sonora capaz de distinguir palavras.' },
  ]
  if (t.includes('classes gramaticais')) return [
    { prompt: 'Em “A menina inteligente respondeu”, “inteligente” é:', options: ['Substantivo', 'Verbo', 'Adjetivo', 'Advérbio'], answer: 2, explanation: 'O adjetivo caracteriza o substantivo “menina”.' },
    { prompt: 'Qual classe expressa ação, estado ou fenômeno?', options: ['Verbo', 'Artigo', 'Preposição', 'Interjeição'], answer: 0, explanation: 'O verbo expressa ação, estado, mudança ou fenômeno.' },
    { prompt: 'Qual classe conecta orações?', options: ['Numeral', 'Conjunção', 'Adjetivo', 'Substantivo'], answer: 1, explanation: 'A conjunção conecta termos ou orações e estabelece relações de sentido.' },
  ]
  if (t.includes('morfologia') || t.includes('formação das palavras')) return [
    { prompt: 'Em “infeliz”, “in-” é:', options: ['Sufixo', 'Radical', 'Prefixo', 'Desinência'], answer: 2, explanation: 'O prefixo aparece antes do radical.' },
    { prompt: '“Passatempo” é formado por:', options: ['Composição', 'Flexão', 'Derivação sufixal', 'Parassíntese'], answer: 0, explanation: 'A palavra resulta da união de dois elementos: passa + tempo.' },
    { prompt: 'Em “felizmente”, “-mente” é:', options: ['Prefixo', 'Sufixo', 'Radical', 'Vogal temática'], answer: 1, explanation: 'O sufixo é acrescentado depois do radical.' },
  ]
  if (t.includes('sintaxe')) return [
    { prompt: 'Em “A professora explicou a matéria”, o sujeito é:', options: ['explicou', 'a matéria', 'A professora', 'professora explicou'], answer: 2, explanation: '“A professora” é o termo sobre o qual se declara algo.' },
    { prompt: 'Em “Comprei um caderno”, “um caderno” é:', options: ['Objeto direto', 'Objeto indireto', 'Vocativo', 'Aposto'], answer: 0, explanation: 'O complemento liga-se ao verbo sem preposição obrigatória.' },
    { prompt: 'Quantas orações há em “Estudei e revisei o conteúdo”?', options: ['Uma', 'Duas', 'Três', 'Quatro'], answer: 1, explanation: 'Há dois verbos, portanto duas orações.' },
  ]
  if (t.includes('crase')) return [
    { prompt: 'Em “Fui à escola”, a crase ocorre pela fusão de:', options: ['Artigo + artigo', 'Preposição a + artigo a', 'Pronome + verbo', 'Duas preposições'], answer: 1, explanation: 'O verbo exige a preposição “a” e “escola” admite o artigo feminino “a”.' },
    { prompt: 'Em “Começou a estudar”, ocorre crase?', options: ['Sim, sempre', 'Não, antes de verbo não ocorre', 'Somente no plural', 'Depende do sujeito'], answer: 1, explanation: 'Não se usa crase antes de verbo.' },
    { prompt: 'Qual frase está correta?', options: ['Fui à pé', 'Entreguei à ela', 'Voltei à cidade', 'Começou à chover'], answer: 2, explanation: '“Voltei à cidade” apresenta preposição exigida pelo verbo e artigo feminino.' },
  ]
  if (t.includes('figuras de linguagem')) return [
    { prompt: '“Estou morrendo de fome” é exemplo de:', options: ['Eufemismo', 'Hipérbole', 'Metonímia', 'Antítese'], answer: 1, explanation: 'Hipérbole é o exagero intencional para enfatizar uma ideia.' },
    { prompt: '“Seus olhos são estrelas” apresenta:', options: ['Metáfora', 'Comparação explícita', 'Ironia', 'Pleonasmo'], answer: 0, explanation: 'A metáfora aproxima elementos sem conectivo comparativo.' },
    { prompt: 'Em “João afirmou que chegaria cedo”, predomina discurso:', options: ['Direto', 'Indireto', 'Indireto livre', 'Poético'], answer: 1, explanation: 'A fala é integrada à narração, sem reprodução literal.' },
  ]
  if (t.includes('reescrita') || t.includes('concursos')) return [
    { prompt: 'A transformação “A equipe concluiu o relatório” / “O relatório foi concluído pela equipe” preserva:', options: ['A ideia principal', 'O tempo futuro', 'O sujeito agente', 'A forma interrogativa'], answer: 0, explanation: 'A voz muda de ativa para passiva, mas o fato principal é preservado.' },
    { prompt: '“Embora” expressa relação de:', options: ['Causa', 'Consequência', 'Concessão', 'Conclusão'], answer: 2, explanation: '“Embora” introduz uma ideia concessiva.' },
    { prompt: 'Ao substituir um conectivo, deve-se verificar:', options: ['Somente o tamanho da frase', 'Se a relação lógica foi preservada', 'A quantidade de vírgulas', 'A primeira letra'], answer: 1, explanation: 'A substituição precisa preservar a relação de sentido entre as orações.' },
  ]
  return [
    { prompt: 'Qual é a melhor estratégia para estudar este conteúdo?', options: ['Ler os exemplos e praticar', 'Memorizar sem compreender', 'Pular as explicações', 'Responder sem ler'], answer: 0, explanation: 'Compreender os conceitos, observar exemplos e praticar ajuda a consolidar a aprendizagem.' },
    { prompt: 'Ao analisar uma frase, devemos observar:', options: ['Somente o tamanho', 'O contexto e a função das palavras', 'Apenas a primeira palavra', 'Somente a pontuação'], answer: 1, explanation: 'O contexto é essencial para compreender o sentido e a função dos elementos da língua.' },
    { prompt: 'Depois de errar uma questão, o melhor é:', options: ['Ignorar o erro', 'Rever a explicação e tentar novamente', 'Apagar a atividade', 'Desistir do assunto'], answer: 1, explanation: 'O erro orienta a revisão: leia a explicação, identifique a dificuldade e pratique novamente.' },
  ]
}

function Illustration({ title }: { title: string }) {
  const t = title.toLowerCase()
  let theme = 'language'
  let label = 'LINGUAGEM'
  let words = ['LETRAS', 'SONS', 'PALAVRAS']
  if (t.includes('interpreta')) { theme = 'reading'; label = 'LEITURA'; words = ['TEXTO', 'PISTAS', 'SENTIDO'] }
  else if (t.includes('semântica')) { theme = 'meaning'; label = 'SENTIDO'; words = ['PALAVRA', 'CONTEXTO', 'SIGNIFICADO'] }
  else if (t.includes('organização textual')) { theme = 'text'; label = 'TEXTO'; words = ['COESÃO', 'COERÊNCIA', 'CONECTIVOS'] }
  else if (t.includes('fonética') || t.includes('fonologia')) { theme = 'sounds'; label = 'SONS'; words = ['LETRA', 'FONEMA', 'SÍLABA'] }
  else if (t.includes('ortografia') || t.includes('acentua')) { theme = 'writing'; label = 'ESCRITA'; words = ['LETRA', 'SÍLABA', 'ACENTO'] }
  else if (t.includes('classes gramaticais')) { theme = 'grammar'; label = 'GRAMÁTICA'; words = ['NOME', 'VERBO', 'ADJETIVO'] }
  else if (t.includes('morfologia')) { theme = 'morphology'; label = 'PALAVRAS'; words = ['RADICAL', 'PREFIXO', 'SUFIXO'] }
  else if (t.includes('sintaxe')) { theme = 'syntax'; label = 'SINTAXE'; words = ['SUJEITO', 'VERBO', 'PREDICADO'] }
  else if (t.includes('crase')) { theme = 'punctuation'; label = 'PONTUAÇÃO'; words = ['VÍRGULA', 'CRASE', 'PAUSA'] }
  else if (t.includes('pontua')) { theme = 'punctuation'; label = 'FRASES'; words = ['FRASE', 'PAUSA', 'IDEIA'] }
  else if (t.includes('figuras de linguagem')) { theme = 'figures'; label = 'EXPRESSÃO'; words = ['METÁFORA', 'IRONIA', 'HIPÉRBOLE'] }
  else if (t.includes('reescrita')) { theme = 'rewrite'; label = 'REVISÃO'; words = ['SENTIDO', 'CONECTIVO', 'FRASE'] }
  return <div className={'lesson-illustration theme-' + theme} role="img" aria-label={'Ilustração educativa sobre ' + title}>
    <div className="lesson-illustration-orbit orbit-one" /><div className="lesson-illustration-orbit orbit-two" />
    <div className="lesson-illustration-book"><span>{label}</span><strong>Aa</strong><small>EPDP · APRENDER</small></div>
    <div className="lesson-illustration-word word-one">{words[0]}</div><div className="lesson-illustration-word word-two">{words[1]}</div><div className="lesson-illustration-word word-three">{words[2]}</div>
    <span className="lesson-illustration-spark spark-one">✦</span><span className="lesson-illustration-spark spark-two">✧</span>
  </div>
}

function contentSections(content: string) {
  const normalized = content.replace(/\r/g, '').replace(/\\n/g, '\n').trim()
  const blocks = normalized.replace(/\n(?=## )/g, '\n\n').split(/\n\s*\n/).map(block => block.trim()).filter(Boolean)
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
