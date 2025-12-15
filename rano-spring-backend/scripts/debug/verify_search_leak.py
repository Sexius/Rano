import requests
import json
import time

BASE_URL = "http://localhost:8080/api/vending"

def search(term):
    print(f"\nSearching for: {term}")
    response = requests.get(BASE_URL, params={'item': term, 'server': 'baphomet', 'size': 20})
    if response.status_code != 200:
        print("Error:", response.status_code)
        return []
    
    data = response.json()
    items = data.get('data', [])
    print(f"Found {len(items)} items for '{term}'")
    for item in items[:5]:
        print(f" - {item['item_name']} ({item['price']}z)")
    return items

def main():
    # 1. Search for Jellopy (Previous search)
    print("--- Step 1: Search Jellopy ---")
    items1 = search("젤로피")
    
    time.sleep(2)
    
    # 2. Search for Cheong-gong (Current search)
    print("\n--- Step 2: Search Cheong-gong ---")
    items2 = search("천공")
    
    # Check for leak
    with open('leak_result.txt', 'w', encoding='utf-8') as f:
        leaked = [item for item in items2 if "젤로피" in item['item_name']]
        debug_items = [item for item in items2 if "DEBUG_ITEM_CHECK" in item['item_name']]
        
        if leaked:
            msg = f"[FAIL] Found {len(leaked)} Jellopy items in Cheong-gong search!"
            print(msg)
            f.write(msg + "\n")
        elif debug_items:
            msg = f"[FAIL] Found DEBUG_ITEM_CHECK! Backend is still running debug override."
            print(msg)
            f.write(msg + "\n")
        elif len(items2) == 0:
             msg = f"[FAIL] No items found for Cheong-gong! Scraping might be broken."
             print(msg)
             f.write(msg + "\n")
        else:
            msg = "[PASS] No Jellopy items found in Cheong-gong search, and real data returned."
            print(msg)
            f.write(msg + "\n")

if __name__ == "__main__":
    main()
