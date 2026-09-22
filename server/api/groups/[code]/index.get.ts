export default defineEventHandler(async (event) => {
  const g = await groupByCode(event)
  const [books, board] = await db(event).batch([
    db(event).prepare(`SELECT b.id, b.child_name AS childName,
        COALESCE(SUM(h.count >= 1), 0) AS got, COALESCE(SUM(MAX(h.count - 1, 0)), 0) AS swaps
      FROM books b LEFT JOIN holdings h ON h.book_id = b.id
      WHERE b.group_id = ? GROUP BY b.id ORDER BY b.child_name COLLATE NOCASE`).bind(g.id),
    db(event).prepare(`SELECT h.sticker_no AS no, SUM(h.count >= 1) AS have, SUM(MAX(h.count - 1, 0)) AS spare
      FROM holdings h JOIN books b ON b.id = h.book_id WHERE b.group_id = ? GROUP BY h.sticker_no`).bind(g.id),
  ])
  const access = await getAccess(event)
  return {
    name: g.name,
    joinCode: g.join_code,
    isAdmin: access.adminGroupIds.includes(g.id),
    books: books.results.map((b: any) => ({ ...b, mine: access.bookIds.includes(b.id) })),
    board: board.results, // per sticker: how many books have it, how many spares exist
  }
})
