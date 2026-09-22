# Swapsies

Class sticker swapping. Brief: `swapsies-brief.md`.

```sh
pnpm install
pnpm db:local   # create the local D1 tables (safe to re-run)
pnpm dev        # http://localhost:3000
pnpm test       # matching logic
```

`.env` needs `NUXT_SESSION_PASSWORD` (32+ chars) and `NUXT_SUPER_ADMIN_KEY`.

Deploy: `wrangler d1 create swapsies`, paste the id into `wrangler.toml`, `pnpm db:remote`,
set both secrets with `wrangler secret put`, then `pnpm deploy`.

TODO: `stickers.json` numbering follows the order Oliver typed from the promo banner, not necessarily the book. Entries ending in "(?)" are unidentified, and `golden` is a placeholder on the bike. Images in `public/stickers` are cropped from `6aabae3763253f213e3f6c13.webp`.

## Reordering stickers
Books store counts **by sticker number**, so renumbering without migrating scrambles every parent's book.
1. Edit only `name` values in `stickers.json` (never `no`).
2. `python3 resort.py` sorts alphabetically, renumbers the images, and appends the D1 migration to `migrate.sql`.
3. `pnpm reorder` builds, **backs up production to `backups/`**, applies `migrate.sql` to production, deploys, then applies it locally. Run it straight after step 2: edits made between the migration and the deploy (a few seconds) would land on old numbers.

## Backups
`pnpm backup` dumps production D1 to `backups/<time>.sql` and saves the D1 Time Travel bookmark and the matching
`stickers.json` next to it (a reorder backs up the *pre-sort* list, the one the dumped numbers were written under).
Restore either with `wrangler d1 execute swapsies --remote --file=backups/<time>.sql` (after clearing the tables)
or server-side with `wrangler d1 time-travel restore swapsies --bookmark=<from the .bookmark file>` (30-day window).
