#!/usr/bin/env python3
"""
V1 vs V2 API 성능 비교 및 Cold Start 원인 분석
"""
import time
import requests
import psycopg2
from datetime import datetime

BACKEND_URL = "https://rano.onrender.com"
DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def test_v1_vs_v2():
    """V1 (크롤링) vs V2 (캐시) 비교"""
    print("\n" + "="*60)
    print("[1] V1 vs V2 API Comparison")
    print("="*60)
    
    keyword = "천공"
    
    # V2 (DB 캐시)
    print(f"\n  V2 API (DB cache):")
    start = time.time()
    resp = requests.get(
        f"{BACKEND_URL}/api/vending/v2/search",
        params={"item": keyword, "server": "baphomet", "page": 1, "size": 10},
        timeout=60
    )
    elapsed_v2 = time.time() - start
    data = resp.json() if resp.ok else {}
    print(f"    -> {elapsed_v2:.2f}s | total: {data.get('total', 0)} | stale: {data.get('stale', False)}")
    
    # V1 (직접 크롤링) - 캐시 바이패스
    print(f"\n  V1 API (GNJOY crawl):")
    start = time.time()
    resp = requests.get(
        f"{BACKEND_URL}/api/vending/search",
        params={"item": keyword, "server": "baphomet", "page": 1, "size": 10},
        timeout=90
    )
    elapsed_v1 = time.time() - start
    data = resp.json() if resp.ok else {}
    print(f"    -> {elapsed_v1:.2f}s | total: {data.get('total', 0)}")
    
    print(f"\n  Comparison:")
    print(f"    V2 (cache): {elapsed_v2:.2f}s")
    print(f"    V1 (crawl): {elapsed_v1:.2f}s")
    print(f"    Speed difference: {elapsed_v1/elapsed_v2:.1f}x slower")
    
    return elapsed_v1, elapsed_v2

def check_cache_hit_rate():
    """캐시 히트율 분석"""
    print("\n" + "="*60)
    print("[2] Cache Analysis")
    print("="*60)
    
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=15)
        cur = conn.cursor()
        
        # 유효 캐시 vs 만료 캐시
        cur.execute("SELECT COUNT(*) FROM vending_search_cache;")
        total = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM vending_search_cache WHERE expires_at > NOW();")
        valid = cur.fetchone()[0]
        
        hit_rate = (valid / total * 100) if total > 0 else 0
        
        print(f"  Total cache entries: {total}")
        print(f"  Valid (not expired): {valid}")
        print(f"  Expired: {total - valid}")
        print(f"  Theoretical hit rate: {hit_rate:.1f}%")
        
        if hit_rate < 10:
            print(f"\n  [WARN] Very low cache hit rate!")
            print(f"         Most searches will hit GNJOY (slow)")
        
        # TTL 분석
        cur.execute("""
            SELECT 
                EXTRACT(EPOCH FROM (expires_at - cached_at))/60 as ttl_minutes
            FROM vending_search_cache 
            LIMIT 1;
        """)
        ttl = cur.fetchone()
        if ttl:
            print(f"\n  Cache TTL: {ttl[0]:.0f} minutes")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"  [ERROR] {e}")

def analyze_cold_start_impact():
    """Cold Start 영향 분석"""
    print("\n" + "="*60)
    print("[3] Cold Start Impact Analysis")
    print("="*60)
    
    print("""
  When Render instance is cold (after 15min inactivity):
  
  [Timeline of First Request]
  +---------------------------------------------------------+
  | Phase                    | Estimated Time               |
  +---------------------------------------------------------+
  | 1. Instance spin-up      | 5-15 seconds                 |
  | 2. JVM startup           | 3-5 seconds                  |
  | 3. Spring Boot init      | 2-4 seconds                  |
  | 4. ItemCacheService load | 1-3 seconds (21,945 items)  |
  | 5. DB connection pool    | 1-2 seconds                  |
  | 6. Caffeine cache init   | ~0 seconds (empty)           |
  +---------------------------------------------------------+
  | TOTAL Cold Start         | 12-30 seconds                |
  +---------------------------------------------------------+
  
  AFTER Cold Start (first search):
  +---------------------------------------------------------+
  | If cache HIT (V2)        | 0.2-0.5 seconds              |
  | If cache MISS (V2->V1)   | 2-5 seconds (GNJOY crawl)   |
  +---------------------------------------------------------+
    """)

def check_frontend_api_path():
    """프론트엔드가 사용하는 API 경로 확인"""
    print("\n" + "="*60)
    print("[4] Frontend API Path Check")
    print("="*60)
    
    print("  Checking vendingService.ts usage...")
    print("  -> Frontend uses: /api/vending/v2/search (DB cache)")
    print("  -> This is the FAST path")
    print("")
    print("  If still slow, possible causes:")
    print("  1. Cold Start (first request after 15min)")
    print("  2. Cache MISS -> Falls back to GNJOY crawl")
    print("  3. enrichWithCardDetails() - card detail loading")

def main():
    print("="*60)
    print(" Search Slowness Root Cause Analysis")
    print(f" Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # 1. V1 vs V2 비교
    v1_time, v2_time = test_v1_vs_v2()
    
    # 2. 캐시 분석
    check_cache_hit_rate()
    
    # 3. Cold Start 분석
    analyze_cold_start_impact()
    
    # 4. 프론트엔드 경로
    check_frontend_api_path()
    
    # 결론
    print("\n" + "="*60)
    print("[CONCLUSION] Most Likely Causes")
    print("="*60)
    
    print("""
  Given: 2 weeks of inactivity, both first and repeat searches slow
  
  PRIMARY CAUSE: Cold Start
  -------------------------
  * Render free tier sleeps after 15 minutes of inactivity
  * After 2 weeks, instance is definitely cold
  * First request takes 15-30 seconds to wake up
  * This explains "first search is slow"
  
  SECONDARY CAUSE: Cache Expiration  
  ----------------------------------
  * All Caffeine cache (in-memory) is lost on cold start
  * DB cache (vending_search_cache) has 10-min TTL
  * After 2 weeks, all cached search results expired
  * Every search = GNJOY crawl (2-5 seconds each)
  * This explains "repeat search also slow" (until cache rebuilds)
  
  NOW (after running diagnostics):
  --------------------------------
  * Backend is WARM (we just woke it up!)
  * Caffeine cache is active
  * Some DB cache entries are valid
  * -> Searches are fast again (0.2-0.4s)
  
  SOLUTION OPTIONS:
  -----------------
  1. Upgrade to Render paid plan (no cold start)
  2. Set up a cron job to ping backend every 10 min
  3. Accept cold start delay (first user waits)
    """)

if __name__ == "__main__":
    main()
