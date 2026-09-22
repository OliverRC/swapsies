export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = cleanName(body?.name, 'Group name')
  const { hash, salt } = await hashPin(cleanPin(body?.adminPin))
  const id = crypto.randomUUID()
  const code = joinCode()
  await db(event).prepare('INSERT INTO groups (id, name, join_code, admin_pin_hash, admin_pin_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, name, code, hash, salt, Date.now()).run()
  const access = await getAccess(event)
  await saveAccess(event, { ...access, adminGroupIds: [...access.adminGroupIds, id] })
  return { joinCode: code }
})
