// who may do what, from which status
const RULES: Record<string, { from: string[], side: 'to' | 'from' | 'either', status: string }> = {
  accept: { from: ['offered'], side: 'to', status: 'accepted' },
  decline: { from: ['offered'], side: 'to', status: 'declined' },
  cancel: { from: ['offered', 'accepted'], side: 'either', status: 'cancelled' },
  done: { from: ['accepted'], side: 'either', status: 'done' },
}

export default defineEventHandler(async (event) => {
  const action = getRouterParam(event, 'action')!
  const rule = RULES[action]
  if (!rule) throw fail(404, 'Unknown action')
  const d = db(event)
  const t = await d.prepare('SELECT * FROM trades WHERE id = ?').bind(getRouterParam(event, 'id')).first() as any
  if (!t) throw fail(404, 'Trade not found')

  const { bookIds } = await getAccess(event)
  const sides = { from: bookIds.includes(t.from_book), to: bookIds.includes(t.to_book) }
  const allowed = rule.side === 'either' ? sides.from || sides.to : sides[rule.side]
  // an offer can only be cancelled by whoever sent it
  if (!allowed || (action === 'cancel' && t.status === 'offered' && !sides.from)) throw fail(403, 'Unlock the right book first')
  if (!rule.from.includes(t.status)) throw fail(409, `This trade is already ${t.status}`)

  const now = Date.now()
  if (action !== 'done' && action !== 'accept') {
    await d.prepare('UPDATE trades SET status = ?, updated_at = ? WHERE id = ? AND status = ?').bind(rule.status, now, t.id, t.status).run()
    return { status: rule.status }
  }

  // accept + done: make sure both kids still have the spares, and haven't promised them in another accepted trade
  const give: number[] = JSON.parse(t.give_json)
  const get: number[] = JSON.parse(t.get_json)
  for (const [bookId, nos] of [[t.from_book, give], [t.to_book, get]] as const) {
    const no = await missingSpare(event, { id: bookId, group_id: t.group_id }, nos, t.id)
    if (no) {
      const b = await bookById(event, bookId)
      throw fail(409, `${b.child_name}'s spare #${no} is gone or already promised in another trade`)
    }
  }
  if (action === 'accept') {
    await d.prepare(`UPDATE trades SET status = 'accepted', updated_at = ? WHERE id = ? AND status = 'offered'`).bind(now, t.id).run()
    return { status: 'accepted' }
  }

  // One transaction. Every statement is gated on the trade still being 'accepted', so a
  // double "Swapped!" from both phones moves the stickers once. The status flip goes last.
  const gate = `(SELECT status FROM trades WHERE id = ?) = 'accepted'`
  const move = (giver: string, receiver: string, no: number) => [
    d.prepare(`UPDATE holdings SET count = count - 1 WHERE book_id = ? AND sticker_no = ? AND ${gate}`).bind(giver, no, t.id),
    d.prepare(`INSERT INTO holdings (book_id, sticker_no, count) SELECT ?, ?, 1 WHERE ${gate}
      ON CONFLICT (book_id, sticker_no) DO UPDATE SET count = count + 1`).bind(receiver, no, t.id),
  ]
  try {
    const res = await d.batch([
      ...give.flatMap(no => move(t.from_book, t.to_book, no)),
      ...get.flatMap(no => move(t.to_book, t.from_book, no)),
      d.prepare(`UPDATE books SET updated_at = ? WHERE id IN (?, ?)`).bind(now, t.from_book, t.to_book),
      d.prepare(`UPDATE trades SET status = 'done', updated_at = ? WHERE id = ? AND status = 'accepted'`).bind(now, t.id),
    ])
    if (!res.at(-1).meta.changes) throw fail(409, 'This trade was already finished')
  }
  catch (e: any) {
    if (e.statusCode) throw e
    throw fail(409, 'Those stickers are not all available any more') // CHECK (count >= 0) rolled it back
  }
  return { status: 'done' }
})
