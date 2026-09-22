#!/bin/sh
# Full dump of production D1 to backups/<UTC time>.sql, plus the Time Travel bookmark
# for a server-side restore, and the stickers.json that gives those numbers their names.
# Run automatically by `pnpm reorder`, or by hand any time.
set -e
cd "$(dirname "$0")"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
pnpm wrangler d1 export swapsies --remote --output="backups/$stamp.sql" >/dev/null
pnpm wrangler d1 time-travel info swapsies 2>/dev/null | grep -o "bookmark=[0-9a-f-]*" > "backups/$stamp.bookmark"
cp "${STICKERS:-stickers.json}" "backups/$stamp.stickers.json"
echo "backed up to backups/$stamp.sql ($(grep -c 'INSERT INTO "holdings"' "backups/$stamp.sql") holdings)"
