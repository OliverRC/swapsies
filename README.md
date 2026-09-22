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
3. `pnpm reorder` builds, applies `migrate.sql` to production, deploys, then applies it locally. Run it straight after step 2: edits made between the migration and the deploy (a few seconds) would land on old numbers.
