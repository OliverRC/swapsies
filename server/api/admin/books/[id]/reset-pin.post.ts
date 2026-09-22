export default defineEventHandler(async (event) => {
  const b = await bookById(event)
  await requireAdmin(event, b.group_id)
  const { hash, salt } = await hashPin(cleanPin((await readBody(event))?.newPin))
  await db(event).prepare('UPDATE books SET pin_hash = ?, pin_salt = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?').bind(hash, salt, b.id).run()
  return { ok: true }
})
