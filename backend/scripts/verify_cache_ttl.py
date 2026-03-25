"""
Cache TTL Verification Script
Tests cache behavior at t=0, t=5s, t=25s
"""

import requests
import time
import json

API_URL = "https://rano.onrender.com/api/vending"
PARAMS = {
    "item": "천공",
    "server": "baphomet",
    "page": 1,
    "size": 3
}

def fetch_and_report(label):
    """Fetch API and report key metrics."""
    start = time.time()
    response = requests.get(API_URL, params=PARAMS, timeout=30)
    elapsed = time.time() - start
    
    data = response.json()
    
    return {
        "label": label,
        "fetchedAt": data.get("fetchedAt", "N/A"),
        "cacheHit": data.get("cacheHit", "N/A"),
        "total": data.get("total", 0),
        "elapsed_ms": int(elapsed * 1000),
        "first_item": data.get("data", [{}])[0].get("item_name", "N/A") if data.get("data") else "N/A"
    }

def main():
    print("=" * 70)
    print("CACHE TTL VERIFICATION TEST")
    print("TTL = 20 seconds | Testing at t=0s, t=5s, t=25s")
    print("=" * 70)
    
    results = []
    
    # t=0s: Initial request (fresh fetch)
    print("\n[t=0s] Making initial request...")
    r1 = fetch_and_report("t=0s (Initial)")
    results.append(r1)
    print(f"  fetchedAt: {r1['fetchedAt']}")
    print(f"  total: {r1['total']}")
    print(f"  elapsed: {r1['elapsed_ms']}ms")
    
    # Wait 5 seconds
    print("\n[Waiting 5 seconds...]")
    time.sleep(5)
    
    # t=5s: Should be cache hit (within TTL)
    print("\n[t=5s] Making second request (should be cache hit)...")
    r2 = fetch_and_report("t=5s (Cache Hit Expected)")
    results.append(r2)
    print(f"  fetchedAt: {r2['fetchedAt']}")
    print(f"  total: {r2['total']}")
    print(f"  elapsed: {r2['elapsed_ms']}ms")
    
    # Check if fetchedAt is the same (cache hit indicator)
    if r1['fetchedAt'] == r2['fetchedAt']:
        print("  ✅ CACHE HIT CONFIRMED: Same fetchedAt as t=0s")
    else:
        print("  ⚠️ CACHE MISS: fetchedAt changed")
    
    # Wait 20 more seconds (total 25s from start)
    print("\n[Waiting 20 more seconds to exceed TTL...]")
    time.sleep(20)
    
    # t=25s: Should be cache miss (TTL expired)
    print("\n[t=25s] Making third request (should be fresh fetch)...")
    r3 = fetch_and_report("t=25s (Fresh Fetch Expected)")
    results.append(r3)
    print(f"  fetchedAt: {r3['fetchedAt']}")
    print(f"  total: {r3['total']}")
    print(f"  elapsed: {r3['elapsed_ms']}ms")
    
    # Check if fetchedAt changed (cache miss indicator)
    if r3['fetchedAt'] != r1['fetchedAt']:
        print("  ✅ TTL EXPIRATION CONFIRMED: fetchedAt changed (fresh fetch)")
    else:
        print("  ⚠️ POSSIBLE ISSUE: fetchedAt did not change after TTL")
    
    # Summary Table
    print("\n" + "=" * 70)
    print("SUMMARY TABLE")
    print("=" * 70)
    print(f"{'Call':<25} | {'fetchedAt':<30} | {'total':<6} | {'elapsed'}")
    print("-" * 70)
    for r in results:
        print(f"{r['label']:<25} | {r['fetchedAt']:<30} | {r['total']:<6} | {r['elapsed_ms']}ms")
    
    print("\n" + "=" * 70)
    print("ANALYSIS")
    print("=" * 70)
    print(f"t=0s vs t=5s fetchedAt: {'SAME (Cache Hit)' if r1['fetchedAt'] == r2['fetchedAt'] else 'DIFFERENT'}")
    print(f"t=0s vs t=25s fetchedAt: {'DIFFERENT (TTL Expired)' if r1['fetchedAt'] != r3['fetchedAt'] else 'SAME (TTL Not Working?)'}")
    
    if r1['fetchedAt'] == r2['fetchedAt'] and r1['fetchedAt'] != r3['fetchedAt']:
        print("\n✅ TTL VERIFICATION PASSED: Cache expires after 20 seconds as expected")
    else:
        print("\n⚠️ TTL VERIFICATION NEEDS REVIEW")

if __name__ == "__main__":
    main()
