import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transformWithEsbuild } from 'vite'

const source = await readFile(new URL('../src/content/games.ts', import.meta.url), 'utf8')
const { code } = await transformWithEsbuild(source, 'src/content/games.ts', { loader: 'ts', target: 'es2022', format: 'esm' })
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
const { games, gridLetters, gridPaths, normalize } = await import(moduleUrl)

assert.equal(games.length, 20, 'The arcade must contain exactly 20 games')
assert.equal(new Set(games.map(game => game.id)).size, 20, 'Game IDs must be unique')

let totalChallenges = 0
for (const game of games) {
  assert.equal(game.challenges.length, 8, game.id + ' must have six rounds')
  totalChallenges += game.challenges.length
  for (const [index, challenge] of game.challenges.entries()) {
    const label = game.id + ' round ' + (index + 1)
    for (const field of ['prompt', 'answer', 'hint', 'explanation', 'category']) {
      assert.ok(typeof challenge[field] === 'string' && challenge[field].trim().length > 0, label + ' is missing ' + field)
    }
    if (['grid', 'hangman'].includes(game.kind)) continue
    assert.ok(Array.isArray(challenge.options) && challenge.options.length >= 2, label + ' needs at least two options')
    if (game.kind === 'order' || game.kind === 'sequence') {
      assert.deepEqual([...challenge.answer.split(' ')].sort(), [...challenge.options].sort(), label + ' pieces must form the expected sentence')
    } else if (game.kind === 'syllables') {
      assert.deepEqual([...challenge.answer.split('-')].sort(), [...challenge.options].sort(), label + ' syllables must form the expected word')
    } else {
      assert.ok(challenge.options.includes(challenge.answer), label + ' answer must be one of the options')
    }
  }
}
assert.equal(totalChallenges, 160, 'All games together must provide 160 rounds')

assert.equal(gridLetters.length, 64, 'Word-search board must be an 8x8 grid')
const gridGame = games.find(game => game.kind === 'grid')
for (const challenge of gridGame.challenges) {
  const path = gridPaths[challenge.answer]
  assert.ok(path, 'Missing word-search path for ' + challenge.answer)
  assert.equal(path.length, challenge.answer.length, 'Word-search path length mismatch for ' + challenge.answer)
  assert.ok(path.every(index => index >= 0 && index < gridLetters.length), 'Word-search path index outside board')
  assert.equal(path.map(index => gridLetters[index]).join(''), challenge.answer, 'Word-search path mismatch for ' + challenge.answer)
}

const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const component = await readFile(new URL('../src/components/GamesArcade.tsx', import.meta.url), 'utf8')
assert.match(css, /@media\s*\(max-width:\s*700px\)/, 'Mobile layout breakpoint is required')
assert.match(css, /prefers-reduced-motion/, 'Reduced-motion support is required')
assert.match(component, /function startMusic/, 'Background music must start in a game')
assert.match(component, /soundtrackByGame:Record<string/, 'Every game must use its own soundtrack profile')
for (const game of games) assert.match(component, new RegExp("'" + game.id + "':\\{notes:"), game.id + ' is missing its own soundtrack')
for (const game of games) assert.match(component, new RegExp("'" + game.id + "':'/arcade/"), game.id + ' is missing its mascot assignment')
assert.match(component, /ROUND_SECONDS=240/, 'Timed games must have a longer 240-second session')
assert.match(component, /ABCDEFGHIJLMNOPQRSTUVXZ/, 'Hangman keyboard must avoid duplicate accented keys and irrelevant letters')
assert.doesNotMatch(component, /ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÂÊÔÃÕÇ/, 'Hangman must not render duplicate accent keys')
assert.doesNotMatch(source, /saùde|idéía|Cidadões|Cidadães|lâmpâda|têem/, 'Remove malformed distractor spellings')
assert.match(component, /navigator\.vibrate/, 'Haptic feedback must be feature-detected')
assert.match(component, /feedback&&game\.kind!=='hangman'/, 'Hangman must not show a duplicate next-round button')
assert.match(component, /mascotByGame:Record<string,string>/, 'Each game must be assigned a mascot')
assert.match(source, /for\(let i=copy\.length-1;i>0;i--\)/, 'Piece shuffling must use unbiased Fisher-Yates')
const keyboard = 'ABCDEFGHIJLMNOPQRSTUVXZ'
assert.equal(new Set(keyboard).size, keyboard.length, 'Hangman keyboard keys must be unique')
assert.ok(!/[KWY]/.test(keyboard), 'This Portuguese-only vocabulary keyboard must omit unused K, W and Y keys')
for (const game of games.filter(item => item.kind === 'hangman')) for (const letter of normalize(game.challenges.map(c => c.answer).join(''))) assert.ok(!/[A-Z]/.test(letter) || keyboard.includes(letter), game.id + ' contains a letter missing from the hangman keyboard')
assert.match(component, /arena-achievement-celebration/, 'Achievement celebration must be rendered')

assert.equal(new Set(games.map(game => game.id)).size, 20, 'All game IDs must remain unique')
for (const id of ['caca-palavras','forca-palavras','complete-word','acentuacao','separacao-silabica','classificacao-substantivos','identifique-adjetivos','desafio-pronomes','conjugacao-verbos','corrida-tempos-verbais','monte-frase','organize-palavras','encontre-erro','sinonimos-antonimos','homonimos-paronimos','interpretacao','figuras-linguagem','pontuacao','concordancia','batalha-conhecimentos']) assert.ok(games.some(game => game.id === id), 'Missing expected game ' + id)
console.log('EPDP Game Arena smoke tests passed: 20 games, 160 rounds, Portuguese answer choices, 8x8 word-search paths, unique tracks, mobile layout, audio and haptics.')
