export default defineEventHandler(async (event) => {
  const g = await groupByCode(event)
  await requireAdmin(event, g.id)
  const name = cleanName((await readBody(event))?.name, 'Group name')
  await db(event).prepare('UPDATE groups SET name = ? WHERE id = ?').bind(name, g.id).run()
  return { name }
})
