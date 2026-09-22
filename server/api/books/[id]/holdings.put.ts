export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  await requireBook(event, id)
  const { stickerNo, count } = await readBody(event) ?? {}
  if (!Number.isInteger(stickerNo) || stickerNo < 1 || stickerNo > STICKER_TOTAL) throw fail(400, 'Bad sticker number')
  if (!Number.isInteger(count) || count < 0 || count > 99) throw fail(400, 'Count must be 0–99')
  await db(event).batch([
    db(event).prepare(`INSERT INTO holdings (book_id, sticker_no, count) VALUES (?, ?, ?)
      ON CONFLICT (book_id, sticker_no) DO UPDATE SET count = excluded.count`).bind(id, stickerNo, count),
    db(event).prepare('UPDATE books SET updated_at = ? WHERE id = ?').bind(Date.now(), id),
  ])
  return { stickerNo, count }
})
