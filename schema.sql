CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, join_code TEXT UNIQUE NOT NULL,
  admin_pin_hash TEXT NOT NULL, admin_pin_salt TEXT NOT NULL,
  -- not in the brief: same brute-force guard as books, a 4-digit admin PIN needs it more
  failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id),
  child_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS books_group ON books(group_id);
CREATE TABLE IF NOT EXISTS holdings (
  book_id TEXT NOT NULL REFERENCES books(id), sticker_no INTEGER NOT NULL,
  -- CHECK makes the "Swapped!" batch roll back if a count would go negative
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0), PRIMARY KEY (book_id, sticker_no)
);
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL,
  from_book TEXT NOT NULL, to_book TEXT NOT NULL,
  give_json TEXT NOT NULL,   -- sticker numbers from_book gives
  get_json TEXT NOT NULL,    -- sticker numbers to_book gives
  status TEXT NOT NULL,      -- offered|accepted|done|declined|cancelled
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS trades_from ON trades(from_book);
CREATE INDEX IF NOT EXISTS trades_to ON trades(to_book);
