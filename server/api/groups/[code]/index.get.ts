export default defineEventHandler(async (event) => {
  const g = await groupByCode(event)
  const [books, board] = await db(event).batch([
    db(event).prepare(`SELECT b.id, b.child_name AS childName,
        COALESCE(SUM(h.count >= 1), 0) AS got, COALESCE(SUM(MAX(h.count - 1, 0)), 0) AS swaps
      FROM books b LEFT JOIN holdings h ON h.book_id = b.id
      WHERE b.group_id = ? GROUP BY b.id ORDER BY b.child_name COLLATE NOCASE`).bind(g.id),
    // every (book, sticker, count) in the group: ~30 books × 50 stickers, small enough to send whole
    db(event).prepare(`SELECT h.book_id AS bookId, h.sticker_no AS no, h.count
      FROM holdings h JOIN books b ON b.id = h.book_id WHERE b.group_id = ? AND h.count > 0`).bind(g.id),
  ])
  const access = await getAccess(event)
  return {
    name: g.name,
    joinCode: g.join_code,
    isAdmin: access.adminGroupIds.includes(g.id),
    books: books.results.map((b: any) => ({ ...b, mine: access.bookIds.includes(b.id) })),
    holdings: board.results as { bookId: string, no: number, count: number }[],
  }
})
