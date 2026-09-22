export default defineEventHandler(async (event) => {
  const me = await bookById(event)
  const { results } = await db(event).prepare(`SELECT b.id, b.child_name AS childName, h.sticker_no AS no, h.count
    FROM books b LEFT JOIN holdings h ON h.book_id = b.id AND h.count > 0 WHERE b.group_id = ?`).bind(me.group_id).all()
  const books = new Map<string, { id: string, childName: string, holdings: Holdings }>()
  for (const r of results as any[]) {
    if (!books.has(r.id)) books.set(r.id, { id: r.id, childName: r.childName, holdings: {} })
    if (r.no) books.get(r.id)!.holdings[r.no] = r.count
  }
  const mine = books.get(me.id)!.holdings
  books.delete(me.id)
  return computeMatches(mine, [...books.values()], STICKER_TOTAL)
})
