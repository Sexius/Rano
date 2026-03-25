#!/usr/bin/env python3
"""
검색 속도 저하 원인 진단 스크립트 (인코딩 안전 버전)
"""
import time
import requests
import psycopg2
from datetime import datetime, timedelta

# 설정
BACKEND_URL = "https://rano.onrender.com"
DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def check_backend_health():
    """백엔드 상태 확인 (Cold Start 감지)"""
    print("\n" + "="*60)
    print("[1] Backend Health Check (Cold Start Detection)")
    print("="*60)
    
    try:
        # 첫 번째 요청 (Cold Start 시 느림)
        start1 = time.time()
        resp1 = requests.get(f"{BACKEND_URL}/api/health", timeout=90)
        elapsed1 = time.time() - start1
        
        print(f"  1st Request: {elapsed1:.2f}s (status: {resp1.status_code})")
        
        if elapsed1 > 5:
            print(f"  [WARN] Cold Start Detected! (>5 seconds)")
            print(f"         -> Render free tier sleeps after 15min inactivity")
        
        # 두 번째 요청 (Warm 상태)
        time.sleep(1)
        start2 = time.time()
        resp2 = requests.get(f"{BACKEND_URL}/api/health", timeout=30)
        elapsed2 = time.time() - start2
        
        print(f"  2nd Request: {elapsed2:.2f}s (status: {resp2.status_code})")
        
        if elapsed2 < 1:
            print(f"  [OK] Warm state confirmed")
        
        return elapsed1
        
    except requests.exceptions.Timeout:
        print("  [ERROR] Timeout! Backend is sleeping or down")
        return 999
    except Exception as e:
        print(f"  [ERROR] {e}")
        return 999

def check_search_api():
    """검색 API 응답 시간 측정"""
    print("\n" + "="*60)
    print("[2] Search API Response Time")
    print("="*60)
    
    test_keyword = "chungong"  # 천공 -> ASCII safe
    
    try:
        # 1차 검색 (캐시 미스 예상)
        start1 = time.time()
        resp1 = requests.get(
            f"{BACKEND_URL}/api/vending/v2/search",
            params={"item": test_keyword, "server": "baphomet", "page": 1, "size": 10},
            timeout=90
        )
        elapsed1 = time.time() - start1
        
        data1 = resp1.json() if resp1.ok else {}
        total1 = data1.get("total", 0)
        is_stale = data1.get("stale", False)
        
        print(f"  1st Search: {elapsed1:.2f}s (results: {total1}, stale: {is_stale})")
        
        # 2차 검색 (캐시 히트 예상)
        time.sleep(0.5)
        start2 = time.time()
        resp2 = requests.get(
            f"{BACKEND_URL}/api/vending/v2/search",
            params={"item": test_keyword, "server": "baphomet", "page": 1, "size": 10},
            timeout=30
        )
        elapsed2 = time.time() - start2
        
        data2 = resp2.json() if resp2.ok else {}
        total2 = data2.get("total", 0)
        
        print(f"  2nd Search: {elapsed2:.2f}s (results: {total2})")
        
        # 분석
        if elapsed1 > 3:
            print(f"\n  [WARN] 1st search slow (cache miss + GNJOY crawl)")
        
        if elapsed2 > 1:
            print(f"  [WARN] 2nd search also slow (cache NOT working!)")
        elif elapsed2 < 0.5:
            print(f"  [OK] Cache working properly ({elapsed2:.2f}s)")
            
        return elapsed1, elapsed2
        
    except Exception as e:
        print(f"  [ERROR] {e}")
        return 999, 999

def check_db_cache_status():
    """DB 캐시 테이블 상태 확인"""
    print("\n" + "="*60)
    print("[3] DB Cache Status")
    print("="*60)
    
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=15)
        cur = conn.cursor()
        
        # 캐시 통계
        cur.execute("SELECT COUNT(*) FROM vending_search_cache;")
        total_cache = cur.fetchone()[0]
        
        # 유효한 캐시 수 (expires_at > now)
        cur.execute("SELECT COUNT(*) FROM vending_search_cache WHERE expires_at > NOW();")
        valid_cache = cur.fetchone()[0]
        
        # 만료된 캐시 수
        expired_cache = total_cache - valid_cache
        
        print(f"  Total cache entries: {total_cache}")
        print(f"  Valid cache: {valid_cache}")
        print(f"  Expired cache: {expired_cache}")
        
        if valid_cache == 0:
            print(f"\n  [WARN] No valid cache! All searches need GNJOY crawl")
        
        # 가장 최근 캐시 시간
        cur.execute("SELECT MAX(cached_at) FROM vending_search_cache;")
        last_cached = cur.fetchone()[0]
        
        if last_cached:
            print(f"\n  Last cache time: {last_cached}")
            days_ago = (datetime.now(last_cached.tzinfo) - last_cached).days
            print(f"  Days since last cache: {days_ago} days")
            if days_ago > 7:
                print(f"  [WARN] No cache update for {days_ago} days!")
        else:
            print(f"  [WARN] No cache data exists!")
        
        # vending_listings 상태
        cur.execute("SELECT COUNT(*) FROM vending_listings;")
        listings_count = cur.fetchone()[0]
        
        cur.execute("SELECT MAX(scraped_at) FROM vending_listings;")
        last_scraped = cur.fetchone()[0]
        
        print(f"\n  Vending listings: {listings_count} items")
        if last_scraped:
            print(f"  Last scraped: {last_scraped}")
        
        cur.close()
        conn.close()
        
        return valid_cache
        
    except Exception as e:
        print(f"  [ERROR] DB connection error: {e}")
        return -1

def summarize_diagnosis(health_time, search1, search2, valid_cache):
    """진단 결과 요약"""
    print("\n" + "="*60)
    print("[DIAGNOSIS SUMMARY] Root Cause Analysis")
    print("="*60)
    
    causes = []
    
    if health_time > 5:
        causes.append(("Cold Start", "Render free tier instance was sleeping", "HIGH"))
    
    if valid_cache == 0:
        causes.append(("DB Cache Expired", "vending_search_cache has 0 valid entries", "HIGH"))
    
    if search2 > 1:
        causes.append(("Caffeine Cache Inactive", "In-memory cache not working", "MEDIUM"))
    
    if search1 > 3:
        causes.append(("GNJOY Crawling", "External site response delay (normal behavior)", "LOW"))
    
    if not causes:
        print("  [OK] No significant issues found")
    else:
        print("\n  Identified Causes:")
        print("  " + "-"*50)
        for i, (cause, detail, severity) in enumerate(causes, 1):
            icon = "[!!]" if severity == "HIGH" else "[!]" if severity == "MEDIUM" else "[i]"
            print(f"  {i}. {icon} [{severity}] {cause}")
            print(f"     -> {detail}")
        print()
        
        # 주요 원인 분석
        print("  Detailed Analysis:")
        print("  " + "-"*50)
        
        if health_time > 5:
            print("""
  [!!] Cold Start Problem (PRIMARY CAUSE)
  ----------------------------------------
  * Render free tier terminates instance after 15min inactivity
  * 2 weeks unused -> Full sleep -> First request triggers restart
  * Restart sequence:
    - JVM boot: 5-15 seconds
    - Spring Boot init: 3-5 seconds  
    - ItemCacheService loading: 1-3 seconds
    - DB connection pool init: 1-2 seconds
  * Total Cold Start time: 10-25 seconds
            """)
        
        if valid_cache == 0:
            print("""
  [!!] DB Cache Expiration Problem
  ----------------------------------------
  * vending_search_cache TTL: 10 minutes
  * 2 weeks unused -> All cache expired
  * Cache miss -> Needs GNJOY real-time crawl (2-5 seconds each)
            """)
        
        if search2 > 1:
            print("""
  [!] Caffeine In-Memory Cache Inactive
  ----------------------------------------
  * Caffeine TTL: 60 seconds
  * Completely cleared on Cold Start
  * Even repeat searches have cache miss
            """)

def main():
    print("="*60)
    print(" Search Slowness Diagnosis")
    print(f" Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # 1. 백엔드 상태
    health_time = check_backend_health()
    
    # 2. 검색 API 테스트
    search1, search2 = check_search_api()
    
    # 3. DB 캐시 상태
    valid_cache = check_db_cache_status()
    
    # 4. 결론
    summarize_diagnosis(health_time, search1, search2, valid_cache)
    
    print("\n[Diagnosis Complete]")

if __name__ == "__main__":
    main()
