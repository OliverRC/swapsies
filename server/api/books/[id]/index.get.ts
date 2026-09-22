export default defineEventHandler(async (event) => {
  const b = await bookById(event)
  const g = await db(event).prepare('SELECT name, join_code FROM groups WHERE id = ?').bind(b.group_id).first() as any
  return {
    id: b.id,
    childName: b.child_name,
    groupName: g.name,
    joinCode: g.join_code,
    unlocked: (await getAccess(event)).bookIds.includes(b.id),
    holdings: await holdingsOf(event, b.id),
  }
})
