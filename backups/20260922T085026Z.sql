PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE groups (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, join_code TEXT UNIQUE NOT NULL,
  admin_pin_hash TEXT NOT NULL, admin_pin_salt TEXT NOT NULL,
  -- not in the brief: same brute-force guard as books, a 4-digit admin PIN needs it more
  failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER,
  created_at INTEGER NOT NULL
);
INSERT INTO "groups" ("id","name","join_code","admin_pin_hash","admin_pin_salt","failed_attempts","locked_until","created_at") VALUES('ecbeae08-ccf7-4738-b8c5-476d66525f66','Gr 1 Parents of Fatima','yppbqqh','bae2411177ad13939f6c0b39c45c033a51d0c1d3aaa8195850a6a931bd421ed3','7c268db71f2eccf96edfa391b1190693',0,NULL,1790027439007);
CREATE TABLE books (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id),
  child_name TEXT NOT NULL,
  pin_hash TEXT NOT NULL, pin_salt TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
INSERT INTO "books" ("id","group_id","child_name","pin_hash","pin_salt","failed_attempts","locked_until","created_at","updated_at") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9','ecbeae08-ccf7-4738-b8c5-476d66525f66','Blake','5c8fd344dc40616355f38bce3f7a9e3563aa5d2124e3c20453c4d5f86ba875d7','37b8c59e962e80e8901ae4558ccf1752',0,NULL,1790027470674,1790066419108);
INSERT INTO "books" ("id","group_id","child_name","pin_hash","pin_salt","failed_attempts","locked_until","created_at","updated_at") VALUES('fce18cfe-5225-43c8-980d-839dbef702cc','ecbeae08-ccf7-4738-b8c5-476d66525f66','Theofania','b31fd5eb278ceefd89605a33cc181c3861e185f349fd36123d30366d581181ff','09561b44275e5a97b7e26e6ece040495',0,NULL,1790027898901,1790027907600);
INSERT INTO "books" ("id","group_id","child_name","pin_hash","pin_salt","failed_attempts","locked_until","created_at","updated_at") VALUES('71680558-e447-4bc7-b8f9-f76695c02d81','ecbeae08-ccf7-4738-b8c5-476d66525f66','Birdy','bc545088e3b33ee9c2a3ecdc561ef3fd6e8626af02cb0dddc98b4ea34eb3ff93','c651fd357012cc0aac406d61d7ece463',0,NULL,1790048586737,1790066983880);
INSERT INTO "books" ("id","group_id","child_name","pin_hash","pin_salt","failed_attempts","locked_until","created_at","updated_at") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6','ecbeae08-ccf7-4738-b8c5-476d66525f66','Grace','9a5329bd16c000e2d65fe5ca40d8d03cf1af3345913f757c7a880c15fd334f22','9c54d1f2a2a32001a2964e93f01ccd9a',0,NULL,1790050598673,1790055026189);
INSERT INTO "books" ("id","group_id","child_name","pin_hash","pin_salt","failed_attempts","locked_until","created_at","updated_at") VALUES('725205a3-c388-4b7d-9955-e6700820f091','ecbeae08-ccf7-4738-b8c5-476d66525f66','Lacey','aed1993a3f488e5e35001d1ef2085089e51a91e7aeb31ad001ab41ca984fe1d3','ee39886190b793308bc6749c763e2e9d',0,NULL,1790053118709,1790053118709);
CREATE TABLE holdings (
  book_id TEXT NOT NULL REFERENCES books(id), sticker_no INTEGER NOT NULL,
  -- CHECK makes the "Swapped!" batch roll back if a count would go negative
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0), PRIMARY KEY (book_id, sticker_no)
);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('fce18cfe-5225-43c8-980d-839dbef702cc',32,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('71680558-e447-4bc7-b8f9-f76695c02d81',3,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',4,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',45,0);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',6,0);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',17,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',10,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',28,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',34,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('5c9cf36d-a1da-40ef-8148-d915ded7e1e6',44,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('71680558-e447-4bc7-b8f9-f76695c02d81',38,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('71680558-e447-4bc7-b8f9-f76695c02d81',40,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',41,0);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',39,0);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',34,0);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',2,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',40,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',16,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',23,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('730fd2c2-429c-4516-91ae-d2f29dd68fb9',30,1);
INSERT INTO "holdings" ("book_id","sticker_no","count") VALUES('71680558-e447-4bc7-b8f9-f76695c02d81',36,1);
CREATE TABLE trades (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL,
  from_book TEXT NOT NULL, to_book TEXT NOT NULL,
  give_json TEXT NOT NULL,   -- sticker numbers from_book gives
  get_json TEXT NOT NULL,    -- sticker numbers to_book gives
  status TEXT NOT NULL,      -- offered|accepted|done|declined|cancelled
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX books_group ON books(group_id);
CREATE INDEX trades_from ON trades(from_book);
CREATE INDEX trades_to ON trades(to_book);
