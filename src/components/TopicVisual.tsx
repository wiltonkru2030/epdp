import './TopicVisual.css'

type Props = { topic: string; prompt?: string; compact?: boolean }

const themes = [
  { match: /interpreta|leitura|texto/i, key: 'reading', label: 'LEITURA E INTERPRETAÇÃO', words: ['Observe', 'Interprete', 'Conclua'], symbol: '📖' },
  { match: /semântica|significa|sentido/i, key: 'meaning', label: 'SENTIDO DAS PALAVRAS', words: ['Contexto', 'Significado', 'Uso'], symbol: '💬' },
  { match: /fonética|fonologia|fonema|sílab/i, key: 'sound', label: 'SONS DA LÍNGUA', words: ['Letra', 'Fonema', 'Sílaba'], symbol: '🔊' },
  { match: /ortografia|acentua|escrita/i, key: 'writing', label: 'ESCRITA CORRETA', words: ['Grafia', 'Acento', 'Revisão'], symbol: '✍️' },
  { match: /classes|gramatical|morfologia|palavra/i, key: 'grammar', label: 'ESTRUTURA DA LÍNGUA', words: ['Substantivo', 'Verbo', 'Adjetivo'], symbol: '🧩' },
  { match: /sintaxe|oração|sujeito/i, key: 'syntax', label: 'ANÁLISE DA ORAÇÃO', words: ['Sujeito', 'Verbo', 'Predicado'], symbol: '🔎' },
  { match: /pontua|crase|vírgula/i, key: 'punctuation', label: 'ORGANIZE AS IDEIAS', words: ['Pausa', 'Vírgula', 'Clareza'], symbol: '❝' },
  { match: /figura|metáfora|ironia/i, key: 'figures', label: 'LINGUAGEM EXPRESSIVA', words: ['Metáfora', 'Ironia', 'Ênfase'], symbol: '✨' },
  { match: /reescrita|concurso|avaliação|simulado/i, key: 'exam', label: 'DESAFIO DE CONHECIMENTO', words: ['Analisar', 'Resolver', 'Evoluir'], symbol: '🎯' },
  { match: /organização|coesão|coerência/i, key: 'text', label: 'CONSTRUÇÃO TEXTUAL', words: ['Coesão', 'Coerência', 'Conectivos'], symbol: '📝' },
]
function pick(topic: string) {
  return themes.find(item => item.match.test(topic)) ?? { key: 'language', label: 'APRENDER PORTUGUÊS', words: ['Linguagem', 'Comunicação', 'Aprendizado'], symbol: '📚' }
}

export default function TopicVisual({ topic, compact = false }: Props) {
  const theme = pick(topic)
  return <div className={`topic-visual topic-${theme.key}${compact ? ' topic-visual-compact' : ''}`} aria-label={`Resumo visual: ${theme.label}`}>
    <div className="topic-visual-symbol" aria-hidden="true">{theme.symbol}</div>
    <div className="topic-visual-copy">
      <span>{theme.label}</span>
      <strong>{topic}</strong>
      <div className="topic-visual-chips">{theme.words.map((word, index) => <span key={word}><i>{index + 1}</i>{word}</span>)}</div>
    </div>
    <div className="topic-visual-decoration" aria-hidden="true"><b>Aprender</b><b>Praticar</b><b>Avançar</b></div>
  </div>
}
