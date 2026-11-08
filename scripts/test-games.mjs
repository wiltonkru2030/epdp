import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transformWithEsbuild } from 'vite'

const source = await readFile(new URL('../src/content/games.ts', import.meta.url), 'utf8')
const { code } = await transformWithEsbuild(source, 'src/content/games.ts', { loader: 'ts', target: 'es2022', format: 'esm' })
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
const { games, gridLetters, gridPaths } = await import(moduleUrl)

assert.equal(games.length, 20, 'The arcade must contain exactly 20 games')
assert.equal(new Set(games.map(game => game.id)).size, 20, 'Game IDs must be unique')

let totalChallenges = 0
for (const game of games) {
  assert.equal(game.challenges.length, 6, game.id + ' must have six rounds')
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
assert.equal(totalChallenges, 120, 'All games together must provide 120 rounds')

const gridGame = games.find(game => game.kind === 'grid')
for (const challenge of gridGame.challenges) {
  const path = gridPaths[challenge.answer]
  assert.ok(path, 'Missing word-search path for ' + challenge.answer)
  assert.equal(path.map(index => gridLetters[index]).join(''), challenge.answer, 'Word-search path mismatch for ' + challenge.answer)
}

const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const component = await readFile(new URL('../src/components/GamesArcade.tsx', import.meta.url), 'utf8')
assert.match(css, /@media\s*\(max-width:\s*700px\)/, 'Mobile layout breakpoint is required')
assert.match(css, /prefers-reduced-motion/, 'Reduced-motion support is required')
assert.match(component, /function startMusic/, 'Background music must start in a game')
assert.match(component, /navigator\.vibrate/, 'Haptic feedback must be feature-detected')
assert.match(component, /arena-achievement-celebration/, 'Achievement celebration must be rendered')

console.log('EPDP Game Arena smoke tests passed: 20 games, 120 rounds, valid answer choices, word-search paths, mobile layout, audio and haptics.')
