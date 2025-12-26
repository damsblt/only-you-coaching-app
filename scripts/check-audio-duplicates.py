#!/usr/bin/env python3
import sys
import json

data = json.load(sys.stdin)
titles = {}
for a in data:
    t = a.get('title', '').strip().lower().replace('  ', ' ').replace('   ', ' ')
    if t not in titles:
        titles[t] = []
    titles[t].append(a)

dups = {k: v for k, v in titles.items() if len(v) > 1}

print(f'Total audios: {len(data)}')
print(f'Doublons trouvés: {len(dups)}')
print()

for k, v in sorted(dups.items())[:20]:
    print(f'  "{k}": {len(v)} copies')
    for aa in v:
        has_thumb = bool(aa.get('thumbnail')) and 'unsplash.com' not in str(aa.get('thumbnail', ''))
        print(f'    - ID: {aa["id"][:8]}... | thumbnail: {has_thumb} | s3key: {aa.get("s3key", "")[:50]}')



