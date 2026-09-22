export default defineEventHandler(async (event) => {
  const b = await bookById(event)
  await verifyPin(event, 'books', b, b.pin_hash, b.pin_salt, cleanPin((await readBody(event))?.pin))
  const access = await getAccess(event)
  await saveAccess(event, { ...access, bookIds: [...new Set([...access.bookIds, b.id])] })
  return { ok: true }
})
