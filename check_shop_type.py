import json
with open('shop_test.json', 'r', encoding='utf-8') as f:
    r = json.load(f)
items = r.get('data', [])[:10]
for i, item in enumerate(items):
    print(f"{i+1}. {item.get('item_name','?')[:20]} | shop_type={item.get('shop_type', 'MISSING')}")
