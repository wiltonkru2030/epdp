type Props = { topic: string; prompt?: string; compact?: boolean }

const themes = [
  { match: /interpreta|leitura|texto/i, key: 'reading', eyebrow: 'LEITURA ATIVA', chips: ['PISTAS DO TEXTO', 'INFERÊNCIA', 'SENTIDO'] },
  { match: /semântica|significa|sentido/i, key: 'meaning', eyebrow: 'SENTIDO DAS PALAVRAS', chips: ['CONTEXTO', 'SIGNIFICADO', 'USO'] },
  { match: /fonética|fonologia|fonema|sílab/i, key: 'sound', eyebrow: 'ESTRUTURA SONORA', chips: ['LETRA', 'FONEMA', 'SÍLABA'] },
  { match: /ortografia|acentua|escrita/i, key: 'writing', eyebrow: 'ESCRITA CORRETA', chips: ['GRAFIA', 'ACENTO', 'REVISÃO'] },
  { match: /classes|gramatical|morfologia|palavra/i, key: 'grammar', eyebrow: 'ESTRUTURA DA LÍNGUA', chips: ['SUBSTANTIVO', 'VERBO', 'ADJETIVO'] },
  { match: /sintaxe|oração|sujeito/i, key: 'syntax', eyebrow: 'ANÁLISE DA ORAÇÃO', chips: ['SUJEITO', 'VERBO', 'PREDICADO'] },
  { match: /pontua|crase|vírgula/i, key: 'punctuation', eyebrow: 'ORGANIZE AS IDEIAS', chips: ['PAUSA', 'VÍRGULA', 'CLAREZA'] },
  { match: /figura|metáfora|ironia/i, key: 'figures', eyebrow: 'LINGUAGEM EXPRESSIVA', chips: ['IMAGEM', 'COMPARAÇÃO', 'EFEITO'] },
  { match: /reescrita|concurso|avaliação|simulado/i, key: 'exam', eyebrow: 'DESAFIO DE CONHECIMENTO', chips: ['ANALISAR', 'RESOLVER', 'EVOLUIR'] },
  { match: /organização|coesão|coerência/i, key: 'text', eyebrow: 'CONSTRUÇÃO TEXTUAL', chips: ['COESÃO', 'COERÊNCIA', 'CONECTIVOS'] },
]
function pick(topic: string) { return themes.find(item => item.match.test(topic)) ?? { key: 'language', eyebrow: 'APRENDER PORTUGUÊS', chips: ['LINGUAGEM', 'COMUNICAÇÃO', 'APRENDIZADO'] } }

export default function TopicVisual({ topic, prompt, compact = false }: Props) {
  const theme = pick(topic + ' ' + (prompt ?? ''))
  return <div className={`topic-visual topic-${theme.key}${compact ? ' topic-visual-compact' : ''}`} role="img" aria-label={`Ilustração educativa: ${topic}`}>
    <div className="topic-visual-copy"><span>{theme.eyebrow}</span><strong>{topic}</strong><p>{prompt || 'Observe os elementos, relacione as ideias e descubra como a língua funciona.'}</p>
      <div className="topic-visual-chips">{theme.chips.map(chip => <i key={chip}>{chip}</i>)}</div>
    </div>
    <svg className="topic-visual-art" viewBox="0 0 280 210" aria-hidden="true">
      <circle cx="150" cy="103" r="83" className="visual-orbit"/><circle cx="150" cy="103" r="62" className="visual-orbit visual-orbit-inner"/>
      <g className="visual-paper" transform="rotate(-7 150 104)"><rect x="88" y="32" width="126" height="150" rx="15"/><path d="M110 66h80M110 83h62M110 111h80M110 128h55" /><circle cx="178" cy="151" r="13"/><path d="m172 151 4 4 8-9"/></g>
      <g className="visual-float visual-float-a"><rect x="24" y="49" width="70" height="39" rx="10"/><path d="M38 62h42M38 74h27"/></g>
      <g className="visual-float visual-float-b"><rect x="185" y="137" width="76" height="42" rx="11"/><path d="M199 151h46M199 164h30"/></g>
      <g className="visual-accent"><path d="m221 31 5 11 11 5-11 5-5 11-5-11-11-5 11-5z"/><circle cx="56" cy="150" r="7"/></g>
      {theme.key === 'reading' && <g className="visual-symbol"><path d="M124 91q15-10 30 0v35q-15-10-30 0zM154 91q15-10 30 0v35q-15-10-30 0z"/></g>}
      {theme.key === 'meaning' && <g className="visual-symbol"><circle cx="150" cy="105" r="24"/><path d="M150 91v29M138 105h24"/></g>}
      {theme.key === 'sound' && <g className="visual-symbol"><path d="M126 102h12l18-14v42l-18-14h-12zM166 96q17 9 0 18M173 87q29 18 0 36"/></g>}
      {theme.key === 'writing' && <g className="visual-symbol"><path d="m128 126 7-24 28-28 17 17-28 28zM135 102l17 17"/></g>}
      {theme.key === 'grammar' && <g className="visual-symbol"><circle cx="150" cy="92" r="12"/><circle cx="127" cy="126" r="10"/><circle cx="174" cy="126" r="10"/><path d="m144 102-12 15m24-15 12 15"/></g>}
      {theme.key === 'syntax' && <g className="visual-symbol"><rect x="123" y="81" width="54" height="19" rx="6"/><rect x="112" y="126" width="34" height="18" rx="6"/><rect x="154" y="126" width="34" height="18" rx="6"/><path d="M150 100v13h-21v13m21-13h21v13"/></g>}
      {theme.key === 'punctuation' && <g className="visual-symbol"><path d="M145 81v31m0 17v2M166 84q17 9 0 18l-8 8"/></g>}
      {theme.key === 'figures' && <g className="visual-symbol"><path d="M126 125q0-30 24-30t24 30M135 103l-9-9m48 9 9-9M143 118h14"/></g>}
      {theme.key === 'exam' && <g className="visual-symbol"><path d="m130 111 13 13 29-34"/><path d="M124 82h52M124 139h52"/></g>}
      {theme.key === 'text' && <g className="visual-symbol"><path d="M126 90h48M126 105h39M126 120h48M126 135h30"/></g>}
      {theme.key === 'language' && <g className="visual-symbol"><text x="150" y="120" textAnchor="middle">Aa</text></g>}
    </svg>
  </div>
}
