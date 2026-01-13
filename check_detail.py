import requests
import json

# First search for items
search_url = "https://rano.onrender.com/api/vending/v2/search"
params = {"item": "천공", "page": 1, "size": 5}

response = requests.get(search_url, params=params)
data = response.json()

items = data.get('data', [])
print(f"Found {len(items)} items")

# Find one with ssi and map_id
for i, item in enumerate(items[:5]):
    ssi = item.get('ssi')
    map_id = item.get('map_id')
    name = item.get('item_name', 'Unknown')
    print(f"{i+1}. {name[:30]} - ssi: {ssi}, map_id: {map_id}")
    
    if ssi and map_id:
        # Get detail
        detail_url = "https://rano.onrender.com/api/vending/detail"
        detail_params = {
            "server": "baphomet",
            "ssi": ssi,
            "mapID": str(map_id)
        }
        detail_resp = requests.get(detail_url, params=detail_params)
        detail = detail_resp.json()
        cards = detail.get('cards_equipped', [])
        if cards:
            print(f"   Cards: {cards}")
            break
