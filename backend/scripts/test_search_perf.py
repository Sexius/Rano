#!/usr/bin/env python3
"""
한글 검색어로 실제 검색 시간 측정
"""
import time
import requests
from datetime import datetime

BACKEND_URL = "https://rano.onrender.com"

def test_search(keyword, desc):
    """검색 테스트"""
    print(f"\n  Testing: {desc} (keyword: {keyword})")
    
    try:
        start = time.time()
        resp = requests.get(
            f"{BACKEND_URL}/api/vending/v2/search",
            params={"item": keyword, "server": "baphomet", "page": 1, "size": 10},
            timeout=60
        )
        elapsed = time.time() - start
        
        if resp.ok:
            data = resp.json()
            total = data.get("total", 0)
            items = len(data.get("data", []))
            stale = data.get("stale", False)
            reason = data.get("reason", "")
            print(f"    -> {elapsed:.2f}s | total: {total} | items: {items} | stale: {stale} | reason: {reason}")
        else:
            print(f"    -> {elapsed:.2f}s | ERROR: {resp.status_code}")
            
        return elapsed
    except Exception as e:
        print(f"    -> ERROR: {e}")
        return 999

def main():
    print("="*60)
    print(" Real Search Performance Test")
    print(f" Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # 한글 검색어 테스트
    keywords = [
        ("천공", "Chungong (popular)"),
        ("카드", "Card"),
        ("엑스칼리버", "Excalibur"),
        ("포링", "Poring"),
        ("천공", "Chungong (repeat - should be cached)"),
    ]
    
    results = []
    for kw, desc in keywords:
        elapsed = test_search(kw, desc)
        results.append((desc, elapsed))
        time.sleep(0.5)
    
    print("\n" + "="*60)
    print(" Summary")
    print("="*60)
    for desc, elapsed in results:
        status = "[OK]" if elapsed < 1 else "[SLOW]" if elapsed < 3 else "[VERY SLOW]"
        print(f"  {status} {desc}: {elapsed:.2f}s")
    
    # 첫 검색 vs 재검색 비교
    if len(results) >= 5:
        first = results[0][1]
        repeat = results[4][1]
        print(f"\n  First search: {first:.2f}s")
        print(f"  Repeat search: {repeat:.2f}s")
        if repeat < first * 0.5:
            print(f"  [OK] Cache is working ({repeat:.2f}s < {first:.2f}s)")
        else:
            print(f"  [WARN] Cache may not be working properly")

if __name__ == "__main__":
    main()
