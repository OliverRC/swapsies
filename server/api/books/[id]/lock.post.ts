export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const access = await getAccess(event)
  await saveAccess(event, { ...access, bookIds: access.bookIds.filter(b => b !== id) })
  return { ok: true }
})
