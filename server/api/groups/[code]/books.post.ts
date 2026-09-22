export default defineEventHandler(async (event) => {
  const g = await groupByCode(event)
  const body = await readBody(event)
  const childName = cleanName(body?.childName, "Child's name")
  const { hash, salt } = await hashPin(cleanPin(body?.pin))
  const { n } = await db(event).prepare('SELECT COUNT(*) AS n FROM books WHERE group_id = ?').bind(g.id).first() as any
  if (n >= 60) throw fail(400, 'This group is full') // a class, not a school
  const id = crypto.randomUUID()
  const now = Date.now()
  await db(event).prepare('INSERT INTO books (id, group_id, child_name, pin_hash, pin_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, g.id, childName, hash, salt, now, now).run()
  const access = await getAccess(event)
  await saveAccess(event, { ...access, bookIds: [...access.bookIds, id] })
  return { bookId: id }
})
