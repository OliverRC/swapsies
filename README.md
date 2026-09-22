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
