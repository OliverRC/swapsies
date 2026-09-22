export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireBook(event, id)
  const { results } = await db(event).prepare(`SELECT t.id, t.from_book, t.to_book, t.give_json, t.get_json, t.status, t.updated_at,
      f.child_name AS from_name, o.child_name AS to_name
    FROM trades t JOIN books f ON f.id = t.from_book JOIN books o ON o.id = t.to_book
    WHERE t.from_book = ?1 OR t.to_book = ?1 ORDER BY t.updated_at DESC LIMIT 50`).bind(id).all()
  // flip each trade to this book's point of view
  return (results as any[]).map((t) => {
    const sent = t.from_book === id
    return {
      id: t.id, status: t.status, updatedAt: t.updated_at, sent,
      friendId: sent ? t.to_book : t.from_book,
      friendName: sent ? t.to_name : t.from_name,
      iGive: JSON.parse(sent ? t.give_json : t.get_json) as number[],
      iGet: JSON.parse(sent ? t.get_json : t.give_json) as number[],
    }
  })
})
