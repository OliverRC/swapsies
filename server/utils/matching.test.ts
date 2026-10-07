import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeMatches, tally, unpromised } from './matching.ts'

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

test('promised spares are not free, but the kid keeps their copy', () => {
  const t = (from_book: string, to_book: string, give: number[], get: number[]) => ({ from_book, to_book, give_json: JSON.stringify(give), get_json: JSON.stringify(get) })
  const promised = tally([t('ava', 'ben', [12], [3]), t('cara', 'ava', [5], [12, 7])])
  assert.deepEqual(promised, { ava: { 12: 2, 7: 1 }, ben: { 3: 1 }, cara: { 5: 1 } })
  // ava: three #12 = two spares, both promised · #7 over-promised (old data) still leaves her copy · #9 untouched
  assert.deepEqual(unpromised({ 12: 3, 7: 2, 9: 2 }, promised.ava), { 12: 1, 7: 1, 9: 2 })
})
