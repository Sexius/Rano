import requests

def check():
    url = "https://rano.onrender.com/api/items/search?keyword=천공"
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        print(f"Results for '천공': {len(data)} items found")
        for i, item in enumerate(data):
            desc = item.get('description')
            status = "✅ OK" if desc and len(desc) > 10 else "❌ MISSING"
            print(f"[{i:02d}] ID: {item.get('id'):<7} Name: {item.get('nameKr'):<20} Description: {status}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
