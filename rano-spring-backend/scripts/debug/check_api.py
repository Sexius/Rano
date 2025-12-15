import requests

api_key = "403eb0a63c53841742499eeba421b8b6"
item_id = 401115
url = f"https://www.divine-pride.net/api/database/Item/{item_id}?apiKey={api_key}"

print(f"Testing URL: {url}")

try:
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
