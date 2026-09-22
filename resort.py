# Re-sort stickers.json alphabetically and renumber public/stickers/*.webp to match.
# Only edit `name` in stickers.json by hand, then run: python3 resort.py
import json, os, shutil
s = json.load(open('stickers.json'))
assert len(s) == 50 and len({x['no'] for x in s}) == 50, 'numbers must be unique: images are matched by the current no'
s.sort(key=lambda x: x['name'].casefold())
tmp = 'public/stickers/_tmp'; os.makedirs(tmp, exist_ok=True)
for new, x in enumerate(s, 1):
    shutil.move(f'public/stickers/{x["no"]}.webp', f'{tmp}/{new}.webp'); x['no'] = new
for f in os.listdir(tmp): shutil.move(f'{tmp}/{f}', f'public/stickers/{f}')
os.rmdir(tmp)
open('stickers.json', 'w').write('[' + ',\n'.join(json.dumps(x, ensure_ascii=False) for x in s) + ']\n')
for x in s: print(x['no'], x['name'])
