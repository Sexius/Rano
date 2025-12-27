import requests

def check():
    url = "https://rano.onrender.com/api/items/search?keyword=진노"
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        print(f"Checking specific Jinno Crowns (400494-400500):")
        for i, item in enumerate(data):
            # API returns id as integer
            item_id = item.get('id')
            if item_id and 400490 <= item_id <= 400510:
                desc = item.get('description')
                status = "✅ OK" if desc and len(desc) > 10 else "❌ MISSING"
                print(f"ID: {item_id:<7} Name: {item.get('nameKr'):<30} Description: {status}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
