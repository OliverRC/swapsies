# Swapsies: Build Brief (v1, bare bones)

> A tiny, cute, mobile-first web app where a class's kids trade duplicate
> Checkers "Stickables" stickers. It's a one-season project: keep it simple and
> don't over-engineer.

## 1. Context
- Checkers Stickables promo: **50 stickers** (SA brands such as Oros, Bar-One,
  Ricoffy, Black Cat and OMO, plus a mini Sixty60 bike). Runs **21 Sept – 8 Nov 2026**.
- Rare **golden** stickers exist (QR code enters a R1m draw).
- Checkers hosts official "Swop Days" on 3, 17 and 31 Oct.
- The users are **parents** of 6–7 year olds. Adults run it, not kids. The tone
  stays cute and happy, but the UI is built for adults to use quickly.
- Not affiliated with Checkers. No Checkers or Sixty60 logos or wordmarks.

## 2. Principles
- **Minimal effort onboarding**: no accounts, no emails, no phone numbers. Just a
  child's name and a 4-digit PIN per book.
- **No sensitive data**: a child's first name (unverified, free text) is the only
  personal data.
- **No integrations**: no WhatsApp API, no auth provider, no analytics.
- **Light, happy, cute**: big tap targets, rounded shapes, playful motion.

## 3. Core concepts
| Concept | What it is |
|---|---|
| **Group** | A class, e.g. "Grade 1 Fatima 2026". It has a name and a join code in the URL. |
| **Book** | One child's sticker book, e.g. "Blake's stickers". It belongs to one group. |
| **Holding** | How many of sticker #N a book has (0, 1, 2+). |
| **Trade** | A Pokémon-style offer: "I give #12, #30 ↔ you give #7, #41". |

No parent or user entity. A book is unlocked by its PIN (see Identity).

## 4. Flows
1. **Create group**: enter a name → get the link `swapsies.xyz/g/{joinCode}` → a
   Share button (Web Share API / copy link). The parent posts it in the class chat
   themselves.
2. **Join group**: open the link → see the group name and the list of books →
   "Add my sticker book" → type the child's name + choose a 4-digit PIN → done.
   The book is unlocked on this device from then on.
3. **My Book**: a 50-tile grid. Tap `+` / `−` on a tile to set its count.
   - 0 = faded/greyed ("need")
   - 1 = full colour ("got")
   - 2+ = full colour with a bouncy badge "+1", "+2" ("swaps")
   - Golden stickers get a sparkle/shimmer.
   - Progress bar: "37 / 50". Confetti at 50.
4. **Friends (matches)**: the other books in the group, sorted by best trade:
   - `theyCanGive = their swaps ∩ my needs`
   - `iCanGive = my swaps ∩ their needs`
   - sort by `min(theyCanGive, iCanGive)` desc, then total desc
   - "Perfect match!" badge when both sides are > 0
5. **Trade (Pokémon-style)**: open a friend → a two-panel trade window (mine |
   theirs), pre-filled with the best fair swap, which you can adjust → "Send
   offer".
   - The other device sees the offer in the "Trades" inbox → Accept / No thanks.
   - Accepted = agreed. The stickers still have to change hands physically at school.
   - Either side taps **"Swapped!"** → both books' counts update → swap animation
     and confetti.
   - States: `offered → accepted → done`, or `declined` / `cancelled`.
6. **Class board** (nice to have): per sticker, how many kids need it vs. how many
   swaps exist. Highlights the rare ones.

## 5. Identity: book PIN + remembered session
- Anyone with the **group link** can **view** every book in the group.
- Creating a book = child's name + a **4-digit PIN** chosen by the parent.
- **Unlocking a book**: tap the book in the group list → enter its PIN → the
  book ID is added to a long-lived signed session cookie (~90 days, lasts the
  whole promo). One device can unlock several books (siblings), and co-parents
  simply share the PIN.
- Use `nuxt-auth-utils` for the sealed cookie session (`setUserSession` /
  `requireUserSession`). The session holds `{ bookIds: string[], adminGroupIds: string[] }`.
  No session table.
- **PIN storage**: PBKDF2 (WebCrypto) with a per-book salt. Never store the plain PIN.
- **Brute-force guard**: 5 wrong attempts → that book is locked for 15 minutes
  (`failed_attempts`, `locked_until` on the book row).
- **Lost PIN**: the parent messages the group admin → the admin taps "Reset PIN"
  on the book and types a new PIN to pass on.
- **Group admin**: the creator sets an admin PIN when creating the group.
  `/g/{code}/admin` + admin PIN unlocks: rename group, reset a book's PIN,
  remove a book.
- **Super-admin (Oliver)**: an env secret `SUPER_ADMIN_KEY` unlocks admin for any
  group. This is the fallback if a group admin loses their own PIN.
- "Lock this book on this device" button (removes it from the session).

## 6. Stack
- **Nuxt 3** deployed to **Cloudflare** (Workers / Pages, `cloudflare` Nitro
  preset). NuxtHub is optional if it makes D1 wiring easier.
- **D1** for storage. Nothing else: no KV, no R2 unless sticker images need it.
- Tailwind (or plain CSS), and a Google Font such as *Fredoka* or *Baloo 2*.
- Freshness: refetch on focus and poll the trades inbox every ~20s while open.
  No websockets.

## 7. Data
Stickers are **static JSON in the repo**, not a table:
```json
[{ "no": 1, "name": "Oros", "emoji": "🍊", "color": "#F7931E", "golden": false }, …]
```

D1 schema:
```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, join_code TEXT UNIQUE NOT NULL,
  admin_pin_hash TEXT NOT NULL, admin_pin_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE books (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id),
  child_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE holdings (
  book_id TEXT NOT NULL REFERENCES books(id), sticker_no INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (book_id, sticker_no)
);
CREATE TABLE trades (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL,
  from_book TEXT NOT NULL, to_book TEXT NOT NULL,
  give_json TEXT NOT NULL,   -- sticker numbers from_book gives
  get_json TEXT NOT NULL,    -- sticker numbers to_book gives
  status TEXT NOT NULL,      -- offered|accepted|done|declined|cancelled
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
```
Matching is computed on the fly in the API (a group is ~30 books × 50 stickers,
so it's trivial).

"Swapped!" runs in one D1 batch: decrement the giver's counts and increment the
receiver's counts for both sides. First validate that the counts are still
available, and fail gracefully if not ("Blake doesn't have a spare #12 any more").

## 8. API (Nitro server routes)
```
POST /api/groups                      {name, adminPin} → {joinCode} (+ admin in session)
GET  /api/groups/:code                → group + books summary (name, progress)
POST /api/groups/:code/books          {childName, pin} → {bookId} (+ unlocked in session)
POST /api/books/:id/unlock            {pin} → adds bookId to session (rate-limited)
POST /api/books/:id/lock              → removes bookId from session
POST /api/groups/:code/admin/unlock   {adminPin | superKey} → admin in session
POST /api/admin/books/:id/reset-pin   [group admin] {newPin}
PATCH /api/admin/groups/:code         [group admin] {name}
DELETE /api/admin/books/:id           [group admin]
GET  /api/books/:id                   → holdings
PUT  /api/books/:id/holdings          [auth] {stickerNo, count}
GET  /api/books/:id/matches           → ranked friends with give/get lists
GET  /api/books/:id/trades            [auth] → inbox + sent
POST /api/trades                      [auth from_book] {toBook, give[], get[]}
POST /api/trades/:id/(accept|decline|cancel|done)   [auth relevant side]
```
[auth] = the book ID is in the session's `bookIds` (via `requireUserSession`). Sessions are cookie-only; there are no bearer tokens.

## 9. Look & feel
- Colour palette taken from the three sticker book colours: **teal, orange, pink**,
  on a warm off-white background.
- The Sixty60 nod stays playful, not branded: e.g. a little delivery-scooter
  animation carrying stickers across on "Swapped!". Don't use their logo, name
  styling or exact brand assets.
- Pokémon-trade feel: two-panel trade window, cards that flip and slide across,
  a "Perfect match!" badge, shiny effect on golden stickers, confetti on
  milestones (10, 25, 50).
- Tiles: number + name + colour chip, dense enough that all 50 fit on one phone
  screen with little scrolling. **Speed of entry matters most**: parents will be
  sorting a pile of stickers, so tapping a tile adds 1 and a small `−` removes 1.

## 10. Sticker list: TODO
- No definitive public list with images found yet (the promo launched 21 Sept 2026).
- Source of truth: **the physical sticker book**. Photograph its pages and
  transcribe the numbers and names into `stickers.json`.
- Images: default to emoji + colour + number (no brand artwork). Real product
  images are out of scope for v1.

## 11. Out of scope
Accounts, email/SMS, WhatsApp integration, push notifications, multi-school admin,
analytics, i18n, native apps.
