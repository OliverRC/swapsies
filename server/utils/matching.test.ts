import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeMatches } from './matching.ts'

test('ranks by fair swap size, then total', () => {
  const mine = { 1: 2, 2: 3, 3: 1 } // swaps: 1,2 · needs: 4,5 (total 5)
  const r = computeMatches(mine, [
    { id: 'taker', holdings: { 3: 1, 4: 1, 5: 1 } },          // needs 1,2 but gives nothing
    { id: 'perfect', holdings: { 2: 1, 3: 1, 4: 2, 5: 2 } },  // gives 4,5 · needs 1
    { id: 'nothing', holdings: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  ], 5)
  assert.deepEqual(r.map(m => m.id), ['perfect', 'taker', 'nothing'])
  assert.deepEqual(r[0], { id: 'perfect', theyCanGive: [4, 5], iCanGive: [1], perfect: true })
  assert.equal(r[1].perfect, false)
})
