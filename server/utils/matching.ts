export type Holdings = Record<number, number> // sticker no -> count

const range = (total: number) => Array.from({ length: total }, (_, i) => i + 1)
export const needsOf = (h: Holdings, total = 50) => range(total).filter(no => !h[no])
export const swapsOf = (h: Holdings, total = 50) => range(total).filter(no => (h[no] ?? 0) >= 2)

export function computeMatches<T extends { holdings: Holdings }>(mine: Holdings, others: T[], total = 50) {
  const myNeeds = new Set(needsOf(mine, total))
  const mySwaps = swapsOf(mine, total)
  return others
    .map(({ holdings, ...rest }) => {
      const theyCanGive = swapsOf(holdings, total).filter(no => myNeeds.has(no))
      const iCanGive = mySwaps.filter(no => !holdings[no])
      return { ...rest, theyCanGive, iCanGive, perfect: theyCanGive.length > 0 && iCanGive.length > 0 }
    })
    .sort((a, b) =>
      Math.min(b.theyCanGive.length, b.iCanGive.length) - Math.min(a.theyCanGive.length, a.iCanGive.length)
      || (b.theyCanGive.length + b.iCanGive.length) - (a.theyCanGive.length + a.iCanGive.length))
}

type TradeRow = { from_book: string, to_book: string, give_json: string, get_json: string }
/** Copies each book has put into these trades: bookId -> sticker no -> count. */
export function tally(trades: TradeRow[]) {
  const out: Record<string, Holdings> = {}
  const add = (book: string, nos: number[]) => {
    const h = (out[book] ??= {})
    for (const no of nos) h[no] = (h[no] ?? 0) + 1
  }
  for (const t of trades) { add(t.from_book, JSON.parse(t.give_json)); add(t.to_book, JSON.parse(t.get_json)) }
  return out
}
/** Holdings minus copies promised away. Never below 1: the kid still owns the sticker. */
export const unpromised = (h: Holdings, promised: Holdings = {}) =>
  Object.fromEntries(Object.entries(h).map(([no, n]) => [no, Math.max(1, n - (promised[+no] ?? 0))])) as Holdings
