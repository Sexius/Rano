import json
with open('response4.json', 'r', encoding='utf-8') as f:
    r = json.load(f)
print(f"total={r.get('total')} totalPages={r.get('totalPages')} page={r.get('page')} dataLen={len(r.get('data',[]))}")
