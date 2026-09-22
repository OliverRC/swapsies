export default defineEventHandler(async (event) => {
  const b = await bookById(event)
  await requireAdmin(event, b.group_id)
  await db(event).batch([
    db(event).prepare('DELETE FROM trades WHERE from_book = ?1 OR to_book = ?1').bind(b.id),
    db(event).prepare('DELETE FROM holdings WHERE book_id = ?').bind(b.id),
    db(event).prepare('DELETE FROM books WHERE id = ?').bind(b.id),
  ])
  return { ok: true }
})
