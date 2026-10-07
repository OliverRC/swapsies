import type { H3Event } from 'h3'

export const db = (event: H3Event) => event.context.cloudflare.env.DB
export const fail = (statusCode: number, message: string) => createError({ statusCode, message })

export const STICKER_TOTAL = 50
const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60_000

// --- validation -----------------------------------------------------------
export function cleanName(v: unknown, what: string) {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
  if (!s || s.length > 40) throw fail(400, `${what} must be 1–40 characters`)
  return s
}
export function cleanPin(v: unknown) {
  if (typeof v !== 'string' || !/^\d{4}$/.test(v)) throw fail(400, 'PIN must be exactly 4 digits')
  return v
}
export function cleanNos(v: unknown) {
  if (!Array.isArray(v) || v.some(n => !Number.isInteger(n) || n < 1 || n > STICKER_TOTAL)) throw fail(400, 'Bad sticker list')
  return [...new Set(v as number[])].sort((a, b) => a - b)
}

// --- ids & PINs -----------------------------------------------------------
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b as ArrayBuffer)].map(x => x.toString(16).padStart(2, '0')).join('')

export function joinCode() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789' // no lookalikes
  return [...crypto.getRandomValues(new Uint8Array(7))].map(b => abc[b % abc.length]).join('')
}

export async function hashPin(pin: string, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits'])
  // 100k is the Workers WebCrypto ceiling for PBKDF2
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 }, key, 256)
  return { hash: hex(bits), salt }
}

/** Verify a PIN with the 5-strikes / 15-minute lock. Throws on lock or mismatch. */
export async function verifyPin(event: H3Event, table: 'books' | 'groups', row: { id: string, locked_until: number | null }, hash: string, salt: string, pin: string) {
  const now = Date.now()
  if (row.locked_until && row.locked_until > now)
    throw fail(429, `Too many wrong tries. Try again in ${Math.ceil((row.locked_until - now) / 60_000)} min.`)
  if ((await hashPin(pin, salt)).hash === hash) {
    await db(event).prepare(`UPDATE ${table} SET failed_attempts = 0, locked_until = NULL WHERE id = ?`).bind(row.id).run()
    return
  }
  await db(event).prepare(`UPDATE ${table} SET
      locked_until = CASE WHEN failed_attempts + 1 >= ${MAX_ATTEMPTS} THEN ? ELSE NULL END,
      failed_attempts = CASE WHEN failed_attempts + 1 >= ${MAX_ATTEMPTS} THEN 0 ELSE failed_attempts + 1 END
    WHERE id = ?`).bind(now + LOCK_MS, row.id).run()
  throw fail(401, 'Wrong PIN')
}

// --- session --------------------------------------------------------------
export async function getAccess(event: H3Event) {
  const { user } = await getUserSession(event)
  return { bookIds: user?.bookIds ?? [], adminGroupIds: user?.adminGroupIds ?? [] }
}
// replace, not set: setUserSession deep-merges and would concatenate the arrays
export const saveAccess = (event: H3Event, user: { bookIds: string[], adminGroupIds: string[] }) =>
  replaceUserSession(event, { user }) // 90-day maxAge: nuxt.config runtimeConfig.session

export async function requireBook(event: H3Event, bookId: string) {
  const { user } = await requireUserSession(event)
  if (!user.bookIds?.includes(bookId)) throw fail(403, 'Unlock this book first')
}
export async function requireAdmin(event: H3Event, groupId: string) {
  const { user } = await requireUserSession(event)
  if (!user.adminGroupIds?.includes(groupId)) throw fail(403, 'Group admin only')
}

// --- lookups --------------------------------------------------------------
export async function groupByCode(event: H3Event, code = getRouterParam(event, 'code')) {
  const g = await db(event).prepare('SELECT * FROM groups WHERE join_code = ?').bind(code).first()
  if (!g) throw fail(404, 'Group not found')
  return g as any
}
export async function bookById(event: H3Event, id = getRouterParam(event, 'id')) {
  const b = await db(event).prepare('SELECT * FROM books WHERE id = ?').bind(id).first()
  if (!b) throw fail(404, 'Sticker book not found')
  return b as any
}
export async function holdingsOf(event: H3Event, bookId: string) {
  const { results } = await db(event).prepare('SELECT sticker_no, count FROM holdings WHERE book_id = ? AND count > 0').bind(bookId).all()
  return Object.fromEntries(results.map((r: any) => [r.sticker_no, r.count])) as Record<number, number>
}
/** Each book's stickers tied up in the group's trades with this status: bookId -> sticker no -> count. */
export async function tiedUp(event: H3Event, groupId: string, status: 'offered' | 'accepted', exceptTrade = '') {
  const { results } = await db(event).prepare('SELECT from_book, to_book, give_json, get_json FROM trades WHERE group_id = ? AND status = ? AND id != ?')
    .bind(groupId, status, exceptTrade).all()
  return tally(results as any)
}
/** First sticker in `nos` the book has no free spare of, or undefined. Spares promised in other accepted trades aren't free. */
// ponytail: check-then-write, two accepts in the same instant can both pass; gate the accept UPDATE in SQL if it ever happens
export async function missingSpare(event: H3Event, book: { id: string, group_id: string }, nos: number[], exceptTrade?: string) {
  const promised = (await tiedUp(event, book.group_id, 'accepted', exceptTrade))[book.id]
  const h = unpromised(await holdingsOf(event, book.id), promised)
  return nos.find(no => (h[no] ?? 0) < 2)
}
