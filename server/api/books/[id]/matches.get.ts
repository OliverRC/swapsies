export default defineEventHandler(async (event) => {
  const me = await bookById(event)
  const { results } = await db(event).prepare(`SELECT b.id, b.child_name AS childName, h.sticker_no AS no, h.count
    FROM books b LEFT JOIN holdings h ON h.book_id = b.id AND h.count > 0 WHERE b.group_id = ?`).bind(me.group_id).all()
  const books = new Map<string, { id: string, childName: string, holdings: Holdings }>()
  for (const r of results as any[]) {
    if (!books.has(r.id)) books.set(r.id, { id: r.id, childName: r.childName, holdings: {} })
    if (r.no) books.get(r.id)!.holdings[r.no] = r.count
  }
  // promised spares (accepted trades) aren't on offer; spares in open offers are, but the trade window warns
  const [promised, offered] = await Promise.all([tiedUp(event, me.group_id, 'accepted'), tiedUp(event, me.group_id, 'offered')])
  const mine = unpromised(books.get(me.id)!.holdings, promised[me.id])
  books.delete(me.id)
  const others = [...books.values()].map(b => ({ ...b, holdings: unpromised(b.holdings, promised[b.id]), inOffers: Object.keys(offered[b.id] ?? {}).map(Number) }))
  return computeMatches(mine, others, STICKER_TOTAL)
})
