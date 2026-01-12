import json
with open('test_ifrit.json', 'r', encoding='utf-8') as f:
    r = json.load(f)
items = r.get('data', [])
servers = set(i.get('server_name', '') for i in items[:10])
print(f"total={r.get('total')} servers={servers}")
