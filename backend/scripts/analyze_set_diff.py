"""
Set Difference Analysis Script
Compares source HTML rows vs our API response rows to identify missing/extra items.
"""

import requests
from bs4 import BeautifulSoup
import urllib.parse
import json

# Configuration
SOURCE_URL = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
OUR_API_URL = "https://rano.onrender.com/api/vending"
SEARCH_TERM = "천공"
SERVER = "baphomet"
SVR_ID = "1"  # 1 = Baphomet, 729 = Ifrit

def make_key(server_name, item_id, shop_name, price, item_name):
    """Create unique key for row identification."""
    return f"{server_name}|{item_id}|{shop_name}|{price}|{item_name[:30]}"

def crawl_source_page(page):
    """Crawl a single page from source site."""
    params = {
        "svrID": SVR_ID,
        "itemFullName": SEARCH_TERM,
        "itemOrder": "",
        "inclusion": "",  # Word inclusion parameter
        "curpage": str(page)
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://ro.gnjoy.com/",
        "Accept-Language": "ko-KR,ko;q=0.9"
    }
    
    full_url = SOURCE_URL + "?" + urllib.parse.urlencode(params)
    print(f"[SOURCE] Crawling: {full_url}")
    
    response = requests.get(SOURCE_URL, params=params, headers=headers, timeout=15)
    response.encoding = 'utf-8'
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Get total from source
    total_elem = soup.select_one("#searchResult strong")
    total = 0
    if total_elem:
        total_text = ''.join(filter(str.isdigit, total_elem.text))
        if total_text:
            total = int(total_text)
    
    # Parse rows
    rows = []
    table = soup.select_one("table.listTypeOfDefault.dealList")
    if table:
        for idx, tr in enumerate(table.select("tr")):
            if idx == 0:  # Skip header
                continue
            tds = tr.select("td")
            if len(tds) >= 5:
                server_name = tds[0].get_text(strip=True)
                
                # Skip header rows
                if "상인명" in server_name or "아이템명" in server_name:
                    continue
                
                item_td = tds[1]
                img = item_td.select_one("img")
                item_name = img.get("alt", "") if img else item_td.get_text(strip=True)
                
                # Extract item ID from image src
                item_id = 0
                if img and img.get("src"):
                    src = img.get("src")
                    filename = src.split("/")[-1]
                    id_str = filename.split(".")[0]
                    if id_str.isdigit():
                        item_id = int(id_str)
                
                quantity = ''.join(filter(str.isdigit, tds[2].get_text(strip=True))) or "1"
                price_text = ''.join(filter(str.isdigit, tds[3].get_text(strip=True))) or "0"
                shop_name = tds[4].get_text(strip=True)
                
                key = make_key(server_name, item_id, shop_name, price_text, item_name)
                rows.append({
                    "key": key,
                    "server": server_name,
                    "item_id": item_id,
                    "item_name": item_name,
                    "price": price_text,
                    "shop": shop_name
                })
    
    return total, rows

def fetch_our_api(page):
    """Fetch a single page from our API."""
    params = {
        "item": SEARCH_TERM,
        "server": SERVER,
        "page": page,
        "size": 20
    }
    
    full_url = OUR_API_URL + "?" + urllib.parse.urlencode(params)
    print(f"[OUR API] Fetching: {full_url}")
    
    response = requests.get(OUR_API_URL, params=params, timeout=15)
    data = response.json()
    
    total = data.get("total", 0)
    rows = []
    for item in data.get("data", []):
        key = make_key(
            item.get("server_name", ""),
            item.get("id", 0),
            item.get("vendor_name", ""),
            str(item.get("price", 0)),
            item.get("item_name", "")
        )
        rows.append({
            "key": key,
            "server": item.get("server_name"),
            "item_id": item.get("id"),
            "item_name": item.get("item_name"),
            "price": str(item.get("price")),
            "shop": item.get("vendor_name")
        })
    
    return total, rows

def main():
    print("=" * 60)
    print("SET DIFFERENCE ANALYSIS: SOURCE vs OUR API")
    print("=" * 60)
    
    # 1. First, get totals and crawl URL info
    source_total, source_page1 = crawl_source_page(1)
    our_total, our_page1 = fetch_our_api(1)
    
    print(f"\n[RESULT] Source Total: {source_total}")
    print(f"[RESULT] Our API Total: {our_total}")
    print(f"[RESULT] Difference: {our_total - source_total}")
    
    # 2. Crawl all pages from source (up to 5 pages for analysis)
    max_pages = min(5, (source_total // 10) + 1)
    all_source_rows = []
    all_our_rows = []
    
    print(f"\n[CRAWL] Fetching {max_pages} pages from both sources...")
    
    for p in range(1, max_pages + 1):
        _, s_rows = crawl_source_page(p)
        _, o_rows = fetch_our_api(p)
        all_source_rows.extend(s_rows)
        all_our_rows.extend(o_rows)
    
    print(f"\n[COUNT] Source rows collected: {len(all_source_rows)}")
    print(f"[COUNT] Our API rows collected: {len(all_our_rows)}")
    
    # 3. Create key sets
    source_keys = {r["key"]: r for r in all_source_rows}
    our_keys = {r["key"]: r for r in all_our_rows}
    
    # 4. Calculate differences
    missing_keys = set(source_keys.keys()) - set(our_keys.keys())  # In source, not in us
    extra_keys = set(our_keys.keys()) - set(source_keys.keys())    # In us, not in source
    
    print(f"\n[DIFF] Missing (in source, not in us): {len(missing_keys)}")
    print(f"[DIFF] Extra (in us, not in source): {len(extra_keys)}")
    
    # 5. Show missing items (top 20)
    print("\n" + "=" * 60)
    print("MISSING ITEMS (A - B):")
    print("=" * 60)
    for i, key in enumerate(list(missing_keys)[:20]):
        row = source_keys[key]
        print(f"{i+1}. {row['item_name'][:40]} | {row['shop']} | {row['price']}z")
    
    # 6. Show extra items (top 20)
    print("\n" + "=" * 60)
    print("EXTRA ITEMS (B - A):")
    print("=" * 60)
    for i, key in enumerate(list(extra_keys)[:20]):
        row = our_keys[key]
        print(f"{i+1}. {row['item_name'][:40]} | {row['shop']} | {row['price']}z")
    
    # 7. Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Source Total: {source_total}")
    print(f"Our Total: {our_total}")
    print(f"Missing from us: {len(missing_keys)}")
    print(f"Extra in us: {len(extra_keys)}")
    
    if len(missing_keys) == 0 and len(extra_keys) == 0:
        print("\nCONCLUSION: Perfect match - no data discrepancy")
    elif len(extra_keys) > 0:
        print("\nCONCLUSION: Extra items exist - possible cache/stale data issue")
    else:
        print("\nCONCLUSION: Missing items - possible filter/parsing bug")

if __name__ == "__main__":
    main()
