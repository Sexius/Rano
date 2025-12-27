import requests

def check():
    url = "https://rano.onrender.com/api/items/search?keyword=진노"
    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        print(f"Items found: {len(data)}")
        for i, item in enumerate(data[:15]):
            print(f"Index: {i}, ID: {item.get('id')}, Name: {item.get('nameKr')}")
            desc = item.get('description')
            print(f"Description: {'[NULL]' if desc is None else f'[Length: {len(desc)}]'}")
            if desc:
                print(f"Preview: {desc[:50]}...")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
