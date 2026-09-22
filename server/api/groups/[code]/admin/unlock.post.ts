export default defineEventHandler(async (event) => {
  const g = await groupByCode(event)
  const body = await readBody(event)
  const superKey = useRuntimeConfig(event).superAdminKey
  if (!(superKey && body?.superKey === superKey))
    await verifyPin(event, 'groups', g, g.admin_pin_hash, g.admin_pin_salt, cleanPin(body?.adminPin))
  const access = await getAccess(event)
  await saveAccess(event, { ...access, adminGroupIds: [...new Set([...access.adminGroupIds, g.id])] })
  return { ok: true }
})
