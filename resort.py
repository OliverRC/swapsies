# Re-sort stickers.json alphabetically, renumber public/stickers/*.webp to match, and
# append the SQL that moves everyone's holdings and trades to the new numbers into
# migrate.sql. Deploy with `pnpm reorder` (applies migrate.sql to D1, then deploys).
# Only edit `name` in stickers.json by hand, never `no`. Safe to run repeatedly before
# deploying: each run's mapping is appended, so they replay in order.
import json, os, shutil
s = json.load(open('stickers.json'))
assert len(s) == 50 and len({x['no'] for x in s}) == 50, 'numbers must be unique: images and DB are keyed by the current no'
s.sort(key=lambda x: x['name'].casefold())
m = {x['no']: new for new, x in enumerate(s, 1)}
tmp = 'public/stickers/_tmp'; os.makedirs(tmp, exist_ok=True)
for x in s:
    shutil.move(f'public/stickers/{x["no"]}.webp', f'{tmp}/{m[x["no"]]}.webp'); x['no'] = m[x['no']]
for f in os.listdir(tmp): shutil.move(f'{tmp}/{f}', f'public/stickers/{f}')
os.rmdir(tmp)
open('stickers.json', 'w').write('[' + ',\n'.join(json.dumps(x, ensure_ascii=False) for x in s) + ']\n')

moved = {o: n for o, n in m.items() if o != n}
if moved:
    case = ' '.join(f'WHEN {o} THEN {n}' for o, n in moved.items())
    remap = lambda col: f"(SELECT json_group_array(CASE value {case} ELSE value END) FROM json_each({col}))"
    with open('migrate.sql', 'a') as f:
        f.write(f"""-- {len(moved)} stickers renumbered
UPDATE holdings SET sticker_no = sticker_no + 100;
UPDATE holdings SET sticker_no = CASE sticker_no - 100 {case} ELSE sticker_no - 100 END;
UPDATE trades SET give_json = {remap('give_json')}, get_json = {remap('get_json')};
""")
    print(f'{len(moved)} stickers moved; migration appended to migrate.sql. Deploy with: pnpm reorder')
else:
    print('order unchanged')
for x in s: print(x['no'], x['name'])
