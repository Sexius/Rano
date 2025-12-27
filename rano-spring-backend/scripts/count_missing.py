import requests

def count_missing():
    # We can't easily count ALL items via search API without a generic keyword
    # But we can try common prefixes or check a wide range if the API supports it
    # For now, let's just search for '선' to see how many are missing in that group
    url = "https://rano.onrender.com/api/items/search?keyword=선"
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        missing = [item for item in data if not item.get('description')]
        print(f"Results for '선': {len(data)} items")
        print(f"Missing descriptions in this group: {len(missing)}")
        
        # Show some of them
        for item in missing[:10]:
            print(f"  - [{item.get('id')}] {item.get('nameKr')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    count_missing()
