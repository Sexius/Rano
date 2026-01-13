import requests
import json

url = "https://rano.onrender.com/api/vending/v2/search"
params = {"item": "천공", "page": 1, "size": 2}

response = requests.get(url, params=params)
data = response.json()

with open('api_response.txt', 'w', encoding='utf-8') as f:
    items = data.get('data', [])[:1]
    for it in items:
        f.write("All keys: " + str(list(it.keys())) + "\n\n")
        for k, v in it.items():
            f.write(f"  {k}: {v}\n")

print("Done! Check api_response.txt")
